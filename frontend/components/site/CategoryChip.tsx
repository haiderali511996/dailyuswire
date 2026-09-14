import Link from 'next/link';

import type { Category } from '@/lib/types';

export function CategoryChip({
  category,
  onDark = false,
  size = 'sm',
}: {
  category: Pick<Category, 'name' | 'slug' | 'color'>;
  onDark?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <Link
      href={`/${category.slug}`}
      className={`kicker inline-flex w-fit items-center gap-1.5 transition hover:opacity-80 ${
        size === 'md' ? 'text-xs' : ''
      } ${onDark ? 'text-white' : ''}`}
      style={onDark ? undefined : { color: category.color || '#b3163c' }}
    >
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-[2px]"
        style={{ backgroundColor: onDark ? '#ffffff' : category.color || '#b3163c' }}
      />
      {category.name}
    </Link>
  );
}
