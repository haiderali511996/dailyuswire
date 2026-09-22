import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';

import { AdSlot } from '@/components/site/AdSlot';
import { ArticleBody } from '@/components/site/ArticleBody';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/site/JsonLd';
import { ListCard, StandardCard } from '@/components/site/PostCard';
import { ReadingProgress } from '@/components/site/ReadingProgress';
import { SectionHeading } from '@/components/site/SectionHeading';
import { ShareBar } from '@/components/site/ShareBar';
import { TableOfContents } from '@/components/site/TableOfContents';
import { ViewCounter } from '@/components/site/ViewCounter';
import { getPost, getPostSchema, getPosts, getRelated, getTrending } from '@/lib/api';
import { SITE_NAME, absoluteUrl, mediaUrl, postPath } from '@/lib/config';
import { formatDate } from '@/lib/format';

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ category: string; slug: string }> };

/** Pre-render the most recent articles; the rest render on first request. */
export async function generateStaticParams() {
  const { items } = await getPosts({ per_page: 50 });
  return items.map((p) => ({ category: p.category?.slug ?? 'news', slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Article not found', robots: { index: false, follow: false } };

  const path = postPath(post);
  const image = mediaUrl(post.og_image || post.cover_image);
  // Self-canonical by default, derived from the live category + slug. An
  // editor-supplied canonical (syndicated piece) wins, and og:url follows it
  // so social scrapers and search engines agree on which URL is the original.
  const canonical = post.canonical_url || absoluteUrl(path);

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    keywords: post.meta_keywords || post.tags.map((t) => t.name).join(', '),
    authors: post.author ? [{ name: post.author.name, url: absoluteUrl(`/author/${post.author.slug}`) }] : undefined,
    alternates: { canonical },
    robots: post.no_index
      ? { index: false, follow: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      siteName: SITE_NAME,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      section: post.category?.name,
      tags: post.tags.map((t) => t.name),
      authors: post.author ? [post.author.name] : undefined,
      images: image ? [{ url: image, width: 1600, height: 900, alt: post.cover_alt || post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  // Keep one canonical URL per article: /<real-category>/<slug>.
  const realCategory = post.category?.slug ?? 'news';
  if (realCategory !== categorySlug) permanentRedirect(postPath(post));

  const [related, trending, schema] = await Promise.all([
    getRelated(slug, 4),
    getTrending(5),
    getPostSchema(slug),
  ]);

  const url = absoluteUrl(postPath(post));
  const cover = mediaUrl(post.cover_image);
  const crumbs = [
    { name: 'Home', href: '/' },
    ...(post.category ? [{ name: post.category.name, href: `/${post.category.slug}` }] : []),
    { name: post.title },
  ];

  return (
    <>
      <ReadingProgress />
      <ViewCounter slug={post.slug} />
      {schema && <JsonLd data={[schema.article, schema.breadcrumbs]} />}

      <div className="shell py-5 sm:py-7">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article>
            <header>
              {post.category && (
                <Link
                  href={`/${post.category.slug}`}
                  className="kicker inline-flex items-center gap-2 text-flag-600 hover:underline"
                >
                  <span aria-hidden className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: post.category.color }} />
                  {post.category.name}
                </Link>
              )}

              <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.15] tracking-tight text-navy-900 sm:text-4xl lg:text-[2.85rem]">
                {post.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y border-rule py-3">
                <div className="flex items-center gap-3">
                  {post.author && (
                    <div className="text-sm">
                      <p className="font-semibold text-navy-900">
                        By{' '}
                        <Link href={`/author/${post.author.slug}`} className="hover:text-flag-600 hover:underline">
                          {post.author.name}
                        </Link>
                      </p>
                      <p className="text-xs text-ink-faint">
                        {post.published_at && (
                          <>
                            Published <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <ShareBar url={url} title={post.title} />
              </div>
            </header>

            {cover && (
              <figure className="mt-6">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-wash">
                  <Image
                    src={cover}
                    alt={post.cover_alt || post.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                    className="object-cover"
                  />
                </div>
                {post.cover_caption && (
                  <figcaption className="mt-2 border-l-2 border-rule pl-3 text-xs text-ink-muted">
                    {post.cover_caption}
                  </figcaption>
                )}
              </figure>
            )}

            <TableOfContents />

            <div className="mt-6">
              <ArticleBody html={post.content} adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE} />
            </div>

            {post.source_url && (
              <p className="mt-8 rounded-md bg-wash p-4 text-sm text-ink-muted">
                Reporting informed by{' '}
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-semibold text-navy-800 underline"
                >
                  {post.source_name || 'the original report'}
                </a>
                .
              </p>
            )}

            {post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="kicker text-ink-faint">Topics</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="rounded-full border border-rule bg-wash px-3 py-1 text-xs font-medium text-ink-muted transition hover:border-navy-800 hover:bg-navy-800 hover:text-white"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
              <ShareBar url={url} title={post.title} />
            </div>

            <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="rectangle" />

            {related.length > 0 && (
              <section className="mt-12" aria-labelledby="related-heading">
                <SectionHeading title="Related stories" href={post.category ? `/${post.category.slug}` : '/'} />
                <h2 id="related-heading" className="sr-only">
                  Related stories
                </h2>
                <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
                  {related.map((item) => (
                    <StandardCard key={item.id} post={item} />
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="space-y-8">
            <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR} format="rectangle" className="!my-0" />
            {trending.length > 0 && (
              <section aria-labelledby="trending-aside">
                <h2 id="trending-aside" className="rule-top pt-2 font-serif text-lg font-bold uppercase text-navy-900">
                  Most Read
                </h2>
                <ol className="mt-4 space-y-4">
                  {trending.map((item, i) => (
                    <li key={item.id}>
                      <ListCard post={item} index={i} showImage={false} />
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <div className="lg:sticky lg:top-40">
              <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_2} format="sidebar" className="!my-0" />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
