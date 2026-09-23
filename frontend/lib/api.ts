/**
 * Server-side data access. Every call is cached with a tag so the backend's
 * revalidate webhook can invalidate exactly the pages that changed (ISR).
 */
import { API_INTERNAL, API_URL } from './config';
import type { Category, Paginated, Post, PostCard, Tag } from './types';

const REVALIDATE_SECONDS = 60;

type FetchOpts = { tags?: string[]; revalidate?: number };

async function api<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_INTERNAL}${path}`, {
      next: { revalidate: opts.revalidate ?? REVALIDATE_SECONDS, tags: opts.tags ?? ['content'] },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // The site must still render (with empty rails) if the API is down.
    return null;
  }
}

const EMPTY_PAGE: Paginated<PostCard> = { items: [], total: 0, page: 1, per_page: 0, pages: 1 };

export async function getCategories(): Promise<Category[]> {
  return (await api<Category[]>('/api/categories', { tags: ['categories'] })) ?? [];
}

export async function getCategory(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export interface PostQuery {
  page?: number;
  per_page?: number;
  category?: string;
  tag?: string;
  author?: string;
  featured?: boolean;
  breaking?: boolean;
  q?: string;
  exclude?: number;
}

export async function getPosts(query: PostQuery = {}): Promise<Paginated<PostCard>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const tags = ['content', 'posts'];
  if (query.category) tags.push(`category:${query.category}`);
  return (await api<Paginated<PostCard>>(`/api/posts?${params}`, { tags })) ?? EMPTY_PAGE;
}

export async function getPost(slug: string): Promise<Post | null> {
  return api<Post>(`/api/posts/${encodeURIComponent(slug)}`, { tags: ['content', `post:${slug}`] });
}

export async function getRelated(slug: string, limit = 4): Promise<PostCard[]> {
  return (
    (await api<PostCard[]>(`/api/posts/${encodeURIComponent(slug)}/related?limit=${limit}`, {
      tags: ['content', `post:${slug}`],
    })) ?? []
  );
}

export async function getPostSchema(
  slug: string,
): Promise<{ article: Record<string, unknown>; breadcrumbs: Record<string, unknown> } | null> {
  return api(`/api/posts/${encodeURIComponent(slug)}/schema`, { tags: ['content', `post:${slug}`] });
}

export async function getTrending(limit = 6): Promise<PostCard[]> {
  return (await api<PostCard[]>(`/api/posts/trending?limit=${limit}`, { revalidate: 300 })) ?? [];
}

export async function getTags(limit = 24): Promise<Tag[]> {
  return (await api<Tag[]>(`/api/tags?limit=${limit}`, { revalidate: 900 })) ?? [];
}

export async function getAuthor(slug: string) {
  return api<{ id: number; name: string; slug: string; bio: string; avatar: string; twitter: string }>(
    `/api/authors/${encodeURIComponent(slug)}`,
    { revalidate: 900, tags: ['content', 'authors'] },
  );
}

export interface SitemapData {
  site_url: string;
  site_name: string;
  categories: { slug: string; name: string; lastmod?: string | null }[];
  authors: { slug: string; lastmod?: string | null }[];
  tags?: { slug: string; lastmod?: string | null }[];
  posts: {
    slug: string;
    title: string;
    category: string;
    published_at: string | null;
    updated_at: string | null;
    cover_image: string;
  }[];
}

export async function getSitemapData(): Promise<SitemapData | null> {
  return api<SitemapData>('/api/sitemap-data', { revalidate: 900, tags: ['sitemap'] });
}

/** Fire-and-forget view counter, called from a client component. */
export function registerView(slug: string): void {
  fetch(`${API_URL}/api/posts/${encodeURIComponent(slug)}/view`, {
    method: 'POST',
    keepalive: true,
  }).catch(() => {});
}
