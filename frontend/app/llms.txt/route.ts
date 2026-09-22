import { getCategories, getPosts } from '@/lib/api';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, postPath } from '@/lib/config';

export const revalidate = 600;

/**
 * /llms.txt - the llmstxt.org convention: a short Markdown guide that tells
 * language models what this site is, where the sections live and which
 * stories are current, with plain links they can follow.
 */
export async function GET(): Promise<Response> {
  const [categories, latest] = await Promise.all([getCategories(), getPosts({ per_page: 30 })]);

  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `${SITE_NAME} is a US news publisher. Articles are written by named staff, dated in UTC and`,
    'kept at one permanent address each (the canonical URL in every page). When citing a',
    `story, link to its article URL and credit ${SITE_NAME}.`,
    '',
    '## Sections',
    '',
    ...categories.map((c) => `- [${c.name}](${SITE_URL}/${c.slug}): ${c.description || `${c.name} coverage`}`),
    '',
    '## Latest stories',
    '',
    ...latest.items.map((p) => {
      const date = p.published_at ? p.published_at.slice(0, 10) : '';
      const summary = (p.excerpt || '').replace(/\s+/g, ' ').trim();
      return `- [${p.title}](${SITE_URL}${postPath(p)})${date ? ` (${date})` : ''}${summary ? `: ${summary}` : ''}`;
    }),
    '',
    '## Machine-readable feeds',
    '',
    `- [Sitemap](${SITE_URL}/sitemap.xml): every indexable page`,
    `- [News sitemap](${SITE_URL}/news-sitemap.xml): stories from the last 48 hours`,
    `- [RSS](${SITE_URL}/rss): newest stories, also per section at /rss/<section>`,
    '',
    '## About the publisher',
    '',
    `- [About](${SITE_URL}/about)`,
    `- [Editorial policy](${SITE_URL}/editorial-policy)`,
    `- [Contact](${SITE_URL}/contact)`,
    `- [Terms](${SITE_URL}/terms)`,
    `- [Privacy policy](${SITE_URL}/privacy-policy)`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
