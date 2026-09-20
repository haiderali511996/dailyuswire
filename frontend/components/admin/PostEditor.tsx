'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import { SITE_URL, mediaUrl } from '@/lib/config';
import { toDatetimeLocal } from '@/lib/format';
import type { Category, MediaItem, Post, PostStatus, User } from '@/lib/types';

import { MediaPicker } from './MediaPicker';
import { RichTextEditor } from './RichTextEditor';
import { SeoPanel } from './SeoPanel';
import { useToast } from './Toast';

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  cover_alt: string;
  cover_caption: string;
  category_id: number | null;
  author_id: number | null;
  status: PostStatus;
  published_at: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  focus_keyword: string;
  canonical_url: string;
  og_image: string;
  no_index: boolean;
  is_featured: boolean;
  is_breaking: boolean;
  is_editors_pick: boolean;
  source_name: string;
  source_url: string;
  tags: string[];
}

const EMPTY: FormState = {
  title: '', slug: '', excerpt: '', content: '', cover_image: '', cover_alt: '', cover_caption: '',
  category_id: null, author_id: null, status: 'draft', published_at: '',
  meta_title: '', meta_description: '', meta_keywords: '', focus_keyword: '', canonical_url: '',
  og_image: '', no_index: false, is_featured: false, is_breaking: false, is_editors_pick: false,
  source_name: '', source_url: '', tags: [],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function PostEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const { push } = useToast();
  const { user, can } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<User[]>([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [coverPicking, setCoverPicking] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));

  const editorInsertRef = useRef<((url: string, alt: string) => void) | null>(null);
  const [editorPicking, setEditorPicking] = useState(false);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Load reference data + the post being edited.
  useEffect(() => {
    adminApi.listCategories().then(setCategories).catch(() => {});
    if (can('admin', 'editor')) adminApi.listUsers().then(setAuthors).catch(() => {});
  }, [can]);

  useEffect(() => {
    if (!postId) return;
    adminApi
      .getPost(postId)
      .then((post) => setForm(toForm(post)))
      .catch((e) => {
        push('error', e.message);
        router.push('/admin/posts');
      })
      .finally(() => setLoading(false));
  }, [postId, push, router]);

  // Auto-slug from the title until the editor edits the slug by hand.
  useEffect(() => {
    if (!slugTouched && form.title) set('slug', slugify(form.title));
  }, [form.title, slugTouched, set]);

  const canPublish = can('admin', 'editor') || true; // authors may publish their own work

  async function save(nextStatus?: PostStatus) {
    const status = nextStatus ?? form.status;

    if (!form.title.trim() || form.title.trim().length < 5) {
      push('error', 'Give the article a title of at least 5 characters.');
      setTab('content');
      return;
    }
    if (status !== 'draft') {
      if (!form.category_id) {
        push('error', 'Pick a category before publishing.');
        setTab('settings');
        return;
      }
      if (!form.content.trim()) {
        push('error', 'The article body is empty.');
        setTab('content');
        return;
      }
    }
    if (status === 'scheduled' && !form.published_at) {
      push('error', 'Choose a publish date and time to schedule this article.');
      setTab('settings');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      status,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      slug: form.slug || undefined,
    };

    try {
      if (postId) {
        const updated = await adminApi.updatePost(postId, payload);
        setForm(toForm(updated));
        push('success', status === 'published' ? 'Article published.' : 'Changes saved.');
      } else {
        const created = await adminApi.createPost(payload);
        push('success', status === 'published' ? 'Article published.' : 'Draft saved.');
        router.push(`/admin/posts/${created.id}`);
      }
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function addTag(raw: string) {
    const name = raw.trim().replace(/,$/, '');
    if (!name || form.tags.includes(name)) return;
    set('tags', [...form.tags, name]);
    setTagInput('');
  }

  const category = useMemo(
    () => categories.find((c) => c.id === form.category_id),
    [categories, form.category_id],
  );

  if (loading) return <p className="text-sm text-ink-muted">Loading article...</p>;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-rule bg-white px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-lg font-bold text-navy-900">
            {postId ? 'Edit article' : 'New article'}
          </h1>
          <p className="truncate text-xs text-ink-faint">
            <StatusBadge status={form.status} />
            {form.slug && (
              <span className="ml-2">
                /{category?.slug ?? 'news'}/{form.slug}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {postId && form.status === 'published' && (
            <Link
              href={`${SITE_URL}/${category?.slug ?? 'news'}/${form.slug}`}
              target="_blank"
              className="btn-ghost btn-sm"
            >
              View
            </Link>
          )}
          <button type="button" onClick={() => save('draft')} disabled={saving} className="btn-ghost btn-sm">
            Save draft
          </button>
          {form.status !== 'published' && (
            <button
              type="button"
              onClick={() => save('scheduled')}
              disabled={saving || !form.published_at}
              className="btn-ghost btn-sm"
              title={form.published_at ? 'Schedule' : 'Set a publish date in Settings first'}
            >
              Schedule
            </button>
          )}
          <button
            type="button"
            onClick={() => save('published')}
            disabled={saving || !canPublish}
            className="btn-accent btn-sm"
          >
            {saving ? 'Saving...' : form.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Editor sections" className="flex gap-1 border-b border-rule">
        {(['content', 'seo', 'settings'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize transition ${
              tab === key ? 'border-flag-600 text-flag-600' : 'border-transparent text-ink-muted hover:text-navy-900'
            }`}
          >
            {key === 'seo' ? 'SEO' : key}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {tab === 'content' && (
            <>
              <div>
                <label htmlFor="title" className="label">
                  Headline
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Write the headline readers will click"
                  className="field !text-lg !font-semibold"
                />
                <p className="hint">{form.title.length} characters. Aim for 50-70 in the H1.</p>
              </div>

              <div>
                <span className="label">Article body</span>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => set('content', html)}
                  onOpenMedia={(insert) => {
                    editorInsertRef.current = insert;
                    setEditorPicking(true);
                  }}
                />
                <p className="hint">
                  Use Heading 2 and Heading 3 for structure - H1 is reserved for the headline above.
                </p>
              </div>

            </>
          )}

          {tab === 'seo' && (
            <div className="space-y-5">
              <div>
                <label htmlFor="focus" className="label">
                  Focus keyword
                </label>
                <input
                  id="focus"
                  value={form.focus_keyword}
                  onChange={(e) => set('focus_keyword', e.target.value)}
                  placeholder="e.g. federal interest rate decision"
                  className="field"
                />
                <p className="hint">The phrase you want this article to rank for.</p>
              </div>

              <div>
                <label htmlFor="meta-title" className="label">
                  Meta title
                </label>
                <input
                  id="meta-title"
                  value={form.meta_title}
                  onChange={(e) => set('meta_title', e.target.value)}
                  placeholder={form.title || 'Defaults to the headline'}
                  maxLength={70}
                  className="field"
                />
                <p className={`hint ${form.meta_title.length > 60 ? 'text-flag-600' : ''}`}>
                  {form.meta_title.length}/60 characters
                </p>
              </div>

              <div>
                <label htmlFor="meta-desc" className="label">
                  Meta description
                </label>
                <textarea
                  id="meta-desc"
                  rows={3}
                  value={form.meta_description}
                  onChange={(e) => set('meta_description', e.target.value)}
                  placeholder="The summary Google shows under your title."
                  maxLength={200}
                  className="field resize-y"
                />
                <p className={`hint ${form.meta_description.length > 160 ? 'text-flag-600' : ''}`}>
                  {form.meta_description.length}/160 characters
                </p>
              </div>

              <div>
                <label htmlFor="slug" className="label">
                  URL slug
                </label>
                <input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                  className="field font-mono text-xs"
                />
              </div>

              <div>
                <label htmlFor="keywords" className="label">
                  Meta keywords
                </label>
                <input
                  id="keywords"
                  value={form.meta_keywords}
                  onChange={(e) => set('meta_keywords', e.target.value)}
                  placeholder="comma, separated, terms"
                  className="field"
                />
                <p className="hint">Google ignores these, but some aggregators and Bing still read them.</p>
              </div>

              <div>
                <label htmlFor="canonical" className="label">
                  Canonical URL
                </label>
                <input
                  id="canonical"
                  value={form.canonical_url}
                  onChange={(e) => set('canonical_url', e.target.value)}
                  placeholder="Leave blank unless this article is syndicated from elsewhere"
                  className="field"
                />
              </div>

              <Toggle
                checked={form.no_index}
                onChange={(v) => set('no_index', v)}
                label="Hide from search engines (noindex)"
                hint="Use for thin, duplicate or temporary pages."
              />
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="label">
                    Category
                  </label>
                  <select
                    id="category"
                    value={form.category_id ?? ''}
                    onChange={(e) => set('category_id', e.target.value ? Number(e.target.value) : null)}
                    className="field"
                  >
                    <option value="">Select a section...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {can('admin', 'editor') && (
                  <div>
                    <label htmlFor="author" className="label">
                      Byline
                    </label>
                    <select
                      id="author"
                      value={form.author_id ?? user?.id ?? ''}
                      onChange={(e) => set('author_id', e.target.value ? Number(e.target.value) : null)}
                      className="field"
                    >
                      {authors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="published" className="label">
                  Publish date &amp; time
                </label>
                <input
                  id="published"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => set('published_at', e.target.value)}
                  className="field"
                />
                <p className="hint">Set a future time and click Schedule to publish automatically.</p>
              </div>

              <div>
                <span className="label">Tags</span>
                <div className="flex flex-wrap gap-2 rounded-md border border-rule bg-white p-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => set('tags', form.tags.filter((t) => t !== tag))}
                        aria-label={`Remove ${tag}`}
                        className="text-navy-400 hover:text-flag-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag(tagInput);
                      } else if (e.key === 'Backspace' && !tagInput && form.tags.length) {
                        set('tags', form.tags.slice(0, -1));
                      }
                    }}
                    onBlur={() => addTag(tagInput)}
                    placeholder={form.tags.length ? '' : 'Type a tag and press Enter'}
                    className="min-w-[10rem] flex-1 border-0 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <fieldset className="space-y-2 rounded-lg border border-rule p-4">
                <legend className="px-1 text-sm font-semibold text-navy-900">Placement</legend>
                <Toggle checked={form.is_breaking} onChange={(v) => set('is_breaking', v)} label="Breaking news" hint="Shows in the red ticker across the site." />
                <Toggle checked={form.is_featured} onChange={(v) => set('is_featured', v)} label="Featured" hint="Eligible for the homepage hero slot." />
                <Toggle checked={form.is_editors_pick} onChange={(v) => set('is_editors_pick', v)} label="Editor's pick" />
              </fieldset>

              <fieldset className="space-y-3 rounded-lg border border-rule p-4">
                <legend className="px-1 text-sm font-semibold text-navy-900">Attribution</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={form.source_name}
                    onChange={(e) => set('source_name', e.target.value)}
                    placeholder="Source name, e.g. Reuters"
                    className="field"
                  />
                  <input
                    value={form.source_url}
                    onChange={(e) => set('source_url', e.target.value)}
                    placeholder="https://source-url"
                    className="field"
                  />
                </div>
                <p className="hint">
                  Shown at the foot of the article as a credited link when the story was informed by
                  outside reporting.
                </p>
              </fieldset>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="card p-4">
            <span className="label">Cover image</span>
            {form.cover_image ? (
              <div className="space-y-2">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-wash">
                  <Image src={mediaUrl(form.cover_image)} alt={form.cover_alt || 'Cover'} fill sizes="340px" className="object-cover" />
                </div>
                <input
                  value={form.cover_alt}
                  onChange={(e) => set('cover_alt', e.target.value)}
                  placeholder="Alt text (required)"
                  className={`field ${!form.cover_alt ? 'border-amber-400' : ''}`}
                />
                <input
                  value={form.cover_caption}
                  onChange={(e) => set('cover_caption', e.target.value)}
                  placeholder="Caption / credit"
                  className="field"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCoverPicking(true)} className="btn-ghost btn-sm flex-1">
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      set('cover_image', '');
                      set('cover_alt', '');
                    }}
                    className="btn-sm rounded-md border border-flag-200 px-3 text-flag-700 hover:bg-flag-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCoverPicking(true)}
                className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-rule bg-wash text-sm text-ink-muted transition hover:border-navy-800 hover:text-navy-800"
              >
                <svg viewBox="0 0 24 24" className="mb-1 h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                Choose a cover image
              </button>
            )}
          </div>

          <SeoPanel
            title={form.title}
            slug={form.slug}
            categorySlug={category?.slug ?? 'news'}
            metaTitle={form.meta_title}
            metaDescription={form.meta_description}
            focusKeyword={form.focus_keyword}
            content={form.content}
            coverImage={form.cover_image}
          />
        </div>
      </div>

      <MediaPicker
        open={coverPicking}
        onClose={() => setCoverPicking(false)}
        onSelect={(item: MediaItem) => {
          set('cover_image', item.url);
          if (!form.cover_alt) set('cover_alt', item.alt || form.title);
        }}
        title="Choose a cover image"
      />

      <MediaPicker
        open={editorPicking}
        onClose={() => setEditorPicking(false)}
        onSelect={(item: MediaItem) => {
          editorInsertRef.current?.(mediaUrl(item.url), item.alt || '');
        }}
        title="Insert an image into the article"
      />
    </div>
  );
}

function toForm(post: Post): FormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    cover_image: post.cover_image,
    cover_alt: post.cover_alt,
    cover_caption: post.cover_caption,
    category_id: post.category?.id ?? null,
    author_id: post.author?.id ?? null,
    status: post.status,
    published_at: toDatetimeLocal(post.published_at),
    meta_title: post.meta_title,
    meta_description: post.meta_description,
    meta_keywords: post.meta_keywords,
    focus_keyword: post.focus_keyword,
    canonical_url: post.canonical_url,
    og_image: post.og_image,
    no_index: post.no_index,
    is_featured: post.is_featured,
    is_breaking: post.is_breaking,
    is_editors_pick: post.is_editors_pick,
    source_name: post.source_name,
    source_url: post.source_url,
    tags: post.tags.map((t) => t.name),
  };
}

export function StatusBadge({ status }: { status: PostStatus }) {
  const styles: Record<PostStatus, string> = {
    published: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-amber-100 text-amber-800',
    scheduled: 'bg-navy-100 text-navy-800',
    archived: 'bg-wash text-ink-faint',
  };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-rule text-navy-800 focus:ring-navy-800"
      />
      <span>
        <span className="block text-sm font-medium text-navy-900">{label}</span>
        {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
      </span>
    </label>
  );
}
