import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach JWT Bearer token to outgoing protected requests
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = window.localStorage.getItem('zaiqo_auth_token');
        if (token && typeof token === 'string' && token.trim()) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token.trim()}`;
        }
      }
    } catch {
      // Storage access gracefully ignored
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 unauthorized responses cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('zaiqo_auth_token');
          window.localStorage.removeItem('zaiqo_auth_session');
        }
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(
            new CustomEvent('zaiqo:unauthorized', {
              detail: { url: error?.config?.url },
            })
          );
        }
      } catch {
        // Storage access gracefully ignored
      }
    }
    return Promise.reject(error);
  }
);

export default api;

