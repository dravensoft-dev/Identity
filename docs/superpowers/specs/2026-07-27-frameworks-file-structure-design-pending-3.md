# One shape for every framework layer

**Status:** design, approved 2026-07-27 — **three plans pending.** The migration is
sequenced Tailwind → Angular → React, one plan each, and the `-pending-N` suffix
decrements as each lands.

## The problem

`frameworks/` holds three layers that solve the same problem and are laid out three
different ways.

React puts every component of a category in one flat directory, so
`frameworks/react/components/display/` is 84 files covering thirteen components, four
demo pages and one shared helper, with no boundary between any of them. A component's
quartet — `Badge.jsx`, `Badge.d.ts`, `Badge.behaviour.json`, `Badge.prompt.md` — is
findable only by name prefix, and its two test files live in two *other* directories
that carry no marker of what they cover.

Angular already puts each primitive in its own directory, which is the shape this
design generalises, but it has no category level at all: twenty primitives sit
side by side under `primitives/`, and its tests are in a separate `test/` directory the
same way React's are.

Tailwind is flat like React's categories but without even the category: 114 files in
one directory.

Nothing about this is broken — every gate is green today. What it costs is that
answering "what does this component consist of?" means three `ls` calls in three
directories per layer, and that a component's tests are the one part of it that no
listing of the component shows.

## The shape

**Directories are `kebab-case`, lowercase. Files are `PascalCase`, hyphens removed.**
Secondary dotted segments stay `lowerCamelCase`: `BarChart.variants.ts`,
`Alert.roleTones.test.ts`, `Tooltip.timer.dom.test.jsx`.

Every layer becomes `<framework>/components/<category>/<component>/`, and everything
that belongs to one component — its source, its types, its binding, its prompt, its
demo page, its tests — is inside that one directory.

Four exceptions to the naming rule, each mechanical rather than aesthetic:

| Exception | Why |
| --- | --- |
| `index.ts` | TypeScript resolves `export * from './components'` by looking for that literal filename. `Index.ts` is not found on a case-sensitive filesystem. |
| `index.html` | `ui-kits/console/` is served as a directory; the server looks for that literal name. |
| `tsconfig.check.json`, `tsconfig.test.json` | `tsconfig*` is a name editors and toolchains recognise by convention. `ngc -p <path>` is explicit, so renaming would work — the exception is for the reader, not the compiler. |
| `.gitkeep` | No stem to capitalise. |

`ui_kits/` becomes `ui-kits/` — the only directory in `frameworks/` that is not already
kebab-case.

**A file for test purposes carries `.test.<ext>`**, which `tsconfig.test.json` already
satisfies. That rule stops at test *suites*: `bun test` collects files by that same
infix, so test *support* — `Harness.jsx`, `Preload.js`, `AssertPattern.jsx`,
`Compliance.ts`, `TestbedEnv.ts` — must not carry it, or bun would try to run a harness
as a suite. Support is identified by living in `<framework>/test/`, not by its name.

## Where a file that is not one component's goes

**A shared file rises to the narrowest level that contains all of its consumers.**

- Consumed by one component → inside that component's directory.
- Consumed by several components of one category → the category directory.
- Consumed across categories → the layer root.
- Test support, and suites spanning categories → `<framework>/test/`.

One refinement, and it is a property this repo already has rather than a special case:
**a compound family counts as its parent.** `Calendar`/`CalendarEvent`,
`Tabs`/`Tab`, `SideNav`/`SideNavItem`/`SideNavSection`/`SideNavCollapsible`,
`Table`/`TableRow`/`TableCell` and `RadioGroup`/`Radio` exist because a consumer needs
their own content inside one item of something Arena draws, so a helper or a suite
covering the family belongs to the parent's directory, not to the category. This is why
`SideNavInject.jsx` lands in `side-nav/` and `ChartInternals.js` does not land in any
chart — the three charts are not a family, they are three components that share
geometry.

Measured consumers, so the placements below are derived rather than assumed:

| Helper | Consumers | Lands at |
| --- | --- | --- |
| `react/components/charts/chart-internals.js` | BarChart, LineChart, DoughnutChart | `components/charts/ChartInternals.js` |
| `react/components/display/calendar-internals.js` | Calendar, CalendarEvent | `components/display/calendar/CalendarInternals.js` |
| `react/components/navigation/pagination-window.js` | Pagination | `components/navigation/pagination/PaginationWindow.js` |
| `react/components/navigation/side-nav-inject.jsx` | the four SideNav\* | `components/navigation/side-nav/SideNavInject.jsx` |
| `react/use-container-width.js` | across categories | `react/UseContainerWidth.js` |
| `react/use-dialog-modal.js` | Dialog, ConfirmDialog, Onboarding, CommandPalette | `react/UseDialogModal.js` |
| `angular/primitives/chart-internals.ts` | the three charts | `components/charts/ChartInternals.ts` |
| `angular/primitives/focus-trap.ts` | command-palette, confirm-dialog, onboarding | `angular/FocusTrap.ts` |
| `angular/primitives/container-size.ts` | the three charts, page-head | `angular/ContainerSize.ts` |
| `angular/primitives/projection-markers.ts` | chart-card, empty-state, error-state, page-head, unauth-card | `angular/ProjectionMarkers.ts` |

`side-nav-inject.jsx` keeps its `.jsx` extension for the reason its own history records:
`check:dimensions` scans `.jsx`/`.ts`/`.tsx` and deliberately never opens a `.js`, and
`indentFor()` produces a governed `padding-inline-start`. Under `.js` it would sit
outside the gate entirely.

## Target layout

```
frameworks/Components.json

frameworks/react/
    Api.generated.d.ts  Tokens.generated.js
    UseContainerWidth.js  UseDialogModal.js
    vendor/React.js  ReactDomClient.js  ReactJsxRuntime.js
    ui-kits/console/index.html  Shell.jsx  …
    components/
        display/
            Display.card.html  Display.card.entry.jsx/.js
            TableAvatar.card.html  TableAvatar.card.entry.jsx/.js
            TagAndChipCases.dom.test.jsx
            badge/
                Badge.jsx  Badge.js  Badge.d.ts
                Badge.behaviour.json  Badge.prompt.md
                Badge.test.jsx
            skeleton/
                Skeleton.jsx  Skeleton.js  Skeleton.d.ts
                Skeleton.behaviour.json  Skeleton.prompt.md
                Skeleton.test.jsx
                Skeleton.card.html  Skeleton.card.entry.jsx/.js
            calendar/
                Calendar.jsx  …  CalendarInternals.js
                Calendar.card.html  Calendar.card.entry.jsx/.js
        navigation/
            side-nav/
                SideNav.jsx  …  SideNavInject.jsx
                SideNav.test.jsx  SideNav.structure.test.jsx
                SideNav.disclosure.dom.test.jsx
    test/
        Harness.jsx  Preload.js  AssertPattern.jsx
        Smoke.dom.test.jsx  PlacementAndBranches.dom.test.jsx
        AssertPatternCases.dom.test.jsx  UseDialogModal.dom.test.jsx

frameworks/angular/
    index.ts  Api.generated.ts  Tokens.generated.ts
    BehaviourDelegated.json
    FocusTrap.ts  ContainerSize.ts  ProjectionMarkers.ts
    tsconfig.check.json  tsconfig.test.json
    components/
        index.ts
        charts/
            ChartInternals.ts  ChartInternals.test.ts  ChartDataTable.test.ts
            bar-chart/
                index.ts  BarChart.ts  BarChart.variants.ts
                BarChart.behaviour.json  BarChart.prompt.md
                BarChart.variants.test.ts  BarChart.geometry.test.ts
        display/tag/
            index.ts  Tag.ts  Tag.variants.ts
            Tag.behaviour.json  Tag.prompt.md
            Tag.variants.test.ts  Tag.cases.test.ts  Tag.remove.test.ts
    test/
        TestbedEnv.ts  Compliance.ts
        HostClassBinding.test.ts  HarnessCapabilities.test.ts
        AssertPatternCases.test.ts

frameworks/tailwind/
    Tv.ts  ManifestClasses.js  Theme.css  Utilities.css  Animations.css
    Specimen.css  Specimen.js
    components/display/badge/
        Badge.manifest.json  Badge.manifest.ts  Badge.card.html
```

Angular's barrels follow the tree: each component keeps its own `index.ts`, each
category gains one re-exporting its components, and `components/index.ts` re-exports the
categories. `frameworks/angular/index.ts`'s `export * from './primitives'` becomes
`'./components'`. Angular has only five of the six categories — it has no `forms/`,
because all nine form controls are delegated to Material — so `check:structure` must
tolerate a layer that carries a subset of the categories, and asserts only that a
directory that *does* exist is in the right place.

After the move, `frameworks/react/test/` holds nothing but test support and the suites
that span categories, and every one of those happens to be a DOM suite today. The
directory survives because that is where support belongs, not because it is the DOM
directory — the DOM split is carried by the `.dom.test.jsx` infix now, wherever the file
sits.

Angular loses the name `primitives/`. That is the price of the three layers reading
alike, and it is named in `ADOPTION.md`, `frameworks/angular/README.md`, `index.ts` and
a dozen places in `CLAUDE.md`.

Angular gains no directory for the thirty components delegated to Material. The rule is
that a delegated component gets a directory only if it has a test, and none of the
thirty does — verified by comparing `behaviour-delegated.json`'s key set against
`frameworks/angular/test/`. `BehaviourDelegated.json` stays one file at the layer root.

## `frameworks/Components.json` and `check:structure`

The category of a component would otherwise be written three times, once per layer, with
nothing holding the three together. One file declares it once:

```json
{
  "brand":      ["AppLogo"],
  "charts":     ["BarChart", "ChartCard", "DoughnutChart", "LineChart"],
  "display":    ["ActivityFeed", "Avatar", "Badge", "Calendar", "CalendarEvent", "Card",
                 "Skeleton", "StatCard", "Table", "TableCell", "TableRow", "Tag",
                 "UnauthCard"],
  "feedback":   ["Alert", "ConfirmDialog", "Dialog", "EmptyState", "ErrorState",
                 "Onboarding", "ProgressBar", "Spinner", "Toast", "Tooltip"],
  "forms":      ["Button", "Checkbox", "IconButton", "Input", "Radio", "RadioGroup",
                 "Select", "Switch", "Textarea"],
  "navigation": ["Breadcrumbs", "BulkActionBar", "CommandPalette", "Menu", "PageHead",
                 "Pagination", "SegmentedControl", "SideNav", "SideNavCollapsible",
                 "SideNavItem", "SideNavSection", "Tab", "Tabs"]
}
```

Fifty names, which is React's full set. Angular's twenty directories and Tailwind's
thirty-eight manifests are exact subsets of those names, so the file covers all three
layers with no exception.

The directory name is the PascalCase component name in every layer, so it also equals
the `component` field Angular's bindings already carry and the basename of
`api/components/<Name>.json`. Angular's kebab file stem is *derived* from the directory
name by a deterministic function (`ActivityFeed` → `activity-feed`), never by a table.

`check:structure` is gate 22. It asserts:

1. no name appears in two categories;
2. every component directory in every layer sits in the category the file assigns it;
3. every entry exists in at least the React layer;
4. no component directory exists that the file does not name.

It does **not** assert that the category is the right one. That is editorial judgement
and no gate has it — its header will say so in the same terms `check:behaviour`'s does,
because a green run here is a consistency claim and never a taxonomy one.

## The test topology

Today the DOM / DOM-free split is **by directory**, and that is the only thing keeping
`@happy-dom/global-registrator` — which installs globals process-wide — out of the
suites that prove server-side rendering, and out of `scripts/`, whose
`static-server.test.mjs` fetch assertions fail cross-origin once happy-dom replaces
Bun's `fetch`.

Colocating tests with components makes that split **by filename**. Two facts were
measured against real `bun test` runs before this was designed, not assumed:

- several positional patterns are combined with **OR**, not AND, so the DOM selection
  must be a single pattern;
- `--path-ignore-patterns` accepts the glob `**/*.dom.test.jsx`.

```
test:scripts     bun test scripts
test:react       bun test frameworks/react --path-ignore-patterns='**/*.dom.test.jsx'
test:react-dom   bun test --preload ./frameworks/react/test/Preload.js '.dom.test.jsx'
test:angular     bun run build:angular-tests && bun test build/angular-test/angular
test             bun run build:angular-tests
                 && bun test scripts frameworks/react build/angular-test/angular \
                      --path-ignore-patterns='**/*.dom.test.jsx'
                 && bun test --preload ./frameworks/react/test/Preload.js '.dom.test.jsx'
```

Still two processes. What changes is the criterion, not the count, and the reason the
two cannot merge is untouched.

The preload requirement is untouched too, and it is not a convenience: react-dom decides
once, at its own module evaluation, whether the browser supports the `input` event, and
without a DOM already installed it latches into a legacy polyfill under which a
dispatched event reaches `onChange` zero times, silently. Only a preload is early
enough. `Harness.jsx` keeps throwing when `document` is missing rather than installing a
fallback.

Angular's `tsconfig.test.json` include becomes `["./components/**/*.ts",
"./test/**/*.ts", "./index.ts"]`, so `ngc` emits to `build/angular-test/angular/` with
the same tree shape and `pruneOrphans`' `build/angular-test/<rel>` → `frameworks/<rel>`
mapping keeps working unchanged.

One hazard the nested tree introduces: `collectSuites()` in `check-compliance.mjs` keys
suites **by basename**, and a recursive walk can now meet the same basename twice. The
walk gains a uniqueness assertion in the same batch, so a collision fails loudly instead
of one suite silently shadowing another.

## The placements that are judgement rather than rule

Every `<Name>.test.jsx` in `frameworks/react/test/` and every `<name>-*.test.ts` in
`frameworks/angular/test/` that covers one component moves into that component's
directory mechanically. What follows are the files where the rule needs a reading, so
the plan does not have to invent one. Each was derived by reading the suite's imports.

React, DOM suites and support:

| Today | Target |
| --- | --- |
| `test-dom/harness.jsx` | `test/Harness.jsx` |
| `test-dom/preload.js` | `test/Preload.js` |
| `test-dom/assert-pattern.jsx` | `test/AssertPattern.jsx` |
| `test-dom/smoke.test.jsx` | `test/Smoke.dom.test.jsx` |
| `test-dom/assert-pattern-cases.test.jsx` | `test/AssertPatternCases.dom.test.jsx` |
| `test-dom/use-dialog-modal.test.jsx` | `test/UseDialogModal.dom.test.jsx` |
| `test-dom/placement-and-branches.test.jsx` | `test/PlacementAndBranches.dom.test.jsx` |
| `test-dom/alert-tones.test.jsx` | `components/feedback/AlertTones.dom.test.jsx` |
| `test-dom/behavioural.test.jsx` | `components/feedback/Behavioural.dom.test.jsx` |
| `test-dom/dialog-modal.test.jsx` | `components/feedback/DialogModal.dom.test.jsx` |
| `test-dom/form-control-events.test.jsx` | `components/forms/FormControlEvents.dom.test.jsx` |
| `test-dom/tag-and-chip-cases.test.jsx` | `components/display/TagAndChipCases.dom.test.jsx` |
| `test-dom/menu.test.jsx` | `components/navigation/menu/Menu.dom.test.jsx` |
| `test-dom/tabs.test.jsx` | `components/navigation/tabs/Tabs.dom.test.jsx` |
| `test-dom/side-nav-disclosure.test.jsx` | `components/navigation/side-nav/SideNav.disclosure.dom.test.jsx` |
| `test-dom/onboarding-modal.test.jsx` | `components/feedback/onboarding/Onboarding.dom.test.jsx` |
| `test-dom/tooltip-keyboard.test.jsx` | `components/feedback/tooltip/Tooltip.keyboard.dom.test.jsx` |
| `test-dom/tooltip-timer.test.jsx` | `components/feedback/tooltip/Tooltip.timer.dom.test.jsx` |

`placement-and-branches.test.jsx` is the one that crosses categories — CalendarEvent
(display), Menu (navigation), Skeleton (display) — so it rises to `test/`.
`tabs.test.jsx` and `side-nav-disclosure.test.jsx` cover a compound family and land on
the parent by the refinement above; `alert-tones` (Alert + Toast) and `behavioural` /
`dialog-modal` (Dialog + ConfirmDialog) cover unrelated components of one category and
stop at the category.

React, DOM-free suites needing a reading:

| Today | Target |
| --- | --- |
| `test/side-nav-structure.test.jsx` | `components/navigation/side-nav/SideNav.structure.test.jsx` |
| `test/pagination-window.test.jsx` | `components/navigation/pagination/PaginationWindow.test.jsx` |

Angular:

| Today | Target |
| --- | --- |
| `test/testbed-env.ts` | `test/TestbedEnv.ts` |
| `test/compliance.ts` | `test/Compliance.ts` |
| `test/host-class-binding.test.ts` | `test/HostClassBinding.test.ts` |
| `test/harness-capabilities.test.ts` | `test/HarnessCapabilities.test.ts` |
| `test/assert-pattern-cases.test.ts` | `test/AssertPatternCases.test.ts` |
| `test/chart-internals.test.ts` | `components/charts/ChartInternals.test.ts` |
| `test/chart-data-table.test.ts` | `components/charts/ChartDataTable.test.ts` |
| `test/<name>-variants.test.ts` | `components/<cat>/<name>/<Name>.variants.test.ts` |
| `test/bar-chart-geometry.test.ts` | `components/charts/bar-chart/BarChart.geometry.test.ts` |
| `test/alert-role-tones.test.ts` | `components/feedback/alert/Alert.roleTones.test.ts` |
| `test/tag-remove.test.ts`, `tag-cases.test.ts` | `components/display/tag/Tag.remove.test.ts`, `Tag.cases.test.ts` |
| `test/skeleton-dimensions.test.ts` | `components/display/skeleton/Skeleton.dimensions.test.ts` |
| `test/command-palette-focus-trap.test.ts`, `-keyboard` | `components/navigation/command-palette/CommandPalette.focusTrap.test.ts`, `.keyboard.test.ts` |
| `test/confirm-dialog-focus-trap.test.ts`, `onboarding-focus-trap.test.ts` | their component directories, `.focusTrap.test.ts` |

Demo pages follow the same rule. Nine of the eighteen `*.card.html` cover a single
component and descend into it (`Skeleton.card.html`, `Alert.card.html`,
`Onboarding.card.html`, `Calendar.card.html`, `ActivityFeed.card.html`,
`UnauthCard.card.html`, `ConfirmDialog.card.html`, `CommandPalette.card.html`, and
`brand.card.html` → `brand/app-logo/AppLogo.card.html`). Nine cover several components
or a whole category and stop at the category (`Display`, `Feedback`, `Forms`,
`Navigation`, `Charts`, `TableAvatar`, `EmptyErrorState`, `RadioTextarea`,
`MenuPagination`). **Which components a page covers is derived from its
`.card.entry.jsx` imports, never from its filename** — the plan reads each entry rather
than trusting the name.

Each page's `<script type="importmap">` and its `styles.css` and `assets/` references
are repo-root-relative by `../` count, so every page that descends one level gains one
`../`. `check:cards` renders each declaring page in headless Chromium at its declared
viewport, so a miscounted path fails that gate rather than shipping a blank card.

## What each batch touches

The touched set below was derived by grepping `scripts/` for the paths each batch moves,
not from memory. Every `scripts/*.test.mjs` that pins one of those paths by literal value
changes in the same commit as the script it covers — `check-all.test.mjs`,
`check-api.test.mjs`, `check-script-tokens.test.mjs`, `build-api-types.test.mjs`,
`check-dimension-literals.test.mjs`, `check-manifest-states.test.mjs`,
`check-compliance.test.mjs`, `behaviour-contracts.test.mjs`, `tailwind-compile.test.mjs`,
`manifest-classes.test.mjs` and `tv-merge.test.mjs` are the ones that do.

**Batch 1 — Tailwind.** The pilot, and the smallest blast radius.
`frameworks/Components.json` and `check:structure` are born here.
Touches `scripts/lib/tailwind-compile.mjs` (its `readdirSync` of one directory becomes a
recursive walk), `build-tailwind.mjs`, `check-tailwind-generated.mjs`,
`check-radius-tokens.mjs`, `check-arbitrary-values.mjs`, `check-manifest-states.mjs`
(`SOURCE_OVERRIDES` and `EXEMPT` name real paths), `check-card-viewports.mjs`,
`frameworks/tailwind/README.md`.

It also reaches outside its own layer once, and that is unavoidable rather than scope
creep: renaming `frameworks/tailwind/tv.ts` to `Tv.ts` and `manifest-classes.js` to
`ManifestClasses.js` breaks the **19 Angular files** that import them. Batch 1 updates
those import paths and nothing else in Angular — a mechanical string edit, no
restructuring. The alternative, deferring the layer-root renames to batch 2, would leave
one layer half-renamed between batches, which is worse.

**Batch 2 — Angular.** `primitives/` becomes `components/<category>/<component>/`.
Touches `scripts/lib/behaviour-contracts.mjs` (`angularPrimitives`, plus the new
directory→stem derivation), `check-compliance.mjs`, `check-api.mjs`,
`check-material.mjs`, `check-angular.mjs`, `build-angular-tests.mjs`, both tsconfigs,
`frameworks/angular/index.ts`, `ADOPTION.md`, `frameworks/angular/README.md`, and
`package.json`'s `test:angular`. Renaming `api.generated.ts` and `tokens.generated.ts`
additionally touches `build-api-types.mjs`, `build-tokens.mjs`,
`check-script-tokens.mjs` and `check-duplicate-constants.mjs`, all four of which write
or read those two paths by name.

**Batch 3 — React.** The largest, and last because it is the riskiest.
`reactComponents()` stops keying on "a `.jsx` whose name starts with a capital" — a
heuristic this design breaks, since `SideNavInject.jsx` would now match it — and keys on
"a component is a directory", which is what Angular already does. Touches
`check-behaviour.mjs`, `check-compliance.mjs`, `check-api.mjs`, `build-demos.mjs`,
`check-demos-generated.mjs`, `build-vendor.mjs`, `check-vendor-generated.mjs`,
`check-dimension-literals.mjs` (`EXEMPT` names real paths), `build-api-types.mjs` and
`build-tokens.mjs` again for React's two generated modules, `check-script-tokens.mjs`,
`check-duplicate-constants.mjs`, `check-text-contrast.mjs` and `validate-palette.mjs`
(both read demo pages under `ui_kits/`), `check-all.mjs`'s `testStep()` and the
`check-all.test.mjs` assertion that pins it by literal value, `package.json`'s four test
scripts, `serve.mjs`, and the importmap of all eighteen demo pages.

`behaviour-contracts.test.mjs` asserts `reactComponents('.').length` by literal value.
The number does not move — no component is added or removed — but the function under it
is rewritten, so that suite is the one that proves the rewrite found the same fifty.

Each batch closes with `bun run check` green and with its share of `CLAUDE.md` rewritten
in the same commit. Every move uses `git mv`.

Each batch separates **move and rename** — one commit with no content change — from
**fix the gates**, the commit after. That keeps the mechanical half reviewable as a
rename list and the interesting half small.

## Costs this accepts

- **285 files under `frameworks/` are renamed**, plus the three in `vendor/`. Where a
  rename coincides with a content change, `git log --follow` stops following. Splitting
  each batch into a rename commit and a fix commit limits this but does not remove it.
- **`CLAUDE.md` describes these paths in prose throughout** — `frameworks/react/test-dom/`
  as a directory with a rule attached, `primitives/tag/` as the reference shape, the
  two-test-directories rule, the quartet convention, `reactComponents()`'s heuristic.
  Rewriting that prose is part of the work, not an optional extra, and it is where the
  real risk of the repo describing a tree that no longer exists lives.
- **A component directory does not prove a component is complete.** `check:structure`
  asserts placement, never that the quartet is present; `check:behaviour` and
  `check:api` remain the gates that hold that, exactly as today.
- **The three layers look alike and are not alike.** A reader meeting the same silhouette
  in `react/` and `angular/` may expect the same coverage; Angular has twenty of fifty
  components and delegates thirty to Material. `BehaviourDelegated.json` is still the
  only place that says so, and this design does not change that.

## Out of scope

Nothing about behaviour, API contracts, accessibility or tokens changes. No component
gains or loses a member, a binding, an exception or a test. Any suite that is green
before a batch is green after it, running the same assertions against the same
components — a batch that changes what a suite proves has gone wrong.

`api/`, `behaviour/`, `tokens/`, `scripts/` and the repo-root pages keep their current
layout; the naming rule reaches `frameworks/` only.
