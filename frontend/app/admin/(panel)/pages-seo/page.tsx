'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/components/admin/Toast';
import { adminApi, type PageSeoRow } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';

export default function PagesSeoPage() {
  const { push } = useToast();
  const { can } = useAuth();
  const [rows, setRows] = useState<PageSeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .listPagesSeo()
      .then(setRows)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  function edit(slug: string, patch: Partial<PageSeoRow>) {
    setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, ...patch } : r)));
  }

  async function save(row: PageSeoRow) {
    setSavingSlug(row.slug);
    try {
      const saved = await adminApi.updatePageSeo(row.slug, {
        meta_title: row.meta_title,
        meta_description: row.meta_description,
      });
      edit(row.slug, saved);
      push('success', `${row.label} SEO saved.`);
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingSlug(null);
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading...</p>;

  const readOnly = !can('editor', 'admin');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Page SEO</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Meta title and description for the home, about and contact pages. Changes go live within a minute.
        </p>
      </div>

      {rows.map((row) => (
        <section key={row.slug} className="card space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-bold text-navy-900">{row.label}</h2>
            <code className="text-xs text-ink-muted">{row.path}</code>
          </div>
          <div>
            <label htmlFor={`${row.slug}-title`} className="label">Meta title</label>
            <input
              id={`${row.slug}-title`}
              value={row.meta_title}
              maxLength={255}
              disabled={readOnly}
              onChange={(e) => edit(row.slug, { meta_title: e.target.value })}
              className="field"
            />
            <p className="hint">{row.meta_title.length} characters - aim for 60 or fewer.</p>
          </div>
          <div>
            <label htmlFor={`${row.slug}-desc`} className="label">Meta description</label>
            <textarea
              id={`${row.slug}-desc`}
              rows={3}
              value={row.meta_description}
              maxLength={500}
              disabled={readOnly}
              onChange={(e) => edit(row.slug, { meta_description: e.target.value })}
              className="field resize-y"
            />
            <p className="hint">{row.meta_description.length} characters - aim for 160 or fewer.</p>
          </div>
          {!readOnly && (
            <button type="button" onClick={() => save(row)} disabled={savingSlug === row.slug} className="btn-primary">
              {savingSlug === row.slug ? 'Saving...' : 'Save'}
            </button>
          )}
        </section>
      ))}
    </div>
  );
}
