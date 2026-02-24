const crypto = require('crypto');
const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');
const resend = require('../config/resend');
const { sendOTPSMS } = require('../config/sms');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { generateOTP, hashOTP, verifyOTP } = require('../utils/otp');
const { Errors } = require('../utils/errors');

// ── Helpers ──────────────────────────────────────────────────

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sanitize(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

async function issueTokens(user) {
  const payload       = { sub: user.id, role: user.role };
  const access_token  = signAccess(payload);
  const refresh_token = signRefresh(payload);
  const token_hash    = hashToken(refresh_token);
  const expires_at    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('refresh_tokens').insert({ user_id: user.id, token_hash, expires_at });

  return { access_token, refresh_token, expires_in: 3600, user: sanitize(user) };
}

// ── Service methods ──────────────────────────────────────────

async function register({ role, name, email, phone, password, skills }) {
  // Duplicate checks
  const { data: byPhone } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
  if (byPhone) throw Errors.PHONE_TAKEN();

  if (email) {
    const { data: byEmail } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (byEmail) throw Errors.EMAIL_TAKEN();
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ role, name, email, phone, password_hash, status: 'pending_verification' })
    .select()
    .single();

  if (error) throw error;

  if (role === 'customer') {
    await supabase.from('customers').insert({ user_id: user.id });
  } else {
    await supabase.from('workers').insert({ user_id: user.id });
    if (skills?.length) {
      await supabase.from('worker_skills').insert(skills.map(c => ({ worker_id: user.id, category: c })));
    }
  }

  await sendOTP(phone);
  return { user: sanitize(user), message: `OTP sent to ${phone}` };
}

async function sendOTP(phone) {
  const { data: user } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
  if (!user) throw Errors.NOT_FOUND('user');

  // Purge used or expired OTP codes for this phone before inserting a new one
  await supabase.from('otp_codes')
    .delete()
    .eq('phone', phone)
    .or(`used.eq.true,expires_at.lt.${new Date().toISOString()}`);

  const otp        = generateOTP();
  const code_hash  = await hashOTP(otp);
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabase.from('otp_codes').insert({ phone, code_hash, expires_at });

  await sendOTPSMS(phone, otp);

  return { message: 'OTP sent.', expires_in: 300 };
}

async function verifyOTPCode(phone, otp) {
  const { data: record } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) throw Errors.INVALID_OTP();

  const valid = await verifyOTP(otp, record.code_hash);
  if (!valid) throw Errors.INVALID_OTP();

  await supabase.from('otp_codes').update({ used: true }).eq('id', record.id);

  const { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
  const newStatus = user.role === 'worker' ? 'pending_approval' : 'active';

  const { data: updated } = await supabase
    .from('users')
    .update({ status: newStatus })
    .eq('id', user.id)
    .select()
    .single();

  return issueTokens(updated);
}

async function login({ identifier, password }) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .maybeSingle();

  if (!user) throw Errors.INVALID_CREDENTIALS();

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw Errors.INVALID_CREDENTIALS();

  if (user.status === 'suspended')            throw Errors.ACCOUNT_SUSPENDED();
  if (user.status === 'pending_approval')     throw Errors.PENDING_APPROVAL();
  if (user.status === 'pending_verification') throw Errors.PENDING_VERIFICATION();

  return issueTokens(user);
}

async function refreshToken(token) {
  try {
    verifyRefresh(token);
  } catch {
    throw Errors.INVALID_REFRESH_TOKEN();
  }

  const token_hash = hashToken(token);
  const { data: stored } = await supabase
    .from('refresh_tokens')
    .select('*, users(*)')
    .eq('token_hash', token_hash)
    .eq('revoked', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!stored) throw Errors.INVALID_REFRESH_TOKEN();

  const access_token = signAccess({ sub: stored.users.id, role: stored.users.role });
  return { access_token, expires_in: 3600 };
}

async function logout(token) {
  const token_hash = hashToken(token);
  await supabase.from('refresh_tokens').update({ revoked: true }).eq('token_hash', token_hash);
}

async function forgotPassword(email) {
  const { data: user } = await supabase.from('users').select('id, name').eq('email', email).maybeSingle();
  if (!user) return; // Silent — don't reveal if email exists

  const token      = crypto.randomBytes(32).toString('hex');
  const token_hash = hashToken(token);
  const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await supabase.from('password_reset_tokens').insert({ user_id: user.id, token_hash, expires_at });

  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: 'Reset your BlueWork password',
    html:    `<p>Hi ${user.name},</p><p><a href="${resetUrl}">Reset your password</a> (expires in 1 hour).</p>`,
  });
}

async function resetPassword({ token, password }) {
  const token_hash = hashToken(token);
  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', token_hash)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!record) throw Errors.INVALID_RESET_TOKEN();

  const password_hash = await bcrypt.hash(password, 12);
  await supabase.from('users').update({ password_hash }).eq('id', record.user_id);
  await supabase.from('password_reset_tokens').update({ used: true }).eq('id', record.id);
}

module.exports = { register, sendOTP, verifyOTPCode, login, refreshToken, logout, forgotPassword, resetPassword };
