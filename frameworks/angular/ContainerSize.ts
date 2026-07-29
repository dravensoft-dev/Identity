import { afterNextRender, DestroyRef, DOCUMENT, ElementRef, inject, signal, Signal } from '@angular/core';

const breakpoints = new Map<string, number>();

export function containerWidth(): Signal<number | null> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
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

export function readBreakpoint(name: 'sm' | 'md' | 'lg'): number {
  const doc = inject(DOCUMENT);
  const cached = breakpoints.get(name);
  if (cached !== undefined) return cached;
  const raw = doc.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(`--bp-${name}`);
  const value = Number.parseFloat(raw ?? '');
  const px = Number.isFinite(value) ? value : Number.NaN;
  if (Number.isFinite(px)) breakpoints.set(name, px);
  return px;
}
