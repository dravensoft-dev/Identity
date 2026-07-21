import { afterNextRender, DestroyRef, DOCUMENT, ElementRef, inject, signal, Signal } from '@angular/core';

/* Breakpoints are constants for the life of the document, so each is read once. */
const breakpoints = new Map<string, number>();

/** The host element's content width, `null` until the first measure -- render the
 *  WIDE layout on `null` so the narrow branch never flashes on first paint. A
 *  responsive branch in this layer is code, not a media query, and it measures the
 *  CONTAINER rather than the viewport: a component inside a narrow panel should take
 *  its narrow layout there even on a wide screen, which a viewport query gets wrong.
 *  Call from an injection context (a field initializer or the constructor); the
 *  element measured is the caller's own host, and the observer is disconnected with
 *  it. Where the platform has no `ResizeObserver` the signal simply stays `null`,
 *  which is the wide layout.
 *  @returns the host's content width in px, or `null` before the first measure */
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

/** Reads `--bp-<name>` off the document root, once per name. Returns `NaN` when the
 *  token is absent; every comparison against `NaN` is false, which lands on the wide
 *  layout. Call from an injection context -- `inject(DOCUMENT)` runs before the cache
 *  is consulted rather than after, so the contract is the same on every call instead
 *  of binding only on the first one and silently depending on call order thereafter.
 *  @param name the breakpoint token's suffix @returns the breakpoint in px, or `NaN` */
export function readBreakpoint(name: 'sm' | 'md' | 'lg'): number {
  const doc = inject(DOCUMENT);
  const cached = breakpoints.get(name);
  if (cached !== undefined) return cached;
  const raw = doc.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(`--bp-${name}`);
  const value = Number.parseFloat(raw ?? '');
  const px = Number.isFinite(value) ? value : Number.NaN;
  breakpoints.set(name, px);
  return px;
}
