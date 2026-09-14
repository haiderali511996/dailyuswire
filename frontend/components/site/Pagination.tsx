import Link from 'next/link';

/** Server-rendered pagination - crawlable <a> links, no client JS. */
export function Pagination({
  page,
  pages,
  basePath,
  searchParams = {},
}: {
  page: number;
  pages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set('page', String(p));
    else params.delete('page');
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const windowed = pageWindow(page, pages);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className="btn-ghost btn-sm">
          &larr; Prev
        </Link>
      )}
      {windowed.map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-ink-faint">
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 text-sm font-semibold transition ${
              p === page ? 'bg-navy-800 text-white' : 'border border-rule bg-white text-ink hover:bg-wash'
            }`}
          >
            {p}
          </Link>
        ),
      )}
      {page < pages && (
        <Link href={href(page + 1)} rel="next" className="btn-ghost btn-sm">
          Next &rarr;
        </Link>
      )}
    </nav>
  );
}

function pageWindow(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  if (page > 3) out.push(null);
  for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p += 1) out.push(p);
  if (page < pages - 2) out.push(null);
  out.push(pages);
  return out;
}
