const { requireRole } = require('../../../middleware/roles');

describe('requireRole middleware', () => {
  const next = jest.fn();

  beforeEach(() => next.mockClear());

  it('calls next() when user has the required role', () => {
    const req = { user: { sub: '1', role: 'admin' } };
    requireRole('admin')(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user matches one of multiple allowed roles', () => {
    const req = { user: { sub: '1', role: 'worker' } };
    requireRole('customer', 'worker')(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(FORBIDDEN) when role does not match', () => {
    const req = { user: { sub: '1', role: 'customer' } };
    requireRole('admin')(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN', statusCode: 403 }));
  });

  it('calls next(UNAUTHORIZED) when req.user is absent', () => {
    const req = {};
    requireRole('admin')(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });
});
