# The boundary between a token and a component's geometry

**Date:** 2026-07-18
**Status:** design settled, implementation not started
**Sequenced after:** `2026-07-18-framework-layer-token-coverage.md` (with one task removed — see *What this reverses*)
**Governs:** the React layer, and the 34 manifests that `2026-07-18-framework-layer-parity-design.md` will write

---

## The problem

The React layer writes dimensions as bare numeric literals — `fontSize: 13`,
`border: '1px solid …'`, `padding: '0 18px'` — rather than reading tokens. The
previous audit called the layer clean, and it was right about the rule it tested:
zero raw hex, zero references to a token that does not exist. It did not test
whether a dimension resolves from the token layer at all.

Measured across the 40 components, three token families have almost no consumer in
the layer that is supposed to embody them:

```
var(--fs-*)  in frameworks/react/components/   →   1 use
var(--sp-*)  in frameworks/react/components/   →   0 uses
var(--bw)    in frameworks/react/components/   →   0 uses
```

Those families are used — 84 and 43 times — but in `guidelines/`, the Overview,
`toggle.css` and the `.dc.html` pages. They are used by the pages that *document*
the language and not by the components that *are* it.

The two scales also disagree. `fs` is odd — 11/13/15/17/19/24/32/44/64 — and the
most frequent sizes in React are even: 14 (×21), 12 (×19), 16 (×8), 10 (×6),
18 (×4). The two most common sizes in the entire component layer do not exist in
the scale, while 11 (×18) and 13 (×15) do. React uses two interleaved scales.

The `2026-07-18-framework-layer-token-coverage.md` plan met this and deliberately
left it open, resolving exactly one case (`--fs-base: 14px`, so `Button` could
compile) and recording: *"Button was not an exception, it was the first of a queue
— measure before writing the next manifest."* This spec is the answer to that note.

It has to be answered once. The parity spec will write 34 manifests; an off-scale
size resolved at the manifest that happens to need it is the same decision taken 34
times by 34 different rationales.

## What was measured

Every count in this document — here and in the family sections below — is
indicative, taken with ad-hoc greps over `frameworks/react/components/**/*.jsx`.
They differ from the coverage plan's audit by a few units because the patterns
differ (this pass counts 106 `fontSize` literals where that audit counted 116, and
42/3/1 borders at 1px/2px/3px where it counted 44/3). **The numbers are not the
authority — the gate is.** The implementation produces a committed script whose
output replaces every count in this spec.

They are quoted anyway because the *shape* is what carries the argument, and the
shape is robust to the pattern: which values cluster, which roles share a value, and
which families have no consumer at all.

| | Count |
|---|---|
| `fontSize` literals | 106 |
| `padding`/`gap`/`margin` literals | 140 |
| `border` literals | 46 — 42×`1px`, 3×`2px`, 1×`3px` |

`fontSize` distribution: 9×1, 10×6, 11×18, 12×19, 13×15, 14×21, 15×5, 16×8, 17×1,
18×4, 19×2, 20×1, 22×2, 32×1, 34×2.

Spacing values off the 4px grid: 10 (×12+), 6 (×11+), 22 (×4), 14 (×4+), 18 (×3),
26, 9, 5, 2. Every one of them is `4n ± 2` except 9 and 5.

## The decision

**Tokens name roles. Layers instantiate roles.**

A dimension in a framework layer is legal when it **names a role** — then it is a
token — or when it **derives from a role** in that platform's idiom — then it is a
`calc()`. It is illegal when it is a bare literal, because a bare literal asserts a
role the language never declared.

This is not a new principle. It is the layer contract `CLAUDE.md` already states
for colour, extended to dimension: DTCG owns values, the composition layer owns how
values are combined at runtime.
`color-mix(in oklab, var(--color-base-content) 62%, transparent)` introduces no new
colour; it derives one. `calc(var(--sp-1) * 2.5)` introduces no new dimension.

**Derivation is available where a scale is numeric and unavailable where it is
semantic** — because a derived role is not a role. `calc(var(--sp-1) * 2.5)` is a
coherent spacing value. `calc(var(--fs-sm) * 1.08)` is a number with no meaning.

That asymmetry is what places the boundary the original question asked about. The
14×14 spinner inside `Button` is neither a token nor a knob: it is
`calc(var(--sp-1) * 3.5)`. `tokens/src/` gains nothing, the re-skin surface does not
grow by fifty knobs, `Arena - Overview.html` stays legible — and the number stops
being a literal, because it now moves when the grid moves. The same holds for a
chart's axis offset.

## The promise this serves

The reason to place the boundary at all:

> **The token fundamentals live in `tokens/` and `tokens/src/`. Arena is
> implemented so that a developer who wants their own variant of Arena — in any
> framework — only has to change the values in that directory, and every layer
> adopts them automatically.**

This is not a restriction on what a consumer may touch. It is a claim of
**sufficiency**, and it has two properties that a restriction would not.

**It is falsifiable, and today it is false.** Change `fs.md` from 15 to 16, rebuild,
and the React layer does not move — it holds one `var(--fs-*)` reference. The work
in this spec is what makes the claim true.

**It is the same thing the gate measures.** Zero bare literals in a layer means
every rendered value resolves from `tokens/src/`, which means changing a token moves
the layer. `check-dimension-literals.mjs` is not a tidiness check; it is the proof of
the promise.

It also raises the stakes on family completeness. Under a restriction, a missing
family is untidy. Under a promise of sufficiency, a missing family is a **hole in
the contract**: a developer who needs to re-tune tracking and finds that `ls` covers
5 of 24 real uses has been promised something Arena does not deliver.

### What the promise does not include

**Independent control of component internals.** A variant author changing `sp-1`
moves `Button`'s spinner, because the spinner is `calc(var(--sp-1) * 3.5)`. They
cannot resize that spinner *alone*. That is intended — the output is a variant of
Arena, not a different design system — and it is what keeps `tokens/src/` from
becoming a component API.

**Brand assets.** The six SVGs in `assets/` carry fixed hex (`#b52a20` crimson,
`#f3ede5` bone, `#141010` ink) and stay that way. **The Rotor, the avatars and the
app icon are Dravensoft's identity, not Arena's skin.** A variant for another
company replaces those files; it does not recolour them. This is recorded because
the natural instinct is to "fix" them to `currentColor`, which would quietly turn a
brand mark into a themeable element.

### The one place the promise silently breaks today

`tokens/src/typography.json` declares the families as tokens
(`font.display: ["Archivo", "system-ui", "sans-serif"]`), but `tokens/fonts.css` —
the `@font-face` rules and the binaries under `assets/fonts/` — is generated by
`scripts/fetch-fonts.mjs`, which **hardcodes its own family list**:

```js
const FAMILIES = [
  { css: 'Archivo', slug: 'archivo', weights: [400, 500, 600, 700, 800, 900] },
  …
```

A variant author who sets `font.display` to `"Inter"` and rebuilds gets
`--font-display: Inter, system-ui, sans-serif` with **no `@font-face` for Inter**,
and falls through to `system-ui` with no error at all. Silent failure is the worst
shape this could take.

**Fix:** `fetch-fonts.mjs` reads its family list and weights from
`tokens/src/typography.json` instead of hardcoding them. The token then governs in
fact, and the weights stop being declared twice — `FAMILIES.weights` and the `fw`
tokens agree today by discipline rather than by construction.

## The families of size and space

The off-scale values are resolved once, here, by sorting them into families. Each
family gets one rule. Four families answer the size and space question; four more,
in *Beyond size and space* below, cover what the promise of sufficiency needs beyond
it.

**Two are genuinely new — icon size (3) and layering (5).** The rest are extension
(`lh`), correction (`ls`), adoption (`fw`, borders), or a rule about how an existing
family is used (`fs`, `dz`, `sp`).

### 1. `fs` — editorial type. Closed, semantic, layers snap to it.

Governs prose and headings. **It gains no steps.** Its names are roles —
`display`/`h1`/`h2`/`h3`/`h4`/`lg`/`md`/`sm`/`xs` — and there is no name for 12
between `xs` (11) and `sm` (13). A semantic scale that cannot name its new step is
reporting that the step is not a step of that scale. 10/12/14/16/18 against
11/13/15/17/19 is not a refinement of the scale; it is a second scale at a 1px
offset.

Off-scale editorial sizes snap: 18 → 17 or 19, 34 → 32, 22 → 24, 20 → 19.
**This moves rendered pixels.** It is a design change, not a refactor, and it is
the smallest of the four groups.

`fs.xs` is the token for the mono uppercase micro-label — its `$description`
already says *"mono labels / captions"* and it is used ×10 with
`textTransform: 'uppercase'`. The 10px (×5) and 9px (×1) micro-labels are drift off
that existing token and snap to 11.

### 2. `dz` — control density. The second scale. It already exists and is half-populated.

This is where React's even scale actually lived. `dz` already declares control
heights (40/32/48), row padding, stack gap, and `cell: 14px` as a *font size*; its
own `$description` says it covers *"buttons, inputs, switches row"*.

**Chrome text is a density role, not an editorial one.** The size of a button
label, an input's value, a hint, a validation error, a badge or a chart legend is
governed by how dense the controls are, not by the prose scale.

`dz` gains the text steps it is missing:

| Token | Value | Role |
|---|---|---|
| `dz.text` | 14px | control text — buttons, inputs, selects, menu items, table cells |
| `dz.text-sm` | 12px | secondary control text — hints, validation errors, badges, legends |

`dz.cell` is **deleted**, absorbed by `dz.text`. `cell` was a narrow name for a
general role, and Arena does not keep tombstones — the rename ships in the breaking
major.

**No pixels move in this family.** The ~45 chrome sites keep their rendered size
and gain a token.

This also re-homes the coverage plan's `--fs-base`: right value, wrong family. In
`fs` it ratifies drift and hides that a component left the scale. In `dz` it is the
density scale doing the job it was created for.

### 3. Icon size — the one genuinely new family.

Arena has **no icon-size token**. `tokens/src/` contains none, and the README's
ICONOGRAPHY section defines the set, the weight and the usage but no size scale.
The only nearby value is `effects.json`'s `r.xl` at 22px, an *app icon tile radius*.

A significant share of the "off-scale font sizes" are not font sizes at all. They
are icon sizes wearing `fontSize` because Phosphor renders as a webfont: 7 of the 8
sites at 16px are icons (Toast close, Alert close, Pagination arrow, Input's two
status icons, BulkActionBar's `{a.icon}`), as are 2 of the 4 at 18px
(CommandPalette's magnifier and its item icon).

Snapping these to the type scale would be a category error: an icon at 15px beside
a label at 15px is not the same design decision as an icon at 16px.

A new family is added — `icon.sm` / `icon.md` / `icon.lg` — with values confirmed by
the per-site pass (indicated: 14 / 16 / 18). It needs a `tokens/src/` file, a
`TYPE-MAP.md` entry (`$type: dimension`), a README section, and — because gate 3
from the coverage plan is installed by then — a Tailwind utility.

### 4. `sp` — spacing. Numeric, therefore derivable. **No new tokens.**

Off-grid spacing values become derivations, not tokens: `calc(var(--sp-1) * 2.5)`
for 10px, `* 1.5` for 6px, `* 3.5` for 14px, `* 4.5` for 18px, `* 5.5` for 22px.

Half-step *tokens* were considered and rejected. `sp` is numeric, so its semantics
already contain the half step; naming them would add roughly seven knobs to the
re-skin surface and to the Overview for zero expressive gain, and it would turn a
4px grid into a 2px one. **A grid whose steps are 2px apart does not constrain
anything**, and constraining choice is the whole reason the grid exists.

The coverage spec already blessed this from the Tailwind side: *"`px-4.5` is 18px
off `--sp-1`. A React component using off-grid-but-even geometry does not need a new
token; it needs the fraction."* This spec generalises that from Tailwind's fraction
syntax to `calc()` in every layer.

The two genuinely odd values — 9px and 5px, one site each — are not `4n ± 2` and do
not derive cleanly. They snap.

### Borders

Pure cleanup, no design content: 42×`1px` → `var(--bw)`, 3×`2px` →
`var(--bw-strong)`, and the single `3px` site is inspected — most likely
`--bw-strong` or a derivation.

## Beyond size and space: what else the promise needs

The families above answer the size question. A survey of every dimension-valued
property in the React layer found that the layer is **not uniformly broken**, and
the pattern is instructive.

**Already adopted, nothing to do:** radius (48 `var(--r-*)` against 1 literal — the
nine `50%` are circles), motion (29 `var(--dur-*)`, 31 `var(--ease-*)`), colour.

The families Arena adopted are the ones **nobody can estimate by eye**. No one
writes a cubic-bezier from memory, so they reach for the token. Everyone writes
`fontSize: 14` from memory. The gate exists because discipline does not survive
values that look guessable.

### 5. Layering (`z`) — a new family, and the most dangerous omission

```
900   Menu, Tooltip          1100  CommandPalette      1     Calendar (local)
1000  Dialog, ConfirmDialog  1190  Onboarding scrim
                             1200  Onboarding coachmark
```

Three defects are visible in that table:

- **`Menu` and `Tooltip` are both 900.** A tooltip on a menu item resolves by DOM
  order, not by design.
- **`Dialog` and `ConfirmDialog` are both 1000** — and `ConfirmDialog` is what opens
  *from* a `Dialog`. It works today by accident of mount order.
- **`Toast` declares no `zIndex` at all.** The one thing that must float above
  everything states nothing.

And `1190` is "just under 1200", legible only by opening `Onboarding.jsx` and
finding the 1200 two lines up.

Layering is not geometry — it is a **system-wide invariant** (what covers what),
currently encoded as magic numbers in five separate files. For a published package
it is worse: a consumer embedding Arena in an app with its own stacking context has
no contract at all.

The family declares the **order**, and the values stop mattering: `z.dropdown`,
`z.tooltip` (above dropdown, which fixes the first defect), `z.modal`,
`z.modal-nested`, `z.toast`. Exact names and count come from the per-site pass.

`Calendar`'s `zIndex: 1` stays a literal on purpose — it is *local* stacking inside a
positioned container and does not join the global order. The gate must allow it, or
it will report the one correct site as a defect.

### 6. `ls` (tracking) — an existing family nearly disconnected from practice

Tokens: `tight -0.02`, `normal 0`, `label 0.22`, `wide 0.34`. They cover **5 of 24**
real uses, and `ls.wide` has **zero uses in the entire repo** — dead API, deleted.

Sorted by value, the 24 sites form a role hierarchy nobody named:

```
.22em  Card, Dialog, ConfirmDialog, Onboarding   section eyebrow
.2em   ChartCard, StatCard                       the same role, 0.02 apart
.14em  Input, Select, Textarea, ConfirmDialog    field label
.12em  Table, Calendar, Toast                    column header / micro-label
.1em   Badge, BulkActionBar                      badge
.06em  Alert, Toast, Calendar, Onboarding        uppercase status
.04em  Breadcrumbs, BulkActionBar                mono navigation
.02em  Avatar                                    initials
.01em  Button                                    button label
```

**Tracking decreases as the text gets longer.** That is a coherent system, in
service, undeclared. And `ChartCard` and `StatCard` render the same eyebrow as
`Card`/`Dialog`/`ConfirmDialog`/`Onboarding` at `.2em` instead of `.22em` — one
role, two values, 0.02 apart, invisible by eye and purely accidental. `ls.label` is
already 0.22; those two sites simply never read it.

The family is re-derived from the hierarchy above rather than merely adopted.

### 7. `lh` (line height) — an existing family, under-populated

Tokens: `tight 0.98`, `snug 1.15`, `body 1.6`. They cover 5 of 18 uses. `lh.body`
already holds prose. What is missing is the other end: **`lineHeight: 1` (×7) means
"this box is exactly its glyph"**, which is what stops an icon from throwing its
button out of alignment. That is a role, not a number.

It splits editorial/control exactly as `fs`/`dz` do, so the reset belongs to `dz`.

### 8. `fontWeight` — no new family, adoption only

27 literals (600 ×9, 700 ×10, 800 ×8), and `fw` already declares all three
(`semibold`/`bold`/`extrabold`). Same bucket as `border: 1px` → `--bw`.

### Two candidates deliberately rejected

**Opacity** (~9 sites: disabled, dim, hover). Arena already answers this in the
colour channel with `--mute-2-disabled`. On a dark-first system, opacity over a dark
surface is unpredictable in a way a resolved colour is not; an opacity family would
be a second way to say the same thing, and the two would drift.

**Long-form animation durations** (1.15s, 1.4s, 2.4s, 8s, 24s — `Spinner`,
`Skeleton`, `Rotor`). `dur` stops at 420ms because it models UI transitions; an
animation *cycle* is a different quantity. Six sites, left as derivations.

## What this reverses

**`tokens/` and `tokens/src/` are Arena's design source of truth. React, Tailwind
and Angular are faithful reflections of it, not authorities over it.** Where a layer
and the token layer disagree, the layer is wrong.

Three written statements contradict this and change in the same commit:

- `specs/2026-07-18-framework-layer-parity-design.md:225` — *"it remains the
  reference implementation and the design authority"*. It stays the **reference
  implementation**; it stops being the design authority.
- `plans/2026-07-18-framework-layer-token-coverage.md:1573` — *"it stays the design
  authority"*.
- `plans/2026-07-18-framework-layer-token-coverage.md:507` — Task 3's whole
  rationale: *"React is the design authority, so the Tailwind Button must render
  14px — and 14px has no token. This task adds it."* Under the settled rule this
  inverts: `Button` rendering a size the scale does not name **is the defect**, and
  adding `--fs-base` to `fs` would ratify it. **Task 3 is removed from that plan**;
  the value re-appears here as `dz.text`.

The "one-off geometry" permission is stated in four places, all of them in the
coverage documents — **not** in `CLAUDE.md`, which is silent on literal dimensions
today:

- `specs/…-token-coverage-design.md:18` — *"The 155 literal `px` are one-off
  geometry, which the language permits"*
- `specs/…-token-coverage-design.md:200` — the same claim, used to justify scoping
  gate 2 to Tailwind's bracket syntax
- `plans/…-token-coverage.md:1044` and `:1102` — the same, in the gate's own comment

All four are rewritten. Gate 2 keeps its bracket-syntax scope — that scoping stays
correct, and its new justification is that `check-dimension-literals.mjs` covers the
inline-style idiom rather than that the literals are permitted.

`CLAUDE.md` **gains** the rule it never had, in the Architecture section beside the
existing layer contract:

> **A dimension in a framework layer is a token or a derivation of tokens. A bare
> literal is a bug.**

## Keeping it true

A rule written down and hoped for is the failure mode this repo has already been
bitten by twice. The boundary is machine-checked.

`scripts/check-dimension-literals.mjs` scans `frameworks/` for bare literals in
token-governed properties — `fontSize`, `padding*`, `margin*`, `gap`, `border*`,
`width`, `height`, `top`/`right`/`bottom`/`left`, `inset`, `zIndex`, `lineHeight`,
`letterSpacing`, `fontWeight` — and fails on each one. A value passes when it is
`var(--token)`, a `calc()` over `var(--token)`, `0`, or a non-dimension unit the
layer legitimately uses (`%`, `ch`, `fr`).

**The exemptions are named, not inferred**, because two correct sites look exactly
like defects: `Calendar`'s `zIndex: 1` is local stacking inside a positioned
container and does not join the global order, and `borderRadius: '50%'` is a circle
rather than a radius step. Each exemption carries a reason in the script, the way
the coverage plan's eleven token exclusions do.

It joins `bun run check` alongside the coverage plan's three gates. It is the
complement of `check-arbitrary-values.mjs`: that one keys on Tailwind's bracket
syntax, this one on literals in inline style objects — together they close both
idioms.

The script's output is also the authority for the per-site classification, which
means the counts in this document are superseded the moment it exists.

**And it is the proof of the promise, not a tidiness check.** Zero bare literals
means every rendered value resolves from `tokens/src/`, which is exactly the claim
that changing a value there moves every layer.

## What this spec does not decide

**The per-site family assignment.** The boundary is settled; which family each of
the ~290 sites belongs to is not. Classification was done by reading greps, not
exhaustively, and there are real judgement calls — `EmptyState` and `ErrorState`
render their `message` at 14px, but that is prose inside a component, so it is
editorial (→ 15) and not density. The implementation plan carries a classification
pass, and that pass will reassign some sites.

**The visual review of the snapped sites.** Family 1 moves rendered pixels. Those
changes are design changes and need to be looked at, not just compiled.

**The names and values of the two new families.** `z` and `icon` are settled as
families; their step names and exact values come from the per-site pass, which is
the only thing that can say whether the icon scale needs three steps or four.

## Non-goals

- **Changing any colour value.** This spec touches dimension, layering and
  typography metrics only. The palette is untouched.
- **Making the brand assets themeable.** See *What the promise does not include* —
  the fixed hex in `assets/*.svg` is deliberate and stays.
- **Growing the Angular or Tailwind layers.** That is the parity spec; this one
  governs what those manifests may write, and precedes them.
- **Publishing.** `2026-07-18-four-package-build-publish-design.md` still waits on
  parity, which now waits on this.
- **Reopening the 4px grid.** It stays 4px. That is the point of family 4.
- **Adding an opacity family or an animation-cycle family.** Both were considered
  and rejected with reasons; see *Two candidates deliberately rejected*.
