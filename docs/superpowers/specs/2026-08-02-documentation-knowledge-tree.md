# Arena documentation as a knowledge tree

## The problem, measured

An agent that reaches Arena through the `design` skill spends most of its budget before it can
write a line of UI.

`SKILL.md` is 939 characters, and its entire routing instruction is "read the README.md file
within this skill, and explore the other available files (`contracts/`,
`frameworks/react/components/`, `frameworks/react/ui-kits/`, `frameworks/tailwind/`,
`assets/`)". That is an instruction with no ceiling over a tree holding **729,300 characters of
Markdown** and **174,787 characters of contract JSON**. The agent either reads far too much or
greps blindly and misses a binding rule.

Four causes, each measured rather than estimated:

1. **No routing.** The READMEs that instruction points at total **192,609 characters**, roughly
   50k tokens, before a single component is opened.
2. **No catalog.** Answering "does a Toast exist, what members does it take, is it in Angular"
   needs a `find` and several file reads. `frameworks/Components.json` (914 characters) carries
   names and categories and nothing else.
3. **Audiences share files.** `frameworks/react/README.md` is roughly 40% consumer material
   (no CSS classes, reduced motion, layout, dimensions) and 60% contributor material (compiler
   options, ahead-of-time demos, the two test invocations, the preload).
   `contracts/design/README.md` is the design language for its first 298 lines and DTCG
   authoring for its last 70. `contracts/api/README.md` (44,655) is almost entirely about how
   to *write* a contract, which a consumer never does. Meanwhile `PACKAGE.md`, which is the
   consumer's actual door, appears nowhere in the root README's "Where to go next".
4. **`CLAUDE.md` sits at 59,451 of the 60,000 character limit**, 549 characters of headroom,
   and restates mechanisms already carried in full by the layer READMEs it points at.

## The shape

A tree whose first branch is **audience**, and whose consumer branch is three hops deep:

```
SKILL.md                            the router, plus the rules that bind a consumer
  frameworks/Catalog.generated.md   every component: what, which layers, members, pattern
    <Name>.prompt.md                the one component being written
      contracts/api/components/<Name>.json   the exact members
      contracts/design/*.json                the exact token values
        contracts/design/README.md           what a value means, and why
README.md                           the human front door, carrying the audience fork
CLAUDE.md                           the root of the contributor branch
```

A consumer reaches productive work at roughly 5k tokens instead of 50k, and descends only when
a rule is genuinely in question.

`SKILL.md` becomes the router rather than gaining a sibling: it is the one document the skill
loads unconditionally, so routing from it costs no extra hop. The root `README.md` stays
Getting started and nothing more, and gains only the two-line fork.

## The decisions, and why

**The catalog is generated, not written.** Every column derives from something that already
exists: `frameworks/Components.json` for name and category, the API contract's `description`
for what it is (all 50 have one), directory existence for which layers ship it, the contract's
`api` keys for its members, and the `.behaviour.json` binding for its pattern. A hand-written
catalog is exactly the paragraph `DOUBTS.md` refuses: nothing fails when it stops being true,
and every new component obliges an edit that nothing demands. A generated one, with a gate that
re-emits and diffs, cannot go quietly false.

**The contract JSON must lose its em dashes first.** `check:docs` applies the punctuation rule
to every `.md`, generated or not, so a catalog built from those descriptions fails the gate.
32 of 50 component contracts, 16 of 44 shared types and 10 token sources carry one. This is a
correctness win beyond the catalog, because `generate-member-docs.mjs` copies those
descriptions verbatim into each layer as member docs, which ship inside the published `.d.ts`.

**Material moves only where the cut is clean.** `contracts/design/README.md` splits at line
299, where the document's own preamble already says it splits: the token type map and the DTCG
authoring rules leave, the 298 lines stating what the values mean stay. The layer READMEs are
not split, because `PACKAGE.md` is already the consumer's door and routing to it is enough.

**Nothing is split into per-topic files.** It would save more per lookup, but it breaks every
cross-reference in the repository and the "one normative document per level" claim that both
`contracts/README.md` and `CLAUDE.md` make. Routing plus the one clean cut gets most of the
benefit at a fraction of the risk.

**No token catalog is generated.** The DTCG JSON already is the machine-readable form of a
token value. The router says so, which costs nothing, and a second copy would be a second thing
to keep in step.

## What success looks like

A fresh session loads the skill, reads `SKILL.md`, reads `frameworks/Catalog.generated.md`,
opens one or two `.prompt.md` files, and opens none of `contracts/api/README.md`,
`contracts/behaviour/README.md`, `frameworks/tailwind/README.md` or `frameworks/PACKAGING.md`.
That is 98,000 characters of contributor material kept off the consumer's path by one sentence.
