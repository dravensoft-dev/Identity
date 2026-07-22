import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { classesFor } from '../frameworks/tailwind/manifest-classes.js';

const tag = JSON.parse(readFileSync(join(repoRoot, 'frameworks/tailwind/components/Tag.manifest.json'), 'utf8'));

test('the default variants apply when nothing is chosen', () => {
  const { root, dot } = classesFor(tag);
  assert.ok(root.includes('rounded-pill'), 'the base slot is present');
  assert.ok(root.includes('border-base-300'), 'tone=neutral is the default');
  assert.equal(dot, 'size-1.5 rounded-pill bg-current');
});

test('a chosen variant replaces the default', () => {
  const { root } = classesFor(tag, { tone: 'danger' });
  assert.ok(root.includes('border-error'), 'the chosen tone applies');
  assert.ok(!root.includes('border-base-300'), 'the default tone does not');
});

test('the base slot always precedes the variant slot', () => {
  const { root } = classesFor(tag, { tone: 'primary' });
  assert.ok(root.indexOf('inline-flex') < root.indexOf('border-primary'));
});

test('an unknown variant value is a loud failure, not a silent base-only render', () => {
  assert.throws(() => classesFor(tag, { tone: 'chartreuse' }), /tone="chartreuse"/);
});

test('a slot with no variant contribution is still returned', () => {
  assert.ok('dot' in classesFor(tag, { tone: 'danger' }));
});

test('compoundVariants are refused rather than silently dropped', () => {
  assert.throws(() => classesFor({ ...tag, compoundVariants: [] }), /compoundVariants/);
});
