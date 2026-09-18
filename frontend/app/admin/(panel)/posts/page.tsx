'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { StatusBadge } from '@/components/admin/PostEditor';
import { useToast } from '@/components/admin/Toast';
import { adminApi } from '@/lib/admin-api';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { Category, Paginated, Post, PostStatus } from '@/lib/types';

export default function PostsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading...</p>}>
      <PostsList />
    </Suspense>
  );
}

function PostsList() {
  const params = useSearchParams();
  const { push } = useToast();

  const [data, setData] = useState<Paginated<Post> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PostStatus | ''>((params.get('status') as PostStatus) ?? '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [q, setQ] = useState('');

  useEffect(() => {
    adminApi.listCategories().then(setCategories).catch(() => {});
  }, []);

  // Resolve a ?category=<slug> deep link from the dashboard into an id.
  useEffect(() => {
    const slug = params.get('category');
    if (slug && categories.length) {
      const match = categories.find((c) => c.slug === slug);
      if (match) setCategoryId(String(match.id));
    }
  }, [params, categories]);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listPosts({ page, status: status || undefined, category_id: categoryId || undefined, q: q || undefined })
      .then(setData)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [page, status, categoryId, q, push]);

  useEffect(() => {
    const timer = setTimeout(load, q ? 400 : 0);
    return () => clearTimeout(timer);
  }, [load, q]);

  async function remove(post: Post) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deletePost(post.id);
      push('success', 'Article deleted.');
      load();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Delete failed');
    }
  }

  async function toggleStatus(post: Post) {
    const next: PostStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await adminApi.updatePost(post.id, { status: next });
      push('success', next === 'published' ? 'Published.' : 'Moved back to draft.');
      load();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Update failed');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Articles</h1>
          <p className="mt-1 text-sm text-ink-muted">{data?.total ?? 0} total</p>
        </div>
        <Link href="/admin/posts/new" className="btn-accent btn-sm">
          + New article
        </Link>
      </div>

      <div className="card flex flex-wrap gap-3 p-3">
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search headlines..."
          className="field min-w-[12rem] flex-1"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as PostStatus | '');
          }}
          className="field w-auto"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => {
            setPage(1);
            setCategoryId(e.target.value);
          }}
          className="field w-auto"
        >
          <option value="">All sections</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-ink-muted">Loading articles...</p>}

      {!loading && data && data.items.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-sm text-ink-muted">No articles match these filters.</p>
          <Link href="/admin/posts/new" className="btn-primary btn-sm mt-4">
            Write a new article
          </Link>
        </div>
      )}

      {!loading && data && data.items.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule bg-wash text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Headline</th>
                  <th className="px-4 py-2.5 font-semibold">Section</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Views</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {data.items.map((post) => (
                  <tr key={post.id} className="hover:bg-wash/60">
                    <td className="max-w-md px-4 py-3">
                      <Link href={`/admin/posts/${post.id}`} className="font-medium text-navy-900 hover:text-flag-600">
                        {post.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-ink-faint">
                        {post.author?.name} · {post.reading_time} min
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{post.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-faint">
                      {post.published_at ? formatDateTime(post.published_at) : `edited ${timeAgo(post.updated_at)}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-muted">{post.views}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => toggleStatus(post)} className="btn-ghost btn-sm mr-1">
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(post)}
                        className="btn-sm rounded-md border border-flag-200 px-2.5 text-flag-700 hover:bg-flag-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {data.items.map((post) => (
              <li key={post.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/admin/posts/${post.id}`} className="font-medium text-navy-900">
                    {post.title}
                  </Link>
                  <StatusBadge status={post.status} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  {post.category?.name ?? '—'} · {post.views} views ·{' '}
                  {post.published_at ? formatDateTime(post.published_at) : `edited ${timeAgo(post.updated_at)}`}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href={`/admin/posts/${post.id}`} className="btn-ghost btn-sm flex-1">
                    Edit
                  </Link>
                  <button type="button" onClick={() => toggleStatus(post)} className="btn-ghost btn-sm flex-1">
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(post)}
                    className="btn-sm rounded-md border border-flag-200 px-3 text-flag-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost btn-sm">
                Previous
              </button>
              <span className="text-sm text-ink-muted">
                Page {data.page} of {data.pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="btn-ghost btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
