# Calendar chip box and header gap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three pre-existing `Calendar` defects measured in
`docs/superpowers/specs/2026-07-29-calendar-chip-box-and-header-gap.md` — a chip that
overruns its day column, a title drawn under the kebab, and a doubled gap under the day
headers — without changing any API contract.

**Architecture:** Three independent, small edits to two `.jsx` files, each landed with its
own static-markup assertion, its `bun run build:demos` sibling, and a headless-Chromium
measurement that reproduces the spec's own figures. Defect 1's fix is `boxSizing:
'border-box'` on the chip, which makes `Calendar`'s injected `width` *and* `height` mean the
chip's outer edge; that second consequence forces the chip's height floor to be restated in
outer terms, which is why Task 1 is larger than "add one property". Defects 2 and 3 are a
reserved gutter and a removed padding. Two further tasks answer the question the spec left
open and record the knowledge the fixes depend on, since two of the constraints this plan
rests on were load-bearing code comments that a recent refactor deleted without migrating.

**Tech Stack:** React 18 (inline styles only, no CSS classes), Bun (`bun test`, `bun run
build:demos`), the repo's own headless-Chromium harness (`scripts/lib/chromium.mjs`,
`scripts/lib/cdp.mjs`, `scripts/lib/static-server.mjs`).

## Global Constraints

- **Every dimension is a token or a derivation of tokens.** `check:dimensions` scans `.jsx`
  and fails a bare literal, so a reserved gutter for the kebab is expressed against `--sp-*`
  or as a `calc()` over one, never as `32px`. Zero is allowed.
- **`Calendar` and `CalendarEvent` bind the `grid` pattern, so they are DOM-tested by hand.**
  Neither can appear in `COVERED`, and no render suite can be added for them. The plan closes
  with `bun run demos` and a human pass on `Calendar.card.html`.
- **No API change.** None of the three needs a new member: the box model, the reserved gutter
  and the header padding are all internal. A fix that adds a contract member has misread the
  problem.
- **The DOM-free suites still assert the tab-stop count** (`Calendar.test.jsx`), and
  `check:cards` renders the page at its declared viewport. Both must stay green, and neither
  can see any of these three defects.
- **Out of scope:** a repo-wide `box-sizing: border-box` reset. It would fix defect 1 and
  probably several things nobody has measured, and it would silently change the rendered
  width of every padded, explicitly-sized box in three framework layers. That is a system
  change with its own spec, not a rider on a Calendar fix.
- **No comments.** `bun run check:docs` fails any comment added to a framework source. Every
  fact worth keeping goes to `DOUBTS.md` (Task 6), never into the `.jsx`.
- **Do not add to `CLAUDE.md`.** It is 59,814 characters against a hard 60,000-character
  limit enforced by `check:docs` — about 186 characters of headroom. Nothing in this plan
  requires a change there, and an accidental one fails the gate.
- **Editing a component `.jsx` means running `bun run build:demos` in the same tree.** The
  suites import the `.jsx` directly and stay green with a stale `.js` sibling; the demo pages
  load the `.js`, so a stale sibling means `bun run demos` shows the pre-fix component while
  the suites prove the fix — which is exactly the by-hand check this plan closes with.
- **English only**, no emoji, present tense in any documentation touched.

---

## Before you start

- [ ] **Branch off `main`.**

```bash
cd /home/juan/Dravensoft/Identity
git switch -c fix/calendar-chip-box-and-header-gap
git status --short   # expect empty
```

- [ ] **Drop the spec's `-pending-1` suffix, because this plan now exists.**

`CLAUDE.md`: *"A spec written ahead of its plan carries a `-pending-N` suffix until that plan
exists … drop the suffix when the plan lands."*

```bash
git mv docs/superpowers/specs/2026-07-29-calendar-chip-box-and-header-gap-pending-1.md \
       docs/superpowers/specs/2026-07-29-calendar-chip-box-and-header-gap.md
git add docs/superpowers/plans/2026-07-29-calendar-chip-box-and-header-gap.md
git commit -q -F - <<'MSG'
docs: plan the Calendar chip box and header gap fix

The spec loses its -pending-1 suffix now that its plan exists.
MSG
```

## File map

| File | Responsibility | Task |
|---|---|---|
| `frameworks/react/components/display/calendar-event/CalendarEvent.jsx` | the chip: its box model (T1) and the gutter it reserves for its own kebab (T2) | 1, 2 |
| `frameworks/react/components/display/calendar/Calendar.jsx` | where a chip goes: the height floor restated as an outer height (T1), the day header cell's padding (T3) | 1, 3 |
| `frameworks/react/components/display/calendar/Calendar.test.jsx` | the DOM-free static-markup assertions that pin all three fixes | 1, 2, 3 |
| `scripts/check-dimension-literals.mjs` | `EXEMPT`, whose key is the exact `height` literal Task 1 changes | 1 |
| `scripts/check-dimension-literals.test.mjs` | asserts `EXEMPT` by literal key — changes with it | 1 |
| `frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md` | the by-hand checklist the grid rule makes the only real verification; gains the three geometry checks | 6 |
| `DOUBTS.md` | the box-sizing divergence entry (now five opt-ins, not four), the two deleted comments' knowledge, the chip's new box model, and the answer to the spec's open question | 5, 6 |

Files that must **not** change: `contracts/api/components/Calendar.json`,
`contracts/api/components/CalendarEvent.json`, either `.d.ts`, either `.behaviour.json`,
`frameworks/Components.json`, `CLAUDE.md`.

---

## Task 1: The chip is border-box, so `width` and `height` mean its outer edge

**Files:**
- Modify: `frameworks/react/components/display/calendar-event/CalendarEvent.jsx:77`
- Modify: `frameworks/react/components/display/calendar/Calendar.jsx:246`
- Modify: `scripts/check-dimension-literals.mjs:45-46`
- Modify: `scripts/check-dimension-literals.test.mjs:279`
- Test: `frameworks/react/components/display/calendar/Calendar.test.jsx`

**Interfaces:**
- Consumes: nothing from an earlier task.
- Produces: the chip root's serialized inline style now contains `box-sizing:border-box`
  immediately after the `width` the `box` prop injects, and `Calendar` injects
  `height: max(calc(var(--sp-1) * 6.5), <rawH>px)` instead of `* 4.5`. Task 2 edits the same
  style object and must keep both.

### Why the height floor moves, and why that is not scope creep

`boxSizing` is not per-axis. `Calendar.jsx:254-256` injects `top`, `height`, `left` and
`width` into the chip; under `content-box` all four are content-box figures, so the chip's
rendered box has always been 8px taller than its own time span (`padding: calc(var(--sp-1) *
1)` top and bottom = 4px each) as well as 14px wider than its column allowance. Setting
`border-box` corrects both at once — which is right, and is why the fix is the one the spec
endorses — but it also means the existing floor `max(calc(var(--sp-1) * 4.5), rawH)` = 18px
becomes an **outer** 18px, leaving a 10px content box that clips the 12px title
(`--dz-text-sm`).

`calc(var(--sp-1) * 6.5)` = 26px is the floor that changes nothing visible: 26px outer is
exactly what today's 18px content box plus 8px of padding already renders, so the shortest
chip keeps the height it has, and its content box becomes 18px — unchanged. Every chip whose
`rawH` exceeds the floor becomes up to 8px shorter and now spans exactly its own time range.

Token values, so nothing here has to be re-derived: `--sp-1` = 4px, `--dz-text-sm` = 12px
(11px under compact density), `--calendar-hour-h` = 44px, so a 30-minute event has
`rawH` = 22px and a 60-minute event has `rawH` = 44px.

- [ ] **Step 1: Write the failing tests**

Append to `frameworks/react/components/display/calendar/Calendar.test.jsx`:

```jsx
test('a chip is border-box, so the injected width is its outer edge', () => {
  const html = render({});
  assert.match(html, /width:calc\(100% - var\(--sp-1\)\);box-sizing:border-box/,
    'the chip is still content-box -- its padding and border are added past the width Calendar injected, and a full-width chip overruns its day column');
});

test('the chip height floor clears the title line once the height is an outer height', () => {
  const html = render({});
  assert.match(html, /height:max\(calc\(var\(--sp-1\) \* 6\.5\), \d+px\)/,
    'the height floor is still stated as a content height -- under border-box it leaves too little content box for the title line');
  assert.doesNotMatch(html, /calc\(var\(--sp-1\) \* 4\.5\)/,
    'the old content-box floor survived somewhere in the render');
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
```

Expected: FAIL, twice — the first on `width:calc(100% - var(--sp-1));display:flex` (no
`box-sizing` between them), the second on `max(calc(var(--sp-1) * 4.5), 22px)`.

- [ ] **Step 3: Make the chip border-box**

In `frameworks/react/components/display/calendar-event/CalendarEvent.jsx`, line 77, replace:

```jsx
      style={{ position: 'absolute', ...box,
```

with:

```jsx
      style={{ position: 'absolute', ...box, boxSizing: 'border-box',
```

`boxSizing` goes **after** the `...box` spread so nothing `Calendar` injects can ever
displace it. `boxSizing` is not in `PROPS` in `scripts/check-dimension-literals.mjs`, so the
gate does not judge it.

- [ ] **Step 4: Restate the height floor as an outer height**

In `frameworks/react/components/display/calendar/Calendar.jsx`, line 246, replace:

```jsx
                  const h = `max(calc(var(--sp-1) * 4.5), ${rawH}px)`;
```

with:

```jsx
                  const h = `max(calc(var(--sp-1) * 6.5), ${rawH}px)`;
```

- [ ] **Step 5: Follow the literal into `EXEMPT`, whose key is that exact string**

`EXEMPT` in `scripts/check-dimension-literals.mjs` is keyed by the literal source text, so
step 4 just invalidated an entry — and a stale entry fails the gate itself. Replace lines
45-46:

```js
  ['frameworks/react/components/display/calendar/Calendar.jsx:height:`max(calc(var(--sp-1) * 4.5), ${rawH}px)`',
   'the max()\'s floor, calc(var(--sp-1) * 4.5), already reads a token, and stays governed — only the computed arm is exempt: rawH is an event\'s duration in minutes projected to pixels, the same data-to-pixel category as the two chart entries above, never a fixed dimension'],
```

with:

```js
  ['frameworks/react/components/display/calendar/Calendar.jsx:height:`max(calc(var(--sp-1) * 6.5), ${rawH}px)`',
   'the max()\'s floor, calc(var(--sp-1) * 6.5), already reads a token, and stays governed — only the computed arm is exempt: rawH is an event\'s duration in minutes projected to pixels, the same data-to-pixel category as the two chart entries above, never a fixed dimension'],
```

- [ ] **Step 6: Follow it into the paired suite, which asserts `EXEMPT` by literal key**

`CLAUDE.md`: *"a change to `EXEMPT` or `PASSTHROUGH` is a change to
`scripts/check-dimension-literals.test.mjs` too"*. In that file, line 279, replace:

```js
  assert.ok(EXEMPT.has('frameworks/react/components/display/calendar/Calendar.jsx:height:`max(calc(var(--sp-1) * 4.5), ${rawH}px)`'));
```

with:

```js
  assert.ok(EXEMPT.has('frameworks/react/components/display/calendar/Calendar.jsx:height:`max(calc(var(--sp-1) * 6.5), ${rawH}px)`'));
```

- [ ] **Step 7: Run the tests and the two gates this touches**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
bun test scripts/check-dimension-literals.test.mjs
bun run check:dimensions
```

Expected: both suites PASS; `check:dimensions` prints no violation and no stale exemption.

- [ ] **Step 8: Rebuild the compiled demo siblings**

```bash
bun run build:demos
bun run check:demos
git status --short   # expect the two .js siblings to have changed
```

Expected: `check:demos` PASS, and `CalendarEvent.js` and `Calendar.js` show as modified.

- [ ] **Step 9: Measure it in a real browser**

Write the probe outside the repo — it is a throwaway, exactly as the spec's was, and must not
be committed.

```bash
mkdir -p "$CLAUDE_JOB_DIR/tmp"
cat > "$CLAUDE_JOB_DIR/tmp/probe-calendar.mjs" <<'PROBE'
import { startStaticServer } from '/home/juan/Dravensoft/Identity/scripts/lib/static-server.mjs';
import { findChromium, launchChromium } from '/home/juan/Dravensoft/Identity/scripts/lib/chromium.mjs';
import { connect } from '/home/juan/Dravensoft/Identity/scripts/lib/cdp.mjs';

const ROOT = '/home/juan/Dravensoft/Identity';
const PAGE = 'frameworks/react/components/display/calendar/Calendar.card.html';

const EXPR = `(async () => {
  const settled = async () => {
    for (let i = 0; i < 120; i++) {
      if (document.querySelector('[role="grid"]')) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => r()));
  };
  await settled();
  const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
  const section = document.querySelector('section[aria-label^="Schedule,"]');
  const headerStrip = section.children[1];
  const headerCell = headerStrip.children[0];
  const scroller = section.children[2];
  const gutter = scroller.firstElementChild.firstElementChild;
  const firstHourLabel = gutter.firstElementChild;
  const chipsOf = (title) => [...document.querySelectorAll('[role="row"]')]
    .flatMap((row) => [...row.children])
    .filter((el) => el.getAttribute('role') !== 'gridcell')
    .filter((el) => el.textContent.includes(title));
  const report = (title) => {
    const chip = chipsOf(title)[0];
    if (!chip) return { title, missing: true };
    const kebab = chip.querySelector('button[aria-label="Actions"]');
    const titleSpan = [...chip.querySelectorAll('span')].find((s) => s.textContent === title);
    const cs = getComputedStyle(chip);
    return {
      title,
      boxSizing: cs.boxSizing,
      paddingRight: cs.paddingRight,
      chip: rect(chip),
      column: rect(chip.parentElement),
      overrunPx: rect(chip).right - rect(chip.parentElement).right,
      offsetWidth: chip.offsetWidth,
      computedWidth: cs.width,
      kebab: kebab ? rect(kebab) : null,
      titleSpan: titleSpan ? rect(titleSpan) : null,
      titleOverKebabPx: kebab && titleSpan ? rect(titleSpan).right - rect(kebab).left : null,
      titleClipped: titleSpan ? titleSpan.scrollWidth > titleSpan.clientWidth : null,
    };
  };
  return {
    chips: ['Release window', 'Client review — Northwind', 'Standup'].map(report),
    header: {
      cellPaddingBottom: getComputedStyle(headerCell).paddingBottom,
      scrollerPaddingTop: getComputedStyle(scroller).paddingTop,
      headerStripBottom: rect(headerStrip).bottom,
      firstHourLabel: rect(firstHourLabel),
      firstHourLabelBelowHeaderPx: rect(firstHourLabel).top - rect(headerStrip).bottom,
      firstHourLabelFullyDrawn: rect(firstHourLabel).top >= rect(scroller).top,
    },
  };
})()`;

const browser = findChromium(process.env);
if (!browser.path) { console.error('no chromium: ' + browser.reason); process.exit(2); }
const server = await startStaticServer(ROOT);
const chrome = await launchChromium(browser.path);
const cdp = await connect(chrome.wsUrl);
try {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 620, deviceScaleFactor: 1, mobile: false }, sessionId);
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${server.port}/${PAGE}` }, sessionId);
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', { expression: EXPR, awaitPromise: true, returnByValue: true }, sessionId);
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  console.log(JSON.stringify(result.value, null, 2));
} finally {
  cdp.close();
  chrome.kill();
  await server.close();
}
PROBE
bun "$CLAUDE_JOB_DIR/tmp/probe-calendar.mjs"
```

Expected for `Release window`, the `cols: 1` chip the spec measured:
- `boxSizing` is `"border-box"`;
- `overrunPx` is **≤ 0** — it was `+12` before this task (chip right edge 755.7px against a
  column ending at 743.7px). With `left` still offset by `calc(var(--sp-1) * 0.5)` = 2px and
  the width now `column − 4px`, expect an `overrunPx` of about `-2`;
- `offsetWidth` is now about **161** (it was 175), matching `computedWidth`'s content figure
  of 161.17px plus nothing;
- no chip in the report is `missing`.

If `overrunPx` is still positive, stop — the fix did not take, and the likeliest cause is a
stale `.js` sibling (step 8) rather than the CSS.

- [ ] **Step 10: Commit**

```bash
git add frameworks/react/components/display/calendar-event/CalendarEvent.jsx \
        frameworks/react/components/display/calendar-event/CalendarEvent.js \
        frameworks/react/components/display/calendar/Calendar.jsx \
        frameworks/react/components/display/calendar/Calendar.js \
        frameworks/react/components/display/calendar/Calendar.test.jsx \
        scripts/check-dimension-literals.mjs \
        scripts/check-dimension-literals.test.mjs
git commit -q -F - <<'MSG'
fix: make a calendar chip border-box, so its injected size is its outer edge

Calendar injects width and height that read as "the column, less a gutter" and
"the event's own time span" -- statements about the chip's outer edge. Under
content-box the browser added the chip's 12px of horizontal padding and its 2px
left border on top of both, so a full-width chip overran its day column by 12px
and every chip stood 8px taller than its own time range.

The height floor follows: max()'s floor is now an outer height, and
calc(var(--sp-1) * 6.5) is the value that leaves the shortest chip rendering at
exactly the size it renders at today.

Subtracting the padding inside Calendar's calc would also have worked and is
wrong: it re-encodes CalendarEvent's padding inside Calendar, and the division
of labour is that Calendar owns where a chip goes and CalendarEvent owns what it
looks like.
MSG
```

---

## Task 2: The chip reserves the width its own kebab occupies

**Files:**
- Modify: `frameworks/react/components/display/calendar-event/CalendarEvent.jsx` (a new
  module-level constant, and the `paddingRight` in the root style object at line 81)
- Test: `frameworks/react/components/display/calendar/Calendar.test.jsx`

**Interfaces:**
- Consumes: Task 1's `boxSizing: 'border-box'` on the same style object. The reserve is
  stated as padding, and under `border-box` padding is carved out of the injected width
  rather than added past it — so this task widens nothing.
- Produces: a module-level `const KEBAB_RESERVE` in `CalendarEvent.jsx`, and a `paddingRight`
  that is `KEBAB_RESERVE` when `hasPanel` and the ordinary `calc(var(--sp-1) * 1.5)`
  otherwise.

### Why padding, and why this exact value

The kebab is `position: absolute; top: 0; right: 0` inside the chip. An absolutely positioned
element is laid out against its containing block's **padding box**, so `right: 0` puts the
kebab flush with the chip's padding-box right edge — inside the padding band, not inside the
content box. Growing `paddingRight` therefore reserves exactly the band the kebab sits in,
and the title's content box ends exactly where the kebab begins. Nothing about the layout
mode changes, which the spec requires: the body button stays `align-items: stretch`, which is
what makes the title span narrower than its own text and therefore what makes its
`text-overflow: ellipsis` engage at all.

The kebab is `<IconButton size="sm">`, whose root is `height`/`width`/`minWidth`
`var(--dz-ctl-h-sm)` plus a `var(--bw)` border on each side in its default `ghost` variant.
So the reserve is `calc(var(--dz-ctl-h-sm) + var(--bw) * 2)` — 34px at default density, 28px
under compact, and it re-densifies with the control it reserves for. A literal `32px` would
fail `check:dimensions`; `calc(var(--sp-1) * 8.5)` would pass the gate while silently
decoupling from the button it is reserving for.

Write `paddingRight` as its own property rather than folding the value into the `padding`
shorthand's template literal. Two reasons, and the second is the load-bearing one: the gate
scans a governed longhand's value directly but replaces a template literal's `${…}` with a
digit before judging it, so the shorthand form would hide the value from `check:dimensions`.
And give it a value on **both** arms of the ternary rather than `undefined` on one: React
clears a style that becomes `undefined` by assigning `''` to that longhand, which would drop
the `padding` shorthand's own right contribution to zero if `actionsEnabled` ever flipped
true → false at runtime.

- [ ] **Step 1: Write the failing tests**

Append to `frameworks/react/components/display/calendar/Calendar.test.jsx`:

```jsx
test('a chip carrying a kebab reserves the width the kebab occupies', () => {
  const html = render({}, { actionsEnabled: true, actions: <b>act</b> });
  assert.match(html, /padding-right:calc\(var\(--dz-ctl-h-sm\) \+ var\(--bw\) \* 2\)/,
    'a panelled chip reserves nothing for its kebab, so the title is drawn underneath it');
});

test('a chip with no kebab reserves nothing, and keeps its ordinary right padding', () => {
  const html = render({});
  assert.doesNotMatch(html, /var\(--dz-ctl-h-sm\)/,
    'a chip with no kebab reserved a gutter for a button it never renders');
  assert.match(html, /padding:calc\(var\(--sp-1\) \* 1\) calc\(var\(--sp-1\) \* 1\.5\);padding-right:calc\(var\(--sp-1\) \* 1\.5\)/,
    'the unpanelled chip lost its ordinary right padding');
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
```

Expected: FAIL, twice — no `padding-right` longhand is emitted at all yet.

- [ ] **Step 3: Add the constant**

In `frameworks/react/components/display/calendar-event/CalendarEvent.jsx`, after the imports
(line 2) and before `export const CalendarEvent`, add:

```jsx
const KEBAB_RESERVE = 'calc(var(--dz-ctl-h-sm) + var(--bw) * 2)';
```

This mirrors `GUTTER` at `Calendar.jsx:10`. Naming it is how the value carries its reason
without a comment, which `check:docs` forbids here.

- [ ] **Step 4: Reserve the band**

In the same file, in the root `style` object, replace:

```jsx
        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
```

with:

```jsx
        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
        paddingRight: hasPanel ? KEBAB_RESERVE : 'calc(var(--sp-1) * 1.5)',
```

`hasPanel` is already in scope — it is `actionsEnabled`, bound at line 14.

- [ ] **Step 5: Run the tests and the gate**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
bun run check:dimensions
```

Expected: all PASS. `check:dimensions` reads `KEBAB_RESERVE` through its bare-identifier
dataflow pass — the value is a `calc()` over two tokens, so it is governed and clean.

- [ ] **Step 6: Rebuild the compiled demo siblings**

```bash
bun run build:demos
bun run check:demos
```

Expected: PASS, with `CalendarEvent.js` modified.

- [ ] **Step 7: Measure it**

```bash
bun "$CLAUDE_JOB_DIR/tmp/probe-calendar.mjs"
```

Expected, for both chips that carry a kebab — `Release window` and `Client review —
Northwind`:
- `paddingRight` is `"34px"`;
- `titleOverKebabPx` is **≤ 0**. It was `+26` before this task;
- `Client review — Northwind` still reports `titleClipped: true` — its text genuinely exceeds
  its box, so the ellipsis is still doing work, now in the right place. `Release window`
  reports `titleClipped` either way depending on how much of the 34px reserve its shorter
  title needed; what must be true is that it is no longer drawn beneath the button.
- `Standup`, which carries no kebab, reports `paddingRight: "6px"` and `kebab: null`.

**Record what you see on the half-width chip.** `Client review — Northwind` shares its
10:00–11:30 slot with `Design critique`, so it renders at `cols: 2` — roughly 78px outer,
which leaves about 36px of content box once the 34px reserve, the 6px left padding and the
2px border come out. A two-word title in 36px is mostly ellipsis. That is the honest
consequence of reserving the space, and it is strictly better than drawing the title under an
opaque button, but note the measured number for the human pass in Task 7; if it reads
unusably short there, that is a design question about when the kebab should be visible at
all, and it needs its own spec rather than a change here.

- [ ] **Step 8: Commit**

```bash
git add frameworks/react/components/display/calendar-event/CalendarEvent.jsx \
        frameworks/react/components/display/calendar-event/CalendarEvent.js \
        frameworks/react/components/display/calendar/Calendar.test.jsx
git commit -q -F - <<'MSG'
fix: reserve the kebab's own width inside a calendar chip

Nothing reserved room for it, so on both chips that carry one the title's right
edge crossed the kebab's left edge by 26px -- on one because the text genuinely
overflows and the ellipsis landed in the wrong place, on the other because the
title fits and was simply drawn beneath an opaque button.

The reserve is padding, not a layout change: the kebab is absolutely positioned
against the chip's padding box, so paddingRight is exactly the band it occupies.
The body button keeps align-items: stretch, which is what makes the title span
narrower than its own text and therefore what makes its ellipsis engage at all.

The value is derived from the control it reserves for -- IconButton size="sm" is
--dz-ctl-h-sm plus a --bw border each side -- so it re-densifies with it.
MSG
```

---

## Task 3: The day header's bottom padding goes, and the scroller's stays

**Files:**
- Modify: `frameworks/react/components/display/calendar/Calendar.jsx:174`
- Test: `frameworks/react/components/display/calendar/Calendar.test.jsx`

**Interfaces:**
- Consumes: nothing from Tasks 1-2.
- Produces: the day header cell's serialized padding becomes
  `calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2) 0`.

### Which of the two paddings is removable

Both are 8px and they stack, so 16px of dead space sits between the day number and the first
hour line. Only one is removable. The scroll area's `paddingTop` at `Calendar.jsx:189` exists
because the hour labels are centred on their own line — each is positioned at
`calc(<y>px - var(--sp-1))`, so the first one overhangs the grid by 4px and is clipped by the
header without that padding, and the last is clipped by the scroll box. That constraint used
to be recorded in a comment immediately above the element; it was deleted by `755e023`
without being migrated, which is why Task 6 writes it to `DOUBTS.md`. **Keep it.**

The day cell's `paddingBottom` carries no such constraint. Removing it entirely leaves the
header's hairline border hugging the day number — which is what a schedule header's rule
normally does — and leaves the scroller's 8px as the whole gap. `0` is a permitted value
under `check:dimensions`.

- [ ] **Step 1: Write the failing test**

Append to `frameworks/react/components/display/calendar/Calendar.test.jsx`:

```jsx
test('a day header cell has no bottom padding, and the scroller keeps its top padding', () => {
  const html = render({});
  assert.match(html, /padding:calc\(var\(--sp-1\) \* 1\.5\) calc\(var\(--sp-1\) \* 2\) 0;text-align:center/,
    'the day header cell still pads its own bottom, doubling the gap under the header');
  assert.match(html, /overflow-y:auto;padding-top:calc\(var\(--sp-1\) \* 2\)/,
    'the scroll area lost its top padding -- the first hour label is centred on its line and is clipped by the header without it');
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
```

Expected: FAIL on the first assertion — the cell currently serializes
`padding:calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2) calc(var(--sp-1) * 2)`. The second
assertion passes already and is there so a later change cannot quietly remove the padding
that has a reason.

- [ ] **Step 3: Drop the cell's bottom padding**

In `frameworks/react/components/display/calendar/Calendar.jsx`, line 174, replace:

```jsx
              style={{ flex: 1, minWidth: 0, padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2) calc(var(--sp-1) * 2)', textAlign: 'center',
```

with:

```jsx
              style={{ flex: 1, minWidth: 0, padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2) 0', textAlign: 'center',
```

- [ ] **Step 4: Run the tests and the gate**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
bun run check:dimensions
```

Expected: all PASS.

- [ ] **Step 5: Rebuild the compiled demo siblings**

```bash
bun run build:demos
bun run check:demos
```

Expected: PASS, with `Calendar.js` modified.

- [ ] **Step 6: Measure it, and confirm the first hour label survives**

```bash
bun "$CLAUDE_JOB_DIR/tmp/probe-calendar.mjs"
```

Expected in `header`:
- `cellPaddingBottom` is `"0px"` (it was `"8px"`);
- `scrollerPaddingTop` is still `"8px"`;
- `firstHourLabelFullyDrawn` is `true` — the label's top is at or below the scroll area's own
  top, so nothing clips it;
- `firstHourLabelBelowHeaderPx` is still about `4`. This number does **not** move: the label
  is positioned inside the scroller, and removing padding *above* the header's border moves
  the border up, not the label down. What shrinks is the header strip's own height, and with
  it the total dead space, from 16px to 8px.

- [ ] **Step 7: Confirm the card still fits its declared viewport**

The header strip is now 8px shorter, which can only help, but the gate is cheap and this page
declares `viewport="1100x600"`.

```bash
bun run check:cards
```

Expected: PASS (or `SKIP` with a printed reason if no Chromium is on this machine — in which
case rely on step 6, which drove one).

- [ ] **Step 8: Commit**

```bash
git add frameworks/react/components/display/calendar/Calendar.jsx \
        frameworks/react/components/display/calendar/Calendar.js \
        frameworks/react/components/display/calendar/Calendar.test.jsx
git commit -q -F - <<'MSG'
fix: stop the day header padding stacking with the scroller's

Each day header cell padded its own bottom by 8px and the scroll area below pads
its top by another 8px, so 16px of dead space sat between the day number and the
first hour line.

Only one of the two is removable. The scroller's padding-top has a reason: the
hour labels are centred on their own line, so the first overhangs the grid and
is clipped by the header without it. The day cell's had none.
MSG
```

---

## Task 4: Answer the question defect 1 opens — is any other component latently overrun?

**Files:**
- Read only: `frameworks/react/components/**/*.jsx`
- Modify: `DOUBTS.md` (a new entry under `## 1. Known debt`)

**Interfaces:**
- Consumes: the probe from Task 1 step 9, extended with a second page.
- Produces: a `DOUBTS.md` entry naming, by file and line, every React component that combines
  a percentage `width` with horizontal padding or a border under `content-box`. Nothing is
  fixed here.

The spec: *"whether any other component in the layer sets a percentage `width` on a padded box
and has the same latent overrun. Answering it is cheap; fixing whatever it finds may not be in
this scope."* So: answer it, record the answer, fix nothing.

- [ ] **Step 1: Enumerate the candidates**

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "width: *['\`\"]\(calc(\)\?[^'\`\"]*%" --include='*.jsx' frameworks/react/ \
  | grep -vi "borderradius"
```

The sweep run while this plan was written returned exactly these, and every one of them is
`width: '100%'` except `Calendar`'s own, which Task 1 fixed:

| Site | Padding / border on the same element | Latent overrun |
|---|---|---|
| `components/forms/select/Select.jsx:11` | `padding: '0 calc(var(--sp-1) * 9) 0 calc(var(--sp-1) * 3)'` + `--bw` border | candidate |
| `components/forms/textarea/Textarea.jsx:25` | `padding: 'calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 3)'` + `--bw` border | candidate |
| `components/navigation/menu/Menu.jsx:59` | `padding: 'calc(var(--sp-1) * 2) calc(var(--sp-1) * 2.5)'` | candidate |
| `components/feedback/confirm-dialog/ConfirmDialog.jsx:40` | padded, but already `boxSizing: 'border-box'` | no |
| `components/display/table/Table.jsx:85,107`, `components/display/table-cell/TableCell.jsx:28`, `components/feedback/progress-bar/ProgressBar.jsx:25`, `components/display/avatar/Avatar.jsx:14`, `components/brand/app-logo/AppLogo.jsx:12`, the three charts' roots | no horizontal padding and no border on the sized element | no |

- [ ] **Step 2: Measure the three candidates in a browser**

Copy `$CLAUDE_JOB_DIR/tmp/probe-calendar.mjs` to
`$CLAUDE_JOB_DIR/tmp/probe-overrun.mjs`, change `PAGE` to each card page in turn, and replace
`EXPR`'s return value with the generic sweep below. The pages to load are the ones that render
the three candidates:

```bash
find frameworks/react/components/forms -name 'Select.card.html' -o -name 'Textarea.card.html' -o -name '*.card.html' | sort
find frameworks/react/components/navigation -name '*.card.html' | sort
```

```js
  const over = [];
  for (const el of document.body.getElementsByTagName('*')) {
    const cs = getComputedStyle(el);
    if (cs.boxSizing !== 'content-box') continue;
    if (!/%$/.test(el.style.width || '')) continue;
    const parent = el.parentElement;
    if (!parent) continue;
    const p = parent.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const pcs = getComputedStyle(parent);
    const innerRight = p.right - parseFloat(pcs.paddingRight) - parseFloat(pcs.borderRightWidth);
    if (r.right - innerRight > 0.5) over.push({ tag: el.tagName, cls: el.className, overrunPx: r.right - innerRight, width: cs.width, paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight });
  }
  return over;
```

Note the filter: it deliberately reads `el.style.width` (the inline declaration) rather than
the computed one, because a computed `width` is always a used pixel value and would tell you
nothing about whether the author wrote a percentage.

- [ ] **Step 3: Record the answer in `DOUBTS.md`**

Add one entry to `## 1. Known debt`, immediately after the last existing bullet in that
section. Write the *measured* numbers, not the candidate table above — if a candidate turns
out not to overrun visibly, say so and say why, and if the sweep finds no site at all, the
entry still belongs, because "we looked and it is only `Calendar`" is the finding.

The template below has one sentence you must replace before committing: the paragraph
beginning "Measured on their own card pages". Replace it with the probe's actual per-site
overrun in pixels — one clause per site, naming the page each was measured on and the
viewport it was measured at. Leave no prose in `DOUBTS.md` that the probe did not produce.

```markdown
- **Three more React components combine a percentage `width` with padding under
  `content-box`, and nobody has decided whether any of them is a defect.** `Calendar`'s chip
  was one, and it was measured overrunning its day column by 12px and fixed by opting that
  one element into `border-box`. The same shape survives at
  `frameworks/react/components/forms/select/Select.jsx:11`,
  `frameworks/react/components/forms/textarea/Textarea.jsx:25` and
  `frameworks/react/components/navigation/menu/Menu.jsx:59` — each `width: '100%'` on an
  element carrying its own horizontal padding, so each renders wider than its containing
  block's content box by twice that padding plus twice its border.

  Measured on their own card pages at their declared viewports: *(replace this sentence with
  the probe's per-site overrun in pixels, naming each page and viewport)*.

  Nothing is fixed here, and that is deliberate: the spec that produced the `Calendar` fix
  scoped itself to `Calendar`, and the general answer is the repo-wide `box-sizing:
  border-box` reset that the same spec put out of scope — it would fix all four at once and
  silently change the rendered width of every padded, explicitly-sized box in three framework
  layers, which is a system change with its own spec. Related: *The Tailwind layer is
  border-box; React is content-box*, in section 3, which is the same fact stated as a layer
  divergence.
```

- [ ] **Step 4: Check the file limit and commit**

`DOUBTS.md` is the one file in this repository with no character limit, but run the gate
anyway — it also holds the comment rule over everything else.

```bash
bun run check:docs
git add DOUBTS.md
git commit -q -F - <<'MSG'
docs: record which other React components share the chip's box-model shape

The Calendar spec asked whether any other component sets a percentage width on a
padded box and has the same latent overrun. Three do. Measured, recorded, and
deliberately not fixed: the general answer is the repo-wide box-sizing reset that
the same spec put out of scope.
MSG
```

---

## Task 5: Record the knowledge the fixes rest on

**Files:**
- Modify: `DOUBTS.md` — one edit in section 3 and two new entries in section 5

**Interfaces:**
- Consumes: Tasks 1-3's landed changes.
- Produces: nothing any later task reads. This is the task that keeps three existing sentences
  in `DOUBTS.md` from being false, and restores two facts a refactor deleted.

Three separate problems, and the first is that this plan just falsified a sentence.

- [ ] **Step 1: Fix the box-sizing divergence entry, which now undercounts**

`DOUBTS.md` section 3, under `#### The Tailwind layer is border-box; React is content-box`,
lines 1650-1654 read:

```markdown
**React** sets no such rule anywhere in `contracts/design/`, `contracts/design-generated/` or `styles.css`, so every React
component is `content-box` — the CSS default — unless it opts in itself. Only four do:
`Input.jsx`, `Button.jsx`, `Spinner.jsx` and `ConfirmDialog.jsx` each set `boxSizing:
'border-box'` locally; every other component, including every other form control, is
content-box.
```

Replace the second sentence onward with:

```markdown
**React** sets no such rule anywhere in `contracts/design/`, `contracts/design-generated/` or `styles.css`, so every React
component is `content-box` — the CSS default — unless it opts in itself. Only five do:
`Input.jsx`, `Button.jsx`, `Spinner.jsx`, `ConfirmDialog.jsx` and `CalendarEvent.jsx` each set
`boxSizing: 'border-box'` locally; every other component, including every other form control,
is content-box. `CalendarEvent`'s is the newest and the only one with no Tailwind counterpart
to agree with — it opted in to fix a measured 12px overrun of its own day column, not to
converge with anything.
```

Then, further down, the paragraph beginning `Four **elements** — not four components — agree`
(line 1708) must stay **four**, and must stop reading as "the ones that opt in". **Two of the
four line numbers it cites are already stale** — the structure refactor moved those sources
and nothing re-derived them — so fix those in the same edit. Verified while this plan was
written: `Input.jsx`'s field is at **:48**, not `:58`; `Spinner.jsx`'s circle is the style
object at **:33-38**, not `:49-51`; `Button.jsx:85` is still correct; `ConfirmDialog.jsx` is
cited without a number and needs none. Re-derive rather than trusting even these:

```bash
grep -n "boxSizing: 'border-box'" frameworks/react/components/forms/input/Input.jsx \
  frameworks/react/components/forms/button/Button.jsx \
  frameworks/react/components/feedback/spinner/Spinner.jsx \
  frameworks/react/components/feedback/confirm-dialog/ConfirmDialog.jsx \
  frameworks/react/components/display/calendar-event/CalendarEvent.jsx
```

Replace the paragraph's first sentence:

```markdown
Four **elements** — not four components — agree, and only because their React source opts
into `border-box` at that element: `Input.jsx:58`'s field, `Button.jsx:85`'s spinner span,
`ConfirmDialog.jsx`'s require-text input and `Spinner.jsx:49-51`'s circle all set
`boxSizing: 'border-box'`.
```

with:

```markdown
Four **elements** — not four components — agree, and only because their React source opts
into `border-box` at that element: `Input.jsx:48`'s field, `Button.jsx:85`'s spinner span,
`ConfirmDialog.jsx`'s require-text input and `Spinner.jsx:33-38`'s circle all set
`boxSizing: 'border-box'`. Four, not five: `CalendarEvent.jsx`'s chip opts in too, but the
Tailwind layer ships no calendar manifest, so it has nothing to agree with — the count here is
of rows in the table above, not of opt-ins.
```

- [ ] **Step 2: Restore the two facts that `755e023` deleted**

`refactor: remove comments from the framework sources` removed two comments from these two
components whose content was **not** re-expressible as a name, and neither was migrated. Both
are constraints this plan's fixes depend on staying true, and both are exactly what section 5
exists for: *"a fact about the world outside the file, which no identifier can encode: a
measurement, a vendor's behaviour, …"*.

Append to `DOUBTS.md`, at the end of `## 5. Knowledge that used to live in code comments`:

```markdown
### `frameworks/react/components/display/calendar/Calendar.jsx` — the scroll area's two paddings

The scroll box below the day headers carries `paddingTop` and `paddingBottom` of
`calc(var(--sp-1) * 2)`, and they are not spacing. Each hour label is **centred on its own
line**: it is positioned at `calc(<y>px - var(--sp-1))`, so the first overhangs the top of the
grid by 4px and the last overhangs the bottom. Without the pads the first is clipped by the
header strip above it and the last by the scroll box, whenever the calendar is left to size
itself.

The day header cell's own `paddingBottom` used to sit directly above this one, doubling the
gap to 16px. It had no such constraint and was removed; this one must stay. Measured after the
removal: the first hour label's top still sits 4px below the header's bottom border and is
fully drawn.

### `frameworks/react/components/display/calendar-event/CalendarEvent.jsx` — stretch is what makes the ellipsis real

The chip's body button sets `display: flex; flexDirection: column` and **deliberately sets no
`align-items`**, so it stays `stretch` and the title span is as wide as the button rather than
as wide as its own text. That is what makes the span's own
`white-space: nowrap; overflow: hidden; text-overflow: ellipsis` engage at all.

This was got wrong once, and the correction is the fact worth keeping: the title's own
nowrap/hidden/ellipsis does **not** survive the chip's clip being lifted on its own. Under
`align-items: flex-start` the span is sized to its content, and with `nowrap` its min-content
width **is** the full text width, so its own overflow never engages and the chip's clip was
doing the whole job — measured at 56px of title spilling into the neighbouring day column the
moment the panel opened. Adding `align-items` to that button, in any value but `stretch`,
silently reintroduces a hard cut.

It is also why the fix for the title running under the kebab is a reserved `paddingRight` on
the chip rather than a width on the span: reserving space leaves the layout mode alone, and
`KEBAB_RESERVE` is `calc(var(--dz-ctl-h-sm) + var(--bw) * 2)` because the kebab is an
`IconButton size="sm"` in its default `ghost` variant — that token plus a `--bw` border a
side — so the reserve re-densifies with the control it reserves for.

### `frameworks/react/components/display/calendar-event/CalendarEvent.jsx` — the chip is border-box, so `Calendar`'s injected size is its outer edge

`Calendar` injects `top`, `height`, `left` and `width` into every chip, and all four read as
statements about the chip's **outer** edge — "the column, less a gutter", "the event's own time
span". The chip sets `boxSizing: 'border-box'` so they mean that. Under the `content-box`
default the browser added the chip's 12px of horizontal padding and its 2px left border past
the injected width, and a full-width chip overran its day column by 12px; the same addition on
the other axis made every chip 8px taller than its own time range.

The consequence to remember is on the height: because the floor is now an **outer** height,
`Calendar`'s `max(calc(var(--sp-1) * 6.5), rawH)` reads 26px, not 18px. 26px is the value that
leaves the shortest chip rendering at exactly the size it rendered at before the change
(18px content + 8px padding), and it is the floor that keeps a 12px `--dz-text-sm` title line
inside a chip whose content box is now the declared height minus 8px. Lowering it re-clips
short chips; there is no gate that would notice.
```

- [ ] **Step 3: Check and commit**

```bash
bun run check:docs
git add DOUBTS.md
git commit -q -F - <<'MSG'
docs: record the calendar chip's box model, and two comments a refactor dropped

The box-sizing divergence entry said four React components opt into border-box.
Five now do, and CalendarEvent's is the one with no Tailwind counterpart to
agree with -- so the count of opt-ins and the count of agreeing rows in the table
are different numbers and now say so.

The scroll area's padding and the body button's stretch were both recorded in
comments that the comment-stripping refactor removed without migrating. Both are
constraints the chip fixes depend on: one keeps the first hour label from being
clipped, the other is the whole reason the title's ellipsis engages.

Two line numbers in the same entry had drifted since the structure refactor and
are re-derived here.
MSG
```

---

## Task 6: The by-hand checklist gains the three geometry checks

**Files:**
- Modify: `frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md`
  (the `## Verifying the panel by hand` section, lines 53-79)

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: checklist items 6-8, which Task 7 executes.

Because `Calendar` binds `grid`, this checklist is the *only* place these three fixes can be
verified as behaviour rather than as a serialized style string. Adding to it is what stops the
next person regressing them silently.

- [ ] **Step 1: Extend the checklist**

In `frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md`, after item 5
(`Arrow keys still move by day and hour …`), append:

```markdown
6. Every chip sits inside its own day column, with an even gutter each side, and the
   full-width ones especially — a chip whose event overlaps nothing is the case that
   overruns. The chip is `box-sizing: border-box`, so the width `Calendar` injects is its
   outer edge; if you ever see a chip cross a column border, that property is the first thing
   to check.
7. On a chip carrying a kebab, the title stops before the button and ellipsises there rather
   than running underneath it. Check a full-width chip and a half-width one: the half-width
   case has very little title left once the kebab's band is reserved, and it is the one worth
   an opinion.
8. A short event — 30 minutes or less — still shows its whole title. Its chip is at the height
   floor, and under `border-box` that floor is the chip's outer height, so a floor set too low
   clips the title with nothing failing.
```

- [ ] **Step 2: Check and commit**

```bash
bun run check:docs
git add frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md
git commit -q -F - <<'MSG'
docs: add the three chip geometry checks to the by-hand checklist

Calendar binds the grid pattern, so no render suite can cover these. The
checklist is the only place the fixes are verified as behaviour rather than as a
serialized style string.
MSG
```

---

## Task 7: Close-out

**Files:** none modified unless a check fails.

- [ ] **Step 1: Run the cross-file claim sweep for both components**

`CLAUDE.md`: *"A component name written into ANOTHER file's prose is a cross-file claim no
gate checks."*

```bash
cd /home/juan/Dravensoft/Identity
for X in Calendar CalendarEvent; do
  echo "=== $X ==="
  grep -rn --binary-files=without-match "\b$X\b" \
      --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
      CLAUDE.md DOUBTS.md contracts/api/ contracts/behaviour/ docs/ frameworks/ scripts/
done
```

Read every hit as a claim you may have just falsified. Drop by hand the hits under the two
components' **own** files and the hits in `CHANGELOG.md`. The claims known to be affected are
the three `DOUBTS.md` sentences Task 5 already fixed; if the sweep surfaces another, fix it
here and commit it with the others.

- [ ] **Step 2: Log it under `[Unreleased]`**

`CLAUDE.md`: *"Anything landing on `main` after a tag goes under `## [Unreleased]`"*.

```bash
sed -n '1,30p' CHANGELOG.md
```

Add, under `## [Unreleased]`'s `### Fixed` (creating that subheading if the entry has none):

```markdown
- `Calendar` chips are `border-box`, so the width and height `Calendar` injects are the
  chip's outer edge. A full-width chip no longer overruns its day column by 12px, and no chip
  stands taller than its own time range.
- A `CalendarEvent` carrying a kebab reserves that button's width, so its title ellipsises
  before the button instead of running underneath it.
- The day header cells no longer pad their own bottom, halving the dead space above the first
  hour line. The scroll area's top padding stays: the hour labels are centred on their line
  and the first is clipped without it.
```

```bash
bun run check:docs
git add CHANGELOG.md
git commit -q -m "docs: log the three Calendar fixes under Unreleased"
```

- [ ] **Step 3: Run the full sweep**

`CLAUDE.md`: *"When `bun run check` is expected: once, when a plan's implementation is
finished."*

```bash
bun run check
```

Expected: every gate `PASS`, and the run reported green. If it reports `INCOMPLETE` with a
`SKIP`, read which gate skipped and why — `check:cards` needs a browser, `check:vendor` needs
`Bun.build`, `check:demos` needs `Bun.Transpiler`. A skip on a machine that has Chromium is a
failure to investigate, not a pass.

Do not proceed past a red gate. In particular `check:demos` failing means a `.js` sibling was
not rebuilt, which would make step 4 verify the pre-fix component.

- [ ] **Step 4: The human pass — the only real verification these three fixes get**

```bash
bun run demos
```

Open `http://localhost:8000/frameworks/react/components/display/calendar/Calendar.card.html`
in a real Chromium at roughly 1100×620 and walk **all eight** items of
`frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md`'s *Verifying the
panel by hand*, not only the three this plan added — Tasks 1 and 2 both edited the chip's root
style object, and items 1-5 are what proves the keyboard route and the panel still work.

The three geometry items in words, so nothing is ambiguous:
- `Release window` (Thursday, 15:00–16:30, the full-width chip with a kebab) sits inside its
  column with an even gutter each side. Before this plan its right edge was 12px past the
  column.
- On `Release window` and on `Client review — Northwind` (Monday, the half-width chip with a
  kebab), the title stops at the kebab's left edge. Form an opinion about the half-width one:
  if the surviving title is unusable, say so in the hand-off — it is a design question with
  its own spec, not something to patch here.
- `Standup` (30 minutes, every weekday morning) still shows its whole title, and the gap under
  the day headers reads as one gap rather than two.

- [ ] **Step 5: Report**

State plainly, with the probe's numbers: the measured overrun before and after, the measured
title/kebab overlap before and after, the measured header padding before and after, whether
`bun run check` was fully green or `INCOMPLETE` and which gate skipped, and what the human
pass found — including anything on the half-width chip that reads wrong. If any of the eight
checklist items failed, say which; a passing gate suite is not evidence about any of them.

- [ ] **Step 6: Delete the executed spec and plan**

`CLAUDE.md`: specs and plans *"are deleted once executed, which is why debt filed in one dies
with it — debt goes in `DOUBTS.md`."* Tasks 4 and 5 already migrated everything worth keeping.

```bash
git rm docs/superpowers/specs/2026-07-29-calendar-chip-box-and-header-gap.md \
       docs/superpowers/plans/2026-07-29-calendar-chip-box-and-header-gap.md
git commit -q -F - <<'MSG'
docs: retire the Calendar chip spec and its plan

Both are executed. What outlived them is in DOUBTS.md: the chip's box model, the
scroll area's two paddings, the body button's stretch, and the three other
components that share the chip's percentage-width-on-a-padded-box shape.
MSG
```

Then integrate the branch per `superpowers:finishing-a-development-branch`.
