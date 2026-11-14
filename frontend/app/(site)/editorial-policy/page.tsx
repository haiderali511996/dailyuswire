import type { Metadata } from 'next';
import Link from 'next/link';

import { Prose } from '@/components/site/Prose';
import { SITE_NAME, pageOpenGraph } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Editorial Policy',
  description: `How ${SITE_NAME} sources, writes, fact-checks and corrects its reporting.`,
  alternates: { canonical: '/editorial-policy' },
  openGraph: pageOpenGraph('/editorial-policy', `Editorial Policy | ${SITE_NAME}`, `How ${SITE_NAME} sources, writes, fact-checks and corrects its reporting.`),
};

export default function EditorialPolicyPage() {
  return (
    <Prose title="Editorial Policy" updated="November 14, 2026">
      <p>
        This page sets out how {SITE_NAME} produces its articles. It is a working standard every
        article is held to, not a marketing statement.
      </p>

      <h2>Originality</h2>
      <p>
        Where a story starts from another outlet&apos;s reporting, we check it against primary
        sources where we can, write it in our own words, separate what is confirmed from what is
        only claimed, and credit and link to the original. We do not republish other outlets&apos; article text.
      </p>

      <h2>Sourcing</h2>
      <ul>
        <li>Factual claims link to a primary source: a filing, a study, a transcript, a dataset.</li>
        <li>Anonymous sourcing is used only when the information is in the public interest and cannot be obtained on the record.</li>
        <li>Studies are described with their sample size and limitations, not just their headline finding.</li>
      </ul>

      <h2>Bylines and expertise</h2>
      <p>
        Every article names its author and shows when it was published and last updated. Author
        pages list what each writer covers.
      </p>

      <h2>Review, approval and publication</h2>
      <p>
        Every article goes through two steps before it reaches readers:
      </p>
      <ol>
        <li>
          <strong>Draft.</strong> A draft is researched and written, often with the help of AI
          writing tools (see below).
        </li>
        <li>
          <strong>Author review.</strong> Our author reads the draft, checks its facts against the
          linked sources, edits it, and either rejects it or approves and publishes it.
        </li>
      </ol>
      <p>
        Nothing goes live until the author has approved it. Once an article is published, only the
        author can change it. The author is responsible for the accuracy of every published article
        and for any corrections.
      </p>

      <h2>AI use</h2>
      <p>
        We use AI writing tools to help research and draft articles. AI drafts can contain errors,
        so no article is published until our author has read it, checked its claims against the
        sources it cites, edited it and taken responsibility for it. We do not present AI-assisted
        explainers as first-hand reporting.
      </p>

      <h2>Corrections</h2>
      <p>
        Errors of fact are corrected on the article itself with a note explaining what changed and
        when. Significant corrections are flagged at the top of the article. Report an error to{' '}
        <a href="mailto:info@dailyuswire.com">info@dailyuswire.com</a>.
      </p>

      <h2>Independence</h2>
      <p>
        Advertisers and affiliate partners have no input into editorial coverage and do not see
        stories before publication. Sponsored content is clearly labelled and written separately from
        the newsroom. See our <Link href="/disclaimer">disclaimer</Link>.
      </p>
    </Prose>
  );
}
