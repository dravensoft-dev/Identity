# Arena API capability contracts

> **For whoever adds or changes a component contract.** Using a component instead? Its members are in `contracts/api/components/<Name>.json`, indexed by
> [`frameworks/Catalog.generated.md`](../../frameworks/Catalog.generated.md), and how to use it is its own `.prompt.md`. None of that needs this document.

Arena states three contracts. `contracts/design/` is the normative source for design values.
`contracts/behaviour/` states what a kind of component must do. This directory holds the
third: **the API capability contract**, one neutral statement per
component of the members its API presents, which every layer implementing that
component implements exactly.

It is orthogonal to the other two. A green `check:api` says the surface matches. It says
nothing about what the component does with it, exactly as `check:behaviour` is a
coverage claim and never an accessibility one.

Read this before adding a platform target, the way `contracts/design/README.md` is read
before adding one to the token layer.

## The other two contracts are firm; this layer is additive

Arena's other two contracts are settled and **not reopened by this one**.
The **token** contract (`contracts/design/`) is the design-value layer. The **behaviour** contract
(`contracts/behaviour/`) states what each kind of component must do, adopted from the WAI-ARIA
Authoring Practices Guide and, where APG has no page, from the ARIA 1.2 role reference or WCAG.
The API capability layer is **orthogonal and additive**: bringing a
component under contract may not weaken, remove, or contradict its behaviour binding or the
tokens it renders from. Neither of the other two layers changes to accommodate an API contract.

When an API reshape appears to require dropping or changing something a behaviour binding depends
on, **the reshape is what is wrong, not the binding.** `ConfirmDialog` is the worked example:
its `cancel` event is how the (accessible, Angular) dialog reports an Escape-key or Cancel-button
dismissal, which the `dialog-modal` pattern requires. A contract that omitted `cancel` to look
tidier would leave the Escape handler with nothing to emit and silently void that
requirement. The member stays because the behaviour contract is firm. An API decision is correct
only if every behaviour binding it touches, and every design token it renders from, remains
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
"Arena draws it" (an object) nor "the consumer draws it" (a slot). A table row is the shape it
names: `row[c.key]` indexes the record by a key the consumer chose. It exists because
the other eight cannot express a record whose keys the consumer names; without it such a member
gets modelled badly rather than modelled at all. The form has zero live instances, which
`grep -rn consumerData contracts/api/components/` re-derives. That is a fact about the
vocabulary and not a reason to retire the form.

The form is **narrow on purpose**, and that narrowness is what stops it being the escape R4
closes. It is exactly one spelling, `Record<string, unknown>`; a record of a *known* type is a
predefined object and must be declared as one, and stays an R4 violation. Two mechanical guards
hold it in place: it may not be a field of a predefined object (R1 below), and a member that
takes it in must also declare a route back out. Everything else about it is an authoring rule,
with the same status R2 and R3 carry.

**An inbound function is none of the eight, and `functionInput` is the ninth, for data-entry
controls only.** `event` is the only *outbound* function-shaped member, and it returns nothing. A
member the component *calls* and whose result it uses, a validator or a parser, is inbound and
returns a value, so it is none of the eight, and `classify()` in `scripts/lib/arena/api-surface.mjs`
refuses one rather than reading it as an event with the parameter as its payload. Outside a
data-entry control such a member is replaced by data the component renders itself: the charts
declare `valuePrefix` and `valueSuffix`, primitives Arena draws either side of every number,
and `valueFormat`, a predefined object of four primitive fields saying how the number itself is
written, all of it reaching the axis tick, the tooltip and the accessible data table alike. The
substitution is not a consolation prize: it also settles WHERE the formatting happens, which a
caller-supplied function leaves open and which matters here, because the three places have to
agree. A chart declaring a
formatter still fails the gate: the ninth form is for data-entry controls alone, which
`check:api` enforces by rejecting a `functionInput` in any contract not declaring
`"kind": "input"` at top level.

**The ninth form deliberately reverses that refusal, and only for data-entry controls.** A field
that validates or parses its own value genuinely needs a function it can call, and no other form
expresses one: an event is outbound and returns nothing, and a datum cannot decide anything about a
value it has never seen. Forcing every future input, a `NumberField`, a `Combobox`, a
`PasswordField`,
to re-derive whether its inbound function is an event, a datum, or simply deleted is work the
vocabulary absorbs once. Two mechanical guards keep it narrow, and both are enforced by
`check:api` rather than left as authoring rules with R2 and R3's status:

- **It is legal only in a contract declaring `"kind": "input"`** at top level. A `functionInput`
  member anywhere else fails the gate, by name, a chart declaring a formatter included.
- **Its signature is modelled, not free TypeScript.** A `functionInput` declares `params` (a map of
  parameter name → type name) and `returns` (a type name), each a primitive or a type `contracts/api/types/`
  declares. **R4 holds inside the signature**: no `React.*` type in a parameter or in the return,
  and the reader surfaces one as a platform type so the gate reports the rule. The reader reduces
  a `string | null | undefined` return to `string`, the message or none.

```json
"validate": {
  "form": "functionInput",
  "params": { "value": "string" },
  "returns": "string",
  "description": "Called on the field's value; returns the error message, or empty for valid."
}
```

**A return of `React.ReactNode` is not a `functionInput`, and it is not a member at all.**
`(item: T) => React.ReactNode` is React's spelling of a **parameterised slot** (R3): it fills the
interior of an element Arena renders rather than producing a value Arena consumes. The reader
throws on it, and that throw is an **enforcement, not a gap**: the per-item convention below
removes such a member rather than modelling it, so no contract should ever declare one and the
reader is right to refuse every one it meets.

**The reason is Angular, not R3.** R3 permits the shape, since a per-item renderer fills the cell or
row Arena renders rather than replacing it. What refuses it is that **per-item projection has no
Angular answer** short of a structural directive and `ngTemplateOutlet`, a binding no row of the
binding table covers and no reader function reads. Teaching the reader R3 would be **a reader for
a shape no contract may declare**, which is speculative work this layer refuses on principle.
Should a member ever genuinely need a parameterised slot, the reader change is small and the
throw's message is where to start.

**Angular's spelling of a `functionInput` is the bare arrow**, which the reader reads directly:

```ts
readonly validate = input<(value: string) => string>();
```

The optional spelling, `input<((value: string) => string) | undefined>()`, is readable too, since
a nullable annotation is the same annotation. Prefer the bare form regardless: **required-ness is
carried by `.required`, never by a `| undefined` arm.** A member the contract marks required is
`input.required<(value: string) => string>()`; one it does not is the bare `input<…>()`, whose value
is already `undefined` until the consumer supplies one, so the arm adds a second way to say what the
call already says.

No Angular primitive declares a `functionInput`, and the signal idiom discourages a function
input. What the first one to declare one must satisfy is the contract's modelled signature, in
the spelling above.

**The word `prop` does not appear in a contract.** It is React's vocabulary, and a neutral
contract that used it would already have chosen a layer. A contract declares *members*;
each layer binds them in its own idiom.

**Nor does a `description` name a layer**, and that one is machine-checked from an unexpected
direction: `generate:api` copies every description into both layers' own source, so a
description saying what React does and what Angular does lands inside each of them and
`check:layer-independence` fails the layer file. The failure is reported where the copy is
rather than where the prose is, so read it as an instruction about the contract. Say what the
member does and let each layer's idiom go unnamed: "each layer reaches it in its own idiom" is
the whole of what the reader needs.

## The six derived rules

**R1. A predefined object is pure data with known fields.** No functions and no slots
inside it. A field that is a function becomes an **event of the component**, carrying the
object in its payload; a field that is a node becomes a **slot of the component**, or a
primitive if Arena draws it. **And no consumer data inside it either**: an object states its
fields, and consumer data is by construction a record whose fields are unknown, so a declared
type cannot carry an undescribed bag. A per-event `meta` bag on a calendar event is the shape
this refuses, and it is **nothing at all** rather than a member of the component. The per-item
convention leaves such an object no per-item render function, which is the only route by which
a consumer's own record could come back out, and the other mechanical guard on the eighth form
is that a consumer-data member must have a consumer. With no route out it is dead API, so
`CalendarEvent` declares `id`, `title`, `start`, `end` and `colorId` and nothing else. What a
consumer cannot express through those is recorded in `Calendar.prompt.md`, not hidden.

**R2. Who draws decides data versus slot.** If Arena draws the content, knowing its
fields and owning its markup, it is an object or an array of objects. If the consumer draws
it, it is a slot. This is an objective test, not a preference, and it has a consequence
the repository already pays for: `check:compliance` can only judge DOM that Arena renders,
so content entering by slot is outside the behaviour contract.

**R3. A parameterised slot fills, never replaces.** A slot may receive data from the
component, but it may only fill the interior of an element Arena renders, never
substitute the element that carries the behaviour contract.

**R4. No platform types and no escapes.** `React.CSSProperties`, the `{...rest}` spread,
`React.Key`, `DOMRect`, `React.MouseEvent` and `React.HTMLInputTypeAttribute` are none of the
nine forms. An Arena enum or an Arena predefined object takes their place, and the rule reaches
*inside* a `functionInput`'s signature too: neither a parameter nor the return may name one.
`Record<string,
unknown>` is not on this list: it is **consumer data**, the eighth form, and
that covers one exact spelling and nothing wider. `Record<string, Widget>` is a
record of a known type, which is a predefined object, and it is an R4 violation.

**R5. No unions between forms.** A member is one form. `(string | SegmentOption)[]` picks one.

**R6. What a component renders is never derived from whether a listener is bound, or from
whether a slot was filled.** A component that draws a dismiss × only when someone is listening
for the dismissal, or an action button only when a slot has content, has made its rendered
shape depend on a question a platform may be unable to ask: an outbound member's subscriber
list is private in at least one of them, and projected content is not inspectable in at least
one of them. A component that asks it anyway is correct in the layer that can and silently
different in the layer that cannot.

So the answer is a **member**, and it is declared and gated on explicitly. `Alert.dismissible`,
`Toast.dismissible`, `Tag.removable`, `BulkActionBar.clearable`, `TableRow.interactive`,
`CalendarEvent.interactive`, `CalendarEvent.actionsEnabled` and `Calendar.dayInteractive` are the
eight that exist for this reason, and each one's description says so. The cost is stated rather than hidden: a consumer who binds the event and
forgets the boolean gets no control, in every layer alike, which is the point, since the
alternative is *one* layer quietly doing something else.

## What the contract governs, and what it does not

The contract governs the **member surface** (its name, its form, its type, its
required-ness) and not the syntax by which a platform expresses it. A slot named `mark`
is one member; React binds it to a node-valued prop, Angular to
`<ng-content select="[mark]">`. That is the same contract in two idioms, and it is not a
divergence. React has no content-projection syntax and Angular has no node-valued input;
demanding identical call-site syntax would demand something neither platform can give.

This is the line that makes "zero API divergences" achievable rather than rhetorical:
identical members, idiomatic binding.

### Required-ness is contracted too, with a carve-out

`required` is not only wording for a missing-member message: the contract's `required`
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
never "required", since a consumer is always free not to listen, and neither React's optional
function prop nor Angular's `output()` has a notion of a mandatory listener.

**A required name is refused when it is blank after trimming.** `Table.label`,
`SegmentedControl.ariaLabel` and the rest of the members only a human can supply are guarded at
runtime, and the value the guard exists to catch is not `undefined`, which the type already
catches, but a present-and-useless one. A name of nothing but spaces satisfies a
falsiness test and names nothing, so the guard trims before it decides, in every layer.

**Required-ness governs the implementation and the runtime.** `check:api` proves both layers
*declare* a member identically required, which is the implementation half. The
contract's `required` also governs **runtime**: the implementing component must enforce it,
failing hard when a required member is absent rather than rendering with a missing value.
Angular's `input.required` throws by construction; React throws from its render for the same
reason (`AppLogo`, `StatCard` and `Breadcrumbs` all do), so an absent required member fails
identically on both layers, and a consumer honouring the declared type reaches neither path.
Like R2 and R3, the runtime half is an **authoring rule the audit applies, not a gate check**:
`check:api` reads only the declared surface (React's `.tsx` interface, Angular's `input.required`), never
the render, so it cannot see whether a component actually throws. The audit protocol is what
enforces that it does.

### Affordances are contracted, and they are not members

Every component contract carries an `affordances` array beside `api`, from the closed set
`hover` and `focus`. It names the pointer and focus states **the component's own render
reacts to**: a button that tints under the pointer declares `hover`; a field that shows a
ring when focus lands in it declares `focus`. An empty array is the answer for a component
that presents neither, and the key is **mandatory** so that an absence can never be read as
"not stated yet".

It is not a member, and it is here anyway, because the question is neutral and every layer
needs the same answer to it. Neither of the other two contracts can hold it: `behaviour/` is
one file per **pattern** rather than per component, and a hover state is not an ARIA
requirement; `design/` holds values. A component's affordances are a decision about the
component, which is what this directory states.

**What a layer may not do is invent one.** `check:states` reads this declaration and nothing
else, in two one-way halves: a Tailwind manifest slot carrying a `hover:`/`focus:` modifier
no covered contract declares is invented, and a React component implementing a state its
contract does not declare is invented. Neither half reads the other layer. Neither runs the
other way, because a declared affordance a layer does not implement itself may be the child it
composes: `ConfirmDialog` declares `focus` for its own input and renders Arena `Button`s for
the rest, and a manifest, which has no composition and types those buttons out as its own
slots, is licensed for `hover` by `Button`'s declaration through the gate's `MANIFEST_COVERS`.

**Angular is structurally unaskable here**, and that is worth stating so nobody adds a third
half: an Angular primitive realises an affordance by rendering the manifest's own class, so
asking the layer would be asking the manifest.

### The binding table

The gate needs the mapping to be mechanical rather than a matter of taste, so it is
written down here and implemented in `bindingName()` in `scripts/check/arena/check-api.mjs`.

| Contract member | React binds it as | Angular binds it as |
|---|---|---|
| primitive, enum, object, array, consumer data, functionInput | a prop of the same name | `input()` of the same name |
| slot named `content` | `children` | a bare `<ng-content />` |
| slot named `x` | a node-valued prop `x` | `<ng-content select="[x]" />` |
| event named `x` | a function prop `onX` | `output()` named `x` |

A component's **default slot**, the one a consumer fills by writing content with no
marker, is the member named `content`. Naming it in the contract rather than leaving it
implicit is what lets the agreement assertion see it: a layer that accepts arbitrary
children without the contract declaring a `content` slot is offering a member no contract
governs.

### Re-exporting a shared type from React's source

A React component's `.tsx` imports its enum and object types from
`../../api.generated`, and **re-exports exactly the names a consumer can already
import from that component**, no more and no less. A type a component's own file
names and exports (`StatCard`'s `StatDelta`, `Breadcrumbs`'s `Crumb`) keeps a
consumer's `import type { StatDelta } from '.../StatCard'` resolving only while the
file re-exports it, so it does (`export type { StatDelta };`). A type spelled inline
as a literal union at its use site (`AppLogo`'s `size?: 'sm' | 'md' | 'lg' | 'xl'`,
`StatCard`'s `tone?: 'neutral' | 'accent' | …'`) offers a consumer no name to import,
so nothing is re-exported for it, and `LogoSize` and `Tone` stay un-re-exported for
exactly that reason. This is a compatibility rule rather than a design principle: it
exists only so a consumer's import keeps resolving, and it is mechanical, since what a
file re-exports is decided by what it names. Angular has no equivalent question,
because a component's own file imports straight from `../../api.generated` and
declares nothing locally to preserve.

**One deliberate exception: the rule drops when the name is not a type at all.**
`SideNavItem` is a component, not a predefined object type, and a file
cannot both import a type called `SideNavItem` and export a component called
`SideNavItem`, since one name cannot mean both. `SideNav.tsx` therefore carries no
re-export rather than resolving the collision.

## Settled conventions

R2 decides data-versus-slot by asking who draws the content, and there are shapes where both
answers are true of two different designs. These are the ones already settled, so a later
contract cites the convention rather than re-deriving it, and a reader of the contracts is
never asked to remember which components are which.

**A single icon is a primitive `string` carrying a Phosphor class name, never a slot.** Arena
draws the `<i class="…">`; the consumer names the glyph. This keeps the glyph inside what
`check:compliance` can judge, keeps the icon inside Arena's own iconography, and, the decisive
reason, lets each layer gate the wrapper on the value's presence. Angular cannot
detect a filled slot without a `contentChild` query on a marker directive, so an icon *slot*
either ships an unconditional zero-area wrapper or costs a directive a consumer must remember
to import. `Alert` renders it this way in both layers.

**A field inside a predefined object is never a node, and inside an *array* of predefined
objects it can only be a primitive.** R1 offers two remedies for a node-valued field, making it
a slot of the component or making it a primitive Arena draws, and the first is unavailable per
item, because a component-level slot cannot vary across a list. So `BulkAction.icon`,
`Command.icon`, `ActivityItem`'s text fields and `OnboardingStep.body` are all primitives, and
Arena draws them; a per-item icon is a Phosphor class name, the same answer the convention
above gives for a single one. The consequence is stated rather than hidden: a consumer cannot
place their own markup inside one row of a list Arena renders. The convention is why no feed,
calendar or table declares a per-item render function, and the reason is **not** R3. Such a
function fills the `<li>` or `<td>` Arena renders rather than replacing it, so R3 permits the
shape. What has no answer is Angular: per-item projection needs a
structural directive and `ngTemplateOutlet`, a binding no row of the table above covers and no
reader function reads, and that machinery for one member is the wrong trade.

**The convention holds across the library, and `Table` is where it charges the most.** The two
commonest things anyone puts in a table cell are a `Badge` in a status column and a `Button` in
an actions column, and Arena's own Delivery Console wants both. So the consequence stated above
for a feed row, *a consumer cannot place their own markup inside one row Arena renders*, reads
mildly there and sharply here: **a status column needs a member Arena draws from, and an actions
column has no expression in the contract at all.** That is a real capability loss with a real
user, recorded rather than discovered, and it is the price of one convention holding across the
library instead of `Table` becoming the exception that reintroduces per-item projection for
everyone.

**Flattening a platform heritage clause enumerates the element, not the platform.** R4 removes
`extends React.ButtonHTMLAttributes<HTMLButtonElement>` and its siblings, and the question that
leaves is which of the members it carried are real API. The answer is the attributes the **HTML
specification defines for that element**: they change what the control is or does, so a contract that
omitted them would be describing a narrower control than the one Arena ships. Global attributes,
ARIA attributes and the generic DOM handlers are not members, because in Angular a consumer writes those on
the host directly, which is the same reason `style` and the `{...rest}` spread are no member
either: a consumer writes them on the `<arena-x>` host, which is the same element the recipe's
`root` classes are bound to, and Angular composes a static attribute with a `[class]` binding
rather than clobbering it. So `<button>` contributes `type`, `disabled`,
`name`, `value`, `autoFocus` and the six `form*` overrides, plus a `click` event; `<span>` and
`<div>` contribute nothing at all, and flattening a component built on one of those adds no member
beyond the `content` slot it already accepted through `children`.

Two consequences are stated rather than hidden. A heritage clause is a **narrower documented claim
sitting on top of a wider real behaviour**, since `{...rest}` forwards any prop the platform will
render, declared or not, so flattening removes capability that is reachable and undocumented, and
the component's `.prompt.md` says which. And there is no type to read it off: `check:react-types`
compiles the layer, but it holds the layer to itself, so the enumeration is transcribed from the
specification and checked by the audit, never resolved by a compiler.

**Two global attributes are members, not one, and both pass the same test.** The rule above
stands for the rest, so `className`, `dir`, `tabIndex`, ARIA and `data-*` are not members, because
in Angular a consumer writes those on the host directly. `id` and `tabStop` each carry a capability
flattening removes rather than a global attribute the host can write elsewhere, and that is
what separates them from every other one.

`id` is a member only where the component generates one. A component that *derives* an id from
another member and wires its own `<label for>` to it has taken that attribute out of the
consumer's hands, and taken with it the only path to an external `<label>`, an
`aria-describedby`, or a form library that needs to address the field by name. `Input` and
`Textarea` declare it; the generated value stays the fallback, so the member is `id?: string` and
never required. A component that generates no id has no such gap and adds no such member.

`tabStop` is a member on `Button` and `IconButton` because the rule's own justification, that a
consumer writes it on the host directly, does not reach either. Neither has a host a consumer
writes on: both render their own `<button>` inside a host that is `display: contents`, in both
layers, so a `tabindex` written on `<arena-button>` reaches a node that lays nothing out and
takes no focus. The member is how a consumer holds one out of the tab order at all.
And for a component whose focusable element is a **descendant**
of its host rather than the host itself, the justification fails even where a host exists:
`tabindex="-1"` written on `<arena-icon-button>` would land on the custom element, not on the
`<button>` inside it, and the button would stay exactly as reachable as before. That makes
**`tabStop`** a member for exactly these two components, and confirms that `tabIndex` itself
stays off the list above for everyone, these two included, whose member is `tabStop` and never
the attribute. Everywhere else a component's root is its own focusable element and the host
escape genuinely applies. The member is a boolean rather than a raw `tabIndex?: number`: `-1` is the
only value the problem needs, and a numeric member would legalise a positive tab order, which
breaks document order. `true` writes nothing, since a native `<button>` is already reachable;
`false` writes `tabindex="-1"` and leaves the control programmatically focusable.

**A tooltip's bubble is a primitive, not a slot.** The same R2 reasoning the single-icon convention
uses: Arena draws the bubble, the consumer names the text. It also resolves a collision the binding
table creates: a component that declares both a `content` member and children has two candidates for
one default slot, and the trigger is the one that is genuinely projected. The cost is that markup
inside a tooltip stops being possible.

**An event carries exactly one payload, and a platform event is never it.** A handler declaring two
parameters, the item and the DOM event that produced it, is not readable as an event, and
`classify()` refuses it. The resolution holds generally: **the platform
event leaves the payload and the item alone travels**, because a platform event type is an R4
violation inside a payload just as it is anywhere else. What leaves with it is `preventDefault()`, so
a component whose items render real anchors must say in its `.prompt.md` that the browser's own
navigation is no longer interceptable from the handler and that routing belongs to the router.

**A member offering "a bare value or a described one" picks the described one.** `(string | X)[]` is
an R5 violation and a convenience: the bare string means *value and label are the same*. The array of
predefined objects wins, because it carries strictly more information and the convenience is
expressible at the call site as `{ value: x, label: x }`, while the reverse is not: a stable value
with a translatable label cannot be said at all in the string form. Every call site passes the
object form, and that is the price.

## Contract format

`contracts/api/components/<Component>.json`:

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

`form` takes eight values (`primitive`, `enum`, `object`, `array`, `consumerData`,
`functionInput`, `slot`, `event`) and `array` is discriminated by `of`: a primitive type name
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
`"payload": "consumerData"` for an event. **Nothing is declared in `contracts/api/types/` for it**:
a type there states its fields, and this form's whole content is that its fields are the
consumer's. That is what keeps the directory from filling with fieldless types, and it is why
the `cell` example above names no `TableRow`. A `TableRow` cannot be declared, so a
contract naming one is rejected by the very gate this document specifies.

An **optional** member is still a declared member. `required: false` governs whether a
consumer must supply it, never whether a layer must offer it: a layer omitting an optional
member fails the agreement assertion like any other. **There is no exception map.** An API
divergence is a defect; that is the point of this layer.

## Types

Declared once, in `contracts/api/types/`, one file per type:

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

**A closed set of values is not always an enum.** An enum is right when the closed set is
authored in the contract and owned by it, as `Tone` above is, and it is not automatically right
when the set merely restates a value the token layer already derives. The charts' categorical
ramp slot is the case the rule is written from. It is a bounded 1..N whose
bound lives in exactly one authoritative place, `contracts/design/palette.dark.json`'s
`--color-cat-*` ramp, reaching the components as the derived `catSlots` constant in
`Tokens.generated.*`, where `catColor()`'s `Math.min(CAT_SLOTS, …)` clamp enforces it at
runtime on both layers and re-derives itself the day the ramp gains or loses a colour. Modelling
such a set as an enum hand-copies that derived N into a contract as a literal set, and a copy
with **nothing tying it back to the palette** is a stale-assertion surface of exactly the kind
this layer exists to remove.

**So it may be an enum only while something machine-checks the restatement.**
`contracts/api/types/cat-slot.json` declares `CatSlot = 1 | … | 8`, and `check:script-tokens`
(`catSlotEnumProblems()` in `scripts/check/arena/check-script-tokens.mjs`) asserts that set is exactly
1..`catSlots` **in order**: add a ninth colour to the ramp and the gate fails until the
contract type follows. `enumLiteral()` in `build-api-types.mjs` renders a numeric set unquoted,
which is what lets the type render at all.

So the rule survives with its test attached: a closed set that restates a token-derived value
may be an enum **only** while something machine-checks the restatement. `CatSlot` is the only
type in `contracts/api/types/` that does this, and the assertion is written as that one named case
rather than as a mechanism: a second such type would need its own tie, and whether a general
mechanism is worth building is a question for whoever brings the second one, not a facility
already waiting for it.

A `description` on a type or on one of its fields is carried into the generated modules
as a doc comment, and `build-api-types.mjs` reads `contracts/api/types/` only. Group-level prose is
lost in `contracts/design/`'s generator and that is recorded as debt in `CLAUDE.md`; this generator
carries descriptions on every node it emits from `contracts/api/types/`, including type-level ones,
so that hole is not reopened here.

**A member's own `description`, the one written on a contract member in
`contracts/api/components/<Component>.json` as `separator`'s is in the example above, is not one
of those nodes: it is emitted a second way.** `bun run generate:api` writes it into each layer's
own source, as a `/** … */` block above the member it describes, so `tsc` and `ng-packagr` carry
it into what a consumer's editor shows on hover. **That is the only route it has.** A published
package ships no `contracts/` and no `.prompt.md`, by the decision `frameworks/PACKAGING.md`
records, so a description left in the contract alone reaches nobody who installs Arena, and the
member is discoverable only by whoever reads this repository.

`check:api` then holds every block equal to its contract, in both directions: a contracted member
with no doc fails, a doc whose text has drifted fails, and a `/** … */` on something no contract
names fails too. So the copy cannot rot, which is what earns it the one carve-out in the comment
rule `CLAUDE.md` states. **Two shapes cannot carry one and are exempt rather than missing:** a
member the contract leaves undescribed, and an Angular slot, which is an `<ng-content>` in a
template with no declaration for a doc to sit above. **The component's `.prompt.md` is still a
third statement and is still held by nobody**: it is prose about how to use a component rather
than a copy of a member's description, which is why it is left to a reader instead of gated.

`bun run generate:api` also emits `frameworks/react/Api.generated.ts` and
`frameworks/angular/Api.generated.ts` from these files. Both carry
the same body; emission is **per layer** so a component's import never crosses the
`contracts/api/` ↔ `frameworks/` boundary, which is the same rule the script-readable token
target holds to, for the same reason.

## What the gate asserts, and what it cannot

`bun run check:api` makes six assertions: coverage, form, agreement, the derived rules,
generated drift, and that every member's description reached both layers' own source. See `scripts/check/arena/check-api.mjs`.

**Three of the six derived rules are authoring rules the audit applies, and no gate asserts
them.** R2, "who draws it", is a fact about intent and markup ownership rather than about
a declaration, so a contract naming a slot for content Arena draws passes. R3, whether a
parameterised slot fills a cell or replaces a row, is a fact about the rendered tree;
`check:compliance` is the only layer that sees a rendered tree, and it does not read
contracts. R6, whether a render is derived from a bound listener, is a fact about the
implementation's control flow, and a declared boolean looks identical to a gate whether or
not the component actually gates on it.

**One thing sits outside the gate's reach rather than outside machine-checking:** `default` is
part of the contract format and is read by nothing on its own. The comparison also refuses one
direction on purpose, since a contract default with no destructuring default is **not** reported,
because the default may legitimately be applied downstream, and a source-reading gate cannot see
that. React's surface is read from both files, so a restored `{...rest}` spread in the `.tsx`
fails and a `spec.default` the implementation contradicts fails with it.

R1, R4 and R5 *are* asserted: R1 by the type schema (a field may only be a primitive or an
enum), R4 by the reader recognising platform types by name and reporting them, R5 by a
member carrying exactly one `form` and by the reader classifying a mixed union as a union
rather than as any single form.

**An event's `payload` resolves as one of exactly four things, and stating it as four
rather than as "a declared type" is the point.** `validateContract` accepts a payload that
is (1) a primitive type name, `"string"`, `"number"` or `"boolean"`; (2) the form name
`"consumerData"`; (3) the name of an **object** `contracts/api/types/` declares; or (4) the name of an
**enum** `contracts/api/types/` declares. Anything else is reported: a name `contracts/api/types/` does not
declare at all, and an object name used where the fourth arm does not apply. The four exist
because `classify()` produces all four from a real signature. It reduces
`(v: string) => void`, `(v: Crumb) => void` and `(v: LogoSize) => void` alike, so a contract
stating only some of them would be a gap between what the reader reads and what the
contract can say, rather than a rule the contract enforces.

### What is mechanical about the ninth form

All three of its guarantees are, which is what separates it from R2 and R3 and from the eighth
form's authoring rules:

- **The `kind: "input"` guard.** `validateContract` rejects a `functionInput` in a contract that
  does not declare itself an input control, naming the member. "Input controls only" is a checked
  restriction, not a convention.
- **The signature's types.** Every name in `params` and the `returns` name must be a primitive or
  a type `contracts/api/types/` declares, resolved exactly as an object member's enum type is, so **R4
  holds inside the signature**, and a `functionInput` with no `returns` at all is reported rather
  than admitted as half a model.
- **The signature is compared, not only declared.** `compareSurface` matches each layer's
  parameter map and return against the contract's, key by key and in both directions. A layer
  whose validator takes a `number` where the contract says `string` is a divergence like any
  other; matching on form alone would leave the modelled signature as documentation nothing
  reads, which is the hole `default` has, one paragraph above.

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
  declares no route back out, with no slot parameter and no event payload of `consumerData`, is
  holding data Arena may never inspect and can never hand back, which is dead API.
  `validateContract` reports each held member by name.

Everything else about the form is an **authoring rule with the same status R2 and R3 carry**.
Nothing checks that a member spelled as consumer data is genuinely the consumer's data rather
than a shape someone declined to model. The reader's narrowness, one exact spelling and a
record of a known type reported under R4, is what makes that judgement hard to reach by
accident, rather than a gate that catches it.

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

### What happens to a divergence the contract settles

A difference between the layers that is **entirely** an API difference stops existing the moment
the component comes under contract: the contract is the single statement of the members, and there
is nowhere for a second opinion to live. Nothing is migrated: the record is deleted, because there
is no divergence left to record.

What survives a contract is the rest: which element a layer renders, how a compound family
coordinates, what an idiom forces. That belongs in the component's own `.prompt.md` in each layer,
beside the source it describes, where a reader of that component meets it.
