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
- `components/<group>/*.card.html` — live component demos, one card per group.
- `ui_kits/console/index.html` — the Delivery Console example app (login → dashboard → project).
- `reference/*.dc.html` — brand manual and the example Overview app.

## Architecture

**Tokens are the only styling layer.** `styles.css` does nothing but `@import` the five files in `tokens/`. `tokens/colors.css` has two halves: daisyUI-structured `--color-*` / `--color-*-content` pairs (the source of truth, defined per theme — dark on `:root`, light on `.arena-light`) and, below, a **compatibility layer** mapping Arena's legacy aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) onto them. Muted text levels are derived with `color-mix` from `--color-base-content`, not hardcoded. When adding a color, define the daisyUI token first and alias to it — never introduce a raw hex in a component.

**Components carry no CSS classes.** Each `components/**/*.jsx` renders with inline `style` objects reading the custom properties (`background: 'var(--crimson)'`), and handles hover/active/focus with local `useState`. There is no `.btn` class to target; theming happens entirely through token values. Keep new components self-contained the same way — `Button.jsx` is the reference shape.

**Every component is a quartet.** `X.jsx` (implementation), `X.d.ts` (types, with a `@startingPoint` doc comment), `X.prompt.md` (usage, examples, Do/Don't per README's H10 rule), and an entry in the group's `*.card.html` demo. Adding a component means adding all four.

**Specimen/demo pages** start with an HTML comment `<!-- @dsCard group="…" viewport="WxH" name="…" subtitle="…" -->` that drives external card rendering — keep it as the first line. Component demos load React from esm.sh via an importmap, pull in Babel standalone, and use `jsx-loader.js`'s `window.arenaImport('../path/X.jsx')` to import JSX in the browser with no build step (it transpiles and rewrites relative imports to blob URLs recursively).

`support.js` is a generated bundle (`dc-runtime`, whose source is not in this repo) used only by the `reference/*.dc.html` pages. Do not edit it.

## Conventions

- **English only.** The repo was fully translated from Spanish; all code, comments, docs, and UI copy stay in English.
- **No gradients** on any surface (the sole exception is `Skeleton`'s neutral shimmer). Depth comes from the `base-100`→`base-200`→`base-300` surface scale, the hairline border, and the warm shadow.
- **No emoji**, in product or docs.
- **Danger is outline, never filled** — transparent background, border and content in `--error`/`--danger`. The only filled danger surface in the whole system is the final irreversible confirmation inside `ConfirmDialog`. See `guidelines/components-danger.html`.
- Version lives in three places that must move together: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and the README header; log the change in `CHANGELOG.md`.
