const { verifyAccess } = require('../utils/jwt');
const { Errors } = require('../utils/errors');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(Errors.UNAUTHORIZED());

  const token = header.split(' ')[1];
  try {
    req.user = verifyAccess(token); // { sub, role, iat, exp }
    next();
  } catch {
    next(Errors.UNAUTHORIZED());
  }
}

module.exports = { authenticate };
