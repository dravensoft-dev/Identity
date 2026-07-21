import test from 'node:test';
import assert from 'node:assert/strict';
import { scanValue, scanText, scanInjectedCss, scanAttributes, scanDefaultsAndCallSites, staleExemptions, stalePassthrough, expressionLeaves, EXEMPT } from './check-dimension-literals.mjs';

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

// --- Task 5: data-to-pixel projections, revealed by the interpolation fix --
// Closing the interpolation hole also caught four sites that were never a
// dimension literal to begin with: a chart's hover position and a calendar's
// time-of-day position/duration are runtime projections of data, not design
// dimensions, and have no token to read. Avatar's own ratio (the fifth site
// the same hole used to hide) is NOT here: this task turns Avatar's diameter
// into a token, so its ratio is no longer exempt at all -- it is legal
// outright, via calc() over a real token.

test('EXEMPT records the four data-to-pixel projections this task newly exempts, by name', () => {
  assert.ok(EXEMPT.has('frameworks/react/components/charts/BarChart.jsx:top:`calc(${yOf(values[hover])}px - var(--sp-2))`'));
  assert.ok(EXEMPT.has('frameworks/react/components/charts/LineChart.jsx:top:`calc(${yOf(values[hover])}px - calc(var(--sp-1) * 2.5))`'));
  assert.ok(EXEMPT.has('frameworks/react/components/display/Calendar.jsx:top:`calc(${y(m)}px - var(--sp-1))`'));
  assert.ok(EXEMPT.has('frameworks/react/components/display/Calendar.jsx:height:`max(calc(var(--sp-1) * 4.5), ${rawH}px)`'));
  assert.ok(!EXEMPT.has('frameworks/react/components/display/Avatar.jsx:fontSize:d * 0.4'));
});

// --- Fix pass 1: a stale exemption must fail, not pass silently ---------
// EXEMPT is only honest if an entry naming a site that stopped producing a
// violation is loud about it -- otherwise a real regression can hide
// behind an exemption nobody is reading anymore.

test('every current EXEMPT key is matched by this run -- none are stale', () => {
  // The positive case, exercised against the real EXEMPT map: every key
  // it carries right now corresponds to a site the scan actually visits
  // (Calendar's zIndex, the data-to-pixel projections onto a screen
  // position -- a chart's hover offset, Calendar's clock-minute offset and
  // event-duration height) is proven by the full collect() pass in the CLI-level checks
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

// --- Fix pass 2, finding 3: TERNARY mis-captured a nested ternary --------
// `fontSize: a ? (b ? 12 : 14) : 16` used to garble into fragments and let
// all three literals escape. expressionLeaves is the balanced-text reader
// that replaced the single regex; both the parenthesised and the
// right-chained (no parens) nested shapes must resolve to every leaf.

test('a parenthesised nested ternary resolves every leaf', () => {
  assert.deepEqual(expressionLeaves("a ? (b ? 12 : 14) : 16"), ['12', '14', '16']);
});

test('a right-chained nested ternary (no parens) resolves every leaf', () => {
  assert.deepEqual(expressionLeaves("size === 'sm' ? 4 : size === 'lg' ? 10 : 6"), ['4', '10', '6']);
});

test('all three literals of a nested ternary at a governed colon are flagged', () => {
  const found = scanText('const s = { fontSize: a ? (b ? 12 : 14) : 16 };');
  assert.deepEqual(found.map((f) => f.raw), ['12', '14', '16']);
});

test('a nested ternary whose leaves are all tokens stays legal', () => {
  assert.deepEqual(
    scanText("const s = { fontWeight: a ? (b ? 'var(--fw-bold)' : 'var(--fw-medium)') : 'var(--fw-regular)' };"),
    []
  );
});

// --- Fix pass 2, finding 1: a literal reached through a variable ---------
// `const h = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;` then `height: h`
// elsewhere defeated every scanner, which all required the literal to sit
// at (or be reachable from) a governed prop's own colon. The dataflow rule
// is deliberately narrow: BOTH the declaration must carry a literal AND
// the identifier must appear bare at a governed colon in the same file.

test('a literal reached through an intermediate variable is a violation, attributed to the declaration line', () => {
  const src = [
    "function ProgressBar({ size }) {",
    "  const h = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;",
    "  return React.createElement('div', { style: { height: h } });",
    "}",
  ].join('\n');
  const found = scanText(src);
  assert.deepEqual(found.map((f) => ({ raw: f.raw, prop: f.prop, line: f.line })), [
    { raw: '4', prop: 'height', line: 2 },
    { raw: '10', prop: 'height', line: 2 },
    { raw: '6', prop: 'height', line: 2 },
  ]);
});

test('an OR-fallback reached through an intermediate variable is a violation', () => {
  const src = [
    "function Skeleton({ height, width }) {",
    "  const d = height || width || 40;",
    "  return React.createElement('div', { style: { width: d, height: d } });",
    "}",
  ].join('\n');
  const found = scanText(src);
  assert.deepEqual(found.map((f) => f.raw), ['40']);
});

test('a declaration whose identifier never reaches a governed colon is left alone', () => {
  // Most local `const x = ...<number>...` declarations in this layer are
  // indices, lengths and counts -- condition (b) of the dataflow rule
  // (the identifier must appear bare at a governed colon) is what leaves
  // them alone, not a guess about what the number means.
  const src = [
    "function Chart({ values }) {",
    "  const pct = Math.max(0, Math.min(100, Math.round(values[0])));",
    "  return React.createElement('span', null, pct + '%');",
    "}",
  ].join('\n');
  assert.deepEqual(scanText(src), []);
});

test('a declaration whose value has no literal at all is left alone even when its identifier is used bare', () => {
  const src = [
    "function Avatar({ size }) {",
    "  const SIZES = { sm: 32, md: 40 };",
    "  const d = SIZES[size] || SIZES.md;",
    "  return React.createElement('span', { style: { width: d, height: d } });",
    "}",
  ].join('\n');
  assert.deepEqual(scanText(src), []);
});

test('a value already resolved to a token through the variable is legal, not re-flagged', () => {
  // Guards against a false positive once the site is actually fixed: `h`
  // holding a var()/calc() string, then used bare at `height: h`, must not
  // read as though the string itself were a bare literal.
  const src = [
    "function ProgressBar({ size }) {",
    "  const h = size === 'sm' ? 'var(--sp-1)' : 'calc(var(--sp-1) * 2.5)';",
    "  return React.createElement('div', { style: { height: h } });",
    "}",
  ].join('\n');
  assert.deepEqual(scanText(src), []);
});

// --- Fix pass 2, finding 2: reworded, not overclaimed ---------------------
// A flat `width: Math.min(100, val)` written directly at a governed colon
// IS caught (fix pass 1's CALL scanner) -- the earlier claim that
// non-dimension sites "structurally cannot reach" a colon overclaimed.
// What is actually true: no EXEMPT entry is needed today because today's
// non-dimension sites all assign through a variable first.

test('a flat call written directly at a governed colon with a non-dimension shape IS caught, unlike the same call behind a variable', () => {
  // The exact shape finding 2 named: Math.min(100, val) clamping a
  // percentage. Written flat, it is indistinguishable from a genuine
  // dimension -- the gate has no semantic understanding of "percentage"
  // vs "pixels", only of where a bare number sits.
  const found = scanText("const s = { width: Math.min(100, val) };");
  assert.deepEqual(found.map((f) => f.raw), ['100']);
});

test('the same shallow non-dimension call is still traced through a variable, since the dataflow rule reuses scanLeaf on the declaration', () => {
  // `const pct = Math.min(100, val); ... width: pct` -- the dataflow rule
  // judges the declaration's own leaves with the same scanLeaf a colon
  // value gets, and `Math.min(100, val)` is a single-level CALL shape, so
  // its bare-number argument is still visible. A variable is not, by
  // itself, a hiding place -- see the next test for the shape that
  // actually is one.
  const src = [
    "function Thing({ val }) {",
    "  const pct = Math.min(100, val);",
    "  return React.createElement('div', { style: { width: pct } });",
    "}",
  ].join('\n');
  const found = scanText(src);
  assert.deepEqual(found.map((f) => f.raw), ['100']);
});

test('the real boundary: a nested call behind a variable is not caught, the exact shape ProgressBar\'s own percent clamp has', () => {
  // `Math.max(0, Math.min(100, Math.round(value)))` has parens nested two
  // deep. scanLeaf's CALL_SHAPE is deliberately single-level (matching
  // ARITH's own boundary, tested elsewhere) -- a real site with this exact
  // shape (ProgressBar.jsx's own `pct`) is confirmed NOT a dimension by
  // the author, and this is the one case where "not caught" and "not
  // reachable by this narrow rule" happen to coincide. It is not caught
  // even when the identifier IS used bare at a governed colon (unlike the
  // real ProgressBar, where it never is) -- stated here as the honest
  // limit, not inferred as safe from the shape alone.
  const src = [
    "function Thing({ value }) {",
    "  const pct = Math.max(0, Math.min(100, Math.round(value)));",
    "  return React.createElement('div', { style: { width: pct } });",
    "}",
  ].join('\n');
  assert.deepEqual(scanText(src), []);
});

// --- Fix pass 2, finding 4: PASSTHROUGH staleness -------------------------

test('a PASSTHROUGH entry with a match is not stale', () => {
  assert.deepEqual(stalePassthrough(new Set(['Icon', 'AppLogo'])), []);
});

test('a renamed PASSTHROUGH component fails as stale', () => {
  assert.deepEqual(stalePassthrough(new Set(['AppLogo'])), ['Icon']);
});

test('every PASSTHROUGH entry is stale when nothing in the tree matches', () => {
  assert.deepEqual(stalePassthrough(new Set()), ['Icon', 'AppLogo']);
});

// --- Regression: comments must never corrupt the balanced-text scan ------
// The balanced-text reader has no concept of `//`/`/* */` comments, and
// this codebase's own house style backtick-quotes code references in
// prose (`` `width:` ``, `` `--sp-1` ``). A governed prop name followed by
// a colon and a stray backtick, sitting in a comment, used to send the
// reader hunting for a closing backtick anywhere later in the file,
// garbling everything in between into one fake violation.

test('a line comment shaped like a colon-value is never read as one', () => {
  const src = [
    "function Thing() {",
    "  // The rendered `width:` further down must equal the token below.",
    "  return React.createElement('div', { style: { width: 'var(--sp-4)' } });",
    "}",
  ].join('\n');
  assert.deepEqual(scanText(src), []);
});

test('a line comment containing an unmatched backtick does not swallow the rest of the file', () => {
  const src = [
    "// a stray ` backtick with no partner on this line",
    "const s = { fontSize: 13 };",
  ].join('\n');
  const found = scanText(src);
  assert.deepEqual(found.map((f) => ({ raw: f.raw, line: f.line })), [{ raw: '13', line: 2 }]);
});

test('a block comment containing a colon-shaped fragment is never read as a value', () => {
  const src = [
    "/* padding: 999 -- an old note, not live code */",
    "const s = { padding: 'var(--sp-2)' };",
  ].join('\n');
  assert.deepEqual(scanText(src), []);
});

test('a `//` or `/*` inside a real string is not mistaken for a comment', () => {
  assert.deepEqual(scanText("const s = { content: '// not a comment', width: 'var(--sp-4)' };"), []);
});

test('blanking comments preserves line numbers exactly', () => {
  const src = [
    "// line 1 comment, `fontSize:` mentioned here",
    "// line 2 comment",
    "const s = { fontSize: 13 };",
  ].join('\n');
  const found = scanText(src);
  assert.deepEqual(found[0].line, 3);
});

test('a focus ring written by hand is a dimension literal', () => {
  assert.ok(scanValue('boxShadow', "'0 0 0 2px var(--gold-soft)'"));
  assert.equal(scanValue('boxShadow', "'0 0 0 var(--focus-width) var(--gold-soft)'"), null);
  assert.equal(scanValue('boxShadow', "'var(--shadow-2)'"), null);
  assert.equal(scanValue('boxShadow', "'none'"), null);
});

test('a transform carrying a dimension is judged; a ratio or a share is not', () => {
  assert.ok(scanValue('transform', "'translateX(18px)'"));
  assert.equal(scanValue('transform', "'translateX(calc(var(--sp-1) * 4.5))'"), null);
  assert.equal(scanValue('transform', "'translate(-50%,-100%)'"), null);
  assert.equal(scanValue('transform', "'scale(0.98)'"), null);
  assert.equal(scanValue('transform', "'rotate(120deg)'"), null);
  assert.equal(scanValue('transform', "'none'"), null);
});

// --- Task 4: injected CSS (a <style> string, not a JS object literal) ----
// Every @keyframes in this layer ships inside `s.textContent = '...'`
// because an inline style object cannot express a keyframe. scanText's
// PROP_COLON/readValue pair is shaped for a JS object literal (stops at
// `,`/`}`, only matches unbroken-letter property names) and only ever
// caught anything inside these strings by coincidence -- `transform` has
// no hyphen in either grammar. scanInjectedCss reads the string as CSS on
// its own terms: `;`/`}`-terminated declarations, kebab-case properties
// mapped to the camelCase name PROPS uses.

test('a dimension inside injected CSS is judged like any other', () => {
  const source = [
    "const s = document.createElement('style');",
    "s.textContent = '@keyframes arena-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}';",
  ].join('\n');
  const hits = scanInjectedCss(source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].prop, 'transform');
  assert.match(hits[0].reason, /raw px/);
  assert.equal(hits[0].line, 2);
});

test('injected CSS built from tokens is clean', () => {
  const source = "s.textContent = '.a{animation:x var(--loop-spin) linear infinite;transform:translateY(var(--sp-2))}';";
  assert.deepEqual(scanInjectedCss(source), []);
});

test('a percentage inside injected CSS is not a dimension', () => {
  const source = "s.textContent = '@keyframes a{0%{left:-140%}100%{left:140%}}';";
  assert.deepEqual(scanInjectedCss(source), []);
});

test('a string that is not CSS is left alone', () => {
  assert.deepEqual(scanInjectedCss("const label = 'Step 1 of 4: 12px away';"), []);
});

test('a kebab-case CSS property is judged under its camelCase name', () => {
  const hits = scanInjectedCss("s.textContent = '.a{border-width:2px;box-shadow:0 0 0 2px var(--gold-soft)}';");
  assert.deepEqual(hits.map((h) => h.prop).sort(), ['borderWidth', 'boxShadow']);
});

// --- Final review finding 1: CSS split across `+`-concatenated literals --
// Every injected style in this layer is actually built by `+`-concatenating
// several string literals (Skeleton.jsx's shimmer is the real example:
// '.arena-skeleton{background-image:...;' + 'background-size:...;animation:...}').
// The shape test used to run per string literal, so a fragment with no `{`
// of its own vanished entirely, even though the concatenated whole is
// unmistakably one CSS rule.

test('CSS split across `+`-concatenated string literals is read as one rule', () => {
  assert.equal(scanInjectedCss("s.textContent = '.a{margin-top:8px}';").length, 1);
  const hits = scanInjectedCss("s.textContent = '.a{' + 'margin-top:8px}';");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].prop, 'marginTop');
});

// --- Task 5: a template interpolation must not hide the unit after it ----
// `` `max(calc(var(--sp-1) * 2), ${d * 0.28}px)` `` passes today: UNIT_LITERAL
// needs a digit immediately adjacent to a unit, and the interpolation's `}`
// sits between the expression and `px`, breaking that adjacency.

test('an interpolation does not hide the unit that follows it', () => {
  assert.ok(scanValue('width', '`max(calc(var(--sp-1) * 2), ${d * 0.28}px)`'));
  assert.ok(scanValue('height', '`${size}px`'));
});

test('an interpolation in a unit nothing models is still fine', () => {
  assert.equal(scanValue('width', '`${share}%`'), null);
});

test('an interpolated derivation of tokens is fine', () => {
  assert.equal(scanValue('fontSize', '`calc(${d} * 0.4)`'), null);
});

// --- Task 6: the ATTRIBUTE form — prop="value", not prop: value ----------
// scanValue('fontSize', "'16'") already flags; fontSize="10" in a chart's
// JSX does not, because DECL/PROP_COLON require a colon and a JSX attribute
// uses `=`. The value is catchable, the position is not — scanAttributes
// closes it, reusing scanValue so the judgment stays identical to every
// other scanner in this file.

test('an SVG presentation attribute is a governed site', () => {
  const hits = scanAttributes('<text fontSize="10" strokeWidth="2">x</text>');
  assert.deepEqual(hits.map((h) => h.prop).sort(), ['fontSize', 'strokeWidth']);
});

test('an attribute reading a token is clean', () => {
  assert.deepEqual(scanAttributes('<line style={{ strokeWidth: \'var(--bw)\' }} />'), []);
  assert.deepEqual(scanAttributes('<svg width="100%" viewBox="0 0 100 100" />'), []);
});

test('an attribute bound to an expression is out of scope', () => {
  assert.deepEqual(scanAttributes('<circle r={hover ? 5 : 4} cx={x} />'), []);
});

test('a hyphen-prefixed attribute whose tail matches a governed name is not misread as that name', () => {
  // The lookbehind (?<![\w.]) excludes a preceding word character or `.`,
  // but not a hyphen -- so `data-width="20"` used to match at "width" the
  // same as a real `width="20"` would, a false positive for any kebab-case
  // attribute (data-*, aria-*) whose tail happens to spell a governed name.
  assert.deepEqual(scanAttributes('<div data-width="20" data-height="10" />'), []);
});
