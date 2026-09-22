'use client';

import { useEffect, useState } from 'react';

import { timeAgo } from '@/lib/format';

/**
 * "3 hours ago" that hydrates cleanly.
 *
 * The server computes `initial` when the page is rendered (or revalidated) and
 * the client renders exactly that string during hydration, so the markup
 * always matches. Once mounted it recomputes from the reader's clock and keeps
 * itself fresh, so a page served from the ISR cache never shows a stale age.
 */
export function TimeAgo({ value, initial }: { value: string | null | undefined; initial: string }) {
  const [label, setLabel] = useState(initial);

  useEffect(() => {
    const refresh = () => setLabel(timeAgo(value));
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <time dateTime={value ?? undefined} suppressHydrationWarning>
      {label}
    </time>
  );
}
