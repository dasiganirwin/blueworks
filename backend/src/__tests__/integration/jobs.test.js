jest.mock('../../services/jobs.service');
jest.mock('../../services/notifications.service', () => ({ send: jest.fn() }));
jest.mock('../../websocket', () => ({ broadcast: jest.fn(), initWebSocket: jest.fn() }));

const request     = require('supertest');
const app         = require('../../app');
const jobsService = require('../../services/jobs.service');
const { AppError } = require('../../utils/errors');
const { makeToken, makeWorkerToken, makeAdminToken, authHeader } = require('../helpers/auth.helper');

const JOB = {
  id: 'job-001', category: 'plumber', description: 'Fix leaking pipe',
  location_address: '123 Rizal St', location_lat: 14.5995, location_lng: 120.9842,
  status: 'pending', urgency: 'immediate', customer_id: 'user-001',
  created_at: new Date().toISOString(),
};

describe('POST /api/v1/jobs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 — customer creates a job', async () => {
    jobsService.createJob.mockResolvedValue(JOB);

    const res = await request(app)
      .post('/api/v1/jobs')
      .set(authHeader(makeToken()))
      .send({
        category: 'plumber', description: 'Fix leaking pipe under sink',
        location: { address: '123 Rizal St', lat: 14.5995, lng: 120.9842 },
        urgency: 'immediate',
      });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('plumber');
    expect(jobsService.createJob).toHaveBeenCalledWith('user-001', expect.objectContaining({ category: 'plumber' }));
  });

  it('400 — description too short', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set(authHeader(makeToken()))
      .send({ category: 'plumber', description: 'short', location: { address: 'x', lat: 14, lng: 121 }, urgency: 'immediate' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — scheduled_at required when urgency is scheduled', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set(authHeader(makeToken()))
      .send({ category: 'plumber', description: 'Fix leaking pipe under sink', location: { address: 'x', lat: 14, lng: 121 }, urgency: 'scheduled' });

    expect(res.status).toBe(400);
  });

  it('401 — unauthenticated request', async () => {
    const res = await request(app).post('/api/v1/jobs').send({ category: 'plumber' });
    expect(res.status).toBe(401);
  });

  it('403 — worker cannot create a job', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set(authHeader(makeWorkerToken()))
      .send({ category: 'plumber', description: 'Fix leaking pipe under sink', location: { address: 'x', lat: 14, lng: 121 }, urgency: 'immediate' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/jobs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns paginated job list', async () => {
    jobsService.listJobs.mockResolvedValue({ data: [JOB], meta: { page: 1, limit: 20, total: 1 } });

    const res = await request(app).get('/api/v1/jobs').set(authHeader(makeToken()));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/jobs/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns job detail', async () => {
    jobsService.getJob.mockResolvedValue(JOB);

    const res = await request(app).get('/api/v1/jobs/job-001').set(authHeader(makeToken()));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('job-001');
  });

  it('404 — job not found', async () => {
    jobsService.getJob.mockRejectedValue(new AppError(404, 'JOB_NOT_FOUND', 'Job not found.'));

    const res = await request(app).get('/api/v1/jobs/bad-id').set(authHeader(makeToken()));
    expect(res.status).toBe(404);
  });

  it('403 — user not party to job', async () => {
    jobsService.getJob.mockRejectedValue(new AppError(403, 'FORBIDDEN', 'Access denied.'));

    const res = await request(app).get('/api/v1/jobs/job-001').set(authHeader(makeToken()));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/jobs/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — worker accepts a job', async () => {
    jobsService.updateStatus.mockResolvedValue({ ...JOB, status: 'accepted', worker_id: 'worker-001' });

    const res = await request(app)
      .patch('/api/v1/jobs/job-001/status')
      .set(authHeader(makeWorkerToken()))
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });

  it('400 — invalid status value', async () => {
    const res = await request(app)
      .patch('/api/v1/jobs/job-001/status')
      .set(authHeader(makeWorkerToken()))
      .send({ status: 'flying' });

    expect(res.status).toBe(400);
  });

  it('400 — invalid transition', async () => {
    jobsService.updateStatus.mockRejectedValue(new AppError(400, 'INVALID_TRANSITION', 'Not allowed.'));

    const res = await request(app)
      .patch('/api/v1/jobs/job-001/status')
      .set(authHeader(makeWorkerToken()))
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('409 — job already taken by another worker', async () => {
    jobsService.updateStatus.mockRejectedValue(new AppError(409, 'JOB_ALREADY_TAKEN', 'Taken.'));

    const res = await request(app)
      .patch('/api/v1/jobs/job-001/status')
      .set(authHeader(makeWorkerToken()))
      .send({ status: 'accepted' });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/v1/jobs/:id', () => {
  it('204 — admin deletes a job', async () => {
    jobsService.deleteJob.mockResolvedValue(undefined);

    const res = await request(app).delete('/api/v1/jobs/job-001').set(authHeader(makeAdminToken()));
    expect(res.status).toBe(204);
  });

  it('403 — non-admin cannot delete', async () => {
    const res = await request(app).delete('/api/v1/jobs/job-001').set(authHeader(makeToken()));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/jobs/:id/messages', () => {
  it('201 — sends a message', async () => {
    jobsService.sendMessage.mockResolvedValue({ id: 'msg-1', content: 'Hello!', sent_at: new Date().toISOString() });

    const res = await request(app)
      .post('/api/v1/jobs/job-001/messages')
      .set(authHeader(makeToken()))
      .send({ content: 'Hello!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello!');
  });

  it('400 — empty message content', async () => {
    const res = await request(app)
      .post('/api/v1/jobs/job-001/messages')
      .set(authHeader(makeToken()))
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('422 — chat locked on closed job', async () => {
    jobsService.sendMessage.mockRejectedValue(new AppError(422, 'JOB_CLOSED', 'Chat is locked.'));

    const res = await request(app)
      .post('/api/v1/jobs/job-001/messages')
      .set(authHeader(makeToken()))
      .send({ content: 'Still there?' });

    expect(res.status).toBe(422);
  });
});
