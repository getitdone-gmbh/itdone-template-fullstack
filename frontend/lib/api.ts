function getApiBase(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('frontend')) {
    const backendHost = window.location.hostname.replace('frontend', 'backend');
    return `${window.location.protocol}//${backendHost}/api`;
  }
  return '/api';
}

async function request<T>(
  endpoint: string,
  token: string | undefined,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${getApiBase()}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export interface Item {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  issuer: string | null;
  clientId: string | null;
}

export async function fetchAppConfig(): Promise<AppConfig> {
  const response = await fetch(`${getApiBase()}/config`);
  if (!response.ok) throw new Error('Failed to load app config');
  return response.json();
}

export function createApi(token: string | undefined) {
  return {
    getItems: () => request<Item[]>('/items', token),
    createItem: (title: string) =>
      request<Item>('/items', token, { method: 'POST', body: JSON.stringify({ title }) }),
    deleteItem: (id: string) =>
      request<{ message: string }>(`/items/${id}`, token, { method: 'DELETE' }),
  };
}
