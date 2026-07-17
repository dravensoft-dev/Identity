# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Arena — Dravensoft's design system. It is **not an npm package and has no build, no tests, and no package.json**. It ships as three things at once from the same tree:

- a **Claude Code plugin** (`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`, registering the `design` skill defined by the root `SKILL.md`);
- a **copy-in kit** (consumers copy `tokens/`, `assets/`, `styles.css` and the `.jsx` files they need);
- a standalone **Agent Skill** (`SKILL.md`).

`README.md` is the normative design specification (voice, color, spacing, danger convention, iconography). Treat it as the source of truth for any design decision, and update it in the same change whenever a token, component, or convention changes.

## Viewing things

Everything is static, but the demos `fetch()` their JSX, so `file://` will not work — serve the repo root over HTTP:

```bash
python3 -m http.server 8000   # then browse to the paths below
```

- `guidelines/*.html` — token specimen cards (type, color, spacing, effects, icons, brand, danger convention).
- `frameworks/react/components/<group>/*.card.html` — live component demos, one card per group.
- `frameworks/react/ui_kits/console/index.html` — the Delivery Console example app (login → dashboard → project).
- `*.dc.html` (repo root) — brand manual and the example Overview app. **They live at the root because they must:** they load `support.js`, `styles.css`, `theme.js` and `assets/` by relative path, and those live at the root. From a subdirectory every one of them 404s, no token resolves, and the page renders unstyled. Do not move them.

## Architecture

**Tokens are the only styling layer.** `styles.css` does nothing but `@import` the six files in `tokens/`. The split matters: **`tokens/palette.css` is the skin** — the daisyUI-structured `--color-*` / `--color-*-content` pairs per theme (dark on `:root`, light on `.arena-light`) plus the 8-slot categorical chart ramp (`--color-cat-1..8`) — and it is the one file a consumer swaps to re-skin Arena. **`tokens/colors.css` is the structure** — the compatibility layer mapping Arena's legacy aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) onto those tokens, plus the `color-mix` derivations of the muted text levels from `--color-base-content`. `colors.css` never defines a skin value; `palette.css` is imported before it. When adding a color, define the daisyUI token in `palette.css` first and alias to it in `colors.css` — never introduce a raw hex in a component. After touching `palette.css`, run `node scripts/check-ramp.mjs`.

**Components carry no CSS classes.** Each `frameworks/react/components/**/*.jsx` renders with inline `style` objects reading the custom properties (`background: 'var(--crimson)'`), and handles hover/active/focus with local `useState`. There is no `.btn` class to target; theming happens entirely through token values. Keep new components self-contained the same way — `Button.jsx` is the reference shape.

**The one exception: a `<style>` tag injected once**, for what an inline style genuinely cannot express — `@keyframes` (`ProgressBar`, `Spinner`, `Skeleton`, `Button`, `Dialog`, `Menu`, `Tooltip`, `Rotor`) and vendor pseudo-elements (`Input`'s `::-webkit-calendar-picker-indicator`, which is invisible on the dark surface otherwise). The pattern is always the same, and every one of them follows it: a module-level `let injected = false` guard, a `useEffect`, `document.head.appendChild`. Never a `<style>` rendered inside the component's own markup — that ships one tag per instance and leaks the CSS into the element's `textContent`.

Inject **as little as the job needs**. Prefer keyframes alone and leave the `animation` shorthand inline (`Dialog`, `Menu`, `Tooltip`); a reduced-motion variant that only changes the *movement* can redefine the keyframes inside the media query, which needs no selector. Reach for a class of ours **only when a selector is unavoidable** — a media query that changes duration (`Rotor`, `Spinner`, `Button`), a pseudo-element (`ProgressBar`, `Input`), a background the keyframes animate (`Skeleton`) — and **never as a shortcut around an inline style that would have worked**.

**Every animation answers `prefers-reduced-motion`**, and the answer depends on what the motion means. Motion that reports work in progress *slows* rather than stops (`Spinner`, `ProgressBar`, `Button`, `Rotor`) — a frozen spinner reads as a hung process. Decorative motion stops outright (`Skeleton`). An entrance keeps its fade and drops its travel (`Dialog`, `Menu`) — the movement is the vestibular trigger, the fade is the meaning. An opacity-only animation needs no clause at all (`Tooltip`): there is no motion to reduce.

**Every component is a quartet.** `X.jsx` (implementation), `X.d.ts` (types, with a `@startingPoint` doc comment), `X.prompt.md` (usage, examples, Do/Don't per README's H10 rule), and an entry in the group's `*.card.html` demo. Adding a component means adding all four.

The Angular layer's quartet is the analogue: `<name>.ts` (standalone `OnPush` component, `arena-` selector, signal I/O, no component `styles`), `<name>.variants.ts` (a `tailwind-variants` recipe built with `frameworks/tailwind/tv.ts`), `<name>.prompt.md`, and a barrel export. Dark-first (`.arena-light`), danger stays outline, Phosphor icons.

**Specimen/demo pages** start with an HTML comment `<!-- @dsCard group="…" viewport="WxH" name="…" subtitle="…" -->` that drives external card rendering — keep it as the first line. Component demos load React from esm.sh via an importmap, pull in Babel standalone, and use `jsx-loader.js`'s `window.arenaImport('../path/X.jsx')` to import JSX in the browser with no build step (it transpiles and rewrites relative imports to blob URLs recursively).

`support.js` is a generated bundle (`dc-runtime`, whose source is not in this repo) used only by the root `*.dc.html` pages. Do not edit it.

**Framework layers live under `frameworks/`.** The root holds only the
framework-agnostic language (`tokens/`, `guidelines/`, `assets/`, `scripts/`,
`styles.css`) plus the demo runtime (`theme.js`, `jsx-loader.js`, `support.js`)
and brand (`*.dc.html`). React lives in `frameworks/react/`;
`frameworks/angular/` holds the Angular layer: a Tailwind preset entry
(`theme/arena-tailwind.css`) and an Angular Material MDC token bridge
(`theme/arena-material.css`), self-hosted fonts (`fonts/`), a
Phosphor icon manifest (`icons/`), a dark-first signal `ThemeService`
(`theme/theme-service.ts` + `theme/no-fouc.html`), and standalone `OnPush`
primitives under `primitives/` (`tag` is the reference), each styled by the
shared `frameworks/tailwind/` recipes through the configured `tv`
(`frameworks/tailwind/tv.ts`) — see `frameworks/angular/ADOPTION.md`.
`frameworks/tailwind/` is a **single shared** Tailwind v4 layer (`@theme`
preset + per-component manifests), authored once because the token→utility
mapping is pure CSS. **The Tailwind
layer derives every utility from an existing token and introduces no new hex
and no new value** — add the token first, then reference it.

## Conventions

- **English only.** The repo was fully translated from Spanish; all code, comments, docs, and UI copy stay in English.
- **Specs and implementation plans live under `docs/superpowers/`** (`specs/`, `plans/`), dated `YYYY-MM-DD-<name>.md`. They are in English like the rest of the repo.
- **No gradients** on any surface (the sole exception is `Skeleton`'s neutral shimmer). Depth comes from the `base-100`→`base-200`→`base-300` surface scale, the hairline border, and the warm shadow.
- **No emoji**, in product or docs.
- **Danger is outline, never filled** — transparent background, border and content in `--error`/`--danger`. The only filled danger surface in the whole system is the final irreversible confirmation inside `ConfirmDialog`. See `guidelines/components-danger.html`.
- **A release moves four things, and the tag is one of them.** The version string lives in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and the README header; log the change in `CHANGELOG.md`; and because the plugin is served **from the tag** (`marketplace.json` → `source.ref`), that ref must name the release tag and the tag must exist on the release commit. Do all of it in the release commit, then tag it: the tag then contains a `marketplace.json` that points at the tag itself.
- **Anything landing on `main` after a tag goes under `## [Unreleased]`**, and a release is cut by renaming that heading to the version. Filing it under the last version instead describes a tree nobody has — the plugin is served from the tag, so the release is frozen the moment it is cut. This has been got wrong twice; `check-release.mjs` reads the first *versioned* entry, so `[Unreleased]` on top is expected and never a failure.
- **Forgetting the `ref` fails silently**, which is why it is machine-checked rather than written down and hoped for. The marketplace would advertise the new version while Claude Code keeps fetching the old tag, reads the *old* `plugin.json` there, and resolves the old version. The manifest's version always wins over the marketplace entry's, so the update is never offered and nothing errors. Verify with `node scripts/check-release.mjs` — it reads the version from `plugin.json` (the authority) and asserts the marketplace entry, the README header, the CHANGELOG's top entry, `source.ref` and the tag all agree, and above all that **the `plugin.json` at the pinned tag hands out the version being advertised**. Run it before publishing; a release that skips it is the one that ships nothing.
- **Charts** carry identity (the `--color-cat-*` ramp, in order, never cycled) or meaning (`tone`, the status colors) — never both in one chart. Status colors are never series colors. One axis, always.
- Responsive branches are JS, not media queries (inline styles cannot hold one), and measure the **container** via `useContainerWidth` — not the viewport.
