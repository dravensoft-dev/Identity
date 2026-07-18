# Framework layer token coverage — Design

**Status:** approved for planning — **first in the queue**, both other specs wait on it
**Date:** 2026-07-18 · **revised 2026-07-18** — the spacing model was an open question and
is now settled against a real Tailwind v4.3.3 compile (§1b); the gates gained the JIT and
bracket-syntax findings; a section records what the parity work needs from this one.
**Relates to:** `2026-07-18-four-package-build-publish-design.md`,
`2026-07-18-framework-layer-parity-design.md`

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
| 6 of 13 `--sp-*` (`sp-0, 10, 12, 16, 20, 24`) | Not holes — these silently resolve to Tailwind's own `0.25rem` default instead of Arena's token. See §1b. |
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
- **Spacing**: the six missing `--sp-*` steps, plus the `--spacing` base unit itself — see
  §1b, which settles the model and is the more important half of this bullet.
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

### 1b. The spacing model — settled against a real compile

This was left open ("the plan must answer against a real compile, not from memory"). It has
been answered, by compiling three candidate presets with **Tailwind v4.3.3** and reading the
emitted CSS. Two of the premises it rested on were wrong, and the second one hides a bug.

**Arena's scale *is* a uniform multiple.** `--sp-N` = N × 4px for every step: 1→4, 2→8,
3→12, 4→16, 5→20, 6→24, 8→32, 10→40, 12→48, 16→64, 20→80, 24→96. The scale is *sparse* —
it does not name 7, 9, 11 — but it never deviates from the 4px grid.

**The gap is not holes. It is a silent fallback to Tailwind's own default**, which is worse.
v4 emits a named step as `var(--spacing-N)` and every other step as
`calc(var(--spacing) * N)`. Today's preset defines `--spacing-1..8` and **never sets
`--spacing`**, so the base unit stays at Tailwind's default `0.25rem`. Measured output of
the current preset:

```
p-4    padding: var(--spacing-4)            <- Arena's token
p-6    padding: var(--spacing-6)            <- Arena's token
p-7    padding: calc(var(--spacing) * 7)    <- Tailwind's 0.25rem default
p-10   padding: calc(var(--spacing) * 10)   <- Tailwind's 0.25rem default
p-12   padding: calc(var(--spacing) * 12)   <- Tailwind's 0.25rem default
p-16   padding: calc(var(--spacing) * 16)   <- Tailwind's 0.25rem default
h-11   height:  calc(var(--spacing) * 11)   <- Tailwind's 0.25rem default
```

So the spacing surface is half Arena and half Tailwind, with nothing marking the boundary.
A hole would fail loudly; this resolves to a plausible value that *coincides* with Arena's
only because `0.25rem` is 4px at a 16px root. Change the root font size and the two halves
diverge. Re-skin Arena and the Tailwind half does not follow. This is precisely the class of
failure the repository machine-checks everywhere else.

**The fix is one line, and it deletes nothing that matters:**

```css
@theme {
  --spacing: var(--sp-1);   /* the 4px grid itself — every numeric utility derives from it */
  ...
}
```

With the base unit set, `p-4` is `calc(var(--sp-1) * 4)` = 16px = `--sp-4`, and the steps
Arena does not name land on the grid too (`p-7` = 28px) rather than on a rem default.

**Keep the explicit `--spacing-N` keys as well, for all 13 named steps.** Measured: a named
key wins over the base unit for that N, and both produce identical values while every token
is N×4. The redundancy is deliberate insurance — if a spacing token ever stops being a clean
multiple, the named step keeps tracking the token instead of silently drifting onto the grid.

`--sp-0` needs no key: v4 compiles `p-0` to a literal `0px` regardless.

**The gate this implies:** no spacing utility may resolve through Tailwind's default
`--spacing`. That is assertable directly on the compiled output — the string `0.25rem` must
not appear in it.

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

  **The gate must feed the manifests to the compiler as content.** Tailwind v4 is JIT: it
  emits only the utilities it finds *used* while scanning content, so compiling the preset
  alone proves almost nothing. The content source is the component manifests — that is what
  makes this gate test the classes Arena actually ships rather than a list restated inside
  the gate. Write it that way from the start: `2026-07-18-framework-layer-parity-design.md`
  grows the layer to 35 manifests, and a gate built to compile only the preset would have to
  be rewritten once they exist.

  Two assertions on the compiled output, beyond "it compiled": every utility resolves to an
  Arena token, and the string `0.25rem` never appears (§1b — Tailwind's default `--spacing`
  must never be reachable).

- **No arbitrary values.** Fail on `[13px]`-style literals anywhere under `frameworks/`,
  which is the machine form of the rule `CLAUDE.md` already states in prose.

  **Key the gate on Tailwind's bracket syntax**, not on literal `px` anywhere. React's 155
  literal `px` are one-off geometry that the language permits and this audit cleared; a gate
  scoped to "any px under frameworks/" would fail the healthy layer. `[13px]` is a Tailwind
  arbitrary value; `padding: '13px'` in a React inline style is not.
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

## What the parity work needs from this one

`2026-07-18-framework-layer-parity-design.md` (Angular 1 → 19 primitives, Tailwind 1 → 35
manifests) was written after this spec and depends on it. Three things it needs, recorded
here because this spec's plan is written in a separate session that will not see that
reasoning:

- **`Tag.manifest.json` is a template, not a one-off fix.** Decision 2 converts `tag` to
  consume a shared manifest. In the parity spec that is slice 1 of 15 identical slices, so
  whatever conventions it sets — slot names, variant shapes, where `defaultVariants` live,
  how `tv` consumes the JSON — get copied 34 times. Author it as the reference shape.

- **Gate 3 becomes load-bearing in a second direction.** This spec justifies "coverage is
  declared" as: a token added to `tokens/src/` cannot silently fail to reach Tailwind.
  Parity needs the converse as well — a class *inside a manifest* that stops resolving must
  fail the build. Twenty of the eventual 35 manifests will have no consumer anywhere in the
  repo, and nothing else will exercise them.

- **The `--picker-invert` exclusion has a second, better reason.** It is excluded here as
  "an internal for a vendor pseudo-element". When `Input` gets a manifest, the
  `::-webkit-calendar-picker-indicator` rule cannot live there either, and stays where React
  keeps it — in injected CSS. The real category is **not expressible as a utility**, which
  is the same category that keeps the 4 charts and `Calendar` out of the Tailwind layer
  entirely. Naming the category stops the next reader from trying to fix it.

## Consequence for the four-package plan

`2026-07-18-four-package-build-publish-design.md` plans to publish `@dravensoft/arena-angular`
and `@dravensoft/arena-tailwind`. As the tree stands those would ship **one component each**.
That spec is updated to state the coverage plainly and to sequence this work before
publication, so the packages are not published advertising a surface they do not have.
