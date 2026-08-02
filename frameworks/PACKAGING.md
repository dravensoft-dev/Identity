# Packaging Arena for npm

Arena ships three ways from one tree. Two of them assume the consumer has this repository:
the Claude Code plugin, served from the git tag, and the Agent Skill. The third does not,
and this document is that one: **two npm packages a project installs with `bun add`**.

| package | assembled into | from |
| --- | --- | --- |
| `@dravensoft/arena-react` | `frameworks/react/dist/` | `frameworks/react/` |
| `@dravensoft/arena-angular` | `frameworks/angular/dist/` | `frameworks/angular/` plus the slice of `frameworks/tailwind/` its recipes read |

```bash
bun run build               # the generated sources build:packages reads
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
directories that were not there before. The two other channels keep working on the same
files, byte for byte.

The shared half is [`scripts/lib/arena/package-assembly.mjs`](../scripts/lib/arena/package-assembly.mjs):
the exclusion list, the copy that honours it, the CSS chain and the manifest template.
Neither half compiles anything, because the two layers need different compilers.

**React** goes through `Bun.Transpiler`, the same path `build-demos.mjs` already uses, and
each declaration is EMITTED by `tsc` rather than copied, so it cannot disagree with the
implementation it describes. There is exactly one rewrite: a relative source specifier, in any of `.ts`, `.tsx`, `.jsx`
or `.js`, becomes `.js`, because inside the package none of those extensions resolves; only
the compiled `.js` does. The entry point is
`Index.generated.ts`, the barrel `build:react-barrel` derives from the component
directories, and it goes through that same compile, so the package exports
`Index.generated.js` beside the declaration `tsc` emits for it.

**Angular** goes through `ng-packagr` into Angular Package Format. That needs a staging tree,
and the reason is worth stating because it is not obvious: ng-packagr infers `rootDir` from
the entry file's directory and refuses any source outside it, while every `.variants.ts`
imports a Tailwind manifest four directories up. So the layer is staged at
`frameworks/angular/build/package/` with that slice of `frameworks/tailwind/` beside it, and each
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

**Both packages are on npm, under the `@dravensoft` scope, and publishing is done by hand.**
That is a choice rather than a gap: a release is already a deliberate, user-triggered act
here, and one `npm publish` per package at the end of it costs less than a workflow to
maintain. Trusted publishing over OIDC stays available whenever the cost flips; the note at
the end of this section says what it would take.

A release publishes the packages last, after the tag exists, because the tag is what every
other surface is pinned to:

```bash
# 1. the four surfaces, in one commit, then the tag on it
#    plugin.json (the authority), marketplace.json version AND source.ref,
#    the README header, and CHANGELOG's [Unreleased] renamed to the version
git tag -a vX.Y.Z -m "Arena vX.Y.Z"
git push origin main --follow-tags

# 2. prove the release before anything leaves the machine
bun scripts/check/arena/check-release.mjs
bun run build                   # the generated sources build:packages reads
bun run build:packages          # the manifests take the version from plugin.json here
bun run check:packages          # and this fails if they did not

# 3. publish, from INSIDE each dist, never from the repository root
npm login                       # a two-hour session; 2FA is enforced on publish
cd frameworks/react/dist   && npm publish --dry-run && npm publish
cd ../../angular/dist      && npm publish
```

Four things about that last step, each of which has a way of going wrong:

- **Publish from inside `dist/`.** The root `package.json` is private and npm would refuse it.
- **Do not pass `--access public`.** Both manifests already carry it in `publishConfig`.
- **Do not pass `--provenance`.** It needs OIDC and fails from a laptop.
- **React first.** If something is wrong, find it in the 73 kB package rather than halfway
  through.

### A 404 right after publishing is not a failure

**The registry has two read paths and they do not move together.** For several minutes after
a successful publish, `npm view` and `npm owner ls` answer 404 while the package is perfectly
published, because those read a CDN that has not caught up. Measured on the 5.0.0 release:
five minutes, with the two packages appearing a minute apart from each other.

The authenticated API is what answers truthfully, and it is the only check worth running:

```bash
npm access list packages @dravensoft   # lists what EXISTS, whatever the CDN says
```

Read the publish log rather than the next command's output. A publish that worked ends with
`PUT 200`, `exit 0` and `info ok`, and the `401` above it is not an error: it is the 2FA
handshake starting, before npm retries with the validated session.

### What trusted publishing would take

`permissions: id-token: write` on a GitHub-hosted runner, plus a trusted publisher configured
in **each package's** settings on npmjs.com. That configuration is why the first publish had
to be manual: a package nobody has published has no settings to configure. Now that both
exist, the bootstrap problem is gone and the switch can be made at any time. Self-hosted
runners are not supported.

Whatever the mechanism, it inherits the existing release rule: the version moves in
`plugin.json`, `marketplace.json` and the README header together, `CHANGELOG.md` records it,
`source.ref` names the tag, and `check-release.mjs` refuses the combination that fails
silently. The two manifests take that same version from `plugin.json` at assembly, so a
published package can never disagree with the tag it was cut from.
