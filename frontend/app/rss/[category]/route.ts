import { API_INTERNAL } from '@/lib/config';

export const revalidate = 600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> },
): Promise<Response> {
  const { category } = await params;
  const slug = category.replace(/\.xml$/, '');
  try {
    const upstream = await fetch(`${API_INTERNAL}/rss/${encodeURIComponent(slug)}.xml`, {
      next: { revalidate: 600 },
    });
    if (upstream.status === 404) return new Response('Feed not found', { status: 404 });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    return new Response(await upstream.text(), {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch {
    return new Response('Feed temporarily unavailable', { status: 503 });
  }
}
