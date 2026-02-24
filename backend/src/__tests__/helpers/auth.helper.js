const { signAccess, signRefresh } = require('../../utils/jwt');

function makeToken(overrides = {}) {
  return signAccess({ sub: 'user-001', role: 'customer', ...overrides });
}

function makeWorkerToken(overrides = {}) {
  return signAccess({ sub: 'worker-001', role: 'worker', ...overrides });
}

function makeAdminToken(overrides = {}) {
  return signAccess({ sub: 'admin-001', role: 'admin', ...overrides });
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { makeToken, makeWorkerToken, makeAdminToken, authHeader };
