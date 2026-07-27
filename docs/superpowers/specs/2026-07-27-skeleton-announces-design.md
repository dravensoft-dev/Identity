# A skeleton announces what it will become

**Status:** design, approved 2026-07-27. Batch 8C10.

## The problem

Batch 8C9 gave a binding the ability to declare render cases, and the first thing that ability did
was surface a difference nobody had been looking for: **`Skeleton`'s `circle` variant announces
itself in Angular and is silent in React.**

`frameworks/angular/primitives/skeleton/skeleton.ts` sets `role: 'status'` and
`aria-label: 'Loading'` in its host bindings with no variant branch, so every variant announces.
`frameworks/react/components/display/Skeleton.jsx`'s `circle` branch returns
`aria-hidden="true"` with no role, so a circular placeholder tells a screen-reader user nothing.
The other three React variants announce.

8C9 recorded the divergence in `components-divergences.md` and deliberately did not decide it,
because both positions were defensible: React's silence assumes a circle is an avatar placeholder
beside a name that is itself announced, and a second "Loading" is noise; Angular's announcement
assumes a lone circular skeleton is a loading state a user should be told about.

## The decision, and it settles more than the divergence

**Every Arena skeleton exists to announce that it will be replaced by a functional component when
asynchronous data arrives to be rendered.** That is what the component is for.

A skeleton that announces nothing is therefore not doing its job, whatever shape it happens to be.
The `circle` variant is a skeleton. **React's silence is the defect and Angular is already right.**

Note what the definition does *not* rest on. It is not "silence is worse than noise", which is a
judgement call the divergence entry correctly refused to make. It is a statement about the
component's purpose, from which the variant's behaviour follows without a further judgement.

**And React's own code already agreed with it three times out of four**, which is the evidence the
divergence entry lacked: no considered noise-reduction strategy was ever applied across `Skeleton`,
because `block`, `line` and `text` all announce unconditionally. The `circle` branch is the odd one
out, not the deliberate exception it reads as.

## What is being built

### 1. The circle announces

`Skeleton.jsx`'s `circle` branch loses `aria-hidden="true"` and gains `role="status"` and
`aria-label="Loading"` — the same name its three siblings already carry. Uniform, because the
definition applies uniformly.

Angular is untouched. It has done this since it was written.

### 2. The binding goes back to flat, and that is the mechanism working rather than a retreat

With all four variants meeting `status`, `Skeleton.behaviour.json` has nothing left to case-split:
it becomes a flat `{"pattern": "status", "exceptions": []}` with no cases and no `divergesFrom`.

**8C9's case split for `Skeleton` was worth building even though this batch removes it.** The split
is what made the difference visible: expressing the variants separately forced the cross-layer check
to compare a cased binding against a flat one, and a flat binding can no longer silently agree. The
mechanism found the defect; fixing the defect retires the need for the mechanism *at this
component*. That is a tool working, not a tool wasted.

Consequences to expect rather than discover: the cased-binding count drops from 7 to 6, and
`Skeleton:react` stays in `COVERED` — its suite reverts from `assertPatternCases` to
`assertPattern`.

### 3. Two hand tests become false and must be rewritten, not deleted

`frameworks/react/test-dom/placement-and-branches.test.jsx` carries two hand-written tests that 8C9
went out of its way to preserve, because a role distribution across variants is not a requirement
key and no pattern can ask for it:

- `Skeleton renders role=status in three variants and not in circle` — the assertion this batch
  inverts. It becomes all four.
- `Skeleton circle is aria-hidden with no live region` — its subject disappears entirely. What
  replaces it is the claim worth pinning now: the circle carries the role and the name, so no
  variant is silent.

Both were true of the component as it stood. Neither is redundant; both are rewritten to what is
true after.

### 4. N sibling skeletons produce N announcements, and the component does not solve it

A list of twenty user rows, each an avatar circle plus a name line, produces forty "Loading"
announcements once the circle speaks. **This is deliberately not the component's problem**, and the
reasoning is the same definition: each `Skeleton` announces its own pending replacement, and twenty
rows really are forty pending replacements.

Two things bound the cost, and both are facts rather than mitigations. Both layers already collapse
a *stack* into one region — React wraps a multi-line `text` variant in a single `role="status"` and
Angular's host does the same — so the repetition is between sibling elements, never within one. And
the repetition is symmetric across layers, so this batch introduces no new divergence.

What the batch owes instead is **guidance where a consumer will meet it**: both `.prompt.md` files
gain the approach and a worked example of wrapping a set. React's prompt already contains the exact
noisy shape — a flex row holding a circle beside a text stack — which is where the example belongs.

**The contract is deliberately not touched.** `api/components/Skeleton.json` declares members and a
`description` of what the component *is*; no contract in the repository carries composition
guidance, and adding the first one is a change to the contract format, its reader and
`api/README.md`. That was considered and rejected for this batch. The cost is recorded rather than
hidden: the guidance lives in the prose of the two layers that exist today, so **a third platform
target would not meet it**, and `Tooltip` has a comparable composition hazard sitting in *Known
debt* for the same lack of a home. If a contract-level field for composition hazards is ever wanted,
those two are its first users.

### 5. Two divergence records move

`components-divergences.md`'s `Skeleton` entry is **closed** — the divergence is gone, not merely
decided, and the entry says which layer was wrong and why the definition settled it.

Its `Toast` entry moves from *"undecided, deliberately"* to **deferred to Plan D**, which is a
separate decision taken at the same time. Angular delegates `Toast` to `MatSnackBar`, which renders
`aria-live="polite"` and — outside Firefox — no role at all, so a critical error toast interrupts in
React and is queued in Angular. Plan D removes Material and would build an `arena-toast` on the CDK
that is born with the right role per tone. **Nothing is fixed for Angular users until then**, and
the entry must say so plainly rather than reading as resolved.

## Verification

`Skeleton:react` is in `COVERED`, so the compliance suite is the mechanism that proves this rather
than a claim about it. One induction, in the shape 8C7 through 8C9 established — guarded with
`sha256sum`, restored with `git checkout --` after staging, and the restore proved with
`sha256sum -c`:

- Put `aria-hidden="true"` back on the circle and remove its role. The suite must fail on
  `roles.element` — and, because the flat binding declares no exceptions, it must fail as an
  **OVERCLAIM** rather than as a stale exception. That distinction is the point: before this batch
  the same broken render was *correct* against a binding that excepted it.

Beyond that: `bun run check:behaviour` must stay coherent with `Skeleton` no longer declaring
`divergesFrom`, `check:compliance` must stay at 15 of 70, and the cased-binding count must fall to
6. `bun run check` runs once, at close-out, with `CHROME_PATH` exported.

## Blast radius

One component file, one binding, one suite, two `.prompt.md` files, `components-divergences.md` and
`CLAUDE.md`. No contract, no gate, no shared library, no Angular source.

**`CLAUDE.md` carries several statements this batch falsifies**, and they are scattered rather than
in one entry — the worked example of the wrapper hole, the list of converted bindings, `Skeleton`'s
`placeholder` as a live instance of the one-render limit, `Skeleton`'s `circle` as a case bound to
`none` that verifies nothing, and the text-scan entry citing "`role="status"` in three of four
variants". Find them with `grep -n Skeleton CLAUDE.md` and judge each; some describe history and
stay true, some describe the tree and do not.

## What stays open

**The repetition is real and unsolved**, per §4 — recorded as guidance, not as a mechanism, and
nothing enforces that a consumer wraps a set.

**`Toast` is deferred, not fixed**, per §5.

**A third platform target will not meet the wrapping guidance**, per §4's rejected alternative.

## Out of scope

Everything else on the road to `exceptions: []`. **One line of the index is in scope, though**, and
finding it is why this section is worth writing rather than assuming: at
`docs/superpowers/specs/2026-07-26-exceptions-to-zero-index.md:214`, the warning that a case bound
to `none` verifies nothing cites *"`Skeleton`'s `circle`"* as its example. After this batch the
circle is bound to `status`, so the example goes stale while the warning stays true — `Tag`'s
`plain` case is the surviving instance and should replace it. The index's own header says a section
that no longer describes the tree is a defect in the index; that rule now applies to the batch that
falsifies it, which is this one.

8C9's own leftovers (no gate typechecks
`frameworks/angular/test/`; duplicate and nameless case entries rejected only in the wrappers;
`divergesFromReason`'s status as a convention; `inventoryFrom`'s unused `patterns`) are a separate
cleanup and were deliberately not bundled here, because this repo already learned in 8C6 that
orthogonal work in one batch is what reviews worst.
