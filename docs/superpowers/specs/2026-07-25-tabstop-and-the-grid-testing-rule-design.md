# `tabStop`, and the rule that a grid is DOM-tested by hand — design

**Date:** 2026-07-25 · **Status:** Approved in design, 2026-07-25.
**Context:** falls out of plan 8C3, Task 11b. It is written as its own spec because it
changes two things bigger than that task: what the API contract admits as a member, and
how the React layer is tested.

---

## The problem, stated once

`Calendar` gained a roving grid in plan 8C3's Task 10 and retired all eight of its `grid`
exceptions. Task 11b then made `CalendarEvent` a component so each event could carry an
administrative panel, and that panel is opened by a kebab button.

**The kebab cannot be an `IconButton`.** `IconButton`'s contract declares no `tabIndex`,
because Plan C's D1 flatten removed `extends React.ButtonHTMLAttributes<…>` and, with it,
the `{...rest}` spread and every global attribute. A composed `IconButton` inside the grid
is therefore a **page-level tab stop Arena cannot silence**, and `focus.roving` — "one tab
stop into the grid; a single cell is in the page Tab sequence at a time" — is false the
moment one is drawn.

The workaround is obvious and bad: draw a second button inline, the way `Calendar` already
draws its own Previous/Next controls with `navBtn`. It works, and it leaves the library
with two ways to draw an icon button, one of which is not a component. **The maintainer's
requirement is both: `Calendar` navigable by keyboard AND `IconButton` reused.**

### Why the rule that excludes global attributes does not settle this

`api/README.md` excludes `className`, `dir`, `tabIndex`, ARIA and `data-*` from membership
on the grounds that "in Angular a consumer writes those on the host directly". That
justification does not reach this case, for two independent reasons.

**`IconButton` is React-only.** Angular delegates it to `matIconButton`; there is no
`arena-icon-button` primitive. The rule's Angular escape hatch has no implementation to
apply to.

**And the escape hatch would not work anyway.** Writing `tabindex="-1"` on an
`<arena-icon-button>` host sets it on the custom element, not on the `<button>` inside it.
The inner button stays in the tab sequence. For any component whose focusable element is a
descendant of its host, "the host can write it elsewhere" is simply untrue.

### The precedent that does settle it

`api/README.md` already admits exactly one global attribute as a member, with a stated
test:

> **`id` is the one global attribute that is a member, and only where the component
> generates one.** […] a component that *derives* an id […] has taken that attribute out
> of the consumer's hands […] That is a capability the flatten removed rather than a
> global attribute the host can write elsewhere, **which is what separates it from the
> rest.**

`tabStop` passes that test on both halves: the flatten removed the capability, and there
is no other surface on which a host can write it.

---

## Decision 1 — the member is a boolean, not `tabIndex`

`Button` and `IconButton` each gain:

```json
"tabStop": { "form": "primitive", "type": "boolean", "default": true,
             "description": "Whether the control is reached from the page's Tab sequence.
             Set false when it lives inside a composite that manages its own focus — a grid
             with a roving tab stop, a menu — where reaching it by Tab would be a second way
             in. Arena writes tabindex=\"-1\"; a positive tab order is not expressible and
             never should be." }
```

A raw `tabIndex?: number` was considered and rejected on two counts. It would legalise a
**positive** tab order, which is a recognised anti-pattern that breaks document order, and
`-1` is the only value this problem needs. And a member named after the attribute hands the
next request for `className` a comfortable precedent, where a member named after the
decision does not. Naming the decision rather than the mechanism is the house style
already: `dismissible` rather than detecting a listener, an icon as a class-name string
rather than a slot, `progressPercentage` rather than `value`.

**Semantics.** `true` writes nothing — a native `<button>` is already reachable, and
emitting `tabindex="0"` would add an attribute that means nothing and that every DOM
assertion would then have to step around. `false` writes `tabindex="-1"`. The control stays
**programmatically focusable**, which is what Task 10's Enter/Escape route into and out of
an event depends on.

**Neither `*.behaviour.json` moves.** A button outside the tab sequence is still a button:
it still answers Space and Enter, and it still carries its accessible name. `check:api`
gains **no contract** — these are members added to existing contracts, the shape Task 2's
`id` already established.

## Decision 2 — both components, and `Button`'s consumer is scheduled

`Button` gets the member too. Symmetry is the maintainer's reason: Plan C contracted the
two as a pair under one icon convention, and an asymmetry between them is something a
reader trips on.

It is also not speculative, which matters given this repository's explicit refusal of
machinery with no consumer (the `debounce` precedent). **Plan 8C3's Task 12 is `Table` —
keyboard navigation**, and `Table`'s actions column draws `Button`s; it is what the removed
`TableColumn.render` drew at its call site. The moment `Table` is a grid with a roving stop,
a `Button` inside a row is exactly this case. `Button`'s member description names `Table` so
that nobody reads it as speculative.

## Decision 3 — the panel lives behind the kebab

`CalendarEvent` gains two members:

- `actionsEnabled?: boolean`, default `false` — whether the chip shows the kebab. A boolean
  rather than "is the slot filled?", for the reason already written into `Alert.dismissible`
  and `Toast.dismissible`: **Angular cannot detect whether an `<ng-content>` was filled**, so
  gating the drawing on that is a guaranteed latent divergence.
- `actions?: slot` — the panel's content.

Arena draws the kebab as `<IconButton icon="ph-bold ph-dots-three-vertical" label="Actions"
size="sm" tabStop={false} />`. **`tabStop={false}` is written by Arena, not by the
consumer**, so the guarantee is structural rather than a thing someone has to remember.

The slot renders **only while the panel is open**. Closed — the steady state — the chip
holds one programmatically focusable control and no tab stop at all, so the grid remains one
tab stop, which is what `focus.roving` requires. Open, the consumer's buttons are reachable
by Tab, which is correct: an open menu is expected to be.

This also answers a constraint the always-visible alternative could not. An event chip has a
floor of `max(calc(var(--sp-1) * 4.5), …)` — 18px — and `overflow: hidden`. One button fits
there; a row of them does not. And with an always-visible panel, Arena would have had to
inject `tabStop: false` into consumer markup with `cloneElement` (the `RadioGroup` shape) to
keep `focus.roving` true, which works only for Arena components and warns on a bare `<div>`.

---

## Decision 4 — `frameworks/react/test-dom/` comes back, minus the grid

The directory was deleted in commit `edb9f3e` because running it cost more RAM than the
development loop would pay. **That decision was made in haste and is reversed here,
with one condition: a component that lays its elements out as a grid is DOM-tested by
hand.**

### The measurement that makes this the right cut

Measured with `getrusage(RUSAGE_CHILDREN)`, three runs per state, before the deletion:

| | peak RSS |
|---|---|
| `grid-keyboard.test.jsx` **alone** | 164 MiB (194 MiB before its two performance fixes) |
| the other **six** suites together | 109 MiB |
| the whole directory | 171 MiB |

**The grid suite alone cost more than the other six combined.** The directory was never the
problem; the grid was. Its fixture is 6 days × 14 hour cells = 84 cells per mount, mounted
eight times, with 160 key events dispatched through `act()`. Cutting there cuts exactly where
the cost is.

### The rule, tied to the behaviour contract

**A component whose behaviour binding names the `grid` pattern is DOM-tested by hand**, with
`bun run demos` and the component's own `*.card.html` page.

The rule is deliberately tied to the binding rather than to a judgement about what looks like
a grid: it is checkable with a grep instead of an argument, and **Task 12 inherits it without
anyone having to remember**. Today it selects exactly `Calendar` and `Table`.

### What returns and what does not

Returns: `harness.jsx`, `preload.js`, `assert-pattern.jsx`, and six suites —
`behavioural`, `dialog-modal`, `form-control-events`, `placement-and-branches`, `smoke`,
`tooltip-timer`. All are recoverable verbatim with `git show edb9f3e^:<path>`; none
needs rewriting.

Does not return: `grid-keyboard.test.jsx`.

Reverted with it, all mechanical: `package.json` regains `test:react-dom` and the `--preload`
half of `test`; `testStep()` in `check-all.mjs` returns to two `bun test` invocations, with
`check-all.test.mjs`'s literal-value assertion following it; `SUITE_DIRS` regains the
directory; and `COVERED` regains **four** React entries — `Dialog`, `ConfirmDialog`, `Menu`,
`Skeleton` — but **not `Calendar:react`**. `check:compliance` moves 2 of 64 → **6 of 64**.

**The `--preload` constraint is not negotiable and must survive the restore.** react-dom
decides once, at its own module evaluation, whether the browser supports the `input` event;
if a DOM is not already installed the flag latches false and a dispatched `input` reaches an
`onChange` handler zero times, silently. Registering happy-dom from a module body is too late,
and so is a separate ES module imported ahead of `react-dom` — both were measured by
instrumenting `canUseDOM` directly. Only `bun test --preload` is early enough, and
`harness.jsx` must keep throwing when the DOM is absent rather than installing a fallback.

### The documentation is half the work, and it cannot be a revert

`CLAUDE.md` carries 18 hunks about the deletion — the whole *Known debt* entry, the
two-test-directories architecture section, and the `--preload` note — and `CHANGELOG.md`
carries an entry under *Removed*. **Neither can simply be reverted**, because the end state is
not the state before the deletion: `Calendar` loses its render suite permanently, by decision
rather than by accident. Both must be rewritten to state the new rule and its price.

---

## Verification

### What the SSR suite proves

`frameworks/react/test/` renders with `renderToStaticMarkup`, which shows attributes:

- `tabStop` omitted → **no** `tabindex` attribute; `tabStop={false}` → `tabindex="-1"`. One
  test each in `button.test.jsx` and `icon-button.test.jsx`.
- `tabStop` does not leak to the DOM as an unknown attribute — the standard trap when adding
  a boolean prop.
- A chip carrying a kebab is **not a `<button>` inside a `<button>`**. That is invalid HTML
  which the browser silently restructures, and a static assertion catches it.
- With the panel closed, the slot's content is **absent from the markup**.

### The assertion recovered from the deleted suite

`grid-keyboard.test.jsx` opened with `assert.equal(root.querySelectorAll('[tabindex="0"]')
.length, 1)` — "a grid is ONE tab stop". **That assertion needs no DOM**: the cursor
initialises to `{day: 0, hour: 0}`, so a static render carries exactly one cell with
`tabindex="0"`. It is a property of the markup, not of behaviour.

It moves into `calendar.test.jsx`, and it matters more than it looks. `Calendar.behaviour
.json` claims `"exceptions": []` with nothing behind it, and **a kebab that leaked into the
tab sequence would falsify that claim**. Counting tab stops statically puts an automatic guard
exactly where this work can break something.

### What stays unverified, said plainly

That focus moves, that Enter enters and Escape leaves, that the roving stop **roves**, and
that the panel opens and closes. All of it belonged to the deleted suite and is now checked by
hand on `calendar.card.html`, by the rule this spec adopts. `check:compliance` cannot return
`Calendar:react` to `COVERED` without a render suite, and this work does not bring one.

Stated once, without softening: **we verify the structure that makes keyboard navigation
possible, not the navigation.** That is a real improvement on the current state, which is
nothing, and it is still below what existed before the deletion.

### The gate that does not cover this

`check:api` reads the `.d.ts` and never opens the `.jsx`. The SSR tests above are therefore the
**only** guard that `tabIndex` is really written: delete the line from the implementation, leave
the declaration intact, and the gate stays green. This is the same shape Constraint 16 already
imposes on the R4 proofs, and the plan must carry it forward.

---

## Out of scope

- **Reformulating the global-attribute rule.** This spec adds a second named exception with the
  same test `id` passes, and does not rewrite the rule that produced the exception. That the
  rule's stated justification ("the host writes it directly") is false for any component whose
  focusable element is inside its host is recorded here and left open.
- **`Menu` under contract.** The kebab's panel is a slot rather than a composed `Menu`, so this
  spec does not need `Menu` contracted, and does not contract it.
- **Angular.** `Button` and `IconButton` are both React-only contracts; there is no Angular work
  here. Plan D inherits `tabStop` along with the rest.
