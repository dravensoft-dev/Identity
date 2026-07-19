import test from 'node:test';
import assert from 'node:assert/strict';
import { manifestClasses, escapeClass } from './lib/tailwind-compile.mjs';

test('collects classes from slots and from every variant value', () => {
  const m = {
    component: 'X',
    slots: { root: 'inline-flex gap-2', dot: 'rounded-pill' },
    variants: { tone: { primary: { root: 'text-primary' }, danger: { root: 'text-error border-error' } } },
    defaultVariants: { tone: 'primary' },
  };
  assert.deepEqual(manifestClasses(m), [
    'border-error', 'gap-2', 'inline-flex', 'rounded-pill', 'text-error', 'text-primary',
  ]);
});

test('ignores non-class metadata and tolerates a manifest with no variants', () => {
  assert.deepEqual(manifestClasses({ component: 'X', slots: { root: 'flex' } }), ['flex']);
});

test('escapes a plain class to itself', () => {
  assert.equal(escapeClass('bg-primary'), 'bg-primary');
});

test('escapes the characters Tailwind escapes in a selector', () => {
  assert.equal(escapeClass('hover:shadow-2'), 'hover\\:shadow-2');
  assert.equal(escapeClass('h-[var(--dz-ctl-h)]'), 'h-\\[var\\(--dz-ctl-h\\)\\]');
  assert.equal(escapeClass('text-base-content/70'), 'text-base-content\\/70');
  assert.equal(escapeClass('px-4.5'), 'px-4\\.5');
});
