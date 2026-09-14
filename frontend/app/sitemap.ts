import type { MetadataRoute } from 'next';

import { getSitemapData } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

export const revalidate = 900;

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

  for (const category of data.categories) {
    entries.push({
      url: `${SITE_URL}/${category.slug}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    });
  }

  for (const author of data.authors) {
    entries.push({
      url: `${SITE_URL}/author/${author.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
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
      images: post.cover_image ? [post.cover_image] : undefined,
    });
  }

  return entries;
}
