import { mediaUrl } from '@/lib/config';
import type { Author } from '@/lib/types';

/** The author's photo from Team, or their initial when none is set. */
export function AuthorAvatar({ author, size }: { author: Pick<Author, 'name' | 'avatar'>; size: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-20 w-20 text-3xl' : 'h-14 w-14 text-xl';
  const src = mediaUrl(author.avatar);
  if (src) {
    return (
      // Plain <img>: a photo can be an upload or any outside URL pasted in Team.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={author.name} className={`${box} shrink-0 rounded-full border border-rule object-cover`} />
    );
  }
  return (
    <div
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center rounded-full bg-navy-800 font-serif font-bold text-white`}
    >
      {author.name.slice(0, 1)}
    </div>
  );
}

/** LinkedIn and X profile links, when the author has added them in Team. */
export function AuthorLinks({ author }: { author: Pick<Author, 'name' | 'linkedin' | 'twitter'> }) {
  const handle = author.twitter.trim().replace(/^@/, '');
  if (!author.linkedin && !handle) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
      {author.linkedin && (
        <a href={author.linkedin} target="_blank" rel="noopener noreferrer me" className="text-navy-800 hover:underline">
          LinkedIn
        </a>
      )}
      {handle && (
        <a href={`https://x.com/${handle}`} target="_blank" rel="noopener noreferrer me" className="text-navy-800 hover:underline">
          X (@{handle})
        </a>
      )}
    </p>
  );
}
