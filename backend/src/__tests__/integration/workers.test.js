jest.mock('../../services/workers.service');

const request        = require('supertest');
const app            = require('../../app');
const workersService = require('../../services/workers.service');
const { AppError }   = require('../../utils/errors');
const { makeToken, makeWorkerToken, authHeader } = require('../helpers/auth.helper');

const WORKER = { id: 'w-001', name: 'Pedro Reyes', skills: ['plumber'], rating: 4.8, completed_jobs: 10, availability_status: 'online' };

describe('GET /api/v1/workers/nearby', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns nearby workers for a customer', async () => {
    workersService.getNearby.mockResolvedValue({ data: [{ ...WORKER, distance_km: 1.2 }] });

    const res = await request(app)
      .get('/api/v1/workers/nearby')
      .query({ lat: 14.5995, lng: 120.9842, category: 'plumber' })
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('400 — missing lat/lng', async () => {
    const res = await request(app)
      .get('/api/v1/workers/nearby')
      .query({ category: 'plumber' })
      .set(authHeader(makeToken()));

    expect(res.status).toBe(400);
  });

  it('403 — worker cannot call this endpoint', async () => {
    const res = await request(app)
      .get('/api/v1/workers/nearby')
      .query({ lat: 14.5, lng: 120.9, category: 'plumber' })
      .set(authHeader(makeWorkerToken()));

    expect(res.status).toBe(403);
  });

  it('404 — no workers available', async () => {
    workersService.getNearby.mockRejectedValue(new AppError(404, 'NO_WORKERS_AVAILABLE', 'None found.'));

    const res = await request(app)
      .get('/api/v1/workers/nearby')
      .query({ lat: 14.5, lng: 120.9, category: 'welder' })
      .set(authHeader(makeToken()));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NO_WORKERS_AVAILABLE');
  });
});

describe('PATCH /api/v1/workers/me/availability', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — worker updates availability', async () => {
    workersService.updateAvailability.mockResolvedValue({ availability_status: 'online' });

    const res = await request(app)
      .patch('/api/v1/workers/me/availability')
      .set(authHeader(makeWorkerToken()))
      .send({ status: 'online' });

    expect(res.status).toBe(200);
    expect(res.body.availability_status).toBe('online');
  });

  it('400 — invalid status value', async () => {
    const res = await request(app)
      .patch('/api/v1/workers/me/availability')
      .set(authHeader(makeWorkerToken()))
      .send({ status: 'available' }); // not a valid enum

    expect(res.status).toBe(400);
  });

  it('403 — customer cannot toggle availability', async () => {
    const res = await request(app)
      .patch('/api/v1/workers/me/availability')
      .set(authHeader(makeToken()))
      .send({ status: 'online' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/workers/me/location', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — updates worker location', async () => {
    workersService.updateLocation.mockResolvedValue({ updated_at: new Date().toISOString() });

    const res = await request(app)
      .patch('/api/v1/workers/me/location')
      .set(authHeader(makeWorkerToken()))
      .send({ lat: 14.5995, lng: 120.9842 });

    expect(res.status).toBe(200);
    expect(res.body.updated_at).toBeDefined();
  });

  it('400 — missing coordinates', async () => {
    const res = await request(app)
      .patch('/api/v1/workers/me/location')
      .set(authHeader(makeWorkerToken()))
      .send({ lat: 14.5 }); // lng missing

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/workers/me/earnings', () => {
  it('200 — returns earnings for a worker', async () => {
    workersService.getEarnings.mockResolvedValue({
      summary: { total_earned: 15400, currency: 'PHP' },
      data: [], meta: { page: 1, limit: 20, total: 0 },
    });

    const res = await request(app).get('/api/v1/workers/me/earnings').set(authHeader(makeWorkerToken()));
    expect(res.status).toBe(200);
    expect(res.body.summary.total_earned).toBe(15400);
  });

  it('403 — customer cannot access earnings', async () => {
    const res = await request(app).get('/api/v1/workers/me/earnings').set(authHeader(makeToken()));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/workers/:id', () => {
  it('200 — returns public worker profile', async () => {
    workersService.getWorkerById.mockResolvedValue(WORKER);

    const res = await request(app).get('/api/v1/workers/w-001').set(authHeader(makeToken()));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('w-001');
  });

  it('404 — worker not found', async () => {
    workersService.getWorkerById.mockRejectedValue(new AppError(404, 'WORKER_NOT_FOUND', 'Not found.'));

    const res = await request(app).get('/api/v1/workers/nonexistent').set(authHeader(makeToken()));
    expect(res.status).toBe(404);
  });
});
