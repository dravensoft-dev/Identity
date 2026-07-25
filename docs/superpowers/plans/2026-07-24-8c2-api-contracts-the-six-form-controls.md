# Plan 8C2 — API capability contracts, the six form controls

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `RadioGroup`, `Radio`, `Checkbox`, `Textarea`, `Select` and `Input` under the API
capability contract, taking `check:api` from 26 contracts / 46 layer implementations to **32 / 52**,
and add a **ninth vocabulary form, `functionInput`**, for the one member shape a data-entry control
legitimately needs and no other form can express.

**Architecture:** Plan C's second batch — the form controls. Every contract is **single-layer**
(Angular delegates all six to Material), so `check:api` climbs +1 contract / +1 layer per component.
The batch opens the same way 8C1 did: a cross-cutting audit (Task 1) settles what the six share, and
a structural task (Task 1b) lands the ninth form before any component declares it. The six then
migrate in rising order of decision-weight — `RadioGroup`+`Radio`, `Checkbox`, `Textarea`, `Select`,
and `Input` last, because `Input` alone carries `functionInput`, an `InputType` enum, an icon and a
prefix. `Radio.d.ts` today declares **two** components in one file; Task 2 splits it into two
quartets so the gate can resolve `RadioGroup` by its own name.

**Tech Stack:** Bun (build, test, gates), plain-node-portable `scripts/`, React 18 with inline
token-valued styles and no CSS classes. Angular 22 is untouched except regenerated output.

**Spec:** `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` — *Plan C*. **Normative
vocabulary:** `api/README.md` (eight forms today; this plan adds the ninth).

**Branch:** `api-contracts-8c2`, cut from `main` at `73cb21a` (the 8C1 merge). Tree clean, no commits
of its own at plan time.

---

## What this plan measured

Every figure was measured against `HEAD` (`73cb21a`) on 2026-07-24 while writing this plan.

- **`check:api` reads `26 contract(s) hold across 46 layer implementation(s)`.** Confirmed.
- **The six subjects, probed through `reactSurface()`:** `Input` **throws** (`validate` is an inbound
  function returning `string | null | undefined`); `Select`, `Checkbox`, `Textarea` carry a heritage
  clause (`Select` `SelectHTMLAttributes`, `Checkbox`/`Textarea` `Omit<…>`); `Radio` (i.e.
  `RadioProps`) reads cleanly with only `style` as its R4 escape; `RadioGroup` **has no `.d.ts` the
  gate can find** — `RadioGroupProps` lives inside `Radio.d.ts`.
- **`Radio.d.ts` declares two components, `Radio.jsx` implements two.** `RadioGroup` distributes state
  to its children by `React.cloneElement`, injecting `name`/`checked`/`onSelect` — none of which is in
  `RadioProps`, so the injected plumbing is already correctly outside the public surface.
- **Every control's `onChange` is a heritage-inherited DOM handler**, invisible to the reader because
  it lives in the heritage clause, not the interface body. `Checkbox.jsx` destructures `onChange`;
  `Select.jsx`, `Textarea.jsx`, `Input.jsx` the same.
- **`Input.prefix`'s only call site passes a string** (`prefix="git@"` in `forms.card.entry.jsx`),
  not a node.
- **Call sites are few:** `Input` 3 files (`LoginScreen`, `unauth-card.card.entry`,
  `forms.card.entry`), `Select`/`Checkbox` 1 each (`forms.card.entry`), `Textarea`/`Radio`/
  `RadioGroup` 1 each (`radio-textarea.card.entry`).
- **`.superpowers/` carries 8C1's ledger** (`progress.md`), which Task 0 archives.
- **The merged-process baseline is 991 tests across 89 files; the isolated DOM process is 26 across
  5.** Measured by running both.

---

## Global Constraints

Every task's requirements implicitly include this section. 1–24 are 8C1's, carried forward in
substance; 25–29 are new to this plan.

1. **English only.** All code, comments, docs, contract `description`s and UI copy in the repo are
   English. Conversation with the maintainer is Spanish; the repo is not.
2. **Task 1 is a single blocking audit and it STOPS.** It presents the shared decisions with their
   costs; the decision is the maintainer's. Tasks 2–6 each open with a per-component confirmation that
   also blocks but must not re-litigate a Task 1 decision.
3. **`check:api` climbs and never drops:** 26/46 → (Task 1b: 26/46, contracts nothing) → **28/48**
   (Task 2, +2: RadioGroup and Radio) → **29/49** (Task 3) → **30/50** (Task 4) → **31/51** (Task 5)
   → **32/52** (Task 6). Every step is +1 contract / +1 layer, except Task 2 which is +2/+2 (two
   components). Record the measured pair in `.superpowers/sdd/progress.md` at the end of every task.
4. **`check:api` carries no exception map.** An API divergence is a defect.
5. **`api/README.md` is the normative vocabulary and this plan extends it (the ninth form), never
   contradicts it.** Task 1b writes the ninth form into it and into `CLAUDE.md` and the spec.
6. **The other two contracts are firm** (`api/README.md`). Bringing a component under contract may not
   weaken, remove or contradict its behaviour binding or the tokens it renders from. Verify per task
   with `git diff --stat -- '*.behaviour.json'` — **empty**.
7. **The binding table is mechanical** (`api/README.md`, `bindingName()` in `scripts/check-api.mjs`):
   a primitive/enum/object/array member `x` is a React prop `x`; the slot named `content` is React's
   `children`; a slot named `x` is a node-valued prop `x`; an event named `x` is a function prop
   `onX`.
8. **Required-ness is contracted** for the four inbound non-slot forms, and governs runtime: a
   required member fails hard when absent. Established idiom is
   `frameworks/react/components/feedback/EmptyState.jsx:4` — `if (!x) throw new Error('C: \`x\` is required');`.
9. **`react/.d.ts` re-export rule.** A migrated `.d.ts` re-exports **exactly** the named types the
   pre-migration file declared and exported locally — no more, no less. `SelectOption` is a named
   exported type and keeps a re-export; verify each file rather than trusting this sentence.
10. **A contract type is imported with `import type`**, specifier `'../../api.generated'` from
    `frameworks/react/components/<group>/`.
11. **Any `.jsx`/`.entry.jsx` edit is followed by `bun run build:demos`, and the regenerated `.js`
    sibling is committed in the same commit.** Verified with `bun run check:demos`. `build:demos`
    covers `frameworks/react/ui_kits/console/` too, and the Console uses `Input`.
12. **`bun run check` runs exactly ONCE**, in Task 8. Individual gates run per task.
13. **Do not merge and do not push.** The branch stays local until the maintainer asks.
14. **`export CHROME_PATH=/usr/bin/chromium` before `bun run check`.** Without it `check:cards` SKIPs
    and the run reports INCOMPLETE, which reads as a failure of the change and is not.
15. **Test the layer you changed.** None of the six has a React suite today except through the demos;
    each migration writes one under `frameworks/react/test/`.
16. **A task that removes an R4 escape ships a test proving the escape is gone, and it must
    DISCRIMINATE.** `check:api` reads the `.d.ts` and never opens the `.jsx`, so a test is the only
    regression guard. Every one of the six carries `{...rest}` in its `.jsx` and `style` (via heritage
    or its own body), so the two-assertion test applies to all six.
17. **The R4 non-vacuity proof needs TWO SEPARATE RUNS, induced asymmetrically:** (1) `style`
    destructured AND merged into the root style object, no `{...rest}` → the STYLE assertion fails;
    (2) `style` destructured and NOT merged, `{...rest}` spread on the root → the ATTRIBUTE assertion
    fails. `sha256sum` before, byte-identical after. Assert on `color` (not in `check:dimensions`'
    PROPS set) and on attribute names, never on a length — that gate walks test directories too.
18. **A test title states exactly what the body asserts, and the plan's worked test code is a starting
    point, not a verified artifact.** Run it; if it does not discriminate, fix the test, not the title.
19. **`README.md` is the normative design specification and moves in the same change as the
    component.** Find its prose with `grep -n '<Component>' README.md` and report the check either way.
20. **A member `description` lives in the contract only.** Restate it in the `.d.ts` JSDoc and the
    `.prompt.md`; nothing holds the three in step, so do not leave a layer's prose describing a
    removed member.
21. **A citation sweep uses a broad `--include`, not `.ts`/`.html` alone.** When a member changes,
    sweep with all of `--include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx'
    --include='*.json' --include='*.md' --include='*.html'` and read every hit.
22. **Do not write a derived figure into a normative document.** Counts belong in this plan and the
    ledger; `CLAUDE.md` and the spec get the *method of measuring*.
23. **Budget the final whole-branch review as real work.** It catches comparisons BETWEEN tasks that
    no per-task review can. This batch's specific cross-task risk: six controls each independently
    decide how `onChange` reshapes, how a label renders, and which native attributes survive.
24. **No Angular component work exists in this plan.** The only Angular file that changes is the
    generated `frameworks/angular/api.generated.ts`. `check:angular` still runs per task, because
    `frameworks/angular/index.ts` re-exports `api.generated.ts` into `ngc`'s program.
25. **A commit message containing a backtick is written with a quoted here-doc, never
    `git commit -m "…"`.** A backtick in a double-quoted shell string opens command substitution and
    is silently spliced away. Use `git commit -q -F - <<'MSG' … MSG`, verify `git log -1 --format=%B`.
26. **A task opens by checking the tree is clean** (`git status --short`) and folds in what it finds
    rather than redoing it, verifying leftovers against the plan's steps first.
27. **Line numbers in this plan are not load-bearing** — the quoted code identifies the site.
    Re-measure before trusting a line number or a `sed -n` range.
28. **The native `onChange` becomes an event carrying the VALUE, never the DOM event** (Task 1,
    decision DA). `Breadcrumbs` settled this: a platform event type is an R4 violation inside a
    payload, so `change` carries `string` (Input/Select/Textarea/RadioGroup) or `boolean` (Checkbox),
    and `React.ChangeEvent` does not travel. Every call site reading `e.target.value` is rewritten to
    take the value directly. `blur` on `Input` is the same shape and carries the value too.
29. **`functionInput` is legitimate ONLY in a contract that declares itself an input control**
    (Task 1b). The contract carries `"kind": "input"` at top level, and `check:api` **fails** a
    `functionInput` member in a contract without it. This is a mechanical guard, not prose — the gate
    enforces the restriction the maintainer set. Of this batch, only `Input` carries `kind: "input"`
    and only `Input.validate` is a `functionInput`.

---

## The ninth form, stated once

`functionInput` — **the consumer hands the component a function it calls on its value and whose
result it uses.** It is the ninth form because a data-entry control genuinely needs it and no other
form expresses it: an `event` is outbound and returns nothing; a formatter or a validator is inbound
and returns a value. The layer refused this shape everywhere until now (the charts' `valueFormatter`
became `valueSuffix`, and Task 1b's own comment says an inbound function that returns a value is none
of the eight forms). **This plan reverses that refusal for data-entry controls only**, deliberately
and on the maintainer's decision, because forcing every future input (`NumberField`, `Combobox`,
`PasswordField`) to re-derive whether its inbound function is an event, a datum, or deleted is work
the vocabulary should absorb once.

Two mechanical guards keep it narrow, both enforced by `check:api`:

- **It is legal only in a contract declaring `"kind": "input"`.** A `functionInput` member anywhere
  else fails the gate. The restriction the maintainer set — "input controls only" — is thereby
  checkable, not a prose convention like R2/R3.
- **Its signature is modelled, not free TypeScript.** A `functionInput` declares `params` (a map of
  name → type name) and `returns` (a type name), each a primitive or an Arena enum. R4 holds inside
  it: no `React.*` type in a parameter or the return. The reader classifies the arrow by reading its
  parameter and return types against the same rules it applies to a slot's params, rather than
  throwing.

Contract shape:

```json
"validate": {
  "form": "functionInput",
  "params": { "value": "string" },
  "returns": "string",
  "description": "Called on the field's value; returns the error message, or empty for valid."
}
```

The reader reduces a `string | null | undefined` return to `string` (the message, or none). Angular's
implementation of a `functionInput` is Plan D's problem and is recorded as debt there: Angular's
signal idiom discourages a function input, and the contract's modelled signature is what Plan D must
satisfy.

---

## File Structure

Created by this plan:

| Path | Responsibility |
|---|---|
| `api/types/input-type.json` | `InputType` enum — the 10 native types Arena supports |
| `api/types/validate-on.json` | `ValidateOn` enum — `blur`/`change` |
| `api/types/select-option.json` | `SelectOption` object — `{ value, label }` |
| `api/components/RadioGroup.json` | Task 2 |
| `api/components/Radio.json` | Task 2 |
| `api/components/Checkbox.json` | Task 3 |
| `api/components/Textarea.json` | Task 4 |
| `api/components/Select.json` | Task 5 |
| `api/components/Input.json` | Task 6 |
| `frameworks/react/components/forms/RadioGroup.jsx` `.d.ts` `.prompt.md` | Task 2's quartet split from Radio |
| `frameworks/react/test/radio.test.jsx` `checkbox.test.jsx` `textarea.test.jsx` `select.test.jsx` `input.test.jsx` | render proofs |

Modified structurally by Task 1b: `scripts/lib/api-surface.mjs`, `scripts/api-surface.test.mjs`,
`scripts/check-api.mjs`, `scripts/check-api.test.mjs`, `api/README.md`, `CLAUDE.md`, the spec.

Regenerated (guarded by `check:api`/`check:demos`): `frameworks/react/api.generated.d.ts`,
`frameworks/angular/api.generated.ts`, the `.js` sibling of every `.jsx` touched.

Modified in Task 7: `components-divergences.md` (read first; likely unchanged).
Modified in Task 8: the spec, `CHANGELOG.md`, `CLAUDE.md`. **Deleted in Task 8:**
`docs/superpowers/plans/2026-07-24-8c1-api-contracts-the-five-composed-primitives.md`.

---

## Task 0: Pre-flight

**Files:** archive `.superpowers/sdd/progress.md` → `progress-8c1-archived.md`; create a fresh
`progress.md`.

> `.superpowers/` is git-ignored (`.gitignore:37`). Use plain `mv`, not `git mv`; this task produces
> **no commit**.

- [ ] **Step 1: Archive 8C1's ledger**

```bash
cd /home/juan/Dravensoft/Identity
mv .superpowers/sdd/progress.md .superpowers/sdd/progress-8c1-archived.md
wc -l .superpowers/sdd/progress-8c1-archived.md
test ! -e .superpowers/sdd/progress.md && echo "cleared, ready for the C2 ledger"
```

- [ ] **Step 2: Open the C2 ledger**

Create `.superpowers/sdd/progress.md`:

```markdown
# Plan 8C2 — API capability contracts, the six form controls

Plan: docs/superpowers/plans/2026-07-24-8c2-api-contracts-the-six-form-controls.md
Branch: api-contracts-8c2
Base commit before Task 1: 73cb21a (main; the 8C1 merge)
(8C1's ledger is archived beside this one as progress-8c1-archived.md.)

Subjects: RadioGroup, Radio, Checkbox, Textarea, Select, Input — Plan C's second batch, the form
controls. Every contract is SINGLE-LAYER. check:api climbs 26/46 -> 32/52.

Task 1b adds a NINTH form, functionInput, for data-entry controls only, enforced by a "kind": "input"
mark. It contracts nothing and holds check:api at 26/46.

Task 2 is +2/+2 (RadioGroup and Radio, from one split quartet). All others +1/+1.

## Pre-flight

(fill from Step 3)

## Progress

## Maintainer decisions taken
```

- [ ] **Step 3: Measure the baseline and stop**

```bash
cd /home/juan/Dravensoft/Identity
git status --short
git log --oneline -1
bun run check:api
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun test frameworks/react/test-dom 2>&1 | tail -3
```

Expected: clean at `73cb21a`; `check-api: 26 … across 46`; 991/89 merged; 26/5 isolated. **If
`check:api` is not 26/46, stop and report.** Fill the ledger's Pre-flight section. No commit.

---

## Task 1: The cross-cutting blocking audit

**Files:** none — writes only the ledger's `## Maintainer decisions taken`. Later, Task 1b writes the
durable decisions into `api/README.md`.

**Interfaces:** produces decisions DA–DF that Tasks 1b–6 implement without re-opening.

- [ ] **Step 1: Re-measure the six surfaces at HEAD**

```bash
cd /home/juan/Dravensoft/Identity
for f in Input Select Checkbox Textarea Radio; do
  echo "──── $f.d.ts ────"; cat "frameworks/react/components/forms/$f.d.ts"
  echo "──── $f.jsx signature ────"; grep -n "export function" "frameworks/react/components/forms/$f.jsx"
done
```

Confirm against the plan's *What this plan measured*. Any deviation is the audit's finding.

- [ ] **Step 2: Probe the reader**

```bash
cd /home/juan/Dravensoft/Identity
cat > /tmp/probe-c2.mjs <<'EOF'
import { readFileSync } from 'node:fs';
import { reactSurface } from '/home/juan/Dravensoft/Identity/scripts/lib/api-surface.mjs';
for (const [n, sym] of [['Input','InputProps'],['Select','SelectProps'],['Checkbox','CheckboxProps'],['Textarea','TextareaProps'],['Radio','RadioProps'],['Radio','RadioGroupProps']]) {
  const src = readFileSync(`/home/juan/Dravensoft/Identity/frameworks/react/components/forms/${n}.d.ts`,'utf8');
  try { console.log(sym, JSON.stringify(reactSurface(src, sym))); }
  catch (e) { console.log(sym, 'THREW', e.name+':', e.message); }
}
EOF
bun /tmp/probe-c2.mjs; rm /tmp/probe-c2.mjs
```

Expected: `InputProps` throws on `validate`; `Select`/`Checkbox`/`Textarea` report heritage;
`RadioProps` reads clean with a `style` platform member; `RadioGroupProps` reads clean (both are in
`Radio.d.ts`). Record what it actually prints.

- [ ] **Step 3: Present DA–DF and STOP**

Present, in one message, the six decisions with their costs. All six were taken with the maintainer
during this plan's design session and are recorded below; Task 1's job is to confirm them against the
re-measured tree.

- **DA — the native `onChange` becomes an event carrying the VALUE.** `Breadcrumbs`' rule: the DOM
  event is a platform type (R4) and does not travel. `change` carries `string` for Input, Select,
  Textarea and RadioGroup; `boolean` for Checkbox. `Input.blur` likewise carries the value. Every
  call site reading `e.target.value` is rewritten to take the value. Cost: a consumer loses the raw
  `ChangeEvent` (and `preventDefault`), reachable before only through the heritage clause.
- **DB — heritage flattens to the element-specific set** (D1, settled in 8C1's `api/README.md`).
  `Input`: `value disabled readOnly placeholder name autoComplete min max step maxLength pattern`
  (plus `type`, its own decision DE, and `required` already in the body). `Select`: `value disabled
  required name multiple`. `Checkbox`: `disabled required name value`. `Textarea`: `value disabled
  readOnly placeholder name maxLength rows`. Global attributes (`id`, `className`, `dir`, `tabIndex`,
  ARIA, data-*) are **not** members. **`id` is the sharp edge:** Input and Textarea generate an `id`
  from the label to wire `htmlFor`; the component keeps generating it, and a consumer wanting an
  explicit `id` loses that path (it was in the heritage). Recorded as the batch's one D1 cost.
- **DC — `functionInput`, the ninth form, for `Input.validate`.** Implemented in Task 1b. `Input`
  declares `"kind": "input"`; `validate` is `{ form: functionInput, params: {value: string}, returns:
  string }`; `validateOn` stays an enum. Input keeps its internal validation engine whole.
- **DD — `Select.options` becomes an array of `SelectOption`** (D4, settled in 8C1). The bare-string
  convenience form leaves; a call site passing strings rewrites to `{value, label}`.
- **DE — `Input.type` becomes the `InputType` enum:** `text email password search tel url number date
  time datetime-local`. `checkbox`/`radio` are their own components; `file`/`range`/`color`/`hidden`/
  `submit` are out. `Input.icon` becomes a Phosphor `string` (D2); `Input.prefix` becomes a `string`
  Arena draws (R2 — its only call site passes `"git@"`); `Input.className` leaves as a style escape
  (the component keeps its internal `arena-input` class; `className` is not a member).
- **DF — `RadioGroup` and `Radio` are two contracts, split into two quartets** (Task 2). The plumbing
  `RadioGroup` injects (`name`/`checked`/`onSelect`) is not public API and is in neither contract.

- [ ] **Step 4: Record and stop.** Write `## Maintainer decisions taken` with DA–DF. No commit.

---

## Task 1b: the ninth form, functionInput

**Files:**
- Modify: `scripts/lib/api-surface.mjs`, `scripts/api-surface.test.mjs`, `scripts/check-api.mjs`,
  `scripts/check-api.test.mjs`, `api/README.md`, `CLAUDE.md`, the spec.

**Interfaces:** produces the form `functionInput`, readable by `reactSurface()` and accepted by
`check:api` only in a `"kind": "input"` contract. **Contracts nothing** — `check:api` stays at 26/46.

> The reader today throws on `(value: string) => string` (`classify()`'s arrow branch, ~line 126:
> `if (returns !== 'void') throw`). This task makes it classify that shape as `functionInput` while
> keeping the throw for a shape it genuinely cannot model (a platform return, an unreadable payload).

- [ ] **Step 1: Write the failing reader tests**

Append to `scripts/api-surface.test.mjs`:

```js
/* The ninth form. A data-entry control's inbound function -- validate, parse,
 * format -- returns a value, so it is neither an event (outbound, void) nor a
 * datum. The layer refused it everywhere until this form; it is legal only in
 * an input control, which check-api enforces, not classify. The signature is
 * modelled: params and return are type names, R4 holds inside. */
test('classify reads an inbound function that returns a value as a functionInput', () => {
  assert.deepEqual(classify('(value: string) => string'),
    { form: 'functionInput', params: { value: 'string' }, returns: 'string' });
});

test('classify reduces a nullable return to the non-null type', () => {
  assert.deepEqual(classify('(value: string) => string | null | undefined'),
    { form: 'functionInput', params: { value: 'string' }, returns: 'string' });
});

/* R4 holds inside the signature: a platform return is still a violation, so it
 * surfaces as platform rather than being smuggled in as a functionInput. */
test('classify refuses a functionInput whose return is a platform type', () => {
  const out = classify('(value: string) => React.ReactNode');
  assert.equal(out.form, 'platform');
});

/* A void arrow is still an event -- the ninth form did not change that half. */
test('a void arrow is still an event, not a functionInput', () => {
  assert.deepEqual(classify('(v: string) => void'), { form: 'event', payload: 'string' });
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs
```

Expected: the first two FAIL with `UnrecognisedShape: an inbound function that returns …`; the third
and fourth PASS (they pin behaviour that must survive). **You will also see the OLD test
`an inbound function that RETURNS a value is refused` now contradicts the new rule** — it is at
`scripts/api-surface.test.mjs` (search `is refused`). Rewrite it to assert the classification, not the
throw, in this task; its comment about `valueFormatter` becomes a note that the refusal held until the
ninth form and now holds only outside an input control (which the gate enforces).

- [ ] **Step 3: Make the reader classify functionInput**

In `scripts/lib/api-surface.mjs`, in `classify()`'s arrow branch (the `if (returns !== 'void')`
block), replace the unconditional throw with classification:

```js
    const returns = arrow[2].trim();
    if (returns !== 'void') {
      /* The ninth form. An inbound function that returns a value is a
       * functionInput -- legal only in an input control, which check-api
       * enforces via the contract's "kind": "input"; classify() only reads the
       * shape. The return is reduced to its non-null member and classified so
       * R4 still catches a platform return; the params are classified the same
       * way a slot's params are. A shape that cannot be modelled (a platform
       * return, an unreadable param) surfaces as that, not as a functionInput. */
      const nonNull = returns.split('|').map((s) => s.trim()).filter((s) => s !== 'null' && s !== 'undefined');
      const retType = nonNull.length === 1 ? classify(nonNull[0]) : { form: 'union' };
      if (retType.form === 'platform') return retType;
      if (retType.form !== 'primitive' && retType.form !== 'named' && retType.form !== 'enum') {
        throw new UnrecognisedShape(`a functionInput return must be a primitive, enum or named type: ${ts}`);
      }
      const params = {};
      for (const part of arrow[1].split(',').map((s) => s.trim()).filter(Boolean)) {
        const colon = part.indexOf(':');
        if (colon === -1) throw new UnrecognisedShape(`functionInput parameter has no type: ${ts}`);
        const pType = classify(part.slice(colon + 1));
        if (pType.form === 'platform') return pType;
        params[part.slice(0, colon).trim()] = pType.type ?? (pType.values ? part.slice(colon + 1).trim() : pType.form);
      }
      return { form: 'functionInput', params, returns: retType.type ?? nonNull[0].trim() };
    }
```

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs
```

Expected: all PASS. **This worked block is a starting point (Constraint 18)** — run it, and if the
`params`/`returns` shape does not come out as the tests expect, fix the code to match the tests'
declared contract, not the tests to match the code.

- [ ] **Step 4: Write the failing gate tests**

Append to `scripts/check-api.test.mjs`:

```js
/* functionInput is legal only in a contract that declares itself an input
 * control. The mark is checkable, so "input controls only" is enforced rather
 * than merely written down -- the maintainer's decision, made mechanical. */
test('validateContract accepts a functionInput in a kind:input contract', () => {
  const problems = validateContract(
    { component: 'Input', kind: 'input',
      api: { validate: { form: 'functionInput', params: { value: 'string' }, returns: 'string' } } },
    new Map(),
  );
  assert.deepEqual(problems, []);
});

test('validateContract rejects a functionInput outside a kind:input contract', () => {
  const problems = validateContract(
    { component: 'X',
      api: { fmt: { form: 'functionInput', params: { value: 'number' }, returns: 'string' } } },
    new Map(),
  );
  assert.ok(problems.some((p) => /fmt/.test(p) && /kind.*input/i.test(p)));
});

/* R4 inside the signature: a param or return naming a type api/types/ does not
 * declare is reported, exactly as an object member's enum type is. */
test('validateContract checks a functionInput signature type against api/types', () => {
  const problems = validateContract(
    { component: 'Input', kind: 'input',
      api: { validate: { form: 'functionInput', params: { value: 'Nope' }, returns: 'string' } } },
    new Map(),
  );
  assert.ok(problems.some((p) => /Nope/.test(p)));
});
```

- [ ] **Step 5: Run them, then implement the gate rule**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/check-api.test.mjs
```

Expected: all three FAIL — `FORMS` lacks `functionInput`, and no rule reads `kind`.

Then in `scripts/check-api.mjs`:

- add `'functionInput'` to `FORMS`;
- in `validateContract`, for a `spec.form === 'functionInput'` member: if `contract.kind !== 'input'`,
  push ``${where}.${member}: a functionInput is legal only in a contract with "kind": "input" — the
  ninth form is for data-entry controls (api/README.md)``; and for each `type` in
  `Object.values(spec.params ?? {})` plus `spec.returns`, skip a primitive, else require it in
  `typeNames` (report `slot parameter`-style when absent);
- update the `form "${spec.form}" is none of the eight` message to `nine`;
- **the surface comparison must classify the same member identically in both layers** — `bindingName`
  for a `functionInput` is a React prop of the same name (like a primitive), so no binding-table row
  changes; verify `compareSurface` treats `functionInput` like the other inbound non-slot forms for
  presence and required-ness (add it to that branch alongside `primitive|enum|object|array`).

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/check-api.test.mjs
bun test scripts/
```

Expected: all PASS; no earlier script test regresses.

- [ ] **Step 6: Update `api/README.md`**

Add the ninth form to the vocabulary table (**consumer data → functionInput → slot → event**; heading
and the "one of eight" sentence become nine). Add the "ninth form, stated once" content from this
plan: what it is, that it is legal only in a `kind: "input"` contract (the gate enforces it), the
modelled signature, and that it **deliberately reverses** the earlier refusal for data-entry controls
only, with the Plan D debt noted. In the "What the gate asserts" section, record that the
`kind: "input"` guard and the signature-type check are mechanical, and that R4 holds inside the
signature.

- [ ] **Step 7: Update `CLAUDE.md` and the spec**

Both name the form count. Change eight → nine and add one clause on what `functionInput` is for and
its `kind: "input"` guard. Sweep `grep -rn "eight forms" --include='*.md' . | grep -v node_modules`
and fix each shipping-doc hit (a `[Unreleased]` CHANGELOG line is Task 8's).

- [ ] **Step 8: Gates and commit**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun test scripts/
git add -A
git commit -q -F - <<'MSG'
feat(api)!: a ninth form -- functionInput, for data-entry controls

The consumer hands the component a function it calls on its value and whose
result it uses -- a validator, a parser. It is neither an event (outbound,
void) nor a datum, and the layer refused it everywhere until now: the charts'
valueFormatter became valueSuffix for exactly this reason. This reverses that
refusal for data-entry controls ONLY, on the maintainer's decision, so every
future input need not re-derive whether its inbound function is an event, a
datum, or deleted.

Two mechanical guards keep it narrow. It is legal only in a contract declaring
"kind": "input" -- check:api fails it anywhere else, so the restriction is
enforced, not prose. And its signature is modelled: params and return are type
names, primitives or Arena enums, with R4 holding inside -- no platform type in
a parameter or the return. The reader stops throwing on an inbound function
that returns a value and classifies it; a shape it cannot model still throws.

Contracts nothing; check:api stays at 26/46. Angular's implementation of a
functionInput is Plan D's, and the modelled signature is what it must satisfy.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

Append `## Task 1b: complete` to the ledger. Report and stop.

---

## Task 2: RadioGroup + Radio

**Files:**
- Create: `api/components/RadioGroup.json`, `api/components/Radio.json`,
  `frameworks/react/components/forms/RadioGroup.jsx` `.d.ts` `.prompt.md`,
  `frameworks/react/test/radio.test.jsx`
- Modify: `frameworks/react/components/forms/Radio.jsx` `.d.ts` `.prompt.md` (drop the RadioGroup half),
  `frameworks/react/components/forms/radio-textarea.card.entry.jsx`
- Regenerate: the `.js` siblings

**Interfaces:** consumes Task 1's DA and DF. Produces two contracts, +2/+2.

> `Radio.jsx` and `Radio.d.ts` each hold both components today. The gate resolves a component by
> `<Name>.d.ts`, so `RadioGroup` needs its own files. Split the quartet: move `RadioGroup` (function,
> interface, prompt) into `RadioGroup.*`, leave `Radio` in `Radio.*`. The demo imports both from
> `Radio.jsx` today; repoint the `RadioGroup` import to `RadioGroup.jsx`.

- [ ] **Step 1: Confirm and STOP.** Report the split plan, both contracts member-by-member, and that
  `Radio`'s injected `name`/`checked`/`onSelect` are not in `RadioProps` and go in neither contract.
  Blocks; must not re-open DA/DF.

- [ ] **Step 2: Write the two contracts**

`api/components/RadioGroup.json`:

```json
{
  "component": "RadioGroup",
  "description": "Single-selection group. Governs the value and distributes it to its child Radios.",
  "api": {
    "content": { "form": "slot", "description": "The Radios. RadioGroup injects each one's selected state." },
    "value": { "form": "primitive", "type": "string", "description": "The selected option's value." },
    "name": { "form": "primitive", "type": "string", "description": "Shared name for the underlying radios; generated when omitted." },
    "change": { "form": "event", "payload": "string", "description": "A different option was chosen; carries its value." }
  }
}
```

`api/components/Radio.json`:

```json
{
  "component": "Radio",
  "description": "One option inside a RadioGroup. Selected shows a crimson dot inside the ring.",
  "api": {
    "value": { "form": "primitive", "type": "string", "required": true, "description": "This option's value, matched against the group's." },
    "label": { "form": "primitive", "type": "string", "description": "The option's label." },
    "hint": { "form": "primitive", "type": "string", "description": "A line of help under the label." },
    "disabled": { "form": "primitive", "type": "boolean", "default": false, "description": "Blocks selection and dims the option." }
  }
}
```

- [ ] **Step 3: Split the quartet**

Create `frameworks/react/components/forms/RadioGroup.d.ts`:

```ts
import * as React from 'react';
/** Single-selection group. Governs the value and distributes it to child Radios. */
export interface RadioGroupProps {
  /** The Radios. */
  children?: React.ReactNode;
  /** The selected option's value. */
  value?: string;
  /** Shared name for the underlying radios; generated when omitted. */
  name?: string;
  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}
export function RadioGroup(props: RadioGroupProps): JSX.Element;
```

Create `frameworks/react/components/forms/RadioGroup.jsx` by moving the `RadioGroup` function out of
`Radio.jsx` verbatim, dropping `style` and `...rest` from its signature and root `<div>` (R4):

```jsx
import React from 'react';
/** Single-selection group. `RadioGroup` governs the value; each `Radio` is an option. */
export function RadioGroup({ value, onChange, name, children }) {
  const gname = name || 'rg-' + Math.random().toString(36).slice(2, 7);
  const items = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { name: gname, checked: child.props.value === value, onSelect: onChange })
      : child);
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 3)' }}>
      {items}
    </div>
  );
}
```

Rewrite `frameworks/react/components/forms/Radio.d.ts` to hold only `Radio`:

```ts
/** One option inside a RadioGroup. Selected = crimson dot inside the ring. */
export interface RadioProps {
  /** This option's value, matched against the group's. */
  value: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}
export function Radio(props: RadioProps): JSX.Element;
```

(No React import — `RadioProps` declares no node. This matches the slotless idiom.)

In `frameworks/react/components/forms/Radio.jsx`, delete the `RadioGroup` function, and drop
`style`/`...rest` from `Radio`'s signature and its `<label>`/`<input>`. The injected `name`, `checked`,
`onSelect` STAY in the signature — they are how `RadioGroup` drives it:

```jsx
import React from 'react';
/** One option inside a RadioGroup. */
export function Radio({ value, label, hint, name, checked = false, onSelect, disabled = false }) {
```

and the `<label>` loses `...style`, the `<input>` loses `{...rest}`.

Create `RadioGroup.prompt.md` by moving RadioGroup's usage out of `Radio.prompt.md`.

- [ ] **Step 4: Repoint the demo and rebuild**

In `radio-textarea.card.entry.jsx`, change the import to
`import { RadioGroup } from '../../components/forms/RadioGroup.jsx';` and
`import { Radio } from '../../components/forms/Radio.jsx';`. Then:

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos && bun run check:demos
grep -rn "\.\.\.rest\|\.\.\.style" frameworks/react/components/forms/Radio.jsx frameworks/react/components/forms/RadioGroup.jsx
```

Expected: no `...rest`/`...style` output; `check:demos` in sync.

- [ ] **Step 5: Write the React suite**

Create `frameworks/react/test/radio.test.jsx`. **Starting point — run it.**

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { RadioGroup } from '../components/forms/RadioGroup.jsx';
import { Radio } from '../components/forms/Radio.jsx';

test('RadioGroup marks the child whose value matches, and only it', () => {
  const html = renderToStaticMarkup(
    <RadioGroup value="b"><Radio value="a" label="A" /><Radio value="b" label="B" /></RadioGroup>
  );
  // The selected dot is a bare crimson span; exactly one appears.
  assert.equal(html.match(/border-radius:50%;background:var\(--crimson\)/g)?.length, 1);
});

test('RadioGroup gives its children a shared name so the native radios group', () => {
  const html = renderToStaticMarkup(
    <RadioGroup name="env"><Radio value="a" label="A" /><Radio value="b" label="B" /></RadioGroup>
  );
  assert.equal(html.match(/name="env"/g)?.length, 2);
});

test('Radio renders its label and hint', () => {
  const html = renderToStaticMarkup(<RadioGroup><Radio value="a" label="Prod" hint="Real users" /></RadioGroup>);
  assert.match(html, /Prod/); assert.match(html, /Real users/);
});

/* R4: style and {...rest} left both components. Asserted separately -- a
 * component that stopped spreading ...rest but still merged ...style passes a
 * single combined assertion. RadioGroup is the root that took both escapes. */
test('RadioGroup drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(<RadioGroup style={{ color: '#ff00ff' }} data-stray="x"><Radio value="a" label="A" /></RadioGroup>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 6: Run, prove R4 non-vacuity on RadioGroup (both runs, sha256), gates, commit**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/radio.test.jsx
# then the two induced regressions on RadioGroup.jsx per Constraint 17, sha256 before/after
bun run build:api  # RadioGroup/Radio declare no new type; expect no generated change
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun run check:tailwind
bun run check:states
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 28 … across 48`; behaviour diff empty; React suite gains its file. Commit with a
here-doc message stating the split and 26/46 → 28/48. Append `## Task 2: complete` to the ledger.

> **`Radio`/`RadioGroup` behaviour bindings:** `Radio.behaviour.json` binds a radio pattern; check
> whether splitting the files leaves a `RadioGroup.behaviour.json` needed. `check:behaviour` names any
> component missing a declaration — if it flags `RadioGroup`, add its binding beside `RadioGroup.jsx`,
> copied from what the group's role was under `Radio` before the split, with an **empty diff in intent**
> (the DOM did not change). This is the one place Task 2 may touch a `*.behaviour.json`, and only to
> keep coverage honest across the split, never to weaken it.

---

## Task 3: Checkbox

**Files:** create `api/components/Checkbox.json`, `frameworks/react/test/checkbox.test.jsx`; modify
`Checkbox.d.ts` `.jsx` `.prompt.md`, `forms.card.entry.jsx`; regenerate `.js`.

**Interfaces:** consumes DA, DB. No new type.

- [ ] **Step 1: Confirm and STOP.** Report the contract; confirm `onChange` becomes `change` carrying
  `boolean` (DA), and the heritage flattens to `disabled required name value` (DB).

- [ ] **Step 2: Write the contract**

```json
{
  "component": "Checkbox",
  "description": "A single checkbox. Checked shows a crimson fill with a check.",
  "api": {
    "checked": { "form": "primitive", "type": "boolean", "default": false, "description": "Whether it is ticked." },
    "label": { "form": "primitive", "type": "string", "description": "Text beside the box." },
    "disabled": { "form": "primitive", "type": "boolean", "default": false, "description": "Blocks toggling and dims it." },
    "required": { "form": "primitive", "type": "boolean", "default": false, "description": "Must be checked for the form to submit." },
    "name": { "form": "primitive", "type": "string", "description": "Submitted with the form." },
    "value": { "form": "primitive", "type": "string", "description": "The value submitted under `name` when checked." },
    "change": { "form": "event", "payload": "boolean", "description": "Toggled; carries the new checked state." }
  }
}
```

- [ ] **Step 3: Migrate `.d.ts`**

```ts
/** Checkbox. Checked = crimson fill with check. */
export interface CheckboxProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  /** Toggled; carries the new checked state. */
  onChange?: (checked: boolean) => void;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
```

- [ ] **Step 4: Migrate `.jsx`** — signature declares the members; `onChange` is called with the new
  boolean, not the event; the `<input>` drops `{...rest}` and the root `<label>` drops `...style`:

```jsx
export function Checkbox({ checked = false, onChange, label, disabled = false, required = false, name, value }) {
```

and the `<input>` becomes
`<input type="checkbox" checked={checked} name={name} value={value} required={required} onChange={(e) => onChange && onChange(e.target.checked)} disabled={disabled} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />`
and the root `<label>`'s style object loses its trailing `...style`.

- [ ] **Step 5: Fix the call site, write the suite (assert `change` carries the boolean and both R4
  escapes are gone), run the two R4 regressions, rebuild demos, prompt, README, gates, commit.**

Expected: `check-api: 29 … across 49`; behaviour diff empty. Message states 28/48 → 29/49. Ledger.

---

## Task 4: Textarea

**Files:** create `api/components/Textarea.json`, `frameworks/react/test/textarea.test.jsx`; modify
`Textarea.d.ts` `.jsx` `.prompt.md`, `radio-textarea.card.entry.jsx`; regenerate `.js`.

**Interfaces:** consumes DA, DB. No new type.

- [ ] **Step 1: Confirm and STOP.** Report the contract; confirm the `Omit<…, 'style'>` heritage AND
  the re-declared `style` both leave, `onChange` → `change` carrying `string` (DA), and the flatten is
  `value disabled readOnly placeholder name maxLength rows` (DB).

- [ ] **Step 2: Write the contract**

```json
{
  "component": "Textarea",
  "description": "Multi-line text field with validation and an optional counter.",
  "api": {
    "label": { "form": "primitive", "type": "string", "description": "Field label; the counter and error sit under the field." },
    "hint": { "form": "primitive", "type": "string", "description": "A line of help under the field." },
    "error": { "form": "primitive", "type": "string", "description": "Error message; turns the border crimson and shows below." },
    "required": { "form": "primitive", "type": "boolean", "default": false, "description": "Marks the label and the control required." },
    "counter": { "form": "primitive", "type": "boolean", "default": false, "description": "Shows a live length/maxLength count." },
    "autoResize": { "form": "primitive", "type": "boolean", "default": false, "description": "Grows with the content instead of scrolling." },
    "value": { "form": "primitive", "type": "string", "description": "The controlled text." },
    "disabled": { "form": "primitive", "type": "boolean", "default": false, "description": "Blocks editing and dims it." },
    "readOnly": { "form": "primitive", "type": "boolean", "default": false, "description": "Shows the value but blocks editing." },
    "placeholder": { "form": "primitive", "type": "string", "description": "Shown when empty." },
    "name": { "form": "primitive", "type": "string", "description": "Submitted with the form." },
    "maxLength": { "form": "primitive", "type": "number", "description": "Caps the length; feeds the counter." },
    "rows": { "form": "primitive", "type": "number", "default": 4, "description": "Initial visible rows." },
    "change": { "form": "event", "payload": "string", "description": "Edited; carries the new text." }
  }
}
```

- [ ] **Step 3: Migrate `.d.ts`** (drop the heritage and the re-declared `style`; declare the members
  above; `onChange` becomes `(value: string) => void`).
- [ ] **Step 4: Migrate `.jsx`** (`onChange` called with `e.target.value`; the `<textarea>` drops
  `{...rest}`; the root `<div>` drops `...style`).
- [ ] **Step 5: Fix the call site, suite (assert `change` carries the string, the counter shows only
  with `maxLength`, both R4 escapes gone), two R4 runs, rebuild, prompt, README, gates, commit.**

Expected: `check-api: 30 … across 50`; behaviour diff empty. 29/49 → 30/50. Ledger.

---

## Task 5: Select

**Files:** create `api/types/select-option.json`, `api/components/Select.json`,
`frameworks/react/test/select.test.jsx`; modify `Select.d.ts` `.jsx` `.prompt.md`,
`forms.card.entry.jsx`; regenerate `.js` and both `api.generated.*`.

**Interfaces:** consumes DA, DB, DD. Produces `SelectOption`.

- [ ] **Step 1: Confirm and STOP.** Report the contract; confirm `options` becomes an array of
  `SelectOption` (DD, the bare-string form leaves), heritage flattens to `value disabled required name
  multiple`, `onChange` → `change` carrying `string`.

- [ ] **Step 2: Write `SelectOption` and regenerate**

```json
{ "name": "SelectOption", "kind": "object",
  "description": "One option in a Select.",
  "fields": { "value": { "form": "primitive", "type": "string", "required": true },
              "label": { "form": "primitive", "type": "string", "required": true } } }
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

Expected: both modules gain `SelectOption`, nothing else moved.

- [ ] **Step 3: Write the contract**

```json
{
  "component": "Select",
  "description": "Styled native dropdown selector.",
  "api": {
    "label": { "form": "primitive", "type": "string", "description": "Field label above the control." },
    "options": { "form": "array", "of": "SelectOption", "description": "The choices, drawn as native options." },
    "value": { "form": "primitive", "type": "string", "description": "The selected option's value." },
    "disabled": { "form": "primitive", "type": "boolean", "default": false, "description": "Blocks the control and dims it." },
    "required": { "form": "primitive", "type": "boolean", "default": false, "description": "Must have a value for the form to submit." },
    "name": { "form": "primitive", "type": "string", "description": "Submitted with the form." },
    "multiple": { "form": "primitive", "type": "boolean", "default": false, "description": "Allow multiple selection." },
    "change": { "form": "event", "payload": "string", "description": "A different option was chosen; carries its value." }
  }
}
```

- [ ] **Step 4: Migrate `.d.ts`** (`import type { SelectOption } from '../../api.generated';` plus
  `export type { SelectOption };` per Constraint 9 — `SelectOption` was a named exported type;
  `options?: SelectOption[]`; `onChange?: (value: string) => void`; drop heritage).
- [ ] **Step 5: Migrate `.jsx`** — the `options.map` loses its `typeof o === 'string'` branch (only
  `SelectOption` now); `onChange` called with `e.target.value`; `<select>` drops `{...rest}`; root
  `<div>` drops `...style`:

```jsx
export function Select({ label, options = [], value, onChange, disabled = false, required = false, name, multiple = false }) {
```

and inside the map: `<option key={o.value} value={o.value}>{o.label}</option>` only.

- [ ] **Step 6: Fix the call site** (bare strings → `{value, label}`), suite (assert an option renders
  its label, `change` carries the value, both R4 escapes gone), two R4 runs, rebuild, prompt, README,
  gates, commit.

Expected: `check-api: 31 … across 51`; behaviour diff empty. 30/50 → 31/51. Ledger.

---

## Task 6: Input

**Files:** create `api/types/input-type.json`, `api/types/validate-on.json`,
`api/components/Input.json`, `frameworks/react/test/input.test.jsx`; modify `Input.d.ts` `.jsx`
`.prompt.md`, `LoginScreen.jsx`, `unauth-card.card.entry.jsx`, `forms.card.entry.jsx`; regenerate
`.js` and both `api.generated.*`.

**Interfaces:** consumes DA, DB, DC, DE, plus `functionInput` (Task 1b). Produces `InputType`,
`ValidateOn`.

- [ ] **Step 1: Confirm and STOP.** Report the contract; confirm `Input` declares `"kind": "input"`
  (the only contract in the batch that does), `validate` is a `functionInput`, `type` is `InputType`,
  `icon`/`prefix` are strings, `className` leaves, `onChange`/`onBlur` → `change`/`blur` carrying
  `string`.

- [ ] **Step 2: Write the two enums and regenerate**

```json
{ "name": "InputType", "kind": "enum",
  "description": "The native input types Arena styles. Date/time use the native control -- Arena ships no DatePicker.",
  "values": ["text", "email", "password", "search", "tel", "url", "number", "date", "time", "datetime-local"] }
```

```json
{ "name": "ValidateOn", "kind": "enum",
  "description": "When Input runs `validate`: on blur, or on every change.",
  "values": ["blur", "change"] }
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

Expected: both modules gain `InputType` and `ValidateOn`, nothing else moved.

- [ ] **Step 3: Write the contract** (note the top-level `"kind": "input"`):

```json
{
  "component": "Input",
  "kind": "input",
  "description": "Text field with validation. Focus is a gold ring; error crimson; valid green with a check.",
  "api": {
    "label": { "form": "primitive", "type": "string", "description": "Field label above the control." },
    "hint": { "form": "primitive", "type": "string", "description": "A line of help under the field." },
    "error": { "form": "primitive", "type": "string", "description": "Controlled error message; wins over `validate`." },
    "valid": { "form": "primitive", "type": "boolean", "default": false, "description": "Force the valid (green check) state." },
    "required": { "form": "primitive", "type": "boolean", "default": false, "description": "Marks the label and the control required." },
    "validate": { "form": "functionInput", "params": { "value": "string" }, "returns": "string",
                  "description": "Called on the value; returns the error message, or empty for valid." },
    "validateOn": { "form": "enum", "type": "ValidateOn", "default": "blur", "description": "When `validate` runs." },
    "type": { "form": "enum", "type": "InputType", "default": "text", "description": "Native input type." },
    "icon": { "form": "primitive", "type": "string", "description": "Phosphor class name drawn at the field's start." },
    "prefix": { "form": "primitive", "type": "string", "description": "Static text Arena draws before the value, e.g. `git@`." },
    "value": { "form": "primitive", "type": "string", "description": "The controlled text." },
    "disabled": { "form": "primitive", "type": "boolean", "default": false, "description": "Blocks editing and dims it." },
    "readOnly": { "form": "primitive", "type": "boolean", "default": false, "description": "Shows the value but blocks editing." },
    "placeholder": { "form": "primitive", "type": "string", "description": "Shown when empty." },
    "name": { "form": "primitive", "type": "string", "description": "Submitted with the form." },
    "autoComplete": { "form": "primitive", "type": "string", "description": "The browser autofill hint." },
    "min": { "form": "primitive", "type": "string", "description": "Minimum, for number/date types." },
    "max": { "form": "primitive", "type": "string", "description": "Maximum, for number/date types." },
    "step": { "form": "primitive", "type": "string", "description": "Step, for number/date types." },
    "maxLength": { "form": "primitive", "type": "number", "description": "Caps the length." },
    "pattern": { "form": "primitive", "type": "string", "description": "A regex the value must match." },
    "change": { "form": "event", "payload": "string", "description": "Edited; carries the new value." },
    "blur": { "form": "event", "payload": "string", "description": "Left the field; carries the value." }
  }
}
```

- [ ] **Step 4: Migrate `.d.ts`** (`import type { InputType, ValidateOn } from '../../api.generated';`;
  drop the heritage, `className`, `icon: ReactNode`→`string`, `prefix: ReactNode`→`string`,
  `type: HTMLInputTypeAttribute`→`InputType`, `validate`'s TS signature stays
  `(value: string) => string | null | undefined` — the reader classifies it as `functionInput`;
  `onChange?: (value: string) => void`, `onBlur?: (value: string) => void`; declare the flattened set).
- [ ] **Step 5: Migrate `.jsx`** — `icon` becomes `<i className={icon} aria-hidden="true" />`; `prefix`
  stays drawn in the mono span (already a string at the one call site); `onChange`/`onBlur` called with
  the value not the event; the `<input>` drops `{...rest}` and keeps `className="arena-input"` (the
  consumer `className` merge is removed); the root `<div>` drops `...style`. `validate`/`validateOn`
  and the internal `localErr` engine stay exactly as they are.

- [ ] **Step 6: Fix the three call sites** (`LoginScreen`, `unauth-card.card.entry`,
  `forms.card.entry` — the `prefix="git@"` one is already a string; check each for `style`, a raw
  `onChange={e=>…e.target.value}`, or a removed member), write the suite, run the two R4 regressions,
  rebuild demos (Console included), prompt, README, gates, commit.

The suite must include, beyond the R4 pair:

```jsx
/* validate is a functionInput -- the consumer's function decides the error.
 * The component runs it on blur (default validateOn) and shows what it returns.
 * This pins that the ninth form actually reaches the render, not only the
 * contract. */
test('Input shows the message its validate function returns', () => {
  const html = renderToStaticMarkup(
    <Input label="Email" validate={() => 'Bad email'} value="x" />
  );
  // Rendered on blur in the browser; renderToStaticMarkup shows the initial
  // state, so assert the wiring the SSR pass CAN show: the field exists and no
  // error shows before interaction. The blur path is a DOM test's job (Plan E
  // territory); here assert the contract member is accepted and the field draws.
  assert.match(html, /Email/);
  assert.doesNotMatch(html, /Bad email/, 'validate has not run before blur');
});

/* type is an enum now; the native input carries it. */
test('Input passes its type through to the native control', () => {
  assert.match(renderToStaticMarkup(<Input label="When" type="date" />), /type="date"/);
});

/* icon is a Phosphor string Arena draws, hidden from assistive tech. */
test('Input draws the icon class it is given and hides it', () => {
  const html = renderToStaticMarkup(<Input label="Search" icon="ph-bold ph-magnifying-glass" />);
  assert.match(html, /class="ph-bold ph-magnifying-glass"/);
  assert.match(html, /aria-hidden="true"/);
});
```

Expected: `check-api: 32 … across 52`; behaviour diff empty. 31/51 → 32/52. **This completes the six
migrations of batch 8C2.** Ledger.

---

## Task 7: Divergences and the citation sweep

**Files:** modify `components-divergences.md` (read first; likely unchanged).

- [ ] **Step 1: Re-read and classify.** `wc -l components-divergences.md`; find headings naming the
  six. Classify each API (delete) / rendering (keep) / behaviour (keep). At plan time the form
  controls appear in the box-model table (rendering) and possibly a per-field note; expect no API
  entry to delete, and say so in the ledger.

- [ ] **Step 2: Check citations.** `grep -rn "components-divergences" --include='*.json'
  --include='*.ts' --include='*.md' --include='*.jsx' . | grep -v node_modules`. Redirect none unless
  Step 1 deleted a cited section.

- [ ] **Step 3: Sweep for dead references** (Constraint 21) to every removed/renamed member — the
  bare-string `Select` option, `HTMLInputTypeAttribute`, `React.CSSProperties`, the heritage clauses,
  `e.target.value` handlers in demos, `RadioGroup` imported from `Radio.jsx`. A hit in a **contracted**
  component is this task's to fix; a hit in an **uncontracted** one (C3/C4/C5 components) is expected —
  record which is which.

- [ ] **Step 4: Commit only if something changed**, per Constraint. Otherwise record "no change" in
  the ledger and make no commit. Append `## Task 7: complete`.

---

## Task 8: Close-out

**Files:** modify the spec, `CHANGELOG.md`, `CLAUDE.md`; delete the executed 8C1 plan.

- [ ] **Step 1: Full sweep once**

```bash
cd /home/juan/Dravensoft/Identity
export CHROME_PATH=/usr/bin/chromium
bun run check
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun test frameworks/react/test-dom 2>&1 | tail -3
```

Expected: all 23 steps PASS. Reconcile the merged count against the per-task deltas in the ledger;
the isolated DOM process stays 26/5. If the delta does not reconcile, stop and find out why.

- [ ] **Step 2: Whole-branch review** (Constraint 23). Read `git diff main...HEAD` against: do the six
  agree on how `onChange` reshaped (all carry the value, none the DOM event)?; is every member
  `description` consistent across contract / `.d.ts` / `.prompt.md`?; are the enums minimal (no value
  set duplicated across `api/types/`)?; did any suite weaken a title?; does the `check:api` climb
  reconcile 26 → 28 → 29 → 30 → 31 → 32?; is `functionInput` used only in `Input` and only with
  `kind: "input"`? Fix findings in their own commits; record each in the ledger.

- [ ] **Step 3: Spec.** Add the 8C2 running-count row (measured merged/isolated), a paragraph in the
  Plan B4/8C1 register (what was contracted, 26/46 → 32/52, the single-layer arithmetic, the ninth
  form and its `kind: "input"` guard, the enums declared). Note the ninth form under *Plan C*.

- [ ] **Step 4: CHANGELOG.** Under `## [Unreleased]`: the ninth form under Added; the six controls
  with their breaking changes (onChange carries the value not the event; Input's validate is a
  functionInput, type an enum, icon/prefix strings, className gone; Select options are objects) under
  Changed. Fix any stale "eight forms" line.

- [ ] **Step 5: CLAUDE.md.** Record the ninth form in the API paragraph and its `kind: "input"` guard;
  add any debt this batch created (the `id`-not-a-member D1 cost; the Plan D functionInput obligation).
  Move any debt living only in the 8C1 plan into Known debt before deleting it.

- [ ] **Step 6: Delete the executed 8C1 plan**

```bash
cd /home/juan/Dravensoft/Identity
git rm docs/superpowers/plans/2026-07-24-8c1-api-contracts-the-five-composed-primitives.md
```

- [ ] **Step 7: Commit** (here-doc), append `## Task 8: complete` and a batch summary. Report to the
  maintainer; **do not merge, do not push.**

---

## Appendix A: what this plan deliberately does not do

- **It does not touch Angular.** The six are React-only until Plan D; the only Angular file that moves
  is the generated `api.generated.ts`.
- **It does not implement `functionInput` in Angular.** That is Plan D's, and the contract's modelled
  signature is what it must satisfy. The Plan D debt is recorded, not resolved.
- **It does not add a DOM test for Input's validate blur path.** `renderToStaticMarkup` cannot fire a
  blur; the ninth form's render wiring is pinned as far as SSR reaches, and the interactive path is
  Plan E territory, like the Tooltip timer was.
- **It does not contract the remaining Plan C components** (`Calendar`, `Dialog`, `Menu`, `Pagination`,
  `ProgressBar`, `SegmentedControl`, `SideNav`, `Table`, `Tabs`, `Toast`, `Tooltip`) — C3/C4/C5.
- **It does not cut a release** and does not restore the Plan E suspended tests.
