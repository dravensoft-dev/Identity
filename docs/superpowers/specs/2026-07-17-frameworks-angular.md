# Spec 002 — `frameworks/angular/` implementation

**Date:** 2026-07-17
**Status:** Proposed
**Target release:** v3.1.0 (additive — new framework support)
**Depends on:** `specs/2026-07-17-frameworks-directory-restructure.md` (must land first; creates `frameworks/angular/` + `frameworks/tailwind/`)

## Goal

Populate `frameworks/angular/` so that adopting Arena in an **Angular 20+/Tailwind-v4 app** — specifically **DAMA** (Angular 21, Angular Material, `tailwind-variants`, self-hosted fonts, strict CSP) — is *wiring*, not a rewrite: import a token preset, import a Material bridge, swap fonts and icons, drop in a dark-first theme service, and consume ready-made `tailwind-variants` recipes for the token-styled primitives.

## Architecture

`frameworks/angular/` provides two kinds of artifact:

1. **Bridge artifacts (foundation)** — the small, high-leverage pieces that make an *existing* Angular/Material app *wear* Arena without porting a single component: a Tailwind `@theme` preset entry, an Angular Material MDC token bridge, self-hosted fonts, a Phosphor icon manifest, and a dark-first theme service.
2. **Angular primitives** — thin, standalone, `OnPush`, signal-based components that mirror the React primitives for the parts Material does **not** provide, styled by consuming `frameworks/tailwind/` recipes through `tailwind-variants`.

The primitives follow the **Angular Style Guide** and match DAMA's `Frontend/CLAUDE.md` conventions verbatim, so they paste in with zero reshaping.

## Global constraints (inherited from `CLAUDE.md`; every task obeys these)

- **English only** in the repo (code, docs, prompts).
- **`README.md`/`CLAUDE.md` are normative** — update in the same change (add the Angular layer to the index and the quartet rule).
- **Tokens are the only styling layer.** Primitives introduce no value; they read tokens (directly or through the Tailwind preset).
- **Dark-first.** Arena default theme is `:root` (dark); light is `.arena-light`. The Angular theme service and all guidance adopt this — no `html.dark` inversion.
- **Danger is outline** (border+content in `--error`), the only fill is `ConfirmDialog`'s final confirmation. **No gradients. No emoji.** Icons are **Phosphor**, Bold default.
- **Component quartet, Angular dialect:** each primitive ships `<name>.ts` (standalone component), `<name>.variants.ts` (the `tailwind-variants` recipe), `<name>.prompt.md` (usage + Do/Don't), and a barrel export. This is the Angular analogue of the React `jsx/d.ts/prompt.md/card.html` quartet.

## Angular conventions (mirrors DAMA `Frontend/CLAUDE.md` — non-negotiable for drop-in comfort)

- Standalone components; **no `NgModule`**. `ChangeDetectionStrategy.OnPush` on every component.
- Inputs/outputs via `input()` / `output()` / `model()` (function-based), `input.required<T>()` when mandatory. **`inject()`** for DI, not constructor params.
- Filenames **kebab-case, no type suffix** (`button.ts`, `stat-card.ts`). Selector prefix `app` is DAMA's; Arena ships with prefix **`arena`** (`<arena-button>`) and documents the rename to `app` as a one-line `angular.json`/selector change in `ADOPTION.md`.
- Styling: **no component `styles`**. Each component owns a sibling `<name>.variants.ts` exporting a `tv({ slots, variants })` recipe built with the **configured `tv`** (twMergeConfig aware of the semantic tokens); the template binds `[class]="styles.slot()"`.
- **No comments.** JSDoc allowed only on the `@Component`/exported public surface (Compodoc), per DAMA's rule.
- Barrels (`index.ts`, `export * from './…'`); no import starts with `../`.

---

## Part 1 — Bridge artifacts (foundation; author first)

### 1.1 Tailwind preset entry — `frameworks/angular/theme/arena-tailwind.css`

A one-line consumer entry that pulls Arena's tokens + the shared `frameworks/tailwind/theme.css` preset, so a DAMA `styles.css` replaces its hand-authored `@theme` block (≈50 lines) with an import.

```css
/* frameworks/angular/theme/arena-tailwind.css */
@import '../../../styles.css';            /* Arena tokens (fonts, palette, colors, type, spacing, effects) */
@import '../../tailwind/theme.css';       /* the shared @theme → utility mapping */
```

`ADOPTION.md` documents that DAMA's current `--dama-*` custom properties are replaced by Arena's `--color-*`; a **migration alias table** (below) covers the transition without a global find-replace.

### 1.2 Angular Material MDC bridge — `frameworks/angular/theme/arena-material.css`

The highest-leverage file. Maps Arena tokens onto Angular Material's `--mdc-*` / `--mat-*` custom properties, so every Material-backed control (button, form-field, dialog, table, tabs, toolbar, sidenav, snackbar, progress) renders in Arena **without porting it**. This replaces DAMA's hand-maintained `material-overrides.css`.

Contract — cover at minimum these MDC surfaces, each pointing at an Arena token (dark-first values come free because the tokens are dark-first):

```css
/* frameworks/angular/theme/arena-material.css — Arena tokens → Material MDC vars.
   Import AFTER Angular Material's theme so these win. Every value is a token. */
.mat-mdc-unelevated-button {
  --mdc-filled-button-container-color: var(--color-primary);
  --mdc-filled-button-label-text-color: var(--color-primary-content);
  --mdc-filled-button-container-shape: var(--r-sm);
}
.mat-mdc-form-field.mat-form-field-appearance-outline {
  --mdc-outlined-text-field-outline-color: var(--border);
  --mdc-outlined-text-field-focus-outline-color: var(--color-primary);
  --mdc-outlined-text-field-container-shape: var(--r-sm);
}
.mat-mdc-card    { --mdc-elevated-card-container-color: var(--surface-card);
                   --mdc-elevated-card-container-shape: var(--r-lg); }
.mat-mdc-dialog-surface { --mdc-dialog-container-shape: var(--r-lg);
                          --mdc-dialog-container-color: var(--surface-card); }
.mat-mdc-table   { /* header: mono uppercase micro-label; rows: hairline --border */ }
.mat-mdc-tab-group { --mat-tab-header-active-label-text-color: var(--color-primary); }
.mat-mdc-snack-bar-container { --mdc-snackbar-container-shape: var(--r-md); }
.mat-mdc-progress-spinner { --mdc-circular-progress-active-indicator-color: var(--color-primary); }
/* danger buttons: outline (border+text in --error), never filled — per the danger convention */
```

Must respect the danger convention (outline triggers), the radius scale (`--r-sm` controls / `--r-lg` cards), and micro-label casing on table headers. Ships with a `arena-material.prompt.md` stating import order and the Material-theme SCSS the consumer still owns (Arena only maps tokens; it does not replace Material's SCSS palette).

### 1.3 Self-hosted fonts — `frameworks/angular/fonts/fonts.css` (+ binaries or fetch script)

Arena's root `tokens/fonts.css` uses the Google Fonts CDN, which a strict CSP (DAMA's Apache image, artifact CSP) blocks. Ship a self-host variant: `@font-face` rules for **Archivo** (display, 400–900), **Familjen Grotesk** (body, 400–700), **Spline Sans Mono** (mono, 400–700) pointing at local `woff2`, plus a `fetch-fonts.mjs` that downloads the latin subsets into `frameworks/angular/fonts/` (binaries may be git-ignored; the script is the source of truth). `ADOPTION.md` maps these onto DAMA's existing `public/fonts` self-hosting pattern.

### 1.4 Phosphor icon manifest — `frameworks/angular/icons/icon-manifest.ts`

DAMA is FontAwesome-only today and is migrating to Phosphor for Arena. Ship the canonical mapping as data so DAMA's `icon-registry.ts` is **seeded**, not guessed:

```ts
/* frameworks/angular/icons/icon-manifest.ts */
export interface ArenaIcon { role: string; phosphor: string; weight: 'bold' | 'fill' | 'duotone'; }
export const ARENA_ICONS: ArenaIcon[] = [
  { role: 'nav-active',   phosphor: 'ph-house',          weight: 'fill' },
  { role: 'confirm',      phosphor: 'ph-check',          weight: 'bold' },
  { role: 'dismiss',      phosphor: 'ph-x',              weight: 'bold' },
  { role: 'danger',       phosphor: 'ph-trash',          weight: 'bold' },
  /* … one row per functional icon Arena components reference … */
];
```

`ADOPTION.md` documents the FA→Phosphor swap: install `@phosphor-icons/web` (prototype) or `@phosphor-icons/react`→ for Angular use `@phosphor-icons/webcomponents` or the webfont via `<i class="ph-bold ph-x">`, wrapped by DAMA's existing `<app-icon>` so call sites don't churn. Bold is the default weight; Fill = active/selected; Duotone = onboarding only.

### 1.5 Dark-first theme service — `frameworks/angular/theme/theme-service.ts` (+ `no-fouc.html`)

An injectable, signal-based `ThemeService` matching DAMA's shape but on **Arena's** convention: default **dark** (`:root`), light toggles the **`.arena-light`** class on `<html>` (not DAMA's current `html.dark`), persists to `localStorage`, falls back to `prefers-color-scheme`. Ship the companion no-FOUC inline `<script>` (`no-fouc.html`) that applies the stored theme before first paint, sharing the same storage key. `ADOPTION.md` states DAMA replaces its `html.dark`/light-first `ThemeService` + `index.html` script with these two.

---

## Part 2 — Angular primitives

Mirror the React inventory, but **skip what Material already gives DAMA** (Part 1's bridge covers those) and port the **token-styled, non-Material** primitives. Each is a quartet (`<name>.ts` + `<name>.variants.ts` + `<name>.prompt.md` + barrel entry), `OnPush`, signal I/O, `arena-` selector, recipe from `frameworks/tailwind/`.

### Reference component (fully specified — the pattern every other primitive copies)

`frameworks/angular/primitives/tag/`:

```ts
// tag.ts
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

```ts
// tag.variants.ts  — consumes the shared manifest via the configured tv
import { tv } from '../../../tailwind/tv';          // configured tv (twMergeConfig aware of semantic tokens)
export const tagStyles = tv({
  slots: { root: 'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
           dot: 'h-1.5 w-1.5 rounded-full bg-[currentColor]' },
  variants: { tone: {
    neutral: { root: 'border-base-300 text-base-content/70' },
    primary: { root: 'border-primary text-primary' },
    success: { root: 'border-success text-success' },
    warning: { root: 'border-warning text-warning' },
    danger:  { root: 'border-error text-error' },     /* outline — never filled */
  } },
  defaultVariants: { tone: 'neutral' },
});
```

`frameworks/tailwind/tv.ts` (added by this spec) exports the configured `tv` (the `createTV` with `twMergeConfig` for the semantic scale), so recipes dedupe correctly — the exact pattern DAMA's `shared/design/recipes.ts` uses.

### Primitive inventory (port order)

**Phase A — foundation (Part 1 bridge).** Ships DAMA "wearing Arena" over its current Material + custom components. *This is the comfortable-adoption milestone; everything after is fidelity.*

**Phase B — token-styled primitives DAMA has as custom (not Material):**
`tag`, `badge`, `stat-card`, `empty-state`, `error-state`, `skeleton`/loading, `callout`/`alert`, `page-head`, `segmented-control`, `breadcrumbs`, `pagination`, `avatar`, `progress-bar`, `spinner`, `tooltip`, `rotor` (brand). These map 1:1 onto DAMA's `shared/design/components/*` and replace their `*.variants.ts` with Arena recipes.

**Phase C — composite / stateful primitives:**
`table`/responsive (DAMA `responsive-table`), `calendar` (DAMA FullCalendar overrides + `calendar`), charts (`chart-card`, `bar`, `line`, `doughnut` — must consume the `--color-cat-*` ramp, one axis, identity-vs-meaning rule), `dialog`/`confirm-dialog` patterns (thin wrappers over Material dialog + the danger-fill-only-here rule), `command-palette`, `bulk-action-bar`, `onboarding`, `toast` (over Material snackbar).

Each phase is independently shippable; a consumer can stop after Phase A and still look like Arena.

---

## Part 3 — `frameworks/angular/ADOPTION.md` (the DAMA playbook)

A step-by-step, DAMA-specific migration guide — the deliverable that makes adoption *comfortable*:

1. **Tokens:** replace DAMA `src/styles.css` `:root`/`html.dark` `--dama-*` block + `@theme` with `@import '…/frameworks/angular/theme/arena-tailwind.css'`. Apply the **alias table** (below) so existing `--dama-*` references keep resolving during the transition.
2. **Material:** replace `shared/design/material-overrides.css` with `@import '…/arena-material.css'`; rebind `material-theme.scss` palette to Arena primary/secondary.
3. **Theme:** replace DAMA `ThemeService` + `index.html` no-FOUC script with Part 1.5; **flip default to dark**, light = `.arena-light`.
4. **Fonts:** swap `public/fonts` binaries + `@font-face` for Archivo/Familjen/Spline (Part 1.3).
5. **Icons:** run the FA→Phosphor swap seeded by `icon-manifest.ts`; keep the `<app-icon>` wrapper.
6. **Primitives (incremental):** as each DAMA `shared/design/components/*` is touched, replace its `*.variants.ts` with the Arena recipe / swap to the `arena-*` primitive. Do **not** mass-rewrite (matches DAMA's "rollout is incremental" rule).

### Token alias table (transition shim, DAMA-side)

| DAMA token | Arena token |
|---|---|
| `--dama-bg` | `--color-base-100` |
| `--dama-surface` | `--color-base-200` (`--surface-card`) |
| `--dama-border` | `--color-base-300` (`--border`) |
| `--dama-text` | `--color-base-content` |
| `--dama-text-muted` | `--mute` |
| `--dama-primary` | `--color-primary` (`--crimson`) |
| `--dama-primary-fg` | `--color-primary-content` |
| `--dama-success` / `--dama-warning` / `--dama-danger` | `--color-success` / `--color-warning` / `--color-error` |
| `--dama-radius-sm` / `--dama-radius` / `--dama-radius-md` | `--r-sm` / `--r-md` / `--r-lg` |
| `--dama-shadow` / `--dama-shadow-lg` | `--shadow-1` / `--shadow-2` |

Shipped as a copy-paste `dama-aliases.css` snippet *in `ADOPTION.md`* (documentation, not an Arena file — Arena stays skin-clean).

---

## Acceptance criteria

- `frameworks/angular/` contains `theme/` (`arena-tailwind.css`, `arena-material.css`, `theme-service.ts`, `no-fouc.html`), `fonts/` (`fonts.css` + `fetch-fonts.mjs`), `icons/` (`icon-manifest.ts`), `primitives/` (Phase B set, each a quartet), `index.ts` barrel, `README.md`, `ADOPTION.md`.
- The reference primitive (`tag`) compiles under Angular strict + `OnPush`, uses `input()`/`computed()`, has no component `styles`, no `../` import, no comments beyond the JSDoc line.
- `arena-material.css` covers button, form-field, card, dialog, table, tabs, snackbar, progress — each value a token; danger stays outline.
- `node scripts/check-release.mjs` passes for `3.1.0`; `check-ramp`/`check-text-contrast` pass (tokens untouched).
- A scratch Angular app importing `arena-tailwind.css` + `arena-material.css` + the theme service renders a Material button and an `<arena-tag>` in Arena's dark theme, toggling to `.arena-light`, with Phosphor icons — no CDN font request (CSP clean).
- `README.md`/`CLAUDE.md` document the Angular layer and its quartet.

## Out of scope

- The directory restructure itself → **spec 001**.
- A full DAMA cutover (that runs in the DAMA repo, guided by `ADOPTION.md`).
- Web-Component builds of the primitives (a possible later spec if a non-Angular, non-React consumer appears).

## Self-review

- **Coverage:** the five bridge artifacts (preset, Material bridge, fonts, icons, theme service), the primitive convention + inventory + phase order, the fully-specified reference component, the DAMA playbook + alias table, acceptance, out-of-scope — all present.
- **No placeholders:** `tag.ts`/`tag.variants.ts`, the Material bridge shape, the icon manifest, and the alias table are shown, not described.
- **Consistency:** dark-first / `.arena-light`, `arena-` selector, `tailwind-variants` `tv` from `frameworks/tailwind/tv.ts`, danger-outline, and Phosphor-Bold are used identically across every section; version `3.1.0` in every release surface.
