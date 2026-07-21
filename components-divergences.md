# Component divergences between framework layers

Arena's design language is one thing; its framework layers are several. **For component design,
`tokens/` and `tokens/src/` are the only source of truth.** A layer that disagrees with the token
layer is wrong, and that is not negotiable.

Behaviour is different. Arena is in an implementation phase across frameworks, and the layers will
not always do the same thing — a framework's idiom, its accessibility affordances, or the order in
which components were built can all pull a layer away from its counterpart. **No layer is the
absolute authority for component behaviour.** Where the layers genuinely differ, the difference is
recorded here rather than treated as a defect in whichever layer was written second.

This file is the record. A divergence that is not written down is a bug; a divergence that is
written down, with its reason, is a decision.

Each entry states: what differs, in which layers, why, and whether it is expected to converge.

---

## Structural divergences — these hold across the whole Angular layer

### An Angular primitive host-binds its root; a React component renders a wrapper

**React:** the component's `root` element is a real element inside its own render output.
**Angular:** the recipe's `root` slot is bound onto the host — `host: { '[class]': 'styles().root()' }` —
and no wrapper element is rendered. The host *is* the styled root.

**Why:** in Angular the flex item a parent row lays out is the `<arena-x>` host, not anything
inside it. With the root one level in, a `shrink-0` on it could not protect the host, and a tight
flex row compressed a component that React's equivalent could not compress.

**Consequence to know:** `<arena-x>` is an unknown element, whose UA default is `display: inline`.
Width and height do not apply to a non-replaced inline box, so **every manifest's `root` slot must
carry a display utility.** This shipped as a real bug once (a zero-area Skeleton) and is now
machine-guarded by a manifest-driven assertion in
`frameworks/angular/test/host-class-binding.test.ts`.

**Converges:** no. This is the correct Angular idiom.

### Animation CSS is compiled once for Angular, injected per component in React

**React:** each animated component injects a `<style>` tag once, guarded by a module-level
`let injected = false`, via `useEffect` and `document.head.appendChild`.
**Angular:** animations live in `frameworks/tailwind/animations.css` as `@utility` + `@keyframes`,
compiled into the committed `frameworks/tailwind/utilities.css`.

**Why:** the Angular layer already ships a compiled stylesheet, so a shared file is both cheaper
and statically checkable. `@utility` emits nothing when unused, so an animation costs nothing until
a component references it.

**Same in both:** the `prefers-reduced-motion` answer, which depends on what the motion means —
work-in-progress motion slows rather than stops, decorative motion stops outright, an entrance
keeps its fade and drops its travel, an opacity-only animation needs no clause.

**Converges:** no. Each layer uses its own idiom over the same token values.

### The Angular layer has no Button primitive

**React:** `Button.jsx` is a component, and `ConfirmDialog.jsx` renders `<Button>` for its footer.
**Angular:** there is no `arena-button`. Angular Material's `mat-button` fills that role, so a
component needing footer buttons styles them itself from its own manifest.

**Why:** the Angular layer is deliberately the set of primitives Material does not provide.

**Consequence to know:** a hand-rolled button must still carry the interaction affordances
`Button.manifest.json` defines — the gap, the transition, and the hover shadow — or it ships a
control with no feedback. This was missed once on `ConfirmDialog` and corrected.

**`ErrorState` names this directly:** React's `ErrorState.jsx` takes three props for its footer —
`onRetry`, `retryLabel` and `secondaryAction` — where `EmptyState.jsx` takes one (`action`, a
rendered node). Angular's `arena-error-state` collapses all three into the single projected
`[arena-action]` slot the same way `arena-empty-state` collapses its one, so a consumer wires the
retry button, its label, and any secondary action itself as projected content rather than through
component inputs.

**Converges:** no, by design.

---

## Per-component divergences

### ConfirmDialog — Angular is accessible, React is not yet

**React:** `role="alertdialog"` with no accessible name (no `aria-labelledby` pointing at the
title), `aria-modal="true"` asserted with no focus trap and no `inert` on the background, and
`outline-none` on the require-text input with no focus ring substituted.

**Angular:** the panel carries `aria-labelledby`, wired to the title when one is set and to the
eyebrow otherwise, so the dialog always has an accessible name even when a consumer omits
`title` — and `aria-describedby`, wired to the body. Both ids are unique per instance (a
module-level counter, not a hardcoded string), so two dialogs on one page never collide. Focus
moves into the panel's first focusable element on open and is restored to whatever held it
beforehand on close; Tab/Shift+Tab cycle within the panel instead of escaping to the page behind
it; Escape reports dismissal through the same `cancelled` output the Cancel button uses. The
require-text input keeps `outline-none` but substitutes a token-derived visible ring
(`focus-visible:ring-[length:var(--focus-width)] focus-visible:ring-error` in
`ConfirmDialog.manifest.json`) rather than removing focus indication outright. There is still no
`inert` on the background — the keyboard trap alone is what keeps focus from escaping, so a
pointer-driven assistive technology that does not go through Tab is not covered by this fix.

**Why:** a modal that cannot be operated from a keyboard and does not announce itself is not
shippable, and the `outline-none` contradicts README's own normative rule ("Focus: `--error`
ring"). Mirroring the gaps would have propagated them into a second layer.

**Tested how:** `frameworks/angular/test/confirm-dialog-focus-trap.test.ts` asserts the trap's
mechanics — `focusableElements`, `focusFirstFocusable`, `trapTabKey`, `handleOpenTransition` (all
exported from `confirm-dialog.ts`) — against a hand-built, real DOM tree under happy-dom: real
focus movement, real `document.activeElement`, a genuine open-then-close-then-restore sequence,
and a same-state re-run that must not steal focus back from a field the user is actively using.
This is deliberately *not* a TestBed render of `<arena-confirm-dialog open="true">`: probed by
hand first, both `[open]="true"` template binding and `componentRef.setInput('open', true)` throw
NG0303 under this repo's test toolchain, because the harness runs `@angular/compiler`'s JIT and
never `ngtsc` — the same root cause `host-class-binding.test.ts` documents for Skeleton's
`variant="text"`. Since `open` can never become `true` there, no TestBed-based test can render an
actually-open dialog; the trap logic was factored into plain DOM functions specifically so it
stays testable against a real DOM despite that.

**Converges:** yes — React should be brought up to this. **Open debt on the React layer**,
including the missing `inert`.

### ErrorState — Angular announces itself, React is silent

**React:** `ErrorState.jsx` sets no `role` at all — it renders as a plain `<div>`, so a screen
reader gives no indication that a failure just appeared unless the surrounding page happens to
move focus there.

**Angular:** `arena-error-state` host-binds `role="alert"`, an assertive live region announced
immediately on mount.

**Why:** an error surface can mount without a page reload — a failed fetch swapping a loading
state for `arena-error-state` in place — and a sighted user sees it instantly while a screen
reader user gets nothing unless the mount itself is announced. `role="alert"` is the correct,
narrow tool for exactly that: an unprompted, important status change. This is not the same
precedent as `Alert.ts`: React's own `Alert.jsx` already sets `role={tone === 'danger' ? 'alert'
: 'status'}`, and Angular's `Alert.ts` mirrors that exactly — no divergence there, so it is not
what motivates this one.

**Converges:** yes — React should be brought up to this. **Open debt on the React layer**, the
same shape as `ConfirmDialog`'s accessibility debt above.

### ConfirmDialog — no `width` prop in Angular

**React:** `ConfirmDialog.jsx` takes a `width` prop, defaulting to `calc(var(--sp-1) * 115)`.
**Angular:** the panel width is fixed at the same value (`w-115`), with no input to override it.

**Why:** the plan's brief omitted the prop. The fixed value is the same token derivation React
defaults to, so nothing renders differently until a consumer wants a different width.

**Converges:** yes, when a consumer needs it. Low priority.

---

## How to add an entry

When you find a behavioural difference between layers:

1. Decide which behaviour is correct on its merits — not by which layer is older. The token layer
   settles anything about values; nothing settles behaviour automatically.
2. If one layer is simply wrong, fix it and add no entry.
3. If both are defensible, or one leads and the other has debt, add an entry here with the reason
   and whether it is expected to converge.
