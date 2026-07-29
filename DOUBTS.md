# DOUBTS

**Everything Arena knows is wrong, incomplete, or unverified — recorded so the next reader
does not rediscover it.**

This is the one file in the repository with no character limit. Every other `.md` is capped
at 60,000 characters and written in the present tense, because a document that narrates its
own past makes a reader reconstruct the present. This file is the exception on both counts:
debt is only useful when it is explained, and an explanation that omits how the defect
arrived is one the next reader has to earn again.

## Why the debt lives here and nowhere else

Debt does not belong in a spec or a plan under `docs/superpowers/`. Those are deleted once
executed, and debt filed in one dies with it. That has already happened: a plan's close-out
recorded three follow-ups into its own plan document, which was scheduled for deletion the
same week.

It does not belong in `CLAUDE.md` either. That file states the rules a contributor works
under, and every rule there should be true, current, and short enough to read. Mixing a
1,500-line record of known defects into it is what pushed it past 200,000 characters.

## What this file does not absorb

**The reason-carrying maps in `scripts/` stay where they are.** `EXEMPT` in
`check-dimension-literals.mjs` and `check-manifest-states.mjs`, `EXCLUDED` in
`check-tailwind-coverage.mjs`, `COVERED` in `check-compliance.mjs`, `SOURCE_OVERRIDES`,
`QUANTIFIED`, `NOT_QUANTIFIED` and `IDREF_ATTRIBUTES` in `lib/behaviour-compliance.mjs` —
each holds its reasons as **string values, not comments**. They are code. Their paired
suites assert on them by name, and a stale entry fails its own gate, which is a guarantee no
prose here can offer. This file indexes them under *Where the rest of the debt lives*; it
does not copy them.

## The rule every entry is under

**An entry is a claim, and a claim about a file you have not read is how this record goes
quietly false.** Several entries below exist because a sentence describing another
component's state was written from a `grep` rather than from reading, and was wrong. When
you change a component, read every entry that names it. When you write an entry, cite it so
a reader can check it cheaply — a path with line numbers, or the command that re-derives it
— rather than a summary they would have to trust.

**Prefer no exemplar, a command, or an explicitly past-tense one.** All three are
stale-proof; a present-tense component name is not.

## How this file is organised

1. **Known debt** — things that are wrong or incomplete on purpose, one entry each.
2. **Where the rest of the debt lives** — the records that stay next to the code they
   burden, and what each one guarantees.
3. **Divergences between the framework layers** — where React and Angular genuinely differ,
   with the reason and whether convergence is expected.
4. **What the READMEs do not say** — the limitation sections lifted out of the normative
   documents so those can stay descriptive.
5. **Knowledge that used to live in code comments** — facts about the world outside a file
   that no identifier can encode, harvested when the comment sweep removed their comments.

---

## 1. Known debt

- **A green run is only as good as what the gate looked at, and a gate that finds nothing
  reports zero violations either way.** This is a rule rather than an anecdote, because it has
  now shipped three times in two batches of one refactor, each time in a different mechanism,
  and each time the surviving evidence was a plausible-looking green line of output.
  `check:tailwind` iterated zero manifests after the Tailwind layer went nested and printed
  `0 manifest(s) … all resolve` over a tree it never opened. `check:api`'s `angularPath()`
  built the pre-move `frameworks/angular/primitives/<kebab>/<kebab>.ts`, wrapped the lookup in
  `existsSync` and returned `null`; `main()`'s `if (!path) continue` then skipped the Angular
  half of `compareSurface` for **every** contract, and the gate reported
  `50 contract(s) hold across 50 layer implementation(s)` — the React count alone — while
  twenty contracted components with a real Angular implementation went unread. It reports 70
  now. And this file's own `bun test` verification command named a directory that still exists
  and holds three suites, so a reader copy-pasting it ran 3 files and saw green over 33.
  **The shape is always the same: a lookup that cannot distinguish "absent" from "not found",
  or a path that narrows a run without narrowing what the run claims.** Two remedies, and the
  first is the one that generalises. **Decide absence by walking the tree**, so "this layer does
  not implement it" and "this gate cannot find it" stop being the same value — that is what
  `check:api` does now, and two guards with tests stand behind it: a component directory whose
  source file the gate cannot open is a per-component problem, and zero directories at all is a
  whole-layer one. **And make a zero-result count an explicit failure** rather than a vacuous
  pass — `check:tailwind`, `check:radius` and `check:structure` each carry one, as exported
  pure functions with suites. When you write or move anything a gate resolves by path, the
  question to ask is not "does it still pass" but "how many things did it look at, and is that
  number the one I expect".
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
  doughnut's `rOuter` inset (`DoughnutChart.jsx`, `DoughnutChart.ts`), commented
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
- **A group-level `$description` in `contracts/design/` never reaches the generated JS
  modules.** `collectScriptTokens()` in `scripts/build-tokens.mjs` skips group
  nodes (`if (item.group || !isScript(item.token)) continue;`), so only a
  leaf token's own description is carried into
  `frameworks/react/Tokens.generated.js` and
  `frameworks/angular/Tokens.generated.ts`. Group prose survives only in the
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
  inside it), which is why it is recorded rather than done — and the exception reads as
  unconditional and is not. A binding **can** scope a requirement now, since 8C9 built
  `cases`, and `Table` HAS been converted since — `wide` → `grid`, `card` → `none`, both
  rendered by `Table.cases.dom.test.jsx`. Two things had blocked it: card mode's
  interactivity looked like the consumer's choice rather than a prop, and the grid hand-test
  rule meant any case it declared could carry no suite. The rule is retired, and the
  interactivity question turned out to belong to `TableRow` rather than to `Table`. The reasons are in the conditionality entry
  below, and `Table.behaviour.json`'s own reason string now carries them too. **That reason
  string cited a component twice and was wrong twice, and it now cites no exemplar.** It first named
  `Skeleton` as proving a limit — that the schema could not scope a requirement to a variant —
  which went stale when 8C9 built `cases`; 8C9's close-out rewrote it in place to name
  `Skeleton` as demonstrating the *remedy*, which went stale in 8C10 when `Skeleton`'s defect
  was fixed and its binding went flat again. Twice in two batches, in opposite directions, is a
  structural signal rather than bad luck, and it generalises — the standing hazard, the
  distinction from a harmless structural reference, and the change-time command that finds the
  rest are the entry directly below this one. 8C10 removed the exemplar rather than replacing it
  with a third, and left the capability stated on its own with a pointer to the command that
  lists the cased bindings. **What stays true of both is the
  verification, and it is no longer true**: `Calendar` and `Table` were both unverified
  because the grid rule kept them out of `COVERED`. The rule is retired, both have render
  suites, and both claims are backed. See the grid-rule entry below for the measurement that
  retired it and for what the method costs.
- **A component name written into ANOTHER file's prose is a cross-file claim no gate checks,
  and it rots silently while every gate stays green.** This is a standing hazard rather than a
  list of defects, and it was diagnosed the hard way: `Table.behaviour.json`'s `focus.roving`
  reason cited `Skeleton` twice in two consecutive batches and was wrong both times, in
  **opposite** directions — first as proving that the schema could not scope a requirement to a
  variant (falsified when 8C9 built `cases`), then, after 8C9 rewrote the clause in place, as
  demonstrating that remedy (falsified when 8C10 fixed `Skeleton` and flattened its binding).
  Nothing failed either time. `check:behaviour` validates that a binding names a real pattern
  and real requirements; and while `validateBinding` (`scripts/lib/behaviour-contracts.mjs`) does
  read a `reason` for **presence** — `:156` requires one on a `none`/`absent` case, `:163` on every
  exception — **nothing anywhere reads its CONTENT, and no gate has an opinion about a comment at
  all**. So a citation asserting another component's current state is unfalsifiable
  infrastructure-wise and reliably becomes false. The distinction matters when someone proposes a
  gate for this: the hook to hang one on already exists, and what is missing is any notion of what
  a reason *says*.

  **The distinction that matters, because a blanket ban would be wrong.** A *structural*
  reference is fine and should not be hunted: `TableCell` saying a cell may contain a `Button`,
  `CalendarEvent` naming the `IconButton` it renders as a kebab, `SideNavSection` naming
  `SideNavItem` — each describes **this** component's own render, and it moves only when this
  component moves. What rots is a citation asserting **another component's current state** — that
  it is cased, that it carries an exception, that it hardcodes a label, that it "records the
  opposite". Those are claims about a file the author is not editing and no gate is reading.

  **The command, and it is a change-time procedure rather than a periodic audit**, because an
  unchecked cross-file claim cannot be swept for meaningfully — you only know a citation is false
  once you have changed its subject. So when you change component `X` — its binding, its source,
  its behaviour, anything a sentence elsewhere might have described — run:

  ```bash
  X=Skeleton   # the component you just changed
  grep -rn --binary-files=without-match "\b$X\b" \
      --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
      CLAUDE.md DOUBTS.md contracts/api/ contracts/behaviour/ docs/ frameworks/ scripts/
  ```

  and read every hit as a claim about `X` that you may have just falsified. Two kinds are then
  dropped by hand rather than by the query: hits under `X`'s **own** files — its quartet, its
  binding, its contract, its manifest, its own suites — which describe the component instead of
  claiming something about it, and hits in `CHANGELOG.md`, which is a frozen record of what
  shipped at a tag and must never be back-edited. Expect a large raw result for a component with
  a long paper trail — for `Skeleton` at the close of 8C10 it was 207 lines across 39 files, of
  which the batch's own plan and design spec were 64 and this file's prose another 38 — and read
  that as the honest shape of the work rather than a sign the query is too wide. Skim by file,
  not by line: the interesting hits are the files that are not about `X`.

  **This command is deliberately wider than the one 8C10 first published, and the widening is the
  correction rather than a tidy-up.** That version was `grep -rln '\bX\b'
  --include='*.behaviour.json' frameworks/` plus `grep -rn '\bX\b' scripts/lib/
  frameworks/*/test*/`. It reaches bindings, the shared contract library and the test
  directories, and **nothing else**: not `behaviour/`, not `scripts/*.test.mjs` (only
  `scripts/lib/`), not `api/`, not `docs/`, and not a component's own `.jsx` source. A final
  review found surviving instances in three of those five — `behaviour/README.md` carried a
  present-tense twin of the very sentence 8C10 had past-tensed in
  `scripts/lib/behaviour-contracts.mjs`, `scripts/behaviour-contracts.test.mjs` justified a test
  by a case that no longer exists, and `SideNavSection.jsx`'s header named **four** components —
  `Tag`, `Skeleton`, `Table`, `Pagination` — as carrying one limit, two of which had left it,
  **and** called that limit unfixable a batch after `cases` fixed it. So read **"8C10 corrected
  six sites" as a sweep of the command's reach, never of the class**: the count was complete
  against a query that could not see most of the tree, which is
  the same mistake as describing a file you grepped rather than read, one level up. The six, for
  the record, were `Table`'s and `Tab`'s reason strings (both exemplars **removed** rather than
  re-pointed at another name, because a replacement name is just the next thing to rot),
  `Toast`'s `divergesFromReason` (rewritten as explicit **history**, the one form that cannot go
  stale), two doc comments in `scripts/lib/behaviour-contracts.mjs` — one past-tensed so
  `bindingCases()` keeps its origin story without asserting a tree that has moved, one re-pointed
  at the only live example that qualifies — and a sentence in the layer divergences (section 3
  of this file, then a separate `components-divergences.md`) describing what an Angular test
  file asserts. Fix commits `358cad9`, `23d9beb`, `ac197c7` and
  `357ccc4`; that last site took **three** passes, since `23d9beb` wrote it false, `ac197c7`'s
  correction of it was itself false, and `357ccc4` fixed it.

  **The widened command carries no `| grep -v node_modules` on the end, and it must not gain
  one** — which is the same lesson one turn later, since the pipe was carried over from the
  narrow query above without noticing that the query around it had changed. The path list never
  descends into `node_modules`, so such a pipe can only subtract; and because `-rn` emits
  `path:line:CONTENT` where `-rln` emits paths alone, it filters by **content**, silently dropping
  any hit whose *text* mentions the directory. That is exactly why `| grep -v '/X\.'` was safe on
  the old `-l` query and stopped being safe the moment the command started printing lines. It
  shipped for one commit and dropped two real hits, one of them `Toast.behaviour.json:3` — a
  genuine cross-file `Skeleton` citation, and **one of the six sites listed just above as
  corrected**, hidden because its `divergesFromReason` cites `node_modules/@angular/material/…`
  as its evidence. The entry's own remedy was concealing the entry's own worked example, which
  reads as coverage and is therefore worse than no filter at all. Add no content filter to the
  command above; the path list is the only scoping it needs.

  **An unexecuted spec is inside the reach and is a real member of the class.** A spec is deleted
  only once executed, and until then it is what drives a batch, so a claim it makes about a
  component's current state misdirects that batch rather than merely aging.
  **The worked example of this class is now closed, and how it closed is the useful part.** The
  `progressbar` spec was the live instance: it claimed in the present tense that `Skeleton`'s
  "two are true of the `circle` variant and false of the other three" and that "its two React
  exceptions belong to the variant-scoped family above" — both falsified by 8C10, which left
  `Skeleton.behaviour.json` flat with no exceptions at all. This entry recorded it **rather than
  correcting it**, on the grounds that the fix was not a citation swap: that spec's §2 reasoned
  from three open faces of the conditionality question, one of which `cases` had since closed, so
  re-deriving the argument belonged to whoever planned the batch. That is exactly how it was
  discharged — §2 was rewritten around `cases` before a plan was written, the two `Skeleton`
  sentences went with it, and the spec was deleted when the batch shipped. **The lesson that
  survives is the deferral, not the defect:** a stale claim in an unexecuted spec is correctly
  left to the batch that will reason from it, because correcting the sentence without re-deriving
  the argument produces a spec that reads current and reasons from a premise nobody re-checked.

  **A second live instance, and it is a whole file rather than two sentences.**
  `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` is unexecuted — Plan D has not
  shipped — and it names the Angular layer's **pre-move** paths throughout: list them with
  `grep -n "angular/primitives\|angular/test/\|behaviour-delegated\|api\.generated"
  docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`. The two shapes are mixed and only
  one of them is a defect. Its `>` quoted blocks are records of what a shipped plan settled, and
  a path in one is correct **as history** — rewriting those would make the record lie. Its
  unquoted normative text is the problem. **Exactly one line of it has been corrected, and the
  rest is still open.** `:291` used to tell a reader `check:api` resolves an Angular
  implementation at `frameworks/angular/primitives/<kebab-name>/<kebab-name>.ts` — which is
  where the gate looked when it silently checked nothing (the false-green entry at the head of
  this section is the same defect from the gate's side), so a reader could have rebuilt the
  defect straight from the spec. That line now names the walk and says why the probe is refused.
  Everything else in that file stays as it was: separating the historical uses from the normative
  ones is a reading of that spec's argument, not a find-and-replace, and it belongs to whoever
  plans Plan D. Read this paragraph before reading that spec.
  **The structure refactor's batch 3 made it worse without touching it: React's pre-move paths
  joined the list.** That spec names `frameworks/react/test-dom/`,
  `frameworks/react/use-dialog-modal.js`, `frameworks/react/api.generated.d.ts` and
  kebab-named suites under `frameworks/react/test/` such as
  `frameworks/react/test/stat-card.test.jsx` — none of those files exists now, and
  `frameworks/react/test/` itself survives meaning something different (the harness plus the
  suites belonging to no one component, DOM ones included) from the DOM-free directory the
  spec describes. Widen the grep above to
  `"angular/primitives\|angular/test/\|behaviour-delegated\|api\.generated\|react/test-dom\|react/test/\|use-dialog-modal"`.
  It is recorded rather than rewritten for exactly the reason the paragraph above gives, and the
  historical/normative split is the same one: many of those React paths sit in measurement
  records of what a past batch's test counts were, where the old path is correct as history.

  **The last of those six sites — the layer-divergences sentence, now in section 3 — is the entry's own
  thesis demonstrating itself, and it is worth more than the rule it illustrates.** (Named rather
  than referred to as "that last one", which is what it said until two paragraphs got inserted
  between it and its subject; a positional back-reference rots the same way a component name
  does.) It was the SEVENTH instance and the FIRST introduced by the fix for the
  class: the sentence was written to correct a different false claim, in the very commit that
  records this hazard, and it was itself false — it said a suite "says nothing about `role`,
  `aria-label` or the `status` pattern" when that file has a third `Skeleton` test asserting both
  attributes. The cause was mundane and is the whole lesson: the author `grep`ed, found two of the
  three tests, and described a file they had not read to the end. **No gate caught it, in either
  direction** — not the one that was wrong, and not the one that fixed it. A reviewer read the test
  file. Treat "I grepped it" as insufficient evidence for a claim about another file's contents;
  the only sufficient evidence is having read that file.

  **That rule was then broken by the commit that wrote it, which is the strongest evidence for it
  there is.** `ac197c7`'s replacement sentence — the one carrying the rule — claimed the Angular
  harness could not reach `Skeleton`'s other three variants, when the suite then called
  `skeleton-dimensions.test.ts` — `Skeleton.dimensions.test.ts` since the structure refactor's
  batch 2 — had been driving all four by the documented instance-field bypass the whole time. Same cause one step
  out: its author read the one test file they had been pointed at and generalised to the directory.
  So writing the rule down demonstrably does not stop it — the reading has to happen at the moment
  the sentence is written, and "read that file" means the whole directory when the claim is about
  what a test suite does or does not cover.

  **Prefer no exemplar, a command, or an explicitly-past-tense one.** All three are stale-proof;
  a present-tense component name is not. And when a claim about another file is unavoidable, cite
  it so a reader can check it cheaply — a path with line numbers, or the command that re-derives
  it — rather than a summary they would have to trust.

  **One of those members has since become the instance it was predicted to be.**
  `Input.behaviour.json` cited the gap `Tag.behaviour.json` recorded for its remove button's
  missing disabled concept. Both exceptions are now retired — `Tag` has a `disabled` input in
  both layers and `Input`'s `readonly` exception turned out to have been stale for some time —
  so the citing text and the cited text went false together, in the batch that was supposed to
  touch only one of them. That is the whole hazard: the cross-reference was the reason the
  second file needed editing, and nothing but this entry said so.

  **The second member went the same way one batch later, and it was predicted here in those
  words.** `RadioGroup`/`Radio` cited `Breadcrumbs` and `Pagination` as at least hardcoding a
  label; all four now require a caller-supplied name and none of them hardcodes anything, so
  the citation and its two subjects went false together again. **Nothing is left standing in
  this entry**, which is not a reason to delete it: the pattern it records — a binding's prose
  reaching across to another component to say what it does BETTER — recurred twice in
  consecutive batches, and the cross-file command above is the only thing that finds it. A scan for the class as a whole over-reports badly — a naive
  name grep flags "normal **Tab** order" and HTML "**tag**" — so the change-time procedure is the
  usable form and a repo-wide list is not.
- **The conditionality gap is closed at ONE of its three levels, and the other two are
  the ones a reader now has to be told about.** This entry used to record the schema as
  unable to express "this pattern applies conditionally", with `Tag` as its proof — a real
  `<button>` only when the tag is removable, bound to `button` with an exception as a
  stopgap, so a reader of the binding alone would think the pattern always applied. Batch
  8C9 built `cases` for exactly that (see *Architecture*), and `Tag` now declares
  `plain` → `none` and `removable` → `button` **in both layers**, with its surviving
  `states.disabled` exception scoped to the case it is true of. `Alert` (both layers),
  `Toast` and `CalendarEvent` were converted the same way — count the converted
  set with the command in *Architecture* rather than trusting this list, which has already
  drifted **downwards** as well as up. `Skeleton` was converted in 8C9 and **un**-converted in
  8C10: its two cases existed to scope a defect, 8C10 fixed the defect, all four variants meet
  `status`, and the binding went back to flat because a case had nothing left to scope. That is
  the shape to expect — a conversion is not a one-way ratchet, and a binding leaving the cased
  set can mean the component got better rather than that the record got worse.
  **What cases solve is conditionality on the
  component's OWN props, and only that.** Three things stay open:

  **Conditional on CONSUMER usage is still unexpressible**, and it is a different level
  rather than the same one unfinished: a case describes a render the component's own API
  can produce, while these are produced by how a consumer assembles two components or by
  what they pass in. The live instances are `Table`'s `focus.roving` (true of card mode,
  and there only when a consumer put an `onClick` on a `TableRow`), `Tooltip`'s
  `roles.describedby` (holds only when the consumer's child accepts and forwards props —
  its own entry below). **`Pagination`'s `roles.label` used to be the third, and how it left
  this list is the useful part**: it was conditional on whether the caller supplied
  `ariaLabel`, and making the member **required and guarded** removed the conditionality
  rather than expressing it. A condition that can be designed away should not be modelled,
  and this is the worked example. **`Tooltip` is the one to state most
  carefully: its binding reads `"exceptions": []`, so it is the live instance whose
  binding looks completely clean.** And `comparePattern`'s stale-exception message still
  has no vocabulary for "true for some inputs" — it offers only "delete it or name a
  subject", which was the old complaint about variants and is now the complaint about
  these.

  **Nothing proves the declared cases are ALL the cases, and — the half first recorded too
  narrowly — nothing proves a declared case's suite rendered ALL the renders its own `when`
  admits.** A component with five meaningful renders may declare two and every gate stays
  green; and `assertPatternCases` enforces one **thunk per case name**, never one render per
  configuration the prose names, so a case whose `when` covers several shapes is proved by
  whichever one its suite happened to mount. The live instance is
  `CalendarEvent`'s `inert`, which declares `when: "onClick is absent, regardless of
  actionsEnabled"` while its suite renders the no-actions shape alone — never the
  `actionsEnabled` one, whose root keeps a `tabIndex` and an `onKeyDown`. It does not change a
  verdict today, which is why it is recorded rather than fixed. **This entry named a second
  instance until 8C10 and the limit did not narrow when it went**: `Skeleton`'s `placeholder`
  declared `when: "variant is block, line or text"` and its suite rendered `block` alone, and
  that stopped being an instance because the whole case stopped existing — the binding went
  flat — not because anything addressed the limit. Nothing still checks that a case's suite
  renders every render its `when` admits. This is the same limit
  the curated `QUANTIFIED` set carries, and it has the same non-remedy: deriving cases
  from source was not attempted, because a scan for prop branches finds fewer renders than
  a reader does and would rebuild the false-negative class the evaluator's own header
  already rejected once.

  **A case bound to `none` verifies nothing**, because `none` has no requirements. For
  `Tag`'s `plain` and `CalendarEvent`'s `inert` that verdict is correct — a label and a
  chip with no `onClick` have no interactive contract — but the suite can then only
  confirm the case was rendered, never that it is correctly inert. Nothing checks that a
  plain `Tag` really renders a `<span>` with no role and nothing pressable in it.
  (`Skeleton`'s `circle` was the third example here and is gone: 8C10 gave the circle the
  same `role="status"` its siblings carry, so it is neither a case nor bound to `none` any
  more. Its departure removed an example, not the limit.)

  **`Table` was deliberately NOT converted, and the reason is the first of those three.**
  Its card mode is a variant, so it looks convertible; but whether a card is interactive
  depends on the consumer, and declaring `card` → `none` would assert an inertness a
  clickable card row contradicts — which turned out to be the wrong reading: the clickable
  card row is `TableRow`'s `card-interactive` case, not a clause of `Table`'s, and once that
  was seen `card` → `none` became exactly true. The grid hand-test rule, which had also kept
  any case it declared unverifiable, is retired. Both are converted now.
  **`TableRow` was the second deliberate non-conversion, and it was convertible
  where `Table` is not**: `onClick` is `TableRow`'s own member, so an interactive case and
  an inert one name renders this component's own props produce — exactly what a case is
  for. What stops it is the second half of `Table`'s argument alone: `TableRow` is in no
  suite, so a case declaration would be an unverified claim standing in for an accurate
  exception. Its `roles.element` reason says so in place, and converting it means writing
  the suite first. `SideNavItem` is the third; see its own entry below. `Tab` is **not** one
  of these — its condition is being composed inside `Tabs` rather than any prop of its own,
  which is the parent-composition level `cases` do not reach.
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
  than the focusable trigger — fixed since, and like the `Skeleton` exhibit beside
  it that changes the example rather than the measurement), *branch* (`Skeleton`'s
  `role="status"` in three of
  four variants **as the tree then stood** — 8C10 made it four of four, which
  changes the exhibit and not the measurement: the 18-of-94 figure is a fact about
  the tree the scan was run against, and re-running it today would produce a
  different number and the same verdict), *conditional value* (`Alert.ts`'s
  `'[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"`, and `Toast.jsx`'s
  same shape), or *semantic completeness* (`Menu`'s Enter opens the menu but never
  moves focus). A rendered DOM resolves all three at once, which is why the render
  suites absorbed the stale-exception check instead of sharing it with a scan.
  **This is still the reason not to re-propose a scan.** It once looked attractive as a
  cheap tier beneath the grid hand-test rule; that rule is retired and the grids have real
  suites, so even that opening is gone: a scan's measured error rate
  is what it is regardless of what sits above or below it, and a 51% false-unmet rate
  is worse than an honest hole.
- **Converting ONE layer to cases surfaces every place the two layers were quietly
  different. It fired twice; one of the two is now fixed and the other is deferred to Plan
  D.** The mechanism is the durable part and is not a fact about either component: a flat
  binding on the far side can no longer silently agree with a cased one, so the cross-layer
  check starts reporting differences nobody was looking for. Expect more as bindings are
  converted. It fired on `Toast` and on `Skeleton`, in the batch that built cases.

  **`Skeleton` is CLOSED and its entry is retired.** It recorded that Angular announced every
  variant while React's `circle` branch rendered `aria-hidden="true"` with no role, so a
  screen-reader user meeting a circular skeleton heard "Loading" in Angular and **nothing** in
  React. It was written up as *"both are defensible"* and left undecided; that framing was
  wrong. A skeleton exists to announce that it will be replaced when asynchronous data
  arrives, so a variant announcing nothing is not doing the job — the answer follows from the
  definition and needed no judgement about noise. React's own code agreed three times in four,
  which is the evidence the branch was an oddity rather than a strategy. 8C10 fixed React,
  touched no Angular file, and the React binding went back to flat `status` with no cases and
  no `divergesFrom`. Kept here rather than deleted because **the lesson is that an undecided
  divergence can be a mis-triage**: two defensible-looking positions were two readings of a
  component whose purpose settles it, and the cheapest test is whether the same layer already
  contradicts itself elsewhere. The retired entry is in section 3.

  **`Toast` is OPEN and is deferred to Plan D.** It was first recorded as structural and
  harmless — "nobody is worse off" — and that was written without reading what `MatSnackBar`
  renders. It is the same shape `Skeleton` was, not a lesser one: in `@angular/material`
  22.0.5, `MatSnackBarConfig.politeness` defaults to `'polite'`, and `_role` is assigned
  **only** inside `if (this._platform.FIREFOX)`, so outside Firefox the snackbar's live region
  carries `aria-live="polite"` and **no role at all**. React's danger toast renders
  `role="alert"` with `aria-live="assertive"`. So a screen-reader user meeting a critical error
  toast has it **queued** in Angular and **interrupting** in React — a real cost to a real
  person, in the safety-relevant case. It is not the `Skeleton` case, because Angular is not
  wrong about a control it does not own: Material has no tone axis to be wrong about. Plan D
  removes Material, and an `arena-toast` on the CDK would be born with the right role per tone.
  **Nothing is fixed for Angular users until then**, and a deferral moves the work rather than
  reducing what anyone pays meanwhile. Its entry in section 3 carries the two
  interim resolutions that exist and were not taken.

  `divergesFrom` was **first exercised by these two** — `grep -rl divergesFrom frameworks/`
  found nothing before them, so neither branch of that escape hatch had ever met a real
  binding. Run that command for the live set rather than trusting a figure here; with
  `Skeleton` closed, `Toast` is the only user left.
- **No gate typechecks `frameworks/angular/test/` — RETIRED as an entry, closed by batch 8C11.**
  This recorded that `check:angular` compiled only `frameworks/angular/tsconfig.check.json`'s
  `["./index.ts"]` — the layer barrel — and never opened the test directory, and that `bun
  test` strips types rather than checking them, so a green suite had never been evidence about
  types. It was not theoretical: during 8C9 a review compiled `frameworks/angular/test/Compliance.ts`
  by hand and found **two TS2322 errors** in a directory reporting 340 passing tests, after a green
  `check:angular` had already been read, in that same batch, as evidence the file typechecked. The
  mitigation this entry proposed was "a second tsconfig covering the test directory, wired into
  `check:angular`." What shipped is not that: `scripts/build-angular-tests.mjs`
  (`bun run build:angular-tests`) compiles the barrel and every `.ts` under `components/` and
  `test/` together with
  `ngc --strictTemplates` into git-ignored `build/angular-test/`, and `test:angular`, `test` and
  `testStep()` all run the suites from that emit rather than from the `.ts` sources — so the
  typecheck is a consequence of the build the tests already needed rather than a second gate beside
  it, and a type error anywhere in the test surface now fails the build outright, with no test in
  that run executing at all (see the *Architecture* paragraph above for the mechanism).
  **What survives, because it was true before this and stays true after: a green compile is a claim
  about TYPES, and never about behaviour.** The sharpest instance of that gap is in this very file
  and this batch did not remove it — the `niceMax` induction in the suite now called
  `frameworks/angular/DataVisuals.test.ts` (it was `ChartInternals.test.ts` when this was
  written, and batch 3 renamed it), where
  `-Number.INFINITY` (not a real property; it evaluates to `NaN`, the entry already adjacent to it
  in the array) sat in a list the test claimed held six inputs and supplied five, and no runtime
  assertion could report it, because both the intended `-Infinity` and the typo return `1`. It was
  caught only because its vacuity happened to also be a type error, the moment a compiler was
  finally pointed at the file.
- **Seven Angular suites still justify themselves by a JIT limitation
  that batch 8C11's move to AOT retired, and no batch since has touched the JIT clause.**
  (Batch 2 of the structure refactor edited the headers of **five** of the seven, and not
  only paths: two of the five — `BarChart.geometry.test.ts` and
  `CommandPalette.keyboard.test.ts` — had no path in their comments at all, and what changed
  was a sibling named in prose, `confirm-dialog.ts` → `ConfirmDialog.ts`. The two chart
  suites it did *not* edit, `LineChart.geometry.test.ts` and `DoughnutChart.geometry.test.ts`,
  had their imports rewritten and their comments left alone. Re-derive it rather than trusting
  this — compare each file's content across the batch, since a `git log` on the paths counts
  the pure-rename commit and tells you nothing:
  `git show effbc00:frameworks/angular/test/<old-name>.ts` against
  `git show 90133e1:frameworks/angular/<new-path>`. What survives all of that is the load-bearing
  half: no changed line in any of the five mentions `JIT`, `ngtsc`, `NG0303` or `setInput`, so
  not one word of the limitation itself moved.)
  Find the live set with `grep -rlE "JIT|ngtsc" --include='*.ts' frameworks/angular/` and drop
  the two
  hits that are already correct, past-tense history (`test/HarnessCapabilities.test.ts`,
  `test/HostClassBinding.test.ts`) — what is left, re-derived after the structure refactor's
  batch 2 moved every one of them beside its component, is
  `components/charts/bar-chart/BarChart.geometry.test.ts`,
  `components/charts/line-chart/LineChart.geometry.test.ts`,
  `components/charts/doughnut-chart/DoughnutChart.geometry.test.ts`,
  `components/navigation/command-palette/CommandPalette.focusTrap.test.ts`,
  `components/navigation/command-palette/CommandPalette.keyboard.test.ts`,
  `components/feedback/confirm-dialog/ConfirmDialog.focusTrap.test.ts` and
  `components/feedback/onboarding/Onboarding.focusTrap.test.ts`. Each still says, in
  the present tense, that a signal input cannot be driven through a template binding or
  `setInput()` under this harness — false now, per the *Architecture* paragraph above and the
  suite that backs it. **The command reads the whole layer, and that widening is a correction
  rather than tidying**: it was `frameworks/angular/test/*.ts`, which was the right scope while
  every suite lived in that one directory and became the wrong one the moment they moved — run
  today it returns the two past-tense files and **none** of the seven, so it would have read as
  "this debt is paid" while all seven were untouched. That is the same false-green shape the
  rule at the end of this section records. **The reach is still only `.ts` files under the
  Angular layer, and the same false claim was not confined to them.**
  The layer divergences in section 3
  restated this exact limitation for `ConfirmDialog`, `CommandPalette` and `Skeleton`, in prose
  this grep cannot see. Those three were found and corrected by reading the file, not by
  widening this grep, and are not a fourth thing still to find here — a future stale restatement
  of this limitation anywhere outside this layer needs the cross-file command in the
  *"a component name written into ANOTHER file's prose"* entry above, not this one.
  **This is not a typo sweep, on purpose.** Several of these files justify
  testing plain exported functions (chart geometry, focus-trap helpers) *by* the limitation
  they cite — extracting the logic and testing it directly, rather than driving the real
  component. Correcting only the false clause and leaving the extraction in place is defensible
  on its own terms — a pure function is often the right thing to test directly regardless of what
  the harness can drive — but it is a design choice now, not a forced one, and six of the seven
  have not been revisited against the question of whether they should instead render a real tree
  the way `HarnessCapabilities.test.ts` and the migrated `HostClassBinding.test.ts` fixtures now
  do. The seventh, `ConfirmDialog.focusTrap.test.ts`, was answered **by addition rather than by
  rewrite**: `ConfirmDialog.compliance.test.ts` now renders the real component beside it, so the
  helper suite keeps testing helpers and no longer stands in for a render. Its own prose still
  carries the false clause, so it remains on this list; what changed is that the strategy question
  behind it has an answer for one component. Rewriting seven suites' test
  strategy was judged out of scope for 8C11, a close-out batch whose subject was the harness, and
  out of scope again for the structure refactor, which moved files and renamed them and changed
  no test's strategy; recorded here rather than fixed so the false
  prose has a pointer and the reopened question is not lost with it.
- **Comments in EVERY migrated layer still cite siblings by their pre-move
  filenames, and nothing resolves them.** Batches 2 and 3 of the structure refactor each
  renamed a layer's files and moved most of its suites (batch 1's layer, Tailwind, has no
  suites to move, which is why this class starts at batch 2); each rewrote every
  **import specifier**, which
  a compiler or a test runner checks — but a bare filename in a sentence is not one. So
  `host-class-binding.test.ts`, `testbed-env.ts`,
  `tag-variants.test.ts`, `skeleton-dimensions.test.ts`, `bar-chart-geometry.test.ts` and
  their siblings are still named across the Angular layer's own headers and inline comments,
  and a reader who greps one finds nothing. **This entry was Angular-only until batch 3, and
  that batch created the React half of the same class** — every React suite was renamed from
  `<kebab>.test.jsx` to `<Component>[.<facet>][.dom].test.jsx`, so every header naming a
  sibling by its old name went stale in one commit. Two commands, one per layer, because the
  two spell a stale name differently:

  ```bash
  # Angular: a kebab stem before .ts
  grep -rnE "[a-z][a-z0-9]*(-[a-z0-9]+)+\.(test\.)?ts" --include='*.ts' frameworks/angular/
  # React: a lowercase-initial stem before .jsx / .test.jsx / .card.html, cited ANYWHERE
  grep -rnP "(?<![A-Za-z0-9.])[a-z][a-z0-9]*(-[a-z0-9]+)*\.(test\.jsx|jsx|card\.html)\b" \
      --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
      --include='*.html' \
      CLAUDE.md README.md SKILL.md DOUBTS.md contracts/api/ contracts/behaviour/ docs/ frameworks/ \
      scripts/ contracts/design/
  ```

  **Two things about the React one are load-bearing.** Its path list is the whole repo, not
  `frameworks/react/` — **the class is "a comment cites a moved file by its old name", and the
  citing file can live in any layer**, which a React-scoped search cannot see by construction;
  the live proof is that a React-scoped sweep reported this half clean while
  `frameworks/angular/components/display/tag/Tag.cases.test.ts` and two paragraphs of this very
  file were still citing pre-move React names. And the negative lookbehind
  `(?<![A-Za-z0-9.])` is what makes the result readable: without it every lowercase *secondary*
  segment matches its own filename — `Tooltip.timer.dom.test.jsx` hits on `timer.dom.test.jsx`
  — and the output goes from about 50 lines to about 230, nearly all of them noise.
  **Neither command carries a `| grep -v` and neither should**: `CHANGELOG.md` is excluded by
  not being in the path list, which is the only safe way, since a content filter on `-n` output
  drops hits by their *text* — the trap recorded in the cross-file entry above.

  Read each hit — both over-report, because a lowercase stem before an extension is also how
  these files legitimately name a *component directory*, a still-correct history clause, a
  synthetic test fixture (`scanFile('a.jsx', …)`, `covered: { 'Dialog:react': 'dialog-modal.test.jsx' }`),
  or a genuinely deleted file (`grid-keyboard.test.jsx` is the standing example, and it must stay).
  Count by reading, not by piping to `wc -l`. **It is a citation swap and
  nothing more** — unlike the seven-suite entry above, which needs a design decision — so it
  is the cheapest entry in this section to close and the easiest to close wrongly: a name is
  only worth rewriting once you have opened the file it now names and confirmed the sentence
  around it is still true.

  **The React half is CLOSED, against the widened command above and nothing narrower** — which
  is worth saying that precisely, because it was declared closed once already against a
  React-scoped search that could not reach three live instances. Batch 3's close-out repointed
  **fifteen** files: `test/UseDialogModal.dom.test.jsx`, `test/PlacementAndBranches.dom.test.jsx`,
  `components/feedback/DialogModal.dom.test.jsx` (×4), `components/feedback/Behavioural.dom.test.jsx`
  (×4), `components/feedback/onboarding/Onboarding.dom.test.jsx` (×4),
  `components/feedback/tooltip/Tooltip.keyboard.dom.test.jsx` (×4),
  `components/feedback/tooltip/Tooltip.test.jsx`, `components/navigation/menu/Menu.dom.test.jsx`,
  `components/display/table/Table.test.jsx` (×2), `components/display/calendar/Calendar.test.jsx`,
  `components/display/TagAndChipCases.dom.test.jsx`,
  `components/navigation/side-nav/SideNavInject.jsx`, `components/forms/switch/Switch.test.jsx`,
  `components/navigation/tabs/Tabs.prompt.md`
  and `components/navigation/side-nav-collapsible/SideNavCollapsible.prompt.md` — **plus four
  outside the React layer that only the widened command reaches**:
  `frameworks/angular/components/display/tag/Tag.cases.test.ts`,
  `frameworks/angular/components/display/stat-card/StatCard.variants.test.ts`,
  `scripts/check-card-viewports.mjs` (four card pages) and `scripts/check-card-viewports.test.mjs`,
  and two paragraphs of this file citing `tabs.test.jsx`. Each target
  was opened first and the surrounding claim confirmed still true. Re-run the command rather
  than trusting that list; everything it returns today is history, a synthetic fixture, or a
  hit under `docs/superpowers/`, where the executed plan and the two unexecuted specs are
  already recorded as carrying pre-move paths.
  **On the Angular side four are CLOSED and the rest are not.** Batch 3 fixed the
  `chart-internals.test.ts` citations in
  `components/charts/bar-chart/BarChart.geometry.test.ts`,
  `components/charts/line-chart/LineChart.geometry.test.ts` and
  `components/charts/doughnut-chart/DoughnutChart.geometry.test.ts` (twice in the last, a
  header clause and an inline comment). That file had been renamed **twice** — batch 2 made it
  `ChartInternals.test.ts`, batch 3 made it `frameworks/angular/DataVisuals.test.ts` at the
  layer root — and both times the `import` line one or two lines below was rewritten while the
  header above it was not, which is precisely the shape this entry records. Each was checked by
  opening `DataVisuals.test.ts` and confirming it really does cover the functions the header
  claims (`barPath`, `arcPath`, `niceMax`, `ticks`, `resolveColors`), and each now carries the
  rename chain in past tense so a third rename cannot silently falsify it. **The rest of the
  Angular class is untouched** — re-run its command rather than assuming these four were most
  of it.

  **A second shape belongs to this entry and is not a filename at all: a comment asserting a
  property of its own DIRECTORY.** Eleven React suites opened with *"This directory renders
  with renderToStaticMarkup and has no DOM"*, which was a property of `frameworks/react/test/`
  and became a property of nothing when batch 3 colocated the suites — three of the eleven were
  outright **false**, because `tooltip/`, `tabs/` and `menu/` each hold a `.dom.test.jsx`
  sibling, and the other eight were one component away from it. `frameworks/react/test/Smoke.dom.test.jsx`
  carried the sharpest form, *"This directory is separate from frameworks/react/test/ on
  purpose"*, from inside `frameworks/react/test/`. All are converted to *"This suite carries no
  `.dom.` infix"*, and **the rule is a property of the FILENAME now, never of the directory** —
  any sentence stating it as a directory property is one sibling away from being false. A path
  sweep cannot see this shape, and neither can a grep for renamed tokens; it is found by reading
  the header of a file you are already editing.

  **Two narrower classes are CLOSED, and this entry described both wrongly at first, in
  opposite directions.** It claimed batch 2 had rewritten "every path naming a file that no
  longer exists, which the path-existence sweep finds"; **five full paths inside the layer
  resolved to nothing** — `Skeleton.ts` citing `frameworks/angular/test/skeleton-dimensions.test.ts`,
  and `ConfirmDialog.variants.test.ts`, `Onboarding.variants.test.ts`,
  `BulkActionBar.variants.test.ts` and `CommandPalette.variants.test.ts` all citing
  `frameworks/angular/test/host-class-binding.test.ts`. And it claimed cross-layer citations
  "were corrected in that batch (six sites)"; **ten survived**, in
  `scripts/lib/api-surface.mjs`, `scripts/check-api.mjs`, `scripts/api-surface.test.mjs`
  (twice), `frameworks/react/test-dom/tag-and-chip-cases.test.jsx` (twice),
  `frameworks/react/test-dom/onboarding-modal.test.jsx` (twice),
  the layer divergences (section 3) and — a **gate-read artifact**, not a comment —
  `frameworks/react/components/feedback/Toast.behaviour.json`. The close-out fix corrected
  all fifteen. (Those three React paths are the names those files carried at the time and
  are kept as the record; batch 3 moved them to
  `frameworks/react/components/display/TagAndChipCases.dom.test.jsx`,
  `frameworks/react/components/feedback/onboarding/Onboarding.dom.test.jsx` and
  `frameworks/react/components/feedback/toast/Toast.behaviour.json`.) **Describing a class as closed when it is not turns a deferral into a false
  all-clear**, which is worse than the deferral: the intra-layer class above is honestly
  deferred and a reader knows to expect hits, while a reader of the old sentence would have
  stopped looking. Re-derive both classes rather than trusting this paragraph — the paths
  with a script that walks `git ls-files`, extracts every `frameworks/…` token and reports the
  ones `os.path.exists` denies (it also reports deliberate past-tense history, such as
  `check-duplicate-constants.mjs`'s "which was `frameworks/angular/primitives/chart-internals.ts`
  when this happened", which is the correct form and must be left alone); the cross-layer
  citations with the change-time command in the *"a component name written into ANOTHER file's
  prose"* entry above, run for the moved component.
- **Duplicate case names are rejected only by the two test wrappers, never by the gate.**
  `validateBinding` in `scripts/lib/behaviour-contracts.mjs` loops over `bindingCases()` and
  never asserts the names are distinct, so a binding declaring `danger` twice passes
  `check:behaviour`; and `crossLayerAgrees` builds its per-name map last-write-wins, so only
  the last declaration of a repeated name is ever compared across layers. Both wrappers do
  throw on a duplicate, and they must: `Object.keys()` on a suite's own case map can never
  carry one, so the key-set diff would report a confusing missing/unknown pair instead of
  naming the real problem. But a binding no suite covers is unguarded, and most bindings are
  uncovered. Cheap to close in `validateBinding`; it was left open because the batch that
  found it had that file closed by its own constraints.

  **The same function has a second hole with the same cause, and it is worse: a `cases[]`
  entry that does not NAME itself passes the gate entirely.** `bindingCases()` normalises a
  missing `name` to `null` (`c.name ?? null`), and `validateBinding`'s `when`-required rule
  is written `if (c.name !== null && !c.when)` — so a nameless entry skips the `when`
  requirement too, and `cases: [{ "pattern": "none" }]` clears `check:behaviour` with no name
  and no prose. It is not merely an unnamed case; it is a case that declares nothing about
  which render it describes, which is the one thing a case is for. Both wrappers catch it
  downstream — a `null` name can never match a real key of a suite's case map, so it is
  reported as an always-missing case — but only for the minority of bindings a suite covers,
  and the message names a missing render rather than the missing name. Close both in
  `validateBinding` together: distinct names, and a name required on every `cases[]` entry.

  **Three smaller things the same batch left, recorded here rather than in the plan that gets
  deleted.** `divergesFromReason` (introduced on `Skeleton`'s and `Toast`'s bindings, and on
  `Toast`'s alone since 8C10 closed the `Skeleton` divergence) is a novel field
  with no repo precedent that **no gate reads** — if a convention for divergence rationale is
  ever wanted it should be named repo-wide rather than inheriting an unstated first instance
  from one batch. A comment in `frameworks/angular/test/Compliance.ts` explaining why a
  `c.name as string` cast is safe **gives the wrong reason**: it cites the no-cases guard,
  which only refuses the single-entry flat shape, when the real protection is that the
  missing/unknown throw fires first — a null name can never match a real object key. The cast
  is safe; the stated mechanism is not the one protecting it. And neither wrapper's
  failure-path tests exercise the loop **body**, so the per-case binding synthesis and the
  `case "<name>" (<when>): ` message prefixing are proved only by the real component suites
  and by nothing that would survive their deletion.
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
  **This is the live instance of the one conditionality level `cases` did not
  close**, per the entry above: `Tag` and `Skeleton` were the two the schema could
  not express, and both have since left the problem — `Tag` by being expressed as cases,
  `Skeleton` by having its defect fixed in 8C10, after which nothing was left to scope and
  its binding went flat. This one is neither: it depends on what a
  consumer hands in rather than on any prop of `Tooltip`, so no case can name it.
  There is no grep for the set of instances, because a
  requirement holding only for some inputs is a property of the implementation,
  not a string in the binding — that absence is exactly why the schema cannot
  express it. This entry, `Table`'s `focus.roving` and `Pagination`'s
  `roles.label` are recorded case by case instead, and finding the next one means
  reading a component's implementation against its binding, not searching for a
  phrase.
- **The grid hand-test rule is RETIRED, and what replaces it is a measurement plus a
  method.** `Calendar` and `Table` bound `grid` and were DOM-tested by hand — serve the
  tree, operate the component on its `*.card.html` page — because the React DOM suites'
  own directory had once been deleted whole for its RAM cost and restored minus one
  suite. Both have render suites now
  (`components/display/calendar/Calendar.gridKeyboard.dom.test.jsx`,
  `components/display/table/Table.cases.dom.test.jsx`) and both are in `COVERED`.

  **The old figure is not comparable to the new one, and that is the first thing to know.**
  The retired rule cited `grid-keyboard.test.jsx` at 164 MiB against 109 for the six other
  suites of that directory and 171 for the whole of it. Those numbers were taken on another
  machine, with other versions of bun, React and happy-dom, against a harness baseline nobody
  recorded — so "164" cannot be compared with anything measured today. Only a before/after
  pair taken in one sitting means anything. Taken that way, sampling `VmHWM` of the process
  tree:

  | what | peak RSS |
  |---|---|
  | harness baseline — one tiny DOM suite alone | 89 MiB |
  | the Calendar grid suite alone | 128 MiB |
  | the whole DOM invocation, without it | ~143 MiB |
  | the whole DOM invocation, with it | ~158 MiB |

  The rule's own justification was that the grid cost more than every other suite combined.
  It does not: 39 MiB above baseline against roughly 54 for the other nineteen together. That
  is what retires it, on its own terms.

  **What actually costs memory is the number of key presses, not the grid.** Measured
  separately: mounting the 84-cell fixture is +15 MiB over baseline, walking it is +60 more.
  Each press re-renders the whole grid through `act()`, and the garbage is not collected
  during the run. So the sequential cell-by-cell walk — which is the method now, and which
  proves strictly more than the old suite's sampled assertions — did **not** make the suite
  cheap by itself. What makes it affordable is a small fixture: the Calendar suite renders a
  6×5 grid by setting `dayStart`/`dayEnd` explicitly rather than taking the default 6×14, and
  every invariant it asserts holds at any size from 2×2 up. Halving the cells roughly halved
  the bill.

  **The method, so a future grid inherits it rather than re-deriving it.** One mount per
  scenario, kept in a module-level variable and cleaned up once in an `after()`. A walk that
  visits every cell with one press per step, asserting at each that focus landed on the
  expected cell **and** that exactly one `tabindex="0"` exists and is that cell. Edge clamps
  as one extra press per edge, never a loop of forty. `Home`/`End` asserted inside the same
  walk. `git show edb9f3e^:frameworks/react/test-dom/grid-keyboard.test.jsx` is still the
  deleted original and is worth reading for the transposed-grid explanation, but its fixture
  no longer matches `Calendar`'s API — it passes `events`/`onEventClick`, which are now
  `CalendarEvent` children. **Do not modernise the path in that command**: `git show
  <rev>:<path>` resolves inside that revision's tree.

  **What is still checked by eye**, and this is unchanged: the interior of a focus trap, and
  anything needing a real browser's sequential focus navigation, which happy-dom does not
  implement.
- **Compliance coverage is a small fraction of the bindings and nothing schedules the
  rest.** `bun run check:compliance` prints the live pair; do not trust a figure written
  here, which has drifted once already — every batch that adds a component adds a binding
  and moves the denominator without touching this line.
  `COVERED` guards the accuracy of what it claims, never the completeness of it, so the
  uncovered bindings remain exactly as unverified as they were before this gate existed.
  `Table` and `Calendar` used to head that list — the grid rule kept them out of a suite
  permanently — and both are covered now, which moved them out of it rather than changing
  what the gate promises. The gate was built
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
  **And which layer a suite belongs to is decided STRUCTURALLY now, not textually.**
  `validateCoverage` makes two separate checks: first that the key's layer equals
  `suite.layer` — a tag `collectSuites()` attaches from the `SUITE_DIRS` tree the file was
  found under, a fact about the filesystem fixed at collection time — and only then that the
  suite's text names that layer's binding path *tail*. The tail proves which **binding**
  within a layer, and it can no longer prove the layer, because since batch 3 both layers
  spell a dual-bound component's tail byte-identically (`display/tag/Tag.behaviour.json` on
  both sides). Two textual accidents in a row had carried the discrimination — the bare stem
  while Angular's binding was kebab-named, then the tail while Angular's carried a kebab
  directory React's did not — and each expired with a layout change. Had the layer tag not
  been in place first, batch 3 would have reverted the gate silently to the defect commit
  `663b2e4` closed. `check-compliance.mjs`'s own comment beside `SUITE_DIRS` and `COVERED`
  carries the full history.
- **Some exceptions rest on a `behavioural` verdict no suite in either layer
  declares — RETIRED as a live list, kept for the lesson.** The last four were
  `ActivityFeed`'s `posinset`/`busy` in both layers, and both bindings now have cases
  suites. What the entry describes is still real: some requirements no single element can
  decide from the DOM, so
  the suite asserts each by acting on the tree and records the verdict in
  `behavioural`. That verdict is trusted, not re-derived: a suite that declares the
  wrong verdict pins a false claim exactly as a scan would have. And `comparePattern`
  **throws** on an unknown requirement key or a missing `ELEMENT_ROLE` entry — one
  bad key aborts the whole test rather than reporting one problem, so a suite's
  wrapper (`frameworks/react/test/AssertPattern.jsx`,
  `frameworks/angular/test/Compliance.ts`) must expect the throw, not only a
  returned problem list. **The set is empty as written, and the way to check is a grep
  rather than this sentence**: `grep -rln "posinset\|'states.busy'\|states.readonly"
  --include='*.dom.test.jsx' --include='*.test.ts' frameworks/react/ frameworks/angular/`
  returns the suites that PIN these; compare it against the bindings that declare them.
  It will refill: every batch that writes an exception on a BEHAVIOURAL requirement without
  a suite puts an entry back. **Both
  halves of that command are now a whole layer, and the two `--include`s are what keep it
  honest**: the suites moved out of `frameworks/angular/test/` in the structure refactor's
  batch 2 and out of `frameworks/react/test-dom/` in batch 3, so neither directory bounds
  the question any more — and widening to a layer without restricting to a suite extension
  matches the bindings that *declare* these exceptions (`ActivityFeed.behaviour.json` in
  both layers) rather than a suite that pins one, which is the opposite of what the question
  asks; on the React side it also reaches `vendor/ReactDomClient.js`, a committed
  third-party bundle.
  **This entry read *seven* until 8C9**, which
  pinned `Tag`'s `states.disabled` in **both** layers by declaring it in the `removable`
  case's `behavioural` map (`TagAndChipCases.dom.test.jsx`, `Tag.cases.test.ts`), and
  `CalendarEvent`'s two declarations of the same requirement are pinned from birth in the
  same suite. It reads *four* now: `Input`'s and `Textarea`'s `readonly` left it when
  `TextboxStates.dom.test.jsx` was written, and what that suite found is the reason this
  entry matters — **both exceptions had been false for some time and nothing could see it**,
  because an unpinned BEHAVIOURAL requirement has no verdict to compare against and stays
  green whatever the component does. An entry on this list is not merely unverified; it is
  unfalsifiable until a suite renders it. **The enumeration was never exhaustive and still is
  not** — `TableRow` excepts `states.disabled`, `keyboard.Enter` and `keyboard.Space` and is
  in no suite at all, and it was absent from the seven. Read the current set with
  `grep -rHo '"requirement": "[^"]*"' --include='*.behaviour.json' frameworks/ | sort -u`
  against `BEHAVIOURAL` in `scripts/lib/behaviour-compliance.mjs`, rather than any list
  written here; and read the other side — which verdicts a suite actually declares — with
  `grep -rho "'[a-z]*\.[A-Za-z]*': \(true\|false\)" --include='*.dom.test.jsx'
  --include='*.test.ts' frameworks/react/ frameworks/angular/ | sed "s/: .*//;s/'//g" |
  sort -u`, since an enumeration of
  that has gone stale here twice. Neither the deletion and restore of the React DOM test
  directory nor its later disappearance changed what is unpinned; none of them was ever
  what caused it.
- **Angular has no `Calendar`, and nothing has decided whether it should.** React's
  `Calendar` is a day/hour schedule grid with absolutely-positioned event blocks;
  Angular has no equivalent from either an `arena-*` primitive or Angular Material —
  `mat-calendar` is a month/date-selection grid, a different widget solving a
  different problem. `frameworks/angular/BehaviourDelegated.json`'s `Calendar` entry
  binds pattern `absent` and records this as a fact, not a decision: it does not
  commit Angular to gaining a schedule view, and it does not resolve whether the gap
  should stay this way. It is simply open.

- **A chart's `aria-label` is checked for existence, never for usefulness, and the
  charts fall back to a name that is only their type.** `figure-with-data-table`'s
  `roles.label` requires "aria-label naming the chart", and
  `frameworks/angular/components/charts/ChartDataTable.test.ts` proves the three verifiable
  parts of that pattern against a real render — the `<table>` exists, it is
  visually hidden rather than absent, and its cells pair each category with its
  plotted value. It cannot prove the fourth. All three charts now have a
  consumer-supplied name path — `seriesLabel`, which `DoughnutChart` gained when the
  charts came under the API contract, so the earlier worst case of a literal with no
  caller path at all is closed — and all three still fall back to a name that is only
  their type when none is given: `BarChart.ts` emits the constant `Bar chart`,
  `LineChart.ts` and `DoughnutChart.ts` the same. **The debt that remains is the
  harder half: a name that is *present* is never checked for being *useful*.** A
  fallback satisfies the requirement mechanically while telling a screen-reader user
  nothing — a page with two bar charts on it announces both identically — and a
  `seriesLabel` of `"Chart"` would satisfy it just as mechanically. No assertion
  separates a present name from a useful one; that is human judgement, and the suite
  pins the fallback rather than faking a verdict on it. The React charts do the same
  thing and are not covered by a suite at all.

  **`ProgressBar` is the same defect outside the charts**, and it is worth naming here
  rather than in a second entry because the mechanism is identical: `ProgressBar.jsx`
  falls back to `aria-label={label || 'Progress'}`, which satisfies the `progressbar`
  pattern's `roles.label` mechanically while telling a screen-reader user only what the
  component is. Two progress bars on one page announce identically. Unlike the charts it
  now IS covered by a suite —
  `frameworks/react/components/feedback/progress-bar/ProgressBar.dom.test.jsx` — and that
  changes nothing about this half: the suite proves a name resolves, which is exactly the
  check that cannot tell a useful name from a present one. `Table.label` and
  `SegmentedControl.ariaLabel` are what the fix looks like when it is taken: required and
  guarded at runtime rather than defaulted.

- **Whether the explicit `aria-live` on `ProgressBar` and `Spinner` causes any real
  announcement is UNVERIFIED, and the batch that added it over-claimed.** Both components
  now carry `aria-live="polite"`, and the `progressbar` pattern requires it because that
  role — unlike `status` — carries no implicit live region. What is verified is exactly
  that: the attribute is present, and the requirement is met by a render suite. **What is
  not verified is the thing the attribute is for.** A live region is specified to announce
  changes to the region's *content*; `ProgressBar` reports progress by mutating the
  **attribute** `aria-valuenow`, and its visible percentage text sits in a sibling element
  *outside* the region. Whether a screen reader announces an attribute-only change in a
  polite region is not something this repository has tested with a real one, and it varies
  by AT. So the claim in the batch's own commit message — that `ProgressBar` "announces
  value changes where before it announced nothing" — is stronger than the evidence: what
  changed for certain is that the widget now satisfies its pattern.

  **Two things this entry deliberately does not do.** It does not argue for removing the
  attribute: the role genuinely has no implicit politeness, and for `Spinner` — whose label
  IS inside the region — the announcement is the ordinary content case and the attribute
  preserves exactly what `role="status"` used to provide implicitly. And it does not
  propose a gate: no gate in this repository can test a screen reader, which is the same
  boundary the focus-trap interior and the `grid` pattern both sit on. Closing it means a
  person with NVDA, JAWS and VoiceOver in front of them, and the likely fix if it is real
  is moving the percentage text inside the live region or announcing at thresholds rather
  than continuously.

- **Every claim the delegated declarations make about Angular Material is unpinned.**
  `frameworks/angular/BehaviourDelegated.json` asserts what Material's controls do —
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
  contracts/api/components/`, whose only hit is `Input.validate`'s `functionInput` — so R3 is
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
  checks it.** The convention is `import type { X } from '../../../Api.generated'` in both
  layers — every declaration in `Api.generated.ts` is a type and none of them exists at
  runtime (`export type` for the enums, `export interface` for the predefined objects), so
  a value import there is a type-only import written without `type`. `Avatar.ts`,
  `Alert.ts` and `PageHead.ts`
  each write the bare form instead. It compiles and nothing has ever broken because of it;
  it is recorded because it is a live inconsistency no gate can see, and because it was
  previously written down **only inside plan 8B3**, which was deleted when that plan was
  executed. That is the exact failure mode this section's preamble names.

- **A boolean variant's `defaultVariants` entry is written two different ways, and which way
  a manifest uses is decided by whether anything typechecks it.** With `true`/`false` keys,
  `tailwind-variants` infers a **boolean** variant, so the default must be `false`, not
  `"false"`. Re-derive the split rather than trusting a list here: every manifest whose
  component has an Angular `<Component>.variants.ts` consumer uses the boolean
  (`ActivityFeed`, `PageHead`, `BulkActionBar`, `Alert`, `ConfirmDialog`, `Onboarding`,
  `CommandPalette`, and `Tag` since this batch); every manifest without one uses the string
  (`Card`, `SideNav`, `SegmentedControl`, `Tabs`, `Button`, `IconButton`, `Checkbox`,
  `Radio`, `Switch`, `Select`, `Input`, `Textarea`). **That is not a style split, it is a
  detection split** — `ngc --strictTemplates` rejects the string form, and a manifest with no
  Angular consumer is never compiled by anything, so the wrong form is invisible. React does
  not consume these recipes at all (its components are inline styles), and `check:tailwind`
  asserts that classes resolve, not that defaults typecheck.
  At runtime both work, because the lookup stringifies the key — so this costs nothing today
  and costs a compile error the day a component in the second list gains an Angular
  primitive. Adding `disabled` to `Tag` is what surfaced it: `Tag` moved from the second list
  to the first mid-batch. The thirteen were left alone deliberately, because changing them
  fixes nothing measurable and no gate would hold the fix in place.

- **`ActivityFeed`'s articles carry `tabindex="0"` on recollection, not on a re-read of APG.**
  The `feed` pattern's own file in `contracts/behaviour/` states seven requirements and says
  nothing about tabindex, so nothing in this repository decides the value — but a feed whose
  articles cannot receive focus has no way to satisfy `keyboard.PageDown` either, so the
  implementation had to pick one. It picked `0`, making each article a tab stop, on the reading
  that a feed is a **browse** structure rather than a composite widget with one roving stop.
  **www.w3.org is unreachable from the environment this was written in** — WebFetch is refused at
  the domain level — so the APG feed example's markup was not re-read. A web search did confirm
  the keyboard half in APG's own words (Page Down → next article, Page Up → previous, and a
  Control+End the repo's pattern file does not require and neither layer implements). What is
  unverified is narrow and specific: whether APG's example uses `tabindex="0"` per article or
  `-1` with the feed itself focusable. Both suites assert `0` today, so a correction means
  changing the suites as well as the components. Re-read
  `https://www.w3.org/WAI/ARIA/apg/patterns/feed/` from an environment that can reach it.

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
  a `| undefined` arm — is the spelling `contracts/api/README.md` now states normatively and
  `scripts/api-surface.test.mjs` pins. What did fail was the *optional* spelling
  `input<((value: string) => string) | undefined>()`, and it failed on parse ORDER rather than
  on any rule: `classify()` tested its arrow pattern before reducing the annotation, backtracked
  onto the inner `)`, and read the return as `string)`. That is fixed — a nullable annotation is
  now reduced to the annotation it wraps before any form is tested — so both spellings read
  identically and Plan D has nothing left to discover about the reader. What remains owed is an
  Angular `Input` that declares the member; no Angular component was touched, here or in 8C2.

- **`ControlSize`'s description is inaccurate for two of its four consumers, and the
  reuse is still correct.** `contracts/api/types/control-size.json` says *"Heights come from the
  density tokens, so a control inside `.arena-compact` re-densifies with the rows around
  it."* True of `Button` and `IconButton`. False of `ProgressBar`, whose thickness is
  `--sp-1`, `calc(var(--sp-1) * 1.5)` and `calc(var(--sp-1) * 2.5)`, and of `Spinner`,
  whose diameters are `--icon-sm`, `--sp-5` and `--sp-8`. `.arena-compact` redefines only
  the `--dz-*` family (`contracts/design-generated/spacing.css`), so neither re-densifies. **The shared enum is
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
  rule, and `frameworks/react/components/navigation/tabs/Tabs.dom.test.jsx` now backs the claim with a render
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
  the reference-carrying requirement keys **among those that reach `ATTRIBUTE_FOR`**, which is
  the one branch of `evaluate()` that consults it, and it is **derived** from `IDREF_ATTRIBUTES`
  rather than hand-written beside it, which is what stops the set drifting out of scope again.
  Be exact about what went wrong before, because the obvious reading is not it: 8C7 had exactly
  **one** hand-written list, three requirement keys, and nothing anywhere disagreed with it. Its
  defect was **reach** — a list of requirement KEYS cannot name `aria-labelledby` at all, since
  `roles.label` carries no `ATTRIBUTE_FOR` entry — plus one strictness rule applied to all three
  keys on a justification belonging to one. Keying the map by ATTRIBUTE is what fixes both.
  `roles.label` has a reference form and takes a different
  route entirely; 8C7 left that unresolved and 8C8 closed it, which is that batch's own entry
  below. Each key `IDREF` does name is looked up through a
  `resolveId` the *caller* injects, because the evaluator still touches only `tagName`,
  `getAttribute`, `hasAttribute` and `textContent` and still runs in three runtimes one of
  which has no DOM. Resolution had to arrive from outside rather than be done in place, so
  each layer's wrapper builds the resolver from the render root itself and a suite cannot
  forget to pass one; a requirement in `IDREF` that finds its attribute and no resolver
  **throws**, since degrading to the old presence check would report a dangling reference as
  met, which is the whole defect the parameter exists to catch. Note the scope: an attribute
  that is simply *absent* is unmet and returns before the resolver is ever consulted, so the
  throw is about a reference that exists and cannot be checked, never about a missing one.
  **And *each* is quantified rather than sampled** — a subject may be an array, every element
  in it must meet the requirement, and a quantified requirement handed a single element throws
  as well. `Tabs.dom.test.jsx` hands over every tab **as well as** keeping its own hand-resolution
  test, which the layer does not supersede: that test also asserts the reverse `aria-labelledby`
  wiring — each panel labelled by the tab that controls it — and that exactly one panel is
  unhidden while the rest are hidden rather than absent. Neither is a requirement key, so no
  pattern can ask for either and no evaluator can decide them. Do not delete it as redundant.

  What none of that buys, and none of it is scheduled. **A resolved reference is not proof it
  landed on the RIGHT element.** A pattern states its requirement as prose written for a human,
  and the schema has no way to say what *kind* of element a reference must reach — so an
  `aria-controls` resolving to a `<span>` that is not the tabpanel passes exactly as the real
  one does. Closing that is a change to the pattern schema, which this batch deliberately was
  not. **And `aria-describedby` holding a LIST is met when ONE of its ids resolves**, so a
  dangling id sitting beside a resolving one passes — the same family as the sentence above, one
  step further out. 8C7 wrote that as a blanket rule over every reference; 8C8 narrowed it to the
  one attribute that earns it, because the justification only ever belonged to that one:
  `aria-describedby` legitimately carries the consumer's own description alongside Arena's, and
  that id may name an element outside the component's rendered tree, so demanding that every id
  resolve would fail a correct component. Every other reference attribute now requires that
  **every** id resolve — read `IDREF_ATTRIBUTES` in `scripts/lib/behaviour-compliance.mjs` for
  the live set, since strictness is a property of the attribute rather than of the requirement
  key, and each entry carries its own reason. The cost survives, scoped to where it is earned:
  within Arena's own `aria-describedby` wiring a typo'd second id is invisible.
  **The quantified set is hand-curated, and nothing proves it complete.** Deriving it from
  the word "each" was considered and rejected: the prose says "false on the **rest**" just as
  readily, so a scan finds fewer requirements than a reader does, and deriving it would rebuild
  the false-negative class the evaluator's header already rejected once. Its suite therefore
  proves only that every entry names a real requirement and that a quantified requirement is
  decidable per element — never that a requirement quantified in prose has an entry. One nobody
  curated is still checked on the one element a suite chooses, exactly as before, and 8C7's own
  close-out review found two the batch had missed — `radiogroup:states.checked` and
  `feed:roles.article` — which is the curation gap demonstrating itself one review after being
  written down. **And some requirements that do quantify are excluded for stated reasons
  rather than closed**: read `NOT_QUANTIFIED` for the live set and its reasons, which are
  listed rather than merely absent so the next reader meets the decision instead of the
  silence. As written they are the two shapes worth knowing — a requirement that is
  *behavioural*, its prose carrying a "when", so there is no per-element verdict to quantify
  over at all; and one that quantifies over a *page* rather than over what the component
  renders, which a component suite cannot satisfy without faking a second landmark.
  **What quantifying buys is bounded by the selector that builds the collection**, and that
  boundary is the mechanism's real edge rather than a defect in it. `Tabs.dom.test.jsx` passes
  `querySelectorAll('[role="tab"]')`, so a tab rendered *without* `role="tab"` leaves the
  collection silently and takes its dangling `aria-controls` with it, while every element that
  remains still passes. Not live — `Tabs.jsx` renders the role uniformly — but the rule makes
  "the first element answered for the collection" impossible and can never make a suite's
  selector match the elements a pattern is about.

  All of this reaches a binding only through a suite that renders it, so a binding outside
  `COVERED` gains nothing from any of it — see the coverage entry above, which is where that
  hole is recorded.

- **`roles.label` resolves its reference now, and what stays open is the CONTENT at the far end
  of it.** This entry recorded the opposite until batch 8C8: `roles.label` never reaches the
  `ATTRIBUTE_FOR` branch 8C7 taught to resolve, and `hasAccessibleName()` returned `true` the
  moment `aria-label` **or** `aria-labelledby` was non-empty, so a dangling `aria-labelledby`
  read as a name. That is closed. `hasAccessibleName(el, acceptsText, resolveId)` in
  `scripts/lib/behaviour-compliance.mjs` now asks whether there is a NAME rather than whether
  there is an attribute, through three ordered alternative routes: `aria-label`; then the
  element's own text, but only where the pattern is in `LABEL_ACCEPTS_TEXT`; then
  `aria-labelledby`, which names the element only when **every** id resolves. A dangling
  `aria-labelledby` with no other route left now means unnamed. When `aria-labelledby` is the
  deciding route and no resolver was supplied it **throws**, for the reason the same throw
  carries in the `ATTRIBUTE_FOR` branch: a presence-only fallback would report a dangling
  reference as met, which is the defect the parameter exists to catch. `roleOf(el, resolveId)`
  takes the resolver too, because a `<section>` exposes `role="region"` only when it is named, so
  a labelledby resolving to nothing takes the role with it. The reach is not marginal — most of
  the patterns declare `roles.label`; count them with `grep -l '"roles.label"'
  contracts/behaviour/*.json | wc -l` against `ls contracts/behaviour/*.json | wc -l`.

  **The induction, because a check nobody has watched fail is a check nobody knows works.**
  Deleting `id={titleId}` from `Dialog.jsx` leaves a dangling `aria-labelledby` on a dialog with
  no accessible name of any kind. That tree used to report **98 pass / 0 fail** under
  `bun run test:react-dom` — and `dialog-modal.test.jsx` alone **6 pass / 0 fail** — which is why
  this entry existed. It now reports **one new failure** against that same tree, carrying
  `roles.label: OVERCLAIM — the
  binding declares no exception, but the rendered DOM does not meet it.` The message is the
  durable half of that contrast; a post-batch total is not, since it moves the next time any
  DOM suite gains a test. The tree was restored
  and verified with `sha256sum -c`. `Dialog:react` and `ConfirmDialog:react` are the covered
  bindings this reaches: both bind `dialog-modal`, whose `roles.label` prose is "aria-labelledby
  or aria-label" — text content does not count, since `dialog-modal` is not in
  `LABEL_ACCEPTS_TEXT` — and both name themselves with `aria-labelledby` alone. `SideNavSection`
  does too and is not covered. `Onboarding:react` binds the same pattern and never was exposed,
  because it names itself with `aria-label`, a value rather than a reference.

  **What stays open is the other end of the reference: a resolved `aria-labelledby` may name an
  EMPTY element.** The id resolves, so the name reports as present, while the element it names
  carries no text and the real accessible name is the empty string. Not hypothetical —
  `SideNavSection.jsx` guards exactly this by hand, and its comment on the guard names it:
  *"`label` is the whole accessible name of the group this component renders, so `label=""`
  leaves a role="group" whose aria-labelledby resolves to an empty heading -- the defect the
  guard exists to prevent, arriving through a value that is present, which `== null` would let
  through."* **Requiring text at the target was considered and rejected**, and the rejection with
  its reason is the record here rather than the gap alone: `textContent` cannot see a name that
  legitimately comes from an image's `alt` or from a nested `aria-label`, so the check would
  report correct components as unnamed — a false OVERCLAIM against a component that is right,
  which is the class of mistake this evaluator's own header records refusing once already, and
  whose cheapest silencer is a fabricated exception written into a binding. It belongs to the
  family the record has carried since before this layer
  existed: a name that is **present** is never checked for being **useful**, which is the charts'
  `aria-label` entry above, and the reason `Table.label` and `SegmentedControl.ariaLabel` are
  guarded rather than defaulted. Its sibling limit — that a resolved reference is no proof it
  landed on the RIGHT element, because a pattern cannot say what *kind* of element a reference
  must reach — is recorded in the 8C7 entry above and is untouched by this batch. And all of it
  reaches a binding only through a suite that renders it, so a binding outside `COVERED` gains
  nothing from any of it.

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
  `frameworks/react/components/feedback/onboarding/Onboarding.dom.test.jsx` asserts the collision rather than
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
  required slots (`grep -rn '"form": "slot", "required": true' contracts/api/components/`) rather than
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
  it is bound, and the refusal lives in `contracts/behaviour/disclosure.json`'s **own
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

- **`SideNavItem` binds `none` with a prose reason, and that is now a CHOICE rather than a
  limit — it is expressible as cases and was deliberately not converted.** An item renders an
  `<a>` with `href` and a `<button>` without, so no single interactive pattern always applies.
  When this was written the schema could not say so, and `none` plus prose was chosen as the
  less-false of two false options: binding `button` with an exception — what `Tag` then did —
  would have left a reader of the binding alone believing the pattern always holds. Since 8C9
  the schema **can** say it: two cases split by `href` — the `<button>` shape binding `button`,
  and the `<a href>` shape binding `none`, since there is no link pattern and a link's role and
  keyboard come from the platform — is exactly the shape `Tag` and `CalendarEvent` now carry.
  8C9 converted the seven bindings its spec named and no others, and **`SideNavItem`'s own reason
  string now says so**: it used to read *"The schema still cannot say…"*, and 8C9's close-out
  rewrote it to state that the shape is expressible, that this binding is an **unconverted case**
  rather than evidence of a limit, and what converting it would cost. A reader meeting the binding
  alone now learns the option exists and that nothing has taken it.
  Converting it means writing a render suite for both shapes and adding `SideNavItem:react` to
  `COVERED`; nothing schedules that. What is genuinely still open is the third conditionality
  level — conditional on **consumer** usage, with `Table`, `Tooltip` and `Pagination` as the live
  instances — recorded in its own entry above. **Count the `none` bindings rather than writing an
  ordinal**, and note the count now includes `none` bound by a *case* rather than by a whole
  binding (`Tag`'s `plain` and `CalendarEvent`'s `inert`; `Skeleton`'s `circle` was a third
  until 8C10 retired that case, which is the count moving DOWN and another reason not to
  write an ordinal)
  — `grep -rho '"pattern": "none"' --include='*.json' frameworks/ | wc -l`, and the `-o` is the
  point: `grep -rl` counts FILES, and `frameworks/angular/BehaviourDelegated.json` holds several
  `none` entries at once, so the file count is not the binding count and the measurement written
  here to replace a stale ordinal was itself wrong. 8C5 added two in one change, and this
  file has now had three separate prose ordinals about this limit go stale, one of them inside
  the batch that wrote it — `SideNavItem.behaviour.json` shipped saying "the fourth component to
  meet it" while its own batch-mate `SideNavSection.jsx` counted five, and the close-out review
  replaced both ordinals with a pointer here.

- **Plan D inherits an open question about `SideNav`, registered here so it is not inherited
  silently.** `frameworks/angular/BehaviourDelegated.json`'s `SideNav` entry claims Material
  provides this control — its reason says `mat-nav-list` "already provides the anchor-or-button
  distinction, the active state and the keyboard behaviour". **That is defensible for a flat list
  of links and questionable now**: `mat-nav-list` provides no named section group and no nested
  disclosure group, which is most of what 8C5 added. The two resolutions are Plan D's to choose,
  not this batch's to pre-empt — an `arena-side-nav` primitive that stops delegating, or a
  narrowed delegated claim admitting Material covers the flat case only. Section 3's
  SideNav entry states the same thing; **keep the two consistent**, since nothing checks
  that they agree. Two adjacent facts a Plan D reader should have with this: the delegated file
  records no Material version for any of its claims (`@angular/material` 22.0.5 at the time), and
  `check:behaviour` never re-checks a claim about a third-party library — so these reasons can
  quietly become false while the whole suite stays green.

- **`SideNavCollapsible.id` is required, and the alternative was never properly weighed.** The
  contract originally justified required-ness by citing `contracts/api/README.md`'s `id`-member rule, which
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

- **Two specs cite the pre-`contracts/` paths and are left that way on purpose — but the
  re-derive command returns more than two files, and both of the others need their own
  accounting rather than being folded silently into "two."**
  `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` (36 hits) and
  `2026-07-18-9-four-package-build-publish-design.md` (8) name `api/`, `behaviour/` and
  `tokens/` throughout and are the two left alone. Both mix historical uses — a path inside
  a `>` block recording what a shipped plan settled, correct **as history** — with normative
  text that a reader would follow today, and separating the two is a reading of each spec's
  argument rather than a find-and-replace. The four-package spec is the sharper case: it is
  *about* where files live, so its paths are load-bearing to its argument, and its own
  header already warns they are stale in the other direction (the pre-refactor
  `frameworks/tailwind/` layout). This is the same treatment the first of them already
  carries for its pre-move `frameworks/` paths, recorded above; read this paragraph before
  reading either spec.

  Re-derive with `grep -nE '(^|[^a-zA-Z/])(api|behaviour|tokens)/' docs/superpowers/specs/*.md`
  and, run today, it returns **two** files — the same two left alone above. A **third** file
  matched until this batch's own close-out deleted it: this refactor's own design spec,
  `2026-07-29-contracts-directory-design.md` (30 hits), needed no "left that way on purpose"
  treatment while it existed — it was the document that specified the move, so its
  `api/`/`behaviour/`/`tokens/` citations were the correct BEFORE-state of the migration it
  argued for, never a claim about the tree at the time. The plan itself,
  `docs/superpowers/plans/2026-07-29-contracts-directory.md` — outside this grep's `specs/`
  scope, but matched the same way and for the same reason by the path-existence sweep — was
  deleted alongside it, per this repo's convention that an executed plan and its spec are
  removed once their content is migrated into this file. A **fourth** file
  matched until this same batch closed it:
  `2026-07-29-calendar-chip-box-and-header-gap-pending-1.md` carried one live, present-tense
  citation — *"not in `styles.css`, not in `tokens/`"* — with no historical reading available,
  the same false claim already fixed in `frameworks/tailwind/README.md` and in the layer
  divergences (section 3). Unlike the two specs left alone above, that one was a plain
  defect rather than an argument needing to stay intact, so it was fixed in place — both
  current directories now stand in for the one that no longer exists — rather than recorded
  as debt.

- **Nothing checks that `contracts/` has the shape `contracts/README.md` describes.** A
  stray file in `contracts/`, a level missing its `README.md`, a fourth directory added
  beside the three — all pass every gate. `check:structure` is the analogue for
  `frameworks/` and has no counterpart here, and a `check:contracts` was judged out of
  scope for a batch whose subject was moving files. Related and also open: the
  capital-initial naming rule is declared for the framework layers and does not reach
  `contracts/`, so `button.json` and `palette.dark.json` keep lowercase stems. That is
  **correct**, for two different reasons and neither is "identifiers stay lowercase" in
  general: `button.json` is a pattern's own identifier, the literal value a binding writes
  into `"pattern"`, so renaming it breaks every binding citing `"button"`. `palette.dark.json`
  is a token source `build-tokens.mjs`'s hardcoded `FILES` table names literally
  (`source: 'palette.dark.json'`) — true of all eleven sources, so all eleven are identifiers
  in that sense, but **not** because the stem decides its own output CSS name: `icon.json`,
  `component.json` and `density.compact.json` all emit into `spacing.css`, and `layering.json`,
  `chart.json` and `behaviour.json` all emit into `effects.css`, so at most five of the eleven
  — the `palette.*`, `typography`, `spacing` and `effects` sources — actually name the file
  they produce. **Not every lowercase stem under `contracts/` has a reason this solid.**
  `contracts/api/types/menu-item.json` declares its own identity inside itself
  (`"name": "MenuItem"`, read by `build-api-types.mjs`), which reads the directory only to
  order its output — nothing anywhere depends on the string `menu-item`, so renaming it to
  `MenuItem.json` would break nothing. That is exactly what this entry is about: the exemption
  is written down only here, in the entry that says nothing enforces it, and `menu-item.json`
  is the case where nothing enforces the CONTENT of the exemption either — it just happens not
  to have been renamed. **The batch's own design spec promised five zero-guards;
  `contracts/README.md:52-61` is where that decision is recorded now that the spec is
  gone — the "green run is only as good as what the gate looked at" entry at the head of
  this section names
  only `check:tailwind`, `check:radius` and `check:structure`, a different rule about a
  different set of gates, and does not promise anything about these five. Four of the five
  exist**: `zeroContractProblems` (`check-api.mjs`), `zeroPatternProblems`
  (`check-behaviour.mjs`), `zeroSourceProblems` (`check-dtcg.mjs`), and
  `zeroGeneratedCssProblems` plus `cssDiscoveryProblems` (`check-script-tokens.mjs`). The
  fifth, `check:tokens`, deliberately has none, and that is a decision rather than a gap
  left by this batch: `check-tokens-generated.mjs` builds from `build-tokens.mjs`'s
  hardcoded `FILES` list and walks no directory of its own, so it has no result set that
  discovery could ever find empty — a missing source file still fails it, through the
  build it depends on having nothing to read, just not via a guard shaped like the other
  four's.

- **Three lessons this batch paid for, and all three generalise past this one refactor.** A moved
  level's own normative README needs a direct read, not a grep. `contracts/behaviour/README.md`
  shipped citing "One file per pattern in `patterns/`" — a directory flattened away one commit
  earlier — and arguing "It is a sibling of `tokens/`, not a child" — describing the old
  root-level layout rather than a level nested under `contracts/`. No keyword query would ever
  have found either, because a document describes itself in the first person and a search has to
  already know what it is looking for. `contracts/design/README.md` had the matching defect: its
  own exclusion clause read "never in `tokens/src/`" and, carried through the move unexamined,
  became the self-contradicting "never in `contracts/design/`" two clauses after that same
  paragraph had just placed `colors.css` inside `contracts/design/`. Both were found by a
  reviewer reading the file end to end, not by any sweep. And a worklist must be scoped by path
  list only, never by piping `grep -n` output through `grep -v`: `grep -n` prints
  `path:line:content`, so a `grep -v` after it filters by the line's *text*, not by the path, and
  drops any hit whose content merely mentions the excluded string. This batch's behaviour sweep
  piped its query through `| grep -v 'contracts/behaviour/'` right after moving the patterns into
  that same directory, and silently excluded the directory it had just moved. `CLAUDE.md` already
  records this exact trap for a different command, in the entry about cross-file citations of a
  component's name above — this is a second instance of the same mistake, not a new one, and the
  fix both times is the same: scope the `git ls-files`/`grep -rn` input by a path list before the
  content match, never by filtering the output afterward. **A third, narrower lesson belongs
  beside these two**: collapsing two directories into one can make a sentence that was true
  become false without a word of it changing. The `contracts/design/README.md` exclusion clause
  two sentences above is the worked example — true while `tokens/src/` and `colors.css` were two
  levels of one hierarchy, false the moment the move merged them into one `contracts/design/` and
  the sentence started contradicting its own subject two clauses earlier in the same paragraph.
  Three sentences of this exact shape shipped in one sweep before review caught them: that one,
  its sibling exclusion for the behaviour contract at line 33 of the same file — roughly
  thirty lines *above* the clause it contradicts, not below it — and the matching clause this
  file's own *Architecture* section carried before this batch.

- **A chip that carries a kebab can still wrap its time label, in a band about 32px wide.**
  `showsTime()` compares a chip's column share against one threshold and does not ask whether
  the chip has actions. A chip without them has a content box of its share less 18px; one with
  them has its share less 46px, because the kebab's 34px reserve comes out too. So the
  kebab-safe threshold is 124.02px where the plain one is 96.02px, and `calendar.time-min-w` is
  set at the plain one.

  Measured on `Calendar.card.html`, driving the viewport and reading the container beneath it —
  the container is the viewport less the card's 24px body padding a side, and `--bp-md` is
  compared against the **container**, so week view only begins at a 768px container. At a 782px
  container a day column is 120.16px, `Release window`'s chip is 116.2px, and its time label
  wraps onto **two lines**; at an 812px container the column is 125.16px, the chip 121.2px, and
  the label fits on one. The arithmetic boundary is a container of about 800px. So the band is
  roughly **a 768px to an 800px container**, in week view, on a chip that has actions.

  It is deliberate rather than overlooked. Setting the threshold at the kebab-safe value would
  suppress the label on every ordinary chip through that band and well past it, which loses
  information in the common case to serve the rare one. Making the threshold kebab-aware would
  put `CalendarEvent`'s 34px reserve back inside `Calendar` — laundered through a second token,
  but still a number that silently goes wrong if the reserve ever changes. What survives in the
  band is the pre-existing behaviour, not a new defect.

- **A narrow chip under 56px tall still has almost no title left.** Reserving the kebab's 34px
  band is what stopped the title being drawn underneath it, and on a full-width chip it costs
  nothing. On a chip sharing its slot — `cols: 2`, about 78px outer — it leaves a **36.58px**
  content box, which renders `Client review — Northwind` as `Clien…`.

  **A tall one no longer has this problem**: at 56px or more the kebab moves to the chip's
  bottom-right, the reserve is dropped, and the title gets the whole **64.6px**. Measured, its
  truncation falls from **74% to 54%** — not to the 18% its kebab-less neighbours show, because
  that figure belongs to their shorter titles and this one is 140px of text in a 64.6px box
  however the kebab is placed. 56px is the sum that makes title and kebab fit without overlap,
  so the fix reaches events of roughly 75 minutes or more. A shorter chip has nowhere to put
  the kebab and keeps the reserve.

  What remains is therefore a short, narrow chip with actions: a 30- or 60-minute event sharing
  its column. The options for it all cost something and none is obviously right: show the kebab
  only on hover or focus (fails a touch reader, and the chip is a `grid` cell whose hover is not
  a given), or do not render it at all below some width (which makes `actionsEnabled` a request
  rather than a guarantee and silently removes the only route to the consumer's actions).
  Accepting it is the current position, and it is defensible: the chip is a hit target, and the
  detail lives behind the kebab.

- **`Textarea` overruns its container by 26px, and it is the only React component left that
  does.** `Calendar`'s chip was one — measured overrunning its day column by 12px and fixed by
  opting that one element into `border-box` — and the spec that produced that fix asked
  whether any other component sets a percentage `width` on a padded box and has the same latent
  overrun. Three candidates read that way in the source:
  `frameworks/react/components/forms/textarea/Textarea.jsx:25`,
  `frameworks/react/components/forms/select/Select.jsx:11` and
  `frameworks/react/components/navigation/menu/Menu.jsx:59`, each `width: '100%'` on an element
  carrying its own horizontal padding and a border.

  **Measured, and only one of the three is real.** On
  `frameworks/react/components/forms/RadioTextarea.card.html` at its declared 720×340, the
  `<textarea>` computes `box-sizing: content-box` and its border box lands **26px** past its
  parent's content edge — exactly its 12px of padding a side plus its 1px border a side. On
  `frameworks/react/components/forms/Forms.card.html` at 700×660 the `<select>` computes
  `border-box` and overruns by **0**; on
  `frameworks/react/components/navigation/MenuPagination.card.html` at 720×200, with the menu
  opened, every item `<button>` computes `border-box` and overruns by **0**.

  **The reason the other two are safe is the UA stylesheet, not anything Arena wrote**, which
  is why reading the source alone gets this wrong: Chromium's UA stylesheet declares
  `box-sizing: border-box` for `<button>` and `<select>`, and does **not** for `<textarea>` or
  `<input type="text">`. That is also why `Input.jsx` has always had to opt in explicitly and
  `Select.jsx` never did. Depending on a UA default is a thin guarantee — it is not part of
  any spec Arena controls — but it is the *current* behaviour, and the entry records which
  claim rests on it.

  `Textarea` is left unfixed on purpose. The general answer is the repo-wide
  `box-sizing: border-box` reset that the `Calendar` spec put out of scope: it would fix this
  and probably several things nobody has measured, and it would silently change the rendered
  width of every padded, explicitly-sized box in three framework layers. That is a system
  change with its own spec, not a rider on a Calendar fix. Related and adjacent: *The Tailwind
  layer is border-box; React is content-box*, in section 3, whose table this same measurement
  pass found to be wrong in several rows for the same UA-stylesheet reason.


## 2. Where the rest of the debt lives

Each of these is a record with its own stale-entry rule: an entry that no longer
matches a real violation fails the gate that owns it. Read the entries, never a
count written here, which would drift.

- **Section 3 of this file** — the layer divergences, which used to be a separate
  `components-divergences.md` and are the largest single record here. Every behaviour
  difference between the React and Angular layers, with its reason and whether it is
  expected to converge; structural divergences first, then per-component. Its opening
  admits the cost: no layer is the authority for component behaviour, so a divergence
  cannot be a defect. `contracts/behaviour/*.json` supersedes that claim — the pattern is
  the authority, and a component's gap against it is a defect or a declared exception —
  and the per-component entries predate that layer and await migration into
  `.behaviour.json` bindings.

  **The migration has a fourth bucket nobody has named a destination for.** Of the
  per-component entries, about a third are behaviour that migrates into `exceptions`; a
  few are API and belong with the contracts; and several are per-component *rendering*
  divergences — `DataVisuals`' units, UnauthCard's hand-duplicated panel classes, SideNav
  being described three times — which are neither behaviour nor API. Those stay as prose
  alongside the structural half.

  **A migration that deletes a cited section without redirecting the citation breaks it**,
  so measure the citing set rather than trusting a list; a list of it was carried in two
  places once and both were wrong in **both** directions, naming a citer that cites
  nothing and omitting two that quote a section each. The command, now that the sections
  live here:

  ```bash
  grep -rn "DOUBTS.md" --include='*.json' --include='*.ts' --include='*.md' \
      --include='*.jsx' --include='*.mjs' . | grep -v node_modules
  ```

  Keep only the hits that quote a section **by name** — those are the ones a deletion
  breaks. A citation naming the file alone survives any edit to it.
- **`scripts/check-dimension-literals.mjs`** — `EXEMPT` (a literal that is the
  true value at its site: a runtime data-to-pixel projection, a stacking context
  scoped to one container, the visually-hidden idiom) and `PASSTHROUGH`. Its two
  known blind spots — a kebab-case SVG attribute, and Angular's `[style.x]`
  binding form — are **not** in the script's own header; they are documented in
  the `check:dimensions` paragraph under *Architecture* above, which is the only
  place they are written down. **An `EXEMPT` key carries a file path, so a layer
  that moves invalidates every key naming it** — the same three entries have been rekeyed
  twice, to `frameworks/angular/components/charts/ChartInternals.ts` in the structure
  refactor's batch 2 and to `frameworks/angular/DataVisuals.ts` in batch 3, which moved that
  module to the layer root and renamed it.
  That is loud rather than silent, because a stale exemption fails this gate; but
  it also means a key here is a cross-file claim of the kind this section's own
  rule is about, and the paired suite asserts on the map by name, so the rekey is
  a change to two files.
- **`scripts/check-manifest-states.mjs`** — `EXEMPT` (a state delegated to a
  composed child, or a deliberate Angular-only accessibility addition) and
  `SOURCE_OVERRIDES` (the manifest-to-component mapping is not one-to-one).
  `SOURCE_OVERRIDES`' values are file paths and carry exactly the same rekeying
  liability: `Tag` now resolves to
  `frameworks/angular/components/display/tag/Tag.ts`.
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

## 3. Divergences between the framework layers

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

### Structural divergences — these hold across the whole Angular layer

#### An Angular primitive host-binds its root; a React component renders a wrapper

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

#### The carve-out: a root that must be a specific element is not host-bound

`activity-feed`'s root must be a real `<ul>` with `<li>` rows, or a screen reader stops
announcing a list. `<arena-x>` is a custom element and cannot be made one by binding
classes to it.

**The rule, stated generally:** host-binding targets elements that exist *only* to carry
styling. When the root must be a specific semantic or interactive element, keep that
element and do not host-bind. The carve-out keeps its own entry below with the
component-specific detail; this is the rule it is an instance of. The display-utility
guard still applies and still passes.

**Converges:** no.

#### The Tailwind layer is border-box; React is content-box

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

**React** sets no such rule anywhere in `contracts/design/`, `contracts/design-generated/` or `styles.css`, so every React
component is `content-box` — the CSS default — unless it opts in itself, **or unless the UA
stylesheet already made that element border-box** (see the correction below, which is the
mechanism several rows of the table further down get wrong). Only five opt in explicitly:
`Input.jsx`, `Button.jsx`, `Spinner.jsx`, `ConfirmDialog.jsx` and `CalendarEvent.jsx` each set
`boxSizing: 'border-box'` locally; every other component that is not already border-box by UA
default is content-box. `CalendarEvent`'s is the newest and the only one with no Tailwind
counterpart to agree with — it opted in to fix a measured 12px overrun of its own day column,
not to converge with anything.

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
| `Select`'s `field` height | ~~42px (`--dz-ctl-h`=40 + 2×`--bw`)~~ **measured 40px** | 40px (`h-ctl-h`, border included) |
| `Switch`'s `track` | ~~44×26 outer, 40×22 content~~ **measurement pending; the track is a `<button>`** | 40×22 outer, 36×18 content (`w-10 h-5.5 p-0.5`, padding included) |
| `Toast`'s `root` | 375px outer (`w-85`=340 content + 2×`px-4`=32 + `--bw`=1 right + `--bw-strong`=2 left) | 340px outer (`w-85`, border and padding included) |
| `Pagination`'s `nav`/`page` | ~~52×36 outer~~ **measured 34×34 on `nav`** | 34×34 outer (`h-8.5 min-w-8.5`, border and padding included) |
| `Spinner`'s `circle` | **agrees** — 14×14, 20×20, 32×32 outer at sm/md/lg | same, 14×14 / 20×20 / 32×32 |
| `Menu`'s `panel` | 214px min outer (`--sp-1`×50=200 min content + 2×`--sp-1`×1.5=12 padding + 2×`--bw`=2) | 200px (`min-w-50 p-1.5 border`, both included) |
| `Button`'s `root` | ~~42px tall at `md`~~ **measured 40px** | 40px (`h-ctl-h`, border included) |
| `IconButton`'s `root`, ghost only | ~~34/42/50 at sm/md/lg~~ **measured 32 at `sm`** | 32/40/48 (border included) |
| `Dialog`'s `panel` | 482px (`--sp-1`×120=480 + 2×`--bw`) | 480px (`w-120`, border included) |
| `SegmentedControl`'s `segment` | **agrees** — 28/34 tall at sm/md | same; the height axis carries no padding and the width is auto |

**CORRECTION — five of those rows are wrong, and the reason is the UA stylesheet.** The table
was derived by reading each source and applying "React declares no `box-sizing`, therefore
content-box". That inference is invalid for a form control: **Chromium's UA stylesheet declares
`box-sizing: border-box` for `<button>` and `<select>`**, so a React slot rendered as one of
those elements is border-box whether or not Arena says so, and it agrees with the Tailwind
layer instead of diverging from it. Measured in headless Chromium on the components' own card
pages, at their declared viewports:

| Slot | Element | Table claimed | Measured |
|---|---|---|---|
| `Button`'s `root` | `<button>` | 42px tall at `md` | **40px** |
| `IconButton`'s `root` | `<button>` | 34px at `sm` | **32px** |
| `Select`'s `field` | `<select>` | 42px tall | **40px** |
| `Pagination`'s `nav` | `<button>` | 52×36 outer | **34×34** |

`Switch`'s `track` is the fifth: it is the `<button>` at `Switch.jsx:31`, not a `<span>`, so
its declared `40×22` is an outer size and the row's `44×26` is wrong by the same mechanism —
**and so is the thumb-inset paragraph derived from it below**, which reasons from a 22px
content box the element does not have. It is listed as pending rather than measured because no
probe was pointed at it.

`SegmentedControl`'s `segment` row says the two layers "agree" and gives the reason as "the
height axis carries no padding and the width is auto". The conclusion is right and the reason
is not: segments are `<button>`s, so they would agree regardless.

**The rows that stand** are the ones whose slot is a `<span>` or a `<div>`, which carry no UA
`box-sizing`: `Checkbox`'s `box`, `Radio`'s `ring`, `Toast`'s `root`, `Menu`'s `panel`,
`Dialog`'s `panel`, and `Spinner`'s `circle` (which agrees for the reason given — its own
explicit opt-in).

**This is open debt, not a finished correction.** The four measurements above are real; the
`Switch` row was classified from its source and never measured; and no systematic re-derivation
of the whole table has been run. Whoever re-derives it should measure rather than read, because
reading is exactly what produced the error. Note also that "React agrees here" now rests on a
UA default that no specification Arena controls guarantees — thinner ground than an explicit
`boxSizing`, and an argument for the repo-wide reset the *Open item* below already names.

`Switch` carries no border at all — `p-0.5` alone is enough to reproduce the same
divergence *where the element is not already border-box*, which is why the rule above is
stated for padding and not just border. **The `Switch` illustration itself no longer holds**:
its track is the `<button>` at `Switch.jsx:31`, so the UA stylesheet already makes it
border-box and there is no subtraction to cascade. The reasoning this paragraph used to carry
— that React's track has 2px of slack inside a 22px content box after centring the 18px thumb,
for a 4px inset against Tailwind's 2px — assumed a content box the element does not have, and
is retained here only as the shape of the argument, not as a measurement of `Switch`. Neither
the track nor the thumb has been re-measured.

`Toast`'s `root` is the largest divergence in the layer so far by a distance: React's
content-box outer width is `w-85` (340px content) plus both horizontal paddings
(`px-4` = 16px a side = 32px) plus its two mismatched border widths (`--bw` = 1px on the
right and top/bottom, `--bw-strong` = 2px on the left) = 375px, against Tailwind's 340px
border-box outer — a 35px, ~9–10% divergence. It is not a `size-*`-style square target,
but the rule draws no such exception: an explicit size combined with border or padding
diverges either way, and `Toast` combines it with both.

`Pagination`'s `nav` (the prev/next arrows) and `page` (a single-digit page number) repeat
the same shape at a smaller scale, and on two axes at once because the slot pairs a fixed
height with a `min-width`, each carrying its own padding and border — **or they would, if the
slot were not a `<button>`.** React's outer was derived here as 52×36: `h-8.5`/`min-w-8.5`
(34px content on both axes) plus `px-2` (8px a side, 16px total, added to width only) plus the
`--bw` border (1px a side, 2px total, added to both axes) — width 34 + 16 + 2 = 52, height
34 + 0 + 2 = 36 (there is no vertical padding). **That derivation is wrong**, and the `nav`
measures **34×34** in Chromium: the UA stylesheet makes a `<button>` border-box, so the
declared 34 is the outer figure on both axes and `px-2` is carved out of the width rather than
added past it. Tailwind renders the same 34×34 for the same reason. The two layers agree on
this slot; see the correction above the table.

Four **elements** — not four components — agree because their React source opts into
`border-box` at that element: `Input.jsx:48`'s field, `Button.jsx:85`'s spinner span,
`ConfirmDialog.jsx`'s require-text input and `Spinner.jsx:33-38`'s circle all set
`boxSizing: 'border-box'`. Read "because", not "only because": the correction above shows that
several more elements agree without any opt-in, because the UA stylesheet already made them
border-box. Four is also no longer the count of opt-ins — `CalendarEvent.jsx`'s chip is a
fifth, and it has no Tailwind counterpart to agree with, so it appears in no row of the table. The distinction still matters — **the opt-in
is per-element, so `Button`'s spinner agreeing tells you nothing about `Button`'s root** —
but the example this sentence used to give was itself wrong: the root was said to set no
`boxSizing` and therefore to diverge by 2px, and it measures 40px, agreeing, because it is a
`<button>`. Per-element reasoning is right; "no opt-in, therefore content-box" is what is not.
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

#### Animation CSS is compiled once for Angular, injected per component in React

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

#### ActivityFeed is the Angular primitive that does not host-bind its root

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
(`contracts/api/components/ActivityFeed.json`), whose members are `label`, `items` and `busy`. The `style` prop
and `{...rest}` spread that once lived only on the React side were removed when the
component was brought under contract — which is what makes the consequence above the
whole story rather than half of it. A consumer attribute still lands on the inert host
here, and neither layer offers a second route to the styled `<ul>`; that follows from
the no-host-bind decision, not from anything the contract could restate.

**Converges:** no. This is the correct shape for a primitive whose root must be a real list
element, per the carve-out rule stated above.

#### The Angular layer has no Button primitive

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

### Per-component divergences

#### ConfirmDialog — the require-text input loses its focus ring in React

> **The accessibility half of this entry is closed, and plan 8C4 closed it.** This section used to
> be titled *"ConfirmDialog — Angular is accessible, React is not yet"* and recorded that React
> asserted `aria-modal="true"` over a free-roaming focus, with no accessible name, no trap, no
> restore and no Escape. All of that is now met in both layers:
> `frameworks/react/UseDialogModal.js` is a deliberate port of
> `frameworks/angular/FocusTrap.ts`, `ConfirmDialog.title` is required and guarded in
> both layers with `aria-labelledby` pointing at it, and `ConfirmDialog.behaviour.json` declares
> `exceptions: []` in both layers against the `alertdialog` pattern — the single exception it used
> to retain, `roles.element`, was never a defect but a catalogue gap, closed by adding the pattern
> the component already implements rather than by changing the component.
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
a design choice and not a forced one — see section 1's entry on the seven files that
still justify a testing strategy by the retired limitation. **It no longer stands alone, and this
is the first of those seven to gain a real-tree sibling rather than a rewrite:**
`ConfirmDialog.compliance.test.ts` renders `<arena-confirm-dialog>` through TestBed and proves
focus-on-open, both trap boundaries, Escape and restore-on-close against the rendered component,
so the helper suite and the render suite now say different things instead of one standing in for
the other. **Tested how (React):**
`frameworks/react/components/feedback/Behavioural.dom.test.jsx` and
`frameworks/react/components/feedback/DialogModal.dom.test.jsx`, which render the real
component. Both layers are in `check:compliance`'s `COVERED` — `ConfirmDialog:react` and
`ConfirmDialog:angular`.

#### ErrorState — RESOLVED: both layers announce themselves

> **This entry is closed.** React's `ErrorState.jsx` sets `role="alert"`, matching
> `arena-error-state`'s host-bound one. Both bindings read `exceptions: []` and
> `AlertTones.dom.test.jsx` renders the React one.

**Why it mattered:** an error surface can mount without a page reload — a failed fetch swapping a
loading state for an error in place — and a sighted user sees it instantly while a screen reader
user got nothing, because nothing announced the mount. `role="alert"` is the correct, narrow tool
for exactly that: an unprompted, important status change.

**What the fix cost, and it is the part worth keeping:** one attribute, and the inversion of a test
that asserted `doesNotMatch(/role="/)`. That assertion existed to PIN the defect, which is the
mechanism this layer is built on — a defect nobody can quietly stop describing. It also means the
React layer carried a one-attribute accessibility gap for as long as the exception described it
accurately, which no gate would ever have escalated: `check:behaviour` is a coverage claim and
never an accessibility one.

**Not the same precedent as `Alert`:** React's own `Alert.jsx` already set
`role={tone === 'danger' ? 'alert' : 'status'}` and Angular's `Alert.ts` mirrored it exactly, so no
divergence there motivated this one.

#### Skeleton — the circular variant's announcement, RETIRED as a divergence

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
caught either, in either direction. See section 1's entry for the class and the
change-time command.

#### Toast — a critical error interrupts in React and is queued in Angular

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

#### Onboarding — the scrim is a sibling in React and the host in Angular

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

#### Onboarding — the modal contract, RETIRED as a divergence

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

#### Onboarding — no icon, on either layer

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

#### BulkActionBar — a destructive action is bordered and hovers in `--danger-soft`, React only recolors the text

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

#### CommandPalette — Angular is an accessible combobox, React sets no roles at all

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
files section 1 records as still citing the retired limitation in their own
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

#### CommandPalette — running a command does not close the palette in Angular

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

#### PageHead — behaviour matches React; the measurement helper is shared

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

#### DataVisuals — the visually-hidden style carries its units in Angular

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

#### BarChart — the charts are the layer's styling exception, and they state it in objects

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

#### LineChart — the crosshair measures against the SVG, not against the overlay rect

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

#### DoughnutChart — the host IS the flex row, where React wraps one inside

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

#### DoughnutChart — the legend is keyboard-reachable in Angular, not yet in React

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

#### AppLogo — React guards against a missing `mark` or `name`; Angular has no counterpart, and needs none

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

#### ActivityFeed — the tone dot is filled, matching Tag's own dot and Avatar's presence carve-out; not a divergence

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

#### UnauthCard — behaviour matches React; the brand/footer gate is a projection query

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

#### UnauthCard's `panel` hand-duplicates Card's surface classes

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

#### SideNav is described three times, and only the colours agree

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

### How to add an entry

When you find a behavioural difference between layers:

1. Decide which behaviour is correct on its merits — not by which layer is older. The token layer
   settles anything about values; nothing settles behaviour automatically.
2. If one layer is simply wrong, fix it and add no entry.
3. If both are defensible, or one leads and the other has debt, add an entry here with the reason
   and whether it is expected to converge.

## 4. What the READMEs do not say

The normative documents state rules. This section carries what those rules cost, what the
gates behind them cannot reach, and the incidents that produced them — the material a
present-tense document cannot hold without becoming a history of itself.

### `check:api` asserts three of its five rules

`bun run check:api` makes five assertions: coverage, form, agreement, the derived rules, and
generated drift. Two of the five derived rules are **authoring rules the audit applies, and
no gate asserts them**:

- **R2 is not machine-checkable.** "Who draws it" is a fact about intent and markup
  ownership, not about a declaration. A contract can name a slot for content Arena draws,
  and the gate agrees with it.
- **R3 is not machine-checkable.** Whether a parameterised slot fills a cell or replaces a
  row is a fact about the rendered tree, not about the member list. `check:compliance` is
  the layer that can see a rendered tree, and it does not read contracts. No shipped
  contract declares a parameterised slot — verify with `grep -rn '"params"'
  contracts/api/components/`, whose only hit is `Input.validate`'s `functionInput` — so R3 is
  both unchecked and unexercised. That is not a mitigation: the moment a contract declares
  one, the rule is exactly as unverifiable as this says.

Two further gaps are in the gate's own reach rather than in human judgement, and both are
recorded at greater length under *Known debt*: `default` is documented in the contract format
and read by nothing, and React's checked surface is its `.d.ts` rather than its `.jsx`.

### The Tailwind layer's three pitfalls each shipped before they were written down

`frameworks/tailwind/README.md` states P1, P2 and P3 as rules. Each exists because the
defect shipped, and in two cases shipped twice — which is the evidence that prose alone did
not prevent the second occurrence, and why `check:states` was built for P1's shape.

- **P1 — invented states.** A state modifier appeared in a manifest whose mirrored React
  component implements no hover or focus anywhere. `Tabs`' `selected: false` branch carried
  a `hover:` copied from `SegmentedControl`'s near-identical variant; `Pagination.manifest.json`
  then shipped three of them (`nav`'s and `pageOther`'s `hover:bg-base-200`, `pageCurrent`'s
  `hover:shadow-2`) in the very next batch, one commit after the rule was first stated.
  `Pagination.jsx` has no `useState`, no `onMouseEnter`/`onMouseLeave`, and no hover branch.
  `check:states` (`scripts/check-manifest-states.mjs`) now catches this shape; it says
  nothing about whether a manifest's colours, sizes or slot structure still match the
  component it mirrors, which stays open.
- **P2 — hover on a disableable slot.** `:hover` matches a disabled element's pseudo-class
  in Chrome and Firefox — they suppress the *events* a disabled control would dispatch, not
  selector matching. `Pagination.manifest.json`'s `nav` slot shipped the exact case: a
  disabled prev/next arrow, rendered dim and `not-allowed` by design, tinting on hover
  anyway.
- **P3 — border-box is a table entry, not a paragraph.** Three passes over this rule got the
  numbers wrong the same way each time: by reasoning in prose and dropping padding from the
  computation. Padding carves out of a border-box total exactly the way a border does, and a
  prose summary is where that term quietly goes missing.

**P3's rule cites a table that has moved.** It required both numbers to go into
`components-divergences.md`'s border-box table; that file is now section 3 of this one, and
the table lives under *The Tailwind layer is border-box; React is content-box*.

### Tailwind cannot express Button's split transition timing

React gives `background` the fast duration and `box-shadow` the slower `--dur-mid`, because
each CSS property gets its own line in the `transition` shorthand. `Button.manifest.json`'s
`duration-[var(--dur-fast)]` cannot: Tailwind's `duration-` utility sets one
`transition-duration` for the whole `transition-property` list, and there is no second
`duration-` utility to layer on for just one property. Expressing the split would mean
writing the whole `transition` declaration as one raw arbitrary **property**
(`[transition:background_var(--dur-fast)_var(--ease-out),…]`, no `utility-` prefix) — a
fourth bracket shape outside the three that layer documents. **Primary's hover shadow
arrives about 100ms early against React**, left undone rather than reached for quietly.

### An Angular input named after a native attribute leaves the native attribute behind

Angular writes a static attribute to the DOM during the creation pass whether or not it also
matches an input, so `<arena-page-head title="Projects">` leaves a real `title` on the host
and the browser draws a tooltip over the whole header. **Nine primitives are affected** —
`title` on `alert`, `chart-card`, `confirm-dialog`, `empty-state`, `error-state`, `page-head`
and `unauth-card`, and `name` on `app-logo` and `avatar`.

`confirm-dialog` is the worst case by a distance: its host is the fixed full-viewport scrim,
so `<arena-confirm-dialog title="Delete?">` paints a tooltip over the **entire viewport**
while the dialog is open.

Binding the input (`[title]="…"`) avoids it, and so would a host binding of
`'[attr.title]': 'null'` — which, if taken, must be applied to all nine at once rather than
one primitive at a time, or the layer becomes unpredictable. **Not yet done.**

### `booleanAttribute` is not equivalent to a native boolean attribute

Every boolean input in the Angular layer is a signal `input(false, { transform:
booleanAttribute })`, so `<arena-alert dismissible>` resolves to `true`. The equivalence to a
native HTML boolean attribute stops there: `booleanAttribute` special-cases the literal
string `"false"` as `false`, where a native attribute (`<details open="false">`) stays open on
any present value regardless of what it says. Binding remains the clearer form in a
component's own prompt docs.


## 5. Knowledge that used to live in code comments

Arena's position is that the best comment is the one not written: a method should carry its
own context through its name. Scripts and tests keep one header of at most ten lines;
everything else carries none.

Most comments removed under that rule were re-expressible as names, and were renamed rather
than recorded. What lands here is the residue — **a fact about the world outside the file**,
which no identifier can encode: a measurement, a vendor's behaviour, a pinned version, a
constraint of a test environment, or an incident that explains why a check exists at all.

Entries are grouped by the file whose comment they came from.

### `scripts/validate-palette.mjs` — vendored, and its thresholds are calibrated

Vendored from the `dataviz` Agent Skill (`scripts/validate_palette.js`) on 2026-07-16 and kept
verbatim except for the CLI filename guard and usage string. **Do not "improve" the thresholds
or the CVD matrices**: they are calibrated to the Machado-Oliveira-Fernandes (2009) severity-1.0
model, and changing one silently invalidates the measured numbers published in the design
specification. Upstream is the authority — **re-vendor rather than patch**.

### `scripts/check-material.mjs` — the incident that produced it, and its two blind spots

`frameworks/angular/theme/arena-material.css` maps Angular Material's custom properties onto
Arena's tokens, and **both halves of that mapping fail silently**: a property name Material does
not read applies nothing, and a `var()` naming no Arena token resolves to nothing. Neither
throws, neither logs, and `check:dimensions` does not scan `.css`. When Material renamed its
tokens, **24 of the bridge's 34 names went inert and nothing noticed for a whole major version.**

Two things the gate still does not do, stated because a gate implying more coverage than it has
is how the bridge rotted in the first place:

- **It checks that a name EXISTS, not that it is the right name for the element being styled.**
  The bridge once set `--mat-list-list-item-container-{shape,color}` on the active nav item; both
  names exist, but `mat-nav-list` reads `--mat-list-active-indicator-{shape,color}` and the
  `container-*` pair belongs to `mat-selection-list`. Catching that needs to know which selector
  reads which property.
- **It reads property NAMES only and never the SELECTORS they sit in** —
  `.mat-mdc-unelevated-button`, `.mat-form-field-appearance-outline`, `.mdc-list-item--activated`
  and the other 12 of the bridge's 15. All 15 were hand-verified present in Material 22, so
  nothing is broken today, but **a selector rename upstream would kill the bridge by the
  identical silent mechanism, with this gate still green.**

Its existence oracle reads **both** places a Material custom property can be named, because
measured against the pinned 22.0.5 neither alone is the whole set: 102 names appear only in
`prebuilt-themes/*.css` (71 `--mat-sys-*`, 27 `--mat-app-*`, three component-level names, and
`--mdc-icon-button-state-layer-size`), while 17 appear only in `fesm2022/*.mjs` (the
`--mat-focus-indicator-*` family, `--mat-dialog-transition-duration`, the animation multipliers).
Reading only `fesm2022` was never wrong in practice and its error direction was the safe one — it
could over-reject a live name, never silently pass a dead one — but it was widened anyway,
because the hazard was second-order: someone "fixing" a red gate by deleting a legitimate
property rather than doubting the oracle, which is how the silent hole reopens.

### `scripts/check-duplicate-constants.mjs` — what it catches is three of five

The drift it exists for: `CAT_SLOTS`, `CHART_HEIGHT` and `PAD` were declared identically in both
layers' chart-internals modules. Those three would have failed the day the second one was
written. **`W` and `EDGE`, in the two `Onboarding` implementations, would not have** — both were
declared inside a function body rather than at module level, and the regex is `^`-anchored under
`/m`, so it only matches column-zero declarations.

**What it does not catch**, stated so nobody reads it as more: a design value declared in ONE
layer only, and a constant declared inside a function body in EITHER layer. Module-level-in-both
is a narrower shape than "duplicated", and the two layers do not share an idiom for where a
design number lives — React writes it inline in a function body, Angular names it at module level
— so a real cross-layer duplicate escapes whenever either side uses the inline idiom. Deciding
whether a bare number in a JS object is a design value needs judgement no scanner has, which is
also why `check:dimensions` cannot reach these. This gate takes the decidable half.

### `scripts/build-vendor.mjs` — React 18.3.1 is CJS-only, and Bun's export detection is partial

React 18.3.1 ships CommonJS only — its `exports` map has no ESM condition and no `.mjs` — but a
demo page's `<script type="importmap">` needs real ES modules to point a bare specifier at.
`Bun.build --format=esm` converts CJS to ESM, but **its static export detection only sees a
module's `exports.x = y` assignments when they sit at the CJS wrapper's top level**. React's
assignments sit one level deeper, inside an IIFE the source uses to scope its DevTools-hook
variables — so the raw Bun output for all three entries is `export default <cjsExports>;` and
nothing else, and every `import { useState } from 'react'` a demo page makes would resolve to
`undefined`.

The fix appends one `export const <name> = <default>.<name>;` per key the installed package
actually exports, read with `createRequire` rather than hand-listed, so the export list cannot
drift from the pinned version.

`react-dom/client` and `react/jsx-runtime` are bundled with `react` left **external**: React must
stay a singleton. Inlining a second copy would give the page two independent React instances
sharing no internal state, which breaks hooks and context in ways that are silent until they are
not. `NODE_ENV` is baked in as `"development"` via `define`, which also erases the production
branch entirely, so no bare `process.env` reference reaches the browser.

### `scripts/check-radius-tokens.mjs` — why `rounded-full` is the one class it names

Arena's whole radius vocabulary is wired in `frameworks/tailwind/Theme.css` to a `--r-*` token via
`--radius-*`, and every other Tailwind default in a cleared namespace (`--radius-*: initial`)
emits no rule at all — which is what makes it visible to `check:tailwind`'s "every class emits a
rule" assertion. **`rounded-full` is the one exception**: Tailwind v4's core plugin defines it as
a static `border-radius: calc(infinity * 1px)`, not sourced from any `--radius-*` custom
property, so clearing the namespace does not touch it. It keeps emitting a rule, and
`check:tailwind` has nothing to say about it, because that gate only asks "does this class
resolve", never "does it trace to an Arena token". `check:coverage` is the mirror image of the
same blind spot: it asserts every TOKEN reaches a utility, never that every utility traces to a
token.

For any element small enough that `calc(infinity * 1px)` and `--r-pill` (999px) both round it
into a full circle or pill — true of every current use, all well under the ~1998px point where
the two would visibly differ — `rounded-pill` is the token-backed equivalent.

**Scope, deliberately narrow, twice over.** It is not the general "does every Tailwind class in a
manifest trace to an Arena token" gate: most of Tailwind's own defaults already produce no rule
once Arena's theme clears their namespace, so distinguishing a structural utility that
legitimately carries no token (`flex`, `items-center`) from a bypassed one would mean enumerating
Tailwind's entire core utility set by hand. And it scans **manifests only** — not the
`*.card.html` specimens, not the compiled `Utilities.css` — so a specimen typing `rounded-full`
onto an element directly passes unseen. Nothing in the tree does that today, and a specimen is
supposed to take every class from `classesFor()` anyway, but neither of those is this gate
enforcing it.

### `scripts/lib/behaviour-compliance.mjs` — the tri-state, and the false-OVERCLAIM it corrected

Three return values, and the third is the point. `true` and `false` are a verdict; **`null` means
"no single element can decide this"** — focus behaviour, key handling, the auto-dismiss claim and
every conditional state are behaviours, not attributes, and a suite must assert them by acting on
the tree rather than by reading it.

**`null` is never a fallthrough.** Every requirement key is in exactly one of `DECIDABLE` or
`BEHAVIOURAL`, and a key in neither **throws**. It used to fall off the end and return `null`,
which was silent in both directions: a typo in a pattern file (`"states.chekced"`) returned
`null`, `comparePattern` told the suite author to declare it behavioural, the author did, and from
then on the misspelt requirement passed forever while the real one was never checked at all.

**Requirement semantics key off the requirement KEY and the PATTERN NAME, never off the
requirement's value**, and this is the correction that matters most. The values in
`contracts/behaviour/*.json` are human prose written for a reader — `navigation`'s `roles.element`
is a whole sentence, `button`'s `roles.label` is a list of three alternatives. Comparing
`roleOf(el) === String(value)` made a real `<nav>` fail its own pattern and reported false
OVERCLAIMs against seven components that were correct. **That is worse than a missed defect: the
cheapest way to silence a false OVERCLAIM is to write a fabricated exception into the binding**,
which corrupts the exact debt record this layer exists to keep honest and inverts the gate's
meaning. The prose stays prose; the machine reads `ELEMENT_ROLE` and `LABEL_ACCEPTS_TEXT`.

**Why a real DOM rather than the text scan that was proposed.** A text scan was built and measured
against the whole tree before this file existed. It reported **60 of 118 true "claimed met"
requirements as unmet** — a native `<button>` satisfies `roles.element` and `keyboard.Space` while
leaving nothing to grep — and **wrongly retired 18 of 94 live exceptions**, because an attribute
on the wrong element, in three of four branches, or behind a ternary reads identically to a
correct one. A rendered DOM resolves all three. **Do not re-propose a scan**, including as a cheap
tier beneath the grid rule: a measured 51% false-unmet rate is worse than an honest hole.

### `scripts/lib/api-surface.mjs` — three known blind spots in a regex `.d.ts` reader

Reading a `.d.ts` by regex is a real limitation. The reader has three outcomes, and the third
must never happen silently: a shape in the vocabulary is classified; a shape it knows and R4
forbids becomes `{form: 'platform'}` and is reported; **a shape it cannot read at all throws.** A
member the reader cannot parse is a gate FAILURE, never a member silently missing from the list.

Three blind spots, dormant against today's corpus and deliberately not fixed:

- `splitTopLevel` tracks bracket nesting only and is **not string-literal aware** — a bracket
  character inside a quoted string at depth zero would misalign the depth count.
- `braceBody` is a plain bracket counter with the same gap one level up: no quote or comment
  awareness.
- The index-signature carve-out in `classify` (`/^\{\s*\[/`) **tests only the literal's FIRST
  member**, so a mixed literal such as `{ label: string; [k: string]: unknown }` slips past it and
  is classified as `platform` rather than thrown.

A quote-aware scanner is a larger change than any of the three was written to make.

### `scripts/check-all.mjs` — why it is not an `&&` chain, and how it picks a test command

Every gate runs unconditionally: one failing does not stop the rest. Each step's output streams
live (child stdio is inherited, not buffered), and the summary prints once every step has
finished. Every gate is spawned as `process.execPath <script>.mjs`, so the runner behaves
identically under `bun` and under `node`.

**The test-suite step has no such uniform invocation**: `bun test` is a bun-specific subcommand
with no `node:test` equivalent, so the runner picks the command for the runtime it is itself
executing under — `bun test scripts/` when `process.versions.bun` is set, `node --test` over the
discovered `scripts/*.test.mjs` files otherwise.

### `frameworks/react/test/Preload.js` — the day it cost to find

`react-dom` decides **once, at its own module evaluation**, whether the browser supports the
`input` event: `canUseDOM` gates the block computing `isInputEventSupported`, and when that block
does not run the flag latches false and React falls back to its legacy change detection — a
polyfill that starts watching a field on `focusin` and re-reads its value on `keydown`/`keyup`.
Under that fallback **a dispatched `input` or `change` reaches an `onChange` handler zero times,
silently**: nothing in the failure names the cause.

Registering happy-dom from `Harness.jsx`'s module body is too late, because ES imports are
evaluated before any body statement. **Registering it from a separate ES module imported first
does not work either, and that is the part worth writing down, because it is the obvious next
thing to try**: bun evaluates `react-dom` ahead of it anyway. Both were settled by instrumenting
`react-dom`'s own `canUseDOM` in `node_modules` and logging it, then restoring the tree: with the
harness registering, `canUseDOM = false`; through the preload, `canUseDOM = true`,
`isInputEventSupported = true`, and a dispatched `input` reaches React.

Nothing is ever unregistered: the DOM suites are their own `bun test` process, and the process
exiting is the teardown.

### `frameworks/react/UseDialogModal.js` — why every clause excludes `tabindex="-1"`

The focusable selector spells `:not([tabindex="-1"])` on **every** natively-focusable clause
rather than once at the end, because a selector list is OR'd: `button:not([disabled])` alone
would pull a real `<button tabindex="-1">` back into the tab order. `CalendarEvent`'s kebab
button is the concrete instance.

### `frameworks/react/components/navigation/side-nav/SideNavInject.jsx` — keep it a `.jsx`

The extension is load-bearing. `check:dimensions` scans `.jsx`/`.ts`/`.tsx` and **never opens a
`.js`**, and the helper's `indentFor()` produces a governed `padding-inline-start` — so renamed to
`.js` it would sit outside the gate entirely and could return a bare `'12px'` with every gate
green.

### `frameworks/angular/ProjectionMarkers.ts` — the naming rule inverted

The `arena-` prefix on a projection marker used to be mandatory and is now forbidden, because
`contracts/api/README.md`'s binding table would otherwise declare a member named `arena-x`.

### `frameworks/angular/test/TestbedEnv.ts` — one document and one TestBed per process

`bun test` runs every file a single invocation matches in ONE process, and both happy-dom's
document and Angular's `TestBed` environment can each be claimed only once:
`GlobalRegistrator.register()` throws if already registered, and `TestBed.initTestEnvironment()`
throws the second time it runs across files that share a process.

`ensureDom()` and `useTestEnvironment()` are plain `if (claimed) return` guards, **not a reset**.
`TestBed.resetTestEnvironment()` was tried and measurably does not work, because
`BrowserDomAdapter.makeCurrent()` installs a process-wide DOM adapter on the FIRST platform
creation that nothing resets — a second per-file document would render into a document the adapter
no longer points at, and `getComputedStyle` reading the wrong document was the observed failure.

### `scripts/check-card-viewports.mjs` — why the content height takes a max of two metrics

Neither metric alone is the content bottom, and each is the true one in the case the other
misses.

`lowestDescendantIncludingOutOfFlow` scans every element's `getBoundingClientRect().bottom`, so
it sees an **absolutely-positioned overlay** — which contributes nothing to `body`'s own auto
height. What it cannot see is a **trailing collapsed margin**: `getBoundingClientRect` never
includes an element's own margin, and the padding term is `body`'s `paddingBottom`, not any
child's margin.

`bodyBorderBoxBottomIncludingCollapsedMargin` sees exactly that margin, because `body`'s auto
height already folds in the bottom margin of its last in-flow child — collapsing margins stop
that margin escaping through `body`'s own box **specifically because** `body` carries bottom
padding, which every card harness's body does via `Specimen.css`, so the margin lands inside
`body`'s border box rather than past it. What it cannot see is the out-of-flow overlay.

Taking the max covers both. Removing either term reopens one case silently, since the gate only
fails on `clip`.

### `frameworks/react/components/display/calendar/Calendar.jsx` — the scroll area's two paddings

The scroll box below the day headers carries `paddingTop` and `paddingBottom` of
`calc(var(--sp-1) * 2)`, and they are not spacing. Each hour label is **centred on its own
line**: it is positioned at `calc(<y>px - var(--sp-1))`, so the first overhangs the top of the
grid by 4px and the last overhangs the bottom. Without the pads the first is clipped by the
header strip above it and the last by the scroll box, whenever the calendar is left to size
itself.

The day header cell's own `paddingBottom` used to sit directly above this one, doubling the
gap to 16px. It had no such constraint and was removed; this one must stay. Measured after the
removal, on `Calendar.card.html` at 1100×620: the header strip is 37px tall rather than 45px,
and the first hour label still sits 4px below the header's bottom border and is fully drawn.

### `frameworks/react/components/display/calendar-event/CalendarEvent.jsx` — stretch is what makes the ellipsis real

The chip's body button sets `display: flex; flexDirection: column` and **deliberately sets no
`align-items`**, so it stays `stretch` and the title span is as wide as the button rather than
as wide as its own text. That is what makes the span's own
`white-space: nowrap; overflow: hidden; text-overflow: ellipsis` engage at all.

This was got wrong once, and the correction is the fact worth keeping: the title's own
nowrap/hidden/ellipsis does **not** survive the chip's clip being lifted on its own. Under
`align-items: flex-start` the span is sized to its content, and with `nowrap` its min-content
width **is** the full text width, so its own overflow never engages and the chip's clip was
doing the whole job — measured at 56px of title spilling into the neighbouring day column the
moment the panel opened. Adding `align-items` to that button, in any value but `stretch`,
silently reintroduces a hard cut.

It is also why the fix for the title running under the kebab is a reserved `paddingRight` on
the chip rather than a width on the span: reserving space leaves the layout mode alone. The
kebab is absolutely positioned, and an absolutely positioned element is laid out against its
containing block's **padding box**, so `right: 0` puts it inside the padding band and growing
that band is exactly what reserves its room. `KEBAB_RESERVE` is
`calc(var(--dz-ctl-h-sm) + var(--bw) * 2)` because the kebab is an `IconButton size="sm"` in
its default `ghost` variant — that token plus a `--bw` border a side — so the reserve
re-densifies with the control it reserves for. Measured: the reserve computes to 34px and the
kebab's border box to 32px, because a `<button>` is border-box by UA default and its border is
therefore carved out rather than added; the 2px difference lands as a gap between the title and
the button, which is harmless. **The reserve is conditional**: a chip narrow enough to lose its
time label and at least `calendar.actions-below-min-h` tall anchors the kebab to its
bottom-right instead and reserves nothing, because there is then no lateral collision to
prevent. The two rules cannot both fire: stacking requires the time label to be suppressed, and
the residual band in section 1 is defined by the label still drawing. See *The Tailwind layer is border-box; React is content-box* in
section 3 for that mechanism and for the rows of its table it invalidates.

### `frameworks/react/components/display/calendar-event/CalendarEvent.jsx` — the chip is border-box, so `Calendar`'s injected size is its outer edge

`Calendar` injects `top`, `height`, `left` and `width` into every chip, and all four read as
statements about the chip's **outer** edge — "the column, less a gutter", "the event's own time
span". The chip sets `boxSizing: 'border-box'` so they mean that. Under the `content-box`
default the browser added the chip's 12px of horizontal padding and its 2px left border past
the injected width, and a full-width chip overran its day column by 12px; the same addition on
the other axis made every chip 8px taller than its own time range.

The consequence to remember is on the height: because the floor is now an **outer** height,
`Calendar`'s `max(calc(var(--sp-1) * 6.5), rawH)` reads 26px, not 18px. 26px is the value that
leaves the shortest chip rendering at exactly the size it rendered at before the change
(18px content + 8px padding), and it is the floor that keeps a 12px `--dz-text-sm` title line
inside a chip whose content box is now the declared height minus 8px. Lowering it re-clips
short chips; there is no gate that would notice. `Calendar`'s grid suite walks the cells and
asserts the keyboard, not the geometry of a chip inside one — the retired hand-test rule is not
what leaves this uncovered, and covering it would need a real browser's layout.

The alternative — subtracting `CalendarEvent`'s padding and border inside `Calendar`'s own
`calc()` — was rejected rather than overlooked. It re-encodes one component's padding inside
the other, so the two would have to move together forever, against the division of labour the
pair is built around: `Calendar` owns *where* a chip goes and `CalendarEvent` owns what it
*looks like*.

### `frameworks/react/components/display/calendar/Calendar.jsx` — why the Escape clause carries no guard

`onGridKeyDown`'s last clause is a bare `if (e.key === 'Escape')`, with no test of what the
target is, and narrowing it is how the one defect this handler has ever had was introduced.

It used to read `e.key === 'Escape' && isEventNode(t)`, where `isEventNode` compared the target
by identity against the values of `eventRefs`. Those values are each chip's **focusable body** —
the inner `<button>` that `setFocusable` attaches to — and a chip's kebab is never among them.
So Escape from the kebab matched nothing at either level, since `CalendarEvent`'s own handler
catches Escape only while its panel is open. The key was dead there, and the only route back to
the grid was ArrowLeft to the chip body and then Escape. Driven in real Chromium, not inferred.

The guard is unnecessary because the clause is already unreachable for anything else. The
branch above it returns for every `role="gridcell"` target, and the handler is bound to the grid
itself, so what reaches this line is a focusable descendant of the grid that is not a cell —
a chip body, or a kebab. **An open panel's controls cannot reach it**: `CalendarEvent` calls
`e.stopPropagation()` on Escape while `panelOpen`, which is what makes Escape close the panel
and return focus to the kebab rather than jumping straight out to the hour cell. That
`stopPropagation` is load-bearing for this clause's correctness, and removing it would turn one
Escape into two behaviours at once.

No gate covers any of this, and `Calendar`'s grid suite does not change that: it walks the
cells and asserts arrow navigation, the roving tab stop, Home and End. Enter into an
intersecting event chip and Escape back out are a clause of `CalendarEvent`, not of the `grid`
pattern's eight requirements, so no assertPattern verdict rests on them. The verification is
`CalendarEvent.prompt.md`'s checklist, driven in a real browser.

### `frameworks/react/components/display/calendar/CalendarInternals.js` — why `showsTime` takes a slot and not a width

`showsTime(chipHeight, slotWidth)` compares against a chip's **column share** — the day column
divided by how many overlapping events share it — and not against the chip's own outer width or
its content box. Both of the closer quantities would have been wrong to use.

The content box would require `Calendar` to know `CalendarEvent`'s padding, its border and its
kebab reserve. That is the coupling rejected when the chip's box model was fixed, and for the
same reason: `Calendar` owns where a chip goes and how big it is, `CalendarEvent` owns what it
looks like. The chip's outer width would require `--sp-1` as a number in JS, to subtract the
gutter that the injected `width: calc(100%/cols - var(--sp-1))` already accounts for.

So the 18px between a slot and the content inside it is folded into the token's value instead,
and `calendar.time-min-w` is 100px rather than the label's own measured 78.02px. **The
consequence is that the token's value is not independent of `CalendarEvent`'s padding** — it is
78.02 + 4 + 12 + 2, rounded up to the 4px scale — so a change to the chip's padding or border
makes the threshold quietly conservative or quietly short. Nothing checks that. It is the price
of keeping the arithmetic on the side of the boundary that owns the layout.

**A second consequence is that all three of the group's tokens had to land in one commit.**
`check:script-tokens`' orphan rule is *flagged and imported by at least one layer*, so a
script-flagged token with no JS consumer yet fails the gate — and a CSS use does not count.
`calendar.gutter-w` is the sharp case: it is rendered as `var(--calendar-gutter-w)` and would
look like a self-contained refactor, but its JS consumer is the width term itself, so it cannot
be landed ahead of it. Any plan that sequences a script-flagged token before its consumer is
wrong about this gate.

### `frameworks/react/components/display/calendar/CalendarInternals.js` — the stacking threshold is a sum of measured parts, and nothing checks it

`calendar.actions-below-min-h` is 56px because a chip needs 4px of padding, a 15px title line,
a 32px kebab and 4px of padding again to stack them without overlap — 55px, rounded up to the
4px scale. **Three of those four numbers are not tokens.** The paddings are
`calc(var(--sp-1) * 1)` and would move with `--sp-1`; the kebab is `--dz-ctl-h-sm`, which is
26px under compact density rather than 32px; and the title line is `normal` line-height on
`--dz-text-sm`, which is not a token at all and changes with the font.

So the threshold is conservative under compact density and would go quietly short if the chip's
padding grew or its title font did. Nothing checks the sum: `check:script-tokens` holds the
token against its CSS twin, and `check:dimensions` never sees a comparison. What catches a
regression here is the by-hand checklist in `CalendarEvent.prompt.md`, in a real browser,
because `Calendar` binds the `grid` pattern and can have no render suite. Measured after the
change, the margin is 15px: the title's bottom sits that far above the kebab's top on a 66px
chip.
