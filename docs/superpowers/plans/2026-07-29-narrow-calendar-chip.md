# Narrow Calendar Chip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `Calendar` chip draws its time label only when it has room for it in both axes,
so the four `cols: 2` chips on `Calendar.card.html` stop wrapping a 78.02px label into a
64.6px box.

**Architecture:** The decision `Calendar` already makes on height gains its missing width
term. The combined rule moves out of the render body into a named pure function in
`CalendarInternals.js`, where it can be unit-tested without a DOM — which matters because
`Calendar` binds the `grid` pattern and can have no render suite. Both thresholds, and the
gutter width the width term needs as a number, become script-flagged DTCG tokens.

**Tech Stack:** DTCG 2025.10 tokens built by Style Dictionary (`bun run build:tokens`), React
18 inline styles, `bun test`, and the repo's headless-Chromium harness for the measurements
no gate can make.

## Global Constraints

- **No API change.** `showTime` is injected by `Calendar`, appears in no contract and in no
  `.d.ts`. A fix that adds a contract member has misread the problem.
- **Every dimension is a token or a derivation of tokens.** The thresholds are script-flagged
  DTCG tokens; `check:script-tokens` asserts the emitted modules match the source and the CSS.
- **`Calendar` binds the `grid` pattern, so it is DOM-tested by hand.** It cannot appear in
  `COVERED`, and no render suite can be added for it. Verification is the checklist in
  `CalendarEvent.prompt.md` plus a throwaway CDP probe.
- **The DOM-free suites assert on `renderToStaticMarkup`,** where the container width is
  `null`. They must stay green *and* keep asserting that the time label is present — a plan
  that finds itself deleting those assertions has broken the unmeasured-draws rule.
- **While the width is unknown, the label draws.** `useContainerWidth` reports `null` on a
  server and on the first client frame; in that state the width term is satisfied.
- **Editing a component `.jsx` means running `bun run build:demos` in the same tree.**
- **Never edit `contracts/design-generated/`** — edit the JSON and rebuild.
- **Do not add to `CLAUDE.md`.** It is within ~200 characters of the 60,000-character limit
  `check:docs` enforces, and nothing here requires a change there.
- **No comments** in framework sources. Facts worth keeping go to `DOUBTS.md`.
- English only, no emoji, present tense.

---

## Before you start

The spec and this plan are already committed on `spec/narrow-calendar-chip`, and the spec has
already dropped its `-pending-1` suffix. Confirm you are on that branch with a clean tree
before touching anything.

- [ ] **Confirm the starting state**

```bash
cd /home/juan/Dravensoft/Identity
git rev-parse --abbrev-ref HEAD    # expect spec/narrow-calendar-chip
git status --short                 # expect empty
ls docs/superpowers/specs/2026-07-29-narrow-calendar-chip.md   # no -pending-1
```

## The numbers this plan is built on

Measured in headless Chromium at 1100×620, and recorded so no step has to re-derive them.

| Quantity | Value |
|---|---|
| Time label `10:00 – 11:30` at `--dz-text-2xs` (10px, both densities) | **78.02px** |
| Chip padding a side / left border | 6px / 6px / 2px → content = outer − 14 |
| Kebab reserve, when `actionsEnabled` | 34px → content = outer − 42 |
| Chip outer vs its slot | outer = slot − 4 (the `- var(--sp-1)` in the injected width) |
| Day column at 1100×620 (6 days, 1052px container, 56px gutter) | 166px |
| Slot at `cols: 1` / `cols: 2` | 166px / 83px |
| Chip outer at `cols: 1` / `cols: 2` | 161.2px / 78.6px |

## The probe

Tasks 2 and 3 both measure the rendered page. Write this once, before Task 2, and reuse it —
it is a throwaway and is **not** committed.

```bash
mkdir -p "$CLAUDE_JOB_DIR/tmp"
cat > "$CLAUDE_JOB_DIR/tmp/chips.mjs" <<'PROBE'
import { startStaticServer } from '/home/juan/Dravensoft/Identity/scripts/lib/static-server.mjs';
import { findChromium, launchChromium } from '/home/juan/Dravensoft/Identity/scripts/lib/chromium.mjs';
import { connect } from '/home/juan/Dravensoft/Identity/scripts/lib/cdp.mjs';

const ROOT = '/home/juan/Dravensoft/Identity';
const PAGE = 'frameworks/react/components/display/calendar/Calendar.card.html';

const EXPR = `(async () => {
  for (let i = 0; i < 120; i++) {
    if (document.querySelector('[role="grid"]')) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 200));
  const section = document.querySelector('section[aria-label^="Schedule,"]');
  const strip = section.children[1];
  const gutter = section.children[2].firstElementChild.firstElementChild;
  const chips = [];
  for (const row of document.querySelectorAll('[role="row"]')) {
    for (const chip of row.children) {
      if (chip.getAttribute('role') === 'gridcell') continue;
      const cs = getComputedStyle(chip);
      const r = chip.getBoundingClientRect();
      const spans = [...chip.querySelectorAll('span')];
      const title = spans.find((s) => s.style.fontSize && s.style.fontSize.includes('dz-text-sm'));
      const time = spans.find((s) => s.style.fontFamily && s.style.fontFamily.includes('font-mono'));
      chips.push({
        title: title ? title.textContent : '(none)',
        slotW: +(row.getBoundingClientRect().width / Math.round(row.getBoundingClientRect().width / r.width)).toFixed(1),
        outerW: +r.width.toFixed(1),
        contentW: +(r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth)).toFixed(1),
        kebab: !!chip.querySelector('button[aria-label="Actions"]'),
        titleTruncatedPct: title && title.scrollWidth ? +(100 * (1 - title.clientWidth / title.scrollWidth)).toFixed(0) : null,
        timeText: time ? time.textContent : null,
        timeLines: time ? Math.round(time.getBoundingClientRect().height / 12) : 0,
      });
    }
  }
  return {
    gutter: { stripPaddingLeft: getComputedStyle(strip).paddingLeft, gutterWidth: getComputedStyle(gutter).width },
    dayColumnWidth: +document.querySelector('[role="row"]').getBoundingClientRect().width.toFixed(2),
    chips,
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
  const width = Number(process.argv[2] || 1100);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 620, deviceScaleFactor: 1, mobile: false }, sessionId);
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${server.port}/${PAGE}` }, sessionId);
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', { expression: EXPR, awaitPromise: true, returnByValue: true }, sessionId);
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  console.log(JSON.stringify(result.value, null, 1));
} finally {
  cdp.close();
  chrome.kill();
  await server.close();
}
PROBE
bun "$CLAUDE_JOB_DIR/tmp/chips.mjs" 1100
```

It takes an optional viewport width as its one argument, which Task 5 uses to walk the
768px–800px band.

**The threshold is on the slot, not on the chip.** `Calendar` has the slot directly —
`(containerWidth − gutter) / days.length / cols` — and deriving the chip's outer width from it
would need `--sp-1` as a number, while deriving the content box would need `CalendarEvent`'s
padding, which is the coupling the box-model fix already rejected. Folding both into the
threshold's value keeps `Calendar` reasoning about a quantity it owns.

**Derivation of `time-min-w`:** content = slot − 18 (4px slot-to-chip gutter, 12px padding,
2px border). The label needs 78.02px, so slot ≥ 96.02px, rounded up to the next step of the
4px spacing scale: **100px**. At `cols: 1` the slot is 166px and the label draws; at `cols: 2`
it is 83px and it does not.

## File map

| File | Responsibility | Task |
|---|---|---|
| `contracts/design/component.json` | the three new script-flagged tokens, in the existing `calendar` group | 1 |
| `contracts/design-generated/spacing.css`, `frameworks/react/Tokens.generated.js`, `frameworks/angular/Tokens.generated.ts` | build output — never hand-edited | 1 |
| `scripts/check-tailwind-coverage.mjs` | `EXCLUDED`, which must name every token that reaches no utility | 1 |
| `frameworks/react/components/display/calendar/CalendarInternals.js` | `showsTime()`, the pure rule, unit-testable with no DOM | 3 |
| `frameworks/react/components/display/calendar/Calendar.jsx` | `GUTTER` reads the token (T2); the slot arithmetic and the call to `showsTime` (T3) | 2, 3 |
| `frameworks/react/components/display/calendar/Calendar.test.jsx` | unit tests for `showsTime`, and the static-markup guard | 3 |
| `DOUBTS.md` | the residual band this leaves, and why the threshold is slot-shaped | 4 |
| `CHANGELOG.md`, `CalendarEvent.prompt.md` | the record and the by-hand check | 5 |

---

## Task 1: Three script-flagged tokens

**Files:**
- Modify: `contracts/design/component.json`
- Modify: `scripts/check-tailwind-coverage.mjs` (`EXCLUDED`, exported at line 7)
- Build output (do not hand-edit): `contracts/design-generated/spacing.css`,
  `frameworks/react/Tokens.generated.js`, `frameworks/angular/Tokens.generated.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `calendarGutterW = 56`, `calendarTimeMinH = 32` and `calendarTimeMinW = 100`,
  exported from `frameworks/react/Tokens.generated.js`, plus the custom properties
  `--calendar-gutter-w`, `--calendar-time-min-h` and `--calendar-time-min-w`. Tasks 2 and 3
  import them.

The naming rule is mechanical and already demonstrated by the group's one existing member:
`calendar.hour-h` emits `--calendar-hour-h` and `calendarHourH`.

- [ ] **Step 1: Add the tokens**

In `contracts/design/component.json`, inside the `calendar` group and after `hour-h`, add:

```json
    "gutter-w": {
      "$value": { "value": 56, "unit": "px" },
      "$description": "The width of the hour-label gutter down the left of the grid.\nScript-readable because the width term of showsTime() subtracts it from the\nmeasured container to get the grid's width, and no CSS expression hands a\nnumber to JS. It was calc(var(--sp-1) * 14) rendered inline: the same value in\ntwo idioms with nothing holding them in step. One token now, read both ways.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    },
    "time-min-h": {
      "$value": { "value": 32, "unit": "px" },
      "$description": "The shortest chip that still draws its time label. Below it there is no\nroom for a second line. Script-readable because it is compared against a\nprojected pixel height; it was a bare 32 in the render body, invisible to\ncheck:dimensions, which reads governed CSS properties and never a comparison.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    },
    "time-min-w": {
      "$value": { "value": 100, "unit": "px" },
      "$description": "The narrowest column share a chip may occupy and still draw its time\nlabel. Measured: the label is 78.02px at --dz-text-2xs, and a chip's content box\nis its share less 18px -- 4px of gutter to its neighbour, 12px of its own\npadding, 2px of its left border -- so 96.02px, rounded up to the 4px scale. The\nthreshold is on the share rather than on the chip so that Calendar never has to\nknow CalendarEvent's padding.",
      "$extensions": { "com.dravensoft.arena": { "script": true } }
    }
```

- [ ] **Step 2: Rebuild and read what came out**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:tokens
grep -n 'calendar' contracts/design-generated/spacing.css
grep -n 'calendar' frameworks/react/Tokens.generated.js frameworks/angular/Tokens.generated.ts
```

Expected: `--calendar-gutter-w:56px`, `--calendar-time-min-h:32px` and
`--calendar-time-min-w:100px` in the CSS, and `calendarGutterW`, `calendarTimeMinH` and
`calendarTimeMinW` exported from **both** layers' generated modules. Angular gets them and uses
none of them — the same as `calendarHourH` today, because Angular has no `Calendar`.
`check:script-tokens`' orphan rule is *imported by at least one layer*, so that is not a
failure.

- [ ] **Step 3: Run the token gates and watch `check:coverage` fail**

```bash
bun run check:dtcg
bun run check:tokens
bun run check:script-tokens
bun run check:coverage
```

Expected: the first three PASS. `check:coverage` **FAILS** with three lines of the form
`--calendar-gutter-w reaches no Tailwind utility — expose it in frameworks/tailwind/Theme.css
or add it to EXCLUDED with a reason`. That failure is the gate doing its job; step 4 answers it.

- [ ] **Step 4: Put the three on the record**

In `scripts/check-tailwind-coverage.mjs`, in the `EXCLUDED` map exported at line 7, beside the
existing `calendar-hour-h` entry, add:

```js
  ['calendar-gutter-w', 'script-readable: JS subtracts it from the measured container width to get the grid\'s width. Also rendered directly as var(--calendar-gutter-w) by Calendar, never through the @theme spacing scale this gate checks'],
  ['calendar-time-min-h', 'script-readable: compared in JS against a chip\'s projected pixel height to decide whether its time label fits vertically. Never rendered as a length'],
  ['calendar-time-min-w', 'script-readable: compared in JS against a chip\'s column share to decide whether its time label fits horizontally. Never rendered as a length'],
```

- [ ] **Step 5: Verify the gate now passes, and that it counted three more**

```bash
bun run check:coverage
bun test scripts/check-tailwind-coverage.test.mjs
```

Expected: PASS, and the summary line's excluded count is three higher than before. That suite
does not pin `EXCLUDED` by name — unlike `check-dimension-literals.test.mjs` — so no test edit
is needed here.

- [ ] **Step 6: Commit**

```bash
git add contracts/design/component.json contracts/design-generated/ \
        frameworks/react/Tokens.generated.js frameworks/angular/Tokens.generated.ts \
        scripts/check-tailwind-coverage.mjs
git commit -q -F - <<'MSG'
feat: token the calendar gutter and both time-label thresholds

All three are values JS must read: the gutter because the width term subtracts
it from a measured container, and the two thresholds because they are compared
against projected pixels. A comparison is invisible to check:dimensions, which
reads governed CSS properties, so the vertical threshold has sat in the render
body as a bare 32 with nothing holding it to the design layer.

The gutter also existed twice in two idioms -- calc(var(--sp-1) * 14) inline and
nothing in JS -- which is the shape onboarding-width was tokenised to fix.
MSG
```

---

## Task 2: `GUTTER` reads the token

**Files:**
- Modify: `frameworks/react/components/display/calendar/Calendar.jsx:4,10`

**Interfaces:**
- Consumes: `calendarGutterW` and `--calendar-gutter-w` from Task 1.
- Produces: `GUTTER === 'var(--calendar-gutter-w)'`. Task 3 uses the numeric export.

This lands on its own because it must change **nothing** that renders. Proving that separately
is what makes Task 3's measurement readable: if the gutter moves here, Task 3's numbers move
with it and neither change can be judged.

- [ ] **Step 1: Point the constant at the token**

In `frameworks/react/components/display/calendar/Calendar.jsx`, line 10, replace:

```jsx
const GUTTER = 'calc(var(--sp-1) * 14)';
```

with:

```jsx
const GUTTER = 'var(--calendar-gutter-w)';
```

`GUTTER` is used twice — the header strip's `paddingLeft` and the hour-label column's `width` —
and both are governed properties, so `check:dimensions` judges the new value. A bare
`var(--token)` passes.

- [ ] **Step 2: Rebuild and check**

```bash
bun run build:demos
bun run check:demos
bun run check:dimensions
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
```

Expected: all PASS. The static-markup assertions change from
`padding-left:calc(var(--sp-1) * 14)` to `padding-left:var(--calendar-gutter-w)`; if any suite
asserts the old string, update it here — `grep -rn 'sp-1) \* 14' frameworks/` finds them.

- [ ] **Step 3: Prove nothing moved**

```bash
bun "$CLAUDE_JOB_DIR/tmp/chips.mjs" 1100
```

Read the `gutter` and `dayColumnWidth` keys. Expected: `stripPaddingLeft` and `gutterWidth`
both `"56px"`, and `dayColumnWidth` **166** — the figures recorded above, before this change.
Any other value means the token's value is wrong, not that the refactor is subtle.

Read the `chips` array too and keep it: it is the before-state Task 3 compares against, and at
this point it must still show 3 time lines on `Client review — Northwind` and 2 on the other
three `cols: 2` chips.

- [ ] **Step 4: Commit**

```bash
git add frameworks/react/components/display/calendar/Calendar.jsx \
        frameworks/react/components/display/calendar/Calendar.js \
        frameworks/react/components/display/calendar/Calendar.test.jsx
git commit -q -F - <<'MSG'
refactor: the calendar gutter reads its token instead of restating it

No rendered value changes: measured, the header strip's padding-left and the
hour-label column's width are both still 56px and a day column is still 166px at
1100x620. It lands on its own so the next change's measurements are readable.
MSG
```

---

## Task 3: The width term, as a named pure rule

**Files:**
- Modify: `frameworks/react/components/display/calendar/CalendarInternals.js`
- Modify: `frameworks/react/components/display/calendar/Calendar.jsx:4,250` (the import, and
  the `showTime` injection inside `byDay[di].map`)
- Test: `frameworks/react/components/display/calendar/Calendar.test.jsx`

**Interfaces:**
- Consumes: `calendarTimeMinH` and `calendarTimeMinW` from Task 1.
- Produces: `showsTime(chipHeight, slotWidth)` exported from `CalendarInternals.js`, returning
  a boolean. `slotWidth` is `null` when the container has not been measured, and a `null`
  satisfies the width term.

**Why the rule moves out of the render body.** `Calendar` binds the `grid` pattern, so it can
have no render suite and cannot appear in `COVERED` — the grid-keyboard suite was retired at a
measured 164 MiB and is not coming back. A rule left inline in the render is therefore
verifiable only by a person in a browser. Extracted, it is a pure function of two numbers that
`Calendar.test.jsx` can exercise directly, with no DOM and no fixture. That is the only way
this decision gets real test coverage at all.

- [ ] **Step 1: Write the failing tests**

Append to `frameworks/react/components/display/calendar/Calendar.test.jsx`, and add
`showsTime` to that file's existing import from `./CalendarInternals.js` (or add the import if
the file has none):

```jsx
import { showsTime } from './CalendarInternals.js';

test('a chip draws its time label only when it has room in both axes', () => {
  assert.equal(showsTime(66, 166), true, 'a tall chip in a full-width slot drew no time label');
  assert.equal(showsTime(22, 166), false, 'a 30-minute chip drew a time label it has no height for');
  assert.equal(showsTime(66, 83), false, 'a tall chip in a half-width slot drew a label that cannot fit on one line');
  assert.equal(showsTime(22, 83), false, 'a chip failing both terms drew a time label');
});

test('the thresholds are inclusive, so a chip exactly at one still draws', () => {
  assert.equal(showsTime(32, 100), true, 'a chip exactly at both thresholds was refused its time label');
  assert.equal(showsTime(31.9, 100), false, 'the height threshold is not being applied');
  assert.equal(showsTime(32, 99.9), false, 'the width threshold is not being applied');
});

test('an unmeasured container satisfies the width term, so the static render is unchanged', () => {
  assert.equal(showsTime(66, null), true, 'a server render lost its time label');
  assert.equal(showsTime(22, null), false, 'the height term stopped applying when the width is unknown');
});
```

And, to guard the rule that the static render does not move:

```jsx
test('the static render still draws its time labels, because nothing has measured yet', () => {
  const html = render({});
  assert.match(html, /14:00 – 15:00/,
    'the server render lost a time label -- the width term is being applied before anything measured');
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
```

Expected: FAIL — `showsTime` is not exported from `CalendarInternals.js`, so the import throws
and the file's tests do not run. The last test would pass once the import resolves; it is there
as a regression guard, not as a red.

- [ ] **Step 3: Write the rule**

Append to `frameworks/react/components/display/calendar/CalendarInternals.js`:

```js
export function showsTime(chipHeight, slotWidth) {
  if (chipHeight < calendarTimeMinH) return false;
  return slotWidth === null || slotWidth >= calendarTimeMinW;
}
```

and add to that file's imports:

```js
import { calendarTimeMinH, calendarTimeMinW } from '../../../Tokens.generated.js';
```

Check the relative depth against the file's own location before writing it —
`CalendarInternals.js` sits in `components/display/calendar/`, the same directory as
`Calendar.jsx`, whose existing import of `Tokens.generated.js` is `'../../../Tokens.generated.js'`.

- [ ] **Step 4: Call it, and give it the slot**

In `frameworks/react/components/display/calendar/Calendar.jsx`, add `showsTime` to the existing
braced import from `./CalendarInternals.js` at lines 5-8, and add `calendarGutterW` to the
`Tokens.generated.js` import on line 4, which today reads `{ calendarHourH }`.

Then, in the render body, beside the other derived values and above the `return` (the block
around lines 62-75 that already defines `y`, `hours` and `slots` is the natural home), add:

```jsx
  const slotFor = (cols) =>
    width === null ? null : (width - calendarGutterW) / days.length / cols;
```

`slotFor` rather than `slotWidth`, so the helper does not shadow the parameter name
`showsTime` uses for the value it returns.

Finally, in the `byDay[di].map` callback, replace:

```jsx
                    showTime: rawH >= 32,
```

with:

```jsx
                    showTime: showsTime(rawH, slotFor(p.cols)),
```

Note it is `rawH` and not `h` that is passed: `h` is the floored CSS string
`max(calc(var(--sp-1) * 6.5), <rawH>px)`, and the height term asks about the event's own
projected height, which is what it has always asked about.

- [ ] **Step 5: Run the tests and the gates**

```bash
bun test frameworks/react/components/display/calendar/Calendar.test.jsx
bun run check:dimensions
bun run check:duplicate-constants
bun run build:demos && bun run check:demos
```

Expected: all PASS. `check:duplicate-constants` skips `tokens.generated.*` by name, so the
same three constants existing in both layers' generated modules is not a violation.

- [ ] **Step 6: Measure the result**

```bash
bun "$CLAUDE_JOB_DIR/tmp/chips.mjs" 1100
```

Compare the `chips` array against the one Task 2 step 3 recorded.

Expected, at 1100×620:

| Chip | Before | After |
|---|---|---|
| `Client review — Northwind` | 3 time lines | **no time label** |
| `Design critique` | 2 time lines | **no time label** |
| `Onsite — Acme` | 2 time lines | **no time label** |
| `Retro` | 2 time lines | **no time label** |
| `Release window` | 1 time line | 1 time line, unchanged |
| `Migration planning`, `Demo day`, `On-call handover` | 1 time line | 1 time line, unchanged |

Every title's truncation percentage must be unchanged — this task frees vertical space, not
horizontal. If a `cols: 1` chip lost its label, `slotWidth` is being computed per chip rather
than per slot, or `days.length` is wrong.

- [ ] **Step 7: Commit**

```bash
git add frameworks/react/components/display/calendar/CalendarInternals.js \
        frameworks/react/components/display/calendar/Calendar.jsx \
        frameworks/react/components/display/calendar/Calendar.js \
        frameworks/react/components/display/calendar/Calendar.test.jsx
git commit -q -F - <<'MSG'
fix: a calendar chip draws its time label only when it fits in both axes

Every cols=2 chip wrapped its label onto two lines, kebab or no kebab: the
label is 78.02px and the content box is 64.6px. Calendar already made the
vertical half of this decision and had no width term at all.

The rule is now showsTime() in CalendarInternals, a pure function of the chip's
projected height and its column share. That placement is what gives it test
coverage: Calendar binds the grid pattern, so it can have no render suite, and a
rule left in the render body is verifiable only by a person in a browser.

The threshold is on the column share rather than on the chip, so Calendar never
has to know CalendarEvent's padding. An unmeasured container satisfies the width
term, which keeps the static render identical.
MSG
```

---

## Task 4: Record what this leaves

**Files:**
- Modify: `DOUBTS.md`

**Interfaces:** consumes Tasks 1-3; produces nothing any task reads.

Two things are worth a reader's time, and one of them is a real residual.

- [ ] **Step 1: Record the residual band**

A single, kebab-unaware threshold leaves a narrow band in which a chip that carries a kebab
still wraps: its content box is its slot less **46px** (6px padding, the 34px reserve, 2px
border) rather than less 18px, so it needs a slot of 124.02px against a threshold of 100px.
Week view only exists above `--bp-md` (768px), and at a 768px container the slot is
`(768 − 56) / 6 = 118.7px`, reaching 124px at an 800px container. So the band is roughly
**768px to 800px of container width**, in week view, on a chip that has actions.

Add to `## 1. Known debt` in `DOUBTS.md`:

```markdown
- **A chip that carries a kebab can still wrap its time label, in a band about 32px wide.**
  `showsTime()` compares a chip's column share against one threshold and does not ask whether
  the chip has actions. A chip without them has a content box of its share less 18px; one with
  them has its share less 46px, because the kebab's 34px reserve comes out too. So the
  kebab-safe threshold is 124.02px where the plain one is 96.02px, and `calendar.time-min-w`
  is set at the plain one. Between a 768px container (week view's floor, `--bp-md`, where the
  slot is 118.7px) and roughly an 800px container, a chip with actions draws a label that
  wraps onto two lines.

  It is deliberate rather than overlooked. Setting the threshold at the kebab-safe value would
  suppress the label on every ordinary chip through that band and well past it, which loses
  information in the common case to serve the rare one. Making the threshold kebab-aware would
  put `CalendarEvent`'s 34px reserve back inside `Calendar` — laundered through a second token,
  but still a number that silently goes wrong if the reserve ever changes. What survives in the
  band is the pre-existing behaviour, not a new defect.
```

- [ ] **Step 2: Fix the entry this work falsifies**

`DOUBTS.md`'s existing *A half-width chip carrying a kebab has almost no title left* entry
(around line 1466) says the chip "renders `Client review — Northwind` as `Clien…` and wraps its
`10:00 – 11:30` time label onto three lines". After Task 3 that chip draws **no** time label at
all, so the second half of that sentence is false. Replace:

```markdown
  at **36.58px** measured, which renders `Client review — Northwind` as `Clien…` and wraps its
  `10:00 – 11:30` time label onto three lines. Before the reserve the same chip drew more of
```

with:

```markdown
  at **36.58px** measured, which renders `Client review — Northwind` as `Clien…`. It used to
  wrap its `10:00 – 11:30` time label onto three lines as well; it now draws no time label,
  because a chip sharing its slot has no room for one on a single line. Before the reserve the
  same chip drew more of
```

Read the surrounding sentence before editing — the paragraph continues "…its title, but drew
it *under* an opaque button", and the replacement above is written to keep that clause reading
correctly.

- [ ] **Step 3: Record why the threshold is slot-shaped**

Append to `## 5. Knowledge that used to live in code comments` in `DOUBTS.md`:

```markdown
### `frameworks/react/components/display/calendar/CalendarInternals.js` — why `showsTime` takes a slot and not a width

`showsTime(chipHeight, slotWidth)` compares against a chip's **column share** — the day column
divided by how many overlapping events share it — and not against the chip's own outer width or
its content box. Both of the closer quantities would have been wrong to use.

The content box would require `Calendar` to know `CalendarEvent`'s padding, its border and its
kebab reserve. That is the coupling rejected when the chip's box model was fixed, and for the
same reason: `Calendar` owns where a chip goes and how big it is, `CalendarEvent` owns what it
looks like. The chip's outer width would require `--sp-1` as a number in JS, to subtract the
gutter the injected `width: calc(100%/cols - var(--sp-1))` already accounts for.

So the 18px between a slot and the content inside it is folded into the token's value instead,
and `calendar.time-min-w` is 100px rather than the label's own 78.02px. **The consequence is
that the token's value is not independent of `CalendarEvent`'s padding** — it is 78.02 + 4 +
12 + 2, rounded up to the 4px scale — so a change to the chip's padding or border makes the
threshold quietly conservative or quietly short. Nothing checks that. It is the price of
keeping the arithmetic on the side of the boundary that owns the layout.
```

- [ ] **Step 4: Check and commit**

```bash
bun run check:docs
git add DOUBTS.md
git commit -q -F - <<'MSG'
docs: record the narrow-chip threshold's residual band and its shape

One kebab-unaware threshold leaves chips with actions wrapping between roughly a
768px and an 800px container. Deliberate: the kebab-safe value would suppress
the label on ordinary chips well past that band, and a kebab-aware one would put
CalendarEvent's reserve back inside Calendar.

Also recorded: the threshold is on the column share rather than the chip, which
keeps Calendar out of CalendarEvent's box model at the price of folding 18px of
that box model into the token's value, where nothing checks it.
MSG
```

---

## Task 5: Close-out

**Files:** `CHANGELOG.md`, `frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md`

- [ ] **Step 1: Add the by-hand check**

The chip geometry checklist in `CalendarEvent.prompt.md` runs to eight items. Append a ninth:

```markdown
9. A chip sharing its slot with an overlap draws no time label, and a chip that
   has the column to itself does. The label is redundant with the chip's own
   position on an hour grid, so it is the first thing to go when the chip is
   too small for it — the same call the component already makes on height.
```

- [ ] **Step 2: Log it**

Under `## [Unreleased]`'s `### Fixed` in `CHANGELOG.md`, after the existing Calendar entries:

```markdown
- **A `Calendar` chip draws its time label only when it fits in both axes.** Every chip
  sharing its column with an overlap wrapped a 78.02px label into a 64.6px box. `Calendar`
  already made the vertical half of that decision; the width term was never there. Both
  thresholds, and the gutter width the new term reads, are now script-flagged tokens — the
  vertical one had been a bare literal that `check:dimensions` cannot see, because that gate
  reads governed CSS properties and never a comparison.
```

- [ ] **Step 3: Sweep for cross-file claims**

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
components' own files and in `CHANGELOG.md`. The known live one is
`frameworks/tailwind/README.md`'s statement that `Calendar` has no manifest, which stays true.

- [ ] **Step 4: The full sweep**

```bash
bun run check
```

Expected: every gate `PASS`. A `SKIP` on a machine that has Chromium is a failure to
investigate. Do not proceed past a red gate — `check:demos` failing means a `.js` sibling was
not rebuilt, which would make step 5 judge the pre-fix component.

- [ ] **Step 5: The human pass**

```bash
bun run demos
```

Open `http://localhost:8000/frameworks/react/components/display/calendar/Calendar.card.html`
at roughly 1100×620 and walk **all nine** items of the checklist in
`CalendarEvent.prompt.md`, not only the new one — this change touches the render path of every
chip.

Then narrow the browser window through the 768px–800px band and look at
`Client review — Northwind`, the chip with actions. Its label wraps there; confirm it looks
like the recorded residual and not like something worse.

- [ ] **Step 6: Commit and report**

```bash
git add CHANGELOG.md frameworks/react/components/display/calendar-event/CalendarEvent.prompt.md
git commit -q -m "docs: log the narrow-chip fix and add its by-hand check"
```

Report, with the probe's numbers: the per-chip line counts before and after, that no title's
truncation moved, whether `bun run check` was fully green or `INCOMPLETE` and which gate
skipped, and what the human pass found — including the residual band.

- [ ] **Step 7: Retire the executed spec and plan**

Everything worth keeping is in `DOUBTS.md` (Task 4) and in the tokens' own `$description`s.

```bash
git rm docs/superpowers/specs/2026-07-29-narrow-calendar-chip.md \
       docs/superpowers/plans/2026-07-29-narrow-calendar-chip.md
git commit -q -F - <<'MSG'
docs: retire the narrow calendar chip spec and its plan

Both are executed. What outlived them is in DOUBTS.md -- the residual band and
why the threshold is slot-shaped -- and in the three tokens' own descriptions.
MSG
```

Then integrate the branch per `superpowers:finishing-a-development-branch`.
