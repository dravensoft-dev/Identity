# Arena design specification

> **For whoever needs to know what a value MEANS, on either branch.** Only the value itself?
> The DTCG JSON beside this file is the machine-readable form and is cheaper to read.
> Authoring a token? [`TokenTypes.md`](./TokenTypes.md) is the shape it has to arrive in.

**Normative.** This is the source of truth for every design decision in Arena: voice,
type, color, spacing, motion, the danger convention, iconography and theming. A layer
that disagrees with this document is wrong.

It is also the contract a new platform target reads first. Consume these values; do not
re-derive them. This document states what the values MEAN;
[`TokenTypes.md`](./TokenTypes.md) beside it states the DTCG `$type` of every group and
the shape each value arrives in.

## Content fundamentals (voice and copy)
- **Language:** English (en-US neutral).
- **Register:** formal and direct in enterprise product and formal documentation; a closer, more casual register only in marketing material. Never mix registers on the same surface.
- **Tone:** confident and direct, never boastful. State capability without empty adjectives. E.g.: *"Delivery ready for review"* > *"Amazing delivery completed!"*.
- **Casing:** titles in **UPPERCASE with tracking** only for eyebrows/mono labels (`.22em`); section headings in Archivo weight 800–900 in normal case (Sentence case). Buttons in Sentence case, not Title Case.
- **Data/status labels:** mono, uppercase ("IN PROGRESS", "DEPLOYED").
- **Numbers:** always in mono. Metrics with a unit ("14 ms", "99.98%").
- **No emoji** in product or documentation. Expressiveness comes from color and typography, not decorative icons.
- **Microcopy:** concrete action verbs ("Deploy", "Approve delivery", "Roll back"). Errors are helpful and blame-free ("We couldn't connect to the server. Retry.").

## Visual foundations
- **Color, token architecture (daisyUI structure):** the source of truth is a set of `--color-*` tokens paired with their `-content` counterpart (the legible color on top), defined per theme in `contracts/design/palette.dark.json` and `contracts/design/palette.light.json`, from which `contracts/design-generated/palette.generated.css` is generated. On top of them, a **compatibility layer** in `contracts/design/colors.css` maps Arena's legacy aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) to the daisyUI tokens, so existing components don't break. Muted text levels (`--bone-dim`, `--mute`) and `--status-offline` are derived from `--color-base-content` with `color-mix`, not fixed hex values.
  - **One token breaks the pairing, on purpose: `--color-error-fill`** (alias `--danger-fill`). It has no `-content` of its own, because it *is* a second fill for `--color-error`'s content, because danger is worn two ways and one hex cannot do both. See [Danger convention](#danger-convention-destructive-actions-and-risk-indicators). Pinning it is **optional**: `--danger-fill` falls back to `color-mix(in oklab, var(--color-error) 85%, black)`, so a palette copied without it still gets a filled danger dark enough for white text. Pin it to override the derived tone (the Dravensoft skin pins `#ce3838`); `check-text-contrast.mjs` gates both the pin and the fallback.
- **The muted text scale**, every level AA on both surfaces in both themes: `--text-strong` (100%, 15.23:1 dark / 15.86:1 light on the card), `--text-body` (82%, 10.46 / 9.28), `--text-muted` (62%, 6.52 / 4.71). `--text-muted` in light is the tightest of the three: it clears AA, and it is the reason nothing fits below it. A fainter level cannot be added, because clearing AA in light needs 61% while `--text-muted` already sits at 62%.
- **`--status-offline`** (52%, 4.93:1 dark / 3.46:1 light on the card) is **presence only**, meaning `Avatar`'s offline dot. It clears WCAG 1.4.11's 3:1 for graphical objects. It is *not* `--mute-2-disabled` (40%), which dresses disabled controls: that one is low **by design** and exempt under 1.4.3/1.4.11's inactive-component carve-out. Do not raise it, and do not reach for it to render presence.
- **Verifying it:** `bun scripts/check/core/check-text-contrast.mjs` measures every level against the real surfaces in both themes and exits non-zero on failure. Run it after touching `contracts/design/colors.css`, or after rebuilding a change to `contracts/design/palette.dark.json` / `palette.light.json`. The claim above is machine-checkable, which is the point: a contrast figure nothing measures can be false for a whole theme with nothing to say so.
- **Themes:** the language is **dark-first** but supports two switchable themes, **dark** (`:root`, default) and **light** (`.arena-light`, warm inverse). The same tokens change value per theme; components are never rewritten. (The Overview includes the toggle in its header.)
- **Key values:** a warm black background (`--color-base-100`) under elevated surfaces (`--color-base-200` for cards, `--color-base-300` for panels and borders) and bone text (`--color-base-content`). A single primary accent (crimson, `--color-primary`) per view; gold (`--color-secondary`) reserved for focus, distinction and highlighted data. At most one dominant accent per screen. The literal values live in `contracts/design/palette.dark.json` and `contracts/design/palette.light.json`, from which `contracts/design-generated/palette.generated.css` is generated. See [Theming](#theming): the scale is the language, the hexes are the skin.
- **Typography:** Archivo (display/headlines, 800–900), Familjen Grotesk (body, 400–600), Spline Sans Mono (data, labels, code). Negative tracking on display (`-0.02em`), wide tracking on mono labels (`0.22em`).

### Type scale (`fs`)
Editorial type, meaning prose and headings and never chrome (see the `dz` table above for the density scale that governs buttons, inputs and labels instead). Closed and semantic: each name is a role, the scale gains no in-between steps, and an off-scale editorial size snaps to its nearest neighbor rather than adding one. The ratio between steps accelerates through the reading range and into display:

| Token | Value | Ratio from previous | Role |
|---|---|---|---|
| `--fs-xs` | 11px | none | mono labels / captions |
| `--fs-sm` | 13px | 1.18 | |
| `--fs-md` | 15px | 1.15 | body copy |
| `--fs-lg` | 17px | 1.13 | |
| `--fs-h4` | 19px | 1.12 | |
| `--fs-h3` | 24px | 1.263 | |
| `--fs-h2` | 32px | 1.333 | |
| `--fs-h1` | 44px | 1.375 | |
| `--fs-display` | 64px | 1.455 | large display heading |
| `--fs-hero` | 96px | 1.5 | extrapolated step continuing the scale's accelerating ratio past `display`; **no consumer today, by design**, since it closes the jump to `mega` so the progression stays coherent, and is not dead API to prune |
| `--fs-mega` | 150px | 1.5625 | the approved brand manual's `.big-glyph` specimen |

Exposed in the Tailwind layer as `.text-xs`/`.text-sm`/`.text-md`/`.text-lg`/`.text-h4`/`.text-h3`/`.text-h2`/`.text-h1`/`.text-display`/`.text-hero`/`.text-mega` (`frameworks/tailwind/Theme.css`, `--text-*`).
- **Spacing:** 4px base grid; generous rhythm in marketing (88px gutter), dense but breathable in product.
- **Backgrounds:** **always flat.** Arena **does not use color gradients** on any surface: not heroes, not splash screens, not cards, not accents. Depth is built with the surface scale (`base-100`→`base-200`→`base-300`), the hairline border and the warm shadow, never with color transitions. (The only permitted use of `linear-gradient`: the `Skeleton`'s neutral *shimmer* animation, which is loading motion, not chromatic decoration.) No generic stock photos; real product imagery or striped placeholders.
- **Borders:** hairline `1px` in `--color-base-300` (alias `--border`); emphasized border in `--line-strong`. The border, not the shadow, is used to separate content on flat surfaces.
- **Shadows:** warm and deep, negative spread (`0 12px 28px -12px rgba(0,0,0,.6)`). There is no tinted glow: elevation is always the neutral warm shadow.
- **Radii:** contained, with buttons/inputs at 6px, cards at 14px and the app tile at 22%. `--r-2xl` (34px) is one step further, following the scale's own ratio (22→34 is ×1.55, in line with the tightest existing step), and it is the brand manual's splash-screen tile, a distinct role from `--r-xl`'s app icon tile. Nothing fully round except avatars and switches. **Floating overlays:** modals (Dialog, ConfirmDialog, CommandPalette, Onboarding) use `--r-lg` (14px); minor non-modal floating surfaces (Toast, Menu, BulkActionBar) use `--r-md` (10px). The rule: if it captures the whole screen with a scrim, `--r-lg`; if it's a bounded panel over the UI, `--r-md`.
- **Cards:** surface `--surface-card`, hairline border, 14px radius, no shadow in lists (border only) and `--shadow-2` when floating (menus, dialogs).
- **Animation:** `--ease-out` for entrances, `--ease-emphatic` for the "rotor" gesture, the brand's easing character, named for the mark's rotation. Transitions run 120/220/420ms (`dur`); a looping animation (`Spinner`, `ProgressBar`, `Skeleton`) runs on its own, slower scale measured in seconds (`loop`; see the motion scale table below), because it reports ongoing work rather than responding to an action. No excessive bounce.
- **`prefers-reduced-motion`:** every animation in the system answers it, and what it answers depends on what the motion *means*. Motion that reports work in progress **slows** (`Spinner`, `ProgressBar`, `Button`'s loading ring). Never freeze it: a stopped spinner reads as a hung process, which is the opposite of the truth. Purely decorative motion **stops** (`Skeleton`'s shimmer falls back to a flat surface). An entrance **keeps its fade and drops its travel** (`Dialog`, `Menu`): the movement is the vestibular trigger, the fade is the meaning. Opacity-only animations (`Tooltip`) need no clause, because there is nothing to reduce. (`Tooltip` is also a deferred affordance: it waits `--delay-open` before appearing at all, a pointer-intent delay orthogonal to reduced motion; see the behaviour timing table below.)
- **Hover:** lighten the surface one step (`--color-base-300`→`--line-strong`) or raise opacity; on accent buttons, hover raises the general elevation (`--shadow-2`). *Note:* the `--crimson-strong`/`--gold-strong`/`--danger-strong` variants **alias to the base color**, since there is no separate darker "strong" tone; press emphasis is achieved with scale, not a second tone.
- **Press:** `scale(.98)` on small controls.
- **Focus:** gold ring `2px` with `2px` offset, always visible and never `outline:none` without a replacement.
- **Transparency/blur:** blur only on dialog overlays (`backdrop-filter: blur(6px)` over `rgba(20,16,16,.6)`).
- **Uppercase microcopy (H2/H6/H8):** reserve `text-transform:uppercase` + mono for **short microlabels** (≤2 words: eyebrows, field labels, status badges, table headers). **Messages, titles and any reading text go in normal case**, never uppercase sentences. Rule of thumb: if it doesn't fit in a "pill," it goes in normal case.
- **Navigate vs. filter (`Tabs` vs. `SegmentedControl`):** the two are told apart by **shape and accent, not by size**. `Tabs` changes the view: bare text on a hairline rule, stretched across the content, active marked by the **crimson underline**. `SegmentedControl` filters *within* the current view: an enclosed track that shrinks to its content, on the `--surface-input` surface that Input and Select wear, selection marked by a **neutral raised thumb** (`--line-strong` + `--shadow-1`) and **no crimson at all**, because a filter does not spend the view's single primary accent, and the solid fill stays reserved for the primary action. They stack on purpose: tabs on top, the control beneath, filtering what the tab opened. A segmented control is **never** `role="tablist"`: it is a real radio group, since its options are mutually exclusive values, not destinations.
- **Single dismiss pattern (H4):** the icon dismiss always uses Phosphor `ph-x` (Tag, Toast). **Modals** (Dialog/ConfirmDialog) are closed with their **explicit button** (Cancel) or a click-outside where appropriate, not the icon; the two affordances are never mixed in the same component.
- **Component documentation (H10):** every `*.prompt.md` includes examples and, where it adds value, a **Do / Don't** section with the most common usage mistakes.

### Danger convention (destructive actions and risk indicators)
To tell **destructive / risk actions and indicators** apart from the primary action, Arena distinguishes them by **shape, not weight**: **transparent background** with the **border and all its content** (text and icons) in the semantic token **`--error`** (alias `--danger`). This way danger reads through color and never visually competes with the filled crimson primary button.
- **Applies to** every risk trigger or indicator: buttons (`.btn.danger`), icon buttons (`.iconbtn.danger`), menu items (`.mitem.danger`) and equivalents in lists, cards and toolbars. Hover: lightens with `--danger-soft`. Focus: `--error` ring.
- **Rule:** a **filled** danger button never appears as a trigger in the UI (lists, cards, toolbars). The solid fill is reserved by visual weight for the primary action (crimson).
- **Only exception, the final irreversible confirmation:** inside a `ConfirmDialog`, the button for the final "point of no return" **is** filled, in `--danger-fill` (`--color-error-fill`) over `--color-error-content` and **not** in `--danger`. It's the only surface where danger is filled, precisely because it must not be confused with an ordinary action.
- **Danger is two reds, and they cannot be one.** `--danger` is read *as text* on the base surfaces, so it is tuned against them (lighter in dark, darker in light). That leaves it too light to carry white text, which is exactly what the filled confirmation needs, so the fill is its own token, tuned in the opposite direction. Collapsing them puts one of the two roles under WCAG AA; `bun scripts/check/core/check-text-contrast.mjs` gates both.
- **Specimen:** `intro/guidelines/components-danger.html` (all three states side by side: filled primary · outline danger · filled final confirmation).
- **"Danger is outline" governs controls and surfaces, not presence or identity marks.** `Avatar`'s presence dot (online/busy/away/offline) is a different semantic family, a status taxonomy like the chart `tone` colors rather than a destructive affordance, and it is filled: `--color-success`, `--color-warning` and `--color-error` for the three live states, `--status-offline` for the fourth. An outline dot at that size (`max(8px, diameter * 0.28)`) would not read at all. The same carve-out covers any other small identifying dot at that size, filled via `currentColor` from a `tone`/status token: `Tag`'s leading dot and `ActivityFeed`'s per-row tone dot are both `bg-current`, and both fill with `text-error` for their danger tone. A tag or a feed row is naming *what kind of thing this is*, the same taxonomy Avatar's presence is, not asking to be read as a risk trigger. Nothing here contradicts the rule above: the rule is about *danger*, and a dot filled in `--color-error` at this size is identity/status borrowing the error hue for "this one," not a risk indicator.

### Layering (stacking order)
What covers what is a system-wide invariant, not a per-component choice, so it is a token family, `z` (`contracts/design/layering.json`, generated into `contracts/design-generated/effects.generated.css`), rather than a literal chosen anew in each overlay component. **The family declares the order; the values only have to preserve it.** From least to most interruptible:

| Token | Value | Carried by |
|---|---|---|
| `--z-nav` | 800 | `BottomNav`, and the host's own fixed page chrome beside it: a sticky top bar, a second bar of its own. Below dropdown, so a `Menu` opened from the bar covers it |
| `--z-sheet` | 850 | `Sheet`, and the host's own edge panels beside it: a cart, a filter drawer, a detail pane that leaves the page usable behind it. Above nav, because a sheet that slides over a fixed bar and lands under it is the failure; below dropdown, because a `Menu` opened from inside the sheet belongs over it |
| `--z-dropdown` | 900 | `Menu`, `Select`'s popover layer |
| `--z-tooltip` | 950 | `Tooltip`, above dropdown, so a tooltip on a menu item wins over the menu itself |
| `--z-modal` | 1000 | `Dialog` |
| `--z-modal-nested` | 1050 | `ConfirmDialog`, which opens *from* a `Dialog` and so must sit above one |
| `--z-palette` | 1100 | `CommandPalette` |
| `--z-onboarding` | 1200 | `Onboarding`'s coachmark card |
| `--z-toast` | 1300 | `Toast`, which floats above everything, including onboarding, because a transient notice raised by an action taken inside a dialog must stay visible |

`Onboarding`'s scrim is not a second token: it is one slot with two uses, and the two are separated by containment rather than by a number. The scrim takes the slot and the coachmark is drawn inside it, so it paints above by DOM order within one stacking context. That keeps "the scrim sits just under the coachmark" true by construction instead of requiring a second magic number nearby, and nothing else on the page can land between them, which is what a single slot means here.

**The family declares the order; the values only preserve it.** Every overlay reads its step from this table rather than declaring a number of its own, which is what makes the relationships above enforceable: a tooltip resolves above a menu item by design rather than by DOM order, and `ConfirmDialog` sits above the `Dialog` it opens from rather than by accident of mount order. A component that hardcodes a `z-index` outside this scale is a defect.

Exposed in the Tailwind layer as `.z-nav` / `.z-sheet` / `.z-dropdown` / `.z-tooltip` / `.z-modal` / `.z-modal-nested` / `.z-palette` / `.z-onboarding` / `.z-toast` (`frameworks/tailwind/Theme.css`, `--z-index-*`). **A consumer embedding Arena inside an app that has its own stacking context should read this table rather than guess at a number**: Arena's overlay components render in place (not one of them uses a React portal), so the global order above governs any of them mounted as siblings. **A slot is not declared for the component that stands on it.** `--z-nav` and `--z-sheet` were both minted while Arena drew nothing at either step, and they were right then for the reason they are right now: the host's own chrome, a sticky header or a second bar, and the host's own edge panels have to interleave with Arena's overlays, and a slot they can name is the difference between an order by design and an order by DOM. `BottomNav` and `Sheet` stand on them today; a host's own bar stands beside `BottomNav` on the same step, and that is the arrangement the slot exists to make orderly. `--z-sheet` is now the one step no Arena component would leave empty if it were removed, and it stays for the same reason `--z-nav` did before the bar arrived. **A sheet is not a `Dialog` wearing a different placement**: it is not modal, it carries no scrim and it leaves the page usable behind it, which is why it sits two slots below the one that takes the whole interaction. Any other host `z-index` is chosen against this scale too, not against whatever the host already had lying around. `display/calendar/Calendar.tsx`'s `zIndex: 1` is not part of this family: it is local stacking inside a positioned container, scoped entirely inside one component, and stays a hand-written literal.

### Quantity invariants (`limit`)
System-wide bounds on how much is shown, the twin of `z`: same `$type` (`number`), same character. `z` declares the stacking order; `limit` declares the invariant, and a component derives its own consequences from it. The source is `contracts/design/behaviour.json`, generated into `contracts/design-generated/effects.generated.css`.

| Token | Value | Role |
|---|---|---|
| `--limit-pagination-siblings` | 1 | how many page numbers flank the current one before `Pagination`'s list elides. The window's total width is a *consequence*, derived at the point of use as `first + last + (2 × siblings + 1) + two ellipses`, and never authored as a second number |

**Script-readable, not Tailwind-exposed**: unlike `z`, `limit`'s consumer is an array bound in JavaScript, not a CSS property, so it carries no utility class. It reaches React as the bare number `limitPaginationSiblings` (`frameworks/react/Tokens.generated.js`) and is named in `check:coverage`'s `EXCLUDED` map for that reason rather than reaching a utility.

### Control density type scale (`dz`)
Chrome text, meaning a button label, an input's value, a hint, a validation error, a badge or a table cell, is governed by how dense the surrounding controls are, not by the prose scale (`fs`). `dz` declares control heights, row padding, stack gap and its own five-step text scale, generated into `contracts/design-generated/spacing.generated.css` from `contracts/design/spacing.json` (base) and `contracts/design/density.compact.json` (the `.arena-compact` override):

| Token | Value | Compact (`.arena-compact`) | Role |
|---|---|---|---|
| `--dz-text` | 14px | 13px | control text: buttons, inputs, selects, menu items, table cells |
| `--dz-text-md` | 13px | 12px | secondary control text: tag chips, pagination, secondary buttons |
| `--dz-text-sm` | 12px | 11px | secondary control text: hints, validation errors, badges, legends |
| `--dz-text-xs` | 11px | 10px | micro control text: field labels, shortcuts, eyebrow labels |
| `--dz-text-2xs` | 10px | 10px | column headers, row micro-labels |

`--dz-text-2xs` does not shrink further in the compact scope: −1px would land it at 9px, which the system treats as illegible drift and snaps away from everywhere else, so reintroducing it as a systemic compact value would undo that call one layer down. Every other step follows the `−1px` precedent `--dz-text` itself sets (14→13).

`--dz-text` is the one token for the "control text" role; every consumer reads it.

Exposed in the Tailwind layer under a `ctl` infix (`--text-ctl`, `--text-ctl-md`, `--text-ctl-sm`, `--text-ctl-xs`, `--text-ctl-2xs`) because the natural `--text-*` keys already belong to `fs`, and two collide on value as well as name (`fs.sm` / `dz.text-md` are both 13px; `fs.xs` / `dz.text-xs` are both 11px). No `dz` token wears an `fs`-shaped name: the `ctl` infix is what keeps the two namespaces distinguishable.

### Tracking scale (`ls`)
Letter-spacing across the system is one role hierarchy: **tracking decreases as the text gets longer**, from the shortest mono micro-labels down through prose-adjacent chrome to the tightest display headings. The family below is that hierarchy, generated into `contracts/design-generated/typography.generated.css` from `contracts/design/typography.json`:

| Token | Value | Role |
|---|---|---|
| `--ls-tight` | `-0.02em` | display, meaning tight headings |
| `--ls-normal` | `0` | no tracking: button labels, glyph pairs |
| `--ls-mono-nav` | `0.04em` | mono navigation: breadcrumbs, bulk-action counts |
| `--ls-uppercase-status` | `0.06em` | uppercase status text: alerts, toasts, calendar hour labels |
| `--ls-badge` | `0.1em` | badge and pill text |
| `--ls-column-header` | `0.12em` | column header / micro-label |
| `--ls-field-label` | `0.14em` | form field label |
| `--ls-label` | `0.22em` | mono uppercase labels: section eyebrows |
| `--ls-wide` | `0.34em` | eyebrows (`intro/Arena - Overview.html`'s `.kicker`/`.eyebrow`) |

`ls` is a **semantic** family: a value used by only one component does not earn a step of its own, since there is nothing to derive a role from. A singleton snaps to the nearest existing step instead, which is why `Button`'s and `Avatar`'s uppercase pairs both read `--ls-normal` (0) and `Menu`'s section header reads `--ls-field-label` (.14). Where a value falls exactly between two steps, as a `.02em` sits between `--ls-normal` and `--ls-mono-nav`, it resolves downward, consistent with the hierarchy bottoming out at zero. And a role rendered at two values 0.01 or 0.02 apart is one role with drift, not two: every eyebrow reads `--ls-label` and every display title reads `--ls-tight`, rather than the scale gaining a step for the difference.

Exposed in the Tailwind layer as `.tracking-tight` / `.tracking-normal` / `.tracking-mono-nav` / `.tracking-uppercase-status` / `.tracking-badge` / `.tracking-column-header` / `.tracking-field-label` / `.tracking-label` / `.tracking-wide` (`frameworks/tailwind/Theme.css`, `--tracking-*`).

### Line-height scale (`lh` / `dz.lh`)
Line height splits editorial from control exactly the way `fs`/`dz` split font size. Prose that wraps needs breathing room between its own lines, and that is `lh`, in `contracts/design/typography.json`. A box built around a single glyph (an icon inside a button, a standalone status icon, an icon-only close or remove control) needs the opposite: a line box that is *exactly* its glyph, so the extra space above and below a normal line height never throws the surrounding control out of alignment. That reset is a density/control concern, not an editorial one, so it lives in `dz` (`contracts/design/spacing.json`) alongside the rest of the control scale, carrying its own token-level `$type: "number"` override, because a line height is unitless, unlike every other `dz` member.

| Token | Value | Role |
|---|---|---|
| `--lh-tight` | `0.98` | sub-1em, the tightest display headings |
| `--lh-snug` | `1.15` | snug prose: short labels and values that still wrap on occasion (`StatCard`'s value, `Radio`'s label, `Shell`'s person block) |
| `--lh-body` | `1.6` | prose: paragraphs, dialog and alert body copy, messages |
| `--dz-lh` | `1` | glyph-tight, the control reset, where the box is exactly its glyph |

Three prose steps cover every wrapping site in the system, and a value within 0.05 of one is drift rather than a fourth step: it moves to the token.

Exposed in the Tailwind layer as `.leading-tight` / `.leading-snug` / `.leading-body` (`frameworks/tailwind/Theme.css`, `--leading-*`). `--dz-lh` is exposed as `.leading-ctl` rather than `.leading-none`, because the `--leading-*` namespace holds three editorial steps (`tight`, `snug`, `body`) plus this one control token, and a name indistinguishable from its editorial neighbours would be a `dz` token wearing an `lh`-shaped name, which is the mistake the `fs`/`dz` split exists to prevent. The `ctl` infix keeps it visibly a density role, consistent with `--text-ctl`.

### Motion scale (`dur` / `loop`)
Two families, one `$type: duration`, two roles that must not merge. `dur` is the transition scale: a response to an action, over in the low hundreds of milliseconds. `loop` is cyclical motion: it reports that work is *ongoing*, and is measured in seconds rather than milliseconds, because a spinner or an indeterminate progress sweep is not "responding" to anything, it is signaling that something is still running. Merging the two would repeat the mistake the `fs`/`dz` split exists to prevent: one scale asked to carry two roles at once. Both live in `contracts/design/effects.json`, generated into `contracts/design-generated/effects.generated.css`.

| Token | Value | Role |
|---|---|---|
| `--dur-fast` | 120ms | micro-interactions: hover, press |
| `--dur-mid` | 220ms | most transitions: menus, tooltips, dialogs entering |
| `--dur-slow` | 420ms | larger surface changes |
| `--loop-spin` | 700ms | `Spinner`, and `Button`'s loading ring |
| `--loop-sweep` | 1150ms | `ProgressBar`'s indeterminate sweep |
| `--loop-shimmer` | 1400ms | `Skeleton` |
| `--loop-brand` | 8000ms | the brand mark's rotation, slow enough to read as presence rather than progress |
| `--loop-reduced` | 2400ms | what every working loop above slows to under `prefers-reduced-motion` |
| `--loop-brand-reduced` | 24000ms | the brand mark's reduced step, three times slower again, because that rotation is decoration that also happens to mean "alive" |

`prefers-reduced-motion` does not stop a working loop, it **slows** it: `--loop-reduced` (and the brand mark's own, three-times-slower `--loop-brand-reduced`) is that slowed step, never zero: a frozen spinner reads as a hung process, the opposite of what it exists to report. Purely decorative motion is the other case, and stops outright: `Skeleton`'s shimmer falls back to a flat surface, since there is nothing left to report once it stops.

Exposed in the Tailwind layer as an arbitrary value against each token, `duration-[var(--loop-spin)]` and so on, rather than as a named utility: Tailwind v4 has no duration namespace of its own for either family to extend.

### Behaviour timing (`delay` / `dismiss`)
Two more `$type: duration` families, deliberately not part of `dur` or `loop` above. `dur` measures how long a transition takes *once it has been decided*; `delay` measures how long the system waits *before deciding*, which is pointer intent rather than motion. `dismiss` measures how long a transient notice is left alone before it withdraws itself, which is a permanence decision, not a transition either. Both live in `contracts/design/behaviour.json`, generated into `contracts/design-generated/effects.generated.css`.

| Token | Value | Role |
|---|---|---|
| `--delay-open` | 400ms | rest time before `Tooltip` appears, long enough that a pointer crossing a toolbar reveals nothing |
| `--delay-close` | 120ms | grace period after the pointer leaves, so travelling between a trigger and its own tooltip does not dismiss it |
| `--dismiss-default` | 4200ms | how long a `Toast` that only has to be read stays before it auto-dismisses |
| `--dismiss-actionable` | 7000ms | how long a `Toast` carrying a button stays, per WCAG 2.2.1: it asks the reader to *decide*, not only to read |

`delay` applies to the **pointer only**: a keyboard focus must reveal its tooltip immediately, and routing that path through `--delay-open` would make an already-hard-to-reach control also feel broken. `dismiss` is run by the *host*, never by `Toast` itself. `Toast` renders and exposes `persist`, which overrides both values and never auto-dismisses, and which is mandatory in critical/error states so they are not missed (README H1, see the danger convention above).

**Script-readable, not Tailwind-exposed**: both families' consumers are `setTimeout` arguments in JavaScript, not CSS properties, so neither carries a utility class. They reach React as `delayOpen`/`delayClose`/`dismissDefault`/`dismissActionable` (`frameworks/react/Tokens.generated.js`) and are named in `check:coverage`'s `EXCLUDED` map for that reason rather than reaching a utility.

## Iconography
- **Official set: [Phosphor Icons](https://phosphoricons.com)** (MIT license, free commercial use, no attribution). Chosen for aligning with Dravensoft's bold identity: it's the open-source family with the widest style range (1,500+ icons in 6 weights) and its **Bold** weight has the presence and high contrast the brand calls for, the icon equivalent of Archivo Black.
- **Weights and use:**
  - **Bold** (`.ph-bold`): default weight across the UI. Presence and legibility at high contrast.
  - **Fill** (`.ph-fill`): active/selected state (e.g. the active navigation item, a toggle that's on).
  - **Duotone** (`.ph-duotone`): only to highlight features/onboarding, with the crimson accent on the primary layer. Premium two-tone effect; use sparingly.
- **Loading (the default is to install the package):** install `@phosphor-icons/web` and import its weight stylesheets, or `@phosphor-icons/react` (`<Rocket weight="bold"/>`), then apply the weight class plus the icon class: `<i class="ph-bold ph-rocket-launch"></i>`. **Prototype-only:** the CDN, e.g. `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css`.
- **Sizes** are a token family, `icon` (`contracts/design/icon.json`, generated into `contracts/design-generated/spacing.generated.css`), applied via `fontSize` since Phosphor renders as a webfont:

  | Token | Value | Role |
  |---|---|---|
  | `--icon-sm` | 14px | compact inline glyph: a remove/status icon beside dense chrome |
  | `--icon-md` | 16px | default inline control icon: close buttons, chevrons, list-item icons |
  | `--icon-lg` | 18px | prominent standalone icon: a tone icon, a search glyph |
  | `--icon-xl` | 34px | illustration-scale icon: `EmptyState`, `ErrorState` |

  A glyph rendered as a webfont is still an icon rather than type, since an icon at 15px beside a label at 15px is not the same design decision as an icon at 16px, so these stay out of the `fs` scale. Exposed in the Tailwind layer under `--size-*`, not `--text-*`: `.size-icon-md` sets both width and height, since an icon is a size, not a font size. Color: inherits `currentColor`; accent only when interactive/active.
- **Do not** override `font-family/weight/style` on `.ph-*` classes (breaks the glyphs).
- **No emoji.** No arbitrary unicode as an icon. The **Rotor** (`assets/rotor-*.svg`) is brand, not a UI icon: don't use it as a functional glyph, and Arena ships no component that wraps it. The lock-up is `AppLogo`, which takes the mark as its `mark` node.
- The `console/Icon.tsx` UI kit draws its own stroke-style SVGs; the official reference for product work is Phosphor.

---

## Theming

Arena's identity lives in **shape**, not in its hexes. Crimson and gold are Dravensoft's skin; a different product can wear a different one and still be unmistakably Arena.

**The public swap surface is `contracts/design/palette.dark.json` and `contracts/design/palette.light.json`: the `--color-*` set plus `--color-cat-*`.** Everything else derives. Swap those two files, run `bun run generate:tokens`, and the whole system follows: the generated `contracts/design-generated/palette.generated.css` re-emits, the aliases in `contracts/design/colors.css` (`--bg`, `--crimson`, `--danger`, `--mute`…) re-point, the muted text levels re-derive through `color-mix`, and every component re-colors, because components read tokens and never hold a value of their own.

### The layer contract

**Standardized (the DTCG layer).** Every token *value* (colors, dimensions, font
attributes, durations, easings, shadows) is authored once in `contracts/design/**/*.json` as
strictly-conformant DTCG 2025.10, the platform-neutral contract. A new framework target
consumes that JSON directly, or through a Style Dictionary platform emitting CSS, JS,
iOS, Android or SCSS. Nothing in it is Arena-specific, and
`bun scripts/check/core/check-dtcg.mjs` proves it conforms.

**Per-platform (the composition layer).** Three things DTCG deliberately does not model,
and that therefore live in each platform's own idiom:

1. **Runtime color derivations**: the muted-text levels and `*-soft` accents, expressed
   in CSS as `color-mix(in oklab, var(--…) N%, transparent)` so they re-derive when the
   skin swaps. In CSS they live in the hand-authored `contracts/design/colors.css`. A new framework
   rebuilds this thin layer in its idiom (Tailwind `color-mix` utilities, a JS token
   helper) **on top of the same standard values**, and never re-defines a value.
2. **`@font-face` bundling**, generated by `scripts/generate/core/fetch-fonts.mjs` into
   `contracts/design-generated/fonts.generated.css`, pointing at the self-hosted `assets/fonts/` binaries.
3. **The device's own geometry**, meaning the safe-area insets a browser resolves per device
   at paint. `env(safe-area-inset-*)` is a value and a unit to nobody: it has no value until
   there is a screen, so there is nothing for DTCG to hold. `contracts/design/environment.css`
   composes each one with the token that applies when the device reports no inset, as
   `--pad-safe-bottom: max(var(--sp-3), env(safe-area-inset-bottom))`, so a phone shell reaches
   one custom property instead of writing the fallback four times and differently.
   **Arena draws nothing that needs them**, and they are declared for the reason `--z-nav` and
   `--layout-bar` are: the frame a consumer builds around Arena is part of the system, and the
   alternative is every consumer inventing the same expression.

The dividing line: **DTCG owns values; the composition layer owns how values are combined
at runtime.** `contracts/design/colors.css` therefore holds no skin value, only references
(`var(--color-primary)`) and `color-mix` compositions, and `environment.css` holds no length,
only a token and what the device reports. The full `$type` table is
`contracts/design/README.md`.

**A swap is not done until it is measured**, and two scripts measure it. `bun scripts/check/core/check-ramp.mjs` holds the categorical ramp; `bun scripts/check/core/check-text-contrast.mjs` holds the text: the levels derived from `--color-base-content`, every `--color-*` / `--color-*-content` pair (all seven, at 4.5:1, because the pair is the contract a skin defines, so an illegible one fails before a component can inherit it), and the accents painted straight onto the base surfaces (`--color-error` as the danger outline). Both read the values out of `palette.generated.css` and hardcode nothing, so a new skin is one edit and two commands away from a real answer.

Two of these numbers the scripts **report without gating**: crimson as text sits at 2.80:1 on the dark card, gold as text at 2.24:1 on the light one. Both are below AA and both are deliberate: they are the brand, and a gate there would not tighten a token but repaint Dravensoft. Use them as fills or on the theme that carries them, and reach for `--text-strong` when the job is reading text.

| Invariant, this *is* Arena | Skin, yours to change |
|---|---|
| Danger is outline, never filled (one exception: `ConfirmDialog`'s final confirmation) | Crimson (`--color-primary`) |
| No gradients on any surface (one exception: `Skeleton`'s shimmer) | Gold (`--color-secondary`) |
| The `base-100`→`base-200`→`base-300` surface scale | The warm-black base values |
| The hairline border, and the warm shadow scale | The status hues |
| The type scale, the three families, the uppercase-microlabel rule | The 8 categorical slots |
| Identity vs meaning; one axis in charts; the ramp is never cycled | |

### The categorical ramp

Eight slots for colouring N arbitrary entities: chart series, calendar events, any set where the color answers *which thing*. Authored per theme, **fixed order, never cycled**. A ninth entity folds to "Other", small multiples, or direct labels, never a generated hue. The slots carry **identity only**; when a series *is* a state, a chart's `tone` prop uses the status colors instead.

The ramp is one system with one entry point: `catColor(slot)`, which every layer carries in its own `DataVisuals` module. `Calendar` reads it from there rather than keeping its own copy: two clamps over one ramp is how a ramp stops being a ramp.

Where a component has no `tone` escape hatch, **state goes on a non-chromatic channel**, never by turning an identity-coloured entity `--danger`. An entity painted a status color while its neighbours carry identity colors makes the palette mean two things at once, and the reader cannot tell which. `Calendar` is the strict case: it draws every event chip itself, so a consumer has no chromatic channel *and* no non-chromatic one, and a cancelled class says so in its title or does not appear on the schedule. That is a real capability the API contract removed, and `Calendar.prompt.md` records it.

| Slot | Name | Hue | Dark | Light |
|---|---|---|---|---|
| 1 | forest | 136° | `#3c7b0a` | `#397804` |
| 2 | indigo | 264° | `#3b63be` | `#264ba4` |
| 3 | green | 152° | `#0a924b` | `#0a924b` |
| 4 | violet | 288° | `#6a59bc` | `#523e9f` |
| 5 | cyan | 216° | `#00a3c0` | `#008fa9` |
| 6 | purple | 312° | `#884da9` | `#6e328d` |
| 7 | teal | 184° | `#00a99a` | `#009487` |
| 8 | orchid | 328° | `#984697` | `#7c2b7b` |

It was derived by enumeration against the validator, not chosen by eye: candidate hues were filtered to those clearing the chroma floor *and* 3:1 against the real chart surface (`--color-base-200`) in both themes, the whole crimson→gold warm arc was banned, and the order was enumerated against the gates. Chroma is capped at OKLCH C ≤ 0.15 so the ramp sits in Arena's register (crimson 0.177, gold 0.100) rather than reading as neon.

**Measured: both themes clear every hard gate, with no relief rule.**

| Gate | Dark | Light | Bar |
|---|---|---|---|
| CVD separation (adjacent, OKLab ΔE×100) | 13.3 | 16.4 | target ≥ 8 |
| Normal-vision floor | 20.5 | 22.1 | hard floor ≥ 15 |
| Contrast vs surface | all 8 ≥ 3:1 | all 8 ≥ 3:1 | ≥ 3:1 |
| Lightness band | all inside | all inside | per-mode band |
| Chroma floor | all ≥ 0.1 | all ≥ 0.1 | ≥ 0.10 |

**Brand clearance** (ΔE to the ramp's closest slot): crimson 17.0, gold 18.0, error 19.6, warning 26.3, all above the 15 bar. That is the requirement: the ramp cannot be mistaken for the brand or for an error.

**Accepted collision:** success 6.0, info 7.8. This is structural. Eight slots need ~126° of arc; banning the red family leaves green, cyan, blue and violet, which is exactly where success (156°) and info (250°) live, and guarding those as hard as the brand leaves only ~76°. **A ramp can be clear of the brand or clear of status, not both.** Clear of the brand is the right choice: brand colors carry identity everywhere, while status colors always ship with an icon and a label (`Alert`, `Toast`, `Badge`) and never appear as a bare fill.

### Re-check after you swap

The promise above is only worth the validator that backs it. After changing anything in `contracts/design/`, rebuild (`bun run generate:tokens`) and then:

```bash
bun scripts/check/core/check-ramp.mjs
```

It reads the ramp straight out of `palette.generated.css`, which the build regenerates from the DTCG source, measures both themes against their real surfaces, and exits non-zero on any failure, **including** the warnings the upstream validator tolerates, because Arena's shipped ramp needs no relief rule and neither should yours. Do not trust your eye here; nobody's eye simulates deuteranopia.

## The token type map lives beside this file

The DTCG `$type` of every token group, the strict 2025.10 value formats, the
`script: true` flag and what the map deliberately leaves out are in
[`TokenTypes.md`](./TokenTypes.md). It is normative too, and it is the second thing a new
platform target reads: this document states what the values MEAN, and that one states what
shape they arrive in.
