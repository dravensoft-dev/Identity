# The Angular test directory compiles before it runs

**Status:** design, approved 2026-07-27. Batch 8C11.

This spec replaces `2026-07-27-angular-test-typecheck-design.md`, which was written, approved and
then falsified by its own first execution. What it got wrong, and why the correction is a different
batch rather than an amendment, is the subject of the next section.

## The problem

**No gate typechecks `frameworks/angular/test/`, and a green `check:angular` has already been read
as evidence that it does.**

`check:angular` runs `ngc --strictTemplates` over `frameworks/angular/tsconfig.check.json`, whose
`"files"` is `["./index.ts"]` — the primitives barrel. The compiler reaches the shipped layer and
everything the barrel pulls in, and never opens the test directory. `bun test` strips types without
checking them, so a green suite has never been evidence about types either. Between the two, 34
files of TypeScript have no typechecker.

`CLAUDE.md` already records the instance: during 8C9 a review compiled
`frameworks/angular/test/compliance.ts` by hand and found **two TS2322 errors** in a directory
reporting 340 passing tests — after a green `check:angular` had been read, in that same batch, as
evidence the file typechecked. It is not that evidence. Those two were fixed; the hole they came
through was not.

**And underneath that hole is a second one, which the first spec never saw.** The suites render
real Angular trees under `@angular/compiler`'s JIT and never `ngtsc`. Under JIT a signal input
cannot be driven through a template binding, so the directory grew a bypass convention: the host
template omits the required inputs and the test overwrites the child's instance field afterwards.
That convention is documented at length in the files that use it, and it is load-bearing — but it
produces templates that **are not valid Angular**, and nothing could say so, because the compiler
that would say it was never pointed at them.

## What the first spec measured, and the one thing it could not see

The prior spec measured four errors and was right about all four. It reported them as the whole
truth, and they were not, for a reason no amount of care in reading the source would have caught:

**`ngc` withholds its template diagnostics while any ordinary TypeScript diagnostic remains in the
project.** Fix the four, and six `NG8008` *"Required input … must be specified"* errors surface that
were invisible before. The directory's true error count is **ten, not four** — and the measurement
that said four was correct, complete for the tree it was run against, and still misleading. That is
worth stating plainly, because the lesson generalises past this batch: *a compiler's error list is
not a fixed set, and a count taken before a fix is not a count of what remains after it.*

The six, read off the compiler:

| site | required inputs not specified |
|---|---|
| `host-class-binding.test.ts:186` | `Breadcrumbs.items` |
| `host-class-binding.test.ts:260` | `BulkActionBar.count`, `BulkActionBar.actions` |
| `host-class-binding.test.ts:313` | `PageHead.title` |
| `host-class-binding.test.ts:347` | `BarChart.labels`, `BarChart.values` |
| `host-class-binding.test.ts:374` | `LineChart.labels`, `LineChart.values` |
| `host-class-binding.test.ts:396` | `DoughnutChart.labels`, `DoughnutChart.values` |

**All six are true, and none of them can be fixed while the harness is JIT.** Measured: supplying
the missing bindings makes `ngc` green and leaves the suite at 341/341 — and emits `NG0303`
*"Can't bind to 'values' since it isn't a known property"* at runtime for every one of them. The
binding is rejected; the tests pass only because nothing asserts on it. That route silences a
compiler with something broken underneath, which is worse than the hole it closes.

Two routes out of that were measured and rejected before the third was found. Relaxing the test
project with `angularCompilerOptions.strictTemplates: false` fails `NG4003`, because
`extendedDiagnostics` is inherited from `tsconfig.check.json` and a tsconfig override cannot delete
an inherited key — so it cascades into restating the whole strictness block. And compiling the test
surface with plain `tsc --noEmit` instead of `ngc` works and relaxes nothing (measured: exactly the
four TypeScript errors on the clean tree, 0 after they are fixed, 3.2s), but it buys its cleanliness
by not looking: the six stay true and become permanently invisible.

## What is being built

**The Angular test directory is compiled by `ngc` before it runs, and the suites run from the
emitted JavaScript.** That is one change, and everything else in this spec follows from it.

### 1. Why this dissolves the problem rather than working around it

Under AOT the bindings are real. Measured, from the spike's own stack trace: a template binding
reaches `writeToDirectiveInput` with `InputFlags.SignalBased` — `[items]="[]"` genuinely arrives at
the signal input, which is exactly what JIT cannot do. So the six templates stop being a lie the
moment the harness stops being JIT, and `ngc --strictTemplates` covers the whole directory with **no
exception, no exclusion and no relaxation**.

**And the typecheck comes free.** A type error in a test file fails the emit, so the tests cannot
run. That is strictly stronger than the separate gate the first spec proposed — which could be
green while a suite was never compiled — and it needs fewer pieces: no second gate, no gate-only
tsconfig, no change to `typecheck()`'s signature, and no movement in `GATES`, which
`check-all.test.mjs:9` asserts by literal value at 21.

`check:angular` is **unchanged**. It compiles `./index.ts`, the shipped surface, and that is what it
should keep saying.

### 2. The pipeline

`frameworks/angular/tsconfig.test.json` extends `tsconfig.check.json`, sets `"files": []` and
`"include": ["./test/**/*.ts", "./index.ts"]`, and **relaxes nothing** — every `compilerOption` and
every `angularCompilerOption` is inherited unchanged. What it adds is build configuration, not
leniency: an `outDir`, `sourceMap` so a stack trace points at the `.ts` rather than the emitted
`.js`, and `incremental` with its `tsBuildInfoFile` so a warm re-emit does not pay the cold cost.

A `build:angular-tests` script runs it. `test:angular` becomes that build followed by
`bun test` over the emitted test files; the `test` composition and `testStep()` in
`scripts/check-all.mjs` mirror it, and `check-all.test.mjs`'s literal assertion moves with them.

**The output directory must be visible, and that is a measured constraint rather than a
preference:** `bun test` silently matches nothing under a dot-directory. It is `test-build/` at the
repo root, git-ignored. `rootDir` resolves to `frameworks/`, so the suites land at
`test-build/angular/test/`.

**A stale `test-build/` runs old code**, which is the defect 8C10 shipped for four commits with its
stale committed demo `.js`. Two things hold it off: the build always runs ahead of the tests in
every invocation path, and the directory is git-ignored so it can never be committed stale.

### 3. Paths must resolve to the source tree, not to the emitted one

Two sites resolve filesystem paths from `import.meta.url` — `host-class-binding.test.ts:1316-1317`
(`../primitives`, `../../tailwind/components`) and `compliance.ts:37`. From the emitted location
those point into `test-build/`, where the compiled `.js` modules exist but the data files do not:
measured, `test-build/tailwind/components/` holds the emitted `.manifest.js` modules and **zero
`.json`**. That is one of the 29 failures below, and it is the manifest-driven assertion — the one
that checks every primitive's root slot carries a display utility.

The fix is a shared helper that walks up from `import.meta.url` to the directory holding
`package.json` and joins source paths from there. It resolves correctly from both trees, which
matters: a suite must not become un-runnable from its own source directory just because it normally
runs from the build.

### 4. The fixes, and what each is

Four type errors, unchanged in substance from the first spec:

- `TS2339` — `chart-internals.test.ts:17` writes `-Number.INFINITY`. **This is a live test defect.**
  `Number.INFINITY` does not exist, so the expression is `-undefined`, i.e. `NaN` — the entry the
  same array already carries. The loop claims six inputs and supplies five, and is vacuous on the
  case it was written to cover. Measured: `niceMax(-Number.INFINITY)` and `niceMax(-Infinity)` both
  return `1`, so the fix changes what the test proves and not whether it passes, which is exactly
  why no runtime assertion could ever have reported it.
- `TS2445` — `bulk-action-bar-variants.test.ts:89` reaches into `protected classesFor`. It goes
  through a **typed** cast, not `@ts-expect-error`: that test exists to catch a `BulkAction` retype,
  and a directive suppresses every error on its line including a wrong argument, blinding the one
  thing the test is named for. **`classesFor` stays `protected`** — a component's surface does not
  widen to serve its own suite.
- `TS2307` — `chart-internals.test.ts:157` imports a query-string cache-buster that `bun` honours at
  runtime and TypeScript cannot resolve. This one gets `@ts-expect-error` with its reason, because
  nothing can type it and a wildcard module declaration would silence every unresolvable import in
  the layer to fix one. It is self-expiring: `TS2578` fires the moment the specifier resolves.
- `TS4111` — `host-class-binding.test.ts:1336`, `manifest.slots?.root` becomes
  `manifest.slots?.['root']`.

Then the six templates get real bindings, which under AOT genuinely reach their inputs.

### 5. Retiring the bypass

The bypass overwrites a child's instance field with a plain arrow function, which destroys the
`InputSignal`'s `[SIGNAL]` brand. Under AOT a real binding then writes to that input and explodes.
Measured, over the whole directory: **312 pass, 29 fail**, and the emitted run reports 341 tests
across 32 files — the same counts as today, so nothing is lost or skipped in the move.

| file | failing | of |
|---|---|---|
| `host-class-binding.test.ts` | 25 | 57 |
| `chart-data-table.test.ts` | 2 | 6 |
| `alert-role-tones.test.ts` | 1 | 4 |
| `tag-cases.test.ts` | 1 | 1 |
| `skeleton-dimensions.test.ts` | 0 | 6 |
| `tag-remove.test.ts` | 0 | 2 |

**The 29 have exactly two causes and no long tail**, which is what makes the migration mechanical
rather than 29 separate investigations. Measured:

- **24** are one identical error, all in `host-class-binding.test.ts`:
  `TypeError: undefined is not an object (evaluating 'inputSignalNode.transformFn')` — the bypass,
  meeting a real binding.
- **5** are the path resolution of §3, failing as `ENOENT`: the manifest sweep in
  `host-class-binding.test.ts`, and the four suites that load a `*.behaviour.json` through
  `compliance.ts`'s `ANGULAR_PRIMITIVES` (`chart-data-table` twice, `alert-role-tones`,
  `tag-cases`). Measured: the emit writes **zero** `.json` under either directory.

So the bypass causes failures in one file only. `chart-data-table`, `alert-role-tones` and
`tag-cases` fail for the path reason alone, and their bypass sites — like `skeleton-dimensions`'s
and `tag-remove`'s — are harmless under AOT and are retired for consistency rather than necessity.

There are **41 bypass sites across exactly 6 files**. The directory holds 34 `.ts` files in all —
32 suites and two helpers, `testbed-env.ts` and `compliance.ts` — and `@angular/core/testing` is
imported by seven of them: the six that carry bypass sites, plus `testbed-env.ts`, which claims the
shared DOM and TestBed environment for the whole directory. Everything else is a recipe test with no
Angular runtime and is untouched. `skeleton-dimensions` and `tag-remove` carry bypass sites
and do **not** fail, because the bypass only breaks where a parent template binding also writes that
input. **They are migrated anyway.** Leaving two idioms in one directory is the drift this
repository spends its gates refusing, and a convention retired in four files out of six is not
retired.

## Verification

The suite is the mechanism here, so the suite is most of the proof: 341 tests, 32 files, 0 failures,
run from the emitted output.

Beyond that, three inductions in the shape 8C7 through 8C10 established — guarded with `sha256sum`,
restored with `git checkout --` **after staging**, and the restore proved with `sha256sum -c`:

1. **A type error in a test file stops the tests running at all.** Introduce one; the build must
   fail and no test may execute. This is the claim that replaces the first spec's whole gate.
2. **A template error in a test file does the same.** Remove one of the six bindings; `NG8008` must
   fail the build. Before this batch that identical tree was green.
3. **`check:angular` still names the shipped layer alone.** Introduce an error in a primitive; the
   gate must fail naming the layer, and it must keep compiling `./index.ts` and nothing else.

`ARENA_CHECK_STRICT=1 bun run check` reports all **24** steps at close-out, up from 23. `GATES` is
unmoved at 21 — the extra step is the emit, which `testStep()` gains as its first entry so the
build's own failure is reported as a step rather than swallowed inside a test command.

## The cost, measured rather than estimated

| | before | after |
|---|---|---|
| `bun test frameworks/angular/test` | 1.9s | — |
| cold `ngc` emit | — | 6.6s |
| `bun test` over the emitted output | — | 1.5s |
| the inner loop, cold | 1.9s | ~8.1s |

The test run itself gets **faster**, because the types are already gone. What is paid is the emit,
and `incremental` is configured so the repeated case does not pay the cold figure. This is the same
budget that bought `check:cards` a real browser: `bun run check` is a completion gate rather than a
per-commit toll.

## Blast radius

`frameworks/angular/tsconfig.test.json` (new), `package.json`'s test and build scripts,
`scripts/check-all.mjs`'s `testStep()`, `scripts/check-all.test.mjs`'s literal assertion,
`.gitignore`, six test files under `frameworks/angular/test/` plus `compliance.ts`, and `CLAUDE.md`.

**No Angular source, no React source, no contract, no binding, no token.** Nothing under
`frameworks/angular/primitives/`, `frameworks/react/`, `api/`, `behaviour/` or `tokens/` changes;
the `protected` member a test reaches into stays `protected`.

`CLAUDE.md` carries statements this batch falsifies: the *Known debt* entry stating that no gate
typechecks the directory and naming the mitigation as not done, and — the larger one — the
*Architecture* paragraph asserting that the harness is JIT and that a signal input therefore cannot
be driven through a template binding, an attribute, or `setInput()`, and that `contentChild()`
queries do not resolve. Find every affected statement with the change-time command the 8C10 close-out
published, run for `check:angular`, `typecheck`, `tsconfig.check.json`, `JIT` and `setInput`.

## What stays open

**The spec claims for the harness only what was measured.** The spike proves a signal input binding
arrives under AOT. That `setInput()` now works and that `contentChild()` queries now resolve are
both *expected* and neither is measured — the plan verifies each before a word about it is written
into `CLAUDE.md`. Any that does not hold stays recorded as a limit rather than quietly dropped.

**A green run is a claim about types and behaviour under this harness, never about accessibility or
about the shipped bundle.** The suites still prove what they assert and nothing more, and the
`niceMax` defect this batch fixes is a reminder of the shape that escapes them: a compiler caught it
only because its vacuity happened to also be a type error. Nothing schedules a look for the vacuity
that is not.

**`frameworks/react/test/` and `frameworks/react/test-dom/` have no analogue and this batch builds
none.** They are `.jsx`, there is no equivalent compiler in play, and whether they want one is a
separate question nobody has asked.

**The suspended count stays at seven.** The first spec would have made it eight, for a gate test it
could not afford to run. There is no new gate here, so there is nothing to suspend, and Plan E's
debt is unchanged.

## Out of scope

The other four leftovers 8C9 recorded — `validateBinding`'s duplicate and nameless case entries,
`divergesFromReason`'s status as a documented convention, the two wrappers' untested loop bodies,
and `inventoryFrom`'s dead `patterns` — are a later batch. They are the behaviour layer; this is the
Angular toolchain; they share no file and no mechanism. Splitting them applies what this repository
learned in 8C6, that orthogonal work in one batch reviews worst.

Restoring any of the seven suspended tests is Plan E's.
