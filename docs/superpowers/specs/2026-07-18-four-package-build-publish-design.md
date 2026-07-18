# Four atomic npm packages — build + publish — design

**Date:** 2026-07-18 · **revised 2026-07-18** after v4.0.0 shipped and the framework
layers were audited.
**Status:** Approved in design; **blocked on framework-layer coverage** before the
release workflow is switched on — see "Component coverage" near the end.
**Scope:** Sub-project 2 of 2. Sub-project 1
(`2026-07-18-token-style-dictionary-migration-design.md`) **shipped in v4.0.0**;
the DTCG token source the `arena-tokens` package ships now exists.

**What the revision changed.** Three things were stale, all of them things that
would have produced a wrong build rather than an obvious error:

1. Every invocation said `npm run` / `node scripts/` — **the repo is Bun-first**.
2. It described sub-project 1 as unlanded. It shipped.
3. It described the Angular and Tailwind layers as if they held a component
   library. They hold **one component each**, and the shared-recipe wiring the
   package graph assumes is not built yet.

## Problem

Arena is authored as one buildless tree that already ships three ways (Claude Code
plugin, copy-in kit, Agent Skill). The goal is a fourth: **each integral Arena
release also publishes four atomic npm packages**, lockstep-versioned, each
installable on its own — from **npm (public, `@dravensoft` scope)** and, because
Bun reads the npm registry directly, **by Bun** too:

| Package | Source it derives from | Build tool | Output format |
|---|---|---|---|
| `@dravensoft/arena-tokens` | `tokens/src/**` (DTCG) + generated CSS | Style Dictionary | CSS + JS + JSON (DTCG) |
| `@dravensoft/arena-react` | `frameworks/react/` | `tsup` | ESM + CJS + `.d.ts` |
| `@dravensoft/arena-angular` | `frameworks/angular/` | `ng-packagr` | Angular Package Format |
| `@dravensoft/arena-tailwind` | `frameworks/tailwind/` | `tsup` (+ copy) | ESM + CJS + CSS + JSON |

The four versions always equal Arena's single version (the authority is
`.claude-plugin/plugin.json`, per the existing release rule). Publishing is
triggered by pushing the release tag — a GitHub Actions workflow builds all four
and publishes them.

The hard constraint: **derive in place**. Not one authored file moves. The plugin
(served from the tag), the copy-in kit, the Agent Skill, and every demo keep
working on the untouched tree; the packages are *assembled* from it into a
git-ignored `dist/`, never a physical monorepo restructure.

## Goals

1. `bun run build:packages` assembles four publishable packages into `dist/<pkg>/`
   from the in-place sources — zero authored files relocated.
2. Each package is **registry-standard and Bun-installable**: a correct `exports`
   map, `types`, `sideEffects`, exact-pinned `peerDependencies`, no install
   scripts. `bun add` and `npm i` both resolve every entry.
3. **Lockstep versioning**, mechanically enforced: all four `package.json`
   versions and every inter-package peer range are stamped from
   `plugin.json`'s version at build time, and a check fails the build on any
   mismatch.
4. **One tag publishes four packages** via GitHub Actions on `v*`, gated by
   `check-release` and the token/package sync checks, with npm provenance.
5. The three existing distribution modes and all demos are **byte-unchanged**.

## Non-goals

- **No token representation work** — that is sub-project 1. This spec consumes its
  output (`tokens/src/**` + generated `tokens/*.css`).
- **No new components or API changes** in any framework layer. Packaging only.
- **No physical monorepo / workspace restructure**; no moving authored files.
- **No independent per-package versioning** (lockstep was chosen).
- **No private registry / tarball-only path** (public npm was chosen); the
  tarball smoke test exists only for verification.

## Design

### A. Package set, naming, scope

Four packages under the public `@dravensoft` scope, all at Arena's version:

- `@dravensoft/arena-tokens`
- `@dravensoft/arena-react`
- `@dravensoft/arena-angular`
- `@dravensoft/arena-tailwind`

Each `package.json` declares `"publishConfig": { "access": "public" }`,
`"license": "MIT"` (matches repo `LICENSE`), `"repository"`, `"homepage"`, and a
`"sideEffects"` field (CSS-only side effects listed; JS entries side-effect-free).

### B. Derive-in-place layout

```
build/                      # new, committed — the assembly logic
  packages.config.mjs       # per-package manifest template + file map
  build-packages.mjs        # orchestrator: assemble + stamp version + per-tool build
  react.tsup.ts  tailwind.tsup.ts
  angular/ng-package.json  angular/tsconfig.lib.json  angular/public-api.ts
dist/                       # new, GIT-IGNORED — assembled + built packages
  arena-tokens/  arena-react/  arena-angular/  arena-tailwind/
```

`dist/` is added to `.gitignore` (unlike the token CSS from sub-project 1, package
output is not tag-frozen — it is rebuilt in CI from the tagged sources). The
version authority stays `plugin.json`; nothing in `dist/` is hand-edited.

### C. `@dravensoft/arena-tokens`

Ships the standardized token layer for every consumer, in three formats generated
by Style Dictionary (the multi-platform payoff of sub-project 1):

```
arena-tokens/
  css/        palette.css typography.css spacing.css effects.css colors.css fonts.css styles.css
  js/         index.mjs index.cjs index.d.ts   # DTCG values as a typed token map
  json/       tokens.json                       # flattened DTCG, for any other platform
  package.json
```

- `css/` is the current `tokens/` + `styles.css` (the generated ones from
  sub-project 1 plus the hand-authored `colors.css`/`fonts.css`), copied verbatim,
  with `assets/fonts/` bundled alongside so `@font-face` `url()`s resolve.
- `js/` and `json/` are **new Style Dictionary platform outputs** off the same
  DTCG source — no new source of truth. The JS map exposes token *names* /
  `var()` references (runtime `color-mix` derivations stay CSS, per the layer
  contract).
- `exports`: `"."` → `js/`, `"./styles.css"`, `"./css/*"`, `"./json"`.
- No `peerDependencies`; no runtime deps.

### D. `@dravensoft/arena-react`

- **Barrel (new authored file):** `frameworks/react/index.js` (+ `index.d.ts`)
  re-exporting every component group and the shared helpers (`useContainerWidth`,
  etc.). React has no barrel today; this is the one authored addition, and it
  lives with the source (not in `build/`), so the copy-in kit gains an index too.
- **`tsup`** transpiles the `.jsx` (JSX runtime `automatic`) to ESM + CJS; the
  hand-written `.d.ts` are copied as the type entrypoints (not re-emitted).
- `exports`: `"."` (barrel) plus per-component subpaths (`"./Button"`, …) so
  consumers can deep-import; `"./styles.css"` re-points to `arena-tokens`.
- `peerDependencies` (exact-pinned, see §H): `react`, `react-dom`,
  `@dravensoft/arena-tokens` (runtime CSS custom properties), `@phosphor-icons/web`
  (the `ph-*` classes the components render). `react` peer range is wide
  (`>=18`); the arena peer is exact.
- Inline-style, token-driven components need no Tailwind — arena-react does **not**
  depend on arena-tailwind.

### E. `@dravensoft/arena-angular`

- Built with **`ng-packagr`** into Angular Package Format (FESM2022, `.d.ts`,
  partial-Ivy) from a `build/angular/` project (`ng-package.json`,
  `tsconfig.lib.json`, `public-api.ts` re-exporting the existing
  `frameworks/angular/index.ts` surface). The Angular sources already form an
  `OnPush` standalone barrel, so this is configuration, not code change.
- `peerDependencies` (exact/appropriate ranges): `@angular/core`,
  `@angular/common` (wide, `>=17`); `@dravensoft/arena-tokens`,
  `@dravensoft/arena-tailwind` (the `tv` recipes the components consume), and
  `tailwind-variants` (exact/pinned as per §H). Phosphor icon package per the
  icon policy. **The peer on `arena-tailwind` is currently aspirational:** `tag`
  defines its recipe inline rather than consuming a shared manifest, so today the
  Angular package needs only `tv.ts`. The coverage spec makes the peer real.
- Ships the Tailwind preset entry and Material bridge CSS (`theme/*.css`) as
  package assets, exported via `exports` subpaths.

### F. `@dravensoft/arena-tailwind`

- **`tsup`** compiles `tv.ts` → ESM + CJS + `.d.ts`. `theme.css` (the Tailwind v4
  `@theme` preset) and the component `*.manifest.json` files are copied verbatim;
  the shared `*.variants.*` recipes are compiled/copied.
- **Note on `theme.css`:** its `--color-*` and `--shadow-*` entries are
  self-referential (`--color-base-100: var(--color-base-100)`). This is correct and
  must be shipped as-is — Tailwind emits `@theme` inside `@layer theme`, Arena's
  tokens are unlayered, and unlayered wins, so Arena's value resolves. Verified by
  compiling with Tailwind v4.3.3 and measuring in a browser. Do not "fix" it while
  packaging.
- The preset currently exposes **37 of Arena's 138 tokens**; completing that surface
  is `2026-07-18-framework-layer-token-coverage-design.md`, not this spec. The
  package ships whatever the preset covers at build time.
- `exports`: `"."` → compiled `tv`; `"./theme.css"`; `"./manifests/*"`;
  `"./variants/*"`.
- `peerDependencies` (§H): `tailwindcss` (`>=4`), `tailwind-variants`,
  `@dravensoft/arena-tokens` (the preset is nothing but `var()`s into Arena
  tokens; it needs them in scope). No runtime deps.

### G. Inter-package dependency graph (lockstep)

```
arena-tokens        (no arena deps)
arena-tailwind  →   arena-tokens
arena-react     →   arena-tokens
arena-angular   →   arena-tokens, arena-tailwind
```

All arena→arena edges are **`peerDependencies` pinned to the exact same version**
(not `^`), because the four always ship together. A consumer installing
`arena-angular@3.3.0` is told, by peer resolution, to have `arena-tokens@3.3.0`
and `arena-tailwind@3.3.0` — never a drifting minor.

### H. Version sync — mechanically enforced

- **Authority:** `.claude-plugin/plugin.json` `version` (the existing rule —
  Claude Code resolves plugin.json over everything).
- At build, `build-packages.mjs` reads that version and **stamps** it into all
  four `dist/*/package.json` `version` fields and every arena peer range. Package
  manifests are generated from a template in `build/packages.config.mjs`, never
  hand-versioned.
- **New `scripts/check-packages.mjs`** asserts: four manifests exist, all four
  `version` == `plugin.json`, every arena peer range == that exact version,
  `exports` targets all resolve to emitted files, and no arena package leaked into
  `dependencies` (they must be `peerDependencies`). Exit 1 on any violation.
- This extends the release-coherence family alongside `check-release.mjs`
  (which already ties `plugin.json` ↔ marketplace ↔ README ↔ CHANGELOG ↔ tag).

### I. Bun compatibility

Treated as a first-class target, satisfied by standards-compliance rather than
Bun-specific code:

- Every package uses a conditional `exports` map with `types`/`import`/`require`
  correctly ordered; no reliance on `main`-only or on Node-only resolution quirks.
- No `postinstall`/lifecycle scripts (Bun runs them differently and users often
  disable them) — nothing to run at install.
- **Verification:** a smoke matrix installs each built tarball into a throwaway
  consumer under **both** `npm i ./pkg.tgz` **and** `bun add ./pkg.tgz`, then
  imports the entry (JS) / resolves the CSS export, asserting parity.

### J. Release workflow — GitHub Actions on the tag

`.github/workflows/release-packages.yml`:

```yaml
on: { push: { tags: ['v*'] } }
```

Steps: checkout (at the tag) → install dev deps → `bun scripts/check-release.mjs`
(tag ↔ version coherence, already the gate) → `bun run build:tokens` +
`bun scripts/check-tokens-generated.mjs` (sub-project 1 sync gate) →
`bun run build:packages` → `bun scripts/check-packages.mjs` → per-package
`npm publish` with `--provenance --access public` using the `NPM_TOKEN` repo
secret. All four publish or the job fails; a partial publish is surfaced, never
hidden (the "fails silently" concern that already shapes `check-release`).

Publishing is **only** on the tag, preserving the user-triggered release
discipline — cutting/tagging stays a manual step; CI reacts to the tag.

### K. Root `package.json` additions

Sub-project 1 introduced the dev-only private root `package.json`. This sub-project
adds to it (still `private: true`, still never published):

- `devDependencies`: `tsup`, `ng-packagr`, `@angular/{core,common,compiler,compiler-cli}`
  (build-time only), `typescript`. (`style-dictionary` already present.)
- `scripts`: `build:packages`, `check:packages`, and a convenience
  `release:packages` (local dry-run of what CI does).

### L. Documentation

- **`README.md`:** a new "Install (npm / Bun)" section — the four package names,
  what each provides, the peer-dependency graph, and that versions move in
  lockstep. Keep the copy-in and plugin sections; npm is an *additional* channel.
- **`CLAUDE.md`:** "What this repo is" gains a fourth distribution mode (four npm
  packages), and the release rule note is extended: a release now also publishes
  four packages, still gated by `check-release`, plus `check-packages`.
- **`frameworks/*/ADOPTION.md` / `README.md`:** add the npm/Bun install path
  beside the existing copy-in instructions.
- **`CHANGELOG.md`:** one entry under `## [Unreleased]`.

## Verification

- `bun run build:packages` populates `dist/` with four packages.
- `bun scripts/check-packages.mjs` → exit 0 (versions, peer ranges, exports,
  no arena `dependencies`).
- For each package: `npm publish --dry-run` and `npm pack` succeed; the tarball
  file list contains exactly the intended files (no source `.jsx`/`.ts` leakage
  beyond what each format intends).
- **Bun + Node smoke:** in a temp consumer, `bun add ./dist/arena-react/*.tgz` and
  `npm i` the same; `import { Tag } from '@dravensoft/arena-react'` resolves under
  both runtimes; `@dravensoft/arena-tokens/styles.css` resolves; the Angular
  package type-checks against a minimal `@angular/core` consumer.
- Existing gates still pass: `check-release`, `check-ramp`, `check-text-contrast`,
  `check-tokens-generated`.
- The three legacy channels unaffected: plugin loads from the tag, the copy-in
  file set is unchanged (now plus the new React `index`), demos render identically.
- A dry-run of `release-packages.yml` (act or a manual workflow_dispatch on a test
  tag) publishes to a dry-run registry without error.

## Affected files

**New (committed):** `build/packages.config.mjs`, `build/build-packages.mjs`,
`build/react.tsup.ts`, `build/tailwind.tsup.ts`, `build/angular/ng-package.json`,
`build/angular/tsconfig.lib.json`, `build/angular/public-api.ts`,
`scripts/check-packages.mjs`, `.github/workflows/release-packages.yml`,
`frameworks/react/index.js`, `frameworks/react/index.d.ts`.

**Edited:** `package.json` (devDeps + scripts), `.gitignore` (add `dist/`),
`README.md`, `CLAUDE.md`, `frameworks/*/ADOPTION.md`, `frameworks/*/README.md`,
`CHANGELOG.md`.

**Unchanged (explicitly):** every authored token/component/demo file, plugin
manifests, `support.js`, `theme.js`, `jsx-loader.js`. No authored file moves.

## Depends on / sequencing

- **Sub-project 1 is done.** The DTCG migration shipped in **v4.0.0** (2026-07-18):
  `tokens/src/**` is the source of every token value, Style Dictionary generates
  the four CSS files, and `check-dtcg` + `check-tokens-generated` gate them.
  `arena-tokens` can be assembled today. What it still needs is the Style
  Dictionary `js/` + `json/` platform outputs, which the migration did not add —
  it emits CSS only.
- **The repo is Bun-first.** `bun install`, `bun run`, `bun test`; `bun.lock`, no
  `package-lock.json`. Every gate stays runtime-portable ESM; `scripts/serve.mjs`
  is the one deliberate `Bun.serve` exception. This spec was written before that
  switch and has been updated for it.
- **Blocked on the framework-layer coverage work**
  (`2026-07-18-framework-layer-token-coverage-design.md`) — see the component
  coverage note below. Publishing before it lands means shipping two packages that
  advertise a design system and contain one component each.
- Version authority and the release-coherence checks (`check-release`) are reused,
  not replaced; `check-packages` is additive.

## Component coverage — what these packages would actually contain

Measured on the tree at v4.0.0:

| Package | Components present |
|---|---|
| `@dravensoft/arena-react` | **40** — the complete, reference implementation |
| `@dravensoft/arena-angular` | **1** (`tag`) |
| `@dravensoft/arena-tailwind` | **1 manifest** (`Button`) |

The Angular and Tailwind layers are scaffolds with a single reference each, and the
two do not even cover the same component. `CLAUDE.md` describes Angular primitives
as "styled by the shared `frameworks/tailwind/` recipes"; in the tree `tag` defines
its recipe inline and `Button.manifest.json` has no Angular consumer.

**This is a publication decision, not a build problem.** The build described here
would work; it would just publish very little under two names that imply much more.
Three ways forward, to be settled before the release workflow is switched on:

1. **Publish `arena-tokens` and `arena-react` first**, and hold the other two until
   their layers have a defensible surface. The lockstep version rule still holds —
   a package simply joins the set at the version where it becomes real.
2. **Publish all four from the start**, with each package's README stating its
   coverage plainly, and grow the layers across subsequent minors.
3. **Grow the layers first**, then publish all four together. The most honest, and
   the slowest.

Option 1 is the recommendation: it keeps the lockstep guarantee, ships the two
packages that are genuinely ready, and does not put a one-component package on the
public registry under the Arena name.
