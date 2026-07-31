# scripts/

Arena's tooling, sorted so the path answers two questions before the file is opened: **what
phase** the script belongs to, and **what it is allowed to know about**.

```
scripts/
  serve.mjs   the dev server; none of the three phases
  lib/        shared modules, and every test that covers one, beside it
  build/      compiles: JSX to JS, TypeScript to ESM, a CSS layer, a vendor bundle
  generate/   emits source from data: DTCG JSON to CSS, contracts to types, fonts
  check/      the gates
```

Each phase holds the same five domains, and **all five exist even when empty** — a `.gitkeep`
marks a combination nothing occupies yet, so the shape stays legible rather than implied:

| domain | what a script there is allowed to read and write |
| --- | --- |
| `core` | `contracts/` only (and `assets/`, which the design layer owns) |
| `react` | the `frameworks/react/` layer |
| `angular` | the `frameworks/angular/` layer |
| `tailwind` | the `frameworks/tailwind/` layer |
| `arena` | two or more layers at once, or the repository root |

The domain is decided by what a script **touches**, never by what it is about.
`generate/arena/generate-tokens.mjs` reads `contracts/design/` but writes
`Tokens.generated.*` into both framework layers, so it is `arena` and not `core`.

**An npm script's prefix names its phase directory.** `bun run generate:tokens` runs something
under `generate/`, `bun run build:demos` something under `build/`. Three gates have no npm
script and are run by path: `check-ramp`, `check-text-contrast` and `check-release`.

## Rules a script here holds to

**Never count `..` to find the repository root.** Import `repoRoot` from `lib/repo-root.mjs`.
Twenty-five scripts once derived it from their own location, which made every one of them
break on a move, silently — the wrong path still exists.

**A library never imports a gate.** `lib/` is the bottom of the graph: `layers.mjs`,
`arena-tokens.mjs` and the rest are there because more than one gate reads them, and a gate
reaching down is the only direction allowed.

**A test lives beside what it tests**, which puts the tests for `lib/` modules inside `lib/`.

**A file here may carry one header comment, at most ten lines** — the exception `check:docs`
grants `scripts/` and test files. Everything else it has to say goes in `DOUBTS.md`.

**A test under `scripts/` may not import a framework layer's `.ts` or `.jsx`.** `check-all.mjs`
also runs these suites under plain node, which cannot resolve the extensionless imports those
toolchains expect.

## Adding a gate

Put it in `check/<domain>/`, add it to `GATES` in `check/arena/check-all.mjs` with its domain
in the path, and give it an npm script. `check-all.test.mjs` asserts every gate names one of
the five domains, so a gate landing outside the grid fails rather than running unnoticed.
