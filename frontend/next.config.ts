import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
      { source: '/media/:path*', destination: `${apiUrl}/media/:path*` },
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
