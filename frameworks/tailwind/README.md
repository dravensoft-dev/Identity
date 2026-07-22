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
`effects.css` reaches a utility, except eleven that cannot — `--sp-0` (`p-0`
is a literal `0px` in v4), the three `--bp-*` (read by JS, never a media
query), the three `--dur-*` and the two `--bw-*` and the two `--focus-*`
(v4 has no namespace for them). Those eleven are listed with their reason in
`EXCLUDED` in `scripts/check-tailwind-coverage.mjs`, and that gate fails the
build if a token is added and reaches nothing.

`tokens/colors.css` is excluded as a category. Its aliases (`--crimson`,
`--mute`, `--danger-soft`, `--text-strong`…) alias tokens the preset already
exposes; a second utility name for the same colour is a second way to be
wrong. Reach one as `bg-[var(--danger-soft)]` when you genuinely need it.

Two naming notes: the density keys take the token's suffix verbatim, so
`--dz-row-py` is `py-row-py`; and `--container-max` is exposed as
`--container-page` (`max-w-page`) because a key named `max` shadows
Tailwind's built-in `max-w-max`.

A theme key is not bound to one axis. `--dz-ctl-h` is exposed as the `--spacing-ctl-h`
key, so it reaches `h-ctl-h` **and** `w-ctl-h` / `min-w-ctl-h` — `ThemeToggle` uses all
three to make an icon-only control exactly square at the control height. That is one
token reaching three utilities, not a new value; the coverage gate counts the token,
not the utilities it reaches.

## The animation that lives in CSS, and why

`animations.css` holds `@keyframes` and the utility that rides them —
`arena-shimmer` (Skeleton) — because a manifest holds class names and keyframes
are not one. It is the same boundary React
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

`components/` holds one manifest per component, and — for every one with an Angular
consumer — a static specimen page beside it. **Nineteen manifests and eighteen
specimens** ship today: ActivityFeed, Alert, AppLogo, Avatar, Breadcrumbs,
BulkActionBar, ChartCard, CommandPalette, ConfirmDialog, EmptyState, ErrorState,
Onboarding, PageHead, Skeleton, StatCard, Tag, ThemeToggle and UnauthCard have both;
**Button has a manifest and no specimen**, because it mirrors React's `Button.jsx` and
has no `arena-*` primitive to specimen — Material provides the Angular button. The
twenty-odd components a framework-neutral consumer hand-rolls because Material would
otherwise provide them, `SideNav` among them, are still to come.

**The three SVG charts and Calendar have no manifest, on purpose.** `BarChart`,
`LineChart` and `DoughnutChart` are SVG geometry driven by measured container width:
their identity is path data and attribute bindings, and a manifest that tried to hold it
would be a lie about where the styling lives. Calendar is date arithmetic and JS
responsive branches; what a manifest could capture is a fraction of it, and that fraction
would drift from the rest.

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
explicit size with a border therefore renders a different total box in the two
layers, by exactly twice the border width**, and that is not a manifest defect
to chase with a compensating `+2px` or a taller size utility: `size-5` at
`border-[length:var(--bw)]` is a correct, deliberate 20×20 in this layer even
though React's equivalent, unless it opts into `box-sizing: border-box` itself,
renders 22×22 for the same nominal size. See `components-divergences.md` →
"The Tailwind layer is border-box; React is content-box" for the numbers this
produced in Checkbox's `box`, Radio's `ring` and Select's `field`, and for why
the fix is documentation, not a value change, in either layer.

**Corollary:** never add a `box-border` class to a manifest slot expecting it to
change anything — every slot is already border-box from the preflight, so the
class is a no-op that only reads as if some *other* slot were missing it.
`Input.manifest.json` shipped exactly that on its `field` slot before this rule
was written down.
