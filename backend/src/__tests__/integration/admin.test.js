jest.mock('../../config/supabase');
jest.mock('../../services/notifications.service', () => ({ send: jest.fn() }));

const request  = require('supertest');
const app      = require('../../app');
const supabase = require('../../config/supabase');
const { makeChain } = require('../helpers/supabase.mock');
const { makeToken, makeWorkerToken, makeAdminToken, authHeader } = require('../helpers/auth.helper');

function mockFrom(tableMap) {
  supabase.from.mockImplementation((t) => makeChain(tableMap[t] ?? { data: null, error: null }));
}

const WORKER_USER = { id: 'w-001', role: 'worker', name: 'Pedro', phone: '+639171234567', status: 'pending_approval' };

describe('GET /api/v1/admin/workers', () => {
  beforeEach(() => jest.resetAllMocks());

  it('200 — admin lists pending workers', async () => {
    mockFrom({ users: { data: [WORKER_USER], count: 1, error: null } });

    const res = await request(app)
      .get('/api/v1/admin/workers')
      .query({ status: 'pending_approval' })
      .set(authHeader(makeAdminToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/v1/admin/workers');
    expect(res.status).toBe(401);
  });

  it('403 — customer cannot access admin routes', async () => {
    const res = await request(app).get('/api/v1/admin/workers').set(authHeader(makeToken()));
    expect(res.status).toBe(403);
  });

  it('403 — worker cannot access admin routes', async () => {
    const res = await request(app).get('/api/v1/admin/workers').set(authHeader(makeWorkerToken()));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/workers/:id', () => {
  beforeEach(() => jest.resetAllMocks());

  it('200 — admin approves a worker', async () => {
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: WORKER_USER, error: null }))                     // user check
      .mockImplementationOnce(() => makeChain({ data: { ...WORKER_USER, status: 'active' }, error: null })) // update user
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))                               // update worker approved_by
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))                               // audit log
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }));                              // notification

    const res = await request(app)
      .patch('/api/v1/admin/workers/w-001')
      .set(authHeader(makeAdminToken()))
      .send({ status: 'active' });

    expect(res.status).toBe(200);
  });

  it('200 — admin suspends a worker', async () => {
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: WORKER_USER, error: null }))
      .mockImplementationOnce(() => makeChain({ data: { ...WORKER_USER, status: 'suspended' }, error: null }))
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }));

    const res = await request(app)
      .patch('/api/v1/admin/workers/w-001')
      .set(authHeader(makeAdminToken()))
      .send({ status: 'suspended', note: 'Failed background check.' });

    expect(res.status).toBe(200);
  });

  it('400 — invalid status value', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/workers/w-001')
      .set(authHeader(makeAdminToken()))
      .send({ status: 'fired' });

    expect(res.status).toBe(400);
  });

  it('404 — worker not found', async () => {
    supabase.from.mockImplementationOnce(() => makeChain({ data: null, error: null }));

    const res = await request(app)
      .patch('/api/v1/admin/workers/nonexistent')
      .set(authHeader(makeAdminToken()))
      .send({ status: 'active' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/admin/analytics', () => {
  beforeEach(() => jest.resetAllMocks());

  it('200 — returns analytics payload', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: [], count: 0, error: null }));

    const res = await request(app).get('/api/v1/admin/analytics').set(authHeader(makeAdminToken()));
    expect(res.status).toBe(200);
    expect(res.body.jobs).toBeDefined();
    expect(res.body.users).toBeDefined();
    expect(res.body.payments).toBeDefined();
  });

  it('200 — accepts date range query params', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: [], count: 0, error: null }));

    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .query({ from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' })
      .set(authHeader(makeAdminToken()));

    expect(res.status).toBe(200);
  });
});
