# Changelog

All notable changes to Arena — Dravensoft Design System are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
