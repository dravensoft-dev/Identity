# scripts/build/tailwind/

| script | emits | why it exists |
| --- | --- | --- |
| `build-tailwind.mjs` | `Utilities.generated.css`, one `<Component>.styles.generated.css` per manifest, `Prelude.generated.css`, `Preflight.generated.css`, `Components.generated.css`, and a `<Component>.classes.generated.ts` and `ArenaStyles.generated.ts` mirrored into each layer | Compiles the `@theme` preset with the manifests as content, so every utility a manifest names is a real rule; then translates each manifest into `@apply` rules under Arena class names, compiles those, strips Tailwind's theme indirection back to the Arena token, and cuts the result into one stylesheet per component plus the prelude they share. |

**Every output is git-ignored, and each has its own reader here.** A class module is what a
`<Component>.variants.ts` imports, so `ngc` needs it on disk before the test surface will
compile at all. The component stylesheets and the barrel are what every specimen, every
playground and both packages load. `Utilities.generated.css` is published nowhere and survives
for one reason: `check:style-parity` measures the emitted CSS against what the recipe paints,
and that is the sheet the recipe's class string resolves against. `check:generated` carries a
reason for each; `check:tailwind-generated` compares all of them against a fresh compile.

Every `X.test.mjs` beside a script covers that script.
