import Link from 'next/link';

import { getCategories } from '@/lib/api';
import { CONTACT_EMAIL, SITE_NAME, SOCIAL_LINKS } from '@/lib/config';
import { getSiteSettings } from '@/lib/site-settings';

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
  const [categories, s] = await Promise.all([getCategories(), getSiteSettings()]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t-4 border-flag-600 bg-navy-900 text-navy-100">
      <div className="shell grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo variant="white" width={220} className="block w-[190px]" />
          <p className="mt-4 text-sm leading-relaxed text-navy-200">{s.site_tagline}</p>
          <div className="mt-5 flex gap-3">
            <SocialLink href={SOCIAL_LINKS.facebook} label="Facebook">
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.x} label="X (Twitter)">
              <path d="M18.2 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H1.6l7.7-8.8L1.2 2.5h6.9l4.7 6.3 5.4-6.3Zm-1.2 17.6h1.8L7.1 4.3H5.2l11.8 15.8Z" />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram">
              <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4 1.3-.1 1.6-.1 4.8-.1Zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.1-9.4a1.1 1.1 0 1 0 0 2.3 1.1 1.1 0 0 0 0-2.3Z" />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.linkedin} label="LinkedIn">
              <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.1a4.2 4.2 0 0 1 3.8-2c4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9V9Z" />
            </SocialLink>
            {s.youtube_url && (
              <SocialLink href={s.youtube_url} label="YouTube">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
              </SocialLink>
            )}
            <SocialLink href={`mailto:${CONTACT_EMAIL}`} label={`Email ${CONTACT_EMAIL}`}>
              <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm2.4.5 7.6 5.6 7.6-5.6H4.4Z" />
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
