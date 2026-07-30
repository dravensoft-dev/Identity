# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Arena — Dravensoft's design system. It is **not a published npm package**, but it does have
a **dev-only, private `package.json`** at the root: the token layer is built from DTCG JSON
by Style Dictionary, and the build and check scripts are tested with `bun test`, as is each
framework layer from its own suites (`bun run test:scripts` / `test:react` / `test:react-dom`
/ `test:angular`, or `bun run test` for all four).

Those four run in **two `bun test` processes**, not one, preceded by a build the Angular
suites need before either process can see them, because the preload registers a DOM globally
and must not share a process with the DOM-free suites (see the DOM-split note under
*Architecture*). **The single authority for that command is `testStep()` in
`scripts/check-all.mjs`** — it is what `bun run check` runs, and `scripts/check-all.test.mjs`
asserts its args array by literal value. Read it there rather than reconstructing one; a
narrowed invocation matching fewer files is indistinguishable from one matching all of them,
so a stale path reports green over a tree it never opened.

**The criterion that decides which invocation a suite belongs to is the `.dom.test.jsx`
filename infix, wherever the file sits.**

**A test under `scripts/` may not import a framework layer's `.ts` or `.jsx`**, because
`scripts/` is the one suite `check-all.mjs` also runs under plain node, and those files use
the extensionless imports their own toolchains expect and node does not resolve. A property
worth asserting against a real recipe or component is asserted from that layer's own suites,
which in both layers sit beside the component they cover.

Nothing here is published to npm. It ships as three things at once from the same tree:

- a **Claude Code plugin** (`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`, registering the `design` skill defined by the root `SKILL.md`);
- a **copy-in kit** (consumers copy `contracts/design/`, `contracts/design-generated/`, `assets/`, `styles.css` and the `.jsx` files they need);
- a standalone **Agent Skill** (`SKILL.md`).

`contracts/design/README.md` is the normative design specification (voice, color, spacing,
danger convention, iconography, theming). Treat it as the source of truth for any design
decision, and update it in the same change whenever a token, component, or convention
changes. The root `README.md` is Getting started and nothing more; `contracts/README.md`
maps the rest of the repository.

## Documentation rules

- **Every `.md` file stays under 60,000 characters.** The one exception is `DOUBTS.md`.
- **Documentation is written in the present tense** and describes what Arena is, never what
  it was. A retired token, a fixed defect, a former directory layout and a batch number all
  belong in `DOUBTS.md` or nowhere.
- **The best comment is the one not written.** A method carries its own context through its
  name. The only exception is `scripts/` and test files, which may carry **one** comment —
  inline or block — as a file header, **at most 10 lines**. Files a script generates are
  outside the rule entirely and keep their comments.
- Knowledge a rename cannot express — a measurement, a vendor's behaviour, a pinned version,
  a constraint of a test environment — goes in `DOUBTS.md`, not in a comment.

`bun run check:docs` holds both rules. It finds comments by lexing, so a `//` inside a string,
a regex or a template literal is never mistaken for one, and a `@ts-`/`eslint-` directive is a
directive rather than the file's one allowance.

## Viewing things

Everything is static, but the demos `fetch()` their JSX, so `file://` will not work — serve the repo root over HTTP:

```bash
bun run demos   # serves the repo root on :8000 and prints the entry points
```

- `guidelines/*.html` — token specimen cards (type, color, spacing, effects, icons, brand, danger convention).
- `frameworks/react/components/**/*.card.html` — live component demos. A page sits either **inside one component's own directory** (`display/skeleton/Skeleton.card.html`) or **beside the directories at its category level** when it composes several components onto one card (`display/Display.card.html`, `navigation/MenuPagination.card.html`). List them with `find frameworks/react/components -name '*.card.html'`.
- `frameworks/react/ui-kits/console/index.html` — the Delivery Console example app (login → dashboard → project).
- `Arena - Overview.html` (repo root) — the token language, generated at runtime. **It shows no components on purpose** — those belong to the framework layers.
- `Dravensoft Identity.dc.html` (repo root) — the approved brand manual, and the only `dc-runtime` page.

**Neither root page may move.** Each loads `styles.css`, `assets/` and its own runtime by
relative path; from a subdirectory it 404s, no token resolves, and the page renders unstyled.

## Architecture

**Tokens are the only styling layer, and their values are DTCG JSON.** `styles.css` does
nothing but `@import` six files split across two directories: `contracts/design-generated/`,
which holds five CSS files, and `contracts/design/`, which holds one hand-authored file,
`colors.css`. Four of those five — `palette.css`, `typography.css`, `spacing.css`,
`effects.css` — are **generated build output**: their values are authored in
strictly-conformant DTCG 2025.10 JSON under `contracts/design/` and emitted by
`bun scripts/build-tokens.mjs` (`bun run build:tokens`). **Never edit those four CSS
files** — edit the JSON and rebuild. `contracts/design/README.md` is the normative table of
which DTCG `$type` every token group uses, and it is the first thing a new platform target
should read.

The split matters: **`contracts/design/palette.{dark,light}.json` is the skin** — the
daisyUI-structured `--color-*` / `--color-*-content` pairs per theme (dark on `:root`, light on
`.arena-light`) plus the 8-slot categorical chart ramp — and it is what a consumer swaps to
re-skin Arena. **`contracts/design/colors.css` is the structure**, and stays hand-authored — the
compatibility layer mapping Arena's legacy aliases onto those tokens, plus the `color-mix`
derivations of the muted text levels from `--color-base-content`. `colors.css` never defines a
skin value; `palette.css` is imported before it. `fonts.css` stays generated by
`scripts/fetch-fonts.mjs`.

**The layer contract.** DTCG owns *values*; the composition layer owns *how values are
combined at runtime*. Two things DTCG deliberately does not model, and that therefore live
in each platform's own idiom: the runtime colour derivations (`color-mix`, in
`contracts/design/colors.css`) and `@font-face` bundling (`contracts/design-generated/fonts.css`).
A new framework target rebuilds that thin layer in its idiom on top of the same standard
values — it never re-defines a value.

**A third thing lives in the composition layer: a token whose consumer is JavaScript rather
than CSS.** A token flagged `$extensions["com.dravensoft.arena"].script: true` emits twice — the
custom property it always would have, and a bare number exported from each layer's
`Tokens.generated.*`. Emission is **per layer** so a component's import never crosses the
`contracts/design/` ↔ `frameworks/` boundary. Flag a token only when JS arithmetic must consume
it to produce a position — an SVG `y` from a data value, a clamp against `window.innerWidth`.
The price is not negotiable: a value bound at import time **cannot re-theme and cannot
re-densify**. `check:script-tokens` asserts the modules match the source and the CSS and that no
flag is orphaned; `check:duplicate-constants` fails a numeric constant declared in both layers.

**That gate also reaches across into the API layer, for exactly one type.**
`contracts/api/types/cat-slot.json` declares `CatSlot` as the literal set `1 | … | 8`, and the
8 is not authored there — it is the count of `--color-cat-*` slots in `palette.dark.json`,
reaching the layers as the derived `catSlots` constant. `catSlotEnumProblems()` asserts the set
is exactly `1..catSlots` **in order**, so a ninth colour in the ramp fails the build until the
contract type follows. It is deliberately that one named case and not a mechanism.

**Behaviour has values, and they are tokens like any other.** `contracts/design/behaviour.json`
holds `delay` (pointer intent), `dismiss` (how long a transient notice lives) and `limit`
(quantity invariants), all script-readable because their consumers are `setTimeout` arguments
and array bounds. Two rules govern what belongs there. **A behaviour value is a decision the
system makes, not a mechanism** — `--delay-open` is how long a tooltip waits, and that is a
design decision; a debounce interval on a synchronous in-memory filter is not. And **a value is
not a contract**: which keys a dialog answers, where focus lands, what dismisses it — none of
that is expressible as a token, and DTCG does not model it.

**Behaviour also has contracts, and they are not tokens.** `contracts/behaviour/*.json` states
what a kind of component must do — roles, keys, focus, dismissal — one file per pattern, each
citing the source it was adopted from. **Most cite a WAI-ARIA APG page; count them rather than
trusting a figure here** (`ls contracts/behaviour/*.json | wc -l` for the total,
`grep -l 'apg/' contracts/behaviour/*.json | wc -l` for the APG-derived share — note
`navigation` cites an APG *practices* page rather than a *patterns* one, so a grep on
`apg/patterns` alone undercounts by one). The exceptions are the interesting part, and they are a
**growing** set rather than a fixed one: `progressbar`, `status` and `textbox` cite the ARIA 1.2
role reference, because APG has no pattern page for any of those roles;
`figure-with-data-table` is Arena's own and cites WCAG, because APG has no chart pattern; and
`none` and `absent` cite nothing, because there is nothing to adopt from when the claim is that
no pattern applies. **That set is asserted by literal value** — `none aside, exactly the patterns
with no APG pattern page cite something else`, in `scripts/behaviour-contracts.test.mjs` — so a
new pattern citing anything but an APG *patterns* page fails that test until the list follows. It
is the one claim in this paragraph a grep for a component name can never catch, because it is
written in terms of patterns. `requires` is a flat map of **dotted** keys, and that shape is load-bearing:
an exception names exactly one requirement, so one entry cannot excuse a whole clause.

Every component declares, in **every** layer, beside its own source — `<Name>.behaviour.json` —
and the controls Material provides or lacks in `frameworks/angular/BehaviourDelegated.json`.
**Delegation is a state, not an absence**: Angular has a tooltip, it is `matTooltip`, and a
declaration reading "absent" would be false for it — `Calendar` is the one entry where "absent"
is true, and it binds the `absent` pattern precisely so that fact is machine-checkable rather
than only stated in its `reason`.

**A binding has two shapes, and the second exists because a binding describes a COMPONENT
while the evaluator judges a RENDER.** A component that renders differently by its own props is
several renders, and no flat exception list is correct for all of them. So a binding either
names one `pattern` and lists its `exceptions`, or declares `cases` — named render
configurations, each with its own `when` in prose, its own `pattern` and its own `exceptions`.
Declaring both is rejected. **The flat shape stays valid and means one case**, so the untouched
majority is not churned to say so; count the cased ones with
`grep -rl '"cases"' --include='*.behaviour.json' frameworks/ | wc -l`. `bindingCases()` in
`scripts/lib/behaviour-contracts.mjs` is the **single** place the two shapes are reconciled.
`behaviour-compliance.mjs` knows nothing about cases — `comparePattern` reads
`binding.exceptions` and nothing else, so each test wrapper synthesizes a per-case binding,
which keeps the one file that runs in three runtimes out of it. `when` is prose and can only be
prose: nothing can verify that a suite rendered the configuration a case names.

**A count of exceptions is a count of DECLARATIONS, not of distinct defects**, and the
difference is the one way prose about this layer goes quietly false: a requirement unmet in two
cases is correctly declared twice. A raw count of `"requirement"` is not comparable across the
point where a binding gains cases, and a drop in it must never be reported as "N defects
removed". Count distinct binding+requirement pairs when the question is about defects:
`grep -rHo '"requirement": "[^"]*"' --include='*.behaviour.json' frameworks/ | sort -u | wc -l`.

**The wrapper drives the case loop.** `assertPatternCases` — in both layers' test helpers —
takes a map of case name → a **thunk** that renders that case, and compares that key set against
the declared names *before anything mounts*; a never-rendered case and an undeclared one are
both errors. A suite merely *asked* to call once per case can forget. Where a flat binding gives
the wrapper no case list to drive, call `assertPattern` once per meaningful variant by hand.

`check:behaviour` asserts every component declares, that no declaration names a pattern or
requirement that does not exist, that no delegated entry is stale, and that the layers agree or
say why not. When they disagree the gate names both and picks no winner — the pattern is the
authority. **It does not assert that a component behaves as it declares**: a component can bind
`dialog-modal` and trap no focus. A green run is a coverage claim, never an accessibility one.

**What checks whether a component behaves as it declares is a render suite, in both layers,
with one component-shaped hole.** `check:compliance` is the coverage record; the verification
lives in render suites. **Both layers hold them the same way** — beside the component they
cover, with the handful belonging to no one component in `frameworks/<layer>/test/`; those four
trees are `SUITE_DIRS` in `scripts/check-compliance.mjs`. They assert, per requirement of a
component's bound pattern, that the rendered DOM either meets it with no exception declared, or
fails it with one declared. That single bidirectional statement is the stale-exception rule:
**an exception can expire.** No pattern is excluded: `grid` was, and is not now.

The shared evaluator is `scripts/lib/behaviour-compliance.mjs`, DOM-generic on purpose — it
touches only `tagName`, `getAttribute`, `hasAttribute` and `textContent`, because it is
consumed from three runtimes, one of them plain node in its own test, which has no DOM. It
returns a third value, `null`, for requirements no single element can decide (`focus.*`,
`keyboard.*`, `content.noAutoDismiss`, `alternative.table`); a suite must name each of those
in its `behavioural` map and assert it by acting on the tree, and each layer's wrapper throws
if one is silently skipped. **Coverage is partial by design and grows one component at a
time** — `COVERED` is the record, with the same bidirectional staleness rule `EXEMPT` carries;
the gate never demands totality, only that every claim in it is true. **`COVERED` is keyed by
`<component>:<layer>`**, and which layer a suite belongs to is decided **structurally**:
`validateCoverage` checks the key's layer against `suite.layer`, a tag `collectSuites()`
attaches from the `SUITE_DIRS` tree the file was found under, before it checks that the suite's
text names that layer's binding path tail. A key without a `:layer` suffix is rejected.

**A reference is resolved rather than counted, and `each` is quantified rather than sampled.**
`IDREF` names the reference-carrying requirement keys and is **derived** from
`IDREF_ATTRIBUTES` rather than hand-written beside it. Resolution arrives from outside — each
layer's wrapper builds a `resolveId` from the render root — because the evaluator runs in a
runtime with no DOM; a requirement in `IDREF` that finds its attribute and no resolver
**throws**, since degrading to a presence check would report a dangling reference as met. A
quantified subject may be an array, every element must meet the requirement, and one handed a
single element throws; `QUANTIFIED` is hand-curated and `NOT_QUANTIFIED` records the omissions
with reasons. `hasAccessibleName()` asks whether there is a NAME rather than an attribute,
through three ordered routes: `aria-label`; the element's own text, where the pattern is in
`LABEL_ACCEPTS_TEXT`; then `aria-labelledby`, which names the element only when **every** id
resolves.

**Arena's third contract is the API.** `contracts/api/components/<Name>.json` states, once and
neutrally, the members that component's API presents; every layer implementing it implements
exactly those members. A member is one of **nine forms** — primitive, enum, predefined object,
array of primitives, array of predefined objects, consumer data, functionInput, slot, event —
and five derived rules govern them (R1 an object is pure data with known fields, R2 who draws
decides data versus slot, R3 a parameterised slot fills and never replaces, R4 no platform
types and no escapes, R5 no unions between forms).

**Consumer data is the eighth**: a record whose keys the *consumer* names, which Arena routes
and never inspects. It is exactly one spelling, `Record<string, unknown>`, and a record of a
*known* type stays an R4 violation. Two things about it are mechanical — it may not be a field
of a predefined object, and a member taking it in must declare a route back out (a slot
parameter or an event payload) or it is data Arena can never surface.

**`functionInput` is the ninth, and the narrowest**: a function the consumer supplies, which
the component calls on its value and whose result it uses — a validator, a parser. It exists
for data-entry controls and nothing else, and that is machine-checked: `check:api` rejects one
in any contract not declaring `"kind": "input"` at top level. Its signature is modelled
(`params` name → type, `returns`), R4 holds inside it, and the gate compares the signature
between the contract and each layer. **A return of `React.ReactNode` is not one, and is not a
member at all** — a per-item renderer. R3 permits the shape, so R3 is not the reason; the
reason is Angular, which has no answer for per-item projection short of a structural directive
and `ngTemplateOutlet`, a binding no row of the table covers and no reader function reads.

`contracts/api/README.md` is the normative statement and the first thing a new platform target
reads, the way `contracts/design/README.md` is for the design layer. Shared objects and enums
are declared once in `contracts/api/types/` and emitted **per layer** by `bun run build:api`.
The word *prop* never appears in a contract: it is React's vocabulary, and a neutral contract
using it would already have chosen a layer.

**The structural difference from `contracts/behaviour/` is one file, not one per layer** —
behaviour files a binding beside each layer's source and has a gate compare them, which admits
two files that disagree; a contract that forbids divergence has nowhere for a second opinion to
live, and **`check:api` carries no exception map at all**. Coverage is partial by design: a
green run is a claim about the contracted components and says nothing about the rest — and,
being orthogonal to behaviour, nothing about what any of them *does* either. **To know what is
contracted, run `bun run check:api` and read the contract/layer pair it prints.**

**When a consumer needs their own content inside ONE item of something Arena draws, make the
item a component.** Per-item projection stops applying the moment the consumer instantiates one
element per item instead of handing Arena a render function, so Angular's missing
`ngTemplateOutlet` binding stops being the obstacle. `RadioGroup`/`Radio`,
`Calendar`/`CalendarEvent` and `Table`/`TableRow`/`TableCell` all follow it. The parent owns
**where** an item goes and the item owns **what** it looks like; the parent reads its children's
props and injects the rest with `cloneElement`, and **none of the injected props is a member of
any contract**.

**A compound parent's content slot is OPTIONAL, and the one exception is a named group.**
Measure it rather than trusting this — `grep -rn '"form": "slot"' contracts/api/components/`
and read the `required` flags. Every compound ROOT declares its children optional and guards
nothing, and so does a container that merely nests. Only a section that renders a **heading
naming the group** requires and guards, because a childless one renders a label for nothing. A
root promises nothing that an empty render would break. **What a root must still not do is
ship an invalid degenerate render**: with no children `Tabs` draws an empty tablist and **no**
tabpanel, because a panel whose `aria-labelledby` points at a tab that does not exist is worse
than an absent one.

**The `SideNav` family is the recursive case.** Nesting is arbitrary — to any depth — with **no
React context anywhere**, because injection is **direct children only, one hop**, and a section
or a collapsible re-injects into its own children with `depth + 1`. The shared helper is
`frameworks/react/components/navigation/side-nav/SideNavInject.jsx`; it covers that family and
no more, so the placement rule sends it to the family's parent directory rather than up to
`navigation/`. **Its `.jsx` extension is load-bearing**: `check:dimensions` never opens a
`.js`, and the helper's `indentFor()` produces a governed `padding-inline-start`. It is a
`.jsx` under `components/` that is **not a component** — a component is a **directory**, both
in `reactComponents()` and in every measurement of the set.

Every compound family shares one limit: **a consumer's own wrapper component between two levels
breaks the chain, and so does a fragment.** `React.Children.toArray` flattens a nested array and
does *not* flatten a `<>…</>`, so a fragment arrives as one opaque child that `cloneElement`
decorates uselessly. Write items as siblings or in an array, never wrapped; the fragment half is
easy to miss because the array half works.

**And a guard must count what the render path counts.** `React.Children.count()` counts a bare
`false` as one child where `toArray()` drops it — so a `count()`-based "this must not be empty"
guard passes the commonest conditional-render idiom, `{isAdmin && <SideNavItem …/>}` with the
condition false, straight through to the empty render the guard exists to refuse. Use
`toArray().length`.

`Table.label` is the pattern for a member that only a human can supply: it names the grid for
assistive technology, it is `required: true`, and it is **guarded at runtime** rather than
defaulted. A constant fallback is rejected on the charts' own evidence — a name that is present
but only says what the component *is* satisfies `roles.label` mechanically while telling a
screen-reader user nothing — and nothing can derive it, because a data table's subject is
editorial. `SegmentedControl.ariaLabel` is the same shape.

**A closed set of values is not always an enum**, and the condition is a gate rather than a
judgement: a set that merely restates a value the token layer already derives may be an enum
**only while something machine-checks the restatement**. `CatSlot` is the one type that does
this, and `check:script-tokens` is what ties it back to the ramp — **a second such type would
need its own tie before it may be an enum at all.**

**Some contracts govern one layer only, and that is a property of the component, not a gap.**
The controls Angular delegates to Material exist in React alone, so **count them rather than
trusting a figure**: every component **directory** under
`frameworks/react/components/<category>/` with no matching directory under
`frameworks/angular/components/<category>/`, which is also the key set of
`frameworks/angular/BehaviourDelegated.json`. **A change that makes an item a
component enlarges that set while contracting it**, which is why the method above is the only
thing worth trusting. Their APIs are settled and normative *before* Angular has an
implementation to defend.

**The single-icon convention reaches `Button` and `IconButton`** — a component's icon is a
Phosphor class-name string Arena draws, never a slot, so `IconButton` presents no slot at all
and a per-item or single icon is one system across the library. The price is recorded rather
than hidden: flattening each `<button>`'s heritage clause drops the five `form*` overrides and
every global/ARIA attribute a `{...rest}` spread would forward, with no gate behind the loss —
`check:api` reads the `.d.ts`, and a restored spread in the `.jsx` leaves it green. See
`DOUBTS.md`.

**React's suites run in two `bun test` invocations that must not merge.** A `.dom.test.jsx`
suite renders into a real DOM; every other `*.test.jsx` asserts on `renderToStaticMarkup` — no
DOM, by design, because those suites prove those components render correctly server-side. The
DOM is installed by `--preload ./frameworks/react/test/Preload.js`, which registers
`@happy-dom/global-registrator` **process-wide**, and `bun test` shares one process across
every path a single invocation matches. So a DOM registered in the DOM-free invocation's
process would quietly change what its suites prove with nothing failing to say so.

The infix answers the question wherever the file sits: the first invocation passes
`frameworks/react` with `--path-ignore-patterns='**/*.dom.test.jsx'`, and the second passes the
bare string `.dom.test.jsx` as its one positional, which `bun test` matches as a path
substring. `frameworks/react/test/` holds the harness plus the suites that are about no one
component — and **those include DOM ones**, so that directory's contents answer nothing about
which invocation a suite belongs to. Angular's suites likewise sit beside their components,
with the run target the whole emitted layer (`build/angular-test/angular`).

**What forces the split is `scripts/`.** Angular's single registration site,
`frameworks/angular/test/TestbedEnv.ts`, is guarded rather than throwing on a second call, so
merging it into the preloaded invocation does not itself collide. But a happy-dom installed
process-wide for the whole invocation replaces Bun's own `fetch`, which turns a passing
`scripts/lib/static-server.test.mjs` fetch assertion into a cross-origin failure.

**A grid is verified by walking its cells, one key press per step.** `Calendar` and `Table` were
hand-tested for one reason — memory — and both have suites now. A grid suite asserts at every cell
that focus landed where the arrow should take it and that exactly one `tabindex="0"` exists and is
that cell; each edge clamp is one extra press, never a blind loop. **The bill is the press count,
not what is asserted** — each press re-renders the grid through `act()` — so the fixture stays
small and explicitly sized. `DOUBTS.md` has the measurement.

**The `.dom.test.jsx` suites must be run through `--preload ./frameworks/react/test/Preload.js`,
and that is not a convenience.** react-dom decides **once, at its own module evaluation**,
whether the browser supports the `input` event: `canUseDOM` gates the block computing
`isInputEventSupported`, and if a DOM is not already installed the flag latches false and React
falls back to its legacy change-detection polyfill, under which a dispatched `input` or
`change` reaches an `onChange` handler **zero** times, silently. Registering happy-dom from
`Harness.jsx`'s module body is too late (ES imports evaluate first) and — measured, so do not
retry it — so is registering it from a **separate ES module imported ahead of
`react-dom/client`**: bun evaluates `react-dom` before that module anyway. Only a preload is
early enough. All three invocation sites pass it (`test:react-dom`, `test`, and `testStep()`),
and `Harness.jsx` **throws** when `document` is missing rather than installing a fallback,
because a fallback would silently run those suites under the legacy semantics. The preload must
never be applied to the DOM-free invocation.

**A dimension in a framework layer is a token or a derivation of tokens. A bare literal is a
bug.** This is machine-checked: `bun run check:dimensions` scans `frameworks/` for literals in
the properties the token layer governs and fails on each. A value passes when it is
`var(--token)`, a `calc()`/`min()`/`max()`/`clamp()` over one, zero, or a unit the token layer
does not model (`%`, `ch`, `fr`, the viewport and angle units — DTCG admits only `px` and `rem`
in a dimension — plus `s`/`ms`, which this gate alone tolerates). **The same three shapes are
what a Tailwind bracket may hold, and the two gates share the same unmodelled-unit list** — but
they are not one list: this inline gate additionally tolerates `s`/`ms`, while the bracket gate
does not, because `--dur-*` and `--loop-*` model duration.

The scan reaches four kinds of site: a JS declaration, a template literal's interpolation, CSS
injected as a string, and an SVG presentation attribute in `prop="value"` form. An expression
binding — `r={hover ? 5 : 4}` — is outside all of them. A literal reached through an
intermediate local variable is still caught, but only when that identifier is used bare (no
member access, no call, no arithmetic) at the governed site. A handful of sites are exempt by
name with a reason each — read `EXEMPT` for the current set rather than a count. A stale
exemption fails the gate itself, and **a change to `EXEMPT` or `PASSTHROUGH` is a change to
`scripts/check-dimension-literals.test.mjs` too**, since that suite asserts on both maps by
name.

It scans `.jsx`, `.ts` and `.tsx` under `frameworks/` — not `.html`, so the root-level and
`guidelines/` pages stay clean only because they were tokenized by hand. The `*.card.html`
specimens under `frameworks/tailwind/` are the one family of unscanned pages that stays clean
structurally: every class they render comes from the manifest through `classesFor()`. **Two
blind spots are known and neither is fixed** — a kebab-case SVG attribute, and Angular's
`[style.x]` binding form; both are in `DOUBTS.md`. This is why the three SVG charts write their
static styling as camelCase `[style]` **objects**: in that shape `strokeWidth` and `fontSize`
are judged as themselves, which is strictly more coverage than an attribute.

**No gate compares a Tailwind manifest against the component it mirrors, and the mapping is not
one-to-one**: some manifests mirror both a React component and an `arena-*` primitive; the rest
mirror a React component alone, because Angular Material provides that control and
`arena-material.css` dresses it. `check:tailwind` proves every class resolves; nothing proves a
manifest still matches the component it was derived from, so check by hand when either has
moved.

One narrow slice of that is machine-checked: `check:states`
(`scripts/check-manifest-states.mjs`) flags a `hover:`/`focus:`-family Tailwind state modifier
in a manifest whose mirrored React component implements no hover/focus anywhere. It resolves
the manifest-to-component mapping through a `SOURCE_OVERRIDES` map — a compound component maps
to **every** `.jsx` its manifest mirrors, since a naive same-name search finds only the parent —
and carries an `EXEMPT` map keyed `<Component>:<slot>:<family>` with a reason each, for hits a
whole-file text scan cannot resolve. A stale `EXEMPT` entry fails the gate. **This checks states
only** — it says nothing about whether a manifest's colors, sizes or slot structure still match
the component it mirrors.

**The Overview generates itself, and that is the point.** `Arena - Overview.html` reads names
and `$description`s from `contracts/design/*.json` and the alias names from `colors.css` (with
`scripts/lib/css-decls.mjs`, the same parser the drift gate uses), but it reads **values** from
`getComputedStyle` on the live document. So it exercises the whole chain — JSON, build, CSS,
browser — instead of restating the JSON, and a token that resolves empty is flagged as stale
rather than shown as if it were in effect. Add a token and it appears there with no edit to the
page. The group-to-preview mapping lives in `scripts/lib/token-preview.mjs` and **never** in the
token source, which stays platform-neutral.

When adding a colour, define the daisyUI token in `palette.dark.json` and `palette.light.json`
first, rebuild, then alias to it in `colors.css` — never introduce a raw hex in a component.
After any `contracts/design/` edit: rebuild, then run `check:dtcg` (source is valid DTCG
2025.10), `check:tokens` (committed CSS matches the source) and `check:ramp` (the ramp still
clears every gate). Colours are structured sRGB objects, dimensions and durations are
`{value,unit}` objects, and letter spacing is a `number` carrying an `em` render hint in
`$extensions`.

**The two layers solve the modal focus contract with the same code, and that is deliberate
rather than convergent.** `frameworks/react/UseDialogModal.js` is a PORT of
`frameworks/angular/FocusTrap.ts`, not a second design — the same focusable selector (every
natively-focusable clause carrying its own `:not([tabindex="-1"])`, because a selector list is
OR'd and `button:not([disabled])` alone would pull a real `<button tabindex="-1">` back into the
tab order), the same boundary-wrap rule, the same never-cache-the-focusables rule, the same
open/close transition. `Dialog`, `ConfirmDialog` and `Onboarding` all consume it, and Escape
always reports through the component's **own** dismissal channel — `onClose`, `onCancel`,
`onSkip` — so meeting the pattern adds no member anywhere. **The rule that a component is
self-contained is about CSS classes, not about JS helpers.** The React module is one shape wider
than the Angular one: Angular handles Tab only and keeps Escape in each component's own
`onKeydown`, where React folds Escape into the handler the hook returns.

**What a suite can prove about a focus trap, and what it cannot.** The boundary wrap is Arena's
own `.focus()` call, and happy-dom honours `.focus()`, so it is asserted for real. The
**interior** — that Tab from a control in the middle reaches the next one — is the browser's
native sequential focus navigation, which neither layer implements and happy-dom does not have;
a test asserting it would pass identically against a perfect trap and against none. So the
interior is checked by a person in real Chromium against a written checklist in each component's
`.prompt.md`. **No browser-driven gate**, on the same arrangement the grid rule uses.

**Components carry no CSS classes.** Each `frameworks/react/components/**/*.jsx` renders with
inline `style` objects reading the custom properties (`background: 'var(--crimson)'`), and
handles hover/active/focus with local `useState`. There is no `.btn` class to target; theming
happens entirely through token values. Keep new components self-contained the same way —
`Button.jsx` is the reference shape.

**The one exception: a `<style>` tag injected once**, for what an inline style genuinely cannot
express — `@keyframes`, and vendor pseudo-elements such as `Input`'s
`::-webkit-calendar-picker-indicator`. The pattern is always a module-level
`let injected = false` guard, a `useEffect`, and `document.head.appendChild`. Never a `<style>`
rendered inside the component's own markup — that ships one tag per instance and leaks the CSS
into the element's `textContent`. Inject **as little as the job needs**, and reach for a class
of ours **only when a selector is unavoidable**, never as a shortcut around an inline style
that would have worked.

**Every animation answers `prefers-reduced-motion`**, and the answer depends on what the motion
means: motion reporting work in progress *slows* rather than stops, decorative motion stops
outright, an entrance keeps its fade and drops its travel, and an opacity-only animation needs
no clause at all. `frameworks/react/README.md` carries both rules in full.

**Every component is a quartet, and the four files live in the component's own directory**,
`frameworks/react/components/<category>/<component-kebab>/`: `X.jsx` (implementation), `X.d.ts`
(types), `X.prompt.md` (usage, examples, Do/Don't) and an entry in a `*.card.html` demo. **That
demo page is one of two shapes** — `X.card.html` in the component's own directory when the card
is about that component alone, or a page one level up, beside the directories at its category
level, when it composes several components onto one card (`display/Display.card.html`,
`navigation/MenuPagination.card.html`). A category-level page belongs to no one component, which
is why the placement rule puts it there rather than inside any of them. Adding a component means
adding all four.

**A new React component also moves a literal count outside its own layer, and the React suite
alone cannot see it move.** `scripts/behaviour-contracts.test.mjs` asserts
`reactComponents('.').length` by literal value; a new component **directory** moves it by one
and the assertion must be updated **in the same commit**. **Verify with the merged process** —
the args array in `testStep()` — because `bun test frameworks/react` never matches `scripts/`,
so it reports green over a tree whose test run is red. That is a different hazard from the
two-invocation rule above: this one is about a path a narrowed invocation never matched.

The Angular layer's quartet is the analogue, in
`frameworks/angular/components/<category>/<component-kebab>/`: `<Component>.ts` (standalone
`OnPush` component, `arena-` selector, signal I/O, no component `styles`),
`<Component>.variants.ts` (a `tailwind-variants` recipe built with `frameworks/tailwind/Tv.ts`),
`<Component>.prompt.md`, and an `index.ts` barrel — plus `<Component>.behaviour.json` and the
component's own suites, `<Component>.<facet>.test.ts`, in the same directory. Dark-first
(`.arena-light`), danger stays outline, Phosphor icons. The three SVG charts are the one
exception and have no `<Component>.variants.ts`. Angular has **all six** of the categories the
layout rule allows; `forms/` is the newest, and fills as Plan D moves the delegated controls in.

**A host-bound root is the Angular layer's default, and its carve-outs are a growing set.** A
primitive binds its root slot to the host (`host: { '[class]': 'styles().root()' }`) rather than
rendering a wrapper div, so the host is the flex item its parent lays out and the measured
element is the styled element. The rule targets elements that exist only to carry styling; when
the root must be a specific semantic or interactive element, keep it and leave the host bare.
`activity-feed` needs a real `<ul>`; a form control needs its own `<button>`, `<input>` or
`<label>`, or it forfeits the activation, labelling and `:disabled` semantics the browser
already supplies. **A bare host still declares `display: contents`**, or as a flex item it
shrinks to fit and a `w-full` inside measures the host, not the row. **A host-bound root must carry
a display utility** — `<arena-x>` is an unknown element defaulting to `display:inline`, where
width and height do not apply, so a root slot without one renders a zero-area host. That is
machine-guarded by a manifest-driven assertion in
`frameworks/angular/test/HostClassBinding.test.ts`.

**The Angular test harness compiles ahead of the run — AOT, not JIT — and that is a different
guarantee, not merely a faster one.** The Angular suites render real zoneless Angular trees
under `bun test` via `happy-dom`, which needs three test-only devDependencies beyond the
`node:test`/`node:assert` baseline — `@angular/platform-browser`, `happy-dom` and
`@happy-dom/global-registrator`. **Most suites sit beside the component they cover**; what stays
in `frameworks/angular/test/` is the harness and the suites about no single component — and two
of those files carry no `.test.` infix on purpose, because `bun test` collects by that infix and
a shared module must not be collected as a suite.

`bun run build:angular-tests` compiles everything `frameworks/angular/tsconfig.test.json`
includes under `ngc --strictTemplates`, into git-ignored `build/angular-test/`; `test:angular`,
`test` and `testStep()` all run `bun test` over that emitted output, never over the `.ts`
sources. A type error anywhere in the test surface — including a template diagnostic in an
inline `template:` string — fails the *build* step, and no test in that run executes at all.
Staleness is prevented by the build always running ahead of the tests that read it:
`build-angular-tests.mjs` prunes any output whose source has since been deleted, because `ngc`'s
incremental build does not.

**A green compile is a claim about TYPES, and never about behaviour.**

`frameworks/angular/test/HarnessCapabilities.test.ts` pins what the AOT harness supports: a
template property binding reaches a required signal input; `contentChild()` resolves against
real projected content; and `componentRef.setInput()` drives a required input — a plain string,
and a boolean carrying a `booleanAttribute` transform — as well as an *optional* boolean input of
the same transformed shape, displacing its default. **Never write to a component's instance field
directly** to stand in for an input: `grep -rn "\w\+\['[a-zA-Z]*'\] = " --include='*.ts'
frameworks/angular/` must stay empty.

A suite file that fails to *load* from the emit does not fail quietly: the run goes red, not
merely one failing assertion. What stays silent is *which* tests or suite files never loaded, so
a reader sees a failing run and has to go find what else it dropped.

`bun test` runs every file a single invocation matches in ONE process — which means the whole
Angular layer — and both happy-dom's document and Angular's `TestBed` environment can each be
claimed only once per process: `GlobalRegistrator.register()` throws if already registered, and
`TestBed.initTestEnvironment()` throws the second time it runs across files that share a process.
`frameworks/angular/test/TestbedEnv.ts` claims both, once, for the whole run: `ensureDom()` and
`useTestEnvironment()` are plain `if (claimed) return` guards, not a reset —
`TestBed.resetTestEnvironment()` measurably does not work, because `BrowserDomAdapter.makeCurrent()`
installs a process-wide DOM adapter on the FIRST platform creation that nothing resets, so a
second per-file document would render into a document the adapter no longer points at.

So every Angular suite shares one real document and one TestBed environment for the whole run;
any suite needing a real component render calls `useTestEnvironment()` (or `ensureDom()` alone,
for a suite that needs a DOM but not TestBed). **The shared document means state written onto
it outlives the file that wrote it** — a custom property on `documentElement.style`, an element
appended to `document.body` — unless that file clears it, typically in a `finally`. Every
directly-created fixture must still be `destroy()`-ed, because zoneless change detection sweeps
all attached views, so a fixture left dirty throws out of an unrelated later test — and with
one shared document that hazard crosses files.

**Specimen/demo pages** start with an HTML comment
`<!-- @dsCard group="…" viewport="WxH" name="…" subtitle="…" -->` that drives external card
rendering — keep it as the first line, which is the only line `check:cards` reads. **That
viewport is machine-checked**: the gate loads every declaring page at its declared width in
headless Chromium and fails when the rendered content over-runs the box in either axis, because
the card is cropped to it and the overflow is lost silently. Declaring it by arithmetic does not
work — measure by running the gate. A page declaring far *more* height than it renders only
warns. `frameworks/react/ui-kits/console/index.html` carries no `@dsCard` on purpose: it is an
app with its own scroll area, not a card.

Component demos load React from a local importmap pointing at `frameworks/react/vendor/*.js` — a
committed, generated ESM bundle of the `react`/`react-dom` devDependencies, since React 18 ships
CommonJS only and the importmap needs real ES modules (`bun run build:vendor`, guarded by
`check:vendor`) — and pull `@phosphor-icons/web` straight from `node_modules/`.

**JSX is compiled ahead of time, not in the browser**, so every component `.jsx` and every demo
`<page>.entry.jsx` has a compiled `.js` sibling that the page loads directly
(`bun run build:demos`, guarded by `check:demos`).

**So editing a component `.jsx` means running `bun run build:demos` in the same tree.** The React
DOM suites import the `.jsx` directly, so every test stays green with the `.js` sibling stale, and
it is easy to conclude the rebuild is unnecessary. It is not — the demo pages load the `.js`, so a
stale sibling means **`bun run demos` shows the pre-fix component while the suites prove the
fix**, which is exactly the by-hand check every `.prompt.md` checklist depends on.

`support.js` is a generated bundle (`dc-runtime`, whose source is not in this repo) used only by
the root `*.dc.html` pages. Do not edit it.

**Framework layers live under `frameworks/`.** The root holds only the framework-agnostic language
(`contracts/` — all three contract levels, `api/`, `behaviour/` and `design/`, plus
`design-generated/` — `guidelines/`, `assets/`, `scripts/`, `styles.css`) plus the demo runtime
(`theme.js`, `support.js`) and brand (`*.dc.html`).

Each layer has its own README; read it for the layer's shape.
`frameworks/react/` puts components under `components/<category>/<component-kebab>/`, the
Delivery Console under `ui-kits/console/`, the committed vendor bundles under `vendor/`, and the
harness plus the suites belonging to no one component under `test/`. Its layer root holds the
generated `Api.generated.d.ts` and `Tokens.generated.js` plus `DataVisuals.js`,
`UseContainerWidth.js` and `UseDialogModal.js` — that last one **because its suite counts as a
consumer**: its three component consumers are all in `feedback/`, but
`test/UseDialogModal.dom.test.jsx` is a consumer too, and the narrowest level containing that one
as well is the layer root.

`frameworks/angular/` holds the theme bridge (`theme/`), the Phosphor icon manifest (`icons/`),
and standalone `OnPush` primitives under `components/<category>/<component-kebab>/`
(`components/display/tag/` is the reference shape; the three SVG charts are the declared
exception — no manifest, no `.variants.ts`, token-valued camelCase `[style]` objects like
React's, and reviewed against React's `components/charts/Charts.card.html`), each styled by the
shared `frameworks/tailwind/` recipes through the configured `tv`. Count the components with
`find frameworks/angular/components -mindepth 2 -maxdepth 2 -type d | wc -l`. A primitive whose
behaviour only a browser can show also has `<Component>.card.html` + `.card.entry.ts` beside it,
built by `bun run build:angular-demo` and recorded in `check:angular-demos`. Those pages carry
**no** `@dsCard`: the bundle is git-ignored, and a blank page passes a viewport check by having
nothing to overflow. Its layer root
additionally holds the generated `Api.generated.ts` and `Tokens.generated.ts`, the
`BehaviourDelegated.json` declaration, and four shared internals — `ContainerSize.ts`,
`DataVisuals.ts`, `FocusTrap.ts` and `ProjectionMarkers.ts`, each named directly by
`frameworks/angular/index.ts`.

`frameworks/tailwind/` is a **single shared** Tailwind v4 layer (`@theme` preset + per-component
manifests), authored once because the token→utility mapping is pure CSS. Its root holds `Tv.ts`,
`ManifestClasses.js`, `Theme.css`, `Utilities.css`, `Animations.css`, `Specimen.css` and
`Specimen.js`, and a component's three files — `<Name>.manifest.json`, the generated
`<Name>.manifest.ts` and the `<Name>.card.html` specimen — sit together in
`components/<category>/<component-kebab>/`. Count the manifests with
`find frameworks/tailwind/components -name '*.manifest.json' | wc -l`.

**The Tailwind layer derives every utility from an existing token and introduces no new hex and
no new value** — add the token first, then reference it. This is machine-checked:
`check:tailwind` compiles the preset with the manifests as content and asserts every class emits
a rule and every theme key resolves to a real token — **and that it found any manifests at
all**, because a gate iterating zero manifests finds zero violations by construction.
`check:coverage` asserts every token either reaches a utility or is named in `EXCLUDED` with a
reason; `check:arbitrary` fails on a bracket carrying a raw literal; and `check:radius` fails on
the one core Tailwind utility in this namespace that resolves without a token —
`rounded-full` (`calc(infinity * 1px)`) where `rounded-pill` (`--r-pill`) belongs. That last is
the converse of `check:coverage` and just as narrow: it does not attempt "every utility traces
to a token" in general, only this one verified case.

`bun run check` runs every gate plus the test suite, without stopping at the first failure.
**Three gates are not runtime-portable**: `check:cards` needs a headless browser (`CHROME_PATH`,
or Chromium on the usual paths), `check:vendor` needs `Bun.build`, and `check:demos` needs
`Bun.Transpiler` — neither builder exists under plain `node scripts/check-all.mjs`, which leaves
each with nothing to compare against. Where a dependency is missing the gate exits 2, and
`check-all` marks it `SKIP` and reports the whole run `INCOMPLETE` rather than green;
`ARENA_CHECK_STRICT=1` — or `CI=true`, so an automated run never skips quietly — makes that a
hard failure instead.

**One shape for every framework layer.** The rule: **directories are `kebab-case` and lowercase; a
file name begins with a capital, and a multi-word stem is `PascalCase` with hyphens removed; a
secondary dotted segment stays `lowerCamelCase`** — `Badge.manifest.json`, `StatCard.variants.ts`.
Capital-initial is the rule and PascalCase is how a multi-word stem is *formed* under it, which is
why a conventional all-caps document name needs no dispensation: `README.md` and `CHANGELOG.md`
comply as they stand.

A layer lays its components out as `frameworks/<layer>/components/<category>/<component-kebab>/`,
and everything belonging to one component — its source, its types, its binding, its prompt, its
demo page, its tests — lives in that one directory. A file that is not one component's rises to the
narrowest level containing all of its consumers, and a compound family counts as its parent rather
than as the category.

**Six exceptions to the naming rule, and every one is mechanical rather than stylistic** — a
toolchain, a reader, or somebody else's source file recognises the literal name, so capitalising it
breaks or obscures something. All of them are cases the rule cannot cover: a name that begins with
a *lowercase* letter, or one with no stem to capitalise. **Measure the set rather than trusting a
list** — `find frameworks -type f -printf '%f\n' | grep -E '^[^A-Z]' | sort -u`.

1. `index.ts`, because TypeScript resolves a directory import by looking for exactly that filename
   and would not find `Index.ts` on a case-sensitive filesystem.
2. `index.html`, because a directory served over HTTP is answered by exactly that name
   (`frameworks/react/ui-kits/console/index.html`).
3. `tsconfig.check.json` and `tsconfig.test.json`, because `tsconfig*` is the name editors and
   toolchains recognise by convention. This is the softest of them, since `ngc -p <path>` is
   explicit and the rename would compile; the exception is for the reader.
4. `.gitkeep` (`frameworks/angular/.gitkeep`), which has no stem to capitalise.
5. **The five adopter-facing files under `frameworks/angular/theme/`** — `arena-tailwind.css`,
   `arena-material.css`, `arena-cdk.css`, `no-fouc.html` and `arena-material.prompt.md` — which do
   not share one reason. **The first three are named inside an *adopter's own* source, verbatim**:
   each is an `@import` line in the host app's own `styles.css`, so renaming one is a breaking
   change to every app that has adopted Arena — a fact about deployed apps, not about any document
   here. **`no-fouc.html` is not a fourth instance of that reason**: the adopter pastes the `<script>` tag's *contents* into their own
   `index.html` and never references the file by name, so renaming it breaks a documentation line
   rather than any adopting app. `arena-material.prompt.md` is cited nowhere and takes the stem of
   the file it documents. **Not exempt:** `theme/ThemeService.ts` and `icons/IconManifest.ts` are
   reached through `frameworks/angular/index.ts`, and no adopter ever writes either path.
6. **`frameworks/react/ui-kits/console/index.entry.jsx` and its compiled `index.entry.js`.** It
   inherits its exception — a demo page's composition script takes the stem of the page it
   composes, and that page is `index.html`, already exempt above. Renaming the pair to any other
   stem would break the HTTP directory index that makes `bun run demos` serve the app at
   `/frameworks/react/ui-kits/console/`.

`frameworks/tailwind/` carries no lowercase-initial file at all.

**`frameworks/Components.json` is the declaration and `check:structure` is the gate.** The file
names each component's category once, so the category is not written once per layer with nothing
holding the copies together, and the kebab directory name is **derived** from the PascalCase name
by `kebab()` — a function, never a table. The gate fails a component name declared in two
categories at once, a component directory in a category the file assigns elsewhere, a directory
the file does not name, a directory name that is not kebab-case, and a declared component present
in no layer. **It says nothing about whether the category is the RIGHT one** — that is editorial
judgement and no gate has it. Nor does a directory existing prove the component inside it is
complete: `check:api` and `check:behaviour` hold that.

`LAYERS` in `check-structure.mjs` is an exhaustive enumeration, deliberately **not** a walk of
`frameworks/`, so that a layer renamed or removed wholesale becomes loud (`zeroLayerProblems`)
instead of quietly leaving the gate's scope. **What a green `check:structure` does *not* warrant** is
that every sentence elsewhere in this file about a layer is current — nothing derives that and
nothing could cheaply check it.

**When `bun run check` is expected: once, when a plan's implementation is finished — not before
every commit.** The individual gates are cheap and stay available per commit (`check:dimensions`
after touching a framework layer, `check:tokens` after a rebuild), and a task that widens a gate
should still watch that gate fail and then pass. But the full sweep is a completion gate, not a
per-commit toll. Stating this is what lets a gate be expensive enough to be worth having: the
`@dsCard` viewport check needs a browser and a real render, and it could never have been afforded at
one run per commit.

## Conventions

- **English only.** All code, comments, docs, and UI copy are in English.
- **Specs and implementation plans live under `docs/superpowers/`** (`specs/`, `plans/`), dated
  `YYYY-MM-DD-<name>.md`. **A spec written ahead of its plan carries a `-pending-N` suffix until
  that plan exists**, because an unsuffixed spec sitting in `specs/` reads as work in flight; drop
  the suffix when the plan lands. They are deleted once executed, which is why debt filed in one
  dies with it — debt goes in `DOUBTS.md`.
- **No gradients** on any surface (the sole exception is `Skeleton`'s neutral shimmer). Depth comes
  from the `base-100`→`base-200`→`base-300` surface scale, the hairline border, and the warm shadow.
- **No emoji**, in product or docs.
- **Danger is outline, never filled** — transparent background, border and content in
  `--error`/`--danger`. The only filled danger surface in the whole system is the final irreversible
  confirmation inside `ConfirmDialog`. See `guidelines/components-danger.html`.
- **A commit message containing a backtick is written with a quoted here-doc**, never
  `git commit -m "…"`. A backtick inside a double-quoted shell string opens command substitution and
  is silently spliced away — the message lands with the name it was quoting missing, and nothing
  errors. Use `git commit -q -F - <<'MSG' … MSG` and verify with `git log -1 --format=%B`.
  **`git merge` does not accept `-F -`** — use `--no-commit`, then commit.
- **A release moves four things, and the tag is one of them.** The version string lives in
  `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and the README header; log the
  change in `CHANGELOG.md`; and because the plugin is served **from the tag**
  (`marketplace.json` → `source.ref`), that ref must name the release tag and the tag must exist on
  the release commit. Do all of it in the release commit, then tag it.
- **Anything landing on `main` after a tag goes under `## [Unreleased]`**, and a release is cut by
  renaming that heading to the version. Filing it under the last version instead describes a tree
  nobody has — the plugin is served from the tag, so the release is frozen the moment it is cut.
  `check-release.mjs` reads the first *versioned* entry, so `[Unreleased]` on top is expected and
  never a failure.
- **Forgetting the `ref` fails silently**, which is why it is machine-checked. The marketplace
  would advertise the new version while Claude Code keeps fetching the old tag, reads the *old*
  `plugin.json` there, and resolves the old version — the manifest's version always wins, so the
  update is never offered and nothing errors. Verify with `bun scripts/check-release.mjs` before
  publishing: it reads the version from `plugin.json` (the authority) and asserts every other
  surface agrees, above all that **the `plugin.json` at the pinned tag hands out the version being
  advertised**.
- **Charts** carry identity (the `--color-cat-*` ramp, in order, never cycled) or meaning (`tone`,
  the status colors) — never both in one chart. Status colors are never series colors. One axis,
  always.
- Responsive branches are JS, not media queries (inline styles cannot hold one), and measure the
  **container** via `useContainerWidth` — not the viewport.

## Known debt

Everything Arena knows is wrong, incomplete, or unverified lives in
[`DOUBTS.md`](./DOUBTS.md) — the one file in this repository with no character limit, because
debt is only useful when it is explained.

It holds five sections: the known-debt entries themselves; where the rest of the debt lives (the
reason-carrying maps in `scripts/`, which stay next to the code they burden because a stale entry
fails its own gate); the divergences between the React and Angular layers; what the READMEs
deliberately do not say; and the knowledge no identifier can carry.

**A component name written into ANOTHER file's prose is a cross-file claim no gate checks**, and it
rots silently while every gate stays green. When you change component `X`, run:

```bash
X=Skeleton   # the component you just changed
grep -rn --binary-files=without-match "\b$X\b" \
    --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
    CLAUDE.md DOUBTS.md contracts/api/ contracts/behaviour/ docs/ frameworks/ scripts/
```

and read every hit as a claim about `X` that you may have just falsified. Drop by hand the hits under
`X`'s **own** files, which describe the component instead of claiming something about it, and the
hits in `CHANGELOG.md`, which is a frozen record of what shipped at a tag. Add no content filter to
that command — the path list is the only scoping it needs, because `grep -rn` prints
`path:line:CONTENT` and a `grep -v` after it would drop hits by their *text*.
