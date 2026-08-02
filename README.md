# Arena, the Dravensoft Design System

MIT License · Token-driven design system for React, Angular and Tailwind.

**Arena** is the single interface language under which every Dravensoft software product is built.

## Latest project artifacts
- **Repo/Claude Code plugin**: 5.1.0 
- [npm React package](https://www.npmjs.com/package/@dravensoft/arena-react?activeTab=versions)
- [npm Angular package](https://www.npmjs.com/package/@dravensoft/arena-angular?activeTab=versions)

## Getting started
Arena ships three ways: as a **Claude Code plugin**, as two **npm packages**, and as a downloadable **Agent Skill** (`SKILL.md`).

### Install as a Claude Code plugin
Inside Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add dravensoft-dev/Identity
/plugin install arena@dravensoft
/reload-plugins
```
**Update plugin**
```
/plugin marketplace update dravensoft   # refresh the catalog: learns a new version exists
/plugin update arena@dravensoft         # update the plugin you actually have
/reload-plugins                         # apply it to the running session
```
**A version means one commit.** Each release is served from its git tag, with the marketplace entry pinning `source.ref` to `vX.Y.Z`.

### Install from npm

```bash
bun add @dravensoft/arena-react     # or @dravensoft/arena-angular
bun add @phosphor-icons/web         # required: Arena renders icon class names, never SVG
```
**The package carries the language and not the skin.** For more info, read `frameworks/<framework>/PACKAGE.md`

**These packages work with this repository rather than instead of it.** Install the plugin above, or hand any other agent `SKILL.md`, and the agent gets the guidelines, the contracts and every component's usage document, which is what turns "integrate Arena" into a task it finishes on its own.

[`frameworks/PACKAGING.md`](./frameworks/PACKAGING.md) is how the packages are built, what they exclude and why, and what `check:packages` holds.

### Dependencies
- **Fonts are self-hosted, and no CDN request is made.** Arena ships the Archivo / Familjen Grotesk / Spline Sans Mono `.woff2` binaries in `assets/fonts/`, and `contracts/design-generated/fonts.generated.css` declares them with `@font-face`, so they load from the same origin as the page that reads them. A package consumer names their own three families in `arena.config.json`, where `src` is either a stylesheet URL or a binary they host.
- **Icons are [Phosphor Icons](https://phosphoricons.com) (MIT)**, and are not bundled. **Install the official package by default**, either `@phosphor-icons/web` (webfont) or `@phosphor-icons/react`, for full weight and tree-shaking flexibility. The CDN is a prototype-only convenience, not the default. See [Iconography](./contracts/design/README.md#iconography).

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
