/* Render assertions for `width`/`height`/`radius`, added under Skeleton's API
 * contract task (8B1 Task 3, Reshape B): the three inputs bind onto the host
 * via `[style.width]` / `[style.height]` / `[style.borderRadius]`, which this
 * JIT-only harness's OTHER blind spot -- the `[style.x]` binding form -- makes
 * invisible to `check:dimensions`' scanners (see CLAUDE.md's `check:dimensions`
 * paragraph, "Angular's `[style.x]` binding form is invisible to all four
 * scanners too"). Only a real render proves they reach the DOM, and that the
 * per-variant gating in `skeleton.ts` (radius only for `block`, `text`/`line`
 * ignore it, `circle` uses height||width as one diameter) matches the table in
 * the task brief and `Skeleton.jsx`.
 *
 * `width`/`height`/`radius`/`variant` are all `input()` signal fields, which
 * this harness cannot drive through a template binding (NG0303) or a literal
 * attribute (a silent no-op) -- see `host-class-binding.test.ts`'s own header
 * comment. This reuses the same instance-field-overwrite technique
 * `renderStatCard`/`renderAppLogo` use there: construct the real `Skeleton` via
 * `TestBed.createComponent`, overwrite the signal fields with plain functions
 * before the first `detectChanges()`, then read the real host's inline style.
 * That proves template/style-binding shape only, never the input contract
 * itself -- `bun run check:angular` (`ngc --strictTemplates`) is the authority
 * that the signal inputs themselves are declared correctly.
 *
 * `renderSkeleton` takes its dimensions POSITIONALLY, not as an `{ width:
 * '160px', ... }` options object, and that is deliberate rather than a style
 * preference: `check:dimensions`' PROP_COLON scanner reads ANY `width:`/
 * `height:` object-literal key text anywhere under frameworks/, with no
 * notion of "this is a test fixture's own argument bag, not CSS" -- an
 * options object at the call site would read exactly like a real style
 * declaration and fail that gate. Positional args carry no colon-adjacent
 * property name at all, sidestepping the collision entirely rather than
 * asking `check:dimensions` to special-case it (also matches this
 * directory's existing idiom -- `renderActivityFeed(items)`,
 * `renderStatCard(label, value, delta, icon)` -- so it is not a one-off). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TestBed } from '@angular/core/testing';
import { useTestEnvironment } from './testbed-env';
import { Skeleton } from '../primitives/skeleton/skeleton';
import type { SkeletonVariant } from '../api.generated';

useTestEnvironment();

function renderSkeleton(variant?: SkeletonVariant, width?: string, height?: string, radius?: string) {
  const fixture = TestBed.createComponent(Skeleton);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  if (variant !== undefined) instance['variant'] = () => variant;
  if (width !== undefined) instance['width'] = () => width;
  if (height !== undefined) instance['height'] = () => height;
  if (radius !== undefined) instance['radius'] = () => radius;
  fixture.detectChanges();
  return fixture;
}

test('arena-skeleton: a set width/height reaches the host inline style for variant="block"', () => {
  const fixture = renderSkeleton('block', '160px', '72px');
  const host = fixture.nativeElement as HTMLElement;
  assert.equal(host.style.width, '160px');
  assert.equal(host.style.height, '72px');
  fixture.destroy();
});

test('arena-skeleton: with nothing set, the host carries no inline dimension styles at all -- the recipe class governs', () => {
  const fixture = renderSkeleton('block');
  const host = fixture.nativeElement as HTMLElement;
  assert.equal(host.style.width, '');
  assert.equal(host.style.height, '');
  assert.equal(host.style.borderRadius, '');
  fixture.destroy();
});

test('arena-skeleton: radius reaches the host inline style only for variant="block" -- circle, line and text ignore it', () => {
  const block = renderSkeleton('block', undefined, undefined, '4px');
  assert.equal((block.nativeElement as HTMLElement).style.borderRadius, '4px');
  block.destroy();

  const circle = renderSkeleton('circle', undefined, undefined, '4px');
  assert.equal((circle.nativeElement as HTMLElement).style.borderRadius, '', 'circle ignores radius -- always 50% via the recipe class');
  circle.destroy();

  const line = renderSkeleton('line', undefined, undefined, '4px');
  assert.equal((line.nativeElement as HTMLElement).style.borderRadius, '', 'line ignores radius -- fixed --r-xs via the recipe class');
  line.destroy();

  const text = renderSkeleton('text', undefined, undefined, '4px');
  assert.equal((text.nativeElement as HTMLElement).style.borderRadius, '', 'text ignores radius -- rows are fixed --r-xs via the recipe class');
  text.destroy();
});

test('arena-skeleton: variant="circle" uses height||width as one diameter for both style properties', () => {
  const heightOnly = renderSkeleton('circle', undefined, '48px');
  const h = heightOnly.nativeElement as HTMLElement;
  assert.equal(h.style.width, '48px');
  assert.equal(h.style.height, '48px');
  heightOnly.destroy();

  const widthOnly = renderSkeleton('circle', '40px');
  const w = widthOnly.nativeElement as HTMLElement;
  assert.equal(w.style.width, '40px');
  assert.equal(w.style.height, '40px');
  widthOnly.destroy();

  const both = renderSkeleton('circle', '40px', '64px');
  const b = both.nativeElement as HTMLElement;
  assert.equal(b.style.width, '64px', 'height wins over width, matching React\'s `height || width`');
  assert.equal(b.style.height, '64px');
  both.destroy();
});

test('arena-skeleton: variant="text" applies width to the host (the stack), never height or radius', () => {
  const fixture = renderSkeleton('text', '220px', '999px', '999px');
  const host = fixture.nativeElement as HTMLElement;
  assert.equal(host.style.width, '220px');
  assert.equal(host.style.height, '', 'text rows are a fixed height -- no override');
  assert.equal(host.style.borderRadius, '', 'text rows are a fixed radius -- no override');
  fixture.destroy();
});

test('arena-skeleton: variant="line" applies both width and height, never radius', () => {
  const fixture = renderSkeleton('line', '160px', '11px', '999px');
  const host = fixture.nativeElement as HTMLElement;
  assert.equal(host.style.width, '160px');
  assert.equal(host.style.height, '11px');
  assert.equal(host.style.borderRadius, '', 'line rows are a fixed radius -- no override');
  fixture.destroy();
});
