'use client';

import { useState } from 'react';

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: 'M18.2 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H1.6l7.7-8.8L1.2 2.5h6.9l4.7 6.3 5.4-6.3Zm-1.2 17.6h1.8L7.1 4.3H5.2l11.8 15.8Z',
    },
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z',
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: 'M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.1a4.2 4.2 0 0 1 3.8-2c4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9V9Z',
    },
    {
      label: 'Share by email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm2.4.5 7.6 5.6 7.6-5.6H4.4Z',
    },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked - silently ignore */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="kicker mr-1 text-ink-faint">Share</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          aria-label={l.label}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-rule text-navy-800 transition hover:border-navy-800 hover:bg-navy-800 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d={l.icon} />
          </svg>
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="flex h-9 items-center gap-1.5 rounded-full border border-rule px-3 text-xs font-semibold text-navy-800 transition hover:border-navy-800 hover:bg-navy-800 hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
