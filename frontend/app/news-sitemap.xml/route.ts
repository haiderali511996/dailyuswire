import { getSitemapData } from '@/lib/api';
import { SITE_URL, absoluteMediaUrl } from '@/lib/config';

export const revalidate = 300;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

/**
 * Google News sitemap. Per Google's spec it may only contain articles
 * published in the last 48 hours, capped at 1,000 URLs.
 */
export async function GET(): Promise<Response> {
  const data = await getSitemapData();
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  const recent = (data?.posts ?? [])
    .filter((p) => p.published_at && new Date(p.published_at).getTime() >= cutoff)
    .slice(0, 1000);

  const urls = recent
    .map(
      (post) => `<url>
    <loc>${escapeXml(`${SITE_URL}/${post.category}/${post.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(data?.site_name ?? 'Daily US Wire')}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${post.published_at}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>${post.cover_image ? `
    <image:image><image:loc>${escapeXml(absoluteMediaUrl(post.cover_image))}</image:loc></image:image>` : ''}
  </url>`,
    )
    .join('\n  ');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
