'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/components/admin/Toast';
import { adminApi } from '@/lib/admin-api';
import type { Category } from '@/lib/types';

const BLANK = {
  name: '', slug: '', description: '', meta_title: '', meta_description: '',
  color: '#03305f', icon: '', position: 0, is_active: true,
};

export default function CategoriesPage() {
  const { push } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listCategories()
      .then(setCategories)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  useEffect(load, [load]);

  function startEdit(category: Category) {
    setEditing(category);
    setDraft({
      name: category.name, slug: category.slug, description: category.description,
      meta_title: category.meta_title, meta_description: category.meta_description,
      color: category.color, icon: category.icon, position: category.position,
      is_active: category.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditing(null);
    setDraft({ ...BLANK });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await adminApi.updateCategory(editing.id, draft);
        push('success', 'Category updated.');
      } else {
        await adminApi.createCategory(draft);
        push('success', 'Category created.');
      }
      cancel();
      load();
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await adminApi.deleteCategory(category.id);
      push('success', 'Category deleted.');
      load();
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Categories</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Each category is a top-level section with its own URL, RSS feed and meta tags.
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <h2 className="font-serif text-lg font-bold text-navy-900">
          {editing ? `Edit "${editing.name}"` : 'Add a category'}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cat-name" className="label">Name</label>
            <input id="cat-name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" />
          </div>
          <div>
            <label htmlFor="cat-slug" className="label">Slug</label>
            <input id="cat-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="auto from name" className="field font-mono text-xs" />
          </div>
        </div>

        <div>
          <label htmlFor="cat-desc" className="label">Description</label>
          <textarea id="cat-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="field resize-y" />
          <p className="hint">Shown under the section heading and used as the fallback meta description.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cat-mt" className="label">Meta title</label>
            <input id="cat-mt" value={draft.meta_title} onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })} maxLength={70} className="field" />
            <p className="hint">{draft.meta_title.length}/60</p>
          </div>
          <div>
            <label htmlFor="cat-md" className="label">Meta description</label>
            <input id="cat-md" value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} maxLength={200} className="field" />
            <p className="hint">{draft.meta_description.length}/160</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="cat-color" className="label">Accent colour</label>
            <div className="flex gap-2">
              <input id="cat-color" type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-9 w-12 shrink-0 cursor-pointer rounded border border-rule" />
              <input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="field font-mono text-xs" />
            </div>
          </div>
          <div>
            <label htmlFor="cat-pos" className="label">Nav order</label>
            <input id="cat-pos" type="number" value={draft.position} onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })} className="field" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-4 w-4 rounded border-rule text-navy-800 focus:ring-navy-800" />
              <span className="text-sm font-medium text-navy-900">Visible on the site</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary btn-sm">
            {editing ? 'Save changes' : 'Create category'}
          </button>
          {editing && (
            <button type="button" onClick={cancel} className="btn-ghost btn-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: category.color }} />
                    <span className="truncate font-serif font-bold text-navy-900">{category.name}</span>
                  </span>
                  <p className="mt-0.5 truncate font-mono text-xs text-ink-faint">/{category.slug}</p>
                </div>
                {!category.is_active && (
                  <span className="shrink-0 rounded bg-wash px-1.5 py-0.5 text-2xs font-bold uppercase text-ink-faint">
                    Hidden
                  </span>
                )}
              </div>
              <p className="clamp-2 mt-2 text-xs text-ink-muted">{category.description}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => startEdit(category)} className="btn-ghost btn-sm flex-1">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(category)}
                  className="btn-sm rounded-md border border-flag-200 px-2.5 text-flag-700 hover:bg-flag-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
