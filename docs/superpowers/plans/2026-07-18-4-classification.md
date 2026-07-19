# Token/geometry boundary — the per-site classification

Produced by Task 3 of `2026-07-18-4-token-geometry-boundary.md`, from the output of
`bun scripts/check-dimension-literals.mjs --report` and
`bun scripts/check-dimension-literals.mjs --report=sites` (census taken at commit
`01d81fc`, 514 sites — this is the authority every editing task reads; the spec's
own counts (~290, "106 fontSize literals", etc.) are superseded and are not carried
forward here).

**Checkpoint 4 is answered.** Both clusters are resolved below and folded into the
`fs`/`dz` tables; this document carries the final assignment for all 514 sites.

## Three findings for Tasks 5 and 6 to read here, not in their own (superseded) briefs

1. **`dz` needs 4 new steps plus a reset, not the 2 Task 6's brief anticipated.**
   That brief assumed `dz.text` (14) and `dz.text-sm` (12) would cover the
   chrome-text sites. The per-site pass found two more pixel tiers that clear
   Rule 3 on their own terms (2+ independent components, not a rounding of a
   neighboring step) — `dz.text-md` (13px, 19 sites) and `dz.text-xs` (11px, 23
   sites, including the 5 Checkpoint 4 Cluster A eyebrow sites at 11px) — plus a
   third, `dz.text-2xs` (10px, 7 sites, including the 2 Checkpoint 4 Cluster A
   eyebrow sites at 10px), the "column header / row micro-label" tier. A fifth
   addition is not a text-size step at all: a `dz` reset for `lineHeight: 1`
   (8 sites) — the spec names this explicitly ("this box is exactly its
   glyph... the reset belongs to `dz`"). Task 6 should read this document for
   its scope, not its own brief's step count.

2. **`icon` needs a 4th step at 34px — this is Checkpoint 3's answer, not a new
   question for Task 5 to re-derive.** `EmptyState` and `ErrorState` both render
   their icon prop at 34px, an illustration-scale role distinct from the 14/16/18
   inline-control cluster the spec indicated. Two independent components clear
   Rule 3. Task 5's Checkpoint 3 asks "three steps or four" — the per-site pass
   answers "four," and Task 5 should present this finding rather than
   re-measuring it.

3. **Two `sp`-family sites are hand-reclassified to `borders`.** A 1px-wide
   `<span>` (`BulkActionBar`'s vertical divider) and a 1px-tall `<div>`
   (`Menu`'s item divider) both use `width`/`height` to render a hairline rule —
   functionally identical to a `border`, not a spacing value. The mechanical `sp`
   snap rule (a value that is neither `4n` nor `4n+2` snaps to the nearest grid
   multiple) would have sent `1px` to `0`, deleting both dividers outright. Caught
   by a spot-check of the mechanical `sp` output, not the per-site JSX read (see
   *Coverage* below). Both are listed under **borders**, targeting `var(--bw)`;
   the sibling property on the same JSX line (the divider's length or margin)
   correctly stays `sp`.

## How this was produced, and what "exhaustive" means here

Every one of the 514 sites was assigned individually — all 42 files under
`frameworks/react/components/**` and `frameworks/react/ui_kits/console/` were read
in full, and every `fontSize`, `letterSpacing`, `lineHeight`, `fontWeight` and
`zIndex` site (228 sites) was classified by reading the surrounding JSX to see what
text or glyph the property governs. This is a per-site pass, not a per-value one, for
exactly those five properties, because Rule 1 and Rule 2 require knowing what the text
*is*, not just what size it renders at.

The other 286 sites — `border*` (55), `borderRadius`-as-radius (1), and every
`padding`/`margin`/`gap`/`width`/`height`/`min*`/`max*`/`top`/`right`/`bottom`/`left`
site (229) — were classified **by value**, mechanically, per the brief's own
allowance ("where a value maps to one family unambiguously across every site... that
is sound and you should not pretend it was per-site"). The border and `sp` rules are
stated once below and applied uniformly; two sites where the mechanical rule would
have produced a visibly wrong result (a 1px divider snapping to 0 and disappearing)
were caught by eye during a spot-check of the mechanical output and corrected — see
finding 3 above. That spot-check covered every `sp`-family site whose value was NOT
a clean multiple of 4 (17 sites, all listed in the `sp` table's notes column) plus a
scan for `width`/`height` values of exactly 1, which is how the two dividers were
found. It did not re-derive every on-grid `calc()` by hand against the source file;
those are pure arithmetic on the census value and are not a place per-site judgement
can go wrong.

**Coverage statement:** exhaustive for all 514 sites in the sense that every one has a
row below. Per-site *reading* (not just per-value classification) was done for the 228
`fontSize`/`letterSpacing`/`lineHeight`/`fontWeight`/`zIndex` sites. The 286
`sp`/border/radius sites were classified by value with a targeted spot-check, not by
individually re-reading each file a second time for that property.

## Methodology notes — where judgement was needed beyond a direct rule lookup

1. **Rule 1's own chrome examples resolved most of the "mono micro-label" question.**
   Rule 1 names *"a field label, a column header, a hint, a validation error, a
   badge, a legend"* as chrome, verbatim. Input/Select/Textarea's `label`, Table's
   column header, Radio's hint, Input's validation error, Badge's text, and a chart
   legend all match one of those examples directly, so they are `dz`, not `fs` —
   this is Rule 1 applied literally, not the older narrative in
   `specs/2026-07-18-token-geometry-boundary-design.md` ("fs.xs is the token for the
   mono uppercase micro-label... the 10px and 9px micro-labels... snap to 11"), which
   is a superseded illustrative count, not one of the three rules this task was told
   to apply. Where the two disagree, Rule 1's literal text governs, per the outer
   task's own framing ("the three rules... verbatim from the spec"). This resolves
   roughly 60 sites without ambiguity.

2. **The one shape Rule 1 did not name either way was the "eyebrow"** — the small
   uppercase kicker above a title (Card, Dialog, ConfirmDialog, Onboarding's
   `eyebrow` prop; ChartCard/StatCard's category label; LoginScreen's "Delivery
   console"). It is not a "column header" or "field label" in Rule 1's list, and it
   is not a sentence either. **Resolved at Checkpoint 4, Cluster A, below: `dz`,
   zero pixel move.** Applying Rule 1's own read-aloud test to the *text itself*
   ("REVENUE" means nothing read aloud) settles it as chrome, consistent with the
   rest of the microlabel tiers this pass already resolved as `dz`. The
   consequence recorded explicitly by the author: `fs.xs` is left with no
   consumer in `frameworks/react/` — accepted, not overlooked, because `fs` is
   the editorial scale, the React layer is mostly chrome, and `fs.xs` is read
   elsewhere in the repo. It is not proposed for deletion.

3. **`dz` gains more than the two steps Task 6's brief anticipated.** See finding
   1, above.

4. **`icon` gains a fourth step beyond the spec's indicated 14/16/18.** See
   finding 2, above.

5. **Two `sp`-family sites are reclassified to `borders` by hand.** See finding
   3, above.

6. **Two `lineHeight` sites at 1.55, and three `letterSpacing` sites at -.01em,
   are treated as accidental drift rather than new steps**, using the exact
   precedent the spec itself sets for `ChartCard`/`StatCard`'s `.2em` vs `.22em`
   ("invisible by eye and purely accidental"). `lineHeight: 1.55` (Alert's message
   body, Textarea's value) is 0.05 off `lh.body` (1.6) and serves the identical
   prose-wrapping role — corrected to `lh.body` rather than minted as its own step.
   `letterSpacing: -.01em` (3 sites: Dialog/ConfirmDialog/Onboarding titles) is 0.01
   off the existing `ls.tight` (-0.02) and serves the identical "tight display
   heading" role — corrected the same way.

7. **Three genuine ties are flagged, not silently broken.** Avatar's
   `letterSpacing: .02em` is exactly equidistant between `ls.normal` (0) and the
   new `ls.mono-nav` (.04); Menu's item-icon `fontSize: 17` is exactly
   equidistant between `icon.md` (16) and `icon.lg` (18) — both are low-stakes
   and are marked with a default in their table row rather than escalated.
   `ProjectScreen`'s overview metric `fontSize: 28` is exactly equidistant
   between `fs.h3` (24) and `fs.h2` (32); this one is a type snap-direction
   question and folds into Checkpoint 1 (Task 11), so it carries a
   `PENDING CHECKPOINT 1` marker rather than a default, the same as the sites in
   finding 8 below.

8. **Checkpoint 4, Cluster B (the "message" sites) resolved to `fs`, and four of
   its seven sites carry a `PENDING CHECKPOINT 1` marker rather than a concrete
   target.** `fs`'s scale is 11/13/15/17/19/24/32/44/64. The four sites at 14px
   (`EmptyState.message`, `ErrorState.message`, `Onboarding.step.body`, `Menu`'s
   item text, and `CommandPalette`'s "No results for…" — five, not four; see the
   table below) are **exactly equidistant** between `fs.sm` (13) and `fs.md` (15).
   That is a snap-direction tie in a semantic family, which is Checkpoint 1's
   question (Task 11), not this task's to settle — an earlier pass over this
   document incorrectly called it "nearest is `fs.sm`, a 1px move," which is
   wrong; 14 is equidistant from both, not nearer to either. The two sites at
   13px (`Alert.children`, `Toast.message`) already sit exactly on `fs.sm`, no
   tie, concrete target.

## The `sp` rule, stated once

Per the spec: `sp` is numeric, so every value is a derivation, never a new named
token, regardless of how many components share it.

- **Multiple of 4** (on-grid): `calc(var(--sp-1) * k)`, using `k = value / 4`.
- **`4n + 2`** (half-step): `calc(var(--sp-1) * (k + 0.5))`, matching the spec's own
  worked examples (`* 2.5` for 10px, `* 1.5` for 6px, etc.).
- **Anything else** (`4n ± 1`) — "does not derive cleanly," per the spec's own
  treatment of 9px and 5px — **snaps** to the nearest multiple of 4. This rule was
  applied to every off-pattern value found, not only the two the spec names; the 17
  sites this produced (mostly 1px/3px/5px/7px/9px micro-adjustments — icon nudges,
  step-indicator dots, a divider's own margin) are listed with a pixel-move note in
  the `sp` table.

## The borders rule, stated once

42 sites at `1px` → `var(--bw)`. 4 sites at `2px` → `var(--bw-strong)`. The 2 sites
at `3px` (an event-color accent bar on `Calendar`, and `Toast`'s tone-colored left
bar — the same role in two components) have no existing 3px border step; adoption
only means no new step is minted, so both snap to the nearer of `{1,2}`, which is
`var(--bw-strong)`. One `borderRadius` literal survives outside the circle
exemption (a 10×10 legend swatch at `DoughnutChart`, `borderRadius: 2`) and is
listed separately under **radius**, snapping to `var(--r-xs)` (4px) — the nearest
existing radius step, since `r` has none smaller.

---

## fs — editorial type (Rule 1: prose)

Includes the 7 Checkpoint 4 Cluster B sites resolved to `fs` (marked in their
Note column): 5 of them (all at 14px) carry a `PENDING CHECKPOINT 1` target,
tied between `fs.sm`/`fs.md`; the other 2 (at 13px) land concretely on `fs.sm`.
8 sites in this table total carry a `PENDING CHECKPOINT 1` marker — those 5,
plus the 3 from the original pass (`Card.jsx:12`, `Onboarding.jsx:28`,
`ProjectScreen.jsx:80`). That direction belongs to Task 11.

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/display/Calendar.jsx:104` | `fontSize` | `15` | fs.md (15) — exact match | h2 range title, e.g. "March 2026"; a real heading element |
| `frameworks/react/components/display/Card.jsx:12` | `fontSize` | `18` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.lg=17 or fs.h4=19) | Card title, off-scale at 18 |
| `frameworks/react/components/display/StatCard.jsx:27` | `fontSize` | `32` | fs.h2 (32) — exact match | big stat value |
| `frameworks/react/components/feedback/Alert.jsx:21` | `fontSize` | `13` | fs.sm (13) — exact match | Alert body/children — CHECKPOINT 4 Cluster B resolved: fs, passes Rule 1's read-aloud test; already on-scale, no pixel move |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:18` | `fontSize` | `22` | fs.h3 (24) — snap, pixel move 22->24 | title; spec gives this direction unambiguously (unlike the 18-cluster) |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:20` | `fontSize` | `15` | fs.md (15) — exact match | dialog body prose |
| `frameworks/react/components/feedback/Dialog.jsx:35` | `fontSize` | `22` | fs.h3 (24) — snap, pixel move 22->24 |  |
| `frameworks/react/components/feedback/Dialog.jsx:37` | `fontSize` | `15` | fs.md (15) — exact match |  |
| `frameworks/react/components/feedback/EmptyState.jsx:8` | `fontSize` | `19` | fs.h4 (19) — exact match | EmptyState title |
| `frameworks/react/components/feedback/EmptyState.jsx:9` | `fontSize` | `14` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.sm=13 or fs.md=15, exactly tied) | EmptyState.message — CHECKPOINT 4 Cluster B resolved: fs, passes Rule 1's read-aloud test. 14 is exactly equidistant between fs.sm and fs.md, so the exact target is a snap-direction question for Task 11, not this task |
| `frameworks/react/components/feedback/ErrorState.jsx:9` | `fontSize` | `19` | fs.h4 (19) — exact match | ErrorState title |
| `frameworks/react/components/feedback/ErrorState.jsx:10` | `fontSize` | `14` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.sm=13 or fs.md=15, exactly tied) | ErrorState.message — CHECKPOINT 4 Cluster B resolved: fs, passes Rule 1's read-aloud test. 14 is exactly equidistant between fs.sm and fs.md |
| `frameworks/react/components/feedback/Onboarding.jsx:28` | `fontSize` | `18` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.lg=17 or fs.h4=19) | step.title, off-scale at 18, same cluster as Card.title |
| `frameworks/react/components/feedback/Onboarding.jsx:29` | `fontSize` | `14` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.sm=13 or fs.md=15, exactly tied) | Onboarding.step.body — CHECKPOINT 4 Cluster B resolved: fs, passes Rule 1's read-aloud test. 14 is exactly equidistant between fs.sm and fs.md |
| `frameworks/react/components/feedback/Toast.jsx:14` | `fontSize` | `13` | fs.sm (13) — exact match | Toast.message — CHECKPOINT 4 Cluster B resolved: fs, passes Rule 1's read-aloud test; already on-scale, no pixel move |
| `frameworks/react/components/navigation/CommandPalette.jsx:30` | `fontSize` | `14` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.sm=13 or fs.md=15, exactly tied) | "No results for …" — CHECKPOINT 4 Cluster B resolved: fs, passes Rule 1's read-aloud test. 14 is exactly equidistant between fs.sm and fs.md |
| `frameworks/react/components/navigation/Menu.jsx:68` | `fontSize` | `14` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.sm=13 or fs.md=15, exactly tied) | Menu item text — CHECKPOINT 4 Cluster B resolved: fs, passes Rule 1's read-aloud test. 14 is exactly equidistant between fs.sm and fs.md |
| `frameworks/react/components/navigation/PageHead.jsx:26` | `fontSize` | `13` | fs.sm (13) — exact match | PageHead subtitle, genuine prose under an h1 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:32` | `fontSize` | `34` | fs.h2 (32) — snap, pixel move 34->32 | unambiguous, diff 2 vs diff 10 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:14` | `fontSize` | `22` | fs.h3 (24) — snap, pixel move 22->24 | wordmark, unambiguous per spec |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:17` | `fontSize` | `26` | fs.h3 (24) — snap, pixel move 26->24 | "Welcome back" heading, unambiguous |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:80` | `fontSize` | `28` | fs — snap direction PENDING CHECKPOINT 1 (candidates fs.h3=24 or fs.h2=32, exactly tied) | overview metric value, off-scale at 28 |
| `frameworks/react/ui_kits/console/Shell.jsx:20` | `fontSize` | `17` | fs.lg (17) — exact match | Shell wordmark |

## dz — control density (Rule 1: chrome)

Includes the 7 Checkpoint 4 Cluster A sites resolved to `dz` (marked in their
Note column). Existing step: `dz.text` (14px). New steps this census supports
under Rule 3: `dz.text-md` (13px), `dz.text-xs` (11px), `dz.text-2xs` (10px), and
a `lineHeight: 1` reset. `dz.text-sm` (12px) is Task 6's own already-planned step.
See finding 1, above.

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/charts/BarChart.jsx:74` | `fontSize` | `11` | dz.text-xs (11) | chart tooltip category label |
| `frameworks/react/components/charts/BarChart.jsx:75` | `fontSize` | `13` | dz.text-md (13) | chart tooltip value (mono) |
| `frameworks/react/components/charts/ChartCard.jsx:17` | `fontSize` | `10` | dz.text-2xs (10) | ChartCard title, eyebrow-format category label — CHECKPOINT 4 Cluster A resolved: dz, zero pixel move ("REVENUE" read aloud means nothing, chrome per Rule 1) |
| `frameworks/react/components/charts/DoughnutChart.jsx:59` | `fontSize` | `12` | dz.text-sm (12) | doughnut legend label |
| `frameworks/react/components/charts/DoughnutChart.jsx:61` | `fontSize` | `12` | dz.text-sm (12) | doughnut legend value (mono) |
| `frameworks/react/components/charts/LineChart.jsx:92` | `fontSize` | `11` | dz.text-xs (11) | chart tooltip category label |
| `frameworks/react/components/charts/LineChart.jsx:93` | `fontSize` | `13` | dz.text-md (13) | chart tooltip value (mono) |
| `frameworks/react/components/display/Badge.jsx:16` | `fontSize` | `11` | dz.text-xs (11) | badge text |
| `frameworks/react/components/display/Calendar.jsx:82` | `fontSize` | `10` | dz.text-2xs (10) — NEW STEP | weekday column header; 2 components (Calendar, Table) at .12em tier |
| `frameworks/react/components/display/Calendar.jsx:102` | `fontSize` | `13` | dz.text-md (13) | "Today" button label |
| `frameworks/react/components/display/Calendar.jsx:118` | `fontSize` | `16` | dz.text (14) — snaps, pixel move 16->14 | day-of-month number; singleton chrome use of 16 (all other 16s are icons) |
| `frameworks/react/components/display/Calendar.jsx:174` | `fontSize` | `12` | dz.text-sm (12) | event title (calendar chip) |
| `frameworks/react/components/display/Calendar.jsx:177` | `fontSize` | `10` | dz.text-2xs (10) | event time sub-label |
| `frameworks/react/components/display/Card.jsx:11` | `fontSize` | `11` | dz.text-xs (11) | Card eyebrow prop — CHECKPOINT 4 Cluster A resolved: dz, zero pixel move |
| `frameworks/react/components/display/StatCard.jsx:23` | `fontSize` | `10` | dz.text-2xs (10) | StatCard label prop, eyebrow-format — CHECKPOINT 4 Cluster A resolved: dz, zero pixel move |
| `frameworks/react/components/display/StatCard.jsx:34` | `fontSize` | `12` | dz.text-sm (12) | delta pill text |
| `frameworks/react/components/display/StatCard.jsx:41` | `fontSize` | `12` | dz.text-sm (12) | sub caption, e.g. "vs last month" |
| `frameworks/react/components/display/Table.jsx:21` | `fontSize` | `10` | dz.text-2xs (10) | table column header |
| `frameworks/react/components/display/Tag.jsx:6` | `fontSize` | `13` | dz.text-md (13) | tag chip text |
| `frameworks/react/components/display/Tag.jsx:8` | `lineHeight` | `1` | dz reset (lineHeight 1) | icon-button box-tight alignment |
| `frameworks/react/components/feedback/Alert.jsx:18` | `lineHeight` | `1` | dz reset (lineHeight 1) |  |
| `frameworks/react/components/feedback/Alert.jsx:20` | `fontSize` | `14` | dz.text (14) — exact match | Alert title, e.g. "Deploy complete" — the Rule 1 "Deploy" example itself |
| `frameworks/react/components/feedback/Alert.jsx:25` | `fontSize` | `12` | dz.text-sm (12) | Alert action link, e.g. "UNDO" |
| `frameworks/react/components/feedback/Alert.jsx:32` | `lineHeight` | `1` | dz reset (lineHeight 1) |  |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:17` | `fontSize` | `11` | dz.text-xs (11) | ConfirmDialog eyebrow prop — CHECKPOINT 4 Cluster A resolved: dz, zero pixel move |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:24` | `fontSize` | `11` | dz.text-xs (11) | "Type X to confirm" sub-label |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:28` | `fontSize` | `14` | dz.text (14) — exact match | confirmation input value |
| `frameworks/react/components/feedback/Dialog.jsx:34` | `fontSize` | `11` | dz.text-xs (11) | Dialog eyebrow prop — CHECKPOINT 4 Cluster A resolved: dz, zero pixel move |
| `frameworks/react/components/feedback/EmptyState.jsx:7` | `lineHeight` | `1` | dz reset (lineHeight 1) |  |
| `frameworks/react/components/feedback/ErrorState.jsx:8` | `lineHeight` | `1` | dz reset (lineHeight 1) |  |
| `frameworks/react/components/feedback/ErrorState.jsx:11` | `fontSize` | `12` | dz.text-sm (12) | error code, e.g. "ERR_500" |
| `frameworks/react/components/feedback/Onboarding.jsx:20` | `fontSize` | `11` | dz.text-xs (11) | Onboarding Back/Skip button labels |
| `frameworks/react/components/feedback/Onboarding.jsx:27` | `fontSize` | `11` | dz.text-xs (11) | Onboarding step.eyebrow — CHECKPOINT 4 Cluster A resolved: dz, zero pixel move |
| `frameworks/react/components/feedback/Onboarding.jsx:44` | `fontSize` | `13` | dz.text-md (13) | Next / Got it button label |
| `frameworks/react/components/feedback/ProgressBar.jsx:31` | `fontSize` | `13` | dz.text-md (13) | progress label |
| `frameworks/react/components/feedback/ProgressBar.jsx:32` | `fontSize` | `12` | dz.text-sm (12) | progress percentage |
| `frameworks/react/components/feedback/Toast.jsx:13` | `fontSize` | `14` | dz.text (14) — exact match | Toast title |
| `frameworks/react/components/feedback/Toast.jsx:13` | `fontSize` | `9` | dz.text-2xs (10) — snaps, pixel move 9->10 | "Pinned" badge, singleton at 9 |
| `frameworks/react/components/feedback/Toast.jsx:18` | `fontSize` | `12` | dz.text-sm (12) | Toast action link |
| `frameworks/react/components/feedback/Toast.jsx:24` | `lineHeight` | `1` | dz reset (lineHeight 1) |  |
| `frameworks/react/components/feedback/Tooltip.jsx:30` | `fontSize` | `11` | dz.text-xs (11) | tooltip content — Rule 1 names "a hint" as chrome explicitly |
| `frameworks/react/components/forms/Button.jsx:27` | `fontSize` | `13` | dz.text-md (13) | Button sm label |
| `frameworks/react/components/forms/Button.jsx:28` | `fontSize` | `14` | dz.text (14) — exact match | Button md label |
| `frameworks/react/components/forms/Button.jsx:29` | `fontSize` | `15` | dz.text (14) — snaps, pixel move 15->14 | Button lg label, singleton at 15 |
| `frameworks/react/components/forms/Checkbox.jsx:11` | `fontSize` | `14` | dz.text (14) — exact match | Checkbox label |
| `frameworks/react/components/forms/IconButton.jsx:24` | `fontSize` | `14` | dz.text (14) — exact match | IconButton visible label (showLabel), not the icon itself |
| `frameworks/react/components/forms/IconButton.jsx:24` | `lineHeight` | `1` | dz reset (lineHeight 1) |  |
| `frameworks/react/components/forms/Input.jsx:54` | `fontSize` | `11` | dz.text-xs (11) | Input field label — Rule 1 names "a field label" as chrome explicitly |
| `frameworks/react/components/forms/Input.jsx:63` | `fontSize` | `13` | dz.text-md (13) | Input prefix, e.g. "$" |
| `frameworks/react/components/forms/Input.jsx:68` | `fontSize` | `14` | dz.text (14) — exact match | Input value |
| `frameworks/react/components/forms/Input.jsx:72` | `fontSize` | `12` | dz.text-sm (12) | validation error — Rule 1 chrome example |
| `frameworks/react/components/forms/Input.jsx:73` | `fontSize` | `12` | dz.text-sm (12) | hint — Rule 1 chrome example |
| `frameworks/react/components/forms/Radio.jsx:26` | `fontSize` | `14` | dz.text (14) — exact match | Radio option label |
| `frameworks/react/components/forms/Radio.jsx:27` | `fontSize` | `12` | dz.text-sm (12) | Radio hint |
| `frameworks/react/components/forms/Select.jsx:6` | `fontSize` | `11` | dz.text-xs (11) | Select field label |
| `frameworks/react/components/forms/Select.jsx:13` | `fontSize` | `14` | dz.text (14) — exact match | select value |
| `frameworks/react/components/forms/Select.jsx:20` | `fontSize` | `12` | dz.text-sm (12) | caret glyph "▾" — a hardcoded unicode character, not a Phosphor icon; Rule 2 does not apply, treated as chrome decoration |
| `frameworks/react/components/forms/Switch.jsx:19` | `fontSize` | `14` | dz.text (14) — exact match | Switch label |
| `frameworks/react/components/forms/Textarea.jsx:17` | `fontSize` | `11` | dz.text-xs (11) | Textarea field label |
| `frameworks/react/components/forms/Textarea.jsx:27` | `fontSize` | `14` | dz.text (14) — exact match | textarea value |
| `frameworks/react/components/forms/Textarea.jsx:31` | `fontSize` | `12` | dz.text-sm (12) | error |
| `frameworks/react/components/forms/Textarea.jsx:32` | `fontSize` | `12` | dz.text-sm (12) | hint |
| `frameworks/react/components/forms/Textarea.jsx:33` | `fontSize` | `11` | dz.text-xs (11) | char counter |
| `frameworks/react/components/navigation/Breadcrumbs.jsx:10` | `fontSize` | `12` | dz.text-sm (12) | breadcrumb item |
| `frameworks/react/components/navigation/Breadcrumbs.jsx:23` | `fontSize` | `12` | dz.text-sm (12) | breadcrumb separator "/" |
| `frameworks/react/components/navigation/BulkActionBar.jsx:12` | `fontSize` | `12` | dz.text-sm (12) | "N items selected" |
| `frameworks/react/components/navigation/BulkActionBar.jsx:21` | `fontSize` | `13` | dz.text-md (13) | bulk action button label |
| `frameworks/react/components/navigation/BulkActionBar.jsx:33` | `fontSize` | `11` | dz.text-xs (11) | "Clear" button |
| `frameworks/react/components/navigation/CommandPalette.jsx:26` | `fontSize` | `15` | dz.text (14) — snaps, pixel move 15->14 | search input value, singleton at 15 |
| `frameworks/react/components/navigation/CommandPalette.jsx:27` | `fontSize` | `11` | dz.text-xs (11) | "ESC" pill |
| `frameworks/react/components/navigation/CommandPalette.jsx:36` | `fontSize` | `14` | dz.text (14) — exact match | command label |
| `frameworks/react/components/navigation/CommandPalette.jsx:37` | `fontSize` | `11` | dz.text-xs (11) | shortcut, e.g. "⌘K" |
| `frameworks/react/components/navigation/Menu.jsx:48` | `fontSize` | `10` | dz.text-2xs (10) | Menu section header |
| `frameworks/react/components/navigation/Menu.jsx:71` | `fontSize` | `11` | dz.text-xs (11) | Menu shortcut |
| `frameworks/react/components/navigation/Pagination.jsx:29` | `fontSize` | `13` | dz.text-md (13) | pagination ellipsis |
| `frameworks/react/components/navigation/Pagination.jsx:33` | `fontSize` | `13` | dz.text-md (13) | page number button |
| `frameworks/react/components/navigation/SegmentedControl.jsx:19` | `fontSize` | `12` | dz.text-sm (12) | SegmentedControl sm option |
| `frameworks/react/components/navigation/SegmentedControl.jsx:20` | `fontSize` | `13` | dz.text-md (13) | SegmentedControl md option |
| `frameworks/react/components/navigation/Tabs.jsx:13` | `fontSize` | `14` | dz.text (14) — exact match | Tabs label |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:31` | `fontSize` | `11` | dz.text-xs (11) | DashboardScreen metric label, e.g. "Active projects" — .14em tracking places it with field-label, not eyebrow |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:47` | `fontSize` | `12` | dz.text-sm (12) | build # (mono) |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:48` | `fontSize` | `12` | dz.text-sm (12) | "when" (mono) |
| `frameworks/react/ui_kits/console/Icon.jsx:12` | `lineHeight` | `1` | dz reset (lineHeight 1) | Icon.jsx wrapper |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:16` | `fontSize` | `11` | dz.text-xs (11) | LoginScreen "Delivery console" eyebrow — CHECKPOINT 4 Cluster A resolved: dz, zero pixel move |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:23` | `fontSize` | `13` | dz.text-md (13) | "Forgot your password?" — functions as a nav link despite the interrogative phrasing; judgment call, not escalated |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:37` | `fontSize` | `12` | dz.text-sm (12) | client label |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:45` | `fontSize` | `11` | dz.text-xs (11) | client label (deploy tab) |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:50` | `fontSize` | `13` | dz.text-md (13) | build # (mono) |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:51` | `fontSize` | `14` | dz.text (14) — exact match | env value |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:53` | `fontSize` | `13` | dz.text-md (13) | author (mono) |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:54` | `fontSize` | `13` | dz.text-md (13) | duration (mono) |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:67` | `fontSize` | `14` | dz.text (14) — exact match | activity row text, e.g. "ana@ approved the release"; judgment call (structured data row, not authored prose), not escalated |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:67` | `fontSize` | `13` | dz.text-md (13) | inline build ref |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:68` | `fontSize` | `12` | dz.text-sm (12) | timestamp |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:80` | `fontSize` | `11` | dz.text-xs (11) | metric label, e.g. "Uptime" |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:85` | `fontSize` | `14` | dz.text (14) — exact match | "Release 2.5 — SEPA gateway" — a noun phrase/label, not a subject+verb sentence; judgment call, not escalated |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:86` | `fontSize` | `12` | dz.text-sm (12) | "in 6 days" |
| `frameworks/react/ui_kits/console/Shell.jsx:28` | `fontSize` | `14` | dz.text (14) — exact match | nav item label |
| `frameworks/react/ui_kits/console/Shell.jsx:34` | `fontSize` | `13` | dz.text-md (13) | avatar initial "A" |
| `frameworks/react/ui_kits/console/Shell.jsx:35` | `fontSize` | `13` | dz.text-md (13) | person name |
| `frameworks/react/ui_kits/console/Shell.jsx:35` | `fontSize` | `11` | dz.text-xs (11) | role label, e.g. "Delivery Lead" |

## icon (Rule 2)

Steps: `icon.sm` (14), `icon.md` (16), `icon.lg` (18), and `icon.xl` (34, new — see
finding 2, above).

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/display/Calendar.jsx:88` | `fontSize` | `16` | icon.md (16) | prev/next chevron |
| `frameworks/react/components/display/StatCard.jsx:24` | `fontSize` | `14` | icon.sm (14) | optional stat icon |
| `frameworks/react/components/display/Tag.jsx:8` | `fontSize` | `14` | icon.sm (14) | remove (x) icon |
| `frameworks/react/components/feedback/Alert.jsx:18` | `fontSize` | `20` | icon.lg (18) — snaps, pixel move 20->18 | Alert tone icon; singleton value 20 among icon sizes |
| `frameworks/react/components/feedback/Alert.jsx:32` | `fontSize` | `16` | icon.md (16) | Alert close (x) |
| `frameworks/react/components/feedback/EmptyState.jsx:7` | `fontSize` | `34` | icon.xl (34) — NEW STEP | 2 components (EmptyState, ErrorState); illustration-scale icon, distinct role from the 14/16/18 control-icon cluster |
| `frameworks/react/components/feedback/ErrorState.jsx:8` | `fontSize` | `34` | icon.xl (34) | paired with EmptyState, confirms the 2-component step |
| `frameworks/react/components/feedback/Toast.jsx:24` | `fontSize` | `16` | icon.md (16) | Toast close (x) |
| `frameworks/react/components/forms/Input.jsx:69` | `fontSize` | `16` | icon.md (16) | error status icon |
| `frameworks/react/components/forms/Input.jsx:70` | `fontSize` | `16` | icon.md (16) | valid status icon |
| `frameworks/react/components/forms/Switch.jsx:19` | `fontSize` | `14` | icon.sm (14) | "requires confirmation" shield glyph, same line as the label |
| `frameworks/react/components/navigation/BulkActionBar.jsx:26` | `fontSize` | `16` | icon.md (16) | bulk action icon |
| `frameworks/react/components/navigation/CommandPalette.jsx:24` | `fontSize` | `18` | icon.lg (18) | magnifier |
| `frameworks/react/components/navigation/CommandPalette.jsx:35` | `fontSize` | `18` | icon.lg (18) | command item icon |
| `frameworks/react/components/navigation/Menu.jsx:69` | `fontSize` | `17` | icon.md (16) — TIE, see note | Menu item icon, singleton at 17, exactly equidistant between icon.md(16) and icon.lg(18); defaulted to md, flagged not a hard stop |
| `frameworks/react/components/navigation/Pagination.jsx:20` | `fontSize` | `16` | icon.md (16) | pagination chevron |

## z — layering

Family assignment only. The order and the exact token names are Checkpoint 2,
reserved for Task 4 — not answered here.

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/feedback/ConfirmDialog.jsx:11` | `zIndex` | `1000` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |
| `frameworks/react/components/feedback/Dialog.jsx:27` | `zIndex` | `1000` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |
| `frameworks/react/components/feedback/Onboarding.jsx:12` | `zIndex` | `1200` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |
| `frameworks/react/components/feedback/Onboarding.jsx:17` | `zIndex` | `1200` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |
| `frameworks/react/components/feedback/Onboarding.jsx:23` | `zIndex` | `1190` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |
| `frameworks/react/components/feedback/Tooltip.jsx:30` | `zIndex` | `900` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |
| `frameworks/react/components/navigation/CommandPalette.jsx:19` | `zIndex` | `1100` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |
| `frameworks/react/components/navigation/Menu.jsx:43` | `zIndex` | `900` | z family — order/name PENDING CHECKPOINT 2 (Task 4) | |

## ls — tracking

Existing: `ls.tight` (-.02), `ls.normal` (0), `ls.label` (.22), `ls.wide` (.34, kept,
no React consumer in this census — used by the Overview, per the author's standing
ruling). New steps this census supports under Rule 3: `ls.field-label` (.14),
`ls.column-header` (.12), `ls.badge` (.1), `ls.uppercase-status` (.06),
`ls.mono-nav` (.04). This table was unaffected by Checkpoint 4 — the eyebrow
sites' `letterSpacing` was already `ls.label` regardless of whether the
`fontSize` landed in `fs` or `dz`; only the sibling `fontSize` rows moved.

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/charts/ChartCard.jsx:17` | `letterSpacing` | `'.2em'` | ls.label (.22) | drift-correct from .2em (same as ChartCard/StatCard case the spec names) |
| `frameworks/react/components/display/Avatar.jsx:14` | `letterSpacing` | `'.02em'` | ls.normal (0) — TIE, see note | Avatar initials, singleton; equidistant from ls.normal(0) and ls.mono-nav(.04), both .02 away. Defaulted to normal (a glyph pair reads closer to "no tracking" than to a nav role); flagged, not a hard stop. |
| `frameworks/react/components/display/Badge.jsx:16` | `letterSpacing` | `'.1em'` | ls.badge (.1) — NEW STEP | 2 components (Badge, BulkActionBar Clear) |
| `frameworks/react/components/display/Calendar.jsx:82` | `letterSpacing` | `'.12em'` | ls.column-header (.12) — NEW STEP | 4 components (Table, Calendar, Toast, ProjectScreen) |
| `frameworks/react/components/display/Calendar.jsx:135` | `letterSpacing` | `'.06em'` | ls.uppercase-status (.06) — NEW STEP | hour-label override; 4 components |
| `frameworks/react/components/display/Card.jsx:11` | `letterSpacing` | `'.22em'` | ls.label (.22) — exact match |  |
| `frameworks/react/components/display/StatCard.jsx:23` | `letterSpacing` | `'.2em'` | ls.label (.22) | drift-correct from .2em |
| `frameworks/react/components/display/Table.jsx:21` | `letterSpacing` | `'.12em'` | ls.column-header (.12) |  |
| `frameworks/react/components/feedback/Alert.jsx:25` | `letterSpacing` | `'.06em'` | ls.uppercase-status (.06) |  |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:17` | `letterSpacing` | `'.22em'` | ls.label (.22) |  |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:18` | `letterSpacing` | `'-.01em'` | ls.tight (-.02) — drift-correct from -.01 |  |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:24` | `letterSpacing` | `'.14em'` | ls.field-label (.14) — NEW STEP | 7 components |
| `frameworks/react/components/feedback/Dialog.jsx:34` | `letterSpacing` | `'.22em'` | ls.label (.22) |  |
| `frameworks/react/components/feedback/Dialog.jsx:35` | `letterSpacing` | `'-.01em'` | ls.tight (-.02) — drift-correct |  |
| `frameworks/react/components/feedback/Onboarding.jsx:20` | `letterSpacing` | `'.06em'` | ls.uppercase-status (.06) |  |
| `frameworks/react/components/feedback/Onboarding.jsx:27` | `letterSpacing` | `'.22em'` | ls.label (.22) |  |
| `frameworks/react/components/feedback/Onboarding.jsx:28` | `letterSpacing` | `'-.01em'` | ls.tight (-.02) — drift-correct |  |
| `frameworks/react/components/feedback/Toast.jsx:13` | `letterSpacing` | `'.12em'` | ls.column-header (.12) |  |
| `frameworks/react/components/feedback/Toast.jsx:18` | `letterSpacing` | `'.06em'` | ls.uppercase-status (.06) |  |
| `frameworks/react/components/forms/Button.jsx:74` | `letterSpacing` | `'.01em'` | ls.normal (0) — snap | Button label, singleton at .01 |
| `frameworks/react/components/forms/Input.jsx:54` | `letterSpacing` | `'.14em'` | ls.field-label (.14) |  |
| `frameworks/react/components/forms/Select.jsx:6` | `letterSpacing` | `'.14em'` | ls.field-label (.14) |  |
| `frameworks/react/components/forms/Textarea.jsx:17` | `letterSpacing` | `'.14em'` | ls.field-label (.14) |  |
| `frameworks/react/components/navigation/Breadcrumbs.jsx:10` | `letterSpacing` | `'.04em'` | ls.mono-nav (.04) — NEW STEP | 2 components (Breadcrumbs, BulkActionBar) |
| `frameworks/react/components/navigation/BulkActionBar.jsx:12` | `letterSpacing` | `'.04em'` | ls.mono-nav (.04) |  |
| `frameworks/react/components/navigation/BulkActionBar.jsx:33` | `letterSpacing` | `'.1em'` | ls.badge (.1) |  |
| `frameworks/react/components/navigation/Menu.jsx:48` | `letterSpacing` | `'.16em'` | ls.field-label (.14) — snap | singleton at .16, nearer to field-label(.14) than label(.22) |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:31` | `letterSpacing` | `'.14em'` | ls.field-label (.14) |  |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:14` | `letterSpacing` | `'-.02em'` | ls.tight (-.02) — exact match |  |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:16` | `letterSpacing` | `'.22em'` | ls.label (.22) — exact match |  |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:37` | `letterSpacing` | `'.14em'` | ls.field-label (.14) | value/tracking tier mismatch with the 11px field-label cluster, noted |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:45` | `letterSpacing` | `'.12em'` | ls.column-header (.12) |  |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:80` | `letterSpacing` | `'.14em'` | ls.field-label (.14) |  |
| `frameworks/react/ui_kits/console/Shell.jsx:20` | `letterSpacing` | `'-.02em'` | ls.tight (-.02) — exact match |  |

## lh — line height

Existing: `lh.tight` (.98), `lh.snug` (1.15), `lh.body` (1.6). No new steps —
every site here either matches an existing step, snaps to the nearest one, or is a
drift-correction to `lh.body` (see methodology note 6). The `lineHeight: 1` sites are
not in this table — they are a `dz` reset, listed under **dz**. This table was
unaffected by Checkpoint 4 — the message sites' `lineHeight` is prose-shaped either
way, independent of whether their `fontSize` landed in `fs` or `dz`.

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/display/StatCard.jsx:27` | `lineHeight` | `1.1` | lh.snug (1.15) — snap | nearest of tight/snug/body to 1.1 |
| `frameworks/react/components/feedback/Alert.jsx:21` | `lineHeight` | `1.55` | lh.body (1.6) — drift-correct from 1.55 | independent of the fs/dz outcome above; the wrap is prose-shaped either way |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:20` | `lineHeight` | `1.6` | lh.body (1.6) — exact match |  |
| `frameworks/react/components/feedback/Dialog.jsx:37` | `lineHeight` | `1.6` | lh.body (1.6) — exact match |  |
| `frameworks/react/components/feedback/EmptyState.jsx:9` | `lineHeight` | `1.6` | lh.body (1.6) — exact match | independent of fs/dz outcome |
| `frameworks/react/components/feedback/ErrorState.jsx:10` | `lineHeight` | `1.6` | lh.body (1.6) — exact match |  |
| `frameworks/react/components/feedback/Onboarding.jsx:29` | `lineHeight` | `1.6` | lh.body (1.6) — exact match |  |
| `frameworks/react/components/forms/Radio.jsx:26` | `lineHeight` | `1.3` | lh.snug (1.15) — snap |  |
| `frameworks/react/components/forms/Radio.jsx:27` | `lineHeight` | `1.4` | lh.body (1.6) — snap | nearer to body than snug |
| `frameworks/react/components/forms/Textarea.jsx:27` | `lineHeight` | `1.55` | lh.body (1.6) — drift-correct from 1.55 |  |
| `frameworks/react/components/navigation/PageHead.jsx:27` | `lineHeight` | `1.5` | lh.body (1.6) — snap |  |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:85` | `lineHeight` | `1.6` | lh.body (1.6) — exact match | independent of the fs/dz call above |
| `frameworks/react/ui_kits/console/Shell.jsx:35` | `lineHeight` | `1.2` | lh.snug (1.15) — snap |  |

## fw — weight (adoption only)

Direct value-to-token mapping; `fw` already declares all four weights found.

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/display/Avatar.jsx:14` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/display/Badge.jsx:16` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/display/Calendar.jsx:82` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/display/Calendar.jsx:102` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/display/Calendar.jsx:104` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/display/Calendar.jsx:118` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/display/Calendar.jsx:174` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/display/Card.jsx:12` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/display/StatCard.jsx:27` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/display/StatCard.jsx:34` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/display/Table.jsx:22` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/feedback/Alert.jsx:20` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/feedback/Alert.jsx:25` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:18` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/feedback/Dialog.jsx:35` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/feedback/EmptyState.jsx:8` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/feedback/ErrorState.jsx:9` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/feedback/Onboarding.jsx:28` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/components/feedback/Onboarding.jsx:37` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/feedback/Onboarding.jsx:40` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/feedback/Onboarding.jsx:44` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/feedback/Toast.jsx:13` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/feedback/Toast.jsx:18` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/forms/IconButton.jsx:24` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/navigation/Breadcrumbs.jsx:14` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/components/navigation/BulkActionBar.jsx:21` | `fontWeight` | `600` | fw.semibold | |
| `frameworks/react/components/navigation/Pagination.jsx:33` | `fontWeight` | `700` | fw.bold | |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:32` | `fontWeight` | `900` | fw.black | |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:14` | `fontWeight` | `900` | fw.black | |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:17` | `fontWeight` | `800` | fw.extrabold | |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:80` | `fontWeight` | `900` | fw.black | |
| `frameworks/react/ui_kits/console/Shell.jsx:20` | `fontWeight` | `900` | fw.black | |
| `frameworks/react/ui_kits/console/Shell.jsx:34` | `fontWeight` | `800` | fw.extrabold | |

## borders (adoption only)

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/charts/BarChart.jsx:71` | `border` | `'1px solid var(--border-strong)'` | var(--bw) |  |
| `frameworks/react/components/charts/ChartCard.jsx:10` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/charts/LineChart.jsx:89` | `border` | `'1px solid var(--border-strong)'` | var(--bw) |  |
| `frameworks/react/components/display/Avatar.jsx:13` | `border` | `'1px solid var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/display/Avatar.jsx:20` | `border` | `'2px solid var(--surface-card)'` | var(--bw-strong) |  |
| `frameworks/react/components/display/Calendar.jsx:87` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Calendar.jsx:100` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Calendar.jsx:110` | `borderBottom` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Calendar.jsx:144` | `borderTop` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Calendar.jsx:169` | `borderLeft` | ``3px solid ${color}`` | var(--bw-strong) — snaps, pixel move 3->2 | no 3px border step exists; nearest of {1,2} is 2 (accent bar on Calendar event chip / Toast) |
| `frameworks/react/components/display/Calendar.jsx:189` | `borderTop` | `'2px solid var(--crimson)'` | var(--bw-strong) |  |
| `frameworks/react/components/display/Card.jsx:5` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/display/StatCard.jsx:18` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/StatCard.jsx:35` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/display/Table.jsx:36` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Table.jsx:43` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Table.jsx:51` | `borderTop` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Table.jsx:66` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Table.jsx:73` | `borderBottom` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/display/Tag.jsx:5` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/feedback/Alert.jsx:17` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:14` | `border` | `'1px solid var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:27` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/feedback/Dialog.jsx:30` | `border` | `'1px solid var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/feedback/EmptyState.jsx:6` | `border` | `'1px dashed var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/feedback/ErrorState.jsx:7` | `border` | `'1px solid var(--danger)'` | var(--bw) |  |
| `frameworks/react/components/feedback/Onboarding.jsx:25` | `border` | `'1px solid var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/feedback/Toast.jsx:10` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/feedback/Toast.jsx:11` | `borderLeft` | `'3px solid '` | var(--bw-strong) — snaps, pixel move 3->2 | no 3px border step exists; nearest of {1,2} is 2 (accent bar on Calendar event chip / Toast) |
| `frameworks/react/components/feedback/Toast.jsx:13` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/forms/Button.jsx:76` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/forms/Button.jsx:85` | `border` | `'2px solid currentColor'` | var(--bw-strong) |  |
| `frameworks/react/components/forms/Checkbox.jsx:7` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/forms/Input.jsx:59` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/forms/Radio.jsx:21` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/forms/Select.jsx:12` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/forms/Textarea.jsx:26` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/navigation/BulkActionBar.jsx:10` | `border` | `'1px solid var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/navigation/BulkActionBar.jsx:20` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/navigation/CommandPalette.jsx:22` | `border` | `'1px solid var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/navigation/CommandPalette.jsx:23` | `borderBottom` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/navigation/CommandPalette.jsx:27` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/navigation/Menu.jsx:44` | `border` | `'1px solid var(--line-strong)'` | var(--bw) |  |
| `frameworks/react/components/navigation/Pagination.jsx:19` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/navigation/Pagination.jsx:35` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/navigation/SegmentedControl.jsx:44` | `border` | `'1px solid '` | var(--bw) |  |
| `frameworks/react/components/navigation/Tabs.jsx:7` | `borderBottom` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:30` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:46` | `borderTop` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:11` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:44` | `border` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/ui_kits/console/Shell.jsx:17` | `borderRight` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/ui_kits/console/Shell.jsx:33` | `borderTop` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/ui_kits/console/Shell.jsx:39` | `borderBottom` | `'1px solid var(--color-base-300)'` | var(--bw) |  |
| `frameworks/react/components/navigation/BulkActionBar.jsx:15` | `width` | `1` | var(--bw) | reclassified from sp: this is a 1px filled div's thickness, functioning as a divider rule (like an <hr>), not spacing — the mechanical sp snap (1px -> 0) would delete the divider entirely. The sibling property on the same line (the divider's length/margin) correctly stays sp. |
| `frameworks/react/components/navigation/Menu.jsx:47` | `height` | `1` | var(--bw) | reclassified from sp: this is a 1px filled div's thickness, functioning as a divider rule (like an <hr>), not spacing — the mechanical sp snap (1px -> 0) would delete the divider entirely. The sibling property on the same line (the divider's length/margin) correctly stays sp. |

## radius (adoption only, one site)

The one `borderRadius` literal the spec's own "already adopted" radius accounting
left outstanding (the nine `50%` circles are exempt as a free unit, not a defect).

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/charts/DoughnutChart.jsx:58` | `borderRadius` | `2` | var(--r-xs) (4px) | nearest existing radius step; 2px swatch corner grows to 4px |

## sp — derivations (Rule 3, numeric)

| File:line | Property | Now | Target | Note |
|---|---|---|---|---|
| `frameworks/react/components/charts/BarChart.jsx:72` | `padding` | `'6px 10px'` | calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5) | half-step, 6px; half-step, 10px |
| `frameworks/react/components/charts/ChartCard.jsx:11` | `padding` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/charts/ChartCard.jsx:12` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/charts/ChartCard.jsx:15` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/charts/ChartCard.jsx:20` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/charts/DoughnutChart.jsx:33` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/charts/DoughnutChart.jsx:54` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/charts/DoughnutChart.jsx:57` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/charts/DoughnutChart.jsx:58` | `width` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/charts/DoughnutChart.jsx:58` | `height` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/charts/LineChart.jsx:90` | `padding` | `'6px 10px'` | calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5) | half-step, 6px; half-step, 10px |
| `frameworks/react/components/display/Avatar.jsx:19` | `right` | `-1` | 0 | off-pattern, -1px snaps to 0px (nearest grid multiple) |
| `frameworks/react/components/display/Avatar.jsx:19` | `bottom` | `-1` | 0 | off-pattern, -1px snaps to 0px (nearest grid multiple) |
| `frameworks/react/components/display/Badge.jsx:14` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/display/Badge.jsx:14` | `padding` | `'3px 10px'` | calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5) | off-pattern, 3px snaps to 4px (nearest grid multiple); half-step, 10px |
| `frameworks/react/components/display/Badge.jsx:17` | `width` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/display/Badge.jsx:17` | `height` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/display/Calendar.jsx:86` | `height` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/display/Calendar.jsx:86` | `minWidth` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/display/Calendar.jsx:97` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Calendar.jsx:97` | `marginBottom` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/display/Calendar.jsx:100` | `height` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/display/Calendar.jsx:100` | `padding` | `'0 12px'` | 0 calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/display/Calendar.jsx:104` | `margin` | `'0 0 0 4px'` | 0 0 0 calc(var(--sp-1) * 1) | on-grid, 4px = sp-1 * 1 |
| `frameworks/react/components/display/Calendar.jsx:107` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Calendar.jsx:115` | `padding` | `'6px 8px 8px'` | calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2) calc(var(--sp-1) * 2) | half-step, 6px; on-grid, 8px = sp-1 * 2; on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Calendar.jsx:118` | `marginTop` | `2` | calc(var(--sp-1) * 0.5) | half-step, 2px |
| `frameworks/react/components/display/Calendar.jsx:130` | `paddingTop` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Calendar.jsx:130` | `paddingBottom` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Calendar.jsx:135` | `right` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Calendar.jsx:164` | `left` | ``calc(${(p.col / p.cols) * 100}% + 2px)`` | `calc(${(p.col / p.cols) * 100}% + calc(var(--sp-1) * 0.5))` | template literal; the +2px offset is a half-step (2 = 4*0+2, mult 0.5), composed inside the existing percentage calc() |
| `frameworks/react/components/display/Calendar.jsx:165` | `width` | ``calc(${(1 / p.cols) * 100}% - 4px)`` | `calc(${(1 / p.cols) * 100}% - var(--sp-1))` | template literal; the -4px offset is on-grid (sp-1 exactly) |
| `frameworks/react/components/display/Calendar.jsx:166` | `gap` | `1` | 0 | off-pattern, 1px snaps to 0px (nearest grid multiple) |
| `frameworks/react/components/display/Calendar.jsx:167` | `padding` | `'3px 6px'` | calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5) | off-pattern, 3px snaps to 4px (nearest grid multiple); half-step, 6px |
| `frameworks/react/components/display/Calendar.jsx:190` | `top` | `-4` | calc(var(--sp-1) * -1) | on-grid, -4px = sp-1 * -1 |
| `frameworks/react/components/display/Calendar.jsx:190` | `left` | `-3` | calc(var(--sp-1) * -1) | off-pattern, -3px snaps to -4px (nearest grid multiple) |
| `frameworks/react/components/display/Calendar.jsx:190` | `width` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/display/Calendar.jsx:190` | `height` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/display/Card.jsx:9` | `padding` | `'18px 20px 0'` | calc(var(--sp-1) * 4.5) calc(var(--sp-1) * 5) 0 | half-step, 18px; on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/display/Card.jsx:11` | `marginBottom` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/display/Card.jsx:17` | `padding` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/display/Skeleton.jsx:32` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/display/Skeleton.jsx:34` | `height` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/display/StatCard.jsx:19` | `padding` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/display/StatCard.jsx:19` | `minHeight` | `120` | calc(var(--sp-1) * 30) | on-grid, 120px = sp-1 * 30 |
| `frameworks/react/components/display/StatCard.jsx:20` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/StatCard.jsx:22` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/display/StatCard.jsx:32` | `gap` | `4` | calc(var(--sp-1) * 1) | on-grid, 4px = sp-1 * 1 |
| `frameworks/react/components/display/StatCard.jsx:33` | `padding` | `'2px 8px'` | calc(var(--sp-1) * 0.5) calc(var(--sp-1) * 2) | half-step, 2px; on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Table.jsx:34` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/display/Table.jsx:37` | `padding` | `'32px 16px'` | calc(var(--sp-1) * 8) calc(var(--sp-1) * 4) | on-grid, 32px = sp-1 * 8; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/display/Table.jsx:51` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Table.jsx:51` | `paddingTop` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/display/Table.jsx:55` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/display/Table.jsx:79` | `padding` | `'32px 16px'` | calc(var(--sp-1) * 8) calc(var(--sp-1) * 4) | on-grid, 32px = sp-1 * 8; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/display/Tag.jsx:4` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/display/Tag.jsx:4` | `padding` | `'4px 10px'` | calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5) | on-grid, 4px = sp-1 * 1; half-step, 10px |
| `frameworks/react/components/feedback/Alert.jsx:16` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/feedback/Alert.jsx:16` | `padding` | `'14px 16px'` | calc(var(--sp-1) * 3.5) calc(var(--sp-1) * 4) | half-step, 14px; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/feedback/Alert.jsx:18` | `marginTop` | `1` | 0 | off-pattern, 1px snaps to 0px (nearest grid multiple) |
| `frameworks/react/components/feedback/Alert.jsx:24` | `marginTop` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:16` | `padding` | `'22px 24px 0'` | calc(var(--sp-1) * 5.5) calc(var(--sp-1) * 6) 0 | half-step, 22px; on-grid, 24px = sp-1 * 6 |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:17` | `marginBottom` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:20` | `padding` | `'16px 24px'` | calc(var(--sp-1) * 4) calc(var(--sp-1) * 6) | on-grid, 16px = sp-1 * 4; on-grid, 24px = sp-1 * 6 |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:23` | `marginTop` | `14` | calc(var(--sp-1) * 3.5) | half-step, 14px |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:24` | `marginBottom` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:26` | `padding` | `'0 12px'` | 0 calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:32` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:32` | `padding` | `'0 24px 22px'` | 0 calc(var(--sp-1) * 6) calc(var(--sp-1) * 5.5) | on-grid, 24px = sp-1 * 6; half-step, 22px |
| `frameworks/react/components/feedback/Dialog.jsx:33` | `padding` | `'22px 24px 0'` | calc(var(--sp-1) * 5.5) calc(var(--sp-1) * 6) 0 | half-step, 22px; on-grid, 24px = sp-1 * 6 |
| `frameworks/react/components/feedback/Dialog.jsx:34` | `marginBottom` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/feedback/Dialog.jsx:37` | `padding` | `'16px 24px'` | calc(var(--sp-1) * 4) calc(var(--sp-1) * 6) | on-grid, 16px = sp-1 * 4; on-grid, 24px = sp-1 * 6 |
| `frameworks/react/components/feedback/Dialog.jsx:38` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/feedback/Dialog.jsx:38` | `padding` | `'0 24px 22px'` | 0 calc(var(--sp-1) * 6) calc(var(--sp-1) * 5.5) | on-grid, 24px = sp-1 * 6; half-step, 22px |
| `frameworks/react/components/feedback/EmptyState.jsx:5` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/feedback/EmptyState.jsx:6` | `padding` | `'56px 32px'` | calc(var(--sp-1) * 14) calc(var(--sp-1) * 8) | on-grid, 56px = sp-1 * 14; on-grid, 32px = sp-1 * 8 |
| `frameworks/react/components/feedback/EmptyState.jsx:10` | `marginTop` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/feedback/ErrorState.jsx:6` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/feedback/ErrorState.jsx:7` | `padding` | `'56px 32px'` | calc(var(--sp-1) * 14) calc(var(--sp-1) * 8) | on-grid, 56px = sp-1 * 14; on-grid, 32px = sp-1 * 8 |
| `frameworks/react/components/feedback/ErrorState.jsx:11` | `padding` | `'4px 10px'` | calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5) | on-grid, 4px = sp-1 * 1; half-step, 10px |
| `frameworks/react/components/feedback/ErrorState.jsx:12` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/feedback/ErrorState.jsx:12` | `marginTop` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/feedback/Onboarding.jsx:12` | `right` | `24` | calc(var(--sp-1) * 6) | on-grid, 24px = sp-1 * 6 |
| `frameworks/react/components/feedback/Onboarding.jsx:12` | `bottom` | `24` | calc(var(--sp-1) * 6) | on-grid, 24px = sp-1 * 6 |
| `frameworks/react/components/feedback/Onboarding.jsx:26` | `padding` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/feedback/Onboarding.jsx:27` | `marginBottom` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/feedback/Onboarding.jsx:29` | `marginTop` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/feedback/Onboarding.jsx:30` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/feedback/Onboarding.jsx:30` | `marginTop` | `18` | calc(var(--sp-1) * 4.5) | half-step, 18px |
| `frameworks/react/components/feedback/Onboarding.jsx:31` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/feedback/Onboarding.jsx:33` | `height` | `7` | calc(var(--sp-1) * 2) | off-pattern, 7px snaps to 8px (nearest grid multiple) |
| `frameworks/react/components/feedback/Onboarding.jsx:43` | `height` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/feedback/Onboarding.jsx:43` | `padding` | `'0 16px'` | 0 calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/feedback/ProgressBar.jsx:30` | `marginBottom` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/feedback/ProgressBar.jsx:30` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/feedback/Toast.jsx:9` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/feedback/Toast.jsx:9` | `width` | `340` | calc(var(--sp-1) * 85) | on-grid, 340px = sp-1 * 85 |
| `frameworks/react/components/feedback/Toast.jsx:9` | `padding` | `'14px 16px'` | calc(var(--sp-1) * 3.5) calc(var(--sp-1) * 4) | half-step, 14px; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/feedback/Toast.jsx:13` | `gap` | `7` | calc(var(--sp-1) * 2) | off-pattern, 7px snaps to 8px (nearest grid multiple) |
| `frameworks/react/components/feedback/Toast.jsx:13` | `padding` | `'1px 5px'` | 0 calc(var(--sp-1) * 1) | off-pattern, 1px snaps to 0px (nearest grid multiple); off-pattern, 5px snaps to 4px (nearest grid multiple) |
| `frameworks/react/components/feedback/Toast.jsx:14` | `marginTop` | `2` | calc(var(--sp-1) * 0.5) | half-step, 2px |
| `frameworks/react/components/feedback/Toast.jsx:17` | `marginTop` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/feedback/Tooltip.jsx:29` | `padding` | `'6px 10px'` | calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5) | half-step, 6px; half-step, 10px |
| `frameworks/react/components/forms/Button.jsx:27` | `padding` | `'0 12px'` | 0 calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/forms/Button.jsx:28` | `padding` | `'0 18px'` | 0 calc(var(--sp-1) * 4.5) | half-step, 18px |
| `frameworks/react/components/forms/Button.jsx:29` | `padding` | `'0 26px'` | 0 calc(var(--sp-1) * 6.5) | half-step, 26px |
| `frameworks/react/components/forms/Button.jsx:70` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/forms/Button.jsx:85` | `width` | `14` | calc(var(--sp-1) * 3.5) | half-step, 14px |
| `frameworks/react/components/forms/Button.jsx:85` | `height` | `14` | calc(var(--sp-1) * 3.5) | half-step, 14px |
| `frameworks/react/components/forms/Checkbox.jsx:4` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/forms/Checkbox.jsx:5` | `width` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/forms/Checkbox.jsx:5` | `height` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/forms/Input.jsx:52` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/forms/Input.jsx:55` | `marginLeft` | `4` | calc(var(--sp-1) * 1) | on-grid, 4px = sp-1 * 1 |
| `frameworks/react/components/forms/Input.jsx:58` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/forms/Input.jsx:58` | `padding` | `'0 12px'` | 0 calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/forms/Radio.jsx:12` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/forms/Radio.jsx:19` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/forms/Radio.jsx:20` | `width` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/forms/Radio.jsx:20` | `height` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/forms/Radio.jsx:20` | `marginTop` | `1` | 0 | off-pattern, 1px snaps to 0px (nearest grid multiple) |
| `frameworks/react/components/forms/Radio.jsx:23` | `width` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/forms/Radio.jsx:23` | `height` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/forms/Radio.jsx:25` | `gap` | `2` | calc(var(--sp-1) * 0.5) | half-step, 2px |
| `frameworks/react/components/forms/Select.jsx:5` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/forms/Select.jsx:10` | `padding` | `'0 36px 0 12px'` | 0 calc(var(--sp-1) * 9) 0 calc(var(--sp-1) * 3) | on-grid, 36px = sp-1 * 9; on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/forms/Select.jsx:20` | `right` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/forms/Switch.jsx:13` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/forms/Switch.jsx:14` | `width` | `40` | calc(var(--sp-1) * 10) | on-grid, 40px = sp-1 * 10 |
| `frameworks/react/components/forms/Switch.jsx:14` | `height` | `22` | calc(var(--sp-1) * 5.5) | half-step, 22px |
| `frameworks/react/components/forms/Switch.jsx:14` | `padding` | `2` | calc(var(--sp-1) * 0.5) | half-step, 2px |
| `frameworks/react/components/forms/Switch.jsx:16` | `width` | `18` | calc(var(--sp-1) * 4.5) | half-step, 18px |
| `frameworks/react/components/forms/Switch.jsx:16` | `height` | `18` | calc(var(--sp-1) * 4.5) | half-step, 18px |
| `frameworks/react/components/forms/Switch.jsx:19` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/forms/Textarea.jsx:15` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/forms/Textarea.jsx:18` | `marginLeft` | `4` | calc(var(--sp-1) * 1) | on-grid, 4px = sp-1 * 1 |
| `frameworks/react/components/forms/Textarea.jsx:25` | `padding` | `'10px 12px'` | calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 3) | half-step, 10px; on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/forms/Textarea.jsx:30` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/navigation/Breadcrumbs.jsx:7` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/navigation/BulkActionBar.jsx:9` | `gap` | `14` | calc(var(--sp-1) * 3.5) | half-step, 14px |
| `frameworks/react/components/navigation/BulkActionBar.jsx:9` | `minHeight` | `52` | calc(var(--sp-1) * 13) | on-grid, 52px = sp-1 * 13 |
| `frameworks/react/components/navigation/BulkActionBar.jsx:9` | `padding` | `'0 12px 0 16px'` | 0 calc(var(--sp-1) * 3) 0 calc(var(--sp-1) * 4) | on-grid, 12px = sp-1 * 3; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/navigation/BulkActionBar.jsx:15` | `height` | `22` | calc(var(--sp-1) * 5.5) | half-step, 22px |
| `frameworks/react/components/navigation/BulkActionBar.jsx:16` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/navigation/BulkActionBar.jsx:19` | `gap` | `7` | calc(var(--sp-1) * 2) | off-pattern, 7px snaps to 8px (nearest grid multiple) |
| `frameworks/react/components/navigation/BulkActionBar.jsx:19` | `height` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/navigation/BulkActionBar.jsx:19` | `padding` | `'0 12px'` | 0 calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/navigation/CommandPalette.jsx:22` | `width` | `560` | calc(var(--sp-1) * 140) | on-grid, 560px = sp-1 * 140 |
| `frameworks/react/components/navigation/CommandPalette.jsx:23` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/navigation/CommandPalette.jsx:23` | `padding` | `'14px 16px'` | calc(var(--sp-1) * 3.5) calc(var(--sp-1) * 4) | half-step, 14px; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/navigation/CommandPalette.jsx:27` | `padding` | `'2px 6px'` | calc(var(--sp-1) * 0.5) calc(var(--sp-1) * 1.5) | half-step, 2px; half-step, 6px |
| `frameworks/react/components/navigation/CommandPalette.jsx:29` | `maxHeight` | `320` | calc(var(--sp-1) * 80) | on-grid, 320px = sp-1 * 80 |
| `frameworks/react/components/navigation/CommandPalette.jsx:29` | `padding` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/navigation/CommandPalette.jsx:30` | `padding` | `'18px 12px'` | calc(var(--sp-1) * 4.5) calc(var(--sp-1) * 3) | half-step, 18px; on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/navigation/CommandPalette.jsx:33` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/navigation/CommandPalette.jsx:33` | `padding` | `'10px 12px'` | calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 3) | half-step, 10px; on-grid, 12px = sp-1 * 3 |
| `frameworks/react/components/navigation/Menu.jsx:43` | `top` | `'calc(100% + 6px)'` | calc(100% + 6px) |  |
| `frameworks/react/components/navigation/Menu.jsx:44` | `minWidth` | `200` | calc(var(--sp-1) * 50) | on-grid, 200px = sp-1 * 50 |
| `frameworks/react/components/navigation/Menu.jsx:44` | `padding` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/navigation/Menu.jsx:47` | `margin` | `'5px 0'` | calc(var(--sp-1) * 1) 0 | off-pattern, 5px snaps to 4px (nearest grid multiple) |
| `frameworks/react/components/navigation/Menu.jsx:48` | `padding` | `'8px 10px 4px'` | calc(var(--sp-1) * 2) calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 1) | on-grid, 8px = sp-1 * 2; half-step, 10px; on-grid, 4px = sp-1 * 1 |
| `frameworks/react/components/navigation/Menu.jsx:65` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/navigation/Menu.jsx:65` | `padding` | `'9px 10px'` | calc(var(--sp-1) * 2) calc(var(--sp-1) * 2.5) | off-pattern, 9px snaps to 8px (nearest grid multiple); half-step, 10px |
| `frameworks/react/components/navigation/PageHead.jsx:18` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/components/navigation/PageHead.jsx:18` | `marginBottom` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/components/navigation/PageHead.jsx:27` | `margin` | `'2px 0 0'` | calc(var(--sp-1) * 0.5) 0 0 | half-step, 2px |
| `frameworks/react/components/navigation/PageHead.jsx:32` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/navigation/Pagination.jsx:18` | `height` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/navigation/Pagination.jsx:18` | `minWidth` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/navigation/Pagination.jsx:18` | `padding` | `'0 8px'` | 0 calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/navigation/Pagination.jsx:25` | `gap` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/components/navigation/Pagination.jsx:29` | `padding` | `'0 4px'` | 0 calc(var(--sp-1) * 1) | on-grid, 4px = sp-1 * 1 |
| `frameworks/react/components/navigation/Pagination.jsx:32` | `height` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/navigation/Pagination.jsx:32` | `minWidth` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/navigation/Pagination.jsx:32` | `padding` | `'0 8px'` | 0 calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/components/navigation/SegmentedControl.jsx:19` | `height` | `28` | calc(var(--sp-1) * 7) | on-grid, 28px = sp-1 * 7 |
| `frameworks/react/components/navigation/SegmentedControl.jsx:19` | `padding` | `'0 10px'` | 0 calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/components/navigation/SegmentedControl.jsx:20` | `height` | `34` | calc(var(--sp-1) * 8.5) | half-step, 34px |
| `frameworks/react/components/navigation/SegmentedControl.jsx:20` | `padding` | `'0 14px'` | 0 calc(var(--sp-1) * 3.5) | half-step, 14px |
| `frameworks/react/components/navigation/SegmentedControl.jsx:42` | `gap` | `2` | calc(var(--sp-1) * 0.5) | half-step, 2px |
| `frameworks/react/components/navigation/SegmentedControl.jsx:42` | `padding` | `3` | calc(var(--sp-1) * 1) | off-pattern, 3px snaps to 4px (nearest grid multiple) |
| `frameworks/react/components/navigation/Tabs.jsx:7` | `gap` | `4` | calc(var(--sp-1) * 1) | on-grid, 4px = sp-1 * 1 |
| `frameworks/react/components/navigation/Tabs.jsx:12` | `padding` | `'10px 16px'` | calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 4) | half-step, 10px; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:28` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:28` | `marginBottom` | `28` | calc(var(--sp-1) * 7) | on-grid, 28px = sp-1 * 7 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:30` | `padding` | `'18px 20px'` | calc(var(--sp-1) * 4.5) calc(var(--sp-1) * 5) | half-step, 18px; on-grid, 20px = sp-1 * 5 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:32` | `marginTop` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:36` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:43` | `gap` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:43` | `margin` | `'4px 0 16px'` | calc(var(--sp-1) * 1) 0 calc(var(--sp-1) * 4) | on-grid, 4px = sp-1 * 1; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/DashboardScreen.jsx:46` | `paddingTop` | `14` | calc(var(--sp-1) * 3.5) | half-step, 14px |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:10` | `padding` | `24` | calc(var(--sp-1) * 6) | on-grid, 24px = sp-1 * 6 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:11` | `width` | `380` | calc(var(--sp-1) * 95) | on-grid, 380px = sp-1 * 95 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:11` | `padding` | `36` | calc(var(--sp-1) * 9) | on-grid, 36px = sp-1 * 9 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:12` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:12` | `marginBottom` | `28` | calc(var(--sp-1) * 7) | on-grid, 28px = sp-1 * 7 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:16` | `marginBottom` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:17` | `marginBottom` | `24` | calc(var(--sp-1) * 6) | on-grid, 24px = sp-1 * 6 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:18` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:23` | `marginTop` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:36` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:36` | `marginBottom` | `20` | calc(var(--sp-1) * 5) | on-grid, 20px = sp-1 * 5 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:41` | `marginBottom` | `22` | calc(var(--sp-1) * 5.5) | half-step, 22px |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:45` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:45` | `padding` | `'12px 20px'` | calc(var(--sp-1) * 3) calc(var(--sp-1) * 5) | on-grid, 12px = sp-1 * 3; on-grid, 20px = sp-1 * 5 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:49` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:49` | `padding` | `'16px 20px'` | calc(var(--sp-1) * 4) calc(var(--sp-1) * 5) | on-grid, 16px = sp-1 * 4; on-grid, 20px = sp-1 * 5 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:65` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:65` | `padding` | `'14px 0'` | calc(var(--sp-1) * 3.5) 0 | half-step, 14px |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:66` | `width` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:66` | `height` | `8` | calc(var(--sp-1) * 2) | on-grid, 8px = sp-1 * 2 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:76` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:78` | `gap` | `16` | calc(var(--sp-1) * 4) | on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:80` | `marginTop` | `6` | calc(var(--sp-1) * 1.5) | half-step, 6px |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:86` | `marginTop` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:92` | `maxWidth` | `520` | calc(var(--sp-1) * 130) | on-grid, 520px = sp-1 * 130 |
| `frameworks/react/ui_kits/console/ProjectScreen.jsx:93` | `gap` | `18` | calc(var(--sp-1) * 4.5) | half-step, 18px |
| `frameworks/react/ui_kits/console/Shell.jsx:17` | `padding` | `'24px 16px'` | calc(var(--sp-1) * 6) calc(var(--sp-1) * 4) | on-grid, 24px = sp-1 * 6; on-grid, 16px = sp-1 * 4 |
| `frameworks/react/ui_kits/console/Shell.jsx:17` | `gap` | `4` | calc(var(--sp-1) * 1) | on-grid, 4px = sp-1 * 1 |
| `frameworks/react/ui_kits/console/Shell.jsx:18` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/ui_kits/console/Shell.jsx:18` | `padding` | `'0 8px 22px'` | 0 calc(var(--sp-1) * 2) calc(var(--sp-1) * 5.5) | on-grid, 8px = sp-1 * 2; half-step, 22px |
| `frameworks/react/ui_kits/console/Shell.jsx:26` | `gap` | `12` | calc(var(--sp-1) * 3) | on-grid, 12px = sp-1 * 3 |
| `frameworks/react/ui_kits/console/Shell.jsx:26` | `padding` | `'10px 12px'` | calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 3) | half-step, 10px; on-grid, 12px = sp-1 * 3 |
| `frameworks/react/ui_kits/console/Shell.jsx:33` | `gap` | `10` | calc(var(--sp-1) * 2.5) | half-step, 10px |
| `frameworks/react/ui_kits/console/Shell.jsx:33` | `padding` | `'12px 8px'` | calc(var(--sp-1) * 3) calc(var(--sp-1) * 2) | on-grid, 12px = sp-1 * 3; on-grid, 8px = sp-1 * 2 |
| `frameworks/react/ui_kits/console/Shell.jsx:34` | `width` | `30` | calc(var(--sp-1) * 7.5) | half-step, 30px |
| `frameworks/react/ui_kits/console/Shell.jsx:34` | `height` | `30` | calc(var(--sp-1) * 7.5) | half-step, 30px |
| `frameworks/react/ui_kits/console/Shell.jsx:39` | `padding` | `'20px 32px'` | calc(var(--sp-1) * 5) calc(var(--sp-1) * 8) | on-grid, 20px = sp-1 * 5; on-grid, 32px = sp-1 * 8 |
| `frameworks/react/ui_kits/console/Shell.jsx:47` | `padding` | `32` | calc(var(--sp-1) * 8) | on-grid, 32px = sp-1 * 8 |

---

## Checkpoint 4 — resolved

Two clusters, not 14 loose questions. Both are folded into the `fs`/`dz` tables
above; this section is the record of the ruling and its reasoning.

### Cluster A — the "eyebrow" / kicker format (7 sites) → `dz`, zero pixels move

The small uppercase mono label above a title or big value: `Card`, `Dialog`,
`ConfirmDialog`, `Onboarding`'s `eyebrow` prop; `ChartCard`/`StatCard`'s category
label; `LoginScreen`'s "Delivery console".

| File:line | Property | Text it renders | Now | Resolved to |
|---|---|---|---|---|
| `frameworks/react/components/display/Card.jsx:11` | `fontSize`/`letterSpacing` | `eyebrow` prop, e.g. a category label above the card title | 11px, .22em | `dz.text-xs` (11), `ls.label` (.22) |
| `frameworks/react/components/feedback/Dialog.jsx:34` | `fontSize`/`letterSpacing` | `eyebrow` prop | 11px, .22em | `dz.text-xs` (11), `ls.label` (.22) |
| `frameworks/react/components/feedback/ConfirmDialog.jsx:17` | `fontSize`/`letterSpacing` | `eyebrow` prop, defaults to "Confirm" | 11px, .22em | `dz.text-xs` (11), `ls.label` (.22) |
| `frameworks/react/components/feedback/Onboarding.jsx:27` | `fontSize`/`letterSpacing` | `step.eyebrow` | 11px, .22em | `dz.text-xs` (11), `ls.label` (.22) |
| `frameworks/react/components/charts/ChartCard.jsx:17` | `fontSize`/`letterSpacing` | `title` prop — an uppercase muted microlabel, explicitly NOT a heading per the component's own doc comment | 10px, .2em (drift off .22) | `dz.text-2xs` (10), `ls.label` (.22, drift-correct) |
| `frameworks/react/components/display/StatCard.jsx:23` | `fontSize`/`letterSpacing` | `label` prop, e.g. "REVENUE" | 10px, .2em (drift off .22) | `dz.text-2xs` (10), `ls.label` (.22, drift-correct) |
| `frameworks/react/ui_kits/console/LoginScreen.jsx:16` | `fontSize`/`letterSpacing` | literal text "Delivery console" | 11px, .22em | `dz.text-xs` (11), `ls.label` (.22) |

**Author's answer:** `dz`. Zero pixels move.

**Reason:** Rule 1's own test applied to the *text* settles it. "REVENUE" read
aloud with no interface around it means nothing, so it is chrome. This groups the
eyebrow with the other microlabel tiers the pass already resolved as `dz` (field
label, column header, badge), and it moves no pixels — both 10 and 11 get a `dz`
step at their own value.

**Consequence, recorded explicitly:** `fs.xs` is left with no consumer in
`frameworks/react/`. That is accepted, not overlooked. `fs` is the editorial
scale and the React layer is mostly chrome; a scale step with no React consumer
is not dead API, because `fs.xs` is read elsewhere in the repo. **Do not propose
deleting it.**

### Cluster B — a message inside a chrome container (7 sites) → `fs`, this one moves pixels

The spec names four of these in advance; the exhaustive pass found three more with
the identical shape (a full sentence or status string, rendered inside a component
whose other text is unambiguously chrome).

| File:line | Property | Text it renders | Now | Resolved to |
|---|---|---|---|---|
| `frameworks/react/components/feedback/EmptyState.jsx:9` | `fontSize` | `message` prop — e.g. "There's nothing here yet." | 14px, lh 1.6 | `fs` — PENDING CHECKPOINT 1 (fs.sm=13 or fs.md=15, exactly tied) |
| `frameworks/react/components/feedback/ErrorState.jsx:10` | `fontSize` | `message` prop — e.g. "We couldn't reach the server. Try again." | 14px, lh 1.6 | `fs` — PENDING CHECKPOINT 1 (fs.sm=13 or fs.md=15, exactly tied) |
| `frameworks/react/components/feedback/Onboarding.jsx:29` | `fontSize` | `step.body` — the coachmark's explanatory paragraph | 14px, lh 1.6 | `fs` — PENDING CHECKPOINT 1 (fs.sm=13 or fs.md=15, exactly tied) |
| `frameworks/react/components/navigation/Menu.jsx:68` | `fontSize` | `item.label` — the menu item's own text (e.g. "Rename", but the slot is generic and can hold longer copy) | 14px | `fs` — PENDING CHECKPOINT 1 (fs.sm=13 or fs.md=15, exactly tied) |
| `frameworks/react/components/navigation/CommandPalette.jsx:30` | `fontSize` | literal text `No results for "{q}".` | 14px | `fs` — PENDING CHECKPOINT 1 (fs.sm=13 or fs.md=15, exactly tied) |
| `frameworks/react/components/feedback/Alert.jsx:21` | `fontSize` | `children` — the alert's body copy | 13px, lh 1.55→1.6 | `fs.sm` (13) — exact match |
| `frameworks/react/components/feedback/Toast.jsx:14` | `fontSize` | `message` prop | 13px | `fs.sm` (13) — exact match |

**Author's answer:** `fs`. This one moves pixels.

**Reason:** Rule 1's test asks about the text, not the container, and these pass
it — "We couldn't connect to the server. Retry." is literally the spec's own
worked example of prose. Applying the test consistently in both clusters is what
stops Rule 1 eroding into "look at the container," which plan 5 would then have
to apply 34 times.

**Correction made against the first pass over this document:** `fs`'s scale is
11/13/15/17/19/24/32/44/64. 14px is **exactly equidistant** between `fs.sm` (13)
and `fs.md` (15) — a tie, and a tie in a semantic family is a snap-direction
question, which is **Checkpoint 1, in Task 11**, not something this task settles.
The five sites at 14px (one more than the spec's four named sites — the
exhaustive pass's `CommandPalette` addition is also 14px) each carry a
`PENDING CHECKPOINT 1` marker, the same form already used for `Card.jsx:12`,
`Onboarding.jsx:28` and `ProjectScreen.jsx:80`. Only the two sites at 13px
(`Alert`, `Toast`) land unambiguously on `fs.sm` and carry a concrete target now.

---

## Family totals

| Family | Sites | Notes |
|---|---:|---|
| `fs` | 23 | includes the 7 resolved from Checkpoint 4 Cluster B; 8 total sites carry a `PENDING CHECKPOINT 1` marker (3 from the original pass + 5 from Cluster B) |
| `dz` | 101 | includes the 7 resolved from Checkpoint 4 Cluster A, and the 8 `lineHeight: 1` resets |
| `icon` | 16 | includes 1 tie (Menu, flagged) |
| `z` | 8 | order pending Checkpoint 2 |
| `ls` | 34 | includes 1 tie (Avatar, flagged) — unaffected by Checkpoint 4 |
| `lh` | 13 | unaffected by Checkpoint 4 |
| `fw` | 33 | |
| borders | 56 | includes 2 sites reclassified from `sp` (dividers) |
| radius | 1 | |
| `sp` | 229 | includes 17 pixel-moving snaps, listed in-table |
| **Total** | **514** | matches the census exactly |

23 + 101 + 16 + 8 + 34 + 13 + 33 + 56 + 1 + 229 = **514**. No site reached no
family — every one of the 514 has a row in exactly one table above. Checkpoint 4
is fully resolved; nothing is pending assignment. 8 `fs`-family sites carry a
`PENDING CHECKPOINT 1` marker (a snap-*direction* question for Task 11), which is
a different, narrower kind of "pending" than an unassigned family.
