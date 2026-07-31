# Arena — React layer

The React primitives, the example Console app, and the shared modules both of them read.
Every value here comes from `contracts/design/`; this layer introduces no design decision
of its own. For what those values mean, read
[`contracts/design/README.md`](../../contracts/design/README.md).

## Components carry no CSS classes

Each component renders with **inline `style` objects that read the CSS custom properties**
(`background: 'var(--crimson)'`), and handles hover, active and focus with local
`useState`. There is no `.btn` class to target; theming happens entirely through token
values, so changing a token moves every component that reads it.
`components/forms/button/Button.jsx` is the reference shape.

**The one exception is a `<style>` tag injected once**, for what an inline style genuinely
cannot express: `@keyframes`, and vendor pseudo-elements such as `Input`'s
`::-webkit-calendar-picker-indicator`. The pattern is always a module-level `let injected =
false` guard, a `useEffect`, and `document.head.appendChild` — never a `<style>` rendered
inside the component's own markup, which would ship one tag per instance and leak the CSS
into the element's `textContent`.

Inject as little as the job needs. Prefer keyframes alone and leave the `animation`
shorthand inline. Reach for a class of ours only when a selector is unavoidable — a media
query that changes duration, a pseudo-element, a background the keyframes animate — and
never as a shortcut around an inline style that would have worked.

## Every animation answers `prefers-reduced-motion`

The answer depends on what the motion means:

- Motion that reports work in progress **slows** rather than stops (`Spinner`,
  `ProgressBar`, `Button`) — a frozen spinner reads as a hung process.
- Decorative motion **stops** outright (`Skeleton`).
- An entrance **keeps its fade and drops its travel** (`Dialog`, `Menu`) — the movement is
  the vestibular trigger, the fade is the meaning.
- An opacity-only animation needs no clause at all (`Tooltip`): there is no motion to
  reduce.

## Layout

A component is a directory: `components/<category>/<component-kebab>/`. Everything
belonging to one component lives in it — its source, its types, its binding, its prompt,
its demo page and its suites.

Six categories: `forms/` (Button, IconButton, Input, Textarea, Select, Checkbox,
Radio/RadioGroup, Switch), `display/` (Card, Badge, Tag, Avatar, Table/TableRow/TableCell,
Skeleton, StatCard, Calendar/CalendarEvent, ActivityFeed, UnauthCard), `navigation/`
(Tabs/Tab, SegmentedControl, Breadcrumbs, Menu, Pagination, CommandPalette, BulkActionBar,
PageHead, SideNav and its family), `feedback/` (Alert, Dialog, ConfirmDialog, Toast,
Tooltip, EmptyState, ErrorState, ProgressBar, Onboarding, Spinner), `charts/` (ChartCard,
BarChart, LineChart, DoughnutChart — dependency-free SVG) and `brand/` (AppLogo).

A file that is not one component's rises to the narrowest level containing all of its
consumers, and a compound family counts as its parent rather than as the category. The
layer root holds the generated `Api.generated.d.ts` and `Tokens.generated.js` plus three
shared internals: `DataVisuals.js`, `UseContainerWidth.js` and `UseDialogModal.js` — that
last one because its suite counts as a consumer: its three component consumers are all in
`feedback/`, but `test/UseDialogModal.dom.test.jsx` is one too.

**`UseDialogModal.js` is a PORT of `frameworks/angular/FocusTrap.ts`, not a second design** —
the same focusable selector, the same boundary-wrap rule, the same never-cache-the-focusables
rule, the same open/close transition. It is one shape wider: Angular handles Tab only and keeps
Escape in each component's own `onKeydown`, where this hook folds Escape into the handler it
returns, always reporting through the component's **own** dismissal channel (`onClose`,
`onCancel`, `onSkip`), so meeting the pattern adds no member anywhere.

**Every natively-focusable clause in the selector carries its own `:not([tabindex="-1"])`**,
because a selector list is OR'd: `button:not([disabled])` alone would pull a real
`<button tabindex="-1">` back into the tab order. **The rule that a component is self-contained
is about CSS classes, not about JS helpers.**

**What a suite can prove about the trap, and what it cannot.** The boundary wrap is Arena's own
`.focus()` call and happy-dom honours `.focus()`, so it is asserted for real. The **interior** —
that Tab from a control in the middle reaches the next one — is the browser's native sequential
focus navigation, which neither layer implements and happy-dom does not have; a test asserting it
would pass identically against a perfect trap and against none. So the interior is checked by a
person in real Chromium against the written checklist in each component's `.prompt.md`.

- `ui-kits/console/` — the Delivery Console example app (login → dashboard → project).
- `vendor/` — a committed, generated CommonJS→ESM bundle of React for the demo pages'
  importmap (`build-vendor.mjs`, guarded by `check:vendor`).
- `test/` — the harness (`Harness.jsx`, `Preload.js`, `AssertPattern.jsx`) and the suites
  that belong to no one component.

## Every component is a quartet

`<Name>.jsx` (implementation), `<Name>.d.ts` (types), `<Name>.prompt.md` (usage and
examples) and an entry in a `*.card.html` demo. Adding a component means adding all four.

**The demo page is one of two shapes.** `<Name>.card.html` sits in the component's own
directory when the card is about that component alone; a page one level up, beside the
directories at its category level, composes several components onto one card
(`display/Display.card.html`, `navigation/MenuPagination.card.html`). A category-level page
belongs to no one component, which is why it sits there rather than inside any of them.

**Every `.prompt.md` carries examples and, where it adds value, a Do / Don't section.**

## Demos are compiled ahead of time

Each demo page's script is a real sibling source file (`<page>.entry.jsx`, e.g.
`Alert.card.entry.jsx` beside `Alert.card.html`), and every component `.jsx` plus every
`.entry.jsx` has a compiled `<Name>.generated.js` sibling — same directory, same stem — that
the page loads with a plain `<script type="module">`. `bun run build:demos` compiles them with
Bun's own transpiler and rewrites each relative import's `.jsx` extension to `.generated.js`;
`check:demos` guards drift and orphaned output.

**Those siblings are git-ignored**, along with the `vendor/` bundles: only demo pages read
them, and the `.jsx` is what a consumer copies. A fresh clone runs `bun run build` once — see
[`../../scripts/build/README.md`](../../scripts/build/README.md).

**Editing a component `.jsx` means running `bun run build:demos` in the same tree.** The
React DOM suites import the `.jsx` directly, so every test stays green with a stale `.js`
sibling while the demo pages render the old component.

## Two test invocations that must not merge

A `.dom.test.jsx` suite renders into a real DOM; every other `*.test.jsx` asserts on
`renderToStaticMarkup` with no DOM, by design, because those suites prove those components
render correctly server-side.

**What decides which invocation a suite belongs to is its filename, wherever the file
sits** — the `.dom.test.jsx` infix. The first invocation passes `frameworks/react` with
`--path-ignore-patterns='**/*.dom.test.jsx'`; the second passes the bare string
`.dom.test.jsx`, which `bun test` matches as a path substring.

They cannot merge because the DOM is installed by `--preload ./test/Preload.js`, which
registers happy-dom **process-wide**, and `bun test` shares one process across every path a
single invocation matches. A DOM registered in the DOM-free invocation's process would
quietly change what its suites prove with nothing failing to say so.

`test/` holds the harness plus the suites that are about no one component — and **those
include DOM ones**, so that directory's contents answer nothing about which invocation a
suite belongs to. Only the infix does.

**What forces the split all the way out to a third suite is `scripts/`.** Angular's single
registration site, `frameworks/angular/test/TestbedEnv.ts`, is guarded rather than throwing on
a second call, so merging it into the preloaded invocation does not itself collide. But a
happy-dom installed process-wide for the whole invocation replaces Bun's own `fetch`, which
turns a passing `scripts/lib/arena/static-server.test.mjs` fetch assertion into a cross-origin
failure. **The single authority for the whole command is `testStep()` in
`scripts/check/arena/check-all.mjs`**, whose `.test.mjs` sibling asserts the args array by
literal value; read it there rather than reconstructing one.

**The preload is not a convenience.** `react-dom` decides once, at its own module
evaluation, whether the browser supports the `input` event. If a DOM is not already
installed the flag latches false and React falls back to its legacy change-detection
polyfill, under which a dispatched `input` or `change` reaches an `onChange` handler
**zero** times, silently. Registering happy-dom from a module body is too late — ES imports
evaluate first — and so is registering it from a separate module imported ahead of
`react-dom/client`. Only a preload is early enough — both alternatives were measured, so do
not retry them. All three invocation sites pass it (`test:react-dom`, `test`, `testStep()`),
and `Harness.jsx` **throws** when `document` is missing rather than installing a fallback,
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
the token layer does not model. A handful of sites are exempt by name with a reason each —
read `EXEMPT` in `scripts/check/arena/check-dimension-literals.mjs` for the current set.

Responsive branches are JS, not media queries — inline styles cannot hold one — and they
measure the **container** via `useContainerWidth`, not the viewport.
