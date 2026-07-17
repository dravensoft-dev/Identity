# `frameworks/angular/` — Phase A Milestone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate `frameworks/angular/` with the five bridge artifacts, a shared configured `tv`, the fully-specified `tag` reference primitive, the DAMA adoption playbook, and the `v3.1.0` release — so an Angular 20+/Tailwind-v4 app (DAMA) wears Arena by wiring, not porting.

**Architecture:** Two artifact kinds. **Bridge artifacts** (Tailwind preset entry, Angular Material MDC token bridge, self-hosted fonts, a Phosphor icon manifest, a dark-first theme service) make an *existing* Angular/Material app wear Arena without porting a component. **Angular primitives** are thin, standalone, `OnPush`, signal-based components for the parts Material does not provide, styled by consuming `frameworks/tailwind/` recipes through `tailwind-variants`. This plan ships the bridge + the single `tag` reference primitive (the pattern every later primitive copies); the remaining Phase B/C primitives are follow-on plans.

**Tech Stack:** Tailwind v4 (CSS-first `@theme`), Angular 20+ (standalone, signals, `OnPush`), `tailwind-variants` (`createTV`), Angular Material MDC, Phosphor icons, self-hosted `woff2`. Node 18+ for the fonts fetch script and the `.mjs` validators.

## Verification model (read before starting)

**This repo has no build, no test runner, and no `package.json`.** Do not invent Jest/Angular TestBed steps — nothing would run them. Verification here is concrete and uses only what exists:

- **`.mjs` validators** — `node scripts/check-release.mjs`, `node scripts/check-ramp.mjs`, `node scripts/check-text-contrast.mjs`.
- **`grep` invariant guards** — assert an artifact obeys a rule (no raw hex, no `googleapis` URL, `OnPush` present, no component `styles`, no Spanish, no emoji). Each such guard is written as an exact command with expected output.
- **HTTP serving** for HTML (`python3 -m http.server 8000`).
- **A final scratch Angular app** (Task 11) — the only place the TypeScript artifacts (`tv.ts`, `icon-manifest.ts`, `theme-service.ts`, `tag.ts`) actually compile and render, because this repo cannot compile Angular. It stands in for the spec's acceptance criterion and lives **outside** the repo tree (in the scratchpad), never committed.

Where a classic plan says "write the failing test," this plan writes **the failing guard** (run it before the file exists / before the fix, confirm it fails), then makes it pass. Same TDD loop, real tooling.

---

## Global Constraints

Every task inherits these (copied verbatim from `CLAUDE.md` / the spec):

- **English only.** All code, comments, docs, and UI copy stay in English.
- **`README.md` / `CLAUDE.md` are normative** — update them in the **same** change that adds the Angular layer (index entry + quartet rule).
- **Tokens are the only styling layer.** Primitives and bridges introduce **no new value**; they read tokens (directly or via the Tailwind preset). Adding a bridge/recipe value not backed by a token is a spec violation — add the token first.
- **Dark-first.** Arena default theme is `:root` (dark); light is the `.arena-light` class on `<html>`. No `html.dark` inversion.
- **Danger is outline** — `border` + content in `--error` / `--danger`, transparent fill. The only filled danger surface in the whole system is `ConfirmDialog`'s final confirmation.
- **No gradients. No emoji.** Icons are **Phosphor**, Bold default (Fill = active/selected, Duotone = onboarding only).
- **Component quartet, Angular dialect:** each primitive ships `<name>.ts` (standalone component), `<name>.variants.ts` (the `tailwind-variants` recipe), `<name>.prompt.md` (usage + Do/Don't), and a barrel export.
- **Angular conventions (non-negotiable for drop-in comfort):** standalone components, **no `NgModule`**; `ChangeDetectionStrategy.OnPush` on every component; `input()` / `output()` / `model()` (function-based), `input.required<T>()` when mandatory; **`inject()`** for DI, not constructor params; filenames **kebab-case, no type suffix** (`tag.ts`, `theme-service.ts`); selector prefix **`arena`** (`<arena-tag>`); **no component `styles`** — styling lives in the sibling `<name>.variants.ts` recipe, the template binds `[class]="styles().slot()"`; **no comments** except a JSDoc line on the `@Component` / exported public surface; barrels (`index.ts`), **no import starts with `../`** *inside the Angular layer* (the single documented exception is the cross-layer import of the shared `frameworks/tailwind/tv`, which a consuming app resolves via a path alias).
- **Release moves four things + the tag:** version in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the `README.md` header; a `CHANGELOG.md` entry; `source.ref` naming the tag; the tag on the release commit. Verify with `node scripts/check-release.mjs`.
- **Target version: `3.1.0`** (additive — new framework support) in every release surface.

## File structure (what this plan creates)

```
frameworks/tailwind/
  tv.ts                          # NEW — configured tailwind-variants factory (Task 1)
frameworks/angular/
  theme/
    arena-tailwind.css           # Task 2 — Tailwind preset entry (tokens + shared @theme)
    arena-material.css           # Task 3 — Material MDC token bridge
    arena-material.prompt.md     # Task 3 — import order + what the consumer still owns
    theme-service.ts             # Task 6 — dark-first signal ThemeService
    no-fouc.html                 # Task 6 — pre-paint theme apply snippet
  fonts/
    fonts.css                    # Task 4 — self-hosted @font-face (generated, checked in)
    fetch-fonts.mjs              # Task 4 — downloads latin woff2 + regenerates fonts.css
    *.woff2                      # Task 4 — binaries (git-ignored)
  icons/
    icon-manifest.ts             # Task 5 — canonical Phosphor role→glyph map
  primitives/
    tag/
      tag.ts                     # Task 7 — reference primitive component
      tag.variants.ts            # Task 7 — tailwind-variants recipe
      tag.prompt.md              # Task 7 — usage + Do/Don't
      index.ts                   # Task 7 — barrel
    index.ts                     # Task 7 — primitives barrel
  index.ts                       # Task 7 — angular layer barrel
  README.md                      # Task 8 — Angular layer overview
  ADOPTION.md                    # Task 8 — DAMA migration playbook + alias table
```

Modified: `.gitignore` (Task 4), root `README.md` + `CLAUDE.md` (Task 9), `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` + `README.md` header + `CHANGELOG.md` (Task 10).

---

### Task 1: Shared configured `tv` — `frameworks/tailwind/tv.ts`

The recipe factory every Angular primitive imports (not the bare `tv` from `tailwind-variants`), so twMerge dedupes utilities against Arena's scale. It is a **source artifact consumed by DAMA**, not run in this repo; verification is a grep guard + the Task 11 scratch app.

**Files:**
- Create: `frameworks/tailwind/tv.ts`

**Interfaces:**
- Produces: `export const tv` — a configured `tailwind-variants` factory. Consumed by every `*.variants.ts` (Task 7 and all later primitives) via `import { tv } from '../../../tailwind/tv'`.

- [ ] **Step 1: Write the failing guard**

Run (before the file exists):
```bash
test -f frameworks/tailwind/tv.ts && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create the file**

```ts
/* frameworks/tailwind/tv.ts
   Arena's configured `tailwind-variants` factory. Every recipe imports THIS `tv`
   (not the bare one from 'tailwind-variants') so twMerge dedupes utilities that
   resolve to Arena's semantic token scale. Consumers install `tailwind-variants`
   as a peer dependency; in a consuming app this file is reached through a path
   alias, so the recipe's relative import above it never leaks into product code.

   Arena's colour, radius and spacing utilities use Tailwind's standard scale
   names, which tailwind-merge already groups. The one custom group is the
   `shadow-1..3` elevation scale that tokens/effects.css exposes through
   frameworks/tailwind/theme.css — register it so `shadow-1` and `shadow-2`
   resolve as conflicting and dedupe. */
import { createTV } from 'tailwind-variants';

export const tv = createTV({
  twMerge: true,
  twMergeConfig: {
    classGroups: {
      shadow: [{ shadow: ['1', '2', '3'] }],
    },
  },
});
```

> **Config shape (verified against tailwind-variants docs):** `createTV({ twMerge, twMergeConfig })` takes `twMergeConfig.theme` / `twMergeConfig.classGroups` **directly** — there is no `extend` wrapper (that belongs to tailwind-merge's own `extendTailwindMerge`). Arena's colour/radius/spacing utilities use standard scale names tailwind-merge already knows, so only the non-standard `shadow-1..3` group is registered.

- [ ] **Step 3: Verify the guard passes**

Run:
```bash
test -f frameworks/tailwind/tv.ts && echo FOUND || echo MISSING
grep -c "createTV" frameworks/tailwind/tv.ts
```
Expected: `FOUND` then `2` (the import + the call).

- [ ] **Step 4: Verify no English-only / no-comment-in-Angular violations don't apply here**

This file lives under `frameworks/tailwind/` (shared layer), where the top-of-file comment is allowed. Confirm it's English:
```bash
grep -nP '[áéíóúñ¿¡]' frameworks/tailwind/tv.ts || echo "clean"
```
Expected: `clean`

- [ ] **Step 5: Commit**

```bash
git add frameworks/tailwind/tv.ts
git commit -m "feat(tailwind): add configured tv factory for token-aware recipes"
```

---

### Task 2: Tailwind preset entry — `frameworks/angular/theme/arena-tailwind.css`

One-line consumer entry pulling Arena's tokens + the shared `@theme` preset, so a DAMA `styles.css` replaces its hand-authored `@theme` block with an import.

**Files:**
- Create: `frameworks/angular/theme/arena-tailwind.css`

**Interfaces:**
- Consumes: root `styles.css` (Arena tokens) and `frameworks/tailwind/theme.css` (the `@theme` → utility mapping), both by relative path.
- Produces: a single import target for `ADOPTION.md` step 1.

- [ ] **Step 1: Write the failing guard**

```bash
test -f frameworks/angular/theme/arena-tailwind.css && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create the file**

```css
/* frameworks/angular/theme/arena-tailwind.css
   Consumer entry for an Angular/Tailwind-v4 app. Import this ONCE from the app's
   global stylesheet; it brings Arena's tokens and the shared @theme preset into
   scope so the app deletes its hand-authored @theme block. Adds no value of its
   own — both imports are token-only. */
@import '../../../styles.css';            /* Arena tokens: fonts, palette, colors, type, spacing, effects */
@import '../../tailwind/theme.css';       /* the shared @theme → utility mapping */
```

- [ ] **Step 3: Verify the import paths resolve on disk**

Run (relative resolution from the file's directory):
```bash
cd frameworks/angular/theme && test -f ../../../styles.css && test -f ../../tailwind/theme.css && echo "both resolve"; cd - >/dev/null
```
Expected: `both resolve`

- [ ] **Step 4: Verify it introduces no literal value**

Run (assert the file is imports + comment only — no property/hex):
```bash
grep -nE '#[0-9a-fA-F]{3,8}|:\s*[0-9]' frameworks/angular/theme/arena-tailwind.css || echo "no literals"
```
Expected: `no literals`

- [ ] **Step 5: Commit**

```bash
git add frameworks/angular/theme/arena-tailwind.css
git commit -m "feat(angular): add Tailwind preset entry (tokens + shared @theme)"
```

---

### Task 3: Angular Material MDC bridge — `frameworks/angular/theme/arena-material.css` (+ prompt)

The highest-leverage file. Maps Arena tokens onto Material's `--mdc-*` / `--mat-*` custom properties so every Material-backed control renders in Arena without porting it. Every value is a token; danger stays outline; radius scale respected (`--r-sm` controls / `--r-lg` cards); table headers carry the mono micro-label.

**Files:**
- Create: `frameworks/angular/theme/arena-material.css`
- Create: `frameworks/angular/theme/arena-material.prompt.md`

**Interfaces:**
- Consumes: Arena tokens (in scope via Task 2). Values used: `--color-primary`, `--color-primary-content`, `--r-sm`, `--r-md`, `--r-lg`, `--border`, `--surface-card`, `--color-error`, `--color-base-content`, `--font-mono`, `--mute`.
- Produces: the import target for `ADOPTION.md` step 2.

- [ ] **Step 1: Write the failing guard**

```bash
test -f frameworks/angular/theme/arena-material.css && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create `arena-material.css`**

```css
/* frameworks/angular/theme/arena-material.css — Arena tokens → Angular Material MDC vars.
   Import AFTER Angular Material's theme so these win. Every value is a var() into
   an existing Arena token: no new hex, no new value. Dark-first comes free — the
   tokens are dark-first. Radius: --r-sm for controls, --r-lg for cards/dialogs.
   Danger is OUTLINE (border + text in --color-error), never a fill. */

/* Buttons — filled primary */
.mat-mdc-unelevated-button {
  --mdc-filled-button-container-color: var(--color-primary);
  --mdc-filled-button-label-text-color: var(--color-primary-content);
  --mdc-filled-button-container-shape: var(--r-sm);
}
/* Buttons — outlined (default text/stroked) read the brand + hairline */
.mat-mdc-outlined-button {
  --mdc-outlined-button-outline-color: var(--border);
  --mdc-outlined-button-label-text-color: var(--color-primary);
  --mdc-outlined-button-container-shape: var(--r-sm);
}
/* Danger button — outline only: border + text in --color-error, transparent fill.
   Apply `class="arena-danger"` on the mat-button. Never a filled danger surface. */
.mat-mdc-button.arena-danger,
.mat-mdc-outlined-button.arena-danger {
  --mdc-text-button-label-text-color: var(--color-error);
  --mdc-outlined-button-label-text-color: var(--color-error);
  --mdc-outlined-button-outline-color: var(--color-error);
}

/* Form field — outline appearance */
.mat-mdc-form-field.mat-form-field-appearance-outline {
  --mdc-outlined-text-field-outline-color: var(--border);
  --mdc-outlined-text-field-focus-outline-color: var(--color-primary);
  --mdc-outlined-text-field-container-shape: var(--r-sm);
  --mdc-outlined-text-field-label-text-color: var(--mute);
}

/* Card — elevated surface, large radius */
.mat-mdc-card {
  --mdc-elevated-card-container-color: var(--surface-card);
  --mdc-elevated-card-container-shape: var(--r-lg);
}

/* Dialog — surface + large radius */
.mat-mdc-dialog-surface {
  --mdc-dialog-container-shape: var(--r-lg);
  --mdc-dialog-container-color: var(--surface-card);
}

/* Table — hairline rows; header is the mono uppercase micro-label */
.mat-mdc-table {
  --mat-table-background-color: var(--surface-card);
  --mat-table-row-item-outline-color: var(--border);
}
.mat-mdc-header-cell {
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--mute);
}

/* Tabs — active label + indicator on the brand */
.mat-mdc-tab-group {
  --mat-tab-header-active-label-text-color: var(--color-primary);
  --mat-tab-header-active-focus-label-text-color: var(--color-primary);
  --mdc-tab-indicator-active-indicator-color: var(--color-primary);
}

/* Snackbar / toast surface — medium radius */
.mat-mdc-snack-bar-container {
  --mdc-snackbar-container-shape: var(--r-md);
  --mdc-snackbar-container-color: var(--surface-card);
  --mdc-snackbar-supporting-text-color: var(--color-base-content);
}

/* Progress — spinner + bar on the brand */
.mat-mdc-progress-spinner {
  --mdc-circular-progress-active-indicator-color: var(--color-primary);
}
.mat-mdc-progress-bar {
  --mdc-linear-progress-active-indicator-color: var(--color-primary);
  --mdc-linear-progress-track-color: var(--border);
}
```

- [ ] **Step 3: Create `arena-material.prompt.md`**

```markdown
Arena's Angular Material bridge — maps Arena tokens onto Material's `--mdc-*` /
`--mat-*` custom properties so every Material-backed control (button, form-field,
card, dialog, table, tabs, snackbar, progress) wears Arena without being ported.

**Import order (load-bearing):** import `arena-material.css` **after** Angular
Material's own theme, so these token bindings win the cascade.

```css
@import 'path/to/@angular/material/prebuilt-themes/…';  /* or your material-theme.scss */
@import '.../frameworks/angular/theme/arena-material.css';
```

**What Arena maps vs. what you still own.** Arena maps *tokens* — colors, radii,
the table micro-label. It does **not** replace Material's SCSS palette: you keep
`material-theme.scss` and rebind its primary/secondary palette to Arena's brand
(`--color-primary` / `--color-secondary`). Density and typography config stay yours.

**Do / Don't**
- Use `class="arena-danger"` on a `mat-button` / `mat-stroked-button` for a
  destructive action — it renders as an outline (border + text in `--color-error`).
  Never make a filled danger button; the only filled danger surface is
  `ConfirmDialog`'s final confirmation.
- Don't add a value here that isn't a `var()` into a token. If a control needs a
  colour Arena doesn't have, add the token first.
```

- [ ] **Step 4: Verify — every declaration value is a token, and danger is outline**

Run (find any `--mdc`/`--mat` line whose value is NOT `var(--…)`):
```bash
grep -nE '^\s*--(mdc|mat)-[^:]+:' frameworks/angular/theme/arena-material.css | grep -v 'var(--' || echo "all values are tokens"
```
Expected: `all values are tokens`

Run (assert no filled danger container anywhere):
```bash
grep -niE 'error.*container-color|container-color.*error' frameworks/angular/theme/arena-material.css || echo "danger never filled"
```
Expected: `danger never filled`

- [ ] **Step 5: Verify — required MDC surfaces are all covered**

Run:
```bash
for s in unelevated-button form-field mat-mdc-card dialog-surface mat-mdc-table tab-group snack-bar progress; do
  grep -q "$s" frameworks/angular/theme/arena-material.css && echo "ok $s" || echo "MISSING $s"; done
```
Expected: eight `ok` lines (button, form-field, card, dialog, table, tabs, snackbar, progress).

- [ ] **Step 6: Commit**

```bash
git add frameworks/angular/theme/arena-material.css frameworks/angular/theme/arena-material.prompt.md
git commit -m "feat(angular): add Angular Material MDC token bridge"
```

---

### Task 4: Self-hosted fonts — `frameworks/angular/fonts/fonts.css` + `fetch-fonts.mjs`

Arena's root `tokens/fonts.css` uses the Google Fonts CDN, which a strict CSP blocks. Ship a self-host variant: `fetch-fonts.mjs` downloads the latin `woff2` subsets and regenerates `fonts.css` with local `url()`s only. Binaries are git-ignored; the script + generated CSS are the source of truth.

**Files:**
- Create: `frameworks/angular/fonts/fetch-fonts.mjs`
- Create: `frameworks/angular/fonts/fonts.css` (produced by the script)
- Modify: `.gitignore` (ignore the woff2 binaries)

**Interfaces:**
- Produces: `fonts.css` with `@font-face` for **Archivo** (400–900), **Familjen Grotesk** (400–700), **Spline Sans Mono** (400–700), families matching `tokens/typography.css` (`'Archivo'`, `'Familjen Grotesk'`, `'Spline Sans Mono'`).

- [ ] **Step 1: Write the failing guard**

```bash
test -f frameworks/angular/fonts/fonts.css && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create `fetch-fonts.mjs`**

```js
/* frameworks/angular/fonts/fetch-fonts.mjs
   Downloads the latin-subset woff2 binaries for Arena's three families and
   (re)generates fonts.css with local url()s only — no CDN request, CSP-clean.
   The binaries are git-ignored; this script and fonts.css are the source of
   truth. Run: node frameworks/angular/fonts/fetch-fonts.mjs */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/* A modern-browser UA makes Google Fonts serve woff2 (not ttf). */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const FAMILIES = [
  { css: 'Archivo',           slug: 'archivo',           weights: [400, 500, 600, 700, 800, 900] },
  { css: 'Familjen Grotesk',  slug: 'familjen-grotesk',  weights: [400, 500, 600, 700] },
  { css: 'Spline Sans Mono',  slug: 'spline-sans-mono',  weights: [400, 500, 600, 700] },
];

async function google(css, weights) {
  const family = `${css.replace(/ /g, '+')}:wght@${weights.join(';')}`;
  const url = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`CSS fetch failed for ${css}: ${res.status}`);
  return res.text();
}

/* Pull the latin-subset @font-face blocks: each is preceded by a `/* latin *​/`
   comment and carries a font-weight + a woff2 src url. */
function latinFaces(cssText) {
  const faces = [];
  const re = /\/\*\s*latin\s*\*\/\s*@font-face\s*{([^}]*)}/g;
  let m;
  while ((m = re.exec(cssText)) !== null) {
    const block = m[1];
    const weight = /font-weight:\s*(\d+)/.exec(block)?.[1];
    const src = /src:\s*url\(([^)]+\.woff2)\)/.exec(block)?.[1];
    if (weight && src) faces.push({ weight: Number(weight), src });
  }
  return faces;
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`binary fetch failed: ${url} ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const rules = [];
for (const fam of FAMILIES) {
  const cssText = await google(fam.css, fam.weights);
  const faces = latinFaces(cssText);
  for (const face of faces) {
    const file = `${fam.slug}-${face.weight}.woff2`;
    writeFileSync(join(here, file), await download(face.src));
    rules.push(
      `@font-face {\n` +
        `  font-family: '${fam.css}';\n` +
        `  font-style: normal;\n` +
        `  font-weight: ${face.weight};\n` +
        `  font-display: swap;\n` +
        `  src: url('./${file}') format('woff2');\n` +
        `}`
    );
  }
  console.log(`${fam.css}: ${faces.length} weights`);
}

const header =
  `/* frameworks/angular/fonts/fonts.css — self-hosted, CSP-clean.\n` +
  `   GENERATED by fetch-fonts.mjs; edit that, not this. Families match\n` +
  `   tokens/typography.css (Archivo / Familjen Grotesk / Spline Sans Mono). */\n`;
writeFileSync(join(here, 'fonts.css'), `${header}\n${rules.join('\n\n')}\n`);
console.log('wrote fonts.css');
```

- [ ] **Step 3: Ignore the binaries**

Add to `.gitignore` under the `# Build output` section:
```
# Self-hosted font binaries (regenerated by frameworks/angular/fonts/fetch-fonts.mjs)
frameworks/angular/fonts/*.woff2
```

- [ ] **Step 4: Run the script (network required) and verify output**

Run:
```bash
node frameworks/angular/fonts/fetch-fonts.mjs
```
Expected: three summary lines (`Archivo: 6 weights`, `Familjen Grotesk: 4 weights`, `Spline Sans Mono: 4 weights`) then `wrote fonts.css`.

Run (CSP-clean guard — no CDN URL in the generated CSS):
```bash
grep -c 'googleapis\|gstatic\|http' frameworks/angular/fonts/fonts.css
```
Expected: `0`

Run (families present, local url()s only):
```bash
grep -c "format('woff2')" frameworks/angular/fonts/fonts.css
for f in Archivo "Familjen Grotesk" "Spline Sans Mono"; do grep -q "$f" frameworks/angular/fonts/fonts.css && echo "ok $f"; done
```
Expected: `14` then three `ok` lines.

- [ ] **Step 5: Confirm binaries are ignored, CSS + script staged**

Run:
```bash
git status --porcelain frameworks/angular/fonts/
```
Expected: `fetch-fonts.mjs` and `fonts.css` shown; **no** `*.woff2` lines.

- [ ] **Step 6: Commit**

```bash
git add .gitignore frameworks/angular/fonts/fetch-fonts.mjs frameworks/angular/fonts/fonts.css
git commit -m "feat(angular): self-host fonts (fetch script + CSP-clean fonts.css)"
```

---

### Task 5: Phosphor icon manifest — `frameworks/angular/icons/icon-manifest.ts`

Ship the canonical role→Phosphor-glyph mapping as data so a consumer's `icon-registry.ts` is seeded, not guessed. Bold is default; Fill = active/selected; Duotone = onboarding only.

**Files:**
- Create: `frameworks/angular/icons/icon-manifest.ts`

**Interfaces:**
- Produces: `export interface ArenaIcon { role: string; phosphor: string; weight: 'bold' | 'fill' | 'duotone'; }` and `export const ARENA_ICONS: ArenaIcon[]`. Consumed by `ADOPTION.md` step 5.

- [ ] **Step 1: Write the failing guard**

```bash
test -f frameworks/angular/icons/icon-manifest.ts && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create the file**

```ts
/* frameworks/angular/icons/icon-manifest.ts
   Canonical role > Phosphor glyph map. Seed a consumer's icon registry from this
   instead of guessing. Bold is the default weight; Fill = active/selected;
   Duotone = onboarding only. Glyph names are Phosphor webfont classes (ph-*). */
export interface ArenaIcon {
  role: string;
  phosphor: string;
  weight: 'bold' | 'fill' | 'duotone';
}

export const ARENA_ICONS: ArenaIcon[] = [
  { role: 'nav-home',      phosphor: 'ph-house',           weight: 'bold' },
  { role: 'nav-active',    phosphor: 'ph-house',           weight: 'fill' },
  { role: 'confirm',       phosphor: 'ph-check',           weight: 'bold' },
  { role: 'dismiss',       phosphor: 'ph-x',               weight: 'bold' },
  { role: 'danger',        phosphor: 'ph-trash',           weight: 'bold' },
  { role: 'search',        phosphor: 'ph-magnifying-glass', weight: 'bold' },
  { role: 'add',           phosphor: 'ph-plus',            weight: 'bold' },
  { role: 'more',          phosphor: 'ph-dots-three',      weight: 'bold' },
  { role: 'expand',        phosphor: 'ph-caret-down',      weight: 'bold' },
  { role: 'back',          phosphor: 'ph-caret-left',      weight: 'bold' },
  { role: 'forward',       phosphor: 'ph-caret-right',     weight: 'bold' },
  { role: 'success',       phosphor: 'ph-check-circle',    weight: 'fill' },
  { role: 'warning',       phosphor: 'ph-warning',         weight: 'fill' },
  { role: 'error',         phosphor: 'ph-warning-circle',  weight: 'fill' },
  { role: 'info',          phosphor: 'ph-info',            weight: 'fill' },
  { role: 'user',          phosphor: 'ph-user',            weight: 'bold' },
  { role: 'settings',      phosphor: 'ph-gear',            weight: 'bold' },
  { role: 'onboarding',    phosphor: 'ph-sparkle',         weight: 'duotone' },
];
```

- [ ] **Step 3: Verify weights are constrained + no emoji**

Run (every row's weight is one of the three allowed values):
```bash
grep -oE "weight: '[^']+'" frameworks/angular/icons/icon-manifest.ts | sort -u
```
Expected: exactly `weight: 'bold'`, `weight: 'duotone'`, `weight: 'fill'`.

Run (no emoji / non-ASCII):
```bash
grep -nP '[^\x00-\x7F]' frameworks/angular/icons/icon-manifest.ts || echo "ASCII clean"
```
Expected: `ASCII clean`

- [ ] **Step 4: Commit**

```bash
git add frameworks/angular/icons/icon-manifest.ts
git commit -m "feat(angular): add canonical Phosphor icon manifest"
```

---

### Task 6: Dark-first theme service — `frameworks/angular/theme/theme-service.ts` + `no-fouc.html`

An injectable, signal-based `ThemeService` on Arena's convention: default **dark** (`:root`), light toggles the **`.arena-light`** class on `<html>`, persists to `localStorage`, falls back to `prefers-color-scheme`. Ship the companion pre-paint snippet that applies the stored theme before first paint, sharing the same storage key.

**Files:**
- Create: `frameworks/angular/theme/theme-service.ts`
- Create: `frameworks/angular/theme/no-fouc.html`

**Interfaces:**
- Produces: `export type ArenaTheme = 'dark' | 'light';` and `@Injectable({ providedIn: 'root' }) export class ThemeService` with `readonly theme` (a signal), `toggle()`, and `set(theme: ArenaTheme)`. Storage key constant `arena-theme`. Consumed by `ADOPTION.md` step 3.

- [ ] **Step 1: Write the failing guard**

```bash
test -f frameworks/angular/theme/theme-service.ts && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create `theme-service.ts`**

```ts
/* frameworks/angular/theme/theme-service.ts
   Dark-first theme service. Default is dark (:root); light toggles the
   `.arena-light` class on <html>. Persists to localStorage under `arena-theme`;
   falls back to prefers-color-scheme. Pair with no-fouc.html to apply the stored
   theme before first paint (same storage key). */
import { Injectable, signal, effect, inject, DOCUMENT } from '@angular/core';

export type ArenaTheme = 'dark' | 'light';

const STORAGE_KEY = 'arena-theme';
const LIGHT_CLASS = 'arena-light';

/** Reads/writes Arena's dark-first theme and reflects it onto <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<ArenaTheme>(this.initial());

  constructor() {
    effect(() => {
      const light = this.theme() === 'light';
      this.doc.documentElement.classList.toggle(LIGHT_CLASS, light);
      this.doc.defaultView?.localStorage?.setItem(STORAGE_KEY, this.theme());
    });
  }

  set(theme: ArenaTheme): void {
    this.theme.set(theme);
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private initial(): ArenaTheme {
    const stored = this.doc.defaultView?.localStorage?.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersLight = this.doc.defaultView?.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }
}
```

- [ ] **Step 3: Create `no-fouc.html`**

```html
<!-- frameworks/angular/theme/no-fouc.html
     Paste this <script> into index.html's <head>, BEFORE the app's stylesheet,
     so the stored theme is applied before first paint (no flash). It shares the
     `arena-theme` storage key with theme-service.ts. Dark is the default:
     .arena-light is added only when light is chosen or preferred. -->
<script>
  (function () {
    try {
      var stored = localStorage.getItem('arena-theme');
      var light =
        stored === 'light' ||
        (!stored && window.matchMedia('(prefers-color-scheme: light)').matches);
      if (light) document.documentElement.classList.add('arena-light');
    } catch (e) {}
  })();
</script>
```

- [ ] **Step 4: Verify dark-first convention + Angular conventions**

Run (uses `.arena-light`, never `html.dark`):
```bash
grep -q "arena-light" frameworks/angular/theme/theme-service.ts && grep -q "arena-light" frameworks/angular/theme/no-fouc.html && echo "arena-light in both"
grep -c "html.dark\|classList.add('dark')" frameworks/angular/theme/theme-service.ts
```
Expected: `arena-light in both` then `0`.

Run (signal-based, `inject()` DI, no constructor DI params, single JSDoc only):
```bash
grep -q "providedIn: 'root'" frameworks/angular/theme/theme-service.ts && echo "root-provided"
grep -q "inject(DOCUMENT)" frameworks/angular/theme/theme-service.ts && echo "inject DI"
grep -nE "constructor\([^)]+\)" frameworks/angular/theme/theme-service.ts || echo "no constructor DI params"
grep -q "signal<ArenaTheme>" frameworks/angular/theme/theme-service.ts && echo "signal state"
```
Expected: `root-provided`, `inject DI`, `no constructor DI params`, `signal state`.

- [ ] **Step 5: Verify shared storage key**

Run:
```bash
grep -c "arena-theme" frameworks/angular/theme/theme-service.ts frameworks/angular/theme/no-fouc.html
```
Expected: `theme-service.ts` reports `1` (the `STORAGE_KEY` constant) and `no-fouc.html` reports `1`.

- [ ] **Step 6: Commit**

```bash
git add frameworks/angular/theme/theme-service.ts frameworks/angular/theme/no-fouc.html
git commit -m "feat(angular): add dark-first signal ThemeService + no-FOUC snippet"
```

---

### Task 7: Reference primitive `tag` (quartet + barrels)

The fully-specified primitive every later primitive copies: `OnPush`, signal I/O, `arena-` selector, recipe from the shared `tv`, no component `styles`, one JSDoc line, no other comments. Also lays the two barrels the layer needs.

**Files:**
- Create: `frameworks/angular/primitives/tag/tag.ts`
- Create: `frameworks/angular/primitives/tag/tag.variants.ts`
- Create: `frameworks/angular/primitives/tag/tag.prompt.md`
- Create: `frameworks/angular/primitives/tag/index.ts`
- Create: `frameworks/angular/primitives/index.ts`
- Create: `frameworks/angular/index.ts`

**Interfaces:**
- Consumes: `tv` from `frameworks/tailwind/tv.ts` (Task 1).
- Produces: `export class Tag` (selector `arena-tag`, `readonly tone = input<Tone>('neutral')`), `export const tagStyles`, and the layer barrel re-exporting the primitive, the theme service (Task 6), and the icon manifest (Task 5).

- [ ] **Step 1: Write the failing guard**

```bash
test -f frameworks/angular/primitives/tag/tag.ts && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create `tag.variants.ts`**

```ts
import { tv } from '../../../tailwind/tv';

export const tagStyles = tv({
  slots: {
    root: 'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
    dot: 'h-1.5 w-1.5 rounded-full bg-[currentColor]',
  },
  variants: {
    tone: {
      neutral: { root: 'border-base-300 text-base-content/70' },
      primary: { root: 'border-primary text-primary' },
      success: { root: 'border-success text-success' },
      warning: { root: 'border-warning text-warning' },
      danger: { root: 'border-error text-error' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});
```

- [ ] **Step 3: Create `tag.ts`**

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tagStyles } from './tag.variants';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/** Arena status/emphasis tag — pill, tone taxonomy per the Badge/Tag rule. */
@Component({
  selector: 'arena-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="styles().root()"><span [class]="styles().dot()"></span><ng-content /></span>`,
})
export class Tag {
  readonly tone = input<Tone>('neutral');
  protected readonly styles = computed(() => tagStyles({ tone: this.tone() }));
}
```

- [ ] **Step 4: Create `tag.prompt.md`**

```markdown
Arena status/emphasis tag — a pill whose `tone` follows the Badge/Tag taxonomy.
Standalone, `OnPush`, signal input. Styling is the sibling `tag.variants.ts`
recipe; the component carries no CSS classes of its own.

```html
<arena-tag>Neutral</arena-tag>
<arena-tag tone="primary">Active</arena-tag>
<arena-tag tone="danger">Blocked</arena-tag>
```

**Do / Don't**
- Use `tone="danger"` for a blocked/destructive status — it renders as an
  outline (border + text in `--error`), never a fill. That is the danger
  convention; the only filled danger surface in Arena is `ConfirmDialog`'s
  final confirmation.
- Don't use a tag as a button. It is a status/emphasis label; an action belongs
  on a `mat-button` (or `arena-` control), not on a pill.
- Don't add a `tone` outside the taxonomy — the five tones are the whole set.
```

- [ ] **Step 5: Create the three barrels**

`frameworks/angular/primitives/tag/index.ts`:
```ts
export * from './tag';
export * from './tag.variants';
```

`frameworks/angular/primitives/index.ts`:
```ts
export * from './tag';
```

`frameworks/angular/index.ts`:
```ts
export * from './primitives';
export * from './theme/theme-service';
export * from './icons/icon-manifest';
```

- [ ] **Step 6: Verify Angular conventions (the acceptance guard for the reference primitive)**

Run (OnPush, standalone, signal input, no component styles, `arena-` selector):
```bash
grep -q "ChangeDetectionStrategy.OnPush" frameworks/angular/primitives/tag/tag.ts && echo "OnPush"
grep -q "standalone: true" frameworks/angular/primitives/tag/tag.ts && echo "standalone"
grep -q "input<Tone>" frameworks/angular/primitives/tag/tag.ts && echo "signal input"
grep -q "selector: 'arena-tag'" frameworks/angular/primitives/tag/tag.ts && echo "arena selector"
grep -c "styles:" frameworks/angular/primitives/tag/tag.ts
```
Expected: `OnPush`, `standalone`, `signal input`, `arena selector`, then `0` (no component `styles`).

Run (no comment beyond the single JSDoc line; no `../` import except the documented cross-layer `tv`):
```bash
grep -nE '^\s*//|/\*' frameworks/angular/primitives/tag/tag.ts | grep -v '/\*\*' || echo "no stray comments"
grep -n "from '\.\./" frameworks/angular/primitives/tag/*.ts
```
Expected: `no stray comments`; the only `../` hit is `tag.variants.ts` importing `'../../../tailwind/tv'` (the documented exception).

Run (danger stays outline in the recipe — border/text, never a bg fill):
```bash
grep "danger:" frameworks/angular/primitives/tag/tag.variants.ts | grep -q "border-error text-error" && echo "danger outline"
grep "danger:" frameworks/angular/primitives/tag/tag.variants.ts | grep "bg-error" || echo "no danger fill"
```
Expected: `danger outline` then `no danger fill`.

- [ ] **Step 7: Commit**

```bash
git add frameworks/angular/primitives frameworks/angular/index.ts
git commit -m "feat(angular): add tag reference primitive (quartet + barrels)"
```

---

### Task 8: Angular layer docs — `README.md` + `ADOPTION.md`

The Angular layer overview and the DAMA-specific migration playbook (the deliverable that makes adoption comfortable), including the token alias table shipped as a copy-paste snippet **inside** `ADOPTION.md` (documentation, not an Arena file — Arena stays skin-clean).

**Files:**
- Create: `frameworks/angular/README.md`
- Create: `frameworks/angular/ADOPTION.md`

- [ ] **Step 1: Write the failing guard**

```bash
test -f frameworks/angular/ADOPTION.md && echo FOUND || echo MISSING
```
Expected: `MISSING`

- [ ] **Step 2: Create `frameworks/angular/README.md`**

```markdown
# Arena — Angular layer

Arena support for an Angular 20+/Tailwind-v4 app. Two kinds of artifact:

**Bridge (foundation) — make an existing Angular/Material app wear Arena:**
- `theme/arena-tailwind.css` — one import that brings Arena's tokens + the shared
  `frameworks/tailwind/theme.css` `@theme` preset into scope.
- `theme/arena-material.css` — maps Arena tokens onto Angular Material's
  `--mdc-*` / `--mat-*` vars so every Material control renders in Arena.
- `fonts/` — self-hosted, CSP-clean `@font-face` (Archivo / Familjen Grotesk /
  Spline Sans Mono), regenerated by `fetch-fonts.mjs`.
- `icons/icon-manifest.ts` — canonical Phosphor role→glyph map.
- `theme/theme-service.ts` + `theme/no-fouc.html` — dark-first signal theme
  service (light = `.arena-light`) and the pre-paint snippet.

**Primitives — token-styled components Material does not provide.** Each is a
quartet: `<name>.ts` (standalone, `OnPush`, signal I/O, `arena-` selector),
`<name>.variants.ts` (a `tailwind-variants` recipe built with the shared `tv`),
`<name>.prompt.md` (usage + Do/Don't), and a barrel. `primitives/tag/` is the
reference shape. This milestone ships `tag`; further primitives follow it.

## Conventions

Standalone (no `NgModule`), `OnPush`, `input()`/`output()`/`model()`, `inject()`
for DI, kebab-case filenames with no type suffix, `arena-` selector prefix, no
component `styles` (recipe owns styling), no comments beyond one JSDoc line,
barrels with no `../` imports inside the layer. Dark-first (`.arena-light` for
light). Danger is outline. Icons are Phosphor (Bold default). No gradients, no emoji.

## Adopting it

See [`ADOPTION.md`](./ADOPTION.md) for the step-by-step DAMA playbook.
```

- [ ] **Step 3: Create `frameworks/angular/ADOPTION.md`**

````markdown
# Adopting Arena in an Angular app (DAMA playbook)

A step-by-step migration. Each step is independently landable; you can stop after
step 1–5 (the app "wears Arena" over its current Material + custom components) and
adopt primitives incrementally afterwards.

## 1. Tokens

Replace the app's `src/styles.css` `:root` / `html.dark` `--dama-*` block and its
hand-authored `@theme` with a single import:

```css
@import '../../frameworks/angular/theme/arena-tailwind.css';
```

Keep existing `--dama-*` references resolving during the transition by pasting the
**alias shim** below (documentation-only — it lives in your app, not in Arena).

## 2. Material

Replace `shared/design/material-overrides.css` with:

```css
@import '../../frameworks/angular/theme/arena-material.css';   /* AFTER Material's theme */
```

Rebind `material-theme.scss`'s palette to Arena primary/secondary. Arena maps
tokens; it does not replace Material's SCSS palette.

## 3. Theme

Replace the app's `ThemeService` and the `index.html` no-FOUC script with
`theme/theme-service.ts` and `theme/no-fouc.html`. **Flip the default to dark;**
light is the `.arena-light` class (not `html.dark`).

## 4. Fonts

Run `node frameworks/angular/fonts/fetch-fonts.mjs`, ship the resulting `woff2`
into the app's `public/fonts`, and import `fonts/fonts.css`. No CDN request.

## 5. Icons

Run the FontAwesome→Phosphor swap seeded by `icons/icon-manifest.ts`: install
`@phosphor-icons/web` (or the webfont via `<i class="ph-bold ph-x">`), keep the
`<app-icon>` wrapper so call sites don't churn. Bold default, Fill = active,
Duotone = onboarding only.

## 6. Primitives (incremental)

As each `shared/design/components/*` is touched, replace its `*.variants.ts` with
the Arena recipe or swap to the `arena-*` primitive. Do **not** mass-rewrite.

## Token alias shim (paste into your app, not Arena)

```css
/* dama-aliases.css — transition shim, app-side. Arena stays skin-clean. */
:root {
  --dama-bg: var(--color-base-100);
  --dama-surface: var(--color-base-200);      /* --surface-card */
  --dama-border: var(--color-base-300);       /* --border */
  --dama-text: var(--color-base-content);
  --dama-text-muted: var(--mute);
  --dama-primary: var(--color-primary);       /* --crimson */
  --dama-primary-fg: var(--color-primary-content);
  --dama-success: var(--color-success);
  --dama-warning: var(--color-warning);
  --dama-danger: var(--color-error);
  --dama-radius-sm: var(--r-sm);
  --dama-radius: var(--r-md);
  --dama-radius-md: var(--r-lg);
  --dama-shadow: var(--shadow-1);
  --dama-shadow-lg: var(--shadow-2);
}
```
````

- [ ] **Step 4: Verify — alias table complete, English, references real tokens**

Run (every DAMA alias row from the spec is present):
```bash
for a in dama-bg dama-surface dama-border dama-text dama-text-muted dama-primary dama-primary-fg dama-success dama-warning dama-danger dama-radius-sm dama-radius dama-radius-md dama-shadow dama-shadow-lg; do
  grep -q -- "--$a:" frameworks/angular/ADOPTION.md && echo "ok $a" || echo "MISSING $a"; done
```
Expected: fifteen `ok` lines.

Run (all six adoption steps present, no Spanish):
```bash
grep -cE '^## [1-6]\.' frameworks/angular/ADOPTION.md
grep -nP '[áéíóúñ¿¡]' frameworks/angular/README.md frameworks/angular/ADOPTION.md || echo "English clean"
```
Expected: `6` then `English clean`.

- [ ] **Step 5: Commit**

```bash
git add frameworks/angular/README.md frameworks/angular/ADOPTION.md
git commit -m "docs(angular): add layer README and DAMA adoption playbook"
```

---

### Task 9: Update normative docs — root `README.md` + `CLAUDE.md`

`README.md` / `CLAUDE.md` are normative and must document the Angular layer and its quartet in the same change that adds it.

**Files:**
- Modify: `README.md` (the framework-split section — add the Angular layer + its consumption)
- Modify: `CLAUDE.md` (the "Framework layers live under `frameworks/`" paragraph — describe `frameworks/angular/` contents; the quartet paragraph — add the Angular quartet dialect)

**Interfaces:**
- Consumes: the paths created in Tasks 1–8.

- [ ] **Step 1: Read the target sections**

Run:
```bash
grep -n "frameworks/angular" CLAUDE.md README.md
```
Expected: the current mentions (CLAUDE.md's `frameworks/angular/` holds Angular support; README's split section). Read the surrounding paragraphs before editing.

- [ ] **Step 2: Update `CLAUDE.md` — the `frameworks/` paragraph**

In the "Framework layers live under `frameworks/`" paragraph, replace the phrase `frameworks/angular/` holds Angular support with a concrete inventory:

> `frameworks/angular/` holds the Angular layer: a Tailwind preset entry and an Angular Material MDC token bridge (`theme/`), self-hosted fonts (`fonts/`), a Phosphor icon manifest (`icons/`), a dark-first signal `ThemeService` (`theme/theme-service.ts` + `no-fouc.html`), and standalone `OnPush` primitives under `primitives/` (`tag` is the reference), each styled by the shared `frameworks/tailwind/` recipes through the configured `tv` (`frameworks/tailwind/tv.ts`). See `frameworks/angular/ADOPTION.md`.

- [ ] **Step 3: Update `CLAUDE.md` — the quartet paragraph**

After the React quartet sentence ("`X.jsx`… `X.d.ts`… `X.prompt.md`… and an entry in the group's `*.card.html` demo."), add the Angular dialect:

> The Angular layer's quartet is the analogue: `<name>.ts` (standalone `OnPush` component, `arena-` selector, signal I/O, no component `styles`), `<name>.variants.ts` (a `tailwind-variants` recipe built with `frameworks/tailwind/tv.ts`), `<name>.prompt.md`, and a barrel export. Dark-first (`.arena-light`), danger stays outline, Phosphor icons.

- [ ] **Step 4: Update `README.md` — document the Angular layer**

In the README section that documents the `frameworks/{react,angular,tailwind}` split, add a paragraph pointing consumers at `frameworks/angular/README.md` and `ADOPTION.md`, naming the five bridge artifacts and the primitive quartet. (Match the surrounding prose style — no bullet dump if the section is prose.)

- [ ] **Step 5: Verify the docs name the new artifacts**

Run:
```bash
grep -q "arena-material" CLAUDE.md && grep -q "ThemeService\|theme-service" CLAUDE.md && grep -q "tailwind/tv" CLAUDE.md && echo "CLAUDE ok"
grep -q "ADOPTION.md\|frameworks/angular" README.md && echo "README ok"
grep -nP '[áéíóúñ¿¡]' README.md CLAUDE.md || echo "English clean"
```
Expected: `CLAUDE ok`, `README ok`, `English clean`.

- [ ] **Step 6: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: document the Angular layer and its quartet (normative)"
```

---

### Task 10: Release `v3.1.0`

Move the four release surfaces + the tag together, then verify with `check-release.mjs`. Per `CLAUDE.md`, `check-release.mjs` reads the first *versioned* CHANGELOG entry, and the plugin is served **from the tag** — so `source.ref` and the tag must name `v3.1.0` and the tag must sit on the release commit whose `plugin.json` advertises `3.1.0`.

**Files:**
- Modify: `.claude-plugin/plugin.json` (`version` → `3.1.0`)
- Modify: `.claude-plugin/marketplace.json` (`version` → `3.1.0`, `source.ref` → `v3.1.0`; widen the entry `description` to name Angular)
- Modify: `README.md` (header `**Version 3.1.0**`)
- Modify: `CHANGELOG.md` (new `## [3.1.0] — 2026-07-17` entry)

- [ ] **Step 1: Confirm the pre-release state**

Run:
```bash
node scripts/check-release.mjs; echo "exit: $?"
```
Expected: passes for the current `3.0.0` (exit 0) — the baseline is coherent before you touch anything.

- [ ] **Step 2: Bump `plugin.json`**

Change `"version": "3.0.0"` → `"version": "3.1.0"` in `.claude-plugin/plugin.json`.

- [ ] **Step 3: Bump `marketplace.json`**

In `.claude-plugin/marketplace.json`: set `"version": "3.1.0"`, set `"ref": "v3.1.0"`, and update the arena entry `description` to name the Angular layer, e.g.:

> "Arena — Dravensoft's design system as an Agent Skill: design tokens, React + Angular primitives, a shared Tailwind layer, guidelines, and a UI kit for generating well-branded interfaces."

- [ ] **Step 4: Bump the `README.md` header**

Change `**Version 3.0.0**` → `**Version 3.1.0**` in the README header line.

- [ ] **Step 5: Add the `CHANGELOG.md` entry**

Insert directly under the `# Changelog` preamble, **above** `## [3.0.0]`:

```markdown
## [3.1.0] — 2026-07-17

### Added

- **`frameworks/angular/`** — the Angular layer. Bridge artifacts: a Tailwind
  preset entry (`theme/arena-tailwind.css`), an Angular Material MDC token bridge
  (`theme/arena-material.css`), self-hosted CSP-clean fonts (`fonts/`), a Phosphor
  icon manifest (`icons/icon-manifest.ts`), and a dark-first signal `ThemeService`
  (`theme/theme-service.ts` + `no-fouc.html`). Plus the `tag` reference primitive
  (standalone, `OnPush`, `arena-` selector) and the DAMA adoption playbook
  (`ADOPTION.md`).
- **`frameworks/tailwind/tv.ts`** — a configured `tailwind-variants` factory the
  Angular recipes consume so utilities dedupe against Arena's token scale.
```

- [ ] **Step 6: Commit the release, then tag it**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json README.md CHANGELOG.md
git commit -m "Release v3.1.0: frameworks/angular — bridge + tag reference primitive"
git tag -a v3.1.0 -m "Arena v3.1.0 — Angular layer (Phase A milestone)"
```

- [ ] **Step 7: Verify the release is coherent**

Run:
```bash
node scripts/check-release.mjs; echo "exit: $?"
node scripts/check-ramp.mjs; echo "ramp: $?"
node scripts/check-text-contrast.mjs; echo "contrast: $?"
```
Expected: all three exit `0` (release coherent — `plugin.json` at the pinned tag advertises `3.1.0`; tokens untouched so ramp/contrast still pass).

---

### Task 11: End-to-end verification — scratch Angular app (acceptance)

This repo cannot compile Angular; this is the one place `tv.ts`, `icon-manifest.ts`, `theme-service.ts`, and `tag.ts` actually compile and render, satisfying the spec's acceptance criterion. **The scratch app lives in the scratchpad, is never committed, and is deleted after.**

**Files:**
- Create (scratchpad only): a minimal Angular 20 app that imports the Arena Angular layer by relative path.

- [ ] **Step 1: Scaffold a throwaway Angular app in the scratchpad**

Run:
```bash
cd /tmp/claude-1000/-home-juan-Dravensoft-Identity/0e8e91ec-a130-4833-9d26-e4e69bcdeaf8/scratchpad
npx -y @angular/cli@latest new arena-smoke --style css --routing false --ssr false --skip-git --defaults
cd arena-smoke
npm i @angular/material tailwind-variants tailwindcss
```
Expected: the app scaffolds and installs (network required).

- [ ] **Step 2: Wire Arena in**

- Copy or symlink the repo's `frameworks/` + `styles.css` + `tokens/` into the app (or point a tsconfig path at them). Import `arena-tailwind.css` and `arena-material.css` in `src/styles.css`, add the `no-fouc.html` snippet to `index.html`, and in `App` render a `mat-raised-button`, an `<arena-tag tone="danger">Blocked</arena-tag>`, and a Phosphor icon; inject `ThemeService` and add a toggle button.

- [ ] **Step 3: Build — the TypeScript compiles under strict + OnPush**

Run:
```bash
npx ng build 2>&1 | tail -20
```
Expected: build succeeds — `tag.ts` (signal input, `computed`, no `styles`), `theme-service.ts` (`inject`, signal), `icon-manifest.ts`, and `tv.ts` all typecheck under Angular strict. A build error here is a real defect in the corresponding task — fix that task's file, don't patch the scratch app.

- [ ] **Step 4: Run and eyeball the acceptance scenario**

Run `npx ng serve`, open the app, and confirm:
- The `mat-raised-button` and `<arena-tag>` render in Arena's **dark** theme.
- The theme toggle flips `<html>` to `.arena-light` and back.
- The Phosphor icon renders (Bold).
- **No CDN font request** in the Network tab (fonts load from local `woff2`).

- [ ] **Step 5: Tear down**

Run:
```bash
cd /tmp/claude-1000/-home-juan-Dravensoft-Identity/0e8e91ec-a130-4833-9d26-e4e69bcdeaf8/scratchpad && rm -rf arena-smoke
```
Nothing to commit — the scratch app is disposable.

---

## Follow-on (out of this plan's scope)

- **Phase B primitives** (`badge`, `stat-card`, `empty-state`, `error-state`, `skeleton`, `callout`/`alert`, `page-head`, `segmented-control`, `breadcrumbs`, `pagination`, `avatar`, `progress-bar`, `spinner`, `tooltip`, `rotor`) — each a quartet copying the `tag` pattern, porting its React source's styling into a `tailwind-variants` recipe. One follow-on plan (or a per-component loop) using this plan's Task 7 as the template.
- **Phase C composites** (`table`, `calendar`, charts, `dialog`/`confirm-dialog`, `command-palette`, `bulk-action-bar`, `onboarding`, `toast`) — thin wrappers over Material + the token recipes.
- **A full DAMA cutover** — runs in the DAMA repo, guided by `ADOPTION.md`.
- **Web-Component builds** of the primitives — a later spec if a non-Angular, non-React consumer appears.

## Self-review

- **Spec coverage:** Part 1's five bridge artifacts → Tasks 2 (preset), 3 (Material bridge), 4 (fonts), 5 (icons), 6 (theme service); the shared `tv` → Task 1; the fully-specified `tag` reference primitive + quartet + barrels → Task 7; Part 3 `ADOPTION.md` + alias table → Task 8; normative-doc update → Task 9; release `3.1.0` + `check-release`/`check-ramp`/`check-text-contrast` → Task 10; the scratch-app acceptance scenario (Material button + `<arena-tag>` + dark/`.arena-light` toggle + Phosphor + no CDN font) → Task 11. The remaining Phase B/C primitive inventory is explicitly deferred to follow-on plans per the chosen milestone scope.
- **Placeholder scan:** every code/CSS/doc step shows complete content; verification steps are exact commands with expected output; no "TBD"/"similar to"/"add error handling".
- **Type consistency:** `tv` (Task 1) is imported identically by `tag.variants.ts` (Task 7); `ThemeService`/`ArenaTheme`/`arena-theme` key are consistent across Task 6 and its guards; `ARENA_ICONS`/`ArenaIcon` consistent in Task 5; the `arena-tag` selector, `tone` input, and `tagStyles` names match between `tag.ts`, `tag.variants.ts`, and the guards. Version `3.1.0` and tag `v3.1.0` used in every release surface (Task 10).
```