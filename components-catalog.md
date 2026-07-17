# Component Catalog — Gaps for the DAMA Migration

Working document for the agent implementing the next Arena version. It lists **every component and token Arena does not currently have** that a real consumer product (DAMA) needs, so that migrating DAMA to Arena requires **no guessing about the style of a missing component**.

- **Baseline compared:** Arena v1.0.0 (33 components) against DAMA's `apps/Frontend/src/app/shared/design/components` (17 components) plus the 17 Angular Material modules DAMA still consumes.
- **Reference implementation:** DAMA is Angular 21 + Tailwind v4 + `tailwind-variants`. Arena is React + inline styles reading CSS custom properties. **Do not copy DAMA's classes.** DAMA is evidence of *what* is needed and *which* values were chosen — the Arena implementation must be re-expressed in Arena's own idiom and tokens.
- **Status of every item below:** proposed, not approved. Each entry states what is decided by evidence and what still needs a design call.

## Before implementing anything

Repo rules from `CLAUDE.md` that apply to every item here:

- **Every component is a quartet**: `X.jsx` + `X.d.ts` (with `@startingPoint`) + `X.prompt.md` (usage, examples, Do/Don't) + an entry in the group's `*.card.html` demo. An item is not done until all four exist.
- **No CSS classes.** Inline `style` objects reading custom properties; hover/focus/active via local `useState`. `Button.jsx` is the reference shape.
- **No raw hex in components.** Define the daisyUI `--color-*` token first, alias below, then consume.
- **No gradients** (sole exception: `Skeleton`'s shimmer). **No emoji.** **English only.**
- **Danger is outline, never filled** — the only filled danger surface is the final confirmation in `ConfirmDialog`.
- Version moves in three places together: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, README header; log in `CHANGELOG.md`.

## Priority summary

| # | Item | Group | Arena today | Priority |
|---|---|---|---|---|
| 1 | Chart family (Bar, Line, Doughnut, ChartCard) | display | nothing | P0 |
| 2 | StatCard | display | `Card` only (generic) | P0 |
| 3 | Calendar / Scheduler | display | nothing | P0 |
| 4 | PageHead | navigation | nothing (title hardcoded in `Shell`) | P0 |
| 5 | Table responsive mode | display | `Table` has no mobile behavior | P1 |
| 6 | Spinner | feedback | `ProgressBar` + `Skeleton` only | P1 |
| 7 | ThemeToggle | forms | `theme.js` helper, no component | P1 |
| 8 | Input `type="date"` / `type="time"` | forms | `Input` unstyled for these types | P1 |
| 9 | SegmentedControl | navigation | `Tabs` + `Radio`, no segmented filter | P2 |
| 10 | List | display | nothing | P2 |
| 11 | Categorical color palette | tokens | nothing | P1 (blocks 1 and 3) |

---

## P0 — Blocking. No Arena equivalent; DAMA cannot migrate without inventing a style.

### 1. Chart family — `BarChart`, `LineChart`, `DoughnutChart`, `ChartCard`

**Why.** Arena ships no data visualization whatsoever; `ProgressBar` is the only quantitative element. DAMA's admin analytics and client/student summaries are chart-driven. This is the single largest gap.

**The important part is not the chart — it is the palette contract.** DAMA solved theme-reactive charting by reading CSS custom properties at runtime and recomputing when the theme flips. Charts draw to `<canvas>`, so they cannot inherit CSS; the tokens must be resolved to concrete values and handed to the chart library. Arena must own this contract or every consumer reinvents it.

Reference contract (DAMA `chart-tokens.logic.ts`), to be re-expressed with Arena tokens:

```ts
export interface ChartPalette {
  primary: string; success: string; warning: string; danger: string;
  text: string; textMuted: string; grid: string; surface: string;
}
export type ChartPaletteKey = keyof ChartPalette;

/** Resolve the palette from CSS custom properties. Re-runs when the theme changes. */
export function readChartPalette(read: (cssVar: string) => string): ChartPalette;
/** Series color by index, cycling CHART_SERIES_ORDER. */
export function seriesColor(index: number, palette: ChartPalette): string;
/** color-mix(in oklch, color N%, transparent) — for area fills. */
export function withAlpha(color: string, alphaPercent: number): string;
```

- Series cycle order: `primary → success → warning → danger → textMuted`.
- Every key must resolve from a token. `grid` maps to the divider/border token; there is **no** `--chart-grid` in Arena today — add it or alias to `--line`.
- Ship a **hardcoded fallback palette** for the case where `document`/`getComputedStyle` is unavailable (SSR, tests). This is the one sanctioned place for literal colors; it must mirror the dark theme, and Arena is dark-first (DAMA's fallback mirrors its light theme — do not copy those values).

Proposed component API:

```ts
export interface BarChartProps {
  title?: string;
  labels: string[];
  values: number[];
  seriesLabel?: string;
  colorKey?: ChartPaletteKey;        // single color for all bars, default 'primary'
  colorKeys?: ChartPaletteKey[];     // per-bar override, wins over colorKey
  valueFormatter?: (value: number) => string;
}
export interface LineChartProps extends Omit<BarChartProps, 'colorKeys'> {
  area?: boolean;                    // fill under the line at withAlpha(color, 18)
}
export interface DoughnutChartProps {
  title?: string; labels: string[]; values: number[];
  colorKeys?: ChartPaletteKey[];     // falls back to seriesColor(index)
  valueFormatter?: (value: number) => string;
}
```

Rendering values proven in DAMA (carry over unless there is a reason not to):

- `ChartCard` shell: extends the card surface, `display:flex; flex-direction:column`, small gap; title rendered as an uppercase muted label, not a heading; canvas wrapper `position:relative; height:280px; width:100%`.
- Bars: `borderRadius: 6`. Line: `tension: 0.3`, `pointRadius: 3`. Doughnut: `borderWidth: 0`.
- Axis/grid/legend/tooltip colors all come from the palette — no library defaults.

**Decision needed:** which chart library, or none. DAMA uses Chart.js via `ng2-charts`. Arena has no build and no `package.json`, and its components load from esm.sh in demos — **a bundled chart dependency conflicts with the copy-in kit model.** Options: (a) depend on Chart.js as a documented peer, like Phosphor icons are today; (b) ship dependency-free SVG charts. Resolve this before writing code; it changes the whole implementation.

**Do / Don't**
- Do resolve colors through the palette and recompute on theme change.
- Don't hardcode series colors in the component or let the library pick defaults.
- Don't put the chart title in an `<h*>` — it is a label, and the surrounding `Card` owns the heading.

---

### 2. `StatCard`

**Why.** `Card` is a generic surface (`title`/`eyebrow`/`action`/`floating`/`accent`). The KPI tile — label, big number, signed delta — is the most repeated block in any dashboard and has no Arena expression, so every consumer invents its own delta pill colors.

```ts
export interface StatDelta {
  sign: 'up' | 'down';
  value: string;                     // preformatted, e.g. "+12%" — the component does not compute it
}
export interface StatCardProps {
  label: string;
  value: string;                     // preformatted
  delta?: StatDelta;
  sub?: string;                      // secondary caption under the value
  icon?: React.ReactNode;
}
```

Reference styling from DAMA:

- Root extends the standard card surface; `min-height: 120px`; column flex with a tight gap.
- Header row: `label` (uppercase small label token) and `icon` pushed apart via `space-between`; icon at ~14px, `opacity: .6`, muted.
- Value: display font, large numeric, `font-variant-numeric: tabular-nums`, no margin.
- Delta pill: `align-self: flex-start`, fully rounded, `padding: 2px 8px`, `font-size: 12px`, `font-weight: 600`.
  - no delta / neutral → neutral surface + muted text
  - `up` → `--success-soft` background, `--success` text
  - `down` → `--danger-soft` background, `--danger` text
- Sub: small muted text.

**Note on the danger convention.** The `down` pill is a *soft-filled* surface, which is how DAMA renders it. Arena's rule is that **danger is outline, never filled**. A down-delta is a neutral fact, not a destructive action, so the rule arguably does not apply — but this is a genuine judgment call. Decide it explicitly and record the outcome in `guidelines/components-danger.html`; do not let it be settled silently by whoever writes the JSX.

---

### 3. `Calendar` / `Scheduler`

**Why.** No calendar, and no date primitive of any kind, exists in Arena. This is the largest single implementation and the one where a consumer is most likely to bolt on a third-party widget and skin it by hand — which is exactly what DAMA did (FullCalendar plus a dedicated `fullcalendar-overrides.css` file of `.fc-*` rules). That override file is the evidence: the design system left a hole and the product patched it downstream.

Reference behavior from DAMA:

```ts
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;                     // ISO datetime
  end: string;
  color?: string;                    // see the categorical palette, item 11
  meta?: Record<string, unknown>;    // rendered by renderEvent
}
export interface CalendarProps {
  events: CalendarEvent[];
  anchorDate?: string;               // ISO date the view is centered on
  view?: 'week' | 'day';             // omit to derive from viewport
  timeZone: string;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (isoDate: string) => void;
  onRangeChange?: (delta: number) => void;
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
}
```

- **Toolbar** (Arena must own this; FullCalendar's built-in header is disabled in DAMA): prev icon-button, "Today" stroked button, next icon-button, then the current range title in semibold, then a right-aligned actions slot.
- **View switching is viewport-driven**: week grid on desktop, single-day grid below 768px. DAMA hardcodes that breakpoint rather than using its CDK `Handset` observer — worth aligning with whatever breakpoint token Arena adopts, since Arena currently defines none.
- **Time grid**: `nowIndicator` on; no all-day row; `slotMaxTime` 23:00; `slotMinTime` computed from the earliest event (defaulting to 08:00) so empty morning hours are not rendered; Sunday hidden unless an event falls on it; week starts Monday.
- **Event body**: title line, then `HH:mm – HH:mm`, then optional detail lines. DAMA gates the detail lines behind a "show details" toggle in the toolbar — that toggle is product policy, not a system concern; expose `renderEvent` and let the product decide.
- Screenshot-to-PNG export in DAMA's calendar is **product-specific** — do not port it.

**Scope warning.** This is the item most likely to be underestimated. Consider shipping it in a later minor than items 1, 2 and 4, rather than blocking the release on it. If Arena wraps a third-party calendar, the wrapper still has to own the toolbar, the event body and every color, or the gap simply reopens in the next consumer.

---

### 4. `PageHead`

**Why.** `Shell.jsx` hardcodes the page title inside its own `<header>`, so it is unusable outside the shell and unstylable by the page. Every dashboard page needs the same title/subtitle/actions band. Cheapest P0 by far.

```ts
export interface PageHeadProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}
```

- Root: `display:flex; align-items:flex-start; justify-content:space-between`, gap 16px, bottom margin 20px.
- Below the small breakpoint: stack to a column, stretch, and let the actions row span full width.
- Title: `h1` token. Subtitle: small muted, ~2px top margin, no bottom margin.
- Actions: horizontal flex, 8px gap, wraps.

Refactor `Shell.jsx` to compose `PageHead` in its header instead of duplicating the markup.

---

## P1 — Arena has an adjacent component that is insufficient; specified as an extension.

### 5. `Table` — responsive mode

`TableProps` today is `columns`/`rows`/`getRowKey`/`onRowClick`/`empty`. There is no mobile behavior at all, so a table either overflows or gets wrapped by the consumer. DAMA had to build a separate `app-responsive-table`; the better move for Arena is to extend `Table` rather than add a second component.

```ts
export interface TableColumn<T = any> {
  // …existing fields…
  mobileLayout?: 'row' | 'block';    // 'row' = label/value pair (default); 'block' = full-width, no label
}
export interface TableProps<T = any> {
  // …existing fields…
  responsive?: boolean;              // default true
}
```

Below the breakpoint, render one card per row instead of a table:

- Card list: column flex, 16px gap.
- Card: card surface, hairline border, small padding, column flex with tight gap.
- `row` columns: `justify-content: space-between`, header text on the left as an uppercase muted label, value right-aligned and allowed to shrink (`min-width: 0`).
- `block` columns (typically the actions column): full width, right-aligned, separated by a top hairline divider and ~8px top padding.

**Prerequisite:** Arena defines no breakpoints. Pick one and add it to `tokens/` — items 3, 5 and 7 all depend on it, and today each would invent its own.

---

### 6. `Spinner`

`Skeleton` covers layout-reserving loads and `ProgressBar` covers measurable progress, but there is no circular indeterminate indicator — the right choice for in-button and in-dialog waits where no layout can be reserved and no percentage exists. DAMA uses one in 6 places (login, recharge, subscription, mark-attendance, pay-classes, confirm dialog); all 6 would otherwise guess.

```ts
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'accent' | 'gold' | 'neutral' | 'on-accent';   // 'on-accent' for use inside a filled button
  label?: string;                                        // accessible name; defaults to "Loading"
}
```

- Reuse `ProgressBar`'s tone vocabulary so the two feel like one family.
- Must honor `prefers-reduced-motion` (see `Skeleton`, which already does).
- Needs `role="status"` and an accessible name; a spinner with no name is invisible to screen readers.

---

### 7. `ThemeToggle`

Arena already ships both themes and the `theme.js` helper, but no component — so the button gets rebuilt per product, and the icon and the a11y wiring get re-guessed each time. Closing this is cheap and it makes the two-theme story feel finished.

```ts
export interface ThemeToggleProps {
  label?: (isDark: boolean) => string;   // accessible label; sensible default
}
```

- Icon button built on `IconButton`; sun icon when dark is active, moon when light.
- Must set `aria-pressed` to the current dark state — DAMA's does, and it is the part most often missed.
- Reads and writes through `theme.js`; the component owns no theme state of its own.

---

### 8. `Input` — `type="date"` and `type="time"`

Worth stating plainly because it is counterintuitive: **DAMA does not use a datepicker component.** It uses native `<input type="date">` and `<input type="time">` inside a Material form field. So Arena does **not** need to build a DatePicker for this migration — it needs `Input` to not fall apart on those types.

- Verify label, focus ring, error and valid states render correctly for `date`/`time`/`datetime-local`.
- Style `::-webkit-calendar-picker-indicator` for the dark theme — the default indicator is near-invisible on `--color-base-100`. This is the concrete failure a consumer hits and then patches locally.
- Document in `Input.prompt.md` that native date/time inputs are the sanctioned approach and a custom DatePicker is deliberately not part of Arena.

A real `DatePicker` / `TimePicker` is a legitimate future addition, but **it is not required by this migration** and should not be scoped in on the assumption that it is.

---

### 11. Categorical color palette (tokens)

Listed last in the table but it **blocks items 1 and 3** — implement it first.

Arena's tokens are entirely semantic (brand, status, neutrals). There is no palette for coloring *N arbitrary entities* — the calendar needs a stable color per course, charts need series colors beyond the four semantic ones, and DAMA's `course-color-chip` needs a dot color per course.

DAMA's solution violates Arena's core rule: it hashes the entity id and returns `hsl(hue, 65%, 55%)` with an arbitrary hue — a raw color, outside the token layer, unaware of theme, and with no contrast guarantee against either base. **Do not port this.** It is documented here as the requirement it reveals, not as a design to copy.

What Arena should provide instead:

- A bounded categorical ramp as tokens (`--color-cat-1` … `--color-cat-8` or similar), authored per theme like every other color, each verified for contrast on `--color-base-100` and `--color-base-200`.
- A documented mapping helper — stable id → index → token — so the same entity keeps its color across sessions and views.
- Reconcile with `CHART_SERIES_ORDER` (item 1): series colors and categorical colors should be one system, not two.

**Decision needed:** ramp size, and hue ordering against a crimson/gold brand (a categorical ramp that wanders into crimson will read as an error state). This is a real design problem, not a mechanical addition.

---

## P2 — Low. Small usage in DAMA; include only if the release has room.

### 9. `SegmentedControl`

Two usages in DAMA (`mat-button-toggle`). `Tabs` is for navigation between views and `Radio` is a form control; neither is right for a compact inline filter. Proposed: `options: {value,label}[]`, `value`, `onChange`, `size?: 'sm'|'md'`. Keep it visually distinct from `Tabs` or the two will be confused.

### 10. `List`

Two usages (`mat-list`: the dashboard nav and a dialog). Both are arguably better served by existing pieces — the nav by `Shell`'s own nav, the dialog by plain markup. **Recommendation: skip.** Documented so the next audit does not re-flag it as an unexplained gap.

---

## Out of scope — domain compositions, not system components

These DAMA components must **not** become Arena components. They are product concepts composed from primitives, and adding them would push DAMA's domain into a general-purpose language. Listed so an agent reading this does not mistake them for gaps:

| DAMA component | Composed from | Note |
|---|---|---|
| `camera-scanner` | Card + Spinner + ErrorState | QR attendance scanning; product-specific |
| `qr-card` | Card + heading/caption tokens | The QR bitmap needs a permanently white plate regardless of theme — a legitimate token question (a "media plate" surface), not a component |
| `course-color-chip` | dot + label | Needs the categorical palette (item 11); the chip itself is trivial |
| `group-select` | Select + data fetching | DAMA's smart/dumb container split; product-specific |

The only system-level requirements hiding in this table are the **white plate surface** for QR/media and the **categorical palette**.

---

## Already covered — do not re-implement

Verified equivalents; a migration maps these directly:

| DAMA | Arena | Note |
|---|---|---|
| `empty-state` | `EmptyState` | direct |
| `error-state` | `ErrorState` | direct |
| `tag` | `Tag` | DAMA's 5 tones (neutral/primary/success/warning/danger) should be checked against `Tag`/`Badge` — DAMA drives them from one shared recipe, and a `tone` prop on `Tag` may be the only delta |
| `loading-skeleton` | `Skeleton` | direct; both honor reduced motion |
| `paginator` | `Pagination` | DAMA's is index-based (`currentIndex`/`maxIndex`), Arena's is page-based (`page`/`pageCount`) — an adapter, not a gap |
| `field-error` | `Input.error` / `validate` | Arena's is the richer contract |
| confirmation dialog | `ConfirmDialog` | direct |
| toolbar + sidenav | `ui_kits/console/Shell` | see item 4 |
| toast notifications | `Toast` | direct |
| callout / inline alert | `Alert` | direct |

## Suggested release split

- **Next minor:** items 11 (palette, first), 1 (charts), 2 (StatCard), 4 (PageHead), 5 (Table responsive + a breakpoint token), 6 (Spinner), 7 (ThemeToggle), 8 (Input date/time). This unblocks every DAMA screen except the schedule.
- **Following minor:** item 3 (Calendar), which is large enough to slip a release on its own and carries an unresolved dependency question.
- **Open decisions to settle before coding:** chart library vs. dependency-free SVG (item 1); down-delta pill vs. the danger convention (item 2); breakpoint tokens (items 3, 5, 7); categorical ramp size and hue ordering (item 11).
