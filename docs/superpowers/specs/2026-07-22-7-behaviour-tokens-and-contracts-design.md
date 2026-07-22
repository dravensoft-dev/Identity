# Behaviour tokens and behaviour contracts — Design

**Status:** DRAFT — not approved. Written 2026-07-22 at the request of the repo owner.
Open questions at the end are real and must be answered before a plan is written from
this.
**Execution order:** plan 7 of 8 — after 6 (four-package build + publish), before 8
(API capability contracts).
**Depends on:** `2026-07-19-5.5-chart-geometry-token-target-design.md` — hard
dependency, for the reason in *Sequencing*. That spec is itself a DRAFT.
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
tokens/behaviour.ts + .js                        Generated. The script-readable half.

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

`2026-07-19-5.5-chart-geometry-token-target-design.md` already designed the mechanism
this needs, for chart geometry, and this spec adopts it wholesale rather than inventing
a second one:

- the token is flagged **in the DTCG source**, not in a list inside the build script —
  `$extensions: { "com.dravensoft.arena": { "script": true } }`;
- `scripts/build-tokens.mjs` gains a second platform, filtered to flagged tokens;
- emission is **dual** — the CSS custom property *and* the module entry — so a
  script-readable token still appears in the Overview;
- a parity gate asserts the two carry the same value, and an orphan gate fails a flag
  nobody imports.

**Behaviour values strengthen that spec rather than merely leaning on it.** 5.5 accepts
a real cost in its §1: a value emitted to JS is bound at import time and therefore
**cannot re-densify or re-theme**. For chart geometry that is a genuine limitation the
spec has to argue past. For a debounce it is not a limitation at all — a dismissal
timeout has no light-mode variant and no compact variant, and never will. Behaviour
values are the cleaner fit for the mechanism, and a second independent consumer is the
strongest evidence that the build surface is worth existing.

**5.5's open question 7 — `.js` or `.ts` — is answered here: TypeScript**, with a
compiled `.js` sibling. The Angular layer is TypeScript-first and gets a typed import.
The React layer does not compile TypeScript and its demos load plain `.js` through an
importmap, so it consumes the sibling. That sibling is not a new pattern: `build:demos`
already establishes committed generated `.js` next to every `.jsx`, guarded by
`check:demos`.

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

`bun run check` goes from sixteen gates to eighteen, and the set of non-portable gates
stays exactly `check:cards`, `check:vendor`, `check:demos`.

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
5.5 chart geometry / script target    <- DRAFT, unapproved. HARD DEPENDENCY.
6   four-package build + publish
7   THIS SPEC
8   API capability contracts
```

**Why after 5.5, and why that is a hard dependency rather than a preference.** This spec
needs a build target that emits JS from DTCG. 5.5 designs exactly that, including the
`$extensions` flag, the dual emission and the parity gate. Building a second one here
would be two mechanisms for one job — the drift this repo exists to prevent. If 5.5 is
rejected, this spec must be re-argued from scratch, and §3 is where it would have to be
re-fought.

**Why after 6.** 5.5's own argument applies unchanged: a JS export condition is cheap to
add before the first publish and awkward forever after. If 6 ships before 5.5 and 7,
that argument was lost and both specs inherit the awkwardness — which is an argument for
resequencing 5.5 before 6, not against this spec.

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

1. **What does the copy-in kit's instruction become?** 5.5 §5 names this as the
   strongest objection to a JS token module, and it lands harder here: chart geometry
   affects three charts, but `Toast`, `Tooltip` and `CommandPalette` are core. A
   consumer who copies `Tooltip.jsx` without `tokens/behaviour.js` gets a component that
   does not render. **Without a good answer, steps 1–2 should not proceed.** One
   candidate worth evaluating: components accept the value as a prop whose default is
   the token, so a copied component degrades to an explicit argument rather than to a
   crash — at the cost of a prop that exists for packaging reasons.
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

**Build:** `scripts/build-tokens.mjs` (second platform, from 5.5), a new
`scripts/check-behaviour.mjs` and its test, `scripts/check-behaviour-generated.mjs`,
`scripts/check-all.mjs`, `package.json`.

**Token source:** `tokens/src/behaviour.json` (new), `tokens/src/TYPE-MAP.md`.
Generated: `tokens/behaviour.ts` + `.js`, and the custom properties in whichever CSS
file the dual emission lands in.

**New:** `behaviour/patterns/*.json` (~17 + `none`), one `X.behaviour.json` per
component per layer, `frameworks/react/test/` (first React render suite),
`frameworks/angular/test/behaviour.test.ts`.

**React:** `Tooltip.jsx`, `Toast.jsx`/`Toast.d.ts`, `CommandPalette.jsx`,
`ui_kits/console/index.entry.jsx`, `useContainerWidth`'s home, and every component's
`.prompt.md` where the contract is now stated.

**Angular:** the corresponding primitives, and `container-size.ts`.

**Docs:** `CLAUDE.md` (the layer contract gains a behaviour layer; the quartet gains a
fifth file; the gate count moves from sixteen to eighteen), `README.md`,
`components-divergences.md` (split along the seam), `CHANGELOG.md` under
`## [Unreleased]`.

**Unchanged:** every colour token, `tokens/colors.css`, `styles.css`, `effects.json`'s
`dur`/`ease`/`loop`, and the structural half of `components-divergences.md`.
