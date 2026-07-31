# Two npm packages, and a skin the consumer declares — design

**Date:** 2026-07-31 · **Status:** approved in design.

**Supersedes** `2026-07-18-9-four-package-build-publish-design.md`, which proposed four
packages with Dravensoft's own tokens inside one of them. Read that document for its
decisions on version authority, lockstep and trusted publishing, which this one keeps. What
it got wrong is the premise: a design system published as a package ships a *language*, and
a skin is the consumer's.

## Problem

Arena ships three ways from one tree: a Claude Code plugin served from the git tag, a
copy-in kit, and an Agent Skill. All three assume the consumer has the repository. There is
no way to write `bun add` and get the components.

Both framework layers are ready for one. React and Angular implement the same 50
components, the API contracts state each component's members once and neutrally, and 39
Tailwind manifests carry the Angular layer's styling. What is missing is the assembly.

## Goals

1. `bun run build:packages` assembles two installable packages from the sources in place,
   into `frameworks/react/dist/` and `frameworks/angular/dist/`. No authored file moves.
2. Every component the layer implements is importable from its package.
3. **The package carries no skin.** The consumer declares their palettes and their fonts in
   one JSON file, and a CLI the package ships turns it into CSS.
4. Phosphor is the consumer's dependency, never a bundled asset.
5. The three existing channels keep working byte-unchanged.

## Non-goals

- Publishing. No workflow, no npm organization, no `npm publish`. This design leaves the
  packages buildable and verifiable locally.
- Tests inside the packages. A consumer installs components, not suites.
- A tokens package or a Tailwind package. The Tailwind layer travels inside the Angular
  package, which is the only layer that consumes it.
- New components, or any change to what a component renders.

## Design

### A. Two packages, and what each holds

`@dravensoft/arena-react` and `@dravensoft/arena-angular`, both at the version
`.claude-plugin/plugin.json` declares, which stays the single authority. They move in
lockstep because they are cut from one tree at one commit.

The React package is the layer's `.jsx` compiled to ESM, each component's hand-written
`.d.ts` copied beside it, the generated barrel, the four layer-root helpers, and the static
CSS. It has **no runtime dependencies**: `react`, `react-dom` and `@phosphor-icons/web` are
peers. Components style themselves with inline `style` objects reading custom properties,
so there is nothing else to bring.

The Angular package is `ng-packagr` output in Angular Package Format, plus the static CSS
and the precompiled `Utilities.generated.css`. `tailwind-variants` and `tailwind-merge` are
real runtime dependencies, because `frameworks/tailwind/Tv.ts` executes on every render to
compose a slot's class string. `@angular/{core,common,platform-browser}`, `@angular/cdk`
and `@phosphor-icons/web` are peers.

**The Tailwind layer is not a third package.** It is data travelling one way into Angular,
which is why `check:layer-independence` already declares that edge `ALLOWED`, and a
consumer of the Angular package never names it.

**Angular's consumer does not need Tailwind.** The package ships the compiled utility
sheet, so importing one stylesheet is enough; the `@theme` preset ships alongside it for a
consumer who already runs Tailwind v4 and would rather compile.

What never ships: tests, demo pages, specimens, `vendor/`, behaviour bindings, component
prompts, and the font binaries under `assets/`.

### B. The consumer's configuration

One file, `arena.config.json`, holding two things: an array of palettes and the three font
families.

```json
{
  "palettes": [
    { "name": "dark", "default": true, "polarity": "dark",
      "colors": { "base-100": "#141010", "primary": "#b52a20", "cat-1": "#3c7b0a" } }
  ],
  "fonts": {
    "display": { "family": "Archivo", "src": "https://...", "weight": "400 900" },
    "body":    { "family": "Familjen Grotesk", "src": "./fonts/body.woff2" },
    "mono":    { "family": "Spline Sans Mono", "src": "./fonts/mono.woff2" }
  }
}
```

A colour is a plain hex string. The DTCG form `contracts/design/palette.dark.json` carries
is correct for a source of truth that Style Dictionary reads and several gates measure, and
wrong for a file a person writes: keeping `components` and `hex` in agreement by hand is a
class of defect with no upside. The CLI normalises to the DTCG shape internally, so one
representation still reaches the emitter.

The key set is the 27 keys of `contracts/design/palette.dark.json`, and `error-fill` is the
one optional member, because `colors.css` derives it from `--color-error` in oklab when it
is absent. The eight `cat-*` keys are the categorical ramp, whose order is its identity and
whose count is pinned at 8 by `CatSlot` in `contracts/api/types/cat-slot.json`.

`polarity` is `dark` or `light`. It is not decoration: `colors.css` sets `--picker-invert`
against `.arena-light`, and a palette named anything else would leave the native date
picker indicator uninverted. It also gives the theme helpers something to match
`prefers-color-scheme` against.

Exactly one palette is the default and reaches `:root`. Every other palette emits
`.arena-<name>`.

### C. The CLI

```
arena-theme <config.json> -o <output.css> [--strict] [--no-import]
```

It emits, in order: an `@import` of its own package's `arena.css`, the three `@font-face`
rules, the `:root` block (default palette, `--picker-invert`, the three `--font-*`), and
one `.arena-<name>` block per remaining palette. The consumer imports one file, **last**,
and that position is what makes their values win over the package's.

It has no dependencies and does not touch the network. A `src` that is a URL is emitted
verbatim; a `src` that is a path is emitted relative to the output file. Style Dictionary
stays in the repository: emitting `--color-x:#hex;` does not need a pipeline, and a
package that pulled one in would make every consumer pay for it.

**It warns rather than blocks.** `validate` and `contrast` from
`scripts/lib/core/validate-palette.mjs` already back `check:ramp` and
`check:text-contrast`; the CLI vendors that module verbatim, which is what its own header
instructs, and reports on stderr every text level under 4.5:1 and every ramp pair too close
to tell apart. A consumer owns their brand, and Arena's job is to tell them what it costs.
`--strict` turns those reports into exit 1 for a consumer who wants the discipline in CI.

**One gate keeps the CLI honest.** `check:packages` builds a configuration out of
`contracts/design/palette.{dark,light}.json` and `typography.json`, runs the CLI over it,
and asserts the result carries the same selectors, the same custom properties and the same
values as `contracts/design-generated/palette.generated.css`. Two emitters exist, so
something has to hold them together; without this, "the package emits what Arena emits" is
a sentence rather than a fact.

### D. Theming by name

`.arena-light` is a name in a system that now has N palettes, so the theme helpers stop
knowing two names and start taking any declared one.

Angular's `ThemeService` keeps its shape and widens its type. `provideArenaThemes({palettes, default})`
supplies the declared names and their polarities through an `InjectionToken`; the service
applies `arena-<name>` to `documentElement` for any non-default palette, removes the
previous one, persists the choice, and picks its initial value from `prefers-color-scheme`
matched against the declared polarities. With no providers configured it falls back to dark
and light, so an application on the copy-in kit sees no change.

React gets the same semantics as plain DOM functions in a new `frameworks/react/Theme.js`
at the layer root, which is the narrowest level containing its consumers, plus a
`useArenaTheme()` hook for components that want to render the current name.
`intro/theme.js` is the intro's own and is not touched.

### E. Assembly, and keeping `dist/` out of scope

The build assembles rather than restructures: a glob copy with one exclusion list, then
each layer's own compiler. React's `.jsx` goes through `Bun.Transpiler`, the same path
`scripts/build/react/build-demos.mjs` already uses. Angular's sources are staged into
`build/angular-package/` together with the slice of `frameworks/tailwind/` its
`.variants.ts` files import, because `ng-packagr` requires everything to hang off the
package root, and then compiled.

`dist/` is git-ignored. The plugin and the copy-in kit are served from the tag and need
their payload committed; a package is served from npm and is rebuilt from the tagged
sources, so committing thousands of generated lines would only make every diff unreadable.

That introduces the one real hazard in this design: **a tree under `frameworks/` that
gates would read as source.** `check:layer-independence` and `check:generated` already skip
`dist`; `check:docs`, `check:dimensions`, `check:duplicate-constants` and
`check:script-tokens` learn to. Each has a `.test.mjs` beside it, and that is where the
exclusion is asserted, so a walker that later forgets fails rather than reporting green
over a copy of the tree.

### F. Documentation

`frameworks/PACKAGING.md` is the normative statement of the channel, at the level that
contains both layers, the way `frameworks/Components.json` is. The root README links it.

Each package's `README.md` is authored as `frameworks/<layer>/PACKAGE.md` and copied into
`dist/` at assembly, so `check:docs` reads it like any other document instead of it being
prose no gate opens. It carries the link to the repository and states what that link is
for: the package is the code, and the repository is the criterion. A consumer who installs
the Claude Code plugin, or loads `SKILL.md` into any other agent, hands that agent the
guidelines, the contracts and every component's prompt, which is what turns "integrate
Arena into my project" into a task the agent finishes on its own. Then: installation with
its peers, one complete `arena.config.json` with a single palette and three Google Fonts
URLs, the CLI's commands and flags, the import order, and one component rendered end to
end.

## Verification

- `bun run build:packages` populates both `dist/` trees; `npm pack --dry-run` in each lists
  no test, demo or specimen file.
- `bun run check:packages` passes, including the equivalence between the CLI's output and
  `contracts/design-generated/palette.generated.css`.
- `bun run check` passes in full, with `dist/` present in the tree and out of every gate's
  scope.
- In a throwaway project outside the repository: `bun add` each package, write a config by
  copying the one in the package's README alone, run the CLI, render components, confirm
  the consumer's crimson and not Dravensoft's, confirm the fonts load from the declared
  URLs, and confirm switching to a third palette works.

## Affected files

**New:** `frameworks/PACKAGING.md`, `frameworks/react/PACKAGE.md`,
`frameworks/angular/PACKAGE.md`, `frameworks/react/Theme.js` + `.d.ts`,
`frameworks/react/Index.generated.js` + `.d.ts`, `scripts/build/packages/**`,
`scripts/check/arena/check-packages.mjs` and its suite.

**Modified:** `.gitignore`, `package.json`, `frameworks/angular/theme/ThemeService.ts`,
`frameworks/angular/index.ts`, four gate walkers and their suites,
`scripts/check/arena/check-all.mjs`, the root README, `CLAUDE.md`, both layer READMEs,
`CHANGELOG.md`.

**Unchanged:** every component, every contract, every token source, the plugin manifests
and all three existing channels.
