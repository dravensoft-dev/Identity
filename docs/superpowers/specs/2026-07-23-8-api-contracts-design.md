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
`React.Key`, `DOMRect`, `React.MouseEvent`, `React.HTMLInputTypeAttribute` and
`Record<string, unknown>` are none of the seven forms. An Arena enum or an Arena
predefined object takes their place.

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

# What Plan A settled

Binding on Plans B, C and D. Each of these was an open question when this spec was
written and is now closed; an audit that reopens one is wasting the maintainer's time.

**The binding table is mechanical and normative.** It lives in `api/README.md` and is
implemented by `bindingName()` in `scripts/check-api.mjs`. A contract member `x` of an
inbound non-slot form binds as a React prop `x` and an Angular `input()` named `x`; the
slot named `content` binds as React's `children` and a bare `<ng-content />`; a slot
named `x` binds as a React node-valued prop `x` and `<ng-content select="[x]" />`; an
event named `x` binds as React's `onX` and an Angular `output()` named `x`.

**The contract governs required-ness**, not only name, form and type — but only for the
four inbound non-slot forms. A slot's and an event's required-ness are not compared,
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
  the seven forms — so no chart contract can be written until it becomes `valueSuffix`, per
  `api/README.md`.
- **React's `CatSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8` reaches `classify()`'s union branch** with
  unquoted parts and is returned as `{ form: 'union' }` — an R5 violation. It becomes a bare
  `number`, per `api/README.md`'s worked example. **Open for 8B4's audit:** `LineChart.d.ts`
  re-exports both `CatSlot` and `SeriesTone` from `./BarChart`, and `DoughnutChart.d.ts` re-exports
  `CatSlot` alone, so whether the *name* survives as a back-compat alias is a decision, not a
  mechanical step.
- **`LineChartProps extends Omit<BarChartProps, 'slots'>` must be flattened.**
  `scripts/check-api.mjs:412` reports *any* heritage clause as the `{...rest}` R4 escape, with no
  special case for `Omit`. This is source work, not gate work — no reader change is needed.
- **Of the three charts 8B4 will contract, `BarChart:angular` is the only one already in
  `COVERED`** (`scripts/check-compliance.mjs:79`, `chart-data-table.test.ts`) — `LineChart` and
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
> Both are **inbound functions that return a value**, which is none of the seven forms — the
> identical shape the charts' `valueFormatter` had. **B4 is the worked precedent**: the member
> is replaced by data the component renders itself (`valueSuffix`), and the capability loss is
> stated plainly rather than hidden. Neither of these two takes that answer automatically —
> `Input.validate` returning an error message is a genuinely different problem from a number
> formatter, and it may well be an event plus a `error` primitive rather than a suffix — but
> the *rule* is settled and the audit does not have to re-derive it.
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
>   is the argument for flattening, over and above R4's letter. Six React `.d.ts` files still
>   carry a heritage clause.

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
- **`Table.d.ts`** — a generic `TableColumn<T>`. Generics are outside the seven forms
  entirely, and no form in the vocabulary expresses one. This is the harder of the two:
  it is not a member that violates a rule, it is a shape the vocabulary has no word for.
  Settle it in `Table`'s audit before writing the contract, and expect the answer to be
  either "the row type is not parameterised in the contract" or a change to the
  vocabulary itself.

## Other R4 work Plan C carries

`Input.type` is `React.HTMLInputTypeAttribute` and becomes an Arena enum — deciding
*which* input types Arena supports is a product decision the audit must surface, not a
transcription. `Table.getRowKey`'s return is `React.Key`; `Menu`'s `MenuItemDef.icon`,
`Toast`'s `ToastAction.onClick` and `SegmentedControl`/`Select`/`Tabs`' union options
(R5) are the rest. `Tabs.tabs`, `Select.options` and `SegmentedControl.options` are the
three R5 violations this spec names, and the reader already classifies each as a `union`
and reports it — so for those three the gate is ready before the audit is.

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

## What Plan A changes about how Plan D is verified

**The Plan C contract is Plan D's acceptance criterion, and for once the gate is on the
strong side of it.** `check:api` reads Angular's surface from the real `<name>.ts`
component, not from a declaration file — the asymmetry that weakens it on the React side
is an advantage here. A CDK-built primitive either declares the contract's members or it
does not, and no `.d.ts` stands between the two. So each of the twenty-two arrives with a
machine-checked API the day it is written, which is the opposite of how the existing
twenty-one arrived.

Three things to carry in:

- **Required-ness is contracted**, so `input.required<T>()` versus `input<T>(default)` is
  no longer a free choice per primitive — the contract Plan C wrote decides it, and the
  gate compares it. Plan A hit this twice: making a member required is an NG0950 hazard
  in the JIT test harness, and `frameworks/angular/test/host-class-binding.test.ts`
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
  slot named `x`), landed by B0 in `frameworks/angular/primitives/projection-markers.ts`;
  `templateSlots()` refuses any other form outright, so this is enforced rather than
  conventional.

**`api.generated.ts` is already in `ngc`'s program.** `frameworks/angular/index.ts`
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
`scripts/api-surface.test.mjs` (38 → 41) — Task 3b's pair, proving the reader now classifies
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
render pinned in both layers), 2 in `scripts/api-surface.test.mjs` (the reader refusing an
inbound function that returns a value), and 2 in `scripts/check-compliance.test.mjs` (COVERED's
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

**Removing Material is a one-way door.** Once `arena-material.css` and
`behaviour-delegated.json` are gone and twenty-two primitives exist, returning to Material
means undoing all of it. The gate that makes this survivable is that Plan D happens last,
after every contract it implements against is already settled and proven by Plans A
through C.
