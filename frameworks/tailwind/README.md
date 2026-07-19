# Arena — Tailwind layer

A framework-neutral Tailwind v4 consumption layer for Arena. It is **shared**,
not per-framework: the token→utility mapping is pure CSS and a component's
Tailwind recipe is data (slots, variants, class strings), so React, Angular,
or a `tailwind-variants` recipe all consume the same files. The thin binding —
how a class string reaches the element — lives in each `frameworks/<fw>/` folder.

## It derives from tokens; it adds no value

Every utility here resolves to an existing Arena token via `var()`. There is no
new hex and no new value in this folder. Re-skin Arena by swapping
`tokens/palette.css`; these utilities re-skin with it.

## What the preset exposes

Every token in `tokens/palette.css`, `typography.css`, `spacing.css` and
`effects.css` reaches a utility, except eleven that cannot — `--sp-0` (`p-0`
is a literal `0px` in v4), the three `--bp-*` (read by JS, never a media
query), the three `--dur-*` and the two `--bw-*` and the two `--focus-*`
(v4 has no namespace for them). Those eleven are listed with their reason in
`EXCLUDED` in `scripts/check-tailwind-coverage.mjs`, and that gate fails the
build if a token is added and reaches nothing.

`tokens/colors.css` is excluded as a category. Its aliases (`--crimson`,
`--mute`, `--danger-soft`, `--text-strong`…) alias tokens the preset already
exposes; a second utility name for the same colour is a second way to be
wrong. Reach one as `bg-[var(--danger-soft)]` when you genuinely need it.

Two naming notes: the density keys take the token's suffix verbatim, so
`--dz-row-py` is `py-row-py`; and `--container-max` is exposed as
`--container-page` (`max-w-page`) because a key named `max` shadows
Tailwind's built-in `max-w-max`.

## Arbitrary values are a build failure

`bun run check:arbitrary` fails on any bracket carrying a raw literal —
`text-[13px]`, `bg-[#b52a20]`. A bracket is legal when it holds a `var()`
into a token (`duration-[var(--dur-mid)]`, `border-[length:var(--bw)]`) or
names properties rather than values (`transition-[background,transform]`).
If a manifest needs a value with no token behind it, the token is what is
missing — add it to `tokens/src/` first.

## Consumption order

1. Bring Arena's tokens into scope — `@import "../../styles.css";` (or the
   individual `tokens/*.css`).
2. `@import "./theme.css";` — the Tailwind `@theme` preset.
3. Consume a component manifest from `./components/<Component>.manifest.json`.

## Three consumption paths

- **Raw `className`** — read `slots`/`variants` and concatenate the strings yourself.
- **`tailwind-variants`** (Angular/DAMA) — feed the manifest straight into `tv({ slots, variants, defaultVariants })`.
- **`cva`** — map `variants`/`defaultVariants` onto a `cva` config.

## Invariants the manifests must reproduce

- **Danger is outline** — `border` + `text` in `--error`, transparent fill; a
  filled danger surface is reserved for `ConfirmDialog`'s final confirmation.
- **Focus is the gold ring.** No gradient utilities. Uppercase is reserved for
  micro-labels. Charts carry identity (`--color-cat-*`) or meaning (status),
  never both.

Authoring a manifest for a component whose React source uses a value not yet in
a token is a spec violation — add the token first, then reference it here.
