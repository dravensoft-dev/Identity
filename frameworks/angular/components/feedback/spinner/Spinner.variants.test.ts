import test from 'node:test';
import assert from 'node:assert/strict';
import { spinnerStyles } from './Spinner.variants';

test('the defaults are accent and md, matching the component\'s own default inputs', () => {
  assert.equal(spinnerStyles().root(), spinnerStyles({ tone: 'accent', size: 'md' }).root());
  assert.equal(spinnerStyles().circle(), spinnerStyles({ tone: 'accent', size: 'md' }).circle());
});

test('tone colours the root and size sizes the circle -- neither axis reaches the other slot', () => {
  const tones = { accent: 'text-primary', gold: 'text-secondary', neutral: 'text-base-content/62', 'on-accent': 'text-primary-content' } as const;
  for (const [tone, cls] of Object.entries(tones)) {
    assert.match(spinnerStyles({ tone: tone as keyof typeof tones }).root(), new RegExp(`(^| )${cls.replace('/', '\\/')}( |$)`));
    assert.equal(spinnerStyles({ tone: tone as keyof typeof tones }).circle(), spinnerStyles().circle(),
      `${tone} must not reach the circle`);
  }
  const sizes = { sm: 'size-icon-sm', md: 'size-5', lg: 'size-8' } as const;
  for (const [size, cls] of Object.entries(sizes)) {
    assert.match(spinnerStyles({ size: size as keyof typeof sizes }).circle(), new RegExp(`(^| )${cls}( |$)`));
  }
});

test('the ring takes its colour from the root rather than naming one, so one tone paints both', () => {
  assert.match(spinnerStyles().circle(), /\bborder-current\b/);
  assert.match(spinnerStyles().circle(), /\bborder-t-transparent\b/);
});

test('the ring is a pill radius, never rounded-full -- the one core utility with no Arena token behind it', () => {
  assert.match(spinnerStyles().circle(), /\brounded-pill\b/);
  assert.doesNotMatch(spinnerStyles().circle(), /\brounded-full\b/);
});

test('the animation is a shared utility, so Angular injects no keyframes of its own', () => {
  assert.match(spinnerStyles().circle(), /\barena-spinner\b/);
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  assert.match(spinnerStyles().root(), /\binline-flex\b/);
});
