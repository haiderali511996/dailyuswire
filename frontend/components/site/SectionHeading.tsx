import Link from 'next/link';

export function SectionHeading({
  title,
  href,
  accent = '#03305f',
  cta = 'View all',
}: {
  title: string;
  href?: string;
  accent?: string;
  cta?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b-2 pb-2" style={{ borderColor: accent }}>
      <h2 className="font-serif text-xl font-bold uppercase tracking-tight text-navy-900 sm:text-2xl">
        {href ? (
          <Link href={href} className="hover:text-flag-600">
            {title}
          </Link>
        ) : (
          title
        )}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs font-semibold uppercase tracking-wide text-flag-600 hover:underline"
        >
          {cta} &rarr;
        </Link>
      )}
    </div>
  );
}
