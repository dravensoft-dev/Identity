# Arena — Angular layer

Arena support for an Angular 20+/Tailwind-v4 app. Two kinds of artifact:

**Bridge (foundation) — make an existing Angular/Material app wear Arena:**
- `theme/arena-tailwind.css` — one import that brings Arena's tokens (including
  the self-hosted fonts declared in `contracts/design-generated/fonts.css`, binaries in `assets/fonts/`)
  + the shared `frameworks/tailwind/Theme.css` `@theme` preset into scope.
- `theme/arena-material.css` — maps Arena tokens onto Angular Material's
  `--mat-*` custom properties so the components below render in Arena. What it covers:
  the outlined form
  field, cards, dialogs, tables, tabs, the snackbar, spinner/progress-bar, and
  **SideNav** — `mat-nav-list` with `<a mat-list-item [activated]>`. **The bridge is
  verified against Angular Material 22.0.5 — read
  [Material bridge](#material-bridge-supported-and-verified) for what that means and
  what it does not.** SideNav is the
  one component of its spec that stays a Material bridge rather than becoming an
  `arena-*` primitive: `mat-nav-list` already handles the anchor-or-button
  distinction, the active state and the keyboard behaviour, so reimplementing it
  would duplicate hardened accessibility. Its active-item styling
  (crimson on crimson-soft, semibold) comes from the `.arena-side-nav` rules in
  `arena-material.css`:
  ```html
  <mat-nav-list class="arena-side-nav" aria-label="Primary">
    <a mat-list-item href="/overview" [activated]="section === 'overview'"
       [attr.aria-current]="section === 'overview' ? 'page' : null">Overview</a>
    <a mat-list-item href="/projects" [activated]="section === 'projects'"
       [attr.aria-current]="section === 'projects' ? 'page' : null">Projects</a>
  </mat-nav-list>
  ```
  `[activated]` is Material's visual state; `aria-current="page"` is the one a screen
  reader announces. Both are required — set only `[activated]`, and the visual state
  and the announced one disagree.
- `icons/IconManifest.ts` — canonical Phosphor role→glyph map.
- `theme/ThemeService.ts` + `theme/no-fouc.html` — dark-first signal theme
  service (light = `.arena-light`) and the pre-paint snippet.

**Primitives — Arena's own token-styled components.** Most cover ground Material never did;
a growing number deliberately replace something Material does provide, because a
delegated control sits outside three of Arena's gates. Each lives in
`components/<category>/<component-kebab>/` and is a
quartet: `<Component>.ts` (standalone, `OnPush`, signal I/O, `arena-` selector),
`<Component>.variants.ts` (a `tailwind-variants` recipe built with the shared `tv`),
`<Component>.prompt.md` (usage + Do/Don't), and an `index.ts` barrel.
`components/display/tag/` is the
reference shape. The three SVG charts are the one exception and have no
`<Component>.variants.ts` — see below. The category is the one
`frameworks/Components.json` declares, and the file-naming rule is the repo-wide one
`CLAUDE.md` states: directories kebab-case, file names capital-initial. Each component's
own tests sit in that same directory as `<Component>.<facet>.test.ts`.

The layer spans all six categories the layout rule allows — `brand`, `charts`, `display`,
`feedback`, `forms`, `navigation`. `forms` is the newest, and it fills as Plan D moves the
delegated controls in, one batch at a time. **Read the set from the tree rather than from a
list here**, because a list here rots with every batch and nothing checks it:
`find frameworks/angular/components -mindepth 2 -maxdepth 2 -type d | sort`.

**`SideNav` is not among them, and that is the rule working.** Material's `mat-nav-list`
covers the item list, so Arena dresses it in `arena-material.css` (`.arena-side-nav`)
rather than reimplementing it. Its Tailwind manifest is future work, for consumers on
neither React nor Material.

**The three SVG charts are the declared exception**, and a missing chart manifest is a
decision rather than an omission: a chart's visual identity is path data and attribute
bindings, not class strings, so `bar-chart`, `line-chart` and `doughnut-chart` have no
`*.variants.ts` and style themselves with token-valued style **objects** — the camelCase
`[style]` form, never a kebab-case string or attribute, because that is the only shape
`check:dimensions` can actually read. `chart-card` is not one of them: it is a bordered
tile with a microlabel, so it has a manifest like every other expressible component.

Four shared files are not components, and each sits at the narrowest level that contains
all of its consumers rather than in one shared bucket:
`ContainerSize.ts` (the host element's width as a signal, plus `readBreakpoint`),
`FocusTrap.ts` (the shared overlay focus trap, generalized out of `confirm-dialog` and
used by it, `command-palette` and `onboarding`) and `ProjectionMarkers.ts` (the `[action]`,
`[actions]`, `[brand]` and `[footer]` marker directives that let a component
detect whether an optional slot was projected, so its spacing wrapper can be gated —
each bare, with no `arena-` prefix, because the attribute is the contract member's
name, per `contracts/api/README.md`'s binding table) all have consumers in more than one category,
so they sit at the layer root and `frameworks/angular/index.ts` names each of them
directly. `DataVisuals.ts` (the chart maths and the identity-or-meaning colour contract)
sits at the layer root beside them, and it is the one that is there by decision rather
than by the rule: in this layer its consumers really are the three charts alone, so
`components/charts/` would satisfy the rule. That narrow consumer set is an artifact of
Angular having no `Calendar` at all — React's `Calendar` imports `catColor` from the same
module, so React's copy belongs at the layer root by the rule, and leaving the two layers
spelling one module at two different paths would make the eventual move a second
migration instead of an import. Angular's `Calendar` is `absent` rather than delegated, so
this is a gap that Plan D deliberately does not close; when a schedule view is built, this
module is already where it needs to be. The name matches the placement: a module a
schedule grid consumes is not "chart internals".

A primitive defines no styling of its own. Its recipe lives in
`frameworks/tailwind/components/<category>/<component-kebab>/<Component>.manifest.json`
— the same category — and reaches the
component through the shared `tv`:

```ts
import { tv } from '../../../../tailwind/Tv';
import manifest from '../../../../tailwind/components/display/tag/Tag.manifest';

export const tagStyles = tv(manifest);
```

The manifest import is **extensionless on purpose**: the generated `Tag.manifest.ts`
and its source `Tag.manifest.json` sit beside each other, and TS and bun probe `.ts`
before `.json`, so this resolves to the literal-typed build output. A bundler
configured `.json`-first would silently widen every variant back to `string`.
`Tag.variants.ts` carries that warning in the file, as the doc comment on `tagStyles`.

## Conventions

Standalone (no `NgModule`), `OnPush`, `input()`/`output()`/`model()`, `inject()`
for DI, capital-initial filenames with no type suffix, `arena-` selector prefix, no
component `styles` (recipe owns styling), no comments beyond one JSDoc line,
barrels with no `../` imports inside the layer. Dark-first (`.arena-light` for
light). Danger is outline. Icons are Phosphor (Bold default). No gradients, no emoji.

## What Material provides, what Arena implements, and where that is going

Parity here is parity of **outcome**, not of inventory: an Angular consumer can build
every interface an Arena React consumer can. Some of it they still build with Material
wearing Arena (`theme/arena-material.css`), the rest with Arena's own primitives — and
the balance is **moving**, one batch at a time, toward the primitives.

**What is still delegated is the key set of `BehaviourDelegated.json`, and that file is
the only trustworthy statement of it** — `check:behaviour` fails the moment it disagrees
with what this layer implements, where a list written here would rot in silence. Read it
there, and count it with `python3 -c "import json;print(len(json.load(open('frameworks/angular/BehaviourDelegated.json'))))"`.
Two of its entries are `absent` rather than delegated: `Calendar` and `CalendarEvent`.
Material's datepicker is a month/date-selection grid, not Arena's day/hour schedule view
with event blocks, so there is no control for those two to delegate to.

`arena-material.css` dresses only a subset of the delegated set:
Input and Textarea (outlined appearance only — a form field left on Material's default
fill appearance keeps Material's own styling), Card, Table, Tabs, Dialog, Toast,
ProgressBar, Spinner and SideNav. The rest still render with Material's own defaults. A
`dressedBy` key on a delegated entry is the per-component record, and **nothing checks
it** — `check:material` reads the CSS and never that file.

**The direction is Arena's own primitives, built on the CDK.** `Button` and `Tooltip` are
the first two, and they set the shape the rest follow: Arena writes the markup, the ARIA
and the styling, and `@angular/cdk` supplies only what Arena should not hand-roll —
overlay positioning for a surface anchored to a trigger, and the roving-focus key
managers. Focus trapping stays Arena's own `FocusTrap.ts`, a deliberate port of React's
`UseDialogModal.js`, so the two layers keep solving that contract with the same code.

Delegation is not free, and the three prices are why this is moving. A delegated
component sits outside `check:dimensions` and `check:tailwind`, because Material's
compiled CSS is invisible to both; outside `check:compliance`, because there is no Arena
render to verify; and outside the Angular arm of `check:api`, which skips a contract no
layer implements there. A primitive is inside all three the day it is written. The
argument in full is Plan D, in
`docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`.

### Material bridge: supported and verified

**The primitives stand alone.** No file under `frameworks/angular/components/` imports
`@angular/material` — verify with `grep -rn '@angular/material'
frameworks/angular/components/`, which returns nothing, so a consumer can use every
primitive with no Material installed at all. When
the Angular layer is published (plan 6), `@angular/material` will be an **optional** peer
dependency; nothing here requires it today.

**`@angular/cdk` is different, and is a declared dependency rather than an optional
one.** A primitive that positions an overlay imports it, so it is pinned in the root
`package.json` at the same exact version Material's own peer range names, and the app
must import `theme/arena-cdk.css` once — see that file for why the container's z-index
is overridden and why the four other hardcoded ones are left alone. `check:cdk` verifies
the bridge the way `check:material` verifies the other, and additionally checks the
selectors, which it can because the prebuilt sheet is the oracle.

**Material remains the bridge for what is still delegated**, and `arena-material.css`
carries rules for these: the
outlined form field, cards, dialogs, tables (plus the header cell), tabs, the
snackbar, the progress spinner and bar, and SideNav's nav list. It maps Arena tokens
onto Angular Material's `--mat-*` custom properties so those render in Arena instead
of stock Material; the rest of Material's components still render with Material's own
defaults.

**The bridge is verified, not rendered.** `bun run check:material` pulls every custom
property `arena-material.css` sets out of the file with `scripts/lib/css-decls.mjs` and
asserts each one is a name the installed Angular Material package actually reads, and
that every Arena token it references exists. What the gate does **not** cover: it checks
that a name exists, not that it is the right name for the element being styled — that
distinction is exactly the class of error that hit this file once already, and only a
real render catches it. It has one further limit, disclosed in full in
`scripts/check-material.mjs`'s header: it never examines the selectors those properties
sit in, so a selector renamed upstream would break the bridge with the gate still green.
There is no Angular Material application in this repo, so the
bridge has been verified name-by-name against the installed package, not visually
confirmed in a running app.

**It targets Angular Material 22.0.5.** That version is pinned as a devDependency in the
root `package.json` — a bridge with no stated target version cannot be falsified, and
`check:material` fails the moment the bridge and the installed package disagree.

## Verifying the layer

`bun run check:angular` compiles every primitive with `ngc` under `strictTemplates`
(`tsconfig.check.json`), and it reaches a primitive **through the barrel** — a
primitive missing from its own `index.ts`, its category's, `components/index.ts` or the
layer's `index.ts` is not typechecked. Each manifest-backed
primitive also has a static specimen at
`frameworks/tailwind/components/<category>/<component-kebab>/<Component>.card.html`,
which renders the real markup
with the real recipe and no Angular executed. A specimen therefore proves the *recipe*,
never the *component*: it hand-builds the DOM from the manifest, so a component-logic
bug can render correctly in the card while being broken in the primitive. The three SVG
charts have no specimen at all, by the same exception that gives them no manifest.

**What proves the component is a demo page, and there is one per primitive that has earned
it.** `<Component>.card.html` beside the component runs the real primitive in a real browser,
which is where motion, focus rings and layout live — none of them observable in happy-dom.
`bun run demos` builds the pages and serves them; the build is `bun run build:angular-demo`,
two steps because neither tool does the other's job: `ngc -p tsconfig.demo.json` compiles the
templates AOT, and `Bun.build` bundles that output for a browser, one shared Angular chunk
across every page. An entry imports `@angular/compiler` because `@angular/*` ships partially
compiled and its injectables need the JIT fallback; without it the page throws before mounting.

The bundle is git-ignored build output, which is why **no Angular page declares `@dsCard`**: on
a fresh clone the page renders blank, and `check:cards` would pass it for having nothing to
overflow. `check:angular-demos` is the portable gate instead — it needs no browser and no
bundler, and its `PAGED` set is the coverage record, so a page that exists undeclared and a
declared page that is missing both fail. Coverage is partial and grows one component at a time.

## Two traps this layer's idiom sets

Both are layer-wide and silent, and both are recorded in
[`DOUBTS.md`](../../DOUBTS.md) section 4 with the full list of affected primitives.

**A bare boolean attribute resolves to `true`.** Every boolean input here is a signal
`input(false, { transform: booleanAttribute })`, so `<arena-alert dismissible>` is `true`.
The equivalence to a native HTML boolean attribute stops there: `booleanAttribute`
special-cases the literal string `"false"` as `false`, where a native attribute stays set
on any present value. Binding (`[dismissible]="true"`) is the clearer form.

**An input named after a native attribute leaves the native attribute behind.** Angular
writes a static attribute to the DOM during the creation pass whether or not it also
matches an input, so `<arena-page-head title="Projects">` leaves a real `title` on the host
and the browser draws a tooltip over the whole header. Nine primitives are affected. Bind
the input (`[title]="…"`) rather than setting it as an attribute.

## Adopting it

Adopt it in the order the layer is built. Import `theme/arena-tailwind.css` once from the
app's global stylesheet for the tokens and the `@theme` preset; add `theme/arena-cdk.css`
when you first use a primitive that positions an overlay; add `theme/arena-material.css`
**after** Material's own theme for as long as the app still renders Material controls.
Wire `ThemeService` and paste `theme/no-fouc.html`'s script contents into `index.html`.
Then replace controls with `arena-*` primitives as you touch the files that use them —
incrementally, never as a sweep.
