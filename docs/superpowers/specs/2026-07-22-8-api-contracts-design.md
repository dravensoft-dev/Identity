# API capability contracts — Design

**Status:** DRAFT — not approved. Written 2026-07-22, in the same session as plan 7's
spec and at the repo owner's explicit request to capture the decision while it was
fresh. **It is written against infrastructure that does not exist yet** — plan 7 builds
the binding convention, the exception format and the component→layer resolver this spec
reuses. Expect to revise it once plan 7 lands; that is the accepted cost of writing it
now.
**Execution order:** plan 8 of 9 — after 7, before 9 (four-package build + publish).
**Depends on:** `2026-07-22-7-behaviour-tokens-and-contracts-design.md`, hard.
**Blocks:** `2026-07-18-9-four-package-build-publish-design.md` (plan 9) — this spec
settles the public API surface of both framework packages, and publishing before it means
publishing a surface that is about to be classified and, in at least one known case
(`ConfirmDialog`'s missing `width`), corrected.

## Problem

Plan 7 gives Arena a normative contract for what a component must *do*. It deliberately
declines what a component must *offer*, because no ARIA pattern expresses it. That
leaves a category of `components-divergences.md` entries with nowhere to go:

- *"StatCard — `delta` is one object prop in React, three flat inputs in Angular"*
- *"AppLogo — the mark is a prop in React, projected content in Angular"*
- *"Breadcrumbs — a single `navigate` output replaces a per-item `onClick`"*
- *"PageHead — behaviour matches React; only the `style`/`...rest` prop has no counterpart"*
- *"UnauthCard — behaviour matches React; only the `style`/`...rest` prop has no counterpart"*
- *"ConfirmDialog — no `width` prop in Angular"*

Read as a group these are not all the same thing, and that is the finding:

**Most are idiom, and idiom is correct.** Angular's way to express a compound value is
flat signal inputs; its way to express projected content is `<ng-content>`; its way to
express an event is an output. Forcing React's shape onto Angular produces bad Angular.
`StatCard` is the clearest case — React's `StatDelta` carries `{ value, direction,
tone }` and Angular carries `deltaValue`, `deltaDirection`, `deltaTone`. Those are two
correct spellings of one capability.

**One is a real gap.** *"no `width` prop in Angular"* means a consumer who needs a wider
confirm dialog can do it in React and cannot in Angular. Nothing distinguishes it, in the
record, from the five entries above that need no action at all.

**And one is invisible entirely.** `StatCard.icon` is `React.ReactNode` in React and
`input<string>()` — an icon *name* — in Angular. Those are not two spellings of one
capability; they are different capabilities with one name. React's accepts an arbitrary
node, Angular's accepts a key into the Phosphor manifest. The record does not mention
it.

So the problem is not that the layers differ. It is that **"differs correctly", "is
missing", and "differs in kind" all look identical** in a prose record.

## What this does NOT solve, stated first

**It does not converge the APIs, and must not try.** A gate asserting Angular exposes a
prop named `delta` would be a defect in the gate. This spec checks *coverage of
capability*, never sameness of form.

**It does not type-check across layers.** `'up' | 'down'` in a React `.d.ts` and
`Direction` in an Angular `.ts` may or may not be the same union. Proving that is a
cross-project type-identity problem and this spec declines it. The contract declares the
shape; each layer's own compiler enforces its half — `check:angular` already runs
`ngc --strictTemplates`.

**It does not cover behaviour.** Plan 7's subject. A capability contract says `dismiss`
is offered; the behaviour contract says Escape triggers it.

**It does not extend to the Tailwind layer.** Manifests carry no API. The mapping is
already known to be uneven — 18 of 39 mirror both layers, 21 mirror React alone — and
adding a third binding target here would be inventing work.

## Design

### 1. Capabilities, not props

The contract is **framework-neutral and lives at the root**, beside plan 7's patterns:

```jsonc
// behaviour/contracts/StatCard.api.json
{
  "component": "StatCard",
  "capabilities": [
    { "name": "label", "kind": "input", "required": true,  "shape": "string" },
    { "name": "value", "kind": "input", "required": true,  "shape": "string" },
    { "name": "tone",  "kind": "input", "required": false,
      "shape": "'neutral'|'accent'|'gold'|'success'|'warning'|'danger'|'info'" },
    { "name": "delta", "kind": "input", "required": false,
      "shape": { "value": "string", "direction": "'up'|'down'", "tone": "'positive'|'negative'|'neutral'" } },
    { "name": "sub",   "kind": "input", "required": false, "shape": "string" },
    { "name": "icon",  "kind": "input", "required": false, "shape": "icon-ref" }
  ]
}
```

`kind` is one of `input`, `output`, `slot`. `shape` is descriptive, not enforced across
layers — its job is to make a divergence in *kind* legible, which is the `icon` case.

### 2. Bindings map capability to the layer's real members

Reusing plan 7's file convention exactly — a sidecar next to the component, per layer:

```jsonc
// frameworks/react/components/display/StatCard.api.json
{
  "delta": { "form": "object-prop", "members": ["delta"] },
  "icon":  { "form": "node-prop",   "members": ["icon"] }
}
```
```jsonc
// frameworks/angular/primitives/stat-card/stat-card.api.json
{
  "delta": { "form": "flat-inputs", "members": ["deltaValue", "deltaDirection", "deltaTone"] },
  "icon":  { "form": "icon-name",   "members": ["icon"] }
}
```

`form` comes from a **closed vocabulary**, and that vocabulary is the deliverable as much
as the gate is. Provisionally: `object-prop`, `flat-inputs`, `node-prop`, `icon-name`,
`content-slot`, `named-slot`, `event-prop`, `output`, `passthrough`, `unsupported`.

A closed vocabulary is what turns "these differ" into a *classification*. `object-prop`
against `flat-inputs` is a known-good pair. `node-prop` against `icon-name` is not — and
the gate can say so, which is more than the prose record does today.

`unsupported` requires a `reason`, and that is where the real gaps land:

```jsonc
// frameworks/angular/primitives/confirm-dialog/confirm-dialog.api.json
{ "width": { "form": "unsupported",
             "reason": "No width input; the dialog is fixed-width in Angular. Real gap, not idiom." } }
```

### 3. The gate

`scripts/check-api-contracts.mjs`, portable, no new dependency. Four assertions:

1. **Coverage.** Every capability in the contract is bound in every layer, or bound
   `unsupported` with a reason. An unbound capability fails.
2. **Members exist.** Every name in `members` resolves to a real declaration in the
   layer's source — a property on the `*Props` interface for React, an `input()` /
   `output()` initializer for Angular. This is what stops a binding from describing a
   component that has moved.
3. **No orphan members.** Every prop and every `input()`/`output()` is claimed by some
   capability, or excluded with a reason. The converse of coverage, and the half that
   catches a prop added to one layer and never contracted — which is how divergence
   enters in the first place.
4. **Form pairs are classified.** A capability whose two layers bind forms that are not
   a declared-compatible pair fails unless the binding carries a reason. `node-prop` vs
   `icon-name` is the case this exists for.

**Feasibility, which is better than it looks.** TypeScript 6.0.3 is already a
devDependency (`check:angular` needs it for `ngc`), so the gate parses both layers with
the compiler API rather than by regex. React's surface is a `.d.ts` — the quartet
mandates one per component — and Angular's is a class with `input()` initializers. Both
are real ASTs. No text scan, no `EXEMPT` map of the kind level 2 in plan 7 needs.

One constraint from CLAUDE.md worth stating: a script under `scripts/` **may not import**
a framework layer's `.ts` or `.jsx`, because that suite also runs under plain node.
Parsing them as source text into an AST is not importing them, and is fine. The gate
must never `import()` the component.

### 4. What becomes of the API entries in the record

They migrate, and they get classified in the process:

| Entry | Becomes |
|---|---|
| StatCard `delta` | `object-prop` / `flat-inputs` — a known-good pair. No action. |
| AppLogo mark | `node-prop` / `content-slot` — known-good pair. No action. |
| Breadcrumbs `navigate` | `event-prop` / `output` — known-good pair. No action. |
| PageHead / UnauthCard `style` | `passthrough` / `unsupported` + reason. Visible as a gap. |
| ConfirmDialog `width` | `unsupported` + reason. **A real gap, now labelled as one.** |
| StatCard `icon` | `node-prop` / `icon-name` — **not** a known-good pair. Surfaces a divergence nobody recorded. |

Four of six turn out to need no action, which is itself the argument for the
classification: today all six read the same, and the attention goes nowhere in
particular.

After migration, `components-divergences.md` retains only the structural half that plan 7
left it. Whether it is then worth keeping as a file, or folded into `CLAUDE.md`'s
architecture section, is a decision for the end of plan 8 and not before.

## Sequencing

Last before publication (plan 9). It reuses, and does not rebuild:

- plan 7's sidecar-next-to-the-component convention;
- plan 7's component→layer resolver, including the two known mapping exceptions
  (`Tag` against Angular's `tag.ts`, and the 21 manifests with no Angular counterpart);
- plan 7's exception format, and above all its **stale-entry rule** — an `unsupported`
  binding for a capability the layer has since gained must fail, exactly as a stale
  `EXEMPT` does.

Landing follows plan 7's day-one strategy for the same reason: write every contract and
every binding first, classify honestly, green from the first commit where green means
*declared*. Then retire `unsupported` entries one at a time.

## Non-goals

- **Converging API shape between layers.** The point is to make idiom legible, not
  uniform.
- **Cross-layer type identity.** §*What this does NOT solve*.
- **Contracts for the Tailwind layer.** Manifests carry no API.
- **Generating either layer from the contract.** A code generator is a different project
  with a much worse failure mode, and neither layer wants to be generated.
- **Covering behaviour.** Plan 7.

## Open questions — must be answered before a plan is written

1. **Is the `form` vocabulary closed, and who closes it?** The whole gate rests on it.
   Ten values are proposed; the real set only emerges from binding all 43 components,
   which means the plan must allow the vocabulary to grow during execution and then
   freeze it.
2. **Which form pairs are declared compatible?** `object-prop`/`flat-inputs` clearly.
   `node-prop`/`icon-name` clearly not. The middle is unmapped and the answer decides
   how noisy assertion 4 is.
3. **Where does the contract's `shape` come from — hand-written, or derived from React?**
   Deriving it makes React the reference layer by construction, which contradicts plan
   7's finding that Angular is the accessible reference more often. Hand-writing 40
   contracts is real work and will drift from both.
4. **Does assertion 3 (no orphan members) have an acceptable false-positive rate?**
   React components take `style` and spread `...rest`; Angular takes host bindings. If
   every one needs an exclusion, the assertion costs more than it returns.
5. **Do the three charts get contracts?** They have no manifest and no `.variants.ts`
   already, and their props are data series rather than affordances.
6. **Is `components-divergences.md` still worth keeping** once both migrations are done
   and only the structural half remains? §4.
7. **What happens when a capability is genuinely React-only by design** — not a gap, not
   idiom, but a thing Angular should never have? `unsupported` + reason conflates it
   with `ConfirmDialog`'s `width`, which is the exact conflation this spec exists to
   end. It probably needs a third form: `not-applicable`.

## Affected files, provisionally

**New:** `behaviour/contracts/*.api.json` (~43), one `X.api.json` per component per
layer, `scripts/check-api-contracts.mjs` and its test.

**Build:** `scripts/check-all.mjs`, `package.json` (`check:api`, taking the gate count
from eighteen to nineteen).

**Docs:** `CLAUDE.md`, `components-divergences.md` (API entries migrate out),
`CHANGELOG.md` under `## [Unreleased]`.

**Unchanged:** every component's implementation. This plan writes declarations and a
gate; it changes no rendered output and no public API. Closing the gaps it labels is
follow-on work, taken deliberately and one component at a time.
