# 8 — API capability contracts

**Status:** design, approved 2026-07-23. Plan A is specified in full; Plans B, C and D
carry their objective only, deliberately — the repository they execute against will not
be the repository that exists today, and detail written now would describe a tree nobody
will have. Plan E is specified in full for the opposite reason: it is a record of tests
suspended today, and a record that omits what it suspended is worthless.

## The problem

Arena already states two of its three contracts well. `tokens/` is the normative source
for design values, DTCG-conformant and machine-checked from five angles.
`behaviour/patterns/` states what a kind of component must do, every component binds a
pattern in every layer, and `check:compliance` verifies six of those bindings by
rendering the component and reading the DOM.

There is no third contract, and the API is where the cost has accumulated. Measured on
this tree: **196 props across 43 React components**, and **75 inputs plus 13 outputs
across 21 Angular primitives**. Classified against a fixed vocabulary, the React surface
divides as 76 primitives, 30 `React.ReactNode`, 23 enums, 22 functions, 20
`React.CSSProperties` escapes, 12 arrays of objects, 10 objects, and 3 unions between
kinds.

The absence of an authority shows up as prose. `components-divergences.md:1058` records
that `StatCard.delta` is one object prop in React and three flat inputs in Angular, and
states the reason plainly: *"The actual reason is signal inputs."* The framework's idiom
chose the API. `:1035` records the same shape for `Breadcrumbs`, where a per-item
`onClick` in React answers a single `navigate` output in Angular. The document's own
preamble concedes why neither can be called a defect: no layer is the authority for
component API, so a difference is only ever a difference.

The consequence is not aesthetic. A component's API is the one part of Arena a consumer
touches directly, and it is currently the only part with no normative source, no
vocabulary, and no gate.

## What this establishes

A third contract, sitting beside design and behaviour and orthogonal to both: **the API
capability contract**. One neutral contract per component, stating the members that
component's API presents. Every layer implementing that component implements exactly
those members. An API divergence stops being a recorded difference and becomes a defect.

### The vocabulary: seven forms

A member of any Arena component's API is exactly one of seven forms, and nothing else:

| Form | What it is |
|---|---|
| **primitive** | `string`, `number` or `boolean` |
| **enum** | a closed, named set of literals |
| **predefined object** | a record of fields, each field itself a primitive or an enum |
| **array of primitives** | a homogeneous list of one primitive type |
| **array of predefined objects** | a homogeneous list of one predefined object |
| **slot** | a space the consumer fills; may declare parameters the component lends it |
| **event** | an outbound member: a name plus a declared payload |

Six of the seven are inbound; **event** is the only outbound one. Arrays are one encoded
form discriminated by what they hold (see *Contract format*), which is a representation
choice and not a narrowing of the vocabulary.

The word **prop** does not appear in a contract. It is React's vocabulary, and a neutral
contract that used it would already have chosen a layer. A contract declares *members*;
each layer binds them in its own idiom.

### The five derived rules

These are what make an audit deterministic rather than a judgement call. Each is stated
with the members on this tree that violate it today.

**R1 — A predefined object is pure data.** No functions and no slots inside it. A field
that is a function becomes an **event of the component**, carrying the object in its
payload; a field that is a node becomes a **slot of the component**, or a primitive if
Arena draws it.

> Violating today: `Crumb.onClick`, `BulkAction.onClick`, `BulkAction.icon`,
> `Command.onRun`, `Command.icon`, `MenuItemDef.onClick`, `MenuItemDef.icon`,
> `ToastAction.onClick`, `Alert.action.onClick`, `TableColumn.render`, `Table.getRowKey`.

Angular already demonstrates the resolution: `run = output<ArenaBulkAction>()` carries in
its payload which action ran, where React embeds a callback per item.

**R2 — Who draws decides data versus slot.** If Arena draws the content — knows its
fields and owns its markup — it is an object or an array of objects. If the consumer
draws it, it is a slot. This is an objective test, not a preference, and it has a
consequence the repository already pays for: `check:compliance` can only judge DOM that
Arena renders, so content entering by slot is outside the behaviour contract.

**R3 — A parameterised slot fills, never replaces.** A slot may receive data from the
component, but it may only fill the interior of an element Arena renders — never
substitute the element that carries the behaviour contract.

> `TableColumn.render` survives: it paints inside the `<td>` Arena emits, so the row and
> cell roles remain Arena's and remain verifiable. `ActivityFeed.renderItem` and
> `Calendar.renderEvent` do not: each replaces the whole carrier element, and for
> `ActivityFeed` that element is the `<li>` holding `posinset` and `busy` in its
> behaviour binding.

**R4 — No platform types and no escapes.** `React.CSSProperties`, the `{...rest}` spread,
`React.Key`, `DOMRect`, `React.MouseEvent`, `React.HTMLInputTypeAttribute` and
`Record<string, unknown>` are none of the seven forms. An Arena enum or an Arena
predefined object takes their place.

> Violating today: `style` on 20 React components, plus `ActivityFeed.id`,
> `Calendar.meta`, `Onboarding.anchorRect`, `Input.type`, `SideNav.onNav`'s event
> parameter, and `Table.getRowKey`'s return.

The `style`/`{...rest}` removal is not a capability loss Angular has not already
absorbed: `components-divergences.md:681` and `:989` record it as deliberately not
ported, because in Angular a consumer writes those on the host directly.

**R5 — No unions between forms.** A member is one form. `(string | TabItem)[]` picks one.

> Violating today: `Tabs.tabs`, `Select.options`, `SegmentedControl.options`.

### What the contract governs, and what it does not

The contract governs the **member surface** — its name, its form, its type — and not the
syntax by which a platform expresses it. A slot named `mark` is one member; React binds
it to a `ReactNode` prop, Angular to `<ng-content select="[mark]">`. That is the same
contract in two idioms, and it is not a divergence. React has no content-projection
syntax and Angular has no node-valued input; demanding identical call-site syntax would
demand something neither platform can give.

This is the line that makes "zero API divergences" achievable rather than rhetorical:
identical members, idiomatic binding.

## Where contracts live

```
api/
  README.md                    the normative vocabulary: seven forms, R1-R5
  types/
    crumb.json                 predefined objects and enums, neutral and shared
    tone.json
  components/
    Breadcrumbs.json           one neutral contract per component
```

Generated per layer, on the same committed-generated-output contract `tokens.generated.js`
and `tokens.generated.ts` already carry:

```
frameworks/react/api.generated.d.ts
frameworks/angular/api.generated.ts
```

Emission is **per layer** so a component's import never crosses the `api/` ↔
`frameworks/` boundary — the same rule the script-readable token target established, and
for the same reason.

A single neutral file per component, not one per layer, is the structural difference from
`behaviour/`. Behaviour files a binding beside each layer's source and has a gate compare
them, which admits two files that disagree and makes the gate's job to notice. A contract
that forbids divergence has nowhere for a second opinion to live.

### Contract format

```json
{
  "component": "Breadcrumbs",
  "description": "A trail of ancestor locations ending at the current one.",
  "api": {
    "items":     { "form": "array",     "of": "Crumb",  "required": true,
                   "description": "The trail, root first. The last entry is the current location." },
    "separator": { "form": "primitive", "type": "string", "default": "/",
                   "description": "Drawn between crumbs, never before the first." },
    "navigate":  { "form": "event",     "payload": "Crumb",
                   "description": "A non-current crumb was activated." }
  }
}
```

`form` takes six values — `primitive`, `enum`, `object`, `array`, `slot`, `event` — and
`array` is discriminated by `of`: a primitive type name (`"string"`) makes it an array of
primitives, a declared type name (`"Crumb"`) makes it an array of predefined objects.

A slot declares its parameters, or none:

```json
"mark":  { "form": "slot" },
"cell":  { "form": "slot", "params": { "value": "string", "row": "TableRow" } }
```

A component's **default slot** — the one a consumer fills by writing content with no
marker — is the member named `content`. React binds it to `children`, Angular to a bare
`<ng-content />`. Naming it in the contract rather than leaving it implicit is what lets
assertion 3 see it: a layer that accepts arbitrary children without the contract
declaring a `content` slot is offering a member no contract governs.

Types are declared once, in `api/types/`:

```json
{ "name": "Crumb", "kind": "object",
  "fields": { "label": { "form": "primitive", "type": "string", "required": true },
              "href":  { "form": "primitive", "type": "string" } } }
```

```json
{ "name": "Tone", "kind": "enum",
  "values": ["neutral", "accent", "gold", "success", "warning", "danger", "info"] }
```

A `$description` on any node is carried into the generated modules. Group-level prose is
lost in `tokens/`'s generator and that is recorded as debt; this generator carries
descriptions on every node it emits, including type-level ones, so the same hole is not
reopened.

## The gate

`check:api` (`scripts/check-api.mjs`), the twenty-first, makes five assertions:

1. **Coverage.** Every contract in `api/components/` names a component that exists in at
   least one layer. The contract's existence *is* the coverage claim, so no separate
   record can go stale against it. A contract naming a component no layer implements
   fails.
2. **Form.** No member uses anything outside the seven forms. Read from React's `.d.ts`
   and from Angular's `input()` / `output()` / `model()` declarations.
3. **Agreement.** Every layer implementing a contracted component declares exactly the
   contract's members — same name, same form. Not fewer, not more. An **optional** member
   is still a declared member: `required: false` governs whether a consumer must supply
   it, never whether a layer must offer it, so a layer omitting an optional member fails
   this assertion like any other. **There is no exception map here.** An API divergence is
   a defect; that is the point of the layer.
4. **Derived rules.** R1 through R5, asserted against the declared types.
5. **Generated drift.** `api.generated.d.ts` and `api.generated.ts` match `api/types/`,
   the same assertion `check:tokens` makes for the token layer.

Which layers implement a component is resolved structurally, not from a list:
`frameworks/react/components/*/<Name>.d.ts` for React, and
`frameworks/angular/primitives/<kebab-name>/<kebab-name>.ts` for Angular. A component
implemented in one layer only is absence, not divergence, and assertion 3 applies only to
layers that implement it.

**Coverage is partial by design and grows one component at a time**, the same charter
`COVERED` carries in `check-compliance.mjs`. The gate never demands totality — only that
every contract in the directory is true of every layer implementing it. A green
`check:api` is a claim about the contracted components and says nothing about the rest.

### Runtime portability

`check-all.mjs` also runs `scripts/` under plain node, so `check:api` uses no
Bun-only API. The surface reader lives at `scripts/lib/api-surface.mjs` and is
deliberately generic — it takes source text and returns a declared member list, touching
no DOM and no framework runtime, mirroring `scripts/lib/behaviour-compliance.mjs`'s
design so it can be exercised from its own test under node.

Reading a `.d.ts` by regex is a real limitation and is stated rather than hidden: the
reader recognises the member shapes this repository's hand-written `.d.ts` files actually
use, and fails loudly on a shape it does not recognise rather than silently reporting no
members. A member the reader cannot parse is a gate failure, not a pass.

## The audit protocol

A component is not migrated by inference. For each one, the following is presented in a
single exchange:

1. its current API in every layer that implements it;
2. which member breaks which rule, cited to the rule;
3. two or three concrete reshapes, each with its cost.

The decision is the maintainer's. This is the explicit remedy for the failure mode the
divergences document records: `StatCard` became an object in React and three flat inputs
in Angular because each layer answered the question separately and each answer was
defensible on its own terms. A contract written by whoever migrates the component
reproduces exactly that.

Only after the decision: write the contract, migrate every layer, update the tests,
manifests and demos that follow, and run the gates.

### What happens to `components-divergences.md`

An entry whose entire content is an API divergence is **deleted**, not migrated — the
contract replaces it, and the divergence no longer exists to record. Entries covering
rendering or behaviour stay. Plan A deletes the `StatCard` entry (`:1058`) and the API
paragraphs of the `Breadcrumbs` (`:1035`) and `AppLogo` (`:914`) entries.

Three bindings cite this document as supporting evidence
(`command-palette.behaviour.json`, the `SideNav` delegated entry, and
`frameworks/angular/primitives/onboarding/onboarding.ts`). None of the three sections
Plan A touches is cited, but any later plan deleting a cited section must redirect the
citation in the same change.

---

# Plan A — the foundation

The deliverable is a working gate, not a document. Its scope is the vocabulary, the
directory, the generator, the gate, and three components migrated end to end to prove all
five work.

## A.1 — `api/README.md`

The normative statement of the seven forms and R1-R5, written the way
`tokens/src/TYPE-MAP.md` states the DTCG type table: the first thing a new platform
target reads. `CLAUDE.md` gains an *Architecture* paragraph pointing at it, in the same
register as the behaviour-contract paragraphs.

## A.2 — `api/types/` and the generator

`scripts/build-api-types.mjs` reads `api/types/*.json` and emits
`frameworks/react/api.generated.d.ts` and `frameworks/angular/api.generated.ts`. Objects
become interfaces, enums become string-literal unions, descriptions become doc comments.
Committed output, guarded by drift assertion 5.

Plan A declares only the types its three components need: `Crumb`, `StatDelta`,
`Direction`, `DeltaTone`, `Tone`, `LogoSize`, `Orientation`.

## A.3 — `scripts/lib/api-surface.mjs` and `scripts/check-api.mjs`

The reader and the gate, per the section above, plus `scripts/check-api.test.mjs`
asserting each of the five assertions fires — including the loud failure on an
unrecognised member shape. Wired into `check-all.mjs`'s step list, and
`check-all.test.mjs` asserts that array by literal value, so the addition must be made
there too.

## A.4 — The three demonstration components

Three rather than two, because two leave one of the seven forms unexercised by the gate
on the day it ships. Together these cover six of the seven forms and all five rules.

**`AppLogo`** — exercises **slot**, **enum**, **primitive**, and R4.
Its `mark` is a slot in both layers already, differently expressed, and the contract
records that as one member rather than a divergence. It also settles a divergence that is
real and **is not in the divergences document at all**, found while designing this: React
types `name` and `dim` as `React.ReactNode`, Angular as `input<string>`. One of the two is
wrong and the audit decides which. `style` and `{...rest}` leave React.

**`Breadcrumbs`** — exercises **array of predefined objects**, **event with payload**,
**primitive**, R1 and R5.
`Crumb.onClick` is the cleanest R1 violation on the tree and its resolution is already
proven on the Angular side: the callback leaves the object and becomes a `navigate` event
carrying the crumb. React migrates to it.

**`StatCard`** — exercises **predefined object**, **enum**, and R4.
The purest idiom divergence in the repository — one object against three flat inputs, with
the divergences document naming signal inputs as the reason. The audit picks one shape and
both layers implement it. The document also records a real behavioural consequence of the
split (React renders an empty pill for a delta with tone but no value, Angular renders
nothing); whichever shape wins, the two layers stop being able to differ on it.

Each component's migration touches, at minimum: the contract, the React `.jsx` and
`.d.ts`, the Angular `.ts` and its `.variants.ts` if slots move, the React and Angular
test suites, `*.prompt.md` in both layers, the group's `*.card.html` demo and its
`.entry.jsx`, the compiled `.js` siblings via `build:demos`, and the divergences entry.

## A.5 — Verification

`bun run check` once, at the end, per the repository's completion-gate rule. Individual
gates during the work: `check:api` after each component, `check:demos` after touching an
entry file, `check:behaviour` and `check:compliance` after any change that moves a slot,
since moving content into or out of a slot changes what Arena renders and therefore what
the compliance suites can verify.

**A migration must not silently retire a behaviour exception.** `AppLogo` and `StatCard`
are not in `COVERED` today; `Breadcrumbs` is not either. If a migration changes rendered
DOM, its behaviour binding is re-read and corrected in the same change rather than left
to rot.

## A.6 — Explicit non-goals

Plan A does not migrate the other 40 components, does not touch `tokens/` or
`behaviour/patterns/`, does not resolve the divergences-document migration that plan 7d
still owns, and does not change any published version or the plugin manifest.

---

# Plan B — the twenty-one shared components

**Objective.** Bring every component both layers already implement under contract, one at
a time through the audit protocol, until React and Angular present an identical member
surface for all of them and no API divergence remains between the two layers.

The subjects, resolved structurally and not from memory: `ActivityFeed`, `Alert`,
`AppLogo`, `Avatar`, `BarChart`, `Breadcrumbs`, `BulkActionBar`, `ChartCard`,
`CommandPalette`, `ConfirmDialog`, `DoughnutChart`, `EmptyState`, `ErrorState`,
`LineChart`, `Onboarding`, `PageHead`, `Skeleton`, `StatCard`, `Tag`, `ThemeToggle`,
`UnauthCard`. Three of them land in Plan A, leaving eighteen.

# Plan C — the twenty-two React-only components

**Objective.** Define the contract for every component that exists in React alone, and
migrate React to it — so that each component's API is settled and normative *before*
Angular has an implementation to defend, rather than after.

The subjects are exactly the twenty-two Angular currently delegates to Material:
`Badge`, `Button`, `Calendar`, `Card`, `Checkbox`, `Dialog`, `IconButton`, `Input`,
`Menu`, `Pagination`, `ProgressBar`, `Radio`, `SegmentedControl`, `Select`, `SideNav`,
`Spinner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Tooltip`. The two sets
coincide exactly, which is what makes the sequence work.

`Table` is where R3 gets its first real test: `TableColumn.render` is the repository's
only parameterised slot, and the rule that it may fill a cell but never replace a row was
written for it.

# Plan D — the twenty-two Angular primitives, built on the CDK

**Objective.** Give Angular a real Arena primitive for each of the twenty-two controls it
delegates today, satisfying all three contracts — design, behaviour and API — and remove
Angular Material from the repository.

Nothing is implemented from zero and no third-party source is copied into the tree.
`@angular/cdk` — installed today only as a transitive dependency of Material — is promoted
to a declared one, and each primitive is built on its accessibility engine: verified
against the compiled source of CDK 22.0.5, `cdk/dialog` applies `role`, `aria-modal`,
`aria-labelledby`, `aria-describedby`, `aria-label` and `aria-live`; `cdk/menu` applies
`role`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-checked`,
`aria-orientation` and `aria-disabled`; `cdk/listbox` applies `role`,
`aria-activedescendant`, `aria-selected`, `aria-multiselectable`, `aria-orientation` and
`aria-disabled`; and `cdk/a11y` supplies `ConfigurableFocusTrap`, `FocusMonitor`,
`ListKeyManager`, `FocusKeyManager`, `ActiveDescendantKeyManager`, `TreeKeyManager`,
`AriaDescriber`, `InputModalityDetector` and `HighContrastModeDetector`.

Arena writes the markup and the styling, which it must own regardless — the CDK ships no
colour, no typography and no radius, only positional CSS.

Why this satisfies all three contracts, and why no other option did:

- **Design.** Material's compiled CSS is invisible to `check:dimensions` and
  `check:tailwind`, so these twenty-two controls sit outside the design contract today.
  With every visual decision in an Arena recipe, they come inside it, and
  `theme/arena-material.css` — which exists only to override Material's own visual CSS
  through `--mat-*` — dies with them.
- **Behaviour.** The twenty-two live in `behaviour-delegated.json` today, outside the
  compliance regime, and `CLAUDE.md` already records that every claim those declarations
  make about Material is unpinned and rots silently. With Arena rendering the DOM,
  `check:compliance` can verify them by render and that file disappears entirely.
- **API.** The CDK exposes directives and services, never a component API a consumer
  touches, so each primitive's public surface is entirely Arena's. Wrapping Material
  instead would leave `MatSelect`'s own API and DOM reachable, with the contract
  governing only a wrapper.

Two gaps are named rather than discovered later. `Tabs`, `Switch`, `Checkbox`, `Radio`
and `Pagination` have no headless CDK component — Arena writes their ARIA, though native
elements do most of the work and `ListKeyManager` covers the roving tabindex. And
**`Calendar` is the hard one**: its date arithmetic belongs to Material rather than the
CDK, and React's `Calendar` is no reference either, since `CLAUDE.md` records that it
implements no keyboard navigation at all. `Table` and `Tooltip` carry the same warning —
Plan D should repair behaviour rather than port a contract that is known to be deficient.

# Plan E — restore the suspended tests

**Objective.** Uncomment the seven tests suspended for speed while plans A through D
reshape the repository, and run the whole suite and every gate green with all of them
live.

Plans A through D touch nearly every component in both layers, so the test suite is run
constantly. Measured on this tree before any change: **770 tests across 63 files in
48.14s**, of which **41.56s came from seven tests in two files**. Suspending exactly
those seven brings the suite to **5.91s for 763 tests** — an eight-fold speed-up for
0.9% of the tests.

## What is suspended

Both blocks are commented with a leading `// ` per line, opened by a five-line
`PLAN-E-SUSPENDED` header and closed by a `PLAN-E-SUSPENDED-END` marker. Line-prefix
comments rather than a `/* */` block on purpose: both regions contain doc comments whose
`*/` would close an enclosing block early. `grep -rn PLAN-E-SUSPENDED scripts/` finds
every one.

**`scripts/check-card-viewports.test.mjs`, lines 19-224 — five tests, 33.59s.**
Each launches headless Chromium over CDP: `measurePage reports content that fits, and
content that over-runs`; `contentHeight follows an absolutely positioned descendant at
any depth`; `contentHeight follows a trailing block margin the body's own padding stops
from collapsing away`; `measurePage rejects instead of hanging when a page never
answers`; `a slow-but-honest page times out inside the script instead of past the outer
CDP bound`. The file's other ~20 tests are pure functions — `parseDsCard`,
`summarizeCards`, and the string assertions on `MEASURE_SCRIPT` — and stay live, which
is why the file was cut surgically rather than suspended whole.

**`scripts/check-angular.test.mjs`, lines 9-38 — two tests, 7.97s.**
Both shell out to a full `ngc --strictTemplates` run over the Angular layer: `the Angular
layer as committed typechecks`, and `a template referencing a member that does not
exist fails`. The whole file is the `ngc` run, so there was nothing to keep.

## What is actually lost, stated precisely

Less than the headline suggests, and the distinction matters. **The gates themselves
still run.** `check-all.mjs` invokes `check-card-viewports.mjs` and `check-angular.mjs`
as steps in their own right; what is suspended is the tests that verify *those gates'
machinery*, not the gates. `bun run check` still measures every `@dsCard` page in a real
browser and still typechecks the Angular layer with `ngc`.

What is genuinely uncovered until Plan E:

- **`measurePage`'s behaviour against a real browser.** The file's own comment already
  says the surviving `MEASURE_SCRIPT` string assertions are *"not a substitute for the
  browser-backed tests — it is a cheap trip-wire"*. During plans A-D that trip-wire is
  all there is: a change to the stability loop, the frame wait or the deadline would be
  caught only in shape, not in behaviour.
- **`typecheck()`'s own contract** — that it reports a non-zero status with locatable
  output on a bad template. `check:angular` proves the layer compiles; the suspended test
  proves the gate would notice if it did not.

Neither hole is one plans A-D are likely to fall into, and both close the moment Plan E
runs. But a green suite between now and then is a weaker claim than it was on
2026-07-23, and that is the trade being made.

## Restoring

Delete the five header lines of each block, strip the leading `// ` from every line until
the `PLAN-E-SUSPENDED-END` marker, delete the marker, then run `bun run test` and
`bun run check` in full. The suite should return to roughly 770 tests and ~48s; a
materially different count means a plan added or removed tests without recording it.

Plan E is the last thing done, after D, and it is not optional: a suspended test that
outlives the reason for suspending it is exactly the stale exception every gate in this
repository is built to reject.

## Risks carried across all four plans

**A contract can be correct and the component still broken.** The API contract is
orthogonal to behaviour, exactly as `check:behaviour` is a coverage claim and never an
accessibility one. A green `check:api` says the surface matches; it says nothing about
what the component does with it.

**Plan C defines contracts from components with known behavioural debt.** `Table` and
`Calendar` implement no keyboard navigation; `Tooltip` is not keyboard-reachable. Their
APIs can still be settled — an API for a component that does not yet trap focus is not
thereby wrong — but Plan D must not read a Plan C contract as a specification of
behaviour.

**Removing Material is a one-way door.** Once `arena-material.css` and
`behaviour-delegated.json` are gone and twenty-two primitives exist, returning to Material
means undoing all of it. The gate that makes this survivable is that Plan D happens last,
after every contract it implements against is already settled and proven by Plans A
through C.
