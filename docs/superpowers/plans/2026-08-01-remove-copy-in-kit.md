# Removing the copy-in kit: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arena ships through three channels (the Claude Code plugin, the two npm packages, the Agent Skill), and every artifact serving the copy-in kit is deleted.

**Architecture:** The kit directory and its build and gate are removed; the two hand-emitted `.d.ts` in the React layer collapse into ordinary `.generated.ts` sources the package build compiles; and the `.gitignore` rule narrows to "a generated file is tracked when the git tag has to serve it to a browser directly", which untracks everything a script writes under `frameworks/`.

**Tech Stack:** Bun (build, test), Node (portable gates), TypeScript 6.0.3, `node:test` with `node:assert/strict` for every suite under `scripts/`.

**Spec:** [`../specs/2026-08-01-remove-copy-in-kit-design-pending-1.md`](../specs/2026-08-01-remove-copy-in-kit-design-pending-1.md). Rename that file to drop `-pending-1` in the final task.

## Global Constraints

- Every `.md` file stays under 60,000 characters. Measure with `node -e "console.log(require('fs').readFileSync('X','utf8').length)"`, never `wc -m`.
- Documentation punctuates with a colon, a comma, a semicolon or a full stop, never with an em dash. Code fences keep whatever the code contains.
- Documentation is written in the present tense and describes what Arena is, never what it was or when a part of it arrived.
- English only, in code, comments, docs and UI copy. No emoji.
- A file under `scripts/` or a test file carries at most **one** comment, at most 10 lines, as a file header. Everything else carries none.
- A commit message containing a backtick uses `git commit -q -F - <<'MSG' ... MSG`, never `-m "..."`.
- `bun run check` runs **once**, in the final task. Individual gates run per task as each task states.
- Never rewrite git history. Never `git push` unless asked.

---

## Task 1: A `.ts` specifier reaches the tarball as `.js`

This task fixes a live defect in `@dravensoft/arena-react@5.0.0` found while planning, and it comes first because Task 4 rewrites the same function. `rewriteSourceSpecifiers` matches `.jsx` and `.tsx` but not `.ts` and `.js`, so every relative `.ts` specifier survives into `frameworks/react/dist/`, where no TypeScript exists. Fourteen emitted modules carry one, including the entry point, and `import('frameworks/react/dist/Index.generated.js')` fails with `ERR_MODULE_NOT_FOUND`. The Angular package is unaffected, because ng-packagr resolves its own.

**Files:**
- Modify: `scripts/build/react/build-react-package.mjs:55-57`
- Test: `scripts/build/react/build-react-package.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `rewriteSourceSpecifiers(code: string) => string`, unchanged in name and arity, now rewriting a trailing `.ts`, `.tsx`, `.js` or `.jsx` on a relative specifier to `.js`.

- [ ] **Step 1: Write the failing test**

Add to `scripts/build/react/build-react-package.test.mjs`, directly after the existing test named `the word jsx inside a path is not an extension`:

```js
test('a .ts specifier reaches the tarball as .js, because dist holds no TypeScript', () => {
  assert.equal(rewriteSourceSpecifiers("from './UseDialogModal.ts'"), "from './UseDialogModal.js'");
  assert.equal(rewriteSourceSpecifiers("from '../../../DataVisuals.ts'"), "from '../../../DataVisuals.js'");
  assert.equal(rewriteSourceSpecifiers("from './Button.tsx'"), "from './Button.js'");
  assert.equal(rewriteSourceSpecifiers("from './Tokens.generated.js'"), "from './Tokens.generated.js'",
    'already .js, so the rewrite is a no-op rather than a doubling');
  assert.equal(rewriteSourceSpecifiers("from 'react'"), "from 'react'",
    'a bare specifier is the consumer\'s peer dependency and is never touched');
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
bun test scripts/build/react/build-react-package.test.mjs
```

Expected: FAIL on the first assertion, actual `"from './UseDialogModal.ts'"`.

- [ ] **Step 3: Widen the extension class by one optional character**

In `scripts/build/react/build-react-package.mjs`, replace the body of `rewriteSourceSpecifiers`:

```js
export function rewriteSourceSpecifiers(code) {
  return code.replace(/(from\s*['"])(\.[^'"]+?)\.[jt]sx?(['"])/g, '$1$2.js$3');
}
```

The only change is `[jt]sx` becoming `[jt]sx?`. The lazy `[^'"]+?` still stops at the last dot, so `'./jsx-loader.js'` keeps resolving to itself and the existing test covering it stays green.

- [ ] **Step 4: Run the suite and watch it pass**

```bash
bun test scripts/build/react/build-react-package.test.mjs
```

Expected: PASS, including `the word jsx inside a path is not an extension`.

- [ ] **Step 5: Prove the built package now resolves**

```bash
bun run build:react-package
node --input-type=module -e "import('$PWD/frameworks/react/dist/Index.generated.js').then(()=>console.log('RESOLVED')).catch(e=>console.log('FAILED:', e.code))"
grep -rlE "from ['\"][^'\"]*\.ts['\"]" --include='*.js' frameworks/react/dist | wc -l
```

Expected: `RESOLVED`, and `0` files carrying a `.ts` specifier. Before this task the same two commands print `FAILED: ERR_MODULE_NOT_FOUND` and `14`.

- [ ] **Step 6: Update the header comment, which states the rule this broke**

`scripts/build/react/build-react-package.mjs` opens with a header saying every relative source specifier becomes `.js`. That claim is now true. Change only the clause naming the extensions, so the header reads that a relative specifier ending in `.ts`, `.tsx` or `.jsx` becomes `.js`, in the emitted declarations too. Keep the header at or under 10 lines.

- [ ] **Step 7: Commit**

```bash
git add scripts/build/react/build-react-package.mjs scripts/build/react/build-react-package.test.mjs
git commit -q -F - <<'MSG'
The package rewrote two extensions of four, so its entry point resolved nothing

rewriteSourceSpecifiers matched .jsx and .tsx and left .ts alone, so fourteen
emitted modules named a TypeScript file the tarball does not contain, the entry
point among them. A consumer importing the package got ERR_MODULE_NOT_FOUND on
the first relative .ts specifier the barrel reached.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 2: Delete the copy-in kit

**Files:**
- Delete: `frameworks/react/kit/` (119 tracked files)
- Delete: `scripts/build/react/build-kit.mjs`
- Delete: `scripts/check/react/check-kit-generated.mjs`, `scripts/check/react/check-kit-generated.test.mjs`
- Modify: `scripts/build/react/build-react-package.mjs:59-63` (delete `kitSpecifiers`), `:65-110` (delete the `infix` branches)
- Modify: `scripts/build/react/build-react-package.test.mjs` (drop the `kitSpecifiers` import and its test)
- Modify: `package.json:40,43,52`
- Modify: `scripts/check/arena/check-all.mjs:51`, `scripts/check/arena/check-all.test.mjs:13`
- Modify: `frameworks/react/tsconfig.check.json:28`, `frameworks/react/tsconfig.dist.json:13`

**Interfaces:**
- Consumes: `rewriteSourceSpecifiers` from Task 1.
- Produces: `assembleModules(root, dir) => { written, compiled, declarations }`, with the third parameter gone.

- [ ] **Step 1: Update the gate list assertion first, so the suite drives the deletion**

In `scripts/check/arena/check-all.test.mjs:13`, remove the string `'check:kit'` from the literal array. The array is asserted by value, so it now describes 34 gates.

- [ ] **Step 2: Run it and watch it fail**

```bash
bun test scripts/check/arena/check-all.test.mjs
```

Expected: FAIL, because `check-all.mjs` still registers `check:kit`.

- [ ] **Step 3: Remove the gate registration**

Delete this line from `scripts/check/arena/check-all.mjs:51`:

```js
  { name: 'check:kit', file: 'react/check-kit-generated.mjs' },
```

- [ ] **Step 4: Run it and watch it pass**

```bash
bun test scripts/check/arena/check-all.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Delete the payload, the build and the gate**

```bash
git rm -r -q frameworks/react/kit
git rm -q scripts/build/react/build-kit.mjs \
          scripts/check/react/check-kit-generated.mjs \
          scripts/check/react/check-kit-generated.test.mjs
```

- [ ] **Step 6: Remove the two commands**

In `package.json`, delete the `"build:kit"` and `"check:kit"` entries, and change `build:packages` to:

```json
"build:packages": "bun run build:react-barrel && bun run build:react-package && bun run build:angular-package",
```

- [ ] **Step 7: Collapse `assembleModules` to its one remaining form**

In `scripts/build/react/build-react-package.mjs`, delete `kitSpecifiers` entirely, and rewrite `assembleModules` so the `infix` parameter and every branch reading it are gone:

```js
export function assembleModules(root, dir) {
  const layer = join(root, LAYER);
  const written = [];
  const compiled = [];
  const tsconfig = JSON.stringify({ compilerOptions: { jsx: 'react' } });
  const transpilers = new Map([['tsx', new Bun.Transpiler({ loader: 'tsx', tsconfig })]]);

  const sources = collectFiles(join(layer, 'components'), isSource);
  if (sources.length === 0) throw new Error('build-react-package: found 0 component sources; the layer moved');

  const emit = (from, rel) => {
    written.push(write(dir, rel, rewriteSourceSpecifiers(transpilers.get('tsx').transformSync(readFileSync(from, 'utf8')))));
    compiled.push(rel);
  };

  for (const source of sources) {
    const rel = join('components', relative(join(layer, 'components'), source)).split(sep).join('/');
    emit(source, rel.replace(/\.tsx?$/, '.js'));
  }
  for (const name of ROOT_TS) {
    const from = join(layer, name);
    if (!existsSync(from)) throw new Error(`build-react-package: ${name} is missing from the layer root`);
    emit(from, name.replace(/\.ts$/, '.js'));
  }
  for (const name of [...ROOT_JS, ...ROOT_TYPES, 'Index.generated.d.ts']) {
    const from = join(layer, name);
    if (!existsSync(from)) throw new Error(`build-react-package: ${name} is missing from the layer root`);
    written.push(write(dir, name, rewriteSourceSpecifiers(readFileSync(from, 'utf8'))));
  }

  emitDeclarations(root, dir);
  for (const path of distFiles(dir, (p) => p.endsWith('.d.ts')))
    writeFileSync(path, rewriteSourceSpecifiers(readFileSync(path, 'utf8')));
  const declarations = distFiles(dir, (p) => p.endsWith('.d.ts'));

  const untyped = untypedProblems(compiled, dir);
  if (untyped.length) throw new Error(`build-react-package:\n  ${untyped.join('\n  ')}`);
  return { written, compiled, declarations };
}
```

`outName`, `rewrite`, `opts` and the declaration-renaming branch all existed only for the kit. `rmSync` may now be unused in this file; drop it from the `node:fs` import if so.

- [ ] **Step 8: Drop the kit test**

In `scripts/build/react/build-react-package.test.mjs`, remove `kitSpecifiers` from the import on line 6, and delete the whole test named `the kit names every module for what it is, and never doubles an infix`.

- [ ] **Step 9: Stop excluding a directory that does not exist**

Remove `"./kit"` from the `exclude` array of `frameworks/react/tsconfig.check.json` and of `frameworks/react/tsconfig.dist.json`.

- [ ] **Step 10: Verify**

```bash
bun test scripts/build/react scripts/check/arena/check-all.test.mjs
bun run build:packages
bun run check:packages
bun run check:react-types
```

Expected: all pass, and `build:packages` runs three steps.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -q -F - <<'MSG'
The copy-in kit is deleted, and the package build has one shape again

The kit was the same modules the npm package ships under a second name, so
assembleModules carried an infix parameter, a specifier rewriter and a
declaration-renaming branch that had exactly one caller. All of it goes with
the channel, and check-all registers 34 gates instead of 35.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 3: `Api.generated.d.ts` becomes `Api.generated.ts`

The React layer is the only one emitting the contract types as a declaration file. Angular already emits `Api.generated.ts`, the body is byte-identical, and the file is types-only (40 interfaces and type aliases, no runtime export), which `erasableSyntaxOnly` already guarantees. Every consumer imports it extensionless, so no component changes.

**Files:**
- Modify: `scripts/generate/arena/generate-api-types.mjs:6-9`
- Modify: `scripts/generate/arena/generate-api-types.test.mjs:78-83`
- Modify: `scripts/build/react/build-react-package.mjs:23,93`
- Modify: `scripts/build/react/build-react-package.test.mjs:6,68`
- Delete: `frameworks/react/Api.generated.d.ts`
- Create: `frameworks/react/Api.generated.ts` (by running the generator)

**Interfaces:**
- Consumes: `assembleModules(root, dir)` from Task 2.
- Produces: `API_TARGETS = ['frameworks/react/Api.generated.ts', 'frameworks/angular/Api.generated.ts']`. `ROOT_TYPES` no longer exists; `ROOT_TS` gains `'Api.generated.ts'`.

- [ ] **Step 1: Write the failing test**

In `scripts/generate/arena/generate-api-types.test.mjs`, change the literal in the test named `API_TARGETS names one file per layer, and neither lives under contracts/api/`:

```js
  assert.deepEqual(API_TARGETS, [
    'frameworks/react/Api.generated.ts',
    'frameworks/angular/Api.generated.ts',
  ]);
```

- [ ] **Step 2: Run it and watch it fail**

```bash
bun test scripts/generate/arena/generate-api-types.test.mjs
```

Expected: FAIL, actual still names `Api.generated.d.ts`.

- [ ] **Step 3: Point the generator at the new name**

In `scripts/generate/arena/generate-api-types.mjs`:

```js
export const API_TARGETS = [
  'frameworks/react/Api.generated.ts',
  'frameworks/angular/Api.generated.ts',
];
```

- [ ] **Step 4: Run it and watch it pass**

```bash
bun test scripts/generate/arena/generate-api-types.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Move the file on disk**

```bash
git rm -q frameworks/react/Api.generated.d.ts
bun run generate:api
git add frameworks/react/Api.generated.ts
```

- [ ] **Step 6: Move it from the copy path to the compile path**

In `scripts/build/react/build-react-package.mjs`, delete the `ROOT_TYPES` export on line 23, add the new name to `ROOT_TS`, and drop `ROOT_TYPES` from the copy loop:

```js
export const ROOT_JS = ['Index.generated.js', 'Tokens.generated.js'];
export const ROOT_TS = ['DataVisuals.ts', 'UseContainerWidth.ts', 'UseDialogModal.ts', 'Theme.ts', 'Api.generated.ts'];
```

and in `assembleModules`:

```js
  for (const name of [...ROOT_JS, 'Index.generated.d.ts']) {
```

- [ ] **Step 7: Update the assertion that pinned `ROOT_TYPES`**

In `scripts/build/react/build-react-package.test.mjs`, drop `ROOT_TYPES` from the import on line 6, and replace the `ROOT_TYPES` assertion inside the test named `every layer-root module the package needs is named, and Tokens is among them`:

```js
  assert.ok(ROOT_TS.includes('Api.generated.ts'),
    'the contract types are a source in both layers, compiled like any other');
```

- [ ] **Step 8: Verify the package still assembles and resolves**

```bash
bun test scripts/build/react scripts/generate/arena
bun run build:packages
bun run check:api
bun run check:react-types
node --input-type=module -e "import('$PWD/frameworks/react/dist/Index.generated.js').then(()=>console.log('RESOLVED')).catch(e=>console.log('FAILED:', e.code))"
ls frameworks/react/dist/Api.generated.js frameworks/react/dist/Api.generated.d.ts
```

Expected: all pass, `RESOLVED`, and both `Api.generated.js` (an empty module, since the source is types-only) and its emitted declaration present in `dist/`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -q -F - <<'MSG'
The contract types are a source in both layers, under one name

React emitted them as a hand-written declaration file so the copy-in kit could
ship a .d.ts beside each module with no toolchain. With that channel gone the
shape has no reason left, and the generator writes Api.generated.ts into both
layers. Every consumer already imports it extensionless, so nothing moves.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 4: The barrel is one `Index.generated.ts`

`build-react-barrel.mjs` emits two files today: `Index.generated.js`, whose specifiers carry the source extension, and `Index.generated.d.ts`, whose specifiers carry none. They exist as a pair because the kit needed a declaration it could not compile. One TypeScript source produces both through the route every component already takes.

The distinction the pair encoded survives: `Api.generated` is re-exported as `export type *`, which Bun strips from the runtime emit, so the compiled barrel keeps naming exactly what it names today.

**Files:**
- Modify: `scripts/build/react/build-react-barrel.mjs:90-124`
- Modify: `scripts/build/react/build-react-barrel.test.mjs:6-9,56-75,128-133`
- Modify: `scripts/check/react/check-react-barrel.mjs:1-5`
- Modify: `scripts/build/react/build-react-package.mjs:21-22,93`
- Modify: `scripts/build/react/build-react-package.test.mjs:67-70`
- Delete: `frameworks/react/Index.generated.js`, `frameworks/react/Index.generated.d.ts`
- Create: `frameworks/react/Index.generated.ts` (by running the builder)

**Interfaces:**
- Consumes: `ROOT_TS` and `ROOT_JS` as Task 3 left them; `HELPERS`, `TYPE_ONLY`, `ROOT_PRIVATE`, `BANNER`, `sourceExtension`, `componentModules` unchanged.
- Produces: `barrel(modules, root) => string`, replacing `barrelJs` and `barrelTypes`. `buildBarrel(root) => { files, problems, count }` with `files` holding exactly one entry, keyed `'frameworks/react/Index.generated.ts'`.

- [ ] **Step 1: Write the failing tests**

In `scripts/build/react/build-react-barrel.test.mjs`, change the import on lines 6-9 to name `barrel` instead of `barrelJs` and `barrelTypes`, then replace the three tests on lines 56-75 with these two:

```js
test('the barrel keeps whichever source extension each module is written in', () => {
  const jsx = barrel([{ component: 'Tag', path: './components/display/tag/Tag', ext: '.jsx' }]);
  assert.match(jsx, /export \* from '\.\/components\/display\/tag\/Tag\.jsx';/);
  const tsx = barrel([{ component: 'Badge', path: './components/display/badge/Badge', ext: '.tsx' }]);
  assert.match(tsx, /export \* from '\.\/components\/display\/badge\/Badge\.tsx';/);
  for (const helper of HELPERS) assert.match(jsx, new RegExp(`export \\* from '\\./${helper}\\.(js|ts)';`));
});

test('the contract types lead, and as a type-only export, so the runtime emit drops them', () => {
  const one = barrel([{ component: 'Tag', path: './components/display/tag/Tag', ext: '.tsx' }]);
  for (const t of TYPE_ONLY) {
    assert.match(one, new RegExp(`export type \\* from '\\./${t}\\.ts';`));
    assert.ok(one.indexOf(`'./${t}.ts'`) < one.indexOf('/tag/Tag'));
  }
  assert.ok(one.startsWith(BANNER));
});
```

Then change the last assertion of the final test, on line 132, from `assert.equal(files.size, 2);` to:

```js
  assert.equal(files.size, 1);
```

- [ ] **Step 2: Run them and watch them fail**

```bash
bun test scripts/build/react/build-react-barrel.test.mjs
```

Expected: FAIL at import time, because `barrel` is not exported.

- [ ] **Step 3: Merge the two emitters into one**

In `scripts/build/react/build-react-barrel.mjs`, replace `barrelJs` and `barrelTypes` with:

```js
export function barrel(modules, root = repoRoot) {
  const lines = [
    BANNER,
    ...TYPE_ONLY.map((t) => `export type * from './${t}.ts';`),
    '',
    ...modules.map(({ path, ext }) => reExport(`${path}${ext ?? '.jsx'}`)),
    '',
    ...HELPERS.map((h) => reExport(`./${h}${sourceExtension(join(root, 'frameworks', 'react', h)) ?? '.js'}`)),
  ];
  return `${lines.join('\n')}\n`;
}
```

and change the `files` map inside `buildBarrel` to:

```js
  const files = new Map([
    ['frameworks/react/Index.generated.ts', barrel(modules, root)],
  ]);
```

- [ ] **Step 4: Run them and watch them pass**

```bash
bun test scripts/build/react/build-react-barrel.test.mjs
```

Expected: PASS, including `Tokens.generated stays out, and ROOT_PRIVATE says why`, which iterates `files.values()` and needs no change.

- [ ] **Step 5: Update the two headers that describe the pair**

`scripts/build/react/build-react-barrel.mjs` opens with a header ending "Both outputs are tracked, so the copy-in kit gets an index too, and check-react-barrel.mjs holds them to a fresh run." Replace that sentence so it describes one output held to a fresh run, and drop the kit. `scripts/check/react/check-react-barrel.mjs` opens with "The committed barrel is what a package consumer imports and what the copy-in kit indexes"; drop the kit clause. Both headers stay at or under 10 lines.

- [ ] **Step 6: Move the file on disk**

```bash
git rm -q frameworks/react/Index.generated.js frameworks/react/Index.generated.d.ts
bun run build:react-barrel
git add frameworks/react/Index.generated.ts
```

- [ ] **Step 7: Move the barrel from the copy path to the compile path**

In `scripts/build/react/build-react-package.mjs`:

```js
export const ROOT_JS = ['Tokens.generated.js'];
export const ROOT_TS = ['DataVisuals.ts', 'UseContainerWidth.ts', 'UseDialogModal.ts', 'Theme.ts', 'Api.generated.ts', 'Index.generated.ts'];
```

and the copy loop in `assembleModules` loses its last extra name:

```js
  for (const name of ROOT_JS) {
```

- [ ] **Step 8: Update the assertion that named the barrel among the copied files**

In `scripts/build/react/build-react-package.test.mjs`, inside the test named `every layer-root module the package needs is named, and Tokens is among them`, replace the line asserting `ROOT_JS.includes('Index.generated.js')` with:

```js
  assert.ok(ROOT_TS.includes('Index.generated.ts'),
    'the barrel is a source now, so the same tsc run emits the declaration the manifest names');
```

The two assertions on `exports['.']` in the test named `the manifest names the package, its entry and its types` do **not** change: the manifest still names `./Index.generated.d.ts` and `./Index.generated.js`, which are now emitted rather than copied.

- [ ] **Step 9: Verify the published surface did not move**

```bash
bun test scripts/build/react scripts/check/react
bun run build:packages
bun run check:react-barrel
bun run check:packages
bun run check:react-types
node --input-type=module -e "import('$PWD/frameworks/react/dist/Index.generated.js').then(m=>console.log('RESOLVED', Object.keys(m).length, 'exports')).catch(e=>console.log('FAILED:', e.code))"
grep -c 'Api.generated' frameworks/react/dist/Index.generated.js || echo "0 (type-only, as intended)"
```

Expected: all pass; `RESOLVED` with a non-zero export count; and the compiled barrel naming `Api.generated` zero times, because `export type *` is erased.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -q -F - <<'MSG'
The barrel is one source, and tsc emits the declaration it used to hand-write

Two files existed because the copy-in kit needed an index it could not compile.
One Index.generated.ts takes the route every component already takes, and the
type-only re-export of Api.generated keeps the runtime barrel naming exactly
what it named before. The published entry point and its types do not move.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 5: A generated file is tracked when the tag serves it to a browser

**Files:**
- Modify: `.gitignore:19-40`
- Modify: `scripts/check/arena/check-generated.mjs:27-45`
- Modify: `scripts/check/arena/check-generated.test.mjs:38-55`

**Interfaces:**
- Consumes: the filenames Tasks 3 and 4 produced.
- Produces: an `UNTRACKED` map whose keys are the twelve patterns listed in Step 3.

- [ ] **Step 1: Write the failing test**

In `scripts/check/arena/check-generated.test.mjs`, replace the sorted literal inside the test named `every ignore pattern carries a reason, and each names a real tree`:

```js
  assert.deepEqual(Object.keys(UNTRACKED).sort(), [
    'frameworks/angular/Api.generated.ts',
    'frameworks/angular/Tokens.generated.ts',
    'frameworks/react/Api.generated.ts',
    'frameworks/react/DataVisuals.generated.js',
    'frameworks/react/Index.generated.ts',
    'frameworks/react/Theme.generated.js',
    'frameworks/react/Tokens.generated.js',
    'frameworks/react/UseContainerWidth.generated.js',
    'frameworks/react/UseDialogModal.generated.js',
    'frameworks/react/components/**/*.generated.js',
    'frameworks/react/ui-kits/**/*.generated.js',
    'frameworks/react/vendor/*.generated.js',
    'frameworks/tailwind/Utilities.generated.css',
    'frameworks/tailwind/components/**/*.manifest.generated.ts',
  ]);
```

- [ ] **Step 2: Run it and watch it fail**

```bash
bun test scripts/check/arena/check-generated.test.mjs
```

Expected: FAIL, actual holds the eight patterns of today.

- [ ] **Step 3: Rewrite the `UNTRACKED` map, one reason per family**

In `scripts/check/arena/check-generated.mjs`, replace the whole `UNTRACKED` object:

```js
export const UNTRACKED = {
  'frameworks/react/vendor/*.generated.js':
    'a 975 KB CommonJS->ESM bundle of a devDependency, read only by the demo pages\' importmap.',
  'frameworks/react/components/**/*.generated.js':
    'the compiled sibling of a component source, read only by a demo page.',
  'frameworks/react/ui-kits/**/*.generated.js':
    'the same, for the Delivery Console example app.',
  'frameworks/react/DataVisuals.generated.js':
    'a compiled layer-root helper a demo page loads. A browser cannot execute TypeScript, so a '
    + 'page importing one needs it compiled.',
  'frameworks/react/Theme.generated.js': 'the same, for the theme helper.',
  'frameworks/react/UseContainerWidth.generated.js': 'the same, for the container-width hook.',
  'frameworks/react/UseDialogModal.generated.js': 'the same, for the modal focus helper.',
  'frameworks/react/Index.generated.ts':
    'the layer entry point, derived from the component directories. The package build compiles '
    + 'it and emits its declaration, so the only reader outside this repository is a tarball.',
  'frameworks/react/Api.generated.ts':
    'the contract types, emitted per layer from contracts/api/types/ so a component\'s import '
    + 'never crosses the boundary. check:api holds it to the contracts.',
  'frameworks/angular/Api.generated.ts': 'the same file, emitted into the other layer.',
  'frameworks/react/Tokens.generated.js':
    'the design values JavaScript reads as numbers rather than through CSS, emitted from '
    + 'contracts/design/. check:script-tokens holds it to the source and to the CSS.',
  'frameworks/angular/Tokens.generated.ts': 'the same values, emitted into the other layer.',
  'frameworks/tailwind/components/**/*.manifest.generated.ts':
    'a manifest re-emitted as a typed module, which is the form a variants recipe imports. '
    + 'check:tailwind-generated holds each to a fresh compile of its .manifest.json.',
  'frameworks/tailwind/Utilities.generated.css':
    'the compiled utility layer, read only by the specimen pages. An adopter imports '
    + 'frameworks/angular/theme/arena-tailwind.css and compiles their own.',
};
```

Note the two reasons that lose a clause: the compiled component siblings no longer say "What a consumer copies is `frameworks/react/kit/`, which is tracked", and the four layer-root helpers no longer say they are named one by one to avoid swallowing a tracked `Tokens.generated.js`, which is no longer tracked.

- [ ] **Step 4: Run it and watch it pass**

```bash
bun test scripts/check/arena/check-generated.test.mjs
```

Expected: PASS. The test named `a .generated. file that is neither tracked nor ignored reaches no clone` asserts `1 + Object.keys(UNTRACKED).length` problems and follows the map by construction, so it needs no edit.

- [ ] **Step 5: Replace the ignore block with the one line**

In `.gitignore`, replace lines 19 through 40 (the comment block plus the six anchored patterns) with:

```
# Build products a script under scripts/ rewrites. The .generated. infix says a script
# writes the file; this block says which of those are untracked. Rebuild them with
# `bun run build` -- see scripts/build/README.md.
#
# A generated file is tracked when the git tag has to serve it to a browser directly:
# contracts/design-generated/ and assets/fonts/, because the Claude Code plugin is served
# from the tag and ignoring them would ship one whose intro/styles.css @imports resolve to
# nothing, unstyled and with no console error. Everything a script writes under frameworks/
# is read by Arena's own tooling or assembled into a package, and is ignored. Each reason
# lives beside its pattern in UNTRACKED, in scripts/check/arena/check-generated.mjs.
/frameworks/**/*.generated.*
```

Leave `/frameworks/react/dist/` and `/frameworks/angular/dist/` above it exactly as they are.

- [ ] **Step 6: Take the 42 newly ignored files out of the index**

```bash
git rm -r -q --cached frameworks/react/Tokens.generated.js \
                      frameworks/angular/Api.generated.ts \
                      frameworks/angular/Tokens.generated.ts \
                      frameworks/tailwind/components
git add frameworks/tailwind/components
git ls-files | grep -c '\.generated\.'
```

The second `git add` puts back the `.manifest.json` sources and the specimen pages that share those directories, keeping only the 39 generated modules removed. Expected: `6`, being the five `contracts/design-generated/*.css` and `assets/fonts/Fonts.generated.json`.

`Api.generated.d.ts`, `Index.generated.d.ts` and `Index.generated.js` are not in this list: Tasks 3 and 4 already removed them, and their replacements were added before this task ignored them, so those three names also need clearing from the index if `git status` still shows them as tracked. Check with `git ls-files frameworks/react/Api.generated.ts frameworks/react/Index.generated.ts` and `git rm --cached` whatever it prints.

- [ ] **Step 7: Verify the tracked set is exactly the rule**

```bash
bun run check:generated
git ls-files | grep '\.generated\.'
```

Expected: the gate passes, and the listing holds only `contracts/design-generated/*.css` and `assets/fonts/Fonts.generated.json`. A file still in the index and ignored is reported by the gate as "ignored by pattern yet still in the index", so a missed `git rm --cached` fails here rather than passing quietly.

- [ ] **Step 8: Prove a clean tree still builds everything it now ignores**

```bash
rm -f frameworks/react/Api.generated.ts frameworks/react/Index.generated.ts frameworks/react/Tokens.generated.js
rm -f frameworks/angular/Api.generated.ts frameworks/angular/Tokens.generated.ts
find frameworks/tailwind/components -name '*.manifest.generated.ts' -delete
bun run build
bun run check:generated && bun run check:api && bun run check:script-tokens && bun run check:tailwind-generated
```

Expected: `bun run build` recreates all 44 files and every gate passes. This is the fresh-clone rehearsal in miniature and it is worth running, because these files stop reaching a clone in this commit.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -q -F - <<'MSG'
A generated file is tracked when the tag serves it to a browser, and no wider

The tracked half of the rule had one consumer under frameworks/, and it was the
copy-in kit. With it gone, the six anchored patterns and the note explaining why
each is anchored collapse into one line, and 42 files leave the index. The
reasons stay one per family in UNTRACKED, which fails a pattern matching nothing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 6: Arena ships three ways

**Files:**
- Modify: `README.md:8,62-79,85`
- Modify: `frameworks/react/README.md:145-151,166-168`
- Modify: `CLAUDE.md:37,396`
- Modify: `frameworks/PACKAGING.md:3-6`
- Modify: `scripts/check/react/README.md:9`
- Modify: `scripts/build/react/README.md:7,14`
- Modify: `scripts/build/README.md`
- Modify: `scripts/generate/arena/README.md:6`
- Modify: `contracts/README.md:42`
- Modify: `frameworks/angular/README.md:36`
- Modify: `frameworks/react/test/Theme.dom.test.tsx:26`
- Modify: `frameworks/angular/theme/ThemeService.test.ts:130`
- Modify: `CHANGELOG.md`
- Rename: `docs/superpowers/specs/2026-08-01-remove-copy-in-kit-design-pending-1.md`

- [ ] **Step 1: The root README**

Line 8 becomes:

```markdown
Arena ships three ways: as a **Claude Code plugin**, as two **npm packages**, and as a downloadable **Agent Skill** (`SKILL.md`).
```

Delete the whole section `### Use in a project (copy-in kit)`, lines 62 to 79, with nothing in its place. The npm section above it already carries the install, the `arena.config.json` and the `arena-theme` invocation, and that is now the only route to Arena's stylesheet bytes, a throwaway prototype included.

In the `### Dependencies` list, the fonts bullet ends "copy `assets/`, which includes `fonts/`, with the kit, and fonts load from your own origin". Change that clause so it states the property without the channel: the packages carry the binaries, and fonts load from the consumer's own origin with no CDN request.

- [ ] **Step 2: The React layer README**

Delete the section `## The copy-in kit is built, not maintained`, lines 145 to 151, and the paragraph that follows it about the `.generated.` infix earning its keep twice, which is about the kit.

In the section `## Demos are compiled ahead of time`, the sentence "What a consumer copies is `kit/`, which is tracked and which `build:kit` derives from this layer" is deleted. The surrounding claim, that the compiled siblings and the vendor bundles are git-ignored because only demo pages read them, stays and now needs no contrast.

- [ ] **Step 3: `CLAUDE.md`**

Line 37 is the copy-in bullet in the list of what the repository ships at once. Delete it, and change the sentence introducing that list from four things to three.

Line 396 reads "**`check:react-types` compiles the layer and `check:kit` holds the tracked copy-in payload to a fresh build.**" Reduce it to the surviving half, about `check:react-types` compiling the layer.

Two further sentences in that file describe the tracked payload and need the narrowed rule: the paragraph beginning "**A file a script under `scripts/` writes is named `<stem>.generated.<ext>`**", which says the payload a consumer copies stays committed, and the clause naming `frameworks/react/vendor/`, the compiled `.tsx` siblings and `Utilities.generated.css` as what is ignored. State the rule as Task 5 states it: tracked when the tag serves it to a browser, and everything a script writes under `frameworks/` is ignored. Read the paragraph in full before editing it; it describes itself.

- [ ] **Step 4: `frameworks/PACKAGING.md`**

Lines 3 to 6 open "Arena ships four ways from one tree. Three of them assume the consumer has this repository: the Claude Code plugin, served from the git tag; the copy-in kit; and the Agent Skill." Change it to three ways, two of which assume the repository: the plugin and the Agent Skill.

Line 66 names `Index.generated.js` as what `build:react-barrel` derives from the component directories. The barrel is `Index.generated.ts` now, and the package build compiles it into the `Index.generated.js` the tarball holds. Say which of the two the sentence means.

- [ ] **Step 5: The `scripts/` READMEs**

- `scripts/check/react/README.md`: delete the `check-kit-generated.mjs` row from the table.
- `scripts/build/react/README.md`: the `build-react-barrel.mjs` row names two outputs; it names one, `frameworks/react/Index.generated.ts`. Line 14 says the barrel is tracked because a package consumer imports it and the copy-in kit indexes it, "which is the same audience test `contracts/design-generated/`" applies; the barrel is no longer tracked, so state that the package build compiles it and drop the kit.
- `scripts/build/README.md` is the first-compile document. It gains the 44 files that stop reaching a clone in Task 5: both layers' `Api.generated.*` and `Tokens.generated.*`, `frameworks/react/Index.generated.ts` and the Tailwind manifest modules, all written by `bun run build`. Read the file in full first; it describes what a fresh clone must build, and that list is exactly what changed.
- `scripts/generate/arena/README.md:6` says the generator writes `Api.generated.*` in both framework layers, which stays true and needs no edit. Confirm by reading it rather than assuming.
- `contracts/README.md:42` says `api/` generates `Api.generated.*`, also still true. Confirm the same way.

- [ ] **Step 6: The three sentences that cite the channel as a witness**

Each asserts something true about the two palettes a package ships by default and justifies it by naming the dead channel. Change the justification, not the assertion.

`frameworks/react/test/Theme.dom.test.tsx:26`:

```tsx
test('the shipped default is dark and light, which is what the package carries', () => {
```

`frameworks/angular/theme/ThemeService.test.ts:130`:

```ts
test('the shipped default is two palettes, which is what the package carries', () => {
```

`frameworks/angular/README.md:36` reads "`light`, which is what an adopter on the copy-in kit has". Change it to what an adopter on the package has.

- [ ] **Step 7: The changelog**

Add to the existing `## [Unreleased]` section a `### Removed` subsection. The entry is breaking: the copy-in kit is no longer a channel, and a project consuming Arena by copying `frameworks/react/kit/` installs `@dravensoft/arena-react` instead. Record with it the two consequences a reader needs: nothing a script writes under `frameworks/` is tracked any more, so a fresh clone runs `bun run build` before anything resolves; and the React layer's two hand-emitted declarations are now ordinary sources.

Add a separate `### Fixed` entry for Task 1, which is the one change in this batch a consumer of 5.0.0 can observe: the React package's relative `.ts` specifiers reached the tarball unrewritten, so its entry point failed to resolve.

Do not edit any versioned entry above `[Unreleased]`; those describe trees that are frozen at a tag.

- [ ] **Step 8: Drop the spec's pending suffix, now that the plan exists**

```bash
git mv docs/superpowers/specs/2026-08-01-remove-copy-in-kit-design-pending-1.md \
       docs/superpowers/specs/2026-08-01-remove-copy-in-kit-design.md
```

Then update the `**Spec:**` link at the top of this plan to match.

- [ ] **Step 9: Verify the prose**

```bash
bun run check:docs
grep -rn --binary-files=without-match -i "copy-in\|build:kit\|check:kit" \
    --include='*.md' --include='*.json' --include='*.mjs' --include='*.ts' --include='*.tsx' \
    . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=superpowers \
    | grep -v CHANGELOG.md
```

Expected: `check:docs` passes, and the grep returns nothing. `CHANGELOG.md` keeps its frozen entries, and `docs/superpowers/` holds this plan and its spec, which name the channel by subject and are deleted in Task 7.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -q -F - <<'MSG'
Arena ships three ways, and every document says the same three

The copy-in section of the root README goes with nothing in its place: the npm
section above it is the only route to Arena's stylesheet bytes now, a throwaway
prototype included. Three sentences cited the channel as a witness to something
still true, and keep the claim while changing the justification.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Task 7: The full sweep

**Files:** none modified unless a gate fails.

- [ ] **Step 1: Build from clean and run every gate**

```bash
bun run build
bun run check 2>&1 | tail -40
```

Expected: every gate `PASS` or `SKIP`, and the run reported complete rather than `INCOMPLETE`. Three gates need a headless browser or a Bun-only builder; if one reports `SKIP`, that is the documented behaviour, and `CHROME_PATH` makes `check:cards` and `check:focus-trap` run.

- [ ] **Step 2: Run the whole test surface through the one authority**

```bash
bun run test
```

This is the merged invocation `testStep()` names. Do not narrow it: `bun test frameworks/react` never matches `scripts/`, so a narrowed run reports green over a tree whose real run is red.

- [ ] **Step 3: Rehearse a fresh clone**

```bash
SCRATCH=$(mktemp -d)
git clone -q --no-hardlinks . "$SCRATCH/arena"
cd "$SCRATCH/arena" && bun install --silent && bun run build && bun run check 2>&1 | tail -20
cd - && rm -rf "$SCRATCH"
```

Expected: the clone builds and checks green. The untracked set grew by 44 files in this batch, so a clone that cannot rebuild them is the specific failure this step exists to catch.

- [ ] **Step 4: Confirm the published surface one last time**

```bash
bun run build:packages
node --input-type=module -e "import('$PWD/frameworks/react/dist/Index.generated.js').then(m=>console.log('RESOLVED', Object.keys(m).length, 'exports')).catch(e=>console.log('FAILED:', e.code))"
```

Expected: `RESOLVED` with a non-zero export count.

- [ ] **Step 5: Delete the plan and the spec, which are executed**

```bash
git rm -q docs/superpowers/plans/2026-08-01-remove-copy-in-kit.md \
          docs/superpowers/specs/2026-08-01-remove-copy-in-kit-design.md
git commit -q -F - <<'MSG'
The plan and its spec are deleted, because they were executed

Debt a plan carries dies with it, so anything worth keeping is already in a
gate, a suite, a normative README or a component's prompt.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

- [ ] **Step 6: Report what a release still needs**

Do not cut a release. Report to the user that `@dravensoft/arena-react@5.0.0` is live on npm with an entry point that does not resolve, that Task 1 fixes it, and that the fix reaches consumers only through a new version, which moves six things and is a separate act.
