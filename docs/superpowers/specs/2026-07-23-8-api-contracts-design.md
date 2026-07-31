# 8 — API capability contracts

**Status:** design, approved 2026-07-23. **Plan A shipped 2026-07-23** — the vocabulary,
the directory, the generator, the gate and three migrated components are on `main`; its
implementation plan was `docs/superpowers/plans/2026-07-23-8a-api-contracts-foundation.md`.
Plans B, C and D still carry their objective plus what Plan A settled, deliberately — the
repository they execute against will not be the repository that exists today, and detail
written now would describe a tree nobody will have. Plan E is specified in full for the
opposite reason: it is a record of tests suspended today, and a record that omits what it
suspended is worthless.

Everything below the *What this establishes* heading and above *What Plan A settled* is
the original design and is unchanged. Plans B through E were revised on 2026-07-23, after
Plan A executed, against what it actually decided and discovered — the sections say which
figures were re-measured rather than inherited.

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

### The vocabulary: nine forms

A member of any Arena component's API is exactly one of nine forms, and nothing else:

| Form | What it is |
|---|---|
| **primitive** | `string`, `number` or `boolean` |
| **enum** | a closed, named set of literals |
| **predefined object** | a record of fields, each field itself a primitive or an enum |
| **array of primitives** | a homogeneous list of one primitive type |
| **array of predefined objects** | a homogeneous list of one predefined object |
| **consumer data** | a homogeneous list, or a single record, whose element type the contract does not describe |
| **functionInput** | a function the consumer supplies, which the component calls and whose result it uses; **input controls only** |
| **slot** | a space the consumer fills; may declare parameters the component lends it |
| **event** | an outbound member: a name plus a declared payload |

Eight of the nine are inbound; **event** is the only outbound one. Arrays are one encoded
form discriminated by what they hold (see *Contract format*), which is a representation
choice and not a narrowing of the vocabulary.

> **Added by Plan 8C1, Task 1b — the eighth form.** This section said *seven* and was
> false: `Table.rows` is a member and was none of them, and the *Contract format* section
> below named a `TableRow` slot-parameter type that cannot be declared. **Consumer data**
> is a record whose keys the *consumer* names — Arena routes it and never inspects it,
> which is neither "Arena draws it" (an object) nor "the consumer draws it" (a slot). It
> is exactly one spelling, `Record<string, unknown>`; a record of a *known* type is a
> predefined object and stays an R4 violation, because a form admitting any record would
> re-legalise the escape R4 closed. Exactly two things about it are mechanical — R1's
> extension below, and the rule that a member taking it in must declare a route back out
> (a slot parameter or an event payload) — and everything else is an authoring rule with
> R2 and R3's status. `api/README.md` is the normative statement of all of it.

> **Added by Plan 8C2, Task 1b — the ninth form.** **`functionInput`**: a function the
> consumer supplies, which the component calls on its value and whose result it uses — a
> validator, a parser. It is neither an event (outbound, returning nothing) nor a datum,
> and the layer refused the shape everywhere until now: an inbound function that returns a
> value was none of the eight, which is why the charts' `valueFormatter` became
> `valueSuffix`. This **deliberately reverses that refusal for data-entry controls only**.
> Two guards keep it narrow and both are mechanical, not authoring rules: it is legal only
> in a contract declaring `"kind": "input"` at top level, and its signature is modelled —
> `params` (name → type) and `returns`, each a primitive or a declared type, with R4
> holding inside — and compared against every layer's. A return of `React.ReactNode` is
> **not** one: that is a parameterised slot (R3), and the reader throws rather than
> admitting a render prop through this form. `api/README.md` is the normative statement.

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
> cell roles remain Arena's and remain verifiable. **`ActivityFeed.renderItem` and
> `Calendar.renderEvent` survive R3 too** — this section originally claimed they did not, and
> plan 8B0 measured the source and found the claim false. `ActivityFeed.jsx` renders
> `<li …>{renderItem ? renderItem(item) : …}</li>`, so the `<li>`, and any `posinset` or
> `busy` that ever lands on it, stay Arena's; `Calendar.jsx` does the same inside the
> positioned element carrying the event's `onClick` and `aria-label`. Both fill and neither
> replaces. R3 is therefore not what removes either of them — plan 8B0's audit removes
> `renderItem`, with the removal itself landing when `ActivityFeed` is brought under contract,
> because per-item projection has no binding in Angular, which is a vocabulary limit and not
> a rule violation.

**R4 — No platform types and no escapes.** `React.CSSProperties`, the `{...rest}` spread,
`React.Key`, `DOMRect`, `React.MouseEvent` and `React.HTMLInputTypeAttribute` are none of
the nine forms. An Arena enum or an Arena predefined object takes their place, and the rule
reaches inside a `functionInput`'s modelled signature too (Plan 8C2, Task 1b).

> **Re-measured after Plan 8C1, Task 1b.** `Record<string, unknown>` was on that list and
> has left it: it is **consumer data**, the eighth form. That is a promotion of one exact
> spelling and nothing wider — `Record<string, Widget>` is still an R4 violation. R1 gained
> its own extension in the same change: a predefined object may not carry a consumer-data
> field, which is what deletes `Calendar.meta` from `CalendarEvent` rather than relocating
> it there.

> Violating today: `style` on 20 React components, plus `ActivityFeed.id`,
> `Calendar.meta`, `Onboarding.anchorRect`, `Input.type`, `SideNav.onNav`'s event
> parameter, and `Table.getRowKey`'s return.
>
> **`ActivityFeed.id` and `Onboarding.anchorRect` are resolved as of Plan 8B3** — this is a
> historical record of the pre-migration state, not a live claim, for either. `ActivityFeed.id`
> (was `React.Key`, an R4 escape) narrowed to primitive `string` and stayed optional when Task 4
> brought `ActivityFeed` under contract. `Onboarding.anchorRect` (was `DOMRect`, an R4 escape) was
> replaced by the predefined object `OnboardingAnchor { left: number; bottom: number }` **and
> renamed to `anchor`** when Task 5 brought `Onboarding` under contract — the maintainer's Reshape
> A′, since the member no longer names a `Rect`. `Calendar.meta`, `Input.type`, `SideNav.onNav`'s
> event parameter and `Table.getRowKey`'s return are all still open; none is a Plan B subject.

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
  README.md                    the normative vocabulary: nine forms, R1-R5
  types/
    crumb.json                 predefined objects and enums, neutral and shared
    tone.json
  components/
    Breadcrumbs.json           one neutral contract per component
```

Generated per layer, on the same committed-generated-output contract `tokens.generated.js`
and `tokens.generated.ts` already carry:

```
frameworks/react/Api.generated.d.ts
frameworks/angular/Api.generated.ts
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

`form` takes seven values — `primitive`, `enum`, `object`, `array`, `consumerData`, `slot`,
`event` — and `array` is discriminated by `of`: a primitive type name (`"string"`) makes it
an array of primitives, a declared type name (`"Crumb"`) makes it an array of predefined
objects, and the form name `"consumerData"` makes it a list of consumer data. **Consumer
data is spelled by form name in every position**, because nothing is declared in
`api/types/` for it — a type there states its fields, and this form's whole content is that
its fields are the consumer's.

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

`check:api` (`scripts/check/arena/check-api.mjs`), the twenty-first, makes five assertions:

1. **Coverage.** Every contract in `api/components/` names a component that exists in at
   least one layer. The contract's existence *is* the coverage claim, so no separate
   record can go stale against it. A contract naming a component no layer implements
   fails.
2. **Form.** No member uses anything outside the nine forms. Read from React's `.d.ts`
   and from Angular's `input()` / `output()` / `model()` declarations.
3. **Agreement.** Every layer implementing a contracted component declares exactly the
   contract's members — same name, same form. Not fewer, not more. An **optional** member
   is still a declared member: `required: false` governs whether a consumer must supply
   it, never whether a layer must offer it, so a layer omitting an optional member fails
   this assertion like any other. **There is no exception map here.** An API divergence is
   a defect; that is the point of the layer.
4. **Derived rules.** R1 through R5, asserted against the declared types.
5. **Generated drift.** `Api.generated.d.ts` and `Api.generated.ts` match `api/types/`,
   the same assertion `check:tokens` makes for the token layer.

Which layers implement a component is resolved structurally, not from a list:
`frameworks/react/components/*/<Name>.d.ts` for React, and — since the structure
refactor's batch 2 — `frameworks/angular/components/<category>/<kebab-name>/<Pascal>.ts`
for Angular, resolved by WALKING the layer rather than by an `existsSync` probe per
contract. Do not rebuild the probe from this document: it is the exact lookup that,
when the layer moved, missed every contract and let `check:api` print
"50 contract(s) hold across 50 layer implementation(s)" and exit 0 over twenty
unread Angular implementations. `resolveAngularImplementations()` in
`scripts/check/arena/check-api.mjs` carries the replacement and the reason. A component
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

Bindings cite this document as supporting evidence — count them rather than trusting a figure,
since one citer already died with the `SideNav` delegated entry Plan D deleted, and the document
itself is now section 3 of `DOUBTS.md`. None of the three sections
Plan A touches is cited, but any later plan deleting a cited section must redirect the
citation in the same change.

---

# Plan A — the foundation

The deliverable is a working gate, not a document. Its scope is the vocabulary, the
directory, the generator, the gate, and three components migrated end to end to prove all
five work.

## A.1 — `api/README.md`

The normative statement of the nine forms and R1-R5, written the way
`tokens/src/TYPE-MAP.md` states the DTCG type table: the first thing a new platform
target reads. `CLAUDE.md` gains an *Architecture* paragraph pointing at it, in the same
register as the behaviour-contract paragraphs.

## A.2 — `api/types/` and the generator

`scripts/generate/arena/generate-api-types.mjs` reads `api/types/*.json` and emits
`frameworks/react/Api.generated.d.ts` and `frameworks/angular/Api.generated.ts`. Objects
become interfaces, enums become string-literal unions, descriptions become doc comments.
Committed output, guarded by drift assertion 5.

Plan A declares only the types its three components need: `Crumb`, `StatDelta`,
`Direction`, `DeltaTone`, `Tone`, `LogoSize`, `Orientation`.

## A.3 — `scripts/lib/api-surface.mjs` and `scripts/check/arena/check-api.mjs`

The reader and the gate, per the section above, plus `scripts/check/arena/check-api.test.mjs`
asserting each of the five assertions fires — including the loud failure on an
unrecognised member shape. Wired into `check-all.mjs`'s step list, and
`check-all.test.mjs` asserts that array by literal value, so the addition must be made
there too.

## A.4 — The three demonstration components

Three rather than two, because two leave one of the vocabulary's forms unexercised by the
gate on the day it ships. Together these cover six of the nine forms and all five rules —
six of seven when they were chosen; the eighth form landed later, in Plan 8C1's Task 1b, and
the ninth in Plan 8C2's, and no demonstration component exercises either.

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

# What Plan A settled

Binding on Plans B, C and D. Each of these was an open question when this spec was
written and is now closed; an audit that reopens one is wasting the maintainer's time.

**The binding table is mechanical and normative.** It lives in `api/README.md` and is
implemented by `bindingName()` in `scripts/check/arena/check-api.mjs`. A contract member `x` of an
inbound non-slot form binds as a React prop `x` and an Angular `input()` named `x`; the
slot named `content` binds as React's `children` and a bare `<ng-content />`; a slot
named `x` binds as a React node-valued prop `x` and `<ng-content select="[x]" />`; an
event named `x` binds as React's `onX` and an Angular `output()` named `x`.

**The contract governs required-ness**, not only name, form and type — but only for the
five inbound non-slot forms. A slot's and an event's required-ness are not compared,
because `<ng-content>` cannot declare projected content mandatory and no platform has a
mandatory listener. The carve-out is a statement about what the platforms can express,
not an exception.

**R2 and R3 are not machine-checkable, and nothing asserts them.** The gate asserts R1,
R4 and R5. R2 ("who draws decides data versus slot") is a fact about markup ownership and
R3 ("a parameterised slot fills, never replaces") is a fact about the rendered tree;
neither is visible in a member list. Both are authoring rules the audit protocol applies,
which means each is exactly as strong as the audit that applied it. `api/README.md` says
so and `CLAUDE.md`'s *Known debt* records it.

**Three further things the gate does not assert**, and every later plan inherits them —
they are gaps in the gate's reach, not authoring rules. `default` is in the contract
format and read by nothing. **React's checked surface is its hand-written `.d.ts`, never
its `.jsx`**, so R4 is enforced against real source on the Angular side and against a
declaration on the React side. A member `description` lives in the contract only and
reaches no generated module, so it exists three times — contract, `.d.ts` JSDoc,
`prompt.md` — with nothing holding the three in step. All three are written down in
`api/README.md`'s "What the gate asserts, and what it cannot".

**Precedents the audits should follow rather than re-derive:**

- **A consumer-supplied asset is a slot with a meaningful name, not the default
  `content` slot.** `AppLogo`'s mark is `mark`, because a reader of the contract alone
  learns nothing from `content`. Reserve `content` for a component whose slot genuinely
  has no better name.
- **A per-item callback inside an object becomes a component-level event carrying the
  item**, and the native DOM event is *not* forwarded, because a platform event type is
  an R4 violation inside a payload. `Breadcrumbs` set this: `Crumb.onClick` became
  `navigate(Crumb)`, both layers lost `preventDefault()`, and interception moved to the
  router. `BulkAction.onClick`, `Command.onRun`, `MenuItemDef.onClick`,
  `ToastAction.onClick` and `Alert.action.onClick` are the same shape and the same
  answer — but each still goes through the audit, because each has its own capability
  cost to state.
- **A single icon is a slot in both layers.** `StatCard`'s is, and Angular keeps
  rendering the `aria-hidden` wrapper; only the glyph comes from the consumer. Note that
  Angular cannot know whether a slot was filled without a `contentChild` query, so its
  wrapper now renders unconditionally — a zero-area empty span, recorded as a rendering
  divergence in `components-divergences.md`.

**Two things Plan A changed about `components-divergences.md`.** It deleted three
entries whose whole content was an API divergence, and it *added* two: `AppLogo`'s
`if (!mark || !name) return null` guard, which is a rendering divergence that survived
the API one, and `StatCard`'s unconditional icon wrapper. The file is **1089 lines** as
of Plan A's merge, not the 1127 `CLAUDE.md` records for plan 7d — re-measure before
citing it, and expect it to move in both directions.

---

# Plan B — the eighteen remaining shared components

> **COMPLETE as of Plan 8B4 (2026-07-24)**, in batches B0–B4: `check:api` reports
> **21 contracts across 41 layer implementations**.
>
> **The arithmetic does not match the eighteen named below, and the difference is the
> spec's, not a batch's.** Two corrections, both measured against the tree rather than
> recalled. `ThemeToggle` was never contracted — B1 **deleted it outright** rather than
> migrating it, so the eighteen yield seventeen contracts. And `Switch` **is missing from
> the list below** although both layers implement it; B1 contracted it (with a redesign)
> and it is a Plan B subject in every sense except being named here. So the real total is
> 17 + 3 (Plan A) + 1 (`Switch`) = **21**. Anyone re-deriving the subject list should
> resolve it structurally, as this section's own opening sentence says, rather than from
> this paragraph.
>
> What follows is the plan as written; the sections below carry per-batch annotations where
> a batch changed what they say.

**Objective.** Bring every component both layers already implement under contract, one at
a time through the audit protocol, until React and Angular present an identical member
surface for all of them and no API divergence remains between the two layers.

The subjects, resolved structurally and not from memory: `ActivityFeed`, `Alert`,
`Avatar`, `BarChart`, `BulkActionBar`, `ChartCard`, `CommandPalette`, `ConfirmDialog`,
`DoughnutChart`, `EmptyState`, `ErrorState`, `LineChart`, `Onboarding`, `PageHead`,
`Skeleton`, `Tag`, `ThemeToggle`, `UnauthCard`. `AppLogo`, `Breadcrumbs` and `StatCard`
landed in Plan A.

## Four things Plan A discovered that Plan B must settle early

> **Resolved by Plan B0 (2026-07-23).** All four below — and two more it found by measuring
> (an inbound function that returns a value, and a token-derived closed numeric set) — were
> settled through the audit protocol before any component was contracted. The decisions live
> in `api/README.md` (the single-icon and per-item conventions, the inbound-function rule, the
> numeric-set note) and in `frameworks/angular/primitives/projection-markers.ts` (the selector
> convention). **The present-tense descriptions below are the pre-decision state and are no
> longer true of the tree** — `stat-card`'s icon is a string, not a slot, and the action
> selectors are `[action]`/`[actions]`, not `[arena-*]`. Read `api/README.md` for what holds
> now; this section is kept as the record of what Plan A discovered, not as current fact.

None of these was visible when this spec was written; all four were found by running the
gate against the real tree.

**1. Angular's slot selectors are not consistent, and the binding table makes that a
defect.** Today the layer mixes bare selectors — `[mark]` (`app-logo`), `[icon]`
(`stat-card`), `[brand]` and `[footer]` (`unauth-card`) — with prefixed ones:
`[arena-actions]` (`chart-card`, `page-head`) and `[arena-action]` (`empty-state`,
`error-state`). Under the binding table a slot named `x` is `select="[x]"`, so
`[arena-actions]` declares a member literally named `arena-actions`, which is not a
member name any contract should carry and does not match React's `actions` prop. **Settle
the convention before contracting any component with an actions slot** — `ChartCard`,
`EmptyState`, `ErrorState`, `PageHead` and `UnauthCard` are all blocked on it — and
renaming a selector is a breaking change to every Angular call site, so it is one
decision made once rather than five made separately.

**2. Angular has two `icon` idioms and Plan A created the split.** `stat-card`'s `icon`
is now a slot; `alert`, `empty-state` and `error-state` still declare
`icon = input<string>()`, a Phosphor class name Arena draws. R2 points at the string for
those three and the slot for `stat-card`, because that is what each does today — R2
describes, it does not arbitrate. One of the two wins for the whole layer, and Plan B
owns the decision. It is not deferrable: `Alert`, `EmptyState` and `ErrorState` are all
Plan B subjects.

**3. A per-item icon cannot be a slot, and that contradicts the single-icon precedent.**
R1 says a node field inside a predefined object becomes a slot of the component or a
primitive if Arena draws it. But `BulkAction.icon`, `Command.icon` and `MenuItemDef.icon`
live inside *arrays* of objects, and a component-level slot cannot vary per item — so
each must become a **primitive**, meaning Arena draws per-item icons while (under the
`StatCard` precedent) it does not draw single ones. That is a defensible split, but it is
a split, and it should be decided deliberately in `BulkActionBar`'s audit rather than
discovered in `CommandPalette`'s.

**4. The `style`/`{...rest}` removal is larger than this spec estimated.** R4's own
section above says "`style` on 20 React components". Measured on the tree at Plan A's
merge, after three components lost theirs: **26 of the 43 React `.d.ts` files still
declare `style?: React.CSSProperties`**, and **6 still extend `React.HTMLAttributes` or
`React.SVGAttributes`** — the `{...rest}` escape. Not all of those 26 are Plan B
subjects; the rest fall to Plan C. Re-measure rather than trusting either number.

> **Re-measured at Plan B's completion (2026-07-24): 13 `.d.ts` files still declare
> `style`, and 6 still carry a heritage clause.** The `style` count halved because every
> Plan B batch removed one per component; the heritage count did **not** move, because only
> `LineChart`'s was a Plan B subject and it was an `Omit<>` rather than a `React.*Attributes`.
> All 13 and all 6 now fall to Plan C. Heed this section's own last sentence and re-measure
> again — these two numbers have been restated three times and been wrong twice.

## What Plan B inherits from Plan A's shape

Each component's migration touches the same set Plan A's did: the contract, the React
`.jsx` and `.d.ts`, the Angular `.ts` and its `.variants.ts` if slots move, both layers'
test suites, `*.prompt.md` in both layers, the group's `*.card.html` demo and its
`.entry.jsx`, the compiled `.js` siblings via `build:demos`, and the divergences entry.
Plan A's three took roughly one commit each plus a review pass; the charts
(`BarChart`, `LineChart`, `DoughnutChart`) will not, because they are the layer's
declared styling exception and carry no manifest.

**Test the layer you changed.** Plan A's clearest self-inflicted lesson: it fixed a real
React defect (`StatCard`'s empty delta pill) and shipped it with a render test on the
*Angular* side only, because React had no suite for that component. `frameworks/react/test/`
is DOM-free `renderToStaticMarkup` and costs a few lines; a migration that changes
rendered output writes one.

## What Plan B3 measured about the three charts, for 8B4

> **Resolved by Plan 8B4 (2026-07-24).** All five findings below are the pre-migration state and
> are recorded as history. `valueFormatter` is now `valueSuffix`; `CatSlot` is deleted rather than
> aliased; `LineChartProps`' heritage is flattened; `chart-data-table.test.ts` gained a
> `valueSuffix` pin and needed no NG0950 rework, while `host-class-binding.test.ts` needed it for
> all thirteen of its chart tests — the reverse of what that plan expected.

Plan B3 did not touch `BarChart`, `LineChart` or `DoughnutChart` — they were 8B4's subjects, split
out because they are not three similar components but **one reshape applied three times**: they
shared `valueFormatter → valueSuffix`, they shared `CatSlot`, and `LineChart.d.ts` and
`DoughnutChart.d.ts` both re-exported types from `BarChart.d.ts`, so migrating one half-migrated
the others; they are also the framework layer's declared styling exception, so the manifest, recipe
and specimen work that dominated every other B3 task did not apply to them at all — but closing B3
out re-verified five facts
about them against the tree at `HEAD`, so 8B4 opens with measurements rather than rediscovery:

- **`valueFormatter` is declared in all three components in both layers**
  (`bar-chart.ts:186`, `line-chart.ts:212`, `doughnut-chart.ts:246`, and each React `.d.ts`) as an
  inbound function returning `string`. `classify()` in `scripts/lib/api-surface.mjs` **throws**
  `UnrecognisedShape` on exactly that shape — an inbound function that *returns* a value is none of
  the eight forms — so no chart contract can be written until it becomes `valueSuffix`, per
  `api/README.md`.

  > **Re-measured after Plan 8C2, Task 1b — the ninth form.** `classify()` no longer throws on
  > that shape: an inbound function that returns a value is a **`functionInput`** now. The
  > verdict for the charts is unchanged, and the reason moved rather than weakened — a
  > `functionInput` is legal only in a contract declaring `"kind": "input"`, which a chart is
  > not, so `check:api` rejects a chart formatter by name instead of the reader refusing to
  > read it. `valueSuffix` stands.
- **React's `CatSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8` reaches `classify()`'s union branch** with
  unquoted parts and is returned as `{ form: 'union' }` — an R5 violation. It becomes a bare
  `number`, per `api/README.md`'s worked example. **Open for 8B4's audit:** `LineChart.d.ts`
  re-exports both `CatSlot` and `SeriesTone` from `./BarChart`, and `DoughnutChart.d.ts` re-exports
  `CatSlot` alone, so whether the *name* survives as a back-compat alias is a decision, not a
  mechanical step.
- **`LineChartProps extends Omit<BarChartProps, 'slots'>` must be flattened.**
  `scripts/check/arena/check-api.mjs:412` reports *any* heritage clause as the `{...rest}` R4 escape, with no
  special case for `Omit`. This is source work, not gate work — no reader change is needed.
- **Of the three charts 8B4 will contract, `BarChart:angular` is the only one already in
  `COVERED`** (`scripts/check/arena/check-compliance.mjs:79`, `chart-data-table.test.ts`) — `LineChart` and
  `DoughnutChart` have no compliance suite at all. Re-verified against `HEAD`: `COVERED` holds six
  entries total (`Dialog:react`, `ConfirmDialog:react`, `Menu:react`, `Skeleton:react`,
  `Alert:angular`, `BarChart:angular`); none of B3's five components (`UnauthCard`,
  `BulkActionBar`, `CommandPalette`, `ActivityFeed`, `Onboarding`) is in it. `chart-data-table.test.ts`
  asserts the accessible table pairs each category with its plotted value, which is the text
  `valueSuffix` changes — so all of 8B4's firm-contract risk is concentrated in that one suite.
- The three charts are the layer's declared styling exception: no manifest, no `.variants.ts`,
  token-valued camelCase `[style]` objects. They are reviewed against React's `charts.card.html`
  rather than a specimen of their own, so `check:tailwind`, `check:states` and `check:coverage`
  have nothing to say about them.

None of the five concerns the reader's handling of `input.required<T, TransformT>()` — Task 3b's
mid-plan extension of `scripts/lib/api-surface.mjs` to classify that shape depth-aware — so
re-verifying against `HEAD` after 3b landed changed none of the wording above; it is recorded here
because it was checked, not assumed.

# Plan C — the twenty-two React-only components

> **COMPLETE as of Plan 8C5 (2026-07-26)**, in batches 8C1–8C5: every component in the
> subject set carries a contract, and `check:api` reports **50 contracts across 70 layer
> implementations**.
>
> **The arithmetic does not match the twenty-two named below, and — as in Plan B — the
> difference is not drift.** The subject set is now **thirty**. It grew *while being
> contracted*, because a batch that turns an item into its own component adds a React
> component and a delegated entry in the same change: `RadioGroup` in 8C2, then
> `CalendarEvent`, `TableRow` and `TableCell` in 8C3, then the `SideNav` family in 8C5.
> Re-derive the set rather than trusting either number — it is the key set of
> `frameworks/angular/behaviour-delegated.json`, and every key in it must have a file in
> `api/components/`:
>
> ```bash
> bun run check:api
> python3 -c "import json,os; d=json.load(open('frameworks/angular/behaviour-delegated.json')); \
>   keys=[k for k in d if not k.startswith('\$')]; have={f[:-5] for f in os.listdir('api/components')}; \
>   print(len(keys),'subjects', sorted(k for k in keys if k not in have),'uncontracted')"
> ```
>
> **Batches numbered 8C6 and later are NOT Plan C, and the numbering misleads.** Plan C
> ended at 8C5. What followed reused the prefix while doing other layers' work: 8C6 (`Tabs`
> and `Tooltip`, plus the primitive-type clause in `check:api`), 8C7 (IDREF resolution and
> `each`-quantification in the compliance evaluator), 8C8 (accessible names through the same
> evaluator), 8C9 (binding `cases`), 8C10 (`Skeleton`'s announced circle) and 8C11 (the
> Angular test directory moved from a JIT harness to an AOT one). None of them contracted a
> component.

**Objective.** Define the contract for every component that exists in React alone, and
migrate React to it — so that each component's API is settled and normative *before*
Angular has an implementation to defend, rather than after.

The subjects are exactly the twenty-two Angular delegated to Material when this was written —
Plan D has since built every one of them, and the set is empty:
`Badge`, `Button`, `Calendar`, `Card`, `Checkbox`, `Dialog`, `IconButton`, `Input`,
`Menu`, `Pagination`, `ProgressBar`, `Radio`, `SegmentedControl`, `Select`, `SideNav`,
`Spinner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Tooltip`. The two sets
coincide exactly, which is what makes the sequence work.

`Table` is where R3 gets its first real test: `TableColumn.render` is the repository's
only parameterised slot, and the rule that it may fill a cell but never replace a row was
written for it. **Plan A changed what that test costs:** R3 turned out not to be
machine-checkable, so nothing will catch a wrong answer here. The rule holds exactly as
far as `Table`'s audit holds it, and `check:compliance` — the only layer that can see a
rendered tree — does not read contracts.

## Two subjects the reader cannot parse today, by design

> **Re-measured after Plan 8B4 (2026-07-24): it is FOUR, not two, and the two this section
> does not name are the shape B4 already solved.** Probing all nine of Plan C's readable-looking
> subjects against `reactSurface()` at `HEAD`:
>
> - **`Calendar.d.ts`** — `renderEvent?: (event: CalendarEvent) => React.ReactNode` throws.
> - **`Input.d.ts`** — `validate?: (value: string) => string | null | undefined` throws.
>
> Both are **inbound functions that return a value**, which is none of the eight forms — the
> identical shape the charts' `valueFormatter` had. **B4 is the worked precedent**: the member
> is replaced by data the component renders itself (`valueSuffix`), and the capability loss is
> stated plainly rather than hidden. Neither of these two takes that answer automatically —
> `Input.validate` returning an error message is a genuinely different problem from a number
> formatter, and it may well be an event plus a `error` primitive rather than a suffix — but
> the *rule* is settled and the audit does not have to re-derive it.
>
> **Superseded in part by Plan 8C2, Task 1b — the ninth form.** The prediction that
> `Input.validate` "is a genuinely different problem from a number formatter" is what the ninth
> form settled: `functionInput` exists for exactly this member, and `Input.validate` keeps its
> shape under a contract carrying `"kind": "input"`, with the signature modelled rather than
> deleted. `Calendar.renderEvent` does **not** move with it: a return of `React.ReactNode` is a
> parameterised slot (R3), which the reader still throws on, so that half of this measurement
> stands exactly as written.
>
> Two more facts for Plan C, measured at the same time:
>
> - **`Calendar.d.ts:5` declares its own local `CatSlot = 1 | … | 8`**, importing nothing from
>   `BarChart`. B4 deleted the charts' copy and dissolved it into a bare `number` (R5, plus
>   `api/README.md`'s worked example: the ramp's bound is derived from the palette and a
>   contract enum would emit it quoted). Calendar's copy is the last one in the tree and takes
>   the same answer.
> - **`Select.d.ts` extends `React.SelectHTMLAttributes<HTMLSelectElement>`**, and B4 measured
>   what that costs: **the reader does not resolve heritage.** It reports the `extends` clause
>   as the R4 `{...rest}` escape and then reads only the interface's own body, so every
>   inherited member is invisible to the gate and the contract fails with one *"does not
>   declare X"* per inherited member. An inherited member is not a declared member here — which
>   is the argument for flattening, over and above R4's letter.
>
> **Re-measured while executing Plan 8C1 (2026-07-24): the heritage-clause count this annotation
> gave as "six" was wrong — it is NINE, and the number is not written here because it drifts every
> time a batch flattens one.** Measure it with
> `grep -c '^export interface .*Props extends' frameworks/react/components/*/*.d.ts`. B4's "six"
> counted only the bare `extends React.*Attributes` clauses and missed the three wrapped in `Omit<>`
> (`Checkbox`, `Textarea`, `Input`), which `scripts/check/arena/check-api.mjs` reports as the R4 escape all the
> same — the same fact B4's own D6 established for `LineChartProps extends Omit<BarChartProps,
> 'slots'>`. Plan 8C1 flattened four of the nine (`Badge`, `Card`, `IconButton`, `Button`); the rest
> — `Checkbox`, `Input`, `Select`, `Textarea`, `SideNav` — fall to C2 and C3. This is the fourth time
> this figure has been written down and it had been wrong three times; re-run the grep rather than
> trusting any count in this document.

Plan A's reader (`scripts/lib/api-surface.mjs`) throws `UnrecognisedShape` on a shape it
cannot read, and a throw is a gate failure rather than a silent omission. Two React
`.d.ts` files in the tree throw today. Neither is a defect — both are components Plan C
exists to settle — but each means **Plan C must decide the API question before the gate
can check the answer**, and one of the two may require extending the reader:

- **`SideNav.d.ts`** — `onNav?: (id: string, event: React.MouseEvent) => void`, an event
  with two parameters, against the module's stated convention that an event carries
  exactly one payload. `Breadcrumbs` already answered this shape once: the DOM event
  leaves the payload (R4) and the item alone travels. Applying that answer here makes the
  member readable with no reader change; deciding otherwise means changing the convention,
  which is a change to `api/README.md`, not to `SideNav`.
- **`Table.d.ts`** — a generic `TableColumn<T>`. Generics are outside the nine forms
  entirely, and no form in the vocabulary expresses one. This is the harder of the two:
  it is not a member that violates a rule, it is a shape the vocabulary has no word for.

  > **Settled by Plan 8C1, Task 1, decision D5, and implemented in its Task 1b.** The
  > answer was the second branch this paragraph anticipated: **a change to the vocabulary
  > itself**, the eighth form. It needed no type-parameter parser, because the generic
  > **dissolves on its own** — `TableColumn.render` is one of the two R1 violations named
  > above, and once `render` leaves the object and becomes a parameterised slot of the
  > component, `TableColumn` is an ordinary predefined object with no type parameter. What
  > is left needing a form is `rows` and `Calendar`'s `meta`, and both are spelled
  > `Record<string, unknown>`. `Table`'s own audit still writes the contract; what it no
  > longer has to do is invent a vocabulary while doing so.

## Other R4 work Plan C carries

`Input.type` is `React.HTMLInputTypeAttribute` and becomes an Arena enum — deciding
*which* input types Arena supports is a product decision the audit must surface, not a
transcription. `Table.getRowKey`'s return is `React.Key`; `Menu`'s `MenuItemDef.icon`,
`Toast`'s `ToastAction.onClick` and `SegmentedControl`/`Select`/`Tabs`' union options
(R5) are the rest. `Tabs.tabs`, `Select.options` and `SegmentedControl.options` are the
three R5 violations this spec names, and the reader already classifies each as a `union`
and reports it — so for those three the gate is ready before the audit is.

# Plan D — an Angular primitive for every delegated control, built on the CDK

> **Plan D has begun, and this section is its argument rather than its state.** Batch 1
> landed the CDK foundation and the first two primitives, `Button` and `Tooltip`; its plan
> is in `docs/superpowers/plans/`. Read the *set* from
> `frameworks/angular/BehaviourDelegated.json` and never from a count written in this file:
> `check:behaviour` fails the moment that file disagrees with what the layer implements,
> which is why every count here was already replaced by the method once.
>
> Two decisions batch 1 took that this section did not anticipate. **`Calendar` and
> `CalendarEvent` are out of Plan D** — they are the two `absent` entries, net-new
> components carrying date arithmetic no CDK primitive covers, so `BehaviourDelegated.json`
> survives Plan D holding exactly those two rather than disappearing. And **the CDK is used
> for overlay POSITION only**: focus trapping stays Arena's `FocusTrap.ts`, because it is a
> deliberate port of React's `UseDialogModal.js` and the symmetry is worth more than
> `ConfigurableFocusTrap` would add.
>
> **The batch sequence, grouped so each batch's unknowns are already paid for.** Batch 1 was
> `Button` (no CDK, and it created the `forms/` category) plus `Tooltip` (the smallest anchored
> overlay). Then: **2** the rest of the form controls with no CDK — `IconButton`, `Checkbox`,
> `Switch`, `Input`, `Textarea`, where `Input` owes the repo's only `functionInput` an Angular
> implementation; **3** the choice and navigation controls — `Tabs`/`Tab`, `RadioGroup`/`Radio`,
> `SegmentedControl`, `Pagination`, where `Tabs` is the only one that reaches for `cdk/a11y` and
> `Pagination` is neither compound nor roving-focus at all (as line 871 below already says: it has
> no headless CDK component, and its `navigation` pattern has no focus or keyboard clause to
> implement); and `SegmentedControl`'s current `roles.group` exception is Material's defect and
> must not be inherited; **4** display —
> `Badge`, `Card`, `Table`/`TableRow`/`TableCell`, where Table carries eight exceptions a real
> primitive should clear rather than port — **all eight cleared**, and the clause was silent on
> the three things that actually shaped the batch: `responsive` is a *contracted member*, so the
> card shape below `--bp-md` is not optional and must be measured on the container; the three are
> a compound family and needed the layer's first *pair* of state objects; and two of their
> contracts were still written in React's verb, which this batch was the one authorised to fix.
> **One thing the batch could not deliver and did not fake**: Angular cannot ask whether an output
> has subscribers, so a clickable card row is pointer-only there, and `TableRow` keeps a
> `divergesFrom` rather than claiming a `button` it does not render; **5** the remaining overlays — `Menu`, `Select`,
> `Dialog`, `Toast`, and `Toast` owes `role` per tone so a danger toast interrupts rather than
> queues — **`Toast` paid it, and two of the other three were mis-labelled here**: `Select` is
> **not** an overlay at all. The contract calls it a *"styled native dropdown selector"*, so the
> primitive is the native `<select>`, it takes no CDK, and the `divergesFrom: "select"` the
> delegated entry carried against `MatSelect` closed rather than moved. So batch 5 left the layer
> with **two** CDK primitives, not four: `Tooltip` and `Menu`. The clause below was right that
> `Dialog` and `Toast` need no overlay, and it missed the thing that made the batch worth doing
> anyway — **the CDK container's own z slot was wrong for every in-flow overlay Arena has**. Pinned
> to `--z-dropdown` it sat under all four of them, and the CDK's own hardcoded 1000 merely ties
> with `--z-modal`; a tooltip inside an `arena-confirm-dialog` had been painting behind the dialog
> the whole time. It takes `calc(var(--z-toast) - 10)` now, and a menu opened from inside a dialog
> is what proves it; **6** the `SideNav` family, which inherits a decision rather than a task (see
> `DOUBTS.md`); **7** cleanup — delete `arena-material.css`, `check:material` and the
> `@angular/material` devDependency. `Dialog` and `Toast` are expected to need no overlay at
> all: the CDK earns its place on surfaces anchored to a trigger, and Arena's three existing
> modals already centre in flow.
>
> **This list was wrong twice, and batch 6 closed the plan rather than handing on to a seventh.**
> `ProgressBar` and `Spinner` are named in the subject set above and in **no batch at all** — an
> omission nothing would have caught until batch 7 tried to delete a bridge two live entries still
> needed, so batch 6 took them. And the decision batch 6 "inherits" was stale: the argument for
> leaving `SideNav` on `mat-nav-list` was that Material already brings the anchor-or-button
> distinction, the active state and the keyboard behaviour, and two of those three are the
> platform's rather than Material's while the third is a requirement of nothing — the `navigation`
> pattern has no focus or keyboard clause. With the last four delegations gone the bridge held no
> rule, and `check:material` has no zero-result guard, so it would have passed green over an empty
> file for a whole batch; deleting the file, the gate and the devDependency inside batch 6 was the
> only reading that leaves nothing lying. **Plan D ends here, at six batches.**
> `BehaviourDelegated.json` survives holding exactly `Calendar` and `CalendarEvent`, which is what
> the note at the top of this section predicted.
>
> **A dressing block in `arena-material.css` dies when no delegated entry still needs it, not
> when its own component lands.** Batch 1 hit this immediately: deleting the `MatButton` blocks
> would have degraded an adopter's remaining Material buttons and falsified `IconButton`'s
> still-live reason, which cites them. Batch 2 takes those blocks with `IconButton`.
>
> **On the pre-move paths this file names:** the reading `DOUBTS.md` asked Plan D to make has
> been made. A path is *normative* when it tells a reader where something IS, and those are
> corrected. A path in a `>` block, or in one of the per-batch test-count records near the
> end, is *history* and is correct as written — rewriting those would make the record lie.

**Objective.** Give Angular a real Arena primitive for each control it delegates today,
satisfying all three contracts — design, behaviour and API — and remove Angular Material
from the repository.

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

Why this satisfies all three contracts, and why no other option did — **written before the plan
ran, and every clause below came true**:

- **Design.** Material's compiled CSS is invisible to `check:dimensions` and
  `check:tailwind`, so these twenty-two controls sit outside the design contract today.
  With every visual decision in an Arena recipe, they come inside it, and
  `theme/arena-material.css` — which exists only to override Material's own visual CSS
  through `--mat-*` — dies with them.
- **Behaviour.** The twenty-two live in `BehaviourDelegated.json` today, outside the
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

## What Plan A changes about how Plan D is verified

**The Plan C contract is Plan D's acceptance criterion, and for once the gate is on the
strong side of it.** `check:api` reads Angular's surface from the real `<name>.ts`
component, not from a declaration file — the asymmetry that weakens it on the React side
is an advantage here. A CDK-built primitive either declares the contract's members or it
does not, and no `.d.ts` stands between the two. So each one Plan D writes arrives with a
machine-checked API the day it is written, which is the opposite of how the existing ones
arrived. **Both counts that stood here — *twenty-two* for Plan D's primitives and
*twenty-one* for the components already in the tree — were measured stale on 2026-07-24
and replaced by the method rather than by corrected numbers**; see the re-measurement
blockquote under *The running count*. Plan D's set is the key set of
`frameworks/angular/BehaviourDelegated.json`; the existing set is that, minus `Switch`.

Three things to carry in:

- **Required-ness is contracted**, so `input.required<T>()` versus `input<T>(default)` is
  no longer a free choice per primitive — the contract Plan C wrote decides it, and the
  gate compares it. Plan A hit this twice: making a member required is an NG0950 hazard
  in the JIT test harness, and `frameworks/angular/test/HostClassBinding.test.ts`
  carries the query-child-and-overwrite bypass that works around it. Reuse it rather than
  rediscovering it.

  > **Plan B measured the real cost, and it is worth carrying into D's estimates.** Batches
  > B1–B3 **over**estimated this hazard three times running — three consecutive plans predicted
  > NG0950 rework that did not materialise, because the suites in question never rendered the
  > primitive through `TestBed` at all. Then B4 **under**estimated it once: making `labels` and
  > `values` required broke **13 tests across all three charts** in one file, because those
  > fixtures render with no bindings whatsoever. The predictor is not "is this member
  > required" but **"does any suite render this primitive through `TestBed`, and does it drive
  > this input?"** — a suite that tests plain exported functions is unaffected, and a suite
  > that already overwrites instance fields is unaffected too. Check that before estimating.
  > The bypass now has six worked examples in that one file (`createAppLogoMarkHost`,
  > `createBreadcrumbsHost`, `createBulkActionBarHost`, and B4's three chart helpers), so a
  > D-era primitive copies rather than invents.
- **Slot required-ness is not comparable**, so a CDK primitive whose projected content is
  genuinely mandatory has no way to say so and no gate to catch a caller who omits it.
  That is a real hole in every one of the twenty-two that projects content.
- **The slot-selector convention Plan B settles applies here too.** Twenty-two new
  primitives is the largest single batch of `<ng-content select>` this layer will ever
  gain; they must be written to whatever convention Plan B lands on, not to whatever each
  one's author prefers. **Settled: it is the bare attribute selector** (`select="[x]"` for a
  slot named `x`), landed by B0 in `frameworks/angular/ProjectionMarkers.ts`;
  `templateSlots()` refuses any other form outright, so this is enforced rather than
  conventional.

**`Api.generated.ts` is already in `ngc`'s program.** `frameworks/angular/index.ts`
re-exports it and `tsconfig.check.json`'s `files: ["./index.ts"]` pulls it in, so a
contract type that fails to resolve breaks `check:angular`. That is currently luck rather
than design — nothing states the dependency — but Plan D can rely on it, and should write
it down when it does.

# Plan E — restore the suspended tests

**Objective.** Uncomment the seven tests suspended for speed while plans A through D
reshape the repository, and run the whole suite and every gate green with all of them
live.

Plans A through D touch nearly every component in both layers, so the test suite is run
constantly. Measured on this tree before any change: **770 tests across 63 files in
48.14s**, of which **41.56s came from seven tests in two files**. Suspending exactly
those seven brings the suite to **5.91s for 763 tests** — an eight-fold speed-up for
0.9% of the tests.

**Those figures are the merged process only**, which was ambiguous as written and is
resolved here: `bun run test` is two `bun test` invocations, and 770/763 across 63 files
counts `scripts/` plus `frameworks/react/test/` plus `frameworks/angular/test`. The
isolated DOM process (`frameworks/react/test-dom`) was and is a separate 26 tests across
5 files. All seven suspended tests live in `scripts/`, so restoring them moves the merged
process only.

## The running count

Each plan updates this line when it lands, because the restore check below is a
comparison and a comparison needs a baseline that is not stale.

| After | Merged process | Isolated DOM process |
|---|---|---|
| suspension (2026-07-23, before Plan A) | 763 across 63 files | 26 across 5 files |
| **Plan A** (2026-07-23) | **856 across 68 files** | 26 across 5 files |
| **Plan B0** (2026-07-23) | **863 across 68 files** | 26 across 5 files |
| **Plan B1** (2026-07-23) | **885 across 74 files** | 26 across 5 files |
| **Plan B2** (2026-07-24) | **910 across 79 files** | 26 across 5 files |
| **Plan B3** (2026-07-24) | **932 across 82 files** | 26 across 5 files |
| **Plan B4** (2026-07-24) | **958 across 85 files** | 26 across 5 files |
| **Plan 8C1** (2026-07-24) | **991 across 89 files** | 26 across 5 files |
| **Plan 8C2** (2026-07-24) | **1048 across 94 files** | 26 across 5 files |
| **Plan 8C3** (2026-07-25) | **1145 across 101 files** | **36 across 6 files** |
| **Plan 8C4** (2026-07-25) | **1175 across 104 files** | **64 across 9 files** |
| **Plan 8C5** (2026-07-26) | **1199 across 105 files** | **74 across 10 files** |

Plan 8C3 carried Plan C forward with its third batch: `Tabs`, `SegmentedControl`, `ProgressBar`,
`Toast`, `Tooltip`, `Calendar`, `CalendarEvent`, `Table`, `TableRow` and `TableCell` — ten
components, taking `check:api` from 32 contracts across 52 layer implementations to **42 across 62**.
**Every contract is single-layer for the same reason 8C1's and 8C2's were**, though the reason has
two halves here: at the time Angular delegated `Tabs`, `SegmentedControl`, `ProgressBar`, `Toast`,
`Tooltip` and `Table` to Material — Plan D has since taken all of them back — and has no
equivalent of `Calendar` at all — `BehaviourDelegated.json` binds
that one to pattern `absent`. So the batch moves the layer count by exactly as many contracts as it
writes, ten and not twenty.

**It did not climb by one per task, and two tasks are why.** The ladder reconciles per commit:
32 → **34** (`f612827`, `Tabs` and `SegmentedControl` in one commit) → **36** (`fd8c7b1`,
`ProgressBar` and `Toast`) → **37** (`add3a80`, `Tooltip`) → **38** (`82a72de`, `Calendar`) → **39**
(`81a5ec2`, **Task 11b**) → **42** (`6ab8d7e`, **Task 13, +3**). Task 11b is a contract the plan
never scheduled: `CalendarEvent` had shipped as a predefined object in `api/types/`, the maintainer
then asked for a per-event action panel, and a slot may not be a field of a predefined object (R1) —
so the item became a **component**, which needed no gate change and no tenth form. Task 13 landed as
**three** contracts by applying that same answer to `Table`: rather than lose `TableColumn.render`
under the per-item convention and with it the `Badge` in a status cell and the `Button` in an actions
cell, `Table` became a **compound component**, and `TableRow` and `TableCell` are two new React
components with delegated Angular entries of their own. Both moves rest on one property — per-item
projection stops applying the moment the consumer instantiates one element per item instead of
handing Arena a render function — and neither needed the vocabulary widened.

**Plan 8C4 finished Plan C.** `Dialog`, `Menu`, `Pagination` and `SideNav` were the four subjects
left, and the ladder reconciles one contract and one layer per commit: 42 → **43** (`b4b8a9c`,
`Dialog`) → **44** (`d2c9748`, `Menu`) → **45** (`ae8fcaf`, `Pagination`) → **46** (`7640db2`,
`SideNav`). All four were single-layer for the reason every Plan C batch was: Angular delegated
each to Material at the time. **`check:api` now stands at 46 contracts across 66 layer implementations, and
there is no fifth batch** — the set is exhausted, which is the first time that sentence has been
true since Plan A.

> **Superseded by Plan 8C5 (2026-07-26): there was a fifth batch, and the sentence above was false
> within a day of being written.** Not because a subject was missed — the set really was exhausted
> at the moment it was measured — but because **a batch that makes an item a component enlarges its
> own subject set while contracting it**, and 8C5 did exactly that three times over. `SideNav` shed
> its `items` array and became a compound component, so `SideNavItem`, `SideNavSection` and
> `SideNavCollapsible` are each a new React component, a new contract and a new delegated entry in
> the same change. This is the third consecutive plan to move the denominator this way —
> `RadioGroup` inside 8C2, then `CalendarEvent`/`TableRow`/`TableCell` inside 8C3 — and the first in
> which the drift falsified an explicit claim of completion rather than only a count. **"The subject
> set is exhausted" is not a durable statement about this plan, and no future batch should write it
> again**; measure the set instead.
>
> **Re-measured: Plan C's subject set is twenty-EIGHT, and all twenty-eight are contracted.**
> `check:api` moved 46/66 → **49/69**, one contract and one layer per feature commit: 46 →
> **47** (`5848168`, `SideNavItem`) → **48** (`76760eb`, `SideNavSection`) → **49** (`2f1436d`,
> `SideNavCollapsible`). All three are single-layer for the usual reason, and Appendix B of the
> 8C5 plan registers the thing that makes that reason weaker here than elsewhere: Angular delegates
> `SideNav` to `mat-nav-list`, which provides a flat list of links and provides neither a named
> section group nor a nested disclosure group. Nothing in 8C5 resolves it; it is Plan D's.
>
> **The batch's other halves.** `behaviour/patterns/` gained its **twenty-first** pattern,
> `disclosure`, the first added since the layer was built — and the first whose own description
> states what it *refuses* rather than only what it requires, because a stack of nested
> collapsibles resembles a treeview and is deliberately not one. `check:compliance` moved
> **7 → 8**, with `SideNavCollapsible:react` joining `COVERED` behind a binding carrying
> `"exceptions": []`; the denominator moved 66 → 69 in the same batch, since a binding is added per
> component, so *8 of 69* against 8C4's *7 of 66* is one more verified claim against three more
> unverified ones. That is the charter working as written, not a regression.
>
> **One correction to the counting method itself, which this batch broke.** The method stated
> below — *every `.jsx` under `frameworks/react/components/` with no matching directory under
> `frameworks/angular/primitives/`* — now returns **twenty-nine**, not twenty-eight, because 8C5
> introduced `side-nav-inject.jsx`, the first `.jsx` in that tree that is **not a component**: a
> shared helper with no `.d.ts`, no `.prompt.md`, no behaviour binding and no delegated entry. Its
> `.jsx` extension is load-bearing and cannot be traded away — `check:dimensions` scans `.jsx` and
> never `.js`, and the file produces a governed `padding-inline-start` — so the file is correct and
> the method is the thing that needs the qualifier. The reliable cross-check is the key set of
> `frameworks/angular/behaviour-delegated.json` (29 today), minus `Switch`; that set contains only
> real components by construction, and it is the one to trust when the two disagree.


Two of the four needed a decision the plan could not make for itself, and both went to a shape the
plan had not listed. `Menu`'s per-item `onClick` and `SideNav`'s two-parameter `onNav` are the same
problem at two sizes, and `api/README.md` had already answered it twice — R1's *"a field that is a
function becomes an event of the component, carrying the object in its payload"* and the event
section's *"the platform event leaves the payload and the item alone travels"*, with
`Breadcrumbs.navigate` shipping as `"payload": "Crumb"`. So `Menu.select` and `SideNav.nav` each
carry the whole item rather than an id, and `MenuItem` needs no `id` at all — which matters,
because `{ divider: true }` and `{ header: '…' }` are legitimate entries carrying neither label nor
id, and a required `id` would have forced a meaningless one onto every divider.

**The batch's other half is not an API story and is the larger one.** `Dialog`, `ConfirmDialog` and
`Onboarding` met the `dialog-modal` pattern in React for the first time, through
`frameworks/react/UseDialogModal.js` — a deliberate port of the Angular layer's own
`focus-trap.ts` rather than a second design. Eleven of the twelve exceptions those three carried are
retired; the twelfth, `ConfirmDialog`'s `roles.element`, stayed at the time because
`role="alertdialog"` is arguably more correct for a destructive confirmation and **both** layers
declared it, making it a shared deviation from the pattern rather than a divergence between
layers. It is retired now, and not by changing the component: the catalogue gained the
`alertdialog` pattern the component already implemented. `check:compliance` moved
6 of 66 → 7 of 66, and three sections of `components-divergences.md` were retired or renarrowed
because the gaps they recorded closed.

The isolated DOM process nearly doubled, 36 across 6 files → **64 across 9**, which is the cost of
that half and was accepted in advance: `dialog-modal` cannot be verified without a DOM, and none of
the three components binds `grid`, so the standing hand-test rule did not exclude them.

**Plan C's subject set moved again, under this batch, and it is now twenty-FIVE.** Re-measured by the
method above: 46 `.jsx` under `frameworks/react/components/` (excluding `*.card.entry.jsx`), 20 with
a matching directory under `frameworks/angular/components/`, leaving 26 — exactly the key set of
`frameworks/angular/BehaviourDelegated.json` — minus `Switch`, contracted before Plan C began. The
three additions are `CalendarEvent`, `TableRow` and `TableCell`, each a new React component and a new
delegated entry in the same change, the identical drift `RadioGroup` caused inside 8C2. **Twenty-one
of the twenty-five are now contracted; four remain** — `Dialog`, `Menu`, `Pagination`, `SideNav` —
and they are C4's.

**Phase A paid the four Known debt entries 8C2 recorded**, and only one of the four was a rule
change: `id` becomes a member of `Input` and `Textarea`, restoring the path the D1 heritage flatten
had cut; `check:api` resolves an event `payload` that names a declared **enum**, one type-kind short
of where Task 2 had left it; the reader's *optional* `functionInput` spelling
(`input<((value: string) => string) | undefined>()`) parses, which had failed on parse **order**
rather than on any rule, so Plan D has nothing left to discover about the reader; and the six form
controls' value-carrying events are proved to **fire** by a DOM suite dispatching real events, where
the DOM-free suites had only ever asserted their shape. **Phase B was the batch's structural event
and it removed a member rather than adding a form** — measuring `api/README.md` showed the document
already refuses a per-item renderer by an older convention, so the reader's throw now states that
convention as an *enforcement* rather than as a gap, and `Calendar.renderEvent` and
`TableColumn.render` are removed rather than modelled. R3 is not the reason and the message says so.

**Two components gained keyboard navigation, and their bindings moved in opposite ways.** `Calendar`
retired all eight `grid` exceptions — a roving tab stop, a four-edge clamp, Home/End within a day
column, Enter/Escape into and out of an event chip, and an arrow route to the chip's kebab — and
`Table` retired **seven** of its eight, keeping one, `focus.roving`, true of card mode alone. Both
are inside the grid rule, so both are DOM-tested by hand and neither can enter `COVERED`;
`check:compliance` reads **6 of 66**. The hand check paid for itself on its first application: driving
real Chromium found that a control a consumer draws in a cell cost **two** Tab presses, because
React's `onFocus` is `focusin` and bubbles — a defect no static assertion in this repo could have
seen.

**The isolated DOM process moves for the first time since the suspension, and it does not reconcile
against this plan's tasks.** It read `26 across 5` on every row above; it now reads `36 across 6`,
and the movement is a round trip rather than an addition — `frameworks/react/test-dom/` was deleted
whole for its RAM cost (`edb9f3e`) and then restored **minus** `grid-keyboard.test.jsx`, under the
rule that a component whose behaviour binding names the `grid` pattern is DOM-tested by hand — plus
the suite pinning `CalendarEvent`'s keyboard route, which a chip mounted alone can hold because it
binds `button` and not `grid`. Neither is a task in this plan. Reconcile that column against those
two events, never against Tasks 5, 10 and 12.

Plan 8C2 carried Plan C forward with its second batch: the six form controls (`RadioGroup`, `Radio`,
`Checkbox`, `Textarea`, `Select`, `Input`), taking `check:api` from 26 contracts across 46 layer
implementations to **32 across 52**. **Every contract is single-layer for the same reason 8C1's
were** — Angular delegates all six to Material — so the batch moves the layer count by exactly as
many contracts as it writes, six and not twelve. Five of the six tasks climb `+1 contract / +1
layer`; **Task 2 is the batch's only `+2/+2`**, because `Radio.d.ts` declared two components in one
file and the gate resolves a component by `<Name>.d.ts`, so `RadioGroup` had no surface the reader
could find until the file was split into two quartets. The net gain over 8C1 is 57 tests and 5 files
in the merged process, isolated DOM process unchanged at 26/5, and it reconciles exactly against the
per-task deltas: Task 1b added 14 in `scripts/` (the ninth form's reader and gate tests) with no
component contracted; then the five migrations added 8 (Task 2 — six render tests in a new
`radio.test.jsx` plus two gate tests), 7, 9, 6 and 13 — 14 + 43 = 57 — and the five files are the
five new suites under `frameworks/react/test/` (`radio`, `checkbox`, `textarea`, `select`, `input`).
**Task 1b is the batch's structural event, not a component**, exactly as 8C1's was: it added a ninth
form to the vocabulary, `functionInput`, for the one member shape a data-entry control legitimately
needs and none of the eight could express — `Input.validate` made `reactSurface()` *throw* before it
existed. It contracts nothing and holds `check:api` at 26/46 across itself, and it lands the form's
narrowing guard mechanically rather than as prose: a `functionInput` is legal only in a contract
declaring `"kind": "input"` at top level, and `check:api` fails one that is not. Of the whole repo,
exactly one contract carries that key and exactly one member is a `functionInput` — `Input` and
`Input.validate`. The six migrations declared three new types: `SelectOption` (an object), `InputType`
(an enum, ten values) and `ValidateOn` (an enum, two); every enum value set across `api/types/` is
unique, so no reuse was missed. **The two decisions that shaped the batch beyond the plan:** a
native `onChange` becomes an **event carrying the value, never the DOM event** (DA), which extends
`Breadcrumbs`' settled rule that a platform event type is an R4 violation inside a payload — so
`change` carries `string` on `RadioGroup`, `Textarea`, `Select` and `Input`, and `boolean` on
`Checkbox`, `Input.blur` carries the value too, and `React.ChangeEvent` travels nowhere; `Radio`
declares no `change` at all, because the group owns the value and the plumbing `RadioGroup` injects
(`name`/`checked`/`onSelect`) is public API in neither contract. And the heritage flatten (DB) cost
one capability rather than the five `form*` overrides 8C1 paid: **`id` is no longer a member.**
`Input` and `Textarea` still generate an `id` from the label to wire the label's `htmlFor`, but a
consumer wanting to supply one lost the path, because it arrived through the heritage clause. It is
recorded as the batch's one D1 cost, with the same absence of a gate behind it that 8C1's loss has.

> **Re-measured after Plan 8C2 (2026-07-24): Plan C's subject set is twenty-TWO, not twenty-one.**
> The figure below was true when written and went stale inside 8C2 itself: splitting `Radio.jsx`
> into two quartets made `RadioGroup` a new React component AND a new `behaviour-delegated.json`
> entry in the same change, moving the set from twenty-one to twenty-two with no prose changing.
> **Measured since, and now settled:** Plan D's CDK-primitive tally at *"What Plan A changes about
> how Plan D is verified"* was the SAME drift and has been replaced by the method there.
> `frameworks/tailwind/README.md`'s tally is a **different subject** — it counts manifests, not
> components, and the `Radio` split added no manifest, so it did not drift. `CLAUDE.md` carried
> three more instances of this same class and all three were corrected in the same change. The
> command: 
> every `.jsx` under `frameworks/react/components/` (excluding `*.card.entry.jsx`) with no matching
> directory under `frameworks/angular/primitives/`, minus `Switch`, which was contracted before
> Plan C began. The paragraphs below are left as the record of what 8C1 stated at the time.

Plan 8C1 opened Plan C — the twenty-one React-only components — with its first batch: the five
primitives other components compose (`Spinner`, `Badge`, `Card`, `IconButton`, `Button`), taking
`check:api` from 21 contracts across 41 layer implementations to **26 across 46**. **Every contract
in Plan C is single-layer**, because Angular implements none of the twenty-one, so a batch moves the
layer count by as many contracts as it writes — five here, not ten — and a reader deriving the
arithmetic from Plan B's `+1 contract / +2 layers` rows would get it wrong. The net gain over B4 is
33 tests and 4 files in the merged process, isolated DOM process unchanged at 26/5, and it reconciles
exactly against the per-task deltas: Task 1b added 9 in `scripts/` (the eighth form's reader and gate
tests) with no component contracted; then `frameworks/react/test/` gained 5 (`spinner`), 4 (`badge`),
2 (`card`, extending the existing suite), 6 (`icon-button`) and 7 (`button`) across the five
migrations — 9 + 24 = 33, and 1 (`scripts` file already existed) + 3 new react files + the react dir
crossing from 85 to 89 total. **Task 1b is the batch's structural event, not a component:** it added
an eighth form to the vocabulary, `consumerData`, because `api/README.md`'s "exactly one of seven
forms" sentence was already false (`Table.rows` was a member and none of them) and the README's own
worked slot example named a `TableRow` type that cannot be declared. It contracts nothing and holds
`check:api` at 21/41 across itself. The five migrations then declared five new enums
(`ControlSize` shared across three of them, `SpinnerTone`, `ButtonType` shared across two,
`IconButtonVariant`, `ButtonVariant`) and reused `Tone` for `Badge`; every enum value set is unique,
so no reuse was missed. **The two decisions that shaped the batch beyond the plan:** the single-icon
convention (D2) reached `Button` and `IconButton`, so their icons are Phosphor class strings Arena
draws rather than slots — `IconButton` ends with no slot at all; and the `<button>` heritage flatten
(D1) cut the five `form*` overrides, so both declare `type`/`disabled`/`name`/`value`/`autoFocus`/
`form` and the `click` event and no `Form*` enum. `IconButton` was weighed against merging into
`Button` and kept separate, because its required `label` is an accessible-name guardrail a merged
Button could not enforce.

Plan B4 put the last three components of Plan B under contract — BarChart, LineChart and
DoughnutChart — taking `check:api` from 18 contracts across 35 layer implementations to **21 across
41**. That **completes Plan B**: 3 components from Plan A plus 18 from Plan B, all twenty-one
contracted. It added one shared enum (`SeriesTone`, four values, replacing React's local union and
deleting Angular's `ArenaChartTone`) and declared **no object type at all** — the first batch with
none, because all three charts are pure data-in components whose members are primitives, arrays of
primitives and one enum. The net gain over B3 is 26 tests and 3 files in the merged process,
isolated DOM process unchanged at 26/5: `frameworks/react/test/` gained 24 tests across 3 new files
(`bar-chart.test.jsx` +7, `line-chart.test.jsx` +8, `doughnut-chart.test.jsx` +9 — React had no
suite for any of the three before this plan), and Angular gained 2, both folded into the existing
`chart-data-table.test.ts` (4 → 6 tests): the `valueSuffix` pin and the named-`seriesLabel` pin, on
the one suite that holds a
chart's behaviour contract. `scripts/` gained **none** — no reader change was needed, because
`classify()`'s refusal of an inbound function that returns a value was already shipped by Plan B0
and Task 3b's depth-aware `input.required<T, TransformT>()` extension was untouched.
**Eight of those 26 came from the final whole-branch review's fix wave, not from the component
tasks**, and they are the interesting ones: six pin that React now draws one label per *mark*
rather than one per *label entry* — the convergence that made the three contracts' shared
`labels` sentence true of React as well as Angular — and two close guards that existed in two of
three sibling suites but not the third. **Unlike B3's
row, the delta reads correctly straight off this table's two adjacent rows** (958 − 932 = 26,
85 − 82 = 3) and reconciles exactly with the per-file accounting (24 + 2 + 0 = 26): the branch's
own measured baseline at `0205cfc` was 932 across 82, matching the B3 row. The 2-test undercount
this table's **B2** row carries is untouched and still out of scope.

Plan B3 put five more components under contract — UnauthCard, BulkActionBar, CommandPalette,
ActivityFeed and Onboarding — taking `check:api` from 13 contracts across 25 layer implementations
to **18 across 35**. It added five new shared types (`BulkAction`, `Command`, `ActivityItem`,
`OnboardingStep`, `OnboardingAnchor`) and reused one existing enum (`Tone`, for `ActivityItem.tone`)
rather than declaring a sixth. The net gain over B2 is 22 tests and 3 files in the merged process,
isolated DOM process unchanged at 26/5: `frameworks/react/test/` gained 15 tests across 3 new files
(`bulk-action-bar.test.jsx` +4, `command-palette.test.jsx` +3, `onboarding.test.jsx` +4) plus
assertions folded into the two components that already had a suite (`unauth-card.test.jsx` +2,
`activity-feed.test.jsx` +2 net — one deleted `renderItem` test against three added); Angular gained
2, folded entirely into Task 2's existing `bulk-action-bar-variants.test.ts` and
`host-class-binding.test.ts` rework, no new file (Tasks 3, 4 and 5 each held Angular's count exactly
at 334, confirmed unmoved). `scripts/` gained 3 more than any earlier batch, all in
`scripts/lib/api-surface.test.mjs` (38 → 41) — Task 3b's pair, proving the reader now classifies
`input.required<T, TransformT>()` depth-aware and still refuses the no-generic
`input.required({transform})` form, plus the three-or-more-generic pin the final whole-branch review
added when it found 3b had narrowed the module's own "unreadable shapes throw" rule. Those are the
only additions in this plan that touched no component. 15 + 2 + 3 = 20 tests as measured against the tree's actual
state at this plan's own starting commit (`f52ae89`): re-measuring that commit directly gives 912
across 79 files in the merged process, not the 910 this table's B2 row records — a 2-test
undercount that predates this plan (it is already present at `787b2d0`, the commit the B2 row was
written from, with no test file changed between there and the B2 merge) and is left uncorrected
here as out of this plan's scope. Reading the delta off this table's two adjacent rows (932 − 910 =
22, 82 − 79 = 3) therefore overstates the tests this plan itself added by 2; the components-and-type
accounting above is the one that reconciles exactly (15 + 2 + 3 = 20) against the real starting
count. **Every figure in this paragraph is measured at the merge commit `2bdc2a9`, after the final
whole-branch review's six fixes** — two of which added a test each (`onboarding.test.jsx`'s
absent-required-member throw and the reader pin above), which is why an earlier draft of this row
read 930.

Plan B2 put five more components under contract — ChartCard, EmptyState, PageHead, Alert and
ErrorState — taking `check:api` from 8 contracts across 15 layer implementations to **13 across
25**. It added one enum type (`AlertTone`) and, at a maintainer's direction, a second
(`PageHeadAlign`) when PageHead's `style` escape was decomposed into a real `align` member rather
than merely dropped. The net gain over B1 is 25 tests and 5 files — one render suite per component
(`chart-card`, `empty-state`, `page-head`, `alert`, `error-state`) — plus assertions folded into
existing Angular recipe and host-binding suites. It made three components' `title`/`icon` narrow or
required (EmptyState and PageHead `title` required, EmptyState/ErrorState `icon` narrowed to a
string), split Alert's `action` object into a label + event with an explicit `dismissible`, and had
Arena draw ErrorState's retry in both layers. `classesFor` learned to apply `compoundVariants` so the
PageHead specimen still renders from its manifest.

Plan B1 put five components under contract — Avatar, Skeleton, ConfirmDialog, Tag, and a
redesigned Switch — introduced the required-runtime convention and 6 new enums/types, and
deleted ThemeToggle outright; the net gain over B0 is 22 tests and 6 files, after subtracting
ThemeToggle's own suite.

Plan B0 added 7 tests and no file: 3 in `frameworks/react/test/stat-card.test.jsx` and
`frameworks/angular/test/host-class-binding.test.ts` (StatCard's icon revised to a string, its
render pinned in both layers), 2 in `scripts/lib/api-surface.test.mjs` (the reader refusing an
inbound function that returns a value), and 2 in `scripts/check/arena/check-compliance.test.mjs` (COVERED's
compound `<component>:<layer>` key). Its five audits were mostly prose and the two script tasks
that shipped machinery each landed a couple of tests; every test is accounted for in the branch's
commits.

Plan A added 93 tests and 5 files: three new script suites for the API layer
(`build-api-types.test.mjs`, `api-surface.test.mjs`, `check-api.test.mjs`), plus React
and Angular render tests added during its migrations and review passes. Every one of them
is accounted for in that branch's commits; a plan that cannot account for its own delta
is the thing this table exists to catch.

## What is suspended

Both blocks are commented with a leading `// ` per line, opened by a five-line
`PLAN-E-SUSPENDED` header and closed by a `PLAN-E-SUSPENDED-END` marker. Line-prefix
comments rather than a `/* */` block on purpose: both regions contain doc comments whose
`*/` would close an enclosing block early. `grep -rn PLAN-E-SUSPENDED scripts/` finds
every one.

**`scripts/check/arena/check-card-viewports.test.mjs`, lines 19-224 — five tests, 33.59s.**
Each launches headless Chromium over CDP: `measurePage reports content that fits, and
content that over-runs`; `contentHeight follows an absolutely positioned descendant at
any depth`; `contentHeight follows a trailing block margin the body's own padding stops
from collapsing away`; `measurePage rejects instead of hanging when a page never
answers`; `a slow-but-honest page times out inside the script instead of past the outer
CDP bound`. The file's other ~20 tests are pure functions — `parseDsCard`,
`summarizeCards`, and the string assertions on `MEASURE_SCRIPT` — and stay live, which
is why the file was cut surgically rather than suspended whole.

**`scripts/check/angular/check-angular.test.mjs`, lines 9-38 — two tests, 7.97s.**
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
`bun run check` in full.

**The check is a delta, not a number.** The original "roughly 770 tests and ~48s" stopped
being the right target the moment Plan A added 93 tests, and it will be wrong again after
B, C and D. The rule instead: **record the merged-process count immediately before
restoring, restore, and expect exactly that count plus 7.** Anything else means a plan
added or removed tests without recording it in the table above — which is the failure this
whole section exists to catch, and the table is what makes it catchable.

The wall-clock target survives unchanged, because the seven suspended tests dominate it
and nothing in plans A–D touches what they do: expect the merged process to gain roughly
**41.5s** (33.59s of headless Chromium in `check-card-viewports.test.mjs`, 7.97s of `ngc`
in `check-angular.test.mjs`). Measured after Plan A, the merged process runs in **6.8s**,
so restoring should land near 48s again — the same figure as the original tree, arrived at
from a different count.

**Restoring needs a real browser and a working `ngc`.** The five card-viewport tests
launch headless Chromium over CDP and the two Angular tests shell out to
`ngc --strictTemplates`; on a machine where `check:cards` reports its loud skip, the
restored suite cannot pass and the restore is not verified. Run Plan E where
`bun run check` reports all steps PASS rather than INCOMPLETE.

> **Plan B4 (2026-07-24) hit exactly that skip and it is a one-line fix, worth knowing before
> Plan E blames its own changes for it.** On this development machine Chromium is installed at
> `/usr/bin/chromium` but **`CHROME_PATH` is not set**, so `bun run check` reports `check:cards`
> as SKIP and the whole run as INCOMPLETE — which looks like a failure of whatever you just
> changed and is not. Export `CHROME_PATH=/usr/bin/chromium` and the gate runs (it measured 70
> pages). Every "all 23 steps PASS" this spec records for B4 was obtained that way, not by
> tolerating a skip.

Plan E is the last thing done, after D, and it is not optional: a suspended test that
outlives the reason for suspending it is exactly the stale exception every gate in this
repository is built to reject.

## Risks carried across the remaining plans

**A green `check:api` is narrower than the charter it is read against, and the gap is
where this layer will rot.** The gate has no exception map, and that sentence is stated
forcefully in three places — it invites the reading that a green run means the two layers
present the same API. It means something narrower in four specific ways, all now written
down in `api/README.md`'s "What the gate asserts, and what it cannot": R2 and R3 are not
asserted at all; `default` is in the format and read by nothing; and React's surface is a
hand-written `.d.ts` the `.jsx` is never checked against. Restoring `style` and a
`{...rest}` spread to any migrated React component's `.jsx` leaves the gate green today.
Every plan that adds a contract should re-read that section first and add to it rather
than assume it is complete — the `check:tailwind-coverage` reason that "was written
anticipatorily and was false for two commits" is this repository's own record of how such
a claim rots.

**A contract can be correct and the component still broken.** The API contract is
orthogonal to behaviour, exactly as `check:behaviour` is a coverage claim and never an
accessibility one. A green `check:api` says the surface matches; it says nothing about
what the component does with it.

**Plan C defines contracts from components with known behavioural debt.** `Table` and
`Calendar` implement no keyboard navigation; `Tooltip` is not keyboard-reachable. Their
APIs can still be settled — an API for a component that does not yet trap focus is not
thereby wrong — but Plan D must not read a Plan C contract as a specification of
behaviour.

**Removing Material is a one-way door, and Plan D walked through it.** `arena-material.css`,
its prompt, `check:material` and the `@angular/material` devDependency are deleted; returning to
Material means undoing all of it. The gate that made this survivable is that Plan D happened
last, after every contract it implements against was already settled and proven by Plans A
through C. `BehaviourDelegated.json` did **not** go — it holds `Calendar` and `CalendarEvent`,
which are components Angular has never had rather than delegations, exactly as the note at the
top of the Plan D section predicted.
