# Arena's contracts

Three levels, one roof. Each states, once and neutrally, something every platform
target implements — and each has exactly one normative document, which is the file
beside this one in its directory.

| Level | Governs | Normative document |
|---|---|---|
| [`api/`](api/README.md) | the members a component's API presents | `api/README.md` |
| [`behaviour/`](behaviour/README.md) | what a kind of component must do — roles, keys, focus, dismissal | `behaviour/README.md` |
| [`design/`](design/README.md) | what a value is | `design/README.md` |

Read the one for the level you are implementing. None of the three is a summary of
another: `design/` answers *what is this value*, `behaviour/` answers *what must this
component do*, and `api/` answers *what does a consumer write*. A component can satisfy
any one of them while failing the other two.

## Why only design has a `-generated` sibling

`design-generated/` holds the five CSS files built from `design/` — four by Style
Dictionary (`bun run build:tokens`) and `fonts.css` by `scripts/fetch-fonts.mjs`, which can
also rebuild that one file alone, from the binaries already committed under `assets/fonts/`
and with no network involved, via `--css-only`. Never edit any of the five directly; edit
the source and rebuild.

The other two levels have no such directory because they emit nothing outside
`frameworks/`. `api/` generates `Api.generated.*` and `design/` also generates
`Tokens.generated.*`, but those are emitted **per layer**, into the layer that consumes
them, so a component's import never crosses a contract boundary. What makes `design`
different is that its CSS ships to consumers directly: `styles.css` at the repository
root imports all five, plus the hand-authored `design/colors.css`.

So `design-generated/` is a fact about what this one level emits, not a convention
waiting to be applied to the other two. `contracts/api-generated/` would be empty.

## Two shapes, on purpose

`api/` keeps `components/` and `types/`; `behaviour/` and `design/` are flat. An inner
directory earns its place when it separates two different vocabularies — a component
contract and a shared type are different things, and `check:api` reads them as two sets.
`patterns/` and `src/` separated their contents from nothing but the README beside them,
which is why flattening `behaviour/patterns/` into `contracts/behaviour/` and
`tokens/src/` into `contracts/design/` lost nothing.

## What checks each level

`bun run check:api` and `bun run check:behaviour` each fail on an empty directory rather
than reporting zero violations over a tree they never opened — `zeroContractProblems` in
`check-api.mjs` and `zeroPatternProblems` in `check-behaviour.mjs` are the guards, by
name. `design/` carries the same guard under a different name: `bun run check:dtcg` walks
`contracts/design/` itself and fails the same way on zero token files. `check:tokens` and
`check:script-tokens` don't walk the directory — they compare the committed generated
output against what `contracts/design/` builds — so a source file gone missing fails
them too, just not silently: the build they depend on has nothing to read and stops
rather than reporting a clean pass.

None of the five is a claim that a component is correct: `check:behaviour`'s green run is
a coverage claim and never an accessibility one, and `check:api` says nothing about what
any component *does*.
