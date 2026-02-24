jest.mock('../../config/supabase');

const request  = require('supertest');
const app      = require('../../app');
const supabase = require('../../config/supabase');
const { makeChain } = require('../helpers/supabase.mock');
const { makeToken, authHeader } = require('../helpers/auth.helper');

const NOTIF = {
  id: 'notif-001', user_id: 'user-001', type: 'job_accepted',
  title: 'Worker on the way', body: 'Pedro accepted your job.',
  payload: { job_id: 'job-001' }, read: false,
  created_at: new Date().toISOString(),
};

describe('GET /api/v1/notifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns unread notifications', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: [NOTIF], count: 1, error: null }));

    const res = await request(app)
      .get('/api/v1/notifications')
      .query({ read: 'false' })
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('200 — returns all notifications without filter', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: [NOTIF], count: 1, error: null }));

    const res = await request(app).get('/api/v1/notifications').set(authHeader(makeToken()));
    expect(res.status).toBe(200);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/notifications/:id/read', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — marks notification as read', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: { ...NOTIF, read: true }, error: null }));

    const res = await request(app)
      .patch('/api/v1/notifications/notif-001/read')
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).patch('/api/v1/notifications/notif-001/read');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/notifications/read-all', () => {
  it('200 — marks all as read', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: [], count: 3, error: null }));

    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.marked_read).toBeDefined();
  });
});
