# The three contract levels, in one place

**Status:** design, approved 2026-07-29.

## The problem

Arena states three contracts, and a reader has to be told where each one lives, because
the tree does not say. `api/` holds what a component's API presents. `behaviour/patterns/`
holds what a kind of component must do. `tokens/src/` plus `tokens/colors.css` hold what a
value is. Those three are the same kind of thing — a normative statement a platform target
implements — and they sit at three unrelated places in the root, each one indistinguishable
from the directories around it that are *not* contracts (`assets/`, `guidelines/`,
`scripts/`, `frameworks/`).

The cost is real rather than aesthetic, and this repository has already paid it twice in
prose. `scripts/lib/behaviour-contracts.mjs` opens by *arguing* the layout — "these live in
`behaviour/` at the repo root rather than under `tokens/` because a contract is not a value"
— which is a sentence that only has to exist because the tree does not make the answer
obvious. And `api/README.md` and `CLAUDE.md` both reach for the same simile, that
`api/README.md` is read first by a new platform target "the way `tokens/src/TYPE-MAP.md` is"
— two normative documents whose only stated relationship is a comparison written twice by
hand.

A fourth fact the layout hides: **only one of the three levels generates anything outside
`frameworks/`.** The design level emits five CSS files that ship to consumers; the API and
behaviour levels emit nothing but the per-layer modules that already live beside the layers
that consume them. Today those five generated files sit in `tokens/` interleaved with the
hand-authored `colors.css` and the DTCG source, and nothing but a comment at the top of each
file separates them.

## What is being built

A `contracts/` directory holding all three levels, with the design level's generated output
in a sibling that names itself as generated.

```
contracts/
  README.md              new — an index of the three levels
  api/
    README.md            from api/README.md
    components/          50 contracts
    types/               40 types
  behaviour/
    README.md            from behaviour/README.md
    *.json               21 patterns, flattened from behaviour/patterns/
  design/
    README.md            from tokens/src/TYPE-MAP.md, renamed
    *.json               11 DTCG sources, flattened from tokens/src/
    colors.css           hand-authored: aliases and color-mix derivations
  design-generated/
    palette.css typography.css spacing.css effects.css   from build:tokens
    fonts.css                                            from fetch-fonts
```

`api/`, `behaviour/` and `tokens/` disappear from the root. **`styles.css` stays at the
root** — it is the entry point `README.md` and `SKILL.md` tell a consumer to link, and only
its six `@import` lines change. `assets/`, `guidelines/`, `scripts/` and `frameworks/` do
not move.

### The three asymmetries, and why each one is right

`api/` keeps its `components/` and `types/` subdirectories; `behaviour/` and `design/`
flatten. The rule is that an inner directory earns its place when it separates two different
vocabularies — a component contract and a shared type are different things, and `check:api`
reads them as two sets. `patterns/` and `src/` separated their contents from nothing but
their own README, so flattening loses no information.

Only `design` has a `-generated` sibling, because only `design` generates anything outside
`frameworks/`. That is not a convention waiting to be applied to the other two; it is a fact
about what each level emits, and `contracts/README.md` states it so the next reader does not
propose `contracts/api-generated/` for a directory that would be empty.

`fonts.css` is generated output and goes to `design-generated/` with the other four, even
though `fetch-fonts.mjs` rather than Style Dictionary produces it. The criterion for the
split is generated-or-hand-authored, not which script does the generating.

### The rename

`tokens/src/TYPE-MAP.md` becomes `contracts/design/README.md`. That makes the three levels
the same shape — each one's normative document is its `README.md` — and it lets
`contracts/README.md` be a pure index with no exception to explain. The document's own H1,
`# Arena token type map (DTCG 2025.10)`, stays: a README whose title names what it is.

This is the **only** rename in the refactor. Everything else moves under its current name,
because several of those names are identifiers rather than file names: a pattern's stem is
the value a binding writes into `"pattern"`, and a token source's stem decides the name of
the CSS it emits. `CLAUDE.md`'s capital-initial naming rule is declared for the framework
layers and does not reach the neutral language, so nothing here is out of compliance with
it either way.

### `contracts/README.md`

Short, and an index rather than a restatement. It says what each level governs, names each
level's normative document, and states the generated-output asymmetry above. It does not
repeat any of the three normative documents' content — the point is that a new platform
target learns which of the three to read first.

## The mechanics

Thirty sites resolve one of these paths in a way a program follows. Counted, not estimated:

| Where | What |
|---|---|
| `scripts/` (19) | `check-api` (2), `build-api-types`, `check-script-tokens` (3), `check-dtcg`, `build-tokens` (2 — source and output), `fetch-fonts` (2), `check-fonts-generated`, `check-tokens-generated`, `check-ramp`, `check-text-contrast` (2), `check-material`, `check-tailwind`, `lib/behaviour-contracts.mjs` (`PATTERN_DIR`) |
| Test wrappers (2) | `frameworks/react/test/AssertPattern.jsx` and `frameworks/angular/test/Compliance.ts`, each building its own `PATTERN_DIR` by hop count from its own location |
| `overview.js` (3) | `fetch('tokens/src/…')` and `fetch('tokens/colors.css')` |
| `styles.css` (6) | the `@import` block |
| `fonts.css` (1) | `url('../assets/fonts/…')` |

Two of those have a sharper edge than the rest.

**`fonts.css` descends one level**, so its relative URL to the `.woff2` binaries in
`assets/fonts/` becomes `../../assets/fonts/`. That correction belongs in `fetch-fonts.mjs`,
not in the emitted file, and `check:fonts` verifies the emitted file matches.

**`PATTERN_DIR` is written three times** — in `scripts/lib/behaviour-contracts.mjs`, in the
React test wrapper and in the Angular one — because each counts hops from its own location.
All three move, or the compliance layer reads a directory that no longer exists.

## Zero guards

Moving a directory a gate resolves by path is the exact shape that has produced three false
greens in this repository already: `check:tailwind` iterating zero manifests after the
Tailwind layer went nested, `check:api` skipping the Angular half of every comparison after
the Angular layer moved, and this file's own verification command matching 3 test files out
of 33. Each time the surviving evidence was a plausible-looking green line of output.

**Which of them actually passes vacuously was measured, not assumed** — each directory was
moved aside and its gate run, on 2026-07-29:

| Probe | Result |
|---|---|
| `api/components/` absent | **exit 0** — `check-api: 0 contract(s) hold across 0 layer implementation(s)` |
| `api/types/` absent | exit 1, but from an uncaught `readdirSync` ENOENT: a stack trace, not a diagnosis |
| `behaviour/patterns/` empty | exit 1, a cascade of ~100 `unknown pattern "alert"` lines naming the wrong problem |
| `tokens/src/` empty | exit 1, `check-dtcg: no token files found in tokens/src` — the only one already guarded |

So exactly one false green exists today, and it is `check:api`'s contract directory:
`main()` wraps that one `readdirSync` in `existsSync(contractDir) ? … : []`, which is the
lookup-that-cannot-tell-absent-from-not-found shape this repository has already recorded
three times.

Every gate that enumerates a contract directory still gains an explicit zero failure, as an
exported pure function with its own suite — the shape `check:tailwind`, `check:radius` and
`check:structure` already carry — but the value is different per gate and the plan should
say which it is buying:

- `check:api` — zero contracts (**closes a real false green**), or zero types (replaces an
  ENOENT stack trace with a named problem)
- `check:behaviour` — zero patterns (replaces a hundred-line cascade with one line)
- `check:dtcg` — zero DTCG sources (already guarded inline; the change is to make it an
  exported function with a suite, so the guard cannot be dropped silently)
- `check:tokens` and `check:script-tokens` — zero generated CSS. Both already fail loudly:
  the first reports each file missing, the second reports every script-readable token as
  absent from any CSS. The guard names the directory instead.

**And the plan compares counts, rather than reading green.** The baseline, measured
2026-07-29 by running each gate:

```
check-api:              50 contract(s) hold across 70 layer implementation(s)
check-behaviour:        21 pattern(s); 50 react + 20 angular + 30 delegated declaration(s)
check-dtcg:             11 file(s) valid DTCG 2025.10
check-tokens-generated:  4 file(s) in sync
check-script-tokens:    21 script-readable token(s) across 2 layer(s); CatSlot matches the 8-slot ramp
```

One gap in that baseline is itself a finding: **`check:api` prints its contract count and
its implementation count but never its type count**, so a before/after comparison cannot see
the 40 types at all. The gate prints the type count too, or its zero guard is the only thing
standing between a vanished `types/` directory and a green run.

## The citation sweep

Roughly 478 occurrences of the three strings outside `CHANGELOG.md`, measured 2026-07-29
with

```bash
for p in "api/" "behaviour/" "tokens/"; do
  git ls-files | grep -v '^CHANGELOG.md$' | xargs grep -o "$p" 2>/dev/null | wc -l
done
```

Re-derive it rather than trusting the figure: it over-reports, since `bun.lock` carries
package names and a bare `api/` matches text that is not a path. It is a size estimate for
the sweep, not a target. They divide three ways.

**Rewritten** — every normative citation in the present tense, the path a reader would follow
today. The concentrations are `CLAUDE.md` (47), `README.md` (27),
`frameworks/tailwind/Theme.css` (13), `components-divergences.md`, `api/README.md`, and the
headers throughout `scripts/`.

**Left alone** — `CHANGELOG.md`, which is a frozen record served from the release tag, and
every past-tense clause describing where something *was*. Rewriting those would make the
record lie. `check-duplicate-constants.mjs`'s "which was
`frameworks/angular/primitives/chart-internals.ts` when this happened" is the correct form
of such a clause and the model for leaving them.

**Recorded as debt** — two of the specs under `docs/superpowers/specs/`. Measured rather
than assumed: of the five specs on disk, three cite one of these paths at all.
`2026-07-23-8-api-contracts-design.md` (36 hits) and
`2026-07-18-9-four-package-build-publish-design.md` (8) keep their pre-move paths, and
`CLAUDE.md`'s *Known debt* gains a line saying so. This is the same treatment the repository
already gives the first of those for the pre-move `frameworks/` paths it carries, and for the
same reason: separating a spec's historical uses of a path from its normative ones is a
reading of its argument, not a find-and-replace, and it belongs to whoever plans the work it
describes. The four-package spec is the sharper case of the two — it is *about* where files
live, so its paths are load-bearing to its argument rather than incidental to it, and its own
header already warns that its paths are stale in the other direction (the pre-refactor
`frameworks/tailwind/` layout).

The third, `2026-07-29-calendar-chip-box-and-header-gap-pending-1.md`, is rewritten rather
than deferred: its single hit is one clause of one sentence — "not in `styles.css`, not in
`tokens/`" — a plain present-tense claim about the tree with no historical reading to
preserve.

Three rewrites are arguments rather than paths, and no find-and-replace touches them:

1. **`scripts/lib/behaviour-contracts.mjs`'s header** argues that patterns live in
   `behaviour/` at the root "rather than under `tokens/` because a contract is not a value."
   That argument is spent — both now live under `contracts/`. What survives is its other
   half, and it is the better half: `design` answers *what is this value*, `behaviour`
   answers *what must this component do*.
2. **`README.md`'s copy-in kit instruction** tells a consumer to copy `tokens/`. It becomes
   `contracts/design/`, `contracts/design-generated/` and `styles.css` — a breaking change
   for anyone who has already adopted Arena, which the README must **say**, not merely
   reflect in a changed path.
3. **`SKILL.md`** lists `tokens/` among the directories to explore.

And one citation names the renamed file rather than its path:
`frameworks/react/components/charts/doughnut-chart/DoughnutChart.jsx:21` reads "see
TYPE-MAP's note on Avatar's 0.4 and 0.28." A path sweep does not see it.

## Sequencing

Three batches, one per level, each green on its own: `git mv`, then the functional
repointing, then that level's zero guards, then that level's citation sweep, then
`bun run check`.

**Batch 1 — api.** The most contained: its only path readers are `check-api.mjs` and
`build-api-types.mjs`, and nothing outside `scripts/` resolves it. This batch creates
`contracts/` by moving the first level into it.

`contracts/README.md` is written in **batch 3**, not here. A document describing three
levels, written when one exists, would be prose asserting a tree that is not on disk — the
exact shape of stale claim this repository's *Known debt* is mostly made of. It is written
once, when the structure it describes is complete.

**Batch 2 — behaviour.** Flattens `patterns/`, and above all moves all three `PATTERN_DIR`
declarations. This is the batch where a false green is easiest to produce: a wrapper left
behind reads a directory that no longer exists, and what a reader would see is a test run
that got smaller.

**Batch 3 — design.** The widest: `styles.css`, `overview.js`, `fonts.css` and its relative
URL, `frameworks/tailwind/Theme.css`, the copy-in kit, `SKILL.md`, and the `README.md`
rename. It closes by rewriting `CLAUDE.md`'s prose about the token layer and adding the
*Known debt* line about the two specs.

Design goes last because it touches the most surface, and because by then the other two
levels have already proved the move's mechanics.

## What this refactor does not do

Stated so it cannot creep in: it does not rename any file except `TYPE-MAP.md`; it does not
change the content of any contract; it does not move `frameworks/`; it does not add a
twenty-third gate asserting the shape of `contracts/`; and it does not change what
`build:tokens` emits or how many files it emits. This is a refactor of location.

Two things it deliberately leaves open. **No gate asserts that `contracts/` has the shape
this spec describes** — a stray file in `contracts/`, or a level missing its `README.md`,
passes everything. A `check:contracts` would close that, and it was judged out of scope for
a batch whose subject is moving files. And **the naming rule still does not reach
`contracts/`**: `button.json`, `palette.dark.json` and `menu-item.json` keep lowercase stems
that the framework layers' rule would capitalise. That is correct today, since those stems
are identifiers, but nothing writes the exemption down anywhere a reader would meet it.

## Verification

Per batch: `bun run check`, and the count printed by every gate that batch touched compared
against the baseline above — not merely read as green. Plus, at the close of batch 3:

- `bun run demos` and load `Arena - Overview.html`, which fetches its own sources at runtime
  and is the only consumer that would fail silently rather than loudly if a path is wrong.
- `bun run build:tokens` and `bun run check:tokens`, to prove the generated output lands in
  `contracts/design-generated/` and matches.
- A path-existence sweep over `git ls-files`: extract every `contracts/…`, `api/…`,
  `behaviour/…` and `tokens/…` token from the tracked tree and report the ones the
  filesystem denies, keeping the deliberate past-tense history the sweep will also surface.
