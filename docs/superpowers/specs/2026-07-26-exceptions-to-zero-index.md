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

As written: **41** declarations / **41** distinct pairs in component bindings, **17** in the
delegated file, **25 of 70** bindings covered. The two figures are equal again, which is itself
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
twice on purpose, because closing them needs work from two sections: `ActivityFeed`'s `roles.label`
is one of its seven in §2 *and* an instance of §3's naming problem; `TableRow`'s `states.disabled`
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
| `ActivityFeed:react`, `activity-feed:angular` | `feed` | 7 each: no `role="feed"`, no `role="article"`, no name, no `aria-posinset`/`setsize`, no `aria-busy`, and **no keydown handler at all** — PageUp and PageDown do nothing |
| `Menu:react` | `menu-button` | 6: `aria-haspopup` on the wrong element, no `aria-expanded`, focus never enters the menu on open, Enter/Space/Escape incomplete |
| `TableRow:react` | `button` | 5, and the pattern may be the wrong one — a `<tr>` cannot become a `<button>` |
| `BulkActionBar:react`, `bulk-action-bar:angular` | `toolbar` | 4 each: renders `role="region"`, no roving tab stop, no arrow keys |
| `CommandPalette:react`, `command-palette:angular` | `combobox` | 5 between them: no `aria-expanded`, no `aria-controls`, the active row is state-only with no `aria-activedescendant` |
| `ErrorState:react` | `alert` | 1: a plain `<div>`, nothing announces the error |

`TableRow` deserves a design decision before an implementation: its own reason says *"a row is a
`<tr role="row">`, and it never becomes a `<button>`"*, which reads as a binding that chose the
wrong pattern rather than a component that fell short. Decide that first; the other five are
implementation.

**What binding cases give this section.** Directly useful for two of them. `states.busy` is
conditional by nature — `aria-busy` is set *when an update is pending* — so `ActivityFeed` needs a
`busy` case to have anything to assert; today that exception cannot be retired even by a correct
implementation, because no single render decides it. `BulkActionBar` is the same shape if it is ever
hidden when the selection is empty. And the all-cases-or-fail rule means whoever implements these
inherits a suite that cannot quietly verify one configuration and claim the component.

## §3 — A name only a human can supply — **one row left**

**Every one of these is an API change before it is a behaviour change**, which is why they are their
own section rather than part of §2.

| subject | today |
|---|---|
| `ActivityFeed` (both layers) | the `roles.label` third of its seven |

That row waits on §2 rather than on this section: `ActivityFeed` needs six other things at the same
time, and adding its `label` alone would leave the binding excepting the rest.

**The other four are closed, on the precedent this section named.** `Table.label` is the shape and
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

## §4 — States the components have no concept of — **one row left**

| subject | requirement |
|---|---|
| `TableRow:react` | `states.disabled` |

`TableRow`'s row is not a leftover: it is entangled with that binding's other four exceptions and
with the pattern it should have been measured against at all, so it is settled in §2 rather than
here. Everything else is closed.

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
| `Table:react` `focus.roving` | true in card mode only, and only when a consumer put an `onClick` on a `TableRow` |
| `Toast:react` `content.noAutoDismiss` | the host owns the timer; `persist` is documented as mandatory for critical states and enforced nowhere |
| `Tooltip:react` `roles.describedby` | holds only when the consumer's child accepts and forwards props; **a fragment defeats it silently, and the binding reads `exceptions: []`** |

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

The **17** exceptions in `BehaviourDelegated.json` cannot be closed by editing anything in this
repository — they are claims about `MatProgressBar`, `MatTable`, `MatButtonToggleGroup` and their
siblings. Emptying them means replacing Material with Arena primitives on the CDK, which is Plan D
in `2026-07-23-8-api-contracts-design.md`.

Two facts to carry into that work: the delegated file records **no Material version** for any of its
claims (they were verified against `@angular/material` 22.0.5), and `check:behaviour` never re-checks
a claim about a third-party library — so those reasons can quietly become false while every gate
stays green.

**What binding cases give this section.** A shape for Plan D's new primitives to be *born* with
rather than retrofitted: any primitive with variants should declare cases from its first commit. And
the delegated file itself could take cases, which is the cheapest way to stop a single flat
exception list describing several Material configurations at once.

## §7 — The two components that can never have a suite

`Calendar` and `Table` bind `grid`, and the standing rule is that a component whose binding names
`grid` is DOM-tested **by hand**. The rule is a measurement, not a preference:
`grid-keyboard.test.jsx` alone peaked at 164 MiB against 109 for the other six suites together.

So `Calendar` already declares full `grid` compliance with **nothing rendering it**, and `Table`'s
surviving exception is unverifiable for the same reason. Reaching `exceptions: []` on these two is
possible; *verifying* it is not, unless the rule is retired and the memory cost paid.
`git show edb9f3e^:frameworks/react/test-dom/grid-keyboard.test.jsx` is the deleted suite, ready to
restore if that trade is ever made.

**What binding cases give this section.** An enumerable hand-check list. Once a binding declares its
cases, the cases *are* the checklist a person walks through on the `*.card.html` page — which is the
first time the hand check has had a written, machine-readable definition of what "all of it" means.

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
2. ~~**§4**~~ — **done but for `TableRow`**, which §2 settles. It was not free: two of its six
   declarations were stale rather than real, and writing the suite that proved it also fixed two
   false negatives in the shared evaluator.
3. ~~**§3**~~ — **done but for `ActivityFeed`**, whose `roles.label` waits on §2 rather than the
   other way round: it needs six other things in the same change.
4. **§2** — the real work, and the only section that changes what a user experiences.
5. **§8** — widen coverage once the bindings worth covering are honest.
6. **§6** — Plan D, which is a programme rather than a batch.
7. **§5** and **§7** — decisions rather than implementations; take them when the cost is worth paying.

§2 is deliberately not first despite being the only section that helps a real user, because
`ActivityFeed`'s `states.busy` cannot be retired before §4's machinery and its `roles.label` cannot
be retired before §3's decision. Doing it first means doing part of it twice.
