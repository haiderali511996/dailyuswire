import Link from 'next/link';

export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="font-medium text-navy-800 hover:text-flag-600 hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="line-clamp-1 max-w-[18rem] text-ink-muted sm:max-w-none">
                  {item.name}
                </span>
              )}
              {!last && (
                <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3 shrink-0 text-ink-faint" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
