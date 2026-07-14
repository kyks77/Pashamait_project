const API_BASE = window.NOVO_API || (window.location.port === '3000'
  ? 'http://localhost:3001/api'
  : '/api');

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

window.novoApi = {
  get: (path) => api(path),
  post: (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => api(path, { method: 'PATCH', body: JSON.stringify(body) }),

  register: (email, password, displayName) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),

  login: (email, password) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () => api('/auth/logout', { method: 'POST' }),

  me: () => api('/auth/me'),

  updateProfile: (data) => api('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  getPlans: () => api('/subscriptions/plans'),
  activateSubscription: (plan) => api('/subscriptions/activate', { method: 'POST', body: JSON.stringify({ plan }) }),
  cancelSubscription: () => api('/subscriptions/cancel', { method: 'POST' }),

  checkGenerateAccess: () => api('/generate/access'),

  adminStats: () => api('/admin/stats'),
  adminUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api(`/admin/users${q ? '?' + q : ''}`);
  },
  adminSetStatus: (id, status) =>
    api(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  adminActivity: (limit = 50) => api(`/admin/activity?limit=${limit}`)
};
