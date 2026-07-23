# API capability contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Arena a framework-neutral record of what each component must *offer*, and a gate that tells "differs correctly" from "is missing" from "differs in kind" — the three things a prose divergence record makes look identical.

**Architecture:** A neutral contract per component at `behaviour/contracts/<Component>.api.json` lists its capabilities. A binding sidecar next to each layer's source (`<Component>.api.json` for React, `<name>.api.json` for Angular, and one shared `frameworks/angular/api-delegated.json` for the 22 controls Material provides) maps each capability onto that layer's real members and classifies the mapping with a `form` from a closed vocabulary. `scripts/check-api-contracts.mjs` reads both layers' *source* with the TypeScript compiler API — never by import, never by regex — and asserts coverage, member existence, no orphan members, and that every cross-layer form pair is a classified one. It reuses plan 7's conventions wholesale and rebuilds none of them.

**Tech Stack:** Node/Bun ESM under `scripts/`, TypeScript 6.0.3 compiler API (already a devDependency for `ngc`), `node:test`/`node:assert` for the suite. No new dependency.

## Global Constraints

- **English only.** Every file, comment, reason string and doc line in this plan is English.
- **No emoji**, in product or docs.
- **This plan changes no component implementation.** It writes declarations, a gate, and documentation. Every `unsupported` gap it labels is closed by later, separate work — one component at a time. If a task finds itself editing a `.jsx` or a primitive's `.ts` to make a gate pass, the task is wrong.
- **A script under `scripts/` may not import a framework layer's `.ts` or `.jsx`.** That suite also runs under plain `node scripts/check-all.mjs`, which cannot resolve those files' extensionless imports. Reading them as *source text* into an AST is not importing them and is correct. The gate must never `import()` a component.
- **A gate may not run its scan at top level.** Put the walk behind `main()` guarded by `if (process.argv[1] === fileURLToPath(import.meta.url))`, exactly as `check-behaviour.mjs:138` and `check-dimension-literals.mjs` do. Its own test imports it for pure helpers, and an unguarded `process.exit(1)` kills the test process.
- **Coverage is phrased "every layer", never "at least one".** This is plan 5.5's recorded lesson, in CLAUDE.md under *Known debt*: once one layer satisfies a gate, an "at least one" rule says nothing about the other. A component a layer does not have is *declared*, never silently skipped.
- **Every record carries a stale-entry rule.** An `unsupported` binding for a capability the layer has since gained must fail. An idiom-member exclusion naming a member no layer declares any more must fail. This is the invariant `EXEMPT` in `check-dimension-literals.mjs` and the delegated entries in `check-behaviour.mjs:100-108` already hold, and it is the whole reason these records are trustworthy.
- **Land green, where green means *declared*.** Write every contract and every binding first, classify honestly, and only then wire the gate into `check-all`. The gate does not go into `GATES` until it passes on the real tree.
- **`bun run check` is a completion gate, not a per-commit toll.** Run the individual gate (`bun scripts/check-api-contracts.mjs`) per commit; run the full sweep once, at Task 13.
- **`scripts/check-all.test.mjs` asserts the gate array by literal value and by length.** Changing `GATES` without changing that suite leaves the tests describing a gate set that does not exist. Plan 5.5 learned this by breaking it.

---

## Decisions inherited from the spec's open questions

The spec (`docs/superpowers/specs/2026-07-22-8-api-contracts-design.md`) closes with seven open questions and five decisions (D1–D5) that "must be answered before a plan is written". They were answered in the brainstorming session that produced this plan. **They are settled; do not reopen them mid-execution.**

| # | Question | Answer |
|---|---|---|
| D1 | Scope: API only, or also migrate the behaviour sections? | **API only.** The ~6 behaviour sections stay as prose and belong to whoever next verifies those components by render. |
| D2 | Does `components-divergences.md` declare itself non-normative? | **Yes**, one paragraph in its preamble. Task 12. |
| D3 | Where do the ~9 rendering sections live? | **A new `rendering-divergences.md`.** Task 12 splits them out. |
| D4 | Retirement condition for `components-divergences.md`? | **A written predicate, no date.** Task 13 puts it in CLAUDE.md. |
| D5 | A check that citations still resolve? | **Yes, inside `check:api`** — not a gate of its own, so the count stays at twenty-one. Task 4. |
| Q1 | Is the `form` vocabulary closed, and who closes it? | It grows while binding, then Task 11 **freezes** it in `scripts/lib/api-contracts.mjs` with the suite asserting it by literal value. |
| Q2 | Which form pairs are compatible? | **They emerge from the binding pass and freeze at Task 11.** Every pair added carries a written reason. |
| Q3 | Where does `shape` come from? | **Hand-written, from scratch.** Not derived from React — deriving it makes React the reference layer by construction, which contradicts plan 7's finding that Angular is the accessible reference more often. |
| Q4 | Orphan-member false positives (`style`, `...rest`)? | **A global per-layer idiom rule**, declared once in the gate with a reason and its own stale-entry rule. Not 29 capabilities and not 43 per-component exclusions. |
| Q5 | Do the three SVG charts get contracts? | **Yes**, with everything else. |
| Q7 | A third form beside `unsupported`? | **Yes, `not-applicable`.** "This layer could offer it and does not" (a real gap) must not read like "this layer should never offer it" (idiom). |
| — | *(not enumerated by the spec)* The 22 React components Angular provides through Material. | A **`delegated` form** and a single `frameworks/angular/api-delegated.json`, exactly analogous to `behaviour-delegated.json`. Declaring `not-applicable` for them would be a lie: Angular *does* have a button, it is `matButton`. |

## Facts established before writing this plan — trust these, they were measured

- **43 React components**, one `.jsx` + one `.d.ts` each, across six groups: `brand` (1), `charts` (4), `display` (10), `feedback` (10), `forms` (9), `navigation` (9).
- **Every props interface is named `<Component>Props`.** Checked across all 43; there are zero exceptions, so the gate can resolve the interface by name and needs no map.
- **21 Angular primitives**; the other 22 React components are declared in `frameworks/angular/behaviour-delegated.json`.
- **TypeScript 6.0.3 parses under plain `node`.** Verified: `import ts from 'typescript'` then `ts.createSourceFile(...)` works in node ESM with no build step, so the gate stays runtime-portable and never joins `check:cards`/`check:vendor`/`check:demos` in the exit-2 skip club.
- **29 of 43 `.d.ts` declare `style?: React.CSSProperties` as an own member.** This is the entire orphan-noise problem, and it is why Q4's answer is a global rule.
- **14 `.d.ts` inherit host attributes via `extends React.*HTMLAttributes<...>`** (ActivityFeed, AppLogo, Badge, Button, Card, Checkbox, IconButton, Input, Select, SideNav, Switch, Tag, Textarea, UnauthCard). **This costs nothing**: the reader returns an interface's *own* members, so inherited attributes never appear as orphans. Only `style` needs the global rule.
- **7 `.d.ts` declare `children` as an own member.** That is a real capability, not idiom — it binds `node-prop` in React and `content-slot` in Angular.
- **Angular uses `output()` in exactly four primitives**: `bulk-action-bar` (`run`, `cleared`), `confirm-dialog` (`cancelled`, `confirmed`), `breadcrumbs` (`navigate`), `onboarding` (`next`, `back`, `skip`, `done`). There is no `EventEmitter` anywhere in the layer.
- **Angular expresses a named slot with `contentChild()`**, not with `<ng-content select>`: `chart-card` (`actions`), `error-state` (`action`), `page-head` (`actions`). Those fields are `protected` and are still real declarations, so `named-slot` bindings resolve to them. `viewChild()` is an internal element handle and is **not** a slot — the reader must exclude it.
- **`components-divergences.md` is 1127 lines**; the structural/per-component seam is `## Per-component divergences`. Exact section offsets are listed in Task 12.
- **14 live citations** of `components-divergences.md` outside `docs/superpowers/` (which is itself excluded — specs and plans are deleted once executed). Citations name sections as **quoted prose**, not as URL anchors, and in inconsistent dash forms (`--` and `—`). Task 4's check handles both.
- **The API sections in the record are 6, not the "~7" the spec estimates**: ConfirmDialog `width`, PageHead `style`, UnauthCard `style`, AppLogo mark, Breadcrumbs `navigate`, StatCard `delta`. `StatCard.icon` is not recorded at all — that is the spec's headline finding and this plan is where it first gets written down.

## File Structure

**New — the contract layer**

- `behaviour/contracts/<Component>.api.json` × 43 — the neutral contract. One per React component; a component's identity across layers is its React name, exactly as `check-behaviour.mjs` already establishes.
- `frameworks/react/components/<group>/<Component>.api.json` × 43 — React bindings, sidecar beside the `.jsx`/`.d.ts`/`.prompt.md`/`.behaviour.json`.
- `frameworks/angular/primitives/<name>/<name>.api.json` × 21 — Angular bindings.
- `frameworks/angular/api-delegated.json` — one file, 22 entries.

**New — the machinery**

- `scripts/lib/api-contracts.mjs` — the vocabulary, the compatible-pair table, the layer-idiom rule, and pure validators. No filesystem walk, no `process.exit`. This is the module the suite imports.
- `scripts/lib/api-members.mjs` — the two TypeScript-AST readers. Pure: source text in, member names out. Split from the module above because parsing is a different responsibility from validating, and because it is the only thing in this plan that depends on `typescript`.
- `scripts/check-api-contracts.mjs` — the walk and the reporting, mirroring `check-behaviour.mjs`'s shape one-for-one.
- `scripts/api-contracts.test.mjs`, `scripts/api-members.test.mjs`, `scripts/check-api-contracts.test.mjs` — flat under `scripts/`, matching the convention every other lib test follows (`scripts/behaviour-contracts.test.mjs` tests `scripts/lib/behaviour-contracts.mjs`). `check-all.mjs` discovers test files with a **non-recursive** `readdirSync(scripts/)`, so a test nested under `scripts/lib/` would never run under node.

**Modified**

- `package.json` — `check:api` script.
- `scripts/check-all.mjs` — one `GATES` entry.
- `scripts/check-all.test.mjs` — the length and the literal name array.
- `components-divergences.md` — 6 API sections removed, 9 rendering sections moved out, preamble rewritten.
- `rendering-divergences.md` — new, at the repo root beside the file it splits from.
- `CLAUDE.md`, `CHANGELOG.md`.

---

### Task 1: The vocabulary and its validators

**Files:**
- Create: `scripts/lib/api-contracts.mjs`
- Test: `scripts/api-contracts.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `KINDS: Set<string>`, `FORMS: Map<string,string>`, `NON_IMPLEMENTING: Set<string>`, `GAP_FORMS: Set<string>`, `COMPATIBLE_PAIRS: {a: string, b: string, reason: string}[]`, `LAYER_IDIOM_MEMBERS: Map<string, Map<string,string>>`, `CONTRACT_DIR: string`, `pairsCompatible(a: string, b: string): boolean`, `validateContract(component: string, contract: object): string[]`, `validateApiBinding(component: string, layer: string, binding: object, contract: object): string[]`, `classifyPair(component: string, capability: string, a: {layer, form, reason}, b: {layer, form, reason}): string|null`.

- [ ] **Step 1: Write the failing test**

Create `scripts/api-contracts.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KINDS, FORMS, NON_IMPLEMENTING, GAP_FORMS, COMPATIBLE_PAIRS, LAYER_IDIOM_MEMBERS,
  pairsCompatible, validateContract, validateApiBinding, classifyPair,
} from './lib/api-contracts.mjs';

const CONTRACT = {
  component: 'StatCard',
  capabilities: [
    { name: 'label', kind: 'input', required: true, shape: 'string' },
    { name: 'delta', kind: 'input', required: false, shape: { value: 'string' } },
  ],
};

test('a form outside the vocabulary is rejected', () => {
  const problems = validateApiBinding('StatCard', 'react',
    { label: { form: 'made-up', members: ['label'] }, delta: { form: 'object-prop', members: ['delta'] } },
    CONTRACT);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /made-up/);
});

test('an unbound capability fails — coverage is every layer, never at least one', () => {
  const problems = validateApiBinding('StatCard', 'angular',
    { label: { form: 'flat-inputs', members: ['label'] } },
    CONTRACT);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /delta/);
});

test('a binding naming a capability the contract does not have fails', () => {
  const problems = validateApiBinding('StatCard', 'react',
    {
      label: { form: 'node-prop', members: ['label'] },
      delta: { form: 'object-prop', members: ['delta'] },
      ghost: { form: 'node-prop', members: ['ghost'] },
    },
    CONTRACT);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /ghost/);
});

test('unsupported and not-applicable each require a reason', () => {
  for (const form of ['unsupported', 'not-applicable']) {
    const problems = validateApiBinding('StatCard', 'angular',
      { label: { form: 'flat-inputs', members: ['label'] }, delta: { form, members: [] } },
      CONTRACT);
    assert.equal(problems.length, 1, `${form} with no reason must fail`);
    assert.match(problems[0], /reason/);
  }
});

test('unsupported and not-applicable are distinct — a gap is not idiom', () => {
  assert.ok(GAP_FORMS.has('unsupported'));
  assert.ok(!GAP_FORMS.has('not-applicable'));
  assert.ok(NON_IMPLEMENTING.has('unsupported'));
  assert.ok(NON_IMPLEMENTING.has('not-applicable'));
  assert.ok(NON_IMPLEMENTING.has('delegated'));
});

test('an implementing form binds at least one member; a content-slot binds none', () => {
  const empty = validateApiBinding('StatCard', 'react',
    { label: { form: 'node-prop', members: [] }, delta: { form: 'object-prop', members: ['delta'] } },
    CONTRACT);
  assert.equal(empty.length, 1);
  assert.match(empty[0], /members/);

  const slot = validateApiBinding('StatCard', 'angular',
    { label: { form: 'content-slot', members: [] }, delta: { form: 'flat-inputs', members: ['deltaValue'] } },
    CONTRACT);
  assert.deepEqual(slot, []);
});

test('a contract with a bad kind, a missing shape or a duplicate name fails', () => {
  assert.match(validateContract('X', { component: 'X', capabilities: [{ name: 'a', kind: 'prop', required: true, shape: 'string' }] })[0], /kind/);
  assert.match(validateContract('X', { component: 'X', capabilities: [{ name: 'a', kind: 'input', required: true }] })[0], /shape/);
  assert.match(validateContract('X', { component: 'X', capabilities: [
    { name: 'a', kind: 'input', required: true, shape: 'string' },
    { name: 'a', kind: 'input', required: false, shape: 'string' },
  ] })[0], /duplicate/);
  assert.match(validateContract('X', { component: 'Y', capabilities: [{ name: 'a', kind: 'input', required: true, shape: 'string' }] })[0], /does not match/);
});

test('a known-good pair passes in either order', () => {
  assert.ok(pairsCompatible('object-prop', 'flat-inputs'));
  assert.ok(pairsCompatible('flat-inputs', 'object-prop'));
  assert.ok(pairsCompatible('node-prop', 'node-prop'), 'identical forms are always compatible');
});

test('node-prop against icon-name is deliberately NOT a known-good pair', () => {
  assert.ok(!pairsCompatible('node-prop', 'icon-name'),
    'this is the StatCard.icon divergence the whole gate exists to surface');
});

test('classifyPair fails an unclassified pair and is silenced by a reason', () => {
  const bare = classifyPair('StatCard', 'icon',
    { layer: 'react', form: 'node-prop' }, { layer: 'angular', form: 'icon-name' });
  assert.match(bare, /icon/);

  const excused = classifyPair('StatCard', 'icon',
    { layer: 'react', form: 'node-prop' },
    { layer: 'angular', form: 'icon-name', reason: 'React takes any node; Angular takes a Phosphor class string.' });
  assert.equal(excused, null);
});

test('classifyPair never fires when either side does not implement', () => {
  for (const form of [...NON_IMPLEMENTING]) {
    assert.equal(
      classifyPair('ConfirmDialog', 'width',
        { layer: 'react', form: 'object-prop' },
        { layer: 'angular', form, reason: 'r' }),
      null,
      `${form} is a declared state, not an unclassified pair`);
  }
});

test('every compatible pair carries a written reason', () => {
  for (const pair of COMPATIBLE_PAIRS) {
    assert.ok(pair.reason && pair.reason.length > 20,
      `${pair.a}/${pair.b} needs a reason saying why the two spellings are one capability`);
  }
});

test('every form and every layer-idiom member carries a description', () => {
  for (const [form, description] of FORMS) {
    assert.ok(description && description.length > 20, `${form} needs a description`);
  }
  for (const [layer, members] of LAYER_IDIOM_MEMBERS) {
    for (const [member, reason] of members) {
      assert.ok(reason && reason.length > 20, `${layer}/${member} needs a reason`);
    }
  }
});

test('KINDS is the closed three', () => {
  assert.deepEqual([...KINDS].sort(), ['input', 'output', 'slot']);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/api-contracts.test.mjs`
Expected: FAIL — `Cannot find module './lib/api-contracts.mjs'`.

- [ ] **Step 3: Write the module**

Create `scripts/lib/api-contracts.mjs`:

```js
/* The vocabulary and validators for Arena's API capability contract layer.
 *
 * A CONTRACT says what a component must OFFER -- its capabilities, framework
 * neutral, at behaviour/contracts/<Component>.api.json. A BINDING says how one
 * layer spells each capability: which of its real members carry it, and under
 * which `form`.
 *
 * The point is NOT convergence. Angular's way to express a compound value is
 * flat signal inputs; React's is one object prop. Those are two correct
 * spellings of one capability, and a gate asserting Angular exposes a prop
 * named `delta` would be a defect in the gate. What the closed `form`
 * vocabulary buys is a CLASSIFICATION: object-prop against flat-inputs is a
 * known-good pair, node-prop against icon-name is not, and the second is a
 * divergence in KIND that a prose record cannot distinguish from the first.
 *
 * Everything here is pure. scripts/check-api-contracts.mjs does the filesystem
 * walk and the reporting; this module is what its suite can import. */

export const CONTRACT_DIR = 'behaviour/contracts';

/** What a capability IS. Closed, and deliberately coarse -- the shape of a
 *  value is `shape`'s job, not this one's. */
export const KINDS = new Set(['input', 'output', 'slot']);

/** How a layer SPELLS a capability. Closed as of this plan's Task 11.
 *  @type {Map<string,string>} form -> what it means */
export const FORMS = new Map([
  ['object-prop', 'One prop carrying a compound value, e.g. React StatCardProps.delta as a StatDelta object.'],
  ['flat-inputs', 'Several sibling inputs carrying one compound value, e.g. Angular deltaValue/deltaDirection/deltaTone.'],
  ['node-prop', 'A prop accepting arbitrary renderable content, e.g. React `icon?: React.ReactNode` or `children`.'],
  ['icon-name', 'A string naming or classing an icon rather than carrying a node, e.g. Angular `icon = input<string>()` rendered as `<i [class]>`.'],
  ['content-slot', 'Default projection: Angular `<ng-content />`. Binds no member -- projection has no field to name.'],
  ['named-slot', 'Marked projection: an Angular `contentChild()` field selecting a directive, e.g. page-head`s `actions`.'],
  ['event-prop', 'A callback prop the consumer passes in, e.g. React `onClose?: () => void`.'],
  ['output', 'An Angular `output<T>()` the consumer subscribes to, e.g. breadcrumbs` `navigate`.'],
  ['passthrough', 'The layer forwards the value to the host element rather than interpreting it, e.g. React `style`.'],
  ['delegated', 'A third-party control provides this capability; the layer has no primitive of its own. See frameworks/angular/api-delegated.json.'],
  ['unsupported', 'This layer COULD offer the capability and does not. A real gap. Requires a reason.'],
  ['not-applicable', 'This layer should never offer the capability -- it is the other layer`s idiom, not a gap. Requires a reason.'],
]);

/** Forms that assert no implementation, so no cross-layer pair comparison is
 *  meaningful against them. Keeping `unsupported` and `not-applicable` apart
 *  here while both sit in this set is the whole Q7 answer: they behave the
 *  same for pair classification and mean opposite things to a reader. */
export const NON_IMPLEMENTING = new Set(['unsupported', 'not-applicable', 'delegated']);

/** The subset of the above that is a real gap -- the number the gate reports,
 *  and the only one anybody should be trying to drive to zero. */
export const GAP_FORMS = new Set(['unsupported']);

/** Forms that legitimately bind zero members, because the mechanism has no
 *  named field: default projection, and any non-implementing declaration. */
const MEMBERLESS = new Set(['content-slot', ...NON_IMPLEMENTING]);

/** Forms requiring a written reason at every site that uses them. */
const REASON_REQUIRED = new Set([...NON_IMPLEMENTING]);

/** Two different spellings the layers may use for one capability without the
 *  gate calling it a divergence in kind. Identical forms are compatible by
 *  rule and are not listed. Every entry states why the two are one capability.
 *  @type {{a: string, b: string, reason: string}[]} */
export const COMPATIBLE_PAIRS = [
  { a: 'object-prop', b: 'flat-inputs',
    reason: 'Angular`s idiom for a compound value is sibling signal inputs; React`s is one object prop. Forcing either shape onto the other layer produces bad code in that layer, and the consumer supplies the same facts either way.' },
  { a: 'node-prop', b: 'content-slot',
    reason: 'React passes renderable content as a prop; Angular projects it with <ng-content />. Both let the consumer supply arbitrary markup the component positions but does not author.' },
  { a: 'node-prop', b: 'named-slot',
    reason: 'The same projection, marked: where a component takes more than one content region, Angular selects each with a contentChild() directive query while React keeps one prop per region.' },
  { a: 'event-prop', b: 'output',
    reason: 'React reports an event by invoking a callback prop; Angular emits from an output() the template subscribes to. Both hand the consumer the same occurrence with the same payload.' },
];

/** Members a layer declares as its own idiom rather than as a capability, so
 *  the no-orphan assertion does not demand a contract entry for each. Global
 *  per layer, never per component -- 29 of 43 React .d.ts declare `style`, and
 *  29 identical capabilities would be pure noise obscuring the real gaps.
 *
 *  This map carries the same stale-entry rule every other record in the repo
 *  does: an entry naming a member no source in that layer declares any more
 *  fails the gate, so a member that disappears cannot leave a lie behind.
 *  @type {Map<string, Map<string,string>>} layer -> member -> reason */
export const LAYER_IDIOM_MEMBERS = new Map([
  ['react', new Map([
    ['style', 'Every React component accepts a style object it merges over its own inline styles. That is the layer`s escape hatch, not a capability Arena designs -- components carry no CSS classes, so `style` is the only override surface React has. Angular`s counterpart is the host element the consumer already owns, so there is nothing for it to offer.'],
  ])],
  ['angular', new Map()],
]);

const key = (a, b) => [a, b].sort().join('|');
const COMPATIBLE = new Set(COMPATIBLE_PAIRS.map((p) => key(p.a, p.b)));

/** True when two layers may spell one capability these two ways. Identical
 *  forms are always compatible; order never matters. */
export function pairsCompatible(a, b) {
  if (a === b) return true;
  return COMPATIBLE.has(key(a, b));
}

/** @returns {string[]} problems; empty means valid */
export function validateContract(component, contract) {
  const problems = [];
  if (contract.component !== component) {
    problems.push(`${component}: contract names component "${contract.component}", which does not match its filename`);
  }
  const capabilities = contract.capabilities ?? [];
  if (!Array.isArray(capabilities)) {
    problems.push(`${component}: capabilities must be an array`);
    return problems;
  }
  const seen = new Set();
  for (const capability of capabilities) {
    const where = `${component}.${capability.name ?? '<unnamed>'}`;
    if (!capability.name) problems.push(`${component}: a capability has no name`);
    else if (seen.has(capability.name)) problems.push(`${where}: duplicate capability name`);
    else seen.add(capability.name);

    if (!KINDS.has(capability.kind)) {
      problems.push(`${where}: kind "${capability.kind}" is not one of input, output, slot`);
    }
    if (typeof capability.required !== 'boolean') {
      problems.push(`${where}: required must be true or false`);
    }
    if (capability.shape === undefined) {
      problems.push(`${where}: no shape — descriptive, hand-written, and the thing that makes a divergence in KIND legible`);
    }
  }
  return problems;
}

/** @returns {string[]} problems; empty means valid */
export function validateApiBinding(component, layer, binding, contract) {
  const problems = [];
  const where = (name) => `${layer}/${component}.${name}`;
  const contracted = new Set((contract.capabilities ?? []).map((c) => c.name));

  for (const [name, entry] of Object.entries(binding)) {
    if (!contracted.has(name)) {
      problems.push(`${where(name)}: no such capability in ${CONTRACT_DIR}/${component}.api.json — stale, or contract it first`);
      continue;
    }
    if (!FORMS.has(entry.form)) {
      problems.push(`${where(name)}: form "${entry.form}" is not in the closed vocabulary (${[...FORMS.keys()].join(', ')})`);
      continue;
    }
    if (REASON_REQUIRED.has(entry.form) && !entry.reason) {
      problems.push(`${where(name)}: form "${entry.form}" requires a reason — "a real gap", "the other layer`s idiom" and "Material provides it" must not look alike`);
    }
    const members = entry.members ?? [];
    if (!MEMBERLESS.has(entry.form) && members.length === 0) {
      problems.push(`${where(name)}: form "${entry.form}" implements the capability, so it must name the members that carry it`);
    }
    if (NON_IMPLEMENTING.has(entry.form) && members.length > 0) {
      problems.push(`${where(name)}: form "${entry.form}" declares no implementation, so it must name no members`);
    }
  }

  for (const name of contracted) {
    if (!(name in binding)) {
      problems.push(`${where(name)}: capability is not bound — every capability is bound in EVERY layer, or declared unsupported/not-applicable/delegated with a reason`);
    }
  }
  return problems;
}

/** Assertion 4. Returns one problem string, or null when the pair is fine.
 *  A pair is fine when either side does not implement (there is nothing to
 *  compare), when the forms are a classified pair, or when the binding says in
 *  writing why this one differs in kind.
 *  @param {{layer: string, form: string, reason?: string}} a
 *  @param {{layer: string, form: string, reason?: string}} b */
export function classifyPair(component, capability, a, b) {
  if (NON_IMPLEMENTING.has(a.form) || NON_IMPLEMENTING.has(b.form)) return null;
  if (pairsCompatible(a.form, b.form)) return null;
  if (a.reason || b.reason) return null;
  return `${component}.${capability}: ${a.layer} binds "${a.form}", ${b.layer} binds "${b.form}",`
    + ` and that is not a classified pair. These are different capabilities sharing one name, not two`
    + ` spellings of one — add a reason to the binding saying so, or add the pair to COMPATIBLE_PAIRS with one.`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/api-contracts.test.mjs`
Expected: PASS, 13 tests.

Also run it under plain node, because this module must stay runtime-portable:

Run: `node --test scripts/api-contracts.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/api-contracts.mjs scripts/api-contracts.test.mjs
git commit -m "feat(api): the capability contract vocabulary and its validators"
```

---

### Task 2: Reading both layers' real members from source

**Files:**
- Create: `scripts/lib/api-members.mjs`
- Test: `scripts/api-members.test.mjs`

**Interfaces:**
- Consumes: nothing from Task 1 — this module is independent on purpose, because parsing is a different responsibility from validating and it is the only thing here that depends on `typescript`.
- Produces: `reactProps(source: string, component: string): string[]` — the own members of `interface <Component>Props`, sorted. `angularMembers(source: string): string[]` — every class field initialised with `input()`, `input.required()`, `output()`, `model()` or `contentChild()`, sorted.

**Why an AST and not a regex:** `check:angular` already needs TypeScript 6.0.3 for `ngc`, so it is a devDependency and costs nothing new. A regex over `input(` would find `input(` inside a doc comment, would miss `input.required<string>()`, and would have no way to tell `contentChild` (a slot) from `viewChild` (an internal element handle) reliably. Both are real ASTs; read them as such.

- [ ] **Step 1: Write the failing test**

Create `scripts/api-members.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reactProps, angularMembers } from './lib/api-members.mjs';

test('reactProps returns the interface`s own members only', () => {
  const source = `
    import * as React from 'react';
    export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
      /** doc */
      title?: string;
      children: React.ReactNode;
      style?: React.CSSProperties;
    }
    export interface OtherProps { ignored: string }
    export function Card(props: CardProps): JSX.Element;
  `;
  assert.deepEqual(reactProps(source, 'Card'), ['children', 'style', 'title']);
});

test('reactProps returns an empty array when the interface is absent', () => {
  assert.deepEqual(reactProps('export const x = 1;', 'Card'), []);
});

test('reactProps ignores a nested interface`s members', () => {
  const source = `
    export interface StatDelta { value: string; direction: 'up' | 'down'; }
    export interface StatCardProps { label: string; delta?: StatDelta; }
  `;
  assert.deepEqual(reactProps(source, 'StatCard'), ['delta', 'label']);
});

test('angularMembers picks up input, input.required, output and contentChild', () => {
  const source = `
    import { Component, contentChild, input, output, viewChild } from '@angular/core';
    @Component({ selector: 'arena-x' })
    export class X {
      readonly name = input.required<string>();
      readonly dim = input<string>();
      readonly navigate = output<Event>();
      protected readonly actions = contentChild(ArenaActions);
      private readonly panel = viewChild<ElementRef>('panel');
      protected readonly styles = computed(() => xStyles());
      private open = false;
      toggle(): void {}
    }
  `;
  assert.deepEqual(angularMembers(source), ['actions', 'dim', 'name', 'navigate']);
});

test('angularMembers is not fooled by the words in a doc comment', () => {
  const source = `
    /** This component takes an input() and emits an output() -- prose, not code. */
    export class X { readonly real = input<string>(); }
  `;
  assert.deepEqual(angularMembers(source), ['real']);
});

test('reactProps reads the real StatCard.d.ts', () => {
  const source = readFileSync('frameworks/react/components/display/StatCard.d.ts', 'utf8');
  assert.deepEqual(reactProps(source, 'StatCard'),
    ['delta', 'icon', 'label', 'style', 'sub', 'tone', 'value']);
});

test('angularMembers reads the real stat-card.ts', () => {
  const source = readFileSync('frameworks/angular/primitives/stat-card/stat-card.ts', 'utf8');
  assert.deepEqual(angularMembers(source),
    ['deltaDirection', 'deltaTone', 'deltaValue', 'icon', 'label', 'sub', 'tone', 'value']);
});

test('angularMembers reads breadcrumbs` output and page-head`s contentChild', () => {
  assert.deepEqual(
    angularMembers(readFileSync('frameworks/angular/primitives/breadcrumbs/breadcrumbs.ts', 'utf8')),
    ['items', 'navigate', 'separator']);
  assert.ok(
    angularMembers(readFileSync('frameworks/angular/primitives/page-head/page-head.ts', 'utf8')).includes('actions'),
    'a contentChild() field IS the Angular spelling of a named slot');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/api-members.test.mjs`
Expected: FAIL — `Cannot find module './lib/api-members.mjs'`.

- [ ] **Step 3: Write the module**

Create `scripts/lib/api-members.mjs`:

```js
/* Reads each framework layer's real API surface out of its source text.
 *
 * NEVER by import. CLAUDE.md is explicit: a script under scripts/ may not
 * import a framework layer's .ts or .jsx, because scripts/ is the one suite
 * check-all.mjs also runs under plain node, and those files use the
 * extensionless imports their own toolchains expect and node does not resolve.
 * Parsing them as TEXT into an AST is not importing them, and is fine.
 *
 * NEVER by regex either. `input.required<string>()` and a doc comment reading
 * "takes an input()" are indistinguishable to a text scan, and so are
 * contentChild (a projection slot, part of the public surface) and viewChild
 * (an internal element handle, not). TypeScript 6.0.3 is already a
 * devDependency for ngc, so the compiler API costs nothing new -- and it runs
 * under plain node with no build step, which is what keeps check:api out of the
 * exit-2 skip club check:cards, check:vendor and check:demos live in. */
import ts from 'typescript';

const parse = (source, fileName) =>
  ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

/** Every own member of `interface <component>Props`, sorted.
 *
 *  Own members only: 14 of the 43 .d.ts extend a React.*HTMLAttributes<...>,
 *  and those inherited attributes are the host element's surface rather than
 *  anything Arena designed -- surfacing them would bury the real capabilities
 *  under several hundred DOM attributes. All 43 interfaces are named
 *  <Component>Props with no exceptions, so this resolves by name and needs no
 *  map.
 *  @returns {string[]} */
export function reactProps(source, component) {
  const file = parse(source, `${component}.d.ts`);
  const target = `${component}Props`;
  const out = [];
  ts.forEachChild(file, (node) => {
    if (!ts.isInterfaceDeclaration(node) || node.name.text !== target) return;
    for (const member of node.members) {
      if (!ts.isPropertySignature(member) || !member.name) continue;
      out.push(member.name.getText(file));
    }
  });
  return out.sort();
}

/** Every class field whose initialiser is one of Angular's public-surface
 *  factories, sorted.
 *
 *  contentChild IS in -- it is how this layer spells a named slot (page-head's
 *  `actions`, error-state's `action`, chart-card's `actions`), and a slot is
 *  part of what a component offers even though the field is `protected`.
 *  viewChild is OUT -- an internal handle on an element the component rendered
 *  itself, which no consumer supplies.
 *  @returns {string[]} */
const SURFACE_CALLS = new Set(['input', 'output', 'model', 'contentChild']);

export function angularMembers(source) {
  const file = parse(source, 'component.ts');
  const out = [];
  const visit = (node) => {
    if (ts.isPropertyDeclaration(node) && node.initializer && node.name) {
      if (surfaceCall(node.initializer)) out.push(node.name.getText(file));
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(file, visit);
  return out.sort();
}

/** `input(...)`, `input.required(...)`, `output<T>()`, `contentChild(...)` --
 *  the callee is either the bare identifier or a property access whose object
 *  is that identifier (`input.required`). */
function surfaceCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return SURFACE_CALLS.has(callee.text);
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
    return SURFACE_CALLS.has(callee.expression.text);
  }
  return false;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/api-members.test.mjs`
Expected: PASS, 8 tests. The three "reads the real ..." tests are the ones that matter — they pin the reader against files nobody wrote for it.

Run: `node --test scripts/api-members.test.mjs`
Expected: PASS. If this fails while bun passes, the module has picked up a bun-only API and must be fixed here, not worked around later.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/api-members.mjs scripts/api-members.test.mjs
git commit -m "feat(api): read each layer's real members with the TypeScript AST"
```

---

### Task 3: The gate

**Files:**
- Create: `scripts/check-api-contracts.mjs`
- Test: `scripts/check-api-contracts.test.mjs`
- Create: `behaviour/contracts/.gitkeep` (removed again in Task 5, once the directory holds real contracts)

**Interfaces:**
- Consumes: everything Task 1 and Task 2 produce.
- Produces: `REACT_GROUPS: string[]`, `reactApiPath(rootDir, component, suffix = '.api.json'): string|null`, `orphanProblems(layer, component, declared: string[], claimed: Set<string>, idiom: Map<string,string>): string[]`, `idiomStaleProblems(layer, idiom: Map<string,string>, everyDeclaredMember: Set<string>): string[]`. `main()` is not exported; the walk runs only under the `process.argv[1]` guard.

**What this gate proves, and what it does not.** It proves a capability was *declared* in every layer, that every name in a binding resolves to a real declaration in that layer's source, that no member of either layer is silently uncontracted, and that every cross-layer form pair is one somebody classified. It proves **nothing about the types** — `'up' | 'down'` in a `.d.ts` and `Direction` in a `.ts` may or may not be the same union, and proving that is a cross-project type-identity problem this layer declines. Each layer's own compiler enforces its half; `check:angular` already runs `ngc --strictTemplates`. It also proves nothing about `shape`, which is hand-written prose no gate reads.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-api-contracts.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orphanProblems, idiomStaleProblems, REACT_GROUPS } from './check-api-contracts.mjs';

test('REACT_GROUPS is the six component group directories', () => {
  assert.deepEqual(REACT_GROUPS,
    ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation']);
});

test('a declared member no capability claims is an orphan', () => {
  const problems = orphanProblems('react', 'StatCard',
    ['label', 'value', 'surprise'], new Set(['label', 'value']), new Map());
  assert.equal(problems.length, 1);
  assert.match(problems[0], /surprise/);
});

test('a layer-idiom member is not an orphan', () => {
  assert.deepEqual(
    orphanProblems('react', 'PageHead',
      ['title', 'style'], new Set(['title']), new Map([['style', 'the layer`s escape hatch']])),
    []);
});

test('a binding claiming a member the source does not declare fails', () => {
  const problems = orphanProblems('angular', 'stat-card',
    ['label'], new Set(['label', 'deltaGhost']), new Map());
  assert.equal(problems.length, 1);
  assert.match(problems[0], /deltaGhost/);
  assert.match(problems[0], /does not declare/);
});

test('an idiom entry no layer declares any more is stale and fails', () => {
  const problems = idiomStaleProblems('react',
    new Map([['style', 'r'], ['gone', 'r']]), new Set(['style', 'title']));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /gone/);
  assert.match(problems[0], /stale/);
});

test('idiomStaleProblems is silent when every entry still matches something', () => {
  assert.deepEqual(
    idiomStaleProblems('react', new Map([['style', 'r']]), new Set(['style', 'title'])),
    []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/check-api-contracts.test.mjs`
Expected: FAIL — `Cannot find module './check-api-contracts.mjs'`.

- [ ] **Step 3: Write the gate**

Create `scripts/check-api-contracts.mjs`:

```js
/* Asserts every component declares an API capability contract, that every
 * layer binds every capability, and that every binding still describes a
 * component that exists.
 *
 * WHAT THIS PROVES: that a capability was DECLARED in every layer; that every
 * name in a binding resolves to a real declaration in that layer's source;
 * that no member of either layer is silently uncontracted; and that every
 * cross-layer form pair is one somebody classified in writing.
 *
 * WHAT THIS DOES NOT PROVE, and the distinction matters more than the gate:
 *
 *  - That the two layers' TYPES agree. `'up' | 'down'` in a .d.ts and
 *    `Direction` in a .ts may or may not be the same union; proving it is a
 *    cross-project type-identity problem this layer declines. Each layer's own
 *    compiler enforces its half -- check:angular already runs ngc
 *    --strictTemplates.
 *  - That `shape` is accurate. It is hand-written prose and no gate reads it.
 *    It exists to make a divergence in KIND legible to a person.
 *  - That the APIs SHOULD converge. They should not. Angular's flat inputs and
 *    React's object prop are two correct spellings of one capability, and a
 *    green run means "classified", never "the same".
 *
 *   bun scripts/check-api-contracts.mjs   -> exit 0 if every component declares
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CONTRACT_DIR, GAP_FORMS, LAYER_IDIOM_MEMBERS,
  validateContract, validateApiBinding, classifyPair,
} from './lib/api-contracts.mjs';
import { reactProps, angularMembers } from './lib/api-members.mjs';
import { reactComponents, angularPrimitives } from './lib/behaviour-contracts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const text = (path) => readFileSync(path, 'utf8');

/** React components live in group directories; find the one holding a
 *  component. Identical to check-behaviour.mjs's own list, and deliberately
 *  duplicated rather than shared: the two gates are independent, and a shared
 *  constant would make one fail for the other's reason. */
export const REACT_GROUPS = ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation'];

export function reactApiPath(rootDir, component, suffix = '.api.json') {
  for (const group of REACT_GROUPS) {
    const path = join(rootDir, 'frameworks/react/components', group, `${component}${suffix}`);
    if (existsSync(path)) return path;
  }
  return null;
}

/** Assertions 2 and 3, both directions of the same comparison.
 *  @param {string[]} declared every member the layer's source really declares
 *  @param {Set<string>} claimed every member some capability's binding names
 *  @param {Map<string,string>} idiom that layer's idiom members
 *  @returns {string[]} */
export function orphanProblems(layer, component, declared, claimed, idiom) {
  const problems = [];
  const present = new Set(declared);
  for (const member of claimed) {
    if (!present.has(member)) {
      problems.push(`${layer}/${component}: binding claims member "${member}", but the source does not declare it — the component moved and the binding did not`);
    }
  }
  for (const member of declared) {
    if (claimed.has(member) || idiom.has(member)) continue;
    problems.push(`${layer}/${component}: member "${member}" is declared but no capability claims it — contract it, or add it to LAYER_IDIOM_MEMBERS with a reason`);
  }
  return problems;
}

/** The idiom map's own stale-entry rule: an entry naming a member no source in
 *  that layer declares any more is a lie left behind by a deletion.
 *  @param {Map<string,string>} idiom
 *  @param {Set<string>} everyDeclaredMember across the whole layer
 *  @returns {string[]} */
export function idiomStaleProblems(layer, idiom, everyDeclaredMember) {
  const problems = [];
  for (const member of idiom.keys()) {
    if (!everyDeclaredMember.has(member)) {
      problems.push(`${layer}: LAYER_IDIOM_MEMBERS entry "${member}" is stale — no component in this layer declares it any more`);
    }
  }
  return problems;
}

const claimedMembers = (binding) =>
  new Set(Object.values(binding).flatMap((entry) => entry.members ?? []));

async function main() {
  const problems = [];
  let gaps = 0;

  /* 1. Every React component has a contract, and every contract is well formed. */
  const contracts = new Map();
  const components = reactComponents(root);
  for (const component of components) {
    const path = join(root, CONTRACT_DIR, `${component}.api.json`);
    if (!existsSync(path)) {
      problems.push(`${component}: no ${CONTRACT_DIR}/${component}.api.json — every component declares what it OFFERS, including a presentational one`);
      continue;
    }
    const contract = read(path);
    problems.push(...validateContract(component, contract));
    contracts.set(component, contract);
  }

  /* A contract for something React does not have is stale. */
  for (const file of readdirSync(join(root, CONTRACT_DIR))) {
    if (!file.endsWith('.api.json')) continue;
    const component = file.slice(0, -'.api.json'.length);
    if (!contracts.has(component)) {
      problems.push(`${component}: a contract exists for a component React no longer has`);
    }
  }

  /* 2. React binds every capability, and its bindings describe the real .d.ts. */
  const reactBindings = new Map();
  const reactDeclared = new Set();
  for (const [component, contract] of contracts) {
    const bindingPath = reactApiPath(root, component);
    const typesPath = reactApiPath(root, component, '.d.ts');
    if (!bindingPath) {
      problems.push(`react/${component}: no ${component}.api.json beside the component`);
      continue;
    }
    const binding = read(bindingPath);
    problems.push(...validateApiBinding(component, 'react', binding, contract));
    const declared = reactProps(text(typesPath), component);
    for (const member of declared) reactDeclared.add(member);
    problems.push(...orphanProblems('react', component, declared, claimedMembers(binding),
      LAYER_IDIOM_MEMBERS.get('react')));
    reactBindings.set(component, binding);
  }

  /* 3. Every Angular primitive binds, and its bindings describe the real class. */
  const angularBindings = new Map();
  const angularDeclared = new Set();
  for (const name of angularPrimitives(root)) {
    const dir = join(root, 'frameworks/angular/primitives', name);
    const bindingPath = join(dir, `${name}.api.json`);
    if (!existsSync(bindingPath)) {
      problems.push(`angular/${name}: no ${name}.api.json`);
      continue;
    }
    const binding = read(bindingPath);
    const component = binding.component;
    if (!component) {
      problems.push(`angular/${name}: must declare "component", naming its React counterpart (e.g. "StatCard" for stat-card) — an Angular directory is kebab-case and its React name is Pascal, and nothing recovers one from the other`);
      continue;
    }
    const contract = contracts.get(component);
    if (!contract) {
      problems.push(`angular/${name}: component "${component}" has no contract — mistyped, or React dropped it`);
      continue;
    }
    const { component: _, ...capabilities } = binding;
    problems.push(...validateApiBinding(component, 'angular', capabilities, contract));
    const declared = angularMembers(text(join(dir, `${name}.ts`)));
    for (const member of declared) angularDeclared.add(member);
    problems.push(...orphanProblems('angular', name, declared, claimedMembers(capabilities),
      LAYER_IDIOM_MEMBERS.get('angular')));
    angularBindings.set(component, capabilities);
  }

  /* 4. Every React component Angular has no primitive for is declared in the
   *    delegated file. Coverage is EVERY layer, never "at least one": a
   *    component nobody declares for Angular is exactly the silence this gate
   *    exists to end. Declaring these not-applicable would be a lie -- Angular
   *    DOES have a button, it is matButton, and behaviour-delegated.json
   *    already models exactly this distinction for behaviour. */
  const delegatedPath = join(root, 'frameworks/angular/api-delegated.json');
  const delegatedFile = existsSync(delegatedPath) ? read(delegatedPath) : {};
  /* `$`-prefixed keys are file-level metadata, not components -- api-delegated.json
   * carries $materialVersion and $note. Strip them once, here, so no later loop has
   * to remember they exist. */
  const delegated = Object.fromEntries(
    Object.entries(delegatedFile).filter(([k]) => !k.startsWith('$')));
  for (const [component, contract] of contracts) {
    if (angularBindings.has(component)) continue;
    const entry = delegated[component];
    if (!entry) {
      problems.push(`angular/${component}: no primitive and no entry in api-delegated.json — say which Material control provides it, or that nothing does`);
      continue;
    }
    if (!entry.delegatedTo) {
      problems.push(`angular/${component}: delegated entry must name what provides the API, e.g. "Angular Material matButton"`);
    }
    const { delegatedTo: _d, reason: _r, ...capabilities } = entry;
    problems.push(...validateApiBinding(component, 'angular-delegated', capabilities, contract));
  }

  /* 5. Stale delegated entries: an entry for a component that now HAS a
   *    primitive, or that React no longer has at all. */
  for (const component of Object.keys(delegated)) {
    if (angularBindings.has(component)) {
      problems.push(`angular/${component}: delegated API entry is stale — an arena-* primitive now exists for it`);
    } else if (!contracts.has(component)) {
      problems.push(`angular/${component}: delegated API entry names a component React no longer has`);
    }
  }

  /* 6. Every cross-layer form pair is one somebody classified. This is the
   *    assertion the whole layer exists for: object-prop against flat-inputs is
   *    a known-good pair and needs no attention, node-prop against icon-name is
   *    two different capabilities sharing one name. In a prose record those two
   *    look identical. */
  for (const [component, reactBinding] of reactBindings) {
    const other = angularBindings.get(component)
      ?? (delegated[component] ? { ...delegated[component] } : null);
    if (!other) continue;
    delete other.delegatedTo; delete other.reason; delete other.component;
    for (const [capability, entry] of Object.entries(reactBinding)) {
      const counterpart = other[capability];
      if (!counterpart) continue;
      const problem = classifyPair(component, capability,
        { layer: 'react', ...entry }, { layer: 'angular', ...counterpart });
      if (problem) problems.push(problem);
    }
  }

  /* 7. The idiom map's own stale-entry rule. */
  problems.push(...idiomStaleProblems('react', LAYER_IDIOM_MEMBERS.get('react'), reactDeclared));
  problems.push(...idiomStaleProblems('angular', LAYER_IDIOM_MEMBERS.get('angular'), angularDeclared));

  /* Count the real gaps. This number, not the exit code, is what anybody
   * should be driving to zero -- a green run with 12 gaps is a correctly
   * DECLARED tree with 12 things Angular consumers cannot do. */
  for (const binding of [...reactBindings.values(), ...angularBindings.values(), ...Object.values(delegated)]) {
    for (const entry of Object.values(binding)) {
      if (entry && GAP_FORMS.has(entry.form)) gaps += 1;
    }
  }

  if (problems.length) {
    console.error(`check-api-contracts: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(
    `check-api-contracts: ${contracts.size} contract(s); ${reactBindings.size} react`
    + ` + ${angularBindings.size} angular + ${Object.keys(delegated).length} delegated binding(s),`
    + ` all coherent. ${gaps} declared gap(s) — see every "unsupported" reason.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/check-api-contracts.test.mjs`
Expected: PASS, 6 tests. The `main()` guard is what makes this possible — importing the module for its pure helpers must not run the walk or call `process.exit`.

- [ ] **Step 5: Run the gate itself and confirm it fails loudly**

```bash
mkdir -p behaviour/contracts && touch behaviour/contracts/.gitkeep
bun scripts/check-api-contracts.mjs; echo "exit=$?"
```

Expected: `exit=1`, and 43 problems, each of the form `ActivityFeed: no behaviour/contracts/ActivityFeed.api.json — every component declares what it OFFERS, including a presentational one`. This is the gate working. It stays red until Task 10.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-api-contracts.mjs scripts/check-api-contracts.test.mjs behaviour/contracts/.gitkeep
git commit -m "feat(api): the capability contract gate, not yet wired into check-all"
```

---

### Task 4: The citation check (D5)

**Files:**
- Modify: `scripts/check-api-contracts.mjs` (add `citationProblems` and call it from `main()`)
- Modify: `scripts/check-api-contracts.test.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces: `normalizeHeading(s: string): string`, `citationProblems(files: {path: string, text: string}[], headings: Map<string, Set<string>>): string[]`.

**Why this exists and why it lives here.** 14 files outside `docs/superpowers/` cite `components-divergences.md`, and they cite sections as **quoted prose**, not URL anchors — `"ConfirmDialog -- Angular is accessible, React is not yet"`, `'CommandPalette -- running a command does not close the palette in Angular'`, `"The Tailwind layer is border-box; React is content-box"`. Deleting a cited section breaks the citation and **nothing fails today**. Task 12 deletes six sections and moves nine more, so the check has to exist *before* the migration that needs it. It lives inside `check:api` rather than as `check:citations` so the gate count stays at twenty-one.

**What it can and cannot check.** A citation that quotes a title is checkable. A citation that names only the path (`confirm-dialog.ts:65`, `doughnut-chart.prompt.md:56`) has nothing to resolve, and the check reports those as a count in its summary rather than failing them — a rule that failed them would be demanding prose it cannot specify.

- [ ] **Step 1: Write the failing test**

Append to `scripts/check-api-contracts.test.mjs`:

```js
import { normalizeHeading, citationProblems } from './check-api-contracts.mjs';

test('normalizeHeading folds both dash spellings and case', () => {
  assert.equal(
    normalizeHeading('ConfirmDialog -- Angular is accessible, React is not yet'),
    normalizeHeading('ConfirmDialog — Angular is accessible, React is not yet'));
  assert.equal(normalizeHeading('  A  B '), normalizeHeading('a b'));
});

test('a quoted title that resolves to a heading passes', () => {
  const headings = new Map([['components-divergences.md', new Set([
    normalizeHeading('ConfirmDialog — Angular is accessible, React is not yet'),
  ])]]);
  const files = [{ path: 'x.ts', text: 'see components-divergences.md, "ConfirmDialog -- Angular is accessible, React is not yet".' }];
  assert.deepEqual(citationProblems(files, headings), []);
});

test('a quoted title that resolves to nothing fails and names both sides', () => {
  const headings = new Map([['components-divergences.md', new Set([normalizeHeading('Something else')])]]);
  const files = [{ path: 'x.ts', text: 'see components-divergences.md`s "StatCard -- delta is one object prop in React".' }];
  const problems = citationProblems(files, headings);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /x\.ts/);
  assert.match(problems[0], /StatCard/);
});

test('a title quoted near one file resolves against the OTHER cited file too', () => {
  const headings = new Map([
    ['components-divergences.md', new Set()],
    ['rendering-divergences.md', new Set([normalizeHeading('BarChart — the category axis is drawn per bar, not per label')])],
  ]);
  const files = [{ path: 'x.md', text: 'see components-divergences.md, "BarChart -- the category axis is drawn per bar, not per label"' }];
  assert.deepEqual(citationProblems(files, headings), [],
    'a citation whose section has MOVED to the sibling record is redirected, not broken');
});

test('a bare-path citation is not a failure', () => {
  const headings = new Map([['components-divergences.md', new Set()]]);
  const files = [{ path: 'x.ts', text: 'See `components-divergences.md` at the repo root for why.' }];
  assert.deepEqual(citationProblems(files, headings), []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/check-api-contracts.test.mjs`
Expected: FAIL — `normalizeHeading is not a function` / `citationProblems is not a function`.

- [ ] **Step 3: Implement**

Add to `scripts/check-api-contracts.mjs`, above `main()`:

```js
/* --- D5: citations into the divergence records ---------------------------
 *
 * 14 files outside docs/superpowers/ cite components-divergences.md, and they
 * cite SECTIONS as quoted prose rather than as anchors -- "ConfirmDialog --
 * Angular is accessible, React is not yet". Deleting a cited section breaks the
 * citation and nothing fails. This plan deletes six sections and moves nine,
 * so the check has to exist before the migration that needs it.
 *
 * docs/superpowers/ is excluded on purpose: specs and plans are deleted once
 * executed (24f250b), so a citation from one is not a live citation.
 *
 * A citation quoting a title is checkable. A citation naming only the path has
 * nothing to resolve, and demanding prose this check cannot specify would make
 * it noise. Those are counted, never failed. */
export const CITED_RECORDS = ['components-divergences.md', 'rendering-divergences.md'];

/** Fold the two dash spellings, case, and runs of whitespace, so a citation
 *  written with `--` still matches a heading written with an em dash. */
export function normalizeHeading(s) {
  return s.replace(/[‐-―]|--/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** @param {{path: string, text: string}[]} files
 *  @param {Map<string, Set<string>>} headings record filename -> normalized headings
 *  @returns {string[]} */
export function citationProblems(files, headings) {
  const problems = [];
  const known = new Set([...headings.values()].flatMap((set) => [...set]));
  const citation = new RegExp(`(${CITED_RECORDS.join('|').replace(/\./g, '\\.')})([\\s\\S]{0,240})`, 'g');
  const quoted = /["'‘’“”]([^"'‘’“”\n]{12,160})["'‘’“”]/g;

  for (const { path, text } of files) {
    for (const [, record, tail] of text.matchAll(citation)) {
      for (const [, title] of tail.matchAll(quoted)) {
        const normalized = normalizeHeading(title);
        if (known.has(normalized)) break;
        problems.push(
          `${path}: cites ${record} and quotes "${title}", which is not a heading in any divergence record.`
          + ` A section was renamed, moved or deleted and this citation was not redirected.`);
        break;
      }
    }
  }
  return problems;
}

/** Every markdown heading in a record, normalized. */
function recordHeadings(rootDir) {
  const out = new Map();
  for (const record of CITED_RECORDS) {
    const path = join(rootDir, record);
    const set = new Set();
    if (existsSync(path)) {
      for (const [, title] of text(path).matchAll(/^#{2,4}\s+(.+)$/gm)) set.add(normalizeHeading(title));
    }
    out.set(record, set);
  }
  return out;
}

/** Every tracked file that could carry a citation. `git ls-files` rather than a
 *  walk, so node_modules and generated output are excluded by construction. */
function citingFiles(rootDir) {
  const listed = spawnSync('git', ['ls-files'], { cwd: rootDir, encoding: 'utf8' });
  const paths = listed.stdout.split('\n')
    .filter((p) => /\.(md|mjs|ts|tsx|jsx|json)$/.test(p))
    .filter((p) => !p.startsWith('docs/superpowers/'))
    .filter((p) => !CITED_RECORDS.includes(p));
  return paths
    .map((p) => ({ path: p, text: text(join(rootDir, p)) }))
    .filter((f) => CITED_RECORDS.some((r) => f.text.includes(r)));
}
```

Add the import at the top of the file:

```js
import { spawnSync } from 'node:child_process';
```

And in `main()`, immediately before the `if (problems.length)` block:

```js
  /* 8. Every quoted citation into a divergence record still resolves. */
  const files = citingFiles(root);
  problems.push(...citationProblems(files, recordHeadings(root)));
```

Then extend the success line to report the unverifiable citations, replacing the final `console.log` call's template with:

```js
  console.log(
    `check-api-contracts: ${contracts.size} contract(s); ${reactBindings.size} react`
    + ` + ${angularBindings.size} angular + ${Object.keys(delegated).length} delegated binding(s),`
    + ` all coherent. ${gaps} declared gap(s) — see every "unsupported" reason.`
    + ` ${files.length} file(s) cite a divergence record; those quoting a section title resolve.`,
  );
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/check-api-contracts.test.mjs`
Expected: PASS, 11 tests.

- [ ] **Step 5: Confirm the citation half is green against today's tree**

```bash
bun scripts/check-api-contracts.mjs 2>&1 | grep -i 'cites' || echo "no citation problems"
```

Expected: `no citation problems`. Every citation resolves today, because nothing has moved yet. If one does **not** resolve, that is a pre-existing broken citation this plan just found — fix the citing file's quoted title to match the real heading, in this task, and say so in the commit message.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-api-contracts.mjs scripts/check-api-contracts.test.mjs
git commit -m "feat(api): fail a citation quoting a divergence section that no longer exists"
```

---

## Tasks 5–9: writing the contracts and bindings

These five tasks are one job done five times, once per group. **Read this preamble before starting any of them; it is not repeated per task.**

**The procedure, per component:**

1. Read the component's `.d.ts` and, if Angular has a primitive, its `<name>.ts`.
2. Write `behaviour/contracts/<Component>.api.json` **by hand**. Do not paste the `.d.ts` and rename fields — that makes React the reference layer by construction, which contradicts plan 7's finding that Angular is the accessible reference more often. Ask what the component *offers*, then check both layers spell it.
3. `shape` is descriptive prose-in-a-string, and no gate reads it. Write the union out for a small closed set (`"'up'|'down'"`); write an object for a compound value; write `"icon-ref"`, `"node"`, `"string[]"` and the like where a precise type would be a lie across layers.
4. Write the React binding beside the `.jsx`. Write the Angular binding beside the primitive, **with a `component` field naming the React counterpart** — a kebab-case directory does not recover a Pascal name.
5. Run `bun scripts/check-api-contracts.mjs` and read only the lines naming components in this group. It will report the rest of the tree as missing until Task 10; that is expected.
6. Commit per group.

**A form is a claim; make it a true one.**
- `unsupported` means *this layer could offer it and does not*. It is a real gap, it is what the gate counts, and someone will eventually close it.
- `not-applicable` means *this layer should never offer it*. React's `style` against Angular is the archetype: Angular's consumer already owns the host element, so there is nothing to offer.
- Getting these two backwards is the exact conflation this whole layer exists to end. If you are unsure, ask: *could a reasonable person file an issue asking for this?* Yes → `unsupported`.

**When a form pair is unclassified**, the gate fails and offers two exits. Take the right one:
- The two really are one capability spelled two ways → add the pair to `COMPATIBLE_PAIRS` in `scripts/lib/api-contracts.mjs` **with a reason**, and add an assertion for it to `scripts/api-contracts.test.mjs`.
- They really are different capabilities sharing a name → put a `reason` on the binding saying so. `StatCard.icon` is the archetype and is spelled out in Task 6.

**Never edit a component to make a binding pass.** If the gate says a member does not exist, the binding is wrong.

**`children` is a capability, not idiom.** Seven `.d.ts` declare it; it binds `node-prop` in React and `content-slot` in Angular, which is a classified pair.

---

### Task 5: Contracts and bindings — `forms` (9 components)

**Files:**
- Create: `behaviour/contracts/{Button,Checkbox,IconButton,Input,Radio,Select,Switch,Textarea,ThemeToggle}.api.json`
- Create: `frameworks/react/components/forms/{Button,Checkbox,IconButton,Input,Radio,Select,Switch,Textarea,ThemeToggle}.api.json`
- Create: `frameworks/angular/primitives/theme-toggle/theme-toggle.api.json`
- Delete: `behaviour/contracts/.gitkeep`

**Interfaces:**
- Consumes: the gate and vocabulary from Tasks 1–4.
- Produces: 9 contracts and 10 bindings. Later tasks consume no names from this one.

**Group shape:** `ThemeToggle` is the only one of the nine with an Angular primitive. The other eight are Material's — `matButton`, `mat-checkbox`, `matIconButton`, `matInput`, `mat-radio-button`, `mat-select`, `mat-slide-toggle`, `matInput` on a textarea — and their Angular side is declared in Task 10's `api-delegated.json`, not here. Do not write Angular bindings for them in this task; the gate will report them missing until Task 10, which is correct.

Eight of the nine `.d.ts` in this group extend a `React.*HTMLAttributes<...>`. That costs nothing: the reader returns own members only.

- [ ] **Step 1: Write the worked example — `Button`**

Read `frameworks/react/components/forms/Button.d.ts` first, then create `behaviour/contracts/Button.api.json`:

```json
{
  "component": "Button",
  "capabilities": [
    { "name": "children", "kind": "slot", "required": true,
      "shape": "node — the label, and any leading icon the caller composes" },
    { "name": "variant", "kind": "input", "required": false,
      "shape": "'primary'|'secondary'|'ghost'|'danger' — danger is outline, never filled" },
    { "name": "size", "kind": "input", "required": false, "shape": "'sm'|'md'|'lg'" },
    { "name": "loading", "kind": "input", "required": false,
      "shape": "boolean — reports work in progress; the motion slows under prefers-reduced-motion rather than stopping" }
  ]
}
```

Adjust the capability list to whatever `Button.d.ts` actually declares — the list above is the shape, not a transcription. Then create `frameworks/react/components/forms/Button.api.json`:

```json
{
  "children": { "form": "node-prop", "members": ["children"] },
  "variant": { "form": "object-prop", "members": ["variant"] },
  "size": { "form": "object-prop", "members": ["size"] },
  "loading": { "form": "object-prop", "members": ["loading"] }
}
```

**Note what is deliberately absent: `style`.** `Button.d.ts` declares it, so something must account for it or the no-orphan assertion fires. Two accounts are possible — contract it as a capability with a `passthrough` React binding and a `not-applicable` Angular one, or leave it out of the contract entirely and let `LAYER_IDIOM_MEMBERS` absorb it. **Take the second, for every one of the 43.** The first is technically valid and produces 29 identical capabilities and 29 identical `not-applicable` bindings, burying the handful of real gaps in noise — which is exactly the failure the global rule was chosen (Q4) to avoid. `style` is React's escape hatch, not a capability Arena designs. The choice is recorded here once so nobody re-litigates it per component.

The `passthrough` form still exists in the vocabulary for a genuine case: a capability Arena *does* design that a layer implements by forwarding rather than interpreting. If no such case turns up across all 43, Task 11 removes `passthrough` when it freezes the vocabulary.

- [ ] **Step 2: Verify the worked example against the gate**

```bash
bun scripts/check-api-contracts.mjs 2>&1 | grep -E '(^|/)Button' || echo "Button clean"
```

Expected: `Button clean`, or a precise complaint naming a member. If it names a member `Button.d.ts` declares that no capability claims, contract it — do not add it to the idiom map. The idiom map is for `style` and nothing else until a second member proves it deserves an entry.

- [ ] **Step 3: Repeat for the remaining eight**

`Checkbox`, `IconButton`, `Input`, `Radio`, `Select`, `Switch`, `Textarea`, `ThemeToggle`. One contract and one React binding each, following the same procedure.

Two known specifics in this group:
- `Textarea.d.ts` extends `Omit<React.TextareaHTMLAttributes<...>, 'style'>` — it removes `style` from the inherited surface, and may or may not re-declare it as an own member. Read the file; bind what is there.
- `Input.d.ts` extends `Omit<React.InputHTMLAttributes<...>, 'prefix'>`, so `prefix` is Arena's own and is a capability.

- [ ] **Step 4: Write `ThemeToggle`'s Angular binding**

Read `frameworks/angular/primitives/theme-toggle/theme-toggle.ts`, then create `frameworks/angular/primitives/theme-toggle/theme-toggle.api.json`:

```json
{
  "component": "ThemeToggle",
  "<capability>": { "form": "<form>", "members": ["<member>"] }
}
```

Fill in one entry per capability in `behaviour/contracts/ThemeToggle.api.json`, binding each to the members `angularMembers()` finds. To see exactly what the reader sees:

```bash
node --input-type=module -e "
import { angularMembers } from './scripts/lib/api-members.mjs';
import { readFileSync } from 'node:fs';
console.log(angularMembers(readFileSync('frameworks/angular/primitives/theme-toggle/theme-toggle.ts','utf8')));
"
```

Use that list verbatim; it is what the gate will compare against.

- [ ] **Step 5: Verify the group**

```bash
bun scripts/check-api-contracts.mjs 2>&1 | grep -E 'Button|Checkbox|IconButton|Input|Radio|Select|Switch|Textarea|ThemeToggle|theme-toggle'
```

Expected: only lines of the form `angular/<Component>: no primitive and no entry in api-delegated.json` for the eight Material-provided controls. Any other line naming a component in this group is a real problem and must be fixed before committing.

- [ ] **Step 6: Commit**

```bash
git rm behaviour/contracts/.gitkeep
git add behaviour/contracts frameworks/react/components/forms frameworks/angular/primitives/theme-toggle
git commit -m "feat(api): contracts and bindings for the forms group"
```

---

### Task 6: Contracts and bindings — `display` (10 components)

**Files:**
- Create: `behaviour/contracts/{ActivityFeed,Avatar,Badge,Calendar,Card,Skeleton,StatCard,Table,Tag,UnauthCard}.api.json`
- Create: the matching 10 `frameworks/react/components/display/*.api.json`
- Create: `frameworks/angular/primitives/{activity-feed,avatar,skeleton,stat-card,tag,unauth-card}/<name>.api.json` — **check which of these directories exist before writing**; `frameworks/angular/primitives/` is the authority, not this list.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: 10 contracts; React bindings for all 10; Angular bindings for every primitive in this group that exists.

**This is the task that surfaces the spec's headline finding.** Follow the preamble above for the other nine, and treat `StatCard` exactly as follows.

- [ ] **Step 1: Write `StatCard`'s contract**

Create `behaviour/contracts/StatCard.api.json`:

```json
{
  "component": "StatCard",
  "capabilities": [
    { "name": "label", "kind": "input", "required": true,
      "shape": "string — short uppercase microlabel, at most two words" },
    { "name": "value", "kind": "input", "required": true,
      "shape": "string — preformatted; StatCard never formats" },
    { "name": "tone", "kind": "input", "required": false,
      "shape": "'neutral'|'accent'|'gold'|'success'|'warning'|'danger'|'info' — what the number IS, not how it moved" },
    { "name": "delta", "kind": "input", "required": false,
      "shape": { "value": "string", "direction": "'up'|'down'", "tone": "'positive'|'negative'|'neutral'" } },
    { "name": "sub", "kind": "input", "required": false,
      "shape": "string — small muted line under the value" },
    { "name": "icon", "kind": "input", "required": false,
      "shape": "icon-ref — a Phosphor icon at roughly 14px, rendered muted. The two layers accept DIFFERENT things here; see the bindings." }
  ]
}
```

- [ ] **Step 2: Write both bindings, including the divergence nobody recorded**

Create `frameworks/react/components/display/StatCard.api.json`:

```json
{
  "label": { "form": "object-prop", "members": ["label"] },
  "value": { "form": "object-prop", "members": ["value"] },
  "tone":  { "form": "object-prop", "members": ["tone"] },
  "delta": { "form": "object-prop", "members": ["delta"] },
  "sub":   { "form": "object-prop", "members": ["sub"] },
  "icon":  { "form": "node-prop",   "members": ["icon"] }
}
```

Create `frameworks/angular/primitives/stat-card/stat-card.api.json`:

```json
{
  "component": "StatCard",
  "label": { "form": "flat-inputs", "members": ["label"] },
  "value": { "form": "flat-inputs", "members": ["value"] },
  "tone":  { "form": "flat-inputs", "members": ["tone"] },
  "delta": { "form": "flat-inputs", "members": ["deltaValue", "deltaDirection", "deltaTone"] },
  "sub":   { "form": "flat-inputs", "members": ["sub"] },
  "icon":  { "form": "icon-name",   "members": ["icon"],
             "reason": "NOT two spellings of one capability. React's `icon` is `React.ReactNode` and accepts any element the caller composes. Angular's is `input<string>()` rendered as `<i [class]=\"glyph\">`, so it accepts a Phosphor CLASS STRING and nothing else — a caller cannot pass a composed node, and a caller passing a bare icon name without the `ph-` classes gets nothing. This divergence is not in components-divergences.md and was found by writing this contract, which is the whole reason the contract layer exists." }
}
```

- [ ] **Step 3: Watch the gate catch it, then watch the reason silence it**

Temporarily delete the `reason` line from the Angular `icon` entry and run:

```bash
bun scripts/check-api-contracts.mjs 2>&1 | grep 'StatCard.icon'
```

Expected: `StatCard.icon: react binds "node-prop", angular binds "icon-name", and that is not a classified pair. ...`

Restore the `reason` and run again. Expected: no `StatCard.icon` line. **This is the assertion the whole gate exists for; see it work once, by hand.**

- [ ] **Step 4: Do the other nine**

`ActivityFeed`, `Avatar`, `Badge`, `Calendar`, `Card`, `Skeleton`, `Table`, `Tag`, `UnauthCard`.

Two specifics:
- **`UnauthCard`'s `style`** is one of the six API sections `components-divergences.md` records ("only the `style`/`...rest` prop has no counterpart"). With `style` covered by the global idiom rule it produces no capability, no binding and no gap — and Task 12 deletes that section. That is the correct outcome, not an oversight: the section documented React idiom, not a missing Angular capability.
- **`Tag`** is the one component whose React namesake and Angular primitive are a known mapping exception in plan 7 (`SOURCE_OVERRIDES` in `check-manifest-states.mjs` maps `Tag.manifest.json` to `tag.ts`). Here it needs nothing special — the Angular binding's `component: "Tag"` field carries the mapping explicitly, which is exactly why that field exists.

- [ ] **Step 5: Verify the group**

```bash
bun scripts/check-api-contracts.mjs 2>&1 | grep -E 'ActivityFeed|Avatar|Badge|Calendar|Card|Skeleton|StatCard|Table|Tag|UnauthCard|activity-feed|avatar|skeleton|stat-card|tag|unauth-card'
```

Expected: only `no primitive and no entry in api-delegated.json` lines for the components Material provides. Nothing else.

- [ ] **Step 6: Commit**

```bash
git add behaviour/contracts frameworks/react/components/display frameworks/angular/primitives
git commit -m "feat(api): contracts and bindings for the display group, including StatCard.icon's unrecorded divergence"
```

---

### Task 7: Contracts and bindings — `feedback` (10 components)

**Files:**
- Create: `behaviour/contracts/{Alert,ConfirmDialog,Dialog,EmptyState,ErrorState,Onboarding,ProgressBar,Spinner,Toast,Tooltip}.api.json`
- Create: the matching 10 `frameworks/react/components/feedback/*.api.json`
- Create: `frameworks/angular/primitives/{alert,confirm-dialog,empty-state,error-state,onboarding}/<name>.api.json` — again, verify against the real directory listing before writing.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: 10 contracts, 10 React bindings, and Angular bindings for every primitive in this group.

**This is the task that labels the one gap the spec already knew about.** Follow the preamble for the other nine; treat `ConfirmDialog` exactly as follows.

- [ ] **Step 1: Contract `ConfirmDialog`, including `width`**

Read `frameworks/react/components/feedback/ConfirmDialog.d.ts` and `frameworks/angular/primitives/confirm-dialog/confirm-dialog.ts`. Add to `behaviour/contracts/ConfirmDialog.api.json`, alongside its other capabilities:

```json
{ "name": "width", "kind": "input", "required": false,
  "shape": "number — panel width in px; a confirmation whose consequence needs more than a sentence to state needs a wider panel" }
```

- [ ] **Step 2: Bind it honestly on both sides**

In `frameworks/react/components/feedback/ConfirmDialog.api.json`:

```json
{ "width": { "form": "object-prop", "members": ["width"] } }
```

In `frameworks/angular/primitives/confirm-dialog/confirm-dialog.api.json`:

```json
{ "width": { "form": "unsupported", "members": [],
             "reason": "No width input; the Angular dialog is fixed-width. A REAL GAP, not idiom: a consumer who needs a wider confirmation can have one in React and cannot here, and nothing about Angular's idiom prevents an input for it. Recorded in components-divergences.md before this contract existed, where it read identically to five entries that needed no action at all." } }
```

`unsupported`, not `not-applicable`. Apply the test from the preamble: could a reasonable person file an issue asking for this? Yes. That is a gap.

- [ ] **Step 3: Confirm the gate counts it**

```bash
bun scripts/check-api-contracts.mjs 2>&1 | tail -1
```

The run still exits 1 while other groups are unwritten, but once Task 10 lands, the summary line's `N declared gap(s)` must include this one. Note the number you see now.

- [ ] **Step 4: Do the other nine**

`Alert`, `Dialog`, `EmptyState`, `ErrorState`, `Onboarding`, `ProgressBar`, `Spinner`, `Toast`, `Tooltip`.

Two specifics:
- **`error-state`** exposes a named slot through `contentChild(ArenaAction)` — its `action` field. React's counterpart is a node prop. That is the classified `node-prop`/`named-slot` pair and needs no reason.
- **`Tooltip`** is React-only as a primitive (Angular uses `matTooltip`), so its Angular side is Task 10's. Do not invent an Angular binding for it here.

- [ ] **Step 5: Verify the group**

```bash
bun scripts/check-api-contracts.mjs 2>&1 | grep -E 'Alert|ConfirmDialog|Dialog|EmptyState|ErrorState|Onboarding|ProgressBar|Spinner|Toast|Tooltip|alert|confirm-dialog|empty-state|error-state|onboarding'
```

Expected: only `no primitive and no entry in api-delegated.json` lines.

- [ ] **Step 6: Commit**

```bash
git add behaviour/contracts frameworks/react/components/feedback frameworks/angular/primitives
git commit -m "feat(api): contracts and bindings for the feedback group; ConfirmDialog's width is labelled a gap"
```

---

### Task 8: Contracts and bindings — `navigation` (9 components)

**Files:**
- Create: `behaviour/contracts/{Breadcrumbs,BulkActionBar,CommandPalette,Menu,PageHead,Pagination,SegmentedControl,SideNav,Tabs}.api.json`
- Create: the matching 9 `frameworks/react/components/navigation/*.api.json`
- Create: `frameworks/angular/primitives/{breadcrumbs,bulk-action-bar,command-palette,page-head}/<name>.api.json` — verify against the real listing.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: 9 contracts, 9 React bindings, and Angular bindings for every primitive in this group.

**This group exercises three of the four classified pairs**, so it is where the pair table earns its keep.

- [ ] **Step 1: `Breadcrumbs` — the event-prop / output pair**

`behaviour/contracts/Breadcrumbs.api.json`:

```json
{
  "component": "Breadcrumbs",
  "capabilities": [
    { "name": "items", "kind": "input", "required": true,
      "shape": "{ label: string, href?: string }[] — the last item is the current page and is never a link" },
    { "name": "separator", "kind": "input", "required": false,
      "shape": "node in React, string in Angular — rendered aria-hidden between crumbs" },
    { "name": "navigate", "kind": "output", "required": false,
      "shape": "{ crumb, event } — reports a crumb click and forwards the native event so a consumer can preventDefault and route in-app" }
  ]
}
```

`frameworks/react/components/navigation/Breadcrumbs.api.json`:

```json
{
  "items": { "form": "object-prop", "members": ["items"] },
  "separator": { "form": "node-prop", "members": ["separator"] },
  "navigate": { "form": "event-prop", "members": ["items"],
                "reason": "React has no navigate prop of its own: the callback is `onClick` on each Crumb inside `items`, so one member carries both the data capability and the event capability. Angular's single `navigate` output covers every item instead of a callback per crumb; see components-divergences.md's Breadcrumbs entry, migrated into these two bindings." }
}
```

`frameworks/angular/primitives/breadcrumbs/breadcrumbs.api.json`:

```json
{
  "component": "Breadcrumbs",
  "items": { "form": "flat-inputs", "members": ["items"] },
  "separator": { "form": "flat-inputs", "members": ["separator"] },
  "navigate": { "form": "output", "members": ["navigate"] }
}
```

Read `Breadcrumbs.d.ts` before writing the React binding and adjust to what it actually declares — the `separator` form in particular depends on whether it is typed `React.ReactNode`.

- [ ] **Step 2: `PageHead` — the named-slot pair, and a section that disappears**

`page-head.ts` exposes `actions` via `contentChild(ArenaActions)`; `PageHeadProps` declares `actions?: React.ReactNode`. Bind `node-prop` against `named-slot` — a classified pair, no reason needed.

`PageHeadProps` also declares `style`, which the global idiom rule absorbs. `components-divergences.md`'s "PageHead — behaviour matches React; only the `style`/`...rest` prop has no counterpart" therefore produces no capability, no binding and no gap, and Task 12 deletes it. Same outcome as `UnauthCard`'s, for the same reason.

- [ ] **Step 3: Do the other seven**

`BulkActionBar`, `CommandPalette`, `Menu`, `Pagination`, `SegmentedControl`, `SideNav`, `Tabs`.

One specific: **`bulk-action-bar`** has two outputs (`run`, `cleared`) where React has callback props, and `components-divergences.md` records that Clear is unconditional in Angular and optional in React. That is a *behaviour* divergence, D1 keeps it as prose, and it stays in the file. If the API shapes differ too — a `clearable` input React has and Angular does not, or the reverse — that half is this task's, and it binds `unsupported` with a reason. Read both sources and decide; do not assume.

- [ ] **Step 4: Verify the group**

```bash
bun scripts/check-api-contracts.mjs 2>&1 | grep -E 'Breadcrumbs|BulkActionBar|CommandPalette|Menu|PageHead|Pagination|SegmentedControl|SideNav|Tabs|breadcrumbs|bulk-action-bar|command-palette|page-head'
```

Expected: only `no primitive and no entry in api-delegated.json` lines.

- [ ] **Step 5: Commit**

```bash
git add behaviour/contracts frameworks/react/components/navigation frameworks/angular/primitives
git commit -m "feat(api): contracts and bindings for the navigation group"
```

---

### Task 9: Contracts and bindings — `charts` (4) and `brand` (1)

**Files:**
- Create: `behaviour/contracts/{BarChart,ChartCard,DoughnutChart,LineChart,AppLogo}.api.json`
- Create: `frameworks/react/components/charts/{BarChart,ChartCard,DoughnutChart,LineChart}.api.json`
- Create: `frameworks/react/components/brand/AppLogo.api.json`
- Create: `frameworks/angular/primitives/{bar-chart,chart-card,doughnut-chart,line-chart,app-logo}/<name>.api.json`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: 5 contracts and 10 bindings. This completes all 43 contracts.

**Why the charts are in and not excluded (Q5).** They are already the styling layer's declared exception — no manifest, no `.variants.ts`, token-valued camelCase `[style]` objects. A second exception, this time with no gate watching it, is how drift accumulated the last time. And their surface is not only data: `seriesLabel`, `tone` and the chart-card wrapper are affordances a consumer chooses, and the no-orphan assertion is meaningless if it skips three of the layer's dual-implemented components.

- [ ] **Step 1: Contract the three SVG charts**

Read all six sources first (`BarChart.d.ts`, `LineChart.d.ts`, `DoughnutChart.d.ts` and the three `frameworks/angular/primitives/*-chart/*.ts`). Express each series capability with an honest `shape` — a data series is `"{ label: string, value: number }[]"`, not `"object"`.

Two things to expect and record faithfully rather than paper over:
- **`seriesLabel`.** CLAUDE.md's *Known debt* records that with no `seriesLabel` the Angular charts emit a constant `aria-label` ("Bar chart"), and that `doughnut-chart.ts`'s is a literal with no caller-supplied path at all. If `doughnut-chart.ts` genuinely offers no way to name the chart, that capability binds `unsupported` on the Angular side with a reason citing the existing debt entry — and the gate then counts a gap that was previously only prose. **That is a correct outcome. Do not suppress it to keep the count low.**
- **Units.** `components-divergences.md` records that `chart-internals`' visually-hidden style carries its units in Angular. That is a *rendering* divergence, it goes to `rendering-divergences.md` in Task 12, and it is not an API capability. Do not contract it.

- [ ] **Step 2: `ChartCard` — the named-slot pair again**

`chart-card.ts` exposes `actions` via `contentChild(ArenaActions)`; React's is a node prop. Classified pair, no reason needed.

- [ ] **Step 3: `AppLogo` — the node-prop / content-slot pair, and a section that migrates**

`behaviour/contracts/AppLogo.api.json`:

```json
{
  "component": "AppLogo",
  "capabilities": [
    { "name": "name", "kind": "input", "required": true,
      "shape": "string — the product name beside or below the mark" },
    { "name": "dim", "kind": "input", "required": false,
      "shape": "string — a dimmed tail on the name, e.g. a suite suffix" },
    { "name": "size", "kind": "input", "required": false, "shape": "'sm'|'md'|'lg'|'xl'" },
    { "name": "orientation", "kind": "input", "required": false, "shape": "'horizontal'|'vertical'" },
    { "name": "mark", "kind": "slot", "required": true,
      "shape": "node — the brand mark. Nothing defaults; an empty call site is a bug at the call site." }
  ]
}
```

`frameworks/angular/primitives/app-logo/app-logo.api.json`:

```json
{
  "component": "AppLogo",
  "name": { "form": "flat-inputs", "members": ["name"] },
  "dim": { "form": "flat-inputs", "members": ["dim"] },
  "size": { "form": "flat-inputs", "members": ["size"] },
  "orientation": { "form": "flat-inputs", "members": ["orientation"] },
  "mark": { "form": "content-slot", "members": [] }
}
```

The React binding gives `mark` whatever member `AppLogo.d.ts` declares for it, with `form: "node-prop"`. `node-prop`/`content-slot` is a classified pair, and this is the fifth of the six API sections Task 12 deletes — it needed no action, which is precisely the finding.

- [ ] **Step 4: Verify — all 43 contracts now exist**

```bash
ls behaviour/contracts/*.api.json | wc -l
bun scripts/check-api-contracts.mjs 2>&1 | grep -c 'no behaviour/contracts'
```

Expected: `43` and `0`.

- [ ] **Step 5: Commit**

```bash
git add behaviour/contracts frameworks/react/components/charts frameworks/react/components/brand frameworks/angular/primitives
git commit -m "feat(api): contracts and bindings for the charts and brand groups — all 43 contracts exist"
```

---

### Task 10: `api-delegated.json` — the 22 controls Material provides

**Files:**
- Create: `frameworks/angular/api-delegated.json`

**Interfaces:**
- Consumes: the 43 contracts from Tasks 5–9, and the `delegated` form from Task 1.
- Produces: the file the gate's assertion 4 reads. After this task the gate has everything it needs to pass.

**Why `delegated` and not `not-applicable`.** Angular *does* have a button: it is `matButton`, dressed by `arena-material.css`. A `not-applicable` declaration would be false for it, and `behaviour-delegated.json` already models exactly this distinction for behaviour — `Calendar` is the single entry there where "absent" is genuinely true. Declaring a whole layer's worth of controls as inapplicable would be the same conflation this plan exists to end, one level up.

**What a delegated entry claims, and the honest limit of it.** It says *this capability is provided by that third-party control*. It does not say the control's API is shaped like Arena's, and no gate reads Material's source. CLAUDE.md already records the equivalent hazard for `behaviour-delegated.json`: every claim it makes about Material is unpinned, and the Material version it was verified against (22.0.5) is not recorded anywhere. **Do the better thing here**: put the verified version in the file itself, as a top-level field, so the next reader knows what the claims were true of.

- [ ] **Step 1: Get the exact 22**

```bash
node --input-type=module -e "
import { reactComponents, angularPrimitives } from './scripts/lib/behaviour-contracts.mjs';
import { readFileSync, existsSync } from 'node:fs';
const react = reactComponents('.');
const bound = new Set(angularPrimitives('.')
  .map(n => 'frameworks/angular/primitives/' + n + '/' + n + '.api.json')
  .filter(existsSync)
  .map(p => JSON.parse(readFileSync(p,'utf8')).component));
const missing = react.filter(c => !bound.has(c));
console.log(missing.length, missing.join(' '));
"
```

Expected: `22` and the list. Use that list, not a list written here — the directory is the authority.

- [ ] **Step 2: Read the behaviour file for the Material control names**

```bash
node -e "const d=require('./frameworks/angular/behaviour-delegated.json');for(const[k,v]of Object.entries(d))console.log(k.padEnd(20), v.delegatedTo)"
```

`behaviour-delegated.json` already names the Material control for each of the 22. Reuse those names verbatim so the two records agree; a component named `matButton` in one file and `MatButton` in the other is a discrepancy someone will eventually have to chase.

- [ ] **Step 3: Write the file**

Create `frameworks/angular/api-delegated.json`, one entry per component, every capability in that component's contract bound `delegated`:

```json
{
  "$materialVersion": "22.0.5",
  "$note": "Every claim here is about a third-party library and no gate reads Material's source. $materialVersion records what these claims were verified against; a Material upgrade that changes a control's API makes an entry silently false. This is the same hazard CLAUDE.md records for behaviour-delegated.json, which does NOT carry its verified version — that omission is why this field exists.",

  "Button": {
    "delegatedTo": "Angular Material matButton",
    "reason": "Material's button directive provides the label, the disabled state and the size/appearance variants; arena-material.css dresses it with Arena's tokens. Arena has no arena-button primitive and should not grow one.",
    "children": { "form": "delegated", "members": [] },
    "variant": { "form": "delegated", "members": [] },
    "size": { "form": "delegated", "members": [] },
    "loading": { "form": "unsupported", "members": [],
                 "reason": "matButton has no loading state of its own. React's Button renders a spinner and slows it under prefers-reduced-motion. A REAL GAP: a consumer wanting a busy button in Angular must build it. Nothing about Material's idiom prevents it." }
  }
}
```

Adjust `Button`'s capability names to whatever `behaviour/contracts/Button.api.json` really lists — the entry above shows the *shape*, and the gate will name any capability you miss.

**Do not reflexively write `delegated` for every capability.** Where Material's control genuinely lacks something React offers, that is `unsupported` with a reason, and it is a gap worth counting. The `loading` entry above is the archetype; expect several more across the 22. Getting this right is the entire value of the task — a file of 22 uniformly-`delegated` entries would be a rubber stamp.

- [ ] **Step 4: Run the gate — it should now be green**

```bash
bun scripts/check-api-contracts.mjs; echo "exit=$?"
```

Expected: `exit=0`, and a summary line naming the contract and binding counts and the declared-gap count.

If it is not green, the remaining problems are real and each names its file and member. Fix them here. Do not wire the gate into `check-all` until this exits 0.

- [ ] **Step 5: Commit**

```bash
git add frameworks/angular/api-delegated.json
git commit -m "feat(api): declare the 22 controls Angular Material provides, with the version verified against"
```

---

### Task 11: Freeze the vocabulary, wire the gate in

**Files:**
- Modify: `scripts/lib/api-contracts.mjs` (freeze `FORMS` and `COMPATIBLE_PAIRS`; add the closing note)
- Modify: `scripts/api-contracts.test.mjs` (assert both by literal value)
- Modify: `package.json`
- Modify: `scripts/check-all.mjs`
- Modify: `scripts/check-all.test.mjs`

**Interfaces:**
- Consumes: everything.
- Produces: `check:api` as gate twenty-one.

**Q1 and Q2 close here.** The vocabulary was allowed to grow across Tasks 5–10; whatever it grew into is now what it is. Freezing means the suite asserts the exact set by literal value, so adding a form later is a deliberate, reviewed edit to two files rather than a quiet append.

- [ ] **Step 1: Write the freezing assertions**

Append to `scripts/api-contracts.test.mjs`, substituting the **actual** contents of the two structures as they stand after Task 10:

```js
test('FORMS is frozen — adding one is a deliberate edit to this assertion too', () => {
  assert.deepEqual([...FORMS.keys()].sort(), [
    'content-slot', 'delegated', 'event-prop', 'flat-inputs', 'icon-name',
    'named-slot', 'node-prop', 'not-applicable', 'object-prop', 'output',
    'passthrough', 'unsupported',
  ]);
});

test('COMPATIBLE_PAIRS is frozen — every pair here says two layers spell ONE capability two ways', () => {
  assert.deepEqual(
    COMPATIBLE_PAIRS.map((p) => [p.a, p.b].sort().join('/')).sort(),
    ['event-prop/output', 'content-slot/node-prop', 'named-slot/node-prop', 'flat-inputs/object-prop'].sort());
});

test('LAYER_IDIOM_MEMBERS is frozen', () => {
  assert.deepEqual([...LAYER_IDIOM_MEMBERS.get('react').keys()], ['style']);
  assert.deepEqual([...LAYER_IDIOM_MEMBERS.get('angular').keys()], []);
});
```

If Tasks 5–10 added a form or a pair, put it in these arrays. If they added one *without a reason*, go back and write the reason — the "every compatible pair carries a written reason" test from Task 1 already enforces it, so this cannot slip.

- [ ] **Step 2: Run the tests**

Run: `bun test scripts/api-contracts.test.mjs`
Expected: PASS. A failure here means the arrays above do not match what the tasks actually produced — fix the arrays, not the module.

- [ ] **Step 3: Add the `check:api` script**

In `package.json`, after the `"check:compliance"` line:

```json
    "check:api": "bun scripts/check-api-contracts.mjs",
```

- [ ] **Step 4: Add the gate**

In `scripts/check-all.mjs`, in `GATES`, immediately after the `check:compliance` entry:

```js
  { name: 'check:api', file: 'check-api-contracts.mjs' },
```

And update the header comment: `The twenty gates in GATES below` becomes `The twenty-one gates in GATES below`.

- [ ] **Step 5: Update the gate-array assertions**

In `scripts/check-all.test.mjs`:

```js
test('GATES lists the twenty-one check gates', () => {
  assert.equal(GATES.length, 21);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:dtcg', 'check:tokens', 'check:script-tokens', 'check:duplicate-constants', 'check:ramp', 'check:tailwind', 'check:tailwind-generated', 'check:coverage', 'check:radius', 'check:arbitrary', 'check:dimensions', 'check:states', 'check:behaviour', 'check:compliance', 'check:api', 'check:fonts', 'check:vendor', 'check:demos', 'check:cards', 'check:angular', 'check:material'],
  );
});
```

The `check:material runs last` test at line 13 keeps passing — `check:api` goes in the middle, beside the other contract-layer gates.

- [ ] **Step 6: Verify**

```bash
bun run check:api; echo "exit=$?"
bun test scripts/check-all.test.mjs
```

Expected: `exit=0`; the suite passes.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/api-contracts.mjs scripts/api-contracts.test.mjs package.json scripts/check-all.mjs scripts/check-all.test.mjs
git commit -m "feat(api): freeze the form vocabulary and wire check:api in as gate twenty-one"
```

---

### Task 12: The record surgery

**Files:**
- Create: `rendering-divergences.md`
- Modify: `components-divergences.md`
- Modify: whichever citing files Task 4's check names

**Interfaces:**
- Consumes: Task 4's citation check, which is what makes this safe.
- Produces: two records where there was one, and six fewer sections in total.

**Three operations, in this order.** Do them one at a time and run `bun run check:api` after each — the citation check is the safety net and it only helps if you let it fire.

- [ ] **Step 1: Move the 9 rendering sections into a new record (D3)**

Create `rendering-divergences.md` at the repo root with this preamble, then move these sections into it **verbatim**, in this order:

```markdown
# Rendering divergences between framework layers

Split out of `components-divergences.md`, which held four kinds of content at once
and could not be retired while any of them had nowhere else to live. These are the
ones no contract can absorb: how a layer draws something, as distinct from what it
must do (`behaviour/patterns/` and each component's `*.behaviour.json`) or what it
must offer (`behaviour/contracts/` and each component's `*.api.json`).

**This file is non-normative prose.** Nothing verifies it. Where it disagrees with a
`.behaviour.json` or an `.api.json`, this file is wrong.

`scripts/check-api-contracts.mjs` fails a citation elsewhere in the tree that quotes
a section title no record here or in `components-divergences.md` still has, so a
section may be renamed or moved between the two files, but not silently deleted out
from under something that points at it.
```

The nine sections, by their current line offsets in `components-divergences.md`:

| Line | Section |
|---|---|
| 712 | chart-internals — the visually-hidden style carries its units in Angular |
| 739 | BarChart — the category axis is drawn per bar, not per label |
| 759 | BarChart — the charts are the layer's styling exception, and they state it in objects |
| 798 | LineChart — the crosshair measures against the SVG, not against the overlay rect |
| 818 | LineChart — the point axis is drawn per point, not per label |
| 835 | DoughnutChart — the legend is drawn per slice, not per label |
| 859 | DoughnutChart — the host IS the flex row, where React wraps one inside |
| 1007 | UnauthCard's `panel` hand-duplicates Card's surface classes |
| 1089 | SideNav is described three times, and only the colours agree |

**Move the text unchanged.** Do not rewrite, condense or "improve" it in the same commit as the move; a diff that both moves and edits is one nobody can review.

**Three sections that look like they belong here and do not:**
- *DoughnutChart — the legend is keyboard-reachable in Angular, not yet in React* (line 891) is **behaviour**. D1 keeps it in `components-divergences.md`.
- *ActivityFeed — the tone dot is filled ... not a divergence* (line 949) states it is not a divergence at all. Leave it where it is; deciding its fate is not this plan's.
- *The Tailwind layer is border-box; React is content-box* (line 98) is structural and cited by `frameworks/tailwind/README.md` twice. It stays.

Then run:

```bash
bun run check:api; echo "exit=$?"
```

Expected: `exit=0`. The citation check resolves a quoted title against **either** record, so a moved section keeps its citations working — that is the `a title quoted near one file resolves against the OTHER cited file too` test from Task 4, doing its job.

Commit:

```bash
git add rendering-divergences.md components-divergences.md
git commit -m "docs(divergences): split the rendering divergences into their own record"
```

- [ ] **Step 2: Delete the six API sections**

Each is now expressed by a contract and two bindings, and the classification is strictly more than the prose carried.

| Line | Section | Where it went |
|---|---|---|
| 506 | ConfirmDialog — no `width` prop in Angular | `confirm-dialog.api.json`, `unsupported` + reason. **A gap, now counted.** |
| 681 | PageHead — behaviour matches React; only the `style`/`...rest` prop has no counterpart | Nowhere, correctly: `style` is React idiom, covered by `LAYER_IDIOM_MEMBERS`. |
| 914 | AppLogo — the mark is a prop in React, projected content in Angular | `node-prop`/`content-slot`, a classified pair. No action. |
| 989 | UnauthCard — behaviour matches React; only the `style`/`...rest` prop has no counterpart | Nowhere, same as PageHead. |
| 1035 | Breadcrumbs — a single `navigate` output replaces a per-item `onClick` | `event-prop`/`output`, a classified pair. No action. |
| 1058 | StatCard — `delta` is one object prop in React, three flat inputs in Angular | `object-prop`/`flat-inputs`, a classified pair. No action. |

**Four of the six needed no action, and that is the point.** In the prose record all six read the same and the attention went nowhere in particular. `StatCard.icon` — which the record never mentioned — is the one that did need attention, and it now carries a written reason.

Run:

```bash
bun run check:api; echo "exit=$?"
```

Expected: `exit=0`, or a citation failure naming a file that quotes one of the six deleted titles. If one fires, **redirect that citation** — point it at the component's `.api.json` binding, whose `reason` now carries the same fact — and re-run. Do not delete the citation's surrounding sentence to make the check quiet.

Commit:

```bash
git add components-divergences.md
git commit -m "docs(divergences): retire the six API sections, now expressed as contracts and bindings"
```

- [ ] **Step 3: Rewrite the preamble (D2)**

`components-divergences.md`'s opening still reads as though it were a peer record, and it has been superseded twice — by 7b's patterns and now by these contracts. Replace the paragraph beginning **"The \"no absolute authority\" claim above is superseded."** with:

```markdown
**This file is non-normative prose, and nothing verifies it.** The normative records are
`behaviour/patterns/*.json` with each component's `*.behaviour.json` (what a component must
DO) and `behaviour/contracts/*.api.json` with each component's `*.api.json` (what it must
OFFER). Where this file disagrees with either, **this file is wrong.**

`check:behaviour` and `check:compliance` verify the first pair; `check:api` verifies the
second. Nothing verifies a sentence here, which is exactly why the sentences here are not
the authority.

What remains in this file is two kinds of content, both of which are still worth having:
**structural** divergences that hold across the whole Angular layer, and the **per-component
behaviour** divergences nobody has migrated into `exceptions` yet. The API divergences moved
into the contracts; the rendering divergences moved to `rendering-divergences.md`. A citation
elsewhere in the tree that quotes a section title here is checked by
`scripts/check-api-contracts.mjs`, so a section may be renamed or moved between the two
records but not silently deleted out from under something that points at it.
```

Run:

```bash
bun run check:api; echo "exit=$?"
bun test scripts/check-api-contracts.test.mjs
```

Expected: `exit=0`; the suite passes.

Commit:

```bash
git add components-divergences.md
git commit -m "docs(divergences): say plainly that this record is not the authority"
```

---

### Task 13: Documentation, and the full sweep

**Files:**
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything.
- Produces: the plan's completion gate.

- [ ] **Step 1: Document the layer in CLAUDE.md's *Architecture* section**

Add, immediately after the paragraph beginning **"And now something does check whether a component behaves as it declares — by rendering it."**:

```markdown
**A contract also says what a component must OFFER, and that is a different
record.** `behaviour/contracts/<Component>.api.json` lists a component's
capabilities, framework-neutral; a binding sidecar beside each layer's source
(`<Component>.api.json` for React, `<name>.api.json` for Angular, plus
`frameworks/angular/api-delegated.json` for the 22 controls Material provides)
maps each capability onto that layer's real members and classifies the mapping
with a `form` from a closed twelve-value vocabulary. **The point is not
convergence, and a gate asserting Angular exposes a prop named `delta` would be
a defect in the gate** — Angular's idiom for a compound value is sibling signal
inputs and React's is one object prop, and those are two correct spellings of one
capability. What the vocabulary buys is a *classification*: `object-prop` against
`flat-inputs` is a known-good pair needing no attention, `node-prop` against
`icon-name` is two different capabilities sharing one name. In prose those two
look identical, which is how `StatCard.icon` — React takes any node, Angular takes
a Phosphor class string — went unrecorded while five entries that needed no action
at all were written down.

`bun run check:api` reads both layers' **source** with the TypeScript compiler
API — never by import, which `scripts/` may not do, and never by regex, which
cannot tell `contentChild` (a projection slot) from `viewChild` (an internal
handle). It asserts four things: every capability is bound in **every** layer or
declared `unsupported`/`not-applicable`/`delegated` with a reason; every name in a
binding resolves to a real declaration; every declared member is claimed by some
capability or is layer idiom; and every cross-layer form pair is one somebody
classified. Its summary line reports the **declared gap count** — the number of
`unsupported` bindings — and that number, not the exit code, is the one worth
driving down. A green run means *classified*, never *the same* and never *complete*.

**Three forms are load-bearing and must not be collapsed.** `unsupported` is a
real gap: the layer could offer it and does not, and someone will close it.
`not-applicable` is idiom: the layer should never offer it — React's `style` has no
Angular counterpart because Angular's consumer already owns the host element.
`delegated` is Angular Material providing it. Declaring `Button` inapplicable
would be false — Angular *does* have a button, it is `matButton` — which is the
same conflation `behaviour-delegated.json` exists to prevent one level down.
`frameworks/angular/api-delegated.json` records the Material version its claims
were verified against, in a `$materialVersion` field; `behaviour-delegated.json`
does not, and CLAUDE.md's *Known debt* records why that matters.

**`check:api` also checks citations into the two divergence records.** 14 files
outside `docs/superpowers/` cite `components-divergences.md`, and they cite
sections as **quoted prose**, not anchors. A quoted title that resolves to no
heading in either `components-divergences.md` or `rendering-divergences.md` fails
the gate; a title may therefore move between the two records but cannot be deleted
out from under something pointing at it. A citation naming only the path has
nothing to resolve and is counted, never failed.
```

- [ ] **Step 2: Rewrite the `components-divergences.md` entry under *Where the rest of the debt lives***

Replace the existing `**components-divergences.md**` bullet — the one whose text ends with the plan-7d findings — with:

```markdown
- **`components-divergences.md` and `rendering-divergences.md`** — the two
  non-normative prose records. Neither is the authority: `check:behaviour` and
  `check:compliance` verify what a component must do, `check:api` verifies what it
  must offer, and nothing verifies a sentence in either file. Plan 8 removed the
  six API sections (they became contracts and bindings, and four of the six turned
  out to need no action, which is itself the argument for classifying) and split
  the nine rendering sections into `rendering-divergences.md`. What remains in
  `components-divergences.md` is **structural** divergences and the **per-component
  behaviour** sections nobody has migrated into `exceptions`; plan 8 deliberately
  did not fold that migration in, because behaviour and API are different contracts
  with different schemas and 7c kept them apart on purpose.

  **The retirement predicate**, written down so it stops being reopened as an open
  question in every plan after this one: **delete `components-divergences.md` when
  the behaviour sections are in `exceptions`, and the structural sections are in
  this file.** `rendering-divergences.md` has no retirement condition — a per-bar
  axis and a duplicated panel class are prose with no contract that could ever
  absorb them, and that record is where they live from now on. Until the predicate
  holds, both files stay, and their stale-entry discipline stays with them.

  Citations are machine-checked, which is what makes editing either file safe:
  `check:api` fails a quoted section title that resolves to no heading in either
  record. It cannot check a citation that names only the path.
```

- [ ] **Step 3: Add the two new debt entries to *Known debt***

Add these bullets to the *Known debt* list, before *Where the rest of the debt lives*:

```markdown
- **A contract's `shape` is hand-written prose and no gate reads it.** It was
  written by hand rather than derived from React's `.d.ts` deliberately —
  deriving it would make React the reference layer by construction, contradicting
  plan 7's finding that Angular is the accessible reference more often. The price
  is that `shape` can drift from both layers and nothing notices: `check:api`
  asserts a binding's *members* exist, never that the shape it describes is the
  shape either layer implements. Cross-layer type identity is a different and much
  harder problem, declined on purpose — `'up' | 'down'` in a `.d.ts` and
  `Direction` in a `.ts` may or may not be the same union, and each layer's own
  compiler enforces its half.
- **`check:api` says nothing about whether a gap should be closed, only that one
  exists.** Its summary reports the `unsupported` count and every entry carries a
  reason, but nothing schedules the work and no gate fails as the count grows —
  a new component with six unbound-in-Angular capabilities lands green so long as
  each is declared. This is the same shape as `check:compliance`'s coverage record
  and was chosen for the same reason: a gate demanding parity on day one would have
  been switched off. `ConfirmDialog`'s `width` is the first entry, and it has been
  a known gap since before this layer existed.
```

- [ ] **Step 4: Update the gate count everywhere CLAUDE.md states it**

`bun run check` runs **twenty-one** gates now, not twenty. Find and fix every statement of the count:

```bash
grep -n 'twenty\|twenty gates\|all twenty' CLAUDE.md
```

At minimum the *Architecture* sentence reading "`bun run check` runs all twenty plus the test suite" becomes "all twenty-one". Read each hit; do not blind-replace, because "three gates are not runtime-portable" is a different number and stays as it is — **`check:api` is runtime-portable** (TypeScript's compiler API runs under plain node, verified) and does not join that list.

- [ ] **Step 5: Add the CHANGELOG entry**

Under `## [Unreleased]` — **never under the last released version**; the plugin is served from the tag, so a release is frozen the moment it is cut, and this has been got wrong twice:

```markdown
### Added
- API capability contracts. `behaviour/contracts/*.api.json` records what each of the
  43 components must offer, framework-neutral; a binding sidecar beside each layer's
  source maps every capability onto that layer's real members and classifies the
  mapping with a `form` from a closed vocabulary. `bun run check:api` (gate
  twenty-one) asserts coverage in every layer, that every bound member really exists,
  that no member is silently uncontracted, and that every cross-layer form pair is one
  somebody classified. It reads both layers with the TypeScript compiler API and is
  runtime-portable. The point is legibility, not convergence: the layers should keep
  differing where idiom differs, and the gate distinguishes "differs correctly" from
  "is missing" from "differs in kind" — three things a prose record made look identical.
- `frameworks/angular/api-delegated.json`, declaring the 22 React components Angular
  provides through Material, with the Material version its claims were verified against.
- `check:api` fails a citation elsewhere in the tree that quotes a divergence-record
  section title no record still has, so a section cannot be deleted out from under
  something pointing at it.

### Changed
- `StatCard.icon` is recorded as a divergence in kind for the first time: React accepts
  any `React.ReactNode`, Angular accepts a Phosphor class string. It was in no record
  before, and it was found by writing these contracts.
- `ConfirmDialog`'s missing Angular `width` is labelled a real gap rather than reading
  identically to five differences that need no action at all.
- `components-divergences.md` declares itself non-normative, loses its six API sections
  to the contracts, and loses its nine rendering sections to the new
  `rendering-divergences.md`. Its retirement predicate is written down in CLAUDE.md.
```

- [ ] **Step 6: The "where else is this restated?" pass**

The spec asks for this explicitly, and it is the one lesson plan 5.5's whole-branch review paid for. 5.5 shipped with `Onboarding.manifest.json` still hard-coding the coachmark width as `w-80`, independently of the token both framework layers had just adopted, because **no task in a ten-task plan had the manifest in scope**. Nothing per-task could see it; only a whole-branch pass could. The lesson is not that a contract should cover manifests — *What this does NOT solve* declines that correctly, manifests carry no API. The lesson is that **"both layers" is not the same as "everywhere the thing is expressed"**, and a plan that touched only the two layers should look once at the rest before declaring itself done.

Pick the six components whose contracts turned out most interesting — at minimum `StatCard` (the unrecorded `icon` divergence), `ConfirmDialog` (the labelled gap), and any component where a capability bound `unsupported` on the Angular side. For each, check the three places outside the two layers where its API is restated:

```bash
# The Tailwind manifest, which names slots and may imply an affordance the contract does not carry
ls frameworks/tailwind/components/<Component>.manifest.json 2>/dev/null && \
  node -e "console.log(Object.keys(require('./frameworks/tailwind/components/<Component>.manifest.json')))"

# The two prompt files, which document the API to a consumer in prose
sed -n '1,60p' frameworks/react/components/*/<Component>.prompt.md
sed -n '1,60p' frameworks/angular/primitives/<name>/<name>.prompt.md
```

Look for one thing only: **a capability documented or implied there that no contract carries, or a contract capability those files contradict.** A `.prompt.md` promising an Angular `width` that `confirm-dialog.api.json` binds `unsupported` is a real find and must be fixed in the prompt.

**Whatever you find, do not widen this plan to fix it structurally.** Record it. If it is a genuine mismatch in a `.prompt.md`, fix that file here and say so in the commit. If it is a manifest implying an affordance no layer has, add it as a bullet to CLAUDE.md's *Known debt* under the `check:states` entry, which already owns the "nothing proves a manifest still matches the component it mirrors" problem. If the pass finds nothing, say so in the commit message — `docs: ... (restatement pass found nothing)`. A pass that reports nothing is a result; a pass nobody ran is not.

- [ ] **Step 7: Run the full sweep — the completion gate**

```bash
bun run check
```

Expected: `check-all: all 23 step(s) passed` (21 gates + 2 bun test steps), or `INCOMPLETE` naming only `check:cards`, `check:vendor` or `check:demos` as SKIP if this machine has no Chromium. **A SKIP on any of those three is acceptable; a FAIL on anything is not.**

Also confirm the gate is genuinely runtime-portable, which is the claim CLAUDE.md now makes about it:

```bash
node scripts/check-api-contracts.mjs; echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: record the API contract layer, its two debts, and the divergence-record retirement predicate"
```

---

## Verification summary

When every task is done, all of these must hold. Check them, do not assume them.

```bash
# 43 contracts, one per React component
ls behaviour/contracts/*.api.json | wc -l                       # 43

# 43 React bindings
find frameworks/react/components -name '*.api.json' | wc -l     # 43

# One Angular binding per primitive
find frameworks/angular/primitives -name '*.api.json' | wc -l   # 21

# The gate is green, under both runtimes
bun scripts/check-api-contracts.mjs && node scripts/check-api-contracts.mjs

# The suite is green
bun test scripts/api-contracts.test.mjs scripts/api-members.test.mjs scripts/check-api-contracts.test.mjs

# Twenty-one gates, asserted by literal value
bun test scripts/check-all.test.mjs

# The two records exist and components-divergences.md has shrunk by ~15 sections
wc -l components-divergences.md rendering-divergences.md

# The full sweep
bun run check
```

**And read the gate's summary line.** `N declared gap(s)` is the number this plan produced and did not close. Every one of them carries a written reason naming a real thing an Angular consumer cannot do. Closing them is follow-on work, taken deliberately and one component at a time — **this plan changes no component implementation, and a task that edited one to make a gate pass did the wrong thing.**
