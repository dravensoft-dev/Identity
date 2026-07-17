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

**Tokens are the only styling layer.** `styles.css` does nothing but `@import` the six files in `tokens/`. The split matters: **`tokens/palette.css` is the skin** — the daisyUI-structured `--color-*` / `--color-*-content` pairs per theme (dark on `:root`, light on `.arena-light`) plus the 8-slot categorical chart ramp (`--color-cat-1..8`) — and it is the one file a consumer swaps to re-skin Arena. **`tokens/colors.css` is the structure** — the compatibility layer mapping Arena's legacy aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) onto those tokens, plus the `color-mix` derivations of the muted text levels from `--color-base-content`. `colors.css` never defines a skin value; `palette.css` is imported before it. When adding a color, define the daisyUI token in `palette.css` first and alias to it in `colors.css` — never introduce a raw hex in a component. After touching `palette.css`, run `node scripts/check-ramp.mjs`.

**Components carry no CSS classes.** Each `components/**/*.jsx` renders with inline `style` objects reading the custom properties (`background: 'var(--crimson)'`), and handles hover/active/focus with local `useState`. There is no `.btn` class to target; theming happens entirely through token values. Keep new components self-contained the same way — `Button.jsx` is the reference shape.

**The one exception: a `<style>` tag injected once**, for what an inline style genuinely cannot express — `@keyframes` (`ProgressBar`, `Spinner`, `Skeleton`, `Button`, `Dialog`, `Menu`, `Tooltip`, `Rotor`) and vendor pseudo-elements (`Input`'s `::-webkit-calendar-picker-indicator`, which is invisible on the dark surface otherwise). The pattern is always the same, and every one of them follows it: a module-level `let injected = false` guard, a `useEffect`, `document.head.appendChild`. Never a `<style>` rendered inside the component's own markup — that ships one tag per instance and leaks the CSS into the element's `textContent`.

Inject **as little as the job needs**. Prefer keyframes alone and leave the `animation` shorthand inline (`Dialog`, `Menu`, `Tooltip`); a reduced-motion variant that only changes the *movement* can redefine the keyframes inside the media query, which needs no selector. Reach for a class of ours **only when a selector is unavoidable** — a media query that changes duration (`Rotor`, `Spinner`, `Button`), a pseudo-element (`ProgressBar`, `Input`), a background the keyframes animate (`Skeleton`) — and **never as a shortcut around an inline style that would have worked**.

**Every animation answers `prefers-reduced-motion`**, and the answer depends on what the motion means. Motion that reports work in progress *slows* rather than stops (`Spinner`, `ProgressBar`, `Button`, `Rotor`) — a frozen spinner reads as a hung process. Decorative motion stops outright (`Skeleton`). An entrance keeps its fade and drops its travel (`Dialog`, `Menu`) — the movement is the vestibular trigger, the fade is the meaning. An opacity-only animation needs no clause at all (`Tooltip`): there is no motion to reduce.

**Every component is a quartet.** `X.jsx` (implementation), `X.d.ts` (types, with a `@startingPoint` doc comment), `X.prompt.md` (usage, examples, Do/Don't per README's H10 rule), and an entry in the group's `*.card.html` demo. Adding a component means adding all four.

**Specimen/demo pages** start with an HTML comment `<!-- @dsCard group="…" viewport="WxH" name="…" subtitle="…" -->` that drives external card rendering — keep it as the first line. Component demos load React from esm.sh via an importmap, pull in Babel standalone, and use `jsx-loader.js`'s `window.arenaImport('../path/X.jsx')` to import JSX in the browser with no build step (it transpiles and rewrites relative imports to blob URLs recursively).

`support.js` is a generated bundle (`dc-runtime`, whose source is not in this repo) used only by the `reference/*.dc.html` pages. Do not edit it.

## Conventions

- **English only.** The repo was fully translated from Spanish; all code, comments, docs, and UI copy stay in English.
- **No gradients** on any surface (the sole exception is `Skeleton`'s neutral shimmer). Depth comes from the `base-100`→`base-200`→`base-300` surface scale, the hairline border, and the warm shadow.
- **No emoji**, in product or docs.
- **Danger is outline, never filled** — transparent background, border and content in `--error`/`--danger`. The only filled danger surface in the whole system is the final irreversible confirmation inside `ConfirmDialog`. See `guidelines/components-danger.html`.
- Version lives in three files that must move together: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and the README header; log the change in `CHANGELOG.md`. Verify with:
  `grep -rn '"version"' .claude-plugin/ && grep -n '^\*\*Version' README.md && head -8 CHANGELOG.md`
- **Charts** carry identity (the `--color-cat-*` ramp, in order, never cycled) or meaning (`tone`, the status colors) — never both in one chart. Status colors are never series colors. One axis, always.
- Responsive branches are JS, not media queries (inline styles cannot hold one), and measure the **container** via `useContainerWidth` — not the viewport.
