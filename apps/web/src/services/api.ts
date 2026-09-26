import type { AuthResponseData, Usuario } from '@cronos/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const TOKEN_KEY = 'cronos_token';
export const USER_KEY = 'cronos_user';
export const LAST_ACTIVITY_KEY = 'cronos_last_activity';
export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 horas (7.200.000 ms)

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

export function getStoredLastActivity(): number | null {
  const act = localStorage.getItem(LAST_ACTIVITY_KEY) || sessionStorage.getItem(LAST_ACTIVITY_KEY);
  return act ? Number(act) : null;
}

export function updateLastActivity(): void {
  const now = String(Date.now());
  localStorage.setItem(LAST_ACTIVITY_KEY, now);
  sessionStorage.setItem(LAST_ACTIVITY_KEY, now);
}

export function isSessionExpiredByInactivity(): boolean {
  const last = getStoredLastActivity();
  if (!last || Number.isNaN(last)) return false;
  return Date.now() - last >= INACTIVITY_TIMEOUT_MS;
}

export function setStoredAuth(token: string, user: any, remember: boolean = true) {
  clearStoredAuth();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  // Também garante sincronização no localStorage para abas
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

export async function apiRequest<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getStoredToken();

  // Verifica se a sessão expirou por inatividade antes de enviar requisição autenticada
  if (token && !endpoint.includes('/auth/login') && isSessionExpiredByInactivity()) {
    clearStoredAuth();
    sessionStorage.setItem('cronos_logout_reason', 'inactivity');
    window.dispatchEvent(new CustomEvent('cronos-auth-logout'));
    throw new Error('Sessão expirada por inatividade após 2 horas. Faça login novamente.');
  }

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

  // Interação bem-sucedida renova o timestamp de atividade
  if (token) {
    updateLastActivity();
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

// -----------------------------------------------------------------------------
// Serviços de Gestão de Usuários (Administrador)
// -----------------------------------------------------------------------------

export async function getUsuariosApi(): Promise<Usuario[]> {
  return apiRequest<Usuario[]>('/usuarios');
}

export async function createUsuarioApi(payload: {
  nome?: string;
  email: string;
  password: string;
  role?: string;
  pode_cadastrar_usuarios?: boolean;
  ativo?: boolean;
}): Promise<Usuario> {
  return apiRequest<Usuario>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUsuarioApi(
  id: number,
  payload: {
    nome?: string;
    email?: string;
    password?: string;
    role?: string;
    pode_cadastrar_usuarios?: boolean;
    ativo?: boolean;
  }
): Promise<Usuario> {
  return apiRequest<Usuario>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteUsuarioApi(id: number): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/usuarios/${id}`, {
    method: 'DELETE',
  });
}
