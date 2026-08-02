# .github/workflows/

Four workflows: one guards a pull request, one guards `main`, and two publish a package.

```
pull_request -> main          Arena PR
push to main                  Arena main
   |
   +-- on success             Publish arena-react
   +-- on success             Publish arena-angular
```

## Arena PR

Two stages, `build` then `test`, and the fan-out is in the second one.

```
changes            which layers this diff reaches
   |
build              bun run build, then build:packages, then one cache entry
   |
   +-- test-core       always            20 gates + the suites under scripts/
   +-- test-react      if react           4 gates + the two React invocations
   +-- test-angular    if angular         4 gates + the suites off the ngc emit
   +-- test-tailwind   if tailwind        6 gates
   |
pr-gate            the only required check
```

**`build` is one job because the build is one thing.** `bun run build` runs seven steps in
order and the order is not decorative: the Tailwind preset compiles against the token CSS,
and every `.variants.ts` in the Angular layer imports a manifest that step writes. A build
job per layer would have each of them redoing most of what the others did.

**The four names are on the test stage, where the layers are genuinely disjoint.** A gate
belongs to exactly one of the five domains `check-all.mjs` sorts by, and the jobs partition
that set: `core` takes the `core` and `arena` domains, and the other three take their own.
`check-all.test.mjs` asserts the partition, so a gate cannot join `GATES` and run in no job.

**`core` runs on every change, and that is not caution.** The `arena` domain is where the
cross-layer gates are: `check:api`, `check:behaviour`, `check:compliance`, `check:structure`,
`check:dimensions`, `check:layer-independence`, `check:cards`, `check:focus-trap`. Each of
them reads more than one layer, so none of them is a React question or an Angular question.
And `scripts/lib/arena/behaviour-contracts.test.mjs` asserts the React component count by
literal value: a change confined to `frameworks/react/` breaks a suite under `scripts/`.

**Which layers a diff reaches is decided by `scripts/ci/arena/changed-layers.mjs`**, not by
a path filter written here, because that module has a suite and a YAML filter does not. Its
least obvious rule is the one worth reading: a Tailwind edit routes to Angular too.

**`pr-gate` is the single required check.** A job skipped by an `if` reports success to
branch protection, so requiring `test-react` directly would be satisfied by a React change
that failed to route. `pr-gate` runs with `always()` and reads `needs.*.result`, which no
routing decision can skip.

## Arena main

One job, and deliberately not the fan-out. It runs every gate and then the whole suite
through `bun run ci:summarize`, which takes the invocation from `testStep()` in
`check-all.mjs` and appends the two junit flags. `check-all.mjs` stays the one place the
test invocation is written down, and the run summary carries a table of passes per domain.

A domain that owns suites and reported no case fails the run, as does a tree that
contributed nothing and a case belonging to no domain. A reporter that quietly dropped a
suite would otherwise print a confident table of zeros.

## Publish arena-react, Publish arena-angular

Each fires on a green `Arena main`, guards, and usually does nothing.

**Each is also dispatchable by hand**, and that path exists because the automatic one has a
gap nothing in this repository can close: `workflow_run` reaches only a workflow already
registered on the default branch, so the push that first puts one there cannot dispatch it,
and re-running that push replays the original event rather than asking the question again.
A release whose event is missed that way has no other way through. A manual run is safe for
the same reason an automatic one is: the guard and `check-release.mjs` both run, so the
answer to "is there anything to publish" is reached identically whoever asked.

The guard asks two questions in order. Is `plugin.json`'s version already on the registry?
Then there is nothing to do, which is almost every push. Otherwise, has anything this
package carries moved since the tag of the version that **is** on the registry? If not, this
package keeps its version while Arena moves on.

The baseline is that tag rather than the previous commit, and that matters: a layer can
change in one commit and the version bump land in another, so asking only about this push
would mean the change is never published at all. What each package carries is
`scripts/ci/arena/package-inputs.mjs`, whose suite holds the list to what the assemblers
actually read.

**Whatever it answers, the guard writes that answer to the run summary**: the version on the
registry, the version in this tree, the decision, and the reason for it. The common answer is
that there is nothing to publish, and an answer readable only by opening a log is one nobody
reads. These runs are not jobs of `Arena main` and never appear in its panel, because a
`workflow_run` workflow is a separate run; each publish job is on its own workflow's page, and
the summary is what that page says without being unfolded.

When the guard says yes, the publish job runs `check-release.mjs` first, so a version bump
pushed without its tag is refused loudly rather than published quietly. Then it builds,
assembles, holds the manifests, and packs. The tarball and a small record of what was
published go up as an artifact, because a packed tarball is byte-identical to what leaves
the machine and is the only account of "what shipped at this version" that does not require
trusting the registry.

Authentication is a trusted publisher over OIDC: no token lives in this repository, and
provenance is attested automatically, with no `--provenance` flag. **The file name of each
workflow is its identity**, exactly and case-sensitively, because that is what the publisher
configured on npmjs.com names. Renaming one revokes that package's right to publish.

The one error tolerated is `cannot publish over the previously published versions`. The
registry read path the guard uses lags a successful publish by several minutes, so a re-run
inside that window sees a version that is published and reports it as absent. Any other
failure is red.

## Why are the published package versions not identical?

**Because a package is published only when something it carries has changed.**

Arena's version lives in one place, `.claude-plugin/plugin.json`, and both packages are
stamped from it at assembly. They are never hand-versioned, so a published package can never
disagree with the tag it was cut from. What differs is not the number but **which numbers
exist**.

Suppose both packages are published at the version Arena currently carries. The next release
changes the React layer and nothing in Angular: `@dravensoft/arena-react` is published at the
new version, and `@dravensoft/arena-angular` keeps the one it has, because republishing it
would ship an identical tree under a new number. The release after that touches Angular, so
it goes to the version current by then and skips the one in between, which never existed for
that package.

So the newest version of a package is the version of the last Arena release that changed it.
A gap in the sequence is the record of a release that left it alone, and two packages at
different versions are two packages that last changed at different times. Both are always
built from the same tree.

## Notes on the runner

**Chromium.** `check:cards` and `check:focus-trap` drive a real browser, and `CHROME_PATH` is
terminal: set and pointing at nothing, the gates report that rather than falling back to the
candidate list. The workflows set it to `/usr/bin/google-chrome`, which the image documents,
rather than to the declared default.

**Strictness is automatic.** GitHub sets `CI=true`, which `skipExitCode()` reads, so a gate
whose dependency is missing fails instead of skipping. There is nothing to configure and
nothing to remember; a missing browser is a red run.

**The cache is not an artifact.** `actions/cache` carries the build from the `build` job to
the four test jobs, keyed by run and attempt so it is never stale, and with no `restore-keys`,
because a prefix fallback would hand a test job the build of another pull request. A restore
that misses fails the job rather than testing an unbuilt tree. `upload-artifact` appears only
in the two publish workflows, where the artifact is a release record rather than a hand-off.

**`check:docs` reads this directory.** Every `.md` here is held to the size limit and to the
punctuation rule, the same as anywhere else in the tree. It does not read `.yml`: nothing
does, so the workflows themselves are held only by GitHub.
