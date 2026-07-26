# A binding describes a component; compliance judges a render

**Status:** design, approved 2026-07-26. Batch 8C9.

## The problem

`comparePattern()` is called once, against one rendered tree, with one flat list of exceptions. A
component that renders differently depending on its own props is several trees, and no flat list is
correct for all of them. The layer has carried that mismatch since it was built, and it is the
repository's oldest open question — recorded three times under *Known debt* in two different shapes,
and named in the original spec as *"How does a pattern express an optional requirement?"*

Today the mismatch is not merely unexpressed, it is **actively hidden**. `Skeleton` binds `status`
with two exceptions that are true of the `circle` variant and false of the other three, and its
compliance suite renders `circle` specifically — the one render that makes the exceptions true. The
suite passes, the binding looks honest, and a reader of either concludes something false about the
other three variants. Nothing detects this, because nothing requires a suite to render more than one
configuration.

Measured on this tree rather than recalled: **nine exceptions across eight bindings** state a
condition in their own prose. Find them by reading the reasons, not by grep — the word "when" also
appears in reasons that describe plain defects, and conflating the two is the mistake this spec must
not make. As written they are `Skeleton:react` (two, the `circle` variant), `Alert:react`,
`Toast:react` and `alert:angular` (the role is `alert` only when `tone` is `danger`), `Tag:react`
and `tag:angular` (a real `<button>` renders only when the tag is removable), `CalendarEvent:react`
(its own reason says the chip *"takes THREE shapes and the pattern applies to two of them"*), and
`Table:react` (`focus.roving` is *"TRUE OF THE CARD-MODE VARIANT ONLY"*).

They split along the two levels the open question names: the **requirement** is met in some renders
and not others (`Skeleton`, `Alert`, `Toast`, `Table`), or the **pattern itself** applies in some
renders and not others (`Tag`, `CalendarEvent`).

## What is being built

### 1. A binding may declare cases

A binding gains an optional `cases` array. Each case carries a `name`, a `when` in prose describing
how to produce that render, its own `pattern`, and its own `exceptions`.

```json
{
  "cases": [
    { "name": "danger", "when": "tone is \"danger\"",
      "pattern": "alert", "exceptions": [] },
    { "name": "advisory", "when": "any other tone -- info, success, warning, neutral",
      "pattern": "status", "exceptions": [] }
  ]
}
```

**The flat shape stays valid and means "one case".** Most bindings describe a component with one
render and must not be churned to say so; measure the untouched majority with
`grep -rL '"cases"' --include='*.behaviour.json' frameworks/ | wc -l` rather than trusting a figure
here — it is all 70 today, since the field does not exist yet, and seven fewer once this lands.
A binding declares `pattern` **or** `cases`, never both — two places for one fact is the defect this
repository already fixed once by deriving `IDREF` instead of writing it twice.

### 2. `when` is prose, and the reason is a limit rather than a preference

A case cannot carry a props map, and the alternative was considered and rejected. Nothing can verify
that a suite rendered the configuration a case describes: the wrapper receives a rendered tree, not
the call that produced it, and it cannot read a React prop or an Angular signal from the DOM. A
props map would therefore be **precision the gate cannot enforce**, and the binding files are
per-layer, so the prop names would diverge between React and Angular and the cross-layer gate would
have to ignore the one field that looked most rigorous.

A DOM discriminator was rejected for a sharper reason: it is circular in every case that motivates
this batch. What distinguishes `Alert`'s `danger` case is the `role="alert"` the requirement is
evaluating, and what distinguishes `Skeleton`'s `circle` case is the *absence* of the role. The
discriminator would be the subject of the examination.

### 3. What IS enforced, which is the part that closes the live hole

The wrapper requires a suite to call it once per declared case, and fails when the set of case names
it was given is not exactly the set declared. A missing case is the `Skeleton` defect — half a
component verified, all of it claimed. An unknown case name is a typo or a stale rename. This is the
same used/unused discipline the `behavioural` map already carries, applied to cases.

`check:behaviour` gains three assertions: every case names a pattern that exists; every case's
exceptions name requirements that pattern really has; and the two layers declare the same case
**names** for the same component, or the gate names both and picks no winner — which is the rule the
layer already applies to patterns, extended rather than invented.

`COVERED` stays keyed `<component>:<layer>`. Covering a component means covering **all** its cases,
because the wrapper cannot pass otherwise. There is deliberately no way to record a half-covered
component: that state is what this batch exists to abolish.

### 4. Eight exceptions are retired, and they are retired legitimately

This is the finding that made cases worth building rather than merely worth having. Splitting a
binding into cases lets each case be measured against **the pattern it actually implements**, and in
most of these the other case turns out to be compliant with a different pattern already.

| binding | today | after |
|---|---|---|
| `Alert:react` | `alert`, 1 exception | `danger`→`alert`, `advisory`→`status`; both empty |
| `Toast:react` | `alert`, 2 exceptions | same split; **1** survives (`content.noAutoDismiss`) |
| `alert:angular` | `alert`, 1 exception | same split; both empty |
| `Skeleton:react` | `status`, 2 exceptions | `circle`→`none`, `block/line/text`→`status`; both empty |
| `Tag:react` | `button`, 2 exceptions | `plain`→`none`, `removable`→`button`; **1** survives |
| `tag:angular` | `button`, 2 exceptions | same split; **1** survives |
| `CalendarEvent:react` | `button`, 2 exceptions | split by shape; **1** survives |

Verified against the source rather than inferred: `Alert.jsx` renders
`role={tone === 'danger' ? 'alert' : 'status'}` and `Toast.jsx` the same with a matching
`aria-live`, so the advisory case genuinely implements `status`. `Skeleton.jsx`'s `circle` branch
renders `aria-hidden="true"` with no role — a decorative placeholder, which is what `none` means —
while its other three branches render `role="status" aria-label="Loading"`.

**What survives is what should.** Every surviving exception is a real defect rather than a
description problem: neither `Tag` nor `CalendarEvent` has any concept of a disabled state, and
`Toast` is auto-dismissed by its host. Those stay declared, which is correct.

### 5. `Table` is deliberately NOT converted, and the reason is a third level

`Table`'s `focus.roving` exception looks like the others and is not. Below `--bp-md` the table is
one card per row, and whether that card is interactive depends on whether the **consumer** passed an
`onClick` to a `TableRow` — not on a prop of `Table` itself. A case describes a render a component's
own API can produce; this one is produced by how a consumer assembles two components. Declaring
`card`→`none` would assert inertness that a clickable card row contradicts, and the recorded defect
there is real: such a row has no keyboard route at all, and the obvious fix is invalid ARIA.

`Table` is also under the grid hand-test rule, so it can carry no render suite and any case
declaration would be unverified. Converting it would trade an accurate exception for an unverified
claim, which is the trade batches 8C6 through 8C8 were spent refusing.

**This is a third level of conditionality and it is now named**, alongside the two cases solve:
conditional on the component's own props (solved here), and conditional on **consumer usage**
(untouched). `Tooltip`'s `roles.describedby` is the other live instance — it holds only when the
consumer's child accepts and forwards props, and a fragment defeats it silently.

## Verification

Three inductions, in the shape 8C7 and 8C8 established — guarded with `sha256sum`, restored with
`git checkout --`, and the restore proved with `sha256sum -c`:

- **The hole this batch exists to close.** Delete one case from `Skeleton`'s suite so it renders
  only `circle`, exactly as it does today. The wrapper must fail with an undeclared-case error.
  Before this batch that suite passes, which is the measurement that started the batch.
- **A case measured against the wrong pattern.** Change `Alert`'s `advisory` case to bind `alert`.
  It must report `roles.element: OVERCLAIM`, because a non-danger alert renders `role="status"`.
- **A stale case exception.** Leave `Skeleton`'s `block` case carrying the old `roles.element`
  exception. It must report `STALE EXCEPTION`, since that variant does render the role.

Each converted binding gets a render suite covering every case, and each converted component enters
`COVERED`. Retiring an exception with nothing rendering it swaps an honest admission for an
unverified claim — the defect 8C6 shipped and the three batches since were spent closing.

`bun run check` runs once, at close-out, with `CHROME_PATH` exported.

## Expected movement

| gate | before | after |
|---|---|---|
| `check:behaviour` | 21 patterns | 21 patterns |
| `check:compliance` | 10 of 70 | 15 of 70 |
| exceptions in component files | 63 | 55 |

Five keys are newly covered — `Alert:react`, `Toast:react`, `Tag:react`, `Tag:angular` and
`CalendarEvent:react`. The other two converted bindings, `Skeleton:react` and `Alert:angular`, are
**already** in `COVERED` and stay there, so they move the exception count and not the coverage one.
`Skeleton:react` is the more interesting of those two: its suite is rewritten rather than added,
because today it renders one case and claims the component, which is the defect this batch closes.
Measure each figure by running the gates rather than trusting this table.

## Blast radius

The binding schema (documented in `behaviour/README.md`), `comparePattern` and both wrappers,
`check:behaviour`, seven binding files, and the render suites for them. **No component source
changes**: this batch changes what the layer can *say*, not what any component *does*. That is
unusual for a batch that retires eight exceptions, and it is the whole point — those eight were
description failures, not accessibility failures.

## What stays open, and is recorded rather than closed

**Nothing proves the declared cases are all the cases.** A component with five meaningful renders
can declare two, and every gate stays green. This is the same limit the curated `QUANTIFIED` set
carries, and it has the same non-remedy: deriving cases from the source was not attempted, because
a scan for prop branches finds fewer renders than a reader does and would rebuild the
false-negative class this evaluator's own header already rejected once.

**A case bound to `none` verifies nothing**, because `none` has no requirements. For `Skeleton`'s
`circle` that verdict is correct — a decorative placeholder has no interactive contract — but the
suite can then only confirm the case was rendered, never that it is correctly inert. Nothing checks
that `circle` really carries `aria-hidden`.

**Conditional on consumer usage stays unexpressible**, per §5, with `Table` and `Tooltip` as the
live instances.

## Out of scope

Retiring exceptions that describe real defects — `ActivityFeed`, `BulkActionBar`, `CommandPalette`,
`Menu`, and the disabled-state gaps in `Tag` and `CalendarEvent` — each of which is its own batch.
Everything delegated to Angular Material, which is Plan D. And the `progressbar` pattern, whose spec
is written and deferred at
`docs/superpowers/specs/2026-07-26-progressbar-pattern-design-pending-1.md`; its §2 should be
re-read once cases exist, since a conditional requirement may then have a second correct home.
