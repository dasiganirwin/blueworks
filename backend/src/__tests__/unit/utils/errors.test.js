const { AppError, Errors } = require('../../../utils/errors');

describe('AppError', () => {
  it('is an instance of Error', () => {
    const err = new AppError(400, 'TEST', 'test message');
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('TEST');
    expect(err.message).toBe('test message');
  });
});

describe('Errors factory', () => {
  const cases = [
    ['VALIDATION_ERROR',      () => Errors.VALIDATION_ERROR('bad input'), 400, 'VALIDATION_ERROR'],
    ['INVALID_OTP',           () => Errors.INVALID_OTP(),                 400, 'INVALID_OTP'],
    ['INVALID_TRANSITION',    () => Errors.INVALID_TRANSITION(),          400, 'INVALID_TRANSITION'],
    ['JOB_NOT_COMPLETED',     () => Errors.JOB_NOT_COMPLETED(),           400, 'JOB_NOT_COMPLETED'],
    ['NOT_CASH_PAYMENT',      () => Errors.NOT_CASH_PAYMENT(),            400, 'NOT_CASH_PAYMENT'],
    ['UNAUTHORIZED',          () => Errors.UNAUTHORIZED(),                401, 'UNAUTHORIZED'],
    ['INVALID_CREDENTIALS',   () => Errors.INVALID_CREDENTIALS(),         401, 'INVALID_CREDENTIALS'],
    ['INVALID_REFRESH_TOKEN', () => Errors.INVALID_REFRESH_TOKEN(),       401, 'INVALID_REFRESH_TOKEN'],
    ['ACCOUNT_SUSPENDED',     () => Errors.ACCOUNT_SUSPENDED(),           403, 'ACCOUNT_SUSPENDED'],
    ['PENDING_APPROVAL',      () => Errors.PENDING_APPROVAL(),            403, 'PENDING_APPROVAL'],
    ['FORBIDDEN',             () => Errors.FORBIDDEN(),                   403, 'FORBIDDEN'],
    ['NOT_FOUND',             () => Errors.NOT_FOUND('job'),              404, 'JOB_NOT_FOUND'],
    ['NO_WORKERS_AVAILABLE',  () => Errors.NO_WORKERS_AVAILABLE(),        404, 'NO_WORKERS_AVAILABLE'],
    ['EMAIL_TAKEN',           () => Errors.EMAIL_TAKEN(),                 409, 'EMAIL_TAKEN'],
    ['PHONE_TAKEN',           () => Errors.PHONE_TAKEN(),                 409, 'PHONE_TAKEN'],
    ['ALREADY_PAID',          () => Errors.ALREADY_PAID(),                409, 'ALREADY_PAID'],
    ['JOB_ALREADY_TAKEN',     () => Errors.JOB_ALREADY_TAKEN(),          409, 'JOB_ALREADY_TAKEN'],
    ['DISPUTE_ALREADY_EXISTS',() => Errors.DISPUTE_ALREADY_EXISTS(),      409, 'DISPUTE_ALREADY_EXISTS'],
    ['JOB_NOT_DISPUTABLE',    () => Errors.JOB_NOT_DISPUTABLE(),          422, 'JOB_NOT_DISPUTABLE'],
    ['JOB_CLOSED',            () => Errors.JOB_CLOSED(),                  422, 'JOB_CLOSED'],
    ['RATE_LIMITED',          () => Errors.RATE_LIMITED(),                429, 'RATE_LIMITED'],
  ];

  test.each(cases)('%s has correct statusCode and code', (_, factory, status, code) => {
    const err = factory();
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(status);
    expect(err.code).toBe(code);
    expect(typeof err.message).toBe('string');
  });

  it('VALIDATION_ERROR includes the provided message', () => {
    const err = Errors.VALIDATION_ERROR('name is required');
    expect(err.message).toBe('name is required');
  });

  it('NOT_FOUND uppercases the resource name', () => {
    const err = Errors.NOT_FOUND('worker');
    expect(err.code).toBe('WORKER_NOT_FOUND');
    expect(err.message).toMatch(/worker/i);
  });
});
