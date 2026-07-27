# 8C11 — The Angular test directory typechecks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put `frameworks/angular/test/` under a real typechecker for the first time, fix the four
things it finds — one of them a live test defect — and leave behind a gate that reports which
surface failed.

**Architecture:** A second tsconfig that extends the existing one and relaxes nothing;
`typecheck()` gains an optional project; `check:angular` runs two compiles and names the surface in
each message. No new gate, so `GATES` in `scripts/check-all.mjs` does not move. The gate's own test
file is entirely suspended under `PLAN-E-SUSPENDED`, so what this batch can assert is split by
cost: config facts live and cheap, the compile assertion suspended beside its siblings.

**Tech Stack:** `@angular/compiler-cli`'s `ngc` under `--strictTemplates`, Bun (test runner, scripts),
`node:test` + `node:assert/strict`.

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only**, in code, comments, docs and commit messages. No emoji. The repo was fully
   translated from Spanish; Spanish must never reappear.
2. **A commit message containing a backtick uses a quoted here-doc** — `git commit -q -F - <<'MSG'
   … MSG` — never `git commit -m`. A backtick inside a double-quoted shell string opens command
   substitution and is silently spliced away. Verify with `git log -1 --format=%B`.
3. **The first step of every task is `git status --short`**, and it must be clean.
4. **`bun run check` in full runs ONCE, at close-out**, with `CHROME_PATH=/usr/bin/chromium`
   exported and `ARENA_CHECK_STRICT=1`.
5. **No Angular source, no React source, no contract, no binding, no token.** Nothing under
   `frameworks/angular/primitives/`, `frameworks/react/`, `api/`, `behaviour/` or `tokens/` may
   change. In particular: **`BulkActionBar.classesFor` stays `protected`** — a shipped component's
   surface does not widen to serve its own suite.
6. **The test project relaxes NOTHING.** `frameworks/angular/tsconfig.test.json` carries no
   `compilerOptions` and no `angularCompilerOptions` of its own. Four errors is not a reason to
   weaken a gate; a gate laxer than the layer it guards is worse than the honest hole it replaces.
7. **`typecheck()`'s new parameter must be OPTIONAL and its default must be today's value.** Two
   call sites live commented out in `scripts/check-angular.test.mjs` and Plan E will uncomment them
   verbatim. A signature change that breaks suspended code is a trap that fires in someone else's
   batch, months later, with no clue attached.
8. **Do NOT unsuspend any of the seven `PLAN-E-SUSPENDED` tests.** Restoring them is Plan E's
   decision. This batch adds an eighth and says so.
9. **Never weaken a gate, a test or an assertion** to make something agree.
10. **`git checkout -- <path>` restores from the INDEX, not HEAD.** Both inductions edit files the
    task has already modified, so: **`git add -A` first, then break it, then
    `git checkout -- <path>`.** Unstaged, the restore silently reverts the task's own work and
    `sha256sum -c` will not catch it, because the hash was taken after those edits.
11. **No `.jsx` changes anywhere in this batch, so `bun run build:demos` is not needed.** It is
    named only because 8C10 shipped a stale committed `.js` for four commits by assuming the
    opposite; there is simply nothing here to rebuild.

---

## What this plan measured before it was written

Read off the tree on 2026-07-27, branch `angular-test-typecheck-8c11`, cut from `main` at `06165b1`
(8C10 merged and pushed).

| measure | value |
|---|---|
| `.ts` files in `frameworks/angular/test/` | 34, and every file there is `.ts` |
| errors when that directory is compiled under the existing strict config | **4** |
| `check:angular` today | 5.3s |
| the test-directory compile on its own | 5.0s |
| `as unknown as` in that directory | 31 |
| `@ts-expect-error` in that directory | 3, and **no `TS2578` fires** — all three are load-bearing |
| `@Component` declarations in that directory | 14, all in `host-class-binding.test.ts` |
| `PLAN-E-SUSPENDED` tests in the repo | 7 — 2 in `check-angular.test.mjs`, 5 in `check-card-viewports.test.mjs` |
| `GATES` in `scripts/check-all.mjs` | 21 entries, asserted by literal value at `check-all.test.mjs:9` |
| `bun run check` | 23 steps |

The four errors, each read off the compiler:

```
test/bulk-action-bar-variants.test.ts:89:30 - error TS2445: Property 'classesFor' is protected and only accessible within class 'BulkActionBar' and its subclasses.
test/chart-internals.test.ts:17:60      - error TS2339: Property 'INFINITY' does not exist on type 'NumberConstructor'.
test/chart-internals.test.ts:157:30     - error TS2307: Cannot find module '../primitives/chart-internals?warn-once-probe' or its corresponding type declarations.
test/host-class-binding.test.ts:1336:34 - error TS4111: Property 'root' comes from an index signature, so it must be accessed with ['root'].
```

Facts the tasks depend on, each read off the source:

- `scripts/check-angular.mjs` exports `typecheck(opts = {})`, reads `opts.root ?? repoRoot`, and
  hardcodes `join(root, 'frameworks/angular/tsconfig.check.json')`.
- `frameworks/angular/tsconfig.check.json` ends with `"files": ["./index.ts"]`.
- `chart-internals.ts:100` is `if (!(max > 0)) return 1;` — measured: `niceMax(-Number.INFINITY)`
  and `niceMax(-Infinity)` **both return 1**, so fixing the defect changes what the test proves and
  not whether it passes.
- `BulkAction` is exported from `frameworks/angular/api.generated.ts:38`; the test directory imports
  from it as `'../api.generated'`.
- The proven multi-line `@ts-expect-error` shape in this repo is `compliance.ts:28-31`: the
  directive on the first `//` line, prose on the following `//` lines, then the code.
- `frameworks/angular/test/compliance.ts:30-32`'s directive comment says *"check:angular compiles
  only what index.ts reaches"* — **this batch falsifies that clause.** Task 3 owns it.

---

## File Structure

**Created**

- `frameworks/angular/tsconfig.test.json` — the test surface's project. Extends
  `tsconfig.check.json`, overrides only `files`/`include`, relaxes nothing.

**Modified**

- `scripts/check-angular.mjs` — `typecheck()` gains an optional project; `main()` runs both surfaces
  and names which one failed.
- `scripts/check-angular.test.mjs` — two live config assertions; one suspended compile assertion.
- `frameworks/angular/test/chart-internals.test.ts` — the defect, and the unresolvable import.
- `frameworks/angular/test/bulk-action-bar-variants.test.ts` — the protected-member reach.
- `frameworks/angular/test/host-class-binding.test.ts` — the index-signature access.
- `frameworks/angular/test/compliance.ts` — one now-false clause in a comment (Task 3).
- `CLAUDE.md` — Task 3.

**Not modified, and each is a result rather than an omission:** everything under
`frameworks/angular/primitives/`, `frameworks/react/`, `api/`, `behaviour/`, `tokens/`, and
`scripts/check-all.mjs`.

---

## Task 1: The gate reaches the test directory, and the four things it finds are fixed

**Files:**
- Create: `frameworks/angular/tsconfig.test.json`
- Modify: `scripts/check-angular.mjs`
- Modify: `frameworks/angular/test/chart-internals.test.ts`
- Modify: `frameworks/angular/test/bulk-action-bar-variants.test.ts`
- Modify: `frameworks/angular/test/host-class-binding.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `typecheck({root?, project?})` and two exported constants, `LAYER_PROJECT` and
  `TEST_PROJECT`, both repo-relative path strings. Task 2 imports all three.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Read `typecheck()` as it stands, and do not trust this plan for it**

```bash
sed -n '33,51p' scripts/check-angular.mjs
tail -2 frameworks/angular/tsconfig.check.json
```

Expected: `typecheck(opts = {})` at line 37, reading `opts.root ?? repoRoot` and building `project`
from a hardcoded `'frameworks/angular/tsconfig.check.json'`; the tsconfig's last key is
`"files": ["./index.ts"]`. (`tail -2`, not `-1` — the last line is the closing brace.) If either
differs, STOP — the whole change is derived from this shape.

- [ ] **Step 3: Create the test project**

`frameworks/angular/tsconfig.test.json`, exactly:

```json
{
  "extends": "./tsconfig.check.json",
  "files": [],
  "include": ["./test/**/*.ts", "./index.ts"]
}
```

`"files": []` is not decoration — it overrides the inherited `["./index.ts"]` so `include` decides
the file set. `./index.ts` is in `include` because the suites import primitives through the barrel's
own types, and compiling it here costs nothing that the layer compile has not already paid.

**It carries no `compilerOptions` and no `angularCompilerOptions`.** That is Global Constraint 6, and
Task 2 asserts it mechanically so it cannot quietly acquire one later.

- [ ] **Step 4: Give `typecheck()` an optional project, and name both surfaces**

In `scripts/check-angular.mjs`, above `typecheck()`, add:

```js
/** The two surfaces this gate compiles, as repo-relative project paths.
 *
 *  Two compiles rather than one, and the extra ~5s is the price of a true
 *  message. `tsconfig.check.json`'s `"files": ["./index.ts"]` is the statement
 *  that the SHIPPED surface is the barrel; folding the tests into it would make
 *  a test file's type error report as "the Angular layer does not typecheck",
 *  which is false and points a reader at the wrong tree. It would also change
 *  what this file's own suspended test `the Angular layer as committed
 *  typechecks` means when Plan E restores it. */
export const LAYER_PROJECT = 'frameworks/angular/tsconfig.check.json';
export const TEST_PROJECT = 'frameworks/angular/tsconfig.test.json';
```

Then change the one line inside `typecheck()`:

```js
  const project = join(root, opts.project ?? LAYER_PROJECT);
```

and extend its JSDoc `@param` to `{{root?: string, project?: string}}`.

**The parameter is optional and defaults to today's value on purpose** — see Global Constraint 7.
`scripts/check-angular.test.mjs` contains two commented-out calls, `typecheck()` and
`typecheck({ root: dir })`, that Plan E will uncomment verbatim; both must still be valid.

- [ ] **Step 5: Make `main()` report which surface failed**

Replace `main()` in `scripts/check-angular.mjs` with:

```js
function main() {
  /* Both surfaces are compiled even when the first fails, for the reason
   * check-all itself runs every gate rather than stopping at the first: two
   * separate lists of real errors is more useful than one list and a mystery. */
  const surfaces = [
    { project: LAYER_PROJECT, subject: 'the Angular layer', ok: 'the layer typechecks under strictTemplates' },
    { project: TEST_PROJECT, subject: 'frameworks/angular/test/', ok: 'its test directory typechecks too' },
  ];
  let failed = false;
  for (const s of surfaces) {
    let result;
    try {
      result = typecheck({ project: s.project });
    } catch (err) {
      console.error(`check-angular: ${err.message}`);
      process.exit(1);
    }
    if (result.status !== 0) {
      failed = true;
      console.error(`check-angular: ${s.subject} does not typecheck\n`);
      console.error(result.output.trim());
      console.error('');
    }
  }
  if (failed) process.exit(1);
  console.log(`check-angular: ${surfaces.map((s) => s.ok).join(', and ')}`);
}
```

- [ ] **Step 6: Watch the gate fail, and read what it found**

```bash
bun run check:angular
```

Expected: FAIL. `the Angular layer` compiles clean; `frameworks/angular/test/` reports **exactly the
four errors** in the table above — `TS2445`, `TS2339`, `TS2307`, `TS4111`. If it reports a different
number or different codes, STOP and report: the plan's measurement has gone stale and the fixes
below are derived from it.

This failure is the whole point of the batch, stated as a gate. Record its output verbatim in your
report.

- [ ] **Step 7: Fix the defect — `TS2339`, and it is the one that matters**

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

Add a line to the comment above the loop recording what changed and why it is not visible at
runtime:

```ts
  // `-Infinity` and not `-Number.INFINITY`: that property does not exist, so the
  // spelling evaluated to `-undefined`, i.e. `NaN` -- the entry before it. The
  // array claimed six inputs and supplied five, and no runtime assertion could
  // report that, because both spellings return 1. Found by check:angular the
  // first time it compiled this directory.
```

- [ ] **Step 8: Fix `TS2445` with a typed cast, NOT a directive, and the reason is specific**

`frameworks/angular/test/bulk-action-bar-variants.test.ts:89` calls `protected classesFor`.

Add to that file's imports:

```ts
import type { BulkAction } from '../api.generated';
```

and replace line 89 with:

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

- [ ] **Step 9: Fix `TS2307` with a directive, and that one IS right**

`frameworks/angular/test/chart-internals.test.ts:157` imports a cache-busting query-string
specifier that `bun` honours at runtime and TypeScript cannot resolve. Put the directive
immediately above it, in the shape `compliance.ts:28-31` already proves works here:

```ts
  // @ts-expect-error -- a query-string specifier is a runtime cache-buster: bun
  // resolves it to the module beside it and gives back a fresh instance, while
  // TypeScript has no way to resolve the string at all. A wildcard module
  // declaration would silence every unresolvable import in the layer to fix one.
  const fresh = await import('../primitives/chart-internals?warn-once-probe');
```

This directive is self-expiring: the moment the specifier becomes resolvable, `TS2578` fires and the
gate demands the directive be removed. That property is why it is the right tool here and the wrong
one in Step 8.

- [ ] **Step 10: Fix `TS4111`**

`frameworks/angular/test/host-class-binding.test.ts:1336`:

```ts
    const root = manifest.slots?.root;
```

becomes

```ts
    const root = manifest.slots?.['root'];
```

`slots` is typed `Record<string, string>`, and `noPropertyAccessFromIndexSignature` asks for bracket
access on an index signature. Leave the `root as string` two lines below alone — `assert.ok` does not
narrow.

- [ ] **Step 11: Watch the gate pass, and the suites with it**

```bash
bun run check:angular              # both surfaces clean
bun test frameworks/angular/test   # 341 pass, 0 fail
```

The suite count must not move: every fix is a type fix, and the one behavioural change — `-Infinity`
instead of `NaN` — passes because `niceMax`'s guard is `!(max > 0)` and `-Infinity > 0` is false.

- [ ] **Step 12: Prove the suspended callers still compile**

Global Constraint 7 is the one this step exists for. `scripts/check-angular.test.mjs` holds two
commented-out calls that Plan E will restore verbatim.

```bash
grep -n 'typecheck(' scripts/check-angular.test.mjs
```

Both must still be valid against the new signature: `typecheck()` and `typecheck({ root: dir })`.
Confirm by reading the new `typecheck()` — `opts.project` defaults to `LAYER_PROJECT`, so both keep
compiling exactly the layer they compiled before. State this explicitly in your report; do not
uncomment anything to check it.

- [ ] **Step 13: Induction A — the gate names the TEST surface**

```bash
git add -A
sha256sum frameworks/angular/test/chart-internals.test.ts > "${CLAUDE_JOB_DIR:-/tmp}/8c11-test.sha"
```

Introduce a plain type error in `frameworks/angular/test/chart-internals.test.ts` — e.g. add
`const wrong: number = 'x';` at the top of the file. Then:

```bash
bun run check:angular
```

Expected: FAIL, with `check-angular: frameworks/angular/test/ does not typecheck` and a `TS2322`.
The **layer** surface must still pass. Report the message verbatim. Restore:

```bash
git checkout -- frameworks/angular/test/chart-internals.test.ts
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c11-test.sha"   # OK
```

- [ ] **Step 14: Induction B — the two surfaces stay distinguishable**

```bash
sha256sum frameworks/angular/primitives/tag/tag.ts > "${CLAUDE_JOB_DIR:-/tmp}/8c11-tag.sha"
```

Introduce the same kind of error in `frameworks/angular/primitives/tag/tag.ts`. Then:

```bash
bun run check:angular
```

Expected: FAIL naming **`the Angular layer`**. It will also fail the test surface, twice over and
both correctly: `index.ts` reaches `tag.ts` transitively through `export * from './primitives'`, and
three suites — `tag-variants`, `tag-remove`, `tag-cases` — import it directly. What matters is that
the layer surface is named **at all**, which it was not before this batch. Report verbatim. Restore:

```bash
git checkout -- frameworks/angular/primitives/tag/tag.ts
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c11-tag.sha"   # OK
bun run check:angular                                  # green again
```

This is the induction that proves Global Constraint 5 was not quietly broken: `tag.ts` must be
byte-identical afterwards.

- [ ] **Step 15: Commit**

```bash
git commit -q -F - <<'MSG'
feat(check): check:angular reaches its own test directory, and finds four things

`check:angular` compiled `frameworks/angular/tsconfig.check.json`, whose `"files"`
is `["./index.ts"]`, so it never opened `frameworks/angular/test/`; `bun test`
strips types without checking them. Between the two, 34 files of TypeScript had
no typechecker -- and a green `check:angular` had already been read once, in 8C9
by this repository, as evidence that they typechecked. It was not that evidence.

Four errors, and one is a live test defect. `chart-internals.test.ts` wrote
`-Number.INFINITY`, a property that does not exist, so it was `-undefined` and
therefore `NaN` -- an entry the same array already carried. The loop claimed six
inputs and supplied five, and was vacuous on the case it existed to cover. Both
spellings return 1, so the fix changes what the test proves and not whether it
passes, which is exactly why no runtime assertion could ever have reported it.

The other three are idiom against configuration, and the choice between the two
available tools is not cosmetic. `classesFor` gets a TYPED cast rather than
@ts-expect-error, because that test exists to catch a `BulkAction` retype and a
directive suppresses every error on its line -- including a wrong argument, which
is the one thing the test is named for. The unresolvable query-string import gets
the directive, because nothing can type a runtime cache-buster and a wildcard
module declaration would silence every unresolvable import in the layer to fix
one. `classesFor` stays `protected`: a component's surface does not widen to
serve its own suite.

Two compiles rather than one. A single project would be ~5s cheaper and would
report a test file's error as "the Angular layer does not typecheck", which is
false; it would also change what this gate's own suspended test means when Plan E
restores it. `typecheck()`'s new project parameter is OPTIONAL and defaults to
today's value, so both commented-out call sites Plan E will uncomment verbatim
still compile.

Induced twice, and the tree restored and verified with sha256sum -c after each.
A type error in a test file reports `frameworks/angular/test/ does not typecheck`
while the layer stays clean; one in `tag.ts` names the layer.
MSG
```

---

## Task 2: What can be asserted about a gate whose own tests are suspended

**Files:**
- Modify: `scripts/check-angular.test.mjs`

**Interfaces:**
- Consumes: `LAYER_PROJECT`, `TEST_PROJECT` and `typecheck()` from Task 1.
- Produces: nothing consumed later.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Read the suspension marker you are about to sit beside**

```bash
sed -n '1,15p' scripts/check-angular.test.mjs
sed -n '19,22p' scripts/check-card-viewports.test.mjs
```

Both files carry the same five-line header shape: the `PLAN-E-SUSPENDED` line, a `Cost when live:`
line with a measured figure and the reason, the two-line restore instruction, and the spec
reference. Match it exactly — Plan E's restore procedure is *"delete these five header lines and
strip the leading `// `"*, and a differently-shaped block breaks a mechanical instruction.

- [ ] **Step 3: Write the live config assertions**

These cost milliseconds because they read two JSON files and compile nothing. Add them at the top of
`scripts/check-angular.test.mjs`, **above** the suspended block, and extend the existing imports with
`LAYER_PROJECT` and `TEST_PROJECT`:

```js
/* What is assertable about this gate without paying for a compile.
 *
 * The two tests that shell out to `ngc` are suspended below, so these exist to
 * catch the realistic regression instead: the test project being deleted,
 * narrowed so it stops covering the suites, or quietly given a `compilerOptions`
 * block that relaxes what the layer is held to. A gate laxer than the layer it
 * guards is worse than the honest hole it replaced, so that last one is asserted
 * mechanically rather than left to review. */
test('the test project covers the test directory and relaxes nothing', () => {
  const tests = JSON.parse(readFileSync(join(repoRoot, TEST_PROJECT), 'utf8'));
  assert.equal(tests.extends, './tsconfig.check.json',
    'the test project must inherit the layer project rather than restate it');
  assert.ok(Array.isArray(tests.include) && tests.include.some((p) => p.startsWith('./test/')),
    `the test project no longer covers ./test/: ${JSON.stringify(tests.include)}`);
  assert.equal(tests.compilerOptions, undefined,
    'the test project must carry no compilerOptions of its own -- it relaxes nothing');
  assert.equal(tests.angularCompilerOptions, undefined,
    'the test project must carry no angularCompilerOptions of its own -- it relaxes nothing');
});

test('the layer project still names the barrel alone, so the two surfaces stay separate', () => {
  const layer = JSON.parse(readFileSync(join(repoRoot, LAYER_PROJECT), 'utf8'));
  assert.deepEqual(layer.files, ['./index.ts'],
    'the shipped surface is the barrel; folding tests into it would report a test error as a broken layer');
});
```

- [ ] **Step 4: Run them, and watch each one fail for the right reason**

```bash
bun test scripts/check-angular.test.mjs
```

Expected: 2 pass, 0 fail.

Then prove each assertion is load-bearing rather than decorative, one at a time, restoring between:

1. Add `"compilerOptions": { "strict": false }` to `frameworks/angular/tsconfig.test.json` → the
   first test fails on *"relaxes nothing"*. Restore.
2. Change its `include` to `["./index.ts"]` → the first test fails on *"no longer covers ./test/"*.
   Restore.
3. Change `tsconfig.check.json`'s `files` to `["./index.ts", "./test/compliance.ts"]` → the second
   test fails. Restore.

Report each message verbatim, and confirm the tree is clean afterwards with `git status --short`.
**Restore by editing back, not with `git checkout --`** — nothing is staged yet in this task, so a
checkout would discard Step 3's work.

- [ ] **Step 5: Add the eighth suspended test**

Below the existing `PLAN-E-SUSPENDED-END` marker, add a second suspended block in the identical
shape. Measure its cost first by writing it live, running it once, and recording the real figure —
do not guess:

```js
// PLAN-E-SUSPENDED — commented out to keep the suite fast while plans A-D reshape the repo.
// Cost when live: <MEASURED>s. Reason: shells out to a full ngc --strictTemplates run over the test directory.
// Restore in Plan E: delete these five header lines and strip the leading "// " from
// lines below until the next PLAN-E-SUSPENDED-END marker. See
// docs/superpowers/specs/2026-07-23-8-api-contracts-design.md
// /* The assertion this gate exists for, and the one it cannot afford to make:
//  * a type error in a test file is caught. Suspended for cost, not for doubt --
//  * batch 8C11 ran it and it passed, and its induction is recorded in that
//  * batch's commit message rather than only here. */
// test('a type error in a test file fails the test surface', { timeout: 120_000 }, () => {
//   const dir = mkdtempSync(join(tmpdir(), 'arena-ngtest-'));
//   try {
//     cpSync(join(repoRoot, 'frameworks'), join(dir, 'frameworks'), { recursive: true });
//     symlinkSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'));
//     const suite = join(dir, 'frameworks/angular/test/chart-internals.test.ts');
//     writeFileSync(suite, `const wrong: number = 'x';\n${readFileSync(suite, 'utf8')}`);
//     const { status, output } = typecheck({ root: dir, project: TEST_PROJECT });
//     assert.notEqual(status, 0);
//     assert.match(output, /TS2322/);
//   } finally {
//     rmSync(dir, { recursive: true, force: true });
//   }
// });
// PLAN-E-SUSPENDED-END
```

The `symlinkSync` of `node_modules` rather than a copy is the existing file's own technique and its
reason is written there: it is 225 MB / 17,675 files and `ngc` follows a symlink just as well.

- [ ] **Step 6: Confirm the suspended count moved from seven to eight**

```bash
grep -rn '^// test(' scripts/ frameworks/ --include='*.mjs' --include='*.jsx' --include='*.ts' | wc -l
```

Expected: `8`. This batch is **adding** to a debt Plan E owns, which is recorded rather than hidden —
Task 3 puts it in `CLAUDE.md`.

- [ ] **Step 7: Run the suites**

```bash
bun test scripts/check-angular.test.mjs   # 2 pass, 0 fail
bun test scripts                          # no regression
```

- [ ] **Step 8: Commit**

```bash
git commit -q -F - <<'MSG'
test(check): assert what a compile-free test can, and suspend what it cannot

This gate's own test file is entirely commented out under PLAN-E-SUSPENDED --
two of the repository's seven such tests, off on a cost rule, because both shell
out to a full ngc run. So the batch that widens the gate cannot prove its own
change the obvious way, and splits what it asserts by cost instead.

Live and cheap, because they read two JSON files and compile nothing: that the
test project still covers ./test/, that it inherits the layer project rather
than restating it, and that it carries NO compilerOptions and NO
angularCompilerOptions of its own. That last pair is the mechanical form of
"it relaxes nothing" -- a gate laxer than the layer it guards is worse than the
honest hole it replaced, and leaving that to review is how it erodes. Plus one
assertion from the other side: the layer project still names the barrel alone,
so a test file's error can never report as a broken layer.

Each was proved load-bearing by breaking the config three ways and watching the
matching assertion fail, then restoring by hand -- not with `git checkout --`,
which restores from the index and would have discarded the tests themselves.

Suspended, in the identical five-line shape Plan E's restore instruction expects:
the assertion that a type error in a test file actually fails the test surface.
It was run once and it passes; its cost is recorded on its own line. The
suspended count goes from seven to eight, which is this batch ADDING to a debt
Plan E owns. Unsuspending any of them is Plan E's decision, not a way to feel
better about adding one.
MSG
```

---

## Task 3: Close-out

**Files:**
- Modify: `frameworks/angular/test/compliance.ts`, `CLAUDE.md`

**Interfaces:**
- Consumes: everything.
- Produces: a green tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Correct the one clause this batch falsified outside `CLAUDE.md`**

`frameworks/angular/test/compliance.ts:30-32` carries a `@ts-expect-error` whose reason reads
*"a plain .mjs helper with JSDoc types only; this suite runs under bun's own TypeScript stripping,
and **check:angular compiles only what index.ts reaches**, so no declaration file is generated for it
anywhere."*

The bolded clause is now false — `check:angular` compiles this file. **The directive itself stays
correct and must not be removed**: the `.mjs` helper still has no declaration file, which is why no
`TS2578` fires. Only the stated reason has to catch up. Read the whole comment before editing it,
and check the second directive four lines below (`// @ts-expect-error -- same as above.`), which
inherits the reason by reference.

Verify the directives are still needed rather than assuming it:

```bash
bun run check:angular    # green; a stale directive would be TS2578
```

- [ ] **Step 3: Sweep `CLAUDE.md`**

Run the change-time command the 8C10 close-out published, for each of this batch's three subjects.
Measured against the tree before this batch, so you meet a real number:

```bash
for X in 'check:angular' typecheck 'tsconfig.check.json'; do
  echo "== $X =="
  grep -rn --binary-files=without-match "\b$X\b" \
      --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
      CLAUDE.md components-divergences.md api/ behaviour/ docs/ frameworks/ scripts/
done
```

Expected raw sizes at the start of this batch: 38, 23 and 13 hits. **Judge each** — some describe
history and stay true.

The one that certainly does not is the *Known debt* entry at `CLAUDE.md:1064`, **"No gate typechecks
`frameworks/angular/test/`"**, which names the mitigation as not done. It is done. Retire it the way
`components-divergences.md`'s `Onboarding` entry was retired rather than deleting it: say what was
wrong, what closed it, and — the part that must survive, because it is still true — **that a green
typecheck is a claim about types and never about behaviour.** This repo's sharpest instance of that
is in the same file: `setInput()` on an undiscovered signal input silently no-ops and a suite built
on it passes vacuously, which no compiler sees.

Two other statements to find and judge with the command rather than from this list: the count of
suspended tests, and anything describing `check:angular`'s reach.

Record in `CLAUDE.md` the two facts the batch owes forward: the suspended count is now **eight**, and
`typecheck()` takes an optional project whose default exists so Plan E's commented-out calls keep
compiling.

Two disciplines this repo treats as hard rules: **a deletion that takes a still-true fact out of the
index is a defect**, and **a derived figure written as prose goes stale** — name a command instead,
run it first, and confirm it returns what you claim.

- [ ] **Step 4: Run the full sweep, once**

```bash
export CHROME_PATH=/usr/bin/chromium
ARENA_CHECK_STRICT=1 bun run check
```

Expected: `check-all: all 23 step(s) passed`. If any step fails, STOP and report BLOCKED with the
failing step's output — never fix a gate to make it agree.

- [ ] **Step 5: Confirm the batch's own claims**

```bash
bun run check:angular                                        # both surfaces named, both clean
bun test frameworks/angular/test | tail -3                   # 341 pass, 0 fail
grep -rn '^// test(' scripts/ frameworks/ --include='*.mjs' --include='*.jsx' --include='*.ts' | wc -l   # 8
sed -n '9p' scripts/check-all.test.mjs | grep -o "'check:" | wc -l                                       # 21, unmoved
```

The last one is the point of adding no new gate: `GATES` is asserted by literal value, and this batch
must not have touched it.

- [ ] **Step 6: Commit**

```bash
git commit -q -F - <<'MSG'
docs: close out 8C11 -- the typecheck hole is closed, and says what it is not

`CLAUDE.md`'s Known debt entry stating that no gate typechecks
`frameworks/angular/test/` is retired rather than deleted, in the shape
`components-divergences.md` uses: what was wrong, what closed it, and the part
that survives because it is still true -- a green typecheck is a claim about
TYPES and never about behaviour. This repository's sharpest instance of that gap
sits in the same file: `setInput()` on an undiscovered signal input silently
no-ops and a suite built on it passes vacuously, which no compiler sees. The
defect this batch did find was caught only because its vacuity happened to also
be a type error.

`compliance.ts`'s @ts-expect-error reason said `check:angular` compiles only what
`index.ts` reaches. It compiles this file now. The directive stays -- the `.mjs`
helper still has no declaration file, which is why no TS2578 fires -- and only
the reason had to catch up.

Recorded forward: the suspended count is eight, and `typecheck()`'s project
parameter is optional so Plan E's commented-out calls keep compiling.

Full `bun run check` run once, at close-out, per the rule that the sweep is a
completion gate rather than a per-commit toll. `GATES` is unmoved at 21, which
was the point of wiring this into check:angular instead of adding a step.
MSG
```

---

## Self-review

**Spec coverage.** *The problem* and *What the hole costs* → Task 1 Steps 6-10, with the measurement
reproduced in *What this plan measured* so the implementer meets a number rather than a claim.
§1 (a second tsconfig, two compiles, relax nothing) → Task 1 Steps 3-5 and Global Constraint 6, with
the "relaxes nothing" promise made mechanical in Task 2 Step 3. §2 (`typecheck()` gains a project;
suspended callers keep compiling; no new gate) → Task 1 Steps 4-5 and Step 12, plus Task 3 Step 5's
`GATES` check. §3 (the four fixes, each in an existing idiom) → Task 1 Steps 7-10. §4 (live cheap
assertions, suspended compile assertion, seven becomes eight) → Task 2. *Verification*'s two
inductions → Task 1 Steps 13-14. *Blast radius*'s `CLAUDE.md` warning → Task 3 Step 3. *What stays
open* → carried into `CLAUDE.md` by Task 3 rather than left in this document, which is deleted once
executed.

**One thing the plan decides that the spec left looser.** The spec said the protected-member reach
"goes through a cast" and cited 31 precedents. Task 1 Step 8 gives the *reason* the cast beats
`@ts-expect-error` there, and Step 9 gives the reason the directive beats a cast in the other place:
a directive suppresses every error on its line, so it is right where nothing can be typed at all
(an unresolvable specifier) and wrong where the test's whole purpose is to keep an argument checked
(a `BulkAction` retype). Choosing per-site rather than per-batch is the substance of those two steps.

**One thing the plan deliberately does not give the implementer.** Task 3 Step 3 does not list which
`CLAUDE.md` hits to change. It names the one that is certainly false — the Known debt entry at
`:1064` — because that was measured, and leaves the rest to judgement, because a list written here
would be the plan asserting verdicts it has not verified. The commands are given; the judgement is
the work.

**Type consistency.** `typecheck({root?, project?})` is defined in Task 1 Step 4 and consumed with
exactly that shape in Task 2 Step 5 (`typecheck({ root: dir, project: TEST_PROJECT })`).
`LAYER_PROJECT` and `TEST_PROJECT` are exported in Task 1 Step 4 and imported in Task 2 Step 3 under
the same names. Both are repo-relative strings joined against `root` inside `typecheck()`, which is
what the existing `opts.root` contract already assumes.
