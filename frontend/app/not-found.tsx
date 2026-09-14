import Link from 'next/link';

import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { getCategories } from '@/lib/api';

/** Rendered outside the (site) group, so it brings its own header and footer. */
export default async function NotFound() {
  const categories = await getCategories();

  return (
    <>
      <Header />
      <main className="shell flex min-h-[60vh] flex-1 flex-col items-center justify-center py-20 text-center">
      <p className="font-serif text-7xl font-bold text-flag-600">404</p>
      <h1 className="mt-4 font-serif text-3xl font-bold text-navy-900 sm:text-4xl">
        This page has gone to press
      </h1>
      <p className="mt-3 max-w-md text-ink-muted">
        The story you are looking for has moved or never existed. Try one of our sections instead.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className="rounded-full border border-rule px-4 py-1.5 text-sm font-medium text-navy-800 transition hover:border-navy-800 hover:bg-navy-800 hover:text-white"
          >
            {c.name}
          </Link>
        ))}
      </div>

        <Link href="/" className="btn-primary mt-8">
          Back to the front page
        </Link>
      </main>
      <Footer />
    </>
  );
}
