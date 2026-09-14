import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/search', '/*?page=*'],
      },
      // Let Google's news and image crawlers see everything public.
      { userAgent: 'Googlebot-News', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'Googlebot-Image', allow: '/', disallow: ['/admin/', '/api/'] },
      // AdSense needs to crawl pages to serve relevant ads.
      { userAgent: 'Mediapartners-Google', allow: '/' },
      { userAgent: 'AdsBot-Google', allow: '/' },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
