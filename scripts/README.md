# scripts/

Arena's tooling, sorted so the path answers two questions before the file is opened: **what
phase** the script belongs to, and **what it is allowed to know about**.

```
scripts/
  serve.mjs   the dev server; neither a phase nor a library
  lib/        shared modules, and every test that covers one, beside it
  build/      compiles: JSX to JS, TypeScript to ESM, a CSS layer, a vendor bundle
  generate/   emits source from data: DTCG JSON to CSS, contracts to types, fonts
  check/      the gates
```

Each phase has its own README, and each `<phase>/<domain>/` that holds scripts has a table
saying why every file in it exists.

- [`build/README.md`](./build/README.md): **and how to compile Arena for the first time.**
  A fresh clone must build before `bun run demos` or `bun run check` mean anything.
- [`generate/README.md`](./generate/README.md): why generate is not build.
- [`check/README.md`](./check/README.md): the shape of a gate, and the SKIP protocol.
- [`lib/README.md`](./lib/README.md): the bottom of the graph, and how a module is placed.

`lib/` and the three phases all hold the same five domains, and **all five exist even when
empty**: a `.gitkeep` marks a combination nothing occupies yet, so the shape stays legible
rather than implied:

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

**A library that touches nothing is placed by the vocabulary it speaks**, because most of
`lib/` is pure functions and the reads-and-writes test cannot separate them.
`core/serialize-token.mjs` opens no file, but every name in it is a DTCG one, so it is `core`;
`core/behaviour-compliance.mjs` is the same, in `contracts/behaviour`'s vocabulary of
requirement keys. What is left over is `arena`, meaning the parsers, the browser harness, `layers.mjs`
and `repo-root.mjs`, because it belongs to no layer in particular. Never place a library by
**who imports it**: `behaviour-compliance.mjs` is read from both framework layers' harnesses
and is still `core`.

**An npm script's prefix names its phase directory.** `bun run generate:tokens` runs something
under `generate/`, `bun run build:demos` something under `build/`. Three gates have no npm
script and are run by path: `check-ramp`, `check-text-contrast` and `check-release`.

## Rules a script here holds to

**Never count `..` to find the repository root.** Import `repoRoot` from
`lib/arena/repo-root.mjs`. A script deriving the root from its own location breaks on a move,
silently, because the wrong path still exists. That module is
the one place that counts, which is why moving *it* is the one move needing care.

**A library never imports a gate.** `lib/` is the bottom of the graph: `arena/layers.mjs`,
`core/arena-tokens.mjs` and the rest are there because more than one gate reads them, and a
gate reaching down is the only direction allowed. Across domains the same holds in both
directions: `core/arena-tokens.mjs` imports `../arena/css-decls.mjs` and nothing forbids it,
because a domain is a statement about subject matter, not a visibility boundary.

**A test lives beside what it tests**, in the same directory, which for a `lib/` module means
the same domain, not merely somewhere under `lib/`.

**A file here may carry one header comment, at most ten lines**, the exception `check:docs`
grants `scripts/` and test files. Anything that will not fit goes in the gate's own reason
strings, which its paired suite already asserts by name.

**A test under `scripts/` may not import a framework layer's `.ts` or `.tsx`.** `check-all.mjs`
also runs these suites under plain node, which cannot resolve the extensionless imports those
toolchains expect.

**A file a script writes is named `<stem>.generated.<ext>`**, so the name says so and no
reader has to open it. Whether it is tracked is the separate question `.gitignore` answers,
for one of two reasons: the git tag has to serve it to a browser directly, true of
`contracts/design-generated/` and the `assets/fonts/` binaries, because the Claude Code plugin
is served from that tag; or a clone cannot reproduce it, true of
`assets/fonts/Fonts.generated.json`, whose rebuild needs the network. Everything a script
writes under `frameworks/` is ignored. `check:generated` holds both halves, and records the
two generated outputs that can carry neither the infix nor a header: the font binaries under
`assets/fonts/` and `intro/support.js`.

## Adding a gate

Put it in `check/<domain>/`, add it to `GATES` in `check/arena/check-all.mjs` with its domain
in the path, give it an npm script, and add a row to that domain's README table.
`check-all.test.mjs` asserts every gate names one of the five domains, so a gate landing
outside the grid fails rather than running unnoticed.
