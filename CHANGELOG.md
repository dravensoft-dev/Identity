# Changelog

All notable changes to Arena — Dravensoft Design System are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **The Tailwind layer exposes Arena's whole token surface.** `frameworks/tailwind/theme.css`
  grows from 37 theme keys to 89: the nine-step type scale, the three families, all six
  weights, line height and tracking, the seven density tokens, the six missing spacing
  steps, `--radius-xs` and `--radius-pill`, the four missing `-content` pairs,
  `--color-neutral` and its content, `--color-error-fill`, and the scrim. `.arena-compact`
  now has a utility surface; `rounded-pill` and `text-h1` exist.
- **`--dz-text`, the 14px control text size.** Arena's editorial scale ran 13px to 15px
  with nothing between, while React's `Button` has used 14px for its `md` size all along;
  naming it is what lets the Tailwind layer express `Button` without an arbitrary value. It
  lands in the control-density family `dz` rather than the editorial scale `fs`, because a
  button label is chrome, not prose, and `fs` is semantic and closed. Like every other `dz`
  member it carries a 13px `.arena-compact` override, so control text now densifies with the
  controls around it — which the literal `text-[14px]` it replaces never did.
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

## [4.0.0] — 2026-07-18

### Changed

- **Token values are now DTCG 2025.10 JSON.** `tokens/src/**/*.json` is the single
  source of every token value, authored as strictly-conformant DTCG 2025.10 (the first
  stable W3C Format Module), and `tokens/palette.css`, `typography.css`, `spacing.css`
  and `effects.css` are generated from it by Style Dictionary v4
  (`bun run build:tokens`) — they are still committed, but must no longer be edited by
  hand. `tokens/colors.css` (aliases and `color-mix` derivations) and `tokens/fonts.css`
  (`@font-face`) stay hand-authored and generated-by-`fetch-fonts.mjs` respectively, as
  the documented per-platform composition layer. Two new gates enforce the boundary:
  `scripts/check-dtcg.mjs` (the source validates against 2025.10) and
  `scripts/check-tokens-generated.mjs` (the committed CSS matches the source). No token
  value changed. The repo gains its first `package.json` — private, dev-only, never
  published.
- **The build and check scripts run on Bun.** `bun install`, `bun run build:tokens`,
  `bun test`; the five pre-existing gates (`check-ramp`, `check-text-contrast`,
  `check-release`, `fetch-fonts`, `validate-palette`) move with them, so the toolchain
  does not split. Every gate stays runtime-portable — plain ESM importing only `node:fs`,
  `node:path` and `node:url`, verified to produce identical output and exit codes under
  both runtimes. The one exception is the new `bun run demos` dev server
  (`scripts/serve.mjs`), which uses `Bun.serve` and is not a gate.
- **The Overview is now the token language, and generates itself.**
  `Arena - Overview.dc.html` became `Arena - Overview.html`: plain HTML driven by one ES
  module, no longer a `dc-runtime` page. It reads token names and descriptions from
  `tokens/src/*.json` and the aliases from `tokens/colors.css`, and reads every **value**
  from `getComputedStyle` on the live document, so it exercises the built CSS instead of
  echoing the source. All 138 token names render — 98 from the DTCG source, 40 from the
  composition layer — and adding a token to `tokens/src/` now makes it appear with no edit
  to the page. `Dravensoft Identity.dc.html` is unchanged and remains the only
  `dc-runtime` page. New: `bun run demos` serves the repo root for both, and
  `scripts/browser-modules.test.mjs` parses the browser-side modules, which no other test
  imports — a syntax error in one of them is otherwise silent, since the module never runs
  and the page's own error handler never fires.

### Removed

- **`--glow-accent`.** A `var()`-tinted shadow has no conformant DTCG type, and the token
  had exactly one consumer. Accent buttons now raise the general elevation
  (`--shadow-2`) on hover instead of the crimson glow, in the React `Button`, the
  Tailwind `Button` manifest and the Overview demo; the `glow` swatch is gone from
  `guidelines/effects-shadow.html`. This is the sole visual change in the migration.
- **The Overview's parallel component implementation.** It defined roughly 130 private CSS
  classes (`.btn`, `.badge`, `.card`, `.alert`, `.menu`, `.toast`, `.spinner`, `.tabs`,
  `.dialog`, `.skel`…) that hand-reimplemented most of the library, contradicting the rule
  that components carry no CSS classes and drifting from the real components — retiring
  `--glow-accent` had to be applied to it by hand. Components now live only in the
  framework layers, and the Overview points at them.

## [3.2.0] — 2026-07-17

### Changed

- **Self-hosted resource policy.** Text fonts are now bundled and self-hosted by
  default: the Archivo / Familjen Grotesk / Spline Sans Mono `.woff2` binaries
  ship in `assets/fonts/` and `tokens/fonts.css` declares them with `@font-face`,
  replacing the Google Fonts CDN `@import`. Every framework layer and HTML page
  inherits fonts from this single origin; the Angular layer's own `fonts/`
  directory is removed and `fetch-fonts.mjs` moves to `scripts/`. Iconography now
  documents installing the official `@phosphor-icons/*` package as the default
  (the CDN is prototype-only). No font CDN request remains in the repo.

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

## [3.0.0] — 2026-07-17

### Changed (breaking)

- **Introduced `frameworks/`.** Every framework-bound file moved under it: the
  React primitives, example app, and hook now live in `frameworks/react/`
  (`components/`, `ui_kits/console/`, `use-container-width.js`). The repo root
  keeps only the framework-agnostic language, the demo runtime, and the brand
  `*.dc.html`.

### Added

- **`frameworks/tailwind/`** — a shared, token-derived Tailwind v4 layer:
  `theme.css` (the `@theme` preset) and `components/*.manifest.json`
  (framework-neutral class/variant recipes, starting with `Button`). It derives
  every utility from an existing token and introduces no new value.
- **`frameworks/angular/`** — placeholder for Angular support (filled by the
  Angular spec).

### Migration

- Update React import paths: `./components/<group>/X.jsx` →
  `./frameworks/react/components/<group>/X.jsx`; `./use-container-width.js` →
  `./frameworks/react/use-container-width.js`. Tokens, guidelines, assets, and
  `styles.css` are unchanged at the repo root.

## [2.4.0] — 2026-07-17

Danger was one red doing two jobs, and it was failing both. This splits it, and extends `check-text-contrast.mjs` to the checks that would have caught it.

**Not breaking for existing skins.** `--color-error-fill` is a new token, but it is an *optional* pin: `--danger-fill` falls back to `color-mix(in oklab, var(--color-error) 85%, black)` when a skin omits it, so a `tokens/palette.css` copied before this release keeps a filled danger dark enough to carry `--color-error-content` — nothing goes backgroundless. Pin it only to override the derived tone (the Dravensoft skin does, for `#ce3838`). `check-text-contrast.mjs` gates both the pin and the fallback.

### Fixed
- **The filled confirmation button was under WCAG AA, and so was every outline danger control.** `--color-error` `#e53e3e` carried white text at **4.13:1** in `ConfirmDialog`'s point-of-no-return button, and was read *as text itself* at **4.29:1** (dark) and **3.76:1** (light) by `.btn.danger`, `.iconbtn.danger` and `.mitem.danger`. One token cannot clear both gates: the outline needs a red light enough to read on the base surfaces, the fill needs one dark enough to carry white, and they pull in opposite directions. The outline keeps `--color-error`, now tuned per theme (`#e85151` dark, `#c33535` light — 4.83:1 and 4.93:1 on the card); the fill moves to the new `--color-error-fill` (`#ce3838`, 4.94:1 against white in both themes). This is why the README now says danger is two reds.
- **`--color-info-content` and `--color-success-content` were white on their fills, under AA.** White on `#3182ce` is 4.03:1 and on `#38a169` is 3.25:1 — both short of 4.5:1. The fills are unchanged (the status hues are identity); the content flips to `#141010`, which clears at 4.69:1 and 5.82:1 and matches the near-black `secondary-content`/`warning-content` already used on the light fills. No component paints these today, so the only visible change is the swatch grid in the brand manual — but the pair is now legible if anything ever does.

### Added
- **`--color-error-fill` / `--danger-fill`** — the filled-danger surface, and the only one in Arena. Never a border or a text color; `--danger` is that. It is an **optional** pin over an oklab fallback derived from `--color-error`: a skin that only swaps the palette gets a passing filled danger for free, and one that wants an exact tone pins it. `check-text-contrast.mjs` gates whichever path is live, and gates the fallback on every run so a broken derivation cannot ship behind a present pin. It is the one `--color-*` token with no `-content` of its own — it is a second fill for `--color-error`'s content — and the README's token architecture says so.
- **The brand manual shows both reds.** `Arena - Overview.dc.html` gains an `error-fill` swatch, and its `error` swatch is now drawn as an **outline** rather than a filled chip: `--color-error` is an outline token, and painting white on it was both illegible (3.67:1 in dark) and a demonstration of the exact pairing this release forbids.
- **`ConfirmDialog.prompt.md` gains a Do/Don't** (README H10) naming `--danger-fill` and the reason not to rebuild the filled button by hand with `--danger`.
- **`check-text-contrast.mjs` now checks the fill/content pairs, the on-surface accents, and the `--danger-fill` fallback**, not just the levels derived from `--color-base-content`. **Every daisyUI fill/content pair is gated at 4.5:1** — not only the two the product paints today (`--color-primary` under `--on-accent`, `--danger-fill` under the final confirmation), but all seven, because the pair is the contract a skin defines and an illegible one should fail before a component inherits it. `--color-error` as the outline is gated on the surfaces; `--color-primary`/`--color-secondary` as text stay reported-not-gated (brand values, see Known). It carries a small oklab conversion, verified byte-exact against the browser's own `color-mix`, so it resolves the `--danger-fill` fallback exactly as CSS does. Nothing is hardcoded: the values come out of `palette.css`, so this checks a swapped skin too.

### Known — reported, not gated
- **Crimson is 2.80:1 as text on the dark card; gold is 2.24:1 on the light one.** Both below AA, both surfaced by the new checks, both left alone: these are the brand, not a mistuned token, and moving them is a design decision rather than a fix. `ConfirmDialog`'s eyebrow is the one place crimson is text on dark today. The numbers are in the script's output instead of nowhere.

## [2.3.1] — 2026-07-17

Documentation only. No token, component, convention or API moves; there is nothing to migrate. It is a patch and not a minor because the section below holds nothing but fixes — this project adheres to Semantic Versioning, and a release that adds no capability does not get a minor.

### Fixed
- **The README told developers to update with one command, and it left them on the old version.** "Pull updates with `/plugin marketplace update dravensoft`" only refreshes the *catalog*; `/plugin update arena@dravensoft` is what replaces the installed copy. Following the README you would see the new version listed, keep running the old one, and get no error — the same shape of silent failure `check-release.mjs` exists to catch, this time in the documentation rather than in the manifest. The section now carries the whole sequence, including the `/reload-plugins` that install has always needed too, and the fact that Claude Code leaves auto-update **off** for third-party marketplaces like this one, so nothing arrives on its own until each developer turns it on.
- **`check-release.mjs` reads the first *versioned* CHANGELOG entry**, so `[Unreleased]` sitting on top is expected rather than a failure. At release time it is `[Unreleased]` that gets renamed to the version, which is why the check looks past it instead of at the first heading.

## [2.3.0] — 2026-07-17

Fixes how the plugin is delivered, so that a version resolves to exactly one commit. Nothing in the design language moves: no token, component or convention changes, and there is nothing to migrate.

### Added
- **`scripts/check-release.mjs`** — asserts a release is coherent: the version in `plugin.json` (the authority — Claude Code resolves `plugin.json` > marketplace entry > commit SHA) against the marketplace entry, the README header, the CHANGELOG's top entry, `source.ref` and the tag. Its load-bearing check is the last one: that **the `plugin.json` at the pinned tag hands out the version being advertised**. Pinning bought determinism at the price of a silent failure — bump the version, leave `ref` behind, and the update is simply never offered to anyone, with nothing erroring and nothing looking broken. Sibling of `check-ramp.mjs` and `check-text-contrast.mjs`, and there for the same reason: a claim nobody can check is the actual root cause, not the value that drifted.

### Changed
- **The plugin is served from the release tag, not from whatever `main` happens to hold.** `marketplace.json` declared `"source": "."`, which resolves against the marketplace's own checkout — the default branch. A version string therefore did not identify a tree: 2.2.0 was declared at the `SegmentedControl` commit and `main` moved seven commits past it under the same number, so two people installing "2.2.0" a day apart could hold different code. The entry now pins to the release tag (`{"source": "github", "repo": "dravensoft-dev/Identity", "ref": "v2.3.0"}`), so a version resolves to exactly one commit, permanently, and the tags become the release channel rather than decoration. The catalog itself is still read from `main`, which is what lets a new release announce itself.
- **This is the first release that follows the whole rule in one commit.** The version strings, the marketplace `ref` and the tag all move together, so `v2.3.0` contains a `marketplace.json` that points at `v2.3.0`. 2.2.0 could not: it was already tagged when the pin was introduced, so the tree behind `v2.2.0` still reads `"source": "."`. That is inert — the catalog is read from `main`, never from the tag — and it was left alone rather than fixed by moving a published tag, which would have handed the same version string two different trees to different people, the exact defect the pin removes.

## [2.2.0] — 2026-07-17

Adds `SegmentedControl`, the last open item from the retired DAMA component catalog. Additive: no breaking changes to any existing API.

### Added
- **`SegmentedControl`** (`navigation/`) — a compact inline filter over mutually exclusive options: an enclosed track that shrinks to its content, with a neutral raised thumb on the selected one. Covers the two `mat-button-toggle` usages the DAMA migration had nowhere to land: `Tabs` navigates between views and `RadioGroup` is a form control, and neither is a compact in-view filter.
  - **It carries no crimson**, and that is the design, not an omission. `Tabs` marks the active view with the crimson underline; a filter that also reached for the accent would compete with it and with the primary action, against the "one primary accent per view" rule and the reservation of the solid fill for the primary action. Selection is drawn with the sanctioned depth kit instead — the surface scale (`--surface-input` track, `--line-strong` thumb), the hairline border and `--shadow-1`. The distinction from `Tabs` is now written down in README → VISUAL FOUNDATIONS rather than left to whoever reaches for the component next.
  - **It is a real radio group, never `role="tablist"`** — its options are mutually exclusive values, not destinations, and claiming tab semantics would promise a `tabpanel` that a filter does not have. Each segment is a hidden native `<input type="radio">` inside a `role="radiogroup"` track, the same pattern `RadioGroup` already uses, so the browser owns the keyboard: one tab stop, arrows move and select. Focus and selection therefore always coincide, which is what lets the gold focus ring sit on the track exactly the way `Input` and `Select` wear it. `ariaLabel` is required — an unnamed radio group is announced as an unlabelled group.

### Fixed
- **The controls now read the density tokens** (`--dz-ctl-h-sm` / `--dz-ctl-h` / `--dz-ctl-h-lg`) instead of hard-coding their heights. The tokens were declared for "buttons, inputs, switches row" and their values were plainly taken from Button's own scale, but nothing ever read them: `Table` was the sole consumer, so `.arena-compact` re-densified rows while every control in the same view stayed comfortable. `Button` and `IconButton` drop 32/40/48; `Input`, `Select` and `ConfirmDialog`'s confirmation field drop 42; and the hand-rolled buttons inside `ErrorState` and `ConfirmDialog`, which duplicated Button's 40 rather than using `Button`, drop it too — otherwise `ConfirmDialog` would have densified its own field away from its own buttons.
  - **One control height, finally.** The 42 was never reachable through a token and never matched the 40 the token declared, so a button next to an input has been 2px off for as long as both have existed. Everything is now `--dz-ctl-h`: 40px comfortable, 32px compact, measured identical across Button, IconButton, Input, Select and both modal surfaces in both scopes.
  - **`Input` was really rendering at 44px**, not 42: its box is a `<div>` with a hairline border under content-box sizing, so the border added 2px on top of the declared height — which is why the mismatch was visible in the first place. `Input` and `ConfirmDialog`'s field now set `box-sizing: border-box`, the way the browser already treats `<select>`.
- **`--dz-ctl-h-lg`** added (48px comfortable / 40px compact). Without it the large size had no token and the component would have read the scale for two of its three sizes, which is worse than reading none.
- **Every animated component now follows the injection pattern, and answers `prefers-reduced-motion`.** `Rotor`, `Dialog`, `Tooltip` and `Menu` rendered their `<style>` inside their own markup, like `Button` did — one tag per instance, CSS leaking into `textContent`. CLAUDE.md claimed "the pattern is always the same" while half the animated components ignored it; that claim is now true, and both it and README record what the pattern actually is.
  - **The reduced-motion answer depends on what the motion means**, which is now written down rather than decided per component: work-in-progress motion slows (`Spinner`, `ProgressBar`, `Button`, `Rotor` — 8s to 24s), decorative motion stops (`Skeleton`), an entrance keeps its fade and drops its travel (`Dialog`, `Menu`), and opacity-only animations need no clause (`Tooltip`).
  - **`Dialog` and `Menu` need no class for it.** Their reduced variant redefines the keyframes inside the media query, so the `animation` shorthand stays inline and the injected CSS stays keyframes-only, which is what CLAUDE.md asks for. Only `Rotor` takes a class, because its variant changes a duration and a duration needs a selector.
- **`Button` injected its loading keyframes inside every `<button>`.** One `<style>` per instance, rendered into the element itself, contradicting the injection pattern the repo documents and `ProgressBar`, `Input`, `Spinner` and `Skeleton` all follow: a module-level guard, a `useEffect`, one tag appended to the head. It also leaked the CSS text into the button's `textContent` (the accessible name was unaffected — a `<style>` is `display:none`, so it never reached the accname). Twelve buttons on the forms card now put zero tags in their markup and one in the head.
  - **The spin honours `prefers-reduced-motion` now**, which it never did — the only one of Arena's three animations that ignored it. It slows to 2.4s rather than freezing, matching `Spinner` and `ProgressBar`: a stopped spinner reads as a hung process.
  - The ring rendered at 18px while its code declared 14: the same content-box-plus-border arithmetic that made `Input` 44. It is now genuinely 14px, which is exactly `Spinner`'s `sm`.
- **The last two hard-coded colors in `components/`**, which made the README's "no hardcoded colors remain: everything goes through a token" claim false. `ErrorState`'s diagnostic-code chip was `rgba(0,0,0,.25)` and now derives from `--color-base-100` with `color-mix`, so it follows the theme instead of always darkening. `Onboarding`'s backdrop was a hand-rolled `rgba(20,16,16,.5)` a hair off `--scrim` and now uses the token. It keeps no blur, and `tokens/effects.css` now says why: the blur is what separates a modal from a coachmark, and a tour that blurs the product it is touring defeats itself.

### Changed
- **`ConfirmDialog` and `ErrorState` use `Button` instead of restating it.** Their Retry, Cancel and confirm controls were hand-rolled `<button>`s that duplicated Button's height, radius, padding, font, weight and disabled treatment — and had already drifted: they kept a literal `40` when the height moved to a token. Cancel maps exactly onto `variant="ghost"` and gains the hover it never had; Retry and the confirmation map onto `variant="primary"`. Nothing changes visually apart from that hover.
  - **The final confirmation keeps its fill as a local override, not a variant.** It is the one filled danger surface in Arena, and `Button` deliberately has no filled-danger variant: danger is outline everywhere else, and a variant would put this fill one prop away from every caller. So the override lives at the single sanctioned call site and cannot spread.
  - It now paints `--color-error-content` rather than `--on-accent`. Both are white in the Dravensoft skin, so nothing moves today, but the fill is `--error` and a swapped `palette.css` is free to pair `--error` with a content color that is not `--primary`'s.
- **Demos are filed by component, not by audit round.** The two `remediation*.card.html` cards organised their contents by Nielsen review severity — a record of the process that produced the components rather than documentation of the components themselves. Each of their contents now lives in a card of its own group, which is where someone looking for the component will actually go: `feedback/confirm-dialog`, `feedback/empty-error-state`, `feedback/onboarding`, `display/skeleton` and `navigation/command-palette`. Density, being a token scope rather than a component, becomes the `guidelines/spacing-density` specimen.

### Removed
- **`feedback/remediation.card.html` and `feedback/remediation-sev2.card.html`**, once their contents had somewhere else to live. Nothing referenced them by name. Their density demo was also quietly broken: it contrasted two `IconButton`s across the `.arena-compact` scope, but `IconButton` does not read the `--dz-*` tokens, so both rendered identically. The replacement specimen uses `Table`, the only consumer, where the scope switch is visible.

## [2.1.0] — 2026-07-17

Adds `Calendar`, the last component the DAMA migration was missing, and retires the catalog that tracked it. Additive: no breaking changes to any existing API.

### Added
- **`Calendar`** (`display/`) — week/day schedule on a time grid: toolbar, one column per day, events positioned by their wall-clock span, a live "now" line. Dependency-free, like the charts: no FullCalendar, no third-party widget skinned from outside.
  - **Overlapping events share the width** of their day instead of covering each other, clustered by connected overlap. This is the component's real weight and the reason it was worth building rather than wrapping — a schedule where one booking hides another is worse than none.
  - **`timeZone` is required** and is an IANA name. Wall-clock fields come from `Intl.DateTimeFormat.formatToParts`, so a class at 09:00 in Madrid stays at 09:00 for a reader in Lima, with no date library and no `package.json` to add one to.
  - **The week collapses to a day below `--bp-md`, measured on the container**, not the viewport — the rule `Table` already follows. Passing `view` overrides it.
  - **Color is identity only:** `CalendarEvent.slot` picks a slot in the categorical ramp, through the same `catColor` the charts use. State (cancelled, tentative) goes on a non-chromatic channel via `renderEvent`. See the note under **Reconciled** below.
  - Time-grid policy is props with DAMA's values as defaults, not hardcoded: `dayStart` (defaults to the earliest event's hour, or 08:00), `dayEnd` (23:00), `weekStartsOn` (Monday), `hideEmptyWeekend` (Sunday hidden until an event lands on it). Whether the week starts on Monday is a product's call, not the system's.
- **`components/display/calendar-internals.js`** — the pure date and layout logic (zone reading, overlap clustering, range titles). No React, no DOM. Sibling of `chart-internals.js` and not a component: no quartet.

### Reconciled
- **`CalendarEvent.color?: string` was never shipped.** The catalog proposed a raw color string, which would have reopened exactly the hole the categorical ramp closed in 1.1.0 — a color outside the token layer, unaware of theme, with no contrast guarantee. It is `slot?: CatSlot` instead, and the ramp now has two consumers and still one entry point.
- **`onRangeChange` reports the new anchor date, not a delta.** The catalog specified `(delta: number)`, which cannot express the toolbar's "Today" button: Today is a jump to an absolute date, not an offset. It is `(isoDate: string)`.
- **View switching is container-driven, not viewport-driven.** The catalog specified a hardcoded 768px against the viewport, contradicting Arena's own rule. It reads `--bp-md` through `readBreakpoint` and measures the container.
- **The `ChartPalette` / `readChartPalette` contract the catalog made a prerequisite does not exist and was not built.** It only ever existed to work around `<canvas>` being unable to inherit CSS. Arena's charts draw SVG, which inherits it; `Calendar` does the same.

### Removed
- **`components-catalog.md`** — the working document for the DAMA migration, now closed. Ten of its eleven items shipped (1, 2, 4, 5, 6, 7, 8 and 11 in 1.1.0; 3 here). **Item 10 (`List`) was a deliberate skip, not an oversight** — its two DAMA usages are better served by `Shell`'s own nav and by plain markup, and the catalog itself recommended skipping it; recording that here is the point, so the next audit does not re-flag it as an unexplained gap. Item 9 (`SegmentedControl`) ships separately, with its spec already extracted. The file was written against v1.0.0 and had drifted out of date on four counts, all listed under **Reconciled** above — a stale spec in the tree is worse than none. Specs and plans do not live in this repo.

## [2.0.0] — 2026-07-17

Closes two WCAG failures in the light theme, both from one root cause: Arena is dark-first, and a value tuned against the dark background reached the light theme unmeasured.

### Removed
- **BREAKING — `--mute-2` and `--text-faint`**, the faint text level. Use **`--text-muted`**. It was removed rather than repaired: at 52% it measured 3.46:1 on the light card, failing WCAG AA for text, and clearing AA in light needs 61% of `--color-base-content` while `--mute` already sits at 62% — no distinguishable level fits below `--text-muted`. No component in the kit consumed it.

  **Migrating:** replace `var(--text-faint)` and `var(--mute-2)` with `var(--text-muted)`. For `Avatar`-style presence dots, use `--status-offline` instead. Note that an unresolved `var()` does not error — it inherits or falls back to transparent — so grep your product for both names rather than relying on the page to look broken. Staying on 1.1.0 is a valid choice; the tokens are intact there.

### Added
- **`--status-offline`** (52% of `--color-base-content`) — presence "offline" only, for `Avatar`'s status dot. 4.93:1 dark / 3.46:1 light on the card, clearing WCAG 1.4.11's 3:1 for graphical objects.
- **`scripts/check-text-contrast.mjs`** — reads the surfaces from `tokens/palette.css` and the derivations from `tokens/colors.css`, resolves every text level over `--color-base-100` and `--color-base-200` in both themes, and exits non-zero on failure. It also asserts the removed tokens stay removed. Reuses `contrast()` from `validate-palette.mjs`; hardcodes nothing. Sibling of `check-ramp.mjs`, and there for the same reason.

### Fixed
- **`--text-faint` / `--mute-2` as body text on the card failed WCAG 1.4.3** in the light theme — 3.46:1 against a 4.5:1 bar (dark passed at 4.93:1). Fixed by the removal above.
- **`Avatar`'s offline dot failed WCAG 1.4.11** in the light theme — 2.47:1 against a 3:1 bar. It was painted with `--mute-2-disabled`, a token serving two masters that want opposite things; raising it would have made `Pagination`'s disabled controls read as enabled. It now uses `--status-offline`. The dot already carried `aria-label` and `title`, so the state was never color-alone; only its contrast was failing.
- **`README.md` claimed `--mute-2` was recalibrated to WCAG AA.** That was true of the dark theme only; the light theme was never re-measured and had sat at 3.46:1 since review 3. The claim is corrected, and `check-text-contrast.mjs` now makes it machine-checkable — an unverifiable claim being the actual root cause here, not the two numbers.

### Unchanged, deliberately
- **`--mute-2-disabled` stays at 40%** (2.47:1 light). WCAG 1.4.3 and 1.4.11 both exempt inactive user-interface components. On `Pagination`'s disabled controls, low contrast is not a defect — it is the affordance.

## [1.1.0] — 2026-07-16

Closes the component gap found by DAMA's migration. Additive: no breaking changes to any existing API.

### Foundations
- **`tokens/palette.css`** — the Dravensoft skin is now a file of its own: the `--color-*` set per theme plus the categorical ramp, and nothing else. `tokens/colors.css` keeps the structure (aliases, `color-mix` derivations) and no longer defines a skin value. A consumer re-skins Arena by swapping one file; see README → Theming for the invariant/skin split.
- **Categorical chart ramp** (`--color-cat-1..8`) — eight slots per theme, fixed order, never cycled. Derived by enumeration against the data-viz validator: both themes clear every hard gate with no relief rule (CVD 13.3 dark / 16.4 light; normal-vision floor 20.5 / 22.1; all slots ≥ 3:1 on the card surface).
- **`scripts/validate-palette.mjs` + `scripts/check-ramp.mjs`** — the validator ships in the repo, and the runner reads the ramp straight out of `palette.css`, so whoever swaps the skin re-checks the gates instead of trusting their eye.
- **Breakpoint tokens** `--bp-sm` / `--bp-md` / `--bp-lg` — shared values read by JS, not media queries.
- **`use-container-width.js`** — `useContainerWidth` (a `ResizeObserver` hook) and `readBreakpoint`. Responsive components measure their container, not the viewport. It is a copy-in artifact: copy it alongside `tokens/`, `assets/` and `styles.css`.

### Components
- **Charts** (`components/charts/`): `ChartCard`, `BarChart`, `LineChart`, `DoughnutChart` — hand-written SVG, no dependency. A `<canvas>` cannot inherit CSS; SVG reads `var(--color-cat-N)` and re-themes with the page for free. Series carry identity (`slot`/`slots`) or meaning (`tone`), never both. Hover tooltips, a legend on the doughnut, one axis, and the numbers exposed as a table.
- **`StatCard`** (display) — a metric tile whose delta separates direction from sentiment: revenue down is bad, latency down is good, and only the product knows which.
- **`PageHead`** (navigation) — page title, subtitle and actions; `Shell` now composes it instead of duplicating the markup.
- **`Spinner`** (feedback) — indeterminate waits; slows rather than stops under reduced motion. No status tones, on purpose.
- **`ThemeToggle`** (forms) — built on `IconButton`, owns no state, reports `aria-pressed` from the current dark state.

### Extensions
- **`Table`** — `responsive` (default on): below `--bp-md` it renders one card per row, measured on the container. Columns choose their card layout with `mobileLayout: 'row' | 'block'`.
- **`Input`** — `date`, `time` and `datetime-local` are supported and styled in both themes. Arena deliberately ships no `DatePicker`: the native control already has the accessibility.

### Conventions
- **Delta pills are outline for both signs.** Filled red remains exclusive to `ConfirmDialog`'s final irreversible confirmation — that exclusivity is what gives it weight (`guidelines/components-danger.html`).
- **The palette is a documented default, not a mandate.** Arena's identity is shape: danger-as-outline, no gradients, the surface scale, the hairline border, the warm shadow. All of it survives a palette swap.
- A `<style>` tag injected once is the sanctioned way to reach `@keyframes` and vendor pseudo-elements — the only exception to "components carry no CSS".

### Not in this release
- `Calendar` / `Scheduler` — large enough to slip a release on its own; next minor.
- `List` and `SegmentedControl` — better served by `Shell`'s nav and plain markup.
- `DatePicker` / `TimePicker` — deliberate non-goals; see `Input`.

## [1.0.0] — 2026-07-16

First public release. The design language is stable and ready for other teams to build on.

### Foundations
- **Design tokens** (`tokens/`): color (daisyUI `--color-*` structure with an Arena legacy-alias compatibility layer), typography, spacing (4px grid), effects (radii, shadows, easings) and fonts. Single entry point `styles.css`.
- **Themes**: dark-first (`:root`, default) and warm light (`.arena-light`) driven by the same tokens; toggle helper in `theme.js`.
- **Content and visual guidelines** documented in `README.md`, plus specimen cards in `guidelines/`.

### Components (`components/`)
- **Forms**: Button, IconButton, Input, Textarea, Select, Checkbox, Radio/RadioGroup, Switch.
- **Display**: Card, Badge, Tag, Avatar, Table, Skeleton.
- **Navigation**: Tabs, Breadcrumbs, Menu, Pagination, CommandPalette, BulkActionBar.
- **Feedback**: Alert, Dialog, ConfirmDialog, Toast, Tooltip, EmptyState, ErrorState, ProgressBar, Onboarding.
- **Brand**: Rotor.
- Each component ships TypeScript types (`.d.ts`) and usage docs with Do/Don't (`.prompt.md`).

### Conventions
- **Danger convention**: destructive actions distinguished by shape (outline in `--error`), never filled, with the sole exception of the final irreversible confirmation.
- **Iconography**: Phosphor Icons (Bold default) adopted as the official set.
- All hardcoded colors removed from components — everything flows through tokens (`--on-accent`, `--scrim`, `--danger-strong`, …).
- Passed Nielsen heuristic audits through severity 1; current maximum severity is 0.

### Examples
- `ui_kits/console/` — Delivery Console recreation demonstrating Arena applied to a real internal product.

### Distribution
- Published as a copy-in reference kit and as a downloadable Agent Skill (`SKILL.md`).
- MIT License.

[1.0.0]: #
