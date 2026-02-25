import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, attempt token refresh then retry once
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh_token = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh`, { refresh_token });
        localStorage.setItem('access_token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register:       (body)          => api.post('/auth/register', body),
  sendOTP:        (phone)         => api.post('/auth/otp/send', { phone }),
  verifyOTP:      (phone, otp)    => api.post('/auth/otp/verify', { phone, otp }),
  login:          (body)          => api.post('/auth/login', body),
  logout:         ()              => api.post('/auth/logout'),
  forgotPassword: (email)         => api.post('/auth/password/forgot', { email }),
  resetPassword:  (body)          => api.post('/auth/password/reset', body),
};

// ── Users ────────────────────────────────────────────────────
export const usersApi = {
  getMe:    ()     => api.get('/users/me'),
  updateMe: (body) => api.patch('/users/me', body),
  deleteMe: ()     => api.delete('/users/me'),
  list:     (p)    => api.get('/users', { params: p }),
  getById:  (id)   => api.get(`/users/${id}`),
};

// ── Workers ──────────────────────────────────────────────────
export const workersApi = {
  getNearby:          (p)         => api.get('/workers/nearby', { params: p }),
  getById:            (id)        => api.get(`/workers/${id}`),
  updateAvailability: (status)    => api.patch('/workers/me/availability', { status }),
  updateLocation:     (lat, lng)  => api.patch('/workers/me/location', { lat, lng }),
  getEarnings:        (p)         => api.get('/workers/me/earnings', { params: p }),
};

// ── Jobs ─────────────────────────────────────────────────────
export const jobsApi = {
  create:        (body)         => api.post('/jobs', body),
  list:          (p)            => api.get('/jobs', { params: p }),
  nearby:        (p)            => api.get('/jobs/nearby', { params: p }),
  getById:       (id)           => api.get(`/jobs/${id}`),
  updateStatus:  (id, status)   => api.patch(`/jobs/${id}/status`, { status }),
  reject:        (id)           => api.post(`/jobs/${id}/reject`),
  uploadPhotos:  (id, formData) => api.post(`/jobs/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMessages:   (id, p)        => api.get(`/jobs/${id}/messages`, { params: p }),
  sendMessage:   (id, content)  => api.post(`/jobs/${id}/messages`, { content }),
};

// ── Payments ─────────────────────────────────────────────────
export const paymentsApi = {
  initiate:    (body) => api.post('/payments', body),
  getById:     (id)   => api.get(`/payments/${id}`),
  cashConfirm: (id)   => api.post(`/payments/${id}/cash-confirm`),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  list:       (p)  => api.get('/notifications', { params: p }),
  markRead:   (id) => api.patch(`/notifications/${id}/read`),
  markAllRead:()   => api.patch('/notifications/read-all'),
};

// ── Ratings ───────────────────────────────────────────────────
export const ratingsApi = {
  submit:      (jobId, body) => api.post(`/jobs/${jobId}/rating`, body),
  getMyRating: (jobId)       => api.get(`/jobs/${jobId}/rating`),
};

// ── Disputes ─────────────────────────────────────────────────
export const disputesApi = {
  create:  (body) => api.post('/disputes', body),
  getById: (id)   => api.get(`/disputes/${id}`),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  listWorkers:   (p)           => api.get('/admin/workers', { params: p }),
  updateWorker:  (id, body)    => api.patch(`/admin/workers/${id}`, body),
  updateUser:    (id, body)    => api.patch(`/admin/users/${id}`, body),
  getAnalytics:  (p)           => api.get('/admin/analytics', { params: p }),
  resolveDispute:(id, body)    => api.patch(`/disputes/${id}`, body),
};

export default api;
