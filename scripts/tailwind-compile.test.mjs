import test from 'node:test';
import assert from 'node:assert/strict';
import { manifestClasses, escapeClass, compileLayer, entryStylesheet } from './lib/tailwind-compile.mjs';

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

test('hex-escapes a leading digit instead of backslash-escaping it', () => {
  // Verified against the real Tailwind v4 CLI: `2xl:hidden` compiles to the
  // selector `.\32 xl\:hidden` — a leading digit cannot appear literally in a
  // CSS identifier, so it is hex-escaped (backslash + lowercase code point +
  // one trailing space) while the rest of the class keeps the normal rule.
  assert.equal(escapeClass('2xl:hidden'), '\\32 xl\\:hidden');
});

test('entryStylesheet disables automatic content detection on the preset import and keeps the explicit manifest source', () => {
  const stylesheet = entryStylesheet('/repo/frameworks/tailwind/theme.css', '/repo/frameworks/tailwind/components');
  assert.equal(
    stylesheet,
    "@import '/repo/frameworks/tailwind/theme.css' source(none);\n" +
      "@source '/repo/frameworks/tailwind/components/*.manifest.json';\n",
  );
});

test('compileLayer includes the underlying spawn error (e.g. ENOENT) rather than "exited null"', () => {
  const realExecPath = process.execPath;
  process.execPath = '/nonexistent/arena-test-binary-xyz';
  try {
    assert.throws(
      () => compileLayer(),
      (err) => {
        assert.match(err.message, /tailwindcss failed to spawn/);
        assert.match(err.message, /ENOENT/);
        return true;
      },
    );
  } finally {
    process.execPath = realExecPath;
  }
});
