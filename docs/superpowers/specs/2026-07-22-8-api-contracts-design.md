# API capability contracts — Design

**Status:** DRAFT — not approved. Written 2026-07-22, in the same session as plan 7's
spec and at the repo owner's explicit request to capture the decision while it was
fresh.
**Revised 2026-07-22 after plan 7 landed as the chain 7a → 7b → 7c** (all merged; 7c at
the branch `behaviour-contracts-7c`). The infrastructure this spec reuses — the
sidecar-next-to-the-component convention, the per-entry `reason` format with a stale-entry
rule, and the component→layer resolver in `scripts/lib/behaviour-contracts.mjs` (its
`reactComponents` / `angularPrimitives` / `loadBinding` exports) — **is no longer
hypothetical; it exists.** Two judgements below were written assuming plan 7 would also
migrate the *behaviour* half of `components-divergences.md`; it did not, and the decision
not to write a plan 7d for that is recorded in *What became of the API entries* and in the
new *Deciding what to do with `components-divergences.md`* section. Read those before the
Design, because they change what this plan inherits.
**Revised 2026-07-22 after plan 5.5 shipped**, which is the nearest thing to a rehearsal
this spec has: 5.5 proved the shape both later specs assume — a sidecar record with a
reason per entry, a stale entry failing the gate that owns it, committed generated output
guarded by a rebuild comparison, and a normative gate landing green on day one because
everything is *declared* rather than compliant. None of that is hypothetical now. See
*What plan 5.5 rehearsed*.
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

## What plan 5.5 rehearsed

5.5 is merged (`5d043ec`). It built nothing this spec needs, but it exercised every
mechanism this spec assumes, which turns four assumptions into observations.

**The stale-entry rule works, and it was verified adversarially rather than trusted.**
A reviewer injected an `EXEMPT` entry naming a constant that was not duplicated and
confirmed the gate failed calling it stale, then injected a matching entry beside a real
duplicate and confirmed it suppressed. This spec's `unsupported` bindings rest entirely
on that rule holding: an `unsupported` entry for a capability a layer has since gained
must fail. It will.

**Phrase coverage as "every layer", never "at least one".** 5.5's orphan rule is *at
least one layer* — correct there, because `calendarHourH` is legitimately React-only —
and the consequence is now recorded in CLAUDE.md under *Known debt*: once one layer
satisfies the gate, it says nothing about the other. This spec's assertion 1 must be the
strict form. A component a layer does not have (`Button`, `Calendar`) is declared absent,
not silently skipped.

**A gate cannot run its scan at top level.** Its own test imports it for pure helpers,
and an unguarded `process.exit(1)` kills the test process. Use `main()` behind
`if (process.argv[1] === fileURLToPath(import.meta.url))`, as `check-arbitrary-values.mjs`
and `check-dimension-literals.mjs` do. 5.5's gate hit this and so will `check:api`.

**There is a third place a value can live, and this spec's scope excludes it on a
premise worth re-testing.** *What this does NOT solve* declines the Tailwind layer
because "manifests carry no API". That is true of props — but 5.5's whole-branch review
found `Onboarding.manifest.json` still rendering the coachmark width as `w-80`,
independently of the token both framework layers had just adopted, because no task in a
ten-task plan had the manifest in scope. Nothing per-task could see it; only the
whole-branch pass did. The lesson is not that this spec should cover manifests. It is
that **"both layers" is not the same as "everywhere the thing is expressed"**, and a plan
from this spec should have one pass that asks where else a capability is restated.

**And the feasibility claim in §3 still holds**: TypeScript 6.0.3 remains a
devDependency, so the gate parses both layers with the compiler API rather than by regex.

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

**Correction, post-7c.** This spec was written expecting plan 7 to migrate the *behaviour*
half of `components-divergences.md` into `exceptions`, leaving only a structural half for
plan 8 to finish. That did not happen. 7c's spec deferred the migration to a plan 7d, and
during 7c's execution 7d was assessed and **not written** — because the premise for
deferring it (that verifying the contracts would change which exceptions are true, so the
prose should not be migrated until they settled) turned out false: 7c retired **0
exceptions and added 0**, so nothing moved, and no drift is accumulating for a migration to
race. The authority already sits with the `exceptions` — 7b established it and 7c now
verifies six components' worth of them by render — so if the prose and the contract diverge,
it is the non-normative prose that is wrong.

The consequence for this plan: `components-divergences.md` still holds **all four** of its
kinds of content, not two. 7c's execution found the seam is not the clean three-way split
this spec's §4 assumes. Re-derived from the file (1127 lines; the structural/per-component
seam is at line 329):

- **Structural** (~first 300 lines) — cross-layer facts no binding expresses. Stay as prose.
- **Per-component behaviour** (~6 sections: ConfirmDialog accessible, CommandPalette
  combobox, CommandPalette-does-not-close, ErrorState announces, DoughnutChart
  keyboard-reachable legend, and the like) — these overlap the `exceptions` plan 7 created.
  **Nobody has migrated them. They are still prose, and this plan does not own them either**
  unless the decision below says so.
- **Per-component API** (~7 sections: StatCard `delta`/`icon`, AppLogo mark, Breadcrumbs
  `navigate`, PageHead / UnauthCard `style`, ConfirmDialog `width`) — **this plan's subject**,
  migrated and classified per the table above.
- **Per-component rendering** (~9 sections: BarChart's per-bar axis, DoughnutChart's
  per-slice legend, `chart-internals`' units, UnauthCard's duplicated panel classes, SideNav
  described three times) — **the fourth bucket, which §4 as first written did not name.**
  Neither behaviour nor API, no destination in either contract's schema. Stay as prose.

So this plan removes only the ~7 API sections. Whether `components-divergences.md` is worth
keeping afterward is no longer "once only the structural half remains" — it is "once the
API sections are gone and the behaviour, structural and rendering halves remain, three
kinds of prose with no contract to absorb them." That is a real decision, not a formality,
and the next section frames it.

## Deciding what to do with `components-divergences.md`

This spec removes the ~7 API sections and no more. But 7c left the file in a state its
original authors did not plan for — four kinds of content, an authority that has already
moved to the contracts, and a behaviour half that was supposed to be migrated by plan 7 and
was not. The file is the **largest single debt record in the repo** (1127 lines), and 13
places cite it by path (`command-palette.behaviour.json`, the `SideNav` delegated entry,
`onboarding.ts`, `bulk-action-bar.ts`, `confirm-dialog.ts`, `activity-feed.ts`, two Angular
test files, `check-manifest-states.mjs`, `frameworks/tailwind/README.md`, and `CLAUDE.md`,
among others). A change that deletes a cited section without redirecting its citation breaks
that citation silently — the same failure mode 7c's own review caught in a comment.

None of the decisions below are this spec's to make unilaterally; they are the repo owner's,
and they gate how wide a plan written from this spec becomes. They must be answered first.

**D1 — Does this plan stay scoped to the API sections, or does it also migrate the ~6
behaviour sections into `exceptions`?** The argument for folding it in: this plan is already
opening the file, already redirecting citations, and already fluent in the exception format
it would migrate into. The argument against: behaviour and API are different contracts with
different schemas, and 7c deliberately kept the two apart. The controller's recommendation,
recorded for the owner to accept or reject: **stay scoped to API.** The ~6 behaviour
sections are a half-day of prose-to-`reason` movement that belongs with whoever is next
verifying those specific components' behaviour by render, not bolted onto an API plan — and
folding them in doubles the citation-redirect surface for a payoff of "six fewer duplicated
paragraphs."

**D2 — What is the authority relationship now, and should it be stated in the file's own
preamble?** Since 7b, the `exceptions` are the normative record of component behaviour and
`components-divergences.md` is not. Since 7c, six components' exceptions are verified by
render and the prose is verified by nothing. The file's preamble still reads as though it
were a peer record. **Decision:** whether the file's opening should be rewritten to say
plainly "this is non-normative prose; the normative records are `*.behaviour.json` and
`*.api.json`; where they disagree, this file is wrong" — which costs one paragraph and stops
the file being read as authority — versus leaving it and accepting that a reader may trust a
stale sentence.

**D3 — Do the ~9 rendering sections have a better home than this file, or none?** They are
the only content with no contract that could ever absorb them — a per-bar axis, a
duplicated panel class, a legend drawn per slice. Options: leave them in
`components-divergences.md` (which then survives purely to hold them); fold them into
`CLAUDE.md`'s architecture section beside the other rendering-idiom notes; or split them into
a smaller `rendering-divergences.md` so the 1127-line file can be retired. **Decision:** which
of the three, weighed against the fact that `CLAUDE.md` is already long and the rendering
notes are genuinely architectural.

**D4 — What is the retirement condition for the file as a whole, stated as a testable
predicate rather than a vibe?** After this plan, the file holds structural + behaviour +
rendering. It can only be deleted when every one of those has a home. **Decision:** name the
predicate — e.g. "delete `components-divergences.md` when the behaviour sections are in
`exceptions` (D1), the rendering sections are relocated (D3), and the structural sections are
in `CLAUDE.md`; until then it stays, and its stale-entry discipline stays with it." Writing
the predicate down is what stops this being reopened as an open question in plan 9 and every
plan after.

**D5 — Who owns the citation redirect, and is it mechanical enough to gate?** 13 citations,
by path, to sections that may move or be deleted. **Decision:** whether a plan from this spec
adds a cheap check that every `components-divergences.md#…` or path reference in the tree
still resolves to a heading that exists — the same shape as the stale-entry rules this chain
already trusts — so that a future migration cannot silently break a citation. This is small
and it closes the one failure mode that makes editing the file dangerous.

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
6. **Is `components-divergences.md` still worth keeping**, and what should happen to the
   behaviour and rendering halves nobody owns? The premise this question was first written
   with — "once both migrations are done and only the structural half remains" — is void:
   the behaviour migration was never done (no plan 7d), so after this plan removes the API
   sections, three kinds of prose remain, not one. This is now the subject of its own
   section, *Deciding what to do with `components-divergences.md`*, and its sub-questions
   must be answered before this plan is written, because they decide whether this plan's
   scope is "migrate the API entries" or "migrate the API entries and finally retire the
   file."
7. **What happens when a capability is genuinely React-only by design** — not a gap, not
   idiom, but a thing Angular should never have? `unsupported` + reason conflates it
   with `ConfirmDialog`'s `width`, which is the exact conflation this spec exists to
   end. It probably needs a third form: `not-applicable`.

## Affected files, provisionally

**New:** `behaviour/contracts/*.api.json` (~43), one `X.api.json` per component per
layer, `scripts/check-api-contracts.mjs` and its test.

**Build:** `scripts/check-all.mjs`, `package.json` (`check:api`, taking the gate count
from **twenty to twenty-one** — sixteen before plan 5.5, eighteen after it, twenty after
plan 7). `scripts/check-all.test.mjs` asserts both the count and the gate-name array by
literal value and moves with them, which plan 5.5 learned by breaking it.

**Docs:** `CLAUDE.md`, `components-divergences.md` (API entries migrate out),
`CHANGELOG.md` under `## [Unreleased]`.

**Unchanged:** every component's implementation. This plan writes declarations and a
gate; it changes no rendered output and no public API. Closing the gaps it labels is
follow-on work, taken deliberately and one component at a time.
