import Link from 'next/link';

import { getCategories } from '@/lib/api';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/config';

import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';

const LEGAL = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/editorial-policy', label: 'Editorial Policy' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

export async function Footer() {
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t-4 border-flag-600 bg-navy-900 text-navy-100">
      <div className="shell grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo variant="white" width={220} className="block w-[190px]" />
          <p className="mt-4 text-sm leading-relaxed text-navy-200">{SITE_TAGLINE}</p>
          <div className="mt-5 flex gap-3">
            <SocialLink href="https://twitter.com/dailyuswire" label="X (Twitter)">
              <path d="M18.2 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H1.6l7.7-8.8L1.2 2.5h6.9l4.7 6.3 5.4-6.3Zm-1.2 17.6h1.8L7.1 4.3H5.2l11.8 15.8Z" />
            </SocialLink>
            <SocialLink href="https://facebook.com" label="Facebook">
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />
            </SocialLink>
            <SocialLink href="/rss" label="RSS feed">
              <path d="M4 11a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6v-3Zm0-7a16 16 0 0 1 16 16h-3A13 13 0 0 0 4 7V4Zm2.5 12a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
            </SocialLink>
          </div>
        </div>

        <nav aria-label="Sections">
          <h2 className="kicker text-flag-300">Sections</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/${c.slug}`} className="link-underline hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="kicker text-flag-300">Company</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-underline hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="kicker text-flag-300">The Morning Wire</h2>
          <p className="mt-4 text-sm text-navy-200">
            One email each morning with the stories that matter. No spam, unsubscribe anytime.
          </p>
          <NewsletterForm className="mt-4" />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {SITE_NAME}. All rights reserved.
          </p>
          <p>
            Independent reporting. Some links may be affiliate links; see our{' '}
            <Link href="/disclaimer" className="underline hover:text-white">
              disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-flag-600"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        {children}
      </svg>
    </a>
  );
}
