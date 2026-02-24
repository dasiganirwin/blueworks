const supabase = require('../config/supabase');

async function send(userId, type, title, body, payload = {}) {
  const { error } = await supabase.from('notifications').insert({ user_id: userId, type, title, body, payload });
  if (error) console.error('[notifications] insert error:', error);

  // TODO: push via FCM / APNs using device_tokens
  // const { data: devices } = await supabase.from('device_tokens').select('token, platform').eq('user_id', userId);
  // for (const device of devices) { await pushToDevice(device, { title, body }); }
}

async function list(userId, { read, page = 1, limit = 20 }) {
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (read !== undefined) query = query.eq('read', read === 'true');

  const { data, count, error } = await query;
  if (error) throw error;
  return { data, meta: { page, limit, total: count } };
}

async function markRead(notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new Error('Notification not found.');
  return data;
}

async function markAllRead(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false)
    .select('id', { count: 'exact' });

  if (error) throw error;
  return { marked_read: count ?? 0 };
}

module.exports = { send, list, markRead, markAllRead };
