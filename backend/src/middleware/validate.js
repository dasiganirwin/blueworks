const { Errors } = require('../utils/errors');

// validate(zodSchema) — validates req.body and replaces it with parsed data
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.errors
        .map((e) => `${e.path.join('.') || 'body'}: ${e.message}`)
        .join('; ');
      return next(Errors.VALIDATION_ERROR(msg));
    }
    req.body = result.data;
    next();
  };
}

// validateQuery(zodSchema) — validates req.query
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const msg = result.error.errors
        .map((e) => `${e.path.join('.') || 'query'}: ${e.message}`)
        .join('; ');
      return next(Errors.VALIDATION_ERROR(msg));
    }
    req.query = result.data;
    next();
  };
}

module.exports = { validate, validateQuery };
