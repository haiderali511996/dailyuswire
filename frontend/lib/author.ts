import { CONTACT_EMAIL, SITE_NAME } from './config';

/**
 * The bio shown on author pages and under articles. Falls back to a plain
 * description of the author's role when none has been written in Team, or
 * when it is still the one-line placeholder the first account was created with.
 */
export function authorBio(bio: string | null | undefined): string {
  const text = (bio || '').trim();
  if (text && !/^editorial desk at\b/i.test(text)) return text;
  return (
    `Reviews, approves and publishes ${SITE_NAME} stories, checking each article's facts and ` +
    `sources before it goes live. Corrections and questions: ${CONTACT_EMAIL}.`
  );
}
