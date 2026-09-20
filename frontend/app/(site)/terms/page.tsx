import type { Metadata } from 'next';
import Link from 'next/link';

import { Prose } from '@/components/site/Prose';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms that govern your use of ${SITE_NAME}.`,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <Prose title="Terms of Service" updated="September 14, 2026">
      <p>
        These terms govern your use of {SITE_NAME}. By accessing the site you accept them. If you do
        not agree, please do not use the site.
      </p>

      <h2>Use of the site</h2>
      <p>
        You may read, link to and share our articles for personal, non-commercial use. You may not
        republish, scrape, resell or systematically copy our content without written permission.
        Automated access that degrades service for other readers is prohibited.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All original text, photography, graphics, logos and the {SITE_NAME} name are our property or
        used under licence, and are protected by copyright and trademark law. Short quotations with
        clear attribution and a link back are welcome.
      </p>

      <h2>User submissions</h2>
      <p>
        If you send us a tip, letter or comment, you grant us a non-exclusive, royalty-free licence
        to publish and edit it. Do not send us anything you do not have the right to share.
      </p>

      <h2>Third-party links</h2>
      <p>
        We link to external sites for context. We do not control them and are not responsible for
        their content, policies or practices.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        The site is provided &ldquo;as is&rdquo;. We work hard on accuracy but do not warrant that
        content is complete, current or error-free. See our{' '}
        <Link href="/disclaimer">disclaimer</Link> for what our content is and is not.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} is not liable for any indirect,
        incidental or consequential damages arising from your use of the site.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use of the site after a change means you accept the
        revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href="mailto:info@dailyuswire.com">info@dailyuswire.com</a>.
      </p>
    </Prose>
  );
}
