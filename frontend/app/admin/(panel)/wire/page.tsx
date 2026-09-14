'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/components/admin/Toast';
import { adminApi } from '@/lib/admin-api';
import { timeAgo } from '@/lib/format';
import type { Category, FeedItem, FeedSource } from '@/lib/types';

export default function WirePage() {
  const { push } = useToast();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.listWireItems({ per_page: 60, only_pending: true, ...(filter ? { category_slug: filter } : {}) }),
      adminApi.listSources(),
      adminApi.listCategories(),
    ])
      .then(([i, s, c]) => {
        setItems(i);
        setSources(s);
        setCategories(c);
      })
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [filter, push]);

  useEffect(load, [load]);

  async function pull() {
    setFetching(true);
    try {
      const result = await adminApi.fetchWire();
      push(
        result.errors.length ? 'info' : 'success',
        `Checked ${result.sources_checked} feeds, ${result.new_items} new headlines.` +
          (result.errors.length ? ` ${result.errors.length} feed(s) failed.` : ''),
      );
      result.errors.forEach((err) => push('error', err));
      setSelected(new Set());
      load();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setFetching(false);
    }
  }

  async function importSelected() {
    if (!selected.size) return;
    setImporting(true);
    try {
      const drafts = await adminApi.importWireItems([...selected]);
      push('success', `Created ${drafts.length} draft${drafts.length === 1 ? '' : 's'} - rewrite before publishing.`);
      setSelected(new Set());
      load();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">News Wire</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Headlines pulled from public RSS feeds. Select the ones worth covering and import them as
            drafts.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowSources((v) => !v)} className="btn-ghost btn-sm">
            {showSources ? 'Hide' : 'Manage'} sources ({sources.length})
          </button>
          <button type="button" onClick={pull} disabled={fetching} className="btn-primary btn-sm">
            {fetching ? 'Pulling...' : 'Pull latest'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <strong>Imported items are always drafts.</strong> They carry the publisher&apos;s own
        headline and syndicated summary plus a link back, never their article text. Rewrite the body
        in your own words before publishing &mdash; copied content breaks copyright and is an
        automatic Google AdSense rejection.
      </div>

      {showSources && <SourceManager sources={sources} categories={categories} onChange={load} />}

      <div className="card flex flex-wrap items-center gap-3 p-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field w-auto">
          <option value="">All sections</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-ink-muted">
          {items.length} pending · {selected.size} selected
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)))}
            className="btn-ghost btn-sm"
          >
            {selected.size === items.length && items.length > 0 ? 'Clear' : 'Select all'}
          </button>
          <button type="button" onClick={importSelected} disabled={!selected.size || importing} className="btn-accent btn-sm">
            {importing ? 'Importing...' : `Import ${selected.size || ''} as drafts`}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading the wire...</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-ink-muted">
            Nothing pending. Hit &ldquo;Pull latest&rdquo; to check the feeds for new headlines.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const checked = selected.has(item.id);
            return (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                    checked ? 'border-navy-800 bg-navy-50' : 'border-rule bg-white hover:border-navy-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-rule text-navy-800 focus:ring-navy-800"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-navy-900">{item.title}</p>
                    {item.summary && <p className="clamp-2 mt-1 text-sm text-ink-muted">{item.summary}</p>}
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
                      <span className="font-semibold uppercase tracking-wide text-flag-600">
                        {item.category_slug}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{item.source?.name}</span>
                      <span aria-hidden>·</span>
                      <span>{timeAgo(item.published_at)}</span>
                      {item.link && (
                        <>
                          <span aria-hidden>·</span>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-navy-800 underline hover:text-flag-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Read original
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SourceManager({
  sources,
  categories,
  onChange,
}: {
  sources: FeedSource[];
  categories: Category[];
  onChange: () => void;
}) {
  const { push } = useToast();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? 'news');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.addSource({ name, url, category_slug: categorySlug, homepage: '', is_active: true });
      push('success', 'Feed added.');
      setName('');
      setUrl('');
      onChange();
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Could not add feed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(source: FeedSource) {
    if (!window.confirm(`Remove ${source.name}?`)) return;
    try {
      await adminApi.deleteSource(source.id);
      push('success', 'Feed removed.');
      onChange();
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Could not remove feed');
    }
  }

  return (
    <div className="card p-4">
      <h2 className="font-serif text-lg font-bold text-navy-900">Feed sources</h2>
      <p className="mt-1 text-xs text-ink-faint">
        Only add feeds a publisher offers openly for syndication. Always keep the source link.
      </p>

      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto_auto]">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Publisher name" className="field" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} required type="url" placeholder="https://example.com/feed" className="field" />
        <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="field w-auto">
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy} className="btn-primary btn-sm">
          Add
        </button>
      </form>

      <ul className="mt-4 divide-y divide-rule">
        {sources.map((source) => (
          <li key={source.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy-900">
                {source.name}{' '}
                <span className="ml-1 rounded bg-wash px-1.5 py-0.5 text-2xs uppercase text-ink-faint">
                  {source.category_slug}
                </span>
              </p>
              <p className="truncate text-xs text-ink-faint">{source.url}</p>
              {source.last_status && (
                <p className={`text-2xs ${source.last_status.startsWith('error') ? 'text-flag-600' : 'text-emerald-700'}`}>
                  {source.last_status} · {timeAgo(source.last_fetched_at)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(source)}
              className="btn-sm shrink-0 rounded-md border border-flag-200 px-2.5 text-flag-700 hover:bg-flag-50"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-ink-faint">
        Need ideas? See the default list in{' '}
        <Link href="/admin/settings" className="underline">
          settings
        </Link>
        .
      </p>
    </div>
  );
}
