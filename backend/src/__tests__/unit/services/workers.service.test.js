jest.mock('../../../config/supabase');

const supabase = require('../../../config/supabase');
const { makeChain } = require('../../helpers/supabase.mock');
const workersService = require('../../../services/workers.service');

function setupFrom(tableMap) {
  supabase.from.mockImplementation((table) => makeChain(tableMap[table] ?? { data: null, error: null }));
}

const WORKER_ROW = {
  user_id:             'w-001',
  availability_status: 'online',
  current_lat:         14.5995,
  current_lng:         120.9842,
  rating:              4.8,
  completed_jobs_count: 10,
  users:               { name: 'Pedro Reyes' },
  worker_skills:       [{ category: 'plumber' }],
};

describe('workersService.getNearby', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns nearby workers filtered by category', async () => {
    setupFrom({ workers: { data: [WORKER_ROW], error: null } });

    const result = await workersService.getNearby({ lat: 14.5995, lng: 120.9842, category: 'plumber', radius: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('w-001');
    expect(result.data[0].category).toBe('plumber');
    expect(result.data[0].distance_km).toBeCloseTo(0, 1);
  });

  it('excludes workers whose skills do not match the requested category', async () => {
    setupFrom({ workers: { data: [WORKER_ROW], error: null } });

    await expect(workersService.getNearby({ lat: 14.5995, lng: 120.9842, category: 'electrician', radius: 10 }))
      .rejects.toMatchObject({ code: 'NO_WORKERS_AVAILABLE' });
  });

  it('throws NO_WORKERS_AVAILABLE when no workers are returned', async () => {
    setupFrom({ workers: { data: [], error: null } });

    await expect(workersService.getNearby({ lat: 14.5, lng: 121.0, category: 'plumber', radius: 10 }))
      .rejects.toMatchObject({ code: 'NO_WORKERS_AVAILABLE' });
  });

  it('excludes workers beyond the radius', async () => {
    // Worker at ~500 km away from request coords
    const farWorker = { ...WORKER_ROW, current_lat: 10.0, current_lng: 118.0 };
    setupFrom({ workers: { data: [farWorker], error: null } });

    await expect(workersService.getNearby({ lat: 14.5995, lng: 120.9842, category: 'plumber', radius: 5 }))
      .rejects.toMatchObject({ code: 'NO_WORKERS_AVAILABLE' });
  });
});

describe('workersService.updateAvailability', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns updated status on success', async () => {
    setupFrom({ workers: { data: {}, error: null } });
    const result = await workersService.updateAvailability('w-001', 'online');
    expect(result).toEqual({ availability_status: 'online' });
  });

  it('throws when supabase returns an error', async () => {
    setupFrom({ workers: { data: null, error: { message: 'DB error' } } });
    await expect(workersService.updateAvailability('w-001', 'online')).rejects.toBeDefined();
  });
});

describe('workersService.getWorkerById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns worker profile', async () => {
    setupFrom({ workers: { data: WORKER_ROW, error: null } });
    const result = await workersService.getWorkerById('w-001');
    expect(result.id).toBe('w-001');
    expect(result.name).toBe('Pedro Reyes');
    expect(result.skills).toContain('plumber');
  });

  it('throws NOT_FOUND when worker does not exist', async () => {
    setupFrom({ workers: { data: null, error: null } });
    await expect(workersService.getWorkerById('nonexistent'))
      .rejects.toMatchObject({ code: 'WORKER_NOT_FOUND' });
  });
});
