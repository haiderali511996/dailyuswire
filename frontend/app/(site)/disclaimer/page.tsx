import type { Metadata } from 'next';
import Link from 'next/link';

import { Prose } from '@/components/site/Prose';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: `Editorial, medical, financial and affiliate disclaimers for ${SITE_NAME}.`,
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <Prose title="Disclaimer" updated="September 14, 2026">
      <h2>General</h2>
      <p>
        Everything published on {SITE_NAME} is for general information only. We make reasonable
        efforts to be accurate and current, but we make no warranty of completeness or accuracy, and
        we are not liable for any loss arising from reliance on our content.
      </p>

      <h2>Health content is not medical advice</h2>
      <p>
        Articles in our <Link href="/health">Health</Link> section are journalism, not medical
        advice, diagnosis or treatment. Always seek the advice of a physician or other qualified
        health provider with any questions about a medical condition. Never disregard professional
        medical advice or delay seeking it because of something you read here.
      </p>

      <h2>Crypto and business content is not financial advice</h2>
      <p>
        Articles in our <Link href="/crypto">Crypto</Link> and{' '}
        <Link href="/business">Business</Link> sections are for information only and are not
        investment, tax or legal advice, and not a recommendation to buy or sell any asset.
        Cryptocurrency is volatile and you can lose your entire investment. Do your own research and
        consult a licensed adviser before investing.
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        Some articles contain affiliate links. If you buy through one, we may earn a commission at no
        extra cost to you. Affiliate relationships never determine what we cover or what we
        conclude, and any affiliate content is labelled.
      </p>

      <h2>Advertising</h2>
      <p>
        We display third-party advertising, including Google AdSense. Ads are selected
        programmatically and their presence is not an endorsement. Advertising is kept separate from
        editorial decisions.
      </p>

      <h2>External links</h2>
      <p>
        We link out to sources and further reading. We are not responsible for the content or
        practices of external sites.
      </p>

      <h2>Corrections</h2>
      <p>
        If you believe we have published something inaccurate, email{' '}
        <a href="mailto:info@dailyuswire.com">info@dailyuswire.com</a>. We correct on
        the page and note what changed.
      </p>
    </Prose>
  );
}
