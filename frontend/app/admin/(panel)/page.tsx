'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/admin/Toast';
import { adminApi } from '@/lib/admin-api';
import { compactNumber, timeAgo } from '@/lib/format';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  if (loading) return <p className="text-sm text-ink-muted">Loading dashboard...</p>;
  if (!stats) return <p className="text-sm text-ink-muted">Could not load stats.</p>;

  const maxCount = Math.max(1, ...stats.per_category.map((c) => c.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">Everything across the eight desks at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Published" value={stats.published} href="/admin/posts?status=published" tone="emerald" />
        <Stat label="Drafts" value={stats.drafts} href="/admin/posts?status=draft" tone="amber" />
        <Stat label="Scheduled" value={stats.scheduled} href="/admin/posts?status=scheduled" tone="navy" />
        <Stat label="Total views" value={stats.total_views} format tone="flag" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-serif text-lg font-bold text-navy-900">Articles by section</h2>
          <ul className="mt-4 space-y-3">
            {stats.per_category.map((c) => (
              <li key={c.slug}>
                <div className="flex items-center justify-between text-sm">
                  <Link href={`/admin/posts?category=${c.slug}`} className="font-medium text-navy-900 hover:text-flag-600">
                    {c.name}
                  </Link>
                  <span className="tabular-nums text-ink-faint">{c.count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-wash">
                  <div
                    className="h-full rounded-full bg-navy-800"
                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-navy-900">Recently edited</h2>
            <Link href="/admin/posts" className="text-xs font-semibold text-flag-600 hover:underline">
              All articles &rarr;
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-rule">
            {stats.recent.map((post) => (
              <li key={post.id} className="py-2.5 first:pt-0">
                <Link href={`/admin/posts/${post.id}`} className="block hover:text-flag-600">
                  <p className="clamp-2 text-sm font-medium text-navy-900">{post.title}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {post.category?.name ?? 'Uncategorised'} · {timeAgo(post.published_at)}
                  </p>
                </Link>
              </li>
            ))}
            {stats.recent.length === 0 && <li className="py-3 text-sm text-ink-muted">Nothing yet.</li>}
          </ul>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="font-serif text-lg font-bold text-navy-900">Audience</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Mini label="Total articles" value={stats.total_posts} />
          <Mini label="Newsletter subscribers" value={stats.subscribers} />
        </div>
      </section>
    </div>
  );
}

const TONES: Record<string, string> = {
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  navy: 'text-navy-800',
  flag: 'text-flag-600',
};

function Stat({
  label,
  value,
  href,
  format,
  tone = 'navy',
}: {
  label: string;
  value: number;
  href?: string;
  format?: boolean;
  tone?: string;
}) {
  const body = (
    <div className="card p-5 transition hover:shadow-pop">
      <p className="kicker text-ink-faint">{label}</p>
      <p className={`mt-2 font-serif text-3xl font-bold tabular-nums ${TONES[tone]}`}>
        {format ? compactNumber(value) : value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-wash p-4">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-navy-900">{value}</p>
    </div>
  );
}
