# Plan 8A — API capability contracts, the foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Arena's third contract — the neutral API capability contract — as a
working gate, and prove it end to end by migrating `AppLogo`, `Breadcrumbs` and `StatCard`
to it in both layers.

**Architecture:** One neutral JSON contract per component under `api/components/`, with
shared predefined objects and enums declared once under `api/types/`. A generator
(`scripts/build-api-types.mjs`) emits those types as committed TypeScript into each layer
(`frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`), on the same
committed-generated-output contract `tokens.generated.*` already carries. A generic,
runtime-portable reader (`scripts/lib/api-surface.mjs`) recovers each layer's declared
member list from source text, and a gate (`scripts/check-api.mjs`) makes the spec's five
assertions against it. Coverage is partial by design and grows one component at a time.

**Tech Stack:** Bun (with plain-node portability for everything under `scripts/`),
`node:test` + `node:assert/strict`, ESM `.mjs`, React 18 hand-written `.d.ts`, Angular 22
standalone signal components, `tailwind-variants` recipes.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **The spec's decisions are closed.** `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`
  (commit `4b4440a`) is the authority. Do not reopen or propose alternatives to: the seven
  forms, R1–R5, the contract format, the directory layout, or the hybrid mechanism
  (generate the types, verify the members). Implement them.
- **Ignore the "plan 8" in git history.** Commits `8a9680b` and `d2179be` (deleted in
  `143eb20`) are carry-over from the design and behaviour work and were discarded
  explicitly. Nothing in them is input to this plan.
- **The audit protocol is binding, and it blocks.** For each of the three components, the
  implementer presents (1) the current API in every layer, (2) which member breaks which
  rule, cited to the rule, and (3) two or three concrete reshapes each with its cost — and
  then **stops and waits for the maintainer's decision**. Do not decide a shape by
  inference where more than one reading is reasonable. This is the explicit remedy for the
  failure `components-divergences.md` records; a contract written by whoever migrates the
  component reproduces exactly that failure.
- **Do not touch the suspended tests.** `grep -rn PLAN-E-SUSPENDED scripts/` finds two
  commented blocks (`scripts/check-card-viewports.test.mjs` lines 19–230,
  `scripts/check-angular.test.mjs` lines 9–44). They stay commented for the whole of plans
  A–D. Do not restore them, do not "repair" them, do not edit inside them. The gates
  `check:cards` and `check:angular` themselves still run and must still pass.
- **English only** in every file in the repository — code, comments, docs, UI copy. (The
  conversation with the maintainer is in Spanish; nothing written into the tree is.)
- **`bun run check` runs once, when the plan's implementation is finished** — not per
  commit. Individual gates during the work: `check:api` after each component,
  `check:demos` after touching an `.entry.jsx`, `check:behaviour` and `check:compliance`
  after any change that moves a slot.
- **Runtime portability.** Everything under `scripts/` must run under plain `node` as well
  as `bun` — no `Bun.*` API, no import of a framework layer's `.ts`/`.jsx` from a
  `scripts/` test.
- **No new debt filed in a plan or spec document.** Those get deleted once executed. Debt
  goes in `CLAUDE.md`'s *Known debt* section or in the owning script's own record map.
- **Every component is a quartet.** A React migration touches `X.jsx`, `X.d.ts`,
  `X.prompt.md` and the group's `*.card.html`/`*.card.entry.jsx` demo. An Angular
  migration touches `<name>.ts`, `<name>.variants.ts` if slots move, `<name>.prompt.md`
  and the barrel.
- **Plan A's non-goals**, verbatim from the spec: it does not migrate the other 40
  components, does not touch `tokens/` or `behaviour/patterns/`, does not resolve the
  divergences-document migration plan 7d owns, and does not change any published version
  or the plugin manifest.

---

## File Structure

**Created**

| Path | Responsibility |
|---|---|
| `api/README.md` | The normative vocabulary: seven forms, R1–R5, the contract format, the per-layer binding table, and what the gate cannot verify. |
| `api/types/*.json` | Predefined objects and enums, declared once, platform-neutral. |
| `api/components/*.json` | One neutral contract per component. |
| `scripts/build-api-types.mjs` | Renders `api/types/` to TypeScript; writes both layers' modules. |
| `scripts/build-api-types.test.mjs` | Unit tests for the renderer, pure-string in / string out. |
| `scripts/lib/api-surface.mjs` | Generic reader: source text → declared member list. No DOM, no compiler, no framework runtime. |
| `scripts/api-surface.test.mjs` | Unit tests for the reader, including its loud failures. |
| `scripts/check-api.mjs` | The gate. Five assertions. |
| `scripts/check-api.test.mjs` | One test per assertion, plus the loud-failure path. |
| `frameworks/react/api.generated.d.ts` | Committed generated output. |
| `frameworks/angular/api.generated.ts` | Committed generated output, identical body. |

**Modified**

| Path | Change |
|---|---|
| `package.json` | `build:api`, `check:api` scripts. |
| `scripts/check-all.mjs` | `check:api` in `GATES`; header comment count. |
| `scripts/check-all.test.mjs` | `GATES` asserted by literal value — count and list. |
| `CLAUDE.md` | An *Architecture* paragraph for the API contract; a *Known debt* bullet for what the gate cannot assert. |
| `CHANGELOG.md` | Entry under `## [Unreleased]`. |
| `frameworks/react/components/brand/AppLogo.{jsx,d.ts,prompt.md}` | Migration. |
| `frameworks/react/components/navigation/Breadcrumbs.{jsx,d.ts,prompt.md}` | Migration. |
| `frameworks/react/components/display/StatCard.{jsx,d.ts,prompt.md}` | Migration. |
| `frameworks/angular/primitives/{app-logo,breadcrumbs,stat-card}/*` | Migration. |
| `frameworks/angular/index.ts` | Re-export the generated API types. |
| `frameworks/react/components/{brand,navigation,display}/*.card.entry.jsx` + compiled `.js` | Call sites. |
| `frameworks/react/ui_kits/console/{Shell,LoginScreen,DashboardScreen}.jsx` + compiled `.js` | Call sites. |
| `frameworks/react/test/app-logo.test.jsx` | Follows the migration. |
| `components-divergences.md` | Deletions the contract makes obsolete. |

---

## Task 1: The normative vocabulary

**Files:**
- Create: `api/README.md`
- Modify: `CLAUDE.md` (new paragraph in *Architecture*, after the `check:compliance`
  paragraph that ends "…while the component stays exactly as broken.")

**Interfaces:**
- Consumes: nothing.
- Produces: the file every later task cites. Task 4's gate messages point at
  `api/README.md` by name; the audits in Tasks 5–7 cite R1–R5 out of it.

- [ ] **Step 1: Write `api/README.md`**

```markdown
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

The contract governs the **member surface** — its name, its form, its type — and not the
syntax by which a platform expresses it. A slot named `mark` is one member; React binds it
to a node-valued prop, Angular to `<ng-content select="[mark]">`. That is the same contract
in two idioms, and it is not a divergence. React has no content-projection syntax and
Angular has no node-valued input; demanding identical call-site syntax would demand
something neither platform can give.

This is the line that makes "zero API divergences" achievable rather than rhetorical:
identical members, idiomatic binding.

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
```

- [ ] **Step 2: Add the `CLAUDE.md` paragraph**

Insert into *Architecture*, immediately after the paragraph ending
"…while the component stays exactly as broken.":

```markdown
**Arena's third contract is the API, and it lives at `api/`.** `api/components/<Name>.json`
states, once and neutrally, the members that component's API presents; every layer
implementing it implements exactly those members. A member is one of **seven forms** —
primitive, enum, predefined object, array of primitives, array of predefined objects,
slot, event — and five derived rules govern them (R1 an object is pure data, R2 who draws
decides data versus slot, R3 a parameterised slot fills and never replaces, R4 no platform
types and no escapes, R5 no unions between forms). `api/README.md` is the normative
statement and the first thing a new platform target reads, the way `tokens/src/TYPE-MAP.md`
is for the token layer. Shared objects and enums are declared once in `api/types/` and
emitted **per layer** by `bun run build:api` into the committed
`frameworks/react/api.generated.d.ts` and `frameworks/angular/api.generated.ts`, so a
component's import never crosses the `api/` ↔ `frameworks/` boundary. The word *prop* never
appears in a contract: it is React's vocabulary, and a neutral contract using it would
already have chosen a layer. **The structural difference from `behaviour/` is one file, not
one per layer** — behaviour files a binding beside each layer's source and has a gate
compare them, which admits two files that disagree and makes the gate's job to notice; a
contract that forbids divergence has nowhere for a second opinion to live, and
**`check:api` carries no exception map at all**. Coverage is partial by design and grows one
component at a time, the same charter `COVERED` carries in `check-compliance.mjs`: a green
run is a claim about the contracted components and says nothing about the rest — and,
being orthogonal to behaviour, it says nothing about what any of them *does* either.
```

- [ ] **Step 3: Verify the file renders and nothing else moved**

Run: `git status --short && bun run check:behaviour`
Expected: only `api/README.md` and `CLAUDE.md` listed; `check-behaviour` passes unchanged
(nothing in this task touches a binding). `api/types/` is not created here — git does not
track empty directories, and Task 2 creates it with its first real file.

- [ ] **Step 4: Commit**

```bash
git add api/README.md CLAUDE.md
git commit -m "docs(api): the seven forms and R1-R5, Arena's third contract"
```

---

## Task 2: The type generator

**Files:**
- Create: `scripts/build-api-types.mjs`
- Create: `scripts/build-api-types.test.mjs`
- Create: `api/types/tone.json`, `api/types/delta-tone.json`, `api/types/direction.json`,
  `api/types/logo-size.json`, `api/types/orientation.json`
- Create: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`
- Modify: `package.json` (`build:api` only — `check:api` lands in Task 4, with the script
  it names, so no commit ever advertises a script that is not there)
- Modify: `frameworks/angular/index.ts`

**Interfaces:**
- Consumes: `api/README.md`'s type schema (Task 1).
- Produces:
  - `export const API_TARGETS: string[]` — the two repo-relative output paths.
  - `export function loadTypes(dir?: string): Type[]` — every `api/types/*.json`, in
    file-name order.
  - `export function docComment(text: string, indent?: string): string`
  - `export function fieldType(field: {form: string, type: string}): string` — a field's
    TypeScript type; throws on any form R1 forbids.
  - `export function renderApiModule(types: Type[]): string` — the module body.
  - `export function buildApiModules(): Map<string, string>` — path → body, for the gate's
    drift assertion. (Synchronous, unlike `buildScriptModules()`, which is async only
    because Style Dictionary is.)

**Why only five types here.** The spec's A.2 lists seven types for Plan A: `Crumb`,
`StatDelta`, `Direction`, `DeltaTone`, `Tone`, `LogoSize`, `Orientation`. The five enums
are settled — their value sets are identical in both layers today and no reshape can move
them. The two **object** types are not: whether `Crumb` keeps an `onClick` field and
whether `StatDelta` exists at all are exactly what the Breadcrumbs and StatCard audits
decide. They are declared in Tasks 6 and 7, after the decision, not pre-empted here.

- [ ] **Step 1: Write the failing test**

Create `scripts/build-api-types.test.mjs`:

```js
/* The renderer is a pure function of the declared types, so this suite hands it
 * type objects directly rather than reading api/types/ -- the same shape
 * serialize-token.test.mjs and serialize-script.test.mjs use, and the reason
 * they run identically under bun and plain node. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderApiModule, docComment, fieldType, API_TARGETS, buildApiModules } from './build-api-types.mjs';

test('an enum renders as a string-literal union', () => {
  const out = renderApiModule([{ name: 'Direction', kind: 'enum', values: ['up', 'down'] }]);
  assert.match(out, /export type Direction = 'up' \| 'down';/);
});

test('an object renders as an interface, with optional fields marked optional', () => {
  const out = renderApiModule([{
    name: 'Crumb', kind: 'object',
    fields: {
      label: { form: 'primitive', type: 'string', required: true },
      href: { form: 'primitive', type: 'string' },
    },
  }]);
  assert.match(out, /export interface Crumb \{/);
  assert.match(out, /^ {2}label: string;$/m);
  assert.match(out, /^ {2}href\?: string;$/m);
});

test('an enum-typed field renders as the enum name, not as a re-inlined union', () => {
  const out = renderApiModule([{
    name: 'StatDelta', kind: 'object',
    fields: { direction: { form: 'enum', type: 'Direction', required: true } },
  }]);
  assert.match(out, /^ {2}direction: Direction;$/m);
});

test('a description becomes a doc comment on the type and on the field', () => {
  const out = renderApiModule([{
    name: 'Crumb', kind: 'object', description: 'One entry in a trail.',
    fields: { label: { form: 'primitive', type: 'string', required: true, description: 'What the crumb reads.' } },
  }]);
  assert.match(out, /\/\*\* One entry in a trail\. \*\/\nexport interface Crumb \{/);
  assert.match(out, /^ {2}\/\*\* What the crumb reads\. \*\/$/m);
});

test('a multi-line description becomes a block comment, so no prose is lost', () => {
  const out = docComment('first line\nsecond line');
  assert.equal(out, '/**\n *  first line\n *  second line\n */');
});

test('the header names the generator and forbids editing the output', () => {
  const out = renderApiModule([]);
  assert.match(out, /GENERATED by scripts\/build-api-types\.mjs/);
  assert.match(out, /edit api\/types\/, not this file/);
});

test('a field that is a slot or an event is refused -- R1, a predefined object is pure data', () => {
  assert.throws(() => fieldType({ form: 'slot' }), /R1/);
  assert.throws(() => fieldType({ form: 'event' }), /R1/);
  assert.throws(() => fieldType({ form: 'array', of: 'string' }), /R1/);
});

test('an unknown kind is refused rather than silently skipped', () => {
  assert.throws(() => renderApiModule([{ name: 'X', kind: 'mapped' }]), /unknown kind "mapped"/);
});

test('both layers receive the identical body -- one contract, two import paths', () => {
  const modules = buildApiModules();
  assert.deepEqual([...modules.keys()], API_TARGETS);
  const [a, b] = [...modules.values()];
  assert.equal(a, b);
});

test('API_TARGETS names one file per layer, and neither lives under api/', () => {
  assert.deepEqual(API_TARGETS, [
    'frameworks/react/api.generated.d.ts',
    'frameworks/angular/api.generated.ts',
  ]);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/build-api-types.test.mjs`
Expected: FAIL — `Cannot find module './build-api-types.mjs'`.

- [ ] **Step 3: Write the generator**

Create `scripts/build-api-types.mjs`:

```js
/* Emits the per-layer API type modules from api/types/.
 *
 * api/types/*.json declares every predefined object and enum an API contract
 * names -- once, platform-neutrally. This renders them as TypeScript and writes
 * the SAME body into both layers:
 *
 *   frameworks/react/api.generated.d.ts
 *   frameworks/angular/api.generated.ts
 *
 * Two files rather than one shared module, for the reason the script-readable
 * token target established: a component's import must never cross the
 * api/ <-> frameworks/ boundary. The bodies are identical because both are
 * type-only TypeScript; only the extension differs, because React's layer ships
 * declarations and Angular's is compiled by ngc.
 *
 * The output is COMMITTED. scripts/check-api.mjs asserts it matches the source,
 * the same guard check-tokens-generated.mjs is for the CSS.
 *
 *   bun scripts/build-api-types.mjs   -> writes both modules
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Repo-relative output paths, in emission order. */
export const API_TARGETS = [
  'frameworks/react/api.generated.d.ts',
  'frameworks/angular/api.generated.ts',
];

const HEADER =
  '/* GENERATED by scripts/build-api-types.mjs — edit api/types/, not this file.\n'
  + ' *\n'
  + ' * Every declaration here is a predefined object or an enum some Arena API\n'
  + ' * contract names. The same body is emitted into both layers so a component\'s\n'
  + ' * import never crosses the api/ <-> frameworks/ boundary — the rule\n'
  + ' * tokens.generated.* already carries. scripts/check-api.mjs asserts the\n'
  + ' * committed files match api/types/. See api/README.md for the vocabulary. */';

/** The TypeScript spelling of each primitive the vocabulary admits. */
const PRIMITIVE_TS = { string: 'string', number: 'number', boolean: 'boolean' };

/** Every declared type, in file-name order. Order is by filename rather than by
 *  declaration so the output is stable no matter what order a filesystem walks. */
export function loadTypes(dir = join(root, 'api/types')) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

/** A single-line description is one `/** … *\/`; a multi-line one is a block, so
 *  no prose is lost -- the hole tokens/'s own generator leaves for group-level
 *  descriptions and that CLAUDE.md records as debt. */
export function docComment(text, indent = '') {
  const lines = text.split('\n');
  if (lines.length === 1) return `${indent}/** ${text} */`;
  return [`${indent}/**`, ...lines.map((l) => `${indent} *  ${l}`), `${indent} */`].join('\n');
}

/** One field's TypeScript type. R1 lives here: a predefined object is pure data,
 *  so a field may only be a primitive or an enum. Anything else is refused at
 *  build time rather than emitted and caught later. */
export function fieldType(field) {
  if (field.form === 'primitive') {
    const ts = PRIMITIVE_TS[field.type];
    if (!ts) throw new Error(`fieldType: "${field.type}" is not one of string, number, boolean`);
    return ts;
  }
  if (field.form === 'enum') return field.type;
  throw new Error(`fieldType: form "${field.form}" is not allowed inside a predefined object — R1, an object is pure data`);
}

/** @param {Array<object>} types @returns {string} the module body */
export function renderApiModule(types) {
  const out = [HEADER];
  for (const type of types) {
    out.push('');
    if (type.description) out.push(docComment(type.description));
    if (type.kind === 'enum') {
      out.push(`export type ${type.name} = ${type.values.map((v) => `'${v}'`).join(' | ')};`);
      continue;
    }
    if (type.kind !== 'object') {
      throw new Error(`renderApiModule: unknown kind "${type.kind}" on type "${type.name}"`);
    }
    out.push(`export interface ${type.name} {`);
    for (const [name, field] of Object.entries(type.fields)) {
      if (field.description) out.push(docComment(field.description, '  '));
      out.push(`  ${name}${field.required ? '' : '?'}: ${fieldType(field)};`);
    }
    out.push('}');
  }
  return `${out.join('\n')}\n`;
}

/** @returns {Map<string,string>} repo-relative path -> module source */
export function buildApiModules() {
  const body = renderApiModule(loadTypes());
  return new Map(API_TARGETS.map((path) => [path, body]));
}

function main() {
  for (const [path, source] of buildApiModules()) {
    writeFileSync(join(root, path), source);
    console.log(`build-api-types: wrote ${path}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Declare the five settled enums**

`api/types/direction.json`:

```json
{
  "name": "Direction",
  "kind": "enum",
  "description": "Which way a number moved. Draws the arrow — nothing else. Deliberately separate from whether that movement was good.",
  "values": ["up", "down"]
}
```

`api/types/delta-tone.json`:

```json
{
  "name": "DeltaTone",
  "kind": "enum",
  "description": "Whether a change was GOOD. Separate from Direction because revenue down is negative and latency down is positive, and only the product knows which. Every sign renders outline, never filled.",
  "values": ["neutral", "positive", "negative"]
}
```

`api/types/tone.json`:

```json
{
  "name": "Tone",
  "kind": "enum",
  "description": "What state a value IS in right now, as against how it moved. Badge's vocabulary, so one set of tone names covers the system rather than a second set that is nearly the same.",
  "values": ["neutral", "accent", "gold", "success", "warning", "danger", "info"]
}
```

`api/types/logo-size.json`:

```json
{
  "name": "LogoSize",
  "kind": "enum",
  "description": "Both halves of the brand lock-up at once — the mark's slot and the wordmark. A fixed repertoire, not a ratio: sm an application frame, md a signed-out panel, lg the manual's Primary, xl the hero case.",
  "values": ["sm", "md", "lg", "xl"]
}
```

`api/types/orientation.json`:

```json
{
  "name": "Orientation",
  "kind": "enum",
  "description": "Whether the parts sit side by side or stacked.",
  "values": ["horizontal", "vertical"]
}
```

- [ ] **Step 5: Add the build script and generate**

In `package.json`, add `"build:api": "bun scripts/build-api-types.mjs",` immediately after
the `"build:demos"` line. **Do not add `check:api` here** — `scripts/check-api.mjs` does not
exist until Task 4, and a commit whose `package.json` advertises a script that is not there
is a broken tree, not a work in progress.

Run: `bun run build:api`
Expected: two `build-api-types: wrote …` lines.

- [ ] **Step 6: Run the tests**

Run: `bun test scripts/build-api-types.test.mjs`
Expected: PASS, 10 tests.

- [ ] **Step 7: Make the Angular layer see the generated types**

In `frameworks/angular/index.ts`, add as the **first** line:

```ts
export * from './api.generated';
```

`tsconfig.check.json` has `"files": ["./index.ts"]`, so this is what brings
`api.generated.ts` into the `ngc --strictTemplates` run.

Run: `bun run check:angular`
Expected: PASS — the Angular layer as committed still typechecks with the new module in
the program.

- [ ] **Step 8: Confirm the new `.ts` does not disturb the framework-layer gates**

Run: `bun run check:dimensions && bun run check:duplicate-constants`
Expected: both PASS. `frameworks/angular/api.generated.ts` is a `.ts` under `frameworks/`
and is therefore scanned by both; it holds type declarations only, so neither has anything
to find.

- [ ] **Step 9: Commit**

```bash
git add -A api/types
git add scripts/build-api-types.mjs scripts/build-api-types.test.mjs \
  frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts \
  frameworks/angular/index.ts package.json
git commit -m "feat(api): generate the shared API types into both layers"
```

---

## Task 3: The surface reader

**Files:**
- Create: `scripts/lib/api-surface.mjs`
- Create: `scripts/api-surface.test.mjs`

**Interfaces:**
- Consumes: nothing at runtime — it takes source text and returns data. Deliberately
  generic, mirroring `scripts/lib/behaviour-compliance.mjs`, so its own test runs under
  plain node.
- Produces, for Task 4:
  - `export class UnrecognisedShape extends Error` — thrown, never swallowed.
  - `export const PLATFORM_TYPES: string[]` — R4's named list.
  - `export function classify(ts: string): Classified` where `Classified` is one of
    `{form:'primitive',type}` · `{form:'enum',values}` · `{form:'slot'}` ·
    `{form:'array',of}` · `{form:'event',payload,platformPayload?}` ·
    `{form:'named',type}` · `{form:'platform',type}` · `{form:'union',parts}`.
    `named` means "an identifier the reader saw but cannot resolve alone" — the gate
    resolves it against `api/types/` into `enum` or `object`.
  - `export function braceBody(source: string, openIndex: number): string`
  - `export function reactSurface(source: string, interfaceName: string): {heritage: string[], members: Member[]}`
  - `export function angularSurface(source: string, className: string): {members: Member[]}`
  - `export function templateSlots(source: string): Member[]`
  - `Member` is `{name, required, ...Classified}`.

- [ ] **Step 1: Write the failing test**

Create `scripts/api-surface.test.mjs`:

```js
/* The reader takes source TEXT, so every case here is a string literal and
 * nothing on disk is read. That is what keeps it runnable under plain node in
 * check-all's own test step, and it is the same design scripts/lib/
 * behaviour-compliance.mjs carries for the same reason.
 *
 * READING A .d.ts BY REGEX IS A REAL LIMITATION. These tests pin both halves of
 * how it is handled: a shape the reader knows and rejects (a platform type) is
 * REPORTED, and a shape the reader cannot read at all THROWS. What must never
 * happen is the third thing -- returning silently fewer members than the source
 * declares -- so several cases below assert on the member COUNT, not only on the
 * members they name. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classify, reactSurface, angularSurface, templateSlots, braceBody,
  UnrecognisedShape, PLATFORM_TYPES,
} from './lib/api-surface.mjs';

test('the three primitives classify as primitives', () => {
  for (const t of ['string', 'number', 'boolean']) {
    assert.deepEqual(classify(t), { form: 'primitive', type: t });
  }
});

test('a closed literal union is an enum, and its values come out in order', () => {
  assert.deepEqual(classify("'sm' | 'md' | 'lg'"), { form: 'enum', values: ['sm', 'md', 'lg'] });
});

test('a node type is a slot', () => {
  assert.deepEqual(classify('React.ReactNode'), { form: 'slot' });
  assert.deepEqual(classify('ReactNode'), { form: 'slot' });
});

test('a function type is an event, and its single parameter is the payload', () => {
  assert.deepEqual(classify('(crumb: Crumb) => void'), { form: 'event', payload: 'Crumb' });
  assert.deepEqual(classify('() => void'), { form: 'event', payload: null });
});

test('an array is one form discriminated by what it holds', () => {
  assert.deepEqual(classify('Crumb[]'), { form: 'array', of: 'Crumb' });
  assert.deepEqual(classify('string[]'), { form: 'array', of: 'string' });
  assert.deepEqual(classify('Array<Crumb>'), { form: 'array', of: 'Crumb' });
});

test('every platform type R4 names is recognised and reported, never thrown', () => {
  for (const t of ['React.CSSProperties', 'React.Key', 'React.MouseEvent', 'DOMRect',
    'React.HTMLInputTypeAttribute', 'Record<string, unknown>']) {
    assert.equal(classify(t).form, 'platform', t);
  }
  assert.ok(PLATFORM_TYPES.includes('React.CSSProperties'));
});

test('a union between forms is a union, not a coin-flip between them -- R5', () => {
  const out = classify('(string | TabItem)[]');
  assert.equal(out.form, 'union');
});

test('an unreadable annotation throws rather than reporting no member', () => {
  assert.throws(() => classify('{ [k: string]: unknown }'), UnrecognisedShape);
  assert.throws(() => classify('(a: string, b: string) => void'), UnrecognisedShape);
});

test('braceBody returns the balanced interior, not the first closing brace it meets', () => {
  const src = 'x { a: { b: 1 }; c: 2 } y';
  assert.equal(braceBody(src, src.indexOf('{')).trim(), 'a: { b: 1 }; c: 2');
});

test('reactSurface reads every member of a props interface, with its optionality', () => {
  const src = `
    import * as React from 'react';
    /** doc */
    export interface AppLogoProps {
      /** Both halves at once. */
      size?: 'sm' | 'md';
      mark: React.ReactNode;
      name: string;
    }
    export function AppLogo(props: AppLogoProps): JSX.Element | null;
  `;
  const { heritage, members } = reactSurface(src, 'AppLogoProps');
  assert.deepEqual(heritage, []);
  assert.equal(members.length, 3);
  assert.deepEqual(members.map((m) => [m.name, m.form, m.required]), [
    ['size', 'enum', false], ['mark', 'slot', true], ['name', 'primitive', true],
  ]);
});

test('reactSurface surfaces heritage -- the {...rest} escape is a member surface too', () => {
  const src = `export interface XProps extends React.HTMLAttributes<HTMLSpanElement> { a: string; }`;
  assert.deepEqual(reactSurface(src, 'XProps').heritage, ['React.HTMLAttributes<HTMLSpanElement>']);
});

test('reactSurface throws when the interface it was asked for is not there', () => {
  assert.throws(() => reactSurface('export interface YProps { a: string; }', 'XProps'), UnrecognisedShape);
});

test('angularSurface reads input, input.required, output and a defaulted bare input', () => {
  const src = `
    @Component({ selector: 'arena-x', template: \`<span>{{ name() }}</span>\` })
    export class X {
      readonly name = input.required<string>();
      readonly dim = input<string>();
      readonly size = input<Size>('md');
      readonly separator = input('/');
      readonly navigate = output<Crumb>();
      protected readonly styles = computed(() => xStyles({ size: this.size() }));
    }
  `;
  const { members } = angularSurface(src, 'X');
  assert.deepEqual(members.map((m) => [m.name, m.form, m.required]), [
    ['name', 'primitive', true],
    ['dim', 'primitive', false],
    ['size', 'named', false],
    ['separator', 'primitive', false],
    ['navigate', 'event', false],
  ]);
  assert.equal(members.find((m) => m.name === 'navigate').payload, 'Crumb');
});

test('angularSurface ignores protected and private members -- they are not the public API', () => {
  const src = `export class X { readonly a = input<string>(); protected readonly b = computed(() => 1); private c = 2; }`;
  assert.deepEqual(angularSurface(src, 'X').members.map((m) => m.name), ['a']);
});

test('angularSurface steps over a method body without mistaking its remains for a member', () => {
  const src = `
    export class X {
      readonly navigate = output<Crumb>();
      protected onClick(crumb: Crumb, event: MouseEvent): void {
        this.navigate.emit(crumb);
      }
    }
  `;
  assert.deepEqual(angularSurface(src, 'X').members.map((m) => m.name), ['navigate']);
});

test('angularSurface throws on a public member whose initialiser it cannot read', () => {
  const src = `export class X { readonly a = somethingElse<string>(); }`;
  assert.throws(() => angularSurface(src, 'X'), UnrecognisedShape);
});

test('a bare ng-content is the default slot, named content; an attribute selector names its own', () => {
  assert.deepEqual(templateSlots('<span><ng-content /></span>'),
    [{ name: 'content', form: 'slot', required: false }]);
  assert.deepEqual(templateSlots('<ng-content select="[mark]" /><ng-content select="[icon]"></ng-content>'),
    [{ name: 'mark', form: 'slot', required: false }, { name: 'icon', form: 'slot', required: false }]);
});

test('an ng-content selector that is not an attribute selector throws -- the binding table defines one form', () => {
  assert.throws(() => templateSlots('<ng-content select="img" />'), UnrecognisedShape);
});

test('angularSurface reports template slots alongside declared members', () => {
  const src = `
    @Component({ template: \`<span><ng-content select="[mark]" /></span>\` })
    export class X { readonly name = input.required<string>(); }
  `;
  assert.deepEqual(angularSurface(src, 'X').members.map((m) => [m.name, m.form]),
    [['name', 'primitive'], ['mark', 'slot']]);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/api-surface.test.mjs`
Expected: FAIL — `Cannot find module './lib/api-surface.mjs'`.

- [ ] **Step 3: Write the reader**

Create `scripts/lib/api-surface.mjs`:

```js
/* Reads a layer's declared API surface out of its source TEXT.
 *
 * Deliberately generic, for the reason scripts/lib/behaviour-compliance.mjs is:
 * it takes a string and returns a member list, touching no DOM, no TypeScript
 * compiler and no framework runtime, so scripts/api-surface.test.mjs exercises
 * it under plain node and check-all can run the whole gate there.
 *
 * READING A .d.ts BY REGEX IS A REAL LIMITATION, and this states it rather than
 * hiding it. The reader recognises the member shapes this repository's
 * hand-written .d.ts files and Angular primitives actually use. Three outcomes,
 * and the third is the one that must never happen:
 *
 *   - a shape in the vocabulary            -> classified
 *   - a shape it knows and R4 forbids      -> {form: 'platform'}, REPORTED by the gate
 *   - a shape it cannot read at all        -> throws UnrecognisedShape
 *
 * A member the reader cannot parse is a gate FAILURE, never a member silently
 * missing from the list. That is why every unreadable branch below throws
 * instead of returning early or skipping the line.
 *
 * See api/README.md for the vocabulary and the per-layer binding table. */

/** Thrown when the reader meets a shape it does not recognise. Never caught
 *  inside this module. */
export class UnrecognisedShape extends Error {
  constructor(message) { super(message); this.name = 'UnrecognisedShape'; }
}

const PRIMITIVES = new Set(['string', 'number', 'boolean']);

/** R4's named list, plus the two catch-alls it names by shape. These are
 *  RECOGNISED on purpose: the reader knows exactly what each one is, and it is
 *  simply not in the vocabulary -- so it is reported as a rule violation rather
 *  than thrown as unreadable. Reported and thrown both fail the gate; the
 *  difference is whether the message can name the rule. */
export const PLATFORM_TYPES = [
  'React.CSSProperties', 'CSSProperties',
  'React.Key', 'React.MouseEvent', 'React.HTMLInputTypeAttribute',
  'DOMRect', 'MouseEvent', 'Event', 'HTMLElement', 'unknown', 'any', 'object',
];

/** One TypeScript type annotation, as one of the reader's outcomes.
 *  `form: 'named'` is not a verdict -- it is "an identifier I read but cannot
 *  resolve on my own"; the gate resolves it against api/types/ into an enum or
 *  an object, and reports it as undeclared if it is neither. */
export function classify(raw) {
  const ts = raw.trim();
  if (!ts) throw new UnrecognisedShape('empty type annotation');

  if (ts === 'React.ReactNode' || ts === 'ReactNode') return { form: 'slot' };
  if (PRIMITIVES.has(ts)) return { form: 'primitive', type: ts };
  if (PLATFORM_TYPES.includes(ts) || ts.startsWith('Record<') || /^React\./.test(ts)) {
    return { form: 'platform', type: ts };
  }

  const arrow = /^\(([\s\S]*)\)\s*=>\s*[\s\S]+$/.exec(ts);
  if (arrow) {
    const params = arrow[1].trim();
    if (!params) return { form: 'event', payload: null };
    if (params.includes(',')) {
      throw new UnrecognisedShape(`an event takes one payload, and this declares more than one parameter: ${ts}`);
    }
    const colon = params.indexOf(':');
    if (colon === -1) throw new UnrecognisedShape(`event parameter has no type annotation: ${ts}`);
    const inner = classify(params.slice(colon + 1));
    if (inner.form === 'platform') return { form: 'event', payload: inner.type, platformPayload: true };
    if (inner.form !== 'named' && inner.form !== 'primitive') {
      throw new UnrecognisedShape(`unreadable event payload: ${ts}`);
    }
    return { form: 'event', payload: inner.type };
  }

  if (ts.startsWith('(') && ts.endsWith(')')) return classify(ts.slice(1, -1));

  const array = /^([\s\S]+)\[\]$/.exec(ts) ?? /^Array<([\s\S]+)>$/.exec(ts);
  if (array) {
    const inner = classify(array[1].trim());
    /* An array of a union is the union's problem, not the array's -- R5 names
     * `(string | TabItem)[]` explicitly, so it must surface as a union rather
     * than as an unreadable shape the message cannot explain. */
    if (inner.form === 'union') return inner;
    if (inner.form !== 'primitive' && inner.form !== 'named') {
      throw new UnrecognisedShape(`unreadable array element type: ${ts}`);
    }
    return { form: 'array', of: inner.type };
  }

  if (ts.includes('|')) {
    const parts = ts.split('|').map((p) => p.trim());
    if (parts.every((p) => /^'[^']*'$/.test(p))) {
      return { form: 'enum', values: parts.map((p) => p.slice(1, -1)) };
    }
    return { form: 'union', parts };
  }

  if (/^[A-Z][A-Za-z0-9]*$/.test(ts)) return { form: 'named', type: ts };
  throw new UnrecognisedShape(`unreadable type annotation: ${ts}`);
}

/** The balanced interior of the block whose opening brace is at `openIndex`.
 *  A depth counter, not a regex: an interface member can itself carry braces
 *  and a `.*?}` would stop at the first one. */
export function braceBody(source, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  throw new UnrecognisedShape('unbalanced braces');
}

/** Comments are stripped BEFORE splitting on `;`, because a semicolon inside a
 *  doc comment would otherwise cut a member in half. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** @returns {{heritage: string[], members: object[]}} */
export function reactSurface(source, interfaceName) {
  const decl = new RegExp(`export\\s+interface\\s+${interfaceName}\\b([^{]*)\\{`).exec(source);
  if (!decl) throw new UnrecognisedShape(`no "export interface ${interfaceName}" in this source`);
  const heritage = /extends\s+([^{]+)/.exec(decl[1]);
  const body = braceBody(source, decl.index + decl[0].length - 1);
  return {
    heritage: heritage ? heritage[1].split(',').map((h) => h.trim()).filter(Boolean) : [],
    members: interfaceMembers(body),
  };
}

function interfaceMembers(body) {
  const members = [];
  for (const raw of stripComments(body).split(';')) {
    const text = raw.trim();
    if (!text) continue;
    const m = /^([A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/.exec(text);
    if (!m) throw new UnrecognisedShape(`unreadable interface member: ${text}`);
    members.push({ name: m[1], required: !m[2], ...classify(m[3]) });
  }
  return members;
}

/** @returns {{members: object[]}} declared members first, template slots after */
export function angularSurface(source, className) {
  const decl = new RegExp(`export\\s+class\\s+${className}\\b[^{]*\\{`).exec(source);
  if (!decl) throw new UnrecognisedShape(`no "export class ${className}" in this source`);
  const body = braceBody(source, decl.index + decl[0].length - 1);
  const members = [];
  for (const raw of stripComments(body).split(';')) {
    const text = raw.trim();
    /* A method body's statements split on `;` like anything else, so what is
     * left after skipping the `protected onX(...) {` fragment is a lone `}`.
     * Dropping brace-only fragments is what lets a primitive carry a method
     * without the reader mistaking its remains for a malformed member. */
    if (!text || /^[{}\s]*$/.test(text)) continue;
    if (/^(protected|private)\b/.test(text)) continue;
    const m = /^readonly\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(text);
    if (!m) throw new UnrecognisedShape(`unreadable class member: ${text}`);
    members.push(classMember(m[1], m[2]));
  }
  return { members: [...members, ...templateSlots(source)] };
}

function classMember(name, initialiser) {
  const init = initialiser.trim();
  const generic = /^(input|output|model)(\.required)?\s*<([\s\S]*)>\s*\(([\s\S]*)\)$/.exec(init);
  if (generic) {
    const [, kind, required, type] = generic;
    if (kind === 'output') {
      const inner = type.trim() === 'void' ? { payload: null } : classify(type);
      if (inner.form === 'platform') return { name, form: 'event', required: false, payload: inner.type, platformPayload: true };
      return { name, form: 'event', required: false, payload: inner.type ?? null };
    }
    return { name, required: Boolean(required), ...classify(type) };
  }
  const bare = /^input\s*\(([\s\S]*)\)$/.exec(init);
  if (bare) return { name, required: false, ...classify(literalType(bare[1].trim(), name)) };
  throw new UnrecognisedShape(`unreadable member initialiser for "${name}": ${init}`);
}

/** `input('/')` declares its type by its default. No default and no generic
 *  means no declared type at all, which is a shape the reader refuses rather
 *  than guessing at. */
function literalType(arg, name) {
  if (/^'[^']*'$/.test(arg) || /^"[^"]*"$/.test(arg)) return 'string';
  if (/^-?\d+(\.\d+)?$/.test(arg)) return 'number';
  if (arg === 'true' || arg === 'false') return 'boolean';
  throw new UnrecognisedShape(`input("${arg}") on "${name}" declares no type — give it a generic`);
}

/** Angular's slots live in the template, not in a declaration. A bare
 *  <ng-content /> is the default slot, which the contract names `content`; an
 *  attribute selector names its own. Any other selector is refused: the binding
 *  table in api/README.md defines exactly these two forms. */
export function templateSlots(source) {
  const out = [];
  for (const m of source.matchAll(/<ng-content\b([^>]*)>/g)) {
    const attrs = m[1];
    const select = /select\s*=\s*"([^"]*)"/.exec(attrs);
    if (!select) { out.push({ name: 'content', form: 'slot', required: false }); continue; }
    const attribute = /^\[([\w-]+)\]$/.exec(select[1].trim());
    if (!attribute) {
      throw new UnrecognisedShape(`ng-content select="${select[1]}" is not an attribute selector — see the binding table in api/README.md`);
    }
    out.push({ name: attribute[1], form: 'slot', required: false });
  }
  return out;
}
```

- [ ] **Step 4: Run the tests**

Run: `bun test scripts/api-surface.test.mjs`
Expected: PASS, 19 tests.

- [ ] **Step 5: Confirm it runs under plain node too**

Run: `node --test scripts/api-surface.test.mjs`
Expected: PASS — same count. If this fails, something Bun-only leaked in.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/api-surface.mjs scripts/api-surface.test.mjs
git commit -m "feat(api): a generic, runtime-portable reader for a layer's declared members"
```

---

## Task 4: The gate

**Files:**
- Create: `scripts/check-api.mjs`
- Create: `scripts/check-api.test.mjs`
- Modify: `scripts/check-all.mjs` (header comment + `GATES`)
- Modify: `scripts/check-all.test.mjs` (the literal-value assertion)
- Modify: `package.json` (`check:api`)
- Modify: `CLAUDE.md` (*Known debt* bullet)

**Interfaces:**
- Consumes: `buildApiModules`, `API_TARGETS` from `scripts/build-api-types.mjs` (Task 2);
  `reactSurface`, `angularSurface`, `classify`, `UnrecognisedShape` from
  `scripts/lib/api-surface.mjs` (Task 3); `reactComponents` from
  `scripts/lib/behaviour-contracts.mjs`.
- Produces, for Tasks 5–7 (which run it) and for its own test:
  - `export function kebab(pascal: string): string`
  - `export function bindingName(name: string, form: string, layer: 'react'|'angular'): string`
  - `export function validateTypes(types: object[]): string[]`
  - `export function validateContract(contract: object, typeNames: Map<string,'enum'|'object'>): string[]`
  - `export function compareSurface(contract: object, members: object[], layer: string): string[]`
    Each returns a list of human-readable problem strings; an empty list means no problem.

At the end of this task `api/components/` is empty and `check:api` passes vacuously. That
is correct and deliberate — coverage is partial by design and grows one component at a
time, the same charter `COVERED` carries. The gate's *own* five assertions are proven by
`check-api.test.mjs`, not by the state of the tree.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-api.test.mjs`:

```js
/* One test per assertion the gate makes, driven through the gate's exported
 * pure helpers rather than through main(). main() reads the filesystem and
 * exits the process; the helpers are what actually decide, so they are what is
 * worth pinning -- the idiom check-script-tokens.test.mjs and
 * check-dimension-literals.test.mjs already use.
 *
 * The five assertions, and where each is covered:
 *   1 coverage         -> kebab(), plus the path-shape test below
 *   2 form             -> compareSurface on a platform/union member
 *   3 agreement        -> compareSurface, both directions, plus the optional rule
 *   4 derived rules    -> validateTypes (R1) and compareSurface (R4, R5)
 *   5 generated drift  -> buildApiModules against the committed files
 * plus the loud failure on a member shape the reader cannot read at all. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kebab, bindingName, validateTypes, validateContract, compareSurface } from './check-api.mjs';
import { buildApiModules } from './build-api-types.mjs';
import { reactSurface, UnrecognisedShape } from './lib/api-surface.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = new Map([['Tone', 'enum'], ['Crumb', 'object']]);

const CONTRACT = {
  component: 'Breadcrumbs',
  api: {
    items: { form: 'array', of: 'Crumb', required: true },
    separator: { form: 'primitive', type: 'string' },
    navigate: { form: 'event', payload: 'Crumb' },
  },
};

/* 1 — coverage */

test('kebab turns a component name into the Angular directory name', () => {
  assert.equal(kebab('AppLogo'), 'app-logo');
  assert.equal(kebab('StatCard'), 'stat-card');
  assert.equal(kebab('Breadcrumbs'), 'breadcrumbs');
});

/* the binding table */

test('the binding table is mechanical: content is children, an event x is onX', () => {
  assert.equal(bindingName('content', 'slot', 'react'), 'children');
  assert.equal(bindingName('mark', 'slot', 'react'), 'mark');
  assert.equal(bindingName('navigate', 'event', 'react'), 'onNavigate');
  assert.equal(bindingName('items', 'array', 'react'), 'items');
  for (const [n, f] of [['content', 'slot'], ['navigate', 'event'], ['items', 'array']]) {
    assert.equal(bindingName(n, f, 'angular'), n);
  }
});

/* 2 — form, and 4 — R4/R5 */

test('a platform type is reported as an R4 violation, naming the rule', () => {
  const problems = compareSurface(
    { component: 'X', api: {} },
    [{ name: 'style', form: 'platform', type: 'React.CSSProperties', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /R4/);
  assert.match(problems[0], /React\.CSSProperties/);
});

test('a union between forms is reported as an R5 violation', () => {
  const problems = compareSurface(
    { component: 'X', api: {} },
    [{ name: 'tabs', form: 'union', parts: ['string', 'TabItem'], required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /R5/);
});

test('an event payload that is a platform type is an R4 violation of its own', () => {
  const problems = compareSurface(
    { component: 'X', api: { navigate: { form: 'event', payload: 'Crumb' } } },
    [{ name: 'navigate', form: 'event', payload: 'MouseEvent', platformPayload: true, required: false }],
    'angular',
  );
  assert.ok(problems.some((p) => /R4/.test(p) && /MouseEvent/.test(p)));
});

/* 3 — agreement */

test('a layer declaring exactly the contract agrees, in both idioms', () => {
  const angular = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  assert.deepEqual(compareSurface(CONTRACT, angular, 'angular'), []);

  const react = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'onNavigate', form: 'event', payload: 'Crumb', required: false },
  ];
  assert.deepEqual(compareSurface(CONTRACT, react, 'react'), []);
});

test('a member the contract does not name fails, even when it looks harmless', () => {
  const members = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
    { name: 'compact', form: 'primitive', type: 'boolean', required: false },
  ];
  const problems = compareSurface(CONTRACT, members, 'angular');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /compact/);
  assert.match(problems[0], /does not name/);
});

test('an OPTIONAL member a layer omits still fails -- required governs the consumer, never the layer', () => {
  const members = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  const problems = compareSurface(CONTRACT, members, 'angular');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /separator/);
  assert.match(problems[0], /does not declare/);
});

test('the same name in the wrong form fails', () => {
  const members = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'slot', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  const problems = compareSurface(CONTRACT, members, 'angular');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /separator/);
  assert.match(problems[0], /slot/);
  assert.match(problems[0], /primitive/);
});

test('an array of the wrong element type fails', () => {
  const members = [
    { name: 'items', form: 'array', of: 'string', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  assert.ok(compareSurface(CONTRACT, members, 'angular').some((p) => /items/.test(p)));
});

/* 4 — the derived rules, on the type side */

test('R1: a predefined object may not carry a slot or an event field', () => {
  const problems = validateTypes([{
    name: 'Crumb', kind: 'object',
    fields: { label: { form: 'primitive', type: 'string' }, onClick: { form: 'event' } },
  }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /R1/);
  assert.match(problems[0], /onClick/);
});

test('a contract naming a type nobody declared fails', () => {
  const problems = validateContract(
    { component: 'X', api: { items: { form: 'array', of: 'Widget' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /Widget/.test(p)));
});

test('a contract member with a form outside the six encoded values fails', () => {
  const problems = validateContract(
    { component: 'X', api: { thing: { form: 'callback' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /callback/.test(p)));
});

test('an enum member must name a declared enum, not a declared object', () => {
  const problems = validateContract(
    { component: 'X', api: { tone: { form: 'enum', type: 'Crumb' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /Crumb/.test(p)));
});

/* 5 — generated drift */

test('the committed generated modules are what api/types/ generates', () => {
  for (const [path, expected] of buildApiModules()) {
    assert.equal(readFileSync(join(root, path), 'utf8'), expected, `${path} is stale — run bun run build:api`);
  }
});

/* the loud failure */

test('a member shape the reader cannot read throws rather than reporting no members', () => {
  const src = 'export interface XProps { weird: { [k: string]: unknown }; }';
  assert.throws(() => reactSurface(src, 'XProps'), UnrecognisedShape);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/check-api.test.mjs`
Expected: FAIL — `Cannot find module './check-api.mjs'`.

- [ ] **Step 3: Write the gate**

Create `scripts/check-api.mjs`:

```js
/* check:api — Arena's third contract, the API capability contract.
 *
 * api/components/<Name>.json states, once and neutrally, the members that
 * component's API presents. Every layer implementing it implements exactly
 * those members -- same name, same form, not fewer and not more. This gate
 * makes five assertions:
 *
 *   1. COVERAGE.        Every contract names a component at least one layer
 *                       implements. The contract's existence IS the coverage
 *                       claim, so no separate record can go stale against it.
 *   2. FORM.            No member uses anything outside the seven forms.
 *   3. AGREEMENT.       Every implementing layer declares exactly the contract's
 *                       members. An OPTIONAL member is still a declared member:
 *                       `required: false` governs whether a CONSUMER must supply
 *                       it, never whether a LAYER must offer it.
 *   4. DERIVED RULES.   R1, R4 and R5, against the declared types.
 *   5. GENERATED DRIFT. The committed api.generated.* match api/types/.
 *
 * THERE IS NO EXCEPTION MAP, and that is not an oversight. Every other record in
 * this repository -- EXEMPT, EXCLUDED, COVERED -- exists because the thing it
 * excuses is a difference someone may reasonably want. An API divergence is a
 * defect; a place to write one down is the whole thing this layer removes.
 *
 * TWO OF THE FIVE RULES ARE NOT ASSERTED HERE, and pretending otherwise would be
 * worse than saying so. R2 ("who draws decides data versus slot") is a fact about
 * markup ownership, and R3 ("a parameterised slot fills, never replaces") is a
 * fact about the rendered tree. Neither is visible in a member list. They are
 * authoring rules the audit protocol applies, recorded in api/README.md and in
 * CLAUDE.md's Known debt. A green run means R1, R4 and R5 hold.
 *
 * COVERAGE IS PARTIAL BY DESIGN and grows one component at a time, the same
 * charter COVERED carries in check-compliance.mjs. This gate never demands
 * totality -- only that every contract in the directory is true of every layer
 * implementing it. A green run is a claim about the contracted components and
 * says nothing about the rest, and -- being orthogonal to behaviour -- nothing
 * about what any of them does either.
 *
 *   bun scripts/check-api.mjs   -> exit 0 if every contract holds, 1 otherwise
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildApiModules } from './build-api-types.mjs';
import { reactSurface, angularSurface, UnrecognisedShape } from './lib/api-surface.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The six encoded `form` values. `array` covers both array forms, discriminated
 *  by `of` -- a representation choice, not a narrowing of the vocabulary. */
const FORMS = new Set(['primitive', 'enum', 'object', 'array', 'slot', 'event']);
const PRIMITIVE_TYPES = new Set(['string', 'number', 'boolean']);

/** React groups, the same list check-behaviour.mjs walks. */
const REACT_GROUPS = ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation'];

/** "AppLogo" -> "app-logo". Pascal -> kebab is safe in this direction and only
 *  this one; the inverse is not, which is why an Angular behaviour binding names
 *  its React counterpart rather than deriving it. */
export function kebab(pascal) {
  return pascal.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** A contract member's name as one layer binds it. The contract governs the
 *  member surface, never the syntax a platform expresses it in. See the binding
 *  table in api/README.md -- this function IS that table. */
export function bindingName(name, form, layer) {
  if (layer !== 'react') return name;
  if (form === 'slot') return name === 'content' ? 'children' : name;
  if (form === 'event') return `on${name[0].toUpperCase()}${name.slice(1)}`;
  return name;
}

/** @returns {string[]} problems */
export function validateTypes(types) {
  const problems = [];
  const seen = new Set();
  for (const type of types) {
    if (!type.name) { problems.push('api/types: a type has no name'); continue; }
    if (seen.has(type.name)) problems.push(`${type.name}: declared twice`);
    seen.add(type.name);
    if (type.kind === 'enum') {
      if (!Array.isArray(type.values) || !type.values.length) {
        problems.push(`${type.name}: an enum is a closed set and this declares no values`);
      }
      continue;
    }
    if (type.kind !== 'object') { problems.push(`${type.name}: unknown kind "${type.kind}"`); continue; }
    for (const [field, spec] of Object.entries(type.fields ?? {})) {
      if (spec.form === 'primitive') {
        if (!PRIMITIVE_TYPES.has(spec.type)) problems.push(`${type.name}.${field}: "${spec.type}" is not a primitive`);
      } else if (spec.form !== 'enum') {
        problems.push(`${type.name}.${field}: form "${spec.form}" is not allowed inside a predefined object — R1, an object is pure data`);
      }
    }
  }
  return problems;
}

/** @param {Map<string,'enum'|'object'>} typeNames @returns {string[]} problems */
export function validateContract(contract, typeNames) {
  const problems = [];
  const where = contract.component ?? '(unnamed)';
  const declared = (name, kind) => {
    if (!typeNames.has(name)) return `${where}: names type "${name}", which api/types/ does not declare`;
    if (typeNames.get(name) !== kind) return `${where}: "${name}" is a ${typeNames.get(name)}, used where a ${kind} belongs`;
    return null;
  };
  for (const [member, spec] of Object.entries(contract.api ?? {})) {
    if (!FORMS.has(spec.form)) {
      problems.push(`${where}.${member}: form "${spec.form}" is none of the seven — see api/README.md`);
      continue;
    }
    if (spec.form === 'primitive' && !PRIMITIVE_TYPES.has(spec.type)) {
      problems.push(`${where}.${member}: "${spec.type}" is not a primitive`);
    }
    if (spec.form === 'enum') problems.push(...[declared(spec.type, 'enum')].filter(Boolean));
    if (spec.form === 'object') problems.push(...[declared(spec.type, 'object')].filter(Boolean));
    if (spec.form === 'array' && !PRIMITIVE_TYPES.has(spec.of)) {
      problems.push(...[declared(spec.of, 'object')].filter(Boolean));
    }
    if (spec.form === 'event' && spec.payload) {
      problems.push(...[declared(spec.payload, 'object')].filter(Boolean));
    }
    for (const [param, type] of Object.entries(spec.params ?? {})) {
      if (PRIMITIVE_TYPES.has(type)) continue;
      if (!typeNames.has(type)) problems.push(`${where}.${member}: slot parameter "${param}" names undeclared type "${type}"`);
    }
  }
  return problems;
}

/** Assertions 2, 3 and the layer half of 4, for one layer of one component.
 *  @returns {string[]} problems */
export function compareSurface(contract, members, layer) {
  const problems = [];
  const where = `${layer}/${contract.component}`;

  const expected = new Map();
  for (const [name, spec] of Object.entries(contract.api ?? {})) {
    expected.set(bindingName(name, spec.form, layer), { member: name, ...spec });
  }

  const seen = new Set();
  for (const m of members) {
    if (m.form === 'platform') {
      problems.push(`${where}.${m.name}: "${m.type}" is a platform type and none of the seven forms — R4`);
      continue;
    }
    if (m.form === 'union') {
      problems.push(`${where}.${m.name}: a union between forms (${m.parts.join(' | ')}) — R5, a member is one form`);
      continue;
    }
    if (m.platformPayload) {
      problems.push(`${where}.${m.name}: the event payload "${m.payload}" is a platform type — R4`);
      continue;
    }
    const spec = expected.get(m.name);
    if (!spec) {
      problems.push(`${where}.${m.name}: declared, but the contract does not name it — add it to the contract or remove it from the layer`);
      continue;
    }
    seen.add(m.name);
    /* A `named` form is the reader saying "an identifier I cannot resolve".
     * It matches an enum or an object member; the contract's own type name is
     * what decides which, and validateContract already proved that name is
     * declared and of the right kind. */
    const form = m.form === 'named' ? spec.form : m.form;
    if (form !== spec.form) {
      problems.push(`${where}.${m.name}: declared as ${m.form}, contract says ${spec.form}`);
      continue;
    }
    if (spec.form === 'array' && m.of !== spec.of) {
      problems.push(`${where}.${m.name}: array of ${m.of}, contract says array of ${spec.of}`);
    }
    if (spec.form === 'event' && (m.payload ?? null) !== (spec.payload ?? null)) {
      problems.push(`${where}.${m.name}: payload ${m.payload ?? 'none'}, contract says ${spec.payload ?? 'none'}`);
    }
    if ((spec.form === 'enum' || spec.form === 'object') && m.type && m.type !== spec.type) {
      problems.push(`${where}.${m.name}: typed ${m.type}, contract says ${spec.type}`);
    }
  }

  for (const [bound, spec] of expected) {
    if (seen.has(bound)) continue;
    problems.push(`${where}: does not declare "${bound}" (contract member "${spec.member}", ${spec.form})`
      + (spec.required === false ? ' — an optional member is still a declared member' : ''));
  }
  return problems;
}

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

function reactPath(component) {
  for (const group of REACT_GROUPS) {
    const path = join(root, 'frameworks/react/components', group, `${component}.d.ts`);
    if (existsSync(path)) return path;
  }
  return null;
}

function angularPath(component) {
  const dir = kebab(component);
  const path = join(root, 'frameworks/angular/primitives', dir, `${dir}.ts`);
  return existsSync(path) ? path : null;
}

function main() {
  const problems = [];

  /* 5. Generated drift, first: every later assertion reads type names, and a
   *    stale module means the layers are typed against something else. */
  for (const [path, expected] of buildApiModules()) {
    let actual;
    try { actual = readFileSync(join(root, path), 'utf8'); }
    catch { problems.push(`${path}: missing — run bun run build:api`); continue; }
    if (actual !== expected) problems.push(`${path}: stale — run bun run build:api`);
  }

  /* 4a. The type declarations themselves, R1 included. */
  const typeDir = join(root, 'api/types');
  const types = readdirSync(typeDir).filter((f) => f.endsWith('.json')).sort().map((f) => read(join(typeDir, f)));
  problems.push(...validateTypes(types));
  const typeNames = new Map(types.map((t) => [t.name, t.kind]));

  const contractDir = join(root, 'api/components');
  const files = existsSync(contractDir) ? readdirSync(contractDir).filter((f) => f.endsWith('.json')).sort() : [];
  let layersChecked = 0;

  for (const file of files) {
    const contract = read(join(contractDir, file));
    problems.push(...validateContract(contract, typeNames));

    /* 1. Coverage, resolved structurally rather than from a list. */
    const react = reactPath(contract.component);
    const angular = angularPath(contract.component);
    if (!react && !angular) {
      problems.push(`${file}: names component "${contract.component}", which no layer implements`);
      continue;
    }

    /* 2, 3, 4b. Each implementing layer, and only those: a component in one
     *           layer only is absence, not divergence. */
    for (const [layer, path, readSurface, symbol] of [
      ['react', react, reactSurface, `${contract.component}Props`],
      ['angular', angular, angularSurface, contract.component],
    ]) {
      if (!path) continue;
      layersChecked += 1;
      let surface;
      try {
        surface = readSurface(readFileSync(path, 'utf8'), symbol);
      } catch (error) {
        if (!(error instanceof UnrecognisedShape)) throw error;
        problems.push(`${layer}/${contract.component}: the reader could not read this surface — ${error.message}`);
        continue;
      }
      for (const base of surface.heritage ?? []) {
        problems.push(`${layer}/${contract.component}: extends "${base}" — the {...rest} escape is none of the seven forms, R4`);
      }
      problems.push(...compareSurface(contract, surface.members, layer));
    }
  }

  if (problems.length) {
    console.error(`check-api: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-api: ${files.length} contract(s) hold across ${layersChecked} layer implementation(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the tests**

Run: `bun test scripts/check-api.test.mjs`
Expected: PASS, 16 tests.

- [ ] **Step 5: Add the script and run the gate on the real tree**

In `package.json`, add `"check:api": "bun scripts/check-api.mjs",` immediately after the
`"check:compliance"` line.

Run: `bun run check:api`
Expected: `check-api: 0 contract(s) hold across 0 layer implementation(s)`, exit 0.
`api/components/` does not exist yet; the gate treats that as no contracts, which is the
partial-coverage charter working as intended.

- [ ] **Step 6: Wire it into `check-all`**

In `scripts/check-all.mjs`, change the header line
`* The twenty gates in GATES below, plus the test suite: one more step under`
to `* The twenty-one gates in GATES below, plus the test suite: one more step under`,
and insert into `GATES` immediately after the `check:compliance` entry:

```js
  { name: 'check:api', file: 'check-api.mjs' },
```

In `scripts/check-all.test.mjs`, update the first test:

```js
test('GATES lists the twenty-one check gates', () => {
  assert.equal(GATES.length, 21);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:dtcg', 'check:tokens', 'check:script-tokens', 'check:duplicate-constants', 'check:ramp', 'check:tailwind', 'check:tailwind-generated', 'check:coverage', 'check:radius', 'check:arbitrary', 'check:dimensions', 'check:states', 'check:behaviour', 'check:compliance', 'check:api', 'check:fonts', 'check:vendor', 'check:demos', 'check:cards', 'check:angular', 'check:material'],
  );
});
```

Leave the `check:material runs last` test alone — it still holds.

- [ ] **Step 7: Run the check-all suite**

Run: `bun test scripts/check-all.test.mjs`
Expected: PASS. If the deepEqual fails, the inserted position and the literal list
disagree — fix the list, not the gate order.

- [ ] **Step 8: Record what the gate cannot assert**

In `CLAUDE.md`, add to *Known debt* (before the `### Where the rest of the debt lives`
heading):

```markdown
- **`check:api` asserts three of its five rules, not five.** R1 (an object is pure
  data) is enforced by the type schema, R4 (no platform types) by the reader
  recognising them by name, and R5 (no unions between forms) by a member carrying
  exactly one form. **R2 and R3 are not machine-checkable and nothing checks
  them.** R2 — "who draws decides data versus slot" — is a fact about markup
  ownership, and a contract naming a slot for content Arena actually draws passes
  the gate. R3 — "a parameterised slot fills, never replaces" — is a fact about the
  rendered tree; `check:compliance` is the only layer that can see a rendered tree,
  and it does not read contracts. Both are authoring rules the audit protocol
  applies, which means they are exactly as strong as the audit that applied them.
  `Table.render` in plan C is where R3 first matters, and it will matter with no
  gate behind it.
```

- [ ] **Step 9: Commit**

```bash
git add scripts/check-api.mjs scripts/check-api.test.mjs scripts/check-all.mjs \
  scripts/check-all.test.mjs package.json CLAUDE.md
git commit -m "feat(api): check:api, the twenty-first gate"
```

---

## Task 5: AppLogo

Exercises **slot**, **enum**, **primitive**, and R4.

**Files:**
- Create: `api/components/AppLogo.json`
- Modify: `frameworks/react/components/brand/AppLogo.{jsx,d.ts,prompt.md}`
- Modify: `frameworks/angular/primitives/app-logo/{app-logo.ts,app-logo.prompt.md}`
  (and `app-logo.variants.ts` / `frameworks/tailwind/components/AppLogo.manifest.json`
  **only if the mark slot moves**)
- Modify: `frameworks/react/components/brand/brand.card.entry.jsx`
- Modify: `frameworks/react/ui_kits/console/Shell.jsx`,
  `frameworks/react/ui_kits/console/LoginScreen.jsx`
- Modify: `frameworks/react/test/app-logo.test.jsx`
- Modify: `components-divergences.md` (the API paragraphs of the `AppLogo` entry, lines
  ~914–948)
- Regenerate: the compiled `.js` siblings via `bun run build:demos`

**Interfaces:**
- Consumes: `LogoSize`, `Orientation` from `frameworks/{react,angular}/api.generated.*`
  (Task 2); `check:api` (Task 4).
- Produces: `api/components/AppLogo.json`, the first contract in the tree — after this task
  `check:api` reports 1 contract across 2 layers.

- [ ] **Step 1: Present the audit and STOP**

Do not write a line of code before the maintainer answers. Present exactly this, and wait.

**Current API — React** (`AppLogo.d.ts`, `AppLogo.jsx`)

| Member | Declared as | Form |
|---|---|---|
| *(heritage)* | `extends React.HTMLAttributes<HTMLSpanElement>` | the `{...rest}` escape |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | enum |
| `orientation` | `'horizontal' \| 'vertical'` | enum |
| `mark` | `React.ReactNode`, required | slot |
| `name` | `React.ReactNode`, required | slot |
| `dim` | `React.ReactNode` | slot |
| `style` | `React.CSSProperties` | — |

**Current API — Angular** (`app-logo.ts`)

| Member | Declared as | Form |
|---|---|---|
| `name` | `input.required<string>()` | primitive, required |
| `dim` | `input<string>()` | primitive |
| `size` | `input<Size>('md')` | enum |
| `orientation` | `input<Orientation>('horizontal')` | enum |
| *(the mark)* | a bare `<ng-content />` | the **default** slot, which the contract names `content` |

**What breaks which rule**

1. **R4** — React's `style: React.CSSProperties`. `components-divergences.md:914`'s
   *"Also not ported"* paragraph already records that Angular never took it, because in
   Angular a consumer writes it on the host directly. Removing it from React is not a
   capability loss Angular has not already absorbed.
2. **R4** — React's `extends React.HTMLAttributes<HTMLSpanElement>`, i.e. the `{...rest}`
   spread. Same paragraph, same reasoning.
3. **No rule; a divergence, and one that is in no document at all** — `name` and `dim` are
   `React.ReactNode` in React and `string` in Angular. One of the two is wrong. **R2 has a
   view**: Arena draws the wordmark — it owns the `<span>`, the display font, the black
   weight, the tight tracking, the uppercase transform and the `--mute` ink of `dim`. By
   R2's test, content Arena draws is data, so these are primitives, not slots. React is the
   one that is wrong.
4. **No rule; a divergence in how the same slot is expressed** — React names the mark
   member `mark`; Angular's is the bare default slot. Under the binding table a bare
   `<ng-content />` binds the member named `content`, so as they stand the two layers name
   different members. This is the decision below.

**Reshape A — the mark becomes the default slot `content`**

- Contract: `content` (slot), `name` (primitive string, required), `dim` (primitive
  string), `size` (enum `LogoSize`), `orientation` (enum `Orientation`).
- React: drops the `mark` prop and reads `children`; the
  `React.cloneElement(mark, {style: {display:'block',width:'100%',height:'100%'}})` fill
  becomes `React.cloneElement(React.Children.only(children), …)`; the
  `if (!mark || !name) return null` guard becomes a `children`/`name` guard. `name`/`dim`
  narrow to `string`. `style` and `{...rest}` go.
- Angular: **unchanged** — its template already is a bare `<ng-content />`.
- Cost: 8 React call sites move `mark={…}` into children — `brand.card.entry.jsx` (6),
  `Shell.jsx` (1), `LoginScreen.jsx` (1). `app-logo.test.jsx` rewrites: the three
  "renders nothing" tests and the two clone tests all pass the mark. Angular's
  `prompt.md` and manifest need no edit.

**Reshape B — the mark stays the named slot `mark`**

- Contract: `mark` (slot) instead of `content`; everything else as in A.
- React: keeps the `mark` prop exactly as it is. Only `name`/`dim`/`style`/`{...rest}`
  change.
- Angular: template becomes `<ng-content select="[mark]" />`, and a consumer writes
  `<arena-app-logo name="Draven"><img mark src="…" alt="" /></arena-app-logo>`.
- Cost: no React call site moves; `app-logo.test.jsx` keeps its clone tests. Angular's
  `prompt.md` code samples change and the documented call shape changes — but no Angular
  consumer exists in this repository, so the churn is documentation only. The
  `*:block *:w-full *:h-full` child variants in `AppLogo.manifest.json` keep working
  either way.

**Reshape C — `name` and `dim` stay slots on both layers**

- Contract: `name` and `dim` become slots; the mark as in A or B.
- Angular: `<ng-content select="[name]" />` and `<ng-content select="[dim]" />`; the
  `input.required<string>()` on `name` disappears, and with it the compile-time guarantee
  that a caller supplied one.
- Cost: this is the reshape R2 argues against — the wordmark's markup, font, tracking and
  uppercase transform are Arena's, and moving the text into a slot puts it outside what
  `check:compliance` could ever judge. Recorded here for completeness rather than
  recommended.

**Recommendation to weigh, not to assume:** A or B on the mark (R2 does not decide between
them — the consumer draws the mark either way), and A/B's primitive `name`/`dim` over C
(R2 does decide that one).

**Question for the maintainer:** which reshape, and — if A or B — is there anything else
about the lock-up's surface to settle in the same pass?

- [ ] **Step 2: Write the contract**

Create `api/components/AppLogo.json`. Below is the shape for **Reshape A**; adjust the mark
member's name to `mark` for Reshape B, and the `name`/`dim` forms for C.

```json
{
  "component": "AppLogo",
  "description": "Brand lock-up: a mark beside or above a product name.",
  "api": {
    "content": { "form": "slot",
                 "description": "The mark, as an asset the consumer supplies. Required: Arena ships MIT and a default would ship Dravensoft's trademark to whoever never read the API. The slot sizes the mark; a mark that brings its own dimensions fights the lock-up." },
    "name": { "form": "primitive", "type": "string", "required": true,
              "description": "The product name, or its first half when `dim` carries the second." },
    "dim": { "form": "primitive", "type": "string",
             "description": "The wordmark's second half, drawn muted. Present for the manual's Primary variant, absent for Monochrome — which is why there is no `variant` member: the mark's ink and this are the same two decisions." },
    "size": { "form": "enum", "type": "LogoSize", "default": "md",
              "description": "Both halves at once — the mark's slot and the wordmark." },
    "orientation": { "form": "enum", "type": "Orientation", "default": "horizontal",
                     "description": "Mark beside the name, or above it." }
  }
}
```

- [ ] **Step 3: Run the gate and watch it fail**

Run: `bun run check:api`
Expected: FAIL, naming React's `style` and its heritage as R4 violations, React's `name`
and `dim` as slots where the contract says primitive, and (Reshape A) React declaring
`mark` where the contract names `children`. Read every line — this is the list Step 4
works through.

- [ ] **Step 4: Migrate React**

Rewrite `frameworks/react/components/brand/AppLogo.d.ts` (Reshape A):

```ts
import * as React from 'react';
import type { LogoSize, Orientation } from '../../api.generated';
/** Brand lock-up — a mark paired with a product name.
 *
 *  The mark and `name` are required on purpose: Arena ships MIT and a consumer
 *  copies this tree, so a default would ship Dravensoft's trademark to whoever
 *  never read the API. Without both, the component renders nothing.
 * @startingPoint section="Brand" subtitle="Lock-up — mark and product name" viewport="780x560" */
export interface AppLogoProps {
  /** The mark as an asset — `<img src=".../rotor-crimson.svg" alt="" />`. Passed
   *  as children rather than drawn so the call site names which brand it renders. */
  children: React.ReactNode;
  /** Required. The product name, or its first half when `dim` carries the second. */
  name: string;
  /** The wordmark's second half, rendered in `--mute`. Present for the manual's
   *  Primary variant, absent for Monochrome — which is why there is no `variant`
   *  member: the mark's ink and this are the same two decisions. */
  dim?: string;
  /** Both halves of the lock-up at once — the mark's slot and the wordmark's
   *  size. A fixed repertoire, not a ratio: `sm` an application frame, `md` a
   *  signed-out panel, `lg` the manual's Primary, `xl` the hero case. */
  size?: LogoSize;
  orientation?: Orientation;
}
export function AppLogo(props: AppLogoProps): JSX.Element | null;
```

In `AppLogo.jsx`: change the signature to
`export function AppLogo({ size = 'md', orientation = 'horizontal', children, name, dim })`,
the guard to `if (!children || !name) return null;`, the fill to operate on
`React.Children.only(children)` when it is a valid element, and drop `...style` from the
outer `<span>` and `{...rest}` from it. The comment block at the top of the file that
explains why the slot sizes the mark stays, with `mark` reworded to "the projected mark".

- [ ] **Step 5: Update the React call sites and tests**

- `brand.card.entry.jsx`: `<AppLogo size="xl" mark={CRIMSON} name="Draven" dim="soft"/>`
  becomes `<AppLogo size="xl" name="Draven" dim="soft">{CRIMSON}</AppLogo>`, for all six.
- `Shell.jsx:22` and `LoginScreen.jsx:13`: same move.
- `frameworks/react/test/app-logo.test.jsx`: `<AppLogo name="Draven" />` (no children)
  stays as the "renders nothing without a mark" case; `<AppLogo mark={MARK} />` becomes
  `<AppLogo>{MARK}</AppLogo>`; every other case moves `mark={MARK}` into children. The
  "a non-element mark passes through untouched" case becomes `<AppLogo name="Draven">M</AppLogo>`.

Run: `bun run test:react`
Expected: PASS — the whole React suite, `app-logo.test.jsx` included.

- [ ] **Step 6: Migrate Angular**

For Reshape A: `app-logo.ts` needs no structural change, but replace its local
`type Size` / `type Orientation` aliases with
`import type { LogoSize, Orientation } from '../../api.generated';` and use `LogoSize` on
the `size` input, so both layers name the same type. Update `app-logo.prompt.md` only if
the call shape changed (it does for Reshape B).

Run: `bun run check:angular && bun run test:angular`
Expected: both PASS.

- [ ] **Step 7: Run the gate and watch it pass**

Run: `bun run check:api`
Expected: `check-api: 1 contract(s) hold across 2 layer implementation(s)`.

- [ ] **Step 8: Rebuild the demos and check the behaviour layer**

Run: `bun run build:demos && bun run check:demos && bun run check:behaviour && bun run check:compliance`
Expected: all PASS.

`AppLogo` binds pattern `none` in both layers with no exceptions, and moving the mark from
a prop to children does not change the rendered DOM — the same `<span>` wraps the same
node. If the rendered tree *did* change, the binding is re-read and corrected in this same
commit rather than left to rot. Neither layer's `AppLogo` is in `COVERED`, so
`check:compliance` has nothing to re-verify here; that is a gap, not a pass.

- [ ] **Step 9: Delete what the contract replaced in the divergences document**

In `components-divergences.md`, the `### AppLogo — the mark is a prop in React, projected
content in Angular` entry (≈914–948) is **entirely an API divergence** now settled by the
contract: the mark's expression, the `style`/`{...rest}` paragraph, and the `!mark || !name`
guard paragraph. Delete the whole section.

The one thing in it that is **not** API and must survive: Angular reaches projected content
with the `*:block *:w-full *:h-full` child variants in `AppLogo.manifest.json` because it
has no `React.cloneElement`. Move that sentence into `AppLogo.manifest.json`'s neighbours
as a comment? No — manifests are JSON with no comment syntax. Put it in
`frameworks/angular/primitives/app-logo/app-logo.prompt.md`, under Do/Don't, as one line:
*"The slot stretches the projected mark with child variants (`*:block *:w-full *:h-full`)
rather than reaching into the node — Angular has no `cloneElement`, and the CSS descendant
combinator reaches the same result through the platform's own idiom."*

Confirm no binding cited the deleted section:

Run: `grep -rn 'AppLogo' --include='*.behaviour.json' --include='*.ts' frameworks/ | grep -i divergen`
Expected: no output. (The three known citations are `command-palette.behaviour.json`, the
`SideNav` delegated entry and `onboarding.ts` — none of them names this section.)

- [ ] **Step 10: Commit**

```bash
git add api/components/AppLogo.json \
  frameworks/react/components/brand frameworks/react/ui_kits/console \
  frameworks/react/test/app-logo.test.jsx \
  frameworks/angular/primitives/app-logo components-divergences.md
git commit -m "feat(api): AppLogo under contract — the mark is one slot, the wordmark is data"
```

---

## Task 6: Breadcrumbs

Exercises **array of predefined objects**, **event with payload**, **primitive**, R1 and R5.

**Files:**
- Create: `api/types/crumb.json`
- Create: `api/components/Breadcrumbs.json`
- Modify: `frameworks/react/components/navigation/Breadcrumbs.{jsx,d.ts,prompt.md}`
- Modify: `frameworks/angular/primitives/breadcrumbs/{breadcrumbs.ts,breadcrumbs.prompt.md}`
- Modify: `frameworks/react/components/navigation/navigation.card.entry.jsx`
- Modify: `components-divergences.md` (the `Breadcrumbs` entry, ≈1035–1057)
- Regenerate: `frameworks/{react,angular}/api.generated.*` via `bun run build:api`; the
  compiled `.js` siblings via `bun run build:demos`

**Interfaces:**
- Consumes: everything Tasks 2–4 produced.
- Produces: the `Crumb` type, and the tree's first **array of predefined objects** and
  first **event** under contract.

- [ ] **Step 1: Present the audit and STOP**

**Current API — React** (`Breadcrumbs.d.ts`, `Breadcrumbs.jsx`)

| Member | Declared as | Form |
|---|---|---|
| `items` | `Crumb[]` where `Crumb { label: string; href?: string; onClick?: (e: React.MouseEvent) => void }` | array of objects |
| `separator` | `React.ReactNode` | slot |
| `style` | `React.CSSProperties` | — |

**Current API — Angular** (`breadcrumbs.ts`)

| Member | Declared as | Form |
|---|---|---|
| `items` | `input<ArenaCrumb[]>([])` where `ArenaCrumb { label: string; href?: string }` | array of objects |
| `separator` | `input('/')` | primitive string |
| `navigate` | `output<ArenaCrumbNavigateEvent>()` where `{ crumb: ArenaCrumb; event: MouseEvent }` | event |

**What breaks which rule**

1. **R1** — `Crumb.onClick` is a function field inside a predefined object. The spec calls
   this "the cleanest R1 violation on the tree", and the resolution is already proven on
   the Angular side: the callback leaves the object and becomes a component-level event.
2. **R4** — `Crumb.onClick`'s parameter is `React.MouseEvent`.
3. **R4** — React's `style`.
4. **R4** — Angular's `navigate` payload contains `event: MouseEvent`. `MouseEvent` is a
   platform type, so the payload object cannot be a predefined object under R1/R4 either.
5. **No rule; a divergence** — `separator` is a node slot in React and a primitive string
   in Angular. **R2 decides it**: Arena draws the separator, in its own `<span
   aria-hidden="true">` with its own mono font and `--line-strong` ink. It is data. The
   spec's own contract-format example already shows it as
   `{ "form": "primitive", "type": "string", "default": "/" }`.
6. **No rule; a divergence** — `items` is required in React and defaulted to `[]` in
   Angular. One of the two is the contract's `required`.

**Reshape A — the payload is `Crumb`, and the native event is not forwarded**

- Contract: `items` (array of `Crumb`), `separator` (primitive string, default `/`),
  `navigate` (event, payload `Crumb`). This is the spec's own example, verbatim.
- React: `Crumb` loses `onClick`; `BreadcrumbsProps` gains `onNavigate?: (crumb: Crumb) => void`
  (the binding table's React spelling of the `navigate` event); `separator` narrows to
  `string`; `style` goes. The `<a onClick={it.onClick}>` becomes
  `<a onClick={() => onNavigate?.(it)}>`.
- Angular: `ArenaCrumbNavigateEvent` is deleted and `navigate` becomes
  `output<Crumb>()`, emitting the crumb alone.
- **Cost, stated plainly:** an Angular consumer loses `event.preventDefault()`, which
  `breadcrumbs.ts`'s own doc comment and `components-divergences.md:1035` both name as the
  reason the event is forwarded — the way to substitute SPA routing. React's consumer loses
  it too (its handler no longer receives the DOM event). The anchors still navigate
  natively, so ctrl-click and open-in-new-tab keep working, but intercepting a plain click
  becomes impossible from either layer. This is the largest single capability loss in
  Plan A and it should be chosen knowingly, not defaulted into.

**Reshape B — the payload is `Crumb`, plus a `preventDefault` primitive**

- Contract: A, plus `preventNavigation` (primitive boolean, default `false`) — when true
  the component calls `preventDefault()` on the click before emitting.
- Cost: one extra member on both layers and a real behaviour change to declare in both
  `prompt.md`s. It restores the SPA-routing capability entirely inside the vocabulary,
  which A does not. It also adds an input neither layer has today, which is scope Plan A
  did not budget.

**Reshape C — `href` carries the intent and no event exists at all**

- Contract: `items` (array of `Crumb`), `separator` (primitive string). No `navigate`.
- Cost: the component becomes purely declarative; a consumer routes by intercepting at the
  router level, as most SPA routers already do for in-app anchors. **But it removes the
  only **event** member Plan A has**, and A.4 chose three components precisely so six of the
  seven forms are exercised on the day the gate ships. Choosing C means the event form is
  unexercised until Plan B. Recorded so the cost is visible, not recommended.

**Also to decide, whichever reshape wins:** is `items` `required: true` (React's shape) or
optional with a default (Angular's)? A trail with no crumbs renders an empty `<nav>` in
both layers today, so either is implementable; the contract must pick one and both layers
follow it.

**Question for the maintainer:** which reshape, and required-or-optional `items`?

- [ ] **Step 2: Declare the `Crumb` type**

Create `api/types/crumb.json`:

```json
{
  "name": "Crumb",
  "kind": "object",
  "description": "One entry in a breadcrumb trail. `href` is omitted for the current page, which is never rendered as a link.",
  "fields": {
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "What the crumb reads." },
    "href": { "form": "primitive", "type": "string",
              "description": "Where it goes. Absent on the last entry, the current location." }
  }
}
```

Run: `bun run build:api`
Expected: both generated modules rewritten, now carrying `export interface Crumb`.

- [ ] **Step 3: Write the contract**

Create `api/components/Breadcrumbs.json` (shown for **Reshape A**):

```json
{
  "component": "Breadcrumbs",
  "description": "A trail of ancestor locations ending at the current one. An explicit return path for hierarchies deeper than tabs.",
  "api": {
    "items": { "form": "array", "of": "Crumb", "required": true,
               "description": "The trail, root first. The last entry is the current location and is never a link." },
    "separator": { "form": "primitive", "type": "string", "default": "/",
                   "description": "Drawn between crumbs, never before the first. Arena draws it, in its own aria-hidden span." },
    "navigate": { "form": "event", "payload": "Crumb",
                  "description": "A non-current crumb was activated." }
  }
}
```

- [ ] **Step 4: Run the gate and watch it fail**

Run: `bun run check:api`
Expected: FAIL, naming React's `style` (R4), React's `separator` as a slot where the
contract says primitive, React declaring no `onNavigate`, and Angular's `navigate` payload
`ArenaCrumbNavigateEvent` where the contract says `Crumb` (plus the R4 line for its
`MouseEvent` field, once the reader resolves it). `Crumb.onClick` is gone from the type the
moment `api/types/crumb.json` is the authority — the gate reports it as React's `.d.ts`
declaring a local `Crumb` that shadows the generated one, so **delete React's local
`export interface Crumb`** and import it instead.

- [ ] **Step 5: Migrate React**

`frameworks/react/components/navigation/Breadcrumbs.d.ts`:

```ts
import type { Crumb } from '../../api.generated';
/** Breadcrumb navigation (H3). Return path in deep hierarchies; the last item is the current location. */
export type { Crumb };
export interface BreadcrumbsProps {
  /** The trail, root first. The last entry is the current location. */
  items: Crumb[];
  /** Drawn between crumbs, never before the first. */
  separator?: string;
  /** A non-current crumb was activated. The anchor's own navigation still
   *  fires — ctrl-click, middle-click and open-in-new-tab keep working. */
  onNavigate?: (crumb: Crumb) => void;
}
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element;
```

> `export type { Crumb }` re-exports the generated type so a consumer importing
> `Crumb` from the component's own `.d.ts` keeps working. The reader only reads the
> `BreadcrumbsProps` interface, so the re-export is invisible to the gate.

`Breadcrumbs.jsx`: signature becomes
`export function Breadcrumbs({ items = [], separator = '/', onNavigate })`; drop `...style`
from the `<nav>`; the anchor becomes
`<a href={it.href || '#'} onClick={() => onNavigate?.(it)} …>`.

- [ ] **Step 6: Migrate Angular**

`frameworks/angular/primitives/breadcrumbs/breadcrumbs.ts`: delete the local `ArenaCrumb`
and `ArenaCrumbNavigateEvent` interfaces, import `Crumb` from `'../../api.generated'`, and
change `navigate` to `output<Crumb>()` with `onCrumbClick(crumb: Crumb)` emitting the crumb
alone. The class doc comment's paragraph about forwarding the native event is now false —
rewrite it to say what the contract says, and record the consequence for a consumer.

`breadcrumbs.prompt.md`: update the `navigate` payload in every example.

Run: `bun run check:angular && bun run test:angular`
Expected: both PASS. `breadcrumbs-variants.test.ts` asserts on the recipe only and is
untouched by this change.

- [ ] **Step 7: Update the demo and run the gates**

`navigation.card.entry.jsx:19` passes no `onClick` and no `style`, so it needs no edit —
confirm by reading it rather than assuming.

Run: `bun run check:api && bun run build:demos && bun run check:demos`
Expected: `check-api: 2 contract(s) hold across 4 layer implementation(s)`, then both
build and check pass.

Run: `bun run check:behaviour && bun run check:compliance`
Expected: PASS. Both layers bind pattern `navigation` with the identical `roles.label`
exception, and this change touches neither the `<nav>` landmark nor its hardcoded
`aria-label` — so the exception is still true and stays. Confirm by reading the rendered
markup, not by assuming: a migration must not silently retire a behaviour exception.

- [ ] **Step 8: Delete what the contract replaced**

`### Breadcrumbs — a single `navigate` output replaces a per-item `onClick`` (≈1035–1057)
is entirely an API divergence and is now settled by the contract. Delete the whole section.

- [ ] **Step 9: Commit**

```bash
git add api/types/crumb.json api/components/Breadcrumbs.json \
  frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts \
  frameworks/react/components/navigation frameworks/angular/primitives/breadcrumbs \
  components-divergences.md
git commit -m "feat(api): Breadcrumbs under contract — the callback leaves the crumb and becomes an event"
```

---

## Task 7: StatCard

Exercises **predefined object**, **enum**, and R4.

**Files:**
- Create: `api/types/stat-delta.json` *(only if the audit keeps the object shape)*
- Create: `api/components/StatCard.json`
- Modify: `frameworks/react/components/display/StatCard.{jsx,d.ts,prompt.md}`
- Modify: `frameworks/angular/primitives/stat-card/{stat-card.ts,stat-card.prompt.md}`
- Modify: `frameworks/react/components/display/display.card.entry.jsx`
- Modify: `frameworks/react/ui_kits/console/DashboardScreen.jsx`
- Modify: `components-divergences.md` (the `StatCard` entry, ≈1058–1088)
- Regenerate: `api.generated.*` and the compiled `.js` siblings

**Interfaces:**
- Consumes: `Tone`, `DeltaTone`, `Direction` from Task 2.
- Produces: the tree's first **predefined object** member under contract — the form that,
  per A.4, would otherwise be unexercised by the gate on the day it ships.

- [ ] **Step 1: Present the audit and STOP**

**Current API — React** (`StatCard.d.ts`)

| Member | Declared as | Form |
|---|---|---|
| `label` | `string`, required | primitive |
| `value` | `string`, required | primitive |
| `tone` | the 7-value union | enum |
| `delta` | `StatDelta { value: string; direction: 'up'\|'down'; tone?: 'positive'\|'negative'\|'neutral' }` | object |
| `sub` | `string` | primitive |
| `icon` | `React.ReactNode` | slot |
| `style` | `React.CSSProperties` | — |

**Current API — Angular** (`stat-card.ts`)

| Member | Declared as | Form |
|---|---|---|
| `label` | `input('')` | primitive, optional |
| `value` | `input('')` | primitive, optional |
| `tone` | `input<Tone>('neutral')` | enum |
| `sub` | `input<string>()` | primitive |
| `icon` | `input<string>()` — a Phosphor class name | **primitive**, not a slot |
| `deltaValue` | `input<string>()` | primitive |
| `deltaTone` | `input<DeltaTone>('neutral')` | enum |
| `deltaDirection` | `input<Direction>('up')` | enum |

**What breaks which rule**

1. **R4** — React's `style`.
2. **No rule; the purest idiom divergence in the repository** — one `delta` object against
   three flat inputs. `components-divergences.md:1058` names the reason plainly: *"The
   actual reason is signal inputs."* The framework's idiom chose the API, which is exactly
   the failure this contract layer exists to end.
3. **No rule; a divergence** — `icon` is a node slot in React and a primitive class-name
   string in Angular. **R2 has a view and it points opposite ways in the two layers**:
   Angular draws the `<i [class]="glyph">` itself, so by R2 its `icon` is data; React lets
   the consumer draw the node, so by R2 its `icon` is a slot. R2 does not adjudicate — it
   describes what each layer *currently* does. The contract has to pick one and make the
   other layer follow.
4. **No rule; a divergence** — `label` and `value` are required in React and defaulted to
   `''` in Angular.
5. **A behavioural consequence of the split, recorded at `:1080`** — React renders an
   empty pill for a delta with a tone but no value (`{delta && …}`), Angular renders
   nothing (`@if (deltaValue(); as delta)`). Whichever shape wins, the two layers stop
   being able to differ on it, and the contract must say which behaviour is right.

**Reshape A — one `delta` object, React's shape**

- Contract: `label`, `value` (primitive string), `tone` (enum `Tone`), `delta` (object
  `StatDelta`), `sub` (primitive string), `icon` (slot **or** primitive — see below).
- `StatDelta` is declared in `api/types/stat-delta.json` with fields `value` (primitive
  string, required), `direction` (enum `Direction`, required) and `tone` (enum `DeltaTone`).
  All three fields are primitives or enums, so R1 holds.
- Angular gains `delta = input<StatDelta>()` and loses the three flat inputs. Its template
  reads `delta()?.value`, `delta()?.direction ?? 'up'`, `delta()?.tone ?? 'neutral'`, and
  `statCardStyles({ tone: tone(), deltaTone: delta()?.tone ?? 'neutral' })`.
- **Cost:** the recorded signal-input objection is real and is being overruled, not
  refuted — a consumer must hand a fresh object identity to change one field, and the
  per-field defaults (`'neutral'`, `'up'`) move from an input's own default into `??`
  fallbacks the component applies. `stat-card-variants.test.ts` asserts on the recipe only
  and does not change. The gating question (#5) is settled by gating on `delta.value`,
  matching Angular's current behaviour and fixing React's empty pill.

**Reshape B — three flat members, Angular's shape**

- Contract: `deltaValue` (primitive string), `deltaTone` (enum `DeltaTone`, default
  `neutral`), `deltaDirection` (enum `Direction`, default `up`). No `StatDelta` type.
- React drops the object and takes three props.
- **Cost:** React's call sites all rewrite —
  `delta={{value:'+12%',direction:'up',tone:'positive'}}` becomes three attributes, in
  `display.card.entry.jsx` ×4. And the larger cost: **Plan A loses its only exercise of the
  bare predefined-object form.** `Crumb` covers *array of* predefined objects; nothing else
  in Plan A covers a lone object member. A.4 chose three components rather than two
  precisely so no form ships unexercised, and B undoes that. Choosing B means either
  accepting the gap until Plan B or nominating a fourth component.

**Reshape C — one `delta` object, gated on the object, and defaults inside the type**

- As A, but the pill renders whenever `delta` is present (React's current behaviour), and
  `StatDelta.value` is optional.
- **Cost:** preserves React's empty-pill behaviour, which `:1080` describes as the one real
  behavioural difference the split introduces and calls negligible — *"a delta with no
  value to show is not a delta worth passing"*. Choosing C means writing that empty pill
  down as intended behaviour in both layers rather than fixing it.

**And, orthogonally, `icon`:**

- **(i) slot in both** — Angular gains `<ng-content select="[icon]" />` and drops
  `icon = input<string>()`; React unchanged. The consumer supplies the glyph; Arena keeps
  the `aria-hidden` wrapper, so nothing leaves the behaviour contract's reach.
- **(ii) primitive string in both** — React's `icon` becomes a Phosphor class name and
  React renders `<i className={icon} aria-hidden="true" />`; Angular unchanged. Arena draws
  the icon in both layers, which is the R2-consistent reading of what Angular does today.
- Neither layer's demos pass `icon` today (`display.card.entry.jsx` and `DashboardScreen`
  both omit it), so the call-site cost is near zero either way.

**Also to decide:** `label`/`value` required or optional.

**One cost that lands whichever reshape wins:** removing `style` breaks
`display.card.entry.jsx`, which passes `style={{flex:1}}` to four StatCards to make the row
compose. Each becomes `<div style={{flex:1}}><StatCard …/></div>`. `check:cards` measures
that page in a real browser at its declared `@dsCard` viewport, so the layout change must
be re-measured, not eyeballed.

**Question for the maintainer:** which delta reshape, which `icon` form, and required-or-
optional `label`/`value`?

- [ ] **Step 2: Declare `StatDelta` (Reshape A or C only)**

Create `api/types/stat-delta.json`:

```json
{
  "name": "StatDelta",
  "kind": "object",
  "description": "How a metric moved. Preformatted — StatCard never formats. The pill's colour says whether the change was GOOD, not which way it points, which is why direction and tone are separate fields.",
  "fields": {
    "value": { "form": "primitive", "type": "string", "required": true,
               "description": "Preformatted, e.g. \"+12%\" or \"-340ms\"." },
    "direction": { "form": "enum", "type": "Direction", "required": true,
                   "description": "Which way the number moved. Draws the arrow — nothing else." },
    "tone": { "form": "enum", "type": "DeltaTone",
              "description": "Whether that movement is GOOD. Defaults to neutral — an unlabelled delta claims nothing." }
  }
}
```

Run: `bun run build:api`
Expected: both modules rewritten with `export interface StatDelta`.

- [ ] **Step 3: Write the contract**

Create `api/components/StatCard.json` (shown for **Reshape A + icon (i)**):

```json
{
  "component": "StatCard",
  "description": "One metric on a card surface: a micro-label, the number, an optional delta pill and a sub-line.",
  "api": {
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "Short uppercase microlabel, two words at most." },
    "value": { "form": "primitive", "type": "string", "required": true,
               "description": "Preformatted, e.g. \"1,284\" or \"99.9%\". StatCard never formats." },
    "tone": { "form": "enum", "type": "Tone", "default": "neutral",
              "description": "What state the number IS in right now, as against how it moved. Badge's vocabulary." },
    "delta": { "form": "object", "type": "StatDelta",
               "description": "How the number moved. Absent renders no pill." },
    "sub": { "form": "primitive", "type": "string",
             "description": "Small muted line under the value — context, e.g. \"vs last week\"." },
    "icon": { "form": "slot",
              "description": "A small glyph beside the label, drawn muted. Arena renders the aria-hidden wrapper; the consumer supplies the glyph." }
  }
}
```

- [ ] **Step 4: Run the gate and watch it fail**

Run: `bun run check:api`
Expected: FAIL, naming React's `style` (R4) and Angular's `deltaValue`/`deltaTone`/
`deltaDirection` as members the contract does not name, plus Angular not declaring `delta`
and (for icon (i)) Angular's `icon` declared as primitive where the contract says slot.

- [ ] **Step 5: Migrate React**

`StatCard.d.ts`: delete the local `StatDelta` interface, import `StatDelta` and `Tone` from
`'../../api.generated'`, re-export `StatDelta` with `export type { StatDelta };` for
consumers, drop `style`. Keep the long `@startingPoint` prose on `tone` — it is the reason
the member exists.

`StatCard.jsx`: drop `style` and `...rest` from the signature and from the root `<div>`;
change the delta guard from `{delta && …}` to `{delta?.value && …}` (Reshape A) so both
layers gate on the same fact; keep `DELTA_TONES` and `VALUE_TONES` exactly as they are.

- [ ] **Step 6: Migrate Angular**

`stat-card.ts`: delete the local `Tone`/`DeltaTone`/`Direction` aliases and import them
from `'../../api.generated'` alongside `StatDelta`; replace the three flat inputs with
`readonly delta = input<StatDelta>();`; template reads
`@if (delta()?.value; as amount)`, the arrow from `delta()?.direction === 'down'`, and the
recipe from `statCardStyles({ tone: tone(), deltaTone: delta()?.tone ?? 'neutral' })`. For
icon (i), replace `readonly icon = input<string>()` with `<ng-content select="[icon]" />`
inside the existing `aria-hidden` span, and delete the input.

Rewrite the class doc comment: its current paragraph explains three separate inputs, which
no longer exist.

Run: `bun run check:angular && bun run test:angular`
Expected: both PASS. `stat-card-variants.test.ts` asserts on `statCardStyles` only and
needs no edit — confirm by running it, not by assuming.

- [ ] **Step 7: Update the call sites**

- `display.card.entry.jsx`: wrap each of the four StatCards in `<div style={{flex:1}}>` and
  delete `style={{flex:1}}` from the component. For icon (i) nothing else changes.
- `DashboardScreen.jsx:35` passes only `label`, `value` and `tone` — no edit needed;
  confirm by reading it.

Run: `bun run build:demos && bun run check:demos`
Expected: both PASS.

- [ ] **Step 8: Run the gates**

Run: `bun run check:api`
Expected: `check-api: 3 contract(s) hold across 6 layer implementation(s)`.

Run: `bun run check:behaviour && bun run check:compliance && bun run check:dimensions && bun run check:states`
Expected: all PASS. `StatCard` binds `none` in both layers with no exceptions; the icon
slot change (i) moves who supplies the glyph but not the `aria-hidden` wrapper Arena
renders, so the binding's *"even the delta arrow icon and the head icon are aria-hidden"*
reason stays true. Re-read it and confirm rather than assuming — a migration must not
silently retire a behaviour exception.

Run: `bun run check:cards`
Expected: PASS. This measures `display.card.html` at its declared viewport in a real
browser; the `<div style={{flex:1}}>` wrapper is a layout change and this is the only
thing that proves the card still fits. If Chromium is unavailable here the gate exits 2
and `check-all` marks it SKIP — in that case say so plainly rather than reporting the
layout verified.

- [ ] **Step 9: Delete what the contract replaced**

`### StatCard — `delta` is one object prop in React, three flat inputs in Angular`
(≈1058–1088) is **entirely** an API divergence, including its `**Converges:** no`
paragraph and the empty-pill note — the contract settles both. Delete the whole section,
per the spec's own instruction.

- [ ] **Step 10: Commit**

```bash
git add api/types/stat-delta.json api/components/StatCard.json \
  frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts \
  frameworks/react/components/display frameworks/react/ui_kits/console \
  frameworks/angular/primitives/stat-card components-divergences.md
git commit -m "feat(api): StatCard under contract — one delta, one shape, both layers"
```

---

## Task 8: Verification and the changelog

**Files:**
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything.
- Produces: the completion gate.

- [ ] **Step 1: Run the whole test suite**

Run: `bun run test`
Expected: PASS. The count is the pre-plan **763** plus whatever this plan added — this
plan adds 10 (`build-api-types.test.mjs`) + 19 (`api-surface.test.mjs`) + 16
(`check-api.test.mjs`) = 45 new tests, so expect ~808 across 66 files, in roughly 6s.
**A materially different total means a task added or removed tests without recording it.**
The seven `PLAN-E-SUSPENDED` tests stay suspended and are not in this count.

- [ ] **Step 2: Confirm the suspended blocks were never touched**

Run: `git diff main --stat -- scripts/check-card-viewports.test.mjs scripts/check-angular.test.mjs`
Expected: **no output.** Either file appearing here means a task edited a suspended block,
which this plan forbids outright — revert that hunk.

- [ ] **Step 3: Run the full check**

Run: `bun run check`
Expected: `check-all: all 24 step(s) passed` — 21 gates plus 3 test steps. If
`check:cards`, `check:vendor` or `check:demos` reports SKIP the run is INCOMPLETE, not
green; say which one and why rather than reporting success.

- [ ] **Step 4: Confirm the plan's scope held**

Run: `git diff main --stat -- tokens/ behaviour/ .claude-plugin/`
Expected: **no output.** Plan A's non-goals: it does not touch `tokens/` or
`behaviour/patterns/` and changes no published version or plugin manifest.

Run: `bun run check:api`
Expected: `check-api: 3 contract(s) hold across 6 layer implementation(s)`. Three contracts
is the whole of Plan A's coverage claim — 40 components remain uncontracted, and that is
the charter, not a shortfall.

- [ ] **Step 5: Write the changelog entry**

Under the existing `## [Unreleased]` → `### Added` in `CHANGELOG.md`, add:

```markdown
- **A third contract: the API capability contract.** `api/components/<Name>.json` states,
  once and neutrally, the members a component's API presents; every layer implementing it
  implements exactly those members, and an API divergence becomes a defect rather than a
  recorded difference. A member is one of seven forms — primitive, enum, predefined object,
  array of primitives, array of predefined objects, slot, event — governed by five derived
  rules, all normatively stated in `api/README.md`. Shared objects and enums are declared
  once in `api/types/` and emitted per layer by `bun run build:api` into the committed
  `frameworks/react/api.generated.d.ts` and `frameworks/angular/api.generated.ts`.
  `bun run check:api` is the twenty-first gate and carries **no exception map**: coverage
  is partial by design and grows one component at a time, but every contract in the
  directory must be true of every layer implementing it. `AppLogo`, `Breadcrumbs` and
  `StatCard` are the first three, migrated end to end in both layers; their entries in
  `components-divergences.md` are deleted, because the divergences no longer exist.
```

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: log the API capability contract under Unreleased"
```

---

## Notes for whoever executes this

**The audit steps are not a formality.** Tasks 5, 6 and 7 each begin with a step that
presents and then stops. The whole reason this contract layer exists is that `StatCard`
became an object in React and three flat inputs in Angular because each layer answered the
question separately and each answer was defensible on its own terms. An implementer who
picks a reshape because it looked obvious has reproduced the exact failure, one level up.
If the maintainer's answer is not in the conversation, the migration does not start.

**Three things this plan discovered that the spec does not state, flagged rather than
assumed:**

1. **The binding table is an inference.** The spec gives two instances of it — the `content`
   slot binds to React's `children`, a named slot binds to a node-valued prop — and leaves
   the event case unstated. This plan makes it mechanical (`navigate` → `onNavigate`) and
   writes it into `api/README.md` and `bindingName()`. If the maintainer wants React to
   name the prop `navigate` instead, one function and one table change.
2. **R2 and R3 are not machine-checkable**, so the spec's "R1 through R5, asserted against
   the declared types" is true of three of the five. This is recorded honestly in the
   gate's header, in `api/README.md` and in `CLAUDE.md`'s *Known debt* rather than papered
   over.
3. **Two of A.2's seven types are audit-dependent.** `Crumb`'s fields and whether
   `StatDelta` exists at all are what the Breadcrumbs and StatCard audits decide, so they
   are declared in their component tasks and not pre-empted in Task 2. The five enums are
   settled by both layers agreeing on their values today and are declared up front.

**One permissiveness the gate carries knowingly.** A layer that inlines a literal union
(`size?: 'sm' | 'md' | 'lg' | 'xl'`) rather than importing the generated `LogoSize` still
classifies as an `enum` and still agrees with the contract — the reader has no type name to
compare, so the values themselves go unchecked and two layers could drift on them
silently. Every migration in Tasks 5–7 imports the generated type instead, which closes it
in practice; nothing enforces it. If that turns out to matter, the fix is to have
`compareSurface` compare an inline enum's `values` against the declared enum's, and it
belongs with whichever plan first hits the drift.
