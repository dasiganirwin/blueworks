jest.mock('../../../config/supabase');
jest.mock('../../../config/stripe');
jest.mock('../../../websocket', () => ({ broadcast: jest.fn() }));
jest.mock('../../../services/notifications.service', () => ({ send: jest.fn() }));

const supabase = require('../../../config/supabase');
const stripe   = require('../../../config/stripe');
const { makeChain } = require('../../helpers/supabase.mock');
const paymentsService = require('../../../services/payments.service');

const COMPLETED_JOB = { id: 'job-001', customer_id: 'cust-001', worker_id: 'w-001', status: 'completed' };
const PENDING_JOB   = { id: 'job-002', customer_id: 'cust-001', worker_id: 'w-001', status: 'in_progress' };

describe('paymentsService.initiatePayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws JOB_NOT_FOUND when job does not exist', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: null, error: null }));

    await expect(paymentsService.initiatePayment('cust-001', 'customer', { job_id: 'bad', method: 'cash', amount: 100, currency: 'PHP' }))
      .rejects.toMatchObject({ code: 'JOB_NOT_FOUND' });
  });

  it('throws JOB_NOT_COMPLETED when job is not yet complete', async () => {
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: PENDING_JOB, error: null }));

    await expect(paymentsService.initiatePayment('cust-001', 'customer', { job_id: 'job-002', method: 'cash', amount: 100, currency: 'PHP' }))
      .rejects.toMatchObject({ code: 'JOB_NOT_COMPLETED' });
  });

  it('throws ALREADY_PAID when payment is already completed', async () => {
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: COMPLETED_JOB, error: null }))             // job fetch
      .mockImplementationOnce(() => makeChain({ data: { id: 'pay-1', status: 'completed' }, error: null })); // existing payment

    await expect(paymentsService.initiatePayment('cust-001', 'customer', { job_id: 'job-001', method: 'gcash', amount: 850, currency: 'PHP' }))
      .rejects.toMatchObject({ code: 'ALREADY_PAID' });
  });

  it('creates a cash payment without calling Stripe', async () => {
    const paymentRow = { id: 'pay-2', job_id: 'job-001', method: 'cash', amount: 850, status: 'pending', payment_url: null };
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: COMPLETED_JOB, error: null })) // job
      .mockImplementationOnce(() => makeChain({ data: null, error: null }))           // no existing payment
      .mockImplementationOnce(() => makeChain({ data: paymentRow, error: null }));    // upsert

    const result = await paymentsService.initiatePayment('cust-001', 'customer', { job_id: 'job-001', method: 'cash', amount: 850, currency: 'PHP' });

    expect(result.method).toBe('cash');
    expect(result.payment_url).toBeNull();
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('calls Stripe when method is card', async () => {
    stripe.checkout = {
      sessions: { create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test', id: 'cs_test_123' }) },
    };
    const paymentRow = { id: 'pay-3', method: 'card', amount: 850, payment_url: 'https://checkout.stripe.com/test', status: 'pending' };
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: COMPLETED_JOB, error: null }))
      .mockImplementationOnce(() => makeChain({ data: null, error: null }))
      .mockImplementationOnce(() => makeChain({ data: paymentRow, error: null }));

    const result = await paymentsService.initiatePayment('cust-001', 'customer', { job_id: 'job-001', method: 'card', amount: 850, currency: 'PHP' });

    expect(stripe.checkout.sessions.create).toHaveBeenCalled();
    expect(result.payment_url).toContain('stripe.com');
  });
});

describe('paymentsService.cashConfirm', () => {
  beforeEach(() => jest.resetAllMocks());

  it('throws NOT_FOUND when payment does not exist', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: null, error: null }));
    await expect(paymentsService.cashConfirm('pay-x', 'w-001'))
      .rejects.toMatchObject({ code: 'PAYMENT_NOT_FOUND' });
  });

  it('throws FORBIDDEN when the worker does not own the payment', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: { id: 'pay-1', worker_id: 'other-worker', method: 'cash' }, error: null }));
    await expect(paymentsService.cashConfirm('pay-1', 'w-001'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('throws NOT_CASH_PAYMENT when method is card', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: { id: 'pay-1', worker_id: 'w-001', method: 'card' }, error: null }));
    await expect(paymentsService.cashConfirm('pay-1', 'w-001'))
      .rejects.toMatchObject({ code: 'NOT_CASH_PAYMENT' });
  });
});
