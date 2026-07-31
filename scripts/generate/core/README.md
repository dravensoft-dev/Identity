# scripts/generate/core/

| script | emits | why it exists |
| --- | --- | --- |
| `fetch-fonts.mjs` | `contracts/design-generated/fonts.generated.css` and `assets/fonts/*.woff2` | Downloads the Latin subsets of the three families `contracts/design/typography.json` names, and declares them with `@font-face`, so a page loads fonts from its own origin and makes no CDN request. **The binaries carry no `.generated.` infix and no header**: they are binary, so a header is impossible, and reproducing them needs the network — the one generated output in the repository identified by its generator rather than by its name. `check:generated` records that exception by literal value with its reason. |

`core` because it touches `contracts/` and `assets/`, which the design layer owns, and no
framework layer.

**Not part of `bun run build`**, since it reaches the network and its output changes only when
a family or weight is added. `--css-only` re-emits the stylesheet from the binaries already on
disk. `check:fonts` asserts every declared family has a face.

Every `X.test.mjs` beside a script covers that script.
