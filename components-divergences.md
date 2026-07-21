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

### Onboarding — the scrim is dismissible, and Angular always names the dialog

**React:** `Onboarding.jsx` renders the scrim and the panel as two sibling `<div>`s. The
scrim's `onClick={onSkip}` closes the tour; because the panel is a *sibling*, not a
descendant, a click inside the panel never reaches that handler. The panel's
`aria-label={step.title}` is empty whenever a step omits `title` — the dialog then has no
accessible name at all.

**Angular:** following `ConfirmDialog`'s resolution, `scrim` was renamed to `root` and
host-bound (`host: { '[class]': 'styles().root()' }`), with `open` driving it between the
overlay and `hidden`. Unlike `ConfirmDialog`, the panel is necessarily a *descendant* of
`root` here, not a sibling — Angular's host-binding shape gives every primitive exactly
one host element. So the host also host-binds `(click)="onScrimClick()"` to keep React's
click-to-skip behaviour, and the panel stops that click's propagation
(`(click)="$event.stopPropagation()"`) so a click on the panel — including its own Back /
Skip / Next buttons — never reaches the scrim's listener. The panel's `aria-label` falls
back through `title` → `eyebrow` → a generic `"Step N of M"`, so the dialog always has a
name. The fallback *logic* is the one `ConfirmDialog` established; the *mechanism* is not.
`ConfirmDialog` wires a per-instance unique id through `aria-labelledby`, because its name
comes from an element it renders. Onboarding sets `aria-label` to a computed string
directly, so there is no id involved and no uniqueness concern to check when two instances
are on one page.

**Why:** the click-to-skip behaviour is real product behaviour worth keeping, but the
sibling-div structure it was built on cannot survive the mandatory host-binding shape —
stopping propagation on the panel is what reproduces it under one shared ancestor. The
missing accessible name is the same category of gap `ConfirmDialog` and `ErrorState`
already fixed: a dialog with no name announces as unlabeled to a screen reader whenever a
step happens to omit `title`.

**Converges:** yes, on both — React should stop nesting the click assumption in sibling
placement (any refactor toward one wrapper needs the same stopPropagation), and should
gain the same `title`-falls-back-to-`eyebrow` label. **Open debt on the React layer.**

### Onboarding — no icon, on either layer

**React:** `Onboarding.jsx` renders no icon anywhere — no `<i className="ph-...">` in the
component, despite Duotone being licensed system-wide for "features and onboarding" per
README's iconography convention and `frameworks/angular/icons/icon-manifest.ts`'s
`{ role: 'onboarding', phosphor: 'ph-sparkle', weight: 'duotone' }` entry.

**Angular:** matches React exactly — no icon slot, no `icon` input. `icon-manifest.ts`'s
`onboarding` role is a registry seed for a consumer building their own icon usage, not
something any primitive in this layer currently consumes directly (no primitive imports
from `icon-manifest.ts`; `EmptyState`/`ErrorState` instead take a plain `icon: string`
input the consumer fills from wherever they like).

**Why:** the task brief's own sample manifest and template carry no icon either, matching
React. Adding one would have been a real feature addition with no brief authority and no
React precedent — YAGNI.

**Converges:** n/a — not a divergence between the layers, recorded here only because a
Duotone icon on the coachmark was flagged as worth double-checking. If a future revision
wants one, `ph-sparkle` duotone with the crimson accent on the primary layer is the
existing registry answer.

### ConfirmDialog — no `width` prop in Angular

**React:** `ConfirmDialog.jsx` takes a `width` prop, defaulting to `calc(var(--sp-1) * 115)`.
**Angular:** the panel width is fixed at the same value (`w-115`), with no input to override it.

**Why:** the plan's brief omitted the prop. The fixed value is the same token derivation React
defaults to, so nothing renders differently until a consumer wants a different width.

**Converges:** yes, when a consumer needs it. Low priority.

---

### BulkActionBar — a destructive action is bordered and hovers in `--danger-soft`, React only recolors the text

**React:** `BulkActionBar.jsx`'s destructive action changes only the text color
(`var(--danger)` vs `var(--bone-dim)`); the border stays the neutral
`var(--color-base-300)` for every action, destructive or not, and hover (driven by a
`mouseenter`/`mouseleave` pair) always sets the same neutral `var(--panel)` background,
never a danger tint.

**Angular:** `arena-bulk-action-bar`'s destructive action borders in `--error`
(`border-error`) alongside the text, and its hover is the soft danger tint
(`hover:bg-error/14`, `var(--danger-soft)`) rather than the neutral raise the
non-destructive actions get.

**Why:** README's own danger convention is explicit and names this exact shape —
"Applies to every risk trigger or indicator: buttons..., icon buttons..., menu items...
and equivalents in lists, cards and toolbars. Hover: lightens with `--danger-soft`."
`Menu.jsx`'s own destructive item already does this correctly (danger text plus a
`--danger-soft` hover), so React's `BulkActionBar` is inconsistent with both the
system's normative rule and its own `Menu` sibling — this reads as a bug in
`BulkActionBar.jsx`, not a considered simplification, and mirroring it would have
shipped the same gap into a second layer.

**Converges:** yes — React's `BulkActionBar.jsx` should gain the border and the
`--danger-soft` hover to match `Menu.jsx` and the README. **Open debt on the React
layer.**

### BulkActionBar — Clear is unconditional in Angular, optional in React

**React:** `BulkActionBar.jsx` renders the Clear control only when an `onClear`
callback is passed (`{onClear && (...)}`); a consumer that omits it gets a bar with no
way to deselect.

**Angular:** `arena-bulk-action-bar` always renders Clear, wired to the `cleared`
output. There is no input that hides it.

**Why:** the task brief's own `.prompt.md` states this as a deliberate Do ("Always
offer Clear. A selection the user cannot see the edges of is a selection they will act
on by accident"), and Angular's output model does not have a React-style "callback
provided or not" signal to gate on — every `output()` exists on the component
regardless of whether a consumer subscribes, so conditioning the button's presence on
subscription is not idiomatic here the way an optional prop is in React. Treated as an
intentional simplification rather than a narrowing to flag.

**Converges:** no — Angular's shape is preferred; React should stop treating Clear as
optional. **Open debt on the React layer**, low priority.

### CommandPalette — Angular is an accessible combobox, React sets no roles at all

**React:** `CommandPalette.jsx` renders `role="dialog" aria-modal="true"` on the panel
and nothing else — the search `<input>` carries no `role`, no `aria-expanded`, no
`aria-controls` and no `aria-activedescendant`, and each row is a plain `<button>` with
no `role="option"` and no `aria-selected`. A screen reader user gets no indication that
the input drives a filtered list, or which row is currently active as arrow keys move
through it. It does, however, focus its input explicitly on open
(`setTimeout(() => inputRef.current.focus(), 0)`), and it does not restore focus to
whatever opened it once it closes.

**Angular:** `arena-command-palette` implements the ARIA 1.2 editable-combobox-with-
listbox-popup pattern: the input carries `role="combobox"`, `aria-autocomplete="list"`,
`aria-haspopup="listbox"`, `aria-expanded="true"` and `aria-controls` pointing at the
row list's id; the row list itself carries `role="listbox"`; and `aria-activedescendant`
on the input tracks the active row's id, computed from a per-instance unique id
(a module-level counter, matching `arena-confirm-dialog`'s `nextId` shape, so two
palettes on one page never collide). Each row carries `role="option"`, `aria-selected`
and `tabindex="-1"`. The "No results" message is a sibling of the listbox, not a child
of it — a listbox's children must be `option`/`group`, and a bare `div` inside one is
undefined content. `aria-expanded` stays statically `true`: the popup is mounted and
visible for as long as the combobox itself is open, including with zero matching rows,
so there is no collapsed state for it to report.

DOM focus is moved into the search input explicitly on open, and restored to whatever
held it beforehand on close, reusing `arena-confirm-dialog`'s own focus contract —
`handleOpenTransition` and `trapTabKey`, generalized out of `confirm-dialog.ts` into
`frameworks/angular/primitives/focus-trap.ts` so this component did not need a second
implementation. Every row stays `tabindex="-1"`, so the search input is the panel's
only legal Tab stop; Tab and Shift+Tab are trapped there — with exactly one focusable
element the trap simply re-focuses it and consumes the key — so focus can never escape
past the palette to the page behind the scrim.

*Corrects an earlier version of this entry*, which claimed that because DOM focus never
leaves the input, "there is no separate focus trap to build." That reasoning does not
follow: a focus trap stops focus escaping *outward*, not just cycling inward, and with
every row `tabindex="-1"` and no `keydown` branch for Tab, the browser's own default
handling would have moved focus to whatever came next in document order — a control on
the page behind the `fixed inset-0` scrim, while the palette stayed open and still
asserted `aria-modal="true"`. The trap above closes that gap; this entry now describes
what the component actually does.

**Also unlike React:** the earlier `autofocus` attribute this component shipped with
never reliably worked. Per the HTML autofocus processing model, an `autofocus` element
inserted after the document's autofocus-processed flag is set is skipped — and that
flag is set by any user interaction, so a palette opened by Cmd/Ctrl+K (itself a user
interaction) had the flag already set by the time `@if (open())` inserted the input.
DOM focus stayed wherever the page had it, every keydown handler was bound to the
input, and the palette was mouse-only. The explicit `handleOpenTransition` wiring above
replaced it. Angular also gains a capability React never had: focus is restored to
whatever opened the palette once it closes, which React's `CommandPalette.jsx` does not
do.

**The search input keeps `outline-none` with no substituted focus ring**, unlike
`ConfirmDialog.manifest.json`'s require-text input, which was corrected to add one (see
above). The case differs: the search input is the palette's *only* focusable element,
and the new focus contract guarantees it holds DOM focus for the entire time the
palette is open — a ring's usual job, disambiguating which of several controls is
focused, has no ambiguity to resolve here. The input is also a flush, borderless
segment of one compound single-row control (icon, input, `ESC` badge) laid out with
only a `gap-2.5` between them inside a panel that itself clips overflow
(`overflow-hidden`); a ring drawn tight to just the input would crowd its neighbors and
risks being clipped at the panel edge, neither of which `ConfirmDialog`'s stand-alone,
block-level bordered input has to contend with. Left as `outline-none` on purpose, not
by omission.

**Why:** the same category of gap `ConfirmDialog`, `ErrorState` and `Onboarding`
already closed — an interactive, keyboard-driven list with no roles and no active-item
announcement is not usable with a screen reader, and mirroring the gap would have
shipped it into a second layer. This is also the task brief's own explicit ask: "A
combobox/listbox pattern wants role, aria-activedescendant or managed focus, and an
accessible name." The focus-management gap (bare `autofocus`, no Tab trap) was caught
in review as the second occurrence of the exact trap `ConfirmDialog` hit first.

**Tested how:** `frameworks/angular/test/command-palette-focus-trap.test.ts` exercises
the shared `handleOpenTransition`/`trapTabKey` helpers against a hand-built DOM tree
shaped like the palette's panel (one real `<input>`, several `tabindex="-1"` row
buttons) — real focus movement, real `document.activeElement`, and a Tab that must not
reach a control placed behind the scrim. It does not render `<arena-command-palette>`
through TestBed, for the reason `command-palette-keyboard.test.ts` already documents
(`open` can never become `true` under this repo's JIT-only harness), so it is not proof
that the component's own `afterRenderEffect`/`onKey` wiring calls these functions at
the right time — `ngc --strictTemplates` (`check:angular`) is what proves that wiring
compiles against the component's real `viewChild`/`inject(DOCUMENT)` types.
`activeOptionId`, the function `aria-activedescendant` is computed from, is asserted
directly in `command-palette-keyboard.test.ts`: it always resolves to a real row's id,
and is `undefined` rather than dangling when the filtered list is empty or the active
index is out of range.

**Converges:** yes — React should gain the same roles, `aria-activedescendant` wiring,
Tab trap and focus restore-on-close. **Open debt on the React layer.**

### CommandPalette — running a command does not close the palette in Angular

**React:** `CommandPalette.jsx`'s internal `run(c)` helper calls `onClose()`
unconditionally before invoking the command, for both a row click and Enter — so
running a command always closes the palette, even when the host's own `onClose`
forgets to, and even when Enter is pressed with an empty filtered list.

**Angular:** `run.emit(command)` reports the command alone; nothing in the component
closes it. The host is expected to react the same way it already does to
`arena-confirm-dialog`'s `confirmed`/`cancelled` and `arena-onboarding`'s
`skip`/`done` — by setting `open` to `false` itself, as `command-palette.prompt.md`'s
own example shows: `(run)="paletteOpen.set(false); dispatch($event)"`.

**Why:** every other controlled Angular primitive in this layer already puts the
`open`-mutating decision on the host, since `open` is an input the component itself
never owns or writes. Auto-closing here would have been the one primitive in the layer
that manages its own visibility, inconsistent with its siblings for no stated reason.
Not treated as a defect in either layer — a considered idiom difference, not a bug —
but recorded because it is a real behavioural gap a consumer could get wrong: a `run`
handler that forgets to close the palette leaves it open after running.

**Converges:** no — this is the correct Angular idiom, matching `ConfirmDialog` and
`Onboarding`. Low priority for React, since React's self-closing behaviour is also
defensible on its own.

## How to add an entry

When you find a behavioural difference between layers:

1. Decide which behaviour is correct on its merits — not by which layer is older. The token layer
   settles anything about values; nothing settles behaviour automatically.
2. If one layer is simply wrong, fix it and add no entry.
3. If both are defensible, or one leads and the other has debt, add an entry here with the reason
   and whether it is expected to converge.
