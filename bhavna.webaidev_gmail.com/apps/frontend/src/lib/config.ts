const PROD_BACKEND = 'https://space-cargo-backend.onrender.com';

function resolveBackendUrl(): string {
  const fromEnv = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (fromEnv) return fromEnv;
  // Env var missing: only use localhost when actually developing locally.
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:3001';
  }
  return PROD_BACKEND;
}

export const BACKEND_URL = resolveBackendUrl();
