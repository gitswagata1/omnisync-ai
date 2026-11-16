const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface SessionAgent {
  id: string;
  company: string;
  userName: string;
  role: string;
  department: string;
  roleTag: string;
  email: string | null;
  permissions: string[];
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Talks to the API. Authentication uses an HTTP-only session cookie set by the
 * API, so the browser sends it on every request and scripts cannot read it.
 */
class ApiClient {
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      },
    });

    if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      // Outside React, so a full navigation is the simplest way to drop stale client state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session expired; full reload to /login
      window.location.assign('/login');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error || `API error: ${res.status}`, res.status);
    }

    if (res.status === 204) {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  login(email: string, password: string) {
    return this.post<{ agent: SessionAgent }>('/api/agents/login', { email, password });
  }

  logout() {
    return this.post<void>('/api/agents/logout', {});
  }

  me() {
    return this.get<{ agent: SessionAgent }>('/api/agents/me');
  }
}

export const api = new ApiClient();
