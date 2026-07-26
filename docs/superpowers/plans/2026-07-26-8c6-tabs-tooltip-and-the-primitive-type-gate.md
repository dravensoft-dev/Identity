# 8C6 — Tabs, Tooltip, and the primitive-type gate

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire every exception on `Tabs`' and `Tooltip`'s behaviour bindings — by making `Tabs` a
compound `Tabs`/`Tab` family that actually renders a tabpanel and navigates by keyboard, and by
giving `Tooltip` a focus path, an `aria-describedby` and an Escape — and close the one type
position `check:api` has never compared.

**Architecture:** `Tabs` sheds its `tabs: TabItem[]` array for `Tab` children, the fifth family to
follow the compound-component idiom after `RadioGroup`, `Calendar`, `Table` and `SideNav`.
Injection is `cloneElement` over direct children, one hop, no React context. `Tabs` renders the
tablist and, as its sibling, the one tabpanel filled from the active `Tab`'s children; `Tab`
renders its own button. Both ids derive from one `useId()`, so no `id` member is added anywhere.
`Tooltip` keeps its API unchanged and gains three behaviours. `check:api` gains one comparison
clause.

**Tech Stack:** Bun (build, test), React 18, `node:test` + `node:assert/strict`, happy-dom for the
DOM suites, DTCG-generated CSS custom properties for every value.

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only**, in code, comments, docs and UI copy.
2. **A commit message containing a backtick uses a quoted here-doc** — `git commit -q -F - <<'MSG'
   … MSG` — never `git commit -m "…"`. A backtick inside a double-quoted shell string opens command
   substitution and is silently spliced away. Verify with `git log -1 --format=%B`.
3. **The first step of every task is `git status --short`** and it must be clean before you start.
4. **`bun run check` in full runs ONCE, at close-out (Task 8)**, never per commit. Individual gates
   are cheap and are named per task.
5. **`bun run test:react-dom` is never replaced by `bun test frameworks/react/test-dom`.** It needs
   `--preload ./frameworks/react/test-dom/preload.js`; without it react-dom latches its legacy
   change-detection path and a dispatched event reaches a handler zero times, silently.
6. **A new React component moves a literal count** in `scripts/behaviour-contracts.test.mjs`, in the
   same commit. Verify with the MERGED process — `bun test scripts frameworks/react/test/
   frameworks/angular/test` — because `bun test frameworks/react/test/` never matches `scripts/` and
   reports green over a red run.
7. **A dimension is a token or a derivation of tokens.** Never a bare literal, and never an
   `EXEMPT` entry to make one pass. Note `check:dimensions` anchors on governed property **sites**:
   a value a function returns is invisible to it, so a helper that produces a dimension is asserted
   in the suite instead.
8. **Count children with `React.Children.toArray(children).length`, never `count()`.** `count()`
   counts a bare `false` that the render path drops.
9. **Guards use falsy (`!x`) when a present-but-blank value IS the defect** — every accessible name
   and every identifier — and `== null` only where an empty value is a legitimate thing a caller
   passes on purpose.
10. **Two R4 tests per component, in separate bodies** — one for a consumer `style`, one for a
    stray attribute — because `node:assert` aborts on the first failure. When inducing them, the
    induction must be **disjoint**: see CLAUDE.md, which carries the two-step recipe.
11. **happy-dom bounds what a suite may claim.** Our own `.focus()` moves `document.activeElement`
    and may be asserted; a claim that **Tab** moved focus may never be, because happy-dom has no
    sequential focus navigation. A keydown on a native `<button>` does not synthesise a click.

---

## What this plan measured before it was written

Read off the tree at the branch head on 2026-07-26. Verify anything you depend on; do not
re-derive.

| measure | value |
|---|---|
| `bun run check:api` | `49 contract(s) hold across 69 layer implementation(s)` |
| `bun run check:compliance` | `8 of 69 bindings verified by a render suite` |
| `bun run check:behaviour` | `21 pattern(s); 49 react + 20 angular + 29 delegated` |
| `bun run check:states` | clean, 15 sites, 3 exempted |
| `bun test scripts` | 547 pass, 0 fail across 32 files |
| `Tabs.behaviour.json` | 8 exceptions against 8 requirements |
| `Tooltip.behaviour.json` | 3 exceptions against 4 (`roles.element` is met) |
| `navigation.card.html` | `viewport="700x703"` |
| primitive members compared by a probe | 238 contract↔layer pairs, **0 mismatches** |

### Facts the tasks below depend on, each verified rather than recalled

- `ELEMENT_ROLE` in `scripts/lib/behaviour-compliance.mjs` has **no `tabs` entry and needs none**:
  the `tabs` pattern declares no `roles.element` requirement, so `evaluate()`'s throw cannot fire.
  It does have `tooltip: 'tooltip'`.
- `roles.tablist`, `roles.tab`, `roles.tabpanel` resolve through `ROLE_NAMED_BY_KEY`;
  `roles.controls`, `roles.describedby` and `states.selected` resolve through `ATTRIBUTE_FOR` as a
  **presence** check on the subject element.
- `focus.roving`, `focus.never`, `keyboard.ArrowLeft`, `keyboard.ArrowRight` and `keyboard.Escape`
  are all in `BEHAVIOURAL`, so `evaluate()` returns `null` and each **must** be named in the
  suite's `behavioural` map or the gate fails.
- The DOM suites' event idiom is
  `act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); })`
  — `frameworks/react/test-dom/side-nav-disclosure.test.jsx:254`.
- `mount()` returns the container and `cleanup()` is a separate export called from `afterEach`.
- The focus-ring idiom is a `boxShadow`, not an `outline`:
  `'0 0 0 var(--focus-width) var(--gold-soft)'` (`SegmentedControl.jsx:48`).
- `useId()` returns a value containing **colons** (`:r0:`). That is legal in an `id` attribute and
  in an IDREF, and is a `SyntaxError` inside a CSS selector.
- The compound **root** `SideNav` declares `content` **not required** and guards no children;
  only the named group `SideNavSection` guards. `Tabs` is a root.
- `TabItem` is referenced by `Tabs.json`, `Tabs.d.ts` and the two generated modules, and by nothing
  else. `Tabs.d.ts` **re-exports** it.

---

## File Structure

**Created**

- `frameworks/react/components/navigation/Tab.{jsx,d.ts,prompt.md,behaviour.json}` — the leaf.
- `api/components/Tab.json` — its contract.
- `frameworks/react/test/tab.test.jsx` — the DOM-free suite for the leaf.
- `frameworks/react/test-dom/tabs.test.jsx` — the compliance/render suite for the widget.
- `frameworks/react/test-dom/tooltip-keyboard.test.jsx` — the compliance/render suite for
  `Tooltip`'s three new behaviours. Separate from `tooltip-timer.test.jsx`, whose header scopes it
  to the single-timer rule.

**Modified**

- `scripts/check-api.mjs` + `scripts/check-api.test.mjs` — the primitive-type clause.
- `frameworks/react/components/navigation/Tabs.{jsx,d.ts,prompt.md,behaviour.json}`
- `api/components/Tabs.json`; `frameworks/react/api.generated.d.ts`,
  `frameworks/angular/api.generated.ts` (regenerated)
- `frameworks/react/test/tabs.test.jsx` — rewritten for the compound shape.
- `frameworks/react/components/feedback/Tooltip.{jsx,prompt.md,behaviour.json}`
- `frameworks/angular/behaviour-delegated.json` — one new `Tab` entry.
- `scripts/behaviour-contracts.test.mjs` — the React inventory count, +1.
- `scripts/check-manifest-states.mjs` — `SOURCE_OVERRIDES` gains `Tabs`.
- `scripts/check-compliance.mjs` — `COVERED` gains two entries; the header's worked example is
  rewritten because this batch makes it false.
- `frameworks/tailwind/components/Tabs.manifest.json` — the focus ring, and the panel slot.
- `frameworks/react/ui_kits/console/ProjectScreen.jsx`,
  `frameworks/react/components/navigation/navigation.card.entry.jsx` — the two call sites.
- `frameworks/react/components/navigation/navigation.card.html` — the declared viewport, remeasured.
- `CLAUDE.md` — the `Tabs` and `Tooltip` Known debt entries retire; the `check:api` type entry is
  rewritten.

**Deleted**

- `api/types/tab-item.json`
- `docs/superpowers/plans/2026-07-25-8c5-sidenav-sections-and-collapsibles.md`
- `docs/superpowers/specs/2026-07-25-8c4-dialog-modal-and-the-last-four-contracts-design.md`
- `docs/superpowers/specs/2026-07-25-tabstop-and-the-grid-testing-rule-design.md`

---

## Task 1: The cleanup

**Files:**
- Delete: `docs/superpowers/plans/2026-07-25-8c5-sidenav-sections-and-collapsibles.md`
- Delete: `docs/superpowers/specs/2026-07-25-8c4-dialog-modal-and-the-last-four-contracts-design.md`
- Delete: `docs/superpowers/specs/2026-07-25-tabstop-and-the-grid-testing-rule-design.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. This task exists first because it is free and because two of the three
  documents read as work in flight to anyone opening `specs/`.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short`
Expected: no output.

- [ ] **Step 2: Confirm nothing unique dies with the 8C5 plan**

The three learnings it carried were rescued before this plan was written. Verify each landed:

```bash
grep -n "moves a literal count outside its own layer" CLAUDE.md
grep -n "induction must be" CLAUDE.md
grep -n "BLIND SPOT, and it is not the SVG one" scripts/check-dimension-literals.mjs
```

Expected: one hit each. **If any is missing, stop** — deleting the plan would destroy it, which is
the exact failure CLAUDE.md's *Known debt* preamble names.

- [ ] **Step 3: Delete the three documents**

```bash
git rm docs/superpowers/plans/2026-07-25-8c5-sidenav-sections-and-collapsibles.md \
       docs/superpowers/specs/2026-07-25-8c4-dialog-modal-and-the-last-four-contracts-design.md \
       docs/superpowers/specs/2026-07-25-tabstop-and-the-grid-testing-rule-design.md
```

- [ ] **Step 4: Confirm what survives**

Run: `ls docs/superpowers/specs/ docs/superpowers/plans/`
Expected: `specs/` holds the two long-lived design documents (`…-9-four-package-build-publish…`,
`…-8-api-contracts…`) plus this batch's own spec; `plans/` holds this plan alone.

- [ ] **Step 5: Commit**

```bash
git commit -q -F - <<'MSG'
chore: delete the executed 8C5 plan and two specs whose plans are gone

The repo's rule is that a spec is deleted once its plan has been executed, and
a plan once it has. All three learnings the 8C5 plan carried were rescued to
permanent homes first -- two into CLAUDE.md, one into
scripts/check-dimension-literals.mjs's own header -- so nothing unique dies
here. 8C5's branch review read both specs and confirmed no debt dies with
either.
MSG
```

---

## Task 2: `check:api` compares a primitive member's type

**Files:**
- Modify: `scripts/check-api.mjs` (the `compareSurface` body, beside the enum/object type
  comparison at ~line 432, and the header's claim about what it compares)
- Test: `scripts/check-api.test.mjs`

**Interfaces:**
- Consumes: `compareSurface(contract, members, layer)` — already exported and already tested; it
  returns an array of problem strings.
- Produces: nothing new. No signature changes.

**Why this is first among the code tasks:** Tasks 3–4 add a whole contract and rewrite another.
This is the gate that would otherwise let a member be mistyped in either surface with a green run,
and it is the hole that already swallowed `SideNav.indentStep`'s reasoned refusal of a `string`.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing tests, both directions**

Add to `scripts/check-api.test.mjs`, in the section whose header comment reads
`3 agreement -> compareSurface`:

```js
/* A primitive member's TYPE was the last unguarded type position in the whole
 * contract layer: the gate compared name, form, required-ness and an event's
 * payload, validated that a contract's primitive type IS a primitive, and never
 * compared the two. `Dialog.width` (a .d.ts saying number against a contract
 * saying string) and `SideNav.indentStep` (whose contract argues at length for
 * why a string is wrong) are the two live examples the debt record names; both
 * agree today, and both would have gone unnoticed if they had not. */
test('a primitive member typed differently in the layer is a problem', () => {
  const problems = compareSurface(
    { component: 'Breadcrumbs', api: { separator: { form: 'primitive', type: 'string' } } },
    [{ name: 'separator', required: false, form: 'primitive', type: 'number' }],
    'react',
  );
  /* `where` is `${layer}/${contract.component}` -- read it off compareSurface
     rather than guessing, which an earlier draft of this step got wrong. */
  assert.deepEqual(problems, [
    'react/Breadcrumbs.separator: typed number, contract says string',
  ]);
});

test('a primitive member typed the same in both is not a problem', () => {
  const problems = compareSurface(
    { component: 'Breadcrumbs', api: { separator: { form: 'primitive', type: 'string' } } },
    [{ name: 'separator', required: false, form: 'primitive', type: 'string' }],
    'react',
  );
  assert.deepEqual(problems, []);
});
```

- [ ] **Step 3: Run them and watch the first one fail**

Run: `bun test scripts/check-api.test.mjs`
Expected: FAIL on `a primitive member typed differently in the layer is a problem` — actual `[]`,
expected one problem. The second test passes already, which is the point: it pins the direction
that must not become noisy.

- [ ] **Step 4: Add the clause**

In `scripts/check-api.mjs`, immediately after the existing enum/object comparison:

```js
    if ((spec.form === 'enum' || spec.form === 'object') && m.type && m.type !== spec.type) {
      problems.push(`${where}.${m.name}: typed ${m.type}, contract says ${spec.type}`);
    }
    /* The last unguarded type position. It can only run when both sides are
     * already `primitive`, because the form mismatch above `continue`s; and
     * neither side can be undefined, because validateContract() asserts a
     * contract primitive's type is one of string|number|boolean and classify()
     * returns a type for exactly those three. So this needs no normalisation
     * and no exception map -- which matters, because this is the one gate in
     * the repo that deliberately has none. It is a pure ratchet: measured
     * against the finished tree it flags nothing that exists today (238
     * contract/layer primitive pairs, 0 mismatches), and forbids the next one. */
    if (spec.form === 'primitive' && m.type !== spec.type) {
      problems.push(`${where}.${m.name}: typed ${m.type}, contract says ${spec.type}`);
    }
```

- [ ] **Step 5: Run the tests again**

Run: `bun test scripts/check-api.test.mjs`
Expected: PASS, both.

- [ ] **Step 6: Prove the ratchet is green against the real tree**

Run: `bun run check:api`
Expected: `check-api: 49 contract(s) hold across 69 layer implementation(s)` — unchanged. If it is
not, you have found a real divergence the probe missed: **report it, do not weaken the clause.**

- [ ] **Step 7: Induce a real divergence and watch it caught**

```bash
sha256sum frameworks/react/components/feedback/Dialog.d.ts > /tmp/8c6-guard.sha
# change `width?: string` to `width?: number` in Dialog.d.ts, then:
bun run check:api
```
Expected: FAIL naming `Dialog(react).width: typed number, contract says string`.

Restore and prove the restore:

```bash
git checkout -- frameworks/react/components/feedback/Dialog.d.ts
sha256sum -c /tmp/8c6-guard.sha    # must print: OK
bun run check:api                  # green again
```

- [ ] **Step 8: Correct the gate's own header**

`check-api.mjs`'s header states what it compares. It now compares one thing more. Update that
sentence; do not add a paragraph.

- [ ] **Step 9: Commit**

```bash
git commit -q -F - <<'MSG'
feat(check:api): compare a primitive member's type between contract and layer

The gate compared name, form, required-ness and an event's payload, validated
that a contract's primitive `type` IS a primitive, and never compared the two
sides' types. `Dialog.width` and `SideNav.indentStep` are the recorded live
examples: both agree today, and reverting either surface by one word left the
whole sweep green -- and in `indentStep`'s case the contract spends four lines
arguing why a `string` is wrong, a refusal `check:dimensions` explicitly cannot
enforce because it scans source rather than the values a caller passes in.

One clause, beside the enum/object comparison it mirrors. It can only run when
both sides are already primitive (the form mismatch above it `continue`s) and
neither side can be undefined (validateContract asserts the contract's type,
classify returns the layer's), so it needs no normalisation and no exception
map -- which matters, because this gate deliberately has none.

Measured before landing: 238 contract/layer primitive pairs across 45
contracts, 0 mismatches. A pure ratchet -- it forbids the next defect and
excuses nothing retroactively. Induced against Dialog.d.ts to watch it fail,
then restored and verified with sha256sum -c.
MSG
```

---

## Task 3: `Tab`, the leaf component

**Files:**
- Create: `frameworks/react/components/navigation/Tab.jsx`
- Create: `frameworks/react/components/navigation/Tab.d.ts`
- Create: `frameworks/react/components/navigation/Tab.prompt.md`
- Create: `frameworks/react/components/navigation/Tab.behaviour.json`
- Create: `api/components/Tab.json`
- Create: `frameworks/react/test/tab.test.jsx`
- Modify: `frameworks/angular/behaviour-delegated.json`
- Modify: `scripts/behaviour-contracts.test.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export function Tab({ value, label, selected, tabId, panelId, onSelect })`. Task 4's
  `Tabs` injects `selected: boolean`, `tabId: string`, `panelId: string` and
  `onSelect: (value: string) => void` by `cloneElement`. **None of those four is a member of any
  contract**, exactly as `Radio.json` declares none of what `RadioGroup` injects.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing suite**

Create `frameworks/react/test/tab.test.jsx`:

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tab } from '../components/navigation/Tab.jsx';

/* This directory has no DOM and renders with renderToStaticMarkup, so nothing here
 * fires a click. What it CAN see is the whole of Tab's markup contract: the element,
 * the roles and states it carries, the tab stop it takes, and the two R4 escapes.
 * The behaviour -- that clicking selects, that an arrow moves focus -- belongs to
 * Tabs and is asserted in frameworks/react/test-dom/tabs.test.jsx.
 *
 * Every fixture's `value` and `label` DIFFER on purpose. A same-string fixture
 * cannot discriminate a component that draws the value as its text. */

test('a tab is a native button carrying role=tab and drawing its label', () => {
  const html = renderToStaticMarkup(<Tab value="ov" label="Overview" />);
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /<button[^>]*role="tab"/);
  assert.match(html, />Overview<\/button>/);
  assert.doesNotMatch(html, />ov</, 'a tab drew its value as its text, not its label');
});

test('the injected wiring reaches the attributes that need it', () => {
  const html = renderToStaticMarkup(
    <Tab value="ov" label="Overview" selected tabId="t-ov" panelId="p-ov" />,
  );
  assert.match(html, /id="t-ov"/);
  assert.match(html, /aria-controls="p-ov"/);
});

/* states.selected of the `tabs` pattern says "true on the active tab, FALSE on the
 * rest" -- so the unselected case is asserted rather than assumed, because omitting
 * the attribute would read as met to a careless eye and is not what is asked for. */
test('aria-selected is true when selected and false when not', () => {
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" selected />), /aria-selected="true"/);
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" />), /aria-selected="false"/);
});

/* focus.roving: exactly one tab stop in the strip. The selected tab holds it; the
 * rest are reachable by arrow key only. This is the structural half, which SSR can
 * hold; that it MOVES with the selection is asserted in the DOM suite. */
test('the selected tab holds the tab stop and an unselected one is removed from it', () => {
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" selected />), /tabindex="0"/);
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" />), /tabindex="-1"/);
});

test('value is required and its absence throws', () => {
  assert.throws(() => renderToStaticMarkup(<Tab label="Overview" />), /Tab: `value` is required/);
});

test('label is required and its absence throws', () => {
  assert.throws(() => renderToStaticMarkup(<Tab value="ov" />), /Tab: `label` is required/);
});

/* Both guards are falsy rather than absence-only: `label` is the tab's whole
 * accessible name and `value` is what the selection is keyed off, so a
 * present-but-blank value IS the defect and `== null` would let it through. */
test('a blank label is refused, not drawn', () => {
  assert.throws(() => renderToStaticMarkup(<Tab value="ov" label="" />), /Tab: `label` is required/);
});

/* R4, asserted in two separate bodies -- node:assert aborts on the first failure,
   so one body asserting both escapes cannot say which came back. */
test('Tab drops a consumer style object', () => {
  const html = renderToStaticMarkup(<Tab value="ov" label="Overview" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Tab drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<Tab value="ov" label="Overview" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `bun test frameworks/react/test/tab.test.jsx`
Expected: FAIL — the module does not exist.

- [ ] **Step 4: Write `Tab.jsx`**

```jsx
import React, { useState } from 'react';

/** One tab in a `Tabs` strip, and the panel it shows. `Tab` draws the BUTTON;
 *  its `children` are the panel's content, which `Tabs` places in the one
 *  tabpanel it renders beside the tablist. That split is forced by the markup:
 *  a tabpanel may not sit inside a tablist, so the item cannot render its own.
 *
 *  Everything about WHERE the tab sits -- whether it is selected, the ids that
 *  wire it to its panel, and the handler that reports the choice -- is injected
 *  by `Tabs` and is deliberately absent from this component's contract, exactly
 *  as `RadioProps` omits what `RadioGroup` gives each `Radio`. */
export function Tab({
  value, label,
  selected = false, tabId, panelId, onSelect,
}) {
  /* Falsy rather than absence-only, the operator decision every guard in the
   * navigation group carries: `label` is this tab's whole accessible name and
   * `value` is what the selection is keyed off, so a present-but-blank value IS
   * the defect and `== null` would let it through. */
  if (!value) throw new Error('Tab: `value` is required');
  if (!label) throw new Error('Tab: `label` is required');
  const [focus, setFocus] = useState(false);
  return (
    <button type="button" role="tab" id={tabId}
      aria-selected={selected} aria-controls={panelId}
      /* focus.roving: the selected tab is the strip's one tab stop; the rest are
         reachable by ArrowLeft/ArrowRight, which Tabs owns. */
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect && onSelect(value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        position: 'relative',
        padding: 'calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 4)',
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: selected ? 'var(--fw-semibold)' : 'var(--fw-medium)',
        fontSize: 'var(--dz-text)',
        color: selected ? 'var(--bone)' : 'var(--mute)',
        /* Written as a nested ternary rather than composed from two named
           consts, and that is deliberate: check:dimensions judges every leaf of
           a ternary AT a governed property site, and cannot see a string built
           by a join() or traced through a call. A tidier composition here would
           put the focus ring outside the gate. */
        boxShadow: selected
          ? (focus
            ? '0 0 0 var(--focus-width) var(--gold-soft), inset 0 calc(var(--bw-strong) * -1) 0 var(--crimson)'
            : 'inset 0 calc(var(--bw-strong) * -1) 0 var(--crimson)')
          : (focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none'),
        transition: 'color var(--dur-fast) var(--ease-out)',
      }}>
      {label}
    </button>
  );
}
```

**No `borderRadius`.** A radius would round the ends of the crimson underline the selected tab
draws with the same `boxShadow`, which is a visual change this batch was not asked for. The ring is
square against a square tab.

- [ ] **Step 5: Run the suite**

Run: `bun test frameworks/react/test/tab.test.jsx`
Expected: PASS, all nine.

- [ ] **Step 6: Write the contract**

`api/components/Tab.json`:

```json
{
  "component": "Tab",
  "description": "One tab in a Tabs strip, and the panel it shows. Tab draws the button; its content fills the tabpanel Tabs renders beside the tablist.",
  "api": {
    "value": { "form": "primitive", "type": "string", "required": true,
               "description": "What this tab selects, and what the parent's `change` carries." },
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "What the tab reads. Arena draws the button; the consumer names it." },
    "content": { "form": "slot",
                 "description": "What the panel shows while this tab is selected. Tabs places it; Tab never renders it, because a tabpanel may not sit inside a tablist." }
  }
}
```

- [ ] **Step 7: Write `Tab.d.ts`**

```ts
import * as React from 'react';

/** One tab in a `Tabs` strip, and the panel it shows. Write one per view.
 *
 *  Everything about WHERE the tab sits -- whether it is selected, the ids wiring
 *  it to its panel, and the handler that reports the choice -- is injected by
 *  `Tabs` and is deliberately absent from this interface, exactly as
 *  `RadioProps` omits what `RadioGroup` injects. */
export interface TabProps {
  /** What this tab selects, and what `Tabs`' `onChange` carries. Required, and
   *  guarded at runtime against a blank value as well as an absent one. */
  value: string;
  /** What the tab reads. Required, and guarded the same way -- it is the tab's
   *  whole accessible name. */
  label: string;
  /** What the panel shows while this tab is selected. `Tabs` places it in the one
   *  tabpanel it renders; this component never draws it.
   *  @startingPoint the view this tab switches to. */
  children?: React.ReactNode;
}

export function Tab(props: TabProps): JSX.Element;
```

- [ ] **Step 8: Write `Tab.behaviour.json`**

```json
{
  "pattern": "none",
  "reason": "Every requirement that applies to a tab is a clause of the `tabs` pattern, and that pattern is bound on `Tabs` -- the component that renders the tablist, renders the tabpanel, owns the roving tab stop and handles ArrowLeft/ArrowRight. Binding `tabs` here would claim a tablist and a tabpanel this component does not render, and binding `button` would describe an element whose role is `tab` rather than `button`. This is the SideNavItem shape: the binding schema cannot say 'this pattern applies to me only as part of my parent', which is the same unresolved question Tag, Skeleton, Table and Pagination already carry, recorded in CLAUDE.md's Known debt."
}
```

- [ ] **Step 9: Write `Tab.prompt.md`**

```markdown
One tab in a `Tabs` strip, and the panel it shows. The tab draws the button; its children fill the
panel `Tabs` renders below the strip.

```jsx
<Tabs defaultValue="overview" onChange={setView}>
  <Tab value="overview" label="Overview"><ServiceHealth /></Tab>
  <Tab value="activity" label="Activity"><ActivityFeed items={items} /></Tab>
</Tabs>
```

**Do / Don't**
- Do give every tab a `value` and a `label`. Both are required and both are guarded: a blank one
  throws rather than drawing a nameless tab.
- Do write tabs as siblings or in an array. Don't wrap them in a fragment or in a component of your
  own — `React.Children.toArray` cannot see through either, so `Tabs` would have nothing to inject
  into and the strip would render inert.
- Don't render the panel yourself. `Tabs` draws exactly one, wired to the selected tab; a second
  one would be a panel no tab controls.
- Don't reach for `style`. It takes none.
```

- [ ] **Step 10: Declare it in the Angular layer**

Add to `frameworks/angular/behaviour-delegated.json`, keeping the file's key order:

```json
  "Tab": {
    "pattern": "none",
    "delegatedTo": "Angular Material MatTabGroup's own <mat-tab>",
    "reason": "React's Tabs became a compound component so that a tabpanel is rendered at all, and Tab is the leaf that shape needs; Angular needs no counterpart primitive, because <mat-tab> is the same leaf -- the consumer writes one per view inside <mat-tab-group> exactly as they now write one Tab per view inside Tabs. The pattern is `none` for the same reason React's own binding is: every requirement that applies to a tab is a clause of the `tabs` pattern, which the enclosing group binds. Verified against @angular/material 22.0.5."
  },
```

- [ ] **Step 11: Move the literal inventory count**

`scripts/behaviour-contracts.test.mjs` asserts `reactComponents('.').length` by literal, with a
comment naming every change that has moved it. Increment it by one and add this batch's clause to
that comment: `… and 49 -> 50 when Tabs became a compound component and grew Tab.`

- [ ] **Step 12: Run the MERGED process, not the react one**

Run: `bun test scripts frameworks/react/test/ frameworks/angular/test`
Expected: all pass. **`bun test frameworks/react/test/` alone would report green over the red
inventory count** — that is Global Constraint 6 and it cost 8C5 a red commit.

- [ ] **Step 13: Run the contract and behaviour gates**

```bash
bun run build:api
bun run check:api        # 50 contract(s) across 70 layer implementation(s)
bun run check:behaviour  # 50 react + 20 angular + 30 delegated
bun run check:dimensions
```

- [ ] **Step 14: Induce both R4 escapes, disjointly**

```bash
sha256sum frameworks/react/components/navigation/Tab.jsx > /tmp/8c6-tab.sha
```

Induction (a): add `style` to the destructuring and merge it into the style object. Run
`bun test frameworks/react/test/tab.test.jsx`. Expected: **only** `Tab drops a consumer style
object` fails.

Induction (b): destructure `style` **and discard it**, add `...rest` to the destructuring and
`{...rest}` to the `<button>`. Expected: **only** `Tab drops a consumer attribute` fails.

A bare `{...rest}` with `style` unnamed fails both, and that is the escapes overlapping rather than
the tests failing to be independent. Restore and prove it:

```bash
git checkout -- frameworks/react/components/navigation/Tab.jsx
sha256sum -c /tmp/8c6-tab.sha   # must print: OK
```

- [ ] **Step 15: Commit**

```bash
git commit -q -F - <<'MSG'
feat(Tab): the leaf of the fifth compound family, with its contract and binding

`Tab` draws the button and nothing else; its children are the panel's content,
which `Tabs` will place in the one tabpanel it renders beside the tablist. That
split is forced by markup rather than chosen: a tabpanel may not sit inside a
tablist, so the item cannot render its own.

The four values `Tabs` injects -- `selected`, `tabId`, `panelId`, `onSelect` --
are members of no contract, exactly as `Radio.json` declares none of what
`RadioGroup` gives it.

Binding is `none` with the reason in prose, on `SideNavItem`'s precedent: every
requirement that applies to a tab is a clause of the `tabs` pattern its parent
binds, and the schema still cannot say "this pattern applies to me only as part
of my parent".

The `boxShadow` is a nested ternary rather than two named consts on purpose:
check:dimensions judges every leaf of a ternary at a governed property site and
cannot trace a string built by a call, so the tidier composition would have put
the focus ring outside the gate.

Both R4 escapes induced disjointly -- `style` alone failed only the style test,
`style` destructured-and-discarded plus `...rest` failed only the attribute test
-- then restored and verified with sha256sum -c. Inventory count moved in this
commit and verified with the merged test process.
MSG
```

---

## Task 4: `Tabs` becomes the compound widget

**Files:**
- Modify: `frameworks/react/components/navigation/Tabs.jsx` (rewrite)
- Modify: `frameworks/react/components/navigation/Tabs.d.ts`
- Modify: `frameworks/react/components/navigation/Tabs.prompt.md`
- Modify: `frameworks/react/components/navigation/Tabs.behaviour.json`
- Modify: `api/components/Tabs.json`
- Delete: `api/types/tab-item.json`
- Modify: `frameworks/react/test/tabs.test.jsx` (rewrite)
- Modify: `frameworks/tailwind/components/Tabs.manifest.json`
- Modify: `scripts/check-manifest-states.mjs` (`SOURCE_OVERRIDES`)

**Interfaces:**
- Consumes: `Tab` from Task 3, by identity — `Tabs` clones whatever elements it is handed and reads
  `child.props.value` and `child.props.children`; it does not check the component type.
- Produces: `export function Tabs({ children, value, defaultValue, onChange })`. Task 5's call
  sites consume exactly that.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Rewrite the DOM-free suite as the failing test**

Replace `frameworks/react/test/tabs.test.jsx` entirely:

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tabs } from '../components/navigation/Tabs.jsx';
import { Tab } from '../components/navigation/Tab.jsx';

/* This directory has no DOM, so no test here fires a click or an arrow key -- the
 * roving tab stop MOVING, and `change`'s payload, are asserted in
 * frameworks/react/test-dom/tabs.test.jsx. What SSR can hold is the structure:
 * that a tablist and exactly one tabpanel are rendered, that the wiring between
 * them resolves, that the degenerate empty case stays valid, and the R4 escapes.
 *
 * Every fixture's value and label DIFFER on purpose: a same-string fixture cannot
 * discriminate a component that keys the selection off the label.
 *
 * React's SSR does not emit attributes in source order, so nothing below assumes
 * adjacency; the wiring tests read the two ids out and compare them instead. */

const three = (props = {}) => (
  <Tabs {...props}>
    <Tab value="ov" label="Overview"><p>overview body</p></Tab>
    <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>
  </Tabs>
);

test('a tablist and exactly one tabpanel are rendered', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 1,
    'a widget must render exactly one tabpanel -- the selected tab\'s');
  assert.equal((html.match(/role="tab"/g) || []).length, 2);
});

test('the panel shows the selected tab\'s children and no other tab\'s', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'dp' }));
  assert.match(html, /deployments body/);
  assert.doesNotMatch(html, /overview body/,
    'an unselected tab\'s content was rendered -- the panel shows one tab at a time');
});

/* roles.controls and the panel's own labelling, asserted by RESOLVING the ids
 * rather than by matching a literal: useId()'s value is not ours to predict, and
 * a test that hard-coded one would pin React's internals instead of our wiring. */
test('the selected tab and its panel reference each other', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  const panelId = /role="tabpanel"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*role="tabpanel"/.exec(html);
  const controls = /aria-selected="true"[^>]*aria-controls="([^"]+)"|aria-controls="([^"]+)"[^>]*aria-selected="true"/.exec(html);
  const panel = panelId[1] ?? panelId[2];
  const controlled = controls[1] ?? controls[2];
  assert.equal(controlled, panel, 'the selected tab\'s aria-controls does not resolve to the panel');
  assert.match(html, new RegExp(`aria-labelledby="[^"]+"`));
});

test('an id Arena renders is usable in a CSS selector', () => {
  /* useId() returns a value containing colons (`:r0:`), which is legal in an id
     attribute and a SyntaxError inside a selector. The ids are stripped of them
     so the suites -- and a consumer -- can address what Arena rendered. */
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) assert.doesNotMatch(id, /:/, `id "${id}" contains a colon and cannot be selected`);
});

test('value governs the selection when passed, over defaultValue', () => {
  const html = renderToStaticMarkup(three({ value: 'dp', defaultValue: 'ov' }));
  assert.match(html, /deployments body/);
});

test('with neither value nor defaultValue the first tab is selected', () => {
  const html = renderToStaticMarkup(three());
  assert.match(html, /overview body/);
});

/* The degenerate case. An empty collection is a caller saying "no tabs right now"
 * -- the stance this component already held and this suite already pinned -- so it
 * renders rather than throwing. What it must NOT do is render a tabpanel whose
 * aria-labelledby points at a tab that does not exist: a dangling label is worse
 * than an absent one, and an accessibility batch may not ship it. */
test('no children renders an empty tablist and no tabpanel at all', () => {
  const html = renderToStaticMarkup(<Tabs />);
  assert.match(html, /role="tablist"/);
  assert.doesNotMatch(html, /role="tabpanel"/, 'a tabpanel was rendered with no tab to label it');
  assert.doesNotMatch(html, /aria-labelledby/);
});

test('a conditionally-rendered tab that is false is absent, not counted', () => {
  /* toArray() drops a bare `false` where count() would count it as one child --
     the idiom {cond && <Tab/>} writes exactly that. If Tabs counted with count()
     it would believe it has a tab it will never render, and select it. */
  const html = renderToStaticMarkup(
    <Tabs>{false}<Tab value="dp" label="Deployments"><p>deployments body</p></Tab></Tabs>,
  );
  assert.match(html, /deployments body/, 'the first REAL tab was not selected');
  assert.equal((html.match(/role="tab"/g) || []).length, 1);
});

/* R4, in two separate bodies -- node:assert aborts on the first failure. */
test('Tabs drops a consumer style object', () => {
  const html = renderToStaticMarkup(
    <Tabs style={{ color: '#ff00ff' }}><Tab value="ov" label="Overview" /></Tabs>,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Tabs drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Tabs data-stray="x"><Tab value="ov" label="Overview" /></Tabs>,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `bun test frameworks/react/test/tabs.test.jsx`
Expected: FAIL — `Tabs` still takes a `tabs` array and renders no tabpanel.

- [ ] **Step 4: Rewrite `Tabs.jsx`**

```jsx
import React, { useId, useRef, useState } from 'react';

/** A row of tabs and the one panel they switch between.
 *
 *  COMPOUND, like RadioGroup/Radio and Table/TableRow before it: the consumer
 *  writes one `<Tab>` per view, and this component owns WHERE each goes -- the
 *  strip, the selection, the roving tab stop, the arrow keys -- while the tab
 *  owns what it reads. Injection is `cloneElement` over DIRECT CHILDREN, one hop,
 *  with no React context. It carries the family's limit rather than escaping it:
 *  a consumer's own wrapper component between this and its tabs breaks the chain,
 *  and so does a FRAGMENT, because React.Children.toArray flattens a nested array
 *  and does not flatten a <>...</>.
 *
 *  The panel is rendered HERE rather than by the tab, and that is markup rather
 *  than preference: a tabpanel may not sit inside a tablist, so the item cannot
 *  draw its own and still be a sibling of the strip. */
export function Tabs({ children, value, defaultValue, onChange }) {
  /* useId() returns a value containing COLONS (`:r0:`). That is legal in an id
   * attribute and in an IDREF, and it is a SyntaxError inside a CSS selector --
   * so an id built straight from it would be unaddressable by our own suites and
   * by a consumer. Stripping them keeps uniqueness (`:r0:` and `:r1:` differ
   * after the strip) and costs one line. Never Math.random(), which differs
   * between the server pass and the client one. */
  const base = `tabs-${useId().replace(/:/g, '')}`;
  /* toArray().length, never Children.count(): count() counts a bare `false` as one
   * child, which the conditional-render idiom {cond && <Tab/>} writes when the
   * condition is false -- and this component would then believe it has a tab it
   * will never render, and select it. */
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const [internal, setInternal] = useState(defaultValue ?? (items[0] && items[0].props.value));
  const active = value ?? internal;
  const at = items.findIndex((c) => c.props.value === active);
  const listRef = useRef(null);
  const select = (v) => { setInternal(v); onChange && onChange(v); };
  /* The ids are keyed by INDEX rather than by `value`, because a value is the
   * consumer's string and nothing constrains it to be usable inside an id. An
   * index is unique, stable across a render, and needs no escaping. */
  const tabId = (i) => `${base}-tab-${i}`;
  const panelId = (i) => `${base}-panel-${i}`;

  /* Automatic activation: an arrow moves focus AND selects, which is what APG
   * recommends when the panel displays instantly. Focus is moved by querying the
   * tablist for its buttons rather than by holding a ref per tab: cloneElement
   * cannot inject a `ref` into a plain function component, and making Tab a
   * forwardRef to satisfy a test would be the tail wagging the dog. */
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (at === -1) return;
    e.preventDefault();
    const next = (at + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    select(items[next].props.value);
    const buttons = listRef.current ? listRef.current.querySelectorAll('[role="tab"]') : [];
    if (buttons[next]) buttons[next].focus();
  };

  return (
    <>
      <div role="tablist" ref={listRef} onKeyDown={onKeyDown}
        style={{
          display: 'flex', gap: 'calc(var(--sp-1) * 1)',
          borderBottom: 'var(--bw) solid var(--color-base-300)',
        }}>
        {items.map((child, i) => React.cloneElement(child, {
          selected: i === at,
          tabId: tabId(i),
          panelId: panelId(i),
          onSelect: select,
        }))}
      </div>
      {/* No active tab means no panel -- never a panel whose aria-labelledby
          points at a tab that does not exist. A dangling label is worse than an
          absent one. */}
      {at !== -1 && (
        <div role="tabpanel" tabIndex={0}
          id={panelId(at)} aria-labelledby={tabId(at)}
          style={{ paddingBlockStart: 'calc(var(--sp-1) * 5.5)' }}>
          {items[at].props.children}
        </div>
      )}
    </>
  );
}
```

The panel is `tabIndex={0}` so a panel whose content is plain text is reachable at all. It is
outside the tablist, so it does not touch `focus.roving`, which is a claim about the strip.

The `paddingBlockStart` is the spacing both call sites currently write on a wrapper `<div>` around
`Tabs`; it moves inside because the panel is now Arena's to place. Task 5 removes the wrappers.

- [ ] **Step 5: Run the suite**

Run: `bun test frameworks/react/test/tabs.test.jsx`
Expected: PASS, all ten.

- [ ] **Step 6: Update the contract and delete `TabItem`**

`api/components/Tabs.json`:

```json
{
  "component": "Tabs",
  "description": "A row of tabs and the one panel they switch between. Write one `Tab` per view; Tabs renders the tablist, the panel, and the keyboard.",
  "api": {
    "content": { "form": "slot",
                 "description": "The tabs. Tabs injects each one's selected state, the ids wiring it to the panel, and the handler that reports the choice." },
    "value": { "form": "primitive", "type": "string",
               "description": "The selected tab's value. Omit and pass `defaultValue` to let it govern itself." },
    "defaultValue": { "form": "primitive", "type": "string",
                      "description": "The initially selected value when uncontrolled. Defaults to the first tab." },
    "change": { "form": "event", "payload": "string",
                "description": "A different tab was chosen; carries its value." }
  }
}
```

`content` is **optional and unguarded**, matching the compound root `SideNav` rather than the named
group `SideNavSection`. A root promises nothing a childless render would break, and `Tabs`' own
suite already pinned the stance that an empty collection renders.

```bash
git rm api/types/tab-item.json
bun run build:api
```

- [ ] **Step 7: Rewrite `Tabs.d.ts`**

```ts
import * as React from 'react';

/** A row of tabs and the one panel they switch between. Write one `<Tab>` per
 *  view, as siblings or in an array -- never wrapped in a fragment or in a
 *  component of your own, which `React.Children.toArray` cannot see through. */
export interface TabsProps {
  /** The tabs. `Tabs` injects each one's selected state, the ids wiring it to the
   *  panel, and the handler that reports the choice.
   *  @startingPoint one `<Tab value label>` per view, its children being what that
   *  view shows. */
  children?: React.ReactNode;
  /** The selected tab's value. Omit and pass `defaultValue` to let it govern itself. */
  value?: string;
  /** The initially selected value when uncontrolled. Defaults to the first tab. */
  defaultValue?: string;
  /** A different tab was chosen; carries its value. */
  onChange?: (value: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element;
```

**`TabItem` is no longer re-exported.** That is part of the breaking change and belongs in the
prompt, not behind a compatibility alias — this repo ships breaking majors rather than deprecation
windows.

- [ ] **Step 8: Rewrite `Tabs.prompt.md`**

```markdown
A row of tabs and the one panel they switch between. The active tab has a crimson underline.

```jsx
<Tabs defaultValue="overview" onChange={setView}>
  <Tab value="overview" label="Overview"><ServiceHealth /></Tab>
  <Tab value="deployments" label="Deployments"><DeployTable /></Tab>
</Tabs>
```

**Do / Don't**
- Do write one `<Tab>` per view, with that view as its children. The `tabs` array is gone, and so is
  the `TabItem` type it used — a tab is a component now, so its panel can be your own markup.
- Do write tabs as siblings or in an array. Don't wrap them in a fragment or a component of your
  own: `React.Children.toArray` cannot see through either, so nothing would be injected and the
  strip would render inert.
- Don't render your own panel, and don't switch on the value yourself. Arena renders exactly one
  tabpanel, wired to the selected tab; a second one is a panel no tab controls.
- Don't reach for `style` to space the strip. It takes none — the panel already carries the gap
  below the underline.

**Checked by hand, because a suite cannot hold it:** happy-dom has no sequential focus navigation,
so nothing asserts that Tab from a tab reaches the panel rather than the next tab. Serve the tree
with `bun run demos`, open `navigation.card.html`, and check it in a real browser.
```

- [ ] **Step 9: Retire every exception on the binding**

`frameworks/react/components/navigation/Tabs.behaviour.json`:

```json
{
  "pattern": "tabs",
  "exceptions": []
}
```

- [ ] **Step 10: Teach `check:states` the compound mapping**

In `scripts/check-manifest-states.mjs`'s `SOURCE_OVERRIDES`, add — with a comment in the shape the
two existing entries use:

```js
  /* Tabs is a COMPOUND component: the manifest's `tab` slot mirrors a tab, and a
     tab is `Tab.jsx`, not `Tabs.jsx` -- which owns the strip, the panel and the
     keyboard and implements no focus state of its own. The naive same-name search
     finds only the parent and would report the tab's focus ring as invented. */
  ['Tabs', ['frameworks/react/components/navigation/Tabs.jsx',
            'frameworks/react/components/navigation/Tab.jsx']],
```

- [ ] **Step 11: Bring the manifest back level with what the component draws**

In `frameworks/tailwind/components/Tabs.manifest.json`, add the focus ring to the `tab` slot and a
`panel` slot. Mirror the component's own values:

- `tab` gains `focus-visible:shadow-[0_0_0_var(--focus-width)_var(--gold-soft)]`
- a new `panel` slot: `pt-[calc(var(--sp-1)*5.5)]`

Nothing gates a manifest against the component it mirrors — that is the open problem CLAUDE.md
records — so this is honesty rather than compliance. `check:states` fires only in the other
direction, and it will now find a real focus implementation behind the modifier.

- [ ] **Step 12: Run every gate this task can move**

```bash
bun test frameworks/react/test/tabs.test.jsx
bun run check:api            # TabItem gone, Tabs.content a slot
bun run check:behaviour      # Tabs has no exceptions left
bun run check:dimensions
bun run check:tailwind
bun run check:arbitrary
bun run check:states
bun test scripts
```

`check:compliance` is expected to still report the old pair here — the suite that verifies the new
binding lands in Task 6. A binding with no exceptions and no suite is a claim nothing has checked,
which is exactly what Task 6 exists to close.

- [ ] **Step 13: Induce both R4 escapes for `Tabs`, disjointly**

Same two-step recipe as Task 3, against `Tabs.jsx`, guarded with `sha256sum` and restored with
`git checkout --` plus `sha256sum -c`.

- [ ] **Step 14: Commit**

```bash
git commit -q -F - <<'MSG'
feat(Tabs)!: the fifth compound family, and every `tabs` exception retired

BREAKING: `Tabs.tabs` is gone and so is the `TabItem` type, including the
re-export from `Tabs.d.ts`. Write one `<Tab>` per view, its children being what
that view shows.

`Tabs` renders `role="tablist"` and, as its sibling, exactly one
`role="tabpanel"` filled from the selected tab's children. That the panel is
drawn here rather than by the item is markup rather than preference: a tabpanel
may not sit inside a tablist. All eight requirements of the `tabs` pattern are
now met -- the three roles, `aria-controls`, `aria-selected` true on the active
tab and FALSE on the rest, one roving tab stop, and ArrowLeft/ArrowRight with
wrapping and automatic activation.

Both ids derive from one `useId()` plus the tab's index, so NO `id` member is
added to either contract -- deliberately the shape `SideNavCollapsible.id` did
not take. The colons `useId()` returns are stripped: they are legal in an id
attribute and a SyntaxError in a CSS selector, so an id built straight from one
is unaddressable by our own suites and by a consumer.

`content` is optional and unguarded, matching the compound ROOT `SideNav` rather
than the named group `SideNavSection`: a root promises nothing a childless
render would break, and this component's own suite already pinned the stance
that an empty collection renders rather than throwing. What the empty case must
not do -- and now does not -- is render a tabpanel whose `aria-labelledby`
points at a tab that does not exist.

check:states' SOURCE_OVERRIDES gains the compound mapping, since the manifest's
`tab` slot mirrors `Tab.jsx` and a same-name search finds only the parent.
MSG
```

---

## Task 5: The two call sites, the demo build, and the card

**Files:**
- Modify: `frameworks/react/ui_kits/console/ProjectScreen.jsx`
- Modify: `frameworks/react/components/navigation/navigation.card.entry.jsx`
- Modify: `frameworks/react/components/navigation/navigation.card.html` (the declared viewport)

**Interfaces:**
- Consumes: `Tabs` and `Tab` as produced by Tasks 3 and 4.
- Produces: nothing.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Migrate the Console screen**

`ProjectScreen.jsx` holds a `<Tabs tabs={[…]}>` inside a spacing `<div>`, then four
`{tab === '…' && (…)}` blocks at lines 78, 95, 99 and 115. Each block becomes one `<Tab>`'s
children, **in the strip's order** — Overview, Deployments, Activity, Settings — which is the order
the old `tabs` array declared, not the order the blocks happened to sit in.

The wrapper `<div style={{ marginBottom: 'calc(var(--sp-1) * 5.5)' }}>` around `Tabs` goes: the
panel now carries that gap as its own `padding-block-start`. Keep `value={tab} onChange={setTab}`
— the screen still governs the selection, and other code may read `tab`.

- [ ] **Step 3: Migrate the demo card entry**

In `navigation.card.entry.jsx`, `<Tabs tabs={[…]} value={v} onChange={setV}/>` becomes four `<Tab>`
children. Give each real panel content rather than leaving the "Active view: …" line as the only
evidence of the selection — the card's job is to show the pattern the component now implements, and
a demo whose panel is empty demonstrates the opposite. Keep the "Active view" line where it is; it
is the SegmentedControl's demo, not the tabs'.

- [ ] **Step 4: Rebuild the demos and check the drift gate**

```bash
bun run build:demos
bun run check:demos
```

Expected: green. Every component `.jsx` and every `.entry.jsx` has a compiled `.js` sibling, and
`Tab.js` is new.

- [ ] **Step 5: Re-measure the card's viewport — do not calculate it**

```bash
export CHROME_PATH=/usr/bin/chromium   # or wherever findChromium() finds one
bun run check:cards
```

The card renders a panel now, so it is taller. If `navigation.card.html` over-runs its declared
`viewport="700x703"`, raise the declared height until the gate passes. **Declaring it by arithmetic
does not work — it was tried in an earlier batch and the page clipped in both axes anyway.** A page
that declares far more height than it renders only warns.

- [ ] **Step 6: Look at it**

```bash
bun run demos
```

Open `frameworks/react/components/navigation/navigation.card.html` and
`frameworks/react/ui_kits/console/index.html`. Confirm the strip, the underline and the panel
spacing read as they did before, and that clicking a tab switches the panel.

**And check the one thing no suite can hold:** press Tab from a focused tab. Focus must leave the
strip and land on the panel, not on the next tab — that is the browser's own sequential navigation,
which happy-dom does not implement, so a suite asserting it would pass identically against a
correct implementation and a broken one. Then press ArrowRight and ArrowLeft and confirm the
selection wraps at both ends.

- [ ] **Step 7: Commit**

```bash
git commit -q -F - <<'MSG'
refactor(console, demos): both Tabs call sites take the compound shape

Neither site was a rename. Both used `Tabs` as a bare strip and rendered the
panel themselves -- ProjectScreen with four `{tab === '…' && (…)}` blocks, the
card with an "Active view" line -- which is exactly the shape that left
`roles.tabpanel` unmeetable. The blocks become the four tabs' children in the
strip's declared order, and the spacing wrapper around `Tabs` goes, because the
panel now carries that gap as its own padding.

The card's declared viewport was re-measured by running check:cards rather than
calculated; the page renders a panel now and is taller.

Checked by hand in a real browser, per the prompt's own checklist: Tab from a
tab leaves the strip and lands on the panel, and the arrows wrap at both ends.
Neither is assertable under happy-dom -- it has no sequential focus navigation.
MSG
```

---

## Task 6: The compliance suite for `Tabs`

**Files:**
- Create: `frameworks/react/test-dom/tabs.test.jsx`
- Modify: `scripts/check-compliance.mjs` (`COVERED`, and the header's worked example)
- Modify: `CLAUDE.md` (the `Tabs` Known debt entry)

**Interfaces:**
- Consumes: `mount`, `cleanup`, `act` from `./harness.jsx`; `assertPattern`, `REACT_COMPONENTS`
  from `./assert-pattern.jsx`.
- Produces: the `Tabs:react` coverage claim.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the suite**

Create `frameworks/react/test-dom/tabs.test.jsx`:

```jsx
/* The DOM half of Tabs' proof. Everything here needs a real event to have
 * happened and a real attribute or a real focus to have moved as a result.
 *
 * What this suite may and may not claim, because happy-dom bounds it:
 *   - a dispatched `click` runs React's handler, and our own `.focus()` moves
 *     document.activeElement: PROVABLE, and the arrow-key tests rest on both.
 *   - `document.activeElement` after a Tab keypress: NEVER asserted. happy-dom has
 *     no sequential focus navigation, so such a test passes identically against a
 *     correct implementation and none. The roving tab stop is asserted as
 *     `tabindex` instead -- structure, not sequence -- and the panel being
 *     reachable by Tab is checked by a person against Tabs.prompt.md's checklist.
 *   - a keydown of Enter or Space on a native <button> does NOT synthesise a click
 *     here. No test below depends on one; a tab is activated by click and by arrow.
 */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Tabs } from '../components/navigation/Tabs.jsx';
import { Tab } from '../components/navigation/Tab.jsx';

afterEach(cleanup);

const three = (props = {}) => (
  <Tabs defaultValue="ov" onChange={props.onChange}>
    <Tab value="ov" label="Overview"><p>overview body</p></Tab>
    <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>
    <Tab value="ac" label="Activity"><p>activity body</p></Tab>
  </Tabs>
);

const tabsOf = (root) => [...root.querySelectorAll('[role="tab"]')];
const panelOf = (root) => root.querySelector('[role="tabpanel"]');
const arrow = (root, key) => act(() => {
  root.querySelector('[role="tablist"]')
    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
});

test('clicking a tab selects it: aria-selected, the tab stop and the panel all move together', () => {
  const root = mount(three());
  const [ov, dp] = tabsOf(root);
  assert.equal(ov.getAttribute('aria-selected'), 'true');
  assert.equal(dp.getAttribute('aria-selected'), 'false');

  act(() => { dp.click(); });

  const [ov2, dp2] = tabsOf(root);
  assert.equal(dp2.getAttribute('aria-selected'), 'true');
  assert.equal(ov2.getAttribute('aria-selected'), 'false');
  assert.equal(dp2.getAttribute('tabindex'), '0');
  assert.equal(ov2.getAttribute('tabindex'), '-1');
  assert.match(panelOf(root).textContent, /deployments body/);
});

test('change reported exactly one value per selection', () => {
  const seen = [];
  const root = mount(three({ onChange: (v) => seen.push(v) }));
  act(() => { tabsOf(root)[1].click(); });
  act(() => { tabsOf(root)[2].click(); });
  assert.deepEqual(seen, ['dp', 'ac']);
});

/* focus.roving, the half a DOM can hold: ONE tab stop, and it moves. The other
   half -- that Tab from the strip leaves it -- is the browser's, not ours. */
test('exactly one tab is in the tab sequence, before and after a move', () => {
  const root = mount(three());
  const stops = () => tabsOf(root).filter((t) => t.getAttribute('tabindex') === '0');
  assert.equal(stops().length, 1);
  arrow(root, 'ArrowRight');
  assert.equal(stops().length, 1, 'a second tab stop appeared inside the tablist');
  assert.equal(stops()[0].textContent, 'Deployments');
});

test('ArrowRight moves selection and focus to the next tab', () => {
  const root = mount(three());
  arrow(root, 'ArrowRight');
  assert.equal(tabsOf(root)[1].getAttribute('aria-selected'), 'true');
  /* Our own .focus() call, which happy-dom honours -- not a claim about Tab. */
  assert.equal(document.activeElement, tabsOf(root)[1]);
  assert.match(panelOf(root).textContent, /deployments body/);
});

test('ArrowLeft moves the other way, and both directions wrap', () => {
  const root = mount(three());
  arrow(root, 'ArrowLeft');
  assert.equal(tabsOf(root)[2].getAttribute('aria-selected'), 'true', 'ArrowLeft did not wrap to the last tab');
  arrow(root, 'ArrowRight');
  assert.equal(tabsOf(root)[0].getAttribute('aria-selected'), 'true', 'ArrowRight did not wrap to the first tab');
});

test('a key the pattern does not claim is left alone', () => {
  const root = mount(three());
  const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
  act(() => { root.querySelector('[role="tablist"]').dispatchEvent(ev); });
  assert.equal(ev.defaultPrevented, false, 'Tabs cancelled a key it does not handle');
  assert.equal(tabsOf(root)[0].getAttribute('aria-selected'), 'true');
});

test('the selected tab and its panel reference each other in the real DOM', () => {
  const root = mount(three());
  const selected = tabsOf(root).find((t) => t.getAttribute('aria-selected') === 'true');
  const panel = panelOf(root);
  assert.equal(selected.getAttribute('aria-controls'), panel.getAttribute('id'));
  assert.equal(panel.getAttribute('aria-labelledby'), selected.getAttribute('id'));
  /* And the ids are selectable, which is why the colons useId() returns are stripped. */
  assert.equal(root.querySelector(`#${panel.getAttribute('id')}`), panel);
});

test('the binding is honest: every `tabs` requirement, in both directions', () => {
  const root = mount(three());
  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation', 'Tabs.behaviour.json'),
    subjects: {
      default: root.querySelector('[role="tablist"]'),
      'roles.tab': root.querySelector('[role="tab"]'),
      'roles.controls': root.querySelector('[role="tab"]'),
      'states.selected': root.querySelector('[role="tab"]'),
      'roles.tabpanel': root.querySelector('[role="tabpanel"]'),
    },
    /* focus.* and keyboard.* return null from the shared evaluator -- no single
       element can decide them -- so each must be named here and each is proved by
       one of the tests above, which act on the tree rather than reading it. */
    behavioural: {
      'focus.roving': true,
      'keyboard.ArrowLeft': true,
      'keyboard.ArrowRight': true,
    },
  });
});
```

- [ ] **Step 3: Run it**

Run: `bun run test:react-dom`
Expected: PASS. **Never `bun test frameworks/react/test-dom`** — without the preload react-dom
takes its legacy path and a dispatched event reaches a handler zero times, silently.

- [ ] **Step 4: Claim the coverage**

In `scripts/check-compliance.mjs`, add to `COVERED`:

```js
  'Tabs:react': 'tabs.test.jsx',
```

- [ ] **Step 5: Rewrite the header's worked example, which this batch just made false**

`check-compliance.mjs`'s header explains that a green run is never an accessibility claim, and
proves it with `Tabs` — "declares an exception against every one of the `tabs` pattern's eight
requirements … and would pass a suite written against its binding today". `Tabs` has no exceptions
left, so the example is now untrue.

**Rewrite it around a subject that is still true; do not delete it.** The point it makes is the
gate's whole charter. A live total-exception binding is the right replacement — find one rather
than guessing:

```bash
for f in $(grep -rl '"exceptions"' frameworks --include='*.behaviour.json'); do
  n=$(python3 -c "import json,sys;d=json.load(open('$f'));print(len(d.get('exceptions',[])))")
  p=$(python3 -c "import json;print(json.load(open('$f'))['pattern'])")
  r=$(python3 -c "import json;print(len(json.load(open('behaviour/patterns/'+'$p'+'.json'))['requires']))" 2>/dev/null)
  [ "$n" = "$r" ] && [ -n "$r" ] && echo "$f  $n/$r  ($p)"
done
```

Use whichever that prints, with its real numbers. If it prints nothing, say so plainly in the
header — that would itself be news worth writing down — and keep the paragraph's claim without a
worked example rather than inventing one.

- [ ] **Step 6: Run the gate**

Run: `bun run check:compliance`
Expected: `9 of 70 bindings verified by a render suite` (the denominator moved in Task 3 when `Tab`
gained a binding). Read the real numbers off the gate rather than trusting these.

- [ ] **Step 7: Retire the `Tabs` entry in CLAUDE.md's Known debt**

The entry beginning **"`Tabs` is the third total-exception `grid`-class binding"** is now false in
its entirety. Delete it and, in its place, record what the fix cost and what it did **not** buy —
the shape every retired entry in that section takes. Specifically: `Tabs` was fixed by an API
change, not only a keyboard one, because the missing tabpanel could not be met by a component that
rendered no panel; and the sibling asymmetry it named (contracting an API is orthogonal to
accessibility) is now demonstrated rather than merely asserted.

- [ ] **Step 8: Commit**

```bash
git commit -q -F - <<'MSG'
test(Tabs): a render suite behind the now-exceptionless binding

A binding with no exceptions and no suite is a claim nothing has checked, which
is the state Task 4 deliberately left `Tabs` in for one commit. The suite asserts
every `tabs` requirement in both directions -- met with no exception declared, or
failed with one -- and names `focus.roving`, `keyboard.ArrowLeft` and
`keyboard.ArrowRight` in its `behavioural` map, because the shared evaluator
returns null for those and the wrapper throws if one is silently skipped.

Two claims the suite deliberately does NOT make: that Tab moves focus out of the
strip (happy-dom has no sequential focus navigation, so the assertion would pass
against any implementation) and that Enter or Space activates a tab (a keydown on
a native button does not synthesise a click here). The first is on Tabs.prompt.md's
hand-check list; the second no test depends on.

check-compliance.mjs's own header used Tabs' eight exceptions as its worked
example of "a green run is never an accessibility claim". This batch made that
paragraph false, so it is rewritten around a binding that is still in that state
-- the claim it makes is the gate's charter and outlives its example.
MSG
```

---

## Task 7: `Tooltip` retires all three exceptions

**Files:**
- Modify: `frameworks/react/components/feedback/Tooltip.jsx`
- Modify: `frameworks/react/components/feedback/Tooltip.prompt.md`
- Modify: `frameworks/react/components/feedback/Tooltip.behaviour.json`
- Create: `frameworks/react/test-dom/tooltip-keyboard.test.jsx`
- Modify: `scripts/check-compliance.mjs` (`COVERED`)
- Modify: `CLAUDE.md` (the `Tooltip` Known debt entry)

**Interfaces:**
- Consumes: `delayOpen`, `delayClose` from `../../tokens.generated.js` — already imported.
- Produces: no API change. `label` and `content` are untouched and no member is added.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing suite**

Create `frameworks/react/test-dom/tooltip-keyboard.test.jsx`:

```jsx
/* Tooltip's keyboard and description path. Separate from tooltip-timer.test.jsx,
 * whose header scopes it to the single-timer rule, because these are different
 * claims about the same component and one file asserting both would say less
 * about each.
 *
 * The delays are POINTER intent. A focus must reveal IMMEDIATELY -- the token's
 * own $description says so, and routing focus through --delay-open would make a
 * control that is already hard to reach also feel broken. That is asserted here
 * without any timer at all: if focus scheduled a timeout, the bubble would not
 * exist on the line after the event.
 */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Tooltip } from '../components/feedback/Tooltip.jsx';

afterEach(cleanup);

const one = () => (
  <Tooltip label="Rebuilds the index">
    <button type="button">Reindex</button>
  </Tooltip>
);

const trigger = (root) => root.querySelector('button');
const bubble = (root) => root.querySelector('[role="tooltip"]');
const focusIn = (root) => act(() => {
  trigger(root).dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
});
const focusOut = (root) => act(() => {
  trigger(root).dispatchEvent(new window.FocusEvent('focusout', { bubbles: true }));
});
const press = (root, key) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { trigger(root).dispatchEvent(ev); });
  return ev;
};

test('focus reveals the tooltip immediately, with no delay to wait out', () => {
  const root = mount(one());
  assert.equal(bubble(root), null);
  focusIn(root);
  assert.notEqual(bubble(root), null, 'focus did not reveal the tooltip, or routed it through --delay-open');
});

test('blur withdraws it immediately too -- a blur is a decision, not a pointer leaving a hit box', () => {
  const root = mount(one());
  focusIn(root);
  focusOut(root);
  assert.equal(bubble(root), null);
});

test('while shown, the trigger describes itself with the bubble', () => {
  const root = mount(one());
  focusIn(root);
  const id = bubble(root).getAttribute('id');
  assert.ok(id, 'the bubble has no id for the trigger to reference');
  assert.equal(trigger(root).getAttribute('aria-describedby'), id);
});

test('while hidden, the trigger references nothing -- a dangling IDREF is worse than none', () => {
  const root = mount(one());
  assert.equal(trigger(root).getAttribute('aria-describedby'), null);
});

test('Escape dismisses it', () => {
  const root = mount(one());
  focusIn(root);
  press(root, 'Escape');
  assert.equal(bubble(root), null);
});

test('a key Tooltip does not handle is left alone', () => {
  const root = mount(one());
  focusIn(root);
  const ev = press(root, 'a');
  assert.equal(ev.defaultPrevented, false);
  assert.notEqual(bubble(root), null);
});

test('the tooltip itself never takes the tab sequence', () => {
  const root = mount(one());
  focusIn(root);
  assert.equal(bubble(root).hasAttribute('tabindex'), false);
});

test('the binding is honest: every `tooltip` requirement, in both directions', () => {
  const root = mount(one());
  focusIn(root);
  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'feedback', 'Tooltip.behaviour.json'),
    subjects: {
      default: root.querySelector('[role="tooltip"]'),
      /* roles.describedby is a claim about the TRIGGER, not the bubble. */
      'roles.describedby': root.querySelector('button'),
    },
    behavioural: {
      'keyboard.Escape': true,
      'focus.never': true,
    },
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `bun run test:react-dom`
Expected: FAIL on the focus, describedby and Escape tests — none of those paths exists yet.

- [ ] **Step 4: Implement the three behaviours**

In `Tooltip.jsx`: import `useId`, and replace the body's timer/return section with:

```jsx
  const [show, setShow] = useState(false);
  /* The colons useId() returns are legal in an id attribute and a SyntaxError in
   * a CSS selector; stripping them keeps the bubble addressable. */
  const bubbleId = `tooltip-${useId().replace(/:/g, '')}`;
  /* One timer, cleared on every transition. Two timers would race: leaving and
   * re-entering inside the close grace period must cancel the pending close, not
   * queue an open behind it. */
  const timer = useRef(null);
  const clear = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } };
  const schedule = (next, ms) => { clear(); timer.current = setTimeout(() => setShow(next), ms); };
  /* THE DELAYS ARE POINTER INTENT AND FOCUS MUST NOT ROUTE THROUGH THEM. A
   * keyboard user has already paid to reach this control; making them wait
   * --delay-open on top of that reads as an unresponsive widget. The token's own
   * $description says exactly this, and it also clears any pending pointer timer
   * so a focus arriving inside a close grace period is not undone by it. */
  const now = (next) => { clear(); setShow(next); };
  useEffect(() => () => clear(), []);
  /* aria-describedby is added to the CONSUMER's element, so it requires an element
   * that accepts props -- the same one-hop cloneElement limit the compound families
   * carry. A fragment or a component that swallows its props breaks the wiring, and
   * Tooltip.prompt.md says so. It is added only while the bubble exists: an IDREF
   * pointing at nothing is worse than no IDREF at all. */
  const described = React.isValidElement(children)
    ? React.cloneElement(children, { 'aria-describedby': show ? bubbleId : undefined })
    : children;
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => schedule(true, delayOpen)}
      onMouseLeave={() => schedule(false, delayClose)}
      onFocus={() => now(true)}
      onBlur={() => now(false)}
      onKeyDown={(e) => { if (e.key === 'Escape') now(false); }}>
      {described}
      {show && (
        <span role="tooltip" id={bubbleId} style={{ /* unchanged */ }}>
          {label}
        </span>
      )}
    </span>
  );
```

`onFocus`/`onBlur` sit on the wrapper rather than on the trigger because React maps them to
`focusin`/`focusout`, which bubble — so the handler fires when the consumer's own element takes
focus, with no second `cloneElement` prop.

- [ ] **Step 5: Run both tooltip suites**

Run: `bun run test:react-dom`
Expected: PASS, including the pre-existing `tooltip-timer.test.jsx` — the single-timer rule must
survive this change, and `clear()` replacing the old inline `clearTimeout` is where it could break.

- [ ] **Step 6: Empty the binding**

`Tooltip.behaviour.json` becomes `{ "pattern": "tooltip", "exceptions": [] }`.

- [ ] **Step 7: Claim the coverage and run the gate**

Add `'Tooltip:react': 'tooltip-keyboard.test.jsx',` to `COVERED`, then:

```bash
bun run check:compliance   # expect 10 of 70; read the real pair off the gate
bun run check:behaviour
bun run check:dimensions
```

- [ ] **Step 8: Update the prompt**

`Tooltip.prompt.md` gains a Do/Don't pair: **Do** hand it a single element that accepts props, since
that is where the `aria-describedby` lands; **Don't** wrap the trigger in a fragment or in a
component that swallows its props — the tooltip will still show and the description will not reach
anyone.

- [ ] **Step 9: Retire the `Tooltip` entry in CLAUDE.md's Known debt**

The entry beginning **"`Tooltip` is not keyboard-reachable, and now it also waits"** is now false.
Delete it. Its one durable instruction — that a focus path must reveal immediately and must never
route through `--delay-open` — is preserved where it belongs: in the token's own `$description`,
in `Tooltip.jsx`'s comment, and in the suite that asserts it.

- [ ] **Step 10: Commit**

```bash
git commit -q -F - <<'MSG'
feat(Tooltip): a focus path, a description and an Escape — all three exceptions gone

Adding focus alone was considered and rejected as half a repair: a keyboard user
would reach the tooltip visually while a screen-reader user still got no
association between trigger and bubble.

Focus reveals and blur withdraws IMMEDIATELY, never through --delay-open. The
delays are pointer intent -- the token's own $description says so, and a keyboard
user who has already paid to reach a control should not then wait 400ms. The
focus path also clears any pending pointer timer, so a focus arriving inside a
close grace period is not undone by it, which is the single-timer rule extended
rather than bypassed.

`aria-describedby` is added to the consumer's own element by cloneElement, and
only while the bubble exists -- an IDREF pointing at nothing is worse than no
IDREF. That inherits the one-hop limit the compound families carry, and the
prompt now says so.

No API change: `label` and `content` are untouched and no member is added.
MSG
```

---

## Task 8: Close-out

**Files:**
- Modify: `CLAUDE.md` (the `check:api` primitive-type Known debt entry)
- Modify: `docs/superpowers/specs/2026-07-26-tabs-tooltip-and-the-primitive-type-gate-design.md`
  (the `-pending-1` suffix, if it is still there)

**Interfaces:**
- Consumes: everything.
- Produces: a green tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Correct the `check:api` debt entry**

CLAUDE.md's entry beginning **"`check:api` does not compare a `primitive` member's `type`"** is now
half false. The type comparison exists; what survives is everything else the entry records — that
`spec.default` is read by nothing, and that React's checked surface is its `.d.ts` and never its
`.jsx`, so a restored `{...rest}` in a `.jsx` leaves the gate green.

**Both live examples the entry cites are now guarded**, so say that rather than deleting them: the
entry's whole value was showing what an unguarded type position costs, and the `indentStep` case —
a contract arguing at length for a refusal no gate enforced — is the clearest example the repo has
of why the clause was worth adding.

- [ ] **Step 3: Sweep the prose for figures this batch moved**

```bash
grep -n "8 of 69\|49 contract\|46 contract\|twenty-two\|twenty-three" CLAUDE.md api/README.md
```

Any hard figure this batch moved must either be corrected or, better, replaced by the command that
measures it — this file's own rule, which it has broken repeatedly.

- [ ] **Step 4: Run the full sweep, once**

```bash
export CHROME_PATH=/usr/bin/chromium
bun run check
```

Expected: every step passes. The step count moves only if a gate was added, and none was.
`ARENA_CHECK_STRICT=1` if you want the three non-portable gates to fail rather than skip.

- [ ] **Step 5: Confirm the batch's own claims**

```bash
bun run check:compliance   # 10 of 70, and every coverage claim current
bun run check:behaviour    # 50 react + 20 angular + 30 delegated
bun run check:api          # 50 contracts across 70 layers
grep -c '"exceptions": \[\]' frameworks/react/components/navigation/Tabs.behaviour.json \
                             frameworks/react/components/feedback/Tooltip.behaviour.json
```

Read the real numbers off the gates. If any disagrees with the line above, the line is what is
wrong — report it rather than editing a gate.

- [ ] **Step 6: Confirm the spec carries no `-pending-N` suffix**

Run: `ls docs/superpowers/specs/ | grep pending`
Expected: no output. The suffix means "written ahead of its plan" and was dropped in the commit
that added this plan. If it is still there, drop it now with `git mv` — an unsuffixed spec whose
plan exists is the correct end state, and the suffix outliving the plan is exactly the stale
signal the convention exists to prevent.

- [ ] **Step 7: Commit**

```bash
git commit -q -F - <<'MSG'
docs: close out 8C6 — the debt entries this batch made false

The `check:api` primitive-type entry is half retired: the comparison exists now,
and what survives is the rest of what it recorded -- `spec.default` is still read
by nothing, and React's checked surface is still its `.d.ts` and never its
`.jsx`. Both live examples it cited are now guarded, which is worth stating
rather than deleting: `SideNav.indentStep` -- a contract arguing at length for a
type refusal that no gate enforced -- is the clearest case the repo has for why
the clause was worth adding.

Full `bun run check` run once, at close-out, per CLAUDE.md's rule that the sweep
is a completion gate rather than a per-commit toll.
MSG
```

---

## Self-review

**Spec coverage.** Part 1 (E) → Task 1. Part 2 (C1) → Task 2. Part 3 (Tabs): the shape, the ids and
the keyboard → Tasks 3–4; `Tab`'s binding → Task 3; the migration → Task 5; the card viewport →
Task 5 Step 5; `SOURCE_OVERRIDES` and the manifest → Task 4 Steps 10–11; the inventory count →
Task 3 Step 11; the delegated entry → Task 3 Step 10. Part 4 (Tooltip) → Task 7. Part 5
(verification) → Tasks 6 and 7, with the hand check in Task 5 Step 6. The `check-compliance` header
rewrite → Task 6 Step 5. The CLAUDE.md entries → Tasks 6, 7 and 8.

**One thing the spec asks for that no task can guarantee**, stated rather than buried: Task 6
Step 5 must find a still-true worked example for the compliance gate's header, and the command that
finds one may print nothing. The step says what to do in that case — record the fact, keep the
claim, drop the example — rather than leaving the implementer to invent one.

**Type consistency.** `Tab` is `{ value, label, selected, tabId, panelId, onSelect }` in Task 3 and
is cloned with exactly `selected`, `tabId`, `panelId`, `onSelect` in Task 4. `Tabs` is
`{ children, value, defaultValue, onChange }` in Task 4 and is called with `value`/`onChange` in
Task 5 and `defaultValue`/`onChange` in Task 6. `assertPattern` takes
`{ root, bindingPath, subjects, behavioural }` in both suites, matching its real signature.
