# Self-hosted resource policy — design

**Date:** 2026-07-17
**Status:** Approved, ready for planning

## Problem

Arena delivers two self-hostable web resources — **text fonts** and **icons** —
and today it treats them inconsistently and sub-optimally:

- **Fonts** live in two places at once. The framework-agnostic default
  (`tokens/fonts.css`, consumed by `styles.css` and therefore by every HTML page
  and the React copy-in kit) pulls Archivo / Familjen Grotesk / Spline Sans Mono
  from the **Google Fonts CDN**. Separately, `frameworks/angular/fonts/` ships a
  self-hosted `@font-face` sheet plus git-ignored `.woff2` binaries regenerated
  by `fetch-fonts.mjs`. The two mechanisms duplicate intent and the default path
  still makes a CDN round-trip.
- One page, `Dravensoft Identity.dc.html`, additionally hard-codes its own
  Google Fonts `<link>` (with `preconnect`), bypassing the token layer entirely.

The policy this design sets:

- **Text fonts are bundled and self-hosted by default** — Arena *includes* the
  `.woff2` binaries, so consumers make no font CDN request. This lightens the
  number of downloads a developer's app must issue.
- **Icons default to installing the official package** — for development
  flexibility, the default adoption path installs `@phosphor-icons/*`; the CDN
  is demoted to a prototype-only convenience. Icon binaries are never bundled.

The two policies diverge on purpose: fonts optimize for *fewer downloads*, icons
optimize for *flexibility*.

## Goals

1. `assets/fonts/` becomes the single, git-tracked source of truth for the 14
   `.woff2` text-font binaries.
2. `@font-face` declarations live once, in the root `tokens/fonts.css`, pointing
   at `assets/fonts/`. All three framework layers (React, Angular, Tailwind) and
   every HTML page inherit fonts from this single origin.
3. No font CDN request remains anywhere in the repo.
4. Iconography policy is stated clearly in the docs: install the official package
   by default; CDN is prototype-only. No icon code changes.
5. The Angular layer's now-redundant `fonts/` directory is deleted outright (no
   deprecation shim — per repo policy on dead API).

## Non-goals

- No change to icon code, `icons/icon-manifest.ts`, or the Phosphor role→glyph map.
- No change to the set of font families, weights, or the `--font-*` /
  `--fw-*` tokens in `tokens/typography.css` / `frameworks/tailwind/theme.css`.
- No re-subsetting of the fonts; the existing latin-subset `.woff2` are reused.
- Not resolving unrelated uncommitted working-tree changes (avatar/svg moves,
  deleted plan/spec files) already present on the branch.

## Design

### A. Font binaries → `assets/fonts/` (tracked)

Move the 14 `.woff2` from `frameworks/angular/fonts/` to a new `assets/fonts/`:

- `archivo-{400,500,600,700,800,900}.woff2` (6)
- `familjen-grotesk-{400,500,600,700}.woff2` (4)
- `spline-sans-mono-{400,500,600,700}.woff2` (4)

These files are **committed** (Arena includes them). The `.gitignore` rule
`frameworks/angular/fonts/*.woff2` is removed; no replacement rule is added, so
`assets/fonts/*.woff2` is tracked normally.

### B. `@font-face` source of truth → `tokens/fonts.css`

Replace the single Google Fonts `@import` in `tokens/fonts.css` with 14
`@font-face` rules, one per family/weight, each:

```css
@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/archivo-400.woff2') format('woff2');
}
```

The `url()` is resolved by the browser relative to `tokens/fonts.css`'s own
location (`tokens/`), so `../assets/fonts/…` resolves to the repo's
`assets/fonts/` **regardless of which file `@import`s it or which HTML page loads
it**. This is what makes the single origin work for React, Angular, the guideline
pages, and the `.dc.html` brand pages simultaneously. The families and weights
must stay identical to `tokens/typography.css`.

### C. Generator → `scripts/fetch-fonts.mjs`

Move `frameworks/angular/fonts/fetch-fonts.mjs` to `scripts/fetch-fonts.mjs` and
rewrite its output paths so it:

- downloads the latin-subset `.woff2` into `../assets/fonts/` (relative to
  `scripts/`);
- regenerates `../tokens/fonts.css` with the self-hosted `@font-face` block whose
  `src` uses `url('../assets/fonts/<slug>-<weight>.woff2')`;
- carries an updated header comment naming the new locations.

The `FAMILIES` table (families, slugs, weights) and the Google-Fonts scraping
logic are unchanged. It no longer writes any Angular-local file.

### D. Delete `frameworks/angular/fonts/`

Remove the directory entirely: the 14 `.woff2`, `fonts.css`, and
`fetch-fonts.mjs` (the last is *moved*, not just deleted). The Angular layer
inherits fonts through its existing import chain
(`theme/arena-tailwind.css` → `../../../styles.css` → `tokens/fonts.css`).

### E. The three framework layers

No new per-framework font files. Each inherits the single origin:

- **React / copy-in kit:** `styles.css` → `tokens/fonts.css`. Unchanged chain;
  only `tokens/fonts.css`'s contents change. The copy-in step already copies
  `tokens/`, `assets/`, and `styles.css`, so the bundled fonts travel with the
  kit. Preserving the `assets/fonts/` subdirectory is required.
- **Angular:** `theme/arena-tailwind.css` → `styles.css` → `tokens/fonts.css`.
  Loses its own `fonts/`.
- **Tailwind:** `frameworks/tailwind/theme.css` maps `--font-*` family-name
  tokens only and carries no `url()`. No change.

### F. HTML pages

- `Dravensoft Identity.dc.html`: delete the two Google-Fonts `<link>` lines
  (the `preconnect` pair on line 11 and the stylesheet `<link>` on line 12). The
  page keeps `./styles.css` (line 13) and is thereby fully self-hosted.
- `Arena - Overview.dc.html`, `guidelines/*.html`, and the component
  `*.card.html` demos load `styles.css` and require **no change** — switching
  `tokens/fonts.css` to self-hosted fixes them automatically.

### G. Iconography — documentation and policy only

State the default-package policy and the deliberate fonts-vs-icons contrast in:

- `README.md` → `Dependencies` (the **Fonts** and **Icons** bullets) and the
  `## ICONOGRAPHY` section. Fonts bullet: bundled/self-hosted from `assets/fonts/`,
  no CDN. Icons bullet + ICONOGRAPHY loading line: default is installing
  `@phosphor-icons/web` / `@phosphor-icons/react`; CDN is a prototype-only
  convenience, not the default.
- `frameworks/angular/ADOPTION.md` → step 5 (icons) reaffirms installing the
  package as the default path.

No icon code, manifest, or CDN version pin changes beyond wording.

### H. Documentation to update

Every reference to the old font layout is corrected:

- `README.md`: Dependencies (Fonts/Icons), ICONOGRAPHY loading line, the
  `frameworks/angular/` description (drop the `fonts/` self-hosted `@font-face`
  item), and the `assets/` inventory line (add `fonts/`).
- `CLAUDE.md`: the "Framework layers live under `frameworks/`" paragraph is the
  only place that names the Angular `fonts/` directory — drop `fonts/` as an
  Angular artifact. Fonts are inherited from the root token layer (`assets/fonts/`),
  which that paragraph already lists among the root's contents.
- `frameworks/angular/README.md`: remove the `fonts/` bullet from the bridge
  artifact list.
- `frameworks/angular/ADOPTION.md`: rewrite step 4 (fonts) — fonts now arrive via
  the token import from step 1 (`assets/fonts/` bundled), replacing the old
  "run fetch-fonts, ship woff2 into public/fonts, import fonts/fonts.css"
  instruction.

The **frozen** `CHANGELOG.md` entry for v3.1.0 (which mentions the Angular
`fonts/`) is **not** edited — released entries describe the tree at that tag.

### I. Release

This changes a documented convention, so it lands in `CHANGELOG.md` under a new
`## [Unreleased]` heading (kept on top; `check-release.mjs` reads the first
*versioned* entry, so `[Unreleased]` on top is expected). Cutting the version —
bumping `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the
README header, renaming the CHANGELOG heading, pinning `source.ref`, tagging the
release commit, and running `node scripts/check-release.mjs` — is a **separate,
user-triggered final step**, not part of this change's implementation.

## Verification

- Serve the repo over HTTP (`python3 -m http.server 8000`) and load a
  guideline page, `Arena - Overview.dc.html`, and `Dravensoft Identity.dc.html`;
  confirm in DevTools Network that the `.woff2` load from `/assets/fonts/…` and
  that **no** request hits `fonts.googleapis.com` / `fonts.gstatic.com`.
- `grep -rniE "fonts.googleapis|fonts.gstatic|\.woff" --include="*.html"
  --include="*.css"` returns nothing outside `assets/fonts/` and the generator.
- `frameworks/angular/fonts/` no longer exists; `git ls-files assets/fonts/`
  lists the 14 `.woff2`.
- `node scripts/fetch-fonts.mjs` regenerates identical `assets/fonts/*.woff2`
  and `tokens/fonts.css` (idempotent).

## Affected files

**Moved:** `frameworks/angular/fonts/*.woff2` → `assets/fonts/*.woff2`;
`frameworks/angular/fonts/fetch-fonts.mjs` → `scripts/fetch-fonts.mjs`.
**Deleted:** `frameworks/angular/fonts/` (incl. `fonts.css`).
**Edited:** `tokens/fonts.css`, `scripts/fetch-fonts.mjs` (paths), `.gitignore`,
`Dravensoft Identity.dc.html`, `README.md`, `CLAUDE.md`,
`frameworks/angular/README.md`, `frameworks/angular/ADOPTION.md`, `CHANGELOG.md`.
