# Four atomic npm packages — build + publish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution order: 6 of 6 — last.** **Status: NOT EXECUTED** as of 2026-07-18 —
no `packaging/` directory and no `.github/workflows/`.

| # | Plan | Status |
|---|---|---|
| 1 | `2026-07-18-1-token-style-dictionary-migration.md` | **Executed** (v4.0.0) |
| 2 | `2026-07-18-2-overview-token-page.md` | **Executed** (v4.0.0) |
| 3 | `2026-07-18-3-framework-layer-token-coverage.md` | **Executed** (unreleased) |
| 4 | `2026-07-18-4-token-geometry-boundary.md` | Pending |
| 5 | framework-layer parity — **plan not yet written**, spec at `specs/2026-07-18-framework-layer-parity-design.md` | Pending |
| 6 | `2026-07-18-6-four-package-build-publish.md` | **This plan** — pending |

> ### Why this one goes last
>
> **The assembly logic here is executable today and correct today** — every file map
> is a glob, so plans 3, 4 and 5 need no edit under `packaging/`. What is gated is
> **publishing**, not building.
>
> Publishing now would put `@dravensoft/arena-angular` and `@dravensoft/arena-tailwind`
> on the public registry with one component each, and **a published version is
> permanent in a way a package name is not.**
>
> Plan 4 additionally changes token *values* and adds two token families (`icon` and
> `z`). Those land in `@dravensoft/arena-tokens`, so publishing before it means
> shipping a token surface that is about to change shape.

**Goal:** Assemble four lockstep-versioned, registry-standard npm packages
(`@dravensoft/arena-{tokens,react,angular,tailwind}`) from the untouched Arena tree
into a git-ignored `dist/`, verified under both Bun and npm, with a tag-triggered
GitHub Actions workflow that publishes them via npm trusted publishing.

**Architecture:** Derive in place. Not one authored file moves. A committed
`packaging/` directory holds the assembly logic: a config module describing each
package (manifest template + file map), an orchestrator that stamps the version
from `.claude-plugin/plugin.json` into every manifest and every inter-package peer
range, and per-tool build configs (`tsup` for React and Tailwind, `ng-packagr` for
Angular, Style Dictionary for the tokens' new JS/JSON platforms). A new
`scripts/check-packages.mjs` joins the release-coherence family and fails the build
on any version, peer-range, or `exports` mismatch.

**Tech Stack:** Bun 1.3 (`bun install`, `bun run`, `bun test`), Node 24 available,
Style Dictionary 4, `tsup`, `ng-packagr`, TypeScript, GitHub Actions with OIDC
trusted publishing.

## Global Constraints

- **Scope is `@dravensoft`.** Four package names, fixed: `@dravensoft/arena-tokens`,
  `@dravensoft/arena-react`, `@dravensoft/arena-angular`, `@dravensoft/arena-tailwind`.
- **Version authority is `.claude-plugin/plugin.json` `version`** (currently `4.0.0`).
  Never hand-write a version into any package manifest.
- **All arena→arena edges are `peerDependencies` pinned to the exact version** — never
  `^`, never `dependencies`.
- **Derive in place.** No authored file moves. The plugin, the copy-in kit, the Agent
  Skill and every demo stay byte-identical. The only authored additions are
  `frameworks/react/index.js` and `frameworks/react/index.d.ts`.
- **Bun-first.** Every script is runtime-portable ESM invoked as `bun scripts/x.mjs`.
  No npm-only assumptions inside the repo's own tooling.
- **English only.** All code, comments, docs and copy.
- **No install scripts.** No `postinstall`/lifecycle hooks in any published manifest.
- **`bun test scripts/ packaging/`** is the test command once Task 1 lands.

## Decisions this plan makes that differ from the spec

Three, each because the spec was written against a tree that has since changed or a
registry practice that has since changed. Each is a deliberate deviation, not drift.

1. **The assembly directory is `packaging/`, not `build/`.** `.gitignore` line 8
   already ignores `build/`. The spec calls for `build/` to be *committed*, which
   would either be silently untracked or force a `!build/` negation that fights the
   entry above it. `packaging/` is unambiguous and needs no negation.
2. **`.gitignore` needs no edit.** It already ignores `dist/` (line 7). The spec's
   "Edited: `.gitignore` (add `dist/`)" is a no-op.
3. **Publishing uses npm trusted publishing (OIDC), not an `NPM_TOKEN` secret.**
   Verified against `docs.npmjs.com/trusted-publishers`: GitHub Actions on
   GitHub-hosted runners authenticates via short-lived OIDC tokens, requires npm CLI
   ≥ 11.5.1 and Node ≥ 22.14.0 and `permissions: id-token: write`, and **generates
   provenance automatically** for public packages from public repos — so
   `--provenance` becomes unnecessary and no long-lived secret is stored.

## Sequencing — read this before starting

The four-package spec is **blocked on framework-layer coverage**, and the user has
chosen **option 3: full 40-component parity in Angular and Tailwind before anything
is published**. That is two workstreams that are *not* in this plan:

- `docs/superpowers/specs/2026-07-18-framework-layer-token-coverage-design.md` —
  needs its own plan.
- Growing Angular and Tailwind from 1 component each to 40 — needs a spec and a plan.

**This plan is still executable start to finish today**, because the packaging
machinery is component-count-agnostic: every file map is a glob, so a Tailwind
manifest or an Angular primitive added later is picked up with no edit here. What
this plan deliberately does *not* do is switch publishing on. Task 10 ships the
workflow with the publish step gated behind a repository variable that stays unset
until parity lands. Building the machinery now means the package shape is validated
while the layers grow, instead of discovering the packaging problems at release time.

## File Structure

**New, committed:**

| File | Responsibility |
|---|---|
| `packaging/packages.config.mjs` | The four package definitions: name, manifest template, file map, build step. The single place a package's shape is described. |
| `packaging/build-packages.mjs` | Orchestrator. Cleans `dist/`, runs each package's assemble + manifest stamp + tool build. |
| `packaging/assemble.mjs` | Filesystem primitives shared by every package: glob copy, CSS `@import` rewrite, JSON write. |
| `packaging/token-formats.mjs` | Emits `js/` (typed token map) and `json/` (flattened DTCG) for `arena-tokens` off `tokens/src/`. |
| `packaging/react.tsup.ts` | tsup config for the React layer. |
| `packaging/tailwind.tsup.ts` | tsup config for the Tailwind layer. |
| `packaging/angular/ng-package.json` | ng-packagr entry config. |
| `packaging/angular/tsconfig.lib.json` | Angular library compile settings. |
| `packaging/angular/public-api.ts` | ng-packagr entry file, re-exporting `frameworks/angular/index.ts`. |
| `packaging/*.test.mjs` | Unit tests, one file per module above. |
| `scripts/check-packages.mjs` | The gate: versions, peer ranges, exports resolution, no arena `dependencies`. |
| `scripts/smoke-packages.mjs` | Packs each package and installs it into a throwaway consumer under both Bun and npm. |
| `.github/workflows/release-packages.yml` | Tag-triggered build, gate, publish. |
| `frameworks/react/index.js` | The React barrel — authored, lives with the source so the copy-in kit gains an index too. |
| `frameworks/react/index.d.ts` | Its types. |

**Modified:** `package.json` (devDeps + scripts + test glob), `scripts/build-tokens.mjs`
(export the loader — no output change), `README.md`, `CLAUDE.md`,
`frameworks/react/README.md`, `frameworks/angular/ADOPTION.md`,
`frameworks/tailwind/README.md`, `CHANGELOG.md`.

**Explicitly unchanged:** every token JSON, every generated `tokens/*.css`, every
`.jsx`, every `.d.ts`, every demo page, `.claude-plugin/*`, `support.js`, `theme.js`,
`jsx-loader.js`, `SKILL.md`.

### What each package contains

```
arena-tokens/   css/{fonts,palette,colors,typography,spacing,effects,styles}.css
                assets/fonts/*.woff2      (so css/fonts.css `../assets/fonts/` resolves)
                js/{index.mjs,index.cjs,index.d.ts}
                json/tokens.json
arena-react/    dist/*.{mjs,cjs}          (40 components + barrel + shared helpers)
                types/**/*.d.ts           (hand-written, copied verbatim)
arena-angular/  Angular Package Format output from ng-packagr
                theme/{arena-tailwind,arena-material}.css
arena-tailwind/ dist/tv.{mjs,cjs,d.ts}
                theme.css
                manifests/*.manifest.json
                variants/*.{mjs,cjs,d.ts}
```

**`frameworks/react/ui_kits/` is excluded from `arena-react`.** The Delivery Console
is an example application, not API — it imports demo-only screens and would drag a
second public surface into the package. It stays in the tree for the copy-in kit and
the demos. This is a decision, recorded so its absence does not read as an oversight.

---

### Task 1: Package config, version stamping, and the `packaging/` skeleton

The version-stamping rule is the load-bearing invariant of the whole plan, so it is
built first and tested before anything is assembled.

**Files:**
- Create: `packaging/packages.config.mjs`
- Create: `packaging/packages.config.test.mjs`
- Modify: `package.json` (test glob)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SCOPE` → `'@dravensoft'`, `REPO` → the GitHub URL.
  - `PACKAGES`: array of `{ dir, name, manifest(version) }` where `dir` is the
    `dist/` subdirectory name and `manifest(version)` returns the complete
    `package.json` object with the version and every arena peer range stamped.
  - `readVersion(root)` → the version string from `.claude-plugin/plugin.json`.

- [ ] **Step 1: Write the failing test**

Create `packaging/packages.config.test.mjs`:

```js
import { test, expect } from 'bun:test';
import { PACKAGES, SCOPE, readVersion } from './packages.config.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the scope is @dravensoft and there are exactly four packages', () => {
  expect(SCOPE).toBe('@dravensoft');
  expect(PACKAGES.map((p) => p.name).sort()).toEqual([
    '@dravensoft/arena-angular',
    '@dravensoft/arena-react',
    '@dravensoft/arena-tailwind',
    '@dravensoft/arena-tokens',
  ]);
});

test('readVersion reads plugin.json, the authority', () => {
  const pkg = JSON.parse(
    require('node:fs').readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'),
  );
  expect(readVersion(root)).toBe(pkg.version);
});

test('every manifest is stamped with the version it is given', () => {
  for (const p of PACKAGES) {
    expect(p.manifest('9.9.9').version).toBe('9.9.9');
  }
});

test('every arena peer range is the exact version, never a caret', () => {
  for (const p of PACKAGES) {
    const peers = p.manifest('9.9.9').peerDependencies ?? {};
    for (const [dep, range] of Object.entries(peers)) {
      if (!dep.startsWith(SCOPE)) continue;
      expect(range).toBe('9.9.9');
    }
  }
});

test('no arena package is ever a runtime dependency', () => {
  for (const p of PACKAGES) {
    const deps = Object.keys(p.manifest('9.9.9').dependencies ?? {});
    expect(deps.filter((d) => d.startsWith(SCOPE))).toEqual([]);
  }
});

test('no manifest declares an install script', () => {
  const forbidden = ['preinstall', 'install', 'postinstall', 'prepare'];
  for (const p of PACKAGES) {
    const scripts = Object.keys(p.manifest('9.9.9').scripts ?? {});
    expect(scripts.filter((s) => forbidden.includes(s))).toEqual([]);
  }
});

test('the dependency graph matches the spec', () => {
  const peersOf = (name) =>
    Object.keys(PACKAGES.find((p) => p.name === name).manifest('1.0.0').peerDependencies ?? {})
      .filter((d) => d.startsWith(SCOPE))
      .sort();
  expect(peersOf('@dravensoft/arena-tokens')).toEqual([]);
  expect(peersOf('@dravensoft/arena-tailwind')).toEqual(['@dravensoft/arena-tokens']);
  expect(peersOf('@dravensoft/arena-react')).toEqual(['@dravensoft/arena-tokens']);
  expect(peersOf('@dravensoft/arena-angular')).toEqual([
    '@dravensoft/arena-tailwind',
    '@dravensoft/arena-tokens',
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test packaging/packages.config.test.mjs`
Expected: FAIL — `Cannot find module './packages.config.mjs'`

- [ ] **Step 3: Write the config module**

Create `packaging/packages.config.mjs`:

```js
/* The four npm packages Arena publishes, described once.
 *
 * Nothing here is hand-versioned: `manifest(version)` is a template and the
 * orchestrator stamps it with the version read from .claude-plugin/plugin.json,
 * which is the authority (Claude Code resolves plugin.json over everything, and
 * the release rule already ties marketplace, README, CHANGELOG and tag to it).
 *
 * Every arena->arena edge is a peerDependency pinned to that exact version, not
 * a caret range: the four always ship together, and a consumer on
 * arena-angular@4.1.0 must be told to have arena-tokens@4.1.0, never a drifting
 * minor that happens to satisfy ^4.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SCOPE = '@dravensoft';
export const REPO = 'https://github.com/dravensoft-dev/Identity';

/** The version authority. Every manifest is stamped from this and nowhere else. */
export function readVersion(root) {
  return JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8')).version;
}

/** Fields every published manifest carries identically. */
const base = (version, name, description, keywords) => ({
  name,
  version,
  description,
  keywords: ['arena', 'design-system', 'dravensoft', 'design-tokens', ...keywords],
  license: 'MIT',
  author: { name: 'Dravensoft' },
  repository: { type: 'git', url: `git+${REPO}.git` },
  homepage: `${REPO}#readme`,
  bugs: { url: `${REPO}/issues` },
  publishConfig: { access: 'public' },
});

export const PACKAGES = [
  {
    dir: 'arena-tokens',
    name: `${SCOPE}/arena-tokens`,
    manifest: (version) => ({
      ...base(version, `${SCOPE}/arena-tokens`,
        "Arena's design tokens: CSS custom properties, a typed JS map, and flattened DTCG JSON.",
        ['css-variables', 'dtcg', 'style-dictionary']),
      type: 'module',
      // The CSS files are the whole point of this package and they are all side
      // effect: importing one must never be tree-shaken away.
      sideEffects: ['./css/*.css'],
      exports: {
        '.': { types: './js/index.d.ts', import: './js/index.mjs', require: './js/index.cjs' },
        './styles.css': './css/styles.css',
        './css/*': './css/*',
        './json': './json/tokens.json',
        './package.json': './package.json',
      },
      main: './js/index.cjs',
      module: './js/index.mjs',
      types: './js/index.d.ts',
      files: ['css', 'js', 'json', 'assets'],
    }),
  },
  {
    dir: 'arena-react',
    name: `${SCOPE}/arena-react`,
    manifest: (version) => ({
      ...base(version, `${SCOPE}/arena-react`,
        "Arena's React components — inline-style, token-driven, no CSS classes.",
        ['react', 'components', 'ui']),
      type: 'module',
      sideEffects: false,
      exports: {
        '.': { types: './types/index.d.ts', import: './dist/index.mjs', require: './dist/index.cjs' },
        './*': { types: './types/*.d.ts', import: './dist/*.mjs', require: './dist/*.cjs' },
        './package.json': './package.json',
      },
      main: './dist/index.cjs',
      module: './dist/index.mjs',
      types: './types/index.d.ts',
      files: ['dist', 'types'],
      peerDependencies: {
        react: '>=18',
        'react-dom': '>=18',
        [`${SCOPE}/arena-tokens`]: version,
        '@phosphor-icons/web': '>=2',
      },
      peerDependenciesMeta: {
        '@phosphor-icons/web': { optional: true },
      },
    }),
  },
  {
    dir: 'arena-angular',
    name: `${SCOPE}/arena-angular`,
    manifest: (version) => ({
      ...base(version, `${SCOPE}/arena-angular`,
        "Arena's Angular primitives — standalone, OnPush, signal I/O.",
        ['angular', 'components', 'ui']),
      // Manifest fields ng-packagr does not itself write. ng-packagr generates
      // the exports map, module/types entries and fesm paths; this object is
      // merged into what it emits rather than replacing it.
      sideEffects: false,
      peerDependencies: {
        '@angular/core': '>=17',
        '@angular/common': '>=17',
        [`${SCOPE}/arena-tokens`]: version,
        [`${SCOPE}/arena-tailwind`]: version,
        'tailwind-variants': '>=1',
      },
    }),
  },
  {
    dir: 'arena-tailwind',
    name: `${SCOPE}/arena-tailwind`,
    manifest: (version) => ({
      ...base(version, `${SCOPE}/arena-tailwind`,
        "Arena's shared Tailwind v4 layer: the @theme preset, the configured tv factory, and the component recipes.",
        ['tailwind', 'tailwind-variants', 'preset']),
      type: 'module',
      sideEffects: ['./theme.css'],
      exports: {
        '.': { types: './dist/tv.d.ts', import: './dist/tv.mjs', require: './dist/tv.cjs' },
        './theme.css': './theme.css',
        './manifests/*': './manifests/*',
        './variants/*': { types: './variants/*.d.ts', import: './variants/*.mjs', require: './variants/*.cjs' },
        './package.json': './package.json',
      },
      main: './dist/tv.cjs',
      module: './dist/tv.mjs',
      types: './dist/tv.d.ts',
      files: ['dist', 'variants', 'manifests', 'theme.css'],
      peerDependencies: {
        tailwindcss: '>=4',
        'tailwind-variants': '>=1',
        [`${SCOPE}/arena-tokens`]: version,
      },
    }),
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test packaging/packages.config.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Widen the repo test glob**

In `package.json`, change the `test` script:

```json
"test": "bun test scripts/ packaging/"
```

- [ ] **Step 6: Run the whole suite**

Run: `bun test`
Expected: PASS — the existing `scripts/` tests plus the seven new ones.

- [ ] **Step 7: Commit**

```bash
git add packaging/packages.config.mjs packaging/packages.config.test.mjs package.json
git commit -m "feat(packaging): describe the four npm packages and their lockstep peer graph"
```

---

### Task 2: Assembly primitives

The filesystem operations every package needs, isolated so they can be tested
without running a real build. The CSS `@import` rewrite is the one with a sharp
edge: `styles.css` imports `./tokens/palette.css`, but in the package the CSS all
sits flat in `css/`, so the path must become `./palette.css` or the package's
headline export resolves to nothing.

**Files:**
- Create: `packaging/assemble.mjs`
- Create: `packaging/assemble.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `copyGlob(fromDir, pattern, toDir)` → `Promise<string[]>` of relative paths written.
  - `rewriteStylesImports(css)` → `string` with `./tokens/x.css` flattened to `./x.css`.
  - `writeJSON(path, object)` → writes 2-space-indented JSON with a trailing newline.
  - `cleanDir(path)` → removes and recreates a directory.

- [ ] **Step 1: Write the failing test**

Create `packaging/assemble.test.mjs`:

```js
import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyGlob, rewriteStylesImports, writeJSON, cleanDir } from './assemble.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'arena-assemble-'));

test('rewriteStylesImports flattens the tokens/ prefix', () => {
  const input = [
    '@import "./tokens/fonts.css";',
    '@import "./tokens/palette.css";',
  ].join('\n');
  expect(rewriteStylesImports(input)).toBe(
    '@import "./fonts.css";\n@import "./palette.css";',
  );
});

test('rewriteStylesImports leaves an already-flat import alone', () => {
  expect(rewriteStylesImports('@import "./palette.css";')).toBe('@import "./palette.css";');
});

test('copyGlob copies matching files and reports them', async () => {
  const src = tmp(); const dst = tmp();
  mkdirSync(join(src, 'nested'));
  writeFileSync(join(src, 'a.css'), 'a');
  writeFileSync(join(src, 'b.txt'), 'b');
  writeFileSync(join(src, 'nested/c.css'), 'c');

  const written = await copyGlob(src, '**/*.css', dst);

  expect(written.sort()).toEqual(['a.css', 'nested/c.css']);
  expect(readFileSync(join(dst, 'a.css'), 'utf8')).toBe('a');
  expect(readFileSync(join(dst, 'nested/c.css'), 'utf8')).toBe('c');
  expect(existsSync(join(dst, 'b.txt'))).toBe(false);
});

test('writeJSON writes indented JSON with a trailing newline', () => {
  const dir = tmp();
  const file = join(dir, 'package.json');
  writeJSON(file, { name: 'x' });
  expect(readFileSync(file, 'utf8')).toBe('{\n  "name": "x"\n}\n');
});

test('cleanDir empties an existing directory', () => {
  const dir = tmp();
  writeFileSync(join(dir, 'stale.txt'), 'stale');
  cleanDir(dir);
  expect(existsSync(join(dir, 'stale.txt'))).toBe(false);
  expect(existsSync(dir)).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test packaging/assemble.test.mjs`
Expected: FAIL — `Cannot find module './assemble.mjs'`

- [ ] **Step 3: Write the module**

Create `packaging/assemble.mjs`:

```js
/* Filesystem primitives shared by every package assembly.
 *
 * Kept separate from build-packages.mjs so the one operation with a sharp edge —
 * flattening styles.css's `./tokens/` imports, without which the package's
 * headline export resolves to nothing — is unit-testable without running a build.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { glob } from 'node:fs/promises';

/** Copies every file matching `pattern` under `fromDir` into `toDir`, preserving
 *  the relative layout. @returns the relative paths written. */
export async function copyGlob(fromDir, pattern, toDir) {
  const written = [];
  for await (const entry of glob(pattern, { cwd: fromDir, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const rel = relative(fromDir, join(entry.parentPath, entry.name));
    const target = join(toDir, rel);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(fromDir, rel), target);
    written.push(rel.split('\\').join('/'));
  }
  return written;
}

/* In the repo, styles.css sits at the root and imports ./tokens/*.css. In the
 * package every CSS file sits flat in css/, so the prefix has to go. This is the
 * single edit made to any copied CSS — values are never touched. */
export function rewriteStylesImports(css) {
  return css.replace(/@import\s+"\.\/tokens\//g, '@import "./');
}

export function writeJSON(path, object) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(object, null, 2)}\n`);
}

export function cleanDir(path) {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

export const readText = (path) => readFileSync(path, 'utf8');
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test packaging/assemble.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add packaging/assemble.mjs packaging/assemble.test.mjs
git commit -m "feat(packaging): add assembly primitives with the styles.css import rewrite"
```

---

### Task 3: `arena-tokens` — JS and JSON platform outputs

The DTCG migration emits CSS only. This task adds the two other platform outputs the
tokens package ships, off the same source — no new source of truth. Per the layer
contract, the JS map exposes token *names* and `var()` references for runtime use
plus the serialized static value for non-CSS platforms; the runtime `color-mix`
derivations stay in CSS and are deliberately absent.

**Files:**
- Modify: `scripts/build-tokens.mjs` (export the loader; no output change)
- Create: `packaging/token-formats.mjs`
- Create: `packaging/token-formats.test.mjs`

**Interfaces:**
- Consumes: `loadTokens(source)` from `scripts/build-tokens.mjs`; `serialize` from
  `scripts/lib/serialize-token.mjs`.
- Produces:
  - `buildTokenFormats()` → `Promise<{ js: string, cjs: string, dts: string, json: string }>`,
    each a complete file body.
  - The JS shape: `tokens` (the `:root`/dark set) and `light` (the `.arena-light`
    overrides), both `Record<string, ArenaToken>` keyed by token name without the
    leading dashes, where `ArenaToken` is `{ name, var: cssVar, value, type, description? }`.

- [ ] **Step 1: Export the loader from the token build**

In `scripts/build-tokens.mjs`, change the `load` function from a module-private
declaration to an export, and give it the name the rest of the repo will import it
by. Replace:

```js
/** Resolves one source file to its named, ordered token tree. */
async function load(source) {
```

with:

```js
/** Resolves one source file to its named, ordered token tree. Exported because
 *  the package build reads the same tree to emit its JS and JSON platforms — one
 *  loader, one resolution order, no second source of truth. */
export async function loadTokens(source) {
```

Then update the one internal call site inside `block()`:

```js
  for (const item of walk(await loadTokens(source))) {
```

- [ ] **Step 2: Verify the token output is byte-identical**

The rename must not change a single generated byte.

Run: `bun run build:tokens && git diff --stat tokens/`
Expected: no output — `tokens/*.css` unchanged.

Run: `bun scripts/check-tokens-generated.mjs`
Expected: `check-tokens-generated: 4 file(s) in sync with tokens/src/`

- [ ] **Step 3: Write the failing test**

Create `packaging/token-formats.test.mjs`:

```js
import { test, expect } from 'bun:test';
import { buildTokenFormats } from './token-formats.mjs';

const built = await buildTokenFormats();

test('the JSON payload carries both themes and is parseable', () => {
  const parsed = JSON.parse(built.json);
  expect(Object.keys(parsed).sort()).toEqual(['light', 'tokens']);
  expect(Object.keys(parsed.tokens).length).toBeGreaterThan(100);
});

test('a known token carries its name, var reference, value and type', () => {
  const { tokens } = JSON.parse(built.json);
  const t = tokens['color-base-100'];
  expect(t.name).toBe('--color-base-100');
  expect(t.var).toBe('var(--color-base-100)');
  expect(t.type).toBe('color');
  expect(t.value).toMatch(/^#|^rgb|^color\(/);
});

test('the light theme overrides the same names, with different values', () => {
  const { tokens, light } = JSON.parse(built.json);
  expect(light['color-base-100']).toBeDefined();
  expect(light['color-base-100'].value).not.toBe(tokens['color-base-100'].value);
});

test('the ESM module is valid JS exporting tokens, light and cssVar', async () => {
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(built.js).toString('base64')}`
  );
  expect(mod.tokens['color-base-100'].var).toBe('var(--color-base-100)');
  expect(mod.light['color-base-100']).toBeDefined();
  expect(mod.cssVar('color-base-100')).toBe('var(--color-base-100)');
  expect(mod.cssVar('--color-base-100')).toBe('var(--color-base-100)');
});

test('the CJS build exposes the same token count as the ESM one', async () => {
  const esm = await import(
    `data:text/javascript;base64,${Buffer.from(built.js).toString('base64')}`
  );
  const counted = (built.cjs.match(/"name":/g) ?? []).length;
  expect(counted).toBe(Object.keys(esm.tokens).length + Object.keys(esm.light).length);
});

test('the declaration file types both exports', () => {
  expect(built.dts).toContain('export interface ArenaToken');
  expect(built.dts).toContain('export declare const tokens: Record<string, ArenaToken>');
  expect(built.dts).toContain('export declare const light: Record<string, ArenaToken>');
  expect(built.dts).toContain('export declare function cssVar(name: string): string');
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `bun test packaging/token-formats.test.mjs`
Expected: FAIL — `Cannot find module './token-formats.mjs'`

- [ ] **Step 5: Write the module**

Create `packaging/token-formats.mjs`:

```js
/* The JS and JSON platform outputs of @dravensoft/arena-tokens.
 *
 * Same DTCG source, same loader and same serializer as the CSS build — this adds
 * platforms, never a second source of truth. Per the layer contract, DTCG owns
 * values and the composition layer owns how values combine at runtime, so what
 * ships here is names, var() references and static values. The runtime color-mix
 * derivations in tokens/colors.css are deliberately absent: they are CSS, and
 * restating them as strings here would be the second implementation the contract
 * exists to prevent.
 */
import { loadTokens } from '../scripts/build-tokens.mjs';
import { serialize } from '../scripts/lib/serialize-token.mjs';

/** The DTCG sources that populate each theme, mirroring build-tokens.mjs's map. */
const ROOT_SOURCES = ['palette.dark.json', 'typography.json', 'spacing.json', 'effects.json'];
const LIGHT_SOURCES = ['palette.light.json'];

/** Depth-first walk yielding every leaf token, in source order. */
function* leaves(node) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || child === null || typeof child !== 'object') continue;
    if (child.$value !== undefined) { yield child; continue; }
    yield* leaves(child);
  }
}

async function collect(sources) {
  const out = {};
  for (const source of sources) {
    for (const token of leaves(await loadTokens(source))) {
      out[token.name] = {
        name: `--${token.name}`,
        var: `var(--${token.name})`,
        value: serialize(token).trim(),
        type: token.$type ?? 'unknown',
        ...(token.$description ? { description: token.$description } : {}),
      };
    }
  }
  return out;
}

const HEADER =
  '/* GENERATED from tokens/src/ by packaging/token-formats.mjs — do not edit. */';

export async function buildTokenFormats() {
  const tokens = await collect(ROOT_SOURCES);
  const light = await collect(LIGHT_SOURCES);

  const t = JSON.stringify(tokens, null, 2);
  const l = JSON.stringify(light, null, 2);

  const cssVarBody =
    'const bare = name.startsWith("--") ? name.slice(2) : name;\n' +
    '  return `var(--${bare})`;';

  return {
    js: [
      HEADER,
      `export const tokens = ${t};`,
      `export const light = ${l};`,
      '/** `cssVar("color-base-100")` and `cssVar("--color-base-100")` both work. */',
      `export function cssVar(name) {\n  ${cssVarBody}\n}`,
      '',
    ].join('\n'),

    cjs: [
      HEADER,
      `const tokens = ${t};`,
      `const light = ${l};`,
      `function cssVar(name) {\n  ${cssVarBody}\n}`,
      'module.exports = { tokens, light, cssVar };',
      '',
    ].join('\n'),

    dts: [
      HEADER,
      'export interface ArenaToken {',
      '  /** The custom property name, with its leading dashes. */',
      '  name: string;',
      '  /** A ready-to-use `var(--name)` reference. */',
      '  var: string;',
      '  /** The static value, as the CSS build renders it. */',
      '  value: string;',
      '  /** The DTCG $type this token was authored with. */',
      '  type: string;',
      '  description?: string;',
      '}',
      '/** Every token on `:root` — Arena is dark-first, so this is the dark theme. */',
      'export declare const tokens: Record<string, ArenaToken>;',
      '/** The `.arena-light` overrides. Same names, light values. */',
      'export declare const light: Record<string, ArenaToken>;',
      'export declare function cssVar(name: string): string;',
      '',
    ].join('\n'),

    json: `${JSON.stringify({ tokens, light }, null, 2)}\n`,
  };
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `bun test packaging/token-formats.test.mjs`
Expected: PASS, 6 tests.

If the `color-base-100` assertions fail, read the actual name out of
`tokens/src/palette.dark.json` and correct the test's fixture name — the token map
is the source of truth, not the test.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-tokens.mjs packaging/token-formats.mjs packaging/token-formats.test.mjs
git commit -m "feat(packaging): emit the JS and JSON token platforms from the DTCG source"
```

---

### Task 4: The React barrel

The one authored addition to the tree. It lives with the source rather than in
`packaging/` so the copy-in kit gains an index too — a consumer who copies
`frameworks/react/` gets a working entry point without the npm package.

**Files:**
- Create: `frameworks/react/index.js`
- Create: `frameworks/react/index.d.ts`
- Create: `packaging/barrel.test.mjs`

**Interfaces:**
- Consumes: every `frameworks/react/components/**/*.jsx` and the shared helpers.
- Produces: a named export per component, plus `useContainerWidth` and
  `readBreakpoint`. No default export.

- [ ] **Step 1: Write the failing test**

The barrel's job is to be complete, and completeness is exactly what rots. Test it
against the filesystem rather than a hardcoded list, so a component added later
without a barrel entry fails.

Create `packaging/barrel.test.mjs`:

```js
import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reactDir = join(root, 'frameworks/react');

async function componentFiles() {
  const found = [];
  for await (const f of glob('components/**/*.jsx', { cwd: reactDir })) found.push(f);
  return found.sort();
}

test('the barrel re-exports every component file, and ui_kits is excluded', async () => {
  const barrel = readFileSync(join(reactDir, 'index.js'), 'utf8');
  for (const file of await componentFiles()) {
    expect(barrel).toContain(`./${file.split('\\').join('/')}`);
  }
  expect(barrel).not.toContain('ui_kits');
});

test('the barrel exports the shared helpers', () => {
  const barrel = readFileSync(join(reactDir, 'index.js'), 'utf8');
  expect(barrel).toContain('use-container-width.js');
});

test('the declaration file names every component', async () => {
  const dts = readFileSync(join(reactDir, 'index.d.ts'), 'utf8');
  for (const file of await componentFiles()) {
    expect(dts).toContain(basename(file, '.jsx'));
  }
});

test('there are 40 components — the reference implementation is complete', async () => {
  expect((await componentFiles()).length).toBe(40);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test packaging/barrel.test.mjs`
Expected: FAIL — `ENOENT ... frameworks/react/index.js`

- [ ] **Step 3: Write the barrel**

Create `frameworks/react/index.js`:

```js
/* Arena's React surface, in one import.
 *
 * Deep imports keep working and stay the lighter choice — this exists so
 * `import { Button } from '@dravensoft/arena-react'` resolves, and so a copy-in
 * consumer who takes the whole folder gets an entry point rather than 40 paths.
 *
 * ui_kits/ is deliberately absent: the Delivery Console is an example
 * application, not API.
 */
export { Rotor } from './components/brand/Rotor.jsx';

export { BarChart } from './components/charts/BarChart.jsx';
export { ChartCard } from './components/charts/ChartCard.jsx';
export { DoughnutChart } from './components/charts/DoughnutChart.jsx';
export { LineChart } from './components/charts/LineChart.jsx';

export { Avatar } from './components/display/Avatar.jsx';
export { Badge } from './components/display/Badge.jsx';
export { Calendar } from './components/display/Calendar.jsx';
export { Card } from './components/display/Card.jsx';
export { Skeleton } from './components/display/Skeleton.jsx';
export { StatCard } from './components/display/StatCard.jsx';
export { Table } from './components/display/Table.jsx';
export { Tag } from './components/display/Tag.jsx';

export { Alert } from './components/feedback/Alert.jsx';
export { ConfirmDialog } from './components/feedback/ConfirmDialog.jsx';
export { Dialog } from './components/feedback/Dialog.jsx';
export { EmptyState } from './components/feedback/EmptyState.jsx';
export { ErrorState } from './components/feedback/ErrorState.jsx';
export { Onboarding } from './components/feedback/Onboarding.jsx';
export { ProgressBar } from './components/feedback/ProgressBar.jsx';
export { Spinner } from './components/feedback/Spinner.jsx';
export { Toast } from './components/feedback/Toast.jsx';
export { Tooltip } from './components/feedback/Tooltip.jsx';

export { Button } from './components/forms/Button.jsx';
export { Checkbox } from './components/forms/Checkbox.jsx';
export { IconButton } from './components/forms/IconButton.jsx';
export { Input } from './components/forms/Input.jsx';
export { Radio } from './components/forms/Radio.jsx';
export { Select } from './components/forms/Select.jsx';
export { Switch } from './components/forms/Switch.jsx';
export { Textarea } from './components/forms/Textarea.jsx';
export { ThemeToggle } from './components/forms/ThemeToggle.jsx';

export { Breadcrumbs } from './components/navigation/Breadcrumbs.jsx';
export { BulkActionBar } from './components/navigation/BulkActionBar.jsx';
export { CommandPalette } from './components/navigation/CommandPalette.jsx';
export { Menu } from './components/navigation/Menu.jsx';
export { PageHead } from './components/navigation/PageHead.jsx';
export { Pagination } from './components/navigation/Pagination.jsx';
export { SegmentedControl } from './components/navigation/SegmentedControl.jsx';
export { Tabs } from './components/navigation/Tabs.jsx';

export { useContainerWidth, readBreakpoint } from './use-container-width.js';
```

**Before writing this file, verify every export name against its source.** Run:

```bash
grep -rhn '^export function\|^export const' frameworks/react/components/*/*.jsx
```

and reconcile any name that differs from the file's basename. The list above is
written from the file names; a component whose exported symbol differs must be
corrected here, not renamed at the source.

- [ ] **Step 4: Write the declaration file**

Create `frameworks/react/index.d.ts`:

```ts
/* Types for the Arena React barrel. Each component's props live in its own
   sibling .d.ts, which stays the authority — this file only re-exports. */
export * from './components/brand/Rotor';

export * from './components/charts/BarChart';
export * from './components/charts/ChartCard';
export * from './components/charts/DoughnutChart';
export * from './components/charts/LineChart';

export * from './components/display/Avatar';
export * from './components/display/Badge';
export * from './components/display/Calendar';
export * from './components/display/Card';
export * from './components/display/Skeleton';
export * from './components/display/StatCard';
export * from './components/display/Table';
export * from './components/display/Tag';

export * from './components/feedback/Alert';
export * from './components/feedback/ConfirmDialog';
export * from './components/feedback/Dialog';
export * from './components/feedback/EmptyState';
export * from './components/feedback/ErrorState';
export * from './components/feedback/Onboarding';
export * from './components/feedback/ProgressBar';
export * from './components/feedback/Spinner';
export * from './components/feedback/Toast';
export * from './components/feedback/Tooltip';

export * from './components/forms/Button';
export * from './components/forms/Checkbox';
export * from './components/forms/IconButton';
export * from './components/forms/Input';
export * from './components/forms/Radio';
export * from './components/forms/Select';
export * from './components/forms/Switch';
export * from './components/forms/Textarea';
export * from './components/forms/ThemeToggle';

export * from './components/navigation/Breadcrumbs';
export * from './components/navigation/BulkActionBar';
export * from './components/navigation/CommandPalette';
export * from './components/navigation/Menu';
export * from './components/navigation/PageHead';
export * from './components/navigation/Pagination';
export * from './components/navigation/SegmentedControl';
export * from './components/navigation/Tabs';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `bun test packaging/barrel.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 6: Verify the demos are unaffected**

The barrel is additive; no demo imports it. Confirm nothing regressed:

Run: `bun test`
Expected: PASS, including `scripts/browser-modules.test.mjs`.

- [ ] **Step 7: Commit**

```bash
git add frameworks/react/index.js frameworks/react/index.d.ts packaging/barrel.test.mjs
git commit -m "feat(react): add the barrel entry point, with a test that keeps it complete"
```

---

### Task 5: Install the build toolchain and assemble `arena-tokens`

First package assembled end to end, and the simplest — it has no compiler, only
copies plus the outputs from Task 3.

**Files:**
- Modify: `package.json` (devDeps + scripts)
- Create: `packaging/build-packages.mjs`
- Create: `packaging/build-packages.test.mjs`

**Interfaces:**
- Consumes: `PACKAGES`, `readVersion` (Task 1); `copyGlob`, `rewriteStylesImports`,
  `writeJSON`, `cleanDir`, `readText` (Task 2); `buildTokenFormats` (Task 3).
- Produces: `buildPackage(dir)` → `Promise<void>` builds one package into
  `dist/<dir>/`; `buildAll()` → builds all four. Invoked as
  `bun packaging/build-packages.mjs [dir]`.

- [ ] **Step 1: Add the dev dependencies**

Run:

```bash
bun add -D tsup typescript ng-packagr @angular/core @angular/common @angular/compiler @angular/compiler-cli tailwind-variants
```

Expected: `package.json` gains the devDependencies and `bun.lock` updates. These are
build-time only — the root manifest stays `private: true` and is never published.

- [ ] **Step 2: Add the scripts**

In `package.json`, add to `scripts`:

```json
"build:packages": "bun packaging/build-packages.mjs",
"check:packages": "bun scripts/check-packages.mjs",
"smoke:packages": "bun scripts/smoke-packages.mjs"
```

- [ ] **Step 3: Write the failing test**

Create `packaging/build-packages.test.mjs`:

```js
import { test, expect } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildPackage } from './build-packages.mjs';
import { readVersion } from './packages.config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist/arena-tokens');

await buildPackage('arena-tokens');

test('the six token CSS files and styles.css are present', () => {
  for (const f of ['fonts', 'palette', 'colors', 'typography', 'spacing', 'effects', 'styles']) {
    expect(existsSync(join(out, `css/${f}.css`))).toBe(true);
  }
});

test('styles.css imports its siblings flatly, not through tokens/', () => {
  const css = readFileSync(join(out, 'css/styles.css'), 'utf8');
  expect(css).toContain('@import "./palette.css";');
  expect(css).not.toContain('tokens/');
});

test('the font binaries ship so css/fonts.css ../assets/fonts/ resolves', () => {
  expect(existsSync(join(out, 'assets/fonts/archivo-400.woff2'))).toBe(true);
  const fonts = readFileSync(join(out, 'css/fonts.css'), 'utf8');
  expect(fonts).toContain('../assets/fonts/');
});

test('the JS and JSON platforms are emitted', () => {
  for (const f of ['js/index.mjs', 'js/index.cjs', 'js/index.d.ts', 'json/tokens.json']) {
    expect(existsSync(join(out, f))).toBe(true);
  }
});

test('the manifest is stamped with the version from plugin.json', () => {
  const manifest = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'));
  expect(manifest.version).toBe(readVersion(root));
  expect(manifest.name).toBe('@dravensoft/arena-tokens');
});

test('every exports target resolves to a file that exists', () => {
  const manifest = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'));
  const targets = [];
  const walk = (node) => {
    if (typeof node === 'string') { targets.push(node); return; }
    for (const v of Object.values(node)) walk(v);
  };
  walk(manifest.exports);
  for (const t of targets) {
    if (t.includes('*')) continue;
    expect(existsSync(join(out, t))).toBe(true);
  }
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `bun test packaging/build-packages.test.mjs`
Expected: FAIL — `Cannot find module './build-packages.mjs'`

- [ ] **Step 5: Write the orchestrator with the tokens assembler**

Create `packaging/build-packages.mjs`:

```js
/* Assembles the four publishable packages into dist/, from the tree in place.
 *
 * Nothing is relocated and nothing in dist/ is ever hand-edited: each package is
 * a file map plus a manifest template, stamped with the version read from
 * .claude-plugin/plugin.json. dist/ is git-ignored because, unlike the generated
 * token CSS, package output is not tag-frozen — CI rebuilds it from the tagged
 * sources.
 *
 *   bun packaging/build-packages.mjs             -> all four
 *   bun packaging/build-packages.mjs arena-react -> just one
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PACKAGES, readVersion } from './packages.config.mjs';
import { copyGlob, rewriteStylesImports, writeJSON, cleanDir, readText } from './assemble.mjs';
import { buildTokenFormats } from './token-formats.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = (dir) => join(root, 'dist', dir);

/** Per-package assembly. Each returns once dist/<dir>/ holds everything but the
 *  manifest, which the orchestrator writes last so a half-built package never
 *  looks publishable. */
const ASSEMBLERS = {
  async 'arena-tokens'(out) {
    await copyGlob(join(root, 'tokens'), '*.css', join(out, 'css'));
    writeFileSync(join(out, 'css/styles.css'), rewriteStylesImports(readText(join(root, 'styles.css'))));
    await copyGlob(join(root, 'assets/fonts'), '*.woff2', join(out, 'assets/fonts'));

    const formats = await buildTokenFormats();
    mkdirSync(join(out, 'js'), { recursive: true });
    mkdirSync(join(out, 'json'), { recursive: true });
    writeFileSync(join(out, 'js/index.mjs'), formats.js);
    writeFileSync(join(out, 'js/index.cjs'), formats.cjs);
    writeFileSync(join(out, 'js/index.d.ts'), formats.dts);
    writeFileSync(join(out, 'json/tokens.json'), formats.json);
  },
};

export async function buildPackage(dir) {
  const pkg = PACKAGES.find((p) => p.dir === dir);
  if (!pkg) throw new Error(`build-packages: no package named "${dir}"`);
  const assemble = ASSEMBLERS[dir];
  if (!assemble) throw new Error(`build-packages: no assembler for "${dir}" yet`);

  const out = distDir(dir);
  cleanDir(out);
  await assemble(out);
  writeJSON(join(out, 'package.json'), pkg.manifest(readVersion(root)));
  console.log(`build-packages: assembled dist/${dir}`);
}

export async function buildAll() {
  for (const pkg of PACKAGES) {
    if (!ASSEMBLERS[pkg.dir]) {
      console.log(`build-packages: skipping ${pkg.dir} (no assembler yet)`);
      continue;
    }
    await buildPackage(pkg.dir);
  }
}

async function main() {
  const only = process.argv[2];
  if (only) await buildPackage(only);
  else await buildAll();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `bun test packaging/build-packages.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 7: Build it for real and inspect**

Run: `bun run build:packages && find dist/arena-tokens -type f | sort`
Expected: the CSS files, the font binaries, `js/index.{mjs,cjs,d.ts}`,
`json/tokens.json`, `package.json`.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lock packaging/build-packages.mjs packaging/build-packages.test.mjs
git commit -m "feat(packaging): assemble @dravensoft/arena-tokens from the tree in place"
```

---

### Task 6: `arena-react`

**Files:**
- Create: `packaging/react.tsup.ts`
- Modify: `packaging/build-packages.mjs` (add the assembler)
- Modify: `packaging/build-packages.test.mjs` (add the React block)

**Interfaces:**
- Consumes: `buildPackage` (Task 5), the barrel (Task 4).
- Produces: `dist/arena-react/dist/*.{mjs,cjs}` and `dist/arena-react/types/**/*.d.ts`.
  The `exports` map from Task 1 already points at these paths — the emitted layout
  must match it, not the other way round.

- [ ] **Step 1: Write the tsup config**

Create `packaging/react.tsup.ts`:

```ts
/* tsup config for @dravensoft/arena-react.
 *
 * Transpile only. The .d.ts files are hand-written and are the API's authority,
 * so they are copied verbatim by the assembler rather than re-emitted from the
 * .jsx — generating them would produce `any` props and silently replace a
 * documented surface with an inferred one.
 *
 * The barrel plus every component is an entry, so `exports["./*"]` gives every
 * component a deep import that does not pull the barrel in.
 */
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'frameworks/react/index.js',
    'frameworks/react/use-container-width.js',
    'frameworks/react/components/**/*.jsx',
    'frameworks/react/components/**/*-internals.js',
  ],
  outDir: 'dist/arena-react/dist',
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
  // React is a peer; never bundle it, and never bundle the sibling entries into
  // each other — each stays its own module so a deep import stays small.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  splitting: false,
  bundle: false,
  clean: false,
  dts: false,
  sourcemap: false,
  target: 'es2022',
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.loader = { ...options.loader, '.js': 'jsx' };
  },
});
```

- [ ] **Step 2: Add the assembler**

In `packaging/build-packages.mjs`, add to the `ASSEMBLERS` object, after
`'arena-tokens'`:

```js
  async 'arena-react'(out) {
    await run('bunx', ['tsup', '--config', 'packaging/react.tsup.ts']);
    // Flatten the emitted tree: tsup mirrors the source layout under
    // frameworks/react/, but the exports map addresses components by bare name.
    await flatten(join(out, 'dist/frameworks/react'), join(out, 'dist'));
    rmSync(join(out, 'dist/frameworks'), { recursive: true, force: true });
    // The hand-written types are the API's authority — copied, never inferred.
    await copyGlob(join(root, 'frameworks/react'), 'index.d.ts', join(out, 'types'));
    await flattenCopy(join(root, 'frameworks/react/components'), '**/*.d.ts', join(out, 'types'));
  },
```

Extend the existing `node:fs` import at the top of the file to
`import { writeFileSync, mkdirSync, rmSync, renameSync, readdirSync, statSync } from 'node:fs';`
and add one new import line beside the others:

```js
import { spawn } from 'node:child_process';
```

Then add these helpers above `ASSEMBLERS`:

```js
/** Runs a command from the repo root, failing loudly — a build tool that exits
 *  non-zero must never leave a half-assembled package looking publishable. */
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: 'inherit' });
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)));
  });
}

/** Moves every file under `from` (recursively) to the flat directory `to`. */
async function flatten(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const full = join(from, entry);
    if (statSync(full).isDirectory()) { await flatten(full, to); continue; }
    renameSync(full, join(to, entry));
  }
}

/** Copies files matching `pattern` under `from` into the flat directory `to`. */
async function flattenCopy(from, pattern, to) {
  const staged = join(to, '.staged');
  await copyGlob(from, pattern, staged);
  await flatten(staged, to);
  rmSync(staged, { recursive: true, force: true });
}
```

- [ ] **Step 3: Extend the test**

Append to `packaging/build-packages.test.mjs`:

```js
import { readdirSync } from 'node:fs';

const reactOut = join(root, 'dist/arena-react');
await buildPackage('arena-react');

test('the barrel is emitted in both formats', () => {
  expect(existsSync(join(reactOut, 'dist/index.mjs'))).toBe(true);
  expect(existsSync(join(reactOut, 'dist/index.cjs'))).toBe(true);
});

test('every component is its own module, addressable by bare name', () => {
  for (const name of ['Button', 'Tag', 'Dialog', 'BarChart', 'Rotor']) {
    expect(existsSync(join(reactOut, `dist/${name}.mjs`))).toBe(true);
    expect(existsSync(join(reactOut, `dist/${name}.cjs`))).toBe(true);
  }
});

test('the hand-written types are copied, not inferred', () => {
  const dts = readFileSync(join(reactOut, 'types/Button.d.ts'), 'utf8');
  const source = readFileSync(join(root, 'frameworks/react/components/forms/Button.d.ts'), 'utf8');
  expect(dts).toBe(source);
});

test('React is left external, never bundled', () => {
  const js = readFileSync(join(reactOut, 'dist/Button.mjs'), 'utf8');
  expect(js).toContain('from "react"');
  expect(js).not.toContain('createRoot');
});

test('no JSX survives transpilation', () => {
  const js = readFileSync(join(reactOut, 'dist/Button.mjs'), 'utf8');
  expect(js).toContain('jsx');
  expect(js).not.toMatch(/<button/);
});

test('the ui_kits example app is excluded from the package', () => {
  const emitted = readdirSync(join(reactOut, 'dist'));
  for (const screen of ['LoginScreen', 'DashboardScreen', 'ProjectScreen', 'Shell']) {
    expect(emitted).not.toContain(`${screen}.mjs`);
  }
});
```

- [ ] **Step 4: Run the test**

Run: `bun test packaging/build-packages.test.mjs`
Expected: PASS — the six token tests plus the six React ones.

If `flatten` collides on a duplicate basename, that means two components in
different groups share a name. Do not rename a component to fix it; report it, since
`exports["./*"]` cannot address two files with the same bare name and the package
shape would have to change.

- [ ] **Step 5: Commit**

```bash
git add packaging/react.tsup.ts packaging/build-packages.mjs packaging/build-packages.test.mjs
git commit -m "feat(packaging): build @dravensoft/arena-react with tsup, hand-written types intact"
```

---

### Task 7: `arena-tailwind`

**Files:**
- Create: `packaging/tailwind.tsup.ts`
- Modify: `packaging/build-packages.mjs` (add the assembler)
- Modify: `packaging/build-packages.test.mjs` (add the Tailwind block)

**Interfaces:**
- Consumes: `buildPackage`, `copyGlob`, `run`, `flatten`.
- Produces: `dist/arena-tailwind/{dist/tv.*,theme.css,manifests/*,variants/*}`.

Everything here is glob-driven, so the coverage and parity work adds manifests and
recipes to `frameworks/tailwind/components/` and this package picks them up with no
edit.

- [ ] **Step 1: Write the tsup config**

Create `packaging/tailwind.tsup.ts`:

```ts
/* tsup config for @dravensoft/arena-tailwind.
 *
 * tv.ts and the shared recipes compile to ESM + CJS with real .d.ts (unlike the
 * React layer, these are authored in TypeScript, so emitting types from the
 * source is correct here). theme.css and the *.manifest.json files are data and
 * are copied verbatim by the assembler.
 */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { tv: 'frameworks/tailwind/tv.ts' },
    outDir: 'dist/arena-tailwind/dist',
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
    external: ['tailwind-variants'],
    dts: true,
    clean: false,
    sourcemap: false,
    target: 'es2022',
  },
  {
    // Zero recipes today; the glob is what makes the package grow with the layer
    // instead of needing an edit per component.
    entry: ['frameworks/tailwind/components/**/*.variants.ts'],
    outDir: 'dist/arena-tailwind/variants',
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
    external: ['tailwind-variants', '../tv'],
    bundle: false,
    dts: true,
    clean: false,
    sourcemap: false,
    target: 'es2022',
  },
]);
```

- [ ] **Step 2: Add the assembler**

In `packaging/build-packages.mjs`, add to `ASSEMBLERS`:

```js
  async 'arena-tailwind'(out) {
    await run('bunx', ['tsup', '--config', 'packaging/tailwind.tsup.ts']);
    // theme.css ships byte-for-byte. Its self-referential --color-* entries are
    // correct and load-bearing: Tailwind emits @theme inside @layer theme,
    // Arena's tokens are unlayered, and unlayered wins — so Arena's value
    // resolves. Rewriting them here would break the preset.
    cpSync(join(root, 'frameworks/tailwind/theme.css'), join(out, 'theme.css'));
    await copyGlob(join(root, 'frameworks/tailwind/components'), '**/*.manifest.json', join(out, 'manifests'));
    if (existsSync(join(out, 'variants/frameworks'))) {
      await flatten(join(out, 'variants/frameworks'), join(out, 'variants'));
      rmSync(join(out, 'variants/frameworks'), { recursive: true, force: true });
    }
    mkdirSync(join(out, 'variants'), { recursive: true });
  },
```

and extend the imports at the top of the file:

```js
import { cpSync, existsSync } from 'node:fs';
```

- [ ] **Step 3: Extend the test**

Append to `packaging/build-packages.test.mjs`:

```js
const twOut = join(root, 'dist/arena-tailwind');
await buildPackage('arena-tailwind');

test('tv compiles to both formats with real types', () => {
  for (const f of ['dist/tv.mjs', 'dist/tv.cjs', 'dist/tv.d.ts']) {
    expect(existsSync(join(twOut, f))).toBe(true);
  }
});

test('the configured tv is importable and is a function', async () => {
  const mod = await import(join(twOut, 'dist/tv.mjs'));
  expect(typeof mod.tv).toBe('function');
});

test('theme.css ships byte-for-byte, self-references intact', () => {
  const shipped = readFileSync(join(twOut, 'theme.css'), 'utf8');
  const source = readFileSync(join(root, 'frameworks/tailwind/theme.css'), 'utf8');
  expect(shipped).toBe(source);
  expect(shipped).toContain('--color-base-100: var(--color-base-100)');
});

test('every component manifest ships, flat, under manifests/', () => {
  expect(existsSync(join(twOut, 'manifests/Button.manifest.json'))).toBe(true);
});

test('tailwind-variants is left external', () => {
  const js = readFileSync(join(twOut, 'dist/tv.mjs'), 'utf8');
  expect(js).toContain('tailwind-variants');
  expect(js).not.toContain('function createTV');
});
```

- [ ] **Step 4: Run the test**

Run: `bun test packaging/build-packages.test.mjs`
Expected: PASS — tokens, React and Tailwind blocks.

- [ ] **Step 5: Commit**

```bash
git add packaging/tailwind.tsup.ts packaging/build-packages.mjs packaging/build-packages.test.mjs
git commit -m "feat(packaging): build @dravensoft/arena-tailwind, theme.css shipped verbatim"
```

---

### Task 8: `arena-angular`

**Files:**
- Create: `packaging/angular/ng-package.json`
- Create: `packaging/angular/tsconfig.lib.json`
- Create: `packaging/angular/public-api.ts`
- Modify: `packaging/build-packages.mjs` (add the assembler)
- Modify: `packaging/build-packages.test.mjs` (add the Angular block)

**Interfaces:**
- Consumes: `buildPackage`, `run`, `writeJSON`.
- Produces: Angular Package Format output in `dist/arena-angular/`. **ng-packagr
  writes its own `package.json`** including the `exports` map, `module`, `types` and
  fesm paths — so unlike the other three, the manifest template from Task 1 is
  *merged into* what ng-packagr emitted rather than replacing it.

- [ ] **Step 1: Write the ng-packagr config**

Create `packaging/angular/ng-package.json`:

```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/arena-angular",
  "assets": [
    { "input": "../../frameworks/angular/theme", "glob": "*.css", "output": "./theme" }
  ],
  "lib": {
    "entryFile": "public-api.ts"
  }
}
```

Create `packaging/angular/tsconfig.lib.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "declaration": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "strict": true,
    "skipLibCheck": true,
    "importHelpers": true,
    "paths": {
      "tailwind-variants": ["../../node_modules/tailwind-variants"]
    }
  },
  "angularCompilerOptions": {
    "compilationMode": "partial",
    "strictTemplates": true
  },
  "files": ["public-api.ts"]
}
```

Create `packaging/angular/public-api.ts`:

```ts
/* The published surface of @dravensoft/arena-angular.
 *
 * frameworks/angular/index.ts is the authority for what the layer exports; this
 * file exists only because ng-packagr needs an entry file inside its own project
 * directory. Adding a primitive means editing that barrel, never this one. */
export * from '../../frameworks/angular/index';
```

- [ ] **Step 2: Add the assembler**

In `packaging/build-packages.mjs`, add to `ASSEMBLERS`:

```js
  async 'arena-angular'(out) {
    await run('bunx', [
      'ng-packagr',
      '-p', 'packaging/angular/ng-package.json',
      '-c', 'packaging/angular/tsconfig.lib.json',
    ]);
    // ng-packagr writes its own package.json — the exports map, fesm paths and
    // typings entries are its output and must survive. Our template contributes
    // the fields it does not write (identity, licence, peers), so here the
    // manifest is merged rather than overwritten.
    const generated = JSON.parse(readText(join(out, 'package.json')));
    const template = PACKAGES.find((p) => p.dir === 'arena-angular').manifest(readVersion(root));
    writeJSON(join(out, 'package.json'), {
      ...generated,
      ...template,
      exports: {
        ...generated.exports,
        './theme/*': './theme/*',
      },
    });
  },
```

**Note for the implementer:** the orchestrator writes the manifest after the
assembler returns, which would clobber this merge. Change `buildPackage` so the
manifest write is skippable:

```js
export async function buildPackage(dir) {
  const pkg = PACKAGES.find((p) => p.dir === dir);
  if (!pkg) throw new Error(`build-packages: no package named "${dir}"`);
  const assemble = ASSEMBLERS[dir];
  if (!assemble) throw new Error(`build-packages: no assembler for "${dir}" yet`);

  const out = distDir(dir);
  cleanDir(out);
  const wroteManifest = await assemble(out);
  if (!wroteManifest) writeJSON(join(out, 'package.json'), pkg.manifest(readVersion(root)));
  console.log(`build-packages: assembled dist/${dir}`);
}
```

and end the `arena-angular` assembler with `return true;` while the other three
return nothing.

- [ ] **Step 3: Extend the test**

Append to `packaging/build-packages.test.mjs`:

```js
const ngOut = join(root, 'dist/arena-angular');
await buildPackage('arena-angular');

test('ng-packagr emits Angular Package Format output', () => {
  const manifest = JSON.parse(readFileSync(join(ngOut, 'package.json'), 'utf8'));
  expect(manifest.name).toBe('@dravensoft/arena-angular');
  expect(manifest.version).toBe(readVersion(root));
  expect(manifest.exports['.']).toBeDefined();
  expect(existsSync(join(ngOut, 'index.d.ts'))).toBe(true);
});

test('the merge keeps ng-packagr fesm entries and our peer graph', () => {
  const manifest = JSON.parse(readFileSync(join(ngOut, 'package.json'), 'utf8'));
  expect(JSON.stringify(manifest.exports)).toContain('fesm2022');
  expect(manifest.peerDependencies['@dravensoft/arena-tokens']).toBe(readVersion(root));
  expect(manifest.license).toBe('MIT');
});

test('the Tag primitive is in the compiled output', () => {
  const dts = readFileSync(join(ngOut, 'index.d.ts'), 'utf8');
  expect(dts).toContain('Tag');
});

test('the theme CSS ships as package assets', () => {
  expect(existsSync(join(ngOut, 'theme/arena-tailwind.css'))).toBe(true);
  expect(existsSync(join(ngOut, 'theme/arena-material.css'))).toBe(true);
});
```

- [ ] **Step 4: Run the test**

Run: `bun test packaging/build-packages.test.mjs`
Expected: PASS — all four blocks.

ng-packagr is the most likely of the four to need iteration. If it fails to resolve
`tailwind-variants` from the `.variants.ts` file, extend the `paths` map in
`tsconfig.lib.json` rather than moving any source file — the derive-in-place
constraint holds.

- [ ] **Step 5: Build all four together**

Run: `bun run build:packages`
Expected: four `build-packages: assembled dist/…` lines, no skips.

- [ ] **Step 6: Commit**

```bash
git add packaging/angular packaging/build-packages.mjs packaging/build-packages.test.mjs
git commit -m "feat(packaging): build @dravensoft/arena-angular with ng-packagr"
```

---

### Task 9: `check-packages.mjs` — the gate

The mechanical enforcement of §H. It joins `check-release.mjs` in the
release-coherence family and follows its reporting shape: collect findings, print a
table, exit 1 on any failure.

**Files:**
- Create: `scripts/check-packages.mjs`
- Create: `scripts/check-packages.test.mjs`

**Interfaces:**
- Consumes: `PACKAGES`, `SCOPE`, `readVersion` from `packaging/packages.config.mjs`.
- Produces: `auditPackages(root)` → `{ ok: boolean, findings: string[] }`, exported so
  it is testable without spawning a process. The CLI wrapper prints and exits.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-packages.test.mjs`:

```js
import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { auditPackages } from './check-packages.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('a real build passes the audit', async () => {
  const { ok, findings } = await auditPackages(repoRoot);
  expect(findings).toEqual([]);
  expect(ok).toBe(true);
});

/** Builds a fake dist/ so failure modes can be provoked without a real build. */
function fakeRoot(mutate) {
  const root = mkdtempSync(join(tmpdir(), 'arena-check-'));
  mkdirSync(join(root, '.claude-plugin'), { recursive: true });
  writeFileSync(join(root, '.claude-plugin/plugin.json'), JSON.stringify({ version: '5.0.0' }));
  const manifests = {
    'arena-tokens': { name: '@dravensoft/arena-tokens', version: '5.0.0', exports: {} },
    'arena-react': {
      name: '@dravensoft/arena-react', version: '5.0.0', exports: {},
      peerDependencies: { '@dravensoft/arena-tokens': '5.0.0' },
    },
    'arena-angular': {
      name: '@dravensoft/arena-angular', version: '5.0.0', exports: {},
      peerDependencies: { '@dravensoft/arena-tokens': '5.0.0', '@dravensoft/arena-tailwind': '5.0.0' },
    },
    'arena-tailwind': {
      name: '@dravensoft/arena-tailwind', version: '5.0.0', exports: {},
      peerDependencies: { '@dravensoft/arena-tokens': '5.0.0' },
    },
  };
  mutate(manifests);
  for (const [dir, manifest] of Object.entries(manifests)) {
    mkdirSync(join(root, 'dist', dir), { recursive: true });
    writeFileSync(join(root, 'dist', dir, 'package.json'), JSON.stringify(manifest));
  }
  return root;
}

test('a version that disagrees with plugin.json is caught', async () => {
  const root = fakeRoot((m) => { m['arena-react'].version = '4.9.0'; });
  const { ok, findings } = await auditPackages(root);
  expect(ok).toBe(false);
  expect(findings.join('\n')).toContain('arena-react');
  expect(findings.join('\n')).toContain('4.9.0');
});

test('a caret arena peer range is caught', async () => {
  const root = fakeRoot((m) => { m['arena-react'].peerDependencies['@dravensoft/arena-tokens'] = '^5.0.0'; });
  const { ok, findings } = await auditPackages(root);
  expect(ok).toBe(false);
  expect(findings.join('\n')).toContain('^5.0.0');
});

test('an arena package in dependencies is caught', async () => {
  const root = fakeRoot((m) => { m['arena-react'].dependencies = { '@dravensoft/arena-tokens': '5.0.0' }; });
  const { ok, findings } = await auditPackages(root);
  expect(ok).toBe(false);
  expect(findings.join('\n')).toContain('dependencies');
});

test('an install script is caught', async () => {
  const root = fakeRoot((m) => { m['arena-tokens'].scripts = { postinstall: 'echo hi' }; });
  const { ok, findings } = await auditPackages(root);
  expect(ok).toBe(false);
  expect(findings.join('\n')).toContain('postinstall');
});

test('a missing package is caught', async () => {
  const root = fakeRoot((m) => { delete m['arena-angular']; });
  const { ok, findings } = await auditPackages(root);
  expect(ok).toBe(false);
  expect(findings.join('\n')).toContain('arena-angular');
});

test('an exports target pointing at a file that does not exist is caught', async () => {
  const root = fakeRoot((m) => { m['arena-tokens'].exports = { './styles.css': './css/styles.css' }; });
  const { ok, findings } = await auditPackages(root);
  expect(ok).toBe(false);
  expect(findings.join('\n')).toContain('css/styles.css');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test scripts/check-packages.test.mjs`
Expected: FAIL — `Cannot find module './check-packages.mjs'`

- [ ] **Step 3: Write the gate**

Create `scripts/check-packages.mjs`:

```js
/* Asserts the four assembled packages are coherent before any of them is published.
 *
 * The failure this exists for is the same shape as the one check-release.mjs
 * guards: silent. Publish arena-angular@4.1.0 with a peer on arena-tokens@^4.0.0
 * and nothing errors — the install resolves, the app builds, and the consumer
 * quietly gets a token set the components were never tested against. Lockstep is
 * only a guarantee if a machine enforces it.
 *
 *   bun scripts/check-packages.mjs   -> exit 0 if coherent, 1 otherwise
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PACKAGES, SCOPE, readVersion } from '../packaging/packages.config.mjs';

const FORBIDDEN_SCRIPTS = ['preinstall', 'install', 'postinstall', 'prepare'];

/** Collects every string leaf of an exports map. */
function exportTargets(node, out = []) {
  if (typeof node === 'string') { out.push(node); return out; }
  if (node && typeof node === 'object') for (const v of Object.values(node)) exportTargets(v, out);
  return out;
}

export async function auditPackages(root) {
  const findings = [];
  const version = readVersion(root);

  for (const pkg of PACKAGES) {
    const dir = join(root, 'dist', pkg.dir);
    const manifestPath = join(dir, 'package.json');

    if (!existsSync(manifestPath)) {
      findings.push(`${pkg.dir}: not built — dist/${pkg.dir}/package.json is missing`);
      continue;
    }

    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      findings.push(`${pkg.dir}: package.json is not parseable — ${e.message}`);
      continue;
    }

    if (manifest.name !== pkg.name)
      findings.push(`${pkg.dir}: name is "${manifest.name}", expected "${pkg.name}"`);

    if (manifest.version !== version)
      findings.push(`${pkg.dir}: version is "${manifest.version}", but plugin.json says "${version}"`);

    for (const [dep, range] of Object.entries(manifest.peerDependencies ?? {})) {
      if (!dep.startsWith(SCOPE)) continue;
      if (range !== version)
        findings.push(`${pkg.dir}: peer "${dep}" is "${range}", expected the exact version "${version}"`);
    }

    for (const dep of Object.keys(manifest.dependencies ?? {})) {
      if (dep.startsWith(SCOPE))
        findings.push(`${pkg.dir}: "${dep}" is in dependencies — arena packages must be peerDependencies`);
    }

    for (const script of Object.keys(manifest.scripts ?? {})) {
      if (FORBIDDEN_SCRIPTS.includes(script))
        findings.push(`${pkg.dir}: declares a "${script}" lifecycle script — published packages run nothing at install`);
    }

    for (const target of exportTargets(manifest.exports ?? {})) {
      if (target.includes('*')) continue;
      if (!existsSync(join(dir, target)))
        findings.push(`${pkg.dir}: exports target "${target}" does not exist in the built package`);
    }

    if (manifest.private)
      findings.push(`${pkg.dir}: marked private — it would never publish`);
  }

  return { ok: findings.length === 0, findings };
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const version = readVersion(root);
  const { ok, findings } = await auditPackages(root);

  if (!ok) {
    console.error(`\ncheck-packages: ${findings.length} problem(s) in dist/\n`);
    for (const f of findings) console.error(`  [FAIL] ${f}`);
    console.error('\nRun: bun run build:packages\n');
    process.exit(1);
  }
  console.log(`\ncheck-packages: ${PACKAGES.length} packages coherent at ${version}, lockstep intact.\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run build:packages && bun test scripts/check-packages.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Run the gate for real**

Run: `bun run check:packages`
Expected: `check-packages: 4 packages coherent at 4.0.0, lockstep intact.`

- [ ] **Step 6: Commit**

```bash
git add scripts/check-packages.mjs scripts/check-packages.test.mjs
git commit -m "feat(scripts): add check-packages, the lockstep gate for the four npm packages"
```

---

### Task 10: Tarball smoke test under both Bun and npm

Bun compatibility is claimed by standards-compliance; this is the step that proves
it rather than asserting it.

**Files:**
- Create: `scripts/smoke-packages.mjs`

**Interfaces:**
- Consumes: the built `dist/`.
- Produces: a CLI that exits 0 when every package installs and resolves under both
  runtimes. Not a `bun test` file — it shells out to two package managers and is too
  slow for the unit suite; it runs in CI and on demand.

- [ ] **Step 1: Write the smoke script**

Create `scripts/smoke-packages.mjs`:

```js
/* Packs each built package and installs it into a throwaway consumer under BOTH
 * bun and npm, then resolves its entry points.
 *
 * Bun is a first-class target here, and the way this repo keeps that promise is
 * standards-compliance rather than Bun-specific code — a correctly ordered
 * conditional exports map, no lifecycle scripts, no main-only resolution. That
 * is a claim, and this script is what turns it into a measurement.
 *
 *   bun scripts/smoke-packages.mjs   -> exit 0 if every package resolves under both
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PACKAGES } from '../packaging/packages.config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const sh = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** `npm pack` into a temp dir, returning the tarball path. */
function pack(pkgDir) {
  const outDir = mkdtempSync(join(tmpdir(), 'arena-pack-'));
  sh('npm', ['pack', '--pack-destination', outDir], pkgDir);
  const tgz = readdirSync(outDir).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error(`npm pack produced no tarball for ${pkgDir}`);
  return join(outDir, tgz);
}

/** Installs `tarball` in a fresh consumer with `manager`, then runs `probe`. */
function installAndProbe(manager, installArgs, tarball, name, probe) {
  const consumer = mkdtempSync(join(tmpdir(), `arena-consumer-${manager}-`));
  writeFileSync(join(consumer, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2));
  try {
    sh(manager, [...installArgs, tarball], consumer);
  } catch (e) {
    failures.push(`${name}: ${manager} install failed — ${e.stderr ?? e.message}`);
    return;
  }
  writeFileSync(join(consumer, 'probe.mjs'), probe);
  try {
    sh(manager === 'bun' ? 'bun' : 'node', ['probe.mjs'], consumer);
    console.log(`  [PASS] ${name} under ${manager}`);
  } catch (e) {
    failures.push(`${name}: ${manager} probe failed — ${e.stderr ?? e.message}`);
  }
}

/* Peers are intentionally not installed: the probe resolves module specifiers and
 * CSS paths, which is what the exports map is responsible for. Importing a React
 * component would need react in the consumer and would be testing React, not the
 * package's resolution. */
const PROBES = {
  'arena-tokens': `
    import { tokens, cssVar } from '@dravensoft/arena-tokens';
    import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    if (!tokens || Object.keys(tokens).length < 100) throw new Error('token map is empty');
    if (cssVar('color-base-100') !== 'var(--color-base-100)') throw new Error('cssVar is wrong');
    require.resolve('@dravensoft/arena-tokens/styles.css');
    require.resolve('@dravensoft/arena-tokens/css/palette.css');
    require.resolve('@dravensoft/arena-tokens/json');
  `,
  'arena-tailwind': `
    import { tv } from '@dravensoft/arena-tailwind';
    import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    if (typeof tv !== 'function') throw new Error('tv is not a function');
    require.resolve('@dravensoft/arena-tailwind/theme.css');
  `,
  'arena-react': `
    import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    // Resolution only — importing would require react in this bare consumer.
    require.resolve('@dravensoft/arena-react');
    require.resolve('@dravensoft/arena-react/Button');
  `,
  'arena-angular': `
    import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    require.resolve('@dravensoft/arena-angular');
  `,
};

console.log('\nsmoke-packages: packing and installing under bun and npm\n');

for (const pkg of PACKAGES) {
  const dir = join(root, 'dist', pkg.dir);
  if (!existsSync(join(dir, 'package.json'))) {
    failures.push(`${pkg.dir}: not built`);
    continue;
  }
  const tarball = pack(dir);
  const probe = PROBES[pkg.dir];
  installAndProbe('npm', ['install', '--no-audit', '--no-fund'], tarball, pkg.name, probe);
  installAndProbe('bun', ['add'], tarball, pkg.name, probe);
}

if (failures.length) {
  console.error(`\nsmoke-packages: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error(`  [FAIL] ${f}`);
  process.exit(1);
}
console.log(`\nsmoke-packages: all ${PACKAGES.length} packages resolve under both bun and npm.\n`);
```

- [ ] **Step 2: Run it**

Run: `bun run build:packages && bun run smoke:packages`
Expected: eight `[PASS]` lines (four packages × two managers) and the summary.

`tailwind-variants` is an unmet peer in the bare consumer; that is a warning, not a
failure, because the probe only resolves `tv`'s specifier. If a probe fails on an
unmet peer, add the peer to the consumer's install rather than loosening the probe.

- [ ] **Step 3: Inspect one tarball's file list**

Run: `cd dist/arena-react && npm pack --dry-run 2>&1 | head -60`
Expected: only `dist/` and `types/` contents plus `package.json`. **No `.jsx` source
and no `ui_kits`.** If either appears, the `files` field in `packages.config.mjs` is
wrong — fix it there, then re-run Task 9's gate.

- [ ] **Step 4: Commit**

```bash
git add scripts/smoke-packages.mjs
git commit -m "feat(scripts): prove Bun and npm parity with a tarball smoke matrix"
```

---

### Task 11: The release workflow

Tag-triggered, gated, and — per the sequencing decision — **not switched on**. The
publish step is guarded by a repository variable that stays unset until Angular and
Tailwind reach parity. Everything before the guard runs on every tag, so the build
is exercised long before it is trusted.

**Files:**
- Create: `.github/workflows/release-packages.yml`

**Interfaces:**
- Consumes: `bun run build:packages`, `bun scripts/check-*.mjs`.
- Produces: four published packages, once `vars.ARENA_PUBLISH_PACKAGES == 'true'`.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/release-packages.yml`:

```yaml
# Publishes the four Arena npm packages, and only ever from a release tag —
# cutting a release stays a deliberate manual act; CI only reacts to the tag.
#
# Authentication is npm trusted publishing (OIDC): no NPM_TOKEN is stored, each
# publish uses a short-lived token scoped to this workflow, and provenance is
# generated automatically for public packages from a public repo. This requires
# a GitHub-hosted runner, npm >= 11.5.1 and Node >= 22.14.0.
#
# The publish step is deliberately gated on the ARENA_PUBLISH_PACKAGES repository
# variable. Until the Angular and Tailwind layers reach parity with React, a tag
# builds and verifies all four packages and publishes none of them.
name: release-packages

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write        # required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0     # check-release reads tags and origin/main

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
          registry-url: 'https://registry.npmjs.org'

      - name: Use an npm that supports trusted publishing
        run: |
          npm install -g npm@latest
          npm --version

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Gate — release coherence
        run: bun scripts/check-release.mjs

      - name: Gate — token source is valid DTCG
        run: bun scripts/check-dtcg.mjs

      - name: Gate — committed token CSS matches the source
        run: |
          bun run build:tokens
          bun scripts/check-tokens-generated.mjs

      - name: Gate — the colour ramp still clears every threshold
        run: bun scripts/check-ramp.mjs

      - name: Unit tests
        run: bun test

      - name: Build the four packages
        run: bun run build:packages

      - name: Gate — package coherence and lockstep
        run: bun scripts/check-packages.mjs

      - name: Smoke — resolve under both bun and npm
        run: bun scripts/smoke-packages.mjs

      - name: Publish (dry run)
        if: vars.ARENA_PUBLISH_PACKAGES != 'true'
        run: |
          echo "ARENA_PUBLISH_PACKAGES is not 'true' — building and verifying only."
          for pkg in arena-tokens arena-react arena-angular arena-tailwind; do
            echo "--- $pkg ---"
            (cd "dist/$pkg" && npm publish --dry-run)
          done

      # All four publish or the job fails. A partial publish is surfaced by the
      # failing step and the packages that did land, never hidden.
      - name: Publish to npm
        if: vars.ARENA_PUBLISH_PACKAGES == 'true'
        run: |
          set -e
          for pkg in arena-tokens arena-react arena-angular arena-tailwind; do
            echo "--- publishing $pkg ---"
            (cd "dist/$pkg" && npm publish)
          done
```

- [ ] **Step 2: Validate the YAML parses**

Run: `bunx js-yaml .github/workflows/release-packages.yml > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 3: Verify the local equivalent of the CI run passes**

Run:

```bash
bun scripts/check-dtcg.mjs && \
bun run build:tokens && bun scripts/check-tokens-generated.mjs && \
bun scripts/check-ramp.mjs && \
bun test && \
bun run build:packages && \
bun run check:packages && \
bun run smoke:packages
```

Expected: every gate exits 0. `check-release.mjs` is intentionally omitted here — it
fails off a release tag, which is correct.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release-packages.yml
git commit -m "ci: build and verify the four packages on every tag, publishing gated off"
```

---

### Task 12: Documentation

The spec's §L, plus the two decisions this plan made that the spec does not record.

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `frameworks/react/README.md`,
  `frameworks/angular/ADOPTION.md`, `frameworks/tailwind/README.md`, `CHANGELOG.md`

- [ ] **Step 1: Add the install section to `README.md`**

After the existing distribution/install material, add:

```markdown
## Install (npm / Bun)

Arena publishes four atomic packages under the `@dravensoft` scope. They are
lockstep-versioned — all four always carry Arena's version, and every arena→arena
dependency is a peer pinned to that exact version, never a caret.

| Package | What it gives you |
|---|---|
| `@dravensoft/arena-tokens` | The token layer: the CSS custom properties, a typed JS token map, and flattened DTCG JSON. Every other package needs it. |
| `@dravensoft/arena-react` | The 40 React components — inline-style, token-driven, no CSS classes. |
| `@dravensoft/arena-angular` | The standalone `OnPush` Angular primitives, the Material token bridge and the Tailwind preset entry. |
| `@dravensoft/arena-tailwind` | The shared Tailwind v4 `@theme` preset, the configured `tv` factory and the component recipes. |

```bash
bun add @dravensoft/arena-tokens @dravensoft/arena-react
# or
npm i @dravensoft/arena-tokens @dravensoft/arena-react
```

```js
import '@dravensoft/arena-tokens/styles.css';
import { Button } from '@dravensoft/arena-react';
```

The peer graph:

```
arena-tokens        (no arena peers)
arena-tailwind  ->  arena-tokens
arena-react     ->  arena-tokens
arena-angular   ->  arena-tokens, arena-tailwind
```

npm is an **additional** channel. The Claude Code plugin, the copy-in kit and the
Agent Skill are unchanged and remain first-class.
```

- [ ] **Step 2: Update `CLAUDE.md`**

In "What this repo is", change the three-way list to four by adding:

```markdown
- **four npm packages** (`@dravensoft/arena-{tokens,react,angular,tailwind}`), assembled
  from the tree in place by `bun run build:packages` into a git-ignored `dist/` and
  published from the release tag — never a monorepo restructure, never a moved file.
```

In "Conventions", extend the release rule paragraph:

```markdown
- **A release now also publishes four npm packages.** They are lockstep-versioned off
  the same `plugin.json` authority, assembled by `packaging/build-packages.mjs`, and
  gated by `bun scripts/check-packages.mjs` alongside `check-release.mjs`. The
  assembly logic lives in `packaging/` — **not** `build/`, which `.gitignore` ignores.
  Publishing runs on the tag via `.github/workflows/release-packages.yml` using npm
  trusted publishing (OIDC), so there is no npm token stored anywhere; the publish
  step stays gated on the `ARENA_PUBLISH_PACKAGES` repository variable until the
  Angular and Tailwind layers reach parity with React.
```

- [ ] **Step 3: Add the install path to each framework doc**

Beside the existing copy-in instructions in each file — keeping them, npm is
additional — add the layer's install section.

`frameworks/react/README.md`:

```markdown
## Install from npm

```bash
bun add @dravensoft/arena-react @dravensoft/arena-tokens react react-dom
```

```js
import '@dravensoft/arena-tokens/styles.css';
import { Button, Dialog } from '@dravensoft/arena-react';
// or deep-import, which does not pull the barrel in:
import { Button } from '@dravensoft/arena-react/Button';
```

`@dravensoft/arena-tokens` is a peer pinned to the exact same version — the
components read its custom properties and render nothing correct without it.
`@phosphor-icons/web` is an optional peer, needed only by the components that
render `ph-*` classes.
```

`frameworks/angular/ADOPTION.md`:

```markdown
## Install from npm

```bash
bun add @dravensoft/arena-angular @dravensoft/arena-tailwind @dravensoft/arena-tokens tailwind-variants
```

```ts
import { Tag } from '@dravensoft/arena-angular';
```

```css
@import '@dravensoft/arena-tokens/styles.css';
@import '@dravensoft/arena-angular/theme/arena-material.css';
```

All three arena peers are pinned to the exact same version and always move together.
```

`frameworks/tailwind/README.md`:

```markdown
## Install from npm

```bash
bun add @dravensoft/arena-tailwind @dravensoft/arena-tokens tailwindcss tailwind-variants
```

```css
@import 'tailwindcss';
@import '@dravensoft/arena-tokens/styles.css';
@import '@dravensoft/arena-tailwind/theme.css';
```

```ts
import { tv } from '@dravensoft/arena-tailwind';
```

The preset is nothing but `var()` references into Arena's tokens, so
`@dravensoft/arena-tokens` must be imported first and unlayered — that is what makes
the `@theme` self-references resolve.
```

- [ ] **Step 4: Add the CHANGELOG entry**

Under `## [Unreleased]` in `CHANGELOG.md` (create the heading if the last release
closed it — anything landing after a tag goes under `[Unreleased]`, never under the
last version):

```markdown
### Added

- Four atomic npm packages, assembled from the tree in place and lockstep-versioned
  off `plugin.json`: `@dravensoft/arena-tokens`, `@dravensoft/arena-react`,
  `@dravensoft/arena-angular`, `@dravensoft/arena-tailwind`. `bun run build:packages`
  assembles them into a git-ignored `dist/`; `bun scripts/check-packages.mjs` gates
  versions, peer ranges and `exports` resolution; `bun scripts/smoke-packages.mjs`
  proves every entry point resolves under both Bun and npm.
- `frameworks/react/index.js` — a barrel entry point, so the copy-in kit has an index
  too.
- `@dravensoft/arena-tokens` ships two new platform outputs off the same DTCG source:
  a typed JS token map and flattened JSON.
- `.github/workflows/release-packages.yml` builds and verifies all four on every tag.
  Publishing uses npm trusted publishing (OIDC, no stored token) and stays gated on
  the `ARENA_PUBLISH_PACKAGES` repository variable until the Angular and Tailwind
  layers reach parity with React.
```

- [ ] **Step 5: Verify nothing else drifted**

Run: `bun test && bun run check:packages`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add README.md CLAUDE.md CHANGELOG.md frameworks/react/README.md frameworks/angular/ADOPTION.md frameworks/tailwind/README.md
git commit -m "docs: document the four npm packages as Arena's fourth distribution mode"
```

---

## Verification

Run in order from a clean tree. Every one of these must pass before the branch is
considered done.

| # | Command | Expected |
|---|---|---|
| 1 | `bun install --frozen-lockfile` | resolves |
| 2 | `bun run build:tokens && git diff --stat tokens/` | no diff — the loader export changed no bytes |
| 3 | `bun scripts/check-dtcg.mjs` | exit 0 |
| 4 | `bun scripts/check-tokens-generated.mjs` | exit 0 |
| 5 | `bun scripts/check-ramp.mjs` | exit 0 |
| 6 | `bun scripts/check-text-contrast.mjs` | exit 0 |
| 7 | `bun test` | all suites pass |
| 8 | `bun run build:packages` | four `assembled dist/…` lines |
| 9 | `bun run check:packages` | `4 packages coherent at 4.0.0, lockstep intact` |
| 10 | `bun run smoke:packages` | 8 `[PASS]` lines |
| 11 | `cd dist/arena-react && npm pack --dry-run` | no `.jsx`, no `ui_kits` |
| 12 | `git status --porcelain dist/` | empty — `dist/` is ignored |
| 13 | `git diff --stat main -- tokens/ assets/ styles.css theme.js jsx-loader.js support.js .claude-plugin/` | empty — no authored file moved |
| 14 | `bun run demos`, open `Arena - Overview.html`, a `*.card.html`, and the console kit | render identically to `main` |

Item 13 is the derive-in-place constraint, stated as a command. Item 14 is the one
that cannot be automated: the three legacy distribution modes must be visually
unchanged, and only a person looking at them can confirm that.

## What this plan does not do

Named so their absence reads as a decision:

- **It does not publish anything.** Per the sequencing decision, the workflow's
  publish step is gated off until Angular and Tailwind reach parity with React.
- **It does not grow the Angular or Tailwind layers.** They stay at one component
  each. Every file map here is a glob, so parity work needs no edit in `packaging/`.
- **It does not implement the framework-layer token coverage spec.** That needs its
  own plan.
- **It does not create the npm organization.** `@dravensoft` was verified free on
  2026-07-18 (no package under the scope, no package by that name, zero search
  results), but the org must be created from a logged-in npm account, and trusted
  publishing is configured per package in npm's web UI. The likely bootstrap is one
  manual `npm publish` per package from an authenticated machine, then OIDC
  thereafter — npm's docs do not state whether a trusted publisher can be configured
  for a package that has never been published, so confirm before the first release.
