const supabase = require('../config/supabase');
const { Errors } = require('../utils/errors');
const notificationsService = require('../services/notifications.service');

const listWorkers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = supabase
      .from('users')
      .select('id, name, email, phone, status, created_at, workers(rating, completed_jobs_count, approved_at)', { count: 'exact' })
      .eq('role', 'worker')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ data, meta: { page: +page, limit: +limit, total: count } });
  } catch (e) { next(e); }
};

const updateWorker = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const { data: user } = await supabase.from('users').select('id, role').eq('id', req.params.id).maybeSingle();
    if (!user || user.role !== 'worker') return next(Errors.NOT_FOUND('worker'));

    const updates = { status };

    const { data: updated, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;

    if (status === 'active') {
      await supabase.from('workers').update({ approved_by: req.user.sub, approved_at: new Date().toISOString() }).eq('user_id', req.params.id);
    }

    await supabase.from('audit_logs').insert({
      actor_id:    req.user.sub,
      action:      `worker.${status}`,
      target_type: 'user',
      target_id:   req.params.id,
      metadata:    { note },
    });

    const notifType = status === 'active' ? 'worker_approved' : 'worker_suspended';
    const notifMsg  = status === 'active' ? 'Your account has been approved. You can now accept jobs!' : `Your account has been suspended. Reason: ${note ?? 'N/A'}`;
    await notificationsService.send(req.params.id, notifType, status === 'active' ? 'Account Approved' : 'Account Suspended', notifMsg, {});

    res.json(updated);
  } catch (e) { next(e); }
};

const updateUser = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const { data: updated, error } = await supabase.from('users').update({ status }).eq('id', req.params.id).select().single();
    if (error || !updated) return next(Errors.NOT_FOUND('user'));

    await supabase.from('audit_logs').insert({
      actor_id:    req.user.sub,
      action:      `user.${status}`,
      target_type: 'user',
      target_id:   req.params.id,
      metadata:    { note },
    });

    res.json(updated);
  } catch (e) { next(e); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    // Jobs stats
    let jobsQuery = supabase.from('jobs').select('status', { count: 'exact' });
    if (from) jobsQuery = jobsQuery.gte('created_at', from);
    if (to)   jobsQuery = jobsQuery.lte('created_at', to);

    const [
      { data: allJobs },
      { count: activeCustomers },
      { count: activeWorkers },
      { count: newUsers },
      { data: payments },
    ] = await Promise.all([
      jobsQuery,
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'worker').eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', from ?? new Date(0).toISOString()),
      supabase.from('payments').select('amount, status').eq('status', 'completed'),
    ]);

    const jobs = allJobs ?? [];
    const total     = jobs.length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const cancelled = jobs.filter(j => j.status === 'cancelled').length;
    const disputed  = jobs.filter(j => j.status === 'disputed').length;
    const totalVolume = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      period: { from, to },
      jobs: {
        total,
        completed,
        cancelled,
        disputed,
        completion_rate: total > 0 ? +(completed / total).toFixed(3) : 0,
      },
      users: {
        active_customers:  activeCustomers ?? 0,
        active_workers:    activeWorkers ?? 0,
        new_registrations: newUsers ?? 0,
      },
      payments: {
        total_volume:  totalVolume,
        currency:      'PHP',
        success_rate:  payments?.length ? 1 : 0,
      },
    });
  } catch (e) { next(e); }
};

const listPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = supabase
      .from('payments')
      .select(
        'id, job_id, method, amount, currency, status, paid_at, created_at, customer:users!customer_id(name), worker:users!worker_id(name)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ data, meta: { page: +page, limit: +limit, total: count } });
  } catch (e) { next(e); }
};

module.exports = { listWorkers, updateWorker, updateUser, getAnalytics, listPayments };
