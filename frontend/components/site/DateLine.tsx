'use client';

import { useEffect, useState } from 'react';

/** Rendered client-side so the date matches the reader's own timezone. */
export function DateLine() {
  const [label, setLabel] = useState('');

  useEffect(() => {
    setLabel(
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    );
  }, []);

  return (
    <span suppressHydrationWarning className="font-medium tracking-wide text-navy-100">
      {label || ' '}
    </span>
  );
}
