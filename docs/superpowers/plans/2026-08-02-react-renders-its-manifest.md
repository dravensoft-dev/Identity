# React renders its manifest: migration plan

**Goal:** every component that is not an SVG chart renders the class string of its Tailwind
manifest, in both layers, and a gate stops a component from writing its appearance by hand
again.

**Architecture:** `frameworks/tailwind/` is the single source of a surface's appearance: one
manifest per surface, from which both framework layers derive their recipe. Angular already
consumes it in all 52 components in scope. React does not: 43 of those 52 still write their
appearance as inline `style` objects that read custom properties by hand. This plan migrates
those 43, one component at a time, reading each component's manifest and the contract its page
is generated from, and lands a gate first that records which ones are still pending.

**Tech stack:** Bun, TypeScript, Tailwind v4 through `tailwind-variants`, React 19, headless
Chromium over CDP for the visual gates.

---

## Context

The appearance is declared twice today, in two idioms, with nothing holding the two copies
equal. `check:parity` renders the 55 page pairs and all 55 paint identically, which is not
proof that they agree: it is proof that they agree **in the resting state the capture sees**.
Measured while planning, `Card` already diverges outside that capture: its manifest says
`focus-visible:ring-2 focus-visible:ring-primary` and its React says `outline: var(--bw-2)
solid var(--crimson)` with `outlineOffset: var(--sp-1)`. Nobody sees it because the capture
neither focuses nor hovers.

The outcome: the 52 components in scope render their manifest's class string in both layers,
the only thing that survives inline is a value computed at runtime, and a gate keeps it that
way.

## Who the authority is

This governs every task and is not renegotiated per component.

- **A component's authority is its manifest**, read beside the contract its page is generated
  from: `contracts/api/components/<Name>.json` and `frameworks/demos/<Name>.demo.json`.
- **No layer reads the other.** That Angular already complies is a fact about the state of the
  work, not a reference. During a migration the component's Angular source **is not opened**.
  `check:layer-independence` already forbids the citation; this forbids the glance.
- **Where the manifest and today's React disagree, the manifest wins**, even where that changes
  React's appearance. The `Card` case above resolves that way: React draws the ring, not the
  outline.
- **`check:parity` is a net, not a guide.** It exists to catch something that was already right
  breaking, and it stays at 55 of 55 with `DIVERGENT` empty. Where a component breaks it, the
  question is "what does the manifest say and who is not following it", never "what does the
  other layer do". Only once the migration is covered and an inequality survives is looking at
  both layers to decide it legitimate.

## Measured state (2026-08-02, branch `refactor/equal-react-components-manifests-implementation`)

| Measure | Command | Value |
|---|---|---|
| Components | `find frameworks/{react,angular}/components -mindepth 2 -maxdepth 2 -type d \| wc -l` | 55 per layer |
| Fixtures | `ls frameworks/demos/*.demo.json \| wc -l` | 55 |
| Manifests | `find frameworks/tailwind/components -name '*.manifest.json' \| wc -l` | 43 |
| Manifest modules emitted to React | `find frameworks/react -name '*.manifest.generated.ts' \| wc -l` | 43 |
| React already rendering its manifest | `grep -rln "manifest.generated" frameworks/react/components --include='*.tsx'` | 9 |
| Angular with its own recipe | `find frameworks/angular/components -name '*.variants.ts' \| wc -l` | 48 |
| Angular importing the parent's recipe | `grep -rn "variants'" frameworks/angular/components --include='*.ts' \| grep '\.\./'` | 4 |
| Steps in `bun run check` | `GATES.length` + 3 | 42 |
| `DIVERGENT` in `check-parity.mjs` | direct read | empty |
| `CLAUDE.md` budget | `node -e "console.log(require('fs').readFileSync('CLAUDE.md','utf8').length)"` | **59,975 / 60,000** |

**Scope: 52** = 55 minus `BarChart`, `DoughnutChart`, `LineChart`. **43 remain.**

**The nine with no manifest of their own** read the parent's, which already is implementing the
manifest: `CalendarEvent` to `Calendar`, `TableRow` and `TableCell` to `Table`, `Tab` to
`Tabs`, `BottomNavItem` to `BottomNav`, `SideNavItem`, `SideNavSection` and `SideNavCollapsible`
to `SideNav`, `RadioGroup` to `Radio`. The first three are already migrated in React.

`MANIFEST_COVERS`, in `scripts/check/arena/check-manifest-states.mjs`, declares eight of those
nine relations. **It is missing `Radio` to `[Radio, RadioGroup]`**, and that entry is part of
the work: `affordancesFor()` takes a union, so adding it can only widen the declared set and
can never fail something that passes today. Verify by running the gate before and after.

**Orphan risk in `check:dimensions`, measured: none.** Its nine `EXEMPT` entries name
`BarChart.tsx`, `LineChart.tsx`, `Calendar.tsx` and the two `DataVisuals.ts`. None of the 43
has an entry. The real movement is the other way: a migration may **need** a new entry where a
computed value that survives inline lands on a governed property with a bare number. Changing
the map is changing `check-dimension-literals.test.mjs`, which asserts on it by name.

**The plumbing is in place and verified:** `frameworks/react/Tv.generated.ts` exists, the 43
`<X>.manifest.generated.ts` modules are emitted beside each React component,
`tailwind-variants` and `tailwind-merge` are dependencies of the React package, and
`build-react-package.mjs` already copies `frameworks/tailwind/Utilities.generated.css` to
`css/utilities.css`. `tailwind-compile.mjs` compiles with
`@source '<components>/**/*.manifest.json'`, so **every class in a manifest compiles whether or
not anything uses it yet**: the published package already serves what React is about to start
rendering. There is no packaging work.

## Global constraints

- **Iteration**: `bun scripts/build/react/build-demos.mjs`, measured at 0.13 s over 173 files.
- **Probe** (Task 1): one pair in Chromium, seconds.
- **Net**: `bun run check:parity`, 55 pairs, around eight minutes. At a group boundary, not per
  commit.
- **Suites**: `bun run test`, which is literally what `testStep()` in
  `scripts/check/arena/check-all.mjs` invokes. **Never a bare `bun test frameworks/react`**: it
  never matches `scripts/`, and these commits touch `scripts/`.
- An interrupted browser run leaves Chromium behind and starves the next one:
  `pkill -f 'chrom.*--headless'` before retrying.
- A dimension in a layer is a token or a derivation of tokens. No literals.
- No file under `frameworks/<A>` names layer B. The edge into `tailwind` runs one way and only
  from Angular; React reaches its manifest through the module emitted inside its own layer.
- `check:docs` holds every `.md` under 60,000 characters. Measure with
  `node -e "console.log(require('fs').readFileSync('X','utf8').length)"`, never `wc -m`.
  **`CLAUDE.md` has 25 characters of headroom**, so any sentence that lands there has to buy
  the space by moving prose into its layer's README. `docs/` is exempt from both the size rule
  and the prose rule, so this document is under neither.
- Debt goes to a gate with a reason map, to a suite or to a `.prompt.md`. Never to a paragraph.
- A commit message containing a backtick is written with a quoted here-doc.

## Decisions this plan settles

1. **The manifest is the authority.** The layers do not read each other; the probe and
   `check:parity` say only *that* there is an inequality, never *who* is right.
2. **The anti-regression gate lands first**, with a `PENDING` map of 43 entries that empties
   itself. Each commit deletes its own, and the stale-entry rule the repository already applies
   to `EXEMPT` and `DIVERGENT` forces the deletion. `bun run check` stays green from commit 1
   and progress is machine-checked rather than written in prose.
3. **The React half of `check:states` is re-aimed rather than retired**: it reads `HAND_DRAWN`,
   the set that still draws by hand, which today is exactly the three SVG charts. The charts
   are then declared with a reason and read by two gates instead of absent in silence.
4. **The computed / declared line is the gate's rule**, not a convention: if every branch of a
   value is a literal it belongs in the manifest; if any branch reads an identifier or an
   interpolation it is a computation and stays inline. `CalendarEvent`, already migrated, is the
   exemplar: it keeps `{...box, background: color-mix(... ${color} ...), borderLeftColor: color}`.
5. **One commit per component** in the groups carrying state, injection, geometry or
   composition; a whole family is one commit; up to four per commit in the flat-surface group.
6. **`check:parity` is a net and not a guide**, and runs at a group boundary.

## File structure

| File | Responsibility |
|---|---|
| `scripts/lib/tailwind/manifest-surfaces.mjs` | The two shared facts about surfaces: `MANIFEST_COVERS` (moved out of `check-manifest-states.mjs`, plus the `Radio` entry) and `HAND_DRAWN`. It lives here rather than in a gate because it is a fact about the Tailwind layer, and because the two gates that need it would import in a cycle if it lived in either. |
| `scripts/lib/tailwind/manifest-surfaces.test.mjs` | Asserts both maps by name, the parent-to-child resolution, and that no name is unknown. |
| `scripts/check/arena/check-appearance.mjs` | The gate. Two halves: **adoption** (every component in scope renders its manifest, in both layers) and **literals** (no style value made only of literals in the React layer). Carries `PENDING` and `EXEMPT`, each with a reason and each with a staleness rule. |
| `scripts/check/arena/check-appearance.test.mjs` | Asserts `PENDING` and `EXEMPT` by name, the `dist/` exclusion, the empty-set guards, and the literal / computed classifier over synthetic cases. |
| `scripts/check/arena/parity-probe.mjs` | The probe: one or more pairs, in one Chromium, with the gate's own diff. **It is not a gate**, it does not join `GATES`, and its output always names how many pairs it did **not** compare so it can never read as the gate. Precedent: `check-release.mjs`. |
| `scripts/check/arena/parity-probe.test.mjs` | Asserts that a name matching no pair fails, and that an empty selection fails. |

Existing files, with the pattern stated once:

- `frameworks/react/components/<cat>/<kebab>/<Name>.tsx`, the 43. The change is the same every
  time; the recipe is below.
- The suites beside each one, where assertions on inline style are re-expressed.
- `frameworks/tailwind/components/<cat>/<kebab>/<Name>.manifest.json`, only where the manifest
  falls short and growing it is the decision.
- `frameworks/react/components/navigation/side-nav/SideNavInject.tsx`, the `SideNav` family's
  style helper, which collapses to injection plus `indentFor()`.
- `scripts/check/arena/check-manifest-states.mjs` and its suite, where the React half is
  re-aimed.
- `scripts/check/arena/check-dimension-literals.mjs`, which **exports** its lexers
  (`blankComments`, `skipString`, `readValue`, `expressionLeaves`, `PROP_COLON`) so the new gate
  reuses them instead of duplicating them. Precedent: `check-arbitrary-values.mjs` imports
  `UNMODELLED_UNITS` from it.
- `scripts/check/arena/check-all.mjs` and `check-all.test.mjs`, one more gate in `GATES` (39 to
  40, and 42 to 43 steps); the suite asserts the domain partition.
- `package.json`, for `check:appearance` and `probe:parity`.
- Documentation, at the close (Task 31).

---

## The recipe, written once

Every component task runs exactly this. It is cited rather than repeated.

- [ ] **1. Read the source, in this order, and nothing else.**
  `contracts/api/components/<Name>.json` (members and `affordances`),
  `frameworks/demos/<Name>.demo.json` (what its page renders),
  `frameworks/tailwind/components/<cat>/<kebab>/<Name>.manifest.json` (slots, variants,
  defaultVariants). **Do not open `frameworks/angular/components/.../<Name>.ts`.**

- [ ] **2. Map every element React draws onto a manifest slot.**
  An element with no slot, or a slot with no element, is the question to answer **now**, with
  two exits and a written reason either way:
  - **Grow the manifest**, which is the source. Angular changes too, because it renders the same
    manifest, and that is correct: both follow the source. A manifest that grows brings
    `check:tailwind`, `check:coverage`, `check:arbitrary`, `check:radius`,
    `check:surface-parity` and `bun run test:angular` with it.
  - **Leave that piece out, declared**: an entry in `check:appearance`'s `EXEMPT` with its
    reason, or, where it is a computed value, it survives inline and needs no declaration.

- [ ] **3. Replace appearance with a class.**
  ```tsx
  import { tv } from '../../../Tv.generated.ts';
  import manifest from './<Name>.manifest.generated.ts';   // or '../<parent-kebab>/<Parent>.manifest.generated.ts'

  const <name>Styles = tv(manifest);
  // inside the component:
  const styles = <name>Styles({ tone, disabled });          // the manifest's own variants
  <span className={styles.root()}>
  ```
  `frameworks/react/components/display/tag/Tag.tsx` is the minimal shape;
  `frameworks/react/components/display/calendar-event/CalendarEvent.tsx` is the shape with the
  parent's manifest and a computation that survives.

- [ ] **4. Apply the computed / declared line.**
  Only a value computed at runtime from data or from a measurement survives inline. A chip's
  position from an hour survives; a background that depends on an API boolean does not, because
  that is a variant. The operative rule is the gate's: if every branch of the value is a
  literal, it goes to the manifest.

- [ ] **5. Delete the state that existed only to paint.**
  The hover, active and focus `useState`, its `onMouseEnter`, `onMouseLeave`, `onFocus` and
  `onBlur`, and sometimes the injected `<style>`. **Keep** a handler that drives behaviour
  rather than appearance: `Tooltip`'s open delay, `Menu`'s roving focus.

- [ ] **6. Merge adjacent text nodes.**
  A space emitted as its own node shifts the text by a hundredth of a pixel, which is hundreds
  of antialiasing pixels in the diff. `{a}{' '}{b}` becomes one node.

- [ ] **7. Compile and probe.**
  ```bash
  bun scripts/build/react/build-demos.mjs        # around 0.13 s
  bun run probe:parity <Name>
  ```
  Iterate here. The probe prints the pixel count and the bounding box of the diff, which is what
  says **where** to look.

- [ ] **8. Re-express the suites, deleting no assertion.**
  ```bash
  D=frameworks/react/components/<cat>/<kebab>
  grep -n "\.style\.\|getPropertyValue\|style=\|getAttribute('style')" $D/*.test.tsx
  ```
  Every assertion on `style.background === 'transparent'` or `style.flexDirection` is
  re-expressed against the class now rendered. The property it protected is usually real, and in
  at least one of the previous nine it uncovered a gap both layers shared. Where an assertion is
  genuinely not re-expressible, say why in the commit.

- [ ] **9. The cheap gates, per commit.**
  ```bash
  bun run test                    # the merged form; never the narrowed one
  bun run check:appearance
  bun run check:dimensions
  bun run check:states
  bun run check:react-types
  bun run check:layer-independence
  # only where a manifest grew:
  bun run check:tailwind && bun run check:coverage && bun run check:arbitrary \
    && bun run check:radius && bun run check:surface-parity && bun run test:angular
  ```

- [ ] **10. Delete the component's `PENDING` entry and commit.**
  Left in place, `check:appearance` fails on a stale entry. Deleted without migrating, it fails
  on adoption. The map cannot be left wrong in either direction.

---

## The order of the 43, and what each group teaches

Ordered so that whatever reveals a short manifest earliest goes first, rather than whatever is
easiest. Group E, the largest and safest, goes last precisely because it teaches nothing new;
nothing depends on it and it can be pulled forward at any point.

### A: the pilot (1 component, 1 commit)

`Card`.

Chosen because it concentrates every decision in one component: surface, border, radius,
shadow, three variants (`accent`, `floating`, `interactive`), the `<a>` versus
`<div role="button">` split, and hover **and** focus in JS. And because it carries a measured
disagreement between manifest and React that no gate sees today, so it forces the authority rule
to be exercised for real rather than in the abstract. It teaches the authority rule, the
disappearance of the painting `useState`, suite re-expression, and it calibrates the probe.

### B: hover and focus state in JS (6 components, 6 commits)

`IconButton`, `Breadcrumbs`, `SegmentedControl`, `Menu`, `CommandPalette`, `Tooltip`.

The pilot's cause, repeated. This is where a manifest is likeliest to fall short, because a
state is the last thing written into a class string. `Menu` and `Tooltip` also inject a
`<style>`; they sit here because their hard part is the state, not the keyframe. `Tooltip` keeps
its open delay: that is behaviour, and `--delay-open` is a behaviour token, not an appearance
one.

### C: forms, the native control's own chrome (7 components, 6 commits)

`Input`, `Textarea`, `Select`, `Checkbox`, `Radio` with `RadioGroup` (one commit), `Switch`.

Shared cause: a native control brings its own chrome, and part of it is not expressible as an
inline style, which is exactly why six of these seven inject a `<style>`. It teaches what the
manifest absorbs (`placeholder:`, `accent-*`, `caret-*`, `file:`) and what stays injected by
force (`::-webkit-calendar-picker-indicator`). `RadioGroup` rides with `Radio` because it reads
its manifest, and that commit is also the one adding `Radio` to `[Radio, RadioGroup]` in
`MANIFEST_COVERS`.

Watch the four `.prompt.md` files that speak of inline style or of `className` today: `Input`,
`Select`, `Textarea` and `CalendarEvent`, the last already migrated. Each is corrected in its
component's commit, in that layer's idiom, citing no contributor document.

### D: motion (3 components, 3 commits)

`Skeleton`, `Spinner`, `ProgressBar`.

All three inject `@keyframes`. It teaches how much of an animation fits in the manifest
(`animate-*`, `duration-[var(--loop-*)]`, `motion-reduce:`) and how much stays injected. The
constraint that must not slip: the four answers to `prefers-reduced-motion` that
`contracts/design/README.md` fixes still hold, and they differ per component. `Spinner` and
`ProgressBar` slow; `Skeleton` stops. `Skeleton` is also the system's one exception to the ban
on gradients.

### F: overlay and measured geometry (5 components, 5 commits)

`Dialog`, `ConfirmDialog`, `Sheet`, `Onboarding`, `ToastHost`.

Shared cause: they live on the overlay stack (`--z-modal`, `--z-modal-nested`, `--z-sheet`,
`--z-onboarding`, `--z-nav`), they carry a scrim, they read the safe-area insets in
`contracts/design/environment.css`, and `Onboarding` measures as well. This is where the
computed / declared line gets finest: a `--z-*` is a token and goes to the manifest; a position
derived from `getBoundingClientRect()` is a computation and stays. `ConfirmDialog` draws the
system's one filled danger surface and its manifest already covers `Button`, so its commit
touches the parent / compound relation without being a family. Run `check:focus-trap` when the
group closes: it is a browser gate and these are its pages.

### G: compound families (8 components, 3 commits)

`Tabs` with `Tab`; `BottomNav` with `BottomNavItem`; `SideNav` with `SideNavItem`,
`SideNavSection` and `SideNavCollapsible`.

A family is one commit: React pushes with `cloneElement`, so a parent already rendering classes
over children still carrying `style` leaves the tree half painted. They come after the earlier
groups because the parent's manifest has to be settled before three children read it.

What is specific here: the `SideNav` family keeps its appearance in a shared helper,
`frameworks/react/components/navigation/side-nav/SideNavInject.tsx`, which exports `COLUMN`,
`rowStyle()`, `rowBadge()` and `rowGlyph()`. That helper collapses to `injectInto()` and
`indentFor(indentStep, depth)`, the textbook survivor, because `depth` is a runtime value and
`indentStep` arrives from the consumer as a **multiplier** of `--sp-1` rather than as a length.
`frameworks/react/components/navigation/NavRow.ts` carries no appearance and is not touched.

### E: flat surface (13 components, 4 commits)

- E1, display: `Avatar`, `Badge`, `StatCard`, `UnauthCard`
- E2, feedback: `Alert`, `EmptyState`, `ErrorState`, `Toast`
- E3, navigation and layout: `PageHead`, `Pagination`, `Grid`
- E4, brand and charts: `AppLogo`, `ChartCard`

Background, border, radius, type, and nothing else. Four per commit because they share a
category and because none of them grows a manifest: a reviewer can reject the whole commit
without losing anything from another group. `UnauthCard` is the one with an escort: its `panel`
slot types out `Card.root`'s surface by hand and `check:surface-parity` already watches it, so
that commit runs that gate. `PageHead` measures its container and `Grid` computes
`gridTemplateColumns`; both computations survive.

## How much fits in a commit

`bun run check` stays available throughout: the new gate lands with its map full and the current
42 steps stay green from commit 1.

- **One component per commit** in A, B, C, D and F. These carry state, injection or geometry,
  and they are where a reviewer can reject one and approve its neighbour.
- **One family per commit** in G.
- **Up to four per commit** in E, grouped by category.
- The branch's own precedent supports both sizes: `a3eba1f` migrated four at once with plumbing,
  while `Calendar`, `CalendarEvent` and the `Table` family were commits of their own.
- **Per commit**, the cheap gates in step 9 of the recipe.
- **At a group boundary**, the expensive ones: `check:parity`, `check:playgrounds`,
  `check:cards`, and `check:focus-trap` when F closes.
- **`bun run check` in full** once, at the end (Task 32), which is what CLAUDE.md calls a
  completion gate.

---

## Task 0: this plan, in the tree

- [ ] **0.1** Write this document to
  `docs/superpowers/plans/2026-08-02-react-renders-its-manifest.md`.
- [ ] **0.2** `bun run check:docs`
- [ ] **0.3** Commit: `Write down the plan React's appearance is converging on`

## Task 1: the probe

**Files:** create `scripts/check/arena/parity-probe.mjs` and `parity-probe.test.mjs`; modify
`package.json`.

**Interfaces:**
- Consumes: `pairPages`, `comparePair`, `describe`, `differs` from `./check-parity.mjs`;
  `startStaticServer`, `findChromium`, `launchChromium`, `connect` from `../../lib/arena/`.
- Produces: `selectPairs(names: string[], pairs: Pair[]) -> { selected: Pair[], problems: string[] }`

- [ ] **1.1 Write the failing suite.** In `parity-probe.test.mjs`, which rides `scripts/` and so
  also runs under plain node: **import nothing from a framework layer.**

```js
test('selectPairs refuses a name that matches no pair', () => {
  const pairs = [{ component: 'Card' }, { component: 'Tag' }];
  const { problems } = selectPairs(['Crad'], pairs);
  assert.match(problems.join('\n'), /Crad/);
});

test('selectPairs refuses an empty selection', () => {
  const { problems } = selectPairs([], [{ component: 'Card' }]);
  assert.match(problems.join('\n'), /nothing/);
});
```

- [ ] **1.2 Run it and watch it fail.**

Run: `bun test scripts/check/arena/parity-probe.test.mjs`
Expected: FAIL, `selectPairs is not a function`.

- [ ] **1.3 Write the probe.** One header block, at most ten lines, saying what it is and what
  it is not. Per pair it prints `describe()` or `identical`. The final line is mandatory and has
  the shape `probe: compared N of 55 pair(s); the other M were not looked at, so this says
  nothing about them`. An optional `--shots=<dir>` writes `<Component>.<layer>.png`, because
  seeing where the diff is saves more time than guessing it. Exit 1 where any pair differs.

- [ ] **1.4 Run it and watch it pass**, then exercise it for real.

Run: `bun run probe:parity Tag`
Expected: `identical`, since `Tag` is migrated.

Run: `bun run probe:parity Crad`
Expected: FAIL naming `Crad`.

- [ ] **1.5** Add to `package.json`:
  `"probe:parity": "bun scripts/check/arena/parity-probe.mjs"`.

- [ ] **1.6** Confirm the probe does **not** join `GATES` and that no existing suite requires it
  to: run `bun test scripts` in full. Where `script-imports.test.mjs` or `check-all.test.mjs`
  walk the directory and expect every `.mjs` to be a gate, adjust that suite by naming the probe
  with its reason, never by widening the filter in silence.

- [ ] **1.7 Commit:** `Give the migration a probe that says what it did not look at`

## Task 2: the shared fact and the gate

**Files:** create `scripts/lib/tailwind/manifest-surfaces.mjs` and its suite,
`scripts/check/arena/check-appearance.mjs` and its suite; modify
`scripts/check/arena/check-manifest-states.mjs` and its suite,
`scripts/check/arena/check-dimension-literals.mjs`, `check-all.mjs` and its suite,
`package.json`.

**Interfaces produced:**

```
manifest-surfaces.mjs
  MANIFEST_COVERS: Map<string, { covers: string[], reason: string }>
  HAND_DRAWN:      Map<string, string>          // name -> reason
  manifestFor(name): string | null              // the manifest that draws its surface
  inScope(): string[]                           // Components.json minus HAND_DRAWN
check-appearance.mjs
  PENDING: Map<string, string>
  EXEMPT:  Map<string, string>
  literalStyleProblems(text, path): Problem[]
  adoptionProblems(name): Problem[]
```

- [ ] **2.1 Move the shared fact.** `MANIFEST_COVERS` leaves `check-manifest-states.mjs` for
  `scripts/lib/tailwind/manifest-surfaces.mjs`, with the new entry:

```js
['Radio', {
  covers: ['Radio', 'RadioGroup'],
  reason: 'One manifest draws the whole group: the fieldset and its legend are RadioGroup\'s '
    + 'and every control in it is Radio\'s. The group carries no manifest of its own because '
    + 'it has no surface of its own.',
}],
```

- [ ] **2.2 Declare the charts.** In the same module:

```js
export const HAND_DRAWN = new Map([
  ['BarChart', 'draws geometry rather than a surface: bar rectangles positioned from the '
    + 'data\'s own range against a measured inner height. A class string cannot describe a '
    + 'shape whose coordinates are the data, so it has no manifest, writes its own appearance, '
    + 'and is what the react half of check:states reads.'],
  ['DoughnutChart', 'the same, for arc paths swept from each slice\'s share of the total.'],
  ['LineChart', 'the same, for a polyline whose points are the series projected onto the '
    + 'measured plot area.'],
]);
```

- [ ] **2.3 Verify that moving the map does not move the verdict.**

Run: `bun run check:states` before and after.
Expected: identical output. The `Radio` entry only widens the declared set through
`affordancesFor()`, which takes a union, so it cannot fail anything that is green.

- [ ] **2.4 Re-aim the React half of `check:states`.** It stops walking the 55 names in
  `Components.json` and walks `HAND_DRAWN` instead. Add the empty-set guard in the shape the
  gate already uses for `zeroReactSourceProblems`: an empty `HAND_DRAWN` means the React half
  has no subject, and **that is a failure**, not a clean pass. Update
  `check-manifest-states.test.mjs`, which asserts on the maps by name, and the gate's header,
  which says today that Angular is the structurally unaskable layer: the claim now is that
  **both** layers are, in the migrated components, and that the React half's subject is the set
  that still draws by hand.

- [ ] **2.5 Export the lexers** from `check-dimension-literals.mjs` (`blankComments`,
  `skipString`, `readValue`, `expressionLeaves`, `PROP_COLON`) instead of duplicating them. Its
  suite stays green unchanged; only visibility moves.

- [ ] **2.6 Write the gate's failing suite.** Synthetic cases for the classifier:

```js
// literal -> fails
ok(literalStyleProblems(`<i style={{ background: 'var(--crimson)' }} />`, 'X.tsx').length);
ok(literalStyleProblems(`<i style={{ opacity: disabled ? 0.45 : 1 }} />`, 'X.tsx').length);
ok(literalStyleProblems(`const BAR: React.CSSProperties = { display: 'flex' };`, 'X.tsx').length);
// computed -> passes
equal(literalStyleProblems(`<i style={{ borderLeftColor: color }} />`, 'X.tsx').length, 0);
equal(literalStyleProblems(`<i style={{ height: \`\${rawH}px\` }} />`, 'X.tsx').length, 0);
equal(literalStyleProblems(`<i style={{ ...box }} />`, 'X.tsx').length, 0);
```

  Plus: `dist/` excluded; a `PENDING` name that names nothing fails; a `PENDING` name already
  migrated fails asking for the entry to be deleted; an empty scope fails; zero sources read
  fails.

- [ ] **2.7 Run it and watch it fail.**

- [ ] **2.8 Write the gate.** One header block, at most ten lines.
  - **Adoption half.** For each name in `inScope()`: in React, the source
    `frameworks/react/components/<cat>/<kebab>/<Name>.tsx` imports `tv` from a `Tv.generated`
    specifier and a specifier ending in `${manifestFor(name)}.manifest.generated`; in Angular,
    the source `<Name>.ts` references a `*Styles` recipe imported from a `*.variants`. A name in
    `PENDING` skips this half, and where it passes anyway its entry is stale and **fails**.
  - **Literal half, React only.** Walk `frameworks/react/components/**`, skipping `dist/`,
    `.test.`, `.generated.` and `.demo.`. Find style objects in three positions: `style={{...}}`
    in JSX; a constant annotated `React.CSSProperties`; the body of a function whose return type
    is `React.CSSProperties`. Split each property's value with `expressionLeaves()` and **fail
    where every leaf is a literal** (a string with no `${}`, a number, `true`, `false`, `null`,
    `undefined`). An `EXEMPT` keyed `<path>:<prop>:<value>` with a reason forgives it.
  - **Staleness** in three directions: a `PENDING` entry already migrated, a `PENDING`, `EXEMPT`
    or `HAND_DRAWN` entry naming nothing, and empty sets.
  - **Blind spots declared in the header**: a style object assembled with `Object.assign` or a
    computed spread; a style value arriving as a prop from another module; and the Angular half
    of the same question, `[style.x]="<literal>"`, which is the blind spot `check:dimensions`
    already declares and which this gate does **not** close.

- [ ] **2.9 Populate `PENDING`** with the 43 entries and their reason, grouped by group letter.

- [ ] **2.10 Run it and watch it pass.**

Run: `bun run check:appearance`
Expected: exit 0, naming how many are still pending. Then delete one `PENDING` entry by hand and
run again: expected FAIL, so the gate is known to bite.

- [ ] **2.11** Register the gate: `GATES` in `check-all.mjs` under the `arena` domain, the
  partition in `check-all.test.mjs`, and
  `"check:appearance": "bun scripts/check/arena/check-appearance.mjs"` in `package.json`.

- [ ] **2.12** Run `bun run test` and `bun run check --domain=arena,tailwind --no-tests`.

- [ ] **2.13 Commit:** `Say where a component's appearance comes from, and hold it there`

## Tasks 3 to 30: the 43 components

Each runs the recipe. The order and the groupings are the ones above.

| # | Task | Components | Boundary |
|---|---|---|---|
| 3 | A, pilot | `Card` | probe, then full `check:parity` |
| 4-9 | B, state in JS | `IconButton`, `Breadcrumbs`, `SegmentedControl`, `Menu`, `CommandPalette`, `Tooltip` | `check:parity` at the close |
| 10-15 | C, forms | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio` with `RadioGroup`, `Switch` | `check:parity` and `check:playgrounds` at the close |
| 16-18 | D, motion | `Skeleton`, `Spinner`, `ProgressBar` | `check:parity` at the close |
| 19-23 | F, overlay | `Dialog`, `ConfirmDialog`, `Sheet`, `Onboarding`, `ToastHost` | `check:parity` and `check:focus-trap` at the close |
| 24-26 | G, families | `Tabs` + `Tab`; `BottomNav` + `BottomNavItem`; `SideNav` + 3 | `check:parity` at the close |
| 27-30 | E, flat surface | E1 display; E2 feedback; E3 nav and layout; E4 brand and charts | `check:parity` and `check:cards` at the close |

Task 3 also runs `check:parity` in full, for the first reference point after a component changes
how it renders.

## Task 31: the documentation the migration makes false

None of these is optional: each is a claim that stops being true the day the last component
migrates.

- [ ] **31.1 `frameworks/react/README.md`** (19,290 characters, there is room). The section
  "Components carry no CSS classes" changes title and content: React renders its manifest's
  class string, and the only difference from Angular is how each layer reaches it. **Keep the
  `@layer base` paragraph intact**: it is still true and still explains a real silent failure
  (13.33px Arial). Rewrite the injected `<style>` paragraph: it still exists, but it is now what
  **no class** can express rather than what an inline style could not, and the list of cases
  shortens to whatever survives C and D. Add the layer's new rule: what survives inline is a
  computation, and `check:appearance` is what holds it.

- [ ] **31.2 `CLAUDE.md`**, with **25 characters of headroom**. The sentence to replace, in
  *Architecture*: "React renders inline `style` objects reading the custom properties and
  carries **no class at all**, Angular renders the shared recipe's class string". It becomes a
  statement that both layers render the shared recipe's class string, each reaching it in its
  own idiom, that `check:appearance` fails one that writes its appearance by hand, and that
  `HAND_DRAWN` names the three that still do. **Measure before and after** with `node -e`, and
  buy the space by reducing the injected-`<style>` clause to a pointer, since its content
  already lives in full in React's README.

- [ ] **31.3 `frameworks/react/PACKAGE.md`**, the page npm shows. Lines 3 and 4 say "55
  components styled entirely by design tokens, with no stylesheet to override". After the
  migration a consumer can reach the classes by specificity. Rewrite the claim so it is true,
  and check that `css/utilities.css` is described as what it now is: not an accessory for
  `@layer base` but the sheet that draws the components.

- [ ] **31.4 `scripts/check/arena/README.md`** (12,656 characters): add `check:appearance` (what
  it reaches, what it does not, and its two declared blind spots) and the probe (what it is and
  why it is not a gate).

- [ ] **31.5 `frameworks/tailwind/README.md`** (27,690 characters): the "P1: invented states"
  section, which explains today that Angular is structurally unaskable, becomes a statement that
  both layers are, in the migrated components, and that the React half's subject is
  `HAND_DRAWN`.

- [ ] **31.6 Sweep the names.** For each migrated component, CLAUDE.md's own command:

```bash
for X in Card IconButton Breadcrumbs ... ; do
  grep -rn --binary-files=without-match "\b$X\b" \
    --include='*.md' --include='*.json' --include='*.mjs' --include='*.tsx' --include='*.ts' \
    CLAUDE.md DOUBTS.md contracts/api/ contracts/behaviour/ docs/ frameworks/ scripts/
done
```

  Drop by hand the hits under `X`'s own files. **Do not filter with `grep -v` after a
  `grep -n`**: scope by path list.

- [ ] **31.7** Run `bun run check:docs` and the four `node -e` measurements.

- [ ] **31.8 Commit:** `Say in both branches where a component's appearance now comes from`

## Task 32: close

- [ ] **32.1** `PENDING` is empty. Delete the map from `check-appearance.mjs` along with the
  code that consults it and its suite cases: an empty map says nothing, and the gate becomes
  unconditional. Update `check-appearance.test.mjs`.

- [ ] **32.2** Run `bun run build` in a clean tree.

- [ ] **32.3** Run `bun run check` in full.

Expected: 43 steps, all PASS, `check:parity` over 55 pairs with `DIVERGENT` empty,
`check:appearance` clean over 52 components with 3 in `HAND_DRAWN`.

- [ ] **32.4** Delete `docs/superpowers/plans/2026-08-02-react-renders-its-manifest.md`, since
  the implementation is done. Any debt still alive by then is already in a map with a reason, in
  a suite or in a `.prompt.md`, never in this file.

- [ ] **32.5 Commit:** `Delete the plan, which is executed`

---

## End-to-end verification

```bash
bun run build

bun run check:appearance
#  -> 52 in scope, 52 render their manifest, 3 hand-drawn on the record

bun run check:states
#  -> the react half reads BarChart, DoughnutChart, LineChart

bun run check:dimensions

bun run check:parity
#  -> 55 page pair(s) ... 55 paint identically and 0 are declared in DIVERGENT

bun run check:playgrounds
bun run check:cards
bun run check:focus-trap

bun run test

bun run check          # 43 steps, no FAIL, no SKIP
```

And by hand, which is what no gate does:

```bash
bun run demos          # serves the repository root on :8000
# open a pair from each group and compare:
#   /frameworks/react/components/<cat>/<kebab>/<Name>.demo.generated.html
#   /frameworks/angular/components/<cat>/<kebab>/<Name>.demo.generated.html
# hover and tab: that is exactly what check:parity's capture never sees
```

## What this plan does not cover

Stated so that no absence is a silence.

1. **The three SVG charts.** `BarChart`, `DoughnutChart` and `LineChart` are out of scope on
   purpose and are covered by a separate plan. Their absence is not prose: it is `HAND_DRAWN`,
   in `scripts/lib/tailwind/manifest-surfaces.mjs`, with a reason per entry, read by
   `check:appearance` (which excludes them from scope) and by `check:states` (whose React half
   takes them as its only subject). Where one migrates, deleting its entry is mandatory: the
   gate fails on a stale one.
2. **The Delivery Console and the playground chrome.** `frameworks/react/ui-kits/console/` and
   `frameworks/react/playground/` keep their inline styles. They are not components, they have
   no manifest, and they are not an Arena surface. The gate's literal half walks
   `frameworks/react/components/**` alone, and that narrowing is stated in its header.
3. **The Angular half of the literal question.** A `[style.x]="1"` with a literal in an Angular
   template is still ungated; it is the blind spot `check:dimensions` already declares in its
   header. This plan declares it in the new gate's header too and does not close it.
4. **Whether a manifest is the right one.** `check:parity` says the two layers agree, never that
   either is correct. Nothing compares a manifest against the contract it was written from, and
   CLAUDE.md already says so; this plan does not change it. Once the migration is covered and an
   inequality survives, that is the moment to look at both layers to decide it, and not before.
5. **New components.** The plan migrates 43 and adds none.
6. **Contracts.** `contracts/api/` is untouched unless a growing manifest brings a `hover:` or
   `focus:` class onto a surface whose contract declares no such affordance; there
   `check:states` fails and the right exit is to declare it in the contract, which licenses both
   layers at once. No contract change is expected: `Card`, the one measured case, already
   declares `["hover","focus"]`.
7. **Publication.** No version, tag or package change. The packaging plumbing is already in
   place: `css/utilities.css` travels and `@source` compiles every manifest class whether or not
   anything uses it.
