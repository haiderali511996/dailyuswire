import type { MetadataRoute } from 'next';

import { getSitemapData } from '@/lib/api';
import { SITE_URL, absoluteMediaUrl } from '@/lib/config';

// Rendered per request (the API call itself is cached for 15 minutes) so a
// build that ran while the API was unreachable can never freeze a sitemap
// holding only the static pages.
export const dynamic = 'force-dynamic';

const STATIC_PAGES: { path: string; priority: number; freq: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, freq: 'hourly' },
  { path: '/about', priority: 0.5, freq: 'yearly' },
  { path: '/contact', priority: 0.5, freq: 'yearly' },
  { path: '/editorial-policy', priority: 0.4, freq: 'yearly' },
  { path: '/privacy-policy', priority: 0.3, freq: 'yearly' },
  { path: '/terms', priority: 0.3, freq: 'yearly' },
  { path: '/disclaimer', priority: 0.3, freq: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  if (!data) return entries;

  const stamp = (value?: string | null) => (value ? new Date(value) : now);

  for (const category of data.categories) {
    entries.push({
      url: `${SITE_URL}/${category.slug}`,
      lastModified: stamp(category.lastmod),
      changeFrequency: 'hourly',
      priority: 0.9,
    });
  }

  for (const author of data.authors) {
    entries.push({
      url: `${SITE_URL}/author/${author.slug}`,
      lastModified: stamp(author.lastmod),
      changeFrequency: 'weekly',
      priority: 0.4,
    });
  }

  for (const tag of data.tags ?? []) {
    entries.push({
      url: `${SITE_URL}/tag/${encodeURIComponent(tag.slug)}`,
      lastModified: stamp(tag.lastmod),
      changeFrequency: 'daily',
      priority: 0.5,
    });
  }

  for (const post of data.posts) {
    const published = post.published_at ? new Date(post.published_at) : now;
    const ageDays = (now.getTime() - published.getTime()) / 86_400_000;
    entries.push({
      url: `${SITE_URL}/${post.category}/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : published,
      // Fresh news deserves a higher crawl priority than the archive.
      changeFrequency: ageDays < 2 ? 'hourly' : ageDays < 30 ? 'daily' : 'monthly',
      priority: ageDays < 2 ? 0.9 : ageDays < 30 ? 0.7 : 0.5,
      images: post.cover_image ? [absoluteMediaUrl(post.cover_image)] : undefined,
    });
  }

  return entries;
}
