const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // body-parser / JSON parse errors (e.g. malformed request body)
  if (err.type === 'entity.parse.failed' || err.statusCode === 400) {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON.' },
    });
  }

  // Log unexpected errors but don't leak internals
  console.error('[error]', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}

module.exports = { errorHandler };
