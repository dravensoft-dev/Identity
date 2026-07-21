# Angular Material bridge — repair and gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `frameworks/angular/theme/arena-material.css` actually theme Angular Material again, and add the gate that stops it rotting silently a second time.

**Architecture:** Three tasks in a deliberate order. The gate is built **first**, against a tree it is known to reject — so its non-vacuousness is proven by construction rather than argued, and its failure output becomes the rename worklist. The renames then turn it green. Documentation lands last, because it can only describe a bridge that works once one exists.

**Tech Stack:** Bun, `node:test` + `node:assert/strict`, `@angular/material` 22.0.5 as a devDependency, the existing `scripts/lib/css-decls.mjs` parser.

**Source spec:** `docs/superpowers/specs/2026-07-21-5c-angular-material-bridge-design.md`.

## Global Constraints

- **Bun, never npm or node** for running scripts and tests (`bun run …`, `bun test`).
- **English only, no emoji**, in code, comments, docs and output.
- **This plan changes no token and no value.** Every right-hand side in the bridge is already a `var(--…)` into an existing Arena token and stays exactly as it is. Only property *names* change.
- **No release cut.** Do not touch the version string in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` or the README header, and create no tag. CHANGELOG entries go under `## [Unreleased]`.
- **Never hand-edit generated output:** `tokens/*.css`, `frameworks/tailwind/utilities.css`, `frameworks/tailwind/components/*.manifest.ts`.
- **`frameworks/react/` is byte-unchanged by this plan.**
- The bridge targets **Angular Material 22.0.5**, which pairs with the repo's `@angular/core@22.0.7` (Material 22.0.5's `peerDependencies` accept `^22.0.0 || ^23.0.0`).

---

## File structure

| File | Responsibility |
|---|---|
| `package.json` | Gains `@angular/material` as a devDependency — the thing that makes any of this verifiable. |
| `scripts/check-material.mjs` | **New.** Pure exported functions plus a `main()`, matching `scripts/check-fonts-generated.mjs`'s shape. Asserts the bridge's property names exist in the installed Material package, and that every Arena token it references exists. |
| `scripts/check-material.test.mjs` | **New.** Proves the gate rejects a fabricated Material property and a fabricated Arena token — the tree passes today on the second check, so only a fabricated input can prove that half is real. |
| `scripts/check-all.mjs` | Registers the gate. Thirteen gates become fourteen; fourteen steps become fifteen. |
| `CLAUDE.md` | Its "runs all thirteen plus the test suite" sentence becomes fourteen. |
| `frameworks/angular/theme/arena-material.css` | The 24 renames. |
| `frameworks/angular/README.md` | The known-issue block becomes a supported statement naming the target version. |
| `CHANGELOG.md` | The `[Unreleased]` known issue becomes a fix. |

---

## Task 1: The gate, failing

**Files:**
- Modify: `package.json`
- Create: `scripts/check-material.mjs`
- Create: `scripts/check-material.test.mjs`
- Modify: `scripts/check-all.mjs`
- Modify: `CLAUDE.md`

**Interfaces:**
- Produces, all from `scripts/check-material.mjs`:
  - `bridgeProperties(css: string): Set<string>` — every `mat-*`/`mdc-*` custom property the bridge **declares**, without the `--` prefix.
  - `referencedTokens(css: string): Set<string>` — every Arena token name the bridge **references** through `var(--…)`, without the `--` prefix.
  - `materialProperties(dir: string): Set<string>` — every `mat-*`/`mdc-*` custom property name the installed Material package mentions, without the `--` prefix.
  - `arenaTokenNames(root: string): Set<string>` — the four generated token files plus `tokens/colors.css`.
  - `checkBridge(bridgeCss: string, materialProps: Set<string>, arenaTokens: Set<string>): string[]` — one message per problem, empty when clean.

**This task ends with `bun run check` FAILING, and that is the deliverable.** A gate whose only observed behaviour is passing has not been shown to work. Task 2 turns it green.

- [ ] **Step 1: Add the devDependency**

`@angular/material` is dev-only, like the rest of this repo's tooling — nothing is published from here. Pin it exactly, matching how `@angular/core` is pinned.

In `package.json`, add to `devDependencies`, keeping the block alphabetical:

```json
"@angular/material": "22.0.5",
```

Run: `bun install`
Expected: `node_modules/@angular/material/fesm2022/` exists and holds ~97 `.mjs` files.

Verify: `ls node_modules/@angular/material/fesm2022/*.mjs | wc -l`

- [ ] **Step 2: Write the failing test**

Create `scripts/check-material.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeProperties, referencedTokens, checkBridge } from './check-material.mjs';

const CSS = `
/* a comment naming --mdc-ignored-by-the-parser */
.mat-mdc-card {
  --mat-card-elevated-container-color: var(--surface-card);
  --mdc-elevated-card-container-shape: var(--r-lg);
  font-family: var(--font-mono);
}
`;

test('bridgeProperties collects only the Material custom properties a rule declares', () => {
  assert.deepEqual(
    [...bridgeProperties(CSS)].sort(),
    ['mat-card-elevated-container-color', 'mdc-elevated-card-container-shape'],
  );
});

test('referencedTokens collects the Arena tokens the bridge reads, including from plain properties', () => {
  assert.deepEqual(
    [...referencedTokens(CSS)].sort(),
    ['font-mono', 'r-lg', 'surface-card'],
  );
});

test('a property name no installed Material component reads is reported', () => {
  const errs = checkBridge(
    CSS,
    new Set(['mat-card-elevated-container-color']),
    new Set(['surface-card', 'r-lg', 'font-mono']),
  );
  assert.equal(errs.length, 1);
  assert.match(errs[0], /--mdc-elevated-card-container-shape/);
  assert.match(errs[0], /themes nothing/);
});

test('a var() naming no Arena token is reported', () => {
  const errs = checkBridge(
    CSS,
    new Set(['mat-card-elevated-container-color', 'mdc-elevated-card-container-shape']),
    new Set(['surface-card', 'font-mono']),
  );
  assert.equal(errs.length, 1);
  assert.match(errs[0], /var\(--r-lg\)/);
  assert.match(errs[0], /resolves to nothing/);
});

test('a bridge whose every name resolves reports nothing', () => {
  const errs = checkBridge(
    CSS,
    new Set(['mat-card-elevated-container-color', 'mdc-elevated-card-container-shape']),
    new Set(['surface-card', 'r-lg', 'font-mono']),
  );
  assert.deepEqual(errs, []);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `bun test scripts/check-material.test.mjs`
Expected: FAIL — `Cannot find module './check-material.mjs'`.

- [ ] **Step 4: Write the gate**

Create `scripts/check-material.mjs`:

```js
/* frameworks/angular/theme/arena-material.css maps Angular Material's custom
 * properties onto Arena's tokens. Both halves of that mapping fail SILENTLY:
 * a property name Material does not read applies nothing, and a var() naming
 * no Arena token resolves to nothing. Neither throws, neither logs, and
 * check-dimension-literals.mjs does not scan .css — so when Material renamed
 * its tokens, 24 of the bridge's 26 names went inert and nothing noticed for
 * a whole major version.
 *
 * WHAT THIS GATE DOES NOT DO: it checks that a name EXISTS, not that it is
 * the right name for the element being styled. The bridge once set
 * --mat-list-list-item-container-{shape,color} on the active nav item; both
 * names exist, but mat-nav-list reads --mat-list-active-indicator-{shape,color}
 * and the container-* pair belongs to mat-selection-list. Catching that needs
 * to know which selector reads which property, which is a different problem.
 * A gate that implies more coverage than it has is how this file rotted.
 *
 *   bun scripts/check-material.mjs   -> exit 0 if every name on both sides resolves
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseDecls } from './lib/css-decls.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { arenaTokens } from './check-tailwind.mjs';

const BRIDGE = join('frameworks', 'angular', 'theme', 'arena-material.css');
const MATERIAL = join('node_modules', '@angular', 'material', 'fesm2022');

/** Every Material custom property the bridge DECLARES, without the `--`.
 *  @param {string} css @returns {Set<string>} */
export function bridgeProperties(css) {
  const out = new Set();
  for (const decls of parseDecls(css).values())
    for (const name of decls.keys())
      if (name.startsWith('mat-') || name.startsWith('mdc-')) out.add(name);
  return out;
}

/** Every Arena token the bridge REFERENCES through var(), without the `--`.
 *  Scans the raw text rather than the parsed declarations, so a var() inside
 *  a plain property (font-family, color) counts too.
 *  @param {string} css @returns {Set<string>} */
export function referencedTokens(css) {
  const out = new Set();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of stripped.matchAll(/var\(\s*--([a-z0-9-]+)\s*[,)]/g)) out.add(m[1]);
  return out;
}

/** Every mat-*/mdc-* custom property name the installed Material package
 *  mentions anywhere in its shipped ES modules, without the `--`.
 *  @param {string} dir @returns {Set<string>} */
export function materialProperties(dir) {
  const out = new Set();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.mjs')) continue;
    const src = readFileSync(join(dir, file), 'utf8');
    for (const m of src.matchAll(/--((?:mat|mdc)-[a-z0-9-]+)/g)) out.add(m[1]);
  }
  return out;
}

/** The four generated token files plus tokens/colors.css, whose hand-authored
 *  aliases (--crimson, --mute, --surface-card, --border) the bridge reads and
 *  which arenaTokens() deliberately excludes.
 *  @param {string} root @returns {Set<string>} */
export function arenaTokenNames(root) {
  const names = arenaTokens(root);
  const colors = parseDecls(readFileSync(join(root, 'tokens', 'colors.css'), 'utf8'));
  for (const decls of colors.values()) for (const name of decls.keys()) names.add(name);
  return names;
}

/** @param {string} bridgeCss @param {Set<string>} materialProps
 *  @param {Set<string>} tokens
 *  @returns {string[]} one message per problem, empty when clean. */
export function checkBridge(bridgeCss, materialProps, tokens) {
  const errs = [];
  for (const name of [...bridgeProperties(bridgeCss)].sort())
    if (!materialProps.has(name))
      errs.push(`--${name} is not read by any installed @angular/material component — it applies nothing and themes nothing`);
  for (const name of [...referencedTokens(bridgeCss)].sort())
    if (!tokens.has(name))
      errs.push(`var(--${name}) names no Arena token — it resolves to nothing`);
  return errs;
}

function main() {
  const dir = join(repoRoot, MATERIAL);
  if (!existsSync(dir)) {
    console.error(`check-material: ${MATERIAL} not found. @angular/material is a devDependency of this repo and the bridge cannot be verified without it — run bun install.`);
    process.exit(1);
  }
  const css = readFileSync(join(repoRoot, BRIDGE), 'utf8');
  const errs = checkBridge(css, materialProperties(dir), arenaTokenNames(repoRoot));

  if (errs.length) {
    console.error(`check-material: ${errs.length} name${errs.length === 1 ? '' : 's'} in ${BRIDGE} resolve${errs.length === 1 ? 's' : ''} to nothing\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  const n = bridgeProperties(css).size;
  console.log(`check-material: ${n} bridge properties resolve against @angular/material, every Arena token exists`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

That last line is the guard every sibling gate uses verbatim (`scripts/check-fonts-generated.mjs`, `scripts/check-tailwind-coverage.mjs`), and it is why the test can import the pure functions without `main()` running and calling `process.exit`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `bun test scripts/check-material.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 6: Run the gate against the real tree and record the worklist**

Run: `bun scripts/check-material.mjs`
Expected: **FAIL**, exit 1, listing 24 `--mdc-*` and `--mat-tab-header-*` names.

Paste that output into your report — it is Task 2's worklist, and it is the evidence that this gate is not vacuous.

- [ ] **Step 7: Register the gate**

In `scripts/check-all.mjs`, add to the `GATES` array. Place it after `check:angular`, the other Angular-layer gate:

```js
  { name: 'check:material', file: 'check-material.mjs' },
```

Then update that file's header comment, which currently reads "Fourteen steps total: the thirteen gates in GATES below, plus the test suite." It is now fifteen and fourteen.

Also add the script to `package.json`, immediately after the `check:angular` line (currently line 42):

```json
    "check:material": "bun scripts/check-material.mjs",
```

- [ ] **Step 8: Update CLAUDE.md's step count**

`CLAUDE.md` says `bun run check` "runs all thirteen plus the test suite". Change thirteen to fourteen. Do not change anything else in that sentence — the three non-portable gates it goes on to name are unaffected, because this gate needs no browser and no Bun-only builder.

- [ ] **Step 9: Commit**

```bash
git add package.json bun.lock scripts/check-material.mjs scripts/check-material.test.mjs scripts/check-all.mjs CLAUDE.md
git commit -m "feat(scripts): check:material, because a dead custom property is silent"
```

The tree is knowingly red at this commit: `bun run check` reports `check:material` FAIL. Say so in the commit body.

---

## Task 2: The 24 renames

**Files:**
- Modify: `frameworks/angular/theme/arena-material.css`

**Interfaces:**
- Consumes: `bun scripts/check-material.mjs` from Task 1, whose failure list is this task's worklist.
- Produces: nothing importable. The deliverable is a green gate.

Every name below was verified against `@angular/material@22.0.5`'s shipped `fesm2022/*.mjs`. **Zero `--mdc-*` names exist anywhere in that package**, so every `--mdc-` name in the bridge is inert regardless of what follows the prefix. The two `--mat-table-*` names already present are correct and must not be touched, and so are the `--mat-list-*` names in the nav-list block.

- [ ] **Step 1: Apply the renames**

In `frameworks/angular/theme/arena-material.css`, left column to right column. **Values are unchanged** — only the property name on the left of each `:` moves.

| Line | From | To |
|---|---|---|
| 9 | `--mdc-filled-button-container-color` | `--mat-button-filled-container-color` |
| 10 | `--mdc-filled-button-label-text-color` | `--mat-button-filled-label-text-color` |
| 11 | `--mdc-filled-button-container-shape` | `--mat-button-filled-container-shape` |
| 15 | `--mdc-outlined-button-outline-color` | `--mat-button-outlined-outline-color` |
| 16 | `--mdc-outlined-button-label-text-color` | `--mat-button-outlined-label-text-color` |
| 17 | `--mdc-outlined-button-container-shape` | `--mat-button-outlined-container-shape` |
| 23 | `--mdc-text-button-label-text-color` | `--mat-button-text-label-text-color` |
| 24 | `--mdc-outlined-button-label-text-color` | `--mat-button-outlined-label-text-color` |
| 25 | `--mdc-outlined-button-outline-color` | `--mat-button-outlined-outline-color` |
| 30 | `--mdc-outlined-text-field-outline-color` | `--mat-form-field-outlined-outline-color` |
| 31 | `--mdc-outlined-text-field-focus-outline-color` | `--mat-form-field-outlined-focus-outline-color` |
| 32 | `--mdc-outlined-text-field-container-shape` | `--mat-form-field-outlined-container-shape` |
| 33 | `--mdc-outlined-text-field-label-text-color` | `--mat-form-field-outlined-label-text-color` |
| 38 | `--mdc-elevated-card-container-color` | `--mat-card-elevated-container-color` |
| 39 | `--mdc-elevated-card-container-shape` | `--mat-card-elevated-container-shape` |
| 44 | `--mdc-dialog-container-shape` | `--mat-dialog-container-shape` |
| 45 | `--mdc-dialog-container-color` | `--mat-dialog-container-color` |
| 62 | `--mat-tab-header-active-label-text-color` | `--mat-tab-active-label-text-color` |
| 63 | `--mat-tab-header-active-focus-label-text-color` | `--mat-tab-active-focus-label-text-color` |
| 64 | `--mdc-tab-indicator-active-indicator-color` | `--mat-tab-active-indicator-color` |
| 69 | `--mdc-snackbar-container-shape` | `--mat-snack-bar-container-shape` |
| 70 | `--mdc-snackbar-container-color` | `--mat-snack-bar-container-color` |
| 71 | `--mdc-snackbar-supporting-text-color` | `--mat-snack-bar-supporting-text-color` |
| 76 | `--mdc-circular-progress-active-indicator-color` | `--mat-progress-spinner-active-indicator-color` |
| 79 | `--mdc-linear-progress-active-indicator-color` | `--mat-progress-bar-active-indicator-color` |
| 80 | `--mdc-linear-progress-track-color` | `--mat-progress-bar-track-color` |

Note lines 23-25 are the `.arena-danger` block, which repeats two names from the outlined-button block — 26 rows above, 24 distinct names.

Watch the two that are not a mechanical prefix swap, because a find-and-replace will get them wrong: **snackbar becomes `snack-bar`** (hyphenated), and the tab pair **loses `header`** while `tab-indicator-active-indicator` collapses to `tab-active-indicator`.

- [ ] **Step 2: Verify the selectors are still current**

The renames only help if the selectors they sit in still match what Material renders. All thirteen were confirmed present in `@angular/material@22.0.5`, but confirm rather than trust:

```bash
for s in mat-mdc-unelevated-button mat-mdc-outlined-button mat-mdc-form-field \
         mat-form-field-appearance-outline mat-mdc-card mat-mdc-dialog-surface \
         mat-mdc-table mat-mdc-header-cell mat-mdc-tab-group \
         mat-mdc-snack-bar-container mat-mdc-progress-spinner \
         mat-mdc-progress-bar mat-mdc-nav-list; do
  n=$(grep -oh "$s" node_modules/@angular/material/fesm2022/*.mjs 2>/dev/null | wc -l)
  printf "%-38s %s\n" "$s" "$([ "$n" -gt 0 ] && echo OK || echo MISSING)"
done
```

Expected: `OK` on all thirteen. A `MISSING` is a finding — report it rather than guessing a replacement selector, because a wrong selector fails exactly as silently as a wrong property name and this gate cannot see it.

- [ ] **Step 3: Run the gate**

Run: `bun scripts/check-material.mjs`
Expected: PASS — `check-material: 33 bridge properties resolve against @angular/material, every Arena token exists`

If the count differs from 33, do not adjust anything to match — report the real number. The figure is 24 renamed plus the 2 table and 7 nav-list names already correct.

- [ ] **Step 4: Prove the gate would still catch a regression**

Temporarily revert one rename — put `--mdc-dialog-container-shape` back on line 44 — and run `bun scripts/check-material.mjs`. Expected: FAIL naming that property. Restore it, confirm `git diff` is clean of the probe, and re-run to green.

Report this evidence. A gate that has only ever been seen passing on the tree it was written against has not been shown to work.

- [ ] **Step 5: Run the full sweep**

Run: `bun run check`
Expected: `check-all: all 15 step(s) passed`.

Run: `bun test`
Expected: 610 pass or more, 0 fail. The gate's 5 new tests land in the `scripts/` suite.

- [ ] **Step 6: Commit**

```bash
git add frameworks/angular/theme/arena-material.css
git commit -m "fix(angular): the Material bridge themes again, after a silent major"
```

---

## Task 3: Say what is true

**Files:**
- Modify: `frameworks/angular/README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: a green `check:material` from Task 2.
- Produces: nothing importable.

- [ ] **Step 1: Rewrite the README's known-issue block**

`frameworks/angular/README.md` carries the block at **line 113**, headed `### Known issue — most of the Material bridge is currently inert`, opening at line 115 with "**Read this before adopting the bridge.**". There is also a **cross-reference at lines 14-15** in the intro bullets ("coverage is currently inert against Angular Material 22 — read [Known issue](#…) before…"), which points at that anchor and must move with it — a dangling link is the likeliest thing to be left behind here.

Replace the section with a statement of the shipped position. It must say all four of:

- **The primitives stand alone.** No file under `frameworks/angular/primitives/` imports `@angular/material`; a consumer can use all 21 with no Material installed. `@angular/material` is an **optional** peer dependency of the published package.
- **Material is the recommended bridge for the rest.** Arena does not reimplement the components Material provides — Button, Input, Select, Dialog, Menu, Table, Toast and the others carry overlay positioning, focus management, keyboard navigation and i18n, and duplicating that badly would be worse than bridging it.
- **The bridge is verified.** `bun run check:material` asserts every custom property it sets is one the installed Material actually reads, and every Arena token it references exists.
- **It targets Angular Material 22.0.5.** State the version. A bridge with no stated target version cannot be falsified.

Keep the honesty about what the gate does not cover: it checks a name exists, not that it is the right name for the element being styled.

Also delete or correct any remaining sentence in that file claiming parts of the bridge are inert — that becomes false the moment Task 2 lands.

- [ ] **Step 2: Turn the CHANGELOG known issue into a fix**

In `CHANGELOG.md`, the `### Known issues` heading is at **line 323** and the entry describing the inert bridge at **line 325**, both under `## [Unreleased]`. Rewrite that entry as what shipped: 24 custom-property names corrected against Angular Material 22.0.5, and a new `check:material` gate that fails when a bridge property is not one Material reads or an Arena token does not exist. Note that the bridge themed only `mat-table` before this.

If that entry was the only thing under `### Known issues`, remove the now-empty heading rather than leaving it dangling.

**Cut no release.** No version string moves, no tag is created. If the file has no `## [Unreleased]` heading, add one above the newest version heading rather than filing this under a released version — the plugin is served from its tag, so a released version describes a tree nobody has.

- [ ] **Step 3: Verify nothing else still claims the bridge is broken**

Run: `grep -rn -i "inert\|does not theme\|themes nothing" README.md CLAUDE.md CHANGELOG.md frameworks/angular/ --include="*.md"`

Read each hit. The gate's own header comment legitimately uses "themes nothing" to describe the failure it detects — leave that. Any prose asserting the *current* bridge is broken is now false and must go.

- [ ] **Step 4: Commit**

```bash
git add frameworks/angular/README.md CHANGELOG.md
git commit -m "docs(angular): the Material bridge is supported and verified, and says so"
```

---

## Done when

- `bun run check` reports `all 15 step(s) passed`.
- `bun scripts/check-material.mjs` has been observed both failing (Task 1 Step 6, Task 2 Step 4) and passing (Task 2 Step 3).
- No token changed, no value changed, `frameworks/react/` byte-unchanged, no release cut.
