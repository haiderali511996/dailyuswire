import type { Metadata } from 'next';
import Link from 'next/link';

import { Prose } from '@/components/site/Prose';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Editorial Policy',
  description: `How ${SITE_NAME} sources, writes, fact-checks and corrects its reporting.`,
  alternates: { canonical: '/editorial-policy' },
};

export default function EditorialPolicyPage() {
  return (
    <Prose title="Editorial Policy" updated="September 14, 2026">
      <p>
        This page sets out how {SITE_NAME} produces its journalism. It is a working standard our
        editors hold each other to, not a marketing statement.
      </p>

      <h2>Originality</h2>
      <p>
        We publish original writing. Where a story starts from another outlet&apos;s reporting, we
        verify it independently where we can, write it in our own words, add our own analysis, and
        credit and link to the original. We do not republish other outlets&apos; article text.
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

      <h2>AI use</h2>
      <p>
        We may use software to help monitor wire feeds, transcribe audio or suggest headlines. No
        article is published without a human editor reading, verifying and taking responsibility for
        it. We do not publish machine-generated text as reporting.
      </p>

      <h2>Corrections</h2>
      <p>
        Errors of fact are corrected on the article itself with a note explaining what changed and
        when. Significant corrections are flagged at the top of the article. Report an error to{' '}
        <a href="mailto:corrections@dailyuswire.com">corrections@dailyuswire.com</a>.
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
