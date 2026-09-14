'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
      className="relative"
    >
      <label htmlFor={compact ? 'search-compact' : 'search-main'} className="sr-only">
        Search articles
      </label>
      <input
        id={compact ? 'search-compact' : 'search-main'}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search news..."
        className={`w-full rounded-full border border-rule bg-wash pl-9 pr-3 text-ink placeholder:text-ink-faint focus:border-navy-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-navy-800 ${
          compact ? 'h-9 text-sm' : 'h-11 text-base'
        }`}
      />
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
      </svg>
    </form>
  );
}
