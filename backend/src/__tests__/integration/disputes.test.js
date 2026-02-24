jest.mock('../../config/supabase');
jest.mock('../../services/notifications.service', () => ({ send: jest.fn() }));

const request    = require('supertest');
const app        = require('../../app');
const supabase   = require('../../config/supabase');
const { makeChain } = require('../helpers/supabase.mock');
const { AppError } = require('../../utils/errors');
const { makeToken, makeAdminToken, authHeader } = require('../helpers/auth.helper');

const JOB_UUID = '00000000-0000-0000-0000-000000000001';
const JOB = { id: JOB_UUID, customer_id: 'user-001', worker_id: 'worker-001', status: 'in_progress' };

function mockFrom(tableMap) {
  supabase.from.mockImplementation((t) => makeChain(tableMap[t] ?? { data: null, error: null }));
}

describe('POST /api/v1/disputes', () => {
  beforeEach(() => jest.resetAllMocks());

  it('201 — customer raises a dispute', async () => {
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: JOB, error: null }))           // job check
      .mockImplementationOnce(() => makeChain({ data: null, error: null }))           // no existing dispute
      .mockImplementationOnce(() => makeChain({ data: { id: 'disp-1', job_id: JOB_UUID, status: 'open', raised_by: 'user-001', created_at: new Date().toISOString() }, error: null })) // insert
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))             // update job status
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }));            // notification

    const res = await request(app)
      .post('/api/v1/disputes')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, reason: 'Worker left without completing the work.' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');
  });

  it('400 — reason too short', async () => {
    const res = await request(app)
      .post('/api/v1/disputes')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, reason: 'Bad' });

    expect(res.status).toBe(400);
  });

  it('400 — invalid job_id (not UUID)', async () => {
    const res = await request(app)
      .post('/api/v1/disputes')
      .set(authHeader(makeToken()))
      .send({ job_id: 'not-a-uuid', reason: 'Worker left without completing the work.' });

    expect(res.status).toBe(400);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app)
      .post('/api/v1/disputes')
      .send({ job_id: JOB_UUID, reason: 'Something went wrong here.' });

    expect(res.status).toBe(401);
  });

  it('403 — user not party to the job', async () => {
    const otherJob = { ...JOB, customer_id: 'other-cust', worker_id: 'other-worker' };
    supabase.from.mockImplementationOnce(() => makeChain({ data: otherJob, error: null }));

    const res = await request(app)
      .post('/api/v1/disputes')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, reason: 'Worker left without completing the work.' });

    expect(res.status).toBe(403);
  });

  it('409 — dispute already exists', async () => {
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: JOB, error: null }))
      .mockImplementationOnce(() => makeChain({ data: { id: 'existing-disp' }, error: null })); // existing

    const res = await request(app)
      .post('/api/v1/disputes')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, reason: 'Worker left without completing the work.' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DISPUTE_ALREADY_EXISTS');
  });

  it('422 — job status does not allow disputes', async () => {
    const pendingJob = { ...JOB, status: 'pending' };
    supabase.from.mockImplementationOnce(() => makeChain({ data: pendingJob, error: null }));

    const res = await request(app)
      .post('/api/v1/disputes')
      .set(authHeader(makeToken()))
      .send({ job_id: JOB_UUID, reason: 'Worker left without completing the work.' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('JOB_NOT_DISPUTABLE');
  });
});

describe('PATCH /api/v1/disputes/:id (admin resolve)', () => {
  beforeEach(() => jest.resetAllMocks());

  it('200 — admin resolves a dispute', async () => {
    const DISPUTE = { id: 'disp-1', job_id: JOB_UUID, raised_by: 'user-001', status: 'open', jobs: { customer_id: 'user-001', worker_id: 'w-001' } };
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: DISPUTE, error: null }))  // fetch dispute
      .mockImplementationOnce(() => makeChain({ data: { ...DISPUTE, status: 'resolved' }, error: null })) // update
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))        // audit log
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))        // notify customer
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }));       // notify worker

    const res = await request(app)
      .patch('/api/v1/disputes/disp-1')
      .set(authHeader(makeAdminToken()))
      .send({ status: 'resolved', resolution: 'Partial refund issued.', action: 'partial_refund' });

    expect(res.status).toBe(200);
  });

  it('403 — non-admin cannot resolve', async () => {
    const res = await request(app)
      .patch('/api/v1/disputes/disp-1')
      .set(authHeader(makeToken()))
      .send({ status: 'resolved', resolution: 'Resolved.', action: 'no_action' });

    expect(res.status).toBe(403);
  });

  it('400 — missing resolution text', async () => {
    const res = await request(app)
      .patch('/api/v1/disputes/disp-1')
      .set(authHeader(makeAdminToken()))
      .send({ status: 'resolved', action: 'no_action' });

    expect(res.status).toBe(400);
  });
});
