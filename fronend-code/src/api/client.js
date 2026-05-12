import axios from 'axios';

/** Dev: empty baseURL + Vite proxy `/v1` → backend. Prod: set VITE_API_BASE_URL or same-origin `/v1`. */
const resolveBaseURL = () => {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env !== undefined && env !== '') return env;
  if (import.meta.env.DEV) return '';
  return '';
};

const client = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('aimplify_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const path =
      typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '';
    const onLoginRoute = path === '/login';
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('aimplify_token');
      localStorage.removeItem('aimplify_user');
      // Avoid full reload while already on login — prevents flicker / reload loops when
      // public calls (e.g. platform counts) return 401 or React StrictMode runs effects twice.
      if (!onLoginRoute) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
