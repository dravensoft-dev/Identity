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
