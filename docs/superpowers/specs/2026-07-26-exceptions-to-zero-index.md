# Every binding at `exceptions: []` — reached

**Status:** closed, 2026-07-29. This was an index: a map of the work between the tree and the goal,
one section per *cause*, each becoming its own spec and its own batch when it was picked up. All
eight batches landed. What is left here is the part a map cannot carry — what the work found, and
what it did not reach — because the sections themselves now describe nothing.

## Where the numbers ended

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

|  | at the start | now |
|---|---|---|
| declarations in component bindings | 54 | **0** |
| distinct binding+requirement pairs | 53 | **0** |
| exceptions in `BehaviourDelegated.json` | 17 | **12** |
| bindings verified by a render suite | 17 of 70 | **50 of 70** |
| patterns in the catalogue | 22 | **24** |
| cased bindings | 7 | **11** |

**The delegated file's drop is NOT progress against Angular Material.** Nothing about Material
changed. `TableRow`'s delegated entry was measured against `button` only because React's was, and
its five exceptions restated what the `Table` entry's eight already say. A delegated entry moves
whenever the PATTERN it is measured against changes, and a batch touching only the React side can
do that without noticing.

**The twenty uncovered bindings all bind `none` or `absent` alone.** Covering them would move the
headline number without verifying anything: a case bound to `none` confirms the render exists, never
that it is correctly inert.

## What the work found, which is the part worth keeping

**An exception on a BEHAVIOURAL requirement with no suite behind it is not merely unverified — it
is unfalsifiable.** `evaluate()` returns `null`, there is no verdict to compare against, and the
binding stays green however far the component drifts from what it says. `Input`'s and `Textarea`'s
`states.readonly` exceptions had been false for some time: each asserted seven things about the
tree and every one was wrong. `DOUBTS.md` keeps the live list of requirements resting on a verdict
no suite declares; it is empty today and will refill.

**Writing a suite is how you find out what a binding was hiding.** Every batch that rendered a
component for the first time found something the binding did not say. `Select` had no accessible
name at all, and the `combobox` pattern does not require one, so nothing surfaced it. `Menu`'s ARIA
sat on a wrapping `<span>`. Angular's `BulkActionBar` announced a labelled region over an empty
element. None of these was in any exception, because an exception records what somebody already
knew.

**Three defects were in the shared evaluator, not in any component**, and each would have forced a
fabricated exception. `roles.label` had no route for a `<label for>`, and later none for a `<label>`
WRAPPING its control — so every correctly labelled native form control read as unnamed.
`states.multiline` refused a plain `<input>` while `states.checked` two lines above already credited
a native one. All three surfaced the first time a form control was rendered against a pattern.

**A count of declarations is not a count of defects, and the difference bit twice.** `CalendarEvent`
declared `states.disabled` once per interactive case — one defect, two declarations. Read a drop in
the raw count as a drop in declarations and nothing more.

**Check whether a condition can be designed away before modelling it.** `Pagination`'s `roles.label`
looked like consumer-conditionality; it was an API gap, and making the member required removed the
condition instead of expressing it. Its optional-with-a-default member was one batch of work that
had to be redone. `Table`'s `focus.roving` looked the same and was a neighbouring component's case.
Two of that section's four rows were misfiled.

**A suite for a uniqueness requirement must render two instances.** `navigation` asks for a *unique*
label per landmark, so a one-instance suite goes green against a hardcoded constant exactly as
readily as against the fix.

**When the pattern does not fit, fix the catalogue.** Twice: `ConfirmDialog` renders
`role="alertdialog"` and was measured against `dialog-modal`; `Select` is a native element and was
measured against an authored combobox. Both had exceptions recording a correct component as a
defect. The catalogue gained `alertdialog` and `select`.

**Assert the platform rather than faking it.** Native radios, native buttons and a native select get
their keyboard from the browser, and happy-dom implements none of it. A dispatched key would pass
identically against a working control and a broken one — so those suites assert the structural
precondition (one shared name, exactly one checked, no authored tabindex) and that Arena does not
INTERCEPT the key, and leave the rest to the by-hand check.

**A slot cannot be decorated safely without a guard.** `Menu.trigger` and `Tooltip.children` both
took their ARIA through `cloneElement`, and a fragment passes `React.isValidElement`, so the clone
succeeded and the attribute reached nothing — silently. Both throw now on the two detectable shapes.
A component that accepts the prop and drops it stays undetectable.

**The grid hand-test rule was retired by measuring, and the premise behind its replacement was
wrong.** Walking a grid cell by cell instead of remounting did not make the suite cheap: the bill is
the number of key presses, because each re-renders the grid through `act()`. Mounting an 84-cell
fixture is +15 MiB; walking it is +60. What makes it affordable is a small, explicitly sized
fixture. `DOUBTS.md` carries the figures and why the old 164 MiB was not comparable to any of them.

## What is NOT claimed

**Not that Arena is accessible.** `check:compliance` green says the declarations are honest and that
every declared requirement is rendered by a suite. It says nothing about whether a screen reader
announces any of it well, and a suite can assert that a name exists, never that it is a good one.

**Not that the twenty uncovered bindings are inert** — only that they claim nothing an assertion
could catch.

**Not that the delegated twelve are close.** They are claims about `MatProgressBar`, `MatTable`,
`MatButtonToggleGroup` and their siblings, recorded against `@angular/material` 22.0.5 with no
version pinned in the file and no gate re-checking them. Emptying them means replacing Material with
Arena primitives on the CDK — Plan D, in `2026-07-23-8-api-contracts-design.md`. Two things to carry
into that work: any primitive with variants should declare `cases` from its first commit, and the
delegated file itself could take cases, which is the cheapest way to stop one flat exception list
describing several Material configurations at once.

**Not that the interiors are proved.** A focus trap's interior — that Tab from a control in the
middle reaches the next one — is native sequential navigation happy-dom does not have, so it stays a
by-hand check in real Chromium against each component's `.prompt.md` checklist. `Calendar`'s chip
geometry and its Enter-into-an-event clause are outside the `grid` pattern's eight requirements and
are checked the same way.

**One detail rests on recollection rather than a re-read.** `ActivityFeed`'s articles carry
`tabindex="0"` because APG's feed example is remembered to use it; www.w3.org is refused at the
domain level from the environment this was executed in. A search confirmed Page Down and Page Up in
APG's own words. `DOUBTS.md` names the page to re-read.
