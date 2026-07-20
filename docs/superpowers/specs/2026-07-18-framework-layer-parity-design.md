# Framework layer parity — Angular and Tailwind — Design

**Status:** approved in design; **amended 2026-07-19** — see `2026-07-19-token-debt-and-gate-blind-spots-design.md`.
Two counts below have moved: `ChartCard` gets a manifest (the exclusion's argument —
path data, not class strings — describes the three SVG charts, not a bordered tile), so
the layer ships **36** manifests rather than 35 and the charts' exception covers
BarChart, LineChart and DoughnutChart. And the plan splits in two: `5a` (Angular
primitives + the gates) and `5b` (the orphan manifests).
**Date:** 2026-07-18
**Execution order:** plan 5 of 6
**Depends on:** `2026-07-18-framework-layer-token-coverage-design.md` (plan 3) — hard prerequisite — and `2026-07-18-token-geometry-boundary-design.md` (plan 4), added later to the chain
**Blocks:** `2026-07-18-four-package-build-publish-design.md` (plan 6) — publication waits on this

> **Plan 4 governs what the 34 manifests written here may contain.** It settles that
> a dimension is a token or a derivation of tokens and that a bare literal is a bug,
> and it resolves the 37 off-scale sizes **once**, by sorting them into families,
> rather than at each manifest that happens to need one. Writing the manifests before
> it means taking that decision 34 times with 34 rationales. It also adds two token
> families the manifests will reference, `icon` and `z`.

## Problem

React ships 40 components. Angular ships one (`tag`). Tailwind ships one manifest
(`Button`), and the two are not even the same component. The four-package spec plans
to publish `@dravensoft/arena-angular` and `@dravensoft/arena-tailwind`, which as the
tree stands would put two packages on the public registry, under the Arena name,
containing one component each.

The decision taken on the packaging spec was **option 3: grow the layers first, then
publish all four together**. This spec is that growth.

## What parity means, and what it does not

The obvious reading — "Angular implements the same 40 components React does" — is
wrong here, and following it would damage the layer.

`frameworks/angular/README.md` already states the layer's purpose:

> **Primitives — token-styled components Material does not provide.**

The Angular layer was designed as **bridge plus gap-fillers**. `arena-material.css`
maps Arena's tokens onto Angular Material's `--mdc-*` / `--mat-*` variables, so every
Material control already renders in Arena. Roughly half of Arena's 40 components are
things Material provides and has hardened over years — keyboard a11y, CDK overlay
positioning, i18n, focus management. Reimplementing them as `arena-*` would duplicate
that work badly, contradict the layer's stated purpose, and strip `arena-material.css`
of most of its reason to exist.

**So parity here is parity of outcome, not of inventory:** an Angular consumer can
build every interface an Arena React consumer can build. Some of it they build with
Material wearing Arena; the rest with Arena's own primitives.

### The split, stated exactly

**Material provides these 21. Arena dresses them and implements none of them.**

| Arena component | Angular Material |
|---|---|
| Button, IconButton | `mat-button`, `mat-icon-button` |
| Input, Textarea | `mat-form-field` + `matInput` |
| Select | `mat-select` |
| Checkbox, Radio | `mat-checkbox`, `mat-radio-group` |
| Switch | `mat-slide-toggle` |
| SegmentedControl | `mat-button-toggle-group` |
| Card | `mat-card` |
| Badge | `matBadge` |
| Table | `mat-table` |
| Tabs | `mat-tab-group` |
| Dialog | `MatDialog` |
| Menu | `mat-menu` |
| Tooltip | `matTooltip` |
| Toast | `MatSnackBar` |
| Pagination | `mat-paginator` |
| ProgressBar | `mat-progress-bar` |
| Spinner | `mat-progress-spinner` |
| Calendar | `mat-datepicker` |

**Arena implements these 19 as `arena-*` primitives.** Material has no equivalent.

```
Rotor  BarChart  ChartCard  DoughnutChart  LineChart
Avatar  Skeleton  StatCard  Tag
Alert  ConfirmDialog  EmptyState  ErrorState  Onboarding
Breadcrumbs  BulkActionBar  CommandPalette  PageHead  ThemeToggle
```

`tag` exists, so **18 are new**.

### The Tailwind layer is scoped differently, and here is why

A manifest's consumers are not the same as a primitive's. **React does not consume
manifests at all** — its components are inline-style and token-driven by design. So a
manifest serves two audiences: Arena's own Angular primitives, and the third-party
consumer that `frameworks/tailwind/README.md` explicitly courts, building with raw
`className` or `cva` on neither React nor Material.

That second audience is building a whole application. It needs the controls and
containers, not only the gap components. Scoping the Tailwind layer to just the
Angular primitives would publish a layer that advertises framework-neutrality and
cannot dress a form.

**So Tailwind ships 35 manifests: all 40 minus the 4 charts and `Calendar`.** The
exclusions are technical, not editorial:

- **The 4 charts** are SVG geometry driven by measured container width. Their visual
  identity is path data and attribute bindings, not class strings. A manifest cannot
  express them, and one that tried would be a lie about where their styling lives.
- **`Calendar`** is 199 lines of date arithmetic and JS responsive branches. What a
  manifest could capture is a fraction of it, and the fraction would drift from the
  rest.

`Button.manifest.json` already exists, so **34 are new**. 15 of the 35 have an Angular
primitive consuming them; 20 do not, and §"Gates" says what holds those up.

## Design

### 1. One home for recipes, one direction of dependency

`frameworks/tailwind/components/<Component>.manifest.json` is the single home for
every styling recipe, as the coverage spec establishes. An Angular primitive **defines
no styling of its own**: it imports its manifest through the shared `tv`
(`frameworks/tailwind/tv.ts`) and binds the resulting class strings.

```
frameworks/tailwind/components/Alert.manifest.json     <- the styling, as data
frameworks/angular/primitives/alert/alert.variants.ts  <- tv(manifest)
frameworks/angular/primitives/alert/alert.ts           <- markup + signals, no styles
```

This is the architecture `CLAUDE.md` already describes and the tree does not yet have.
Today `tag` defines its recipe inline; the coverage spec converts it, and it becomes
the reference shape every other primitive follows.

**The charts are the one declared exception.** They have no manifest, so their four
`*.variants.ts` files do not exist. Their styling is attribute bindings onto tokens
(`[attr.fill]="'var(--color-cat-1)'"`), exactly as React's charts do it. The exception
is written down here so that a missing chart manifest reads as a decision.

### 2. Each primitive stays a quartet

The Angular quartet is unchanged from what `CLAUDE.md` and the Angular README already
require, and every new primitive ships all of it:

- `<name>.ts` — standalone, `OnPush`, `arena-` selector, signal I/O, no component `styles`
- `<name>.variants.ts` — `tv()` over the manifest (absent for the 4 charts)
- `<name>.prompt.md` — usage, examples, Do/Don't
- a barrel entry, and an export from `primitives/index.ts`

Conventions carry over without exception: dark-first (`.arena-light` for light),
danger is outline, Phosphor icons (Bold default), no gradients, no emoji, English
only, no comments beyond one JSDoc line.

### 3. Verification — three gates, because Angular cannot demo the way React does

This is the part the current layer has nothing of, and the reason `tag` has sat
unexercised since it was written.

React's demos work because `jsx-loader.js` transpiles JSX in the browser with Babel
standalone — no build step. **Angular cannot do that.** Its decorators and templates
need real compilation; Babel standalone does not process them. Shipping 18 primitives
with no way to see or exercise them would repeat, eighteen times, the thing that
already went wrong once.

The way out comes from a property the layer already has: **an Angular primitive
carries no styling of its own, and its recipe is data.**

**Gate 1 — static specimen from the manifest.** A `*.card.html` page reads
`frameworks/tailwind/components/<Component>.manifest.json`, applies the compiled
Tailwind CSS, and renders the component's real markup. Because the manifest *is* the
styling, what the page shows is the true visual result — with no Angular executed and
no build step, matching how every other specimen page in the repo works. This is what
makes an Angular primitive reviewable by eye.

**Gate 2 — the layer compiles.** `bun scripts/check-angular.mjs` builds the layer with
`ng-packagr` under `strictTemplates`, and fails on any primitive that does not compile
or whose template references something that does not exist.

**This spec installs `ng-packagr` itself.** An earlier draft said the packaging plan
already installs it — true, but packaging runs *after* this work, so at gate-2 time it
would not be there. It and the Angular compiler peers (`@angular/{core,common,compiler,compiler-cli}`,
`typescript`) become dev dependencies here, and the packaging plan then finds them
present rather than adding them.

**Gate 3 — every class resolves to a token.** The coverage spec's preset-compile gate,
extended to compile every manifest and assert each utility resolves to an Arena token
value. This is what holds up the 20 manifests with no Angular consumer: they cannot
rot silently, because a class that stops resolving fails the build.

Gate 3 is why the coverage spec is a hard prerequisite rather than a nice-to-have.

### 4. Order of work — vertical slices

The unit of work is a **component**, not a layer: manifest, primitive, specimen and
prompt land together, gated, and are independently reviewable.

This is a direct response to evidence in the tree. `Button.manifest.json` was authored
with no consumer, was never exercised, and accumulated five arbitrary values that
violate the layer's own stated rule. Authoring 35 manifests before writing anything
that consumes them would reproduce that condition thirty-five times.

**Phase 1 — the 15 paired slices.** Each is one manifest + one Angular primitive +
one specimen. `tag` is the first and arrives from the coverage spec; 14 follow:
Avatar, Skeleton, StatCard, Alert, ConfirmDialog, EmptyState, ErrorState, Onboarding,
Breadcrumbs, BulkActionBar, CommandPalette, PageHead, ThemeToggle, Rotor.

**Phase 2 — the 4 Angular charts.** BarChart, ChartCard, DoughnutChart, LineChart.
No manifests. The one genuinely new engineering: React measures its container with
`useContainerWidth`; the Angular equivalent is a `ResizeObserver` behind a signal.
That helper is written once and shared by all four, and it is the Angular idiom for
the same rule `CLAUDE.md` states — responsive branches measure the container, never
the viewport, and are code rather than media queries. It is named `container-size.ts`,
not `use-container-size.ts`: a signal-returning function is not a React hook, and
carrying the `use` prefix across would import an idiom the layer does not use.

**Gate 1 does not reach the charts**, since they have no manifest to render from. They
are verified by gate 2 plus a direct comparison against React's `charts.card.html` —
both layers draw the same SVG from the same tokens, so a visual difference is a defect
in one of them. This is the one place in the project where review is by eye against
the reference implementation rather than against a specimen of its own.

**Phase 3 — the 20 orphan manifests.** The Material-covered components that a
framework-neutral consumer hand-rolls: Button (already present, corrected by the
coverage spec), IconButton, Input, Textarea, Select, Checkbox, Radio, Switch,
SegmentedControl, Card, Badge, Table, Tabs, Dialog, Menu, Tooltip, Toast, Pagination,
ProgressBar, Spinner. Each ships with a specimen page, which is also what exercises
it — gate 3 proves the classes resolve, and the specimen proves they compose into the
component Arena's README specifies.

Phases 1 and 2 unblock `@dravensoft/arena-angular`. All three unblock
`@dravensoft/arena-tailwind`.

## Non-goals

- **The 21 Material-covered components as `arena-*` primitives.** Stated at length
  above. Material provides them; `arena-material.css` dresses them.
- **Manifests for the 4 charts and `Calendar`.** Not expressible as class strings.
- **Any change to the React layer.** It remains the **reference implementation** —
  where an Angular primitive and a React component disagree on *shape or behaviour*,
  the React one is right.

  **It is not the design authority.** `tokens/src/` is
  (`2026-07-18-token-geometry-boundary-design.md`, plan 4). Where a React component
  and the token layer disagree on a *value*, the React component is wrong — and plan 4
  repairs it before this spec runs, so nothing here needs to. The coverage spec's
  audit found React healthy against the rule it tested (no raw hex, no missing
  tokens); it did not test whether a dimension resolves from the token layer at all,
  and mostly it does not.
- **Any change to `tokens/`, to the token build, or to a token value.** This spec
  consumes tokens; plan 3 exposes them and plan 4 completes them.
- **A compiled Angular demo application.** It would be the most faithful verification
  and it would put build output, or a build step, in a tree whose demos are static by
  doctrine. Gates 1 and 2 buy most of the confidence at none of that cost.
- **Publishing.** That is the packaging spec, which waits on this one.

## Verification

- `bun scripts/check-angular.mjs` — the 19 primitives compile under `strictTemplates`.
- The coverage spec's preset gate compiles all 35 manifests; every utility resolves to
  an Arena token value.
- The arbitrary-value gate finds none anywhere under `frameworks/`.
- `bun run demos`, then each new `*.card.html`: every specimen renders the component,
  in dark and in light, and in `.arena-compact`. The 4 charts have no specimen and are
  compared against React's `charts.card.html` instead.
- Every primitive is a complete quartet; a missing `.prompt.md` or barrel entry fails
  review.
- `frameworks/react/` is byte-unchanged: `git diff --stat main -- frameworks/react/`
  is empty.
- Spot-check against the reference implementation: each new specimen is compared against its
  React `*.card.html` counterpart, and any visual difference is either a React bug
  filed separately or a defect in the new primitive.

## Affected files

**New:** 34 manifests under `frameworks/tailwind/components/`; 18 primitive
directories under `frameworks/angular/primitives/<name>/` (each `.ts`, `.variants.ts`,
`.prompt.md`, `index.ts`); one shared `frameworks/angular/primitives/container-size.ts`;
specimen `*.card.html` pages for the 35 manifests; `scripts/check-angular.mjs`.

**Edited:** `frameworks/angular/primitives/index.ts` (barrel), `frameworks/angular/README.md`
(the primitive inventory and the Material split), `frameworks/tailwind/README.md`
(the manifest inventory and the charts/Calendar exclusion), `CLAUDE.md` (the Angular
layer is no longer "one reference primitive"), `CHANGELOG.md`.

**Unchanged, explicitly:** every file under `frameworks/react/`, every file under
`tokens/`, `styles.css`, the plugin manifests, `support.js`, `theme.js`,
`jsx-loader.js`.

## Sequencing

```
1. framework-layer token coverage   <- hard prerequisite; without it every new
                                       recipe is born needing arbitrary values
2. THIS SPEC, phases 1 -> 2 -> 3
3. four-package build + publish      <- its plan is written and waiting
4. create the npm org, first publish
```
