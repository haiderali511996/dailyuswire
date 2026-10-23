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
    <Prose title="Editorial Policy" updated="October 23, 2026">
      <p>
        This page sets out how {SITE_NAME} produces its journalism. It is a working standard our
        editors and author hold every article to, not a marketing statement.
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

      <h2>Review, approval and publication</h2>
      <p>
        Every article goes through two steps before it reaches readers:
      </p>
      <ol>
        <li>
          <strong>Editor submits for review.</strong> Our editors write and research articles and
          submit them for review. An editor cannot publish an article.
        </li>
        <li>
          <strong>Author approves and publishes.</strong> Our author reads each submitted article,
          checks its facts and sources, and either sends it back for changes or approves and
          publishes it.
        </li>
      </ol>
      <p>
        Nothing goes live until the author has approved it. Once an article is published, only the
        author can change it. The author is responsible for the accuracy of every published article
        and for any corrections.
      </p>

      <h2>AI use</h2>
      <p>
        We may use software to help monitor wire feeds, transcribe audio or suggest headlines. No
        article is published without our author reading, verifying, approving and taking
        responsibility for it. We do not publish machine-generated text as reporting.
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
