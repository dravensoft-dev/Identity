# Framework layer token coverage — Design

**Status:** approved for planning
**Date:** 2026-07-18
**Relates to:** `2026-07-18-four-package-build-publish-design.md` (updated alongside this)

## What this is not

The suspicion that prompted this work was that the DTCG token migration had left the
framework layers stale or no longer applying Arena's tokens. **Audited, and that is not
what is wrong.**

| Layer | Finding |
|---|---|
| React | Clean. 571 `var(--token)` references across 40 components, zero references to a token that does not exist, zero raw hex. The 155 literal `px` are one-off geometry, which the language permits — what it forbids in a component is a raw hex. |
| Angular Material bridge | Clean. Every `--mdc-*` maps to an Arena token; the namespaces do not collide. |
| Tailwind preset | Works. Verified by compiling it with Tailwind v4.3.3 and loading the output in a browser. |

**One pattern in `frameworks/tailwind/theme.css` looks broken and is not.** Twenty-three
declarations are self-referential:

```css
--color-base-100: var(--color-base-100);
```

Read on its own this is a cycle, and a custom property in a cycle computes to nothing. In
context it is correct: Tailwind emits `@theme` inside `@layer theme`, Arena's tokens are
loaded unlayered, and **unlayered declarations beat layered ones**, so Arena's value wins
and the self-reference never resolves against itself. Compiled and measured in a browser:
`--color-base-100` → `#141010`, `.bg-base-100` → `rgb(20, 16, 16)`, `.shadow-1` → the real
shadow, `.rounded-sm` → `6px`.

`@theme inline` — which the Tailwind docs prescribe when a theme variable references
another variable — produces **byte-identical output here**, because the referenced variable
shares the name. It is not the fix, because there is nothing to fix.

This finding is recorded because the pattern invites exactly the wrong correction. It was
nearly "fixed" during this audit.

## The actual problem

**The Tailwind layer exposes 37 of Arena's 138 tokens**, and the missing ones are not
edge cases:

| Missing | Consequence |
|---|---|
| The entire type scale — 9 `--fs-*`, 3 `--lh-*`, 4 `--ls-*`, 3 families, 5 of 6 weights | No `text-h1`, no `font-display`, no `tracking-label` |
| The entire density system — 7 `--dz-*` | `.arena-compact` has no utility surface at all |
| 6 of 13 `--sp-*` (`sp-0, 10, 12, 16, 20, 24`) | The spacing scale has holes in the middle |
| 4 of 7 `-content` pairs (`info`, `success`, `warning`, `error`) | The pair is the contract a skin defines; two thirds of it is unreachable |
| `--r-xs`, `--r-pill` | No `rounded-pill`, which pills and avatars need |
| `--color-error-fill` | The system's only filled danger surface has no utility |

**This gap is already doing damage.** Six arbitrary values exist across the two layers
purely because the token they need is not exposed:

```
frameworks/tailwind/components/Button.manifest.json   [13px] [15px] [18px] [14px] [26px]
frameworks/angular/primitives/tag/tag.variants.ts     [11px]
```

`[13px]` is `--fs-sm`, `[15px]` is `--fs-md`, `[11px]` is `--fs-xs`. Each one violates the
rule `CLAUDE.md` states for this layer — *"derives every utility from an existing token and
introduces no new hex and no new value"* — and each one is a value that will not follow a
re-skin.

**The shared-recipe architecture is documented but not built.** `CLAUDE.md` says Angular
primitives are "styled by the shared `frameworks/tailwind/` recipes". In the tree there is
one manifest (`Button.manifest.json`, with no Angular consumer) and one primitive (`tag`,
whose recipe is defined inline in the Angular file). They are not even the same component.

**None of this is machine-checked.** There is no gate that compiles the preset, no gate
that catches an arbitrary value, and no gate that would have caught the coverage gap. Every
other invariant in this repository that fails silently is machine-checked — the release
`ref`, the token drift, the colour ramp. This one is not.

## Decisions

### 1. Complete the Tailwind token surface

Expose every token a consumer writes styles with. The additions, by group:

- **Type**: `--text-display/h1/h2/h3/h4/lg/md/sm/xs` from `--fs-*`; `--font-display/body/mono`
  from the families; `--font-weight-*` for all six weights; `--leading-*` from `--lh-*`;
  `--tracking-*` from `--ls-*`.
- **Density**: `--spacing-ctl-h`, `--spacing-row-py`… from `--dz-*`, so `.arena-compact`
  re-densifies utilities the same way it re-densifies components.
- **Spacing**: the six missing `--sp-*` steps.
- **Radius**: `--radius-xs` from `--r-xs`, `--radius-pill` from `--r-pill`.
- **Colour**: the four missing `-content` pairs, `--color-neutral` and its content, and
  `--color-error-fill`.

**Deliberately excluded, and the spec says so** so the absence reads as a decision rather
than an oversight:

- **The 40 composition-layer aliases** (`--crimson`, `--mute`, `--bg`, `--text-strong`…).
  They alias tokens already exposed; adding them would give every colour two utility names
  and two ways to be wrong.
- **`--bp-sm/md/lg`**. They are read by JS through `getComputedStyle` and are never a media
  query — Arena's responsive branches are JS because inline styles cannot hold one. A
  Tailwind breakpoint utility built on them would invite exactly the pattern the language
  rejects.
- **`--picker-invert`**, an internal for a vendor pseudo-element.

**The Tailwind v4 spacing model needs verifying during implementation, not assuming.** v4
derives its dynamic spacing scale from a single `--spacing` base unit, and Arena's scale is
not a uniform multiple. Whether the missing steps are best expressed as individual
`--spacing-N` keys or a different mapping is an open question the plan must answer against
a real compile, not from memory.

### 2. Make the shared recipes real

`frameworks/tailwind/components/` becomes the single home for the styling recipes both
non-React layers consume. Concretely:

- `tag` gains `Tag.manifest.json`, and `tag.variants.ts` consumes it instead of defining
  its own recipe inline.
- The six arbitrary values disappear, replaced by the utilities decision 1 creates.

This is the reference shape the layers grow into; it does not by itself add components.

### 3. Gate all of it

Three checks, following the repository's existing `check-*.mjs` convention:

- **The preset compiles and resolves.** Build `frameworks/tailwind/theme.css` with Tailwind
  v4 and assert the emitted utilities resolve to Arena's values, the way this audit did by
  hand. This requires Tailwind as a dev dependency — accepted, because the alternative is
  an unverifiable layer.
- **No arbitrary values.** Fail on `[13px]`-style literals anywhere under `frameworks/`,
  which is the machine form of the rule `CLAUDE.md` already states in prose.
- **Coverage is declared.** Assert every Arena token is either exposed by the preset or
  named in an explicit exclusion list, so a token added to `tokens/src/` cannot silently
  fail to reach the Tailwind layer.

The third is the one that matters most: it converts "we completed the surface once" into
"the surface cannot fall behind again".

### 4. Document the self-reference where it lives

A comment in `frameworks/tailwind/theme.css` explaining the cascade-layer mechanism, so the
next reader does not correct it into a real bug.

## Out of scope

- **Growing Angular and Tailwind from 1 component to 40.** That is a project, not a
  correction. It is called out here because it changes what the four-package spec can
  honestly publish, and that spec is updated alongside this one.
- **Any change to `tokens/src/`, to the build, or to token values.** Nothing here alters a
  token; it exposes tokens that already exist.
- **The React layer**, which the audit found healthy and which remains the reference
  implementation.

## Consequence for the four-package plan

`2026-07-18-four-package-build-publish-design.md` plans to publish `@dravensoft/arena-angular`
and `@dravensoft/arena-tailwind`. As the tree stands those would ship **one component each**.
That spec is updated to state the coverage plainly and to sequence this work before
publication, so the packages are not published advertising a surface they do not have.
