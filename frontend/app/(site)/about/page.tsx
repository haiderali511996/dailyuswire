import type { Metadata } from 'next';
import Link from 'next/link';

import { Prose } from '@/components/site/Prose';
import { getPageSeo } from '@/lib/api';
import { SITE_NAME, pageOpenGraph } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo('about');
  const title = seo?.title || 'About Us';
  const description =
    seo?.description ||
    `Who we are, what we cover and how ${SITE_NAME} reports the news across eight desks.`;
  return {
    title,
    description,
    alternates: { canonical: '/about' },
    openGraph: pageOpenGraph('/about', `${title} | ${SITE_NAME}`, description),
  };
}

export default function AboutPage() {
  return (
    <Prose title={`About ${SITE_NAME}`}>
      <p>
        {SITE_NAME} is a small independent news site publishing explainers and analysis across
        eight sections: <Link href="/news">News</Link>, <Link href="/health">Health</Link>,{' '}
        <Link href="/sports">Sports</Link>, <Link href="/technology">Technology</Link>,{' '}
        <Link href="/entertainment">Entertainment</Link>, <Link href="/business">Business</Link>,{' '}
        <Link href="/lifestyle">Lifestyle</Link> and <Link href="/marketing">Marketing</Link>.
      </p>

      <h2>What we do</h2>
      <p>
        We cover the stories that affect how people in the United States live, work, spend and
        stay healthy. Most of our stories start from news first reported elsewhere; we explain what
        is confirmed, what is still unclear and what it means for readers, and we credit and link to
        the outlets and primary sources we rely on. We do not republish other outlets&apos; text.
      </p>

      <h2>Bylines and editorial responsibility</h2>
      <p>
        Articles are published under the byline of Ahmad Iftikhar, who runs the site. Drafts are
        prepared with the help of AI writing tools; Ahmad checks each one against its sources, edits
        it and decides whether it is published. He is responsible for its accuracy and for any
        corrections. Every byline links to the
        author&apos;s page, which collects all of their work:{' '}
        <Link href="/author/ahmad-iftikhar">Ahmad Iftikhar</Link>. To reach the author,
        write to <a href="mailto:info@dailyuswire.com">info@dailyuswire.com</a>.
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
