# Calendar: the kebab moves below on a narrow, tall chip — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A chip that is too narrow for its time label and at least 56px tall anchors its
kebab to the bottom-right and stops reserving a lateral band, so its title gets the whole
content box instead of 36.58px of it.

**Architecture:** One more pure predicate beside `showsTime()` in `CalendarInternals.js`,
one more script-flagged token, one more injected boolean, and two conditionals in
`CalendarEvent`'s style object. No new layout mode: the kebab is already absolutely
positioned, so this changes which edge it is anchored to and whether the chip reserves room
for it.

**Tech Stack:** DTCG 2025.10 tokens built by Style Dictionary, React 18 inline styles,
`bun test`, and the repo's headless-Chromium harness.

## Global Constraints

- **No API change.** The new boolean is injected by `Calendar`, exactly as `showTime`,
  `box`, `color`, `timeLabel` and `dateLabel` already are. None of them appears in
  `CalendarEvent.d.ts` or in any contract, and this one must not either.
- **A script-flagged token must land in the same commit as its JS consumer.**
  `check:script-tokens`' orphan rule is *flagged and imported by at least one layer*, and a
  CSS use does not satisfy it. This is why the plan has one implementation task rather than
  a token task and a wiring task — the previous Calendar plan got that boundary wrong and
  had to merge two tasks mid-flight.
- **Every dimension is a token or a derivation of tokens.** The threshold is a
  script-flagged DTCG token in the existing `calendar` group, and it needs an `EXCLUDED`
  entry in `scripts/check-tailwind-coverage.mjs` or that gate fails.
- **`Calendar` binds the `grid` pattern, so it is DOM-tested by hand.** It cannot appear in
  `COVERED` and no render suite can be added for it. The predicate is pure precisely so the
  DOM-free suite can cover the decision; the rendering is verified by probe and by eye.
- **While the container is unmeasured, nothing stacks.** `slotFor` returns `null` on a
  server and on the first client frame, `showsTime` treats that as "fits", and the new
  predicate therefore returns false — so the static render is unchanged.
- **Editing a component `.jsx` means running `bun run build:demos` in the same tree.**
- **Never edit `contracts/design-generated/`** — edit the JSON and rebuild.
- **Do not add to `CLAUDE.md`**; it is within ~200 characters of the 60,000-character limit.
- **No comments** in framework sources. Facts worth keeping go to `DOUBTS.md`.
- English only, no emoji, present tense.

## The numbers this plan is built on

Measured in headless Chromium at 1100×620 on `Calendar.card.html`.

| Quantity | Value |
|---|---|
| Title line height | **15px** |
| Kebab (`IconButton size="sm"`, border-box by UA default) | **32px** |
| Chip padding, top and bottom | 4px each |
| So the minimum stacking height | 4 + 15 + 32 + 4 = **55px**, rounded up to **56px** |
| `Client review — Northwind` — the one chip this reaches today | 78.6px wide, **66px** tall, content box 36.58px, title **74%** truncated |
| Its content box once the reserve is dropped | **64.6px**, the same as its kebab-less neighbours, whose titles truncate at 18% |

A chip 44px tall (a 60-minute event at `--calendar-hour-h`) does **not** stack: its title
would sit at y 4–19 and its kebab at y 8–40, overlapping. That is what the 56px threshold
exists to prevent, and it is why this change reaches only events of roughly 75 minutes or
more that share a column.

## File map

| File | Responsibility | Task |
|---|---|---|
| `contracts/design/component.json` | `calendar.actions-below-min-h`, script-flagged | 1 |
| `scripts/check-tailwind-coverage.mjs` | its `EXCLUDED` entry | 1 |
| `frameworks/react/components/display/calendar/CalendarInternals.js` | `stacksActions()`, the pure predicate | 1 |
| `frameworks/react/components/display/calendar/Calendar.jsx:258` | injects `actionsBelow` beside `showTime` | 1 |
| `frameworks/react/components/display/calendar-event/CalendarEvent.jsx:8,84,102` | accepts it; drops the reserve and anchors the kebab to the bottom | 1 |
| `frameworks/react/components/display/calendar/Calendar.test.jsx` | unit tests for the predicate, and markup assertions for both chip shapes | 1 |
| `DOUBTS.md` | what this narrows and what it leaves | 2 |
| `CHANGELOG.md`, `CalendarEvent.prompt.md` | the record and the by-hand check | 3 |

---

## Before you start

- [ ] **Branch off `main` with a clean tree**

```bash
cd /home/juan/Dravensoft/Identity
git switch -c fix/calendar-actions-below
git status --short   # expect empty
```

- [ ] **Write the probe** — a throwaway, not committed. It reports, for every chip, its
  content box, whether it carries a kebab, where that kebab sits relative to the chip, and
  how much of the title is truncated.

```bash
mkdir -p "$CLAUDE_JOB_DIR/tmp"
cat > "$CLAUDE_JOB_DIR/tmp/kebab.mjs" <<'PROBE'
import { startStaticServer } from '/home/juan/Dravensoft/Identity/scripts/lib/static-server.mjs';
import { findChromium, launchChromium } from '/home/juan/Dravensoft/Identity/scripts/lib/chromium.mjs';
import { connect } from '/home/juan/Dravensoft/Identity/scripts/lib/cdp.mjs';

const ROOT = '/home/juan/Dravensoft/Identity';
const PAGE = 'frameworks/react/components/display/calendar/Calendar.card.html';

const EXPR = `(async () => {
  for (let i = 0; i < 120; i++) { if (document.querySelector('[role="grid"]')) break; await new Promise((r) => setTimeout(r, 50)); }
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 250));
  const out = [];
  for (const row of document.querySelectorAll('[role="row"]')) {
    for (const chip of row.children) {
      if (chip.getAttribute('role') === 'gridcell') continue;
      const kebab = chip.querySelector('button[aria-label="Actions"]');
      if (!kebab) continue;
      const cs = getComputedStyle(chip);
      const cr = chip.getBoundingClientRect();
      const kr = kebab.getBoundingClientRect();
      const title = [...chip.querySelectorAll('span')].find((s) => s.style.fontSize && s.style.fontSize.includes('dz-text-sm'));
      const tr = title.getBoundingClientRect();
      out.push({
        title: title.textContent,
        chipW: +cr.width.toFixed(1),
        chipH: +cr.height.toFixed(1),
        paddingRight: cs.paddingRight,
        contentW: +(cr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth)).toFixed(1),
        kebabAnchor: kr.top - cr.top < cr.bottom - kr.bottom ? 'top' : 'bottom',
        kebabInsetTop: +(kr.top - cr.top).toFixed(1),
        kebabInsetBottom: +(cr.bottom - kr.bottom).toFixed(1),
        titleOverlapsKebabPx: +Math.min(tr.bottom - kr.top, kr.bottom - tr.top).toFixed(1),
        titleTruncatedPct: title.scrollWidth ? +(100 * (1 - title.clientWidth / title.scrollWidth)).toFixed(0) : 0,
      });
    }
  }
  return out;
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
  console.log(JSON.stringify(result.value, null, 1));
} finally { cdp.close(); chrome.kill(); await server.close(); }
PROBE
bun "$CLAUDE_JOB_DIR/tmp/kebab.mjs"
```

Expected **before** any change, and worth keeping as the before-state: two chips, both
`kebabAnchor: "top"` and `paddingRight: "34px"`. `Client review — Northwind` reports
`contentW: 36.6` and `titleTruncatedPct: 74`; `Release window` reports `contentW: 119.2` and
`titleTruncatedPct: 0`.

---

## Task 1: The predicate, the token, and the two conditionals

**Files:**
- Modify: `contracts/design/component.json`
- Modify: `scripts/check-tailwind-coverage.mjs` (`EXCLUDED`)
- Modify: `frameworks/react/components/display/calendar/CalendarInternals.js`
- Modify: `frameworks/react/components/display/calendar/Calendar.jsx:258`
- Modify: `frameworks/react/components/display/calendar-event/CalendarEvent.jsx:8,84,102`
- Test: `frameworks/react/components/display/calendar/Calendar.test.jsx`
- Build output (do not hand-edit): `contracts/design-generated/spacing.css`,
  `frameworks/react/Tokens.generated.js`, `frameworks/angular/Tokens.generated.ts`, and the
  two compiled `.js` siblings

**Interfaces:**
- Consumes: `showsTime(chipHeight, slotWidth)` and `slotFor(cols)`, both already in place.
- Produces: `stacksActions(chipHeight, slotWidth)` exported from `CalendarInternals.js`, and
  the injected prop `actionsBelow` on `CalendarEvent`.

It is one task because the token cannot land without its consumer — see Global Constraints.

- [ ] **Step 1: Write the failing tests**

Append to `frameworks/react/components/display/calendar/Calendar.test.jsx`, and add
`stacksActions` to that file's existing import from `./CalendarInternals.js`:

```jsx
test('a chip stacks its kebab below only when it is narrow and tall enough', () => {
  assert.equal(stacksActions(66, 83), true, 'a tall chip in a half-width slot did not stack its kebab');
  assert.equal(stacksActions(44, 83), false, 'a 60-minute chip stacked a kebab that would overlap its title');
  assert.equal(stacksActions(66, 166), false, 'a full-width chip stacked its kebab, which it has room not to');
  assert.equal(stacksActions(26, 83), false, 'the shortest chip stacked its kebab');
});

test('the stacking threshold is inclusive, and an unmeasured container never stacks', () => {
  assert.equal(stacksActions(56, 83), true, 'a chip exactly at the threshold was refused');
  assert.equal(stacksActions(55.9, 83), false, 'the height threshold is not being applied');
  assert.equal(stacksActions(66, null), false, 'a server render stacked, so the static markup would move');
});

test('a stacked chip anchors its kebab to the bottom and reserves no lateral band', () => {
  const stacked = renderToStaticMarkup(
    <CalendarEvent id="a" title="Client review — Northwind" start="2026-07-20T10:00:00Z" end="2026-07-20T11:30:00Z"
      actionsEnabled actions={<button type="button">Delete</button>} actionsBelow
      box={{}} color="var(--color-cat-1)" timeLabel="10:00 – 11:30" dateLabel="Monday 20 July" />,
  );
  assert.match(stacked, /position:absolute;right:0;bottom:0/,
    'the kebab is not anchored to the chip bottom');
  assert.doesNotMatch(stacked, /padding-right:calc\(var\(--dz-ctl-h-sm\)/,
    'a stacked chip still reserves the lateral band, so the title gains nothing');
});

test('an unstacked chip keeps the top-right kebab and its reserve', () => {
  const plain = renderToStaticMarkup(
    <CalendarEvent id="a" title="Release window" start="2026-07-20T15:00:00Z" end="2026-07-20T16:30:00Z"
      actionsEnabled actions={<button type="button">Delete</button>}
      box={{}} color="var(--color-cat-1)" timeLabel="15:00 – 16:30" dateLabel="Monday 20 July" />,
  );
  assert.match(plain, /position:absolute;right:0;top:0/, 'the kebab left its conventional corner');
  assert.match(plain, /padding-right:calc\(var\(--dz-ctl-h-sm\) \+ var\(--bw\) \* 2\)/,
    'the unstacked chip lost the reserve that keeps its title clear of the kebab');
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
```

Expected: FAIL — the import of `stacksActions` throws, so the whole file errors. That is the
red; the two markup tests are red for the same reason and go green with the rest.

- [ ] **Step 3: Add the token**

In `contracts/design/component.json`, inside the `calendar` group after `time-min-w`, add:

```json
    ,
    "actions-below-min-h": {
      "$value": { "value": 56, "unit": "px" },
      "$description": "The shortest chip that can carry its kebab below its title rather than\nbeside it. Measured: 4px of padding, a 15px title line, the 32px kebab and 4px\nof padding again is 55px, rounded up to the 4px scale. Below it the two would\noverlap, so the chip keeps reserving a lateral band instead. Script-readable\nbecause it is compared against a projected pixel height.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    }
```

Take care with the comma: `time-min-w` currently ends the group, so the comma goes after its
closing brace, not before the new key. Read the file and place it correctly rather than
pasting the leading `,` literally.

- [ ] **Step 4: Rebuild and record it as excluded from the Tailwind coverage gate**

```bash
bun run build:tokens
grep -n 'actions-below' contracts/design-generated/spacing.css
grep -n 'calendarActionsBelowMinH' frameworks/react/Tokens.generated.js
```

Then, in `scripts/check-tailwind-coverage.mjs`, after the `calendar-time-min-w` entry:

```js
  ['calendar-actions-below-min-h', 'script-readable: compared in JS against a chip\'s projected pixel height to decide whether its kebab can sit below its title instead of beside it. Never rendered as a length'],
```

- [ ] **Step 5: Write the predicate**

In `frameworks/react/components/display/calendar/CalendarInternals.js`, extend the import on
line 1 and add the function immediately after `showsTime`:

```js
import { calendarActionsBelowMinH, calendarTimeMinH, calendarTimeMinW } from '../../../Tokens.generated.js';
```

```js
export function stacksActions(chipHeight, slotWidth) {
  return chipHeight >= calendarActionsBelowMinH && !showsTime(chipHeight, slotWidth);
}
```

`!showsTime(...)` is the whole "too narrow" condition and needs no width comparison of its
own: at a height of 56px or more the height term of `showsTime` is already satisfied, so its
returning false can only mean the slot is below `calendar.time-min-w`. An unmeasured slot
makes `showsTime` true, so `stacksActions` is false — which is the static-render behaviour
this plan requires.

- [ ] **Step 6: Inject it**

In `frameworks/react/components/display/calendar/Calendar.jsx`, add `stacksActions` to the
braced import from `./CalendarInternals.js` on lines 5-8, and at line 258 replace:

```jsx
                    showTime: showsTime(rawH, slotFor(p.cols)),
```

with:

```jsx
                    showTime: showsTime(rawH, slotFor(p.cols)),
                    actionsBelow: stacksActions(rawH, slotFor(p.cols)),
```

- [ ] **Step 7: Accept it in the chip**

In `frameworks/react/components/display/calendar-event/CalendarEvent.jsx`:

Line 8, add `actionsBelow` to the destructured injected props:

```jsx
  box, color, timeLabel, dateLabel, showTime, actionsBelow, tabIndex, defaultPanelOpen,
```

Line 84, make the reserve conditional on not stacking:

```jsx
        paddingRight: hasPanel && !actionsBelow ? KEBAB_RESERVE : 'calc(var(--sp-1) * 1.5)',
```

Line 102, anchor the kebab wrapper to whichever edge applies:

```jsx
          <span ref={kebabWrapRef} style={{ position: 'absolute', right: 0, ...(actionsBelow ? { bottom: 0 } : { top: 0 }) }}>
```

The spread rather than `top: actionsBelow ? 'auto' : 0` is deliberate: it sets exactly one of
the two longhands, so React clears the other when the flag flips, and `check:dimensions`
judges both as the zeros they are.

- [ ] **Step 8: Run the tests and every gate this touches**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
bun run build:demos && bun run check:demos
for g in dtcg tokens script-tokens coverage dimensions duplicate-constants api; do
  printf '%-24s' "check:$g"; bun run check:$g 2>&1 | tail -1
done
```

Expected: all PASS. `check:api` matters here — it reads `CalendarEvent.d.ts`, which must
**not** gain `actionsBelow`; if it does, an injected prop has become API.

- [ ] **Step 9: Measure**

```bash
bun "$CLAUDE_JOB_DIR/tmp/kebab.mjs"
```

Expected:

| Chip | Before | After |
|---|---|---|
| `Client review — Northwind` | `top`, `paddingRight 34px`, content 36.6, title 74% | **`bottom`**, **`paddingRight 6px`**, content **64.6**, title **18%** |
| `Release window` | `top`, `paddingRight 34px`, content 119.2, title 0% | unchanged |

`titleOverlapsKebabPx` must be **negative** on the stacked chip — the title's bottom sits
above the kebab's top. A positive number means the 56px threshold is wrong or is not being
applied.

- [ ] **Step 10: Commit**

```bash
git add contracts/design/component.json contracts/design-generated/ \
        frameworks/react/Tokens.generated.js frameworks/angular/Tokens.generated.ts \
        scripts/check-tailwind-coverage.mjs \
        frameworks/react/components/display/calendar/ \
        frameworks/react/components/display/calendar-event/
git commit -q -F - <<'MSG'
fix: a narrow, tall chip carries its kebab below its title

A chip that shares its column and carries actions had a 36.58px content box --
34px of its 78.6px went to the kebab's reserved band -- and rendered
"Client review — Northwind" as "Clien…". It now anchors the kebab to its
bottom-right and reserves nothing, so the title gets the whole 64.6px and
truncates at 18%, the same as its kebab-less neighbours.

The condition is narrow AND tall enough, and "narrow" reuses the threshold that
already suppresses the time label, so the chip has one notion of narrow rather
than two. "Tall enough" is 56px: 4px of padding, a 15px title line, the 32px
kebab and 4px of padding is 55px, and below that the two would overlap.

It reaches only events of roughly 75 minutes or more that share a column. That
is the honest extent of it, and the alternative that would reach further --
hiding the kebab, or not rendering it -- removes a control the consumer asked
for.

The panel improves as a side effect: it opens at top:100% of the kebab wrapper,
so with the kebab at the chip's bottom it now opens below the chip rather than
over its own body.
MSG
```

---

## Task 2: Record what this narrows and what it leaves

**Files:** `DOUBTS.md`

- [ ] **Step 1: Rewrite the entry this supersedes**

`DOUBTS.md`'s *A half-width chip carrying a kebab has almost no title left* entry (around
line 1488) is now wrong for tall chips and right only for short ones. Replace the whole
entry — both paragraphs, from `- **A half-width chip` down to `Deciding needs a spec.` — with:

```markdown
- **A narrow chip under 56px tall still has almost no title left.** Reserving the kebab's 34px
  band is what stopped the title being drawn underneath it, and on a full-width chip it costs
  nothing. On a chip sharing its slot — `cols: 2`, about 78px outer — it leaves a **36.58px**
  content box, which renders `Client review — Northwind` as `Clien…`.

  **A tall one no longer has this problem**: at 56px or more the kebab moves to the chip's
  bottom-right, the reserve is dropped, and the title gets the whole 64.6px and truncates at
  18% — the same as its kebab-less neighbours. 56px is the sum that makes the two fit without
  overlap, so the fix reaches events of roughly 75 minutes or more. A shorter chip has nowhere
  to put the kebab and keeps the reserve.

  What remains is therefore a short, narrow chip with actions: a 30- or 60-minute event
  sharing its column. The options for it all cost something and none is obviously right: show
  the kebab only on hover or focus (fails a touch reader, and the chip is a `grid` cell whose
  hover is not a given), or do not render it at all below some width (which makes
  `actionsEnabled` a request rather than a guarantee and silently removes the only route to
  the consumer's actions). Accepting it is the current position, and it is defensible: the
  chip is a hit target, and the detail lives behind the kebab.
```

- [ ] **Step 2: Record the threshold's blind spot**

Append to `## 5. Knowledge that used to live in code comments` in `DOUBTS.md`:

```markdown
### `frameworks/react/components/display/calendar/CalendarInternals.js` — the stacking threshold is a sum of measured parts, and nothing checks it

`calendar.actions-below-min-h` is 56px because a chip needs 4px of padding, a 15px title line,
a 32px kebab and 4px of padding again to stack them without overlap — 55px, rounded up to the
4px scale. **Three of those four numbers are not tokens.** The paddings are
`calc(var(--sp-1) * 1)` and would move with `--sp-1`; the kebab is `--dz-ctl-h-sm`, which is
26px under compact density rather than 32px; and the title line is `normal` line-height on
`--dz-text-sm`, which is not a token at all and changes with the font.

So the threshold is conservative under compact density and would go quietly short if the
chip's padding grew or its title font did. Nothing checks the sum: `check:script-tokens` holds
the token against its CSS twin, and `check:dimensions` never sees a comparison. What catches a
regression here is the ninth and tenth items of `CalendarEvent.prompt.md`'s by-hand checklist,
in a real browser, because `Calendar` binds the `grid` pattern and can have no render suite.
```

- [ ] **Step 3: Check and commit**

```bash
bun run check:docs
git add DOUBTS.md
git commit -q -m "docs: narrow the half-width chip entry to what the stacking fix leaves"
```

---

## Task 3: Close-out

**Files:** `CHANGELOG.md`, `frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md`

- [ ] **Step 1: Add the by-hand check**

The checklist runs to nine items. Append a tenth:

```markdown
10. On a chip that shares its column and is tall enough — a 90-minute event beside
    an overlap — the kebab sits at the BOTTOM-right and the title runs the full
    width above it. On a short one it stays top-right with the title stopping
    before it. Open the panel in the stacked case too: it hangs below the chip
    rather than over its own body, and every control in it is clickable.
```

- [ ] **Step 2: Log it**

Under `## [Unreleased]`'s `### Fixed` in `CHANGELOG.md`, after the existing Calendar entries:

```markdown
- **A narrow, tall `Calendar` chip carries its kebab below its title.** A chip sharing its
  column with actions gave 34px of its 78.6px to the kebab's reserved band, leaving a 36.58px
  content box and a title cut to five characters. It now anchors the kebab bottom-right and
  reserves nothing, so the title truncates at 18% rather than 74% — the same as its
  kebab-less neighbours. Short chips keep the lateral reserve, because the two would overlap.
```

- [ ] **Step 3: Sweep for cross-file claims**

```bash
cd /home/juan/Dravensoft/Identity
for X in Calendar CalendarEvent; do
  echo "=== $X ==="
  grep -rn --binary-files=without-match "\b$X\b" \
      --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
      CLAUDE.md DOUBTS.md contracts/ docs/ frameworks/ scripts/
done
```

Read every hit as a claim you may have just falsified. The one to check with care is
`contracts/design/README.md`'s component-geometry row, which now points at a command counting
the group's script-flagged tokens — run that command and confirm it answers **6**.

- [ ] **Step 4: The full sweep**

```bash
bun run check
```

Expected: every gate `PASS`. Do not proceed past a red gate.

- [ ] **Step 5: The human pass**

```bash
bun run demos
```

Open `http://localhost:8000/frameworks/react/components/display/calendar/Calendar.card.html`
at roughly 1100×620 and walk **all ten** checklist items — this change touches the chip's
style object and the kebab's position, so the keyboard route through the kebab and the panel
needs re-walking, not just the new geometry.

- [ ] **Step 6: Commit and report**

```bash
git add CHANGELOG.md frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md
git commit -q -m "docs: log the kebab stacking fix and add its by-hand check"
```

Report with the probe's numbers: `kebabAnchor`, `paddingRight`, `contentW` and
`titleTruncatedPct` for both kebab chips before and after; whether `bun run check` was fully
green; and what the human pass found.

- [ ] **Step 7: Retire the plan**

There is no spec for this change — the design was agreed in conversation and its reasoning
lives in the token's `$description` and in `DOUBTS.md`.

```bash
git rm docs/superpowers/plans/2026-07-29-calendar-actions-below.md
git commit -q -m "docs: retire the executed kebab stacking plan"
```

Then integrate the branch per `superpowers:finishing-a-development-branch`.
