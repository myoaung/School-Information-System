import axios from 'axios';
import { cacheGet, cacheSet, queueSync, processSyncQueue } from './offlineDb';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 + offline caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const url = response.config.url || '';
      // Cache important endpoints
      if (url.includes('/announcements') || url.includes('/classes') ||
          url.includes('/curriculum') || url.includes('/attendance') ||
          url.includes('/students') || url.includes('/timetable')) {
        cacheSet(url, response.data, 24 * 60 * 60 * 1000); // 24h TTL
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle 401 (but not for chat or offline scenarios)
    if (error.response?.status === 401 && !config?.url?.includes('/chat')) {
      // Don't redirect if offline — token might still be valid
      if (navigator.onLine) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // If offline and GET request, try cache
    if (!navigator.onLine && config?.method === 'get') {
      const cachedData = await cacheGet(config.url);
      if (cachedData !== null) {
        return { data: cachedData, status: 200, statusText: 'OK (cached)', config, headers: {} };
      }
    }

    // If offline and mutation request, queue for sync
    if (!navigator.onLine && config?.method !== 'get') {
      await queueSync({
        url: config.url,
        method: config.method?.toUpperCase() || 'GET',
        body: config.data ? JSON.parse(config.data) : null,
        headers: config.headers as Record<string, string>,
      });
      // Return a fake success response
      return {
        data: { message: 'Queued for sync', queued: true },
        status: 200,
        statusText: 'OK (queued)',
        config,
        headers: {},
      };
    }

    return Promise.reject(error);
  }
);

// Listen for online restoration and process sync queue
if (typeof window !== 'undefined') {
  window.addEventListener('online-restored', async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const result = await processSyncQueue(async (url, options) => {
        return fetch(`${import.meta.env.VITE_API_URL || '/api'}${url}`, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      });

      if (result.success > 0) {
        console.log(`Synced ${result.success} offline changes`);
        // Dispatch event so pages can refresh
        window.dispatchEvent(new CustomEvent('sync-complete', { detail: result }));
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  });
}

export default api;
