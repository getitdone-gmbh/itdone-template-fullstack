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

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  project?: Project;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  project?: Project;
  taskId?: string;
  task?: Task;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryFilter {
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TimeSummary {
  totalHours: number;
  byProject: Record<string, { hours: number; entries: number }>;
  byTask: Record<string, { hours: number; entries: number }>;
  byDate: Record<string, { hours: number; entries: number }>;
  totalEntries: number;
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
    // Items
    getItems: () => request<Item[]>('/items', token),
    createItem: (title: string) =>
      request<Item>('/items', token, { method: 'POST', body: JSON.stringify({ title }) }),
    deleteItem: (id: string) =>
      request<{ message: string }>(`/items/${id}`, token, { method: 'DELETE' }),
    
    // Projects
    getProjects: () => request<Project[]>('/api/projects', token),
    createProject: (data: { name: string; description?: string }) =>
      request<Project>('/api/projects', token, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    updateProject: (id: string, data: { name?: string; description?: string }) =>
      request<Project>(`/api/projects/${id}`, token, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    deleteProject: (id: string) =>
      request<{ message: string }>(`/api/projects/${id}`, token, { method: 'DELETE' }),
    
    // Tasks
    getTasks: (projectId?: string) => 
      request<Task[]>(projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks', token),
    createTask: (data: { name: string; description?: string; projectId: string }) =>
      request<Task>('/api/tasks', token, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    updateTask: (id: string, data: { name?: string; description?: string; projectId?: string }) =>
      request<Task>(`/api/tasks/${id}`, token, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    deleteTask: (id: string) =>
      request<{ message: string }>(`/api/tasks/${id}`, token, { method: 'DELETE' }),
    
    // Time Entries
    getTimeEntries: (filter?: TimeEntryFilter) => {
      const query = new URLSearchParams();
      if (filter?.projectId) query.append('projectId', filter.projectId);
      if (filter?.taskId) query.append('taskId', filter.taskId);
      if (filter?.startDate) query.append('startDate', filter.startDate);
      if (filter?.endDate) query.append('endDate', filter.endDate);
      const queryString = query.toString();
      return request<TimeEntry[]>(`/api/time-entries${queryString ? '?' + queryString : ''}`, token);
    },
    createTimeEntry: (data: { 
      projectId?: string; 
      taskId?: string; 
      startTime: string; 
      endTime?: string; 
      duration?: number; 
      description?: string 
    }) =>
      request<TimeEntry>('/api/time-entries', token, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    createManualTimeEntry: (data: { 
      date: string; 
      projectId?: string; 
      taskId?: string; 
      hours: number; 
      description?: string 
    }) =>
      request<TimeEntry>('/api/time-entries/manual', token, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    updateTimeEntry: (id: string, data: { 
      projectId?: string; 
      taskId?: string; 
      startTime?: string; 
      endTime?: string; 
      duration?: number; 
      description?: string 
    }) =>
      request<TimeEntry>(`/api/time-entries/${id}`, token, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    deleteTimeEntry: (id: string) =>
      request<{ message: string }>(`/api/time-entries/${id}`, token, { method: 'DELETE' }),
    getTimeEntry: (id: string) =>
      request<TimeEntry>(`/api/time-entries/${id}`, token),
    getActiveTimer: () =>
      request<TimeEntry | null>('/api/time-entries/active', token),
    startTimer: (data: { projectId?: string; taskId?: string; description?: string }) =>
      request<TimeEntry>('/api/time-entries/start', token, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    stopTimer: () =>
      request<TimeEntry>('/api/time-entries/stop', token, { method: 'POST' }),
    getTimeSummary: (filter?: { projectId?: string; startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams();
      if (filter?.projectId) query.append('projectId', filter.projectId);
      if (filter?.startDate) query.append('startDate', filter.startDate);
      if (filter?.endDate) query.append('endDate', filter.endDate);
      const queryString = query.toString();
      return request<TimeSummary>(`/api/time-entries/summary${queryString ? '?' + queryString : ''}`, token);
    },
  };
}
