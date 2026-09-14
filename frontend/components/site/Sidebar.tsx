import Link from 'next/link';

import { getTags, getTrending } from '@/lib/api';

import { AdSlot } from './AdSlot';
import { ListCard } from './PostCard';

export async function Sidebar({ className = '' }: { className?: string }) {
  const [trending, tags] = await Promise.all([getTrending(6), getTags(18)]);

  return (
    <aside className={`space-y-8 ${className}`}>
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR} format="rectangle" className="!my-0" />

      {trending.length > 0 && (
        <section aria-labelledby="trending-heading">
          <h2 id="trending-heading" className="rule-top pt-2 font-serif text-lg font-bold uppercase text-navy-900">
            Most Read
          </h2>
          <ol className="mt-4 space-y-4">
            {trending.map((post, i) => (
              <li key={post.id}>
                <ListCard post={post} index={i} showImage={false} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {tags.length > 0 && (
        <section aria-labelledby="topics-heading">
          <h2 id="topics-heading" className="rule-top pt-2 font-serif text-lg font-bold uppercase text-navy-900">
            Topics
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link
                  href={`/tag/${tag.slug}`}
                  className="inline-block rounded-full border border-rule bg-wash px-3 py-1 text-xs font-medium text-ink-muted transition hover:border-navy-800 hover:bg-navy-800 hover:text-white"
                >
                  #{tag.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg bg-navy-900 p-5 text-white">
        <h2 className="font-serif text-lg font-bold">Get the Morning Wire</h2>
        <p className="mt-1.5 text-sm text-navy-200">
          The day&apos;s essential stories, in your inbox before 7am.
        </p>
        <Link
          href="/#newsletter"
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-flag-600 text-sm font-semibold transition hover:bg-flag-700"
        >
          Subscribe free
        </Link>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_2} format="sidebar" className="!my-0" />
    </aside>
  );
}
