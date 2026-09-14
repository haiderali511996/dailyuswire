'use client';

import Image from 'next/image';
import { useState } from 'react';

import { mediaUrl } from '@/lib/config';
import type { MediaItem, PostImage } from '@/lib/types';

import { MediaPicker } from './MediaPicker';

const MAX = 5;
const MIN = 3;

/** Manages the 3-5 supporting images every article carries. */
export function ImageSet({
  images,
  onChange,
}: {
  images: PostImage[];
  onChange: (next: PostImage[]) => void;
}) {
  const [picking, setPicking] = useState(false);

  function add(item: MediaItem) {
    if (images.length >= MAX) return;
    onChange([
      ...images,
      { url: item.url, alt: item.alt || '', caption: '', credit: '', position: images.length },
    ]);
  }

  function update(index: number, patch: Partial<PostImage>) {
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index).map((img, i) => ({ ...img, position: i })));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((img, i) => ({ ...img, position: i })));
  }

  const short = images.length < MIN;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label mb-0">Article images ({images.length}/{MAX})</span>
        <button
          type="button"
          onClick={() => setPicking(true)}
          disabled={images.length >= MAX}
          className="btn-ghost btn-sm"
        >
          + Add image
        </button>
      </div>
      <p className={`mb-3 text-xs ${short ? 'text-amber-700' : 'text-ink-faint'}`}>
        {short
          ? `Add at least ${MIN} images with descriptive alt text - it helps image search and keeps readers on the page.`
          : 'Alt text is used by screen readers and Google Images. Describe what is happening, not just what it is.'}
      </p>

      <ul className="space-y-3">
        {images.map((img, i) => (
          <li key={`${img.url}-${i}`} className="flex gap-3 rounded-lg border border-rule bg-white p-3">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded bg-wash">
              <Image src={mediaUrl(img.url)} alt={img.alt || `Image ${i + 1}`} fill sizes="120px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={img.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                placeholder="Alt text (required)"
                className={`field ${!img.alt ? 'border-amber-400' : ''}`}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={img.caption}
                  onChange={(e) => update(i, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className="field"
                />
                <input
                  value={img.credit}
                  onChange={(e) => update(i, { credit: e.target.value })}
                  placeholder="Credit, e.g. Reuters"
                  className="field"
                />
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="btn-ghost btn-sm !px-2">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move down" className="btn-ghost btn-sm !px-2">
                ↓
              </button>
              <button type="button" onClick={() => remove(i)} aria-label="Remove image" className="btn-sm rounded-md border border-flag-200 px-2 text-flag-700 hover:bg-flag-50">
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>

      <MediaPicker open={picking} onClose={() => setPicking(false)} onSelect={add} title="Add an article image" />
    </div>
  );
}
