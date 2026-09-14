import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/site/JsonLd';
import { Pagination } from '@/components/site/Pagination';
import { StandardCard } from '@/components/site/PostCard';
import { getAuthor, getPosts } from '@/lib/api';
import { SITE_NAME, SITE_URL } from '@/lib/config';

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return { title: 'Author not found', robots: { index: false, follow: false } };
  return {
    title: `${author.name} - Author`,
    description: author.bio || `Articles written by ${author.name} for ${SITE_NAME}.`,
    alternates: { canonical: `/author/${slug}` },
    openGraph: { type: 'profile', title: author.name, description: author.bio },
  };
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const author = await getAuthor(slug);
  if (!author) notFound();

  const data = await getPosts({ author: slug, page: pageNum, per_page: 12 });

  return (
    <div className="shell py-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: author.name,
            description: author.bio,
            url: `${SITE_URL}/author/${slug}`,
            worksFor: { '@id': `${SITE_URL}/#organization` },
          },
        }}
      />
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: author.name }]} className="mb-4" />

      <header className="flex flex-col gap-4 rounded-lg border border-rule bg-wash p-6 sm:flex-row sm:items-center">
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy-800 font-serif text-2xl font-bold text-white"
        >
          {author.name.slice(0, 1)}
        </div>
        <div>
          <p className="kicker text-flag-600">Author</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-navy-900 sm:text-3xl">{author.name}</h1>
          {author.bio && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{author.bio}</p>}
          <p className="mt-2 text-xs text-ink-faint">
            {data.total} published article{data.total === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      {data.items.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">No published articles yet.</p>
      ) : (
        <>
          <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((post, i) => (
              <StandardCard key={post.id} post={post} priority={i < 3} />
            ))}
          </div>
          <Pagination page={pageNum} pages={data.pages} basePath={`/author/${slug}`} />
        </>
      )}
    </div>
  );
}
