# Two npm packages, assembled from the tree in place

**Goal:** Assemble `@dravensoft/arena-react` and `@dravensoft/arena-angular` into
`frameworks/{react,angular}/dist/`, carrying every component and no skin, with a CLI that
turns the consumer's `arena.config.json` into the palette and font CSS.

**Spec:** `docs/superpowers/specs/2026-07-31-npm-packages-design.md`.

**Architecture:** The build assembles rather than restructures. One shared glob copy with
one exclusion list, then each layer's own compiler: `Bun.Transpiler` for React's `.jsx`,
`ng-packagr` over a staging tree for Angular. The CLI is authored once under
`scripts/build/packages/arena-theme/` and copied verbatim into both packages, and one gate
holds it equivalent to the Style Dictionary pipeline it duplicates.

**Tech Stack:** Bun (build, test), `node:test` + `node:assert/strict`, `ng-packagr` 22 (a
devDependency already), `Bun.Transpiler`.

## Global Constraints

1. **English only**, in code, comments, docs and commit messages.
2. **A commit message containing a backtick uses a quoted here-doc**, never `git commit -m`.
   Verify with `git log -1 --format=%B`.
3. **`bun run check` in full runs ONCE, at close-out.** Individual gates are named per task.
4. **No component source changes.** This plan changes how the layers are *delivered*, not
   what any component renders. `ThemeService.ts` is the one exception and it is not a
   component.
5. **A test under `scripts/` may not import a framework layer's `.ts` or `.jsx`.**
6. **`dist/` is generated and git-ignored.** Nothing under it is ever edited by hand, and
   no gate reads it.
7. **The version authority is `.claude-plugin/plugin.json`.** No package manifest is
   hand-versioned.

## What this plan measured before it was written

Read off the tree at `2cf4293`, branch `packages-infra`, on 2026-07-31.

| measure | value |
|---|---|
| React component directories | 50 |
| Angular component directories | 50 |
| Tailwind manifests | 39 |
| palette keys per theme | 27, identical in both |
| version in `.claude-plugin/plugin.json` | 4.0.0 |

Facts the tasks depend on, each read off the source:

- `scripts/lib/core/validate-palette.mjs` exports `validate` and `contrast`, and its header
  instructs re-vendoring rather than patching.
- `scripts/build/react/build-demos.mjs` exports `findJsxFiles` and
  `rewriteRelativeJsxImports`, and compiles with `new Bun.Transpiler({loader:'jsx'})`.
- `frameworks/angular/index.ts` is the layer barrel and is already compiled by
  `check:angular` through `tsconfig.check.json`'s `files: ["./index.ts"]`.
- Angular's `.variants.ts` files import `../../../../tailwind/Tv` and a
  `.manifest.generated` from `frameworks/tailwind/components/`. That edge is `ALLOWED` in
  `check-layer-independence.mjs`.
- `check-layer-independence.mjs` and `check-generated.mjs` already skip `dist`.
  `check-docs.mjs`, `check-dimension-literals.mjs`, `check-duplicate-constants.mjs` and
  `check-script-tokens.mjs` do not.
- `contracts/design/colors.css` binds `--picker-invert` to `:root` and `.arena-light`.
- The React layer has no barrel today.

## File Structure

**New**

- `scripts/build/packages/assemble.mjs` and `.test.mjs`
- `scripts/build/packages/arena-theme/arena-theme.mjs`, `theme-css.mjs`,
  `palette-keys.mjs`, `validate-palette.mjs` (vendored), and the suites
- `scripts/build/packages/build-react-package.mjs` and `.test.mjs`
- `scripts/build/packages/build-angular-package.mjs`
- `scripts/build/packages/generate-react-barrel.mjs` and `.test.mjs`
- `scripts/build/packages/Manifests.mjs` (the two `package.json` templates)
- `scripts/check/arena/check-packages.mjs` and `.test.mjs`
- `frameworks/react/Theme.js`, `Theme.d.ts`, `Index.generated.js`, `Index.generated.d.ts`
- `frameworks/PACKAGING.md`, `frameworks/react/PACKAGE.md`, `frameworks/angular/PACKAGE.md`

**Modified**

- `.gitignore`, `package.json`
- `frameworks/angular/theme/ThemeService.ts`
- four gate walkers and their `.test.mjs` siblings
- `scripts/check/arena/check-all.mjs`
- `README.md`, `CLAUDE.md`, both layer READMEs, `CHANGELOG.md`

---

## Task 1: `dist/` leaves every gate's scope

**Files:** `.gitignore`; `check-docs.mjs`, `check-dimension-literals.mjs`,
`check-duplicate-constants.mjs`, `check-script-tokens.mjs` and their suites.

- [ ] Add `/frameworks/react/dist/` and `/frameworks/angular/dist/` to `.gitignore`,
      anchored, in the build-output block, with the reason: a package is served from npm
      and rebuilt from the tagged sources.
- [ ] Teach each of the four walkers to skip a directory named `dist`, matching whatever
      shape that walker already uses for `node_modules`.
- [ ] Assert the exclusion in each `.test.mjs`, by creating a `dist` directory in the
      fixture root holding a file the gate would otherwise fail on, and asserting no
      problem is reported.
- [ ] `bun test scripts` green.

## Task 2: The palette key manifest and the CSS emitter

**Files:** `scripts/build/packages/arena-theme/palette-keys.mjs`, `theme-css.mjs`, the
vendored `validate-palette.mjs`, and their suites.

**Interfaces:** `paletteKeys()` returns the ordered key list with `error-fill` flagged
optional. `themeCss(config, {packageName, importHeader})` returns the CSS string.
`configProblems(config)` returns an array of human-readable strings.

- [ ] Vendor `scripts/lib/core/validate-palette.mjs` verbatim, with a header naming where
      it came from and why it is a copy.
- [ ] `palette-keys.mjs` carries the 27 keys as a literal list; its suite asserts the list
      equals the keys of `contracts/design/palette.dark.json`, so the ramp growing a slot
      fails here first.
- [ ] `configProblems` covers: a missing or duplicate palette name, a name that is not
      kebab-case, more than one default, a missing required colour key, an unknown key, a
      malformed hex, a missing or unknown `polarity`, and a missing font role.
- [ ] `themeCss` emits the import header, three `@font-face` rules, the `:root` block and
      one `.arena-<name>` block per remaining palette.

## Task 3: The `arena-theme` CLI

**Files:** `scripts/build/packages/arena-theme/arena-theme.mjs` and its suite.

- [ ] Argument parsing: one positional config path, `-o`/`--out`, `--strict`,
      `--no-import`. An unknown flag exits 2 with a usage line.
- [ ] Validation problems print to stderr and exit 1. They are always fatal; a config that
      does not parse has no output to emit.
- [ ] Contrast and ramp reports print to stderr and exit 0, or exit 1 under `--strict`.
- [ ] `bun scripts/build/packages/arena-theme/arena-theme.mjs --help` prints usage.

## Task 4: `check:packages`

**Files:** `scripts/check/arena/check-packages.mjs` and its suite; `check-all.mjs`;
`package.json`.

- [ ] The equivalence check: build a config from `contracts/design/palette.{dark,light}.json`
      and `typography.json`, run `themeCss` over it, and assert the selectors, property
      names and values match `contracts/design-generated/palette.generated.css`. Comments
      and whitespace are not compared; every declaration is.
- [ ] When `dist/` exists, additionally assert both manifests carry `plugin.json`'s
      version, every `exports` target resolves to an emitted file, and no peer leaked into
      `dependencies`. When it does not exist, say so and pass: the gate must run on a fresh
      clone.
- [ ] Register `check:packages` in `package.json` and in `check-all.mjs`.

## Task 5: Theming by name

**Files:** `frameworks/angular/theme/ThemeService.ts`, `frameworks/angular/index.ts`,
`frameworks/react/Theme.js` + `.d.ts`.

- [ ] `ArenaTheme` becomes `string`; add `ArenaPalette {name, polarity}`,
      `ARENA_THEMES` and `provideArenaThemes()`. Default configuration is dark and light,
      so nothing existing changes behaviour.
- [ ] The service removes the previously applied `arena-<name>` class before applying the
      next, and applies none for the default palette.
- [ ] `frameworks/react/Theme.js`: `initArenaTheme`, `setArenaTheme`, `getArenaTheme`,
      `useArenaTheme`, same semantics, plain DOM, guarded for a server render.
- [ ] `bun run check:angular` and `bun run test:angular` green.

## Task 6: The React barrel

**Files:** `scripts/build/packages/generate-react-barrel.mjs` + suite;
`frameworks/react/Index.generated.js` + `.d.ts`; `package.json`.

- [ ] Walk `components/<category>/<kebab>/<Pascal>.jsx` and emit one `export *` per
      component, plus the layer-root helpers and `Theme`. A helper that is not a
      component's main file is never exported.
- [ ] The `.d.ts` mirrors it against the `.d.ts` siblings.
- [ ] Both outputs are tracked, like `Tokens.generated.js`; the suite asserts the committed
      files match a fresh generation, the way `check:tokens` does for the CSS.

## Task 7: Assembly

**Files:** `scripts/build/packages/assemble.mjs`, `build-react-package.mjs`,
`build-angular-package.mjs`, `Manifests.mjs`; `package.json`.

- [ ] `assemble.mjs`: copy by glob with the exclusion list, plus `copyDoc()` which places
      `PACKAGE.md` at `dist/README.md`, and the CSS chain writer.
- [ ] React: transpile every component `.jsx` and the barrel, rewriting `.jsx` specifiers
      to `.js`; copy each `.d.ts`; copy the four helpers; write `arena.css` and `css/`;
      copy the CLI into `bin/`; write `arena.config.example.json` derived from the repo's
      own palettes; stamp `package.json`.
- [ ] Angular: stage `frameworks/angular` and the imported slice of `frameworks/tailwind`
      under `build/angular-package/`, excluding tests and demos, then run `ng-packagr`;
      copy the same CSS chain plus `Utilities.generated.css`, `arena-cdk.css` and
      `Theme.css`; copy the CLI; stamp the manifest.
- [ ] `build:packages` runs both.

## Task 8: The documentation

**Files:** `frameworks/PACKAGING.md`, `frameworks/{react,angular}/PACKAGE.md`,
`README.md`, `CLAUDE.md`, both layer READMEs, `CHANGELOG.md`.

- [ ] `PACKAGING.md`: what each package holds and what it excludes, how assembly works,
      why `dist/` is ignored and which gates skip it, how the version is stamped, and the
      config contract with its CLI.
- [ ] Each `PACKAGE.md`: the repository link and what it is for, installation with peers,
      a complete one-palette config with Google Fonts URLs, the CLI's commands, the import
      order, and one component rendered.
- [ ] The root README gains the install section and the link; `CLAUDE.md` gains the fourth
      channel and the `dist/` rule; each layer README points at its `PACKAGE.md`.
- [ ] `bun run check:docs` green.

## Task 9: Close-out

- [ ] `bun run build && bun run build:packages`.
- [ ] `npm pack --dry-run` in each `dist/`, and read the file list for a test, a demo or a
      specimen.
- [ ] `bun run check` in full.
- [ ] The throwaway-consumer smoke test for both layers, per the spec's verification
      section.
