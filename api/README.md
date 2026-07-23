# Arena API capability contracts

Arena states three contracts. `tokens/` is the normative source for design values.
`behaviour/patterns/` states what a kind of component must do. This directory is the
third and youngest: **the API capability contract** — one neutral statement per
component of the members its API presents, which every layer implementing that
component implements exactly.

It is orthogonal to the other two. A green `check:api` says the surface matches. It says
nothing about what the component does with it, exactly as `check:behaviour` is a
coverage claim and never an accessibility one.

Read this before adding a platform target, the way `tokens/src/TYPE-MAP.md` is read
before adding one to the token layer.

## The vocabulary: seven forms

A member of any Arena component's API is exactly one of seven forms, and nothing else.

| Form | What it is |
|---|---|
| **primitive** | `string`, `number` or `boolean` |
| **enum** | a closed, named set of literals |
| **predefined object** | a record of fields, each field itself a primitive or an enum |
| **array of primitives** | a homogeneous list of one primitive type |
| **array of predefined objects** | a homogeneous list of one predefined object |
| **slot** | a space the consumer fills; may declare parameters the component lends it |
| **event** | an outbound member: a name plus a declared payload |

Six of the seven are inbound; **event** is the only outbound one. The two array forms are
encoded as one `form: "array"` discriminated by `of`, which is a representation choice and
not a narrowing of the vocabulary.

**The word `prop` does not appear in a contract.** It is React's vocabulary, and a neutral
contract that used it would already have chosen a layer. A contract declares *members*;
each layer binds them in its own idiom.

## The five derived rules

**R1 — A predefined object is pure data.** No functions and no slots inside it. A field
that is a function becomes an **event of the component**, carrying the object in its
payload; a field that is a node becomes a **slot of the component**, or a primitive if
Arena draws it.

**R2 — Who draws decides data versus slot.** If Arena draws the content — knows its
fields and owns its markup — it is an object or an array of objects. If the consumer draws
it, it is a slot. This is an objective test, not a preference, and it has a consequence
the repository already pays for: `check:compliance` can only judge DOM that Arena renders,
so content entering by slot is outside the behaviour contract.

**R3 — A parameterised slot fills, never replaces.** A slot may receive data from the
component, but it may only fill the interior of an element Arena renders — never
substitute the element that carries the behaviour contract.

**R4 — No platform types and no escapes.** `React.CSSProperties`, the `{...rest}` spread,
`React.Key`, `DOMRect`, `React.MouseEvent`, `React.HTMLInputTypeAttribute` and
`Record<string, unknown>` are none of the seven forms. An Arena enum or an Arena
predefined object takes their place.

**R5 — No unions between forms.** A member is one form. `(string | TabItem)[]` picks one.

## What the contract governs, and what it does not

The contract governs the **member surface** — its name, its form, its type, its
required-ness — and not the syntax by which a platform expresses it. A slot named `mark`
is one member; React binds it to a node-valued prop, Angular to
`<ng-content select="[mark]">`. That is the same contract in two idioms, and it is not a
divergence. React has no content-projection syntax and Angular has no node-valued input;
demanding identical call-site syntax would demand something neither platform can give.

This is the line that makes "zero API divergences" achievable rather than rhetorical:
identical members, idiomatic binding.

### Required-ness is contracted too, with a carve-out

`required` is not only wording for a missing-member message — the contract's `required`
value is compared against each layer's, and a layer that implements a member as more or
less required than the contract says is reported like any other divergence. This holds
for the four inbound non-slot forms: **primitive**, **enum**, **object**, **array**.

It does not hold for **slot** or **event**, and that is a statement about what the two
platforms can express, not an exception written to excuse a divergence. A **slot's**
required-ness is not comparable because React can express one (a `children` prop with no
`?`) but Angular cannot: `<ng-content>` has no syntax to declare projected content
mandatory, so the reader always reports a template slot as `required: false`. Comparing it
would fail every contract that declares a required slot against Angular forever, for a
platform syntax limit rather than a real divergence. An **event's** required-ness is not
comparable because the concept does not apply to either platform: an outbound member is
never "required" — a consumer is always free not to listen — and neither React's optional
function prop nor Angular's `output()` has a notion of a mandatory listener.

### The binding table

The gate needs the mapping to be mechanical rather than a matter of taste, so it is
written down here and implemented in `bindingName()` in `scripts/check-api.mjs`.

| Contract member | React binds it as | Angular binds it as |
|---|---|---|
| primitive, enum, object, array | a prop of the same name | `input()` of the same name |
| slot named `content` | `children` | a bare `<ng-content />` |
| slot named `x` | a node-valued prop `x` | `<ng-content select="[x]" />` |
| event named `x` | a function prop `onX` | `output()` named `x` |

A component's **default slot** — the one a consumer fills by writing content with no
marker — is the member named `content`. Naming it in the contract rather than leaving it
implicit is what lets the agreement assertion see it: a layer that accepts arbitrary
children without the contract declaring a `content` slot is offering a member no contract
governs.

## Contract format

`api/components/<Component>.json`:

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

An **optional** member is still a declared member. `required: false` governs whether a
consumer must supply it, never whether a layer must offer it: a layer omitting an optional
member fails the agreement assertion like any other. **There is no exception map.** An API
divergence is a defect; that is the point of this layer.

## Types

Declared once, in `api/types/`, one file per type:

```json
{ "name": "Crumb", "kind": "object",
  "description": "One entry in a breadcrumb trail.",
  "fields": { "label": { "form": "primitive", "type": "string", "required": true },
              "href":  { "form": "primitive", "type": "string" } } }
```

```json
{ "name": "Tone", "kind": "enum",
  "description": "What state a value IS in right now.",
  "values": ["neutral", "accent", "gold", "success", "warning", "danger", "info"] }
```

A `description` on any node — a type, a field, a member — is carried into the generated
modules as a doc comment. Group-level prose is lost in `tokens/`'s generator and that is
recorded as debt in `CLAUDE.md`; this generator carries descriptions on every node it
emits, including type-level ones, so the same hole is not reopened.

`bun run build:api` emits `frameworks/react/api.generated.d.ts` and
`frameworks/angular/api.generated.ts` from these files. Both are committed and both carry
the same body; emission is **per layer** so a component's import never crosses the
`api/` ↔ `frameworks/` boundary — the rule the script-readable token target established,
for the same reason.

## What the gate asserts, and what it cannot

`bun run check:api` makes five assertions: coverage, form, agreement, the derived rules,
and generated drift. See `scripts/check-api.mjs`.

Two of the five rules are **authoring rules the audit applies, and no gate asserts them**:

- **R2 is not machine-checkable.** "Who draws it" is a fact about intent and markup
  ownership, not about a declaration. A contract can name a slot for content Arena draws,
  and the gate will agree with it.
- **R3 is not machine-checkable.** Whether a parameterised slot fills a cell or replaces a
  row is a fact about the rendered tree, not about the member list. `check:compliance` is
  the layer that can see a rendered tree, and it does not read contracts.

R1, R4 and R5 *are* asserted: R1 by the type schema (a field may only be a primitive or an
enum), R4 by the reader recognising platform types by name and reporting them, R5 by a
member carrying exactly one `form` and by the reader classifying a mixed union as a union
rather than as any single form.

## The audit protocol

A component is not migrated by inference. For each one, the following is presented in a
single exchange, and the decision is the maintainer's:

1. its current API in every layer that implements it;
2. which member breaks which rule, cited to the rule;
3. two or three concrete reshapes, each with its cost.

This is the explicit remedy for the failure `components-divergences.md` records:
`StatCard` became an object in React and three flat inputs in Angular because each layer
answered the question separately and each answer was defensible on its own terms. A
contract written by whoever migrates the component reproduces exactly that.

Only after the decision: write the contract, migrate every layer, update the tests,
manifests and demos that follow, and run the gates.

### What happens to `components-divergences.md`

An entry whose entire content is an API divergence is **deleted**, not migrated — the
contract replaces it, and the divergence no longer exists to record. Entries covering
rendering or behaviour stay. Three bindings cite that document as supporting evidence
(`command-palette.behaviour.json`, the `SideNav` delegated entry, and
`frameworks/angular/primitives/onboarding/onboarding.ts`); a change deleting a cited
section must redirect the citation in the same change.
