const { generateOTP, hashOTP, verifyOTP } = require('../../../utils/otp');

describe('OTP utils', () => {
  describe('generateOTP', () => {
    it('returns a 6-character numeric string', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('generates different values on successive calls', () => {
      const otps = new Set(Array.from({ length: 20 }, generateOTP));
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  describe('hashOTP / verifyOTP', () => {
    it('verifies a correct OTP against its hash', async () => {
      const otp  = generateOTP();
      const hash = await hashOTP(otp);
      await expect(verifyOTP(otp, hash)).resolves.toBe(true);
    });

    it('rejects an incorrect OTP', async () => {
      const hash = await hashOTP('123456');
      await expect(verifyOTP('999999', hash)).resolves.toBe(false);
    });

    it('does not store the OTP in plaintext in the hash', async () => {
      const otp  = '482910';
      const hash = await hashOTP(otp);
      expect(hash).not.toContain(otp);
    });
  });
});
