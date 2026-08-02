# Plan: Arena documentation as a knowledge tree

Executes [`../specs/2026-08-02-documentation-knowledge-tree.md`](../specs/2026-08-02-documentation-knowledge-tree.md).

## 1. Clear the em dashes out of the contract JSON

Rewrite every em dash in `contracts/api/components/*.json`, `contracts/api/types/*.json` and
`contracts/design/*.json` by the repo's own rule: an aside becomes commas or parentheses, an
amplification becomes a colon, a turn becomes a semicolon or a second sentence. This blocks
step 2, because `check:docs` applies the punctuation rule to every `.md` including a generated
one.

Then `bun run generate:api`, `bun run check:api`, `bun run check:docs`.

## 2. Generate the catalog

`scripts/generate/arena/generate-catalog.mjs` plus its `.test.mjs`, emitting tracked
`frameworks/Catalog.generated.md`. Wire `generate:catalog` into `package.json` and into
`bun run build`; add its row to `scripts/generate/arena/README.md`.

| Column | Source |
|---|---|
| Component, Category | `frameworks/Components.json` |
| What it is | `contracts/api/components/<Name>.json` → `description` |
| Layers | directory existence, via `readLayer()` and `kebab()` in `scripts/lib/arena/layers.mjs` |
| Members | the keys of the contract's `api` object |
| Behaviour | `pattern` from each layer's `<Name>.behaviour.json`, naming both when they diverge |
| Prompt | the derived path to `<Name>.prompt.md` |

It sits at `frameworks/`, beside `Components.json`, which is both its main input and the
narrowest level containing its consumers. `check:layer-independence` scopes to
`frameworks/<layer>/`, so a file at the parent naming both layers is outside it. It is tracked,
because the plugin is served from the git tag, and `check:generated` never scans a `.md`, so it
needs no `UNTRACKED` entry.

## 3. Gate it

`scripts/check/arena/check-catalog.mjs` plus its `.test.mjs`, following `check:tokens`:
re-emit from the sources, diff against the committed file, fail on any difference and on a zero
result set. Add `check:catalog` to `package.json` and to `GATES` in `check-all.mjs`, and bump
the literal `GATES.length` in `check-all.test.mjs`.

## 4. Rewrite `SKILL.md` as the router

What Arena is in three lines; the audience fork; the rules that bind a consumer and that no
component prompt repeats; a task table naming one file per question; and the explicit stop that
keeps the contributor documents off the consumer's path.

## 5. Move the material that sits in the wrong file

- `contracts/design/README.md` lines 299 to the end move to `contracts/design/TokenTypes.md`,
  leaving a pointer. Follow the references: the preamble at line 8, `README.md`, and
  `contracts/README.md`'s claim of one normative document per level.
- The root `README.md` gains the audience fork and `frameworks/<layer>/PACKAGE.md`.
- Each normative README gains a one-line audience header.

## 6. Buy back `CLAUDE.md`'s headroom

Replace a mechanism already carried in full by the layer README `CLAUDE.md` points at with one
sentence plus that pointer, after reading the target end to end. **A rule stated nowhere else
is never deleted.** Target roughly 50,000 characters.

## Verification

`bun run check`, then by hand: a fresh skill session reads `SKILL.md`, the catalog and one or
two prompts, and opens none of the contributor documents.

## On completion

Delete this plan and its spec, per the convention that a dated process document dies with the
work it describes.
