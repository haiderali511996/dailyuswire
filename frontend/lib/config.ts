/**
 * Read an environment variable, treating an empty string as absent.
 *
 * CI systems set undeclared variables to "" rather than leaving them unset -
 * GitHub Actions does this for any `vars.X` that has not been created. With
 * `??` that empty string wins over the fallback, which previously produced a
 * bare `new URL('')` crash during the build instead of a useful message.
 */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

/** Browser-visible backend URL (media, client-side admin calls). */
export const API_URL = env('NEXT_PUBLIC_API_URL', 'http://localhost:8000').replace(/\/$/, '');

/** Server-side backend URL - can be an internal hostname inside Docker/K8s. */
export const API_INTERNAL = env('API_INTERNAL_URL', API_URL).replace(/\/$/, '');

export const SITE_URL = env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, '');

export const SITE_NAME = 'Daily US Wire';
export const SITE_TAGLINE =
  'Breaking news, health, sports, entertainment, crypto, business, lifestyle and marketing.';
export const SITE_DESCRIPTION =
  'Daily US Wire delivers breaking US news plus original reporting on health, sports, entertainment, crypto, business, lifestyle and marketing.';

export const TWITTER_HANDLE = '@dailyuswire';
export const ADSENSE_CLIENT = env('NEXT_PUBLIC_ADSENSE_CLIENT', '');
export const GA_ID = env('NEXT_PUBLIC_GA_ID', '');
export const GSC_VERIFICATION = env('NEXT_PUBLIC_GSC_VERIFICATION', '');

/**
 * Resolve an image reference for rendering.
 *
 * Uploads stay as same-origin `/media/...` paths - next.config.ts rewrites
 * them to the backend - so next/image optimises them locally and the CDN in
 * front of the site caches them. Absolute URLs (a publisher's CDN, from an
 * imported wire item) pass through untouched.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function postPath(post: { slug: string; category?: { slug: string } | null }): string {
  return `/${post.category?.slug ?? 'news'}/${post.slug}`;
}
