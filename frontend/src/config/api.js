/**
 * Centralized API and Socket URL configuration.
 * When running in the Electron launcher, the frontend is served from the same dynamic port as the backend.
 */

export const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : `${window.location.origin}/api`);

export const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
