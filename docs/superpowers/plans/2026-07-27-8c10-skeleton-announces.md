# 8C10 — A skeleton announces what it will become

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make React's `circle` skeleton announce itself like its three siblings and like Angular,
closing the divergence 8C9 surfaced — and record, where a consumer will meet it, that the component
does not deduplicate sibling announcements.

**Architecture:** One branch of one component gains a role and a name. Everything else follows:
with all four variants meeting `status`, the binding returns to flat and `Skeleton` leaves the
cased set; the suite reverts from `assertPatternCases` to `assertPattern`; two hand tests invert.
No gate, no shared library, no contract and no Angular source changes.

**Tech Stack:** Bun (build, test), happy-dom for the React DOM suites, `node:test` + `node:assert/strict`.

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only**, in code, comments, docs and commit messages. No emoji.
2. **A commit message containing a backtick uses a quoted here-doc** — `git commit -q -F - <<'MSG'
   … MSG` — never `git commit -m`. A backtick inside a double-quoted shell string opens command
   substitution and is silently spliced away. Verify with `git log -1 --format=%B`.
3. **The first step of every task is `git status --short`**, and it must be clean.
4. **`bun run check` in full runs ONCE, at close-out.**
5. **Run the React DOM suites with `bun run test:react-dom`, NEVER `bun test
   frameworks/react/test-dom`.** Without the `--preload`, react-dom latches its legacy
   change-detection path at module evaluation and a dispatched event reaches a handler zero times,
   silently.
6. **No Angular source changes.** Angular has announced every variant since it was written; it is
   not the defect and must not be edited to meet React halfway.
7. **No contract changes.** `api/components/Skeleton.json` stays as it is — the spec records why,
   and reversing that is a different batch.
8. **No gate or shared-library changes.** `scripts/` is untouched by this batch.
9. **`git checkout -- <path>` restores from the INDEX, not HEAD.** The induction edits a file the
   task has already modified, so: **`git add -A` first, then edit, then `git checkout -- <path>`.**
   Unstaged, the restore silently reverts the task's own work and `sha256sum -c` will not catch it,
   because the hash was taken after those edits.
10. **Never weaken an assertion to make a suite pass.**
11. **Do NOT run `bun run build:demos`.** Every component `.jsx` has a committed compiled `.js`
    sibling; the DOM suites import the `.jsx` directly.

---

## What this plan measured before it was written

Read off the tree on 2026-07-27, branch `skeleton-announces-8c10`, cut from `main` at `f6bc00a`
(8C9 merged and pushed, its branch deleted).

| measure | value |
|---|---|
| `bun run check:compliance` | 15 of 70 |
| `bun run check:behaviour` | 21 pattern(s); 50 react + 20 angular + 30 delegated |
| bindings carrying `cases` | 7 |
| `bun run test:react-dom` | 107 across 15 files |
| `bun test scripts` | 602 |
| `grep -c Skeleton CLAUDE.md` | 20 |

Facts the tasks depend on, each read off the source:

- `Skeleton.jsx:25-27` — the `circle` branch returns
  `<div className="arena-skeleton" aria-hidden="true" style={{…}} />`, no role.
- `Skeleton.jsx:32` — the multi-line `text` variant wraps its rows in ONE
  `<div role="status" aria-label="Loading">`. Lines 39 and 41 are the single-element `line` and
  `block` variants, each carrying the role and the name itself.
- `frameworks/angular/primitives/skeleton/skeleton.ts:44-46` — `role: 'status'` and
  `'aria-label': 'Loading'` are host bindings with no variant branch.
- `Skeleton.behaviour.json` carries two cases (`placeholder` → `status`, `circle` → `none` with a
  reason) plus `divergesFrom: "status"` and a `divergesFromReason`.
- `frameworks/react/test-dom/placement-and-branches.test.jsx` — the two hand tests are at lines 77
  and 87; the `assertPatternCases` call is at line 95.
- `Skeleton:react` is in `COVERED` in `scripts/check-compliance.mjs` and stays there.
- `Skeleton.prompt.md`'s second example is a flex row holding a circle beside a text stack — the
  exact shape that becomes noisy.
- `docs/superpowers/specs/2026-07-26-exceptions-to-zero-index.md:214` cites `Skeleton`'s `circle`
  as the example of a case bound to `none`.

---

## File Structure

**Modified**

- `frameworks/react/components/display/Skeleton.jsx` — one branch.
- `frameworks/react/components/display/Skeleton.behaviour.json` — back to flat.
- `frameworks/react/test-dom/placement-and-branches.test.jsx` — two hand tests inverted, the
  compliance call reverted.
- `frameworks/react/components/display/Skeleton.prompt.md` and
  `frameworks/angular/primitives/skeleton/skeleton.prompt.md` — the wrapping guidance.
- `components-divergences.md`, `CLAUDE.md`, and one line of the index spec — Task 3.

**Not modified, and each is a result rather than an omission:** every file under
`frameworks/angular/primitives/`, `api/components/Skeleton.json`, and everything in `scripts/`.

---

## Task 1: The circle announces

**Files:**
- Modify: `frameworks/react/components/display/Skeleton.jsx`
- Modify: `frameworks/react/components/display/Skeleton.behaviour.json`
- Test: `frameworks/react/test-dom/placement-and-branches.test.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a flat `Skeleton` binding. Task 3 reports the cased-binding count falling to 6.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Read what the four branches render, and do not trust this plan for it**

```bash
grep -n 'role=\|aria-hidden\|variant ===' frameworks/react/components/display/Skeleton.jsx
```

Expected: `circle` at ~line 27 with `aria-hidden="true"` and no role; a `role="status"
aria-label="Loading"` wrapper for the multi-line `text` stack at ~32; single elements carrying both
at ~39 and ~41. If any differs, STOP — the whole change is derived from this shape.

- [ ] **Step 3: Invert the failing hand test first**

In `placement-and-branches.test.jsx`, rewrite the test at line 77 to assert the role on **all four**
variants, and run it. It must FAIL on `circle` — that failure is the defect, stated as a test:

```jsx
test('Skeleton renders role=status in every variant, circle included', () => {
  const seen = {};
  for (const variant of VARIANTS) {
    const container = mount(<Skeleton variant={variant} />);
    seen[variant] = Boolean(container.querySelector('[role="status"]'));
    cleanup();
  }
  assert.deepEqual(seen, { block: true, line: true, text: true, circle: true });
});
```

Run: `bun run test:react-dom` → FAIL, `circle: false`.

- [ ] **Step 4: Make the circle announce**

In `Skeleton.jsx`'s `circle` branch, replace `aria-hidden="true"` with `role="status"` and
`aria-label="Loading"`. The two cannot coexist — `aria-hidden` removes the element from the
accessibility tree, so the role would never be exposed. Keep every style and class exactly as they
are; this batch changes what the element announces, not how it looks.

Run: `bun run test:react-dom` → the inverted test passes.

- [ ] **Step 5: Rewrite the second hand test, whose subject no longer exists**

The test at line 87 asserts the circle is `aria-hidden` with no live region. That is now false in
every clause. Replace it with the claim worth pinning after the change — that the circle carries
both the role and a non-empty name, so no variant is silent:

```jsx
test('Skeleton circle carries the role and a name, like its siblings', () => {
  const container = mount(<Skeleton variant="circle" />);
  const el = container.firstElementChild;
  assert.equal(el.getAttribute('role'), 'status');
  assert.equal(el.getAttribute('aria-label'), 'Loading');
  assert.equal(el.getAttribute('aria-hidden'), null);
});
```

Do not delete it. A role distribution across variants is not a requirement key, so no pattern can
ask for it and no evaluator can decide it — the rule this repo recorded for `tabs.test.jsx`'s
hand-resolution test and applied again to these two in 8C9.

- [ ] **Step 6: Flatten the binding**

`Skeleton.behaviour.json` becomes exactly:

```json
{
  "pattern": "status",
  "exceptions": []
}
```

The two cases, the `divergesFrom` and the `divergesFromReason` all go. The layers now agree, so
there is no divergence left to declare, and `crossLayerAgrees` compares two flat `status` bindings.

- [ ] **Step 7: Revert the compliance call**

Replace the `assertPatternCases` call at line 95 with an `assertPattern` call against the flat
binding, matching the shape the other components in that file use. The `behavioural` verdict for
`focus.unaffected` that the `placeholder` case carried is still owed — `status` requires it and it
is in the evaluator's `BEHAVIOURAL` set, so an undeclared key is reported rather than skipped.

- [ ] **Step 8: Run everything**

```bash
bun run test:react-dom      # 107 pass, 0 fail
bun run check:behaviour     # 21 pattern(s), all coherent
bun run check:compliance    # 15 of 70, unchanged
```

`check:compliance` must not move: `Skeleton:react` was already covered and stays covered.

- [ ] **Step 9: Prove the fix is what the suite now demands**

```bash
git add -A
sha256sum frameworks/react/components/display/Skeleton.jsx > "${CLAUDE_JOB_DIR:-/tmp}/8c10-skel.sha"
```

Put `aria-hidden="true"` back on the circle and remove its role and name. Then:

```bash
bun run test:react-dom
```

Expected: FAIL with `roles.element: OVERCLAIM` from the compliance suite — **not** a stale
exception. That distinction is the whole point: before this batch the identical broken render was
*correct* against a binding that excepted it. Report the message verbatim. Restore:

```bash
git checkout -- frameworks/react/components/display/Skeleton.jsx
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c10-skel.sha"   # OK
bun run test:react-dom                                  # 107 pass again
```

- [ ] **Step 10: Commit**

```bash
git commit -q -F - <<'MSG'
fix(a11y): the circle skeleton announces itself, like its three siblings

Every Arena skeleton exists to announce that it will be replaced by a functional
component when asynchronous data arrives. A skeleton that announces nothing is not
doing its job, whatever shape it is -- so `circle` rendering `aria-hidden="true"`
with no role was the defect, and Angular, which has announced every variant since
it was written, was already right.

React's own code agreed three times out of four: `block`, `line` and `text` all
announce unconditionally, so no noise-reduction strategy was ever applied across
this component. The circle branch was the odd one out rather than the deliberate
exception it read as.

With all four variants meeting `status` the binding goes back to flat and
`Skeleton` leaves the cased set. That is 8C9's mechanism working rather than a
retreat: splitting the variants into cases is what forced the cross-layer check to
compare a cased binding against a flat one, which is how this became visible at
all. Fixing the defect retires the need for the split at this component.

Both hand tests are rewritten rather than deleted -- a role distribution across
variants is not a requirement key, so no pattern can ask for it and no evaluator
can decide it. One inverts to all four variants; the other's subject disappeared
and is replaced by the claim worth pinning now.

Induced: with `aria-hidden` back and the role gone, the suite reports
`roles.element: OVERCLAIM` -- not a stale exception, because the flat binding
excepts nothing. Before this batch that identical broken render was correct
against a binding that excused it. Tree restored and verified with sha256sum -c.
MSG
```

---

## Task 2: Where a consumer will meet the repetition

**Files:**
- Modify: `frameworks/react/components/display/Skeleton.prompt.md`
- Modify: `frameworks/angular/primitives/skeleton/skeleton.prompt.md`

**Interfaces:**
- Consumes: Task 1's change — the guidance is only true once the circle announces.
- Produces: nothing consumed later.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Understand the shape you are documenting before you write about it**

```bash
sed -n '1,14p' frameworks/react/components/display/Skeleton.prompt.md
grep -n 'role="status"' frameworks/react/components/display/Skeleton.jsx
```

Two facts the guidance rests on, and both must be stated correctly or the advice is wrong:

- **A stack is already one announcement.** `variant="text"` with `lines > 1` wraps its rows in a
  single `role="status"`, and Angular's host does the same. The repetition this guidance is about
  is between **sibling `<Skeleton>` elements**, never within one.
- **N siblings are N announcements on purpose.** Each announces its own pending replacement, and
  twenty rows of avatar-plus-name really are forty pending replacements. The component does not
  deduplicate and this is not a bug to be worked around silently — it is a composition decision the
  consumer makes.

- [ ] **Step 3: Write the React guidance**

`Skeleton.prompt.md`'s second example is already the noisy shape — a flex row holding a circle
beside a text stack. Extend that example to show the wrap, and add a Do/Don't line. The wrap is a
single labelled live region around the set with the individual skeletons hidden from the
accessibility tree:

```jsx
<div role="status" aria-label="Loading profile">
  <div style={{display:'flex',gap:12}} aria-hidden="true">
    <Skeleton variant="circle" height="40px" />
    <Skeleton variant="text" lines={2} width="220px" />
  </div>
</div>
```

State plainly what it buys: one announcement instead of two, and a name that says *what* is loading
rather than only that something is. Add the Do/Don't line in the file's existing voice — a set of
skeletons standing for one block of content is announced once, by the consumer, because the
component cannot know where a set begins and ends.

- [ ] **Step 4: Write the Angular guidance**

The same approach in `skeleton.prompt.md`'s idiom, with an `<arena-skeleton>` example rather than a
JSX one. Match that file's existing prose style — it is denser and less list-driven than React's,
so do not paste React's Do/Don't format into it.

- [ ] **Step 5: Verify the examples are true**

Nothing machine-checks a `.prompt.md`, which is exactly why this step exists. Read each example back
against the component's real API: every prop you used must exist with the type you gave it, and the
`aria-hidden` wrapper must be on the element that actually contains the skeletons. If you are
unsure whether a prop exists, check `api/components/Skeleton.json`.

- [ ] **Step 6: Commit**

```bash
git commit -q -F - <<'MSG'
docs(skeleton): a set of skeletons is announced once, by whoever composes it

Now that every variant announces, a row of avatar-plus-name is two announcements
and a list of twenty rows is forty. That is deliberate -- each skeleton announces
its own pending replacement, and twenty rows really are forty pending replacements
-- so the component does not deduplicate and the consumer decides where a set
begins and ends.

Both layers already collapse a multi-line `text` stack into ONE region, so the
repetition is between sibling elements and never within one, and it is symmetric
across layers rather than a divergence.

The guidance goes in both prompts because that is where a consumer meets it.
It deliberately does NOT go in the contract: no contract in this repo carries
composition guidance, and adding the first is a change to the format, its reader
and `api/README.md`. The cost is recorded in the spec -- a third platform target
would not meet this warning.

React's existing second example was already the noisy shape, so it is the one that
grew the wrap.
MSG
```

---

## Task 3: Close-out

**Files:**
- Modify: `components-divergences.md`, `CLAUDE.md`,
  `docs/superpowers/specs/2026-07-26-exceptions-to-zero-index.md`

**Interfaces:**
- Consumes: everything.
- Produces: a green tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Close the `Skeleton` divergence**

`components-divergences.md`'s `Skeleton` entry currently reads *"Converges: undecided,
deliberately"*. It is now **closed**: the divergence is gone, not merely decided. Say which layer
was wrong, that the definition of what a skeleton is settled it without a judgement call, and that
React's own three-of-four behaviour was the evidence. Follow that file's own instructions for
retiring an entry rather than inventing a format — read its *How to add an entry* section first.

- [ ] **Step 3: Move the `Toast` entry from undecided to deferred**

The same file's `Toast` entry also says undecided. It is now **deferred to Plan D**, which is a
decision and must not read as resolution. What must be plain: Angular's `MatSnackBar` renders
`aria-live="polite"` and, outside Firefox, no role at all, so a critical error toast interrupts in
React and is queued in Angular; Plan D removes Material and would build an `arena-toast` on the CDK
born with the right role per tone; and **nothing is fixed for Angular users until then**.

- [ ] **Step 4: Correct the index's stale example**

`docs/superpowers/specs/2026-07-26-exceptions-to-zero-index.md:214` cites `Skeleton`'s `circle` as
the example of a case bound to `none` that verifies nothing. The warning stays true; the example
does not. `Tag`'s `plain` case is the surviving instance — verify that with
`grep -rn '"pattern": "none"' frameworks/react/components/display/Tag.behaviour.json` before citing
it.

- [ ] **Step 5: Sweep `CLAUDE.md`**

```bash
grep -n Skeleton CLAUDE.md
```

There are around twenty hits and they are not all alike. **Judge each**: some describe history and
stay true (the worked example of the wrapper hole 8C9 closed is about what happened, not about the
tree), some describe the tree and are now false (`Skeleton`'s `placeholder` as a live instance of
the one-render limit; `Skeleton`'s `circle` as a case bound to `none`; the list of converted
bindings; the text-scan entry citing `role="status"` in three of four variants; anything calling
`Skeleton` a variant-scoped exception).

Two disciplines, both of which this repo treats as hard rules: **a deletion that takes a still-true
fact out of the index is a defect**, and **a derived figure written as prose goes stale** — name a
command instead, run it first, and confirm it returns what you claim.

- [ ] **Step 6: Run the full sweep, once**

```bash
export CHROME_PATH=/usr/bin/chromium
ARENA_CHECK_STRICT=1 bun run check
```

Expected: `check-all: all 23 step(s) passed`. If any step fails, STOP and report BLOCKED with the
failing step's output — never fix a gate to make it agree.

- [ ] **Step 7: Confirm the batch's own claims**

```bash
bun run check:compliance                                          # 15 of 70, unchanged
bun run check:behaviour                                           # 21 pattern(s), unchanged
grep -rl '"cases"' --include='*.behaviour.json' frameworks/ | wc -l   # 6, down from 7
grep -rl divergesFrom frameworks/ | wc -l                         # 1, down from 2 — Toast alone
```

- [ ] **Step 8: Commit**

```bash
git commit -q -F - <<'MSG'
docs: close out 8C10 -- one divergence gone, one deferred

`components-divergences.md`'s `Skeleton` entry is closed rather than decided: the
divergence no longer exists. React was wrong, and what settled it was not a
judgement about noise versus silence but a statement of what a skeleton is for --
from which the variant's behaviour follows.

Its `Toast` entry moves from undecided to deferred to Plan D, and says plainly
that nothing is fixed for Angular users until then. A deferral is a decision, not
a resolution, and the entry must not read as one.

`CLAUDE.md` carried several statements about `Skeleton` that this batch falsified,
scattered rather than in one entry, and each was judged separately -- some describe
history and stay true, some described a tree that has moved. The `exceptions: []`
index cited `Skeleton`'s `circle` as its example of a case bound to `none`; the
warning stays and `Tag`'s `plain` replaces the example.

`Skeleton` leaves the cased set (7 -> 6) and `divergesFrom` falls to its single
remaining user.

Full `bun run check` run once, at close-out, per the rule that the sweep is a
completion gate rather than a per-commit toll.
MSG
```

---

## Self-review

**Spec coverage.** §1 (the circle announces) → Task 1 Steps 3-5. §2 (the binding goes flat, and why
that is the mechanism working) → Task 1 Steps 6-7, with the reasoning in the commit message so it
survives the plan's deletion. §3 (two hand tests rewritten, not deleted) → Task 1 Steps 3 and 5,
with the rule stated in place. §4 (N siblings, N announcements; guidance in both prompts; the
contract deliberately untouched) → Task 2, and Global Constraint 7. §5 (both divergence records
move) → Task 3 Steps 2-3. *Verification* → Task 1 Step 9's induction, which is the one the spec
names. *Blast radius*'s warning about scattered `CLAUDE.md` statements → Task 3 Step 5. *Out of
scope*'s index line → Task 3 Step 4.

**One thing the plan deliberately does not give the implementer.** Task 3 Step 5 does not list which
`CLAUDE.md` hits to change. It names the two disciplines and tells them to judge each, because there
are around twenty and a list written here would be the plan asserting a verdict it has not verified
— the same reason Task 7 of 8C9 withheld `CalendarEvent`'s three shapes. The command is given; the
judgement is the work.

**Type consistency.** No new function, type or signature is introduced anywhere in this batch. The
binding shape after Task 1 is the flat `{pattern, exceptions}` that `bindingCases()` has always
normalised to one anonymous case, so nothing downstream changes behaviour.
