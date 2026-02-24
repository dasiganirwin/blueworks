// Mock axios before api.js is loaded so interceptors register on our mock
jest.mock('axios', () => {
  const mockAxios = Object.assign(jest.fn(), {
    create:       jest.fn(),
    post:         jest.fn(),
    interceptors: {
      request:  { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get:    jest.fn(),
    patch:  jest.fn(),
    delete: jest.fn(),
  });
  mockAxios.create.mockReturnValue(mockAxios);
  return mockAxios;
});

const axios = require('axios');

// Load api module — this registers interceptors on the mock
require('@/lib/api');

// Capture the registered interceptor functions
const requestInterceptor       = axios.interceptors.request.use.mock.calls[0][0];
const responseSuccessInterceptor = axios.interceptors.response.use.mock.calls[0][0];
const responseErrorInterceptor   = axios.interceptors.response.use.mock.calls[0][1];

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('request interceptor', () => {
  it('attaches Authorization header when access_token present', () => {
    localStorage.setItem('access_token', 'tok123');
    const config = { headers: {} };
    expect(requestInterceptor(config).headers.Authorization).toBe('Bearer tok123');
  });

  it('omits Authorization header when no token', () => {
    const config = { headers: {} };
    expect(requestInterceptor(config).headers.Authorization).toBeUndefined();
  });

  it('returns the config object', () => {
    const config = { headers: {} };
    expect(requestInterceptor(config)).toBe(config);
  });
});

describe('response interceptor — success', () => {
  it('passes through successful responses unchanged', async () => {
    const res = { status: 200, data: {} };
    const result = await responseSuccessInterceptor(res);
    expect(result).toBe(res);
  });
});

describe('response interceptor — error', () => {
  it('calls refresh endpoint on 401 and stores new token', async () => {
    localStorage.setItem('refresh_token', 'rt-old');
    axios.post.mockResolvedValueOnce({ data: { access_token: 'at-new' } });
    axios.mockResolvedValueOnce({ status: 200, data: {} }); // retry call

    await responseErrorInterceptor({
      config:   { headers: {}, _retry: false },
      response: { status: 401 },
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/token/refresh'),
      expect.objectContaining({ refresh_token: 'rt-old' })
    );
    expect(localStorage.getItem('access_token')).toBe('at-new');
  });

  it('redirects to /login and clears storage when refresh fails', async () => {
    delete window.location;
    window.location = { href: '' };
    localStorage.setItem('access_token', 'old-at');
    axios.post.mockRejectedValueOnce(new Error('refresh failed'));

    // The error interceptor rejects after clearing storage (falls through to Promise.reject)
    await expect(
      responseErrorInterceptor({
        config:   { headers: {}, _retry: false },
        response: { status: 401 },
      })
    ).rejects.toBeDefined();

    expect(window.location.href).toBe('/login');
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('does not retry a request with _retry already set', async () => {
    await expect(
      responseErrorInterceptor({
        config:   { headers: {}, _retry: true },
        response: { status: 401 },
      })
    ).rejects.toBeDefined();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('rejects non-401 errors without attempting refresh', async () => {
    await expect(
      responseErrorInterceptor({
        config:   { headers: {} },
        response: { status: 500 },
      })
    ).rejects.toBeDefined();
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe('API namespace exports', () => {
  const {
    authApi, usersApi, workersApi, jobsApi,
    paymentsApi, notificationsApi, disputesApi, adminApi,
  } = require('@/lib/api');

  it('authApi exposes login and register', () => {
    expect(typeof authApi.login).toBe('function');
    expect(typeof authApi.register).toBe('function');
    expect(typeof authApi.logout).toBe('function');
  });

  it('jobsApi exposes create and updateStatus', () => {
    expect(typeof jobsApi.create).toBe('function');
    expect(typeof jobsApi.updateStatus).toBe('function');
    expect(typeof jobsApi.getMessages).toBe('function');
  });

  it('paymentsApi exposes initiate and cashConfirm', () => {
    expect(typeof paymentsApi.initiate).toBe('function');
    expect(typeof paymentsApi.cashConfirm).toBe('function');
  });

  it('notificationsApi exposes markRead and markAllRead', () => {
    expect(typeof notificationsApi.markRead).toBe('function');
    expect(typeof notificationsApi.markAllRead).toBe('function');
  });

  it('adminApi exposes getAnalytics and listWorkers', () => {
    expect(typeof adminApi.getAnalytics).toBe('function');
    expect(typeof adminApi.listWorkers).toBe('function');
  });

  it('workersApi exposes getNearby and updateLocation', () => {
    expect(typeof workersApi.getNearby).toBe('function');
    expect(typeof workersApi.updateLocation).toBe('function');
  });

  it('disputesApi exposes create and getById', () => {
    expect(typeof disputesApi.create).toBe('function');
    expect(typeof disputesApi.getById).toBe('function');
  });
});
