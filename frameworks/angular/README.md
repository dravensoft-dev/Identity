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
  **SideNav** — `mat-nav-list` with `<a mat-list-item [activated]>`. SideNav is the
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
reference shape. This milestone ships `tag`; further primitives follow it.

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

## Adopting it

See [`ADOPTION.md`](./ADOPTION.md) for the step-by-step DAMA playbook.
