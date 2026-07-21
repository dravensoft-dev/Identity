# Angular Material bridge — repair and gate

**Status:** approved, not implemented. **Execution order: 5c of 6**, after 5a (executed) and
independent of 5b.

## The problem

`frameworks/angular/theme/arena-material.css` maps Angular Material's MDC custom properties
onto Arena's tokens, so an application built on Material wears Arena. Of the 26 property names
it carried before plan 5a's Task 27, **24 are inert against Angular Material 22** — the names
were renamed upstream and nothing here noticed. Only the two `--mat-table-*` names still
resolve. Buttons, form fields, cards, dialogs, tabs, snackbar and both progress indicators
render stock Material today, while `frameworks/angular/README.md` advertises all of them.

Three properties of this failure decide the design:

- **It is silent.** A custom property Material does not read is not an error. It applies
  nothing, throws nothing, and logs nothing. The bridge simply does not theme.
- **No gate covers the file.** `check:dimensions` does not scan `.css`; nothing else looks at
  it. The breakage was found only because Task 27 was told to verify its own eight new names
  against the real package and a reviewer then pointed the same check at the rest of the file.
- **Nothing here can verify it.** `@angular/material` is not a dependency of this repo, so no
  name in the file is checkable from the tree, and the Material version the bridge targets is
  written nowhere.

The renames are not a uniform prefix swap, which is why no pattern match caught them:

| Before | After |
|---|---|
| `--mdc-filled-button-container-color` | `--mat-button-filled-container-color` |
| `--mdc-elevated-card-container-color` | `--mat-card-elevated-container-color` |
| `--mdc-dialog-container-shape` | `--mat-dialog-container-shape` |
| `--mat-tab-header-active-label-text-color` | `--mat-tab-active-label-text-color` |
| `--mdc-tab-indicator-active-indicator-color` | `--mat-tab-active-indicator-color` |
| `--mdc-circular-progress-active-indicator-color` | `--mat-progress-spinner-active-indicator-color` |

## Decisions this design rests on

Taken deliberately, and recorded because each one closes off an alternative:

1. **The primitives stand alone; Material is the recommended bridge for the rest.** Verified:
   no file under `frameworks/angular/primitives/` imports `@angular/material` — the only match
   in the whole directory is a JSDoc mentioning `mat-button` in prose. A consumer can use the
   21 primitives with no Material installed. `@angular/material` is therefore an **optional**
   `peerDependency` of the published Angular package, not a required one.

2. **Arena will not ship vanilla Angular implementations of what Material provides.** The 21
   components Material covers (Button, Input, Select, Dialog, Menu, Table, Toast…) are the
   half of the system carrying overlay positioning, focus management, keyboard navigation and
   i18n. Reimplementing them would duplicate hardened accessibility badly, and this repo's own
   record argues against it: `Onboarding` — a panel, a scrim and two buttons — shipped claiming
   `aria-modal="true"` with no focus trap, and no gate or task-level review caught it. Plan
   5b's manifests remain the answer for a framework-neutral Tailwind consumer, which is a
   different audience from an Angular one.

3. **The gate is the guarantee, not the dependency's mandatoriness.** An earlier framing made
   Material a hard requirement so that breaking the bridge would hurt. That reasoning is
   discarded: what makes a broken bridge hurt is a check that fails, and an optional bridge
   with a gate is both more honest and better protected than a mandatory one without.

4. **One package.** `@dravensoft/arena-angular` ships the primitives and the bridge CSS
   together. The bridge is a single 103-line stylesheet against 2,672 lines of primitives, and
   a CSS file has no import graph — so splitting the package could not give npm anything to
   verify. It would be documentation disguised as packaging. Revisit only if the Material side
   grows TypeScript (directives, wrappers, a `provideArenaMaterial()`); moving from one package
   to two later is a smaller cost than maintaining two from the start. Packaging lands in
   plan 6.

## Architecture

Three pieces. **The gate is built before the renames, not after** — its own output is then the
worklist, and its non-vacuousness is proven by construction rather than argued: it is first run
against a tree it is known to reject, and the renames are what turn it green. Building it
afterwards would mean shipping a gate whose only observed behaviour is passing.

### 1. `@angular/material` as a devDependency

Nothing can be verified without the real package present. It is dev-only, like the rest of this
repo's tooling — nothing is published from here — so it does not touch the consumer story, and
the optional `peerDependency` in plan 6 is what consumers see.

Adding it also **pins, for the first time, the Material version the bridge targets**. That fact
belongs in `frameworks/angular/README.md` beside the bridge, because a bridge with no stated
target version is unfalsifiable.

### 2. `scripts/check-material.mjs`

A new gate, registered in `scripts/check-all.mjs` (14 steps becomes 15).

It parses `arena-material.css` with the existing `scripts/lib/css-decls.mjs` and asserts, in
both directions:

- **Every `--mdc-*` / `--mat-*` property name declared there exists in the installed
  `@angular/material`**, by matching against the compiled `fesm2022/*.mjs`. This is the check
  that would have caught all 24.
- **Every `var(--…)` referencing an Arena token names a token that exists.** The mirror-image
  silent failure: a token that does not exist resolves to nothing, just as quietly. Nearly free
  once the file is already parsed.

**It fails rather than skips when Material is absent.** Three existing gates exit 2 to `SKIP`
when a runtime *capability* is missing — a headless browser, `Bun.build`, `Bun.Transpiler`.
A missing devDependency is not that; it is a broken install. Skipping here would re-hide exactly
what this gate exists to expose.

No browser and no Angular runtime: a grep over shipped files, so it stays runtime-portable under
plain `node scripts/check-all.mjs`.

### What the gate deliberately does not do

**It checks that a name exists, not that it is the right name for the element being styled.**
The most interesting error found in plan 5a would have survived it: the bridge originally set
`--mdc-list-list-item-container-{shape,color}` for the active nav item, and after a prefix fix
those names *do* exist — but `mat-nav-list` reads `--mat-list-active-indicator-{shape,color}`,
while the `container-*` pair belongs to `mat-selection-list`. Catching that requires knowing
which selector reads which property, which is a different and much larger problem.

This limitation is stated in the gate's own header comment. A gate that quietly implies more
coverage than it has is how the bridge rotted in the first place.

### 3. The renames in `arena-material.css`

The gate's failure output is the worklist. Each name is corrected against the installed package
individually rather than by pattern — the table above shows why a pattern would not have worked.
Values are unchanged: every right-hand side is already a `var(--…)` reading an Arena token, and
this work introduces no token and changes no value.

The exact count is whatever the gate reports; the 24 figure comes from a manual audit and should
be treated as an expectation to check, not a target to reach. A rename that turns out unnecessary
is as much a finding as one that turns out missing.

## Documentation

`frameworks/angular/README.md` currently carries a known-issue block describing the bridge as
broken. On completion it states instead: the primitives stand alone, Material is the recommended
bridge for the components Arena does not implement, the bridge is verified by `check:material`,
and the Material version it targets. `CHANGELOG.md`'s `[Unreleased]` entry moves from a known
issue to a fix.

## Testing

`scripts/check-material.test.mjs`, following the discipline the repo already applies to its
gates: assert the gate **fails when it should**, not only that it passes. At minimum a fabricated
property name must be rejected, and a fabricated Arena token reference must be rejected. A test
that only proves the current tree passes would not have caught the original breakage either.

`bun run check` must report 15 of 15.

## Out of scope

- Packaging (plan 6), including the optional `peerDependency` declaration.
- Teaching `check:dimensions`' `PROP_COLON` kebab-awareness and Angular's `[style.x]` binding
  form — a separate known blind spot with its own suite.
- Any Angular primitive for a component Material provides (decision 2).
