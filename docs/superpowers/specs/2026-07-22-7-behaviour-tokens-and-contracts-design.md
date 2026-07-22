# Behaviour tokens and behaviour contracts — Design

**Status:** DRAFT — not approved. Written 2026-07-22 at the request of the repo owner.
**Revised 2026-07-22 after plan 5.5 shipped**: its hard dependency is no longer a draft
to be argued for but working infrastructure with names, and §3 now describes what exists
rather than what was proposed. See *What plan 5.5's execution settled*. The remaining
open questions are real and must be answered before a plan is written from this.
**Execution order:** plan 7 of 9 — **next**. 5.5 is merged (`5d043ec`); 8 follows this;
publication is plan 9 and goes last.
**Depends on:** the script-readable token target from
`2026-07-19-5.5-chart-geometry-token-target-design.md` — **shipped and merged**, no
longer a dependency to wait on. This spec extends it rather than requiring it be built.
**Blocks:** `2026-07-22-8-api-contracts-design.md` (plan 8).

## Problem

`tokens/` is the single source of truth for Arena's design, and every framework layer
adopts it. Behaviour has no equivalent. It has a *record* —
`components-divergences.md`, 1119 lines of it — and that file opens by saying the quiet
part out loud:

> **No layer is the absolute authority for component behaviour.** Where the layers
> genuinely differ, the difference is recorded here rather than treated as a defect in
> whichever layer was written second.

That was the right call while the layers were being built. It has three costs that are
now being paid:

1. **Nothing is authoritative, so nothing can be wrong.** `CommandPalette` in Angular is
   an accessible combobox with roles, `aria-expanded` and managed active-descendant;
   `CommandPalette` in React sets no roles at all. That is recorded as a divergence, and
   a divergence is by definition not a defect. But one of these two ships a keyboard
   trap to a screen-reader user and the other does not.
2. **The record has no expiry.** A divergence that converges stays written down until
   someone notices. There is no mechanism that fails when an entry stops describing
   reality — which is precisely the mechanism `check-dimension-literals.mjs`'s `EXEMPT`
   map has, and the reason that map is trusted.
3. **Components with no entry say nothing at all.** `Card`, `Tag`, `StatCard`, `Badge`
   have no divergence recorded — but "no entry" and "verified equivalent" are the same
   glyph. The absence carries no information.

Underneath the record there is a second, smaller problem that is easier to see:
**behaviour has values, and they are not tokens.**

- `Toast` delegates auto-dismiss to its host. The actual number lives in
  `frameworks/react/ui_kits/console/index.entry.jsx` as `4200`. The most visible timing
  decision in the system is not owned by the system.
- `Tooltip` has no open or close delay. It appears on `mouseenter` and vanishes on
  `mouseleave`. That is not a mis-tokenized value; it is a missing one, and it is why
  dragging a pointer across a toolbar flickers.
- `CommandPalette` filters on every keystroke with no debounce. `useContainerWidth`,
  which `Table` and `Calendar` both depend on, re-measures with none either.

## What this does NOT solve, stated first so nobody reads it as a fix

**It does not make the two layers behave the same.** It makes them *declare* what they
do, against a shared contract, and it fails when a declaration goes stale. Convergence
is a consequence that follows one component at a time; it is not delivered by this plan
and any plan written from this spec must resist promising it.

**It does not verify keyboard navigation end to end.** `happy-dom` does not implement
sequential focus navigation — pressing Tab does not move `document.activeElement`. So
"Escape closes", "focus lands on the first control", "`aria-expanded` flips" are
verifiable; "Tab cycles inside the trap and cannot escape" is not, by render. That
invariant is tested as a pure function against `focus-trap.ts`, which is already
factored for exactly this reason and which CLAUDE.md already names as the strategy.
A gate that needed a real browser would be the **fourth** non-portable gate, and this
spec declines that.

**It does not cover API shape.** *"StatCard — `delta` is one object prop in React, three
flat inputs in Angular"* is a real divergence and no ARIA pattern expresses it. That is
plan 8's subject, designed in the sibling spec.

**It does not move `dur`, `ease` or `loop`.** Those are motion — how a transition looks —
and they stay in `effects.json`. Moving them would churn `--dur-*` through the whole
Tailwind layer for no gain.

## What plan 5.5's execution settled

5.5 is merged (`5d043ec`). Some of what it taught is not in its spec, because it only
appeared while executing — and every item here is a thing a plan written from THIS spec
would otherwise rediscover the hard way.

**Four gates will react to new tokens, and only one is obvious.**

- `check:coverage` inventories **the four generated CSS files**, so every behaviour token
  lands in it and must either reach a Tailwind utility or be named in `EXCLUDED` with a
  reason. `delay`, `dismiss`, `debounce` and `limit` reach no utility and should not — the
  consumer is `setTimeout`, not a class. The precedent to follow is `bp-sm`/`bp-md`/`bp-lg`
  (*"read by JS through getComputedStyle, never a media query"*). **5.5's plan omitted this
  entirely and would have failed its own completion gate**; it was caught in pre-flight.
- `check-all.test.mjs` asserts the gate count **and the gate-name array by literal value**.
  This spec adds two gates, so it moves 18 → 20 — and the test moves with them or it fails.
- `check:script-tokens` will start reporting orphans the moment a behaviour token is
  flagged and before anything imports it. That red state is correct and expected; the plan
  must say so per step, or an implementer will silence it.
- `check:dtcg` needs no change: `$extensions` accepts any reverse-DNS key.

**A gate script cannot run its scan at top level.** Its own test imports it for pure
helpers, and an unguarded `process.exit(1)` kills the test process before any assertion
runs. Wrap the scan in `main()` behind `if (process.argv[1] === fileURLToPath(import.meta.url))`,
the idiom `check-arbitrary-values.mjs` and `check-dimension-literals.mjs` already use.
Both gates this spec proposes will hit this.

**The day-one strategy works, and is now evidence rather than hope.** §8 proposes writing
every binding first, declaring exceptions where reality does not comply, and being green
from the first commit — where green means *declared*, not *compliant*. 5.5 ran the same
shape for `EXCLUDED` and `EXEMPT` across ten tasks and never had a red tree.

**The gates 5.5 shipped have a known hole, and this spec inherits its shape.** Recorded in
CLAUDE.md under *Known debt*: `check:script-tokens`' orphan rule is *imported by at least
one layer*, so once one layer imports a token the gate says nothing about the other, and
`check:duplicate-constants` cannot close it because the layers have opposite idioms.
**The same asymmetry threatens this spec's central claim.** Per-layer binding files are
what let a gate catch React and Angular declaring different patterns for one component —
but a rule phrased as *at least one layer* would silently accept one layer declaring
nothing. Phrase level 1 as **every layer**, and treat a component absent from a layer
(Angular has no `Calendar`, no `Button`) as an explicit declaration rather than an absence.

**Debt goes in CLAUDE.md, never in the plan.** 5.5's close-out recorded three follow-ups
into its own plan document, which is deleted once executed — they were nearly lost and had
to be moved. Any plan from this spec should file its residue under CLAUDE.md's *Known debt*
from the start.

**Expect the plan itself to be wrong in places, and let execution find it.** Five defects
in 5.5's plan surfaced only by running it: a `*/` inside a block comment, top-level code
that killed its own test, an unsafe camelCase↔kebab inverse, a wrong import depth, and a
"prove the gate fails" step that could not fail. Reviewers caught all five, and each was
back-ported into the plan rather than only into the code.

## Design

### 1. Two layers, and the split is the design

Behaviour is two unlike things wearing one word, and the failure mode of every attempt
at "behaviour tokens" is treating them as one:

- **Values that parametrize behaviour** — a delay, a dismissal timeout, a debounce, a
  cap on results. These are ordinary DTCG values. `duration` and `number` already
  express all four.
- **Contracts that constrain behaviour** — which roles, which keys, where focus goes,
  what dismisses. DTCG does not model these and is not going to; it is a *value*
  specification. Forcing a contract into DTCG means relaxing `check-dtcg.mjs`, which is
  one of the cleanest gates in the repo.

So they live in two places, and only one of them is under `tokens/`:

```
tokens/src/behaviour.json                        DTCG. Values. Built like everything else.
frameworks/<layer>/tokens.generated.{js,ts}      Generated by 5.5's target, per layer.

behaviour/patterns/*.json                        Contracts. Not tokens. No Style Dictionary.
frameworks/<layer>/**/X.behaviour.json           The explicit binding, one per component per layer.
```

`behaviour/` sits at the repo root, a **sibling** of `tokens/`, not a child. The root is
already where the framework-agnostic language lives. `tokens/` answers *what a value
is*; `behaviour/` answers *what a component must do*.

### 2. The value layer

One more file in `tokens/src/`, treated exactly like `layering.json`: strict DTCG, a
`$description` per slot, and it appears in the Overview with no edit to the page.

```jsonc
{
  "delay": {
    "$type": "duration",
    "$description": "Pointer intent — how long a pointer must rest on a target before a\ndeferred affordance appears, and how long it may leave before that affordance\nwithdraws. Deliberately not part of dur: dur measures how long a transition\ntakes once it has been decided; delay measures how long we wait before\ndeciding. Tooltip had neither value and opened on mouseenter, which flickers\nwhen a pointer merely crosses a toolbar.",
    "open":  { "$value": { "value": 400, "unit": "ms" } },
    "close": { "$value": { "value": 120, "unit": "ms" } }
  },
  "dismiss": {
    "$type": "duration",
    "$description": "Automatic permanence — how long a transient notice remains before\nit withdraws itself.",
    "default":    { "$value": { "value": 4200, "unit": "ms" } },
    "actionable": { "$value": { "value": 7000, "unit": "ms" } }
  },
  "debounce": {
    "$type": "duration",
    "$description": "Input latency — how long a rapidly-changing input is allowed to\nsettle before dependent work runs.",
    "input":  { "$value": { "value": 200, "unit": "ms" } },
    "resize": { "$value": { "value": 100, "unit": "ms" } }
  },
  "limit": {
    "$type": "number",
    "$description": "Quantity bounds — system-wide invariants about how much is shown,\nnot geometry. The twin of z: same $type, same character.",
    "results":             { "$value": 8 },
    "pagination-siblings": { "$value": 1 }
  }
}
```

Three notes on the values themselves.

**`dismiss.actionable` is not padding, it is WCAG 2.2.1.** A toast carrying a button
asks the reader to *decide*, not merely to read. 4.2 seconds is enough for the second
task only if the reader was already looking. `persist` (README H1) remains the escape
hatch that disables both, and stays mandatory in critical states.

**`limit` is `number`, and `z` already made that argument.** `layering.json` established
that a system-wide invariant with no geometric meaning is a legitimate token, and that
the family declaring the *order* matters more than the values. `limit` is the same
shape: a cap on results is a design decision about legibility, not a measurement.

**The proposed numbers are a starting point, not a finding.** `4200` is what ships
today; `400`/`120`/`200`/`100`/`8`/`1` are conventional. A plan should calibrate them
against the real components and record the calibration, not import these as given.

### 3. Dual emission, and why this spec depends on 5.5

`delay`, `dismiss`, `debounce` and `limit` are consumed by **JavaScript**, not by CSS.
They are arguments to `setTimeout` and bounds on an array slice. A custom property alone
leaves them unreachable in practice: a component would have to `getComputedStyle`, read
`"4200ms"`, and parse it to a number. Nobody pays that cost twice, and the second time
they write `4200` by hand — which is the state the repo is in today.

**This is no longer a mechanism to design. Plan 5.5 shipped it, and this spec's job here
shrinks to authoring four token families into infrastructure that already works.** Flag a
token and it emits; nothing in this section needs building.

What exists, by name, as of `5d043ec`:

- the flag is `$extensions: { "com.dravensoft.arena": { "script": true } }`, declared in
  the DTCG source rather than in a list inside the build script;
- `scripts/build-tokens.mjs` exports `collectScriptTokens()` (which carries **both** a
  token's kebab `cssName` and its camel `jsName` — never re-derive one from the other,
  `scriptName('sp-4')` is `sp4` and nothing recovers `sp-4` from that),
  `buildScriptModules()` and `SCRIPT_TARGETS`;
- `scripts/lib/serialize-script.mjs` renders a flagged token to its bare number, and
  **refuses any `$type` whose value is not a number** — only `dimension`, `duration` and
  `number` are flaggable, which covers all four behaviour families;
- emission is **dual and per layer**: the CSS custom property *and* an entry in
  `frameworks/react/tokens.generated.js` and `frameworks/angular/tokens.generated.ts`;
- `bun run check:script-tokens` asserts the committed modules match the source, that each
  export agrees with its custom property, and that no flag is orphaned.

So behaviour values do not get their own module. **They extend the two that exist**, and
arrive by the same intra-layer import — the shape `../charts/chart-internals.js` already
had, which is why the copy-in kit needed one more entry in the dependency list at
`README.md:52` rather than a new concept. That was this spec's open question 1, and 5.5
settled it in practice, not just on paper.

**Behaviour values remain the cleaner fit for the mechanism, and shipping proved it.**
5.5 accepts a real cost: a value bound at import time **cannot re-densify or re-theme**.
For chart geometry that is a limitation the spec had to argue past, and CLAUDE.md now
states it as non-negotiable. For a debounce it is not a limitation at all — a dismissal
timeout has no light-mode variant and no compact variant, and never will.

### 4. The contract layer — patterns

One pattern per file in `behaviour/patterns/`, **derived from WAI-ARIA APG** and
carrying the source URL, so the contract is adopted rather than invented. There is no
standard for "behaviour tokens" and this spec does not pretend to write one; APG is the
normative catalogue the industry actually uses, and Open UI and Zag.js are the two prior
efforts at making it shared across frameworks.

Mapping the 43 real components produces ~18 patterns and a `none`:

| Pattern | Components |
|---|---|
| `dialog-modal` | Dialog, ConfirmDialog, Onboarding |
| `combobox` | CommandPalette, Select |
| `menu-button` | Menu |
| `tabs` | Tabs |
| `alert` / `status` | Alert, Toast, ErrorState |
| `tooltip` | Tooltip |
| `textbox` | Input, Textarea |
| `switch`, `checkbox`, `radiogroup` | Switch, Checkbox, Radio, SegmentedControl |
| `button` | Button, IconButton, ThemeToggle |
| `progressbar` | ProgressBar, Spinner |
| `feed` | ActivityFeed |
| `grid` | Table, Calendar |
| `breadcrumb`, `navigation` | Breadcrumbs, SideNav, Pagination |
| `toolbar` | BulkActionBar |
| `none` | Card, Badge, Tag, StatCard, Avatar, EmptyState, Skeleton, ChartCard, AppLogo, PageHead, UnauthCard, the three charts |

`Calendar` is the least settled row. It renders a time grid rather than a data table, and
whether APG's `grid` is the right pattern or it needs its own is an open question below.

**That three components share `dialog-modal` is the entire point.** That contract is
currently written three times implicitly, which is why Onboarding diverged: the record
says *"Angular's modal is a real modal, React's is an assertion"*. Written once, the
divergence has somewhere to be measured from.

A pattern is declarative, with no prose, so a gate can read it:

```jsonc
// behaviour/patterns/dialog-modal.json
{
  "name": "dialog-modal",
  "source": "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "roles":    { "required": ["dialog"], "attributes": ["aria-modal=true", "aria-labelledby"] },
  "focus":    { "onOpen": "first-focusable", "onClose": "restore-invoker", "trap": true },
  "keyboard": { "Escape": "close", "Tab": "cycle-within", "Shift+Tab": "cycle-within-reverse" },
  "dismiss":  { "escape": true, "scrimClick": "optional", "outsideClick": false }
}
```

### 5. The contract layer — bindings, and they are mandatory

**Every component, in every layer, declares a binding. A component with no binding fails
the gate.** This is the shape of `check:coverage`, where every token either reaches a
utility or is named in `EXCLUDED` with a reason — and it is the property that fixes cost
3 in *Problem*: silence stops being ambiguous.

The binding lives **next to the component, per layer** — not in one central registry.
That placement is what makes the decisive check possible: React and Angular each state
their own pattern, so a gate can catch the two layers claiming different contracts for
one component. That is not hypothetical. It is `CommandPalette` today.

```jsonc
// frameworks/react/components/navigation/CommandPalette.behaviour.json
{
  "pattern": "combobox",
  "exceptions": [
    { "requirement": "roles.required",
      "reason": "React sets no roles yet; Angular is the accessible reference for this component. Converging." }
  ]
}
```

`exceptions` is deliberately the same shape as the repo's `EXEMPT` maps, including the
property that matters most: **a stale exception fails the gate.** When React finally
sets `role="combobox"`, the exception stops corresponding to a real violation and the
gate forces its removal. That is the mechanism `components-divergences.md` structurally
lacks.

`"pattern": "none"` **requires a `reason`**. `Card` declaring
`"presentational surface, no interactive affordance"` is thirty seconds of work that
converts forty silences into forty assertions.

### 6. Verification — three levels, no new non-portable gate

| Level | Where | What it proves |
|---|---|---|
| 1 | `check:behaviour` | Every component declares a binding; the named pattern exists; both layers agree or the difference is an explicit exception; no exception is stale |
| 2 | `check:behaviour` | Static scan of statically-visible requirements: `role=`, `aria-*`, `Escape` in a key handler, use of `focus-trap` |
| 3 | `test:behaviour` | Real render under `happy-dom`: Escape closes, initial focus lands, `aria-expanded` flips. Cycling invariants as pure functions over `focus-trap.ts` |

Level 2 is `check-manifest-states.mjs`'s technique and inherits its honesty: a whole-file
text scan proves **presence, not behaviour**, and needs its own `EXEMPT` map for hits it
cannot resolve — a requirement delegated to a composed child, most obviously. That gate
already carries exactly this and its limits are known.

Level 3 needs no browser. Angular reuses the existing zoneless `happy-dom` harness, with
its documented JIT limits — signal inputs cannot be driven through a template binding,
so the same "factor the logic into plain exported functions" strategy applies.
**React gets its first render suite in the repo**: `frameworks/react/test/`, using
`happy-dom` and `react-dom/client`. Both are already devDependencies — `react`/`react-dom`
because `frameworks/react/vendor/*.js` is built from them, `happy-dom` because Angular
needs it. The marginal cost is a directory, not a project.

`bun run check` goes from **eighteen** gates to twenty — 5.5 already took it from sixteen
to eighteen — and the set of non-portable gates stays exactly `check:cards`,
`check:vendor`, `check:demos`. `scripts/check-all.test.mjs` asserts both the count and the
name array literally, so it moves with them.

### 7. What becomes of `components-divergences.md`

The file holds two unlike things, and it should be split along that seam.

**Structural divergences stay prose** — lines 20–320. *"An Angular primitive host-binds
its root"*, *"The Tailwind layer is border-box"*, *"The Angular layer has no Button
primitive"*, *"Animation CSS is compiled once for Angular"*. These are not per-component
and no binding can express them.

**Per-component behaviour divergences migrate into `exceptions`** — *"ConfirmDialog —
Angular is accessible, React is not yet"*, *"ErrorState — Angular announces itself,
React is silent"*, *"CommandPalette — Angular is an accessible combobox"*. These are
contract exceptions written in prose because until now there was no contract to declare
them against. The prose worth keeping survives as the `reason` field, which is free text
and takes a whole sentence.

**Per-component API divergences stay put for now** — *"StatCard — `delta` is one object
prop in React, three flat inputs in Angular"*, *"AppLogo — the mark is a prop in React,
projected content in Angular"*. No ARIA pattern expresses these and they must not be
forced into one. Plan 8 takes them.

### 8. Landing, and the honest thing about day one

A normative gate against ~43 components × 2 layers is red on day one. The only sequence
that works is: write every binding, declare an exception with a reason wherever reality
does not comply, and **the gate is green from the first commit** — where green means
*everything is declared*, not *everything complies*. Every exception retired afterwards
is a measurable improvement, and none can rot, because a stale one fails.

This is the move `check:dimensions` already made with its `EXEMPT` map, which is why it
is known to work in this repo rather than merely hoped to.

Order, each step leaving the tree green:

1. `tokens/src/behaviour.json`, `TYPE-MAP.md`, the script-readable emission and its
   parity gate. **Touches no component.**
2. Consume the values: the Console's `4200` becomes `dismiss.default`; `Tooltip` gains
   `delay.open`/`delay.close`; `CommandPalette` and `useContainerWidth` gain
   `debounce.input`/`debounce.resize`.
3. `behaviour/patterns/` — the ~17 patterns, each carrying its APG URL.
4. Bindings across both layers, plus `check:behaviour` level 1. The exceptions land here.
5. Level 2 static scan and its `EXEMPT`.
6. Level 3 render suites, starting with `dialog-modal`, where the cost of being wrong is
   highest.
7. Split `components-divergences.md` along the seam and migrate.

Steps 1–2 are worth landing alone: they fix a real defect (`Tooltip`'s missing delay,
the unowned `4200`) and are useful whether or not the contract layer proceeds.

## Sequencing

```
5a  Angular primitive parity          <- executed
5b  Tailwind manifest parity          <- executed
5.5 chart geometry / script target    <- EXECUTED and merged, 5d043ec
7   THIS SPEC                         <- next
8   API capability contracts
9   four-package build + publish      <- moved from 6 on 2026-07-22; last
```

**Why after 5.5, and why that was a hard dependency rather than a preference.** This spec
needs a build target that emits JS from DTCG. 5.5 built exactly that — the `$extensions`
flag, the dual per-layer emission, the parity and orphan gates. Building a second one here
would have been two mechanisms for one job, the drift this repo exists to prevent. That
risk is now closed: the mechanism exists, is gated, and this spec extends it.

**Why publication is now last, which removes a tension this spec used to carry.** In the
original chain, publication was plan 6 and sat *before* this spec — so a JS export
condition would have shipped, and then this spec would have added a second family of
values to it. The 2026-07-22 renumbering moves publication to plan 9, after 5.5, 7 and 8.
The token package's shape is therefore settled before anything is published, which is
5.5's own argument (*a published version is permanent in a way a package name is not*)
applied to the whole chain rather than to one plan.

**Why before 8.** Plan 8 reuses this plan's infrastructure directly: the
component→layer resolver, the exception format with its stale-entry rule, and the
binding file convention. Built simultaneously, that work is duplicated or half-finished
in both.

## Non-goals

- **Converging the layers.** Named in *What this does NOT solve*. Declaration first.
- **A general "tokens in JS" export.** 5.5's non-goal, inherited verbatim: only flagged
  tokens emit. Colors and spacing resolve in the browser, and reading them from JS
  breaks theming and density.
- **Moving `dur`, `ease`, `loop`.** Motion is not behaviour.
- **Making behaviour values re-densify or re-theme.** Accepted in §3, and unlike 5.5's
  version of this cost, nothing here wants to.
- **A browser-driven behaviour gate.** A fourth non-portable gate is refused.
- **Replacing `components-divergences.md`.** It keeps the structural half, which nothing
  else can hold.

## Open questions — must be answered before a plan is written

1. ~~**What does the copy-in kit's instruction become?**~~ **ANSWERED 2026-07-22, jointly
   with 5.5, and no longer blocking.** The generated module is emitted **per framework
   layer**, so the import never crosses the `tokens/` ↔ `frameworks/` boundary and the
   kit gains one entry in the dependency list `README.md:52` already carries — not a new
   concept. The prop-with-token-default candidate this spec floated is **rejected**: it
   does not remove the import, and it adds props for packaging reasons exactly as plan 8
   begins contracting the API surface. Full reasoning in 5.5's *What 2026-07-22 settled*.
2. **Are the proposed numbers right?** §2. `4200` is inherited; the other six are
   conventional. Calibrate against the real components before freezing.
3. **Is `limit` one family or two?** `limit.results` is a legibility decision;
   `limit.pagination-siblings` is arguably layout. If they are unlike, one of them is
   not a behaviour token.
4. **How does a pattern express an *optional* requirement?** `dialog-modal`'s
   `scrimClick` is `"optional"` above, but a gate cannot check "optional" and an
   optional requirement is one nobody has decided. Either it is required or it belongs
   in the binding as a per-component choice.
5. **What is the granularity of `exceptions.requirement`?** `"roles.required"` is a
   whole clause; a component may comply with `aria-modal` and not with `aria-labelledby`.
   Too coarse and one exception excuses too much; too fine and the files bloat.
6. **Which layer's binding wins when they disagree and neither declares an exception?**
   The gate must fail — but with what message, and does the contract name a reference
   layer? Angular is currently the accessible one more often than not, and encoding that
   as policy is a decision, not an observation.
7. **Does `SideNav` get a binding, given the record says it is described three times and
   only the colours agree?** It may need resolving before it can be bound at all.
8. **Do the three charts bind `none`, or do they need a pattern?** A chart with a
   keyboard-reachable legend — which Angular's DoughnutChart has and React's does not —
   is not presentational.
9. **Is `Calendar` a `grid`?** §4. It renders a time grid, not a data table, and APG's
   `grid` assumes cells that are navigable in two axes. Either it fits, it needs its own
   pattern, or it binds `none` with a reason — and one of the three has to be argued.

## Affected files, provisionally

**Build:** `scripts/build-tokens.mjs` — **no change to the emission mechanism**, which 5.5
built; only new flagged tokens in the source. Plus a new
`scripts/check-behaviour.mjs` and its test, `scripts/check-behaviour-generated.mjs`,
`scripts/check-all.mjs`, `package.json`.

**Token source:** `tokens/src/behaviour.json` (new), `tokens/src/TYPE-MAP.md`.
Generated: the behaviour entries appear in `frameworks/react/tokens.generated.js` and
`frameworks/angular/tokens.generated.ts` — 5.5's per-layer modules, extended rather than
duplicated — plus the custom properties in whichever CSS file the dual emission lands in.

**New:** `behaviour/patterns/*.json` (~17 + `none`), one `X.behaviour.json` per
component per layer, `frameworks/react/test/` (first React render suite),
`frameworks/angular/test/behaviour.test.ts`.

**React:** `Tooltip.jsx`, `Toast.jsx`/`Toast.d.ts`, `CommandPalette.jsx`,
`ui_kits/console/index.entry.jsx`, `useContainerWidth`'s home, and every component's
`.prompt.md` where the contract is now stated.

**Angular:** the corresponding primitives, and `container-size.ts`.

**Docs:** `CLAUDE.md` (the layer contract gains a behaviour layer; the quartet gains a
fifth file; the gate count moves from eighteen to twenty, and CLAUDE.md's *Known debt*
section gains this plan's residue rather than the plan document keeping it), `README.md` — specifically
the copy-in dependency list at `README.md:52`, which gains the components that now import
the generated module —
`components-divergences.md` (split along the seam), `CHANGELOG.md` under
`## [Unreleased]`.

**Unchanged:** every colour token, `tokens/colors.css`, `styles.css`, `effects.json`'s
`dur`/`ease`/`loop`, and the structural half of `components-divergences.md`.
