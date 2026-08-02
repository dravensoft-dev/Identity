# Equal demo pages: a generated per-component playground in both layers

## Context

The React and Angular demo pages drifted apart because nothing holds them together. Each
page is hand-written, so `ToastHost` differs by a scroll-runway section that only Angular
has, and 47 pages carry 47 copies of the same `.sub`/`.row` chrome with six variants of it.
React's 22 pages are worse than unequal: 8 of them are *composite*, covering four or five
components each, so 20 components have no page of their own to compare against Angular's.

Debugging a visual difference between the two layers therefore means reproducing a
configuration by hand, twice, on two pages that were never the same to begin with.

This change replaces every hand-written demo page in both layers with a **generated
per-component playground**: one page per component per layer, emitted from the component's
own API contract plus one layer-neutral fixture. Knob state rides in the query string, so
the same URL opened on the React page and the Angular page shows the same configuration, and
the comparison is pixel to pixel.

The two layers are equal **by construction**, not by convention: one generator, one model,
and a gate asserting the emitted knob model is byte-identical across layers.

### Decisions taken with the user

- The playground **replaces** the demo pages. The 22 React `*.card.html` and 25 Angular
  `*.card.html` are deleted. The `group="Components"` cards disappear from the external
  `@dsCard` renderer; that loss was accepted knowingly (Tailwind's 43 specimens are a
  different group, prove the *recipe*, and cover neither the compound children nor the three
  SVG charts).
- Unit is **one page per component**: 55 per layer, 1:1 with `contracts/api/components/*.json`.
  A compound child renders inside the minimum valid parent, named by its fixture.
- Everything is generated. The only authored artifact is the fixture.
- The page carries: knob panel, live render, **event log**, **theme + density toggle**, and
  **knob state in the URL**. No code-snippet emitter (deferred).
- The new gate carries a **browser smoke pass over all 110 pages**, recovering the real-Chromium
  coverage that `check:cards` gave React and extending it to Angular, which never had it.

## Ground truth verified

- 55 contracts, 55 React component directories, 55 Angular ones; the two trees are
  byte-identical in shape. (CLAUDE.md's "50/50" prose is stale and gets corrected.)
- 412 members: 228 primitive, 46 event, 38 enum, 38 slot, 17 array, 7 object, 1 functionInput,
  **0 consumerData**, **0 parameterised slots** (and none is reachable: `classify()` in
  `scripts/lib/arena/api-surface.mjs` throws on the only spelling either layer has).
- Event payloads are exactly nine shapes: void, `string`, `number`, `boolean`, and five named
  objects. Zero enum payloads, zero platform payloads.
- All 7 `object` members are optional; the seed burden is the 17 arrays and the 25
  `input.required` members.
- `frameworks/demos/` is safe as a new sibling: `layerFiles()` in
  `check-layer-independence.mjs` starts at `frameworks/<layer>`, and `check:structure` reads
  only `frameworks/<layer>/components`. `contracts/` is **not** the home: `check-contracts.mjs`
  hardcodes `contracts/api`'s inner directories as exactly `['components','types']`.
- `check-generated.mjs` scans no `.html`, so the generated pages need no `UNTRACKED` entry;
  the `.tsx`/`.ts` families do.
- `.gitignore` already carries `/frameworks/**/*.generated.*`. No edit needed.

## What lands

### Authored, tracked

| Path | What |
|---|---|
| `frameworks/demos/<Name>.demo.json` × 55 | the layer-neutral fixture (schema below) |
| `frameworks/demos/README.md` | normative fixture schema |
| `scripts/lib/arena/playground-model.mjs` + `.test.mjs` | `playgroundModel(contract, fixture, types)`; pure, no fs. **The single derivation, and therefore the only place the two layers could disagree.** |
| `scripts/lib/react/playground-react.mjs` + `.test.mjs` | `reactPage(model)`, `reactEntry(model)` |
| `scripts/lib/angular/playground-angular.mjs` + `.test.mjs` | `angularPage(model)`, `angularEntry(model)` |
| `scripts/generate/arena/generate-playgrounds.mjs` + `.test.mjs` | the driver; `generate:playgrounds` |
| `scripts/check/arena/check-playgrounds.mjs` + `.test.mjs` | the new gate; `check:playgrounds` |
| `frameworks/react/playground/Playground.tsx`, `PlaygroundState.ts`, `Playground.dom.test.tsx` | the React harness, written once |
| `frameworks/angular/playground/Playground.ts`, `PlaygroundState.ts`, `Playground.test.ts` | the Angular harness, written once |
| `intro/playground.css` | **the shared page chrome.** Must live outside `frameworks/`: `check:layer-independence` scans both trees textually and `EXEMPT` is empty. `intro/` is where `styles.css` and `toggle.css` already are and where every demo page already reaches with `../../../../../intro/`. |
| `intro/density.js` | the density toggle, **extracted** from the inline handler at `intro/overview.js:325-331` and repointed there, not copied |

Reuse rather than rewrite: `bindingName()` (`scripts/check/arena/check-api.mjs`),
`loadContract`/`loadCategories`/`componentDir` (`scripts/generate/arena/generate-catalog.mjs`),
`loadTypes`/`fieldType`/`enumLiteral` (`generate-api-types.mjs`), `LAYERS`/`kebab`/`readLayer`
(`scripts/lib/arena/layers.mjs`).

### Generated, git-ignored, per component per layer

```
frameworks/<layer>/components/<cat>/<kebab>/<Name>.demo.generated.html
frameworks/<layer>/components/<cat>/<kebab>/<Name>.demo.entry.generated.tsx   # react
frameworks/<layer>/components/<cat>/<kebab>/<Name>.demo.entry.generated.ts    # angular
```

220 files. They sit in the component's own directory, so the two URLs differ in exactly one
path segment, which is the whole affordance:

```
/frameworks/react/components/forms/button/Button.demo.generated.html?variant=danger&size=lg
/frameworks/angular/components/forms/button/Button.demo.generated.html?variant=danger&size=lg
```

The `.generated.` infix is load-bearing three times over: it matches the existing `.gitignore`
pattern, it exempts the file from `check:docs`'s comment rule so it can carry its
"GENERATED by … do not edit" banner at all, and it makes `check:layer-independence` skip the
file, which the Angular page **needs** because it must link
`frameworks/tailwind/Utilities.generated.css`.

## The fixture

```jsonc
{
  "component": "Card",

  // Seeds the knob panel cannot invent. MUST cover every member that is required with no
  // default. MAY cover an optional member, which then supplies the value its knob starts
  // holding while the member is still unbound.
  "seed": { "title": "Client Portal", "eyebrow": "Delivery", "href": "#acme" },

  // A slot listed here starts filled; one omitted starts empty. Every required slot appears.
  "slots": {
    "content": [ { "text": "Last published 2 h ago, build #4821." } ],
    "action":  [ { "component": "Badge", "members": { "tone": "success", "dot": true },
                   "slots": { "content": [ { "text": "Deployed" } ] } } ]
  },

  // Write-back: an event whose payload also drives a knob, so a controlled component is not
  // dead on the page. Absent means the event is logged and nothing else.
  "bind": { "sortChange": "sort", "close": { "open": false } },

  // Only for a compound child: a node tree containing "$subject" exactly once.
  "host": null,

  "note": "A surface. With interactive or href it becomes one activation target."
}
```

A **node** is one of exactly three shapes, and the recursion is what lets one emitter cover
both slot content and compound hosts:

```jsonc
"$subject"                                                   // the placeholder, host only
{ "text": "checkout-api", "element": "span" }                // element optional
{ "component": "TableRow", "members": {…}, "slots": {…} }     // a real Arena component
```

Ten fixtures carry a `host`: `TableRow`, `TableCell`, `Tab`, `Radio`, `SideNavItem`,
`SideNavSection`, `SideNavCollapsible`, `BottomNavItem`, `CalendarEvent`, `Toast`.

**`bind` is not optional decoration.** Roughly fifteen components are controlled
(`Tabs.value`/`change`, `Table.sort`/`sortChange`, `Select.value`/`change`, every
`open`/`close` pair). Without write-back, clicking a tab does nothing and the page looks
broken. It is authored per component rather than inferred from a `<x>Change` name shape,
because that rule is right most of the time and wrong exactly where it matters.

## The knob model

`playgroundModel()` classifies every member, and the classification is what makes the two
layers agree **and** what the Angular compiler then checks for free:

| Contract shape | Class | Initial | Bound |
|---|---|---|---|
| `required: true` | `pinned` | fixture seed (mandatory) | always |
| has `default` | `defaulted` | the contract `default` | always |
| otherwise | `optional` | fixture seed, else the form's neutral | only while its presence toggle is on, starting off |

`defaulted` is always bound and never toggled because of Angular: `input<ControlSize>('md')`
bound to `undefined` sets the signal to `undefined`, not back to `'md'`, so an "unset" state
would diverge from React's destructuring default. `optional` is safe to unbind because
`input<T>()` with no initial value is `undefined` already.

A form the model cannot express (`consumerData`, a slot with `params`) **throws by name**, so
the day one lands it says so rather than dropping it silently.

### Where the model lives at runtime: inlined in each entry

Each generated entry carries `const MODEL: KnobModel = {…}` as a JSON literal. Not a
`fetch()`, because Angular templates are compiled ahead of time and the subject's markup must
be generated source per component anyway, so a runtime fetch buys nothing and costs an async
boundary and a silent-blank-page failure mode. Not a per-layer `Demos.generated.ts`, because
that would need its own drift gate and would ship every component's prose to every page.

Inlining also makes parity a **textual** assertion: the `MODEL` literal in
`Button.demo.entry.generated.tsx` must equal the one in `Button.demo.entry.generated.ts`,
byte for byte. That is stronger than "both import the same module", and it costs one string
comparison with no browser.

## What the generated entry emits, per form

**React** binds one JSX attribute per member; a `content` slot is the JSX body; a named slot
`x` is `x={k.x === undefined ? undefined : <span>{k.x}</span>}` (the `undefined` arm is what
expresses an unfilled slot; blanking the text would leave a zero-area element); an event is
`onX` per `bindingName()`, always logging, plus a `play.set()` where `bind` names a target.
Compound children are emitted as literal direct siblings, because `Tabs.tsx`, `Table.tsx` and
`RadioGroup.tsx` all use `React.Children.toArray` + `cloneElement`.

**Angular** has no spread, so every member is written out: `[label]="k().label"`. Three traps
the emitter must handle:

- A named slot is wrapped in `@if`, because `Card.ts` runs `contentChild(ArenaAction)` and an
  empty marked element still counts as *filled*. Blanking the text would make the header
  render in Angular and not in React.
- Where `frameworks/angular/ProjectionMarkers.ts` declares a directive whose selector is
  `[<slot>]` (`action`, `actions`, `brand`, `footer`, `secondaryAction`), it joins `imports`.
  The generator derives this by parsing that file's selectors, never from a hand list.
- Literal member values inside a host or slot node become typed `protected readonly` fields
  bound by name, never inlined into a template expression, which would mean escaping both the
  template's quotes and the surrounding backtick's `${`.

`strictTemplates` with `extendedDiagnostics.defaultCategory: "error"` is why the `Knobs`
interface must be exact: a `pinned` member backs `input.required<T>()` and its field must be
non-optional. The classification is compiler-checked, which is the point.

## The page

Identical in both layers except one `<link>` (Angular's `Utilities.generated.css`), one
`<script>` (React's importmap) and the mount element. Both link `intro/styles.css`,
`intro/toggle.css`, `intro/playground.css`. **Both toggles are static HTML outside the
framework**, which removes the largest source of chrome divergence and dodges the fact that
`intro/theme.js` binds `btn.onclick` once at init, which a framework re-render would discard.

No `@dsCard` on line 1, so `check:cards` never sees these pages.

## URL state

The query string is a **sparse overlay** on a base both layers compute identically from the
model. A member absent from the query takes its base value; presence in the query is presence
of the member. Written with `history.replaceState`, never `pushState`, so Back still leaves
the page.

Each knob carries a `codec` tag emitted once by `playgroundModel()`, so the two layers cannot
disagree about it: `raw` (string, enum, slot), `number`, `flag` (`1`/`0`/`true`/`false` all
parsed), `json` (object, array). `Input.validate`, the one `functionInput`, is a select over
three generated functions. Events have no knob.

Two non-member parameters belong to the static chrome: `theme=light|dark` and
`density=compact|comfortable`. `intro/theme.js` and `intro/density.js` each gain "a URL
parameter wins over `localStorage` on load, and a toggle writes both". Without this the URL
does not reproduce the view, which is most of the point.

**The limit, stated rather than implied:** the gate proves the two `MODEL` literals are equal,
not that the two harnesses implement the codec switch identically. That is held by a
round-trip suite beside each harness.

## Gates

### New: `check:playgrounds` (`scripts/check/arena/check-playgrounds.mjs`, `arena` domain)

No exception map. Eleven assertions plus the smoke phase:

1. Fixture coverage, bidirectional, with a zero-result guard.
2. `fixture.component` equals the file stem.
3. Every `seed` key names an inbound non-slot member; every required-without-default member
   has a seed; the value's type matches the form, and an enum value is one of the declared ones.
4. Every `slots` key names a slot member; every required slot appears.
5. Every `bind` key names an event member; its target accepts the declared payload.
6. `host` contains `"$subject"` exactly once; every `component` named in a node exists in
   `frameworks/Components.json`; every `members` key names a member of that contract.
7. An inexpressible form fails by name.
8. Emission drift: each of the 220 outputs equals a fresh emit. Same shape as `check:demos`.
9. Orphans: a `*.demo.generated.*` no contract produces fails.
10. **Cross-layer parity**: the `MODEL` literal extracted from each layer's entry is equal.
11. **Dangling citation**: no `frameworks/**/*.prompt.md` and no layer `README.md` cites a path
    under `frameworks/` that does not exist. This is the only mechanical protection for the
    ~35 prompt checklists that currently name a `.card.html`.

**Smoke phase (browser):** loads all 110 pages in headless Chromium, asserts the mount point
has children and the console is clean. Non-portable like `check:cards`, so it exits 2 → `SKIP`
where a browser is missing, and the repository's strict declaration turns that into a failure.
Register the browser dependency in `scripts/check/README.md`'s table.

Registration: `GATES` in `check-all.mjs`, `package.json`, `scripts/check/README.md`, and
`check-all.test.mjs`, which asserts the domain partition.

### Rewritten: `check:angular-demos`

`PAGED` disappears. The 25-name allowlist becomes the stronger structural claim: every
directory `readLayer('angular')` returns has a `<Name>.demo.generated.html` and a
`<Name>.demo.entry.generated.ts`, and nothing else. `pageProblems()` keeps its four real
assertions verbatim, retargeted: the page loads the right bundle, declares no `@dsCard`, and
the entry calls `bootstrapApplication(` and `provideZonelessChangeDetection(` and starts with
`import '@angular/compiler';`.

### Repointed / extended

- `scripts/build/angular/build-angular-demo.mjs`: `ENTRY_SUFFIX` and the source scan move to
  `.demo.entry.generated.{js,ts}`. `tsconfig.demo.json` includes `./playground/**/*.ts`.
- `scripts/build/react/build-demos.mjs`: `ROOTS` gains `frameworks/react/playground`;
  `outputPathFor` collapses the double segment
  (`/(?:\.generated)?\.(?:jsx|tsx|ts)$/ → '.generated.js'`) with `rewriteRelativeSourceImports`
  kept symmetric. Both are asserted by `build-demos.test.mjs`.
- `check:focus-trap`: `TRAPS` becomes four playground pages with `?open=1` instead of finding a
  button by its text. `walkTrap()` already builds its URL by concatenation, so a query string
  passes through; drop the `trap.open` branch and its settle wait. The knob panel's tab stops
  sit outside `[role="dialog"]` and `walkProblems()` counts only what is inside, so this is a
  strictly harder test than today's.
- `check:dimension-literals`: the two `EXEMPT` entries keyed on `Skeleton.card.entry.tsx` go
  **stale** the moment that file is deleted, and `staleExemptions()` fails the gate. They must
  go in the same commit, with `check-dimension-literals.test.mjs`, which asserts `EXEMPT` by name.
- Packaging: `frameworks/react/tsconfig.dist.json` swaps its `*.card.entry.tsx` exclusion for
  `*.demo.entry.generated.tsx` plus `./playground`;
  `scripts/build/angular/build-angular-package.mjs:91` excludes `.demo.` alongside `.card.html`
  (a blanket `.html` exclusion is wrong: `theme/no-fouc.html` must keep shipping).

### Unchanged, verified

`check:api` (reads only `<Name>.tsx`/`<Name>.ts` in the component directory), `check:structure`,
`check:behaviour`, `check:compliance`, `check:catalog`, `check:states`, `check:tailwind*`,
`check:generated` (the `.gitignore` pattern already matches), and
`behaviour-contracts.test.mjs`'s literal `reactComponents('.').length === 55`, since no
component directory moves.

## Commit sequence

Nothing is deleted until its replacement exists and has been looked at.

| # | Commit | Green because |
|---|---|---|
| C1 | Shared chrome: `intro/playground.css`, `intro/density.js`, `theme=`/`density=` parameters; repoint `intro/overview.js`. | `intro/` is outside every scanned tree but `check:icons`; the Overview behaves identically. |
| C2 | `playground-model.mjs` + suite; all 55 fixtures + `frameworks/demos/README.md`; `check:playgrounds` in **fixture-only** mode (1–7, 11) + suite + registration. | The gate passes over 55 fixtures with no pages yet. **The big authoring commit and the schedule risk.** |
| C3 | React harness; `ROOTS`; `outputPathFor` collapse; `tsconfig.dist.json`; the layer README's root list. | `check:demos` compiles it, `check:react-types` typechecks it, the `.dom.test.` suite lands in the preloaded invocation. |
| C4 | Angular harness; `tsconfig.demo.json`; package staging exclusion; the layer README's root list. | `check:angular` typechecks both projects; `check:assertions` is satisfied by using `test/NodeAssert.ts`. |
| C5 | Both emitters + the generator, **one pilot component** (`Card`: a `content` slot, a marker-directive slot, primitives, a void event). `generate:playgrounds` enters `bun run build` before `build:demos` and `build:angular-demo`. `check:playgrounds` gains 8–10. Two `UNTRACKED` entries. | The old pages are untouched, so `PAGED` still passes. **Open both `Card.demo.generated.html` pages side by side here.** |
| C6 | Turn the generator on for all 55. No deletions. | `check:react-types` and `check:angular` now compile 110 generated files; expect the long tail here and land it in alphabetical batches if the first run is noisy. **The review commit.** |
| C7 | Add the smoke phase to `check:playgrounds`; repoint `check:focus-trap`'s `TRAPS` at four playground pages with `?open=1`; update both suites. | Must precede C8, or the gate points at deleted pages. Also where the modal render is first proven under a real browser. |
| C8 | Delete 22 React `.card.html` + 22 `.card.entry.tsx`. Update `frameworks/react/README.md`, CLAUDE.md, `tsconfig.dist.json`, ~10 React `.prompt.md` citations, and **the two stale `Skeleton` `EXEMPT` entries + their suite**. | `check:cards` drops to 57 pages, still non-empty; the compiled siblings go with their sources so the orphan scan is clean. |
| C9 | Delete 25 Angular `.card.html` + 25 `.card.entry.ts`. Rewrite `check-angular-demos.mjs` + suite; retarget `build-angular-demo.mjs`; update `frameworks/angular/README.md`, `frameworks/PACKAGING.md`, ~18 Angular `.prompt.md` citations. | The rewritten gate derives its inventory, so no list is left stale. |
| C10 | Documentation sweep: CLAUDE.md's "Viewing things", the trio/quartet paragraphs, the stale "50/50", `scripts/build/README.md` (also fixes its wrong `build/angular-demo/` paths), `scripts/generate/README.md`, `scripts/lib/README.md`'s domain table, and `DOUBTS.md` recording the `group="Components"` loss. | The completion gate, run once. |

## Verification

Per commit, the cheap gates that the commit widens:

```bash
bun run check:playgrounds      # from C2
bun run check:demos            # from C3
bun run check:angular-demos    # from C9
bun run check:dimensions       # after any framework edit
bun test <the suite just written>
```

By hand, at C5 and again at C6, which is what the whole feature exists for:

```bash
bun run demos     # builds and serves :8000
# open both, same query string, and diff them by eye:
#   /frameworks/react/components/display/card/Card.demo.generated.html?tone=accent&theme=light
#   /frameworks/angular/components/display/card/Card.demo.generated.html?tone=accent&theme=light
```

Then confirm each of: every knob moves the render; every event writes a log line; both
toggles work and survive a reload; editing a knob rewrites the URL and pasting that URL into
the other layer reproduces the view.

Once, at C10: `bun run check`.

## Accepted losses and open risks

- **`group="Components"` is gone.** The external card renderer keeps `intro/`'s guidelines and
  Tailwind's 43 recipe specimens; the three charts lose their only card. Recorded in `DOUBTS.md`.
- **55 fixtures are judgement, not code.** They are the bulk of C2, they do not parallelise
  well, and a fixture that seeds a bad value produces a page that renders and lies.
- **Angular's `strictTemplates` over 55 generated templates** is where the schedule actually
  goes. The `pinned`/`defaulted`/`optional` classification is what makes it tractable; the
  mitigation is the C5 pilot and C6 batching, not cleverness.
- **A contract change now fails `check:react-types` pointing at generated code.** Every emitted
  file opens with a banner naming the generator, and the gate's failure message says
  `Run: bun run generate:playgrounds`, the way `check:demos` says `Run: bun run build:demos`.
- **Cut, deliberately:** the code-snippet emitter, slot `params` (throw), `consumerData`
  (throw), `functionInput` beyond three canned functions, and `@dsCard` on playground pages.
