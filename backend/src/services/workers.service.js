const supabase = require('../config/supabase');
const { Errors } = require('../utils/errors');

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getNearby({ lat, lng, category, radius = 10 }) {
  // Bounding box pre-filter (1 degree ≈ 111 km)
  const delta = radius / 111;
  const { data: workers, error } = await supabase
    .from('workers')
    .select('user_id, current_lat, current_lng, rating, completed_jobs_count, users(name), worker_skills(category)')
    .eq('availability_status', 'online')
    .not('current_lat', 'is', null)
    .gte('current_lat', lat - delta)
    .lte('current_lat', lat + delta)
    .gte('current_lng', lng - delta)
    .lte('current_lng', lng + delta);

  if (error) throw error;

  const results = workers
    .filter(w => w.worker_skills.some(s => s.category === category))
    .map(w => ({
      id:                  w.user_id,
      name:                w.users?.name,
      category,
      distance_km:         +haversine(lat, lng, w.current_lat, w.current_lng).toFixed(2),
      rating:              w.rating,
      completed_jobs:      w.completed_jobs_count,
      availability_status: 'online',
    }))
    .filter(w => w.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  if (!results.length) throw Errors.NO_WORKERS_AVAILABLE();
  return { data: results };
}

async function getWorkerById(id) {
  const { data, error } = await supabase
    .from('workers')
    .select('user_id, availability_status, rating, completed_jobs_count, worker_skills(category), users(name)')
    .eq('user_id', id)
    .maybeSingle();

  if (error || !data) throw Errors.NOT_FOUND('worker');

  return {
    id:                  data.user_id,
    name:                data.users?.name,
    skills:              data.worker_skills.map(s => s.category),
    rating:              data.rating,
    completed_jobs:      data.completed_jobs_count,
    availability_status: data.availability_status,
  };
}

async function updateAvailability(workerId, status) {
  const { error } = await supabase
    .from('workers')
    .update({ availability_status: status })
    .eq('user_id', workerId);

  if (error) throw error;
  return { availability_status: status };
}

async function updateLocation(workerId, lat, lng) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('workers')
    .update({ current_lat: lat, current_lng: lng, location_updated_at: now })
    .eq('user_id', workerId);

  if (error) throw error;

  // Log for active-job tracking
  await supabase.from('worker_location_logs').insert({ worker_id: workerId, lat, lng });

  return { updated_at: now };
}

async function getEarnings(workerId, { from, to, page = 1, limit = 20 }) {
  let query = supabase
    .from('payments')
    .select('id, job_id, amount, method, paid_at', { count: 'exact' })
    .eq('worker_id', workerId)
    .eq('status', 'completed')
    .order('paid_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (from) query = query.gte('paid_at', from);
  if (to)   query = query.lte('paid_at', to);

  const { data, count, error } = await query;
  if (error) throw error;

  const total_earned = data.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    summary: { total_earned, currency: 'PHP' },
    data,
    meta: { page, limit, total: count },
  };
}

module.exports = { getNearby, getWorkerById, updateAvailability, updateLocation, getEarnings };
