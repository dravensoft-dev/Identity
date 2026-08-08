# scripts/build/

**Build compiles an existing source into another form.** The input is already something a
person wrote, a `.tsx`, a `.ts`, a Tailwind preset or a CommonJS package, and the output says
the same thing in a form a browser or a test runner can load. Nothing here decides a value;
that is [`../generate/`](../generate/AGENTS.md).

Every output is named `<stem>.generated.<ext>`, so the name says a script writes it. Which of
those are tracked and which are not is the separate question `.gitignore` answers, for one of
two reasons: the git tag has to serve it to a browser directly, true of
`contracts/design-generated/` and the `assets/fonts/` binaries; or a clone cannot reproduce
it, true of `assets/fonts/Fonts.generated.json`, whose rebuild needs the network. Everything a
script writes under `frameworks/` is ignored. `check:generated` holds both halves.

## Compile Arena for the first time

```bash
bun install
bun run build
```

**The order is derived, not written down.** `scripts/graph/run-build.ts` sorts the steps by what
each declares in its own `node`, so `generate:tokens` runs before `build:tailwind` because the
Tailwind preset reads the token CSS and the edge says so, rather than because a chain in
`package.json` happens to list it first. Ties fall in the order the scripts are collected, so the
sequence is stable. Read the order off a run, which prints every step and why it ran; there is no
second copy of it to go stale. `scripts/graph/AGENTS.md` carries how a step declares itself, and
`check:graph` refuses a step whose declaration and edges disagree.

**Until it has run once, part of the tree does not exist.** These are git-ignored, so a fresh
clone has none of them:

| missing until you build | what notices |
| --- | --- |
| `frameworks/react/Api.generated.ts` and `frameworks/angular/Api.generated.ts` | every component importing a contract type; `check:api` |
| `frameworks/react/Tokens.generated.js` and `frameworks/angular/Tokens.generated.ts` | every component doing arithmetic on a token; `check:script-tokens` |
| `frameworks/react/Index.generated.ts` | the layer's entry point, which the package build compiles; `check:react-barrel` |
| `frameworks/react/vendor/*.generated.js` | every React demo page's importmap; `check:vendor` |
| `frameworks/react/**/*.generated.js`, one per component and demo entry source | every React demo page; `check:demos` |
| `frameworks/tailwind/components/**/*.manifest.generated.ts`, one per `<Name>.manifest.json` | every Angular `<Component>.variants.ts`; `check:tailwind-generated` |
| `frameworks/tailwind/Breakpoints.generated.css` | `Theme.css` imports it, so `build:tailwind` fails outright without it; `check:tokens` |
| `frameworks/tailwind/Utilities.generated.css` | the oracle `check:style-parity` measures against; never published |
| `frameworks/tailwind/consume/`: one `<Component>.styles.generated.css` per manifest, plus `Prelude`, `Preflight` and the `Components` barrel | every specimen and playground, the Console, and both packages |
| `frameworks/angular/build/demo/` | the Angular demo pages; `check:angular-demos` |
| `frameworks/**/*.demo.generated.html` and its entry, one per component per layer | the demo pages themselves; `check:playgrounds`, and `check:angular-demos` for the Angular half |

So on a clone with no build, `bun run demos` serves unstyled or blank pages, neither framework
layer compiles, because a component's import of `Api.generated` or `Tokens.generated` resolves
to nothing, and every gate in that table reports its subject missing. **That is the intended
signal, not a failure**: the message each prints names the command to run. `bun run demos`
builds first for exactly this reason.

`bun run build` is idempotent: running it on a clean tree leaves `git status` empty. If it does
not, a generator and a committed file disagree, which is what `check:tokens` and `check:fonts`
exist to say out loud.

**A step whose inputs have not moved keeps the answer it had**, and the run says so and at what
fingerprint. A `touch` keeps it, and so does checking out another branch and coming back: the stat
filters and the content hash arbitrates. What invalidates a step is a changed byte in what it
reads, a script it imports moving, an upstream having run, or one of its own artifacts being gone.

**`bun run build:release` is the full run**, and it is what every workflow uses. It passes
`--force --assert-full`: every step runs, and a run that kept anything fails on its own. That is
not belt and braces. The step after the build in each workflow proves it idempotent with
`git diff --exit-code`, and a build that skipped everything satisfies that by doing nothing, which
is the one way this whole arrangement could turn a real failure green.

`build:angular-tests` is deliberately **not** part of `bun run build`. It emits into
git-ignored `frameworks/angular/build/test/` and is run by `bun run test` and `bun run check` themselves,
always immediately before the suites that read it, because staleness there is prevented by
ordering rather than by a gate.

## The five domains

A script's domain is decided by what it **touches**, never by what it is about.

| domain | what a build there compiles |
| --- | --- |
| [`angular/`](./angular/AGENTS.md) | the AOT emits: demo bundles, the package and the test surface |
| [`arena/`](./arena/AGENTS.md) | the `intro/` page bundles, which are what let those pages read `scripts/lib/` |
| [`react/`](./react/AGENTS.md) | JSX to JS, the barrel, the package, and the CommonJS→ESM vendor bundle |
| [`tailwind/`](./tailwind/AGENTS.md) | the utility layer and the manifest modules |
| `core/` | empty; `.gitkeep` marks the combination as unoccupied |
| `arena/` | empty; no build touches two layers at once |

**Count them rather than reading a figure here.** The two empty domains are the claim, so an
answer other than zero for either is a domain that gained an occupant without gaining a reason:

```bash
for d in angular arena core react tailwind; do
  printf '%-9s %s\n' "$d" "$(find scripts/build/$d -name '*.mjs' ! -name '*.test.mjs' | wc -l)"
done
```

`core` and `arena` exist even while empty so the grid stays legible rather than implied. See
[`../AGENTS.md`](../AGENTS.md) for what each domain is allowed to read and write.
