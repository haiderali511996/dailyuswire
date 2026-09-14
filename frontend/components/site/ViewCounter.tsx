'use client';

import { useEffect } from 'react';

import { registerView } from '@/lib/api';

/** Registers one view per article per session. */
export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `duw_viewed_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* private mode - count it anyway */
    }
    registerView(slug);
  }, [slug]);

  return null;
}
