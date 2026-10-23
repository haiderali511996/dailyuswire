
import { getTrending } from '@/lib/api';

import { AdSlot } from './AdSlot';
import { ListCard } from './PostCard';

export async function Sidebar({ className = '' }: { className?: string }) {
  const trending = await getTrending(6);

  return (
    <aside className={`space-y-8 ${className}`}>
      <AdSlot name="sidebar" format="rectangle" className="!my-0" />

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

      <AdSlot name="sidebar_2" format="sidebar" className="!my-0" />
    </aside>
  );
}
