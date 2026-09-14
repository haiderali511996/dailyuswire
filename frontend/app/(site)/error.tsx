'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="font-serif text-3xl font-bold text-navy-900 sm:text-4xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-ink-muted">
        We hit an unexpected error loading this page. Try again, or head back to the front page.
      </p>
      {error.digest && <p className="mt-2 text-xs text-ink-faint">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Front page
        </Link>
      </div>
    </div>
  );
}
