const supabase = require('../config/supabase');
const { Errors } = require('../utils/errors');

async function submitRating(jobId, raterId, raterRole, { rating, comment }) {
  const { data: job } = await supabase
    .from('jobs')
    .select('status, customer_id, worker_id')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) throw Errors.NOT_FOUND('job');
  if (job.status !== 'completed') throw Errors.JOB_NOT_COMPLETED();

  let rateeId;
  if (raterRole === 'customer' && job.customer_id === raterId) {
    rateeId = job.worker_id;
  } else if (raterRole === 'worker' && job.worker_id === raterId) {
    rateeId = job.customer_id;
  } else {
    throw Errors.FORBIDDEN();
  }

  if (!rateeId) throw Errors.NOT_FOUND('ratee');

  const { data, error } = await supabase
    .from('ratings')
    .insert({ job_id: jobId, rater_id: raterId, ratee_id: rateeId, rating, comment: comment || null })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw Errors.ALREADY_RATED();
    throw error;
  }

  return data;
}

async function getMyRating(jobId, raterId) {
  const { data } = await supabase
    .from('ratings')
    .select('rating, comment')
    .eq('job_id', jobId)
    .eq('rater_id', raterId)
    .maybeSingle();
  return data ?? null;
}

module.exports = { submitRating, getMyRating };
