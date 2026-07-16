# Arena — Dravensoft Design System

**Version 1.0.0** · MIT License · Dark-first React + CSS-token design system. See [`CHANGELOG.md`](./CHANGELOG.md).

**Arena** is the single interface language under which every Dravensoft software product is built. It takes its name from the venue where a performance is put on display and applauded: every Arena interface should feel *worthy of being exalted* — the same promise the brand makes.

## Getting started
Arena is distributed as a **copy-in reference kit** — and as a downloadable Agent Skill (`SKILL.md`) — not as an npm package. To use it in a project:

1. **Copy** `tokens/`, `assets/` and `styles.css` into your app (e.g. under `/arena`).
2. **Link the entry point.** `styles.css` only `@import`s the token files, exposing every design token as a CSS custom property (`--color-*`, `--font-*`, `--r-*`, `--shadow-*`, …) and loading the fonts:
   ```html
   <link rel="stylesheet" href="/arena/styles.css" />
   ```
3. **Pick the theme.** Dark is the default (`:root`). Add `class="arena-light"` on `<html>` for the warm light theme, or wire the built-in toggle with `theme.js`.
4. **Use the components.** Copy the `.jsx` files you need from `components/` and import them:
   ```jsx
   import { Button } from './components/forms/Button.jsx';

   <Button variant="primary" size="md">Deploy</Button>
   ```
   Every component ships a `.d.ts` (types) and a `.prompt.md` (usage, examples, Do/Don't).

### How components are styled
Components render with **inline `style` objects that read the CSS custom properties** (e.g. `background: 'var(--crimson)'`). They do **not** expose utility classes — there is no `class="btn"`. `styles.css` provides only the token variables and fonts; all component logic lives in the `.jsx`. This keeps each component self-contained and fully themeable: change a token and every component follows.

### Dependencies
- **Fonts — Google Fonts (CDN).** `tokens/fonts.css` `@import`s Archivo, Familjen Grotesk and Spline Sans Mono. To self-host, replace that `@import` with `@font-face` rules and local files.
- **Icons — [Phosphor Icons](https://phosphoricons.com) (MIT).** Not bundled. Load the webfont from CDN for prototypes (`@phosphor-icons/web`), or install `@phosphor-icons/react` for production. See the [ICONOGRAPHY](#iconography) section.
- **React** — the primitives in `components/` are React (JSX). Tokens, guidelines and assets are framework-agnostic and can be used without React.

## Audience and scope
- **Audience of the language: general public.** Arena is meant to give identity to **every kind of Dravensoft software**, regardless of who the end user is — from consumer apps to internal tools. Its foundations (color, typography, spacing, accessibility, voice) are general-purpose and don't assume a technical profile.
- **The Overview (`reference/Arena - Overview.dc.html`) is an example application**, not the language itself. It illustrates Arena applied to the **Delivery Console, a product aimed at developers/technical teams**. That's why it includes data density, domain terminology (build, deploy, p95) and keyboard accelerators specific to that audience.
- **Implication for audits and evaluations:** findings observed on the example should be split into (a) those that apply to the **language** (tokens, components, patterns — universal) and (b) those specific to the **example's technical context** (jargon, density, shortcuts). The latter are not defects of the language: in a product for a general audience they would be replaced with plain copy, comfortable density and fewer shortcuts. When evaluating Arena for another kind of software, calibrate against that general audience, not against the Console.

## Why a language of our own (and not Material/Fluent as-is)
Established systems (Material 3, Fluent, Carbon, Polaris) are **light-by-default, rounded and neutral in tone**. Dravensoft's identity is the opposite: **dominant warm black, crimson/gold accents, sharp geometry and a bold voice**. Forcing the brand onto Material would produce a "generic with a skin" app. Instead, Arena:
- **Adopts proven structural principles**: token discipline and a typographic scale (Carbon/IBM-inspired), clear states and density (Material-inspired), visible and accessible focus.
- **Rewrites the aesthetic decisions** for the identity: dark-first, contained radii, deep warm shadows, crimson as the voice and gold as distinction, and the **Rotor** as the signature mark.

## Sources
- Approved identity manual: `reference/Dravensoft Identity.dc.html`.
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
- **Color — token architecture (daisyUI structure):** the source of truth is a set of `--color-*` tokens paired with their `-content` counterpart (the legible color on top), defined in `tokens/colors.css`. On top of them, a **compatibility layer** maps Arena's legacy aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) to the daisyUI tokens, so existing components don't break. Muted text levels (`--bone-dim`, `--mute`, `--mute-2`) are derived from `--color-base-content` with `color-mix`, not fixed hex values.
- **Themes:** the language is **dark-first** but supports two switchable themes — **dark** (`:root`, default) and **light** (`.arena-light`, warm inverse). The same tokens change value per theme; components are never rewritten. (The Overview includes the toggle in its header.)
- **Key values:** warm black background `#141010` (base-100); elevated surfaces `#1d1715` (base-200) / `#241c19` (base-300); bone text `#f3ede5` (base-content). A single primary accent (crimson `#b52a20`) per view; gold `#c5a059` reserved for focus, distinction and highlighted data. At most one dominant accent per screen.
- **Typography:** Archivo (display/headlines, 800–900), Familjen Grotesk (body, 400–600), Spline Sans Mono (data, labels, code). Negative tracking on display (`-0.02em`), wide tracking on mono labels (`0.22em`).
- **Spacing:** 4px base grid; generous rhythm in marketing (88px gutter), dense but breathable in product.
- **Backgrounds:** **always flat.** Arena **does not use color gradients** on any surface — not heroes, not splash screens, not cards, not accents. Depth is built with the surface scale (`base-100`→`base-200`→`base-300`), the hairline border and the warm shadow, never with color transitions. (The only permitted use of `linear-gradient`: the `Skeleton`'s neutral *shimmer* animation, which is loading motion, not chromatic decoration.) No generic stock photos; real product imagery or striped placeholders.
- **Borders:** hairline `1px` `#241c19` (token `--color-base-300`); emphasized border `#2c221e` (token `--line-strong`). The border, not the shadow, is used to separate content on flat surfaces.
- **Shadows:** warm and deep, negative spread (`0 12px 28px -12px rgba(0,0,0,.6)`). Crimson glow only for the app icon / floating CTAs.
- **Radii:** contained — buttons/inputs 6px, cards 14px, app tile 22%. Nothing fully round except avatars and switches. **Floating overlays:** modals (Dialog, ConfirmDialog, CommandPalette, Onboarding) use `--r-lg` (14px); minor non-modal floating surfaces (Toast, Menu, BulkActionBar) use `--r-md` (10px). The rule: if it captures the whole screen with a scrim, `--r-lg`; if it's a bounded panel over the UI, `--r-md`.
- **Cards:** surface `#1d1715`, hairline border, 14px radius, no shadow in lists (border only) and `--shadow-2` when floating (menus, dialogs).
- **Animation:** `--ease-out` for entrances, `--ease-emphatic` for the "rotor" gesture (spin on load). Durations 120/220/420ms. No excessive bounce.
- **Hover:** lighten the surface one step (`#241c19`→`#2c221e`) or raise opacity; on accent buttons, hover adds the crimson glow (`--glow-accent`). *Note:* after the move to daisyUI tokens, the `--crimson-strong`/`--gold-strong`/`--danger-strong` variants **alias to the base color** (there's no separate darker "strong" tone); press emphasis is achieved with scale, not a second tone.
- **Press:** `scale(.98)` on small controls.
- **Focus:** gold ring `2px` with `2px` offset — always visible, never `outline:none` without a replacement.
- **Transparency/blur:** blur only on dialog overlays (`backdrop-filter: blur(6px)` over `rgba(20,16,16,.6)`).
- **Uppercase microcopy (H2/H6/H8):** reserve `text-transform:uppercase` + mono for **short microlabels** (≤2 words: eyebrows, field labels, status badges, table headers). **Messages, titles and any reading text go in normal case** — never uppercase sentences. Rule of thumb: if it doesn't fit in a "pill," it goes in normal case.
- **Single dismiss pattern (H4):** the icon dismiss always uses Phosphor `ph-x` (Tag, Toast). **Modals** (Dialog/ConfirmDialog) are closed with their **explicit button** (Cancel) or a click-outside where appropriate, not the icon; the two affordances are never mixed in the same component.
- **Component documentation (H10):** every `*.prompt.md` includes examples and, where it adds value, a **Do / Don't** section with the most common usage mistakes.

### Danger convention (destructive actions and risk indicators)
To tell **destructive / risk actions and indicators** apart from the primary action, Arena distinguishes them by **shape, not weight**: **transparent background** with the **border and all its content** (text and icons) in the semantic token **`--error`** (alias `--danger`). This way danger reads through color and never visually competes with the filled crimson primary button.
- **Applies to** every risk trigger or indicator: buttons (`.btn.danger`), icon buttons (`.iconbtn.danger`), menu items (`.mitem.danger`) and equivalents in lists, cards and toolbars. Hover: lightens with `--danger-soft`. Focus: `--error` ring.
- **Rule:** a **filled** danger button never appears as a trigger in the UI (lists, cards, toolbars). The solid fill is reserved by visual weight for the primary action (crimson).
- **Only exception — final irreversible confirmation:** inside a `ConfirmDialog`, the button for the final "point of no return" **is** filled in `--error` over `--color-error-content`. It's the only surface where danger is filled, precisely because it must not be confused with an ordinary action.
- **Specimen:** `guidelines/components-danger.html` (all three states side by side: filled primary · outline danger · filled final confirmation).

## ICONOGRAPHY
- **Official set: [Phosphor Icons](https://phosphoricons.com)** (MIT license, free commercial use, no attribution). Chosen for aligning with Dravensoft's bold identity: it's the open-source family with the widest style range (1,500+ icons in 6 weights) and its **Bold** weight has the presence and high contrast the brand calls for — the icon equivalent of Archivo Black.
- **Weights and use:**
  - **Bold** (`.ph-bold`) — default weight across the UI. Presence and legibility at high contrast.
  - **Fill** (`.ph-fill`) — active/selected state (e.g. the active navigation item, a toggle that's on).
  - **Duotone** (`.ph-duotone`) — only to highlight features/onboarding, with the crimson accent on the primary layer. Premium two-tone effect; use sparingly.
- **Loading (CDN):** link the stylesheet for each weight used, e.g. `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css`, and apply the weight class plus the icon class: `<i class="ph-bold ph-rocket-launch"></i>`. Production: install `@phosphor-icons/react` (`<Rocket weight="bold"/>`).
- Sizes: 16 / 20 / 24 px (via `font-size`). Color: inherits `currentColor`; accent only when interactive/active.
- **Do not** override `font-family/weight/style` on `.ph-*` classes (breaks the glyphs).
- **No emoji.** No arbitrary unicode as an icon. The **Rotor** (`assets/rotor-*.svg`) is brand, not a UI icon: don't use it as a functional glyph.
- *Migration note:* the `console/Icon.jsx` UI kit uses its own stroke-style SVGs as a bridge; the official reference for new product work is Phosphor.

---

## Index / manifest
- `styles.css` — global entry point (only @imports). Consumers link this file.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`.
- `assets/` — `rotor-crimson/bone/ink.svg`, `app-icon.svg`.
- `guidelines/` — specimen cards (`@dsCard`): typography (`type-display`, `type-body`, `type-mono`), color (`colors-neutrals`, `colors-accents`, `colors-status`), spacing (`spacing-scale`), effects (`effects-radius`, `effects-shadow`), iconography (`icons`), brand (`brand-logo`, `brand-rotor`) and the **danger convention** (`components-danger`).
- `components/` — React primitives: `forms/` (Button, IconButton, Input, Textarea, Select, Checkbox, Radio/RadioGroup, Switch), `display/` (Card, Badge, Tag, Avatar, Table, Skeleton), `navigation/` (Tabs, Breadcrumbs, Menu, Pagination, CommandPalette, BulkActionBar), `feedback/` (Alert, Dialog, ConfirmDialog, Toast, Tooltip, EmptyState, ErrorState, ProgressBar, Onboarding), `brand/` (Rotor).
- `ui_kits/console/` — recreation of the Delivery Console (an example internal product).
- `reference/` — brand source material: the approved identity manual (`Dravensoft Identity.dc.html`) and the example Overview app (`Arena - Overview.dc.html`).
- `SKILL.md` — for use as a downloadable Agent Skill.
- `CHANGELOG.md` — version history.

## Intentional additions
- **Consistency tokens (shipped in v1.0.0):** `--danger-strong` (symmetric to `--crimson-strong`/`--gold-strong`) and `--scrim`/`--scrim-blur` (unified modal backdrop, in `tokens/effects.css`). With these, no hardcoded colors (`#fff`, `rgba(20,16,16,.6)`) remain in the components: everything goes through a token, including `--on-accent`. *Current status:* after the migration to daisyUI tokens, the `*-strong` variants **alias to their accent's base color**; they're kept as an extension point in case a theme defines a distinct pressed tone.
- **Rotor** (brand component) — wrapper around the symbol for splash/loading states; it doesn't exist as a "component" in the identity but is needed for product.
- **Phosphor Icons iconography** — set adopted in the absence of one in the identity; Bold weight as the default (see the ICONOGRAPHY section).
- **Remediation components** (following the Nielsen heuristic audit):
  - *Review 2 (severity 3):* `ConfirmDialog` (destructive action confirmation, H3/H5), `EmptyState` and `ErrorState` (recovery, H9), `CommandPalette` (⌘K accelerator, H7), `Toast.action` and `Input` with validation (H5, H9).
  - *Review 3 (severity 2):* `Skeleton` (async loading) and `Toast persist` (H1), `Breadcrumbs` (H3), `Switch confirm`/`onRequestChange` (H5), `IconButton showLabel` (H6), `BulkActionBar` and **density tokens** (`--dz-*` + `.arena-compact` scope) (H7), `--mute-2` recalibrated to **WCAG AA** contrast (H8) and guided `Onboarding` (H10).
  - *Review 4 (severity 1):* determinate `ProgressBar` (H1); **unified dismiss** with Phosphor `ph-x` on Tag/Toast (H4); **Badge tone taxonomy** clarified — status vs. emphasis — (H4/H8); **uppercase microcopy** guidance (H2/H6/H8) and the **Do/Don't** convention in every component's docs (H10). With this, no findings of severity ≥1 remain; the current maximum severity is 0.
