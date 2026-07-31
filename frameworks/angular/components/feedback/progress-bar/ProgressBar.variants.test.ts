import test from 'node:test';
import assert from 'node:assert/strict';
import { progressBarStyles } from './ProgressBar.variants';

test('the defaults are accent and md, matching the component\'s own default inputs', () => {
  assert.equal(progressBarStyles().track(), progressBarStyles({ tone: 'accent', size: 'md' }).track());
});

test('every tone inks the track, which is what the fill reads through bg-current', () => {
  const tones = { accent: 'text-primary', gold: 'text-secondary', success: 'text-success', danger: 'text-error', info: 'text-info' } as const;
  for (const [tone, cls] of Object.entries(tones)) {
    assert.match(progressBarStyles({ tone: tone as keyof typeof tones }).track(), new RegExp(`(^| )${cls}( |$)`));
  }
  assert.match(progressBarStyles().fill(), /\bbg-current\b/);
});

test('size sets the track height and nothing else', () => {
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' } as const;
  for (const [size, cls] of Object.entries(heights)) {
    assert.match(progressBarStyles({ size: size as keyof typeof heights }).track(), new RegExp(`(^| )${cls}( |$)`));
    assert.equal(progressBarStyles({ size: size as keyof typeof heights }).fill(), progressBarStyles().fill(),
      `${size} must not reach the fill`);
  }
});

test('danger is a tone on the track, not a filled danger surface of its own', () => {
  const track = progressBarStyles({ tone: 'danger' }).track();
  assert.match(track, /\btext-error\b/);
  assert.match(track, /\bbg-base-300\b/, 'the track stays the neutral rail whatever the tone');
  assert.doesNotMatch(track, /\bbg-error\b/);
});

test('the indeterminate sweep is a shared animation utility, so Angular injects no keyframes', () => {
  assert.match(progressBarStyles().indeterminate(), /\barena-prog-indeterminate\b/);
});

test('the track clips its own fill and takes the pill radius, never rounded-full', () => {
  assert.match(progressBarStyles().track(), /\boverflow-hidden\b/);
  assert.match(progressBarStyles().track(), /\brounded-pill\b/);
  assert.doesNotMatch(progressBarStyles().track(), /\brounded-full\b/);
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  const root = progressBarStyles().root();
  assert.match(root, /\bblock\b/, 'w-full on an inline host does nothing -- an unknown element defaults to display:inline');
  assert.match(root, /\bw-full\b/);
});
