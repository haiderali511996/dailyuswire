import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Called by the FastAPI backend whenever an editor publishes or edits a post,
 * so the static pages refresh immediately instead of waiting for ISR.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 501 });
  }

  let body: { secret?: string; paths?: string[]; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const paths = (body.paths ?? []).filter((p) => p.startsWith('/'));
  const tags = body.tags ?? ['content', 'posts', 'sitemap'];

  // 'max' expires the tag immediately on the next request (Next 16 signature).
  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);
  // Admin settings (verification tag, analytics, ad units) are rendered by the
  // root layout on every page, so a settings change must purge all of them.
  if (tags.includes('settings')) revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
  revalidatePath('/news-sitemap.xml');

  return NextResponse.json({ revalidated: true, paths, tags, now: Date.now() });
}
