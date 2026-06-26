import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — don't redirect on 401 for chat endpoints (widget handles its own errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isChatEndpoint = error.config?.url?.startsWith('/chat');
    if (error.response?.status === 401 && !isChatEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
