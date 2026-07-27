# 8C11 — The Angular test directory compiles before it runs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compile `frameworks/angular/test/` with `ngc --strictTemplates` and run the suites from the
emitted JavaScript, so the directory is typechecked by construction, its templates are real Angular,
and the JIT bypass convention can be retired.

**Architecture:** A second tsconfig emits the barrel plus the test directory to `build/angular-test/`.
`test:angular` and `test` build first and then run `bun test` over the emitted tree; `testStep()`
gains the build as its first entry. `check:angular` is untouched — it still compiles the shipped
barrel alone, and `GATES` stays at 21. The typecheck of the test surface is a consequence of the
build rather than a new gate.

**Tech Stack:** `@angular/compiler-cli` 22.0.7 (`ngc`), Bun (test runner, scripts), `node:test` +
`node:assert/strict`, `happy-dom`.

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only**, in code, comments, docs and commit messages. No emoji. The repo was fully
   translated from Spanish; Spanish must never reappear.
2. **A commit message containing a backtick uses a quoted here-doc** — `git commit -q -F - <<'MSG'
   … MSG` — never `git commit -m`. A backtick inside a double-quoted shell string opens command
   substitution and is silently spliced away. Verify with `git log -1 --format=%B`.
3. **The first step of every task is `git status --short`**, and it must be clean.
4. **`bun run check` in full runs ONCE, at close-out** (Task 4), with `CHROME_PATH=/usr/bin/chromium`
   exported and `ARENA_CHECK_STRICT=1`. Individual gates and suites are cheap and expected per task.
5. **No Angular source, no React source, no contract, no binding, no token.** Nothing under
   `frameworks/angular/primitives/`, `frameworks/react/`, `api/`, `behaviour/` or `tokens/` may
   change. In particular **`BulkActionBar.classesFor` stays `protected`** — a shipped component's
   surface does not widen to serve its own suite. Where an induction deliberately breaks such a file,
   it must be restored byte-identically and proved with `sha256sum -c`.
6. **`frameworks/angular/tsconfig.test.json` relaxes NOTHING.** Its `compilerOptions` may contain
   only `outDir`, `sourceMap`, `incremental` and `tsBuildInfoFile` — build configuration, not
   leniency — and no `angularCompilerOptions` at all. Every strictness setting is inherited from
   `tsconfig.check.json` unchanged. Task 2 asserts this mechanically so it cannot quietly acquire an
   exemption later.
7. **`check:angular` does not change behaviour.** It compiles `./index.ts` and prints what it prints
   today. `typecheck()`'s signature does not change, so the two commented-out call sites in
   `scripts/check-angular.test.mjs` that Plan E will uncomment verbatim stay valid.
8. **Do NOT unsuspend any of the seven `PLAN-E-SUSPENDED` tests**, and do not add an eighth. This
   batch adds no gate, so it has nothing to suspend. The count stays at seven.
9. **Never weaken a gate, a test or an assertion** to make something agree. If a test's premise has
   genuinely inverted — and Task 3 contains two that have — rewrite it to assert the new truth and
   say so in the commit, never delete it to make a number come out.
10. **`git checkout -- <path>` restores from the INDEX, not HEAD.** An induction that edits a file
    the task has already modified must `git add -A` FIRST, then break it, then
    `git checkout -- <path>`. Unstaged, the restore silently reverts the task's own work and
    `sha256sum -c` will not catch it, because the hash was taken after those edits.
11. **No `.jsx` changes anywhere in this batch, so `bun run build:demos` is not needed.**
12. **`build/angular-test/` is generated output and is never committed.** `.gitignore` already
    carries `build/`; Task 2 verifies that rather than assuming it.

---

## What this plan measured before it was written

Read off the tree on 2026-07-27, branch `angular-test-typecheck-8c11`, at `f117b05`. Every figure
below was produced by running the thing, and the spike that produced them was reverted — the tree is
clean and `bun test frameworks/angular/test` reports 341 pass / 0 fail.

| measure | value |
|---|---|
| `.ts` files in `frameworks/angular/test/` | 34 — 32 suites, plus `testbed-env.ts` and `compliance.ts` |
| `@Component` in that directory | 14, **all** in `host-class-binding.test.ts` |
| files with `@Injectable`/`@Directive`/`@Pipe`/`template:` outside that file | none |
| errors under `ngc` on the clean tree | 4 (TypeScript), which **mask** 6 more |
| errors under `ngc` once those 4 are fixed | 6 × `NG8008` |
| errors under `tsc --noEmit` on the clean tree | the same 4, and no template diagnostics |
| `ngc` emit, cold | 6.6s, 119 `.js` files |
| `bun test` over the emitted tree | 1.5s — 341 tests across 32 files, the same counts as today |
| that run | **312 pass, 29 fail** |
| bypass sites (`x['input'] = …`) | 41, across exactly 6 files |
| `GATES` in `scripts/check-all.mjs` | 21, asserted by literal value at `check-all.test.mjs:9` |
| `bun run check` | 23 steps today; **24** after this batch |
| `PLAN-E-SUSPENDED` tests | 7, and this batch leaves it at 7 |
| `bun test scripts` | 602 tests across 33 files |

**The 29 failures have exactly two causes.** Measured, not inferred:

- **24** — all in `host-class-binding.test.ts` — are one identical
  `TypeError: undefined is not an object (evaluating 'inputSignalNode.transformFn')`. The bypass
  overwrites a child's instance field with a plain arrow function, which destroys the
  `InputSignal`'s `[SIGNAL]` brand; a now-real template binding then writes to it and explodes.
- **5** are `ENOENT`, from paths resolved relative to `import.meta.url`: the manifest sweep at
  `host-class-binding.test.ts:1316-1317`, and four suites loading a `*.behaviour.json` through
  `compliance.ts`'s `ANGULAR_PRIMITIVES` (`chart-data-table` twice, `alert-role-tones`, `tag-cases`).
  The emit writes **zero** `.json` under `build/angular-test/angular/primitives/` or
  `.../tailwind/components/`.

Facts the tasks depend on, each read off the source:

- `scripts/check-angular.mjs`'s `typecheck(opts = {})` locates `ngc` at
  `node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js` and throws a named error when it is
  missing.
- `frameworks/angular/tsconfig.check.json` sets `"rootDir": ".."`, so **`rootDir` resolves to
  `frameworks/`** and an `outDir` of `build/angular-test` puts the suites at
  `build/angular-test/angular/test/`.
- `bun test` silently matches nothing under a dot-directory. The output directory must be visible.
- `.gitignore` already carries `build/`.
- `runStep()` in `check-all.mjs` spawns `process.execPath` with the step's args, so under bun a step
  of `['run', 'build:angular-tests']` runs that package script.
- `compliance.ts:37-46` computes `here` from `import.meta.url` and `REPO` as `join(here,'..','..','..')`.
- `host-class-binding.test.ts:1316-1317` recomputes both paths inline instead of importing them.

---

## File Structure

**Created**

- `frameworks/angular/tsconfig.test.json` — the emit project. Extends `tsconfig.check.json`,
  overrides only `files`/`include`, and adds build configuration only.
- `scripts/build-angular-tests.mjs` — runs `ngc` over that project. One responsibility: emit, or
  fail loudly.

**Modified**

- `frameworks/angular/test/compliance.ts` — the repo-root helper, and the two now-false clauses in
  its `@ts-expect-error` comments.
- `frameworks/angular/test/host-class-binding.test.ts` — paths, the six templates, `TS4111`, and the
  bulk of the bypass retirement.
- `frameworks/angular/test/chart-internals.test.ts` — the live defect and the unresolvable import.
- `frameworks/angular/test/bulk-action-bar-variants.test.ts` — the protected-member reach.
- `frameworks/angular/test/chart-data-table.test.ts`, `alert-role-tones.test.ts`,
  `tag-cases.test.ts`, `skeleton-dimensions.test.ts`, `tag-remove.test.ts` — bypass retirement.
- `scripts/check-angular.mjs` — `ngcBin()` extracted and exported. No behaviour change.
- `scripts/check-angular.test.mjs` — live config assertions.
- `scripts/check-all.mjs` — `testStep()` gains the build entry and points at the emitted tree.
- `scripts/check-all.test.mjs` — the literal `testStep` assertion.
- `package.json` — `build:angular-tests`, `test:angular`, `test`.
- `CLAUDE.md` — Task 4.

**Not modified, and each is a result rather than an omission:** everything under
`frameworks/angular/primitives/`, `frameworks/react/`, `api/`, `behaviour/`, `tokens/`, and
`GATES` in `scripts/check-all.mjs`.

---

## Task 1: Paths resolve to the source tree, not to wherever the file sits

This task changes no behaviour under today's harness and is verifiable on its own: the four suites
that load a binding through `ANGULAR_PRIMITIVES` keep passing, which is exactly the assertion that
the path still resolves. It is first because it removes 5 of the 29 failures before the migration
that would otherwise have to debug them.

**Files:**
- Modify: `frameworks/angular/test/compliance.ts`
- Modify: `frameworks/angular/test/host-class-binding.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ANGULAR_PRIMITIVES`, `TAILWIND_COMPONENTS` and `PATTERN_DIR`, all absolute path strings
  exported from `frameworks/angular/test/compliance.ts`, all rooted at the real repository root.
  Task 3 relies on `ANGULAR_PRIMITIVES` continuing to resolve from the emitted tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Read what you are about to replace**

```bash
sed -n '28,48p' frameworks/angular/test/compliance.ts
sed -n '1314,1320p' frameworks/angular/test/host-class-binding.test.ts
```

Expected: `compliance.ts` computes `here` from `fileURLToPath(import.meta.url)`, then
`ANGULAR_PRIMITIVES = join(here, '..', 'primitives')` and `const REPO = join(here, '..', '..', '..')`;
`host-class-binding.test.ts` recomputes `primitivesDir` and `manifestsDir` inline with the same
technique. If either differs, STOP — this task is derived from that shape.

- [ ] **Step 3: Add the repo-root helper to `compliance.ts`**

That file has **no** `node:fs` import today — measured; its only node imports are
`fileURLToPath` from `node:url` at line 28 and `dirname, join` from `node:path` at line 29. So add
one:

```ts
import { existsSync } from 'node:fs';
```

and replace `const REPO = join(here, '..', '..', '..');` with:

```ts
/** The repository root, found by walking up from this file to the directory holding
 *  `package.json`, rather than by counting `../` hops.
 *
 *  A fixed hop count is correct for exactly one location, and this suite has two:
 *  `frameworks/angular/test/` in source, and `build/angular-test/angular/test/` once
 *  `ngc` has emitted it. The emitted tree holds the compiled `.js` and NONE of the
 *  `.json` data these suites read -- measured: zero `.json` under the emitted
 *  `primitives/` or `tailwind/components/` -- so a hop count resolves there to a
 *  directory that exists, contains the wrong things, and fails as ENOENT rather
 *  than as anything a reader would recognise. Walking to a marker resolves to the
 *  real source tree from both, which also keeps every suite runnable from its own
 *  source directory. */
function findRepoRoot(from: string): string {
  let dir = from;
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`no package.json above ${from} -- cannot locate the repository root`);
    dir = parent;
  }
  return dir;
}

const REPO = findRepoRoot(here);
```

- [ ] **Step 4: Re-root the exported paths and add the missing one**

In the same file, replace the `ANGULAR_PRIMITIVES` declaration with the two below, keeping its
existing doc comment on the first and giving the second its own. `PATTERN_DIR` already reads
`join(REPO, 'behaviour', 'patterns')` and needs no edit — it now resolves through the new `REPO`.

```ts
export const ANGULAR_PRIMITIVES = join(REPO, 'frameworks', 'angular', 'primitives');

/** Absolute path of frameworks/tailwind/components, where the `*.manifest.json`
 *  files live. Exported here rather than recomputed by each suite, because the
 *  hop count from a suite is one of the two things that breaks once the suite runs
 *  from the emitted tree. */
export const TAILWIND_COMPONENTS = join(REPO, 'frameworks', 'tailwind', 'components');
```

- [ ] **Step 5: Make `host-class-binding.test.ts` consume them instead of recomputing**

Add to its imports:

```ts
import { ANGULAR_PRIMITIVES, TAILWIND_COMPONENTS } from './compliance';
```

and replace lines 1316-1317:

```ts
  const primitivesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'primitives');
  const manifestsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tailwind', 'components');
```

with:

```ts
  const primitivesDir = ANGULAR_PRIMITIVES;
  const manifestsDir = TAILWIND_COMPONENTS;
```

Leave `fileURLToPath` imported only if something else in the file still uses it — check with
`grep -n 'fileURLToPath' frameworks/angular/test/host-class-binding.test.ts` and remove the now-dead
import if it has no other use, because an unused import is a `TS6133` the moment Task 2 points a
compiler at this file.

- [ ] **Step 6: Run the suites**

```bash
bun test frameworks/angular/test
```

Expected: **341 pass, 0 fail**, unchanged. This is the whole verification of the task, and it is a
real one rather than a formality: `chart-data-table`, `alert-role-tones` and `tag-cases` each
`readFileSync` a `*.behaviour.json` through `ANGULAR_PRIMITIVES`, and `host-class-binding`'s manifest
sweep reads every `*.manifest.json` through `TAILWIND_COMPONENTS`. A wrong root is `ENOENT`, not a
subtle drift.

- [ ] **Step 7: Induction — a wrong root fails loudly**

```bash
git add -A
sha256sum frameworks/angular/test/compliance.ts > "${CLAUDE_JOB_DIR:-/tmp}/8c11-compliance.sha"
```

Temporarily change `findRepoRoot`'s marker from `'package.json'` to `'package.json.nope'`. Then:

```bash
bun test frameworks/angular/test 2>&1 | tail -20
```

Expected: FAIL, with the thrown `no package.json.nope above … -- cannot locate the repository root`.
Report the message verbatim. Restore:

```bash
git checkout -- frameworks/angular/test/compliance.ts
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c11-compliance.sha"   # OK
bun test frameworks/angular/test                              # 341 pass, 0 fail
```

- [ ] **Step 8: Commit**

```bash
git commit -q -F - <<'MSG'
refactor(angular-test): resolve data paths to the repository root, not to a hop count

`compliance.ts` computed the repository root as `join(here, '..', '..', '..')` and
`host-class-binding.test.ts` recomputed two more paths the same way. A fixed hop
count is correct for exactly one location, and this directory is about to have two:
its source, and `build/angular-test/angular/test/` once ngc emits it.

The emitted tree is the trap rather than an inconvenience. It holds the compiled
`.js` and none of the `.json` these suites read -- measured: zero `.json` under the
emitted `primitives/` or `tailwind/components/` -- so a hop count resolves there to
a directory that exists and contains the wrong things. Measured against the emitted
tree, that is five of the twenty-nine failures the AOT move produces: the manifest
sweep, plus every suite that loads a `*.behaviour.json` through ANGULAR_PRIMITIVES.

So the root is found by walking up to the `package.json`, which resolves to the real
source tree from either location and keeps every suite runnable from its own
directory. `TAILWIND_COMPONENTS` is exported beside `ANGULAR_PRIMITIVES` rather than
recomputed at the one call site, for the same reason the first one was exported.

No behaviour changes under today's harness: 341 pass, 0 fail, unchanged. Induced by
changing the marker to one that does not exist and watching the suites fail with the
helper's own message; restored and verified with sha256sum -c.
MSG
```

---

## Task 2: The emit exists, and it is clean

**Files:**
- Create: `frameworks/angular/tsconfig.test.json`, `scripts/build-angular-tests.mjs`
- Modify: `scripts/check-angular.mjs`, `scripts/check-angular.test.mjs`, `package.json`
- Modify: `frameworks/angular/test/chart-internals.test.ts`,
  `frameworks/angular/test/bulk-action-bar-variants.test.ts`,
  `frameworks/angular/test/host-class-binding.test.ts`

**Interfaces:**
- Consumes: Task 1's `ANGULAR_PRIMITIVES` / `TAILWIND_COMPONENTS` (unchanged by this task).
- Produces: `bun run build:angular-tests`, which emits to `build/angular-test/`; the suites land at
  `build/angular-test/angular/test/*.test.js`. Also `ngcBin(root?)` exported from
  `scripts/check-angular.mjs`, returning the absolute path of the `ngc` binary and throwing the
  existing named error when it is absent. Task 3 runs the build; nothing else consumes `ngcBin`.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Confirm `build/` is already ignored, rather than assuming it**

```bash
git check-ignore -v build/angular-test
```

Expected: a line naming `.gitignore` and the `build/` pattern. If it prints nothing, STOP and report
— `.gitignore` would need a line and this plan says it does not.

- [ ] **Step 3: Extract `ngcBin()` from `typecheck()`**

In `scripts/check-angular.mjs`, above `typecheck()`, add:

```js
/** Absolute path of the ngc binary, or a named throw when the toolchain is absent.
 *  Extracted so `scripts/build-angular-tests.mjs` locates it the same way this gate
 *  does rather than hardcoding a second copy of the path.
 *  @param {string} [root] @returns {string} */
export function ngcBin(root = repoRoot) {
  const bin = join(root, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js');
  if (!existsSync(bin))
    throw new Error(`@angular/compiler-cli is not installed at ${bin} — run \`bun install\` before check:angular`);
  return bin;
}
```

Then, inside `typecheck()`, replace its two lines that compute `bin` and throw with:

```js
  const bin = ngcBin(root);
```

**`typecheck()`'s signature does not change** (Global Constraint 7), and neither does `main()`.

- [ ] **Step 4: Create the emit project**

`frameworks/angular/tsconfig.test.json`, exactly:

```json
{
  "extends": "./tsconfig.check.json",
  "compilerOptions": {
    "outDir": "../../build/angular-test",
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": "../../build/angular-test/.tsbuildinfo"
  },
  "files": [],
  "include": ["./test/**/*.ts", "./index.ts"]
}
```

`"files": []` is not decoration — it overrides the inherited `["./index.ts"]` so `include` decides
the file set. `./index.ts` stays in `include` because the suites reach the primitives through the
barrel's own types.

**Those four `compilerOptions` are the whole permitted set** (Global Constraint 6): build
configuration, not leniency. Every strictness setting is inherited. Step 8 asserts it mechanically.

- [ ] **Step 5: Write the build script**

`scripts/build-angular-tests.mjs`:

```js
/** Emit frameworks/angular's test surface with ngc.
 *
 *  This is a BUILD, not a gate, and the distinction is the point of the batch it
 *  arrived in. `check:angular` compiles `./index.ts` -- the shipped surface -- and
 *  says whether the layer typechecks. This compiles the test surface and produces
 *  the JavaScript the suites actually run, so a type error here does not merely
 *  fail an assertion somewhere: the tests cannot run at all. That is why no gate
 *  was added for the test directory and why GATES did not move.
 *
 *  It also makes the templates real. Under `@angular/compiler`'s JIT a signal input
 *  cannot be driven through a template binding, which is what forced this
 *  directory's bypass convention and left fourteen inline templates that were not
 *  valid Angular. Compiled by ngtsc they are, and strictTemplates covers them. */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ngcBin } from './check-angular.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'frameworks/angular/tsconfig.test.json';

function main() {
  let bin;
  try {
    bin = ngcBin(repoRoot);
  } catch (err) {
    console.error(`build-angular-tests: ${err.message}`);
    process.exit(1);
  }
  const r = spawnSync(process.execPath, [bin, '-p', join(repoRoot, PROJECT)], { stdio: 'inherit', cwd: repoRoot });
  if (r.error) {
    console.error(`build-angular-tests: ngc failed to spawn: ${r.error.message || r.error}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error('\nbuild-angular-tests: the Angular test surface does not compile, so its suites cannot run');
    process.exit(r.status ?? 1);
  }
  console.log('build-angular-tests: the Angular test surface compiled to build/angular-test');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 6: Add the package script**

In `package.json`, beside the other `build:` entries:

```json
    "build:angular-tests": "bun scripts/build-angular-tests.mjs",
```

Leave `test:angular` and `test` alone — Task 3 owns them.

- [ ] **Step 7: Watch the build fail, and read what it found**

```bash
bun run build:angular-tests
```

Expected: FAIL, reporting **exactly four** TypeScript errors — `TS2445` at
`bulk-action-bar-variants.test.ts:89`, `TS2339` at `chart-internals.test.ts:17`, `TS2307` at
`chart-internals.test.ts:157`, `TS4111` at `host-class-binding.test.ts:1336`. Record the output
verbatim in your report.

If Task 1 removed the `fileURLToPath` import and something still used it, you will also see a
`TS6133`; fix that as part of Task 1's intent and note it.

- [ ] **Step 8: Fix `TS2339` — the defect, and it is the one that matters**

`frameworks/angular/test/chart-internals.test.ts:17` reads:

```ts
  for (const bad of [0, -0, -1, -1000, Number.NaN, -Number.INFINITY])
```

`Number.INFINITY` does not exist — the property is `Number.POSITIVE_INFINITY` — so it is `undefined`,
and `-undefined` is `NaN`, which the same array already carries one entry earlier. Replace it with
the literal:

```ts
  for (const bad of [0, -0, -1, -1000, Number.NaN, -Infinity])
```

Add to the comment above the loop:

```ts
  // `-Infinity` and not `-Number.INFINITY`: that property does not exist, so the
  // spelling evaluated to `-undefined`, i.e. `NaN` -- the entry before it. The
  // array claimed six inputs and supplied five, and no runtime assertion could
  // report that, because both spellings return 1. Found the first time a compiler
  // was pointed at this directory.
```

- [ ] **Step 9: Fix `TS2445` with a typed cast, NOT a directive**

`frameworks/angular/test/bulk-action-bar-variants.test.ts:89` calls `protected classesFor`. Add to
that file's imports:

```ts
import type { BulkAction } from '../api.generated';
```

and replace the call site with:

```ts
  /* `classesFor` is `protected`, and it stays protected -- a component's surface
     does not widen to serve its own suite. A TYPED cast rather than
     @ts-expect-error, because this test exists to catch a `BulkAction` retype:
     a directive suppresses every error on the line, including a genuinely wrong
     argument, which would blind the exact thing the test is named for. The cast
     keeps the argument checked against the real `BulkAction`. */
  const reachable = instance as unknown as { classesFor(action: BulkAction): { action(): string } };
  const viaMethod = reachable.classesFor({ id: 'delete', label: 'Delete', destructive: true }).action();
```

Read the existing line first and keep whatever variable name the assertions below already use.

- [ ] **Step 10: Fix `TS2307` with a directive, and that one IS right**

Immediately above `chart-internals.test.ts:157`'s import, in the multi-line shape `compliance.ts`
already proves works here:

```ts
  // @ts-expect-error -- a query-string specifier is a runtime cache-buster: bun
  // resolves it to the module beside it and gives back a fresh instance, while
  // TypeScript has no way to resolve the string at all. A wildcard module
  // declaration would silence every unresolvable import in the layer to fix one.
  const fresh = await import('../primitives/chart-internals?warn-once-probe');
```

Self-expiring: the moment the specifier becomes resolvable, `TS2578` fires and the build demands the
directive be removed. That property is why it is the right tool here and the wrong one in Step 9.

- [ ] **Step 11: Fix `TS4111`**

`frameworks/angular/test/host-class-binding.test.ts:1336`: `manifest.slots?.root` becomes
`manifest.slots?.['root']`. Leave the `root as string` two lines below alone — `assert.ok` does not
narrow.

- [ ] **Step 12: Watch the six template errors surface, which is the batch's real discovery**

```bash
bun run build:angular-tests
```

Expected: FAIL with **exactly six** `NG8008` errors and no TypeScript errors — at
`host-class-binding.test.ts` lines 186, 260, 313, 347, 374 and 396, naming `Breadcrumbs.items`;
`BulkActionBar.count` and `actions`; `PageHead.title`; and `labels`/`values` on `BarChart`,
`LineChart` and `DoughnutChart`.

**This is the state the previous version of this batch could not see**, because `ngc` withholds
template diagnostics while any TypeScript diagnostic remains. Record the output verbatim.

- [ ] **Step 13: Give the six templates their required inputs**

Each host component gains a field and binds it, so the binding carries a real value rather than a
literal that happens to type-check. Apply all six:

```ts
@Component({
  standalone: true,
  imports: [Breadcrumbs],
  host: { 'data-host': 'breadcrumbs' },
  template: `<arena-breadcrumbs class="consumer-class" [items]="items" />`,
})
class BreadcrumbsHost {
  items: Crumb[] = [];
}
```

and the same shape for the rest: `BulkActionBarHost` gains `count = 0` and `actions: BulkAction[] = []`
bound as `[count]="count" [actions]="actions"`; `PageHeadWithoutActionsHost` gains `title = ''` bound
as `[title]="title"`; and each chart host gains `labels: string[] = []` and `values: number[] = []`
bound as `[labels]="labels" [values]="values"`. Import whatever types those fields need from
`../api.generated`; the build will name any that are missing.

Use the field-and-binding shape rather than an inline literal even where a literal would compile:
Task 3 sets these fields to drive the tests, and a literal in the template would have to be rewritten
then anyway.

- [ ] **Step 14: Watch the build pass, and count what it emitted**

```bash
bun run build:angular-tests
find build/angular-test -name '*.js' | wc -l
ls build/angular-test/angular/test/*.test.js | wc -l
```

Expected: the success line; **119** `.js` files; **32** emitted suites. If the emit count differs
materially, report it — the figure is measured, not decorative.

- [ ] **Step 15: Confirm today's suite is still green, and record the noise**

```bash
bun test frameworks/angular/test 2>&1 | tail -5
```

Expected: **341 pass, 0 fail** — and `NG0303` messages logged for the six new bindings. That noise is
**expected and transient**: under JIT the bindings are rejected, which is the whole reason this batch
exists, and Task 3 stops running these files under JIT at all. Record that you saw it. Do not
suppress it, and do not remove the bindings to quiet it.

- [ ] **Step 16: Assert mechanically that the emit project relaxes nothing**

Add to `scripts/check-angular.test.mjs`, **above** the `PLAN-E-SUSPENDED` block. **No import changes
are needed** — measured: that file already imports `test`, `assert`, `readFileSync`, `join` and
`repoRoot`.

```js
/* What is assertable about the emit project without paying for a compile.
 *
 * The two tests that shell out to `ngc` are suspended below, so these exist to
 * catch the realistic regression instead: the emit project being narrowed so it
 * stops covering the suites, or quietly given a `compilerOptions` block that
 * relaxes what the shipped layer is held to. A test surface compiled more
 * leniently than the layer it exercises is worse than the honest hole it
 * replaced, so that is asserted mechanically rather than left to review. */
const BUILD_ONLY_OPTIONS = ['outDir', 'sourceMap', 'incremental', 'tsBuildInfoFile'];

test('the emit project covers the test directory and relaxes nothing', () => {
  const emit = JSON.parse(readFileSync(join(repoRoot, 'frameworks/angular/tsconfig.test.json'), 'utf8'));
  assert.equal(emit.extends, './tsconfig.check.json',
    'the emit project must inherit the layer project rather than restate its strictness');
  assert.ok(Array.isArray(emit.include) && emit.include.some((p) => p.startsWith('./test/')),
    `the emit project no longer covers ./test/: ${JSON.stringify(emit.include)}`);
  assert.equal(emit.angularCompilerOptions, undefined,
    'the emit project must carry no angularCompilerOptions of its own -- it relaxes nothing');
  const extra = Object.keys(emit.compilerOptions ?? {}).filter((k) => !BUILD_ONLY_OPTIONS.includes(k));
  assert.deepEqual(extra, [],
    `the emit project may carry build configuration only; these are something else: ${extra.join(', ')}`);
});

test('the layer project still names the barrel alone, so check:angular keeps its own subject', () => {
  const layer = JSON.parse(readFileSync(join(repoRoot, 'frameworks/angular/tsconfig.check.json'), 'utf8'));
  assert.deepEqual(layer.files, ['./index.ts'],
    'the shipped surface is the barrel; folding the tests into it would report a test error as a broken layer');
});
```

- [ ] **Step 17: Run them, and prove each is load-bearing**

```bash
bun test scripts/check-angular.test.mjs
```

Expected: 2 pass, 0 fail. Then break the config three ways, one at a time, restoring between each:

1. Add `"strict": false` to `tsconfig.test.json`'s `compilerOptions` → the first test fails naming
   `strict` as *"something else"*.
2. Change its `include` to `["./index.ts"]` → the first test fails on *"no longer covers ./test/"*.
3. Change `tsconfig.check.json`'s `files` to `["./index.ts", "./test/compliance.ts"]` → the second
   test fails.

Report each message verbatim. **Restore by editing back, not with `git checkout --`** — nothing is
staged in this task, so a checkout would discard the task's own work (Global Constraint 10).
Afterwards confirm `git status --short` shows only this task's intended files.

- [ ] **Step 18: Confirm `check:angular` is untouched**

```bash
bun run check:angular
grep -n 'typecheck(' scripts/check-angular.test.mjs
```

Expected: the gate prints `check-angular: the layer typechecks under strictTemplates`, exactly as
before. The two commented-out call sites must still read `typecheck()` and `typecheck({ root: dir })`,
both still valid — `typecheck()`'s signature did not change. State this explicitly in your report;
do not uncomment anything to check it.

- [ ] **Step 19: Commit**

```bash
git commit -q -F - <<'MSG'
build(angular-test): compile the test surface with ngc, and meet the six it hides

`check:angular` compiles `frameworks/angular/tsconfig.check.json`, whose `"files"`
is `["./index.ts"]`, so it never opened `frameworks/angular/test/`; `bun test`
strips types without checking them. Between the two, 34 files of TypeScript had no
typechecker -- and a green `check:angular` had already been read once, in 8C9 by
this repository, as evidence that they typechecked. It was not that evidence.

Four TypeScript errors, and one is a live test defect. `chart-internals.test.ts`
wrote `-Number.INFINITY`, a property that does not exist, so it was `-undefined`
and therefore `NaN` -- an entry the same array already carried. The loop claimed
six inputs and supplied five, and was vacuous on the case it existed to cover. Both
spellings return 1, so the fix changes what the test proves and not whether it
passes, which is exactly why no runtime assertion could ever have reported it.

Then the four turn out to have been hiding six more, and the mechanism is the part
worth keeping: ngc withholds its TEMPLATE diagnostics while any ordinary TypeScript
diagnostic remains in the project. Fix the four and six NG8008 surface -- fourteen
inline host templates in this directory omit required inputs on purpose, because
under JIT a signal input cannot be driven through a binding at all. A count taken
before a fix is not a count of what remains after it.

The templates get real fields bound rather than literals, which compiles now and is
what Task 3 will drive. Under today's JIT harness those bindings are rejected and
log NG0303 while the suite stays at 341 pass -- expected, transient, and the precise
reason the next commit stops running these files under JIT.

The other two type errors are idiom against configuration, and the choice between
the tools is not cosmetic. `classesFor` gets a TYPED cast, because that test exists
to catch a `BulkAction` retype and a directive suppresses every error on its line,
including a wrong argument. The unresolvable query-string import gets the directive,
because nothing can type a runtime cache-buster and it self-expires as TS2578 the
moment the specifier resolves. `classesFor` stays `protected`.

The emit project relaxes nothing, and that is asserted rather than promised: it must
inherit `tsconfig.check.json`, must still cover ./test/, must carry no
angularCompilerOptions, and its compilerOptions must be build configuration only.
Each proved load-bearing by breaking the config three ways and watching the matching
assertion fail, restored by hand rather than with `git checkout --`, which restores
from the index and would have discarded the tests themselves.

No new gate: GATES is unmoved at 21, `check:angular` prints exactly what it printed,
and `typecheck()`'s signature is unchanged so Plan E's two commented-out call sites
still compile.
MSG
```

---

## Task 3: The suites run from the emit, and the bypass is retired

**Files:**
- Modify: `package.json`, `scripts/check-all.mjs`, `scripts/check-all.test.mjs`
- Modify: `frameworks/angular/test/host-class-binding.test.ts`,
  `chart-data-table.test.ts`, `alert-role-tones.test.ts`, `tag-cases.test.ts`,
  `skeleton-dimensions.test.ts`, `tag-remove.test.ts`

**Interfaces:**
- Consumes: `bun run build:angular-tests` and the emitted tree from Task 2.
- Produces: `bun run test:angular` and `bun run test`, both running the Angular suites from
  `build/angular-test/angular/test`; `testStep({isBun: true, …})` returning **three** entries.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Measure what AOT actually restores, before rewriting anything on the assumption**

The spec deliberately claims only that a template binding reaches a signal input, which is measured.
`setInput()` and `contentChild()` are *expected* to work now and are **not** measured, and roughly
twenty of this task's rewrites depend on `setInput()`. Find out first.

Write a scratch probe at `frameworks/angular/test/aot-probe.test.ts` that renders a primitive with a
required signal input directly, drives it with `fixture.componentRef.setInput(...)`, runs
`detectChanges()`, and asserts the rendered DOM reflects the value. Use `useTestEnvironment()` from
`./testbed-env` the way the existing render suites do. Then:

```bash
bun run build:angular-tests && bun test build/angular-test/angular/test/aot-probe.test.js
```

Record the result verbatim.

- **If it passes**, `setInput()` is the technique for every fixture created directly, and Task 4 may
  write that into `CLAUDE.md`.
- **If it fails**, STOP and report before rewriting anything. The fallback is a host wrapper with a
  real template binding — the shape Step 4 uses — applied to the direct-fixture sites too, which is
  more work and changes what some tests construct.

Delete the probe before committing (`rm frameworks/angular/test/aot-probe.test.ts`); Task 4 turns
whatever it established into a durable test.

- [ ] **Step 3: Point the pipeline at the emitted tree**

In `package.json`:

```json
    "test:angular": "bun run build:angular-tests && bun test build/angular-test/angular/test",
    "test": "bun run build:angular-tests && bun test scripts frameworks/react/test/ build/angular-test/angular/test && bun test --preload ./frameworks/react/test-dom/preload.js frameworks/react/test-dom"
```

In `scripts/check-all.mjs`, replace `testStep()`'s bun branch with:

```js
  if (isBun) return [
    { name: 'build (ngc emit of the Angular test surface)', args: ['run', 'build:angular-tests'] },
    { name: 'test (bun test scripts/ + framework suites)', args: ['test', 'scripts', 'frameworks/react/test/', 'build/angular-test/angular/test'] },
    { name: 'test (bun test frameworks/react/test-dom, isolated)', args: ['test', '--preload', './frameworks/react/test-dom/preload.js', 'frameworks/react/test-dom'] },
  ];
```

The build is its own step rather than folded into the test command so that a compile failure is
reported as a failed step with its own name, instead of surfacing as a test command that mysteriously
ran nothing.

- [ ] **Step 4: Correct the comment above `testStep()`, which this task falsifies**

That comment currently explains the node/bun asymmetry with *"the framework suites … import `.jsx`
and `.ts` directly, which bun transpiles and plain node does not … pretending otherwise would mean a
build step for tests."* There is now a build step for tests, for Angular. Rewrite that clause to say
what is true: the Angular suites are compiled and could in principle run anywhere, the React suites
import `.jsx` directly and cannot, and the node path still runs `scripts/` alone — **and say which of
those is the reason**, so the next reader does not conclude the asymmetry is now unjustified. Do not
extend the node path to run the Angular suites; that is not this batch.

- [ ] **Step 5: Update the literal assertion, and watch it fail first**

```bash
bun test scripts/check-all.test.mjs
```

Expected: FAIL on the `testStep` deepEqual, because the array now has three entries. That failure is
the assertion doing its job — record it. Then update it to:

```js
  assert.deepEqual(steps.map((s) => s.args), [
    ['run', 'build:angular-tests'],
    ['test', 'scripts', 'frameworks/react/test/', 'build/angular-test/angular/test'],
    ['test', '--preload', './frameworks/react/test-dom/preload.js', 'frameworks/react/test-dom'],
  ]);
```

and extend that test's own comment with one sentence on why the build leads: the suites are emitted
JavaScript now, and a stale or absent emit must fail as a build rather than as a test run over old
code — the defect 8C10 shipped for four commits with a stale committed demo `.js`.

Leave the node-branch test alone; it is unchanged.

- [ ] **Step 6: Run the suites from the emit, and meet the 29**

```bash
bun run test:angular 2>&1 | tail -5
```

Expected: **312 pass, 29 fail**, across 341 tests in 32 files. Task 1 should already have removed the
five `ENOENT` failures — so if you see 24 rather than 29, that is Task 1 working and you record it
rather than hunting for the missing five. Report the number you actually get.

- [ ] **Step 7: Retire the bypass — the host-template shape**

Every remaining failure is the same error:
`TypeError: undefined is not an object (evaluating 'inputSignalNode.transformFn')`. Its cause is one
line repeated: the suite overwrites a child's instance field with a plain arrow function, which
destroys the `InputSignal`'s `[SIGNAL]` brand, and the now-real binding explodes writing to it.

Where a host component wraps the child, set the **host's own field** instead. `createBreadcrumbsHost`
is the worked example:

```ts
function createBreadcrumbsHost(items: Crumb[] = []) {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  const instance = fixture.debugElement.query(By.directive(Breadcrumbs)).componentInstance as unknown as Record<string, unknown>;
  instance['items'] = () => items;
  return fixture;
}
```

becomes, against the `BreadcrumbsHost` that gained an `items` field in Task 2 Step 13:

```ts
function createBreadcrumbsHost(items: Crumb[] = []) {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  fixture.componentInstance.items = items;
  return fixture;
}
```

The host's `items` is a plain field on a component the suite owns, not a signal input, so assigning
it before the first `detectChanges()` is ordinary Angular rather than a bypass.

Delete the long comments that explain the bypass as you go — they describe a limitation that no
longer exists, and leaving them is how this repository's prose goes false. Replace each with a short
statement of what the code now does, where anything is still worth saying.

- [ ] **Step 8: Retire the bypass — the direct-fixture shape**

Where the suite constructs the primitive itself with no host wrapper, use `setInput()`, which Step 2
established works. `renderStatCard` is the worked example:

```ts
function renderStatCard(label: string, value: string, delta?: StatDelta, icon?: string) {
  const fixture = TestBed.createComponent(StatCard);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['label'] = () => label;
  instance['value'] = () => value;
  if (delta !== undefined) instance['delta'] = () => delta;
  if (icon !== undefined) instance['icon'] = () => icon;
  return fixture;
}
```

becomes:

```ts
function renderStatCard(label: string, value: string, delta?: StatDelta, icon?: string) {
  const fixture = TestBed.createComponent(StatCard);
  fixture.componentRef.setInput('label', label);
  fixture.componentRef.setInput('value', value);
  if (delta !== undefined) fixture.componentRef.setInput('delta', delta);
  if (icon !== undefined) fixture.componentRef.setInput('icon', icon);
  return fixture;
}
```

Find every remaining site with:

```bash
grep -rn "\w\+\['[a-zA-Z]*'\] = " frameworks/angular/test/*.ts
```

There were **41** across six files before this task: `host-class-binding.test.ts`,
`chart-data-table.test.ts`, `alert-role-tones.test.ts`, `tag-cases.test.ts`,
`skeleton-dimensions.test.ts` and `tag-remove.test.ts`. **The last two do not fail** — their bypass
is harmless because nothing binds to those inputs — and they are migrated anyway: a convention
retired in four files out of six is not retired, and two idioms in one directory is the drift this
repository spends its gates refusing.

- [ ] **Step 9: Handle the two tests whose premise has inverted**

`AppLogoStaticAttributeHost` and `StatCardHost` exist to pin a JIT limitation — that a literal
attribute never reaches a signal input, so their templates must never be change-detected. Under AOT a
static attribute **does** satisfy a string input, which is why neither appeared among the six
`NG8008`.

These are the Global Constraint 9 cases. Do **not** delete them to make the count come out, and do
not leave them asserting something false. Rewrite each to assert the new truth — that the attribute
now reaches the input and the component renders it — and name the inversion in the commit. If either
turns out to have no meaningful claim left once its limitation is gone, say so explicitly in your
report and propose removing it rather than removing it silently.

- [ ] **Step 10: Green from the emit**

```bash
bun run test:angular 2>&1 | tail -5
```

Expected: **341 pass, 0 fail**, across 32 files. The count must not move: every change here is a
technique change, and the one behavioural change — `-Infinity` in place of `NaN` — passes because
`niceMax`'s guard is `!(max > 0)` and `-Infinity > 0` is false.

- [ ] **Step 11: The rest of the suites, and the whole composed command**

```bash
bun test scripts | tail -3          # 602 tests across 33 files, 0 fail
bun run test 2>&1 | tail -5         # both invocations green
```

`bun test scripts` matters on its own here: `scripts/check-all.test.mjs` asserts `testStep()` by
literal value, and a narrowed invocation over the Angular suites alone would report green over a red
tree. That mistake cost plan 8C5 a red commit a task report called green.

- [ ] **Step 12: Induction A — a type error stops the tests running at all**

```bash
git add -A
sha256sum frameworks/angular/test/chart-internals.test.ts > "${CLAUDE_JOB_DIR:-/tmp}/8c11-ci.sha"
```

Add `const wrong: number = 'x';` at the top of `frameworks/angular/test/chart-internals.test.ts`, then:

```bash
bun run test:angular
```

Expected: the build fails with `TS2322` and `build-angular-tests: the Angular test surface does not
compile, so its suites cannot run`, and **no test executes** — the `&&` never reaches `bun test`.
That "no test executes" half is the claim of the whole batch; before it, that identical tree was
green. Report verbatim. Restore:

```bash
git checkout -- frameworks/angular/test/chart-internals.test.ts
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c11-ci.sha"   # OK
```

- [ ] **Step 13: Induction B — a template error does the same**

```bash
sha256sum frameworks/angular/test/host-class-binding.test.ts > "${CLAUDE_JOB_DIR:-/tmp}/8c11-hcb.sha"
```

Remove `[items]="items"` from `BreadcrumbsHost`'s template, then run `bun run test:angular`.

Expected: the build fails with `NG8008` naming `Breadcrumbs.items`, and no test executes. This is the
half no configuration of the previous plan could have reached. Report verbatim. Restore:

```bash
git checkout -- frameworks/angular/test/host-class-binding.test.ts
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c11-hcb.sha"   # OK
```

- [ ] **Step 14: Induction C — `check:angular` still answers for the shipped layer alone**

```bash
sha256sum frameworks/angular/primitives/tag/tag.ts > "${CLAUDE_JOB_DIR:-/tmp}/8c11-tag.sha"
```

Introduce a type error in `frameworks/angular/primitives/tag/tag.ts`, then run `bun run check:angular`.

Expected: FAIL, naming the layer, with the gate's own unchanged message shape. Report verbatim.
Restore:

```bash
git checkout -- frameworks/angular/primitives/tag/tag.ts
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c11-tag.sha"   # OK
bun run check:angular                                  # green again
```

This is the induction that proves Global Constraint 5 was not quietly broken: `tag.ts` must be
byte-identical afterwards.

- [ ] **Step 15: Confirm no emitted output is staged**

```bash
git status --short
git check-ignore -v build/angular-test
```

Expected: no `build/` path anywhere in `git status`, and `check-ignore` naming the rule.

- [ ] **Step 16: Commit**

```bash
git commit -q -F - <<'MSG'
test(angular): run the suites from the ngc emit, and retire the JIT bypass

The Angular suites now run from `build/angular-test/angular/test`, compiled by ngc
ahead of them. `testStep()` gains the build as its own first step rather than
folding it into a test command, so a compile failure reports as a failed build
instead of as a test run that mysteriously matched nothing; that takes `bun run
check` from 23 steps to 24 while GATES stays at 21.

What this buys is not a faster gate, it is a different guarantee. A type error in a
test file no longer merely fails an assertion somewhere: the emit fails and NO TEST
RUNS. Induced both ways -- a TS2322 in a suite and a removed `[items]` binding on a
host template -- and in each case the build failed and `bun test` was never reached.
The second of those is the half nothing in this repository could previously catch.

The bypass is gone. It overwrote a child's instance field with a plain arrow
function, which destroys the InputSignal's [SIGNAL] brand, and a real binding then
explodes writing to it -- 24 identical TypeErrors, all in one file. Where a host
wraps the child, the host's own plain field is set and the template binds it; where
a suite builds the primitive directly, `setInput()` drives it, which was measured to
work under AOT before twenty sites were rewritten on the assumption. The two files
whose bypass sites did NOT fail are migrated too: a convention retired in four files
out of six is not retired.

Two tests had their premise inverted rather than their code adjusted.
`AppLogoStaticAttributeHost` and `StatCardHost` existed to pin the JIT rule that a
literal attribute never reaches a signal input. Under AOT it does. They now assert
that, which is why neither ever appeared among the six NG8008.

The comment above `testStep()` said that keeping the framework suites out of the
node path avoided "a build step for tests". There is one now, for Angular, and the
comment says which half of the asymmetry is still real and why.

341 pass, 0 fail, 32 files -- the same counts as under JIT, so nothing was dropped
in the move. `tag.ts` broken and restored byte-identically, verified with
sha256sum -c, to prove no Angular source moved.
MSG
```

---

## Task 4: Close-out

**Files:**
- Create: one durable test recording what AOT restored (Step 3)
- Modify: `frameworks/angular/test/compliance.ts`, `CLAUDE.md`

**Interfaces:**
- Consumes: everything.
- Produces: a green tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Correct the clause this batch falsified inside `compliance.ts`**

`compliance.ts`'s first `@ts-expect-error` reason reads *"a plain .mjs helper with JSDoc types only;
this suite runs under bun's own TypeScript stripping, and **check:angular compiles only what index.ts
reaches**, so no declaration file is generated for it anywhere."*

Two of those clauses are now false: this suite no longer runs under bun's stripping, and a compiler
does reach this file. **The directive itself stays correct and must not be removed** — the `.mjs`
helper still has no declaration file, which is why no `TS2578` fires. Rewrite only the reason, and
check the second directive four lines below (`// @ts-expect-error -- same as above.`), which inherits
it by reference.

```bash
bun run build:angular-tests   # green; a stale directive would be TS2578
```

- [ ] **Step 3: Turn Task 3 Step 2's measurement into a durable test**

Task 3 deleted its scratch probe. Add a real suite in `frameworks/angular/test/` that pins what the
move restored, so the claim `CLAUDE.md` is about to make has something behind it:
that `setInput()` drives a required signal input and the render reflects it. If Task 3's report
recorded that `contentChild()` now resolves, pin that too; if it recorded that it does not, pin
nothing about it and carry the limitation into Step 4 instead.

Assert only what you have run. This step must not widen into testing the primitives themselves — its
subject is the harness.

```bash
bun run test:angular | tail -3
```

- [ ] **Step 4: Sweep `CLAUDE.md`**

Run the change-time command the 8C10 close-out published, for each of this batch's subjects:

```bash
for X in 'check:angular' typecheck 'tsconfig.check.json' JIT setInput contentChild ngc; do
  echo "== $X =="
  grep -rn --binary-files=without-match "\b$X\b" \
      --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
      CLAUDE.md components-divergences.md api/ behaviour/ docs/ frameworks/ scripts/
done
```

**Judge each** — some describe history and stay true. Two are certainly false and both must move:

- the *Known debt* entry **"No gate typechecks `frameworks/angular/test/`"**, which names the
  mitigation as not done. It is done, and differently from how that entry proposed. Retire it the way
  `components-divergences.md`'s `Onboarding` entry was retired rather than deleting it: what was
  wrong, what closed it, and — the part that must survive because it is still true — **that a green
  compile is a claim about types and never about behaviour.** The sharpest instance is in the same
  file and this batch does not remove it: a suite can typecheck perfectly and assert the wrong thing,
  and the `niceMax` defect was caught only because its vacuity happened to also be a type error.
- the *Architecture* paragraph asserting the harness is JIT and that a signal input therefore cannot
  be driven through a template binding, a literal attribute or `setInput()`, and that `contentChild()`
  queries do not resolve. Rewrite it to describe the AOT pipeline — **and write only what Steps 2-3
  measured.** Anything not measured is recorded as unknown, not as working.

Record the facts the batch owes forward: `bun run check` is 24 steps and `GATES` is still 21; the
suspended count is still **seven**; the Angular suites run from `build/angular-test/`, which is
generated and git-ignored; and a stale emit is prevented by the build always leading, not by a gate.

Two disciplines this repo treats as hard rules: **a deletion that takes a still-true fact out of the
index is a defect**, and **a derived figure written as prose goes stale** — name a command instead,
run it first, and confirm it returns what you claim.

- [ ] **Step 5: Run the full sweep, once**

```bash
export CHROME_PATH=/usr/bin/chromium
ARENA_CHECK_STRICT=1 bun run check
```

Expected: `check-all: all 24 step(s) passed`. If any step fails, STOP and report BLOCKED with the
failing step's output — never fix a gate to make it agree.

- [ ] **Step 6: Confirm the batch's own claims**

```bash
bun run test:angular | tail -3                                                                           # 341 pass, 0 fail
bun test scripts | tail -3                                                                               # 0 fail
bun run check:angular                                                                                    # the layer, unchanged message
grep -rn '^// test(' scripts/ frameworks/ --include='*.mjs' --include='*.jsx' --include='*.ts' | wc -l   # 7, unmoved
sed -n '9p' scripts/check-all.test.mjs | grep -o "'check:" | wc -l                                       # 21, unmoved
grep -rn "\w\+\['[a-zA-Z]*'\] = " frameworks/angular/test/*.ts | wc -l                                   # 0
git status --short                                                                                       # clean, no build/ path
```

The suspended count and `GATES` are the two figures that prove this batch added no gate and paid no
debt forward, and the bypass count is what proves the convention was retired rather than reduced.

- [ ] **Step 7: Commit**

```bash
git commit -q -F - <<'MSG'
docs: close out 8C11 -- the tests compile, and that is a claim about types alone

`CLAUDE.md`'s Known debt entry stating that no gate typechecks
`frameworks/angular/test/` is retired rather than deleted, in the shape
`components-divergences.md` uses: what was wrong, what closed it, and the part that
survives because it is still true -- a green compile is a claim about TYPES and
never about behaviour. The sharpest instance of that gap is unchanged by this batch:
a suite can typecheck perfectly and assert the wrong thing, and the defect this
batch did find was caught only because its vacuity happened to also be a type error.

The Architecture paragraph describing the harness as JIT is rewritten. It said a
signal input cannot be driven through a template binding, a literal attribute or
setInput(), and that contentChild() queries do not resolve. Those were true of the
harness and are not true of this one. What replaces them is only what was measured
and pinned by a suite; anything not measured is recorded as unknown rather than as
working, because the previous version of this batch was falsified by exactly the
habit of writing down the expected rather than the observed.

`compliance.ts`'s @ts-expect-error reason said this suite runs under bun's own
TypeScript stripping and that `check:angular` compiles only what `index.ts` reaches.
Neither holds now. The directive stays -- the `.mjs` helper still has no declaration
file, which is why no TS2578 fires -- and only the reason had to catch up.

Recorded forward: `bun run check` is 24 steps with GATES still at 21, the suspended
count is still seven because this batch added no gate to suspend a test for, and
`build/angular-test/` is generated, git-ignored, and kept fresh by the build always
leading rather than by a gate watching it.

Full `bun run check` run once, at close-out, per the rule that the sweep is a
completion gate rather than a per-commit toll.
MSG
```

---

## Self-review

**Spec coverage.** *The problem* and *What the first spec measured* → Task 2 Steps 7 and 12, which
make the implementer meet both the four and the six as failures rather than as claims. §1 (why AOT
dissolves the problem) → Task 3's Inductions A and B, which prove the "no test runs" property that is
the whole difference from the previous design. §2 (the pipeline) → Task 2 Steps 4-6 and Task 3 Step 3,
with Global Constraint 6's "relaxes nothing" made mechanical in Task 2 Step 16. §3 (paths) → Task 1
in full. §4 (the four fixes) → Task 2 Steps 8-11. §5 (retiring the bypass) → Task 3 Steps 7-9, with
the two-cause split driving the two worked examples. *Verification*'s three inductions → Task 3 Steps
12-14. *The cost* → measured in this plan's own table rather than restated. *What stays open* →
carried into `CLAUDE.md` by Task 4 Step 4, which is where it survives this document's deletion.

**The one thing the spec left open and the plan closes.** The spec refuses to claim `setInput()` works
under AOT. Roughly twenty of Task 3's rewrites depend on it, so Task 3 Step 2 measures it **before**
any of them, with an explicit STOP and a named fallback. Discovering it at Step 8 would mean redoing
Step 7's work under a different technique.

**Task ordering is a property of the tree, not a preference.** Task 1 is separable because it is a
no-op under today's harness and green on its own. Tasks 2 and 3 could not be merged with it or split
further without leaving a commit whose committed test command is red: the six template bindings
require the emit to exist, and retiring the bypass requires the suites to already run from it. Task 2
is the one commit that ships a known wart — `NG0303` logged under JIT while the suite stays at 341
pass — and Step 15 makes the implementer see it, record it, and not suppress it.

**Placeholder scan.** No step defers work. The one place a full enumeration is impossible — the 41
bypass sites — is given as a `grep` that produces the list, the exact file set, the count to expect,
two worked before/after examples read off the real source, and a terminal assertion that the count
reaches zero (Task 4 Step 6).

**Type consistency.** `ngcBin(root?)` is defined in Task 2 Step 3 and consumed in Step 5 with that
shape. `ANGULAR_PRIMITIVES` and `TAILWIND_COMPONENTS` are exported in Task 1 Steps 4 and consumed in
Task 1 Step 5 under the same names, and `ANGULAR_PRIMITIVES` keeps the name its four existing
consumers already import. `testStep()`'s three-entry array in Task 3 Step 3 matches the `deepEqual`
in Step 5 element for element.
