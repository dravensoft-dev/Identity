# `tabStop` and the grid-testing rule — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `Button` and `IconButton` a contracted way to leave the page's Tab sequence, use it to draw `CalendarEvent`'s kebab, and bring `frameworks/react/test-dom/` back minus the grid suites under a stated rule.

**Architecture:** A new boolean member `tabStop` (default `true`) is added to both button contracts; it writes `tabindex="-1"` when false and nothing when true. `CalendarEvent` gains `actionsEnabled` and an `actions` slot, drawing an Arena `IconButton` kebab with `tabStop={false}` and rendering the slot only while the panel is open. The deleted DOM test directory is restored from git except `grid-keyboard.test.jsx`, under a new rule tied to the behaviour contract: a component whose binding names the `grid` pattern is DOM-tested by hand.

**Tech Stack:** Bun (build + test), React 18, `renderToStaticMarkup` for the DOM-free suites, happy-dom + `bun test --preload` for the DOM suites, DTCG tokens, the `api/` contract layer with `check:api`.

**Spec:** `docs/superpowers/specs/2026-07-25-tabstop-and-the-grid-testing-rule-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only.** All code, comments, docs, contract `description`s, commit messages and UI copy are English. Conversation with the maintainer is Spanish; the repo is not.
2. **A commit message containing a backtick is written with a quoted here-doc**, never `git commit -m "…"` — a backtick inside a double-quoted shell string opens command substitution and is silently spliced away. Use `git commit -q -F - <<'MSG' … MSG` and verify with `git log -1 --format=%B`.
3. **Do not merge and do not push.** The branch stays local until the maintainer asks.
4. **`bun run check` runs exactly ONCE**, in Task 5. Individual gates run per task.
5. **`export CHROME_PATH=/usr/bin/chromium` before `bun run check`.** Without it `check:cards` SKIPs and the run reports INCOMPLETE, which reads as a failure of the change and is not.
6. **Any `.jsx`/`.entry.jsx` edit is followed by `bun run build:demos`, and the regenerated `.js` sibling is committed in the same commit.** Verify with `bun run check:demos`.
7. **A task opens by checking the tree is clean** (`git status --short`) and folds in what it finds rather than redoing it.
8. **`check:api` carries no exception map.** An API divergence is a defect.
9. **The binding table is mechanical** (`bindingName()` in `scripts/check-api.mjs`): a primitive/enum/object/array member `x` is a React prop `x`; the slot named `content` is React's `children`; a slot named `x` is a node-valued prop `x`; an event named `x` is a function prop `onX`.
10. **`check:api` reads the `.d.ts` and never opens the `.jsx`.** Every behavioural claim about the implementation needs a test, or it has no guard at all.
11. **`frameworks/react/test/` is DOM-free by design** and asserts on `renderToStaticMarkup`. Never add a DOM to it. `frameworks/react/test-dom/` is the DOM directory and needs its own `bun test` invocation with `--preload`.
12. **React's SSR does not emit attributes in source order and camelCases some of them.** Probe the real render before writing any regex; never assume adjacency.
13. **Line numbers in this plan are not load-bearing** — the quoted code identifies the site.

---

## File Structure

| Path | Responsibility | Task |
|---|---|---|
| `frameworks/react/test-dom/harness.jsx` | restored — mount/cleanup/act, throws without the preload | 1 |
| `frameworks/react/test-dom/preload.js` | restored — installs happy-dom before react-dom evaluates | 1 |
| `frameworks/react/test-dom/assert-pattern.jsx` | restored — the React binding to `comparePattern` | 1 |
| `frameworks/react/test-dom/{behavioural,dialog-modal,form-control-events,placement-and-branches,smoke,tooltip-timer}.test.jsx` | restored — the six non-grid suites | 1 |
| `scripts/check-compliance.mjs` | `SUITE_DIRS` regains the directory; `COVERED` regains four React entries and not `Calendar:react`; header states the grid rule | 1 |
| `scripts/check-all.mjs`, `scripts/check-all.test.mjs`, `package.json` | two `bun test` invocations again | 1 |
| `CLAUDE.md`, `CHANGELOG.md` | rewritten for the end state, which is not the state before the deletion | 1 |
| `api/components/IconButton.json`, `api/components/Button.json` | the `tabStop` member | 2 |
| `frameworks/react/components/forms/IconButton.{jsx,d.ts}` | `tabStop` implementation and declaration | 2 |
| `frameworks/react/components/forms/Button.{jsx,d.ts}` | same, symmetric | 2 |
| `frameworks/react/test/{icon-button,button}.test.jsx` | the only guard that `tabIndex` is really written | 2 |
| `api/components/CalendarEvent.json` | `actionsEnabled` + `actions` | 3 |
| `frameworks/react/components/display/CalendarEvent.{jsx,d.ts,prompt.md}` | the kebab and the panel | 3, 4 |
| `frameworks/react/test/calendar.test.jsx` | the static tab-stop count, and the panel's structure | 3 |
| `frameworks/react/components/display/calendar.card.entry.jsx` | a demonstration of the panel | 4 |

---

## Task 1: Restore the DOM suites minus the grid, and adopt the rule

**Files:**
- Restore: nine files under `frameworks/react/test-dom/` (NOT `grid-keyboard.test.jsx`)
- Restore: `frameworks/react/test/{breadcrumbs,checkbox,input,select,textarea,tooltip}.test.jsx`, `frameworks/angular/test/compliance.ts`
- Modify: `package.json`, `scripts/check-all.mjs`, `scripts/check-all.test.mjs`, `scripts/check-compliance.mjs`, `CLAUDE.md`, `CHANGELOG.md`

**Interfaces:**
- Produces: `mount`, `cleanup`, `act` from `./harness.jsx`; `assertPattern`, `REACT_COMPONENTS` from `./assert-pattern.jsx`. Later tasks do not consume them — every test this plan writes is DOM-free — but the directory must be green before anything else lands.

> The deletion is commit `edb9f3e`. Everything below restores from `edb9f3e^`, which is the tree immediately before it.

- [ ] **Step 1: Restore the nine files, excluding the grid suite**

```bash
cd /home/juan/Dravensoft/Identity
git checkout edb9f3e^ -- \
  frameworks/react/test-dom/harness.jsx \
  frameworks/react/test-dom/preload.js \
  frameworks/react/test-dom/assert-pattern.jsx \
  frameworks/react/test-dom/behavioural.test.jsx \
  frameworks/react/test-dom/dialog-modal.test.jsx \
  frameworks/react/test-dom/form-control-events.test.jsx \
  frameworks/react/test-dom/placement-and-branches.test.jsx \
  frameworks/react/test-dom/smoke.test.jsx \
  frameworks/react/test-dom/tooltip-timer.test.jsx
ls frameworks/react/test-dom/
```

Expected: nine files, and **no `grid-keyboard.test.jsx`**.

- [ ] **Step 2: Restore the six SSR headers and the Angular wrapper's comment**

Those six suites had their headers rewritten to say the DOM suites were gone; they point at files that now exist again. `frameworks/angular/test/compliance.ts` had a comment-only change saying it was the only remaining wrapper.

```bash
cd /home/juan/Dravensoft/Identity
git checkout edb9f3e^ -- \
  frameworks/react/test/breadcrumbs.test.jsx \
  frameworks/react/test/checkbox.test.jsx \
  frameworks/react/test/input.test.jsx \
  frameworks/react/test/select.test.jsx \
  frameworks/react/test/textarea.test.jsx \
  frameworks/react/test/tooltip.test.jsx \
  frameworks/angular/test/compliance.ts
```

Do **not** restore `frameworks/react/test/calendar.test.jsx` — it was not touched by the deletion, and it has moved twice since for unrelated reasons.

- [ ] **Step 3: Restore the three gate/config files, then re-apply what must survive**

```bash
cd /home/juan/Dravensoft/Identity
git checkout edb9f3e^ -- package.json scripts/check-all.mjs scripts/check-all.test.mjs scripts/check-compliance.mjs
```

That restores `Calendar:react` into `COVERED`, which is wrong: its suite is not coming back. Remove exactly that one line from `scripts/check-compliance.mjs`, leaving:

```js
export const COVERED = {
  'Dialog:react': 'dialog-modal.test.jsx',
  'ConfirmDialog:react': 'dialog-modal.test.jsx',
  'Menu:react': 'placement-and-branches.test.jsx',
  'Skeleton:react': 'placement-and-branches.test.jsx',
  'Alert:angular': 'alert-role-tones.test.ts',
  'BarChart:angular': 'chart-data-table.test.ts',
};
```

- [ ] **Step 4: State the rule in the gate that can see it**

`scripts/check-compliance.mjs`'s header currently describes the React layer as having no render suite at all. Replace that passage with the rule, written so a reader learns why `Calendar` is absent from a directory that otherwise covers React:

```js
/* THE REACT LAYER HAS RENDER SUITES AGAIN, WITH ONE COMPONENT-SHAPED HOLE.
 * frameworks/react/test-dom/ was deleted and restored; what did not come back
 * is grid-keyboard.test.jsx, and the rule that keeps it out is stated here
 * because this is the gate that can see its consequence:
 *
 *   A component whose behaviour binding names the `grid` pattern is
 *   DOM-tested BY HAND -- `bun run demos`, then operate the component on its
 *   own *.card.html page.
 *
 * The rule is tied to the BINDING rather than to a judgement about what looks
 * like a grid, so it is a grep rather than an argument, and so a component that
 * becomes a grid later inherits it without anyone remembering. Today it selects
 * exactly Calendar and Table.
 *
 * It exists because of a measurement, not a preference. grid-keyboard.test.jsx
 * alone peaked at 164 MiB while the other six suites together peaked at 109 --
 * the grid cost more than everything else combined, because its fixture is 84
 * cells per mount, eight mounts, and 160 key events dispatched through act().
 *
 * The price is that Calendar's binding claims "exceptions": [] -- full
 * compliance with the grid pattern -- with no suite behind it, and cannot be
 * listed in COVERED. What guards it instead is a STATIC assertion in
 * frameworks/react/test/calendar.test.jsx: a grid is one tab stop, and that
 * count is a property of the markup rather than of behaviour. */
```

- [ ] **Step 5: Run the restored directory**

```bash
cd /home/juan/Dravensoft/Identity
bun run test:react-dom
```

Expected: **32 pass, 0 fail, across 6 files.** That is the pre-deletion figure of 40/7 minus `grid-keyboard.test.jsx`'s 8 tests.

If it errors with `frameworks/react/test-dom needs its DOM installed before react-dom is evaluated`, the `--preload` argument did not survive the restore of `package.json` — that error is the harness working as designed, not a bug.

- [ ] **Step 6: Run the gates that moved**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:compliance
bun test scripts/check-all.test.mjs
bun test scripts frameworks/react/test/ frameworks/angular/test
```

Expected: `check:compliance` reports **6 of 64 bindings**; `check-all.test.mjs` passes with the two-step assertion restored; the merged run is green.

- [ ] **Step 7: Rewrite `CLAUDE.md`**

The deletion left 18 hunks across `CLAUDE.md`. **Do not revert them** — the end state is not the state before the deletion, because `Calendar` loses its suite permanently and by decision. Rewrite each site so it states the end state:

- The *Architecture* passage on the two test directories: React has two directories again, and the second one excludes grid components by rule.
- The `--preload` passage: it is live again and unchanged. Keep every word of the `canUseDOM` reasoning — it cost a day to find and is not negotiable.
- The *Known debt* entry titled around the deleted render suites: rewrite it as the **grid rule** and its price. What is still not machine-checked is `Calendar`'s keyboard navigation, and now `Table`'s when Task 12 lands. What IS checked again is everything the six restored suites covered.
- Any sentence asserting "there is no React render suite any more" is now false. Find them with `grep -n "test-dom\|render suite" CLAUDE.md` and read every hit.

- [ ] **Step 8: Rewrite the CHANGELOG entry**

`CHANGELOG.md` line ~703, under `## [Unreleased]` → `### Removed`, describes the whole directory going. The net change from the last release is narrower: one suite is gone and a rule was adopted. Replace that entry with one that says so, and name what is no longer proved — `Calendar`'s roving tab stop, its four-edge clamp, Home/End within a day column, and Enter/Escape into and out of an event chip — plus the rule and the measurement behind it.

- [ ] **Step 9: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -q -F - <<'MSG'
test(react): restore the DOM suites, minus the grid, under a stated rule

`frameworks/react/test-dom/` was deleted in edb9f3e for its RAM cost. That was
decided in haste and is reversed here, minus one suite and with a rule.

The measurement is what makes this the right cut, and it was taken before the
deletion: `grid-keyboard.test.jsx` alone peaked at 164 MiB while the other six
suites together peaked at 109. The grid cost more than everything else combined,
because its fixture is 84 cells per mount, eight mounts, and 160 key events
dispatched through act(). The directory was never the problem; the grid was.

THE RULE: a component whose behaviour binding names the `grid` pattern is
DOM-tested BY HAND, with `bun run demos` and its own *.card.html page. Tied to
the binding rather than to a judgement about what looks like a grid, so it is a
grep rather than an argument, and so a component that becomes a grid later
inherits it without anyone remembering. Today it selects exactly Calendar and
Table.

Back: the harness, the preload, the compliance wrapper and six suites. Not back:
`grid-keyboard.test.jsx`. `check:compliance` returns to 6 of 64 -- four React
entries return and `Calendar:react` does not, by decision rather than by
accident.

The `--preload` reasoning is restored verbatim and stays non-negotiable:
react-dom decides at its own module evaluation whether `input` is supported, so
a DOM installed any later latches the legacy change-detection polyfill and a
dispatched `input` reaches a handler zero times, silently. harness.jsx still
throws rather than installing a fallback.

CLAUDE.md and the CHANGELOG are rewritten rather than reverted: the end state is
not the state before the deletion. What stays unproved is Calendar's keyboard
navigation -- its binding claims "exceptions": [] with nothing behind it -- and
what guards it instead is a static tab-stop count in the DOM-free suite, added
in a later task of this plan.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | grep -c '`'
```

---

## Task 2: `tabStop` on `IconButton` and `Button`

**Files:**
- Modify: `api/components/IconButton.json`, `api/components/Button.json`
- Modify: `frameworks/react/components/forms/IconButton.{jsx,d.ts}`, `frameworks/react/components/forms/Button.{jsx,d.ts}`
- Modify: `frameworks/react/test/icon-button.test.jsx`, `frameworks/react/test/button.test.jsx`

**Interfaces:**
- Produces: `tabStop?: boolean` on `IconButtonProps` and `ButtonProps`. Task 3 consumes it as `<IconButton … tabStop={false} />`.

> Both components ship in one commit. The symmetry is the maintainer's reason for adding it to `Button`, and splitting the task invites one landing without the other.

- [ ] **Step 1: Write the failing tests**

Add to `frameworks/react/test/icon-button.test.jsx`:

```jsx
/* `tabStop` is the second global attribute Arena admits as a member, after
 * `id`, and it passes the same test api/README.md states for that one: the D1
 * flatten removed the capability, and there is no other surface a host can
 * write it on. An <arena-icon-button> host attribute would land on the custom
 * element, not on the <button> inside it.
 *
 * check:api reads the .d.ts and never opens the .jsx, so these two tests are
 * the ONLY guard that the attribute is really written. */
test('tabStop defaults to true and emits no tabindex at all', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="Add" />);
  assert.doesNotMatch(html, /tabindex/i, 'a default IconButton wrote a tabindex it does not need');
});

test('tabStop={false} takes the control out of the page Tab sequence', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="Add" tabStop={false} />);
  assert.match(html, /tabindex="-1"/, 'tabStop={false} did not write tabindex="-1"');
});

test('tabStop is not forwarded to the DOM as an unknown attribute', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="Add" tabStop={false} />);
  assert.doesNotMatch(html, /tabstop/i, 'the tabStop prop leaked into the markup');
});
```

Add the same three to `frameworks/react/test/button.test.jsx`, with `<Button>Save</Button>` as the element and the message wording changed from `IconButton` to `Button`.

- [ ] **Step 2: Run them and watch them fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/icon-button.test.jsx frameworks/react/test/button.test.jsx
```

Expected: the two `tabStop={false}` tests FAIL (no `tabindex="-1"` in the markup). The two default tests and the two leak tests PASS already — they are regression guards, not drivers, and a test that passes before the change is worth keeping only when it can fail after it. These can: an implementation writing `tabIndex={tabStop ? 0 : -1}` breaks the first, and one spreading the prop breaks the third.

- [ ] **Step 3: Implement in both `.jsx` files**

`frameworks/react/components/forms/IconButton.jsx` — add to the destructuring and to the element:

```jsx
export function IconButton({
  icon, label, size = 'md', variant = 'ghost', showLabel = false, disabled = false,
  type = 'button', name, value, autoFocus = false, form, onClick, tabStop = true,
}) {
```

```jsx
    <button type={type} name={name} value={value} autoFocus={autoFocus} form={form} onClick={onClick}
      /* undefined rather than 0: a native <button> is already reachable, and an
         explicit tabindex="0" would be an attribute that means nothing and that
         every assertion about this markup would have to step around. */
      tabIndex={tabStop ? undefined : -1}
      aria-label={label} title={showLabel ? undefined : label} disabled={disabled}
```

`frameworks/react/components/forms/Button.jsx` — the same two edits: `tabStop = true` at the end of the destructuring, and `tabIndex={tabStop ? undefined : -1}` on the `<button>` beside `type={type}`.

- [ ] **Step 4: Declare it in both `.d.ts` files**

Add to `IconButtonProps`, after `form?: string;`:

```ts
  /** Whether the control is reached from the page's Tab sequence. Set `false`
   *  inside a composite that manages its own focus — a grid with a roving tab
   *  stop, a menu — where reaching it by Tab would be a second way in. The
   *  control stays programmatically focusable. */
  tabStop?: boolean;
```

Add the identical member to `ButtonProps`, in the same position.

- [ ] **Step 5: Add the member to both contracts**

`api/components/IconButton.json`, after `form` and before `click`:

```json
    "tabStop": { "form": "primitive", "type": "boolean", "default": true,
                 "description": "Whether the control is reached from the page's Tab sequence. Set false when it lives inside a composite that manages its own focus — a grid with a roving tab stop, a menu — where reaching it by Tab would be a second way in. Arena writes tabindex=\"-1\" and the control stays programmatically focusable; a positive tab order is not expressible and never should be." },
```

`api/components/Button.json`, same position, with one sentence more so nobody reads it as speculative:

```json
    "tabStop": { "form": "primitive", "type": "boolean", "default": true,
                 "description": "Whether the control is reached from the page's Tab sequence. Set false when it lives inside a composite that manages its own focus — a grid with a roving tab stop, a menu — where reaching it by Tab would be a second way in. Arena writes tabindex=\"-1\" and the control stays programmatically focusable; a positive tab order is not expressible and never should be. Table's actions column is where this one is needed: a Button inside a row of a grid." },
```

- [ ] **Step 6: Run the tests and the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/icon-button.test.jsx frameworks/react/test/button.test.jsx
bun run check:api
bun run check:behaviour
bun run check:dimensions
bun run build:demos && bun run check:demos
git diff --stat -- '*.behaviour.json'
```

Expected: six new tests pass; `check:api` reports **39 contract(s) across 59 layer implementation(s)** — unchanged, because members added to existing contracts move no count; the behaviour diff is **empty**, because a button outside the Tab sequence is still a button.

- [ ] **Step 7: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -q -F - <<'MSG'
feat(api): `tabStop` on Button and IconButton

Plan C's D1 flatten removed `{...rest}` and every global attribute, so a
composed Arena button cannot be taken out of the page's Tab sequence. Inside a
composite that manages its own focus -- a grid with a roving tab stop -- that
makes it a second way in, and falsifies `focus.roving` for the composite.

`tabStop` is the second global attribute admitted as a member, after `id`, and
it passes the same test api/README.md states for that one: a capability the
flatten removed rather than an attribute the host can write elsewhere. The
Angular escape hatch the exclusion rule cites does not reach this case twice
over -- IconButton is React-only, and `tabindex` on an `<arena-icon-button>`
host would land on the custom element rather than the `<button>` inside it.

A boolean and not `tabIndex?: number`, because -1 is the only value the problem
needs and a number member would legalise a positive tab order, which breaks
document order. Naming the decision rather than the mechanism is the house style
already: `dismissible`, an icon as a class-name string, `progressPercentage`.

`true` writes nothing -- a native <button> is already reachable and an explicit
tabindex="0" would be noise. `false` writes tabindex="-1" and leaves the control
programmatically focusable, which is what a composite's Enter/Escape route
depends on.

Both components, for symmetry, and Button's consumer is scheduled rather than
hypothetical: Table's actions column draws Buttons, and Table becomes a grid
with a roving stop in plan 8C3's Task 12.

check:api holds at 39/59 -- members added to existing contracts move no count --
and no *.behaviour.json moves, because a button outside the Tab sequence is
still a button: it answers Space and Enter and carries its accessible name.
check:api never opens the .jsx, so the six new tests are the only guard that the
attribute is written at all.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 3: `CalendarEvent`'s kebab, and the static tab-stop guard

**Files:**
- Modify: `api/components/CalendarEvent.json`
- Modify: `frameworks/react/components/display/CalendarEvent.{jsx,d.ts}`
- Modify: `frameworks/react/test/calendar.test.jsx`

**Interfaces:**
- Consumes: `tabStop?: boolean` from Task 2.
- Produces: `actionsEnabled?: boolean` and `actions?: React.ReactNode` on `CalendarEventProps`. Task 4 adds the open/close behaviour and the keyboard route.

> This task ships the **closed** state only: the kebab renders, the slot does not. Task 4 makes it open. Splitting there is deliberate — the closed state is what `focus.roving` is about, and it is fully assertable without a DOM.

- [ ] **Step 1: Write the failing tests**

Add to `frameworks/react/test/calendar.test.jsx`:

```jsx
import { CalendarEvent } from '../components/display/CalendarEvent.jsx';

/* A grid is ONE tab stop. This assertion opened the deleted grid-keyboard suite
 * and it needs no DOM: the cursor initialises to {day: 0, hour: 0}, so a static
 * render carries exactly one cell with tabindex="0". It is a property of the
 * markup, not of behaviour.
 *
 * It matters more than it looks. Calendar's binding claims "exceptions": []
 * with no render suite behind it, by the grid rule, and a control that leaked
 * into the Tab sequence would falsify that claim silently. This is the guard. */
test('a Calendar renders exactly one tab stop, kebab or no kebab', () => {
  const plain = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z" />
    </Calendar>,
  );
  assert.equal((plain.match(/tabindex="0"/g) || []).length, 1, 'a Calendar is not one tab stop');

  const withKebab = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.equal((withKebab.match(/tabindex="0"/g) || []).length, 1,
    'the kebab added a second tab stop inside the grid -- focus.roving is now false');
});

test('the kebab renders only when actionsEnabled, and never as a tab stop', () => {
  const off = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z" />
    </Calendar>,
  );
  assert.doesNotMatch(off, /ph-dots-three/, 'a chip that did not ask for actions drew a kebab');

  const on = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.match(on, /ph-dots-three/, 'actionsEnabled drew no kebab');
  assert.match(on, /aria-label="Actions"[^>]*tabindex="-1"|tabindex="-1"[^>]*aria-label="Actions"/,
    'the kebab is not out of the Tab sequence');
});

/* The slot is closed by default, so the consumer's markup is not in the tree at
 * all. That is what keeps their buttons -- which Arena cannot reach to silence,
 * because it is their markup -- from being permanent tab stops in the grid. */
test('the action panel content is absent while the panel is closed', () => {
  const html = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.doesNotMatch(html, /Delete/, 'the panel rendered its content while closed');
});

/* Nested <button> is invalid HTML and browsers restructure it silently, which
 * is the kind of defect that only shows up as "the click handler stopped
 * firing" months later. */
test('a chip carrying a kebab is not a button inside a button', () => {
  const html = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        onClick={() => {}} actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.doesNotMatch(html, /<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/,
    'a kebab was nested inside the chip button -- invalid HTML');
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/calendar.test.jsx
```

Expected: the kebab tests FAIL on `actionsEnabled drew no kebab`. The one-tab-stop test should PASS already for the plain case — if it does not, stop and report: that means `Calendar` is not one tab stop today and the problem is bigger than this plan.

- [ ] **Step 3: Add the two members to the contract**

`api/components/CalendarEvent.json`, after `colorId` and before `click`:

```json
    "actionsEnabled": { "form": "primitive", "type": "boolean", "default": false,
                        "description": "Whether the chip shows its action button. A boolean rather than \"is the actions slot filled?\", for the reason Alert.dismissible and Toast.dismissible already record: Angular cannot detect whether an ng-content was filled, so gating the drawing on that is a divergence waiting to happen." },
    "actions": { "form": "slot",
                 "description": "The action panel's content, revealed by the chip's action button. Rendered only while the panel is open, so a consumer's own controls never sit permanently in the grid's Tab sequence." },
```

`bindingName()` maps a slot named `actions` to a node-valued React prop `actions` — it is not the default slot, which only a slot named `content` becomes.

- [ ] **Step 4: Declare them in the `.d.ts`**

Add to `CalendarEventProps`, after `colorId`:

```ts
  /** Whether the chip shows its action button. A boolean rather than "is
   *  `actions` filled?", because Angular cannot detect a filled `<ng-content>`
   *  and gating the drawing on that is a divergence waiting to happen. */
  actionsEnabled?: boolean;
  /** The action panel's content, revealed by the chip's action button. Rendered
   *  only while the panel is open. */
  actions?: React.ReactNode;
```

- [ ] **Step 5: Draw the kebab**

In `frameworks/react/components/display/CalendarEvent.jsx`, import the button and add the two props:

```jsx
import { IconButton } from '../forms/IconButton.jsx';
```

```jsx
export const CalendarEvent = React.forwardRef(function CalendarEvent({
  id, title, start, end, colorId, onClick, actionsEnabled = false, actions,
  box, color, timeLabel, dateLabel, showTime, tabIndex,
}, ref) {
```

The chip's element must stop being a `<button>` when it carries a kebab, or the result is a `<button>` inside a `<button>`. Replace the `Tag` line and give the body its own element:

```jsx
  /* A kebab inside the chip means the chip itself cannot be the <button>:
     nesting one button in another is invalid HTML and the browser restructures
     it silently. With actions, the chip is a <div> and the BODY becomes the
     button; without them, nothing about the markup changes at all, so every
     chip in the tree today renders byte-identically. */
  const hasPanel = actionsEnabled && Boolean(actions);
  const Tag = onClick && !hasPanel ? 'button' : 'div';
```

Lift the title and time into a fragment so the no-panel path can keep rendering exactly what it renders today, then branch once. Replace the whole `return` with this:

```jsx
  /* The chip's own body, hoisted so the branch below can place it in two
     different parents without duplicating it. */
  const body = (
    <>
      <span style={{ fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      {showTime && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', color: 'var(--mute)' }}>{timeLabel}</span>
      )}
    </>
  );

  return (
    <Tag ref={ref}
      /* Without a kebab the chip IS the button and nothing about this element
         changes. With one, every interactive attribute moves down to the body
         and the chip becomes an inert positioned box. */
      type={onClick && !hasPanel ? 'button' : undefined}
      tabIndex={hasPanel ? undefined : tabIndex}
      onClick={onClick && !hasPanel ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      aria-label={onClick && !hasPanel ? `${title}, ${dateLabel}, ${timeLabel}` : undefined}
      style={{ position: 'absolute', ...box,
        display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden',
        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
        background: `color-mix(in oklab, ${color} 16%, var(--surface-card))`,
        borderLeft: `var(--bw-strong) solid ${color}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: 'var(--r-sm)', cursor: onClick ? 'pointer' : 'default',
        font: 'inherit' }}>
      {hasPanel ? (
        <>
          {onClick ? (
            <button type="button" tabIndex={tabIndex}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              aria-label={`${title}, ${dateLabel}, ${timeLabel}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0,
                background: 'none', border: 'none', padding: 0, margin: 0,
                font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
              {body}
            </button>
          ) : body}
          <span style={{ position: 'absolute', top: 0, right: 0 }}>
            <IconButton icon="ph-bold ph-dots-three-vertical" label="Actions" size="sm"
              tabStop={false} onClick={() => {}} />
          </span>
        </>
      ) : body}
    </Tag>
  );
```

Two things this shape is buying. **A chip with no panel renders byte-identically to before** — the `hasPanel ? … : body` branch collapses to exactly the previous children, and every attribute on `<Tag>` reduces to its previous value. And the roving `tabIndex` Calendar injects follows the element that is actually focusable: the chip without a panel, the body button with one.

`tabStop={false}` on the kebab is written by Arena, not by the consumer — that is what makes the one-tab-stop guarantee structural rather than a thing somebody has to remember. Its `onClick` is a deliberate no-op here; Task 4 replaces it with the open/close toggle, which keeps this task's deliverable to the closed state.

- [ ] **Step 6: Run the tests and the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/calendar.test.jsx
bun run check:api
bun run check:dimensions
bun run build:demos && bun run check:demos
git diff --stat -- '*.behaviour.json'
```

Expected: all pass; `check:api` **39/59** unchanged; the behaviour diff **empty**; `check:dimensions` clean — the `top: 0, right: 0` above are zeros, which that gate permits.

- [ ] **Step 7: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -q -F - <<'MSG'
feat(api): CalendarEvent draws an action button, and the grid stays one tab stop

Two members: `actionsEnabled` (boolean, default false) and an `actions` slot.
This commit ships the CLOSED state -- the kebab renders, the panel does not.

The kebab is a real Arena IconButton with tabStop={false}, which is the member
the previous commit added and the reason it exists. Arena writes that prop, not
the consumer, so "a grid is one tab stop" is structural here rather than a thing
somebody has to remember.

`actionsEnabled` is a boolean rather than "is the slot filled?" for the reason
Alert.dismissible and Toast.dismissible already record in their own contracts:
Angular cannot detect whether an <ng-content> was filled, so gating the drawing
on that is a divergence waiting to happen.

A chip carrying a kebab stops being a <button> and its BODY becomes one --
nesting a button inside a button is invalid HTML that browsers restructure
silently. A chip with no kebab renders byte-identically to before, so nothing
already in the tree moves.

THE GUARD THIS ADDS IS THE POINT. Calendar's binding claims "exceptions": []
with no render suite behind it, by the grid rule adopted earlier in this plan.
The assertion that opened the deleted grid-keyboard suite -- a grid is ONE tab
stop -- needs no DOM at all: the cursor initialises to {0,0}, so a static render
carries exactly one cell with tabindex="0". It moves into the DOM-free suite and
runs against a Calendar with and without a kebab, which is precisely the change
that could have falsified the binding.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 4: The panel opens, and the keyboard reaches the kebab

**Files:**
- Modify: `frameworks/react/components/display/CalendarEvent.{jsx,prompt.md}`
- Modify: `frameworks/react/components/display/Calendar.jsx`
- Modify: `frameworks/react/components/display/calendar.card.entry.jsx`
- Modify: `frameworks/react/test/calendar.test.jsx`

**Interfaces:**
- Consumes: `actionsEnabled`, `actions` and the kebab from Task 3.
- Produces: nothing later tasks read.

> Everything about **focus movement** in this task is verified by hand, by the grid rule. Write the manual checklist into the prompt as part of the deliverable — an unverifiable behaviour with no written check is a behaviour nobody will ever re-test.

- [ ] **Step 1: Write the failing test for the open state**

Add to `frameworks/react/test/calendar.test.jsx`. The panel's open state is React state, so a static render cannot open it — what a static render CAN prove is that `CalendarEvent` renders its panel when told to. Test the component directly rather than through `Calendar`:

```jsx
/* Rendered on its own rather than inside a Calendar: `open` is internal state
 * and renderToStaticMarkup cannot click. What this pins is the branch -- that
 * an open panel puts the consumer's markup in the tree and a closed one does
 * not -- which is the half that decides whether the grid keeps one tab stop.
 * That the button OPENS it is verified by hand, by the grid rule. */
test('CalendarEvent renders its panel content when the panel is open', () => {
  const html = renderToStaticMarkup(
    <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
      actionsEnabled actions={<button type="button">Delete</button>}
      box={{}} color="var(--color-cat-1)" timeLabel="09:00 – 09:30" dateLabel="Monday 20 July"
      defaultPanelOpen />,
  );
  assert.match(html, /Delete/, 'an open panel did not render its content');
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/calendar.test.jsx
```

Expected: FAIL — `defaultPanelOpen` is not a prop yet, so nothing renders `Delete`.

- [ ] **Step 3: Implement the open/close state**

In `CalendarEvent.jsx`, first add the seam to the destructuring — Task 3 did not, because Task 3 had no open state:

```jsx
export const CalendarEvent = React.forwardRef(function CalendarEvent({
  id, title, start, end, colorId, onClick, actionsEnabled = false, actions,
  box, color, timeLabel, dateLabel, showTime, tabIndex, defaultPanelOpen,
}, ref) {
```

Then the state itself:

```jsx
  /* `defaultPanelOpen` is a TEST SEAM and deliberately not a contract member:
     renderToStaticMarkup cannot click, and the alternative was leaving the open
     branch unasserted entirely. It is not in CalendarEvent.d.ts and not in the
     contract, so check:api never sees it -- the same status as the props
     Calendar injects. */
  const [panelOpen, setPanelOpen] = React.useState(Boolean(defaultPanelOpen));
```

Replace the kebab's placeholder handler and render the panel beside it:

```jsx
      {hasPanel && (
        <span style={{ position: 'absolute', top: 0, right: 0 }}>
          <IconButton icon="ph-bold ph-dots-three-vertical" label="Actions" size="sm"
            tabStop={false}
            onClick={() => setPanelOpen((o) => !o)} />
          {panelOpen && (
            <span style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1,
              display: 'flex', gap: 'var(--sp-2)', padding: 'var(--sp-2)',
              background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
              borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)' }}>
              {actions}
            </span>
          )}
        </span>
      )}
```

The `zIndex: 1` needs an entry in `scripts/check-dimension-literals.mjs`'s `EXEMPT` map, keyed exactly `frameworks/react/components/display/CalendarEvent.jsx:zIndex:1`, with the reason already used for `Calendar.jsx`'s own: local stacking inside a positioned container, not part of the global z order. **`scripts/check-dimension-literals.test.mjs` asserts on `EXEMPT` by name, so it must be updated in the same commit** — read that suite and add the entry the way the existing ones are asserted.

- [ ] **Step 4: Escape closes the panel, and the grid's handler must not fight it**

`Calendar.jsx`'s `onGridKeyDown` already handles `Escape` on an event node by returning focus to the cursor cell. With a panel, Escape must close the panel first and only leave the chip when it is already closed. Add to `CalendarEvent.jsx`, on the `<Tag>` element:

```jsx
      onKeyDown={hasPanel ? (e) => {
        /* Closing takes priority over leaving. Without this, Escape inside an
           open panel would jump focus back to the hour cell AND leave the panel
           open behind it, which is the shape of bug that only ever shows up in
           a screen-reader session. stopPropagation is what keeps Calendar's own
           Escape handler from seeing it. */
        if (e.key === 'Escape' && panelOpen) { e.stopPropagation(); setPanelOpen(false); }
      } : undefined}
```

- [ ] **Step 5: Demonstrate it on the card**

In `frameworks/react/components/display/calendar.card.entry.jsx`, give two of the events an action panel:

```jsx
      actionsEnabled
      actions={<Button size="sm" variant="ghost" icon="ph-bold ph-trash">Delete</Button>}
```

Then rebuild and check the card's box did not grow:

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos && bun run check:demos
```

The kebab sits inside the chip, which is absolutely positioned, so the card's content box cannot grow from it. The open panel overflows the chip deliberately and is not part of layout.

- [ ] **Step 6: Write the manual verification checklist**

Add to `frameworks/react/components/display/CalendarEvent.prompt.md`:

```markdown
## Verifying the panel by hand

`Calendar` binds the `grid` pattern, so by Arena's rule it is DOM-tested by hand
rather than by a render suite — the measured RAM cost of a grid fixture is why.
Serve the tree with `bun run demos`, open
`frameworks/react/components/display/calendar.card.html`, and check all of:

1. Tab reaches the schedule ONCE. One more Tab leaves it — no chip, kebab or
   panel button is a stop of its own.
2. From an hour cell, Enter steps into an event chip; Escape steps back out.
3. On a chip with a panel, the kebab is reachable and activating it opens the
   panel below the chip.
4. Escape with the panel open CLOSES the panel and leaves focus on the chip. A
   second Escape returns focus to the hour cell.
5. Arrow keys still move by day and hour from an hour cell, and clamp at all
   four edges.
```

- [ ] **Step 7: Run the tests and the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/calendar.test.jsx
bun test scripts/check-dimension-literals.test.mjs
bun run check:dimensions
bun run check:api
bun run check:demos
```

Expected: all green; `check:dimensions` reports no stale exemptions, which it would if the `EXEMPT` entry were keyed wrongly.

- [ ] **Step 8: Do the manual pass and report it**

```bash
cd /home/juan/Dravensoft/Identity
bun run demos
```

Walk the six checks from Step 6 and **state the result of each in the commit message**. A rule that says "tested by hand" and produces no record is a rule that says "not tested".

- [ ] **Step 9: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -q -F - <<'MSG'
feat(display): the action panel opens, and Escape closes it before leaving

Completes CalendarEvent's panel. The kebab toggles it; the consumer's markup
enters the tree only while it is open, so their controls are never permanent tab
stops inside the grid -- which is what keeps focus.roving true without Arena
needing to reach into markup it does not own.

Escape closes before it leaves. Calendar's grid handler already returns focus to
the hour cell on Escape from a chip, so without stopPropagation an Escape inside
an open panel would move focus AND leave the panel open behind it.

`defaultPanelOpen` is a test seam, not a member: renderToStaticMarkup cannot
click, and the alternative was leaving the open branch unasserted. It is absent
from the .d.ts and the contract, so check:api never sees it -- the same status
as the props Calendar injects into a chip.

The panel's zIndex joins check-dimension-literals' EXEMPT with the reason
Calendar.jsx's own already carries: local stacking inside a positioned
container, not part of the global z order. That map is asserted by name in
check-dimension-literals.test.mjs, so both moved together.

VERIFIED BY HAND, per the grid rule, on calendar.card.html. The six checks and
their results are written into CalendarEvent.prompt.md so the next person
re-runs the same ones rather than inventing their own.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 5: Close-out

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `.superpowers/sdd/progress.md` (git-ignored; the maintainer's ledger)

- [ ] **Step 1: Run the whole check, once**

```bash
cd /home/juan/Dravensoft/Identity
export CHROME_PATH=/usr/bin/chromium
bun run check
```

Expected: every gate PASS and the run reported complete. A `SKIP` on `check:cards`, `check:vendor` or `check:demos` means a missing runtime dependency and reports INCOMPLETE — with `CHROME_PATH` exported and Bun in use, none should skip.

- [ ] **Step 2: Run both test processes**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts frameworks/react/test/ frameworks/angular/test
bun run test:react-dom
```

Record both figures. Expected: the merged process gains the tests this plan wrote; `test:react-dom` reports **32 across 6 files**.

- [ ] **Step 3: Write the CHANGELOG entries**

Under `## [Unreleased]`, in `### Added`, one entry for `tabStop` naming both components, why it is the second global attribute admitted as a member, and that a positive tab order is deliberately not expressible. One entry for `CalendarEvent`'s `actionsEnabled` and `actions`, naming the closed-by-default behaviour as the reason the grid keeps one tab stop.

The `### Removed` entry rewritten in Task 1 already covers the grid rule; check it still reads correctly beside the new entries and does not contradict them.

- [ ] **Step 4: Commit the CHANGELOG**

```bash
cd /home/juan/Dravensoft/Identity
git add CHANGELOG.md
git commit -q -F - <<'MSG'
docs(changelog): tabStop, CalendarEvent's action panel, and the grid rule

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git status --short
```

Expected: clean.

- [ ] **Step 5: Write the ledger entry**

`.superpowers/sdd/progress.md` is **git-ignored** and is never committed — append to it and stop. Record, per task: the measured `check:api` pair, both test-process figures, the six manual checks from Task 4 and their results, and anything where this plan disagreed with the tree.

---

## Appendix: what this plan deliberately does not do

- **It does not reformulate the global-attribute rule.** `tabStop` becomes a second named exception passing the same test `id` passes. That the rule's stated justification — the host writes it directly — is false for any component whose focusable element sits inside its host is recorded in the spec and left open.
- **It does not contract `Menu`.** The panel is a slot, not a composed `Menu`, so `Menu` staying uncontracted costs this work nothing.
- **It does not restore `Calendar:react` to `COVERED`.** By the grid rule it cannot be, and the static tab-stop count is what stands in its place.
- **It does no Angular work.** `Button` and `IconButton` are both React-only contracts; Plan D inherits `tabStop` with the rest.
- **It does not give `Table` a keyboard.** That is plan 8C3's Task 12, which inherits the grid rule the moment it lands.
