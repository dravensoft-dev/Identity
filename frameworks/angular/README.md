# Arena — Angular layer

Arena support for an Angular 20+/Tailwind-v4 app. Two kinds of artifact:

**Bridge (foundation) — make an existing Angular/Material app wear Arena:**
- `theme/arena-tailwind.css` — one import that brings Arena's tokens (including
  the self-hosted fonts declared in `tokens/fonts.css`, binaries in `assets/fonts/`)
  + the shared `frameworks/tailwind/theme.css` `@theme` preset into scope.
- `theme/arena-material.css` — maps Arena tokens onto Angular Material's
  `--mdc-*` / `--mat-*` vars so every Material control renders in Arena.
- `icons/icon-manifest.ts` — canonical Phosphor role→glyph map.
- `theme/theme-service.ts` + `theme/no-fouc.html` — dark-first signal theme
  service (light = `.arena-light`) and the pre-paint snippet.

**Primitives — token-styled components Material does not provide.** Each is a
quartet: `<name>.ts` (standalone, `OnPush`, signal I/O, `arena-` selector),
`<name>.variants.ts` (a `tailwind-variants` recipe built with the shared `tv`),
`<name>.prompt.md` (usage + Do/Don't), and a barrel. `primitives/tag/` is the
reference shape. This milestone ships `tag`; further primitives follow it.

## Conventions

Standalone (no `NgModule`), `OnPush`, `input()`/`output()`/`model()`, `inject()`
for DI, kebab-case filenames with no type suffix, `arena-` selector prefix, no
component `styles` (recipe owns styling), no comments beyond one JSDoc line,
barrels with no `../` imports inside the layer. Dark-first (`.arena-light` for
light). Danger is outline. Icons are Phosphor (Bold default). No gradients, no emoji.

## Adopting it

See [`ADOPTION.md`](./ADOPTION.md) for the step-by-step DAMA playbook.
