'use client';

import { Children, useCallback, useEffect, useState, type ReactNode } from 'react';

const INTERVAL_MS = 15_000;

/**
 * Rotates the server-rendered hero cards passed as children.
 *
 * All slides share one grid cell and cross-fade, so the lead story is in the
 * HTML (and is the LCP element) before any JavaScript runs. Rotation pauses
 * while the pointer or keyboard focus is inside the slider. There are no
 * on-screen controls: the "Latest" list beside it links to the same stories.
 */
export function HeroSlider({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = window.setInterval(next, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [count, paused, next, active]);

  if (count < 2) return <>{slides}</>;

  return (
    <div
      className="relative"
      aria-roledescription="carousel"
      aria-label="Top stories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="grid">
        {slides.map((slide, i) => (
          <div
            key={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== active}
            inert={i !== active}
            className={`[grid-area:1/1] transition-opacity duration-700 ${
              i === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
}
