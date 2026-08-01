# Removing the copy-in kit

## What changes

Arena ships through three channels: the Claude Code plugin served from the git tag, the two
npm packages, and the standalone Agent Skill. The copy-in kit stops being one of them, and
every artifact that exists to serve it is deleted rather than deprecated.

Two consequences follow, and they are the reason the change reaches past a directory
deletion. First, `frameworks/react/kit/` is the only build product this repository tracks
*because* a consumer copies it verbatim from the tag; with the consumer gone, the tracked
half of the `.gitignore` rule loses its subject for everything under `frameworks/`. Second,
the React layer carries two hand-emitted `.d.ts` files, `Api.generated.d.ts` and
`Index.generated.d.ts`, which exist in that shape so the kit can ship a declaration beside
each module without a toolchain; they collapse into ordinary `.generated.ts` sources.

## The channel

`README.md` says Arena ships **three** ways rather than four, and the section
"Use in a project (copy-in kit)" is deleted with nothing in its place. Anything that needs
Arena's stylesheet bytes installs a package and runs `arena-theme`, including a throwaway
prototype. `intro/` stays exactly as it is: it is the repository's browsable front, serving
`intro/guidelines/` and the specimen pages, and no document proposes copying it anywhere.

`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` keep the phrase "a UI kit",
which names `frameworks/react/ui-kits/console/` and not this channel.

## Deletions

| what | why it exists today |
| --- | --- |
| `frameworks/react/kit/`, 119 tracked files | the payload |
| `scripts/build/react/build-kit.mjs` | writes it |
| `scripts/check/react/check-kit-generated.mjs` and its `.test.mjs` | holds it fresh |
| `kitSpecifiers()` and the `opts.infix` parameter of `assembleModules()` | the kit's `.generated.` infix is the only caller |
| `build:kit` and `check:kit` in `package.json` | its two commands |
| `build:kit` in the `build:packages` chain | leaves three steps |
| the `check:kit` entry in `check-all.mjs` and in the literal array of `check-all.test.mjs` | 35 gates become 34 |
| `"./kit"` in `tsconfig.check.json` and `tsconfig.dist.json` | excludes a directory that no longer exists |

`assembleModules(root, dir)` keeps one form. Its `outName`, `rewrite` and declaration-renaming
branches all exist to serve `infix` and go with it.

### Prose that names the channel

Deleted: the "Arena ships four ways" sentence and the copy-in section of `README.md`; the
section "The copy-in kit is built, not maintained" and the sentence "What a consumer copies is
`kit/`" in `frameworks/react/README.md`; the copy-in bullet and the `check:kit` clause in
`CLAUDE.md`; the copy-in clause in `frameworks/PACKAGING.md`; the `check-kit-generated.mjs` row
in `scripts/check/react/README.md`; the copy-in clause in `scripts/build/react/README.md`; and
the kit clause inside the `UNTRACKED` reason for
`frameworks/react/components/**/*.generated.js`.

Rewritten rather than deleted, because the assertion stays true and only its justification
names the dead channel:

- `frameworks/react/test/Theme.dom.test.tsx`, the test titled "the shipped default is dark and
  light, which is what the copy-in kit has".
- `frameworks/angular/theme/ThemeService.test.ts`, the test titled "the shipped default is two
  palettes, which is what an adopter on the copy-in kit has".
- `frameworks/angular/README.md`, the sentence citing "what an adopter on the copy-in kit has".

In all three the subject becomes the two palettes a package ships by default.

## The rename

```
frameworks/react/Api.generated.d.ts    ->  frameworks/react/Api.generated.ts
frameworks/react/Index.generated.d.ts  -\
frameworks/react/Index.generated.js    -/-> frameworks/react/Index.generated.ts
```

Nothing about the layer has to move to allow it. `allowImportingTsExtensions` is already on in
`tsconfig.check.json`, every component already writes its relative imports with the extension
(`'../../forms/button/Button.tsx'`), and `Api.generated` is types-only: 40 interfaces and type
aliases, no runtime export, which `erasableSyntaxOnly` already requires.

**`generate-api-types.mjs`** emits the same filename into both layers, so its `OUTPUTS` list
holds `frameworks/react/Api.generated.ts` and `frameworks/angular/Api.generated.ts`. Every
consumer already imports it extensionless (`from '../../../Api.generated'`), so no component
changes.

**`build-react-barrel.mjs`** writes one file. `barrelJs()` and `barrelTypes()` collapse into
one `barrel()` emitting specifiers with their extension, which is what `barrelJs()` already
does and what `rewriteSourceSpecifiers()` in the package build already rewrites to `.js`.
`TYPE_ONLY` survives as a distinction the single barrel still has to make: `Api.generated` is
re-exported as `export type * from './Api.generated.ts';`, erasable and emitting no runtime
re-export, which is exactly the split the two files express today. `ROOT_PRIVATE` and the
reason `Tokens.generated` is absent are unaffected.

**`build-react-package.mjs`** moves both names from the copy-and-rewrite path to the compile
path: `ROOT_TS` gains `Index.generated.ts` and `Api.generated.ts`, `ROOT_JS` keeps only
`Tokens.generated.js`, and `ROOT_TYPES` and the extra `'Index.generated.d.ts'` in the copy loop
disappear.

**The published package does not change.** Today `Index.generated.js` and
`Index.generated.d.ts` are copied verbatim; after the change Bun transpiles
`Index.generated.ts` into `dist/Index.generated.js` and `tsc` emits `dist/Index.generated.d.ts`,
which is the route every component already takes. The `exports` map still names
`./Index.generated.d.ts` and `./Index.generated.js`, and `Api.generated.ts` compiles to an
empty `dist/Api.generated.js` beside its emitted declaration.

Literal filenames to move with it: `scripts/generate/arena/generate-api-types.test.mjs`,
`scripts/build/react/build-react-package.test.mjs`, `scripts/check/react/check-react-barrel.mjs`
and its README rows, `scripts/build/react/README.md`, `scripts/generate/arena/README.md`,
`contracts/README.md` and `frameworks/PACKAGING.md`.

## The tracking rule

The rule stated in `.gitignore` today is audience: what only Arena's tooling reads is ignored,
and the payload a consumer copies stays committed. The second half only ever had one consumer
under `frameworks/`, so the rule becomes narrower and easier to state:

> A generated file is tracked when the git tag has to serve it to a browser directly.
> Everything a script writes under `frameworks/` is tooling, and is ignored.

Tracked afterwards: `contracts/design-generated/*.css`, `assets/fonts/` and `intro/support.js`,
each for the reason it already carries. `contracts/design-generated/` stays for the reason it
always had, which is that the plugin is served from the tag and `intro/styles.css` would
otherwise `@import` nothing, unstyled and silent.

Ignored afterwards, in one line, because the anchoring rationale dies with the tracked
`Tokens.generated.js` it was protecting:

```
/frameworks/**/*.generated.*
```

That line replaces the six anchored patterns and the note explaining why each is anchored. It
also covers 45 paths git currently tracks. Three of them leave the index by rename or
deletion, and their replacements are simply never added: `Api.generated.d.ts`,
`Index.generated.d.ts` and `Index.generated.js`. The other 42 are files that stay on disk
under the name they already have, so the change carries an explicit `git rm --cached` for
them: `frameworks/react/Tokens.generated.js`, `frameworks/angular/Api.generated.ts`,
`frameworks/angular/Tokens.generated.ts` and the 39
`frameworks/tailwind/components/**/*.manifest.generated.ts`. `check-generated.mjs` reports
exactly that case as "ignored by pattern yet still in the index", so a forgotten
`git rm --cached` fails the gate rather than passing quietly.

Every one of them is rebuilt by `bun run build`: `generate:api` writes both `Api.generated.*`,
`generate:tokens` writes both `Tokens.generated.*`, and `build:tailwind` writes the manifest
modules and `Utilities.generated.css`. `scripts/build/README.md`, the first-compile document,
gains them.

### What `check:generated` keeps

The one gitignore line does not become one `UNTRACKED` entry. That map exists so every ignored
output carries its own reason, and `trackingProblems()` fails a key matching nothing, so the
reasons cannot go stale. The keys stay granular and gain one per newly ignored family:
`frameworks/react/Api.generated.ts`, `frameworks/react/Index.generated.ts`,
`frameworks/react/Tokens.generated.js`, `frameworks/angular/Api.generated.ts`,
`frameworks/angular/Tokens.generated.ts` and
`frameworks/tailwind/components/**/*.manifest.generated.ts`. Two existing reasons lose a
clause: the one for the compiled component siblings drops "What a consumer copies is
`frameworks/react/kit/`, which is tracked", and the one for the four layer-root helpers drops
"the four are named one by one because a pattern wide enough to catch them would swallow the
tracked `Tokens.generated.js` beside them".

`check-generated.test.mjs` asserts on those maps, so it moves in the same commit.

## Gates

No gate is added. `check:packages`, `check:api`, `check:script-tokens`,
`check:tailwind-generated` and `check:react-types` all compare a committed file against a fresh
build, which works the same whether the file is tracked, exactly as `check:demos` already does
for files that have always been ignored. The gates that change are the ones naming a deleted
file or a moved filename:

- `check-all.mjs` and `check-all.test.mjs`: drop `check:kit`.
- `check-react-barrel.mjs` and its suite: one output instead of two.
- `check-generated.mjs` and its suite: the maps above.

`check-react-types.mjs` and its suite name no filename that moves, and the two compiler options
they pin are untouched, so the layer typecheck changes nothing.

## Release

`CHANGELOG.md` gains an entry under the existing `## [Unreleased]`, marked breaking: the
copy-in channel is removed, and a project consuming Arena by copying `frameworks/react/kit/`
migrates to `@dravensoft/arena-react`.

No version is bumped here. Cutting a release moves six things and is its own deliberate act.

## Verification

`bun run build && bun run check` once, at the end, rather than per commit. Two extra
assertions this change specifically needs:

```bash
git ls-files | grep '\.generated\.'     # only contracts/design-generated/ and assets/fonts/
git ls-files | grep 'kit/'              # only frameworks/react/ui-kits/
```

A fresh-clone rehearsal is worth one run, because the untracked set grew by 45 files and
`bun run build` is now load-bearing for the Angular test compile as well as for the demos:
clone into a temporary directory, `bun install`, `bun run build`, `bun run check`.
