# Third wave of the consumer API audit: implementation plan

Spec: [`../specs/2026-08-02-consumer-api-audit-wave-three.md`](../specs/2026-08-02-consumer-api-audit-wave-three.md).

Sixteen tickets, ten steps. Step 1 lands first because every other step cites it.

---

## Step 1 · The anchor doctrine

`contracts/api/README.md` states today that an anchor Arena draws is the browser's, and that
intercepting a plain click to substitute client-side routing belongs at the router. The half
about the payload stays: R4 holds, and no platform event travels. The half about who
intercepts is replaced by the modified-click convention, with the evidence for why the old
instruction was not executable: `RouterLink` decides by `tagName` and by `customElements`, and
an Angular component is neither, so a consumer composing it onto a component that draws the
anchor inside gets modifier keys ignored and a second tab stop on the host.

Four components draw an anchor, and each gets the same guard in both layers:

| Component | Reports through |
|---|---|
| `Card`, with `href` | `click` |
| `CommandPalette`, for a `Command` with `route` | `run`, after `close` |
| `Breadcrumbs`, for a `Crumb` with `href` | `navigate` |
| `SideNavItem`, with `href` | `nav`, through `SideNav` |

A primary click with no modifier is cancelled and reported. Anything else is left alone and
reports nothing. In the palette a modified click does **not** close: the reader asked for a
new tab and stays where they are.

No member changes. Four descriptions do, and `generate:api` carries them into both layers, so
no member doc is typed by hand. `Command.route`'s sentence *"run still fires, so a host that
routes in JavaScript needs no change"* is the one that produced the defect and is the one that
goes.

The `Don't` blocks in `Breadcrumbs.prompt.md` and `SideNav.prompt.md`, in both layers, say the
opposite of what the code will do; they are rewritten, and `Card.prompt.md` and
`CommandPalette.prompt.md` gain the same paragraph.

**Three assertions per component per layer**, one for each activation: primary click,
ctrl click, Enter. They are three different paths and today they disagree.

## Step 2 · `Table`

**`sortControl`.** A new enum type, `auto` and `none`, defaulting to `auto`. In card mode
`auto` draws one compact control above the cards listing every `sortable` column and its
direction. Above `--bp-md` the header row is the control and the member draws nothing. The
header row does not come back: card mode exists because a grid does not fit.

Both layers compose `Select`, the way the Angular table already composes `Pagination`. The
control emits the same `sortChange` carrying the same `TableSort`; there is no second channel.
`Table.manifest.json` gains the slots the bar needs.

`Table.behaviour.json`'s `card` case keeps binding `none`, and its reason gains the clause that
the sort control carries `Select`'s own binding, since the reason as written says the shape
holds no control at all.

**A warning for a positional column.** `Table` warns once, through the `warnOnce` shape
`DataVisuals` already uses, when `sort.column` names a column that declares no `sortable`.
Today that draws no caret and says nothing, which is the silent way to be misconfigured. A
suite assertion in both layers, and an example in `Table.prompt.md` of the idiom that survives
a column move: the sort field inside the column entry itself. No `columnKey`: that was refused
in the second wave with its reason, and the refusal stands.

**`TablePage.total`.** Its description claims to be the reset every consumer writes by hand.
The code resets only when the page has left the range. The description says which case it
covers and which it does not, and `Table.prompt.md` says that a change of filter criterion is
still the consumer's to reset. The rule itself does not change: resetting on every change of
total would move a reader who removed one row from page three of ten.

## Step 3 · `BulkActionBar`

A new enum type, `auto` and `inline`, and a `layout` member defaulting to `auto`. `auto`
measures its **own** container through `containerWidth()`, which takes an external element
since the second wave, and stacks when the row does not fit. The manifest gains the narrow
variant.

The suite assertion is the point of the ticket: DOM order and visual order do not diverge. The
consumer reordered with `order` over `nth-of-type` and lost the correspondence.

## Step 4 · `DoughnutChart`

**`legendLayout`.** A new enum type, `auto`, `inline` and `stacked`, defaulting to `auto`.
`auto` measures its container and stacks the concept over the figure when the row does not
give. The threshold is already declared: `chart.json` carries `legend-min` and `legend-max`,
and the chart already reads both. What is missing is the behaviour, not the value.

**`sliceActivate`.** An event carrying a number, and the number is the index **in `values`**,
never in the drawn paths. That distinction is the whole ticket: a zero-value slice draws no
path, so indexing the SVG means reproducing the omission from outside.
`DoughnutChart.prompt.md`'s line recording hover-only data as a still-open gap is replaced by
the member.

The three SVG charts carry no manifest, so no recipe moves.

## Step 5 · Tokens, and a third file in the composition layer

**`--z-sheet`.** `layering.json`, between `nav` and `dropdown`: a non-modal sheet sits above a
fixed bar and below a menu opened from inside it. The family declares the order and the value
only has to preserve it.

**A bar height.** `spacing.json`'s `layout` group, beside `sidebar`, and for the same stated
reason: it is example code, and therefore the number a consumer copies. A stack of toasts has
to know how tall a bar Arena does not draw is, so as not to sit under it.

**The safe area.** `env(safe-area-inset-bottom)` is not a DTCG value: DTCG models a dimension
as a value and a unit, and this is a derivation resolved at runtime, which is exactly the case
the layer contract already carves out. It goes to a third hand-authored file in the
composition layer, beside `colors.css` and its `color-mix` derivations. Three places wire it,
and each carries a claim to update: `intro/styles.css`, whose import count `CLAUDE.md` states
literally; `CSS_CHAIN` in the package assembly, so both npm packages carry it; and the
description of `--z-nav`, which is where a reader goes looking.

**A mono treatment outside a table.** `TableColumn.mono` does two things, the mono face and
the gold ink, and exists only inside a table. A total in gold inside a white card says
identifier, not amount, so the ink cannot simply be reused. The Tailwind layer gains a
hand-authored utility carrying the face and `tabular-nums` without the ink, beside
`Animations.css` and on the same precedent, shipped in the package CSS. `Table.manifest.json`
gains `tabular-nums` on its mono slots, which it does not carry today, so a column of figures
aligns by digit. `TableColumn.mono` is documented as that utility plus the ink.

## Step 6 · Two layer utilities

**`viewportBelow`.** It follows `readBreakpoint` exactly, which already lives at each layer
root with no contract, because a service is not a component and the contract layer is one file
per component. Angular returns a signal, React a boolean from a hook, both over `matchMedia`
on the value `readBreakpoint` already resolves, and both carrying the same warning when the
token does not resolve. Documented beside `containerWidth` in each layer README.

Safari's non-implementation of `@custom-media` is not reopened. What was missing is the
JavaScript route, which the consumer already has hand-written as eleven media queries over six
invented thresholds.

**Focus on `Input`.** None of the nine contract forms is imperative, so this is not a member:
it is a public method on the class, in both layers. The decision and its reason go in
`contracts/api/README.md`, since a reader who cannot find the member needs to know it was
weighed; the usage goes in each layer README. No `autoFocus`: it does not answer the case that
raised the ticket, which is returning focus after each completed sale so the next one is
typed without reaching for the mouse.

## Step 7 · Icons

A new gate reads the class names the installed Phosphor package actually defines and fails any
`ph-` name in the tree that is not one of them. Not an enum, which would be a list that ages,
and not a hand-typed set. It carries a reason map, its paired suite asserts that map by name,
and it joins `GATES` and the domain partition the gate's own suite asserts by literal value.

The active-state weight is not a member. The consumer concatenates a weight by hand because
Arena has the convention and does not apply it, and `SideNav` already knows which item is
active, so it draws that glyph in the filled weight itself. That is the second wave's lesson
applied again: correct the doctrine rather than add a boolean whose `false` nobody wants. The
decision goes in the description of `SideNavItem.icon`.

## Step 8 · The two cheap ones

`flex-wrap` on the `foot` slot of `Dialog` and of `ConfirmDialog`, with the variants assertion
`ChartCard` already received. It is the cheapest ticket in the report, and it ends the state
where the system's three action rows behave two ways.

`CommandPalette` gains `maxResults`: the ceiling belongs to the palette rather than to the
domain. The shortcut stays unbound, and that becomes explicit rather than implied: a global
key binding belongs to the host application, and a component taking one would fight it. The
contract says so and each layer's prompt gives the three-line host snippet. React's already
does; Angular's does not.

## Step 9 · The Tailwind coupling, said out loud

`PACKAGING.md` claims a consumer needs no Tailwind at all. What the compiled utilities save is
the **build**, not the coupling: `tailwind-variants` and `tailwind-merge` are runtime
dependencies of the Angular package, and every component's appearance is a class string from
the shared recipe layer. Arena is coupled to Tailwind for appearance the way it is coupled to
Phosphor for iconography. One travels as a peer dependency and the other as a runtime
dependency plus a layer of data moving one way, and both are part of the adoption contract.

It is stated in `PACKAGING.md`, in both `PACKAGE.md` files, which is the page npm shows and
the page `check:docs` reads, and in the paragraph of `CLAUDE.md` that already says what a
published Arena carries.

## Step 10 · Closing the wave

Build, so the generated tokens, the per-layer API types, the catalog, the recipes and the demo
siblings are all current, and commit the catalog, which is tracked because the plugin is served
from the tag.

Then the full sweep, once. Along the way the cheap gates run per commit: the four token gates
after touching the design layer, the dimension gate after touching a framework layer, the API,
behaviour and compliance gates after each new member, the manifest gates after each recipe, and
the new icon gate watched failing before it is watched passing.

Then the release: five surfaces and one tag, the version living in `plugin.json` and every
other surface agreeing with it, including the marketplace ref, whose omission fails silently.
The two packages take that version from the manifest and are published last, by the workflow.

Then the reply to the consumer: what was paid, what was deferred, what was left open, with the
reason for each, so the next audit does not ask again.
