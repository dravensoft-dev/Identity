import test from 'node:test';
import assert from 'node:assert/strict';
import { TestBed } from '@angular/core/testing';
import { useTestEnvironment } from '../../../test/TestbedEnv';
import { Skeleton } from './Skeleton';
import type { SkeletonVariant } from '../../../Api.generated';

useTestEnvironment();

function renderSkeleton(variant?: SkeletonVariant, width?: string, height?: string, radius?: string) {
  const fixture = TestBed.createComponent(Skeleton);
  if (variant !== undefined) fixture.componentRef.setInput('variant', variant);
  if (width !== undefined) fixture.componentRef.setInput('width', width);
  if (height !== undefined) fixture.componentRef.setInput('height', height);
  if (radius !== undefined) fixture.componentRef.setInput('radius', radius);
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
