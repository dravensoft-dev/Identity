# Spec 001 — `frameworks/` directory restructure

**Date:** 2026-07-17
**Status:** Proposed
**Target release:** v3.0.0 (breaking — import paths move)
**Companion spec:** `specs/2026-07-17-frameworks-angular.md` (fills `frameworks/angular/`)

## Goal

Separate Arena's **pure, framework-agnostic design language** (tokens, guidelines, assets, validators — the normative source of truth) from its **framework-specific implementations** (today React; Angular next), so a new framework can be added without touching the language, and a consumer can pick exactly the layer it needs: raw tokens, a framework's primitives, or a shared Tailwind layer on top.

## Architecture

Introduce a top-level `frameworks/` directory. Every framework-bound file moves under it; the repo root keeps only the language. A single shared `frameworks/tailwind/` directory holds the Tailwind consumption layer, because that layer is framework-agnostic by construction (see the decision below) — so it is authored once, not once per framework.

## Global constraints (copied verbatim from `CLAUDE.md` / `README.md` — every task inherits these)

- **English only.** All code, docs, and UI copy stay in English. These specs live in the repo and are therefore in English.
- **`README.md` is the normative spec.** Any change to a token, component, path, or convention updates `README.md` (and `CLAUDE.md`) in the **same** change.
- **Tokens are the only styling layer.** No component introduces a raw value; the Tailwind layer added here **derives** every utility from an existing token and introduces **no new hex, no new value**.
- **Components carry no CSS classes** in the React layer (inline `style` reading custom properties). This restructure does **not** change that; the Tailwind layer is an *additive, optional* consumption path, never a rewrite of the React primitives.
- **`*.dc.html` must live at the repo root** — they load `support.js`, `styles.css`, `theme.js`, `assets/` by relative path. **Do not move them.** Their component *import paths* may be updated.
- **`support.js` is generated** (source not in this repo). Do not edit it.
- **A release moves four things + the tag:** version in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the `README.md` header; a `CHANGELOG.md` entry; `source.ref` naming the tag; the tag on the release commit. Verify with `node scripts/check-release.mjs`.

---

## Decision: collapse the `*-tailwind` folders into a single `frameworks/tailwind/`

The original request allowed for per-framework Tailwind folders (`react-tailwind`, `angular-tailwind`) *unless the Tailwind logic is identical across frameworks*, in which case they collapse into one `frameworks/tailwind/`.

**The Tailwind logic is identical across frameworks. Collapse it.** Rationale:

- Tailwind v4 is CSS-first. The token→utility mapping is a `@theme` block — **pure CSS**, no framework involved.
- A component's Tailwind recipe is *data*: a set of slots, variants, and the utility-class strings each resolves to. The class string `"inline-flex items-center rounded-sm ..."` for a primary button is the same whether React sets it via `className`, Angular via `[class]`, or a `tailwind-variants` recipe emits it.
- What differs per framework is only the **thin binding** — how class strings get onto the element and how variant props are wired. That binding lives inside each framework folder (`frameworks/react/`, `frameworks/angular/`), not in the Tailwind layer.

**Therefore the target is three siblings — `react`, `angular`, `tailwind` — not paired `*-tailwind` folders.** Each framework that opts into Tailwind consumes the one shared `frameworks/tailwind/`.

---

## Target directory structure

### Before (repo root, abridged)

```
components/            # React JSX primitives (+ .d.ts, .prompt.md, *.card.html)
ui_kits/console/       # React example app
use-container-width.js # React hook
tokens/                # palette, colors, typography, spacing, effects, fonts
guidelines/            # token/brand specimen HTML
assets/                # rotor + app-icon SVG
scripts/               # *.mjs validators
styles.css             # @imports tokens
theme.js  jsx-loader.js  support.js
Arena - Overview.dc.html   Dravensoft Identity.dc.html
README.md  CLAUDE.md  CHANGELOG.md  SKILL.md  LICENSE  .gitignore
.claude-plugin/
reference/             # (empty today)
```

### After

```
frameworks/
  react/
    components/            # moved verbatim from ./components
    ui_kits/console/       # moved from ./ui_kits/console
    use-container-width.js # moved from ./use-container-width.js
    README.md              # "React layer" — how to consume, what moved
  angular/                 # created empty here; filled by spec 002
    .gitkeep
  tailwind/
    theme.css              # NEW — Tailwind v4 @theme preset derived from tokens
    components/            # NEW — per-component class+variant manifests (schema below)
    README.md              # NEW — how to consume the Tailwind layer

# Root keeps ONLY the language + demo runtime + brand:
tokens/  guidelines/  assets/  scripts/
styles.css  theme.js  jsx-loader.js  support.js
Arena - Overview.dc.html   Dravensoft Identity.dc.html
README.md  CLAUDE.md  CHANGELOG.md  SKILL.md  LICENSE  .gitignore
.claude-plugin/  reference/
```

**Why these stay at root:** `tokens/`, `guidelines/`, `assets/`, `scripts/`, `styles.css` are the framework-agnostic language. `theme.js` (toggles `.arena-light`), `jsx-loader.js`, `support.js` are demo/runtime infra loaded by the root `*.dc.html` and by `guidelines/*.html` by relative path — moving them breaks those pages. `reference/` stays as-is.

---

## Move table (exact)

| From | To | Notes |
|---|---|---|
| `components/` (whole tree) | `frameworks/react/components/` | `.jsx`, `.d.ts`, `.prompt.md`, `*.card.html` move together |
| `ui_kits/console/` | `frameworks/react/ui_kits/console/` | React example app |
| `use-container-width.js` | `frameworks/react/use-container-width.js` | React hook; its relationship to `components/` is preserved (both under `frameworks/react/`), so `../../use-container-width.js`-style imports inside the JSX stay valid |

Everything not in this table **stays where it is**.

## Reference-update checklist (mechanical, required in the same change)

Moving files breaks relative paths and the normative index. Each item below is a required edit, not a suggestion:

1. **`frameworks/react/components/**/*.card.html`** — every demo loads `../../jsx-loader.js`, `../../styles.css`, `../../theme.js`, `../../assets/…` by relative path. The cards are now one level deeper, so each `../../` becomes `../../../`. Verify by serving over HTTP (`python3 -m http.server 8000`) and confirming each `*.card.html` still renders styled.
2. **`Arena - Overview.dc.html`** (stays at root) — update its component imports from `components/…` to `frameworks/react/components/…`. Its `support.js` / `styles.css` / `assets/` paths are unchanged (still root).
3. **`frameworks/react/ui_kits/console/index.html`** — update any `../../components/…`, `../../styles.css`, `../../assets/…` relative paths for the new depth.
4. **`README.md`** — the "Getting started (copy-in kit)", the "Index / manifest", and the "How components are styled" sections all name paths (`components/forms/Button.jsx`, `use-container-width.js`, `ui_kits/console/`). Update to the `frameworks/react/…` paths. Add a short section documenting the three-way `frameworks/{react,angular,tailwind}` split.
5. **`CLAUDE.md`** — update the "Viewing things" and "Architecture" sections (component paths, `use-container-width.js`, the quartet rule's `*.card.html` path) to `frameworks/react/…`, and document the `frameworks/` split + the "Tailwind layer derives from tokens, adds no value" rule.
6. **`SKILL.md`** — update any component/path references.
7. **`.claude-plugin/plugin.json`** — bump `version` to `3.0.0`; add `"angular"` and `"tailwind"` to `keywords`; the `description` mentions "React components" → widen to "framework primitives (React, Angular) and a Tailwind layer".
8. **`.claude-plugin/marketplace.json`** — bump version, set `source.ref` to the `v3.0.0` tag.
9. **`CHANGELOG.md`** — add the `## [Unreleased]` → `## [3.0.0]` entry describing the breaking reorg and the new `frameworks/` layout, with a **Migration** note for existing consumers (import paths moved from `components/…` to `frameworks/react/components/…`).
10. **`scripts/`** — grep for hardcoded `components/` or `ui_kits/` paths in the `*.mjs` validators; update if any. `check-ramp.mjs` / `check-text-contrast.mjs` read `tokens/palette.css` (unchanged). `check-release.mjs` reads `plugin.json`/`marketplace.json`/`README`/`CHANGELOG` (unchanged paths, new values).

---

## `frameworks/tailwind/` contract (established here; components authored incrementally)

This spec **creates** the Tailwind layer and ships its deterministic, token-derived part now. Per-component manifests are authored on demand (spec 002 authors those Angular/DAMA consumes first).

### `frameworks/tailwind/theme.css` — the `@theme` preset (ship in this spec)

A Tailwind v4 `@theme` block that maps Arena's `--color-*` tokens and the spacing/radius/shadow scales onto Tailwind utilities, so a consumer writes `@import` once instead of hand-authoring the mapping. It **references** the tokens; it defines no values.

```css
/* frameworks/tailwind/theme.css
   Consume AFTER Arena's tokens are in scope (import ../../styles.css or tokens/*).
   Every value here is a var() into an existing token — no literals. */
@import 'tailwindcss';

@theme {
  --color-base-100: var(--color-base-100);
  --color-base-200: var(--color-base-200);
  --color-base-300: var(--color-base-300);
  --color-base-content: var(--color-base-content);
  --color-primary: var(--color-primary);
  --color-primary-content: var(--color-primary-content);
  --color-secondary: var(--color-secondary);
  --color-secondary-content: var(--color-secondary-content);
  --color-info: var(--color-info);
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);
  /* categorical ramp */
  --color-cat-1: var(--color-cat-1);
  /* … cat-2 … cat-8 … */
  /* radius / shadow / spacing map onto tokens/effects.css + tokens/spacing.css vars */
  --radius-sm: var(--r-sm);
  --radius-md: var(--r-md);
  --radius-lg: var(--r-lg);
  --shadow-1: var(--shadow-1);
  --shadow-2: var(--shadow-2);
}
```

### `frameworks/tailwind/components/<Component>.manifest.json` — the class+variant schema (define here; author per component later)

A framework-neutral description of one component's Tailwind recipe, consumable by `tailwind-variants` (Angular/DAMA), `cva`, or a plain `className` binding. One file per component, mirroring the React component names.

```jsonc
{
  "component": "Button",
  "slots": {
    "root": "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition"
  },
  "variants": {
    "variant": {
      "primary":  { "root": "bg-primary text-primary-content hover:shadow-[var(--glow-accent)]" },
      "danger":   { "root": "bg-transparent border border-error text-error hover:bg-[var(--danger-soft)]" }
    },
    "size": {
      "sm": { "root": "h-[var(--dz-ctl-h-sm)] px-3 text-[13px]" },
      "md": { "root": "h-[var(--dz-ctl-h)] px-4 text-[15px]" }
    }
  },
  "defaultVariants": { "variant": "primary", "size": "md" }
}
```

The manifest **must** reproduce the invariants: danger is `border`+`text` in `--error` (never a fill outside `ConfirmDialog`'s final confirmation), focus is the gold ring, no gradient utilities, uppercase reserved for micro-labels. Authoring a manifest for a component whose React source uses a value not yet in a token is a spec violation — add the token first.

### `frameworks/tailwind/README.md`

Documents: consumption order (tokens → `theme.css` → manifests), the "derives from tokens, adds no value" rule, and the three consumption paths (raw `className`, `tailwind-variants`, `cva`).

---

## Acceptance criteria

- `frameworks/{react,angular,tailwind}/` exist; `react/` holds the moved React tree; `angular/` is an empty placeholder; `tailwind/` holds `theme.css` + `components/` (with at least the `Button.manifest.json` reference example) + `README.md`.
- Repo root contains **no** `components/`, `ui_kits/`, or `use-container-width.js`.
- Serving the repo over HTTP: every `frameworks/react/components/**/*.card.html`, both `*.dc.html`, and `ui_kits/console/index.html` render **styled** (no 404 on tokens/assets/loader).
- `node scripts/check-ramp.mjs` and `node scripts/check-text-contrast.mjs` pass (tokens untouched).
- `node scripts/check-release.mjs` passes for `3.0.0` (all four surfaces + tag agree).
- `README.md` and `CLAUDE.md` reference only the new paths; no stale `components/…` root path remains (grep clean).

## Out of scope

- Any `frameworks/angular/` content → **spec 002**.
- Authoring Tailwind manifests beyond the `Button` reference example → on demand (spec 002 authors the set Angular consumes first).
- Changing the React primitives' internals (they keep inline styles).

## Self-review

- **Coverage:** structure, the `-tailwind` collapse decision, the move table, every broken-reference class (card demos, `.dc.html`, ui_kit, README, CLAUDE, SKILL, plugin/marketplace, CHANGELOG, scripts), the Tailwind contract, release mechanics, acceptance — all present.
- **No placeholders:** paths are exact; `theme.css` and the manifest schema are shown, not described.
- **Consistency:** three siblings `react`/`angular`/`tailwind` used throughout; version `3.0.0` used in every release surface.
