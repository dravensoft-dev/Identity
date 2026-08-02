# scripts/build/

**Build compiles an existing source into another form.** The input is already something a
person wrote, a `.tsx`, a `.ts`, a Tailwind preset or a CommonJS package, and the output says
the same thing in a form a browser or a test runner can load. Nothing here decides a value;
that is [`../generate/`](../generate/README.md).

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

That runs the seven steps in order, the token layer first, because the Tailwind preset compiles
against the token CSS:

```
generate:tokens → generate:api → build:react-barrel → build:tailwind → build:vendor → build:demos → build:angular-demo
```

**Until it has run once, part of the tree does not exist.** These are git-ignored, so a fresh
clone has none of them:

| missing until you build | what notices |
| --- | --- |
| `frameworks/react/Api.generated.ts` and `frameworks/angular/Api.generated.ts` | every component importing a contract type; `check:api` |
| `frameworks/react/Tokens.generated.js` and `frameworks/angular/Tokens.generated.ts` | every component doing arithmetic on a token; `check:script-tokens` |
| `frameworks/react/Index.generated.ts` | the layer's entry point, which the package build compiles; `check:react-barrel` |
| `frameworks/react/vendor/*.generated.js` | every React `*.card.html`; `check:vendor` |
| `frameworks/react/**/*.generated.js`, one per component and demo entry source | every React demo page; `check:demos` |
| `frameworks/tailwind/components/**/*.manifest.generated.ts`, one per `<Name>.manifest.json` | every Angular `<Component>.variants.ts`; `check:tailwind-generated` |
| `frameworks/tailwind/Breakpoints.generated.css` | `Theme.css` imports it, so `build:tailwind` fails outright without it; `check:tokens` |
| `frameworks/tailwind/Utilities.generated.css` | every Tailwind and Angular specimen; `check:tailwind-generated` |
| `frameworks/angular/build/demo/` | the Angular `*.card.html` pages; `check:angular-demos` |

So on a clone with no build, `bun run demos` serves unstyled or blank pages, neither framework
layer compiles, because a component's import of `Api.generated` or `Tokens.generated` resolves
to nothing, and every gate in that table reports its subject missing. **That is the intended
signal, not a failure**: the message each prints names the command to run. `bun run demos`
builds first for exactly this reason.

`bun run build` is idempotent: running it on a clean tree leaves `git status` empty. If it does
not, a generator and a committed file disagree, which is what `check:tokens` and `check:fonts`
exist to say out loud.

`build:angular-tests` is deliberately **not** part of `bun run build`. It emits into
git-ignored `frameworks/angular/build/test/` and is run by `bun run test` and `bun run check` themselves,
always immediately before the suites that read it, because staleness there is prevented by
ordering rather than by a gate.

## The five domains

A script's domain is decided by what it **touches**, never by what it is about.

| domain | scripts | |
| --- | --- | --- |
| [`angular/`](./angular/README.md) | 3 | the AOT emits: demo bundles, the package and the test surface |
| [`react/`](./react/README.md) | 4 | JSX to JS, the barrel, the package, and the CommonJS→ESM vendor bundle |
| [`tailwind/`](./tailwind/README.md) | 1 | the utility layer and the manifest modules |
| `core/` | none | empty; `.gitkeep` marks the combination as unoccupied |
| `arena/` | none | empty; no build touches two layers at once |

`core` and `arena` exist even while empty so the grid stays legible rather than implied. See
[`../README.md`](../README.md) for what each domain is allowed to read and write.
