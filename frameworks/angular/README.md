# Arena — Angular layer

Arena support for an Angular 20+/Tailwind-v4 app. Two kinds of artifact:

**Bridge (foundation) — make an existing Angular/Material app wear Arena:**
- `theme/arena-tailwind.css` — one import that brings Arena's tokens (including
  the self-hosted fonts declared in `tokens/fonts.css`, binaries in `assets/fonts/`)
  + the shared `frameworks/tailwind/theme.css` `@theme` preset into scope.
- `theme/arena-material.css` — maps Arena tokens onto Angular Material's
  `--mat-*` custom properties so the components below render in Arena. What it covers:
  buttons (filled, outlined, and an outline-only `arena-danger`), the outlined form
  field, cards, dialogs, tables, tabs, the snackbar, spinner/progress-bar, and
  **SideNav** — `mat-nav-list` with `<a mat-list-item [activated]>`. **The bridge is
  verified against Angular Material 22.0.5 — read
  [Material bridge](#material-bridge-supported-and-verified) for what that means and
  what it does not.** SideNav is the
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
reference shape. The three SVG charts are the one exception and have no
`<name>.variants.ts` — see below.

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
`focus-trap.ts` (the shared overlay focus trap, generalized out of `confirm-dialog` and
used by it and `command-palette`) and `projection-markers.ts` (the `[arena-action]`,
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

**Material provides these 22; Arena implements none of them itself, and dresses only a
subset:** Button and IconButton (`mat-button`, `mat-icon-button`), Input and Textarea
(`mat-form-field` + `matInput`), Select (`mat-select`), Checkbox and Radio
(`mat-checkbox`, `mat-radio-group`), Switch (`mat-slide-toggle`), SegmentedControl
(`mat-button-toggle-group`), Card (`mat-card`), Badge (`matBadge`), Table
(`mat-table`), Tabs (`mat-tab-group`), Dialog (`MatDialog`), Menu (`mat-menu`),
Tooltip (`matTooltip`), Toast (`MatSnackBar`), Pagination (`mat-paginator`),
ProgressBar (`mat-progress-bar`), Spinner (`mat-progress-spinner`), Calendar
(`mat-datepicker`) and SideNav (`mat-nav-list` + `<a mat-list-item [activated]>`, scoped
by `.arena-side-nav`). `arena-material.css` dresses Button (filled and outlined
variants only; a plain text button gets nothing outside `.arena-danger`), Input and
Textarea (outlined appearance only — a form field left on Material's default fill
appearance keeps Material's own styling), Card, Table, Tabs, Dialog, Toast, ProgressBar, Spinner and SideNav;
IconButton, Select, Checkbox, Radio, Switch, SegmentedControl, Badge, Menu, Tooltip,
Pagination and Calendar still render with Material's own defaults.

Reimplementing them as `arena-*` would duplicate years of hardened keyboard
accessibility, overlay positioning, i18n and focus management — badly — and would
strip `arena-material.css` of most of its reason to exist.

### Material bridge: supported and verified

**The primitives stand alone.** No file under `frameworks/angular/primitives/` imports
`@angular/material` — a consumer can use all 21 with no Material installed at all. When
the Angular layer is published (plan 6), `@angular/material` will be an **optional** peer
dependency; nothing here requires it today.

**Material is the recommended bridge for the rest.** Arena does not reimplement the
components Material already provides — they carry overlay positioning, focus
management, keyboard navigation and i18n, and duplicating that badly would be worse
than bridging it. `arena-material.css` is that bridge for the ones it actually carries
rules for: buttons (filled, outlined, and the outline-only danger variant), the
outlined form field, cards, dialogs, tables (plus the header cell), tabs, the
snackbar, the progress spinner and bar, and SideNav's nav list. It maps Arena tokens
onto Angular Material's `--mat-*` custom properties so those render in Arena instead
of stock Material; the rest of Material's components still render with Material's own
defaults.

**The bridge is verified, not rendered.** `bun run check:material` pulls every custom
property `arena-material.css` sets out of the file with `scripts/lib/css-decls.mjs` and
asserts each one is a name the installed Angular Material package actually reads, and
that every Arena token it references exists. What the gate does **not** cover: it checks
that a name exists, not that it is the right name for the element being styled — that
distinction is exactly the class of error that hit this file once already, and only a
real render catches it. It has two further limits, both disclosed in full in
`scripts/check-material.mjs`'s header: it never examines the selectors those properties
sit in, and its existence oracle reads only Material's `fesm2022/` bundles. There is no Angular Material application in this repo, so the
bridge has been verified name-by-name against the installed package, not visually
confirmed in a running app.

**It targets Angular Material 22.0.5.** That version is pinned as a devDependency in the
root `package.json` — a bridge with no stated target version cannot be falsified, and
`check:material` fails the moment the bridge and the installed package disagree.

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
host and the browser draws a tooltip over the whole header. Nine primitives are affected —
`title` on `alert`, `chart-card`, `confirm-dialog`, `empty-state`, `error-state`,
`page-head` and `unauth-card`, and `name` on `app-logo` and `avatar`. `confirm-dialog` is
the worst case by a distance: its host is the fixed full-viewport scrim, so
`<arena-confirm-dialog title="Delete?">` paints a tooltip over the *entire viewport* while
the dialog is open. Binding the input (`[title]="…"`) avoids it, and so would a host
binding of `'[attr.title]': 'null'` — which, if taken, must be applied to all nine at once
rather than one primitive at a time, or the layer becomes unpredictable. Not yet done.

## Adopting it

See [`ADOPTION.md`](./ADOPTION.md) for the step-by-step DAMA playbook.
