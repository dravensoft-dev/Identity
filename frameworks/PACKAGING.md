# Packaging Arena for npm

Arena ships four ways from one tree. Three of them assume the consumer has this repository:
the Claude Code plugin, served from the git tag; the copy-in kit; and the Agent Skill. The
fourth does not, and this document is that one: **two npm packages a project installs with
`bun add`**.

| package | assembled into | from |
| --- | --- | --- |
| `@dravensoft/arena-react` | `frameworks/react/dist/` | `frameworks/react/` |
| `@dravensoft/arena-angular` | `frameworks/angular/dist/` | `frameworks/angular/` plus the slice of `frameworks/tailwind/` its recipes read |

```bash
bun run build:packages     # both, from the sources in place
bun run check:packages     # the manifests, and the CLI against the token pipeline
```

Each package's own `README.md` is what a consumer reads. They are authored here as
[`react/PACKAGE.md`](./react/PACKAGE.md) and [`angular/PACKAGE.md`](./angular/PACKAGE.md),
and the assembly copies each into its `dist/` as `README.md`. They live in the tree rather
than being written into `dist/` directly for one reason: `check:docs` reads them, so the
page npm shows holds to the same size, punctuation and comment rules as everything else.

## The one decision everything else follows from

**A published Arena carries the language and never the skin.**

This repository's `contracts/design/palette.{dark,light}.json` is the Dravensoft skin. It is
the source Style Dictionary reads, and `check:ramp` and `check:text-contrast` measure it. It
is also the last thing a consumer wants: they are installing a design system to wear their
own brand, not Dravensoft's.

So the packages ship everything that is invariant, and the consumer declares the rest:

- **Invariant, in the package**: the reset, the type scale, the spacing and density scales,
  the effects, the layering, and `colors.css`, which never defines a skin value and only
  derives the muted text levels from `--color-base-content`.
- **The consumer's, in `arena.config.json`**: the palettes and the fonts.

A command in each package, `arena-theme`, turns that JSON into the missing stylesheet. Its
source is [`scripts/generate/core/arena-theme/`](../scripts/generate/core/arena-theme/README.md),
copied whole into `dist/bin/`.

**Import order is what makes it work.** The consumer's generated file comes last, and its
first line is an `@import` of the package's own `arena.css`. Both files declare into `:root`,
equal specificity, so source order decides and the consumer's values win.

**Phosphor is never bundled.** Arena's single-icon convention is a class name a component
renders, so the icons are a peer dependency in both packages. Bundling them would ship a
font the consumer may already have and cannot swap.

## Assembly, not restructuring

Nothing moves. `bun run build:packages` reads the tree as it stands and writes two
directories that were not there before. The three older channels keep working on the same
files, byte for byte.

The shared half is [`scripts/lib/arena/package-assembly.mjs`](../scripts/lib/arena/package-assembly.mjs):
the exclusion list, the copy that honours it, the CSS chain and the manifest template.
Neither half compiles anything, because the two layers need different compilers.

**React** goes through `Bun.Transpiler`, the same path `build-demos.mjs` already uses, and
each hand-written `.d.ts` is copied rather than re-emitted, since those are the layer's real
type contract. There is exactly one rewrite: a relative `.jsx` specifier becomes `.js`,
because inside the package there is no JSX left to resolve. The entry point is
`Index.generated.js`, which `build:react-barrel` derives from the component directories.

**Angular** goes through `ng-packagr` into Angular Package Format. That needs a staging tree,
and the reason is worth stating because it is not obvious: ng-packagr infers `rootDir` from
the entry file's directory and refuses any source outside it, while every `.variants.ts`
imports a Tailwind manifest four directories up. So the layer is staged at
`build/angular-package/` with that slice of `frameworks/tailwind/` beside it, and each
specifier is repointed to the depth it now sits at.

**The Tailwind layer is not a third package.** It is data travelling one way into Angular,
which is the single edge `check:layer-independence` declares `ALLOWED`, and no consumer of
the Angular package ever names it. The compiled `Utilities.generated.css` ships too, so a
consumer needs no Tailwind at all; the `@theme` preset ships beside it for one who already
runs Tailwind v4 and would rather compile.

### What never ships

Tests in any extension, demo pages, `.card.html` specimens, `.card.entry` scripts, behaviour
bindings, component prompts, the vendored React bundles, the test harnesses, the tsconfigs,
and the font binaries. `EXCLUDED_NAMES` and `EXCLUDED_PATTERNS` are the record, and the
suite beside them asserts both by name.

The absent tests are deliberate. A consumer installs components, not suites, and every claim
those suites make is already proven in this repository before a package is cut.

## `dist/` is git-ignored, and every gate skips it

A package is served from the registry and rebuilt from the tagged sources, so committing it
would put thousands of generated lines into every diff for no gain. That is the opposite call
from `contracts/design-generated/`, and the difference is audience: the plugin is served
**from the git tag**, so ignoring the token CSS would ship a tag whose `intro/styles.css`
`@import`s resolve to nothing, unstyled and silent.

The consequence is the one real hazard here: `dist/` puts a copy of each layer inside the
tree several gates walk, and a gate reading that copy as source sees duplicate constants, a
second declaration of every script token, and components whose dimensions were judged once
already. Six gates skip a directory named `dist`, and each asserts the exclusion in its own
suite against a fixture holding exactly the file that would otherwise fail:
`check:docs`, `check:dimensions`, `check:duplicate-constants`, `check:script-tokens`,
`check:layer-independence` and `check:generated`.

## The version

`.claude-plugin/plugin.json` is the authority, as it already is for the plugin, the
marketplace, the README header and the tag. `baseManifest()` stamps it into both packages,
so no manifest is ever hand-versioned and the two cannot drift apart.

## What `check:packages` holds

**That the two palette emitters agree.** There are now two things that turn a palette into
CSS: Style Dictionary, which serves this repository, and `arena-theme`, which serves a
consumer who has no repository. The gate builds a config out of Arena's own skin, runs the
CLI over it, and asserts every `--color-*` declaration matches
`contracts/design-generated/palette.generated.css` in both blocks. A comparison that looked
at nothing is an explicit failure, not a vacuous pass.

**That an assembled package is registry-standard.** The version comes from `plugin.json`,
every `exports` target was actually emitted, there is no install script, there is a README,
and Phosphor is a peer rather than a dependency. `dist/` is ignored, so on a fresh clone that
half is skipped and the run says which.

The palette half runs anywhere. Neither half says anything about whether a component behaves
correctly; that is `check:compliance`, and it runs against the sources.

## Publishing

Not yet, and what is left is the automation rather than the account. **The `@dravensoft`
scope is registered**, and both names are free: nothing is published under either. Confirm it
without an npm login, since the org page answers 403 to everyone and proves nothing either
way:

```bash
curl -s https://registry.npmjs.org/-/org/dravensoft/user      # {} means the scope is taken
curl -s https://registry.npmjs.org/-/org/zzq-not-a-real/user  # "Scope not found" is the other answer
curl -s -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/@dravensoft%2farena-react
```

An empty object is the scope existing with a membership npm does not show anonymously, which
is what `@vuejs` answers too; a name that is free answers 404.

What is still missing is the release workflow and npm trusted publishing (OIDC), which needs
`permissions: id-token: write` on a GitHub-hosted runner. **One thing to settle before the
first release rather than inside CI**: a trusted publisher is configured in a *package's*
settings on npmjs.com, and a package that has never been published has no settings to
configure, so the bootstrap is likely one manual authenticated `npm publish` each.

Whenever that step comes it inherits the existing release rule: the version moves in
`plugin.json`, `marketplace.json` and the README header together, `CHANGELOG.md` records it,
`source.ref` names the tag, and `check-release.mjs` refuses the combination that fails
silently. The two manifests take that same version from `plugin.json` at assembly, so a
published package can never disagree with the tag it was cut from.
