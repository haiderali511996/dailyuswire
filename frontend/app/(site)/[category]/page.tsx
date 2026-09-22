import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AdSlot } from '@/components/site/AdSlot';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/site/JsonLd';
import { Pagination } from '@/components/site/Pagination';
import { FeatureCard, StandardCard } from '@/components/site/PostCard';
import { Sidebar } from '@/components/site/Sidebar';
import { getCategories, getCategory, getPosts } from '@/lib/api';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/config';

export const revalidate = 60;
const PER_PAGE = 12;

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const { page } = await searchParams;
  const category = await getCategory(slug);
  if (!category) return { title: 'Section not found' };

  const pageNum = Math.max(1, Number(page) || 1);
  const suffix = pageNum > 1 ? ` - Page ${pageNum}` : '';
  const canonical = pageNum > 1 ? `/${slug}?page=${pageNum}` : `/${slug}`;

  return {
    title: `${category.meta_title || `${category.name} News`}${suffix}`,
    description: category.meta_description || category.description,
    alternates: {
      canonical,
      types: { 'application/rss+xml': [{ url: `/rss/${slug}`, title: `${category.name} RSS` }] },
    },
    openGraph: {
      type: 'website',
      url: absoluteUrl(canonical),
      title: `${category.name} News | ${SITE_NAME}`,
      description: category.meta_description || category.description,
    },
    robots: pageNum > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const category = await getCategory(slug);
  if (!category) notFound();

  const data = await getPosts({ category: slug, page: pageNum, per_page: PER_PAGE });
  const [lead, ...rest] = data.items;

  const crumbs = [{ name: 'Home', href: '/' }, { name: category.name }];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} News`,
    description: category.meta_description || category.description,
    url: `${SITE_URL}/${slug}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}/${slug}` },
      ],
    },
  };

  return (
    <div className="shell py-6 sm:py-8">
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} className="mb-4" />

      <header className="border-b-2 pb-4" style={{ borderColor: category.color || '#03305f' }}>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            {category.description}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-faint">
          {data.total} article{data.total === 1 ? '' : 's'}
          {pageNum > 1 ? ` · Page ${pageNum} of ${data.pages}` : ''}
        </p>
      </header>

      {data.items.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">
          Nothing published in {category.name} yet. Check back shortly.
        </p>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {pageNum === 1 && lead && (
              <>
                <FeatureCard post={lead} priority />
                <hr className="my-8 border-rule" />
              </>
            )}
            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
              {(pageNum === 1 ? rest : data.items).map((post, i) => (
                <StandardCard key={post.id} post={post} priority={pageNum === 1 && i < 2} />
              ))}
            </div>
            <Pagination page={pageNum} pages={data.pages} basePath={`/${slug}`} />
          </div>
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </div>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="leaderboard" className="mt-10" />
    </div>
  );
}
