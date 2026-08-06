# scripts/ci/arena/

The three questions a runner asks that no one layer can answer alone.

| module | why it exists |
| --- | --- |
| `changed-layers.ts` | Which framework layers a diff reaches. `SHARED` names what routes to all three, `LAYER_INPUTS` what routes to one, and every entry carries a reason so a stale one is legible. **A Tailwind edit routes to Angular as well**, because each `.variants.ts` imports a generated manifest and `ngc` fails without it; that is the entry a hand-written YAML filter gets wrong. `unroutedLayers()` compares the map against `LAYERS`, so a layer added with no route fails the run rather than silently never building. Reads the diff on stdin and prints `layer=true|false` lines for `GITHUB_OUTPUT`. |
| `summarize-tests.ts` | Runs the suite and reports it per domain. The invocation is **taken from `testStep()` and extended, never rebuilt**: `stepsWithJunit()` appends `--reporter=junit` and `--reporter-outfile` to the steps that are already there, and its suite asserts that by comparing against `testStep()` itself, so `check-all.ts` stays the single authority. The exit rules are the point: a domain that owns suites and reported no case, a tree that contributed no case, a case belonging to no domain, and an empty report are all failures, because a reporter that dropped them would otherwise print a confident table of zeros. Writes to `GITHUB_STEP_SUMMARY` when it is set and to stdout when it is not. `suiteDomains()` decides which domains are expected to report, and it reads `isSuite()` from `lib/arena/domains.mjs` rather than matching a suffix of its own: a domain whose suites this walk stops recognising stops being expected, and every case it owns can then go missing without raising the very problem the exit rules exist for. |
| `package-inputs.ts` | What each published package is assembled from, so a publish workflow can ask whether anything a package carries has moved since the version now on the registry. Derived from what the two assemblers read; its suite holds it to that by checking every `CSS_CHAIN` entry is covered and every path named still exists, so a rename fails here rather than quietly narrowing the guard. |

Every `X.test.mjs` beside a module covers that module, and all three run under plain node.

The junit reports go to `.cache/junit/`, which is git-ignored and which every walker skips
already, since they all skip an entry whose name begins with a dot.
