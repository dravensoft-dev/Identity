# Arena, the Dravensoft Design System

**Version 5.0.0** · MIT License · Dark-first, token-driven design system for React, Angular and Tailwind. See [`CHANGELOG.md`](./CHANGELOG.md).

**Arena** is the single interface language under which every Dravensoft software product is built. It takes its name from the venue where a performance is put on display and applauded: every Arena interface should feel *worthy of being exalted*, the same promise the brand makes.

## Getting started
Arena ships three ways: as a **Claude Code plugin**, as two **npm packages**, and as a downloadable **Agent Skill** (`SKILL.md`).

### Install as a Claude Code plugin
Inside Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add dravensoft-dev/Identity
/plugin install arena@dravensoft
/reload-plugins
```

This registers the `design` skill under the `arena` plugin. Invoke it explicitly with `/arena:design`, or just ask Claude for Dravensoft-branded UI and it loads automatically.

**Updating takes two commands, not one**, and skipping the second fails silently: you see the new version listed and keep running the old one.

```
/plugin marketplace update dravensoft   # refresh the catalog: learns a new version exists
/plugin update arena@dravensoft         # update the plugin you actually have
/reload-plugins                         # apply it to the running session
```

`/plugin marketplace update` only refreshes the listing. `/plugin update` is what replaces the installed copy (`claude plugin update arena@dravensoft` from a shell, with `--scope` if you installed to `project` or `local`).

**Nothing arrives on its own.** Claude Code enables plugin auto-update for Anthropic's own marketplaces and leaves it **off** for third-party ones like this. To let releases land in the background, turn it on once: `/plugin` → **Marketplaces** → `dravensoft` → **Enable auto-update**. For a whole organization, set `"autoUpdate": true` on the marketplace's `extraKnownMarketplaces` entry in managed settings.

**A version means one commit.** Each release is served from its git tag, with the marketplace entry pinning `source.ref` to `vX.Y.Z`, so a version resolves to the same tree today and in a year, never to whatever `main` happens to hold. The catalog itself is still read from `main`, which is how a new release announces itself.

### Install from npm

```bash
bun add @dravensoft/arena-react     # or @dravensoft/arena-angular
bun add @phosphor-icons/web         # required: Arena renders icon class names, never SVG
```

**The package carries the language and not the skin.** Your palettes and your fonts are
yours, declared in one `arena.config.json`, and the `arena-theme` command each package ships
turns that file into the stylesheet Arena reads:

```bash
bunx arena-theme arena.config.json -o src/arena.generated.css
```

Import that file last, and its values win over the package's. Each package's own README is
the step by step, with a complete config to copy; the Angular one needs no Tailwind, since
the compiled utility sheet ships with it.

**These packages work with this repository rather than instead of it.** Install the plugin
above, or hand any other agent `SKILL.md`, and the agent gets the guidelines, the contracts
and every component's usage document, which is what turns "integrate Arena" into a task it
finishes on its own.

[`frameworks/PACKAGING.md`](./frameworks/PACKAGING.md) is how the packages are built, what
they exclude and why, and what `check:packages` holds.

### How components are styled
Components render with **inline `style` objects that read the CSS custom properties** (e.g. `background: 'var(--crimson)'`). They do **not** expose utility classes: there is no `class="btn"`. `intro/styles.css` provides only the token variables and fonts; all component logic lives in the component's own module. This keeps each component self-contained and fully themeable: change a token and every component follows.

### Dependencies
- **Fonts are self-hosted, and no CDN request is made.** Arena ships the Archivo / Familjen Grotesk / Spline Sans Mono `.woff2` binaries in `assets/fonts/`, and `contracts/design-generated/fonts.generated.css` declares them with `@font-face`, so they load from the same origin as the page that reads them. A package consumer names their own three families in `arena.config.json`, where `src` is either a stylesheet URL or a binary they host.
- **Icons are [Phosphor Icons](https://phosphoricons.com) (MIT)**, and are not bundled. **Install the official package by default**, either `@phosphor-icons/web` (webfont) or `@phosphor-icons/react`, for full weight and tree-shaking flexibility. The CDN is a prototype-only convenience, not the default. See [Iconography](./contracts/design/README.md#iconography).
- **React** is what the primitives in `frameworks/react/components/` are written in (TypeScript and JSX). Tokens, guidelines and assets are framework-agnostic and can be used without React.


## Where to go next

- [`scripts/build/README.md`](./scripts/build/README.md): **compile Arena for the first
  time**, meaning what a fresh clone must build before `bun run demos` or `bun run check`
  mean anything, and why some generated files are tracked and some are not.
- [`frameworks/PACKAGING.md`](./frameworks/PACKAGING.md): the npm channel, meaning how the
  two packages are assembled from the tree in place, why a published Arena carries no skin,
  and what the consumer declares instead.
- [`contracts/README.md`](./contracts/README.md): Arena's three contract levels, and a
  map of everything in this repository.
- [`contracts/design/README.md`](./contracts/design/README.md): **the normative design
  specification**, covering voice, type, color, spacing, motion, the danger convention,
  iconography and theming, plus the DTCG token type map.
- [`frameworks/react/README.md`](./frameworks/react/README.md): the React layer.
- [`frameworks/angular/README.md`](./frameworks/angular/README.md): the Angular layer,
  including how to adopt it.
- [`frameworks/tailwind/README.md`](./frameworks/tailwind/README.md): the shared
  Tailwind layer.
- [`DOUBTS.md`](./DOUBTS.md): what counts as a debt in Arena, and where the records live.
