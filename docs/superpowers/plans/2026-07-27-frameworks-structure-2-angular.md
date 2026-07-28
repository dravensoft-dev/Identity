# Frameworks File Structure — Batch 2: Angular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Angular layer from `frameworks/angular/primitives/<name>/` to `frameworks/angular/components/<category>/<name>/`, rename every file in the layer to capital-initial, colocate each primitive's tests with it, and add `'angular'` to `check:structure`'s `MIGRATED`.

**Architecture:** The move is driven by `frameworks/Components.json`, which batch 1 created and which already names every Angular primitive. The batch separates four things that batch 1 learned to keep apart: a content-free directory move; the file renames with their import rewrites; the relocation of the three shared internals whose consumers cross categories; and the test colocation, which is the only part that changes how the suites are found and run.

**Tech Stack:** Bun (build + test), `ngc --strictTemplates` (the Angular test surface compiles ahead of the run), plain node (portability of every gate), `node:test`/`node:assert` for the gate suites.

## Global Constraints

- **Directories are `kebab-case`, lowercase. A file name begins with a capital, and a multi-word stem is `PascalCase` with hyphens removed.** Secondary dotted segments stay `lowerCamelCase`: `Tag.variants.ts`, `Alert.roleTones.test.ts`, `BarChart.geometry.test.ts`.
- **Four naming exceptions**, each a name the rule cannot reach because it begins with a lowercase letter or has no stem: `index.ts` (TypeScript resolves a directory by that literal name), `index.html`, `tsconfig.check.json` / `tsconfig.test.json`, `.gitkeep`. A conventional all-caps document name — `README.md`, `ADOPTION.md` — already begins with a capital and needs no dispensation.
- **English only** — code, comments, docs and commit messages.
- **A commit message containing a backtick is written with a quoted here-doc**, never `git commit -m "…"`. A backtick inside a double-quoted shell string opens command substitution and is silently spliced away. Use `git commit -q -F - <<'MSG' … MSG` and verify with `git log -1 --format=%B`.
- **Every move and rename uses `git mv`.**
- **A move commit carries no content change.** Import rewrites land in the commit after. `bun run check` is red between them, and that is expected: the full sweep is a completion gate, not a per-commit toll.
- **Nothing about behaviour, API contracts, accessibility or tokens changes.** No component gains or loses a member, a binding, an exception or a test. Any suite green before a task is green after it — a task that changes what a suite proves has gone wrong. In particular the Angular suites must report the same pass count after this batch as before it; record that number in Task 1 and check it at the close.
- **A gate that grows or moves an exception list grows its suite too.** `scripts/check-dimension-literals.mjs`'s `EXEMPT` and `scripts/check-manifest-states.mjs`'s `SOURCE_OVERRIDES` are both asserted by name in their own suites.
- **`CHANGELOG.md` is never back-edited.**

## What batch 1 cost, and what this plan does about it

Batch 1's plan missed inbound references **twice** — the Angular recipes importing Tailwind manifests, and a doc comment in a React file — and both were found by implementers rather than by the plan. The lesson the spec now records: *a layer's inbound references are not discoverable by reading that layer, and the query that finds them has to run before the move.*

So it has been run. Every reference into `frameworks/angular/primitives/` from outside that directory, measured at the head of batch 1:

| Referrer | Count | Task that fixes it |
| --- | --- | --- |
| `frameworks/angular/test/host-class-binding.test.ts` | 32 | 4 |
| `CLAUDE.md` | 8 | 7 |
| `scripts/check-dimension-literals.test.mjs` | 5 | 6 |
| `frameworks/angular/test/harness-capabilities.test.ts` | 5 | 4 |
| `components-divergences.md` | 5 | 7 |
| `scripts/check-dimension-literals.mjs` | 4 | 6 |
| `frameworks/angular/README.md` | 3 | 7 |
| `scripts/lib/behaviour-contracts.mjs` | 2 | 6 |
| `scripts/check-manifest-states.mjs` | 2 | 6 |
| every other `frameworks/angular/test/*.ts` | 1–3 each | 4 |
| `CHANGELOG.md` | 4 | **none — frozen, never back-edited** |

Re-run the query at the start of Task 1 and compare; a referrer that appeared since is a referrer this plan does not cover.

```bash
grep -rn "angular/primitives\|\.\./primitives/" \
  --include='*.mjs' --include='*.ts' --include='*.js' --include='*.jsx' \
  --include='*.json' --include='*.md' --include='*.html' --include='*.css' \
  scripts/ frameworks/ api/ behaviour/ *.md | grep -v node_modules \
  | grep -v '^frameworks/angular/primitives/' | sed 's/:.*//' | sort | uniq -c | sort -rn
```

---

### Task 1: Move the primitive directories under a category

Pure `git mv`. Twenty directories descend one level into their category; `primitives/` becomes `components/`. No file is renamed and no file's content changes, so this commit is reviewable as a rename list. Gates go red here and come back in Tasks 2–6.

**Files:**
- Move: `frameworks/angular/primitives/` → `frameworks/angular/components/`, with each of the 20 component directories descending into its category

**Interfaces:**
- Consumes: `frameworks/Components.json` (batch 1).
- Produces: `frameworks/angular/components/<category>/<name>/` for all 20 primitives, plus the four bare `.ts` files (`index.ts`, `chart-internals.ts`, `container-size.ts`, `focus-trap.ts`, `projection-markers.ts`) still at `components/`'s top level, which Task 3 relocates.

- [ ] **Step 1: Record the baseline this whole batch is measured against**

```bash
mkdir -p /tmp/arena-batch2
bun run build:angular-tests >/dev/null 2>&1 && bun test build/angular-test/angular/test 2>&1 | tail -4 | tee /tmp/arena-batch2/angular-baseline.txt
(cd frameworks/angular/primitives && find . -type f | xargs sha256sum | sed 's|  \./|  |' | sort) > /tmp/arena-batch2/before.txt
wc -l < /tmp/arena-batch2/before.txt
```

Record the pass count. **That number must be identical at the close of this batch** — the Global Constraints say so, and it is the only evidence that colocating the tests did not silently drop one.

- [ ] **Step 2: Re-run the inbound-reference query**

Run the query in *What batch 1 cost* above and compare against its table. Report any referrer that is not in the table; it is a referrer this plan does not cover, and it must be raised before the move rather than discovered after.

- [ ] **Step 3: Move the directories**

```bash
git mv frameworks/angular/primitives frameworks/angular/components
cd frameworks/angular/components
bun -e 'const c=require("../../Components.json");
for (const [cat, names] of Object.entries(c)) for (const n of names)
  console.log(cat, n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase());' |
while read -r cat dir; do
  [ -d "$dir" ] || continue          # 30 of the 50 are delegated to Material
  mkdir -p "$cat"
  git mv "$dir" "$cat/$dir"
done
cd ../../..
```

- [ ] **Step 4: Verify the move was lossless and complete**

```bash
ls -d frameworks/angular/components/*/ | sed 's|.*/\([^/]*\)/|\1|' | tr '\n' ' '; echo
ls frameworks/angular/components/*.ts
find frameworks/angular/components -mindepth 3 -maxdepth 3 -type d | wc -l
(cd frameworks/angular/components && find . -type f | xargs sha256sum | sed 's|  \./[^/]*/|  |;s|  \./|  |' | sort) > /tmp/arena-batch2/after.txt
```

Expected: five category directories (`brand`, `charts`, `display`, `feedback`, `navigation` — Angular has **no** `forms/`, because all nine form controls are delegated to Material); the five bare `.ts` files still at the top level; `20` component directories two levels down. Compare `before.txt` and `after.txt` with `diff` after normalising the paths — every hash must survive.

- [ ] **Step 5: Confirm the failure is the expected one**

Run: `bun run check:angular`
Expected: FAIL, `ngc` unable to resolve `./activity-feed` and its siblings from `components/index.ts`. If it fails for another reason, stop and investigate before continuing.

- [ ] **Step 6: Commit**

```bash
git add -A frameworks/angular
git commit -q -F - <<'MSG'
refactor: move the Angular primitives under their category

primitives/ becomes components/, and each of the twenty primitive directories
descends into the category frameworks/Components.json assigns it. Pure git mv:
no file renamed, no file's content changed, verified by comparing sha256 before
and after.

Angular has five of the six categories and no forms/, because all nine form
controls are delegated to Material.

check:angular is red at this commit -- the barrel still names its exports one
level up. Rewriting the specifiers is the next commit, kept separate so this one
is reviewable as a rename list.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 2: Rename the files to capital-initial, and rewrite every specifier

Twenty components × four files, plus the specifiers naming them. `index.ts` is untouched by rule.

**Files:**
- Rename: `<name>.ts`, `<name>.variants.ts`, `<name>.behaviour.json`, `<name>.prompt.md` in each of the 20 component directories
- Modify: every `index.ts` in those directories; `frameworks/angular/components/index.ts`; every `frameworks/angular/test/*.ts` that names a primitive file

**Interfaces:**
- Produces: `frameworks/angular/components/<category>/<kebab>/<Pascal>.ts` and `.variants.ts`, `.behaviour.json`, `.prompt.md`. The stem is the PascalCase component name, so the directory and the file no longer share a spelling — that is the approved shape, and `kebab()` in `scripts/check-structure.mjs` is the function that relates them.

- [ ] **Step 1: Rename, deriving the Pascal stem from the directory**

```bash
cd frameworks/angular/components
pascal() { echo "$1" | sed -E 's/(^|-)([a-z])/\U\2/g'; }
for d in */*/; do
  dir=$(basename "$d"); P=$(pascal "$dir")
  for ext in ts variants.ts behaviour.json prompt.md; do
    [ -f "$d$dir.$ext" ] && git mv "$d$dir.$ext" "$d$P.$ext"
  done
done
cd ../../..
git status --short | head -20
```

- [ ] **Step 2: Verify every component directory has the four files plus `index.ts`**

```bash
for d in frameworks/angular/components/*/*/; do
  n=$(ls "$d" | wc -l); [ "$n" -ge 5 ] || echo "SHORT: $d ($n files)"
  ls "$d" | grep -qx 'index.ts' || echo "NO INDEX: $d"
done
ls frameworks/angular/components/*/*/ | grep -c '^[a-z]' || true
```

Expected: no `SHORT:` or `NO INDEX:` lines. The last command counts files still starting lowercase inside a component directory; only `index.ts` may, so the count is the number of component directories.

- [ ] **Step 3: Rewrite every specifier**

Each component's own `index.ts` re-exports `./<name>` and `./<name>.variants`; the tests import `'../primitives/<name>/<name>'`. Both forms become the Pascal stem:

```bash
bun -e '
const { readdirSync, readFileSync, writeFileSync, statSync } = require("fs");
const { join } = require("path");
const pascal = (s) => s.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
const dirs = [];
for (const cat of readdirSync("frameworks/angular/components", { withFileTypes: true }))
  if (cat.isDirectory())
    for (const d of readdirSync(join("frameworks/angular/components", cat.name), { withFileTypes: true }))
      if (d.isDirectory()) dirs.push([cat.name, d.name]);
const walk = (p, out = []) => {
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const f = join(p, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (/\.(ts|mjs|md|json)$/.test(e.name)) out.push(f);
  }
  return out;
};
const files = [...walk("frameworks/angular"), ...walk("scripts")];
let n = 0;
for (const f of files) {
  let src = readFileSync(f, "utf8"), out = src;
  for (const [cat, d] of dirs) {
    const P = pascal(d);
    out = out.split(`primitives/${d}/${d}`).join(`components/${cat}/${d}/${P}`);
    out = out.split(`./${d}/${d}`).join(`./${cat}/${d}/${P}`);
    out = out.replace(new RegExp(`(["\x27])\\./${d}(\\.variants)?(["\x27])`, "g"), `$1./${P}$2$3`);
  }
  if (out !== src) { writeFileSync(f, out); n++; }
}
console.log("rewrote", n, "files");'
```

**Read the diff before continuing.** This is a broad substitution; a component directory named for a common word could match text that is not a specifier. `git diff` every markdown file it touched by hand.

- [ ] **Step 4: Compile**

Run: `bun run check:angular`
Expected: PASS. `ngc` resolving the barrel is the proof every specifier is right; an unresolved one fails the compile outright.

- [ ] **Step 5: Run the Angular suites**

Run: `bun run build:angular-tests && bun run test:angular`
Expected: PASS, with **the same pass count recorded in Task 1 Step 1**. A different count means a suite stopped loading — and a suite that fails to load from the emit turns the whole run red without naming which file dropped, so compare the number rather than trusting the colour.

- [ ] **Step 6: Commit**

```bash
git add -A frameworks/angular scripts
git commit -q -F - <<'MSG'
refactor: rename the Angular component files to capital-initial

Each component's four files take the PascalCase component name as their stem,
so the directory and the file stop sharing a spelling. That is the approved
shape across all three layers, and kebab() in scripts/check-structure.mjs is
the function that relates the two.

index.ts is untouched: TypeScript resolves a directory by that literal name.

check:angular is what proves every rewritten specifier resolves -- ngc fails the
compile outright on an unresolved one -- and the Angular suites report the same
pass count as before the move, which is what proves no suite silently stopped
loading.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 3: Relocate the shared internals, and restructure the barrels

Four bare `.ts` files sit at `components/`'s top level. One is consumed by the three charts alone; three cross categories. The spec's placement rule sends them to different homes, and the barrels follow.

**Files:**
- Move: `components/chart-internals.ts` → `components/charts/ChartInternals.ts`
- Move: `components/focus-trap.ts` → `frameworks/angular/FocusTrap.ts`
- Move: `components/container-size.ts` → `frameworks/angular/ContainerSize.ts`
- Move: `components/projection-markers.ts` → `frameworks/angular/ProjectionMarkers.ts`
- Modify: `frameworks/angular/components/index.ts`, each new `components/<category>/index.ts`, `frameworks/angular/index.ts`

**Interfaces:**
- Produces: a barrel per category re-exporting its components; `components/index.ts` re-exporting the five categories; `frameworks/angular/index.ts` re-exporting `./components` plus the three layer-root internals, which were part of the public surface through `primitives/index.ts` and must stay in it.

- [ ] **Step 1: Confirm each internal's consumers before moving it**

```bash
for h in chart-internals container-size focus-trap projection-markers; do
  printf "%-20s " "$h"
  grep -rl "$h'" frameworks/angular/components/*/*/ 2>/dev/null | xargs -n1 dirname | xargs -n1 basename | sort -u | tr '\n' ' '; echo
done
```

Expected, and the placement follows from it: `chart-internals` → bar-chart, doughnut-chart, line-chart (one category, so the category directory); `container-size` → those three plus page-head (two categories, so the layer root); `focus-trap` → command-palette, confirm-dialog, onboarding (two categories, layer root); `projection-markers` → chart-card, empty-state, error-state, page-head, unauth-card (four categories, layer root). **If a consumer set differs from this, the placement changes with it** — the rule is the narrowest level containing all consumers, not this table.

- [ ] **Step 2: Move and rename**

```bash
cd frameworks/angular
git mv components/chart-internals.ts components/charts/ChartInternals.ts
git mv components/focus-trap.ts FocusTrap.ts
git mv components/container-size.ts ContainerSize.ts
git mv components/projection-markers.ts ProjectionMarkers.ts
cd ../..
```

- [ ] **Step 3: Write the category barrels**

Each `components/<category>/index.ts` re-exports its component directories, and for `charts/` also its own internal:

```bash
bun -e '
const { readdirSync, writeFileSync } = require("fs");
const { join } = require("path");
const base = "frameworks/angular/components";
const cats = readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
for (const cat of cats) {
  const dir = join(base, cat);
  const lines = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => `export * from \x27./${e.name}\x27;`).sort();
  if (cat === "charts") lines.push("export * from \x27./ChartInternals\x27;");
  writeFileSync(join(dir, "index.ts"), lines.join("\n") + "\n");
}
writeFileSync(join(base, "index.ts"), cats.map((c) => `export * from \x27./${c}\x27;`).join("\n") + "\n");
console.log("wrote", cats.length + 1, "barrels");'
cat frameworks/angular/components/index.ts
```

- [ ] **Step 4: Re-export the three layer-root internals from the layer barrel**

`frameworks/angular/index.ts` currently reads `export * from './primitives';`. The three internals left that barrel when they moved to the layer root, so the layer barrel must name them or they leave the public surface — which would be a capability change this batch is not allowed to make. Edit it to:

```ts
export * from './api.generated';
export * from './components';
export * from './ContainerSize';
export * from './FocusTrap';
export * from './ProjectionMarkers';
export * from './theme/theme-service';
export * from './icons/icon-manifest';
```

- [ ] **Step 5: Prove the public surface did not change**

```bash
git stash && bun run check:angular >/dev/null 2>&1
bun -e 'import("./frameworks/angular/index.ts").then(m => console.log(Object.keys(m).sort().join("\n")))' > /tmp/arena-batch2/exports-before.txt 2>/dev/null || \
  grep -rho "export \(class\|const\|function\|interface\|type\) [A-Za-z_]*" frameworks/angular/primitives frameworks/angular/components 2>/dev/null | sort -u > /tmp/arena-batch2/exports-before.txt
git stash pop
grep -rho "export \(class\|const\|function\|interface\|type\) [A-Za-z_]*" frameworks/angular/components frameworks/angular/*.ts | sort -u > /tmp/arena-batch2/exports-after.txt
diff /tmp/arena-batch2/exports-before.txt /tmp/arena-batch2/exports-after.txt && echo IDENTICAL
```

Expected: `IDENTICAL`. If the stash-based capture fails for any reason, fall back to the grep form on both sides and say so in the report — the claim to establish is that no export left the surface, and the grep establishes it as well.

- [ ] **Step 6: Compile and test**

Run: `bun run check:angular && bun run build:angular-tests && bun run test:angular`
Expected: PASS, same pass count as Task 1's baseline.

- [ ] **Step 7: Commit**

```bash
git add -A frameworks/angular
git commit -q -F - <<'MSG'
refactor: place the Angular shared internals at the narrowest level that holds them

ChartInternals has three consumers and they are all charts, so it lands in the
charts category. ContainerSize, FocusTrap and ProjectionMarkers each cross two
or more categories, so they land at the layer root.

All four were part of the public surface through primitives/index.ts. The three
that left components/ are now named by frameworks/angular/index.ts directly, so
nothing leaves the surface -- that would be a capability change this batch is
not allowed to make, and the export list is compared before and after.

Each category gains a barrel and components/index.ts re-exports the five.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 4: Colocate the tests

Thirty-three suites move out of `frameworks/angular/test/` into the component directory they cover, renamed `<Component>.<facet>.test.ts`. Five files stay: the two harness modules and the three suites that cover more than one component or the harness itself.

**Files:**
- Move: 28 of the 33 `frameworks/angular/test/*.test.ts` into their component directory
- Move: `test/chart-internals.test.ts` → `components/charts/ChartInternals.test.ts`; `test/chart-data-table.test.ts` → `components/charts/ChartDataTable.test.ts`
- Rename in place: `test/testbed-env.ts` → `test/TestbedEnv.ts`, `test/compliance.ts` → `test/Compliance.ts`, `test/host-class-binding.test.ts` → `test/HostClassBinding.test.ts`, `test/harness-capabilities.test.ts` → `test/HarnessCapabilities.test.ts`, `test/assert-pattern-cases.test.ts` → `test/AssertPatternCases.test.ts`
- Modify: `frameworks/angular/tsconfig.test.json`, `package.json`, `scripts/check-compliance.mjs`

**Interfaces:**
- Produces: `frameworks/angular/components/<category>/<kebab>/<Pascal>.<facet>.test.ts`. `check-compliance.mjs`'s `collectSuites()` must walk recursively and key suites by basename **with a uniqueness assertion** — a nested tree can now produce the same basename twice, and the current code would let one suite silently shadow another.

- [ ] **Step 1: Classify every suite before moving one**

```bash
for f in frameworks/angular/test/*.test.ts; do
  printf "%-40s " "$(basename $f)"
  grep -ohP "(?<=from '\.\./)[^']*" "$f" | grep -v api.generated | sort -u | tr '\n' ' '; echo
done
```

A suite importing exactly one component goes into that component's directory. `chart-internals.test.ts` and `chart-data-table.test.ts` reach all three charts and stop at `components/charts/`. `host-class-binding.test.ts` is manifest-driven across every primitive, `harness-capabilities.test.ts` and `assert-pattern-cases.test.ts` test the harness itself — all three stay in `test/`. **Classify from the imports, not from the filename**, and report any suite whose imports contradict this paragraph.

- [ ] **Step 2: Move and rename the per-component suites**

The facet is what remains of the old stem after the component's own name, in `lowerCamelCase`: `tag-variants` → `Tag.variants`, `alert-role-tones` → `Alert.roleTones`, `bar-chart-geometry` → `BarChart.geometry`, `command-palette-focus-trap` → `CommandPalette.focusTrap`, `skeleton-dimensions` → `Skeleton.dimensions`, `tag-remove` → `Tag.remove`, `tag-cases` → `Tag.cases`.

Move each with `git mv` and fix its relative imports: a suite that imported `'../primitives/tag/tag'` now sits beside its subject and imports `'./Tag'`; one that imported `'./testbed-env'` now needs `'../../../test/TestbedEnv'`.

- [ ] **Step 3: Rename the five that stay**

```bash
cd frameworks/angular/test
git mv testbed-env.ts TestbedEnv.ts
git mv compliance.ts Compliance.ts
git mv host-class-binding.test.ts HostClassBinding.test.ts
git mv harness-capabilities.test.ts HarnessCapabilities.test.ts
git mv assert-pattern-cases.test.ts AssertPatternCases.test.ts
cd ../../..
```

Rewrite every importer of the two harness modules. `Compliance.ts` and `TestbedEnv.ts` carry no `.test.` infix on purpose — `bun test` collects by that infix and would try to run a harness as a suite.

- [ ] **Step 4: Widen the compile surface**

`frameworks/angular/tsconfig.test.json`'s `include` becomes:

```json
  "include": ["./components/**/*.ts", "./test/**/*.ts", "./index.ts"]
```

`outDir` and the `rootDir` inference are unchanged, so the emit mirrors `frameworks/` as before and `pruneOrphans`' `build/angular-test/<rel>` → `frameworks/<rel>` mapping keeps working untouched.

- [ ] **Step 5: Point the test invocations at the whole emit**

In `package.json`, `test:angular` becomes:

```json
    "test:angular": "bun run build:angular-tests && bun test build/angular-test/angular",
```

and the merged `test` script's `build/angular-test/angular/test` argument becomes `build/angular-test/angular`. In `scripts/check-all.mjs`'s `testStep()`, make the same substitution, and update the literal array assertion in `scripts/check-all.test.mjs` in the same commit.

- [ ] **Step 6: Make `collectSuites()` walk, and refuse a basename collision**

In `scripts/check-compliance.mjs`, `collectSuites()` reads one flat directory per entry in `SUITE_DIRS` and keys by basename. Replace the read with a recursive walk, and add the assertion the nested tree now needs:

```js
function collectSuites() {
  const out = {};
  const seen = new Map();
  for (const dir of SUITE_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of walkSuites(dir)) {
      const name = basename(f);
      if (seen.has(name))
        throw new Error(
          `check:compliance — two suites share the basename ${name}:\n  ${seen.get(name)}\n  ${f}\n` +
          `Suites are keyed by basename, so one would silently shadow the other.`);
      seen.set(name, f);
      out[name] = readFileSync(f, 'utf8');
    }
  }
  return out;
}
```

Add `walkSuites(dir)` beside it, matching `/\.test\.(jsx|ts|mjs)$/` as the flat read did, and update `SUITE_DIRS` so the Angular entry is the component tree as well as `test/`. Give the collision a test that fails if the assertion is deleted.

- [ ] **Step 7: Verify the suites all still run, and count them**

```bash
bun run build:angular-tests && bun test build/angular-test/angular 2>&1 | tail -4
ls frameworks/angular/test/
find frameworks/angular/components -name '*.test.ts' | wc -l
```

Expected: the **same pass count** as Task 1's baseline; `test/` holding exactly the five files named in Step 3; and 28 suites now under `components/`. A pass count that dropped means a suite stopped being collected — and because a suite that fails to load turns the run red without naming which file dropped, the count is the only signal that separates "did not load" from "did not exist".

- [ ] **Step 8: Commit**

```bash
git add -A frameworks/angular scripts package.json
git commit -q -F - <<'MSG'
refactor: colocate the Angular suites with the components they cover

Twenty-eight suites move into their component's directory as
<Component>.<facet>.test.ts. ChartInternals and ChartDataTable reach all three
charts and stop at the charts category. Five files stay in test/: the two
harness modules, plus HostClassBinding (manifest-driven across every primitive),
HarnessCapabilities and AssertPatternCases (which test the harness itself).

Compliance.ts and TestbedEnv.ts carry no .test. infix on purpose -- bun test
collects by that infix and would try to run a harness as a suite.

check-compliance's collectSuites() keys suites by basename and read one flat
directory. It now walks, and refuses a basename collision outright: in a nested
tree two suites can share a name, and the old code would have let one silently
shadow the other.

The Angular pass count is unchanged, which is what proves no suite quietly
stopped being collected.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 5: Rename the Angular layer-root files

**Files:**
- Rename: `api.generated.ts` → `Api.generated.ts`, `tokens.generated.ts` → `Tokens.generated.ts`, `behaviour-delegated.json` → `BehaviourDelegated.json`
- Modify: `scripts/build-api-types.mjs`, `scripts/build-tokens.mjs`, `scripts/check-api.mjs`, `scripts/check-script-tokens.mjs`, `scripts/check-duplicate-constants.mjs`, `scripts/check-behaviour.mjs`, `scripts/lib/behaviour-contracts.mjs`, and each of those files' suites where they pin a path

**Interfaces:**
- Produces: the two generated modules under their new names, written by the same generators. `bun run build:api` and `bun run build:tokens` must produce **no diff** after the rename — a diff in the body means something more than the path changed.

- [ ] **Step 1: Enumerate before touching anything**

```bash
grep -rn "api\.generated\|tokens\.generated\|behaviour-delegated" \
  --include='*.mjs' --include='*.ts' --include='*.json' --include='*.md' \
  scripts/ frameworks/ | grep -v node_modules | tee /tmp/arena-batch2/gen-refs.txt | wc -l
```

Keep the file; Step 4 compares against it. **`frameworks/react/` will appear** — React has its own `api.generated.d.ts` and `tokens.generated.js`, which batch 3 renames, not this one. Every React hit must be left alone, and confirming that is part of Step 4.

- [ ] **Step 2: Rename**

```bash
cd frameworks/angular
git mv api.generated.ts Api.generated.ts
git mv tokens.generated.ts Tokens.generated.ts
git mv behaviour-delegated.json BehaviourDelegated.json
cd ../..
```

- [ ] **Step 3: Rewrite the references, Angular-side only**

Rewrite `'../api.generated'`-style specifiers under `frameworks/angular/`, and in `scripts/` rewrite only the string literals that name the **angular** path. A blind substitution would rename React's paths too and break batch 3's starting point; do these by reading each hit in `/tmp/arena-batch2/gen-refs.txt` and editing the angular ones.

- [ ] **Step 4: Verify nothing React-side moved, and nothing Angular-side was missed**

```bash
git diff --stat frameworks/react/ | tail -1
grep -rn "angular/api\.generated\|angular/tokens\.generated\|angular/behaviour-delegated" scripts/ frameworks/ | grep -v node_modules
```

Expected: no output from either. The first proves React was untouched; the second proves no old Angular path survives.

- [ ] **Step 5: Prove the generators are unchanged in output**

```bash
bun run build:api && bun run build:tokens
git status --short frameworks/angular
```

Expected: no output — the generated content does not depend on the file's name beyond its own banner, and if a banner does name the file, the rename is the only line that changes. Read any diff before accepting it.

- [ ] **Step 6: Run the gates**

Run: `bun run check:api && bun run check:behaviour && bun run check:script-tokens && bun run check:duplicate-constants && bun run check:angular && bun run test:angular`
Expected: all pass, same Angular pass count.

- [ ] **Step 7: Commit**

```bash
git add -A frameworks/angular scripts
git commit -q -F - <<'MSG'
refactor: rename the Angular layer-root files to capital-initial

api.generated.ts, tokens.generated.ts and behaviour-delegated.json follow the
rule that reaches all of frameworks/.

The rewrite was done by reading each reference rather than by substitution,
because React carries identically-named generated modules that batch 3 renames
and this batch must not touch. That React is untouched is asserted, not assumed.

build:api and build:tokens produce no diff after the rename, which is what
proves the generated content never depended on the path.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 6: Teach the gates the new shape, and add Angular to `MIGRATED`

**Files:**
- Modify: `scripts/lib/behaviour-contracts.mjs` (`angularPrimitives`), `scripts/check-compliance.mjs`, `scripts/check-api.mjs`, `scripts/check-material.mjs`, `scripts/check-manifest-states.mjs` (`SOURCE_OVERRIDES`), `scripts/check-dimension-literals.mjs` (`EXEMPT`) and its suite, `scripts/check-structure.mjs` (`MIGRATED`), `frameworks/angular/tsconfig.check.json`
- Test: `scripts/behaviour-contracts.test.mjs`, `scripts/check-dimension-literals.test.mjs`, `scripts/check-structure.test.mjs`, `scripts/check-manifest-states.test.mjs`

**Interfaces:**
- Produces: `angularPrimitives(root)` walking `frameworks/angular/components/<category>/` and still returning the **kebab directory names**, sorted — its callers key on that. `check-compliance.mjs` derives each binding's path as `<category>/<dir>/<Pascal>.behaviour.json`, so it needs the same `pascal()` derivation `check-structure.mjs`'s `kebab()` inverts; export one of them rather than writing a second.

- [ ] **Step 1: Rewrite `angularPrimitives` and watch its suite fail first**

Its doc comment says bare `.ts` files under `primitives/` are shared internals rather than components, so the walk keys on directories. That is still true one level deeper. Update the comment to describe the new tree — a comment describing the old one is the cross-file-claim failure this repo documents at length.

- [ ] **Step 2: Fix `check-compliance.mjs`'s binding path**

It builds `join(angularBase, dir, `${dir}.behaviour.json`)`. The stem is now Pascal and the directory sits under a category. Derive the category by looking, exactly as the React branch beside it already does, and the stem with the shared `pascal()`.

- [ ] **Step 3: Update the two exception maps and their suites in the same commit**

`SOURCE_OVERRIDES` in `check-manifest-states.mjs` maps `Tag` → `frameworks/angular/primitives/tag/tag.ts`; it becomes `frameworks/angular/components/display/tag/Tag.ts`. `EXEMPT` in `check-dimension-literals.mjs` has three entries keyed on `frameworks/angular/primitives/chart-internals.ts:<prop>:<value>`; they become `frameworks/angular/components/charts/ChartInternals.ts:…`. Both suites assert on these maps by name — a key changed without touching the suite leaves the tests describing a gate that no longer exists. **A stale exemption fails its own gate**, so a missed key is loud rather than silent; run each gate to see it.

- [ ] **Step 4: Add Angular to `MIGRATED`**

In `scripts/check-structure.mjs`, `MIGRATED` becomes `['tailwind', 'angular']`, and `check-structure.test.mjs`'s pin follows. `complete` stays `MIGRATED.length === 3`, so the "declared but present nowhere" rule stays held back for batch 3.

Then run the gate and read what it says: Angular has 20 of the 50 declared components and no `forms/` category at all. The gate must pass — it asserts that a directory that **does** exist is in the right place, never that every declared component exists in every layer.

- [ ] **Step 5: Verify the zero-directory guard would still fire for Angular**

Batch 1 added a guard failing a `MIGRATED` layer that yields zero component directories. Prove it covers the new entry: temporarily rename `frameworks/angular/components` aside, run `bun scripts/check-structure.mjs`, confirm it fails naming `angular`, and rename it back. Confirm the restore with `git status --short` showing nothing.

- [ ] **Step 6: Full sweep**

Run: `CHROME_PATH=/usr/bin/chromium bun run check`
Expected: 22 gates, all pass, no SKIP, and the Angular pass count unchanged from Task 1's baseline.

- [ ] **Step 7: Commit**

```bash
git add -A scripts frameworks/angular
git commit -q -F - <<'MSG'
feat: teach the gates the Angular layer's new shape

angularPrimitives walks components/<category>/ and still returns kebab directory
names, because its callers key on those. check:compliance derives each binding's
path from the category and the Pascal stem through the same derivation
check:structure's kebab() inverts, rather than a second copy of it.

check:states' SOURCE_OVERRIDES and check:dimensions' EXEMPT both name real
paths, and both suites assert on those maps by name, so all four move together.

check:structure's MIGRATED gains 'angular'. complete stays at three, so the
"declared but present nowhere" rule remains held back until React lands --
Angular has twenty of the fifty and no forms category at all, which the gate is
right to be silent about.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 7: Update the prose

**Files:**
- Modify: `CLAUDE.md`, `frameworks/angular/README.md`, `frameworks/angular/ADOPTION.md`, `components-divergences.md`

**Interfaces:**
- Consumes: everything Tasks 1–6 built.

- [ ] **Step 1: Find every claim about the moved paths**

```bash
grep -rn "angular/primitives\|primitives/\|behaviour-delegated\|angular/test/" \
  --include='*.md' . | grep -v node_modules | grep -v CHANGELOG.md
```

`CHANGELOG.md` is excluded deliberately: it is a frozen record of what shipped at a tag.

- [ ] **Step 2: Rewrite, holding every sentence to the read-the-file standard**

`CLAUDE.md`'s *Known debt* carries an entry recording that cross-file prose claims in this repo have shipped false repeatedly, that one correction for it was itself false, and that the correction of *that* was false too. Its rule: **"I grepped it" is insufficient evidence for a claim about another file; only reading the file suffices.** Every sentence you write about a file, open that file.

At minimum: the Angular layer description under *Architecture* — `primitives/` is gone and the quartet's file names changed; the two-test-directories paragraph, whose Angular half now describes colocated suites; the `testbed-env.ts` / `compliance.ts` references, both renamed; the `behaviour-delegated.json` references; the seven-files-still-citing-JIT entry, whose `grep` command names `frameworks/angular/test/*.ts` and now reaches the wrong set — **re-derive that entry's file list and give it the corrected command**; and the *Where the rest of the debt lives* entries for `check-dimension-literals.mjs` and `check-manifest-states.mjs`.

State that Angular is now migrated and Tailwind was, and that React is not — and point at `MIGRATED` for the authoritative answer rather than repeating it in prose that can drift.

Do **not** write a count you have not derived. Where a figure is genuinely useful, give the command instead.

- [ ] **Step 3: Verify no doc names a path that does not exist**

```bash
for p in $(grep -rhoP '(?<=`)frameworks/angular/[A-Za-z0-9_./-]+(?=`)' --include='*.md' . | grep -v node_modules | sort -u); do
  [ -e "$p" ] || echo "MISSING: $p"
done
```

Expected: no output beyond `CHANGELOG.md`'s frozen references, which this loop does not reach because it only reads paths in backticks across all markdown — check each `MISSING:` line and confirm it comes from a frozen or historical document before dismissing it.

- [ ] **Step 4: Full sweep**

Run: `CHROME_PATH=/usr/bin/chromium bun run check`
Expected: 22 gates, no SKIP.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md components-divergences.md frameworks/angular
git commit -q -F - <<'MSG'
docs: describe the Angular layer's new shape

primitives/ is gone, the quartet's files are capital-initial, and the suites sit
with the components they cover -- so the two-test-directories paragraph, the
harness-module names, the JIT-era debt entry's grep command and both exception-map
entries all described a tree that no longer exists.

Angular and Tailwind are migrated; React is not. MIGRATED in
scripts/check-structure.mjs is the authoritative answer to which, and the prose
points at it rather than repeating a fact that can drift.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

## Batch close-out

- [ ] `bun run check` is green with 22 gates and no SKIP.
- [ ] The Angular suites report the **same pass count** recorded in Task 1 Step 1.
- [ ] `git show --stat` on Task 1's commit shows only renames, 0 insertions and 0 deletions.
- [ ] `frameworks/angular/primitives/` no longer exists, and no file anywhere names it outside `CHANGELOG.md`.
- [ ] Rename the spec from `-pending-2` to `-pending-1` and update its header.
- [ ] Delete this plan, per the repo's precedent for an executed plan.
