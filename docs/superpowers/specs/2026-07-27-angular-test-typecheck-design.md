# The Angular test directory typechecks

**Status:** design, approved 2026-07-27. Batch 8C11.

## The problem

**No gate typechecks `frameworks/angular/test/`, and a green `check:angular` has already been read
as evidence that it does.**

`check:angular` runs `ngc --strictTemplates` over `frameworks/angular/tsconfig.check.json`, whose
`"files"` is `["./index.ts"]` — the primitives barrel. The compiler reaches the shipped layer and
everything the barrel pulls in, and never opens the test directory. `bun test` strips types without
checking them, so a green suite has never been evidence about types either. Between the two, 34
files of TypeScript have no typechecker.

This is not theoretical, and `CLAUDE.md` already records the instance: during 8C9 a review compiled
`frameworks/angular/test/compliance.ts` by hand and found **two TS2322 errors** in a directory
reporting 340 passing tests — after a green `check:angular` had been read, in that same batch, as
evidence the file typechecked. It is not that evidence. Those two were fixed; the hole they came
through was not.

## What the hole costs, measured rather than argued

The whole point of writing this down is that the gap was estimated once and never measured. It has
now been measured: `ngc`, over the existing `tsconfig.check.json` with the test directory included,
against the merged tree at `06165b1`.

**Four errors. Not four hundred, and not zero.**

| error | site | what it is |
|---|---|---|
| `TS2339` | `chart-internals.test.ts:17` | **a live test defect** |
| `TS2445` | `bulk-action-bar-variants.test.ts:89` | a deliberate reach into a `protected` member |
| `TS2307` | `chart-internals.test.ts:157` | a cache-busting query-string import TS cannot resolve |
| `TS4111` | `host-class-binding.test.ts:1336` | index-signature access under `noPropertyAccessFromIndexSignature` |

**The first one is the gate's dividend, and it is worth stating exactly.**
`chart-internals.test.ts:17` reads:

```ts
for (const bad of [0, -0, -1, -1000, Number.NaN, -Number.INFINITY])
  assert.equal(niceMax(bad), 1, `niceMax(${bad})`);
```

`Number.INFINITY` does not exist — the property is `Number.POSITIVE_INFINITY` — so it is
`undefined`, and `-undefined` is `NaN`. The array claims six inputs and supplies five distinct ones,
because `NaN` is already the entry before it. The test is not *wrong*; it is **vacuous on the case
it was written to cover**, which is the harder failure to see and the one no runtime assertion can
report. Measured: `niceMax(-Number.INFINITY)` and `niceMax(-Infinity)` both return `1`, so the fix
changes what the test proves and not whether it passes.

The other three are idiom fighting configuration, not defects, and all three have an established
in-repo answer — see §3.

**A fifth thing the measurement settled, in the gate's favour.** That directory already carries
three `@ts-expect-error` directives, written with no gate able to validate them. Under a real
compile an unnecessary one is `TS2578` (*"Unused '@ts-expect-error' directive"*), and **no TS2578
fired**: all three are load-bearing. That is worth knowing for its own sake, and it is also the
gate's second property — from now on such a directive **expires when its error goes away**, which is
the same "an exception can expire" mechanism the behaviour layer exists for, arriving in the
toolchain by construction rather than by design.

## What is being built

### 1. A second tsconfig, and two compiles rather than one

`frameworks/angular/tsconfig.test.json` extends `tsconfig.check.json` and includes
`./test/**/*.ts` plus `./index.ts`. It **relaxes nothing**: same `strict`,
same `noPropertyAccessFromIndexSignature`, same `strictTemplates`. Four errors is not a
reason to weaken a gate, and a gate laxer than the layer it guards is worse than an honest hole —
which is what this batch is closing.

**Two compiles, not one, and the reason is not tidiness.** A single config covering both surfaces
would be about 5s cheaper, and it would conflate two questions: *does the shipped layer typecheck*
and *do its tests typecheck*. `tsconfig.check.json`'s `"files": ["./index.ts"]` is the statement
that the shipped surface is the barrel, and it must keep saying that — a test file's error must not
be reported as "the Angular layer does not typecheck". Two compiles also keep `check-angular.mjs`'s
suspended test *"the Angular layer as committed typechecks"* meaning what it says when Plan E
restores it.

### 2. `typecheck()` gains a project, and the suspended callers must keep compiling

`typecheck(opts)` today takes `{root}` and hardcodes `tsconfig.check.json`. It gains an optional
`opts.project`, defaulting to today's value, so **every existing call site stays valid** — including
the two commented-out ones in `scripts/check-angular.test.mjs`, which Plan E will uncomment
verbatim. A signature change that breaks suspended code is a trap that fires in someone else's
batch, months from now, with no clue attached.

`check-angular.mjs`'s `main()` runs both and reports which surface failed, in its own message. The
gate stays `check:angular`; **no new gate is added.** `CLAUDE.md`'s own recorded mitigation says "a
second tsconfig covering the test directory, wired into `check:angular`", and adding a step would
also move `GATES` in `scripts/check-all.mjs`, which `check-all.test.mjs:9` asserts by literal value —
churn bought for nothing.

### 3. The four fixes, each in an idiom the directory already uses

Nothing new is invented here. Counted in `frameworks/angular/test/` at `06165b1`: **31** uses of
`as unknown as`, **3** of `@ts-expect-error` with a stated reason.

- `TS2339` — `-Number.INFINITY` becomes `-Infinity`. The defect, per §2.
- `TS2445` — the reach into `protected classesFor` goes through a cast. The test is legitimate: it
  proves the method still resolves to the same recipe output after a retype, which is exactly the
  kind of internal a variants suite should pin. **Do not make the member public to satisfy a test** —
  that changes a shipped component's surface to serve its own suite.
- `TS2307` — `import('../primitives/chart-internals?warn-once-probe')` is a cache-busting import that
  `bun` honours at runtime and TypeScript cannot resolve. `@ts-expect-error` with the reason stated,
  which is what the other three directives in that directory do. The alternative — a wildcard module
  declaration — would silence *every* unresolvable import in the layer to fix one.
- `TS4111` — `manifest.slots?.root` becomes `manifest.slots?.['root']`, which is what the flag asks
  for and what the surrounding code already does with the JSON it reads.

### 4. What can be tested about this, and what must stay suspended

**The gate's own test file is entirely commented out**, and that is the constraint this section
exists for rather than an aside. `scripts/check-angular.test.mjs`'s two tests sit under a
`PLAN-E-SUSPENDED` marker — *"Cost when live: 7.97s. Reason: both tests shell out to a full ngc
--strictTemplates run over the Angular layer"* — two of the **seven** suspended tests in the
repository, the other five being `check-card-viewports.test.mjs`'s headless-Chromium tests.

So this batch may not prove its own change the obvious way. It splits what it asserts by cost:

- **Live, cheap, no compile:** that both tsconfigs exist, that the test one extends the check one,
  that its `include` really covers `./test/`, and that `tsconfig.check.json`'s `"files"` still does
  **not** name the test directory — the assertion that keeps the two surfaces separate. These are
  config facts, they cost milliseconds, and they catch the config being deleted or narrowed, which
  is the realistic regression.
- **Suspended, alongside its siblings:** the assertion that a deliberate type error in a test file
  makes the gate fail. It shells out to `ngc`, so it belongs under the same marker with the same
  shape — measured cost on its own line, restore instructions in the header — and it takes the
  suspended count from seven to eight. **Recorded rather than hidden:** this batch adds to a debt
  Plan E owns instead of paying it down, and the reason is only that the suspension rule is a cost
  rule and this test costs what the rule refuses.

## Verification

The gate is the mechanism, so the induction is the proof — in the shape 8C7 through 8C10
established, guarded with `sha256sum`, restored with `git checkout --` **after staging**, and the
restore proved with `sha256sum -c`.

1. **The gate catches a test-file error.** Introduce one — a `string` assigned to a `number` in a
   test file — and `check:angular` must fail naming the **test** surface, not the layer. This is the
   whole claim of the batch: before it, that identical tree was green.
2. **The two surfaces stay distinguishable.** Introduce an error in a *primitive* instead, and the
   failure must name the shipped layer.

Beyond that: `ARENA_CHECK_STRICT=1 bun run check` reports all 23 steps at close-out, and the four
fixed sites are reported by no compile afterwards.

**The cost is stated rather than discovered.** `check:angular` measured 5.3s before this batch; the
test-directory compile measured 5.0s on its own. The gate roughly doubles, to about 10s. That is
paid once per `bun run check`, which is a completion gate rather than a per-commit toll — the same
budget that bought `check:cards` a real browser.

## Blast radius

`frameworks/angular/tsconfig.test.json` (new), `scripts/check-angular.mjs`,
`scripts/check-angular.test.mjs`, three test files under `frameworks/angular/test/`, and `CLAUDE.md`.

**No Angular source, no React source, no contract, no binding, no token.** The `protected` member
that a test reaches into stays `protected`; nothing in `frameworks/angular/primitives/` moves.

`CLAUDE.md` carries statements this batch falsifies — the *Known debt* entry stating that no gate
typechecks the directory and naming the mitigation as not done, the count of suspended tests, and
anything describing `check:angular`'s reach. **Find them by running the change-time command the 8C10
close-out published**, which was written for a component name and works unchanged here because `\b`
matches around a colon. Measured against this tree, so the batch meets a real number rather than an
instruction: `X=check:angular` returns 38 hits, `X=typecheck` 23, `X=tsconfig.check.json` 13. Judge
each — some describe history and stay true, and the entry at `CLAUDE.md:1064` is the one that
describes the tree and stops being true the moment this lands.

## What stays open

**The suspended count goes from seven to eight, and Plan E still owns all of them.** This batch adds
a test it cannot afford to run, for the same reason the other seven are off.

**A green run is a claim about types, never about behaviour.** The directory's suites can typecheck
perfectly and still assert the wrong thing — and this repo already knows the sharpest version of
that, because `setInput()` on an undiscovered signal input silently no-ops and a suite built on it
passes vacuously. Typechecking does not see that, and the `niceMax` defect this batch fixes is the
same family caught by luck: a compiler saw it because the vacuity happened to be a *type* error.
Nothing schedules a look for the vacuity that is not.

**`frameworks/react/test-dom/` and `frameworks/react/test/` have no analogue and this batch builds
none.** They are `.jsx` and there is no equivalent gate; whether they want one is a separate
question nobody has asked.

## Out of scope

The other four leftovers 8C9 recorded — `validateBinding`'s duplicate and nameless case entries,
`divergesFromReason`'s status as a documented convention, the two wrappers' untested loop bodies,
and `inventoryFrom`'s dead `patterns` — are batch 8C12. They are the behaviour layer; this is the
Angular toolchain; they share no file and no mechanism. Splitting them is a direct application of
what this repo learned in 8C6, that orthogonal work in one batch reviews worst.

Restoring any of the seven suspended tests is Plan E's, and unsuspending one here to feel better
about adding an eighth would take that decision on Plan E's behalf.
