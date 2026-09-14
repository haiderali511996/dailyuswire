'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { Category } from '@/lib/types';

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-navy-900 transition hover:bg-wash lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 top-[var(--header-h,104px)] z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy-950/40"
          />
          <nav
            id="mobile-menu"
            aria-label="Sections"
            className="relative max-h-full overflow-y-auto border-t border-rule bg-white pb-8 shadow-pop animate-fade-up"
          >
            <ul className="shell divide-y divide-rule">
              <li>
                <Link href="/" className="block py-3.5 text-base font-semibold text-navy-900">
                  Home
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/${c.slug}`}
                    className="flex items-center justify-between py-3.5 text-base font-semibold text-navy-900"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="h-4 w-1 rounded-full"
                        style={{ backgroundColor: c.color || '#03305f' }}
                      />
                      {c.name}
                    </span>
                    {c.post_count ? (
                      <span className="text-xs font-medium text-ink-faint">{c.post_count}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
              <li className="flex gap-4 pt-4 text-sm font-medium text-ink-muted">
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/privacy-policy">Privacy</Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
