# Arena — Angular layer

Arena support for an Angular 20+/Tailwind-v4 app. Two kinds of artifact:

**Bridge (foundation) — bring Arena's tokens, icons and theming into an existing Angular app:**
- `theme/arena-tailwind.css` — one import that brings Arena's tokens (including
  the self-hosted fonts declared in `contracts/design-generated/fonts.css`, binaries in `assets/fonts/`)
  + the shared `frameworks/tailwind/Theme.css` `@theme` preset into scope.
- `theme/arena-cdk.css` — the `@angular/cdk` overlay's structural stylesheet, re-based onto
  Arena's `--z-*` scale, needed once the app uses a primitive that positions itself with
  `@angular/cdk/overlay`. The file states why the container's z-index is overridden and why
  the four other hardcoded ones are left alone. **It is verified against the installed
  `@angular/cdk` — read [CDK bridge](#cdk-bridge-supported-and-verified) for what that
  means and what it does not.**
- `icons/IconManifest.ts` — canonical Phosphor role→glyph map.
- `theme/ThemeService.ts` + `theme/no-fouc.html` — dark-first signal theme
  service (light = `.arena-light`) and the pre-paint snippet.

**Primitives — Arena's own token-styled components**, and the whole of this layer's
rendering surface: Arena writes the markup, the ARIA and the styling for every control it
ships, so every one of them is in reach of `check:dimensions`, `check:tailwind`,
`check:compliance` and the Angular arm of `check:api` — where a control drawn by somebody
else's library is in reach of none of them. Each lives in
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
`feedback`, `forms`, `navigation`; `forms` is the newest. **Read the set from the tree
rather than from a list here**, because a list here rots and nothing checks it:
`find frameworks/angular/components -mindepth 2 -maxdepth 2 -type d | sort`, and count it
with the same command piped to `wc -l`.

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
migration instead of an import. Angular's `Calendar` binds pattern `absent`, and nothing
has decided whether the layer should gain a schedule view; when one is built, this
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

## What Arena implements, and the two components Angular does not have

Parity here is parity of **outcome**, not of inventory: an Angular consumer can build every
interface an Arena React consumer can, and they build all of it from Arena's own primitives.
No control in this layer is delegated to a third-party component library.

**The two exceptions are absent rather than delegated, and `BehaviourDelegated.json` is the
only trustworthy statement of that set** — `check:behaviour` fails the moment it disagrees
with what this layer implements, where a list written here would rot in silence. Read it
there, and count it with `python3 -c "import json;print(len(json.load(open('frameworks/angular/BehaviourDelegated.json'))))"`.
Both entries bind pattern `absent`: React's `Calendar` is a day/hour schedule grid with
absolutely-positioned `CalendarEvent` blocks, this layer has no such view, and nothing has
decided whether it should gain one.

**Arena writes the markup, the ARIA and the styling, and `@angular/cdk` supplies only what
Arena should not hand-roll** — overlay positioning for a surface anchored to a trigger, and
the roving-focus key managers. Focus trapping stays Arena's own `FocusTrap.ts`, a deliberate port
of React's `UseDialogModal.js`, so the two layers keep solving that contract with the same
code, and `arena-dialog` consumes it rather than `cdk/dialog`.

**The CDK earns its place on an anchored surface and nowhere else, so count its users rather
than assuming.** `grep -rl "@angular/cdk/overlay" frameworks/angular/components` is the answer;
a modal centres in flow and a toast is a card the host places, and neither goes near an overlay.
A styled **native** control does not either: `arena-select` is a real `<select>`, so the popup,
its keyboard and its type-ahead are the user agent's.

**Writing the control is what puts it inside the gates, and that is the standard every
component here meets.** A component whose DOM and CSS belong to somebody else sits outside
`check:dimensions` and `check:tailwind`, because a compiled third-party stylesheet is
invisible to both; outside `check:compliance`, because there is no Arena render to verify;
and outside the Angular arm of `check:api`, which skips a contract no layer implements
there. A primitive is inside all three the day it is written. The argument in full is
`docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`.

### CDK bridge: supported and verified

**`@angular/cdk` is a declared dependency rather than an optional one**, and it is the only
package a primitive's own source imports besides `@angular/core` — measure it rather than
trusting this, with `grep -rho "from '@[a-z@/-]*'" --include='*.ts' --exclude='*.test.ts'
--exclude='*.card.entry.ts' frameworks/angular/components/ | sort -u`. A primitive that
positions an overlay imports it, so it is pinned in the root `package.json` at an exact
version, and the app must import `theme/arena-cdk.css` once.

**The bridge is verified, not rendered.** `bun run check:cdk` reads the bridge with
`scripts/lib/css-decls.mjs` and asserts that every Arena token it references exists and that
every `cdk-*` class it overrides is one the installed `@angular/cdk` really defines. It
checks the **selectors** as well as the values, which it can because
`@angular/cdk/overlay-prebuilt.css` ships installed and is the oracle: a class renamed
upstream leaves the override matching nothing, and that is decidable against the sheet. It
also carries four zero-result guards — no rule, no `cdk-*` class, no `var()`, no `@import` —
so a bridge that has stopped being a bridge cannot pass by having nothing left to check.

**What the gate does not cover** is whether an override's *value* is the right one for the
class it lands on — the gate reads names and selectors, never paint, so only a real render
catches that. `Tooltip.card.html` and `Menu.card.html` are that render: both open a real CDK
overlay in a real browser, which is where a z-index that stacks wrongly is visible at all.
`check:cdk` fails the moment the bridge and the installed package disagree.

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

Both are layer-wide and silent, and both are recorded in [`DOUBTS.md`](../../DOUBTS.md) —
the boolean one in section 4, the attribute one in section 3, alongside the command that
measures which primitives it reaches.

**A bare boolean attribute resolves to `true`.** Every boolean input here is a signal
`input(false, { transform: booleanAttribute })`, so `<arena-alert dismissible>` is `true`.
The equivalence to a native HTML boolean attribute stops there: `booleanAttribute`
special-cases the literal string `"false"` as `false`, where a native attribute stays set
on any present value. Binding (`[dismissible]="true"`) is the clearer form.

**An input named after a native attribute leaves the native attribute behind — and every
primitive that takes one now clears it.** Angular writes a static attribute to the DOM during
the creation pass whether or not it also matches an input, so `<arena-page-head title="Projects">`
left a real `title` on the host and the browser drew a tooltip over the whole header. Each
affected primitive carries `'[attr.title]': 'null'` (or `'[attr.name]': 'null'`) in its host
block, and `HostClassBinding.test.ts` asserts it both ways: a primitive that takes the input and
does not clear it fails, and so does one that clears an attribute it takes no input for. **Read
the guard, not a count** — the figure here was wrong three times, most recently by measuring only
host-bound primitives when the defect never depended on host-binding.

## Adopting it

Adopt it in the order the layer is built. Import `theme/arena-tailwind.css` once from the
app's global stylesheet for the tokens and the `@theme` preset; add `theme/arena-cdk.css`
when you first use a primitive that positions an overlay. Wire `ThemeService` and paste
`theme/no-fouc.html`'s script contents into `index.html`. Then replace the app's own
controls with `arena-*` primitives as you touch the files that use them — incrementally,
never as a sweep.
