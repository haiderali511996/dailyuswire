import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { Pagination } from '@/components/site/Pagination';
import { StandardCard } from '@/components/site/PostCard';
import { SearchBox } from '@/components/site/SearchBox';
import { Sidebar } from '@/components/site/Sidebar';
import { getPosts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search every story across news, health, sports, entertainment, crypto, business, lifestyle and marketing.',
  // Search result pages must never enter the index (thin/duplicate content).
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const query = (q ?? '').trim();
  const pageNum = Math.max(1, Number(page) || 1);
  const data = query ? await getPosts({ q: query, page: pageNum, per_page: 12 }) : null;

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Search' }]} className="mb-4" />
      <h1 className="font-serif text-3xl font-bold text-navy-900 sm:text-4xl">Search</h1>

      <div className="mt-5 max-w-xl">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBox />
        </Suspense>
      </div>

      {query && data && (
        <p className="mt-4 text-sm text-ink-muted">
          {data.total} result{data.total === 1 ? '' : 's'} for{' '}
          <strong className="text-navy-900">&ldquo;{query}&rdquo;</strong>
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {!query && (
            <p className="py-12 text-center text-ink-muted">
              Type a keyword above to search the archive.
            </p>
          )}
          {query && data && data.items.length === 0 && (
            <p className="py-12 text-center text-ink-muted">
              No stories matched &ldquo;{query}&rdquo;. Try a different keyword.
            </p>
          )}
          {data && data.items.length > 0 && (
            <>
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
                {data.items.map((post) => (
                  <StandardCard key={post.id} post={post} />
                ))}
              </div>
              <Pagination page={pageNum} pages={data.pages} basePath="/search" searchParams={{ q: query }} />
            </>
          )}
        </div>
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </div>
    </div>
  );
}
