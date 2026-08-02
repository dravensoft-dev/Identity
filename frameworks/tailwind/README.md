# Arena, the Tailwind layer

> **For whoever authors a manifest or a utility.** Styling an app instead? A component already carries its own appearance;
> reach for the utilities only where you are drawing something Arena does not.

A framework-neutral Tailwind v4 consumption layer for Arena. It is **shared**,
not per-framework: the token→utility mapping is pure CSS and a component's
Tailwind recipe is data, meaning slots, variants and class strings, so every consumer
reads the same files whatever it is written in. The thin binding, how a class
string reaches an element, belongs to the consumer and never to this layer.

**This layer names no other framework layer, and none of them is its authority.**
What a component is, and what it presents, is stated once in `contracts/api/` and
`contracts/behaviour/`; what a value is, in `contracts/design/`. A manifest is
written by reading those, and `bun run check:layer-independence` fails a file here
that cites a sibling layer instead.

## It derives from tokens; it adds no value

Every utility here resolves to an existing Arena token via `var()`. There is no
new hex and no new value in this folder. Re-skin Arena by swapping
`contracts/design-generated/palette.generated.css`; these utilities re-skin with it.

## What the preset exposes

Every token in `contracts/design-generated/palette.generated.css`, `typography.generated.css`, `spacing.generated.css` and
`effects.generated.css` reaches a utility, except the ones that cannot. Each of those is
listed with its own reason in `EXCLUDED` in
`scripts/check/tailwind/check-tailwind-coverage.mjs`, and the gate fails the build if a
token is added and reaches nothing, so **run `bun run check:coverage` for the count rather
than trusting one here**. The reasons fall into three kinds: v4 has no namespace for that
property (`--dur-*`, `--loop-*`, `--bw-*`, `--focus-*`), the token is script-readable and JS
consumes it as a number (`--chart-*`, `--tint-*`), or the utility v4 would emit is a literal
that ignores the theme (`--sp-0`, where `p-0` compiles to `0px`).

`contracts/design/colors.css` is excluded as a category. Its aliases (`--crimson`,
`--mute`, `--danger-soft`, `--text-strong`…) alias tokens the preset already
exposes; a second utility name for the same colour is a second way to be
wrong. Reach one as `bg-[var(--danger-soft)]` when you genuinely need it.

Two naming notes: the density keys take the token's suffix verbatim, so
`--dz-row-py` is `py-row-py`; and `--container-max` is exposed as
`--container-page` (`max-w-page`) because a key named `max` shadows
Tailwind's built-in `max-w-max`.

A theme key is not bound to one axis. `--dz-ctl-h` is exposed as the `--spacing-ctl-h`
key, so it reaches `h-ctl-h` **and** `w-ctl-h` / `min-w-ctl-h`, so an icon-only control can
combine all three to come out exactly square at the control height. That is one
token reaching three utilities, not a new value; the coverage gate counts the token,
not the utilities it reaches.

## The breakpoints are the one value spelled twice, and a script spells both

`--bp-sm`, `--bp-md` and `--bp-lg` are read by JS through `getComputedStyle`, which is what
a component needs, because a component styles itself with an inline style object and an
inline style holds no media query. A consumer writing their own page CSS needs the other
half: a threshold they can name instead of inventing one.

They cannot be the same custom property. **A media query condition holds no `var()`**, and
Tailwind resolves a `--breakpoint-*` key at build time to write the variant's `@media`, so
`--breakpoint-md: var(--bp-md)` compiles to nothing. So the value is spelled twice, and
`Breakpoints.generated.css` is generated from the `bp` group by `bun run generate:tokens` so
the two cannot drift; `check:tokens` fails a stale one. `Theme.css` imports it, and a
consumer writes `sm:`, `md:` and `lg:`.

Tailwind's own breakpoint defaults are cleared first, the way every namespace in `Theme.css`
clears its own. Arena has three thresholds, so there is no `xl:` and no `2xl:`: a fourth
would be a value Arena never chose.

## The animations that live in CSS, and why

`Animations.css` holds the `@keyframes` and the utilities that ride them:
`arena-shimmer` (Skeleton), `arena-pop` (Dialog), `arena-menu` (Menu),
`arena-fade` (Tooltip), `arena-prog-indeterminate` (ProgressBar),
`arena-btn-spin` (Button) and `arena-spinner`, because a manifest holds class
names and keyframes are not one. That file's own header is the normative list;
if it and this paragraph ever disagree, the file wins. Every value in it is a
`var()` into a token, and each animation answers `prefers-reduced-motion` on its
own terms: decorative motion stops, motion that reports work slows.

## Arbitrary values are a build failure

`bun run check:arbitrary` fails on any bracket carrying a raw literal such as
`text-[13px]` or `bg-[#b52a20]`.

Three shapes are legal, and nothing else. A `var()` into a token
(`border-[length:var(--bw)]`). A **derivation** of tokens, meaning a `calc()`, `min()`,
`max()` or `clamp()` whose operands are tokens, zeros and multipliers
(`text-[length:calc(var(--avatar-md)*0.4)]`), which is the same rule
`CLAUDE.md` states for an inline style: a dimension is a token *or a derivation
of tokens*. And a single value in a unit the token layer does not model,
such as `max-w-[42ch]`, `max-w-[92vw]`, `w-[62%]` or `rotate-[120deg]`, because DTCG
admits only `px` and `rem` in a dimension, so there is no token to reference and
inventing one would be worse than the literal.

`px`, `rem`, `ms` and `s` are **not** in that set: tokens model those, so
`text-[13px]`, `duration-[200ms]` and `w-[calc(var(--sp-4)+8px)]` all still fail.
If a manifest needs a value with no token behind it, the token is what is
missing: add it to `contracts/design/` first.

<!-- check-arbitrary-values allow: text-[13px] bg-[#b52a20] duration-[200ms] w-[calc(var(--sp-4)+8px)] -->

**A fourth shape exists, and it is earned rather than general: an arbitrary
PROPERTY, with no `utility-` prefix.** A `transition-[...]`/`duration-[...]` pair
sets one duration for every listed property, because Tailwind's `duration-` utility
writes a single `transition-duration` for the whole `transition-property` list and
there is no second one to layer on for just one property. `Button` needs
`background` and `transform` at `--dur-fast` and `box-shadow` at the slower
`--dur-mid`, which is three properties and two durations, something the CSS `transition` shorthand
expresses freely by giving each property its own clause and a utility pair cannot
express at all. `Button.manifest.json` writes the whole declaration as one bracket
instead:

```
[transition:background_var(--dur-fast)_var(--ease-out),transform_var(--dur-fast)_var(--ease-out),box-shadow_var(--dur-mid)_var(--ease-out)]
```

Every operand is a `var()` into a token, so `check:arbitrary` holds over it exactly
as it does over the other three shapes: the escape is the *property*, never the
literal. **Reach for it only when a utility cannot express the declaration at all**,
which here means a per-property duration; a value a normal utility could carry
belongs in a normal utility. Writing the shape down is what keeps reaching for it from
being quiet.

The gate scans `.md` too, because a `.prompt.md`'s Don't block is exactly
where a bad example belongs, and an unflagged one is a bad example someone
copies into a manifest. The marker above is the one legal escape: an HTML
comment, invisible in rendered markdown, naming exactly the classes it
exempts: `text-[13px]`, `bg-[#b52a20]`, `duration-[200ms]` and
`w-[calc(var(--sp-4)+8px)]`, the counterexamples this section uses. A class
this file carries that no marker names still fails;
a marker naming a class the file no longer carries fails too, as a stale
allowance. The marker is honoured in `.md` only, and found in any other
extension it is itself a failure.

## Consumption order

1. Bring Arena's tokens into scope with `@import "../../intro/styles.css";` (or the
   individual `contracts/design-generated/*.css`).
2. `@import "./Theme.css";`, the Tailwind `@theme` preset.
3. Consume a component manifest from
   `./components/<category>/<component-kebab>/<Component>.manifest.json`.

## How this layer is laid out

**Directories are `kebab-case` and lowercase; a file name begins with a capital, and a
multi-word stem is `PascalCase` with hyphens removed; a secondary dotted segment stays
`lowerCamelCase`.** So the layer root's seven source files are `Tv.ts`,
`ManifestClasses.js`, `Theme.css`, `Utilities.generated.css`, `Animations.css`, `Specimen.css` and
`Specimen.js`. This file sits beside them and complies as it stands, `README` being a
capital-initial name like any other, and a component's three files sit together in one
directory:

```
components/display/badge/
    Badge.manifest.json          the source of truth
    Badge.manifest.generated.ts  generated by `bun run build:tailwind`
    Badge.card.html              the specimen
```

The category comes from `frameworks/Components.json`, which declares it once for all three
framework layers, and `bun run check:structure` fails a component directory that sits
anywhere else. That gate says nothing about whether the category is the *right* one, which
is editorial judgement and no gate has it. **All three framework layers share this shape**,
so the gate reads every layer unconditionally; `LAYERS` in `scripts/check/arena/check-structure.mjs` is
the exhaustive enumeration, deliberately not a walk of `frameworks/`, so a layer renamed or
removed wholesale becomes loud rather than quietly leaving the gate's scope. The root
`CLAUDE.md` carries the naming rule and its mechanical exceptions in full; count them there
rather than here.

A specimen sits two directories below the layer root, so every reference it makes out of
its own directory, whether `intro/styles.css` or this layer's `Utilities.generated.css`,
`Specimen.css` and `Specimen.js`, carries two `../` segments.

**Be exact about what catches a miscount, because `check:cards` catches less of it than
it looks.** That gate loads each declaring page in headless Chromium, and the only status
it *fails* on is `clip`, meaning content over-running the declared box. So a broken **script**
path (`Specimen.js`, or the page's own manifest `fetch`) leaves `#root` empty, which
`classify()` reports as `unrendered`; `main()` routes that to `skip()`, which the repository's
declared strict setting turns into a failure, and which an environment exporting
`ARENA_CHECK_STRICT` as anything but `1` turns back into a SKIP and an INCOMPLETE run,
**not a failure**. And a broken **stylesheet** path (`intro/styles.css`,
`Utilities.generated.css`, `Specimen.css`) is not caught at all: the page still renders, so an
unstyled specimen that happens to fit its declared box passes outright, and one that
under-runs only warns. What actually stands behind a correct specimen is the by-hand
check: run `bun run demos` and open the page.

## What ships here

`components/` holds one manifest per surface. Count them with `find components -name
'*.manifest.json' | wc -l`, and the components with none with the command below. Each has a specimen page
beside it that renders the real markup from the real recipe with no build step. **A manifest
is held up by its own gates and never by having a consumer**: `bun run check:tailwind` demands
that every class it declares produce a rule, so one nothing reads yet cannot rot silently, and
the specimen renders it either way.

**`check:tailwind` also fails when it finds no manifests at all**, and that guard is what
stands between the gate and a vacuous pass. A gate iterating zero
manifests finds zero violations by construction, so a discovery step that reads the wrong
directory prints `0 manifest(s) … all resolve` and exits 0 over a layer it never looked at.
Discovery is one shared recursive walk, `manifestFiles()` in `scripts/lib/tailwind/tailwind-compile.mjs`, and
an empty result is an explicit failure rather than a clean pass. Every site that needs to
find manifests calls it: `compileLayer()` in that same file, which `check:tailwind` and
`build:tailwind` go through; `check:radius` and `check:states` directly; and a consuming
layer's own suite, which reaches it by dynamically importing a file URL so the specifier
resolves from a source tree and from a compiled emit alike, so nobody has a reason to write
a fifth spelling of the walk.
`compileLayer()`'s returned `manifests` map is keyed by **repo-relative path**
rather than by basename, which is what a message naming a manifest in a nested tree needs;
a consumer wanting the bare name calls `basename()`.

**A manifest mirrors a SURFACE, not a component, so some contracted components have none.**
Derive the set rather than trusting a list:

```bash
comm -13 <(find components -name '*.manifest.json' -exec basename {} .manifest.json \; | sort) \
         <(python3 -c "import json;print('\n'.join(sorted(n for v in json.load(open('../Components.json')).values() for n in v)))")
```

Two reasons put a component in it. **A compound family draws one surface**, so the parent's
manifest holds every level of it and its members have none of their own, which is `Tab`,
`TableRow`, `TableCell`, `CalendarEvent`, `RadioGroup` and the three `SideNav*` children.
`MANIFEST_COVERS` in `scripts/check/arena/check-manifest-states.mjs` is where that mapping
is written down. **And the three SVG charts have no surface a class string can describe**:
`BarChart`, `LineChart` and `DoughnutChart` are SVG geometry driven by measured container
width, their identity is path data and attribute bindings, and a manifest holding it would
be a lie about where the styling lives. `ChartCard` is not one of them and does have one,
since it is a bordered tile.

`Utilities.generated.css` is **generated** and **git-ignored**: `bun run build:tailwind`
compiles the preset with the manifests as content, and `bun run check:tailwind-generated` fails
when the file on disk and the source disagree, or when it is missing because the clone has not
been built. Only the specimen pages link it; an adopter compiles their own against this
preset. The same build also emits a `<Component>.manifest.generated.ts` (`as const`) beside
each `<Component>.manifest.json`, git-ignored the same way, and a consuming layer's recipe
imports it, so a typed build needs it on disk before it will compile at all. The JSON stays
the single source of truth either
way, so a new manifest needs a `bun run build:tailwind` before the gates pass.

**A variant name is scanned as a class name.** Tailwind reads a manifest as raw text, so
a variant *name* that collides with a utility (`visible`, `block`, `line`, `fixed`,
`static`…) leaks a dead rule into `Utilities.generated.css`. It is harmless per instance and
accumulates across the set; `BulkActionBar` hit it with `visible` and the layer settled
on `open` as the shared name for a shown/hidden boolean. Name variants with that in mind.

**`compoundVariants` are unusable here**, for two independent reasons: the
`classesFor()` helper every specimen uses throws on a manifest carrying them by design,
and the generated `manifest.generated.ts`'s `as const` makes the array a readonly tuple that
`tailwind-variants` rejects, failing `check:angular`. Model the same thing as a plain
boolean variant.

## Three consumption paths

- **Raw `className`:** read `slots`/`variants` and concatenate the strings yourself.
- **`tailwind-variants`:** feed the manifest straight into `tv({ slots, variants, defaultVariants })`.
- **`cva`:** map `variants`/`defaultVariants` onto a `cva` config.

## Invariants the manifests must reproduce

- **Danger is outline:** `border` and `text` in `--error`, transparent fill; a
  filled danger surface is reserved for `ConfirmDialog`'s final confirmation.
- **Focus is the gold ring.** No gradient utilities. Uppercase is reserved for
  micro-labels. Charts carry identity (`--color-cat-*`) or meaning (status),
  never both.

Authoring a manifest that needs a value no token holds is a spec violation: add
the token to `contracts/design/` first, then reference it here.

## A state modifier always outranks a variant on the same property

Hover, focus and disabled are Tailwind state modifiers (`hover:`, `focus-within:`,
`disabled:`), never variants, which is what lets a static specimen render one
variant combination and be right without a browser interaction driving it.

The corollary matters just as much: **a state modifier beats a plain variant
class on the same property, always**, both on specificity, since a pseudo-class adds
a selector so `focus-within:border-secondary` compiles to `(0,2,0)` against a
variant's plain `border-error` at `(0,1,0)`, and on source order. A state
modifier left on a slot's **base** string therefore leaks through every variant
built on that slot, including the ones that must lose to it. The failure is concrete:
put `focus-within:border-secondary` / `focus-within:ring-secondary/16`
on `Input`'s base `field` slot and all three `state` values (`neutral`, `error`,
`valid`) inherit it. `error`'s own `border-error`/`ring-error` are plain classes
with lower specificity, so focusing an errored field turns it gold and
the validation signal disappears exactly when the user tries to fix it, and
`contracts/api/components/Input.json` states the opposite in as many words: the
four states are ordered **error, focus, valid, neutral**, and error must win.

The fix: move the `focus-within:` classes off the base and into the specific
variant branches that are allowed to lose to them (`neutral` and `valid`, which
both correctly turn gold on focus), and leave the branch that must win (`error`)
with no focus-within rule to compete against, so its plain class holds regardless
of focus. **Read the contract's state order before writing the manifest**: that
order **is** the override order a state modifier is allowed to have, and the base
slot is only a safe place for a modifier every variant branch is willing to lose to.

## Two classes at equal specificity are ordered alphabetically, not by manifest order

Tailwind emits same-specificity utilities sorted by value inside each property
bucket, so `bg-transparent` always compiles after `bg-primary/14` and
`text-base-content/82` always compiles after `/62`, whatever order the
manifest declares them in or however sensible the manifest's own ordering
looks. When a base slot and an additive modifier slot both set one property,
the alphabetically-later value wins the cascade, which is arbitrary with
respect to intent rather than a rule anyone chose, and unpredictable from reading the
manifest alone. Never rely on it, and never "fix" it by reordering the class
string: reordering does nothing, because this is the *compiled stylesheet's*
order rather than the string's. A property a modifier slot overrides does not belong
on the base slot at all; put it in every modifier branch instead, so the base
slot only ever carries a property no sibling modifier touches.

This is a different failure from the one above: a state modifier (`hover:`,
`focus-within:`) always wins on *specificity*, a real, deterministic ordering
axis. Two *plain* classes for the same property, from a base slot and a named
modifier slot, share one specificity band, and Tailwind's own sort order
inside that band is what decides, which is what makes it look "correct" far
more often than it should. `Menu`'s `item`/`itemDefault`/`itemDestructive`/
`itemDisabled` is the reference shape: `item` carries only what no modifier
branch overrides (layout, no color, no cursor), and every color and cursor
value lives in exactly one of the three modifier slots, never on `item`
itself. `CommandPalette`'s `row`/`rowDefault`/`rowActive` and
`rowLabel`/`rowLabelDefault`/`rowLabelActive` follow the same shape for the
same reason: a resting row needs its own explicit background and text color,
not an absence that happens to lose to the active row's tint by alphabetical
luck. A `tv()` `variants` block does not carry this risk the same way: each of
its slot's classes resolves through one `slot()` call, and the configured
`tv` (`frameworks/tailwind/Tv.ts`) merges that call's own base and chosen
branch with `tailwind-merge`, which resolves same-property conflicts by
config, not by generation order. The risk above is specifically about **named
sibling slots**, meaning extra `slots` keys outside any `variants` block that a
consumer string-concatenates onto a base slot by hand (a specimen's `el()`
call, or a consumer's own template interpolation), because that
concatenation never goes through `tailwind-merge` at all, in the specimen
*or* in the real component.

One shape of copy is worth naming. `SegmentedControl.manifest.json`'s `selected`
variant carries a hover affordance its contract declares, and `Tabs`' visually
near-identical `selected: false` branch must not, because neither `Tabs.json` nor
`Tab.json` declares one. **A modifier copied that way is caught**:
`bun run check:states` reads `affordances` in `contracts/api/` and fails a
modifier no covered contract declares. What is still not caught is everything
else a copy brings with it: no gate compares a manifest's colors, sizes or slot
structure against anything. A manifest written by reading a neighbouring
manifest rather than the contract is how such a divergence enters the layer and
stays, undetected, until someone reads both side by side.

## A co-varying value belongs in the variant it co-varies with

A value that must track another member can look, briefly, like a constant, so do not
flatten it to the constant of the "middle" case. `IconButton` is the worked example: an
icon-only width looks like one number, but it is the *size-specific* control height,
`--dz-ctl-h-sm` (32), `--dz-ctl-h` (40) or `--dz-ctl-h-lg` (48), because an icon-only
control is square at whatever height its size sets. Pinning the `md`
value as `w-ctl-h` on the `showLabel: false` compound would render `sm` at 40×32, and
only `lg` would look square, by accident, because its own `min-w-ctl-h-lg` (48)
outranks the wrong 40px width.

So the compound carries no `w-*` at all. `size` already carries the correct
`min-w-ctl-h-{sm,md,lg}` per size, and with `p-0` alongside it, an icon glyph narrower
than every size's minimum floors the box at exactly the control height: square, at all
three sizes, with no second width class to conflict with it. Before flattening a value that varies with a
prop to one class, ask which *other* variant group it actually co-varies with,
and put it there instead.

## This layer is border-box, and it relies on no other layer for it

It gets it from `Utilities.generated.css`'s preflight, which sets
`box-sizing: border-box` on every element inside `@layer base`. `contracts/design/reset.css`
sets the same thing for anything that imports `intro/styles.css` instead. Two files, one box
model, and a slot's declared size is its outer edge either way.

**Never derive a box model by reading a source and reasoning about what it does not say.**
"No `box-sizing` is declared, therefore content-box" is wrong in both directions at once,
because Chromium's UA stylesheet has already made `<button>` and `<select>` border-box and
has not touched `<textarea>` or `<input type="text">`. A conclusion drawn that way claimed
divergences that did not exist for every slot that happened to be a `<button>` and missed a
real 26px overrun. Measure the rendered box.

**Corollary, and it has two independent reasons:** never add a `box-border` class
to a manifest slot expecting it to change anything. Every slot is already border-box from
the preflight, so the class is a no-op that only reads as if some *other* slot were missing
it.

## P1: invented states

Before adding any state modifier a brief does not contain, read
`contracts/api/components/<Name>.json` and check that its `affordances` array
declares that family. "Every other component has one" is not evidence; it is the
failure mode.

A manifest authored by reading a neighbouring manifest instead of the contract is
how this defect arrives, and prose alone does not prevent it. `bun run check:states`
(`scripts/check/arena/check-manifest-states.mjs`) is what holds it: a modifier no contract
the manifest covers declares fails the build. Read the contract anyway, because the gate
knows only that the affordance exists somewhere on the covered surface, never that
this slot is where it belongs.

## P2: hover on a disableable slot

Any `hover:` on a slot that can also be `:disabled` must be guarded
(`not-disabled:hover:`) or paired with a disabled property that neutralizes
it. `:hover` matches a disabled element's pseudo-class in Chrome and Firefox, which
suppress the *events* a disabled control would otherwise dispatch rather than
selector matching, so an unguarded `hover:bg-*` still paints on a disabled
button: a disabled prev/next arrow, rendered dim and `not-allowed` by design,
tints on hover anyway.

`IconButton.manifest.json` gets away with an unguarded `hover:bg-base-200`
only because its `disabled:opacity-45` mutes *everything* the element renders,
tint included. The hover still technically fires, but nothing shows through
the reduced opacity that a sighted user would read as feedback. A bare
`hover:bg-*` with no such blanket disabled treatment does not get this for
free; guard it explicitly.

## P3: border-box arithmetic is computed, never summarised

`contracts/design/reset.css` sets `box-sizing: border-box` on everything, in every layer, so an
explicit size is the OUTER edge and border and padding carve out of it. **Padding carves out of a
border-box total exactly the way a border does**, and a prose summary is exactly where that term
goes quietly missing: reasoning in sentences drops padding from the computation, and the
resulting numbers are wrong in a way that reads as plausible.

So for every slot combining an explicit size with a border or a padding, compute the content box
from the actual utility values and the actual component source **before** writing the sentence
that describes it, and state the arithmetic rather than the conclusion. A verdict of "does not
apply" needs the same computation, not an assertion.

**The reset is what makes this one rule instead of one per layer**, and it is also the trap: a
repo-wide reset invalidates every argument that rested on the default it replaced, and those
arguments live in prose that no gate reads. An argument about a box model is only as current as
the reset it assumes, so state which one, or measure.
