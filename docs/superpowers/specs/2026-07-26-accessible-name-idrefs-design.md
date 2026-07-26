# Resolving the accessible name, and giving each reference attribute its own rule

**Status:** design, approved 2026-07-26. Batch 8C8.

## The problem

Batch 8C7 taught the compliance evaluator that an IDREF must **resolve** rather than merely be
present, and its own whole-branch review then found the hole it had not closed: `roles.label` never
reaches `ATTRIBUTE_FOR`, so `IDREF` never sees it. `roles.label` is decided by
`hasAccessibleName()`, which returns `true` the moment `aria-labelledby` is a non-empty string. The
attribute is counted, never resolved.

Thirteen of the pattern files declare `roles.label` — measure with
`grep -l '"roles.label"' behaviour/patterns/*.json | wc -l` rather than trusting that figure, which
moves whenever a batch adds a pattern.

**This is live on covered bindings, and it was proved by induction rather than argued.** Deleting
`id={titleId}` from `Dialog.jsx` leaves an `aria-labelledby` pointing at nothing on a dialog with
**no accessible name at all** — and `dialog-modal.test.jsx` stays green, 6 pass / 0 fail. That is
the same shape as the defect 8C6 shipped, one requirement key over. `ConfirmDialog:react` carries
the identical exposure, and `SideNavSection` would if it were covered. Nothing ships broken today:
every `aria-labelledby` in both layers resolves.

A second, smaller gap sits beside it. 8C7 applied `ids.some((id) => resolveId(id) != null)` to all
three keys in `IDREF`, but the comment justifying `some` is a fact about **one** attribute:
`Tooltip` merges the consumer's own `aria-describedby` with Arena's, and the consumer's may name an
element outside Arena's rendered tree, so demanding that every id resolve would fail a correct
component. No such merge exists for `aria-controls`; every one in the layer is a single id Arena
generates. So `aria-controls="panel-1 invented"` passes today on a concession borrowed from another
attribute. Not live, and the same class of hole.

## What is being built

### 1. `hasAccessibleName` asks whether there is a name, not whether there is an attribute

Today it is `aria-label || aria-labelledby → true`, then text content if the pattern admits it. It
becomes an ordered walk of the three routes, and the order is chosen so that resolution is
consulted **only when it decides the answer**:

1. `aria-label` non-empty → named. No resolver consulted.
2. The element's own text content, when the pattern is in `LABEL_ACCEPTS_TEXT` → named.
3. `aria-labelledby` → named only when **every** id resolves.

The reorder changes no verdict. The three routes are alternatives, so the answer is a disjunction
and its order is free; every case true today stays true except the one this batch exists to catch.
It also matches how a real accessible-name computation behaves: an `aria-labelledby` that resolves
to nothing falls through to the next route rather than nulling the name. What the order buys is
that a button carrying both text and an `aria-labelledby` never needs a resolver, so the throw in
route 3 fires only where a resolver would have changed the outcome.

**`aria-labelledby` demands that EVERY id resolve, unlike `aria-describedby`.** The attribute
concatenates the text of all referenced elements to build one name, so a dangling id truncates the
name silently rather than removing it — a defect a presence check and a `some` check are equally
blind to. The concession that justifies `some` for `aria-describedby` does not exist here: every
`aria-labelledby` in both layers is a single id Arena itself generates (`Dialog`, `ConfirmDialog`,
`Tabs`, `SideNavCollapsible`, `SideNavSection`, and Angular's `confirm-dialog`), never a list merged
with consumer input, so nothing legitimately points outside the rendered tree. The rule costs
nothing today and refuses a shape the system has no reason to accept.

### 2. `roleOf` takes the resolver too

`roleOf` calls `hasAccessibleName` for one case: a `<section>` exposes `role="region"` only when it
is named. A section whose `aria-labelledby` dangles has no name, so it exposes no role — the same
question, and it deserves the same answer. `roleOf(el, resolveId)`, and `evaluate` threads its own
`resolveId` into both call sites (`roles.element` and the `ROLE_NAMED_BY_KEY` branch).

This is the fifth surface the 8C7 review named when it scoped the fix, and taking it is what keeps
one file from holding two different answers to "is this element named".

### 3. A missing resolver throws

An `aria-labelledby` that needs resolving with no `resolveId` supplied **throws**, carrying 8C7's
policy verbatim: this file's rule is that `null` is never a fallthrough, and degrading to the old
presence check would rebuild in silence the hole this batch exists to close. The message names the
element's requirement and says a wrapper builds the resolver.

The alternative — treating an unresolvable name as simply unnamed — was rejected. It fails the
opposite way and worse: a correct component starts failing anywhere a resolver has not yet been
threaded, and the failure says nothing about why.

### 4. `IDREF` becomes a per-attribute map, and the requirement-key set is derived from it

The strictness belongs to the **attribute**, not to the requirement key, which is also the only way
`aria-labelledby` can be governed at all — it has no `ATTRIBUTE_FOR` entry.

| attribute | match | reason |
|---|---|---|
| `aria-labelledby` | `every` | concatenates into one name, so a dangling id truncates it silently |
| `aria-controls` | `every` | corrects a concession borrowed from `aria-describedby`; every one in the layer is a single Arena-generated id |
| `aria-activedescendant` | `every` | a single IDREF by specification, so `every` and `some` agree and `every` is the honest spelling |
| `aria-describedby` | `some` | the one exception: `Tooltip` merges the consumer's own description, which may name an element outside Arena's rendered tree |

Each entry carries its reason as a string, in the idiom `QUANTIFIED` and `EXEMPT` already use, and
the map carries their staleness discipline: an entry naming an attribute no branch of the evaluator
consults fails the suite rather than rotting.

**The `IDREF` set of requirement keys is derived from this map** — the keys whose `ATTRIBUTE_FOR`
value appears in it — rather than hand-written beside it. Two hand-written lists of the same fact
can disagree; one derived from the other cannot.

## Verification

The unit suite runs under plain node with stub elements, as it does today, and covers: each route
naming the element on its own; a dangling `aria-labelledby` with no other route → unnamed; a
dangling `aria-labelledby` **with** text on a pattern that accepts text → still named; a partially
resolving list → unnamed; the throw; and `roleOf` refusing `role="region"` to a section whose
labelledby dangles.

**Two inductions against real components, both measured as passing today**, because a check nobody
has watched fail is a check nobody knows works:

- Delete `id={titleId}` from `Dialog.jsx`. Today `dialog-modal.test.jsx` reports 6 pass / 0 fail.
  It must report `roles.label: OVERCLAIM`. This is the batch's headline claim.
- Write `aria-controls="panel-0 invented"` into `Tabs.jsx`. Today it passes on the borrowed `some`.
  It must fail.

Each guarded with `sha256sum` beforehand, restored with `git checkout --`, and the restore proved
with `sha256sum -c`.

## Blast radius

**No component changes.** Every `aria-labelledby` in both layers resolves today, so no suite should
turn red. If one does, it is a real accessibility defect and the batch stops and reports it rather
than relaxing the check — an assertion is never weakened to make a suite pass.

`hasAccessibleName` and `roleOf` are exported but consumed only by the evaluator and its own suite;
no wrapper calls either. `comparePattern` already threads `resolveId`, and both wrappers already
build one, so nothing outside `scripts/lib/behaviour-compliance.mjs` and its suite needs to change.

## What stays open, and is recorded rather than closed

**A resolved `aria-labelledby` may name an EMPTY element.** `SideNavSection.jsx` already worries
about exactly this in its own comment — a `role="group"` whose `aria-labelledby` resolves to an
empty heading. Requiring the target to carry text was considered and rejected: `textContent` cannot
see a legitimate name that comes from an image's `alt` or a nested `aria-label`, so the check would
produce false negatives against correct components. It belongs to the family the record already
carries — a resolved reference is not proof it landed on the **right** element, and a name that is
present is never checked for being **useful**, which the charts' entry has recorded since before
this layer existed.

**The `Known debt` entry 8C7 wrote about `roles.label`** becomes false with this batch and is
rewritten by it, keeping the half that survives.

## Out of scope

Angular's `confirm-dialog` is the only Angular component rendering an `aria-labelledby`, and no
covered Angular binding declares `roles.label`; the shared evaluator serves both layers, so the
Angular side inherits the fix with nothing to implement and nothing to verify beyond its suites
staying green. Widening compliance coverage is not this batch. Neither is the pattern schema's
inability to say what **kind** of element a reference must reach.
