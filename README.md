# Arena — Dravensoft Design System

**Version 4.0.0** · MIT License · Dark-first, token-driven design system for React, Angular and Tailwind. See [`CHANGELOG.md`](./CHANGELOG.md).

**Arena** is the single interface language under which every Dravensoft software product is built. It takes its name from the venue where a performance is put on display and applauded: every Arena interface should feel *worthy of being exalted* — the same promise the brand makes.

## Getting started
Arena ships three ways — as a **Claude Code plugin**, as a **copy-in reference kit**, and as a downloadable **Agent Skill** (`SKILL.md`). It is not an npm package.

### Install as a Claude Code plugin
Inside Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add dravensoft-dev/Identity
/plugin install arena@dravensoft
/reload-plugins
```

This registers the `design` skill under the `arena` plugin. Invoke it explicitly with `/arena:design`, or just ask Claude for Dravensoft-branded UI and it loads automatically.

**Updating takes two commands, not one**, and skipping the second fails silently — you see the new version listed and keep running the old one:

```
/plugin marketplace update dravensoft   # refresh the catalog: learns a new version exists
/plugin update arena@dravensoft         # update the plugin you actually have
/reload-plugins                         # apply it to the running session
```

`/plugin marketplace update` only refreshes the listing. `/plugin update` is what replaces the installed copy (`claude plugin update arena@dravensoft` from a shell, with `--scope` if you installed to `project` or `local`).

**Nothing arrives on its own.** Claude Code enables plugin auto-update for Anthropic's own marketplaces and leaves it **off** for third-party ones like this. To let releases land in the background, turn it on once: `/plugin` → **Marketplaces** → `dravensoft` → **Enable auto-update**. For a whole organization, set `"autoUpdate": true` on the marketplace's `extraKnownMarketplaces` entry in managed settings.

**A version means one commit.** Each release is served from its git tag — the marketplace entry pins `source.ref` to `vX.Y.Z` — so a version resolves to the same tree today and in a year, never to whatever `main` happens to hold. The catalog itself is still read from `main`, which is how a new release announces itself.

### Use in a project (copy-in kit)
To use the tokens and components directly in an app:

1. **Copy** `tokens/`, `assets/`, `styles.css`, `frameworks/react/use-container-width.js` and `frameworks/react/tokens.generated.js` into your app (e.g. under `/arena`). `use-container-width.js` is the shared hook `Table` (and any responsive component) imports; copy it whenever you copy one of those. `tokens.generated.js` is the design values JavaScript reads as numbers rather than through CSS; it is generated from `tokens/src/`, so never edit it.
2. **Link the entry point.** `styles.css` only `@import`s the token files, exposing every design token as a CSS custom property (`--color-*`, `--font-*`, `--r-*`, `--shadow-*`, …) and loading the fonts:
   ```html
   <link rel="stylesheet" href="/arena/styles.css" />
   ```
3. **Pick the theme.** Dark is the default (`:root`). Add `class="arena-light"` on `<html>` for the warm light theme, or wire the built-in toggle with `theme.js`.
4. **Use the components.** Copy the `.jsx` files you need from `frameworks/react/components/` and import them:
   ```jsx
   import { Button } from './frameworks/react/components/forms/Button.jsx';

   <Button variant="primary" size="md">Deploy</Button>
   ```
   Every component ships a `.d.ts` (types) and a `.prompt.md` (usage, examples, Do/Don't).

   A few components build on another one rather than restating it, so copy the dependency with them: `ConfirmDialog` and `ErrorState` need `forms/Button.jsx`, `ThemeToggle` needs `forms/IconButton.jsx`, and `Calendar` needs `charts/chart-internals.js` for the categorical ramp. The charts, `Calendar` and `Onboarding` also need `frameworks/react/tokens.generated.js` — the design values JavaScript reads as numbers rather than through CSS (a chart's plot height, an hour's height on the time grid, the coachmark's width). Copy it beside `use-container-width.js`; it is generated from `tokens/src/`, so never edit it.

### How components are styled
Components render with **inline `style` objects that read the CSS custom properties** (e.g. `background: 'var(--crimson)'`). They do **not** expose utility classes — there is no `class="btn"`. `styles.css` provides only the token variables and fonts; all component logic lives in the `.jsx`. This keeps each component self-contained and fully themeable: change a token and every component follows.

### Dependencies
- **Fonts — self-hosted (bundled).** Arena ships the Archivo / Familjen Grotesk / Spline Sans Mono `.woff2` binaries in `assets/fonts/`; `tokens/fonts.css` declares them with `@font-face`. No CDN request — copy `assets/` (which now includes `fonts/`) with the kit and fonts load from your own origin.
- **Icons — [Phosphor Icons](https://phosphoricons.com) (MIT).** Not bundled. **Install the official package by default** — `@phosphor-icons/web` (webfont) or `@phosphor-icons/react` — for full weight/tree-shaking flexibility. The CDN is a prototype-only convenience, not the default. See the [ICONOGRAPHY](#iconography) section.
- **React** — the primitives in `frameworks/react/components/` are React (JSX). Tokens, guidelines and assets are framework-agnostic and can be used without React.

## Audience and scope
- **Audience of the language: general public.** Arena is meant to give identity to **every kind of Dravensoft software**, regardless of who the end user is — from consumer apps to internal tools. Its foundations (color, typography, spacing, accessibility, voice) are general-purpose and don't assume a technical profile.
- **The example application is `frameworks/react/ui_kits/console/`**, not the language itself. It illustrates Arena applied to the **Delivery Console, a product aimed at developers/technical teams**. That's why it includes data density, domain terminology (build, deploy, p95) and keyboard accelerators specific to that audience. `Arena - Overview.html` is the opposite: the framework-agnostic token language, and it deliberately shows no components.
- **Implication for audits and evaluations:** findings observed on the example should be split into (a) those that apply to the **language** (tokens, components, patterns — universal) and (b) those specific to the **example's technical context** (jargon, density, shortcuts). The latter are not defects of the language: in a product for a general audience they would be replaced with plain copy, comfortable density and fewer shortcuts. When evaluating Arena for another kind of software, calibrate against that general audience, not against the Console.

## Why a language of our own (and not Material/Fluent as-is)
Established systems (Material 3, Fluent, Carbon, Polaris) are **light-by-default, rounded and neutral in tone**. Dravensoft's identity is the opposite: **dominant warm black, crimson/gold accents, sharp geometry and a bold voice**. Forcing the brand onto Material would produce a "generic with a skin" app. Instead, Arena:
- **Adopts proven structural principles**: token discipline and a typographic scale (Carbon/IBM-inspired), clear states and density (Material-inspired), visible and accessible focus.
- **Rewrites the aesthetic decisions** for the identity: dark-first, contained radii, deep warm shadows, crimson as the voice and gold as distinction, and the **Rotor** as the signature mark.

## Sources
- Approved identity manual: `Dravensoft Identity.dc.html`.
- Brand: Dravensoft — custom software development / B2B consulting.
- Concept: pride, spectacle, mastery. Motto: *"Software worthy of being exalted."*

---

## CONTENT FUNDAMENTALS (voice and copy)
- **Language:** English (en-US neutral).
- **Register:** formal and direct in enterprise product and formal documentation; a closer, more casual register only in marketing material. Never mix registers on the same surface.
- **Tone:** confident and direct, never boastful. State capability without empty adjectives. E.g.: *"Delivery ready for review"* > *"Amazing delivery completed!"*.
- **Casing:** titles in **UPPERCASE with tracking** only for eyebrows/mono labels (`.22em`); section headings in Archivo weight 800–900 in normal case (Sentence case). Buttons in Sentence case, not Title Case.
- **Data/status labels:** mono, uppercase ("IN PROGRESS", "DEPLOYED").
- **Numbers:** always in mono. Metrics with a unit ("14 ms", "99.98%").
- **No emoji** in product or documentation. Expressiveness comes from color and typography, not decorative icons.
- **Microcopy:** concrete action verbs ("Deploy", "Approve delivery", "Roll back"). Errors are helpful and blame-free ("We couldn't connect to the server. Retry.").

## VISUAL FOUNDATIONS
- **Color — token architecture (daisyUI structure):** the source of truth is a set of `--color-*` tokens paired with their `-content` counterpart (the legible color on top), defined per theme in `tokens/src/palette.dark.json` and `tokens/src/palette.light.json`, from which `tokens/palette.css` is generated. On top of them, a **compatibility layer** in `tokens/colors.css` maps Arena's legacy aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) to the daisyUI tokens, so existing components don't break. Muted text levels (`--bone-dim`, `--mute`) and `--status-offline` are derived from `--color-base-content` with `color-mix`, not fixed hex values.
  - **One token breaks the pairing, on purpose: `--color-error-fill`** (alias `--danger-fill`). It has no `-content` of its own — it *is* a second fill for `--color-error`'s content, because danger is worn two ways and one hex cannot do both. See [Danger convention](#danger-convention-destructive-actions-and-risk-indicators). Pinning it is **optional**: `--danger-fill` falls back to `color-mix(in oklab, var(--color-error) 85%, black)`, so a palette copied without it still gets a filled danger dark enough for white text. Pin it to override the derived tone (the Dravensoft skin pins `#ce3838`); `check-text-contrast.mjs` gates both the pin and the fallback.
- **The muted text scale**, every level AA on both surfaces in both themes — `--text-strong` (100%, 15.23:1 dark / 15.86:1 light on the card), `--text-body` (82%, 10.46 / 9.28), `--text-muted` (62%, 6.52 / 4.71). `--text-muted` in light is the tightest survivor: it clears AA, and it is the reason nothing fits below it. **Removed in 2.0.0:** `--mute-2` / `--text-faint` — the faint level failed AA in light (3.46:1) and could not be repaired, since clearing it there needs 61% while `--mute` already sits at 62%. Use `--text-muted`.
- **`--status-offline`** (52%, 4.93:1 dark / 3.46:1 light on the card) is **presence only** — `Avatar`'s offline dot. It clears WCAG 1.4.11's 3:1 for graphical objects. It is *not* `--mute-2-disabled` (40%), which dresses disabled controls: that one is low **by design** and exempt under 1.4.3/1.4.11's inactive-component carve-out. Do not raise it, and do not reach for it to render presence.
- **Verifying it:** `bun scripts/check-text-contrast.mjs` measures every level against the real surfaces in both themes and exits non-zero on failure. Run it after touching `tokens/colors.css`, or after rebuilding a change to `tokens/src/palette.dark.json` / `palette.light.json`. The claim above is machine-checkable — which is the point: the previous one was not, and was false for a whole theme for three releases.
- **Themes:** the language is **dark-first** but supports two switchable themes — **dark** (`:root`, default) and **light** (`.arena-light`, warm inverse). The same tokens change value per theme; components are never rewritten. (The Overview includes the toggle in its header.)
- **Key values:** a warm black background (`--color-base-100`) under elevated surfaces (`--color-base-200` for cards, `--color-base-300` for panels and borders) and bone text (`--color-base-content`). A single primary accent (crimson, `--color-primary`) per view; gold (`--color-secondary`) reserved for focus, distinction and highlighted data. At most one dominant accent per screen. The literal values live in `tokens/src/palette.dark.json` and `tokens/src/palette.light.json`, from which `tokens/palette.css` is generated — see [Theming](#theming): the scale is the language, the hexes are the skin.
- **Typography:** Archivo (display/headlines, 800–900), Familjen Grotesk (body, 400–600), Spline Sans Mono (data, labels, code). Negative tracking on display (`-0.02em`), wide tracking on mono labels (`0.22em`).

### Type scale (`fs`)
Editorial type — prose and headings, never chrome (see the `dz` table above for the density scale that governs buttons, inputs and labels instead). Closed and semantic: each name is a role, the scale gains no in-between steps, and an off-scale editorial size snaps to its nearest neighbor rather than adding one. The ratio between steps accelerates through the reading range and into display:

| Token | Value | Ratio from previous | Role |
|---|---|---|---|
| `--fs-xs` | 11px | — | mono labels / captions |
| `--fs-sm` | 13px | 1.18 | |
| `--fs-md` | 15px | 1.15 | body copy |
| `--fs-lg` | 17px | 1.13 | |
| `--fs-h4` | 19px | 1.12 | |
| `--fs-h3` | 24px | 1.263 | |
| `--fs-h2` | 32px | 1.333 | |
| `--fs-h1` | 44px | 1.375 | |
| `--fs-display` | 64px | 1.455 | large display heading |
| `--fs-hero` | 96px | 1.5 | extrapolated step continuing the scale's accelerating ratio past `display`; **no consumer today, by design** — it closes the jump to `mega` so the progression stays coherent, and is not dead API to prune |
| `--fs-mega` | 150px | 1.5625 | the approved brand manual's `.big-glyph` specimen |

Exposed in the Tailwind layer as `.text-xs`/`.text-sm`/`.text-md`/`.text-lg`/`.text-h4`/`.text-h3`/`.text-h2`/`.text-h1`/`.text-display`/`.text-hero`/`.text-mega` (`frameworks/tailwind/theme.css`, `--text-*`).
- **Spacing:** 4px base grid; generous rhythm in marketing (88px gutter), dense but breathable in product.
- **Backgrounds:** **always flat.** Arena **does not use color gradients** on any surface — not heroes, not splash screens, not cards, not accents. Depth is built with the surface scale (`base-100`→`base-200`→`base-300`), the hairline border and the warm shadow, never with color transitions. (The only permitted use of `linear-gradient`: the `Skeleton`'s neutral *shimmer* animation, which is loading motion, not chromatic decoration.) No generic stock photos; real product imagery or striped placeholders.
- **Borders:** hairline `1px` in `--color-base-300` (alias `--border`); emphasized border in `--line-strong`. The border, not the shadow, is used to separate content on flat surfaces.
- **Shadows:** warm and deep, negative spread (`0 12px 28px -12px rgba(0,0,0,.6)`). There is no tinted glow: elevation is always the neutral warm shadow.
- **Radii:** contained — buttons/inputs 6px, cards 14px, app tile 22%. `--r-2xl` (34px) is one step further, following the scale's own ratio (22→34 is ×1.55, in line with the tightest existing step) — the brand manual's splash-screen tile, a distinct role from `--r-xl`'s app icon tile. Nothing fully round except avatars and switches. **Floating overlays:** modals (Dialog, ConfirmDialog, CommandPalette, Onboarding) use `--r-lg` (14px); minor non-modal floating surfaces (Toast, Menu, BulkActionBar) use `--r-md` (10px). The rule: if it captures the whole screen with a scrim, `--r-lg`; if it's a bounded panel over the UI, `--r-md`.
- **Cards:** surface `--surface-card`, hairline border, 14px radius, no shadow in lists (border only) and `--shadow-2` when floating (menus, dialogs).
- **Animation:** `--ease-out` for entrances, `--ease-emphatic` for the "rotor" gesture — the brand's easing character, named for the mark's rotation. Transitions run 120/220/420ms (`dur`); a looping animation — `Spinner`, `ProgressBar`, `Skeleton` — runs on its own, slower scale measured in seconds (`loop`; see the motion scale table below), because it reports ongoing work rather than responding to an action. No excessive bounce.
- **`prefers-reduced-motion`:** every animation in the system answers it, and what it answers depends on what the motion *means*. Motion that reports work in progress **slows** (`Spinner`, `ProgressBar`, `Button`'s loading ring) — never freeze it, a stopped spinner reads as a hung process, which is the opposite of the truth. Purely decorative motion **stops** (`Skeleton`'s shimmer falls back to a flat surface). An entrance **keeps its fade and drops its travel** (`Dialog`, `Menu`): the movement is the vestibular trigger, the fade is the meaning. Opacity-only animations (`Tooltip`) need no clause — there is nothing to reduce.
- **Hover:** lighten the surface one step (`--color-base-300`→`--line-strong`) or raise opacity; on accent buttons, hover raises the general elevation (`--shadow-2`). *Note:* after the move to daisyUI tokens, the `--crimson-strong`/`--gold-strong`/`--danger-strong` variants **alias to the base color** (there's no separate darker "strong" tone); press emphasis is achieved with scale, not a second tone.
- **Press:** `scale(.98)` on small controls.
- **Focus:** gold ring `2px` with `2px` offset — always visible, never `outline:none` without a replacement.
- **Transparency/blur:** blur only on dialog overlays (`backdrop-filter: blur(6px)` over `rgba(20,16,16,.6)`).
- **Uppercase microcopy (H2/H6/H8):** reserve `text-transform:uppercase` + mono for **short microlabels** (≤2 words: eyebrows, field labels, status badges, table headers). **Messages, titles and any reading text go in normal case** — never uppercase sentences. Rule of thumb: if it doesn't fit in a "pill," it goes in normal case.
- **Navigate vs. filter (`Tabs` vs. `SegmentedControl`):** the two are told apart by **shape and accent, not by size**. `Tabs` changes the view: bare text on a hairline rule, stretched across the content, active marked by the **crimson underline**. `SegmentedControl` filters *within* the current view: an enclosed track that shrinks to its content, on the `--surface-input` surface that Input and Select wear, selection marked by a **neutral raised thumb** (`--line-strong` + `--shadow-1`) and **no crimson at all** — a filter does not spend the view's single primary accent, and the solid fill stays reserved for the primary action. They stack on purpose: tabs on top, the control beneath, filtering what the tab opened. A segmented control is **never** `role="tablist"` — it is a real radio group, since its options are mutually exclusive values, not destinations.
- **Single dismiss pattern (H4):** the icon dismiss always uses Phosphor `ph-x` (Tag, Toast). **Modals** (Dialog/ConfirmDialog) are closed with their **explicit button** (Cancel) or a click-outside where appropriate, not the icon; the two affordances are never mixed in the same component.
- **Component documentation (H10):** every `*.prompt.md` includes examples and, where it adds value, a **Do / Don't** section with the most common usage mistakes.

### Danger convention (destructive actions and risk indicators)
To tell **destructive / risk actions and indicators** apart from the primary action, Arena distinguishes them by **shape, not weight**: **transparent background** with the **border and all its content** (text and icons) in the semantic token **`--error`** (alias `--danger`). This way danger reads through color and never visually competes with the filled crimson primary button.
- **Applies to** every risk trigger or indicator: buttons (`.btn.danger`), icon buttons (`.iconbtn.danger`), menu items (`.mitem.danger`) and equivalents in lists, cards and toolbars. Hover: lightens with `--danger-soft`. Focus: `--error` ring.
- **Rule:** a **filled** danger button never appears as a trigger in the UI (lists, cards, toolbars). The solid fill is reserved by visual weight for the primary action (crimson).
- **Only exception — final irreversible confirmation:** inside a `ConfirmDialog`, the button for the final "point of no return" **is** filled — in `--danger-fill` (`--color-error-fill`) over `--color-error-content`, **not** in `--danger`. It's the only surface where danger is filled, precisely because it must not be confused with an ordinary action.
- **Danger is two reds, and they cannot be one.** `--danger` is read *as text* on the base surfaces, so it is tuned against them (lighter in dark, darker in light). That leaves it too light to carry white text, which is exactly what the filled confirmation needs — so the fill is its own token, tuned in the opposite direction. Collapsing them puts one of the two roles under WCAG AA; `bun scripts/check-text-contrast.mjs` gates both.
- **Specimen:** `guidelines/components-danger.html` (all three states side by side: filled primary · outline danger · filled final confirmation).
- **"Danger is outline" governs controls and surfaces, not presence or identity marks.** `Avatar`'s presence dot (online/busy/away/offline) is a different semantic family — a status taxonomy, like the chart `tone` colors, not a destructive affordance — and it is filled: `--color-success`, `--color-warning` and `--color-error` for the three live states, `--status-offline` for the fourth. An outline dot at that size (`max(8px, diameter * 0.28)`) would not read at all. The same carve-out covers any other small identifying dot at that size, filled via `currentColor` from a `tone`/status token: `Tag`'s leading dot and `ActivityFeed`'s per-row tone dot are both `bg-current`, and both fill with `text-error` for their danger tone — a tag or a feed row is naming *what kind of thing this is*, the same taxonomy Avatar's presence is, not asking to be read as a risk trigger. Nothing here contradicts the rule above: the rule is about *danger*, and a dot filled in `--color-error` at this size is identity/status borrowing the error hue for "this one," not a risk indicator.

### Layering (stacking order)
What covers what is a system-wide invariant, not a per-component choice, so it is a token family — `z` (`tokens/src/layering.json`, generated into `tokens/effects.css`) — rather than a literal chosen anew in each overlay component. **The family declares the order; the values only have to preserve it.** From least to most interruptible:

| Token | Value | Carried by |
|---|---|---|
| `--z-dropdown` | 900 | `Menu`, `Select`'s popover layer |
| `--z-tooltip` | 950 | `Tooltip` — above dropdown, so a tooltip on a menu item wins over the menu itself |
| `--z-modal` | 1000 | `Dialog` |
| `--z-modal-nested` | 1050 | `ConfirmDialog` — it opens *from* a `Dialog`, so it must sit above one |
| `--z-palette` | 1100 | `CommandPalette` |
| `--z-onboarding` | 1200 | `Onboarding`'s coachmark card |
| `--z-toast` | 1300 | `Toast` — floats above everything, including onboarding, because a transient notice raised by an action taken inside a dialog must stay visible |

`Onboarding`'s scrim is not a second token: it is one slot with two uses, so the relationship is expressed as a derivation at the point of use — `zIndex: 'calc(var(--z-onboarding) - 10)'` — rather than minted as its own step. That keeps "the scrim sits just under the coachmark" legible from the call site instead of requiring a reader to go find a second magic number nearby.

Before this family existed, layering was five magic numbers in five files, encoding no intent: `Menu` and `Tooltip` both sat at `900`, so a tooltip rendered on a menu item resolved by DOM order, not by design; `Dialog` and `ConfirmDialog` both sat at `1000`, and `ConfirmDialog` opens *from* a `Dialog`, so it worked only by accident of mount order; `Toast` — the one thing that must float above everything — declared no `z-index` at all.

Exposed in the Tailwind layer as `.z-dropdown` / `.z-tooltip` / `.z-modal` / `.z-modal-nested` / `.z-palette` / `.z-onboarding` / `.z-toast` (`frameworks/tailwind/theme.css`, `--z-index-*`). **A consumer embedding Arena inside an app that has its own stacking context should read this table rather than guess at a number**: Arena's overlay components render in place (none of the seven uses a React portal), so the global order above governs any of them mounted as siblings — but if the host app's own chrome (a nav bar, a modal from a different library) needs to interleave with Arena's, the host's own `z-index` values need to be chosen against this scale, not against whatever the host already had lying around. `display/Calendar.jsx`'s `zIndex: 1` is not part of this family — it is local stacking inside a positioned container, scoped entirely inside one component, and stays a hand-written literal.

### Control density type scale (`dz`)
Chrome text — a button label, an input's value, a hint, a validation error, a badge, a table cell — is governed by how dense the surrounding controls are, not by the prose scale (`fs`). `dz` already declared control heights, row padding and stack gap; it now carries its own five-step text scale, generated into `tokens/spacing.css` from `tokens/src/spacing.json` (base) and `tokens/src/density.compact.json` (the `.arena-compact` override):

| Token | Value | Compact (`.arena-compact`) | Role |
|---|---|---|---|
| `--dz-text` | 14px | 13px | control text — buttons, inputs, selects, menu items, table cells |
| `--dz-text-md` | 13px | 12px | secondary control text — tag chips, pagination, secondary buttons |
| `--dz-text-sm` | 12px | 11px | secondary control text — hints, validation errors, badges, legends |
| `--dz-text-xs` | 11px | 10px | micro control text — field labels, shortcuts, eyebrow labels |
| `--dz-text-2xs` | 10px | 10px | column headers, row micro-labels |

`--dz-text-2xs` does not shrink further in the compact scope: −1px would land it at 9px, the exact value the per-site census snapped away from elsewhere in the system as illegible drift, and reintroducing it as a systemic compact value would undo that call one layer down. Every other step follows the existing `−1px` precedent (`--dz-text` itself, 14→13).

`dz.cell` — a narrow name for the same "control text" role — is retired; every consumer reads `--dz-text` now. It carried the identical value in both density scopes, so nothing rendered moved.

Exposed in the Tailwind layer under a `ctl` infix — `--text-ctl` / `--text-ctl-md` / `--text-ctl-sm` / `--text-ctl-xs` / `--text-ctl-2xs` — because the natural `--text-*` keys already belong to `fs`, and two collide on value as well as name (`fs.sm` / `dz.text-md` are both 13px; `fs.xs` / `dz.text-xs` are both 11px). `--text-base`, the one `--text-*` key that pointed at `dz` under an `fs`-shaped name, is retired along with it.

### Tracking scale (`ls`)
Letter-spacing across the system was four declared tokens covering a handful of sites while 34 real uses read a scatter of undeclared literals. Sorted by value, those sites already formed a role hierarchy nobody had named — **tracking decreases as the text gets longer**, from the shortest mono micro-labels down through prose-adjacent chrome to the tightest display headings. The family below is that hierarchy, generated into `tokens/typography.css` from `tokens/src/typography.json`:

| Token | Value | Role |
|---|---|---|
| `--ls-tight` | `-0.02em` | display — tight headings |
| `--ls-normal` | `0` | no tracking — button labels, glyph pairs |
| `--ls-mono-nav` | `0.04em` | mono navigation — breadcrumbs, bulk-action counts |
| `--ls-uppercase-status` | `0.06em` | uppercase status text — alerts, toasts, calendar hour labels |
| `--ls-badge` | `0.1em` | badge and pill text |
| `--ls-column-header` | `0.12em` | column header / micro-label |
| `--ls-field-label` | `0.14em` | form field label |
| `--ls-label` | `0.22em` | mono uppercase labels — section eyebrows |
| `--ls-wide` | `0.34em` | eyebrows (`Arena - Overview.html`'s `.kicker`/`.eyebrow`) |

`ls` is a **semantic** family: a value used by only one component does not earn a step of its own, since there is nothing to derive a role from. Three singletons snap to the nearest existing step instead — `Button`'s `.01em` and `Avatar`'s `.02em` both land on `--ls-normal` (0), and `Menu`'s section-header `.16em` lands on `--ls-field-label` (.14). Avatar's `.02em` is an exact tie between `--ls-normal` and `--ls-mono-nav` (.02 from each); it resolves to `--ls-normal`, consistent with the hierarchy bottoming out at zero — a low-stakes call on a single pair of uppercase initials. Two accidental splits were corrected the same pass: `ChartCard` and `StatCard` rendered their eyebrow at `.2em` instead of the `.22em` every other eyebrow (`Card`, `Dialog`, `ConfirmDialog`, `Onboarding`) uses — one role, two values, 0.02 apart and invisible by eye — and three display titles (`Dialog`, `ConfirmDialog`, `Onboarding`) sat at `-.01em`, 0.01 off `--ls-tight`, serving the identical tight-heading role. Both corrections move rendered tracking to the token rather than adding a step for the drift.

Exposed in the Tailwind layer as `.tracking-tight` / `.tracking-normal` / `.tracking-mono-nav` / `.tracking-uppercase-status` / `.tracking-badge` / `.tracking-column-header` / `.tracking-field-label` / `.tracking-label` / `.tracking-wide` (`frameworks/tailwind/theme.css`, `--tracking-*`).

### Line-height scale (`lh` / `dz.lh`)
Line height splits editorial from control exactly the way `fs`/`dz` split font size. Prose that wraps needs breathing room between its own lines — that's `lh`, in `tokens/src/typography.json`. A box built around a single glyph — an icon inside a button, a standalone status icon, an icon-only close or remove control — needs the opposite: a line box that is *exactly* its glyph, so the extra space above and below a normal line height never throws the surrounding control out of alignment. That reset is a density/control concern, not an editorial one, so it lives in `dz` (`tokens/src/spacing.json`) alongside the rest of the control scale, carrying its own token-level `$type: "number"` override — a line height is unitless, unlike every other `dz` member.

| Token | Value | Role |
|---|---|---|
| `--lh-tight` | `0.98` | sub-1em — the tightest display headings |
| `--lh-snug` | `1.15` | snug prose — short labels and values that still wrap on occasion (`StatCard`'s value, `Radio`'s label, `Shell`'s person block) |
| `--lh-body` | `1.6` | prose — paragraphs, dialog and alert body copy, messages |
| `--dz-lh` | `1` | glyph-tight — the control reset; the box is exactly its glyph |

No new prose steps were needed to cover the census: every site that reads prose already matched `--lh-body` or `--lh-snug` exactly, or was within drift-correcting distance of one (`Alert`'s and `Textarea`'s `1.55`, 0.05 off `--lh-body`, corrected rather than kept as their own step).

Exposed in the Tailwind layer as `.leading-tight` / `.leading-snug` / `.leading-body` (`frameworks/tailwind/theme.css`, `--leading-*`). `--dz-lh` is exposed as `.leading-ctl`, not `.leading-none` — after this token, the `--leading-*` namespace holds three editorial steps (`tight`, `snug`, `body`) plus this one control token, and a name indistinguishable from its editorial neighbours is the exact `--text-base` mistake the `fs`/`dz` split retired: a `dz` token wearing an `lh`-shaped name. The `ctl` infix keeps it visibly a density role, consistent with `--text-ctl`.

### Motion scale (`dur` / `loop`)
Two families, one `$type: duration`, two roles that must not merge. `dur` is the transition scale: a response to an action, over in the low hundreds of milliseconds. `loop` is cyclical motion: it reports that work is *ongoing*, and is measured in seconds, not milliseconds — a spinner or an indeterminate progress sweep is not "responding" to anything, it is signaling that something is still running. Merging the two would repeat the `fs`/`dz` mistake the type scale already retired: one scale asked to carry two roles at once. Both live in `tokens/src/effects.json`, generated into `tokens/effects.css`.

| Token | Value | Role |
|---|---|---|
| `--dur-fast` | 120ms | micro-interactions — hover, press |
| `--dur-mid` | 220ms | most transitions — menus, tooltips, dialogs entering |
| `--dur-slow` | 420ms | larger surface changes |
| `--loop-spin` | 700ms | `Spinner`, and `Button`'s loading ring |
| `--loop-sweep` | 1150ms | `ProgressBar`'s indeterminate sweep |
| `--loop-shimmer` | 1400ms | `Skeleton` |
| `--loop-brand` | 8000ms | the brand mark's rotation — slow enough to read as presence rather than progress |
| `--loop-reduced` | 2400ms | what every working loop above slows to under `prefers-reduced-motion` |
| `--loop-brand-reduced` | 24000ms | the brand mark's reduced step — three times slower again, because that rotation is decoration that also happens to mean "alive" |

`prefers-reduced-motion` does not stop a working loop, it **slows** it: `--loop-reduced` (and the brand mark's own, three-times-slower `--loop-brand-reduced`) is that slowed step, never zero — a frozen spinner reads as a hung process, the opposite of what it exists to report. Purely decorative motion is the other case, and stops outright: `Skeleton`'s shimmer falls back to a flat surface, since there is nothing left to report once it stops.

Exposed in the Tailwind layer as an arbitrary value against each token — `duration-[var(--loop-spin)]` and so on — rather than as a named utility: Tailwind v4 has no duration namespace of its own for either family to extend.

## ICONOGRAPHY
- **Official set: [Phosphor Icons](https://phosphoricons.com)** (MIT license, free commercial use, no attribution). Chosen for aligning with Dravensoft's bold identity: it's the open-source family with the widest style range (1,500+ icons in 6 weights) and its **Bold** weight has the presence and high contrast the brand calls for — the icon equivalent of Archivo Black.
- **Weights and use:**
  - **Bold** (`.ph-bold`) — default weight across the UI. Presence and legibility at high contrast.
  - **Fill** (`.ph-fill`) — active/selected state (e.g. the active navigation item, a toggle that's on).
  - **Duotone** (`.ph-duotone`) — only to highlight features/onboarding, with the crimson accent on the primary layer. Premium two-tone effect; use sparingly.
- **Loading (default — install the package):** install `@phosphor-icons/web` and import its weight stylesheets, or `@phosphor-icons/react` (`<Rocket weight="bold"/>`), then apply the weight class plus the icon class: `<i class="ph-bold ph-rocket-launch"></i>`. **Prototype-only:** the CDN, e.g. `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css`.
- **Sizes** — a token family, `icon` (`tokens/src/icon.json`, generated into `tokens/spacing.css`), applied via `fontSize` since Phosphor renders as a webfont:

  | Token | Value | Role |
  |---|---|---|
  | `--icon-sm` | 14px | compact inline glyph — a remove/status icon beside dense chrome |
  | `--icon-md` | 16px | default inline control icon — close buttons, chevrons, list-item icons |
  | `--icon-lg` | 18px | prominent standalone icon — a tone icon, a search glyph |
  | `--icon-xl` | 34px | illustration-scale icon — `EmptyState`, `ErrorState` |

  A glyph rendered as a webfont is still an icon, not type — an icon at 15px beside a label at 15px is not the same design decision as an icon at 16px — so these stay out of the `fs` scale. Exposed in the Tailwind layer under `--size-*`, not `--text-*`: `.size-icon-md` sets both width and height, since an icon is a size, not a font size. Color: inherits `currentColor`; accent only when interactive/active.
- **Do not** override `font-family/weight/style` on `.ph-*` classes (breaks the glyphs).
- **No emoji.** No arbitrary unicode as an icon. The **Rotor** (`assets/rotor-*.svg`) is brand, not a UI icon: don't use it as a functional glyph, and Arena ships no component that wraps it — the lock-up is `AppLogo`, which takes the mark as its `mark` node.
- *Migration note:* the `console/Icon.jsx` UI kit uses its own stroke-style SVGs as a bridge; the official reference for new product work is Phosphor.

---

## Theming

Arena's identity lives in **shape**, not in its hexes. Crimson and gold are Dravensoft's skin; a different product can wear a different one and still be unmistakably Arena. This was always true of the architecture — it was never declared. It is now.

**The public swap surface is `tokens/src/palette.dark.json` and `tokens/src/palette.light.json`: the `--color-*` set plus `--color-cat-*`.** Everything else derives. Swap those two files, run `bun run build:tokens`, and the whole system follows: the generated `tokens/palette.css` re-emits, the aliases in `tokens/colors.css` (`--bg`, `--crimson`, `--danger`, `--mute`…) re-point, the muted text levels re-derive through `color-mix`, and every component re-colors, because components read tokens and never hold a value of their own.

### The layer contract

**Standardized (the DTCG layer).** Every token *value* — colors, dimensions, font
attributes, durations, easings, shadows — is authored once in `tokens/src/**/*.json` as
strictly-conformant DTCG 2025.10, the platform-neutral contract. A new framework target
consumes that JSON directly, or through a Style Dictionary platform emitting CSS, JS,
iOS, Android or SCSS. Nothing in it is Arena-specific, and
`bun scripts/check-dtcg.mjs` proves it conforms.

**Per-platform (the composition layer).** Two things DTCG deliberately does not model,
and that therefore live in each platform's own idiom:

1. **Runtime color derivations** — the muted-text levels and `*-soft` accents, expressed
   in CSS as `color-mix(in oklab, var(--…) N%, transparent)` so they re-derive when the
   skin swaps. In CSS they live in the hand-authored `tokens/colors.css`. A new framework
   rebuilds this thin layer in its idiom (Tailwind `color-mix` utilities, a JS token
   helper) **on top of the same standard values** — it never re-defines a value.
2. **`@font-face` bundling** — generated by `scripts/fetch-fonts.mjs` into
   `tokens/fonts.css`, pointing at the self-hosted `assets/fonts/` binaries.

The dividing line: **DTCG owns values; the composition layer owns how values are combined
at runtime.** `tokens/colors.css` therefore holds no skin value — only references
(`var(--color-primary)`) and `color-mix` compositions. The full `$type` table is
`tokens/src/TYPE-MAP.md`.

**A swap is not done until it is measured**, and two scripts measure it. `bun scripts/check-ramp.mjs` holds the categorical ramp; `bun scripts/check-text-contrast.mjs` holds the text: the levels derived from `--color-base-content`, every `--color-*` / `--color-*-content` pair (all seven, at 4.5:1 — the pair is the contract a skin defines, so an illegible one fails before a component can inherit it), and the accents painted straight onto the base surfaces (`--color-error` as the danger outline). Both read the values out of `palette.css` and hardcode nothing, so a new skin is one edit and two commands away from a real answer.

Two of these numbers the scripts **report without gating**: crimson as text sits at 2.80:1 on the dark card, gold as text at 2.24:1 on the light one. Both are below AA and both are deliberate today — they are the brand, and a gate there would not tighten a token but repaint Dravensoft. Use them as fills or on the theme that carries them, and reach for `--text-strong` when the job is reading text.

| Invariant — this *is* Arena | Skin — yours to change |
|---|---|
| Danger is outline, never filled (one exception: `ConfirmDialog`'s final confirmation) | Crimson (`--color-primary`) |
| No gradients on any surface (one exception: `Skeleton`'s shimmer) | Gold (`--color-secondary`) |
| The `base-100`→`base-200`→`base-300` surface scale | The warm-black base values |
| The hairline border, and the warm shadow scale | The status hues |
| The type scale, the three families, the uppercase-microlabel rule | The 8 categorical slots |
| Identity vs meaning; one axis in charts; the ramp is never cycled | |

### The categorical ramp

Eight slots for colouring N arbitrary entities — chart series, calendar events, any set where the color answers *which thing*. Authored per theme, **fixed order, never cycled**. A ninth entity folds to "Other", small multiples, or direct labels — never a generated hue. The slots carry **identity only**; when a series *is* a state, a chart's `tone` prop uses the status colors instead.

The ramp is one system with one entry point: `catColor(slot)` in `frameworks/react/components/charts/chart-internals.js`. `Calendar` reads it from there rather than keeping its own copy — two clamps over one ramp is how a ramp stops being a ramp.

Where a component has no `tone` escape hatch, **state goes on a non-chromatic channel**: a `Calendar` event marks itself cancelled with a strikethrough or a dashed border, never by turning `--danger`. An entity painted a status color while its neighbours carry identity colors makes the palette mean two things at once, and the reader cannot tell which.

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

**Measured — both themes clear every hard gate, with no relief rule:**

| Gate | Dark | Light | Bar |
|---|---|---|---|
| CVD separation (adjacent, OKLab ΔE×100) | 13.3 | 16.4 | target ≥ 8 |
| Normal-vision floor | 20.5 | 22.1 | hard floor ≥ 15 |
| Contrast vs surface | all 8 ≥ 3:1 | all 8 ≥ 3:1 | ≥ 3:1 |
| Lightness band | all inside | all inside | per-mode band |
| Chroma floor | all ≥ 0.1 | all ≥ 0.1 | ≥ 0.10 |

**Brand clearance** (ΔE to the ramp's closest slot): crimson 17.0, gold 18.0, error 19.6, warning 26.3 — all above the 15 bar. That was the goal: the ramp cannot be mistaken for the brand or for an error.

**Accepted collision:** success 6.0, info 7.8. This is structural. Eight slots need ~126° of arc; banning the red family leaves green/cyan/blue/violet — exactly where success (156°) and info (250°) live — and guarding those as hard as the brand leaves only ~76°. **A ramp can be clear of the brand or clear of status, not both.** Clear of the brand is the right choice: brand colors carry identity everywhere, while status colors always ship with an icon and a label (`Alert`, `Toast`, `Badge`) and never appear as a bare fill.

### Re-check after you swap

The promise above is only worth the validator that backs it. After changing anything in `tokens/src/`, rebuild (`bun run build:tokens`) and then:

```bash
bun scripts/check-ramp.mjs
```

It reads the ramp straight out of `palette.css`, which the build regenerates from the DTCG source, measures both themes against their real surfaces, and exits non-zero on any failure — **including** the warnings the upstream validator tolerates, because Arena's shipped ramp needs no relief rule and neither should yours. Do not trust your eye here; nobody's eye simulates deuteranopia.

## Index / manifest
- `styles.css` — global entry point (only @imports). Consumers link this file.
- `tokens/` — `src/` (the DTCG 2025.10 source of every token value, plus `TYPE-MAP.md`), then the CSS: `fonts.css` (generated by `fetch-fonts.mjs`), `palette.css`, `typography.css`, `spacing.css`, `effects.css` (all four generated by `build-tokens.mjs` — do not edit), and `colors.css` (hand-authored: aliases and `color-mix` derivations).
- `frameworks/react/use-container-width.js` — shared `useContainerWidth` hook and `readBreakpoint`; responsive components import it. `frameworks/react/tokens.generated.js` — design values JavaScript reads as numbers rather than through CSS; generated from `tokens/src/`, so never edit it. `theme.js` — theme toggle helper. `frameworks/react/vendor/` — a committed, generated CommonJS→ESM bundle of React for the demo pages' importmap (`build-vendor.mjs`); every component `.jsx` and demo `.entry.jsx` has a compiled `.js` sibling the pages actually load (`build-demos.mjs`, `check:demos`).
- `scripts/` — `validate-palette.mjs` (the data-viz palette validator, vendored), `check-ramp.mjs` (asserts the shipped ramp clears every gate in both themes), `check-text-contrast.mjs` (measures every text level against the real surfaces in both themes) and `check-release.mjs` (asserts the version, the marketplace `ref` and the tag agree, and that the pinned tag actually hands out the version being advertised), `build-tokens.mjs` (generates the four token CSS files from `tokens/src/`), `check-dtcg.mjs` (asserts the DTCG source conforms to 2025.10), `check-tokens-generated.mjs` (asserts the committed CSS matches the source) and `serve.mjs` (`bun run demos`).
- `assets/` — `rotor-crimson/bone/ink.svg`, `app-icon.svg`, and `fonts/` (the bundled self-hosted `.woff2` binaries).
- `guidelines/` — specimen cards (`@dsCard`): typography (`type-display`, `type-body`, `type-mono`), color (`colors-neutrals`, `colors-accents`, `colors-status`, `colors-categorical`), spacing (`spacing-scale`, `spacing-density`), effects (`effects-radius`, `effects-shadow`), iconography (`icons`), brand (`brand-logo`) and the **danger convention** (`components-danger`).
- `frameworks/react/components/` — React primitives: `forms/` (Button, IconButton, Input, Textarea, Select, Checkbox, Radio/RadioGroup, Switch, ThemeToggle), `display/` (Card, Badge, Tag, Avatar, Table, Skeleton, StatCard, Calendar, ActivityFeed, UnauthCard), `navigation/` (Tabs, SegmentedControl, Breadcrumbs, Menu, Pagination, CommandPalette, BulkActionBar, PageHead, SideNav), `feedback/` (Alert, Dialog, ConfirmDialog, Toast, Tooltip, EmptyState, ErrorState, ProgressBar, Onboarding, Spinner), `charts/` (ChartCard, BarChart, LineChart, DoughnutChart — dependency-free SVG), `brand/` (AppLogo).
- `frameworks/react/ui_kits/console/` — recreation of the Delivery Console (an example internal product).
- `Arena - Overview.html` (repo root) — the token language, generated at runtime from `tokens/src/` and `tokens/colors.css`. Serve it: `bun run demos`.
- `Dravensoft Identity.dc.html` (repo root) — the approved identity manual. It sits at the root because it loads `support.js`, `styles.css` and `assets/` by relative path.
- `SKILL.md` — plugin-root Agent Skill (also usable standalone).
- `.claude-plugin/` — Claude Code plugin manifest (`plugin.json`) and marketplace catalog (`marketplace.json`).
- `CHANGELOG.md` — version history.

### Framework layers (`frameworks/`)

Arena's pure design language — `tokens/`, `guidelines/`, `assets/`, `scripts/`,
`styles.css` — lives at the repo root and is framework-agnostic. Everything
framework-bound lives under `frameworks/`, so a new framework is added without
touching the language:

- `frameworks/react/` — the React primitives, the example Console app, and the
  `useContainerWidth` hook.
- `frameworks/angular/` — the Angular layer, for an existing Angular
  20+/Tailwind-v4/Material app. Two kinds of artifact: a bridge that makes the
  host app wear Arena — `theme/arena-tailwind.css` (the shared `@theme` preset
  in scope), `theme/arena-material.css` (Arena tokens mapped onto Material's
  `--mat-*` vars),
  `icons/icon-manifest.ts` (the Phosphor role→glyph map) and
  `theme/theme-service.ts` + `theme/no-fouc.html` (the dark-first signal theme
  service and its pre-paint snippet) — and token-styled primitives Material
  doesn't provide, each a quartet (`<name>.ts`, `<name>.variants.ts`,
  `<name>.prompt.md`, a barrel) under `primitives/`, with `tag` as the
  reference shape. See `frameworks/angular/README.md` for the layer and
  `frameworks/angular/ADOPTION.md` for the step-by-step adoption playbook.
- `frameworks/tailwind/` — a **shared**, token-derived Tailwind v4 layer (a
  `@theme` preset + per-component class/variant manifests). It is authored once,
  not per framework, because the token→utility mapping is pure CSS and a
  component's Tailwind recipe is data. It derives every utility from an existing
  token and introduces no new value.

Pick the layer you need: raw tokens, a framework's primitives, or the Tailwind
layer on top.

## Intentional additions
- **Consistency tokens (shipped in v1.0.0):** `--danger-strong` (symmetric to `--crimson-strong`/`--gold-strong`) and `--scrim`/`--scrim-blur` (unified modal backdrop, in `tokens/effects.css`). With these, no hardcoded colors (`#fff`, `rgba(20,16,16,.6)`) remain in the components: everything goes through a token, including `--on-accent`. *Current status:* after the migration to daisyUI tokens, the `*-strong` variants **alias to their accent's base color**; they're kept as an extension point in case a theme defines a distinct pressed tone.
- **`AppLogo`** (brand) — the lock-up: a mark paired with a product name, at four steps
  of the `--logo-*` scale. It exists because two screens assembled the same figure by
  hand and one of them got it wrong — a crimson mark beside an undivided `DRAVENSOFT`,
  which is half of the manual's Primary variant and half of its Monochrome one. Nothing
  defaults: Arena ships MIT, so a component that rendered Dravensoft's mark when passed
  nothing would ship someone else's trademark by omission.
- **`SideNav`** (navigation) — the sidebar's navigation list, and only the list. Every
  product with a session has one, and the second product to need one would otherwise
  write a different one: the two would disagree about the active state's colour, the
  icon's size, and whether an item is a link or a button. An item with `href` renders an
  anchor; without one, a button.
- **`ActivityFeed`** (display) — the event feed. It holds the grammar (someone did
  something to something, then) and the typography each part takes, with `renderItem`
  as the escape hatch for the event that does not fit — the same shape `Table` gives
  through `columns[].render`.
- **`UnauthCard`** (display) — the panel a signed-out screen needs. A frame, not a form:
  it knows nothing about credentials, which is what lets one component serve sign-in,
  "check your inbox", "this link expired" and two-factor entry. It renders `Card`
  internally and does not centre itself — the product owns the page.
- **Phosphor Icons iconography** — set adopted in the absence of one in the identity; Bold weight as the default (see the ICONOGRAPHY section).
- **Remediation components** (following the Nielsen heuristic audit):
  - *Review 2 (severity 3):* `ConfirmDialog` (destructive action confirmation, H3/H5), `EmptyState` and `ErrorState` (recovery, H9), `CommandPalette` (⌘K accelerator, H7), `Toast.action` and `Input` with validation (H5, H9).
  - *Review 3 (severity 2):* `Skeleton` (async loading) and `Toast persist` (H1), `Breadcrumbs` (H3), `Switch confirm`/`onRequestChange` (H5), `IconButton showLabel` (H6), `BulkActionBar` and **density tokens** (`--dz-*` + `.arena-compact` scope) (H7), `--mute-2` recalibrated for AA **in the dark theme only** — the light theme was never re-measured and sat at 3.46:1, below the 4.5:1 bar; the level was removed in 2.0.0 (H8) — and guided `Onboarding` (H10).
  - *Review 4 (severity 1):* determinate `ProgressBar` (H1); **unified dismiss** with Phosphor `ph-x` on Tag/Toast (H4); **Badge tone taxonomy** clarified — status vs. emphasis — (H4/H8); **uppercase microcopy** guidance (H2/H6/H8) and the **Do/Don't** convention in every component's docs (H10). With this, no findings of severity ≥1 remain; the current maximum severity is 0.
- **No `AppShell`, decided rather than deferred.** The application frame is the largest
  component a library of this kind can hold and its boundary is the blurriest: every
  product wants one more slot, and it accretes props until it is a configuration
  language. The frame stays the product's to compose from small pieces —
  `AppLogo`, `SideNav`, `PageHead` — and everything Arena ships stays a piece, not a page.
