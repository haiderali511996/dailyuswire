import Link from 'next/link';

// Scroll speed in pixels per second. A fixed duration made the ticker race
// whenever there were many or long headlines; this keeps it steady and readable.
const SPEED_PX_PER_SEC = 35;
const PX_PER_CHAR = 7.5; // text-sm average glyph width
const GAP_PX = 32; // gap-8 between headlines

export function BreakingTicker({ items }: { items: { title: string; href: string }[] }) {
  if (!items.length) return null;
  // The list is duplicated so the marquee loops without a visible seam.
  const loop = [...items, ...items];
  // One cycle scrolls through the original list once (translateX -50%).
  const distance = items.reduce((px, item) => px + item.title.length * PX_PER_CHAR + GAP_PX, 0);
  const seconds = Math.max(30, Math.round(distance / SPEED_PX_PER_SEC));

  return (
    <div className="flex items-stretch border-b border-rule bg-flag-600 text-white">
      <span className="flex shrink-0 items-center gap-2 bg-flag-700 px-3 py-2 text-2xs font-bold uppercase tracking-[0.16em] sm:px-4">
        <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-white" />
        Breaking
      </span>
      <div className="group relative flex-1 overflow-hidden">
        <ul
          className="flex w-max animate-ticker items-center gap-8 py-2 pl-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ animationDuration: `${seconds}s` }}
        >
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
