# Packaging Arena for npm

> **For whoever builds or publishes a package.** Installing one instead? Read [`react/PACKAGE.md`](./react/PACKAGE.md) or
> [`angular/PACKAGE.md`](./angular/PACKAGE.md), which is the page npm shows.

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
source is `scripts/generate/core/arena-theme/`, described in
[`scripts/generate/core/README.md`](../scripts/generate/core/README.md),
copied whole into `dist/bin/`.

**Import order is what makes it work.** The consumer's generated file comes last, and its
first line is an `@import` of the package's own `arena.css`. Both files declare into `:root`,
equal specificity, so source order decides and the consumer's values win.

**Phosphor is never bundled.** Arena's single-icon convention is a class name a component
renders, so the icons are a peer dependency in both packages. Bundling them would ship a
font the consumer may already have and cannot swap.

## Two couplings, and they are part of the contract

**A package's appearance is Tailwind, the way its iconography is Phosphor.** Neither is an
implementation detail a future version quietly swaps, and both are worth saying plainly,
because an adopter budgets for a dependency they were told about and resents one they find.

- **Phosphor** travels as a **peer dependency** of both packages. Every `icon` member is a
  class name the consumer supplies and a component renders, so the font has to be installed
  and the names have to be Phosphor's. `check:icons` holds the names Arena itself writes.
- **Tailwind** travels as **two runtime dependencies of both packages**, `tailwind-variants`
  and `tailwind-merge`. Every component's appearance, in either layer, is a class string
  resolved from the shared recipe layer through the configured `tv`, so the recipes are not
  swappable for another styling system without rewriting every component, and the compiled
  sheet inside `arena.css` is what those classes resolve against.

  What differs between the two packages is how the recipe reaches them, and it is an assembly
  detail rather than a second coupling. The Angular package stages a slice of
  `frameworks/tailwind/` beside the layer and rewrites each specifier to reach it; the React
  package stages none, because its manifest modules and its configured `tv` are emitted into
  the React layer itself, so a component's import crosses no boundary and the layer compiles
  with no `rootDir` outside it.

**What the compiled `Utilities.generated.css` saves is the BUILD, not the coupling.** It
ships as `css/utilities.css`, so an adopter who does not run Tailwind never compiles
anything and still gets the right rules; an adopter who does run Tailwind v4 imports the
`@theme` preset beside it and compiles their own, which is smaller. Either way the class
strings on the elements are Tailwind's, and a project that wants none of that wants a
different design system.

**The Tailwind layer is still not a third package.** It is data travelling one way into
Angular, the single edge `check:layer-independence` declares `ALLOWED`, and no consumer of
the Angular package ever imports it by name.

## Assembly, not restructuring

Nothing moves. `bun run build:packages` reads the tree as it stands and writes two
directories that were not there before. The two other channels keep working on the same
files, byte for byte.

The shared half is [`scripts/lib/arena/package-assembly.mjs`](../scripts/lib/arena/package-assembly.mjs):
the exclusion list, the copy that honours it, the CSS chain and the manifest template.
Neither half compiles anything, because the two layers need different compilers.

**React** goes through `Bun.Transpiler`, the same path `build-demos.mjs` already uses, and
each declaration is EMITTED by `tsc` rather than copied, so it cannot disagree with the
implementation it describes. There is exactly one rewrite, and it normalises every relative
specifier to `.js`: one carrying `.ts`, `.tsx`, `.jsx` or `.js` is retargeted, and one carrying
no extension gains it. Inside the package only the compiled `.js` resolves, and a consumer on
`node16` infers no extension from a declaration, where this layer's own `bundler` resolution
makes it optional. Neither half is taken on trust: `unresolvedProblems` resolves every specifier
in every emitted module and declaration against what the package holds, so one naming nothing
fails the build rather than the consumer's editor. The entry point is
`Index.generated.ts`, the barrel `build:react-barrel` derives from the component
directories, and it goes through that same compile, so the package exports
`Index.generated.js` beside the declaration `tsc` emits for it.

**Angular** goes through `ng-packagr` into Angular Package Format. That needs a staging tree,
and the reason is worth stating because it is not obvious: ng-packagr infers `rootDir` from
the entry file's directory and refuses any source outside it, while every `.variants.ts`
imports a Tailwind manifest four directories up. So the layer is staged at
`frameworks/angular/build/package/` with that slice of `frameworks/tailwind/` beside it, and each
specifier is repointed to the depth it now sits at.

**Angular's staging tree is the shape that coupling takes at build time**, and the section
above is what it means for an adopter.

### What never ships

Tests in any extension, demo pages, `.card.html` specimens, `.demo.` playgrounds, behaviour
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
marketplace, the README's artifact list and the tag. `baseManifest()` stamps it into both packages,
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

**Both packages are on npm, under the `@dravensoft` scope, and a workflow publishes them.**
What a release does by hand is move the surfaces and push the tag; everything after that is
`.github/workflows/npm-publish-react-package.yml` and its Angular twin, each firing on a
green run of `Arena main`.

```bash
# the surfaces, in one commit, then the tag on it
#   plugin.json (the authority), marketplace.json version AND source.ref,
#   and the README's artifact list
git tag -a vX.Y.Z -m "Arena vX.Y.Z"
git push origin main --follow-tags
```

`--follow-tags` matters here for a second reason now: the workflow runs `check-release.mjs`
before it publishes anything, and that gate refuses a version whose tag does not exist and
does not serve it. A version bump pushed without its tag is rejected loudly rather than
published quietly.

**A package is published only when something it carries has moved.** The workflow asks
whether `plugin.json`'s version is already on the registry, and if it is not, whether
anything in `scripts/ci/arena/package-inputs.mjs` has changed since the tag of the version
that is. So a release touching only React publishes only React, and the Angular package
keeps its number rather than shipping an identical tree under a new one. That is why the two
packages can sit at different versions, and both `PACKAGE.md` files point a reader at
[`../.github/workflows/README.md`](../.github/workflows/README.md) for the explanation.

Three things about the publish itself, each of which has a way of going wrong:

- **Publish from inside `dist/`.** The root `package.json` is private and npm would refuse it.
  The workflow packs inside `dist/` and publishes the tarball.
- **Do not pass `--access public`.** Both manifests already carry it in `publishConfig`.
- **Do not pass `--provenance`.** Under a trusted publisher the attestation is generated
  automatically, and the flag is not what turns it on.

### Publishing by hand

Still possible, and the fallback when the workflow cannot run:

```bash
bun scripts/check/arena/check-release.mjs
bun run build                   # the generated sources build:packages reads
bun run build:packages          # the manifests take the version from plugin.json here
bun run check:packages          # and this fails if they did not

npm login                       # a two-hour session; 2FA is enforced on publish
cd frameworks/react/dist   && npm publish --dry-run && npm publish
cd ../../angular/dist      && npm publish
```

React first: if something is wrong, find it in the smaller package rather than halfway
through. A publish by hand carries no provenance, because that needs the OIDC token only a
runner has.

### A 404 right after publishing is not a failure

**The registry has two read paths and they do not move together.** For several minutes after
a successful publish, `npm view` and `npm owner ls` answer 404 while the package is perfectly
published, because those read a CDN that has not caught up. Measured on a release: five
minutes, with the two packages appearing a minute apart from each other.

This is why the publish workflow tolerates exactly one error. Its guard reads `npm view`, so
a re-run inside that window is told the version is absent, builds, and then meets
`cannot publish over the previously published versions`. That message alone exits green;
every other failure is red. It is safe because the scope is ours, so the only way that
version can already exist is that we published it.

Read the publish log rather than the next command's output. A publish that worked ends with
`PUT 200`, `exit 0` and `info ok`. By hand, the `401` above it is not an error either: it is
the 2FA handshake starting, before npm retries with the validated session.

Nothing verifies after publishing. `npm access list packages @dravensoft` lists what exists
whatever the CDN says, and it is the right check from a laptop, where there is a session. A
runner has no long-lived credential and its token is scoped to the publish, so there the exit
code is the check.

### What trusted publishing needs

`permissions: id-token: write` on a GitHub-hosted runner, npm 11.5.1 or newer on Node 22.14
or newer, and a trusted publisher configured in **each package's** settings on npmjs.com.
Self-hosted runners are not supported. The image ships an older npm, so each publish job
installs a current one and asserts the version rather than assuming it.

**The workflow file name is the package's identity to npm**, exactly and case-sensitively:
the publisher on npmjs.com names `npm-publish-react-package.yml` or
`npm-publish-angular-package.yml`. Renaming one revokes that package's right to publish, and
nothing in this repository would notice.

The mechanism inherits the release rule it always had: the version moves in `plugin.json`,
`marketplace.json` and the README's artifact list together, `source.ref`
names the tag, and `check-release.mjs` refuses the combination that fails silently. The two
manifests take that same version from `plugin.json` at assembly, so a published package can
never disagree with the tag it was cut from.
