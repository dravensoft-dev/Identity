# `frameworks/` Directory Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every framework-bound file under a new top-level `frameworks/react/`, add empty `frameworks/angular/` and a shared, token-derived `frameworks/tailwind/` layer, fix all broken relative paths and the normative docs, and cut the breaking `v3.0.0` release.

**Architecture:** The repo root keeps only the framework-agnostic **language** (`tokens/`, `guidelines/`, `assets/`, `scripts/`, `styles.css`) plus the demo runtime (`theme.js`, `jsx-loader.js`, `support.js`) and brand (`*.dc.html`). Everything React (`components/`, `ui_kits/`, `use-container-width.js`) moves verbatim into `frameworks/react/`. A single `frameworks/tailwind/` holds the framework-neutral Tailwind consumption layer (a `@theme` preset + per-component manifests), authored once because the token→utility mapping is pure CSS.

**Tech Stack:** Plain static files — no build, no npm, no test framework. React JSX loaded in-browser via `jsx-loader.js` + esm.sh. Tailwind v4 (CSS-first `@theme`). Node ESM validators in `scripts/` (`check-ramp.mjs`, `check-text-contrast.mjs`, `check-release.mjs`). Verification is by HTTP-serving the repo and asserting pages render styled (no 404), plus grep gates and the node validators — those play the role tests would.

## Global Constraints

Copied verbatim from `CLAUDE.md` / `README.md` / the spec. Every task inherits these.

- **English only.** All code, docs, UI copy, and these plan/spec files stay in English.
- **`README.md` is the normative spec.** Any change to a token, component, path, or convention updates `README.md` (and `CLAUDE.md`) in the **same** change.
- **Tokens are the only styling layer.** No component introduces a raw value; the Tailwind layer **derives** every utility from an existing token — **no new hex, no new value**. After touching `tokens/palette.css` run `node scripts/check-ramp.mjs`.
- **Components carry no CSS classes** in the React layer (inline `style` reading custom properties). This restructure does **not** change that; the Tailwind layer is additive and optional, never a rewrite of the React primitives.
- **`*.dc.html` must live at the repo root** — they load `support.js`, `styles.css`, `theme.js`, `assets/` by relative path. **Do not move them.**
- **`support.js` is generated** (source not in this repo). Do not edit it.
- **No gradients** (except `Skeleton`), **no emoji**, **danger is outline not fill** (except `ConfirmDialog`'s final confirmation). The Tailwind manifest must reproduce these invariants.
- **A release moves four things + the tag:** version in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the `README.md` header; a `CHANGELOG.md` entry under a renamed `## [Unreleased]`; `source.ref` naming the tag; the tag on the release commit. Verify with `node scripts/check-release.mjs`.
- **Version for this release: `3.0.0`** (breaking — import paths move).

---

## File Structure

**Created:**
- `frameworks/react/` — holds the moved React tree (`components/`, `ui_kits/`, `use-container-width.js`) + a new `README.md`.
- `frameworks/angular/.gitkeep` — empty placeholder; filled by spec 002.
- `frameworks/tailwind/theme.css` — Tailwind v4 `@theme` preset, every value a `var()` into an existing token.
- `frameworks/tailwind/components/Button.manifest.json` — the reference class+variant manifest.
- `frameworks/tailwind/README.md` — how to consume the Tailwind layer.

**Moved (verbatim, via `git mv`):**
- `components/` → `frameworks/react/components/`
- `ui_kits/console/` → `frameworks/react/ui_kits/console/`
- `use-container-width.js` → `frameworks/react/use-container-width.js`

**Modified (relative-path / normative-content edits only):**
- `frameworks/react/components/**/*.card.html` (16 files) — infra refs only.
- `frameworks/react/ui_kits/console/index.html` — infra refs only.
- `README.md`, `CLAUDE.md`, `SKILL.md` — path references + new `frameworks/` section.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `CHANGELOG.md` — release surfaces.

**Deliberately NOT modified (verified in survey — changing them would be a bug):**
- `Arena - Overview.dc.html`, `Dravensoft Identity.dc.html` — contain **no** `components/` imports (they render via `support.js` + inline HTML; `styles.css`/`assets/`/`support.js` stay root-relative and valid).
- `scripts/*.mjs` — **no** hardcoded `components/`/`ui_kits/` paths (only a comment in `check-text-contrast.mjs`).
- JSX internal imports `import … from '../../use-container-width.js'` and `arenaImport('../../components/…')` — **stay valid** because the component/hook move together under `frameworks/react/`, preserving relative depth. See the boxed warning in Task 2.
- Historical `CHANGELOG.md` entries (they describe past trees; never rewrite them).
- `tokens/spacing.css:23` comment naming `use-container-width.js` (a conceptual reference, not a path).

---

## ⚠️ The one path trap that governs this whole plan

A demo card at `components/forms/forms.card.html` today contains **two kinds** of `../../` reference:

| Reference in the card | What it points at | After moving 2 levels deeper |
|---|---|---|
| `href="../../styles.css"`, `src="../../jsx-loader.js"` | **root infra** (`styles.css`, `jsx-loader.js` stay at root) | must become `../../../…` |
| `arenaImport('../../components/forms/Button.jsx')` | a **sibling that also moved** into `frameworks/react/` | **stays `../../components/…`** — still resolves |

Proof: after the move the card is at `frameworks/react/components/forms/forms.card.html`. From there `../../` = `frameworks/react/`, so `../../components/forms/Button.jsx` = `frameworks/react/components/forms/Button.jsx` ✓. Changing it to `../../../` would resolve to `frameworks/components/…` → 404.

**Therefore every edit in Tasks 2–3 is a *scoped string replace of the infra refs only* — never a blanket `../../` → `../../../`.** The scoped `sed` in those tasks matches the literal strings `../../styles.css` and `../../jsx-loader.js`, which the component-import lines do not contain.

---

## Task 0: Isolate the workspace and start the verification server

**Files:** none (setup).

**Interfaces:**
- Produces: an HTTP server at `http://localhost:8000` rooted at the repo, used as the render gate by every later task.

- [ ] **Step 1: Confirm you are in the repo root and on a clean feature branch**

Run:
```bash
cd /home/juan/Dravensoft/Identity
git status --short          # expect: only docs/ additions from planning, nothing staged
git checkout -b frameworks-restructure
```
Expected: new branch created; the working tree otherwise clean.

- [ ] **Step 2: Start the static server in the background**

Run:
```bash
python3 -m http.server 8000 >/tmp/arena-http.log 2>&1 &
sleep 1
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8000/styles.css
```
Expected: `200`.

- [ ] **Step 3: Capture the baseline — every card + demo renders today**

Run:
```bash
for f in $(find components -name '*.card.html') ui_kits/console/index.html \
         "Arena - Overview.dc.html" "Dravensoft Identity.dc.html"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8000/$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$f")")
  echo "$code  $f"
done
```
Expected: every line `200`. This is the baseline the acceptance gate (Task 9) must reproduce against the moved paths.

---

## Task 1: Create the `frameworks/` skeleton and move the React tree

**Files:**
- Create: `frameworks/angular/.gitkeep`
- Move: `components/` → `frameworks/react/components/`
- Move: `ui_kits/console/` → `frameworks/react/ui_kits/console/`
- Move: `use-container-width.js` → `frameworks/react/use-container-width.js`

**Interfaces:**
- Produces: the `frameworks/react/` tree that Tasks 2–3 fix paths in, and the directory layout Tasks 6–7 document.

- [ ] **Step 1: Create the directories and the Angular placeholder**

Run:
```bash
mkdir -p frameworks/react frameworks/tailwind/components
: > frameworks/angular/.gitkeep
```

- [ ] **Step 2: Move the three React artifacts with `git mv` (preserves history)**

Run:
```bash
git mv components frameworks/react/components
git mv ui_kits frameworks/react/ui_kits
git mv use-container-width.js frameworks/react/use-container-width.js
```
Expected: no error. (`ui_kits/` currently holds only `console/`, so moving the whole dir is correct.)

- [ ] **Step 3: Verify the root is clean and the tree landed**

Run:
```bash
ls -d components ui_kits use-container-width.js 2>&1        # expect: 3× "No such file or directory"
ls frameworks/react/components frameworks/react/ui_kits/console >/dev/null && echo "react tree OK"
find frameworks/react/components -name '*.jsx' | wc -l      # expect: 40
```
Expected: root paths gone; `react tree OK`; `40`.

- [ ] **Step 4: Verify the JSX-internal imports still resolve structurally**

The hook import inside the moved JSX is `../../use-container-width.js`. From `frameworks/react/components/display/Table.jsx` that is `frameworks/react/use-container-width.js`.
Run:
```bash
test -f frameworks/react/components/display/Table.jsx && \
test -f frameworks/react/use-container-width.js && \
echo "hook import target present"
```
Expected: `hook import target present`. (No edit to the JSX — the relative path is unchanged and now correct.)

- [ ] **Step 5: Commit the move**

```bash
git add -A
git commit -m "refactor: move React tree under frameworks/react/ (no path fixes yet)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Fix the infra paths in the 16 component demo cards

**Files:**
- Modify: all `frameworks/react/components/**/*.card.html` (16 files) — replace `../../styles.css` → `../../../styles.css` and `../../jsx-loader.js` → `../../../jsx-loader.js`.

**Interfaces:**
- Consumes: the `frameworks/react/` tree from Task 1.
- Produces: cards that render styled at their new depth. (No new symbols.)

> **Do not touch the `arenaImport('../../components/…')` lines.** They resolve to `frameworks/react/components/…` and are correct as-is. The commands below only match the two infra strings.

- [ ] **Step 1: (Verification-first) Confirm exactly which strings each card contains**

Run:
```bash
grep -rhoE '\.\./\.\./[^"'"'"' )]+' frameworks/react/components --include='*.card.html' \
  | sed -E 's#(\.\./\.\./)([^/]+).*#\1\2#' | sort | uniq -c
```
Expected (proves the scope): three groups — `../../components` (must NOT change), `../../jsx-loader.js` (change), `../../styles.css` (change).

- [ ] **Step 2: Apply the scoped replacement to every card**

Run:
```bash
find frameworks/react/components -name '*.card.html' -print0 | xargs -0 sed -i \
  -e 's#\.\./\.\./styles\.css#../../../styles.css#g' \
  -e 's#\.\./\.\./jsx-loader\.js#../../../jsx-loader.js#g'
```

- [ ] **Step 3: Verify the component-import lines were left untouched**

Run:
```bash
grep -rn "arenaImport('\.\./\.\./components/" frameworks/react/components --include='*.card.html' | wc -l   # expect: 51
# anchor the "still 2-level?" check on the opening quote — otherwise `../../styles.css`
# matches as a SUBSTRING of the correct `../../../styles.css` and can never reach 0.
grep -rnE '["'"'"']\.\./\.\./(styles\.css|jsx-loader\.js)' frameworks/react/components --include='*.card.html' | wc -l  # expect: 0 (no true 2-level infra ref remains)
grep -rnoE '\.\./\.\./\.\./(styles\.css|jsx-loader\.js)' frameworks/react/components --include='*.card.html' | wc -l  # expect: 32 (16 each)
```
Expected: `51`, `0`, `32`.

- [ ] **Step 4: Verify every card renders styled over HTTP**

Run:
```bash
for f in $(find frameworks/react/components -name '*.card.html'); do
  enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$f")
  page=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8000/$enc")
  # follow one of its infra refs to prove it resolves at the new depth:
  css=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8000/styles.css")
  echo "$page/$css  $f"
done
```
Expected: every line `200/200`. Additionally open one card (e.g. `frameworks/react/components/forms/forms.card.html`) in a browser at `http://localhost:8000/...` and confirm the buttons render in Arena styling (dark surface, crimson primary), proving `styles.css` + `jsx-loader.js` + the `arenaImport` all resolved.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: repoint card demo infra paths for frameworks/react depth

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Fix the infra paths in the Console ui_kit

**Files:**
- Modify: `frameworks/react/ui_kits/console/index.html` — `../../styles.css` → `../../../../styles.css`, `../../jsx-loader.js` → `../../../../jsx-loader.js`. Leave `../../components/feedback/Toast.jsx` and the local `./*.jsx` imports unchanged.

**Interfaces:**
- Consumes: the moved console at `frameworks/react/ui_kits/console/`.
- Produces: a rendering Console demo.

> Depth math: `frameworks/react/ui_kits/console/index.html` is **four** levels below root, so root infra needs `../../../../`. But `../../components/feedback/Toast.jsx` = `frameworks/react/components/feedback/Toast.jsx` ✓ — leave it.

- [ ] **Step 1: (Verification-first) list the refs**

Run:
```bash
grep -nE "\.\./|arenaImport" frameworks/react/ui_kits/console/index.html
```
Expected: `../../styles.css`, `../../jsx-loader.js`, `arenaImport('./LoginScreen.jsx')` (+ Dashboard, Project), and `arenaImport('../../components/feedback/Toast.jsx')`.

- [ ] **Step 2: Apply the scoped replacement**

Run:
```bash
sed -i \
  -e 's#\.\./\.\./styles\.css#../../../../styles.css#g' \
  -e 's#\.\./\.\./jsx-loader\.js#../../../../jsx-loader.js#g' \
  frameworks/react/ui_kits/console/index.html
```

- [ ] **Step 3: Verify Toast import and local imports untouched, infra updated**

Run:
```bash
grep -c "arenaImport('\.\./\.\./components/feedback/Toast.jsx')" frameworks/react/ui_kits/console/index.html  # expect: 1
grep -c '\.\./\.\./\.\./\.\./styles\.css' frameworks/react/ui_kits/console/index.html                        # expect: 1
grep -c '\.\./\.\./\.\./\.\./jsx-loader\.js' frameworks/react/ui_kits/console/index.html                     # expect: 1
```
Expected: `1`, `1`, `1`.

- [ ] **Step 4: Verify the Console renders over HTTP**

Run:
```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  "http://localhost:8000/frameworks/react/ui_kits/console/index.html"
```
Expected: `200`. Open it in a browser and confirm the login → dashboard → project flow renders styled (proves `styles.css`, `jsx-loader.js`, and the `Toast` import all resolve).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: repoint console ui_kit infra paths for frameworks/react depth

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Confirm the `.dc.html` pages and `scripts/` need no path edits

**Files:** none changed — this task is a verification checkpoint. It exists because the spec listed these as edits, but the survey proved they contain no moved paths. Confirming that in-band prevents a later "did we forget the dc.html?" regression.

**Interfaces:**
- Consumes: the moved tree.
- Produces: written proof the two `*.dc.html` and the validators are unaffected.

- [ ] **Step 1: Prove the dc.html files import no components and still render**

Run:
```bash
grep -nE 'components/|ui_kits/|use-container-width' "Arena - Overview.dc.html" "Dravensoft Identity.dc.html"; echo "grep exit: $?"
for f in "Arena - Overview.dc.html" "Dravensoft Identity.dc.html"; do
  enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$f")
  echo "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8000/$enc")  $f"
done
```
Expected: grep prints nothing (`grep exit: 1`); both pages return `200`. No edit.

- [ ] **Step 2: Prove the validators hold no moved paths and still pass**

Run:
```bash
grep -rnE "(^|[^a-z-])(components|ui_kits)/" scripts/ ; echo "grep exit: $?"
node scripts/check-ramp.mjs && node scripts/check-text-contrast.mjs
```
Expected: grep finds no path usage (`grep exit: 1`); both scripts print their pass output and exit `0`. No edit.

*(No commit — nothing changed. If either grep unexpectedly finds a real path, STOP: a moved path was missed; fix it under the relevant task before continuing.)*

---

## Task 5: Author the shared `frameworks/tailwind/` layer

**Files:**
- Create: `frameworks/tailwind/theme.css`
- Create: `frameworks/tailwind/components/Button.manifest.json`
- Create: `frameworks/tailwind/README.md`

**Interfaces:**
- Consumes: Arena tokens (`--color-*`, `--r-*`, `--shadow-*`, `--dz-ctl-h*`, `--glow-accent`, `--danger-soft`) — all verified to exist in `tokens/`.
- Produces: `theme.css` (the `@theme` preset) and the `Button.manifest.json` schema that spec 002 and future manifests follow.

- [ ] **Step 1: Write `frameworks/tailwind/theme.css`**

Create `frameworks/tailwind/theme.css` with exactly this content (every value is a `var()` into an existing token — no literals):

```css
/* frameworks/tailwind/theme.css
   Arena's Tailwind v4 preset. Consume AFTER Arena's tokens are in scope
   (import ../../styles.css, or the individual tokens/*.css, first).
   Every value here is a var() into an existing Arena token — no literals,
   no new hex, no new value. Re-skinning Arena (swap tokens/palette.css)
   re-skins these utilities for free. */
@import 'tailwindcss';

@theme {
  /* surfaces + base content */
  --color-base-100: var(--color-base-100);
  --color-base-200: var(--color-base-200);
  --color-base-300: var(--color-base-300);
  --color-base-content: var(--color-base-content);

  /* brand voice */
  --color-primary: var(--color-primary);
  --color-primary-content: var(--color-primary-content);
  --color-secondary: var(--color-secondary);
  --color-secondary-content: var(--color-secondary-content);

  /* status (meaning, never series) */
  --color-info: var(--color-info);
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);

  /* categorical ramp (identity, in order, never cycled) */
  --color-cat-1: var(--color-cat-1);
  --color-cat-2: var(--color-cat-2);
  --color-cat-3: var(--color-cat-3);
  --color-cat-4: var(--color-cat-4);
  --color-cat-5: var(--color-cat-5);
  --color-cat-6: var(--color-cat-6);
  --color-cat-7: var(--color-cat-7);
  --color-cat-8: var(--color-cat-8);

  /* radius scale → tokens/effects.css */
  --radius-sm: var(--r-sm);
  --radius-md: var(--r-md);
  --radius-lg: var(--r-lg);
  --radius-xl: var(--r-xl);

  /* elevation → tokens/effects.css */
  --shadow-1: var(--shadow-1);
  --shadow-2: var(--shadow-2);
  --shadow-3: var(--shadow-3);

  /* spacing → tokens/spacing.css */
  --spacing-1: var(--sp-1);
  --spacing-2: var(--sp-2);
  --spacing-3: var(--sp-3);
  --spacing-4: var(--sp-4);
  --spacing-5: var(--sp-5);
  --spacing-6: var(--sp-6);
  --spacing-8: var(--sp-8);
}
```

- [ ] **Step 2: Write `frameworks/tailwind/components/Button.manifest.json`**

Create `frameworks/tailwind/components/Button.manifest.json`. It mirrors `frameworks/react/components/forms/Button.jsx` (sizes `sm`/`md`/`lg` at `--dz-ctl-h-sm`/`--dz-ctl-h`/`--dz-ctl-h-lg`; primary fills `--color-primary`; **danger is outline** — border + text in `--error`, transparent fill, `--danger-soft` only on hover):

```json
{
  "component": "Button",
  "slots": {
    "root": "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition"
  },
  "variants": {
    "variant": {
      "primary": { "root": "bg-primary text-primary-content border border-primary hover:shadow-[var(--glow-accent)]" },
      "danger":  { "root": "bg-transparent border border-error text-error hover:bg-[var(--danger-soft)]" }
    },
    "size": {
      "sm": { "root": "h-[var(--dz-ctl-h-sm)] px-3 text-[13px]" },
      "md": { "root": "h-[var(--dz-ctl-h)] px-[18px] text-[14px]" },
      "lg": { "root": "h-[var(--dz-ctl-h-lg)] px-[26px] text-[15px]" }
    }
  },
  "defaultVariants": { "variant": "primary", "size": "md" }
}
```

- [ ] **Step 3: Write `frameworks/tailwind/README.md`**

Create `frameworks/tailwind/README.md`:

```markdown
# Arena — Tailwind layer

A framework-neutral Tailwind v4 consumption layer for Arena. It is **shared**,
not per-framework: the token→utility mapping is pure CSS and a component's
Tailwind recipe is data (slots, variants, class strings), so React, Angular,
or a `tailwind-variants` recipe all consume the same files. The thin binding —
how a class string reaches the element — lives in each `frameworks/<fw>/` folder.

## It derives from tokens; it adds no value

Every utility here resolves to an existing Arena token via `var()`. There is no
new hex and no new value in this folder. Re-skin Arena by swapping
`tokens/palette.css`; these utilities re-skin with it.

## Consumption order

1. Bring Arena's tokens into scope — `@import "../../styles.css";` (or the
   individual `tokens/*.css`).
2. `@import "./theme.css";` — the Tailwind `@theme` preset.
3. Consume a component manifest from `./components/<Component>.manifest.json`.

## Three consumption paths

- **Raw `className`** — read `slots`/`variants` and concatenate the strings yourself.
- **`tailwind-variants`** (Angular/DAMA) — feed the manifest straight into `tv({ slots, variants, defaultVariants })`.
- **`cva`** — map `variants`/`defaultVariants` onto a `cva` config.

## Invariants the manifests must reproduce

- **Danger is outline** — `border` + `text` in `--error`, transparent fill; a
  filled danger surface is reserved for `ConfirmDialog`'s final confirmation.
- **Focus is the gold ring.** No gradient utilities. Uppercase is reserved for
  micro-labels. Charts carry identity (`--color-cat-*`) or meaning (status),
  never both.

Authoring a manifest for a component whose React source uses a value not yet in
a token is a spec violation — add the token first, then reference it here.
```

- [ ] **Step 4: Verify the JSON parses and no raw hex / literal value leaked in**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('frameworks/tailwind/components/Button.manifest.json','utf8')); console.log('manifest JSON OK')"
grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(' frameworks/tailwind/theme.css frameworks/tailwind/components/Button.manifest.json; echo "hex/rgb grep exit: $?"
```
Expected: `manifest JSON OK`; the hex/rgb grep prints nothing (`grep exit: 1`).

- [ ] **Step 5: Verify every token the layer references actually exists**

Run:
```bash
for t in --color-base-100 --color-primary-content --color-cat-8 --r-sm --r-xl \
         --shadow-1 --shadow-3 --sp-1 --sp-8 --dz-ctl-h --dz-ctl-h-sm --dz-ctl-h-lg \
         --glow-accent --danger-soft; do
  grep -rq -- "$t" tokens && echo "OK  $t" || echo "MISSING  $t"
done
```
Expected: every line `OK …`. (If any is `MISSING`, the token layer must gain it first — do not invent a value in the Tailwind layer.)

- [ ] **Step 6: Commit**

```bash
git add frameworks/tailwind
git commit -m "feat: add shared frameworks/tailwind layer (theme preset + Button manifest)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Update `README.md` (the normative spec)

**Files:**
- Modify: `README.md` — lines around 38, 44, 46, 60, 160, 204, 208, 209 (paths), plus a new `frameworks/` section.

**Interfaces:**
- Consumes: the final directory layout from Tasks 1 & 5.
- Produces: normative docs naming only the new paths.

- [ ] **Step 1: Repoint the copy-in / index / styling path references**

Apply these exact edits in `README.md` (match current text, left → right):

- `and \`use-container-width.js\` into your app` → `and \`frameworks/react/use-container-width.js\` into your app`
- `Copy the \`.jsx\` files you need from \`components/\`` → `Copy the \`.jsx\` files you need from \`frameworks/react/components/\``
- `import { Button } from './components/forms/Button.jsx';` → `import { Button } from './frameworks/react/components/forms/Button.jsx';`
- `the primitives in \`components/\` are React (JSX)` → `the primitives in \`frameworks/react/components/\` are React (JSX)`
- `\`catColor(slot)\` in \`components/charts/chart-internals.js\`` → `\`catColor(slot)\` in \`frameworks/react/components/charts/chart-internals.js\``
- `\`use-container-width.js\` — shared \`useContainerWidth\` hook` → `\`frameworks/react/use-container-width.js\` — shared \`useContainerWidth\` hook`
- `- \`components/\` — React primitives:` → `- \`frameworks/react/components/\` — React primitives:`
- `- \`ui_kits/console/\` — recreation of the Delivery Console` → `- \`frameworks/react/ui_kits/console/\` — recreation of the Delivery Console`

- [ ] **Step 2: Add a `frameworks/` split section**

Insert a new subsection (in the architecture/index area, near the paths above) with this content:

```markdown
### Framework layers (`frameworks/`)

Arena's pure design language — `tokens/`, `guidelines/`, `assets/`, `scripts/`,
`styles.css` — lives at the repo root and is framework-agnostic. Everything
framework-bound lives under `frameworks/`, so a new framework is added without
touching the language:

- `frameworks/react/` — the React primitives, the example Console app, and the
  `useContainerWidth` hook.
- `frameworks/angular/` — Angular support (see the Angular spec; placeholder today).
- `frameworks/tailwind/` — a **shared**, token-derived Tailwind v4 layer (a
  `@theme` preset + per-component class/variant manifests). It is authored once,
  not per framework, because the token→utility mapping is pure CSS and a
  component's Tailwind recipe is data. It derives every utility from an existing
  token and introduces no new value.

Pick the layer you need: raw tokens, a framework's primitives, or the Tailwind
layer on top.
```

- [ ] **Step 3: Verify no stale root path remains and the new paths are present**

Run:
```bash
grep -nE '(^|[^/a-z-])(components|ui_kits)/' README.md | grep -v 'frameworks/react/' ; echo "stale grep exit: $?"
grep -c 'frameworks/react/components/' README.md   # expect: >= 3
grep -c 'frameworks/tailwind/' README.md           # expect: >= 1
```
Expected: the stale grep prints nothing (`grep exit: 1`); the counts are non-zero.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: repoint README to frameworks/ layout and document the split

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Update `CLAUDE.md` and `SKILL.md`

**Files:**
- Modify: `CLAUDE.md` — the "Viewing things" and "Architecture" path references; document the `frameworks/` split, the Tailwind rule, and that specs/plans now live under `docs/superpowers/`.
- Modify: `SKILL.md` — line 7 path reference.

**Interfaces:**
- Consumes: the final layout.
- Produces: agent-facing docs consistent with the new tree.

- [ ] **Step 1: Repoint `CLAUDE.md` "Viewing things" paths**

Apply in `CLAUDE.md`:
- `\`components/<group>/*.card.html\` — live component demos` → `\`frameworks/react/components/<group>/*.card.html\` — live component demos`
- `\`ui_kits/console/index.html\` — the Delivery Console example app` → `\`frameworks/react/ui_kits/console/index.html\` — the Delivery Console example app`

- [ ] **Step 2: Repoint `CLAUDE.md` "Architecture" / quartet paths**

Apply in `CLAUDE.md`:
- `Each \`components/**/*.jsx\` renders with inline \`style\` objects` → `Each \`frameworks/react/components/**/*.jsx\` renders with inline \`style\` objects`
- In the quartet rule, the `X.jsx`/`X.d.ts`/`X.prompt.md`/`*.card.html` group and `measure the container via useContainerWidth` references: update any `components/` or `use-container-width.js` mention to `frameworks/react/components/` and `frameworks/react/use-container-width.js` respectively.

- [ ] **Step 3: Add the `frameworks/` split + Tailwind rule to `CLAUDE.md`**

Add to the "Architecture" section:

```markdown
**Framework layers live under `frameworks/`.** The root holds only the
framework-agnostic language (`tokens/`, `guidelines/`, `assets/`, `scripts/`,
`styles.css`) plus the demo runtime (`theme.js`, `jsx-loader.js`, `support.js`)
and brand (`*.dc.html`). React lives in `frameworks/react/`;
`frameworks/angular/` holds Angular support; `frameworks/tailwind/` is a
**single shared** Tailwind v4 layer (`@theme` preset + per-component manifests),
authored once because the token→utility mapping is pure CSS. **The Tailwind
layer derives every utility from an existing token and introduces no new hex
and no new value** — add the token first, then reference it.
```

- [ ] **Step 4: Note the specs/plans location in `CLAUDE.md`**

Add one line (in "What this repo is" or a conventions area):

```markdown
- **Specs and implementation plans live under `docs/superpowers/`** (`specs/`, `plans/`), dated `YYYY-MM-DD-<name>.md`. They are in English like the rest of the repo.
```

- [ ] **Step 5: Repoint `SKILL.md`**

Apply in `SKILL.md`:
- `explore the other available files (tokens/, components/, ui_kits/, assets/)` → `explore the other available files (tokens/, frameworks/react/components/, frameworks/react/ui_kits/, frameworks/tailwind/, assets/)`

- [ ] **Step 6: Verify no stale root path remains in either doc**

Run:
```bash
grep -nE '(^|[^/a-z-])(components|ui_kits)/' CLAUDE.md SKILL.md | grep -v 'frameworks/react/' ; echo "stale grep exit: $?"
grep -c 'frameworks/' CLAUDE.md    # expect: >= 3
grep -c 'docs/superpowers' CLAUDE.md  # expect: >= 1
```
Expected: stale grep prints nothing (`grep exit: 1`); counts non-zero.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md SKILL.md
git commit -m "docs: repoint CLAUDE.md and SKILL.md to frameworks/ layout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Cut the `v3.0.0` release

**Files:**
- Modify: `.claude-plugin/plugin.json` — `version` → `3.0.0`; add `"angular"`, `"tailwind"` to `keywords`; widen `description`.
- Modify: `.claude-plugin/marketplace.json` — `version` → `3.0.0`; `source.ref` → `v3.0.0`; (optionally align its keywords).
- Modify: `README.md` — the `**Version X.Y.Z**` header → `**Version 3.0.0**`.
- Modify: `CHANGELOG.md` — add the top `## [3.0.0] - 2026-07-17` entry with a **Migration** note.

**Interfaces:**
- Consumes: everything above.
- Produces: a tagged release that `check-release.mjs` validates.

> Order matters: **write all four surfaces, commit, tag, then verify.** `check-release.mjs` runs `git show v3.0.0:.claude-plugin/plugin.json`, so the tag must already exist on the release commit.

- [ ] **Step 1: Bump `.claude-plugin/plugin.json`**

Set `"version": "3.0.0"`. Change `keywords` to include `"angular"` and `"tailwind"` (append to the existing array). Change `description` to:
`"Generate well-branded interfaces and assets in Dravensoft's \"Arena\" design language: design tokens, framework primitives (React, Angular), a shared Tailwind layer, guidelines, and a UI kit."`

- [ ] **Step 2: Bump `.claude-plugin/marketplace.json`**

Set the arena plugin's `"version": "3.0.0"` and `"source": { … "ref": "v3.0.0" }`. Leave `repo`/`source` type unchanged.

- [ ] **Step 3: Bump the README version header**

Change the `**Version 2.4.0**` header to `**Version 3.0.0**`.

- [ ] **Step 4: Add the CHANGELOG entry** (new top **versioned** entry — do not edit historical entries)

Insert directly **above** the current top entry `## [2.4.0] — 2026-07-17` in `CHANGELOG.md` (there is no `## [Unreleased]` section to rename; this becomes the first versioned entry that `check-release.mjs` reads). Use an em-dash `—` in the date to match every existing entry:

```markdown
## [3.0.0] — 2026-07-17

### Changed (breaking)

- **Introduced `frameworks/`.** Every framework-bound file moved under it: the
  React primitives, example app, and hook now live in `frameworks/react/`
  (`components/`, `ui_kits/console/`, `use-container-width.js`). The repo root
  keeps only the framework-agnostic language, the demo runtime, and the brand
  `*.dc.html`.

### Added

- **`frameworks/tailwind/`** — a shared, token-derived Tailwind v4 layer:
  `theme.css` (the `@theme` preset) and `components/*.manifest.json`
  (framework-neutral class/variant recipes, starting with `Button`). It derives
  every utility from an existing token and introduces no new value.
- **`frameworks/angular/`** — placeholder for Angular support (filled by the
  Angular spec).

### Migration

- Update React import paths: `./components/<group>/X.jsx` →
  `./frameworks/react/components/<group>/X.jsx`; `./use-container-width.js` →
  `./frameworks/react/use-container-width.js`. Tokens, guidelines, assets, and
  `styles.css` are unchanged at the repo root.
```

- [ ] **Step 5: Commit the release, then tag it**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json README.md CHANGELOG.md
git commit -m "Release v3.0.0: frameworks/ split — react, angular, shared tailwind

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git tag v3.0.0
```

- [ ] **Step 6: Verify the release with all three validators**

Run:
```bash
node scripts/check-release.mjs
node scripts/check-ramp.mjs
node scripts/check-text-contrast.mjs
```
Expected: `check-release.mjs` reports `Release under test: v3.0.0` and every check passes (marketplace version, README header, CHANGELOG top entry, `source.ref`, and the `plugin.json` **at the tag** all agree on `3.0.0`); the two token validators pass. If `check-release` fails on "plugin.json at the pinned tag", the tag was created before the commit — re-tag with `git tag -f v3.0.0` on the release commit and re-run.

---

## Task 9: Full acceptance gate

**Files:** none changed — final verification against the spec's acceptance criteria.

**Interfaces:**
- Consumes: the whole branch.
- Produces: proof the acceptance criteria hold.

- [ ] **Step 1: Structure exists as specified**

Run:
```bash
test -d frameworks/react/components && test -d frameworks/react/ui_kits/console && \
test -f frameworks/react/use-container-width.js && test -f frameworks/angular/.gitkeep && \
test -f frameworks/tailwind/theme.css && test -f frameworks/tailwind/components/Button.manifest.json && \
test -f frameworks/tailwind/README.md && echo "structure OK"
ls -d components ui_kits use-container-width.js 2>&1   # expect: 3× "No such file or directory"
```
Expected: `structure OK`; root no longer holds the moved artifacts.

- [ ] **Step 2: Every demo renders styled over HTTP (parity with the Task 0 baseline)**

Run:
```bash
for f in $(find frameworks/react/components -name '*.card.html') \
         frameworks/react/ui_kits/console/index.html \
         "Arena - Overview.dc.html" "Dravensoft Identity.dc.html"; do
  enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$f")
  echo "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8000/$enc")  $f"
done
```
Expected: every line `200`. Spot-check one card and the console in a browser to confirm styled rendering (not just a 200 on the HTML shell).

- [ ] **Step 3: Grep clean — no stale root path in normative docs**

Run:
```bash
grep -rnE '(^|[^/a-z-])(components|ui_kits)/' README.md CLAUDE.md SKILL.md | grep -v 'frameworks/react/' ; echo "exit: $?"
```
Expected: prints nothing (`exit: 1`).

- [ ] **Step 4: All validators green**

Run:
```bash
node scripts/check-ramp.mjs && node scripts/check-text-contrast.mjs && node scripts/check-release.mjs && echo "ALL VALIDATORS PASS"
```
Expected: `ALL VALIDATORS PASS`.

- [ ] **Step 5: Stop the server and summarize**

Run:
```bash
kill %1 2>/dev/null || pkill -f 'http.server 8000'
git log --oneline -8
```
Confirm the branch holds the move, the path fixes, the tailwind layer, the doc updates, and the tagged release commit.

---

## Self-Review

**Spec coverage** — every spec section maps to a task:

- Architecture / three siblings `react`/`angular`/`tailwind` → Tasks 1 & 5.
- `-tailwind` collapse decision → realized as the single `frameworks/tailwind/` in Task 5; rationale documented in Task 5 README + Task 6/7 docs.
- Move table (exact) → Task 1.
- Reference-update checklist items 1–10 → item 1 (cards) Task 2; item 3 (ui_kit) Task 3; item 2 (dc.html — proven no-op) Task 4; item 10 (scripts — proven no-op) Task 4; item 4 (README) Task 6; item 5 (CLAUDE) Task 7; item 6 (SKILL) Task 7; items 7–9 (plugin/marketplace/CHANGELOG) Task 8.
- Tailwind contract (`theme.css`, manifest schema, README) → Task 5.
- Acceptance criteria → Task 9 (structure, HTTP render, check-ramp/contrast/release, grep clean).
- Out of scope (Angular content, extra manifests, React internals) → honored: only `.gitkeep` + the `Button` reference manifest are authored; no JSX internals change.

**Correction encoded vs. the spec:** the spec's checklist item 1 says "each `../../` becomes `../../../`". Applied blindly that breaks the `arenaImport('../../components/…')` and `../../use-container-width.js` imports, which stay valid because the component/hook move with the card. Tasks 2–3 therefore do a **scoped** replace of the infra strings only, with a grep gate proving the component-import lines were untouched. Items 2 and 10 (dc.html, scripts) were proven no-ops in the survey and are handled as verification checkpoints, not edits.

**Placeholder scan:** none — every code/CSS/JSON/Markdown block is complete literal content; every command has an expected result.

**Type/name consistency:** version `3.0.0` and tag `v3.0.0` used across every release surface; token names in `theme.css`/manifest (`--r-sm`, `--shadow-1`, `--dz-ctl-h*`, `--glow-accent`, `--danger-soft`, `--color-cat-1..8`, `--color-primary-content`) all verified present in `tokens/`; the `Button` manifest's sizes/heights/variants match `frameworks/react/components/forms/Button.jsx`.
