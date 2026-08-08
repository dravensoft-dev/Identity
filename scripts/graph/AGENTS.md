# scripts/graph/

**The layer that decides whether a step runs.** A build step and a gate both cover a subject, and
most runs touch none of it. What decides that a step can keep the answer it had lives here, and
nothing else does: a phase is what a script belongs to, and deciding is not compiling, emitting or
judging.

| module | answers |
| --- | --- |
| `pathspecs.ts` | what a declared spec reaches: `matchesSpec(spec, path)` and `resolveSpecs(specs, universe)` against a path list, plus `unreachedSpecs(specs, universe)`, which is how a spec matching nothing becomes a fact a caller reports. |
| `inputs.ts` | what a file is, as a fingerprint: `universe(root)` walks the tree once, `stampOf(path, previous)` filters on the stat and arbitrates on the hash, and `digestOf(paths, stamps)` folds a list into one value. |
| `script-closure.ts` | every module under `scripts/` a script reaches: `relativeSpecifiers(source)` and `scriptClosure(entry, root)`. |

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
