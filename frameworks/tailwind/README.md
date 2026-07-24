# Arena — Tailwind layer

A framework-neutral Tailwind v4 consumption layer for Arena. It is **shared**,
not per-framework: the token→utility mapping is pure CSS and a component's
Tailwind recipe is data (slots, variants, class strings), so React, Angular,
or a `tailwind-variants` recipe all consume the same files. The thin binding —
how a class string reaches the element — lives in each `frameworks/<fw>/` folder.

## It derives from tokens; it adds no value

Every utility here resolves to an existing Arena token via `var()`. There is no
new hex and no new value in this folder. Re-skin Arena by swapping
`tokens/palette.css`; these utilities re-skin with it.

## What the preset exposes

Every token in `tokens/palette.css`, `typography.css`, `spacing.css` and
`effects.css` reaches a utility, except seventeen that cannot — `--sp-0` (`p-0`
is a literal `0px` in v4), the three `--bp-*` (read by JS, never a media
query), the three `--dur-*`, the six `--loop-*`, and the two `--bw-*` and the
two `--focus-*` (v4 has no namespace for any of the five). Those seventeen are
listed with their reason in `EXCLUDED` in `scripts/check-tailwind-coverage.mjs`,
and that gate fails the build if a token is added and reaches nothing.

`tokens/colors.css` is excluded as a category. Its aliases (`--crimson`,
`--mute`, `--danger-soft`, `--text-strong`…) alias tokens the preset already
exposes; a second utility name for the same colour is a second way to be
wrong. Reach one as `bg-[var(--danger-soft)]` when you genuinely need it.

Two naming notes: the density keys take the token's suffix verbatim, so
`--dz-row-py` is `py-row-py`; and `--container-max` is exposed as
`--container-page` (`max-w-page`) because a key named `max` shadows
Tailwind's built-in `max-w-max`.

A theme key is not bound to one axis. `--dz-ctl-h` is exposed as the `--spacing-ctl-h`
key, so it reaches `h-ctl-h` **and** `w-ctl-h` / `min-w-ctl-h` — an icon-only control can
combine all three to come out exactly square at the control height. That is one
token reaching three utilities, not a new value; the coverage gate counts the token,
not the utilities it reaches.

## The animations that live in CSS, and why

`animations.css` holds the `@keyframes` and the utilities that ride them —
`arena-shimmer` (Skeleton), `arena-pop` (Dialog), `arena-menu` (Menu),
`arena-fade` (Tooltip), `arena-prog-indeterminate` (ProgressBar),
`arena-btn-spin` (Button) and `arena-spinner` — because a manifest holds class
names and keyframes are not one. That file's own header is the normative list;
if it and this paragraph ever disagree, the file wins. It is the same boundary React
already has: an inline style object cannot express keyframes either, so React
injects a `<style>` once per component. Every value in it is a `var()` into a
token, and each animation answers `prefers-reduced-motion` on its own terms —
decorative motion stops, motion that reports work slows.

## Arbitrary values are a build failure

`bun run check:arbitrary` fails on any bracket carrying a raw literal —
`text-[13px]`, `bg-[#b52a20]`.

Three shapes are legal, and nothing else. A `var()` into a token
(`border-[length:var(--bw)]`). A **derivation** of tokens — a `calc()`, `min()`,
`max()` or `clamp()` whose operands are tokens, zeros and multipliers
(`text-[length:calc(var(--avatar-md)*0.4)]`), which is the same rule
`CLAUDE.md` states for an inline style: a dimension is a token *or a derivation
of tokens*. And a single value in a unit the token layer does not model —
`max-w-[42ch]`, `max-w-[92vw]`, `w-[62%]`, `rotate-[120deg]` — because DTCG
admits only `px` and `rem` in a dimension, so there is no token to reference and
inventing one would be worse than the literal.

`px`, `rem`, `ms` and `s` are **not** in that set: tokens model those, so
`text-[13px]`, `duration-[200ms]` and `w-[calc(var(--sp-4)+8px)]` all still fail.
If a manifest needs a value with no token behind it, the token is what is
missing — add it to `tokens/src/` first.

<!-- check-arbitrary-values allow: text-[13px] bg-[#b52a20] duration-[200ms] w-[calc(var(--sp-4)+8px)] -->

**A `transition-[...]`/`duration-[...]` pair is one duration for every listed
property.** `Button.jsx` transitions `background` and `transform` at `--dur-fast`
but `box-shadow` at the slower `--dur-mid` — React can do that because each CSS
property gets its own line in the `transition` shorthand. `Button.manifest.json`'s
`duration-[var(--dur-fast)]` cannot: Tailwind's `duration-` utility sets one
`transition-duration` for the whole `transition-property` list, and there is no
second `duration-` utility to layer on for just one property. Expressing the
split would mean writing the whole `transition` declaration as one raw arbitrary
**property** (`[transition:background_var(--dur-fast)_var(--ease-out),…]`,
no `utility-` prefix) — a fourth bracket shape outside the three this file
documents, so it stays undone rather than reached for quietly: Primary's hover
shadow arrives about 100ms early against React, left as known debt.

The gate scans `.md` too, because a `.prompt.md`'s Don't block is exactly
where a bad example belongs, and an unflagged one is a bad example someone
copies into a manifest. The marker above is the one legal escape: an HTML
comment, invisible in rendered markdown, naming exactly the classes it
exempts — `text-[13px]`, `bg-[#b52a20]`, `duration-[200ms]` and
`w-[calc(var(--sp-4)+8px)]`, the counterexamples this section uses. A class
this file carries that no marker names still fails;
a marker naming a class the file no longer carries fails too, as a stale
allowance. The marker is honoured in `.md` only — found in any other
extension, it is itself a failure.

## Consumption order

1. Bring Arena's tokens into scope — `@import "../../styles.css";` (or the
   individual `tokens/*.css`).
2. `@import "./theme.css";` — the Tailwind `@theme` preset.
3. Consume a component manifest from `./components/<Component>.manifest.json`.

## What ships here

`components/` holds **38 manifests**, one per component, each with a specimen page
beside it that renders the real markup from the real recipe with no build step. Seventeen
have an Angular primitive consuming them; twenty-one do not, and what holds those up is
`bun run check:tailwind` — every class a manifest declares must produce a rule, so a
manifest with no consumer cannot rot silently. `SideNav` is the odd one in that second
group: Angular consumes it through Material's `mat-nav-list`, dressed by
`arena-material.css`, rather than through an `arena-*` primitive.

**The three SVG charts and Calendar have no manifest, on purpose.** `BarChart`,
`LineChart` and `DoughnutChart` are SVG geometry driven by measured container width:
their identity is path data and attribute bindings, and a manifest that tried to hold it
would be a lie about where the styling lives. `ChartCard` is not one of them and does
have a manifest — it is a bordered tile. Calendar is date arithmetic and JS responsive
branches; what a manifest could capture is a fraction of it, and that fraction would
drift from the rest.

`utilities.css` is **generated** — `bun run build:tailwind` compiles the preset with
the manifests as content, and `bun run check:tailwind-generated` fails when the
committed file and the source disagree. It exists so a static specimen page can render
a manifest without a build step; do not edit it. The same build also emits a
`<Component>.manifest.ts` (`as const`) beside each `<Component>.manifest.json`; the
JSON stays the single source of truth and the `.ts` is generated output, so a new
manifest needs a `bun run build:tailwind` before the gates pass.

**A variant name is scanned as a class name.** Tailwind reads a manifest as raw text, so
a variant *name* that collides with a utility (`visible`, `block`, `line`, `fixed`,
`static`…) leaks a dead rule into `utilities.css`. It is harmless per instance and
accumulates across the set; `BulkActionBar` hit it with `visible` and the layer settled
on `open` as the shared name for a shown/hidden boolean. Name variants with that in mind.

**`compoundVariants` are unusable here**, for two independent reasons: the
`classesFor()` helper every specimen uses throws on a manifest carrying them by design,
and the generated `manifest.ts`'s `as const` makes the array a readonly tuple that
`tailwind-variants` rejects, failing `check:angular`. Model the same thing as a plain
boolean variant.

## Three consumption paths

- **Raw `className`** — read `slots`/`variants` and concatenate the strings yourself.
- **`tailwind-variants`** (Angular/DAMA) — feed the manifest straight into `tv({ slots, variants, defaultVariants })`.
- **`cva`** — map `variants`/`defaultVariants` onto a `cva` config.

## Invariants the manifests must reproduce

- **Danger is outline** — `border` + `text` in `--error`, transparent fill; a
  filled danger surface is reserved for `ConfirmDialog`'s final confirmation.
- **Focus is the gold ring.** No gradient utilities. Uppercase is reserved for
  micro-labels. Charts carry identity (`--color-cat-*`) or meaning (status),
  never both.

Authoring a manifest for a component whose React source uses a value not yet in
a token is a spec violation — add the token first, then reference it here.

## A state modifier always outranks a variant on the same property

Hover, focus and disabled are Tailwind state modifiers (`hover:`, `focus-within:`,
`disabled:`), never variants — that is what lets a static specimen render one
variant combination and be right without a browser interaction driving it.

The corollary matters just as much: **a state modifier beats a plain variant
class on the same property, always**, both on specificity — a pseudo-class adds
a selector, so `focus-within:border-secondary` compiles to `(0,2,0)` against a
variant's plain `border-error` at `(0,1,0)` — and on source order. A state
modifier left on a slot's **base** string therefore leaks through every variant
built on that slot, including the ones that must lose to it. `Input.manifest.json`
shipped exactly this: `focus-within:border-secondary` / `focus-within:ring-secondary/16`
sat on the base `field` slot, so all three `state` values (`neutral`, `error`,
`valid`) inherited it. `error`'s own `border-error`/`ring-error` are plain classes
with lower specificity, so focusing an errored field always turned it gold —
the validation signal disappeared exactly when the user tried to fix it, even
though React's own precedence (`shownError ? danger : focus ? gold : isValid ?
success : …`) says error must win.

The fix: move the `focus-within:` classes off the base and into the specific
variant branches that are allowed to lose to them (`neutral` and `valid` here —
both correctly turn gold on focus, matching React), and leave the branch that
must win (`error`) with no focus-within rule to compete against, so its plain
class holds regardless of focus. Read the React source's state-precedence
ternary before writing the manifest — its order **is** the override order a
state modifier is allowed to have, and the base slot is only a safe place for a
modifier every variant branch is willing to lose to.

## Two classes at equal specificity are ordered alphabetically, not by manifest order

Tailwind emits same-specificity utilities sorted by value inside each property
bucket, so `bg-transparent` always compiles after `bg-primary/14` and
`text-base-content/82` always compiles after `/62`, whatever order the
manifest declares them in or however sensible the manifest's own ordering
looks. When a base slot and an additive modifier slot both set one property,
the alphabetically-later value wins the cascade — which is arbitrary with
respect to intent, not a rule anyone chose, and unpredictable from reading the
manifest alone. Never rely on it, and never "fix" it by reordering the class
string — reordering does nothing, because this is the *compiled stylesheet's*
order, not the string's. A property a modifier slot overrides does not belong
on the base slot at all; put it in every modifier branch instead, so the base
slot only ever carries a property no sibling modifier touches.

This is a different failure from the one above: a state modifier (`hover:`,
`focus-within:`) always wins on *specificity*, a real, deterministic ordering
axis. Two *plain* classes for the same property, from a base slot and a named
modifier slot, share one specificity band, and Tailwind's own sort order
inside that band is what decides — which is what makes it look "correct" far
more often than it should. `Menu`'s `item`/`itemDefault`/`itemDestructive`/
`itemDisabled` is the reference shape: `item` carries only what no modifier
branch overrides (layout, no color, no cursor), and every color and cursor
value lives in exactly one of the three modifier slots, never on `item`
itself. `CommandPalette`'s `row`/`rowDefault`/`rowActive` and
`rowLabel`/`rowLabelDefault`/`rowLabelActive` follow the same shape for the
same reason — a resting row needs its own explicit background and text color,
not an absence that happens to lose to the active row's tint by alphabetical
luck. A `tv()` `variants` block does not carry this risk the same way: each of
its slot's classes resolves through one `slot()` call, and the configured
`tv` (`frameworks/tailwind/tv.ts`) merges that call's own base and chosen
branch with `tailwind-merge`, which resolves same-property conflicts by
config, not by generation order. The risk above is specifically about **named
sibling slots** — extra `slots` keys, outside any `variants` block, that a
consumer string-concatenates onto a base slot by hand (a specimen's `el()`
call, or an Angular component's own template interpolation) — because that
concatenation never goes through `tailwind-merge` at all, in the specimen
*or* in the real component.

Also written down here because it was almost missed twice more: `Tabs`'
`selected: false` branch once carried `hover:text-base-content/82`, copied
from `SegmentedControl.manifest.json`'s near-identical `selected` variant,
whose component genuinely implements a hover state. `Tabs.jsx` has no hover
state at all — no `useState`, no `onMouseEnter`, nothing. No gate compares a
manifest to the component it mirrors (see "No gate compares a Tailwind
manifest against the component it mirrors" in the root `CLAUDE.md`), so a
manifest written by copying a neighbouring manifest, rather than by reading
the component's own source, is how a divergence like this enters the layer
and stays there permanently, undetected, until someone happens to read both
side by side.

## A co-varying value belongs in the variant it co-varies with

A value that must track another prop can look, briefly, like a constant — don't
flatten it to the constant of the "middle" case. `IconButton.manifest.json`'s
`showLabel: false` compound shipped `w-ctl-h` (the `md` height, 40px) as the
icon-only width for every `size`. It isn't constant: React sets `width:
showLabel ? 'auto' : d` where `d` is the *size-specific* height (`sm` 32, `md`
40, `lg` 48) — so `sm` rendered 40×32, and only `lg` happened to look square,
by accident, because its own `min-w-ctl-h-lg` (48) outranked the wrong 40px
width. The fix dropped `w-*` from the `showLabel` compound entirely: `size`
already carries the correct `min-w-ctl-h-{sm,md,lg}` per size, and with `p-0`
alongside it, an icon glyph narrower than every size's minimum floors the box
at exactly the control height — square, at all three sizes, with no second
width class to conflict with it. Before flattening a value that varies with a
prop to one class, ask which *other* variant group it actually co-varies with,
and put it there instead.

## This layer is border-box; React is content-box, and that is expected

`utilities.css`'s preflight sets `box-sizing: border-box` on every element (`@layer
base`). Nothing in `tokens/` or `styles.css` does, so a React component is
content-box unless it opts in itself — most do not. **A slot that combines an
explicit size with a border, or an explicit size with padding, therefore
renders a different total box in the two layers** — border-box subtracts
border and padding alike from the declared size, content-box adds both
outside it, and either one alone produces the same divergence, by exactly
twice that border's or that padding's width. This is not a manifest defect to
chase with a compensating `+2px` or a taller size utility: `size-5` at
`border-[length:var(--bw)]` is a correct, deliberate 20×20 in this layer even
though React's equivalent, unless it opts into `box-sizing: border-box`
itself, renders 22×22 for the same nominal size — and the same holds for
`Switch.manifest.json`'s `track` (`w-10 h-5.5 p-0.5`, no border at all: the
padding alone is what shrinks its content box under border-box). See
`components-divergences.md` → "The Tailwind layer is border-box; React is
content-box" for the numbers this produced in Checkbox's `box`, Radio's
`ring`, Select's `field` and Switch's `track`, and for why the fix is
documentation, not a value change, in either layer.

**Corollary:** never add a `box-border` class to a manifest slot expecting it to
change anything — every slot is already border-box from the preflight, so the
class is a no-op that only reads as if some *other* slot were missing it.
`Input.manifest.json` shipped exactly that on its `field` slot before this rule
was written down.

## P1 — invented states

Before adding any state modifier a brief does not contain, cite the line of the
mirrored React component that implements it. "Every other component has one"
is not evidence — it is the failure mode.

This has produced the exact same defect twice on this branch: `Tabs`'
`selected: false` branch carried a `hover:` copied from `SegmentedControl`'s
near-identical variant (removed, and written down above), and
`Pagination.manifest.json` shipped three (`nav`'s and `pageOther`'s
`hover:bg-base-200`, `pageCurrent`'s `hover:shadow-2`) in the very next batch —
one commit after the rule was first stated in prose. `Pagination.jsx` has no
`useState`, no `onMouseEnter`/`onMouseLeave`, no hover branch anywhere; the
justification offered was the same "every other clickable primitive in this
layer has one" reasoning the Tabs entry above already names as the failure
mode, not a defense against it. A manifest authored by reading a neighbour
instead of the component it mirrors is how this keeps happening. `bun run
check:states` (`scripts/check-manifest-states.mjs`) now catches the shape
this rule describes — see below — but citing the source line is still the
right first move, since the gate is crude by design and does not replace
reading the component.

## P2 — hover on a disableable slot

Any `hover:` on a slot that can also be `:disabled` must be guarded
(`not-disabled:hover:`) or paired with a disabled property that neutralizes
it. `:hover` matches a disabled element's pseudo-class in Chrome and Firefox —
they suppress the *events* a disabled control would otherwise dispatch, not
selector matching — so an unguarded `hover:bg-*` still paints on a disabled
button, including the exact case `Pagination.manifest.json`'s `nav` slot
shipped: a disabled prev/next arrow, rendered dim and `not-allowed` by design,
tinting on hover anyway.

`IconButton.manifest.json` gets away with an unguarded `hover:bg-base-200`
only because its `disabled:opacity-45` mutes *everything* the element renders,
tint included — the hover still technically fires, but nothing shows through
the reduced opacity that a sighted user would read as feedback. A bare
`hover:bg-*` with no such blanket disabled treatment does not get this for
free; guard it explicitly.

## P3 — border-box is a table entry, not a paragraph

For every slot combining an explicit size with border or padding, both
numbers go into `components-divergences.md`'s border-box table as part of the
task that touches that slot. The table entry is the deliverable; the prose
reasoning is not — and a conclusion of "does not apply" still requires
computing and recording the same two numbers, not asserting the conclusion.

Three passes over this exact rule got the numbers wrong, and got them wrong
the same way each time: by reasoning in prose and dropping padding from the
computation. Padding carves out of a border-box total exactly the way a
border does — the rule earlier in this file says so explicitly — and a prose
summary is where that term quietly goes missing. Compute both totals
(content-box outer, border-box outer) from the actual utility values and the
actual component source before writing the sentence that describes them, and
put the two numbers in the table first.
