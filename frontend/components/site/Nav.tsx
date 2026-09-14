'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Category } from '@/lib/types';

export function DesktopNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        <NavLink href="/" label="Home" active={pathname === '/'} />
        {categories.map((c) => (
          <NavLink
            key={c.id}
            href={`/${c.slug}`}
            label={c.name}
            active={pathname === `/${c.slug}` || pathname.startsWith(`/${c.slug}/`)}
          />
        ))}
      </ul>
    </nav>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative block px-3 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
          active ? 'text-flag-600' : 'text-navy-900 hover:text-flag-600'
        }`}
      >
        {label}
        <span
          className={`absolute inset-x-2 bottom-1.5 h-0.5 rounded-full bg-flag-600 transition-transform duration-200 ${
            active ? 'scale-x-100' : 'scale-x-0'
          }`}
        />
      </Link>
    </li>
  );
}
