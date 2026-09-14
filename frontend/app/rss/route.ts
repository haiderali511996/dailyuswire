import { API_INTERNAL } from '@/lib/config';

export const revalidate = 600;

/** Proxy the backend's RSS so readers subscribe to the site domain. */
export async function GET(): Promise<Response> {
  try {
    const upstream = await fetch(`${API_INTERNAL}/rss.xml`, { next: { revalidate: 600 } });
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
