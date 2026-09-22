import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { Pagination } from '@/components/site/Pagination';
import { StandardCard } from '@/components/site/PostCard';
import { getPosts } from '@/lib/api';
import { SITE_NAME } from '@/lib/config';

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

function pretty(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const name = pretty(slug);
  return {
    title: `${name} - News & Analysis${pageNum > 1 ? ` - Page ${pageNum}` : ''}`,
    description: `Every ${SITE_NAME} story tagged ${name}, newest first.`,
    alternates: { canonical: pageNum > 1 ? `/tag/${slug}?page=${pageNum}` : `/tag/${slug}` },
    robots: pageNum > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const data = await getPosts({ tag: slug, page: pageNum, per_page: 12 });
  // A tag nobody has used is not a page: answer 404 instead of an indexable
  // empty shell for every string a crawler can invent after /tag/.
  if (data.total === 0) notFound();
  const name = pretty(slug);

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: `#${name}` }]} className="mb-4" />
      <header className="rule-top pt-3">
        <p className="kicker text-flag-600">Topic</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-navy-900 sm:text-4xl">#{name}</h1>
        <p className="mt-2 text-sm text-ink-faint">
          {data.total} article{data.total === 1 ? '' : 's'}
        </p>
      </header>

      {data.items.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">No stories carry this tag yet.</p>
      ) : (
        <>
          <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((post, i) => (
              <StandardCard key={post.id} post={post} priority={i < 3} />
            ))}
          </div>
          <Pagination page={pageNum} pages={data.pages} basePath={`/tag/${slug}`} />
        </>
      )}
    </div>
  );
}
