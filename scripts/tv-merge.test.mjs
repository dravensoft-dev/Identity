import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getDefaultConfig } from 'tailwind-merge';
import { tv, ARENA_SPACING_SUFFIXES, spacingConsumingGroups } from '../frameworks/tailwind/tv.ts';
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

/* The same assertion against a real recipe — Tag's — lives in
 * frameworks/angular/test/tag-variants.test.ts, not here. It has to: this
 * file is in scripts/, which is the one suite check-all.mjs also runs under
 * plain node, and reaching into the Angular layer from here dragged node into
 * resolving `tag.variants.ts`'s own extensionless `from '../../../tailwind/tv'`
 * — the idiom every file in that layer uses, and the one Angular's tsc
 * expects. Bun resolves it, node does not, so this one import made
 * `node scripts/check-all.mjs` fail on a defect that existed in neither layer.
 * The boundary CLAUDE.md draws (scripts/ stays runtime-portable, framework
 * suites are bun-only because they import .ts and .jsx directly) is the fix;
 * the coverage is unchanged, because `bun run check` runs both suites. */

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
 * `tracking` block above only prove the names someone thought to probe; they
 * say nothing about a namespace nobody probed. This block instead reads
 * frameworks/tailwind/theme.css itself — the same file tv.ts's registrations
 * are meant to track — extracts Arena's namespaces and their keys
 * mechanically, and asserts each namespace dedupes its own keys pairwise. A
 * new Arena key added to a namespace THIS DERIVATION FINDS, without a
 * matching tv.ts registration, now fails this test the day it is added.
 * (Precedent: scripts/token-preview.test.mjs derives its cases from
 * build-tokens.mjs's own FILES export rather than restating them by hand —
 * same move, applied here to tv.ts's registrations instead.)
 *
 * That claim had a real gap on first landing — fix pass 1's derivation found
 * a namespace only via its `--<ns>-*: initial;` reset line, so it silently
 * missed the one namespace theme.css leaves open on purpose (`--spacing-*`).
 * Fix pass 2, immediately below, closes that: namespace membership is now
 * decided from the key name itself. Nothing here claims to be exhaustive
 * over "every conceivable namespace" — only over the ones a key can actually
 * resolve to, which is `resetNamespaces` (Arena's own, `size`/`z-index`)
 * unioned with `NATIVE_THEME_NAMESPACES` (Tailwind's fixed, documented set,
 * `spacing` included). A wholly new, non-native, unreset namespace is the
 * one shape this still could not find — see the residual-gap test below. */

const themeCssPath = new URL('../frameworks/tailwind/theme.css', import.meta.url);
const [themeDecls] = [...parseDecls(readFileSync(themeCssPath, 'utf8')).values()];

/* Fix pass 2 — the first version of this derivation keyed namespace
 * discovery off `--<ns>-*: initial;` reset lines, which is a PROXY for "this
 * is an Arena namespace," not the thing itself, and the proxy broke exactly
 * once: `--spacing-*` is deliberately left open (theme.css's own comment —
 * Tailwind's numeric scale has to keep working alongside Arena's named
 * steps), so it has no reset line and was entirely invisible to the old
 * scan. Real cost: `Button.manifest.json`'s `h-ctl-h`/`h-ctl-h-sm`/
 * `h-ctl-h-lg` never deduped, and nothing caught it.
 *
 * Namespaces are now derived from the key name itself. `NATIVE_THEME_NAMESPACES`
 * is Tailwind's own fixed set of `@theme` namespaces — sourced from
 * tailwind-merge's `getDefaultConfig().theme` keys, not listed from memory —
 * and a key belongs to one of those namespaces whether or not OUR theme.css
 * happens to reset it, `spacing` included. Reset lines are still read
 * (`resetNamespaces`), because two Arena namespaces (`size`, `z-index`) are
 * NOT native Tailwind theme namespaces — they're Arena's own, riding on
 * tailwind-merge's generic per-classGroup mechanism instead of a `fromTheme`
 * getter — so a reset is the only signal that exists for them. A key is
 * assigned to the LONGEST candidate namespace (from either source) that
 * prefixes it, so `--font-weight-regular` resolves to `font-weight`, not
 * `font` + key `weight-regular`. */
const NATIVE_THEME_NAMESPACES = new Set(Object.keys(getDefaultConfig().theme));

function deriveNamespaces(decls) {
  const resetNamespaces = new Set();
  for (const [name, value] of decls) {
    const reset = /^([a-z][a-z0-9-]*)-\*$/.exec(name);
    if (reset && value.trim() === 'initial') resetNamespaces.add(reset[1]);
  }
  const knownNamespaces = [...new Set([...resetNamespaces, ...NATIVE_THEME_NAMESPACES])]
    .sort((a, b) => b.length - a.length); // longest first: font-weight before font

  const namespaces = new Map();
  for (const [name] of decls) {
    if (/-\*$/.test(name)) continue; // a reset declaration itself, not a key
    const ns = knownNamespaces.find((candidate) => name.startsWith(`${candidate}-`));
    if (!ns) continue;
    if (!namespaces.has(ns)) namespaces.set(ns, []);
    namespaces.get(ns).push(name.slice(ns.length + 1));
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

/* `color` and `spacing` are the two namespaces deliberately excluded from
 * the single-prefix pairwise loop below, and neither is for coexistence —
 * every namespace here is a single-value CSS property scale where two keys
 * are always meant to conflict, both of these included. `color` is excluded
 * because the failure this test hunts for is structurally impossible for
 * it: tailwind-merge's theme matcher for `color` is `isAny`, the broadest
 * validator that exists, so no color suffix can ever go unrecognised.
 * `spacing` is excluded because, unlike every other namespace here, it has
 * no single canonical utility prefix — dozens of groups read it (`p*`,
 * `m*`, `h`, `w`, `gap*`, `inset*`...), so one representative prefix
 * couldn't stand in for the namespace the way `rounded-` can for `radius`.
 * Both still get real coverage: `color` because its matcher makes the
 * failure impossible, `spacing` via the dedicated generated-registration
 * tests below, which exercise every consuming group tv.ts found, not just
 * one prefix. */
const SKIP = new Set(['color', 'spacing']);

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

/* Fix pass 2 — `--spacing-*` itself. `spacing` is excluded from the
 * single-prefix loop above (see SKIP's comment: no one canonical prefix),
 * so its coverage lives here instead, exercising `spacingConsumingGroups()`
 * — the same function tv.ts uses to generate its own registrations — against
 * the real `tv()` merge. This is the live case the coordinator's review
 * found: Button.manifest.json composes `h-ctl-h`, `h-ctl-h-sm` and
 * `h-ctl-h-lg` across its three sizes, so a base slot overridden by a size
 * variant produces exactly the two-classes-in-one-string shape this file
 * guards against — verified pre-fix, both survived. */
test('Arena spacing suffixes dedupe against each other under every tailwind-merge group that reads the spacing scale', () => {
  const groups = spacingConsumingGroups();
  let exercised = 0;
  for (const [groupId, classParts] of Object.entries(groups)) {
    for (const classPart of classParts) {
      exercised++;
      const a = `${classPart}-${ARENA_SPACING_SUFFIXES[0]}`, b = `${classPart}-${ARENA_SPACING_SUFFIXES[1]}`;
      assert.equal(merge(`${a} ${b}`), b, `${a} ${b} should collapse to ${b} (group ${groupId})`);
      assert.equal(merge(`${b} ${a}`), a, `${b} ${a} should collapse to ${a} (group ${groupId})`);
    }
  }
  // Vacuous-pass guard, same shape as the namespace loop above: tailwind-merge
  // reads spacing from dozens of groups today (p*, m*, gap*, inset*, h/w...);
  // if a future tailwind-merge major stopped exposing most of them the loop
  // would pass having asserted almost nothing.
  assert.ok(exercised >= 40, `expected spacingConsumingGroups() to find most of tailwind-merge's spacing-reading groups, only exercised ${exercised}`);
});

test('the exact cases the coordinator\'s review found broken now behave correctly, h-ctl-h/w-ctl-h stays two classes', () => {
  assert.equal(merge('h-ctl-h-sm h-ctl-h-lg'), 'h-ctl-h-lg');
  assert.equal(merge('py-row-py py-4'), 'py-4');
  assert.equal(merge('gap-stack gap-2'), 'gap-2');
  assert.equal(merge('p-4 p-6'), 'p-6'); // unaffected regression guard: plain numeric spacing still dedupes
  const root = classes(merge('h-ctl-h w-ctl-h')); // different CSS properties -- must NOT collapse
  assert.ok(root.includes('h-ctl-h'), `h-ctl-h w-ctl-h -> "${root.join(' ')}" (height was wrongly eaten)`);
  assert.ok(root.includes('w-ctl-h'), `h-ctl-h w-ctl-h -> "${root.join(' ')}" (width was wrongly eaten)`);
});

test('Button.manifest.json\'s three ctl-h heights now dedupe against each other through tv()', async () => {
  const { default: manifest } = await import('../frameworks/tailwind/components/Button.manifest.json', { with: { type: 'json' } });
  const buttonStyles = tv(manifest);
  const heights = { sm: 'h-ctl-h-sm', md: 'h-ctl-h', lg: 'h-ctl-h-lg' };
  for (const size of ['sm', 'md', 'lg']) {
    const root = classes(buttonStyles({ variant: 'primary', size }).root());
    const heightClasses = root.filter((c) => c.startsWith('h-ctl-h'));
    assert.deepEqual(heightClasses, [heights[size]], `size ${size}: expected exactly one height class, got "${heightClasses.join(', ')}"`);
  }
});

/* The residual gap this pass leaves, named rather than rounded up to "full
 * stop": a namespace that is BOTH unreset (no `--<ns>-*: initial;`) AND not
 * one of tailwind-merge's own native `@theme` namespaces would still be
 * invisible to `deriveNamespaces` -- there is no third signal left to find
 * it by. That shape does not exist in theme.css today (`spacing` was the
 * only unreset namespace, and it IS native), so this is not a live bug, but
 * it is why "every Arena-defined key" is no longer this file's claim.
 *
 * This test proves the fix for the shape that WAS live: a fake key added to
 * `spacing` -- unreset, exactly like the real thing -- is still found and
 * assigned, with no reset line anywhere in the fixture. */
test('a fake key added to an unreset-but-native namespace (spacing\'s own shape) is still found by namespace derivation', () => {
  const fakeThemeCss = `
    @theme {
      --color-*: initial;
      --color-primary: red;
      --color-secondary: blue;
      --spacing: var(--sp-1);
      --spacing-1: var(--sp-1);
      --spacing-ctl-h: var(--dz-ctl-h);
      --spacing-fake-test-key: var(--sp-1);
    }
  `;
  const [fakeDecls] = [...parseDecls(fakeThemeCss).values()];
  const fakeNamespaces = deriveNamespaces(fakeDecls);
  assert.ok(fakeNamespaces.has('spacing'),
    'spacing has no --spacing-*: initial reset in this fixture either, matching theme.css\'s real shape -- it must still be found');
  assert.ok(fakeNamespaces.get('spacing').includes('fake-test-key'),
    'a fake key on the open spacing namespace was not picked up -- this is the exact escape fix pass 2 closes');
});

/* Fix pass 3 — the gap fix pass 2 named honestly ("a namespace both unreset
 * and non-native would still go undetected") turned out to be worse than
 * untested: it is INVISIBLE. A namespace shaped like `--widget-shape-round`/
 * `--widget-shape-square` never enters `namespaces` at all (deriveNamespaces
 * has no candidate to match it against), so the "every namespace is mapped
 * or skipped" assertion above has nothing to fail — a whole new Arena
 * namespace of that shape could ship with zero protection and a fully green
 * suite. Five times now this defect class has been found and "closed," and
 * four of those closures were accurate about their own coverage and silent
 * about what sat just outside it. This is the one way to actually close it:
 * stop trusting namespace attribution and independently check that nothing
 * was left out of it.
 *
 * Precedent: scripts/check-tailwind-coverage.mjs already does this shape for
 * tokens vs. the Tailwind preset — an EXCLUDED map of token -> reason, and a
 * stale entry (naming a token that no longer exists) fails exactly like a
 * missing one. UNATTRIBUTED below is that same map for this file. */

/** Every Arena-defined property in theme.css that LOOKS like a namespaced
 *  key — `--<namespace>-<suffix>`, i.e. a non-reset declaration with at
 *  least one hyphen after its first word — is a candidate that must end up
 *  either attributed to a namespace by deriveNamespaces, or named in
 *  UNATTRIBUTED with a reason. A bare property with no suffix at all
 *  (`--spacing`, the base multiplier) has no namespace-shaped suffix to
 *  attribute in the first place, so it is not a candidate — there is
 *  nothing for it to fail against, the same way a component with no props
 *  is not a candidate for a missing-prop lint. */
function namespacedPropertyCandidates(decls) {
  const candidates = [];
  for (const [name] of decls) {
    if (/-\*$/.test(name)) continue; // a reset declaration itself, not a key
    if (/^[a-z][a-z0-9]*-[a-z0-9.-]+$/.test(name)) candidates.push(name);
  }
  return candidates;
}

/** Properties that legitimately attribute to no namespace, and why. Both
 *  reasons here are the same shape: `--default-*` wires a Tailwind default
 *  directly (theme.css's own comment: "derives from --font-sans, which we
 *  cleared, so it is set here") rather than exposing an Arena scale with
 *  siblings to self-dedupe against — there is no second `--default-font-
 *  family` to conflict with. This is NOT where `blur`'s or `container`'s
 *  single key belongs: `blur-scrim` and `max-w-page` (via `container-page`)
 *  ARE attributed to their namespace by deriveNamespaces (namespaces.get
 *  returns a one-element array for each) — they just have no SIBLING to
 *  pair against in the pairwise-dedupe loop above, which is a different,
 *  already-handled gap (see the single-Arena-key test and its hand-written
 *  stock-pairing cases). Only a property that never enters `namespaces` at
 *  all belongs here. */
const UNATTRIBUTED = new Map([
  ['default-font-family', 'wires a Tailwind default directly (theme.css: "derives from --font-sans, which we cleared"); not an Arena scale with a sibling to self-dedupe against'],
  ['default-transition-duration', 'wires a Tailwind default directly; not an Arena scale with a sibling to self-dedupe against'],
  ['default-transition-timing-function', 'wires a Tailwind default directly; not an Arena scale with a sibling to self-dedupe against'],
]);

test('every namespaced-looking property in theme.css is attributed to a namespace or listed in UNATTRIBUTED with a reason', () => {
  const candidates = namespacedPropertyCandidates(themeDecls);
  const attributedNames = new Set();
  for (const [ns, keys] of namespaces) for (const key of keys) attributedNames.add(`${ns}-${key}`);

  const errs = [];
  for (const name of candidates) {
    const isAttributed = attributedNames.has(name);
    const isListed = UNATTRIBUTED.has(name);
    if (isAttributed && isListed) errs.push(`--${name} is both attributed to a namespace AND in UNATTRIBUTED — drop the entry`);
    else if (!isAttributed && !isListed) errs.push(`--${name} is not attributed to any namespace and not in UNATTRIBUTED with a reason — this is the exact escape fix pass 3 closes, add one or the other`);
  }
  // Mirrors check-tailwind-coverage.mjs's own stale-entry check: an
  // UNATTRIBUTED reason naming a property that no longer exists (renamed,
  // deleted, or since attributed by a namespace change) must fail too, or
  // the list only ever grows and stops meaning anything.
  const candidateSet = new Set(candidates);
  for (const name of UNATTRIBUTED.keys())
    if (!candidateSet.has(name)) errs.push(`UNATTRIBUTED lists --${name} but no such property exists in theme.css — drop the entry`);

  assert.deepEqual(errs, [], errs.join('\n'));
});

/* Proves the completeness check actually catches the escaped shape, not a
 * variant of it: a fake key under a namespace that is BOTH unreset (no
 * `--<ns>-*: initial;`) AND not native to Tailwind (`widget-shape` is not
 * one of tailwind-merge's own `@theme` namespaces) is exactly what
 * `--widget-shape-round`/`--widget-shape-square` would be — deriveNamespaces
 * has no way to find it (see the residual-gap comment in tv.ts), so it must
 * surface here, in the completeness check, instead. */
test('a fake key in an unreset, non-native namespace is caught by the completeness check, not silently invisible', () => {
  const fakeThemeCss = `
    @theme {
      --color-*: initial;
      --color-primary: red;
      --widget-shape-round: 999px;
    }
  `;
  const [fakeDecls] = [...parseDecls(fakeThemeCss).values()];
  const fakeNamespaces = deriveNamespaces(fakeDecls);
  assert.ok(!fakeNamespaces.has('widget-shape'), 'widget-shape is neither reset nor native -- deriveNamespaces should still miss it (that is the gap this test exists to catch downstream)');

  const candidates = namespacedPropertyCandidates(fakeDecls);
  const attributedNames = new Set();
  for (const [ns, keys] of fakeNamespaces) for (const key of keys) attributedNames.add(`${ns}-${key}`);
  const unattributed = candidates.filter((name) => !attributedNames.has(name) && !UNATTRIBUTED.has(name));
  assert.deepEqual(unattributed, ['widget-shape-round'],
    'the completeness check must name widget-shape-round as unattributed and unlisted -- if this is empty, the fake key slipped through invisibly again');
});
