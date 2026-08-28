import axios from 'axios';
import supabase from '../lib/supabase.js';

/**
 * Pre-configured Axios instance for all backend API requests.
 * In development, Vite's proxy forwards /api/* to http://localhost:3001.
 * In production, set VITE_API_BASE_URL to the deployed backend URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ────────────────────────────────────────
// Attach the Supabase session JWT as a Bearer token when a session exists
api.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────
// Normalize errors across the app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    console.error('[api]', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
