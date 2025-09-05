import axios from 'axios';

// Centralized base URL resolution
// Priority:
// 1) VITE_API_URL
// 2) http://localhost:5000/api in dev
// 3) /api (works with proxy or same-origin deployments)
const resolvedEnvUrl = (import.meta?.env?.VITE_API_URL || '').trim();
const isDev = Boolean(import.meta?.env?.DEV);
const baseURL = resolvedEnvUrl || (isDev ? 'http://localhost:5000/api' : '/api');

const api = axios.create({ baseURL });

export default api;


