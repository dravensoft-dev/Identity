# Frameworks File Structure — Batch 1: Tailwind Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Tailwind layer to `frameworks/tailwind/components/<category>/<component>/`, rename every file in that layer to the new convention, and introduce `frameworks/Components.json` and the `check:structure` gate that will hold all three layers to it.

**Architecture:** The move is mechanical and driven by one data file. `frameworks/Components.json` declares each component's category once; a bash loop reads it and emits the `git mv` commands. Every discovery site that today does a single `readdirSync` of one flat directory becomes a recursive walk, shared through one new exported helper so the four consumers cannot drift. `check:structure` is born scoped to the layers already migrated, through a `MIGRATED` list that grows by one entry per batch — the same idiom `COVERED` carries in `check-compliance.mjs`.

**Tech Stack:** Bun (build + test), plain node (portability of every gate), Tailwind v4 CLI, `node:test`/`node:assert` for the gate suites.

## Global Constraints

- **Directories are `kebab-case`, lowercase. Files are `PascalCase`, hyphens removed.** Secondary dotted segments stay `lowerCamelCase` (`Badge.manifest.json`, `Badge.card.html`).
- **Four naming exceptions**, none of them stylistic: `index.ts` (TypeScript directory resolution), `index.html` (served as a directory index), `tsconfig.check.json` / `tsconfig.test.json` (a name toolchains recognise by convention), `.gitkeep` (no stem).
- **English only** — code, comments, docs and commit messages.
- **A commit message containing a backtick is written with a quoted here-doc**, never `git commit -m "…"`. A backtick inside a double-quoted shell string opens command substitution and is silently spliced away. Use `git commit -q -F - <<'MSG' … MSG` and verify with `git log -1 --format=%B`.
- **Every move uses `git mv`.**
- **The move-and-rename commit carries no content change.** Gate fixes land in the commit after it. `bun run check` is red between those two commits, and that is expected: the full sweep is a completion gate, not a per-commit toll.
- **Nothing about behaviour, API contracts, accessibility or tokens changes.** No component gains or loses a member, a binding, an exception or a test. Any suite green before a task is green after it — a task that changes what a suite proves has gone wrong.
- **A gate that grows an exception list grows its suite too.** `scripts/check-dimension-literals.mjs`'s `EXEMPT` is the precedent: its suite asserts on the map by name, so an entry added or removed without touching the suite leaves the tests describing a gate that no longer exists.

---

### Task 1: `frameworks/Components.json`

The data every later task and every later batch reads. No gate yet — the gate arrives in Task 6, once there is a migrated layer for it to check.

**Files:**
- Create: `frameworks/Components.json`
- Create: `scripts/components-categories.test.mjs`

**Interfaces:**
- Produces: `frameworks/Components.json`, an object whose six keys are the category directory names (`brand`, `charts`, `display`, `feedback`, `forms`, `navigation`) and whose values are sorted arrays of PascalCase component names. Fifty names in total, each appearing exactly once. Tasks 2 and 6 read it, and batches 2 and 3 read it unchanged.

- [ ] **Step 1: Write the failing test**

Create `scripts/components-categories.test.mjs`:

```js
/* frameworks/Components.json is the one place a component's category is
 * declared. Every framework layer places its component directory in the
 * category this file names, and check:structure (scripts/check-structure.mjs)
 * is what holds them to it. This suite guards the file's own shape -- that it
 * is well-formed and internally consistent -- which check:structure assumes
 * rather than re-derives. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const categories = JSON.parse(readFileSync(join(repoRoot, 'frameworks/Components.json'), 'utf8'));

test('the six categories are exactly the React component group directories', () => {
  assert.deepEqual(Object.keys(categories).sort(), ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation']);
});

test('every category name is a legal directory name under the new convention', () => {
  for (const name of Object.keys(categories)) assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test('every component name is PascalCase', () => {
  for (const names of Object.values(categories))
    for (const name of names) assert.match(name, /^[A-Z][A-Za-z0-9]*$/, `${name} is not PascalCase`);
});

test('no component is declared in two categories', () => {
  const seen = new Map();
  for (const [category, names] of Object.entries(categories))
    for (const name of names) {
      assert.equal(seen.has(name), false, `${name} is in both ${seen.get(name)} and ${category}`);
      seen.set(name, category);
    }
});

test('each category lists its components sorted, so a diff shows only what moved', () => {
  for (const [category, names] of Object.entries(categories))
    assert.deepEqual(names, [...names].sort(), `${category} is not sorted`);
});

test('the file declares all fifty components', () => {
  const total = Object.values(categories).reduce((n, names) => n + names.length, 0);
  assert.equal(total, 50);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/components-categories.test.mjs`
Expected: FAIL — `ENOENT: no such file or directory, open '.../frameworks/Components.json'`.

- [ ] **Step 3: Create the data file**

Create `frameworks/Components.json`:

```json
{
  "brand": ["AppLogo"],
  "charts": ["BarChart", "ChartCard", "DoughnutChart", "LineChart"],
  "display": [
    "ActivityFeed",
    "Avatar",
    "Badge",
    "Calendar",
    "CalendarEvent",
    "Card",
    "Skeleton",
    "StatCard",
    "Table",
    "TableCell",
    "TableRow",
    "Tag",
    "UnauthCard"
  ],
  "feedback": [
    "Alert",
    "ConfirmDialog",
    "Dialog",
    "EmptyState",
    "ErrorState",
    "Onboarding",
    "ProgressBar",
    "Spinner",
    "Toast",
    "Tooltip"
  ],
  "forms": [
    "Button",
    "Checkbox",
    "IconButton",
    "Input",
    "Radio",
    "RadioGroup",
    "Select",
    "Switch",
    "Textarea"
  ],
  "navigation": [
    "Breadcrumbs",
    "BulkActionBar",
    "CommandPalette",
    "Menu",
    "PageHead",
    "Pagination",
    "SegmentedControl",
    "SideNav",
    "SideNavCollapsible",
    "SideNavItem",
    "SideNavSection",
    "Tab",
    "Tabs"
  ]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/components-categories.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Verify the file agrees with the tree it describes**

Run:

```bash
diff <(bun -e "const c=require('./frameworks/Components.json'); console.log(Object.values(c).flat().sort().join('\n'))") \
     <(ls frameworks/react/components/*/*.jsx | xargs -n1 basename | sed 's/\.jsx$//' | grep -E '^[A-Z]' | sort)
```

Expected: no output. Any line means `Components.json` and React's tree disagree about which components exist — fix `Components.json`, not the tree.

- [ ] **Step 6: Commit**

```bash
git add frameworks/Components.json scripts/components-categories.test.mjs
git commit -q -F - <<'MSG'
feat: declare each component's category once, in frameworks/Components.json

The category of a component is about to be written three times, once per
framework layer, with nothing holding the three together. This file declares
it once; check:structure will hold the layers to it in a later commit.

Its own suite guards the shape check:structure assumes rather than re-derives:
six categories, PascalCase names, no name in two categories, each list sorted,
fifty in total.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 2: Move and rename the Tailwind component tree

Pure `git mv`. No file's content changes, so this commit is reviewable as a rename list. Gates go red here and come back in Tasks 3-5.

**Files:**
- Move: all 114 files under `frameworks/tailwind/components/` into `frameworks/tailwind/components/<category>/<component>/`

**Interfaces:**
- Consumes: `frameworks/Components.json` from Task 1.
- Produces: `frameworks/tailwind/components/<category>/<component-kebab>/<Name>.manifest.json`, `<Name>.manifest.ts`, `<Name>.card.html` for each of the 38 manifests. Tasks 3, 4 and 6 read this shape.

- [ ] **Step 1: Record the pre-move state, so the move can be proved lossless**

Run:

```bash
mkdir -p /tmp/arena-batch1
(cd frameworks/tailwind/components && find . -type f | xargs sha256sum | sed 's|.*/||' | sort) > /tmp/arena-batch1/before.txt
wc -l /tmp/arena-batch1/before.txt
```

Expected: `114 /tmp/arena-batch1/before.txt`. The `sed` drops the directory so the same list can be produced after the move.

- [ ] **Step 2: Move every manifest, module and specimen into its component directory**

The kebab directory name is derived from the PascalCase component name, never from a table:

```bash
cd frameworks/tailwind/components
kebab() { echo "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'; }

bun -e "const c=require('../../Components.json');
for (const [cat, names] of Object.entries(c)) for (const n of names) console.log(cat, n);" |
while read -r cat name; do
  [ -f "$name.manifest.json" ] || continue        # 12 of the 50 have no manifest
  dir="$cat/$(kebab "$name")"
  mkdir -p "$dir"
  for f in "$name.manifest.json" "$name.manifest.ts" "$name.card.html"; do
    [ -f "$f" ] && git mv "$f" "$dir/$f"
  done
done
cd ../../..
```

- [ ] **Step 3: Verify nothing was left behind and nothing was lost**

Run:

```bash
ls frameworks/tailwind/components/*.* 2>/dev/null | wc -l
(cd frameworks/tailwind/components && find . -type f | xargs sha256sum | sed 's|.*/||' | sort) > /tmp/arena-batch1/after.txt
diff /tmp/arena-batch1/before.txt /tmp/arena-batch1/after.txt && echo "IDENTICAL"
ls frameworks/tailwind/components/
```

Expected: `0` for the first command (nothing left at the top level); `IDENTICAL` from the diff — same 114 files, same 114 hashes, only their paths changed; and the six category directories from the last, minus any category whose components all lack a manifest.

- [ ] **Step 4: Confirm the gates are red for the reason expected, not another one**

Run: `bun run check:tailwind`
Expected: FAIL. The manifests are no longer where `compileLayer` looks, so it reports 0 manifests or throws. Read the message and confirm it names the manifest count or the directory — if it fails on something else, stop and investigate before continuing.

- [ ] **Step 5: Commit**

```bash
git add -A frameworks/tailwind/components
git commit -q -F - <<'MSG'
refactor: move the Tailwind layer to components/<category>/<component>/

Pure git mv -- every one of the 114 files keeps its bytes, verified by
comparing sha256 before and after. Each of the 38 manifests now sits with its
generated .manifest.ts and its .card.html specimen in one directory, in the
category frameworks/Components.json assigns it.

The Tailwind gates are red at this commit. The discovery sites still do a
single readdirSync of one flat directory; teaching them to walk is the next
commit, kept separate so this one is reviewable as a rename list.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 3: Teach manifest discovery to walk

Four sites find manifests today, three of them by their own `readdirSync` of one directory. They become one shared recursive walk, so a fifth consumer cannot introduce a fourth spelling.

**Files:**
- Modify: `scripts/lib/tailwind-compile.mjs` — `entryStylesheet` (line 63) and `compileLayer` (line 71)
- Modify: `scripts/build-tailwind.mjs` — `buildManifestModules` (line ~66)
- Modify: `scripts/check-radius-tokens.mjs` — its own `readdirSync` (line ~80)
- Modify: `scripts/check-manifest-states.mjs` — `readdirSync(COMPONENTS_DIR)` (line 271)
- Modify: `scripts/check-tailwind.mjs` — `checkCompiled`'s message, which now receives a path rather than a basename
- Test: `scripts/tailwind-compile.test.mjs`

**Interfaces:**
- Produces: `manifestFiles(componentsDir)` exported from `scripts/lib/tailwind-compile.mjs`, returning **absolute paths**, sorted. `compileLayer`'s returned `manifests` Map is re-keyed from basename (`"Badge.manifest.json"`) to **repo-relative path** (`"frameworks/tailwind/components/display/badge/Badge.manifest.json"`). Every consumer that printed the key now prints a path, which is strictly more useful in a nested tree; a consumer that needs the bare name calls `basename(key)`.

- [ ] **Step 1: Write the failing test**

Add to `scripts/tailwind-compile.test.mjs`:

```js
test('manifestFiles walks the nested component tree and finds every manifest', () => {
  const dir = join(repoRoot, 'frameworks/tailwind/components');
  const found = manifestFiles(dir);
  assert.equal(found.length, 38);
  for (const p of found) assert.match(p, /\/components\/[a-z-]+\/[a-z-]+\/[A-Z][A-Za-z]*\.manifest\.json$/);
  assert.deepEqual(found, [...found].sort(), 'the walk returns a stable, sorted order');
});

test('manifestFiles finds nothing at the old flat level, so a stale file cannot be picked up twice', () => {
  const dir = join(repoRoot, 'frameworks/tailwind/components');
  const flat = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.manifest.json'));
  assert.deepEqual(flat, []);
});

test('compileLayer keys its manifests by repo-relative path, not by basename', () => {
  const { manifests } = compileLayer();
  assert.equal(manifests.size, 38);
  for (const key of manifests.keys())
    assert.match(key, /^frameworks\/tailwind\/components\/[a-z-]+\/[a-z-]+\/[A-Z][A-Za-z]*\.manifest\.json$/);
});
```

Add `manifestFiles` to the existing import at the top of that file, and add `readdirSync` from `node:fs` plus `join` from `node:path` if the file does not already import them.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/tailwind-compile.test.mjs`
Expected: FAIL — `manifestFiles is not a function`.

- [ ] **Step 3: Add the walk and re-key the Map**

In `scripts/lib/tailwind-compile.mjs`, add `basename`, `relative` to the `node:path` import and export the walk:

```js
/** Every manifest under the Tailwind components tree, as absolute paths, sorted.
 *
 *  This replaced a single `readdirSync(components)` when the layer moved to
 *  components/<category>/<component>/. It is exported rather than repeated
 *  because three other gates found manifests by their own readdirSync of that
 *  one directory, and three spellings of the same walk is how one of them ends
 *  up missing a category nobody remembers to add.
 *  @param {string} componentsDir @returns {string[]} */
export function manifestFiles(componentsDir) {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.manifest.json')) out.push(p);
    }
  };
  walk(componentsDir);
  return out.sort();
}
```

Change `entryStylesheet`'s `@source` glob so Tailwind scans the nested tree:

```js
export function entryStylesheet(preset, components, extra) {
  return `@import '${preset}' source(none);\n@source '${components}/**/*.manifest.json';\n`
    + (extra ? `@source '${extra}';\n` : '');
}
```

And in `compileLayer`, replace the manifest loop:

```js
  const manifests = new Map();
  for (const p of manifestFiles(components))
    manifests.set(relative(root, p), JSON.parse(readFileSync(p, 'utf8')));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/tailwind-compile.test.mjs`
Expected: PASS.

- [ ] **Step 5: Update the three other discovery sites**

In `scripts/build-tailwind.mjs`, `buildManifestModules` must write each `.ts` beside its own `.json` rather than in one flat directory. The Map key is now a repo-relative path, so the sibling path falls out of it:

```js
export function buildManifestModules(opts = {}) {
  const { manifests } = compileLayer(opts);
  const root = opts.root ?? repoRoot;
  const out = new Map();
  for (const [file, manifest] of manifests)
    out.set(join(root, file.replace(/\.json$/, '.ts')), manifestModule(manifest, basename(file)));
  return out;
}
```

`manifestModule`'s second argument is the banner's "actual source" name, so it keeps taking the bare filename — hence `basename(file)`. Add `basename` to that file's `node:path` import.

In `scripts/check-radius-tokens.mjs`, replace its `readdirSync(COMPONENTS_DIR)` loop with the shared walk, importing `manifestFiles` from `./lib/tailwind-compile.mjs`, and use `basename(p)` wherever the old code used the bare filename in a message.

In `scripts/check-manifest-states.mjs`, do the same at line 271: `const manifestFiles_ = manifestFiles(COMPONENTS_DIR);` then read each with `readFileSync(p, 'utf8')` and derive the component name with `basename(p).replace(/\.manifest\.json$/, '')`. Leave `SOURCE_OVERRIDES` alone — it names React and Angular paths, which this batch does not move.

In `scripts/check-tailwind.mjs`, `checkCompiled` iterates `[file, manifest]` and puts `file` in its error messages. No code change is required — the messages now carry a path instead of a basename, which is correct. Read them once to confirm none of them concatenates `file` into a path of its own.

- [ ] **Step 6: Run the four gates**

Run:

```bash
bun run check:tailwind && bun run check:radius && bun run check:states && bun run build:tailwind && bun run check:tailwind-generated
```

Expected: all pass. `check:tailwind` reports 38 manifests. `build:tailwind` writes each `.manifest.ts` next to its `.json` — confirm with `git status --short frameworks/tailwind/components | head`, which should show **no** changes if the moved `.ts` files were already correct, since their content does not depend on their location.

- [ ] **Step 7: Run the script suite, which must be green as a whole**

Run: `bun test scripts`
Expected: PASS. `tv-merge.test.mjs` and `manifest-classes.test.mjs` also consume this layer; if either fails, its expectation of a flat directory is the thing to fix, not the walk.

- [ ] **Step 8: Commit**

```bash
git add scripts/
git commit -q -F - <<'MSG'
fix: find Tailwind manifests by walking, not by reading one directory

Four sites found manifests, three of them by their own readdirSync of the one
flat components/ directory. They now share manifestFiles() from
scripts/lib/tailwind-compile.mjs, because three spellings of one walk is how
one of them ends up missing a category nobody remembers to add.

compileLayer's manifests Map is re-keyed from basename to repo-relative path.
Every consumer that printed the key now prints a path, which in a nested tree
is strictly more useful; the two that needed the bare name call basename().

entryStylesheet's @source glob gains the ** it now needs, so Tailwind still
scans every manifest as content.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 4: Repoint everything the move broke

Two families of reference point at where the manifests used to be. Each `*.card.html` descended two levels, so every root-relative `../` count in it is short by two. **`check:cards` catches less of that than it looks**: it renders each page in a real headless browser, but the only status it *fails* on is `clip`, so a broken **script** path leaves `#root` empty and reports as `unrendered` — which exits 2, and `check-all` marks SKIP and the run INCOMPLETE rather than failed, unless `ARENA_CHECK_STRICT=1` or `CI=true` — while a broken **stylesheet** path is not caught at all, because the page still renders and an unstyled specimen that fits its declared box passes outright. So run the gate, but treat a by-hand `bun run demos` pass over the specimens as the real check. And **17 Angular `.variants.ts` recipes import a manifest by the pre-move flat path**, so the Angular layer has not compiled since Task 2.

> **Amended after Task 3.** This task was written as the specimen fix alone. The Angular half was found by Task 3's implementer, which reported `build:angular-tests` failing at bare HEAD, and confirmed by the controller: `frameworks/angular/primitives/<name>/<name>.variants.ts` each carry `import manifest from '../../../tailwind/components/<Name>.manifest'`. Neither the spec nor this plan covered them — the spec's batch-1 paragraph says the batch "reaches outside its own layer once", for `tv.ts`, and it reaches out twice. Both halves are the same defect: a reference to a path Task 2 moved, so they are fixed in one task rather than split.

**Files:**
- Modify: all 38 `frameworks/tailwind/components/<category>/<component>/<Name>.card.html`
- Modify: the 17 `frameworks/angular/primitives/<name>/<name>.variants.ts` that import a Tailwind manifest

**Interfaces:**
- Consumes: the tree from Task 2.
- Produces: nothing new. `check:cards` green over the moved specimens, and `check:angular` / `test:angular` green again.

- [ ] **Step 1: See the failure before fixing it**

Run: `bun run check:cards`
Expected: FAIL, naming the Tailwind specimens. If `CHROME_PATH` is unset and no Chromium is on the usual paths the gate exits 2 and reports SKIP instead — in that case set `CHROME_PATH` before continuing, because this task cannot be verified without it.

- [ ] **Step 2: Rewrite the four reference kinds**

Every specimen head carries exactly four references plus one `fetch`. From `components/<category>/<component>/` the repo root is five levels up and the layer root is three:

```bash
cd frameworks/tailwind/components
for f in */*/*.card.html; do
  sed -i \
    -e 's|"\.\./\.\./\.\./styles\.css"|"../../../../../styles.css"|' \
    -e 's|"\.\./utilities\.css"|"../../../utilities.css"|' \
    -e 's|"\.\./specimen\.css"|"../../../specimen.css"|' \
    -e "s|'\.\./specimen\.js'|'../../../specimen.js'|" \
    "$f"
done
cd ../../..
```

The `fetch('./<Name>.manifest.json')` in each page needs no change: the manifest moved with the page and is still its sibling.

- [ ] **Step 3: Verify no stale reference survived**

Run:

```bash
grep -rn '"\.\./\.\./\.\./styles\.css"\|"\.\./utilities\.css"\|"\.\./specimen\.css"\|'"'"'\.\./specimen\.js'"'"'' frameworks/tailwind/components/ | head
```

Expected: no output. Every alternative is quote-delimited on both sides, including
`specimen.js`'s — an unquoted `\.\./specimen\.js` alternative matches as a trailing
*substring* of the correctly-rewritten `'../../../specimen.js'` (three `../` still end
in `../specimen.js`), so it would report a false positive against every one of the 38
already-fixed pages rather than against none. Quoting on both sides is what makes a hit
mean what Step 2's `sed` means by a match: the whole attribute value, not a suffix of a
longer one. Any real hit is a page the `sed` did not match — open it and fix by hand
rather than widening the pattern, since an unmatched page usually means it references
something the other 37 do not.

- [ ] **Step 4: Run the cards gate**

Run: `bun run check:cards`
Expected: PASS. This renders every declaring page in the repo, not only the Tailwind ones. **A pass is weaker evidence than it reads as**: the gate fails only on content over-running the declared box, so it confirms no page clips — not that every page still loads its stylesheets or its script. A page whose script path is broken reports `unrendered`, which is a SKIP and an INCOMPLETE run rather than a failure; a page whose stylesheet path is broken passes. Open a few specimens with `bun run demos` before treating this step as done.

- [ ] **Step 5: See the Angular breakage before fixing it**

Run: `bun run build:angular-tests`
Expected: FAIL, with `ngc` reporting that it cannot resolve `../../../tailwind/components/<Name>.manifest` from one or more `.variants.ts` files. This has been broken since Task 2 and is not a regression from Tasks 3 or 4.

Enumerate the affected files:

```bash
grep -rln "tailwind/components/[A-Z]" frameworks/angular --include='*.ts' | sort
```

Expected: 17 paths, all of the form `frameworks/angular/primitives/<name>/<name>.variants.ts`.

- [ ] **Step 6: Repoint each manifest import at its component directory**

The manifest now lives at `tailwind/components/<category>/<component-kebab>/<Name>.manifest`, and the importer is at `frameworks/angular/primitives/<name>/`, so the hop count is unchanged — only the tail of the path grows. Derive the category and kebab directory the same deterministic way Task 2 did, from `frameworks/Components.json`:

```bash
bun -e '
const { readFileSync, readdirSync, writeFileSync } = require("fs");
const cats = JSON.parse(readFileSync("frameworks/Components.json", "utf8"));
const where = new Map();
for (const [cat, names] of Object.entries(cats))
  for (const n of names) where.set(n, cat + "/" + n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase());
for (const d of readdirSync("frameworks/angular/primitives", { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const p = `frameworks/angular/primitives/${d.name}/${d.name}.variants.ts`;
  let src; try { src = readFileSync(p, "utf8"); } catch { continue; }
  const out = src.replace(/tailwind\/components\/([A-Z][A-Za-z0-9]*)\.manifest/g,
    (m, name) => where.has(name) ? `tailwind/components/${where.get(name)}/${name}.manifest` : m);
  if (out !== src) { writeFileSync(p, out); console.log("repointed", p); }
}'
```

Expected: 17 `repointed` lines.

- [ ] **Step 7: Verify no stale manifest import survives, and that none was mangled**

Run:

```bash
grep -rn "tailwind/components/[A-Z]" frameworks/angular --include='*.ts'
git diff --stat frameworks/angular
```

Expected: no output from the first command — every remaining import names a category directory, so none matches `components/<Capital>`. The second must show 17 files, one changed line each. **More than one changed line in any file means the rewrite touched something it should not have** — inspect and revert that file by hand.

- [ ] **Step 8: Run the Angular gates**

Run: `bun run check:angular && bun run build:angular-tests && bun run test:angular`
Expected: all pass. `build:angular-tests` compiles the barrel and the whole test surface with `ngc --strictTemplates`, so an unresolved specifier fails the build outright with no test in that run executing — a green build is what proves all 17 specifiers resolve.

- [ ] **Step 9: Commit**

```bash
git add frameworks/tailwind/components frameworks/angular
git commit -q -F - <<'MSG'
fix: repoint everything the Tailwind move broke

Two families of reference pointed at where the manifests used to be.

The 38 specimens reference styles.css by repo-root-relative path and
utilities.css, specimen.css and specimen.js by layer-relative path, so every
../ count was short by two after their two-level descent. The fetch of each
page's own manifest needed no change -- it moved with the page and is still
its sibling. check:cards renders every declaring page in headless Chromium at
its declared viewport, but it fails only on content over-running the declared
box: a broken script path reports unrendered, which is a SKIP and an
INCOMPLETE run rather than a failure, and a broken stylesheet path is not
caught at all. The specimens were opened by hand with bun run demos.

The 17 Angular .variants.ts recipes import a manifest by the pre-move flat
path and have not compiled since the move. This half was not in the plan: the
design said this batch reaches outside its own layer once, for tv.ts, and it
reaches out twice. Found by the implementer of the previous task, which
reported build:angular-tests failing at bare HEAD.

Both halves are one defect -- a reference to a path the move invalidated --
so they are fixed together rather than split across two commits.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 5: Rename the Tailwind layer-root files

The naming rule reaches the whole of `frameworks/`, so the layer's own files move too. This is the one task in Batch 1 that edits another layer: 19 Angular files import `tv` by extensionless specifier and would stop resolving.

**Files:**
- Rename: `frameworks/tailwind/{tv.ts,manifest-classes.js,theme.css,utilities.css,animations.css,specimen.css,specimen.js}` → `{Tv.ts,ManifestClasses.js,Theme.css,Utilities.css,Animations.css,Specimen.css,Specimen.js}`
- Modify: 19 files under `frameworks/angular/` importing `../../../tailwind/tv`
- Modify: `frameworks/angular/theme/arena-tailwind.css`, `frameworks/angular/test/host-class-binding.test.ts`
- Modify: `scripts/lib/tailwind-compile.mjs`, `scripts/build-tailwind.mjs`, `scripts/check-tailwind-generated.mjs`, `scripts/check-tailwind-coverage.mjs`, `scripts/check-radius-tokens.mjs`, `scripts/check-arbitrary-values.mjs`, `scripts/tailwind-compile.test.mjs`, `scripts/tv-merge.test.mjs`, `scripts/manifest-classes.test.mjs`
- Modify: the 38 specimen pages again, for `Utilities.css` / `Specimen.css` / `Specimen.js`
- Modify: `frameworks/tailwind/README.md`, `frameworks/angular/README.md`

**Interfaces:**
- Produces: `frameworks/tailwind/Tv.ts` exporting the same configured `tv` under the same name. Batch 2 imports it as `'../../../../tailwind/Tv'` from the deeper Angular tree; the specifier's `../` count changes there, not here.

- [ ] **Step 1: Enumerate every reference before touching anything**

Run:

```bash
grep -rn "tailwind/tv\|manifest-classes\|theme\.css\|utilities\.css\|animations\.css\|specimen\.css\|specimen\.js" \
  --include='*.ts' --include='*.js' --include='*.mjs' --include='*.css' --include='*.html' --include='*.md' \
  frameworks/ scripts/ | grep -v node_modules | tee /tmp/arena-batch1/refs.txt | wc -l
```

Keep `/tmp/arena-batch1/refs.txt`. Step 4 re-runs this and the two lists are compared.

- [ ] **Step 2: Rename the seven files**

```bash
cd frameworks/tailwind
git mv tv.ts Tv.ts
git mv manifest-classes.js ManifestClasses.js
git mv theme.css Theme.css
git mv utilities.css Utilities.css
git mv animations.css Animations.css
git mv specimen.css Specimen.css
git mv specimen.js Specimen.js
cd ../..
```

- [ ] **Step 3: Update every reference**

```bash
grep -rlZ "tailwind/tv\|manifest-classes\|theme\.css\|utilities\.css\|animations\.css\|specimen\.css\|specimen\.js" \
  --include='*.ts' --include='*.js' --include='*.mjs' --include='*.css' --include='*.html' --include='*.md' \
  frameworks/ scripts/ | xargs -0 sed -i \
  -e 's|tailwind/tv|tailwind/Tv|g' \
  -e 's|manifest-classes\.js|ManifestClasses.js|g' \
  -e 's|\btheme\.css|Theme.css|g' \
  -e 's|\butilities\.css|Utilities.css|g' \
  -e 's|\banimations\.css|Animations.css|g' \
  -e 's|\bspecimen\.css|Specimen.css|g' \
  -e 's|\bspecimen\.js|Specimen.js|g'
```

Then read the diff of `frameworks/angular/theme/arena-tailwind.css` and `frameworks/react/` by hand:

```bash
git diff --stat
git diff frameworks/angular/theme/arena-tailwind.css
```

`arena-tailwind.css` imports the Tailwind preset and must now name `Theme.css`. **`frameworks/react/` must show no changes at all** — if it does, the `theme.css` pattern matched React's own `theme.js` or a token file, and that hit must be reverted by hand.

- [ ] **Step 4: Verify the reference count did not change**

Run:

```bash
grep -rn "tailwind/Tv\|ManifestClasses\|Theme\.css\|Utilities\.css\|Animations\.css\|Specimen\.css\|Specimen\.js" \
  --include='*.ts' --include='*.js' --include='*.mjs' --include='*.css' --include='*.html' --include='*.md' \
  frameworks/ scripts/ | grep -v node_modules | wc -l
wc -l < /tmp/arena-batch1/refs.txt
```

Expected: the two numbers are equal. A smaller number means a reference was missed and now points at a file that does not exist.

- [ ] **Step 5: Confirm nothing still names an old path**

Run:

```bash
grep -rn "tailwind/tv'\|/manifest-classes\|/theme\.css\|/utilities\.css\|/animations\.css\|/specimen\.css\|/specimen\.js" \
  frameworks/ scripts/ | grep -v node_modules
```

Expected: no output.

- [ ] **Step 6: Run every gate this touches**

Run:

```bash
bun run build:tailwind && bun run check:tailwind && bun run check:tailwind-generated \
  && bun run check:coverage && bun run check:radius && bun run check:arbitrary \
  && bun run check:states && bun run check:angular && bun run check:cards \
  && bun test scripts && bun run test:angular
```

Expected: all pass. `check:angular` and `test:angular` are what prove the 19 Angular import specifiers still resolve — a broken one fails the `ngc` compile outright, with no test in that run executing.

- [ ] **Step 7: Commit**

```bash
git add -A frameworks scripts
git commit -q -F - <<'MSG'
refactor: rename the Tailwind layer-root files to the new convention

The naming rule reaches the whole of frameworks/, so tv.ts, manifest-classes.js
and the five stylesheets follow their own layer.

This is the one commit in this batch that edits Angular. Nineteen .variants.ts
files import tv by extensionless specifier and would simply stop resolving;
arena-tailwind.css imports the preset by name, and one Angular test names
utilities.css. Deferring these to batch 2 was rejected -- it would leave one
layer half-renamed across a batch boundary, which is worse than one mechanical
string edit reaching across.

check:angular and test:angular are what prove the specifiers still resolve: a
broken one fails the ngc compile outright, with no test in that run executing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 6: The `check:structure` gate

Gate 22. It is born scoped to the one migrated layer, through a `MIGRATED` list that grows by one entry per batch and is deleted in Batch 3 when every layer is in.

**Files:**
- Create: `scripts/check-structure.mjs`
- Create: `scripts/check-structure.test.mjs`
- Modify: `package.json` — add `check:structure`
- Modify: `scripts/check-all.mjs` — add to `GATES` and correct the "twenty-one gates" header
- Modify: `scripts/check-all.test.mjs` — the assertion that pins `GATES`

**Interfaces:**
- Consumes: `frameworks/Components.json` from Task 1.
- Produces: `validateStructure({ categories, layers })` exported from `scripts/check-structure.mjs`, returning `string[]` of problems (empty when clean), and `MIGRATED`, an array of layer names. Batch 2 pushes `'angular'`; Batch 3 pushes `'react'` and then removes the constant.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-structure.test.mjs`:

```js
/* check:structure asserts that every framework layer places a component
 * directory in the category frameworks/Components.json assigns it. It does
 * NOT assert the category is the right one -- that is editorial judgement and
 * no gate has it. A green run is a consistency claim, never a taxonomy one. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStructure, MIGRATED } from './check-structure.mjs';

const categories = { display: ['Badge', 'Tag'], forms: ['Button'] };

test('a tree that matches the declaration has no problems', () => {
  const layers = { tailwind: { display: ['badge', 'tag'], forms: ['button'] } };
  assert.deepEqual(validateStructure({ categories, layers }), []);
});

test('a component in the wrong category is named, with both categories', () => {
  const layers = { tailwind: { forms: ['badge'] } };
  const problems = validateStructure({ categories, layers });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Badge/);
  assert.match(problems[0], /forms/);
  assert.match(problems[0], /display/);
});

test('a directory no category declares is a problem', () => {
  const layers = { tailwind: { display: ['badge', 'sparkline'] } };
  const problems = validateStructure({ categories, layers });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /sparkline/);
});

test('a layer carrying only some categories is fine -- Angular has no forms/', () => {
  const layers = { angular: { display: ['tag'] } };
  assert.deepEqual(validateStructure({ categories, layers }), []);
});

test('a declared component missing from every layer is a problem once every layer is in', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  const problems = validateStructure({ categories, layers, complete: true });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Button/);
});

test('the same tree is clean while layers are still unmigrated', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  assert.deepEqual(validateStructure({ categories, layers }), [],
    'a component absent from the migrated layers may simply live in one this gate does not yet reach');
});

test('a directory that is not kebab-case is a problem, even in the right category', () => {
  const layers = { tailwind: { display: ['Badge'] } };
  const problems = validateStructure({ categories, layers });
  assert.ok(problems.some((p) => /Badge/.test(p) && /kebab/.test(p)));
});

test('MIGRATED names the layers this gate currently reaches', () => {
  assert.deepEqual(MIGRATED, ['tailwind']);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/check-structure.test.mjs`
Expected: FAIL — cannot resolve `./check-structure.mjs`.

- [ ] **Step 3: Write the gate**

Create `scripts/check-structure.mjs`:

```js
/* Fails when a framework layer places a component directory in a category
 * frameworks/Components.json does not assign it, when a component directory
 * exists that no category declares, or when a declared component exists in no
 * layer at all.
 *
 * WHAT THIS DOES NOT CHECK, and it is the interesting half: whether the
 * category is the RIGHT one. "Is Tooltip feedback or navigation?" is editorial
 * judgement and no gate has it. A green run here says the three layers agree
 * with one declaration -- never that the declaration is well taxonomised, and
 * never that a component directory contains a complete component. check:api
 * and check:behaviour are what hold the latter.
 *
 * MIGRATED is the layers this gate reaches. It exists because the structure
 * refactor lands one layer per batch, and a gate that silently passed over an
 * unmigrated layer would be worse than one that says which layers it is
 * claiming anything about. It grows by one entry per batch and is deleted
 * outright when the last layer lands, at which point the gate covers every
 * layer unconditionally.
 *
 *   bun scripts/check-structure.mjs   -> exit 0 clean, 1 with problems listed
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The layers this gate claims anything about. See the header. */
export const MIGRATED = ['tailwind'];

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The kebab directory name a PascalCase component name derives to.
 *  Deterministic, so the mapping is a function and never a table.
 *  @param {string} name e.g. "ActivityFeed" @returns {string} e.g. "activity-feed" */
export function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Read one layer's tree as category -> component directory names.
 *  @param {string} layer @returns {Record<string, string[]>} */
export function readLayer(layer) {
  const base = join(repoRoot, 'frameworks', layer, 'components');
  if (!existsSync(base)) return {};
  const out = {};
  for (const cat of readdirSync(base, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    out[cat.name] = readdirSync(join(base, cat.name), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  }
  return out;
}

/** @param {{categories: Record<string,string[]>,
 *           layers: Record<string,Record<string,string[]>>,
 *           complete?: boolean}} input
 *  `complete` says every layer is migrated. Until it is true the
 *  "declared but present nowhere" rule is held back, because a component
 *  absent from the migrated layers may simply live in one this gate does not
 *  yet reach -- which would make the gate loudest about the thing the refactor
 *  has not got to yet.
 *  @returns {string[]} one line per problem, empty when clean */
export function validateStructure({ categories, layers, complete = false }) {
  const problems = [];
  const declared = new Map();          // kebab dir -> {name, category}
  for (const [category, names] of Object.entries(categories))
    for (const name of names) declared.set(kebab(name), { name, category });

  const seen = new Set();
  for (const [layer, tree] of Object.entries(layers))
    for (const [category, dirs] of Object.entries(tree))
      for (const dir of dirs) {
        if (!KEBAB.test(dir)) {
          problems.push(`${layer}: components/${category}/${dir} is not a kebab-case directory name`);
          continue;
        }
        const d = declared.get(dir);
        if (!d) {
          problems.push(`${layer}: components/${category}/${dir} is a component directory frameworks/Components.json does not name`);
          continue;
        }
        seen.add(d.name);
        if (d.category !== category)
          problems.push(`${layer}: ${d.name} is in components/${category}/ but frameworks/Components.json assigns it to ${d.category}`);
      }

  if (complete)
    for (const { name } of declared.values())
      if (!seen.has(name))
        problems.push(`${name} is declared in frameworks/Components.json but exists in no layer`);

  return problems;
}

function main() {
  const categories = JSON.parse(readFileSync(join(repoRoot, 'frameworks/Components.json'), 'utf8'));
  const layers = Object.fromEntries(MIGRATED.map((l) => [l, readLayer(l)]));
  const problems = validateStructure({ categories, layers, complete: MIGRATED.length === 3 });

  if (problems.length) {
    console.error('check:structure — a layer does not match frameworks/Components.json:\n');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
  }
  const total = Object.values(categories).reduce((n, names) => n + names.length, 0);
  console.log(`check:structure OK — ${MIGRATED.join(', ')} place every component directory where frameworks/Components.json says (${total} declared).`);
  console.log('  (A green run says the layers agree with one declaration, never that the categories are well chosen.)');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/check-structure.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run the gate against the real tree**

Run: `bun scripts/check-structure.mjs`
Expected: PASS, reporting that `tailwind` places every component directory where the declaration says, with 50 declared.

Then prove the `complete` guard is load-bearing rather than decorative, because a rule nobody has watched fire is a rule nobody knows works. Temporarily change `MIGRATED.length === 3` to `true` in `main()` and re-run:

```bash
bun scripts/check-structure.mjs 2>&1 | grep -c "exists in no layer"
```

Expected: `12` — the twelve components Tailwind has no manifest for, correctly reported once the gate believes every layer is in, and correctly silent while it does not. **Revert the edit** and confirm with `git diff scripts/check-structure.mjs` showing no change before continuing.

- [ ] **Step 6: Wire the gate in**

In `package.json`, add to `scripts`, after `check:states`:

```json
    "check:structure": "bun scripts/check-structure.mjs",
```

In `scripts/check-all.mjs`, add to `GATES` after the `check:states` entry:

```js
  { name: 'check:structure', file: 'check-structure.mjs' },
```

and change the header's "The twenty-one gates in GATES below" to "The twenty-two gates in GATES below".

In `scripts/check-all.test.mjs`, update the assertion that pins `GATES` — find it with `grep -n "GATES" scripts/check-all.test.mjs` — so its expected list carries the new entry in the same position.

- [ ] **Step 7: Run the full sweep**

Run: `bun run check`
Expected: every gate passes and the run reports 22 gates. If `check:cards`, `check:vendor` or `check:demos` reports SKIP, the run is INCOMPLETE rather than green — set `CHROME_PATH` and re-run under Bun before treating this task as done.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-structure.mjs scripts/check-structure.test.mjs scripts/check-all.mjs scripts/check-all.test.mjs package.json
git commit -q -F - <<'MSG'
feat: check:structure holds every layer to frameworks/Components.json

Gate 22. It asserts that a component directory sits in the category the
declaration assigns it, that no directory exists the declaration does not
name, and that a directory name is kebab-case.

What it deliberately does not assert is whether the category is the RIGHT one.
That is editorial judgement and no gate has it, so its header says as plainly
as check:behaviour's does that a green run is a consistency claim and never a
taxonomy one.

MIGRATED scopes it to the layers this refactor has actually moved, and the
"declared but present nowhere" rule is held back until all three are in --
until then, a component absent from the migrated layers may simply live in one
the gate does not yet reach. The constant grows by one entry per batch and is
deleted when the last layer lands.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

### Task 7: Update the prose

`CLAUDE.md` describes the Tailwind layer's shape in several places and is the file a future reader trusts. Prose that describes a tree that no longer exists is the main risk this refactor carries.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `frameworks/tailwind/README.md`
- Modify: `README.md` if it names any moved path

**Interfaces:**
- Consumes: everything Tasks 1-6 built.
- Produces: nothing executable.

- [ ] **Step 1: Find every claim about the moved paths**

Run:

```bash
grep -rn "tailwind/components\|tailwind/tv\|manifest-classes\|frameworks/tailwind/[a-z]" \
  --include='*.md' . | grep -v node_modules | grep -v CHANGELOG.md
```

`CHANGELOG.md` is excluded deliberately: it is a frozen record of what shipped at a tag and must never be back-edited.

- [ ] **Step 2: Rewrite each hit**

Work through the list. In `CLAUDE.md`, at minimum:

- the `frameworks/tailwind/` description under *Architecture* — `components/` is now `components/<category>/<component>/`, and the layer-root files are PascalCase;
- the *Where the rest of the debt lives* entry for `scripts/check-manifest-states.mjs`, whose `SOURCE_OVERRIDES` description is unchanged but whose sibling `readdirSync` claim is not;
- the sentence about the `*.card.html` specimens staying clean structurally — still true, and their path is not;
- the gate count, which moves from twenty-one to twenty-two in every place it is written. Find them with `grep -n "twenty-one\|21 gates\|twenty-four\|24 steps" CLAUDE.md` and correct each, including the step count, which moves from 24 to 25.

Add a paragraph under *Architecture* stating the new structure rule and naming `frameworks/Components.json` as its declaration, with the four naming exceptions and their mechanical reasons. Say plainly that only Tailwind is migrated so far and that `MIGRATED` in `check-structure.mjs` is where to read which layers the gate currently claims anything about — a reader meeting the new shape in one layer and the old in two others must not have to guess whether that is intentional.

- [ ] **Step 3: Verify no doc still names a path that does not exist**

Run:

```bash
for p in $(grep -rhoP '(?<=`)frameworks/tailwind/[A-Za-z0-9_./-]+(?=`)' --include='*.md' . | grep -v node_modules | sort -u); do
  [ -e "$p" ] || echo "MISSING: $p"
done
```

Expected: no output. A `MISSING:` line is a doc naming a file that no longer exists — fix the doc.

- [ ] **Step 4: Run the full sweep one more time**

Run: `bun run check`
Expected: green, 22 gates, no SKIP.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md README.md frameworks/tailwind/README.md
git commit -q -F - <<'MSG'
docs: describe the Tailwind layer's new shape

CLAUDE.md is the file a future reader trusts, and prose describing a tree that
no longer exists is the main risk this refactor carries. Every claim about
frameworks/tailwind/ paths is rewritten, the gate count moves from twenty-one
to twenty-two and the step count from 24 to 25, and a new paragraph states the
structure rule, its four mechanical naming exceptions, and where to read which
layers check:structure currently reaches.

That last part matters more than it looks: with one layer migrated and two not,
a reader meeting two different shapes must not have to guess whether the
difference is intentional. MIGRATED is the answer and the prose points at it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
git log -1 --format=%B | head -3
```

---

## Batch close-out

- [ ] `bun run check` is green with 22 gates and no SKIP.
- [ ] `git log --oneline` shows seven commits, and the second of them (`refactor: move the Tailwind layer…`) shows only renames under `git show --stat`.
- [ ] `bun run demos` serves the tree and every `frameworks/tailwind/components/<category>/<component>/<Name>.card.html` renders its specimen — spot-check three by hand, one from a category with many components and two from categories with few.
- [ ] Rename this plan's spec from `-pending-3` to `-pending-2`.
