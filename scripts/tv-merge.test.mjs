import test from 'node:test';
import assert from 'node:assert/strict';
import { tv } from '../frameworks/tailwind/tv.ts';

/* No gate exercises tailwind-variants' `tv()` merge until this file: every other
 * Tailwind gate (check-tailwind.mjs, check-tailwind-coverage.mjs) compiles the
 * preset directly and never runs a manifest's classes through `tv()`'s
 * `tailwind-merge` pass. That gap is exactly how a real defect shipped and
 * stayed green: Arena's `--text-*` custom font-size names (`text-h1`,
 * `text-display`, `text-ctl`, `text-ctl-md`, `text-ctl-sm`, `text-ctl-xs`,
 * `text-ctl-2xs`) were being classified by `tailwind-merge` as text-COLOR
 * candidates, because it only recognises Tailwind's own default font-size
 * suffixes (`sm`/`md`/`lg`/`xs`/`base`/...) without being told about ours. A
 * size class and a color class landing in the same conflict group meant
 * whichever was concatenated later silently ate the other — verified against
 * Button.manifest.json (the color lost) and Tag.manifest.json (the size lost).
 *
 * Fixed in frameworks/tailwind/tv.ts by registering Arena's custom suffixes
 * under Tailwind's own `font-size` class group ID (`fromTheme('text')` is
 * what the built-in group already keys on; extending it, rather than
 * inventing a new group, keeps the size scale's existing correct conflict
 * behaviour against `leading-*` and nothing else — see tv.ts's own comment).
 *
 * `merge()` below is the same bench used to discover and verify the bug: a
 * one-slot `tv()` with no variants still runs the slot string through
 * `tailwind-merge`, so it exercises the exact code path every manifest's
 * `.root()` call does. */
const merge = (classString) => tv({ slots: { root: classString } })().root();
const classes = (s) => s.split(/\s+/);

test('every registered Arena font-size key survives alongside a text color', () => {
  for (const size of ['text-display', 'text-h1', 'text-h2', 'text-h3', 'text-h4',
    'text-ctl', 'text-ctl-md', 'text-ctl-sm', 'text-ctl-xs', 'text-ctl-2xs']) {
    for (const color of ['text-primary', 'text-error', 'text-base-content/70']) {
      const merged = classes(merge(`${size} ${color}`));
      assert.ok(merged.includes(size), `${size} + ${color} -> "${merged.join(' ')}" (size was eaten)`);
      assert.ok(merged.includes(color), `${size} + ${color} -> "${merged.join(' ')}" (color was eaten)`);
    }
  }
});

test('Tailwind default font-size names still survive alongside a text color (unregistered, and correct as-is)', () => {
  for (const size of ['text-sm', 'text-md', 'text-lg', 'text-xs']) {
    const merged = classes(merge(`${size} text-primary`));
    assert.ok(merged.includes(size));
    assert.ok(merged.includes('text-primary'));
  }
});

test('two Arena font-size classes still correctly conflict with each other (the registration did not turn off dedup)', () => {
  assert.equal(merge('text-h1 text-h2'), 'text-h2');
  assert.equal(merge('text-ctl text-ctl-md'), 'text-ctl-md');
  assert.equal(merge('text-ctl-md text-ctl'), 'text-ctl');
});

test('shadow-1..3 still dedupe against each other (pre-existing registration, regression guard)', () => {
  assert.equal(merge('shadow-1 shadow-2'), 'shadow-2');
});

test('tagStyles: text-ctl-xs survives alongside every tone color', async () => {
  const { tagStyles } = await import('../frameworks/angular/primitives/tag/tag.variants.ts');
  for (const tone of ['neutral', 'primary', 'success', 'warning', 'danger']) {
    const root = classes(tagStyles({ tone }).root());
    assert.ok(root.includes('text-ctl-xs'), `tone ${tone}: text-ctl-xs missing from "${root.join(' ')}"`);
  }
});

test("Button.manifest.json through tv(): text-ctl* and the variant's text color both survive", async () => {
  const { default: manifest } = await import('../frameworks/tailwind/components/Button.manifest.json', { with: { type: 'json' } });
  const buttonStyles = tv(manifest);
  const expectSize = { sm: 'text-ctl-md', md: 'text-ctl', lg: 'text-ctl' };
  const expectColor = { primary: 'text-primary-content', danger: 'text-error' };
  for (const variant of ['primary', 'danger']) {
    for (const size of ['sm', 'md', 'lg']) {
      const root = classes(buttonStyles({ variant, size }).root());
      assert.ok(root.includes(expectSize[size]), `${variant}/${size}: ${expectSize[size]} missing from "${root.join(' ')}"`);
      assert.ok(root.includes(expectColor[variant]), `${variant}/${size}: ${expectColor[variant]} missing from "${root.join(' ')}"`);
    }
  }
});
