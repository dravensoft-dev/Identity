# Overview as a self-generating token page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution order: 2 of 6.** **Status: EXECUTED** — shipped in `v4.0.0`
(`b070df6` and following). The checkboxes below were never ticked; the artefacts
are the record. Do not re-run this plan.

| # | Plan | Status |
|---|---|---|
| 1 | `2026-07-18-1-token-style-dictionary-migration.md` | **Executed** (v4.0.0) |
| 2 | `2026-07-18-2-overview-token-page.md` | **Executed** (v4.0.0) |
| 3 | `2026-07-18-3-framework-layer-token-coverage.md` | **Executed** (unreleased) |
| 4 | `2026-07-18-4-token-geometry-boundary.md` | **Executed** (unreleased) |
| 5a | `2026-07-18-5a-angular-primitive-parity.md` — the 18 Angular primitives + the verification gates | Pending |
| 5b | `2026-07-18-5b-tailwind-manifest-parity.md` — the 20 orphan manifests; depends on 5a's Tasks 1–4 | Pending |
| 6 | `2026-07-18-6-four-package-build-publish.md` | Pending |

**Goal:** Replace `Arena - Overview.dc.html`'s hand-rolled parallel component library with a plain-HTML page that generates itself from `tokens/src/*.json` and `tokens/colors.css`, presenting all 138 token names and nothing else, plus a `bun run demos` server for the two root demo pages.

**Architecture:** The page leaves `dc-runtime` and becomes plain HTML driven by one ES module, `overview.js`. That module fetches the DTCG JSON for **names and descriptions**, reads **values** from `getComputedStyle(document.documentElement)` so the page exercises the real built CSS, and picks a preview shape per token **group** (falling back to `$type`) using a pure, tested helper in `scripts/lib/token-preview.mjs`. The alias layer is read out of `tokens/colors.css` with the existing `scripts/lib/css-decls.mjs`, unchanged.

**Tech Stack:** Bun 1.3, browser ES modules, no new dependency, `node:test` via `bun test`.

## Global Constraints

- **English only** — all code, comments, docs, and UI copy.
- **No emoji** anywhere, in product or docs.
- Spec of record: `docs/superpowers/specs/2026-07-18-overview-token-page-design.md`.
- **No gradients** on any surface. Depth comes from the `base-100`/`base-200`/`base-300` surface scale, the hairline border and the warm shadow.
- **No raw hex anywhere in the page.** Every colour, size, radius, shadow and duration in `overview.js` and the page's own CSS must be a `var(--token)`. This page's whole claim is that it is built from the tokens; one hardcoded value falsifies it.
- **The DTCG source is not modified.** No `$extensions` preview hints, no new tokens. The group-to-preview mapping lives in `scripts/lib/token-preview.mjs`, because `tokens/src/` is documented as platform-neutral.
- **`Dravensoft Identity.dc.html` is not touched.** It keeps using `support.js`.
- **`support.js` is never edited** — it is a generated bundle whose source is not in this repo.
- Everything landing on `main` after a tag goes under `## [Unreleased]` in `CHANGELOG.md`.
- Cutting a release is out of scope.

## Decisions this plan makes that the spec left open

1. **The file is renamed** `Arena - Overview.dc.html` to `Arena - Overview.html`. The `.dc`
   infix signals the dc-runtime the page no longer uses; leaving it is exactly the kind of
   stale signal this work removes. Only two live references exist (`README.md:64`,
   `README.md:235`) plus `CLAUDE.md`, all updated in Task 7.
2. **`CHANGELOG.md:103` is left untouched.** It is a historical `3.1.0` entry describing a
   page that had that name at that version. Rewriting shipped history to match a later
   rename would make the changelog lie about the past.
3. **README's "Audience and scope" section is rewritten** (Task 7). It currently frames the
   Overview as "an example application" for a developer audience — false once the page
   becomes the token reference. The console kit becomes the sole example application. The
   spec did not cover this; it is a direct consequence of the change.

## Pre-validated during planning

The riskiest assumption in this plan is that `path.join('-')` reproduces exactly the names
Style Dictionary's `name/kebab` emits. If it did not, every `getComputedStyle` lookup would
return `""` and the page would report every token as stale — a silent, total failure. This
was **run for real against all six source files before the plan was written**, not assumed:

```
OK palette.dark.json      27 names
OK palette.light.json     27 names
OK typography.json        25 names
OK spacing.json           25 names
OK density.compact.json    7 names
OK effects.json           21 names
ALL NAMES AGREE
```

Task 2's final test encodes this check permanently, so a future change to either side
breaks the suite instead of the page.

Two properties of the reused modules were also confirmed: `scripts/lib/css-decls.mjs` and
the new `token-preview.mjs` import nothing at all, so both load in a browser as plain ES
modules with no shim.

## File Structure

**New:**
- `scripts/serve.mjs` — the demo server. `Bun.serve` + `Bun.file`, no dependency.
- `scripts/lib/token-preview.mjs` — pure. DTCG tree to flat preview descriptors, and the group-to-preview mapping. No I/O, no DOM.
- `scripts/token-preview.test.mjs` — `node:test` suite, including a cross-check that the names it derives match the names the build actually emits.
- `overview.js` — repo root, beside `theme.js` and `jsx-loader.js`. The DOM layer: fetch, render, re-read on scope change.

**Rewritten:** `Arena - Overview.dc.html` to `Arena - Overview.html`.

**Modified:** `package.json`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`.

**Reused unchanged:** `scripts/lib/css-decls.mjs`, `theme.js`, `styles.css`, `tokens/`.

---

### Task 1: The demo server

**Files:**
- Create: `scripts/serve.mjs`
- Modify: `package.json`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `bun run demos`, serving the repo root on port 8000 (override with `PORT`).

Serving over HTTP is required, not a convenience: the pages load `styles.css`, `assets/`
and now `tokens/src/*.json` by relative path, and `fetch` does not work under `file://`.

- [ ] **Step 1: Write the server**

Create `scripts/serve.mjs`:

```js
/* Serves the repo root over HTTP so the demo pages work.
 *
 * The pages load styles.css, assets/ and tokens/src/*.json by relative path,
 * and the Overview fetches its token source — none of which works under
 * file://. This is the one genuinely Bun-specific script in the repo; every
 * gate stays runtime-portable.
 *
 *   bun run demos            -> serves on 8000
 *   PORT=9000 bun run demos  -> serves on 9000
 */
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8000;

const PAGES = [
  ['Overview  ', '/Arena%20-%20Overview.html'],
  ['Identity  ', '/Dravensoft%20Identity.dc.html'],
  ['Guidelines', '/guidelines/'],
];

/** Resolves a URL path to a file inside root, or null if it escapes root. */
function resolve(pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const path = join(root, rel);
  if (!path.startsWith(root)) return null;
  return path.endsWith('/') ? join(path, 'index.html') : path;
}

Bun.serve({
  port,
  async fetch(req) {
    const path = resolve(new URL(req.url).pathname);
    if (!path) return new Response('Forbidden', { status: 403 });
    const file = Bun.file(path);
    if (await file.exists()) return new Response(file);
    const index = Bun.file(join(path, 'index.html'));
    if (await index.exists()) return new Response(index);
    return new Response('Not found', { status: 404 });
  },
});

console.log(`Arena demos on http://localhost:${port}`);
for (const [label, path] of PAGES) console.log(`  ${label} -> ${path}`);
```

- [ ] **Step 2: Register the script**

In `package.json`, add `"demos"` to `scripts`, so the block reads:

```json
  "scripts": {
    "demos": "bun scripts/serve.mjs",
    "build:tokens": "bun scripts/build-tokens.mjs",
    "check:tokens": "bun scripts/check-tokens-generated.mjs",
    "check:dtcg": "bun scripts/check-dtcg.mjs",
    "test": "bun test scripts/"
  }
```

- [ ] **Step 3: Verify it serves, and that traversal is refused**

Run, in one shell:

```bash
bun run demos &
sleep 1
curl -s -o /dev/null -w "%{http_code} styles.css\n"            http://localhost:8000/styles.css
curl -s -o /dev/null -w "%{http_code} identity\n"              "http://localhost:8000/Dravensoft%20Identity.dc.html"
curl -s -o /dev/null -w "%{http_code} token json\n"            http://localhost:8000/tokens/src/effects.json
curl -s -o /dev/null -w "%{http_code} guidelines dir\n"        http://localhost:8000/guidelines/
curl -s -o /dev/null -w "%{http_code} missing\n"               http://localhost:8000/nope.css
curl -s -o /dev/null -w "%{http_code} traversal\n"             http://localhost:8000/../../etc/passwd
kill %1
```

Expected: `200` for `styles.css`, identity, token json and the guidelines directory;
`404 missing`; and `403` or `404` for the traversal attempt — never `200`.

Note the Overview URL is not checked yet; the file is still named `.dc.html` until Task 6.

- [ ] **Step 4: Correct the Bun claim in the CHANGELOG**

The `[Unreleased]` entry currently asserts *"Nothing in the scripts is Bun-specific"*.
`scripts/serve.mjs` uses `Bun.serve`, so that sentence is now false. In `CHANGELOG.md`,
replace this sentence inside the "The build and check scripts run on Bun" bullet:

```markdown
  does not split. Nothing in the scripts is Bun-specific — they are plain ESM importing
  only `node:fs`, `node:path` and `node:url`, and were verified to produce identical
  output and exit codes under both runtimes.
```

with:

```markdown
  does not split. Every gate stays runtime-portable — plain ESM importing only `node:fs`,
  `node:path` and `node:url`, verified to produce identical output and exit codes under
  both runtimes. The one exception is the new `bun run demos` dev server
  (`scripts/serve.mjs`), which uses `Bun.serve` and is not a gate.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/serve.mjs package.json CHANGELOG.md
git commit -m "build: add the bun run demos server for the root demo pages"
```

---

### Task 2: The preview descriptor module

**Files:**
- Create: `scripts/lib/token-preview.mjs`
- Test: `scripts/token-preview.test.mjs`

**Interfaces:**
- Consumes: nothing at runtime. Its test consumes `parseDecls` from `scripts/lib/css-decls.mjs`.
- Produces, both imported by `overview.js` in Task 3:
  - `flattenTokens(tree) -> Array<{name, group, path, $type, $description}>` — `name` is the CSS custom-property name **without** `--`, `group` is the first path segment, in source order.
  - `previewFor(group, $type) -> string` — one of `swatch`, `family`, `weight`, `size`, `leading`, `tracking`, `bar`, `radius`, `rule`, `elevation`, `duration`, `easing`, `control`, `breakpoint`, `value`.

The name derivation must agree with what Style Dictionary's `name/kebab` emits in
`scripts/build-tokens.mjs`, or the page would look up custom properties that do not exist.
Step 1's final test asserts that agreement against the real generated CSS rather than
trusting it.

- [ ] **Step 1: Write the failing test**

Create `scripts/token-preview.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flattenTokens, previewFor } from './lib/token-preview.mjs';
import { parseDecls } from './lib/css-decls.mjs';

test('flattens a nested group into dash-joined custom-property names', () => {
  const out = flattenTokens({
    r: { $type: 'dimension', sm: { $value: { value: 6, unit: 'px' }, $description: 'buttons' } },
  });
  assert.deepEqual(out, [
    { name: 'r-sm', group: 'r', path: ['r', 'sm'], $type: 'dimension', $description: 'buttons' },
  ]);
});

test('inherits $type from the nearest ancestor group', () => {
  const out = flattenTokens({ fw: { $type: 'fontWeight', bold: { $value: 700 } } });
  assert.equal(out[0].$type, 'fontWeight');
});

test('handles a top-level leaf token, whose group is its own name', () => {
  const out = flattenTokens({ 'container-max': { $type: 'dimension', $value: { value: 1240, unit: 'px' } } });
  assert.deepEqual(out, [
    { name: 'container-max', group: 'container-max', path: ['container-max'], $type: 'dimension', $description: undefined },
  ]);
});

test('keeps source order and omits group nodes themselves', () => {
  const out = flattenTokens({
    sp: { $type: 'dimension', 0: { $value: { value: 0, unit: 'px' } }, 1: { $value: { value: 4, unit: 'px' } } },
    gutter: { $type: 'dimension', $value: { value: 88, unit: 'px' } },
  });
  assert.deepEqual(out.map((t) => t.name), ['sp-0', 'sp-1', 'gutter']);
});

test('maps each group to its own preview shape', () => {
  assert.equal(previewFor('color', 'color'), 'swatch');
  assert.equal(previewFor('fs', 'dimension'), 'size');
  assert.equal(previewFor('sp', 'dimension'), 'bar');
  assert.equal(previewFor('r', 'dimension'), 'radius');
  assert.equal(previewFor('dz', 'dimension'), 'control');
  assert.equal(previewFor('bp', 'dimension'), 'breakpoint');
  assert.equal(previewFor('shadow', 'shadow'), 'elevation');
  assert.equal(previewFor('ease', 'cubicBezier'), 'easing');
  assert.equal(previewFor('ls', 'number'), 'tracking');
  assert.equal(previewFor('lh', 'number'), 'leading');
});

test('an unmapped group falls back to its type, never to nothing', () => {
  assert.equal(previewFor('brandnew', 'dimension'), 'bar');
  assert.equal(previewFor('brandnew', 'color'), 'swatch');
  assert.equal(previewFor('brandnew', 'duration'), 'duration');
  assert.equal(previewFor('brandnew', 'number'), 'value');
});

test('an unknown type still yields a renderable shape rather than undefined', () => {
  assert.equal(previewFor('brandnew', 'gradient'), 'value');
});

/* The page looks tokens up as --<name> via getComputedStyle. If this module derived
 * names differently from the build, every lookup would silently return "". */
test('derived names match the custom properties the build actually emits', () => {
  const cases = [
    ['tokens/src/palette.dark.json', 'tokens/palette.css', ':root'],
    ['tokens/src/palette.light.json', 'tokens/palette.css', '.arena-light'],
    ['tokens/src/typography.json', 'tokens/typography.css', ':root'],
    ['tokens/src/spacing.json', 'tokens/spacing.css', ':root'],
    ['tokens/src/density.compact.json', 'tokens/spacing.css', '.arena-compact'],
    ['tokens/src/effects.json', 'tokens/effects.css', ':root'],
  ];
  for (const [src, css, selector] of cases) {
    const derived = flattenTokens(JSON.parse(readFileSync(src, 'utf8'))).map((t) => t.name).sort();
    const emitted = [...parseDecls(readFileSync(css, 'utf8')).get(selector).keys()].sort();
    assert.deepEqual(derived, emitted, `${src} -> ${css} ${selector}`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/token-preview.test.mjs`
Expected: FAIL — `Cannot find module '.../scripts/lib/token-preview.mjs'`.

- [ ] **Step 3: Implement the module**

Create `scripts/lib/token-preview.mjs`:

```js
/* Turns a DTCG token tree into flat preview descriptors for the Overview page.
 *
 * Pure: no I/O, no DOM, no Style Dictionary. It runs in the browser (imported
 * by overview.js) and under bun test alike.
 *
 * The group-to-preview mapping lives HERE and not in tokens/src/, because the
 * DTCG source is documented as platform-neutral and must not carry HTML
 * presentation concerns. See tokens/src/TYPE-MAP.md and README's layer contract.
 */

/* $type alone cannot choose a drawing: --fs-display and --sp-16 are both
 * `dimension` valued 64px, but one must render as 64px text and the other as a
 * 64px bar. The group decides; the type is only the fallback. */
const BY_GROUP = {
  color: 'swatch',
  font: 'family',
  fw: 'weight',
  fs: 'size',
  lh: 'leading',
  ls: 'tracking',
  sp: 'bar',
  gutter: 'bar',
  'container-max': 'bar',
  bp: 'breakpoint',
  dz: 'control',
  r: 'radius',
  bw: 'rule',
  'bw-strong': 'rule',
  shadow: 'elevation',
  scrim: 'swatch',
  'scrim-blur': 'bar',
  focus: 'rule',
  dur: 'duration',
  ease: 'easing',
};

/* A group nobody has styled yet still has to appear, so that adding a token to
 * tokens/src/ shows up here with no edit to this file. */
const BY_TYPE = {
  color: 'swatch',
  dimension: 'bar',
  duration: 'duration',
  cubicBezier: 'easing',
  fontFamily: 'family',
  fontWeight: 'weight',
  shadow: 'elevation',
  number: 'value',
};

/** @param {string} group @param {string} [type] @returns {string} preview shape */
export function previewFor(group, type) {
  return BY_GROUP[group] ?? BY_TYPE[type] ?? 'value';
}

/** Walks a DTCG tree, returning one descriptor per token in source order.
 *  `name` is the CSS custom-property name without the leading `--`.
 *  @param {object} tree
 *  @returns {Array<{name: string, group: string, path: string[], $type: string|undefined, $description: string|undefined}>} */
export function flattenTokens(tree) {
  const out = [];
  const walk = (node, path, inheritedType) => {
    const type = node.$type ?? inheritedType;
    if (node.$value !== undefined) {
      out.push({
        name: path.join('-'),
        group: path[0],
        path,
        $type: type,
        $description: node.$description,
      });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || child === null || typeof child !== 'object') continue;
      walk(child, [...path, key], type);
    }
  };
  walk(tree, [], undefined);
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/token-preview.test.mjs`
Expected: PASS, 8/8. The last test is the important one — it proves this module and
`scripts/build-tokens.mjs` agree on all 98 DTCG names.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/token-preview.mjs scripts/token-preview.test.mjs
git commit -m "feat: add the token preview descriptor module"
```

---

### Task 3: The page shell and the colour sections

**Files:**
- Create: `overview.js`
- Create: `Arena - Overview.html`

**Interfaces:**
- Consumes: `flattenTokens`, `previewFor` from `scripts/lib/token-preview.mjs`; `window.__toggleTheme` from `theme.js`.
- Produces: `renderSection(config) -> HTMLElement` and the `PREVIEW` renderer registry, both extended by Tasks 4 and 5.

This task builds the vertical slice that proves the whole approach: fetch the JSON, derive
names, read real values from `getComputedStyle`, render swatches, and re-read on theme
change. The old file still exists at this point; it is deleted in Task 6.

- [ ] **Step 1: Write the page shell**

Create `Arena - Overview.html`. Every value is a token; there is no raw hex:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arena — Token language</title>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css">
<style>
body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body)}
.page{max-width:var(--container-max);margin:0 auto}
.hero{position:relative;padding:var(--sp-12) var(--sp-12) var(--sp-10);border-bottom:var(--bw) solid var(--border)}
.brandrow{display:flex;align-items:center;gap:var(--sp-4)}
.brandname{font-family:var(--font-display);font-weight:var(--fw-black);font-size:var(--fs-h1);letter-spacing:var(--ls-tight);text-transform:uppercase;color:var(--text-strong);line-height:var(--lh-tight)}
.kicker{font-family:var(--font-mono);font-size:var(--fs-xs);letter-spacing:var(--ls-wide);text-transform:uppercase;color:var(--gold);margin-top:var(--sp-2)}
.lede{font-size:var(--fs-lg);color:var(--text-muted);max-width:58ch;line-height:var(--lh-body);margin-top:var(--sp-5)}
.controls{position:absolute;top:var(--sp-6);right:var(--sp-12);display:flex;gap:var(--sp-2)}
.ctl{display:inline-flex;align-items:center;gap:var(--sp-2);height:var(--dz-ctl-h);padding:0 var(--sp-4);background:var(--panel);color:var(--text-body);border:var(--bw) solid var(--border-strong);border-radius:var(--r-pill);cursor:pointer;font-family:var(--font-mono);font-size:var(--fs-xs);letter-spacing:var(--ls-label);text-transform:uppercase;transition:background var(--dur-fast) var(--ease-out)}
.ctl:hover{background:var(--bg-raised)}
.ctl:focus-visible{outline:var(--focus-width) solid var(--focus-ring);outline-offset:var(--focus-offset)}
.sec{padding:var(--sp-10) var(--sp-12);border-bottom:var(--bw) solid var(--border)}
.eyebrow{font-family:var(--font-mono);font-size:var(--fs-xs);letter-spacing:var(--ls-wide);text-transform:uppercase;color:var(--crimson)}
.h2{font-family:var(--font-display);font-weight:var(--fw-black);font-size:var(--fs-h2);letter-spacing:var(--ls-tight);margin:var(--sp-2) 0 var(--sp-6);color:var(--text-strong)}
.note{font-size:var(--fs-md);color:var(--text-muted);max-width:60ch;line-height:var(--lh-body);margin-bottom:var(--sp-6)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--sp-4)}
.item{border:var(--bw) solid var(--border);border-radius:var(--r-md);padding:var(--sp-4);background:var(--surface-card);min-width:0}
.item-name{font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--text-body);word-break:break-all}
.item-val{font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--sp-1);word-break:break-all}
.item-desc{font-size:var(--fs-sm);color:var(--text-muted);line-height:var(--lh-body);margin-top:var(--sp-2)}
.item-missing{color:var(--danger);border-color:var(--danger)}
.tally{font-family:var(--font-mono);font-size:var(--fs-xs);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--text-muted);margin-top:var(--sp-5)}
.tally-bad{color:var(--danger)}
.swatch{height:64px;border-radius:var(--r-sm);border:var(--bw) solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:var(--fs-xs);margin-bottom:var(--sp-3)}
.ramp{display:flex;gap:var(--sp-1)}
.ramp-slot{flex:1;height:56px;border-radius:var(--r-xs)}
</style>
</head>
<body>
<div class="page">
  <section class="hero">
    <div class="controls">
      <button class="ctl themebtn" type="button"><span class="tlabel">Dark</span></button>
      <button class="ctl" type="button" id="density">Comfortable</button>
    </div>
    <div class="brandrow">
      <img src="assets/rotor-crimson.svg" width="56" height="56" alt="Rotor">
      <div>
        <div class="brandname">Arena</div>
        <div class="kicker">Token language · Dravensoft</div>
      </div>
    </div>
    <p class="lede">Every token Arena defines, generated from the DTCG source and measured
    in the live browser. Values are read from the stylesheet actually loaded, not echoed
    back from the JSON. Components are not shown here: they belong to each framework layer
    under <code>frameworks/</code>.</p>
  </section>
  <main id="sections"></main>
</div>
<script src="theme.js"></script>
<script type="module" src="overview.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write the module with the colour sections**

Create `overview.js`:

```js
/* Renders the Arena token language from its own source.
 *
 * Names and $descriptions come from tokens/src/*.json; VALUES come from
 * getComputedStyle on the live document, so the page exercises the whole chain
 * (JSON -> build -> CSS -> browser) instead of echoing the JSON back. A token
 * that resolves empty means the committed CSS is stale, and it is flagged
 * rather than displayed as if it were in effect.
 *
 * Served over HTTP only — it fetches its source, which file:// forbids.
 * Run: bun run demos
 */
import { flattenTokens, previewFor } from './scripts/lib/token-preview.mjs';

const root = document.documentElement;
const host = document.getElementById('sections');

/** Reads a custom property as the browser currently resolves it. */
const value = (name) => getComputedStyle(root).getPropertyValue(`--${name}`).trim();

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

async function loadTokens(file) {
  const res = await fetch(`tokens/src/${file}`);
  if (!res.ok) throw new Error(`cannot load tokens/src/${file}: ${res.status}`);
  return flattenTokens(await res.json());
}

/* One renderer per preview shape. Each returns the element that sits above the
 * name/value/description block, or null when the shape needs no visual.
 * Tasks 4 and 5 add to this registry; nothing else changes. */
const PREVIEW = {
  swatch(token) {
    const node = el('div', 'swatch');
    node.style.background = `var(--${token.name})`;
    const pair = `${token.name}-content`;
    if (value(pair)) {
      node.style.color = `var(--${pair})`;
      node.textContent = 'Aa';
    }
    return node;
  },
  value: () => null,
};

function renderToken(token) {
  const resolved = value(token.name);
  const item = el('div', resolved ? 'item' : 'item item-missing');
  const preview = (PREVIEW[previewFor(token.group, token.$type)] ?? PREVIEW.value)(token);
  if (preview) item.append(preview);
  item.append(el('div', 'item-name', `--${token.name}`));
  item.append(el('div', 'item-val', resolved || 'does not resolve — rebuild: bun run build:tokens'));
  if (token.$description) item.append(el('div', 'item-desc', token.$description));
  return item;
}

/** @param {{eyebrow: string, title: string, note?: string, tokens: Array}} config */
export function renderSection({ eyebrow, title, note, tokens }) {
  const sec = el('section', 'sec');
  sec.append(el('div', 'eyebrow', eyebrow), el('div', 'h2', title));
  if (note) sec.append(el('p', 'note', note));
  const grid = el('div', 'grid');
  for (const token of tokens) grid.append(renderToken(token));
  sec.append(grid);
  const missing = tokens.filter((t) => !value(t.name)).length;
  const tally = el('div', missing ? 'tally tally-bad' : 'tally',
    missing ? `${tokens.length} tokens, ${missing} not resolving` : `${tokens.length} tokens, all resolving`);
  sec.append(tally);
  return sec;
}

/* Re-rendering (rather than patching) on a scope change is what keeps the page
 * honest: every value is read again from the new scope. */
const sections = [];
function paint() {
  host.replaceChildren(...sections.map((make) => make()));
}

async function main() {
  const palette = await loadTokens('palette.dark.json');
  const skin = palette.filter((t) => !t.name.startsWith('color-cat-'));
  const ramp = palette.filter((t) => t.name.startsWith('color-cat-'));

  sections.push(() => renderSection({
    eyebrow: 'Color',
    title: 'Skin',
    note: 'Each colour is defined beside its -content counterpart, the legible colour on top. '
      + 'Where a pair exists the swatch is labelled in its own content colour, which is the contract a skin defines. '
      + 'Values shown are the active theme.',
    tokens: skin,
  }));

  sections.push(() => {
    const sec = renderSection({
      eyebrow: 'Color',
      title: 'Categorical ramp',
      note: 'Identity only, never meaning. Slot order is fixed: slot N is always slot N, and a ninth series '
        + 'folds to Other rather than generating a hue.',
      tokens: ramp,
    });
    const strip = el('div', 'ramp');
    for (const token of ramp) {
      const slot = el('div', 'ramp-slot');
      slot.style.background = `var(--${token.name})`;
      strip.append(slot);
    }
    sec.insertBefore(strip, sec.querySelector('.grid'));
    return sec;
  });

  paint();

  document.querySelector('.themebtn').addEventListener('click', paint);
  const density = document.getElementById('density');
  density.addEventListener('click', () => {
    const compact = root.classList.toggle('arena-compact');
    density.textContent = compact ? 'Compact' : 'Comfortable';
    paint();
  });
}

main().catch((err) => {
  host.append(el('p', 'note', `Overview failed to load: ${err.message}`));
  throw err;
});
```

- [ ] **Step 3: Verify it renders the real values**

Run:

```bash
bun run demos &
sleep 1
curl -s -o /dev/null -w "%{http_code} page\n"   "http://localhost:8000/Arena%20-%20Overview.html"
curl -s -o /dev/null -w "%{http_code} module\n" http://localhost:8000/overview.js
curl -s -o /dev/null -w "%{http_code} lib\n"    http://localhost:8000/scripts/lib/token-preview.mjs
curl -s -o /dev/null -w "%{http_code} json\n"   http://localhost:8000/tokens/src/palette.dark.json
kill %1
```

Expected: `200` on all four. A `404` on the lib is the failure mode to watch for — the page
imports it by relative path from the repo root, so the server must expose `scripts/`.

Then open `http://localhost:8000/Arena%20-%20Overview.html` in a browser and confirm:
- Two colour sections render; every swatch shows a colour, no item has the danger border.
- Each section ends with `N tokens, all resolving` — never `not resolving`.
- The theme button flips to light and **every value re-reads** (the hex strings change).
- The density button flips to Compact; nothing breaks (its tokens appear in Task 4).
- The console is free of errors.

- [ ] **Step 4: Commit**

```bash
git add overview.js "Arena - Overview.html"
git commit -m "feat: render the Arena colour tokens from their DTCG source"
```

---

### Task 4: Typography, spacing and density sections

**Files:**
- Modify: `overview.js`

**Interfaces:**
- Consumes: `renderSection`, `PREVIEW`, `loadTokens` from Task 3.
- Produces: the `family`, `weight`, `size`, `leading`, `tracking`, `bar`, `control`, `breakpoint` renderers in `PREVIEW`.

- [ ] **Step 1: Add the renderers**

In `overview.js`, extend the `PREVIEW` registry. Insert these entries between `swatch` and
`value`, leaving both in place:

```js
  family(token) {
    const node = el('div', null, 'Software worthy of being exalted');
    node.style.fontFamily = `var(--${token.name})`;
    node.style.fontSize = 'var(--fs-h4)';
    node.style.marginBottom = 'var(--sp-3)';
    return node;
  },
  weight(token) {
    const node = el('div', null, 'Arena');
    node.style.fontWeight = `var(--${token.name})`;
    node.style.fontFamily = 'var(--font-display)';
    node.style.fontSize = 'var(--fs-h3)';
    node.style.marginBottom = 'var(--sp-3)';
    return node;
  },
  size(token) {
    const node = el('div', null, 'Arena');
    node.style.fontSize = `var(--${token.name})`;
    node.style.fontFamily = 'var(--font-display)';
    node.style.lineHeight = 'var(--lh-tight)';
    node.style.marginBottom = 'var(--sp-3)';
    node.style.overflow = 'hidden';
    return node;
  },
  leading(token) {
    const node = el('p', null, 'Depth comes from the surface scale, the hairline border and the warm shadow, never from a gradient.');
    node.style.lineHeight = `var(--${token.name})`;
    node.style.fontSize = 'var(--fs-sm)';
    node.style.margin = '0 0 var(--sp-3)';
    return node;
  },
  tracking(token) {
    const node = el('div', null, 'ARENA TRACKING');
    node.style.letterSpacing = `var(--${token.name})`;
    node.style.fontFamily = 'var(--font-mono)';
    node.style.fontSize = 'var(--fs-sm)';
    node.style.marginBottom = 'var(--sp-3)';
    return node;
  },
  bar(token) {
    const rail = el('div');
    rail.style.marginBottom = 'var(--sp-3)';
    const fill = el('div');
    fill.style.height = 'var(--sp-3)';
    fill.style.width = `min(100%, var(--${token.name}))`;
    fill.style.background = 'var(--crimson)';
    fill.style.borderRadius = 'var(--r-xs)';
    rail.append(fill);
    return rail;
  },
  control(token) {
    const node = el('div', null, 'Control');
    node.style.height = `var(--${token.name})`;
    node.style.display = 'flex';
    node.style.alignItems = 'center';
    node.style.padding = '0 var(--sp-3)';
    node.style.background = 'var(--bg-raised)';
    node.style.border = 'var(--bw) solid var(--border-strong)';
    node.style.borderRadius = 'var(--r-sm)';
    node.style.fontFamily = 'var(--font-mono)';
    node.style.fontSize = 'var(--fs-xs)';
    node.style.marginBottom = 'var(--sp-3)';
    return node;
  },
  breakpoint(token) {
    const rail = el('div');
    rail.style.position = 'relative';
    rail.style.height = 'var(--sp-2)';
    rail.style.background = 'var(--bg-raised)';
    rail.style.borderRadius = 'var(--r-xs)';
    rail.style.marginBottom = 'var(--sp-3)';
    const mark = el('div');
    mark.style.position = 'absolute';
    mark.style.insetBlock = '0';
    mark.style.left = '0';
    mark.style.width = `min(100%, calc(var(--${token.name}) / 1024 * 100%))`;
    mark.style.background = 'var(--gold)';
    mark.style.borderRadius = 'var(--r-xs)';
    rail.append(mark);
    return rail;
  },
```

- [ ] **Step 2: Add the sections**

In `overview.js`'s `main()`, after the categorical ramp section and before `paint()`:

```js
  const type = await loadTokens('typography.json');
  sections.push(() => renderSection({
    eyebrow: 'Typography',
    title: 'Families, weights and scale',
    note: 'Archivo carries display, Familjen Grotesk carries body, Spline Sans Mono carries data and labels. '
      + 'Tracking is a unitless number with an em render hint, because em is not a DTCG dimension unit.',
    tokens: type,
  }));

  const spacing = await loadTokens('spacing.json');
  sections.push(() => renderSection({
    eyebrow: 'Spacing',
    title: 'Grid, layout and breakpoints',
    note: 'A 4px base grid. Breakpoints are shared values read by JS, never media queries: components style '
      + 'themselves with inline style objects, which cannot hold one.',
    tokens: spacing.filter((t) => t.group !== 'dz'),
  }));

  const density = await loadTokens('density.compact.json');
  sections.push(() => renderSection({
    eyebrow: 'Density',
    title: 'Comfortable and compact',
    note: 'Comfortable by default. The compact scope re-densifies rows and controls through one class, '
      + '.arena-compact — use the control above to switch, and these values change in place.',
    tokens: spacing.filter((t) => t.group === 'dz'),
  }));
```

Note the density section renders the `dz` names from `spacing.json`; the compact file
declares the same names, so the toggle changes what `getComputedStyle` returns for them.
`density` is loaded to assert the two files stay in step in Step 3.

- [ ] **Step 3: Verify the density override is real**

Add this guard immediately after the `const density = await loadTokens(...)` line:

```js
  const base = spacing.filter((t) => t.group === 'dz').map((t) => t.name).sort().join();
  if (density.map((t) => t.name).sort().join() !== base)
    console.warn('overview: density.compact.json and spacing.json disagree on the dz names');
```

Then run `bun run demos`, open the page, and confirm in the browser:
- Typography: each family renders in its own face, each weight visibly differs, `--fs-display` is large, `--ls-wide` is visibly tracked.
- Spacing: bars grow monotonically from `--sp-0` to `--sp-24`.
- Density: pressing **Compact** shrinks the control boxes and the values change (`--dz-ctl-h` 40px to 32px).
- Every section still reports `all resolving`, and the console shows no warning.

- [ ] **Step 4: Commit**

```bash
git add overview.js
git commit -m "feat: render the typography, spacing and density tokens"
```

---

### Task 5: The effects section

**Files:**
- Modify: `overview.js`

**Interfaces:**
- Consumes: `renderSection`, `PREVIEW`, `loadTokens`.
- Produces: the `radius`, `rule`, `elevation`, `duration`, `easing` renderers.

- [ ] **Step 1: Add the renderers**

Extend `PREVIEW` in `overview.js` with:

```js
  radius(token) {
    const node = el('div');
    node.style.height = '64px';
    node.style.background = 'var(--bg-raised)';
    node.style.border = 'var(--bw) solid var(--border-strong)';
    node.style.borderRadius = `var(--${token.name})`;
    node.style.marginBottom = 'var(--sp-3)';
    return node;
  },
  rule(token) {
    const node = el('div');
    node.style.height = `var(--${token.name})`;
    node.style.background = 'var(--border-strong)';
    node.style.margin = 'var(--sp-5) 0';
    return node;
  },
  elevation(token) {
    const node = el('div');
    node.style.height = '64px';
    node.style.background = 'var(--surface-card)';
    node.style.borderRadius = 'var(--r-md)';
    node.style.boxShadow = `var(--${token.name})`;
    node.style.margin = '0 var(--sp-2) var(--sp-5)';
    return node;
  },
  duration(token) {
    const track = el('div');
    track.style.height = 'var(--sp-3)';
    track.style.background = 'var(--bg-raised)';
    track.style.borderRadius = 'var(--r-xs)';
    track.style.overflow = 'hidden';
    track.style.marginBottom = 'var(--sp-3)';
    const fill = el('div');
    fill.style.height = '100%';
    fill.style.width = '100%';
    fill.style.background = 'var(--crimson)';
    fill.style.transformOrigin = 'left';
    fill.style.animation = `arena-sweep var(--${token.name}) var(--ease-out) infinite`;
    track.append(fill);
    return track;
  },
  easing(token) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '64');
    svg.style.marginBottom = 'var(--sp-3)';
    const raw = value(token.name);
    const nums = raw.match(/-?[\d.]+/g);
    const path = document.createElementNS(NS, 'path');
    if (nums && nums.length === 4) {
      const [x1, y1, x2, y2] = nums.map(Number);
      path.setAttribute('d', `M0,100 C${x1 * 100},${100 - y1 * 100} ${x2 * 100},${100 - y2 * 100} 100,0`);
    }
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--gold)');
    path.setAttribute('stroke-width', '3');
    svg.append(path);
    return svg;
  },
```

- [ ] **Step 2: Add the keyframes the duration preview needs**

An inline style cannot express `@keyframes`, so add this to the `<style>` block in
`Arena - Overview.html`, after the `.ramp-slot` rule:

```css
@keyframes arena-sweep{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion: reduce){
  /* The sweep reports a duration, so it slows rather than stopping — a frozen
     progress indicator reads as a hung process. */
  @keyframes arena-sweep{from{transform:scaleX(.35)}to{transform:scaleX(1)}}
}
```

- [ ] **Step 3: Add the section**

In `main()`, after the density section:

```js
  const effects = await loadTokens('effects.json');
  sections.push(() => renderSection({
    eyebrow: 'Effects',
    title: 'Radius, elevation, focus and motion',
    note: 'Depth is the surface scale, the hairline border and the warm shadow — never a gradient, and never '
      + 'a tinted glow. Easing curves are drawn from the value the browser resolved.',
    tokens: effects,
  }));
```

- [ ] **Step 4: Verify**

Run `bun run demos`, open the page and confirm:
- Radii climb visibly from `--r-xs` to `--r-pill`.
- The three shadows deepen in order.
- The three easing curves differ in shape, and `--ease-emphatic` visibly overshoots the others.
- The duration bars sweep at three visibly different speeds.
- Section reports `21 tokens, all resolving`.
- With OS reduced-motion enabled, the sweeps still move but travel less.

- [ ] **Step 5: Commit**

```bash
git add overview.js "Arena - Overview.html"
git commit -m "feat: render the effects tokens, including easing curves"
```

---

### Task 6: The alias layer, the static sections, and deleting the old page

**Files:**
- Modify: `overview.js`
- Modify: `Arena - Overview.html`
- Delete: `Arena - Overview.dc.html`

**Interfaces:**
- Consumes: `parseDecls` from `scripts/lib/css-decls.mjs` — imported unchanged, its single implementation.
- Produces: nothing consumed later.

- [ ] **Step 1: Render the composition layer**

The 40 aliases in `tokens/colors.css` have no JSON source: they are hand-authored CSS. Read
their names with the same parser the drift gate uses. Add the import at the top of
`overview.js`, beside the existing one:

```js
import { parseDecls } from './scripts/lib/css-decls.mjs';
```

Then add this section in `main()`, after the effects section:

```js
  const colorsCss = await (await fetch('tokens/colors.css')).text();
  const aliasNames = new Set();
  for (const [, decls] of parseDecls(colorsCss)) for (const name of decls.keys()) aliasNames.add(name);
  const aliases = [...aliasNames].map((name) => ({
    name,
    group: 'alias',
    path: [name],
    $type: /picker-invert/.test(name) ? 'number' : 'color',
    $description: undefined,
  }));

  sections.push(() => renderSection({
    eyebrow: 'Composition layer',
    title: 'Aliases and derivations',
    note: 'Hand-authored in tokens/colors.css, not generated: DTCG owns values, this layer owns how values '
      + 'are combined at runtime. It defines no skin value of its own — only references and color-mix '
      + 'compositions, which is why every one of these re-derives when the palette is swapped.',
    tokens: aliases,
  }));
```

- [ ] **Step 2: Add the static closing sections**

In `Arena - Overview.html`, immediately after `<main id="sections"></main>`, add:

```html
  <section class="sec">
    <div class="eyebrow">Foundations</div>
    <div class="h2">Iconography · Phosphor</div>
    <p class="note"><b>Bold</b> weight as the default, to match the bold tone. <b>Fill</b> in crimson for the
    active state. MIT licensed, installed as a package by default rather than pulled from a CDN.</p>
    <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap;font-size:var(--fs-h3);color:var(--text-body)">
      <i class="ph-bold ph-squares-four"></i><i class="ph-bold ph-rocket-launch"></i>
      <i class="ph-bold ph-git-branch"></i><i class="ph-bold ph-gauge"></i>
      <i class="ph-bold ph-shield-check"></i><i class="ph-bold ph-terminal-window"></i>
      <i class="ph-fill ph-squares-four" style="color:var(--crimson)"></i>
      <i class="ph-fill ph-shield-check" style="color:var(--crimson)"></i>
    </div>
  </section>
  <section class="sec">
    <div class="eyebrow">Brand</div>
    <div class="h2">The Rotor</div>
    <p class="note">The signature mark, in the three finishes that ship in <code>assets/</code>. The full
    identity manual is <a href="Dravensoft%20Identity.dc.html" style="color:var(--gold)">Dravensoft Identity</a>.</p>
    <div style="display:flex;gap:var(--sp-6);align-items:center">
      <img src="assets/rotor-crimson.svg" width="64" height="64" alt="Rotor, crimson">
      <img src="assets/rotor-bone.svg" width="64" height="64" alt="Rotor, bone">
      <img src="assets/app-icon.svg" width="64" height="64" alt="App icon">
    </div>
  </section>
  <section class="sec">
    <div class="eyebrow">Components</div>
    <div class="h2">Where the components live</div>
    <p class="note">Components are not part of this page. Each framework layer implements them in its own
    idiom on top of these same tokens, so showing one framework's here would make the root a second,
    drifting implementation — which is exactly what this page replaced.</p>
    <ul class="note">
      <li><code>frameworks/react/components/**/*.card.html</code> — live React demos, one card per group.</li>
      <li><code>frameworks/react/ui_kits/console/index.html</code> — the Delivery Console example application.</li>
      <li><code>frameworks/angular/</code> — the Angular layer and its adoption guide.</li>
      <li><code>guidelines/*.html</code> — specimen cards for embedding.</li>
    </ul>
  </section>
```

- [ ] **Step 3: Delete the old page**

```bash
git rm "Arena - Overview.dc.html"
```

- [ ] **Step 4: Verify nothing still references the old file or the retired classes**

Run:

```bash
grep -rn "Overview.dc.html" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs . | grep -v CHANGELOG.md
grep -c "class=\"btn\|class=\"badge\|class=\"toast\|class=\"menu" "Arena - Overview.html"
```

Expected: the first prints `README.md` hits only (fixed in Task 7) and nothing else; the
second prints `0` — the parallel component implementation is gone. `CHANGELOG.md` is
excluded deliberately: its `3.1.0` entry describes the file as it was named then, and
rewriting shipped history would make it lie.

- [ ] **Step 5: Verify in the browser**

Run `bun run demos`, open the page, and confirm the alias section renders 40 swatches, the
three static sections appear, both toggles still work, and the console is clean.

- [ ] **Step 6: Commit**

```bash
git add overview.js "Arena - Overview.html"
git commit -m "feat!: Overview presents the token language only; drop the parallel component implementation"
```

---

### Task 7: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the normative record.

- [ ] **Step 1: `CLAUDE.md` — the "Viewing things" section**

Replace the `python3 -m http.server 8000   # then browse to the paths below` block with:

```bash
bun run demos   # serves the repo root on :8000 and prints the entry points
```

Then replace the `*.dc.html` bullet with these two:

```markdown
- `Arena - Overview.html` (repo root) — the token language: every token Arena defines, generated at runtime from `tokens/src/*.json` and `tokens/colors.css`. **It shows no components on purpose** — those belong to the framework layers, and a root-level copy of them was a second implementation that drifted. It lives at the root because it loads `styles.css`, `theme.js`, `assets/`, `scripts/lib/` and `tokens/src/` by relative path, and it must be served over HTTP because it fetches its own source.
- `Dravensoft Identity.dc.html` (repo root) — the approved brand manual, and the only remaining `dc-runtime` page. It loads `support.js`, `styles.css` and `assets/` by relative path. Do not move it.
```

- [ ] **Step 2: `CLAUDE.md` — record why the Overview generates itself**

Immediately after the "The layer contract" paragraph in Architecture, add:

```markdown
**The Overview generates itself, and that is the point.** `Arena - Overview.html` reads
names and `$description`s from `tokens/src/*.json` and the alias names from
`tokens/colors.css` (with `scripts/lib/css-decls.mjs`, the same parser the drift gate
uses), but it reads **values** from `getComputedStyle` on the live document. So it
exercises the whole chain — JSON, build, CSS, browser — instead of restating the JSON, and
a token that resolves empty is flagged as stale rather than shown as if it were in effect.
Add a token to `tokens/src/` and it appears there with no edit to the page. The
group-to-preview mapping lives in `scripts/lib/token-preview.mjs` and **never** in the
token source, which stays platform-neutral.
```

- [ ] **Step 3: `README.md` — rewrite the Overview's role in "Audience and scope"**

The second bullet currently frames the Overview as an example application. That is false
now. Replace it with:

```markdown
- **The example application is `frameworks/react/ui_kits/console/`**, not the language itself. It illustrates Arena applied to the **Delivery Console, a product aimed at developers/technical teams**. That's why it includes data density, domain terminology (build, deploy, p95) and keyboard accelerators specific to that audience. `Arena - Overview.html` is the opposite: the framework-agnostic token language, and it deliberately shows no components.
```

- [ ] **Step 4: `README.md` — the manifest entries**

Replace the `*.dc.html` manifest line with:

```markdown
- `Arena - Overview.html` (repo root) — the token language, generated at runtime from `tokens/src/` and `tokens/colors.css`. Serve it: `bun run demos`.
- `Dravensoft Identity.dc.html` (repo root) — the approved identity manual. It sits at the root because it loads `support.js`, `styles.css` and `assets/` by relative path.
```

And extend the `scripts/` manifest line by appending, before the closing period:

```markdown
, `build-tokens.mjs` (generates the four token CSS files from `tokens/src/`), `check-dtcg.mjs` (asserts the DTCG source conforms to 2025.10), `check-tokens-generated.mjs` (asserts the committed CSS matches the source) and `serve.mjs` (`bun run demos`)
```

- [ ] **Step 5: `CHANGELOG.md` — extend the `[Unreleased]` entry**

Add to the existing `### Changed` list:

```markdown
- **The Overview is now the token language, and generates itself.**
  `Arena - Overview.dc.html` became `Arena - Overview.html`: plain HTML driven by one ES
  module, no longer a `dc-runtime` page. It reads token names and descriptions from
  `tokens/src/*.json` and the aliases from `tokens/colors.css`, and reads every **value**
  from `getComputedStyle` on the live document, so it exercises the built CSS instead of
  echoing the source. Adding a token to `tokens/src/` now makes it appear with no edit to
  the page. `Dravensoft Identity.dc.html` is unchanged and remains the only `dc-runtime`
  page. New: `bun run demos` serves the repo root for both.
```

And to `### Removed`:

```markdown
- **The Overview's parallel component implementation.** It defined roughly 130 private CSS
  classes (`.btn`, `.badge`, `.card`, `.alert`, `.menu`, `.toast`, `.spinner`, `.tabs`,
  `.dialog`, `.skel`…) that hand-reimplemented most of the library, contradicting the rule
  that components carry no CSS classes and drifting from the real components — retiring
  `--glow-accent` had to be applied to it by hand. Components now live only in the
  framework layers, and the Overview points at them.
```

- [ ] **Step 6: Verify the prose no longer contradicts the tree**

Run:

```bash
grep -rn "Overview.dc.html" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs . | grep -v CHANGELOG.md
grep -rn "python3 -m http.server" CLAUDE.md README.md
```

Expected: no output from either. (`CHANGELOG.md`'s historical `3.1.0` entry keeps the old
name, deliberately.)

- [ ] **Step 7: Run the whole gate set**

Run:

```bash
bun test scripts/ && \
bun run check:dtcg && \
bun run check:tokens && \
bun scripts/check-ramp.mjs && \
bun scripts/check-text-contrast.mjs && \
bun scripts/check-release.mjs
```

Expected: all exit 0. Nothing in this plan changes a token value, so `check-ramp` and
`check-text-contrast` must be unchanged from before it.

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md README.md CHANGELOG.md
git commit -m "docs: the Overview is the token language, and the demos server"
```

---

## Final verification

```bash
bun test scripts/ && bun run check:dtcg && bun run check:tokens && \
  bun scripts/check-ramp.mjs && bun scripts/check-text-contrast.mjs
bun run demos
```

Then, in a browser, on `http://localhost:8000/Arena%20-%20Overview.html`:

- Every section reports `all resolving`. **Any `not resolving` count is a real defect** — it
  means the committed CSS lacks a token the source declares.
- The theme toggle flips both ways and every value re-reads in the new scope.
- The density toggle changes the seven `dz-*` values in place.
- No component appears anywhere on the page.
- The console is free of errors, and the page body never scrolls horizontally.
- `http://localhost:8000/Dravensoft%20Identity.dc.html` still renders exactly as before —
  it was not touched, and it still uses `support.js`.

Counting check: the DTCG sections should total **98** tokens (27 palette + 25 typography +
25 spacing + 21 effects) and the composition layer **40**, for the 138 unique names the
design records.

## Out of scope

- `Dravensoft Identity.dc.html`, `guidelines/*.html`, and everything under `frameworks/`.
- Any change to token values, to `tokens/src/`, or to the build.
- Cutting a release.
