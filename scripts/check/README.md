# scripts/check/

**A gate states one claim about the tree and fails when it stops being true.** Twenty-six of
them, registered in `GATES` in [`arena/check-all.mjs`](./arena/check-all.mjs), which
`bun run check` runs unconditionally — one failure never stops the rest, so a full sweep
reports every problem in one pass rather than the first.

## The shape of a gate

Each is a `.mjs` under `check/<domain>/`, with an npm script whose prefix names the phase
directory, and a `.test.mjs` sibling covering it. It exports its logic as pure functions
returning problem strings, and its `main()` prints them and exits non-zero. That is why the
suites can assert on a gate's exception map by name without running the gate.

**A reason-carrying map is part of the gate, not documentation of it.** `EXEMPT`,
`PASSTHROUGH`, `EXCLUDED`, `COVERED`, `UNTRACKED` — each entry names a case and says why, and a
**stale entry fails the gate itself**. That is what keeps the exception list from outliving the
exception, and it is why this debt lives here rather than in `DOUBTS.md`.

## Exit 2 means SKIP, and a skip is never green

Three gates need a runtime dependency that plain node does not have: `check:cards` needs a
headless browser, `check:vendor` needs `Bun.build`, `check:demos` needs `Bun.Transpiler`. Where
the dependency is missing the gate exits **2**, `check-all` marks it `SKIP`, and the whole run
reports **INCOMPLETE** rather than passing. `ARENA_CHECK_STRICT=1` — or `CI=true`, so an
automated run never skips quietly — turns that into a hard failure.

## What three of these gates now claim

`check:tokens`, `check:fonts`, `check:vendor`, `check:demos` and `check:tailwind-generated` all
compare what a generator *would* emit against what is on disk. For the first two the file is
committed, so the claim is "the committed copy is in sync with `contracts/`". For the last
three the file is **git-ignored**, so the claim is narrower: *your working tree is built and
current*. On a clone with no build they report their subject missing and name the command to
run. See [`../build/README.md`](../build/README.md).

## The five domains

Counts below are of **registered gates**; `arena/` and `core/` each hold one more script that
is run by path and one — `check-all.mjs` — that is the runner rather than a gate.

| domain | gates | |
| --- | --- | --- |
| [`arena/`](./arena/README.md) | 11 | two or more layers at once, or the repository root |
| [`tailwind/`](./tailwind/README.md) | 5 | the shared Tailwind layer |
| [`angular/`](./angular/README.md) | 4 | the Angular layer |
| [`core/`](./core/README.md) | 4 | `contracts/` and `assets/` only |
| [`react/`](./react/README.md) | 2 | the React layer |

`check-all.test.mjs` asserts every gate names one of the five domains and points at
`<domain>/<gate>.mjs`, so a gate landing outside the grid fails rather than running unnoticed.

## Adding a gate

Put it in `check/<domain>/`, add it to `GATES` with its domain in the path, give it an npm
script, and add a row to that domain's table. `check-all.test.mjs` asserts the gate list by
literal value, so the count and the order move in the same commit.

Three gates have no npm script and are run by path: `check-ramp`, `check-text-contrast` and
`check-release`.
