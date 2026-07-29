/* Shared runtime helpers for Arena's responsive components.
 *
 * Arena components style themselves with inline style objects, which cannot
 * hold a media query — so a responsive branch is JS no matter what. Given
 * that, we measure the CONTAINER rather than the viewport: it is no harder and
 * it is correct in more cases. A Table inside a narrow sidebar card should go
 * card-mode on a 27" monitor, and a viewport query gets that wrong.
 */
import { useEffect, useRef, useState } from 'react';

/** Measures the element the returned ref is attached to.
 *  Width is `null` until the first measure — render the WIDE layout on `null`
 *  so SSR and first paint are never the narrow branch (which would flash). */
export function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

/* Breakpoints are constants for the life of the document, so read each once. */
const cache = new Map();

/** Reads --bp-<name> off the document root. `name` is 'sm' | 'md' | 'lg'.
 *  Returns NaN when there is no document or the token is absent; every
 *  comparison against NaN is false, which lands on the wide layout. */
export function readBreakpoint(name) {
  if (typeof document === 'undefined') return NaN;
  if (cache.has(name)) return cache.get(name);
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`);
  const value = parseFloat(raw);
  const px = Number.isFinite(value) ? value : NaN;
  cache.set(name, px);
  return px;
}
