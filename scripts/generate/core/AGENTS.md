# scripts/generate/core/

| script | emits | why it exists |
| --- | --- | --- |
| `fetch-fonts.ts` | `contracts/design-generated/fonts.generated.css` and `assets/fonts/*.woff2` | Downloads the Latin subsets of the three families `contracts/design/typography.json` names, and declares them with `@font-face`, so a page loads fonts from its own origin and makes no CDN request. **The binaries carry no `.generated.` infix and no header**: they are binary, so a header is impossible, and reproducing them needs the network. They are the one generated output in the repository identified by its generator rather than by its name. `check:generated` records that exception by literal value with its reason. |
| `arena-to-prod/` | `arena.generated.css` and `icons.generated.css`, in the directory the consumer points `--out` at | The one command the npm packages ship, as `bin/arena-to-prod.mjs`. Its theme step turns an `arena.config.json` into the palette blocks and the `@font-face` rules, which is the one stylesheet a package cannot carry because Arena publishes the language and never the skin; it also writes the import chain that file leads with, and a config naming the components it renders gets those sheets rather than the barrel. Its icons step writes the Phosphor subset, because a weight sheet draws every icon Phosphor has and a screen draws a handful, which makes the whole weight the largest thing an Arena project sends that nothing on it reads; it scans the consumer's sources and the package it ships in, since a component renders icons the consumer never names, and keeps the `@font-face` of each weight in use in `woff2` alone. **The theme runs first and its failure stops the run**: a project whose config does not parse has no theme, and nothing to subset for. A config asking for `"components": "auto"` is resolved against the `components.json` the package carries before the config is validated at all, so the list the gate holds is the resolved one and a scan that finds nothing is fatal rather than an empty subset. `check:packages` runs the theme step over Arena's own skin and asserts the result equals what Style Dictionary emits, which is what keeps two emitters saying one thing. |

`core` because the first touches `contracts/` and `assets/`, which the design layer owns, and no
framework layer, and because the second speaks the vocabulary of a package a consumer installed
rather than of any layer here.

## Why a shipped command is a directory

It is one shippable unit rather than loose files. The assembly copies the directory whole into
each package, so a sibling added to it travels with no edit anywhere else, and it depends on
nothing but `node:fs` and its own contents, because inside a package `scripts/` does not exist.

**`bin/` is flat**, so every CLI tree is one namespace: two of them may not share a filename, and
a command may never import across from another's directory, because the path it would use here
is not the path that exists there. `copyCli` in `lib/arena/package-assembly.ts` refuses both,
which is what lets a second command be added without silently overwriting a file of this one's.

That is also why `validate-palette.mjs` sits in it: a **verbatim** second copy of the one in
`lib/core/`, which is what its own header instructs. `palette-keys.test.mjs` holds the two
byte-equal, and holds the 27 palette keys equal to `contracts/design/palette.dark.json`, so a
colour added to the skin fails there before it can reach a consumer's configuration.

**One command rather than two.** Every project ran the theme and the icons in the same order in
the same prebuild script, so two commands were two of everything a consumer had to read: two
sections, two flag tables, two wiring snippets. `CLI_BINS` is the list both manifests take their
`bin` from, and it now holds one entry.

## Running them

`fetch-fonts.ts` is **not part of `bun run build`**, since it reaches the network and its
output changes only when a family or weight is added. `--css-only` re-emits the stylesheet from
the binaries already on disk. `check:fonts` asserts every declared family has a face.

`arena-to-prod.mjs` is not part of it either, and for the opposite reason: nothing in this
repository is its input. It runs in a consumer's project, against the files that project wrote.

Every `X.test.mjs` beside a script covers that script.
