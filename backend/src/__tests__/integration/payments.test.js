jest.mock('../../services/payments.service');

const request          = require('supertest');
const app              = require('../../app');
const paymentsService  = require('../../services/payments.service');
const { AppError }     = require('../../utils/errors');
const { makeToken, makeWorkerToken, makeAdminToken, authHeader } = require('../helpers/auth.helper');

const JOB_UUID = '00000000-0000-0000-0000-000000000001';

const PAYMENT = {
  id: 'pay-001', job_id: JOB_UUID, method: 'card', amount: 850,
  currency: 'PHP', status: 'pending', payment_url: 'https://checkout.stripe.com/pay/cs_test_abc',
};

describe('POST /api/v1/payments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 — customer initiates card payment', async () => {
    paymentsService.initiatePayment.mockResolvedValue(PAYMENT);

    const res = await request(app)
      .post('/api/v1/payments')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, method: 'card', amount: 850, currency: 'PHP' });

    expect(res.status).toBe(201);
    expect(res.body.method).toBe('card');
  });

  it('400 — missing job_id', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set(authHeader(makeToken()))
      .send({ method: 'card', amount: 850 });

    expect(res.status).toBe(400);
  });

  it('400 — invalid method (gcash removed from MVP)', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, method: 'gcash', amount: 850 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — invalid method (bitcoin)', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, method: 'bitcoin', amount: 850 });

    expect(res.status).toBe(400);
  });

  it('400 — job not yet completed', async () => {
    paymentsService.initiatePayment.mockRejectedValue(new AppError(400, 'JOB_NOT_COMPLETED', 'Job must be completed.'));

    const res = await request(app)
      .post('/api/v1/payments')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, method: 'card', amount: 850, currency: 'PHP' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('JOB_NOT_COMPLETED');
  });

  it('409 — already paid', async () => {
    paymentsService.initiatePayment.mockRejectedValue(new AppError(409, 'ALREADY_PAID', 'Already paid.'));

    const res = await request(app)
      .post('/api/v1/payments')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, method: 'cash', amount: 850, currency: 'PHP' });

    expect(res.status).toBe(409);
  });

  it('403 — worker cannot initiate payment', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set(authHeader(makeWorkerToken()))
      .send({ job_id: JOB_UUID, method: 'card', amount: 850, currency: 'PHP' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/payments/:id', () => {
  it('200 — returns payment details', async () => {
    paymentsService.getPayment.mockResolvedValue(PAYMENT);

    const res = await request(app).get('/api/v1/payments/pay-001').set(authHeader(makeToken()));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('pay-001');
  });

  it('404 — payment not found', async () => {
    paymentsService.getPayment.mockRejectedValue(new AppError(404, 'PAYMENT_NOT_FOUND', 'Not found.'));

    const res = await request(app).get('/api/v1/payments/bad-id').set(authHeader(makeToken()));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/payments/:id/cash-confirm', () => {
  it('200 — worker confirms cash receipt', async () => {
    paymentsService.cashConfirm.mockResolvedValue({ status: 'completed', confirmed_at: new Date().toISOString() });

    const res = await request(app)
      .post('/api/v1/payments/pay-001/cash-confirm')
      .set(authHeader(makeWorkerToken()));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('400 — not a cash payment', async () => {
    paymentsService.cashConfirm.mockRejectedValue(new AppError(400, 'NOT_CASH_PAYMENT', 'Not cash.'));

    const res = await request(app)
      .post('/api/v1/payments/pay-001/cash-confirm')
      .set(authHeader(makeWorkerToken()));

    expect(res.status).toBe(400);
  });

  it('403 — customer cannot confirm cash', async () => {
    const res = await request(app)
      .post('/api/v1/payments/pay-001/cash-confirm')
      .set(authHeader(makeToken()));

    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/payments/:id/refund', () => {
  it('200 — admin issues a refund', async () => {
    paymentsService.refund.mockResolvedValue({ refund_id: 'ref-001', amount: 850, status: 'processing', estimated_return: '3-5 business days' });

    const res = await request(app)
      .post('/api/v1/payments/pay-001/refund')
      .set(authHeader(makeAdminToken()))
      .send({ amount: 850, reason: 'Worker did not complete the job.' });

    expect(res.status).toBe(200);
    expect(res.body.refund_id).toBe('ref-001');
  });

  it('400 — missing reason', async () => {
    const res = await request(app)
      .post('/api/v1/payments/pay-001/refund')
      .set(authHeader(makeAdminToken()))
      .send({ amount: 850 });

    expect(res.status).toBe(400);
  });

  it('403 — non-admin cannot refund', async () => {
    const res = await request(app)
      .post('/api/v1/payments/pay-001/refund')
      .set(authHeader(makeToken()))
      .send({ amount: 850, reason: 'Not satisfied.' });

    expect(res.status).toBe(403);
  });
});
