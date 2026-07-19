# Framework layer token coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution order: 3 of 6.** **Status: NOT EXECUTED** as of 2026-07-18 — none of
`scripts/check-tailwind*.mjs` exists and `frameworks/tailwind/components/` holds
only `Button.manifest.json`.

| # | Plan | Status |
|---|---|---|
| 1 | `2026-07-18-1-token-style-dictionary-migration.md` | **Executed** (v4.0.0) |
| 2 | `2026-07-18-2-overview-token-page.md` | **Executed** (v4.0.0) |
| 3 | `2026-07-18-3-framework-layer-token-coverage.md` | **This plan** — **executed** (unreleased) |
| 4 | `2026-07-18-4-token-geometry-boundary.md` | **Executed** (unreleased) |
| 5a | `2026-07-18-5a-angular-primitive-parity.md` — the 18 Angular primitives + the verification gates | Pending |
| 5b | `2026-07-18-5b-tailwind-manifest-parity.md` — the 20 orphan manifests; depends on 5a's Tasks 1–4 | Pending |
| 6 | `2026-07-18-6-four-package-build-publish.md` | Pending |

> ### Read before executing: Task 3 changes family
>
> **Task 3 still runs, and still adds a 14px control-text token — but it authors it
> as `dz.text`, not as `fs.base`.** Everything else about the task is unchanged.
>
> Task 3's rationale as written — *"React is the design authority, so the Tailwind
> Button must render 14px"* — no longer holds. **`tokens/src/` is the design
> authority; React, Tailwind and Angular are reflections of it** (see plan 4's spec,
> `specs/2026-07-18-token-geometry-boundary-design.md`). Under that rule, adding
> 14px to `fs` would ratify drift: `fs` is the *editorial* scale, semantic and
> closed, and a button label is not prose. The value is right and its family is
> wrong. Chrome text belongs to the control-density family `dz`, which already
> declares control heights, row padding and `cell: 14px` as a font size.
>
> **Do not simply skip the task.** Skipping it breaks this plan's own gates: with no
> token for 14px, `Button.manifest.json` must fall back to `text-[14px]`, which is
> exactly what Task 8's `check-arbitrary-values.mjs` is built to reject. The
> one-word change of family keeps every gate green and lands the token where plan 4
> needs it, so plan 4 populates `dz` further instead of undoing this.
>
> Concretely: author `dz.text` (14px) in `tokens/src/spacing.json` beside the other
> `dz` tokens rather than `fs.base` in `typography.json`; name the theme key for the
> `dz` family; and keep `Button.manifest.json` free of arbitrary values as the task
> already requires. Plan 4 later absorbs `dz.cell` into `dz.text` and adds
> `dz.text-sm`.
>
> The same reversal applies to the two other places this plan asserts React's
> authority — Task 3's own preamble and the *"Touch the React layer"* bullet under
> *What this plan deliberately does not do*. Both are corrected in place.

**Goal:** Expose every Arena token the Tailwind layer should expose, delete the six arbitrary values the gap forced, make the shared-recipe architecture real for `tag`, and machine-check all three so the surface cannot fall behind again.

**Architecture:** `frameworks/tailwind/theme.css` grows from 37 theme keys to 89, each one a `var()` into an existing Arena token, with every Tailwind default namespace cleared first so only Arena's language compiles. Three new gates under `scripts/`, following the repository's existing `check-*.mjs` shape (a pure exported function plus an `import.meta`-guarded `main()`, unit-tested with `node:test`): one compiles the preset together with the component manifests and asserts the whole chain resolves, one asserts every token is either exposed or explicitly excluded, one forbids Tailwind arbitrary values that are raw literals rather than token references.

**Tech Stack:** Bun (test runner and script runtime), Tailwind CSS v4.3.3 (`tailwindcss` + `@tailwindcss/cli` as dev dependencies), Style Dictionary v4 (already present), `node:test` + `node:assert/strict`.

**Source spec:** `docs/superpowers/specs/2026-07-18-framework-layer-token-coverage-design.md`
**Downstream, do not implement here:** `docs/superpowers/specs/2026-07-18-framework-layer-parity-design.md`, `docs/superpowers/specs/2026-07-18-four-package-build-publish-design.md`

## Global Constraints

- **Tailwind is pinned to v4.3.3.** Every measurement in the spec and in this plan was taken against that exact version. Install it as `"tailwindcss": "4.3.3"` and `"@tailwindcss/cli": "4.3.3"` — exact, not `^`.
- **The Tailwind layer introduces no new hex and no new value.** Every `@theme` key's value is `var(--<existing Arena token>)` and nothing else. The one exception in this plan is the single new token in Task 3, which is authored in `tokens/src/` first and only then referenced.
- **Never edit `tokens/palette.css`, `tokens/typography.css`, `tokens/spacing.css`, `tokens/effects.css` by hand.** They are build output. Edit `tokens/src/*.json` and run `bun run build:tokens`.
- **English only** in all code, comments, docs and commit messages.
- **No emoji**, in product or docs.
- **Gates stay runtime-portable.** Scripts must run under both `bun` and `node`. Spawn the Tailwind CLI as `process.execPath` + the `.mjs` bin path, never as a bare shell command and never via `bunx`.
- **Anything landing after the `v4.0.0` tag goes under `## [Unreleased]` in `CHANGELOG.md`.** That heading does not exist yet; Task 9 creates it above `## [4.0.0]`.
- **`frameworks/react/` is byte-unchanged by this work.** `git diff --stat main -- frameworks/react/` must be empty at the end.
- **Do not "fix" the self-referential `--color-base-100: var(--color-base-100);` pattern.** It is correct — see Task 4 and the spec's "What this is not". Task 9 documents it in place.

---

## File Structure

**New:**

| Path | Responsibility |
|---|---|
| `scripts/lib/tailwind-compile.mjs` | Spawns the Tailwind CLI over the preset plus the manifests; extracts class candidates from a manifest; escapes a class into its CSS selector form. Pure helpers plus one process spawn, so all three consumers share exactly one definition of "compile the layer". |
| `scripts/tailwind-compile.test.mjs` | Unit tests for the pure helpers in the above. |
| `scripts/check-tailwind.mjs` | Gate 1 — the preset compiles, every manifest class emits a rule, every theme key resolves to a real Arena token, and Tailwind's default `--spacing` is unreachable. |
| `scripts/check-tailwind.test.mjs` | Unit tests for gate 1's pure assertion functions. |
| `scripts/check-tailwind-coverage.mjs` | Gate 3 — every token in the four generated CSS files is either exposed by the preset or named in the exclusion list, with a reason. |
| `scripts/check-tailwind-coverage.test.mjs` | Unit tests for gate 3's pure diffing function. |
| `scripts/check-arbitrary-values.mjs` | Gate 2 — no Tailwind arbitrary value under `frameworks/` carries a raw literal. |
| `scripts/check-arbitrary-values.test.mjs` | Unit tests for gate 2's scanner. |
| `frameworks/tailwind/components/Tag.manifest.json` | `tag`'s styling as data. The reference shape the parity spec copies 34 times. |

**Modified:**

| Path | Change |
|---|---|
| `package.json` | Two dev dependencies, four `check:*` scripts. |
| `tokens/src/typography.json` | One new token, `fs.base` = 14px; one `$description` reworded. |
| `tokens/typography.css` | Regenerated (never hand-edited). |
| `frameworks/tailwind/theme.css` | 37 keys → 88, plus the namespace-clearing lines and the explanatory comment. |
| `frameworks/tailwind/components/Button.manifest.json` | Five arbitrary values replaced by real utilities. |
| `frameworks/angular/primitives/tag/tag.variants.ts` | Consumes `Tag.manifest.json` instead of defining the recipe inline. |
| `frameworks/tailwind/README.md` | The token surface, the exclusion list, the arbitrary-value rule. |
| `frameworks/angular/README.md` | A primitive's recipe comes from a manifest. |
| `CLAUDE.md` | The Tailwind layer's rule gains its machine-checked form. |
| `CHANGELOG.md` | A new `## [Unreleased]` section. |

**Unchanged, explicitly:** everything under `frameworks/react/`, `tokens/colors.css`, `tokens/palette.*.json`, `tokens/spacing.json`, `tokens/effects.json`, `styles.css`, `support.js`, `theme.js`, `jsx-loader.js`, the plugin manifests.

---

## The token → theme key mapping, settled

This table is the whole of Decision 1 and is the contract Tasks 4 and 5 both implement. After Task 3 adds `--fs-base`, 99 tokens live in the four generated CSS files; 88 are exposed through 89 theme keys (`--sp-1` is reached twice, once as the base unit and once as a named step), and 11 are excluded with a reason.

**`tokens/palette.css` — 27 tokens, 27 keys.** Every one, name unchanged: `--color-base-100`, `--color-base-200`, `--color-base-300`, `--color-base-content`, `--color-primary`, `--color-primary-content`, `--color-secondary`, `--color-secondary-content`, `--color-info`, `--color-info-content`, `--color-success`, `--color-success-content`, `--color-warning`, `--color-warning-content`, `--color-error`, `--color-error-content`, `--color-error-fill`, `--color-neutral`, `--color-neutral-content`, `--color-cat-1` … `--color-cat-8`.

**`tokens/typography.css` — 25 tokens (26 after Task 3), 26 keys.**

| Token | Theme key | Utility |
|---|---|---|
| `--font-display` / `--font-body` / `--font-mono` | `--font-display` / `--font-body` / `--font-mono` | `font-display`, `font-body`, `font-mono` |
| `--fs-display/h1/h2/h3/h4/lg/md/base/sm/xs` | `--text-display/h1/h2/h3/h4/lg/md/base/sm/xs` | `text-h1`, `text-base`, … |
| `--fw-regular/medium/semibold/bold/extrabold/black` | `--font-weight-regular/medium/semibold/bold/extrabold/black` | `font-semibold`, `font-black`, … |
| `--lh-tight/snug/body` | `--leading-tight/snug/body` | `leading-body`, … |
| `--ls-tight/normal/label/wide` | `--tracking-tight/normal/label/wide` | `tracking-label`, … |

**`tokens/spacing.css` — 25 tokens, 22 keys.**

| Token | Theme key | Utility |
|---|---|---|
| `--sp-1` | `--spacing` (the base unit) **and** `--spacing-1` | every numeric utility; `p-1` |
| `--sp-2/3/4/5/6/8/10/12/16/20/24` | `--spacing-2` … `--spacing-24` | `p-4`, `gap-6`, … |
| `--dz-ctl-h` | `--spacing-ctl-h` | `h-ctl-h` |
| `--dz-ctl-h-sm` | `--spacing-ctl-h-sm` | `h-ctl-h-sm` |
| `--dz-ctl-h-lg` | `--spacing-ctl-h-lg` | `h-ctl-h-lg` |
| `--dz-row-py` | `--spacing-row-py` | `py-row-py` |
| `--dz-row-px` | `--spacing-row-px` | `px-row-px` |
| `--dz-stack` | `--spacing-stack` | `gap-stack` |
| `--dz-cell` | `--spacing-cell` | `p-cell` |
| `--gutter` | `--spacing-gutter` | `p-gutter` |
| `--container-max` | `--container-page` | `max-w-page` |

The density keys take the token's suffix **verbatim**, which is why `py-row-py` reads redundantly. That is deliberate: the mapping is mechanical, so Task 5's coverage gate needs no lookup table for this group and a reader can go from utility to token without one.

`--container-max` is the one deliberate rename. Measured: a key named `--container-max` produces `.max-w-max { max-width: max-content; max-width: var(--container-max); }` — it collides with Tailwind's built-in static `max-w-max` and shadows it. `--container-page` avoids the collision; the token is unchanged.

**`tokens/effects.css` — 21 tokens, 14 keys.**

| Token | Theme key | Utility |
|---|---|---|
| `--r-xs/sm/md/lg/xl/pill` | `--radius-xs/sm/md/lg/xl/pill` | `rounded-pill`, … |
| `--shadow-1/2/3` | `--shadow-1/2/3` | `shadow-2`, … |
| `--ease-out/in-out/emphatic` | `--ease-out/in-out/emphatic` | `ease-emphatic`, … |
| `--scrim` | `--color-scrim` | `bg-scrim` |
| `--scrim-blur` | `--blur-scrim` | `blur-scrim` |

**The 11 exclusions, each with the reason the gate stores:**

| Token | Reason |
|---|---|
| `--sp-0` | `p-0` compiles to a literal `0px` in v4 regardless of the theme; a key would be dead weight. |
| `--bp-sm`, `--bp-md`, `--bp-lg` | Read by JS through `getComputedStyle`, never a media query. A `--breakpoint-*` key would invite the pattern Arena rejects. |
| `--dur-fast`, `--dur-mid`, `--dur-slow` | Tailwind v4 has no duration namespace. `--dur-fast` is wired as `--default-transition-duration`; the other two are reached as `duration-[var(--dur-mid)]`, which is a token reference and legal under gate 2. |
| `--bw`, `--bw-strong` | No border-width namespace in v4; border widths are bare numbers. Reached as `border-[length:var(--bw-strong)]`. |
| `--focus-width`, `--focus-offset` | No namespace. The focus ring is composed, not a single utility. |

**Excluded as a category, and therefore never in the inventory:** every custom property declared in `tokens/colors.css`. Those are the ~40 composition-layer aliases (`--crimson`, `--mute`, `--bg`, `--danger-soft`, `--text-strong`…) plus `--picker-invert`. They alias tokens the preset already exposes; giving each colour two utility names would give it two ways to be wrong. `--picker-invert` belongs to a second category — **not expressible as a utility** — which is also what keeps the four charts and `Calendar` out of the Tailwind layer entirely. The gate reads its inventory from the four *generated* files only, so this exclusion is structural rather than a list.

**Clearing Tailwind's defaults.** Each namespace Arena populates is reset with `--<ns>-*: initial;` before Arena's keys. Verified against v4.3.3: with `--color-*: initial`, `bg-red-500` emits no rule at all; with `--text-*: initial`, `text-2xl` emits nothing; with `--container-*: initial`, `max-w-md` emits nothing. This extends the spec's §1b finding — Tailwind's own defaults resolving silently underneath Arena's — from `--spacing` to every namespace. Static utilities that carry no theme value (`border`, `ring`, `flex`, `p-0`) are unaffected; measured.

---

## Task 1: The shared Tailwind compile helper

**Files:**
- Modify: `package.json`
- Create: `scripts/lib/tailwind-compile.mjs`
- Test: `scripts/tailwind-compile.test.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, and Tasks 2 and 8 rely on these exact names:
  - `manifestClasses(manifest: object): string[]` — every whitespace-separated class candidate found in a manifest's `slots` and `variants`, deduped, sorted.
  - `escapeClass(cls: string): string` — the class rendered as it appears in Tailwind's compiled selector, without the leading dot.
  - `compileLayer(opts?: { root?: string }): { css: string, manifests: Map<string, object> }` — spawns the CLI over `frameworks/tailwind/theme.css` with every `frameworks/tailwind/components/*.manifest.json` registered as a content source, and returns the compiled CSS plus the parsed manifests keyed by file name.

- [ ] **Step 1: Add the dev dependencies**

Run:

```bash
bun add -d --exact tailwindcss@4.3.3 @tailwindcss/cli@4.3.3
```

Expected: `package.json` gains
```json
"devDependencies": {
  "@tailwindcss/cli": "4.3.3",
  "style-dictionary": "^4",
  "tailwindcss": "4.3.3"
}
```
and `node_modules/.bin/tailwindcss` exists as a symlink to `../@tailwindcss/cli/dist/index.mjs`.

- [ ] **Step 2: Write the failing test**

Create `scripts/tailwind-compile.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { manifestClasses, escapeClass } from './lib/tailwind-compile.mjs';

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
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `bun test scripts/tailwind-compile.test.mjs`
Expected: FAIL — `Cannot find module './lib/tailwind-compile.mjs'`.

- [ ] **Step 4: Implement the helper**

Create `scripts/lib/tailwind-compile.mjs`:

```js
/* Compiles Arena's Tailwind layer the way a consumer would, and takes apart a
 * component manifest. Shared by check-tailwind.mjs and any gate that needs the
 * real emitted CSS rather than a restatement of it.
 *
 * The CLI is spawned as `process.execPath <bin>.mjs` rather than through a
 * shell or a package runner, so the gate behaves identically under bun and
 * node. The entry stylesheet is fed on stdin with absolute paths, so nothing
 * temporary is written into the repository. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');

/** Every class candidate a manifest declares, deduped and sorted.
 *  @param {object} manifest @returns {string[]} */
export function manifestClasses(manifest) {
  const out = new Set();
  const eat = (v) => {
    if (typeof v === 'string') for (const c of v.split(/\s+/)) { if (c) out.add(c); }
    else if (v && typeof v === 'object') for (const child of Object.values(v)) eat(child);
  };
  eat(manifest.slots);
  eat(manifest.variants);
  return [...out].sort();
}

/** A class as it appears in Tailwind's compiled selector, minus the leading dot.
 *  Tailwind escapes every character that is not [A-Za-z0-9_-]. */
export function escapeClass(cls) {
  return cls.replace(/[^A-Za-z0-9_-]/g, (ch) => `\\${ch}`);
}

/** Compile the preset together with every component manifest as content.
 *  @param {{root?: string}} [opts]
 *  @returns {{css: string, manifests: Map<string, object>}} */
export function compileLayer(opts = {}) {
  const root = opts.root ?? repoRoot;
  const preset = join(root, 'frameworks/tailwind/theme.css');
  const components = join(root, 'frameworks/tailwind/components');
  const bin = join(root, 'node_modules/.bin/tailwindcss');

  const manifests = new Map();
  for (const f of readdirSync(components).filter((f) => f.endsWith('.manifest.json')).sort())
    manifests.set(f, JSON.parse(readFileSync(join(components, f), 'utf8')));

  const entry = `@import '${preset}';\n@source '${components}/*.manifest.json';\n`;
  const dir = mkdtempSync(join(tmpdir(), 'arena-tw-'));
  const out = join(dir, 'out.css');
  try {
    const r = spawnSync(process.execPath, [bin, '-i', '-', '-o', out], { input: entry, encoding: 'utf8' });
    if (r.status !== 0)
      throw new Error(`tailwindcss exited ${r.status}\n${r.stderr || r.stdout}`);
    return { css: readFileSync(out, 'utf8'), manifests };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `bun test scripts/tailwind-compile.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 6: Smoke-test the spawn against the tree as it stands**

Run:

```bash
bun -e "import('./scripts/lib/tailwind-compile.mjs').then(m => { const { css, manifests } = m.compileLayer(); console.log('manifests:', [...manifests.keys()].join(', ')); console.log('bytes:', css.length); console.log('has text-[13px]:', css.includes('text-\\\\[13px\\\\]')); })"
```

Expected: `manifests: Button.manifest.json`, a byte count in the low thousands, and `has text-[13px]: true` — the JIT scan really is reaching the manifests. If the byte count is under 500 the `@source` is not matching and the rest of this plan will report false passes; stop and fix it here.

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock scripts/lib/tailwind-compile.mjs scripts/tailwind-compile.test.mjs
git commit -m "build(tailwind): compile Arena's Tailwind layer from a script

Adds tailwindcss 4.3.3 as a dev dependency and a shared helper that spawns
the CLI over the preset with the component manifests registered as content.
Compiling the preset alone proves nothing under a JIT compiler."
```

---

## Task 2: Gate 1 — the layer compiles and resolves

**Files:**
- Create: `scripts/check-tailwind.mjs`
- Test: `scripts/check-tailwind.test.mjs`

**Interfaces:**
- Consumes: `compileLayer`, `manifestClasses`, `escapeClass` from `scripts/lib/tailwind-compile.mjs`.
- Produces, relied on by its own test only:
  - `themeKeys(css: string): Map<string, string>` — the theme keys the compiled output emits into `:root`, mapped to their emitted values.
  - `checkCompiled(css: string, manifests: Map<string, object>, tokens: Set<string>): string[]` — the violations, as human-readable strings. Empty means pass.

**This gate passes against today's tree, and that is not a bug in it.** Gate 1 asks "does what the manifests declare actually resolve?" — and today it does: an arbitrary value like `text-[13px]` compiles to a real rule, and the current preset's 37 keys all point at tokens that exist. What is wrong today is *absence* (gate 3's question) and *raw literals* (gate 2's question). Gate 1's job is to stop the layer regressing once it is complete, and above all to hold up manifests with no consumer — the parity spec ships twenty of those, and nothing else will exercise them. So its failure modes are proved by the unit tests below rather than by the tree, and Step 5 expects green.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-tailwind.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { themeKeys, checkCompiled } from './check-tailwind.mjs';

const TOKENS = new Set(['color-primary', 'sp-1', 'sp-4', 'r-sm']);

const compiled = (root, utilities) =>
  `@layer theme {\n  :root, :host {\n${root}\n  }\n}\n@layer utilities {\n${utilities}\n}\n`;

test('reads the emitted theme keys and their values', () => {
  const css = compiled('    --color-primary: var(--color-primary);\n    --spacing: var(--sp-1);', '');
  assert.deepEqual(
    [...themeKeys(css).entries()],
    [['color-primary', 'var(--color-primary)'], ['spacing', 'var(--sp-1)']],
  );
});

test('passes a compiled layer whose classes all emitted and whose keys all resolve', () => {
  const css = compiled(
    '    --color-primary: var(--color-primary);\n    --spacing-4: var(--sp-4);',
    '  .bg-primary { background-color: var(--color-primary); }\n  .p-4 { padding: var(--spacing-4); }',
  );
  const manifests = new Map([['X.manifest.json', { slots: { root: 'bg-primary p-4' } }]]);
  assert.deepEqual(checkCompiled(css, manifests, TOKENS), []);
});

test('fails a manifest class that emitted no rule', () => {
  const css = compiled('    --color-primary: var(--color-primary);', '  .bg-primary { background-color: var(--color-primary); }');
  const manifests = new Map([['X.manifest.json', { slots: { root: 'bg-primary bg-nonsense' } }]]);
  const errs = checkCompiled(css, manifests, TOKENS);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /X\.manifest\.json.*bg-nonsense.*no rule/);
});

test('fails a theme key that does not resolve to an Arena token', () => {
  const css = compiled('    --color-primary: #b52a20;', '  .bg-primary { background-color: var(--color-primary); }');
  const manifests = new Map([['X.manifest.json', { slots: { root: 'bg-primary' } }]]);
  assert.match(checkCompiled(css, manifests, TOKENS).join('\n'), /--color-primary.*not a var\(\) into an Arena token/);
});

test('fails a theme key pointing at a token that does not exist', () => {
  const css = compiled('    --spacing-9: var(--sp-9);', '');
  assert.match(checkCompiled(css, new Map(), TOKENS).join('\n'), /--sp-9.*no such Arena token/);
});

test("fails when Tailwind's default --spacing is reachable", () => {
  const css = compiled('    --spacing: 0.25rem;', '  .p-7 { padding: calc(var(--spacing) * 7); }');
  assert.match(checkCompiled(css, new Map(), TOKENS).join('\n'), /0\.25rem/);
});

test('escaped selectors count as emitted', () => {
  const css = compiled(
    '    --color-primary: var(--color-primary);',
    '  @media (hover: hover) { .hover\\:bg-primary:hover { background-color: var(--color-primary); } }',
  );
  const manifests = new Map([['X.manifest.json', { slots: { root: 'hover:bg-primary' } }]]);
  assert.deepEqual(checkCompiled(css, manifests, TOKENS), []);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/check-tailwind.test.mjs`
Expected: FAIL — `Cannot find module './check-tailwind.mjs'`.

- [ ] **Step 3: Implement the gate**

Create `scripts/check-tailwind.mjs`:

```js
/* Compiles Arena's Tailwind layer and asserts the whole chain resolves —
 * manifest class -> emitted rule -> theme key -> Arena token. Compiling is not
 * the assertion; a layer that compiles and silently resolves to Tailwind's own
 * defaults is exactly the failure this exists to catch.
 *
 *   bun scripts/check-tailwind.mjs      -> exit 0 if the layer resolves, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseDecls } from './lib/css-decls.mjs';
import { compileLayer, manifestClasses, escapeClass, repoRoot } from './lib/tailwind-compile.mjs';

const GENERATED = ['palette.css', 'typography.css', 'spacing.css', 'effects.css'];

/** Every Arena token name (without `--`) declared in the four generated files. */
export function arenaTokens(root = repoRoot) {
  const names = new Set();
  for (const f of GENERATED)
    for (const decls of parseDecls(readFileSync(join(root, 'tokens', f), 'utf8')).values())
      for (const name of decls.keys()) names.add(name);
  return names;
}

/** The theme keys the compiled output emits into :root, mapped to their values.
 *  @param {string} css @returns {Map<string,string>} */
export function themeKeys(css) {
  const out = new Map();
  const m = css.match(/@layer theme\s*\{\s*:root[^{]*\{([\s\S]*?)\n\s*\}/);
  if (!m) return out;
  for (const line of m[1].split(';')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const name = line.slice(0, i).trim();
    if (!name.startsWith('--')) continue;
    out.set(name.slice(2), line.slice(i + 1).trim());
  }
  return out;
}

/** @param {string} css @param {Map<string,object>} manifests @param {Set<string>} tokens
 *  @returns {string[]} violations */
export function checkCompiled(css, manifests, tokens) {
  const errs = [];

  // Every class a manifest declares must have produced a rule. This is what
  // holds up a manifest with no consumer anywhere in the repo.
  for (const [file, manifest] of manifests)
    for (const cls of manifestClasses(manifest))
      if (!css.includes(`.${escapeClass(cls)}`))
        errs.push(`${file}: \`${cls}\` produced no rule — the utility does not exist`);

  // Every theme key must be a var() into a token that really exists.
  for (const [key, value] of themeKeys(css)) {
    if (key.startsWith('tw-') || key.startsWith('default-')) continue;
    const ref = value.match(/^var\(--([a-z0-9-]+)\)$/);
    if (!ref) { errs.push(`--${key}: not a var() into an Arena token — emits \`${value}\``); continue; }
    if (!tokens.has(ref[1])) errs.push(`--${key}: no such Arena token --${ref[1]}`);
  }

  // Tailwind's default --spacing must be unreachable (see the spec, 1b).
  if (css.includes('0.25rem'))
    errs.push("the compiled layer contains `0.25rem` — Tailwind's default --spacing is reachable; set `--spacing: var(--sp-1)`");

  return errs;
}

function main() {
  const { css, manifests } = compileLayer();
  const errs = checkCompiled(css, manifests, arenaTokens());
  if (errs.length) {
    console.error(`check-tailwind: ${errs.length} violation(s) in the compiled Tailwind layer\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  const classes = [...manifests.values()].reduce((n, m) => n + manifestClasses(m).length, 0);
  console.log(`check-tailwind: ${manifests.size} manifest(s), ${classes} class(es), ${themeKeys(css).size} theme key(s) — all resolve to Arena tokens`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `bun test scripts/check-tailwind.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Run the gate against the real tree**

Run: `bun scripts/check-tailwind.mjs`
Expected: **exit 0**, a line reading `check-tailwind: 1 manifest(s), N class(es), M theme key(s) — all resolve to Arena tokens`. Do not expect `M` to equal the number of keys the preset declares: v4 is JIT and emits only the theme variables the compiled utilities actually reach, so `M` tracks what the manifests use and grows as manifests are added. If it exits 1, something in the current preset or manifest is genuinely broken and this plan's audit premise is wrong — stop and investigate before continuing.

- [ ] **Step 6: Prove the gate can fail against the real tree**

The unit tests cover each failure mode in isolation; this confirms the wiring.

```bash
bun -e "
const fs = require('node:fs');
const p = 'frameworks/tailwind/components/Button.manifest.json';
const orig = fs.readFileSync(p, 'utf8');
fs.writeFileSync(p, orig.replace('inline-flex', 'inline-flex bg-nonsense-500'));
" && bun scripts/check-tailwind.mjs; echo "exit=$?"; git checkout frameworks/tailwind/components/Button.manifest.json
```

Expected: `Button.manifest.json: \`bg-nonsense-500\` produced no rule — the utility does not exist` and `exit=1`, then a clean `git status`.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-tailwind.mjs scripts/check-tailwind.test.mjs
git commit -m "test(tailwind): gate that the compiled layer resolves to Arena tokens

Green today: an arbitrary value compiles to a real rule and the 37 keys the
preset defines all point at tokens that exist. What this holds up is the
future — a manifest class that stops resolving, a theme key that drifts off
a token, and Tailwind's 0.25rem default becoming reachable again."
```

---

## Task 3: The one new token — `--fs-base`

Arena's editorial type scale runs 13px (`--fs-sm`) then 15px (`--fs-md`), and React's `Button` uses 14px for its `md` size (`frameworks/react/components/forms/Button.jsx:28`). 14px has no token, so the Tailwind Button cannot be expressed without one. This task adds it. It is the single token-layer change in this plan and it was signed off explicitly.

**Corrected by plan 4 — author it as `dz.text`, not `fs.base`.** A button label is chrome, not prose, and chrome text belongs to the control-density family `dz` (which already declares `cell: 14px` as a font size) rather than to `fs`, which is semantic and closed. The original rationale here read *"React is the design authority, so the Tailwind Button must render 14px"*; that is reversed — **`tokens/src/` is the design authority and React is a reflection of it** — and under the new rule adding 14px to `fs` would ratify drift rather than repair it. See the banner at the top of this plan and `specs/2026-07-18-token-geometry-boundary-design.md`.

`--fs-md` currently carries the `$description` "base body". With a token literally named `base` alongside it, that description becomes actively misleading, so it is reworded in the same edit.

**Files:**
- Modify: `tokens/src/typography.json`
- Modify (regenerated, never by hand): `tokens/typography.css`

**Interfaces:**
- Produces: the CSS custom property `--fs-base` (14px), which Task 4 exposes as the theme key `--text-base` and Task 7 consumes as `text-base`.

- [ ] **Step 1: Add the token to the DTCG source**

In `tokens/src/typography.json`, inside the `fs` group, place `base` between `md` and `sm` so the file stays in descending size order, and reword `md`:

```json
    "md": { "$value": { "value": 15, "unit": "px" }, "$description": "body copy" },
    "base": { "$value": { "value": 14, "unit": "px" }, "$description": "control text — buttons, inputs, table cells" },
    "sm": { "$value": { "value": 13, "unit": "px" } },
```

- [ ] **Step 2: Rebuild and verify the generated CSS**

Run:

```bash
bun run build:tokens && grep -n "fs-md\|fs-base\|fs-sm" tokens/typography.css
```

Expected:
```
  --fs-md:15px; /* body copy */
  --fs-base:14px; /* control text — buttons, inputs, table cells */
  --fs-sm:13px;
```

- [ ] **Step 3: Run the token gates**

Run:

```bash
bun scripts/check-dtcg.mjs && bun scripts/check-tokens-generated.mjs && bun scripts/check-ramp.mjs
```

Expected: all three exit 0. `check-tokens-generated` is the one that matters here — it proves the committed CSS matches the source, i.e. that Step 2's rebuild was actually committed.

- [ ] **Step 4: Confirm the Overview page picks it up with no edit**

Run `bun run demos`, open `http://localhost:8000/Arena%20-%20Overview.html`, and find `--fs-base` in the type section showing `14px`. This is the page generating itself from `tokens/src/`; if the token is missing there, the build did not run.

- [ ] **Step 5: Commit**

```bash
git add tokens/src/typography.json tokens/typography.css
git commit -m "feat(tokens): add --fs-base, the 14px control text size

Arena's scale ran 13px to 15px with nothing between, while React's Button
has used 14px for its md size all along. Naming it is what lets the Tailwind
layer express Button without an arbitrary value. --fs-md's description moves
from 'base body' to 'body copy' so the two names stop competing."
```

---

## Task 4: Complete the preset

**Files:**
- Modify: `frameworks/tailwind/theme.css`

**Interfaces:**
- Consumes: `--fs-base` from Task 3.
- Produces: the 89 theme keys the mapping table above specifies, which Tasks 5, 7 and 8 all depend on.

- [ ] **Step 1: Record the starting surface**

Run:

```bash
bun scripts/check-tailwind.mjs
grep -E '^\s+--[a-z0-9-]+: var\(--' frameworks/tailwind/theme.css | grep -vc -- '--default-'
```

Expected: gate 1 exits 0, and the count prints **35** — the token-mapped keys the preset declares today, the 37 of the spec's audit minus the two `--default-*` wirings, which map a Tailwind default rather than open a utility surface. It must print **89** at the end of this task.

Gate 1's own `theme key(s)` figure is a different number and not the one to track: v4 is JIT and emits only the theme variables the compiled utilities actually reach, so it tracks what the manifests use.

- [ ] **Step 2: Rewrite the preset**

Replace the entire contents of `frameworks/tailwind/theme.css` with:

```css
/* frameworks/tailwind/theme.css
   Arena's Tailwind v4 preset. Consume AFTER Arena's tokens are in scope
   (import ../../styles.css, or the individual tokens/*.css, first).
   Every value here is a var() into an existing Arena token — no literals,
   no new hex, no new value. Re-skinning Arena (swap tokens/palette.css)
   re-skins these utilities for free.

   Two things below look wrong and are not.

   1. The declarations are self-referential: `--color-base-100:
      var(--color-base-100)`. Read alone that is a cycle, and a custom
      property in a cycle computes to nothing. In context it is correct:
      Tailwind emits @theme inside @layer theme, Arena's tokens are loaded
      unlayered, and an unlayered declaration beats a layered one — so
      Arena's value wins and the self-reference never resolves against
      itself. Measured: --color-base-100 -> #141010, .bg-base-100 ->
      rgb(20, 16, 16). `@theme inline` produces byte-identical output here
      because the referenced variable shares the name. Do not "fix" this.

   2. Each namespace is cleared with `--<ns>-*: initial` before Arena's keys.
      Without it Tailwind's own defaults stay reachable underneath ours —
      bg-red-500, text-2xl, rounded-2xl all compile to values Arena never
      defined and a re-skin never touches. Clearing is what makes the
      utility surface exactly Arena's language and nothing else.

   scripts/check-tailwind.mjs compiles this file with the component manifests
   as content and asserts every key still resolves to a real Arena token;
   scripts/check-tailwind-coverage.mjs asserts no token is missing from it. */
@import 'tailwindcss';

@theme {
  /* ---- colour → tokens/palette.css ------------------------------------- */
  --color-*: initial;

  /* surfaces + base content */
  --color-base-100: var(--color-base-100);
  --color-base-200: var(--color-base-200);
  --color-base-300: var(--color-base-300);
  --color-base-content: var(--color-base-content);

  /* brand voice */
  --color-primary: var(--color-primary);
  --color-primary-content: var(--color-primary-content);
  --color-secondary: var(--color-secondary);
  --color-secondary-content: var(--color-secondary-content);

  /* status (meaning, never series) — the -content half is the other half of
     the contract a skin defines, so it ships with it */
  --color-info: var(--color-info);
  --color-info-content: var(--color-info-content);
  --color-success: var(--color-success);
  --color-success-content: var(--color-success-content);
  --color-warning: var(--color-warning);
  --color-warning-content: var(--color-warning-content);
  --color-error: var(--color-error);
  --color-error-content: var(--color-error-content);

  /* the system's only filled danger surface — ConfirmDialog's final step */
  --color-error-fill: var(--color-error-fill);

  --color-neutral: var(--color-neutral);
  --color-neutral-content: var(--color-neutral-content);

  /* categorical ramp (identity, in order, never cycled) */
  --color-cat-1: var(--color-cat-1);
  --color-cat-2: var(--color-cat-2);
  --color-cat-3: var(--color-cat-3);
  --color-cat-4: var(--color-cat-4);
  --color-cat-5: var(--color-cat-5);
  --color-cat-6: var(--color-cat-6);
  --color-cat-7: var(--color-cat-7);
  --color-cat-8: var(--color-cat-8);

  /* overlay scrim → tokens/effects.css */
  --color-scrim: var(--scrim);

  /* ---- type → tokens/typography.css ------------------------------------ */
  --font-*: initial;
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);

  --text-*: initial;
  --text-display: var(--fs-display);
  --text-h1: var(--fs-h1);
  --text-h2: var(--fs-h2);
  --text-h3: var(--fs-h3);
  --text-h4: var(--fs-h4);
  --text-lg: var(--fs-lg);
  --text-md: var(--fs-md);
  --text-base: var(--fs-base);
  --text-sm: var(--fs-sm);
  --text-xs: var(--fs-xs);

  --font-weight-*: initial;
  --font-weight-regular: var(--fw-regular);
  --font-weight-medium: var(--fw-medium);
  --font-weight-semibold: var(--fw-semibold);
  --font-weight-bold: var(--fw-bold);
  --font-weight-extrabold: var(--fw-extrabold);
  --font-weight-black: var(--fw-black);

  --leading-*: initial;
  --leading-tight: var(--lh-tight);
  --leading-snug: var(--lh-snug);
  --leading-body: var(--lh-body);

  --tracking-*: initial;
  --tracking-tight: var(--ls-tight);
  --tracking-normal: var(--ls-normal);
  --tracking-label: var(--ls-label);
  --tracking-wide: var(--ls-wide);

  /* ---- spacing → tokens/spacing.css ------------------------------------ */
  /* The base unit, and the reason every numeric utility lands on Arena's
     grid. Without it v4 emits an unnamed step as calc(var(--spacing) * N)
     against its own 0.25rem default — a value that coincides with Arena's
     only while the root font size is 16px. The named steps below are kept as
     well: a named key wins for that N, so if a spacing token ever stops being
     a clean multiple of 4px the named step keeps tracking the token instead
     of drifting onto the grid. --sp-0 needs no key; p-0 compiles to 0px. */
  --spacing: var(--sp-1);
  --spacing-1: var(--sp-1);
  --spacing-2: var(--sp-2);
  --spacing-3: var(--sp-3);
  --spacing-4: var(--sp-4);
  --spacing-5: var(--sp-5);
  --spacing-6: var(--sp-6);
  --spacing-8: var(--sp-8);
  --spacing-10: var(--sp-10);
  --spacing-12: var(--sp-12);
  --spacing-16: var(--sp-16);
  --spacing-20: var(--sp-20);
  --spacing-24: var(--sp-24);

  /* density → tokens/spacing.css, so .arena-compact re-densifies utilities
     the same way it re-densifies components. The key is the token's suffix
     verbatim, which makes py-row-py read redundantly and makes the
     utility-to-token mapping mechanical. */
  --spacing-ctl-h: var(--dz-ctl-h);
  --spacing-ctl-h-sm: var(--dz-ctl-h-sm);
  --spacing-ctl-h-lg: var(--dz-ctl-h-lg);
  --spacing-row-py: var(--dz-row-py);
  --spacing-row-px: var(--dz-row-px);
  --spacing-stack: var(--dz-stack);
  --spacing-cell: var(--dz-cell);

  --spacing-gutter: var(--gutter);

  /* layout width. Named `page`, not `max`: a --container-max key collides
     with Tailwind's built-in static max-w-max and shadows it. */
  --container-*: initial;
  --container-page: var(--container-max);

  /* ---- effects → tokens/effects.css ------------------------------------ */
  --radius-*: initial;
  --radius-xs: var(--r-xs);
  --radius-sm: var(--r-sm);
  --radius-md: var(--r-md);
  --radius-lg: var(--r-lg);
  --radius-xl: var(--r-xl);
  --radius-pill: var(--r-pill);

  --shadow-*: initial;
  --shadow-1: var(--shadow-1);
  --shadow-2: var(--shadow-2);
  --shadow-3: var(--shadow-3);

  --ease-*: initial;
  --ease-out: var(--ease-out);
  --ease-in-out: var(--ease-in-out);
  --ease-emphatic: var(--ease-emphatic);

  --blur-*: initial;
  --blur-scrim: var(--scrim-blur);

  /* ---- defaults the preflight and the bare utilities read --------------- */
  /* --default-mono-font-family is derived from --font-mono automatically;
     --default-font-family derives from --font-sans, which we cleared, so it
     is set here or the document falls back to Tailwind's own sans stack. */
  --default-font-family: var(--font-body);
  --default-transition-duration: var(--dur-fast);
  --default-transition-timing-function: var(--ease-out);
}
```

- [ ] **Step 3: Run the gate**

Run: `bun scripts/check-tailwind.mjs`
Expected: **exit 0**. Every Button class still emits — the arbitrary values compile as they always did; Task 7 removes them. If the gate reports a theme-key violation, the preset references a token name that does not exist: fix the preset, never the gate. If it reports a Button class producing no rule, a namespace was cleared without repopulating the key that class needs (the likely culprits are `rounded-sm` and `bg-primary`).

- [ ] **Step 4: Verify the defaults really are gone**

Run:

```bash
printf "@import '$PWD/frameworks/tailwind/theme.css';\n@source inline(\"{bg-red-500,text-2xl,rounded-2xl,shadow-md,max-w-md,p-7,bg-primary,text-h1,rounded-pill,h-ctl-h}\");\n" \
  | bun node_modules/.bin/tailwindcss -i - -o /tmp/arena-leak.css \
  && for c in bg-red-500 text-2xl rounded-2xl shadow-md max-w-md; do \
       grep -q "^\s*\.$c " /tmp/arena-leak.css && echo "$c -> LEAK" || echo "$c -> absent"; done \
  && for c in bg-primary text-h1 rounded-pill h-ctl-h; do \
       grep -q "^\s*\.$c " /tmp/arena-leak.css && echo "$c -> present" || echo "$c -> MISSING"; done \
  && grep -q "0.25rem" /tmp/arena-leak.css && echo "0.25rem -> LEAK" || echo "0.25rem -> absent"
```

Expected: the five Tailwind defaults all `absent`, the four Arena utilities all `present`, and `0.25rem -> absent`. This is the assertion the `@source inline` is for — under a JIT compiler a class that is never mentioned emits nothing whether or not the namespace was cleared, so the leak has to be provoked to be measured.

- [ ] **Step 5: Verify in a browser that the chain still resolves end to end**

Run `bun run demos`, then in the browser console on any page that loads `styles.css`:

```js
getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim()
```

Expected: `#141010`. This is the unlayered-beats-layered mechanism the header comment describes; if it comes back empty the self-reference has become a real cycle and something changed about how the preset is loaded.

- [ ] **Step 6: Commit**

```bash
git add frameworks/tailwind/theme.css
git commit -m "feat(tailwind): expose Arena's whole token surface

37 theme keys become 89: the type scale, the six weights, line height and
tracking, the density system, the six missing spacing steps, the radius
scale, the four missing -content pairs, --color-error-fill, the scrim.

Sets --spacing to --sp-1 so unnamed steps land on Arena's 4px grid instead
of Tailwind's 0.25rem default, and clears each namespace before populating
it so Tailwind's own palette and scales stop resolving underneath Arena's."
```

---

## Task 5: Gate 3 — coverage is declared

The gate the spec calls the one that matters most: it converts "we completed the surface once" into "the surface cannot fall behind again".

**Files:**
- Create: `scripts/check-tailwind-coverage.mjs`
- Test: `scripts/check-tailwind-coverage.test.mjs`

**Interfaces:**
- Consumes: `parseDecls` from `scripts/lib/css-decls.mjs`; `arenaTokens` from `scripts/check-tailwind.mjs`.
- Produces:
  - `EXCLUDED: Map<string, string>` — token name (without `--`) to the reason it is not exposed.
  - `presetTokens(css: string): Set<string>` — the Arena token names the preset's `@theme` block references.
  - `checkCoverage(tokens: Set<string>, exposed: Set<string>, excluded: Map<string,string>): string[]` — violations.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-tailwind-coverage.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { presetTokens, checkCoverage } from './check-tailwind-coverage.mjs';

test('reads the Arena tokens a preset references', () => {
  const css = `@import 'tailwindcss';\n@theme {\n  --color-*: initial;\n  --color-primary: var(--color-primary);\n  --spacing: var(--sp-1);\n  --text-h1: var(--fs-h1);\n}\n`;
  assert.deepEqual([...presetTokens(css)].sort(), ['color-primary', 'fs-h1', 'sp-1']);
});

test('a --default-* wiring does not count as exposing the token', () => {
  const css = `@theme {\n  --ease-out: var(--ease-out);\n  --default-transition-duration: var(--dur-fast);\n}\n`;
  assert.deepEqual([...presetTokens(css)], ['ease-out']);
});

test('passes when every token is exposed or excluded', () => {
  const tokens = new Set(['color-primary', 'sp-1', 'bp-sm']);
  const exposed = new Set(['color-primary', 'sp-1']);
  const excluded = new Map([['bp-sm', 'read by JS, never a media query']]);
  assert.deepEqual(checkCoverage(tokens, exposed, excluded), []);
});

test('fails a token that is neither exposed nor excluded', () => {
  const errs = checkCoverage(new Set(['fs-h1']), new Set(), new Map());
  assert.equal(errs.length, 1);
  assert.match(errs[0], /--fs-h1 reaches no Tailwind utility/);
});

test('fails an exclusion for a token that is also exposed', () => {
  const errs = checkCoverage(new Set(['sp-1']), new Set(['sp-1']), new Map([['sp-1', 'stale']]));
  assert.match(errs.join('\n'), /--sp-1 is both exposed and excluded/);
});

test('fails an exclusion naming a token that no longer exists', () => {
  const errs = checkCoverage(new Set(['sp-1']), new Set(['sp-1']), new Map([['sp-99', 'gone']]));
  assert.match(errs.join('\n'), /--sp-99 is excluded but no such token exists/);
});

test('fails a preset that references a token that does not exist', () => {
  const errs = checkCoverage(new Set(['sp-1']), new Set(['sp-1', 'sp-7']), new Map());
  assert.match(errs.join('\n'), /--sp-7.*no such token/);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/check-tailwind-coverage.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the gate**

Create `scripts/check-tailwind-coverage.mjs`:

```js
/* Asserts every Arena token either reaches a Tailwind utility or is excluded
 * on the record. A token added to tokens/src/ that nobody wires into the
 * preset fails here rather than quietly never reaching the Tailwind layer.
 *
 * The inventory is the four GENERATED files only. tokens/colors.css is
 * excluded as a category: those ~40 composition-layer aliases (--crimson,
 * --mute, --danger-soft, --text-strong…) alias tokens the preset already
 * exposes, and giving every colour two utility names would give it two ways
 * to be wrong. --picker-invert, also in that file, belongs to a second
 * category — not expressible as a utility — which is what keeps the four
 * charts and Calendar out of this layer too.
 *
 *   bun scripts/check-tailwind-coverage.mjs   -> exit 0 if declared, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { arenaTokens } from './check-tailwind.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';

/** Tokens deliberately not exposed, and why. Adding an entry here is a design
 *  decision; the gate only asserts the entry is honest. */
export const EXCLUDED = new Map([
  ['sp-0', 'p-0 compiles to a literal 0px in v4 regardless of the theme'],
  ['bp-sm', 'read by JS through getComputedStyle, never a media query'],
  ['bp-md', 'read by JS through getComputedStyle, never a media query'],
  ['bp-lg', 'read by JS through getComputedStyle, never a media query'],
  ['dur-fast', 'v4 has no duration namespace; wired as --default-transition-duration'],
  ['dur-mid', 'v4 has no duration namespace; reached as duration-[var(--dur-mid)]'],
  ['dur-slow', 'v4 has no duration namespace; reached as duration-[var(--dur-slow)]'],
  ['bw', 'v4 has no border-width namespace; reached as border-[length:var(--bw)]'],
  ['bw-strong', 'v4 has no border-width namespace; reached as border-[length:var(--bw-strong)]'],
  ['focus-width', 'no namespace — the focus ring is composed, not a single utility'],
  ['focus-offset', 'no namespace — the focus ring is composed, not a single utility'],
]);

/** The Arena token names a preset's @theme block references.
 *  @param {string} css @returns {Set<string>} */
export function presetTokens(css) {
  const out = new Set();
  const m = css.match(/@theme\s*\{([\s\S]*)\}/);
  if (!m) return out;
  for (const line of m[1].split(';')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    // --default-* wires a Tailwind default to a token; it is not a utility
    // surface, so it does not count as exposing that token. --dur-fast is
    // reached that way and stays in EXCLUDED for exactly that reason.
    if (!key.startsWith('--') || key.startsWith('--default-')) continue;
    const ref = line.slice(i + 1).match(/^\s*var\(--([a-z0-9-]+)\)\s*$/);
    if (ref) out.add(ref[1]);
  }
  return out;
}

/** @param {Set<string>} tokens @param {Set<string>} exposed @param {Map<string,string>} excluded
 *  @returns {string[]} violations */
export function checkCoverage(tokens, exposed, excluded) {
  const errs = [];
  for (const t of [...tokens].sort()) {
    const isExposed = exposed.has(t);
    const isExcluded = excluded.has(t);
    if (isExposed && isExcluded) errs.push(`--${t} is both exposed and excluded — drop the exclusion`);
    else if (!isExposed && !isExcluded)
      errs.push(`--${t} reaches no Tailwind utility — expose it in frameworks/tailwind/theme.css or add it to EXCLUDED with a reason`);
  }
  for (const t of [...excluded.keys()].sort())
    if (!tokens.has(t)) errs.push(`--${t} is excluded but no such token exists — drop the exclusion`);
  for (const t of [...exposed].sort())
    if (!tokens.has(t)) errs.push(`the preset references --${t} — no such token in tokens/`);
  return errs;
}

function main() {
  const tokens = arenaTokens();
  const preset = readFileSync(join(repoRoot, 'frameworks/tailwind/theme.css'), 'utf8');
  const exposed = presetTokens(preset);
  const errs = checkCoverage(tokens, exposed, EXCLUDED);
  if (errs.length) {
    console.error(`check-tailwind-coverage: ${errs.length} token(s) undeclared\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`check-tailwind-coverage: ${tokens.size} token(s) — ${exposed.size} exposed, ${EXCLUDED.size} excluded on the record`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the unit tests**

Run: `bun test scripts/check-tailwind-coverage.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Run the gate against the tree**

Run: `bun scripts/check-tailwind-coverage.mjs`
Expected: exit 0, and the summary line reads `99 token(s) — 88 exposed, 11 excluded on the record`. If a token is reported undeclared, Task 4's preset missed it — add the key, do not add an exclusion.

- [ ] **Step 6: Prove the gate can fail**

Run:

```bash
bun -e "
const fs = require('node:fs');
const p = 'tokens/src/spacing.json';
const orig = fs.readFileSync(p, 'utf8');
const doc = JSON.parse(orig);
doc.sp['7'] = { \$value: { value: 28, unit: 'px' } };
fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n');
" && bun run build:tokens && bun scripts/check-tailwind-coverage.mjs; echo "exit=$?"; git checkout tokens/src/spacing.json tokens/spacing.css && bun run build:tokens
```

Expected: `--sp-7 reaches no Tailwind utility …` and `exit=1`, then the working tree is restored. Confirm with `git status` that `tokens/` is clean before moving on.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-tailwind-coverage.mjs scripts/check-tailwind-coverage.test.mjs
git commit -m "test(tailwind): gate that every Arena token is exposed or excluded

Completing the surface once is not the same as it staying complete. A token
added to tokens/src/ now fails the build unless it reaches a utility or is
named in EXCLUDED with a reason."
```

---

## Task 6: Gate 2 — no arbitrary values

**Files:**
- Create: `scripts/check-arbitrary-values.mjs`
- Test: `scripts/check-arbitrary-values.test.mjs`

**Interfaces:**
- Produces: `scanText(text: string): {cls: string, content: string}[]` — the illegal arbitrary values found in one file's text.

The rule is keyed on **Tailwind's bracket syntax**, not on `px` anywhere — `padding: '13px'` in a JSX inline style is not an arbitrary value; `text-[13px]` in a class string is. (React's 155 literal `px` were originally held to be one-off geometry the language permits. Plan 4 reverses that: a bare literal is a bug in every layer, and it adds `scripts/check-dimension-literals.mjs` for the inline-style idiom. **This gate's scoping is unchanged** — the two are complements.) A bracket's content is legal when it is a `var()` reference to a token (optionally behind a `length:` / `color:` type hint), or when it carries no literal value at all — `transition-[background,transform,box-shadow]` names properties, not values.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-arbitrary-values.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from './check-arbitrary-values.mjs';

const found = (s) => scanText(s).map((f) => f.cls);

test('flags a raw length', () => {
  assert.deepEqual(found('"root": "px-3 text-[13px] font-semibold"'), ['text-[13px]']);
});

test('flags a raw hex and a raw rgb', () => {
  assert.deepEqual(found('bg-[#b52a20] text-[rgb(20,16,16)]'), ['bg-[#b52a20]', 'text-[rgb(20,16,16)]']);
});

test('allows a var() reference to a token, with or without a type hint', () => {
  assert.deepEqual(found('h-[var(--dz-ctl-h)] duration-[var(--dur-mid)] border-[length:var(--bw-strong)]'), []);
});

test('allows a bracket that names properties rather than values', () => {
  assert.deepEqual(found('transition-[background,transform,box-shadow]'), []);
});

test('allows a keyword', () => {
  assert.deepEqual(found('bg-[currentColor]'), []);
});

test('does not flag array indexing or object access in JS', () => {
  assert.deepEqual(found('const s = SIZES[size] || SIZES.md; rows[0].cells[2]'), []);
});

test('does not flag a React inline style with a literal px', () => {
  assert.deepEqual(found("style={{ padding: '0 12px', fontSize: 13 }}"), []);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/check-arbitrary-values.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the gate**

Create `scripts/check-arbitrary-values.mjs`:

```js
/* Forbids Tailwind arbitrary values that carry a raw literal anywhere under
 * frameworks/. This is the machine form of the rule CLAUDE.md states in
 * prose: the Tailwind layer derives every utility from an existing token and
 * introduces no new hex and no new value.
 *
 * Keyed on bracket syntax, never on `px` anywhere: a JSX inline style is a
 * different idiom and needs a different gate. check-dimension-literals.mjs
 * covers it, and the two are complements — one gate spanning both would be
 * keyed on nothing coherent.
 *
 * Legal inside the brackets:
 *   - a var() into a token, optionally behind a type hint —
 *     h-[var(--dz-ctl-h)], border-[length:var(--bw)]
 *   - content with no literal value in it at all —
 *     transition-[background,transform,box-shadow], bg-[currentColor]
 *
 *   bun scripts/check-arbitrary-values.mjs   -> exit 0 if none, 1 otherwise
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const EXTENSIONS = ['.json', '.ts', '.tsx', '.jsx', '.html'];
const CANDIDATE = /(?<![\w-])(-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[([^\]\s"']+)\])/g;
const TOKEN_REF = /^(?:length:|color:|number:|percentage:)?var\(--[a-z0-9-]+\)$/;

/** @param {string} text @returns {{cls: string, content: string}[]} */
export function scanText(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const [, cls, content] = m;
    if (TOKEN_REF.test(content)) continue;
    if (!/[\d#]/.test(content)) continue; // a keyword or a property list, not a value
    out.push({ cls, content });
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

function main() {
  const root = join(repoRoot, 'frameworks');
  const errs = [];
  let scanned = 0;
  for (const file of walk(root)) {
    scanned++;
    for (const { cls } of scanText(readFileSync(file, 'utf8')))
      errs.push(`${relative(repoRoot, file)}: \`${cls}\` — a raw value, not a token`);
  }
  if (errs.length) {
    console.error(`check-arbitrary-values: ${errs.length} arbitrary value(s) under frameworks/\n`);
    for (const e of errs) console.error(`  ${e}`);
    console.error('\nExpose the token in frameworks/tailwind/theme.css and use the utility, or reference the token as var(--name).');
    process.exit(1);
  }
  console.log(`check-arbitrary-values: ${scanned} file(s) scanned, none`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

Note: `.md` files are not scanned. A `.prompt.md` legitimately shows a bad example inside a Don't block, and flagging it would push authors to stop writing Don'ts.

- [ ] **Step 4: Run the unit tests**

Run: `bun test scripts/check-arbitrary-values.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Run the gate against the tree and confirm it is red with exactly six**

Run: `bun scripts/check-arbitrary-values.mjs`
Expected: exit 1, exactly these six, and nothing from `frameworks/react/`:

```
frameworks/angular/primitives/tag/tag.variants.ts: `text-[11px]` — a raw value, not a token
frameworks/tailwind/components/Button.manifest.json: `px-[18px]` — a raw value, not a token
frameworks/tailwind/components/Button.manifest.json: `px-[26px]` — a raw value, not a token
frameworks/tailwind/components/Button.manifest.json: `text-[13px]` — a raw value, not a token
frameworks/tailwind/components/Button.manifest.json: `text-[14px]` — a raw value, not a token
frameworks/tailwind/components/Button.manifest.json: `text-[15px]` — a raw value, not a token
```

If anything under `frameworks/react/` appears, the regex is over-matching — fix the regex, never the React layer.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-arbitrary-values.mjs scripts/check-arbitrary-values.test.mjs
git commit -m "test(tailwind): forbid arbitrary values that carry a raw literal

Keyed on Tailwind's bracket syntax, so a var() into a token stays legal and
React's inline-style geometry is untouched. Red on six values today, all of
which exist only because the token they need was not exposed."
```

---

## Task 7: Correct `Button.manifest.json`

Five of the six arbitrary values are here, and they exist for exactly one reason: the utilities did not exist. They do now.

**Files:**
- Modify: `frameworks/tailwind/components/Button.manifest.json`

**Interfaces:**
- Consumes: `--text-sm` / `--text-base` / `--text-md`, `--font-weight-semibold`, `--shadow-2`, `--spacing` from Task 4; `--fs-base` from Task 3.

The substitutions, each verified against a real compile:

| Was | Becomes | Why it is exact |
|---|---|---|
| `text-[13px]` | `text-sm` | `--fs-sm` is 13px |
| `text-[14px]` | `text-base` | `--fs-base` is 14px (Task 3) |
| `text-[15px]` | `text-md` | `--fs-md` is 15px |
| `px-[18px]` | `px-4.5` | `calc(var(--spacing) * 4.5)` = 4px × 4.5 = 18px |
| `px-[26px]` | `px-6.5` | `calc(var(--spacing) * 6.5)` = 4px × 6.5 = 26px |
| `font-[var(--fw-semibold)]` | `font-semibold` | the weight is a theme key now |
| `hover:shadow-[var(--shadow-2)]` | `hover:shadow-2` | the elevation scale is a theme key now |

`duration-[var(--dur-fast)]`, `ease-[var(--ease-out)]`, `bg-[var(--danger-soft)]` and `transition-[background,transform,box-shadow]` all **stay as they are** — the first two because v4 has no duration namespace, the third because `--danger-soft` is a `colors.css` alias the preset deliberately does not expose, and the fourth because it names properties rather than values. All four are legal under gate 2.

- [ ] **Step 1: Rewrite the manifest**

Replace the contents of `frameworks/tailwind/components/Button.manifest.json` with:

```json
{
  "component": "Button",
  "slots": {
    "root": "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-[background,transform,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]"
  },
  "variants": {
    "variant": {
      "primary": { "root": "bg-primary text-primary-content border border-primary hover:shadow-2" },
      "danger":  { "root": "bg-transparent border border-error text-error hover:bg-[var(--danger-soft)]" }
    },
    "size": {
      "sm": { "root": "h-ctl-h-sm px-3 text-sm" },
      "md": { "root": "h-ctl-h px-4.5 text-base" },
      "lg": { "root": "h-ctl-h-lg px-6.5 text-md" }
    }
  },
  "defaultVariants": { "variant": "primary", "size": "md" }
}
```

- [ ] **Step 2: Run gate 2 and confirm only `tag` remains**

Run: `bun scripts/check-arbitrary-values.mjs`
Expected: exit 1 with exactly one line — `frameworks/angular/primitives/tag/tag.variants.ts: \`text-[11px]\``.

- [ ] **Step 3: Run gate 1 and confirm every class emits**

Run: `bun scripts/check-tailwind.mjs`
Expected: **exit 0.** Every Button class now exists as a real utility. If `px-4.5` or `px-6.5` is reported as producing no rule, `--spacing` is not set — go back to Task 4.

- [ ] **Step 4: Verify the values a browser actually computes**

Run:

```bash
bun -e "
import('./scripts/lib/tailwind-compile.mjs').then(({ compileLayer }) => {
  const { css } = compileLayer();
  for (const sel of ['\\\\.px-4\\\\\\\\.5', '\\\\.px-6\\\\\\\\.5', '\\\\.text-base', '\\\\.h-ctl-h'])
    console.log(new RegExp(sel + '\\\\s*\\\\{[^}]*\\\\}').exec(css)?.[0].replace(/\\s+/g, ' '));
});
"
```

Expected, in order:
```
.px-4\.5 { padding-inline: calc(var(--spacing) * 4.5); }
.px-6\.5 { padding-inline: calc(var(--spacing) * 6.5); }
.text-base { font-size: var(--text-base); }
.h-ctl-h { height: var(--spacing-ctl-h); }
```

With `--spacing: var(--sp-1)` = 4px that is 18px and 26px — the same values React's `Button.jsx:27-29` uses.

- [ ] **Step 5: Commit**

```bash
git add frameworks/tailwind/components/Button.manifest.json
git commit -m "fix(tailwind): Button's manifest derives from tokens, not literals

The five arbitrary values existed only because the utilities did not. px-4.5
and px-6.5 are 18px and 26px off Arena's own 4px base unit, and text-sm /
text-base / text-md are the 13/14/15 the React Button has always used."
```

---

## Task 8: `tag` consumes a shared manifest

Decision 2, and the reference shape the parity spec copies 34 times. Whatever this task settles — slot names, variant shape, where `defaultVariants` lives, how `tv` consumes the JSON — is what every future primitive follows, so author it as a template rather than as a one-off fix.

**Files:**
- Create: `frameworks/tailwind/components/Tag.manifest.json`
- Modify: `frameworks/angular/primitives/tag/tag.variants.ts`

**Interfaces:**
- Consumes: `--text-xs`, `--radius-pill`, `--color-base-300`, `--color-primary`, `--color-success`, `--color-warning`, `--color-error`, `--font-weight-semibold`, `--spacing-*` from Task 4; `tv` from `frameworks/tailwind/tv.ts` (unchanged).
- Produces: the manifest shape — top-level `component`, `slots`, `variants`, `defaultVariants` — and the consumption pattern `tv(manifest)`, which the parity spec's 14 further primitives copy verbatim.

Two changes beyond a straight move:
- `text-[11px]` becomes `text-xs` (`--fs-xs` is 11px), which is the sixth and last arbitrary value.
- `bg-[currentColor]` becomes `bg-current`, Tailwind's own built-in for the same thing. It was never illegal under gate 2 — the brackets carry a keyword, not a value — but shipping the bracket form in the template teaches the wrong habit to 34 copies.

- [ ] **Step 1: Create the manifest**

Create `frameworks/tailwind/components/Tag.manifest.json`:

```json
{
  "component": "Tag",
  "slots": {
    "root": "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-xs font-semibold",
    "dot": "h-1.5 w-1.5 rounded-pill bg-current"
  },
  "variants": {
    "tone": {
      "neutral": { "root": "border-base-300 text-base-content/70" },
      "primary": { "root": "border-primary text-primary" },
      "success": { "root": "border-success text-success" },
      "warning": { "root": "border-warning text-warning" },
      "danger":  { "root": "border-error text-error" }
    }
  },
  "defaultVariants": { "tone": "neutral" }
}
```

`rounded-full` becomes `rounded-pill`: `--radius-*: initial` removed Tailwind's `full`, and `--r-pill` (999px) is Arena's name for the same shape. `danger` stays outline — border and text in `--error`, transparent fill — which is the convention, not an accident of this component.

- [ ] **Step 2: Rewrite the variants file to consume it**

Replace the contents of `frameworks/angular/primitives/tag/tag.variants.ts` with:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Tag.manifest.json' with { type: 'json' };

export const tagStyles = tv(manifest);
```

The import attribute (`with { type: 'json' }`) is the standard form and is what `ng-packagr` will need when the parity spec builds this layer. `tag.ts` is unchanged: it already calls `tagStyles({ tone })` and reads `.root()` / `.dot()`, and the manifest's slot names are the same two.

- [ ] **Step 3: Run gate 2 and confirm it is green**

Run: `bun scripts/check-arbitrary-values.mjs`
Expected: **exit 0** — `check-arbitrary-values: N file(s) scanned, none`.

- [ ] **Step 4: Run gate 1 and confirm both manifests resolve**

Run: `bun scripts/check-tailwind.mjs`
Expected: exit 0, and the summary names 2 manifests. If `text-base-content/70` is reported as producing no rule, the opacity modifier is not being escaped correctly — fix `escapeClass`, not the manifest.

- [ ] **Step 5: Verify the recipe still produces the same class strings**

Run:

```bash
bun -e "
import('./frameworks/angular/primitives/tag/tag.variants.ts').then(({ tagStyles }) => {
  for (const tone of ['neutral', 'primary', 'success', 'warning', 'danger']) {
    const s = tagStyles({ tone });
    console.log(tone.padEnd(8), '|', s.root());
  }
  console.log('dot      |', tagStyles({}).dot());
});
"
```

Expected: five lines each containing `rounded-pill`, `text-xs`, `font-semibold` and the tone's own `border-*` / `text-*` pair, plus a dot line reading `h-1.5 w-1.5 rounded-pill bg-current`. This requires `tailwind-variants` to be resolvable; if it is not installed, run `bun add -d tailwind-variants` first and note it in the commit — the parity spec needs it present anyway.

- [ ] **Step 6: Run the whole suite**

Run: `bun test scripts/ && bun scripts/check-dtcg.mjs && bun scripts/check-tokens-generated.mjs && bun scripts/check-ramp.mjs && bun scripts/check-tailwind.mjs && bun scripts/check-tailwind-coverage.mjs && bun scripts/check-arbitrary-values.mjs`
Expected: every one exits 0.

- [ ] **Step 7: Commit**

```bash
git add frameworks/tailwind/components/Tag.manifest.json frameworks/angular/primitives/tag/tag.variants.ts package.json bun.lock
git commit -m "refactor(tailwind): tag's recipe moves to a shared manifest

The architecture CLAUDE.md describes and the tree did not have: the styling
is data under frameworks/tailwind/components/, and the Angular primitive
defines none of its own. This is the reference shape the remaining
primitives follow. text-[11px] becomes text-xs, the last arbitrary value."
```

---

## Task 9: Wire the gates in and document what changed

**Files:**
- Modify: `package.json`, `frameworks/tailwind/README.md`, `frameworks/angular/README.md`, `CLAUDE.md`, `CHANGELOG.md`

- [ ] **Step 1: Add the check scripts**

In `package.json`, extend `"scripts"` to:

```json
  "scripts": {
    "demos": "bun scripts/serve.mjs",
    "build:tokens": "bun scripts/build-tokens.mjs",
    "check:tokens": "bun scripts/check-tokens-generated.mjs",
    "check:dtcg": "bun scripts/check-dtcg.mjs",
    "check:tailwind": "bun scripts/check-tailwind.mjs",
    "check:coverage": "bun scripts/check-tailwind-coverage.mjs",
    "check:arbitrary": "bun scripts/check-arbitrary-values.mjs",
    "check": "bun run check:dtcg && bun run check:tokens && bun scripts/check-ramp.mjs && bun run check:tailwind && bun run check:coverage && bun run check:arbitrary",
    "test": "bun test scripts/"
  }
```

- [ ] **Step 2: Verify the aggregate**

Run: `bun run check`
Expected: six gates, all exit 0, ending with `check-arbitrary-values: N file(s) scanned, none`.

- [ ] **Step 3: Update `frameworks/tailwind/README.md`**

After the "It derives from tokens; it adds no value" section, insert:

```markdown
## What the preset exposes

Every token in `tokens/palette.css`, `typography.css`, `spacing.css` and
`effects.css` reaches a utility, except eleven that cannot — `--sp-0` (`p-0`
is a literal `0px` in v4), the three `--bp-*` (read by JS, never a media
query), the three `--dur-*` and the two `--bw-*` and the two `--focus-*`
(v4 has no namespace for them). Those eleven are listed with their reason in
`EXCLUDED` in `scripts/check-tailwind-coverage.mjs`, and that gate fails the
build if a token is added and reaches nothing.

`tokens/colors.css` is excluded as a category. Its aliases (`--crimson`,
`--mute`, `--danger-soft`, `--text-strong`…) alias tokens the preset already
exposes; a second utility name for the same colour is a second way to be
wrong. Reach one as `bg-[var(--danger-soft)]` when you genuinely need it.

Two naming notes: the density keys take the token's suffix verbatim, so
`--dz-row-py` is `py-row-py`; and `--container-max` is exposed as
`--container-page` (`max-w-page`) because a key named `max` shadows
Tailwind's built-in `max-w-max`.

## Arbitrary values are a build failure

`bun run check:arbitrary` fails on any bracket carrying a raw literal —
`text-[13px]`, `bg-[#b52a20]`. A bracket is legal when it holds a `var()`
into a token (`duration-[var(--dur-mid)]`, `border-[length:var(--bw)]`) or
names properties rather than values (`transition-[background,transform]`).
If a manifest needs a value with no token behind it, the token is what is
missing — add it to `tokens/src/` first.
```

- [ ] **Step 4: Update `frameworks/angular/README.md`**

Amend the primitives section so it states the dependency direction explicitly:

```markdown
A primitive defines no styling of its own. Its recipe lives in
`frameworks/tailwind/components/<Component>.manifest.json` and reaches the
component through the shared `tv`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Tag.manifest.json' with { type: 'json' };

export const tagStyles = tv(manifest);
```

`tag` is the reference shape.
```

- [ ] **Step 5: Update `CLAUDE.md`**

Replace the sentence in the "Framework layers live under `frameworks/`" paragraph that reads

> **The Tailwind layer derives every utility from an existing token and introduces no new hex and no new value** — add the token first, then reference it.

with

> **The Tailwind layer derives every utility from an existing token and introduces no new hex and no new value** — add the token first, then reference it. This is machine-checked, not hoped for: `bun run check:tailwind` compiles the preset with the manifests as content and asserts every class emits a rule and every theme key resolves to a real token; `bun run check:coverage` asserts every token either reaches a utility or is named in `EXCLUDED` with a reason; `bun run check:arbitrary` fails on a bracket carrying a raw literal. `bun run check` runs all six gates. An Angular primitive's recipe is its manifest — `frameworks/angular/primitives/tag/` is the reference shape.

- [ ] **Step 6: Add the `[Unreleased]` entry**

`v4.0.0` is tagged, so this work goes under a new heading. Insert immediately above `## [4.0.0] — 2026-07-18`:

```markdown
## [Unreleased]

### Added

- **The Tailwind layer exposes Arena's whole token surface.** `frameworks/tailwind/theme.css`
  grows from 37 theme keys to 89: the nine-step type scale, the three families, all six
  weights, line height and tracking, the seven density tokens, the six missing spacing
  steps, `--radius-xs` and `--radius-pill`, the four missing `-content` pairs,
  `--color-neutral` and its content, `--color-error-fill`, and the scrim. `.arena-compact`
  now has a utility surface; `rounded-pill` and `text-h1` exist.
- **`--fs-base`, the 14px control text size.** Arena's scale ran 13px to 15px with nothing
  between, while React's `Button` has used 14px for its `md` size all along. Naming it is
  what lets the Tailwind layer express `Button` without an arbitrary value.
- **Three gates.** `scripts/check-tailwind.mjs` compiles the preset with every component
  manifest as content and asserts each class emits a rule and each theme key resolves to a
  real Arena token; `scripts/check-tailwind-coverage.mjs` asserts every token either reaches
  a utility or is excluded with a reason, so a token added to `tokens/src/` cannot silently
  fail to reach the layer; `scripts/check-arbitrary-values.mjs` fails on any bracket
  carrying a raw literal. `bun run check` runs the six gates together.
- **`frameworks/tailwind/components/Tag.manifest.json`.** The shared-recipe architecture
  `CLAUDE.md` describes now exists: `tag.variants.ts` consumes the manifest through the
  shared `tv` instead of defining its recipe inline. This is the reference shape.

### Fixed

- **Spacing utilities no longer resolve to Tailwind's own default.** The preset defined
  `--spacing-1..8` but never `--spacing`, so v4 emitted every unnamed step as
  `calc(var(--spacing) * N)` against its `0.25rem` default — half the spacing surface was
  Arena's and half was Tailwind's, with nothing marking the boundary and the two coinciding
  only at a 16px root font size. `--spacing` is now `var(--sp-1)`, and the named steps are
  kept as insurance.
- **Tailwind's default palette and scales no longer resolve underneath Arena's.** Each
  populated namespace is cleared with `--<ns>-*: initial`, so `bg-red-500`, `text-2xl` and
  `rounded-2xl` emit nothing at all rather than a value Arena never defined and a re-skin
  never touches.
- **The six arbitrary values are gone.** Five in `Button.manifest.json` and one in
  `tag.variants.ts` existed only because the token they needed was not exposed. Each is now
  a real utility.

### Notes

- `tailwindcss` and `@tailwindcss/cli` are pinned to exactly `4.3.3` as dev dependencies.
  Every measurement behind these changes was taken against that version.
- The self-referential `--color-base-100: var(--color-base-100)` pattern in the preset is
  correct and is now documented in place. Tailwind emits `@theme` inside `@layer theme`,
  Arena's tokens are unlayered, and an unlayered declaration wins — so Arena's value applies
  and the self-reference never resolves against itself. It reads like a cycle and is not.
- The React layer is unchanged. An audit found 571 `var(--token)` references across 40
  components, zero references to a token that does not exist, and zero raw hex.
```

- [ ] **Step 7: Final verification**

Run:

```bash
bun run check && bun test scripts/ && git diff --stat main -- frameworks/react/
```

Expected: every gate exits 0, every test passes, and the `git diff` prints nothing at all — the React layer is byte-unchanged.

- [ ] **Step 8: Commit**

```bash
git add package.json frameworks/tailwind/README.md frameworks/angular/README.md CLAUDE.md CHANGELOG.md
git commit -m "docs: record the completed Tailwind surface and its gates

Adds bun run check as the aggregate, documents the eleven exclusions and the
two naming decisions, and states in CLAUDE.md that the layer's rule is now
machine-checked rather than written down and hoped for."
```

---

## What this plan deliberately does not do

- **Grow Angular past one primitive or Tailwind past two manifests.** That is `2026-07-18-framework-layer-parity-design.md`, and it starts from `Tag.manifest.json` as its slice 1.
- **Install `ng-packagr` or add `scripts/check-angular.mjs`.** The parity spec installs those; at this point in the sequence there is nothing to compile.
- **Publish anything.** `2026-07-18-four-package-build-publish-design.md` (plan 6) waits on parity (plan 5), which waits on the token/geometry boundary (plan 4, `specs/2026-07-18-token-geometry-boundary-design.md`), which waits on this.
- **Touch the React layer.** The audit found it healthy *against the rule it tested* — no raw hex, no references to a token that does not exist. It did not test whether a dimension resolves from the token layer at all, and mostly it does not: `var(--fs-*)` appears once across the 40 components and `var(--sp-*)` not at all. Repairing that is plan 4, not this plan. React stays the **reference implementation**; `tokens/src/` is the design authority.
- **Change any token value.** The one new token (`--fs-base`) names a size the system already used; no existing value moves.

## What the parity work inherits from this

Recorded here because the parity plan is written in a later session that will not see this reasoning:

- **`Tag.manifest.json` is the template.** Its shape — top-level `component` / `slots` / `variants` / `defaultVariants`, consumed as `tv(manifest)` with a JSON import attribute — is what 14 further primitives copy. Changing it later means changing it 15 times.
- **Gate 1 is what holds up a manifest with no consumer.** `checkCompiled` asserts every class in every manifest emitted a rule. Twenty of the eventual 35 manifests will have no Angular primitive and nothing else exercising them; this is the only thing standing between them and silent rot.
- **`--picker-invert`'s exclusion has a category, and the category has more members.** It is not merely "an internal for a vendor pseudo-element" — it is **not expressible as a utility**, the same category that keeps the four charts and `Calendar` out of the Tailwind layer entirely. When `Input` gets a manifest, its `::-webkit-calendar-picker-indicator` rule stays where React keeps it, in injected CSS.
- **Fractional spacing is available and legal.** `px-4.5` is 18px off `--sp-1`. A React component using off-grid-but-even geometry does not need a new token; it needs the fraction.

- **Button was not an exception, it was the first of a queue — measure before writing the
  next manifest.** Button needed `--fs-base` because React used a size the scale did not
  name. That is not a Button problem. Measured across the 40 React components:

  | | Count |
  |---|---|
  | `fontSize` literals total | 116 |
  | …that map to an existing token (11/13/14/15/17/19/32px) | 79 |
  | …that map to nothing — 12px (×22), 16px (×9), 10px (×6), 18px (×4), 9/20/22/34px | 37 |
  | `padding`/`gap`/`margin` literals | 87 |
  | …off Arena's 4px grid — 10px (×12), 6px (×6), 14px (×5), 22px (×4), 18px, 2px, 5px, 9px, 26px | 40 |
  | `border` literals — 44× `1px` (`--bw`), 3× `2px` (`--bw-strong`) | 47 |

  Every off-scale font size is a decision waiting at the manifest that needs it, and gate 2
  now forces it into the open instead of letting `text-[12px]` ship. Spacing is the easier
  half: all 87 values are multiples of 0.25 × `--sp-1`, so the fractional steps express them
  with no new token. **Do not resolve these one manifest at a time** — 37 isolated decisions
  by different authors will not converge. Settle the type scale once, before phase 1.

- **A separate spec is owed: React consuming `tokens/src/` directly.** The audit in the
  coverage spec cleared React on the rule it was tested against — no raw hex, no reference
  to a token that does not exist — and that finding stands. But ~126 of the literals above
  are uses of a token that *already exists* (`border: '1px solid'` where `--bw` is 1px,
  `fontSize: 13` where `--fs-sm` is 13px). That is cleanup with no design decision in it.
  What is *not* cleanup is where the line falls between a token and a component's internal
  geometry — a 14px spinner inside `Button`, a chart axis offset — because tokenising those
  turns `tokens/src/` into component API, adds knobs to every re-skin, and makes the
  self-generating Overview page unreadable. That question governs the 34 manifests too, so
  it deserves its own spec rather than an appendix here. **Sequence it after this plan**, not
  before: with gate 3 installed, a token born from that work cannot silently fail to reach
  the Tailwind layer. Without it, it can.

  **That spec is now written: `specs/2026-07-18-token-geometry-boundary-design.md`,
  plan 4 in the sequence.** It settles the boundary as *tokens name roles, layers
  instantiate them* — a dimension is a token or a derivation of tokens, and a bare
  literal is a bug — with derivation available where a scale is numeric (`sp`, so the
  spinner is `calc(var(--sp-1) * 3.5)` and needs no knob) and unavailable where it is
  semantic. It also adds two families this plan's gate 3 will then police, `icon` and
  `z`, and it is the reason Task 3 here authors `dz.text` rather than `fs.base`.
