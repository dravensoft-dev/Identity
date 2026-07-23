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

**The "no absolute authority" claim above is superseded.** `behaviour/patterns/*.json` now
settles the authority question this file leaves open: the pattern is the authority, and a
component's gap against it is a defect or a declared exception, not a symmetric difference
between equally-valid layers. The per-component entries below predate that layer and are
pending migration into `.behaviour.json` bindings — a citation of this file from a binding is
pointing at a divergence still awaiting that migration, not evidence that the old policy
still holds.

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

**Consequence to know:** React's `style` prop and `{...rest}` spread have **no Angular
counterpart, and need none — in every host-bound primitive.** A consumer writes
`style="…"` or any other attribute directly on `<arena-x>`, which is the same element the
recipe's `root` classes are bound to, and Angular composes a static attribute with a
`[class]` binding rather than clobbering it. This is stated once, here, rather than
repeated per component: it follows from host-binding and therefore holds for every
primitive that host-binds, including ones added after this note. `PageHead` and
`UnauthCard` carry their own entries below only because each records something further;
neither is the source of this rule, and a new host-bound primitive owes no entry for it.

**The sharp edge, and it is layer-wide:** Angular writes a *static* attribute to the DOM
during the creation pass whether or not it also matches an input. So an input named after
a native attribute leaves the native attribute behind — `<arena-page-head title="X">`
puts a real `title` on the host and the browser draws a tooltip over the whole header.
Binding the input (`[title]="…"`) avoids it. React does not have the problem because it
destructures the prop out before spreading `...rest`.

**Nine primitives are affected, not the five an earlier version of this entry listed** —
every host-bound primitive taking a `title` or `name` input:

- `title`: `alert`, `chart-card`, `confirm-dialog`, `empty-state`, `error-state`,
  `page-head`, `unauth-card` — seven.
- `name`: `app-logo`, `avatar` — two.

`confirm-dialog` is the worst of them by a distance, and the reason the count is worth
getting right: its host is the fixed full-viewport scrim, so
`<arena-confirm-dialog title="Delete?">` paints a browser tooltip over the **entire
viewport** for as long as the dialog is open, not over a header.

A host binding of `'[attr.title]': 'null'` (and `'[attr.name]': 'null'`) would close it,
and must then be applied to all nine at once rather than one primitive at a time — a fix
that lands on five and is believed to have closed the problem leaves four primitives,
including the viewport-wide one, still broken. **Not yet done.**

**Converges:** no. This is the correct Angular idiom. The stray-attribute edge above is a
defect within it and is expected to converge once fixed layer-wide.

### The two carve-outs: a root that must be a specific element is not host-bound

`theme-toggle`'s root must be a real `<button>` for keyboard operability, focus and
implicit semantics; `activity-feed`'s must be a real `<ul>` with `<li>` rows, or a screen
reader stops announcing a list. `<arena-x>` is a custom element and cannot be made
either by binding classes to it.

**The rule, stated generally:** host-binding targets elements that exist *only* to carry
styling. When the root must be a specific semantic or interactive element, keep that
element and do not host-bind. Both carve-outs keep their own entries below with the
component-specific detail; this is the rule they are instances of. The display-utility
guard still applies and still passes for both.

**Converges:** no.

### The Tailwind layer is border-box; React is content-box

**The Tailwind layer** — `frameworks/tailwind/`'s compiled `utilities.css`, consumed
directly by every `*.card.html` specimen and, through `theme/arena-tailwind.css`'s
preset import, by a real Tailwind-based Angular consumer app too — carries Tailwind
v4's own preflight (`frameworks/tailwind/utilities.css:112`, `@layer base`): `*, ::after,
::before, ::backdrop, ::file-selector-button { box-sizing: border-box; … }`.

**React** sets no such rule anywhere in `tokens/` or `styles.css`, so every React
component is `content-box` — the CSS default — unless it opts in itself. Only four do:
`Input.jsx`, `Button.jsx`, `Spinner.jsx` and `ConfirmDialog.jsx` each set `boxSizing:
'border-box'` locally; every other component, including every other form control, is
content-box.

**What this means numerically:** a slot that combines an explicit size with a border, or
an explicit size with padding, renders a box that is **smaller in the Tailwind layer by
twice that border's or that padding's width** than the content-box React renders at the
same nominal size utility — the size utility sets the same number either way, but
content-box adds the border/padding *outside* it while border-box draws it *inside* it.
Padding is not a special case of border here; it is the same subtraction, because
border-box's whole rule is "the declared size is the outer edge, and everything between
that edge and the content — border and padding alike — is carved out of it, not added
past it." Verified against the current sources:

| Slot | React (content-box) | Tailwind (border-box) |
|---|---|---|
| `Checkbox`'s `box` | 22×22 (`size-5`=20 content + 2×`--bw`=2) | 20×20 (`size-5`, border included) |
| `Radio`'s `ring` | 22×22 (same derivation) | 20×20 (`size-5`, border included) |
| `Select`'s `field` height | 42px (`--dz-ctl-h`=40 + 2×`--bw`) | 40px (`h-ctl-h`, border included) |
| `Switch`'s `track` | 44×26 outer, 40×22 content (`w-10 h-5.5`=40×22 content + 2×`p-0.5`=2 each side; no border) | 40×22 outer, 36×18 content (`w-10 h-5.5 p-0.5`, padding included) |
| `Toast`'s `root` | 375px outer (`w-85`=340 content + 2×`px-4`=32 + `--bw`=1 right + `--bw-strong`=2 left) | 340px outer (`w-85`, border and padding included) |
| `Pagination`'s `nav`/`page` | 52×36 outer (`h-8.5 min-w-8.5`=34 content each axis + 2×`px-2`=16 each side on width + 2×`--bw`=2 each axis) | 34×34 outer (`h-8.5 min-w-8.5`, border and padding included) |
| `Spinner`'s `circle` | **agrees** — 14×14, 20×20, 32×32 outer at sm/md/lg | same, 14×14 / 20×20 / 32×32 |
| `Menu`'s `panel` | 214px min outer (`--sp-1`×50=200 min content + 2×`--sp-1`×1.5=12 padding + 2×`--bw`=2) | 200px (`min-w-50 p-1.5 border`, both included) |
| `Button`'s `root` | 42px tall at `md` (`--dz-ctl-h`=40 + 2×`--bw`) | 40px (`h-ctl-h`, border included) |
| `IconButton`'s `root`, ghost only | 34/42/50 at sm/md/lg (size + 2×`--bw`) | 32/40/48 (border included) |
| `Dialog`'s `panel` | 482px (`--sp-1`×120=480 + 2×`--bw`) | 480px (`w-120`, border included) |
| `SegmentedControl`'s `segment` | **agrees** — 28/34 tall at sm/md | same; the height axis carries no padding and the width is auto |

`Switch` carries no border at all — `p-0.5` alone is enough to reproduce the same
divergence, which is why the rule above is stated for padding and not just border. The
same subtraction cascades into the thumb: React's content-box track has 2px slack left
over inside its content box after centring the 18px thumb vertically (22px content −
18px thumb), on top of the 2px padding, for a 4px inset from the track's outer edge;
Tailwind's border-box content box is exactly 18px tall — no slack — so its inset is the
2px padding alone.

`Toast`'s `root` is the largest divergence in the layer so far by a distance: React's
content-box outer width is `w-85` (340px content) plus both horizontal paddings
(`px-4` = 16px a side = 32px) plus its two mismatched border widths (`--bw` = 1px on the
right and top/bottom, `--bw-strong` = 2px on the left) = 375px, against Tailwind's 340px
border-box outer — a 35px, ~9–10% divergence. It is not a `size-*`-style square target,
but the rule draws no such exception: an explicit size combined with border or padding
diverges either way, and `Toast` combines it with both.

`Pagination`'s `nav` (the prev/next arrows) and `page` (a single-digit page number) repeat
the same shape at a smaller scale, and on two axes at once because the slot pairs a fixed
height with a `min-width`, each carrying its own padding and border. React's content-box
outer is 52×36: `h-8.5`/`min-w-8.5` (34px content on both axes) plus `px-2` (8px a side,
16px total, added to width only) plus the `--bw` border (1px a side, 2px total, added to
both axes) — width 34 + 16 + 2 = 52, height 34 + 0 + 2 = 36 (there is no vertical
padding). Tailwind's border-box renders both utilities at their nominal 34px outer on both
axes, since border and padding are carved out of the declared size rather than added past
it — 34×34, not 36×36 (36×36 double-counts the border on an outer number that already
includes it, and drops `px-2` entirely).

Four **elements** — not four components — agree, and only because their React source opts
into `border-box` at that element: `Input.jsx:58`'s field, `Button.jsx:85`'s spinner span,
`ConfirmDialog.jsx`'s require-text input and `Spinner.jsx:49-51`'s circle all set
`boxSizing: 'border-box'`. The distinction matters and was got wrong here once: **the opt-in
is per-element, so `Button`'s spinner agreeing tells you nothing about `Button`'s root**,
which sets no `boxSizing` and diverges by 2px — it has its own row in the table above.
`Spinner` is the cleanest
demonstration that the agreement is the opt-in and not luck: its `circle` slot combines
an explicit size with a `--bw-strong` border — P3's trigger exactly — and still measures
14×14, 20×20 and 32×32 in both layers at sm/md/lg, because React declared the same box
model the preflight declares. Each manifest's matching slot —
`Input.manifest.json`'s `field`, `Button.manifest.json`'s `spinner`,
`ConfirmDialog.manifest.json`'s `input` — carried a (but, under preflight, redundant)
`box-border` class; `Input`'s was removed in the change that added this entry, `Button`'s
and `ConfirmDialog`'s in the close-out that followed, since every slot in this layer is
already border-box without it.

**Why:** Tailwind v4's own default is border-box, and it is the more common contemporary
assumption; the divergence is best read as a pre-existing gap in React's four opted-in
components rather than something for the Tailwind layer to correct by matching
content-box. Fixing it by widening a Tailwind size utility per affected slot would just
be the `+2px` compensation the layer's own README now warns against adding.

**Converges:** not from this side. **Open item on the React layer**, low priority — React
could set `box-sizing: border-box` globally (matching every other modern CSS reset,
including Tailwind's own) rather than per-component, which would also make its four
existing opt-ins redundant the same way `Input`'s Tailwind `box-border` just was. Doing so
is out of scope here: this change touches no file under `frameworks/react/`.

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

### ThemeToggle is the one Angular primitive that does not host-bind its root

**Every other Angular primitive:** the recipe's `root` slot is bound onto the host —
`host: { '[class]': 'styles().root()' }` — and no wrapper element is rendered.

**`arena-theme-toggle`:** keeps the host a bare, unstyled `<arena-theme-toggle>` and
renders a real `<button>` inside it that carries `styles().root()`.

**Why:** ThemeToggle is the layer's first (and, through Task 27, only) primitive whose
root is a native interactive control. A `<button>` is required for keyboard operability,
focus and implicit ARIA semantics that `<arena-theme-toggle>` — an unknown custom
element — cannot acquire just by having classes bound to it. The host-bind rule exists to
eliminate elements that exist ONLY to carry styling; a real `<button>` is not one of
those, so the rule's own reason does not apply here. This also preserves the public API
the plan and `theme-toggle.prompt.md` document: `<arena-theme-toggle />` with no wrapper
markup a consumer needs to know about.

**Consequence to know:** unlike every other primitive, a consumer attribute written
directly on `<arena-theme-toggle>` (a static `class=""`, an ARIA attribute) lands on the
inert host, not on the styled, interactive `<button>` inside it — there is no host
binding for it to compose with. No primitive in this layer currently needs that
passthrough (ThemeToggle takes no inputs), so this is recorded as a known shape rather
than a gap to close.

**Converges:** no. This is the correct shape for a primitive whose root is a real
interactive control, and it is expected to stay the layer's one exception.

### ThemeToggle — Angular reads a signal, React observes the DOM

**React:** `ThemeToggle.jsx` owns no theme state either, but the truth it reads is the
`arena-light` class on `<html>`, and it reads that back through a `MutationObserver`
(`useEffect` + `mo.observe(document.documentElement, { attributes: true, attributeFilter:
['class'] })`), because `theme.js` is an IIFE with no exports and `window.__toggleTheme`
is the only handle it offers.

**Angular:** `arena-theme-toggle` injects the layer's own `ThemeService` and reads its
`theme` signal directly (`computed(() => this.themeService.theme() === 'dark')`) — no
DOM observation at all. Clicking calls `ThemeService.toggle()`, whose own `effect()` is
what writes the `arena-light` class back onto `<html>`.

**Why:** a signal is read, not observed. The Angular layer already has an equivalent to
React's DOM-truth-plus-observer pair that does not need a `MutationObserver` at all, so
using it is the better answer to the same problem, not a narrowing of it.

**Also not ported:** React's `label` prop (a function `(dark) => string` letting a
consumer override the accessible name/title) and its `{...rest}` spread (forwarded onto
the underlying `<button>`, via `IconButton`). The brief's Interfaces line states
`ThemeToggle` takes no inputs, and neither omission was given a reason in the brief. This
is recorded per the standing rule ("say so rather than silently narrow, don't cite
YAGNI") rather than implemented, since the previous entry above already means a consumer
cannot reach the inner `<button>` from the host anyway — adding a `label` input without
the attribute passthrough `...rest` gave React would still leave a real gap. A future
task can add `label` as a signal input if a consumer needs a customized name; there is no
`--rest`-shaped equivalent to add in Angular's signal-input model (see PageHead's own
entry above for the same conclusion about `style`/`{...rest}`).

**Converges:** no on the MutationObserver-vs-signal shape (Angular's is strictly better).
The `label` customization gap is low-priority open debt, on the Angular layer this time.

### ActivityFeed is the second Angular primitive that does not host-bind its root

**Every other Angular primitive except `arena-theme-toggle`:** the recipe's `root` slot is
bound onto the host — `host: { '[class]': 'styles().root()' }` — and no wrapper element is
rendered.

**`arena-activity-feed`:** keeps the host a bare, unstyled `<arena-activity-feed>` and
renders a real `<ul [class]="base().root()">` inside it, with each row a real `<li>`.

**Why:** this is the same rule `ThemeToggle`'s entry above establishes, hit a second time
rather than reopened — "when the root must be a specific semantic element, keep it and do
not host-bind." An `<li>` must be a child of a list element (`<ul>`, `<ol>` or `<menu>`);
host-binding `root` here would make `<arena-activity-feed>` itself the list and promote its
rows to children of an element that is not one, silently destroying the list semantics a
screen reader announces (item count, position-in-set) with no ARIA role added to
compensate — and none is needed, since the native `<ul>`/`<li>` pair already carries it.
`ThemeToggle`'s case is a native interactive control that a custom element cannot become;
this one is a native list structure a custom element cannot become either. Same rule, two
instances.

**Consequence to know:** as with `ThemeToggle`, a consumer attribute written directly on
`<arena-activity-feed>` (a static `class=""`, an ARIA attribute) lands on the inert host,
not on the styled `<ul>` inside it. `host-class-binding.test.ts`'s manifest-driven display-
utility guard still covers this component (it reads every primitive's `slots.root` string
regardless of whether the component host-binds it), and `ActivityFeed.manifest.json`'s
`root` slot (`"flex flex-col list-none m-0 p-0"`) still carries `flex`, so the guard is not
weakened by this carve-out — it was never conditioned on host-binding in the first place.

**Also not ported:** React's `style` prop and `{...rest}` spread. Unlike `PageHead`/
`AppLogo`/`DoughnutChart`, where a consumer's static attribute on the host reaches the
styled root because the host *is* the root, that path does not exist here — see the
consequence above. There is nothing more to route them to without reopening the
no-host-bind decision itself.

**Converges:** no. This is the correct shape for a primitive whose root must be a real list
element, the same way `ThemeToggle`'s is for a primitive whose root must be a real button.

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

### Onboarding — Angular's modal is a real modal, React's is an assertion

**React:** `Onboarding.jsx:50` renders `role="dialog" aria-modal="true"` on the panel and
manages no focus whatsoever — nothing moves focus into the panel when the tour opens,
nothing restores it when the tour closes, Tab and Shift+Tab walk straight out of the panel
into the page behind the scrim, and Escape does nothing. A keyboard user therefore has to
tab the whole page to reach "Next", while `aria-modal="true"` has already told assistive
technology that the page they are tabbing through is unavailable.

**Angular:** `arena-onboarding` implements the contract it asserts. Focus moves into the
panel's first focusable control on open — Back on a middle step, Skip on the first, since
`@if (index() > 0)` omits Back there — and is restored to whatever held it beforehand on
close. Tab and Shift+Tab cycle within the panel: Tab from Next wraps to the first control
rather than reaching anything behind the `fixed inset-0` scrim. Escape reports dismissal
through the existing `skip` output — the same one the scrim click and the Skip button
already use — rather than introducing a second close path a host would have to wire
separately; Escape is how a user leaves a tour, not how they finish it, so it reports
`skip` even on the last step, where the Skip button itself is not rendered. The panel
carries `tabindex="-1"` so the trap has a fallback focus target, though the template
always renders at least the Next button, so the fallback is never reached in practice.

None of this is a fourth implementation: it reuses
`frameworks/angular/primitives/focus-trap.ts` (`handleOpenTransition`, `trapTabKey`)
unchanged, the module `arena-confirm-dialog`'s fix wave produced and
`arena-command-palette` already shares. The transition is driven off `visible()`, not
`open()` — an `open` tour with an empty `steps` array renders no panel, so there is
nothing to focus into.

**Why:** this is the third occurrence on this branch of one defect —
`aria-modal="true"` asserted over a free-roaming focus — after `ConfirmDialog` and
`CommandPalette`. The ruling that settled the first two applies unchanged: a trap stops
focus escaping *outward*, so `tabindex="-1"` on the contents is not a trap, and a modal
that a keyboard user cannot reach or leave is not shippable. Onboarding predates the
shared helper, which is why it was missed rather than decided. Mirroring React here
would have propagated the same gap into a second layer for the third time.

**Tested how:** `frameworks/angular/test/onboarding-focus-trap.test.ts` exercises the
shared helpers against a hand-built DOM tree shaped like Onboarding's panel (the
non-focusable dots div, then Back / Skip / Next), with a real focusable control appended
to the page behind the scrim that the trap must never hand focus to — real focus
movement, real `document.activeElement`, a genuine open-then-close-then-restore sequence,
a first-step panel with no Back, and a same-state re-run standing in for advancing a step,
which must not yank focus back to Back. It does **not** render `<arena-onboarding>`
through TestBed, for the reason `confirm-dialog-focus-trap.test.ts` documents: under this
repo's JIT-only harness `open` can never become `true`, so `@if (visible())` can never
render the panel. **What that leaves unproven is that the component's own
`afterRenderEffect` and `onKeydown` invoke these functions at the right moment** — the
helpers themselves are proven, the wiring is proven only to the extent that
`ngc --strictTemplates` (`bun run check:angular`) typechecks it against the real
`viewChild` and `inject(DOCUMENT)` types. The same limit already applies to
`ConfirmDialog` and `CommandPalette`.

**Also still missing, on both layers:** `inert` on the background. The keyboard trap is
what keeps focus in; a pointer-driven assistive technology that never goes through Tab is
not covered — identical to the caveat `ConfirmDialog`'s entry records.

**Converges:** yes — React should gain focus-in on open, restore on close, a Tab trap and
Escape-to-skip. **Open debt on the React layer**, the same shape as `ConfirmDialog`'s,
`ErrorState`'s and `CommandPalette`'s.

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

### PageHead — behaviour matches React; only the `style`/`...rest` prop has no counterpart

**React:** `PageHead.jsx` takes `title`, `subtitle`, `actions`, plus `style` and a
`{...rest}` spread, and gates the actions wrapper on `{actions && ...}`.

**Angular:** `arena-page-head` takes `title` and `subtitle` as signal inputs and projects
`[arena-actions]`, gating that wrapper on `contentChild(ArenaActions)` — the same gate,
reached the only way an `ng-content` slot can report whether anything was projected. The
responsive branch is identical in substance: both measure the component's own box, both
compare against `--bp-sm` read off the document root, and both render the wide layout
while the width is still `null` so the narrow branch never flashes. React's `style` and
`{...rest}` have no input to mirror them, and need none: in Angular a consumer writes
`style="..."` or any attribute directly on `<arena-page-head>`, which is the host — the
same element the recipe's `root` classes are bound to, and Angular composes a static
attribute with a `[class]` binding rather than clobbering it.

**Worth knowing:** the measurement helper is shared, not private to this component.
`frameworks/angular/primitives/container-size.ts` exports `containerWidth()` and
`readBreakpoint()`, mirroring React's `use-container-width.js` without the `use` prefix —
a signal-returning function is not a React hook. It is exported from the primitives
barrel deliberately, so a consumer writing their own responsive component reaches for
Arena's measurement rather than a media query. One deliberate difference from React's
version: `readBreakpoint()` injects `DOCUMENT` **before** consulting its cache, not
after, so the "call from an injection context" contract holds on every call instead of
only the first one for a given name. React's copy has no equivalent hazard — it reads
the global `document` directly and has no injection contract to keep consistent.

**Converges:** n/a — no behavioural divergence found. Recorded because this is the first
primitive whose host classes depend on a runtime measurement, and the next five (the
chart primitives) inherit the helper unchanged.

### chart-internals — the visually-hidden style carries its units in Angular

**React:** `chart-internals.js` exports `srOnly`, a style object with bare numbers —
`{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, ... }`. React's DOM
layer appends `px` to a unitless number on a length property, so `width: 1` renders `1px`.

**Angular:** `chart-internals.ts` exports the same object as `SR_ONLY`, with every length
spelled out — `width: '1px'`, `height: '1px'`, `margin: '-1px'`. Angular's `[style]`
binding appends nothing: it stringifies the value and hands it to `setProperty`, so a
bare `1` is an invalid length and is dropped silently, leaving the table visible on the
page. The rendered result is identical; only the idiom differs. The name is
`SCREAMING_CASE` to match the file's other module constants (`CAT_SLOTS`, `CHART_HEIGHT`,
`PAD`), and it stays an **object** rather than the CSS string the task brief proposed, so
an Angular chart can bind it with `[style]="SR_ONLY"` and compose with other bindings
rather than clobbering them.

**Worth knowing:** the 1px box and the -1px that cancels it are the only dimension
literals in the Angular layer that are not tokens, and they are named in
`check-dimension-literals.mjs`'s `EXEMPT` with their reason: they are constraints of the
accessibility idiom — the smallest rendered area that keeps the element in the
accessibility tree while `clip: rect(0 0 0 0)` hides it — not values on Arena's scale.
React's copy is exempt from nothing because the gate never scans `.js` files at all;
the `.ts` port is scanned, so the exemption is explicit rather than accidental.

**Converges:** no. Each layer uses its own framework's style-binding idiom, and neither
is wrong. Recorded because the five chart primitives all consume `SR_ONLY` unchanged.

### BarChart — the category axis is drawn per bar, not per label

**React:** `BarChart.jsx` draws the value axis, the bars and the tooltip from `values`, but the
category axis from `labels` — `{labels.map((l, i) => <text x={PAD.l + i * step + step / 2} ...>)}`.
With more labels than values that renders a label under empty space, positioned by a `step`
computed from a different array's length; with fewer, the surplus bars go unlabelled either way.

**Angular:** `arena-bar-chart` draws the category axis from the same `bars()` collection the marks
come from, taking each bar's label as `labels()[index] ?? ''`. A label with no bar is dropped; a
bar with no label renders an empty string.

**Why:** the two arrays are one dataset, and the bar is the thing being labelled. Drawing a label
at a column position that no column occupies is not a considered behaviour — it is what falls out
of iterating the wrong array, and it puts text under blank plot. Identical output whenever the
arrays are the same length, which is every correct call. `bar-chart.prompt.md` states the rule
under Don't.

**Converges:** yes — React should iterate its bars. **Open debt on the React layer**, low priority
(it only shows on mismatched input).

### BarChart — the charts are the layer's styling exception, and they state it in objects

**React:** `BarChart.jsx` writes every style as a JSX inline style object — `style={{ strokeWidth:
'var(--bw)' }}`, `style={{ fontSize: 'var(--dz-text-2xs)' }}` — with camelCase keys.

**Angular:** the same values live in module-level constants bound with `[style]`
(`LINE_STYLE`, `TICK_LABEL_STYLE`, `CATEGORY_LABEL_STYLE`, `BAR_STYLE`, `TOOLTIP_STYLE` and the
two tooltip text styles), rather than as `style="stroke-width:var(--bw)"` strings in the template.

**Why:** it is what keeps the values checkable. `check-dimension-literals.mjs` locates a governed
property by an unbroken run of letters before a colon, so a kebab-case declaration inside a
template string is either invisible to it (`font-size:` reads as a property named `size`, which is
not governed) or actively misread — `stroke-width:` matches as `width`, whose lookbehind excludes
`\w` and `.` but not `-`, and the value scan then runs off into the rest of the template and
reports a garbled literal. The first draft of this component hit exactly that, twice. A camelCase
object gives the gate the same view of the Angular chart that it already has of React's, so
`strokeWidth` and `fontSize` are judged as themselves. **The two remaining chart slices should
follow this shape**, and the same trap is waiting for any future template that writes a hyphenated
governed property inline.

**Also worth knowing:** the host declares `display:block;position:relative` in its own `host`
metadata. It is the box `containerWidth()` observes and the containing block the tooltip is
positioned against, and `<arena-bar-chart>` is an unknown element whose UA default is
`display:inline` — the same hazard every manifest's `root` slot carries a display utility for. A
chart has no manifest, so it states the display itself; `host-class-binding.test.ts` names the
chart primitives in `NO_MANIFEST` and asserts the rendered host's `display` and `position` against
a real DOM instead of against a manifest string.

**One gate blind spot, recorded rather than papered over:** the tooltip's
`[style.top]="'calc(' + point.y + 'px - var(--sp-2))'"` is the same data-to-pixel projection React
carries a named `EXEMPT` entry for. Angular's binding syntax puts it outside all four of the gate's
scanners, so it needs no exemption — but it is unexempted because it is unseen, not because it is
tokenized. `check:dimensions` is clean on this component for real reasons everywhere else.

**Not ported:** React's `style` prop and `{...rest}` spread, for the reason PageHead's entry above
already gives — in Angular a consumer writes those directly on the host.

**Converges:** no on the idiom; each layer states the same token values in its own form.

### LineChart — the crosshair measures against the SVG, not against the overlay rect

**React:** `LineChart.jsx`'s `onMove` reads `e.currentTarget.getBoundingClientRect()`. `currentTarget`
is the transparent overlay `<rect x={PAD.l} y={PAD.t} ...>`, whose own left edge is the SVG's left
edge plus `PAD.l`. The pointer position it derives is therefore `PAD.l` (44px) short of the
coordinate space `xOf(i)` returns, since `xOf` starts at `PAD.l`. The nearest-point search then
compares two different origins and snaps the crosshair up to a whole left pad early.

**Angular:** `arena-line-chart` measures against `ownerSVGElement.getBoundingClientRect()`, so the
pointer position and `point.x` share the SVG's own origin.

**Why:** it is a straight bug, not a design choice — the two numbers being compared have to be in
one coordinate space, and only the SVG's box gives that. Mirroring it into a second layer was
explicitly out of the question. The nearest-point search itself is extracted as
`nearestPointIndex()` and pinned in `line-chart-geometry.test.ts`; the coordinate origin it is fed
is the part that cannot be unit-tested here, because it needs a real layout box.

**Converges:** yes — React should measure the SVG. **Open debt on the React layer**, and unlike the
label-axis entry above this one is visible on every correct call, not only on mismatched input.

### LineChart — the point axis is drawn per point, not per label

**React:** `LineChart.jsx` draws the value axis, the line, the markers and the tooltip from
`values`, but the point labels from `labels` — `{labels.map((l, i) => <text x={xOf(i)} ...>)}`.
With more labels than values that renders a label under empty plot, positioned by an `xOf` whose
spacing was computed from a different array's length.

**Angular:** `arena-line-chart` draws the labels from the same `points()` collection the markers
come from, taking each point's label as `labels()[index] ?? ''`.

**Why:** identical to the BarChart entry above, and for the same reason — the two arrays are one
dataset and the point is the thing being labelled. Identical output whenever the arrays are the
same length, which is every correct call. `line-chart.prompt.md` states the rule under Don't.

**Converges:** yes — React should iterate its points. **Open debt on the React layer**, low
priority.

### DoughnutChart — the legend is drawn per slice, not per label

**React:** `DoughnutChart.jsx` computes its slices from `values` and draws the ring, the centre
label and the numbers table from them — but the legend from `labels`, `{labels.map((l, i) => ...
{fmt(values[i])})}`. With more labels than values that renders a legend row whose swatch has **no
background at all** — `colors` has length `values.length`, so `colors[i]` is `undefined` — beside a
value of the literal string `undefined`; with fewer, a real
slice has no legend row at all, which on this chart is worse than on the other two because the
legend is the only place a slice is ever named.

**Angular:** `arena-doughnut-chart` draws the legend from the same `segments()` collection the arcs
come from, taking each slice's label as `labels()[index] ?? ''`. A label with no slice is dropped;
a slice with no label renders an empty string beside its swatch.

**Why:** identical to the BarChart and LineChart entries above, and for the same reason — the two
arrays are one dataset and the slice is the thing being named. Identical output whenever the arrays
are the same length, which is every correct call. The task brief also iterated the slices here, so
this is the third slice in a row where the brief silently corrected React without saying so; it is
written down now. `doughnut-chart.prompt.md` states the rule under Don't.

**Converges:** yes — React should iterate its slices. **Open debt on the React layer**, and on this
component it is a touch worse than on its siblings, since `fmt(undefined)` prints a visible
`undefined` in the legend rather than merely misplacing a label.

### DoughnutChart — the host IS the flex row, where React wraps one inside

**React:** `DoughnutChart.jsx` renders `<div ref={ref} style={{ position: 'relative', width: '100%',
height, display: 'flex', gap: 'calc(var(--sp-1) * 4)' }}>` and hangs the ring, the legend and the
numbers table inside it. The measured element and the laid-out element are the same `<div>`.

**Angular:** `arena-doughnut-chart` puts those five declarations in its own `host` metadata and
renders the SVG, the legend column and the table at the template's top level. There is no wrapper.

**Why:** `containerWidth()` injects `ElementRef`, which is the **host** — so a wrapper would have
measured the host while laying out the wrapper, and the two are not the same box. Worse,
`<arena-doughnut-chart>` is an unknown element whose UA default is `display:inline`, and a
non-replaced inline box has no content width for a `ResizeObserver` to report, so the ring would be
sized against a wrong number in the direction that matters most: `plotWidth` feeds `doughnutRadii`
directly. This is the same hazard every manifest's `root` slot carries a display utility for; a
chart has no manifest, so it states the display itself — as `arena-bar-chart` and
`arena-line-chart` already do, with the difference that this one's display is `flex` rather than
`block`, because the row is the layout rather than a wrapper inside it. `position:relative` is kept
for the absolutely-positioned numbers table. `host-class-binding.test.ts` names all three chart
primitives in `NO_MANIFEST` and asserts the rendered host's `display`, `position`, `width` and
`gap` against a real DOM.

**Also worth knowing:** the flex `gap` and the `LEGEND_GAP = 16` that `doughnutPlotWidth` subtracts
are the same distance expressed twice — once as the token derivation `calc(var(--sp-1) * 4)` that
CSS lays out, and once as the number the SVG's own user-unit width has to account for. They move
together, and both this component and React's carry the pair.

**Not ported:** React's `style` prop and `{...rest}` spread, for the reason PageHead's entry above
already gives — in Angular a consumer writes those directly on the host.

**Converges:** no. Each layer expresses the same box in its own idiom, and neither is wrong.

### DoughnutChart — the legend is keyboard-reachable in Angular, not yet in React

**React:** `DoughnutChart.jsx:54` renders the legend column as `overflow: 'auto'` with nothing
focusable inside it and no accessible name. Current Chrome and Firefox add a scrollable container
to the tab order themselves, so on an up-to-date browser the column can be reached — but that is a
recent default (Chrome shipped it in 127), it is absent on older engines, and the tab stop it
supplies is unnamed. A slice past the visible rows of a long legend is unreachable by keyboard
wherever the UA does not supply that stop.

**Angular:** `arena-doughnut-chart`'s legend column carries the identical `overflow: auto`, plus
`tabindex="0"`, `role="group"` and `aria-label="Doughnut chart legend"` (`doughnut-chart.ts`),
so the column is itself a tab stop and the browser's native scroll keys move it once focused.

**Why:** the Angular fix closes a real WCAG 2.1.1 (Keyboard) defect that both layers used to share.
React was out of scope for this branch and `DoughnutChart.jsx` was left unchanged, so it still has the
defect the Angular legend no longer does. This is not a considered design difference — it is debt
on the React side, and it is recorded rather than left silent because the two layers now visibly
differ in an accessibility affordance.

**Converges:** yes — React should get the same `tabindex`/`role`/`aria-label` treatment its legend
column lacks today. **Open debt on the React layer**, the same shape as the per-slice-legend entry
above.

### ActivityFeed — the tone dot is filled, matching Tag's own dot and Avatar's presence carve-out; not a divergence

**React:** `ActivityFeed.jsx`'s dot is `background: TONES[item.tone] || TONES.accent` — a
small (`calc(var(--sp-1) * 2)`, 8px) solid-filled circle, including for `tone="danger"`,
where it fills with `var(--danger)`.

**Angular:** `ActivityFeed.manifest.json`'s `dot` slot is `bg-current`, with each `tone`
variant setting only the *text* colour (`text-error` for danger, etc.) that `currentColor`
then fills the dot with. The rendered result is the same filled circle React's produces;
only the mechanism differs — Angular routes every tone through one `bg-current` declaration
instead of writing a `bg-<tone>` per value, which is `Tag.manifest.json`'s own dot slot
exactly (`"dot": "size-1.5 rounded-pill bg-current"`, unconditionally rendered by
`tag.ts`'s template alongside its projected content) — taken rather than re-derived, per
this task's own brief. (`Tag`'s dot originally read `h-1.5 w-1.5`; it was brought onto
the `size-*` idiom `ActivityFeed`'s own `size-2` and the rest of the layer already use, so
the two square-dot slots stop minting one duplicate rule in `utilities.css` for the same
6×6 box. The rendered box is unchanged.)

**Checked against "danger is outline" on purpose:** plan 5a's token→utility ledger — since
deleted with the executed plans, and recorded here because this was its only load-bearing
claim outside it — was explicit that `Avatar`'s presence dot is "the only place in the
ledger a filled `bg-error` is correct," which reads as if it names one component. It does
not scope that narrowly — README's own
danger section states the reasoning generally: "'Danger is outline' governs controls and
surfaces, not presence... An outline dot at that size would not read at all." A tone dot
identifying what KIND of event a feed row is (a status taxonomy, exactly like a chart's
`tone` colours or Avatar's online/busy/away/offline) is the same semantic family as
presence, not a risk trigger or a resting status surface — and `Tag`'s dot already shipped
this exact shape with no divergence entry, meaning the carve-out was already being applied
in practice one component before this one made it worth writing down. **README.md**'s danger
section is updated in this change to name `Tag` and `ActivityFeed` alongside `Avatar` so the
carve-out reads as the general rule it already is, rather than one component's exception.

**Why this is not a divergence:** React does the identical thing (a filled dot, every
tone, including danger) — both layers agree, and both are correct under the carve-out
above. Recorded per this task's own instruction to check the tone dot against the danger
convention before shipping, not because the layers disagree.

**Converges:** n/a — both layers already agree.

### UnauthCard — behaviour matches React; only the `style`/`...rest` prop has no counterpart

**React:** `UnauthCard.jsx` takes `brand`, `eyebrow`, `title`, `footer`, `children`,
plus `style` and a `{...rest}` spread forwarded onto its own root `<div>`; `brand` and
`footer` each render only when truthy (`{brand && <div>...}` / `{footer && <div>...}`).

**Angular:** `arena-unauth-card` takes `eyebrow` and `title` as signal inputs and
projects `[brand]` and default content and `[footer]`, gating the `brand`/`footer`
wrappers on `contentChild(ArenaBrand)` / `contentChild(ArenaFooter)` — the same gate
React's own `&&` checks perform, reached the only way an `ng-content` slot can report
whether anything was projected (the fix `EmptyState`/`ErrorState` already shipped for
their own action slot). React's `style` and `{...rest}` have no input to mirror them,
and need none, for the same reason `PageHead`'s entry above gives: in Angular a
consumer writes `style="..."` or any attribute directly on `<arena-unauth-card>`, the
same host element the recipe's `root` classes are bound to.

**Converges:** n/a — no behavioural divergence found.

### UnauthCard's `panel` hand-duplicates Card's surface classes

**Not a framework divergence** — both sides of this coupling live in the Tailwind
layer — but it is exactly the kind of thing that silently drifts if nothing records it,
which is this file's whole purpose, so it is recorded here rather than nowhere.

`UnauthCard.manifest.json`'s `panel` slot is `bg-base-200 border-[length:var(--bw)]
border-base-300 rounded-lg overflow-hidden shadow-3 p-5` — the surface classes
(background, border, radius, overflow) are typed out by hand, and they are the same
values `Card.manifest.json`'s `root` slot carries (`bg-base-200 border-[length:var(--bw)]
rounded-lg overflow-hidden`, with `border-base-300` supplied by its `accent: "false"`
variant). `UnauthCard` predates `Card.manifest.json`; now that `Card` exists, the two
manifests describe the same surface twice, once each.

**Deliberately not refactored to share one:** `UnauthCard`'s padding split — `panel`
at `p-5` holding a separate `body` at `p-4` — was already litigated on its own terms and
is not the same shape as `Card`'s single `body: p-5`, so collapsing `panel` onto `Card`'s
`root` is not a clean substitution.

**Risk this creates:** no gate compares one manifest to another, so a future change to
`Card`'s radius, border colour or border width updates `Card.manifest.json` alone —
`UnauthCard.manifest.json`'s `panel` keeps whatever it had, silently, until someone
notices the two surfaces no longer match by eye. Check `UnauthCard.manifest.json`'s
`panel` by hand whenever `Card.manifest.json`'s `root` or its `accent` variant changes.

**Converges:** not planned — the padding split is the reason a shared recipe was
rejected, not an oversight to fix later.

### StatCard — `delta` is one object prop in React, three flat inputs in Angular

**React:** `StatCard.jsx` takes `delta` as a single object prop, `{ value, tone,
direction }`, destructured internally (`delta.value`, `delta.tone`, `delta.direction`).

**Angular:** `arena-stat-card` flattens it into three separate signal inputs —
`deltaValue: string`, `deltaTone: 'neutral'|'positive'|'negative'` (default
`'neutral'`), `deltaDirection: 'up'|'down'` (default `'up'`) — rather than one `delta`
input.

**Why:** `tone`, `deltaTone` and `deltaDirection` are three separate facts about the number —
`tone` says what state it IS in right now (a service at 99.98% uptime is healthy whether or not it
improved this week), `deltaTone` says whether the change was good, `deltaDirection` says which way
it pointed — but that much is equally true of React, which also keeps them distinct
(`tone` alongside `delta.tone`/`delta.direction`) rather than folding them into one flag. It
explains why the fields exist, not why Angular ungroups them where React nests them. The actual
reason is signal inputs: each is `input()`-per-field, so a single object `delta` input would force
a consumer to hand a fresh object identity to change one field, and would give `deltaTone`'s and
`deltaDirection`'s defaults (`'neutral'`, `'up'`) nowhere to live the way a plain input's own
default does. Three flat inputs let a consumer set one field, at its own default, independent of
the others.

**Converges:** no — this is the Angular idiom for the same set of facts React groups into one prop.
Almost nothing a consumer could express with React's `delta` object is lost, but the two layers
gate the pill differently: React renders it whenever the `delta` object itself is truthy
(`{delta && ...}`), Angular whenever `deltaValue()` is truthy (`@if (deltaValue(); as delta)`). A
delta with a populated `tone`/`direction` but an empty `value` therefore renders an (empty) arrow
pill in React and renders nothing in Angular — negligible in practice, since a delta with no value
to show is not a delta worth passing, but it is the one real behavioural difference the split
introduces.

### SideNav is described three times, and only the colours agree

**React:** `SideNav.jsx` renders a `<nav>` with direct `<a>`/`<button>` children and owns its
full appearance — geometry included: `px-3 py-2.5` and `gap-3` per item.

**Tailwind:** `SideNav.manifest.json` mirrors `SideNav.jsx` property for property, geometry
and all. Plan 5b added it so a consumer on neither React nor Material has something to build
against.

**Angular:** there is no `arena-side-nav` primitive. The Angular path is the Material bridge —
`arena-material.css`'s `.arena-side-nav` rules dressing `mat-nav-list` — because `mat-nav-list`
already provides the anchor-or-button distinction, the active state and the keyboard behaviour.

**Why the three differ, and where:** the bridge declares **only colour, weight, font and
shape**. It declares **no geometry at all**, so on the Angular path an item's padding, gap and
row height are `mat-list-item`'s Material defaults, not React's and not the manifest's. The
bridge also uniquely sets `--mat-list-list-item-focus-label-text-color: var(--crimson)`, a focus
affordance neither of the other two has.

Neither difference is a defect in any of the three. The manifest is right to mirror React
(that is its contract), and it would be wrong to invent the focus colour — `check:states`
exists precisely to catch a state a manifest asserts that its source does not implement. The
bridge is deliberately partial: it dresses what Material renders rather than re-specifying
Material's layout, which is the whole reason SideNav stays a bridge.

**Converges:** the colours already do. The geometry does not and should not — reconciling it
would mean overriding Material's own list metrics from the bridge, which is exactly the
duplication the bridge exists to avoid. Recorded so that a reader comparing the three does not
mistake the gap for drift.

## How to add an entry

When you find a behavioural difference between layers:

1. Decide which behaviour is correct on its merits — not by which layer is older. The token layer
   settles anything about values; nothing settles behaviour automatically.
2. If one layer is simply wrong, fix it and add no entry.
3. If both are defensible, or one leads and the other has debt, add an entry here with the reason
   and whether it is expected to converge.
