# Changelog

All notable changes to Arena — Dravensoft Design System are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
