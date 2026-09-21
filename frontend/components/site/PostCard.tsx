import Image from 'next/image';
import Link from 'next/link';

import { formatDate, timeAgo } from '@/lib/format';
import { mediaUrl, postPath } from '@/lib/config';
import type { PostCard as PostCardType } from '@/lib/types';

import { CategoryChip } from './CategoryChip';

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"%3E%3Crect width="16" height="9" fill="%23e9ecf1"/%3E%3C/svg%3E';

function cover(post: PostCardType) {
  return mediaUrl(post.cover_image) || PLACEHOLDER;
}

/** Hero: one large lead story. */
export function HeroCard({ post, priority = true }: { post: PostCardType; priority?: boolean }) {
  return (
    <article className="group relative overflow-hidden rounded-lg bg-navy-950">
      <Link href={postPath(post)} className="block">
        <div className="relative aspect-video w-full">
          <Image
            src={cover(post)}
            alt={post.cover_alt || post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority={priority}
            className="object-cover opacity-85 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8">
          {post.category && <CategoryChip category={post.category} onDark />}
          <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-[2.6rem] lg:leading-[1.1]">
            {post.title}
          </h2>
          <Meta post={post} onDark className="mt-3" />
        </div>
      </Link>
    </article>
  );
}

/** Standard grid card. */
export function StandardCard({ post, priority = false }: { post: PostCardType; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col">
      <Link href={postPath(post)} className="relative block aspect-video w-full overflow-hidden rounded-md bg-wash">
        <Image
          src={cover(post)}
          alt={post.cover_alt || post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col pt-3">
        {post.category && <CategoryChip category={post.category} />}
        <h3 className="mt-1.5 font-serif text-lg font-bold leading-snug text-navy-900 sm:text-xl">
          <Link href={postPath(post)} className="transition group-hover:text-flag-600">
            {post.title}
          </Link>
        </h3>
        <Meta post={post} className="mt-auto pt-3" />
      </div>
    </article>
  );
}

/** Compact horizontal row for sidebars and "more from" rails. */
export function ListCard({
  post,
  index,
  showImage = true,
}: {
  post: PostCardType;
  index?: number;
  showImage?: boolean;
}) {
  return (
    <article className="group flex gap-3">
      {typeof index === 'number' && (
        <span aria-hidden className="w-6 shrink-0 font-serif text-2xl font-bold leading-none text-rule">
          {index + 1}
        </span>
      )}
      {showImage && (
        <Link href={postPath(post)} className="relative block aspect-video w-24 shrink-0 self-start overflow-hidden rounded bg-wash sm:w-28">
          <Image
            src={cover(post)}
            alt={post.cover_alt || post.title}
            fill
            sizes="120px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="clamp-3 text-sm font-semibold leading-snug text-navy-900">
          <Link href={postPath(post)} className="transition group-hover:text-flag-600">
            {post.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-ink-faint">
          {post.category?.name ? `${post.category.name} · ` : ''}
          {timeAgo(post.published_at)}
        </p>
      </div>
    </article>
  );
}

/** Wide card used as the first item of a category page. */
export function FeatureCard({ post }: { post: PostCardType }) {
  return (
    <article className="group grid gap-4 sm:grid-cols-2 sm:gap-6">
      <Link href={postPath(post)} className="relative block aspect-video w-full overflow-hidden rounded-md bg-wash">
        <Image
          src={cover(post)}
          alt={post.cover_alt || post.title}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          priority
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-col justify-center">
        {post.category && <CategoryChip category={post.category} />}
        <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-navy-900 sm:text-3xl">
          <Link href={postPath(post)} className="transition group-hover:text-flag-600">
            {post.title}
          </Link>
        </h2>
        <Meta post={post} className="mt-4" />
      </div>
    </article>
  );
}

export function Meta({
  post,
  onDark = false,
  className = '',
}: {
  post: PostCardType;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${onDark ? 'text-navy-200' : 'text-ink-faint'} ${className}`}>
      {post.author && (
        <>
          <Link
            href={`/author/${post.author.slug}`}
            className={`font-semibold ${onDark ? 'text-white hover:underline' : 'text-navy-800 hover:text-flag-600'}`}
          >
            {post.author.name}
          </Link>
          <span aria-hidden>·</span>
        </>
      )}
      {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
    </p>
  );
}
