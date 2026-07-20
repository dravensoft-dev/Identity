# Overview as a self-generating token page — Design

**Status:** approved for planning
**Date:** 2026-07-18
**Supersedes for this file:** the component-showcase role of `Arena - Overview.dc.html`

## Problem

`Arena - Overview.dc.html` defines roughly 130 private CSS classes — `.btn`, `.badge`,
`.card`, `.alert`, `.menu`, `.toast`, `.spinner`, `.tabs`, `.pg`, `.dialog`, `.estate`,
`.skel`, `.check`, `.radio`, `.swtrack`, `.crumbs` — which hand-reimplement almost the
entire component library. This is a second, parallel implementation of Arena that shares
nothing with the real components beyond token values.

Two things follow, and both have already happened:

1. **It contradicts the system's central rule.** `CLAUDE.md` states components carry no
   CSS classes and that there is no `.btn` class to target. The Overview has one.
2. **It drifts silently.** Retiring `--glow-accent` required a separate hand-edit to the
   Overview precisely because it inherits nothing from `Button.jsx`.

It is also a layering violation. The repository root is the framework-agnostic layer
(`tokens/`, `assets/`, `styles.css`); components belong to `frameworks/`, and each
framework implements them in its own idiom. A root-level page showcasing React components
mixes the two.

## Decision

**The Overview stops showing components entirely and becomes a complete, faithful
presentation of the token language** — the layer that is genuinely framework-agnostic.

**It generates itself from the DTCG source at runtime.** Rewriting it by hand as a list of
138 tokens would reintroduce the exact defect being removed, one layer down. The page
fetches `tokens/src/*.json`, so adding a token to the source makes it appear in the
Overview with no edit to the page.

### Scope of coverage

Both layers a consumer can actually write, measured from the built CSS: **138 unique
custom-property names across 173 declarations** (per-theme and per-density scopes repeat
names).

| Layer | Source | Names |
|---|---|---|
| DTCG values | `tokens/src/*.json` via the generated CSS | 98 |
| Composition layer | `tokens/colors.css` (aliases, `color-mix` derivations, `picker-invert`) | 40 |

The two sets do not overlap, which is the layer contract holding: `colors.css` defines no
value the DTCG source already names.

The composition layer is included because it is what components and consumers reference in
practice (`--crimson`, `--mute`, `--text-strong`, `--danger-fill`), and `README.md` already
documents the muted text scale as normative.

## Architecture

### Rendering host: a plain ES module, not dc-runtime

The Overview leaves `dc-runtime` and becomes plain HTML driven by `<script type="module">`.

`support.js` is a generated bundle whose source is not in this repository and which
`CLAUDE.md` forbids editing. It executes page logic through
`new Function("React", "module", "exports", "require", code)` — not an ES module, so static
`import` is unavailable inside it — and its rendering model is fixed markup with `{{ }}`
interpolation fed by `renderVals()`. Asking it to build N sections from fetched JSON pushes
it outside its design, against a runtime that cannot be read or repaired here.

Leaving it also lets the page import `scripts/lib/css-decls.mjs` directly, so the
alias parser has exactly one implementation.

`Dravensoft Identity.dc.html` is untouched and keeps using `support.js`. It is the approved
brand manual, it is static, and it uses no `data-dc-script`.

The page stays at the repository root: it loads `styles.css`, `assets/`, `theme.js` and
`tokens/src/` by relative path.

### Page structure

| Section | Source |
|---|---|
| Hero, kicker, lede | static (brand voice) |
| Theme and density controls | toggle `.arena-light` and `.arena-compact` |
| Color: base scale, brand, status, `error-fill`, categorical ramp | `palette.{dark,light}.json` |
| Derived color: aliases and the muted text scale | `tokens/colors.css` via `parseDecls` |
| Typography: families, weights, sizes, line heights, tracking | `typography.json` |
| Spacing: scale, container, gutter, breakpoints, density | `spacing.json`, `density.compact.json` |
| Effects: radii, borders, elevation, scrim, focus, motion | `effects.json` |
| Iconography and brand assets | static (Phosphor, `assets/`) |
| Where the components live | static pointers to `frameworks/` |

The density control is load-bearing: `dz-*` is the only group with a scope override, and
without it the seven compact values are never visible. The theme control reuses
`theme.js`'s existing `window.__toggleTheme`.

**Removed:** the seven component sections, both Remediation sections (audit history for
components; the live conventions are in `README.md`), the UI Kit section, and all ~130
private CSS classes. Components are reachable through pointers to
`frameworks/react/components/**/*.card.html` and the console kit, where they actually live.

### Previews are chosen by group, with type as the fallback

`$type` alone cannot determine the drawing. `--fs-display` and `--sp-16` are both
`dimension` with value `64px`, but one must render as 64px text and the other as a 64px
bar; a font size drawn as a bar tells the reader nothing.

| Group | Preview |
|---|---|
| `color` | swatch; for `-content` pairs the content colour is drawn **as text on the swatch**, which is the actual contract |
| `cat-1..8` | one row in fixed slot order, never reordered |
| `font`, `fw` | specimen in the family; the same word at each weight |
| `fs` | text at the real size |
| `lh`, `ls` | paragraph at that line height; line at that tracking |
| `sp`, `gutter`, `container-max` | bar of that width |
| `r` | tile with that radius |
| `bw` | rule of that thickness |
| `shadow` | elevated tile |
| `dur`, `ease` | replayable animation; the curve drawn as SVG |
| `dz` | box at that control height |
| `bp` | marker on a scale |

**The mapping lives in the page, not in the token source.** It could be expressed as
`$extensions.com.dravensoft.arena.preview` and be self-describing, but that would put HTML
presentation concerns inside a source documented as platform-neutral, contradicting the
layer contract.

An unmapped group is not dropped: it falls back to its type's generic preview. This
preserves the property that a newly added token appears without touching the page, plainly
until someone gives its group a richer preview.

### Values are read from the browser, never from the JSON

Names and `$description`s come from the JSON. **Values come from
`getComputedStyle(document.documentElement)`** — the CSS the browser actually loaded.

The page therefore exercises the whole chain (JSON to build to CSS to browser) instead of
echoing the JSON back. It yields a free integrity signal: a token present in `tokens/src/`
that resolves empty in the browser means the committed CSS is stale, and the page flags it
rather than displaying a value that is not in effect. Each section ends with a count of the
form `48 tokens, all resolving`.

Values are re-read on every theme and density toggle, because `getComputedStyle` returns
different results per scope.

## The demo server

`scripts/serve.mjs`, exposed as `bun run demos`. Serving over HTTP is required, not a
convenience: the pages load `styles.css`, `assets/` and now `tokens/src/*.json` by relative
path, and `fetch` does not work under `file://`.

It prints the entry points:

```
Arena demos on http://localhost:8000
  Overview   -> /Arena%20-%20Overview.dc.html
  Identity   -> /Dravensoft%20Identity.dc.html
  Guidelines -> /guidelines/
```

It uses `Bun.serve`. This is the first genuinely Bun-specific script in the repository, so
the `[Unreleased]` CHANGELOG sentence claiming nothing in the scripts is Bun-specific
**must be corrected** in the same change: the gates stay runtime-portable, the dev server
does not.

## Modules and testing

Following the repository's existing shape — pure logic tested, DOM kept thin:

| File | Responsibility | Tests |
|---|---|---|
| `scripts/lib/token-preview.mjs` | pure: DTCG tree to a flat list of preview descriptors | `node:test`, including the type fallback for an unmapped group |
| `scripts/lib/css-decls.mjs` | **reused unchanged** to read the aliases out of `colors.css` | already covered by 5 tests |
| `overview.js` (root, beside `theme.js`) | DOM construction, deliberately thin | exercised by eye |

No new dependency. No coverage gate is needed: runtime generation makes coverage drift
impossible by construction, which is why this approach was chosen over a hand-written page
plus a `check-overview.mjs` gate.

**Not claimed:** that the result looks good. That requires human eyes on the served page,
and is an explicit review step at the end of implementation rather than an assumption.

## Documentation to update

- `CLAUDE.md` — the Overview is no longer a `.dc.html` dc-runtime page; the "Viewing
  things" section gains `bun run demos`; the `*.dc.html` note narrows to the Identity
  manual.
- `README.md` — the repo layout entry for the root pages and for `scripts/`.
- `CHANGELOG.md` — `[Unreleased]`: the Overview rewrite, the removal of the parallel
  component implementation, the demo server, and the correction of the Bun-specific claim.

## Out of scope

- `Dravensoft Identity.dc.html` — untouched.
- `guidelines/*.html` — the specimen cards stay as they are. They are card-sized fragments
  for external `@dsCard` rendering; the Overview is the single narrated page. The overlap
  in subject matter is intentional and the formats do not compete.
- Any change to components, to `frameworks/`, or to token values.
