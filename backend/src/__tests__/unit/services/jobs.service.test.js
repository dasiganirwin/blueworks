jest.mock('../../../config/supabase');
jest.mock('../../../websocket', () => ({ broadcast: jest.fn() }));
jest.mock('../../../services/notifications.service', () => ({ send: jest.fn() }));

const supabase = require('../../../config/supabase');
const { makeChain } = require('../../helpers/supabase.mock');
const jobsService = require('../../../services/jobs.service');

const JOB = {
  id:               'job-001',
  customer_id:      'cust-001',
  worker_id:        null,
  category:         'plumber',
  description:      'Fix leaking pipe',
  location_address: '123 Test St',
  location_lat:     14.5995,
  location_lng:     120.9842,
  status:           'pending',
  urgency:          'immediate',
};

function mockFrom(tableMap) {
  supabase.from.mockImplementation((table) => makeChain(tableMap[table] ?? { data: null, error: null }));
}

describe('jobsService.updateStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('worker can accept a pending job', async () => {
    const updatedJob = { ...JOB, status: 'accepted', worker_id: 'w-001' };
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: JOB, error: null }))           // fetch job
      .mockImplementationOnce(() => makeChain({ data: updatedJob, error: null }))    // update job
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }))            // status history
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }));           // worker busy

    const result = await jobsService.updateStatus('job-001', 'w-001', 'worker', 'accepted');
    expect(result.status).toBe('accepted');
    expect(result.worker_id).toBe('w-001');
  });

  it('throws INVALID_TRANSITION when the transition is not allowed', async () => {
    supabase.from.mockImplementationOnce(() => makeChain({ data: JOB, error: null }));

    // Worker cannot jump from pending straight to completed
    await expect(jobsService.updateStatus('job-001', 'w-001', 'worker', 'completed'))
      .rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('throws JOB_ALREADY_TAKEN when worker_id is already set by someone else', async () => {
    const takenJob = { ...JOB, status: 'pending', worker_id: 'other-worker' };
    supabase.from.mockImplementationOnce(() => makeChain({ data: takenJob, error: null }));

    await expect(jobsService.updateStatus('job-001', 'w-001', 'worker', 'accepted'))
      .rejects.toMatchObject({ code: 'JOB_ALREADY_TAKEN' });
  });

  it('throws NOT_FOUND when the job does not exist', async () => {
    supabase.from.mockImplementationOnce(() => makeChain({ data: null, error: null }));

    await expect(jobsService.updateStatus('bad-id', 'w-001', 'worker', 'accepted'))
      .rejects.toMatchObject({ code: 'JOB_NOT_FOUND' });
  });

  it('customer can cancel a pending job', async () => {
    const cancelled = { ...JOB, status: 'cancelled' };
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: JOB, error: null }))
      .mockImplementationOnce(() => makeChain({ data: cancelled, error: null }))
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }));

    const result = await jobsService.updateStatus('job-001', 'cust-001', 'customer', 'cancelled');
    expect(result.status).toBe('cancelled');
  });

  it('throws FORBIDDEN when customer tries to accept', async () => {
    supabase.from.mockImplementationOnce(() => makeChain({ data: JOB, error: null }));

    await expect(jobsService.updateStatus('job-001', 'cust-001', 'customer', 'accepted'))
      .rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });
});

describe('jobsService.getNearbyJobs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns pending jobs within bounding box', async () => {
    const nearbyJob = { ...JOB, status: 'pending', worker_id: null };
    supabase.from.mockImplementationOnce(() =>
      makeChain({ data: [nearbyJob], count: 1, error: null }),
    );

    const result = await jobsService.getNearbyJobs('w-001', { lat: 14.5995, lng: 120.9842 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('pending');
    expect(result.meta.total).toBe(1);
  });

  it('returns empty array when no jobs in range', async () => {
    supabase.from.mockImplementationOnce(() =>
      makeChain({ data: [], count: 0, error: null }),
    );

    const result = await jobsService.getNearbyJobs('w-001', { lat: 9.0, lng: 118.0 });
    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('uses default radius of 10 km when not specified', async () => {
    supabase.from.mockImplementationOnce(() =>
      makeChain({ data: [], count: 0, error: null }),
    );

    // Should not throw — radius defaults to 10 internally
    await expect(
      jobsService.getNearbyJobs('w-001', { lat: 14.5995, lng: 120.9842 }),
    ).resolves.toBeDefined();
  });
});

describe('jobsService.sendMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws JOB_CLOSED for completed jobs', async () => {
    const closedJob = { ...JOB, status: 'completed', worker_id: 'w-001' };
    supabase.from.mockImplementationOnce(() => makeChain({ data: closedJob, error: null }));

    await expect(jobsService.sendMessage('job-001', 'cust-001', 'customer', 'hello'))
      .rejects.toMatchObject({ code: 'JOB_CLOSED' });
  });

  it('throws JOB_CLOSED for cancelled jobs', async () => {
    const closedJob = { ...JOB, status: 'cancelled', worker_id: 'w-001' };
    supabase.from.mockImplementationOnce(() => makeChain({ data: closedJob, error: null }));

    await expect(jobsService.sendMessage('job-001', 'cust-001', 'customer', 'hello'))
      .rejects.toMatchObject({ code: 'JOB_CLOSED' });
  });

  it('throws FORBIDDEN when sender is not party to the job', async () => {
    const activeJob = { ...JOB, status: 'in_progress', worker_id: 'w-001' };
    supabase.from.mockImplementationOnce(() => makeChain({ data: activeJob, error: null }));

    await expect(jobsService.sendMessage('job-001', 'stranger-999', 'customer', 'hello'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
