# scripts/check/

**A gate states one claim about the tree and fails when it stops being true.** They are
registered in `GATES` in [`arena/check-all.mjs`](./arena/check-all.mjs), which `bun run check`
runs unconditionally: one failure never stops the rest, so a full sweep reports every problem
in one pass rather than the first. That array is the count, and its suite asserts the number by
literal value; a figure written here instead would rot the next time a gate lands.

## The shape of a gate

Each is a `.mjs` under `check/<domain>/`, with an npm script whose prefix names the phase
directory, and a `.test.mjs` sibling covering it. It exports its logic as pure functions
returning problem strings, and its `main()` prints them and exits non-zero. That is why the
suites can assert on a gate's exception map by name without running the gate.

**A reason-carrying map is part of the gate, not documentation of it.** `EXEMPT`,
`PASSTHROUGH`, `EXCLUDED`, `COVERED`, `UNTRACKED`: each entry names a case and says why, and a
**stale entry fails the gate itself**. That is what keeps the exception list from outliving the
exception, and it is why a debt lives beside its gate rather than in prose.

## A green run is only as good as what the gate looked at

**A gate that finds nothing reports zero violations either way**, and it does so behind a
plausible line of output. Four mechanisms produce it: a walk that iterates zero files because
the tree moved under it, a per-component path probe that wraps `existsSync` and returns `null`
so `if (!path) continue` skips a whole layer, a verification command naming a directory that
holds a fraction of the suites it claims, and a gate that is complete, passing, and registered
nowhere.

The shape is always one of two: **a lookup that cannot tell "absent" from "not found"**, or **a
path that narrows a run without narrowing what the run claims**. Both have a remedy, and both
are rules a new gate holds to:

- **Decide absence by walking the tree**, so "this layer does not implement it" and "this gate
  cannot find it" stop being the same value. Resolving by constructed path is what makes the
  per-component probe silent.
- **Make a zero-result count an explicit failure** rather than a vacuous pass. `check:tailwind`,
  `check:radius`, `check:structure`, `check:api`, `check:behaviour`, `check:dtcg` and
  `check:script-tokens` each carry one, as an exported pure function with a suite.
- **A gate has two existences, the file and every place that invokes it, and only the second
  is worth anything.** Adding a gate means adding it to `package.json` **and** to `GATES`.
  Citing a gate as evidence means confirming it is in `GATES` first.

When you write or move anything a gate resolves by path, the question is not "does it still
pass" but "how many things did it look at, and is that the number I expect".

## Exit 2 means SKIP, and a skip is never green

Three gates need a runtime dependency that plain node does not have: `check:cards` needs a
headless browser, `check:vendor` needs `Bun.build`, `check:demos` needs `Bun.Transpiler`. Where
the dependency is missing the gate exits **2**, `check-all` marks it `SKIP`, and the whole run
reports **INCOMPLETE** rather than passing. `ARENA_CHECK_STRICT=1`, or `CI=true` so an
automated run never skips quietly, turns that into a hard failure.

## What a generator-comparing gate claims

`check:tokens`, `check:fonts`, `check:vendor`, `check:demos` and `check:tailwind-generated` all
compare what a generator *would* emit against what is on disk. For the first two the file is
committed, so the claim is "the committed copy is in sync with `contracts/`". For the last
three the file is **git-ignored**, so the claim is narrower: *your working tree is built and
current*. On a clone with no build they report their subject missing and name the command to
run. See [`../build/README.md`](../build/README.md).

## The five domains

Counts below are of **registered gates**; `arena/` alone holds two files that are not one:
`check-release.mjs`, run by path rather than registered, and `check-all.mjs`, the runner
rather than a gate.

| domain | gates | |
| --- | --- | --- |
| [`arena/`](./arena/README.md) | 15 | two or more layers at once, or the repository root |
| [`tailwind/`](./tailwind/README.md) | 6 | the shared Tailwind layer |
| [`angular/`](./angular/README.md) | 4 | the Angular layer |
| [`core/`](./core/README.md) | 5 | `contracts/` and `assets/` only |
| [`react/`](./react/README.md) | 4 | the React layer |

`check-all.test.mjs` asserts every gate names one of the five domains and points at
`<domain>/<gate>.mjs`, so a gate landing outside the grid fails rather than running unnoticed.

## Adding a gate

Put it in `check/<domain>/`, add it to `GATES` with its domain in the path, give it an npm
script, and add a row to that domain's table. `check-all.test.mjs` asserts the gate list by
literal value, so the count and the order move in the same commit.

`check-release` is the one script with no npm entry and no place in `GATES`: it is run by path
before publishing, because it asserts what the *tag* hands out and there is nothing to assert
until one exists.
