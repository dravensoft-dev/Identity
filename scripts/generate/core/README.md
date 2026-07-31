# scripts/generate/core/

| script | emits | why it exists |
| --- | --- | --- |
| `fetch-fonts.mjs` | `contracts/design-generated/fonts.generated.css` and `assets/fonts/*.woff2` | Downloads the Latin subsets of the three families `contracts/design/typography.json` names, and declares them with `@font-face`, so a page loads fonts from its own origin and makes no CDN request. **The binaries carry no `.generated.` infix and no header**: they are binary, so a header is impossible, and reproducing them needs the network. They are the one generated output in the repository identified by its generator rather than by its name. `check:generated` records that exception by literal value with its reason. |
| `arena-theme/` | the consumer's own stylesheet, wherever they point `-o` | The command the npm packages ship as `bin/arena-theme.mjs`: an `arena.config.json` in, the palette blocks and the `@font-face` rules out. Arena publishes the language and never the skin, so this is the one stylesheet a package cannot carry. `check:packages` runs it over Arena's own skin and asserts the result equals what Style Dictionary emits, which is what keeps two emitters saying one thing. |

`core` because both touch `contracts/` and `assets/`, which the design layer owns, and no
framework layer.

## Why `arena-theme/` is a directory

It is one shippable unit rather than loose files. The assembly copies it whole into each
package, so a sibling added to it travels with no edit anywhere else, and it depends on nothing
but `node:fs` and its own contents, because inside a package `scripts/` does not exist.

That is also why `validate-palette.mjs` sits in it: a **verbatim** second copy of the one in
`lib/core/`, which is what its own header instructs. `palette-keys.test.mjs` holds the two
byte-equal, and holds the 27 palette keys equal to `contracts/design/palette.dark.json`, so a
colour added to the skin fails there before it can reach a consumer's configuration.

## Running them

`fetch-fonts.mjs` is **not part of `bun run build`**, since it reaches the network and its
output changes only when a family or weight is added. `--css-only` re-emits the stylesheet from
the binaries already on disk. `check:fonts` asserts every declared family has a face.

`arena-theme.mjs` is not part of it either, and for the opposite reason: nothing in this
repository is its input. It runs in a consumer's project, against a file that project wrote.

Every `X.test.mjs` beside a script covers that script.
