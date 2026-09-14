'use client';

import { useEffect, useMemo, useState } from 'react';

import { adminApi } from '@/lib/admin-api';
import { SITE_URL } from '@/lib/config';
import type { SeoAnalysis } from '@/lib/types';

interface Props {
  title: string;
  slug: string;
  categorySlug: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  content: string;
  coverImage: string;
  imageCount: number;
}

const GRADE_STYLES: Record<string, { ring: string; text: string; label: string }> = {
  good: { ring: 'stroke-emerald-500', text: 'text-emerald-700', label: 'Good' },
  ok: { ring: 'stroke-amber-500', text: 'text-amber-700', label: 'Needs work' },
  poor: { ring: 'stroke-flag-600', text: 'text-flag-700', label: 'Poor' },
};

/** Live SEO scoring + a real Google SERP preview. */
export function SeoPanel(props: Props) {
  const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);

  // Debounced so typing does not hammer the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      adminApi
        .seoAnalysis({
          title: props.title,
          meta_title: props.metaTitle,
          meta_description: props.metaDescription,
          content: props.content,
          focus_keyword: props.focusKeyword,
          cover_image: props.coverImage,
          image_count: props.imageCount,
        })
        .then(setAnalysis)
        .catch(() => setAnalysis(null));
    }, 700);
    return () => clearTimeout(timer);
  }, [
    props.title,
    props.metaTitle,
    props.metaDescription,
    props.content,
    props.focusKeyword,
    props.coverImage,
    props.imageCount,
  ]);

  const previewTitle = props.metaTitle || props.title || 'Untitled article';
  const previewDesc =
    props.metaDescription || 'Add a meta description so Google shows your own summary in results.';
  const previewUrl = useMemo(
    () => `${SITE_URL.replace(/^https?:\/\//, '')} › ${props.categorySlug || 'news'} › ${props.slug || 'article-slug'}`,
    [props.categorySlug, props.slug],
  );

  const grade = analysis ? GRADE_STYLES[analysis.grade] : GRADE_STYLES.poor;
  const circumference = 2 * Math.PI * 26;

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
              <circle cx="32" cy="32" r="26" className="fill-none stroke-rule" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r="26"
                className={`fill-none ${grade.ring} transition-[stroke-dashoffset] duration-500`}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - (analysis?.score ?? 0) / 100)}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${grade.text}`}>
              {analysis?.score ?? 0}
            </span>
          </div>
          <div>
            <p className="kicker text-ink-faint">SEO score</p>
            <p className={`font-serif text-lg font-bold ${grade.text}`}>{grade.label}</p>
            <p className="text-xs text-ink-faint">{analysis?.word_count ?? 0} words</p>
          </div>
        </div>
      </div>

      {/* SERP preview */}
      <div className="card p-4">
        <p className="kicker mb-2.5 text-ink-faint">Google preview</p>
        <div className="rounded-md border border-rule p-3">
          <p className="truncate text-xs text-[#4d5156]">{previewUrl}</p>
          <p className="mt-0.5 truncate text-[1.05rem] leading-snug text-[#1a0dab]">{previewTitle}</p>
          <p className="clamp-2 mt-0.5 text-[0.8125rem] leading-snug text-[#4d5156]">{previewDesc}</p>
        </div>
        <ul className="mt-2 flex gap-4 text-2xs text-ink-faint">
          <li className={previewTitle.length > 60 ? 'font-semibold text-flag-600' : ''}>
            Title {previewTitle.length}/60
          </li>
          <li className={props.metaDescription.length > 160 ? 'font-semibold text-flag-600' : ''}>
            Description {props.metaDescription.length}/160
          </li>
        </ul>
      </div>

      {/* Checklist */}
      <div className="card p-4">
        <p className="kicker mb-2.5 text-ink-faint">Checklist</p>
        <ul className="space-y-2">
          {(analysis?.checks ?? []).map((check) => (
            <li key={check.label} className="flex gap-2.5 text-sm">
              <span
                aria-hidden
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-2xs font-bold text-white ${
                  check.ok ? 'bg-emerald-500' : 'bg-flag-500'
                }`}
              >
                {check.ok ? '✓' : '!'}
              </span>
              <span>
                <span className="font-medium text-navy-900">{check.label}</span>
                <span className="block text-xs leading-snug text-ink-faint">{check.hint}</span>
              </span>
            </li>
          ))}
          {!analysis && <li className="text-sm text-ink-faint">Start writing to see suggestions.</li>}
        </ul>
      </div>
    </div>
  );
}
