import axios from 'axios';

// In local dev: falls back to '/api' (proxied by Vite to localhost:5000).
// In production (Render Static Site): VITE_API_URL must be set to the deployed backend URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartfulfill_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  demoLogin: (role) => api.post(`/auth/demo-login/${role}`, {}),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const dashboardApi = {
  getControlTower: (warehouseId) => api.get('/dashboard', { params: { warehouse_id: warehouseId } }),
};

export const orderApi = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  recalculatePriority: (id) => api.post(`/orders/${id}/recalculate-priority`, {}),
  dispatchOrder: (id) => api.post(`/orders/${id}/dispatch`, {}),
};

export const inventoryApi = {
  getInventory: (params) => api.get('/inventory', { params }),
  getProducts: (params) => api.get('/inventory/products', { params }),
  adjustStock: (id, data) => api.post(`/inventory/${id}/adjust`, data),
  getProductForecast: (productId, horizon = 14) => api.get(`/inventory/products/${productId}/forecast`, { params: { horizon } }),
};

export const allocationApi = {
  getRecommendation: (orderId) => api.get(`/allocation/recommend/${orderId}`),
  confirmAllocation: (orderId, data = {}) => api.post(`/allocation/confirm/${orderId}`, data),
  getBatchEvaluations: () => api.get('/allocation/batch-evaluate'),
};

export const pickingApi = {
  getTasks: (params) => api.get('/picking/tasks', { params }),
  getTask: (id) => api.get(`/picking/tasks/${id}`),
  generateRoute: (orderId, data = {}) => api.post(`/picking/generate-route/${orderId}`, data),
  recordAction: (taskId, data = {}) => api.post(`/picking/tasks/${taskId}/action`, data),
};

export const packingApi = {
  getTasks: (params) => api.get('/packing/tasks', { params }),
  getTask: (id) => api.get(`/packing/tasks/${id}`),
  startPacking: (id) => api.post(`/packing/tasks/${id}/start`, {}),
  completePacking: (id, data = {}) => api.post(`/packing/tasks/${id}/complete`, data),
};

export const qcApi = {
  getChecks: (params) => api.get('/qc/checks', { params }),
  getCheck: (id) => api.get(`/qc/checks/${id}`),
  submitResult: (id, data = {}) => api.post(`/qc/checks/${id}/submit`, data),
};

export const exceptionApi = {
  getExceptions: (params) => api.get('/exceptions', { params }),
  getException: (id) => api.get(`/exceptions/${id}`),
  getResolutionOptions: (id) => api.get(`/exceptions/${id}/options`),
  resolveException: (id, data = {}) => api.post(`/exceptions/${id}/resolve`, data),
};

export const replenishmentApi = {
  getRecommendations: (warehouseId) => api.get('/replenishment/recommendations', { params: { warehouse_id: warehouseId } }),
  createPurchaseOrder: (data = {}) => api.post('/replenishment/purchase-order', data),
};

export const analyticsApi = {
  getAnalytics: (timeframe = 'daily') => api.get('/analytics', { params: { timeframe } }),
};

export const simulatorApi = {
  getPresets: () => api.get('/simulator/presets'),
  runSimulation: (data = {}) => api.post('/simulator/run', data),
};

export const copilotApi = {
  queryCopilot: (query) => api.post('/copilot/query', { query }),
  getContext: () => api.get('/copilot/context'),
};

export const notificationApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.post(`/notifications/${id}/read`, {}),
  markAllRead: () => api.post('/notifications/mark-all-read', {}),
};

export const auditApi = {
  getAuditLogs: (params) => api.get('/audit/logs', { params }),
  getDecisionLogs: (params) => api.get('/audit/decisions', { params }),
};

export default api;
