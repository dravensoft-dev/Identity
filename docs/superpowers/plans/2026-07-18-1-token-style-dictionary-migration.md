# Token migration to Style Dictionary (DTCG) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution order: 1 of 6.** **Status: EXECUTED** — shipped in `v4.0.0`
(`a30ee9d`). The checkboxes below were never ticked; the artefacts are the
record. Do not re-run this plan.

| # | Plan | Status |
|---|---|---|
| 1 | `2026-07-18-1-token-style-dictionary-migration.md` | **Executed** (v4.0.0) |
| 2 | `2026-07-18-2-overview-token-page.md` | **Executed** (v4.0.0) |
| 3 | `2026-07-18-3-framework-layer-token-coverage.md` | **Executed** (unreleased) |
| 4 | `2026-07-18-4-token-geometry-boundary.md` | Pending |
| 5 | framework-layer parity — **plan not yet written**, spec at `specs/2026-07-18-framework-layer-parity-design.md` | Pending |
| 6 | `2026-07-18-6-four-package-build-publish.md` | Pending |

**Goal:** Make strictly-conformant DTCG 2025.10 JSON in `tokens/src/` the single source of Arena's token values, generating `tokens/{palette,typography,spacing,effects}.css` from it with Style Dictionary v4, with zero behavioral change save the retirement of `--glow-accent`.

**Architecture:** Style Dictionary v4 is used **only as a loader, reference resolver and name transformer** — never as a value transformer or file writer. `scripts/build-tokens.mjs` calls `sd.getPlatformTokens()` per source file to obtain resolved, kebab-named tokens, then a hand-written serializer (`scripts/lib/serialize-token.mjs`) renders each DTCG value back to Arena's exact CSS string, and blocks are composed into the four output files. This split is load-bearing: **SD v4's built-in CSS transforms do not understand DTCG 2025.10 structured values** (`{value,unit}` dimensions, structured `color` objects) — full 2025.10 support is slated for SD v5 — so applying `transformGroup: 'css'` would corrupt every value. Two gates protect the result: `check-dtcg.mjs` (source conforms to 2025.10) and `check-tokens-generated.mjs` (committed CSS == freshly generated CSS).

**Tech Stack:** Bun 1.3 (ESM), `style-dictionary@^4` (only new dependency), `node:test` (built in, no test framework dependency added — `bun test` runs `node:test` suites natively, failures and all).

**Runtime note.** The build and check scripts run on Bun, and the five pre-existing
`scripts/*.mjs` gates move to Bun with them so the toolchain stays uniform (Task 9).
Nothing in the scripts is Bun-specific: they are plain ESM importing only `node:fs`,
`node:path` and `node:url`, and were verified to produce byte-identical output under both
runtimes. Bun blocks `style-dictionary`'s `postinstall` (`patch-package`), which is inert
— the published tarball ships no `patches/` directory.

## Global Constraints

- **English only** — all code, comments, docs, and UI copy.
- **No emoji** anywhere, in product or docs.
- Spec of record: `docs/superpowers/specs/2026-07-18-token-style-dictionary-migration-design.md`.
- **Style Dictionary is never given a `transformGroup`.** The only transform applied is `name/kebab`. Any built-in value transform corrupts 2025.10 structured values.
- **DTCG source is strict 2025.10**: `dimension`/`duration` are `{value,unit}` objects (unit required even at 0), `color` is a structured object (`colorSpace`, `components`, optional `alpha`/`hex`), `number` is a bare number. No bare hex strings, no `"64px"` strings.
- **The four generated CSS files are committed to git**, not ignored — the plugin is served from the release tag and the copy-in kit reads them directly.
- `tokens/colors.css`, `tokens/fonts.css`, `styles.css`, `scripts/fetch-fonts.mjs`, `scripts/check-ramp.mjs`, `scripts/check-text-contrast.mjs`, `scripts/validate-palette.mjs`, `scripts/check-release.mjs` are **unchanged**.
- `node_modules/` is **already** in `.gitignore` (verified) — no `.gitignore` edit is needed despite the spec listing one.
- Generated declaration syntax is exactly `  --name:value;` (two-space indent, no space after the colon), matching today's files.
- Cutting a release (version bump, tag, `check-release.mjs`) is **out of scope** — a separate user-triggered step.
- Everything landing on `main` after a tag goes under `## [Unreleased]` in `CHANGELOG.md`.

## Deviations from the spec (accepted, and why)

Three points where this plan refines the spec. Implement the plan; the spec's intent is preserved in each case.

1. **§D "one custom CSS format" via `registerFormat` → direct `getPlatformTokens()` + own serializer.** Verified empirically: `sd.getPlatformTokens('css')` returns the fully resolved, `name/kebab`-named dictionary with structured `$value`s intact and no file written. Composing blocks in plain Node is simpler and fully deterministic than round-tripping through SD's file writer for multi-selector output. Same result, less machinery.
2. **`frameworks/tailwind/components/Button.manifest.json` also consumes `--glow-accent`** (line 8, `hover:shadow-[var(--glow-accent)]`). The spec's affected-files list omits it. Leaving it would ship a dangling `var()` and silently drop the Tailwind primary button's hover shadow. Task 7 fixes it alongside the other consumers.
3. **`.gitignore` needs no edit** — `node_modules/` is already ignored.

## Pre-validated during planning

The riskiest part of this plan — that Style Dictionary v4 passes strict 2025.10
structured values through untouched, and that the serializer reproduces Arena's CSS
byte-for-byte — was **run for real before this plan was written**, not assumed:

- `sd.getPlatformTokens('css')` with `transforms: ['name/kebab']` returns structured
  `$value`s intact, correct kebab names (`fs-display`, `color-cat-1`, `bw-strong`,
  `container-max`, `ease-in-out`), and preserves `$extensions` and `$description`.
- The Task 2 serializer, fed the Task 4 JSON for `effects.json` and `typography.json`,
  reproduced today's `tokens/effects.css` and `tokens/typography.css` with **zero
  declaration differences** other than the intentionally removed `--glow-accent`. Every
  awkward case held: `--sp-0:0`, `--ls-normal:0`, `--lh-tight:0.98`,
  `cubic-bezier(.4,0,.2,1)`, `rgba(0,0,0,.5)`, `'Archivo',system-ui,sans-serif`.

`palette.*` and `spacing`/`density.compact` were not spiked; Task 5 Step 3 is where they
get proven.

## File Structure

**New — build and check scripts:**
- `scripts/lib/serialize-token.mjs` — pure DTCG value → CSS string. One responsibility, heavily tested. No I/O, no SD import.
- `scripts/lib/css-decls.mjs` — pure CSS text → `{selector: {prop: value}}`. Used by the generated-check. No I/O.
- `scripts/build-tokens.mjs` — SD wiring, block composition, file writing.
- `scripts/check-dtcg.mjs` — DTCG 2025.10 conformance gate over `tokens/src/**/*.json`.
- `scripts/check-tokens-generated.mjs` — drift gate: generated == committed.
- `scripts/serialize-token.test.mjs`, `scripts/css-decls.test.mjs`, `scripts/check-dtcg.test.mjs` — `node:test` suites.

**New — token source:**
- `tokens/src/palette.dark.json`, `palette.light.json`, `typography.json`, `spacing.json`, `density.compact.json`, `effects.json`, `TYPE-MAP.md`.

**New — repo root:** `package.json` (private, dev-only).

**Regenerated (still committed):** `tokens/palette.css`, `tokens/typography.css`, `tokens/spacing.css`, `tokens/effects.css`.

**Edited:** `CLAUDE.md`, `README.md`, `CHANGELOG.md`, `frameworks/react/components/forms/Button.jsx`, `frameworks/tailwind/components/Button.manifest.json`, `Arena - Overview.dc.html`, `guidelines/effects-shadow.html`.

## The golden baseline is git

No snapshot file is created. The four CSS files are already committed at `HEAD`, so `git diff` **is** the golden test during migration, and `check-tokens-generated.mjs` is the permanent gate afterward. Task 6 asserts the diff contains exactly one removed declaration.

---

### Task 1: Dev tooling and the CSS declaration parser

**Files:**
- Create: `package.json`
- Create: `scripts/lib/css-decls.mjs`
- Test: `scripts/css-decls.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `parseDecls(cssText) → Map<string, Map<string,string>>` — outer key is the selector as written (`:root`, `.arena-light`, `.arena-compact`), inner map is custom-property name (without `--`) → value string, comments stripped. Task 6 consumes it.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "arena",
  "private": true,
  "type": "module",
  "devDependencies": {
    "style-dictionary": "^4"
  },
  "scripts": {
    "build:tokens": "bun scripts/build-tokens.mjs",
    "check:tokens": "bun scripts/check-tokens-generated.mjs",
    "check:dtcg": "bun scripts/check-dtcg.mjs",
    "test": "bun test scripts/"
  }
}
```

- [ ] **Step 2: Install the dependency**

Run: `bun install`
Expected: `node_modules/` created, `bun.lock` written, `style-dictionary` at 4.x. Confirm with `bun -e "console.log(require('style-dictionary/package.json').version)"` → prints `4.x.y`.

- [ ] **Step 3: Confirm `node_modules/` is already git-ignored**

Run: `git check-ignore -v node_modules/`
Expected: prints a match from `.gitignore` (`.gitignore:2:node_modules/`). If it does **not** match, add `node_modules/` to `.gitignore` before continuing.

- [ ] **Step 4: Write the failing test**

Create `scripts/css-decls.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDecls } from './lib/css-decls.mjs';

test('parses one selector block into name/value pairs', () => {
  const out = parseDecls(':root{\n  --sp-0:0;\n  --sp-1:4px;\n}\n');
  assert.deepEqual([...out.keys()], [':root']);
  assert.equal(out.get(':root').get('sp-0'), '0');
  assert.equal(out.get(':root').get('sp-1'), '4px');
});

test('parses multiple selector blocks and keeps them separate', () => {
  const out = parseDecls(':root{--a:1px}\n.arena-light{--a:2px}\n');
  assert.equal(out.get(':root').get('a'), '1px');
  assert.equal(out.get('.arena-light').get('a'), '2px');
});

test('strips block comments, including ones between declarations', () => {
  const css = '/* header */\n:root{\n  /* note */\n  --a:1px; /* trailing */\n  --b:2px;\n}\n';
  const out = parseDecls(css);
  assert.deepEqual([...out.get(':root').entries()], [['a', '1px'], ['b', '2px']]);
});

test('keeps values containing commas, parens and spaces intact', () => {
  const out = parseDecls(":root{--shadow-1:0 2px 6px -2px rgba(0,0,0,.5);--font-body:'Familjen Grotesk',system-ui,sans-serif;}");
  assert.equal(out.get(':root').get('shadow-1'), '0 2px 6px -2px rgba(0,0,0,.5)');
  assert.equal(out.get(':root').get('font-body'), "'Familjen Grotesk',system-ui,sans-serif");
});

test('ignores non-custom-property declarations', () => {
  const out = parseDecls(':root{color:red;--a:1px}');
  assert.deepEqual([...out.get(':root').keys()], ['a']);
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `bun test scripts/css-decls.test.mjs`
Expected: FAIL — `Cannot find module '.../scripts/lib/css-decls.mjs'`.

- [ ] **Step 6: Implement the parser**

Create `scripts/lib/css-decls.mjs`:

```js
/* Parses a token CSS file into its declaration sets, one per selector.
 * These files contain no nested braces and no at-rules, so a flat scan is
 * exact here — this is deliberately not a general CSS parser. */

/** @param {string} cssText
 *  @returns {Map<string, Map<string, string>>} selector → (custom property name without `--`) → value */
export function parseDecls(cssText) {
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Map();
  for (const m of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    const decls = out.get(selector) ?? new Map();
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i === -1) continue;
      const name = d.slice(0, i).trim();
      if (!name.startsWith('--')) continue;
      decls.set(name.slice(2), d.slice(i + 1).trim());
    }
    out.set(selector, decls);
  }
  return out;
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `bun test scripts/css-decls.test.mjs`
Expected: PASS, 5/5.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lock scripts/lib/css-decls.mjs scripts/css-decls.test.mjs
git commit -m "build: add dev-only package.json and a token CSS declaration parser"
```

---

### Task 2: The DTCG value serializer

**Files:**
- Create: `scripts/lib/serialize-token.mjs`
- Test: `scripts/serialize-token.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `serialize(token) → string`, where `token` is a resolved Style Dictionary token object carrying `$type`, `$value` and optionally `$extensions`. Task 5 (`build-tokens.mjs`) consumes it.

**Serialization rules — these reproduce today's CSS exactly:**

| `$type` | Rule | Example |
|---|---|---|
| `dimension` | `value === 0` → `0`, else `` `${value}${unit}` `` | `{value:64,unit:'px'}` → `64px`; `{value:0,unit:'px'}` → `0` |
| `duration` | `` `${value}${unit}` `` | `{value:120,unit:'ms'}` → `120ms` |
| `number` | with `$extensions['com.dravensoft.arena'].cssUnit` → `0` if 0, else `` `${value}${cssUnit}` ``; otherwise the bare number | `-0.02` + `em` → `-0.02em`; `0` + `em` → `0`; `0.98` → `0.98` |
| `fontWeight` | the bare number | `700` → `700` |
| `cubicBezier` | `cubic-bezier(a,b,c,d)` with **leading zeros stripped** | `[0.2,0.7,0.3,1]` → `cubic-bezier(.2,.7,.3,1)` |
| `color` | `hex` present → that hex verbatim; else `rgba(r,g,b,a)` with `r,g,b = round(c*255)` and **alpha's leading zero stripped** | → `#b52a20`; → `rgba(20,16,16,.6)` |
| `fontFamily` | join with `,`; quote each family in `'…'` unless it is a CSS generic keyword | `['Archivo','system-ui','sans-serif']` → `'Archivo',system-ui,sans-serif` |
| `shadow` | `` `${dim(offsetX)} ${dim(offsetY)} ${dim(blur)} ${dim(spread)} ${color}` `` | → `0 2px 6px -2px rgba(0,0,0,.5)` |

Leading-zero stripping is **type-scoped**: it applies to `cubicBezier` components and `color` alpha only. `--lh-tight` stays `0.98`, `--ls-tight` stays `-0.02em`.

- [ ] **Step 1: Write the failing test**

Create `scripts/serialize-token.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { serialize } from './lib/serialize-token.mjs';

const px = (value) => ({ value, unit: 'px' });
const em = { $extensions: { 'com.dravensoft.arena': { cssUnit: 'em' } } };

test('dimension renders value+unit, and bare 0 at zero', () => {
  assert.equal(serialize({ $type: 'dimension', $value: px(64) }), '64px');
  assert.equal(serialize({ $type: 'dimension', $value: px(999) }), '999px');
  assert.equal(serialize({ $type: 'dimension', $value: px(0) }), '0');
});

test('duration keeps its unit even though it is a time', () => {
  assert.equal(serialize({ $type: 'duration', $value: { value: 120, unit: 'ms' } }), '120ms');
});

test('number renders bare, or with the cssUnit hint when present', () => {
  assert.equal(serialize({ $type: 'number', $value: 0.98 }), '0.98');
  assert.equal(serialize({ $type: 'number', $value: 1.6 }), '1.6');
  assert.equal(serialize({ $type: 'number', $value: -0.02, ...em }), '-0.02em');
  assert.equal(serialize({ $type: 'number', $value: 0.22, ...em }), '0.22em');
  assert.equal(serialize({ $type: 'number', $value: 0, ...em }), '0');
});

test('fontWeight renders the bare number', () => {
  assert.equal(serialize({ $type: 'fontWeight', $value: 400 }), '400');
  assert.equal(serialize({ $type: 'fontWeight', $value: 900 }), '900');
});

test('cubicBezier strips leading zeros, matching the shipped easings', () => {
  assert.equal(serialize({ $type: 'cubicBezier', $value: [0.2, 0.7, 0.3, 1] }), 'cubic-bezier(.2,.7,.3,1)');
  assert.equal(serialize({ $type: 'cubicBezier', $value: [0.4, 0, 0.2, 1] }), 'cubic-bezier(.4,0,.2,1)');
  assert.equal(serialize({ $type: 'cubicBezier', $value: [0.2, 0.9, 0.1, 1] }), 'cubic-bezier(.2,.9,.1,1)');
});

test('color with a hex field emits that hex verbatim', () => {
  const t = { $type: 'color', $value: { colorSpace: 'srgb', components: [0.7098, 0.1647, 0.1255], hex: '#b52a20' } };
  assert.equal(serialize(t), '#b52a20');
});

test('color without a hex field reconstructs rgba, stripping the alpha leading zero', () => {
  const scrim = { $type: 'color', $value: { colorSpace: 'srgb', components: [0.0784, 0.0627, 0.0627], alpha: 0.6 } };
  assert.equal(serialize(scrim), 'rgba(20,16,16,.6)');
  const black = { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 } };
  assert.equal(serialize(black), 'rgba(0,0,0,.5)');
});

test('fontFamily quotes real families and leaves generics bare', () => {
  assert.equal(serialize({ $type: 'fontFamily', $value: ['Archivo', 'system-ui', 'sans-serif'] }),
    "'Archivo',system-ui,sans-serif");
  assert.equal(serialize({ $type: 'fontFamily', $value: ['Familjen Grotesk', 'system-ui', 'sans-serif'] }),
    "'Familjen Grotesk',system-ui,sans-serif");
  assert.equal(serialize({ $type: 'fontFamily', $value: ['Spline Sans Mono', 'ui-monospace', 'monospace'] }),
    "'Spline Sans Mono',ui-monospace,monospace");
});

test('shadow renders the four dimensions then the color', () => {
  const t = { $type: 'shadow', $value: {
    offsetX: px(0), offsetY: px(12), blur: px(28), spread: px(-12),
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.6 },
  } };
  assert.equal(serialize(t), '0 12px 28px -12px rgba(0,0,0,.6)');
});

test('an unknown type is a hard error, never a silent passthrough', () => {
  assert.throws(() => serialize({ $type: 'gradient', $value: {} }), /unsupported \$type: gradient/);
  assert.throws(() => serialize({ $value: 1 }), /unsupported \$type: undefined/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/serialize-token.test.mjs`
Expected: FAIL — `Cannot find module '.../scripts/lib/serialize-token.mjs'`.

- [ ] **Step 3: Implement the serializer**

Create `scripts/lib/serialize-token.mjs`:

```js
/* Renders a strict DTCG 2025.10 value back to the CSS string Arena ships.
 *
 * Style Dictionary v4 is never allowed to transform these values — its built-in
 * CSS transforms predate 2025.10 and do not understand structured colors or
 * {value,unit} dimensions. Everything below is Arena's own rendering, and the
 * golden gate (scripts/check-tokens-generated.mjs) is what holds it honest. */

const EXT = 'com.dravensoft.arena';

/** CSS generic font families, which are keywords and must not be quoted. */
const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  'math', 'emoji', 'fangsong',
]);

/** Strips the leading zero of a sub-unit number: 0.6 -> ".6". Used only where
 *  Arena's shipped CSS does so — cubic-bezier components and rgba alpha. */
const trim = (n) => String(n).replace(/^(-?)0\./, '$1.');

/** A dimension renders bare at zero, matching `--sp-0:0`. */
const dim = (d) => (d.value === 0 ? '0' : `${d.value}${d.unit}`);

const color = (c) => {
  if (c.hex) return c.hex;
  const [r, g, b] = c.components.map((v) => Math.round(v * 255));
  const a = c.alpha ?? 1;
  return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${trim(a)})`;
};

/** @param {{ $type?: string, $value: unknown, $extensions?: Record<string, any> }} token */
export function serialize(token) {
  const v = token.$value;
  switch (token.$type) {
    case 'dimension':
      return dim(v);
    case 'duration':
      return `${v.value}${v.unit}`;
    case 'number': {
      const unit = token.$extensions?.[EXT]?.cssUnit;
      if (!unit) return String(v);
      return v === 0 ? '0' : `${v}${unit}`;
    }
    case 'fontWeight':
      return String(v);
    case 'cubicBezier':
      return `cubic-bezier(${v.map(trim).join(',')})`;
    case 'color':
      return color(v);
    case 'fontFamily':
      return (Array.isArray(v) ? v : [v])
        .map((f) => (GENERIC_FAMILIES.has(f) ? f : `'${f}'`))
        .join(',');
    case 'shadow':
      return `${dim(v.offsetX)} ${dim(v.offsetY)} ${dim(v.blur)} ${dim(v.spread)} ${color(v.color)}`;
    default:
      throw new Error(`serialize: unsupported $type: ${token.$type}`);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/serialize-token.test.mjs`
Expected: PASS, 11/11.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/serialize-token.mjs scripts/serialize-token.test.mjs
git commit -m "build: add the DTCG 2025.10 value serializer"
```

---

### Task 3: The DTCG 2025.10 conformance gate

**Files:**
- Create: `scripts/check-dtcg.mjs`
- Test: `scripts/check-dtcg.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `validateTree(tree, fileLabel) → string[]` (array of human-readable violations, empty when conformant), exported for the test. The module also runs as a CLI over `tokens/src/**/*.json`, exiting 1 on any violation.

**The rules it enforces (DTCG 2025.10):**
- A node is a token iff it has `$value`. Every token must resolve a `$type` — own, or inherited from the nearest ancestor group. A token with none is **invalid**, not opaque.
- `color`: object with `colorSpace: "srgb"`, `components` of 3 numbers in `[0,1]`, optional `alpha` in `[0,1]`, optional `hex` matching `/^#[0-9a-f]{6}$/`. **Arena extra gate:** when `hex` is present it must round-trip the components (`round(c*255)` equals the hex byte) — this is what stops the two representations drifting apart.
- `dimension`: `{value: number, unit: "px"|"rem"}`, `unit` **required even when `value` is 0**.
- `duration`: `{value: number, unit: "ms"|"s"}`.
- `number`: a finite number. `fontWeight`: a number in `[1,1000]`. `fontFamily`: a non-empty string, or a non-empty array of non-empty strings.
- `cubicBezier`: 4 numbers, with `x1`/`x2` (indices 0 and 2) in `[0,1]`.
- `shadow`: object with `offsetX`/`offsetY`/`blur`/`spread` as dimensions and `color` as a color.
- `$extensions` keys must be reverse-DNS (`/^[a-z0-9-]+(\.[a-z0-9-]+)+$/`).
- Token/group names must not contain `.`, `{`, `}` or start with `$`.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-dtcg.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTree } from './check-dtcg.mjs';

const ok = (tree) => assert.deepEqual(validateTree(tree, 'f.json'), []);
const fails = (tree, re) => {
  const errs = validateTree(tree, 'f.json');
  assert.ok(errs.length > 0, 'expected at least one violation');
  assert.match(errs.join('\n'), re);
};

test('accepts a conformant tree with group-level $type inheritance', () => {
  ok({ sp: { $type: 'dimension', 0: { $value: { value: 0, unit: 'px' } }, 1: { $value: { value: 4, unit: 'px' } } } });
});

test('rejects a token that resolves no $type', () => {
  fails({ mystery: { $value: 3 } }, /no \$type/);
});

test('rejects a bare hex string color', () => {
  fails({ c: { $type: 'color', p: { $value: '#b52a20' } } }, /color .* object/);
});

test('accepts a structured srgb color and rejects out-of-range components', () => {
  ok({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [0.1, 0.2, 0.3] } } } });
  fails({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [1.5, 0, 0] } } } }, /components/);
});

test('rejects a hex that does not round-trip its components', () => {
  ok({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [0.7098, 0.1647, 0.1255], hex: '#b52a20' } } } });
  fails({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#b52a20' } } } }, /hex .* components/);
});

test('rejects a string dimension and a dimension missing its unit', () => {
  fails({ d: { $type: 'dimension', a: { $value: '64px' } } }, /dimension .* object/);
  fails({ d: { $type: 'dimension', a: { $value: { value: 0 } } } }, /unit/);
});

test('rejects a cubicBezier with the wrong arity or an out-of-range x', () => {
  ok({ e: { $type: 'cubicBezier', a: { $value: [0.2, 0.7, 0.3, 1] } } });
  fails({ e: { $type: 'cubicBezier', a: { $value: [0.2, 0.7, 0.3] } } }, /four numbers/);
  fails({ e: { $type: 'cubicBezier', a: { $value: [1.4, 0.7, 0.3, 1] } } }, /between 0 and 1/);
});

test('validates a shadow composite down to its parts', () => {
  const px = (value) => ({ value, unit: 'px' });
  ok({ s: { $type: 'shadow', a: { $value: {
    offsetX: px(0), offsetY: px(2), blur: px(6), spread: px(-2),
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 } } } } });
  fails({ s: { $type: 'shadow', a: { $value: { offsetX: px(0), offsetY: px(2), blur: px(6) } } } }, /spread/);
});

test('rejects a non reverse-DNS $extensions key', () => {
  fails({ n: { $type: 'number', a: { $value: 1, $extensions: { cssUnit: 'em' } } } }, /reverse-DNS/);
  ok({ n: { $type: 'number', a: { $value: 1, $extensions: { 'com.dravensoft.arena': { cssUnit: 'em' } } } } });
});

test('rejects a token name containing a dot', () => {
  fails({ 'a.b': { $type: 'number', $value: 1 } }, /name/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/check-dtcg.test.mjs`
Expected: FAIL — `Cannot find module '.../scripts/check-dtcg.mjs'`.

- [ ] **Step 3: Implement the validator**

Create `scripts/check-dtcg.mjs`:

```js
/* Asserts every token in tokens/src/ is valid DTCG 2025.10 — the first stable
 * Format Module (W3C, Oct 2025).
 *
 * Following the repo's check-*.mjs convention this encodes the 2025.10 rules
 * directly rather than pulling a validator dependency. It is the machine proof
 * that Arena's token layer is DTCG in full, not merely DTCG-shaped.
 *
 *   bun scripts/check-dtcg.mjs      -> exit 0 if every token validates, 1 otherwise
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RESERVED = new Set(['$value', '$type', '$description', '$extensions', '$deprecated']);
const DNS = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const HEX = /^#[0-9a-f]{6}$/;

const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const inRange = (v, lo, hi) => isNum(v) && v >= lo && v <= hi;

function checkDimension(v, at, errs, unitsAllowed = ['px', 'rem']) {
  if (!isObj(v)) return errs.push(`${at}: dimension must be a {value,unit} object, got ${JSON.stringify(v)}`);
  if (!isNum(v.value)) errs.push(`${at}: dimension value must be a number`);
  if (!unitsAllowed.includes(v.unit)) errs.push(`${at}: dimension unit must be one of ${unitsAllowed.join('|')} and is required even at 0`);
}

function checkColor(v, at, errs) {
  if (!isObj(v)) return errs.push(`${at}: color must be a structured object, got ${JSON.stringify(v)}`);
  if (v.colorSpace !== 'srgb') errs.push(`${at}: color colorSpace must be "srgb"`);
  if (!Array.isArray(v.components) || v.components.length !== 3 || !v.components.every((c) => inRange(c, 0, 1)))
    errs.push(`${at}: color components must be three numbers between 0 and 1`);
  if (v.alpha !== undefined && !inRange(v.alpha, 0, 1)) errs.push(`${at}: color alpha must be between 0 and 1`);
  if (v.hex !== undefined) {
    if (!HEX.test(v.hex)) return errs.push(`${at}: color hex must match #rrggbb (lowercase)`);
    if (Array.isArray(v.components) && v.components.length === 3) {
      const from = v.components.map((c) => Math.round(c * 255));
      const to = [1, 3, 5].map((i) => parseInt(v.hex.slice(i, i + 2), 16));
      if (from.join() !== to.join())
        errs.push(`${at}: color hex ${v.hex} does not round-trip its components (${from.join(',')} vs ${to.join(',')})`);
    }
  }
}

function checkValue(type, v, at, errs) {
  switch (type) {
    case 'color': return checkColor(v, at, errs);
    case 'dimension': return checkDimension(v, at, errs);
    case 'duration': return checkDimension(v, at, errs, ['ms', 's']);
    case 'number':
      if (!isNum(v)) errs.push(`${at}: number must be a finite number`);
      return;
    case 'fontWeight':
      if (!inRange(v, 1, 1000)) errs.push(`${at}: fontWeight must be a number between 1 and 1000`);
      return;
    case 'fontFamily': {
      const list = Array.isArray(v) ? v : [v];
      if (!list.length || !list.every((f) => typeof f === 'string' && f.length))
        errs.push(`${at}: fontFamily must be a non-empty string or array of non-empty strings`);
      return;
    }
    case 'cubicBezier':
      if (!Array.isArray(v) || v.length !== 4 || !v.every(isNum))
        return errs.push(`${at}: cubicBezier must be four numbers`);
      if (!inRange(v[0], 0, 1) || !inRange(v[2], 0, 1))
        errs.push(`${at}: cubicBezier x components must be between 0 and 1`);
      return;
    case 'shadow': {
      const list = Array.isArray(v) ? v : [v];
      for (const s of list) {
        if (!isObj(s)) { errs.push(`${at}: shadow must be an object`); continue; }
        for (const k of ['offsetX', 'offsetY', 'blur', 'spread']) checkDimension(s[k], `${at}.${k}`, errs);
        checkColor(s.color, `${at}.color`, errs);
      }
      return;
    }
    default:
      errs.push(`${at}: unknown $type "${type}" — not a DTCG 2025.10 type`);
  }
}

/** Walks a parsed token file, returning every conformance violation found.
 *  @param {object} tree  @param {string} file  @returns {string[]} */
export function validateTree(tree, file) {
  const errs = [];
  const walk = (node, path, inheritedType) => {
    const type = node.$type ?? inheritedType;
    if (node.$extensions !== undefined) {
      if (!isObj(node.$extensions)) errs.push(`${file}:${path.join('.')}: $extensions must be an object`);
      else for (const k of Object.keys(node.$extensions))
        if (!DNS.test(k)) errs.push(`${file}:${path.join('.')}: $extensions key "${k}" must be reverse-DNS`);
    }
    if (node.$value !== undefined) {
      const at = `${file}:${path.join('.')}`;
      if (typeof node.$value === 'string' && /^\{[^{}]+\}$/.test(node.$value)) return; // pure alias, typed by its referent
      if (!type) return errs.push(`${at}: token has no $type (own or inherited) — invalid under DTCG 2025.10`);
      checkValue(type, node.$value, at, errs);
      return;
    }
    for (const [k, child] of Object.entries(node)) {
      if (RESERVED.has(k)) continue;
      if (k.startsWith('$') || /[.{}]/.test(k))
        errs.push(`${file}:${[...path, k].join('.')}: invalid name — must not start with $ or contain . { }`);
      if (isObj(child)) walk(child, [...path, k], type);
    }
  };
  walk(tree, [], undefined);
  return errs;
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const src = join(root, 'tokens/src');
  const files = readdirSync(src).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) { console.error('check-dtcg: no token files found in tokens/src'); process.exit(1); }
  let errs = [];
  for (const f of files) errs = errs.concat(validateTree(JSON.parse(readFileSync(join(src, f), 'utf8')), f));
  if (errs.length) {
    console.error(`check-dtcg: ${errs.length} violation(s) of DTCG 2025.10\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`check-dtcg: ${files.length} file(s) valid DTCG 2025.10 — ${files.join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/check-dtcg.test.mjs`
Expected: PASS, 10/10.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-dtcg.mjs scripts/check-dtcg.test.mjs
git commit -m "build: add the DTCG 2025.10 conformance gate"
```

---

### Task 4: Author the DTCG token source

**Files:**
- Create: `tokens/src/palette.dark.json`, `tokens/src/palette.light.json`, `tokens/src/typography.json`, `tokens/src/spacing.json`, `tokens/src/density.compact.json`, `tokens/src/effects.json`, `tokens/src/TYPE-MAP.md`

**Interfaces:**
- Consumes: `scripts/check-dtcg.mjs` (the gate).
- Produces: the token trees Task 5 builds from. Group names determine custom property names via `name/kebab`: group `fs` + token `display` → `--fs-display`; a root-level token `container-max` → `--container-max`.

Every explanatory comment in today's CSS moves into a `$description`. Task 5 emits a single-line description as a trailing `/* … */` and a multi-line one as a block comment above the declaration, so no prose is lost.

- [ ] **Step 1: Create `tokens/src/palette.dark.json`**

```json
{
  "color": {
    "$type": "color",
    "$description": "Arena — Dravensoft skin (palette), dark theme.\nThis is the source you swap to re-skin Arena. It holds only skin values:\nthe daisyUI --color-* set per theme and the categorical chart ramp.\nEverything else — the Arena aliases, the muted-text derivations — lives in\ntokens/colors.css and follows automatically.\nAfter changing anything here, rebuild and re-run: bun scripts/check-ramp.mjs",
    "base-100": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" }, "$description": "main background" },
    "base-200": { "$value": { "colorSpace": "srgb", "components": [0.1137, 0.0902, 0.0824], "hex": "#1d1715" }, "$description": "elevated surface / card" },
    "base-300": { "$value": { "colorSpace": "srgb", "components": [0.1412, 0.1098, 0.098], "hex": "#241c19" }, "$description": "panel / border" },
    "base-content": { "$value": { "colorSpace": "srgb", "components": [0.9529, 0.9294, 0.898], "hex": "#f3ede5" }, "$description": "text on base" },
    "primary": { "$value": { "colorSpace": "srgb", "components": [0.7098, 0.1647, 0.1255], "hex": "#b52a20" }, "$description": "crimson" },
    "primary-content": { "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" } },
    "secondary": { "$value": { "colorSpace": "srgb", "components": [0.7725, 0.6275, 0.349], "hex": "#c5a059" }, "$description": "gold" },
    "secondary-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "neutral": { "$value": { "colorSpace": "srgb", "components": [0.1725, 0.1333, 0.1176], "hex": "#2c221e" }, "$description": "neutral surface" },
    "neutral-content": { "$value": { "colorSpace": "srgb", "components": [0.8471, 0.8118, 0.7686], "hex": "#d8cfc4" } },
    "info": { "$value": { "colorSpace": "srgb", "components": [0.1922, 0.5098, 0.8078], "hex": "#3182ce" } },
    "info-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "success": { "$value": { "colorSpace": "srgb", "components": [0.2196, 0.6314, 0.4118], "hex": "#38a169" } },
    "success-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "warning": { "$value": { "colorSpace": "srgb", "components": [0.9255, 0.7882, 0.2941], "hex": "#ecc94b" } },
    "warning-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "error": { "$value": { "colorSpace": "srgb", "components": [0.9098, 0.3176, 0.3176], "hex": "#e85151" }, "$description": "Outline danger: this red IS the text and the border, so it is tuned against\nthe base surfaces, lighter than the shared #e53e3e it replaced (4.29:1 on\nbase-200 — under AA)." },
    "error-content": { "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" } },
    "error-fill": { "$value": { "colorSpace": "srgb", "components": [0.8078, 0.2196, 0.2196], "hex": "#ce3838" }, "$description": "Filled danger. --color-error is tuned to be read AS TEXT on the base\nsurfaces, which makes it far too light to carry white text itself. The one\nfilled danger surface (ConfirmDialog's final confirmation) therefore takes\nits own fill, dark enough for --color-error-content. The two cannot be one\ntoken: the outline needs a lighter red and the fill a darker one, in\nopposite directions. This pin is OPTIONAL — omit it and colors.css derives\nthe fill from --color-error by darkening in oklab; the Dravensoft skin pins\nit for an exact tone. Both gates are machine-checked — check-text-contrast.mjs." },
    "cat-1": { "$value": { "colorSpace": "srgb", "components": [0.2353, 0.4824, 0.0392], "hex": "#3c7b0a" }, "$description": "Categorical chart ramp — identity only, never meaning (see README -> Theming).\nFixed order: slot N is always slot N. A 9th series folds to \"Other\", small\nmultiples, or direct labels — it is NEVER a generated hue.\nChroma is capped at OKLCH C <= 0.15 so the ramp sits in Arena's register\n(crimson .177, gold .100) instead of reading as neon.\nforest 136deg" },
    "cat-2": { "$value": { "colorSpace": "srgb", "components": [0.2314, 0.3882, 0.7451], "hex": "#3b63be" }, "$description": "indigo 264deg" },
    "cat-3": { "$value": { "colorSpace": "srgb", "components": [0.0392, 0.5725, 0.2941], "hex": "#0a924b" }, "$description": "green 152deg" },
    "cat-4": { "$value": { "colorSpace": "srgb", "components": [0.4157, 0.349, 0.7373], "hex": "#6a59bc" }, "$description": "violet 288deg" },
    "cat-5": { "$value": { "colorSpace": "srgb", "components": [0, 0.6392, 0.7529], "hex": "#00a3c0" }, "$description": "cyan 216deg" },
    "cat-6": { "$value": { "colorSpace": "srgb", "components": [0.5333, 0.302, 0.6627], "hex": "#884da9" }, "$description": "purple 312deg" },
    "cat-7": { "$value": { "colorSpace": "srgb", "components": [0, 0.6627, 0.6039], "hex": "#00a99a" }, "$description": "teal 184deg" },
    "cat-8": { "$value": { "colorSpace": "srgb", "components": [0.5961, 0.2745, 0.5922], "hex": "#984697" }, "$description": "orchid 328deg" }
  }
}
```

- [ ] **Step 2: Create `tokens/src/palette.light.json`**

```json
{
  "color": {
    "$type": "color",
    "$description": "Light theme — warm inverse of the dark base.",
    "base-100": { "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" }, "$description": "main background — white" },
    "base-200": { "$value": { "colorSpace": "srgb", "components": [0.9686, 0.9569, 0.9373], "hex": "#f7f4ef" }, "$description": "card / elevated surface — very faint warm bone" },
    "base-300": { "$value": { "colorSpace": "srgb", "components": [0.9255, 0.902, 0.8627], "hex": "#ece6dc" }, "$description": "panel / border — warm bone" },
    "base-content": { "$value": { "colorSpace": "srgb", "components": [0.102, 0.102, 0.102], "hex": "#1a1a1a" }, "$description": "text — near-black gray" },
    "primary": { "$value": { "colorSpace": "srgb", "components": [0.7098, 0.1647, 0.1255], "hex": "#b52a20" } },
    "primary-content": { "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" } },
    "secondary": { "$value": { "colorSpace": "srgb", "components": [0.7725, 0.6275, 0.349], "hex": "#c5a059" } },
    "secondary-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "neutral": { "$value": { "colorSpace": "srgb", "components": [0.7922, 0.7373, 0.6784], "hex": "#cabcad" } },
    "neutral-content": { "$value": { "colorSpace": "srgb", "components": [0.2275, 0.1804, 0.1608], "hex": "#3a2e29" } },
    "info": { "$value": { "colorSpace": "srgb", "components": [0.1922, 0.5098, 0.8078], "hex": "#3182ce" } },
    "info-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "success": { "$value": { "colorSpace": "srgb", "components": [0.2196, 0.6314, 0.4118], "hex": "#38a169" } },
    "success-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "warning": { "$value": { "colorSpace": "srgb", "components": [0.9255, 0.7882, 0.2941], "hex": "#ecc94b" } },
    "warning-content": { "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "hex": "#141010" } },
    "error": { "$value": { "colorSpace": "srgb", "components": [0.7647, 0.2078, 0.2078], "hex": "#c33535" }, "$description": "Outline danger — darker than dark's, because here it is read against bone\nrather than warm black. Same role, opposite direction." },
    "error-content": { "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" } },
    "error-fill": { "$value": { "colorSpace": "srgb", "components": [0.8078, 0.2196, 0.2196], "hex": "#ce3838" }, "$description": "Filled danger — see the dark theme's note; likewise an OPTIONAL pin over the\noklab fallback in colors.css. Here one value could very nearly serve both\nroles, but the token stays split: they pull apart in dark, and a skin that\ncollapsed them here would have to un-collapse them there." },
    "cat-1": { "$value": { "colorSpace": "srgb", "components": [0.2235, 0.4706, 0.0157], "hex": "#397804" }, "$description": "Categorical chart ramp — light theme. Same hues, re-tuned for the\nbone surface; slot order is identical to dark and must stay identical.\nforest 136deg" },
    "cat-2": { "$value": { "colorSpace": "srgb", "components": [0.149, 0.2941, 0.6431], "hex": "#264ba4" }, "$description": "indigo 264deg" },
    "cat-3": { "$value": { "colorSpace": "srgb", "components": [0.0392, 0.5725, 0.2941], "hex": "#0a924b" }, "$description": "green 152deg" },
    "cat-4": { "$value": { "colorSpace": "srgb", "components": [0.3216, 0.2431, 0.6235], "hex": "#523e9f" }, "$description": "violet 288deg" },
    "cat-5": { "$value": { "colorSpace": "srgb", "components": [0, 0.5608, 0.6627], "hex": "#008fa9" }, "$description": "cyan 216deg" },
    "cat-6": { "$value": { "colorSpace": "srgb", "components": [0.4314, 0.1961, 0.5529], "hex": "#6e328d" }, "$description": "purple 312deg" },
    "cat-7": { "$value": { "colorSpace": "srgb", "components": [0, 0.5804, 0.5294], "hex": "#009487" }, "$description": "teal 184deg" },
    "cat-8": { "$value": { "colorSpace": "srgb", "components": [0.4863, 0.1686, 0.4824], "hex": "#7c2b7b" }, "$description": "orchid 328deg" }
  }
}
```

- [ ] **Step 3: Create `tokens/src/typography.json`**

```json
{
  "font": {
    "$type": "fontFamily",
    "$description": "Families",
    "display": { "$value": ["Archivo", "system-ui", "sans-serif"], "$description": "impact — headlines, wordmark" },
    "body": { "$value": ["Familjen Grotesk", "system-ui", "sans-serif"], "$description": "legible body copy" },
    "mono": { "$value": ["Spline Sans Mono", "ui-monospace", "monospace"], "$description": "data, technical labels" }
  },
  "fw": {
    "$type": "fontWeight",
    "$description": "Weights",
    "regular": { "$value": 400 },
    "medium": { "$value": 500 },
    "semibold": { "$value": 600 },
    "bold": { "$value": 700 },
    "extrabold": { "$value": 800 },
    "black": { "$value": 900 }
  },
  "fs": {
    "$type": "dimension",
    "$description": "Type scale (px)",
    "display": { "$value": { "value": 64, "unit": "px" }, "$description": "hero" },
    "h1": { "$value": { "value": 44, "unit": "px" } },
    "h2": { "$value": { "value": 32, "unit": "px" } },
    "h3": { "$value": { "value": 24, "unit": "px" } },
    "h4": { "$value": { "value": 19, "unit": "px" } },
    "lg": { "$value": { "value": 17, "unit": "px" } },
    "md": { "$value": { "value": 15, "unit": "px" }, "$description": "base body" },
    "sm": { "$value": { "value": 13, "unit": "px" } },
    "xs": { "$value": { "value": 11, "unit": "px" }, "$description": "mono labels / captions" }
  },
  "lh": {
    "$type": "number",
    "$description": "Line heights",
    "tight": { "$value": 0.98 },
    "snug": { "$value": 1.15 },
    "body": { "$value": 1.6 }
  },
  "ls": {
    "$type": "number",
    "$description": "Tracking. em is not a DTCG dimension unit, so tracking is a unitless number\n(a font-size multiplier) carrying an em render hint in $extensions.",
    "tight": { "$value": -0.02, "$extensions": { "com.dravensoft.arena": { "cssUnit": "em" } }, "$description": "display" },
    "normal": { "$value": 0, "$extensions": { "com.dravensoft.arena": { "cssUnit": "em" } } },
    "label": { "$value": 0.22, "$extensions": { "com.dravensoft.arena": { "cssUnit": "em" } }, "$description": "mono uppercase labels" },
    "wide": { "$value": 0.34, "$extensions": { "com.dravensoft.arena": { "cssUnit": "em" } }, "$description": "eyebrows" }
  }
}
```

- [ ] **Step 4: Create `tokens/src/spacing.json`**

```json
{
  "sp": {
    "$type": "dimension",
    "$description": "4px base grid",
    "0": { "$value": { "value": 0, "unit": "px" } },
    "1": { "$value": { "value": 4, "unit": "px" } },
    "2": { "$value": { "value": 8, "unit": "px" } },
    "3": { "$value": { "value": 12, "unit": "px" } },
    "4": { "$value": { "value": 16, "unit": "px" } },
    "5": { "$value": { "value": 20, "unit": "px" } },
    "6": { "$value": { "value": 24, "unit": "px" } },
    "8": { "$value": { "value": 32, "unit": "px" } },
    "10": { "$value": { "value": 40, "unit": "px" } },
    "12": { "$value": { "value": 48, "unit": "px" } },
    "16": { "$value": { "value": 64, "unit": "px" } },
    "20": { "$value": { "value": 80, "unit": "px" } },
    "24": { "$value": { "value": 96, "unit": "px" } }
  },
  "container-max": { "$type": "dimension", "$value": { "value": 1240, "unit": "px" }, "$description": "Container / layout" },
  "gutter": { "$type": "dimension", "$value": { "value": 88, "unit": "px" } },
  "bp": {
    "$type": "dimension",
    "$description": "Breakpoints — SHARED VALUES READ BY JS, not media queries.\nComponents style themselves with inline style objects, which cannot hold a\nmedia query, so responsive branches are JS (see use-container-width.js).\nThese live here anyway so the thresholds stay a token, not a magic number\nretyped in four components. 768px is what DAMA hardcodes.",
    "sm": { "$value": { "value": 480, "unit": "px" } },
    "md": { "$value": { "value": 768, "unit": "px" } },
    "lg": { "$value": { "value": 1024, "unit": "px" } }
  },
  "dz": {
    "$type": "dimension",
    "$description": "Density (H7 rev.3) — comfortable by default. Data-dense surfaces read these\ninstead of hard-coded px so a single scope switch re-densifies rows and controls.",
    "ctl-h": { "$value": { "value": 40, "unit": "px" }, "$description": "control height (buttons, inputs, switches row)" },
    "ctl-h-sm": { "$value": { "value": 32, "unit": "px" } },
    "ctl-h-lg": { "$value": { "value": 48, "unit": "px" } },
    "row-py": { "$value": { "value": 12, "unit": "px" }, "$description": "table/list row vertical padding" },
    "row-px": { "$value": { "value": 16, "unit": "px" }, "$description": "row horizontal padding" },
    "stack": { "$value": { "value": 12, "unit": "px" }, "$description": "gap between stacked items" },
    "cell": { "$value": { "value": 14, "unit": "px" }, "$description": "cell font-size" }
  }
}
```

- [ ] **Step 5: Create `tokens/src/density.compact.json`**

```json
{
  "dz": {
    "$type": "dimension",
    "$description": "Compact density — for expert/high-volume views. Apply on a container:\n<div class=\"arena-compact\"> ... </div>  (composes with .arena-light)",
    "ctl-h": { "$value": { "value": 32, "unit": "px" } },
    "ctl-h-sm": { "$value": { "value": 26, "unit": "px" } },
    "ctl-h-lg": { "$value": { "value": 40, "unit": "px" } },
    "row-py": { "$value": { "value": 7, "unit": "px" } },
    "row-px": { "$value": { "value": 12, "unit": "px" } },
    "stack": { "$value": { "value": 8, "unit": "px" } },
    "cell": { "$value": { "value": 13, "unit": "px" } }
  }
}
```

- [ ] **Step 6: Create `tokens/src/effects.json`**

Note the absence of `glow-accent`: it is retired in Task 7, and cannot exist here because a `var()`-tinted shadow has no conformant DTCG `$type`.

```json
{
  "r": {
    "$type": "dimension",
    "$description": "Radius — moderate, disciplined. Sharp enough to read bold, soft enough to be usable.",
    "xs": { "$value": { "value": 4, "unit": "px" } },
    "sm": { "$value": { "value": 6, "unit": "px" }, "$description": "buttons, inputs, chips" },
    "md": { "$value": { "value": 10, "unit": "px" }, "$description": "nested cards, menus" },
    "lg": { "$value": { "value": 14, "unit": "px" }, "$description": "cards, panels" },
    "xl": { "$value": { "value": 22, "unit": "px" }, "$description": "app icon tile" },
    "pill": { "$value": { "value": 999, "unit": "px" } }
  },
  "bw": { "$type": "dimension", "$value": { "value": 1, "unit": "px" }, "$description": "Borders" },
  "bw-strong": { "$type": "dimension", "$value": { "value": 2, "unit": "px" } },
  "shadow": {
    "$type": "shadow",
    "$description": "Elevation — deep, warm-black shadows",
    "1": { "$value": { "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 2, "unit": "px" }, "blur": { "value": 6, "unit": "px" }, "spread": { "value": -2, "unit": "px" }, "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.5 } } },
    "2": { "$value": { "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 12, "unit": "px" }, "blur": { "value": 28, "unit": "px" }, "spread": { "value": -12, "unit": "px" }, "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.6 } } },
    "3": { "$value": { "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 30, "unit": "px" }, "blur": { "value": 60, "unit": "px" }, "spread": { "value": -20, "unit": "px" }, "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.7 } } }
  },
  "scrim": {
    "$type": "color",
    "$value": { "colorSpace": "srgb", "components": [0.0784, 0.0627, 0.0627], "alpha": 0.6 },
    "$description": "Overlay scrim — backdrop for anything that covers the app (Dialog,\nConfirmDialog, CommandPalette, Onboarding). The blur is what separates a\nmodal from a coachmark: Dialog/ConfirmDialog/CommandPalette pair the scrim\nwith --scrim-blur, Onboarding uses the scrim alone, because a tour that\nblurs the product it is touring defeats itself."
  },
  "scrim-blur": { "$type": "dimension", "$value": { "value": 6, "unit": "px" } },
  "focus": {
    "$type": "dimension",
    "$description": "Focus",
    "width": { "$value": { "value": 2, "unit": "px" } },
    "offset": { "$value": { "value": 2, "unit": "px" } }
  },
  "dur": {
    "$type": "duration",
    "$description": "Motion",
    "fast": { "$value": { "value": 120, "unit": "ms" } },
    "mid": { "$value": { "value": 220, "unit": "ms" } },
    "slow": { "$value": { "value": 420, "unit": "ms" } }
  },
  "ease": {
    "$type": "cubicBezier",
    "out": { "$value": [0.2, 0.7, 0.3, 1] },
    "in-out": { "$value": [0.4, 0, 0.2, 1] },
    "emphatic": { "$value": [0.2, 0.9, 0.1, 1], "$description": "the \"rotor\" flourish" }
  }
}
```

- [ ] **Step 7: Run the conformance gate**

Run: `bun scripts/check-dtcg.mjs`
Expected: exit 0, prints `check-dtcg: 6 file(s) valid DTCG 2025.10 — density.compact.json, effects.json, palette.dark.json, palette.light.json, spacing.json, typography.json`.

If it reports a hex round-trip failure, the components are wrong for that hex — recompute as `round(byte)/255` to 4 decimals, do **not** change the hex.

- [ ] **Step 8: Create `tokens/src/TYPE-MAP.md`**

```markdown
# Arena token type map (DTCG 2025.10)

Normative. This table states the DTCG `$type` of every token group in
`tokens/src/`. It is the contract a new platform target reads first: consume
these values, do not re-derive them.

| Token group | Source file | DTCG `$type` | Notes |
|---|---|---|---|
| Base neutrals, brand, status, `error-fill`, `cat-1..8` | `palette.dark.json` / `palette.light.json` | `color` | per-theme (dark on `:root`, light on `.arena-light`) |
| Font families (`font-display/body/mono`) | `typography.json` | `fontFamily` | comma stacks preserved; generics stay unquoted |
| Font weights (`fw-*`) | `typography.json` | `fontWeight` | numeric 400-900 |
| Font sizes (`fs-*`) | `typography.json` | `dimension` | px |
| Line heights (`lh-*`) | `typography.json` | `number` | unitless |
| Letter spacing (`ls-*`) | `typography.json` | `number` | `em` is not a DTCG dimension unit, so tracking is a unitless `number` (a font-size multiplier) with an `$extensions.com.dravensoft.arena.cssUnit: "em"` render hint |
| Spacing scale (`sp-0..24`) | `spacing.json` | `dimension` | px; `sp-0` renders as bare `0` |
| `container-max`, `gutter` | `spacing.json` | `dimension` | px |
| Breakpoints (`bp-sm/md/lg`) | `spacing.json` | `dimension` | px; read by JS via `getComputedStyle`, never a media query |
| Density (`dz-*`) | `spacing.json` / `density.compact.json` | `dimension` | px; base on `:root` + `.arena-compact` override |
| Radius (`r-xs..pill`) | `effects.json` | `dimension` | px; `r-pill` = `999px` |
| Border widths (`bw`, `bw-strong`) | `effects.json` | `dimension` | px |
| Shadows (`shadow-1..3`) | `effects.json` | `shadow` | composite, incl. negative spread and rgba color |
| `scrim` | `effects.json` | `color` | structured srgb with `alpha`, rendered as `rgba()` |
| `scrim-blur`, `focus-width`, `focus-offset` | `effects.json` | `dimension` | px |
| Durations (`dur-fast/mid/slow`) | `effects.json` | `duration` | ms |
| Easings (`ease-*`) | `effects.json` | `cubicBezier` | `[x1,y1,x2,y2]` |

## Value formats are strict 2025.10

- Every `color` — including each `shadow`'s color slot and `scrim` — is a
  structured object: `{ "colorSpace": "srgb", "components": [r,g,b], "alpha"?: a,
  "hex"?: "#rrggbb" }`. Never a bare hex or `rgba()` string. When `hex` is
  present it must round-trip `components`; `scripts/check-dtcg.mjs` enforces it,
  so the two representations cannot drift.
- Every `dimension` and `duration` is `{ "value": N, "unit": "px" | "ms" }` — the
  unit is required even when `N` is 0.
- `number`, `fontWeight` values are bare numbers; `cubicBezier` is an array of 4.

## What is not in this map

Tokens absent from this table are, by definition, part of the per-platform
composition layer: they live in `tokens/colors.css` (aliases and `color-mix`
derivations) or `tokens/fonts.css` (`@font-face`), never in `tokens/src/`.
DTCG owns values; the composition layer owns how values are combined at runtime.
```

- [ ] **Step 9: Commit**

```bash
git add tokens/src/
git commit -m "tokens: author the DTCG 2025.10 source of truth"
```

---

### Task 5: The token build

**Files:**
- Create: `scripts/build-tokens.mjs`
- Modify (regenerate): `tokens/palette.css`, `tokens/typography.css`, `tokens/spacing.css`, `tokens/effects.css`

**Interfaces:**
- Consumes: `serialize()` from `scripts/lib/serialize-token.mjs`; `tokens/src/*.json`.
- Produces: `buildAll() → Promise<Map<string,string>>` mapping output filename (`palette.css`, …) to generated CSS text, exported so Task 6's check can build in memory without writing. Running the module as a CLI writes the files.

- [ ] **Step 1: Write the build script**

Create `scripts/build-tokens.mjs`:

```js
/* Generates tokens/{palette,typography,spacing,effects}.css from the DTCG
 * source in tokens/src/.
 *
 * Style Dictionary is used strictly as a loader, reference resolver and name
 * transformer — never as a value transformer. Its built-in CSS transforms
 * predate DTCG 2025.10 and would corrupt structured colors and {value,unit}
 * dimensions, so the only transform applied is name/kebab and every value is
 * rendered by scripts/lib/serialize-token.mjs.
 *
 *   bun scripts/build-tokens.mjs      -> writes the four files
 */
import StyleDictionary from 'style-dictionary';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serialize } from './lib/serialize-token.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HEADER = '/* GENERATED by Style Dictionary — edit tokens/src/, not this file. */';

/** Each output file is one or more selector blocks, each fed by one source file. */
const FILES = [
  { out: 'palette.css', blocks: [
    { selector: ':root', source: 'palette.dark.json' },
    { selector: '.arena-light', source: 'palette.light.json' },
  ] },
  { out: 'typography.css', blocks: [
    { selector: ':root', source: 'typography.json' },
  ] },
  { out: 'spacing.css', blocks: [
    { selector: ':root', source: 'spacing.json' },
    { selector: '.arena-compact', source: 'density.compact.json' },
  ] },
  { out: 'effects.css', blocks: [
    { selector: ':root', source: 'effects.json' },
  ] },
];

/** Resolves one source file to its named, ordered tokens. */
async function load(source) {
  const sd = new StyleDictionary({
    source: [join(root, 'tokens/src', source)],
    platforms: { css: { transforms: ['name/kebab'] } },
  }, { verbosity: 'silent' });
  const { allTokens } = await sd.getPlatformTokens('css');
  return allTokens;
}

/** A single-line $description becomes a trailing comment; a multi-line one
 *  becomes a block comment above the declaration, so no prose is lost. */
function render(token) {
  const decl = `  --${token.name}:${serialize(token)};`;
  const d = token.$description;
  if (!d) return decl;
  if (!d.includes('\n')) return `${decl} /* ${d} */`;
  const block = ['  /*', ...d.split('\n').map((l) => `     ${l}`), '   */'].join('\n');
  return `${block}\n${decl}`;
}

async function block({ selector, source }) {
  const tokens = await load(source);
  return `${selector}{\n${tokens.map(render).join('\n')}\n}`;
}

/** @returns {Promise<Map<string,string>>} output filename -> generated CSS */
export async function buildAll() {
  const out = new Map();
  for (const file of FILES) {
    const blocks = [];
    for (const b of file.blocks) blocks.push(await block(b));
    out.set(file.out, `${HEADER}\n${blocks.join('\n')}\n`);
  }
  return out;
}

async function main() {
  const built = await buildAll();
  for (const [name, css] of built) {
    writeFileSync(join(root, 'tokens', name), css);
    console.log(`build-tokens: wrote tokens/${name}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 2: Run the build**

Run: `bun run build:tokens`
Expected: four `build-tokens: wrote tokens/…` lines, exit 0.

- [ ] **Step 3: Verify the declaration sets are unchanged, except the retired token**

Run:

```bash
bun -e '
import("./scripts/lib/css-decls.mjs").then(async ({ parseDecls }) => {
  const { execSync } = await import("node:child_process");
  const { readFileSync } = await import("node:fs");
  let bad = 0;
  for (const f of ["palette.css","typography.css","spacing.css","effects.css"]) {
    const before = parseDecls(execSync(`git show HEAD:tokens/${f}`).toString());
    const after  = parseDecls(readFileSync(`tokens/${f}`, "utf8"));
    for (const [sel, decls] of before) {
      const now = after.get(sel);
      if (!now) { console.log(`MISSING SELECTOR ${f} ${sel}`); bad++; continue; }
      for (const [k, v] of decls) {
        if (!now.has(k)) { console.log(`REMOVED  ${f} ${sel} --${k}: ${v}`); bad++; }
        else if (now.get(k) !== v) { console.log(`CHANGED  ${f} ${sel} --${k}: ${v} -> ${now.get(k)}`); bad++; }
      }
      for (const k of now.keys()) if (!decls.has(k)) { console.log(`ADDED    ${f} ${sel} --${k}`); bad++; }
    }
  }
  console.log(bad === 0 ? "IDENTICAL" : `${bad} difference(s)`);
});'
```

Expected: **exactly one** line, and nothing else:

```
REMOVED  effects.css :root --glow-accent: 0 10px 30px -12px var(--crimson-strong)
1 difference(s)
```

Any other line is a serializer bug — fix `scripts/lib/serialize-token.mjs`, add the missed case to `scripts/serialize-token.test.mjs`, and re-run. Do not proceed until this output is exact.

- [ ] **Step 4: Run the existing colour gates against the generated palette**

Run: `bun scripts/check-ramp.mjs && bun scripts/check-text-contrast.mjs`
Expected: both exit 0, every gate PASS, no WARN.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-tokens.mjs tokens/palette.css tokens/typography.css tokens/spacing.css tokens/effects.css
git commit -m "build: generate the four token CSS files from the DTCG source"
```

---

### Task 6: The drift gate

**Files:**
- Create: `scripts/check-tokens-generated.mjs`

**Interfaces:**
- Consumes: `buildAll()` from `scripts/build-tokens.mjs`; `parseDecls()` from `scripts/lib/css-decls.mjs`.
- Produces: a CLI exiting 0 when the committed CSS matches a fresh build, 1 otherwise.

Comments are deliberately **not** asserted — only declarations and their selectors — because prose migrates to `$description` best-effort and should never fail a build.

- [ ] **Step 1: Write the check**

Create `scripts/check-tokens-generated.mjs`:

```js
/* Asserts the committed tokens/*.css are what tokens/src/ generates.
 *
 * The generated files are committed (the plugin is served from the release tag
 * and the copy-in kit reads them directly), so a stale committed file is a
 * silent failure — exactly the class of bug check-release.mjs exists for. This
 * script is the guard: it builds in memory and compares declaration sets.
 * Comments are not asserted, only `--name: value;` pairs and their selectors.
 *
 *   bun scripts/check-tokens-generated.mjs   -> exit 0 if in sync, 1 on drift
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildAll } from './build-tokens.mjs';
import { parseDecls } from './lib/css-decls.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const built = await buildAll();
const drift = [];

for (const [name, css] of built) {
  const expected = parseDecls(css);
  let actual;
  try {
    actual = parseDecls(readFileSync(join(root, 'tokens', name), 'utf8'));
  } catch {
    drift.push(`tokens/${name}: missing — run bun run build:tokens`);
    continue;
  }
  for (const [selector, decls] of expected) {
    const found = actual.get(selector);
    if (!found) { drift.push(`tokens/${name}: missing selector ${selector}`); continue; }
    for (const [prop, value] of decls) {
      if (!found.has(prop)) drift.push(`tokens/${name} ${selector}: missing --${prop}`);
      else if (found.get(prop) !== value)
        drift.push(`tokens/${name} ${selector}: --${prop} is "${found.get(prop)}", generated "${value}"`);
    }
    for (const prop of found.keys())
      if (!decls.has(prop)) drift.push(`tokens/${name} ${selector}: --${prop} is committed but no longer generated`);
  }
  for (const selector of actual.keys())
    if (!expected.has(selector)) drift.push(`tokens/${name}: committed selector ${selector} is no longer generated`);
}

if (drift.length) {
  console.error(`check-tokens-generated: ${drift.length} drift(s) between tokens/src/ and the committed CSS\n`);
  for (const d of drift) console.error(`  ${d}`);
  console.error('\nRun: bun run build:tokens');
  process.exit(1);
}
console.log(`check-tokens-generated: ${built.size} file(s) in sync with tokens/src/`);
```

- [ ] **Step 2: Verify it passes on the current tree**

Run: `bun run check:tokens`
Expected: exit 0, `check-tokens-generated: 4 file(s) in sync with tokens/src/`.

- [ ] **Step 3: Verify it actually catches drift**

Run:

```bash
bun -e 'import("node:fs").then(fs=>fs.writeFileSync("tokens/spacing.css", fs.readFileSync("tokens/spacing.css","utf8").replace("--sp-1:4px","--sp-1:5px")))'
bun run check:tokens; echo "exit=$?"
git checkout tokens/spacing.css
```

Expected: exits 1 with `tokens/spacing.css :root: --sp-1 is "5px", generated "4px"`, then `exit=1`. The `git checkout` restores the file.

- [ ] **Step 4: Run the whole gate set together**

Run: `bun test && bun run check:dtcg && bun run check:tokens && bun scripts/check-ramp.mjs && bun scripts/check-text-contrast.mjs`
Expected: all pass, exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-tokens-generated.mjs
git commit -m "build: add the token drift gate"
```

---

### Task 7: Retire `--glow-accent`

**Files:**
- Modify: `frameworks/react/components/forms/Button.jsx:45`
- Modify: `frameworks/tailwind/components/Button.manifest.json:8`
- Modify: `Arena - Overview.dc.html:51`
- Modify: `guidelines/effects-shadow.html:1,5`

**Interfaces:**
- Consumes: `--shadow-2` (unchanged, still generated).
- Produces: nothing consumed downstream.

Per the repo's no-deprecation rule the token is deleted outright, never aliased. It is already absent from the generated `effects.css` after Task 5.

- [ ] **Step 1: Confirm the full consumer list**

Run: `grep -rn "glow" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs .`
Expected: hits in exactly these four files plus `README.md` (handled in Task 8). If a fifth consumer appears, fix it here too.

- [ ] **Step 2: Point the React primary button's hover at the general elevation**

In `frameworks/react/components/forms/Button.jsx`, change line 45:

```js
      shadow: hover ? 'var(--glow-accent)' : 'none',
```

to:

```js
      shadow: hover ? 'var(--shadow-2)' : 'none',
```

- [ ] **Step 3: Do the same in the Tailwind manifest**

In `frameworks/tailwind/components/Button.manifest.json`, change `hover:shadow-[var(--glow-accent)]` to `hover:shadow-[var(--shadow-2)]` in the `primary` variant (line 8). Leave the rest of the string untouched.

- [ ] **Step 4: Do the same in the Overview demo**

In `Arena - Overview.dc.html` line 51, change:

```css
.btn.primary:hover{background:var(--crimson-strong);box-shadow:var(--glow-accent)}
```

to:

```css
.btn.primary:hover{background:var(--crimson-strong);box-shadow:var(--shadow-2)}
```

- [ ] **Step 5: Drop the `glow` swatch from the elevation specimen**

In `guidelines/effects-shadow.html`, delete the fourth swatch `<div>` — the one whose `box-shadow` is `var(--glow-accent)` and whose caption is `glow` — leaving swatches 1, 2 and 3. Also update the `@dsCard` comment on line 1:

```html
<!-- @dsCard group="Spacing" viewport="700x180" name="Elevation" subtitle="Warm shadows" -->
```

(the subtitle was `Warm shadows + crimson glow`).

- [ ] **Step 6: Verify nothing references the retired token**

Run: `grep -rn "glow-accent" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs .`
Expected: no output (exit 1 from grep). `docs/` is excluded because the spec legitimately discusses the retirement.

- [ ] **Step 7: Verify visually**

Run: `python3 -m http.server 8000` and open, in a browser:
- `http://localhost:8000/guidelines/effects-shadow.html` — three swatches, no `glow` caption.
- `http://localhost:8000/frameworks/react/components/forms/forms.card.html` — hover the primary button: it raises with the neutral deep shadow, no crimson halo. No console error.
- `http://localhost:8000/Arena%20-%20Overview.dc.html` — renders as before; hover the primary button, same neutral elevation.

Expected: as described. Stop the server when done.

- [ ] **Step 8: Commit**

```bash
git add "frameworks/react/components/forms/Button.jsx" \
        "frameworks/tailwind/components/Button.manifest.json" \
        "Arena - Overview.dc.html" \
        "guidelines/effects-shadow.html"
git commit -m "feat!: retire --glow-accent; accent buttons raise --shadow-2 on hover"
```

---

### Task 8: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the normative record.

- [ ] **Step 1: `CLAUDE.md` — "What this repo is"**

Replace the phrase stating the repo has **no build, no tests, and no package.json** with:

```markdown
Arena — Dravensoft's design system. It is **not a published npm package**, but it does
have a **dev-only, private `package.json`** at the root: the token layer is built from
DTCG JSON by Style Dictionary, and the build and check scripts are tested with
`bun test`. Nothing here is published to npm. It ships as three things at once from
the same tree:
```

(keep the three bullets that follow unchanged).

- [ ] **Step 2: `CLAUDE.md` — rewrite the "Tokens are the only styling layer" paragraph**

Replace that whole paragraph with:

```markdown
**Tokens are the only styling layer, and their values are DTCG JSON.** `styles.css` does
nothing but `@import` the six files in `tokens/`. Four of those six —
`tokens/palette.css`, `typography.css`, `spacing.css`, `effects.css` — are **generated
build output**: their values are authored in strictly-conformant DTCG 2025.10 JSON under
`tokens/src/` and emitted by `bun scripts/build-tokens.mjs` (`bun run build:tokens`).
**Never edit those four CSS files** — edit the JSON and rebuild.
`tokens/src/TYPE-MAP.md` is the normative table of which DTCG `$type` every token group
uses, and it is the first thing a new platform target should read.

The split still matters: **`tokens/src/palette.{dark,light}.json` is the skin** — the
daisyUI-structured `--color-*` / `--color-*-content` pairs per theme (dark on `:root`,
light on `.arena-light`) plus the 8-slot categorical chart ramp (`--color-cat-1..8`) —
and it is what a consumer swaps to re-skin Arena. **`tokens/colors.css` is the
structure**, and stays hand-authored — the compatibility layer mapping Arena's legacy
aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) onto
those tokens, plus the `color-mix` derivations of the muted text levels from
`--color-base-content`. `colors.css` never defines a skin value; `palette.css` is
imported before it. `tokens/fonts.css` likewise stays generated by
`scripts/fetch-fonts.mjs`.

**The layer contract.** DTCG owns *values*; the composition layer owns *how values are
combined at runtime*. Two things DTCG deliberately does not model, and that therefore
live in each platform's own idiom: the runtime colour derivations (`color-mix`, in
`tokens/colors.css`) and `@font-face` bundling (`tokens/fonts.css`). A new framework
target rebuilds that thin layer in its idiom on top of the same standard values — it
never re-defines a value.

When adding a colour, define the daisyUI token in `tokens/src/palette.dark.json` and
`palette.light.json` first, rebuild, then alias to it in `colors.css` — never introduce a
raw hex in a component. After any `tokens/src/` edit: rebuild, then run
`bun scripts/check-dtcg.mjs` (source is valid DTCG 2025.10),
`bun scripts/check-tokens-generated.mjs` (committed CSS matches the source), and
`bun scripts/check-ramp.mjs` (the ramp still clears every gate). In `tokens/src/`,
colours are structured sRGB objects, dimensions and durations are `{value,unit}` objects,
and letter spacing is a `number` carrying an `em` render hint in `$extensions`.
```

- [ ] **Step 3: `README.md` — the token architecture bullet (~line 90)**

Change "defined per theme in `tokens/palette.css`" to "defined per theme in `tokens/src/palette.dark.json` and `tokens/src/palette.light.json`, from which `tokens/palette.css` is generated".

- [ ] **Step 4: `README.md` — the "Key values" and Theming references to `palette.css` as the swap surface (~lines 96, 141, 143, 193, 199)**

Everywhere `palette.css` is named as the hand-authored source of truth or the file to swap or edit, rename the source to the DTCG JSON. Specifically, replace the sentence at ~line 141:

```markdown
**The public swap surface is `tokens/src/palette.dark.json` and `tokens/src/palette.light.json`: the `--color-*` set plus `--color-cat-*`.** Everything else derives. Swap those two files, run `bun run build:tokens`, and the whole system follows: the generated `tokens/palette.css` re-emits, the aliases in `tokens/colors.css` (`--bg`, `--crimson`, `--danger`, `--mute`…) re-point, the muted text levels re-derive through `color-mix`, and every component re-colors, because components read tokens and never hold a value of their own.
```

and at ~line 193, change "After changing anything in `palette.css`:" to "After changing anything in `tokens/src/`, rebuild (`bun run build:tokens`) and then:". At ~line 199, "It reads the ramp straight out of `palette.css`" stays true (the script reads the generated file) — leave it, but append ", which the build regenerates from the DTCG source."

- [ ] **Step 5: `README.md` — the Hover sentence (~line 106)**

Replace:

```markdown
on accent buttons, hover adds the crimson glow (`--glow-accent`)
```

with:

```markdown
on accent buttons, hover raises the general elevation (`--shadow-2`)
```

Leave the rest of that bullet, including the `--crimson-strong` note, unchanged.

- [ ] **Step 6: `README.md` — the Shadows bullet (~line 101)**

Replace "Crimson glow only for the app icon / floating CTAs." with "There is no tinted glow: elevation is always the neutral warm shadow."

- [ ] **Step 7: `README.md` — the repo layout line (~line 203)**

Replace the `tokens/` line with:

```markdown
- `tokens/` — `src/` (the DTCG 2025.10 source of every token value, plus `TYPE-MAP.md`), then the CSS: `fonts.css` (generated by `fetch-fonts.mjs`), `palette.css`, `typography.css`, `spacing.css`, `effects.css` (all four generated by `build-tokens.mjs` — do not edit), and `colors.css` (hand-authored: aliases and `color-mix` derivations).
```

- [ ] **Step 8: `README.md` — add the layer contract as a normative section**

Immediately after the Theming section's swap-surface paragraph, add:

```markdown
### The layer contract

**Standardized (the DTCG layer).** Every token *value* — colors, dimensions, font
attributes, durations, easings, shadows — is authored once in `tokens/src/**/*.json` as
strictly-conformant DTCG 2025.10, the platform-neutral contract. A new framework target
consumes that JSON directly, or through a Style Dictionary platform emitting CSS, JS,
iOS, Android or SCSS. Nothing in it is Arena-specific, and
`bun scripts/check-dtcg.mjs` proves it conforms.

**Per-platform (the composition layer).** Two things DTCG deliberately does not model,
and that therefore live in each platform's own idiom:

1. **Runtime color derivations** — the muted-text levels and `*-soft` accents, expressed
   in CSS as `color-mix(in oklab, var(--…) N%, transparent)` so they re-derive when the
   skin swaps. In CSS they live in the hand-authored `tokens/colors.css`. A new framework
   rebuilds this thin layer in its idiom (Tailwind `color-mix` utilities, a JS token
   helper) **on top of the same standard values** — it never re-defines a value.
2. **`@font-face` bundling** — generated by `scripts/fetch-fonts.mjs` into
   `tokens/fonts.css`, pointing at the self-hosted `assets/fonts/` binaries.

The dividing line: **DTCG owns values; the composition layer owns how values are combined
at runtime.** `tokens/colors.css` therefore holds no skin value — only references
(`var(--color-primary)`) and `color-mix` compositions. The full `$type` table is
`tokens/src/TYPE-MAP.md`.
```

- [ ] **Step 9: `CHANGELOG.md` — add the `[Unreleased]` entry**

Insert directly below the intro paragraph and above `## [3.2.0] — 2026-07-17`:

```markdown
## [Unreleased]

### Changed

- **Token values are now DTCG 2025.10 JSON.** `tokens/src/**/*.json` is the single
  source of every token value, authored as strictly-conformant DTCG 2025.10 (the first
  stable W3C Format Module), and `tokens/palette.css`, `typography.css`, `spacing.css`
  and `effects.css` are generated from it by Style Dictionary v4
  (`bun run build:tokens`) — they are still committed, but must no longer be edited by
  hand. `tokens/colors.css` (aliases and `color-mix` derivations) and `tokens/fonts.css`
  (`@font-face`) stay hand-authored and generated-by-`fetch-fonts.mjs` respectively, as
  the documented per-platform composition layer. Two new gates enforce the boundary:
  `scripts/check-dtcg.mjs` (the source validates against 2025.10) and
  `scripts/check-tokens-generated.mjs` (the committed CSS matches the source). No token
  value changed. The repo gains its first `package.json` — private, dev-only, never
  published.

### Removed

- **`--glow-accent`.** A `var()`-tinted shadow has no conformant DTCG type, and the token
  had exactly one consumer. Accent buttons now raise the general elevation
  (`--shadow-2`) on hover instead of the crimson glow, in the React `Button`, the
  Tailwind `Button` manifest and the Overview demo; the `glow` swatch is gone from
  `guidelines/effects-shadow.html`. This is the sole visual change in the migration.
```

- [ ] **Step 10: Verify the prose no longer contradicts the build**

Run: `grep -n "palette.css" README.md CLAUDE.md`
Expected: every remaining hit describes `palette.css` as *generated* or as a file a script *reads*, never as the hand-authored source of truth or the file to edit.

Run: `grep -rn "no package.json\|no build, no tests" CLAUDE.md README.md`
Expected: no output.

- [ ] **Step 11: Run the full verification suite one last time**

Run:

```bash
bun test && \
bun run check:dtcg && \
bun run check:tokens && \
bun scripts/check-ramp.mjs && \
bun scripts/check-text-contrast.mjs && \
bun scripts/check-release.mjs
```

Expected: all exit 0. `check-release.mjs` reads the first *versioned* CHANGELOG entry, so `[Unreleased]` on top is expected and must not fail it — if it does, that is a real bug in the entry's formatting, not in the script.

- [ ] **Step 12: Commit**

```bash
git add CLAUDE.md README.md CHANGELOG.md
git commit -m "docs: DTCG token source, the layer contract, and the --glow-accent retirement"
```

---

### Task 9: Move the pre-existing gates onto Bun

**Files:**
- Modify: `scripts/check-ramp.mjs`, `scripts/check-release.mjs`, `scripts/check-text-contrast.mjs`, `scripts/fetch-fonts.mjs`, `scripts/validate-palette.mjs` (usage strings only)
- Modify: `README.md`, `CLAUDE.md` (every `node scripts/…` invocation)

**Interfaces:**
- Consumes: nothing.
- Produces: one toolchain. No script logic changes — these five files only ever named
  `node` inside a comment or a usage string.

The five gates predate this migration and were documented as `node scripts/x.mjs`. Left
alone they would split the toolchain: the token build on Bun, the colour gates on Node.
All five were verified to produce byte-identical output and identical exit codes under
both runtimes before this task was written, so the change is to the *documented
invocation*, never to behaviour.

- [ ] **Step 1: Update the usage strings inside the five scripts**

Rewrite the `node scripts/…` occurrences in each header comment to `bun scripts/…`:
`check-ramp.mjs:8`, `check-release.mjs:21`, `check-text-contrast.mjs:12`,
`fetch-fonts.mjs:5`, and `validate-palette.mjs:28-30` plus its runtime usage string at
line 282. Change nothing else in these files.

- [ ] **Step 2: Update every invocation in `README.md` and `CLAUDE.md`**

`README.md` lines ~94, ~120, ~143, ~196 and `CLAUDE.md` lines ~30, ~75. Note Task 8 Step 2
already rewrote the `CLAUDE.md:30` paragraph wholesale — verify it says `bun`, do not
rewrite it twice.

- [ ] **Step 3: Verify no invocation was missed**

Run: `grep -rn "node scripts/\|node --test\|npm run \|npm test" --exclude-dir=node_modules --exclude-dir=.git . | grep -v "^./docs/"`
Expected: no output. `docs/` is excluded because the spec records the migration itself.

- [ ] **Step 4: Verify the gates still pass on Bun**

Run: `bun scripts/check-ramp.mjs && bun scripts/check-text-contrast.mjs && bun scripts/check-release.mjs`
Expected: all exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-ramp.mjs scripts/check-release.mjs scripts/check-text-contrast.mjs \
        scripts/fetch-fonts.mjs scripts/validate-palette.mjs README.md CLAUDE.md
git commit -m "build: run the pre-existing gates on Bun so the toolchain is uniform"
```

---

## Final verification

Run the whole gate set, then serve and look:

```bash
bun test && bun run check:dtcg && bun run check:tokens && \
  bun scripts/check-ramp.mjs && bun scripts/check-text-contrast.mjs
git diff --stat HEAD~8 -- tokens/
python3 -m http.server 8000
```

- `guidelines/type-scale.html`, `guidelines/color-*.html`, `guidelines/effects-shadow.html` render identically (the elevation card now shows three swatches, not four).
- `Arena - Overview.dc.html` renders identically; the primary button's hover is the neutral deep shadow.
- A component card (`frameworks/react/components/forms/forms.card.html`) renders identically.
- Toggle the light theme and the compact density: `.arena-light` and `.arena-compact` still take effect, proving both multi-selector files composed correctly.
- DevTools → Computed → filter `--`: the custom-property values match what `git show HEAD~8:tokens/effects.css` reports, minus `--glow-accent`.

## Release

Out of scope, and user-triggered: bump `plugin.json` / `marketplace.json` / the README header, rename the `[Unreleased]` heading, pin `source.ref` to the new tag, tag the release commit, and run `bun scripts/check-release.mjs`. The `--glow-accent` removal is a breaking change to the public token surface, so this warrants a **major** bump.
