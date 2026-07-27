# The pattern that was missing, and the conditional requirement that already had an answer

**Status:** design, approved 2026-07-26 — **written, not scheduled.** Deferred in favour of
resolving the conditionality question this spec's §2 deliberately leaves open, because `Skeleton`
and `Tag` were judged the more valuable subject. Nothing here is withdrawn: the batch stands as
designed and is ready to plan whenever it is picked up. Note one dependency in that order, though —
if conditionality gains a way to be *declared* rather than pushed into `BEHAVIOURAL`, §2 should be
re-read before this is planned, since it may then have a second correct answer.

## The problem

Four bindings declare exceptions that record no defect at all. `ProgressBar` renders
`role="progressbar"` — the correct ARIA role for exactly this widget — and its binding calls that
a failure, because the catalogue has no `progressbar` pattern and `status` was the closest fit.
The exception's own reason says so: *"the more specific ARIA role for this exact widget, and
arguably more correct than this pattern's literal requirement."* Angular's delegated `ProgressBar`
and `Spinner` carry the same pair for the same reason, naming Material's `role="progressbar"` as a
divergence from a pattern nobody thinks it should implement.

An exception is supposed to record a component falling short. These record a **catalogue falling
short**, and they are the only exceptions in the repository where the fix is to change neither the
component nor the binding but the set of patterns available to bind. Count the live exceptions
rather than trusting a figure here. The component files:
`grep -rho '"requirement"' --include='*.behaviour.json' frameworks/ | wc -l`, which is 63 as
written. The delegated file separately:
`grep -o '"requirement"' frameworks/angular/behaviour-delegated.json | wc -l`, which is 18.

(Both commands were run before being written down. A `frameworks/**/*.behaviour.json` glob does
**not** work here — without `globstar` it fails to expand, grep warns, and the count silently comes
back as the delegated file alone. That is the shape of stale-measurement failure this repository
already recorded once, so it is noted rather than quietly corrected.)

This batch removes **four**, and they are not all the same kind. Three are pure catalogue
artefacts — the `roles.element` exception on `ProgressBar:react` and on each of the two delegated
entries — which vanish because the pattern they were measured against was the wrong one. The
fourth, `ProgressBar:react`'s `live.politeness`, is retired by actually fixing the component: it
gains an announcement it never had. The two delegated `live.politeness` exceptions survive on
purpose, and §3 says why.

## What is being built

### 1. A `progressbar` pattern, sourced from the ARIA role reference

APG has no pattern page for `progressbar` — confirmed by fetching the pattern index on 2026-07-26,
not assumed — so the pattern cites ARIA 1.2's role reference instead. That is not a new exception to
the catalogue's sourcing rule: `status` and `textbox` already do exactly this, for exactly this
reason, and this becomes the third.

**Why not APG's `Meter` pattern, which does exist.** The index carries one, and the next reader will
ask. `meter` is a gauge: a static measurement inside a known range — disk usage, a fuel level —
where the value is a *reading*, not a report that work is under way. `progressbar` is the role for a
task that takes a long time and ends. `ProgressBar` and `Spinner` report work, and `Spinner` has no
range at all, so `meter` is the wrong pattern for both. Recorded so nobody re-derives the question.

The pattern requires:

| requirement | value | why |
|---|---|---|
| `roles.element` | `progressbar` | the role the widget exposes |
| `roles.label` | an accessible name, from `aria-label` or `aria-labelledby` | never text content — see below |
| `live.politeness` | an **explicit** `aria-live` | the role carries none implicitly, unlike `status` |
| `states.valuenow` | `aria-valuenow` set **when** the widget reports a determinate value | conditional |
| `states.valuemin` | `aria-valuemin` set **when** the widget reports a determinate value | conditional |
| `states.valuemax` | `aria-valuemax` set **when** the widget reports a determinate value | conditional |

`progressbar` does **not** join `LABEL_ACCEPTS_TEXT`. A progress bar's text content is its
percentage or its caption, not its name, and the suite already asserts both directions of that
whitelist — `no pattern outside LABEL_ACCEPTS_TEXT admits text content` fails if the `roles.label`
prose mentions text.

### 2. The three value requirements are CONDITIONAL, and the repo already knows what to do with one

They live in `BEHAVIOURAL`, in the tail whose own docstring is the argument for putting them there:

> *Six CONDITIONAL states live here that a presence check used to answer wrongly, because their
> prose carries a "when" [...] A snapshot of one element cannot decide a conditional claim — an
> enabled `<button>` correctly carries no `aria-disabled`, and reading that as unmet produced
> "Button, enabled: states.disabled: OVERCLAIM" against a component doing exactly the right thing.
> Only a suite that renders the condition and then asserts can answer these.*

An indeterminate progress bar correctly carries no `aria-valuenow`. It is the same sentence with a
different attribute, so it takes the same answer: `evaluate()` returns `null`, and a suite must name
each key in its `behavioural` map and assert it by **rendering both branches** — a determinate bar
and an indeterminate one.

**And here the conditionality is not merely awkward to check, it is undecidable in principle.** ARIA
expresses indeterminacy by *omitting* `aria-valuenow`; there is no `aria-indeterminate`. So a
progress bar without that attribute is either legitimately indeterminate or determinate and broken,
and nothing in the DOM distinguishes them. The behavioural route is forced rather than chosen, which
is a stronger justification than the six states already there can claim.

**What this does NOT settle, and the batch must not be read as settling it.** The repository's open
question — *"How does a pattern express an optional requirement?"* — has three faces, and only one is
touched here:

- a **requirement** that applies conditionally (`aria-valuenow` when determinate) — solved already;
  `BEHAVIOURAL` carries a tail of conditional states today and this batch adds three to it. Read the
  set for the live membership rather than an ordinal, which would go stale on the next addition;
- an **exception** scoped to a variant (`Skeleton`'s two are true of the `circle` variant and false
  of the other three) — untouched;
- a **whole pattern** that applies conditionally (`Tag` is a `button` only when `onRemove` is passed)
  — untouched.

`Skeleton` and `Tag` gain nothing from this batch. Saying so is part of the deliverable, because a
reader meeting a new conditional requirement could reasonably conclude the question closed.

### 3. Four bindings move, and two components change

| binding | today | after |
|---|---|---|
| `ProgressBar:react` | `status`, 2 exceptions | `progressbar`, none |
| `Spinner:react` | `status`, none | `progressbar`, none |
| delegated `ProgressBar` | `status`, 2 exceptions | `progressbar`, 1 |
| delegated `Spinner` | `status`, 2 exceptions | `progressbar`, 1 |

`ProgressBar.jsx` gains an explicit `aria-live="polite"`. Its `live.politeness` exception stops
being a concession and becomes a requirement genuinely met — the component announces value changes
where before it announced nothing.

`Spinner.jsx` moves from `role="status"` to `role="progressbar"` **and gains the same explicit
`aria-live="polite"`**. That second half is not decoration: `role="status"` carries an implicit
polite live region and `role="progressbar"` carries none, so unifying the role without the explicit
attribute would silently remove an announcement the component makes today. The batch preserves it
exactly.

The two delegated entries keep **one** exception each, on `live.politeness`, and it now states
something true and useful rather than an artefact: Material's `MatProgressBar` and
`MatProgressSpinner` set no politeness, and Arena's own components do.

**No exception is owed for the three value requirements, and the reason differs per entry.**
`MatProgressBar`'s delegated reason already records the full plumbing — `aria-valuenow`,
`aria-valuemin` and `aria-valuemax` — so it meets them outright. `MatProgressSpinner`'s reason
records only `aria-valuenow` mirrored from `value`, and says nothing about min or max; but the three
requirements are conditional, an indeterminate spinner correctly carries none of them, and a
delegated entry has no component of Arena's to render, so there is no suite to hand a verdict to
either way. **Nothing in `behaviour-delegated.json` is verified by a suite** — that is true of every
claim in that file today and is recorded under *Known debt*, not introduced here. The plan must
confirm the two reasons say what this paragraph says before rewriting either.

**`Skeleton` does not move.** It is a loading placeholder, not a report of progress; `status` with
an implicit polite live region is the right pattern for it in both layers. Its two React exceptions
belong to the variant-scoped family above and are out of scope.

### 4. Retiring an exception without a suite would make things worse

`ProgressBar:react` and `Spinner:react` get render suites and enter `COVERED`. This is not optional
polish. Today `ProgressBar:react` honestly declares two things it does not do; rewriting that to
`"exceptions": []` with nothing rendering it swaps an honest admission for an unverified claim,
which is the exact shape of the defect 8C6 shipped and 8C7 and 8C8 were spent closing. The suite is
what makes the retirement true.

Each suite renders **both** branches and declares the three value verdicts in its `behavioural` map.
A suite that renders only the determinate case would prove half the pattern and silently claim all
of it.

## Verification

The evaluator's own suite already carries the coherence tests that drive this work, and they fail
until each step is done. They are the specification in executable form:

- `every requirement key in every pattern is DECIDABLE or BEHAVIOURAL` — fails until the three value
  keys are added to `BEHAVIOURAL`.
- `DECIDABLE and BEHAVIOURAL name no key that no pattern uses` — the reverse staleness rule, so the
  keys cannot be added speculatively ahead of the pattern.
- `every pattern requiring roles.element has an ELEMENT_ROLE entry` — fails until
  `ELEMENT_ROLE.progressbar` exists. Without it `evaluate()` **throws** rather than returning a
  verdict, which aborts a whole test file.
- `every ELEMENT_ROLE value is the role its own pattern names` — pins the entry to the pattern's own
  `roles.element` value.
- `no pattern outside LABEL_ACCEPTS_TEXT admits text content` — fails if the `roles.label` prose is
  written loosely.
- `DECIDABLE and evaluate agree: a decidable key never returns null`.

Beyond those, two inductions against the real components, in the shape 8C7 and 8C8 established —
guarded with `sha256sum`, restored with `git checkout --`, restore proved with `sha256sum -c`:

- Remove the explicit `aria-live` from `Spinner.jsx`. The suite must report
  `live.politeness: OVERCLAIM`. This is the induction that matters, because it is the regression the
  unification could have introduced silently.
- Render a determinate `ProgressBar` with `aria-valuenow` removed. The suite must fail on the
  behavioural verdict rather than passing on the indeterminate branch's legitimate absence.

`bun run check` runs once, at close-out, with `CHROME_PATH` exported.

## Expected movement

| gate | before | after |
|---|---|---|
| `check:behaviour` | 21 patterns | 22 patterns |
| `check:compliance` | 10 of 70 | 12 of 70 |
| exceptions in component files | 63 | 61 |
| exceptions in `behaviour-delegated.json` | 18 | 16 |

Both of the component-file removals are `ProgressBar:react`'s; `Spinner:react` declares none today
and declares none after, which is why unifying it moves the pattern count and not the exception
count.

Measure each rather than trusting the table: the gates print their own figures.

## Blast radius

Two component files (`ProgressBar.jsx`, `Spinner.jsx`), four bindings, one new pattern file, three
new requirement keys and one `ELEMENT_ROLE` entry in the shared evaluator, and two new render
suites. No wrapper changes, no API contract changes, no token changes.

`Spinner`'s API is untouched — the role and the live attribute are implementation, not members —
so `check:api` should not move. `ProgressBar`'s and `Spinner`'s contracts are not reopened.

## What stays open, and is recorded rather than closed

**A name that is present is still never checked for being useful.** `ProgressBar.jsx` falls back to
`aria-label={label || 'Progress'}`, which satisfies `roles.label` mechanically while telling a
screen-reader user only what the component is. That is the same defect the charts' entry has carried
since before this layer existed, and this batch neither fixes nor worsens it.

**`aria-valuemin` and `aria-valuemax` have ARIA defaults** — 0 and 100 — so a determinate progress
bar that omits them is still valid ARIA. Requiring them is therefore **stricter than ARIA**, and it
is a deliberate choice rather than a derivation: Arena's own components set them explicitly, and a
pattern that demands what the system already does costs nothing and documents the intent. Recorded
so the next reader meets the decision instead of assuming it was forced.

**The variant-scoped exception and the conditional pattern stay unexpressible**, per §2.

## Out of scope

Widening compliance coverage beyond the two components this batch touches. The other three causes of
the repository's live exceptions — real accessibility defects (`ActivityFeed`, `BulkActionBar`,
`CommandPalette`, `Menu`), the variant-scoped family, and everything delegated to Material, which is
Plan D — are each their own batch.
