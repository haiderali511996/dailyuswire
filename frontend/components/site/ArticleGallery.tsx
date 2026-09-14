'use client';

import Image from 'next/image';
import { useState } from 'react';

import { mediaUrl } from '@/lib/config';
import type { PostImage } from '@/lib/types';

/** The 3-5 supporting images attached to an article, with a lightbox. */
export function ArticleGallery({ images, title }: { images: PostImage[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  if (!images.length) return null;

  return (
    <section aria-labelledby="gallery-heading" className="mt-10 border-t border-rule pt-6">
      <h2 id="gallery-heading" className="kicker text-flag-600">
        In pictures
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <figure key={img.url + i} className="group">
            <button
              type="button"
              onClick={() => setActive(i)}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-md bg-wash"
              aria-label={`Open image ${i + 1}: ${img.alt || title}`}
            >
              <Image
                src={mediaUrl(img.url)}
                alt={img.alt || `${title} - image ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                loading="lazy"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </button>
            {(img.caption || img.credit) && (
              <figcaption className="mt-1.5 text-xs leading-snug text-ink-faint">
                {img.caption}
                {img.credit && <span className="block italic">{img.credit}</span>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/90 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <figure className="max-h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={mediaUrl(images[active].url)}
                alt={images[active].alt || title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {images[active].caption && (
              <figcaption className="mt-3 text-center text-sm text-navy-100">
                {images[active].caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}
