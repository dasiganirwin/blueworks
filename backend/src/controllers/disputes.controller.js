const supabase = require('../config/supabase');
const { Errors } = require('../utils/errors');
const notificationsService = require('../services/notifications.service');

const DISPUTABLE_STATUSES = ['in_progress', 'completed'];

const createDispute = async (req, res, next) => {
  try {
    const { job_id, reason, evidence_photos } = req.body;

    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, status').eq('id', job_id).maybeSingle();
    if (!job) return next(Errors.NOT_FOUND('job'));
    if (job.customer_id !== req.user.sub && job.worker_id !== req.user.sub) return next(Errors.FORBIDDEN());
    if (!DISPUTABLE_STATUSES.includes(job.status)) return next(Errors.JOB_NOT_DISPUTABLE());

    const { data: existing } = await supabase.from('disputes').select('id').eq('job_id', job_id).maybeSingle();
    if (existing) return next(Errors.DISPUTE_ALREADY_EXISTS());

    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({ job_id, raised_by: req.user.sub, reason })
      .select()
      .single();

    if (error) throw error;

    // Update job status to disputed
    await supabase.from('jobs').update({ status: 'disputed' }).eq('id', job_id);

    // Attach evidence photos
    if (evidence_photos?.length) {
      await supabase.from('dispute_photos').insert(
        evidence_photos.map(url => ({ dispute_id: dispute.id, url, uploaded_by: req.user.sub }))
      );
    }

    // Notify admin (broadcast to admin connections via WS in production)
    await notificationsService.send(req.user.sub, 'dispute_opened', 'Dispute Opened', 'Your dispute has been submitted and is under review.', { dispute_id: dispute.id });

    res.status(201).json(dispute);
  } catch (e) { next(e); }
};

const getDispute = async (req, res, next) => {
  try {
    const { data: dispute } = await supabase
      .from('disputes')
      .select('*, dispute_photos(url, uploaded_by)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!dispute) return next(Errors.NOT_FOUND('dispute'));

    // Verify the requester is party to the job
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id').eq('id', dispute.job_id).single();
    if (req.user.role !== 'admin' && job.customer_id !== req.user.sub && job.worker_id !== req.user.sub) {
      return next(Errors.FORBIDDEN());
    }

    res.json(dispute);
  } catch (e) { next(e); }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { status, resolution, action } = req.body;
    const { data: dispute } = await supabase.from('disputes').select('*, jobs(customer_id, worker_id)').eq('id', req.params.id).maybeSingle();
    if (!dispute) return next(Errors.NOT_FOUND('dispute'));

    const { data: updated, error } = await supabase
      .from('disputes')
      .update({ status, resolution, action, resolved_by: req.user.sub, resolved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabase.from('audit_logs').insert({
      actor_id:    req.user.sub,
      action:      'dispute.resolved',
      target_type: 'dispute',
      target_id:   req.params.id,
      metadata:    { action, resolution },
    });

    // Notify both parties
    const { customer_id, worker_id } = dispute.jobs;
    await notificationsService.send(customer_id, 'dispute_resolved', 'Dispute Resolved', resolution, { dispute_id: dispute.id });
    await notificationsService.send(worker_id,   'dispute_resolved', 'Dispute Resolved', resolution, { dispute_id: dispute.id });

    res.json(updated);
  } catch (e) { next(e); }
};

module.exports = { createDispute, getDispute, resolveDispute };
