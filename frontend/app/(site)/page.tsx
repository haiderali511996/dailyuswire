import Link from 'next/link';
import { Suspense } from 'react';

import { AdSlot } from '@/components/site/AdSlot';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { FeatureCard, HeroCard, ListCard, StandardCard } from '@/components/site/PostCard';
import { SectionHeading } from '@/components/site/SectionHeading';
import { Sidebar } from '@/components/site/Sidebar';
import { getCategories, getPosts } from '@/lib/api';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/config';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  // `absolute` skips the layout's "%s | Daily US Wire" template, which would
  // otherwise append the site name a second time.
  title: { absolute: `${SITE_NAME} - Breaking US News, Health, Sports, Crypto & Business` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [categories, latest] = await Promise.all([
    getCategories(),
    getPosts({ per_page: 13 }),
  ]);

  const posts = latest.items;
  const [hero, ...rest] = posts;
  const secondary = rest.slice(0, 4);
  const river = rest.slice(4, 10);

  if (!hero) return <EmptyState />;

  return (
    <div className="shell py-6 sm:py-8">
      {/* Lead block */}
      <section aria-label="Top stories" className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeroCard post={hero} />
        </div>
        <div className="lg:col-span-1">
          <h2 className="rule-top pt-2 font-serif text-lg font-bold uppercase text-navy-900">
            Latest
          </h2>
          <ol className="mt-4 divide-y divide-rule">
            {secondary.map((post) => (
              <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                <ListCard post={post} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER} format="leaderboard" className="mt-8" />

      {/* Main river + sidebar */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <SectionHeading title="More Top Stories" href="/news" />
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
            {river.map((post) => (
              <StandardCard key={post.id} post={post} />
            ))}
          </div>
        </div>
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </div>

      {/* One block per section */}
      <div className="mt-14 space-y-14">
        {categories.map((category, i) => (
          <Suspense key={category.id} fallback={null}>
            <CategoryBlock slug={category.slug} name={category.name} color={category.color} index={i} />
          </Suspense>
        ))}
      </div>

      {/* Newsletter */}
      <section
        id="newsletter"
        className="mt-16 overflow-hidden rounded-xl bg-navy-900 px-6 py-10 sm:px-10"
        aria-labelledby="newsletter-heading"
      >
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <p className="kicker text-flag-300">Newsletter</p>
            <h2 id="newsletter-heading" className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
              The Morning Wire
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-200">
              Everything that matters from across our eight desks, condensed into one email
              before 7am. Free, and you can unsubscribe with one click.
            </p>
          </div>
          <div className="md:justify-self-end md:w-80">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}

async function CategoryBlock({
  slug,
  name,
  color,
  index,
}: {
  slug: string;
  name: string;
  color: string;
  index: number;
}) {
  const { items } = await getPosts({ category: slug, per_page: 5 });
  if (!items.length) return null;

  const [lead, ...others] = items;

  return (
    <section aria-labelledby={`section-${slug}`}>
      <SectionHeading title={name} href={`/${slug}`} accent={color || '#03305f'} />
      <h2 id={`section-${slug}`} className="sr-only">
        {name}
      </h2>
      {/* Collapse to one column when a section has no secondary stories yet. */}
      <div className={others.length > 0 ? 'grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]' : ''}>
        <FeatureCard post={lead} />
        {others.length > 0 && (
          <ol className="divide-y divide-rule">
            {others.map((post) => (
              <li key={post.id} className="py-3.5 first:pt-0 last:pb-0">
                <ListCard post={post} />
              </li>
            ))}
          </ol>
        )}
      </div>
      {index === 1 && (
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED} format="leaderboard" className="mt-10" />
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="font-serif text-3xl font-bold text-navy-900">No articles published yet</h1>
      <p className="mt-3 max-w-md text-ink-muted">
        Sign in to the newsroom and publish your first story.
      </p>
      <Link href="/admin" className="btn-primary mt-6">
        Open the newsroom
      </Link>
    </div>
  );
}
