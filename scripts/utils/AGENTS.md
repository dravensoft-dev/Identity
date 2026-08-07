# scripts/utils/

**Pure functions that name nothing of Arena.** Flat, with no domain directories under it,
because a domain is a statement about the vocabulary a module speaks and what is here speaks
none: `walkFiles` takes a directory and a predicate, `readJson` takes a path, and neither knows
what a layer, a token, a contract or a phase is. That is the whole difference from
[`../lib/AGENTS.md`](../lib/AGENTS.md), which is where a module goes the moment it does.

**The boundary is the import list, and it is checked.** A module here imports `node:` builtins
and another util, and nothing else. Not `repo-root.ts`, not `layers.ts`, not a shape module, not
a package. A util that needs one of those is a `lib/` module in the wrong directory, and moving
it is the fix rather than widening this rule. Its suite holds to the same list, which is also
why the test proving the boundary lives in `scripts/check/arena/script-imports.test.ts` and not
here: it needs the repository root to walk to, and reaching for that is the thing being
forbidden. A suite is in scope there where the specifier scan beside it excludes one, because
running a suite proves its imports **resolve** and proves nothing about where they point.

**A util owns no policy.** `walkFiles` throws on a root that is not there, because whether an
absent tree is a legitimate state or a typo is the caller's knowledge, and a walk answering `[]`
of its own accord turns the second into a clean-looking pass over nothing. The same reasoning
keeps the eight different directory exclusion lists at their call sites: they are eight
deliberate configurations and not one shared rule, and the module that tried to hold all eight
would be holding an Arena fact.

**A file here classifies as the `arena` domain**, which already means what belongs to no one
layer, so the suites are counted by the reporter rather than dropped as belonging nowhere. The
one branch that says so is in `scripts/lib/arena/domains.ts`, and `utils` is deliberately not a
sixth entry in `DOMAINS`: a directory that speaks no vocabulary cannot name one.

| module | why it exists |
| --- | --- |
| `walk-files.ts` | One recursive directory walk, in place of the thirty-three that wrote the same three lines. `skip` is asked about every entry, a file and a directory alike, which is the shape twenty of those copies already had and what lets one predicate carry a dotfile rule, a name list and an anchored path at once. Each level is read sorted **by code unit rather than by locale**, so a walk is the same on every machine and a comparison against one is not reading the filesystem's hash order. It returns an array and not a generator because every copy it replaces consumed its walk whole. |
| `main-module.ts` | Whether a module is the program, for the sixty-one scripts that ask. The comparison is `process.argv[1]` against `import.meta.url` and **never the module's own filename**, because a gate matching its own name stops running the day it is renamed, exits 0 having read nothing, and `check-all` reports that as PASS. It takes the **union** of the two shapes the copies had drifted into: the raw comparison answers first, and only a mismatch is retried through `realpathSync` on both sides, where a symlink can turn a missed match into a found one and never the reverse. That second half is what a symlinked entry needs, and an npm `bin/` link is exactly one. |
| `captures.ts` | One read of a regex capture group, for the parsers that match first and read after. `noUncheckedIndexedAccess` types `m[1]` as possibly-undefined even where the pattern guarantees the group, and the alternative at every one of those sites is `?? ''`, which turns a regex that has lost a capture into an empty string nobody ever sees. `captured()` throws instead, naming the group and what did match, so an edit that drops a capture fails at the read rather than three functions downstream. A caller whose miss deserves its own message still tests the match and throws its own; this is for the ones with nothing better to say. It was `lib/arena/captures.ts` until it was measured against the rule here and found to name nothing of Arena. |
| `read-file.ts` | `readJson`, which is the fifty-odd site one-liner with the name of the file added to the failure, because `JSON.parse` reports `Unexpected token` and names nothing, and a gate reading forty-three manifests in a loop then dies naming none of them. It hands back `any` and **not a type parameter defaulting to it**, because a bare call in a contextual position infers `unknown` rather than the default and every such site then needs a cast; `any` is what `JSON.parse` itself returns, so a caller that states a shape gets it from its own annotation and one that states none is exactly where it was. `readIfExists` keeps its `existsSync` rather than catching `ENOENT`, so a document that is not there and one that cannot be read stay two different answers. |

Every `X.test.ts` beside a module covers that module.
