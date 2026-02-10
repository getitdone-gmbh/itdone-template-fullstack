function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('frontend')) {
    const backendHost = window.location.hostname.replace('frontend', 'backend');
    return `${window.location.protocol}//${backendHost}/api`;
  }
  return '/api';
}

const API_BASE = getApiBase();

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export interface Item {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  getItems: () => request<Item[]>('/items'),
  createItem: (title: string) => request<Item>('/items', { method: 'POST', body: JSON.stringify({ title }) }),
  deleteItem: (id: string) => request<{ message: string }>(`/items/${id}`, { method: 'DELETE' }),
};
