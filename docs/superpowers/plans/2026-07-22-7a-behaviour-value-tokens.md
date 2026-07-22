# Behaviour value tokens Implementation Plan (7a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Arena's behaviour its first tokens — how long a tooltip waits, how long a toast lives, how many page numbers a paginator shows — so the system owns three timing and quantity decisions it currently either hides in an app or does not make at all.

**Architecture:** Purely additive on the script-readable token target plan 5.5 shipped. A new `tokens/src/behaviour.json` authors three families; each token carries `$extensions["com.dravensoft.arena"].script: true` and therefore emits both a CSS custom property and a bare number into the two per-layer generated modules that already exist. No build machinery changes. No new gate.

**Tech Stack:** Bun (build + test), DTCG 2025.10 JSON, Style Dictionary v4 (loader only), `node:test`/`node:assert`, React 18.

## Source spec

`docs/superpowers/specs/2026-07-22-7-behaviour-tokens-and-contracts-design.md`

Read its *What plan 5.5's execution settled* section before writing any code — it names the four gates that react to a new token, and one of them (`check:coverage`) is the step 5.5's own plan forgot.

## Scope: this is 7a of two

The spec covers two unlike layers. This plan implements **only the value layer** — DTCG tokens and their consumers. It is self-contained, ships working software, and fixes defects that exist today.

**7b, planned separately, holds the contract layer**: ~18 WAI-ARIA APG pattern files under `behaviour/`, a binding file per component per layer (43 React components + 21 Angular primitives = 64 files), `check:behaviour` levels 1 and 2, the level-3 render suites — which need a DOM-based React harness (`happy-dom` + `react-dom/client`) beside the five `renderToStaticMarkup` suites already in `frameworks/react/test/`, not a first suite — and the migration of `components-divergences.md`. That is not a tail on this plan; it is a larger plan than this one.

**One finding from this plan that 7b must not miss.** The spec assumes a binding is either "implements this pattern" or `"none"`. `SideNav` proves a third form is needed: there is **no `arena-side-nav` primitive at all**. The Angular path is `arena-material.css` dressing Material's `mat-nav-list`, which supplies the anchor-or-button distinction, the active state and the keyboard behaviour. That is not absence and not local implementation — it is **delegation**, and it is not a special case: 21 of the 39 Tailwind manifests exist precisely because Material provides the control. 7b needs a `delegated` binding form naming what provides the behaviour.

## Calibration: what ships, and what the spec proposed that does not

The spec's open question 2 says the proposed numbers are *"a starting point, not a finding"* and instructs calibration against the real components. This is that calibration, and it changes the deliverable. **Two of the spec's four families do not ship.**

| Family | Verdict | Why |
|---|---|---|
| `delay` | **Ships.** `open` 400ms, `close` 120ms | `Tooltip.jsx:25` opens on `onMouseEnter` and closes on `onMouseLeave`, with no delay at all. Dragging a pointer across a toolbar flashes every tooltip it crosses. This is a defect with a named symptom. |
| `dismiss` | **Ships.** `default` 4200ms, `actionable` 7000ms | `4200` exists today, hard-coded at `frameworks/react/ui_kits/console/index.entry.jsx:16`. The system's most visible timing decision is owned by an example app. `actionable` is WCAG 2.2.1: a toast carrying a button asks the reader to decide, not only to read. |
| `limit` | **Ships, one member.** `pagination-siblings` 1 | `Pagination.jsx:5` hard-codes `current - 1` / `current + 1` — a sibling count of 1, never named. A true relocation. |
| `debounce` | **Does not ship** | Speculative. `CommandPalette` filters a local array synchronously (`CommandPalette.jsx:7`, and Angular's exported `filterCommands`); debouncing an in-memory `Array.filter` adds latency and removes nothing. `useContainerWidth`/`containerWidth` use `ResizeObserver`, which already coalesces; debouncing it makes a resize lag behind the pointer. Neither has an observed problem. YAGNI. |
| `limit.results` | **Does not ship** | Capping the palette at 8 results is not tokenizing an existing value — **there is no cap today** (`CommandPalette.jsx:31` maps the whole filtered list). Introducing one hides result nine from a user who typed a query matching it. That is a product decision with a UX consequence, and it needs its own argument rather than arriving inside a token plan. |

**This answers open question 3 as a side effect.** `limit` is one family, not two, because the member that made it look like two — `results`, a legibility decision — is not shipping. `pagination-siblings` is the only member, and it is unambiguously a quantity invariant of the same kind as `z`.

**And it changes this plan's safety property.** Plan 5.5 could promise *no rendered value changed*; every number moved from a declaration to a token. **This plan cannot.** `dismiss` and `limit.pagination-siblings` are relocations, but `delay` is new behaviour — a tooltip that used to appear instantly now waits 400ms. That is the point of it, it is a defect fix, and it must be stated rather than smuggled in under "tokenization".

## Global Constraints

- **English only** — all code, comments, docs and copy. **No emoji**, in product or docs.
- **`tokens/src/` is authored; `tokens/*.css` and `frameworks/*/tokens.generated.*` are generated.** Never hand-edit them. Rebuild with `bun run build:tokens`.
- **DTCG 2025.10:** `duration` values are `{value, unit}` objects with the unit required; `number` is bare. `$extensions` keys are reverse-DNS — Arena's is exactly `com.dravensoft.arena`.
- **Only `dimension`, `duration` and `number` are flaggable** `script: true`; `serialize-script.mjs` throws on anything else.
- **A flagged token must be imported by at least one framework layer** or `check:script-tokens` fails it as an orphan. All three families here are consumed by React alone — Angular has no `Tooltip`, no `Toast` and no `Pagination` primitive. That asymmetry is exactly what the "at least one layer" rule exists for, and it is correct here.
- **Every new token needs a `check:coverage` `EXCLUDED` entry with a reason**, because that gate inventories the four generated CSS files. 5.5's plan omitted this and would have failed its own completion gate.
- **Components carry no CSS classes**; they render with inline `style` objects reading custom properties, and handle interaction with local `useState`.
- **`bun run check` is a completion gate**, run once at the end — not per commit.
- **CHANGELOG entries go under `## [Unreleased]`.**
- **Debt goes in `CLAUDE.md`'s *Known debt* section**, never in this document — plans under `docs/superpowers/` are deleted once executed.

---

## File structure

**Created:**

| Path | Responsibility |
|---|---|
| `tokens/src/behaviour.json` | The three families. New DTCG source file. |

**Modified:**

| Path | Change |
|---|---|
| `scripts/build-tokens.mjs` | One entry in the `FILES` array. No mechanism change. |
| `scripts/check-tailwind-coverage.mjs` | Five `EXCLUDED` entries. |
| `tokens/src/TYPE-MAP.md` | One row. |
| `tokens/effects.css` | Regenerated. |
| `frameworks/react/tokens.generated.js`, `frameworks/angular/tokens.generated.ts` | Regenerated. |
| `frameworks/react/components/feedback/Tooltip.jsx` + `.d.ts` + `.prompt.md` | Pointer-intent delay. |
| `frameworks/react/ui_kits/console/index.entry.jsx` | The `4200` becomes two tokens and a rule. |
| `frameworks/react/components/navigation/Pagination.jsx` | Sibling count becomes a token; the `7` threshold derives from it. |
| `CLAUDE.md`, `CHANGELOG.md` | Task 5. |

---

### Task 1: Author the three behaviour families

**Files:**
- Create: `tokens/src/behaviour.json`
- Modify: `scripts/build-tokens.mjs` (the `FILES` array), `scripts/check-tailwind-coverage.mjs`, `tokens/src/TYPE-MAP.md`
- Regenerate: `tokens/effects.css`, both `tokens.generated.*`

**Interfaces:**
- Consumes: the script-readable target shipped in `5d043ec`. Nothing to build.
- Produces: custom properties `--delay-open`, `--delay-close`, `--dismiss-default`, `--dismiss-actionable`, `--limit-pagination-siblings`, and the exports `delayOpen`, `delayClose`, `dismissDefault`, `dismissActionable`, `limitPaginationSiblings` in both generated modules. Tasks 2–4 consume these.

- [ ] **Step 1: Write the token source**

Create `tokens/src/behaviour.json`:

```json
{
  "delay": {
    "$type": "duration",
    "$description": "Pointer intent — how long a pointer must rest on a target before a\ndeferred affordance appears, and how long it may leave before that affordance\nwithdraws. Deliberately not part of dur: dur measures how long a transition\ntakes once it has been decided, delay measures how long we wait before\ndeciding. These apply to the POINTER only. A keyboard focus must reveal its\ntooltip immediately — a delay there reads as an unresponsive control, and a\nfuture plan adding focus support must not route it through these.",
    "open": {
      "$value": { "value": 400, "unit": "ms" },
      "$description": "Rest time before a tooltip appears. Long enough that crossing a toolbar reveals nothing.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    },
    "close": {
      "$value": { "value": 120, "unit": "ms" },
      "$description": "Grace period after the pointer leaves. Short, and much shorter than open:\nit exists so travelling between a trigger and its own tooltip does not dismiss it,\nnot to keep the tooltip around.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    }
  },
  "dismiss": {
    "$type": "duration",
    "$description": "Automatic permanence — how long a transient notice remains before it\nwithdraws itself. The HOST owns dismissal, not Toast: Toast renders and exposes\npersist, the host runs the clock.",
    "default": {
      "$value": { "value": 4200, "unit": "ms" },
      "$description": "A toast that only has to be read. This is the value the Delivery Console\nshipped hard-coded before it was a token.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    },
    "actionable": {
      "$value": { "value": 7000, "unit": "ms" },
      "$description": "A toast carrying a button. WCAG 2.2.1: it asks the reader to DECIDE, not\nonly to read, and 4.2s is enough for the second task only if they were already\nlooking. persist (README H1) still overrides both and stays mandatory in\ncritical states.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    }
  },
  "limit": {
    "$type": "number",
    "$description": "Quantity bounds — system-wide invariants about how much is shown. Not\ngeometry, and the twin of z: same $type, same character. The family declares the\ninvariant; a component derives its own consequences from it.",
    "pagination-siblings": {
      "$value": 1,
      "$description": "How many page numbers flank the current one before the list elides. The\nwindow's total width is a CONSEQUENCE and is derived at the point of use, never\nauthored: first + last + (2 * siblings + 1) + two ellipses.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    }
  }
}
```

- [ ] **Step 2: Verify it is valid DTCG before wiring it in**

Run: `bun scripts/check-dtcg.mjs`
Expected: PASS. The script walks `tokens/src/*.json` and picks the new file up with no registration. A failure naming `$extensions` means the reverse-DNS key is wrong; it must be exactly `com.dravensoft.arena`.

- [ ] **Step 3: Wire the file into the CSS build**

In `scripts/build-tokens.mjs`, extend the `effects.css` entry of `FILES`:

```js
  { out: 'effects.css', blocks: [
    { selector: ':root', source: 'effects.json' },
    { selector: ':root', source: 'layering.json' },
    { selector: ':root', source: 'chart.json' },
    { selector: ':root', source: 'behaviour.json' },
  ] },
```

`effects.css` rather than `spacing.css` for the reason `chart.json` uses it: `spacing.css` carries the `.arena-compact` block, and a value bound at import time cannot re-densify. Keeping these out of that file keeps the distinction legible.

- [ ] **Step 4: Rebuild and inspect both targets**

Run: `bun run build:tokens`
Expected: the four CSS lines, then the two module lines.

Run: `grep -E '^  --(delay|dismiss|limit)-' tokens/effects.css`
Expected: five lines — `--delay-open:400ms`, `--delay-close:120ms`, `--dismiss-default:4200ms`, `--dismiss-actionable:7000ms`, `--limit-pagination-siblings:1`.

Run: `grep -E '^export const (delay|dismiss|limit)' frameworks/react/tokens.generated.js`
Expected: `delayOpen = 400`, `delayClose = 120`, `dismissDefault = 4200`, `dismissActionable = 7000`, `limitPaginationSiblings = 1`.

Note `--limit-pagination-siblings` renders as bare `1` with no unit, because it is a `number`. That is correct and matches `--z-*`.

- [ ] **Step 5: Confirm the committed CSS matches**

Run: `bun scripts/check-tokens-generated.mjs`
Expected: `check-tokens-generated: 4 file(s) in sync with tokens/src/`

- [ ] **Step 6: Record the five tokens with the Tailwind coverage gate**

`check:coverage` inventories the four generated CSS files, so each new token must reach a Tailwind utility or be named in `EXCLUDED` with a reason. None of these reaches a utility and none should — the consumer is `setTimeout` and an array bound, not a class on an element.

Run: `bun run check:coverage`
Expected: FAIL, exit 1, five lines of the form:
```
--delay-open reaches no Tailwind utility — expose it in frameworks/tailwind/theme.css or add it to EXCLUDED with a reason
```

Then append to the `EXCLUDED` map in `scripts/check-tailwind-coverage.mjs`, after the `onboarding-width` entry:

```js
  ['delay-open', 'script-readable: a setTimeout argument for pointer intent, never a utility'],
  ['delay-close', 'script-readable: a setTimeout argument for pointer intent, never a utility'],
  ['dismiss-default', 'script-readable: the host runs the toast clock in JS, never a utility'],
  ['dismiss-actionable', 'script-readable: the host runs the toast clock in JS, never a utility'],
  ['limit-pagination-siblings', 'script-readable: an array bound, and the elision threshold derives from it in JS'],
```

Run: `bun run check:coverage`
Expected: PASS.

- [ ] **Step 7: Watch the orphan gate fail, and leave it failing**

Run: `bun scripts/check-script-tokens.mjs`
Expected: **FAIL, exit 1, with exactly five orphan problems** — one per token — because nothing imports them yet:
```
  delayOpen: flagged script-readable but no framework layer imports it — remove the flag or use the token
```

This is the gate proving it works. Tasks 2–4 clear it. **Do not silence it**: do not remove a flag, add an exemption, or write a placeholder consumer.

- [ ] **Step 8: Add the TYPE-MAP row**

In `tokens/src/TYPE-MAP.md`, after the `Component geometry` row:

```markdown
| Behaviour (`delay-*`, `dismiss-*`, `limit-*`) | `behaviour.json` | `duration`, except `limit-*` | ms, and `limit-*` is a bare `number` like `z-*`. **Script-readable** — the consumer is a `setTimeout` argument or an array bound, so these are read as numbers in JS as well as emitted to CSS. Behaviour VALUES only; the behaviour CONTRACT (which keys, which roles, where focus goes) is not a token and lives outside `tokens/` |
```

- [ ] **Step 9: Commit**

```bash
git add tokens/src/behaviour.json tokens/src/TYPE-MAP.md scripts/build-tokens.mjs scripts/check-tailwind-coverage.mjs tokens/effects.css frameworks/react/tokens.generated.js frameworks/angular/tokens.generated.ts
git commit -m "feat(tokens): behaviour gets its first values, and they are ordinary DTCG

Three families, all script-readable because their consumers are setTimeout
arguments and array bounds rather than CSS properties: delay (pointer intent),
dismiss (how long a transient notice lives) and limit (quantity invariants).

Two of the spec's four proposed families are deliberately absent. debounce is
speculative -- CommandPalette filters a local array synchronously and
ResizeObserver already coalesces, so debouncing either adds latency and removes
nothing. limit.results would introduce a result cap that does not exist today,
which is a product decision with a UX consequence, not a tokenization.

delay's description states a constraint a later plan will need: these apply to
the pointer only. A keyboard focus must reveal its tooltip immediately.

Nothing consumes them yet; check:script-tokens is correctly red with five
orphans until Task 4."
```

---

### Task 2: Tooltip stops flashing

**Files:**
- Modify: `frameworks/react/components/feedback/Tooltip.jsx`
- Modify: `frameworks/react/components/feedback/Tooltip.d.ts`
- Modify: `frameworks/react/components/feedback/Tooltip.prompt.md`

**Interfaces:**
- Consumes: `delayOpen`, `delayClose` from `frameworks/react/tokens.generated.js`.
- Produces: nothing later tasks depend on.

**This changes behaviour on purpose.** A tooltip that appeared instantly now waits 400ms. That is the defect fix, not a side effect.

- [ ] **Step 1: Read the component first**

Run: `cat frameworks/react/components/feedback/Tooltip.jsx`

It is short. Note that the whole open/close mechanism is two inline arrow functions on line 25, and that there is no `onFocus`/`onBlur` — the tooltip is not keyboard-reachable at all. **That is out of scope here** and belongs to plan 7b's contract work; do not add it.

- [ ] **Step 2: Replace the immediate toggle with an intent-delayed one**

In `frameworks/react/components/feedback/Tooltip.jsx`, add the import beside the React one:

```js
import { delayOpen, delayClose } from '../../tokens.generated.js';
```

Replace the component body's state and handlers. The current form is:

```js
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
```

It becomes:

```js
  const [show, setShow] = useState(false);
  /* One timer, cleared on every transition. Two timers would race: leaving and
   * re-entering inside the close grace period must cancel the pending close,
   * not queue an open behind it. The delays are POINTER intent -- a keyboard
   * focus, when Tooltip grows one, must reveal immediately and must not route
   * through here. */
  const timer = useRef(null);
  const schedule = (next, ms) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(next), ms);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => schedule(true, delayOpen)} onMouseLeave={() => schedule(false, delayClose)}>
```

Extend the React import on line 1 to include `useRef`:

```js
import React, { useEffect, useRef, useState } from 'react';
```

- [ ] **Step 3: Verify the gate and the literal scan**

Run: `bun run check:dimensions`
Expected: PASS.

Run: `grep -nE '\b(400|120)\b' frameworks/react/components/feedback/Tooltip.jsx`
Expected: no output.

- [ ] **Step 4: Document the behaviour on the type and in the prompt**

In `frameworks/react/components/feedback/Tooltip.d.ts`, extend the interface doc comment above `TooltipProps` (or the component's own doc comment if the file has no interface doc) with:

```ts
/**
 * Hover reveal. The tooltip waits `--delay-open` before appearing and
 * `--delay-close` before withdrawing, so a pointer crossing a toolbar reveals
 * nothing. Both delays are pointer intent; there is no keyboard trigger yet.
 */
```

`frameworks/react/components/feedback/Tooltip.prompt.md` is four lines and has **no
Do/Don't section**, unlike most component prompts. Do not invent one for this change.
Append two lines in the file's own plain-prose idiom, after the example:

```markdown
The tooltip is a deferred affordance: it waits for the pointer to rest, and does not
appear for a pointer merely passing over it.

**Don't** wrap a control whose only label is its tooltip. It is unreadable for the
first 400ms, and it is unreachable by keyboard at all.
```

- [ ] **Step 5: Rebuild the compiled sibling and verify**

Run: `bun run build:demos && bun run check:demos`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frameworks/react/components/feedback/
git commit -m "fix(Tooltip): a pointer crossing a toolbar no longer reveals every tooltip it passes

Tooltip opened on mouseenter and closed on mouseleave with no delay, so dragging
a pointer across a row of controls flashed each one in turn. It now waits
--delay-open before appearing and --delay-close before withdrawing.

One timer, cleared on every transition, because two would race: leaving and
re-entering inside the close grace period must cancel the pending close rather
than queue an open behind it. The effect clears it on unmount.

This changes behaviour deliberately -- the tooltip used to appear instantly.
That was the defect.

The delays are pointer intent only. Tooltip still has no onFocus/onBlur and is
not keyboard-reachable; that is plan 7b's contract work, and when it lands the
focus path must reveal immediately rather than route through these delays."
```

---

### Task 3: The toast clock moves into the system

**Files:**
- Modify: `frameworks/react/ui_kits/console/index.entry.jsx:13-17`

**Interfaces:**
- Consumes: `dismissDefault`, `dismissActionable` from `frameworks/react/tokens.generated.js`.

`Toast` deliberately does not own dismissal — it renders and exposes `persist`; the host runs the clock. So the token is consumed by the host, and the Delivery Console is the host Arena ships.

- [ ] **Step 1: Read the current host**

Run: `sed -n '10,20p' frameworks/react/ui_kits/console/index.entry.jsx`

The clock is one line: `setTimeout(() => setToasts(...), 4200)`.

- [ ] **Step 2: Replace the literal with the rule**

Add the import at the top of `frameworks/react/ui_kits/console/index.entry.jsx`, beside its existing imports:

```js
import { dismissDefault, dismissActionable } from '../../tokens.generated.js';
```

Replace the `pushToast` body:

```js
  const pushToast = (t) => {
    const id = Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  };
```

with:

```js
  const pushToast = (t) => {
    const id = Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    /* A toast carrying a button asks the reader to DECIDE, not only to read, and
     * gets longer for it (WCAG 2.2.1). `persist` overrides both and never
     * auto-dismisses -- mandatory in critical states, per README H1. */
    if (t.persist) return;
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)),
      t.action ? dismissActionable : dismissDefault);
  };
```

Note this also fixes a real bug in passing: the host previously ignored `persist` entirely, so a toast marked "does not auto-dismiss" was dismissed anyway after 4.2 seconds. Verify that claim before writing it in the commit message — `grep -n persist frameworks/react/ui_kits/console/index.entry.jsx` should return nothing before your change.

- [ ] **Step 3: Verify**

Run: `grep -n '4200' frameworks/react/ui_kits/console/index.entry.jsx`
Expected: no output.

Run: `bun run check:dimensions && bun run build:demos && bun run check:demos`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add frameworks/react/ui_kits/console/
git commit -m "fix(console): the system owns how long a toast lives, and persist finally works

The most visible timing decision Arena makes was the literal 4200 in an example
app. It is --dismiss-default now, and a toast carrying a button gets
--dismiss-actionable instead: it asks the reader to decide rather than only to
read, and 4.2s covers the second task only if they were already looking
(WCAG 2.2.1).

Toast is right not to own this -- it renders and exposes persist while the host
runs the clock -- but the host was ignoring persist entirely, so a toast marked
'does not auto-dismiss' was dismissed anyway. It now returns before scheduling."
```

---

### Task 4: Pagination's window derives from one token

**Files:**
- Modify: `frameworks/react/components/navigation/Pagination.jsx:2-11`

**Interfaces:**
- Consumes: `limitPaginationSiblings` from `frameworks/react/tokens.generated.js`.

- [ ] **Step 1: Read `pages()` and find the second, hidden value**

Run: `sed -n '1,12p' frameworks/react/components/navigation/Pagination.jsx`

There are two numbers, and only one is obvious. `current - 1` / `current + 1` is a sibling count of 1. `total <= 7` is the threshold below which every page is shown — and it is **not independent**: with one sibling either side, the elided form renders first + last + (current and its two siblings) + two ellipses = 7 slots. Widen the siblings and the threshold must widen with it, or the elided form is briefly wider than the full one.

So one is a token and the other is a derivation: `2 * siblings + 5`. This is the same call `catSlots` made in plan 5.5 — derive what is a consequence, author only the decision.

- [ ] **Step 2: Write the failing test**

Create `frameworks/react/test/pagination-window.test.jsx` — `.jsx` to match its five
siblings in that directory, even though it contains no JSX; `test:react` runs
`bun test frameworks/react/test`, so anything in there is picked up:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageWindow } from '../components/navigation/pagination-window.js';
import { limitPaginationSiblings } from '../tokens.generated.js';

test('below the threshold every page is listed, with no ellipsis', () => {
  const threshold = 2 * limitPaginationSiblings + 5;
  assert.deepEqual(pageWindow(1, threshold), Array.from({ length: threshold }, (_, i) => i + 1));
});

test('one past the threshold the list elides', () => {
  const threshold = 2 * limitPaginationSiblings + 5;
  const out = pageWindow(1, threshold + 1);
  assert.ok(out.includes('…'));
  assert.equal(out.length <= threshold, true);
});

test('the current page keeps a sibling on each side', () => {
  const out = pageWindow(10, 20).filter((p) => typeof p === 'number');
  assert.ok(out.includes(10 - limitPaginationSiblings));
  assert.ok(out.includes(10 + limitPaginationSiblings));
});

test('first and last are always present', () => {
  const out = pageWindow(10, 20);
  assert.equal(out[0], 1);
  assert.equal(out[out.length - 1], 20);
});

test('a window at the start does not emit a leading ellipsis', () => {
  assert.equal(pageWindow(1, 20)[1], 2);
});
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `bun test frameworks/react/test/pagination-window.test.jsx`
Expected: FAIL — `Cannot find module '../components/navigation/pagination-window.js'`.

- [ ] **Step 4: Extract `pages()` into a testable module and tokenize it**

`pages()` is currently a private function inside a `.jsx`, which a `node:test` suite cannot import. Extract it, which is the strategy CLAUDE.md already states for the Angular layer: *factor the logic into plain exported functions and test those*.

Create `frameworks/react/components/navigation/pagination-window.js`:

```js
import { limitPaginationSiblings } from '../../tokens.generated.js';

/* How many slots the elided form occupies: first + last + the current page and
 * its siblings on each side + two ellipses. Derived, never authored -- widen
 * --limit-pagination-siblings and the threshold must widen with it, or the
 * elided form is briefly WIDER than the full one it replaces. */
const threshold = () => 2 * limitPaginationSiblings + 5;

/** The page numbers to render, with '…' where the list elides.
 *  @param {number} current 1-based
 *  @param {number} total
 *  @returns {Array<number|'…'>} */
export function pageWindow(current, total) {
  if (total <= threshold()) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const from = Math.max(2, current - limitPaginationSiblings);
  const to = Math.min(total - 1, current + limitPaginationSiblings);
  if (from > 2) out.push('…');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
}
```

In `frameworks/react/components/navigation/Pagination.jsx`, delete the local `pages` function (lines 2–11) and import instead:

```js
import { pageWindow } from './pagination-window.js';
```

Then change the single call site from `pages(page, pageCount)` to `pageWindow(page, pageCount)`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `bun test frameworks/react/test/pagination-window.test.jsx`
Expected: PASS, 5 tests.

Run: `bun run test:react`
Expected: PASS, and the count grows by 5. That directory already holds five suites
(`activity-feed`, `app-logo`, `card`, `side-nav`, `unauth-card`), which assert on
`renderToStaticMarkup` output rather than on a DOM.

- [ ] **Step 6: Confirm no behaviour changed and the orphan gate is now green**

The token is 1 and the threshold derives to 7, which is what the code did before. Verify:

Run:
```bash
bun -e 'import("./frameworks/react/components/navigation/pagination-window.js").then(m => { console.log(JSON.stringify(m.pageWindow(1,7))); console.log(JSON.stringify(m.pageWindow(10,20))); })'
```
Expected: `[1,2,3,4,5,6,7]` and `[1,"…",9,10,11,"…",20]`.

Run: `bun scripts/check-script-tokens.mjs`
Expected: **PASS** — every flagged token now has an importer. All five are imported by React alone, which the "at least one layer" rule permits, and correctly: Angular has no `Tooltip`, no `Toast` and no `Pagination` primitive.

Run: `bun run check:dimensions && bun run build:demos && bun run check:demos`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add frameworks/react/components/navigation/ frameworks/react/test/
git commit -m "refactor(Pagination): the sibling count is a token, and the elision threshold derives from it

pages() hid two numbers and named neither. current -1/+1 is a sibling count of
one; total <= 7 is the threshold below which every page shows. They are not
independent -- with one sibling either side the elided form occupies exactly
first + last + three + two ellipses = seven slots, so widening the siblings
without widening the threshold would make the elided form briefly wider than the
full one it replaces.

So one is authored and the other is derived, the call catSlots already made:
--limit-pagination-siblings is the decision, 2 * siblings + 5 is its consequence.

pages() moves to pagination-window.js as an exported pageWindow() so a node:test
suite can reach it -- the same 'factor the logic into plain exported functions'
strategy CLAUDE.md states for the Angular layer. No rendered output changes: the
token is 1 and the threshold derives to 7."
```

---

### Task 5: Documentation and the completion gate

**Files:**
- Modify: `CLAUDE.md`, `CHANGELOG.md`

- [ ] **Step 1: Document the behaviour layer in CLAUDE.md**

In `CLAUDE.md`, immediately after the paragraph beginning **"A third thing lives in the composition layer as of the script-readable target"**, add:

```markdown
**Behaviour has values, and they are tokens like any other.** `tokens/src/behaviour.json`
holds `delay` (pointer intent), `dismiss` (how long a transient notice lives) and
`limit` (quantity invariants). All are script-readable, because their consumers are
`setTimeout` arguments and array bounds rather than CSS properties. Two rules govern
what belongs there. **A behaviour value is a decision the system makes, not a
mechanism** — `--delay-open` is how long a tooltip waits, and that is a design
decision; a debounce interval on a synchronous in-memory filter is not, which is why
`debounce` was proposed and deliberately not shipped. And **a value is not a
contract**: which keys a dialog answers, where focus lands, what dismisses it — none
of that is expressible as a token, none of it lives in `tokens/`, and DTCG does not
model it. That layer is designed in
`docs/superpowers/specs/2026-07-22-7-behaviour-tokens-and-contracts-design.md` and
is not built yet.
```

- [ ] **Step 2: Record what this plan deliberately left undone**

In `CLAUDE.md`, under **`## Known debt`**, add to the bullet list:

```markdown
- **`Tooltip` is not keyboard-reachable, and now it also waits.** It has
  `onMouseEnter`/`onMouseLeave` and no `onFocus`/`onBlur`, so a keyboard user
  never sees it at all. Plan 7a added a pointer-intent delay and did not fix
  this — deliberately, because it is contract work rather than a value. When it
  is fixed, **the focus path must reveal immediately**: routing focus through
  `--delay-open` would make a control that is already hard to reach also feel
  broken. The token's own `$description` says so.
- **Two behaviour families were proposed and not shipped**, and the reasons
  should be re-read before anyone adds them. `debounce` is speculative:
  `CommandPalette` filters a local array synchronously and `ResizeObserver`
  already coalesces, so debouncing either adds latency and removes nothing.
  `limit.results` would introduce a palette result cap that does not exist
  today, which is a product decision with a UX consequence rather than a
  tokenization of an existing value.
```

- [ ] **Step 3: Add the changelog entry**

In `CHANGELOG.md`, under `## [Unreleased]`:

```markdown
### Added
- **Behaviour values are tokens.** `tokens/src/behaviour.json` holds `delay` (pointer intent), `dismiss` (transient-notice permanence) and `limit` (quantity invariants) — five script-readable tokens, emitted both as custom properties and as numbers JavaScript reads.

### Fixed
- **`Tooltip` no longer flashes when a pointer crosses it.** It waits `--delay-open` before appearing and `--delay-close` before withdrawing. This changes behaviour deliberately: the tooltip used to appear instantly.
- **The Delivery Console honours `persist`.** It ignored the prop entirely, so a toast marked "does not auto-dismiss" was dismissed anyway after 4.2 seconds.

### Changed
- The console's hard-coded `4200` is `--dismiss-default`, and a toast carrying an action gets `--dismiss-actionable` instead (WCAG 2.2.1).
- `Pagination`'s sibling count is `--limit-pagination-siblings`; its elision threshold derives from it as `2 * siblings + 5` rather than being a second hard-coded `7`. No rendered output changes.
```

- [ ] **Step 4: Run the completion gate**

Run: `bun run check`

Expected: all 18 gates PASS plus the test suite. `check:cards`, `check:vendor` and `check:demos` may report SKIP with the run marked INCOMPLETE if their runtime dependencies are missing; **no gate may FAIL**.

If `check:cards` fails on a tooltip or pagination specimen, a change altered a rendered size — report it rather than adjusting the declared viewport. Note that `check:cards` renders statically and does not hover, so it will not exercise the tooltip delay.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: behaviour has values now, and CLAUDE.md says which ones and why not the others

The layer contract paragraph gains behaviour values beside the script-readable
target they ride on, with the two rules that govern what belongs there: a
behaviour value is a decision the system makes rather than a mechanism, and a
value is not a contract -- which keys a dialog answers is not expressible as a
token and does not live in tokens/.

Known debt gains two entries. Tooltip is still not keyboard-reachable and now
also waits, which makes fixing it more urgent rather than less, and the fix must
not route focus through the pointer delay. And the two families that were
proposed and rejected are recorded with their reasons, so the next reader has to
argue with them rather than rediscover them."
```

---

## Self-review

**Spec coverage.** This plan implements the spec's §2 (the value layer) in full, minus two families rejected on calibration evidence the spec explicitly asked for — see *Calibration*. §3's mechanism needs no work: plan 5.5 shipped it. §§4–8 (patterns, bindings, the three verification levels, the `components-divergences.md` split) are **not** in this plan and are 7b's subject, declared under *Scope*.

**Open questions answered here.** 2 (the numbers, calibrated — and two families dropped), 3 (`limit` is one family, because the member that made it look like two is not shipping). Open questions 4–9 are all contract-layer and belong to 7b, except **7 (`SideNav`), which this plan answers early and sharply**: there is no `arena-side-nav` primitive at all, so 7b needs a third binding form, `delegated`, and it is not a special case.

**What this plan does NOT promise.** Plan 5.5 could say *no rendered value changed*. This one cannot, and says so twice: `delay` is new behaviour. `dismiss` and `limit` are relocations and do not change output.

**Placeholder scan.** No TBD, no "add error handling", no "similar to Task N". Every code step carries the code.

**Type consistency.** `pageWindow(current, total)` is defined in Task 4 and used only there and in its suite. The five generated export names used in Tasks 2–4 — `delayOpen`, `delayClose`, `dismissDefault`, `dismissActionable`, `limitPaginationSiblings` — are exactly the camelCase forms of the tokens authored in Task 1.

**Verified while writing, so the implementer does not have to.** The console genuinely
does not reference `persist` (`grep -c persist … ` returns 0), so Task 3's bug claim is
sound — but Task 3 still asks for the check, because a commit message asserting a bug
should rest on a command someone ran. `Tooltip.prompt.md` genuinely has no Do/Don't
section, and Task 2 now says so rather than assuming README's H10 shape.
`frameworks/react/test/` genuinely exists with five suites, so Task 4 adds to a suite
rather than founding one.
