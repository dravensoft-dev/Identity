# Plan 8C4 — the `dialog-modal` family, and Plan C's last four contracts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Meet the `dialog-modal` pattern in React for the first time — across `Dialog`,
`ConfirmDialog` and `Onboarding` — and bring Plan C's last four subjects under the API contract.

**Architecture:** One shared React hook, `frameworks/react/use-dialog-modal.js`, mirroring the
already-shipped and already-tested `frameworks/angular/primitives/focus-trap.ts`, consumed by all
three overlays. Then four single-layer contracts written against markup the first half has settled.

**Tech Stack:** Bun (test + build), React 18 with inline style objects, `@happy-dom/global-registrator`
for the DOM suites, DTCG tokens, Angular 20 zoneless for the one primitive that moves.

Spec: `docs/superpowers/specs/2026-07-25-8c4-dialog-modal-and-the-last-four-contracts-design.md`.
Branch: `api-contracts-8c4`, cut from `8bd6388` (main; the 8C3 merge).

---

## Global Constraints

1. **English only**, everywhere in the repo. No emoji. No gradients.
2. **`check:api` climbs and never drops:** 42/62 → **46/66**, one contract and one layer per
   contract task. `ConfirmDialog` and `Onboarding` move a member's required-ness in contracts that
   already ship and add **nothing** to the ladder.
3. **A commit message containing a backtick is written with a quoted here-doc**, never
   `git commit -m "…"`. A backtick in a double-quoted shell string opens command substitution and is
   silently spliced away. Use `git commit -q -F - <<'MSG' … MSG` and verify with
   `git log -1 --format=%B`. **`git merge` does not accept `-F -`** — use `--no-commit`, then commit.
4. **`bun run check` runs ONCE, in the close-out.** Individual gates run per task.
5. **No new gate.** `dialog-modal.test.jsx`'s own header refuses a browser-driven gate as *"this
   repo's fourth non-portable gate"*. Chromium verification in this plan is a **probe and a written
   checklist**, never a `check:*` step, exactly as the grid rule works.
6. **A dimension in a framework layer is a token or a derivation of tokens.** `check:dimensions`
   after touching any `.jsx`.
7. **Retiring an exception requires proof above it in the same change.** Never a wholesale deletion.
8. **A required member that cannot be defaulted gets a runtime guard**, the
   `SegmentedControl.ariaLabel` shape: `if (!x) throw new Error('Component: \`x\` is required');`.
9. **Constraint 9 (carried from 8C1–8C3):** a type a component's `.d.ts` declared locally before
   migration keeps a re-export from `api.generated`.
10. **No per-item renderer.** A function returning a node is not a member. The reader throws on one.
11. **Do not touch `CHANGELOG.md` or `CLAUDE.md` before the close-out task.**

---

## What this plan measured before it was written

Read off the tree at `8bd6388`. Do not re-derive; do verify anything you are about to depend on.

### The `dialog-modal` bindings

| component | layer | exceptions |
|---|---|---|
| `Dialog` | React | `roles.label`, `focus.onOpen`, `focus.onClose`, `focus.trap`, `keyboard.Escape` |
| `ConfirmDialog` | React | those five, plus `roles.element` |
| `Onboarding` | React | those five |
| `arena-confirm-dialog` | Angular | `roles.element` alone |
| `arena-onboarding` | Angular | **none** |

### The four remaining surfaces, from `reactSurface()`

- **`Dialog`** — 7 members, `heritage: []`, no platform type. `open` (required boolean), `onClose`
  (event, no payload), `title`, `eyebrow` (strings), `children`, `footer` (slots), `width`.
  **`width` is declared `number` in the `.d.ts` and defaults to the string
  `'calc(var(--sp-1) * 120)'` in the `.jsx`.** The declaration is wrong today.
- **`Menu`** — `trigger` (required slot), `items` (required array of `MenuItemDef`), `align`
  (inline enum `start end`), `style` (R4). `MenuItemDef` declares `icon?: React.ReactNode` and
  `onClick?: () => void`, both illegal as fields of a predefined object under R1.
- **`Pagination`** — `page`, `pageCount` (required numbers), `onChange` (event, number payload),
  `style` (R4).
- **`SideNav`** — **throws**: `onNav?: (id: string, event: React.MouseEvent) => void` declares two
  parameters where an event takes one payload. Also `extends React.HTMLAttributes<HTMLElement>` —
  the batch's only D1 flatten. `SideNavItem` has the same R1 problem (`icon`, `label` are
  `React.ReactNode`). `ariaLabel` is optional and its own doc says *"Required in practice"*.

### What `focus.trap` can and cannot be proven by, and this bounds Task 2

`dialog-modal.test.jsx`'s header states it: **happy-dom does not implement sequential focus
navigation**, so a Tab keydown does not move `document.activeElement`, and a test asserting focus
did not move *"would pass identically against a component with a perfect trap and one with none."*

**The distinction the plan turns on, and it is not in that header:** a boundary wrap is an explicit
`.focus()` call made by our own handler, and happy-dom honours `.focus()`. So:

- **PROVABLE in a suite:** Shift+Tab on the first focusable lands on the last; Tab on the last lands
  on the first; a container with no focusable traps the key. These are our code calling `.focus()`.
  This is exactly how `frameworks/angular/test/onboarding-focus-trap.test.ts` proves the Angular
  side, and it is the technique to copy.
- **NOT PROVABLE in a suite:** that Tab from a *middle* element reaches the next one. That is the
  browser's native sequential navigation, which we do not implement and happy-dom does not have.
  It is verified in Chromium by probe and recorded in a prompt checklist.

So `focus.trap` **can** be flipped to `true` with real proof — for the half we implement.

---

## File Structure

**Created**

- `frameworks/react/use-dialog-modal.js` — the shared hook. Focus-in on open, boundary-wrapping Tab
  trap, Escape to the component's own dismissal channel, focus restore on close. Four exported
  pure helpers plus one hook, so the helpers are testable without a render.
- `frameworks/react/test/use-dialog-modal.test.jsx` — DOM-free tests of the pure helpers.
- `frameworks/react/test-dom/onboarding-modal.test.jsx` — `Onboarding`'s compliance suite.
- `api/components/Dialog.json`, `Menu.json`, `Pagination.json`, `SideNav.json`.
- `api/types/menu-item.json`, `side-nav-item.json`, `menu-align.json`.

**Modified**

- `frameworks/react/components/feedback/Dialog.jsx`, `ConfirmDialog.jsx`, `Onboarding.jsx` and their
  `.behaviour.json`, `.d.ts`, `.prompt.md`.
- `frameworks/react/test-dom/behavioural.test.jsx` — the seven pinned assertions invert.
- `frameworks/react/test-dom/dialog-modal.test.jsx` — the `BEHAVIOURAL` map and its long header.
- `scripts/check-compliance.mjs` — `COVERED` gains `Onboarding:react`.
- `api/components/ConfirmDialog.json`, `api/types/onboarding-step.json` — required-ness only.
- `frameworks/angular/primitives/confirm-dialog/confirm-dialog.ts` and, if Task 1 decides so,
  `onboarding/onboarding.ts` — a required signal input.
- `frameworks/react/components/navigation/Menu.jsx`, `Pagination.jsx`, `SideNav.jsx` + quartets.

---

## Task 0: Pre-flight

- [ ] **Step 1: Confirm the baseline**

```bash
cd /home/juan/Dravensoft/Identity
git status --short                       # empty
git rev-parse --abbrev-ref HEAD          # api-contracts-8c4
bun run check:api                        # 42 contract(s) ... 62 layer implementation(s)
bun run check:compliance                 # 6 of 66
bun test scripts frameworks/react/test/ frameworks/angular/test   # 1145 across 101
bun run test:react-dom                   # 36 across 6 — NOT `bun test <dir>`, it needs the preload
```

Record each in `.superpowers/sdd/progress.md`. If any differs, stop and find out why before writing
a line of code.

---

## Task 1: The cross-cutting blocking audit

**Files:** none — this task writes no code.

**Interfaces:** produces three decisions every later task depends on.

- [ ] **Step 1: Re-run the surface probe** against the four, using `reactSurface()` from
  `scripts/lib/api-surface.mjs` with the interface name `<Name>Props`. Report each member's form and
  required-ness, and confirm `SideNav` still throws on `onNav`.

- [ ] **Step 2: Present three decisions and STOP.** Each changes work in a later task, and none may
  be taken by the implementer alone.

**Decision 1 — does `OnboardingStep.title` become required?** `api/types/onboarding-step.json`
declares `eyebrow`, `title` and `body` all optional, and `Onboarding.jsx` sets
`aria-label={step.title}`, so an untitled step renders a dialog with no name. Requiring it retires
`roles.label` cleanly but is a **breaking change to a shipped two-layer contract** and moves
`arena-onboarding` too — a second Angular component in a Plan C batch. The alternative is a narrowed
`roles.label` exception naming the untitled-step case, which is the variant limit `Skeleton` and
`Table` already carry, for the third time. **The other four requirements retire either way.**

**Decision 2 — what replaces `SideNav.onNav`'s second parameter?** Today it is
`(id: string, event: React.MouseEvent) => void`, and its doc records why: an item with `href` is a
real anchor, so a single-page app calls `event.preventDefault()` and routes itself. An event takes
one payload and `React.MouseEvent` is an R4 platform type, so the current shape cannot be
contracted. Price the loss before choosing. Two shapes that are legal:
(a) `nav` carries the item's `id` alone, and the consumer prevents navigation by omitting `href` —
which changes what the item renders; (b) `SideNavItem` gains a `href`-less variant and the consumer
decides per item, with no event object anywhere.

**Decision 3 — what happens to `MenuItemDef.onClick`?** R1 admits only primitives and enums as
fields of a predefined object, so a per-item callback cannot stay. This is the `ToastAction` problem
at array level. `Toast` decomposed to `actionLabel` + `action`; a menu has N items, so the analogous
shape is a single `select` event on `Menu` carrying the activated item's `id`, with `MenuItemDef`
gaining a required `id`. Confirm that, or name a different one.

Also report: `Dialog.d.ts` declares `width?: number` while `Dialog.jsx` defaults it to the string
`'calc(var(--sp-1) * 120)'`. The contract must declare `string`, and the `.d.ts` is what is wrong.

---

## Task 2: `use-dialog-modal.js` — the shared hook

**Files:** create `frameworks/react/use-dialog-modal.js` and
`frameworks/react/test-dom/use-dialog-modal.test.jsx`. **The suite goes in `test-dom/`, not in
`test/`**: it asserts on `document.activeElement`, which needs a real DOM. The directory is
permitted because none of these components binds `grid`.

**Interfaces:** produces `focusableElements(container)`, `focusFirstFocusable(container)`,
`trapTabKey(container, event, activeElement)` and `useDialogModal({ open, panelRef, onDismiss })`.
Tasks 3, 4 and 5 consume the hook; nothing else does.

> **This mirrors `frameworks/angular/primitives/focus-trap.ts` deliberately.** Read that file first.
> Its four exports are already argued, already tested, and already carry the two hard-won details
> below. Do not redesign them for React; port them.

- [ ] **Step 1: Write the failing tests**

In `frameworks/react/test-dom/use-dialog-modal.test.jsx`. Every assertion below reads
`document.activeElement`, so the SSR directory cannot hold them.

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { focusableElements, focusFirstFocusable, trapTabKey } from '../use-dialog-modal.js';

/* Hand-built trees, no render. This is the technique Angular's
 * onboarding-focus-trap.test.ts uses, and it is why the helpers are exported as
 * pure functions of a container rather than living inside the hook. */
function panelWith(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

test('focusableElements skips a native control marked tabindex="-1"', () => {
  const p = panelWith('<button>a</button><button tabindex="-1">b</button><button>c</button>');
  assert.deepEqual(focusableElements(p).map((e) => e.textContent), ['a', 'c']);
});

test('focusableElements skips a disabled control', () => {
  const p = panelWith('<button>a</button><button disabled>b</button>');
  assert.deepEqual(focusableElements(p).map((e) => e.textContent), ['a']);
});

test('focusFirstFocusable falls back to the panel itself when it has none', () => {
  const p = panelWith('<p>text only</p>');
  p.setAttribute('tabindex', '-1');
  focusFirstFocusable(p);
  assert.equal(document.activeElement, p, 'a panel with no focusable child must take focus itself');
});

test('trapTabKey wraps Shift+Tab from the first focusable to the last', () => {
  const p = panelWith('<button>a</button><button>b</button><button>c</button>');
  const [first, , last] = focusableElements(p);
  first.focus();
  let prevented = false;
  trapTabKey(p, { key: 'Tab', shiftKey: true, preventDefault: () => { prevented = true; } }, first);
  assert.equal(prevented, true, 'the key at a boundary must be consumed');
  assert.equal(document.activeElement, last, 'Shift+Tab from the first did not wrap to the last');
});

test('trapTabKey wraps Tab from the last focusable to the first', () => {
  const p = panelWith('<button>a</button><button>b</button><button>c</button>');
  const [first, , last] = focusableElements(p);
  last.focus();
  trapTabKey(p, { key: 'Tab', shiftKey: false, preventDefault: () => {} }, last);
  assert.equal(document.activeElement, first, 'Tab from the last did not wrap to the first');
});

test('trapTabKey leaves a middle element alone -- the browser does that part', () => {
  const p = panelWith('<button>a</button><button>b</button><button>c</button>');
  const [, middle] = focusableElements(p);
  middle.focus();
  trapTabKey(p, { key: 'Tab', shiftKey: false, preventDefault: () => {} }, middle);
  assert.equal(document.activeElement, middle,
    'the trap must not move focus off a middle element -- native sequential navigation owns that');
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test --preload ./frameworks/react/test-dom/preload.js frameworks/react/test-dom/use-dialog-modal.test.jsx
```

Expected: every test fails on `Cannot find module '../use-dialog-modal.js'`.

- [ ] **Step 3: Write the module**

```js
/* The React half of Arena's modal focus contract, and a deliberate mirror of
 * frameworks/angular/primitives/focus-trap.ts -- same selector, same wrap rule,
 * same open/close transition. Two layers solving this differently is how
 * components-divergences.md fills up, and Angular's version is the one that
 * already ships with a suite behind it.
 *
 * Exported as pure functions of a container, not as hook internals, because a
 * hand-built tree is testable and a rendered overlay under happy-dom largely is
 * not: happy-dom implements no sequential focus navigation, so only the boundary
 * wrap -- which is OUR .focus() call -- can be asserted. The interior of the trap
 * is the browser's and is checked in Chromium by hand. */
import { useEffect, useRef } from 'react';

/* Every natively-focusable clause excludes tabindex="-1" explicitly: a selector
 * list is OR'd, so `button:not([disabled])` alone would match a real
 * <button tabindex="-1"> regardless of the separate [tabindex] clause. Arena has
 * exactly that shape -- CalendarEvent's kebab is a real button held out of the
 * Tab order on purpose. */
const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Every focusable descendant of `container`, in DOM order. Computed fresh on
 *  every call, never cached: what counts as focusable changes while an overlay is
 *  open -- ConfirmDialog's confirm button toggles `disabled` as the user types
 *  into its require-text field. */
export function focusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
}

/** Moves focus to the first focusable descendant, or to `container` itself when
 *  it has none -- which is why every panel using this carries tabIndex={-1}. */
export function focusFirstFocusable(container) {
  const [first] = focusableElements(container);
  (first ?? container).focus();
}

/** Boundary wrap: Shift+Tab from the first focusable goes to the last, Tab from
 *  the last goes to the first, and a panel with nothing focusable consumes the
 *  key outright. A middle element is left alone deliberately -- native sequential
 *  navigation handles the interior and we must not fight it. */
export function trapTabKey(container, event, activeElement) {
  const focusables = focusableElements(container);
  if (focusables.length === 0) { event.preventDefault(); return; }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && activeElement === last) { event.preventDefault(); first.focus(); }
}

/** The whole contract for one overlay. `onDismiss` is the component's OWN
 *  dismissal channel -- Dialog's onClose, ConfirmDialog's onCancel, Onboarding's
 *  onSkip -- never a new member: Escape reports a dismissal the component already
 *  knows how to report, which is what Angular's arena-onboarding does with `skip`.
 *
 *  Returns the keydown handler the panel must carry. Focus-in and focus-restore
 *  run from an effect on `open`, so a re-render caused by anything other than
 *  `open` -- typing into a field inside the panel -- never steals focus back. */
export function useDialogModal({ open, panelRef, onDismiss }) {
  const restoreTo = useRef(null);

  useEffect(() => {
    if (open) {
      restoreTo.current = typeof document === 'undefined' ? null : document.activeElement;
      const panel = panelRef.current;
      if (panel) focusFirstFocusable(panel);
      return undefined;
    }
    const target = restoreTo.current;
    restoreTo.current = null;
    if (target && typeof target.focus === 'function') target.focus();
    return undefined;
  }, [open]);

  return (event) => {
    if (event.key === 'Escape') { event.preventDefault(); if (onDismiss) onDismiss(); return; }
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (panel) trapTabKey(panel, event, panel.ownerDocument.activeElement);
  };
}
```

- [ ] **Step 4: Run the tests and watch them pass**

```bash
bun test --preload ./frameworks/react/test-dom/preload.js frameworks/react/test-dom/use-dialog-modal.test.jsx
```

Expected: 6 pass.

- [ ] **Step 5: Prove the wrap tests discriminate.** Temporarily delete the `event.preventDefault();
  last.focus();` arm and re-run: the Shift+Tab test must fail on `activeElement` still being the
  first. Restore, and verify the file is byte-identical with `sha256sum`. Report both.

- [ ] **Step 6: Gates and commit**

```bash
bun run check:dimensions
bun run test:react-dom
```

Commit (here-doc): that the module mirrors Angular's, which half of the trap a suite can prove and
which half only a browser can, and that no new gate was added.

---

## Task 3: `Dialog` meets `dialog-modal`

**Files:** modify `frameworks/react/components/feedback/Dialog.jsx`, `Dialog.behaviour.json`,
`Dialog.prompt.md`, `frameworks/react/test-dom/behavioural.test.jsx`,
`frameworks/react/test-dom/dialog-modal.test.jsx`; regenerate the `.js` sibling.

**Interfaces:** consumes Task 2's `useDialogModal`. Produces the settled markup Task 6 contracts.
**Contracts nothing** — `check:api` stays 42/62.

> **Constraint 7 governs this task.** Every exception retired must have proof above it in the same
> change, and the proof is an assertion that used to say the opposite.

- [ ] **Step 1: Invert the three pinned assertions in `behavioural.test.jsx`, and watch them fail**

The three `Dialog` tests there assert the defect is still present. Each becomes its opposite, and
each keeps a comment saying what it used to pin. For example, the Escape one:

```jsx
test('Dialog closes on Escape -- keyboard.Escape is met', () => {
  /* This test asserted the opposite until plan 8C4: `assert.equal(closed, false)`,
   * pinning a real defect so it could not be fixed silently without the binding
   * following. The exception is retired in this same change, which is the whole
   * mechanism -- see this file's header. */
  let closed = false;
  const container = mount(<Dialog open onClose={() => { closed = true; }} title="Delete project"><p>Body</p></Dialog>);
  keydown(container.querySelector('[role="dialog"]'), 'Escape');
  assert.equal(closed, true, 'Escape did not reach the dialog\'s own dismissal channel');
});
```

Do the same for *"moves focus nowhere on open"* → focus lands on the first focusable inside the
panel, and *"does not restore focus to the invoker on close"* → it does.

```bash
bun test --preload ./frameworks/react/test-dom/preload.js frameworks/react/test-dom/behavioural.test.jsx
```

Expected: the three inverted `Dialog` tests FAIL. Quote the failure output in the report.

- [ ] **Step 2: Add a fourth test for the trap's provable half**

```jsx
test('Dialog wraps Shift+Tab from the first focusable to the last -- focus.trap is met', () => {
  const container = mount(
    <Dialog open onClose={() => {}} title="Delete project"
      footer={<><button>Cancel</button><button>Delete</button></>}><p>Body</p></Dialog>,
  );
  const panel = container.querySelector('[role="dialog"]');
  const buttons = panel.querySelectorAll('button');
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  first.focus();
  keydown(first, 'Tab', { shiftKey: true });
  assert.equal(document.activeElement, last, 'Shift+Tab at the first boundary did not wrap');
});
```

**`keydown` must forward `shiftKey`.** Check the helper at the top of `behavioural.test.jsx` and
extend it if it does not; say which in the report.

- [ ] **Step 3: Implement in `Dialog.jsx`**

Four changes, and nothing else:

```jsx
const panelRef = useRef(null);
const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onClose });
const titleId = useId();
```

- the panel `<div>` gains `ref={panelRef}`, `tabIndex={-1}`, `onKeyDown={onKeyDown}` and
  `aria-labelledby={title ? titleId : undefined}`;
- the title `<div>` gains `id={titleId}`;
- `title` becomes **required with a guard** (Constraint 8), so `aria-labelledby` always resolves:
  `if (!title) throw new Error('Dialog: \`title\` is required');`
- nothing else moves. The scrim keeps its `onClick={onClose}`.

**`useId` is React 18 and safe under `renderToStaticMarkup`.** Do not hand-roll an id from
`Math.random()` — it would differ between server and client render.

- [ ] **Step 4: Run and watch the four pass**, then flip the `BEHAVIOURAL` map in
  `dialog-modal.test.jsx` — but **only the entries this task proves**, and note that the map is
  shared with `ConfirmDialog`'s test in the same file, so it cannot flip until Task 4 lands too.
  **Split the map into two, one per component**, and say so in the report; a shared map that has to
  be true of both is what would force these two tasks to land as one.

- [ ] **Step 5: Retire all five exceptions** from `Dialog.behaviour.json` — `roles.label`,
  `focus.onOpen`, `focus.onClose`, `focus.trap`, `keyboard.Escape` — leaving
  `"exceptions": []`. Each has proof above it in this same change: the four behavioural ones from
  the inverted assertions and the new wrap test, and `roles.label` from the `aria-labelledby` the
  required `title` now guarantees, which `assertPattern` reads off the rendered element itself.

- [ ] **Step 6: Update `dialog-modal.test.jsx`'s header.** Its long comment argues at length that
  `focus.trap: false` rests on reading the source rather than on a proof, and that it *cannot* be
  promoted to a proof. **That argument is now half wrong and the correction matters more than the
  code**: the boundary wrap is our own `.focus()` call and is provable; the interior is native
  sequential navigation and is not. Rewrite the paragraph to say which half each is. **Keep the
  refusal of a browser-driven gate** — it is still right, and Constraint 5 depends on it.

- [ ] **Step 7: Gates and commit**

```bash
bun run check:behaviour
bun run check:compliance      # still 6 of 66 -- Dialog:react was already covered
bun run check:dimensions
bun run build:demos && bun run check:demos
bun run check:api             # 42/62, unchanged
bun run test:react-dom
git diff --stat -- '*.behaviour.json'   # ONE file, exceptions REMOVED
```

Commit (here-doc): which requirements are met, that `title` is now required and therefore breaking,
and that the trap's interior is checked in a browser rather than by a gate.

---

## Task 4: `ConfirmDialog` meets `dialog-modal`, in both layers

**Files:** modify `frameworks/react/components/feedback/ConfirmDialog.jsx`, its
`.behaviour.json`/`.d.ts`/`.prompt.md`, `behavioural.test.jsx`, `dialog-modal.test.jsx`,
`api/components/ConfirmDialog.json`,
`frameworks/angular/primitives/confirm-dialog/confirm-dialog.ts` and its suite; regenerate.

**Interfaces:** consumes Task 2's hook. **`check:api` stays 42/62** — `title` moves from optional to
required on both sides at once, so the pair still agrees and no count changes.

> **This is the first Plan C batch task to touch an Angular component.** The contract and both layers
> move in ONE commit. `check:api` compares required-ness, so a half-moved pair fails the gate — which
> is the gate working, not a problem to route around.

- [ ] **Step 1: Invert `ConfirmDialog`'s four pinned assertions** in `behavioural.test.jsx` — Escape,
  focus-on-open-without-`requireText`, focus-on-close — and run them. Expected: FAIL.

  **Leave the fifth alone.** *"ConfirmDialog DOES focus the confirmation input when `requireText` is
  set"* already asserts a working behaviour, and the hook must not break it: `focusFirstFocusable`
  focuses the first focusable in DOM order, and the require-text `<input>` is exactly that. Verify
  it still passes rather than assuming; if the `autoFocus` attribute and the hook now both fire,
  remove the `autoFocus` and say so, because the HTML autofocus processing model skips it once the
  document's autofocus-processed flag is set — the reason Angular's own module records for never
  using a bare `autofocus`.

- [ ] **Step 2: Implement in `ConfirmDialog.jsx`**

```jsx
const panelRef = useRef(null);
const titleId = useId();
const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onCancel });
if (!title) throw new Error('ConfirmDialog: `title` is required');
```

The `<div role="alertdialog" aria-modal="true">` gains `ref={panelRef}`, `tabIndex={-1}`,
`onKeyDown={onKeyDown}` and `aria-labelledby={titleId}`; the title `<div>` gains `id={titleId}`.
`onDismiss` is `onCancel`, which is the component's own dismissal channel — Escape reports a
dismissal it already knows how to report, and no new member appears.

  **Do not add an `onClick` to the scrim.** Its inertness is deliberate and asserted:
  *"the scrim click is deliberately inert — ConfirmDialog does not close on click-outside"*. A
  destructive confirmation should not be dismissable by a stray click. That assertion stays as it is.

- [ ] **Step 3: Make `title` required in the contract and in BOTH layers**

`api/components/ConfirmDialog.json` — `"title": { …, "required": true }`.
`ConfirmDialog.jsx` — the guard from Constraint 8.
`confirm-dialog.ts` — `readonly title = input.required<string>();`

- [ ] **Step 4: Fix the Angular suite and the call sites.** Every `arena-confirm-dialog` fixture that
  omitted `title` now must pass one. Run `bun run check:angular` — `ngc --strictTemplates` is the
  authority that a required input is actually satisfied at every binding site.

- [ ] **Step 5: Retire the five exceptions** from `ConfirmDialog.behaviour.json`. **`roles.element`
  STAYS** — `role="alertdialog"` is deliberate, arguably more correct for a destructive
  confirmation, and the Angular primitive makes the same choice, so the layers agree. Retiring it
  would be a regression dressed as progress.

- [ ] **Step 6: Gates and commit**

```bash
bun run check:behaviour
bun run check:compliance
bun run check:api            # 42/62 -- required-ness moved on BOTH sides, so the pair still agrees
bun run check:angular
bun run test:react-dom
bun test frameworks/angular/test
```

Commit (here-doc): the breaking change, that it moved three files in two layers plus the contract in
one commit, and that `roles.element` stays and why.

---

## Task 5: `Onboarding` meets `dialog-modal`, and gains a suite

**Files:** modify `Onboarding.jsx`, its `.behaviour.json`/`.prompt.md`; create
`frameworks/react/test-dom/onboarding-modal.test.jsx`; modify `scripts/check-compliance.mjs`
(`COVERED`); possibly `api/types/onboarding-step.json` and `onboarding/onboarding.ts` per Task 1's
Decision 1. Regenerate.

**Interfaces:** consumes Task 2's hook. **`check:compliance` 6 of 66 → 7 of 66.**

- [ ] **Step 1: Write the compliance suite FIRST and watch it fail.** Model it on
  `dialog-modal.test.jsx` — an `assertPattern` call with a `behavioural` map, plus the behavioural
  tests that establish each verdict. `Onboarding` has no suite at all today, so this is the whole of
  its coverage.

```jsx
test('Onboarding matches its dialog-modal binding, in both directions', () => {
  const container = mount(
    <Onboarding open steps={[{ title: 'Welcome', body: 'Body' }]} index={0} onSkip={() => {}} />,
  );
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/Onboarding.behaviour.json'),
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: { 'focus.onOpen': true, 'focus.onClose': true, 'focus.trap': true, 'keyboard.Escape': true },
  });
});
```

- [ ] **Step 2: Implement**

```jsx
const panelRef = useRef(null);
const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onSkip });
```

The `<div role="dialog" aria-modal="true" aria-label={step.title}>` gains `ref={panelRef}`,
`tabIndex={-1}` and `onKeyDown={onKeyDown}`. **`onDismiss` is `onSkip`** — the channel Angular's
`arena-onboarding` already routes Escape to, so the two layers agree by construction rather than by
coincidence. `Onboarding` keeps `aria-label` rather than moving to `aria-labelledby`: its name comes
from the *current step's* title and changes as the tour advances, which an id reference cannot follow
without re-pointing on every step.

- [ ] **Step 3: Apply Task 1's Decision 1** for `roles.label`. If the step title became required,
  retire `roles.label` and move `api/types/onboarding-step.json` and `arena-onboarding` in this same
  commit, exactly as Task 4 moved `ConfirmDialog`'s pair. If it did not, keep `roles.label` with a
  reason naming the untitled-step case, and record the third instance of the variant limit.

- [ ] **Step 4: Register the coverage**

```js
  'Onboarding:react': 'onboarding-modal.test.jsx',
```

`COVERED` is keyed `<component>:<layer>`; a key without the suffix is rejected.

- [ ] **Step 5: Gates and commit**, the same list as Task 4, and expect `check:compliance` to print
  **7 of 66**.

---

## Task 6: `Dialog` — the API contract

**Files:** create `api/components/Dialog.json`; modify the quartet and every call site; regenerate.

**Interfaces:** consumes Task 3's settled markup. **+1/+1 → 43/63.**

- [ ] **Step 1: The contract**

```json
{
  "component": "Dialog",
  "description": "Modal dialog over a blurred scrim. Takes the whole interaction until dismissed.",
  "api": {
    "open": { "form": "primitive", "type": "boolean", "required": true, "description": "Whether the dialog is shown. The host owns it." },
    "title": { "form": "primitive", "type": "string", "required": true, "description": "Names the dialog for assistive technology and heads it visually. Required: aria-labelledby points at it, and a modal with no name is worse than none at all." },
    "eyebrow": { "form": "primitive", "type": "string", "description": "A short kicker above the title." },
    "width": { "form": "primitive", "type": "string", "description": "A CSS width for the panel. Omit for the default." },
    "content": { "form": "slot", "description": "The dialog's body." },
    "footer": { "form": "slot", "description": "The action row, right-aligned." },
    "close": { "form": "event", "description": "The dialog was dismissed -- by Escape or by a scrim click. No payload." }
  }
}
```

**`width` is `string`, not the `number` the `.d.ts` declares today** — Task 1 measured that the
implementation defaults it to `'calc(var(--sp-1) * 120)'`. The `.d.ts` is what is wrong.

- [ ] **Step 2: Migrate the quartet**, drop nothing else — `Dialog` has no heritage clause and no
  `style` member. Constraint 9 gives no re-export: `Dialog` declares no local type.

- [ ] **Step 3: Suite, R4 proofs, prompt, gates, commit.** The R4 proofs run twice, induced
  asymmetrically: once with a `style` merged into the panel's style object (only the STYLE assertion
  fails), once with a `{...rest}` spread added (only the ATTRIBUTE one fails). `Dialog.jsx` has
  neither today, so both runs are induced by ADDING one. sha256 byte-identical after restore.
  Expected: `check-api: 43 … across 63`.

---

## Task 7: `Menu` — the API contract

**Files:** create `api/types/menu-item.json`, `api/types/menu-align.json`, `api/components/Menu.json`;
modify the quartet and call sites; regenerate. **+1/+1 → 44/64.**

- [ ] **Step 1: Apply Task 1's Decision 3.** `MenuItemDef` cannot keep `onClick` (R1: a field is a
  primitive or an enum) and cannot keep `icon?: React.ReactNode` (R1, and the single-icon convention
  makes an icon a Phosphor class-name string Arena draws). Write `MenuItem` with the fields the
  decision settled — at minimum `id` (required string), `label`, `icon`, `shortcut`, `destructive`,
  `disabled`, `divider`, `header` — and `Menu.select` as an event carrying the activated `id`.

- [ ] **Step 2: `MenuAlign`** — `start`, `end`. **Compare it against every existing type in
  `api/types/` before adding it**, the way `SegmentedControlSize` was compared against all
  twenty-one; `PageHeadAlign` (`start`, `center`) is the near miss and the description should name it.

- [ ] **Step 3: The contract**, dropping `style` (R4). `trigger` stays a required slot — the
  consumer genuinely draws it, which is R2.

- [ ] **Step 4: Migrate, rewrite every call site's `onClick` into the `select` handler, suite, R4
  proofs, gates, commit.** Expected: `check-api: 44 … across 64`.

---

## Task 8: `Pagination` — the API contract

**Files:** create `api/components/Pagination.json`; modify the quartet and call sites; regenerate.
**+1/+1 → 45/65.**

- [ ] **Step 1: The contract**

```json
{
  "component": "Pagination",
  "description": "Page selector for a paged list. Renders a windowed range, never every page.",
  "api": {
    "page": { "form": "primitive", "type": "number", "required": true, "description": "The current page, 1-based." },
    "pageCount": { "form": "primitive", "type": "number", "required": true, "description": "How many pages there are." },
    "change": { "form": "event", "payload": "number", "description": "A page was chosen; carries the new 1-based page." }
  }
}
```

- [ ] **Step 2: Migrate the quartet**, dropping `style` (R4). Add runtime guards for `page` and
  `pageCount` per Constraint 8 — both are required and neither has a sensible default; a
  `Pagination` with no `pageCount` renders a window over nothing.

- [ ] **Step 3: Suite, R4 proofs, gates, commit.** Expected: `check-api: 45 … across 65`.

---

## Task 9: `SideNav` — the API contract, and the batch's only D1 flatten

**Files:** create `api/types/side-nav-item.json`, `api/components/SideNav.json`; modify the quartet
and call sites; regenerate. **+1/+1 → 46/66. This completes Plan C.**

> **`SideNav` is the one surface the reader THROWS on**, and it needs four fixes: the heritage
> clause flattens (D1); `onNav`'s two parameters become one payload per Task 1's Decision 2;
> `SideNavItem.icon`/`label` become strings under R1 and the single-icon convention; and `ariaLabel`
> becomes required per its own doc comment, which says *"Required in practice"*.

- [ ] **Step 1: Flatten the heritage clause.** `extends React.HTMLAttributes<HTMLElement>` goes.
  **Record what that costs**, the way 8C1–8C3 each did: every global and ARIA attribute the clause
  forwarded becomes unreachable, and no gate stands behind the loss — `check:api` reads the `.d.ts`
  and never opens the `.jsx`.

- [ ] **Step 2: `SideNavItem`** — `id` (required string), `label` (required string), `icon` (a
  Phosphor class-name string), `href` (string). Its `href` doc comment is load-bearing and must
  survive: present ⇒ an `<a>`, absent ⇒ a `<button>`.

- [ ] **Step 3: The contract**, with `ariaLabel` required and guarded, `items` a required array of
  `SideNavItem`, `active` a string, and `nav` the event Decision 2 settled. `style` drops (R4).

- [ ] **Step 4: Migrate, fix call sites, suite, R4 proofs, gates, commit.**
  Expected: `check-api: 46 contract(s) hold across 66 layer implementation(s)`. **Plan C is
  complete** — say so in the commit message.

---

## Task 10: Divergences and the citation sweep

**Files:** modify `components-divergences.md` (read first).

- [ ] **Step 1: Classify.** 906 lines at last measure; the seam is `## Per-component divergences`.
  **Measure it again — do not trust that figure.** `SideNav` has a real per-component section
  (*"SideNav is described three times, and only the colours agree"*) and this batch contracts
  `SideNav`, so it is the one most likely to have gone false. Classify each mention API (delete) /
  rendering (keep) / behaviour (keep).

- [ ] **Step 2: Citations.** `grep -rn "components-divergences" --include='*.json' --include='*.ts'
  --include='*.md' --include='*.jsx' . | grep -v node_modules`, then keep only the hits that quote a
  section **by name** — those are the ones a deletion breaks. The `SideNav` entry is cited by name
  from `frameworks/angular/behaviour-delegated.json`. A deletion must redirect it in the same change.

- [ ] **Step 3: Sweep for dead references** to every member this batch removed or renamed:
  `MenuItemDef` and its `onClick`, `SideNavItem`'s node-valued `icon`/`label`, `SideNav.onNav`'s
  event parameter, `Dialog.width` as a number, `style` on the four, and `title`/step-title
  required-ness. A hit in a contracted component is this task's to fix; a hit in `CHANGELOG.md` or
  `CLAUDE.md` is Task 11's — **record it, do not fix it.**

- [ ] **Step 4: Commit only if something changed.** Otherwise record "no change" in the ledger.

---

## Task 11: Close-out

**Files:** modify the spec, `CHANGELOG.md`, `CLAUDE.md`; delete the executed 8C3 plan and the
executed `tabStop` plan.

- [ ] **Step 1: Full sweep once**

```bash
cd /home/juan/Dravensoft/Identity
export CHROME_PATH=/usr/bin/chromium
bun run check
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun run test:react-dom 2>&1 | tail -3
```

Expected: all 23 steps PASS. Reconcile both counts against the ledger's per-task deltas. **Run it
again at the very end if any task after Step 1 changed code** — 8C3's close-out found that its own
Step 2 fixes postdated its sweep, and a close-out claiming 23/23 has to claim it of the final tree.

- [ ] **Step 2: Whole-branch review.** Read `git diff main...HEAD` against: do the four contracts
  agree on how an align enum is named and when an existing one is reused?; is every member
  `description` consistent across contract / `.d.ts` / `.prompt.md`?; is any new enum value-identical
  to an existing one?; did any suite weaken a title?; does the climb reconcile 42 → 43 → 44 → 45 →
  46?; are `style` and `{...rest}` gone from the four **in the `.jsx`**, not only in the `.d.ts`?; do
  all three overlays consume the same hook rather than one having drifted? Fix findings in their own
  commits.

- [ ] **Step 3: Verify the trap in real Chromium and write the checklist.** This is the half no
  suite can see. Serve with `bun run demos`, drive each of the three overlays, and confirm: Tab from
  a middle control reaches the next one; Tab at the last wraps to the first; Shift+Tab at the first
  wraps to the last; Escape dismisses; focus returns to the invoker. Write it into each component's
  `.prompt.md` as a *"Verifying the focus trap by hand"* section, modelled on
  `CalendarEvent.prompt.md`'s. **A rule that says "checked by hand" and produces no written checklist
  is a rule that says "not checked".**

  Probe gotcha carried forward: a raw `Input.dispatchKeyEvent` for Enter does not fire a button's
  activation; the keyDown needs `text: '\r'`.

- [ ] **Step 4: Spec.** Add the 8C4 running-count row (both processes) and a register paragraph:
  42/62 → 46/66, **Plan C complete**, the `dialog-modal` family met in React, and Plan D's subject
  set recounted rather than copied.

- [ ] **Step 5: CHANGELOG**, under `## [Unreleased]` only. **Read what is there first** — it already
  carries 972 lines from plans B through 8C3, so this completes a record rather than starting one.
  **Do not rewrite any released section.** A release is frozen the moment it is cut, because the
  plugin is served from the tag. Breaking changes to spell out: `Dialog.title`, `ConfirmDialog.title`
  and `SideNav.ariaLabel` required; `MenuItemDef.onClick` replaced by `Menu.select`; `SideNav.onNav`
  reshaped; node-valued `icon`/`label` now strings; `style` gone from the four.

- [ ] **Step 6: CLAUDE.md.** Record the shared hook and that React and Angular now solve the modal
  focus contract the same way. **Retire the debt entries this batch actually paid — verify each
  before deleting.** The `dialog-modal` half of the accessibility debt is the obvious one. Add new
  debt: whatever `roles.label` decision Task 1 took, the D1 flatten's unguarded loss, and the fact
  that the trap's interior is checked by a person.

- [ ] **Step 7: Delete the two executed plans**

```bash
git rm docs/superpowers/plans/2026-07-24-8c3-debt-paydown-keyboard-navigation-and-seven-contracts.md
git rm docs/superpowers/plans/2026-07-25-tabstop-and-the-grid-testing-rule.md
```

**Check each for debt living only there before deleting** — that is the failure `CLAUDE.md`'s Known
debt preamble names, and it has happened once already.

- [ ] **Step 8: Commit** (here-doc), append the batch summary to the ledger, report. **Do not merge,
  do not push.**

---

## Appendix A: what this plan deliberately does not do

- **It does not add a browser-driven gate.** `dialog-modal.test.jsx` refuses one as a fourth
  non-portable gate, and that refusal is still right. The trap's interior is checked by a person
  against a written checklist, the same arrangement the grid rule uses.
- **It does not fix `Tabs`**, which still binds `tabs` with all eight requirements excepted and
  becomes the largest untouched accessibility gap the moment this lands.
- **It does not make `Tooltip` keyboard-reachable.** When someone does, the focus path must reveal
  immediately and never through `--delay-open`.
- **It does not start Plan D.** Touching `arena-confirm-dialog` — and possibly `arena-onboarding` —
  is one or two components moving with their contracts, not the Angular layer being built.
- **It does not cut a release.**
