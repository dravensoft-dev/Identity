import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export function useContainerWidth<T extends Element = HTMLDivElement>(target?: React.RefObject<T | null>):
[React.RefObject<T>, number | null] {
  const own = useRef<T>(null);
  const ref = (target ?? own) as React.RefObject<T>;
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

export type BreakpointName = 'sm' | 'md' | 'lg';

const cache = new Map<string, number>();

const warned = new Set<string>();

function warnUnresolved(name: string): void {
  if (warned.has(name) || typeof console === 'undefined') return;
  warned.add(name);
  console.warn(`[arena] --bp-${name} did not resolve, so readBreakpoint('${name}') is NaN and every`
    + ' comparison against it is false: a responsive component stays on its wide branch on a phone.'
    + " Arena's stylesheet is missing, or it loads after this ran.");
}

export function forgetBreakpoints(): void {
  cache.clear();
  warned.clear();
}

export function useViewportBelow(name: BreakpointName): boolean {
  const [below, setBelow] = useState(false);
  const width = readBreakpoint(name);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia || !Number.isFinite(width)) return;
    const query = window.matchMedia(`not all and (min-width: ${width}px)`);
    setBelow(query.matches);
    const onChange = (event: MediaQueryListEvent) => setBelow(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [width]);

  return below;
}

export function readBreakpoint(name: BreakpointName): number {
  if (typeof document === 'undefined') return NaN;
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`);
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) {
    warnUnresolved(name);
    return NaN;
  }
  cache.set(name, value);
  return value;
}
