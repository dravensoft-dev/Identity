# Arena behaviour contracts

`contracts/design/` answers *what is this value*. This directory answers *what must this
component do* — which roles it carries, which keys it answers, where focus goes,
what dismisses it.

It is a level under `contracts/`, beside `contracts/api/` — not a corner of the
design one, and deliberately so. A contract is not a value: DTCG models colours,
dimensions and durations, and does not model "Escape closes this". Putting a
pattern under `contracts/design/` would mean relaxing `scripts/check-dtcg.mjs`, which
is one of the cleanest gates in the repo.

## Patterns

One file per pattern in this directory, each citing the source it was adopted
from. Most cite an actual [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/)
page — count them rather than trusting a figure here, which moves whenever a
batch adds a pattern (`ls *.json | wc -l` for the total, run from this
directory, and `grep -l 'apg/' *.json | wc -l` for the APG-derived share; note
`navigation` cites an APG *practices* page rather than a *patterns* one, so a
grep on `apg/patterns` alone undercounts by one). The exceptions are not a fixed
list and must not be written as one: `progressbar`, `status` and `textbox` cite
the ARIA 1.2 role reference instead, because APG has no pattern page for any of
those roles; `figure-with-data-table` cites WCAG because APG has no chart
pattern; `none` and `absent` cite nothing, because there is nothing to adopt
from when the claim is that no pattern applies — see below for why they are two
different patterns and not one.

**That set is machine-checked**, which is what makes it safe to name here at
all: `none aside, exactly the patterns with no APG pattern page cite something
else`, in `scripts/behaviour-contracts.test.mjs`, asserts it by literal value.
Adding a pattern that cites anything but an APG *patterns* page fails that test
until the list follows, so the test is the authority and this paragraph is the
explanation.

`none` and `absent` look alike — both cite nothing, both require nothing — but they
answer different questions, and collapsing them was the exact bug this layer once
had. `none` binds a component that **renders**: it exists, a user can see it, and it
simply offers no interactive affordance (Angular's Card, a bordered surface with
nothing to act on). `absent` binds the fact that **no such component exists in this
layer at all**. Nothing binds it today — every component exists in both layers — which is
exactly why the pattern has to stay: the next component one layer lands first has somewhere
to record itself. Before `absent` existed, both facts were recorded as `none`,
distinguishable only by reading the binding's prose `reason` rather than by anything
a tool could check — the same "no entry means either verified-equivalent or nobody
looked" ambiguity this whole layer exists to end, one level down. Use `none` for a
real, inert surface; use `absent` when the other layer has nothing to bind at all.

`requires` is a flat map of dotted keys. That shape is load-bearing: an exception
in a binding names exactly one requirement, so one exception cannot quietly excuse
three.

## Bindings

Every component declares, in every layer, beside its own source:

- React: `frameworks/react/components/<group>/<Name>.behaviour.json`
- Angular: `frameworks/angular/components/<category>/<component-kebab>/<Component>.behaviour.json`
- Angular, absent: one entry in `frameworks/angular/BehaviourDelegated.json`,
  because a component the layer does not have has no directory to sit beside. That
  file does not exist today; `check:behaviour` reads it only when present, and names
  any React component the Angular layer lacks and has not recorded there.

A binding names a pattern and lists the requirements the component does not yet
meet, each with a reason. `bun run check:behaviour` asserts that every component
declares, that every named pattern and requirement exists, and that the two layers
agree or the difference is written down.

### Flat bindings and cased bindings

A binding describes a component; a render suite judges one render of it. A
component that renders differently depending on its own props — `Alert`
rendering `role="alert"` for a `danger` tone and `role="status"` for any other —
is several renders, and no single flat exception list is correct for all of them.

**Name no component here as a present-tense example of carrying cases.** A component
name written into another file's prose is a claim no gate reads, so it rots while every
gate stays green — [`DOUBTS.md`](../../DOUBTS.md) carries the hazard and the change-time
grep that finds it. `Alert` is the one present-tense name this page keeps, because the
paragraph on `when` below reasons from its `danger` case, so removing it would cost a
worked example and buy nothing. For the live set, run the command at the end of this
section rather than reading any name from this page.

`pattern` and `exceptions` are one shape: `cases` is the other. They are
alternatives, never both — a binding declaring both is rejected by
`validateBinding`. A flat binding (`pattern` plus `exceptions`) still means
exactly what it always has, and stays the right shape for the common case of a
component with one render worth judging. A cased binding replaces both with a
`cases` array, and each entry carries:

- `name` — a short identifier for the case (`"danger"`, `"circle"`);
- `when` — prose stating the configuration that produces it (`"tone is
  \"danger\""`, `"variant is \"circle\""`);
- `pattern` — the pattern that case binds;
- `exceptions` — that case's own exception list, exactly as a flat binding's;
- `reason` — optional; required only when `pattern` is `none` or `absent`,
  exactly as a flat binding's, and inherited from the binding's own `reason`
  when the case does not override it.

`when` is prose, and prose is all that is possible: nothing can verify that a
render suite actually rendered the configuration a case names. A DOM
discriminator would be circular in every motivating case anyway — what marks
`Alert`'s `danger` case is `role="alert"`, which is the very attribute the
requirement under examination is about.

`bindingCases()` in `scripts/lib/behaviour-contracts.mjs` is the one place the
two shapes meet: a flat binding normalises to a single anonymous case (`name:
null`), so every consumer — `check:behaviour`, `check:compliance`, both
layers' render-suite wrappers — reads a binding as a list of cases and never
tests for `cases` itself. `reason` rides along on each normalised case too,
inherited from the binding unless the case overrides it, because a case may
bind `none` or `absent`, and those require one exactly as a flat binding does.

The flat shape stays valid and means one case, so the untouched majority is not
churned to say so. Find the bindings that do declare `cases` with
`grep -rl '"cases"' --include='*.behaviour.json' frameworks/` — read the list
rather than a figure written here, which drifts the first time a batch converts
another binding.

### Native semantics vs. an absent capability

A requirement met by the element's own native semantics counts as **met, with no
exception** — whether the attribute is explicitly authored by the component
(`disabled={disabled}`, `required={required}`, `checked={checked}`) or is simply
implicit in rendering that native element at all, with no consumer action needed
(a native `<select>`'s combobox role and expanded/controls/activedescendant
state; a native `<input type="checkbox">`'s reflected checked state). The
component asserted nothing; the browser's own accessibility mapping did the
work, and that is exactly what the requirement asks for.

A requirement is an **exception** when the component gives no supported,
documented way to reach it — not merely "no explicit prop", since a generic
`...rest` spread can still land an arbitrary attribute on the underlying native
element without the component ever having designed for it. The test is whether
the component's own design acknowledges the capability: is it destructured, does
it drive any of the component's own logic or styling, is it named in the
`*.prompt.md`? `Input`'s `min`/`max` pass through `...rest` too, but
`Input.prompt.md` calls them out by name as a supported feature — that
authorship is what makes them "met", not the passthrough alone. `readOnly`
reaching the native `<input>`/`<textarea>` the same way, with no default, no
effect on any rendered state, and no mention in the prompt, is not a designed
capability, so it is exactly the gap `Tag.behaviour.json` already records for
its remove button's missing `disabled` concept: the component offers no
supported way to make the state true, whether or not a determined consumer
could force it through.

**What it does not assert is whether the component actually behaves as it says.**
That is a later plan's work. A component can bind `dialog-modal` here and trap no
focus at all.

`check:behaviour` still proves only that a declaration is well formed. What proves
a declaration is *true* is a render suite: for a component listed in `COVERED`
(`scripts/check-compliance.mjs`), a suite asserts per requirement that the rendered
DOM either meets it with no exception declared or fails it with one declared. That
is bidirectional on purpose — it catches an overclaim and a stale exception with
one statement — and it is why an exception can now expire. Coverage is partial:
`check:compliance` guards that the record is accurate, never that it is complete.
Neither gate is an accessibility claim about any component.
