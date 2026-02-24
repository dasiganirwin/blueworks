const FAKE_MODE = process.env.USE_FAKE_OTP === 'true';

let twilioClient = null;
if (!FAKE_MODE) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendOTPSMS(phone, otp) {
  if (FAKE_MODE) {
    console.log(`[SMS DEV] OTP for ${phone} → ${otp}`);
    return;
  }
  await twilioClient.messages.create({
    body: `Your BlueWork verification code is: ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to:   phone,
  });
}

module.exports = { sendOTPSMS };
