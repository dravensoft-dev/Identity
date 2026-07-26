# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Arena — Dravensoft's design system. It is **not a published npm package**, but it does
have a **dev-only, private `package.json`** at the root: the token layer is built from
DTCG JSON by Style Dictionary, and the build and check scripts are tested with
`bun test`, as is each framework layer from its own test directory
(`bun run test:scripts` / `test:react` / `test:react-dom` / `test:angular`, or
`bun run test` for all four). Those four run in **two `bun test` processes**, not one:
`test` is `bun test scripts frameworks/react/test/ frameworks/angular/test && bun test
--preload ./frameworks/react/test-dom/preload.js frameworks/react/test-dom`, because
`frameworks/react/test-dom/` registers a DOM globally and must not share a process with
the DOM-free suites (see the two-React-test-directories note under *Architecture*).
That directory was deleted once, for its RAM cost, and restored minus the one suite
that carried the cost: **a component whose behaviour binding names the `grid` pattern
is DOM-tested by hand**, and what that rule costs is recorded under *Known debt*.
**A test under `scripts/` may not import a framework layer's `.ts` or `.jsx`**,
because `scripts/` is the one suite `check-all.mjs` also runs under plain node, and those
files use the extensionless imports their own toolchains expect and node does not resolve.
A property worth asserting against a real recipe or component is asserted from that
layer's own `test/` directory; `scripts/tv-merge.test.mjs` and
`frameworks/angular/test/tag-variants.test.ts` are the pair that established this.
Nothing here is published to npm. It ships as three things at once from
the same tree:

- a **Claude Code plugin** (`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`, registering the `design` skill defined by the root `SKILL.md`);
- a **copy-in kit** (consumers copy `tokens/`, `assets/`, `styles.css` and the `.jsx` files they need);
- a standalone **Agent Skill** (`SKILL.md`).

`README.md` is the normative design specification (voice, color, spacing, danger convention, iconography). Treat it as the source of truth for any design decision, and update it in the same change whenever a token, component, or convention changes.

## Viewing things

Everything is static, but the demos `fetch()` their JSX, so `file://` will not work — serve the repo root over HTTP:

```bash
bun run demos   # serves the repo root on :8000 and prints the entry points
```

- `guidelines/*.html` — token specimen cards (type, color, spacing, effects, icons, brand, danger convention).
- `frameworks/react/components/<group>/*.card.html` — live component demos, one card per group.
- `frameworks/react/ui_kits/console/index.html` — the Delivery Console example app (login → dashboard → project).
- `Arena - Overview.html` (repo root) — the token language: every token Arena defines, generated at runtime from `tokens/src/*.json` and `tokens/colors.css`. **It shows no components on purpose** — those belong to the framework layers, and a root-level copy of them was a second implementation that drifted. It lives at the root because it loads `styles.css`, `theme.js`, `assets/`, `scripts/lib/` and `tokens/src/` by relative path, and it must be served over HTTP because it fetches its own source.
- `Dravensoft Identity.dc.html` (repo root) — the approved brand manual, and the only remaining `dc-runtime` page. It loads `support.js`, `styles.css` and `assets/` by relative path. From a subdirectory it 404s, no token resolves, and the page renders unstyled. Do not move it.

## Architecture

**Tokens are the only styling layer, and their values are DTCG JSON.** `styles.css` does
nothing but `@import` the six files in `tokens/`. Four of those six —
`tokens/palette.css`, `typography.css`, `spacing.css`, `effects.css` — are **generated
build output**: their values are authored in strictly-conformant DTCG 2025.10 JSON under
`tokens/src/` and emitted by `bun scripts/build-tokens.mjs` (`bun run build:tokens`).
**Never edit those four CSS files** — edit the JSON and rebuild.
`tokens/src/TYPE-MAP.md` is the normative table of which DTCG `$type` every token group
uses, and it is the first thing a new platform target should read.

The split still matters: **`tokens/src/palette.{dark,light}.json` is the skin** — the
daisyUI-structured `--color-*` / `--color-*-content` pairs per theme (dark on `:root`,
light on `.arena-light`) plus the 8-slot categorical chart ramp (`--color-cat-1..8`) —
and it is what a consumer swaps to re-skin Arena. **`tokens/colors.css` is the
structure**, and stays hand-authored — the compatibility layer mapping Arena's legacy
aliases (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) onto
those tokens, plus the `color-mix` derivations of the muted text levels from
`--color-base-content`. `colors.css` never defines a skin value; `palette.css` is
imported before it. `tokens/fonts.css` likewise stays generated by
`scripts/fetch-fonts.mjs`.

**The layer contract.** DTCG owns *values*; the composition layer owns *how values are
combined at runtime*. Two things DTCG deliberately does not model, and that therefore
live in each platform's own idiom: the runtime colour derivations (`color-mix`, in
`tokens/colors.css`) and `@font-face` bundling (`tokens/fonts.css`). A new framework
target rebuilds that thin layer in its idiom on top of the same standard values — it
never re-defines a value.

**A third thing lives in the composition layer as of the script-readable
target: a token whose consumer is JavaScript rather than CSS.** A token flagged
`$extensions["com.dravensoft.arena"].script: true` in `tokens/src/` emits twice —
the custom property it always would have, and a bare number exported from
`frameworks/react/tokens.generated.js` and `frameworks/angular/tokens.generated.ts`.
Emission is **per layer** so a component's import never crosses the `tokens/` ↔
`frameworks/` boundary. Flag a token only when JS arithmetic must consume it to
produce a position — an SVG `y` from a data value, a clamp against
`window.innerWidth`. The price, and it is not negotiable: a value bound at
import time **cannot re-theme and cannot re-densify**. `bun run check:script-tokens`
asserts the modules match the source and the CSS and that no flag is orphaned;
`bun run check:duplicate-constants` fails a numeric constant declared in both
layers, which is how chart geometry drifted before this existed.

**That gate now also reaches across into the API layer, for exactly one type.**
`api/types/cat-slot.json` declares `CatSlot` as the literal set `1 | … | 8`, and the 8
is not authored there — it is the count of `--color-cat-*` slots in
`tokens/src/palette.dark.json`, reaching the layers as the derived `catSlots` constant.
`catSlotEnumProblems()` in `scripts/check-script-tokens.mjs` asserts the set is exactly
`1..catSlots` **in order**, so a ninth colour in the ramp fails the build until the
contract type follows. It is deliberately that one named case and not a mechanism.

**Behaviour has values, and they are tokens like any other.** `tokens/src/behaviour.json`
holds `delay` (pointer intent), `dismiss` (how long a transient notice lives) and
`limit` (quantity invariants). All are script-readable, because their consumers are
`setTimeout` arguments and array bounds rather than CSS properties. Two rules govern
what belongs there. **A behaviour value is a decision the system makes, not a
mechanism** — `--delay-open` is how long a tooltip waits, and that is a design
decision; a debounce interval on a synchronous in-memory filter is not, which is why
`debounce` was proposed and deliberately not shipped. And **a value is not a
contract**: which keys a dialog answers, where focus lands, what dismisses it — none
of that is expressible as a token, none of it lives in `tokens/`, and DTCG does not
model it. That layer lives beside the components instead, and the next paragraph is
what got built.

**Behaviour also has contracts, and they are not tokens.** `behaviour/patterns/*.json`
states what a kind of component must do — roles, keys, focus, dismissal — one file per
pattern, each citing the source it was adopted from. **Most cite the WAI-ARIA APG page
they were adopted from — count them rather than trusting a figure here, which moves
whenever a batch adds a pattern** (`ls behaviour/patterns/ | wc -l` for the total, and
`grep -l 'apg/' behaviour/patterns/*.json | wc -l` for the APG-derived share; note
`navigation` cites an APG *practices* page rather than a *patterns* one, so a grep on
`apg/patterns` alone undercounts by one). This paragraph read *fifteen* until plan 8C5
added `disclosure`, the first new pattern since the layer was built. The exceptions to
APG are the interesting part and are stable: two, `status` and `textbox`, cite the ARIA
1.2 role reference
instead because APG has no pattern page for either role; `figure-with-data-table` is
Arena's own and cites WCAG instead, because APG has no chart pattern; `none` and
`absent` cite nothing, because there is nothing to adopt from when the claim is that no
pattern applies. `requires` is a flat map of **dotted** keys, and that shape is
load-bearing: an exception names exactly one requirement, so one entry cannot excuse a
whole clause.

Every component declares, in **every** layer, beside its own source — React at
`<Name>.behaviour.json`, Angular at `<name>.behaviour.json`, and the controls Material
provides or lacks, in `frameworks/angular/behaviour-delegated.json` — **count that file's
keys rather than trusting a figure here**; it read *twenty-two* until plan 8C2 split
`Radio.jsx` in two and added a twenty-third in the same change.
**Delegation is a state, not an absence**: Angular has a tooltip, it is `matTooltip`,
and a declaration reading "absent" would be false for it — Calendar is the one entry
in that file where "absent" is true, and it binds the `absent` pattern precisely so
that fact is machine-checkable rather than only stated in its `reason`.

`bun run check:behaviour` asserts every component declares, that no declaration names a
pattern or requirement that does not exist, that no delegated entry is stale, and that
the layers agree or say why not. When they disagree the gate names both and picks no
winner — the pattern is the authority. **It does not assert that a component behaves as
it declares**: a component can bind `dialog-modal` and trap no focus. A green run is a
coverage claim, never an accessibility one.

**And now something does check whether a component behaves as it declares — by
rendering it, in both layers, with one component-shaped hole.** `check:compliance`
is the coverage record; the verification itself lives in render suites
(`frameworks/react/test-dom/`, `frameworks/angular/test/`)
that assert, per requirement of a component's bound pattern, that the rendered DOM
either meets it with no exception declared, or fails it with one declared. That
single bidirectional statement is the stale-exception rule the layer was modelled
on and did not have: **an exception can finally expire.** The hole is by rule and
not by omission — **a component whose binding names the `grid` pattern is DOM-tested
by hand**, so `Calendar` and `Table` are outside the suites and outside `COVERED`;
the rule, the measurement behind it and its price are stated in
`check-compliance.mjs`'s own header and under *Known debt*. The shared evaluator is
`scripts/lib/behaviour-compliance.mjs`, DOM-generic on purpose — it touches only
`tagName`, `getAttribute` and `hasAttribute`, because it is consumed from three
runtimes, one of them plain node in its own test, which has no DOM. It returns a
third value, `null`, for requirements no single element can decide (`focus.*`,
`keyboard.*`, `content.noAutoDismiss`, `alternative.table`); a suite must name
each of those in its `behavioural` map and assert it by acting on the tree, and
each layer's wrapper (`frameworks/react/test-dom/assert-pattern.jsx`,
`frameworks/angular/test/compliance.ts`) throws if one is
silently skipped. **Coverage is partial by design
and grows one component at a time** — `COVERED` in `scripts/check-compliance.mjs`
is the record, with the same bidirectional staleness rule `EXEMPT` carries; the
gate never demands totality, only that every claim in the record is true. A green
`check:compliance` still says nothing about whether a component is accessible: a
suite asserting all four of a component's exceptions are still true passes while
the component stays exactly as broken.

**Arena's third contract is the API, and it lives at `api/`.** `api/components/<Name>.json`
states, once and neutrally, the members that component's API presents; every layer
implementing it implements exactly those members. A member is one of **nine forms** —
primitive, enum, predefined object, array of primitives, array of predefined objects,
consumer data, functionInput, slot, event — and five derived rules govern them (R1 an object is pure data
with known fields, R2 who draws decides data versus slot, R3 a parameterised slot fills and
never replaces, R4 no platform types and no escapes, R5 no unions between forms).
**Consumer data is the eighth and the one the contract deliberately does not describe**: a
record whose keys the *consumer* names, which Arena routes and never inspects. It exists
because the vocabulary said *seven* and was false; `Table.rows` was a member and was none
of them. **Both members that motivated it have since been removed** — `Table.rows` when
`Table` became a compound component, `CalendarEvent.meta` under the per-item renderer
convention — so `grep -rn consumerData api/components/` is **empty** and the form has zero
live instances in any shipped contract. That is a fact about the vocabulary and **not** a
reason to retire the form: the next reader will wonder, and the answer is that the form is
what a contract must reach for the moment a member is a record whose keys the consumer
names, and that nothing else in the nine can express one. Its guards are what stopped both
of those members being modelled badly rather than removed. It is exactly one spelling,
`Record<string, unknown>`, and a record of a *known* type stays an R4 violation, because a
form admitting any record would re-legalise the escape R4 closed. Two things about it are
mechanical — it may not be a field of a predefined object, and a member taking it in must
declare a route back out (a slot parameter or an event payload) or it is data Arena can
never surface — and everything else is an authoring rule with R2 and R3's status.
**`functionInput` is the ninth, and the narrowest**: a function the consumer supplies, which
the component calls on its value and whose result it uses — a validator, a parser. It exists
for data-entry controls and nothing else, and that is machine-checked rather than written
down: `check:api` rejects one in any contract not declaring `"kind": "input"` at top level.
Its signature is modelled (`params` name → type, `returns`), R4 holds inside it, and the gate
compares the signature between the contract and each layer. It deliberately reverses the
refusal the layer carried until now — an inbound function that returns a value was none of
the eight, which is why the charts' `valueFormatter` became `valueSuffix` — and it reverses
it for input controls alone; a chart declaring a formatter still fails. A return of
`React.ReactNode` is **not** one, and the reader's refusal of it is an **enforcement rather
than a gap**: a per-item renderer is not a member at all. R3 is not the reason — R3 permits
the shape, since it fills the cell or row Arena renders rather than replacing it. The reason
is Angular, which has no answer for per-item projection short of a structural directive and
`ngTemplateOutlet`, a binding no row of the table covers and no reader function reads. That
convention removed `ActivityFeed.renderItem`, then `Calendar.renderEvent` and
`TableColumn.render`, so no contract may declare such a member and refusing every one the
reader meets is correct rather than provisional. **This checks a form, not R3** — `api/README.md`
carries the rule and the capability it costs.
`api/README.md` is the normative
statement and the first thing a new platform target reads, the way `tokens/src/TYPE-MAP.md`
is for the token layer. Shared objects and enums are declared once in `api/types/` and
emitted **per layer** by `bun run build:api` into the committed
`frameworks/react/api.generated.d.ts` and `frameworks/angular/api.generated.ts`, so a
component's import never crosses the `api/` ↔ `frameworks/` boundary. The word *prop* never
appears in a contract: it is React's vocabulary, and a neutral contract using it would
already have chosen a layer. **The structural difference from `behaviour/` is one file, not
one per layer** — behaviour files a binding beside each layer's source and has a gate
compare them, which admits two files that disagree and makes the gate's job to notice; a
contract that forbids divergence has nowhere for a second opinion to live, and
**`check:api` carries no exception map at all**. Coverage is partial by design and grows one
component at a time, the same charter `COVERED` carries in `check-compliance.mjs`: a green
run is a claim about the contracted components and says nothing about the rest — and,
being orthogonal to behaviour, it says nothing about what any of them *does* either.
Plan C's first batch brought the five composed primitives under contract, its second
brought the six form controls (`RadioGroup`, `Radio`, `Checkbox`, `Textarea`, `Select`,
`Input`) — the batch that needed the ninth form, since `Input.validate` made the reader
throw before it existed — and its third brought `Tabs`, `SegmentedControl`, `ProgressBar`,
`Toast`, `Tooltip`, `Calendar`, `CalendarEvent`, `Table`, `TableRow` and `TableCell`.
**To know what is contracted, run `bun run check:api` and read
the contract/layer pair it prints, or list `api/components/`** — a count written here
would drift the first time a batch lands, which is why none is.

**When a consumer needs their own content inside ONE item of something Arena draws, make
the item a component.** That is the batch-three answer to the per-item renderer convention
above, and it needed no gate change and no tenth form: per-item projection stops applying
the moment the consumer instantiates one element per item instead of handing Arena a render
function, so Angular's missing `ngTemplateOutlet` binding stops being the obstacle.
`RadioGroup`/`Radio` was the contracted precedent, and `Calendar`/`CalendarEvent` and
`Table`/`TableRow`/`TableCell` now follow it. The parent owns **where** an item goes — the
placement, the grid, the keyboard — and the item owns **what** it looks like; the parent
reads its children's props and injects the rest with `cloneElement`, and **none of the
injected props is a member of any contract**, exactly as `Radio.json` declares none of the
`name`/`checked`/`onSelect` `RadioGroup` injects. `Table` is the reach of it: a cell's
content is a value or one of Arena's own components — a `Badge` for a status, a `Button`
for an action — which is what `TableColumn.render` used to buy and what removing it would
otherwise have cost. The price is that the compound shape is breaking at every call site,
and for `Table` it was the widest breaking change in the batch.

**A compound parent's content slot is OPTIONAL, and the one exception is a named group.**
Measure it rather than trusting this — `grep -rn '"form": "slot"' api/components/` and read the
`required` flags — but as written, every compound ROOT declares its children optional and guards
nothing (`RadioGroup`, `SideNav`, `Table`, `Calendar`, `Tabs`), and so does a container that
merely nests (`SideNavCollapsible`). Only `SideNavSection` requires and guards, and the
distinction is not stylistic: a section renders a **heading naming the group**, so a childless one
renders a label for nothing, which is the defect its guard exists to refuse. A root promises
nothing that an empty render would break. This rule was settled twice, in opposite directions:
`Tabs` was first specified as required-and-guarded on `SideNavSection`'s precedent, and measuring
the family reversed it — a root is not a group. `Tabs` also carried a documented, tested stance
that an empty collection is a caller saying "no tabs right now", which reversing would have made
this batch decide something it was not asked to.
**What a root must still not do is ship an invalid degenerate render**: with no children `Tabs`
draws an empty tablist and **no** tabpanel, because a panel whose `aria-labelledby` points at a
tab that does not exist is worse than an absent one. Optional is not the same as unconsidered.
This is separate from — and does not resolve — the recorded contradiction over whether a slot
declared **required** is then guarded at runtime, which is still two and two.

**The idiom now reaches a third family, and that one is RECURSIVE.** `SideNav` sheds its
`items` array for `SideNavItem`, `SideNavSection` and `SideNavCollapsible`, and nesting is
arbitrary — a section inside a collapsible inside a section, to any depth — with **no React
context anywhere**. What makes that work is one rule applied uniformly: injection is
**direct children only, one hop**, and a section or a collapsible re-injects into its own
children with `depth + 1`. Every level does the same single hop, so depth accumulates
without anything having to know the whole tree. The shared helper is
`frameworks/react/components/navigation/side-nav-inject.jsx`, and **its `.jsx` extension is
load-bearing rather than cosmetic**: `check:dimensions` scans `.jsx`/`.ts`/`.tsx` and
deliberately never opens a `.js`, and the helper's `indentFor()` produces a governed
`padding-inline-start`, so under `.js` it would sit outside the gate entirely — it shipped
that way for exactly one commit and could have returned a bare `'12px'` with every gate
green. It is also the first `.jsx` under `frameworks/react/components/` that is **not a
component**, which is worth knowing because the documented way to measure Plan C's subject
set counts `.jsx` files and therefore now over-counts by one; cross-check against
`frameworks/angular/behaviour-delegated.json`'s key set, which holds only real components.

The recursion inherits the family's limit rather than escaping it: **a consumer's own
wrapper component between two levels breaks the chain, and so does a fragment.**
`React.Children.toArray` flattens a nested array and does *not* flatten a `<>…</>`, so a
fragment arrives as one opaque child that `cloneElement` decorates uselessly. Write items as
siblings or in an array, never wrapped. This is the same limit `Table` and `RadioGroup`
carry; the fragment half is easy to miss because the array half works.

**And a guard must count what the render path counts.** `React.Children.count()` counts a
bare `false` as one child where `toArray()` drops it — so a `count()`-based "this must not be
empty" guard passes the commonest conditional-render idiom, `{isAdmin && <SideNavItem …/>}`
with the condition false, straight through to a render that produces exactly the empty thing
the guard exists to refuse. The guard and the thing it guards would be counting two different
collections. This shipped in 8C5 and was caught in review; `SideNavSection.jsx` was the only
`count()` site in the layer, and every other child-counting site (`Table.jsx`, `TableRow.jsx`,
`Calendar.jsx`, `injectInto` itself) already used `toArray().length`. Use `toArray().length`.

`Table.label` is the pattern for a member that only a human can supply: it names the grid
for assistive technology, it is `required: true`, and it is **guarded at runtime** rather
than defaulted. A constant fallback was rejected on the charts' own evidence — a name that
is present but only says what the component *is* satisfies `roles.label` mechanically while
telling a screen-reader user nothing — and nothing can derive it, because a data table's
subject is editorial. `SegmentedControl.ariaLabel` is the same shape.

**`api/README.md`'s *"a closed set of values is not always an enum"* rule now carries a
condition, and the condition is a gate rather than a judgement.** A closed set that merely
restates a value the token layer already derives may be an enum **only while something
machine-checks the restatement** — otherwise the contract hand-copies a derived N and
becomes exactly the stale-assertion surface this layer exists to remove. `CatSlot` is the
one type in `api/types/` that does this, `check:script-tokens` is what ties it back to the
`--color-cat-*` ramp (see the script-readable section above), and the assertion is written
as that single named case: **a second such type would need its own tie before it may be an
enum at all.**

**Plan C's contracts are single-layer, and that is a property of the plan, not a gap.**
The components Plan C brings under contract exist in React alone — they are
exactly the controls Angular delegates to Material, so **count them rather than trusting a
figure**: every `.jsx` under `frameworks/react/components/` with no matching directory under
`frameworks/angular/primitives/`, which is also exactly the key set of
`frameworks/angular/behaviour-delegated.json`, minus `Switch`, which was contracted before Plan C
began. A count written here would drift, and has, twice: it read *twenty-one*, which was true when
written and went stale the moment plan 8C2 split `Radio.jsx` into two quartets — `RadioGroup`
became a new React component and a new delegated entry in the same change, moving the set to
twenty-two without a word of prose changing — and plan 8C3 did the identical thing three more
times, since `CalendarEvent`, `TableRow` and `TableCell` are each a new React component and a new
delegated entry. **A batch that makes an item a component enlarges its own subject set while
contracting it**, which is why the method above is the only thing here worth trusting. That is
this file's own rule about derived figures,
broken twice by this very paragraph — so each contract governs one layer
and `check:api` moves by one contract and one layer per component, not the `+1/+2` a
shared component moves. Their APIs are settled and normative *before* Angular has an
implementation to defend, which is the whole point of sequencing Plan C ahead of Plan D
rather than after: it is the remedy for how `StatCard` became an object in React and three
flat inputs in Angular. **The single-icon convention now reaches `Button` and `IconButton`**
— a component's icon is a Phosphor class-name string Arena draws, never a slot, so
`IconButton` presents no slot at all and a per-item or single icon is one system across the
library. The price is recorded rather than hidden: the flatten of each `<button>`'s heritage
clause **dropped the five `form*` overrides and every global/ARIA attribute the `{...rest}`
spread used to forward**, a capability that was reachable and undocumented and now is gone,
with no gate behind the loss — `check:api` reads the `.d.ts`, and a restored spread in the
`.jsx` would leave it green. That is the same limit already recorded two paragraphs down for
every migrated React component; Plan C widens its reach, it does not close it.

**React has two test directories, they must not merge, and the second one has a
rule about what it may hold.**
`frameworks/react/test/` asserts on `renderToStaticMarkup` — no DOM, by design,
because those suites prove those components render correctly server-side.
`frameworks/react/test-dom/` registers `@happy-dom/global-registrator`, which
installs globals **process-wide**, and `bun test` shares one process across every
path a single invocation matches. So a DOM registered in the first directory's
process would quietly change what its suites prove with nothing
failing to say so — count them with `bun run test:react` rather than trusting a
figure written here, which drifts with every component that gains a test — and it would also reach `frameworks/angular/test`, whose files
register a DOM themselves and throw on the second registration. `testStep()` in
`scripts/check-all.mjs` therefore runs two `bun test` invocations, and
`check-all.test.mjs` asserts that array by literal value — a change to one is a
change to both.

**The rule the second directory carries: a component whose behaviour binding names
the `grid` pattern is DOM-tested by hand**, with `bun run demos` and the
component's own `*.card.html` page. It is tied to the binding rather than to a
judgement about what looks like a grid, so it is a grep rather than an argument,
and so a component that becomes a grid later inherits it without anyone
remembering; today it selects exactly `Calendar` and `Table`. The whole directory
was deleted once for its RAM cost and restored minus the one suite that carried
that cost — `grid-keyboard.test.jsx` alone peaked at 164 MiB against 109 MiB for
the other six together, because its fixture is 84 cells per mount, eight mounts,
and 160 key events through `act()`. The directory was never the problem; the grid
was. What that costs is under *Known debt*, and it is a real cost, not a
formality.

**`frameworks/react/test-dom/` must be run through `--preload
./frameworks/react/test-dom/preload.js`, and that is not a convenience.** react-dom
decides **once, at its own module evaluation**, whether the browser supports the
`input` event: `canUseDOM` gates the block computing `isInputEventSupported`, and if a
DOM is not already installed the flag latches false and React falls back to its legacy
change-detection polyfill, under which a dispatched `input` or `change` reaches an
`onChange` handler **zero** times, silently. Registering happy-dom from `harness.jsx`'s
module body is too late (ES imports evaluate first) and — measured, so do not retry it —
so is registering it from a **separate ES module imported ahead of `react-dom/client`**:
bun evaluates `react-dom` before that module anyway. Only a preload is early enough.
This cost a day to find, so it is written down here as well as in `preload.js`, and it
survived the directory's deletion and restore unchanged. All
three invocation sites pass it (`test:react-dom`, `test`, and `testStep()`), and
`harness.jsx` **throws** when `document` is missing rather than installing a fallback,
because a fallback would silently run those suites under the legacy semantics. The
preload must never be applied to `frameworks/react/test/`, for the reason in the
paragraph above.

**A dimension in a framework layer is a token or a derivation of tokens. A bare
literal is a bug.** This is machine-checked: `bun run check:dimensions` scans
`frameworks/` for literals in the properties the token layer governs and fails on
each. A value passes when it is `var(--token)`, a `calc()`/`min()`/`max()`/`clamp()` over
one, zero, or a unit the token layer does not model (`%`, `ch`, `fr`, the viewport
and angle units — DTCG admits only `px` and `rem` in a dimension, so none of those is
expressible as a token — plus `s`/`ms`, which this gate alone tolerates). **The same
three shapes are what a Tailwind bracket may hold, and the two gates share the same
unmodelled-unit list** — but they are not one list: this inline gate additionally
tolerates `s`/`ms`, while the bracket gate does not, because `--dur-*` and `--loop-*`
model duration, so a bracket carrying `duration-[200ms]` must keep failing. The scan
reaches four kinds of site: a JS declaration, a
template literal's interpolation, CSS injected as a string (every `@keyframes` in the
layer lives in one), and an SVG presentation attribute in `prop="value"` form. An
expression binding — `r={hover ? 5 : 4}` — is outside all of them. A
literal reached through an intermediate local variable is still caught — a dataflow
rule traces a bare identifier at a governed property back to its `const`/`let`
declaration in the same file — but only when that identifier is used bare (no member
access, no call, no arithmetic) at the governed site; a value buried behind either is
outside what the rule can trace. A handful of sites are exempt by name with a reason
each, the way the coverage gate's token exclusions are — read `EXEMPT` for the current
set rather than a count written here, which would drift: `Calendar`'s local `zIndex`
(stacking scoped inside one positioned container, not part of the global `z` order); a
runtime projection of data onto a screen position — a chart tooltip's offset derived
from a hovered value, an hour label's offset derived from a clock minute, an event
block's height derived from its duration — where the literal is the true value at
that site because nothing in `tokens/src/` could stand in for a number computed from
data at runtime; and, since `chart-internals.ts`, the **visually-hidden idiom** —
`SR_ONLY`'s 1px box and the −1px margin that must cancel it exactly, where the number
is a constraint of the accessibility idiom rather than a design dimension and a token
would break the cancellation. That third category widened the map's charter beyond
runtime projections, so read the reasons rather than assuming the rule.
A stale exemption — one that no longer matches a real violation —
fails the gate itself. **A change to `EXEMPT` or `PASSTHROUGH` is a change to
`scripts/check-dimension-literals.test.mjs` too** — that suite asserts on both maps by
name, so an entry added or removed without touching it leaves the tests describing a
gate that no longer exists. The gate scans `.jsx`, `.ts` and `.tsx` under `frameworks/`,
including every `*.entry.jsx` demo-page composition script (see below) — it does not scan
`.html`, so the root-level and `guidelines/` pages stay clean only because they were
tokenized by hand, and nothing holds that. The `*.card.html` specimens under
`frameworks/tailwind/components/` are the one family of unscanned pages that stays clean
structurally rather than by hand: every class they render comes from the manifest through
`classesFor()`, so a literal typed into a specimen is styling the manifest does not carry
— the one thing a specimen must never show. **They do still carry bare `px` for
demo-harness sizing** (ActivityFeed, Card, ChartCard, Input, Menu, PageHead, ProgressBar,
Select, Skeleton, StatCard and Textarea pin a width so the card composes), which nothing
holds either. **Two blind spots are known and neither is fixed**:
the gate cannot see a kebab-case SVG attribute — `scanAttributes`' lookbehind `(?<![\w.-])`
rejects `width` preceded by `-`, so `stroke-width="1"` never matches, and `font-size`
reduces to `size`, which is not in `PROPS` — while `PROP_COLON` omits `-` from *its*
lookbehind, so `stroke-width:` inside a template string false-positives as the governed
`width` and scavenges an unrelated number. This is why the three SVG charts write their
static styling as camelCase `[style]` **objects**: in that shape `strokeWidth` and
`fontSize` are judged as themselves, which is strictly more coverage than an attribute,
not a workaround. Angular's `[style.x]` binding form is invisible to all four scanners
too. Closing this properly needs `PROP_COLON` taught kebab-awareness plus the Angular
binding form, with its own suite. **No gate compares a Tailwind manifest against the
component it mirrors, and the mapping is not one-to-one**: 17 of the 38 manifests mirror
both a React component and an `arena-*` primitive; the other 21 mirror a React component
alone, because Angular Material provides that control and `arena-material.css` dresses
it — `SideNav` among them, bridged through `mat-nav-list`. `Tag.manifest.json` is the one
that mirrors an **Angular** primitive whose React namesake is a different component.
`check:tailwind` proves every class resolves; nothing proves a manifest still matches the
component it was derived from, so check by hand when either has moved.

One narrow slice of that general problem is machine-checked, though: `check:states`
(`scripts/check-manifest-states.mjs`) flags a `hover:`/`focus:`-family Tailwind state
modifier in a manifest whose mirrored React component implements no hover/focus
anywhere — no `onMouseEnter`/`onMouseLeave`, no `onFocus`/`onBlur`, no `useState`
hover/focus tracking, no `:hover`/`:focus` in an injected style string. It exists because
this exact shape shipped twice on one branch — `Tabs`, then `Pagination` one batch after
the first was fixed and written down — and prose alone did not stop the second
occurrence. It resolves the manifest-to-component mapping itself through a
`SOURCE_OVERRIDES` map — `Tag` against `tag.ts`, and a compound component against **every**
`.jsx` its manifest mirrors, since a naive same-name search finds only the parent, which
typically renders the root slot and nothing else (`Table` against `Table.jsx`+`TableRow.jsx`,
`SideNav` against all four of its). **Read the map rather than a count written here**, which
went from two entries to three in plan 8C5 — and carries
a `check-dimension-literals.mjs`-shaped `EXEMPT` map, keyed `<Component>:<slot>:<family>`
with a reason each, for a handful of hits that are real but that a whole-file text scan
cannot resolve on its own — a state delegated to a composed child component
(`ConfirmDialog`'s confirm/cancel buttons are React's own `<Button>`) or a documented, deliberate accessibility addition on
the Angular side that React does not have (`ConfirmDialog`'s require-text input). A stale
`EXEMPT` entry — one naming a component/slot/family that no longer carries that state —
fails the gate, the same invariant `check-dimension-literals.mjs`'s own `EXEMPT` holds.
**This checks states only** — it says nothing about whether a manifest's colors, sizes,
or slot structure still match the component it mirrors, which is the open problem the
paragraph above describes and remains unclosed.

**The Overview generates itself, and that is the point.** `Arena - Overview.html` reads
names and `$description`s from `tokens/src/*.json` and the alias names from
`tokens/colors.css` (with `scripts/lib/css-decls.mjs`, the same parser the drift gate
uses), but it reads **values** from `getComputedStyle` on the live document. So it
exercises the whole chain — JSON, build, CSS, browser — instead of restating the JSON, and
a token that resolves empty is flagged as stale rather than shown as if it were in effect.
Add a token to `tokens/src/` and it appears there with no edit to the page. The
group-to-preview mapping lives in `scripts/lib/token-preview.mjs` and **never** in the
token source, which stays platform-neutral.

When adding a colour, define the daisyUI token in `tokens/src/palette.dark.json` and
`palette.light.json` first, rebuild, then alias to it in `colors.css` — never introduce a
raw hex in a component. After any `tokens/src/` edit: rebuild, then run
`bun scripts/check-dtcg.mjs` (source is valid DTCG 2025.10),
`bun scripts/check-tokens-generated.mjs` (committed CSS matches the source), and
`bun scripts/check-ramp.mjs` (the ramp still clears every gate). In `tokens/src/`,
colours are structured sRGB objects, dimensions and durations are `{value,unit}` objects,
and letter spacing is a `number` carrying an `em` render hint in `$extensions`.

**The two layers solve the modal focus contract with the same code, and that was
deliberate rather than convergent.** `frameworks/react/use-dialog-modal.js` is a PORT of
`frameworks/angular/primitives/focus-trap.ts`, not a second design — the same focusable
selector (every natively-focusable clause carrying its own `:not([tabindex="-1"])`,
because a selector list is OR'd and `button:not([disabled])` alone would pull a real
`<button tabindex="-1">` back into the tab order), the same boundary-wrap rule, the same
never-cache-the-focusables rule, the same open/close transition. `Dialog`, `ConfirmDialog`
and `Onboarding` all consume it, and Escape always reports through the component's **own**
dismissal channel — `onClose`, `onCancel`, `onSkip` — so meeting the pattern added no
member anywhere. **`CLAUDE.md`'s rule that a component is self-contained is about CSS
classes, not about JS helpers**; `use-container-width.js` settled that reading before this
and `use-dialog-modal.js` sits beside it. The React module is one shape wider than the
Angular one it mirrors: Angular handles Tab only and keeps Escape in each component's own
`onKeydown`, where React folds Escape into the handler the hook returns.

**What a suite can prove about a focus trap, and what it cannot.** The boundary wrap —
Shift+Tab from the first focusable landing on the last, Tab from the last landing on the
first, a panel with nothing focusable consuming the key — is Arena's own `.focus()` call,
and happy-dom honours `.focus()`, so it is asserted for real. The **interior**, that Tab
from a control in the middle reaches the next one, is the browser's native sequential
focus navigation, which neither layer implements and happy-dom does not have; a test
asserting it would pass identically against a perfect trap and against none. So the
interior is checked by a person in real Chromium against a written checklist in each
component's `.prompt.md`. **No browser-driven gate**: `dialog-modal.test.jsx`'s header
refuses one as this repository's fourth non-portable gate, and that refusal stands — the
arrangement is the same one the grid rule uses.

**Components carry no CSS classes.** Each `frameworks/react/components/**/*.jsx` renders with inline `style` objects reading the custom properties (`background: 'var(--crimson)'`), and handles hover/active/focus with local `useState`. There is no `.btn` class to target; theming happens entirely through token values. Keep new components self-contained the same way — `Button.jsx` is the reference shape.

**The one exception: a `<style>` tag injected once**, for what an inline style genuinely cannot express — `@keyframes` (`ProgressBar`, `Spinner`, `Skeleton`, `Button`, `Dialog`, `Menu`, `Tooltip`) and vendor pseudo-elements (`Input`'s `::-webkit-calendar-picker-indicator`, which is invisible on the dark surface otherwise). The pattern is always the same, and every one of them follows it: a module-level `let injected = false` guard, a `useEffect`, `document.head.appendChild`. Never a `<style>` rendered inside the component's own markup — that ships one tag per instance and leaks the CSS into the element's `textContent`.

Inject **as little as the job needs**. Prefer keyframes alone and leave the `animation` shorthand inline (`Dialog`, `Menu`, `Tooltip`); a reduced-motion variant that only changes the *movement* can redefine the keyframes inside the media query, which needs no selector. Reach for a class of ours **only when a selector is unavoidable** — a media query that changes duration (`Spinner`, `Button`), a pseudo-element (`ProgressBar`, `Input`), a background the keyframes animate (`Skeleton`) — and **never as a shortcut around an inline style that would have worked**.

**Every animation answers `prefers-reduced-motion`**, and the answer depends on what the motion means. Motion that reports work in progress *slows* rather than stops (`Spinner`, `ProgressBar`, `Button`) — a frozen spinner reads as a hung process. Decorative motion stops outright (`Skeleton`). An entrance keeps its fade and drops its travel (`Dialog`, `Menu`) — the movement is the vestibular trigger, the fade is the meaning. An opacity-only animation needs no clause at all (`Tooltip`): there is no motion to reduce.

**Every component is a quartet.** `X.jsx` (implementation), `X.d.ts` (types, with a `@startingPoint` doc comment), `X.prompt.md` (usage, examples, Do/Don't per README's H10 rule), and an entry in the group's `*.card.html` demo. Adding a component means adding all four.

**A new React component also moves a literal count outside its own layer, and the React
suite alone cannot see it move.** `scripts/behaviour-contracts.test.mjs`'s *"the React
inventory finds every component and no demo entry"* asserts `reactComponents('.').length`
by literal value, with a comment naming every change that has moved it; a new component
under `frameworks/react/components/` moves it by one and the assertion must be updated **in
the same commit**. **Verify with the merged process** — `bun test scripts
frameworks/react/test/ frameworks/angular/test` — because `bun test frameworks/react/test/`
never matches `scripts/`, so it reports green over a tree whose test run is red. This is a
different hazard from the two-invocation rule above, which is about a DOM registered
process-wide: this one is about a path a narrowed invocation simply never matched. It cost
plan 8C5 a red commit that a task report called green.

The Angular layer's quartet is the analogue: `<name>.ts` (standalone `OnPush` component, `arena-` selector, signal I/O, no component `styles`), `<name>.variants.ts` (a `tailwind-variants` recipe built with `frameworks/tailwind/tv.ts`), `<name>.prompt.md`, and a barrel export. Dark-first (`.arena-light`), danger stays outline, Phosphor icons. The three SVG charts are the one exception and have no `<name>.variants.ts` — see the charts note below.

**A host-bound root is the Angular layer's default, and it has one carve-out.** A primitive binds its root slot to the host (`host: { '[class]': 'styles().root()' }`) rather than rendering a wrapper div, so the host is the flex item its parent lays out and — where the component measures itself — the measured element is the styled element. One primitive correctly does **not**: `activity-feed`, whose root must be a real `<ul>` with `<li>` rows. The rule targets elements that exist only to carry styling; when the root must be a specific semantic or interactive element, keep it. **A host-bound root must carry a display utility** — `<arena-x>` is an unknown element defaulting to `display:inline`, where width and height do not apply, so a root slot without one renders a zero-area host. That is machine-guarded by a manifest-driven assertion in `frameworks/angular/test/host-class-binding.test.ts`.

**The Angular test harness is JIT, and that bounds what a test can prove.** `frameworks/angular/test/` renders real zoneless Angular trees under `bun test` via `happy-dom`, which needs three test-only devDependencies beyond the `node:test`/`node:assert` baseline the rest of the repo uses — `@angular/platform-browser`, `happy-dom` and `@happy-dom/global-registrator`. Because the harness runs `@angular/compiler`'s JIT and never `ngtsc`, **a signal input cannot be driven through a template binding, a literal attribute, or `componentRef.setInput()`** — the first two ways fail loudly (NG0303, thrown), the third does not: `setInput()` on an undiscovered signal input silently no-ops and the render keeps the field's default, which is the more dangerous failure because a suite built on it passes vacuously with nothing announcing the mistake. Overwrite the instance field directly instead. `contentChild()` queries do not resolve either. Factor the logic into plain exported functions and test those against a real DOM rather than faking a render; `check:angular`'s `ngc --strictTemplates` is the authority that the input contract and the queries actually compile.

`bun test` runs every file in this directory in ONE process, and both happy-dom's document and Angular's `TestBed` environment can each be claimed only once per process — `GlobalRegistrator.register()` throws if already registered, and `TestBed.initTestEnvironment()` throws ("base providers ... already been called") the second time it runs across files that share a process. `testbed-env.ts` claims both, once, for the whole directory: `ensureDom()` and `useTestEnvironment()` are plain `if (claimed) return` guards, not a reset — `TestBed.resetTestEnvironment()` was tried and measurably does not work, because `BrowserDomAdapter.makeCurrent()` installs a process-wide DOM adapter on the FIRST platform creation that nothing resets, so a second per-file document would render into a document the adapter no longer points at (`getComputedStyle` reading the wrong document was the observed failure). So the directory shares one real document and one TestBed environment for its entire run rather than one pair per file; any suite needing a real component render just calls `useTestEnvironment()` (or `ensureDom()` alone, for a suite that needs a DOM but not TestBed) and is a normal new file, not an addition to `host-class-binding.test.ts`. The shared document also means state written onto it — a custom property set on `documentElement.style`, an element appended to `document.body` — outlives the file that wrote it unless that file clears it, typically in a `finally`; every directly-created fixture must still be `destroy()`-ed for the same reason — zoneless change detection sweeps all attached views, so a fixture left dirty throws out of an unrelated later test, and with one shared document that hazard now crosses files rather than staying inside one.

**Specimen/demo pages** start with an HTML comment `<!-- @dsCard group="…" viewport="WxH" name="…" subtitle="…" -->` that drives external card rendering — keep it as the first line, which is the only line `check:cards` reads. **That viewport is machine-checked**: `bun run check:cards` loads every declaring page at its declared width in headless Chromium and fails when the rendered content over-runs the box in either axis, because the card is cropped to it and the overflow is lost silently. Declaring it by arithmetic does not work — it was tried, and the page clipped in both axes anyway. Measure by running the gate. A page that declares far *more* height than it renders only warns. `frameworks/react/ui_kits/console/index.html` carries no `@dsCard` on purpose: it is an app with its own scroll area, not a card. Component demos load React from a local importmap pointing at `frameworks/react/vendor/*.js` — a committed, generated ESM bundle of the `react`/`react-dom` devDependencies, since React 18 ships CommonJS only and the importmap needs real ES modules (`bun run build:vendor`, guarded by `check:vendor`; see `scripts/build-vendor.mjs`) — and pull `@phosphor-icons/web` straight from `node_modules/` (the static server is rooted at the repo root and does not exclude it). **JSX is compiled ahead of time, not in the browser.** Each demo page's own script used to be inline JSX, transpiled at load by `@babel/standalone` through `jsx-loader.js`'s `window.arenaImport()`; that inline block is now a real sibling source file (`<page>.entry.jsx`, e.g. `alert.card.entry.jsx` next to `alert.card.html`), and every component `.jsx` plus every `.entry.jsx` has a compiled `.js` sibling — same directory, same basename — that the page loads with a plain `<script type="module" src="…">`. `bun run build:demos` (`scripts/build-demos.mjs`) compiles them with Bun's own transpiler (classic JSX, matching what `@babel/standalone`'s default preset was doing) and rewrites each relative import's `.jsx` extension to `.js`, so the recursive-import behavior `jsx-loader.js` used to do at runtime now happens once, at build time; `check:demos` (`scripts/check-demos-generated.mjs`) guards drift and orphaned output, on the same committed-generated-output contract as `check:vendor`. There is a build step for the demos now — this repo does not claim otherwise.

`support.js` is a generated bundle (`dc-runtime`, whose source is not in this repo) used only by the root `*.dc.html` pages. Do not edit it.

**Framework layers live under `frameworks/`.** The root holds only the
framework-agnostic language (`tokens/`, `guidelines/`, `assets/`, `scripts/`,
`styles.css`) plus the demo runtime (`theme.js`, `support.js`)
and brand (`*.dc.html`). React lives in `frameworks/react/`;
`frameworks/angular/` holds the Angular layer: a Tailwind preset entry
(`theme/arena-tailwind.css`) and an Angular Material `--mat-*` token bridge
(`theme/arena-material.css`), a Phosphor icon manifest (`icons/`), a
dark-first signal `ThemeService`
(`theme/theme-service.ts` + `theme/no-fouc.html`), and
20 standalone `OnPush` primitives under `primitives/` (`tag` is the reference
shape; the three SVG charts are the declared exception — no manifest, no
`.variants.ts`, token-valued camelCase `[style]` objects like React's, and reviewed
against React's `charts.card.html` rather than a specimen of their own), each
styled by the
shared `frameworks/tailwind/` recipes through the configured `tv`
(`frameworks/tailwind/tv.ts`) — see `frameworks/angular/ADOPTION.md`.
`frameworks/tailwind/` is a **single shared** Tailwind v4 layer (`@theme`
preset + per-component manifests), authored once because the token→utility
mapping is pure CSS. **The Tailwind
layer derives every utility from an existing token and introduces no new hex
and no new value** — add the token first, then reference it. This is
machine-checked, not hoped for: `bun run check:tailwind` compiles the preset
with the manifests as content and asserts every class emits a rule and every
theme key resolves to a real token; `bun run check:coverage` asserts every
token either reaches a utility or is named in `EXCLUDED` with a reason;
`bun run check:arbitrary` fails on a bracket carrying a raw literal;
`bun run check:radius` fails on the one core Tailwind utility in this
namespace that resolves without one — `rounded-full` (`calc(infinity * 1px)`,
never sourced from `--radius-*`) where `rounded-pill` (`--r-pill`) belongs.
It is the converse of `check:coverage` and just as narrow: it does not attempt
"every utility traces to a token" in general, only this one verified case,
because everywhere else in a cleared namespace already resolves to nothing
and `check:tailwind` catches that on its own.
`bun run check` runs all twenty-one plus the test suite, without stopping at the first failure. **Three gates are not runtime-portable**: `check:cards` needs a headless browser (`CHROME_PATH`, or Chromium on the usual paths), `check:vendor` needs `Bun.build` to rebuild `frameworks/react/vendor/*.js` for comparison, and `check:demos` needs `Bun.Transpiler` to rebuild every component and demo-entry `.js` for comparison — neither builder exists under plain `node scripts/check-all.mjs`, which leaves each with nothing to compare against. Where any of the three dependencies is missing the gate exits 2, and `check-all` marks it `SKIP` and reports the whole run `INCOMPLETE` rather than green; `ARENA_CHECK_STRICT=1` — or `CI=true`, so an automated run never
skips quietly — makes that a hard failure instead. An Angular primitive's recipe is its
manifest — `frameworks/angular/primitives/tag/` is the reference shape.

**When `bun run check` is expected: once, when a plan's implementation is
finished — not before every commit.** The individual gates are cheap and stay
available per commit (`check:dimensions` after touching a framework layer,
`check:tokens` after a rebuild), and a task that widens a gate should still
watch that gate fail and then pass. But the full sweep is a completion gate,
not a per-commit toll. Stating this is what lets a gate be expensive enough to
be worth having: the `@dsCard` viewport check needs a browser and a real
render, and it could never have been afforded at one run per commit.

## Conventions

- **English only.** The repo was fully translated from Spanish; all code, comments, docs, and UI copy stay in English.
- **Specs and implementation plans live under `docs/superpowers/`** (`specs/`, `plans/`), dated `YYYY-MM-DD-<name>.md`. They are in English like the rest of the repo. **A spec written ahead of its plan carries a `-pending-N` suffix until that plan exists**, because an unsuffixed spec sitting in `specs/` reads as work in flight; drop the suffix when the plan lands (`89c3d1b` → `ec9d4de` is the worked example). This convention was itself recorded only inside a spec, and was rescued when that spec was deleted.
- **No gradients** on any surface (the sole exception is `Skeleton`'s neutral shimmer). Depth comes from the `base-100`→`base-200`→`base-300` surface scale, the hairline border, and the warm shadow.
- **No emoji**, in product or docs.
- **Danger is outline, never filled** — transparent background, border and content in `--error`/`--danger`. The only filled danger surface in the whole system is the final irreversible confirmation inside `ConfirmDialog`. See `guidelines/components-danger.html`.
- **A commit message containing a backtick is written with a quoted here-doc**, never
  `git commit -m "…"`. A backtick inside a double-quoted shell string opens command
  substitution and is silently spliced away — the message lands with the name it was
  quoting missing, and nothing errors. Use `git commit -q -F - <<'MSG' … MSG` and verify
  with `git log -1 --format=%B`. **`git merge` does not accept `-F -`** — use
  `--no-commit`, then commit. This lived only in each plan's Global Constraints, which are
  deleted once the plan is executed, so it was re-derived by every batch; it is here now
  for the reason the *Known debt* preamble gives.
- **A release moves four things, and the tag is one of them.** The version string lives in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and the README header; log the change in `CHANGELOG.md`; and because the plugin is served **from the tag** (`marketplace.json` → `source.ref`), that ref must name the release tag and the tag must exist on the release commit. Do all of it in the release commit, then tag it: the tag then contains a `marketplace.json` that points at the tag itself.
- **Anything landing on `main` after a tag goes under `## [Unreleased]`**, and a release is cut by renaming that heading to the version. Filing it under the last version instead describes a tree nobody has — the plugin is served from the tag, so the release is frozen the moment it is cut. This has been got wrong twice; `check-release.mjs` reads the first *versioned* entry, so `[Unreleased]` on top is expected and never a failure.
- **Forgetting the `ref` fails silently**, which is why it is machine-checked rather than written down and hoped for. The marketplace would advertise the new version while Claude Code keeps fetching the old tag, reads the *old* `plugin.json` there, and resolves the old version. The manifest's version always wins over the marketplace entry's, so the update is never offered and nothing errors. Verify with `bun scripts/check-release.mjs` — it reads the version from `plugin.json` (the authority) and asserts the marketplace entry, the README header, the CHANGELOG's top entry, `source.ref` and the tag all agree, and above all that **the `plugin.json` at the pinned tag hands out the version being advertised**. Run it before publishing; a release that skips it is the one that ships nothing.
- **Charts** carry identity (the `--color-cat-*` ramp, in order, never cycled) or meaning (`tone`, the status colors) — never both in one chart. Status colors are never series colors. One axis, always.
- Responsive branches are JS, not media queries (inline styles cannot hold one), and measure the **container** via `useContainerWidth` — not the viewport.

## Known debt

Things that are wrong or incomplete on purpose, recorded so the next reader does
not rediscover them. **This section is the index; most debt lives next to the
code it burdens, and the list at the end says where.**

Debt belongs here — not in a spec or a plan under `docs/superpowers/`. Those are
deleted once executed (`24f250b`, *"delete the executed specs and plans"*), and
debt filed in one dies with it. That has already happened once: plan 5.5's
close-out recorded three follow-ups into its own plan document, which was
scheduled for deletion the same week.

- **The two script-readable gates leave a structural hole between them, and it is
  wider than it looks.** `check:script-tokens`' orphan rule is *imported by at
  least one layer* — correct, because `calendarHourH` is legitimately React-only
  (Angular has no `Calendar`). But once one layer imports a token, that gate says
  nothing about whether the other still carries its own copy.
  `check:duplicate-constants` does not close it: it fires only when **both**
  layers declare a module-level named numeric `const`, so a layer that imports
  the token has no declaration left to pair with.
  The layers make this worse by having opposite idioms — React writes design
  numbers inline in function bodies, Angular names them at module level — so the
  gate requires a symmetry that is usually absent. **Of the values still
  duplicated verbatim across the layers today (`600`, an axis-label `8`, `0.34`,
  `0.62`, `900`, `220`), it catches none.** It caught three of the historical
  five only because `chart-internals` happened to be symmetric in both layers.
  The sharper rule, if this is ever worth closing: for each flagged token, assert
  that **every** layer either imports it or contains no module-level `const`
  whose value equals it. That would have caught `Onboarding.manifest.json`'s
  `w-80`, which shipped and had to be fixed by hand.
- **Two 8px insets meet the chart-token criterion and were left out.** The
  doughnut's `rOuter` inset (`DoughnutChart.jsx`, `doughnut-chart.ts`), commented
  as *"breathing room so a slice's stroke is not clipped"*, and the axis-label
  offset in `PAD.l - 8` / `height - 8`, which appears six times across the two
  layers. Both are spacing decisions in px, indistinguishable in kind from
  `--chart-pad-top`, which **is** a token and is also 8. This is debt, not scope:
  the recorded rationale for the other chart exclusions — *a multiplier that
  derives one dimension from another is not itself a design value* — does not
  cover either of them, so a reader applying it reaches the opposite conclusion.
- **Two behaviour families were proposed and not shipped**, and the reasons
  should be re-read before anyone adds them. `debounce` is speculative:
  `CommandPalette` filters a local array synchronously and `ResizeObserver`
  already coalesces, so debouncing either adds latency and removes nothing.
  `limit.results` would introduce a palette result cap that does not exist
  today, which is a product decision with a UX consequence rather than a
  tokenization of an existing value.
- **A group-level `$description` in `tokens/src/` never reaches the generated JS
  modules.** `collectScriptTokens()` in `scripts/build-tokens.mjs` skips group
  nodes (`if (item.group || !isScript(item.token)) continue;`), so only a
  leaf token's own description is carried into
  `frameworks/react/tokens.generated.js` and
  `frameworks/angular/tokens.generated.ts`. Group prose survives only in the
  CSS. This is pre-existing and not caused by this plan — `chart.json`'s group
  description is lost the same way — but it bit here: `delay`'s group
  description carries the constraint that these delays are pointer intent and
  that a keyboard focus must reveal immediately, and someone reading only the
  generated module will not see it.
- **`delay` and `dismiss` govern React only, and Angular is not silently exempt
  — it just has no token-shaped seam yet.** Plan 7a's own Global Constraints
  first misstated this as the same "Angular has no primitive" asymmetry that
  is correct for `debounce`-style speculation, when it is not: Angular has no
  `Tooltip`, `Toast` or `Pagination` **primitive**, but it provides all three
  through Angular Material, dressed by `arena-material.css` — the same
  "Material provides the control" bucket most Tailwind manifests
  belong to (`Tooltip.manifest.json`, `Toast.manifest.json` and
  `Pagination.manifest.json` all exist). `check:script-tokens` cannot see
  this — its orphan rule is "imported by at least one layer," and it is
  satisfied by React alone by construction, the same structural blind spot the
  first bullet in this section describes for chart internals. So today:
  React's `Tooltip` waits `--delay-open`/`--delay-close` before a pointer
  reveals or withdraws it; Angular's `matTooltip` does not — `showDelay` and
  `hideDelay` default to 0, so the exact flash-on-crossing defect plan 7a
  fixed on the React side is still live on the Angular side. Likewise React's
  Delivery Console runs the toast clock off `--dismiss-default` /
  `--dismiss-actionable`; Angular has no consumer wiring `MatSnackBarConfig`'s
  `duration` to either value at all. The seams a future pass would bind these
  through are `MAT_TOOLTIP_DEFAULT_OPTIONS` (`showDelay`, `hideDelay`) and
  `MatSnackBarConfig.duration` — neither is wired today.
- **Both grid components now navigate by keyboard, and neither claim has a suite behind
  it.** `Table` and `Calendar` each bound `grid` with an exception on **all eight**
  requirements — zero `role=`, zero `tabIndex`, zero key handling, in components that
  render interactive data. That was invisible before the contract layer, which is the
  clearest evidence that layer was worth building. Both are fixed: `Calendar` retired all
  eight, and `Table` retired seven, keeping **one** — `focus.roving`, and it is true of
  **card mode only**. Below `--bp-md` the table is one card per row — a list, not a grid,
  where the rest of the pattern is *vacuous* rather than unmet — and a card whose
  `TableRow` carries a `click` has no keyboard route at all. The obvious fix is invalid
  ARIA (`tabIndex={0}` plus `role="button"` cannot go on a card that also contains the
  consumer's own buttons, which is exactly what a `mobileLayout: 'block'` column draws
  inside it), which is why it is recorded rather than done — and the binding cannot scope
  a requirement to a variant, the same limit `Skeleton` proves, so it reads as
  unconditional and is not. **What stays true of both is the verification, not the
  behaviour**: `grid-keyboard.test.jsx` is the one suite the grid rule excludes, so
  neither component can appear in `COVERED`, both are DOM-tested by hand, and
  `Calendar`'s now-exceptionless binding and `Table`'s surviving exception are alike
  unverified claims. See the grid-rule entry below.
- **The binding schema cannot express "this pattern applies conditionally".** `Tag`
  renders a real `<button>` only when `onRemove` is passed; without it — the common
  case — it is a plain `<span>` matching no interactive pattern at all. It is bound to
  `button` with an exception as a stopgap, so a reader of the binding alone would think
  the pattern always applies. The spec's own open questions name this unresolved: "How
  does a pattern express an optional requirement?" was answered by pushing anything
  per-component into the binding rather than the pattern, and a whole pattern applying
  only sometimes is the same problem one level up, still open.
- **A behaviour text scan was designed, built, measured and rejected — do not
  re-propose it without reading this.** Plan 7c's spec proposed a static scan of
  component sources as the cheap tier beneath the render suites. It was
  implemented as a probe and run against the whole tree before being cut. In the
  "claimed met but no textual evidence" direction it reported **60 of 118 true
  claims as unmet (51%)**, across 25 components, because of a cause the spec never
  named: **implicit ARIA**. A native `<button>` satisfies `roles.element`,
  `keyboard.Space` and `keyboard.Enter` while leaving nothing to grep;
  `<input type="checkbox">` satisfies `states.checked`. A text scan penalises
  exactly the correctly-authored components. In the "exception is now stale"
  direction it wrongly retired **18 of 94 live exceptions (19%)**, and **all
  eighteen are irreducible** — none is a regex that could be sharpened. Each is a
  claim about *placement* (`Menu`'s `aria-haspopup` on a wrapping `<span>` rather
  than the focusable trigger), *branch* (`Skeleton`'s `role="status"` in three of
  four variants), *conditional value* (`alert.ts`'s
  `'[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"`, and `Toast.jsx`'s
  same shape), or *semantic completeness* (`Menu`'s Enter opens the menu but never
  moves focus). A rendered DOM resolves all three at once, which is why the render
  suites absorbed the stale-exception check instead of sharing it with a scan.
  **This is still the reason not to re-propose a scan**, including as the cheap tier
  beneath the grid rule, where a scan looks superficially attractive because the hand
  check it would supplement is not machine-checked at all: a scan's measured error rate
  is what it is regardless of what sits above or below it, and a 51% false-unmet rate
  is worse than an honest hole.
- **A binding cannot scope an exception to a variant, and `Skeleton` is the proof.**
  `Skeleton`'s `roles.element` and `live.politeness` exceptions are true of the
  `circle` variant and false of `block`, `line` and `text`. The compliance suite
  works around it by asserting against the `circle` variant specifically, which
  pins the claim but leaves a reader of the binding alone believing the exception
  is unconditional. This is the same gap already recorded for `Tag`'s `button`
  pattern applying only when `onRemove` is passed — one level down, at the
  requirement rather than the pattern, and still open. The spec's own unresolved
  question, *"How does a pattern express an optional requirement?"*, is this.
  `comparePattern`'s stale-exception message has no vocabulary for "true in one
  variant" either — it offers only "delete it or name a subject".
- **`Tooltip.behaviour.json` claims `roles.describedby` unconditionally, and the
  implementation only meets it for some children.** `aria-describedby` is added
  by `cloneElement` onto the consumer's own child, which only works when that
  child is a single element that accepts and forwards props. A reader of the
  clean `"exceptions": []` would conclude the requirement always holds, and it
  does not: a bare string or other non-element child leaves `React.isValidElement`
  false, so the prop is never added and nothing warns; a component that ignores
  the prop drops it just as silently; and a **fragment is the trap** —
  `React.isValidElement` is true for a fragment, so the clone succeeds, but a
  fragment renders its own children and ignores every other prop, so the
  attribute never reaches the DOM with nothing announcing the loss. Today the
  only place a consumer is warned is `Tooltip.prompt.md`'s Do/Don't, and nothing
  machine-checks it: the compliance suite renders a prop-accepting child by
  construction, so it proves the good case and can never exercise the bad ones.
  This is the same open question already recorded above for `Tag`'s `button`
  pattern and for `Skeleton`'s variant-scoped exceptions — a binding cannot
  express "this requirement holds only for some inputs" — one more instance
  rather than a new one. There is no grep for the set of instances, because a
  requirement holding only for some inputs is a property of the implementation,
  not a string in the binding — that absence is exactly why the schema cannot
  express it. `Tag`, `Skeleton` and this entry are recorded here case by case
  instead, and finding the next one means reading a component's implementation
  against its binding, not searching for a phrase.
- **A grid component's DOM behaviour is checked by eye, and that is a rule with a
  price.** `frameworks/react/test-dom/` was deleted whole for its RAM cost and
  restored minus one suite, so the standing rule is narrow: **a component whose
  behaviour binding names the `grid` pattern is DOM-tested by hand — serve the tree
  with `bun run demos` and operate the component on its `*.card.html` page.** It is
  tied to the binding rather than to a judgement about what looks like a grid, so it
  is a grep rather than an argument, and a component that becomes a grid later
  inherits it without anyone remembering. Today it selects exactly `Calendar` and
  `Table`.

  The rule is a measurement, not a preference: `grid-keyboard.test.jsx` alone peaked
  at 164 MiB — 194 before its two performance fixes — while the other six suites
  together peaked at 109 and the whole directory at 171. The grid cost more than
  everything else combined, because its fixture is 6 days × 14 hour cells = 84 cells
  per mount, mounted eight times, with 160 key events dispatched through `act()`.
  Cutting there cuts exactly where the cost is; the directory was never the problem.

  **What the rule costs, and it is one thing rather than a list.** `Calendar`'s
  keyboard navigation is not machine-checked: `grid-keyboard.test.jsx` was the only
  proof of the roving tab stop, the four-edge clamp, Home/End within a day column,
  and Enter/Escape into and out of an event chip, and the binding retired all eight
  `grid` exceptions in the same batch — so it claims **full** compliance with the
  `grid` pattern with nothing rendering it, and `Calendar:react` cannot appear in
  `COVERED`. `Table` is in the same rule and has always been uncovered; what stands
  unverified there is its **one** surviving exception — `focus.roving`, true of card mode
  alone — plus the seven requirements it now claims to meet, so it is a claim of
  near-compliance rather than of nothing.
  What partly guards `Calendar` instead is a **static** tab-stop count in
  `frameworks/react/test/calendar.test.jsx` — a grid is one tab stop, and that count
  is a property of the markup rather than of behaviour, so a DOM-free suite can hold
  it. It catches a second tab stop appearing inside the grid. It does not catch an
  arrow key that stops moving, and it is the whole of what stands in for a suite.

  **What the restore bought back**, all of it green again and none of it worth
  re-deriving from scratch if the directory is ever touched: that the six form
  controls' events *fire* at all (`form-control-events.test.jsx` dispatches real
  events and proves `Input`, `Textarea`, `Select`, `Checkbox` and `RadioGroup` hand
  the consumer a **value** rather than the DOM event — the DOM-free suites assert
  only the *shape* of that and say so in their own headers); `Tooltip`'s
  single-timer rule, cancel-on-transition and unmount cleanup; the stale-exception
  rule in behavioural form, where `behavioural.test.jsx` pinned four live defects of
  `Dialog`/`ConfirmDialog` — no Escape, no focus on open, no restore on close — by
  asserting they were *still broken*, **and where plan 8C4 then INVERTED every one of
  those assertions in the change that fixed the defects**, which is the mechanism
  working end to end rather than an exception quietly outliving its subject; `Menu`'s
  misplaced `aria-haspopup` and
  `Skeleton`'s `circle` branch, the two mistakes the rejected text scan got
  backwards; and the failure path of the compliance wrapper on the React side, four
  tests that write deliberately false bindings to a temp file and prove STALE
  EXCEPTION, OVERCLAIM, "no subject element" and "not declared behavioural" actually
  fire.

  If the grid suite is ever wanted back — which would mean paying the 164 MiB and
  retiring this rule — it does not need rewriting:
  `git show edb9f3e^:frameworks/react/test-dom/grid-keyboard.test.jsx` is the file,
  and it would need `Calendar:react` restored to `COVERED` alongside it.
- **Compliance coverage is a small fraction of the bindings and nothing schedules the
  rest.** `bun run check:compliance` prints the live pair; do not trust a figure written
  here, which has drifted once already — every batch that adds a component adds a binding
  and moves the denominator without touching this line.
  `COVERED` guards the accuracy of what it claims, never the completeness of it, so
  the uncovered bindings — including `Table`'s seven newly-met `grid` requirements and
  its one surviving `focus.roving` exception, **and `Calendar`'s claim of full `grid`
  compliance, which the grid rule keeps out of a suite permanently** — remain
  exactly as unverified as they were before this gate existed. The gate was built
  that way on purpose: one demanding a suite per binding on day one would have been
  switched
  off. The consequence is that the layer's headline property, *an exception can
  expire*, holds for the handful of components in `COVERED` and nothing else.
  `figure-with-data-table`'s `roles.label` half stays unverifiable regardless — a
  suite can assert an `aria-label` exists, never that it is a good name for the
  chart. **`COVERED` is keyed by `<component>:<layer>`, not by component name**: several components
  (`ConfirmDialog`, `Skeleton`, `Alert`, `BarChart`) are bound in both layers, and a
  name-only key let a mention of *either* layer's binding satisfy the claim — so `ConfirmDialog`'s
  React suite marked its unverified Angular contract covered, and `Alert`'s Angular suite did the
  same to its React one. Each entry names the one layer its suite verifies
  (`Alert:angular`), and `validateCoverage()` resolves that layer's binding alone; the sibling layer
  is simply uncovered, which the gate is silent about by charter but no longer reports as satisfied.
  A key without a `:layer` suffix is rejected, so the old name-only shape cannot creep back.
- **Seven exceptions rest on a `behavioural` verdict no suite in either layer
  declares.** `ActivityFeed`'s `posinset`/`busy`, `Tag`'s `disabled`,
  `Input`'s and `Textarea`'s `readonly`, and Angular `activity-feed`'s
  `posinset`/`busy` are requirements no single element can decide from the DOM, so
  the suite asserts each by acting on the tree and records the verdict in
  `behavioural`. That verdict is trusted, not re-derived: a suite that declares the
  wrong verdict pins a false claim exactly as a scan would have. And `comparePattern`
  **throws** on an unknown requirement key or a missing `ELEMENT_ROLE` entry — one
  bad key aborts the whole test rather than reporting one problem, so a suite's
  wrapper (`frameworks/react/test-dom/assert-pattern.jsx`,
  `frameworks/angular/test/compliance.ts`) must expect the throw, not only a
  returned problem list. **None of those seven is pinned by a suite today, in either
  layer** — verified by grep: no `behavioural` map in `frameworks/react/test-dom/` or
  `frameworks/angular/test/` names `posinset`, `busy`, `readonly` or `disabled`. The
  restore of the React suites did not change that, and the deletion was never what
  caused it; the only `behavioural` verdicts any suite declares are the
  `Dialog`/`ConfirmDialog` focus and keyboard keys, `Menu`'s, `Skeleton`'s
  `focus.unaffected`, `Alert`'s, and the two charts' `alternative.table`.
- **Angular has no `Calendar`, and nothing has decided whether it should.** React's
  `Calendar` is a day/hour schedule grid with absolutely-positioned event blocks;
  Angular has no equivalent from either an `arena-*` primitive or Angular Material —
  `mat-calendar` is a month/date-selection grid, a different widget solving a
  different problem. `frameworks/angular/behaviour-delegated.json`'s `Calendar` entry
  binds pattern `absent` and records this as a fact, not a decision: it does not
  commit Angular to gaining a schedule view, and it does not resolve whether the gap
  should stay this way. It is simply open.

- **A chart's `aria-label` is checked for existence, never for usefulness, and the
  charts fall back to a name that is only their type.** `figure-with-data-table`'s
  `roles.label` requires "aria-label naming the chart", and
  `frameworks/angular/test/chart-data-table.test.ts` proves the three verifiable
  parts of that pattern against a real render — the `<table>` exists, it is
  visually hidden rather than absent, and its cells pair each category with its
  plotted value. It cannot prove the fourth. All three charts now have a
  consumer-supplied name path — `seriesLabel`, which `DoughnutChart` gained when the
  charts came under the API contract, so the earlier worst case of a literal with no
  caller path at all is closed — and all three still fall back to a name that is only
  their type when none is given: `bar-chart.ts` emits the constant `Bar chart`,
  `line-chart.ts` and `doughnut-chart.ts` the same. **The debt that remains is the
  harder half: a name that is *present* is never checked for being *useful*.** A
  fallback satisfies the requirement mechanically while telling a screen-reader user
  nothing — a page with two bar charts on it announces both identically — and a
  `seriesLabel` of `"Chart"` would satisfy it just as mechanically. No assertion
  separates a present name from a useful one; that is human judgement, and the suite
  pins the fallback rather than faking a verdict on it. The React charts do the same
  thing and are not covered by a suite at all.

- **Every claim the delegated declarations make about Angular Material is unpinned.**
  `frameworks/angular/behaviour-delegated.json` asserts what Material's controls do —
  that `MatButtonToggleGroup` applies `role="group"` rather than `role="radiogroup"`,
  that `MatTable` adds no keyboard handling, that `matTooltip`'s `showDelay` defaults to
  0 — and which Material surfaces `arena-material.css` dresses. **None of it records the
  Material version it was verified against**, which was `@angular/material` 22.0.5. If a
  Material release fixes one of those, nothing notices: `check:behaviour` verifies that a
  declaration names a pattern and requirement that exist, never that a claim about a
  third-party library is still true, and the whole suite stays green while the reason
  strings quietly become false. The `dressedBy` claims rot the same way from the other
  side — add a `.mat-mdc-checkbox` rule to the bridge tomorrow and eight entries still
  assert the bridge has none. Two cheap mitigations, neither yet done: record the
  verified Material version as one top-level field and check it against `package.json`,
  and have `check:material` assert that every `dressedBy` path really contains a rule
  matching the named control's host class — the same shape as `check:states`' own
  staleness rule.

- **`check:api` asserts three of its five rules, not five.** R1 (an object is pure
  data) is enforced by the type schema, R4 (no platform types) by the reader
  recognising them by name, and R5 (no unions between forms) by a member carrying
  exactly one form. **R2 and R3 are not machine-checkable and nothing checks
  them.** R2 — "who draws decides data versus slot" — is a fact about markup
  ownership, and a contract naming a slot for content Arena actually draws passes
  the gate. R3 — "a parameterised slot fills, never replaces" — is a fact about the
  rendered tree; `check:compliance` is the only layer that can see a rendered tree,
  and it does not read contracts. Both are authoring rules the audit protocol
  applies, which means they are exactly as strong as the audit that applied them.
  `TableColumn.render` was named here as the member where R3 would first matter; it never
  did, because the per-item convention removed it rather than modelling it, and the
  reader refuses that shape on the convention's authority and not R3's. **No shipped
  contract declares a parameterised slot** — verify with `grep -rn '"params"'
  api/components/`, whose only hit is `Input.validate`'s `functionInput` — so R3 is
  today unchecked and also unexercised. That is not a mitigation: the moment a
  contract does declare one, the rule is exactly as unverifiable as this entry says.
  Two more gaps, neither an authoring rule and both closeable in
  principle: **`default` is documented in the contract format and read by nothing** —
  most shipped contracts carry one, but `spec.default` is referenced nowhere in
  `scripts/`, so a contract's stated default can disagree with both layers' real
  defaults with nothing to say so. Left unimplemented on purpose: React's default lives
  in a `.jsx` destructuring pattern the gate never reads (the next point), so the
  comparison could only run against Angular, which is worse than not claiming it. And
  **React's checked surface is its `.d.ts`, never its `.jsx`** — `check-api.mjs` reads
  `<Name>.d.ts` and never opens the implementation, while Angular's surface comes from
  its real `<name>.ts` component; restoring `style, ...rest` to `AppLogo.jsx` right now
  would leave `check:api` green, since nothing looks at the `.jsx` again once the `.d.ts`
  agrees with the contract. A gate whose claim is "an API divergence is a defect" enforces
  that claim against real source on one layer and against a hand-written declaration on
  the other.

- **Three Angular primitives import a contract type with a value import, and nothing
  checks it.** The convention is `import type { X } from '../../api.generated'` in both
  layers — every declaration in `api.generated.ts` is a type and none of them exists at
  runtime (`export type` for the enums, `export interface` for the predefined objects), so
  a value import there is a type-only import written without `type`. `avatar.ts`,
  `alert.ts` and `page-head.ts`
  each write the bare form instead. It compiles and nothing has ever broken because of it;
  it is recorded because it is a live inconsistency no gate can see, and because it was
  previously written down **only inside plan 8B3**, which was deleted when that plan was
  executed. That is the exact failure mode this section's preamble names.

- **Plan D owes `functionInput` an Angular implementation. The spelling is no longer open;
  only the implementation is.** `Input.validate` is the repo's only `functionInput` and
  `Input` the only contract carrying `kind: "input"`, and both exist in React alone, because
  every contract in Plan C is single-layer. Angular's signal idiom discourages a function
  input — the reflex is an output plus a validator service, or a `ControlValueAccessor` wired
  into Angular Forms — but the contract's modelled signature (`params: {value: string}`,
  `returns: string`) is not negotiable at implementation time: `check:api` compares that
  signature between the contract and each layer, so a reshape is a contract change, not an
  implementation choice. That is the whole point of sequencing Plan C ahead of Plan D — the
  API is settled and normative *before* Angular has an implementation to defend.
  **8C2 recorded this as more open than it was, and 8C3 measured it.** The reader was never
  the obstacle: `angularSurface()` has read `readonly validate = input<(value: string) =>
  string>()` as `{form:'functionInput', params:{value:'string'}, returns:'string'}` since the
  ninth form landed, and that bare arrow — with required-ness carried by `.required`, never by
  a `| undefined` arm — is the spelling `api/README.md` now states normatively and
  `scripts/api-surface.test.mjs` pins. What did fail was the *optional* spelling
  `input<((value: string) => string) | undefined>()`, and it failed on parse ORDER rather than
  on any rule: `classify()` tested its arrow pattern before reducing the annotation, backtracked
  onto the inner `)`, and read the return as `string)`. That is fixed — a nullable annotation is
  now reduced to the annotation it wraps before any form is tested — so both spellings read
  identically and Plan D has nothing left to discover about the reader. What remains owed is an
  Angular `Input` that declares the member; no Angular component was touched, here or in 8C2.

- **`ControlSize`'s description is inaccurate for two of its four consumers, and the
  reuse is still correct.** `api/types/control-size.json` says *"Heights come from the
  density tokens, so a control inside `.arena-compact` re-densifies with the rows around
  it."* True of `Button` and `IconButton`. False of `ProgressBar`, whose thickness is
  `--sp-1`, `calc(var(--sp-1) * 1.5)` and `calc(var(--sp-1) * 2.5)`, and of `Spinner`,
  whose diameters are `--icon-sm`, `--sp-5` and `--sp-8`. `.arena-compact` redefines only
  the `--dz-*` family (`tokens/spacing.css`), so neither re-densifies. **The shared enum is
  the right one either way** — both implement all three steps, and the alternative is a
  fourth `sm md lg` enum with an identical value set, which is exactly the duplication the
  enum-reuse rule exists to prevent. Only the description is wrong, and a description is
  what a new platform target reads first.

- **`Table.empty`'s real default is stated in none of its three surfaces.**
  `Table.jsx` destructures `empty = 'No data.'`; the contract, the `.d.ts` and the
  `.prompt.md` all describe the member and none of them names the string. Pre-existing —
  inherited from before `Table` was contracted, not introduced by contracting it — and
  related to the already-recorded fact that `spec.default` is documented in the contract
  format and read by no gate, so nothing would have caught the omission or would catch the
  three surfaces disagreeing once one of them is filled in.

- **The two required slots in the repo are treated oppositely at runtime, and only one of
  the two treatments has a stated reason.** `Tooltip.content` deliberately takes **no**
  guard: `compareSurface` excludes slots from required-ness comparison, because Angular's
  `<ng-content>` cannot express mandatory, so a `children` guard would enforce in React
  something the contract can never hold Angular to. `AppLogo.mark` is the only other
  required slot and **is** guarded — `if (!mark || !name) throw`. Both cannot be right. If
  the `Tooltip` reasoning holds, `AppLogo` is now wrong and its guard is a React-only
  invariant the contract does not carry; if `AppLogo` is right, the rule is that a required
  slot is enforced per layer and `Tooltip` owes a guard. Nothing decides it, and no gate
  can: the exclusion in `compareSurface` is what makes both pass.

- **`Tabs`'s total-exception `tabs` binding was paid down, and what that cost is worth
  recording.** The prior entry here named a deliberate asymmetry: `Calendar` and `Table`
  had their `grid` exceptions retired while `Tabs` sat untouched, because the component
  that contracted its API in the same batch said in its own commit message that
  contracting an API is orthogonal to accessibility. That asymmetry is now resolved rather
  than merely explained — `Tabs.behaviour.json` reads `"exceptions": []` — and resolving it
  needed an API change, not only a keyboard one: a component that rendered no tabpanel and
  wired no `id`/`aria-controls` between a tab and its panel could not meet `roles.tabpanel`
  or `roles.controls` however much arrow-key handling it grew, so the panel and its wiring
  had to exist before the keyboard behaviour had anything to attach to. Unlike `Calendar`
  and `Table`, `Tabs` binds `tabs` rather than `grid`, so it was never inside the hand-check
  rule, and `frameworks/react/test-dom/tabs.test.jsx` now backs the claim with a render
  suite — `Tabs:react` is in `COVERED`. What the fix did **not** buy: the interior of the
  roving tab stop (that Tab from elsewhere in the page actually lands on the active tab)
  is still unverifiable in happy-dom, same as the rest of this repo's focus claims, and is
  a by-hand check against `Tabs.prompt.md` rather than a gate.

  **And the suite that backs it could not see the defect the binding's own wording names,
  which is what batch 8C7 was for.** A requirement in `ATTRIBUTE_FOR` used to be evaluated as
  `el.getAttribute(attr) !== null` — pure presence, on the ONE subject element the suite hands
  it. So `roles.controls`, whose text is *"**each** tab has aria-controls referencing its
  tabpanel"*, was satisfied by a strip in which N−1 tabs referenced ids nothing rendered: the
  attribute was present, the suite passed it the first tab, and the fixture made the first tab
  the selected one. Both halves of that are now closed, and closed differently, because they
  failed for different reasons. **A reference is resolved rather than counted** — `IDREF` names
  the requirement keys whose attribute is a reference, and each is looked up through a
  `resolveId` the *caller* injects, because the evaluator still touches only `tagName`,
  `getAttribute`, `hasAttribute` and `textContent` and still runs in three runtimes one of
  which has no DOM. Resolution had to arrive from outside rather than be done in place, so
  each layer's wrapper builds the resolver from the render root itself and a suite cannot
  forget to pass one; a requirement in `IDREF` evaluated with no resolver **throws**, since
  degrading to the old presence check would report a dangling reference as met, which is the
  whole defect the parameter exists to catch. **And *each* is quantified rather than sampled** —
  a subject may be an array, every element in it must meet the requirement, and a quantified
  requirement handed a single element throws as well. `tabs.test.jsx` hands over every tab
  instead of resolving its `aria-controls` by hand.

  What none of that buys, and none of it is scheduled. **A resolved reference is not proof it
  landed on the RIGHT element.** A pattern states its requirement as prose written for a human,
  and the schema has no way to say what *kind* of element a reference must reach — so an
  `aria-controls` resolving to a `<span>` that is not the tabpanel passes exactly as the real
  one does. Closing that is a change to the pattern schema, which this batch deliberately was
  not. **The quantified set is hand-curated, and nothing proves it complete.** Deriving it from
  the word "each" was considered and rejected: the prose says "false on the **rest**" just as
  readily, so a scan finds fewer requirements than a reader does, and deriving it would rebuild
  the false-negative class the evaluator's header already rejected once. Its suite therefore
  proves only that every entry names a real requirement and that a quantified requirement is
  decidable per element — never that a requirement quantified in prose has an entry. One nobody
  curated is still checked on the one element a suite chooses, exactly as before. **And two
  requirements that do quantify are excluded for stated reasons rather than closed**:
  `feed:states.posinset` is behavioural, its prose carrying a "when", so there is no
  per-element verdict to quantify over at all; and `navigation:roles.label` quantifies over the
  navigation landmarks on a *page*, and only when more than one exists, which a component suite
  cannot render without faking a second landmark to satisfy a rule that is not a claim about
  the component. Both are listed in `NOT_QUANTIFIED` rather than merely absent, so the next
  reader meets the decision instead of the silence.

  All of this reaches a binding only through a suite that renders it, so a binding outside
  `COVERED` gains nothing from any of it — see the coverage entry above, which is where that
  hole is recorded.


- **`check:api` now compares a `primitive` member's `type`, and two prior live examples of
  the gap are guarded because of it.** The entry used to read "does not compare" — probed in
  five directions against a finished tree, the gate caught a required-ness change, a renamed
  event, a changed `form` and an event's changed `payload` type, but let a `.d.ts` declaring
  `width?: number` against a contract saying `string` stay green. Batch 8C6 closed exactly
  that: `compareSurface` (`check-api.mjs`) now checks `spec.form === 'primitive' && m.type !==
  spec.type`, so both of the cases this entry cited by name are caught if they regress.
  `Dialog.width` — a `number` the `.d.ts` once declared against the `string` the implementation
  always produced — would now fail the gate instead of reverting silently. `SideNav.indentStep`
  is the sharper of the two: its contract spends four lines arguing that a caller-supplied
  `"1.5rem"` string is neither a token nor a derivation of one, so it stops re-densifying inside
  `.arena-compact`, and `check:dimensions` cannot catch it because that gate scans source and not
  the values a caller passes in — the type comparison was the only mechanism that could ever
  have enforced that refusal, and now it does. It is the clearest case in the repo for why the
  clause was worth adding.
  **What the entry recorded alongside the type gap is untouched by this fix and still true.**
  `spec.default` is documented in the contract format and read by nothing — no gate compares a
  contract's stated default against either layer's real one. And React's checked surface is
  still its `.d.ts`, never its `.jsx`: `check-api.mjs` reads the declaration file and never opens
  the implementation, so a `.d.ts` that agrees with the contract passes regardless of what the
  `.jsx` actually does — the same class of gap the `{...rest}`-spread loss elsewhere in this
  section depends on.

- **`Onboarding`'s accessible name is positional when a step carries no editorial text, and
  it collides with its own progress dots.** The chain is `title ?? eyebrow ?? "Step N of M"`
  in BOTH layers as of 8C4 — React ported Angular's rather than `OnboardingStep.title` being
  made required, which would have broken a shipped two-layer contract. The price: on a step
  with neither `title` nor `eyebrow`, the panel's `aria-label` is byte-identical to the
  `aria-label` already on the progress-dots div **inside that same panel**, so a screen
  reader announces the two the same. This is the shape the charts' `aria-label` entry already
  records — a name that is present, satisfies `roles.label` mechanically, and tells a
  screen-reader user nothing — and it is why `Table.label` and `SegmentedControl.ariaLabel`
  were guarded rather than defaulted. It ships knowingly, and
  `frameworks/react/test-dom/onboarding-modal.test.jsx` asserts the collision rather than
  papering over it.

- **`SideNav`'s D1 flatten dropped every forwarded attribute and no gate stands behind the
  loss.** `extends React.HTMLAttributes<HTMLElement>` and the `{...rest}` spread are gone, so
  every global and ARIA attribute a consumer used to be able to forward is unreachable. This
  is the same unguarded-loss shape 8C1-8C3 each recorded, and it is unguarded for the same
  reason: `check:api` reads the `.d.ts` and never opens the `.jsx`, so a restored spread
  would leave it green. **This batch narrowed the hole for its own four**, though: `Dialog`,
  `Menu`, `Pagination` and `SideNav` each carry two dedicated regression tests, one per
  escape, so a restored spread now goes red in a suite even while the gate stays green. The
  general problem is untouched for every component the four do not cover.

  **Those pairs are worth only what their induction proves, and the induction must be
  DISJOINT.** With `style` unnamed in the destructuring it falls into `rest`, so a bare
  `{...rest}` spread is a strict *superset* of the style escape and correctly fails **both**
  tests at once. That is the escapes overlapping, not the tests failing to be independent —
  and reading it as the latter is how a pair gets weakened until it proves nothing. Proving
  independence takes two separate inductions: **(a)** `style` alone, where the style test
  alone must fail, and **(b)** `style` destructured **and discarded** plus `...rest`, where
  the attribute test alone must fail. Never weaken a test to make an induction come out
  tidy. Established in plan 8C5 and re-measured against `SideNavItem` before this was
  written here: (a) failed `SideNavItem drops a consumer style object` and nothing else,
  (b) failed `SideNavItem drops a consumer attribute` and nothing else.

- **`Menu.trigger` is the repo's THIRD required slot, and it landed on the unguarded side of
  a question nothing has decided.** `AppLogo.mark` is guarded, `Tooltip.content` deliberately
  is not — the contradiction already recorded above — and `Menu.trigger` now joins the second
  camp without a note in its contract, its `.d.ts`, its `.prompt.md` or its commit. Defensible
  on the `Tooltip` precedent, since `compareSurface` excludes slots from required-ness
  comparison precisely because Angular's `<ng-content>` cannot express mandatory. Recorded
  because a third instance makes the silence a pattern rather than an oversight.
  **8C5 added a fourth, `SideNavSection.content`, and it went to the guarded camp** — a
  childless section throws — which makes the split two-and-two and settles nothing. It shipped
  declared *optional* in both the contract and the `.d.ts` while the implementation enforced it,
  and 8C5's close-out review corrected that to match `AppLogo.mark`, the one prior precedent for
  a slot both declared required and enforced. Note what the correction proves: **no gate saw
  either the understatement or the fix**, because `compareSurface` excludes slots from
  required-ness comparison, which is the same exclusion that lets both camps pass. **Count the
  required slots (`grep -rn '"form": "slot", "required": true' api/components/`) rather than
  trusting an ordinal here** — this entry's own "THIRD" went stale in one batch.

- **`ConfirmDialog.open` is the one modal of four that is neither required nor guarded.**
  `Dialog`, `Onboarding` and `CommandPalette` all declare `open` `required: true` and throw on
  absence; `ConfirmDialog.json` declares `default: false` and its implementation destructures
  `open = false` with no guard. 8C4 rewrote the `title` member on the adjacent line and left
  this alone. Defensible — `false` is a sensible default for a dialog and the other three have
  none — but nothing anywhere records it as a decision, and `Dialog.jsx`'s own guard comment
  names `CommandPalette` and `Onboarding` as its precedent while pointedly omitting its nearest
  sibling.

- **`SideNavCollapsible` is a stack of independent disclosures and is deliberately NOT a
  treeview. What that costs a screen-reader user is real.** With arbitrary nesting the rendered
  structure looks exactly like a tree, and APG's treeview would demand `aria-level` on every
  node, a roving tab stop and four-direction arrow navigation. None of it is designed, none of
  it is bound, and the refusal lives in `behaviour/patterns/disclosure.json`'s **own
  description** rather than only in the binding — so every future component binding this pattern
  inherits the refusal and a reader of any one binding meets it. The concrete cost: in a deeply
  nested sidebar a screen-reader user is told a group is expanded and is told nothing about how
  deep it sits, how many siblings it has, or which of them they are on — `aria-level`,
  `aria-setsize` and `aria-posinset` are all absent — and reaching an item four levels down
  means Tab through every trigger and every visible link above it, because there are no arrow
  keys. This is a **deliberate trade, not an oversight**: what shipped is what a nav landmark
  full of links actually is, and production sidebars ship it. But it is a trade with a loser,
  and the loser should not have to be rediscovered by whoever next reads the clean
  `"exceptions": []` on that binding and concludes the component is fully accessible. It is
  fully *compliant with the pattern it chose*. Choosing that pattern is the debt.

- **`SideNavItem` binds `none` with a prose reason, because the binding schema still cannot say
  "this pattern applies only when `href` is absent".** An item renders an `<a>` with `href` and a
  `<button>` without, so no single interactive pattern always applies. Binding `button` with an
  exception — what `Tag` does — would leave a reader of the binding alone believing the pattern
  always holds, so `none` plus prose was chosen as the less-false of two false options; the
  reason string carries what the schema cannot. This is the same unresolved question `Tag`,
  `Skeleton`, `Table` and `Pagination` already carry, and the spec's own open question — *"How
  does a pattern express an optional requirement?"* — is still open at both levels, the whole
  pattern and the single requirement. **Count the `none` bindings rather than writing an ordinal**
  — `grep -rho '"pattern": "none"' --include='*.json' frameworks/ | wc -l`, and the `-o` is the
  point: `grep -rl` counts FILES, and `frameworks/angular/behaviour-delegated.json` holds several
  `none` entries at once, so the file count is not the binding count and the measurement written
  here to replace a stale ordinal was itself wrong. 8C5 added two in one change, and this
  file has now had three separate prose ordinals about this limit go stale, one of them inside
  the batch that wrote it — `SideNavItem.behaviour.json` shipped saying "the fourth component to
  meet it" while its own batch-mate `SideNavSection.jsx` counted five, and the close-out review
  replaced both ordinals with a pointer here.

- **Plan D inherits an open question about `SideNav`, registered here so it is not inherited
  silently.** `frameworks/angular/behaviour-delegated.json`'s `SideNav` entry claims Material
  provides this control — its reason says `mat-nav-list` "already provides the anchor-or-button
  distinction, the active state and the keyboard behaviour". **That is defensible for a flat list
  of links and questionable now**: `mat-nav-list` provides no named section group and no nested
  disclosure group, which is most of what 8C5 added. The two resolutions are Plan D's to choose,
  not this batch's to pre-empt — an `arena-side-nav` primitive that stops delegating, or a
  narrowed delegated claim admitting Material covers the flat case only. `components-divergences.md`'s
  rewritten SideNav entry states the same thing; **keep the two consistent**, since nothing checks
  that they agree. Two adjacent facts a Plan D reader should have with this: the delegated file
  records no Material version for any of its claims (`@angular/material` 22.0.5 at the time), and
  `check:behaviour` never re-checks a claim about a third-party library — so these reasons can
  quietly become false while the whole suite stays green.

- **`check:dimensions`' `PROPS` widening left a residual gap, and the gate's header does not flag
  it.** 8C5 found that `padding-inline-start` was **ungoverned** while `padding-left` was governed,
  and walked straight through the hole with its own split of a `padding` shorthand into logical
  sides. The fix added the four logical padding sides and the logical margin family. **Logical
  BORDER and INSET sides are still ungoverned** — `borderInlineStart`, `borderBlockEnd`,
  `insetInlineStart`, `insetBlock` and the rest. There are zero uses today, so this is not a live
  violation; it is a live *hole*, and the next component to reach for a logical border width will
  find no gate there. Worth knowing that the gate's header documents its SVG kebab-case blind spot
  and says nothing about this one, so a reader who trusts the header will not learn it. Closing it
  means adding the two families to `PROPS`; nothing else needs to move.

- **`SideNavCollapsible.id` is required, and the alternative was never properly weighed.** The
  contract originally justified required-ness by citing `api/README.md`'s `id`-member rule, which
  says the *opposite*: that rule is about a component that **generates** an id and thereby takes
  away the consumer's only path to the element, and its remedy is an **optional** `id?: string`
  with the generated value as fallback — never a required member. The false citation was removed
  in review and the real reason put in its place: Arena derives `${id}-trigger` and `${id}-region`,
  the trigger's `aria-controls` and the region's `aria-labelledby` must both resolve, and neither
  wiring is conditional. **But the reviewer's point survives the correction and is recorded rather
  than lost.** Required-ness was measured against the wrong alternative — "a bare `useId()` with no
  member at all", which is indeed worse — instead of against "an **optional** member with a `useId`
  fallback", which gives everything a required id gives (both wirings resolve; a consumer who wants
  to address the elements can) **without forcing every consumer to invent a name for a group nothing
  else addresses**. That is the `Input`/`Textarea` shape, and it is what the rule the contract
  wrongly cited actually prescribes. `id` is also **not in the `toggle` payload**, so a consumer with
  several collapsibles wiring one handler cannot tell which fired without closing over the id they
  were forced to supply. **`id` stays required — that is the approved spec's decision and 8C5 did not
  reopen it.** The question is recorded, not the answer.

### Where the rest of the debt lives

Each of these is a record with its own stale-entry rule: an entry that no longer
matches a real violation fails the gate that owns it. Read the entries, never a
count written here, which would drift.

- **`components-divergences.md`** — the largest debt record in the
  repo. Every behaviour difference between the React and Angular layers, with its
  reason and whether it is expected to converge. Structural divergences first,
  then per-component. Its own opening admits the cost: no layer is the authority
  for component behaviour, so a divergence cannot be a defect. Plan 7's spec
  proposes replacing that with a normative contract.
  Plan 7c deferred the migration to a plan 7d rather than folding it in, on the
  spec's own instruction to sequence it last — the compliance suites change which
  exceptions are true, and migrating prose into entries that are about to move
  wastes the work. One finding for whoever writes 7d, derived from the file and
  not recalled: the structural/per-component seam is the
  `## Per-component divergences` heading, and everything below it is the migration
  subject. **Measure the file rather than trusting a figure written here** — an
  earlier revision of this entry recorded a line count and a seam line number, and
  plan 8B4 found both stale, having drifted every time a batch retired an entry.
  That is this section's own rule about counts, which this entry had broken.
  The spec's three-way split has a **fourth
  bucket it does not name**: of the per-component sections, only about a third
  are behaviour that migrates into `exceptions`; a few are API and
  belong to plan 8; and several are per-component *rendering* divergences —
  `chart-internals`' units,
  UnauthCard's hand-duplicated panel classes, SideNav being described three times —
  which are neither behaviour nor API and have no destination in the spec's scheme.
  They stay as prose alongside the structural half. A migration that deletes a cited
  section without redirecting the citation breaks it, so **measure the citing set
  rather than trusting a list written here** — a list of it was carried in this file
  and in `api/README.md`, and both were wrong in **both** directions:
  `frameworks/angular/primitives/onboarding/onboarding.ts` was named as a citer to
  protect and names no section at all, while
  `frameworks/angular/test/host-class-binding.test.ts` and
  `frameworks/tailwind/README.md` quote one each and were listed by neither. The
  command: `grep -rn "components-divergences" --include='*.json' --include='*.ts'
  --include='*.md' --include='*.jsx' . | grep -v node_modules`, then keep only the
  hits that quote a section **by name**. Those are the ones a deletion breaks; a
  citation naming the file alone survives any edit to it. 7c touched none of them.
- **`scripts/check-dimension-literals.mjs`** — `EXEMPT` (a literal that is the
  true value at its site: a runtime data-to-pixel projection, a stacking context
  scoped to one container, the visually-hidden idiom) and `PASSTHROUGH`. Its two
  known blind spots — a kebab-case SVG attribute, and Angular's `[style.x]`
  binding form — are **not** in the script's own header; they are documented in
  the `check:dimensions` paragraph under *Architecture* above, which is the only
  place they are written down.
- **`scripts/check-manifest-states.mjs`** — `EXEMPT` (a state delegated to a
  composed child, or a deliberate Angular-only accessibility addition) and
  `SOURCE_OVERRIDES` (the manifest-to-component mapping is not one-to-one).
- **`scripts/check-tailwind-coverage.mjs`** — `EXCLUDED`, every token that
  deliberately reaches no Tailwind utility, with the reason. The gate asserts the
  entry exists, never that the reason is true — so a reason can rot silently, and
  one did: `onboarding-width`'s was written anticipatorily and was false for two
  commits.
- **`scripts/check-duplicate-constants.mjs`** — `EXEMPT`, empty today, plus a
  header stating plainly what the gate does not catch.
- **`scripts/build-tokens.mjs`** — `load()` reads one source file per call, so a
  DTCG alias cannot resolve across files. Three chart tokens restate `--sp-2` and
  `--sp-4` because of it. The constraint is self-imposed and removable; the fix is
  written on `load()` itself.
