# Arena — Angular layer

Arena support for an Angular 20+/Tailwind-v4 app. Two kinds of artifact:

**Bridge (foundation) — make an existing Angular/Material app wear Arena:**
- `theme/arena-tailwind.css` — one import that brings Arena's tokens (including
  the self-hosted fonts declared in `tokens/fonts.css`, binaries in `assets/fonts/`)
  + the shared `frameworks/tailwind/theme.css` `@theme` preset into scope.
- `theme/arena-material.css` — maps Arena tokens onto Angular Material's
  `--mdc-*` / `--mat-*` vars so every Material control renders in Arena. What it covers:
  buttons (filled, outlined, and an outline-only `arena-danger`), the outlined form
  field, cards, dialogs, tables, tabs, the snackbar, spinner/progress-bar, and
  **SideNav** — `mat-nav-list` with `<a mat-list-item [activated]>`. **Most of that
  coverage is currently inert against Angular Material 22 — read
  [Known issue](#known-issue--most-of-the-material-bridge-is-currently-inert) before
  adopting it.** SideNav is the
  one component of its spec that stays a Material bridge rather than becoming an
  `arena-*` primitive: `mat-nav-list` already handles the anchor-or-button
  distinction, the active state and the keyboard behaviour, so reimplementing it
  would duplicate hardened accessibility. Its active-item styling
  (crimson on crimson-soft, semibold) comes from the `.arena-side-nav` rules in
  `arena-material.css`:
  ```html
  <mat-nav-list class="arena-side-nav" aria-label="Primary">
    <a mat-list-item href="/overview" [activated]="section === 'overview'"
       [attr.aria-current]="section === 'overview' ? 'page' : null">Overview</a>
    <a mat-list-item href="/projects" [activated]="section === 'projects'"
       [attr.aria-current]="section === 'projects' ? 'page' : null">Projects</a>
  </mat-nav-list>
  ```
  `[activated]` is Material's visual state; `aria-current="page"` is the one a screen
  reader announces. Both are required — set only `[activated]`, and the visual state
  and the announced one disagree.
- `icons/icon-manifest.ts` — canonical Phosphor role→glyph map.
- `theme/theme-service.ts` + `theme/no-fouc.html` — dark-first signal theme
  service (light = `.arena-light`) and the pre-paint snippet.

**Primitives — token-styled components Material does not provide.** Each is a
quartet: `<name>.ts` (standalone, `OnPush`, signal I/O, `arena-` selector),
`<name>.variants.ts` (a `tailwind-variants` recipe built with the shared `tv`),
`<name>.prompt.md` (usage + Do/Don't), and a barrel. `primitives/tag/` is the
reference shape.

The layer ships **21 primitives**: `activity-feed`, `alert`, `app-logo`, `avatar`,
`bar-chart`, `breadcrumbs`, `bulk-action-bar`, `chart-card`, `command-palette`,
`confirm-dialog`, `doughnut-chart`, `empty-state`, `error-state`, `line-chart`,
`onboarding`, `page-head`, `skeleton`, `stat-card`, `tag`, `theme-toggle`,
`unauth-card`.

**`SideNav` is not among them, and that is the rule working.** Material's `mat-nav-list`
covers the item list, so Arena dresses it in `arena-material.css` (`.arena-side-nav`)
rather than reimplementing it. Its Tailwind manifest is future work, for consumers on
neither React nor Material.

**The three SVG charts are the declared exception**, and a missing chart manifest is a
decision rather than an omission: a chart's visual identity is path data and attribute
bindings, not class strings, so `bar-chart`, `line-chart` and `doughnut-chart` have no
`*.variants.ts` and style themselves with token-valued style **objects** — the camelCase
`[style]` form, never a kebab-case string or attribute, because that is the only shape
`check:dimensions` can actually read. `chart-card` is not one of them: it is a bordered
tile with a microlabel, so it has a manifest like every other expressible component.

Four shared files sit beside the primitives and are not components:
`container-size.ts` (the host element's width as a signal, plus `readBreakpoint`),
`chart-internals.ts` (the chart maths and the identity-or-meaning colour contract),
`focus-trap.ts` (the shared overlay focus trap used by `confirm-dialog`,
`command-palette` and `onboarding`) and `projection-markers.ts` (the `[arena-action]`,
`[arena-actions]`, `[brand]` and `[footer]` marker directives that let a component
detect whether an optional slot was projected, so its spacing wrapper can be gated).

A primitive defines no styling of its own. Its recipe lives in
`frameworks/tailwind/components/<Component>.manifest.json` and reaches the
component through the shared `tv`:

```ts
import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Tag.manifest.json' with { type: 'json' };

export const tagStyles = tv(manifest);
```

## Conventions

Standalone (no `NgModule`), `OnPush`, `input()`/`output()`/`model()`, `inject()`
for DI, kebab-case filenames with no type suffix, `arena-` selector prefix, no
component `styles` (recipe owns styling), no comments beyond one JSDoc line,
barrels with no `../` imports inside the layer. Dark-first (`.arena-light` for
light). Danger is outline. Icons are Phosphor (Bold default). No gradients, no emoji.

## What Material provides, and what Arena does

Parity here is parity of **outcome**, not of inventory: an Angular consumer can build
every interface an Arena React consumer can. Roughly half of it they build with
Material wearing Arena (`theme/arena-material.css`), the rest with Arena's own
primitives.

**Material provides these 22; Arena dresses them and implements none of them:**
Button and IconButton (`mat-button`, `mat-icon-button`), Input and Textarea
(`mat-form-field` + `matInput`), Select (`mat-select`), Checkbox and Radio
(`mat-checkbox`, `mat-radio-group`), Switch (`mat-slide-toggle`), SegmentedControl
(`mat-button-toggle-group`), Card (`mat-card`), Badge (`matBadge`), Table
(`mat-table`), Tabs (`mat-tab-group`), Dialog (`MatDialog`), Menu (`mat-menu`),
Tooltip (`matTooltip`), Toast (`MatSnackBar`), Pagination (`mat-paginator`),
ProgressBar (`mat-progress-bar`), Spinner (`mat-progress-spinner`), Calendar
(`mat-datepicker`) and SideNav (`mat-nav-list` + `<a mat-list-item [activated]>`, scoped
by `.arena-side-nav`).

Reimplementing them as `arena-*` would duplicate years of hardened keyboard
accessibility, overlay positioning, i18n and focus management — badly — and would
strip `arena-material.css` of most of its reason to exist.

### Known issue — most of the Material bridge is currently inert

**Read this before adopting the bridge.** The list above states the design intent, not
what `arena-material.css` currently achieves. Angular Material renamed its theming
custom properties, and **24 of the 26 property names the file carried before the
SideNav work do not exist in Angular Material 22**. A custom property Material does not
read is silently inert: nothing errors, nothing warns, the control simply renders stock
Material.

- **What still works:** the table (`--mat-table-background-color`,
  `--mat-table-row-item-outline-color`) and the `.arena-side-nav` rules, whose property
  names were verified against the real published package.
- **What does not:** every filled, outlined and text button, the outlined form field,
  the elevated card, the dialog container, the tab header and indicator, the snackbar,
  and both the circular and linear progress indicators. Those render Material's own
  defaults today, not Arena's.

The renames were not uniform prefix swaps, which is why no pattern match caught them —
word order moved as well:

| Was | Is |
| --- | --- |
| `--mdc-filled-button-container-color` | `--mat-button-filled-container-color` |
| `--mdc-elevated-card-container-color` | `--mat-card-elevated-container-color` |
| `--mdc-dialog-container-shape` | `--mat-dialog-container-shape` |
| `--mat-tab-header-active-label-text-color` | `--mat-tab-active-label-text-color` |
| `--mdc-tab-indicator-active-indicator-color` | `--mat-tab-active-indicator-color` |
| `--mdc-circular-progress-active-indicator-color` | `--mat-progress-spinner-active-indicator-color` |

**Why it rotted, and the proposed fix.** `@angular/material` is not a dependency of
this repo, so nothing in the tree can verify a property name and the version the bridge
targets is written nowhere. The fix is two things together: add `@angular/material` as
a **devDependency** (dev-only, like the rest of this repo's tooling — nothing here is
published), and add a `check:material` gate that pulls the property names out of
`arena-material.css` with the existing `scripts/lib/css-decls.mjs` and asserts each one
appears in the installed package. That is a grep, not a renderer, so it stays
runtime-portable under plain `node` with no browser — and it pins the Material version
the bridge targets, which is the thing whose absence allowed this to happen. **Neither
the renames nor the gate is done**; both are their own piece of work, deliberately not
folded into the primitive-parity plan that surfaced them.

## Verifying the layer

`bun run check:angular` compiles every primitive with `ngc` under `strictTemplates`
(`tsconfig.check.json`), and it reaches a primitive **through the barrel** — a
primitive missing from `primitives/index.ts` is not typechecked. Each manifest-backed
primitive also has a static specimen at
`frameworks/tailwind/components/<Component>.card.html`, which renders the real markup
with the real recipe and no Angular executed. A specimen therefore proves the *recipe*,
never the *component*: it hand-builds the DOM from the manifest, so a component-logic
bug can render correctly in the card while being broken in the primitive. The three SVG
charts have no specimen at all, by the same exception that gives them no manifest.

## Two traps this layer's idiom sets

Both are layer-wide, both are silent, and both have bitten during implementation.

**A bare boolean attribute reads as `false`.** Every boolean input here is a plain
signal `input(false)` with no `booleanAttribute` transform, so `<arena-alert dismissible>`
passes the empty string, which is falsy — the flag compiles, no error is raised, and the
feature simply never turns on. Always bind: `[dismissible]="true"`. This governs
`alert`'s `dismissible`, `confirm-dialog`'s `destructive`, `line-chart`'s `area`, and
`open` on `confirm-dialog`, `command-palette` and `onboarding`.

**An input named after a native attribute leaves the native attribute behind.** Angular
writes a static attribute to the DOM during the creation pass whether or not it also
matches an input, so `<arena-page-head title="Projects">` leaves a real `title` on the
host and the browser draws a tooltip over the whole header. This affects `title` on
`page-head`, `empty-state`, `error-state` and `chart-card`, and `name` on `app-logo`.
Binding the input (`[title]="…"`) avoids it, and so would a host binding of
`'[attr.title]': 'null'` — which, if taken, must be applied to all five at once rather
than one primitive at a time, or the layer becomes unpredictable. Not yet done.

## Adopting it

See [`ADOPTION.md`](./ADOPTION.md) for the step-by-step DAMA playbook.
