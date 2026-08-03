# Compiling the Tailwind layer into a tree of per-component CSS

## Context

Both packages ship one compiled utility sheet, and every component renders the Tailwind class
string that `tailwind-variants` resolves at runtime. Three costs follow from that, and the
third is the one no document states today.

**An adopter's own Tailwind collides with Arena's.** The packages publish `.px-4`, `.flex`
and `.rounded-lg` resolved against Arena's `--spacing` base. A project running its own
Tailwind defines the same names against the stock base. Source order decides, and the loser
is silent in either direction: either the adopter's utilities render at Arena's scale, or
Arena's components render at the adopter's.

**Two runtime dependencies exist only to resolve class strings.** `tailwind-merge` is 12,299
bytes gzipped and `tailwind-variants` 3,535, in both packages, and the utility sheet travels
whole even for an adopter using five components.

**The two layers consume the manifest through two different mechanisms.** React reads a copy
emitted into its own layer; Angular reaches across the boundary, which is the single
`ALLOWED` edge in `check:layer-independence` and the reason
`scripts/build/angular/build-angular-package.mjs` stages a slice of `frameworks/tailwind/`
beside the layer and rewrites every specifier with `repointTailwind()`.

The outcome this specification describes: no Tailwind class name and no Tailwind custom
property leaves either package, both layers consume the same way, `ALLOWED` is empty, and an
adopter can import one component's appearance without the other forty-two.

## What was measured

Measured on the real emit, prelude included, not estimated.

| artifact | raw | gzip |
|---|---|---|
| `Utilities.generated.css` today | 57,956 | 9,111 |
| prelude and all 43 component sheets | 147,900 | 13,453 |
| prelude and five component sheets | 30,799 | 4,292 |
| prelude and one component sheet | 10,399 | 2,221 |
| `tailwind-merge`, removed | 63,812 | 12,299 |
| `tailwind-variants`, removed | 14,765 | 3,535 |

The CSS does not get smaller in the worst case. An adopter importing the whole barrel pays
4,342 bytes more gzipped while 15,834 bytes of JavaScript leave, so that package is 11,492
bytes lighter. An adopter importing five components is 20,653 bytes lighter, because the CSS
column becomes a gain as well. **The weight argument rests on the JavaScript removed and on
selective import, never on a smaller total sheet**, and stating it the other way around would
be false.

## The finding that shapes the design

`@apply` does not emit Arena's token. It emits Tailwind's namespace indirection with the
token as a fallback. Compiled against the real preset with `tailwindcss` 4.3.3:

```css
gap: calc(var(--spacing, var(--sp-1)) * 1.5);
border-radius: var(--radius-pill, var(--r-pill));
font-size: var(--text-ctl-2xs, var(--dz-text-2xs));
```

An adopter running Tailwind declares `--spacing` on their own unlayered `:root`. That value
wins, the fallback is never reached, and every Arena component rescales silently. **Without
a strip step the collision is not removed, it is moved** from class names to custom
properties, where it is harder to diagnose because nothing in the DOM names it.

The strip rewrites `var(--A, var(--B))` to `var(--B)` to a fixed point, validated against
`Theme.css` so that `--A` must be a key of the `@theme` block and `--B` the token that key
points at. A fallback of any other shape, `var(--tw-ring-color, currentcolor)`, is left
alone. Over the real 43 it removes 1,589 indirections and leaves the emitted CSS referencing
only Arena tokens plus Tailwind's `--tw-*` internals, which are registered with `@property`
and `inherits: false` and are set inside the rule that reads them, so they cannot collide.

## A live defect the strip repairs

`Theme.css` routes density through `:root`, as `--text-ctl-2xs: var(--dz-text-2xs)` and
eleven siblings. `contracts/design-generated/spacing.generated.css` declares `.arena-compact`
overriding `--dz-*` alone, documented as a container class. CSS substitutes the `var()` in a
custom property at computed-value time on the element that declares it, so `--text-ctl-2xs`
resolves once at `:root` and inherits already resolved. **Compact density is inert today
across the whole library**, and no gate can see it, because every gate reads the class string
rather than the computed value.

After the strip the emitted declaration is `font-size: var(--dz-text)`, resolved on the
element that carries it, and `.arena-compact` takes effect. The repair is a consequence of
the strip and not separate work, and the verification section names how it is demonstrated.

## Design

### The manifest stays the authored source

`.manifest.json` does not change. That is what keeps `check:tailwind`, `check:coverage`,
`check:arbitrary`, `check:radius`, `check:surface-parity` and the manifest half of
`check:states` alive without an edit, and it is the strongest argument against authoring the
CSS by hand. `Utilities.generated.css` survives as a build-time artifact that is never
published, because `check:style-parity` needs it as its oracle.

`scripts/build/tailwind/build-tailwind.mjs` gains a stage: translate each manifest to
`@apply` rules, compile, strip, and emit
`frameworks/tailwind/components/<category>/<component>/<Component>.styles.generated.css`.

### Class names derive from the manifest, not from the component

`arena-<manifest-kebab>__<slot-kebab>` for a base, and
`arena-<manifest-kebab>__<slot-kebab>--<group>-<value>` for a variant.

The prefix is the manifest's because a manifest mirrors a surface rather than a component:
`TableRow` and `TableCell` share `Table.manifest.json`, `Tab` shares `Tabs`', `CalendarEvent`
shares `Calendar`'s, `RadioGroup` shares `Radio`'s, three `SideNav*` children share
`SideNav`'s, and `BottomNavItem` shares `BottomNav`'s. `MANIFEST_COVERS` in
`scripts/lib/tailwind/manifest-surfaces.mjs` is the authority. Deriving the prefix from the
component name instead produces class names with no rule behind them, and makes
`check:component-css` unbuildable.

`compoundVariants`, which only `PageHead` carries, emit as `--cv<n>` in declaration order
after every simple variant, which is the order `classesFor()` already implements and
`manifest-classes.test.mjs` already proves.

Emission order is bases, then variants, then compounds, every rule at one class of
specificity, so source order decides between them. **Within a rule the declaration order is
Tailwind's canonical one and not the manifest string's**, which matches the compiled sheet
today, so parity holds; a reader diagnosing a parity failure needs that stated or they will
look for the cause in the wrong place.

**The class name is not the API.** `frameworks/PACKAGING.md` already takes that position for
the class string and it carries over unchanged, but it has to be restated explicitly there
and in `SKILL.md`, because `arena-badge__root--tone-error` reads as a public BEM surface and
an adopter will target it unless told.

### The component CSS lands in `@layer utilities`

That is where every Arena rule sits today. Emitting it unlayered, which is what `@reference`
produces by default, would make Arena beat every layered rule an adopter writes, a cascade
change no gate would catch. `@layer components` is worse: an adopter's own `.px-4` sits in
`utilities`, above it.

### The runtime is twenty lines

`frameworks/tailwind/ArenaStyles.ts` replaces `Tv.ts` and preserves the call shape
`styles.root()`, so each of the 52 React components and 48 Angular `.variants.ts` changes two
import lines. It implements `compoundVariants`.

`ArenaStyles.ts` and a per-component `<Component>.classes.generated.ts`, carrying slot names,
variant key sets and `defaultVariants` as `as const`, are mirrored into **both** layers:
`CONSUMING_LAYERS` becomes `['react', 'angular']`. The `as const` is load-bearing because
`Badge`, `Avatar`, `Alert` and `Toast` derive types from `Object.keys` over the variant
groups, and a widened `string` would collapse them. Angular's import becomes intra-layer, so
`ALLOWED` and `ALLOWED_SPECIFIERS` empty out.

### The published tree

```
dist/
  arena.css                     the barrel, an @import of everything below, in order
  css/
    reset.css  typography.generated.css  spacing.generated.css
    effects.generated.css  colors.css  environment.css      the root, unchanged
    base.css                    Tailwind's preflight, optional, exists today
    prelude.css                 new: layer order, @property --tw-*, @keyframes
    components.css              new: the barrel of the 43
    components/
      badge.css  button.css  calendar.css  ...              43, each importable alone
```

`css/prelude.css` is a hard prerequisite rather than a recommendation. Without the
`@property --tw-*` registrations `border-style: var(--tw-border-style)` is invalid at
computed-value time and **every border disappears**, and the `box-shadow` chain is invalid so
**the focus ring disappears**. That is the silent-absence shape the repository already names
for `@layer base`. Rather than document the dependency and trust it, **every
`css/components/<name>.css` opens with `@import '../prelude.css';`**, which browsers and
bundlers both deduplicate. The `@keyframes` of `Animations.css` go there too, because
`@apply` emits `animation: arena-shimmer ...` and not the keyframes behind it.

`css/utilities.css` stays, as an alias for the components barrel. Both `PACKAGE.md` files
instruct an adopter who ships their own reset to import it in place of `arena.css`, so
removing it is an adopter break and not a cleanup.

### What the two new gates claim

`check:component-css` is cheap and bidirectional: every class name derivable from a manifest
has a rule in the emitted CSS, and every rule in the emitted CSS is derivable from a
manifest. It excludes the seven `arena-*` utilities `Animations.css` already declares
(`arena-shimmer`, `arena-fade`, `arena-pop`, `arena-menu`, `arena-spinner`, `arena-btn-spin`,
`arena-prog-indeterminate`), which occupy that namespace and would otherwise report as orphan
rules.

`check:style-parity` is the browser gate: per component and per variant value, an element
carrying the manifest's raw class string against the utility sheet must have the same
`getComputedStyle` as an element carrying the Arena names against the component sheet. Two
requirements are not negotiable.

It renders **the concatenations the components actually produce**, not one slot per element.
`Menu` concatenates `item` with `itemDefault`, `itemDestructive` or `itemDisabled`,
`CommandPalette` concatenates `row` with `rowDefault` or `rowActive`, and `Switch`
concatenates `footprint` with `thumb`, none of them through a merge. Today the winner is
decided by Tailwind's alphabetical sort inside a property bucket; afterwards it is decided by
slot declaration order in the manifest. A gate mounting one slot per element cannot see the
difference.

It **drives the media queries**. A `motion-reduce:` or `hover:` variant is hoisted to a
sibling `@media` block after the rule rather than interleaved the way `@layer utilities`
orders it. That is the axis most likely to regress and the one a default `getComputedStyle`
cannot reach.

## What is deliberately not done

**The middle tier of the tree.** The root exists, as the token chain plus `prelude.css`, and
the leaves are the components. A per-category tier deduplicating declaration blocks shared
between components is not built: gzip already recovers nearly all of that repetition, 133,071
bytes falling to 11,816, and a barrel that differs from the concatenation of its parts is a
second source of truth. It is revisitable with measurement after the sweep.

**Rewriting `Theme.css` or the token-to-utility mapping.** The strip makes it unnecessary.

## Verification

1. The pilot builds and both new gates pass over `Badge`, `Input` and `Calendar` in both
   layers.
2. The collision is proved directly: no emitted `.styles.generated.css` references a Tailwind
   namespace property. This is an assertion inside `check:component-css` rather than a grep
   run by hand, because a claim nobody re-runs is not a claim.
3. Compact density is demonstrated: an `Input` inside `.arena-compact` renders at the compact
   control height. It does not today, and that difference is the evidence the strip worked.
4. The two layers' playground pages are compared at the same query string, which is what
   generating them per layer is for.
5. Weight is measured on the assembled `dist/`, gzipped, against the table above, rather than
   estimated.
6. The full `bun run check` runs once, after the sweep, which is when this repository expects
   it.

## Sequencing consequence

`arena.css` has to keep importing `css/utilities.css` while any component still renders raw
utilities, so **the collision is not closed until the forty-third component**. The pilot and
the sweep land on one branch and only the finished sweep is released, as one major.
