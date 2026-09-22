import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';

import { Analytics } from '@/components/site/Analytics';
import { JsonLd } from '@/components/site/JsonLd';
import { API_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/config';
import { getSiteSettings } from '@/lib/site-settings';

import './globals.css';

const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const body = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

/**
 * Site-wide metadata. The Search Console verification code and the X handle
 * come from the admin panel (Settings -> Analytics & verification / Social),
 * falling back to the NEXT_PUBLIC_* variables baked in at build time.
 */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} - Breaking US News, Health, Sports, Crypto & Business`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      'US news', 'breaking news', 'health news', 'sports news', 'entertainment news',
      'crypto news', 'business news', 'lifestyle', 'digital marketing',
    ],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    publisher: SITE_NAME,
    alternates: {
      canonical: '/',
      types: { 'application/rss+xml': [{ url: '/rss', title: `${SITE_NAME} RSS Feed` }] },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: `${SITE_NAME} - Breaking US News & Analysis`,
      description: SITE_DESCRIPTION,
      images: [{ url: '/logo.png', width: 900, height: 210, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      site: s.twitter_handle,
      creator: s.twitter_handle,
      title: `${SITE_NAME} - Breaking US News & Analysis`,
      description: SITE_DESCRIPTION,
      images: ['/logo.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
        { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      ],
      apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
    },
    manifest: '/manifest.webmanifest',
    verification: s.gsc_verification ? { google: s.gsc_verification } : undefined,
    category: 'news',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#03305f',
  colorScheme: 'light',
};

const SITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'NewsMediaOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png`, width: 900, height: 210 },
      sameAs: ['https://twitter.com/dailyuswire', 'https://facebook.com/dailyuswire'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  return (
    <html lang="en-US" className={`${display.variable} ${body.variable}`}>
      <head>
        <link rel="preconnect" href={API_URL} />
        <JsonLd data={SITE_SCHEMA} />
      </head>
      <body className="flex min-h-screen flex-col">
        {children}
        <Analytics adsenseClient={s.adsense_client} gaId={s.ga_measurement_id} />
      </body>
    </html>
  );
}
