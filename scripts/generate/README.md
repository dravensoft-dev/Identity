# scripts/generate/

**Generate emits source from data.** The input is a declaration nobody wrote as code (DTCG
JSON, an API contract, a font family list) and the output is source in a language a layer
speaks. The distinction from [`../build/`](../build/README.md) is the input, not the output:
build starts from something already written in the target's idiom, generate starts from a fact
about the design system and picks the idiom itself.

That is why a token appears in five places from one edit. `contracts/design/spacing.json`
declares a value once; `generate-tokens.mjs` decides what a CSS custom property, a JavaScript
constant and a TypeScript constant each have to look like to say it.

Every output is named `<stem>.generated.<ext>`, with **one exception**: the font binaries under
`assets/fonts/`. They are binary, so they can carry no header, and reproducing them needs the
network. They are the only generated output in the repository identified by its generator rather than
by its name. `check:generated` names it by literal value with that reason, so a second such
case fails until it is argued for.

## The five domains

| domain | scripts | |
| --- | --- | --- |
| [`arena/`](./arena/README.md) | 2 | writes into two framework layers at once, plus `contracts/` |
| [`core/`](./core/README.md) | 1 | `contracts/` and `assets/`, which the design layer owns |
| `react/`, `angular/`, `tailwind/` | none | empty; each layer's generated source is written by an `arena` script, because it lands in both layers at once |

The three empty domains keep a `.gitkeep`. A generator touching one layer alone is possible and
has simply not been needed: emission is **per layer** precisely so a component's import never
crosses the `contracts/` ↔ `frameworks/` boundary, and that makes almost every generator here
an `arena` one by the reads-and-writes test.

## Rebuilding

`bun run generate:tokens` and `bun run generate:api` are part of `bun run build`.
`fetch-fonts.mjs` is **not**: it reaches the network, and its output changes only when
`contracts/design/typography.json` names a new family or weight. Run it by path when that
happens, and `--css-only` to re-emit the stylesheet from the binaries already on disk.
