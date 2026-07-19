import test from 'node:test';
import assert from 'node:assert/strict';
import { scanValue, scanText, scanDefaultsAndCallSites, staleExemptions, EXEMPT } from './check-dimension-literals.mjs';

test('a bare number is a violation for a dimension-valued property', () => {
  assert.ok(scanValue('fontSize', '13'));
  assert.ok(scanValue('zIndex', '1000'));
  assert.ok(scanValue('fontWeight', '700'));
  assert.ok(scanValue('lineHeight', '1.55'));
});

test('a raw px length is a violation wherever it appears in the value', () => {
  assert.ok(scanValue('padding', "'0 18px'"));
  assert.ok(scanValue('border', "'1px solid var(--color-base-300)'"));
  assert.ok(scanValue('width', "'14px'"));
});

test('a raw em is a violation for letterSpacing, because em is where tracking is expressed', () => {
  assert.ok(scanValue('letterSpacing', "'.1em'"));
  assert.ok(scanValue('letterSpacing', "'-.02em'"));
  assert.ok(scanValue('letterSpacing', "'0.22em'"));
});

test('a var() into a token is legal', () => {
  assert.equal(scanValue('letterSpacing', "'var(--ls-label)'"), null);
  assert.equal(scanValue('fontSize', 'var(--dz-text)'), null);
  assert.equal(scanValue('padding', "'var(--dz-row-py) var(--dz-row-px)'"), null);
});

test('a calc() over tokens is legal, and its multipliers are not literals', () => {
  assert.equal(scanValue('width', "'calc(var(--sp-1) * 3.5)'"), null);
  assert.equal(scanValue('gap', "'calc(var(--sp-1) * 2.5)'"), null);
});

test('regression: a bare zero beside a calc() in the same shorthand is legal', () => {
  // '0 calc(var(--sp-1) * 3)' is two values, a zero side and a derived
  // side — not one value with a space in the middle. The space between "0"
  // and "calc" must not be read as a unit boundary: UNIT_LITERAL used to
  // allow whitespace before the unit letters, so "0 calc" matched with
  // "calc" standing in as a bogus unit.
  assert.equal(scanValue('padding', "'0 calc(var(--sp-1) * 3)'"), null);
  assert.equal(scanValue('padding', "'0 calc(var(--sp-1) * 6) calc(var(--sp-1) * 5.5)'"), null);
  assert.equal(scanValue('margin', "'0 0 0 calc(var(--sp-1) * 1)'"), null);
});

test('zero is legal, with or without quotes, including zero em', () => {
  assert.equal(scanValue('padding', '0'), null);
  assert.equal(scanValue('margin', "'0'"), null);
  assert.equal(scanValue('letterSpacing', "'0em'"), null);
});

test('a non-dimension unit the layer legitimately uses is legal', () => {
  assert.equal(scanValue('borderRadius', "'50%'"), null);
  assert.equal(scanValue('width', "'100%'"), null);
  assert.equal(scanValue('minWidth', "'0ch'"), null);
});

test('every unit on the free list stays legal', () => {
  for (const raw of ["'8%'", "'2ch'", "'1fr'", "'50vh'", "'50vw'", "'10vmin'", "'10vmax'", "'90deg'", "'1s'", "'200ms'"])
    assert.equal(scanValue('width', raw), null, raw);
});

test('a unit outside the free list fails closed, not just the ones already known', () => {
  assert.ok(scanValue('fontSize', "'12pt'"));
  assert.ok(scanValue('width', "'2cm'"));
  assert.ok(scanValue('width', "'3xyz'"));
});

test('lineHeight 1 is a violation, because it is a role and not a number', () => {
  assert.ok(scanValue('lineHeight', '1'));
});

test('scanText finds the property and the raw value together', () => {
  const found = scanText("const s = { fontSize: 13, padding: '0 18px', color: 'var(--mute)' };");
  assert.deepEqual(found.map((f) => f.prop), ['fontSize', 'padding']);
});

test('a property Arena does not govern is ignored', () => {
  assert.deepEqual(scanText("{ flexGrow: 1, opacity: 0.6, zoom: 2 }"), []);
});

test('a .d.ts-shaped declaration yields nothing', () => {
  // TypeScript's `prop?: type` breaks DECL on the `?` -- there is no
  // whitespace-only gap between the name and the colon, so the property
  // never matches. A .d.ts file is skipped by walk() before scanText ever
  // sees it, but this is the coincidence that made scanning one harmless
  // in the meantime, exercised directly.
  assert.deepEqual(scanText('export interface ButtonProps { fontSize?: number; padding?: string; }'), []);
});

test('scanText reports the 1-based line of each site', () => {
  const found = scanText("const a = 1;\nconst s = { fontSize: 13 };\nconst b = { padding: '0 18px' };\n");
  assert.deepEqual(found.map((f) => f.line), [2, 3]);
});

test('a percent in unquoted CSS text is captured whole, not truncated to a bare number', () => {
  assert.deepEqual(scanText('left:-40%'), []);
  assert.deepEqual(scanText('width:40%'), []);
});

test('regression: ProgressBar.jsx keyframe text no longer reads as three violations', () => {
  // The exact shape of ProgressBar.jsx's injected <style> textContent: CSS
  // text inside a JS string, not an object literal. `left` and `width` are
  // governed properties, but -40%/100%/40% are legal free-unit percentages,
  // not bare numbers -- the DECL bareword class truncating `%` used to lose
  // the unit and misread each one as a violation.
  const keyframes =
    '@keyframes arena-prog{0%{left:-40%}100%{left:100%}}' +
    '.arena-prog-ind::after{content:"";position:absolute;top:0;bottom:0;width:40%;border-radius:inherit;background:currentColor;animation:arena-prog 1.15s var(--ease-in-out) infinite}' +
    '@media (prefers-reduced-motion:reduce){.arena-prog-ind::after{animation-duration:2.4s}}';
  assert.deepEqual(scanText(keyframes), []);
});

test("regression: '4 px' (a space before the unit) is a violation, not a legal length", () => {
  // A previous fix required the digits and the unit letters to be adjacent,
  // to stop '0 calc(...)' misreading "calc" as a bogus unit (see the
  // regression test above this one). That fix over-corrected: CSS has no
  // such thing as a spaced-out length, so '4 px' is not a legal alternate
  // spelling of '4px' -- it is the same bare literal with a typo, and must
  // still fail. The (?!\() guard is what lets both stay true at once.
  assert.ok(scanValue('padding', "'4 px'"));
  assert.ok(scanValue('width', "'12 pt'"));
  assert.deepEqual(scanText("const s = { padding: '4 px' };").map((f) => f.prop), ['padding']);
});

test('regression: a bare zero beside calc() stays legal, and a mixed calc()+px shorthand still flags, with the (?!\\() guard in place', () => {
  assert.equal(scanValue('padding', "'0 calc(var(--sp-1) * 3)'"), null);
  assert.ok(scanValue('width', "'calc(var(--sp-1) * 2) 4px'"));
});

// --- Form A: ternary branches -----------------------------------------
// `prop: cond ? branchA : branchB` -- DECL alone stops at the condition,
// which is never itself a literal, so whichever branch IS one used to be
// invisible.

test('a ternary branch that is a bare literal is a violation', () => {
  const found = scanText("const s = { fontWeight: on ? 600 : 400 };");
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'fontWeight', raw: '600' },
    { prop: 'fontWeight', raw: '400' },
  ]);
});

test('a ternary whose branches are already tokens is legal on both sides', () => {
  assert.deepEqual(scanText("const s = { width: full ? '100%' : 'auto' };"), []);
  assert.deepEqual(
    scanText("const s = { fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)' };"),
    []
  );
});

test('a ternary nested inside a string concatenation still resolves its branches', () => {
  // `'var(--bw) solid ' + (cond ? 'a' : 'b')` -- the outer value is a
  // concatenation, not a pure ternary, but both branches are still judged;
  // a token on both sides stays legal.
  const found = scanText(
    "const s = { border: 'var(--bw) solid ' + (locked ? 'var(--danger)' : 'var(--color-base-300)') };"
  );
  assert.deepEqual(found, []);
});

// --- Form B: default parameters -----------------------------------------
// `function Icon({ size = 18 })` -- a destructured default uses `=`, not
// `:`, so DECL never sees it at all.

test('a default parameter whose name is itself a governed CSS property is a violation', () => {
  const src = "function Dialog({ open, title, width = 480 }) {\n  return null;\n}";
  const found = scanDefaultsAndCallSites(src);
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'width', raw: '480' },
  ]);
});

test('a default parameter on a named passthrough component resolves through the alias', () => {
  // Icon's own prop is called `size`, not `fontSize` -- PASSTHROUGH is what
  // tells the gate the two are the same value one line away.
  const src = "function Icon({ name, size = 18, weight = 'bold' }) {\n  return null;\n}";
  const found = scanDefaultsAndCallSites(src);
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'fontSize', raw: '18' },
  ]);
});

test('a default parameter whose name is neither a governed prop nor a registered passthrough is ignored', () => {
  const src = "function Toast({ title, tone = 'neutral', persist = false }) {\n  return null;\n}";
  assert.deepEqual(scanDefaultsAndCallSites(src), []);
});

test('a default parameter assigning an already-resolved token is legal', () => {
  const src = "function Icon({ size = 'var(--icon-lg)' }) {\n  return null;\n}";
  assert.deepEqual(scanDefaultsAndCallSites(src), []);
});

test('a plain variable assignment outside a parameter list is never in scope', () => {
  // `const top = Math.min(...)` reads exactly like `top = <expr>`, but it
  // sits outside any `({ ... })` parameter list and must not be mistaken
  // for a component default.
  const src = "function f() {\n  const top = Math.min(anchorRect.bottom + 12, 900 - 220);\n  return top;\n}";
  assert.deepEqual(scanDefaultsAndCallSites(src), []);
});

// --- Form C: component props at the call site ---------------------------
// `<Icon size={16} />` renders a dimension at the call site; PASSTHROUGH is
// the same named, hand-curated registry form B reads, applied to JSX
// attributes instead of a default value.

test('a JSX call site overriding a registered passthrough prop with a bare number is a violation', () => {
  const found = scanDefaultsAndCallSites('<Icon name="plus" size={16} />');
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'fontSize', raw: '16' },
  ]);
});

test('a JSX call site passing a token through a registered passthrough prop is legal', () => {
  assert.deepEqual(scanDefaultsAndCallSites('<Icon name="plus" size={\'var(--icon-md)\'} />'), []);
});

test('a JSX prop on a component NOT in the passthrough registry is never scanned, by design', () => {
  // The gate does not attempt to infer whether an arbitrary prop reaches a
  // governed CSS property -- `<Textarea rows={3} />` and `<input
  // maxLength={20} />` are ordinary numeric props Arena has no opinion
  // about, and only a named, hand-curated entry (like Icon's own) puts a
  // component in scope for this scan at all.
  assert.deepEqual(scanDefaultsAndCallSites('<Textarea rows={3} />'), []);
  assert.deepEqual(scanDefaultsAndCallSites('<input maxLength={20} />'), []);
});

// --- Form D: inline arithmetic (narrow) ----------------------------------
// `prop: ident * 0.4` -- the whole value is an expression, so neither
// scanValue's bare-number path nor a var()/calc() derivation ever sees the
// literal inside it. Deliberately narrow: it stops at the first operator
// and does not reach into a wrapping function call.

test('an inline arithmetic expression standing as the whole value is a violation', () => {
  const found = scanText('const s = { fontSize: d * 0.4 };');
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'fontSize', raw: 'd * 0.4' },
  ]);
});

// --- Fix pass 1: a bare literal inside a wrapping call ------------------
// `width: Math.max(8, d * 0.28)` -- fix pass 0 left this out of scope
// (the operator does not follow the identifier immediately, a `(` does).
// Fix pass 1 closes it: CALL judges each top-level argument on its own,
// and ARITH's leading term now accepts an optional call suffix so a
// literal combined arithmetically with a call result (`y(m) - 5`) is
// caught the same way `d * 0.4` already was.

test('a bare-number argument inside a wrapping call is a violation', () => {
  const found = scanText('const s = { width: Math.max(8, d * 0.28) };');
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'width', raw: '8' },
  ]);
});

test('a call with no bare-number argument is legal -- the call result alone is a derived value', () => {
  assert.deepEqual(scanText('const s = { height: y(endMin) };'), []);
  assert.deepEqual(scanText('const s = { top: y(m) };'), []);
});

test('an identifier argument inside a wrapping call is left alone, same as a lone ratio', () => {
  // `d * 0.28` is not itself a bare number (it carries an identifier), so
  // it is not flagged standing as a call argument any more than `d * 0.4`
  // is flagged standing alone -- both need EXEMPT only if they are a real
  // site, not because the scanner over-reaches into them.
  assert.deepEqual(scanText('const s = { width: Math.max(8, d * 0.28) };').map((f) => f.raw), ['8']);
});

test('two governed props on the same line each report their own call argument', () => {
  const found = scanText(
    "const s = { width: Math.max(8, d * 0.28), height: Math.max(8, d * 0.28) };"
  );
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'width', raw: '8' },
    { prop: 'height', raw: '8' },
  ]);
});

test('a bare number combined arithmetically with a call result is a violation', () => {
  // `y(m) - 5` is the same shape as `d * 0.4`, with a call standing in for
  // the plain identifier -- ARITH's leading term now accepts an optional
  // single-level call suffix rather than gaining a second pattern.
  const found = scanText('const s = { top: y(m) - 5 };');
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'top', raw: 'y(m) - 5' },
  ]);
});

test('a call result combined arithmetically with a number, with brackets in the call, still resolves', () => {
  const found = scanText('const s = { top: yOf(values[hover]) - 8 };');
  assert.deepEqual(found.map((f) => ({ prop: f.prop, raw: f.raw })), [
    { prop: 'top', raw: 'yOf(values[hover]) - 8' },
  ]);
});

test('a nested-parens call is deliberately out of scope, not misread', () => {
  // Both CALL and ARITH's call suffix are single-level (`[^()]*`); a
  // second parenthesised layer needs real parsing, not a wider class, and
  // no real site in the codebase has this shape.
  assert.deepEqual(scanText('const s = { width: Math.max(8, Math.min(d, 40)) };'), []);
});

test('EXEMPT records the three out-of-scope literals this task leaves untouched, by name', () => {
  assert.ok(EXEMPT.has('frameworks/react/components/display/Avatar.jsx:fontSize:d * 0.4'));
  assert.ok(EXEMPT.has('frameworks/react/components/brand/Rotor.jsx:width:48'));
  assert.ok(EXEMPT.has('frameworks/react/ui_kits/console/Shell.jsx:width:30'));
  assert.ok(EXEMPT.has('frameworks/react/ui_kits/console/LoginScreen.jsx:width:40'));
});

// --- Fix pass 1: a stale exemption must fail, not pass silently ---------
// EXEMPT is only honest if an entry naming a site that stopped producing a
// violation is loud about it -- otherwise a real regression can hide
// behind an exemption nobody is reading anymore.

test('every current EXEMPT key is matched by this run -- none are stale', () => {
  // The positive case, exercised against the real EXEMPT map: every key
  // it carries right now corresponds to a site the scan actually visits
  // (Calendar's zIndex, Avatar's ratio, Rotor's default and its two call
  // sites) is proven by the full collect() pass in the CLI-level checks
  // (`bun scripts/check-dimension-literals.mjs`); staleExemptions is unit
  // tested directly against a synthetic matched set below, since it takes
  // no filesystem dependency.
  const allKeys = new Set(EXEMPT.keys());
  assert.deepEqual(staleExemptions(allKeys), []);
});

test('an EXEMPT key absent from the matched set is reported as stale', () => {
  const oneMissing = new Set(EXEMPT.keys());
  const [firstKey] = EXEMPT.keys();
  oneMissing.delete(firstKey);
  assert.deepEqual(staleExemptions(oneMissing), [firstKey]);
});

test('an empty matched set reports every EXEMPT entry as stale', () => {
  assert.deepEqual(staleExemptions(new Set()), [...EXEMPT.keys()]);
});
