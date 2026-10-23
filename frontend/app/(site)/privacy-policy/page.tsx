import type { Metadata } from 'next';
import Link from 'next/link';

import { Prose } from '@/components/site/Prose';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses and protects your data, including cookies, analytics and advertising partners.`,
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPage() {
  return (
    <Prose title="Privacy Policy" updated="October 23, 2026">
      <p>
        This policy explains what data {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects when
        you visit this website, why we collect it, and the choices you have. By using the site you
        agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Information you give us.</strong> Anything you include when you email us or our
          author, such as your name and email address.
        </li>
        <li>
          <strong>Information collected automatically.</strong> Standard server and analytics data:
          IP address, browser and device type, referring page, pages viewed and time on page.
        </li>
        <li>
          <strong>Cookies and similar technologies.</strong> Small files used to remember
          preferences, measure traffic and serve advertising.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To deliver and improve the website and its content.</li>
        <li>To reply to messages you send us.</li>
        <li>To measure audience size and reading patterns in aggregate.</li>
        <li>To serve and measure advertising.</li>
        <li>To detect abuse, fraud and security incidents.</li>
      </ul>

      <h2>Who handles your information</h2>
      <p>
        Emails, tips, correction requests and other messages you send us are read and handled by our
        author, who reviews, approves and publishes the articles on this site. Our editors, who write
        articles and submit them to the author for review, may see a message when it relates to a
        story they are working on. We do not publish your
        name, email address or other personal details from a message without your permission.
      </p>

      <h2>Advertising and Google AdSense</h2>
      <p>
        We use third-party advertising companies, including Google, to serve ads when you visit this
        site. Third-party vendors, including Google, use cookies to serve ads based on your prior
        visits to this and other websites.
      </p>
      <ul>
        <li>
          Google&apos;s use of advertising cookies enables it and its partners to serve ads to you
          based on your visit to this site and/or other sites on the internet.
        </li>
        <li>
          You may opt out of personalised advertising by visiting{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          .
        </li>
        <li>
          You can opt out of third-party vendor cookies at{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            aboutads.info/choices
          </a>
          .
        </li>
        <li>
          Read how Google uses data from sites that use its services at{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            policies.google.com/technologies/partner-sites
          </a>
          .
        </li>
      </ul>

      <h2>Analytics</h2>
      <p>
        We use Google Analytics to understand how the site is used. It sets cookies and processes
        data such as page views and approximate location. IP anonymisation is enabled. You can
        prevent this with the{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
          Google Analytics opt-out browser add-on
        </a>
        .
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, or restrict
        processing of your personal data, and to object to it or receive a portable copy. Residents
        of California (CCPA/CPRA) may request disclosure of the categories of personal information
        collected and may opt out of its &ldquo;sale&rdquo; or &ldquo;sharing&rdquo;. Residents of
        the EEA and UK have equivalent rights under the GDPR. To exercise any of these, email{' '}
        <a href="mailto:info@dailyuswire.com">info@dailyuswire.com</a>.
      </p>

      <h2>Children</h2>
      <p>
        This site is not directed at children under 13 and we do not knowingly collect personal
        information from them. If you believe a child has provided us with data, contact us and we
        will delete it.
      </p>

      <h2>Data retention and security</h2>
      <p>
        We keep emails you send us only as long as needed to handle them, and analytics data for
        no longer than 26 months. Data is transmitted over HTTPS and access is limited to our
        author, our editors and the staff who need it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We will post any changes on this page and update the date above. Material changes will be
        announced on the homepage.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href="mailto:info@dailyuswire.com">info@dailyuswire.com</a>,
        or use our <Link href="/contact">contact page</Link>.
      </p>
    </Prose>
  );
}
