# Arena's contracts

Three levels, one roof. Each states, once and neutrally, something every platform
target implements, and each level's normative statement starts at the `README.md`
in its directory.

| Level | Governs | Normative document |
|---|---|---|
| [`api/`](api/README.md) | the members a component's API presents | `api/README.md` |
| [`behaviour/`](behaviour/README.md) | what a kind of component must do: roles, keys, focus, dismissal | `behaviour/README.md` |
| [`design/`](design/README.md) | what a value is | `design/README.md`, plus [`design/TokenTypes.md`](design/TokenTypes.md) for the shape a value arrives in |

**`design/` is the one level whose statement is two files, and the split is by audience
rather than by topic.** `design/README.md` says what a value MEANS, which is what anyone
choosing a colour or a spacing step needs; `design/TokenTypes.md` says what DTCG `$type` it
carries and what shape it is authored in, which only somebody authoring a token or targeting
a new platform needs. The other two levels are one file each because neither has a second
audience to separate: nobody reads an API contract without intending to implement it.

Read the one for the level you are implementing. None of the three is a summary of
another: `design/` answers *what is this value*, `behaviour/` answers *what must this
component do*, and `api/` answers *what does a consumer write*. A component can satisfy
any one of them while failing the other two.

## Audience and scope
- **Audience of the language: general public.** Arena is meant to give identity to **every kind of Dravensoft software**, regardless of who the end user is, from consumer apps to internal tools. Its foundations (color, typography, spacing, accessibility, voice) are general-purpose and don't assume a technical profile.
- **The example application is `frameworks/react/ui-kits/console/`**, not the language itself. It illustrates Arena applied to the **Delivery Console, a product aimed at developers/technical teams**. That's why it includes data density, domain terminology (build, deploy, p95) and keyboard accelerators specific to that audience. `intro/Arena - Overview.html` is the opposite: the framework-agnostic token language, and it deliberately shows no components.
- **Implication for audits and evaluations:** findings observed on the example should be split into (a) those that apply to the **language** (tokens, components and patterns, all universal) and (b) those specific to the **example's technical context** (jargon, density, shortcuts). The latter are not defects of the language: in a product for a general audience they would be replaced with plain copy, comfortable density and fewer shortcuts. When evaluating Arena for another kind of software, calibrate against that general audience, not against the Console.

## Why a language of our own (and not Material/Fluent as-is)
Established systems (Material 3, Fluent, Carbon, Polaris) are **light-by-default, rounded and neutral in tone**. Dravensoft's identity is the opposite: **dominant warm black, crimson/gold accents, sharp geometry and a bold voice**. Forcing the brand onto Material would produce a "generic with a skin" app. Instead, Arena:
- **Adopts proven structural principles**: token discipline and a typographic scale (Carbon/IBM-inspired), clear states and density (Material-inspired), visible and accessible focus.
- **Rewrites the aesthetic decisions** for the identity: dark-first, contained radii, deep warm shadows, crimson as the voice and gold as distinction, and the **Rotor** as the signature mark.

## Sources
- Approved identity manual: `intro/Dravensoft Identity.dc.html`.
- Brand: Dravensoft, custom software development and B2B consulting.
- Concept: pride, spectacle, mastery. Motto: *"Software worthy of being exalted."*

## Why only design has a `-generated` sibling

`design-generated/` holds the five CSS files built from `design/`: four by Style
Dictionary (`bun run generate:tokens`) and `fonts.generated.css` by `scripts/generate/core/fetch-fonts.mjs`, which can
also rebuild that one file alone, from the binaries already committed under `assets/fonts/`
and with no network involved, via `--css-only`. Never edit any of the five directly; edit
the source and rebuild.

The other two levels have no such directory because they emit nothing outside
`frameworks/`. `api/` generates `Api.generated.*` and `design/` also generates
`Tokens.generated.*`, but those are emitted **per layer**, into the layer that consumes
them, so a component's import never crosses a contract boundary. What makes `design`
different is that its CSS ships to consumers directly: `intro/styles.css` imports all
five, plus the hand-authored `design/colors.css` and `design/environment.css`.

So `design-generated/` is a fact about what this one level emits, not a convention
waiting to be applied to the other two. `contracts/api-generated/` would be empty.

## Two shapes, on purpose

`api/` keeps `components/` and `types/`; `behaviour/` and `design/` are flat. An inner
directory earns its place when it separates two different vocabularies: a component
contract and a shared type are different things, and `check:api` reads them as two sets.
`behaviour/` is flat because a pattern file and the README describing patterns are one
vocabulary, not two. `design/` is flat because the job an inner directory would do, keeping
the DTCG sources apart from Style Dictionary's output, is done at the top level by the
`design/` / `design-generated/` split instead.

So an inner directory is earned, never assumed. Add one only when it separates two
vocabularies a gate reads as two sets.

## What checks each level

`bun run check:api`, `bun run check:behaviour` and `bun run check:script-tokens` each fail
on an empty directory rather than reporting zero violations over a tree they never opened.
`zeroContractProblems` in `check-api.mjs`, `zeroPatternProblems` in `check-behaviour.mjs`
and `zeroGeneratedCssProblems` in `check-script-tokens.mjs` are the guards, by name.
`design/` carries the same guard under a different name: `bun run check:dtcg` walks
`contracts/design/` itself and fails the same way on zero token files. `check:tokens` alone
walks no directory. It compares the committed generated CSS against what `contracts/design/`
builds from `build-tokens.mjs`'s hardcoded file list, so there is no result set discovery
could find empty, but a source file gone missing still fails it, just not silently: the
build it depends on has nothing to read and stops rather than reporting a clean pass.

None of the five is a claim that a component is correct: `check:behaviour`'s green run is
a coverage claim and never an accessibility one, and `check:api` says nothing about what
any component *does*.

## Where everything lives

Arena's pure design language, meaning `contracts/` (all three levels plus `design-generated/`),
`assets/`, `scripts/`, and `intro/` (the entry stylesheet, the specimen cards and the two
browsable pages), sits at the repository root and is framework-agnostic. Everything framework-bound sits under `frameworks/`, so a new
framework is added without touching the language.

**The language**

- `intro/styles.css`: the global entry point, `@import`s only. Consumers link this file.
  Its eight `@import`s resolve as `../contracts/…`, so it stays one directory below that parent.
- `contracts/design/`: the DTCG 2025.10 source of every token value (`*.json`),
  `README.md` (the normative design specification), `TokenTypes.md` (the `$type` map and the
  strict 2025.10 value formats), and three hand-authored
  stylesheets: `colors.css` (aliases and `color-mix` derivations), `environment.css` (the
  `env()` safe-area insets composed with the spacing scale) and `reset.css`
  (`box-sizing: border-box`, the box model both layers share). None is a value, which is why
  none is DTCG: values are what `design/` governs, and how a value is combined at runtime
  belongs to each platform's own idiom.
- `contracts/design-generated/`: the five built CSS files, `fonts.generated.css` (from
  `fetch-fonts.mjs`), plus `palette.generated.css`, `typography.generated.css`, `spacing.generated.css` and
  `effects.generated.css` (from `build-tokens.mjs`). Never edit any of them.
- `assets/`: `rotor-crimson/bone/ink.svg`, `app-icon.svg`, and `fonts/` (the bundled
  self-hosted `.woff2` binaries).
- `intro/guidelines/`: specimen cards (`@dsCard`) for typography (`type-display`, `type-body`,
  `type-mono`), color (`colors-neutrals`, `colors-accents`, `colors-status`,
  `colors-categorical`), spacing (`spacing-scale`, `spacing-density`), effects
  (`effects-radius`, `effects-shadow`), iconography (`icons`), brand (`brand-logo`) and
  the **danger convention** (`components-danger`).
- `scripts/`: the build steps and the gates. `build-tokens.mjs` generates the four token
  CSS files from `contracts/design/`; `check-dtcg.mjs` asserts the source conforms to
  2025.10; `check-tokens-generated.mjs` asserts the committed CSS matches the source;
  `check-ramp.mjs` asserts the shipped ramp clears every gate in both themes;
  `check-text-contrast.mjs` measures every text level against the real surfaces in both
  themes; `validate-palette.mjs` is the vendored data-viz palette validator;
  `check-release.mjs` asserts the version, the marketplace `ref` and the tag agree; and
  `serve.mjs` backs `bun run demos`.

**The framework layers**

- [`frameworks/react/`](../frameworks/react/README.md): the React primitives, the
  example Console app, and the shared layer-root modules.
- [`frameworks/angular/`](../frameworks/angular/README.md): the Angular layer for an
  existing Angular 20+/Tailwind-v4 app, meaning Arena's own primitives, with `@angular/cdk`
  positioning the two that anchor an overlay to a trigger.
- [`frameworks/tailwind/`](../frameworks/tailwind/README.md): a **shared**,
  token-derived Tailwind v4 layer, authored once rather than per framework because the
  token→utility mapping is pure CSS and a component's Tailwind recipe is data.
- [`frameworks/PACKAGING.md`](../frameworks/PACKAGING.md): the npm channel, which belongs to
  no one layer. Two packages, assembled from the two framework layers in place into a
  git-ignored `dist/`, carrying the language and never the skin.

Pick the layer you need: raw tokens, a framework's primitives, or the Tailwind layer on
top.

**In `intro/`**

- `Arena - Overview.html`: the token language, generated at runtime from
  `contracts/design/` and `contracts/design/colors.css`. Serve it with `bun run demos`.
- `Dravensoft Identity.dc.html`: the approved identity manual.
- Both load `styles.css`, `toggle.css` and their runtime (`theme.js`, `overview.js`,
  `support.js`) as siblings, and reach `assets/`, `node_modules/` and `contracts/` with a
  single `../`, which is why neither may leave this directory.

**At the root**

- `SKILL.md`: the plugin-root Agent Skill, also usable standalone.
- `.claude-plugin/`: the Claude Code plugin manifest and marketplace catalog.
- `DOUBTS.md`: what counts as a debt in Arena, and where the records live.
