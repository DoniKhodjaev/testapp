import apiClient from './api-client';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  verifyMfa: (tempToken: string, code: string) =>
    apiClient.post('/auth/mfa/verify', { tempToken, code }),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  getMe: () => apiClient.get('/auth/me'),
};

export const paymentsApi = {
  getAll: (params?: any) => apiClient.get('/payments', { params }),
  getOne: (id: string) => apiClient.get(`/payments/${id}`),
  create: (data: any) => apiClient.post('/payments', data),
  update: (id: string, data: any) => apiClient.put(`/payments/${id}`, data),
  submit: (id: string) => apiClient.post(`/payments/${id}/submit`),
  sign: (id: string, data: any) => apiClient.post(`/payments/${id}/sign`, data),
  send: (id: string) => apiClient.post(`/payments/${id}/send`),
  delete: (id: string) => apiClient.delete(`/payments/${id}`),
  getHistory: (id: string) => apiClient.get(`/payments/${id}/history`),
};

export const accountsApi = {
  getAll: () => apiClient.get('/accounts'),
  getOne: (id: string) => apiClient.get(`/accounts/${id}`),
  getStatements: (id: string, from: string, to: string) =>
    apiClient.get(`/accounts/${id}/statements`, { params: { from, to } }),
  exportStatement: (id: string, data: any) =>
    apiClient.post(`/accounts/${id}/statements/export`, data),
};

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getOne: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  resetMfa: (id: string) => apiClient.post(`/users/${id}/mfa/reset`),
};

export const messagesApi = {
  getAll: (params?: any) => apiClient.get('/messages', { params }),
  getOne: (id: string) => apiClient.get(`/messages/${id}`),
  reply: (id: string, body: string) =>
    apiClient.post(`/messages/${id}/reply`, { body }),
};

export const counterpartiesApi = {
  getAll: (query?: string) =>
    apiClient.get('/counterparties', { params: { query } }),
  create: (data: any) => apiClient.post('/counterparties', data),
};

export const auditApi = {
  getAll: (params?: any) => apiClient.get('/audit', { params }),
};

export const statementsApi = {
  getAll: (params?: any) => apiClient.get('/statements', { params }),
  getOne: (id: string) => apiClient.get(`/statements/${id}`),
  generate: (data: any) => apiClient.post('/statements/generate', data),
  exportPDF: (id: string) => apiClient.get(`/statements/${id}/export/pdf`, { responseType: 'blob' }),
  exportXLSX: (id: string) => apiClient.get(`/statements/${id}/export/xlsx`, { responseType: 'blob' }),
};
