# One naming convention for all of Arena: `ArenaButton`, `ArenaTable`, `ArenaSideNavItem`

## Context

A component today has three names depending on where you look: `Button` in the contract and the
manifest, `arena-button` in an Angular template, `Button` in a React import. The translation
between them is spread across `kebab()`, hand-written selectors and a class template. This makes
one name canonical everywhere, `ArenaButton`, so the translation disappears.

The urgency is the `arena-to-prod` scan. `"components": "auto"` reads a consumer's sources to
work out which sheets to import. Angular is reliable because the element carries a prefix. React
is not: `JSX_OPEN` in `scripts/generate/core/arena-to-prod/components.mjs` collects every
capitalised tag and intersects it with the map, so a consumer's own `<Table />` from another
library already resolves the `table` sheet today. With `ArenaTable` the prefix is the name, one
rule serves both layers, and that false positive disappears.

This ships in the same major as the already-done-but-unpublished merge of `arena-theme` and
`arena-icons` into `arena-to-prod`. Two breaks in one version, decided. Version numbers in
`.claude-plugin/plugin.json` are not touched by this work; publication moves them.

Move this document to `docs/superpowers/plans/2026-08-05-arena-name-prefix.md` on the first
commit, per the convention in the root `AGENTS.md`.

## What actually changes, against what only looks like it

**The DOM does not move.** `kebab('ArenaButton') === 'arena-button'`, verified. `CLASS_PREFIX`
has exactly one consumer, `slotClass` in `scripts/lib/tailwind/component-css.mjs:21`. Dropping it
there emits `arena-button__root`, byte for byte what ships today. Every consumer CSS rule written
against `.arena-button__root` keeps working. `pascal(kebab(x))` roundtrips losslessly for
Arena-prefixed names, so the invariant `check-structure.test.mjs:98` asserts survives untouched.

**Angular consumers do not move.** `selector: 'arena-button'` is already `kebab('ArenaButton')`.
Templates, and the Angular `components.json` `draws` keys that `"auto"` reads, are unchanged.

**Behaviours do not move.** `contracts/behaviour/` holds ARIA patterns, not components:
`button.json`, `listbox.json`, `dialog-modal.json`, `feed.json`. No component name appears there.
The per-layer `<Name>.behaviour.json` bindings travel with their component.

**The layers cannot move separately.** The canonical name lives once, in
`frameworks/Components.json` and `contracts/api/components/<Name>.json`, and `check:structure` and
`check:api` derive both layers from it. Splitting them requires a name table, which
`frameworks/AGENTS.md:42` forbids.

**Three hardcoded copies of the class prefix are what makes this dangerous.** Only one is the
source of truth:

| site | consequence if missed |
|---|---|
| `scripts/lib/tailwind/component-css.mjs:17,21`: `CLASS_PREFIX`, `slotClass` | the source of truth |
| `scripts/lib/tailwind/component-sheets.mjs:13`, `SELECTOR_PREFIX = /\.arena-([a-z0-9-]+?)__/g` | `ownersOf` yields `button` while `build-tailwind.mjs:91` keys `byComponent` by `arena-button`; **`build:tailwind` throws on all 43 sheets**. Loud. |
| `frameworks/tailwind/ManifestClasses.js:36`, `` `arena-${kebab(manifest.component)}` `` | a full unheld reimplementation of `slotClass`/`variantClass`/`compoundClass` in browser JS, reached by `Specimen.js` and every `<Name>.card.html`. Emits `arena-arena-button__root` against a sheet defining `arena-button__root`: **every specimen renders unstyled and no gate reports it**. |
| `scripts/lib/angular/playground-angular.mjs:37`, `selector(name)` | emits `<arena-arena-button>` into demo entries. Loud via NG8001. |

## Order

Five commits. The first is a provable no-op; the tree is never half-converted because the
couplings that force atomicity all land in commit B.

### Commit 0: consolidate the naming contract, with no output change

`frameworks/tailwind/ManifestClasses.js` is the single source, because it is already the copy the
browser can run: it imports nothing, while `component-css.mjs` imports `node:fs` at module scope
and so can never be loaded by a specimen page. The direction that works is the node generator
consuming the browser-safe file, and no third file is needed.

The two copies are not merely a shared prefix: `namedManifest` and `classesManifest` are the same
transform written twice. One survives, named `classesManifest`.

- `ManifestClasses.js` gains `CLASS_PREFIX`, `classBase`, `slotClass`, `variantClass`,
  `compoundClass` and `classesManifest`, and `arenaClassesFor` is `classesFor(classesManifest(m))`.
- `component-css.mjs` imports those and re-exports them, so its own callers are untouched, and
  deletes its copies along with its `kebab` import.
- `playground-angular.mjs` stops inlining the `kebab` regex and takes it from `layers.mjs`. Its
  `arena-` is the Angular element prefix rather than the class prefix, and it dies in commit B
  when the selector becomes `kebab(name)`.
- `component-sheets.mjs` deletes `SELECTOR_PREFIX`. `ownersOf(text, bases)` takes the class bases
  `build-tailwind.mjs` already holds and matches by exact membership rather than by parsing a
  known prefix out of a selector, so a base no manifest declares is refused instead of guessed.
  `build-tailwind.mjs` keys `byComponent` by `classBase` and computes it before the split.
- One new test pinning `namedManifest(m).slots.root === slotClass(m.component, 'root')`, so the
  two can never silently diverge again. `manifest-classes.test.mjs` exercises only `classesFor`
  today; `namedManifest` is untested.

`CLASS_PREFIX` still says `'arena'` here. Output is byte-identical and provably so (see
Verification). This is the only commit where "nothing changed" is a claim rather than a hope.

### Commit A: the 50 types

Driven off the `"name"` field in `contracts/api/types/*.json`. `Tone` → `ArenaTone`,
`ButtonVariant` → `ArenaButtonVariant`, `ButtonType` → `ArenaButtonType`. File stems follow to
`kebab(newName)`, so `tone.json` → `arena-tone.json`; nothing parses that filename, only the
`"name"` field, so this is convention. `generate-api-types.mjs` emits into both
`Api.generated.ts`.

Prefixing all 50 rather than only the 30 that carry a component name avoids a per-type judgement
call, and it removes a real hazard: `Tone`, `Command`, `Direction` and `Crumb` are exported from
the package root and collide with a consumer's own symbols today.

Types touch no directory, no manifest, no selector and no CSS, so this commit is green on its own
and is the right surface to prove the codemod machinery on.

### Commit B: the 55 components

Irreducibly one commit. Four couplings each force it independently:

| coupling | spans |
|---|---|
| `Components.json` ↔ every layer directory | 3 × 55 dirs, `check-structure.mjs` |
| `manifest.component` ↔ `MANIFEST_COVERS` keys | 43 manifests + 8 map entries, `check-manifest-states.mjs:104` |
| the `slotClass` prefix | all 43 manifests at once |
| `ownersOf` ↔ `byComponent` | every sheet; throws on the first mismatch |

Contents: `Components.json`; `contracts/api/components/<Name>.json` and its `"component"` field;
the 43 tailwind manifests and their `"component"` field plus `<Name>.card.html`; Angular's class,
`selector`, `<Name>.variants.ts` and its `buttonStyles` export, `<Name>.behaviour.json` and its
`"component"` field, the 63 hand-written `index.ts` barrels, tests, `<Name>.prompt.md`; React's
`export function`/`export interface <Name>Props`, `<Name>.behaviour.json`, tests, prompt;
`frameworks/demos/<Name>.demo.json` and its `"component"` field including nested nodes; all
directories in three layers; and the script-side registries: `MANIFEST_COVERS` and `HAND_DRAWN`
in `scripts/lib/tailwind/manifest-surfaces.mjs`, `COVERED` in `check-compliance.mjs`,
`IMPERATIVE_HANDLES` in `api-surface.mjs`, `PAIRS` in `check-surface-parity.mjs`, `LAYER_IDIOM`
in `generate-skills.mjs:39,45`, and the fixtures in `component-css.test.mjs`,
`manifest-claims.test.mjs` and the two `arena-to-prod` test files.

Then the flip: delete `CLASS_PREFIX`, `slotClass` becomes `` `${kebab(manifest)}__${kebab(slot)}` ``,
`elementSelector` becomes `kebab(name)`.

Add in the same commit the guard that makes this an invariant rather than an event: a check that
every name in `Components.json` and every `"name"` in `contracts/api/types/` starts with `Arena`.
It cannot land earlier (red) and must not land later (a window where a new unprefixed component
passes).

Everything generated is regenerated by `bun run build`, not rewritten: all `*.generated.*`, the
React barrel `Index.generated.ts`, the demo pages, the `@api` regions in the prompts, and the
three tracked `SKILL.md` files.

### Commit C: the end-to-end gate

No end-to-end test exists anywhere in the repo. `check:packages` only inspects files in `dist/`;
the whole `"components": "auto"` path, including `hostPackage()` and `packageSheets()`, is
exercised only against tmpdir fixtures. Write and land this after B, but **develop it against the
pre-rename tree first**, with pre-rename assertions, so you know it can pass and fail. A gate
written to match whatever B produced proves nothing.

### Commit D: consumer documentation

Separate because it is prose reviewed differently. `check:citations` will already have forced
every repo path in every `.md` during B; D is the consumer-facing half no gate can check.

## The codemod

55 components × ~26 files each. Hand-editing is wrong. Write it as a one-shot script under
`scripts/` and **do not commit it**; the repo's charter has no place for a tombstone.

**Driven, never hand-listed.** `Object.values(Components.json).flat()` for the 55;
`contracts/api/types/*.json → JSON.parse(f).name` for the 50.

**Exact whole-token matching is the entire exclusion strategy:**

```
(?<![A-Za-z0-9_$])TOKEN(?![A-Za-z0-9_$])
```

This disposes of the over-match surface mechanically, with no deny-list of prose contexts:
`IconButton` is its own table entry, not a `Button` match, so no double prefix.
`ButtonHTMLAttributes` and its three siblings are not table entries. `Table` and `Tab` need no
longest-first ordering because there is no prefix matching. And `role="button"`, `<button>`,
`type="button"`, `.arena-button__root`, `contracts/behaviour/button.json` and `"pattern":
"button"` are all lowercase `button`, which is in neither table and is never seen by the
identifier pass.

**Derived tokens must be in the table or it under-reaches:** `<Name>Props`,
`<camel(Name)>Styles` (the 48 Angular variants exports; `buttonStyles` → `arenaButtonStyles`,
which does not collide with the existing `arenaStyles` helper), and internal shapes like
`<Name>Internals`. Derive the set, do not guess it.

**The audit query proves both directions:**

```bash
git grep -P -o -h -e '(?<![A-Za-z0-9_$])(Button|Table|…)[A-Za-z0-9_$]*' \
  -- . ':!*.generated.*' | sort -u
```

Every token it returns lands in either the rename table or a `FOREIGN` deny-map with a one-line
reason. Rerun after the codemod: the residue must be exactly the deny-map. Cheap enough to run
between passes.

**Kebab rewrites are path-anchored, never word-anchored.** A second pass rewrites lowercase only
where a literal preceding segment proves the context:

- `(brand|charts|display|feedback|forms|layout|navigation)/<kebab>/` → `.../arena-<kebab>/`
- `contracts/api/types/<kebab>.json` → `arena-<kebab>.json`
- `css/components/<kebab>.css` → `arena-<kebab>.css`

Nothing else. The Angular selector, the DOM class, `SELECTOR` in `component-map.mjs` and the ARIA
pattern files survive by construction rather than by exclusion.

**Moves before content:** `git mv` directories, then file stems, then rewrite content over
`git ls-files` (which now reports the new paths, and which scopes the run to tracked files,
excluding `node_modules/`, `dist/`, `frameworks/angular/build/` and every gitignored
`*.generated.*`). Then run a throwaway resolver asserting every relative import specifier in
every tracked `.ts`/`.tsx`/`.js`/`.mjs` resolves to a file on disk. That catches every missed
barrel and all 8 hand-written cross-component imports before a build is ever attempted.

**Two discarded pilots before the bulk.** Run the codemod restricted to one component on a
scratch branch, read the whole diff by hand, fix the tables, `git reset --hard`.

- `Button` first: it owns a manifest and a `.card.html`, has the camelCase `buttonStyles`
  spelling, is *covered by* two manifests it does not own (`ConfirmDialog`, `ErrorState`), is the
  target of two React cross-layer imports, is the only component named in shipped prose
  (`generate-skills.mjs` `LAYER_IDIOM`, `PACKAGE.md`), and carries the maximal lowercase
  collision set.
- `Table` second: it owns a manifest covering `TableRow`/`TableCell`, holds the Angular
  cross-imports to `Pagination` and `Select`, and has three types.

## What breaks for an installed consumer

| surface | breaks? |
|---|---|
| React imports, `import { Button }` | **yes**, → `ArenaButton` |
| React prop and type names, `ButtonProps`, `Tone`, `ButtonVariant` | **yes**, all gain `Arena` |
| Angular templates, `<arena-button>` | no, byte-identical |
| Angular class references, `imports: [Button]` | **yes**, → `ArenaButton` |
| DOM classes, `.arena-button__root` | no, byte-identical |
| Hand-written `stylesheet.components` lists | **yes**, each entry gains `arena-`. Fails loudly: `theme-css.mjs:114` rejects an unknown name and lists every shipped sheet |
| `"components": "auto"` | no |
| Deep CSS imports, `css/components/button.css` | **yes**, → `arena-button.css` |
| `arena-theme` / `arena-icons` commands | **yes**, already merged into `arena-to-prod` |

Both `PACKAGE.md` files need a migration section covering **both** breaks together, since they
ship in one version. Neither file documents the CLI merge as a change today; both describe one
command in the present tense, with no migration note anywhere in the tree. The migration section
is the only place either document may name the old commands.

Specific edits: `frameworks/react/PACKAGE.md` L173 and `frameworks/angular/PACKAGE.md` L181 (the
sheet list examples), react L163 and angular L170 (prose naming `Table`, `Pagination`, `Select`),
react L209 (`<Button>` in the theme example, while `function ThemeButton()` on L207 must not
change), react L257 (`css/components/<name>.css`), and both prebuild snippets. The React page has
no top-level component import example at all; add one, since the whole import surface just moved.

Two sentences carry more value than the rest combined, and nothing in the tree says either today:

- **Nothing in the DOM changed.** Consumer CSS overriding `.arena-button__root` keeps working.
- **Angular selectors did not change**, because the prefix now comes from the component's own
  name rather than from a constant. Without this an Angular consumer reading "everything is
  renamed" will find-replace their templates and break their app in a way no compiler catches.
  Say too that `ArenaAction`, `ArenaActions`, `ArenaBrand`, `ArenaFooter` and
  `ArenaSecondaryAction` are unchanged, or somebody will "fix" them into `ArenaArenaAction`.

## Verification

**Byte-identity of the published CSS.** Capture the "before" from a worktree of the base commit,
not from the current `dist/`, which cannot be proven to match `HEAD`:

```bash
BASE=$(git rev-parse HEAD)
git worktree add "$SCRATCH/before" "$BASE"
cd "$SCRATCH/before" && bun install --frozen-lockfile && bun run build && bun run build:packages
```

Three fingerprints, run in both trees and diffed:

```bash
# F1: the DOM class universe. Must diff empty with NO normalization.
grep -rhoE '\.arena-[a-z0-9-]+__[a-z0-9-]+(--[a-z0-9-]+)*' frameworks/tailwind/consume \
  | sort | uniq -c | sha256sum

# F2: per-sheet content, paths normalized back to the old shape on the AFTER tree only
find frameworks/tailwind/consume -name '*.css' -print0 | xargs -0 sha256sum \
  | sed -E 's#/arena-([a-z0-9-]+)/#/\1/#; s#/Arena([A-Za-z0-9]+)\.styles#/\1.styles#' | sort -k2

# F3: published package CSS
find frameworks/{react,angular}/dist/css -type f -print0 | xargs -0 sha256sum \
  | sed -E 's#/css/components/arena-#/css/components/#' | sort -k2
```

F1 is the direct statement of the decision and needs no normalization. One file is expected to
differ and must be read by eye rather than fingerprinted: `dist/components.json`. React's `draws`
keys gain `Arena` and all values gain `arena-`; **Angular's keys must be unchanged**, because they
are selectors. An Angular key that moved means `SELECTOR` in `component-map.mjs` over-matched and
every Angular consumer's `"auto"` resolution just broke.

**Every gate green.** `bun run check`, capped:

```bash
systemd-run --user --scope -p RuntimeMaxSec=900 -p MemoryMax=8G --collect bun run check
```

**The new end-to-end gate**, a `check-consumer.mjs` under `scripts/check/arena/`, registered in
the `GATES` table of `check-all.mjs` as `check:consumer` with the gate-count assertion in
`check-all.test.mjs` moved with it. It exits 2 (SKIP) when `dist/` is absent, matching
`check:packages`, since `dist/` is gitignored.

No installer and no network: `bun pm pack` each `dist/`, then `tar -xzf` into
`<fixture>/node_modules/@dravensoft/arena-<layer>/`. Packing exercises `files`/`exports` and
proves the tarball is complete; extracting avoids resolving React and `@angular/core`.
`arena-to-prod.mjs` resolves its own package root from `import.meta.url`, so it runs from a bare
extracted directory. Budget: seconds.

Per layer, in a `mkdtempSync` fixture: write `arena.config.json` with a palette, fonts and
`{"stylesheet": {"components": "auto", "preflight": false}}`; write the source the scan reads
(React `import { ArenaButton, ArenaTable } from '@dravensoft/arena-react'` plus JSX; Angular
`<arena-button icon="ph-bold ph-bell">`); then spawn the real `bin/arena-to-prod.mjs`.

Assertions, each naming what a consumer sees:

*The CLI merge*: exit 0, and both `arena.generated.css` and `icons.generated.css` written from
**one** invocation of **one** config; `bin/` holds exactly one entry, which is what stops the
merge silently regrowing a second command; `icons.generated.css` names the `ph-bell` glyph.

*The rename*: `css/components/arena-button.css` exists and contains `.arena-button__root`, which
is both halves of the decision in one assertion; the emitted `@import` set names
`arena-button.css`, proving `"auto"` resolved the new symbol; the Angular fixture's unchanged
`<arena-button>` resolves to the same sheet; a second React fixture importing `{ Button }`
resolves zero sheets, which is the executable form of "no aliases, no deprecation window"; and
the literal list from `PACKAGE.md` succeeds while `["button"]` fails with a message listing the
shipped names, making the documented example a tested claim.

**Manual pass before publishing**, in a copy of the `my-angular-app` consumer bench, since the
gate covers the CLI path but not a real Angular build.

## One decision left open

`ThemeService` and `provideArenaThemes` sit outside both rename tables. After this change the
Angular package exports 55 `Arena*` components, 50 `Arena*` types, already-prefixed helpers, and
one bare `ThemeService`. That is out of the scope as stated, but it is exactly the residue this
rename exists to remove. Worth a decision rather than a silent survival.
