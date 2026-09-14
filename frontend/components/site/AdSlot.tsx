'use client';

import { useEffect, useRef } from 'react';

import { ADSENSE_CLIENT } from '@/lib/config';

type Format = 'leaderboard' | 'rectangle' | 'in-article' | 'sidebar';

const SIZES: Record<Format, string> = {
  leaderboard: 'min-h-[90px] sm:min-h-[90px]',
  rectangle: 'min-h-[250px]',
  'in-article': 'min-h-[250px]',
  sidebar: 'min-h-[600px]',
};

/**
 * Google AdSense placement. Renders nothing at all until NEXT_PUBLIC_ADSENSE_CLIENT
 * is set, so the site stays clean while the AdSense application is pending.
 */
export function AdSlot({
  slot,
  format = 'rectangle',
  label = 'Advertisement',
  className = '',
}: {
  slot?: string;
  format?: Format;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot || pushed.current) return;
    pushed.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      /* ad blockers throw here - never break the page */
    }
  }, [slot]);

  if (!ADSENSE_CLIENT || !slot) return null;

  return (
    <aside className={`my-6 text-center ${className}`} aria-label={label}>
      <span className="mb-1 block text-2xs uppercase tracking-[0.18em] text-ink-faint">{label}</span>
      <ins
        ref={ref}
        className={`adsbygoogle block w-full overflow-hidden bg-wash ${SIZES[format]}`}
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format === 'in-article' ? 'fluid' : 'auto'}
        data-ad-layout={format === 'in-article' ? 'in-article' : undefined}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
