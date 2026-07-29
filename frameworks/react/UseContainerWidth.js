import { useEffect, useRef, useState } from 'react';

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

const cache = new Map();

export function readBreakpoint(name) {
  if (typeof document === 'undefined') return NaN;
  if (cache.has(name)) return cache.get(name);
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`);
  const value = parseFloat(raw);
  const px = Number.isFinite(value) ? value : NaN;
  cache.set(name, px);
  return px;
}
