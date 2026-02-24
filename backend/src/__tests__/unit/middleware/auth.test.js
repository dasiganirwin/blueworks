const { authenticate } = require('../../../middleware/auth');
const { signAccess }   = require('../../../utils/jwt');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('authenticate middleware', () => {
  const validPayload = { sub: 'user-001', role: 'customer' };

  it('calls next() and sets req.user on a valid Bearer token', () => {
    const token = signAccess(validPayload);
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const next  = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(); // no error arg
    expect(req.user.sub).toBe('user-001');
    expect(req.user.role).toBe('customer');
  });

  it('calls next(error) when Authorization header is missing', () => {
    const req  = { headers: {} };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });

  it('calls next(error) when the scheme is not Bearer', () => {
    const req  = { headers: { authorization: 'Basic abc123' } };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });

  it('calls next(error) on an expired / invalid token', () => {
    const req  = { headers: { authorization: 'Bearer not.a.real.token' } };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });
});
