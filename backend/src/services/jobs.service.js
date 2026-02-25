const supabase = require('../config/supabase');
const { AppError, Errors } = require('../utils/errors');
const { broadcast } = require('../websocket');
const notificationsService = require('./notifications.service');

// Valid transitions per role
const TRANSITIONS = {
  worker:   { pending: 'accepted', accepted: 'en_route', en_route: 'in_progress', in_progress: 'completed' },
  customer: { pending: 'cancelled', accepted: 'cancelled' },
  // Admin can force-cancel any non-final job (e.g. during dispute resolution)
  admin:    { pending: 'cancelled', accepted: 'cancelled', en_route: 'cancelled', in_progress: 'cancelled', disputed: 'cancelled' },
};

// Timestamp field per status
const STATUS_TIMESTAMPS = {
  accepted:    'accepted_at',
  en_route:    'en_route_at',
  in_progress: 'started_at',
  completed:   'completed_at',
  cancelled:   'cancelled_at',
};

async function createJob(customerId, body) {
  const { category, description, location, urgency, scheduled_at } = body;

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      customer_id:      customerId,
      category,
      description,
      location_address: location.address,
      location_lat:     location.lat,
      location_lng:     location.lng,
      urgency,
      scheduled_at,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('job_status_history').insert({
    job_id:     job.id,
    to_status:  'pending',
    changed_by: customerId,
  });

  // Notify nearby workers via WebSocket — include all fields JobCard needs
  broadcast('job.created', {
    id:               job.id,
    category:         job.category,
    description:      job.description,
    location_address: job.location_address,
    location_lat:     job.location_lat,
    location_lng:     job.location_lng,
    urgency:          job.urgency,
    status:           'pending',
    created_at:       job.created_at,
  });

  return job;
}

async function listJobs(userId, role, { status, category, page = 1, limit = 20 }) {
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (role === 'customer') query = query.eq('customer_id', userId);
  // Workers see only jobs assigned to them; they discover new pending jobs via /jobs/nearby
  if (role === 'worker')   query = query.eq('worker_id', userId);
  if (status)   query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const { data, count, error } = await query;
  if (error) throw error;

  return { data, meta: { page, limit, total: count } };
}

async function getNearbyJobs(workerId, { lat, lng, radius = 10, page = 1, limit = 20 }) {
  const delta = radius / 111;

  const { data, count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .is('worker_id', null)
    .gte('location_lat', lat - delta)
    .lte('location_lat', lat + delta)
    .gte('location_lng', lng - delta)
    .lte('location_lng', lng + delta)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return { data, meta: { page, limit, total: count } };
}

async function getJob(jobId, userId, role) {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*, job_photos(url), customer:users!customer_id(id,name), worker:users!worker_id(id,name)')
    .eq('id', jobId)
    .maybeSingle();

  if (error || !job) throw Errors.NOT_FOUND('job');

  // Scope check: non-admins can only see their own jobs
  // Exception: workers can view any pending unassigned job (to decide whether to accept)
  const isParticipant = job.customer_id === userId || job.worker_id === userId;
  const isPendingForWorker = role === 'worker' && job.status === 'pending' && !job.worker_id;
  if (role !== 'admin' && !isParticipant && !isPendingForWorker) {
    throw Errors.FORBIDDEN();
  }

  return job;
}

async function updateStatus(jobId, userId, role, newStatus) {
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job) throw Errors.NOT_FOUND('job');

  // Scope check
  if (role === 'customer' && job.customer_id !== userId) throw Errors.FORBIDDEN();
  if (role === 'worker'   && newStatus === 'accepted' && job.worker_id && job.worker_id !== userId) {
    throw Errors.JOB_ALREADY_TAKEN();
  }
  if (role === 'worker' && job.worker_id && job.worker_id !== userId) throw Errors.FORBIDDEN();

  // Validate transition
  const allowed = TRANSITIONS[role]?.[job.status];
  if (allowed !== newStatus) throw Errors.INVALID_TRANSITION();

  const tsField = STATUS_TIMESTAMPS[newStatus];
  const updates = {
    status:     newStatus,
    updated_at: new Date().toISOString(),
    [tsField]:  new Date().toISOString(),
  };

  if (newStatus === 'accepted') updates.worker_id = userId;

  const { data: updated, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    // PostgreSQL check constraint violation — surface a clear 400 instead of raw 500
    if (error.code === '23514') throw Errors.VALIDATION_ERROR('Status update not permitted in the current job state.');
    throw new AppError(500, 'DB_ERROR', error.message ?? 'Failed to update job status.');
  }

  await supabase.from('job_status_history').insert({
    job_id:      jobId,
    from_status: job.status,
    to_status:   newStatus,
    changed_by:  userId,
  });

  // If worker accepted, set worker to busy
  if (newStatus === 'accepted') {
    await supabase.from('workers').update({ availability_status: 'busy' }).eq('user_id', userId);
  }

  // If job completed, increment worker's count
  if (newStatus === 'completed') {
    await supabase.rpc('increment_completed_jobs', { worker_id: updated.worker_id });
    await supabase.from('workers').update({ availability_status: 'online' }).eq('user_id', updated.worker_id);
  }

  broadcast('job.status_changed', { job_id: jobId, status: newStatus, timestamp: updates[tsField] }, jobId);

  // Notify relevant party
  const notifyUserId = role === 'worker' ? job.customer_id : job.worker_id;
  if (notifyUserId) {
    await notificationsService.send(notifyUserId, `job_${newStatus}`, 'Job Update', `Job status changed to ${newStatus}.`, { job_id: jobId });
  }

  return updated;
}

async function uploadPhotos(jobId, userId, files) {
  if (!files?.length) throw Errors.VALIDATION_ERROR('No files uploaded.');

  const urls = [];

  for (const file of files) {
    const path = `jobs/${jobId}/${Date.now()}-${file.originalname}`;
    const { error } = await supabase.storage
      .from(process.env.STORAGE_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(process.env.STORAGE_BUCKET)
      .getPublicUrl(path);

    urls.push(publicUrl);
    await supabase.from('job_photos').insert({ job_id: jobId, url: publicUrl, uploaded_by: userId });
  }

  return { photos: urls };
}

async function deleteJob(jobId) {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  if (error) throw error;
}

async function getMessages(jobId, userId, role, { page = 1, limit = 50 }) {
  const { data: job } = await supabase.from('jobs').select('customer_id, worker_id').eq('id', jobId).maybeSingle();
  if (!job) throw Errors.NOT_FOUND('job');
  if (role !== 'admin' && job.customer_id !== userId && job.worker_id !== userId) throw Errors.FORBIDDEN();

  const { data, count, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, sent_at, users!sender_id(name)', { count: 'exact' })
    .eq('job_id', jobId)
    .order('sent_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return { data: data.map(m => ({ ...m, sender_name: m.users?.name })), meta: { page, limit, total: count } };
}

async function sendMessage(jobId, senderId, role, content) {
  const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, status').eq('id', jobId).maybeSingle();
  if (!job) throw Errors.NOT_FOUND('job');
  if (role !== 'admin' && job.customer_id !== senderId && job.worker_id !== senderId) throw Errors.FORBIDDEN();
  if (['completed', 'cancelled'].includes(job.status)) throw Errors.JOB_CLOSED();

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ job_id: jobId, sender_id: senderId, content })
    .select()
    .single();

  if (error) throw error;

  broadcast('message.received', { job_id: jobId, message }, jobId);
  return message;
}

module.exports = { createJob, listJobs, getNearbyJobs, getJob, updateStatus, uploadPhotos, deleteJob, getMessages, sendMessage };
