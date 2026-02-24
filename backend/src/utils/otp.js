const crypto = require('crypto');
const bcrypt = require('bcrypt');

function generateOTP() {
  // TODO: Replace with real SMS provider — using fixed OTP for dev
  if (process.env.USE_FAKE_OTP === 'true') return '123456';
  return crypto.randomInt(100000, 999999).toString();
}

async function hashOTP(otp) {
  return bcrypt.hash(otp, 10);
}

async function verifyOTP(otp, hash) {
  return bcrypt.compare(otp, hash);
}

module.exports = { generateOTP, hashOTP, verifyOTP };
