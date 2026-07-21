# Angular primitive parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution order: 5a of 6.** **Status: NOT EXECUTED** as of 2026-07-19.

| # | Plan | Status |
|---|---|---|
| 1 | `2026-07-18-1-token-style-dictionary-migration.md` | **Executed** (v4.0.0) |
| 2 | `2026-07-18-2-overview-token-page.md` | **Executed** (v4.0.0) |
| 3 | `2026-07-18-3-framework-layer-token-coverage.md` | **Executed** (unreleased) |
| 4 | `2026-07-18-4-token-geometry-boundary.md` | **Executed** (unreleased) |
| 4.5 | `2026-07-19-4.5-token-debt-and-gate-blind-spots.md` | **Executed** |
| 4.75 | `2026-07-19-4.75-applogo-sidenav-activityfeed-unauthcard-design.md` | **Executed** (unreleased) — raised this plan's roster from 18 to 21 primitives, and its plan's Task 7 wrote Tasks 24–27 below |
| 5a | `2026-07-18-5a-angular-primitive-parity.md` | **This plan** — pending |
| 5b | `2026-07-18-5b-tailwind-manifest-parity.md` | Pending — depends on 5a's infrastructure (Tasks 1–3) |
| 5.5 | `2026-07-19-5.5-chart-geometry-token-target-design.md` | DRAFT — not approved, seven open questions |
| 6 | `2026-07-18-6-four-package-build-publish.md` | Pending |

**Goal:** Give the Angular layer the 21 primitives Material does not provide, each one styled by a Tailwind manifest it does not own, and each one visible and machine-checked — so `@dravensoft/arena-angular` can be published as a layer rather than as one component. Eighteen of the 21 are Tasks 4–22; spec 4.75 added the other three (`app-logo`, `activity-feed`, `unauth-card`) to the roster after this plan was written, and they are Tasks 24–26. `SideNav`, that spec's fourth component, is Task 27 — a Material bridge rather than a primitive, because Material's `mat-nav-list` already provides the item list.

**Architecture:** Three gates come first and nothing else lands until they exist: a committed compiled utility stylesheet (so a static page can render a manifest), a manifest-driven specimen harness, and an Angular template typecheck. Then the work is vertical slices — one component at a time, manifest + recipe + primitive + prompt + specimen + barrel, gated and committed together. The three SVG charts come last because they are the only slice with genuinely new engineering (a `ResizeObserver` behind a signal) and the only one with no manifest.

**Tech Stack:** Bun (runtime, test runner), Tailwind CSS 4.3.3, `tailwind-variants` 3.2.2, Angular 22 (standalone, `OnPush`, signals), `@angular/compiler-cli` (`ngc`) for the template typecheck, TypeScript 6.0, `node:test` + `node:assert/strict`.

**Source spec:** `docs/superpowers/specs/2026-07-18-5-framework-layer-parity-design.md`
**Also depends on:** `docs/superpowers/specs/2026-07-19-4.75-applogo-sidenav-activityfeed-unauthcard-design.md` — executed; the four React components exist. It fixed the roster this plan counts against: 18 primitives becomes 21 (`app-logo`, `activity-feed`, `unauth-card` join the roster; `SideNav` does not — its Angular story is a `mat-nav-list` bridge in `theme/arena-material.css`, not a primitive).
**Split from:** that spec's phases 1 and 2. Phase 3 (the 21 orphan manifests) is `2026-07-18-5b-tailwind-manifest-parity.md` and consumes Tasks 1–3 of this plan.
**Downstream, do not implement here:** `specs/2026-07-18-6-four-package-build-publish-design.md` (plan 6).

---

## State of the tree this plan was written against

Verified on 2026-07-19, at merge commit `44a72ae` on `main`, with `bun run check` green (9 steps, 171 tests). **Since superseded:** plan 4.5 has executed on top of this tree, and `bun run check` now reports 9 steps and 193 tests — the step count is unchanged (4.5 widened existing gates rather than adding new ones), the test count grew with them.

- **Plan 3 is executed.** `scripts/check-tailwind.mjs`, `check-tailwind-coverage.mjs` and `check-arbitrary-values.mjs` exist. `frameworks/tailwind/components/` holds `Button.manifest.json` and `Tag.manifest.json`. `frameworks/angular/primitives/tag/tag.variants.ts` is already `tv(manifest)` — the reference shape this plan copies exists and is real.
- **Plan 4 is executed.** `tokens/src/icon.json` (`--icon-sm|md|lg|xl`) and `tokens/src/layering.json` (`--z-dropdown` … `--z-toast`) exist and both reach utilities in `frameworks/tailwind/theme.css` (`--size-icon-*`, `--z-index-*`). `check-dimension-literals.mjs` reports no bare literals under `frameworks/`.
- **Plan 4.5 is executed, and this plan depends on all of it.** A Tailwind bracket may
  hold a derivation (`calc()`/`min()`/`max()`/`clamp()` over tokens) and a value in an
  unmodelled unit; `--avatar-xs|sm|md|lg` exist and reach `size-avatar-*`;
  `--dz-text-lg` reaches `text-ctl-lg`; the `--loop-*` family carries every cyclical
  duration; `--focus-width` has consumers. The dimension gate reads four kinds of site
  (declaration, template interpolation, injected CSS, SVG attribute), so a literal
  smuggled into a `<style>` string or an SVG attribute now fails here too.
- **Spec 4.75 has executed, and this plan's roster comes from it.** `AppLogo`,
  `SideNav`, `ActivityFeed` and `UnauthCard` exist in React, the `logo` token family
  backs the two brand components, and `frameworks/tailwind/theme.css` already exposes
  `size-logo-mark-*` and `text-logo-*`. `AppLogo`, `ActivityFeed` and `UnauthCard` each
  get an `arena-*` primitive here (Tasks 24–26); `SideNav` gets a `mat-nav-list` bridge
  in `arena-material.css` instead (Task 27). The primitive count this plan targets is
  therefore 21, not the 18 Tasks 4–22 write.
- **Each framework layer now has a test suite.** `frameworks/angular/test/` holds
  `tag-variants.test.ts`, run by `bun run test:angular` and included in `bun run check`.
  Every slice below adds a file there beside it.
- **The Angular layer holds exactly one primitive.** `frameworks/angular/primitives/` is `index.ts` + `tag/`. Nothing in the repo has ever compiled it: there is no Angular toolchain in `package.json` at all.
- **The Tailwind layer is never compiled to a file.** `scripts/lib/tailwind-compile.mjs` compiles it into a temp dir for the gates and deletes it. No stylesheet a browser can load exists yet — Task 1 is what changes that.

## Global Constraints

Every task's requirements implicitly include this section.

- **A primitive defines no styling of its own.** No component `styles`, no `styleUrls`, no class strings written in the template. The class strings come from `<name>.variants.ts`, which is `tv(manifest)` over `frameworks/tailwind/components/<Component>.manifest.json` and nothing else.
- **The Tailwind layer derives every utility from an existing token and introduces no new hex and no new value.** If a manifest needs a value with no token behind it, **stop** — that is out of scope here (this plan changes no token; plan 4 completed them) and it must be raised, not worked around with a literal.
- **Angular conventions, from `frameworks/angular/README.md`, without exception:** standalone (no `NgModule`), `ChangeDetectionStrategy.OnPush`, `arena-` selector prefix, `input()`/`output()`/`model()` signal I/O, `inject()` for DI, kebab-case filenames with no type suffix, barrels with no `../` imports inside the layer, **no comments beyond one JSDoc line per exported symbol**.
- **Design conventions, from `CLAUDE.md` and `README.md`:** dark-first (light is `.arena-light`), **danger is outline — transparent fill, border and content in `--error`** (the single exception is `ConfirmDialog`'s final confirmation), Phosphor icons (Bold default, Fill for status, Duotone for onboarding only), no gradients, no emoji, **English only**.
- **React is the reference implementation for shape and behaviour** — where an Angular primitive and its React counterpart disagree on what the component *does*, React is right. It is **not** the design authority for values; `tokens/src/` is.
- **`frameworks/react/` is byte-unchanged by this plan.** `git diff --stat main -- frameworks/react/` must print nothing at the end. So is `tokens/`, `styles.css`, `support.js`, `theme.js`, `jsx-loader.js` and the plugin manifests.
- **`bun run check` must exit 0 before every commit.** Not "at the end" — every commit.
- **Never hand-edit generated output:** `tokens/palette.css`, `typography.css`, `spacing.css`, `effects.css`, and — new in this plan — `frameworks/tailwind/utilities.css`.

## The token → utility ledger

Every manifest in this plan and in 5b is a translation of a React component's inline
styles into this table. It is written once, here, so that 34 manifests do not each
re-derive it. `tokens/colors.css`'s aliases are deliberately **not** exposed as
utilities (a second name for the same colour is a second way to be wrong), so the
right-hand column reaches the daisyUI token the alias points at — and the two are
identical by construction, since `colors.css` is nothing but that mapping.

| React writes | The manifest writes | Why |
|---|---|---|
| `var(--bg)` | `bg-base-100` | `--bg: var(--color-base-100)` |
| `var(--surface-card)`, `var(--panel)` | `bg-base-200` | both alias `--color-base-200` |
| `var(--bg-raised)`, `var(--surface-input)` | `bg-base-300` | both alias `--color-base-300` |
| `var(--color-base-300)` as a border | `border-base-300` | |
| `var(--line-strong)`, `var(--border-strong)` | `border-neutral` | both alias `--color-neutral` |
| `var(--bone)`, `var(--text-strong)` | `text-base-content` | |
| `var(--bone-dim)`, `var(--text-body)` | `text-base-content/82` | the alias *is* `color-mix(… 82%, transparent)`; the modifier emits the same `color-mix` |
| `var(--mute)`, `var(--text-muted)` | `text-base-content/62` | same, at 62% |
| `var(--mute-2-disabled)` | `text-base-content/40` | |
| `var(--status-offline)` | `bg-base-content/52` | |
| `var(--crimson)`, `var(--accent)` | `bg-primary` / `text-primary` / `border-primary` | |
| `var(--crimson-soft)` | `bg-primary/14` | |
| `var(--on-accent)` | `text-primary-content` | |
| `var(--gold)` | `text-secondary` / `bg-secondary` | |
| `var(--danger)`, `var(--error)` | `text-error` / `border-error` | **never** `bg-error` — danger is outline |
| `var(--danger-soft)` | `bg-error/14` | |
| `var(--danger-fill)` | `bg-error-fill` | ConfirmDialog's final step only |
| `Avatar`'s presence dot (`status` variant) | `bg-success` / `bg-warning` / `bg-error` / `bg-base-content/52` | **carve-out from the row above:** presence is its own semantic family, not a danger surface — a status taxonomy read at a glyph's size, where an outline would not register. See README's Danger convention section. This is the only place in the ledger a filled `bg-error` is correct. |
| `var(--success)` / `--success-soft` | `text-success` / `bg-success/16` | |
| `var(--warning)` / `--warning-soft` | `text-warning` / `bg-warning/18` | |
| `var(--info)` / `--info-soft` | `text-info` / `bg-info/16` | |
| `var(--scrim)` | `bg-scrim` | |
| `blur(var(--scrim-blur))` | `backdrop-blur-scrim` | |
| `calc(var(--sp-1) * N)` | the numeric utility `N` — `p-3`, `gap-2.5`, `px-4.5`, `mt-0.5` | `theme.css` sets `--spacing: var(--sp-1)`, so every numeric step *is* the token |
| `var(--sp-N)` | the same numeric utility `N` | |
| `var(--bw) solid <c>` | `border-[length:var(--bw)] border-<c>` | the bracket is legal: it holds a `var()` |
| `var(--bw-strong) solid <c>` | `border-[length:var(--bw-strong)] border-<c>` | |
| `var(--r-xs|sm|md|lg|xl|2xl|pill)` | `rounded-xs|sm|md|lg|xl|2xl|pill` | |
| `borderRadius: '50%'` | `rounded-full` | a static utility, not a theme key |
| `var(--shadow-1|2|3)` | `shadow-1|2|3` | |
| `var(--fs-*)` | `text-mega|hero|display|h1|h2|h3|h4|lg|md|sm|xs` | the **editorial** scale |
| `var(--dz-text)` | `text-ctl` | the **control** scale — chrome text, not prose |
| `var(--dz-text-md|sm|xs|2xs)` | `text-ctl-md|sm|xs|2xs` | |
| `var(--dz-ctl-h|-sm|-lg)` | `h-ctl-h`, `h-ctl-h-sm`, `h-ctl-h-lg` | |
| `var(--dz-row-py|row-px|stack)` | `py-row-py`, `px-row-px`, `gap-stack` | the key is the token's suffix verbatim |
| `var(--dz-lh)` | `leading-ctl` | |
| `var(--lh-tight|snug|body)` | `leading-tight|snug|body` | |
| `var(--ls-*)` | `tracking-*` (same suffix) | |
| `var(--fw-regular|medium|semibold|bold|extrabold|black)` | `font-regular|medium|semibold|bold|extrabold|black` | |
| `var(--font-display|body|mono)` | `font-display|body|mono` | |
| `var(--icon-sm|md|lg|xl)` **as a font size** | `text-[length:var(--icon-sm|md|lg|xl)]` | a Phosphor glyph is a webfont: it needs `font-size`, and `--size-*` only yields `size-*` |
| `var(--avatar-xs|sm|md|lg)` | `size-avatar-xs|sm|md|lg` | the diameter, width and height together (plan 4.5) |
| `var(--dz-text-lg)` | `text-ctl-lg` | 16px, the chart readout step (plan 4.5) |
| `var(--loop-spin|sweep|shimmer|brand)` | `duration-[var(--loop-spin)]` | cyclical motion; `--dur-*` is the transition scale (plan 4.5) |
| `var(--icon-*)` **as a box** | `size-icon-sm|md|lg|xl` | sets width and height together |
| `var(--z-*)` | `z-dropdown|tooltip|modal|modal-nested|palette|onboarding|toast` | |
| `var(--dur-fast|mid|slow)` | `duration-[var(--dur-fast)]` | v4 has no duration namespace; the bracket holds a `var()` |
| `var(--ease-out|in-out|emphatic)` | `ease-out`, `ease-in-out`, `ease-emphatic` | |
| `var(--container-max)` | `max-w-page` | a key named `max` would shadow `max-w-max` |
| `var(--gutter)` | `p-gutter` / `px-gutter` | |

**A derivation is a token.** Plan 4.5 taught the bracket gate what the inline gate
already knew: `calc()`, `min()`, `max()` and `clamp()` over tokens, zeros and
multipliers are legal — `text-[length:calc(var(--avatar-md)*0.4)]`,
`shadow-[inset_0_calc(var(--bw-strong)*-1)_0_var(--crimson)]`. So is a single value in
a unit the token layer does not model (`%`, `ch`, `fr`, `vh`/`vw`/`vmin`/`vmax`,
`deg`), because DTCG admits only `px` and `rem` in a dimension and there is no token to
reference. `px`, `rem`, `ms` and `s` still fail: tokens model those.

## File structure

**New infrastructure (Tasks 1–3), consumed by 5b as well:**

```
scripts/build-tailwind.mjs             emits the compiled utility stylesheet
scripts/check-tailwind-generated.mjs   committed CSS matches the source
scripts/check-angular.mjs              ngc --strictTemplates over the Angular layer
scripts/manifest-classes.test.mjs      unit tests for the specimen helper
scripts/tailwind-vocabulary.test.mjs   every utility the ledger promises emits a rule
frameworks/tailwind/utilities.css      GENERATED, committed — what a specimen loads
frameworks/tailwind/manifest-classes.js  manifest -> {slot: classString}, browser + node
frameworks/tailwind/specimen.js        the shared specimen page harness
frameworks/angular/tsconfig.check.json the typecheck project
```

**Per primitive (Tasks 4–17), fourteen times:**

```
frameworks/tailwind/components/<Component>.manifest.json   the styling, as data
frameworks/tailwind/components/<Component>.card.html       the specimen (gate 1)
frameworks/angular/primitives/<name>/<name>.variants.ts    tv(manifest)
frameworks/angular/primitives/<name>/<name>.ts             markup + signals
frameworks/angular/primitives/<name>/<name>.prompt.md      usage + Do/Don't
frameworks/angular/primitives/<name>/index.ts              barrel
```
plus one line in `frameworks/angular/primitives/index.ts`.

**The charts (Tasks 18–22):** no manifest, no specimen, no `.variants.ts` — that
exception is the spec's, and Task 22 writes it down in the README so a missing chart
manifest reads as a decision rather than an omission.

```
frameworks/angular/primitives/container-size.ts     ResizeObserver behind a signal
frameworks/angular/primitives/chart-internals.ts    the shared chart maths
frameworks/angular/primitives/{bar-chart,line-chart,doughnut-chart,chart-card}/
```

## Deviations from the spec, and why

Two, both narrowing, neither changing what ships.

1. **Gate 2 runs `ngc`, not an `ng-packagr` build.** The spec's stated purpose for
   gate 2 is "fails on any primitive that does not compile or whose template
   references something that does not exist" — that is the template typechecker,
   and `ngc -p tsconfig` with `strictTemplates` is exactly it, with no packaging
   config, no `ng-package.json`, and no build output. Whether the layer *packages*
   is plan 6's question and plan 6's gate. **`ng-packagr` is still installed here**,
   as the spec requires, so plan 6 finds it present rather than adding it.
2. **`ChartCard` gets a manifest, so the layer ships 36 rather than 35.** The spec
   counts it among "the 4 charts", but the exclusion's own argument — a chart's identity
   is path data, which a class string cannot hold — describes the three SVG charts and
   not a bordered card with a microlabel. Task 19 states the reasoning at the point it
   applies. The charts' exception narrows to BarChart, LineChart and DoughnutChart.

---

## Task 1: The compiled utility stylesheet, and the gate that keeps it honest

A specimen page is static HTML. It cannot compile Tailwind, so the compiled CSS has
to exist as a file in the tree. This is the same shape `tokens/` already has —
authored source, a build script, committed output, and a gate that fails when the
two disagree — and it is deliberately not "the dev server compiles it on the fly",
which would make the specimens work only under `bun run demos`.

**Files:**
- Create: `scripts/build-tailwind.mjs`
- Create: `scripts/check-tailwind-generated.mjs`
- Create: `scripts/check-tailwind-generated.test.mjs`
- Create: `frameworks/tailwind/utilities.css` (generated)
- Modify: `package.json` (two scripts)
- Modify: `scripts/check-all.mjs` (one step)
- Modify: `.gitignore` — **verify only**; `utilities.css` must NOT be ignored

**Interfaces:**
- Consumes: `compileLayer()` from `scripts/lib/tailwind-compile.mjs` (existing).
- Produces: `frameworks/tailwind/utilities.css`, loadable by any page as a stylesheet;
  `buildTailwind(root?) -> string` (the CSS it wrote); `bun run build:tailwind`;
  `bun run check:tailwind-generated`.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-tailwind-generated.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { BANNER, generatedPath, drift } from './check-tailwind-generated.mjs';

test('the committed stylesheet carries the generated banner', () => {
  const css = readFileSync(generatedPath(), 'utf8');
  assert.ok(css.startsWith(BANNER), 'utilities.css must start with the GENERATED banner');
});

test('the committed stylesheet is what the source compiles to', () => {
  assert.equal(drift(), null);
});

test('drift() reports the file when the committed text differs', () => {
  const fake = join(repoRoot, 'no', 'such', 'root');
  assert.notEqual(drift({ root: fake }), null);
});

test('the stylesheet a specimen loads carries real rules, not just the banner', () => {
  const css = readFileSync(generatedPath(), 'utf8');
  assert.ok(css.includes('.inline-flex'), 'a static utility must be present');
  assert.ok(css.includes('--color-primary'), 'the theme layer must be present');
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `bun test scripts/check-tailwind-generated.test.mjs`
Expected: FAIL — `Cannot find module './check-tailwind-generated.mjs'`.

- [ ] **Step 3: Write the build script**

Create `scripts/build-tailwind.mjs`:

```js
/* Compiles Arena's Tailwind layer to a file a browser can load.
 *
 * The gates compile the layer into a temp dir and throw it away — that is right
 * for a gate and useless for a specimen page, which is static HTML and cannot
 * run a compiler. So the compiled utilities are build output in the tree, on
 * exactly the terms tokens/*.css already are: authored source (theme.css + the
 * manifests), a build script, committed output, and check-tailwind-generated.mjs
 * failing the day the two disagree.
 *
 * The content set is the manifests and nothing else, inherited from
 * compileLayer() — so a class that no manifest declares does not exist here,
 * and a specimen page cannot invent styling the manifest does not carry.
 *
 *   bun scripts/build-tailwind.mjs      -> writes frameworks/tailwind/utilities.css
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { compileLayer, repoRoot } from './lib/tailwind-compile.mjs';

export const BANNER = '/* GENERATED by scripts/build-tailwind.mjs — edit frameworks/tailwind/theme.css or a manifest, not this file. */\n';

/** @param {{root?: string}} [opts] @returns {string} absolute path of the output */
export function generatedPath(opts = {}) {
  return join(opts.root ?? repoRoot, 'frameworks', 'tailwind', 'utilities.css');
}

/** Compile the layer and return the text that belongs in utilities.css.
 *  @param {{root?: string}} [opts] @returns {string} */
export function buildTailwind(opts = {}) {
  const { css } = compileLayer(opts);
  return BANNER + css;
}

function main() {
  const text = buildTailwind();
  const path = generatedPath();
  writeFileSync(path, text);
  console.log(`build-tailwind: wrote ${path} (${text.length} bytes)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Write the gate**

Create `scripts/check-tailwind-generated.mjs`:

```js
/* Asserts the committed frameworks/tailwind/utilities.css is what the current
 * preset and manifests compile to. The same contract check-tokens-generated.mjs
 * holds for tokens/*.css: build output in the tree is only trustworthy while
 * something fails when it goes stale.
 *
 *   bun scripts/check-tailwind-generated.mjs   -> exit 0 if in sync, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { buildTailwind, generatedPath, BANNER } from './build-tailwind.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';

export { BANNER, generatedPath };

/** @param {{root?: string}} [opts]
 *  @returns {string|null} the repo-relative path that is stale, or null when in sync */
export function drift(opts = {}) {
  const path = generatedPath(opts);
  let committed;
  try {
    committed = readFileSync(path, 'utf8');
  } catch {
    return relative(repoRoot, path);
  }
  return committed === buildTailwind(opts) ? null : relative(repoRoot, path);
}

function main() {
  const stale = drift();
  if (stale) {
    console.error(`check-tailwind-generated: ${stale} is stale — run \`bun run build:tailwind\` and commit the result`);
    process.exit(1);
  }
  console.log('check-tailwind-generated: utilities.css matches the preset and the manifests');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 5: Generate the stylesheet**

Run: `bun scripts/build-tailwind.mjs`
Expected: `build-tailwind: wrote /home/juan/Dravensoft/Identity/frameworks/tailwind/utilities.css (… bytes)`

- [ ] **Step 6: Run the tests**

Run: `bun test scripts/check-tailwind-generated.test.mjs`
Expected: 4 pass, 0 fail.

- [ ] **Step 7: Confirm the gate catches drift**

Run:
```bash
printf '\n.arena-drift{color:red}\n' >> frameworks/tailwind/utilities.css
bun scripts/check-tailwind-generated.mjs; echo "exit=$?"
```
Expected: `check-tailwind-generated: frameworks/tailwind/utilities.css is stale …` and `exit=1`.

Then restore it: `bun scripts/build-tailwind.mjs && bun scripts/check-tailwind-generated.mjs`
Expected: `check-tailwind-generated: utilities.css matches the preset and the manifests`

- [ ] **Step 8: Wire it into the scripts and the runner**

In `package.json`, add to `"scripts"` (keep the existing keys and their order; these two go after `"build:tokens"` and after `"check:tailwind"` respectively):

```json
    "build:tailwind": "bun scripts/build-tailwind.mjs",
    "check:tailwind-generated": "bun scripts/check-tailwind-generated.mjs",
```

In `scripts/check-all.mjs`, add the step immediately after the `check:tailwind` entry,
matching the surrounding shape exactly (read the file first — the array literal's
formatting is the contract, not this snippet's):

```js
  ['check:tailwind-generated', ['scripts/check-tailwind-generated.mjs']],
```

- [ ] **Step 9: Run the whole suite**

Run: `bun run check`
Expected: `check-all: all 10 step(s) passed`

- [ ] **Step 10: Confirm the output is not ignored**

Run: `git check-ignore -v frameworks/tailwind/utilities.css; echo "exit=$?"`
Expected: no output and `exit=1` (nothing ignores it). If it prints a rule, remove
that rule — the file is committed build output, like `tokens/spacing.css`.

- [ ] **Step 11: Commit**

```bash
git add scripts/build-tailwind.mjs scripts/check-tailwind-generated.mjs \
        scripts/check-tailwind-generated.test.mjs scripts/check-all.mjs \
        package.json frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): compile the layer to a stylesheet a specimen can load"
```

---

## Task 2: The specimen harness — a manifest, rendered

Gate 1 from the spec. An Angular primitive carries no styling of its own and its
recipe is data, so a static page that applies the manifest to the real markup shows
the true visual result with no Angular executed. That is what makes the layer's
primitives reviewable by eye in a tree whose demos are static by doctrine.

Two files: a resolver (manifest + chosen variants → class strings) and a page
harness so a specimen is twenty lines of markup rather than a hundred of boilerplate.

**Files:**
- Create: `frameworks/tailwind/manifest-classes.js`
- Create: `frameworks/tailwind/specimen.js`
- Create: `scripts/manifest-classes.test.mjs`
- Create: `scripts/tailwind-vocabulary.test.mjs`

**Interfaces:**
- Produces:
  - `classesFor(manifest, variants?) -> Record<slot, string>` — the same composition
    `tv()` performs, minus twMerge (a specimen renders one variant combination at a
    time, so nothing collides). Throws on a manifest with `compoundVariants`.
  - `mountSpecimen({ manifest, sections, mount? }) -> void` — renders labelled rows
    into `#root`.
  - `section(label, nodes) -> {label, nodes}` and `el(tag, props, ...children) -> Element`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/manifest-classes.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { classesFor } from '../frameworks/tailwind/manifest-classes.js';

const tag = JSON.parse(readFileSync(join(repoRoot, 'frameworks/tailwind/components/Tag.manifest.json'), 'utf8'));

test('the default variants apply when nothing is chosen', () => {
  const { root, dot } = classesFor(tag);
  assert.ok(root.includes('rounded-pill'), 'the base slot is present');
  assert.ok(root.includes('border-base-300'), 'tone=neutral is the default');
  assert.equal(dot, 'h-1.5 w-1.5 rounded-pill bg-current');
});

test('a chosen variant replaces the default', () => {
  const { root } = classesFor(tag, { tone: 'danger' });
  assert.ok(root.includes('border-error'), 'the chosen tone applies');
  assert.ok(!root.includes('border-base-300'), 'the default tone does not');
});

test('the base slot always precedes the variant slot', () => {
  const { root } = classesFor(tag, { tone: 'primary' });
  assert.ok(root.indexOf('inline-flex') < root.indexOf('border-primary'));
});

test('an unknown variant value is a loud failure, not a silent base-only render', () => {
  assert.throws(() => classesFor(tag, { tone: 'chartreuse' }), /tone="chartreuse"/);
});

test('a slot with no variant contribution is still returned', () => {
  assert.ok('dot' in classesFor(tag, { tone: 'danger' }));
});

test('compoundVariants are refused rather than silently dropped', () => {
  assert.throws(() => classesFor({ ...tag, compoundVariants: [] }), /compoundVariants/);
});
```

Create `scripts/tailwind-vocabulary.test.mjs`. This is the second half of the task's
value: it settles, once and mechanically, that every utility the ledger in this plan
promises actually emits a rule — so fourteen manifest tasks are not fourteen rounds
of trial and error, and a future change to `theme.css` that silently removes one
fails here instead of in a specimen nobody reopened.

```js
/* Every utility class the manifests in plans 5a/5b rely on, compiled for real.
 *
 * The ledger in docs/superpowers/plans/2026-07-18-5a-angular-primitive-parity.md
 * claims a mapping from Arena token to Tailwind utility. This asserts the claim
 * against the compiler rather than against the preset's source text: a theme key
 * can exist and still emit nothing (a cleared namespace, a name that shadows a
 * built-in), and that failure is invisible until a specimen renders unstyled.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileLayer, escapeClass } from './lib/tailwind-compile.mjs';

/** Utilities the ledger promises, grouped by the token family behind them. */
const VOCABULARY = {
  colour: ['bg-base-100', 'bg-base-200', 'bg-base-300', 'border-base-300', 'border-neutral',
    'text-base-content', 'text-base-content/82', 'text-base-content/62', 'text-base-content/40',
    'bg-base-content/52', 'bg-base-100/30', 'text-neutral', 'bg-primary', 'text-primary',
    'border-primary', 'bg-primary/14',
    'text-primary-content', 'text-secondary', 'text-error', 'border-error', 'bg-error/14',
    'bg-error-fill', 'text-error-content', 'text-success', 'border-success', 'bg-success/16',
    'text-warning', 'border-warning', 'bg-warning/18', 'text-info', 'border-info', 'bg-info/16',
    'bg-scrim', 'backdrop-blur-scrim'],
  spacing: ['p-0.5', 'p-3', 'px-4.5', 'py-3.5', 'gap-1.5', 'gap-2.5', 'mt-4.5', 'size-6', 'size-8',
    'size-10', 'size-14', 'h-ctl-h', 'h-ctl-h-sm', 'h-ctl-h-lg', 'min-w-ctl-h', 'w-ctl-h',
    'py-row-py', 'px-row-px', 'gap-stack', 'p-gutter', 'max-w-page',
    'w-px', 'w-80', 'w-115', 'w-140', 'max-h-80', 'min-h-13', 'min-h-30', 'h-8.5', 'h-5.5'],
  type: ['font-display', 'font-body', 'font-mono', 'text-h1', 'text-h2', 'text-h3', 'text-h4',
    'text-md', 'text-sm', 'text-ctl', 'text-ctl-md', 'text-ctl-sm', 'text-ctl-xs', 'text-ctl-2xs',
    'font-regular', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold',
    'leading-ctl', 'leading-snug', 'leading-body', 'tracking-tight', 'tracking-normal',
    'tracking-label', 'tracking-field-label', 'tracking-badge', 'tracking-mono-nav',
    'tracking-uppercase-status'],
  effects: ['rounded-xs', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-pill', 'rounded-full',
    'shadow-2', 'shadow-3', 'ease-out', 'ease-in-out',
    'z-modal-nested', 'z-palette', 'z-onboarding'],
  icon: ['size-icon-sm', 'size-icon-md', 'size-icon-lg', 'size-icon-xl',
    'text-[length:var(--icon-sm)]', 'text-[length:var(--icon-md)]',
    'text-[length:var(--icon-lg)]', 'text-[length:var(--icon-xl)]'],
  avatar: ['size-avatar-xs', 'size-avatar-sm', 'size-avatar-md', 'size-avatar-lg',
    'text-[length:calc(var(--avatar-md)*0.4)]',
    'size-[max(calc(var(--sp-1)*2),calc(var(--avatar-md)*0.28))]'],
  derived: ['text-ctl-lg', 'duration-[var(--loop-spin)]',
    'shadow-[inset_0_calc(var(--bw-strong)*-1)_0_var(--crimson)]'],
  unmodelled: ['max-w-[42ch]', 'max-w-[92vw]', 'pt-[12vh]', 'w-[62%]'],
  bracketed: ['border-[length:var(--bw)]', 'border-[length:var(--bw-strong)]',
    'border-b-[length:var(--bw)]', 'duration-[var(--dur-fast)]', 'duration-[var(--dur-mid)]'],
  states: ['hover:bg-base-200', 'hover:text-base-content/82', 'disabled:opacity-45',
    'disabled:cursor-not-allowed', 'border-dashed', 'tabular-nums', 'sr-only'],
};

/** Compile the layer with one extra content file declaring `classes`. */
function compileWith(classes) {
  const dir = mkdtempSync(join(tmpdir(), 'arena-vocab-'));
  try {
    writeFileSync(join(dir, 'Vocabulary.manifest.json'),
      JSON.stringify({ component: 'Vocabulary', slots: { root: classes.join(' ') } }));
    return compileLayer({ extraSource: join(dir, '*.manifest.json') }).css;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const [family, classes] of Object.entries(VOCABULARY)) {
  test(`every ${family} utility the ledger promises emits a rule`, () => {
    const css = compileWith(classes);
    const missing = classes.filter((c) => !css.includes(`.${escapeClass(c)}`));
    assert.deepEqual(missing, []);
  });
}
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `bun test scripts/manifest-classes.test.mjs scripts/tailwind-vocabulary.test.mjs`
Expected: FAIL — `Cannot find module '../frameworks/tailwind/manifest-classes.js'`, and
`compileLayer` does not accept `extraSource`.

- [ ] **Step 3: Teach `compileLayer` an extra source**

In `scripts/lib/tailwind-compile.mjs`, `entryStylesheet` gains an optional second
source and `compileLayer` passes it through. Replace both functions' bodies as follows,
leaving their comments in place and extending the `entryStylesheet` comment with the
final sentence:

```js
/** …existing comment…
 *  `extra`, when given, registers one more glob as content — used by
 *  scripts/tailwind-vocabulary.test.mjs to compile a throwaway manifest
 *  without writing it into the repository.
 *  @param {string} preset absolute path to the preset CSS
 *  @param {string} components absolute path to the manifests directory
 *  @param {string} [extra] absolute glob of additional content
 *  @returns {string} */
export function entryStylesheet(preset, components, extra) {
  return `@import '${preset}' source(none);\n@source '${components}/*.manifest.json';\n`
    + (extra ? `@source '${extra}';\n` : '');
}
```

and in `compileLayer`, replace the `const entry = …` line with:

```js
  const entry = entryStylesheet(preset, components, opts.extraSource);
```

and extend its JSDoc `@param` to `{{root?: string, extraSource?: string}} [opts]`.

- [ ] **Step 4: Write the resolver**

Create `frameworks/tailwind/manifest-classes.js`:

```js
/* Resolves a component manifest to the class string per slot.
 *
 * This is the "raw className" consumption path frameworks/tailwind/README.md
 * documents, made concrete: read `slots`/`variants` and concatenate. It is what
 * the specimen pages use, and it is deliberately NOT tailwind-variants — a
 * specimen renders one variant combination at a time, so nothing collides and
 * there is nothing for twMerge to dedupe. Angular consumes the same manifests
 * through the shared `tv` instead, which does merge; the two agree on every
 * input a specimen can produce.
 *
 * Plain ES module with no dependencies, so a <script type="module"> in a static
 * page and `bun test` both import it unchanged.
 */

/** The class string for each slot, with `variants` applied over the manifest's
 *  own defaults.
 *  @param {object} manifest a parsed *.manifest.json
 *  @param {Record<string,string>} [chosen] variant name -> value
 *  @returns {Record<string,string>} slot name -> class string */
export function classesFor(manifest, chosen = {}) {
  if (manifest.compoundVariants) {
    throw new Error(`${manifest.component}: compoundVariants are not supported by manifest-classes.js — render it through tv() instead`);
  }
  const out = {};
  for (const [slot, base] of Object.entries(manifest.slots ?? {})) out[slot] = base;

  for (const [name, values] of Object.entries(manifest.variants ?? {})) {
    const value = chosen[name] ?? manifest.defaultVariants?.[name];
    if (value === undefined) continue;
    const applied = values[value];
    if (!applied) {
      throw new Error(`${manifest.component}: ${name}="${value}" is not in the manifest — known values: ${Object.keys(values).join(', ')}`);
    }
    for (const [slot, classes] of Object.entries(applied)) {
      out[slot] = out[slot] ? `${out[slot]} ${classes}` : classes;
    }
  }
  return out;
}
```

- [ ] **Step 5: Write the page harness**

Create `frameworks/tailwind/specimen.js`:

```js
/* The shared harness behind every *.card.html specimen in this folder.
 *
 * A specimen exists to answer one question by eye: does this manifest, applied
 * to this component's real markup, render the component Arena's README
 * specifies? So the harness supplies only what that needs — labelled rows, the
 * page chrome the React card pages already use, and nothing that could style
 * the component itself. Every class on a specimen's own elements comes from
 * classesFor(); a class typed into the page instead would be styling the
 * manifest does not carry, which is the one thing a specimen must never show.
 */
import { classesFor } from './manifest-classes.js';

/** @param {string} tag @param {object} [props] `class`, `text`, and any attribute
 *  @param {...(Node|string)} children @returns {HTMLElement} */
export function el(tag, props = {}, ...children) {
  const node = tag === 'svg' || tag === 'path' || tag === 'circle'
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'class') node.setAttribute('class', v);
    else node.setAttribute(k, String(v));
  }
  for (const child of children) node.append(child);
  return node;
}

/** @param {string} label @param {(Node|string)[]} nodes @returns {{label: string, nodes: (Node|string)[]}} */
export function section(label, nodes) {
  return { label, nodes };
}

/** Renders the sections into `mount`, each under its micro-label.
 *  @param {{sections: {label: string, nodes: (Node|string)[]}[], mount?: Element}} opts */
export function mountSpecimen({ sections, mount = document.getElementById('root') }) {
  for (const { label, nodes } of sections) {
    mount.append(el('div', { class: 'sub', text: label }));
    const row = el('div', { class: 'row' });
    for (const node of nodes) row.append(node);
    mount.append(row);
  }
}

export { classesFor };
```

- [ ] **Step 6: Prove the harness against the manifest that already exists**

`Tag.manifest.json` has shipped since plan 3 and has never been looked at — it is the
right first specimen, and writing it here means the harness is exercised by the task
that builds it rather than by the next one.

Create `frameworks/tailwind/components/Tag.card.html`:

```html
<!-- @dsCard group="Angular" viewport="640x220" name="Tag" subtitle="The five tones, rendered from Tag.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Tag.manifest.json')).json();

function tag(tone, label) {
  const c = classesFor(manifest, { tone });
  return el('span', { class: c.root }, el('span', { class: c.dot }), label);
}

mountSpecimen({ sections: [
  section('Tones', [
    tag('neutral', 'Draft'), tag('primary', 'Active'), tag('success', 'Live'),
    tag('warning', 'Degraded'), tag('danger', 'Blocked'),
  ]),
]});
</script></body></html>
```

Run `bun run build:tailwind`, then open
`http://localhost:8000/frameworks/tailwind/components/Tag.card.html` with `bun run demos`
running. Five pills, each an **outline** with a dot in its own colour — `danger` included,
because danger is outline. If the page renders unstyled, `utilities.css` is stale.

- [ ] **Step 7: Run the tests**

Run: `bun test scripts/manifest-classes.test.mjs scripts/tailwind-vocabulary.test.mjs`
Expected: all pass. If a `tailwind-vocabulary` case fails, **stop and read it** —
a utility the ledger promises does not exist, and every later task is built on that
promise. Fix the ledger (in this plan) and the failing entry together; do not delete
the assertion.

- [ ] **Step 8: Run the whole suite and commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 10 step(s) passed` (the two new test files run inside the
`test` step).

```bash
git add frameworks/tailwind/manifest-classes.js frameworks/tailwind/specimen.js \
        frameworks/tailwind/components/Tag.card.html frameworks/tailwind/utilities.css \
        scripts/manifest-classes.test.mjs scripts/tailwind-vocabulary.test.mjs \
        scripts/lib/tailwind-compile.mjs
git commit -m "feat(tailwind): render a manifest, so a primitive is reviewable by eye"
```

---

## Task 3: The Angular typecheck gate

Gate 2 from the spec. `tag` has sat unexercised since it was written because nothing
in the repo can compile Angular. Eighteen more primitives on those terms would repeat
that failure eighteen times, so the compiler lands before the primitives do — and the
first thing it compiles is `tag`, which has never been compiled at all.

**Files:**
- Create: `frameworks/angular/tsconfig.check.json`
- Create: `scripts/check-angular.mjs`
- Create: `scripts/check-angular.test.mjs`
- Modify: `package.json` (devDependencies + one script)
- Modify: `scripts/check-all.mjs` (one step)

**Interfaces:**
- Consumes: `repoRoot` from `scripts/lib/tailwind-compile.mjs`.
- Produces: `typecheck({root?}) -> {status: number, output: string}`;
  `bun run check:angular`.

- [ ] **Step 1: Install the Angular toolchain**

Angular 22 pins its own TypeScript range (`>=6.0 <6.1`), so the versions are not a
free choice — read them off the peer ranges rather than picking latest for each.
`zone.js` is deliberately absent: nothing in the layer imports it, the primitives are
zoneless-ready, and a peer nothing uses is a dependency to explain later.

Run:
```bash
bun add -d @angular/core@22.0.7 @angular/common@22.0.7 @angular/compiler@22.0.7 \
           @angular/compiler-cli@22.0.7 typescript@6.0.3 rxjs@7.8.2 tslib@2.8.1 \
           ng-packagr@22.0.1
```

Expected: `package.json`'s `devDependencies` gains the eight entries and
`bun.lock` updates.

`ng-packagr` is installed and **not used by this plan** — that is the spec's
instruction: plan 6 packages the layer and must find it present rather than adding it
at publish time. Add this line to `package.json` nowhere; record it in the commit
message in Step 9 instead.

- [ ] **Step 2: Write the typecheck project**

Create `frameworks/angular/tsconfig.check.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": false,
    "useDefineForClassFields": false
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "extendedDiagnostics": { "defaultCategory": "error" }
  },
  "files": ["./index.ts"]
}
```

`"files": ["./index.ts"]` is the whole layer by construction: `index.ts` re-exports
`primitives`, `theme/theme-service` and `icons/icon-manifest`, and `primitives/index.ts`
re-exports every primitive. A primitive missing from the barrel is therefore not
typechecked — which is why "an entry in the barrel" is part of the quartet and part of
every commit below.

- [ ] **Step 3: Write the failing test**

Create `scripts/check-angular.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { typecheck } from './check-angular.mjs';

test('the Angular layer as committed typechecks', () => {
  const { status, output } = typecheck();
  assert.equal(status, 0, output);
});

test('a template referencing a member that does not exist fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-ng-'));
  try {
    cpSync(join(repoRoot, 'frameworks'), join(dir, 'frameworks'), { recursive: true });
    cpSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'), { recursive: true, dereference: false });
    const tag = join(dir, 'frameworks/angular/primitives/tag/tag.ts');
    writeFileSync(tag, readFileSync(tag, 'utf8').replace('styles().root()', 'styles().nosuchslot()'));
    const { status, output } = typecheck({ root: dir });
    assert.notEqual(status, 0);
    assert.match(output, /nosuchslot/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

The second case is the one that matters. A gate that only ever reports success has
never been shown to report anything, and "the template typechecker is actually on"
is precisely what `strictTemplates` in a JSON file does not prove.

- [ ] **Step 4: Run it and confirm it fails**

Run: `bun test scripts/check-angular.test.mjs`
Expected: FAIL — `Cannot find module './check-angular.mjs'`.

- [ ] **Step 5: Write the gate**

Create `scripts/check-angular.mjs`:

```js
/* Typechecks the Angular layer, templates included.
 *
 * React's specimens work because jsx-loader.js transpiles JSX in the browser
 * with Babel standalone. Angular cannot do that — decorators and templates need
 * real compilation — so the layer's only proof that it is valid is this gate.
 * It is what stops an Angular primitive shipping in the state `tag` shipped in:
 * written, plausible, never once compiled.
 *
 * `ngc` rather than an ng-packagr build: the question here is "does every
 * template reference something that exists, under strictTemplates", which is
 * the template typechecker's, and packaging brings config and output that
 * answer a different question (plan 6's). Emission goes to a temp dir and is
 * deleted — nothing is written into the repository.
 *
 * Spawned as `process.execPath <bin>` for the same reason the Tailwind gate is:
 * identical behaviour under bun and node, no shell, no package runner.
 *
 *   bun scripts/check-angular.mjs      -> exit 0 if the layer typechecks, 1 otherwise
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

/** Compile frameworks/angular with ngc under strictTemplates.
 *  @param {{root?: string}} [opts]
 *  @returns {{status: number, output: string}} */
export function typecheck(opts = {}) {
  const root = opts.root ?? repoRoot;
  const bin = join(root, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js');
  const project = join(root, 'frameworks/angular/tsconfig.check.json');
  const out = mkdtempSync(join(tmpdir(), 'arena-ngc-'));
  try {
    const r = spawnSync(process.execPath, [bin, '-p', project, '--outDir', out], { encoding: 'utf8' });
    if (r.error) throw new Error(`ngc failed to spawn: ${r.error.message || r.error}`);
    return { status: r.status ?? 1, output: `${r.stdout || ''}${r.stderr || ''}` };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

function main() {
  const { status, output } = typecheck();
  if (status !== 0) {
    console.error('check-angular: the Angular layer does not typecheck\n');
    console.error(output.trim());
    process.exit(1);
  }
  console.log('check-angular: the layer typechecks under strictTemplates');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 6: Run the gate against `tag`**

Run: `bun scripts/check-angular.mjs`
Expected: `check-angular: the layer typechecks under strictTemplates`.

**If it fails on the JSON import** (`tag.variants.ts` does
`import manifest from '…Tag.manifest.json' with { type: 'json' }`), that is a real
finding about the reference shape, not a gate bug, and it has exactly two acceptable
resolutions — pick the first that works and record which in the commit message:

  1. **`resolveJsonModule` is already on** in the project above; if the failure is the
     import *attribute* syntax rather than the resolution, drop `with { type: 'json' }`
     from `tag.variants.ts`. The attribute is what a runtime needs; `ngc` typechecks
     against the resolved JSON either way, and the packaged output (plan 6) inlines it.
  2. If JSON resolution itself is refused, the manifest reaches the recipe through a
     generated `.ts` instead: extend `scripts/build-tailwind.mjs` to also emit
     `frameworks/tailwind/components/<Component>.manifest.ts`
     (`export default { … } as const;`) beside each JSON, have `check-tailwind-generated.mjs`
     cover those files too, and import that. The JSON stays the source of truth and
     the authored artifact; the `.ts` is build output like `utilities.css`.

Whichever branch runs, `tag.variants.ts` is the reference shape every later task
copies — so fix it here, once, and copy the fixed shape.

- [ ] **Step 7: Run the tests**

Run: `bun test scripts/check-angular.test.mjs`
Expected: 2 pass. The second case takes a while (it copies `node_modules`); that is
the cost of proving the gate can fail, and it is paid once.

- [ ] **Step 8: Wire it in**

In `package.json`, add after `"check:fonts"`:

```json
    "check:angular": "bun scripts/check-angular.mjs",
```

In `scripts/check-all.mjs`, add the step last among the gates (before the test step),
matching the surrounding shape:

```js
  ['check:angular', ['scripts/check-angular.mjs']],
```

- [ ] **Step 9: Run the whole suite and commit**

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`

```bash
git add package.json bun.lock frameworks/angular/tsconfig.check.json \
        scripts/check-angular.mjs scripts/check-angular.test.mjs scripts/check-all.mjs \
        frameworks/angular/primitives/tag/tag.variants.ts
git commit -m "feat(angular): compile the layer, and fail when a template lies

ng-packagr is installed here rather than in plan 6, per the parity spec: the
packaging plan runs after this work and must find the toolchain present.
This gate does not use it — ngc answers the template question directly."
```

---

## The shape of a slice (Tasks 4–17)

Fourteen tasks follow the same six steps against a different component. The shape is
stated once here; each task then gives the actual content, in full, for its own
component. `frameworks/angular/primitives/tag/` is the shape in the tree, and
`Tag.manifest.json` is the manifest in the tree — read both before Task 4.

1. **The manifest** — `frameworks/tailwind/components/<Component>.manifest.json`.
   A translation of the React component's inline styles through the ledger above.
   Slot names are the component's parts (`root`, `box`, `label`…), variants are its
   enumerated props. **A prop that is not enumerable is not a variant** — a
   boolean-driven single class is a variant with `true`/`false` values; free text and
   numbers are template bindings, never classes.
2. **The recipe** — `frameworks/angular/primitives/<name>/<name>.variants.ts`.
   Four lines, identical every time except the two names.
3. **The primitive** — `<name>.ts`. Standalone, `OnPush`, `arena-` selector, signal
   inputs mirroring React's props, `computed(() => <name>Styles({…}))`, one JSDoc line.
4. **The prompt** — `<name>.prompt.md`. What it is, an HTML example, Do/Don't.
5. **The barrel** — `<name>/index.ts` (two exports) plus one line in
   `frameworks/angular/primitives/index.ts`. **The barrel line is what puts the
   primitive in front of the typechecker** (`tsconfig.check.json` compiles `index.ts`),
   so it is never a follow-up.
6. **The specimen** — `frameworks/tailwind/components/<Component>.card.html`, built on
   `specimen.js`.

Then, every time, before committing:

```bash
bun run build:tailwind      # the new manifest's classes must reach utilities.css
bun run check               # 11 gates + the test suite
```

and by eye, once, with `bun run demos` running:
`http://localhost:8000/frameworks/tailwind/components/<Component>.card.html` — in dark,
in light (toggle `class="arena-light"` on `<html>` in devtools), and in `.arena-compact`
(add the class to `<body>`), compared against the React card page named in the task.

**Where React and the token layer disagree, the token layer wins** — plan 4 settled
that, and this plan does not relitigate it per component. After plan 4.5 a manifest can
also carry a *derivation*, so the case that used to force a compromise no longer does:
a ratio like Avatar's initials stays exact as
`text-[length:calc(var(--avatar-md)*0.4)]` instead of snapping to the nearest step of
the type scale.

---

## Task 4: Avatar

**Reference:** `frameworks/react/components/display/Avatar.jsx`, demoed in
`frameworks/react/components/display/table-avatar.card.html`.

**Files:**
- Create: `frameworks/tailwind/components/Avatar.manifest.json`
- Create: `frameworks/tailwind/components/Avatar.card.html`
- Create: `frameworks/angular/primitives/avatar/{avatar.ts,avatar.variants.ts,avatar.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `Avatar` (selector `arena-avatar`), inputs `src?: string`, `name: string`,
  `size: 'xs'|'sm'|'md'|'lg'`, `shape: 'circle'|'rounded'`, `status?: 'online'|'busy'|'away'|'offline'`;
  `avatarStyles` from `avatar.variants.ts`.

**The ratios are exact, and they are exact in CSS.** React scales the initials at
`diameter * 0.4` and the presence dot at `max(8px, diameter * 0.28)`. Plan 4.5 put those
diameters in tokens (`--avatar-xs|sm|md|lg`) and made a derivation legal inside a
bracket, so the manifest carries the same arithmetic the browser will do — no snapping
to the nearest step of the type scale, no ratio in the component, and no exemption. The
Angular primitive and `Avatar.jsx` now compute the same two values the same way.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Avatar.manifest.json`:

```json
{
  "component": "Avatar",
  "slots": {
    "root": "relative inline-flex shrink-0",
    "box": "inline-flex items-center justify-center overflow-hidden bg-base-300 border-[length:var(--bw)] border-neutral font-display font-extrabold tracking-normal text-base-content/82",
    "image": "w-full h-full object-cover",
    "status": "absolute right-0 bottom-0 rounded-full border-[length:var(--bw-strong)] border-base-200"
  },
  "variants": {
    "size": {
      "xs": { "root": "size-avatar-xs", "box": "size-avatar-xs text-[length:calc(var(--avatar-xs)*0.4)]", "status": "size-[max(calc(var(--sp-1)*2),calc(var(--avatar-xs)*0.28))]" },
      "sm": { "root": "size-avatar-sm", "box": "size-avatar-sm text-[length:calc(var(--avatar-sm)*0.4)]", "status": "size-[max(calc(var(--sp-1)*2),calc(var(--avatar-sm)*0.28))]" },
      "md": { "root": "size-avatar-md", "box": "size-avatar-md text-[length:calc(var(--avatar-md)*0.4)]", "status": "size-[max(calc(var(--sp-1)*2),calc(var(--avatar-md)*0.28))]" },
      "lg": { "root": "size-avatar-lg", "box": "size-avatar-lg text-[length:calc(var(--avatar-lg)*0.4)]", "status": "size-[max(calc(var(--sp-1)*2),calc(var(--avatar-lg)*0.28))]" }
    },
    "shape": {
      "circle": { "box": "rounded-full" },
      "rounded": { "box": "rounded-md" }
    },
    "status": {
      "none": {},
      "online": { "status": "bg-success" },
      "busy": { "status": "bg-error" },
      "away": { "status": "bg-warning" },
      "offline": { "status": "bg-base-content/52" }
    }
  },
  "defaultVariants": { "size": "md", "shape": "circle", "status": "none" }
}
```

- [ ] **Step 2: Write the recipe**

Create `frameworks/angular/primitives/avatar/avatar.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Avatar.manifest.json' with { type: 'json' };

export const avatarStyles = tv(manifest);
```

(If Task 3 Step 6 landed on branch 1 or 2, use the shape it settled on — every
`.variants.ts` in this plan follows `tag.variants.ts` as it stands after Task 3.)

- [ ] **Step 3: Write the primitive**

Create `frameworks/angular/primitives/avatar/avatar.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { avatarStyles } from './avatar.variants';

type Size = 'xs' | 'sm' | 'md' | 'lg';
type Shape = 'circle' | 'rounded';
type Status = 'online' | 'busy' | 'away' | 'offline';

/** Person or entity mark — the image when `src` is set, initials from `name` otherwise. */
@Component({
  selector: 'arena-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="styles().root()">
      <span [class]="styles().box()">
        @if (src(); as source) {
          <img [src]="source" [alt]="name()" [class]="styles().image()" />
        } @else {
          {{ initials() }}
        }
      </span>
      @if (status(); as presence) {
        <span [class]="styles().status()" [attr.aria-label]="presence" [title]="presence"></span>
      }
    </span>
  `,
})
export class Avatar {
  readonly src = input<string>();
  readonly name = input('');
  readonly size = input<Size>('md');
  readonly shape = input<Shape>('circle');
  readonly status = input<Status>();

  protected readonly styles = computed(() =>
    avatarStyles({ size: this.size(), shape: this.shape(), status: this.status() ?? 'none' }));

  protected readonly initials = computed(() =>
    this.name().trim().split(/\s+/).slice(0, 2).map((word) => word[0] ?? '').join('').toUpperCase());
}
```

- [ ] **Step 4: Write the prompt**

Create `frameworks/angular/primitives/avatar/avatar.prompt.md`:

```markdown
Arena avatar — a person's or team's mark. `src` renders the image; without it the
initials of `name` render on the raised surface, so `name` is always worth passing.
`shape="circle"` is a person, `shape="rounded"` a team or organisation. `status` adds
a presence dot. Styling is the sibling `avatar.variants.ts` recipe; the component
carries no CSS classes of its own.

```html
<arena-avatar name="Juan Carlos Hidalgo" />
<arena-avatar name="Delivery" shape="rounded" size="sm" />
<arena-avatar [src]="user.photo" [name]="user.name" size="lg" status="online" />
```

**Do / Don't**
- Always pass `name`, even with `src`: it is the image's `alt` text and the fallback
  when the image fails to load.
- Don't use the presence dot as a status badge for anything but presence — the
  offline tone is a muted grey by design and reads as "not here", not as "disabled".
- Don't put an avatar in place of an icon. It represents a person or an entity; a
  role or an action is an icon.
```

- [ ] **Step 5: Write the barrels**

Create `frameworks/angular/primitives/avatar/index.ts`:

```ts
export * from './avatar';
export * from './avatar.variants';
```

In `frameworks/angular/primitives/index.ts`, add the export in alphabetical order:

```ts
export * from './avatar';
export * from './tag';
```

- [ ] **Step 6: Write the specimen**

Create `frameworks/tailwind/components/Avatar.card.html`:

```html
<!-- @dsCard group="Angular" viewport="700x320" name="Avatar" subtitle="Sizes, shapes and presence, rendered from Avatar.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Avatar.manifest.json')).json();

function avatar(opts, initials) {
  const c = classesFor(manifest, opts);
  const root = el('span', { class: c.root }, el('span', { class: c.box, text: initials }));
  if (opts.status && opts.status !== 'none') root.append(el('span', { class: c.status }));
  return root;
}

mountSpecimen({ sections: [
  section('Sizes', ['xs', 'sm', 'md', 'lg'].map((size) => avatar({ size }, 'JH'))),
  section('Shapes', [avatar({ shape: 'circle' }, 'JH'), avatar({ shape: 'rounded' }, 'DV')]),
  section('Presence', ['online', 'busy', 'away', 'offline'].map((status) => avatar({ status }, 'JH'))),
]});
</script></body></html>
```

- [ ] **Step 7: Rebuild, gate, and look at it**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`. `check-tailwind` now reports 3 manifests.

Run `bun run demos`, open
`http://localhost:8000/frameworks/tailwind/components/Avatar.card.html`, and check
against `frameworks/react/components/display/table-avatar.card.html`. Both sides derive
the initials and the dot from the same tokens with the same multipliers, so this is a
**pixel-identical** comparison at all four sizes, not an approximate one — a visible
difference means a `calc()` in the manifest disagrees with `Avatar.jsx`. Then in light
(`arena-light` on `<html>`) and in `.arena-compact` on `<body>`.

- [ ] **Step 8: Commit**

```bash
git add frameworks/tailwind/components/Avatar.manifest.json \
        frameworks/tailwind/components/Avatar.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/avatar frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the avatar primitive, styled by its manifest"
```

---

## Task 5: Skeleton, and the two animations a utility cannot express

**Reference:** `frameworks/react/components/display/Skeleton.jsx`, demoed in
`frameworks/react/components/display/skeleton.card.html`.

React ships the shimmer as a `<style>` injected once into the head, because keyframes
are the one thing an inline style object cannot hold. The Tailwind layer has the same
boundary one level over: **a manifest holds class names, so keyframes live in the
layer's own CSS**, compiled into `utilities.css` with everything else. This task adds
that file and its first two utilities; Task 17 (Rotor) is its only other consumer in
this plan.

The reduced-motion answers are React's, and they are not the same answer twice:
the shimmer is decorative, so it **stops**; the rotor reports work, so it **slows**.

**Files:**
- Create: `frameworks/tailwind/animations.css`
- Create: `frameworks/tailwind/components/Skeleton.manifest.json`
- Create: `frameworks/tailwind/components/Skeleton.card.html`
- Create: `frameworks/angular/primitives/skeleton/{skeleton.ts,skeleton.variants.ts,skeleton.prompt.md,index.ts}`
- Modify: `frameworks/tailwind/theme.css` (one `@import`)
- Modify: `frameworks/tailwind/README.md` (what animations.css is for)
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: the `arena-shimmer` and `arena-rotor-spin` utilities; `Skeleton`
  (selector `arena-skeleton`), inputs `variant: 'text'|'line'|'block'|'circle'`,
  `lines: number`; `skeletonStyles`.

- [ ] **Step 1: Write the animations**

Create `frameworks/tailwind/animations.css`:

```css
/* frameworks/tailwind/animations.css
   Keyframes and the two utilities that ride them. Imported by theme.css, so
   `bun run build:tailwind` compiles them into utilities.css with everything
   else and a manifest reaches them by name.

   This is the Tailwind layer's version of a boundary React already has: an
   inline style object cannot express @keyframes, so React injects a <style>
   once per component; a manifest cannot express them either, so they are
   authored here rather than smuggled into a bracket. Every value below is a
   var() into a token, the durations included: plan 4.5 named them in the
   --loop-* family precisely because a loop is not a transition, so nothing here
   restates a number React also states.

   Reduced motion is answered per animation, and the answers differ on purpose:
   the shimmer is decorative, so it stops outright; the rotor reports work in
   progress, so it slows — a frozen rotor reads as a hung process. */

@keyframes arena-shimmer {
  0% { background-position: -140% 0; }
  100% { background-position: 140% 0; }
}

@keyframes arena-rotor {
  to { transform: rotate(360deg); }
}

@utility arena-shimmer {
  background-image: linear-gradient(100deg, var(--color-base-200) 30%, var(--color-base-300) 50%, var(--color-base-200) 70%);
  background-size: 220% 100%;
  animation: arena-shimmer var(--loop-shimmer) var(--ease-in-out) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-image: none;
    background-color: var(--color-base-200);
  }
}

@utility arena-rotor-spin {
  animation: arena-rotor var(--loop-brand) linear infinite;
  transform-origin: 50% 50%;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: var(--loop-brand-reduced);
  }
}
```

The shimmer's gradient is the sole exception `CLAUDE.md` already grants ("No gradients
on any surface (the sole exception is `Skeleton`'s neutral shimmer)") — do not
generalise it.

In `frameworks/tailwind/theme.css`, add the import immediately after
`@import 'tailwindcss';`:

```css
@import './animations.css';
```

- [ ] **Step 2: Prove the utilities compile**

Run: `bun run build:tailwind && grep -c 'arena-shimmer' frameworks/tailwind/utilities.css`
Expected: `0` — a `@utility` is emitted only when something uses it, which is the
point of `source(none)`. It appears once the manifest below declares it; Step 6
re-checks.

- [ ] **Step 3: Write the manifest**

Create `frameworks/tailwind/components/Skeleton.manifest.json`:

```json
{
  "component": "Skeleton",
  "slots": {
    "root": "arena-shimmer",
    "stack": "flex flex-col gap-2.5 w-full",
    "line": "arena-shimmer h-3 rounded-xs w-full",
    "lastLine": "arena-shimmer h-3 rounded-xs w-[62%]"
  },
  "variants": {
    "variant": {
      "text": { "root": "hidden" },
      "line": { "root": "h-3 w-full rounded-xs" },
      "block": { "root": "h-24 w-full rounded-sm" },
      "circle": { "root": "size-10 rounded-full" }
    }
  },
  "defaultVariants": { "variant": "block" }
}
```

`text` hides `root` because that variant renders the `stack` of `line`s instead —
the manifest carries both shapes and the template picks one, which is the same
branch React's `Skeleton.jsx` takes.

- [ ] **Step 4: Write the recipe and the primitive**

Create `frameworks/angular/primitives/skeleton/skeleton.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Skeleton.manifest.json' with { type: 'json' };

export const skeletonStyles = tv(manifest);
```

Create `frameworks/angular/primitives/skeleton/skeleton.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { skeletonStyles } from './skeleton.variants';

type Variant = 'text' | 'line' | 'block' | 'circle';

/** Loading placeholder that reserves the space the real content will take. */
@Component({
  selector: 'arena-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (stacked()) {
      <div [class]="styles().stack()" role="status" aria-label="Loading">
        @for (row of rows(); track row) {
          <div [class]="row === rows().length ? styles().lastLine() : styles().line()"></div>
        }
      </div>
    } @else {
      <div [class]="styles().root()" role="status" aria-label="Loading"></div>
    }
  `,
})
export class Skeleton {
  readonly variant = input<Variant>('block');
  readonly lines = input(3);

  protected readonly styles = computed(() => skeletonStyles({ variant: this.variant() }));
  protected readonly stacked = computed(() => this.variant() === 'text' && this.lines() > 1);
  protected readonly rows = computed(() => Array.from({ length: this.lines() }, (_, i) => i + 1));
}
```

- [ ] **Step 5: Write the prompt and the barrels**

Create `frameworks/angular/primitives/skeleton/skeleton.prompt.md`:

```markdown
Arena loading placeholder. It reserves the layout the real content will occupy, so a
table or a dashboard fills in rather than jumping. `variant="text"` with `lines`
renders a stack whose last line is short, the way a paragraph ends; `line`, `block`
and `circle` are single shapes. Styling is the sibling `skeleton.variants.ts` recipe.

```html
<arena-skeleton variant="text" [lines]="3" />
<arena-skeleton variant="circle" />
<arena-skeleton variant="block" />
```

**Do / Don't**
- Match the placeholder to the shape of what is loading — a circle for an avatar, a
  block for a card. A placeholder that does not match the content is a layout jump
  with extra steps.
- Don't animate a skeleton that will be on screen for more than a moment or two: the
  shimmer stops entirely under `prefers-reduced-motion`, and it is decoration, not a
  progress report. Use `mat-progress-bar` when there is real progress to report.
- Don't wrap a skeleton in a live region of your own — it already carries
  `role="status"`.
```

Create `frameworks/angular/primitives/skeleton/index.ts`:

```ts
export * from './skeleton';
export * from './skeleton.variants';
```

Add `export * from './skeleton';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./avatar`).

- [ ] **Step 6: Write the specimen**

Create `frameworks/tailwind/components/Skeleton.card.html`:

```html
<!-- @dsCard group="Angular" viewport="700x320" name="Skeleton" subtitle="Loading placeholders, rendered from Skeleton.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Skeleton.manifest.json')).json();

function single(variant) {
  const c = classesFor(manifest, { variant });
  const box = el('div', { class: c.root });
  box.style.width = variant === 'circle' ? '' : '160px';
  return box;
}

function stacked(lines) {
  const c = classesFor(manifest, { variant: 'text' });
  const stack = el('div', { class: c.stack });
  stack.style.width = '220px';
  for (let i = 1; i <= lines; i++) stack.append(el('div', { class: i === lines ? c.lastLine : c.line }));
  return stack;
}

mountSpecimen({ sections: [
  section('Single shapes', ['line', 'block', 'circle'].map(single)),
  section('Text, three lines', [stacked(3)]),
]});
</script></body></html>
```

The two `style.width` assignments are the specimen's own layout, not the component's —
a `Skeleton` takes its width from the container it reserves space in, which is a
caller's decision in React and in Angular alike.

- [ ] **Step 7: Document animations.css**

In `frameworks/tailwind/README.md`, after the "What the preset exposes" section, add:

```markdown
## Two animations live in CSS, and why

`animations.css` holds `@keyframes` and the two utilities that ride them —
`arena-shimmer` (Skeleton) and `arena-rotor-spin` (Rotor) — because a manifest
holds class names and keyframes are not one. It is the same boundary React
already has: an inline style object cannot express keyframes either, so React
injects a `<style>` once per component. Every value in it is a `var()` into a
token, and each animation answers `prefers-reduced-motion` on its own terms —
decorative motion stops, motion that reports work slows.
```

- [ ] **Step 8: Rebuild, gate, and look at it**

Run: `bun run build:tailwind && grep -c 'arena-shimmer' frameworks/tailwind/utilities.css`
Expected: at least `2` (the keyframes and the utility) — the manifest now uses it.

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`.

Open `http://localhost:8000/frameworks/tailwind/components/Skeleton.card.html` beside
React's `display/skeleton.card.html`: the same warm sweep, the same short last line.
Then set "reduce motion" in the OS or devtools and confirm the sweep **stops** and the
surface stays `base-200`.

- [ ] **Step 9: Commit**

```bash
git add frameworks/tailwind/animations.css frameworks/tailwind/theme.css \
        frameworks/tailwind/README.md \
        frameworks/tailwind/components/Skeleton.manifest.json \
        frameworks/tailwind/components/Skeleton.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/skeleton frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the skeleton primitive, and a home for keyframes"
```

---

## Task 6: StatCard

**Reference:** `frameworks/react/components/display/StatCard.jsx`, demoed in
`frameworks/react/components/display/display.card.html`.

The delta pill's colour says whether the change is **good**, not which way it points —
`deltaTone` and `deltaDirection` are separate props because they are separate facts,
and both signs are outline. Keep that split; it is one half of the component's design.

**StatCard has a second, independent tone dimension.** `tone` colours the value
itself — what state the number IS in right now, not whether it moved well. A
service at 99.98% uptime is healthy whether or not it improved this week, and two
open incidents are two open incidents even when that is down from five. `tone` and
`deltaTone` can disagree in the same tile (`tone="danger"` with a `deltaTone="positive"`
delta — a bad state that is improving), and React's own `display.card.html` demoes
exactly that combination. The vocabulary is Badge's tone names, deliberately, reused
rather than inventing a near-duplicate second set — see `StatCard.jsx`'s `VALUE_TONES`
comment block, directly below its `DELTA_TONES` block. Danger applies to `tone` the
same way it applies to `deltaTone`: text only, never a filled background.

**Files:**
- Create: `frameworks/tailwind/components/StatCard.manifest.json`
- Create: `frameworks/tailwind/components/StatCard.card.html`
- Create: `frameworks/angular/primitives/stat-card/{stat-card.ts,stat-card.variants.ts,stat-card.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `StatCard` (selector `arena-stat-card`), inputs `label: string`,
  `value: string`, `tone: 'neutral'|'accent'|'gold'|'success'|'warning'|'danger'|'info'`,
  `sub?: string`, `deltaValue?: string`,
  `deltaTone: 'neutral'|'positive'|'negative'`, `deltaDirection: 'up'|'down'`;
  `statCardStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/StatCard.manifest.json`:

```json
{
  "component": "StatCard",
  "slots": {
    "root": "flex flex-col gap-2 bg-base-200 border-[length:var(--bw)] border-base-300 rounded-lg p-5 min-h-30",
    "head": "flex items-center justify-between gap-3",
    "label": "font-mono text-ctl-2xs tracking-label uppercase text-base-content/62",
    "icon": "inline-flex text-[length:var(--icon-sm)] text-base-content/62 opacity-60",
    "value": "font-display font-extrabold text-h2 leading-snug tabular-nums",
    "delta": "self-start inline-flex items-center gap-1 rounded-pill px-2 py-0.5 bg-transparent border-[length:var(--bw)] font-body text-ctl-sm font-semibold",
    "sub": "font-body text-ctl-sm text-base-content/62"
  },
  "variants": {
    "tone": {
      "neutral": { "value": "text-base-content" },
      "accent": { "value": "text-primary" },
      "gold": { "value": "text-secondary" },
      "success": { "value": "text-success" },
      "warning": { "value": "text-warning" },
      "danger": { "value": "text-error" },
      "info": { "value": "text-info" }
    },
    "deltaTone": {
      "neutral": { "delta": "border-neutral text-base-content/62" },
      "positive": { "delta": "border-success text-success" },
      "negative": { "delta": "border-error text-error" }
    }
  },
  "defaultVariants": { "tone": "neutral", "deltaTone": "neutral" }
}
```

`min-h-30` is `calc(var(--sp-1) * 30)` = 120px, React's `minHeight`. `tabular-nums`
is Tailwind's own `font-variant-numeric` utility, not a token — it is a typographic
mode, not a value. `tone` colours the `value` slot only, mirroring React's
`VALUE_TONES` map (`StatCard.jsx`) through the ledger: `--bone` -> `text-base-content`,
`--crimson` -> `text-primary`, `--gold` -> `text-secondary`, `--success` ->
`text-success`, `--warning` -> `text-warning`, `--danger` -> `text-error`, `--info`
-> `text-info`. The `value` slot's base string carries no colour of its own — the
`neutral` variant supplies it, the same shape Tag's `root` uses for its `tone`
default, so a consumer that leaves `tone` unset still gets the same colour as before
this dimension existed.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/stat-card/stat-card.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/StatCard.manifest.json' with { type: 'json' };

export const statCardStyles = tv(manifest);
```

Create `frameworks/angular/primitives/stat-card/stat-card.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { statCardStyles } from './stat-card.variants';

type Tone = 'neutral' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'info';
type DeltaTone = 'neutral' | 'positive' | 'negative';
type Direction = 'up' | 'down';

/** One metric on a dashboard: a micro-label, the number, and an optional delta pill.
 *  `tone` says what state the number IS in right now; `deltaTone` says whether its
 *  last change was good, and `deltaDirection` says which way it pointed — three
 *  separate facts, and `tone` colours the value while `deltaTone` colours the pill.
 *  Per this plan's established host-binding shape (see `slice-rules.md`), the host
 *  itself is the recipe's `root`, not a wrapper `<div>` inside the template. */
@Component({
  selector: 'arena-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    <div [class]="styles().head()">
      <span [class]="styles().label()">{{ label() }}</span>
      @if (icon(); as glyph) {
        <span [class]="styles().icon()" aria-hidden="true"><i [class]="glyph"></i></span>
      }
    </div>
    <div [class]="styles().value()">{{ value() }}</div>
    @if (deltaValue(); as delta) {
      <span [class]="styles().delta()">
        <i [class]="deltaDirection() === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up'" aria-hidden="true"></i>
        {{ delta }}
      </span>
    }
    @if (sub(); as caption) {
      <span [class]="styles().sub()">{{ caption }}</span>
    }
  `,
})
export class StatCard {
  readonly label = input('');
  readonly value = input('');
  readonly tone = input<Tone>('neutral');
  readonly sub = input<string>();
  readonly icon = input<string>();
  readonly deltaValue = input<string>();
  readonly deltaTone = input<DeltaTone>('neutral');
  readonly deltaDirection = input<Direction>('up');

  protected readonly styles = computed(() => statCardStyles({ tone: this.tone(), deltaTone: this.deltaTone() }));
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/stat-card/stat-card.prompt.md`:

```markdown
Arena metric tile. A mono micro-label, the number in display weight, and an optional
delta pill. Two tone dimensions answer two different questions about the same
number, and neither implies the other:

- `tone` says what state the number **IS in right now** — colors the value itself.
  A service at 99.98% uptime is healthy whether or not it improved this week, and
  two open incidents are two open incidents even when that is down from five.
- `deltaTone` says whether the number's last change was **good**; `deltaDirection`
  says which way it pointed — colors the delta pill. Revenue down is bad, latency
  down is good, and the tile cannot know which metric it is showing.

A tile can legitimately show `tone="danger"` with `deltaTone="positive"` in the
same breath — a bad state that is improving is still a bad state. Styling is the
sibling `stat-card.variants.ts` recipe.

```html
<arena-stat-card label="Revenue" value="$48.2k" deltaValue="12%" deltaTone="positive" />
<arena-stat-card label="p95 latency" value="184ms" deltaValue="9%" deltaDirection="down" deltaTone="positive" />
<arena-stat-card label="Open incidents" value="3" tone="danger" deltaValue="2" deltaTone="positive" sub="2 acknowledged" />
```

**Do / Don't**
- Set `deltaTone` deliberately for every delta. The default is neutral, and a neutral
  delta on a metric where the direction matters is a missed signal, not a safe one.
- Set `tone` for what the number currently IS, not for how it moved — reach for
  `deltaTone`/`deltaDirection` for that instead.
- Don't fill the negative delta or the danger value. Both are text/outline in
  `--error` — like every other danger surface in Arena except `ConfirmDialog`'s
  final confirmation.
- Don't put a chart in a stat card — `arena-chart-card` is the tile that holds one.
```

Create `frameworks/angular/primitives/stat-card/index.ts`:

```ts
export * from './stat-card';
export * from './stat-card.variants';
```

Add `export * from './stat-card';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./skeleton`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/StatCard.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x1009" name="StatCard" subtitle="Metric tiles and delta tones, rendered from StatCard.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:stretch;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./StatCard.manifest.json')).json();

function tile({ label, value, delta, tone = 'neutral', deltaTone = 'neutral', direction = 'up', sub }) {
  const c = classesFor(manifest, { tone, deltaTone });
  const root = el('div', { class: c.root });
  root.style.width = '220px';
  root.append(el('div', { class: c.head }, el('span', { class: c.label, text: label })));
  root.append(el('div', { class: c.value, text: value }));
  if (delta) {
    root.append(el('span', { class: c.delta },
      el('i', { class: direction === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up', 'aria-hidden': 'true' }),
      delta));
  }
  if (sub) root.append(el('span', { class: c.sub, text: sub }));
  return root;
}

mountSpecimen({ sections: [
  section('Delta tones', [
    tile({ label: 'Revenue', value: '$48.2k', delta: '12%', deltaTone: 'positive' }),
    tile({ label: 'p95 latency', value: '184ms', delta: '9%', direction: 'down', deltaTone: 'positive' }),
    tile({ label: 'Open incidents', value: '3', delta: '2', deltaTone: 'negative', sub: 'since Friday' }),
  ]),
  section('Without a delta', [tile({ label: 'Active projects', value: '17', sub: 'across 6 clients' })]),
  section('Value tones -- what the number IS, independent of the delta', [
    tile({ label: 'Neutral', value: '128', tone: 'neutral' }),
    tile({ label: 'Accent', value: '$48.2k', tone: 'accent' }),
    tile({ label: 'Gold tier', value: 'Tier 1', tone: 'gold' }),
    tile({ label: 'Uptime', value: '99.98%', tone: 'success' }),
    tile({ label: 'Disk used', value: '82%', tone: 'warning' }),
    tile({ label: 'Errors', value: '3', tone: 'danger' }),
    tile({ label: 'Queued', value: '12', tone: 'info' }),
  ]),
  section('tone and deltaTone disagree on purpose -- a bad state that is improving', [
    tile({ label: 'Open incidents', value: '3', tone: 'danger', delta: '2', deltaTone: 'positive', direction: 'down', sub: '2 acknowledged' }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `display/display.card.html` in dark, light and `.arena-compact`.

```bash
git add frameworks/tailwind/components/StatCard.manifest.json \
        frameworks/tailwind/components/StatCard.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/stat-card frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the stat-card primitive"
```

---

## Task 7: Alert

**Reference:** `frameworks/react/components/feedback/Alert.jsx`, demoed in
`frameworks/react/components/feedback/alert.card.html`.

An Alert is persistent and embedded in the page — it stays until the condition is
resolved, unlike a Toast. Its tone tint is a *soft* surface (the status colour at
14–18%), which is not the filled danger the convention forbids: the border and the
content still carry the status colour at full strength.

**Files:**
- Create: `frameworks/tailwind/components/Alert.manifest.json`
- Create: `frameworks/tailwind/components/Alert.card.html`
- Create: `frameworks/angular/primitives/alert/{alert.ts,alert.variants.ts,alert.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `Alert` (selector `arena-alert`), inputs `tone: 'info'|'success'|'warning'|'danger'|'neutral'`,
  `title?: string`, `icon?: string`, `actionLabel?: string`, `dismissible: boolean`;
  outputs `action`, `closed`; `alertStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Alert.manifest.json`:

```json
{
  "component": "Alert",
  "slots": {
    "root": "flex gap-3 items-start px-4 py-3.5 rounded-md border-[length:var(--bw)]",
    "icon": "shrink-0 text-[length:var(--icon-lg)] leading-ctl",
    "body": "flex-1",
    "title": "font-body font-semibold text-ctl text-base-content",
    "message": "font-body text-sm text-base-content/82 leading-body",
    "action": "mt-2.5 bg-transparent border-none p-0 cursor-pointer font-mono text-ctl-sm font-bold tracking-uppercase-status uppercase",
    "close": "inline-flex items-center bg-transparent border-none cursor-pointer text-base-content/62 text-[length:var(--icon-md)] leading-ctl"
  },
  "variants": {
    "tone": {
      "info": { "root": "bg-info/16 border-info", "icon": "text-info", "action": "text-info" },
      "success": { "root": "bg-success/16 border-success", "icon": "text-success", "action": "text-success" },
      "warning": { "root": "bg-warning/18 border-warning", "icon": "text-warning", "action": "text-warning" },
      "danger": { "root": "bg-error/14 border-error", "icon": "text-error", "action": "text-error" },
      "neutral": { "root": "bg-base-200 border-neutral", "icon": "text-neutral", "action": "text-neutral" }
    }
  },
  "defaultVariants": { "tone": "info" }
}
```

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/alert/alert.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Alert.manifest.json' with { type: 'json' };

export const alertStyles = tv(manifest);
```

Create `frameworks/angular/primitives/alert/alert.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { alertStyles } from './alert.variants';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_ICONS: Record<Tone, string> = {
  info: 'ph-fill ph-info',
  success: 'ph-fill ph-check-circle',
  warning: 'ph-fill ph-warning',
  danger: 'ph-fill ph-warning-octagon',
  neutral: 'ph-fill ph-note',
};

/** Persistent in-page message. Stays until the condition it reports is resolved. */
@Component({
  selector: 'arena-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="styles().root()" [attr.role]="tone() === 'danger' ? 'alert' : 'status'">
      <i [class]="styles().icon() + ' ' + (icon() ?? toneIcon())" aria-hidden="true"></i>
      <div [class]="styles().body()">
        @if (title(); as heading) {
          <div [class]="styles().title()">{{ heading }}</div>
        }
        <div [class]="styles().message()"><ng-content /></div>
        @if (actionLabel(); as label) {
          <button type="button" [class]="styles().action()" (click)="action.emit()">{{ label }}</button>
        }
      </div>
      @if (dismissible()) {
        <button type="button" [class]="styles().close()" aria-label="Dismiss" (click)="closed.emit()">
          <i class="ph-bold ph-x" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
})
export class Alert {
  readonly tone = input<Tone>('info');
  readonly title = input<string>();
  readonly icon = input<string>();
  readonly actionLabel = input<string>();
  readonly dismissible = input(false);
  readonly action = output<void>();
  readonly closed = output<void>();

  protected readonly styles = computed(() => alertStyles({ tone: this.tone() }));
  protected readonly toneIcon = computed(() => TONE_ICONS[this.tone()]);
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/alert/alert.prompt.md`:

```markdown
Arena in-page message. Unlike a snackbar it is persistent: it belongs where the
condition it reports lives, and it stays until that condition is resolved. `tone`
carries the severity and picks the Phosphor Fill icon; `actionLabel` adds one
uppercase mono action; `dismissible` adds the single `ph-x` close control. Styling is
the sibling `alert.variants.ts` recipe.

```html
<arena-alert tone="warning" title="Deploy window closes in 20 minutes">
  Merge or park the release before 18:00 UTC.
</arena-alert>

<arena-alert tone="danger" title="Sync failed" actionLabel="Retry" dismissible
             (action)="retry()" (closed)="hide()">
  Three records could not be written.
</arena-alert>
```

**Do / Don't**
- Use `tone="danger"` only for a condition the user must act on. It renders
  `role="alert"`, which interrupts a screen reader; every other tone renders
  `role="status"`, which does not.
- Don't use an alert for something transient — that is `MatSnackBar` wearing Arena.
- Don't stack more than one alert in the same region. Two competing alerts read as
  one broken page; summarise instead.
```

Create `frameworks/angular/primitives/alert/index.ts`:

```ts
export * from './alert';
export * from './alert.variants';
```

Add `export * from './alert';` to `frameworks/angular/primitives/index.ts`, first in
alphabetical order.

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/Alert.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x420" name="Alert" subtitle="Tones, action and dismiss, rendered from Alert.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-direction:column;gap:calc(var(--sp-1) * 3.5);align-items:stretch;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Alert.manifest.json')).json();
const ICONS = { info: 'ph-fill ph-info', success: 'ph-fill ph-check-circle', warning: 'ph-fill ph-warning', danger: 'ph-fill ph-warning-octagon', neutral: 'ph-fill ph-note' };

function alert({ tone, title, message, actionLabel, dismissible }) {
  const c = classesFor(manifest, { tone });
  const body = el('div', { class: c.body },
    el('div', { class: c.title, text: title }),
    el('div', { class: c.message, text: message }));
  if (actionLabel) body.append(el('button', { class: c.action, type: 'button', text: actionLabel }));
  const root = el('div', { class: c.root }, el('i', { class: `${c.icon} ${ICONS[tone]}`, 'aria-hidden': 'true' }), body);
  if (dismissible) root.append(el('button', { class: c.close, type: 'button', 'aria-label': 'Dismiss' }, el('i', { class: 'ph-bold ph-x' })));
  return root;
}

mountSpecimen({ sections: [
  section('Tones', ['info', 'success', 'warning', 'danger', 'neutral'].map((tone) =>
    alert({ tone, title: `${tone[0].toUpperCase()}${tone.slice(1)} title`, message: 'One sentence saying what happened and what to do about it.' }))),
  section('With an action, dismissible', [
    alert({ tone: 'danger', title: 'Sync failed', message: 'Three records could not be written.', actionLabel: 'Retry', dismissible: true }),
  ]),
]});
</script></body></html>
```

Phosphor's webfont is loaded by `styles.css`; if a glyph renders as a box, that is the
font, not the manifest — check `assets/` before touching the class strings.

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `feedback/alert.card.html` in dark, light and `.arena-compact`.

```bash
git add frameworks/tailwind/components/Alert.manifest.json \
        frameworks/tailwind/components/Alert.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/alert frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the alert primitive"
```

---

## Task 8: ConfirmDialog

**Reference:** `frameworks/react/components/feedback/ConfirmDialog.jsx`, demoed in
`frameworks/react/components/feedback/confirm-dialog.card.html`.

This is the one component in the whole system allowed a **filled** danger surface, and
only on its final confirmation. `bg-error-fill` appears here and nowhere else in this
plan or in 5b. It also does **not** close on click-outside, by design.

The two footer buttons are the dialog's own, not `Button`: this is the same decision
React took, and it is what keeps the filled-danger fill one component away from any
caller rather than one prop away. A consumer's own buttons belong on `mat-button`.

**Files:**
- Create: `frameworks/tailwind/components/ConfirmDialog.manifest.json`
- Create: `frameworks/tailwind/components/ConfirmDialog.card.html`
- Create: `frameworks/angular/primitives/confirm-dialog/{confirm-dialog.ts,confirm-dialog.variants.ts,confirm-dialog.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ConfirmDialog` (selector `arena-confirm-dialog`), inputs `open: boolean`,
  `title?: string`, `eyebrow: string`, `confirmLabel: string`, `cancelLabel: string`,
  `destructive: boolean`, `requireText?: string`; outputs `cancelled`, `confirmed`;
  `confirmDialogStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/ConfirmDialog.manifest.json`:

```json
{
  "component": "ConfirmDialog",
  "slots": {
    "scrim": "fixed inset-0 z-modal-nested flex items-center justify-center bg-scrim backdrop-blur-scrim",
    "panel": "w-115 max-w-[92vw] bg-base-200 border-[length:var(--bw)] border-neutral rounded-lg shadow-3 overflow-hidden",
    "head": "px-6 pt-5.5",
    "eyebrow": "font-mono text-ctl-xs tracking-label uppercase mb-2",
    "title": "font-display font-extrabold text-h3 text-base-content tracking-tight",
    "body": "px-6 py-4 font-body text-md leading-body text-base-content/82",
    "requireBlock": "mt-3.5",
    "requireLabel": "font-mono text-ctl-xs tracking-field-label uppercase text-base-content/62 mb-1.5",
    "input": "w-full h-ctl-h box-border px-3 bg-base-300 border-[length:var(--bw)] rounded-sm text-base-content font-mono text-ctl outline-none",
    "foot": "flex justify-end gap-2.5 px-6 pb-5.5",
    "cancel": "inline-flex items-center justify-center h-ctl-h px-4.5 rounded-sm border-[length:var(--bw)] border-transparent bg-transparent text-base-content/82 font-body font-semibold text-ctl cursor-pointer",
    "confirm": "inline-flex items-center justify-center h-ctl-h px-4.5 rounded-sm border-[length:var(--bw)] border-transparent font-body font-semibold text-ctl cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
  },
  "variants": {
    "destructive": {
      "true": { "eyebrow": "text-error", "confirm": "bg-error-fill text-error-content" },
      "false": { "eyebrow": "text-primary", "confirm": "bg-primary text-primary-content" }
    },
    "invalid": {
      "true": { "input": "border-error" },
      "false": { "input": "border-base-300" }
    }
  },
  "defaultVariants": { "destructive": "false", "invalid": "false" }
}
```

`w-115` is `calc(var(--sp-1) * 115)` = 460px, React's default width. `max-w-[92vw]`
is legal because plan 4.5 made the unmodelled units legal in a bracket.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/confirm-dialog/confirm-dialog.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/ConfirmDialog.manifest.json' with { type: 'json' };

export const confirmDialogStyles = tv(manifest);
```

Create `frameworks/angular/primitives/confirm-dialog/confirm-dialog.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { confirmDialogStyles } from './confirm-dialog.variants';

/** Confirmation of a high-consequence action. Never closes on click-outside. */
@Component({
  selector: 'arena-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div [class]="styles().scrim()">
        <div [class]="styles().panel()" role="alertdialog" aria-modal="true">
          <div [class]="styles().head()">
            <div [class]="styles().eyebrow()">{{ eyebrow() }}</div>
            @if (title(); as heading) {
              <div [class]="styles().title()">{{ heading }}</div>
            }
          </div>
          <div [class]="styles().body()">
            <ng-content />
            @if (requireText(); as required) {
              <div [class]="styles().requireBlock()">
                <div [class]="styles().requireLabel()">Type "{{ required }}" to confirm</div>
                <input [class]="styles().input()" [value]="typed()" (input)="onType($event)" autofocus />
              </div>
            }
          </div>
          <div [class]="styles().foot()">
            <button type="button" [class]="styles().cancel()" (click)="cancelled.emit()">{{ cancelLabel() }}</button>
            <button type="button" [class]="styles().confirm()" [disabled]="locked()" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input<string>();
  readonly eyebrow = input('Confirm');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly destructive = input(false);
  readonly requireText = input<string>();
  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  protected readonly typed = signal('');
  protected readonly locked = computed(() => {
    const required = this.requireText();
    return required !== undefined && this.typed().trim() !== required;
  });
  protected readonly styles = computed(() => confirmDialogStyles({
    destructive: this.destructive() ? 'true' : 'false',
    invalid: this.locked() && this.typed().length > 0 ? 'true' : 'false',
  }));

  protected onType(event: Event): void {
    this.typed.set((event.target as HTMLInputElement).value);
  }
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/confirm-dialog/confirm-dialog.prompt.md`:

```markdown
Arena confirmation for a high-consequence action. It does not close on click-outside —
losing a half-finished decision to a stray click is the failure this component exists
to prevent. `requireText` makes the user type a word before the confirm button
enables. `destructive` turns the eyebrow red and gives the confirm button Arena's
**only filled danger surface**. Styling is the sibling `confirm-dialog.variants.ts`
recipe.

```html
<arena-confirm-dialog [open]="confirming()" destructive
                      title="Delete project Ardennes?"
                      eyebrow="Irreversible" confirmLabel="Delete project"
                      requireText="Ardennes"
                      (cancelled)="confirming.set(false)" (confirmed)="destroy()">
  Every deployment, log and artifact under this project is removed. This cannot be
  undone.
</arena-confirm-dialog>
```

**Do / Don't**
- Say what will be destroyed, in the body, in plain words. "Are you sure?" is not a
  confirmation, it is a speed bump.
- Use `requireText` when the action is genuinely irreversible, and use the name of the
  thing being destroyed as the word.
- Don't reach for `destructive` on a merely inconvenient action. The filled red is the
  system's loudest surface and it stops working once it is common.
- Don't use this for a routine question — that is `MatDialog` wearing Arena.
```

Create `frameworks/angular/primitives/confirm-dialog/index.ts`:

```ts
export * from './confirm-dialog';
export * from './confirm-dialog.variants';
```

Add `export * from './confirm-dialog';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./avatar`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/ConfirmDialog.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x520" name="ConfirmDialog" subtitle="The one filled danger surface, rendered from ConfirmDialog.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:flex-start;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./ConfirmDialog.manifest.json')).json();

/* The scrim is `fixed`, which a side-by-side specimen cannot show twice — so the
   panel is rendered on its own here and the scrim gets one section of its own. */
function panel({ destructive, invalid, title, eyebrow, body, confirmLabel, requireText }) {
  const c = classesFor(manifest, { destructive: String(destructive), invalid: String(invalid) });
  const head = el('div', { class: c.head }, el('div', { class: c.eyebrow, text: eyebrow }), el('div', { class: c.title, text: title }));
  const content = el('div', { class: c.body }, body);
  if (requireText) {
    content.append(el('div', { class: c.requireBlock },
      el('div', { class: c.requireLabel, text: `Type "${requireText}" to confirm` }),
      el('input', { class: c.input, value: invalid ? 'Ardenne' : '' })));
  }
  const foot = el('div', { class: c.foot },
    el('button', { class: c.cancel, type: 'button', text: 'Cancel' }),
    el('button', { class: c.confirm, type: 'button', text: confirmLabel }));
  return el('div', { class: c.panel }, head, content, foot);
}

mountSpecimen({ sections: [
  section('Routine confirmation', [panel({ destructive: false, invalid: false, eyebrow: 'Confirm', title: 'Publish release 4.1.0?', body: 'The tag is created and the marketplace entry updates immediately.', confirmLabel: 'Publish' })]),
  section('Destructive, with a typed confirmation', [panel({ destructive: true, invalid: true, eyebrow: 'Irreversible', title: 'Delete project Ardennes?', body: 'Every deployment, log and artifact under this project is removed.', confirmLabel: 'Delete project', requireText: 'Ardennes' })]),
]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `feedback/confirm-dialog.card.html`. Check specifically that
the confirm button in the destructive panel is **filled** and that its label clears
contrast against the fill — that pairing is `--danger-fill` / `--color-error-content`
and `scripts/check-text-contrast.mjs` gates it.

```bash
git add frameworks/tailwind/components/ConfirmDialog.manifest.json \
        frameworks/tailwind/components/ConfirmDialog.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/confirm-dialog frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the confirm-dialog primitive"
```

---

## Task 9: EmptyState

**Reference:** `frameworks/react/components/feedback/EmptyState.jsx`, demoed in
`frameworks/react/components/feedback/empty-error-state.card.html`.

The action is projected, not owned: an empty state's call to action is the consumer's
button, and in the Angular layer that is a `mat-button` wearing Arena.

**Files:**
- Create: `frameworks/tailwind/components/EmptyState.manifest.json`
- Create: `frameworks/tailwind/components/EmptyState.card.html`
- Create: `frameworks/angular/primitives/empty-state/{empty-state.ts,empty-state.variants.ts,empty-state.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `EmptyState` (selector `arena-empty-state`), inputs `icon?: string`,
  `title?: string`, `message?: string`, projects `[arena-action]`; `emptyStateStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/EmptyState.manifest.json`:

```json
{
  "component": "EmptyState",
  "slots": {
    "root": "flex flex-col items-center text-center gap-3 px-8 py-14 bg-base-200 border-[length:var(--bw)] border-dashed border-neutral rounded-lg",
    "icon": "text-[length:var(--icon-xl)] text-base-content/62 leading-ctl",
    "title": "font-display font-extrabold text-h4 text-base-content",
    "message": "font-body text-md text-base-content/62 leading-body max-w-[42ch]",
    "action": "mt-1.5"
  }
}
```

The dashed border is what separates an empty state from an error state at a glance —
`border-dashed` here, `border-solid` and `border-error` there.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/empty-state/empty-state.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/EmptyState.manifest.json' with { type: 'json' };

export const emptyStateStyles = tv(manifest);
```

Create `frameworks/angular/primitives/empty-state/empty-state.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { emptyStateStyles } from './empty-state.variants';

/** Section- or screen-level empty state, with one clear way forward. */
@Component({
  selector: 'arena-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="styles().root()">
      @if (icon(); as glyph) {
        <div [class]="styles().icon()"><i [class]="glyph" aria-hidden="true"></i></div>
      }
      @if (title(); as heading) {
        <div [class]="styles().title()">{{ heading }}</div>
      }
      @if (message(); as body) {
        <div [class]="styles().message()">{{ body }}</div>
      }
      <div [class]="styles().action()"><ng-content select="[arena-action]" /></div>
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<string>();
  readonly title = input<string>();
  readonly message = input<string>();

  protected readonly styles = computed(() => emptyStateStyles());
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/empty-state/empty-state.prompt.md`:

```markdown
Arena empty state — a section or screen with nothing in it yet, and one clear way
forward. The action is projected, so it is a real `mat-button` wearing Arena rather
than a second button implementation. The dashed border is what distinguishes it from
`arena-error-state`: nothing is wrong here, there is simply nothing yet.

```html
<arena-empty-state icon="ph-bold ph-folder-open"
                   title="No projects yet"
                   message="A project groups deployments, logs and artifacts for one client.">
  <button arena-action mat-flat-button (click)="create()">Create a project</button>
</arena-empty-state>
```

**Do / Don't**
- Say what the thing *is* in the message, not just that there are none of it. An empty
  state is often the first time someone reads a definition.
- Give exactly one action. Two competing actions in an empty state is a decision the
  user has no information to make.
- Don't use an empty state for a failed load — that is `arena-error-state`, and the
  difference matters: one invites, the other apologises and offers a retry.
```

Create `frameworks/angular/primitives/empty-state/index.ts`:

```ts
export * from './empty-state';
export * from './empty-state.variants';
```

Add `export * from './empty-state';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./confirm-dialog`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/EmptyState.card.html`:

```html
<!-- @dsCard group="Angular" viewport="700x400" name="EmptyState" subtitle="Nothing here yet, rendered from EmptyState.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-direction:column;gap:calc(var(--sp-1) * 3.5);align-items:stretch;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./EmptyState.manifest.json')).json();
const c = classesFor(manifest);

function emptyState({ icon, title, message, actionLabel }) {
  const root = el('div', { class: c.root },
    el('div', { class: c.icon }, el('i', { class: icon, 'aria-hidden': 'true' })),
    el('div', { class: c.title, text: title }),
    el('div', { class: c.message, text: message }));
  if (actionLabel) {
    /* Stands in for the projected mat-button; the manifest styles the slot, not
       the button. */
    const action = el('div', { class: c.action });
    action.append(el('span', { class: 'font-body text-ctl text-primary', text: `[ ${actionLabel} ]` }));
    root.append(action);
  }
  return root;
}

mountSpecimen({ sections: [
  section('With an action', [emptyState({ icon: 'ph-bold ph-folder-open', title: 'No projects yet', message: 'A project groups deployments, logs and artifacts for one client.', actionLabel: 'Create a project' })]),
  section('Without one', [emptyState({ icon: 'ph-bold ph-magnifying-glass', title: 'No results', message: 'Nothing matches that filter. Widen the date range or clear the status filter.' })]),
]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

```bash
git add frameworks/tailwind/components/EmptyState.manifest.json \
        frameworks/tailwind/components/EmptyState.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/empty-state frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the empty-state primitive"
```

---

## Task 10: ErrorState

**Reference:** `frameworks/react/components/feedback/ErrorState.jsx`, same demo page as
Task 9.

React's `ErrorState` imports `Button` for its retry. The Angular layer does not — the
retry is projected, like the empty state's action, because buttons are Material's half
of the split.

**Files:**
- Create: `frameworks/tailwind/components/ErrorState.manifest.json`
- Create: `frameworks/tailwind/components/ErrorState.card.html`
- Create: `frameworks/angular/primitives/error-state/{error-state.ts,error-state.variants.ts,error-state.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ErrorState` (selector `arena-error-state`), inputs `icon?: string`,
  `title: string`, `message?: string`, `code?: string`, projects `[arena-action]`;
  `errorStateStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/ErrorState.manifest.json`:

```json
{
  "component": "ErrorState",
  "slots": {
    "root": "flex flex-col items-center text-center gap-3 px-8 py-14 bg-error/14 border-[length:var(--bw)] border-error rounded-lg",
    "icon": "text-[length:var(--icon-xl)] text-error leading-ctl",
    "title": "font-display font-extrabold text-h4 text-base-content",
    "message": "font-body text-md text-base-content/82 leading-body max-w-[46ch]",
    "code": "font-mono text-ctl-sm text-base-content/62 bg-base-100/30 px-2.5 py-1 rounded-xs",
    "actions": "flex gap-2.5 mt-1.5"
  }
}
```

React writes the code chip's background as
`color-mix(in oklab, var(--color-base-100) 30%, transparent)`; `bg-base-100/30` is the
same expression, emitted by the modifier.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/error-state/error-state.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/ErrorState.manifest.json' with { type: 'json' };

export const errorStateStyles = tv(manifest);
```

Create `frameworks/angular/primitives/error-state/error-state.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { errorStateStyles } from './error-state.variants';

/** Section- or screen-level failure, with recovery and an optional support code. */
@Component({
  selector: 'arena-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="styles().root()" role="alert">
      @if (icon(); as glyph) {
        <div [class]="styles().icon()"><i [class]="glyph" aria-hidden="true"></i></div>
      }
      <div [class]="styles().title()">{{ title() }}</div>
      @if (message(); as body) {
        <div [class]="styles().message()">{{ body }}</div>
      }
      @if (code(); as support) {
        <code [class]="styles().code()">{{ support }}</code>
      }
      <div [class]="styles().actions()"><ng-content select="[arena-action]" /></div>
    </div>
  `,
})
export class ErrorState {
  readonly icon = input<string>();
  readonly title = input('Something went wrong');
  readonly message = input<string>();
  readonly code = input<string>();

  protected readonly styles = computed(() => errorStateStyles());
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/error-state/error-state.prompt.md`:

```markdown
Arena failure state — something did not load, and there is a way to try again. The
retry is projected, so it is a real `mat-button` wearing Arena. `code` renders the
support code as a mono chip: it is for a support conversation, not for the user to
act on, which is why it is muted and small.

```html
<arena-error-state icon="ph-bold ph-plugs"
                   title="Couldn't reach the delivery API"
                   message="The dashboard is showing the last data it cached."
                   code="ERR_UPSTREAM_504">
  <button arena-action mat-flat-button (click)="retry()">Retry</button>
</arena-error-state>
```

**Do / Don't**
- Always offer a retry when a retry could work. An error state with no action is a
  dead end the user has to navigate out of.
- Say what still works, if anything does — "showing the last cached data" is more
  useful than "an error occurred".
- Don't put the raw exception in `message`. The code chip is where a machine-readable
  detail goes; the message is for a person.
- Don't use this for a validation failure on a field — that belongs on the field.
```

Create `frameworks/angular/primitives/error-state/index.ts`:

```ts
export * from './error-state';
export * from './error-state.variants';
```

Add `export * from './error-state';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./empty-state`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/ErrorState.card.html`:

```html
<!-- @dsCard group="Angular" viewport="700x400" name="ErrorState" subtitle="Failure and recovery, rendered from ErrorState.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-direction:column;gap:calc(var(--sp-1) * 3.5);align-items:stretch;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./ErrorState.manifest.json')).json();
const c = classesFor(manifest);

function errorState({ icon, title, message, code, actionLabel }) {
  const root = el('div', { class: c.root, role: 'alert' },
    el('div', { class: c.icon }, el('i', { class: icon, 'aria-hidden': 'true' })),
    el('div', { class: c.title, text: title }),
    el('div', { class: c.message, text: message }));
  if (code) root.append(el('code', { class: c.code, text: code }));
  if (actionLabel) root.append(el('div', { class: c.actions }, el('span', { class: 'font-body text-ctl text-primary', text: `[ ${actionLabel} ]` })));
  return root;
}

mountSpecimen({ sections: [
  section('With a support code and a retry', [errorState({ icon: 'ph-bold ph-plugs', title: "Couldn't reach the delivery API", message: 'The dashboard is showing the last data it cached.', code: 'ERR_UPSTREAM_504', actionLabel: 'Retry' })]),
  section('Bare', [errorState({ icon: 'ph-bold ph-warning-octagon', title: 'Something went wrong', message: 'Reload the page. If it keeps happening, the status page has more.' })]),
]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare both states side by side against React's `feedback/empty-error-state.card.html` —
dashed neutral versus solid `--error` is the distinction that must survive the port.

```bash
git add frameworks/tailwind/components/ErrorState.manifest.json \
        frameworks/tailwind/components/ErrorState.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/error-state frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the error-state primitive"
```

---

## Task 11: Onboarding

**Reference:** `frameworks/react/components/feedback/Onboarding.jsx`, demoed in
`frameworks/react/components/feedback/onboarding.card.html`.

**`anchorRect` is ported, constants and all.** React clamps the coachmark against the
viewport with two plain numbers — `W = 320` (the popover's own width) and `EDGE = 16`
(its minimum gutter) — because `Math.min`/`Math.max` need real numbers and **nothing in
this layer reads a custom property back into JS**. The Angular port keeps both, with the
same values and the same reasoning, and adds two `EXEMPT` entries mirroring React's own.
Do not try to token-ify them: a `var()` inside `Math.min` is a string, and the clamp
would silently stop clamping.

**Files:**
- Create: `frameworks/tailwind/components/Onboarding.manifest.json`
- Create: `frameworks/tailwind/components/Onboarding.card.html`
- Create: `frameworks/angular/primitives/onboarding/{onboarding.ts,onboarding.variants.ts,onboarding.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ArenaOnboardingStep { eyebrow?: string; title?: string; body?: string }`;
  `Onboarding` (selector `arena-onboarding`), inputs `open: boolean`,
  `steps: ArenaOnboardingStep[]`, `index: number`, `anchorRect?: DOMRect`; outputs
  `next`, `back`, `skip`, `done`; `onboardingStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Onboarding.manifest.json`:

```json
{
  "component": "Onboarding",
  "slots": {
    "scrim": "fixed inset-0 bg-scrim",
    "panel": "fixed z-onboarding w-80 max-w-[92vw] bg-base-200 border-[length:var(--bw)] border-neutral rounded-lg shadow-3 p-5",
    "eyebrow": "font-mono text-ctl-xs tracking-label uppercase text-primary mb-2",
    "title": "font-display font-extrabold text-h4 text-base-content tracking-tight",
    "body": "font-body text-md leading-body text-base-content/82 mt-2",
    "foot": "flex items-center gap-1.5 mt-4.5",
    "dots": "flex gap-1.5 flex-1",
    "dot": "h-2 rounded-pill transition-[width] duration-[var(--dur-mid)] ease-out",
    "dotOn": "w-4.5 bg-primary",
    "dotOff": "w-2 bg-neutral",
    "text": "font-mono text-ctl-xs tracking-uppercase-status uppercase font-bold bg-transparent border-none cursor-pointer text-base-content/62",
    "next": "h-8.5 px-4 bg-primary text-primary-content border-none rounded-sm font-body font-semibold text-ctl-md cursor-pointer"
  },
  "variants": {
    "placement": {
      "floating": { "panel": "right-6 bottom-6" },
      "anchored": { "panel": "" }
    }
  },
  "defaultVariants": { "placement": "floating" }
}
```

`anchored` contributes no classes on purpose: the panel's `top`/`left` come from the
clamp as inline styles, and a corner class would fight them. The variant exists so the
floating corner is *removed* rather than overridden.

The scrim carries **no blur** — a tour that blurs the product it is touring defeats
itself, which is why `--scrim-blur` appears on Dialog, ConfirmDialog and
CommandPalette but not here. Its stacking is React's `calc(var(--z-onboarding) - 10)`;
in the specimen and in the template it sits immediately before the panel in DOM order
under the same stacking context, so the panel's `z-onboarding` is enough and the
derivation is not needed.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/onboarding/onboarding.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Onboarding.manifest.json' with { type: 'json' };

export const onboardingStyles = tv(manifest);
```

Create `frameworks/angular/primitives/onboarding/onboarding.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject, input, output } from '@angular/core';
import { onboardingStyles } from './onboarding.variants';

export interface ArenaOnboardingStep {
  eyebrow?: string;
  title?: string;
  body?: string;
}

/** Guided coachmark tour. Controlled: the host owns `index` and answers the outputs. */
@Component({
  selector: 'arena-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div [class]="styles().scrim()" (click)="skip.emit()"></div>
      <div [class]="styles().panel()" role="dialog" aria-modal="true" [attr.aria-label]="step().title"
           [style.top.px]="position()?.top" [style.left.px]="position()?.left">
        @if (step().eyebrow; as eyebrow) {
          <div [class]="styles().eyebrow()">{{ eyebrow }}</div>
        }
        @if (step().title; as title) {
          <div [class]="styles().title()">{{ title }}</div>
        }
        @if (step().body; as body) {
          <div [class]="styles().body()">{{ body }}</div>
        }
        <div [class]="styles().foot()">
          <div [class]="styles().dots()" [attr.aria-label]="'Step ' + (index() + 1) + ' of ' + steps().length">
            @for (dot of steps(); track $index) {
              <span [class]="styles().dot() + ' ' + ($index === index() ? styles().dotOn() : styles().dotOff())"></span>
            }
          </div>
          @if (index() > 0) {
            <button type="button" [class]="styles().text()" (click)="back.emit()">Back</button>
          }
          @if (!last()) {
            <button type="button" [class]="styles().text()" (click)="skip.emit()">Skip</button>
          }
          <button type="button" [class]="styles().next()" (click)="last() ? done.emit() : next.emit()">
            {{ last() ? 'Got it' : 'Next' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class Onboarding {
  readonly open = input(false);
  readonly steps = input<ArenaOnboardingStep[]>([]);
  readonly index = input(0);
  readonly anchorRect = input<DOMRect>();
  readonly next = output<void>();
  readonly back = output<void>();
  readonly skip = output<void>();
  readonly done = output<void>();

  private readonly doc = inject(DOCUMENT);

  protected readonly styles = computed(() =>
    onboardingStyles({ placement: this.anchorRect() ? 'anchored' : 'floating' }));
  protected readonly visible = computed(() => this.open() && this.steps().length > 0);
  protected readonly step = computed<ArenaOnboardingStep>(() => this.steps()[this.index()] ?? {});
  protected readonly last = computed(() => this.index() === this.steps().length - 1);

  /** Clamped against the viewport, or null when the coachmark floats. `W` and `EDGE`
   *  stay plain numbers for the reason Onboarding.jsx states: Math.min/max need real
   *  numbers, and nothing in this layer reads a custom property back into JS. */
  protected readonly position = computed(() => {
    const rect = this.anchorRect();
    if (!rect) return null;
    const view = this.doc.defaultView;
    const W = 320;
    const EDGE = 16;
    const top = Math.min(rect.bottom + 12, (view?.innerHeight ?? 900) - 220);
    const left = view ? Math.min(rect.left, view.innerWidth - W - EDGE) : rect.left;
    return { top, left: Math.max(EDGE, left) };
  });
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/onboarding/onboarding.prompt.md`:

```markdown
Arena guided tour. A coachmark with progress dots, Skip and Next, floating bottom-right
over an unblurred scrim — a tour that blurs the product it is touring defeats itself.
It is controlled: the host owns `index` and answers `next`, `back`, `skip` and `done`.

```html
<arena-onboarding [open]="touring()" [steps]="steps" [index]="step()"
                  [anchorRect]="target()?.getBoundingClientRect()"
                  (next)="step.set(step() + 1)" (back)="step.set(step() - 1)"
                  (skip)="touring.set(false)" (done)="finish()" />
```

**Do / Don't**
- Keep a tour to three or four steps. The dots are a promise about how long this will
  take, and a tour that breaks that promise gets skipped.
- Pass `anchorRect` (a `DOMRect`, usually from `getBoundingClientRect()`) when a step
  must point at a specific control; the coachmark clamps itself inside the viewport.
  Without it, it floats bottom-right.
- Don't put anything in a tour that the interface should have made obvious. A
  coachmark explaining a confusing control is a bug report with a nicer border.
```

Create `frameworks/angular/primitives/onboarding/index.ts`:

```ts
export * from './onboarding';
export * from './onboarding.variants';
```

Add `export * from './onboarding';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./error-state`).

- [ ] **Step 4: Register the two clamp constants**

Run: `bun run check:dimensions`

If it reports `onboarding.ts` with `320` or `16`, add both to `EXEMPT` in
`scripts/check-dimension-literals.mjs`, using the keys the gate prints and the reason
React's own comments give:

```js
  ['frameworks/angular/primitives/onboarding/onboarding.ts:width:320',
   'the popover\'s own width, compared against window.innerWidth in a clamp — Math.min needs a real number, and nothing in this layer reads a custom property back into JS; Onboarding.jsx carries the same constant for the same reason'],
  ['frameworks/angular/primitives/onboarding/onboarding.ts:left:16',
   'the popover\'s minimum gutter from either viewport edge, both edges reading one constant so they cannot drift apart — same clamp, same reason as the width above'],
```

If it reports nothing, add nothing: a stale exemption fails the gate, which is the
discipline working.

- [ ] **Step 5: Write the specimen**

Create `frameworks/tailwind/components/Onboarding.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x420" name="Onboarding" subtitle="Coachmark and progress, rendered from Onboarding.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:flex-start;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}.static-panel{position:static!important}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Onboarding.manifest.json')).json();
const c = classesFor(manifest);

/* `panel` is `fixed`, which a specimen showing two states side by side cannot use —
   `.static-panel` unpins it here and changes nothing else. */
function coachmark({ eyebrow, title, body, index, total }) {
  const dots = el('div', { class: c.dots });
  for (let i = 0; i < total; i++) dots.append(el('span', { class: `${c.dot} ${i === index ? c.dotOn : c.dotOff}` }));
  const foot = el('div', { class: c.foot }, dots);
  if (index > 0) foot.append(el('button', { class: c.text, type: 'button', text: 'Back' }));
  if (index < total - 1) foot.append(el('button', { class: c.text, type: 'button', text: 'Skip' }));
  foot.append(el('button', { class: c.next, type: 'button', text: index === total - 1 ? 'Got it' : 'Next' }));
  return el('div', { class: `${c.panel} static-panel` },
    el('div', { class: c.eyebrow, text: eyebrow }),
    el('div', { class: c.title, text: title }),
    el('div', { class: c.body, text: body }),
    foot);
}

mountSpecimen({ sections: [
  section('First step', [coachmark({ eyebrow: 'Getting started', title: 'This is the delivery board', body: 'Every project your team is shipping, grouped by client.', index: 0, total: 3 })]),
  section('Last step', [coachmark({ eyebrow: 'Getting started', title: 'Press Cmd+K anywhere', body: 'The command palette runs any action without leaving the keyboard.', index: 2, total: 3 })]),
]});
</script></body></html>
```

- [ ] **Step 6: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `feedback/onboarding.card.html`, and confirm the active dot is
wider than the others and animates its width.

```bash
git add frameworks/tailwind/components/Onboarding.manifest.json \
        frameworks/tailwind/components/Onboarding.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/onboarding frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the onboarding primitive"
```

---

## Task 12: Breadcrumbs

**Reference:** `frameworks/react/components/navigation/Breadcrumbs.jsx`, demoed in
`frameworks/react/components/navigation/navigation.card.html`.

**Files:**
- Create: `frameworks/tailwind/components/Breadcrumbs.manifest.json`
- Create: `frameworks/tailwind/components/Breadcrumbs.card.html`
- Create: `frameworks/angular/primitives/breadcrumbs/{breadcrumbs.ts,breadcrumbs.variants.ts,breadcrumbs.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ArenaCrumb { label: string; href?: string }`; `Breadcrumbs`
  (selector `arena-breadcrumbs`), inputs `items: ArenaCrumb[]`, `separator: string`;
  output `navigate: ArenaCrumb`; `breadcrumbsStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Breadcrumbs.manifest.json`:

```json
{
  "component": "Breadcrumbs",
  "slots": {
    "root": "flex items-center flex-wrap gap-2",
    "crumb": "font-mono text-ctl-sm tracking-mono-nav text-base-content/62 no-underline cursor-pointer transition-[color] duration-[var(--dur-fast)] ease-out hover:text-base-content/82",
    "current": "font-mono text-ctl-sm tracking-mono-nav text-base-content font-bold",
    "separator": "font-mono text-ctl-sm text-neutral"
  }
}
```

The hover is a variant of the *state*, not of a prop, so it is a Tailwind state
modifier rather than a manifest variant — the recipe stays a pure function of the
component's inputs, which is what lets a specimen render it.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/breadcrumbs/breadcrumbs.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Breadcrumbs.manifest.json' with { type: 'json' };

export const breadcrumbsStyles = tv(manifest);
```

Create `frameworks/angular/primitives/breadcrumbs/breadcrumbs.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { breadcrumbsStyles } from './breadcrumbs.variants';

export interface ArenaCrumb {
  label: string;
  href?: string;
}

/** Explicit return path for hierarchies deeper than tabs. The last crumb is the page. */
@Component({
  selector: 'arena-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [class]="styles().root()" aria-label="Breadcrumb">
      @for (crumb of items(); track crumb.label; let last = $last) {
        @if (last) {
          <span [class]="styles().current()" aria-current="page">{{ crumb.label }}</span>
        } @else {
          <a [class]="styles().crumb()" [attr.href]="crumb.href ?? '#'" (click)="navigate.emit(crumb)">{{ crumb.label }}</a>
          <span [class]="styles().separator()" aria-hidden="true">{{ separator() }}</span>
        }
      }
    </nav>
  `,
})
export class Breadcrumbs {
  readonly items = input<ArenaCrumb[]>([]);
  readonly separator = input('/');
  readonly navigate = output<ArenaCrumb>();

  protected readonly styles = computed(() => breadcrumbsStyles());
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/breadcrumbs/breadcrumbs.prompt.md`:

```markdown
Arena breadcrumb trail. Mono, wide-tracked, with the last crumb as the current page —
not a link, and carrying `aria-current="page"`. Use it where a hierarchy is deeper than
tabs can show.

```html
<arena-breadcrumbs [items]="[
  { label: 'Clients', href: '/clients' },
  { label: 'Ardennes', href: '/clients/ardennes' },
  { label: 'Deployments' }
]" (navigate)="go($event)" />
```

**Do / Don't**
- Keep the last crumb non-navigable. A link to the page you are on is noise, and it
  breaks the trail's promise that everything to the left is somewhere else.
- Don't use breadcrumbs for steps in a flow. A trail describes where something *is*,
  not how far through it you are — that is the coachmark's dots or a stepper.
- Don't truncate the middle of a trail to save space. Wrap it; the row already does.
```

Create `frameworks/angular/primitives/breadcrumbs/index.ts`:

```ts
export * from './breadcrumbs';
export * from './breadcrumbs.variants';
```

Add `export * from './breadcrumbs';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./avatar`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/Breadcrumbs.card.html`:

```html
<!-- @dsCard group="Angular" viewport="700x220" name="Breadcrumbs" subtitle="Trail and current page, rendered from Breadcrumbs.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Breadcrumbs.manifest.json')).json();
const c = classesFor(manifest);

function trail(labels, separator = '/') {
  const nav = el('nav', { class: c.root, 'aria-label': 'Breadcrumb' });
  labels.forEach((label, i) => {
    const last = i === labels.length - 1;
    if (last) nav.append(el('span', { class: c.current, 'aria-current': 'page', text: label }));
    else {
      nav.append(el('a', { class: c.crumb, href: '#', text: label }));
      nav.append(el('span', { class: c.separator, 'aria-hidden': 'true', text: separator }));
    }
  });
  return nav;
}

mountSpecimen({ sections: [
  section('Three levels', [trail(['Clients', 'Ardennes', 'Deployments'])]),
  section('With a chevron separator', [trail(['Home', 'Settings', 'Access'], '›')]),
]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

```bash
git add frameworks/tailwind/components/Breadcrumbs.manifest.json \
        frameworks/tailwind/components/Breadcrumbs.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/breadcrumbs frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the breadcrumbs primitive"
```

---

## Task 13: BulkActionBar

**Reference:** `frameworks/react/components/navigation/BulkActionBar.jsx`, demoed in
`frameworks/react/components/navigation/navigation.card.html`.

**Files:**
- Create: `frameworks/tailwind/components/BulkActionBar.manifest.json`
- Create: `frameworks/tailwind/components/BulkActionBar.card.html`
- Create: `frameworks/angular/primitives/bulk-action-bar/{bulk-action-bar.ts,bulk-action-bar.variants.ts,bulk-action-bar.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ArenaBulkAction { label: string; icon?: string; destructive?: boolean }`;
  `BulkActionBar` (selector `arena-bulk-action-bar`), inputs `count: number`,
  `noun: string`, `actions: ArenaBulkAction[]`; outputs `run: ArenaBulkAction`,
  `cleared`; `bulkActionBarStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/BulkActionBar.manifest.json`:

```json
{
  "component": "BulkActionBar",
  "slots": {
    "root": "flex items-center gap-3.5 min-h-13 pl-4 pr-3 bg-base-200 border-[length:var(--bw)] border-neutral rounded-md shadow-2",
    "count": "font-mono text-ctl-sm tracking-mono-nav text-base-content",
    "number": "text-secondary",
    "divider": "w-px h-5.5 bg-base-300",
    "actions": "flex items-center gap-1.5 flex-1 flex-wrap",
    "action": "inline-flex items-center gap-2 h-8.5 px-3 bg-transparent border-[length:var(--bw)] border-base-300 rounded-sm cursor-pointer font-body font-semibold text-ctl-md transition-[background] duration-[var(--dur-fast)] ease-out hover:bg-base-200",
    "actionIcon": "inline-flex text-[length:var(--icon-md)]",
    "clear": "bg-transparent border-none cursor-pointer text-base-content/62 font-mono text-ctl-xs tracking-badge uppercase"
  },
  "variants": {
    "destructive": {
      "true": { "action": "text-error" },
      "false": { "action": "text-base-content/82" }
    }
  },
  "defaultVariants": { "destructive": "false" }
}
```

`w-px` is Tailwind's own one-pixel utility and is the right tool for the divider:
React writes `width: var(--bw)`, and `--bw` is the *border* width token — a rule the
divider is not a border of. Both resolve to 1px; if that ever diverges, the divider
follows the hairline, not the border, so keep `w-px`.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/bulk-action-bar/bulk-action-bar.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/BulkActionBar.manifest.json' with { type: 'json' };

export const bulkActionBarStyles = tv(manifest);
```

Create `frameworks/angular/primitives/bulk-action-bar/bulk-action-bar.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { bulkActionBarStyles } from './bulk-action-bar.variants';

export interface ArenaBulkAction {
  label: string;
  icon?: string;
  destructive?: boolean;
}

/** Appears when rows are selected, and operates on the selection as a set. */
@Component({
  selector: 'arena-bulk-action-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (count() > 0) {
      <div [class]="styles().root()" role="region" aria-label="Actions on the selection">
        <span [class]="styles().count()">
          <b [class]="styles().number()">{{ count() }}</b> {{ noun() }} selected
        </span>
        <span [class]="styles().divider()"></span>
        <div [class]="styles().actions()">
          @for (action of actions(); track action.label) {
            <button type="button" [class]="classesFor(action).action()" (click)="run.emit(action)">
              @if (action.icon; as glyph) {
                <span [class]="styles().actionIcon()"><i [class]="glyph" aria-hidden="true"></i></span>
              }
              {{ action.label }}
            </button>
          }
        </div>
        <button type="button" [class]="styles().clear()" aria-label="Clear selection" (click)="cleared.emit()">Clear</button>
      </div>
    }
  `,
})
export class BulkActionBar {
  readonly count = input(0);
  readonly noun = input('items');
  readonly actions = input<ArenaBulkAction[]>([]);
  readonly run = output<ArenaBulkAction>();
  readonly cleared = output<void>();

  protected readonly styles = computed(() => bulkActionBarStyles());

  protected classesFor(action: ArenaBulkAction): ReturnType<typeof bulkActionBarStyles> {
    return bulkActionBarStyles({ destructive: action.destructive ? 'true' : 'false' });
  }
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/bulk-action-bar/bulk-action-bar.prompt.md`:

```markdown
Arena bulk actions bar. It renders only when `count` is above zero, states the size of
the selection in mono, and offers actions that operate on the set. A destructive
action is outline in `--error`, like every other danger surface but one.

```html
<arena-bulk-action-bar [count]="selected().length" noun="deployments"
                       [actions]="[
                         { label: 'Re-run', icon: 'ph-bold ph-arrow-clockwise' },
                         { label: 'Archive', icon: 'ph-bold ph-archive' },
                         { label: 'Delete', icon: 'ph-bold ph-trash', destructive: true }
                       ]"
                       (run)="apply($event)" (cleared)="selected.set([])" />
```

**Do / Don't**
- Always offer Clear. A selection the user cannot see the edges of is a selection they
  will act on by accident.
- Put the destructive action last, and confirm it with `arena-confirm-dialog` — the bar
  starts the action, it does not finish it.
- Don't hide the bar behind a menu. Its whole job is to be visible the moment a
  selection exists.
```

Create `frameworks/angular/primitives/bulk-action-bar/index.ts`:

```ts
export * from './bulk-action-bar';
export * from './bulk-action-bar.variants';
```

Add `export * from './bulk-action-bar';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./breadcrumbs`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/BulkActionBar.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x240" name="BulkActionBar" subtitle="Selection actions, rendered from BulkActionBar.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-direction:column;gap:calc(var(--sp-1) * 3.5);align-items:stretch;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./BulkActionBar.manifest.json')).json();
const base = classesFor(manifest);

function bar(count, noun, actions) {
  const list = el('div', { class: base.actions });
  for (const action of actions) {
    const c = classesFor(manifest, { destructive: String(Boolean(action.destructive)) });
    const button = el('button', { class: c.action, type: 'button' });
    if (action.icon) button.append(el('span', { class: base.actionIcon }, el('i', { class: action.icon, 'aria-hidden': 'true' })));
    button.append(action.label);
    list.append(button);
  }
  return el('div', { class: base.root, role: 'region' },
    el('span', { class: base.count }, el('b', { class: base.number, text: String(count) }), ` ${noun} selected`),
    el('span', { class: base.divider }),
    list,
    el('button', { class: base.clear, type: 'button', text: 'Clear' }));
}

mountSpecimen({ sections: [
  section('With a destructive action', [bar(12, 'deployments', [
    { label: 'Re-run', icon: 'ph-bold ph-arrow-clockwise' },
    { label: 'Archive', icon: 'ph-bold ph-archive' },
    { label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
  ])]),
  section('Single selection', [bar(1, 'project', [{ label: 'Export', icon: 'ph-bold ph-download-simple' }])]),
]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

```bash
git add frameworks/tailwind/components/BulkActionBar.manifest.json \
        frameworks/tailwind/components/BulkActionBar.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/bulk-action-bar frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the bulk-action-bar primitive"
```

---

## Task 14: CommandPalette

**Reference:** `frameworks/react/components/navigation/CommandPalette.jsx`, demoed in
`frameworks/react/components/navigation/command-palette.card.html`.

The behaviour is the component: filter as you type, arrow keys move the selection,
Enter runs it, Escape closes, hovering a row selects it. Port all of it — a palette
that needs the mouse is not a palette.

**Files:**
- Create: `frameworks/tailwind/components/CommandPalette.manifest.json`
- Create: `frameworks/tailwind/components/CommandPalette.card.html`
- Create: `frameworks/angular/primitives/command-palette/{command-palette.ts,command-palette.variants.ts,command-palette.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ArenaCommand { id?: string; label: string; hint?: string; icon?: string; shortcut?: string }`;
  `CommandPalette` (selector `arena-command-palette`), inputs `open: boolean`,
  `commands: ArenaCommand[]`, `placeholder: string`; outputs `closed`, `run: ArenaCommand`;
  `commandPaletteStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/CommandPalette.manifest.json`:

```json
{
  "component": "CommandPalette",
  "slots": {
    "scrim": "fixed inset-0 z-palette flex items-start justify-center pt-[12vh] bg-scrim backdrop-blur-scrim",
    "panel": "w-140 max-w-[92vw] bg-base-200 border-[length:var(--bw)] border-neutral rounded-lg shadow-3 overflow-hidden",
    "search": "flex items-center gap-2.5 px-4 py-3.5 border-b-[length:var(--bw)] border-base-300",
    "searchIcon": "text-base-content/62 text-[length:var(--icon-lg)]",
    "input": "flex-1 bg-transparent border-none outline-none text-base-content font-body text-ctl",
    "esc": "font-mono text-ctl-xs text-base-content/62 border-[length:var(--bw)] border-base-300 rounded-xs px-1.5 py-0.5",
    "list": "max-h-80 overflow-auto p-1.5",
    "empty": "px-3 py-4.5 font-body text-md text-base-content/62",
    "row": "flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-sm border-none cursor-pointer bg-transparent text-base-content/82",
    "rowActive": "bg-primary/14 text-primary",
    "rowIcon": "inline-flex text-[length:var(--icon-lg)]",
    "rowLabel": "flex-1 font-body text-ctl font-medium",
    "rowLabelActive": "font-semibold",
    "shortcut": "font-mono text-ctl-xs text-base-content/62"
  }
}
```

`w-140` is 560px and `max-h-80` is 320px — both React's, both on the grid.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/command-palette/command-palette.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/CommandPalette.manifest.json' with { type: 'json' };

export const commandPaletteStyles = tv(manifest);
```

Create `frameworks/angular/primitives/command-palette/command-palette.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { commandPaletteStyles } from './command-palette.variants';

export interface ArenaCommand {
  id?: string;
  label: string;
  hint?: string;
  icon?: string;
  shortcut?: string;
}

/** Keyboard-first action launcher. Filter, arrow to a command, Enter to run it. */
@Component({
  selector: 'arena-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div [class]="styles().scrim()" (click)="closed.emit()">
        <div [class]="styles().panel()" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div [class]="styles().search()">
            <i [class]="styles().searchIcon() + ' ph-bold ph-magnifying-glass'" aria-hidden="true"></i>
            <input [class]="styles().input()" [value]="query()" [attr.placeholder]="placeholder()"
                   (input)="onQuery($event)" (keydown)="onKey($event)" autofocus />
            <span [class]="styles().esc()">ESC</span>
          </div>
          <div [class]="styles().list()">
            @if (filtered().length === 0) {
              <div [class]="styles().empty()">No results for "{{ query() }}".</div>
            }
            @for (command of filtered(); track command.id ?? command.label; let i = $index) {
              <button type="button"
                      [class]="styles().row() + (i === active() ? ' ' + styles().rowActive() : '')"
                      (mouseenter)="active.set(i)" (click)="run.emit(command)">
                @if (command.icon; as glyph) {
                  <span [class]="styles().rowIcon()"><i [class]="glyph" aria-hidden="true"></i></span>
                }
                <span [class]="styles().rowLabel() + (i === active() ? ' ' + styles().rowLabelActive() : '')">{{ command.label }}</span>
                @if (command.shortcut; as shortcut) {
                  <span [class]="styles().shortcut()">{{ shortcut }}</span>
                }
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPalette {
  readonly open = input(false);
  readonly commands = input<ArenaCommand[]>([]);
  readonly placeholder = input('Search for an action or project…');
  readonly closed = output<void>();
  readonly run = output<ArenaCommand>();

  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly styles = computed(() => commandPaletteStyles());
  protected readonly filtered = computed(() => {
    const needle = this.query().toLowerCase();
    return this.commands().filter((c) => `${c.label} ${c.hint ?? ''}`.toLowerCase().includes(needle));
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.query.set('');
        this.active.set(0);
      }
    });
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const last = this.filtered().length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.update((i) => Math.min(i + 1, last));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.filtered()[this.active()];
      if (command) this.run.emit(command);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
    }
  }
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/command-palette/command-palette.prompt.md`:

```markdown
Arena command palette — the keyboard accelerator behind Cmd/Ctrl+K. Type to filter,
arrow to a command, Enter to run it, Escape to leave. `hint` is searched but not
shown, so a command can be found by a word that is not in its label. The host owns
`open` and the shortcut that sets it.

```html
<arena-command-palette [open]="paletteOpen()" [commands]="commands"
                       (closed)="paletteOpen.set(false)"
                       (run)="paletteOpen.set(false); dispatch($event)" />
```

**Do / Don't**
- Put every command's real shortcut in `shortcut`. The palette is where people learn
  the shortcuts that let them stop using the palette.
- Use `hint` for the synonyms people actually type — "logout" for "Sign out".
- Don't put destructive actions in the palette without a confirmation behind them. A
  palette entry is one Enter away from running.
- Don't make the palette the only way to reach something. It is an accelerator, not
  navigation.
```

Create `frameworks/angular/primitives/command-palette/index.ts`:

```ts
export * from './command-palette';
export * from './command-palette.variants';
```

Add `export * from './command-palette';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./bulk-action-bar`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/CommandPalette.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x420" name="CommandPalette" subtitle="Search and selection, rendered from CommandPalette.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-direction:column;gap:calc(var(--sp-1) * 3.5);align-items:stretch;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./CommandPalette.manifest.json')).json();
const c = classesFor(manifest);

const COMMANDS = [
  { label: 'Create a project', icon: 'ph-bold ph-plus', shortcut: 'C' },
  { label: 'Open deployments', icon: 'ph-bold ph-rocket-launch', shortcut: 'G D' },
  { label: 'Invite a teammate', icon: 'ph-bold ph-user-plus' },
  { label: 'Switch to light theme', icon: 'ph-bold ph-sun', shortcut: 'T' },
];

function palette({ query, activeIndex, commands }) {
  const list = el('div', { class: c.list });
  if (commands.length === 0) list.append(el('div', { class: c.empty, text: `No results for "${query}".` }));
  commands.forEach((command, i) => {
    const active = i === activeIndex;
    const row = el('button', { class: `${c.row}${active ? ` ${c.rowActive}` : ''}`, type: 'button' });
    if (command.icon) row.append(el('span', { class: c.rowIcon }, el('i', { class: command.icon, 'aria-hidden': 'true' })));
    row.append(el('span', { class: `${c.rowLabel}${active ? ` ${c.rowLabelActive}` : ''}`, text: command.label }));
    if (command.shortcut) row.append(el('span', { class: c.shortcut, text: command.shortcut }));
    list.append(row);
  });
  const search = el('div', { class: c.search },
    el('i', { class: `${c.searchIcon} ph-bold ph-magnifying-glass`, 'aria-hidden': 'true' }),
    el('input', { class: c.input, value: query, placeholder: 'Search for an action or project…' }),
    el('span', { class: c.esc, text: 'ESC' }));
  return el('div', { class: c.panel }, search, list);
}

mountSpecimen({ sections: [
  section('Second row selected', [palette({ query: '', activeIndex: 1, commands: COMMANDS })]),
  section('No results', [palette({ query: 'zzz', activeIndex: 0, commands: [] })]),
]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `navigation/command-palette.card.html`: the active row is the
crimson soft tint with crimson text, and the selected label is a weight heavier than
the rest.

```bash
git add frameworks/tailwind/components/CommandPalette.manifest.json \
        frameworks/tailwind/components/CommandPalette.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/command-palette frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the command-palette primitive"
```

---

## Task 15: `container-size.ts`, and PageHead

**Reference:** `frameworks/react/components/navigation/PageHead.jsx` and
`frameworks/react/use-container-width.js`, demoed in
`frameworks/react/components/navigation/navigation.card.html`.

`CLAUDE.md` states the rule this task implements in Angular: **responsive branches are
code, not media queries, and they measure the container, not the viewport.** A
`PageHead` inside a narrow panel should stack there even on a 27-inch monitor, and a
viewport query gets that wrong.

The spec puts this helper in phase 2 because the charts need it. PageHead needs it
first, so it lands here and the charts consume it unchanged. It is
**`container-size.ts`, not `use-container-size.ts`**: a signal-returning function is
not a React hook, and carrying the `use` prefix across would import an idiom this
layer does not use.

**Files:**
- Create: `frameworks/angular/primitives/container-size.ts`
- Create: `frameworks/tailwind/components/PageHead.manifest.json`
- Create: `frameworks/tailwind/components/PageHead.card.html`
- Create: `frameworks/angular/primitives/page-head/{page-head.ts,page-head.variants.ts,page-head.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces:
  - `containerWidth(): Signal<number | null>` — the host element's content width,
    `null` until the first measure.
  - `readBreakpoint(name: 'sm' | 'md' | 'lg'): number` — `--bp-<name>` off the
    document root, `NaN` when absent.
  - `PageHead` (selector `arena-page-head`), inputs `title: string`,
    `subtitle?: string`, projects `[arena-actions]`; `pageHeadStyles`.

- [ ] **Step 1: Write the helper**

Create `frameworks/angular/primitives/container-size.ts`:

```ts
import { afterNextRender, DestroyRef, DOCUMENT, ElementRef, inject, signal, Signal } from '@angular/core';

const breakpoints = new Map<string, number>();

/** The host element's content width, `null` until the first measure — render the
 *  WIDE layout on `null` so the narrow branch never flashes. Call from an
 *  injection context (a field initializer or the constructor). */
export function containerWidth(): Signal<number | null> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const destroyRef = inject(DestroyRef);
  const width = signal<number | null>(null);

  afterNextRender(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) width.set(entry.contentRect.width);
    });
    observer.observe(host.nativeElement);
    destroyRef.onDestroy(() => observer.disconnect());
  });

  return width.asReadonly();
}

/** Reads `--bp-<name>` off the document root, once per name. Returns `NaN` when the
 *  token is absent; every comparison against `NaN` is false, which lands on the wide
 *  layout. Call from an injection context. */
export function readBreakpoint(name: 'sm' | 'md' | 'lg'): number {
  const cached = breakpoints.get(name);
  if (cached !== undefined) return cached;
  const doc = inject(DOCUMENT);
  const raw = doc.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(`--bp-${name}`);
  const value = Number.parseFloat(raw ?? '');
  const px = Number.isFinite(value) ? value : Number.NaN;
  breakpoints.set(name, px);
  return px;
}
```

- [ ] **Step 2: Write the manifest**

Create `frameworks/tailwind/components/PageHead.manifest.json`:

```json
{
  "component": "PageHead",
  "slots": {
    "root": "flex justify-between gap-4 mb-5",
    "titles": "min-w-0",
    "title": "font-display font-extrabold text-h1 leading-snug tracking-tight text-base-content m-0",
    "subtitle": "font-body text-sm text-base-content/62 leading-body mt-0.5 mb-0",
    "actions": "flex items-center flex-wrap gap-2 shrink-0"
  },
  "variants": {
    "narrow": {
      "true": { "root": "flex-col items-stretch", "actions": "w-full" },
      "false": { "root": "flex-row items-start", "actions": "w-auto" }
    }
  },
  "defaultVariants": { "narrow": "false" }
}
```

- [ ] **Step 3: Write the recipe and the primitive**

Create `frameworks/angular/primitives/page-head/page-head.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/PageHead.manifest.json' with { type: 'json' };

export const pageHeadStyles = tv(manifest);
```

Create `frameworks/angular/primitives/page-head/page-head.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { containerWidth, readBreakpoint } from '../container-size';
import { pageHeadStyles } from './page-head.variants';

/** Page title, subtitle and actions. Stacks below `--bp-sm`, measured on itself. */
@Component({
  selector: 'arena-page-head',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="styles().root()">
      <div [class]="styles().titles()">
        <h1 [class]="styles().title()">{{ title() }}</h1>
        @if (subtitle(); as caption) {
          <p [class]="styles().subtitle()">{{ caption }}</p>
        }
      </div>
      <div [class]="styles().actions()"><ng-content select="[arena-actions]" /></div>
    </div>
  `,
})
export class PageHead {
  readonly title = input('');
  readonly subtitle = input<string>();

  private readonly width = containerWidth();
  private readonly small = readBreakpoint('sm');
  protected readonly styles = computed(() => {
    const measured = this.width();
    return pageHeadStyles({ narrow: measured !== null && measured < this.small ? 'true' : 'false' });
  });
}
```

- [ ] **Step 4: Write the prompt and the barrels**

Create `frameworks/angular/primitives/page-head/page-head.prompt.md`:

```markdown
Arena page header: the display-weight title, an optional subtitle, and the page's
actions. It measures **itself**, not the viewport, and stacks below `--bp-sm` — a page
head inside a narrow panel stacks there too, on any screen. Actions are projected, so
they are real `mat-button`s wearing Arena.

```html
<arena-page-head title="Deployments" subtitle="Everything shipped in the last 30 days">
  <div arena-actions>
    <button mat-stroked-button>Export</button>
    <button mat-flat-button>New deployment</button>
  </div>
</arena-page-head>
```

**Do / Don't**
- Exactly one `arena-page-head` per screen. It emits the `h1`, and a page with two
  `h1`s has no outline.
- Keep the subtitle to one line of orientation. It is not the place for instructions.
- Don't write a media query to stack it. It already stacks, on its own width, which is
  the measurement that is right more often.
```

Create `frameworks/angular/primitives/page-head/index.ts`:

```ts
export * from './page-head';
export * from './page-head.variants';
```

Add both exports to `frameworks/angular/primitives/index.ts`, alphabetically:

```ts
export * from './container-size';
export * from './page-head';
```

`container-size` is exported from the barrel deliberately: a consumer writing their own
responsive component should reach for Arena's measurement rather than a media query,
and the charts import it from within the layer by relative path.

- [ ] **Step 5: Write the specimen**

Create `frameworks/tailwind/components/PageHead.card.html`:

```html
<!-- @dsCard group="Angular" viewport="820x320" name="PageHead" subtitle="Wide and narrow layouts, rendered from PageHead.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:flex-start;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./PageHead.manifest.json')).json();

/* Both branches are rendered side by side rather than resized, because a specimen
   showing one layout at a time cannot show that the branch exists. */
function head(narrow, width) {
  const c = classesFor(manifest, { narrow: String(narrow) });
  const box = el('div', { class: c.root });
  box.style.width = width;
  box.append(el('div', { class: c.titles },
    el('h1', { class: c.title, text: 'Deployments' }),
    el('p', { class: c.subtitle, text: 'Everything shipped in the last 30 days' })));
  box.append(el('div', { class: c.actions },
    el('span', { class: 'font-body text-ctl text-base-content/82', text: '[ Export ]' }),
    el('span', { class: 'font-body text-ctl text-primary', text: '[ New deployment ]' })));
  return box;
}

mountSpecimen({ sections: [
  section('Wide — row, actions right', [head(false, '640px')]),
  section('Below --bp-sm — stacked, actions full width', [head(true, '360px')]),
]});
</script></body></html>
```

- [ ] **Step 6: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`. `check-angular` is the one that matters
here — `containerWidth()` and `readBreakpoint()` are the first code in the layer that
injects anything, and `strictInjectionParameters` is on.

```bash
git add frameworks/angular/primitives/container-size.ts \
        frameworks/tailwind/components/PageHead.manifest.json \
        frameworks/tailwind/components/PageHead.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/page-head frameworks/angular/primitives/index.ts
git commit -m "feat(angular): measure the container, and add the page-head primitive"
```

---

## Task 16: ThemeToggle

**Reference:** `frameworks/react/components/forms/ThemeToggle.jsx`, demoed in
`frameworks/react/components/forms/forms.card.html`.

React's toggle owns no theme state — the truth is the `arena-light` class on `<html>`,
and it reads it back through a `MutationObserver`. The Angular layer already has the
better answer to the same problem: `ThemeService` is a signal, and a signal is read
without observing the DOM. So this primitive **injects `ThemeService`** and does not
observe anything.

`aria-pressed` reports the **current** dark state, and the icon shows the state you are
in — not the one you would move to. That is the part most often got wrong; keep it.

**Files:**
- Create: `frameworks/tailwind/components/ThemeToggle.manifest.json`
- Create: `frameworks/tailwind/components/ThemeToggle.card.html`
- Create: `frameworks/angular/primitives/theme-toggle/{theme-toggle.ts,theme-toggle.variants.ts,theme-toggle.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Consumes: `ThemeService` from `frameworks/angular/theme/theme-service.ts`.
- Produces: `ThemeToggle` (selector `arena-theme-toggle`), no inputs; `themeToggleStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/ThemeToggle.manifest.json`:

```json
{
  "component": "ThemeToggle",
  "slots": {
    "root": "inline-flex items-center justify-center h-ctl-h min-w-ctl-h w-ctl-h p-0 bg-transparent text-base-content/82 border-[length:var(--bw)] border-base-300 rounded-sm cursor-pointer transition-[background] duration-[var(--dur-fast)] ease-out hover:bg-base-200",
    "icon": "text-[length:var(--icon-md)] leading-ctl"
  }
}
```

The root mirrors React's ghost `IconButton` at `md`, which is what `ThemeToggle.jsx`
renders — same density token, so the toggle re-densifies beside the controls next to it.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/theme-toggle/theme-toggle.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/ThemeToggle.manifest.json' with { type: 'json' };

export const themeToggleStyles = tv(manifest);
```

Create `frameworks/angular/primitives/theme-toggle/theme-toggle.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../theme/theme-service';
import { themeToggleStyles } from './theme-toggle.variants';

/** Switches Arena between dark (default) and light, reading ThemeService's signal. */
@Component({
  selector: 'arena-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [class]="styles().root()" [attr.aria-label]="label()"
            [attr.aria-pressed]="dark()" [title]="label()" (click)="toggle()">
      <i [class]="styles().icon() + ' ' + (dark() ? 'ph-bold ph-sun' : 'ph-bold ph-moon')" aria-hidden="true"></i>
    </button>
  `,
})
export class ThemeToggle {
  private readonly theme = inject(ThemeService);

  protected readonly styles = computed(() => themeToggleStyles());
  protected readonly dark = computed(() => this.theme.theme() === 'dark');
  protected readonly label = computed(() => this.dark() ? 'Switch to light theme' : 'Switch to dark theme');

  protected toggle(): void {
    this.theme.set(this.dark() ? 'light' : 'dark');
  }
}
```

The barrel already exports `ThemeService` from `frameworks/angular/index.ts`; this is
the first primitive to import it, so `check-angular` proves the two halves of the layer
compile together for the first time.

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/theme-toggle/theme-toggle.prompt.md`:

```markdown
Arena theme switch. It owns no state: `ThemeService` is the truth, this reads its
signal and sets it. Arena is dark-first, so `dark` is the default and light is the
`.arena-light` class on `<html>`.

```html
<arena-theme-toggle />
```

**Do / Don't**
- Pair it with `theme/no-fouc.html` in `index.html`. Without that snippet a light-theme
  user gets a dark flash on every load.
- Note that `aria-pressed` reports the theme you are **in**, and the icon shows the
  same thing — a sun while dark, because the sun is what you have. Do not "fix" it to
  show the destination; a toggle that reports its target state reads inverted to a
  screen reader.
- Don't add a third state. A system-preference option belongs in settings, and
  `ThemeService` already falls back to `prefers-color-scheme` when nothing is stored.
```

Create `frameworks/angular/primitives/theme-toggle/index.ts`:

```ts
export * from './theme-toggle';
export * from './theme-toggle.variants';
```

Add `export * from './theme-toggle';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./tag`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/ThemeToggle.card.html`:

```html
<!-- @dsCard group="Angular" viewport="600x220" name="ThemeToggle" subtitle="Dark and light states, rendered from ThemeToggle.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./ThemeToggle.manifest.json')).json();
const c = classesFor(manifest);

/* The specimen toggles the real class on <html>, so the button below is also the
   control for the rest of the page — which is the fastest way to check a manifest
   in both themes. */
function toggle() {
  const icon = el('i', { class: `${c.icon} ph-bold ph-sun`, 'aria-hidden': 'true' });
  const button = el('button', { class: c.root, type: 'button', 'aria-pressed': 'true', 'aria-label': 'Switch to light theme' }, icon);
  button.addEventListener('click', () => {
    const light = document.documentElement.classList.toggle('arena-light');
    icon.setAttribute('class', `${c.icon} ph-bold ${light ? 'ph-moon' : 'ph-sun'}`);
    button.setAttribute('aria-pressed', String(!light));
    button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  });
  return button;
}

mountSpecimen({ sections: [section('Click it — the page follows', [toggle()])]});
</script></body></html>
```

- [ ] **Step 5: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

```bash
git add frameworks/tailwind/components/ThemeToggle.manifest.json \
        frameworks/tailwind/components/ThemeToggle.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/theme-toggle frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the theme-toggle primitive, reading ThemeService"
```

---

## Task 17: Rotor

**Reference:** `frameworks/react/components/brand/Rotor.jsx`, demoed in
`frameworks/react/components/brand/brand.card.html`.

The brand mark, and the one component in the system whose size is **deliberately not
themeable** — `check-dimension-literals.mjs`'s `EXEMPT` says so for React, and the
reason carries: fixing the mark's size to a token would quietly make Dravensoft's
identity resizable by a re-skin. So `size` is a plain input in pixels, not a class.

The spin utility already exists from Task 5.

**Files:**
- Create: `frameworks/tailwind/components/Rotor.manifest.json`
- Create: `frameworks/tailwind/components/Rotor.card.html`
- Create: `frameworks/angular/primitives/rotor/{rotor.ts,rotor.variants.ts,rotor.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`
- Modify (conditionally, Step 5): `scripts/check-dimension-literals.mjs`

**Interfaces:**
- Produces: `Rotor` (selector `arena-rotor`), inputs `size: number`, `color: string`,
  `spin: boolean`; `rotorStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Rotor.manifest.json`:

```json
{
  "component": "Rotor",
  "slots": {
    "root": "inline-flex",
    "svg": ""
  },
  "variants": {
    "spin": {
      "true": { "svg": "arena-rotor-spin" },
      "false": { "svg": "" }
    }
  },
  "defaultVariants": { "spin": "false" }
}
```

The manifest is this thin on purpose: the mark's geometry is path data and its size is
not themeable, so there is nothing else here for a class string to carry.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/rotor/rotor.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Rotor.manifest.json' with { type: 'json' };

export const rotorStyles = tv(manifest);
```

Create `frameworks/angular/primitives/rotor/rotor.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { rotorStyles } from './rotor.variants';

const BLADE = 'M50 50 L92 64.3 L75.2 75.2 L64.3 92 Z';

/** Dravensoft's brand mark. `spin` is for loading and splash surfaces only. */
@Component({
  selector: 'arena-rotor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="styles().root()" [style.width.px]="size()" [style.height.px]="size()">
      <svg viewBox="0 0 100 100" [attr.width]="size()" [attr.height]="size()"
           [attr.fill]="color()" [class]="styles().svg()">
        <path [attr.d]="blade" />
        <path [attr.d]="blade" transform="rotate(120 50 50)" />
        <path [attr.d]="blade" transform="rotate(240 50 50)" />
      </svg>
    </span>
  `,
})
export class Rotor {
  readonly size = input(48);
  readonly color = input('var(--crimson)');
  readonly spin = input(false);

  protected readonly blade = BLADE;
  protected readonly styles = computed(() => rotorStyles({ spin: this.spin() ? 'true' : 'false' }));
}
```

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/rotor/rotor.prompt.md`:

```markdown
Dravensoft's brand mark — three blades at 120°. `spin` loops the rotation and belongs
only on loading and splash surfaces. Under `prefers-reduced-motion` the spin **slows**
rather than stopping: a frozen rotor on a loading screen reads as a hung process.

```html
<arena-rotor />
<arena-rotor [size]="96" spin />
<arena-rotor [size]="24" color="var(--gold)" />
```

**Do / Don't**
- `size` is in pixels and is deliberately not a token. The mark is Dravensoft's
  identity, and a re-skin must not be able to resize it — the same reason its React
  counterpart carries an exemption in `check-dimension-literals.mjs`.
- Don't spin the rotor as decoration. Rotation means "work is happening"; a spinning
  brand mark on an idle page means nothing and costs battery.
- Don't recolour it outside the brand palette. `--crimson` is the default and `--gold`
  is the only other sanctioned mark colour.
```

Create `frameworks/angular/primitives/rotor/index.ts`:

```ts
export * from './rotor';
export * from './rotor.variants';
```

Add `export * from './rotor';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./page-head`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/Rotor.card.html`:

```html
<!-- @dsCard group="Angular" viewport="600x260" name="Rotor" subtitle="The brand mark, rendered from Rotor.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Rotor.manifest.json')).json();
const BLADE = 'M50 50 L92 64.3 L75.2 75.2 L64.3 92 Z';

function rotor({ size, color = 'var(--crimson)', spin = false }) {
  const c = classesFor(manifest, { spin: String(spin) });
  const svg = el('svg', { viewBox: '0 0 100 100', width: size, height: size, fill: color, class: c.svg });
  for (const transform of [null, 'rotate(120 50 50)', 'rotate(240 50 50)']) {
    svg.append(el('path', { d: BLADE, transform }));
  }
  const box = el('span', { class: c.root }, svg);
  box.style.width = `${size}px`;
  box.style.height = `${size}px`;
  return box;
}

mountSpecimen({ sections: [
  section('Sizes', [rotor({ size: 24 }), rotor({ size: 48 }), rotor({ size: 96 })]),
  section('Spinning, and in gold', [rotor({ size: 48, spin: true }), rotor({ size: 48, color: 'var(--gold)' })]),
]});
</script></body></html>
```

- [ ] **Step 5: Run the dimension gate and settle the exemption**

Run: `bun run check:dimensions`

Two possible outcomes, and only one of them changes a file:

- **It passes.** Nothing to do — the gate's rules do not reach an Angular signal input's
  default, and adding an exemption for a violation it does not report would itself fail
  as a stale entry.
- **It reports `frameworks/angular/primitives/rotor/rotor.ts` with `48`.** Add the
  entry to `EXEMPT` in `scripts/check-dimension-literals.mjs`, in the same shape and
  with the reason the React entry carries:

  ```js
  ['frameworks/angular/primitives/rotor/rotor.ts:size:48',
   'the same brand-mark exemption Rotor.jsx carries — Dravensoft\'s identity is explicitly not themeable, and fixing the mark\'s size to a token would make it resizable by a re-skin'],
  ```

  Use the key exactly as the gate prints it; a key that matches nothing fails as a
  stale exemption, which is the discipline working.

- [ ] **Step 6: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `brand/brand.card.html`, then turn on reduced motion and
confirm the spin **slows to a crawl rather than stopping**.

```bash
git add frameworks/tailwind/components/Rotor.manifest.json \
        frameworks/tailwind/components/Rotor.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/rotor frameworks/angular/primitives/index.ts
# only if Step 5 required it:
# git add scripts/check-dimension-literals.mjs
git commit -m "feat(angular): add the rotor primitive"
```

---

## Phase 2 — the three SVG charts, and why they break every rule above

`BarChart`, `LineChart` and `DoughnutChart` have **no manifest, no `.variants.ts` and no
specimen**, and that is the spec's declared exception rather than an omission
(`ChartCard`, which the spec grouped with them, does get one — see Task 19):

- **A chart's visual identity is path data and attribute bindings**, not class strings.
  `[attr.fill]="'var(--color-cat-1)'"` is how React does it too, and a manifest that
  tried to hold it would be a lie about where the styling lives.
- **Gate 1 cannot reach them** — there is no manifest to render from. They are verified
  by gate 2 (they compile) plus a direct comparison against React's
  `frameworks/react/components/charts/charts.card.html`. Both layers draw the same SVG
  from the same tokens, so **a visual difference is a defect in one of them**. This is
  the one place in the project where review is by eye against the reference
  implementation rather than against a specimen of its own.

What does carry over unchanged: every value is a token (`var(--color-cat-N)`,
`var(--border)`, `var(--font-mono)`), a chart carries **identity or meaning, never
both**, the ramp is used **in order and never cycled**, and every chart pairs
`role="img"` with a real `<table>` of its numbers — a picture no one can read is not
an alternative.

---

## Task 18: `chart-internals.ts`

**Reference:** `frameworks/react/components/charts/chart-internals.js` — port it, do not
redesign it. Four components share this maths and the colour contract; writing it once
is the same decision React took, and `resolveColors`'s development-time warning is part
of the contract, not a nicety.

**Files:**
- Create: `frameworks/angular/primitives/chart-internals.ts`

**Interfaces:**
- Produces: `CAT_SLOTS`, `CHART_HEIGHT`, `PAD`, `SR_ONLY`, `catColor(slot)`,
  `toneColor(tone)`, `resolveColors({slot, slots, tone, count})`, `niceMax(max)`,
  `ticks(max, count?)`, `barPath(x, y, w, h, r)`, `arcPath(cx, cy, rOuter, rInner, a0, a1)`,
  and the type `ArenaChartTone = 'success' | 'warning' | 'danger' | 'info'`.

- [ ] **Step 1: Write it**

Create `frameworks/angular/primitives/chart-internals.ts`:

```ts
/** Shared internals for Arena's chart family — the Angular port of
 *  frameworks/react/components/charts/chart-internals.js. Not a component: no quartet,
 *  no manifest, no selector. */

export type ArenaChartTone = 'success' | 'warning' | 'danger' | 'info';

export const CAT_SLOTS = 8;
export const CHART_HEIGHT = 280;
export const PAD = { t: 8, r: 8, b: 28, l: 44 } as const;

/** Visually hidden, still read aloud — the numbers table every chart carries. */
export const SR_ONLY =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';

/** Identity colour for slot N (1-based, clamped). Slots are assigned IN ORDER and
 *  NEVER cycled: a ninth series folds to "Other", small multiples, or direct labels. */
export function catColor(slot: number): string {
  const n = Math.min(CAT_SLOTS, Math.max(1, Math.round(slot) || 1));
  return `var(--color-cat-${n})`;
}

const TONE_VARS: Record<ArenaChartTone, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};

/** Semantic colour, for when a series IS a state. */
export function toneColor(tone: ArenaChartTone): string {
  return TONE_VARS[tone];
}

const warned = new Set<string>();
function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[arena] ${message}`);
}

/** The colour contract, made enforceable: identity (slot/slots) and meaning (tone) are
 *  never both in one chart. Passing both warns and `tone` wins. */
export function resolveColors(options: {
  slot?: number;
  slots?: number[];
  tone?: ArenaChartTone;
  count: number;
}): string[] {
  const { slot, slots, tone, count } = options;
  if (tone && (slot !== undefined || slots !== undefined)) {
    warnOnce('chart: `tone` and `slot`/`slots` are mutually exclusive — a chart carries identity or meaning, never both. `tone` wins; remove the other.');
  }
  if (tone) {
    const colour = toneColor(tone);
    return Array.from({ length: count }, () => colour);
  }
  if (slots) return Array.from({ length: count }, (_, i) => catColor(slots[i] ?? i + 1));
  return Array.from({ length: count }, () => catColor(slot ?? 1));
}

/** Round a max up to a readable axis top (1, 2, 2.5, 5 or 10 × a power of ten). */
export function niceMax(max: number): number {
  if (!(max > 0)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalised = max / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/** A bar rounded at the DATA END only, square where it meets the baseline — a plain
 *  rect with rx would lift the bar off its own axis and misread the value. */
export function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y}`
    + ` L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/** A doughnut segment between two angles (radians, 0 = 3 o'clock). */
export function arcPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    return `${arcPath(cx, cy, rOuter, rInner, a0, mid)} ${arcPath(cx, cy, rOuter, rInner, mid, a1)}`;
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const point = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = point(rOuter, a0);
  const [x1, y1] = point(rOuter, a1);
  const [x2, y2] = point(rInner, a1);
  const [x3, y3] = point(rInner, a0);
  return `M${x0},${y0} A${rOuter},${rOuter} 0 ${large} 1 ${x1},${y1}`
    + ` L${x2},${y2} A${rInner},${rInner} 0 ${large} 0 ${x3},${y3} Z`;
}
```

- [ ] **Step 2: Export it and typecheck**

Add to `frameworks/angular/primitives/index.ts`, alphabetically:

```ts
export * from './chart-internals';
```

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`.

- [ ] **Step 3: Commit**

```bash
git add frameworks/angular/primitives/chart-internals.ts frameworks/angular/primitives/index.ts
git commit -m "feat(angular): port the chart internals and the colour contract"
```

---

## Task 19: ChartCard

**Reference:** `frameworks/react/components/charts/ChartCard.jsx`.

`title` is an uppercase muted microlabel and **not a heading element**: a dashboard is
a grid of tiles, and emitting an `h2` per tile fabricates a document outline nobody
asked for. The chart's own `role="img"` carries the accessible name.

**ChartCard is not one of the SVG charts, and it stops being treated as one here.** The
parity spec counts it among "the 4 charts" and excludes it from the manifest inventory,
but the exclusion's own argument — *a chart's identity is path data and attribute
bindings, which a class string cannot hold* — does not describe a bordered card with a
microlabel. It is expressible, so it gets a manifest like everything else expressible,
and the charts' exception narrows to the three that earn it: BarChart, LineChart,
DoughnutChart. That makes the layer's manifest count **36**, not 35.

**Files:**
- Create: `frameworks/tailwind/components/ChartCard.manifest.json`
- Create: `frameworks/tailwind/components/ChartCard.card.html`
- Create: `frameworks/angular/primitives/chart-card/{chart-card.ts,chart-card.variants.ts,chart-card.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ChartCard` (selector `arena-chart-card`), input `title?: string`,
  projects `[arena-actions]` and default content; `chartCardStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/ChartCard.manifest.json`:

```json
{
  "component": "ChartCard",
  "slots": {
    "root": "flex flex-col gap-3 bg-base-200 border-[length:var(--bw)] border-base-300 rounded-lg p-5",
    "head": "flex items-center justify-between gap-3",
    "title": "font-mono text-ctl-2xs tracking-label uppercase text-base-content/62",
    "actions": "flex items-center gap-2"
  }
}
```

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/chart-card/chart-card.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/ChartCard.manifest.json' with { type: 'json' };

export const chartCardStyles = tv(manifest);
```

Create `frameworks/angular/primitives/chart-card/chart-card.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { chartCardStyles } from './chart-card.variants';

/** The card a chart sits on. `title` is a microlabel, deliberately not a heading. */
@Component({
  selector: 'arena-chart-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="styles().root()">
      <div [class]="styles().head()">
        @if (title(); as label) {
          <span [class]="styles().title()">{{ label }}</span>
        }
        <div [class]="styles().actions()"><ng-content select="[arena-actions]" /></div>
      </div>
      <ng-content />
    </div>
  `,
})
export class ChartCard {
  readonly title = input<string>();

  protected readonly styles = computed(() => chartCardStyles());
}
```

**So the three SVG charts are now the only components in the layer with styling of their
own**, and that is the exception applied where its argument actually holds: they have no
manifest, so their styling is token-valued style attributes exactly as React writes
them. `check-dimension-literals.mjs` scans `.ts` under `frameworks/` and will say so if
a value there is not a token.

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/chart-card/chart-card.prompt.md`:

```markdown
Arena chart tile — the card a chart sits on, with a mono microlabel and an optional
action slot. It is not a heading: a dashboard is a grid of tiles, and one `h2` per tile
invents a document outline. The chart inside carries the accessible name through its
own `role="img"`.

```html
<arena-chart-card title="Deployments per week">
  <button arena-actions mat-icon-button aria-label="Export"><i class="ph-bold ph-download-simple"></i></button>
  <arena-bar-chart [labels]="weeks" [values]="counts" seriesLabel="Deployments" />
</arena-chart-card>
```

**Do / Don't**
- Keep the title short and in the tile's own words. It is a label, not a sentence.
- Don't put two charts in one card. A card is one question answered once.
- Don't reach for this as a general card — that is `mat-card` wearing Arena.
```

Create `frameworks/angular/primitives/chart-card/index.ts`:

```ts
export * from './chart-card';
export * from './chart-card.variants';
```

Add `export * from './chart-card';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./chart-internals`).

- [ ] **Step 4: Write the specimen**

Create `frameworks/tailwind/components/ChartCard.card.html`:

```html
<!-- @dsCard group="Angular" viewport="700x300" name="ChartCard" subtitle="The tile a chart sits on, rendered from ChartCard.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 3.5);align-items:flex-start;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./ChartCard.manifest.json')).json();
const c = classesFor(manifest);

/* The chart itself is not rendered here — it has no manifest, by design. The
   placeholder stands where one goes, so the tile's padding and gap are what the
   page is actually showing. */
function tile({ title, withAction }) {
  const head = el('div', { class: c.head });
  if (title) head.append(el('span', { class: c.title, text: title }));
  const actions = el('div', { class: c.actions });
  if (withAction) actions.append(el('span', { class: 'font-body text-ctl-md text-base-content/62', text: '[ Export ]' }));
  head.append(actions);
  const slot = el('div', { class: 'w-full bg-base-300 rounded-sm' });
  slot.style.height = '140px';
  const root = el('div', { class: c.root }, head, slot);
  root.style.width = '300px';
  return root;
}

mountSpecimen({ sections: [
  section('With a title and an action', [tile({ title: 'Deployments per week', withAction: true })]),
  section('Title only, and bare', [tile({ title: 'Error rate' }), tile({})]),
]});
</script></body></html>
```

- [ ] **Step 5: Gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`, and `check-tailwind` now reporting **17
manifests**.

Compare against React's `charts/charts.card.html`: the tile's border, radius, padding
and the microlabel above the plot must match.

```bash
git add frameworks/tailwind/components/ChartCard.manifest.json \
        frameworks/tailwind/components/ChartCard.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/chart-card frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the chart-card primitive, manifest and all"
```

---

## Task 20: BarChart

**Reference:** `frameworks/react/components/charts/BarChart.jsx`, demoed in
`frameworks/react/components/charts/charts.card.html`.

**Files:**
- Create: `frameworks/angular/primitives/bar-chart/{bar-chart.ts,bar-chart.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Consumes: `containerWidth` from `../container-size`; `PAD`, `CHART_HEIGHT`,
  `resolveColors`, `niceMax`, `ticks`, `barPath`, `SR_ONLY` from `../chart-internals`.
- Produces: `BarChart` (selector `arena-bar-chart`), inputs `labels: string[]`,
  `values: number[]`, `seriesLabel?: string`, `slot?: number`, `slots?: number[]`,
  `tone?: ArenaChartTone`, `valueFormatter: (v: number) => string`.

- [ ] **Step 1: Write the primitive**

Create `frameworks/angular/primitives/bar-chart/bar-chart.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { containerWidth } from '../container-size';
import { ArenaChartTone, CHART_HEIGHT, PAD, SR_ONLY, barPath, niceMax, resolveColors, ticks } from '../chart-internals';

/** Categorical bars on one axis. Identity by `slot`/`slots`, or meaning by `tone`. */
@Component({
  selector: 'arena-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="position:relative;width:100%" [style.height.px]="height">
      <svg width="100%" [attr.height]="height" role="img" [attr.aria-label]="name()"
           style="display:block;overflow:visible" (mouseleave)="hover.set(null)">
        @for (tick of gridLines(); track tick.value) {
          <g>
            <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="tick.y" [attr.y2]="tick.y"
                  stroke="var(--border)" stroke-width="1" />
            <text [attr.x]="pad.l - 8" [attr.y]="tick.y" text-anchor="end" dominant-baseline="middle"
                  fill="var(--text-muted)" font-family="var(--font-mono)" font-size="10">{{ tick.label }}</text>
          </g>
        }
        <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="baseline()" [attr.y2]="baseline()"
              stroke="var(--line-strong)" stroke-width="1" />

        @for (bar of bars(); track bar.index) {
          <g>
            <path [attr.d]="bar.path" [attr.fill]="bar.color"
                  [attr.opacity]="hover() === null || hover() === bar.index ? 1 : 0.55"
                  style="transition:opacity var(--dur-fast) var(--ease-out)" />
            <rect [attr.x]="bar.hitX" [attr.y]="pad.t" [attr.width]="step()" [attr.height]="innerHeight()"
                  fill="transparent" (mouseenter)="hover.set(bar.index)" />
          </g>
        }

        @for (bar of bars(); track bar.index) {
          <text [attr.x]="bar.midX" [attr.y]="height - 8" text-anchor="middle"
                fill="var(--text-muted)" font-family="var(--font-body)" font-size="11">{{ bar.label }}</text>
        }
      </svg>

      @if (active(); as point) {
        <div style="position:absolute;transform:translate(-50%,-100%);pointer-events:none;white-space:nowrap;background:var(--bg-raised);border:var(--bw) solid var(--border-strong);border-radius:var(--r-sm);box-shadow:var(--shadow-2);padding:calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)"
             [style.left.px]="point.midX" [style.top]="'calc(' + point.y + 'px - var(--sp-2))'">
          <div style="font-family:var(--font-body);font-size:var(--dz-text-xs);color:var(--mute)">{{ point.label }}</div>
          <div style="font-family:var(--font-mono);font-size:var(--dz-text-md);color:var(--bone)">{{ point.value }}</div>
        </div>
      }

      <table [attr.style]="srOnly">
        <caption>{{ name() }}</caption>
        <thead><tr><th>Category</th><th>{{ seriesLabel() ?? 'Value' }}</th></tr></thead>
        <tbody>
          @for (bar of bars(); track bar.index) {
            <tr><th scope="row">{{ bar.label }}</th><td>{{ bar.value }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class BarChart {
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly seriesLabel = input<string>();
  readonly slot = input<number>();
  readonly slots = input<number[]>();
  readonly tone = input<ArenaChartTone>();
  readonly valueFormatter = input<(value: number) => string>((value) => String(value));

  protected readonly height = CHART_HEIGHT;
  protected readonly pad = PAD;
  protected readonly srOnly = SR_ONLY;
  protected readonly hover = signal<number | null>(null);

  private readonly measured = containerWidth();
  /** Wide first paint, then measured — the narrow branch never flashes. */
  protected readonly width = computed(() => this.measured() ?? 600);

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return series ? `${series} — bar chart` : 'Bar chart';
  });

  private readonly max = computed(() => niceMax(Math.max(0, ...this.values())));
  private readonly innerWidth = computed(() => Math.max(1, this.width() - PAD.l - PAD.r));
  protected readonly innerHeight = computed(() => Math.max(1, this.height - PAD.t - PAD.b));
  protected readonly step = computed(() => this.innerWidth() / Math.max(1, this.values().length));
  protected readonly baseline = computed(() => PAD.t + this.innerHeight());

  private y(value: number): number {
    return PAD.t + this.innerHeight() - (Math.max(0, value) / this.max()) * this.innerHeight();
  }

  protected readonly gridLines = computed(() =>
    ticks(this.max()).map((value) => ({ value, y: this.y(value), label: this.valueFormatter()(value) })));

  protected readonly bars = computed(() => {
    const colors = resolveColors({ slot: this.slot(), slots: this.slots(), tone: this.tone(), count: this.values().length });
    const step = this.step();
    const barWidth = Math.max(1, step - 2);
    return this.values().map((value, index) => {
      const hitX = PAD.l + index * step;
      const x = hitX + (step - barWidth) / 2;
      const y = this.y(value);
      return {
        index,
        hitX,
        midX: hitX + step / 2,
        y,
        path: barPath(x, y, barWidth, this.baseline() - y, 4),
        color: colors[index],
        label: this.labels()[index] ?? '',
        value: this.valueFormatter()(value),
      };
    });
  });

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.bars()[index] ?? null;
  });
}
```

Three things to keep as they are, because they are load-bearing in React and easy to
lose in a port: the hit target spans the **whole column** (a 1px-tall bar is still
hoverable), the 2px gap between bars is the **surface showing through** rather than a
stroke, and `4` in `barPath` rounds the **data end only**.

- [ ] **Step 2: Write the prompt and the barrels**

Create `frameworks/angular/primitives/bar-chart/bar-chart.prompt.md`:

```markdown
Arena bar chart. One axis, hand-written SVG, every colour a token — so it re-themes
with the rest of Arena and costs no dependency. Identity comes from `slot` (one colour
for the series) or `slots` (a colour per bar, **in ramp order, never cycled**); meaning
comes from `tone`. Passing both warns and `tone` wins, because a chart carries identity
or meaning, never both.

```html
<arena-bar-chart [labels]="weeks" [values]="counts" seriesLabel="Deployments" [slot]="1" />
<arena-bar-chart [labels]="services" [values]="errors" seriesLabel="Errors" tone="danger" />
```

**Do / Don't**
- Give `seriesLabel` — it names the chart for a screen reader and titles the numbers
  table underneath.
- Use `tone` only when the series genuinely *is* a state. A red bar means "bad", and a
  red bar that just means "the second category" makes the chart lie.
- Don't pass a ninth `slots` entry expecting a ninth colour. The ramp is eight, in
  order; a ninth series folds into "Other" or becomes small multiples.
- Don't add a second axis. Arena's charts are one axis, always.
```

Create `frameworks/angular/primitives/bar-chart/index.ts`:

```ts
export * from './bar-chart';
```

Add `export * from './bar-chart';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./avatar`).

- [ ] **Step 3: Gate, compare, commit**

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`.

Then, with `bun run demos` running, open React's
`http://localhost:8000/frameworks/react/components/charts/charts.card.html` and read the
bar chart carefully: tick labels in mono at the left, the baseline in `--line-strong`,
bars rounded only at the top, hover dimming the others to 55%. The Angular chart has no
specimen of its own — this comparison **is** its review, and any difference is a defect
in one of the two layers that must be resolved before the commit.

```bash
git add frameworks/angular/primitives/bar-chart frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the bar-chart primitive"
```

---

## Task 21: LineChart

**Reference:** `frameworks/react/components/charts/LineChart.jsx`.

**Files:**
- Create: `frameworks/angular/primitives/line-chart/{line-chart.ts,line-chart.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `LineChart` (selector `arena-line-chart`), inputs `labels: string[]`,
  `values: number[]`, `seriesLabel?: string`, `slot?: number`, `tone?: ArenaChartTone`,
  `area: boolean`, `valueFormatter: (v: number) => string`.

- [ ] **Step 1: Write the primitive**

Create `frameworks/angular/primitives/line-chart/line-chart.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { containerWidth } from '../container-size';
import { ArenaChartTone, CHART_HEIGHT, PAD, SR_ONLY, niceMax, resolveColors, ticks } from '../chart-internals';

/** A single series over time. One axis, tokens throughout, crosshair snaps to a point. */
@Component({
  selector: 'arena-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="position:relative;width:100%" [style.height.px]="height">
      <svg width="100%" [attr.height]="height" role="img" [attr.aria-label]="name()"
           style="display:block;overflow:visible">
        @for (tick of gridLines(); track tick.value) {
          <g>
            <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="tick.y" [attr.y2]="tick.y"
                  stroke="var(--border)" stroke-width="1" />
            <text [attr.x]="pad.l - 8" [attr.y]="tick.y" text-anchor="end" dominant-baseline="middle"
                  fill="var(--text-muted)" font-family="var(--font-mono)" font-size="10">{{ tick.label }}</text>
          </g>
        }
        <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="baseline()" [attr.y2]="baseline()"
              stroke="var(--line-strong)" stroke-width="1" />

        @if (area() && points().length > 0) {
          <path [attr.d]="areaPath()" [attr.fill]="areaFill()" stroke="none" />
        }

        @if (active(); as point) {
          <line [attr.x1]="point.x" [attr.x2]="point.x" [attr.y1]="pad.t" [attr.y2]="baseline()"
                stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="3 3" />
        }

        @if (points().length > 1) {
          <polyline [attr.points]="polyline()" fill="none" [attr.stroke]="color()" stroke-width="2"
                    stroke-linejoin="round" stroke-linecap="round" />
        }

        @for (point of points(); track point.index) {
          <circle [attr.cx]="point.x" [attr.cy]="point.y" [attr.r]="hover() === point.index ? 5 : 4"
                  [attr.fill]="color()" stroke="var(--surface-card)" stroke-width="2" />
        }

        @for (point of points(); track point.index) {
          <text [attr.x]="point.x" [attr.y]="height - 8" text-anchor="middle"
                fill="var(--text-muted)" font-family="var(--font-body)" font-size="11">{{ point.label }}</text>
        }

        <rect [attr.x]="pad.l" [attr.y]="pad.t" [attr.width]="innerWidth()" [attr.height]="innerHeight()"
              fill="transparent" (mousemove)="onMove($event)" (mouseleave)="hover.set(null)" />
      </svg>

      @if (active(); as point) {
        <div style="position:absolute;transform:translate(-50%,-100%);pointer-events:none;white-space:nowrap;background:var(--bg-raised);border:var(--bw) solid var(--border-strong);border-radius:var(--r-sm);box-shadow:var(--shadow-2);padding:calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)"
             [style.left.px]="point.x" [style.top]="'calc(' + point.y + 'px - calc(var(--sp-1) * 2.5))'">
          <div style="font-family:var(--font-body);font-size:var(--dz-text-xs);color:var(--mute)">{{ point.label }}</div>
          <div style="font-family:var(--font-mono);font-size:var(--dz-text-md);color:var(--bone)">{{ point.formatted }}</div>
        </div>
      }

      <table [attr.style]="srOnly">
        <caption>{{ name() }}</caption>
        <thead><tr><th>Point</th><th>{{ seriesLabel() ?? 'Value' }}</th></tr></thead>
        <tbody>
          @for (point of points(); track point.index) {
            <tr><th scope="row">{{ point.label }}</th><td>{{ point.formatted }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class LineChart {
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly seriesLabel = input<string>();
  readonly slot = input<number>();
  readonly tone = input<ArenaChartTone>();
  readonly area = input(false);
  readonly valueFormatter = input<(value: number) => string>((value) => String(value));

  protected readonly height = CHART_HEIGHT;
  protected readonly pad = PAD;
  protected readonly srOnly = SR_ONLY;
  protected readonly hover = signal<number | null>(null);

  private readonly measured = containerWidth();
  protected readonly width = computed(() => this.measured() ?? 600);

  /** One series, one colour — resolveColors still owns the identity/meaning rule. */
  protected readonly color = computed(() => resolveColors({ slot: this.slot(), tone: this.tone(), count: 1 })[0]);
  /** The area is the series colour at 18% — a tint of the line, never a gradient. */
  protected readonly areaFill = computed(() => `color-mix(in oklab, ${this.color()} 18%, transparent)`);

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return series ? `${series} — line chart` : 'Line chart';
  });

  private readonly max = computed(() => niceMax(Math.max(0, ...this.values())));
  protected readonly innerWidth = computed(() => Math.max(1, this.width() - PAD.l - PAD.r));
  protected readonly innerHeight = computed(() => Math.max(1, this.height - PAD.t - PAD.b));
  protected readonly baseline = computed(() => PAD.t + this.innerHeight());

  private x(index: number): number {
    const count = this.values().length;
    return PAD.l + (count <= 1 ? this.innerWidth() / 2 : (this.innerWidth() / (count - 1)) * index);
  }

  private y(value: number): number {
    return PAD.t + this.innerHeight() - (Math.max(0, value) / this.max()) * this.innerHeight();
  }

  protected readonly gridLines = computed(() =>
    ticks(this.max()).map((value) => ({ value, y: this.y(value), label: this.valueFormatter()(value) })));

  protected readonly points = computed(() => this.values().map((value, index) => ({
    index,
    x: this.x(index),
    y: this.y(value),
    label: this.labels()[index] ?? '',
    formatted: this.valueFormatter()(value),
  })));

  protected readonly polyline = computed(() => this.points().map((p) => `${p.x},${p.y}`).join(' '));

  protected readonly areaPath = computed(() => {
    const points = this.points();
    if (points.length === 0) return '';
    const line = points.map((p) => `${p.x},${p.y}`).join(' L');
    return `M${points[0].x},${this.baseline()} L${line} L${points[points.length - 1].x},${this.baseline()} Z`;
  });

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.points()[index] ?? null;
  });

  /** Nearest point to the pointer, so the crosshair snaps instead of drifting. One
   *  overlay owns the pointer: per-point hit targets leave dead gaps between them. */
  protected onMove(event: MouseEvent): void {
    const points = this.points();
    if (points.length === 0) return;
    const box = (event.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const x = event.clientX - box.left;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i;
    }
    this.hover.set(best);
  }
}
```

React measures against the `<div>`'s box (`e.currentTarget.getBoundingClientRect()` on
the overlay rect, whose left edge is `PAD.l`); the port measures against the `<svg>`'s
box so that `points[i].x`, which is already in SVG coordinates, is compared against the
same origin. Check this by eye in Step 3 — a crosshair that snaps one point early is
this line being wrong.

- [ ] **Step 2: Write the prompt and the barrels**

Create `frameworks/angular/primitives/line-chart/line-chart.prompt.md`:

```markdown
Arena line chart — one series over time, with an optional 18% area tint under it. The
crosshair snaps to the nearest point rather than drifting between them, and the numbers
are also a real table for anyone who cannot see the line.

```html
<arena-line-chart [labels]="days" [values]="latency" seriesLabel="p95 latency" [slot]="3" area />
<arena-line-chart [labels]="days" [values]="errorRate" seriesLabel="Error rate" tone="danger" />
```

**Do / Don't**
- Use `area` for a volume or a total, not for a rate. A filled area says "this much of
  something"; a rate has nothing to fill.
- Use `tone` only when the series *is* a state — see `arena-bar-chart`'s note; the rule
  is the same and the failure is the same.
- Don't plot two series by stacking two line charts. One axis, one series; two series
  that share a scale need a chart Arena does not ship yet, and two that do not share one
  are two charts.
```

Create `frameworks/angular/primitives/line-chart/index.ts`:

```ts
export * from './line-chart';
```

Add `export * from './line-chart';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./error-state`).

- [ ] **Step 3: Gate, compare, commit**

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `charts.card.html`: the same tick labels, the same 2px stroke,
points ringed in the card surface, the crosshair dashed `3 3`, and the tooltip rising
above the point rather than covering it.

```bash
git add frameworks/angular/primitives/line-chart frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the line-chart primitive"
```

---

## Task 22: DoughnutChart

**Reference:** `frameworks/react/components/charts/DoughnutChart.jsx`.

Slices **are** categories, so this chart is identity-only: it takes `slots` and has no
`tone` input at all. The legend is not optional — identity is never colour alone.

**Files:**
- Create: `frameworks/angular/primitives/doughnut-chart/{doughnut-chart.ts,doughnut-chart.prompt.md,index.ts}`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `DoughnutChart` (selector `arena-doughnut-chart`), inputs `labels: string[]`,
  `values: number[]`, `slots?: number[]`, `valueFormatter: (v: number) => string`.

- [ ] **Step 1: Write the primitive**

Create `frameworks/angular/primitives/doughnut-chart/doughnut-chart.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { containerWidth } from '../container-size';
import { CHART_HEIGHT, SR_ONLY, arcPath, resolveColors } from '../chart-internals';

/** Parts of a whole. Slices are categories, so this chart carries identity only. */
@Component({
  selector: 'arena-doughnut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="position:relative;width:100%;display:flex;gap:calc(var(--sp-1) * 4)" [style.height.px]="height">
      <svg [attr.width]="plotWidth()" [attr.height]="height" role="img" aria-label="Doughnut chart"
           style="display:block;flex-shrink:0" (mouseleave)="hover.set(null)">
        @for (segment of segments(); track segment.index) {
          @if (segment.path) {
            <path [attr.d]="segment.path" [attr.fill]="segment.color"
                  stroke="var(--surface-card)" stroke-width="2"
                  [attr.opacity]="hover() === null || hover() === segment.index ? 1 : 0.55"
                  (mouseenter)="hover.set(segment.index)"
                  style="transition:opacity var(--dur-fast) var(--ease-out)" />
          }
        }
        @if (active(); as segment) {
          <text [attr.x]="centreX()" [attr.y]="centreY()" text-anchor="middle" dominant-baseline="middle"
                fill="var(--bone)" font-family="var(--font-mono)" font-size="16">{{ segment.percent }}%</text>
        }
      </svg>

      <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:calc(var(--sp-1) * 1.5);overflow:auto">
        @for (segment of segments(); track segment.index) {
          <div style="display:flex;align-items:center;gap:calc(var(--sp-1) * 2)"
               [style.opacity]="hover() === null || hover() === segment.index ? 1 : 0.55"
               (mouseenter)="hover.set(segment.index)" (mouseleave)="hover.set(null)">
            <span aria-hidden="true" style="width:calc(var(--sp-1) * 2.5);height:calc(var(--sp-1) * 2.5);border-radius:var(--r-xs);flex-shrink:0"
                  [style.background]="segment.color"></span>
            <span style="flex:1;min-width:0;font-family:var(--font-body);font-size:var(--dz-text-sm);color:var(--text-body);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ segment.label }}</span>
            <span style="font-family:var(--font-mono);font-size:var(--dz-text-sm);color:var(--mute)">{{ segment.formatted }}</span>
          </div>
        }
      </div>

      <table [attr.style]="srOnly">
        <caption>Doughnut chart</caption>
        <thead><tr><th>Category</th><th>Value</th></tr></thead>
        <tbody>
          @for (segment of segments(); track segment.index) {
            <tr><th scope="row">{{ segment.label }}</th><td>{{ segment.formatted }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class DoughnutChart {
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly slots = input<number[]>();
  readonly valueFormatter = input<(value: number) => string>((value) => String(value));

  protected readonly height = CHART_HEIGHT;
  protected readonly srOnly = SR_ONLY;
  protected readonly hover = signal<number | null>(null);

  private readonly measured = containerWidth();
  private readonly width = computed(() => this.measured() ?? 600);
  private readonly legendWidth = computed(() => Math.min(180, Math.max(120, this.width() * 0.34)));
  protected readonly plotWidth = computed(() => Math.max(1, this.width() - this.legendWidth() - 16));
  protected readonly centreX = computed(() => this.plotWidth() / 2);
  protected readonly centreY = computed(() => this.height / 2);

  private readonly outerRadius = computed(() => Math.max(1, Math.min(this.plotWidth(), this.height) / 2 - 8));
  private readonly innerRadius = computed(() => this.outerRadius() * 0.62);

  protected readonly segments = computed(() => {
    const values = this.values();
    const colors = resolveColors({
      slots: this.slots() ?? values.map((_, i) => i + 1),
      count: values.length,
    });
    const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
    let angle = -Math.PI / 2;                    // start at 12 o'clock
    return values.map((value, index) => {
      const share = total > 0 ? Math.max(0, value) / total : 0;
      const from = angle;
      const to = angle + share * Math.PI * 2;
      angle = to;
      return {
        index,
        color: colors[index],
        label: this.labels()[index] ?? '',
        formatted: this.valueFormatter()(value),
        percent: Math.round(share * 100),
        path: to > from ? arcPath(this.centreX(), this.centreY(), this.outerRadius(), this.innerRadius(), from, to) : '',
      };
    });
  });

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.segments()[index] ?? null;
  });
}
```

The 2px stroke between slices is the **card surface showing through**, not a border —
which is why it is `var(--surface-card)` and why a doughnut on a different surface needs
that value changed with it.

- [ ] **Step 2: Write the prompt and the barrels**

Create `frameworks/angular/primitives/doughnut-chart/doughnut-chart.prompt.md`:

```markdown
Arena doughnut — parts of one whole, with a legend that is not optional: slices are
categories, and identity is never colour alone. Colours come from the categorical ramp
in order; there is no `tone` input, because a slice cannot be a status.

```html
<arena-doughnut-chart [labels]="regions" [values]="revenue"
                      [valueFormatter]="currency" />
```

**Do / Don't**
- Keep it to five or six slices. Past that the arcs stop being comparable and a bar
  chart reads better — that is not a rendering limit, it is what the shape can carry.
- Make sure the values really are parts of one whole. Two doughnuts whose slices come
  from different totals are two charts that look like one.
- Don't use it for change over time. That is `arena-line-chart`.
```

Create `frameworks/angular/primitives/doughnut-chart/index.ts`:

```ts
export * from './doughnut-chart';
```

Add `export * from './doughnut-chart';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./confirm-dialog`).

- [ ] **Step 3: Gate, compare, commit**

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `charts.card.html`: the ring starts at 12 o'clock, the hole is
62% of the outer radius, hovering a legend row dims the other slices, and the centre
shows the hovered slice's percentage.

```bash
git add frameworks/angular/primitives/doughnut-chart frameworks/angular/primitives/index.ts
git commit -m "feat(angular): add the doughnut-chart primitive"
```

---

## Tasks 24–27 run before Task 23, and are numbered after it

Task 23 was written when this plan ended at 22 slices. Spec 4.75 then shipped four React
components and raised the roster to 21 primitives, and these four tasks are what that
spec's own plan (4.75, Task 7) owed this document. They keep the numbers they were
promised — 24, 25, 26 — and they sit **before** the closeout in this file because that is
where they run: Task 23 cannot honestly claim 21 primitives until they have landed.
Task 27 is not a primitive at all; it is `SideNav`'s Angular story, which is a Material
bridge.

They follow "The shape of a slice" above unchanged, with one addition the tree gained
after that section was written: **each slice now also writes a test file in
`frameworks/angular/test/`**, beside `tag-variants.test.ts`, asserting the recipe rather
than the wrapper. `bun run test:angular` runs them and `bun run check` includes them.

---

## Task 24: AppLogo

**Reference:** `frameworks/react/components/brand/AppLogo.jsx`, demoed in
`frameworks/react/components/brand/brand.card.html`. Source spec:
`docs/superpowers/specs/2026-07-19-4.75-applogo-sidenav-activityfeed-unauthcard-design.md`.

**Nothing defaults, and that is the component's argument.** Arena ships MIT: a lock-up
that rendered Dravensoft's mark when passed nothing would ship someone else's trademark
by omission. `name` is `input.required`, and the mark is projected content the consumer
must supply — an `arena-app-logo` with an empty projection is a bug in the call site, not
a variant.

**The mark's slot is sized; the mark is not.** React clones the mark node and stretches it
to fill the slot, because a mark carrying its own width and a `size` input would fight,
and which one won would decide how the mark sat against the wordmark — the one
relationship a lock-up exists to hold. The manifest does the same with child variants
(`*:block *:w-full *:h-full`) rather than by touching the projected node.

**Files:**
- Create: `frameworks/tailwind/components/AppLogo.manifest.json`
- Create: `frameworks/tailwind/components/AppLogo.card.html`
- Create: `frameworks/angular/primitives/app-logo/{app-logo.ts,app-logo.variants.ts,app-logo.prompt.md,index.ts}`
- Create: `frameworks/angular/test/app-logo-variants.test.ts`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `AppLogo` (selector `arena-app-logo`), inputs `name: string` (required),
  `dim?: string`, `size: 'sm'|'md'|'lg'|'xl'`, `orientation: 'horizontal'|'vertical'`;
  `appLogoStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/AppLogo.manifest.json`:

```json
{
  "component": "AppLogo",
  "slots": {
    "root": "inline-flex items-center",
    "mark": "inline-flex flex-none *:block *:w-full *:h-full",
    "name": "font-display font-black tracking-tight uppercase text-base-content",
    "dim": "text-base-content/62"
  },
  "variants": {
    "size": {
      "sm": { "mark": "size-logo-mark-sm", "name": "text-logo-sm" },
      "md": { "mark": "size-logo-mark-md", "name": "text-logo-md" },
      "lg": { "mark": "size-logo-mark-lg", "name": "text-logo-lg" },
      "xl": { "mark": "size-logo-mark-xl", "name": "text-logo-xl" }
    },
    "orientation": {
      "horizontal": { "root": "flex-row gap-2.5" },
      "vertical": { "root": "flex-col gap-3" }
    }
  },
  "defaultVariants": { "size": "md", "orientation": "horizontal" }
}
```

`size-logo-mark-*` and `text-logo-*` already exist in `frameworks/tailwind/theme.css` —
plan 4.75 added the `logo` family and wired both namespaces. **One `size` input picks
both the mark's box and the wordmark's size**: they are one decision, and the token
family is a fixed repertoire of four pairs rather than one ratio, because no single
mark-to-wordmark ratio is legible at every step.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/app-logo/app-logo.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/AppLogo.manifest.json' with { type: 'json' };

export const appLogoStyles = tv(manifest);
```

Create `frameworks/angular/primitives/app-logo/app-logo.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { appLogoStyles } from './app-logo.variants';

type Size = 'sm' | 'md' | 'lg' | 'xl';
type Orientation = 'horizontal' | 'vertical';

/** Brand lock-up: a projected mark beside or above a product name. Nothing defaults. */
@Component({
  selector: 'arena-app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="styles().root()">
      <span [class]="styles().mark()"><ng-content /></span>
      <span [class]="styles().name()">
        {{ name() }}@if (dim(); as tail) {<span [class]="styles().dim()">{{ tail }}</span>}
      </span>
    </span>
  `,
})
export class AppLogo {
  readonly name = input.required<string>();
  readonly dim = input<string>();
  readonly size = input<Size>('md');
  readonly orientation = input<Orientation>('horizontal');

  protected readonly styles = computed(() =>
    appLogoStyles({ size: this.size(), orientation: this.orientation() }));
}
```

The `@if` sits **immediately** after `{{ name() }}` with no whitespace between them: the
two-ink wordmark is one word split into two inks (`DRAVEN` + `SOFT`), and a space there
is a different lock-up.

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/app-logo/app-logo.prompt.md`:

```markdown
Arena brand lock-up. Project the mark as the component's content and pass the product
name; one `size` picks both the mark's box and the wordmark, from the `--logo-*` scale.
Styling is the sibling `app-logo.variants.ts` recipe.

```html
<arena-app-logo name="Draven" dim="soft" size="md">
  <img src="/assets/your-mark.svg" alt="" />
</arena-app-logo>

<arena-app-logo name="Delivery" size="lg" orientation="vertical">
  <img src="/assets/your-client-mark.svg" alt="" />
</arena-app-logo>
```

**Do / Don't**
- Give the projected mark no width or height of its own. The slot sizes it; a mark that
  brings its own dimensions breaks the ratio the lock-up exists to hold.
- Use `dim` for the second ink of a two-part wordmark, and pass no space between the
  parts — `name="Draven" dim="soft"` renders DRAVENSOFT in two inks, one word.
- Don't ship it with a mark that is not yours. Nothing defaults here on purpose: Arena is
  MIT and a default mark would be someone else's trademark travelling in your build.
- Don't reach for a fifth size. Four steps are the repertoire; a size between them is a
  token question, not a call-site one.
```

Create `frameworks/angular/primitives/app-logo/index.ts`:

```ts
export * from './app-logo';
export * from './app-logo.variants';
```

Add `export * from './app-logo';` to `frameworks/angular/primitives/index.ts`,
alphabetically (first — before `./alert`).

- [ ] **Step 4: Write the test**

Create `frameworks/angular/test/app-logo-variants.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { appLogoStyles } from '../primitives/app-logo/app-logo.variants';

test('every size pairs a mark step with its wordmark step', () => {
  for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
    const s = appLogoStyles({ size });
    assert.match(s.mark(), new RegExp(`size-logo-mark-${size}\\b`));
    assert.match(s.name(), new RegExp(`text-logo-${size}\\b`));
  }
});

test('orientation changes the axis and the gap, nothing else', () => {
  assert.match(appLogoStyles({ orientation: 'horizontal' }).root(), /flex-row/);
  assert.match(appLogoStyles({ orientation: 'vertical' }).root(), /flex-col/);
});

test('the mark slot stretches its projected child rather than sizing it', () => {
  assert.match(appLogoStyles().mark(), /\*:w-full/);
});
```

- [ ] **Step 5: Write the specimen**

Create `frameworks/tailwind/components/AppLogo.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x560" name="AppLogo" subtitle="Four steps of the lock-up, rendered from AppLogo.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-wrap:wrap;gap:calc(var(--sp-1) * 6);align-items:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./AppLogo.manifest.json')).json();

function logo(size, orientation = 'horizontal') {
  const c = classesFor(manifest, { size, orientation });
  return el('span', { class: c.root },
    el('span', { class: c.mark }, el('img', { src: '../../../assets/rotor-crimson.svg', alt: '' })),
    el('span', { class: c.name }, 'Draven', el('span', { class: c.dim, text: 'soft' })));
}

mountSpecimen({ sections: [
  section('Horizontal — sm, md, lg', [logo('sm'), logo('md'), logo('lg')]),
  section('Horizontal — xl', [logo('xl')]),
  section('Vertical', [logo('md', 'vertical'), logo('lg', 'vertical')]),
]});
</script></body></html>
```

`assets/rotor-crimson.svg` is the mark the console's own call sites use; check the path
resolves from `frameworks/tailwind/components/` before concluding anything about the
manifest — a broken image and an unstyled specimen look nothing alike, but neither is
evidence.

- [ ] **Step 6: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `brand/brand.card.html` in dark, light and `.arena-compact`, at
all four steps. Measure the mark and the wordmark in the Computed panel rather than
eyeballing them: `sm` is 30px/17px, `md` 40px/24px, `lg` 54px/34px, `xl` 124px/78px.

```bash
git add frameworks/tailwind/components/AppLogo.manifest.json \
        frameworks/tailwind/components/AppLogo.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/app-logo frameworks/angular/primitives/index.ts \
        frameworks/angular/test/app-logo-variants.test.ts
git commit -m "feat(angular): add the app-logo primitive"
```

---

## Task 25: ActivityFeed

**Reference:** `frameworks/react/components/display/ActivityFeed.jsx`, demoed in
`frameworks/react/components/display/activity-feed.card.html`.

The component holds a **grammar** — someone did something to something, then — and the
typography each part takes. The tone vocabulary is Badge's, taken rather than restated: a
fourth list that is nearly the same as the first is how they drift apart.

**The dot takes `bg-current` and the tone sets its text colour**, which is `Tag`'s
precedent and not an aesthetic preference: the ledger's rule is that danger never gets
`bg-error`, and a tone map that wrote backgrounds directly would have to break it for one
of its seven values. `bg-current` keeps every tone spelled the same way.

**Files:**
- Create: `frameworks/tailwind/components/ActivityFeed.manifest.json`
- Create: `frameworks/tailwind/components/ActivityFeed.card.html`
- Create: `frameworks/angular/primitives/activity-feed/{activity-feed.ts,activity-feed.variants.ts,activity-feed.prompt.md,index.ts}`
- Create: `frameworks/angular/test/activity-feed-variants.test.ts`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `ActivityFeed` (selector `arena-activity-feed`), input
  `items: ActivityItem[]`, where
  `ActivityItem = {id?: string|number, actor: string, action: string, target?: string, time?: string, tone?: Tone}`
  and `Tone = 'neutral'|'accent'|'gold'|'success'|'warning'|'danger'|'info'`;
  `activityFeedStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/ActivityFeed.manifest.json`:

```json
{
  "component": "ActivityFeed",
  "slots": {
    "root": "flex flex-col list-none m-0 p-0",
    "item": "flex items-center gap-3 py-3.5",
    "dot": "flex-none size-2 rounded-pill bg-current",
    "text": "font-body text-ctl text-base-content/82",
    "actor": "font-bold text-base-content",
    "target": "font-mono text-ctl-md text-secondary",
    "time": "ml-auto font-mono text-ctl-sm text-base-content/62"
  },
  "variants": {
    "tone": {
      "neutral": { "dot": "text-base-content/82" },
      "accent": { "dot": "text-primary" },
      "gold": { "dot": "text-secondary" },
      "success": { "dot": "text-success" },
      "warning": { "dot": "text-warning" },
      "danger": { "dot": "text-error" },
      "info": { "dot": "text-info" }
    },
    "divided": {
      "true": { "item": "border-t-[length:var(--bw)] border-base-300" },
      "false": { "item": "border-t-0" }
    }
  },
  "defaultVariants": { "tone": "accent", "divided": "true" }
}
```

`divided` is a variant rather than a `first:` modifier because the rule is "every row but
the first", and `first:border-t-0` would put the exception in the manifest while the
component still has to know which row is first. The template decides; the manifest holds
both spellings. `size-2` is `calc(var(--sp-1) * 2)` — 8px, React's dot.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/activity-feed/activity-feed.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/ActivityFeed.manifest.json' with { type: 'json' };

export const activityFeedStyles = tv(manifest);
```

Create `frameworks/angular/primitives/activity-feed/activity-feed.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { activityFeedStyles } from './activity-feed.variants';

export type ActivityTone = 'neutral' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'info';

export interface ActivityItem {
  id?: string | number;
  actor: string;
  action: string;
  target?: string;
  time?: string;
  tone?: ActivityTone;
}

/** An event feed: someone did something to something, then. */
@Component({
  selector: 'arena-activity-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul [class]="base().root()">
      @for (item of items(); track item.id ?? $index; let first = $first) {
        <li [class]="row(item, first).item()">
          <span [class]="row(item, first).dot()"></span>
          <span [class]="base().text()">
            <b [class]="base().actor()">{{ item.actor }}</b> {{ item.action }}
            @if (item.target) {
              <span [class]="base().target()">{{ item.target }}</span>
            }
          </span>
          @if (item.time) {
            <span [class]="base().time()">{{ item.time }}</span>
          }
        </li>
      }
    </ul>
  `,
})
export class ActivityFeed {
  readonly items = input<readonly ActivityItem[]>([]);

  protected readonly base = () => activityFeedStyles();
  protected row(item: ActivityItem, first: boolean) {
    return activityFeedStyles({ tone: item.tone ?? 'accent', divided: first ? 'false' : 'true' });
  }
}
```

React's `renderItem` escape hatch has **no signal-input analogue** and does not cross:
Angular's version of "replace the row entirely" is content projection or a structural
directive, and either is a design decision this plan does not get to make alone. Record it
as an open question in the closeout rather than inventing an API — the Angular primitive
ships the grammar, and a consumer needing a different row composes the slots by hand from
`activityFeedStyles`, which is exported for exactly that.

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/activity-feed/activity-feed.prompt.md`:

```markdown
Arena event feed. Each item is an actor, an action, an optional target and an optional
time; `tone` colours the leading dot from Badge's vocabulary. Styling is the sibling
`activity-feed.variants.ts` recipe.

```html
<arena-activity-feed [items]="[
  { id: 1, actor: 'Marta', action: 'deployed', target: 'billing@2.4.1', time: '2m', tone: 'success' },
  { id: 2, actor: 'Ivan', action: 'opened an incident on', target: 'auth', time: '18m', tone: 'danger' },
  { id: 3, actor: 'Rae', action: 'approved the rollback', time: '1h' }
]" />
```

**Do / Don't**
- Keep the grammar. The actor is bold, the action is prose, the target is mono — a feed
  whose rows each read differently is a list, not a feed.
- Use `tone` for what the event *means*, not for variety. Seven tones cycling by row is
  decoration, and it makes the one row that matters invisible.
- Don't put controls in a row. A feed reports; an action on an event belongs on the thing
  itself.
```

Create `frameworks/angular/primitives/activity-feed/index.ts`:

```ts
export * from './activity-feed';
export * from './activity-feed.variants';
```

Add `export * from './activity-feed';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./alert`).

- [ ] **Step 4: Write the test**

Create `frameworks/angular/test/activity-feed-variants.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { activityFeedStyles } from '../primitives/activity-feed/activity-feed.variants';

test('the dot carries the tone as a colour, never as a fill', () => {
  for (const tone of ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'] as const) {
    const dot = activityFeedStyles({ tone }).dot();
    assert.match(dot, /bg-current/);
    assert.doesNotMatch(dot, /\bbg-(error|success|warning|info|primary|secondary)/);
  }
});

test('the first row carries no divider and every other one does', () => {
  assert.match(activityFeedStyles({ divided: 'true' }).item(), /border-t-\[length:var\(--bw\)\]/);
  assert.match(activityFeedStyles({ divided: 'false' }).item(), /border-t-0/);
});
```

- [ ] **Step 5: Write the specimen**

Create `frameworks/tailwind/components/ActivityFeed.card.html`:

```html
<!-- @dsCard group="Angular" viewport="760x360" name="ActivityFeed" subtitle="The grammar and the tone dots, rendered from ActivityFeed.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;flex-direction:column;gap:var(--sp-4);margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./ActivityFeed.manifest.json')).json();

function feed(items) {
  const root = el('ul', { class: classesFor(manifest).root });
  items.forEach((item, i) => {
    const c = classesFor(manifest, { tone: item.tone ?? 'accent', divided: String(i > 0) });
    const text = el('span', { class: c.text }, el('b', { class: c.actor, text: item.actor }), ` ${item.action} `);
    if (item.target) text.append(el('span', { class: c.target, text: item.target }));
    const li = el('li', { class: c.item }, el('span', { class: c.dot }), text);
    if (item.time) li.append(el('span', { class: c.time, text: item.time }));
    root.append(li);
  });
  root.style.width = '520px';
  return root;
}

mountSpecimen({ sections: [
  section('A feed', [feed([
    { actor: 'Marta', action: 'deployed', target: 'billing@2.4.1', time: '2m', tone: 'success' },
    { actor: 'Ivan', action: 'opened an incident on', target: 'auth', time: '18m', tone: 'danger' },
    { actor: 'Rae', action: 'approved the rollback', time: '1h' },
    { actor: 'Noor', action: 'invited', target: 'j.okafor@client.io', time: '3h', tone: 'info' },
  ])]),
]});
</script></body></html>
```

- [ ] **Step 6: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `display/activity-feed.card.html` in dark, light and
`.arena-compact`. The first row must have no rule above it, and the times must align on
their right edge.

```bash
git add frameworks/tailwind/components/ActivityFeed.manifest.json \
        frameworks/tailwind/components/ActivityFeed.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/activity-feed frameworks/angular/primitives/index.ts \
        frameworks/angular/test/activity-feed-variants.test.ts
git commit -m "feat(angular): add the activity-feed primitive"
```

---

## Task 26: UnauthCard

**Reference:** `frameworks/react/components/display/UnauthCard.jsx`, demoed in
`frameworks/react/components/display/unauth-card.card.html`.

A **frame, not a form**: it knows nothing about credentials, which is what lets one
component serve sign-in, "check your inbox", "this link expired" and two-factor entry.
Fields are composed inside it from Material's form controls, dressed by
`arena-material.css`. It does **not** centre itself — the product owns the page.

**Two numbers here are arithmetic, not taste, and both must be copied exactly:**

1. **The width.** The panel this replaced put its width, its padding and its border on one
   content-box element, so reproducing its rendered width means adding the three back
   together: 95 steps of content, 18 of padding, and both hairlines —
   `calc(var(--sp-1) * 95 + var(--sp-1) * 18 + var(--bw) * 2)` = 454px. A plain `* 95`
   silently narrows the panel by 74px.
2. **The padding.** React renders `Card` and pads *inside* it, because `Card` pads at
   `calc(var(--sp-1) * 5)` and exposes no padding prop: 20px + 16px is the 36px this
   figure has always had. Keep the inner wrapper; do not "simplify" it to `p-9`.

**The `panel` slot duplicates `Card`'s surface, and nothing gates that.** `Card` is
Material's in the Angular layer (`mat-card`) and its manifest is plan **5b**'s Task 12,
which runs *after* this one — so this manifest carries the surface itself. When 5b's
`Card.manifest.json` lands, the two must agree; no gate compares them, the same hazard
`Tag.manifest.json`/`arena-tag` carries. Check by hand, and say so in the manifest task
there.

**Files:**
- Create: `frameworks/tailwind/components/UnauthCard.manifest.json`
- Create: `frameworks/tailwind/components/UnauthCard.card.html`
- Create: `frameworks/angular/primitives/unauth-card/{unauth-card.ts,unauth-card.variants.ts,unauth-card.prompt.md,index.ts}`
- Create: `frameworks/angular/test/unauth-card-variants.test.ts`
- Modify: `frameworks/angular/primitives/index.ts`

**Interfaces:**
- Produces: `UnauthCard` (selector `arena-unauth-card`), inputs `eyebrow?: string`,
  `title?: string`; projection slots `[brand]`, default content, and `[footer]`;
  `unauthCardStyles`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/UnauthCard.manifest.json`:

```json
{
  "component": "UnauthCard",
  "slots": {
    "root": "w-full max-w-[calc(var(--sp-1)*95+var(--sp-1)*18+var(--bw)*2)]",
    "panel": "bg-base-200 border-[length:var(--bw)] border-base-300 rounded-lg overflow-hidden shadow-3",
    "body": "p-4",
    "brand": "flex mb-7",
    "eyebrow": "font-mono text-ctl-xs tracking-label uppercase text-primary mb-1.5",
    "title": "font-display font-extrabold text-h3 text-base-content mb-6",
    "footer": "mt-5 text-center font-body text-ctl-md text-base-content/62"
  }
}
```

No variants: a frame with a slot per part has nothing enumerable about it. `max-w-[…]` is
a **derivation over tokens**, which plan 4.5 made legal in a bracket — `check:arbitrary`
accepts it and would reject the same number written as `454px`, which is the point.

`brand` is `flex` rather than the default block for a reason worth keeping: the lock-up's
root is `inline-flex`, and a block wrapper around an inline-flex child opens a line box
whose strut adds descender space below it — space that varies with the inherited font
rather than with anything the designer chose. That bug has appeared twice already.

- [ ] **Step 2: Write the recipe and the primitive**

Create `frameworks/angular/primitives/unauth-card/unauth-card.variants.ts`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/UnauthCard.manifest.json' with { type: 'json' };

export const unauthCardStyles = tv(manifest);
```

Create `frameworks/angular/primitives/unauth-card/unauth-card.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { unauthCardStyles } from './unauth-card.variants';

/** The panel a signed-out screen needs — a frame, never the form. */
@Component({
  selector: 'arena-unauth-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="styles().root()">
      <div [class]="styles().panel()">
        <div [class]="styles().body()">
          <div [class]="styles().brand()"><ng-content select="[brand]" /></div>
          @if (eyebrow(); as label) {
            <div [class]="styles().eyebrow()">{{ label }}</div>
          }
          @if (title(); as heading) {
            <div [class]="styles().title()">{{ heading }}</div>
          }
          <ng-content />
          <div [class]="styles().footer()"><ng-content select="[footer]" /></div>
        </div>
      </div>
    </div>
  `,
})
export class UnauthCard {
  readonly eyebrow = input<string>();
  readonly title = input<string>();

  protected readonly styles = computed(() => unauthCardStyles());
}
```

React omits the brand and footer wrappers entirely when they are empty; Angular cannot
test a projection slot for emptiness without a `ContentChild`, so the wrappers always
render. **That is a visible difference, not a wash**: an empty `[brand]` slot still
carries `mb-7`. Add the two `contentChild` queries and `@if` on them, or accept the gap
and say so in the prompt — decide in this task, do not leave it undecided in the tree.

- [ ] **Step 3: Write the prompt and the barrels**

Create `frameworks/angular/primitives/unauth-card/unauth-card.prompt.md`:

```markdown
Arena's signed-out panel. A frame: the lock-up, an eyebrow, a title, whatever the screen
is actually for, and a footer. It knows nothing about credentials, so one component
serves sign-in, "check your inbox", "this link expired" and two-factor entry. Styling is
the sibling `unauth-card.variants.ts` recipe.

```html
<div class="flex min-h-screen items-center justify-center p-gutter">
  <arena-unauth-card eyebrow="Delivery Console" title="Sign in">
    <arena-app-logo brand name="Draven" dim="soft" size="md">
      <img src="/assets/your-mark.svg" alt="" />
    </arena-app-logo>

    <mat-form-field appearance="outline">
      <mat-label>Email</mat-label>
      <input matInput type="email" />
    </mat-form-field>

    <span footer>Trouble signing in? Contact your administrator.</span>
  </arena-unauth-card>
</div>
```

**Do / Don't**
- Centre it yourself. The three-line wrapper above is the whole job, and keeping it out
  of the component is what lets the panel sit in a split layout or inside a dialog.
- Don't put auth logic here. Submit handlers, validation and provider buttons belong to
  the screen; this is the frame around them.
- Don't override the width. 454px is the figure this panel has always rendered at, and it
  is arithmetic — content, padding and both hairlines added back together.
```

Create `frameworks/angular/primitives/unauth-card/index.ts`:

```ts
export * from './unauth-card';
export * from './unauth-card.variants';
```

Add `export * from './unauth-card';` to `frameworks/angular/primitives/index.ts`,
alphabetically (after `./theme-toggle`).

- [ ] **Step 4: Write the test**

Create `frameworks/angular/test/unauth-card-variants.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { unauthCardStyles } from '../primitives/unauth-card/unauth-card.variants';

test('the width is the derivation, never a literal', () => {
  const root = unauthCardStyles().root();
  assert.match(root, /max-w-\[calc\(var\(--sp-1\)\*95\+var\(--sp-1\)\*18\+var\(--bw\)\*2\)\]/);
  assert.doesNotMatch(root, /454px/);
});

test('the panel is a surface with a shadow, and the body pads inside it', () => {
  assert.match(unauthCardStyles().panel(), /bg-base-200/);
  assert.match(unauthCardStyles().panel(), /shadow-3/);
  assert.match(unauthCardStyles().body(), /\bp-4\b/);
});
```

- [ ] **Step 5: Write the specimen**

Create `frameworks/tailwind/components/UnauthCard.card.html`:

```html
<!-- @dsCard group="Angular" viewport="640x520" name="UnauthCard" subtitle="The signed-out frame, rendered from UnauthCard.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<style>body{margin:0;background:var(--bg);color:var(--text-strong);font-family:var(--font-body);padding:var(--sp-6)}.row{display:flex;justify-content:center;margin-bottom:var(--sp-4)}.sub{font-family:var(--font-mono);font-size:var(--dz-text-2xs);letter-spacing:var(--ls-label);line-height:var(--lh-snug);color:var(--mute);text-transform:uppercase;width:100%;margin-bottom:var(--sp-1)}</style>
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./UnauthCard.manifest.json')).json();
const logo = await (await fetch('./AppLogo.manifest.json')).json();

function panel({ eyebrow, title, body, footer }) {
  const c = classesFor(manifest);
  const l = classesFor(logo, { size: 'md' });
  return el('div', { class: c.root },
    el('div', { class: c.panel },
      el('div', { class: c.body },
        el('div', { class: c.brand },
          el('span', { class: l.root },
            el('span', { class: l.mark }, el('img', { src: '../../../assets/rotor-crimson.svg', alt: '' })),
            el('span', { class: l.name }, 'Draven', el('span', { class: l.dim, text: 'soft' })))),
        el('div', { class: c.eyebrow, text: eyebrow }),
        el('div', { class: c.title, text: title }),
        el('div', { class: 'font-body text-md text-base-content/82', text: body }),
        el('div', { class: c.footer, text: footer }))));
}

mountSpecimen({ sections: [
  section('Sign in', [panel({
    eyebrow: 'Delivery Console', title: 'Sign in',
    body: 'Form controls compose inside the frame; the component holds none of them.',
    footer: 'Trouble signing in? Contact your administrator.',
  })]),
  section('Check your inbox — the same frame', [panel({
    eyebrow: 'Delivery Console', title: 'Check your inbox',
    body: 'We sent a sign-in link to your work address. It expires in 15 minutes.',
    footer: 'Wrong address? Start again.',
  })]),
]});
</script></body></html>
```

The specimen centres the panel with its **own** wrapper (`.row { justify-content: center }`),
not with a class on the component — the component not centring itself is the design, and a
specimen that centred it from inside would misreport that.

- [ ] **Step 6: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `display/unauth-card.card.html`. Measure the panel in the Computed
panel: **width 454px**, and 36px between the panel's border and its content on every side.

```bash
git add frameworks/tailwind/components/UnauthCard.manifest.json \
        frameworks/tailwind/components/UnauthCard.card.html \
        frameworks/tailwind/utilities.css \
        frameworks/angular/primitives/unauth-card frameworks/angular/primitives/index.ts \
        frameworks/angular/test/unauth-card-variants.test.ts
git commit -m "feat(angular): add the unauth-card primitive"
```

---

## Task 27: SideNav is a Material bridge, not a primitive

Spec 4.75's fourth component, and the one that does **not** become an `arena-*`
primitive. This plan's stated scope is "the primitives Material does not provide", and
Material provides this one: `mat-nav-list` with `<a mat-list-item [activated]>` is the
item list, with the anchor-or-button distinction, the active state and the keyboard
behaviour already handled. Reimplementing it would duplicate hardened accessibility
badly and strip `arena-material.css` of another reason to exist.

So `SideNav`'s Angular story is a token bridge, and its manifest — for consumers on
neither React nor Material — is plan **5b**'s Task 23.

**Files:**
- Modify: `frameworks/angular/theme/arena-material.css`
- Modify: `frameworks/angular/README.md` (the Material inventory gains one entry)

**Interfaces:**
- Produces: no TypeScript. `mat-nav-list` inside `.arena-side-nav` renders Arena's
  sidebar list.

- [ ] **Step 1: Write the bridge**

In `frameworks/angular/theme/arena-material.css`, after the Tabs block, add:

```css
/* Nav list — Arena's SideNav. Material owns the list; these are its Arena values.
   The active item is crimson on crimson-soft, semibold; the rest are muted medium.
   Scoped to .arena-side-nav so a mat-nav-list elsewhere keeps Material's own look. */
.arena-side-nav.mat-mdc-nav-list {
  --mdc-list-list-item-container-shape: var(--r-sm);
  --mdc-list-list-item-label-text-font: var(--font-body);
  --mdc-list-list-item-label-text-size: var(--dz-text);
  --mdc-list-list-item-label-text-weight: var(--fw-medium);
  --mdc-list-list-item-label-text-color: var(--mute);
  --mdc-list-list-item-hover-label-text-color: var(--mute);
  --mdc-list-list-item-focus-label-text-color: var(--crimson);
}
.arena-side-nav .mdc-list-item--activated {
  --mdc-list-list-item-container-color: var(--crimson-soft);
  --mdc-list-list-item-label-text-color: var(--crimson);
  --mdc-list-list-item-label-text-weight: var(--fw-semibold);
}
```

**Verify every custom property name against Material's own list tokens before writing
them** — an MDC token that does not exist is silently ignored, which is the failure mode
`check-release.mjs` exists to prevent in another corner of this repo. Read the installed
`@angular/material` list theme rather than trusting this block, and correct it here if a
name has moved. Values may only be `var()` into an existing Arena token: no new hex, no
new value, the same rule the rest of this file follows.

- [ ] **Step 2: Document it where the inventory is**

In `frameworks/angular/README.md`, in the Material inventory, add `SideNav`
(`mat-nav-list` + `<a mat-list-item [activated]>`) and note that the active item's
appearance comes from `.arena-side-nav` in `arena-material.css`. Then add the usage
shape:

```html
<mat-nav-list class="arena-side-nav" aria-label="Primary">
  <a mat-list-item href="/overview" [activated]="section === 'overview'"
     [attr.aria-current]="section === 'overview' ? 'page' : null">Overview</a>
  <a mat-list-item href="/projects" [activated]="section === 'projects'"
     [attr.aria-current]="section === 'projects' ? 'page' : null">Projects</a>
</mat-nav-list>
```

`[activated]` is Material's visual state and `aria-current="page"` is the announced one.
**Both are required**: React's `SideNav` sets `aria-current` on the active item, and a
bridge that only coloured it would be a regression in what a screen reader hears.

- [ ] **Step 3: Look at it, then commit**

There is no specimen — this is CSS over a Material component, and nothing static can
render `mat-nav-list`. Compare against React's console sidebar
(`frameworks/react/ui_kits/console/index.html`) in dark and light instead, and Tab
through it: each destination announced as a **link**, the current one as **current
page**, the list inside a labelled navigation landmark.

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`.

```bash
git add frameworks/angular/theme/arena-material.css frameworks/angular/README.md
git commit -m "feat(angular): bridge SideNav through mat-nav-list"
```

---

## Task 23: Close the layer out — documentation, changelog, and the full sweep

Twenty-one primitives exist and no document in the repo says so. Three READMEs and
`CLAUDE.md` describe an Angular layer with one reference primitive, which was true when
they were written and is now the most misleading text in the tree. **Run this after
Tasks 24–27**, which are numbered later than this one and execute before it.

**Files:**
- Modify: `frameworks/angular/README.md`
- Modify: `frameworks/tailwind/README.md`
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Rewrite the Angular README's primitive section**

In `frameworks/angular/README.md`, replace the sentence
"This milestone ships `tag`; further primitives follow it." with:

```markdown
The layer ships **21 primitives**: `activity-feed`, `alert`, `app-logo`, `avatar`,
`bar-chart`, `breadcrumbs`, `bulk-action-bar`, `chart-card`, `command-palette`,
`confirm-dialog`, `doughnut-chart`, `empty-state`, `error-state`, `line-chart`,
`onboarding`, `page-head`, `rotor`, `skeleton`, `stat-card`, `theme-toggle`,
`unauth-card` — plus `tag`, the reference shape, for 22 in all.

**`SideNav` is not among them, and that is the rule working.** Material's `mat-nav-list`
covers the item list, so Arena dresses it in `arena-material.css` (`.arena-side-nav`)
rather than reimplementing it. Its Tailwind manifest exists for consumers on neither
React nor Material.

**The three SVG charts are the declared exception**, and a missing chart manifest is a
decision rather than an omission: a chart's visual identity is path data and attribute
bindings, not class strings, so `bar-chart`, `line-chart` and `doughnut-chart` have no
`*.variants.ts` and style themselves with token-valued style attributes, exactly as
their React counterparts do. `chart-card` is not one of them: it is a bordered tile with
a microlabel, so it has a manifest like every other expressible component.

Two shared files sit beside the primitives and are not components:
`container-size.ts` (the host element's width as a signal, plus `readBreakpoint`) and
`chart-internals.ts` (the chart maths and the identity-or-meaning colour contract).
```

Then add, after the "Conventions" section:

```markdown
## What Material provides, and what Arena does

Parity here is parity of **outcome**, not of inventory: an Angular consumer can build
every interface an Arena React consumer can. Roughly half of it they build with
Material wearing Arena (`theme/arena-material.css`), the rest with Arena's own
primitives.

**Material provides these 22; Arena dresses them and implements none of them:**
Button and IconButton (`mat-button`, `mat-icon-button`), Input and Textarea
(`mat-form-field` + `matInput`), Select (`mat-select`), Checkbox and Radio
(`mat-checkbox`, `mat-radio-group`), Switch (`mat-slide-toggle`), SegmentedControl
(`mat-button-toggle-group`), Card (`mat-card`), Badge (`matBadge`), Table
(`mat-table`), Tabs (`mat-tab-group`), Dialog (`MatDialog`), Menu (`mat-menu`),
Tooltip (`matTooltip`), Toast (`MatSnackBar`), Pagination (`mat-paginator`),
ProgressBar (`mat-progress-bar`), Spinner (`mat-progress-spinner`), Calendar
(`mat-datepicker`) and SideNav (`mat-nav-list` + `<a mat-list-item [activated]>`, scoped
by `.arena-side-nav`).

Reimplementing them as `arena-*` would duplicate years of hardened keyboard
accessibility, overlay positioning, i18n and focus management — badly — and would
strip `arena-material.css` of most of its reason to exist.

## Verifying the layer

`bun run check:angular` compiles every primitive with `ngc` under `strictTemplates`
(`tsconfig.check.json`), and it reaches a primitive **through the barrel** — a
primitive missing from `primitives/index.ts` is not typechecked. Each manifest-backed
primitive also has a static specimen at
`frameworks/tailwind/components/<Component>.card.html`, which renders the real markup
with the real recipe and no Angular executed.
```

- [ ] **Step 2: Update the Tailwind README's inventory**

In `frameworks/tailwind/README.md`, after the "Consumption order" section, add:

```markdown
## What ships here

`components/` holds one manifest per component plus its specimen page. Twenty ship
today — ActivityFeed, AppLogo, Button, Tag, Alert, Avatar, Breadcrumbs, BulkActionBar,
ChartCard, CommandPalette, ConfirmDialog, EmptyState, ErrorState, Onboarding, PageHead,
Rotor, Skeleton, StatCard, ThemeToggle, UnauthCard — and plan 5b adds the twenty more a
framework-neutral consumer hand-rolls because Material would otherwise provide them,
`SideNav` among them.

**The three SVG charts and Calendar have no manifest, on purpose.** `BarChart`,
`LineChart` and `DoughnutChart` are SVG geometry driven by measured container width:
their identity is path data and attribute bindings, and a manifest that tried to hold it
would be a lie about where the styling lives. Calendar is date arithmetic and JS
responsive branches; what a manifest could capture is a fraction of it, and that fraction
would drift from the rest.

`utilities.css` is **generated** — `bun run build:tailwind` compiles the preset with
the manifests as content, and `bun run check:tailwind-generated` fails when the
committed file and the source disagree. It exists so a static specimen page can render
a manifest without a build step; do not edit it.
```

- [ ] **Step 3: Update `CLAUDE.md`**

In `CLAUDE.md`, in the "Framework layers live under `frameworks/`" paragraph, replace
"and standalone `OnPush` primitives under `primitives/` (`tag` is the reference)" with:

```markdown
and 22 standalone `OnPush` primitives under `primitives/` (`tag` is the reference
shape; the three SVG charts are the declared exception — no manifest, no
`.variants.ts`, token-valued style attributes like React's, and reviewed against
React's `charts.card.html` rather than a specimen of their own)
```

In the same file, in the paragraph beginning "**A dimension in a framework layer is a
token**", after the sentence about the gate scanning `.jsx`, `.ts` and `.tsx`, add:

```markdown
It **does** now reach a `*.card.html` under `frameworks/tailwind/components/`
indirectly: those specimens carry no dimensions of their own, because every class they
render comes from the manifest through `classesFor()`. A literal typed into a specimen
is styling the manifest does not carry, which is the one thing a specimen must never
show.
```

And in the "**No gate compares a Tailwind manifest against the component it mirrors**"
sentence, replace the two-example clause with:

```markdown
**No gate compares a Tailwind manifest against the component it mirrors, and the
mapping is not always one-to-one**: most manifests now mirror both a React component
and an `arena-*` primitive, but `Button.manifest.json` mirrors React's `Button.jsx`
with no Angular consumer (Material provides the button), and `Tag.manifest.json`
mirrors the **Angular** primitive `arena-tag`, a different component from React's
`Tag.jsx`. Check by hand when a manifest and a component it mirrors might have drifted.
```

Finally, in the same paragraph, add after the sentence about `bun run check` running
six gates:

```markdown
That count is now eleven — the six above plus `check:tailwind-generated`,
`check:dimensions`, `check:fonts` and `check:angular`, which compiles the Angular
layer's templates under `strictTemplates`.
```

Read the surrounding prose before editing; if the count in the tree differs from
eleven, the tree is right and this line is what needs correcting.

- [ ] **Step 4: Write the changelog entry**

In `CHANGELOG.md`, under `## [Unreleased]` (create the heading if the top entry is a
version — anything landing after a tag goes under `[Unreleased]`, and filing it under
the last version describes a tree nobody has):

```markdown
### Added
- **Angular layer parity — 21 new primitives.** `activity-feed`, `alert`, `app-logo`,
  `avatar`, `bar-chart`, `breadcrumbs`, `bulk-action-bar`, `chart-card`,
  `command-palette`, `confirm-dialog`, `doughnut-chart`, `empty-state`, `error-state`,
  `line-chart`, `onboarding`, `page-head`, `rotor`, `skeleton`, `stat-card`,
  `theme-toggle`, `unauth-card`, each a full quartet and each styled by a Tailwind
  manifest it does not own. Parity is of outcome, not of inventory: the 22 components
  Angular Material provides stay Material's, dressed by `arena-material.css` —
  `SideNav` among them, bridged through `mat-nav-list` rather than reimplemented.
- **18 new component manifests** under `frameworks/tailwind/components/`, each with a
  static specimen page that renders the real markup from the real recipe.
- **`frameworks/tailwind/utilities.css`** — the compiled utility layer, generated by
  `bun run build:tailwind` and gated by `bun run check:tailwind-generated`, so a static
  page can render a manifest with no build step.
- **`bun run check:angular`** — compiles the Angular layer with `ngc` under
  `strictTemplates`. Before this, nothing in the repo could compile Angular at all.
- **`frameworks/angular/primitives/container-size.ts`** — the host element's width as a
  signal, and `readBreakpoint`. Responsive branches measure the container, never the
  viewport, and are code rather than media queries.
- **`frameworks/tailwind/animations.css`** — the two keyframe utilities a manifest
  cannot express (`arena-shimmer`, `arena-rotor-spin`), each answering
  `prefers-reduced-motion` on its own terms.

### Changed
- `check-arbitrary-values.mjs` now accepts a bracket carrying a single value in a unit
  the token layer does not model (`ch`, `%`, `vw`, `vh`, `deg`, `fr`), sharing that
  list with `check-dimension-literals.mjs`. `px`, `rem`, `ms` and `s` are still
  violations — tokens model those.
```

- [ ] **Step 5: The full sweep**

Run every one of these and read the output; this is the spec's Verification section,
executed.

```bash
bun run build:tailwind && bun run check
```
Expected: `check-all: all 11 step(s) passed`, and `check-tailwind` reporting **20
manifests**.

```bash
bun scripts/check-angular.mjs
```
Expected: `check-angular: the layer typechecks under strictTemplates`.

```bash
git diff --stat main -- frameworks/react/
```
Expected: **no output**. React is the reference implementation and this plan does not
touch it. If anything appears here, revert it before going further.

```bash
git status --porcelain
```
Expected: clean — every task committed its own work.

```bash
ls frameworks/angular/primitives/*/  -d | wc -l
```
Expected: `22`.

```bash
for d in frameworks/angular/primitives/*/; do
  for f in index.ts "$(basename "$d").ts" "$(basename "$d").prompt.md"; do
    [ -f "$d$f" ] || echo "MISSING $d$f"
  done
done
```
Expected: no output. (`*.variants.ts` is deliberately absent for the three SVG charts,
which is why it is not in the loop — check those three by eye against the exception the
README now states.)

Then, with `bun run demos` running, open all **19** specimen pages — Tag, written in
Task 2, plus the 14 slices, ChartCard, and Tasks 24–26's three — in **dark**, in
**light**, and in
**`.arena-compact`**, and the React `charts.card.html` beside the three SVG charts. A specimen that renders unstyled means
`utilities.css` is stale — rebuild before concluding anything else.

- [ ] **Step 6: Commit**

```bash
git add frameworks/angular/README.md frameworks/tailwind/README.md CLAUDE.md CHANGELOG.md
git commit -m "docs: the Angular layer is 22 primitives, and says so"
```

---

## What this plan does not do

Stated so the next reader does not go looking:

- **No release.** No version moves in `.claude-plugin/plugin.json`, the marketplace
  entry, or the README header, and no tag is cut. The changelog entry sits under
  `[Unreleased]`, which is where anything landing after a tag belongs.
- **No packaging.** `ng-packagr` is installed and unused; plan 6 uses it.
- **No token changes.** `tokens/`, `styles.css` and the four generated token CSS files
  are untouched. If a manifest seems to need a value with no token behind it, that is a
  finding for plan 4's successor, not a literal.
- **No change to React**, to the plugin manifests, to `support.js`, `theme.js` or
  `jsx-loader.js`.
- **The 21 orphan manifests** — Button, IconButton, Input, Textarea, Select, Checkbox,
  Radio, Switch, SegmentedControl, Card, Badge, Table, Tabs, Dialog, Menu, Tooltip,
  Toast, Pagination, ProgressBar, Spinner, and — since spec 4.75 — SideNav, whose
  Angular story is a `mat-nav-list` bridge rather than a primitive. They are plan 5b,
  and they consume Tasks 1–3 of this plan unchanged.
- **`SideNav` as an `arena-*` primitive.** Material's `mat-nav-list` provides the item
  list, so Task 27 bridges it in `arena-material.css` instead. Its Tailwind manifest —
  for a consumer on neither React nor Material — is plan 5b's Task 23.
- **`ActivityFeed`'s `renderItem` escape hatch, in Angular.** React's row-replacement
  prop has no signal-input analogue; the Angular equivalent is content projection or a
  structural directive, and choosing between them is a design question this plan raises
  in Task 25 rather than settles. A consumer needing a different row composes the slots
  from the exported `activityFeedStyles`.
