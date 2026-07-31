# DOUBTS

**A debt is paid, or made loud, before it is written down.**

This file used to be the ledger: every defect, limit and open decision Arena knew about, in
prose, with no character limit. That ledger is empty. What was actionable was paid; what was a
standing limit or a settled decision moved to a place that fails when it stops being true. This
page is what is left — the definition of a debt in Arena, and where the records live.

## What counts as a debt

Something that is **wrong, incomplete, or unverified** — and that a reader would otherwise have
to rediscover. Three tests separate one from an ordinary imperfection:

1. **It is a claim about the tree**, not a preference. "The crosshair snaps a left pad early" is
   a debt; "this component could be shorter" is not.
2. **It survives the person who found it.** If reading the code answers it, the code is the
   record and there is nothing to file.
3. **It costs something specific**, and the cost is stated. A limit with no consequence is a
   fact, and a fact belongs in the normative document that describes the thing.

A **decision** is the other admissible shape: an option that was weighed and refused, recorded so
the next reader does not re-propose it. A decision without its reason is worthless — the reason
is the whole entry.

## Where a debt goes, in order of preference

**Prefer any of these to a paragraph.** Each of them fails when it stops being true, and a
paragraph does not. That is the entire argument for this order:

1. **Pay it.** A defect that can be fixed is not debt; it is work.
2. **A gate, with a reason-carrying map.** `EXEMPT`, `EXCLUDED`, `COVERED`, `UNTRACKED`,
   `PASSTHROUGH`, `SOURCE_OVERRIDES`, `NOT_QUANTIFIED` — each entry names a case and says why,
   as a string value rather than a comment, and each gate's paired suite asserts on the map by
   name. **A stale entry fails its own gate.** See [`scripts/check/README.md`](./scripts/check/README.md).
3. **A suite assertion.** A limit a test can pin is pinned. An assertion that a collision does
   *not* happen is worth more than a sentence saying it was fixed.
4. **The normative document for that layer.** A structural limit belongs where the rule it
   qualifies is stated: [`contracts/api/README.md`](./contracts/api/README.md),
   [`contracts/behaviour/README.md`](./contracts/behaviour/README.md),
   [`contracts/design/README.md`](./contracts/design/README.md), or the layer's own README under
   `frameworks/`.
5. **The component's `.prompt.md`.** A measured limit of one component, and every check only a
   person can run — whether a name is a good name, whether motion reads as intended, whether a
   colour carries the meaning it should — belongs beside the component, in the by-hand checklist
   the prompt already carries.
6. **The one header `scripts/` and test files are allowed**, at most ten lines: a measurement, a
   vendor's behaviour, a pinned version, a constraint of a test environment.

Framework sources under `frameworks/` carry **no** comments at all — `check:docs` enforces it —
so a fact about one of them goes to its layer README or its prompt, never into the file.

## What this file is not

**It is not a changelog.** A fixed defect is neither wrong, incomplete nor unverified, and a
paragraph explaining how it was fixed is history. `CHANGELOG.md` and the commit log already hold
that, and they hold it better, because they are dated.

**It is not a home for prose that could be a check.** Prose here was, for a long time, the
cheapest place to put something — which is exactly why it accumulated: nothing ever failed
because a paragraph went false. Several entries had been false for batches when they were
finally read, and one had been corrected twice and was wrong both times.

**It is not a substitute for reading.** An entry is a claim, and a claim about a file you have
not read is how any record goes quietly false. `CLAUDE.md` carries that rule, the three shapes it
takes, and the change-time greps that find them.

## If you must file one here

Write what is wrong, what it costs, and the command that re-derives it. **Prefer no exemplar, a
command, or an explicitly past-tense one** — all three are stale-proof; a present-tense component
name is not. Then ask once more whether a gate, a suite or a README would hold the same claim,
because one of them almost always will.
