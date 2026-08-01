# React layer TypeScript migration

## Why

Arena's two framework layers hold different type guarantees. Angular is 287 `.ts` compiled AOT by
`ngc --strictTemplates` before any suite runs. React is 157 `.jsx` with no types at all, beside 54
hand-written `.d.ts` that nothing validates: the repository invokes `tsc` nowhere, `@types/react`
is not installed, and the only thing comparing a declaration to its implementation is
`check-api.mjs`, by regex, and only for contracted components.

So a `.d.ts` that disagrees with the `.jsx` beside it reaches npm and reaches a copy-in consumer
with every gate green. `build-react-package.mjs` copies those declarations verbatim because
`PACKAGING.md` calls them the layer's real type contract, and that contract answers to no compiler.

The goal is that a published declaration is **derived** from the implementation and therefore cannot
disagree with it, and that React holds the guarantee Angular already holds.

## Scope

`frameworks/react/` only. `scripts/` and `intro/` stay JavaScript, for two mechanical reasons:
59 suites under `scripts/` run under plain `node --test`, discovered by the `.test.mjs` suffix in
`check-all.mjs`; and `intro/overview.js` imports `scripts/lib/core/token-preview.mjs` and
`scripts/lib/arena/css-decls.mjs` straight into the browser, and `intro/` has no build step.

JSDoc over `.jsx` is not an alternative: `commentRuleProblems()` in `check-docs.mjs` scans
`frameworks/` and allows no comment at all outside `scripts/` and tests, so a `/** @param */` block
fails the gate.

## The two silent breakages

A `.jsx` to `.tsx` rename leaves two gates passing over nothing. Both are fixed, and watched to
fail, before a single file is renamed.

- `check-manifest-states.mjs`: `reactSourceFor()` builds `${name}.jsx`, returns `null` when it is
  absent, and `reactProblems` then returns no findings. 26 of the 47 sites are React.
- `check-dimension-literals.mjs`: `COMPONENT_PARAMS` ends `\}\)\s*\{`, which does not match
  `}: ButtonProps) {`. It matches 61 component functions today and would match none.
  `stalePassthrough()` does not catch it, because `passthroughSightings()` is also satisfied by the
  JSX usage regex.

The loud breakages, fixed in phase 2, are `check-api.mjs`'s `.d.ts` to `.jsx` path derivation,
`check-compliance.mjs`'s `walkSuites` regex and its 50 `COVERED` values, the 8 `EXEMPT` keys behind
`staleExemptions()`, and `build-react-barrel.mjs`'s two `existsSync` calls.

## Phases

### 0. Preflight

Add `@types/react@^18` and `@types/react-dom@^18`. React is pinned to 18.

The four hand-written root helpers (`DataVisuals`, `Theme`, `UseContainerWidth`, `UseDialogModal`)
migrate to `.ts` with the components. `UseContainerWidth.d.ts` declares
`useContainerWidth<T extends Element = HTMLDivElement>()`, a generic no inference over JavaScript
recovers, so leaving it `.js` would lower the published types. `CalendarInternals.js`,
`PaginationWindow.js`, `test/Preload.js`, `Tokens.generated.js` and `Index.generated.js` stay `.js`.

`DataVisuals` carries the visually-hidden idiom, so as a `.ts` it enters the `check:dimensions`
scan and needs three `EXEMPT` entries with the reasons that already exist verbatim for
`frameworks/angular/DataVisuals.ts`.

### 1. Make the silent gates loud

A standalone commit that merges before any rename. `reactSourceFor()` returning `null` produces a
finding, and both gates gain a zero-scan guard in the repository's own `zeroXProblems` idiom.
`COMPONENT_PARAMS` tolerates a type annotation between the closing brace and the parenthesis.

Verified by renaming one file, watching both gates fail by name, and renaming it back.

### 2. Teach the tooling both extensions

Nothing is renamed. `build-demos.mjs` and `build-react-package.mjs` derive the transpiler loader
from the file extension rather than holding the literal `'jsx'`, and their specifier rewrites accept
either. `build-react-barrel.mjs`, `check-api.mjs`, `check-manifest-states.mjs`,
`check-compliance.mjs`, `check-layer-independence.mjs` and `static-server.mjs` follow.
`LAYER_TOKENS` gains `.tsx` for react, which collides with nothing; a bare `.ts` would collide with
Angular's `.variants.ts`.

The DOM split becomes extension-agnostic rather than re-spelled: the positional filter is
`.dom.test.` and the ignore pattern is `**/*.dom.test.*`. Bun matches the first as a substring and
the second as a glob, so both extensions work throughout the migration and the split stops being
coupled to an extension at all.

The test counts are the invariant: 354 pass over 46 files DOM-free, 184 pass over 35 files DOM.

### 3. The migration, one atomic commit

Big-bang rather than per component. Three gates hold per-component data in shared maps with
bidirectional staleness assertions, so a per-component commit edits those three files once per
component and every intermediate state weakens a gate.

Specifiers keep an explicit TS extension, because a `.js`-style specifier is indistinguishable from
`./Tokens.generated.js`, which must not be rewritten. That needs `allowImportingTsExtensions`,
which is legal under `noEmit`.

`frameworks/react/tsconfig.check.json` sets `strict`, `noUncheckedIndexedAccess`,
`verbatimModuleSyntax` and `erasableSyntaxOnly`. The last two are load-bearing rather than taste:
Bun's `tsx` loader keeps a value-form import used only as a type, and `Api.generated` has no runtime
counterpart, so without `verbatimModuleSyntax` a demo page 404s silently; `erasableSyntaxOnly`
forbids the constructs where `tsc` and `Bun.Transpiler` could disagree about emitted runtime code.

Each `XProps` interface folds into its `.tsx` and the 54 hand-written `.d.ts` are deleted. The
annotation work concentrates in three places: helpers returning style objects, which need
`React.CSSProperties` or a literal widens to `string`; the 11 files using `cloneElement` and
`React.Children`, each of which needs an `isValidElement` guard and a named local type, since the
comment rule leaves no room to explain an inline cast; and the 35 DOM suites, where every
`querySelector` becomes nullable.

### 4. The check:react-types gate

`scripts/check/react/check-react-types.mjs`, shaped like `check-angular.mjs`: a `tscBin(root)`
mirroring `ngcBin`, and a `spawnSync` of `tsc --noEmit -p`. It runs under plain node, so unlike
`check:demos`, `check:vendor` and `check:cards` it is runtime-portable and needs no exit-2 skip.

The name carries the layer, as every other layer-scoped gate does.

### 5. Emitted declarations, and the copy-in kit

`build-react-package.mjs` spawns `tsc -p tsconfig.dist.json` with `emitDeclarationOnly` instead of
copying declarations. The specifier rewrite applies to the emitted `.d.ts` as well as the transpiled
`.js`, because `rewriteRelativeImportExtensions` does not reach declaration output: it emits
`export * from "./Button.js"` in the JavaScript and `export * from "./Button.tsx"` in the
declaration, and that file does not exist in the package. A post-emit assertion holds that every
compiled component ships a declaration beside it, which is where `build-react-barrel.mjs`'s
untyped-component guarantee moves to.

`Tokens.generated.js` ships untyped today, since it is a root module but not in the copy list. The
emit gives it a declaration.

The copy-in kit gets its own build. `build:kit` emits plain `.js` and `.d.ts` into a tracked
`frameworks/react/kit/`, guarded by a `check:kit` drift gate of the same shape as `check:demos`.
The kit's payload becomes derived rather than hand-maintained, and all four shipping channels stay
intact. `.gitignore` carries the exception with its reason beside it.

`check:api` reads the `.tsx` for both halves. `reactSurface` and `reactImplementation` already work
on TSX. Nothing is lost, because the declaration was never the authority;
`contracts/api/components/<Name>.json` is, and it stays the independent third party. Reading the
emitted declaration instead would couple a check to a build.

### 6. Documentation

`CLAUDE.md` has 117 characters of headroom, so the new material goes to
`frameworks/react/README.md` with a pointer left behind, which is the buy-back the size rule
prescribes.

Two changes are substantive rather than textual. A React component becomes a trio, since `X.d.ts`
is gone, and Angular's quartet stops being described as the analogue of React's. And `check:api`
reads one file rather than two.

`CHANGELOG.md` is a frozen record and is not rewritten; the change is filed under `[Unreleased]`.

### 7. Close out

`bun run check` once, at the end. `frameworks/react/dist/` is rebuilt and its declarations read by
hand before any publish, because `check:packages` holds the manifest and not the declaration
content.
