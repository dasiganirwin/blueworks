const { Errors } = require('../utils/errors');

// Usage: requireRole('admin') or requireRole('customer', 'worker')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(Errors.UNAUTHORIZED());
    if (!roles.includes(req.user.role)) return next(Errors.FORBIDDEN());
    next();
  };
}

module.exports = { requireRole };
