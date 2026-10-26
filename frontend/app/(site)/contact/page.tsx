import type { Metadata } from 'next';

import { Prose } from '@/components/site/Prose';
import { getPageSeo } from '@/lib/api';
import { SITE_NAME, pageOpenGraph } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo('contact');
  const title = seo?.title || 'Contact Us';
  const description =
    seo?.description ||
    `Get in touch with the ${SITE_NAME} team with questions, feedback or enquiries.`;
  return {
    title,
    description,
    alternates: { canonical: '/contact' },
    openGraph: pageOpenGraph('/contact', `${title} | ${SITE_NAME}`, description),
  };
}

const DESKS = [
  { label: 'Information', email: 'info@dailyuswire.com', note: 'General information about Daily US Wire and our coverage.' },
];

export default function ContactPage() {
  return (
    <Prose title="Contact Us">
      <p>
        We read everything that comes in and aim to reply to editorial enquiries within two business
        days.
      </p>

      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        {DESKS.map((desk) => (
          <div key={desk.email} className="card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-flag-600">{desk.label}</h2>
            <a
              href={`mailto:${desk.email}`}
              className="mt-1.5 block font-semibold text-navy-800 underline decoration-flag-600/40 underline-offset-2 hover:decoration-flag-600"
            >
              {desk.email}
            </a>
            <p className="mt-1.5 text-sm text-ink-muted">{desk.note}</p>
          </div>
        ))}
      </div>
    </Prose>
  );
}
