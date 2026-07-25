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

## The other two contracts are firm; this layer is additive

Two of Arena's three contracts were settled before this one and are **not reopened by it**.
The **token** contract (`tokens/`) is the design-value layer. The **behaviour** contract
(`behaviour/patterns/`) states what each kind of component must do, adopted from the WAI-ARIA
Authoring Practices Guide — and, where APG has no page, from the ARIA 1.2 role reference or WCAG.
This API capability layer was added last, and it is **orthogonal and additive**: bringing a
component under contract may not weaken, remove, or contradict its behaviour binding or the
tokens it renders from. Neither of the two older layers changes to accommodate an API contract.

When an API reshape appears to require dropping or changing something a behaviour binding depends
on, **the reshape is what is wrong — not the binding.** `ConfirmDialog` is the worked example:
its `cancel` event is how the (accessible, Angular) dialog reports an Escape-key or Cancel-button
dismissal, which the `dialog-modal` pattern requires. A contract that omitted `cancel` to look
tidier would have left the Escape handler with nothing to emit and silently voided that
requirement. The member stays because the behaviour contract is firm. An API decision is correct
only if every behaviour binding it touches — and every design token it renders from — remains
exactly as true afterward as before.

## The vocabulary: nine forms

A member of any Arena component's API is exactly one of nine forms, and nothing else.

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

Eight of the nine are inbound; **event** is the only outbound one. The two array forms are
encoded as one `form: "array"` discriminated by `of`, which is a representation choice and
not a narrowing of the vocabulary.

**Consumer data is the one form whose contents the contract deliberately does not state.** It is
a record whose keys the *consumer* names: Arena routes it and never inspects it, which is neither
"Arena draws it" (an object) nor "the consumer draws it" (a slot). `Table`'s rows are the case
that named it — `row[c.key]` indexes the record by a key the consumer chose — and `Calendar`'s
per-event `meta` bag is the other. It exists because the sentence above used to say *seven*, and
was false: `Table.rows` is a member and was none of them.

The form is **narrow on purpose**, and that narrowness is what stops it being the escape R4
closes. It is exactly one spelling, `Record<string, unknown>`; a record of a *known* type is a
predefined object and must be declared as one, and stays an R4 violation. Two mechanical guards
hold it in place — it may not be a field of a predefined object (R1 below), and a member that
takes it in must also declare a route back out. Everything else about it is an authoring rule,
with the same status R2 and R3 carry.

**An inbound function is none of the eight — and `functionInput` is the ninth, for data-entry
controls only.** `event` is the only *outbound* function-shaped member, and it returns nothing. A
member the component *calls* and whose result it uses — a validator, a parser — is inbound and
returns a value, so it was none of the eight, and `classify()` in `scripts/lib/api-surface.mjs`
refused one rather than reading it as an event with the parameter as its payload. Where such a
member existed outside a data-entry control it was replaced by data the component renders itself:
the charts' `valueFormatter` became `valueSuffix`, a primitive Arena appends to every number it
draws — the axis tick, the tooltip and the accessible data table alike. That replacement landed
when the three charts were brought under contract; the reader's refusal shipped first, so no
contract could declare the old shape in the meantime.

**The ninth form deliberately reverses that refusal, and only for data-entry controls.** A field
that validates or parses its own value genuinely needs a function it can call, and no other form
expresses one: an event is outbound and returns nothing, and a datum cannot decide anything about a
value it has never seen. Forcing every future input — `NumberField`, `Combobox`, `PasswordField` —
to re-derive whether its inbound function is an event, a datum, or simply deleted is work the
vocabulary absorbs once. Two mechanical guards keep it narrow, and both are enforced by
`check:api` rather than left as authoring rules with R2 and R3's status:

- **It is legal only in a contract declaring `"kind": "input"`** at top level. A `functionInput`
  member anywhere else fails the gate, by name. A chart declaring a formatter still fails, exactly
  as it did before this form existed.
- **Its signature is modelled, not free TypeScript.** A `functionInput` declares `params` (a map of
  parameter name → type name) and `returns` (a type name), each a primitive or a type `api/types/`
  declares. **R4 holds inside the signature**: no `React.*` type in a parameter or in the return,
  and the reader surfaces one as a platform type so the gate reports the rule. The reader reduces
  a `string | null | undefined` return to `string` — the message, or none.

```json
"validate": {
  "form": "functionInput",
  "params": { "value": "string" },
  "returns": "string",
  "description": "Called on the field's value; returns the error message, or empty for valid."
}
```

**A return of `React.ReactNode` is not a `functionInput`.** `(item: T) => React.ReactNode` is
React's spelling of a **parameterised slot** (R3): it fills the interior of an element Arena
renders rather than producing a value Arena consumes. The reader does not model that shape and
throws on it, deliberately — absorbing a render prop into the ninth form would classify a slot as
data and close a door `Table.render` needs left open.

Angular's implementation of a `functionInput` is Plan D's problem and is recorded as debt there:
Angular's signal idiom discourages a function input, and the contract's modelled signature is what
Plan D must satisfy.

**The word `prop` does not appear in a contract.** It is React's vocabulary, and a neutral
contract that used it would already have chosen a layer. A contract declares *members*;
each layer binds them in its own idiom.

## The five derived rules

**R1 — A predefined object is pure data with known fields.** No functions and no slots
inside it. A field that is a function becomes an **event of the component**, carrying the
object in its payload; a field that is a node becomes a **slot of the component**, or a
primitive if Arena draws it. **And no consumer data inside it either** — an object states its
fields, and consumer data is by construction a record whose fields are unknown, so a declared
type cannot carry an undescribed bag. `Calendar`'s per-event `meta` is what this deletes: it
does not become a field of `CalendarEvent`, it becomes a member of the component.

**R2 — Who draws decides data versus slot.** If Arena draws the content — knows its
fields and owns its markup — it is an object or an array of objects. If the consumer draws
it, it is a slot. This is an objective test, not a preference, and it has a consequence
the repository already pays for: `check:compliance` can only judge DOM that Arena renders,
so content entering by slot is outside the behaviour contract.

**R3 — A parameterised slot fills, never replaces.** A slot may receive data from the
component, but it may only fill the interior of an element Arena renders — never
substitute the element that carries the behaviour contract.

**R4 — No platform types and no escapes.** `React.CSSProperties`, the `{...rest}` spread,
`React.Key`, `DOMRect`, `React.MouseEvent` and `React.HTMLInputTypeAttribute` are none of the
nine forms. An Arena enum or an Arena predefined object takes their place, and the rule reaches
*inside* a `functionInput`'s signature too: neither a parameter nor the return may name one.
`Record<string,
unknown>` was on this list and has left it — it is **consumer data** now, the eighth form, and
that is a promotion of one exact spelling and nothing wider: `Record<string, Widget>` is a
record of a known type, which is a predefined object, and it is still an R4 violation.

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
for the six inbound non-slot forms: **primitive**, **enum**, **object**, **array**,
**consumer data** and **functionInput**.

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

**Required-ness governs the implementation and the runtime.** `check:api` proves both layers
*declare* a member identically required — the implementation half, which already held. The
contract's `required` also governs **runtime**: the implementing component must enforce it,
failing hard when a required member is absent rather than rendering with a missing value.
Angular's `input.required` throws by construction; React throws from its render for the same
reason (`AppLogo`, `StatCard` and `Breadcrumbs` all do), so an absent required member fails
identically on both layers, and a consumer honouring the declared type reaches neither path.
Like R2 and R3, the runtime half is an **authoring rule the audit applies, not a gate check**:
`check:api` reads only the declared surface (React's `.d.ts`, Angular's `input.required`), never
the render, so it cannot see whether a component actually throws — the audit protocol enforces
that it does.

### The binding table

The gate needs the mapping to be mechanical rather than a matter of taste, so it is
written down here and implemented in `bindingName()` in `scripts/check-api.mjs`.

| Contract member | React binds it as | Angular binds it as |
|---|---|---|
| primitive, enum, object, array, consumer data, functionInput | a prop of the same name | `input()` of the same name |
| slot named `content` | `children` | a bare `<ng-content />` |
| slot named `x` | a node-valued prop `x` | `<ng-content select="[x]" />` |
| event named `x` | a function prop `onX` | `output()` named `x` |

A component's **default slot** — the one a consumer fills by writing content with no
marker — is the member named `content`. Naming it in the contract rather than leaving it
implicit is what lets the agreement assertion see it: a layer that accepts arbitrary
children without the contract declaring a `content` slot is offering a member no contract
governs.

### Re-exporting a shared type from React's `.d.ts`

A React component's `.d.ts` imports its enum and object types from
`../../api.generated`, and it should **re-export exactly the named types the
pre-migration `.d.ts` itself declared and exported locally** — no more, no less. A
type the old file spelled as a named, exported interface (`StatCard.d.ts`'s old
`StatDelta`, `Breadcrumbs.d.ts`'s old `Crumb`) keeps working for an existing
consumer's `import type { StatDelta } from '.../StatCard'` only if the migrated file
re-exports it (`export type { StatDelta };`); a type the old file spelled as a bare
inline literal union (`AppLogo.d.ts`'s old `size?: 'sm' | 'md' | 'lg' | 'xl'`,
`StatCard.d.ts`'s old `tone?: 'neutral' | 'accent' | …'`) had no name for a consumer
to import in the first place, so the migrated file re-exports nothing for it —
`LogoSize` and `Tone` both stay un-re-exported for exactly that reason. This is a
back-compat rule, not a design principle: it exists only so a consumer's existing
import keeps resolving, and it is mechanical — read the pre-migration file, re-export
whatever it named, nothing it did not. Angular has no equivalent question: a
component's own file imports straight from `../../api.generated` and there is no
prior local declaration to preserve.

## Conventions the audits settled

R2 decides data-versus-slot by asking who draws the content, and there are shapes where both
answers are true of two different designs. These are the ones the audits settled, so a later
contract cites the convention rather than re-deriving it — and so a reader of the contracts is
never asked to remember which components are which.

**A single icon is a primitive `string` carrying a Phosphor class name, never a slot.** Arena
draws the `<i class="…">`; the consumer names the glyph. This keeps the glyph inside what
`check:compliance` can judge, keeps the icon inside Arena's own iconography, and — the reason
that decided it — lets each layer gate the wrapper on the value's presence. Angular cannot
detect a filled slot without a `contentChild` query on a marker directive, so an icon *slot*
either ships an unconditional zero-area wrapper or costs a directive a consumer must remember
to import. `Alert` had already reached this answer independently in both layers.

**A field inside a predefined object is never a node, and inside an *array* of predefined
objects it can only be a primitive.** R1 offers two remedies for a node-valued field — make it
a slot of the component, or make it a primitive Arena draws — and the first is unavailable per
item, because a component-level slot cannot vary across a list. So `BulkAction.icon`,
`Command.icon`, `ActivityItem`'s text fields and `OnboardingStep.body` are all primitives, and
Arena draws them; a per-item icon is a Phosphor class name, the same answer the convention
above gives for a single one. The consequence is stated rather than hidden: a consumer cannot
place their own markup inside one row of a list Arena renders. This convention also removed
`ActivityFeed.renderItem` when `ActivityFeed` itself was brought under contract — and it went
**not** because it broke R3. Measured against the source, it filled the `<li>` Arena renders
rather than replacing it, exactly as `TableColumn.render` fills a `<td>`, so R3 permitted it.
What it had no answer for is Angular: per-item projection needs a
structural directive and `ngTemplateOutlet`, a binding no row of the table above covers and no
reader function reads, and landing that machinery for one member was judged the wrong trade.

**Flattening a platform heritage clause enumerates the element, not the platform.** R4 removes
`extends React.ButtonHTMLAttributes<HTMLButtonElement>` and its siblings, and the question that
leaves is which of the members it carried are real API. The answer is the attributes the **HTML
specification defines for that element**: they change what the control is or does, so a contract that
omitted them would be describing a narrower control than the one Arena ships. Global attributes,
ARIA attributes and the generic DOM handlers are not members — in Angular a consumer writes those on
the host directly, which is the same reason `style` and the `{...rest}` spread were deliberately not
ported (`components-divergences.md:681`, `:989`). So `<button>` contributes `type`, `disabled`,
`name`, `value`, `autoFocus` and the six `form*` overrides, plus a `click` event; `<span>` and
`<div>` contribute nothing at all, and flattening a component built on one of those adds no member
beyond the `content` slot it already accepted through `children`.

Two consequences are stated rather than hidden. A heritage clause is a **narrower documented claim
sitting on top of a wider real behaviour** — `{...rest}` forwards any prop the platform will render,
declared or not — so flattening removes capability that was reachable and undocumented, and the
component's `.prompt.md` says which. And there is no type to read it off: this repository declares
no React types package and runs no `tsc` over `frameworks/react/`, so the enumeration is transcribed
from the specification and checked by the audit, never resolved by a compiler.

**A tooltip's bubble is a primitive, not a slot.** The same R2 reasoning the single-icon convention
uses: Arena draws the bubble, the consumer names the text. It also resolves a collision the binding
table creates — a component that declares both a `content` member and children has two candidates for
one default slot, and the trigger is the one that is genuinely projected. The cost is that markup
inside a tooltip stops being possible.

**An event carries exactly one payload, and a platform event is never it.** A handler declaring two
parameters — the item and the DOM event that produced it — is not readable as an event, and
`classify()` refuses it. `Breadcrumbs` settled the resolution and it holds generally: **the platform
event leaves the payload and the item alone travels**, because a platform event type is an R4
violation inside a payload just as it is anywhere else. What leaves with it is `preventDefault()`, so
a component whose items render real anchors must say in its `.prompt.md` that the browser's own
navigation is no longer interceptable from the handler and that routing belongs to the router.

**A member offering "a bare value or a described one" picks the described one.** `(string | X)[]` is
an R5 violation and a convenience: the bare string means *value and label are the same*. The array of
predefined objects wins, because it carries strictly more information and the convenience is
expressible at the call site as `{ value: x, label: x }`, while the reverse is not — a stable value
with a translatable label cannot be said at all in the string form. Every call site passing bare
strings is rewritten, and that is the price.

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

`form` takes eight values — `primitive`, `enum`, `object`, `array`, `consumerData`,
`functionInput`, `slot`, `event` — and `array` is discriminated by `of`: a primitive type name
(`"string"`) makes it an array of primitives, a declared type name (`"Crumb"`) makes it an array
of predefined objects, and the form name `"consumerData"` makes it a list of consumer data.

A slot declares its parameters, or none:

```json
"mark":  { "form": "slot" },
"cell":  { "form": "slot", "params": { "value": "string", "row": "consumerData" } }
```

A `functionInput` declares its whole signature, and the contract carrying it declares
`"kind": "input"` at top level, or the gate rejects the member:

```json
{ "component": "Input", "kind": "input",
  "api": { "validate": { "form": "functionInput", "params": { "value": "string" }, "returns": "string" } } }
```

**Consumer data is spelled by form name in every position, because there is nothing to
declare.** `{"form": "array", "of": "consumerData"}` for a row list, `{"form": "consumerData"}`
for a single record, `"params": { "row": "consumerData" }` for a slot parameter and
`"payload": "consumerData"` for an event. **Nothing is declared in `api/types/` for it** — a
type there states its fields, and this form's whole content is that its fields are the
consumer's. That is what keeps the directory from filling with fieldless types, and it is why
the `cell` example above no longer names a `TableRow`: a `TableRow` cannot be declared, so a
contract naming one would be rejected by the very gate this document specifies.

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

**A closed set of values is not always an enum.** The charts' categorical ramp slot is the
case that decided the rule: it is a bounded 1..N, but it is declared a bare `number` on both
layers, not an `api/types/` enum. The bound N lives in exactly one authoritative place —
`tokens/src/palette.dark.json`'s `--color-cat-*` ramp — and reaches the components as the
derived `catSlots` constant in `tokens.generated.*`; `catColor()`'s `Math.min(CAT_SLOTS, …)`
clamp already enforces it at runtime in both layers, and it re-derives itself the day the ramp
gains or loses a colour. Modelling it as an enum would hand-copy that derived N into a contract
as a literal set with nothing tying the copy back to the palette — a stale-assertion surface of
exactly the kind this layer exists to remove, and the generator emits enum values quoted, so a
numeric set would not even render. An enum is right when the closed set is authored in the
contract and owned by it — `Tone` above — and wrong when it merely restates a value the token
layer already derives.

A `description` on a type or on one of its fields is carried into the generated modules
as a doc comment — `build-api-types.mjs` reads `api/types/` only. Group-level prose is
lost in `tokens/`'s generator and that is recorded as debt in `CLAUDE.md`; this generator
carries descriptions on every node it emits from `api/types/`, including type-level ones,
so that hole is not reopened here.

**A member's own `description` — the one written on a contract member in
`api/components/<Component>.json`, as `separator`'s is in the example above — is not one
of those nodes, and nothing reads it for emission.** Nothing in `scripts/` reads
`api/components/*.json` to generate anything; the contract exists to be read by
`check:api` and by whoever migrates a component, not to be built from. So a member
description lives in the contract only, and each layer's own doc comment
(`AppLogoProps`'s JSDoc, `arena-app-logo`'s class comment) restates it by hand — today
that restatement happens a third time again in the component's `.prompt.md`. Nothing
holds the three in step; a member description can drift from its layer's prose and
nothing here will notice. This is a known limit, not a gap left to close quietly — see
`CLAUDE.md`'s Known debt.

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

Two more things the gate does not assert, for reasons that are not R2/R3's — these are
gaps in the gate's own reach, not authoring rules left to human judgement:

- **`default` is documented and read by nothing.** The contract format above shows
  `"default": "/"`, and all three shipped contracts (`AppLogo`, `Breadcrumbs`, `StatCard`)
  carry at least one — but `spec.default` is referenced nowhere in `scripts/`. A contract
  saying `default: "md"` while React defaults to `'lg'` and Angular defaults to `'sm'`
  is invisible to `check:api` today. This is deliberately **not** implemented: React's
  default lives in a `.jsx` destructuring pattern the gate never reads at all (see the
  next point), so a default comparison could only ever be enforced against Angular, which
  would be worse than not claiming it — a gate that is silently one-sided is a false
  promise of parity, not a partial one.
- **React's checked surface is its hand-written `.d.ts`, never its `.jsx`.**
  `check-api.mjs` resolves a React component to `<Name>.d.ts` and reads that; the
  implementation is never opened. Angular has no declaration file to read instead — its
  surface comes from the real `<name>.ts` component. So R4's own "no platform types and no
  escapes" is enforced against real source on the Angular side and only against a
  declaration on the React side: restoring `style` and a `{...rest}` spread to
  `AppLogo.jsx` right now (they were removed from the `.d.ts` under this migration, per
  R4) would leave `check:api` green, because nothing looks at the `.jsx` again once the
  `.d.ts` agrees with the contract. This is a real limit on a gate whose whole claim is
  that an API divergence is a defect — it holds only as far as the `.d.ts` is honest about
  what the `.jsx` does.

R1, R4 and R5 *are* asserted: R1 by the type schema (a field may only be a primitive or an
enum), R4 by the reader recognising platform types by name and reporting them, R5 by a
member carrying exactly one `form` and by the reader classifying a mixed union as a union
rather than as any single form.

### What is mechanical about the ninth form

All three of its guarantees are, which is what separates it from R2 and R3 and from the eighth
form's authoring rules:

- **The `kind: "input"` guard.** `validateContract` rejects a `functionInput` in a contract that
  does not declare itself an input control, naming the member. "Input controls only" is a checked
  restriction, not a convention.
- **The signature's types.** Every name in `params` and the `returns` name must be a primitive or
  a type `api/types/` declares, resolved exactly as an object member's enum type is — so **R4
  holds inside the signature**, and a `functionInput` with no `returns` at all is reported rather
  than admitted as half a model.
- **The signature is compared, not only declared.** `compareSurface` matches each layer's
  parameter map and return against the contract's, key by key and in both directions. A layer
  whose validator takes a `number` where the contract says `string` is a divergence like any
  other; matching on form alone would have made the modelled signature documentation that nothing
  reads — the hole `default` still has, one paragraph above.

What stays outside: the reader refuses a return of `React.ReactNode` rather than classifying it,
because that shape is a **parameterised slot (R3)** and not a value the component consumes. So a
render prop cannot reach a contract through this form, and R3's own unverifiability is not widened
by it.

### What is mechanical about consumer data, and what is not

Exactly two things are checked, and they are the two that keep the eighth form from becoming
the escape R4 closed:

- **The R1 extension.** A predefined object may not carry a consumer-data field.
  `validateTypes` reports one by type and field name.
- **A consumer-data member must have a consumer.** A contract that takes consumer data in and
  declares no route back out — no slot parameter and no event payload of `consumerData` — is
  holding data Arena may never inspect and can never hand back, which is dead API.
  `validateContract` reports each held member by name.

Everything else about the form is an **authoring rule with the same status R2 and R3 carry**.
Nothing checks that a member spelled as consumer data is genuinely the consumer's data rather
than a shape someone declined to model; the reader's narrowness — one exact spelling, and a
record of a known type still reported under R4 — is what makes that judgement hard to reach by
accident, not a gate that catches it.

And the form is a **deliberate blind spot, which is worth naming rather than discovering.** The
value of this layer is that a member's type is knowable; this one's is not, by construction. So
content derived from consumer data reaches the DOM through a slot, and R2's consequence applies
to it in full: `check:compliance` judges only the DOM Arena renders, so whatever a consumer
draws from their own row is outside the behaviour contract as well as outside this one. A
component contracted with consumer data is contracted with a hole in it, on purpose, and both
gates are silent about the same hole.

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
