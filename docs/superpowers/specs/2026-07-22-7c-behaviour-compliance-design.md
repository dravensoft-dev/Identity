# Behaviour compliance — verifying the contracts, not just collecting them — Design

**Status:** DRAFT — not approved. Written 2026-07-22, immediately after plan 7b merged
(`747c970`). Open questions at the end are real and must be answered before a plan is
written from this.
**Execution order:** plan 7c of the chain `5.5 → 7a → 7b → 7c → 8 → 9`. Everything before
it is merged; 8 (API capability contracts) and 9 (four-package build + publish) follow.
**Depends on:** plan 7b's contract layer — **merged**, not a dependency to wait on.
**Blocks:** nothing, but `2026-07-22-8-api-contracts-design.md` reuses its conventions.

**Written to be read cold.** A plan can be written from this document by someone with no
memory of the conversations that produced it. Everything a planner needs about the state
of the tree is in *What exists today*, with real names and counts derived from the tree
rather than recalled.

---

## Problem

Plan 7b gave Arena a contract layer: every component in every framework layer declares
which behaviour pattern it implements and which of that pattern's requirements it does
not meet. That closed a real hole — before it, `components-divergences.md` opened by
admitting no layer was the authority for component behaviour, which meant a divergence
could not be a defect, and a component with no entry said nothing at all.

**But the gate that guards it proves only that a declaration is well formed.** Its own
header says so, and so do `CLAUDE.md`, `behaviour/README.md` and the CHANGELOG, in four
independent places:

> It does not assert that a component behaves as it declares. A component can bind
> `dialog-modal` and trap no focus at all. A green run is a coverage claim, never an
> accessibility one.

So the tree now contains **107 exception entries** asserting things about component
source code, and **86 declarations** asserting a pattern is implemented — and not one of
those claims is machine-checked. They rest entirely on the care taken when they were
written. Per-task review during 7b found several overclaims by reading sources by hand,
which is evidence both that the claims are worth checking and that hand-checking does
not scale.

Three consequences follow, in increasing order of cost:

1. **A binding can be quietly wrong and stay wrong.** Nothing fails when a component
   gains the `role` it was excepted for, or loses one it claimed.
2. **An exception cannot expire.** This is the property the whole layer was modelled on
   — `check-dimension-literals.mjs`'s `EXEMPT` fails when an entry stops describing a
   real violation — and it is exactly the property the contract layer does **not** yet
   have. An exception that has been fixed in the source stays in the file forever.
3. **`components-divergences.md` still holds 1119 lines**, whose per-component half now
   duplicates the `exceptions` this layer created. 7b added a note to its preamble
   saying the authority question is settled and migration is pending, but the duplication
   is real and the two will drift.

---

## What exists today

Derived from the tree at `747c970`, not recalled. A planner should re-derive these before
relying on them; the commands are given so that is cheap.

### The contract layer

| | Count | Where |
|---|---|---|
| Behaviour patterns | **20** | `behaviour/patterns/*.json` |
| React bindings | **43** | `frameworks/react/components/<group>/<Name>.behaviour.json` |
| Angular bindings | **21** | `frameworks/angular/primitives/<name>/<name>.behaviour.json` |
| Angular delegated / absent | **22** | `frameworks/angular/behaviour-delegated.json`, one file |
| Declared exceptions | **107** | across all of the above |
| Gates in `bun run check` | **19** | plus the test suite = 20 steps |

```bash
ls behaviour/patterns/*.json | wc -l
find frameworks -name '*.behaviour.json' | wc -l
python3 -c "import json;print(len(json.load(open('frameworks/angular/behaviour-delegated.json'))))"
```

43 = 21 + 21 + 1: twenty-one components exist in both layers, twenty-one Angular delegates
to Material, and one (`Calendar`) Angular does not have at all.

### The shapes

A **pattern** states what a kind of component must do. `requires` is a **flat map of
dotted keys**, which is load-bearing: an exception names exactly one, so one entry cannot
excuse a whole clause.

```jsonc
// behaviour/patterns/dialog-modal.json
{
  "name": "dialog-modal",
  "source": "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "description": "…",
  "requires": {
    "roles.element": "dialog",
    "roles.aria-modal": "true",
    "focus.trap": true,
    "keyboard.Escape": "close"
  }
}
```

Of the twenty: fifteen cite a WAI-ARIA APG page, two (`status`, `textbox`) cite the ARIA
1.2 role reference because APG has no pattern page for them, one
(`figure-with-data-table`) cites WCAG because APG has no chart pattern, and two — `none`
and `absent` — cite nothing, and say so.

`none` means **a real component that renders and offers no interactive affordance**.
`absent` means **this layer has no such component at all**. Collapsing them was a defect
found in 7b's final review and fixed; they are not interchangeable.

A **binding** declares which pattern a component implements:

```jsonc
// frameworks/react/components/navigation/CommandPalette.behaviour.json
{
  "pattern": "combobox",
  "exceptions": [
    { "requirement": "roles.element",
      "reason": "React sets no roles at all. Angular's arena-command-palette is the accessible reference; this is a real defect, not idiom." }
  ]
}
```

Other fields in use: `reason` (required when binding `none` or `absent`), `component`
(**required on every Angular binding**, naming its React counterpart in Pascal case —
kebab↔Pascal derivation is unsafe and the cross-layer check dies silently without it),
`divergesFrom`, `delegatedTo`, `dressedBy`, and `additions` (deliberately unvalidated:
an addition is something the pattern does not require, so there is no key to check it
against).

### The gate and its library

- `scripts/check-behaviour.mjs` — the gate. Its scan sits behind
  `if (process.argv[1] === fileURLToPath(import.meta.url))` so its own test can import it.
- `scripts/lib/behaviour-contracts.mjs` — the pure, importable half:
  `loadPatterns`, `validatePattern`, `validateBinding`, `reactComponents`,
  `angularPrimitives`, `crossLayerAgrees`, `PATTERN_DIR`, plus `UNBOUND_PRIMITIVES` and
  `validateUnboundPrimitives` — a transitional map, now empty, whose two failure branches
  lost their isolated tests when it was emptied. That is recorded in *Known debt*, and a
  planner should decide whether to delete it rather than inherit it.
- `scripts/behaviour-contracts.test.mjs` — 30 tests.

`check:behaviour` asserts: patterns are well formed; every React component declares;
every Angular primitive declares; every component Angular does not implement is declared
delegated or absent; no delegated entry is stale; and the layers name the same pattern or
say why not. It is runtime-portable and verified under plain `node`.

### The values layer, from plan 7a

`tokens/src/behaviour.json` holds five script-readable tokens — `delay.open` (400ms),
`delay.close` (120ms), `dismiss.default` (4200ms), `dismiss.actionable` (7000ms),
`limit.pagination-siblings` (1). All are consumed by React only; Angular has no
`Tooltip`, `Toast` or `Pagination` primitive. `--delay-open`'s own `$description` records
a constraint this spec must honour: **those delays are pointer intent, and a keyboard
focus must reveal immediately.**

### Test harnesses that already exist

- `frameworks/react/test/` — six suites asserting on `renderToStaticMarkup` output. **No
  DOM**: they cannot dispatch an event or hold focus. `test:react` runs
  `bun test frameworks/react/test`.
- `frameworks/angular/test/` — real zoneless Angular trees under `happy-dom`, via
  `@angular/platform-browser`, `happy-dom` and `@happy-dom/global-registrator`. It runs
  `@angular/compiler`'s JIT, never `ngtsc`, which bounds it: **a signal input cannot be
  driven through a template binding** (throws NG0303) and `contentChild()` queries do not
  resolve. `TestBed.initTestEnvironment()` may be called only once per `bun test`
  process, so anything needing a real render goes in `host-class-binding.test.ts` with
  scoped hooks, and every directly-created fixture must be `destroy()`-ed.

---

## What this does NOT solve, stated first so nobody reads it as a fix

**It does not make any component accessible.** It verifies claims. A component that
declares four honest exceptions and fixes none of them passes every level this spec
proposes. Closing the gaps is component work, one at a time, and belongs to nobody's
plan yet.

**It does not verify sequential focus navigation.** `happy-dom` does not implement it —
pressing Tab does not move `document.activeElement`. "Escape closes", "focus lands on the
first control", "`aria-expanded` flips" are reachable; "Tab cycles inside the trap and
cannot escape" is not, by render. That invariant is tested as a pure function against
`frameworks/angular/primitives/focus-trap.ts`, which is already factored for exactly
this. **A gate needing a real browser would be the fourth non-portable gate and this spec
declines it** — `check:cards`, `check:vendor` and `check:demos` are the only three, and
each already costs the run an `INCOMPLETE` when its dependency is missing.

**It does not verify the delegated declarations.** Twenty-two entries assert things about
Angular Material's behaviour, and no static scan or render suite of Arena's can check a
third-party library. That is recorded in `CLAUDE.md`'s *Known debt* with two cheap
mitigations, and is not this spec's subject.

**It does not touch the API surface.** `StatCard`'s `delta` being one object prop in
React and three flat inputs in Angular is plan 8's subject.

---

## Design

### 1. Level 2 — a static scan, and an honest account of what it can see

**The idea.** For each binding, scan the component's source for evidence of the
requirements it claims to meet, and fail when the evidence contradicts the claim in
either direction:

- a requirement claimed met with no evidence in the source
- an **exception that is stale** — the requirement is now met, and the exception should
  have been deleted

The second is the more valuable, and it is the property the layer was modelled on:
`check-dimension-literals.mjs`'s `EXEMPT` fails on an entry that no longer matches a real
violation, and that is why it is trusted.

**What a text scan can and cannot judge, from the repo's own experience.**
`check-manifest-states.mjs` already does this shape — it flags a Tailwind state modifier
in a manifest whose mirrored React component implements no hover or focus anywhere — and
it carries an `EXEMPT` map for hits a whole-file scan cannot resolve. Expect the same
here. Concretely, from what 7b's bindings actually assert:

- **Reachable by scan:** `role="dialog"` present; `aria-modal` present; an `onKeyDown`
  handler mentioning `Escape`; a `focus-trap` import; `tabIndex`; `aria-expanded`.
- **Not reachable:** whether focus actually *lands* anywhere; whether a role is on the
  right element (7b found `Menu`'s `aria-haspopup` on a wrapping `<span>` rather than the
  focusable trigger — a text scan sees the attribute and calls it met); whether a
  conditional branch renders the role in every variant (7b found `Skeleton` carries
  `role="status"` in three of four).
- **A known blind spot to inherit:** Angular's `[attr.x]` and `[style.x]` binding forms,
  and host-object literals in the `@Component` decorator, are three different ways to
  author the same attribute. `check-dimension-literals.mjs` already cannot see
  `[style.x]`. A scan that only greps for `role="` will report every Angular primitive as
  non-compliant.

**The consequence to accept up front, and it is uncomfortable:** level 2 will produce
false positives on exactly the components whose bindings are most carefully written, and
its `EXEMPT` map will absorb them. A planner should size that honestly rather than assume
the scan is mostly free.

### 2. Level 3 — render suites, and the harness React does not have

**Angular's half is cheap.** The harness exists, renders real zoneless trees under
`happy-dom`, and its limits are documented. Escape-closes, initial-focus and
`aria-expanded`-flips are all reachable. What is not: driving a signal input through a
template binding (NG0303), and `contentChild()` queries. Factor the logic into plain
exported functions and test those — the strategy CLAUDE.md already states, and the one
`focus-trap.ts` and `chart-internals.ts` were factored for.

**React's half needs a DOM, which it does not have.** `frameworks/react/test/` holds six
suites asserting on `renderToStaticMarkup` — enough for structure and conditional
branches, useless for dispatching an event or holding focus. What is missing is a DOM,
not a suite: `happy-dom` plus `react-dom/client`, **both already devDependencies**
(`react`/`react-dom` because `frameworks/react/vendor/*.js` is built from them,
`happy-dom` because the Angular harness needs it). The marginal cost is a second harness
style inside an existing directory, not a new project.

**What to test, and the trap to avoid.** Plan 7a's whole-branch review found that the
branch had *"tested the thing that could not break and left the thing that could
untested"* — `Pagination`, a pure relocation with no rendered change, gained five tests;
`Tooltip`'s new timer logic gained none. Level 3 must aim at the same target the contract
layer aims at: the requirements whose failure is invisible. Start with `dialog-modal`,
where three components share one contract and the cost of being wrong is highest.

**Two specific behaviours already recorded as untested debt**, both in `CLAUDE.md`:
`Tooltip`'s cancel-on-transition timer (a `useRef`, a cancel rule, an unmount cleanup —
`bun:test`'s fake timers reach it without any harness), and
`validateUnboundPrimitives`' two failure branches.

### 3. The migration of `components-divergences.md`

1119 lines, split by a seam plan 7's spec already identified:

- **Structural divergences** (roughly the first 300 lines) — *"an Angular primitive
  host-binds its root"*, *"the Tailwind layer is border-box"*, *"the Angular layer has no
  Button primitive"*. These are not per-component and no binding can express them. **They
  stay as prose.**
- **Per-component behaviour divergences** (the rest) — *"ConfirmDialog — Angular is
  accessible, React is not yet"*, *"CommandPalette — Angular is an accessible combobox"*.
  These are contract exceptions written before there was a contract to declare them
  against. **They migrate into `exceptions`**, and the prose worth keeping survives as
  the `reason` field, which is free text and takes a whole sentence.
- **Per-component API divergences** — *"StatCard — `delta` is one object prop in React,
  three flat inputs in Angular"*. No ARIA pattern expresses these. **They stay**, and are
  plan 8's subject.

Three bindings already cite this document as supporting evidence
(`command-palette.behaviour.json`, the `SideNav` delegated entry, and
`frameworks/angular/primitives/onboarding/onboarding.ts`). A migration that deletes a
cited section without redirecting the citation breaks it.

**Sequence the migration last.** Levels 2 and 3 will change which exceptions are true —
a stale-exception check will delete some, and a render suite may prove others wrong.
Migrating first means migrating prose into entries that are about to move.

---

## What executing 5.5, 7a and 7b taught

Every item here cost something to learn. A plan written from this spec should carry them
as steps, not as advice.

**Four gates react to a change in this area, and only one is obvious.**

- `check:coverage` inventories the four **generated CSS files**, so any new token must
  reach a Tailwind utility or be named in `EXCLUDED` with a reason. Plan 5.5's plan
  omitted this entirely and would have failed its own completion gate.
- `scripts/check-all.test.mjs` asserts the gate count **and the gate-name array by
  literal value**. It is at 19 and moves with any gate this plan adds.
- `check:demos` guards a committed compiled `.js` sibling for every `.jsx`. Editing a
  component without running `bun run build:demos` leaves committed output stale.
- `check:dtcg` needs nothing: `$extensions` accepts any reverse-DNS key.

**A gate's scan cannot run at top level.** Its own test imports it for pure helpers, and
an unguarded `process.exit(1)` kills the test process. Use `main()` behind
`if (process.argv[1] === fileURLToPath(import.meta.url))`. This bit two gates.

**Never derive one layer's name from the other's.** `scriptName('sp-4')` is `sp4` and
nothing recovers `sp-4` from that; a kebab Angular directory and a Pascal React component
are the same trap. Carry the name explicitly. A cross-layer check that silently never
fires looks exactly like coverage.

**A test that recomputes the implementation's own formula cannot fail.** Plan 7a's
pagination tests did, and were rewritten to pin concrete outputs with a guard test that
forces the pins to be re-derived by hand when the input changes.

**Prove a gate fires.** A gate whose failure path has never been seen is untested. 7b
proved its cross-layer check by injecting synthetic bindings, and both stale-entry rules
by breaking the tree and reverting. Budget a step for it.

**Debt goes in `CLAUDE.md`'s *Known debt*, never in the plan document.** Plans under
`docs/superpowers/` are deleted once executed (`24f250b`), and plan 5.5 nearly lost three
follow-ups that way.

**Expect the plan to be wrong in places and let execution find it.** Across three plans,
review caught: a `*/` inside a block comment, top-level code that killed its own test, an
unsafe name inverse, a wrong import depth, a "prove the gate fails" step that could not
fail, a pattern edited to make one binding validate, and a pattern (`none`) used for a
component that does not render. Each was back-ported into the plan, not only the code.

---

## Sequencing

```
5.5 script-readable token target   <- merged, 5d043ec
7a  behaviour value tokens          <- merged, e5ccff3
7b  behaviour contracts             <- merged, 747c970
7c  THIS SPEC                       <- next
8   API capability contracts
9   four-package build + publish    <- last
```

**Why after 7b, and not folded into it.** 7b authored 86 declarations, each requiring a
component to be read. Adding two verification levels and a 1119-line migration would have
produced a plan nobody finishes, which CLAUDE.md warns against by name.

**Why before 8.** Plan 8 reuses this chain's conventions — the sidecar-beside-the-component
file, the reason-per-entry format, the stale-entry rule — and its own assertion 1 needs
the "every layer, never at least one" phrasing this chain settled.

**This may itself be more than one plan.** Levels 2 and 3 and the migration are three
subsystems with different shapes: a text scanner with an `EXEMPT` map, a render harness,
and a documentation migration. A planner should size them and split rather than assume
one plan holds all three. That call belongs to the planner, with the evidence above.

---

## Non-goals

- **Making any component accessible.** This verifies claims; it does not close gaps.
- **A browser-driven gate.** A fourth non-portable gate is refused.
- **Verifying the delegated declarations.** No scan of Arena's can check Angular
  Material. Recorded in *Known debt* instead.
- **Touching the API surface.** Plan 8's subject.
- **Deleting `components-divergences.md`.** Its structural half has no other home.
- **Changing any rendered output.** If a task finds itself editing a component to make a
  contract true, it has left this spec's scope.

---

## Open questions — must be answered before a plan is written

1. **Is level 2 worth its false-positive rate?** §1 argues a text scan cannot see whether
   a role is on the right element or present in every branch — the two mistakes 7b's
   review actually found. If its `EXEMPT` map ends up holding most of the interesting
   components, the scan is ceremony. Size it against a sample of ten real bindings before
   committing to it, and be willing to conclude that level 3 alone is the better buy.
2. **Does the stale-exception check belong to level 2 or level 3?** It is the most
   valuable single assertion in this spec. A text scan can approximate it cheaply and
   wrongly; a render suite can prove it exactly and only where a suite exists. It may
   want to be its own thing rather than a clause of either.
3. **How does a scan see Angular's three ways of authoring an attribute** — a template
   literal, `[attr.x]`, and a host-object literal in the `@Component` decorator? A scan
   that handles only the first reports every primitive as non-compliant.
4. **How much of level 3 is worth writing before the components are fixed?** A render
   suite proving `Tabs` has no roles is a test asserting a known defect. Useful as a
   regression guard once fixed, noise until then. Decide whether level 3 targets the
   compliant claims (guarding against regression) or the excepted ones (guarding against
   a silent fix nobody records).
5. **Does the React DOM harness live beside the `renderToStaticMarkup` suites or apart?**
   Both in `frameworks/react/test/`, one directory, two harness styles that must not
   collide — `@happy-dom/global-registrator` registers globals process-wide, and
   `bun test` runs a directory in one process.
6. **What redirects the three citations** into `components-divergences.md` when the
   sections they cite migrate?
7. **Is `figure-with-data-table` verifiable at all?** Its `alternative.table` requirement
   — "a real `<table>` of the plotted numbers, visually hidden" — is a claim about
   semantics no scan can judge and a render suite can only partly.

---

## Affected files, provisionally

**New:** a level-2 gate and its suite under `scripts/`; a DOM-based React harness under
`frameworks/react/test/`; behaviour suites under `frameworks/angular/test/`.

**Modified:** `scripts/check-all.mjs`, `scripts/check-all.test.mjs`, `package.json`;
`scripts/lib/behaviour-contracts.mjs` if the scan reuses its loaders; many
`*.behaviour.json` as stale exceptions are retired; `components-divergences.md`;
`CLAUDE.md`, `CHANGELOG.md`.

**Unchanged, and this is a hard constraint:** every component source. This plan verifies
declarations. The moment it edits a `.jsx` or a primitive's `.ts` to make a contract
true, it has become a different plan.
