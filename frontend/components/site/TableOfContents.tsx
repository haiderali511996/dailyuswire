'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

/** Built from the rendered DOM so it always matches the published article. */
export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLHeadingElement>('.article-body h2[id], .article-body h3[id]'),
    );
    setHeadings(
      nodes.map((n) => ({ id: n.id, text: n.textContent ?? '', level: Number(n.tagName[1]) })),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 3) return null;

  return (
    <nav aria-label="On this page" className="my-6 rounded-lg border border-rule bg-wash p-4">
      <h2 className="kicker text-flag-600">On this page</h2>
      <ol className="mt-2.5 space-y-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
            <a
              href={`#${h.id}`}
              className={`block transition hover:text-flag-600 ${
                activeId === h.id ? 'font-semibold text-flag-600' : 'text-ink-muted'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
