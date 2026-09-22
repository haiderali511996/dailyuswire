import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/config';

/** User agents of the AI training, search and on-demand fetch crawlers we allow. */
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
  'Meta-ExternalFetcher',
  'CCBot',
  'cohere-ai',
  'MistralAI-User',
  'DuckAssistBot',
  'YouBot',
  'Bytespider',
];

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
      // AI crawlers and assistants are welcome on every public page, so the
      // site can be cited and summarised by answer engines. The admin panel
      // and the API stay off limits. See /llms.txt for a guided index.
      { userAgent: AI_BOTS, allow: '/', disallow: ['/admin', '/admin/', '/api/'] },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
