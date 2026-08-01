# Second wave of the consumer API audit

## Context

The first wave paid what was cheap and uncontested in the consumer audit. What is left is
the expensive half and the half that needed a decision: sorting and paging on `Table`,
number formatting and geometry on the charts, a badge on `SideNavItem`, groups and routes on
`Command`, a real link on `Card`, the categorical helpers on `DataVisuals`, the actions row,
and the breakpoints a consumer cannot name from CSS.

Every claim in the report was verified against the tree before it was accepted. Four of them
do not survive, and this plan corrects them rather than executing them:

| Claim | What the tree says |
|---|---|
| `BarChart`'s accessible table prints the raw value with no `valueSuffix` | False. `BarChart.ts` computes `` value: `${value}${suffix}` `` and the table renders `bar.value`; the React layer applies the same `fmt`. The three accessible tables already agree. |
| `PageHead` does not wrap its actions row | False as a diagnosis. Both layers already wrap: React carries `flexWrap: 'wrap'` inline and `PageHead.manifest.json` carries `flex-wrap` on the `actions` slot. The real defect is elsewhere, and is in step 6. |
| The orphan header in the empty state is the component's | Partial. It is Angular's alone: the React layer draws a real `<td colSpan>` inside the `<tbody>`. The fix differs per layer. |
| Emit the breakpoints as `@custom-media` | Not shippable. Safari implements none of it, and Arena serves its generated CSS to a browser directly, so a consumer without PostCSS who writes `@media (--below-md)` gets a query that never matches, silently. Step 2 replaces it. |

Three decisions were taken rather than derived: `Table` goes as far as paging, `Card.href`
enters and pays for the machinery it needs, and `SideNav.activeMatch` is refused with its
reason written into `SideNav.prompt.md`.

**CLAUDE.md is 75 characters from its limit, and this wave adds no rule to it.** Everything
new has a home that fails when it stops being true: a layer README, a gate's own reason
string, a component's `.prompt.md`, a suite assertion. A rule that fits nowhere else buys its
space by moving the Angular primitive and host-binding tour into
`frameworks/angular/README.md`.

---

## Step 1 · The token layer

`contracts/design/effects.json` gains a `tint` group, `$type: "number"` carrying a `%` render
hint the way `typography.json`'s `tracking` carries an `em` one, and script-readable because
both consumers build a `color-mix()` string in JS:

- `area: 18`, the tint `LineChart` already draws in both layers and today writes as a literal.
- `soft: 12` and `edge: 26`, the surface and hairline of a categorical identity. Their reason
  goes in the `$description`.

`cssCounterpart()` in `scripts/check/arena/check-script-tokens.mjs` accepts `px` and `ms`
only, so a percentage fails the gate as "not a bare number". Widen it, and widen
`check-script-tokens.test.mjs`, which asserts on that function.

`contracts/design/spacing.json`'s `bp` description names `UseContainerWidth.js`; the file is
`UseContainerWidth.ts`, and that description reaches the generated CSS.

## Step 2 · Breakpoints a consumer can name from CSS

A media query condition holds no `var()`, which is why `check-tailwind-coverage.mjs` exempts
`bp-*` today with "read by JS through getComputedStyle, never a media query". A **generated
literal** works, in every browser, and cannot drift from the token it came from.

A generator under `scripts/generate/tailwind/` writes
`frameworks/tailwind/Breakpoints.generated.css`, a `@theme` block declaring
`--breakpoint-sm`, `--breakpoint-md` and `--breakpoint-lg` from the `bp` group, with
Tailwind's own defaults cleared first the way every other namespace in `Theme.css` clears
them. `Theme.css` imports it. The file is untracked under the one `frameworks/` pattern and
takes its reason in `UNTRACKED`. The three exemption lines in `check-tailwind-coverage.mjs`
change, because their reason does.

## Step 3 · `containerWidth` takes an optional element

`containerWidth()` measures the host of whoever calls it, which limits it to a component's
own root. It takes an optional `ElementRef` and still requires an injection context, for
`DestroyRef` and `afterNextRender` rather than for `ElementRef`. `useContainerWidth()` takes
an optional external ref for the same reason. The `PageHead` assertion that pins the old
behaviour states two things and only the first stays true, so it is rewritten.

## Step 4 · `DataVisuals`

Three helpers, in both layers, and none of them a member of any contract:

- `catSlotFor(key)`, a stable spread over `CAT_SLOTS` and never over a literal 8, identical in
  both layers.
- `catSurface(slot)`, returning the fill and border of an identity surface from the step 1
  tints.
- `toneColor`, widened from `SeriesTone` to `Tone`. The three missing tones take what `Badge`
  already draws, read from its manifest rather than invented, and the React return type
  converges on the Angular one.

`LineChart` reads `tintArea` instead of interpolating `18%`. `ProgressTone` does not gain
`warning`: its own description says why it has none.

## Step 5 · The charts: numbers and geometry

`NumberFormat` is a predefined object of four primitive fields (`locale`, `fractionDigits`,
`grouping`, `compact`), so R1 holds and the ninth form stays where it belongs.
`Intl.NumberFormat` implements all four in both layers with no dependency.

- All three charts gain `valuePrefix` and `valueFormat`.
- `LineChart` and `BarChart` gain `minPointSpacing`, which has no default because absent is
  today's behaviour, and `height`, which defaults to the `chartHeight` token.

Below `minPointSpacing` the chart stops compressing and overflows horizontally, anchored to
the most recent point, computing its own minimum width from its own `PAD` so no consumer has
to rediscover them. A scrolling box with no tab stop is a keyboard trap, and Arena has the
precedent already: `DoughnutChart` records `keyboard.legend-reachable` as an `additions`
entry for its scrolling legend. `LineChart` and `BarChart` take the equivalent entry in both
layers. The three SVG charts keep no manifest and no `.variants.ts`, and their static styling
stays camelCase `[style]` objects, which is the shape `check:dimensions` can judge.

One assertion per chart per layer: a value, a locale and a prefix produce the same string in
the axis tick, the tooltip and the accessible table. It corrects no inconsistency, because
there is none; it is the guard the new members need.

`ChartCard` gains no member. Its inner padding stops being an internal a consumer depends on
without knowing once `minPointSpacing` exists, and that is recorded in its `.prompt.md`.

## Step 6 · The actions row

The verified defect: `PageHead.prompt.md` tells a consumer to hold every button in one
`actions` wrapper. That wrapper is a single flex item inside the row that does wrap, so the
wrap can never fire. `ChartCard` wraps in neither layer.

The Do/Don't inverts: one control per projected element, each carrying `actions`, because
Arena's row is the wrapping row. `ChartCard` gains `flex-wrap` on its actions slot and on its
head row, in the manifest and in the React inline styles, and its variants suite asserts it.
No `actionsWrap` member: a boolean whose `false` nobody wants is not a member.

## Step 7 · `Table`: sorting, paging and the empty state

Three new types: `SortDirection` (`asc`/`desc`, since `Direction` is a delta's arrow and not
an order), `TableSort` and `TablePage`. `TableSort` names a column by **index**, because
`Table`'s cells are already positional, which keeps a required `key` field off `TableColumn`.

- `TableColumn.sortable`, a declared boolean rather than "is `sortChange` bound?", which is
  R6 and the `TableRow.interactive` precedent.
- `Table.sort` and `Table.sortChange`. `Table` never reorders: it does not hold the rows. It
  draws the affordance, sets `aria-sort` on the columnheader and emits.
- `Table.page` and `Table.pageChange`. Present, `Table` draws its own `Pagination` below the
  grid, names it from `label`, which is what gives that required name its uniqueness, and
  returns to page 1 whenever the row count changes.
- `Table` declares `hover` alongside `focus`, because a sortable header reacts to the pointer.

A header is already a `columnheader` on the roving tab stop, so activating it with Enter and
Space adds no tab stop and the `grid` pattern still holds with no exception.
`contracts/behaviour/grid.json` does not ask for `aria-sort` and is not touched: `requires` is
a flat map, so adding the key would oblige every component that binds `grid`. The `aria-sort`
is asserted in `Table`'s own suites.

With zero rows neither layer draws a grid: no header row and no `role="grid"`, only the empty
block. It is the `Tabs` precedent, where an invalid degenerate render is worse than an absent
one, and it converges two layers that diverge today. `Table.behaviour.json` gains an `empty`
case bound to `none` in both layers, and because `assertPatternCases` compares the declared
names before anything mounts, both suites gain that case's thunk in the same commit. Both
layers' cursor model starts at the header row, so both grid suites move with it, counting
presses over the small explicitly sized fixture they already use. The stale clause in each
layer's `Table.prompt.md` is replaced by the assertion.

## Step 8 · `SideNavItem.badge`, and `activeMatch` refused

`badge` is a count after the label: zero draws nothing, above 99 reads `99+`. It is cheap in
both layers, because `SideNavItem` projects nothing at all.

`activeMatch` is refused, and the reason goes into `SideNav.prompt.md` in both layers.
`SideNav.active` is contracted as the id of the current destination, and `activeMatch` would
reinterpret that same member as a path compared against each item's `href` depending on its
own value: a member that changes what another member means, and that nothing can check. What
was expensive on the consumer's side is the router bridge, which stays theirs either way.

## Step 9 · `Command.group` and `Command.route`

`group` heads a command's section and `route` says where running it goes. Rows group under
`role="group"` with an `aria-label`, which is the grouping a listbox admits, and commands with
no group list first. With `route` the row renders an `<a href>` and keeps `role="option"`: it
announces as an option, and ctrl-click, middle-click and open-in-new-tab work, which is what
an accelerator over a list of destinations owes a user. Both trade-offs go in
`CommandPalette.prompt.md`.

No scoring formatter and no configurable ranking: either would be a `functionInput` in a
contract that declares no `kind: "input"`.

## Step 10 · `Card.href`

`Card` holds two `<ng-content>` elements, which is what `Table.prompt.md` documents as
impossible across two branches; `SideNavItem` escapes it only because it projects nothing. The
way out is one `<ng-template>` holding both projections, instantiated by whichever branch
renders. No other site in the layer does this: `Menu` and `Tooltip` keep their `<ng-content>`
outside the template.

**The risk is proved before the component is written.** A suite renders a `Card` with
projected content and no `href`, asserts the content is there, sets `href` at runtime and
asserts the content is still there, now inside the `<a>`. If Angular does not re-project
across the re-instantiation, the failure is loud there and the decision is retaken with
evidence rather than shipping a silent one.

`href` present renders a real `<a>` with no `role="button"` and no synthetic key handler,
since activation is the browser's; with `disabled` it reflects `aria-disabled` and refuses
activation, the `SideNavItem` shape. `Card.behaviour.json` gains a `link` case bound to
`none`, on the reason `SideNavItem.behaviour.json` already states: there is no link pattern to
bind, and that is not an omission.

## Step 11 · Documentation sweep

For every component this wave touches, run the grep `DOUBTS.md` prescribes and read every
hit, dropping by hand the ones under the component's own files and the ones in
`CHANGELOG.md`. File the wave under `## [Unreleased]`.

---

## Verification

Each step runs its own cheap gates: `check:tokens` and `check:script-tokens` after the token
layer, `check:tailwind` and `check:coverage` after the preset, `check:api`,
`check:behaviour`, `check:compliance` and `check:states` after every contract change, and
`build:demos` in the same tree as any `.tsx` edit, because a demo page loads the sibling and
not the source.

Once, at the end, `ARENA_CHECK_STRICT=1 bun run check`, so a missing browser or builder is a
hard failure rather than a quiet `INCOMPLETE`.

By hand, in a real browser, what no suite reaches:

1. A sortable header activates on Enter and on Space without adding a tab stop, its
   `aria-sort` changes, and with zero rows there is neither a header nor a grid.
2. A `Card` with `href` opens in a new tab on middle-click and ctrl-click, and its projected
   content sits inside the `<a>`.
3. A `LineChart` with `minPointSpacing` in a 390px container overflows rather than
   compressing, starts anchored to the most recent point, and its rail is reachable and
   scrollable from the keyboard.
4. A `ChartCard` with a title and three buttons at 390px wraps, and nothing overflows.
