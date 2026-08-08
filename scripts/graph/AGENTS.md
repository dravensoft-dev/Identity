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
| `fingerprint.ts` | what a node is worth comparing: `fingerprintOne(node, measure)` and `fingerprintNodes(...)` over the whole set, in dependency order. |
| `state.ts` | what the last green run left behind, under `.cache/`: `readFiles`, `writeFiles`, `readState`, `writeState`, `recordGreen`, `forget`. |
| `plan.ts` | whether a node runs and the sentence saying why: `decide(node, current, previous, onDisk)`. |
| `run-build.ts` | the build, in the order the graph derives. |
| `graph-problems.ts` | everything `check:graph` asserts, so the gate under `check/arena/` is a print and an exit. |
| `fs-trace.ts`, `trace-preload.ts` | what a run actually opens: the preload wraps the read entry points before the script's own imports run. |
| `audit.ts` | `auditProblems(node, script)`, which compares a traced run against the declaration. `UNTRACEABLE` names what spawns a process the tracer cannot enter. |
| `gate-plan.ts` | what `check-all.ts` asks the graph, kept out of the runner so that file stays the single authority for how the suite is invoked. |

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

## `check:graph --audit` answers what `check:graph` cannot

The gate holds the edges **between** declarations, so it finds a reader nobody subscribed. It cannot
find a `reads` that is too narrow: a file no node claims is a file every declaration agrees is
nobody's business, and there is no disagreement to detect. Only a run is a witness, so `--audit`
runs each node under a tracer and reports what it opened and does not declare.

It found real gaps in declarations that had already passed the gate and a planted-defect test:
`generate:playgrounds` read `frameworks/Components.json` without declaring it, `check:cdk` read the
generated token sheets, and `check:react-barrel` probed a `.jsx` its spec did not reach.

**Nothing under `fs-trace.ts` imports `node:fs` through ESM**, and that rule is load-bearing rather
than tidy. The first ESM import of a builtin fixes the bindings every later importer gets, so a
preload that touches `node:fs` before patching wraps an object nobody will call. Measured: with an
ESM import ahead of the patch, 0 of 3 calls are intercepted; without it, 3 of 3. The CommonJS object
is reached through `createRequire`, is the same object, and has writable properties.
`audit.test.ts` pins both halves, so the day the runtime changes, the suite says so.

A directory listing is not counted against a declaration. The digest is over the sorted list of path
and hash pairs, so a file appearing under a directory a spec reaches already moves the fingerprint.

**A node that spawns a process is reported unaudited and never clean.** `UNTRACEABLE` names each
with its reason: `tsc`, `ngc`, `ng-packagr`, a browser and the shipped CLI all read in a process the
tracer cannot enter. Measuring nothing and finding nothing have to read differently.

## Two lists say what is out, and both are keyed by path

A path is the key every script has and an npm name is not: `check-release.ts` and `fetch-fonts.ts`
have none.

`NEVER_SUBSCRIBES` names what will never join, each with its reason, and a key naming a directory
covers everything under it. **Nothing in it is imported at all**, and `check-graph.ts` is why:
collecting reaches the gate that is running, whose own guard correctly answers that it IS the
program, so importing it makes it re-enter itself once per collection.

`NOT_YET_SUBSCRIBED` names what has not joined yet. It is a count that goes to zero, and it exists
so that a script in neither list is a decision nobody made rather than a default.

## A failure stops its dependents and nothing else

`graph.ts:transitiveFeeds(nodes, name)` is what decides. The failed step is FAIL, everything
downstream of it is BLOCKED with the upstream named, and the rest of the run proceeds. This is the
one place the graph pays for itself twice: it knows which steps are downstream, so it does not have
to choose between stopping everything and running steps that cannot succeed.

`check-all.ts` does NOT do this, and the difference is deliberate. A gate states a claim about the
tree, and a failed claim does not stop another gate from reporting its own, so the sweep runs all of
them and reports every problem in one pass. That rule predates the graph and the graph does not
change it.

## The fingerprint recorded is measured after the step, never the one that decided it

`generate:member-docs` writes each contracted member's description into the component that
declares it, and `generate:prompt-api` writes the `@api` region into the prompt it reads. Their
`writes` meet their `reads`, so a value measured before the step is stale the instant it succeeds
and the node would never be kept. The value measured after is the converged one, and the next run
recomputes exactly it.

The rule is applied to every node, not to those two. For a node whose writes miss its reads, before
and after are the same value and nothing changes. It works because those generators converge, which
is what the `git diff --exit-code` in every verify workflow already proves; one that did not
converge would run every time, which is what the build did before any of this and not a wrong
answer kept.

## Only a green run writes an entry

Every other outcome deletes it. A SKIP recorded as green is a node that never runs again, and a node
with no entry cannot be kept, so a machine that cannot run a step is honest about it for ever rather
than once. The entry is written after each node, so a run that stops halfway keeps the greens before
the failure.

## What a run prints

Every step says whether it ran and why, or that it was kept and at what fingerprint. A skipped step
is the one thing a reader cannot see happening, so the reason is not decoration:

```
run-build: generate:tokens runs, because its sources have moved since the last green run
run-build: build:tailwind runs, because generate:tokens ran, so what it reads was rewritten under it
run-build: generate:skills comes from the cache (595efd571d07)

run-build: all 12 step(s) passed, 4 ran, 8 came from the cache
```

The tail never collapses the count, so a cheap run cannot be read as a whole one.

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
