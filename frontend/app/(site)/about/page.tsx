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
        <Link href="/sports">Sports</Link>, <Link href="/technology">Technology</Link>,{' '}
        <Link href="/entertainment">Entertainment</Link>, <Link href="/business">Business</Link>,{' '}
        <Link href="/lifestyle">Lifestyle</Link> and <Link href="/marketing">Marketing</Link>.
      </p>

      <h2>What we do</h2>
      <p>
        We cover the stories that affect how people in the United States live, work, spend and
        stay healthy. Every article is original reporting or a substantial rewrite by our editorial
        desk. We do not republish wire copy verbatim.
      </p>

      <h2>Bylines and editorial responsibility</h2>
      <p>
        Most articles are published under the &ldquo;{SITE_NAME} Staff&rdquo; desk byline. A desk
        byline does not mean nobody is accountable: every story is reviewed by an editor before it
        is published, and the editor is responsible for its accuracy and for any corrections. The
        editor&apos;s name and background are listed on the{' '}
        <Link href="/author/daily-us-wire-staff">{SITE_NAME} Staff</Link> author page. To reach the
        editor directly, write to <a href="mailto:info@dailyuswire.com">info@dailyuswire.com</a>.
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
