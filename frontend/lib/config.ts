/**
 * Pick a value, treating an empty string as absent.
 *
 * CI sets undeclared variables to "" rather than leaving them unset - GitHub
 * Actions does this for any `vars.X` that was never created - and an empty
 * string beats `??`, which otherwise reaches `new URL('')` during the build.
 *
 * Each caller MUST pass `process.env.NEXT_PUBLIC_SOMETHING` as a literal
 * property access. Next inlines those into the client bundle at build time by
 * textual substitution; a computed lookup like `process.env[name]` is left
 * untouched, so in the browser it evaluates to undefined and the fallback wins
 * no matter what the build environment said.
 */
function orElse(value: string | undefined, fallback: string): string {
  return value && value.trim() !== '' ? value.trim() : fallback;
}

/** Browser-visible backend URL (media, client-side admin calls). */
export const API_URL = orElse(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:8000').replace(/\/$/, '');

/** Server-side backend URL - can be an internal hostname inside Docker/K8s. */
export const API_INTERNAL = orElse(process.env.API_INTERNAL_URL, API_URL).replace(/\/$/, '');

export const SITE_URL = orElse(process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000').replace(/\/$/, '');

export const SITE_NAME = 'Daily US Wire';
export const SITE_TAGLINE =
  'Breaking news, health, sports, entertainment, crypto, business, lifestyle and marketing.';
export const SITE_DESCRIPTION =
  'Daily US Wire delivers breaking US news plus original reporting on health, sports, entertainment, crypto, business, lifestyle and marketing.';

export const TWITTER_HANDLE = '@dailyuswire';
export const ADSENSE_CLIENT = orElse(process.env.NEXT_PUBLIC_ADSENSE_CLIENT, '');
export const GA_ID = orElse(process.env.NEXT_PUBLIC_GA_ID, '');
export const GSC_VERIFICATION = orElse(process.env.NEXT_PUBLIC_GSC_VERIFICATION, '');

/**
 * Resolve an image reference for rendering.
 *
 * Uploads stay as same-origin `/media/...` paths - next.config.ts rewrites
 * them to the backend - so next/image optimises them locally and the CDN in
 * front of the site caches them. Absolute URLs - an image hosted somewhere
 * else - pass through untouched.
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
