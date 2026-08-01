import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export function useContainerWidth<T extends Element = HTMLDivElement>():
[React.RefObject<T>, number | null] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

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

const cache = new Map<string, number>();

export function readBreakpoint(name: 'sm' | 'md' | 'lg'): number {
  if (typeof document === 'undefined') return NaN;
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`);
  const value = parseFloat(raw);
  const px = Number.isFinite(value) ? value : NaN;
  cache.set(name, px);
  return px;
}
