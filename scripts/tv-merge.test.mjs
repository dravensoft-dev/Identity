import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tv } from '../frameworks/tailwind/tv.ts';
import { parseDecls } from './lib/css-decls.mjs';

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

/* Fix pass 4 — a second, different failure mode than the one above. `pill` (radius)
 * and every `--z-index-*` name are not misclassified into a WRONG group (nothing
 * else shares their prefix's second meaning the way text- does) — they are not
 * classified into ANY group, so they never conflict with their OWN siblings either.
 * A `tv()` compound variant (a base slot's radius/z class overridden by a
 * size/variant one) produces exactly two same-family classes in one merged string,
 * and without registration BOTH survive when only the later one should — plan 5's
 * 34 recipes are expected to hit this shape. Verified pre-fix: `rounded-pill
 * rounded-lg` -> both; `z-dropdown z-modal` -> both. */
test('rounded-pill dedupes against Tailwind\'s own radius scale, in both directions', () => {
  assert.equal(merge('rounded-pill rounded-lg'), 'rounded-lg');
  assert.equal(merge('rounded-lg rounded-pill'), 'rounded-pill');
});

test('rounded-pill still coexists with a color class (registering it did not reopen the cross-group failure)', () => {
  const root = classes(merge('rounded-pill bg-primary border-primary'));
  assert.ok(root.includes('rounded-pill'));
  assert.ok(root.includes('bg-primary'));
  assert.ok(root.includes('border-primary'));
});

test('every registered Arena z-index name dedupes against a sibling, in both directions', () => {
  const names = ['dropdown', 'tooltip', 'modal', 'modal-nested', 'palette', 'onboarding', 'toast'];
  for (let i = 0; i < names.length - 1; i++) {
    const a = `z-${names[i]}`, b = `z-${names[i + 1]}`;
    assert.equal(merge(`${a} ${b}`), b, `${a} ${b} should collapse to ${b}`);
    assert.equal(merge(`${b} ${a}`), a, `${b} ${a} should collapse to ${a}`);
  }
});

test("Tailwind's own numeric z-index scale still dedupes after extending the z group (regression guard)", () => {
  assert.equal(merge('z-10 z-20'), 'z-20');
  assert.equal(merge('z-20 z-10'), 'z-10');
});

test('an Arena z-index name and a numeric Tailwind z-index value now correctly conflict too (same group, same meaning)', () => {
  assert.equal(merge('z-dropdown z-10'), 'z-10');
  assert.equal(merge('z-10 z-dropdown'), 'z-dropdown');
});

/* Task 7 — `ls` re-derived from 4 tokens to 9, the same MISSING SELF-DEDUPE
 * failure as `pill`/z-index above, but only for the non-stock names.
 * `tracking-tight`/`tracking-normal`/`tracking-wide` are Tailwind's OWN
 * letter-spacing scale names, so tailwind-merge's bundled `tracking` group
 * already recognises and dedupes them with no help. `label` and the five
 * roles this task adds (`field-label`, `column-header`, `badge`,
 * `uppercase-status`, `mono-nav`) are not stock names, so pre-fix they were
 * classified into NO group and any two of them survived side by side in one
 * merged string. Verified pre-fix: `tracking-tight tracking-label` -> both. */
test('every registered Arena tracking name dedupes against a sibling, in both directions', () => {
  const names = ['tight', 'normal', 'mono-nav', 'uppercase-status', 'badge', 'column-header', 'field-label', 'label', 'wide'];
  for (let i = 0; i < names.length - 1; i++) {
    const a = `tracking-${names[i]}`, b = `tracking-${names[i + 1]}`;
    assert.equal(merge(`${a} ${b}`), b, `${a} ${b} should collapse to ${b}`);
    assert.equal(merge(`${b} ${a}`), a, `${b} ${a} should collapse to ${a}`);
  }
});

/* Fix pass 1 — this is the third time MISSING SELF-DEDUPE has been found one
 * namespace at a time (radius/z-index, then tracking, then this pass found
 * leading/blur/size/ease/max-w all at once). Hand-written cases like the
 * `tracking` block just above only prove the names someone thought to probe;
 * they say nothing about a namespace nobody probed. This block instead reads
 * frameworks/tailwind/theme.css itself — the same file tv.ts's registrations
 * are meant to track — extracts every Arena-defined namespace and its keys
 * mechanically, and asserts each namespace dedupes its own keys pairwise. A
 * new Arena key added to any of these namespaces without a matching tv.ts
 * registration now fails THIS test on the day it is added, rather than
 * shipping green until some future recipe happens to compose two of them.
 * (Precedent: scripts/token-preview.test.mjs derives its cases from
 * build-tokens.mjs's own FILES export rather than restating them by hand —
 * same move, applied here to tv.ts's registrations instead.) */

const themeCssPath = new URL('../frameworks/tailwind/theme.css', import.meta.url);
const [themeDecls] = [...parseDecls(readFileSync(themeCssPath, 'utf8')).values()];

/** Every Arena namespace in theme.css is opened with `--<ns>-*: initial;`
 *  before its keys are declared — that reset is what makes the namespace a
 *  closed, Arena-authored vocabulary rather than an open extension of
 *  Tailwind's own scale, so it doubles as the marker this derives the
 *  namespace list from, instead of hand-maintaining one. */
function deriveNamespaces(decls) {
  const namespaces = new Map();
  let current = null;
  for (const [name, value] of decls) {
    const reset = /^([a-z][a-z0-9-]*)-\*$/.exec(name);
    if (reset && value.trim() === 'initial') {
      current = reset[1];
      namespaces.set(current, []);
      continue;
    }
    if (current && name.startsWith(`${current}-`)) {
      namespaces.get(current).push(name.slice(current.length + 1));
    }
  }
  return namespaces;
}

/* A namespace name is not always the utility-class prefix consumers write
 * (tv.ts's own header comment already found this once: `radius`'s classes
 * are `rounded-*`, `z-index`'s are `z-*`). `container`'s is `max-w-*` for
 * the same reason — confirmed against tailwind-merge's default-config
 * source, not guessed. Every other namespace here uses its own name as the
 * prefix. `font-weight` shares the bare `font-` prefix with `font` (family)
 * — that's fine, each namespace's keys are only ever paired against their
 * OWN siblings below, never against the other namespace on the same prefix. */
const PREFIX = {
  font: 'font',
  text: 'text',
  'font-weight': 'font',
  leading: 'leading',
  tracking: 'tracking',
  size: 'size',
  radius: 'rounded',
  shadow: 'shadow',
  ease: 'ease',
  blur: 'blur',
  'z-index': 'z',
  container: 'max-w',
};

/* `color` is the one namespace deliberately excluded, and not for
 * coexistence — every namespace here is a single-value CSS property scale
 * where two keys are always meant to conflict, `color` included. It's
 * excluded because the failure this test hunts for is structurally
 * impossible for it: tailwind-merge's theme matcher for `color` is `isAny`,
 * the broadest validator that exists, so no color suffix can ever go
 * unrecognised. It also has no single canonical utility prefix to test
 * with — the same values feed `bg-`, `text-`, `border-`, `ring-` and more,
 * each a different tailwind-merge class group. */
const SKIP = new Set(['color']);

const namespaces = deriveNamespaces(themeDecls);

test('every Arena namespace in theme.css is either mapped to a prefix or explicitly skipped', () => {
  for (const ns of namespaces.keys()) {
    assert.ok(PREFIX[ns] || SKIP.has(ns),
      `theme.css defines --${ns}-* but this test has no PREFIX entry and no SKIP reason for it — add one`);
  }
});

test('every Arena-defined namespace with 2+ keys dedupes its own keys pairwise, derived from theme.css', () => {
  let exercised = 0;
  for (const [ns, keys] of namespaces) {
    if (SKIP.has(ns) || keys.length < 2) continue;
    const prefix = PREFIX[ns];
    exercised++;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = `${prefix}-${keys[i]}`, b = `${prefix}-${keys[i + 1]}`;
      assert.equal(merge(`${a} ${b}`), b, `${a} ${b} should collapse to ${b} (namespace --${ns}-*)`);
      assert.equal(merge(`${b} ${a}`), a, `${b} ${a} should collapse to ${a} (namespace --${ns}-*)`);
    }
  }
  // Vacuous-pass guard: if theme.css's shape changed enough that nothing
  // qualified, the loop above would pass having asserted nothing.
  assert.ok(exercised >= 10, `expected to exercise most theme.css namespaces, only exercised ${exercised}`);
});

/* Namespaces with fewer than 2 Arena-defined keys have nothing of their own
 * to pair against, so the pairwise test above skips them — but that is not
 * the same as "safe": `blur-scrim` and `max-w-page` were each the ONLY
 * Arena key in their namespace, and each still failed to dedupe against a
 * plain Tailwind stock value in the same group pre-fix (verified: `blur-
 * scrim blur-sm` -> both; `max-w-page max-w-lg` -> both). This assertion
 * locks the single-key set so that if either namespace ever gains a second
 * Arena key, the hand-written cases below are the reminder to update. */
test('the single-Arena-key namespaces are exactly the ones with hand-written stock-pairing cases below', () => {
  const singleKey = [...namespaces].filter(([ns, keys]) => !SKIP.has(ns) && keys.length === 1).map(([ns]) => ns).sort();
  assert.deepEqual(singleKey, ['blur', 'container'].sort());
});

test('blur-scrim (the only Arena blur key) dedupes against a stock Tailwind blur size, in both directions', () => {
  assert.equal(merge('blur-scrim blur-sm'), 'blur-sm');
  assert.equal(merge('blur-sm blur-scrim'), 'blur-scrim');
});

test('max-w-page (Arena\'s --container-page) dedupes against a stock Tailwind max-w size, in both directions', () => {
  assert.equal(merge('max-w-page max-w-lg'), 'max-w-lg');
  assert.equal(merge('max-w-lg max-w-page'), 'max-w-page');
});

test('the enumerated dedupe test still coexists with a color class (no cross-group regression from the new registrations)', () => {
  const root = classes(merge('rounded-pill leading-body tracking-field-label bg-primary'));
  assert.ok(root.includes('rounded-pill'));
  assert.ok(root.includes('leading-body'));
  assert.ok(root.includes('tracking-field-label'));
  assert.ok(root.includes('bg-primary'));
});

test('tracking-field-label still coexists with a text color class (registration did not reopen the cross-group failure)', () => {
  const root = classes(merge('tracking-field-label text-primary'));
  assert.ok(root.includes('tracking-field-label'));
  assert.ok(root.includes('text-primary'));
});
