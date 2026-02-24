const { z } = require('zod');
const { validate, validateQuery } = require('../../../middleware/validate');

function run(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (err) => resolve(err));
  });
}

const schema = z.object({ name: z.string().min(1), age: z.number() });

describe('validate middleware (body)', () => {
  it('calls next() and replaces req.body with parsed data on valid input', async () => {
    const req = { body: { name: 'Pedro', age: 30 } };
    const err = await run(validate(schema), req);
    expect(err).toBeUndefined();
    expect(req.body).toEqual({ name: 'Pedro', age: 30 });
  });

  it('calls next(VALIDATION_ERROR) when required field is missing', async () => {
    const req = { body: { name: 'Pedro' } }; // age missing
    const err = await run(validate(schema), req);
    expect(err).toBeDefined();
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/age/);
  });

  it('includes all field errors in the message', async () => {
    const req = { body: {} }; // both fields missing
    const err = await run(validate(schema), req);
    expect(err.message).toMatch(/name/);
    expect(err.message).toMatch(/age/);
  });
});

describe('validateQuery middleware', () => {
  const qSchema = z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(20) });

  it('parses and coerces query string numbers', async () => {
    const req = { query: { page: '2', limit: '10' } };
    const err = await run(validateQuery(qSchema), req);
    expect(err).toBeUndefined();
    expect(req.query.page).toBe(2);
    expect(req.query.limit).toBe(10);
  });

  it('applies defaults for missing optional query params', async () => {
    const req = { query: {} };
    await run(validateQuery(qSchema), req);
    expect(req.query.page).toBe(1);
    expect(req.query.limit).toBe(20);
  });
});
