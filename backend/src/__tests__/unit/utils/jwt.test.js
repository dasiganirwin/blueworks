const { signAccess, signRefresh, verifyAccess, verifyRefresh } = require('../../../utils/jwt');

const PAYLOAD = { sub: 'user-001', role: 'customer' };

describe('JWT utils', () => {
  describe('signAccess / verifyAccess', () => {
    it('signs and verifies an access token', () => {
      const token   = signAccess(PAYLOAD);
      const decoded = verifyAccess(token);
      expect(decoded.sub).toBe(PAYLOAD.sub);
      expect(decoded.role).toBe(PAYLOAD.role);
    });

    it('throws on tampered access token', () => {
      const token = signAccess(PAYLOAD);
      expect(() => verifyAccess(token + 'x')).toThrow();
    });

    it('throws on token signed with wrong secret', () => {
      const jwt = require('jsonwebtoken');
      const bad  = jwt.sign(PAYLOAD, 'wrong-secret', { expiresIn: '1h' });
      expect(() => verifyAccess(bad)).toThrow();
    });
  });

  describe('signRefresh / verifyRefresh', () => {
    it('signs and verifies a refresh token', () => {
      const token   = signRefresh(PAYLOAD);
      const decoded = verifyRefresh(token);
      expect(decoded.sub).toBe(PAYLOAD.sub);
    });

    it('throws on tampered refresh token', () => {
      const token = signRefresh(PAYLOAD);
      expect(() => verifyRefresh(token + 'x')).toThrow();
    });
  });

  it('access and refresh tokens are different', () => {
    expect(signAccess(PAYLOAD)).not.toBe(signRefresh(PAYLOAD));
  });
});
