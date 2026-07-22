# Arena token type map (DTCG 2025.10)

Normative. This table states the DTCG `$type` of every token group in
`tokens/src/`. It is the contract a new platform target reads first: consume
these values, do not re-derive them.

| Token group | Source file | DTCG `$type` | Notes |
|---|---|---|---|
| Base neutrals, brand, status, `error-fill`, `cat-1..8` | `palette.dark.json` / `palette.light.json` | `color` | per-theme (dark on `:root`, light on `.arena-light`) |
| Font families (`font-display/body/mono`) | `typography.json` | `fontFamily` | comma stacks preserved; generics stay unquoted |
| Font weights (`fw-*`) | `typography.json` | `fontWeight` | numeric 400-900 |
| Font sizes (`fs-*`) | `typography.json` | `dimension` | px; `fs.mega` (150px) and `fs.hero` (96px) extend the scale above `display` (64px), extrapolating its accelerating ratio; `fs.hero` has no consumer today by design — do not delete it as dead API |
| Line heights (`lh-*`) | `typography.json` | `number` | unitless |
| Letter spacing (`ls-*`) | `typography.json` | `number` | `em` is not a DTCG dimension unit, so tracking is a unitless `number` (a font-size multiplier) with an `$extensions.com.dravensoft.arena.cssUnit: "em"` render hint |
| Spacing scale (`sp-0..24`) | `spacing.json` | `dimension` | px; `sp-0` renders as bare `0` |
| `container-max`, `gutter` | `spacing.json` | `dimension` | px |
| Breakpoints (`bp-sm/md/lg`) | `spacing.json` | `dimension` | px; read by JS via `getComputedStyle`, never a media query |
| Density (`dz-*`) | `spacing.json` / `density.compact.json` | `dimension`, except `dz-lh` | px; base on `:root` + `.arena-compact` override. `dz.lh` carries a token-level `$type: "number"` override — a line height is unitless, so the group's `dimension` default does not fit that one member; DTCG 2025.10 allows a leaf's own `$type` to win over its ancestor's, and `scripts/check-dtcg.mjs` accepts it. `dz.lh` is the control counterpart to `lh` below: `1`, the glyph-tight reset that keeps an icon's line box from throwing its control out of alignment |
| Avatar diameters (`avatar-xs/sm/md/lg`) | `spacing.json` | `dimension` | px; the first family named after a component rather than a role — Avatar derives the initials' `fontSize` (× 0.4) and the presence dot's diameter (× 0.28) from its own diameter, so the two ratios need a diameter to derive from |
| Brand lock-up (`logo-mark-*`, `logo-text-*`) | `spacing.json` | `dimension` | px; the mark's square slot and the wordmark's font size, paired at four steps. Authored together in `spacing.json` because the pairing is the token — a lock-up's mark and text are one decision — even though the wordmark half reaches Tailwind through the `--text-*` namespace |
| Icon size (`icon-sm/md/lg/xl`) | `icon.json` | `dimension` | px; a glyph rendered as a webfont is an icon, not type, so these stay out of `fs` |
| Radius (`r-xs..pill`) | `effects.json` | `dimension` | px; `r-xs/sm/md/lg/xl/2xl` = `4/6/10/14/22/34px`, `r-pill` = `999px` |
| Border widths (`bw`, `bw-strong`) | `effects.json` | `dimension` | px |
| Shadows (`shadow-1..3`) | `effects.json` | `shadow` | composite, incl. negative spread and rgba color |
| `scrim` | `effects.json` | `color` | structured srgb with `alpha`, rendered as `rgba()` |
| `scrim-blur`, `focus-width`, `focus-offset` | `effects.json` | `dimension` | px |
| Durations (`dur-fast/mid/slow`) | `effects.json` | `duration` | ms |
| Loop durations (`loop-spin/sweep/shimmer/brand/reduced/brand-reduced`) | `effects.json` | `duration` | ms; cyclical motion, deliberately separate from `dur`'s transition range |
| Easings (`ease-*`) | `effects.json` | `cubicBezier` | `[x1,y1,x2,y2]` |
| Layering (`z-*`) | `layering.json` | `number` | unitless integers; the family declares the order, the values only preserve it |
| Chart geometry (`chart-*`) | `chart.json` | `dimension` | px; **script-readable** — emitted to `frameworks/*/tokens.generated.*` as bare numbers as well as to CSS, because JS arithmetic computes SVG positions from them. Does not re-densify: a value bound at import time cannot respond to `.arena-compact` |

## Value formats are strict 2025.10

- Every `color` — including each `shadow`'s color slot and `scrim` — is a
  structured object: `{ "colorSpace": "srgb", "components": [r,g,b], "alpha"?: a,
  "hex"?: "#rrggbb" }`. Never a bare hex or `rgba()` string. When `hex` is
  present it must round-trip `components`; `scripts/check-dtcg.mjs` enforces it,
  so the two representations cannot drift.
- Every `dimension` and `duration` is `{ "value": N, "unit": "px" | "ms" }` — the
  unit is required even when `N` is 0.
- `number`, `fontWeight` values are bare numbers; `cubicBezier` is an array of 4.

## Script-readable tokens

A token carrying `$extensions["com.dravensoft.arena"].script: true` is emitted
**twice**: as the CSS custom property it would have had anyway, and as a bare
number exported from each framework layer's generated module
(`frameworks/react/tokens.generated.js`, `frameworks/angular/tokens.generated.ts`).

The flag lives in the source, not in a list inside the build script, because a
second list is a second thing to keep in sync.

Flag a token only when **JS arithmetic must consume it to produce a position**.
A value the browser can apply directly stays CSS-only. Two consequences follow
and neither is negotiable: a script-readable value is bound at import time, so
it **cannot re-theme and cannot re-densify**; and only `dimension`, `duration`
and `number` are flaggable, because those are the only types whose value is a
number.

## What is not in this map

Tokens absent from this table are, by definition, part of the per-platform
composition layer: they live in `tokens/colors.css` (aliases and `color-mix`
derivations) or `tokens/fonts.css` (`@font-face`), never in `tokens/src/`.
DTCG owns values; the composition layer owns how values are combined at runtime.
