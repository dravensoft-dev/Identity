# Token/geometry boundary — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution order: 4 of 6.** **Status: NOT EXECUTED** as of 2026-07-19.

| # | Plan | Status |
|---|---|---|
| 1 | `2026-07-18-1-token-style-dictionary-migration.md` | **Executed** (v4.0.0) |
| 2 | `2026-07-18-2-overview-token-page.md` | **Executed** (v4.0.0) |
| 3 | `2026-07-18-3-framework-layer-token-coverage.md` | **Executed** (unreleased) |
| 4 | `2026-07-18-4-token-geometry-boundary.md` | **This plan** — **executed** (unreleased) |
| 5a | `2026-07-18-5a-angular-primitive-parity.md` — the 18 Angular primitives + the verification gates | Pending |
| 5b | `2026-07-18-5b-tailwind-manifest-parity.md` — the 20 orphan manifests; depends on 5a's Tasks 1–4 | Pending |
| 6 | `2026-07-18-6-four-package-build-publish.md` | Pending |

**Goal:** Make the promise true — that changing a value in `tokens/src/` moves every layer — by giving every rendered dimension in `frameworks/` a token or a derivation of tokens, and machine-checking that no bare literal survives.

**Architecture:** A gate is written first and its output, not this document, is the census that drives every later task. Roughly 290 sites are then assigned to eight families by three fixed rules, two of the families being new (`icon`, `z`). Families that move no rendered pixels land before the one that does, and a visual review sits between the pixel-moving work and the close.

**Tech Stack:** Bun (runtime, test runner), Style Dictionary v4, DTCG 2025.10, Tailwind CSS 4.3.3, `node:test` + `node:assert/strict`.

**Source spec:** `docs/superpowers/specs/2026-07-18-token-geometry-boundary-design.md`
**Downstream, do not implement here:** `specs/2026-07-18-framework-layer-parity-design.md` (plan 5), `specs/2026-07-18-four-package-build-publish-design.md` (plan 6)

---

## State of the tree this plan was written against

Verified on 2026-07-19, at merge commit `b9f2b2d` on `main`:

- **Plan 3 is executed, and it followed its banner.** `tokens/src/spacing.json` declares `dz.text` at 14px with a 13px `.arena-compact` override in `density.compact.json`. There is **no `fs.base` and no `--fs-base` anywhere in live code** — only in planning documents that narrate the correction. `frameworks/tailwind/theme.css:91` reads `--text-base: var(--dz-text);`.
- All three of plan 3's gates exist: `scripts/check-tailwind.mjs`, `check-tailwind-coverage.mjs`, `check-arbitrary-values.mjs`. `bun run check` runs six gates plus the test suite through `scripts/check-all.mjs`.
- **The "React is the design authority" reversals are already applied.** All three statements the spec's *What this reverses* names now read the corrected way, and all four "one-off geometry" statements have been rewritten. **This plan does not redo that work** — Task 13 verifies it rather than repeating it.

## Global Constraints

- **Every new token must reach the Tailwind layer in the same task that creates it.** `check-tailwind-coverage.mjs` fails on any token in the four generated CSS files that neither reaches a utility nor sits in `EXCLUDED` with a reason. This binds both new families (`icon`, `z`) and every new step of `dz`, `ls` and `lh`. It is not a follow-up step and it is not optional.
- **Never hand-edit `tokens/palette.css`, `typography.css`, `spacing.css`, `effects.css`.** They are build output. Edit `tokens/src/*.json`, run `bun run build:tokens`.
- **After any `tokens/src/` edit**, run `bun scripts/check-dtcg.mjs`, `bun scripts/check-tokens-generated.mjs` and `bun scripts/check-ramp.mjs`. All three must exit 0.
- **A change of token value is a design change, not a refactor.** Where a task moves a rendered pixel it says so, and it does not proceed past a checkpoint that has not been answered.
- **Bun, never npm or node, to run things.** Gates themselves stay runtime-portable and must pass under both `bun` and `node`.
- **English only** in all code, comments, docs and commit messages. **No emoji.**
- **`README.md` is the normative specification.** A new family or token is documented there in the same change. New families additionally need a row in `tokens/src/TYPE-MAP.md`.
- **Everything here goes under `## [Unreleased]` in `CHANGELOG.md`.** That heading already exists. Do not touch the `## [4.0.0]` entry and do not move any version string.
- **Do not make `assets/*.svg` themeable.** The fixed hex is Dravensoft's identity, not Arena's skin.
- **Do not add an opacity family or an animation-cycle family.** Both were considered and rejected with reasons in the spec.
- **Do not change any colour value.** This work is dimension, layering and typographic metrics only.

---

## The checkpoints — questions for the author, not decisions this plan takes

The spec names five. **Each is a hard stop.** An implementer who reaches one and answers it themselves has executed the plan incorrectly, however obvious the answer looks. Checkpoint 1 is the easiest to disobey, because a snap direction reads like an implementation detail and is not one.

| # | Question | Falls in |
|---|---|---|
| 1 | **Type snap direction.** Does 12 go to 11 or 13? 16 to 15 or 17? 18 to 17 or 19? Per *cluster*, not per site. | Task 11, opening step |
| 2 | **Layering order.** Does a tooltip sit above or below a modal? Above a command palette? Six or so slots, ordered once. | Task 4, opening step |
| 3 | **Icon step count** — three steps or four. **Extended, see below.** | Task 5, opening step |
| 4 | **The sites where Rule 1 does not close cleanly.** The four the spec names, plus whatever the exhaustive pass adds. | Task 3 |
| 5 | **The visual review.** No document can close it. | Task 12 |

### Two additions, flagged rather than absorbed

The spec says the plan "cannot introduce a sixth decision without it being visibly absent from this list". Two are:

**Addition to Checkpoint 3 — which Tailwind namespace `icon` uses.** Forced by the Global Constraint above, which the spec predates. Measured against Tailwind 4.3.3, both work:

```
--size-icon-md: 16px   ->  .size-icon-md { width: var(--size-icon-md); height: var(--size-icon-md) }
--text-icon-md: 16px   ->  .text-icon-md { font-size: var(--text-icon-md) }
```

`--text-*` matches how React consumes them today (Phosphor renders as a webfont, so the sites are `fontSize`). `--size-*` matches what an icon *is* and keeps the type namespace free of non-type entries, which is what Rule 2 argues for one level up. This is a design call, not a measurement.

**Checkpoint 6 — none.** Recorded so its absence is explicit: no other decision was found that the spec's rules do not close.

---

## Corrections to the spec, settled before writing

**`ls.wide` is NOT dead API and is NOT deleted.** The spec says it has "zero uses in the entire repo". False as of `b9f2b2d`: `Arena - Overview.html:17` (`.kicker`) and `:20` (`.eyebrow`) both read `var(--ls-wide)`, and `frameworks/tailwind/theme.css:112` exposes it as `--tracking-wide`. **Author's ruling: a token with real uses that is coherent with the token structure is live API — that part of the surface is starting to be used.** `ls.wide` is kept, and the `ls` re-derivation in Task 7 is built around it rather than over it.

**`dz.cell` is still absorbed into `dz.text`, and that is a different case.** Its justification was never "unused" — the spec calls it "a narrow name for a general role". It has four live consumers, so this is a rename with a migration, not a deletion: `frameworks/react/components/display/Table.jsx` (3 sites), `guidelines/spacing-density.html` (2 sites), `frameworks/tailwind/theme.css:146` (`--spacing-cell`). Task 6 migrates all of them.

**The gate names one exemption, not the spec's two.** The spec says two correct sites look exactly like defects: `Calendar`'s `zIndex: 1` and `borderRadius: '50%'`. Only the first needs naming. `%` is a unit the token layer does not model at all — `width: '100%'` is legitimate everywhere in the layer, not just on that one circle — so the gate treats it as a free unit and `50%` never becomes a violation in the first place. Naming it would be an exemption for something that was never flagged, and `check-tailwind-coverage.mjs` already treats a stale exclusion as a failure for exactly that reason. **Do not add a `50%` entry to `EXEMPT`.**

**The census in the spec is indicative and is superseded by Task 1's output.** The spec says so itself. Do not carry its numbers into any later task.

---

## File Structure

**New:**

| Path | Responsibility |
|---|---|
| `scripts/check-dimension-literals.mjs` | The gate. Scans `frameworks/` for bare literals in token-governed properties; named exemptions with reasons; a `--report` mode that emits the census grouped by property and value. |
| `scripts/check-dimension-literals.test.mjs` | Unit tests for the scanner and the exemption logic. |
| `docs/superpowers/plans/2026-07-18-4-classification.md` | The per-site classification, produced by Task 3 and committed. The authority every editing task reads. |
| `tokens/src/icon.json` | The `icon` family. |
| `tokens/src/layering.json` | The `z` family. |

**Modified:** `tokens/src/spacing.json`, `tokens/src/density.compact.json`, `tokens/src/typography.json`, `tokens/src/TYPE-MAP.md`, `frameworks/tailwind/theme.css`, `scripts/fetch-fonts.mjs`, `scripts/check-tailwind-coverage.mjs` (if any new token is excluded), `scripts/check-all.mjs`, `package.json`, `README.md`, `CLAUDE.md`, `CHANGELOG.md`, the four plan files carrying the sequence table, and roughly 40 files under `frameworks/react/components/`.

**Unchanged, explicitly:** `assets/*.svg`, `tokens/colors.css`, the palette sources, `support.js`, the plugin manifests, every version string.

---

## Task 1: The gate, and the census it produces

Written first because every later task reads its output. It lands **red** — roughly 290 violations — and is deliberately not wired into `bun run check` until Task 13.

**Files:**
- Create: `scripts/check-dimension-literals.mjs`
- Test: `scripts/check-dimension-literals.test.mjs`

**Interfaces:**
- Produces, and Tasks 3 and 13 rely on these exact names:
  - `scanValue(prop: string, raw: string): {reason: string} | null` — `null` when the value is legal.
  - `scanText(text: string): {prop: string, raw: string, reason: string}[]`
  - `EXEMPT: Map<string, string>` — `"<relative path>:<prop>:<raw>"` to the reason it is allowed.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-dimension-literals.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { scanValue, scanText } from './check-dimension-literals.mjs';

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

test('a var() into a token is legal', () => {
  assert.equal(scanValue('fontSize', 'var(--dz-text)'), null);
  assert.equal(scanValue('padding', "'var(--dz-row-py) var(--dz-row-px)'"), null);
});

test('a calc() over tokens is legal, and its multipliers are not literals', () => {
  assert.equal(scanValue('width', "'calc(var(--sp-1) * 3.5)'"), null);
  assert.equal(scanValue('gap', "'calc(var(--sp-1) * 2.5)'"), null);
});

test('zero is legal, with or without quotes', () => {
  assert.equal(scanValue('padding', '0'), null);
  assert.equal(scanValue('margin', "'0'"), null);
});

test('a non-dimension unit the layer legitimately uses is legal', () => {
  assert.equal(scanValue('borderRadius', "'50%'"), null);
  assert.equal(scanValue('width', "'100%'"), null);
  assert.equal(scanValue('minWidth', "'0ch'"), null);
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `bun test scripts/check-dimension-literals.test.mjs`
Expected: FAIL — `Cannot find module './check-dimension-literals.mjs'`.

- [ ] **Step 3: Implement the gate**

Create `scripts/check-dimension-literals.mjs`:

```js
/* Fails on a bare dimension literal in a token-governed property anywhere under
 * frameworks/. This is the machine form of the rule CLAUDE.md states in prose:
 * a dimension in a framework layer is a token or a derivation of tokens, and a
 * bare literal is a bug.
 *
 * It is not a tidiness check. Zero bare literals means every rendered value
 * resolves from tokens/src/, which is exactly the claim that changing a value
 * there moves every layer. This gate is the proof of that promise.
 *
 * It is the complement of check-arbitrary-values.mjs: that one keys on
 * Tailwind's bracket syntax, this one on literals in inline style objects.
 * Together they close both idioms.
 *
 *   bun scripts/check-dimension-literals.mjs            -> exit 0 if none, 1 otherwise
 *   bun scripts/check-dimension-literals.mjs --report   -> the census, grouped
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const EXTENSIONS = ['.jsx', '.ts', '.tsx'];

/** Properties whose value Arena's token layer governs. */
const PROPS = new Set([
  'fontSize', 'lineHeight', 'letterSpacing', 'fontWeight',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingInline', 'paddingBlock',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'gap', 'rowGap', 'columnGap',
  'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
  'borderWidth', 'borderRadius',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'top', 'right', 'bottom', 'left', 'inset', 'zIndex',
]);

/* Two correct sites look exactly like defects, so they are named rather than
 * inferred — the same discipline check-tailwind-coverage.mjs applies to its
 * token exclusions. Keyed "<path>:<prop>:<raw>". */
export const EXEMPT = new Map([
  ['frameworks/react/components/display/Calendar.jsx:zIndex:1',
   'local stacking inside a positioned container; does not join the global z order'],
]);

/** A length literal: a number carrying a unit the token layer owns. */
const RAW_LENGTH = /\d*\.?\d+\s*(px|rem)\b/;
/** Units the layer legitimately uses and the token layer does not model. */
const FREE_UNIT = /^\s*'?-?\d*\.?\d+(%|ch|fr|vh|vw|vmin|vmax|deg|s|ms)'?\s*$/;
/** The whole value is a bare number (quoted or not). */
const BARE_NUMBER = /^\s*'?-?\d*\.?\d+'?\s*$/;
/** Zero, in the forms the layer writes it. */
const ZERO = /^\s*'?-?0(px|rem|%)?'?\s*$/;

/** @param {string} prop @param {string} raw
 *  @returns {{reason: string} | null} null when the value is legal */
export function scanValue(prop, raw) {
  if (!PROPS.has(prop)) return null;
  if (ZERO.test(raw)) return null;
  if (FREE_UNIT.test(raw)) return null;

  // A var() is a token. Remove every one, then judge what is left: a
  // multiplier inside calc() is not a literal, a px is.
  const withoutTokens = raw.replace(/var\(\s*--[a-z0-9-]+\s*\)/g, '');
  if (RAW_LENGTH.test(withoutTokens))
    return { reason: 'a raw length, not a token' };

  // A bare number standing as the entire value asserts a dimension the
  // language never declared — fontSize: 13, zIndex: 1000, lineHeight: 1.
  if (!raw.includes('var(') && BARE_NUMBER.test(raw))
    return { reason: 'a bare number, not a token' };

  return null;
}

const DECL = /(?<![\w.])([a-zA-Z]+)\s*:\s*('[^']*'|"[^"]*"|`[^`]*`|[-\w.]+)/g;

/** @param {string} text @returns {{prop: string, raw: string, reason: string}[]} */
export function scanText(text) {
  const out = [];
  for (const m of text.matchAll(DECL)) {
    const [, prop, raw] = m;
    const hit = scanValue(prop, raw);
    if (hit) out.push({ prop, raw, reason: hit.reason });
  }
  return out;
}

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) yield p;
  }
}

function collect() {
  const found = [];
  for (const file of walk(join(repoRoot, 'frameworks'))) {
    const rel = relative(repoRoot, file);
    for (const hit of scanText(readFileSync(file, 'utf8'))) {
      if (EXEMPT.has(`${rel}:${hit.prop}:${hit.raw}`)) continue;
      found.push({ file: rel, ...hit });
    }
  }
  return found;
}

/** The census: every violation grouped by property, then by value, with the
 *  files that carry it. This output is the authority for the classification
 *  pass — the spec's own counts are indicative and are superseded by it. */
function report(found) {
  const byProp = new Map();
  for (const f of found) {
    if (!byProp.has(f.prop)) byProp.set(f.prop, new Map());
    const byValue = byProp.get(f.prop);
    if (!byValue.has(f.raw)) byValue.set(f.raw, []);
    byValue.get(f.raw).push(f.file);
  }
  for (const [prop, byValue] of [...byProp].sort((a, b) => a[0].localeCompare(b[0]))) {
    const total = [...byValue.values()].reduce((n, files) => n + files.length, 0);
    console.log(`\n${prop}  (${total} site(s), ${byValue.size} distinct value(s))`);
    for (const [raw, files] of [...byValue].sort((a, b) => b[1].length - a[1].length))
      console.log(`  ${String(files.length).padStart(3)}x  ${raw}`);
  }
  console.log(`\ntotal: ${found.length} site(s)`);
}

function main() {
  const found = collect();
  if (process.argv.includes('--report')) { report(found); return; }
  if (found.length) {
    console.error(`check-dimension-literals: ${found.length} bare literal(s) under frameworks/\n`);
    for (const f of found) console.error(`  ${f.file}: ${f.prop}: ${f.raw} — ${f.reason}`);
    console.error('\nA dimension is a token or a derivation of tokens. Use var(--token), or');
    console.error('calc() over one where the scale is numeric. If neither fits, the token is');
    console.error('what is missing — add it to tokens/src/ first.');
    process.exit(1);
  }
  console.log('check-dimension-literals: no bare literals under frameworks/');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the unit tests**

Run: `bun test scripts/check-dimension-literals.test.mjs`
Expected: PASS, 9 tests. Then `node --test scripts/check-dimension-literals.test.mjs` — the same.

- [ ] **Step 5: Produce the census and confirm it is plausible**

Run: `bun scripts/check-dimension-literals.mjs --report`

Expected: a grouped listing ending in a total in the **250-320** range. Confirm by eye that `fontSize` shows a distribution clustering at 11/12/13/14/16, that `zIndex` shows 900/1000/1100/1190/1200, and that `letterSpacing` shows roughly a dozen distinct `em` values.

**If the total is under 150 or over 400, the scanner is wrong — stop and fix it.** A scanner that under-reports makes every later task incomplete, and one that over-reports will drown the classification pass. Two specific things to verify by hand before accepting the number:

```bash
bun scripts/check-dimension-literals.mjs --report | head -40
grep -c "fontSize" frameworks/react/components/forms/Button.jsx
```

Cross-check a single file's real content against what the gate reports for it.

- [ ] **Step 6: Confirm the gate exits 1, and that the exemption works**

Run: `bun scripts/check-dimension-literals.mjs; echo "exit=$?"`
Expected: `exit=1`, and **no line for `Calendar.jsx: zIndex: 1`** — that is the named exemption.

- [ ] **Step 7: Save the census as the baseline**

```bash
bun scripts/check-dimension-literals.mjs --report > /tmp/census-task1.txt
wc -l /tmp/census-task1.txt
```

Quote the total in the commit message. Later tasks compare against it.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-dimension-literals.mjs scripts/check-dimension-literals.test.mjs
git commit -m "test(tokens): gate bare dimension literals in the framework layers

Scans frameworks/ for literals in the properties Arena's token layer governs
and fails on each. A value passes when it is var(--token), a calc() over one,
zero, or a unit the token layer does not model.

Red on N sites today, which is the point: it is the proof of the promise that
changing a value in tokens/src/ moves every layer, and today that is false.
Not yet wired into bun run check -- it joins the aggregate once the layers
are repaired."
```

Replace `N` with the real total.

---

## Task 2: `fetch-fonts.mjs` reads its family list from the token source

Independent of everything else in this plan, and the one place the promise breaks **silently** today: a variant author who sets `font.display` to `"Inter"` and rebuilds gets `--font-display: Inter, system-ui, sans-serif` with no `@font-face` for Inter, and falls through to `system-ui` with no error at all.

**Files:**
- Modify: `scripts/fetch-fonts.mjs`

**Interfaces:**
- Consumes: `tokens/src/typography.json` — the `font` group (`$type: fontFamily`, value is an array whose **first entry is the real family**, the rest generic fallbacks) and the `fw` group (`$type: fontWeight`, numeric).

- [ ] **Step 1: Read what is there now**

Run: `sed -n '/const FAMILIES/,/^\];/p' scripts/fetch-fonts.mjs`

Expected — the hardcoded list this task removes:

```js
const FAMILIES = [
  { css: 'Archivo',           slug: 'archivo',           weights: [400, 500, 600, 700, 800, 900] },
  { css: 'Familjen Grotesk',  slug: 'familjen-grotesk',  weights: [400, 500, 600, 700] },
  { css: 'Spline Sans Mono',  slug: 'spline-sans-mono',  weights: [400, 500, 600, 700] },
];
```

Note the weights are **not** uniform: Archivo carries 800 and 900, the other two stop at 700. Read the rest of the script to learn how `slug` and `weights` are consumed before changing anything.

- [ ] **Step 2: Derive the list from the token source**

Replace the constant with a function that reads `tokens/src/typography.json`. The family name is the first entry of each `font.*` `$value` array; the slug is that name lowercased with spaces to hyphens; the weights come from the `fw` group.

```js
/* The family list is derived from tokens/src/typography.json, not declared
 * here. When it was declared here, a variant author who changed font.display
 * to "Inter" got --font-display: Inter with no @font-face for Inter, and fell
 * through to system-ui with no error at all -- the worst shape a broken
 * promise can take. The weights stop being declared twice for the same
 * reason: FAMILIES.weights and the fw tokens agreed by discipline, which is
 * not a mechanism. */
function families(root) {
  const src = JSON.parse(readFileSync(join(root, 'tokens/src/typography.json'), 'utf8'));
  const weights = Object.entries(src.fw)
    .filter(([k]) => !k.startsWith('$'))
    .map(([, t]) => t.$value)
    .sort((a, b) => a - b);
  return Object.entries(src.font)
    .filter(([k]) => !k.startsWith('$'))
    .map(([, token]) => {
      const css = token.$value[0];
      return { css, slug: css.toLowerCase().replace(/\s+/g, '-'), weights };
    });
}
```

**This deliberately widens the weight set for two of the three families**, because `fw` declares six weights and only Archivo carried all six. That is the correct direction — the token is the authority — but it means the generator will fetch more faces than the repo ships today. Confirm in Step 3 what actually changes before committing.

- [ ] **Step 3: Verify without writing anything**

The generator writes `tokens/fonts.css` and binaries into `assets/fonts/`. **Do not run it destructively first.** Add a dry-run guard, or copy the derived list out and compare:

```bash
bun -e "
import('./scripts/fetch-fonts.mjs').then(async (m) => {
  console.log(JSON.stringify(m.families ? m.families(process.cwd()) : 'not exported', null, 2));
});
"
```

Export `families` so this works. Expected: three entries whose `css` and `slug` match the hardcoded table exactly, and whose `weights` is the full `fw` set `[400,500,600,700,800,900]` for all three.

- [ ] **Step 4: Prove the token now governs**

Temporarily point a token at a different family, derive the list again, and confirm it follows:

```bash
cp tokens/src/typography.json /tmp/typo.bak
bun -e "
const fs = require('node:fs');
const p = 'tokens/src/typography.json';
const d = JSON.parse(fs.readFileSync(p, 'utf8'));
d.font.display.\$value = ['Inter', 'system-ui', 'sans-serif'];
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
" && bun -e "import('./scripts/fetch-fonts.mjs').then(m => console.log(m.families(process.cwd())[0]))"
cp /tmp/typo.bak tokens/src/typography.json && git status --porcelain
```

Expected: the first entry reads `{ css: 'Inter', slug: 'inter', weights: [...] }`, and the tree is clean afterwards. **This is the assertion this task exists for.** Before the change the output would still have said `Archivo`.

- [ ] **Step 5: Confirm the committed fonts still regenerate identically**

The weight widening means the generator would now fetch faces the repo does not ship. Decide and record which is true, and report it:

- If the extra weights fetch successfully, `tokens/fonts.css` grows and `assets/fonts/` gains binaries. That is a real change and belongs in the CHANGELOG.
- If a family has no 800/900 face published, the generator must skip it gracefully rather than fail. Verify which happens and handle it.

Run the generator and inspect the diff before deciding:

```bash
bun scripts/fetch-fonts.mjs
git status --porcelain tokens/fonts.css assets/fonts/
git diff --stat tokens/fonts.css
```

**Report what you found.** If the diff is large or a fetch fails, stop and report rather than committing a font change inside a token-boundary plan.

- [ ] **Step 6: Run the gates**

Run: `bun run check`
Expected: all seven steps pass. `tokens/fonts.css` is not one of the four generated files `check-tokens-generated.mjs` guards, so it will not complain, but the others must stay green.

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch-fonts.mjs
git commit -m "fix(tokens): fetch-fonts derives its family list from the token source

The generator hardcoded FAMILIES, so tokens/src/typography.json declared the
families and something else decided which ones got an @font-face. A variant
author who set font.display to Inter got --font-display: Inter with no face
for Inter and fell through to system-ui with no error at all.

The weights stop being declared twice for the same reason: FAMILIES.weights
and the fw tokens agreed by discipline rather than by construction."
```

---

## Task 3: The classification pass

**Roughly 290 sites are assigned to families here, once, and recorded.** Every later editing task reads this artifact rather than exercising judgement again. That is the whole point: without it the plan makes 290 decisions by 290 rationales, which is the problem this spec exists to solve, relocated.

**A plan executes decisions; it does not make them.** This task applies the spec's three rules mechanically and escalates only what the rules do not close.

**Files:**
- Create: `docs/superpowers/plans/2026-07-18-4-classification.md`

**Interfaces:**
- Consumes: the census from `bun scripts/check-dimension-literals.mjs --report`.
- Produces: for every violating site, a family assignment and a target value. Tasks 4-11 consume it.

### The rules, verbatim from the spec

**Rule 1 — prose or chrome decides between `fs` and `dz`.** Is the text a sentence the user reads, or a label on a control? Prose (a heading, a paragraph, a message with a subject and a verb) → `fs`. Chrome (a button label, a field label, a column header, a hint, a validation error, a badge, a legend) → `dz`. The test that settles most cases: *would this text still mean something read aloud with no interface around it?* "We couldn't connect to the server. Retry." would. "Deploy" would not.

**Rule 2 — a glyph rendered as a font is `icon`, not type.** Even though it is written `fontSize`. An icon at 15px beside a label at 15px is not the same design decision as an icon at 16px.

**Rule 3 — a step exists when two independent components need it.** A value only one component needs is a derivation, not a token. What "not a token" means depends on the family: **numeric family** (`sp`) — the lone value derives, `calc(var(--sp-1) * 3.5)`; **semantic family** (`fs`, `dz`, `ls`, `lh`, `icon`, `z`) — the lone value snaps to the nearest step, because a derived role is not a role.

- [ ] **Step 1: Generate the census**

Run: `bun scripts/check-dimension-literals.mjs --report > /tmp/census.txt && cat /tmp/census.txt`

- [ ] **Step 2: Walk every site and assign it**

For each violating site, record: file and line, the property, the current value, the family, the target value, and — only where a rule did not close it cleanly — a one-line reason.

Write `docs/superpowers/plans/2026-07-18-4-classification.md` with one table per family:

```markdown
# Token/geometry boundary — the per-site classification

Produced by Task 3 of `2026-07-18-4-token-geometry-boundary.md`, from the output
of `bun scripts/check-dimension-literals.mjs --report`. This is the authority the
editing tasks read; the counts in the spec are indicative and superseded.

## fs — editorial type (Rule 1: prose)

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|

## dz — control density (Rule 1: chrome)

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|

## icon (Rule 2)
## z — layering
## ls — tracking
## lh — line height
## fw — weight (adoption only)
## borders (adoption only)
## sp — derivations (Rule 3, numeric)

## Sites where a rule did not close cleanly

| File:line | Why it is ambiguous | Assignment | Reason |
|---|---|---|---|
```

- [ ] **Step 3: CHECKPOINT 4 — the ambiguous sites**

**STOP. Ask the author.** The spec names four sites in advance: `EmptyState.message`, `ErrorState.message`, `Onboarding.step.body`, and `Menu`'s item text. All four are prose *inside* a chrome container, which is exactly where Rule 1 stops being decisive. Add whatever else the exhaustive pass turned up.

Present each as: the file and line, the text it renders, the current size, and the two candidate assignments with what each implies. **Do not assign them yourself.** Record the author's answer and their reason with each one.

- [ ] **Step 4: Report the family totals**

State how many sites landed in each family, and confirm the totals sum to the census total minus the exemptions. A site that reached no family is a hole in the rules — report it rather than inventing an assignment.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-07-18-4-classification.md
git commit -m "docs(plan): classify every bare dimension literal by family

Applies the spec's three rules to the gate's census once, so the editing
tasks execute an assignment rather than repeating a judgement 290 times.
The ambiguous sites carry the author's ruling and its reason."
```

---

## Task 4: The `z` family — layering

The spec calls this the most dangerous omission, and the table shows why: `Menu` and `Tooltip` are both 900, so a tooltip on a menu item resolves by DOM order rather than by design. `Dialog` and `ConfirmDialog` are both 1000 — and `ConfirmDialog` is what opens *from* a `Dialog`, working today by accident of mount order. `Toast` declares no `zIndex` at all.

**Files:**
- Create: `tokens/src/layering.json`
- Modify: `tokens/src/TYPE-MAP.md`, `frameworks/tailwind/theme.css`, `README.md`, `scripts/build-tokens.mjs`, and the five React files carrying a `zIndex`

**Interfaces:**
- Produces: the `--z-*` custom properties, and the Tailwind theme keys `--z-index-*`.

- [ ] **Step 1: CHECKPOINT 2 — the layering order**

**STOP. Ask the author.** Present the current state, which encodes no intent:

```
900   Menu, Tooltip          1100  CommandPalette      1  Calendar (local, exempt)
1000  Dialog, ConfirmDialog  1190  Onboarding scrim
                             1200  Onboarding coachmark
```

Ask for the **order**, not the numbers — the family declares the order and the values stop mattering. The spec's indicated slots are `z.dropdown`, `z.tooltip` (above dropdown, which fixes the first defect), `z.modal`, `z.modal-nested`, `z.toast`. The open questions: does a tooltip sit above or below a modal? Above a command palette? Where does `Toast` go, given it currently declares nothing? Is `Onboarding`'s scrim/coachmark pair one slot or two?

Record the answer before writing any JSON.

- [ ] **Step 2: Confirm the DTCG type**

`z-index` is a unitless integer, so the group is `$type: number` — the same type `lh` uses. It is **not** a `dimension`; a dimension requires a `{value, unit}` object and there is no unit here.

Verify against `tokens/src/TYPE-MAP.md` and against how `lh` is authored in `tokens/src/typography.json` before writing.

- [ ] **Step 3: Author the family**

Create `tokens/src/layering.json`, using the order Checkpoint 2 settled. Illustrative shape — **the names and count come from the checkpoint, not from here**:

```json
{
  "z": {
    "$type": "number",
    "$description": "Layering — a system-wide invariant, not geometry. The family declares the\norder; the values only have to preserve it. Encoded as magic numbers in five\nseparate files before this, where Menu and Tooltip both sat at 900 and a\ntooltip over a menu item resolved by DOM order rather than by design.",
    "dropdown": { "$value": 900, "$description": "Menu, Select and Tooltip's anchor layer" },
    "tooltip": { "$value": 950, "$description": "above dropdown, so a tooltip on a menu item wins" },
    "modal": { "$value": 1000, "$description": "Dialog" },
    "modal-nested": { "$value": 1050, "$description": "ConfirmDialog, which opens from a Dialog" },
    "toast": { "$value": 1100, "$description": "floats above everything" }
  }
}
```

- [ ] **Step 4: Register the file with the build**

`scripts/build-tokens.mjs` has a `FILES` array mapping each output CSS file to its source blocks. Read it, then decide where `layering.json` emits. It is not spacing, typography, palette or effects.

**Two options, and this is a real choice:** add a fifth generated file `tokens/layering.css` (which means adding it to `styles.css`'s imports, to `check-tokens-generated.mjs`'s list, and to `check-tailwind.mjs`'s `GENERATED` array), or emit into the existing `effects.css`. Prefer **`effects.css`** — layering is closer to elevation than to anything else, it adds no new file to four separate lists, and `effects.css` already carries non-geometry tokens. Record the reasoning in the commit.

If you add a fifth file instead, you must update every one of those four lists, or `check-tailwind-coverage.mjs` will not see the new tokens at all and will silently pass.

- [ ] **Step 5: Build and verify the generated CSS**

```bash
bun run build:tokens && grep -n "z-" tokens/effects.css
bun scripts/check-dtcg.mjs && bun scripts/check-tokens-generated.mjs && bun scripts/check-ramp.mjs
```

Expected: the `--z-*` properties appear as bare integers with no unit, and all three gates exit 0.

- [ ] **Step 6: Expose them in Tailwind — required, not optional**

Measured against Tailwind 4.3.3: `--z-index-<name>` is a real namespace and produces `.z-<name>`.

```
--z-index-modal: 1000   ->   .z-modal { z-index: var(--z-index-modal) }
```

Add to `frameworks/tailwind/theme.css`, in the effects section, one key per token:

```css
  /* layering → tokens/effects.css. The family declares the order; a consumer
     embedding Arena in an app with its own stacking context reads these
     rather than guessing at a magic number. */
  --z-index-*: initial;
  --z-index-dropdown: var(--z-dropdown);
  --z-index-tooltip: var(--z-tooltip);
  --z-index-modal: var(--z-modal);
  --z-index-modal-nested: var(--z-modal-nested);
  --z-index-toast: var(--z-toast);
```

- [ ] **Step 7: Replace the literals in React**

The five files: `feedback/Dialog.jsx`, `feedback/ConfirmDialog.jsx`, `feedback/Tooltip.jsx`, `feedback/Onboarding.jsx` (three sites), `navigation/Menu.jsx`, `navigation/CommandPalette.jsx`. **And add the missing one to `Toast`**, which declares no `zIndex` today — that is the third defect the spec names, and it is a real bug, not cleanup.

`display/Calendar.jsx`'s `zIndex: 1` **stays a literal**. It is local stacking inside a positioned container and does not join the global order. It is already the named exemption in the gate.

- [ ] **Step 8: Verify**

```bash
bun run check
bun scripts/check-dimension-literals.mjs 2>&1 | grep -c zIndex
```

Expected: `bun run check` passes all seven; the `zIndex` count is **0** — every site is a token except the named exemption, which the gate skips.

- [ ] **Step 9: Document**

Add the row to `tokens/src/TYPE-MAP.md`:

```markdown
| Layering (`z-*`) | `layering.json` | `number` | unitless integers; the family declares the order, the values only preserve it |
```

And a README section covering what the order is and why a consumer reads it.

- [ ] **Step 10: Commit**

```bash
git add tokens/src/layering.json tokens/src/TYPE-MAP.md tokens/effects.css \
        scripts/build-tokens.mjs frameworks/tailwind/theme.css README.md \
        frameworks/react/components/
git commit -m "feat(tokens): declare the layering order as a family

Layering is a system-wide invariant -- what covers what -- and it was five
magic numbers in five files. Menu and Tooltip were both 900, so a tooltip on
a menu item resolved by DOM order. Dialog and ConfirmDialog were both 1000,
and ConfirmDialog opens from a Dialog; it worked by accident of mount order.
Toast, the one thing that must float above everything, declared nothing.

Calendar's zIndex: 1 stays a literal -- it is local stacking inside a
positioned container and does not join the global order."
```

---

## Task 5: The `icon` family

Arena has no icon-size token. A significant share of what the census reports as off-scale `fontSize` are not font sizes at all: Phosphor renders as a webfont, so an icon wears `fontSize`. Snapping those to the type scale would be a category error.

**Files:**
- Create: `tokens/src/icon.json`
- Modify: `scripts/build-tokens.mjs`, `tokens/src/TYPE-MAP.md`, `frameworks/tailwind/theme.css`, `README.md`, the React files the classification assigns to `icon`

- [ ] **Step 1: CHECKPOINT 3 — the step count, and the Tailwind namespace**

**STOP. Ask the author.** Two questions:

**(a) How many steps.** The measured cluster suggests three (14 / 16 / 18). Present what the classification pass actually found — the distinct icon sizes and how many independent components use each — and let Rule 3 decide whether a fourth is genuinely in use. A size only one component needs snaps rather than becoming a step.

**(b) Which Tailwind namespace.** Forced by the Global Constraint, and not something the spec settled. Measured against 4.3.3, both work:

```
--size-icon-md: 16px  ->  .size-icon-md { width: var(--size-icon-md); height: var(--size-icon-md) }
--text-icon-md: 16px  ->  .text-icon-md { font-size: var(--text-icon-md) }
```

`--text-*` matches how React consumes them today, since the sites are `fontSize`. `--size-*` matches what an icon is, and keeps the type namespace free of entries that are not type — which is the argument Rule 2 makes one level up. Present both; do not choose.

- [ ] **Step 2: Author the family**

Create `tokens/src/icon.json` with the steps Checkpoint 3 settled:

```json
{
  "icon": {
    "$type": "dimension",
    "$description": "Icon size. A glyph rendered as a webfont is still an icon, not type: an icon\nat 15px beside a label at 15px is not the same design decision as an icon at\n16px. Kept out of fs for that reason.",
    "sm": { "$value": { "value": 14, "unit": "px" } },
    "md": { "$value": { "value": 16, "unit": "px" } },
    "lg": { "$value": { "value": 18, "unit": "px" } }
  }
}
```

Values are illustrative — use what Checkpoint 3 settled.

- [ ] **Step 3: Register with the build, into `spacing.css`**

`icon` is a size, so it belongs with the other sizes rather than in a new file. Add it as a second source block for `spacing.css` in `scripts/build-tokens.mjs`'s `FILES` array, the way `density.compact.json` is already a second block there — but on `:root`, not on a scoped selector.

Read how `FILES` composes blocks before editing; getting the selector wrong emits the tokens under `.arena-compact` where nothing will resolve them.

- [ ] **Step 4: Build and verify**

```bash
bun run build:tokens && grep -n "icon-" tokens/spacing.css
bun scripts/check-dtcg.mjs && bun scripts/check-tokens-generated.mjs && bun scripts/check-ramp.mjs
```

- [ ] **Step 5: Expose in Tailwind — required**

Using the namespace Checkpoint 3 chose. If `--size-*`:

```css
  /* icon size → tokens/spacing.css. A glyph rendered as a webfont is an icon,
     not type, so it does not live in the --text-* namespace. */
  --size-icon-sm: var(--icon-sm);
  --size-icon-md: var(--icon-md);
  --size-icon-lg: var(--icon-lg);
```

- [ ] **Step 6: Replace the literals**

Only the sites the classification assigned to `icon`. The spec's indication: 7 of the 8 sites at 16px are icons (Toast close, Alert close, Pagination arrow, Input's two status icons, BulkActionBar's icon), as are 2 of the 4 at 18px (CommandPalette's magnifier and its item icon). **Use the classification, not this list** — it was written before the census existed.

- [ ] **Step 7: Verify**

```bash
bun run check && bun scripts/check-tailwind-coverage.mjs
```

Expected: all pass, and the coverage gate's token total has grown by the number of icon steps, all of them exposed.

- [ ] **Step 8: Document, then commit**

Add the row to `tokens/src/TYPE-MAP.md`, beside the other `dimension` groups:

```markdown
| Icon size (`icon-sm/md/lg`) | `icon.json` | `dimension` | px; a glyph rendered as a webfont is an icon, not type, so these stay out of `fs` |
```

Then a README ICONOGRAPHY addition covering the size scale — the section defines the set, the weight and the usage today but no sizes — then:

```bash
git add tokens/src/icon.json tokens/src/TYPE-MAP.md tokens/spacing.css \
        scripts/build-tokens.mjs frameworks/tailwind/theme.css README.md \
        frameworks/react/components/
git commit -m "feat(tokens): add the icon size family

Arena defined the icon set, its weight and its usage, but no size scale, so
icon sizes lived as fontSize literals -- and because Phosphor renders as a
webfont they read as off-scale type. They are not type: an icon at 15px
beside a label at 15px is not the same decision as an icon at 16px."
```

---

## Task 6: `dz` gains its text steps, and absorbs `dz.cell`

**No pixels move in this family.** The chrome sites keep their rendered size and gain a token.

**Files:**
- Modify: `tokens/src/spacing.json`, `tokens/src/density.compact.json`, `frameworks/tailwind/theme.css`, `frameworks/react/components/display/Table.jsx`, `guidelines/spacing-density.html`, `README.md`, plus the React sites the classification assigned to `dz`

- [ ] **Step 1: Add `dz.text-sm`, and absorb `dz.cell` into `dz.text`**

`dz.text` already exists at 14px (plan 3 authored it). This task adds the secondary step and removes the narrow name.

In `tokens/src/spacing.json`'s `dz` group: add `text-sm` at 12px (`"secondary control text — hints, validation errors, badges, legends"`), and **delete `cell`**. In `density.compact.json`'s `dz` group: add the matching `text-sm` compact value, and delete `cell`.

`dz.cell` and `dz.text` carry identical values in both scopes today — 14px base, 13px compact — so absorbing one into the other changes no rendered value. Confirm that before deleting, and report if it is not so.

- [ ] **Step 2: Migrate the four `dz.cell` consumers**

`dz.cell` is not unused. Every consumer moves to `dz.text` in this same commit — Arena keeps no tombstones, and the rename ships in the breaking major.

```bash
grep -rn "dz-cell\|dz\.cell" . --include=*.jsx --include=*.css --include=*.html --include=*.json | grep -v '^./docs'
```

Expected, all of which must be updated:
- `frameworks/react/components/display/Table.jsx` — three sites (`cellBase`, the empty-state text, the numeric cell span)
- `guidelines/spacing-density.html` — two sites, one a live `font-size` and one the prose listing the token and its compact value
- `frameworks/tailwind/theme.css:146` — `--spacing-cell: var(--dz-cell)`

**The Tailwind key needs a decision, not a rename.** `--spacing-cell` maps a font size into the spacing namespace, which was already odd. With `cell` gone, either re-point it at `--dz-text` under a better key name or drop it — but if you drop it, `--dz-text` must still reach a utility, and it does, as `--text-base`. Prefer dropping `--spacing-cell` and letting `--text-base` carry it. Verify with the coverage gate rather than by reasoning.

- [ ] **Step 3: Expose the new step in Tailwind — required**

`dz.text-sm` needs a key. `--text-base` already carries `dz.text`; the natural partner is `--text-sm`, but **that is taken by `fs.sm` (13px)**. Read `theme.css` before choosing, and report the collision rather than silently overwriting: 12px and 13px are different values and both are in use.

This is a naming problem the plan cannot pre-solve because it depends on Checkpoint 1's snap decisions. If Checkpoint 1 has not been answered yet, expose `dz.text-sm` under an unambiguous key of your choosing, record it, and revisit in Task 11.

- [ ] **Step 4: Replace the chrome literals**

Every site the classification assigned to `dz`. This is the largest single group and it should be purely mechanical — if a site requires judgement, the classification is incomplete and the answer is to go back to Task 3, not to decide here.

- [ ] **Step 5: Verify no pixel moved**

```bash
bun run build:tokens && bun run check
bun scripts/check-dimension-literals.mjs --report | head -20
```

Then, because this family claims to move nothing: for three sites picked from different components, confirm the token's value equals the literal it replaced. Report the three.

- [ ] **Step 6: Commit**

```bash
git add tokens/src/spacing.json tokens/src/density.compact.json tokens/spacing.css \
        frameworks/ guidelines/spacing-density.html README.md
git commit -m "feat(tokens): dz gains its text steps, and absorbs dz.cell

Chrome text is a density role, not an editorial one: the size of a button
label, an input value, a hint or a column header is governed by how dense the
controls are, not by the prose scale. dz.text was already here; dz.text-sm
joins it for hints, validation errors, badges and legends.

dz.cell is absorbed into dz.text -- a narrow name for a general role, with
identical values in both density scopes, so nothing rendered moves. Its four
consumers move in this commit; Arena keeps no tombstones."
```

---

## Task 7: `ls` — re-derive tracking from the hierarchy in service

The tokens cover 5 of 24 real uses. Sorted by value the sites form a role hierarchy nobody named, and **tracking decreases as the text gets longer** — a coherent system, in service, undeclared.

**`ls.wide` is kept.** The spec calls it dead API with zero uses; that is false against the tree. It is read by `Arena - Overview.html` (`.kicker`, `.eyebrow`) and exposed as `--tracking-wide`. The author ruled that a token with real uses coherent with the structure is live API. Build the hierarchy around it.

**Files:**
- Modify: `tokens/src/typography.json`, `frameworks/tailwind/theme.css`, `README.md`, the React sites assigned to `ls`

- [ ] **Step 1: Confirm the measured hierarchy**

Run: `grep -rhoE "letterSpacing: *'[^']*'" frameworks/react/components --include=*.jsx | sort | uniq -c | sort -rn`

The spec's reading, to be checked against what you get:

```
.22em  Card, Dialog, ConfirmDialog, Onboarding   section eyebrow
.2em   ChartCard, StatCard                       the same role, 0.02 apart
.14em  Input, Select, Textarea, ConfirmDialog    field label
.12em  Table, Calendar, Toast                    column header / micro-label
.1em   Badge, BulkActionBar                      badge
.06em  Alert, Toast, Calendar, Onboarding        uppercase status
.04em  Breadcrumbs, BulkActionBar                mono navigation
.02em  Avatar                                    initials
.01em  Button                                    button label
```

- [ ] **Step 2: Apply Rule 3 to the singletons**

`.01em` (`Button`), `.02em` (`Avatar`) and `.16em` (`Menu`) are each used by one component. **None becomes a step; each snaps to the nearest.** `ls` is a semantic family, so there is nothing to derive from — a derived role is not a role.

The spec is explicit that without this clause the plan reaches those three with no instruction and invents one. It is an instruction, not a judgement call.

- [ ] **Step 3: Fix the accidental split**

`ChartCard` and `StatCard` render the same eyebrow as `Card`/`Dialog`/`ConfirmDialog`/`Onboarding` at `.2em` instead of `.22em` — one role, two values, 0.02 apart, invisible by eye and purely accidental. `ls.label` is already 0.22; those two sites simply never read it. They move to the token.

- [ ] **Step 4: Author the family**

Name the roles the hierarchy shows, keeping `tight`, `normal`, `label` and `wide`. Each new step needs a `$description` naming its role, since that is what makes the hierarchy legible in `Arena - Overview.html`.

Remember `ls` is `$type: number` carrying an `em` render hint in `$extensions.com.dravensoft.arena.cssUnit` — read an existing entry before adding one.

- [ ] **Step 5: Expose every new step in Tailwind — required**

One `--tracking-*` key per token. `--tracking-wide` already exists and stays.

- [ ] **Step 6: Replace the literals, then verify**

```bash
bun run build:tokens && bun run check
bun scripts/check-dimension-literals.mjs 2>&1 | grep -c letterSpacing
```

Expected: 0 remaining `letterSpacing` sites.

**This moves rendered tracking** at every site that snapped. It is a design change and it is in scope for Checkpoint 5.

- [ ] **Step 7: Commit**

```bash
git add tokens/src/typography.json tokens/typography.css \
        frameworks/tailwind/theme.css frameworks/react/components/ README.md
git commit -m "feat(tokens): re-derive tracking from the hierarchy already in service

The four ls tokens covered 5 of 24 uses. Sorted by value the sites form a
role hierarchy nobody had named -- tracking decreases as the text gets
longer -- so the family is re-derived from it rather than merely adopted.

ChartCard and StatCard rendered the same eyebrow as Card and Dialog at .2em
instead of .22em: one role, two values, invisible by eye and accidental.

ls.wide is kept. The spec called it dead API with zero uses; it is read by
the Overview and exposed as --tracking-wide."
```

---

## Task 8: `lh` — the missing end of the scale

The tokens cover 5 of 18 uses. `lh.body` already holds prose. What is missing is the other end: **`lineHeight: 1` means "this box is exactly its glyph"**, which is what stops an icon from throwing its button out of alignment. That is a role, not a number.

It splits editorial/control exactly as `fs`/`dz` do, **so the reset belongs to `dz`**, not to `lh`.

**Files:**
- Modify: `tokens/src/typography.json`, `tokens/src/spacing.json`, `frameworks/tailwind/theme.css`, `README.md`, the React sites assigned to `lh`

- [ ] **Step 1: Confirm the distribution**

Run: `grep -rhoE "lineHeight: *[^,}]+" frameworks/react/components --include=*.jsx | sort | uniq -c | sort -rn`

Expected shape: `1` is the most common value (the glyph-tight reset), then a cluster of prose values around 1.3-1.6.

- [ ] **Step 2: Add the control reset to `dz`, and the prose steps to `lh`**

The reset goes in `dz` because it is a control concern. The prose values that survive Rule 3 become `lh` steps; singletons snap to the nearest existing step.

- [ ] **Step 3: Expose in Tailwind, replace the literals, verify**

```bash
bun run build:tokens && bun run check
bun scripts/check-dimension-literals.mjs 2>&1 | grep -c lineHeight
```

Expected: 0.

- [ ] **Step 4: Commit**

```bash
git add tokens/src/typography.json tokens/src/spacing.json tokens/typography.css \
        tokens/spacing.css frameworks/ README.md
git commit -m "feat(tokens): name the glyph-tight line height, and fill out lh

lineHeight: 1 appears across the layer and means 'this box is exactly its
glyph' -- what stops an icon from throwing its button out of alignment. That
is a role, not a number. It splits editorial from control the way fs and dz
do, so the reset belongs to dz and the prose steps to lh."
```

---

## Task 9: Adoption only — `fontWeight` and borders

**No design content in this task.** Every value already has a token; the sites simply never read it. Separated from the design tasks so a reviewer can approve it without weighing anything.

**Files:**
- Modify: the React sites assigned to `fw` and to borders

- [ ] **Step 1: Replace the weight literals**

`fw` already declares `semibold` (600), `bold` (700) and `extrabold` (800). Every literal maps to one of them. A weight with no token is a finding — report it rather than adding a token here.

- [ ] **Step 2: Replace the border literals**

`1px` → `var(--bw)`, `2px` → `var(--bw-strong)`. Take care with shorthand: `border: '1px solid var(--color-base-300)'` becomes `border: 'var(--bw) solid var(--color-base-300)'`, keeping the rest of the shorthand intact.

- [ ] **Step 3: Inspect the single `3px` site**

The census reports one. Open it and decide: `--bw-strong`, a derivation, or something that is not a border at all. **Report what it was and what you did**, because it is the one site in this task that is not mechanical.

- [ ] **Step 4: Verify**

```bash
bun run check
bun scripts/check-dimension-literals.mjs 2>&1 | grep -cE "fontWeight|border"
```

Expected: 0.

- [ ] **Step 5: Commit**

```bash
git add frameworks/react/components/
git commit -m "refactor(react): read fw and bw tokens instead of restating them

Pure adoption, no design content: every one of these values already had a
token and the sites simply never read it. 1px is --bw, 2px is --bw-strong,
and the three weights are the fw tokens they were already matching by hand."
```

---

## Task 10: `sp` — derivations, no new tokens

`sp` is numeric, so its semantics already contain the half step. Off-grid values become `calc()` derivations rather than tokens.

Half-step tokens were considered and rejected: naming them would add roughly seven knobs to the re-skin surface and to the Overview for zero expressive gain, and it would turn a 4px grid into a 2px one. **A grid whose steps are 2px apart does not constrain anything**, and constraining choice is the whole reason the grid exists.

**Files:**
- Modify: the React sites assigned to `sp`

- [ ] **Step 1: Replace on-grid values with the token**

A multiple of 4 reads its `sp` step directly: 16 → `var(--sp-4)`.

- [ ] **Step 2: Replace off-grid values with derivations**

```
10px -> calc(var(--sp-1) * 2.5)      6px -> calc(var(--sp-1) * 1.5)
14px -> calc(var(--sp-1) * 3.5)     18px -> calc(var(--sp-1) * 4.5)
22px -> calc(var(--sp-1) * 5.5)     26px -> calc(var(--sp-1) * 6.5)
```

Every off-grid value in the census should be `4n ± 2`. **Two are not: 9px and 5px.** They do not derive cleanly and they snap — one site each. Report which sites and what they became.

- [ ] **Step 3: Apply Rule 3 to the lone values**

`sp` is the **numeric** family, so a value only one component needs **derives** rather than snapping. `Button`'s 14×14 spinner is the spec's worked example: one site, so `calc(var(--sp-1) * 3.5)` and no token. `tokens/src/` gains nothing, the re-skin surface does not grow by fifty knobs, and the number stops being a literal because it now moves when the grid moves.

- [ ] **Step 4: Verify**

```bash
bun run check
bun scripts/check-dimension-literals.mjs 2>&1 | grep -cE "padding|margin|gap|width|height|top|left"
```

Expected: 0.

- [ ] **Step 5: Commit**

```bash
git add frameworks/react/components/
git commit -m "refactor(react): spacing reads the grid, on it or derived from it

sp is numeric, so its semantics already contain the half step: 18px is
calc(var(--sp-1) * 4.5), not a new token. Naming the half steps would add
seven knobs to every re-skin and turn a 4px grid into a 2px one, and a grid
whose steps are 2px apart constrains nothing.

The two values that are not 4n +/- 2 snap. Lone values derive rather than
becoming steps -- Button's spinner is one site, so it is a calc()."
```

---

## Task 11: `fs` — the snap. **This moves rendered pixels.**

The editorial scale **gains no steps**. Its names are roles, and there is no name for 12 between `xs` (11) and `sm` (13). A semantic scale that cannot name its new step is reporting that the step is not a step of that scale. 10/12/14/16/18 against 11/13/15/17/19 is not a refinement; it is a second scale at a 1px offset — and the second scale is `dz`, which Task 6 populated.

Everything that reaches this task has already failed Rule 1's prose test and Rule 2's icon test. What is left is genuinely editorial type sitting off the scale.

**Files:**
- Modify: the React sites the classification assigned to `fs`

- [ ] **Step 1: CHECKPOINT 1 — the snap direction. THE HEAVIEST.**

**STOP. Ask the author.** This is the checkpoint most likely to be answered by an implementer who thinks it is an implementation detail. It is a design decision and it moves what users see.

The questions are **per cluster, not per site** — six to eight clusters, not sixty-four questions. Does 12 go to 11 or 13? 16 to 15 or 17? 18 to 17 or 19? 34 to 32? 22 to 24? 20 to 19?

Present, for each cluster: the value, how many sites carry it *after* `dz` and `icon` took theirs, which components they are, and the two candidate targets. The spec's indication — 18 → 17 or 19, 34 → 32, 22 → 24, 20 → 19 — is an indication, not an answer.

Also present the micro-label case explicitly: `fs.xs` is the token for the mono uppercase micro-label, its `$description` already says *"mono labels / captions"*, and it is used with `textTransform: 'uppercase'`. The 10px and 9px micro-labels are drift off that existing token and snap to 11.

**Do not proceed until every cluster has an answer.**

- [ ] **Step 2: Apply the snaps**

Mechanically, from the answers. Record each cluster's decision in the classification document alongside its sites, so the visual review can trace a rendered change back to the decision that caused it.

- [ ] **Step 3: Verify the gate is now clean**

```bash
bun scripts/check-dimension-literals.mjs; echo "exit=$?"
```

Expected: **exit 0** — `no bare literals under frameworks/`. This is the moment the promise becomes true.

If any site remains, it belongs to a family that has not been fully applied. Do not exempt it to reach zero: an exemption is for a site that is *correct* as a literal, and there are exactly two of those. Go back to the task that owns the family.

- [ ] **Step 4: Prove the promise, which is the point of all of this**

Change one token value, rebuild, and confirm the layer moves:

```bash
cp tokens/src/typography.json /tmp/typo.bak
bun -e "
const fs = require('node:fs');
const p = 'tokens/src/typography.json';
const d = JSON.parse(fs.readFileSync(p, 'utf8'));
d.fs.md.\$value = { value: 16, unit: 'px' };
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
" && bun run build:tokens && grep -n "fs-md" tokens/typography.css
cp /tmp/typo.bak tokens/src/typography.json && bun run build:tokens && git status --porcelain
```

Expected: `--fs-md:16px` after the edit, and a clean tree after the restore. **The spec's falsifiable claim was that this does nothing today** — one `var(--fs-*)` reference across 40 components. Report how many components now read `--fs-md`, directly or through a role token, as the evidence that it is no longer false.

- [ ] **Step 5: Commit**

```bash
git add frameworks/react/components/ docs/superpowers/plans/2026-07-18-4-classification.md
git commit -m "feat(react): editorial type snaps to the scale it belongs to

fs gains no steps. Its names are roles, and there is no name for 12 between
xs and sm -- a semantic scale that cannot name its new step is reporting that
the step is not a step of that scale. 10/12/14/16/18 against 11/13/15/17/19
was never a refinement; it was a second scale at a 1px offset, and that
second scale is dz.

This moves rendered pixels. The snap direction per cluster was a design
decision, recorded with its sites in the classification document."
```

---

## Task 12: CHECKPOINT 5 — the visual review

**No document can close this one.** Tasks 7, 10 and 11 moved rendered values. Those are design changes and they need to be looked at, not compiled.

- [ ] **Step 1: Serve the demos**

```bash
bun run demos
```

- [ ] **Step 2: Review per group, not per site**

Open each `frameworks/react/components/<group>/*.card.html`. Also open `frameworks/react/ui_kits/console/index.html`, which composes the primitives into a real screen and is where a tracking or type change reads as wrong in context rather than in isolation.

Check both themes and both densities: `.arena-light` and `.arena-compact` are where a `dz` change shows up.

- [ ] **Step 3: Report, and route any failure correctly**

**Acceptance rule, from the spec:** a snapped site that reads wrong is evidence the snap *direction* was wrong — it sends the cluster back to Checkpoint 1. **It does not reopen the boundary.** The rules are settled; only the per-cluster direction is in question.

Present findings to the author grouped by cluster, not by site, since that is the granularity at which the decision was taken.

- [ ] **Step 4: Apply any redirection, then re-review**

If a cluster's direction changes, re-apply and look again. Do not close this checkpoint on a promise to look later.

---

## Task 13: Wire the gate in, document the rule, and update the sequence

**Files:**
- Modify: `scripts/check-all.mjs`, `package.json`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`, and the four plan files carrying the sequence table

- [ ] **Step 1: Add the dimension gate to the aggregate**

`scripts/check-all.mjs` runs six gates plus the test suite. Add `check-dimension-literals` as a seventh gate, and a `check:dimensions` script in `package.json` beside the other `check:*` entries.

Read `check-all.mjs` first — it runs steps unconditionally and prints a pass/fail summary, so a new step is a list entry, not a chained `&&`.

- [ ] **Step 1b: Close the font silence — `scripts/check-fonts-generated.mjs`**

**Added after Task 2's review, by author's decision.** Task 2 made `fetch-fonts.mjs` derive its family list from `tokens/src/typography.json`, and running it against an unhosted family now throws loudly. But the generator is not part of `bun run check`, and nothing cross-checks the declared families against the `@font-face` rules that actually exist. **An author who edits `font.display` and never re-runs the generator still hits the original silent failure**: the token resolves, no face exists, the browser falls through to `system-ui`, and no gate notices.

Write `scripts/check-fonts-generated.mjs`, a sibling of the existing `check-tokens-generated.mjs`: for every family declared in `tokens/src/typography.json`'s `font` group, assert `tokens/fonts.css` carries a matching `@font-face`. The family name is the **first** entry of each `$value` array; the rest are generic fallbacks and must not be required to have faces.

```js
/* tokens/fonts.css is generated by scripts/fetch-fonts.mjs and is not one of
 * the four files check-tokens-generated.mjs guards, so nothing noticed when
 * the two drifted. Editing font.display and not re-running the generator used
 * to resolve to a family with no @font-face and fall through to system-ui
 * with no error at all -- the worst shape a broken promise can take.
 *
 *   bun scripts/check-fonts-generated.mjs   -> exit 0 if every family has a face
 */
```

Give it unit tests in the house style, covering: a declared family with a face (pass), a declared family without one (fail, naming the family and telling the reader to run the generator), and a generic fallback like `system-ui` correctly **not** requiring a face.

Add it to `check-all.mjs` and as `check:fonts` in `package.json`.

- [ ] **Step 2: Verify the whole suite**

```bash
bun run check
```

Expected: **nine steps, all passing** — the six that existed, `check-dimension-literals`, `check-fonts-generated`, and the test suite. If `check-dimension-literals` fails here, the layer is not actually repaired and no amount of documentation fixes that.

Prove the new font gate can fail before trusting it: point `font.display` at a family with no face, run it, confirm it exits 1 with a message naming the family, then restore and confirm `git status` is clean.

- [ ] **Step 3: Add the rule to `CLAUDE.md`**

It is silent on literal dimensions today. Add to the Architecture section, beside the existing layer contract:

> **A dimension in a framework layer is a token or a derivation of tokens. A bare literal is a bug.** This is machine-checked: `bun run check:dimensions` scans `frameworks/` for literals in the properties the token layer governs and fails on each. A value passes when it is `var(--token)`, a `calc()` over one, zero, or a unit the token layer does not model (`%`, `ch`, `fr`, and the viewport and angle units). One site is exempt by name with a reason — `Calendar`'s local `zIndex` — the way the coverage gate's token exclusions are.

- [ ] **Step 4: Document the new families in `README.md`**

`README.md` is the normative specification. `icon` and `z` need sections; `dz`, `ls` and `lh` need their new steps reflected. Confirm the ICONOGRAPHY section now carries a size scale, which it lacked entirely.

- [ ] **Step 5: Verify the reversals the spec asks for are already in place**

The spec's *What this reverses* lists three "design authority" statements and four "one-off geometry" statements. **All seven were already corrected before this plan was written.** Verify rather than redo:

```bash
grep -rn "React is the design authority" . --include=*.md | grep -v node_modules
grep -rn "one-off geometry" docs/ scripts/ | grep -v node_modules
```

Expected: the first returns nothing outside quoted narration of the reversal; the second returns only passages that already say plan 4 reverses it. **If either returns a live claim, fix it here** — that is the one part of this step that is not a no-op.

- [ ] **Step 6: Add the `CHANGELOG.md` entry**

Under the existing `## [Unreleased]`, above the entries plan 3 left. Cover: the two new families and why each exists; `dz` gaining its text steps and absorbing `dz.cell`, naming the four migrated consumers; the `ls` re-derivation, and explicitly that **`ls.wide` was kept** because the spec's "zero uses" premise was false; the `lh` reset; the `fs` snap as a **design change that moves rendered pixels**, with the cluster decisions; `fetch-fonts.mjs` now deriving its family list; and the new gate.

Do not touch the `## [4.0.0]` entry and do not move a version string.

- [ ] **Step 7: Update the sequence table in all four plan files**

Slot 4 was already given this plan's filename, and slot 3 was already flipped to **Executed**, when this plan was written. **The only edit left is slot 4's status**, from `Pending` to `**Executed**`, in all five tables:

```
docs/superpowers/plans/2026-07-18-1-token-style-dictionary-migration.md
docs/superpowers/plans/2026-07-18-2-overview-token-page.md
docs/superpowers/plans/2026-07-18-3-framework-layer-token-coverage.md
docs/superpowers/plans/2026-07-18-4-token-geometry-boundary.md
docs/superpowers/plans/2026-07-18-6-four-package-build-publish.md
```

Verify with:

```bash
grep -n "^| [1-6] |" docs/superpowers/plans/2026-07-18-*.md
```

Expected: every table agrees, slots 1-4 read Executed, slots 5 and 6 Pending. These drift precisely because nobody checks them, so read the output rather than trusting the edit.

- [ ] **Step 8: Final verification**

```bash
bun run check
bun test scripts/
bun scripts/check-release.mjs
git diff --stat main -- .claude-plugin/ README.md | head
```

Expected: nine steps pass, the suite passes, `check-release` passes, and no version string moved.

- [ ] **Step 9: Commit**

```bash
git add scripts/check-all.mjs package.json CLAUDE.md README.md CHANGELOG.md \
        docs/superpowers/plans/
git commit -m "docs: state the dimension rule, and gate it

CLAUDE.md was silent on literal dimensions, which is how 290 of them
accumulated in the layer that is supposed to embody the token language. The
rule it gains -- a dimension is a token or a derivation of tokens -- is
machine-checked by check-dimension-literals.mjs, now the eighth step of
bun run check.

Records the two new families in the README, and corrects the sequence table
in the four plans that carry it."
```

---

## What this plan deliberately does not do

- **Grow the Angular or Tailwind layers.** That is plan 5. This plan governs what those 34 manifests may write, and precedes them.
- **Publish anything.** Plan 6 waits on plan 5, which waits on this.
- **Reopen the 4px grid.** It stays 4px. That is the point of Task 10.
- **Add an opacity family.** Arena already answers this in the colour channel with `--mute-2-disabled`. On a dark-first system, opacity over a dark surface is unpredictable in a way a resolved colour is not, and the two would drift.
- **Add an animation-cycle family.** `dur` stops at 420ms because it models UI transitions; an animation cycle is a different quantity. Six sites, left as derivations.
- **Make the brand assets themeable.** The fixed hex in `assets/*.svg` is Dravensoft's identity, not Arena's skin. The natural instinct is to "fix" them to `currentColor`, which would quietly turn a brand mark into a themeable element.
- **Change any colour value.** Dimension, layering and typographic metrics only.
- **Restore "React is the design authority."** `tokens/src/` is the design source of truth; React is the reference implementation. Where a layer and the token layer disagree, the layer is wrong.

## What plan 5 inherits from this

- **The classification document is the precedent for the 34 manifests.** A manifest that needs a value looks it up there rather than re-deciding it.
- **Rule 3 is what holds the line.** A value one component needs is a derivation, not a token. Without it, `tokens/src/` becomes a component API, every re-skin acquires fifty knobs, and `Arena - Overview.html` — which generates itself from the token source — becomes unreadable.
- **The gate covers `frameworks/` entirely, not just React.** An Angular primitive or a Tailwind manifest that writes a bare literal fails the same gate. Plan 5 inherits a layer that cannot regress silently.
- **`icon` and `z` are new namespaces in the Tailwind preset.** Plan 5's manifests can use them; they did not exist when the parity spec was written.
