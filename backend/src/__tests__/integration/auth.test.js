jest.mock('../../services/auth.service');

const request     = require('supertest');
const app         = require('../../app');
const authService = require('../../services/auth.service');
const { AppError } = require('../../utils/errors');

const TOKENS = { access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, user: { id: '1', role: 'customer', name: 'Maria' } };

describe('POST /api/v1/auth/register', () => {
  it('201 — returns user and message on success', async () => {
    authService.register.mockResolvedValue({ user: TOKENS.user, message: 'OTP sent to +63917' });

    const res = await request(app).post('/api/v1/auth/register').send({
      role: 'customer', name: 'Maria Santos', phone: '+639171234567', password: 'Str0ngP@ss',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.message).toMatch(/OTP/i);
  });

  it('400 — missing required field (name)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      role: 'customer', phone: '+639171234567', password: 'Str0ngP@ss',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/name/);
  });

  it('400 — invalid role value', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      role: 'superuser', name: 'Test', phone: '+639171234567', password: 'Str0ngP@ss',
    });
    expect(res.status).toBe(400);
  });

  it('409 — phone already taken', async () => {
    authService.register.mockRejectedValue(new AppError(409, 'PHONE_TAKEN', 'Phone is already registered.'));

    const res = await request(app).post('/api/v1/auth/register').send({
      role: 'customer', name: 'Maria', phone: '+639171234567', password: 'Str0ngP@ss',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PHONE_TAKEN');
  });
});

describe('POST /api/v1/auth/otp/send', () => {
  it('200 — sends OTP', async () => {
    authService.sendOTP.mockResolvedValue({ message: 'OTP sent.', expires_in: 300 });

    const res = await request(app).post('/api/v1/auth/otp/send').send({ phone: '+639171234567' });
    expect(res.status).toBe(200);
    expect(res.body.expires_in).toBe(300);
  });

  it('400 — missing phone', async () => {
    const res = await request(app).post('/api/v1/auth/otp/send').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/otp/verify', () => {
  it('200 — returns tokens on valid OTP', async () => {
    authService.verifyOTPCode.mockResolvedValue(TOKENS);

    const res = await request(app).post('/api/v1/auth/otp/verify').send({ phone: '+639171234567', otp: '482910' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it('400 — rejects OTP not exactly 6 digits', async () => {
    const res = await request(app).post('/api/v1/auth/otp/verify').send({ phone: '+639171234567', otp: '12345' });
    expect(res.status).toBe(400);
  });

  it('400 — invalid OTP', async () => {
    authService.verifyOTPCode.mockRejectedValue(new AppError(400, 'INVALID_OTP', 'OTP is incorrect or expired.'));

    const res = await request(app).post('/api/v1/auth/otp/verify').send({ phone: '+63917', otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('200 — returns tokens on valid credentials', async () => {
    authService.login.mockResolvedValue(TOKENS);

    const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'maria@test.com', password: 'Str0ngP@ss' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ access_token: expect.any(String), refresh_token: expect.any(String), expires_in: 3600 });
  });

  it('401 — invalid credentials', async () => {
    authService.login.mockRejectedValue(new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.'));

    const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('403 — suspended account', async () => {
    authService.login.mockRejectedValue(new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended.'));

    const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'banned@test.com', password: 'pass' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('400 — missing identifier', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'pass' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/token/refresh', () => {
  it('200 — returns new access token', async () => {
    authService.refreshToken.mockResolvedValue({ access_token: 'new-token', expires_in: 3600 });

    const res = await request(app).post('/api/v1/auth/token/refresh').send({ refresh_token: 'old-refresh' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('new-token');
  });

  it('401 — invalid refresh token', async () => {
    authService.refreshToken.mockRejectedValue(new AppError(401, 'INVALID_REFRESH_TOKEN', 'Token is invalid.'));

    const res = await request(app).post('/api/v1/auth/token/refresh').send({ refresh_token: 'bad' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/password/forgot', () => {
  it('200 — always returns success (prevents email enumeration)', async () => {
    authService.forgotPassword.mockResolvedValue(undefined);

    const res = await request(app).post('/api/v1/auth/password/forgot').send({ email: 'anyone@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
  });
});

describe('POST /api/v1/auth/password/reset', () => {
  it('200 — resets password successfully', async () => {
    authService.resetPassword.mockResolvedValue(undefined);

    const res = await request(app).post('/api/v1/auth/password/reset').send({ token: 'valid-token', password: 'NewP@ss1!' });
    expect(res.status).toBe(200);
  });

  it('400 — invalid reset token', async () => {
    authService.resetPassword.mockRejectedValue(new AppError(400, 'INVALID_RESET_TOKEN', 'Token invalid.'));

    const res = await request(app).post('/api/v1/auth/password/reset').send({ token: 'bad', password: 'NewP@ss1!' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
  });
});
