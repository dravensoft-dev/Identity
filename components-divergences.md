# Component divergences between framework layers

Arena's design language is one thing; its framework layers are several. **For component design,
`contracts/design/` and `contracts/design-generated/` are the only source of truth.** A layer that disagrees with the token
layer is wrong, and that is not negotiable.

Behaviour is different. Arena is in an implementation phase across frameworks, and the layers will
not always do the same thing — a framework's idiom, its accessibility affordances, or the order in
which components were built can all pull a layer away from its counterpart. **No layer is the
absolute authority for component behaviour.** Where the layers genuinely differ, the difference is
recorded here rather than treated as a defect in whichever layer was written second.

This file is the record. A divergence that is not written down is a bug; a divergence that is
written down, with its reason, is a decision.

**The "no absolute authority" claim above is superseded.** `contracts/behaviour/*.json` now
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
`frameworks/angular/test/HostClassBinding.test.ts`.

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
Binding the input (`[title]="…"`) avoids it. React does not have the problem, though the
reason changed under it: it used to be that a React component destructured the named prop
out before spreading `...rest`, and as of plan 8C4 a migrated component **has no spread at
all** — R4 removed the last of them from `Dialog`, `Menu`, `Pagination` and `SideNav`. The
conclusion holds either way; only components not yet under contract still rely on the
destructure-first reason.

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

### The carve-out: a root that must be a specific element is not host-bound

`activity-feed`'s root must be a real `<ul>` with `<li>` rows, or a screen reader stops
announcing a list. `<arena-x>` is a custom element and cannot be made one by binding
classes to it.

**The rule, stated generally:** host-binding targets elements that exist *only* to carry
styling. When the root must be a specific semantic or interactive element, keep that
element and do not host-bind. The carve-out keeps its own entry below with the
component-specific detail; this is the rule it is an instance of. The display-utility
guard still applies and still passes.

**Converges:** no.

### The Tailwind layer is border-box; React is content-box

**The Tailwind layer** — `frameworks/tailwind/`'s compiled `Utilities.css`, consumed
directly by every `*.card.html` specimen and, through `theme/arena-tailwind.css`'s
preset import, by a real Tailwind-based Angular consumer app too — carries Tailwind
v4's own preflight, inside `@layer base`: `*, ::after,
::before, ::backdrop, ::file-selector-button { box-sizing: border-box; … }`. **Re-derive
the line rather than trusting one written here** —
`grep -n 'box-sizing: border-box' frameworks/tailwind/Utilities.css`, which answers 123
today. This file used to cite `:112`, which was true when written and had already drifted
to 121 by the time anyone read it again: the stylesheet is generated output and grows
whenever a token is added, so a line number in it is exactly the kind of figure this
repository's own rules say to derive with a command instead.

**React** sets no such rule anywhere in `contracts/design/` or `styles.css`, so every React
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
**Angular:** animations live in `frameworks/tailwind/Animations.css` as `@utility` + `@keyframes`,
compiled into the committed `frameworks/tailwind/Utilities.css`.

**Why:** the Angular layer already ships a compiled stylesheet, so a shared file is both cheaper
and statically checkable. `@utility` emits nothing when unused, so an animation costs nothing until
a component references it.

**Same in both:** the `prefers-reduced-motion` answer, which depends on what the motion means —
work-in-progress motion slows rather than stops, decorative motion stops outright, an entrance
keeps its fade and drops its travel, an opacity-only animation needs no clause.

**Converges:** no. Each layer uses its own idiom over the same token values.

### ActivityFeed is the Angular primitive that does not host-bind its root

**Every other Angular primitive:** the recipe's `root` slot is
bound onto the host — `host: { '[class]': 'styles().root()' }` — and no wrapper element is
rendered.

**`arena-activity-feed`:** keeps the host a bare, unstyled `<arena-activity-feed>` and
renders a real `<ul [class]="base().root()">` inside it, with each row a real `<li>`.

**Why:** this is the general carve-out this file's "two carve-outs" entry above states —
"when the root must be a specific semantic element, keep it and do not host-bind." An
`<li>` must be a child of a list element (`<ul>`, `<ol>` or `<menu>`); host-binding `root`
here would make `<arena-activity-feed>` itself the list and promote its rows to children
of an element that is not one, silently destroying the list semantics a screen reader
announces (item count, position-in-set) with no ARIA role added to compensate — and none
is needed, since the native `<ul>`/`<li>` pair already carries it. A native list structure
is a structure a custom element cannot become.

**Consequence to know:** a consumer attribute written directly on
`<arena-activity-feed>` (a static `class=""`, an ARIA attribute) lands on the inert host,
not on the styled `<ul>` inside it. `HostClassBinding.test.ts`'s manifest-driven display-
utility guard still covers this component (it reads every primitive's `slots.root` string
regardless of whether the component host-binds it), and `ActivityFeed.manifest.json`'s
`root` slot (`"flex flex-col list-none m-0 p-0"`) still carries `flex`, so the guard is not
weakened by this carve-out — it was never conditioned on host-binding in the first place.

**No API divergence left to record:** both layers are under the API contract
(`contracts/api/components/ActivityFeed.json`), whose single member is `items`. The `style` prop
and `{...rest}` spread that once lived only on the React side were removed when the
component was brought under contract — which is what makes the consequence above the
whole story rather than half of it. A consumer attribute still lands on the inert host
here, and neither layer offers a second route to the styled `<ul>`; that follows from
the no-host-bind decision, not from anything the contract could restate.

**Converges:** no. This is the correct shape for a primitive whose root must be a real list
element, per the carve-out rule stated above.

### The Angular layer has no Button primitive

**React:** `Button.jsx` is a component, and `ConfirmDialog.jsx` renders `<Button>` for its footer.
**Angular:** there is no `arena-button`. Angular Material's `mat-button` fills that role, so a
component needing footer buttons styles them itself from its own manifest.

**Why:** the Angular layer is deliberately the set of primitives Material does not provide.

**Consequence to know:** a hand-rolled button must still carry the interaction affordances
`Button.manifest.json` defines — the gap, the transition, and the hover shadow — or it ships a
control with no feedback. This was missed once on `ConfirmDialog` and corrected.

**`ErrorState` was a divergence here and no longer is.** Under the API contract
(`contracts/api/components/ErrorState.json`) both layers draw the retry the same way: React's
`ErrorState.jsx` draws it from `retryLabel`/`onRetry`, and `arena-error-state` draws its own
`<button>` styled by its manifest's `retry` slot — exactly the pattern this section describes —
projecting only a `[secondaryAction]` slot beside it. The former divergence (React drew a button
from data while Angular collapsed the retry, its label and any secondary action into one projected
`[action]` slot) is settled by the contract, so it is no longer recorded as one.

**Converges:** n/a — the contract makes both layers draw the retry identically; only the
secondary action is projected, on each.

---

## Per-component divergences

### ConfirmDialog — the require-text input loses its focus ring in React

> **The accessibility half of this entry is closed, and plan 8C4 closed it.** This section used to
> be titled *"ConfirmDialog — Angular is accessible, React is not yet"* and recorded that React
> asserted `aria-modal="true"` over a free-roaming focus, with no accessible name, no trap, no
> restore and no Escape. All of that is now met in both layers:
> `frameworks/react/UseDialogModal.js` is a deliberate port of
> `frameworks/angular/FocusTrap.ts`, `ConfirmDialog.title` is required and guarded in
> both layers with `aria-labelledby` pointing at it, and `ConfirmDialog.behaviour.json` retains a
> single exception — `roles.element`, which is `role="alertdialog"` and which **both** layers
> declare, so it is a shared deviation from the pattern rather than a divergence between layers.
> What is left of the entry is one real difference and one shared limit.

**React:** the require-text `<input>` carries `outline: 'none'` in its inline style object and
substitutes nothing, so a keyboard user typing the confirmation word gets no focus indication at
all — on the one control that gates Arena's only filled danger surface.

**Angular:** the same control keeps `outline-none` but substitutes a token-derived visible ring,
`focus-visible:ring-[length:var(--focus-width)] focus-visible:ring-error` in
`ConfirmDialog.manifest.json`, rather than removing focus indication outright.

**Why:** `outline: 'none'` with nothing in its place contradicts README's own normative rule
("Focus: `--error` ring"). Angular fixed it when the primitive was written; React was not touched,
because plan 8C4 was about the `dialog-modal` pattern and a focus ring is not one of its seven
requirements — so no gate would have caught this and none does.

**Converges:** yes — React should substitute the same ring. **Open debt on the React layer**, and
the only part of this entry that is still open.

**Also still missing, on BOTH layers, and therefore not a divergence:** `inert` on the background.
The keyboard trap is what keeps focus in; a pointer-driven assistive technology that never goes
through Tab is not covered by it. This was recorded here when it was half of a divergence; it is
now a shared limit of both layers and is recorded here only because deleting it would lose it.

**Tested how (Angular):** `frameworks/angular/components/feedback/confirm-dialog/ConfirmDialog.focusTrap.test.ts` asserts the
trap's mechanics — `focusableElements`, `focusFirstFocusable`, `trapTabKey`,
`handleOpenTransition` — against a hand-built, real DOM tree under happy-dom. It is deliberately
*not* a TestBed render of `<arena-confirm-dialog open="true">`. **That used to be forced rather
than chosen**: probed by hand under this repo's then-JIT-only harness, both the `[open]="true"`
template binding and `componentRef.setInput('open', true)` failed — the first threw NG0303, the
second logged it and then silently no-opped, so no TestBed-based test could render an
actually-open dialog. Batch 8C11 moved this harness to AOT and retired that limitation:
`frameworks/angular/test/HarnessCapabilities.test.ts` now drives `ConfirmDialog.open` through
`setInput('open', true)` on a directly created fixture and asserts `[role="alertdialog"]` renders.
This suite still tests the helpers directly rather than rendering the real component, which is now
a design choice and not a forced one — see CLAUDE.md's *Known debt* entry on the seven files that
still justify a testing strategy by the retired limitation. **Tested how (React):**
`frameworks/react/components/feedback/Behavioural.dom.test.jsx` and
`frameworks/react/components/feedback/DialogModal.dom.test.jsx`, which render the real
component; `ConfirmDialog:react` is in `check:compliance`'s `COVERED`.

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

**Converges:** yes — React should be brought up to this. **Open debt on the React layer.** This
used to read *"the same shape as `ConfirmDialog`'s accessibility debt above"*; that debt was paid
by plan 8C4 and the comparison no longer holds. This entry is now the older of the two and stands
on its own.

### Skeleton — the circular variant's announcement, RETIRED as a divergence

This section recorded that `Skeleton.jsx` branched by variant — `block`, `line` and `text`
rendering `role="status"` with `aria-label="Loading"`, and `circle` rendering
`aria-hidden="true"` with no role at all — while `Skeleton.ts` set `role: 'status'` and
`'aria-label': 'Loading'` in its `host` bindings statically, with **no branch by variant**. The
consequence was not a difference of shapes: meeting a circular skeleton, a screen-reader user
heard "Loading" in Angular and heard nothing in React. It was recorded as *"both are
defensible"* and left undecided.

**Plan 8C10 closed it, and closed it under step 2 of *How to add an entry* below: one layer was
simply wrong.** React was. Angular has announced every variant since it was written and needed
no change; `Skeleton.ts` was not touched. `Skeleton.jsx`'s `circle` branch now renders
`role="status"` and `aria-label="Loading"` like its three siblings.

**What settled it was not a judgement call, which is the transferable part.** The undecided
framing assumed the answer needed a design decision about whether a second "Loading" beside an
announced name is noise. It did not. A skeleton exists to announce that it will be replaced by a
functional component when asynchronous data arrives; a skeleton that announces nothing is not
doing that job, whatever shape it is. The variant's behaviour follows from the definition, and
no preference had to be weighed to reach it. **React's own code was the evidence**: `block`,
`line` and `text` all announced unconditionally, so no noise-reduction strategy was ever applied
across this component. The `circle` branch was the odd one out rather than the deliberate
exception it read as.

**How it was found, which is why this note replaces the section rather than deleting it.**
Nothing was looking for it. Converting the React binding to cases made the cross-layer check
compare a cased binding against a flat one, and a flat binding can no longer silently agree with
a cased one. `Toast` surfaced the same way in the same batch and is still open below. Expect
more of these as bindings are converted — the property is a permanent one of the cases
mechanism, not a fact about `Skeleton`, and it outlives the divergence it found.

**Recorded how, now:** `frameworks/react/components/display/skeleton/Skeleton.behaviour.json` is back to
the flat `{"pattern": "status", "exceptions": []}` — no cases, no `divergesFrom` — because all
four variants meet `status` and there is nothing left for a case to scope.
`frameworks/angular/components/display/skeleton/Skeleton.behaviour.json` is unchanged and still flat at
`status`. That the split was built and then retired is the mechanism working rather than a
retreat: splitting the variants is what made the defect visible, and fixing the defect retired
the need for the split.

**What is NOT proven, and it is the same limit the rest of this file carries.** The React claim
is verified — `frameworks/react/test/PlacementAndBranches.dom.test.jsx` renders all four
variants and `Skeleton:react` is in `check:compliance`'s `COVERED`. The Angular claim is not:
`Skeleton.behaviour.json` says `status` with no exceptions and **no suite verifies that binding**,
so Angular's side of the now-agreeing pair is an unverified claim, exactly as it was while the
layers disagreed. Be precise about which claim is unverified, because **two** suites render this
component and one of them asserts the announcement itself.
`frameworks/angular/test/HostClassBinding.test.ts` imports `Skeleton` (:67), declares a
`SkeletonHost` fixture (:147) and mounts a real `TestBed` tree of it in **three** tests. Two are
host-class tests — the recipe's root classes land on the host (:632), a consumer's own class
survives the `[class]` binding (:641). The third,
*"arena-skeleton: the host itself carries the loading status, not a wrapper inside it"* (:649),
asserts `role="status"` and `aria-label="Loading"` on the host, plus that the default variant
renders no children of its own.
`frameworks/angular/components/display/skeleton/Skeleton.dimensions.test.ts` mounts it too, in six
tests, and reaches
**every** variant: its `renderSkeleton` helper (:37-45) drives `variant` through
`fixture.componentRef.setInput('variant', variant)` — the same `setInput()` technique every
directly-created fixture in this AOT harness now uses — and renders `block`, `circle`, `line` and
`text`. What it asserts is the inline `[style.*]` dimension
bindings, never `role`, `aria-label`, or anything else the `status` pattern names. Those two are
the whole set that renders it: `Skeleton.variants.test.ts` mounts nothing (it asserts the
plain-TypeScript recipe and `skeletonRowSlot`), and the only other `.ts` files in this layer
naming `Skeleton` at all — `frameworks/angular/test/Compliance.ts` and
`frameworks/angular/components/feedback/confirm-dialog/ConfirmDialog.focusTrap.test.ts` —
name it only in a comment, one line each; `grep -n Skeleton <file>` locates them, and a line
number written here would not survive the next edit above it, as one written in this batch did
not. Re-derive the whole set with
`grep -rln Skeleton --include='*.ts' frameworks/angular/`: besides the five files named in this
paragraph it returns the generated `Api.generated.ts` and the rest of the component's own
directory (`index.ts`, `Skeleton.ts`, `Skeleton.variants.ts`), none of which is a suite.

So the accurate statement is narrower than "nothing is checked". What no suite in this layer does
is **evaluate the binding against the `status` pattern**: neither file calls `comparePattern` or
`assertPattern`, so no requirement of `status` beyond those two attributes is checked anywhere, no
exception could ever expire there, and nothing would notice if the pattern gained a requirement
the component does not meet. The variant reach is **split between the two files** rather than
absent, which is the correction an earlier version of this paragraph needed: the suite that
asserts the announcement **stops at the default variant**, `block`, because its fixture is a
template (`<arena-skeleton class="consumer-class" />`) with no `[variant]` binding. **That used to
be a harness limitation and is not any more**: batch 8C11 moved this harness to AOT, and
`HostClassBinding.test.ts`'s own header now calls the stop a scope decision rather than a
limitation — the other three variants are covered elsewhere (`Skeleton.variants.test.ts` for the
recipe, `Skeleton.dimensions.test.ts` for a real render of all four); the suite that does reach
`circle` — the variant this batch changed — asserts dimensions instead. That split is softer than it looks in this one
component's case, and the reason is worth stating rather than leaving a reader to assume the
worst: `role` and `aria-label` are **static host attributes** in `Skeleton.ts` (`:45-46`, inside
the `host:` object, with no branch by variant — unlike React's, which branched), so asserting them
on `block` establishes them for every variant by construction rather than by coverage. Rendering a
component is not verifying its binding, and `Skeleton:angular` is absent from
`check:compliance`'s `COVERED` (`scripts/check-compliance.mjs:113-129`) for that reason.

**This paragraph is itself a worked example of the hazard it sits inside, twice over.** Its first
version claimed that suite "says nothing about `role`, `aria-label` or the `status` pattern",
which was false — written from a `grep` that found two of the three tests in that one file, in the
same batch that recorded *a component name written into another file's prose is a cross-file claim
no gate checks*. Its second version, written to correct exactly that, then claimed the other three
variants were **"unreachable"** from this harness — also false, and false the same way, one step
out: its author read the one file and generalised to a directory that already held
`Skeleton.dimensions.test.ts` driving all four. A reviewer read the files both times; no gate
caught either, in either direction. See `CLAUDE.md`'s *Known debt* entry for the class and the
change-time command.

### Toast — a critical error interrupts in React and is queued in Angular

**React:** `Toast.jsx` branches on tone off a single ternary — `role={tone === 'danger' ?
'alert' : 'status'}` with the matching `aria-live` — so a danger toast renders `role="alert"`
with `aria-live="assertive"` and every other tone renders `role="status"` with
`aria-live="polite"`.

**Angular:** there is no `arena-toast` primitive. Angular delegates to Angular Material's
`MatSnackBar`, and `MatSnackBar` does not vary by tone at all — it has no tone. Read against the
installed `@angular/material` 22.0.5, in
`node_modules/@angular/material/fesm2022/snack-bar.mjs`:

- `MatSnackBarConfig.politeness = 'polite'` is the class-field default, and the container
  resolves `_live` to `'assertive'` only when `politeness === 'assertive' && !announcementMessage`;
- `_role` is assigned **only inside `if (this._platform.FIREFOX)`**, where `'polite'` maps to
  `status` and `'assertive'` to `alert`;
- the container template binds `<div [attr.aria-live]="_live" [attr.role]="_role" …>`.

So on every non-Firefox browser the snackbar's live region renders `aria-live="polite"` and
**no role at all**, whatever the message says.

**The consequence, stated plainly, because it is what an entry is for:** meeting a critical
error toast, a screen-reader user has it **interrupt** in React and **queued behind whatever is
already speaking** in Angular. That is the safety-relevant case — the one the React binding's
`danger` case exists for — and it is a real difference to a real person, not a difference in how
two files are shaped.

**Why:** the two layers did not disagree about this; only one of them ever decided it. React
designed a tone axis and mapped the top of it onto the assertive live region. Angular took a
third-party control that has no tone axis and never wired one, and `MatSnackBarConfig.politeness`
is the seam that would carry it — the same unwired-`MatSnackBarConfig` shape already recorded in
`CLAUDE.md` for `duration` and `--dismiss-*`.

**Converges:** **deferred to Plan D**, which is a decision and not a resolution. `Skeleton` above
was retired because one layer was simply wrong; this one is not that case. Angular is not wrong
about a control it does not own — it delegates to a third-party component that has no tone axis
to be wrong about — so there is nothing here to fix at this layer's level. Plan D removes Angular
Material, and an `arena-toast` built on the CDK would be born with the right role and live-region
politeness per tone, the way every other Arena primitive carries its own behaviour. That is where
this converges.

**Nothing is fixed for Angular users until Plan D lands, and this entry must not be read as
though it were.** Until then, every Angular consumer of a critical error toast ships the
behaviour described above: `aria-live="polite"` and, outside Firefox, no role at all, so the
message is queued behind whatever is already speaking rather than interrupting it. A deferral
moves the work; it does not reduce the cost anyone is paying in the meantime.

Two interim resolutions exist and neither was taken. A consumer-side wiring setting `politeness:
'assertive'` for a danger snackbar puts a component-level obligation on every host and is
forgotten silently when a host misses it; a narrowed delegated claim admitting Angular has no
tone axis here would make the record accurate without changing what a user hears. Both are
available before Plan D if the cost above is judged too high to carry, and Plan D supersedes
either.

**Recorded how:** `frameworks/react/components/feedback/toast/Toast.behaviour.json` declares two cases,
`danger` → `alert` and `advisory` → `status`, and carries `divergesFrom: "alert"` naming the flat
delegated binding, so `check:behaviour` reports the divergence as declared rather than as two
layers disagreeing. **`frameworks/angular/BehaviourDelegated.json`'s `Toast` entry is left
untouched on purpose**, and it is not accurate: it binds `alert` with `"exceptions": []` while
`MatSnackBar` renders no role outside Firefox. That inaccuracy is pre-existing and is already
covered by `CLAUDE.md`'s standing *"every claim the delegated declarations make about Angular
Material is unpinned"* entry — it is named here so no reader mistakes the silence for agreement,
and so no fresh claim is stacked on top of it.

**How it was found:** not by the cross-layer check, which reported this as declared and moved on.
By a reviewer opening `snack-bar.mjs`. The check compares the *shape* of two bindings; nothing in
this repository compares a binding against a third-party library's real behaviour.

### Onboarding — the scrim is a sibling in React and the host in Angular

> **The naming half of this entry is closed, and plan 8C4 closed it.** This section used to be
> titled *"Onboarding — the scrim is dismissible, and Angular always names the dialog"*. React's
> panel now falls back through `title` → `eyebrow` → `"Step N of M"`, the identical chain Angular
> computes, so the dialog always has a name in both layers and `Onboarding.behaviour.json` reads
> `"exceptions": []` on both sides. **The chain was ported rather than the step title being made
> required**, so `OnboardingStep.title` stays optional and no contract broke. What remains is the
> structural difference the title now names, which is real and unchanged.

**React:** `Onboarding.jsx` renders the scrim and the panel as two sibling `<div>`s. The
scrim's `onClick={onSkip}` closes the tour; because the panel is a *sibling*, not a
descendant, a click inside the panel never reaches that handler.

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
stopping propagation on the panel is what reproduces it under one shared ancestor.

**Converges:** partly. The label half is done. What is left is structural: React should stop
resting the click assumption on sibling placement, because any refactor toward one wrapper needs
the same `stopPropagation` and nothing today says so. **Open debt on the React layer**, and it is
a latent hazard rather than a live defect — the two layers behave identically today.

**One consequence of the ported chain, recorded rather than hidden:** on a step carrying neither
`title` nor `eyebrow`, the panel's `aria-label` is `"Step N of M"` — byte-identical to the
`aria-label` already on the progress-dots div inside that same panel, in **both** layers
(`Onboarding.jsx`, `Onboarding.ts`). A screen reader announces the two the same. That is the price
of a positional fallback and it is pinned by an assertion in
`frameworks/react/components/feedback/onboarding/Onboarding.dom.test.jsx` rather than left to prose.

### Onboarding — the modal contract, RETIRED as a divergence

This section recorded the largest of the three: React asserted `role="dialog" aria-modal="true"`
and managed no focus whatsoever — nothing moved focus in on open, nothing restored it on close,
Tab and Shift+Tab walked straight out of the panel into the page behind the scrim, and Escape did
nothing, while `aria-modal="true"` had already told assistive technology the page behind was
unavailable. Angular implemented the contract it asserted, through
`frameworks/angular/FocusTrap.ts`.

**Plan 8C4 closed it, and closed it by porting rather than by re-solving.**
`frameworks/react/UseDialogModal.js` is a deliberate mirror of that Angular module — same
focusable selector including its per-clause `:not([tabindex="-1"])` guard, same boundary-wrap rule,
same never-cache rule, same open/close transition — consumed by all three React overlays. Escape
reports through `onSkip`, which is the output Angular already routes its own Escape to, so the two
layers agree by construction rather than by coincidence. `Onboarding.behaviour.json` reads
`"exceptions": []` in both layers and `Onboarding:react` is in `check:compliance`'s `COVERED`.

**What is NOT proven, in either layer, and is the reason this note replaces the section rather than
deleting it.** A suite can prove the boundary wrap, because that is our own `.focus()` call and
happy-dom honours it. It cannot prove the interior — that Tab from a *middle* element reaches the
next one — because that is native sequential focus navigation, which neither layer implements and
happy-dom does not have. Both layers check the interior in a real browser by hand. A browser-driven
gate stays refused as this repo's fourth non-portable gate.

**Also still missing, on both layers:** `inert` on the background — see the `ConfirmDialog` entry
above, which now carries that shared limit for all three overlays.

### Onboarding — no icon, on either layer

**React:** `Onboarding.jsx` renders no icon anywhere — no `<i className="ph-...">` in the
component, despite Duotone being licensed system-wide for "features and onboarding" per
README's iconography convention and `frameworks/angular/icons/IconManifest.ts`'s
`{ role: 'onboarding', phosphor: 'ph-sparkle', weight: 'duotone' }` entry.

**Angular:** matches React exactly — no icon slot, no `icon` input. `IconManifest.ts`'s
`onboarding` role is a registry seed for a consumer building their own icon usage, not
something any primitive in this layer currently consumes directly (no primitive imports
from `IconManifest.ts`; `EmptyState`/`ErrorState` instead take a plain `icon: string`
input the consumer fills from wherever they like).

**Why:** the task brief's own sample manifest and template carry no icon either, matching
React. Adding one would have been a real feature addition with no brief authority and no
React precedent — YAGNI.

**Converges:** n/a — not a divergence between the layers, recorded here only because a
Duotone icon on the coachmark was flagged as worth double-checking. If a future revision
wants one, `ph-sparkle` duotone with the crimson accent on the primary layer is the
existing registry answer.

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
`handleOpenTransition` and `trapTabKey`, generalized out of `ConfirmDialog.ts` into
`frameworks/angular/FocusTrap.ts` so this component did not need a second
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

**Tested how:** `frameworks/angular/components/navigation/command-palette/CommandPalette.focusTrap.test.ts` exercises
the shared `handleOpenTransition`/`trapTabKey` helpers against a hand-built DOM tree
shaped like the palette's panel (one real `<input>`, several `tabindex="-1"` row
buttons) — real focus movement, real `document.activeElement`, and a Tab that must not
reach a control placed behind the scrim. It does not render `<arena-command-palette>`
through TestBed. **That used to be forced**: `CommandPalette.keyboard.test.ts` documented
`open` as unable to become `true` under this repo's then-JIT-only harness. Batch 8C11 moved
this harness to AOT and retired that limitation — `frameworks/angular/test/HarnessCapabilities.test.ts`
now drives `CommandPalette.open` through `setInput('open', true)` on a directly created fixture
and asserts its search input renders. `CommandPalette.focusTrap.test.ts` and
`CommandPalette.keyboard.test.ts` still test the helpers directly rather than the real
component, which is now a design choice rather than a forced one — both are among the seven
files CLAUDE.md's *Known debt* records as still citing the retired limitation in their own
prose. So this is not proof
that the component's own `afterRenderEffect`/`onKey` wiring calls these functions at
the right time — `ngc --strictTemplates` (`check:angular`) is what proves that wiring
compiles against the component's real `viewChild`/`inject(DOCUMENT)` types.
`activeOptionId`, the function `aria-activedescendant` is computed from, is asserted
directly in `CommandPalette.keyboard.test.ts`: it always resolves to a real row's id,
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
`arena-confirm-dialog`'s `confirm`/`cancel` and `arena-onboarding`'s
`skip`/`done` — by setting `open` to `false` itself, as `CommandPalette.prompt.md`'s
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

### PageHead — behaviour matches React; the measurement helper is shared

**React:** `PageHead.jsx` takes a required `title`, `subtitle`, `actions` and an `align`
enum, and gates the actions wrapper on `{actions && ...}`.

**Angular:** `arena-page-head` takes a required `title`, `subtitle` and an `align` enum as
signal inputs and projects `[actions]`, gating that wrapper on `contentChild(ArenaActions)` —
the same gate, reached the only way an `ng-content` slot can report whether anything was
projected. The responsive branch is identical in substance: both measure the component's own
box, both compare against `--bp-sm` read off the document root, and both render the wide layout
while the width is still `null` so the narrow branch never flashes. Both layers are under the API
contract (`contracts/api/components/PageHead.json`) with no API divergence: `title` (required), `subtitle`,
`actions` and `align` are the same members in each — the `style`/`{...rest}` escape that once
lived only on the React side was removed when the component was brought under contract, its
alignment intent re-expressed as the shared `align` enum and its bottom margin dropped so the
parent composes the spacing.

**Worth knowing:** the measurement helper is shared, not private to this component.
`frameworks/angular/ContainerSize.ts` exports `containerWidth()` and
`readBreakpoint()`, mirroring React's `UseContainerWidth.js` without the `use` prefix —
a signal-returning function is not a React hook. It is named directly in the layer barrel
(`frameworks/angular/index.ts`) deliberately, so a consumer writing their own responsive component reaches for
Arena's measurement rather than a media query. One deliberate difference from React's
version: `readBreakpoint()` injects `DOCUMENT` **before** consulting its cache, not
after, so the "call from an injection context" contract holds on every call instead of
only the first one for a given name. React's copy has no equivalent hazard — it reads
the global `document` directly and has no injection contract to keep consistent.

**Converges:** n/a — no behavioural divergence found. Recorded because this is the first
primitive whose host classes depend on a runtime measurement, and the next five (the
chart primitives) inherit the helper unchanged.

### DataVisuals — the visually-hidden style carries its units in Angular

(This module was `chart-internals.js`/`ChartInternals.ts` under each layer's `charts`
category until the structure refactor's batch 3 moved it to each layer's root and renamed
it, because `Calendar` consumes `catColor` from it and a module a schedule grid consumes is
not "chart internals".)

**React:** `frameworks/react/DataVisuals.js` exports `srOnly`, a style object with bare numbers —
`{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, ... }`. React's DOM
layer appends `px` to a unitless number on a length property, so `width: 1` renders `1px`.

**Angular:** `frameworks/angular/DataVisuals.ts` exports the same object as `SR_ONLY`, with every length
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
chart has no manifest, so it states the display itself; `HostClassBinding.test.ts` names the
chart primitives in `NO_MANIFEST` and asserts the rendered host's `display` and `position` against
a real DOM instead of against a manifest string.

**One gate blind spot, recorded rather than papered over:** the tooltip's
`[style.top]="'calc(' + point.y + 'px - var(--sp-2))'"` is the same data-to-pixel projection React
carries a named `EXEMPT` entry for. Angular's binding syntax puts it outside all four of the gate's
scanners, so it needs no exemption — but it is unexempted because it is unseen, not because it is
tokenized. `check:dimensions` is clean on this component for real reasons everywhere else.

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
`nearestPointIndex()` and pinned in `LineChart.geometry.test.ts`; the coordinate origin it is fed
is the part that cannot be unit-tested here, because it needs a real layout box.

**Converges:** yes — React should measure the SVG. **Open debt on the React layer**, and it is
visible on every correct call, not only on mismatched input.

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
for the absolutely-positioned numbers table. `HostClassBinding.test.ts` names all three chart
primitives in `NO_MANIFEST` and asserts the rendered host's `display`, `position`, `width` and
`gap` against a real DOM.

**Also worth knowing:** the flex `gap` and the `LEGEND_GAP = 16` that `doughnutPlotWidth` subtracts
are the same distance expressed twice — once as the token derivation `calc(var(--sp-1) * 4)` that
CSS lays out, and once as the number the SVG's own user-unit width has to account for. They move
together, and both this component and React's carry the pair.

**Converges:** no. Each layer expresses the same box in its own idiom, and neither is wrong.

### DoughnutChart — the legend is keyboard-reachable in Angular, not yet in React

**React:** `DoughnutChart.jsx:54` renders the legend column as `overflow: 'auto'` with nothing
focusable inside it and no accessible name. Current Chrome and Firefox add a scrollable container
to the tab order themselves, so on an up-to-date browser the column can be reached — but that is a
recent default (Chrome shipped it in 127), it is absent on older engines, and the tab stop it
supplies is unnamed. A slice past the visible rows of a long legend is unreachable by keyboard
wherever the UA does not supply that stop.

**Angular:** `arena-doughnut-chart`'s legend column carries the identical `overflow: auto`, plus
`tabindex="0"`, `role="group"` and `aria-label="Doughnut chart legend"` (`DoughnutChart.ts`),
so the column is itself a tab stop and the browser's native scroll keys move it once focused.

**Why:** the Angular fix closes a real WCAG 2.1.1 (Keyboard) defect that both layers used to share.
React was out of scope for this branch and `DoughnutChart.jsx` was left unchanged, so it still has the
defect the Angular legend no longer does. This is not a considered design difference — it is debt
on the React side, and it is recorded rather than left silent because the two layers now visibly
differ in an accessibility affordance.

**Converges:** yes — React should get the same `tabindex`/`role`/`aria-label` treatment its legend
column lacks today. **Open debt on the React layer**.

### AppLogo — React guards against a missing `mark` or `name`; Angular has no counterpart, and needs none

**React:** `AppLogo.jsx`'s `if (!mark || !name) return null` (`AppLogo.jsx:15`) renders nothing
when either is missing.

**Angular:** has no counterpart — `name` is `input.required`, so a missing `name` is a
compile-time/runtime contract violation at the call site, not a variant to render around, and
per a standing ruling AppLogo must never render mark-only. Dropping the guard is deliberate, not
a gap.

**Why:** this is a rendering divergence, not an API one — the API contract (`contracts/api/components/
AppLogo.json`) already states `mark` and `name` as required members in both layers, and
`check:api` holds that. What differs is what happens at the one call site that violates it
anyway: React's guard is a runtime check, reachable because a consumer can still call the
component with either prop omitted and the code still compiles; Angular's `input.required`
makes that same omission a build/render-time failure before the template ever runs, so there is
nothing left for a template-level guard to catch.

**Converges:** no. Each layer enforces the identical constraint — AppLogo never renders mark-only
or fully empty — through its own platform's mechanism for it, a runtime guard in React and a
required input in Angular, and neither can adopt the other's without adopting the other's type
system.

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
`Tag.ts`'s template alongside its projected content) — taken rather than re-derived, per
this task's own brief. (`Tag`'s dot originally read `h-1.5 w-1.5`; it was brought onto
the `size-*` idiom `ActivityFeed`'s own `size-2` and the rest of the layer already use, so
the two square-dot slots stop minting one duplicate rule in `Utilities.css` for the same
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

### UnauthCard — behaviour matches React; the brand/footer gate is a projection query

**React:** `UnauthCard.jsx` takes `brand`, `eyebrow`, `title`, `footer` and `children`;
`brand` and `footer` each render only when truthy (`{brand && <div>...}` /
`{footer && <div>...}`).

**Angular:** `arena-unauth-card` takes `eyebrow` and `title` as signal inputs and
projects `[brand]` and default content and `[footer]`, gating the `brand`/`footer`
wrappers on `contentChild(ArenaBrand)` / `contentChild(ArenaFooter)` — the same gate
React's own `&&` checks perform, reached the only way an `ng-content` slot can report
whether anything was projected (the fix `EmptyState`/`ErrorState` already shipped for
their own action slot).

Both layers are under the API contract (`contracts/api/components/UnauthCard.json`) with no API
divergence: `brand`, `eyebrow`, `title`, `content` and `footer` are the same members in
each — the `style`/`{...rest}` escape that once lived only on the React side was removed
when the component was brought under contract, the same way `PageHead`'s was.

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

### SideNav is described three times, and only the colours agree

**React:** `SideNav.jsx` renders a `<nav>` and nothing else. It is a **compound component**, and
the geometry lives in the children rather than in it: `SideNavItem.jsx` owns a row entirely —
`gap: calc(var(--sp-1) * 3)`, `paddingBlock: calc(var(--sp-1) * 2.5)`,
`paddingInlineEnd: calc(var(--sp-1) * 3)`, and the glyph Arena draws at `--icon-lg`;
`SideNavSection.jsx` owns the `role="group"` column and the mono uppercase heading that names it;
`SideNavCollapsible.jsx` owns the disclosure `<button>`, its caret at `--icon-md`, and the region
the button controls. A reader who opens `SideNav.jsx` looking for a padding or a gap will not find
one there — that is the file attribution this entry got wrong until now, and it was wrong for the
values as well as for the shape.

**Tailwind:** `SideNav.manifest.json` was added by plan 5b so a consumer on neither React nor
Material has something to build against, and it mirrored `SideNav.jsx` property for property,
geometry and all. It fell behind twice. Plan 8C4 took ownership of the glyph under the single-icon
convention — `<i className={icon} aria-hidden="true">` with its own `fontSize: var(--icon-lg)` and
`display: inline-flex`, where the icon used to be a consumer-supplied node Arena never styled — and
the manifest, declaring only `root` and `item`, described no icon at all. Then this batch made the
component compound, adding a section group, a section heading, a disclosure trigger, a caret and a
controlled region, none of which the manifest knew existed.

**Both debts are paid here.** What was owed was an `icon` slot and then, one batch later, a slot for
every element the compound tree added; this batch pays the whole of it. The manifest now declares
nine slots: `root`, `item` and the `active` variant unchanged, plus `icon` (`--icon-lg`), `section`,
`sectionLabel` (`font-mono`, `--dz-text-xs`, `--ls-badge`, uppercase, `--mute`), `trigger`,
`triggerLabel`, `caret` (`--icon-md`) and `region`. `SideNav.card.html` renders every one of them
through `classesFor()`, the collapsible in both states — the collapsed region by the `hidden`
attribute alone, since the preflight's `[hidden] { display: none !important }` outranks the
`region` slot's `flex`, which is this layer's counterpart to React setting both `hidden` and an
inline `display: none`.

**What the manifest deliberately does not carry is the per-row indent, and it is the one thing it
cannot.** `indentFor()` returns `calc(var(--sp-1) * 3 + var(--sp-1) * N)` where `N` is
`indentStep × depth`, computed per row at render time; a static utility cannot hold a runtime
multiplier, so no slot claims one. Every slot carries the depth-0 inline start instead (`item`'s
`px-3`, `sectionLabel`'s `ps-3`), and a consumer on the raw-`className` path supplies the deeper
rows' padding themselves. No new slot combines an explicit size with a border or a padding, so this
batch adds no row to the border-box table above.

None of that is machine-checked, and the reason this entry keeps having to say so is the
manifest-versus-component drift CLAUDE.md records as unclosed: `check:tailwind` proves every class
in a manifest resolves to a token, and **nothing proves a manifest still matches the component it
was derived from.** `check:states` is the one narrow slice that is, and this batch corrected where
it reads: `SideNav` now has a `SOURCE_OVERRIDES` entry in `scripts/check-manifest-states.mjs`
naming all four `.jsx` files, the same reason `Table`'s entry names `Table.jsx` and `TableRow.jsx`
— the naive same-name search resolves `SideNav.jsx`, which renders only the `root` slot, so a
future hover on `item` or `trigger` would have been scanned against a file that can never
implement one. The gate is silent today either way: no slot carries a state modifier, because none
of the four components implements a hover or a focus state.

**Angular:** there is no `arena-side-nav` primitive. The Angular path is the Material bridge —
`arena-material.css`'s `.arena-side-nav` rules dressing `mat-nav-list` — because `mat-nav-list`
already provides the anchor-or-button distinction, the active state and the keyboard behaviour.

**Why the three differ, and where:** the bridge declares **only colour, weight, font and
shape**. It declares **no geometry at all**, so on the Angular path an item's padding, gap and
row height are `mat-list-item`'s Material defaults, not React's and not the manifest's. The
bridge also uniquely sets `--mat-list-list-item-focus-label-text-color: var(--crimson)`, a focus
affordance neither of the other two has.

**The React-versus-Angular difference is not a defect in either.** It would be wrong for the
bridge to invent the focus colour's counterpart in React — `check:states` exists precisely to
catch a state a manifest asserts that its source does not implement — and the bridge is
deliberately partial: it dresses what Material renders rather than re-specifying Material's
layout, which is the whole reason SideNav stays a bridge.

**What is newly true of the Angular half: `mat-nav-list` is a flat list of links, and that is all
it is.** It provides no named section group and no nested disclosure, so the two shapes this batch
added to React have no counterpart inside the control the bridge dresses. Angular's declarations
reach *outside* `mat-nav-list` for both — `frameworks/angular/BehaviourDelegated.json` delegates
`SideNavSection` to the `matSubheader` directive and `SideNavCollapsible` to `MatExpansionPanel` —
and both of those entries state honestly that `arena-material.css` has no rule for their host
classes, so a subheader or an expansion panel used in an Arena sidebar renders in Material's own
colours, surface and typography rather than Arena's tokens. The single `.arena-side-nav` bridge
that dresses the list does not reach either of them.

**That is a question this batch registers and does not answer.** Whether Angular should gain an
`arena-side-nav` primitive covering the whole compound shape, or the bridge should grow rules for
the two undressed hosts, or the delegated claim should simply be narrowed to what `mat-nav-list`
really provides, is Plan D's decision — it is a decision about what the Angular layer *is*, not a
divergence to record, and nothing here commits it either way.

**Converges:** the colours already do, and the manifest now does — the debt this entry recorded as
the one thing to fix rather than record is paid, less the runtime indent, which is named above as
unmirrorable rather than outstanding. The geometry does not converge and should not — reconciling
that would mean overriding Material's own list metrics from the bridge, which is exactly the
duplication the bridge exists to avoid. The section and disclosure shapes are open, and open at
Plan D's level rather than this entry's. Recorded so that a reader comparing the three does not
mistake the Material gap for drift.

## How to add an entry

When you find a behavioural difference between layers:

1. Decide which behaviour is correct on its merits — not by which layer is older. The token layer
   settles anything about values; nothing settles behaviour automatically.
2. If one layer is simply wrong, fix it and add no entry.
3. If both are defensible, or one leads and the other has debt, add an entry here with the reason
   and whether it is expected to converge.
