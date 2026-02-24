const supabase = require('../config/supabase');
const { Errors } = require('../utils/errors');

function sanitize(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

const getMe = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.user.sub).single();
    if (error || !data) return next(Errors.NOT_FOUND('user'));
    res.json(sanitize(data));
  } catch (e) { next(e); }
};

const updateMe = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    if (email) {
      const { data: taken } = await supabase.from('users').select('id').eq('email', email).neq('id', req.user.sub).maybeSingle();
      if (taken) return next(Errors.EMAIL_TAKEN());
    }
    if (phone) {
      const { data: taken } = await supabase.from('users').select('id').eq('phone', phone).neq('id', req.user.sub).maybeSingle();
      if (taken) return next(Errors.PHONE_TAKEN());
    }
    const { data, error } = await supabase.from('users').update(req.body).eq('id', req.user.sub).select().single();
    if (error) throw error;
    res.json(sanitize(data));
  } catch (e) { next(e); }
};

const deleteMe = async (req, res, next) => {
  try {
    await supabase.from('users').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', req.user.sub);
    res.json({ message: 'Account deletion request submitted.' });
  } catch (e) { next(e); }
};

const listUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    let query = supabase.from('users').select('id, role, name, email, phone, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (role)   query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ data, meta: { page: +page, limit: +limit, total: count } });
  } catch (e) { next(e); }
};

const getUserById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).maybeSingle();
    if (error || !data) return next(Errors.NOT_FOUND('user'));
    res.json(sanitize(data));
  } catch (e) { next(e); }
};

module.exports = { getMe, updateMe, deleteMe, listUsers, getUserById };
