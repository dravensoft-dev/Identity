/* See tag-variants.test.ts for why this suite lives here rather than under
 * scripts/: node cannot resolve the extensionless imports this layer's
 * recipes use. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarStyles } from '../primitives/avatar/avatar.variants';

test('the default variants are md, circle, no presence dot', () => {
  const defaults = avatarStyles();
  assert.equal(defaults.root(), avatarStyles({ size: 'md', shape: 'circle', status: 'none' }).root());
  assert.equal(defaults.box(), avatarStyles({ size: 'md', shape: 'circle', status: 'none' }).box());
});

test('the initials font size is exactly diameter * 0.4, matching Avatar.jsx', () => {
  const sizes: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
    xs: '--avatar-xs', sm: '--avatar-sm', md: '--avatar-md', lg: '--avatar-lg',
  };
  for (const [size, token] of Object.entries(sizes) as [keyof typeof sizes, string][]) {
    const box = avatarStyles({ size }).box();
    assert.match(box, new RegExp(`text-\\[length:calc\\(var\\(${token}\\)\\*0\\.4\\)\\]`));
  }
});

test('the presence dot diameter is exactly max(8px, diameter * 0.28), matching Avatar.jsx', () => {
  const sizes = ['xs', 'sm', 'md', 'lg'] as const;
  for (const size of sizes) {
    const status = avatarStyles({ size, status: 'online' }).status();
    assert.match(status, new RegExp(`size-\\[max\\(calc\\(var\\(--sp-1\\)\\*2\\),calc\\(var\\(--avatar-${size}\\)\\*0\\.28\\)\\)\\]`));
  }
});

test('shape=circle rounds the box fully, shape=rounded uses the medium radius', () => {
  assert.match(avatarStyles({ shape: 'circle' }).box(), /rounded-pill/);
  assert.match(avatarStyles({ shape: 'rounded' }).box(), /rounded-md/);
});

test('status=none renders no status classes beyond the shared base', () => {
  const base = avatarStyles({ status: 'none' }).status();
  assert.doesNotMatch(base, /bg-(success|error|warning|base-content)/);
});

test('every presence tone maps to the status color taxonomy, not a series color', () => {
  assert.match(avatarStyles({ status: 'online' }).status(), /bg-success/);
  assert.match(avatarStyles({ status: 'busy' }).status(), /bg-error/);
  assert.match(avatarStyles({ status: 'away' }).status(), /bg-warning/);
  assert.match(avatarStyles({ status: 'offline' }).status(), /bg-base-content\/52/);
});

/* The `image` slot has no variants and the specimen renders only initials, so
 * nothing else exercises it — a typo in Avatar.manifest.json's "image" string
 * would otherwise ship silently. */
test('the image slot fills the box and crops to it, matching Avatar.jsx', () => {
  const image = avatarStyles().image();
  assert.match(image, /\bw-full\b/);
  assert.match(image, /\bh-full\b/);
  assert.match(image, /\bobject-cover\b/);
});
