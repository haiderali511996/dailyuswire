import Link from 'next/link';

export function BreakingTicker({ items }: { items: { title: string; href: string }[] }) {
  if (!items.length) return null;
  // The list is duplicated so the marquee loops without a visible seam.
  const loop = [...items, ...items];

  return (
    <div className="flex items-stretch border-b border-rule bg-flag-600 text-white">
      <span className="flex shrink-0 items-center gap-2 bg-flag-700 px-3 py-2 text-2xs font-bold uppercase tracking-[0.16em] sm:px-4">
        <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-white" />
        Breaking
      </span>
      <div className="group relative flex-1 overflow-hidden">
        <ul className="flex w-max animate-ticker items-center gap-8 py-2 pl-4 group-hover:[animation-play-state:paused]">
          {loop.map((item, i) => (
            <li key={`${item.href}-${i}`} className="shrink-0 text-sm">
              <Link href={item.href} className="hover:underline" aria-hidden={i >= items.length} tabIndex={i >= items.length ? -1 : 0}>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
