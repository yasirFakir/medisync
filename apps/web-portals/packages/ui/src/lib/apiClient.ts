/// <reference types="vite/client" />
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

console.log(`[MediSync API Client] Connecting to backend at: ${BASE_URL}/api`);

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT to every request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('medisync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 with invalid token error message — clear token and redirect to login
apiClient.interceptors.response.use(
  res => res,
  err => {
    const isAuthError = err.response?.status === 401 && 
      (err.response?.data?.message?.includes('token') || err.response?.data?.message?.includes('authenticated'));
    
    if (isAuthError && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('medisync_token');
      localStorage.removeItem('medisync_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('medisync_token', token);
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('medisync_token');
    delete apiClient.defaults.headers.common.Authorization;
  }
};
