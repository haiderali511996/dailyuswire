import Link from 'next/link';
import { Suspense } from 'react';

import { getCategories, getPosts } from '@/lib/api';
import { postPath } from '@/lib/config';

import { BreakingTicker } from './BreakingTicker';
import { DateLine } from './DateLine';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { DesktopNav } from './Nav';
import { SearchBox } from './SearchBox';

export async function Header() {
  const [categories, breaking] = await Promise.all([
    getCategories(),
    getPosts({ breaking: true, per_page: 6 }),
  ]);

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Utility strip */}
      <div className="hidden bg-navy-900 text-white md:block">
        <div className="shell flex h-9 items-center justify-between text-xs">
          <DateLine />
          <div className="flex items-center gap-4">
            <Link href="/about" className="link-underline hover:text-navy-100">
              About
            </Link>
            <Link href="/contact" className="link-underline hover:text-navy-100">
              Contact
            </Link>
            <Link href="/rss" className="link-underline hover:text-navy-100">
              RSS
            </Link>
            <Link
              href="/admin"
              className="rounded border border-white/30 px-2 py-0.5 font-semibold hover:bg-white/10"
            >
              Newsroom
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="border-b border-rule">
        <div className="shell flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2">
            <MobileNav categories={categories} />
            <Logo priority width={230} className="block w-[150px] sm:w-[200px] lg:w-[230px]" />
          </div>
          <div className="hidden w-72 md:block">
            <Suspense fallback={<div className="h-9" />}>
              <SearchBox compact />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div className="border-b border-rule bg-white">
        <div className="shell flex items-center justify-between">
          <DesktopNav categories={categories} />
          <div className="w-full py-2 md:hidden">
            <Suspense fallback={<div className="h-9" />}>
              <SearchBox compact />
            </Suspense>
          </div>
        </div>
      </div>

      {breaking.items.length > 0 && <BreakingTicker items={breaking.items.map((p) => ({ title: p.title, href: postPath(p) }))} />}
    </header>
  );
}
