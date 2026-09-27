// Centralize the API prefix, optional local admin token, and backend error format for all screens.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

export interface ApiError extends Error {
  status: number;
  code?: string;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (ADMIN_API_KEY) headers.set('Authorization', `Bearer ${ADMIN_API_KEY}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    const error = new Error('Cannot reach the backend. Check that the API server is running.') as ApiError;
    error.status = 0;
    throw error;
  }

  // The backend wraps successful responses in { data }; unwrap it and preserve structured API errors.
  const body = await response.json().catch(() => null) as { data?: T; error?: { code?: string; message?: string } } | null;
  if (!response.ok) {
    const error = new Error(body?.error?.message || `Request failed (${response.status}).`) as ApiError;
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
  }
  return (body && 'data' in body ? body.data : body) as T;
}

export const adminHeaders = ADMIN_API_KEY ? { Authorization: `Bearer ${ADMIN_API_KEY}` } : {};
