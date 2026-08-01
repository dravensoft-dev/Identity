import { afterNextRender, DestroyRef, DOCUMENT, ElementRef, inject, signal, Signal } from '@angular/core';

const breakpoints = new Map<string, number>();

export function containerWidth(target?: ElementRef<HTMLElement>): Signal<number | null> {
  const host = target ?? inject<ElementRef<HTMLElement>>(ElementRef);
  const destroyRef = inject(DestroyRef);
  const width = signal<number | null>(null);

  afterNextRender(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) width.set(entry.contentRect.width);
    });
    observer.observe(host.nativeElement);
    destroyRef.onDestroy(() => observer.disconnect());
  });

  return width.asReadonly();
}

const warned = new Set<string>();

function warnUnresolved(name: string): void {
  if (warned.has(name) || typeof console === 'undefined') return;
  warned.add(name);
  console.warn(`[arena] --bp-${name} did not resolve, so readBreakpoint('${name}') is NaN and every`
    + ' comparison against it is false: a responsive component stays on its wide branch on a phone.'
    + " Arena's stylesheet is missing, or it loads after this ran.");
}

export function readBreakpoint(name: 'sm' | 'md' | 'lg'): number {
  const doc = inject(DOCUMENT);
  const cached = breakpoints.get(name);
  if (cached !== undefined) return cached;
  const raw = doc.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(`--bp-${name}`);
  const value = Number.parseFloat(raw ?? '');
  if (!Number.isFinite(value)) {
    warnUnresolved(name);
    return Number.NaN;
  }
  breakpoints.set(name, value);
  return value;
}
