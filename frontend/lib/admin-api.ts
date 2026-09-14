'use client';

/** Authenticated client-side calls to the admin API. */
import { API_URL } from './config';
import type {
  Category,
  DashboardStats,
  FeedItem,
  FeedSource,
  MediaItem,
  Paginated,
  Post,
  SeoAnalysis,
  User,
} from './types';

const TOKEN_KEY = 'duw_token';
const USER_KEY = 'duw_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: User): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });

  if (res.status === 401 && typeof window !== 'undefined') {
    clearSession();
    if (!window.location.pathname.startsWith('/admin/login')) {
      window.location.href = '/admin/login';
    }
    throw new ApiError('Your session expired. Please sign in again.', 401);
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') detail = body.detail;
      else if (Array.isArray(body.detail)) {
        detail = body.detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.slice(-1)}: ${d.msg}`).join('; ');
      }
    } catch {
      /* keep the generic message */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/api/auth/me'),

  stats: () => request<DashboardStats>('/api/admin/stats'),

  listPosts: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<Paginated<Post>>(`/api/admin/posts?${qs}`);
  },
  getPost: (id: number) => request<Post>(`/api/admin/posts/${id}`),
  createPost: (body: unknown) =>
    request<Post>('/api/admin/posts', { method: 'POST', body: JSON.stringify(body) }),
  updatePost: (id: number, body: unknown) =>
    request<Post>(`/api/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePost: (id: number) => request<void>(`/api/admin/posts/${id}`, { method: 'DELETE' }),
  seoAnalysis: (body: unknown) =>
    request<SeoAnalysis>('/api/admin/posts/seo-analysis', { method: 'POST', body: JSON.stringify(body) }),

  listCategories: () => request<Category[]>('/api/admin/categories'),
  createCategory: (body: unknown) =>
    request<Category>('/api/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: number, body: unknown) =>
    request<Category>(`/api/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: number) => request<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  listUsers: () => request<User[]>('/api/admin/users'),
  createUser: (body: unknown) =>
    request<User>('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: number, body: unknown) =>
    request<User>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  listMedia: (page = 1) => request<MediaItem[]>(`/api/admin/media?page=${page}&per_page=60`),
  uploadMedia: (file: File, alt = '') => {
    const form = new FormData();
    form.append('file', file);
    form.append('alt', alt);
    return request<MediaItem>('/api/admin/media', { method: 'POST', body: form });
  },
  deleteMedia: (id: number) => request<void>(`/api/admin/media/${id}`, { method: 'DELETE' }),

  listSources: () => request<FeedSource[]>('/api/admin/feeds/sources'),
  addSource: (body: unknown) =>
    request<FeedSource>('/api/admin/feeds/sources', { method: 'POST', body: JSON.stringify(body) }),
  deleteSource: (id: number) => request<void>(`/api/admin/feeds/sources/${id}`, { method: 'DELETE' }),
  fetchWire: () =>
    request<{ sources_checked: number; new_items: number; errors: string[] }>(
      '/api/admin/feeds/fetch',
      { method: 'POST' },
    ),
  listWireItems: (params: Record<string, string | number | boolean> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
    return request<FeedItem[]>(`/api/admin/feeds/items?${qs}`);
  },
  importWireItems: (feed_item_ids: number[], category_id?: number) =>
    request<Post[]>('/api/admin/feeds/import', {
      method: 'POST',
      body: JSON.stringify({ feed_item_ids, category_id: category_id ?? null }),
    }),

  getSettings: () => request<Record<string, string>>('/api/admin/settings'),
  putSettings: (entries: { key: string; value: string }[]) =>
    request<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(entries),
    }),
};
