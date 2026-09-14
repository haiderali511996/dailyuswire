import type { Metadata } from 'next';
import Link from 'next/link';

import { Prose } from '@/components/site/Prose';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Who we are, what we cover and how ${SITE_NAME} reports the news across eight desks.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <Prose title={`About ${SITE_NAME}`}>
      <p>
        {SITE_NAME} is an independent digital newsroom publishing original reporting and analysis
        across eight desks: <Link href="/news">News</Link>, <Link href="/health">Health</Link>,{' '}
        <Link href="/sports">Sports</Link>, <Link href="/entertainment">Entertainment</Link>,{' '}
        <Link href="/crypto">Crypto</Link>, <Link href="/business">Business</Link>,{' '}
        <Link href="/lifestyle">Lifestyle</Link> and <Link href="/marketing">Marketing</Link>.
      </p>

      <h2>What we do</h2>
      <p>
        We cover the stories that affect how people in the United States live, work, spend and
        stay healthy. Every article is written or substantially rewritten by a named member of our
        editorial team. We do not republish wire copy verbatim.
      </p>

      <h2>How we work</h2>
      <ul>
        <li>Every story carries a byline, a publication date and a visible update history.</li>
        <li>Claims of fact are linked to primary sources wherever one exists.</li>
        <li>Corrections are made on the page itself, with the change noted.</li>
        <li>Sponsored or affiliate content is labelled as such before the reader reaches it.</li>
      </ul>
      <p>
        Our full standards are set out in our <Link href="/editorial-policy">editorial policy</Link>.
      </p>

      <h2>How we are funded</h2>
      <p>
        {SITE_NAME} is funded by display advertising and, on some pages, affiliate links. Advertising
        is sold and served independently of the newsroom, and no advertiser sees or approves
        editorial content before publication. See our <Link href="/disclaimer">disclaimer</Link> for
        details.
      </p>

      <h2>Get in touch</h2>
      <p>
        News tips, corrections, and partnership enquiries are all welcome on our{' '}
        <Link href="/contact">contact page</Link>.
      </p>
    </Prose>
  );
}
