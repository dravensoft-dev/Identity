# Every binding at `exceptions: []` — the index

**Status:** index, 2026-07-26. **This document carries no plan and never will.** It is a map of the
work between here and the goal, one section per *cause*, and each section becomes its own spec and
its own batch when it is picked up. Update it when a batch lands; a section that no longer describes
the tree is a defect in the index, exactly as a stale entry is in `CLAUDE.md`'s *Known debt*.

## The goal, and what it is not

Every component binding declares `exceptions: []`, and the declaration is **verified by a render
suite** rather than merely written. The second half is not decoration. Retiring an exception with
nothing rendering it swaps an honest admission for an unverified claim, which is the defect batch
8C6 shipped and batches 8C7 and 8C8 were spent closing. A repository at `exceptions: []` with
`check:compliance` still reporting a tenth of its bindings covered would be **less** honest than
today's tree, not more.

## The numbers, and how to re-derive them

Never trust the figures below; the commands are the authority.

```bash
# exception DECLARATIONS in component bindings
grep -rho '"requirement"' --include='*.behaviour.json' frameworks/ | wc -l
# distinct binding+requirement pairs -- the count to use when the question is about DEFECTS
grep -rHo '"requirement": "[^"]*"' --include='*.behaviour.json' frameworks/ | sort -u | wc -l
# exceptions in the Angular delegated file
grep -o '"requirement"' frameworks/angular/BehaviourDelegated.json | wc -l
# coverage
bun run check:compliance
```

**The first two commands are not the same question, and after 8C9 they no longer return the same
number.** A requirement unmet in two cases is correctly declared twice — `CalendarEvent` declares
`states.disabled` once per interactive case, because both shapes genuinely lack the concept — so the
first command counts declarations and the second counts distinct defects. `CLAUDE.md` states the
same rule; use the second whenever a section below reasons about how much work is left, and never
report a drop in the first as "N defects removed".

As written: **14** declarations / **14** distinct pairs in component bindings, **12** in the
delegated file, **31 of 70** bindings covered. The two figures are equal again, which is itself
informative: the one binding that declared a requirement twice was `CalendarEvent`, and both of its
`states.disabled` declarations were retired together. Seven component bindings are cased (count them with
`grep -rl '"cases"' --include='*.behaviour.json' frameworks/`, which does not reach the delegated
file, where one entry is cased too).

**The `progressbar` batch is where the declarations-vs-pairs distinction earns its keep.** It
removed four declarations and added three, and one of the three is the *same* defect as another —
the delegated `ProgressBar` meets `live.politeness` in neither of its modes, so one defect is
correctly declared once per case. Read a drop in the first figure as a drop in declarations and
nothing more.

**The sections below are causes, not a partition — do not add them up.** Three exceptions appear
twice on purpose, because closing them needed work from two sections: `ActivityFeed`'s `roles.label`
was one of its seven in §2 *and* an instance of §3's naming problem; `TableRow`'s `states.disabled`
is one of its five in §2 *and* an instance of §4. `Pagination`'s `roles.label` was the third, in §3
*and* as §5's clearest consumer-conditionality; §3 closed it, and it left both sections at once —
which is the argument for listing a cause twice rather than picking one home for it.

## §1 — Patterns the catalogue is missing — **CLOSED**

**The component is right and the catalogue is wrong.** These exceptions recorded no defect at all:
the binding measured a component against a pattern nobody thought it should implement, because the
catalogue offered no better fit. Both rows are closed, and what closing them looked like is the
part worth keeping — it is the cheapest kind of exception to retire and the easiest to mistake for
a defect.

`progressbar` is sourced from ARIA 1.2's role reference because APG publishes no pattern page for
it — the third such pattern, after `status` and `textbox`. It carries three CONDITIONAL value
requirements, in `BEHAVIOURAL` because ARIA expresses indeterminacy by *omitting* `aria-valuenow`
and no snapshot of one element can tell a legitimately indeterminate bar from a broken determinate
one. `ProgressBar` binds it as two cases and `Spinner` flat, in React and in the delegated
declarations alike; `Spinner` unified onto the same role and both components gained an explicit
`aria-live="polite"`, because `progressbar` carries no implicit live region where `status` does.
Three of the four exceptions were catalogue artefacts and vanished; the fourth was retired by
fixing the component, and both React bindings are now backed by a render suite.

`alertdialog` is the opposite kind of source: APG **does** publish a page here ("Alert and Message
Dialogs"), so it cites a real APG patterns URL and — unlike `progressbar` — the literal non-APG
list in `scripts/behaviour-contracts.test.mjs` was **not** touched. Its requirement set is
`dialog-modal`'s seven verbatim with `roles.element` as `alertdialog`. `ConfirmDialog` renders that
role unconditionally in both layers (`destructive` and `requireText` reach colour and a disabled
button and nothing else), so it binds **flat**, which answers the question this section used to
pose about whether the pattern needed cases. React needed no new suite — `DialogModal.dom.test.jsx`
already selected `[role="dialog"], [role="alertdialog"]` — and Angular gained its first TestBed
compliance suite for the component, made possible by 8C11's move to an AOT harness.

**The transferable lesson.** Both rows were retired without touching what either component does for
a user, which is exactly why this section was first in the order: it is pure bookkeeping, and it
makes every later section's numbers honest. It also shows where the cross-file sweep fails — three
of the four claims this batch falsified were written in terms of the *pattern*, not the component,
so a grep for `ConfirmDialog` finds none of them.

## §2 — Real accessibility defects

**The bulk of the work, and the only section where a screen-reader user is actually better off at
the end.** These components do not do what their pattern requires, and closing them means writing
roles, keyboard handlers and focus management.

| subject | pattern | what is missing |
|---|---|---|
| `TableRow:react` | `button` | 5, and the pattern may be the wrong one — a `<tr>` cannot become a `<button>` |
| `BulkActionBar:react`, `bulk-action-bar:angular` | `toolbar` | 4 each: renders `role="region"`, no roving tab stop, no arrow keys |
| `CommandPalette:react`, `command-palette:angular` | `combobox` | 5 between them: no `aria-expanded`, no `aria-controls`, the active row is state-only with no `aria-activedescendant` |

`TableRow` deserves a design decision before an implementation: its own reason says *"a row is a
`<tr role="row">`, and it never becomes a `<button>`"*, which reads as a binding that chose the
wrong pattern rather than a component that fell short. Decide that first; the other five are
implementation.

**`Menu` and `ErrorState` are closed too, and both fixes were inversions of tests that PINNED the
defect.** `ErrorState` cost one attribute; the assertion `doesNotMatch(/role="/)` became
`/^<div role="alert"/`. `Menu` cost more, and the shape is worth carrying: its `aria-haspopup` and
`aria-expanded` sat on a wrapping `<span>`, and because `trigger` is an opaque **slot** the fix is
to clone it — which brings the compound-family hazard along, since a fragment passes
`isValidElement`, `cloneElement` succeeds, and the attributes reach nothing. `Menu` throws on that
now. Opening moves focus to the first item and Escape restores it to the trigger; Enter and Space
are the platform's, so the suite asserts Menu does not INTERCEPT them rather than dispatching a key
happy-dom will never turn into a click.

**`ActivityFeed` is closed, and it was the largest single row here — fourteen declarations, seven
per layer, on a component that met not one of the seven.** It now carries `role="feed"` and
`role="article"`, `aria-posinset`/`aria-setsize`, a required `label`, a `busy` input reflected as
`aria-busy`, and PageUp/PageDown between articles. Two things from it are worth carrying:

`busy` had to become an **input** rather than something Arena infers, because only the host knows
when its own loading finished — and that is what gave the binding its two cases, since `aria-busy`
is true during an update and false once it settles and no single render decides both.

And PageUp/PageDown **stop at the ends rather than wrapping**, asserted specifically in both
layers. Wrapping is right for a roving composite and wrong for a feed. That is the kind of decision
a pattern file states in six words and a suite has to make concrete.

**What binding cases give this section.** `ActivityFeed` proved the point and `BulkActionBar` is
the same shape if it is ever hidden when the selection is empty. The all-cases-or-fail rule means
whoever implements the rest inherits a suite that cannot quietly verify one configuration and claim
the component.

## §3 — A name only a human can supply — **CLOSED**

**Every one of these is an API change before it is a behaviour change**, which is why they are their
own section rather than part of §2.

**CLOSED.** `ActivityFeed`'s `roles.label` was the last row and it was closed in §2, alongside the
six other things that component needed at once — which is why it waited there rather than here.

**All five are closed, on the precedent this section named.** `Table.label` is the shape and
it was followed to the letter — `required: true` with no default, a non-optional `.d.ts`,
`input.required` on the Angular side, and a guard that throws as the first statement of the body.
`Breadcrumbs` (both layers), `Pagination`, `RadioGroup` and `Radio` all take a caller-supplied name
now, and none of them hardcodes anything.

**Two things are worth carrying forward.**

`Pagination` is the proof that a member is not the same as a fix. It had `ariaLabel` already,
optional with a `"Pagination"` default, and its own contract description argued for keeping it that
way — which **narrowed** the gap and left the exception standing, since a caller who omits the
member still gets the constant. Only making it required closed it. Prefer removing a condition to
expressing it, and prefer it early: the optional member was one batch of work that had to be redone.

And a suite for this requirement must render **two** instances. `navigation` asks for a *unique*
label per landmark on a page, so a suite rendering one component would have gone green against the
old hardcoded `"Breadcrumb"` as readily as against the fix. All three suites assert that two
instances carry different names, which is the only assertion here that could ever have failed.

**What binding cases gave this section.** Nothing mechanically, and that was the right answer:
`Pagination`'s exception was conditional on the **consumer** rather than on the component's own
props, so no case could have expressed it. Making the member required removed the conditionality
instead, which is why this section was separate from §5 and why its row there is gone too.

## §4 — States the components have no concept of — **CLOSED**

`TableRow`'s `states.disabled` was the last row, and it was settled where it belonged: entangled
with that binding's other four exceptions and with the pattern it should never have been measured
against, so it moved with the rest of `TableRow` rather than being fixed here in isolation.

**`Tag` and `CalendarEvent` needed the state and now have it**, in both layers for `Tag`. Both
reflect through `aria-disabled` rather than the native `disabled` attribute, because the native one
removes the control from the tab order and a screen-reader user then never learns the action exists.
`CalendarEvent` needed it in two places for one member — with a kebab the root cannot be a button
and the interactivity moves to a descendant — which is why its two interactive cases each declared
the gap and each is now asserted separately.

**`Input` and `Textarea` were a different story, and it is the one worth carrying forward.** Their
`states.readonly` exceptions had been **stale for some time**. Each asserted seven things about the
tree and every one was false: `readOnly` was destructured with a default, reached the native
element, was a contract member, was in the `.d.ts`, was in the `.prompt.md`, and was already
asserted by both components' own suites — and the clause about `...rest` smuggling it through was
false twice over, since the spread had been removed. Only "nor reflected in any visual state"
survived, and that was one commit's work.

**Nothing could have caught it**, and that is the transferable finding. `states.readonly` is
BEHAVIOURAL: `evaluate()` returns `null` and there is no verdict to compare against until a suite
supplies one. An exception on a BEHAVIOURAL requirement with no suite behind it is not merely
unverified — it is **unfalsifiable**, and it stays green however far the component drifts from what
it says. `DOUBTS.md` keeps the live list of which those are; read it before trusting any remaining
exception's prose in the sections below.

Writing that suite also found two false negatives in the evaluator itself, both now fixed:
`roles.label` had no route for a `<label for>`, so every correctly labelled native form control read
as unnamed, and `states.multiline` refused a plain `<input>` while `states.checked` two lines above
already credited a native one. Neither was reachable until a form control was rendered against a
pattern for the first time.

**What binding cases give this section.** Less than expected, in the end. A flat binding was right
for both textboxes: the verdict a suite passes is about whether the COMPONENT reflects the state, so
the suite renders both polarities inside one case rather than declaring one case per polarity. That
is the convention `Tag`'s `removable` case already used, and it stops the combinatorial explosion a
case-per-state would have caused for a control with three conditional states.

## §5 — Conditional on consumer usage

**The third level of conditionality, named by 8C9 and deliberately left unsolved by it.** Cases
describe renders a component's own API can produce. These depend on how a *consumer* assembles or
calls the component.

| subject | condition |
|---|---|
| `Toast:react` `content.noAutoDismiss` | the host owns the timer; `persist` is documented as mandatory for critical states and enforced nowhere |
| `Tooltip:react` `roles.describedby` | holds only when the consumer's child accepts and forwards props; **a fragment defeats it silently, and the binding reads `exceptions: []`** |

`Table`'s `focus.roving` was a row here too and is **gone rather than solved**, in the other
available way: it was never consumer-conditional at all. The reason read "true in card mode only,
and only when a consumer put an `onClick` on a `TableRow`" — but the clickable card row is
`TableRow`'s own `card-interactive` case, not a clause of `Table`'s binding. Once that was seen,
`Table` split cleanly into `wide` → `grid` and `card` → `none` with no condition left over. **Check
that an entry here is really consumer-conditional before modelling it**; two of the four were
misfiled, one as an API gap and one as a neighbouring component's case.

`Pagination`'s `roles.label` was the fourth row and it is **gone rather than solved**: §3 made the
member required and guarded, which removed the conditionality instead of expressing it. Prefer that
wherever it is available — a condition that can be designed away should not be modelled — and note
that it was available here only because the condition was "did the caller pass a value", which an
API change can reach. The three left are conditional on how a consumer *assembles* components,
which no member can settle.

`Tooltip` is the one to be most careful with: it is the only entry here whose binding looks *clean*
today, so this section is the only record that it is not.

**What binding cases give this section.** The shape to extend, and a warning about the cost. A
consumer-usage case would need the suite to construct the usage rather than configure the component,
which the `when` prose can already describe — the mechanism may need nothing new beyond a decision
that such cases are legitimate.

## §6 — Angular Material, which is Plan D

The **12** exceptions in `BehaviourDelegated.json` cannot be closed by editing anything in this
repository — they are claims about `MatProgressBar`, `MatTable`, `MatButtonToggleGroup` and their
siblings. Emptying them means replacing Material with Arena primitives on the CDK, which is Plan D
in `2026-07-23-8-api-contracts-design.md`.

**It read 17, and the correction is worth more than the number.** Five left when React's `TableRow`
stopped binding `button`. Nothing about Angular Material changed: the delegated entry mirrored
React's binding, so it was measured against `button` too, and its five exceptions restated what the
`Table` entry's eight already say about Material's rows and cells. Bound to `none`, the duplication
goes. So the rule to carry is narrower than "only Plan D moves this file": **a delegated entry moves
whenever the PATTERN it is measured against changes**, and a batch touching only the React side can
do that without noticing. Do not read a drop here as progress against Material.

Two facts to carry into that work: the delegated file records **no Material version** for any of its
claims (they were verified against `@angular/material` 22.0.5), and `check:behaviour` never re-checks
a claim about a third-party library — so those reasons can quietly become false while every gate
stays green.

**What binding cases give this section.** A shape for Plan D's new primitives to be *born* with
rather than retrofitted: any primitive with variants should declare cases from its first commit. And
the delegated file itself could take cases, which is the cheapest way to stop a single flat
exception list describing several Material configurations at once.

## §7 — The two components that can never have a suite — **CLOSED**

They can. `Calendar` and `Table` both have render suites and both are in `COVERED`; the rule that
kept them out is retired.

**It was retired the way it was made — by measuring.** The rule cited `grid-keyboard.test.jsx` at
164 MiB against 109 for six other suites, and the first finding is that **that figure is not
comparable to anything measured today**: another machine, other versions of bun, React and
happy-dom, and a harness baseline nobody recorded. Only a before/after pair from one sitting counts.
Taken that way: 89 MiB for the harness alone, 128 for the grid suite, ~143 for the whole DOM
invocation without it and ~158 with. The rule's own justification — that the grid cost more than
every other suite combined — is false now: 39 MiB above baseline against roughly 54 for the other
nineteen together.

**The second finding contradicts the premise the new suites were written on.** Walking the grid
cell by cell instead of remounting eight times did *not* make it cheap. The bill is the **number of
key presses**, because each one re-renders the whole grid through `act()`: mounting the 84-cell
fixture is +15 MiB, walking it is +60. What makes it affordable is a **small fixture** — the
Calendar suite renders 6×5 by setting `dayStart`/`dayEnd` explicitly rather than taking the default
6×14, and every invariant it asserts holds at any size from 2×2 up. That is the transferable rule
for the next grid, and it is the opposite of what "test it thoroughly" would suggest.

The method, for whoever writes the next one: one mount per scenario; a walk visiting every cell with
one press per step, asserting both the landing cell and that exactly one `tabindex="0"` exists and
is that cell; edge clamps as one extra press per edge rather than a forty-press loop. `DOUBTS.md`
carries it in full.

**What binding cases gave this section** turned out to be more than a hand-check list: `Table`'s two
cases are what let the card shape say `none` — the grid's requirements do not go *unmet* below the
breakpoint, they do not *apply*, because there is no grid element at all.

## §8 — Coverage, which gates the whole goal

`check:compliance` reports **17 of 70** today. Every section above produces
`exceptions: []` on bindings that are mostly **outside `COVERED`**, and an unverified `exceptions: []`
is a stronger claim with less behind it than the exception it replaced.

Note also that a substantial share of the 70 bindings name the `none` pattern, which has **zero**
requirements — count them with `grep -rl '"pattern": "none"' --include='*.behaviour.json'
frameworks/ | wc -l`, which returns 23 as written and moves whenever a batch declares or retires a
`none` case — it read 24 until 8C10 fixed `Skeleton`'s `circle` variant and its binding went flat.
Covering those would move the headline number without verifying anything, and the temptation grows
as the number becomes a goal. Do not take it: a case bound to `none` confirms the render exists, not
that it is correctly inert — the live instance is `Tag`'s `plain` case, which is bound to `none` and
IS rendered by a covered suite (`Tag:react`, `Tag:angular`), so the suite proves the plain tag was
drawn and nothing proves it is inert. 8C9 recorded the limit against `Skeleton`'s `circle`; that
example went stale in 8C10 when the circle stopped being a case at all, and the limit did not.

**What binding cases give this section.** A stricter definition of "covered", inherited free: after
8C9 a component is covered only when *every declared case* is rendered, so coverage widened later is
worth more per binding than coverage widened before. This is the argument for doing 8C9 first and it
survives into every section above.

## Suggested order, and why

1. ~~**§1**~~ — **done.** Cheapest, and it retired exceptions that were never defects.
2. ~~**§4**~~ — **done.** It was not free: two of its six declarations were stale rather than
   real, and writing the suite that proved it also fixed two false negatives in the shared
   evaluator.
3. ~~**§3**~~ — **done.**
4. **§2** — the real work, and the only section that changes what a user experiences.
5. **§8** — widen coverage once the bindings worth covering are honest.
6. **§6** — Plan D, which is a programme rather than a batch.
7. ~~**§7**~~ — **done.** The cost was measured and it was worth paying. **§5** has two rows left,
   both decisions rather than implementations.

§2 is deliberately not first despite being the only section that helps a real user, because
`ActivityFeed`'s `states.busy` cannot be retired before §4's machinery and its `roles.label` cannot
be retired before §3's decision. Doing it first means doing part of it twice.
