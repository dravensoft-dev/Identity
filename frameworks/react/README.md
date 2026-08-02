# Arena, the React layer

> **For whoever works on this layer.** Building an app with it instead? Read [`PACKAGE.md`](./PACKAGE.md) to install it,
> [`../Catalog.generated.md`](../Catalog.generated.md) to find a component, and that component's `.prompt.md` to use it.

The React primitives, the example Console app, and the shared modules both of them read.
Every value here comes from `contracts/design/`; this layer introduces no design decision
of its own. For what those values mean, read
[`contracts/design/README.md`](../../contracts/design/README.md).

**Published as `@dravensoft/arena-react`.** [`PACKAGE.md`](./PACKAGE.md) is what a consumer
reads, and the assembly copies it into `dist/` as the package README;
[`../PACKAGING.md`](../PACKAGING.md) is how the package is built and what it leaves out.

## This layer stands on the contracts alone

**It names no other framework layer and imports from none.** What a component is and what
members it presents is `contracts/api/components/<Name>.json`; what it must do is
`contracts/behaviour/`; what a value is, `contracts/design/`. Where another layer solves the
same problem differently, the contract is what makes the two answers comparable, and neither
implementation is the other's record. `bun run check:layer-independence` fails a file here that
cites a sibling layer, by import or in prose.

## Components carry no CSS classes

Each component renders with **inline `style` objects that read the CSS custom properties**
(`background: 'var(--crimson)'`), and handles hover, active and focus with local
`useState`. There is no `.btn` class to target; theming happens entirely through token
values, so changing a token moves every component that reads it.
`components/forms/button/Button.tsx` is the reference shape.

**The one exception is a `<style>` tag injected once**, for what an inline style genuinely
cannot express: `@keyframes`, and vendor pseudo-elements such as `Input`'s
`::-webkit-calendar-picker-indicator`. The pattern is always a module-level `let injected =
false` guard, a `useEffect`, and `document.head.appendChild`, never a `<style>` rendered
inside the component's own markup, which would ship one tag per instance and leak the CSS
into the element's `textContent`.

Inject as little as the job needs. Prefer keyframes alone and leave the `animation`
shorthand inline. Reach for a class of ours only when a selector is unavoidable (a media
query that changes duration, a pseudo-element, a background the keyframes animate) and
never as a shortcut around an inline style that would have worked.

## Every animation answers `prefers-reduced-motion`

The answer depends on what the motion means:

- Motion that reports work in progress **slows** rather than stops (`Spinner`,
  `ProgressBar`, `Button`), because a frozen spinner reads as a hung process.
- Decorative motion **stops** outright (`Skeleton`).
- An entrance **keeps its fade and drops its travel** (`Dialog`, `Menu`): the movement is
  the vestibular trigger, the fade is the meaning.
- An opacity-only animation needs no clause at all (`Tooltip`): there is no motion to
  reduce.

## Layout

A component is a directory: `components/<category>/<component-kebab>/`. Everything
belonging to one component lives in it: its source, its types, its binding, its prompt,
its demo page and its suites.

Six categories: `forms/` (Button, IconButton, Input, Textarea, Select, Checkbox,
Radio/RadioGroup, Switch), `display/` (Card, Badge, Tag, Avatar, Table/TableRow/TableCell,
Skeleton, StatCard, Calendar/CalendarEvent, ActivityFeed, UnauthCard), `navigation/`
(Tabs/Tab, SegmentedControl, Breadcrumbs, Menu, Pagination, CommandPalette, BulkActionBar,
PageHead, SideNav and its family), `feedback/` (Alert, Dialog, ConfirmDialog, Toast,
Tooltip, EmptyState, ErrorState, ProgressBar, Onboarding, Spinner), `charts/` (ChartCard,
BarChart, LineChart, DoughnutChart, all dependency-free SVG) and `brand/` (AppLogo).

A file that is not one component's rises to the narrowest level containing all of its
consumers, and a compound family counts as its parent rather than as the category. The
layer root holds the generated `Api.generated.ts` and `Tokens.generated.js` plus five
shared internals: `DataVisuals.ts`, `UseContainerWidth.ts`, `Theme.ts`, `AnchorActivation.ts`
and `UseDialogModal.ts`,
that last one because its suite counts as a consumer: its three component consumers are all in
`feedback/`, but `test/UseDialogModal.dom.test.tsx` is one too.

**`UseContainerWidth.ts`'s `readBreakpoint` warns once per name when a breakpoint token does not
resolve, and never caches the failure.** Every comparison against `NaN` is false, so a silent one
leaves `Table`, `Calendar` and `PageHead` on their wide branch on a phone with nothing reported,
and a cached one pins that for the life of the process. `test/UseContainerWidth.dom.test.tsx`
holds both halves. `forgetBreakpoints()` drops what was cached, for the two callers that need
it: a document that swapped its stylesheet at runtime, and a suite whose subject is the cache,
which would otherwise depend on which file the runner reached first.

**`useViewportBelow(name)` answers the other question, and it is a different one.**
`useContainerWidth` measures a box, which is what a component needs, because a component may be
rendered anywhere and the viewport says nothing about how much room it was given.
`useViewportBelow` measures the viewport, which is what a page layout needs and what a consumer
writing their own stylesheet cannot get any other way: a media query condition
holds no `var()`, so the threshold cannot be named from CSS at all. The query is
`not all and (min-width: N)`, the exact complement of the `md:` variant rather than a
`max-width` an epsilon short of it. **Reach for it for a page's own layout and never for a
component's**: a component that branches on the viewport is wrong the first time somebody puts
it in a narrow column.

**`AnchorActivation.ts` is the predicate behind the anchor convention**: an anchor Arena draws
cancels a primary click with no modifier and reports through its own navigation event, and
everything else is the browser's. `Card`, `Breadcrumbs`, `SideNavItem` and `CommandPalette` all
read it, `contracts/api/README.md` states the rule, and `test/AnchorActivation.dom.test.tsx`
holds each activation separately.

**`UseDialogModal.js` implements `contracts/behaviour/dialog-modal.json` for this layer, and
that contract is its only authority**, covering `focus.trap`, `focus.onOpen`, `focus.onClose` and
`keyboard.Escape`, in one hook because all three consumers need all four. Escape always reports
through the component's **own** dismissal channel (`onClose`, `onCancel`, `onSkip`), so meeting
the pattern adds no member to any contract.

**Every natively-focusable clause in the selector carries its own `:not([tabindex="-1"])`**,
because a selector list is OR'd: `button:not([disabled])` alone would pull a real
`<button tabindex="-1">` back into the tab order. **Never cache the focusables**, because a dialog's
content changes under it, and a cached list wraps to an element that has gone. **The rule that a
component is self-contained is about CSS classes, not about JS helpers.**

**What a suite can prove about the trap, and what it cannot.** The boundary wrap is Arena's own
`.focus()` call and happy-dom honours `.focus()`, so it is asserted for real. The **interior**,
meaning that Tab from a control in the middle reaches the next one, is the browser's native sequential
focus navigation, which nothing here implements and happy-dom does not have; a test asserting it
would pass identically against a perfect trap and against none. `bun run check:focus-trap` is
what covers it: real Chromium over each declared page, one real Tab press per stop.

- `ui-kits/console/`: the Delivery Console example app (login → dashboard → project).
- `vendor/`: a generated CommonJS→ESM bundle of React for the demo pages'
  importmap (`build-vendor.mjs`, guarded by `check:vendor`).
- `test/`: the harness (`Harness.tsx`, `Preload.js`, `AssertPattern.tsx`) and the suites
  that belong to no one component.

## Every component is a trio

`<Name>.tsx` (implementation and its exported `<Name>Props`), `<Name>.prompt.md` (usage and
examples) and an entry in a `*.card.html` demo. Adding a component means adding all three.

**There is no hand-written `.d.ts`, and that is the point.** The interface sits in the file
it describes, so it cannot disagree with the implementation beside it, and the declaration a
consumer installs is emitted from that source at assembly time rather than maintained by
hand. The layer whose recipe is a separate file carries one more.

**The demo page is one of two shapes.** `<Name>.card.html` sits in the component's own
directory when the card is about that component alone; a page one level up, beside the
directories at its category level, composes several components onto one card
(`display/Display.card.html`, `navigation/MenuPagination.card.html`). A category-level page
belongs to no one component, which is why it sits there rather than inside any of them.

**Every `.prompt.md` carries examples and, where it adds value, a Do / Don't section.**

## The layer answers to a compiler

`bun run check:react-types` runs `tsc` over `tsconfig.check.json`, strict, across every
component, helper and suite. It is the only thing that can catch a component disagreeing
with the interface declared beside it, and until the layer was TypeScript nothing could.
`tsc` runs under plain node, so unlike `check:demos` and `check:vendor` this gate never
skips a run.

**Two compiler options are load-bearing rather than stylistic, and both look deletable.**

`verbatimModuleSyntax` is on because Bun's `tsx` loader elides an `import type` and *keeps*
a value-form import used only as a type. `Api.generated` has no runtime counterpart, so
such an import survives into the compiled demo sibling and the browser asks for a module
that does not exist: a 404 on the page, with every gate green. With the option on it is a
compile error instead.

`erasableSyntaxOnly` is on because two transpilers compile this layer: `tsc` emits the
declarations and `Bun.Transpiler` emits the JavaScript. The option forbids `enum`,
`namespace` and parameter properties, which are the constructs that emit runtime code and
so the only ones where the two could disagree about what the module does.

**A test that violates a contract on purpose says so with `@ts-expect-error`.** A suite that
renders without a required member, to prove the runtime guard throws, is passing something
the contract refuses, and the directive is what tells the compiler that is the point. It
also expires by itself: when the error stops happening the directive becomes the error, so
the claim cannot go stale. `check:docs` reads it as a directive rather than as the file's
one allowed comment.

## Demos are compiled ahead of time

Each demo page's script is a real sibling source file (`<page>.entry.tsx`, e.g.
`Alert.card.entry.tsx` beside `Alert.card.html`), and every component `.tsx` plus every
`.entry.tsx` has a compiled `<Name>.generated.js` sibling, same directory and same stem, that
the page loads with a plain `<script type="module">`. `bun run build:demos` compiles them with
Bun's own transpiler and rewrites each relative import's `.tsx` extension to `.generated.js`;
`check:demos` guards drift and orphaned output.

**Those siblings are git-ignored**, along with the `vendor/` bundles: only demo pages read
them. A fresh clone runs `bun run build` once; see
[`../../scripts/build/README.md`](../../scripts/build/README.md).

**Editing a component `.tsx` means running `bun run build:demos` in the same tree.** The
React DOM suites import the `.tsx` directly, so every test stays green with a stale `.js`
sibling while the demo pages render the old component.

## Two test invocations that must not merge

A `.dom.test.` suite renders into a real DOM; every other `*.test.tsx` asserts on
`renderToStaticMarkup` with no DOM, by design, because those suites prove those components
render correctly server-side.

**What decides which invocation a suite belongs to is its filename, wherever the file
sits**, meaning the `.dom.test.` infix. The first invocation passes `frameworks/react` with
`--path-ignore-patterns='**/*.dom.test.*'`; the second passes the bare string
`.dom.test.`, which `bun test` matches as a path substring. Neither names an extension, so
the split survives a rename of the layer's sources.

They cannot merge because the DOM is installed by `--preload ./test/Preload.js`, which
registers happy-dom **process-wide**, and `bun test` shares one process across every path a
single invocation matches. A DOM registered in the DOM-free invocation's process would
quietly change what its suites prove with nothing failing to say so.

`test/` holds the harness plus the suites that are about no one component, and **those
include DOM ones**, so that directory's contents answer nothing about which invocation a
suite belongs to. Only the infix does.

**The split reaches past this layer**, because a process-wide happy-dom also replaces Bun's own
`fetch` and so decides which invocation `scripts/` may ride in. **The single authority for the
whole command is `testStep()` in `scripts/check/arena/check-all.mjs`**, whose header carries
that reasoning and whose `.test.mjs` sibling asserts the args array by literal value; read it
there rather than reconstructing one.

**The preload is not a convenience.** `react-dom` decides once, at its own module
evaluation, whether the browser supports the `input` event. If a DOM is not already
installed the flag latches false and React falls back to its legacy change-detection
polyfill, under which a dispatched `input` or `change` reaches an `onChange` handler
**zero** times, silently. Registering happy-dom from a module body is too late, because ES
imports evaluate first, and so is registering it from a separate module imported ahead of
`react-dom/client`. Only a preload is early enough: both alternatives are measured and
neither works, so do not retry them. All three invocation sites pass it (`test:react-dom`, `test`, `testStep()`),
and `Harness.tsx` **throws** when `document` is missing rather than installing a fallback,
which would silently run those suites under the legacy semantics. The preload must never
reach the DOM-free invocation.

## Running it

```bash
bun run demos          # serves the repo root on :8000 and prints the entry points
bun run test:react     # the DOM-free suites
bun run test:react-dom # the DOM suites, with the preload
```

`bun run check` runs every gate and the full suite; run it once when an implementation is
finished rather than before every commit.

## A dimension is a token or a derivation of tokens

A bare literal is a bug, and `bun run check:dimensions` fails on each one. A value passes
when it is `var(--token)`, a `calc()`/`min()`/`max()`/`clamp()` over one, zero, or a unit
the token layer does not model. A handful of sites are exempt by name with a reason each;
read `EXEMPT` in `scripts/check/arena/check-dimension-literals.mjs` for the current set.

Responsive branches are JS rather than media queries, because inline styles cannot hold one,
and they measure the **container** via `useContainerWidth`, not the viewport. The hook owns a
ref and returns it, and takes one when the caller already holds the box to measure, so an
inner panel does not have to become a component to be measured. It reports `null` until it
has measured, which is the wide branch: a component renders wide first and narrows when it
knows.
