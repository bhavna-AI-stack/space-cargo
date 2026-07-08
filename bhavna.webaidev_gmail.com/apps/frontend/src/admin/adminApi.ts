import type {
  AdminAnalytics,
  AdminUserRow,
  AdminSessionRow,
  AdminClaimRow,
  GameConfig,
} from 'shared';

import { BACKEND_URL } from '../lib/config';

const BACKEND = BACKEND_URL;
const TOKEN_KEY = 'scr_admin_token';

export const adminToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export { AdminApiError };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = adminToken.get();
  const res = await fetch(`${BACKEND}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }

  if (!res.ok) {
    throw new AdminApiError(body?.error || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export const adminApi = {
  login: (password: string) =>
    request<{ success: boolean; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  checkSession: () => request<{ success: boolean }>('/session'),

  analytics: () => request<AdminAnalytics>('/analytics'),

  users: (q = '', take = 50, skip = 0) =>
    request<{ total: number; users: AdminUserRow[] }>(
      `/users?q=${encodeURIComponent(q)}&take=${take}&skip=${skip}`
    ),

  updateUser: (id: string, patch: Partial<AdminUserRow>) =>
    request<{ success: boolean }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  banUser: (id: string, banned: boolean) =>
    request<{ success: boolean; banned: boolean }>(`/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ banned }),
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  sessions: (suspiciousOnly = false, take = 60) =>
    request<{ sessions: AdminSessionRow[] }>(
      `/sessions?take=${take}${suspiciousOnly ? '&suspicious=true' : ''}`
    ),

  deleteSession: (id: string) =>
    request<{ success: boolean }>(`/sessions/${id}`, { method: 'DELETE' }),

  claims: (status = 'all', take = 60) =>
    request<{ claims: AdminClaimRow[] }>(`/claims?status=${status}&take=${take}`),

  moderateClaim: (id: string, status: 'approved' | 'rejected') =>
    request<{ success: boolean; status: string }>(`/claims/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  getConfig: () => request<{ config: GameConfig }>('/config'),

  updateConfig: (patch: Partial<GameConfig>) =>
    request<{ success: boolean; config: GameConfig }>('/config', {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
};
