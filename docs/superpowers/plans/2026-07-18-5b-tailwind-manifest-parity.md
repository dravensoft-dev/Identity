# Tailwind manifest parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution order: 5b of 6.** **Status: NOT EXECUTED** as of 2026-07-19. **Blocked on 4.5 and 5a**, which build the tokens and the infrastructure this plan consumes.

| # | Plan | Status |
|---|---|---|
| 1–4 | token migration, Overview, coverage, geometry boundary | **Executed** |
| 4.5 | `2026-07-19-4.5-token-debt-and-gate-blind-spots.md` | Pending — **hard prerequisite** |
| 5a | `2026-07-18-5a-angular-primitive-parity.md` | Pending — **hard prerequisite**, Tasks 1–3 |
| 5b | `2026-07-18-5b-tailwind-manifest-parity.md` | **This plan** — pending |
| 6 | `2026-07-18-6-four-package-build-publish.md` | Pending |

**Goal:** Ship the twenty manifests a framework-neutral Tailwind consumer needs — the controls and containers Angular Material would otherwise provide — so `@dravensoft/arena-tailwind` can dress a whole application rather than the gap components alone.

**Architecture:** No Angular. Each task is a manifest plus the specimen page that exercises it, built on the harness 5a already installed: `bun run check:tailwind` proves every class emits a rule, `check:coverage` proves every token still reaches a utility, `check:arbitrary` proves no bracket carries a literal, and the specimen proves the classes compose into the component Arena's README specifies. Two shared files land first so twenty pages are not twenty copies of the same boilerplate.

**Tech Stack:** Bun, Tailwind CSS 4.3.3, the manifest/specimen harness from plan 5a, `node:test` + `node:assert/strict`.

**Source spec:** `docs/superpowers/specs/2026-07-18-5-framework-layer-parity-design.md`, phase 3.

---

## Why these twenty exist at all

They have **no Angular consumer**, and that is not an oversight. `frameworks/tailwind/README.md`
courts a third-party consumer building with raw `className` or `cva`, on neither React
nor Material, and that consumer is building a whole application: they need the form
controls and the containers, not only the gap components. A Tailwind layer that
advertises framework-neutrality and cannot dress a form is not one.

**What holds them up, given nothing consumes them:** gate 3. `check-tailwind.mjs`
asserts every class a manifest declares produced a rule, so a manifest with no consumer
still cannot rot silently — a class that stops resolving fails the build. That gate is
the reason this plan is safe to write and `Button.manifest.json`'s history is the reason
it was needed: it was authored with no consumer, never exercised, and accumulated five
arbitrary values that violated the layer's own rule.

## Prerequisites — verify before Task 1

Run each and confirm, rather than assuming 5a landed cleanly:

```bash
test -f frameworks/tailwind/utilities.css && echo "utilities.css: present"
test -f frameworks/tailwind/manifest-classes.js && echo "resolver: present"
test -f frameworks/tailwind/specimen.js && echo "harness: present"
test -f frameworks/tailwind/animations.css && echo "animations: present"
bun run check
```
Expected: four `present` lines and `check-all: all 11 step(s) passed`.

```bash
grep -c 'max-w-\[42ch\]' frameworks/tailwind/components/EmptyState.manifest.json
bun -e "import{isLegalBracket}from'./scripts/check-arbitrary-values.mjs';console.log(isLegalBracket('length:calc(var(--avatar-md)*0.4)'),isLegalBracket('42ch'),isLegalBracket('13px'))"
```
Expected: `1`, then `true true false` — proof that plan 4.5 made a derivation and an
unmodelled unit legal in a bracket while a raw dimension still fails. Without it,
several manifests below cannot be written as specified.

```bash
grep -c 'loop-spin' tokens/effects.css
```
Expected: `1` — the `--loop-*` family exists, so Task 2's animations reference tokens
rather than restating durations.

## Global Constraints

- **Every utility derives from an existing token.** No new hex, no new value. If a
  manifest needs a value with no token behind it, **stop and raise it** — that is a
  token-layer question, and this plan changes no token.
- **The ledger in 5a is the translation table.** Read
  `docs/superpowers/plans/2026-07-18-5a-angular-primitive-parity.md` → "The token →
  utility ledger" before writing the first manifest. It is not repeated here; two copies
  would drift, and the fastest way to author a wrong manifest is to re-derive the
  mapping from memory.
- **Danger is outline** — transparent fill, border and content in `--error`. The only
  filled danger surface in the system is `ConfirmDialog`'s final confirmation, which 5a
  already shipped. Nothing in this plan gets one.
- **A manifest is a pure function of the component's props.** Hover, focus and disabled
  are Tailwind state modifiers (`hover:`, `focus-within:`, `disabled:`), never variants —
  that is what lets a static specimen render a variant combination and be right.
- **No React changes.** `git diff --stat main -- frameworks/react/` stays empty.
- **`bun run check` exits 0 before every commit**, and every task rebuilds
  `utilities.css` first (`bun run build:tailwind`) — a manifest whose classes never
  reached the compiled stylesheet renders as an unstyled specimen and proves nothing.
- **No emoji, English only, no gradients.**

## The shape of a task

Twenty tasks, one component each, all the same five steps:

1. **Read the React source** named in the task. It is the reference for shape and
   behaviour; the token layer is the authority on values.
2. **Write the manifest** at `frameworks/tailwind/components/<Component>.manifest.json`.
3. **Write the specimen** at `frameworks/tailwind/components/<Component>.card.html`,
   using the shared harness. Every class it renders comes from `classesFor()`; a class
   typed into the page is styling the manifest does not carry.
4. **Rebuild and gate:** `bun run build:tailwind && bun run check`.
5. **Look at it** with `bun run demos` running — dark, light (`arena-light` on `<html>`),
   and `.arena-compact` on `<body>` — against the React card page the task names. Then
   commit.

Steps 1, 4 and 5 are identical every time and are not restated per task; steps 2 and 3
are given in full.

---

## Task 1: One stylesheet for every specimen

Sixteen pages from 5a carry the same 5-line `<style>` block, and twenty more are about
to. Extract it once, and adopt it everywhere in the same task — a shared file that half
the pages ignore is worse than no shared file.

**Files:**
- Create: `frameworks/tailwind/specimen.css`
- Modify: the 16 existing `frameworks/tailwind/components/*.card.html` (Tag, 5a's 14 slices, and ChartCard)

- [ ] **Step 1: Write the stylesheet**

Create `frameworks/tailwind/specimen.css`:

```css
/* frameworks/tailwind/specimen.css
   Page chrome for the *.card.html specimens — and nothing that could style a
   component. Every class a specimen puts on a component's own element comes
   from its manifest through classesFor(); what is left over is the page: a
   background, a micro-label per section, and a row to lay the examples out in.
   The three rules below are the ones the React card pages already use, so a
   specimen and its React counterpart sit on the same surface and a difference
   between them is a difference in the component. */
body {
  margin: 0;
  padding: var(--sp-6);
  background: var(--bg);
  color: var(--text-strong);
  font-family: var(--font-body);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--sp-1) * 3.5);
  align-items: center;
  margin-bottom: var(--sp-4);
}

/* Stack the examples instead of flowing them — for full-width components
   (Alert, Table, Dialog panels) whose row would otherwise be one column. */
.row.stack {
  flex-direction: column;
  align-items: stretch;
}

.sub {
  width: 100%;
  margin-bottom: var(--sp-1);
  font-family: var(--font-mono);
  font-size: var(--dz-text-2xs);
  letter-spacing: var(--ls-label);
  line-height: var(--lh-snug);
  color: var(--mute);
  text-transform: uppercase;
}
```

- [ ] **Step 2: Teach the harness the stacked row**

In `frameworks/tailwind/specimen.js`, `mountSpecimen` gains an optional per-section
layout. Replace `section` and the row line in `mountSpecimen`:

```js
/** @param {string} label @param {(Node|string)[]} nodes
 *  @param {{stack?: boolean}} [opts] stack: lay the examples out in a column,
 *    for components that occupy a full row on their own
 *  @returns {{label: string, nodes: (Node|string)[], stack: boolean}} */
export function section(label, nodes, opts = {}) {
  return { label, nodes, stack: Boolean(opts.stack) };
}
```

and inside `mountSpecimen`'s loop:

```js
  for (const { label, nodes, stack } of sections) {
    mount.append(el('div', { class: 'sub', text: label }));
    const row = el('div', { class: stack ? 'row stack' : 'row' });
```

- [ ] **Step 3: Adopt it in the 16 existing specimens**

In every `frameworks/tailwind/components/*.card.html`, replace the inline `<style>…</style>`
block with:

```html
<link rel="stylesheet" href="../specimen.css">
```

Four of those pages (Alert, EmptyState, ErrorState, BulkActionBar, CommandPalette,
ConfirmDialog, Onboarding — any whose inline block set `flex-direction:column`) must
also pass `{ stack: true }` to the `section()` calls that relied on it. Read each page's
old block before deleting it; a page that stacked and now flows is a review failure, not
a cosmetic one.

- [ ] **Step 4: Verify and commit**

Run: `bun run check`
Expected: `check-all: all 11 step(s) passed`.

With `bun run demos` running, open all 16 pages and confirm none of them regressed to a
flowed row that should stack.

```bash
git add frameworks/tailwind/specimen.css frameworks/tailwind/specimen.js \
        frameworks/tailwind/components/*.card.html
git commit -m "refactor(tailwind): one stylesheet for every specimen page"
```

**From here on, every specimen head in this plan is exactly:**

```html
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
```

---

## Task 2: The four remaining animations

React ships Dialog's entrance, Menu's drop, Tooltip's fade and ProgressBar's
indeterminate sweep as injected `<style>` tags, because keyframes are what an inline
style cannot express. 5a established where their Tailwind equivalents live; this task
completes the set.

Each answers `prefers-reduced-motion` the way its React counterpart does, and the
answers are not the same:

- **Dialog and Menu** are entrances — they keep the fade and drop the travel. The
  movement is the vestibular trigger; the fade is the meaning. Both redefine their
  keyframes inside the media query, which needs no selector.
- **Tooltip** animates opacity only and therefore has **no reduced-motion clause at
  all** — there is no motion to reduce, and adding a clause would imply there is.
- **ProgressBar** reports work in progress, so it **slows** rather than stopping: a
  frozen progress bar reads as a hung process.

**Files:**
- Modify: `frameworks/tailwind/animations.css`

- [ ] **Step 1: Append the four**

Add to `frameworks/tailwind/animations.css`, after the two 5a wrote:

```css
@keyframes arena-pop {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

@keyframes arena-menu {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}

@keyframes arena-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes arena-prog {
  0% { left: -40%; }
  100% { left: 100%; }
}

/* An entrance keeps its fade and drops its travel under reduced motion — so the
   keyframes are redefined rather than the animation disabled, which is why
   neither of these needs a selector of its own. */
@media (prefers-reduced-motion: reduce) {
  @keyframes arena-pop { from { opacity: 0; } to { opacity: 1; } }
  @keyframes arena-menu { from { opacity: 0; } to { opacity: 1; } }
}

@utility arena-pop {
  animation: arena-pop var(--dur-mid) var(--ease-emphatic);
}

@utility arena-menu {
  animation: arena-menu var(--dur-fast) var(--ease-out);
}

/* Opacity only — no reduced-motion clause on purpose. */
@utility arena-fade {
  animation: arena-fade var(--dur-fast) var(--ease-out);
}

/* The indeterminate sweep is a pseudo-element, which is the one thing an inline
   style genuinely cannot reach — the same reason ProgressBar.jsx injects a class
   rather than keeping its animation inline. Slows under reduced motion; a frozen
   progress bar reads as a hung process. */
@utility arena-prog-indeterminate {
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 40%;
    border-radius: inherit;
    background: currentColor;
    animation: arena-prog var(--loop-sweep) var(--ease-in-out) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after { animation-duration: var(--loop-reduced); }
  }
}
```

- [ ] **Step 2: Verify and commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`. The four utilities emit nothing yet —
`source(none)` means a utility appears only once a manifest declares it, and the
manifests in Tasks 8, 15, 16 and 19 are what pull them in.

```bash
git add frameworks/tailwind/animations.css
git commit -m "feat(tailwind): add the four keyframe utilities the manifests still need"
```

---

## Task 3: Button — complete the manifest that started this

**Reference:** `frameworks/react/components/forms/Button.jsx`, demoed in
`frameworks/react/components/forms/forms.card.html`.

`Button.manifest.json` exists and carries **two of React's four variants**. `secondary`
and `ghost` were never written, and nothing noticed, because nothing consumes it and no
gate compares a manifest against the component it mirrors. Completing it is this task;
noticing that no gate could have caught it is why every later task ships a specimen.

**Files:**
- Modify: `frameworks/tailwind/components/Button.manifest.json`
- Create: `frameworks/tailwind/components/Button.card.html`

- [ ] **Step 1: Complete the manifest**

Replace `frameworks/tailwind/components/Button.manifest.json` with:

```json
{
  "component": "Button",
  "slots": {
    "root": "inline-flex items-center justify-center gap-2 rounded-sm font-body font-semibold tracking-normal border-[length:var(--bw)] cursor-pointer transition-[background,transform,box-shadow] duration-[var(--dur-fast)] ease-out active:scale-98 disabled:opacity-45 disabled:cursor-not-allowed",
    "spinner": "arena-btn-spin inline-block size-3.5 box-border border-[length:var(--bw-strong)] border-current border-t-transparent rounded-full"
  },
  "variants": {
    "variant": {
      "primary": { "root": "bg-primary text-primary-content border-primary hover:shadow-2" },
      "secondary": { "root": "bg-base-200 text-base-content border-neutral hover:bg-base-300" },
      "ghost": { "root": "bg-transparent text-base-content/82 border-transparent hover:bg-base-200" },
      "danger": { "root": "bg-transparent border-error text-error hover:bg-error/14" }
    },
    "size": {
      "sm": { "root": "h-ctl-h-sm px-3 text-ctl-md" },
      "md": { "root": "h-ctl-h px-4.5 text-ctl" },
      "lg": { "root": "h-ctl-h-lg px-6.5 text-ctl" }
    },
    "full": {
      "true": { "root": "w-full" },
      "false": { "root": "w-auto" }
    }
  },
  "defaultVariants": { "variant": "primary", "size": "md", "full": "false" }
}
```

Three notes on what changed and why:

- **`secondary` and `ghost` are React's**, read off `Button.jsx`'s `palettes` object:
  secondary is `--panel` on `--line-strong` going to `--color-base-300` on hover; ghost
  is transparent with `--bone-dim`, going to `--panel`.
- **`danger` stays outline.** It is the convention, and a hover fill of `bg-error/14`
  is `--danger-soft`, which is a tint and not a fill.
- **The `spinner` slot** is new and needed by the specimen: React's loading state
  renders a bordered circle with a transparent top, spun by `arena-btn-spin`. That
  utility does not exist yet — add it to `frameworks/tailwind/animations.css` in this
  task, beside the others:

```css
@keyframes arena-btn-spin {
  to { transform: rotate(360deg); }
}

/* Reports work in progress, so it slows rather than stopping. */
@utility arena-btn-spin {
  animation: arena-btn-spin var(--loop-spin) linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: var(--loop-reduced);
  }
}
```

`active:scale-98` is Tailwind's own scale utility at React's `scale(0.98)`; if it emits
no rule, use `active:scale-[0.98]` — a bracket with no unit and a value the token layer
does not model is legal, and `check-tailwind` in Step 3 is what tells you which.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Button.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="760x340" name="Button" subtitle="Four variants, three sizes, rendered from Button.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Button.manifest.json')).json();

function button(label, opts = {}, { disabled = false, loading = false } = {}) {
  const c = classesFor(manifest, opts);
  const node = el('button', { class: c.root, type: 'button', disabled: disabled || undefined });
  if (loading) node.append(el('span', { class: c.spinner, 'aria-hidden': 'true' }));
  node.append(label);
  return node;
}

mountSpecimen({ sections: [
  section('Variants', ['primary', 'secondary', 'ghost', 'danger'].map((variant) =>
    button(variant[0].toUpperCase() + variant.slice(1), { variant }))),
  section('Sizes', ['sm', 'md', 'lg'].map((size) => button(`Deploy (${size})`, { size }))),
  section('States', [
    button('Disabled', {}, { disabled: true }),
    button('Loading', {}, { loading: true }),
    button('Full width', { full: 'true' }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`
Expected: `check-all: all 11 step(s) passed`.

Compare against React's `forms/forms.card.html`. All four variants must sit at the same
height, the danger button must be an outline, and the loading spinner must slow rather
than stop under reduced motion.

```bash
git add frameworks/tailwind/components/Button.manifest.json \
        frameworks/tailwind/components/Button.card.html \
        frameworks/tailwind/animations.css frameworks/tailwind/utilities.css
git commit -m "fix(tailwind): Button's manifest was missing half its variants"
```

---

## Task 4: IconButton

**Reference:** `frameworks/react/components/forms/IconButton.jsx`.

The `label` is required in React and it is required here too — an icon-only control with
no accessible name is a control only sighted mouse users can operate. `showLabel` is
the H6 answer: show the text where there is room rather than relying on a tooltip.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/IconButton.manifest.json`:

```json
{
  "component": "IconButton",
  "slots": {
    "root": "inline-flex items-center justify-center rounded-sm cursor-pointer transition-[background] duration-[var(--dur-fast)] ease-out disabled:opacity-45 disabled:cursor-not-allowed",
    "label": "font-body font-semibold text-ctl leading-ctl"
  },
  "variants": {
    "variant": {
      "ghost": { "root": "bg-transparent text-base-content/82 border-[length:var(--bw)] border-base-300 hover:bg-base-200" },
      "solid": { "root": "bg-primary text-primary-content border-none hover:bg-primary" }
    },
    "size": {
      "sm": { "root": "h-ctl-h-sm min-w-ctl-h-sm" },
      "md": { "root": "h-ctl-h min-w-ctl-h" },
      "lg": { "root": "h-ctl-h-lg min-w-ctl-h-lg" }
    },
    "showLabel": {
      "true": { "root": "w-auto gap-2 pl-3 pr-3.5" },
      "false": { "root": "w-ctl-h p-0 gap-0" }
    }
  },
  "defaultVariants": { "variant": "ghost", "size": "md", "showLabel": "false" }
}
```

`showLabel="false"` fixes the width at `--dz-ctl-h` for every size, which is React's
behaviour and is also why `w-ctl-h` appears alongside a size variant that already set
the height: the square shape is the icon button's identity, and it must not depend on
which size variant ran last.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/IconButton.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x280" name="IconButton" subtitle="Icon-only and labelled, rendered from IconButton.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./IconButton.manifest.json')).json();

function iconButton({ glyph, label, ...opts }) {
  const c = classesFor(manifest, opts);
  const node = el('button', { class: c.root, type: 'button', 'aria-label': label, title: opts.showLabel === 'true' ? undefined : label },
    el('i', { class: glyph, 'aria-hidden': 'true' }));
  if (opts.showLabel === 'true') node.append(el('span', { class: c.label, text: label }));
  return node;
}

mountSpecimen({ sections: [
  section('Sizes, ghost', ['sm', 'md', 'lg'].map((size) =>
    iconButton({ glyph: 'ph-bold ph-dots-three', label: 'More', size }))),
  section('Solid', [iconButton({ glyph: 'ph-bold ph-plus', label: 'Add', variant: 'solid' })]),
  section('With its label shown', [
    iconButton({ glyph: 'ph-bold ph-download-simple', label: 'Export', showLabel: 'true' }),
    iconButton({ glyph: 'ph-bold ph-plus', label: 'New project', variant: 'solid', showLabel: 'true' }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

```bash
git add frameworks/tailwind/components/IconButton.manifest.json \
        frameworks/tailwind/components/IconButton.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the IconButton manifest"
```

---

## Task 5: Input

**Reference:** `frameworks/react/components/forms/Input.jsx`.

Three visual states beyond neutral — focus (the **gold ring**), error (crimson border
plus a message) and valid (green border plus a check) — and the focus one is a
**modifier, not a variant**: it belongs to the DOM's state, and a manifest that made it a
variant would need the specimen to fake a focus that the browser owns.

**`--focus-width` reaches the Tailwind layer here**, having reached React in plan 4.5,
which found it with zero consumers while four components wrote `0 0 0 2px` by hand. It
stays in the coverage gate's `EXCLUDED` as unreachable *as a theme key* — v4 has no
namespace for a ring width — while `ring-[length:var(--focus-width)]` reaches it as a
bracket, which is legal and is not a theme key. If `bun run check:coverage` disagrees,
read its message before changing anything: it is the authority on its own rule.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Input.manifest.json`:

```json
{
  "component": "Input",
  "slots": {
    "root": "flex flex-col gap-1.5",
    "label": "font-mono text-ctl-xs tracking-field-label uppercase text-base-content/62",
    "required": "text-primary ml-1",
    "field": "flex items-center gap-2 h-ctl-h box-border px-3 bg-base-300 border-[length:var(--bw)] rounded-sm transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out focus-within:border-secondary focus-within:ring-[length:var(--focus-width)] focus-within:ring-secondary/16",
    "icon": "inline-flex text-base-content/62 text-[length:var(--icon-md)]",
    "prefix": "font-mono text-ctl-md text-base-content/62",
    "input": "flex-1 min-w-0 bg-transparent border-none outline-none text-base-content font-body text-ctl",
    "statusIcon": "text-[length:var(--icon-md)]",
    "hint": "font-body text-ctl-sm text-base-content/62",
    "error": "font-body text-ctl-sm text-error"
  },
  "variants": {
    "state": {
      "neutral": { "field": "border-base-300" },
      "error": { "field": "border-error ring-[length:var(--focus-width)] ring-error/14", "statusIcon": "text-error" },
      "valid": { "field": "border-success ring-[length:var(--focus-width)] ring-success/16", "statusIcon": "text-success" }
    },
    "disabled": {
      "true": { "root": "opacity-50" },
      "false": {}
    }
  },
  "defaultVariants": { "state": "neutral", "disabled": "false" }
}
```

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Input.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="760x420" name="Input" subtitle="Label, states and affixes, rendered from Input.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Input.manifest.json')).json();

function input({ label, value, placeholder, hint, error, state = 'neutral', required, prefix, icon, disabled }) {
  const c = classesFor(manifest, { state, disabled: String(Boolean(disabled)) });
  const root = el('div', { class: c.root });
  root.style.width = '260px';
  if (label) {
    const tag = el('label', { class: c.label }, label);
    if (required) tag.append(el('span', { class: c.required, text: '*' }));
    root.append(tag);
  }
  const field = el('div', { class: c.field });
  if (icon) field.append(el('span', { class: c.icon }, el('i', { class: icon, 'aria-hidden': 'true' })));
  if (prefix) field.append(el('span', { class: c.prefix, text: prefix }));
  field.append(el('input', { class: c.input, value: value ?? '', placeholder, disabled: disabled || undefined }));
  if (state === 'error') field.append(el('i', { class: `${c.statusIcon} ph-fill ph-warning-circle` }));
  if (state === 'valid') field.append(el('i', { class: `${c.statusIcon} ph-fill ph-check-circle` }));
  root.append(field);
  if (error) root.append(el('span', { class: c.error, text: error }));
  else if (hint) root.append(el('span', { class: c.hint, text: hint }));
  return root;
}

mountSpecimen({ sections: [
  section('States', [
    input({ label: 'Project name', placeholder: 'Ardennes', hint: 'Lowercase, no spaces.' }),
    input({ label: 'Project name', value: 'Ardennes 2', state: 'error', error: 'Spaces are not allowed.' }),
    input({ label: 'Project name', value: 'ardennes', state: 'valid', hint: 'Available.' }),
  ]),
  section('Affixes, required, disabled', [
    input({ label: 'Search', placeholder: 'Find a deployment', icon: 'ph-bold ph-magnifying-glass' }),
    input({ label: 'Budget', value: '48200', prefix: '$', required: true }),
    input({ label: 'Region', value: 'eu-west-1', disabled: true, hint: 'Set at creation time.' }),
  ]),
  section('Focus is a DOM state, not a variant — click into any field above', []),
]});
</script></body></html>
```

The last section is empty on purpose and is not a placeholder: the focus ring cannot be
rendered by a static specimen because focus belongs to the browser, and saying so on the
page is more honest than faking it with a class.

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

Compare against React's `forms/forms.card.html`, then **click into a field** and confirm
the gold ring appears — the one thing on this page only a real browser can show.

```bash
git add frameworks/tailwind/components/Input.manifest.json \
        frameworks/tailwind/components/Input.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Input manifest"
```

---

## Task 6: Textarea

**Reference:** `frameworks/react/components/forms/Textarea.jsx`. Same states as Input,
plus an optional character counter that turns `--warning` past 90% of `maxLength`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Textarea.manifest.json`:

```json
{
  "component": "Textarea",
  "slots": {
    "root": "flex flex-col gap-1.5",
    "label": "font-mono text-ctl-xs tracking-field-label uppercase text-base-content/62",
    "required": "text-primary ml-1",
    "field": "w-full px-3 py-2.5 bg-base-300 border-[length:var(--bw)] rounded-sm text-base-content font-body text-ctl leading-body outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out focus:border-secondary focus:ring-[length:var(--focus-width)] focus:ring-secondary/16",
    "foot": "flex justify-between gap-3",
    "hint": "font-body text-ctl-sm text-base-content/62",
    "error": "font-body text-ctl-sm text-error",
    "counter": "font-mono text-ctl-xs text-base-content/62",
    "counterNear": "font-mono text-ctl-xs text-warning"
  },
  "variants": {
    "state": {
      "neutral": { "field": "border-base-300" },
      "error": { "field": "border-error ring-[length:var(--focus-width)] ring-error/14" }
    },
    "resize": {
      "vertical": { "field": "resize-y" },
      "none": { "field": "resize-none" }
    },
    "disabled": {
      "true": { "root": "opacity-50" },
      "false": {}
    }
  },
  "defaultVariants": { "state": "neutral", "resize": "vertical", "disabled": "false" }
}
```

`resize` is a variant rather than a modifier because it is a *prop* in React
(`autoResize` swaps `resize: vertical` for `resize: none`), and the rule is that
variants mirror props while modifiers mirror DOM state.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Textarea.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="760x400" name="Textarea" subtitle="States and the counter, rendered from Textarea.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Textarea.manifest.json')).json();

function textarea({ label, value = '', hint, error, state = 'neutral', maxLength, required }) {
  const c = classesFor(manifest, { state });
  const root = el('div', { class: c.root });
  root.style.width = '300px';
  if (label) {
    const tag = el('label', { class: c.label }, label);
    if (required) tag.append(el('span', { class: c.required, text: '*' }));
    root.append(tag);
  }
  root.append(el('textarea', { class: c.field, rows: 4 }, value));
  const foot = el('div', { class: c.foot });
  foot.append(error ? el('span', { class: c.error, text: error })
    : hint ? el('span', { class: c.hint, text: hint }) : el('span'));
  if (maxLength) {
    const near = value.length > maxLength * 0.9;
    foot.append(el('span', { class: near ? c.counterNear : c.counter, text: `${value.length}/${maxLength}` }));
  }
  root.append(foot);
  return root;
}

mountSpecimen({ sections: [
  section('Neutral, with a hint', [textarea({ label: 'Release notes', value: 'Fixes the upstream timeout.', hint: 'Markdown is supported.' })]),
  section('Error', [textarea({ label: 'Release notes', value: '', error: 'Release notes are required.', state: 'error', required: true })]),
  section('Counter, and near the limit', [
    textarea({ label: 'Summary', value: 'Short summary.', maxLength: 140 }),
    textarea({ label: 'Summary', value: 'A summary long enough to pass ninety per cent of the limit and turn the counter to the warning colour, which is what this example is for.'.slice(0, 132), maxLength: 140 }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

```bash
git add frameworks/tailwind/components/Textarea.manifest.json \
        frameworks/tailwind/components/Textarea.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Textarea manifest"
```

---

## Task 7: Select

**Reference:** `frameworks/react/components/forms/Select.jsx`. A native `<select>` with
its own appearance removed and a caret drawn beside it, so the popup stays the platform's
and only the closed control is Arena's.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Select.manifest.json`:

```json
{
  "component": "Select",
  "slots": {
    "root": "flex flex-col gap-1.5",
    "label": "font-mono text-ctl-xs tracking-field-label uppercase text-base-content/62",
    "wrap": "relative",
    "field": "appearance-none w-full h-ctl-h pl-3 pr-9 bg-base-300 text-base-content border-[length:var(--bw)] border-base-300 rounded-sm font-body text-ctl cursor-pointer transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out focus:border-secondary focus:ring-[length:var(--focus-width)] focus:ring-secondary/16 focus:outline-none",
    "caret": "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/62 text-[length:var(--icon-sm)]"
  },
  "variants": {
    "disabled": {
      "true": { "root": "opacity-50", "field": "cursor-not-allowed" },
      "false": {}
    }
  },
  "defaultVariants": { "disabled": "false" }
}
```

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Select.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x260" name="Select" subtitle="The closed control, rendered from Select.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Select.manifest.json')).json();

function select({ label, options, value, disabled }) {
  const c = classesFor(manifest, { disabled: String(Boolean(disabled)) });
  const root = el('div', { class: c.root });
  root.style.width = '240px';
  if (label) root.append(el('label', { class: c.label, text: label }));
  const field = el('select', { class: c.field, disabled: disabled || undefined });
  for (const option of options) {
    field.append(el('option', { value: option, selected: option === value || undefined }, option));
  }
  root.append(el('div', { class: c.wrap }, field, el('span', { class: c.caret }, el('i', { class: 'ph-bold ph-caret-down' }))));
  return root;
}

mountSpecimen({ sections: [
  section('Default', [select({ label: 'Environment', options: ['Production', 'Staging', 'Preview'], value: 'Staging' })]),
  section('Disabled', [select({ label: 'Region', options: ['eu-west-1'], value: 'eu-west-1', disabled: true })]),
]});
</script></body></html>
```

React draws the caret as the character `▾`; the manifest uses Phosphor's `ph-caret-down`
instead, because the icon system is Phosphor and a stray Unicode glyph renders at the
mercy of whatever font resolves it. That is a **correction, not a port** — note it in the
commit message so the difference from React is deliberate on the record.

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

```bash
git add frameworks/tailwind/components/Select.manifest.json \
        frameworks/tailwind/components/Select.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Select manifest

The caret is Phosphor's ph-caret-down rather than React's Unicode glyph:
icons are Phosphor, and a bare character renders in whatever font resolves it."
```

---

## Task 8: Checkbox

**Reference:** `frameworks/react/components/forms/Checkbox.jsx`. The native input is
visually hidden and still the control; the box is a span that follows its state.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Checkbox.manifest.json`:

```json
{
  "component": "Checkbox",
  "slots": {
    "root": "inline-flex items-center gap-2.5 cursor-pointer",
    "box": "inline-flex items-center justify-center size-5 rounded-xs border-[length:var(--bw)] transition-[background] duration-[var(--dur-fast)] ease-out",
    "check": "text-primary-content",
    "label": "font-body text-ctl text-base-content/82",
    "input": "absolute opacity-0 size-0"
  },
  "variants": {
    "checked": {
      "true": { "box": "bg-primary border-primary" },
      "false": { "box": "bg-base-300 border-neutral" }
    },
    "disabled": {
      "true": { "root": "opacity-50 cursor-not-allowed" },
      "false": {}
    }
  },
  "defaultVariants": { "checked": "false", "disabled": "false" }
}
```

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Checkbox.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x240" name="Checkbox" subtitle="Checked, unchecked and disabled, rendered from Checkbox.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Checkbox.manifest.json')).json();

function checkbox({ label, checked = false, disabled = false }) {
  const c = classesFor(manifest, { checked: String(checked), disabled: String(disabled) });
  const box = el('span', { class: c.box });
  if (checked) {
    const svg = el('svg', { width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none', class: c.check });
    svg.append(el('path', { d: 'M2 6l3 3 5-6', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    box.append(svg);
  }
  return el('label', { class: c.root }, box, el('span', { class: c.label, text: label }));
}

mountSpecimen({ sections: [
  section('States', [
    checkbox({ label: 'Notify on failure', checked: true }),
    checkbox({ label: 'Notify on success' }),
    checkbox({ label: 'Managed by policy', checked: true, disabled: true }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

```bash
git add frameworks/tailwind/components/Checkbox.manifest.json \
        frameworks/tailwind/components/Checkbox.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Checkbox manifest"
```

---

## Task 9: Radio

**Reference:** `frameworks/react/components/forms/Radio.jsx` (both `RadioGroup` and
`Radio`). Selected is a crimson dot inside the ring — the ring's fill never changes,
which is what distinguishes a radio from a checkbox at a glance.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Radio.manifest.json`:

```json
{
  "component": "Radio",
  "slots": {
    "group": "flex flex-col gap-3",
    "root": "inline-flex items-start gap-2.5 cursor-pointer",
    "ring": "inline-flex items-center justify-center size-5 shrink-0 rounded-full bg-base-300 border-[length:var(--bw)] transition-[border-color] duration-[var(--dur-fast)] ease-out",
    "dot": "size-2.5 rounded-full bg-primary",
    "text": "flex flex-col gap-0.5",
    "label": "font-body text-ctl text-base-content/82 leading-snug",
    "hint": "font-body text-ctl-sm text-base-content/62 leading-body",
    "input": "absolute opacity-0 size-0"
  },
  "variants": {
    "checked": {
      "true": { "ring": "border-primary" },
      "false": { "ring": "border-neutral" }
    },
    "disabled": {
      "true": { "root": "opacity-50 cursor-not-allowed" },
      "false": {}
    }
  },
  "defaultVariants": { "checked": "false", "disabled": "false" }
}
```

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Radio.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x320" name="Radio" subtitle="A group with hints, rendered from Radio.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Radio.manifest.json')).json();
const base = classesFor(manifest);

function radio({ label, hint, checked = false, disabled = false }) {
  const c = classesFor(manifest, { checked: String(checked), disabled: String(disabled) });
  const ring = el('span', { class: c.ring });
  if (checked) ring.append(el('span', { class: c.dot }));
  const text = el('span', { class: c.text }, el('span', { class: c.label, text: label }));
  if (hint) text.append(el('span', { class: c.hint, text: hint }));
  return el('label', { class: c.root }, ring, text);
}

function group(options) {
  const box = el('div', { class: base.group, role: 'radiogroup' });
  for (const option of options) box.append(radio(option));
  return box;
}

mountSpecimen({ sections: [
  section('A group', [group([
    { label: 'Deploy on merge', hint: 'Every merge to main ships immediately.', checked: true },
    { label: 'Deploy on tag', hint: 'Only a release tag ships.' },
    { label: 'Manual only', hint: 'Locked by the organisation policy.', disabled: true },
  ])]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

```bash
git add frameworks/tailwind/components/Radio.manifest.json \
        frameworks/tailwind/components/Radio.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Radio manifest"
```

---

## Task 10: Switch

**Reference:** `frameworks/react/components/forms/Switch.jsx`. On is crimson. The
`confirm` affordance — a shield glyph next to the label for a toggle that opens a
confirmation instead of flipping — is part of the component, not decoration: it is what
tells the user, before they click, that this switch is guarded.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Switch.manifest.json`:

```json
{
  "component": "Switch",
  "slots": {
    "root": "inline-flex items-center gap-2.5 cursor-pointer",
    "track": "inline-flex items-center w-10 h-5.5 p-0.5 rounded-pill transition-[background] duration-[var(--dur-mid)] ease-out",
    "thumb": "size-4.5 rounded-full bg-primary-content transition-[transform] duration-[var(--dur-mid)] ease-out",
    "label": "inline-flex items-center gap-1.5 font-body text-ctl text-base-content/82",
    "guard": "text-[length:var(--icon-sm)] text-base-content/62",
    "input": "absolute opacity-0 size-0"
  },
  "variants": {
    "checked": {
      "true": { "track": "bg-primary", "thumb": "translate-x-4.5" },
      "false": { "track": "bg-neutral", "thumb": "translate-x-0" }
    },
    "disabled": {
      "true": { "root": "opacity-50 cursor-not-allowed" },
      "false": {}
    }
  },
  "defaultVariants": { "checked": "false", "disabled": "false" }
}
```

React translates the thumb by a flat `18px`; `translate-x-4.5` is 18px on the grid and
tracks the token, which is the rule this layer exists to hold.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Switch.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x260" name="Switch" subtitle="On, off and guarded, rendered from Switch.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Switch.manifest.json')).json();

function toggle({ label, checked = false, disabled = false, confirm = false }) {
  const c = classesFor(manifest, { checked: String(checked), disabled: String(disabled) });
  const text = el('span', { class: c.label }, label);
  if (confirm) text.append(el('i', { class: `${c.guard} ph-bold ph-shield-check`, title: 'Requires confirmation' }));
  return el('label', { class: c.root }, el('span', { class: c.track }, el('span', { class: c.thumb })), text);
}

mountSpecimen({ sections: [
  section('States', [
    toggle({ label: 'Email notifications', checked: true }),
    toggle({ label: 'Slack notifications' }),
    toggle({ label: 'Managed by policy', checked: true, disabled: true }),
  ]),
  section('Guarded — opens a confirmation instead of flipping', [
    toggle({ label: 'Auto-deploy to production', checked: true, confirm: true }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

```bash
git add frameworks/tailwind/components/Switch.manifest.json \
        frameworks/tailwind/components/Switch.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Switch manifest"
```

---

## Task 11: SegmentedControl

**Reference:** `frameworks/react/components/navigation/SegmentedControl.jsx`. Read its
header comment before writing anything: it is **deliberately not a Tabs look-alike**.
Tabs navigates between views and marks the active one with the crimson underline; this
filters, and marks the selection with a **neutral raised thumb** inside an enclosed
track. A filter must not spend the view's single primary accent, and the solid crimson
fill stays reserved for the primary action.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/SegmentedControl.manifest.json`:

```json
{
  "component": "SegmentedControl",
  "slots": {
    "track": "inline-flex items-center gap-0.5 p-1 bg-base-300 border-[length:var(--bw)] border-base-300 rounded-sm transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out focus-within:border-secondary focus-within:ring-[length:var(--focus-width)] focus-within:ring-secondary/16",
    "segment": "relative inline-flex items-center justify-center rounded-xs font-body cursor-pointer select-none whitespace-nowrap transition-[background,color] duration-[var(--dur-fast)] ease-out",
    "input": "absolute opacity-0 size-0"
  },
  "variants": {
    "size": {
      "sm": { "segment": "h-7 px-2.5 text-ctl-sm" },
      "md": { "segment": "h-8.5 px-3.5 text-ctl-md" }
    },
    "selected": {
      "true": { "segment": "bg-neutral text-base-content font-semibold shadow-1" },
      "false": { "segment": "bg-transparent text-base-content/62 font-medium hover:text-base-content/82" }
    }
  },
  "defaultVariants": { "size": "md", "selected": "false" }
}
```

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/SegmentedControl.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="760x260" name="SegmentedControl" subtitle="A filter, not tabs — rendered from SegmentedControl.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./SegmentedControl.manifest.json')).json();

function control({ options, value, size = 'md' }) {
  const track = el('div', { class: classesFor(manifest, { size }).track, role: 'radiogroup' });
  for (const option of options) {
    const c = classesFor(manifest, { size, selected: String(option === value) });
    track.append(el('label', { class: c.segment }, option));
  }
  return track;
}

mountSpecimen({ sections: [
  section('Medium', [control({ options: ['All', 'Running', 'Failed'], value: 'Running' })]),
  section('Small', [control({ options: ['24h', '7d', '30d', '90d'], value: '7d', size: 'sm' })]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit**

Run: `bun run build:tailwind && bun run check`

Compare against React's `forms/forms.card.html` **and** against the Tabs specimen from
Task 15 once it exists: if the two ever start looking alike, one of them has drifted from
the decision above.

```bash
git add frameworks/tailwind/components/SegmentedControl.manifest.json \
        frameworks/tailwind/components/SegmentedControl.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the SegmentedControl manifest"
```

---

## Task 12: Card

**Reference:** `frameworks/react/components/display/Card.jsx`.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Card.manifest.json`:

```json
{
  "component": "Card",
  "slots": {
    "root": "bg-base-200 border-[length:var(--bw)] rounded-lg overflow-hidden",
    "head": "flex items-start justify-between px-5 pt-4.5",
    "eyebrow": "font-mono text-ctl-xs tracking-label uppercase text-primary mb-1.5",
    "title": "font-display font-extrabold text-h4 text-base-content",
    "body": "p-5"
  },
  "variants": {
    "accent": {
      "true": { "root": "border-primary" },
      "false": { "root": "border-base-300" }
    },
    "floating": {
      "true": { "root": "shadow-2" },
      "false": { "root": "shadow-none" }
    }
  },
  "defaultVariants": { "accent": "false", "floating": "false" }
}
```

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Card.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="800x320" name="Card" subtitle="Surfaces and emphasis, rendered from Card.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Card.manifest.json')).json();

function card({ eyebrow, title, body, accent = false, floating = false }) {
  const c = classesFor(manifest, { accent: String(accent), floating: String(floating) });
  const root = el('div', { class: c.root });
  root.style.width = '240px';
  if (eyebrow || title) {
    const head = el('div', { class: c.head }, el('div', {},
      eyebrow ? el('div', { class: c.eyebrow, text: eyebrow }) : '',
      title ? el('div', { class: c.title, text: title }) : ''));
    root.append(head);
  }
  root.append(el('div', { class: c.body }, el('span', { class: 'font-body text-md text-base-content/82', text: body })));
  return root;
}

mountSpecimen({ sections: [
  section('Plain, floating, accented', [
    card({ eyebrow: 'Delivery', title: 'Client portal', body: 'Six deployments this week.' }),
    card({ eyebrow: 'Delivery', title: 'Billing service', body: 'Two deployments this week.', floating: true }),
    card({ eyebrow: 'Attention', title: 'Auth service', body: 'Rollback pending review.', accent: true }),
  ]),
  section('Body only', [card({ body: 'A card with no header is just a surface — use it for content that names itself.' })]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `display/display.card.html`)

```bash
git add frameworks/tailwind/components/Card.manifest.json \
        frameworks/tailwind/components/Card.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Card manifest"
```

---

## Task 13: Badge

**Reference:** `frameworks/react/components/display/Badge.jsx`. Seven tones, each a soft
tint with the full-strength colour as text — which is a **different taxonomy from Tag's
five outline tones**, and the two must not be collapsed into one manifest even though
they look adjacent. Read `guidelines/components-danger.html` if that distinction is not
obvious; `Tag.manifest.json` is the other half of it.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Badge.manifest.json`:

```json
{
  "component": "Badge",
  "slots": {
    "root": "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill font-mono text-ctl-xs font-bold tracking-badge uppercase",
    "dot": "size-1.5 rounded-full bg-current"
  },
  "variants": {
    "tone": {
      "neutral": { "root": "bg-base-300 text-base-content/82" },
      "accent": { "root": "bg-primary/14 text-primary" },
      "gold": { "root": "bg-secondary/16 text-secondary" },
      "success": { "root": "bg-success/16 text-success" },
      "warning": { "root": "bg-warning/18 text-warning" },
      "danger": { "root": "bg-error/14 text-error" },
      "info": { "root": "bg-info/16 text-info" }
    }
  },
  "defaultVariants": { "tone": "neutral" }
}
```

`bg-current` on the dot is React's `background: fg` — the dot always matches the badge's
own text colour, so a new tone needs no new dot rule.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Badge.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="760x240" name="Badge" subtitle="Seven tones, rendered from Badge.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Badge.manifest.json')).json();
const TONES = ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'];

function badge(tone, label, dot = false) {
  const c = classesFor(manifest, { tone });
  const node = el('span', { class: c.root });
  if (dot) node.append(el('span', { class: c.dot }));
  node.append(label);
  return node;
}

mountSpecimen({ sections: [
  section('Tones', TONES.map((tone) => badge(tone, tone))),
  section('With a status dot', [
    badge('success', 'Live', true),
    badge('warning', 'Degraded', true),
    badge('danger', 'Down', true),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `display/display.card.html`)

```bash
git add frameworks/tailwind/components/Badge.manifest.json \
        frameworks/tailwind/components/Badge.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Badge manifest"
```

---

## Task 14: Table

**Reference:** `frameworks/react/components/display/Table.jsx`.

The table has **two layouts**, and the manifest carries both: the wide table, and the
card-per-row layout it becomes below `--bp-md`. The *switch* between them is a
consumer's job — it is a measured branch in code, not a media query, and this layer
ships no code. Say that in the specimen rather than implying a breakpoint the manifest
does not enforce.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Table.manifest.json`:

```json
{
  "component": "Table",
  "slots": {
    "root": "w-full",
    "frame": "border-[length:var(--bw)] border-base-300 rounded-lg overflow-hidden bg-base-200",
    "table": "w-full border-collapse font-body",
    "headRow": "bg-base-200",
    "th": "px-row-px py-row-py text-left align-middle font-mono text-ctl-2xs font-bold tracking-column-header uppercase text-base-content/62 border-b-[length:var(--bw)] border-base-300",
    "row": "border-t-[length:var(--bw)] border-base-300 transition-[background] duration-[var(--dur-fast)] ease-out",
    "rowInteractive": "cursor-pointer hover:bg-base-200",
    "td": "px-row-px py-row-py text-left align-middle text-ctl font-body text-base-content/82",
    "tdMono": "px-row-px py-row-py text-left align-middle text-ctl font-mono text-secondary",
    "empty": "px-4 py-8 text-center text-ctl text-base-content/62",
    "cards": "flex flex-col gap-4",
    "card": "flex flex-col gap-stack bg-base-200 border-[length:var(--bw)] border-base-300 rounded-lg p-row-px",
    "cardRow": "flex items-baseline justify-between gap-3",
    "cardLabel": "font-mono text-ctl-2xs font-bold tracking-column-header uppercase text-base-content/62",
    "cardValue": "min-w-0 text-right text-ctl font-body text-base-content/82",
    "cardBlock": "w-full flex justify-end gap-2 border-t-[length:var(--bw)] border-base-300 pt-2"
  }
}
```

Every cell reads the density tokens (`px-row-px`, `py-row-py`, `text-ctl`, `gap-stack`),
which is what makes a table inside `.arena-compact` re-densify with the rows around it —
the whole reason those tokens exist.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Table.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="860x520" name="Table" subtitle="Both layouts, rendered from Table.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Table.manifest.json')).json();
const c = classesFor(manifest);

const COLUMNS = [
  { key: 'project', header: 'Project' },
  { key: 'commit', header: 'Commit', mono: true },
  { key: 'status', header: 'Status' },
];
const ROWS = [
  { project: 'Client portal', commit: '4f2a1c9', status: 'Live' },
  { project: 'Billing service', commit: '9db3e07', status: 'Rolling out' },
  { project: 'Auth service', commit: 'c1e8a44', status: 'Failed' },
];

function wide() {
  const head = el('tr', { class: c.headRow });
  for (const column of COLUMNS) head.append(el('th', { class: c.th, text: column.header }));
  const body = el('tbody');
  for (const row of ROWS) {
    const tr = el('tr', { class: `${c.row} ${c.rowInteractive}` });
    for (const column of COLUMNS) {
      tr.append(el('td', { class: column.mono ? c.tdMono : c.td, text: row[column.key] }));
    }
    body.append(tr);
  }
  const table = el('table', { class: c.table }, el('thead', {}, head), body);
  return el('div', { class: c.frame }, table);
}

function cards() {
  const list = el('div', { class: c.cards });
  for (const row of ROWS) {
    const card = el('div', { class: c.card });
    for (const column of COLUMNS) {
      card.append(el('div', { class: c.cardRow },
        el('span', { class: c.cardLabel, text: column.header }),
        el('span', { class: c.cardValue, text: row[column.key] })));
    }
    list.append(card);
  }
  return list;
}

function emptyTable() {
  const head = el('tr', { class: c.headRow });
  for (const column of COLUMNS) head.append(el('th', { class: c.th, text: column.header }));
  const cell = el('td', { class: c.empty, colspan: COLUMNS.length, text: 'No deployments in this range.' });
  return el('div', { class: c.frame }, el('table', { class: c.table }, el('thead', {}, head), el('tbody', {}, el('tr', {}, cell))));
}

mountSpecimen({ sections: [
  section('Wide layout', [wide()], { stack: true }),
  section('Card layout — what the consumer renders below --bp-md, measured on the container, never a media query', [cards()], { stack: true }),
  section('Empty', [emptyTable()], { stack: true }),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `display/table-avatar.card.html`)

Check `.arena-compact` here with particular care: row padding and cell text must both
tighten, and if they do not, a cell is carrying a literal instead of a density token.

```bash
git add frameworks/tailwind/components/Table.manifest.json \
        frameworks/tailwind/components/Table.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Table manifest, both layouts"
```

---

## Task 15: Tabs

**Reference:** `frameworks/react/components/navigation/Tabs.jsx`. The active tab is marked
by the **crimson underline** — `inset 0 -2px 0` in React, which is a box-shadow rather
than a border so the tab does not shift by 2px when it activates. Keep that; a bottom
border here is a visible jump.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Tabs.manifest.json`:

```json
{
  "component": "Tabs",
  "slots": {
    "root": "flex gap-1 border-b-[length:var(--bw)] border-base-300",
    "tab": "relative px-4 py-2.5 bg-transparent border-none cursor-pointer font-body text-ctl transition-[color] duration-[var(--dur-fast)] ease-out"
  },
  "variants": {
    "selected": {
      "true": { "tab": "font-semibold text-base-content shadow-[inset_0_calc(var(--bw-strong)*-1)_0_var(--crimson)]" },
      "false": { "tab": "font-medium text-base-content/62 shadow-none hover:text-base-content/82" }
    }
  },
  "defaultVariants": { "selected": "false" }
}
```

The underline is a **derivation**, and it has to be: React writes `inset 0 -2px 0`, and
`-2px` is a raw dimension that `check:arbitrary` rejects — correctly, since
`--bw-strong` *is* 2px. `calc(var(--bw-strong)*-1)` is what plan 4.5 made legal, and it
is the better spelling anyway: the underline now tracks the token instead of restating
it. Negating a width in a shorthand is a `calc()` because CSS has no `-var()`.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Tabs.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x240" name="Tabs" subtitle="Navigation between views, rendered from Tabs.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Tabs.manifest.json')).json();

function tabs(labels, active) {
  const root = el('div', { class: classesFor(manifest).root });
  for (const label of labels) {
    const c = classesFor(manifest, { selected: String(label === active) });
    root.append(el('button', { class: c.tab, type: 'button', text: label }));
  }
  return root;
}

mountSpecimen({ sections: [
  section('Three views', [tabs(['Overview', 'Deployments', 'Settings'], 'Deployments')], { stack: true }),
  section('First selected', [tabs(['Logs', 'Metrics'], 'Logs')], { stack: true }),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `navigation/navigation.card.html`)

Click between the tabs on the React page and confirm nothing moves vertically; then
confirm the same on this one.

```bash
git add frameworks/tailwind/components/Tabs.manifest.json \
        frameworks/tailwind/components/Tabs.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Tabs manifest"
```

---

## Task 16: Dialog

**Reference:** `frameworks/react/components/feedback/Dialog.jsx`. The routine modal —
`ConfirmDialog` (5a) is the high-consequence one, sits above it at `z-modal-nested`, and
is the only one with a filled danger surface. This one closes on click-outside; that
difference is the whole reason there are two components.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Dialog.manifest.json`:

```json
{
  "component": "Dialog",
  "slots": {
    "scrim": "fixed inset-0 z-modal flex items-center justify-center bg-scrim backdrop-blur-scrim",
    "panel": "arena-pop w-120 max-w-[92vw] bg-base-200 border-[length:var(--bw)] border-neutral rounded-lg shadow-3 overflow-hidden",
    "head": "px-6 pt-5.5",
    "eyebrow": "font-mono text-ctl-xs tracking-label uppercase text-primary mb-2",
    "title": "font-display font-extrabold text-h3 text-base-content tracking-tight",
    "body": "px-6 py-4 font-body text-md leading-body text-base-content/82",
    "foot": "flex justify-end gap-2.5 px-6 pb-5.5"
  }
}
```

`w-120` is 480px, React's default width. `arena-pop` is the entrance utility Task 2
added: it keeps its fade and drops its travel under reduced motion.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Dialog.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="800x420" name="Dialog" subtitle="The routine modal, rendered from Dialog.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Dialog.manifest.json')).json();
const c = classesFor(manifest);

/* The panel is shown outside its `fixed` scrim, which a specimen cannot render
   twice on one page. The scrim's own look is checked on the ConfirmDialog and
   CommandPalette specimens, which show it in place. */
function dialog({ eyebrow, title, body, actions }) {
  const foot = el('div', { class: c.foot });
  for (const action of actions) foot.append(el('span', { class: 'font-body text-ctl text-base-content/82', text: `[ ${action} ]` }));
  return el('div', { class: c.panel },
    el('div', { class: c.head }, el('div', { class: c.eyebrow, text: eyebrow }), el('div', { class: c.title, text: title })),
    el('div', { class: c.body, text: body }),
    foot);
}

mountSpecimen({ sections: [
  section('With a footer', [dialog({
    eyebrow: 'Deployment', title: 'Promote build 482 to production?',
    body: 'The current production build stays available for rollback for seven days.',
    actions: ['Cancel', 'Promote'],
  })], { stack: true }),
  section('Content only', [dialog({
    eyebrow: 'Changelog', title: "What's new in 4.1",
    body: 'The token layer is now DTCG JSON, and every framework layer reads the same values.',
    actions: [],
  })], { stack: true }),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `feedback/feedback.card.html`)

Reload the page and watch the entrance; then turn on reduced motion, reload, and confirm
the panel **fades without travelling**.

```bash
git add frameworks/tailwind/components/Dialog.manifest.json \
        frameworks/tailwind/components/Dialog.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Dialog manifest"
```

---

## Task 17: Menu

**Reference:** `frameworks/react/components/navigation/Menu.jsx`. Four kinds of row —
item, destructive item, divider and header — and a hover that turns the item crimson on
a crimson-soft tint, or `--danger-soft` when it is destructive.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Menu.manifest.json`:

```json
{
  "component": "Menu",
  "slots": {
    "root": "relative inline-flex",
    "panel": "arena-menu absolute top-full left-0 mt-1.5 z-dropdown min-w-50 p-1.5 bg-base-200 border-[length:var(--bw)] border-neutral rounded-md shadow-2",
    "panelEnd": "left-auto right-0",
    "item": "flex items-center gap-2.5 w-full text-left px-2.5 py-2 border-none rounded-sm cursor-pointer bg-transparent font-body text-md text-base-content/82 hover:bg-primary/14 hover:text-primary",
    "itemDestructive": "text-error hover:bg-error/14 hover:text-error",
    "itemDisabled": "text-base-content/62 opacity-60 cursor-not-allowed hover:bg-transparent hover:text-base-content/62",
    "icon": "inline-flex text-[length:var(--icon-md)]",
    "label": "flex-1",
    "shortcut": "font-mono text-ctl-xs text-base-content/62",
    "divider": "h-px my-1 bg-base-300",
    "header": "font-mono text-ctl-2xs tracking-field-label uppercase text-base-content/62 px-2.5 pt-2 pb-1"
  }
}
```

`min-w-50` is React's `calc(var(--sp-1) * 50)` = 200px. `h-px` for the divider, for the
reason `BulkActionBar` states: it is a hairline, not a border.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Menu.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x400" name="Menu" subtitle="Items, headers and dividers, rendered from Menu.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Menu.manifest.json')).json();
const c = classesFor(manifest);

const ITEMS = [
  { header: 'This deployment' },
  { label: 'View logs', icon: 'ph-bold ph-list-magnifying-glass', shortcut: 'L' },
  { label: 'Re-run', icon: 'ph-bold ph-arrow-clockwise' },
  { label: 'Promote', icon: 'ph-bold ph-arrow-fat-line-up', disabled: true },
  { divider: true },
  { label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
];

/* Rendered open and un-pinned: the panel is `absolute`, and a specimen that had
   to hover a trigger would show nothing in a screenshot. */
function menu() {
  const panel = el('div', { class: c.panel, role: 'menu' });
  panel.style.position = 'static';
  for (const item of ITEMS) {
    if (item.divider) { panel.append(el('div', { class: c.divider })); continue; }
    if (item.header) { panel.append(el('div', { class: c.header, text: item.header })); continue; }
    const classes = [c.item, item.destructive ? c.itemDestructive : '', item.disabled ? c.itemDisabled : ''].filter(Boolean).join(' ');
    const row = el('button', { class: classes, type: 'button', role: 'menuitem' },
      el('span', { class: c.icon }, el('i', { class: item.icon, 'aria-hidden': 'true' })),
      el('span', { class: c.label, text: item.label }));
    if (item.shortcut) row.append(el('span', { class: c.shortcut, text: item.shortcut }));
    panel.append(row);
  }
  const box = el('div', { class: c.root });
  box.style.display = 'block';
  box.style.width = '240px';
  box.append(panel);
  return box;
}

mountSpecimen({ sections: [section('Open — hover a row', [menu()])]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `navigation/menu-pagination.card.html`)

Hover each row: a normal item goes crimson on crimson-soft, the destructive one stays in
`--error` on `--danger-soft`, and the disabled one does nothing at all.

```bash
git add frameworks/tailwind/components/Menu.manifest.json \
        frameworks/tailwind/components/Menu.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Menu manifest"
```

---

## Task 18: Tooltip

**Reference:** `frameworks/react/components/feedback/Tooltip.jsx`. It inverts — bone
surface, ink text — which is what makes it read as an overlay rather than another panel.
Opacity-only animation, so **no reduced-motion clause**.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Tooltip.manifest.json`:

```json
{
  "component": "Tooltip",
  "slots": {
    "root": "relative inline-flex",
    "bubble": "arena-fade absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-2 z-tooltip whitespace-nowrap px-2.5 py-1.5 rounded-sm shadow-2 bg-base-content text-base-100 font-mono text-ctl-xs"
  }
}
```

`bg-base-content` / `text-base-100` is React's `--bone` on `--ink`, expressed through the
daisyUI tokens the aliases point at — so the inversion follows a re-skin instead of
needing one.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Tooltip.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x240" name="Tooltip" subtitle="The inverted overlay, rendered from Tooltip.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Tooltip.manifest.json')).json();
const c = classesFor(manifest);

function tooltip(label, content) {
  const bubble = el('span', { class: c.bubble, role: 'tooltip', text: content });
  const root = el('span', { class: c.root },
    el('span', { class: 'font-body text-ctl text-base-content/82', text: label }), bubble);
  root.style.marginTop = 'var(--sp-8)';
  return root;
}

mountSpecimen({ sections: [
  section('Always shown here — in use it appears on hover', [
    tooltip('Deployments', 'Everything shipped in the last 30 days'),
    tooltip('p95', '95th percentile response time'),
  ]),
]});
</script></body></html>
```

The bubble is rendered permanently rather than on hover, because a specimen exists to be
looked at and a tooltip that requires a mouse cannot be screenshotted. Its `margin-top`
is the specimen's, giving the bubble room above the label.

- [ ] **Step 3: Rebuild, gate, look, commit** (against `feedback/feedback.card.html`)

```bash
git add frameworks/tailwind/components/Tooltip.manifest.json \
        frameworks/tailwind/components/Tooltip.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Tooltip manifest"
```

---

## Task 19: Toast

**Reference:** `frameworks/react/components/feedback/Toast.jsx`. The tone is a
**2px left border**, not a fill — the toast surface stays the card surface in every tone.
`persist` (H1) adds the "Pinned" chip and is mandatory for error states, so they cannot
disappear before they are read.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Toast.manifest.json`:

```json
{
  "component": "Toast",
  "slots": {
    "root": "flex gap-3 items-start w-85 px-4 py-3.5 z-toast bg-base-200 border-[length:var(--bw)] border-base-300 border-l-[length:var(--bw-strong)] rounded-md shadow-2",
    "body": "flex-1",
    "title": "flex items-center gap-2 font-body font-semibold text-ctl text-base-content",
    "pinned": "font-mono text-ctl-2xs tracking-column-header uppercase text-base-content/62 border-[length:var(--bw)] border-base-300 rounded-xs px-1",
    "message": "font-body text-sm text-base-content/62 mt-0.5",
    "action": "mt-2.5 bg-transparent border-none p-0 cursor-pointer font-mono text-ctl-sm font-bold tracking-uppercase-status uppercase",
    "close": "inline-flex items-center bg-transparent border-none cursor-pointer text-base-content/62 text-[length:var(--icon-md)] leading-ctl"
  },
  "variants": {
    "tone": {
      "neutral": { "root": "border-l-neutral", "action": "text-primary" },
      "success": { "root": "border-l-success", "action": "text-primary" },
      "danger": { "root": "border-l-error", "action": "text-secondary" },
      "gold": { "root": "border-l-secondary", "action": "text-primary" }
    }
  },
  "defaultVariants": { "tone": "neutral" }
}
```

The danger toast's action is **gold, not crimson** — React does that deliberately: a
crimson action on a red-bordered toast disappears into it. Keep it.

`w-85` is 340px, React's fixed toast width.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Toast.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="800x400" name="Toast" subtitle="Tones, action and pinned, rendered from Toast.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Toast.manifest.json')).json();

function toast({ tone = 'neutral', title, message, action, persist }) {
  const c = classesFor(manifest, { tone });
  const heading = el('div', { class: c.title }, title);
  if (persist) heading.append(el('span', { class: c.pinned, title: 'Does not auto-dismiss', text: 'Pinned' }));
  const body = el('div', { class: c.body }, heading, el('div', { class: c.message, text: message }));
  if (action) body.append(el('button', { class: c.action, type: 'button', text: action }));
  return el('div', { class: c.root }, body,
    el('button', { class: c.close, type: 'button', 'aria-label': 'Close' }, el('i', { class: 'ph-bold ph-x' })));
}

mountSpecimen({ sections: [
  section('Tones', [
    toast({ title: 'Settings saved', message: 'Applied to all environments.' }),
    toast({ tone: 'success', title: 'Deployed', message: 'Build 482 is live.', action: 'View logs' }),
    toast({ tone: 'gold', title: 'Queued', message: 'Waiting for the deploy window.' }),
  ]),
  section('An error, pinned — it does not auto-dismiss', [
    toast({ tone: 'danger', title: 'Deploy failed', message: 'The upstream check timed out.', action: 'Retry', persist: true }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `feedback/feedback.card.html`)

```bash
git add frameworks/tailwind/components/Toast.manifest.json \
        frameworks/tailwind/components/Toast.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Toast manifest"
```

---

## Task 20: Pagination

**Reference:** `frameworks/react/components/navigation/Pagination.jsx`. Numbers in mono,
the current page filled crimson, and disabled arrows in `--mute-2-disabled` — a level
that is **deliberately low** and is not a contrast failure: WCAG exempts inactive
components, and a disabled control must read as inactive. `tokens/colors.css` says so at
the declaration; do not raise it.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Pagination.manifest.json`:

```json
{
  "component": "Pagination",
  "slots": {
    "root": "inline-flex items-center gap-1.5",
    "nav": "inline-flex items-center justify-center h-8.5 min-w-8.5 px-2 bg-transparent border-[length:var(--bw)] border-base-300 rounded-sm text-[length:var(--icon-md)] cursor-pointer text-base-content/82",
    "navDisabled": "text-base-content/40 cursor-not-allowed",
    "page": "inline-flex items-center justify-center h-8.5 min-w-8.5 px-2 rounded-sm border-[length:var(--bw)] cursor-pointer font-mono text-ctl-md font-bold",
    "pageCurrent": "bg-primary border-primary text-primary-content",
    "pageOther": "bg-transparent border-base-300 text-base-content/82",
    "ellipsis": "px-1 font-mono text-ctl-md text-base-content/62"
  }
}
```

`text-base-content/40` is `--mute-2-disabled` expressed through the token it derives
from — same value, same reason, and it re-skins with the rest.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Pagination.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="760x260" name="Pagination" subtitle="Pages and ellipsis, rendered from Pagination.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Pagination.manifest.json')).json();
const c = classesFor(manifest);

/* The same page list React computes: first, last, the current page and its
   neighbours, with an ellipsis wherever the run breaks. */
function pages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push('…');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
}

function arrow(direction, disabled) {
  return el('button', {
    class: `${c.nav}${disabled ? ` ${c.navDisabled}` : ''}`, type: 'button',
    'aria-label': direction < 0 ? 'Previous' : 'Next', disabled: disabled || undefined,
  }, el('i', { class: direction < 0 ? 'ph-bold ph-caret-left' : 'ph-bold ph-caret-right' }));
}

function pagination(current, total) {
  const nav = el('nav', { class: c.root, 'aria-label': 'Pagination' }, arrow(-1, current <= 1));
  for (const page of pages(current, total)) {
    if (page === '…') { nav.append(el('span', { class: c.ellipsis, text: '…' })); continue; }
    const isCurrent = page === current;
    nav.append(el('button', {
      class: `${c.page} ${isCurrent ? c.pageCurrent : c.pageOther}`, type: 'button',
      'aria-current': isCurrent ? 'page' : undefined, text: String(page),
    }));
  }
  nav.append(arrow(1, current >= total));
  return nav;
}

mountSpecimen({ sections: [
  section('Short — every page shown', [pagination(3, 5)]),
  section('Long — with ellipsis, and the first page disabled', [pagination(1, 24), pagination(12, 24)]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `navigation/menu-pagination.card.html`)

```bash
git add frameworks/tailwind/components/Pagination.manifest.json \
        frameworks/tailwind/components/Pagination.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Pagination manifest"
```

---

## Task 21: ProgressBar

**Reference:** `frameworks/react/components/feedback/ProgressBar.jsx`. Determinate is the
default and the point: reserve `indeterminate` for a wait with no known percentage. The
indeterminate sweep is the `arena-prog-indeterminate` utility from Task 2, which paints a
`::after` in `currentColor` — so the tone variant sets the **text** colour of the track
and the fill follows.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/ProgressBar.manifest.json`:

```json
{
  "component": "ProgressBar",
  "slots": {
    "root": "w-full",
    "head": "flex items-baseline justify-between gap-3 mb-2",
    "label": "font-body text-ctl-md text-base-content/82",
    "value": "font-mono text-ctl-sm text-base-content/62",
    "track": "relative rounded-pill bg-base-300 overflow-hidden",
    "fill": "absolute inset-0 bg-current rounded-[inherit] transition-[width] duration-[var(--dur-mid)] ease-out",
    "indeterminate": "arena-prog-indeterminate"
  },
  "variants": {
    "tone": {
      "accent": { "track": "text-primary" },
      "gold": { "track": "text-secondary" },
      "success": { "track": "text-success" },
      "danger": { "track": "text-error" },
      "info": { "track": "text-info" }
    },
    "size": {
      "sm": { "track": "h-1" },
      "md": { "track": "h-1.5" },
      "lg": { "track": "h-2.5" }
    }
  },
  "defaultVariants": { "tone": "accent", "size": "md" }
}
```

`rounded-[inherit]` carries no digit and no hash, so the arbitrary gate accepts it; if
`check:tailwind` reports it emits no rule, use `rounded-pill` on the fill instead — the
track already clips it.

The **width of the fill is a binding, not a class**: it is a percentage computed from
`value`, and a manifest cannot hold a hundred of them. The consumer sets
`style="width: 42%"`, and the specimen below does the same.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/ProgressBar.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="760x400" name="ProgressBar" subtitle="Determinate and indeterminate, rendered from ProgressBar.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./ProgressBar.manifest.json')).json();

function bar({ label, value, tone = 'accent', size = 'md', indeterminate = false }) {
  const c = classesFor(manifest, { tone, size });
  const root = el('div', { class: c.root });
  root.style.width = '260px';
  if (label) {
    const head = el('div', { class: c.head }, el('span', { class: c.label, text: label }));
    if (!indeterminate) head.append(el('span', { class: c.value, text: `${value}%` }));
    root.append(head);
  }
  const track = el('div', {
    class: `${c.track}${indeterminate ? ` ${c.indeterminate}` : ''}`, role: 'progressbar',
    'aria-valuenow': indeterminate ? undefined : value, 'aria-valuemin': 0, 'aria-valuemax': 100,
    'aria-label': label ?? 'Progress',
  });
  if (!indeterminate) {
    const fill = el('span', { class: c.fill });
    fill.style.width = `${value}%`;
    track.append(fill);
  }
  root.append(track);
  return root;
}

mountSpecimen({ sections: [
  section('Determinate — prefer this whenever the percentage is knowable', [
    bar({ label: 'Uploading artifacts', value: 42 }),
    bar({ label: 'Migrating rows', value: 88, tone: 'success' }),
    bar({ label: 'Retrying', value: 15, tone: 'danger' }),
  ]),
  section('Sizes', [bar({ value: 60, size: 'sm' }), bar({ value: 60 }), bar({ value: 60, size: 'lg' })]),
  section('Indeterminate — only when there is no percentage to report', [
    bar({ label: 'Waiting for the runner', indeterminate: true }),
  ]),
]});
</script></body></html>
```

- [ ] **Step 3: Rebuild, gate, look, commit** (against `feedback/feedback.card.html`)

Turn on reduced motion and confirm the indeterminate sweep **slows to `--loop-reduced`
rather than stopping** — a frozen progress bar reads as a hung process.

```bash
git add frameworks/tailwind/components/ProgressBar.manifest.json \
        frameworks/tailwind/components/ProgressBar.card.html frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the ProgressBar manifest"
```

---

## Task 22: Spinner

**Reference:** `frameworks/react/components/feedback/Spinner.jsx`. Note which tones it
has and which it does not: `accent`, `gold`, `neutral` and `on-accent`, and **no status
tones** — an indeterminate wait has no state to report, and a spinner tinted `--danger`
reads as a failure that has not happened. Do not add them.

- [ ] **Step 1: Write the manifest**

Create `frameworks/tailwind/components/Spinner.manifest.json`:

```json
{
  "component": "Spinner",
  "slots": {
    "root": "inline-flex",
    "circle": "arena-spinner inline-block box-border border-[length:var(--bw-strong)] border-current border-t-transparent rounded-full"
  },
  "variants": {
    "tone": {
      "accent": { "root": "text-primary" },
      "gold": { "root": "text-secondary" },
      "neutral": { "root": "text-base-content/62" },
      "on-accent": { "root": "text-primary-content" }
    },
    "size": {
      "sm": { "circle": "size-icon-sm" },
      "md": { "circle": "size-5" },
      "lg": { "circle": "size-8" }
    }
  },
  "defaultVariants": { "tone": "accent", "size": "md" }
}
```

`sm` is `size-icon-sm` (14px) rather than `size-3.5`, and that is the more truthful
mapping: a small spinner sits inline beside a control's icon and should track the icon
scale, which is exactly the argument that put `--icon-*` in its own family.

`arena-spinner` is a new utility — add it to `frameworks/tailwind/animations.css`:

```css
@keyframes arena-spinner {
  to { transform: rotate(360deg); }
}

/* Reports work in progress, so it slows rather than stopping. */
@utility arena-spinner {
  animation: arena-spinner var(--loop-spin) linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: var(--loop-reduced);
  }
}
```

Task 3's `arena-btn-spin` is byte-identical to this, and they still **do not** merge:
Button's spinner and Spinner are two components, and one utility shared between them
makes a change to either a change to both. React keeps them separate for the same
reason. What they do share is `--loop-spin` — which is the level at which "these two
spin at the same speed" is supposed to be stated.

- [ ] **Step 2: Write the specimen**

Create `frameworks/tailwind/components/Spinner.card.html`:

```html
<!-- @dsCard group="Tailwind" viewport="700x260" name="Spinner" subtitle="Sizes and tones, rendered from Spinner.manifest.json" -->
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../../styles.css">
<link rel="stylesheet" href="../utilities.css">
<link rel="stylesheet" href="../specimen.css">
</head><body><div id="root"></div>
<script type="module">
import { mountSpecimen, section, el, classesFor } from '../specimen.js';

const manifest = await (await fetch('./Spinner.manifest.json')).json();

function spinner({ size = 'md', tone = 'accent' }) {
  const c = classesFor(manifest, { size, tone });
  return el('span', { class: c.root, role: 'status', 'aria-label': 'Loading' },
    el('span', { class: c.circle, 'aria-hidden': 'true' }));
}

mountSpecimen({ sections: [
  section('Sizes', ['sm', 'md', 'lg'].map((size) => spinner({ size }))),
  section('Tones — no status tones, on purpose', ['accent', 'gold', 'neutral'].map((tone) => spinner({ tone }))),
]});
</script></body></html>
```

`on-accent` is absent from the specimen because it only reads correctly on a crimson
surface, which this page does not have; it is exercised by Button's loading state, which
uses `currentColor` for the same reason.

- [ ] **Step 3: Rebuild, gate, look, commit** (against `feedback/feedback.card.html`)

```bash
git add frameworks/tailwind/components/Spinner.manifest.json \
        frameworks/tailwind/components/Spinner.card.html \
        frameworks/tailwind/animations.css frameworks/tailwind/utilities.css
git commit -m "feat(tailwind): add the Spinner manifest"
```

---

## Task 23: Close out the layer

**Files:**
- Modify: `frameworks/tailwind/README.md`
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Correct the inventory**

In `frameworks/tailwind/README.md`, replace the "What ships here" section 5a added with:

```markdown
## What ships here

`components/` holds **36 manifests**, one per component, each with a specimen page
beside it that renders the real markup from the real recipe with no build step. Sixteen
have an Angular primitive consuming them; twenty do not, and what holds those up is
`bun run check:tailwind` — every class a manifest declares must produce a rule, so a
manifest with no consumer cannot rot silently.

**The three SVG charts and Calendar have no manifest, on purpose.** `BarChart`,
`LineChart` and `DoughnutChart` are SVG geometry driven by measured container width:
their identity is path data and attribute bindings, and a manifest that tried to hold it
would be a lie about where the styling lives. `ChartCard` is not one of them and does
have a manifest — it is a bordered tile. Calendar is date arithmetic and JS responsive
branches; what a manifest could capture is a fraction of it, and that fraction would
drift from the rest.

`utilities.css` is **generated** — `bun run build:tailwind` compiles the preset with the
manifests as content, and `bun run check:tailwind-generated` fails when the committed
file and the source disagree. Do not edit it. `animations.css` holds the keyframe
utilities a manifest cannot express, each answering `prefers-reduced-motion` on its own
terms.
```

- [ ] **Step 2: Correct `CLAUDE.md`**

The sentence about manifest-to-component mapping that 5a rewrote needs one more pass now
that twenty manifests have no Angular consumer at all. Replace it with:

```markdown
**No gate compares a Tailwind manifest against the component it mirrors, and the
mapping is not one-to-one**: 16 of the 36 manifests mirror both a React component and an
`arena-*` primitive; the other 20 mirror a React component alone, because Angular
Material provides that control and `arena-material.css` dresses it. `Tag.manifest.json`
is the one that mirrors an **Angular** primitive whose React namesake is a different
component. `check:tailwind` proves every class resolves; nothing proves a manifest still
matches the component it was derived from, so check by hand when either has moved.
```

- [ ] **Step 3: Write the changelog entry**

Under `## [Unreleased]`, in the `### Added` block 5a started:

```markdown
- **20 more component manifests** — Button (completed: `secondary` and `ghost` were
  missing), IconButton, Input, Textarea, Select, Checkbox, Radio, Switch,
  SegmentedControl, Card, Badge, Table, Tabs, Dialog, Menu, Tooltip, Toast, Pagination,
  ProgressBar, Spinner — each with a specimen page. These are what a framework-neutral
  consumer hand-rolls; Angular consumers use Material for the same 20, dressed by
  `arena-material.css`. The Tailwind layer now ships 36 manifests: the parity spec's 35,
  plus `ChartCard`, which the spec grouped with the SVG charts and which a manifest holds
  comfortably.
- **`frameworks/tailwind/specimen.css`** — one stylesheet for every specimen page.
```

- [ ] **Step 4: The full sweep**

```bash
bun run build:tailwind && bun run check
```
Expected: `check-all: all 11 step(s) passed`, and `check-tailwind` reporting **36
manifests**.

```bash
ls frameworks/tailwind/components/*.manifest.json | wc -l
ls frameworks/tailwind/components/*.card.html | wc -l
```
Expected: `36` and `36`.

```bash
git diff --stat main -- frameworks/react/
```
Expected: **no output**.

```bash
bun run check:arbitrary
```
Expected: `check-arbitrary-values: … none`. Every bracket in all 36 manifests holds a
`var()`, a derivation of one, or a unit the token layer does not model.

Then, with `bun run demos` running, open all 36 specimens in **dark**, in **light**, and
in **`.arena-compact`**, each against the React card page its task names. A specimen that
renders unstyled means `utilities.css` is stale — rebuild before concluding anything.

- [ ] **Step 5: Commit**

```bash
git add frameworks/tailwind/README.md CLAUDE.md CHANGELOG.md
git commit -m "docs: the Tailwind layer ships 36 manifests, and says so"
```

---

## What this plan does not do

- **No release, no packaging.** Both are plan 6. The changelog entry stays under
  `[Unreleased]`.
- **No token changes.** If a manifest here seems to need a value with no token behind it,
  that is a finding to raise, not a literal to write.
- **No Angular.** Every component here is one Material provides; implementing them as
  `arena-*` is the parity spec's first stated non-goal.
- **No manifest for the three SVG charts or Calendar.** Stated above, and in both
  READMEs. `ChartCard` has one; plan 5a wrote it.
