# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Arena is Dravensoft's design system. **The repository itself is not an npm package**, and its
root `package.json` is **dev-only and private**; what npm gets is two packages *assembled*
from this tree into `frameworks/<layer>/dist/`, which is a different thing and is described
below. In the root manifest: the token layer is built from DTCG JSON
by Style Dictionary, and the scripts are tested with `bun test`, as is each framework layer
from its own suites (`bun run test:scripts` / `test:react` / `test:react-dom` /
`test:angular`, or `bun run test` for all four).

Those four run in **two `bun test` processes**, not one, preceded by a build the Angular
suites need before either process can see them, because the preload registers a DOM globally
and must not share a process with the DOM-free suites. **The preload must never reach the
DOM-free invocation and is mandatory for the DOM one**: without a DOM already installed,
`react-dom` latches its `input`-event support false at module evaluation and an `onChange`
handler receives a dispatched event **zero** times, silently.
[`frameworks/react/README.md`](./frameworks/react/README.md) carries the mechanism in full.
**The single authority for that command is `testStep()` in
`scripts/check/arena/check-all.mjs`**, and its `.test.mjs` sibling asserts the args array by
literal value. Read it there rather than reconstructing one; a narrowed invocation matching
fewer files is indistinguishable from one matching all of them, so a stale path reports green
over a tree it never opened.

**The criterion that decides which invocation a suite belongs to is the `.dom.test.`
filename infix, wherever the file sits.**

**A test under `scripts/` may not import a framework layer's `.ts` or `.tsx`**, because
`scripts/` is the one suite `check-all.mjs` also runs under plain node, which does not resolve
the extensionless imports those toolchains expect. A property worth asserting against a real
recipe or component is asserted from that layer's own suites, which in both layers sit beside
the component they cover.

It ships as three things at once from the same tree:

- a **Claude Code plugin** (`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`, registering the `design` skill defined by the root `SKILL.md`);
- two **npm packages**, `@dravensoft/arena-react` and `@dravensoft/arena-angular`, assembled by `bun run build:packages` into `frameworks/<layer>/dist/`;
- a standalone **Agent Skill** (`SKILL.md`).

**`SKILL.md` routes and states no rule twice.** It is the root of the *consumer* branch of the
documentation, the way this file is the root of the contributor one, and the two branches are
almost disjoint: an agent building with Arena reads the router, then
`frameworks/Catalog.generated.md`, then one component's `.prompt.md`, and needs none of the
normative READMEs under `contracts/api/`, `contracts/behaviour/` or `frameworks/`. Keep it that
way. **A rule that binds a consumer belongs in `SKILL.md` or in a `.prompt.md`, and a rule
about changing Arena belongs here**; a rule written into both goes stale in one of them.

**A published Arena carries the language and never the skin**, which is the decision the
whole npm channel follows from: the palettes and the fonts arrive as an `arena.config.json`
the consuming project writes, and the `arena-theme` command each package ships turns it into
the one stylesheet a package cannot carry. Phosphor is a peer dependency in both, never a
bundled asset. **`dist/` is git-ignored and six gates skip a directory of that name**, because
it puts a copy of each layer inside the tree they walk; the exclusion is asserted in each
gate's own suite. Both packages are **live on npm**, **published by a workflow** over OIDC, one
per layer that changed, so the two sit at different versions whenever a release left one alone;
`check:packages` holds the manifests and
holds `arena-theme` equivalent to the Style Dictionary pipeline it duplicates.
[`frameworks/PACKAGING.md`](./frameworks/PACKAGING.md) is the normative statement of the
channel, and each package's consumer-facing README is authored as
`frameworks/<layer>/PACKAGE.md` and copied into `dist/` at assembly, so `check:docs` reads
the page npm shows.

`contracts/design/README.md` is the normative design specification (voice, color, spacing,
danger convention, iconography, theming). Treat it as the source of truth for any design
decision, and update it in the same change whenever a token, component, or convention
changes. The root `README.md` is Getting started and nothing more; `contracts/README.md`
maps the rest of the repository.

## Documentation rules

- **Every `.md` file stays under 60,000 characters.** `SIZE_EXEMPT` in `check-docs.mjs` names
  what is exempt by charter and says why each one is. Measure the way the gate does, with
  `node -e "console.log(require('fs').readFileSync('X','utf8').length)"`, and never with
  `wc -m`, which counts bytes: a file of multi-byte characters reads hundreds over a limit it
  is comfortably under. `check:docs` fails hard rather than warning, so an overrun surfaces at
  the end of a batch rather than as a calm decision. The way it is bought back is always the
  same: move a layer's own tour into that layer's README and leave the cross-layer rule with a
  pointer. What spends the budget is a new **rule**, not a new component; this file carries no
  literal count of anything, only the commands that produce them.
- **Documentation punctuates with a colon, a comma, a semicolon or a full stop, never with an
  em dash.** A dash pair enclosing an aside becomes commas, or parentheses where commas would
  nest; a dash that amplifies or introduces a list becomes a colon; a dash marking a turn
  becomes a semicolon or a second sentence. An en dash between two numbers is a range and
  stays. The rule reaches prose only, so a fence and a code span keep what the code they quote
  contains.
- **Documentation is written in the present tense** and describes what Arena is, never what
  it was, when a part of it arrived, or which part is newest. A retired token, a fixed defect,
  a former directory layout and a batch number belong in the commit log, which is where the
  history already is, and is dated. The reason a rule exists is not history and stays:
  state it as a property of the thing, not as an incident.
- **The best comment is the one not written.** A method carries its own context through its
  name. The only exception is `scripts/` and test files, which may carry **one** comment,
  inline or block, as a file header, **at most 10 lines**. Files a script generates are
  outside the rule entirely and keep their comments.
- **A contracted member's own doc is the one carve-out, and it earns it by being held.** Under
  `frameworks/<layer>/components/`, a `/** … */` above a member is exempt, because `check:api`
  fails it unless its text is that member's `description`, and fails one on anything no
  contract names. A comment a gate keeps equal to its source cannot go quietly false, which is
  the whole reason the rule exists. **That shape and no other**: a `//` or a bare `/*` there
  still fails, as does a `/** … */` outside a component directory. `generate:api` writes them,
  so nobody types one; `contracts/api/README.md` says why they must exist at all.
- Knowledge a rename cannot express, such as a measurement, a vendor's behaviour, a pinned
  version or a constraint of a test environment, goes in the one header `scripts/` and test
  files are allowed, in a gate's own reason string, or in the component's `.prompt.md`.
  Somewhere a stale copy of it fails something.

`bun run check:docs` holds the size rule, the punctuation rule and the comment rule. It reads
both by lexing rather than by matching: a `//` inside a string, a regex or a template literal
is never mistaken for a comment, a `@ts-`/`eslint-` directive is a directive rather than the
file's one allowance, and a Markdown fence closes only on a run of its own character at least
as long as the one that opened it. The present-tense rule is the one no gate holds, because
nothing mechanical can judge it.

## Viewing things

Everything is static, but the demos `fetch()` their JSX, so `file://` will not work. Serve the repo root over HTTP:

```bash
bun run demos   # builds, serves the repo root on :8000, prints the entry points
```

- `intro/guidelines/*.html`: token specimen cards (type, color, spacing, effects, icons, brand, danger convention).
- `frameworks/react/components/**/*.card.html`: live component demos; the two shapes a page takes are under *Every React component is a trio*. List them with `find frameworks/react/components -name '*.card.html'`.
- `frameworks/react/ui-kits/console/index.html`: the Delivery Console example app.
- `intro/Arena - Overview.html`: the token language, generated at runtime. **It shows no components on purpose**, because those belong to the framework layers.
- `intro/Dravensoft Identity.dc.html`: the approved brand manual, and the only `dc-runtime` page.

**`intro/` is one unit and neither page may leave it.** Each loads `styles.css` and its runtime as
siblings and reaches `assets/`, `node_modules/`, `contracts/` with one `../`; moved, it renders
unstyled, **silently**.

## Architecture

**Tokens are the only styling layer, and their values are DTCG JSON.** `intro/styles.css` does
nothing but `@import` seven files split across two directories: `contracts/design-generated/`,
which holds five CSS files, and `contracts/design/`, which holds two hand-authored ones:
`reset.css`, imported **first** so anything can override it, and `colors.css`. Four of those five
carry the `.generated.` infix, so the name says it: their
values are authored in strictly-conformant DTCG 2025.10 JSON under `contracts/design/` and
emitted by `bun run generate:tokens`. Edit the JSON and rebuild.
`contracts/design/README.md` states what those values MEAN and
`contracts/design/TokenTypes.md` beside it is the normative table of which DTCG `$type` every
token group uses. The split is by audience: a new platform target reads both, a consumer of a
value reads neither, because the JSON is the value.

The split matters. **`contracts/design/palette.{dark,light}.json` is the skin**: the
daisyUI-structured `--color-*` / `--color-*-content` pairs per theme (dark on `:root`, light on
`.arena-light`) plus the 8-slot categorical chart ramp, and it is what a consumer swaps to
re-skin Arena. **`contracts/design/colors.css` is the structure**, and stays hand-authored: the
compatibility layer mapping Arena's legacy aliases onto those tokens, plus the `color-mix`
derivations of the muted text levels from `--color-base-content`. `colors.css` never defines a
skin value; `palette.generated.css` is imported before it. `fonts.generated.css` stays generated by
`scripts/generate/core/fetch-fonts.mjs`.

**The layer contract.** DTCG owns *values*; the composition layer owns *how values are
combined at runtime*. Two things DTCG deliberately does not model, and that therefore live
in each platform's own idiom: the runtime colour derivations (`color-mix`, in
`contracts/design/colors.css`) and `@font-face` bundling (`contracts/design-generated/fonts.generated.css`).
A new framework target rebuilds that thin layer in its idiom on top of the same standard
values, and never re-defines a value.

**A third thing lives in the composition layer: a token whose consumer is JavaScript rather
than CSS.** A token flagged `$extensions["com.dravensoft.arena"].script: true` emits twice: the
custom property it always would have, and a bare number exported from each layer's
`Tokens.generated.*`. Emission is **per layer** so a component's import never crosses the
`contracts/design/` ↔ `frameworks/` boundary. Flag a token only when JS arithmetic must consume
it to produce a position: an SVG `y` from a data value, a clamp against `window.innerWidth`.
The price is not negotiable: a value bound at import time **cannot re-theme and cannot
re-densify**. `check:script-tokens` asserts the modules match the source and the CSS and that no
flag is orphaned; `check:duplicate-constants` fails a numeric constant declared in both layers.

**That gate also reaches across into the API layer, for exactly one type.**
`contracts/api/types/cat-slot.json` declares `CatSlot` as the literal set `1 | … | 8`, and the
8 is not authored there: it is the count of `--color-cat-*` slots in `palette.dark.json`,
reaching the layers as the derived `catSlots` constant. `catSlotEnumProblems()` asserts the set
is exactly `1..catSlots` **in order**, so a ninth colour in the ramp fails the build until the
contract type follows. It is deliberately that one named case and not a mechanism.

**Behaviour has values, and they are tokens like any other.** `contracts/design/behaviour.json`
holds `delay` (pointer intent), `dismiss` (how long a transient notice lives) and `limit`
(quantity invariants), all script-readable because their consumers are `setTimeout` arguments
and array bounds. Two rules govern what belongs there. **A behaviour value is a decision the
system makes, not a mechanism**. `--delay-open` is how long a tooltip waits, and that is a
design decision; a debounce interval on a synchronous in-memory filter is not. And **a value is
not a contract**: which keys a dialog answers, where focus lands, what dismisses it, none of
that is expressible as a token, and DTCG does not model it.

**Behaviour also has contracts, and they are not tokens.** `contracts/behaviour/*.json` states
what a kind of component must do (roles, keys, focus, dismissal), one file per pattern, each
citing the source it is adopted from. **Most cite a WAI-ARIA APG page; count them rather than
trusting a figure here** (`ls contracts/behaviour/*.json | wc -l` for the total,
`grep -l 'apg/' contracts/behaviour/*.json | wc -l` for the APG-derived share; note that
`navigation` cites an APG *practices* page rather than a *patterns* one, so a grep on
`apg/patterns` alone undercounts by one). The exceptions are the interesting part, and they are a
**growing** set rather than a fixed one: `progressbar`, `status` and `textbox` cite the ARIA 1.2
role reference, because APG has no pattern page for any of those roles;
`figure-with-data-table` is Arena's own and cites WCAG, because APG has no chart pattern; and
`none` and `absent` cite nothing, because there is nothing to adopt from when the claim is that
no pattern applies. **That set is asserted by literal value**, as `none aside, exactly the
patterns with no APG pattern page cite something else`, in
`scripts/lib/arena/behaviour-contracts.test.mjs`, so a
new pattern citing anything but an APG *patterns* page fails that test until the list follows. It
is the one claim here a grep for a component name can never catch, because it is written in
terms of patterns. `requires` is a flat map of **dotted** keys, and that shape is load-bearing:
an exception names exactly one requirement, so one entry cannot excuse a whole clause.

Every component declares, in **every** layer, beside its own source: `<Name>.behaviour.json`.
A layer missing a component altogether records it in
`frameworks/angular/BehaviourDelegated.json` binding `absent`, so the fact is machine-checkable
rather than only stated in prose. **There is no such file today**, because Angular implements
every component React has, and the gate reads it only when present, so the next absence still
fails.

**A binding has two shapes, and the second exists because a binding describes a COMPONENT
while the evaluator judges a RENDER.** A component that renders differently by its own props is
several renders, and no flat exception list is correct for all of them. So a binding either
names one `pattern` and lists its `exceptions`, or declares `cases`: named render
configurations, each with its own `when` in prose, its own `pattern` and its own `exceptions`.
Declaring both is rejected. **The flat shape stays valid and means one case**, so the untouched
majority is not churned to say so; count the cased ones with
`grep -rl '"cases"' --include='*.behaviour.json' frameworks/ | wc -l`. `bindingCases()` in
`scripts/lib/arena/behaviour-contracts.mjs` is the **single** place the two shapes are reconciled.
`behaviour-compliance.mjs` knows nothing about cases; `comparePattern` reads
`binding.exceptions` and nothing else, so each test wrapper synthesizes a per-case binding,
which keeps the one file that runs in three runtimes out of it. `when` is prose and can only be
prose: nothing can verify that a suite rendered the configuration a case names.

**A count of exceptions is a count of DECLARATIONS, not of distinct defects**, and the
difference is the one way prose about this layer goes quietly false: a requirement unmet in two
cases is correctly declared twice. A raw count of `"requirement"` is not comparable across the
point where a binding gains cases, and a drop in it must never be reported as "N defects
removed". Count distinct binding+requirement pairs when the question is about defects:
`grep -rHo '"requirement": "[^"]*"' --include='*.behaviour.json' frameworks/ | sort -u | wc -l`.

**The wrapper drives the case loop.** `assertPatternCases`, in both layers' test helpers,
takes a map of case name → a **thunk** that renders that case, and compares that key set against
the declared names *before anything mounts*; a never-rendered case and an undeclared one are
both errors. A suite merely *asked* to call once per case can forget. Where a flat binding gives
the wrapper no case list to drive, call `assertPattern` once per meaningful variant by hand.

`check:behaviour` asserts every component declares, that no declaration names a pattern or
requirement that does not exist, that no delegated entry is stale, and that the layers agree or
say why not. When they disagree the gate names both and picks no winner, because the pattern is
the authority. **It does not assert that a component behaves as it declares**: a component can bind
`dialog-modal` and trap no focus. A green run is a coverage claim, never an accessibility one.

**What checks whether a component behaves as it declares is a render suite, in both layers,
with one component-shaped hole.** `check:compliance` is the coverage record; the verification
lives in render suites. **Both layers hold them the same way**: beside the component they
cover, with the handful belonging to no one component in `frameworks/<layer>/test/`; those four
trees are `SUITE_DIRS` in `scripts/check/arena/check-compliance.mjs`. They assert, per requirement of a
component's bound pattern, that the rendered DOM either meets it with no exception declared, or
fails it with one declared. That single bidirectional statement is the stale-exception rule:
**an exception can expire.** No pattern is excluded, `grid` included.

The shared evaluator is `scripts/lib/core/behaviour-compliance.mjs`, DOM-generic on purpose: it
touches only `tagName`, `getAttribute`, `hasAttribute` and `textContent`, because it is
consumed from three runtimes, one of them plain node in its own test, which has no DOM. It
returns a third value, `null`, for requirements no single element can decide (`focus.*`,
`keyboard.*`, `content.noAutoDismiss`, `alternative.table`); a suite must name each of those
in its `behavioural` map and assert it by acting on the tree, and each layer's wrapper throws
if one is silently skipped. **Coverage is partial by design and grows one component at a
time**. `COVERED` is the record, with the same bidirectional staleness rule `EXEMPT` carries;
the gate never demands totality, only that every claim in it is true. **`COVERED` is keyed by
`<component>:<layer>`**, and which layer a suite belongs to is decided **structurally**:
`validateCoverage` checks the key's layer against `suite.layer`, a tag `collectSuites()`
attaches from the `SUITE_DIRS` tree the file was found under, before it checks that the suite's
text names that layer's binding path tail. A key without a `:layer` suffix is rejected.

**A reference is resolved rather than counted, and `each` is quantified rather than sampled.**
`IDREF` names the reference-carrying requirement keys and is **derived** from
`IDREF_ATTRIBUTES` rather than hand-written beside it. Resolution arrives from outside, with
each layer's wrapper building a `resolveId` from the render root, because the evaluator runs in a
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
exactly those members. A member is one of **nine forms** (primitive, enum, predefined object,
array of primitives, array of predefined objects, consumer data, functionInput, slot, event)
and six derived rules govern them (R1 an object is pure data with known fields, R2 who draws
decides data versus slot, R3 a parameterised slot fills and never replaces, R4 no platform
types and no escapes, R5 no unions between forms, **R6 no render is derived from whether a
listener is bound or a slot was filled**, which is a question at least one platform cannot ask,
so the answer is a declared member and the eight that exist for this reason each say so).

**A contract also states the component's `affordances`**, from the closed set `hover`/`focus`:
the pointer and focus states its own render reacts to. Not a member, and here anyway because
the question is neutral and every layer needs the same answer: `behaviour/` is per pattern and
`design/` holds values. The array is mandatory and empty means none.

**Consumer data is the eighth**: a record whose keys the *consumer* names, which Arena routes
and never inspects. It is exactly one spelling, `Record<string, unknown>`, and a record of a
*known* type stays an R4 violation. Two things about it are mechanical: it may not be a field
of a predefined object, and a member taking it in must declare a route back out (a slot
parameter or an event payload) or it is data Arena can never surface.

**`functionInput` is the ninth, and the narrowest**: a function the consumer supplies, which
the component calls on its value and whose result it uses: a validator, a parser. It exists
for data-entry controls and nothing else, and that is machine-checked: `check:api` rejects one
in any contract not declaring `"kind": "input"` at top level. Its signature is modelled
(`params` name → type, `returns`), R4 holds inside it, and the gate compares the signature
between the contract and each layer. **A return of `React.ReactNode` is not one, and is not a
member at all**: it is a per-item renderer. R3 permits the shape, so R3 is not the reason; the
reason is Angular, which has no answer for per-item projection short of a structural directive
and `ngTemplateOutlet`, a binding no row of the table covers and no reader function reads.

`contracts/api/README.md` is the normative statement and the first thing a new platform target
reads, the way `contracts/design/README.md` is for the design layer. Shared objects and enums
are declared once in `contracts/api/types/` and emitted **per layer** by `bun run generate:api`.
The word *prop* never appears in a contract: it is React's vocabulary, and using it would
already have chosen a layer.

**The structural difference from `contracts/behaviour/` is one file, not one per layer.**
Behaviour files a binding beside each layer's source and has a gate compare them, which admits
two files that disagree; a contract that forbids divergence has nowhere for a second opinion to
live, and **`check:api` carries no exception map at all**. Coverage is partial by design: a
green run is a claim about the contracted components and says nothing about the rest, and,
being orthogonal to behaviour, nothing about what any of them *does* either. **To know what is
contracted, run `bun run check:api` and read the contract/layer pair it prints.**

**When a consumer needs their own content inside ONE item of something Arena draws, make the
item a component.** Per-item projection stops applying the moment the consumer instantiates one
element per item instead of handing Arena a render function, so Angular's missing
`ngTemplateOutlet` binding stops being the obstacle. `RadioGroup`/`Radio`,
`Calendar`/`CalendarEvent` and `Table`/`TableRow`/`TableCell` all follow it. The parent owns
**where** an item goes and the item owns **what** it looks like; the parent reads its children's
props and injects the rest with `cloneElement`; Angular has no `cloneElement`, so the item
injects the parent and pulls its signals instead, and nothing is pushed at all, which is why the
fragment and wrapper hazards below are React's alone. **Neither layer's coordination is a member
of any contract.**

**A compound parent's content slot is OPTIONAL, and the one exception is a named group.**
Measure it rather than trusting this: run `grep -rn '"form": "slot"' contracts/api/components/`
and read the `required` flags. Every compound ROOT declares its children optional and guards
nothing, and so does a container that merely nests. Only a section that renders a **heading
naming the group** requires and guards, because a childless one renders a label for nothing. A
root promises nothing that an empty render would break. **What a root must still not do is
ship an invalid degenerate render**: with no children `Tabs` draws an empty tablist and **no**
tabpanel, because a panel whose `aria-labelledby` points at a tab that does not exist is worse
than an absent one.

**The `SideNav` family is the recursive case, and the layers solve it in opposite directions.**
In React nesting is arbitrary, to any depth, with **no context anywhere**, because injection is
**direct children only, one hop**, and a section or a collapsible re-injects into its own children
with `depth + 1`. Angular pushes nothing: each container re-provides `SideNavState` at `depth + 1`
and a row **pulls** the nearest. React's shared helper is
`frameworks/react/components/navigation/side-nav/SideNavInject.tsx`, which covers that family and
no more, so the placement rule sends it to the family's parent directory. **Its `.tsx` extension
is load-bearing**: `check:dimensions` never opens a `.js`, and its `indentFor()` produces a
governed `padding-inline-start`. It is a `.tsx` under `components/` that is **not a component**,
since a component is a **directory**, in `reactComponents()` and in every count of the set.

Every compound family shares one limit: **a consumer's own wrapper component between two levels
breaks the chain, and so does a fragment.** `React.Children.toArray` flattens a nested array and
does *not* flatten a `<>…</>`, so a fragment arrives as one opaque child that `cloneElement`
decorates uselessly. Write items as siblings or in an array, never wrapped; the fragment half is
easy to miss because the array half works.

**And a guard must count what the render path counts.** `React.Children.count()` counts a bare
`false` as one child where `toArray()` drops it, so a `count()`-based "this must not be empty"
guard passes the commonest conditional-render idiom, `{isAdmin && <SideNavItem …/>}` with the
condition false, straight through to the empty render the guard exists to refuse. Use
`toArray().length`.

`Table.label` is the pattern for a member that only a human can supply: it names the grid for
assistive technology, it is `required: true`, and it is **guarded at runtime** rather than
defaulted. A constant fallback is rejected on the charts' own evidence, since a name that is
present but only says what the component *is* satisfies `roles.label` mechanically while telling
a screen-reader user nothing, and nothing can derive it, because a data table's subject is
editorial. `SegmentedControl.ariaLabel` is the same shape.

**A closed set of values is not always an enum**, and the condition is a gate rather than a
judgement: a set that merely restates a value the token layer already derives may be an enum
**only while something machine-checks the restatement**. `CatSlot` is the one type that does
this, and `check:script-tokens` is what ties it back to the ramp. **A second such type would
need its own tie before it may be an enum at all.**

**Some contracts govern one layer only, and that is a property of the component, not a gap.**
The set is React's alone, so **count it rather than trusting a figure**: every component
**directory** under
`frameworks/react/components/<category>/` with no matching directory under
`frameworks/angular/components/<category>/`. **It is empty today**, with the layers at 50/50, and
it refills whenever React lands a component first, which is the point of the arrangement: such
an API is settled and normative *before* Angular has an implementation to defend.

**The single-icon convention reaches `Button` and `IconButton`**: a component's icon is a
Phosphor class-name string Arena draws, never a slot, so `IconButton` presents no slot at all
and a per-item or single icon is one system across the library. The price is recorded rather
than hidden. Flattening each `<button>`'s heritage clause drops the five `form*` overrides and
every global/ARIA attribute a `{...rest}` spread would forward, with no gate behind the loss:
`check:api` reads the `.tsx`, so a restored spread fails, but nothing re-derives which native
members the flattening dropped.

**`check:react-types` compiles the layer.** That README says what it reaches, and which two
compiler options are load-bearing rather than stylistic.

**A grid is verified by walking its cells, one key press per step.** `Calendar` and `Table` have
suites in both layers. A grid suite
asserts at every cell that focus landed where the arrow should take it and that exactly one
`tabindex="0"` exists and is that cell; each edge clamp is one extra press, never a blind loop.
**The bill is the press count, not what is asserted**, because each press re-renders the grid
through `act()`, so the fixture stays small and explicitly sized: three rows by two columns.

**A dimension in a framework layer is a token or a derivation of tokens. A bare literal is a
bug.** This is machine-checked: `bun run check:dimensions` scans `frameworks/` for literals in
the properties the token layer governs and fails on each. A value passes when it is
`var(--token)`, a `calc()`/`min()`/`max()`/`clamp()` over one, zero, or a unit the token layer
does not model (`%`, `ch`, `fr`, the viewport and angle units, since DTCG admits only `px` and
`rem` in a dimension, plus `s`/`ms`, which this gate alone tolerates). **The same three shapes are
what a Tailwind bracket may hold, and the two gates share the same unmodelled-unit list**, but
they are not one list: this inline gate additionally tolerates `s`/`ms`, while the bracket gate
does not, because `--dur-*` and `--loop-*` model duration.

**What the scan reaches, what it does not, and its two known blind spots are in
[`scripts/check/arena/README.md`](./scripts/check/arena/README.md), beside the gate.** Read it
before assuming a site is covered: the reason the three SVG charts write their static styling
as camelCase `[style]` objects rather than as attributes is there, and it is not a style
preference. A change to `EXEMPT` or `PASSTHROUGH` is a change to
`check-dimension-literals.test.mjs` too, since that suite asserts on both maps by name.

**No gate compares a Tailwind manifest against a rendered component, and the mapping is not
one-to-one**: a manifest mirrors a *surface*, which a compound family draws with several
contracted components and a composing component draws with someone else's. The only components
with no manifest are the three SVG charts. `check:tailwind` proves every class resolves; nothing
proves a manifest still matches the contract it was written from, so check by hand when either
has moved.

One narrow slice of that is machine-checked: `check:states` fails a `hover:`/`focus:`-family
modifier on a slot when no contract the manifest covers declares that affordance, and fails a
React component that implements one its own contract does not declare. Both halves read
`contracts/api/`; neither reads another layer, and neither runs the other way, because a
declared affordance a layer leaves to the child it composes is not a divergence. Angular is
structurally unaskable, because it realises an affordance by rendering the manifest's own class.
`MANIFEST_COVERS` carries the wider surfaces with a reason each. **This checks states only**, and
nothing about whether a manifest's colors, sizes or slot structure still match.

**The Overview generates itself, and that is the point.** `intro/Arena - Overview.html` reads names
and `$description`s from `contracts/design/*.json` and the alias names from `colors.css` (with
`scripts/lib/arena/css-decls.mjs`, the same parser the drift gate uses), but it reads **values** from
`getComputedStyle` on the live document. So it exercises the whole chain (JSON, build, CSS,
browser) instead of restating the JSON, and a token that resolves empty is flagged as stale
rather than shown as in effect. Add a token and it appears with no edit to the page. The
group-to-preview mapping lives in `scripts/lib/core/token-preview.mjs` and **never** in the
token source, which stays platform-neutral.

When adding a colour, define the daisyUI token in `palette.dark.json` and `palette.light.json`
first, rebuild, then alias to it in `colors.css`, and never introduce a raw hex in a component.
After any `contracts/design/` edit: rebuild, then run `check:dtcg` (source is valid DTCG
2025.10), `check:tokens` (committed CSS matches the source), `check:ramp` (the ramp still
clears every gate) and `check:text-contrast` (every gated level clears 4.5:1 in both themes).
Colours are structured sRGB objects, dimensions and durations are
`{value,unit}` objects, and letter spacing is a `number` carrying an `em` render hint in
`$extensions`.

**Each layer implements the modal focus contract for itself, and `contracts/behaviour/dialog-modal.json`
is the only authority either answers to.** Every focusable selector repeats
`:not([tabindex="-1"])` on every clause, because a selector list is OR'd and
`button:not([disabled])` alone would pull a real `<button tabindex="-1">` back into the tab
order; none of them caches the focusables. Escape always reports through the component's
**own** dismissal channel (`onClose`, `onCancel`, `onSkip`), so meeting the pattern adds no
member anywhere. **The rule that a component is self-contained is about CSS classes, not about
JS helpers.**

**What a suite can prove about a focus trap, and what it cannot.** The boundary wrap is Arena's
own `.focus()` call, and happy-dom honours `.focus()`, so it is asserted for real. The
**interior**, meaning that Tab from a control in the middle reaches the next one, is the browser's
native sequential focus navigation, which neither layer implements and happy-dom does not have;
a test asserting it would pass identically against a perfect trap and against none. So the
interior is `check:focus-trap`'s: real Chromium over each declared page, one real Tab press per
stop, one page per layer that binds the pattern.

**Components carry no CSS classes.** Each `frameworks/react/components/**/*.tsx` renders with
inline `style` objects reading the custom properties (`background: 'var(--crimson)'`), and
handles hover/active/focus with local `useState`. There is no `.btn` class to target; theming
happens entirely through token values. Keep new components self-contained the same way, with
`Button.tsx` as the reference shape.

**The one exception: a `<style>` tag injected once**, for what an inline style genuinely cannot
express, meaning `@keyframes` and vendor pseudo-elements. **Never a `<style>` rendered inside
the component's own markup**, which ships one tag per instance and leaks the CSS into the
element's `textContent`. [`frameworks/react/README.md`](./frameworks/react/README.md) carries
the injection pattern, and how little to inject.

**Every animation answers `prefers-reduced-motion`**, and what it answers depends on what the
motion means. [`contracts/design/README.md`](./contracts/design/README.md) states the four
cases and the reason for each. It is stated there rather than per layer because it is a design
decision, and a layer that disagrees with it is wrong.

**Every React component is a trio, and the three files live in the component's own directory**,
`frameworks/react/components/<category>/<component-kebab>/`: `X.tsx` (implementation and its
exported `XProps`), `X.prompt.md` (usage, examples, Do/Don't) and an entry in a `*.card.html`
demo. **The layer carries no hand-written `.d.ts`**: the published one is emitted from the
source, so the two cannot disagree. **That
demo page is one of two shapes**: `X.card.html` in the component's own directory when the card
is about that component alone, or a page one level up, beside the directories at its category
level, when it composes several components onto one card (`display/Display.card.html`,
`navigation/MenuPagination.card.html`). A category-level page belongs to no one component, which
is why the placement rule puts it there rather than inside any of them. Adding a component means
adding all four.

**A new React component also moves a literal count outside its own layer, and the React suite
alone cannot see it move.** `scripts/lib/arena/behaviour-contracts.test.mjs` asserts
`reactComponents('.').length` by literal value; a new component **directory** moves it by one
and the assertion must be updated **in the same commit**. **Verify with the merged process**,
the args array in `testStep()`, because `bun test frameworks/react` never matches `scripts/`,
so it reports green over a tree whose test run is red. That is a different hazard from the
two-invocation rule above: this one is about a path a narrowed invocation never matched.

**A new component in either layer also moves `frameworks/Catalog.generated.md`**, the index
every consumer reads before reaching for anything. It is generated, so nothing is written by
hand: run `bun run generate:catalog`, which `bun run build` already does, and commit the
result. It is **tracked**, unlike everything else a generator writes under `frameworks/`,
because the plugin is served from the git tag where nothing runs a build, so an uncommitted
catalog is a wrong answer handed to every reader of that tag. `check:catalog` fails a stale one.

The Angular layer is a quartet, the same three plus its recipe, in
`frameworks/angular/components/<category>/<component-kebab>/`: `<Component>.ts` (standalone
`OnPush` component, `arena-` selector, signal I/O, no component `styles`),
`<Component>.variants.ts` (a `tailwind-variants` recipe built with `frameworks/tailwind/Tv.ts`),
`<Component>.prompt.md`, and an `index.ts` barrel, plus `<Component>.behaviour.json` and the
component's own suites, `<Component>.<facet>.test.ts`, in the same directory. The three SVG charts are the one
exception and have no `<Component>.variants.ts`. Angular has **all six** of the categories the
layout rule allows, and implements every component the layer ships.
**A primitive binds its root slot to the host rather than rendering a wrapper div**, with a
growing carve-out set for roots that must be a specific semantic or interactive element;
`frameworks/angular/README.md` states the rule, the carve-outs and the display-utility
requirement `HostClassBinding.test.ts` guards.

**The Angular test harness compiles ahead of the run, AOT rather than JIT, and that is a
different guarantee, not merely a faster one.** `bun run build:angular-tests` compiles the whole
test surface with `ngc --strictTemplates`, and every run target is that emit rather than the
`.ts` sources, so a type error anywhere in it fails the *build* and no test executes at all.
**A green compile is a claim about TYPES, never about behaviour.** One process means one
document and one `TestBed` for the whole layer, so **state written onto that shared document
outlives the file that wrote it** and every directly-created fixture must be `destroy()`-ed.
[`frameworks/angular/README.md`](./frameworks/angular/README.md) carries all of it.

**Specimen/demo pages** start with an HTML comment
`<!-- @dsCard group="…" viewport="WxH" name="…" subtitle="…" -->` that drives external card
rendering. Keep it as the first line, the only line `check:cards` reads. **That viewport is
machine-checked**: the gate loads every declaring page at its declared width in headless
Chromium and fails when the content over-runs the box in either axis, because the card is
cropped to it and the overflow is lost silently. Declaring it by arithmetic does not work, so
measure by running the gate. A page declaring far *more* height than it renders only warns.
`frameworks/react/ui-kits/console/index.html` carries no `@dsCard` on purpose: it is an app
with its own scroll area, not a card.

**A file a script under `scripts/` writes is named `<stem>.generated.<ext>`, and that name is
the whole rule**: `check:docs` reads it and never opens the file. Whether it is *tracked* is a
separate question `.gitignore` answers, and the line is audience, not provenance. Two reasons
keep one tracked: **the tag has to hand it to a reader directly**, true of
`contracts/design-generated/` and the `assets/fonts/` binaries, so ignoring the token CSS
would ship a tag whose `intro/styles.css` `@import`s resolve to nothing, unstyled and silent;
or **a clone cannot reproduce it**, true of `assets/fonts/Fonts.generated.json`, whose rebuild
needs the network. Everything a script writes under `frameworks/` is ignored, by one pattern,
with a reason per family in `UNTRACKED`, **with one negation**:
`frameworks/Catalog.generated.md` is the first reason rather than a hole in the second, and
`check:catalog` asserts it is tracked because `check:generated` scans no `.md` and so cannot.
So a fresh clone
runs `bun run build` first; [`scripts/build/README.md`](./scripts/build/README.md) is the
first-compile document, linked from the root README. `check:generated` holds both halves and
names the two outputs that can hold neither infix nor header: the `assets/fonts/` binaries, and
`intro/support.js`, whose generator (`dc-runtime`) is not here, so it can never be ignored,
and must not be edited.

Component demos load React from a local importmap pointing at
`frameworks/react/vendor/*.generated.js`, an ESM bundle of the `react`/`react-dom`
devDependencies, since React 18 ships CommonJS only (`build:vendor`, guarded by
`check:vendor`), and pull `@phosphor-icons/web` straight from `node_modules/`.

**A component is compiled ahead of time, not in the browser**, so every component `.tsx` and
every demo `<page>.entry.tsx` has a `.generated.js` sibling the page loads directly
(`build:demos`, guarded by `check:demos`). **So editing a `.tsx` means running
`bun run build:demos` in the same tree.** The suites import the `.tsx` directly and stay green
with the sibling stale, but the demo pages load the sibling, so **`bun run demos` shows the
pre-fix component while the suites prove the fix**, which is exactly the by-hand check every
`.prompt.md` checklist depends on.

**The layers are peers, and no layer is any other's authority.** A file under
`frameworks/<A>` may not name layer B nor any of B's source files, by import or in prose;
`check:layer-independence` fails one that does, and `EXEMPT` is empty. **One edge is
`ALLOWED`**: an Angular `<Component>.variants.ts` imports the generated
`<Component>.manifest.generated` through `frameworks/tailwind/Tv.ts`, because a manifest is
data travelling one way. Where two layers answer the same question differently, the contract
is what makes the answers comparable: a cross-layer *gate* under `scripts/check/arena/`
reading several layers is that mechanism rather than an instance of the coupling, which is why
`scripts/` is outside the gate's scope. A fact only recorded as "matching the other layer" is
a fact missing from a contract.

**Framework layers live under `frameworks/`.** The root holds only the framework-agnostic language
(`contracts/`, holding all three contract levels, `api/`, `behaviour/` and `design/`, plus
`design-generated/`; `assets/`; and `scripts/`, which sorts itself into `build/`, `generate/`,
`check/` and `ci/` by domain and carries a README at every level) plus `intro/`, the browsable front: `styles.css`,
`guidelines/`, the runtime (`theme.js`, `toggle.css`, `overview.js`, `support.js`) and the two
pages it serves. **No `.html`, `.css` or `.js` sits loose at the repository root.**

Each layer has its own README; read it for the layer's shape.
`frameworks/react/` puts components under `components/<category>/<component-kebab>/`, the
Delivery Console under `ui-kits/console/`, the vendor bundles under `vendor/`, and the
harness plus the suites belonging to no one component under `test/`.
`frameworks/react/README.md` names what sits at the layer root and why each is there.

`frameworks/angular/` holds the theme bridge (`theme/`), the Phosphor icon manifest (`icons/`),
and standalone `OnPush` primitives under `components/<category>/<component-kebab>/`
(`components/display/tag/` is the reference shape; the three SVG charts are the declared
exception, with no manifest, no `.variants.ts` and token-valued camelCase `[style]` objects), each styled by the
shared `frameworks/tailwind/` recipes through the configured `tv`. Count the components with
`find frameworks/angular/components -mindepth 2 -maxdepth 2 -type d | wc -l`. A primitive whose
behaviour only a browser can show also has `<Component>.card.html` + `.card.entry.ts` beside it,
built by `bun run build:angular-demo` and recorded in `check:angular-demos`. Those pages carry
**no** `@dsCard`. `frameworks/angular/README.md` says why, and names what sits at the layer root.

`frameworks/tailwind/` is a **single shared** Tailwind v4 layer (`@theme` preset + per-component
manifests), authored once because the token→utility mapping is pure CSS. Its root holds the
preset, the generated `Utilities.generated.css`, the shared `tv`, the animation utilities and the specimen
harness; and a component's three files, `<Name>.manifest.json`, the generated
`<Name>.manifest.generated.ts` and the `<Name>.card.html` specimen, sit together in
`components/<category>/<component-kebab>/`. Count the manifests with
`find frameworks/tailwind/components -name '*.manifest.json' | wc -l`.

**The Tailwind layer derives every utility from an existing token and introduces no new hex and
no new value**: add the token first, then reference it. Four gates hold it, `check:tailwind`,
`check:coverage`, `check:arbitrary` and `check:radius`, and `frameworks/tailwind/README.md`
states what each reaches and what none of them does.

`bun run check` runs every gate plus the test suite, without stopping at the first failure.
**Four gates are not runtime-portable**: `check:cards` and `check:focus-trap` need a headless
browser, `check:vendor` needs `Bun.build`, `check:demos` needs `Bun.Transpiler`. Where a
dependency is missing the gate exits 2 and is reported `SKIP`, **except that the repository
declares itself strict**, so it fails instead. Every environment variable they read is declared
in `scripts/lib/arena/arena-scripts-vars.mjs`, and a real one wins over it;
`scripts/check/README.md` has the table.

**CI narrows that run by domain, never by gate name.** `check-all.mjs` takes `--domain=` and
`--no-tests`, four jobs partition `GATES`, and `check-all.test.mjs` asserts the partition, so a
gate cannot join `GATES` and then run in no job.
[`.github/workflows/README.md`](./.github/workflows/README.md) has the four workflows, why the
`core` job runs on every change, and why the two packages sit at different versions.

**One shape for every framework layer.** The rule: **directories are `kebab-case` and lowercase; a
file name begins with a capital, and a multi-word stem is `PascalCase` with hyphens removed; a
secondary dotted segment stays `lowerCamelCase`**, as in `Badge.manifest.json` and `StatCard.variants.ts`.
Capital-initial is the rule and PascalCase is how a multi-word stem is *formed* under it, which is
why a conventional all-caps document name needs no dispensation: `README.md` and `DOUBTS.md`
comply as they stand.

A layer lays its components out as `frameworks/<layer>/components/<category>/<component-kebab>/`,
and everything belonging to one component (its source, its types, its binding, its prompt, its
demo page, its tests) lives in that one directory. A file that is not one component's rises to the
narrowest level containing all of its consumers, and a compound family counts as its parent rather
than as the category.

**Six exceptions to the naming rule, and every one is mechanical rather than stylistic**: a
toolchain, a reader, or somebody else's source file recognises the literal name, so capitalising it
breaks or obscures something. All of them are cases the rule cannot cover: a name that begins with
a *lowercase* letter, or one with no stem to capitalise. **Measure the set rather than trusting a
list**, with `find frameworks -type f -printf '%f\n' | grep -E '^[^A-Z]' | sort -u`.

1. `index.ts`, because TypeScript resolves a directory import by looking for exactly that filename
   and would not find `Index.ts` on a case-sensitive filesystem.
2. `index.html`, because a directory served over HTTP is answered by exactly that name
   (`frameworks/react/ui-kits/console/index.html`).
3. `tsconfig.check.json` and `tsconfig.test.json`, because `tsconfig*` is the name editors and
   toolchains recognise by convention. This is the softest of them, since `ngc -p <path>` is
   explicit and the rename would compile; the exception is for the reader.
4. `.gitkeep` (`frameworks/angular/.gitkeep`), which has no stem to capitalise.
5. **The three adopter-facing files under `frameworks/angular/theme/`**, which do not share one
   reason. `arena-tailwind.css` and `arena-cdk.css` are named **inside an adopter's own source,
   verbatim**: each is an `@import` in the host app's `styles.css`, so renaming one breaks every
   app that has adopted Arena. **`no-fouc.html` is not a third instance of that**: the adopter
   pastes the `<script>`'s *contents* and never names the file, so renaming it breaks a
   documentation line rather than an app. **Not exempt:** `theme/ThemeService.ts` and
   `icons/IconManifest.ts` are reached through `frameworks/angular/index.ts`, which no adopter writes.
6. **`frameworks/react/ui-kits/console/index.entry.tsx` and its `index.entry.generated.js`.** It
   inherits its exception, because a demo page's composition script takes the stem of the page it
   composes, and that page is `index.html`, already exempt above. Renaming the pair would break
   the HTTP directory index that serves the app at `/frameworks/react/ui-kits/console/`.

`frameworks/tailwind/` carries no lowercase-initial file at all.

**`frameworks/Components.json` is the declaration and `check:structure` is the gate.** The file
names each component's category once, so the category is not written once per layer with nothing
holding the copies together, and the kebab directory name is **derived** from the PascalCase name
by `kebab()`, a function and never a table. The gate fails a component name declared in two
categories at once, a component directory in a category the file assigns elsewhere, a directory
the file does not name, a directory name that is not kebab-case, and a declared component present
in no layer. **It says nothing about whether the category is the RIGHT one**, which is editorial
judgement and no gate has it. Nor does a directory existing prove the component inside it is
complete: `check:api` and `check:behaviour` hold that.

`LAYERS` in `scripts/lib/arena/layers.mjs` is an exhaustive enumeration, deliberately **not** a walk of
`frameworks/`, so that a layer renamed or removed wholesale becomes loud (`zeroLayerProblems`)
instead of quietly leaving the gate's scope. **What a green `check:structure` does *not* warrant** is
that every sentence elsewhere in this file about a layer is current: nothing derives that and
nothing could cheaply check it.

**When `bun run check` is expected: once, when a plan's implementation is finished, and not
before every commit.** The individual gates are cheap and stay available per commit
(`check:dimensions` after touching a framework layer, `check:tokens` after a rebuild), and a task
that widens a gate should still watch that gate fail and then pass. But the full sweep is a
completion gate, not a per-commit toll. Stating this is what lets a gate be expensive enough to be
worth having: the `@dsCard` viewport check needs a browser and a real render, which no repository
can afford at one run per commit.

## Conventions

- **English only.** All code, comments, docs, and UI copy are in English.
- **Specs and implementation plans live under `docs/superpowers/`** (`specs/`, `plans/`), dated
  `YYYY-MM-DD-<name>.md`. **A spec written ahead of its plan carries a `-pending-N` suffix until
  that plan exists**, because an unsuffixed spec sitting in `specs/` reads as work in flight; drop
  the suffix when the plan lands. They are deleted once executed, which is why debt filed in one
  dies with it: debt goes to a gate, a suite, a normative README or a `.prompt.md`, as
  `DOUBTS.md` sets out.
- **No gradients** on any surface (the sole exception is `Skeleton`'s neutral shimmer). Depth comes
  from the `base-100`→`base-200`→`base-300` surface scale, the hairline border, and the warm shadow.
- **No emoji**, in product or docs.
- **Danger is outline, never filled**: transparent background, border and content in
  `--error`/`--danger`. The only filled danger surface in the whole system is the final irreversible
  confirmation inside `ConfirmDialog`. See `intro/guidelines/components-danger.html`.
- **A commit message containing a backtick is written with a quoted here-doc**, never
  `git commit -m "…"`. A backtick inside a double-quoted shell string opens command substitution and
  is silently spliced away: the message lands with the name it was quoting missing, and nothing
  errors. Use `git commit -q -F - <<'MSG' … MSG` and verify with `git log -1 --format=%B`.
  **`git merge` does not accept `-F -`**, so use `--no-commit`, then commit.
- **A release moves five things, and the tag is the one the other four are pinned to.** The version string lives in
  `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and the README's artifact list.
  Because the plugin is served **from the tag**
  (`marketplace.json` → `source.ref`), that ref must name the release tag and the tag must exist on
  the release commit. Do all of it in the release commit, then tag it. **Because a published tag
  is a promise about the tree it resolves to, history is never rewritten.** `git filter-repo` and
  every equivalent are refused outright, whatever a repository-size argument says, because every
  published tag would stop resolving to the tree it resolved to at install time. **The two npm
  packages take that same version and are never hand-versioned**: `baseManifest()` stamps it from
  `plugin.json` at assembly, and `check:packages` fails a manifest that disagrees. They are
  published **last**, by the workflow that fires on a green `main` after the tag lands, and only
  the one whose layer changed; `frameworks/PACKAGING.md` carries the sequence and the traps.
- **Forgetting the `ref` fails silently**, which is why it is machine-checked. The marketplace
  would advertise the new version while Claude Code keeps fetching the old tag, reads the *old*
  `plugin.json` there, and resolves the old version: the manifest's version always wins, so the
  update is never offered and nothing errors. Verify with `bun scripts/check/arena/check-release.mjs` before
  publishing: it reads the version from `plugin.json` (the authority) and asserts every other
  surface agrees, above all that **the `plugin.json` at the pinned tag hands out the version
  advertised**.
- **Charts** carry identity (the `--color-cat-*` ramp, in order, never cycled) or meaning (`tone`,
  the status colors), never both in one chart. Status colors are never series colors. One axis.
- Responsive branches are JS, not media queries (inline styles cannot hold one), and measure the
  **container** via `useContainerWidth`, never the viewport.

## Debt

**A debt is paid, or made loud, before it is written down.** [`DOUBTS.md`](./DOUBTS.md) states
what counts as one and where the records that are not prose live: a reason-carrying map beside
its gate, a suite assertion, a normative README, a component's `.prompt.md`. Prefer any of those
to a paragraph: each of them fails when it stops being true, and a paragraph does not.

**A claim about a file you have not READ is how a document goes quietly false.** "I grepped it"
is not sufficient evidence, because a query answers where a name appears and never what the file
around it says. Three shapes recur, and none is findable by a keyword query:

- **A document describing ITSELF**: a README naming its own directory layout, a clause excluding
  a path that a move has since merged into the path two sentences above it. Only an end-to-end
  read finds these.
- **A component name written into ANOTHER file's prose**, which rots while every gate stays green.
  A *structural* reference is fine and should not be hunted, meaning this component's own render
  naming what it draws. What rots is a citation asserting **another** component's current state.
- **A sibling cited by its bare filename**, which a refactor rewrites in every import specifier
  and nowhere in a sentence.

When you change component `X`, read every hit of:

```bash
X=Skeleton   # the component you just changed
grep -rn --binary-files=without-match "\b$X\b" \
    --include='*.md' --include='*.json' --include='*.mjs' --include='*.tsx' --include='*.ts' \
    CLAUDE.md DOUBTS.md contracts/api/ contracts/behaviour/ docs/ frameworks/ scripts/
```

Drop by hand the hits under `X`'s **own** files. **Scope a worklist by its path list and never by piping `grep -n`
through `grep -v`**: `-n` prints `path:line:CONTENT`, so a filter after it drops hits by their
*text*, which silently excludes any directory whose name the filter happens to match.

**Prefer no exemplar, or a command.** Both are stale-proof, and a component name in prose is not.
