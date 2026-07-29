# Frameworks File Structure — Batch 3: React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the React layer from `frameworks/react/components/<category>/<Name>.*` to `frameworks/react/components/<category>/<kebab>/`, colocate all 59 suites with the components they cover, rename the layer-root and vendor files to capital-initial, switch the DOM/DOM-free test split from a directory boundary to the `.dom.test.jsx` filename infix, and delete `MIGRATED` from `check:structure` because every layer is then migrated.

**Architecture:** The batch opens with a gate fix rather than a move, because the move itself silently disarms `check:compliance`'s layer discrimination and nothing fails to say so. After that the shape is batch 1's: one commit that is nothing but `git mv` (0 insertions, 0 deletions), one commit that repoints everything the move broke, then the topology, the gates, the regenerated output and the prose.

**Tech Stack:** Bun (build + test + transpile), plain node (portability of every gate), `node:test`/`node:assert` for the gate suites, headless Chromium for `check:cards`.

## Global Constraints

- **Directories are `kebab-case`, lowercase. A file name begins with a capital, and a multi-word stem is `PascalCase` with hyphens removed.** Secondary dotted segments stay `lowerCamelCase`: `Tooltip.timer.dom.test.jsx`, `SideNav.structure.test.jsx`, `Skeleton.card.entry.jsx`.
- **Five naming exceptions**, each a name the rule cannot reach because it begins with a lowercase letter or has no stem: `index.ts`, `index.html`, `tsconfig.check.json` / `tsconfig.test.json`, `.gitkeep`, and the four adopter-facing files under `frameworks/angular/theme/`. **Only one of them lives in this batch's layer: `frameworks/react/ui-kits/console/index.html`**, which is served as a directory index. A conventional all-caps document name — `README.md` — already begins with a capital and needs no dispensation.
- **A file for test purposes carries `.test.<ext>`. Test *support* must not** — `bun test` collects by that infix and would try to run a harness as a suite. `Harness.jsx`, `Preload.js` and `AssertPattern.jsx` are support and are identified by living in `frameworks/react/test/`, not by their names.
- **English only** — code, comments, docs and commit messages.
- **A commit message containing a backtick is written with a quoted here-doc**, never `git commit -m "…"`. A backtick inside a double-quoted shell string opens command substitution and is silently spliced away. Use `git commit -q -F - <<'MSG' … MSG` and verify with `git log -1 --format=%B`.
- **Every move and rename uses `git mv`.**
- **A move commit carries no content change.** Every repoint lands in the commit after. `bun run check` is red between them, and that is expected: the full sweep is a completion gate, not a per-commit toll.
- **Nothing about behaviour, API contracts, accessibility or tokens changes.** No component gains or loses a member, a binding, an exception or a test. Any suite green before a task is green after it — a task that changes what a suite proves has gone wrong.
- **The three baselines below must be identical at the close of this batch.** They are the only evidence that colocating 59 suites did not silently drop one, and a narrowed `bun test` invocation matching fewer files is indistinguishable from one matching all of them.

  | Command | Baseline, measured at this plan's HEAD (`3967f5d`) |
  | --- | --- |
  | `bun run test:react` | **334 pass, 0 fail, across 44 files** |
  | `bun run test:react-dom` | **107 pass, 0 fail, across 15 files** |
  | `bun test scripts` | **642 pass, 0 fail, across 35 files** |

  The `scripts` figure will move in Tasks 1 and 5, which add tests on purpose; record the new number when it does and carry it forward. The two React figures must not move at all.
- **A gate that grows or moves an exception list grows its suite too.** `scripts/check-dimension-literals.mjs`'s `EXEMPT` and `scripts/check-manifest-states.mjs`'s `SOURCE_OVERRIDES` are both asserted by name in their own suites.
- **`CHANGELOG.md` is never back-edited.**

## The inbound-reference query, run before the move

Batch 1's plan missed inbound references twice and both were found by implementers rather than by the plan. The spec's lesson: *a layer's inbound references are not discoverable by reading that layer, and the query that finds them has to run before the move.* So it has been run, at this plan's HEAD.

| Referrer | What it names | Task that fixes it |
| --- | --- | --- |
| `scripts/check-dimension-literals.mjs` + `.test.mjs` | 8 `EXEMPT` keys, 2 header paths | 5 |
| `scripts/check-manifest-states.mjs` + `.test.mjs` | 8 `SOURCE_OVERRIDES` paths, 1 pinned path | 5 |
| `scripts/check-api.mjs` | `reactPath()`'s `REACT_GROUPS` probe | 5 |
| `scripts/check-behaviour.mjs` | `reactBindingPath()`'s `REACT_GROUPS` probe | 5 |
| `scripts/check-compliance.mjs` | `SUITE_DIRS`, the React branch of `collectBindings()`, every `COVERED` value | 1, 4, 5 |
| `scripts/lib/behaviour-contracts.mjs` | `reactComponents()` | 5 |
| `scripts/build-demos.mjs` + `check-demos-generated.mjs` | `ROOTS` | 3 |
| `scripts/build-vendor.mjs` + `check-vendor-generated.mjs` | the three `vendor/*.js` output names | 3 |
| `scripts/build-api-types.mjs` + `.test.mjs` | `frameworks/react/api.generated.d.ts` | 3 |
| `scripts/build-tokens.mjs`, `check-script-tokens.test.mjs` | `frameworks/react/tokens.generated.js` | 3 |
| `scripts/serve.mjs` | `ui_kits/console/index.html` in a comment | 3 |
| `scripts/check-duplicate-constants.mjs` | `components/charts/chart-internals.js` in its header | 5 |
| `scripts/check-all.mjs` + `check-all.test.mjs` | `testStep()`'s two literal arg arrays | 4 |
| `scripts/check-card-viewports.test.mjs` | 4 pinned `*.card.html` paths | 3 |
| `scripts/behaviour-contracts.test.mjs` | one `Dialog.behaviour.json` path, the `length === 50` pin | 5 |
| `package.json` | four test scripts | 4 |
| `CLAUDE.md`, `README.md`, `SKILL.md`, `components-divergences.md` | prose | 7 |
| `frameworks/react/components/display/Table.prompt.md`, `feedback/Toast.prompt.md` | `ui_kits/console/` in prose | 7 |
| `CHANGELOG.md` | 5 hits | **none — frozen, never back-edited** |

**Two of the spec's own claims about this batch's touched set are wrong, and both were checked rather than trusted.** It lists `check-text-contrast.mjs` and `validate-palette.mjs` as files this batch touches *"(both read demo pages under `ui_kits/`)"*. Neither names `ui_kits`, `frameworks/` or any demo page: `validate-palette.mjs` takes a palette on the command line and `check-text-contrast.mjs` reads `tokens/colors.css`. Verify with `grep -n "ui_kits\|frameworks/" scripts/check-text-contrast.mjs scripts/validate-palette.mjs`, which returns nothing, and leave both files alone. And it lists `check-script-tokens.mjs`, which needs no edit either: its import matcher is case-insensitive on the stem (`/tokens\.generated(?:\.js|\.ts)?/gi`) and it skips a directory entry with the same case-insensitive test, so `Tokens.generated.js` is already tolerated — only its *suite* pins the old path. Both are recorded here so the implementer does not go looking for an edit that is not there, and does not make one that is not needed.

- [ ] Re-run this before Task 2 and compare. A referrer that appeared since is one this plan does not cover, and it must be raised before the move rather than discovered after.

```bash
grep -rn "frameworks/react\|ui_kits\|test-dom" \
  --include='*.mjs' --include='*.ts' --include='*.js' --include='*.jsx' \
  --include='*.json' --include='*.md' --include='*.html' --include='*.css' \
  scripts/ frameworks/ api/ behaviour/ *.md package.json \
  | grep -v '^frameworks/react/' | grep -v CHANGELOG.md \
  | sed 's/:.*//' | sort | uniq -c | sort -rn
```

## File structure this batch produces

```
frameworks/react/
    Api.generated.d.ts   Tokens.generated.js
    UseContainerWidth.js  UseDialogModal.js  DataVisuals.js
    vendor/React.js  ReactDomClient.js  ReactJsxRuntime.js
    ui-kits/console/index.html  Shell.jsx/.js  LoginScreen.jsx/.js  …
    components/
        brand/app-logo/
            AppLogo.jsx  AppLogo.js  AppLogo.d.ts
            AppLogo.behaviour.json  AppLogo.prompt.md
            AppLogo.test.jsx
            AppLogo.card.html  AppLogo.card.entry.jsx/.js
        charts/
            Charts.card.html  Charts.card.entry.jsx/.js
            bar-chart/  chart-card/  doughnut-chart/  line-chart/
        display/
            Display.card.html  TableAvatar.card.html  (+ their entries)
            TagAndChipCases.dom.test.jsx
            calendar/       Calendar.* + CalendarInternals.js + Calendar.card.html
            calendar-event/ CalendarEvent.*
            table/          Table.* ; table-row/ ; table-cell/
            activity-feed/  avatar/  badge/  card/  skeleton/  stat-card/
            tag/  unauth-card/
        feedback/
            Feedback.card.html  EmptyErrorState.card.html  (+ entries)
            AlertTones.dom.test.jsx  Behavioural.dom.test.jsx  DialogModal.dom.test.jsx
            alert/  confirm-dialog/  dialog/  empty-state/  error-state/
            onboarding/  progress-bar/  spinner/  toast/  tooltip/
        forms/
            Forms.card.html  RadioTextarea.card.html  (+ entries)
            FormControlEvents.dom.test.jsx
            button/  checkbox/  icon-button/  input/  radio/  radio-group/
            select/  switch/  textarea/
        navigation/
            Navigation.card.html  MenuPagination.card.html  (+ entries)
            breadcrumbs/  bulk-action-bar/  command-palette/  menu/  page-head/
            pagination/     Pagination.* + PaginationWindow.js + PaginationWindow.test.jsx
            segmented-control/  side-nav/  side-nav-collapsible/  side-nav-item/
            side-nav-section/  tab/  tabs/
    test/
        Harness.jsx  Preload.js  AssertPattern.jsx
        Smoke.dom.test.jsx  PlacementAndBranches.dom.test.jsx
        AssertPatternCases.dom.test.jsx  UseDialogModal.dom.test.jsx
```

`frameworks/react/test-dom/` ceases to exist. `frameworks/react/test/` survives because that is where support belongs, **not** because it is the DOM directory — the DOM split is carried by the `.dom.test.jsx` infix now, wherever the file sits.

**Every compound family member gets its own directory**, because `frameworks/Components.json` names all fifty and `check:structure` asserts one directory per declared name: `tab/` beside `tabs/`, `radio/` beside `radio-group/`, `table-row/` and `table-cell/` beside `table/`, `calendar-event/` beside `calendar/`, and the three `side-nav-*` directories beside `side-nav/`. The spec's *"a compound family counts as its parent"* refinement governs where a shared **helper or suite** lands, never whether a member gets a directory.

---

### Task 1: Make `check:compliance`'s layer discrimination structural, before the move can disarm it

The spec's header calls this out as the one thing in this batch that is not a preference, and both `check-compliance.mjs` (beside `COVERED`) and `check-compliance.test.mjs` carry notes written for this task to find. It lands **first**, on the pre-move tree, so the guard exists before the tree can defeat it.

**The defect it prevents.** `validateCoverage` decides that a suite belongs to the layer a `COVERED` key names by searching the suite's *text* for that layer's binding path tail — `display/tag/Tag.behaviour.json` for Angular, `display/Tag.behaviour.json` for React. That discriminates only because React's tail carries no kebab directory. Task 2 gives it one, both tails become the byte-identical string `display/tag/Tag.behaviour.json`, and `'Tag:angular'` is then satisfied by React's own suite — the exact defect commit `663b2e4` closed.

**Which remedy, and why the other one is not available.** The spec offers two. *Prefix each layer's root onto its own tail before comparing* does not work as stated: a suite never spells its layer root in its source. `frameworks/react/test-dom/tag-and-chip-cases.test.jsx:89` writes `join(REACT_COMPONENTS, 'display/Tag.behaviour.json')` and `frameworks/angular/components/display/tag/Tag.cases.test.ts:36` writes `join(ANGULAR_COMPONENTS, 'display/tag/Tag.behaviour.json')` — both roots are derived constants, so a root-prefixed tail would match no suite at all and **every** coverage claim would fail. Adopting it would mean editing all fifteen suites to spell an absolute path, which is a code-style change dressed as a gate fix. So this task takes the second: **a suite reports its own directory.** Which layer's tree a suite file was found in is a fact about the filesystem, known at collection time, and it cannot be made to collide by any later layout change.

**Files:**
- Modify: `scripts/check-compliance.mjs` (`SUITE_DIRS`, `collectSuites`, `validateCoverage`, `COVERED`'s header note)
- Test: `scripts/check-compliance.test.mjs`

**Interfaces:**
- Produces: `SUITE_DIRS` as `{layer: string, dir: string}[]`; `collectSuites(dirs?) → Record<string, {source: string, layer: string}>`; `validateCoverage({bindings, covered, suites})` where `suites` values are that record shape. `walkSuites(dir) → string[]` is unchanged.
- Consumes: nothing from later tasks. Tasks 4 and 5 rewrite `SUITE_DIRS`'s entries and `COVERED`'s values on top of this shape.

- [ ] **Step 1: Write the failing test — a colliding tail must not satisfy the sibling layer**

Add to `scripts/check-compliance.test.mjs`. It fabricates the collision Task 2 creates for real, so the guard is proved before the tree can produce it:

```js
/* THE POST-BATCH-3 COLLISION, fabricated. Once the React layer is
 * components/<category>/<kebab>/<Component>.behaviour.json, a component bound in
 * both layers has BYTE-IDENTICAL tails, and a text search can no longer tell the
 * two apart however it is written. The layer a suite belongs to is therefore
 * decided by which tree the file was found in -- a filesystem fact, fixed at
 * collection time -- and never by what its text spells.
 *
 * DELETION-SIMULATED: removing the `suite.layer !== layer` check from
 * validateCoverage makes this test fail with "Expected values to be strictly
 * equal: 0 !== 1" -- React's suite is accepted for the Angular claim again. */
test('a suite from the wrong layer cannot satisfy a claim when the tails collide', () => {
  const bindings = [
    { name: 'Tag', patterns: ['none'], layer: 'react', tail: 'display/tag/Tag.behaviour.json' },
    { name: 'Tag', patterns: ['none'], layer: 'angular', tail: 'display/tag/Tag.behaviour.json' },
  ];
  const suites = {
    'TagAndChipCases.dom.test.jsx': {
      source: "join(R, 'display/tag/Tag.behaviour.json')", layer: 'react',
    },
  };
  // The react claim is satisfied by the react suite.
  assert.deepEqual(validateCoverage({
    bindings, covered: { 'Tag:react': 'TagAndChipCases.dom.test.jsx' }, suites,
  }), []);
  // The angular claim is NOT, even though the suite names a byte-identical tail.
  const problems = validateCoverage({
    bindings, covered: { 'Tag:angular': 'TagAndChipCases.dom.test.jsx' }, suites,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /react layer/);
});

/* collectSuites carries the layer through from SUITE_DIRS rather than deriving it
 * from a path, so there is exactly one place a suite's layer is decided. */
test('collectSuites tags each suite with the layer of the directory it came from', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-suite-layer-'));
  const a = join(root, 'a'); const b = join(root, 'b');
  mkdirSync(a); mkdirSync(b);
  writeFileSync(join(a, 'One.test.jsx'), 'x');
  writeFileSync(join(b, 'Two.test.ts'), 'y');
  const out = collectSuites([{ layer: 'react', dir: a }, { layer: 'angular', dir: b }]);
  assert.equal(out['One.test.jsx'].layer, 'react');
  assert.equal(out['Two.test.ts'].layer, 'angular');
  assert.equal(out['One.test.jsx'].source, 'x');
  rmSync(root, { recursive: true, force: true });
});
```

The existing tests at lines 16, 25, 36, 63, 119, 125, 132, 141 and 152 pass `suites` as `{name: 'source string'}`. Convert each to `{name: {source: '…', layer: 'react'}}` — or `'angular'` for the `Alert.roleTones.test.ts` fixture at line 132 — in this same step. The `collectSuites throws on a basename collision` test at line 265 passes bare directory strings; convert it to the `{layer, dir}` shape too.

- [ ] **Step 2: Run the tests and watch them fail**

Run: `bun test scripts/check-compliance.test.mjs`
Expected: FAIL. The new collision test fails on `problems.length` being `0`; the converted existing tests fail because `suiteMentions` is being handed an object where it expects a string.

- [ ] **Step 3: Change `SUITE_DIRS` to carry the layer**

In `scripts/check-compliance.mjs`:

```js
/** The suite trees this gate reads, each tagged with the layer it belongs to.
 *  The tag is the whole layer discrimination: a coverage claim names a layer,
 *  and which tree a suite file was found in is the one fact about it that no
 *  later layout change can make collide. See validateCoverage below. */
export const SUITE_DIRS = [
  { layer: 'react', dir: join(repoRoot, 'frameworks', 'react', 'test-dom') },
  { layer: 'angular', dir: join(repoRoot, 'frameworks', 'angular', 'components') },
  { layer: 'angular', dir: join(repoRoot, 'frameworks', 'angular', 'test') },
];
```

- [ ] **Step 4: Change `collectSuites` to tag what it collects**

```js
export function collectSuites(dirs = SUITE_DIRS) {
  const out = {};
  const seen = new Map();
  for (const { layer, dir } of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of walkSuites(dir)) {
      const name = basename(f);
      if (seen.has(name))
        throw new Error(
          `check:compliance — two suites share the basename ${name}:\n  ${seen.get(name)}\n  ${f}\n` +
          `Suites are keyed by basename, so one would silently shadow the other.`);
      seen.set(name, f);
      out[name] = { source: readFileSync(f, 'utf8'), layer };
    }
  }
  return out;
}
```

`walkSuites` is untouched.

- [ ] **Step 5: Make `validateCoverage` check the layer before it checks the text**

Replace the tail block at the end of the `for (const [key, suiteFile] of Object.entries(covered))` loop:

```js
    const suite = suites[suiteFile];
    if (suite.layer !== layer) {
      problems.push(
        `COVERED maps "${key}" to "${suiteFile}", which is a suite of the ${suite.layer} layer. ` +
        `A ${layer} claim needs a ${layer} suite: the two layers can spell byte-identical ` +
        `binding paths, so naming the right file is not evidence of the right layer.`,
      );
      continue;
    }
    const tail = byKey.get(key);
    if (!suiteMentions(suite.source, tail)) {
      problems.push(
        `COVERED maps "${key}" to "${suiteFile}", but that suite never names ${tail}. The coverage claim is stale.`,
      );
    }
```

Note the message change on the tail branch: *"or the suite belongs to the other layer"* is no longer one of the possibilities, because the branch above it now catches that case by name.

- [ ] **Step 6: Rewrite the two long notes that describe the old mechanism**

`COVERED`'s header in `check-compliance.mjs` and the block comment above the layer-discrimination test in `check-compliance.test.mjs` both spend paragraphs explaining that the tail match is what discriminates, that the tails do not collide *today*, and that batch 3 will end that. All of it is now history. Rewrite both to say, in the present tense, what is true after this task: **the layer comes from the tree the suite was found in; the tail proves the suite reads the right binding and nothing more.** Keep the history in past tense — the bare-stem accident, the `'Alert:angular'` false positive, and why a root-prefixed tail was rejected — because that is the reasoning behind the shape, and the repo's own rule is that an explicitly past-tense claim is the one form that cannot go stale.

`suiteMentions`'s own doc comment also claims the tail is what keeps the other layer's copy out. Narrow it to what it now does.

- [ ] **Step 7: Run the tests and the gate**

Run: `bun test scripts/check-compliance.test.mjs && bun run check:compliance`
Expected: PASS both. `check:compliance` prints the same `N of M bindings verified` line as before — this task changes how a claim is checked, never which claims are made.

- [ ] **Step 8: Prove the guard fires against the real tree**

```bash
sed -i "s/'Alert:angular': 'Alert.roleTones.test.ts'/'Alert:angular': 'alert-tones.test.jsx'/" scripts/check-compliance.mjs
bun run check:compliance; echo "exit=$?"
git checkout scripts/check-compliance.mjs
```

Expected: exit 1, with a problem naming `Alert:angular` and the **react** layer. Then confirm the restore with `git diff --stat scripts/check-compliance.mjs` showing nothing.

- [ ] **Step 9: Full sweep and commit**

Run: `CHROME_PATH=/usr/bin/chromium bun run check`
Expected: 22 gates, all pass, no SKIP. Record the new `bun test scripts` count — this task adds two tests.

```bash
git add scripts/check-compliance.mjs scripts/check-compliance.test.mjs
git commit -q -F - <<'MSG'
fix: decide a suite's layer by where it lives, not by what it spells

check:compliance told the two layers' suites apart by searching a suite's text
for that layer's binding path tail. That worked only because React's tail
carried no kebab directory and Angular's did -- a property of the current two
layouts, due to expire the moment the structure refactor's batch 3 gives React
the same shape. Both tails then read display/tag/Tag.behaviour.json and the
discrimination reverts to the pre-fix defect with nothing failing to say so.

SUITE_DIRS now carries a layer per tree, collectSuites tags each suite with it,
and validateCoverage checks the layer before it checks the text. Which tree a
file was found in is a filesystem fact no layout change can make collide.

The spec's other candidate -- prefixing each layer's root onto its own tail --
is not available: a suite never spells its layer root, both roots being derived
constants, so a root-prefixed tail would match no suite and every claim would
fail. Adopting it meant editing fifteen suites to spell absolute paths.

Landed ahead of the move so the guard exists before the tree can defeat it, with
the collision fabricated in a fixture rather than waited for.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 2: Move and rename every file in the React layer

Pure `git mv`. Nothing's content changes, so `git show --stat` is reviewable as a rename list and `git show --numstat` must report 0 insertions and 0 deletions. Every gate and every test invocation goes red here and comes back in Tasks 3–5.

**Files:**
- Move: all 309 files under `frameworks/react/components/` into per-component directories or their category level
- Move: all 44 suites in `frameworks/react/test/` into component directories; all 18 files in `frameworks/react/test-dom/` into component directories or `frameworks/react/test/`
- Rename: `api.generated.d.ts`, `tokens.generated.js`, `use-container-width.js`, `use-dialog-modal.js`, the three `vendor/*.js`, `ui_kits/` → `ui-kits/`
- Move + repoint, in a **second commit**: `frameworks/angular/components/charts/ChartInternals.ts` → `frameworks/angular/DataVisuals.ts` and its suite, with `frameworks/angular/index.ts`, `components/charts/index.ts`, `scripts/check-dimension-literals.mjs` + `.test.mjs`, `scripts/check-duplicate-constants.mjs`

**Interfaces:**
- Produces: the tree drawn under *File structure this batch produces* above. Task 3 repoints every specifier into it; Task 4 changes how `bun test` selects within it; Task 5 teaches the gates to resolve it.

- [ ] **Step 1: Record the baseline this whole batch is measured against**

```bash
mkdir -p /tmp/arena-batch3
bun run test:react 2>&1 | tail -3 | tee /tmp/arena-batch3/react-baseline.txt
bun run test:react-dom 2>&1 | tail -3 | tee -a /tmp/arena-batch3/react-baseline.txt
(cd frameworks/react && find . -type f | xargs sha256sum | sed 's|  \./|  |' | sort) > /tmp/arena-batch3/before.txt
wc -l < /tmp/arena-batch3/before.txt
```

Expected: `334 pass / 44 files` and `107 pass / 15 files`, matching the Global Constraints table, and 390 files. If either count differs from the table, stop — the baseline in this plan is wrong and everything measured against it would be too.

- [ ] **Step 2: Re-run the inbound-reference query**

Run the query under *The inbound-reference query* above and compare against its table. Report any referrer not in it before moving anything.

- [ ] **Step 3: Move the component quartets and their compiled siblings**

Driven by `frameworks/Components.json` and `kebab()`, so the mapping is a function and never a table. The five filenames are listed exactly rather than globbed by prefix — `Table.*` would otherwise swallow `TableRow.*` and `TableCell.*`.

```bash
bun -e '
const { execFileSync } = require("child_process");
const { existsSync, mkdirSync } = require("fs");
const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const cats = require("./frameworks/Components.json");
let moved = 0;
for (const [cat, names] of Object.entries(cats)) {
  for (const name of names) {
    const dir = `frameworks/react/components/${cat}/${kebab(name)}`;
    mkdirSync(dir, { recursive: true });
    for (const ext of ["jsx", "js", "d.ts", "behaviour.json", "prompt.md"]) {
      const from = `frameworks/react/components/${cat}/${name}.${ext}`;
      if (!existsSync(from)) { console.log("MISSING", from); continue; }
      execFileSync("git", ["mv", from, `${dir}/${name}.${ext}`]);
      moved++;
    }
  }
}
console.log("moved", moved, "files");'
```

Expected: `moved 250 files` and **no `MISSING` line**. 50 components × 5 files. A `MISSING` line means a component's quartet is incomplete, which is a finding to report rather than to work around.

- [ ] **Step 4: Move the shared helpers to the narrowest level that holds their consumers**

Confirm each helper's consumers before moving it — the rule is the narrowest level containing all consumers, not this table:

```bash
for h in chart-internals calendar-internals pagination-window side-nav-inject; do
  printf "%-20s " "$h"
  grep -rl "$h" frameworks/react/components/*/*/ 2>/dev/null | xargs -n1 dirname | xargs -n1 basename | sort -u | tr '\n' ' '; echo
done
```

Expected: `calendar-internals` → calendar, calendar-event (a family, so it lands on the parent); `pagination-window` → pagination alone; `side-nav-inject` → the four `side-nav-*` (a family, so the parent).

**`chart-internals` is the fourth and it does NOT stop at the charts category — the spec's own measured table was wrong about it.** `Calendar.jsx:3` imports `catColor` from it, so a `display` component consumes it and the rule *"consumed across categories → the layer root"* applies. Verify before moving, because this is the correction rather than the plan's original claim:

```bash
grep -rn "chart-internals" frameworks/react/components --include='*.jsx' | grep -v /charts/
```

Expected: two hits, `Calendar.jsx` and its compiled `Calendar.js`. It rises to the layer root, and it is **renamed `DataVisuals`**, because a module a schedule grid consumes is not "chart internals": it bundles the data-colour contract (`catColor`, `toneColor`, `resolveColors`, `CAT_SLOTS` — the half Calendar uses), the chart geometry (`niceMax`, `ticks`, `barPath`, `arcPath`, `PAD`, `CHART_HEIGHT`), and the visually-hidden idiom.

**The rename is applied to the Angular layer in the same task, and that is a deliberate widening of this batch's scope.** Angular's `components/charts/ChartInternals.ts` has consumers in one category today and would stop at that category by the rule — but only because Angular has no `Calendar`, and it has none only because the component is delegated to Material. A future plan removes that delegation, at which point Angular acquires the same cross-category consumer React already has. Moving both now costs one task; discovering it again later costs another batch. The two layers keep one name for one contract.

```bash
cd frameworks/react/components
git mv charts/chart-internals.js ../DataVisuals.js
git mv display/calendar-internals.js display/calendar/CalendarInternals.js
git mv navigation/pagination-window.js navigation/pagination/PaginationWindow.js
git mv navigation/side-nav-inject.jsx navigation/side-nav/SideNavInject.jsx
git mv navigation/side-nav-inject.js  navigation/side-nav/SideNavInject.js
cd ../../..
```

`SideNavInject.jsx` keeps its `.jsx` extension for the reason its own history records: `check:dimensions` scans `.jsx`/`.ts`/`.tsx` and deliberately never opens a `.js`, and `indentFor()` produces a governed `padding-inline-start`. Under `.js` it would sit outside the gate entirely.

Then the Angular half of the same rename, which is a move **and** a repoint, because that layer compiles and its suites must stay green inside this task:

```bash
cd frameworks/angular
git mv components/charts/ChartInternals.ts DataVisuals.ts
git mv components/charts/ChartInternals.test.ts DataVisuals.test.ts   # rises with its subject
cd ../..
```

Then, on the Angular side only: rewrite every specifier naming it, drop its `export * from './ChartInternals'` from `components/charts/index.ts`, add `export * from './DataVisuals'` to `frameworks/angular/index.ts` beside `ContainerSize`/`FocusTrap`/`ProjectionMarkers` — **it was on the public surface through the charts barrel and must stay on it**, which is a capability change this batch is not allowed to make — and rekey `check-dimension-literals.mjs`'s three `EXEMPT` entries plus the assertions naming them in `check-dimension-literals.test.mjs`. `check-duplicate-constants.mjs`'s header names the old path in a history clause; give it the same *"which was … when this happened"* form its Angular half already uses.

Close with `bun run check:angular && bun run test:angular` **green**, and `bun run check:dimensions` **red with every remaining problem naming a `frameworks/react/…` path** — that gate cannot go green until Task 5, because the React move in this same task strands its eight React `EXEMPT` keys. Check it differentially rather than by exit code: the failure list must contain zero `DataVisuals` or `ChartInternals` hits. Report the Angular pass and file counts, and **compare `find frameworks/angular -name '*.test.ts' | wc -l` against `find build/angular-test -name '*.test.js' | wc -l`** — moving a suite to the layer root is exactly the move `tsconfig.test.json`'s `include` does not reach, and a suite that stops being emitted takes its tests out of the run without failing anything.

**This is the one place Task 2 touches a file outside `frameworks/react/`, and the one place it is not a pure move** — so it is a second commit, after the pure-move commit, never folded into it.

- [ ] **Step 5: Move the demo pages**

Which components a page covers was derived by reading each `*.card.entry.jsx`'s imports, never its filename. **A component imported only to drive the demo — a `Button` that opens a dialog, a `Card` that frames a specimen, an `Input` inside an auth panel — is scaffolding, not a subject.** That reading is what makes nine of the eighteen single-subject pages; it is the same reading the spec applied, and it is recorded here so the implementer does not have to re-derive it from an import list that looks wider than the page is.

| Today (`components/…`) | Subjects, from its entry's imports | Target |
| --- | --- | --- |
| `brand/brand.card.*` | AppLogo | `brand/app-logo/AppLogo.card.*` |
| `charts/charts.card.*` | BarChart, ChartCard, DoughnutChart, LineChart | `charts/Charts.card.*` |
| `display/activity-feed.card.*` | ActivityFeed (Card scaffolds) | `display/activity-feed/ActivityFeed.card.*` |
| `display/calendar.card.*` | Calendar, CalendarEvent (Button scaffolds) | `display/calendar/Calendar.card.*` |
| `display/display.card.*` | Badge, Card, StatCard, Tag | `display/Display.card.*` |
| `display/skeleton.card.*` | Skeleton (Card scaffolds) | `display/skeleton/Skeleton.card.*` |
| `display/table-avatar.card.*` | Avatar, Badge, Table, TableRow, TableCell | `display/TableAvatar.card.*` |
| `display/unauth-card.card.*` | UnauthCard (AppLogo, Button, Input scaffold) | `display/unauth-card/UnauthCard.card.*` |
| `feedback/alert.card.*` | Alert | `feedback/alert/Alert.card.*` |
| `feedback/confirm-dialog.card.*` | ConfirmDialog (Button scaffolds) | `feedback/confirm-dialog/ConfirmDialog.card.*` |
| `feedback/empty-error-state.card.*` | EmptyState, ErrorState | `feedback/EmptyErrorState.card.*` |
| `feedback/feedback.card.*` | Dialog, ProgressBar, Spinner, Toast, Tooltip | `feedback/Feedback.card.*` |
| `feedback/onboarding.card.*` | Onboarding (Button scaffolds) | `feedback/onboarding/Onboarding.card.*` |
| `forms/forms.card.*` | Button, Checkbox, IconButton, Input, Select, Switch | `forms/Forms.card.*` |
| `forms/radio-textarea.card.*` | RadioGroup, Radio, Textarea | `forms/RadioTextarea.card.*` |
| `navigation/command-palette.card.*` | CommandPalette (Button scaffolds) | `navigation/command-palette/CommandPalette.card.*` |
| `navigation/menu-pagination.card.*` | Menu, Pagination | `navigation/MenuPagination.card.*` |
| `navigation/navigation.card.*` | Breadcrumbs, BulkActionBar, PageHead, SegmentedControl, the four SideNav\*, Tab, Tabs | `navigation/Navigation.card.*` |

`.card.*` means all three of `.card.html`, `.card.entry.jsx` and `.card.entry.js`. Move each with `git mv`; the nine that stay at their category level are renamed in place to the capital-initial stem.

- [ ] **Step 6: Move the DOM-free suites into their components**

Forty-four files. All but six cover exactly one component and go into its directory as `<Component>.test.jsx`. The six that need a reading, derived from imports:

| Today | Imports | Target |
| --- | --- | --- |
| `test/calendar.test.jsx` | Calendar, CalendarEvent | `display/calendar/Calendar.test.jsx` (family → parent) |
| `test/table.test.jsx` | Table, TableRow, TableCell, Badge | `display/table/Table.test.jsx` (family → parent; the `Badge` at line 8 is cell **content** in one fixture, not a subject) |
| `test/radio.test.jsx` | RadioGroup, Radio | `forms/radio-group/RadioGroup.test.jsx` (family → parent) |
| `test/tabs.test.jsx` | Tab, Tabs | `navigation/tabs/Tabs.test.jsx` (family → parent) |
| `test/side-nav.test.jsx` | SideNav, SideNavItem, SideNavInject | `navigation/side-nav/SideNav.test.jsx` |
| `test/side-nav-structure.test.jsx` | the four SideNav\* | `navigation/side-nav/SideNav.structure.test.jsx` |
| `test/pagination-window.test.jsx` | PaginationWindow | `navigation/pagination/PaginationWindow.test.jsx` |

`test/tab.test.jsx` imports `Tab` alone and goes to `navigation/tab/Tab.test.jsx` — `Tab` is a declared component with its own directory, and a suite covering it alone does not rise to the family parent.

The other thirty-seven are mechanical: `<kebab>.test.jsx` → `<category>/<kebab>/<Pascal>.test.jsx`, with the category taken from `frameworks/Components.json`.

- [ ] **Step 7: Move the DOM suites and the support**

Eighteen files. Support rises to `test/`; a suite lands at the narrowest level containing every component it covers, with the `.dom.test.jsx` infix.

| Today (`test-dom/…`) | Target |
| --- | --- |
| `harness.jsx` | `test/Harness.jsx` |
| `preload.js` | `test/Preload.js` |
| `assert-pattern.jsx` | `test/AssertPattern.jsx` |
| `smoke.test.jsx` | `test/Smoke.dom.test.jsx` |
| `assert-pattern-cases.test.jsx` | `test/AssertPatternCases.dom.test.jsx` |
| `use-dialog-modal.test.jsx` | `test/UseDialogModal.dom.test.jsx` |
| `placement-and-branches.test.jsx` | `test/PlacementAndBranches.dom.test.jsx` |
| `alert-tones.test.jsx` | `components/feedback/AlertTones.dom.test.jsx` |
| `behavioural.test.jsx` | `components/feedback/Behavioural.dom.test.jsx` |
| `dialog-modal.test.jsx` | `components/feedback/DialogModal.dom.test.jsx` |
| `form-control-events.test.jsx` | `components/forms/FormControlEvents.dom.test.jsx` |
| `tag-and-chip-cases.test.jsx` | `components/display/TagAndChipCases.dom.test.jsx` |
| `menu.test.jsx` | `components/navigation/menu/Menu.dom.test.jsx` |
| `tabs.test.jsx` | `components/navigation/tabs/Tabs.dom.test.jsx` |
| `side-nav-disclosure.test.jsx` | `components/navigation/side-nav/SideNav.disclosure.dom.test.jsx` |
| `onboarding-modal.test.jsx` | `components/feedback/onboarding/Onboarding.dom.test.jsx` |
| `tooltip-keyboard.test.jsx` | `components/feedback/tooltip/Tooltip.keyboard.dom.test.jsx` |
| `tooltip-timer.test.jsx` | `components/feedback/tooltip/Tooltip.timer.dom.test.jsx` |

`placement-and-branches.test.jsx` is the one that crosses categories — CalendarEvent and Skeleton in `display`, Menu in `navigation` — so it rises to `test/`. `use-dialog-modal.test.jsx` covers a layer-root hook, so it rises for the same reason. `alert-tones` (Alert + Toast) and `behavioural` / `dialog-modal` (Dialog + ConfirmDialog) cover unrelated components of one category and stop at the category. `tabs` and `side-nav-disclosure` cover a compound family and land on the parent.

Then `rmdir frameworks/react/test-dom` — it must be empty.

- [ ] **Step 8: Rename the layer-root files, the vendor bundles and `ui_kits/`**

```bash
cd frameworks/react
git mv api.generated.d.ts Api.generated.d.ts
git mv tokens.generated.js Tokens.generated.js
git mv use-container-width.js UseContainerWidth.js
git mv use-dialog-modal.js UseDialogModal.js
git mv vendor/react.js vendor/React.js
git mv vendor/react-dom-client.js vendor/ReactDomClient.js
git mv vendor/react-jsx-runtime.js vendor/ReactJsxRuntime.js
git mv ui_kits ui-kits
cd ../..
```

`ui-kits/console/index.html` keeps its lowercase name — it is one of the five exceptions, because a directory served over HTTP is answered by that literal name.

- [ ] **Step 9: Verify the move was lossless, complete and content-free**

```bash
(cd frameworks/react && find . -type f | xargs sha256sum | sed 's|  \./|  |' | sort \
  | awk '{print $1}' | sort) > /tmp/arena-batch3/after-hashes.txt
awk '{print $1}' /tmp/arena-batch3/before.txt | sort > /tmp/arena-batch3/before-hashes.txt
diff /tmp/arena-batch3/before-hashes.txt /tmp/arena-batch3/after-hashes.txt && echo "CONTENT IDENTICAL"
find frameworks/react/components -mindepth 2 -maxdepth 2 -type d | wc -l
ls frameworks/react/test/
find frameworks/react -type f | wc -l
git status --short | grep -cv '^R'
```

Expected: `CONTENT IDENTICAL`; `50` component directories; `test/` holding exactly the seven files from Step 7's first block; `390` files; and `0` non-rename entries in `git status`.

- [ ] **Step 10: Confirm the failure is the expected one**

Run: `bun run test:react 2>&1 | tail -5`
Expected: FAIL, with unresolved module specifiers — every relative import is now one level short. If it fails for another reason, stop and investigate.

- [ ] **Step 11: Commit**

```bash
git add -A frameworks/react
git commit -q -F - <<'MSG'
refactor: move the React layer to components/<category>/<component>/

Every component's five files descend into a kebab directory derived from its
PascalCase name by the same function check:structure uses. The four shared
helpers rise or descend to the narrowest level that holds all their consumers:
ChartInternals to the charts category (three charts are not a family),
CalendarInternals and SideNavInject to their family's parent, PaginationWindow
to its one consumer. Nine demo pages cover a single component and descend into
it; nine cover several and stop at the category, renamed capital-initial.

All 59 suites move to the component they cover, DOM ones carrying the new
.dom.test.jsx infix. test-dom/ ceases to exist; test/ keeps the three support
modules and the four suites that span categories.

The layer-root files, the three vendor bundles and ui_kits/ take the naming rule
that reaches all of frameworks/. ui-kits/console/index.html stays lowercase: a
directory served over HTTP is answered by that literal name.

Pure git mv. Every file's sha256 survives, and git status reports no entry that
is not a rename, so this commit is reviewable as a rename list.

The React test invocations are red at this commit -- every relative specifier is
one level short. Repointing them is the next commit, kept separate on purpose.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 3: Repoint everything the move broke

Every relative specifier, every demo page's `../` depth, every importmap, and the four generators whose output paths are string constants.

**Files:**
- Modify: every `.jsx`/`.js`/`.d.ts` under `frameworks/react/components/` and `frameworks/react/test/`; all 18 `*.card.html`; `frameworks/react/ui-kits/console/index.html` and its `.jsx`/`.js`
- Modify: `scripts/build-demos.mjs` (`ROOTS`), `scripts/build-vendor.mjs` (`OUTPUTS`' `out` names), `scripts/check-vendor-generated.mjs`, `scripts/build-api-types.mjs`, `scripts/build-tokens.mjs`
- Test: `scripts/build-api-types.test.mjs`, `scripts/check-script-tokens.test.mjs`, `scripts/check-card-viewports.test.mjs`

**Interfaces:**
- Consumes: the tree Task 2 produced.
- Produces: a tree in which `bun run test:react-dom` passes when pointed at the moved files. `ROOTS` becomes `['frameworks/react/components', 'frameworks/react/ui-kits/console']`; `build-vendor.mjs`'s three `out` values become `React.js`, `ReactJsxRuntime.js`, `ReactDomClient.js`.

- [ ] **Step 1: Rewrite the component and suite specifiers**

Four shapes changed, and each has one rule:

1. **A sibling in the same category** — `'./Button.jsx'` or `'../forms/Button.jsx'` → `'../../forms/button/Button.jsx'` from inside a component directory. Every cross-component import now goes up two levels and down two.
2. **A layer-root module** — `'../../use-container-width.js'` → `'../../../UseContainerWidth.js'`; likewise `UseDialogModal.js`, `Tokens.generated.js`, `Api.generated.d.ts`.
3. **A relocated helper** — `'./chart-internals.js'` → `'../../../DataVisuals.js'` from inside `charts/bar-chart/`, and `'../charts/chart-internals.js'` → `'../../../DataVisuals.js'` from inside `display/calendar/`, which is the import that moved the module in the first place; `'./calendar-internals.js'` → `'./CalendarInternals.js'` from inside `display/calendar/` and `'../calendar/CalendarInternals.js'` from `display/calendar-event/`; `'./pagination-window.js'` → `'./PaginationWindow.js'`; `'./side-nav-inject.jsx'` → `'./SideNavInject.jsx'` from `side-nav/` and `'../side-nav/SideNavInject.jsx'` from the three sibling directories.
4. **A suite reaching its subject** — a colocated suite imports `'./Tag.jsx'`; a category-level DOM suite imports `'./alert/Alert.jsx'`; a `test/` suite imports `'../components/navigation/menu/Menu.jsx'` and the support with `'./Harness.jsx'` / `'./AssertPattern.jsx'`.

Do this by letting the runtime find them rather than by substitution — a blind rewrite over 300 files cannot distinguish a specifier from prose in a `.prompt.md`:

```bash
bun run test:react 2>&1 | grep -oP "(?<=Cannot find module ')[^']+" | sort -u
```

Fix, re-run, repeat until the list is empty. Then the same for `bun test --preload ./frameworks/react/test/Preload.js '.dom.test.jsx'`. **An unresolved specifier is a hard failure in both**, so an empty list is real evidence rather than an absence of noise.

- [ ] **Step 2: Fix `AssertPattern.jsx`'s two derived path constants**

`REACT_COMPONENTS` is `join(here, '..', 'components')` and `REPO` is `join(here, '..', '..', '..')`. `here` has not changed depth — `test-dom/` and `test/` are both one level under the layer root — so **both are still correct**. Confirm that by reading the file rather than assuming it; the header says a wrong import depth has already cost this chain one review cycle.

What **does** change is every suite's binding path argument: `join(REACT_COMPONENTS, 'display/Tag.behaviour.json')` → `join(REACT_COMPONENTS, 'display/tag/Tag.behaviour.json')`. Find them all:

```bash
grep -rn "behaviour.json'" frameworks/react/ --include='*.jsx'
```

- [ ] **Step 3: Fix the demo pages' relative depth**

Every `*.card.html` references `../../../../styles.css`, `../../../../frameworks/react/vendor/*.js` and `../../../../assets/…` by `../` count from the repo root. The nine that descended one level gain one `../`; the nine that stayed keep their count. The vendor filenames in every importmap also change to the capital-initial names. The `<script type="module" src="…">` is same-directory relative and moves with the page, but its `.js` basename changes for the nine that were renamed.

```bash
for f in $(find frameworks/react/components -name '*.card.html'); do
  depth=$(echo "${f#frameworks/react/components/}" | tr -cd '/' | wc -c)
  printf "%-70s needs %d hops to root\n" "$f" $((depth + 4))
done
```

A page at `components/<cat>/` needs 4; one at `components/<cat>/<kebab>/` needs 5. Also update `frameworks/react/ui-kits/console/index.html`, whose depth did **not** change (`ui_kits` → `ui-kits` is a rename at the same level) but whose importmap names three renamed vendor files.

- [ ] **Step 4: Repoint the four generators and their suites**

- `scripts/build-demos.mjs`: `ROOTS` → `['frameworks/react/components', 'frameworks/react/ui-kits/console']`. Its header and the `rewriteRelativeJsxImports` doc comment both name `use-container-width.js`, `chart-internals.js` and `calendar-internals.js` as examples of a plain `.js` helper; update those names. `check-demos-generated.mjs` imports `ROOTS` and needs no edit beyond its own header prose.
- `scripts/build-vendor.mjs`: the three `out` values in the entry table, plus every mention of the old names in its header. `check-vendor-generated.mjs` reads the same names — check whether it imports them or restates them, and make it import if it restates.
- `scripts/build-api-types.mjs`: `'frameworks/react/api.generated.d.ts'` → `'frameworks/react/Api.generated.d.ts'`, and the same string in `build-api-types.test.mjs:89`.
- `scripts/build-tokens.mjs`: `'frameworks/react/tokens.generated.js'` → `'frameworks/react/Tokens.generated.js'`, and the same string in `check-script-tokens.test.mjs:54,84`.
- `scripts/check-card-viewports.test.mjs`: the four pinned page paths at lines 375, 387, 467 and 489 — `charts.card.html` → `charts/Charts.card.html`, `brand.card.html` → `brand/app-logo/AppLogo.card.html`, `feedback.card.html` → `feedback/Feedback.card.html`.
- `scripts/serve.mjs`: the trailing-slash redirect comment at lines 60–61 uses `ui_kits/console/index.html` as its worked example. The behaviour it describes is unchanged; only the directory's name is. No code in that file names the path.

`scripts/check-script-tokens.mjs` needs **no** edit — see the note under *The inbound-reference query*. Its suite does.

- [ ] **Step 5: Rebuild the generated output and verify it is only the path that moved**

```bash
bun run build:demos && bun run build:vendor && bun run build:api && bun run build:tokens
git status --short frameworks/react | head -20
git diff --stat frameworks/react
```

Expected: no *content* diff beyond the banner line of any file whose banner names its own path. Read every diff before accepting it. If `build:demos` emits a `.js` whose body differs from the committed sibling by more than an import specifier, stop — the transpile is supposed to be deterministic.

- [ ] **Step 6: Run the two React suites**

```bash
bun test frameworks/react --path-ignore-patterns='**/*.dom.test.jsx' 2>&1 | tail -3
bun test --preload ./frameworks/react/test/Preload.js '.dom.test.jsx' 2>&1 | tail -3
```

Expected: **334 pass across 44 files** and **107 pass across 15 files**, matching Task 2's baseline exactly. A lower file count means a suite stopped being collected; a lower pass count with the same file count means a suite lost tests. Neither is acceptable and neither shows up as a failure.

- [ ] **Step 7: Commit**

```bash
git add -A frameworks/react scripts
git commit -q -F - <<'MSG'
fix: repoint everything the React move broke

Every relative specifier, every demo page's ../ hop count to the repo root,
every importmap's vendor filenames, and the four generators whose output paths
are string constants -- plus the three suites that pin one of those paths by
literal value.

The specifiers were fixed by running the suites and resolving what the runtime
could not find, not by substitution: a blind rewrite over three hundred files
cannot tell a specifier from the same string in a .prompt.md.

AssertPattern.jsx's two derived path constants are unchanged and were checked
rather than assumed -- test-dom/ and test/ sit at the same depth. What did
change is every suite's binding argument, which now carries the kebab directory.

Both React suites report the same pass and file counts as before the move, which
is what proves no suite quietly stopped being collected.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 4: Switch the test topology from a directory boundary to a filename infix

The DOM / DOM-free split is the only thing keeping `@happy-dom/global-registrator` — which installs globals process-wide — out of the suites that prove server-side rendering, and out of `scripts/`, whose `static-server.test.mjs` fetch assertions fail cross-origin once happy-dom replaces Bun's `fetch`. Task 2 removed the directory that carried that split. This task restores it on the filename.

**Two facts were measured against real `bun test` runs before the spec was written, not assumed:** several positional patterns are combined with **OR**, not AND, so the DOM selection must be a single pattern; and `--path-ignore-patterns` accepts the glob `**/*.dom.test.jsx`.

**Files:**
- Modify: `package.json` (four scripts), `scripts/check-all.mjs` (`testStep()` and its header), `scripts/check-compliance.mjs` (`SUITE_DIRS`)
- Test: `scripts/check-all.test.mjs`

**Interfaces:**
- Consumes: Task 1's `{layer, dir}` shape for `SUITE_DIRS`.
- Produces: two `bun test` invocations, still two processes. What changes is the criterion, not the count, and the reason the two cannot merge is untouched.

- [ ] **Step 1: Write the failing assertion first**

`scripts/check-all.test.mjs:44-45` pins `testStep()`'s two arg arrays by literal value. Change them to what this task will produce, and watch the test fail against the current script:

```js
  assert.deepEqual(args, [
    ['test', 'scripts', 'frameworks/react', 'build/angular-test/angular',
     '--path-ignore-patterns=**/*.dom.test.jsx'],
    ['test', '--preload', './frameworks/react/test/Preload.js', '.dom.test.jsx'],
  ]);
```

Run: `bun test scripts/check-all.test.mjs`
Expected: FAIL, showing the old arrays.

- [ ] **Step 2: Update `testStep()`**

In `scripts/check-all.mjs`, the two entries become:

```js
    { name: 'test (bun test scripts/ + framework suites)',
      args: ['test', 'scripts', 'frameworks/react', 'build/angular-test/angular',
             '--path-ignore-patterns=**/*.dom.test.jsx'] },
    { name: 'test (React DOM suites, isolated)',
      args: ['test', '--preload', './frameworks/react/test/Preload.js', '.dom.test.jsx'] },
```

- [ ] **Step 3: Rewrite the header comment that explains the split**

`check-all.mjs`'s header spends lines 82–116 explaining that the split is by directory, that `frameworks/react/test/` carries a trailing slash *"for a second, unrelated reason"* — because bun treats a positional as a path prefix and the bare string would also match `frameworks/react/test-dom/` — and that the merge cannot add `scripts/` and `frameworks/react/test/` to the DOM invocation. The trailing-slash paragraph describes a hazard that no longer exists: `test-dom/` is gone and the positional is now the whole layer.

Rewrite it to state the criterion that is now live: the DOM suites are selected by the `.dom.test.jsx` infix wherever they sit, the DOM-free run excludes that same glob, and **the reason the two invocations cannot merge is unchanged** — a happy-dom installed process-wide for the whole invocation replaces Bun's own `fetch` and turns a passing `scripts/lib/static-server.test.mjs` assertion into a cross-origin failure. Keep the trailing-slash story in past tense; it is why the shape is what it is.

- [ ] **Step 4: Update `package.json`'s four scripts**

```json
    "test:react": "bun test frameworks/react --path-ignore-patterns='**/*.dom.test.jsx'",
    "test:react-dom": "bun test --preload ./frameworks/react/test/Preload.js '.dom.test.jsx'",
    "test:angular": "bun run build:angular-tests && bun test build/angular-test/angular",
    "test": "bun run build:angular-tests && bun test scripts frameworks/react build/angular-test/angular --path-ignore-patterns='**/*.dom.test.jsx' && bun test --preload ./frameworks/react/test/Preload.js '.dom.test.jsx'"
```

`test:scripts` is unchanged.

- [ ] **Step 5: Point `SUITE_DIRS` at the React component tree**

In `scripts/check-compliance.mjs`, the React entry becomes the components tree — the DOM suites live inside it now:

```js
export const SUITE_DIRS = [
  { layer: 'react', dir: join(repoRoot, 'frameworks', 'react', 'components') },
  { layer: 'react', dir: join(repoRoot, 'frameworks', 'react', 'test') },
  { layer: 'angular', dir: join(repoRoot, 'frameworks', 'angular', 'components') },
  { layer: 'angular', dir: join(repoRoot, 'frameworks', 'angular', 'test') },
];
```

**One consequence to record in that constant's comment rather than discover later:** the React tree now holds the 44 DOM-free suites as well, so they become collectable and a `COVERED` claim could in principle be satisfied by one. None of them names a binding path today — `frameworks/react/test/pagination.test.jsx` and `calendar.test.jsx` mention a binding in prose only, verified by reading both — so nothing changes, but a DOM-free suite cannot verify a rendered DOM and a future claim pointing at one would be false. Say so where the next reader will meet it.

- [ ] **Step 6: Verify each invocation matches the file count it should**

```bash
bun run test:react     2>&1 | tail -3
bun run test:react-dom 2>&1 | tail -3
bun run test:scripts   2>&1 | tail -3
bun run test           2>&1 | grep -E "Ran [0-9]+ tests"
```

Expected: `334 / 44 files`, `107 / 15 files`, the `scripts` count carried forward from Task 1, and the merged run reporting the sum across two lines. **Check the file counts, not just the colour** — the whole hazard here is that a narrowed invocation matching fewer files is indistinguishable from one matching all of them.

Then prove the exclusion is real rather than incidental:

```bash
bun test frameworks/react --path-ignore-patterns='**/*.dom.test.jsx' 2>&1 | grep -c "dom.test.jsx"
```

Expected: `0`. A DOM suite leaking into the DOM-free run would not fail — it would silently change what those suites prove.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts
git commit -q -F - <<'MSG'
test: carry the DOM split on the filename, now that the directory is gone

The DOM / DOM-free split was a directory boundary, and colocating the suites
removed the directory. It is the .dom.test.jsx infix now: the DOM-free run
excludes that glob, the DOM run selects it as a single positional, because bun
combines several positionals with OR rather than AND.

Still two processes. What changes is the criterion, not the count, and the
reason they cannot merge is untouched -- a happy-dom installed process-wide
replaces Bun's fetch and turns a passing static-server assertion cross-origin.

check-all.mjs's header explained the old boundary at length, including a
trailing slash that existed only to keep a positional from matching test-dom/.
That hazard is gone with the directory; the paragraph is past tense now.

SUITE_DIRS' React entry is the component tree, which also makes the 44 DOM-free
suites collectable. None names a binding path today -- two mention one in prose,
checked by reading both -- and the constant now says why a claim must never
point at one.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 5: Teach the gates the new shape, and delete `MIGRATED`

**Files:**
- Modify: `scripts/lib/behaviour-contracts.mjs` (`reactComponents`, plus a new `reactBindingPath`), `scripts/check-behaviour.mjs`, `scripts/check-api.mjs`, `scripts/check-compliance.mjs` (`collectBindings`, `COVERED`), `scripts/check-dimension-literals.mjs` (`EXEMPT`), `scripts/check-manifest-states.mjs` (`SOURCE_OVERRIDES`), `scripts/check-duplicate-constants.mjs` (header), `scripts/check-structure.mjs` (delete `MIGRATED`)
- Test: `scripts/behaviour-contracts.test.mjs`, `scripts/check-api.test.mjs`, `scripts/check-compliance.test.mjs`, `scripts/check-dimension-literals.test.mjs`, `scripts/check-manifest-states.test.mjs`, `scripts/check-structure.test.mjs`

**Interfaces:**
- Produces: `reactComponents(root) → string[]` of PascalCase names, sorted, keyed on **directories** rather than on capital-initial `.jsx` filenames. `reactBindingPath(root, dir) → {path, stem, tail} | null`, mirroring `angularBindingPath` exactly. `resolveReactImplementations(tree, exists)` as an exported pure function with the same two guards `resolveAngularImplementations` carries.
- Consumes: `pascal()` and `kebab()` from `check-structure.mjs`, which `behaviour-contracts.mjs` already imports.

- [ ] **Step 1: Rewrite `reactComponents()` and watch its suite prove it found the same fifty**

The current walk keys on *"a `.jsx` whose filename starts with a capital"*, with a documented carve-out for `.card.entry.` and for kebab-case helpers. This design breaks that heuristic — `SideNavInject.jsx` is now capital-initial — so it keys on what Angular already keys on: **a component is a directory.**

```js
export function reactComponents(root) {
  const base = join(root, 'frameworks/react/components');
  const out = [];
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(base, category.name), { withFileTypes: true })) {
      if (dir.isDirectory()) out.push(pascal(dir.name));
    }
  }
  return out.sort();
}
```

Rewrite its doc comment completely. The old one explains the capital-initial rule and names `side-nav-inject.jsx` as the file that forced the kebab carve-out; that whole argument is retired, and a comment describing the old tree is the cross-file-claim failure this repo documents at length. What replaces it: a component is a directory, a loose file beside the directories is a helper or a demo page, and `pascal()` is the same derivation `check:structure`'s `kebab()` inverts.

`scripts/behaviour-contracts.test.mjs:164-175` is the suite that proves the rewrite found the same fifty. **The number does not move** — no component is added or removed — so `assert.equal(found.length, 50)` stands unchanged and is the whole point of that assertion here. Its trailing comment at lines 174+ justifies the kebab carve-out by naming `side-nav-inject`; replace it with what the walk now relies on. Line 238's `'./frameworks/react/components/feedback/Dialog.behaviour.json'` becomes `.../feedback/dialog/Dialog.behaviour.json`.

- [ ] **Step 2: Add `reactBindingPath`, mirroring `angularBindingPath`**

Both `check-behaviour.mjs` and `check-compliance.mjs` currently probe a hardcoded `REACT_GROUPS` list for `<component>.behaviour.json`. Replace both with one function beside its Angular twin in `scripts/lib/behaviour-contracts.mjs`:

```js
/** The behaviour binding a React component directory holds, as
 *  `{path, stem, tail}` -- the ONE place the React layer's binding path is
 *  built, and the exact mirror of angularBindingPath above.
 *
 *  The category is found by looking rather than derived: a component's category
 *  is frameworks/Components.json's to declare and check:structure's to hold, and
 *  a second gate carrying it would be a second opinion nothing reconciles.
 *  `tail` is `<category>/<dir>/<stem>.behaviour.json`, relative to
 *  frameworks/react/components -- what a suite writes when it names its own
 *  binding. It is byte-identical in shape to Angular's, which is why
 *  check:compliance stopped discriminating by tail text (see SUITE_DIRS there).
 *  @param {string} root @param {string} dir kebab directory name
 *  @returns {{path: string, stem: string, tail: string} | null} */
export function reactBindingPath(root, dir) {
  const base = join(root, 'frameworks/react/components');
  const stem = pascal(dir);
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const tail = `${category.name}/${dir}/${stem}.behaviour.json`;
    const path = join(base, tail);
    if (existsSync(path)) return { path, stem, tail };
  }
  return null;
}
```

Then in `check-behaviour.mjs` delete `REACT_GROUPS` and the local `reactBindingPath`, and import this one. In `check-compliance.mjs`'s `collectBindings()`, replace the React branch's `groups.find(...)` with it:

```js
  for (const name of reactComponents(repoRoot)) {
    const found = reactBindingPath(repoRoot, kebab(name));
    if (!found) continue; // check:behaviour owns "every component declares"; this gate does not duplicate it.
    const binding = loadBinding(found.path);
    byKey[`${name}:react`] = { ...binding, tail: found.tail };
  }
```

- [ ] **Step 3: Convert `check-api.mjs`'s React probe to a walk, with both guards**

The file's own comment at `reactPath()` says: *"BATCH 3 OF THE STRUCTURE REFACTOR MUST CONVERT THIS to the walk `resolveAngularImplementations()` below uses. It is the same existsSync-probe-returning-null shape that made the Angular half of this gate pass silently over twenty unread implementations."* Do exactly that.

Write `resolveReactImplementations(tree, exists)` beside its Angular twin, as an **exported pure function** taking the layer tree as `category -> kebab directory names` and a path predicate — the same shape, so the two read alike:

```js
/** Which React components this gate can read, and what it must complain about,
 *  from the layer tree as `category -> kebab directory names` and a predicate
 *  saying whether a repo-relative path exists. The exact mirror of
 *  resolveAngularImplementations below, and pure for the same reason: both rules
 *  are guards against a SILENT failure, so a guard with no suite behind it would
 *  survive its own deletion.
 *
 *  It replaces an existsSync probe over a hardcoded group list that returned
 *  null on a miss -- the same shape that made the Angular half of this gate
 *  print "50 contract(s) hold across 50 layer implementation(s)" while twenty
 *  real implementations went unread. React's failure mode was loud rather than
 *  silent only because React holds the majority of the contracts, so a broken
 *  lookup skipped nearly all of them at once; that is a property of today's
 *  contract distribution and never a property of the probe.
 *  @param {Record<string,string[]>} tree @param {(p: string) => boolean} exists
 *  @returns {{implementations: Map<string,string>, problems: string[]}} */
export function resolveReactImplementations(tree, exists) {
  const implementations = new Map();
  const problems = [];
  for (const [category, dirs] of Object.entries(tree))
    for (const dir of dirs) {
      const name = pascal(dir);
      const path = `frameworks/react/components/${category}/${dir}/${name}.d.ts`;
      if (exists(path)) { implementations.set(name, path); continue; }
      problems.push(
        `frameworks/react/components/${category}/${dir}/: is a component directory with no ${name}.d.ts — `
        + 'this gate cannot read a surface it cannot find, and skipping it would report a clean pass over an unchecked layer');
    }
  if (implementations.size === 0)
    problems.push('found 0 React component implementations — an empty result set is a failure, not a clean pass; check the discovery path');
  return { implementations, problems };
}
```

Wire it to the real tree with a `reactImplementations()` that adds only `readLayer('react')`, an `existsSync` against the repo root, and the absolute-path resolution — exactly as `angularImplementations()` does — and have `main()` consume the map instead of calling `reactPath()` per contract. Both guards need a suite in `scripts/check-api.test.mjs`; copy the shape of the two that cover the Angular pair. Delete `REACT_GROUPS` and `reactPath()`; the comment's history belongs in the new function's header, in past tense, and is written above.

**One consequence worth stating before it surprises someone:** the per-component guard fires for every declared component directory with no `.d.ts`, and this gate's coverage is partial by design. Run `bun run check:api` immediately after wiring it and read what it prints — if it now reports problems for components that simply have no contract, the map must be built from `api/components/` and the tree together rather than from the tree alone. Resolve that by reading `main()`, not by weakening the guard.

Then verify the count the gate prints:

```bash
bun run check:api
```

Expected: the same contract and layer-implementation counts as before this batch (`70` layer implementations at this plan's HEAD). **A number that dropped means the walk is finding fewer than the probe did** — which is the exact false-green shape this conversion exists to prevent, arriving from the other direction.

- [ ] **Step 4: Update `COVERED`'s twelve React values**

Task 2 renamed every DOM suite. The Angular three are unchanged:

```js
export const COVERED = {
  'Dialog:react': 'DialogModal.dom.test.jsx',
  'ConfirmDialog:react': 'DialogModal.dom.test.jsx',
  'Onboarding:react': 'Onboarding.dom.test.jsx',
  'Menu:react': 'PlacementAndBranches.dom.test.jsx',
  'Skeleton:react': 'PlacementAndBranches.dom.test.jsx',
  'SideNavCollapsible:react': 'SideNav.disclosure.dom.test.jsx',
  'Tabs:react': 'Tabs.dom.test.jsx',
  'Tooltip:react': 'Tooltip.keyboard.dom.test.jsx',
  'Alert:react': 'AlertTones.dom.test.jsx',
  'Toast:react': 'AlertTones.dom.test.jsx',
  'Tag:react': 'TagAndChipCases.dom.test.jsx',
  'CalendarEvent:react': 'TagAndChipCases.dom.test.jsx',
  'Alert:angular': 'Alert.roleTones.test.ts',
  'BarChart:angular': 'ChartDataTable.test.ts',
  'Tag:angular': 'Tag.cases.test.ts',
};
```

`check-compliance.test.mjs`'s fixtures at lines 60, 63, 119, 125, 141 and 152 spell React tails without a kebab segment (`feedback/Dialog.behaviour.json`); give them the real shape (`feedback/dialog/Dialog.behaviour.json`) so the fixtures describe the tree that exists.

- [ ] **Step 5: Rekey the two exception maps, and their suites in the same commit**

`scripts/check-dimension-literals.mjs`'s `EXEMPT` holds eight React keys. Each is `<path>:<prop>:<value>`; only the path changes:

| Old path | New path |
| --- | --- |
| `components/charts/BarChart.jsx` | `components/charts/bar-chart/BarChart.jsx` |
| `components/charts/LineChart.jsx` | `components/charts/line-chart/LineChart.jsx` |
| `components/display/Calendar.jsx` (×3) | `components/display/calendar/Calendar.jsx` |
| `components/display/CalendarEvent.jsx` | `components/display/calendar-event/CalendarEvent.jsx` |
| `components/display/skeleton.card.entry.jsx` (×2) | `components/display/skeleton/Skeleton.card.entry.jsx` |

Its header at line 27 names `frameworks/react/components/navigation/side-nav-inject.jsx` and at line 39 `frameworks/react/test/side-nav.test.jsx`; both become the new paths. Line 739's `ui_kits/console/Icon.jsx` is past-tense history about a deleted file — **read it before touching it**, and leave it alone if it is stated as history.

**One more clause in that file is already known false and is yours, not Task 2's.** Around line 80, inside a paragraph Task 2 rewrote for the Angular side, it still reads *"React's **sibling**, `chart-internals.js`'s own identically-shaped `PAD`, still escapes"*. React's copy is `frameworks/react/DataVisuals.js` at the layer root now, so both the filename and the word "sibling" are false — the two are no longer siblings in any directory. Task 2 deliberately left it rather than reach into Task 5's half of the same paragraph; do not read the paragraph's Angular half being current as evidence the React half is.

`scripts/check-manifest-states.mjs`'s `SOURCE_OVERRIDES` holds eight React paths across three entries — `Table` (Table + TableRow), `SideNav` (all four), `Tabs` (Tabs + Tab). Give each its kebab directory. Confirm `findComponentSource`'s default search already walks recursively rather than reading one directory per category; if it reads flat, make it walk, and give the walk the zero-result assertion the sibling gates carry.

`scripts/check-dimension-literals.test.mjs:361-440` and `scripts/check-manifest-states.test.mjs:79` assert on these maps by literal key. **A key changed without touching its suite leaves the tests describing a gate that no longer exists.** A stale exemption fails its own gate, so a missed key is loud — run each gate to watch it.

`PASSTHROUGH` is keyed by component **name**, not by path, so it does not move.

`scripts/check-duplicate-constants.mjs`'s header names `frameworks/react/components/charts/chart-internals.js` as one of the two files that carried the drifted constants. **Task 2 already gave the Angular half of that sentence its new path; this step does the React half only — read the line before editing it.** Its Angular half already models the right form — *"`frameworks/angular/components/charts/ChartInternals.ts` (which was `frameworks/angular/primitives/chart-internals.ts` when this happened)"* — so give the React half the same shape rather than a bare substitution: the sentence is a claim about where the drift happened, and rewriting it to today's path alone would make the record lie about the past.

- [ ] **Step 6: Delete `MIGRATED`**

`check-structure.mjs`'s header says `MIGRATED` *"grows by one entry per batch and is deleted outright when the last layer lands, at which point the gate covers every layer unconditionally."* This is that batch. Remove the constant, read all three layers, and pass `complete: true` unconditionally — which activates rule 3, *every declared component exists in at least one layer*. All fifty exist in React, so it passes; watch it do so rather than assuming.

`zeroLayerProblems` must now cover all three layers. `check-structure.test.mjs` pins `MIGRATED` by value; replace those assertions with ones about the unconditional shape, and keep a test proving rule 3 fires — it has never run against a real tree before.

Then prove the zero-directory guard covers the new layer:

```bash
mv frameworks/react/components /tmp/arena-batch3/react-components-aside
bun scripts/check-structure.mjs; echo "exit=$?"
mv /tmp/arena-batch3/react-components-aside frameworks/react/components
git status --short frameworks/react | head
```

Expected: exit 1, naming `react`; then `git status` showing nothing.

- [ ] **Step 7: Run every gate this task touched**

Run: `bun run check:behaviour && bun run check:compliance && bun run check:api && bun run check:dimensions && bun run check:states && bun run check:structure && bun test scripts`
Expected: all pass. `check:compliance` prints the same `N of M bindings verified` line as at HEAD; `check:api` the same contract and implementation counts.

- [ ] **Step 8: Commit**

```bash
git add -A scripts
git commit -q -F - <<'MSG'
feat: teach the gates the React layer's new shape

reactComponents() keyed on "a .jsx whose filename starts with a capital", a
heuristic this layout breaks -- SideNavInject.jsx is capital-initial now. It
keys on directories, which is what the Angular walk already did. Its suite still
pins fifty, and that unchanged number is what proves the rewrite found the same
components rather than a different set of the same size.

check-api.mjs's reactPath() was the last existsSync-probe-returning-null in the
repo, and its own comment named this batch as the one that owes it a walk. It is
a walk now, with the same two guards the Angular half carries -- a directory
whose source cannot be opened is a per-component problem, zero directories is a
whole-layer one -- each an exported pure function with a suite, because a guard
against a silent failure needs one or it survives its own deletion.

reactBindingPath joins angularBindingPath as the one place a layer's binding
path is built. Both gates that probed a hardcoded group list now call it.

COVERED's twelve React values follow the renamed suites; EXEMPT's eight keys and
SOURCE_OVERRIDES' eight paths follow the moved files, with their suites.

MIGRATED is deleted: every layer is migrated, so the gate covers all three
unconditionally and the "declared but present in no layer" rule is live for the
first time.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 6: Verify the demo pages by hand, and take the full sweep green

`check:cards` is **a weaker net under a miscounted path than it looks**, and this is the one task where that matters. It fails only on content over-running the declared box. A broken *script* path leaves `#root` empty and classifies as `unrendered`, which exits 2 — `check-all` reports SKIP and calls the run INCOMPLETE, not failed, unless `ARENA_CHECK_STRICT=1` or `CI=true`. A broken *stylesheet* path is not caught at all: the page still renders, so an unstyled specimen that fits its declared box passes outright. Eighteen pages had their `../` count changed in Task 3, nine of them by one hop.

**Files:**
- Create: `scripts/check-demo-pages.mjs` is **not** wanted — the headless probe below is a throwaway under `/tmp`, not a new gate. Adding a 23rd gate is outside this batch.
- Modify: whichever pages the check finds broken (expected: none)

**Interfaces:**
- Consumes: everything Tasks 1–5 built.

**The check has two halves and they are not interchangeable.** Steps 1–2 are programmatic and assert the three things a machine can decide: that the page's script resolved, that its stylesheet resolved, and that its icon font resolved. Steps 3–5 are the human pass — a rendering that is *present but wrong* is not machine-decidable, and neither is a grid's keyboard feel. Do the programmatic half first so the human pass starts from a page that is already known to load.

- [ ] **Step 1: Probe every page headlessly for the three resolvable failures**

Write a throwaway script under `/tmp` (never under `scripts/` — this is not a new gate) that starts the repo's own static server, loads each of the 18 `*.card.html` plus `ui-kits/console/index.html` in headless Chromium, and asserts per page:

- **the script resolved** — `document.getElementById('root').children.length > 0`. This is the `unrendered` case `check:cards` exits 2 on and `check-all` downgrades to SKIP.
- **the stylesheet resolved** — `getComputedStyle(document.body).backgroundColor` is the token's dark surface and **not** `rgba(0, 0, 0, 0)`, and `fontFamily` is not the browser default. This is the case **no gate catches at all**: the page renders, fits its declared box, and passes while being completely unstyled.
- **the icon font resolved** — for a page whose entry renders a Phosphor icon, `document.fonts.check('16px Phosphor')` is true, or every `[class^="ph-"]` element has a non-zero width.
- **nothing 404'd** — collect `response` events with `status >= 400` and fail the page if any is not a favicon.

Use `CHROME_PATH=/usr/bin/chromium`. Print one line per page — `PASS`/`FAIL` with which of the four assertions failed — and exit non-zero if any failed. Report the full 19-line table in the task report; a summary line is not evidence.

- [ ] **Step 2: Fix whatever the probe found, and re-run it to zero**

- [ ] **Step 3: Hand the human partner the visual pass**

The probe above cannot see a page that loads its stylesheet and still looks wrong — a specimen laid out at the wrong width, an icon drawing as a tofu box, a chart with no bars. List every URL below in the task report so the human pass has something to work from; this task's report is where that list lives, not a message that scrolls away.

**Step 4 below is the human's, not the implementer's. Report the URLs and stop there.**

- [ ] **Step 4 (human): Serve the tree and open every page that changed depth**

```bash
bun run demos
```

Then open each of the nine that descended, which are the nine at risk:

```
http://localhost:8000/frameworks/react/components/brand/app-logo/AppLogo.card.html
http://localhost:8000/frameworks/react/components/display/activity-feed/ActivityFeed.card.html
http://localhost:8000/frameworks/react/components/display/calendar/Calendar.card.html
http://localhost:8000/frameworks/react/components/display/skeleton/Skeleton.card.html
http://localhost:8000/frameworks/react/components/display/unauth-card/UnauthCard.card.html
http://localhost:8000/frameworks/react/components/feedback/alert/Alert.card.html
http://localhost:8000/frameworks/react/components/feedback/confirm-dialog/ConfirmDialog.card.html
http://localhost:8000/frameworks/react/components/feedback/onboarding/Onboarding.card.html
http://localhost:8000/frameworks/react/components/navigation/command-palette/CommandPalette.card.html
```

For each, confirm three things a gate cannot: the component **renders** (the script resolved), it is **styled** — dark surface, Arena type, no browser defaults (the stylesheet resolved), and its **icons** draw (Phosphor resolved from `node_modules/`). An unstyled page that renders is the failure mode nothing catches.

Also open `http://localhost:8000/frameworks/react/ui-kits/console/index.html` and walk login → dashboard → project; it carries no `@dsCard` on purpose and no gate renders it at all.

- [ ] **Step 2: Spot-check three that did not change depth**

`display/Display.card.html`, `forms/Forms.card.html`, `navigation/Navigation.card.html`. Their `../` counts are unchanged but their own filenames and their entry `.js` basenames changed, so the `<script src>` is a live risk.

- [ ] **Step 3: Hand-test the two grid components**

`Calendar` and `Table` bind the `grid` pattern, so they are DOM-tested by hand by standing rule — the rule is tied to the binding rather than to a judgement about what looks like a grid. Operate `Calendar.card.html`'s grid with the arrow keys, Home/End within a day column, and Enter/Escape into and out of an event chip; operate `TableAvatar.card.html`'s table. This batch changed no behaviour, so the standard is "identical to before", and the check exists because these two have no suite that could tell you otherwise.

- [ ] **Step 4: Full sweep, strict**

Run: `CHROME_PATH=/usr/bin/chromium ARENA_CHECK_STRICT=1 bun run check`
Expected: 22 gates, all pass, **no SKIP** — `ARENA_CHECK_STRICT=1` is what turns the `unrendered` exit-2 case into a failure rather than a skip, and this is the one batch where that distinction is load-bearing.

- [ ] **Step 5: Confirm the three baselines**

```bash
bun run test:react 2>&1 | tail -3
bun run test:react-dom 2>&1 | tail -3
bun test scripts 2>&1 | tail -3
```

Expected: `334 / 44 files`, `107 / 15 files`, and the `scripts` count carried forward from Task 5.

- [ ] **Step 6: Commit anything the by-hand check fixed**

If nothing needed fixing, say so in the task report and skip the commit — an empty commit is not evidence. Otherwise:

```bash
git add -A frameworks/react
git commit -q -F - <<'MSG'
fix: the demo pages the moved ../ count broke

check:cards renders each declaring page and fails only on content over-running
its declared box. A broken script path classifies as unrendered and exits 2,
which check-all reports as SKIP unless strict; a broken stylesheet path is not
caught at all, because the page still renders and still fits. Nine pages
descended a level in this batch, so all eighteen were opened by hand and checked
for rendering, styling and icons -- three things no gate here asserts.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 7: Rewrite the prose, and retire the spec

The spec names this as where the real risk lives: *"`CLAUDE.md` describes these paths in prose throughout … Rewriting that prose is part of the work, not an optional extra."* Batch 2 is the evidence — `check:structure` went green on Angular in the same commit that left `CLAUDE.md` printing a `bun test` command whose Angular path matched 3 files out of 33.

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `SKILL.md`, `components-divergences.md`, `frameworks/angular/README.md`, `frameworks/react/components/display/table/Table.prompt.md`, `frameworks/react/components/feedback/toast/Toast.prompt.md`
- Delete: `docs/superpowers/specs/2026-07-27-frameworks-file-structure-design-pending-1.md`

**Interfaces:**
- Consumes: everything Tasks 1–6 built.

- [ ] **Step 1: Find every claim about the moved paths**

```bash
grep -rn "test-dom\|ui_kits\|react/test/\|components/display/[A-Z]\|reactComponents\|MIGRATED" \
  --include='*.md' . | grep -v node_modules | grep -v CHANGELOG.md
```

`CHANGELOG.md` is excluded deliberately: it is a frozen record of what shipped at a tag.

- [ ] **Step 2: Rewrite, holding every sentence to the read-the-file standard**

`CLAUDE.md`'s *Known debt* carries an entry recording that cross-file prose claims in this repo have shipped false repeatedly, that one correction for it was itself false, and that the correction of *that* was false too. Its rule: **"I grepped it" is insufficient evidence for a claim about another file; only reading the file suffices.** Every sentence you write about a file, open that file.

The paragraphs that are wrong as of Task 6, at minimum:

- **The two-test-directories rule.** `frameworks/react/test-dom/` no longer exists. The reason the two `bun test` invocations cannot merge is unchanged and must survive the rewrite; what changes is that the criterion is the `.dom.test.jsx` infix rather than a directory. The preload paragraph's path becomes `./frameworks/react/test/Preload.js` and its reasoning is untouched.
- **The grid hand-test rule.** It is stated twice, under *Architecture* and under *Known debt*, both times as a rule about "the second directory". Restate it as what it now is — a rule about a component whose binding names `grid`, wherever its suite would have sat — and repoint `grid-keyboard.test.jsx`'s recovery command, which still names the deleted path.
- **The quartet convention**, which says a component means four files "and an entry in the group's `*.card.html` demo". The group-level page is now one of two shapes; say which.
- **`reactComponents()`'s heuristic**, described under *Architecture* as keying on capital-initial `.jsx` and carrying `side-nav-inject.jsx` as its worked example. Both are retired.
- **The `SideNavInject.jsx` paragraph**, which says its `.jsx` extension is load-bearing *and* that it is "the first `.jsx` under `frameworks/react/components/` that is not a component", and that the documented way to measure Plan C's subject set therefore over-counts by one. The extension reason survives; the over-count consequence does not, because the subject set is now measured by directory.
- **The `check:structure` / `MIGRATED` paragraphs**, which say Tailwind and Angular are migrated and React is not, and point at `MIGRATED` as the authoritative answer. `MIGRATED` is gone; the gate covers all three unconditionally and rule 3 is live.
- **The naming-exception list, which gains a SIXTH row and is measured rather than recited.** `frameworks/react/ui-kits/console/index.entry.jsx` and its compiled `.js` keep a lowercase initial: an entry script takes the stem of the page it composes — the convention every `<page>.card.entry.jsx` in the layer follows — and that page must be `index.html`, which is itself an exception because a directory served over HTTP is answered by that literal name. The reasoning is the same one the spec applied to `arena-material.prompt.md` following `arena-material.css`. Re-derive the whole set rather than copying this sentence, now that all three layers are in scope: `find frameworks -type f -printf '%f\n' | grep -E '^[^A-Z]' | sort -u`. Note what this row is **not**: `Index.entry.jsx` was rejected because a capitalised `Index` beside a mandatorily-lowercase `index.html` reads as a typo in every directory listing, and renaming the pair to a different stem was rejected because it would break the `<page>.entry.jsx` pairing the rest of the layer keeps.
- **`ChartInternals` is `DataVisuals` in both layers, and it sits at each layer's root.** `CLAUDE.md` currently says *"`ChartInternals.ts` has consumers in one category only and therefore stops at `components/charts/`"* — false in React from the start (`Calendar` imports `catColor`), and now false in Angular by decision. Say why the two layers moved together: Angular's consumer set is narrower only because its `Calendar` is delegated to Material, and a future plan removes that delegation. Say why the name changed: a module a schedule grid consumes is not "chart internals". The Angular layer-root list — `ContainerSize.ts`, `FocusTrap.ts`, `ProjectionMarkers.ts` — gains it, and the sentence claiming `ChartInternals.ts` stops at `components/charts/` goes.
- **`check:compliance`'s layer discrimination**, wherever `CLAUDE.md` describes `COVERED`'s compound key — the discrimination is structural now, not textual.
- **The gate count.** `bun run check` runs 22 gates; confirm by running it rather than by copying this sentence.
- **Every literal path** naming `test-dom/`, `ui_kits/`, `use-dialog-modal.js`, `use-container-width.js`, `api.generated.d.ts`, `tokens.generated.js`, a `vendor/*.js`, or a `components/<category>/<Name>.jsx`.

`README.md:64` and `:374` and `SKILL.md:7` each name `ui_kits/`. `components-divergences.md` names React paths in several entries — read each rather than substituting.

**Four accuracy items carried over from Tasks 1 and 2's reviews, none of which any other task touches.** Each was found by a reviewer, adjudicated as Minor, and deferred here because this is the prose task:

- `scripts/check-compliance.mjs:134` and `scripts/check-compliance.test.mjs:113` claim *"no suite spells its layer root in its source"*. That is a **false universal**: 19 of 48 suite files name a layer root in prose, and `TagAndChipCases.dom.test.jsx` names `frameworks/angular/components/display/tag/` — the exact kebab directory the collision test is modelled on. The conclusion the sentence supports still holds, because none of those is followed by the binding basename. Narrow the quantifier to what was actually checked: *"no suite spells its layer root as part of the path it hands to `join()`"*.
- `scripts/check-compliance.mjs:216` says the structure refactor's batch 3 is *"pending"* and *"gives"* React the kebab shape. Task 2 falsified both words. Re-tense it; the `COVERED` header two hundred lines above already got this right, so the file is currently inconsistent about its own rule.
- `scripts/check-compliance.mjs:263` emits *"A angular claim needs a angular suite"* — an interpolated article that is wrong for one of the two layers, in user-facing gate output. Reword to *"A claim for the `${layer}` layer needs a `${layer}` suite"*.
- `scripts/lib/behaviour-contracts.mjs:284` and `scripts/behaviour-contracts.test.mjs:186-201` were re-pointed in Task 2 from `ChartInternals.ts` to `ChartDataTable.test.ts`, and the re-point is weaker than the wording admits: `ChartDataTable.test.ts` is a **test suite**, not a shared internal, and there is no `ChartDataTable.ts` for it to be internals of. Reword to what is true — a bare `.ts` beside the category's directories is never a component, and today the only one is a suite — keeping the past-tense `ChartInternals.ts` clause. In the test, `assert.ok(!found.includes('ChartDataTable'))` is unfalsifiable, because the walk pushes `dir.name` and would yield `ChartDataTable.test.ts` if the `isDirectory()` guard were removed; assert the real spelling, or assert that every returned name resolves to a directory that exists.

**And three Angular suite headers cite a filename this batch renamed twice.** `components/charts/bar-chart/BarChart.geometry.test.ts:11`, `line-chart/LineChart.geometry.test.ts:10` and `doughnut-chart/DoughnutChart.geometry.test.ts:11` and `:131` all say *"chart-internals.test.ts already covers …"*. Batch 2 renamed that file to `ChartInternals.test.ts` and Task 2 renamed it again to `DataVisuals.test.ts`; both times the `import` line was rewritten and the header two lines above it was not. They belong to the standing *"Comments inside the Angular layer still cite siblings by their pre-move filenames"* debt entry, which is honestly deferred — but these three are now known by name, so fix them and say in that entry that they were.

**Do not write a count you have not derived.** Where a figure is genuinely useful, give the command instead.

- [ ] **Step 3: Verify no doc names a path that does not exist**

```bash
for p in $(grep -rhoP '(?<=`)frameworks/react/[A-Za-z0-9_./-]+(?=`)' --include='*.md' . \
           | grep -v node_modules | sort -u); do
  [ -e "$p" ] || echo "MISSING: $p"
done
```

Check each `MISSING:` line and confirm it comes from `CHANGELOG.md` or from a sentence that is explicitly past tense before dismissing it. A deliberate past-tense history clause — *"which was `frameworks/react/test-dom/` when this happened"* — is the correct form and must be left alone.

- [ ] **Step 4: Run the cross-file claim sweep for the components this batch moved**

Every component moved, so the change-time command in *Known debt* applies to all fifty. Run it for the ones whose **suites** were renamed or whose binding tails changed shape, which is where a false claim is most likely:

```bash
for X in Skeleton Tag Table Calendar CalendarEvent Tabs Tab SideNav Tooltip Alert Toast Dialog ConfirmDialog Onboarding Menu Pagination; do
  echo "=== $X ==="
  grep -rn --binary-files=without-match "\b$X\b" \
      --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
      CLAUDE.md components-divergences.md api/ behaviour/ docs/ frameworks/ scripts/ \
    | grep -v CHANGELOG.md
done
```

Read every hit as a claim about `X` that this batch may have falsified. Drop by hand the hits under `X`'s own files, which describe the component rather than claiming something about it. **Add no content filter to that command** — the path list is the only scoping it needs, and a `| grep -v` on `-n` output filters by *text* and silently drops real hits.

- [ ] **Step 5: Retire the spec**

The spec's own header says it is deleted when batch 3 lands. Delete `docs/superpowers/specs/2026-07-27-frameworks-file-structure-design-pending-1.md`, and check that `CLAUDE.md`'s naming-rule paragraph — which points at it as "the working detail" — becomes the durable statement of the rule on its own rather than a pointer to a file that is gone.

Two of its unexecuted siblings named in *Known debt* are unaffected and stay: `2026-07-26-progressbar-pattern-design-pending-1.md` and `2026-07-23-8-api-contracts-design.md`. **The second one is newly more wrong because of this batch** — it names pre-move Angular paths throughout, and now pre-move React ones too. Do not rewrite it; add one line to its *Known debt* entry recording that React's paths joined the list, since separating its historical uses from its normative ones is a reading of that spec's argument and belongs to whoever plans Plan D.

- [ ] **Step 6: Full sweep**

Run: `CHROME_PATH=/usr/bin/chromium ARENA_CHECK_STRICT=1 bun run check`
Expected: 22 gates, no SKIP.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md README.md SKILL.md components-divergences.md frameworks/react docs/
git commit -q -F - <<'MSG'
docs: describe the React layer's new shape, and retire the structure spec

test-dom/ is gone, every component sits in its own kebab directory, and the
DOM split is a filename infix -- so the two-test-directories rule, the grid
hand-test rule, the quartet convention, reactComponents()'s heuristic, the
SideNavInject paragraph and every literal path describing the old tree were all
describing a tree that no longer exists.

MIGRATED is deleted with the last layer, so the prose that pointed at it as the
authoritative answer to which layers check:structure reaches now says the gate
covers all three, and that its "declared but present in no layer" rule is live
for the first time.

All three layers are migrated, so the design spec is deleted per its own header
and this file is the durable statement of the naming rule. The two unexecuted
specs that name pre-move paths stay as they are; the api-contracts one gained
React paths to the list its debt entry already records, which is noted rather
than rewritten -- separating its history from its normative text is a reading of
its argument and belongs to whoever plans Plan D.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

## Batch close-out

- [ ] `CHROME_PATH=… ARENA_CHECK_STRICT=1 bun run check` is green with 22 gates and no SKIP.
- [ ] `bun run test:react` reports **334 pass across 44 files**; `bun run test:react-dom` reports **107 pass across 15 files**. Both identical to Task 2's baseline.
- [ ] `git show --numstat` on Task 2's commit shows 0 insertions and 0 deletions.
- [ ] `frameworks/react/test-dom/` and `frameworks/react/ui_kits/` no longer exist, and no file outside `CHANGELOG.md` names either.
- [ ] `find frameworks/*/components -mindepth 2 -maxdepth 2 -type d | wc -l` — all three layers report their component directories, React's being 50.
- [ ] `MIGRATED` is gone from `scripts/check-structure.mjs`, and `grep -rn MIGRATED scripts/` returns nothing.
- [ ] `docs/superpowers/specs/2026-07-27-frameworks-file-structure-design-pending-1.md` is deleted.
- [ ] Delete this plan, per the repo's precedent for an executed plan.
