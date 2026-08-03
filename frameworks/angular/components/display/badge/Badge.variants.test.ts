import test from 'node:test';
import assert from 'node:assert/strict';
import { badgeStyles } from './Badge.variants';

const TONES = ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'] as const;

test('the seven tones resolve to seven distinct roots, none silently collapsing onto another', () => {
  const roots = new Set(TONES.map((tone) => badgeStyles({ tone }).root()));
  assert.equal(roots.size, TONES.length, `two tones resolved to the same classes: ${[...roots].join(' | ')}`);
});

