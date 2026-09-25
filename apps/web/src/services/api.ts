const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function apiRequest<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Erro HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data?.data !== undefined ? data.data : data;
}
