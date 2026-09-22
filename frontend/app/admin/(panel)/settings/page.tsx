'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/components/admin/Toast';
import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import { SITE_URL } from '@/lib/config';

interface Field {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'textarea';
}

const GROUPS: { title: string; blurb: string; fields: Field[] }[] = [
  {
    title: 'Site identity',
    blurb: 'Used in meta tags, the RSS channel and structured data.',
    fields: [
      { key: 'site_name', label: 'Site name' },
      { key: 'site_tagline', label: 'Tagline', type: 'textarea' },
      { key: 'contact_email', label: 'Contact email' },
    ],
  },
  {
    title: 'Google AdSense',
    blurb: 'Leave the publisher ID blank until your AdSense application is approved - ad slots render nothing without it. Changes go live on the site within a minute of saving.',
    fields: [
      { key: 'adsense_client', label: 'Publisher ID', placeholder: 'ca-pub-0000000000000000', hint: 'Find it in AdSense under Account → Settings.' },
      { key: 'adsense_slot_header', label: 'Home page leaderboard slot ID', placeholder: '1234567890', hint: 'Below the lead stories on the home page.' },
      { key: 'adsense_slot_in_feed', label: 'Home page in-feed slot ID', placeholder: '1234567890', hint: 'Between the section blocks on the home page.' },
      { key: 'adsense_slot_in_article', label: 'In-article slot ID', placeholder: '1234567890', hint: 'Dropped automatically after the third paragraph.' },
      { key: 'adsense_slot_footer', label: 'End-of-article slot ID', placeholder: '1234567890', hint: 'After the article body and on section pages.' },
      { key: 'adsense_slot_sidebar', label: 'Sidebar slot ID', placeholder: '1234567890' },
      { key: 'adsense_slot_sidebar_2', label: 'Sidebar sticky slot ID', placeholder: '1234567890', hint: 'The tall unit that stays in view while scrolling.' },
    ],
  },
  {
    title: 'Analytics & verification',
    blurb: 'Connect Search Console and Analytics to track indexing and traffic.',
    fields: [
      { key: 'ga_measurement_id', label: 'GA4 measurement ID', placeholder: 'G-XXXXXXXXXX' },
      { key: 'gsc_verification', label: 'Search Console verification code', hint: 'The content value from the HTML tag method, e.g. AbC123... - not the whole <meta> tag. Live on the site within a minute of saving.' },
    ],
  },
  {
    title: 'Social',
    blurb: 'Linked in the footer and used in Twitter card tags.',
    fields: [
      { key: 'twitter_handle', label: 'X / Twitter handle', placeholder: '@dailyuswire' },
      { key: 'facebook_url', label: 'Facebook page URL' },
      { key: 'youtube_url', label: 'YouTube channel URL' },
    ],
  },
];

export default function SettingsPage() {
  const { push } = useToast();
  const { can } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .getSettings()
      .then(setValues)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await adminApi.putSettings(Object.entries(values).map(([key, value]) => ({ key, value })));
      setValues(saved);
      push('success', 'Settings saved.');
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!can('admin')) {
    return (
      <div className="card p-6">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Settings</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Site settings are available to admins only.
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading settings...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Site-wide configuration for SEO, ads and analytics.
        </p>
      </div>

      <div className="rounded-lg border border-navy-200 bg-navy-50 p-4 text-sm text-navy-900">
        <p className="font-semibold">Values here are stored in the database for reference.</p>
        <p className="mt-1 leading-relaxed">
          The front end reads AdSense and Analytics IDs from environment variables at build time, so
          also set <code className="rounded bg-white px-1 py-0.5 text-xs">NEXT_PUBLIC_ADSENSE_CLIENT</code>,{' '}
          <code className="rounded bg-white px-1 py-0.5 text-xs">NEXT_PUBLIC_GA_ID</code> and the slot
          variables in the frontend&apos;s <code className="rounded bg-white px-1 py-0.5 text-xs">.env</code>, then redeploy.
        </p>
      </div>

      <form onSubmit={save} className="space-y-5">
        {GROUPS.map((group) => (
          <fieldset key={group.title} className="card p-5">
            <legend className="sr-only">{group.title}</legend>
            <h2 className="font-serif text-lg font-bold text-navy-900">{group.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{group.blurb}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label htmlFor={field.key} className="label">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      rows={2}
                      value={values[field.key] ?? ''}
                      onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                      className="field resize-y"
                    />
                  ) : (
                    <input
                      id={field.key}
                      value={values[field.key] ?? ''}
                      onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="field"
                    />
                  )}
                  {field.hint && <p className="hint">{field.hint}</p>}
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>

      <section className="card p-5">
        <h2 className="font-serif text-lg font-bold text-navy-900">SEO endpoints</h2>
        <p className="mt-1 text-sm text-ink-muted">Submit these to Google Search Console and Bing Webmaster Tools.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {['/sitemap.xml', '/news-sitemap.xml', '/robots.txt', '/rss'].map((path) => (
            <li key={path} className="flex items-center justify-between gap-3 rounded-md bg-wash px-3 py-2">
              <code className="truncate font-mono text-xs text-navy-900">
                {SITE_URL}
                {path}
              </code>
              <a href={path} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-flag-600 hover:underline">
                Open
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
