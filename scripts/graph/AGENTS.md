# scripts/graph/

**The layer that decides whether a step runs.** A build step and a gate both cover a subject, and
most runs touch none of it. What decides that a step can keep the answer it had lives here, and
nothing else does: a phase is what a script belongs to, and deciding is not compiling, emitting or
judging.

| module | answers |
| --- | --- |
| `graph.ts` | the algebra over the declared set, and nothing about where it came from: `needsOf`, `topoOrder`, `cyclePath`, `duplicateWriters`, `subscriptionProblems`, `unknownFeeds`, `selfFeeds`. Resolution is handed in, so it holds no table and imports no script. |
| `nodes.ts` | the set itself: `collectedScripts(root)` walks the three phases and `allNodes(root)` imports each and keeps what exports a node. `NEVER_SUBSCRIBES` and `NOT_YET_SUBSCRIBED` say what is out. |
| `pathspecs.ts` | what a declared spec reaches: `matchesSpec(spec, path)` and `resolveSpecs(specs, universe)` against a path list, plus `unreachedSpecs(specs, universe)` and `reachesNoDirectory(spec, universe)`, which is how a typo is told from a spec written ahead of the tree. |
| `inputs.ts` | what a file is, as a fingerprint: `universe(root)` walks the tree once, `stampOf(path, previous)` filters on the stat and arbitrates on the hash, and `digestOf(paths, stamps)` folds a list into one value. |
| `script-closure.ts` | every module under `scripts/` a script reaches: `relativeSpecifiers(source)` and `scriptClosure(entry, root)`. |
| `graph-problems.ts` | everything `check:graph` asserts, so the gate under `check/arena/` is a print and an exit. |

## A script subscribes by editing itself

```ts
export const node = {
  name: 'generate:tokens',
  reads:  SOURCES.map((source) => `contracts/design/${source}`),
  writes: [...CSS_TARGETS, ...SCRIPT_TARGETS, BREAKPOINT_TARGET],
  feeds:  ['build:tailwind', 'build:angular-demo'],
};
```

`name` is the npm script, `reads` are the source pathspecs, `writes` are the artifacts, and
`feeds` are the nodes that consume them. **Edges are declared downstream.** Everything reading the
other direction goes through `graph.ts:needsOf(nodes)`, so a node is added by editing one file.

**The declaration reuses the constants the script already has**, which is the whole reason it lives
in the script and not in a table: a target list written twice drifts the first time one of them
gains an entry. It is also why `allNodes()` imports rather than reading the text.

`check:graph` joins the two halves. If B's `reads` meet A's `writes`, A lists B in `feeds`, and
nothing else does. A `feeds` entry no artifact carries fails as well: an edge nobody maintains is
the same defect read backwards.

**`writes` meeting a node's own `reads` is the shape, not a defect.** `generate:member-docs` writes
each contracted member's description into the component that declares it, and
`generate:prompt-api` writes the `@api` region into the prompt it reads.

**A spec opening with `!` excludes**, which is how a node claims a directory of hand-written
sources without claiming the generated files beside them.

## Two lists say what is out, and both are keyed by path

A path is the key every script has and an npm name is not: `check-release.ts` and `fetch-fonts.ts`
have none.

`NEVER_SUBSCRIBES` names what will never join, each with its reason, and a key naming a directory
covers everything under it. **Nothing in it is imported at all**, and `check-graph.ts` is why:
collecting reaches the gate that is running, whose own guard correctly answers that it IS the
program, so importing it makes it re-enter itself once per collection.

`NOT_YET_SUBSCRIBED` names what has not joined yet. It is a count that goes to zero, and it exists
so that a script in neither list is a decision nobody made rather than a default.

## Flat, and the reason is the opposite of `utils/`

`utils/` carries no domain grid because a util speaks no vocabulary. `graph/` carries none because
each module here speaks every one at once: a node's inputs are contracts, both framework layers, the
Tailwind preset and the repository root together, so the domain would be `arena` for all of it and
the directory would say nothing. That is the second exception to the grid, and an exception with no
argument beside it is how the grid stops meaning anything.

## The stat filters and the hash arbitrates

A file's fingerprint is its content hash, and the stat is what decides whether that hash has to be
recomputed. Size and mtime agreeing with the record is taken as the file and nothing is read; either
moving costs one read, and a hash that comes back equal updates the stat and leaves the fingerprint
where it was. Checking out another branch and coming back rewrites every mtime and invalidates
nothing. A `touch` invalidates nothing. Only a changed byte does.

**The one blind spot is a file rewritten to the same size and the same mtime**, which takes a
deliberate mtime restore to reach. It is the trade every incremental build makes, and `--force` is
what answers it.

**Nothing here asks git what it tracks.** `universe(root)` is a walk, so an artifact under
`.gitignore` is fingerprinted like any other file, a fresh clone that has not built is a smaller
universe rather than a special case, and no rule about ignored files has to exist to be forgotten.

## What a digest is over

`digestOf(paths, stamps)` hashes the **list** of path and hash pairs, never the concatenated
contents. A file appearing adds a row and a file leaving removes one, so a gate that walks a
directory is sensitive to a file arriving and not only to one changing, and that falls out of the
shape rather than out of a rule. A path with no stamp still occupies its row, which is what makes a
deletion visible.

## Reading a script rather than importing it

`scriptClosure(entry, root)` scans text. Importing a script to read its imports runs it, and a
script under `build/`, `generate/` or `check/` is held to doing no work when it is imported by
`check/arena/script-imports.test.ts:importTimeEffects(path)` precisely so that collecting from it is
safe; a scan that resolved by importing would be relying on that guarantee to establish it.

A specifier inside a string literal is one a generator is **writing**, and an interpolated one names
no file, so both are dropped. `check/arena/script-imports.test.ts:unresolvedSpecifiers(path)` reads
the same specifiers to prove they resolve, and takes them from here, because the same pattern
written twice is two patterns the day one of them is fixed.

The closure stops at the edge of `scripts/`. A file in a framework layer is something a node
**declares** reading, and following it here would count it twice under two different names.
