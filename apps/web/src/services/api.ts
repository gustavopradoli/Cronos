import type { AuthResponseData, Usuario } from '@cronos/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const TOKEN_KEY = 'cronos_token';
export const USER_KEY = 'cronos_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): Usuario | null {
  const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: any, remember: boolean = true) {
  clearStoredAuth();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export async function apiRequest<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    clearStoredAuth();
    window.dispatchEvent(new CustomEvent('cronos-auth-logout'));
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Erro HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data?.data !== undefined ? data.data : data;
}

// -----------------------------------------------------------------------------
// Serviços de Autenticação com PostgreSQL Backend
// -----------------------------------------------------------------------------

export async function loginApi(email: string, password: string): Promise<AuthResponseData> {
  return apiRequest<AuthResponseData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(
  email: string,
  password: string,
  nome?: string
): Promise<AuthResponseData> {
  return apiRequest<AuthResponseData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nome }),
  });
}

export async function getMeApi(): Promise<Usuario> {
  return apiRequest<Usuario>('/auth/me');
}

export async function resetPasswordApi(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword }),
  });
}
