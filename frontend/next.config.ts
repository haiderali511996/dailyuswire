import type { NextConfig } from 'next';

/**
 * Read an env var, treating "" as absent. GitHub Actions sets any `vars.X` that
 * has not been created to an empty string rather than leaving it unset, and an
 * empty string defeats `??`.
 */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

const siteUrl = env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');

/**
 * Upstream for the /media proxy below.
 *
 * IMPORTANT: with `output: 'standalone'`, rewrite destinations are frozen into
 * routes-manifest.json at BUILD time - they are not re-read from the
 * environment when the server boots. So this value must be correct in the
 * build environment (CI), not just on the server, or every uploaded image
 * 404s in production with no error in the logs.
 */
const mediaUpstream = env(
  'API_INTERNAL_URL',
  env('NEXT_PUBLIC_API_URL', 'http://localhost:8000'),
).replace(/\/$/, '');

// CI builds must be told where the site lives. Without this the defaults above
// quietly produce a localhost build that appears to succeed and then 404s in
// production, so say plainly which variable is missing.
if (process.env.CI && !process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  throw new Error(
    'next.config: NEXT_PUBLIC_SITE_URL is not set.\n' +
      'Add it in GitHub > Settings > Secrets and variables > Actions > Variables,\n' +
      'e.g. NEXT_PUBLIC_SITE_URL = https://yourdomain.com\n' +
      'See DEPLOYMENT.md Step 5.',
  );
}

if (process.env.CI && !env('API_INTERNAL_URL', env('NEXT_PUBLIC_API_URL', ''))) {
  throw new Error(
    'next.config: NEXT_PUBLIC_API_URL is not set.\n' +
      'Add it in GitHub > Settings > Secrets and variables > Actions > Variables,\n' +
      'e.g. NEXT_PUBLIC_API_URL = https://api.yourdomain.com\n' +
      'See DEPLOYMENT.md Step 5.',
  );
}

const isLocal = (url: string) => /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url);

// A build aimed at a real domain but pointing media at localhost is always a
// misconfiguration, and it fails silently in production - every uploaded image
// 404s with nothing in the logs. Catch it here instead. A fully local build
// (both URLs on localhost) is left alone.
if (isLocal(mediaUpstream) && !isLocal(siteUrl)) {
  throw new Error(
    `next.config: media upstream resolved to "${mediaUpstream}", but the site is ` +
      `being built for "${siteUrl}".\n` +
      'Rewrite destinations are frozen at build time in standalone output, so every\n' +
      'uploaded image would 404. Set NEXT_PUBLIC_API_URL (and API_INTERNAL_URL) to\n' +
      'your public API origin before building, e.g. https://api.yourdomain.com',
  );
}

const nextConfig: NextConfig = {
  // Emits .next/standalone with a minimal server bundle - what the Dockerfile ships.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536],
    // Uploads are served same-origin via the /media rewrite below, so they need
    // no remote pattern. This list only covers images that come from a
    // publisher's own CDN via an imported wire item.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  async rewrites() {
    return [
      // Proxy uploads through the site's own domain: keeps images same-origin
      // (no CORS, no cross-origin image optimisation) and lets the CDN in front
      // of Next.js cache them.
      { source: '/media/:path*', destination: `${mediaUpstream}/media/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/tinymce/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Uploaded files carry a content hash in the name, so they never change.
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  async redirects() {
    return [{ source: '/home', destination: '/', permanent: true }];
  },
};

export default nextConfig;
