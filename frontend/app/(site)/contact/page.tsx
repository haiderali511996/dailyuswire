import type { Metadata } from 'next';

import { Prose } from '@/components/site/Prose';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Reach the ${SITE_NAME} newsroom with news tips, corrections, advertising enquiries or general questions.`,
  alternates: { canonical: '/contact' },
};

const DESKS = [
  { label: 'Newsroom & tips', email: 'newsroom@dailyuswire.com', note: 'Story tips, press releases and embargoed material.' },
  { label: 'Corrections', email: 'corrections@dailyuswire.com', note: 'Spotted an error? We correct on the page and note the change.' },
  { label: 'Advertising', email: 'ads@dailyuswire.com', note: 'Display, sponsorship and partnership enquiries.' },
  { label: 'General', email: 'hello@dailyuswire.com', note: 'Everything else, including reader feedback.' },
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

      <h2>Postal address</h2>
      <p>
        {SITE_NAME} Editorial
        <br />
        1 Press Plaza, Suite 400
        <br />
        Washington, DC 20001
        <br />
        United States
      </p>
      <p className="text-sm text-ink-faint">
        Replace the placeholder address above with your registered business address before launch.
      </p>
    </Prose>
  );
}
