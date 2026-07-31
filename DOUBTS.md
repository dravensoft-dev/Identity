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

**And an entry is deleted when its debt is paid.** This file records what is wrong,
incomplete or unverified *now*; a fixed defect is none of those, and a paragraph explaining
how it was fixed turns the record into a changelog, which `CHANGELOG.md` and the commit log
already are. What survives a payment is only what is still true: a standing hazard, a
decision and why it was taken, or a limit nothing has closed. If a lesson generalises, it
stays as a rule in the present tense rather than as the story of the batch that learned it.

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
  now shipped four times in four different mechanisms, and each time the surviving evidence was a
  plausible-looking green line of output.
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

  **The fourth is the limit case of the shape: a gate that ran zero times.** `scripts/check/core/check-text-contrast.mjs` existed, was complete, and passed — and
  was named in neither `package.json` nor `check-all.mjs`'s gate array, so `bun run check` never
  invoked it and `bun run check:text-contrast` answered *Script not found*. Nothing was red,
  because nothing ran. The prose had already started leaning on it: a `Switch` divergence
  in section 3 argued that no new gate entry was owed for its knob glyph because
  *"`check:text-contrast` already gates at 4.5 in its `primary`/`primary-content` row"* — true of
  the file's contents and false of the repository's behaviour, which is the gap this class is
  about. `check:ramp` was one step short of the same thing: present in the gate array, absent
  from `package.json`, so the `CLAUDE.md` line instructing a reader to run it after a
  `contracts/design/` edit named a command that did not exist. Both are wired now.
  **The generalisation is that a gate has two existences** — the file, and every place that
  invokes it — and only the second one is worth anything. Adding a gate means adding it to
  `package.json` **and** to `check-all.mjs`; a reader citing a gate as evidence should confirm it
  is in the array before trusting the citation.
- **The two script-readable gates leave a structural hole between them, and the sharper rule
  narrows it rather than closing it.** `check:script-tokens`' orphan rule is *imported by at least
  one layer*, and that is deliberately loose: a token a component needs is legitimately
  one-layer-only until the other layer builds that component. `check:duplicate-constants` does not
  close it either — it fires only when **both** layers declare a module-level named numeric
  `const`, so a layer that imports the token has no declaration left to pair with, and the layers
  have opposite idioms (React writes design numbers inline in function bodies, Angular names them
  at module level) so the symmetry it needs is usually absent.

  **`shadowedTokenProblems` is the sharper rule**: for each flagged token, every layer either
  imports it or contains no module-level numeric `const` equal to its value. It caught
  `DoughnutChart.ts`'s `RING_INSET = 8` on its first real opportunity — a ratchet built with
  nothing to catch, catching one.

  **What it still cannot see is a layer encoding a token's value in something other than a
  module-level `const`.** `Onboarding.manifest.json`'s `w-80` is exactly that shape: a Tailwind
  utility resolving to 320px, which is `--onboarding-width`. `check:arbitrary` cannot see it
  either, because it is a core utility rather than a bracket. Closing that means mapping the
  spacing scale back to pixels and comparing, and nothing does.

- **Two behaviour families were proposed and not shipped**, and the reasons
  should be re-read before anyone adds them. `debounce` is speculative:
  `CommandPalette` filters a local array synchronously and `ResizeObserver`
  already coalesces, so debouncing either adds latency and removes nothing.
  `limit.results` would introduce a palette result cap that does not exist
  today, which is a product decision with a UX consequence rather than a
  tokenization of an existing value.
- **A claim about code this repository does not own is unfalsifiable here by construction, and
  the durable fix is owning the code.** This is the lesson three token families and one
  delegation record all arrived at independently, and it is worth stating once rather than
  rediscovering.
  `frameworks/angular/BehaviourDelegated.json` once asserted what a third-party library's controls
  did — that a control applied one role rather than another, that a tooltip's show-delay defaulted
  to zero — with no record of the version verified against. `check:behaviour` verifies that a
  declaration names a pattern and a requirement that exist, never that a claim about somebody
  else's package is still true, so the whole suite stays green while the reason strings quietly
  become false. Two mitigations were proposed — pin the verified version, gate every `dressedBy`
  path — and neither is what closed it: **writing Arena's own control did.**
  The same shape settled the `delay`, `dismiss` and `limit` tokens. Each could have been delivered
  to Angular through a third-party configuration seam; each was delivered by writing the primitive
  instead, which also brought the component inside `check:dimensions`, `check:compliance` and the
  Angular arm of `check:api` — reach no amount of default-options wiring could have bought.
  **Any future delegation reopens this entry exactly as written.**

- **A component name written into ANOTHER file's prose is a cross-file claim no gate checks,
  and it rots silently while every gate stays green.** This is a standing hazard rather than a
  list of defects, and it was diagnosed the hard way: `Table.behaviour.json`'s `focus.roving`
  reason cited `Skeleton` twice in two consecutive batches and was wrong both times, in
  **opposite** directions — first as proving that the schema could not scope a requirement to a
  variant (falsified when 8C9 built `cases`), then, after 8C9 rewrote the clause in place, as
  demonstrating that remedy (falsified when 8C10 fixed `Skeleton` and flattened its binding).
  Nothing failed either time. `check:behaviour` validates that a binding names a real pattern
  and real requirements; and while `validateBinding` (`scripts/lib/arena/behaviour-contracts.mjs`) does
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
  `scripts/lib/arena/behaviour-contracts.mjs`, `scripts/lib/arena/behaviour-contracts.test.mjs` justified a test
  by a case that no longer exists, and `SideNavSection.jsx`'s header named **four** components —
  `Tag`, `Skeleton`, `Table`, `Pagination` — as carrying one limit, two of which had left it,
  **and** called that limit unfixable a batch after `cases` fixed it. So read **"8C10 corrected
  six sites" as a sweep of the command's reach, never of the class**: the count was complete
  against a query that could not see most of the tree, which is
  the same mistake as describing a file you grepped rather than read, one level up. The six, for
  the record, were `Table`'s and `Tab`'s reason strings (both exemplars **removed** rather than
  re-pointed at another name, because a replacement name is just the next thing to rot),
  `Toast`'s `divergesFromReason` (rewritten as explicit **history**, the one form that cannot go
  stale), two doc comments in `scripts/lib/arena/behaviour-contracts.mjs` — one past-tensed so
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
  **The rest is done, and the reading that resolved it is recorded in the spec's own Plan D
  section:** a path is *normative* when it tells a reader where something IS, and the fifteen of
  those are corrected; a path inside a `>` block or inside one of the per-batch test-count records
  near the end of the file is *history* and is correct as written, because rewriting it would make
  the record lie. That distinction is the reading, and it is why this was never a find-and-replace.
  **What stays open is the class of defect rather than this instance:** nothing checks a path in a
  dated process document, so the next structural move re-creates the problem in whatever specs are
  unexecuted then. The React pre-move paths listed below are in the historical set under that
  reading and are deliberately left.
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
  the suite first. `Tab` is **not** one
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
- **Converting ONE layer to cases surfaces every place the two layers were quietly different.**
  A flat binding on the far side can no longer silently agree with a cased one, so the cross-layer
  check starts reporting differences nobody was looking for. Expect more as bindings are
  converted; the mechanism is the durable part and it is not a fact about any component.

  **Two of those differences taught opposite lessons, and both are worth carrying.** One was a
  **mis-triage**: two positions written up as "both defensible" turned out to be two readings of a
  component whose own purpose settled it, and the cheapest test was whether the same layer already
  contradicted itself elsewhere — it did, three branches out of four. The other was **correctly
  undecided**: neither layer was wrong about a control one of them did not own, so no change to
  either layer's own code could have closed it, and the tell was exactly that. When a divergence
  looks undecidable, ask which of the two it is before writing "both are defensible".

  `divergesFrom` is the escape hatch for the second kind. Run `grep -rl divergesFrom frameworks/`
  for the live set rather than trusting a figure here.

- **A comment citing a sibling by its filename is unchecked by anything, and a rename discharges
  or falsifies it in silence.** A refactor rewrites every **import specifier**, which a compiler or
  a test runner checks — but a bare filename in a sentence is not one, so a reader who greps it
  finds nothing. Two commands, one per layer, because the two spell a stale name differently:

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
  citing file can live in any layer**, which a React-scoped search cannot see by construction. And
  the negative lookbehind `(?<![A-Za-z0-9.])` is what makes the result readable: without it every
  lowercase *secondary* segment matches its own filename and the output roughly quadruples.
  **Neither command carries a `| grep -v` and neither should**: `CHANGELOG.md` is excluded by not
  being in the path list, which is the only safe way, since a content filter on `-n` output drops
  hits by their *text*.

  Read each hit — both over-report, because a lowercase stem before an extension is also how these
  files legitimately name a *component directory*, a still-correct history clause, a synthetic test
  fixture, or a genuinely deleted file. Count by reading, not by piping to `wc -l`. **It is a
  citation swap and nothing more**, which makes it the cheapest class here to close and the easiest
  to close wrongly: a name is only worth rewriting once you have opened the file it now names and
  confirmed the sentence around it is still true.

  **A second shape belongs to this entry and is not a filename at all: a comment asserting a
  property of its own DIRECTORY.** Eleven React suites once opened with *"This directory renders
  with renderToStaticMarkup and has no DOM"*, which was a property of one directory and became a
  property of nothing when the suites moved beside their components — three of the eleven were
  outright false. **The rule is a property of the FILENAME, never of the directory**; any sentence
  stating it as a directory property is one sibling away from being false. A path sweep cannot see
  this shape, and neither can a grep for renamed tokens. It is found by reading the header of a
  file you are already editing.

  **And a rule that deletes a class of text pays every debt written in that text, silently.** The
  comment sweep enforcing *"the best comment is the one not written"* removed headers that
  contained several of this file's open entries, with no interest in whether the sentences inside
  them were true. Re-run the commands before planning work against any entry whose subject is
  prose; expect no commit that says the debt closed.

- **`Tooltip`'s `roles.describedby` is guarded at the two detectable ends, and the third is
  still open.** `aria-describedby` is added by `cloneElement` onto the consumer's own child,
  which only works when that child is a single element that accepts and forwards props. Two
  of the three failing shapes now THROW: a bare string, and — the trap — a **fragment**, for
  which `React.isValidElement` is true, so the clone succeeded and the attribute reached
  nothing at all, in silence. `Menu.trigger` had the identical hole and took the identical
  guard in the same programme.

  **The third shape was called undetectable here and it was not.** A component that accepts
  the prop and drops it is invisible to `cloneElement` — nothing distinguishes it from one that
  forwards — but it is perfectly visible in the DOM, and that is where both components now
  write. `Tooltip` and `Menu` set the attribute on the resolved node in an effect; the clone
  stays, because it is what puts the attribute in the server-rendered HTML before hydration.

  **It was not hypothetical: it was live on both demo pages**, and only a by-hand check in real
  Chromium found it. Arena's own components forward the props they DECLARE and drop the rest,
  since the API contract flattened their `{...rest}` spreads — so `<Button>` as a trigger got
  `onClick` and no `aria-haspopup`, and `<Button>` inside a `Tooltip` left the bubble pointing at
  nothing. Every suite assertion had used a raw `<button>`, the one shape a clone reaches, which
  is why the fixtures now mimic that split on purpose.

  **What is left unpromised is narrower:** a child that renders no DOM node of its own at the
  wrapper's first position, or one that re-parents its content, is still outside what an effect
  reading `firstElementChild` can reach. `Tooltip.prompt.md`'s Do/Don't remains where a consumer
  is warned.

  **This was the live instance of the one conditionality level `cases` did not close**, and
  the level is now empty of live instances rather than solved. `Tag` and `Skeleton` left it
  by other routes — one expressed as cases, one by having its defect fixed. `Table`'s
  `focus.roving` turned out to be misfiled: the clickable card row is `TableRow`'s own case,
  not a clause of `Table`'s binding. `Pagination`'s `roles.label` was designed away by making
  the member required. And this one is guarded at both detectable ends. **The level is real
  and will refill**: a requirement holding only for some consumer inputs is a property of the
  implementation, not a string in a binding, so there is no grep for it — finding the next one
  means reading an implementation against its binding.

- **A BEHAVIOURAL requirement with no suite to pin it is unfalsifiable, not merely unverified.**
  The live list is empty today and it will refill; what follows is why that matters. The last four were
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
  asks; on the React side it also reaches `vendor/ReactDomClient.generated.js`, a committed
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
  against `BEHAVIOURAL` in `scripts/lib/core/behaviour-compliance.mjs`, rather than any list
  written here; and read the other side — which verdicts a suite actually declares — with
  `grep -rho "'[a-z]*\.[A-Za-z]*': \(true\|false\)" --include='*.dom.test.jsx'
  --include='*.test.ts' frameworks/react/ frameworks/angular/ | sed "s/: .*//;s/'//g" |
  sort -u`, since an enumeration of
  that has gone stale here twice. Neither the deletion and restore of the React DOM test
  directory nor its later disappearance changed what is unpinned; none of them was ever
  what caused it.
- **A barrel gap is invisible to every gate that is not looking for it, and one hid a real
  name collision for as long as it lasted.** `frameworks/angular/components/display/index.ts`
  exported six of its eleven primitives; `badge`, `card`, `table`, `table-row` and `table-cell`
  were missing, so `check:angular` — whose `tsconfig.check.json` declares
  `files: ["./index.ts"]` — never compiled them under `strictTemplates`, and no adopter could
  import them from the layer root. Nothing was red, because `tsconfig.test.json` globs the tree
  and compiled them anyway. **What the gap was hiding is the part worth keeping:**
  `TableState` and `CalendarState` both exported an interface named `GridCursor`, with
  different shapes (`{row, col}` and `{day, hour}`), and completing the barrel turned that into
  the `TS2308` it always was. Calendar's is `CalendarCursor` now. Closed by
  `frameworks/angular/test/Barrels.test.ts`, which walks the chain and carries `PRIVATE` and
  `ROOT_PRIVATE` for the modules a barrel deliberately withholds — so the next omission is a
  failing test rather than a silent one. **The remaining hole is that no equivalent exists for
  `frameworks/tailwind/`**, whose manifests are reached by glob rather than by a barrel, so
  there is nothing there to be missing from.

- **The last thing in this file no gate can ever close: whether the explicit `aria-live` on `ProgressBar` and `Spinner` causes any real announcement.**
  Both carry `aria-live="polite"`, and the `progressbar` pattern requires it because that role —
  unlike `status` — carries no implicit live region. What is verified is exactly that: the
  attribute is present, and a render suite says so. **What is not verified is the thing the
  attribute is for.** A live region is specified to announce changes to the region's *content*;
  `ProgressBar` reports progress by mutating the **attribute** `aria-valuenow`, and its visible
  percentage text sits in a sibling element *outside* the region. Whether a screen reader
  announces an attribute-only change in a polite region varies by AT and has not been tested here
  with a real one. So the claim in the batch that added it — that `ProgressBar` "announces value
  changes where before it announced nothing" — is stronger than the evidence: what changed for
  certain is that the widget satisfies its pattern.

  **Two things this entry deliberately does not do.** It does not argue for removing the
  attribute: the role genuinely has no implicit politeness, and for `Spinner` — whose label IS
  inside the region — the announcement is the ordinary content case. And it does not propose a
  gate, because **no gate can run a screen reader**, which is a different kind of limit from the
  one the focus-trap interior turned out to have. That one was a limit of the harness and fell to
  a browser this repository was already driving. This one is a limit of what software can observe
  about assistive technology it does not control.

  **The procedure, so it is a job rather than a wish.** With NVDA, JAWS and VoiceOver in turn:
  open `frameworks/react/components/feedback/progress-bar/ProgressBar.card.html`, drive the value
  through several updates, and record whether anything is spoken. If it is not — the expected
  answer — the fix is to move the percentage text inside the live region, or to announce at
  thresholds rather than continuously, and the choice between them is a product decision about
  how chatty a long upload should be.

  **The same session should answer the other question no assertion can**: whether the names this
  repository now requires are USEFUL. The debt-payment programme made `seriesLabel`,
  `ProgressBar.label`, `Table.label` and `SegmentedControl.ariaLabel` required and guarded
  precisely because a present name is never checked for being a good one. Two charts on one page
  must not announce identically; nothing but a person listening can confirm they do not.
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
  **That is now stated as a settled position rather than as an open item.** Neither is a fact
  about source text, so no reader of source can decide either: R2 asks who DRAWS the content,
  which is intent, and R3 asks what the rendered tree looks like, which only `check:compliance`
  can see and it does not read contracts. A gate for either would have to be a renderer that also
  read the contract, and building one to decide two authoring rules is not worth what it would
  cost. The honest form of the claim is the one `contracts/api/README.md` carries: **five rules,
  three of them machine-checked, and the other two exactly as strong as the audit that applied
  them** -- not a gap waiting to be closed.
  `TableColumn.render` was named here as the member where R3 would first matter; it never
  did, because the per-item convention removed it rather than modelling it, and the
  reader refuses that shape on the convention's authority and not R3's. **No shipped
  contract declares a parameterised slot** — verify with `grep -rn '"params"'
  contracts/api/components/`, whose only hit is `Input.validate`'s `functionInput` — so R3 is
  today unchecked and also unexercised. That is not a mitigation: the moment a
  contract does declare one, the rule is exactly as unverifiable as this entry says.
  **What the gate does read is both surfaces, not one.** `check-api.mjs` opens the `.jsx` beside
  the `.d.ts`, so a restored `{...rest}` spread fails and a `spec.default` the implementation
  contradicts fails with it. The comparison refuses one direction on purpose: a contract default
  with no destructuring default is **not** reported, because the default may legitimately be
  applied downstream — `BarChart.slot` declares `1` and neither layer destructures one, because
  `resolveColors` does `catColor(slot ?? 1)`. A source-reading gate cannot see that, and reporting
  it would be false positives dressed as findings.

- **`roles.label` resolves its reference, and what stays open is the CONTENT at the far end of it.** This entry recorded the opposite until batch 8C8: `roles.label` never reaches the
  `ATTRIBUTE_FOR` branch 8C7 taught to resolve, and `hasAccessibleName()` returned `true` the
  moment `aria-label` **or** `aria-labelledby` was non-empty, so a dangling `aria-labelledby`
  read as a name. That is closed. `hasAccessibleName(el, acceptsText, resolveId)` in
  `scripts/lib/core/behaviour-compliance.mjs` now asks whether there is a NAME rather than whether
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
  existed: a name that is **present** is never checked for being **useful**, which is the reason
  `Table.label`, `SegmentedControl.ariaLabel`, `ProgressBar.label` and the charts' `seriesLabel`
  are required and guarded rather than defaulted — the only remedy there is, and it moves the
  judgement to the consumer rather than removing it. Its sibling limit — that a resolved reference is no proof it
  landed on the RIGHT element, because a pattern cannot say what *kind* of element a reference
  must reach — is recorded in the 8C7 entry above and is untouched by this batch. And all of it
  reaches a binding only through a suite that renders it, so a binding outside `COVERED` gains
  nothing from any of it.

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

- **`SideNavCollapsible` is a stack of independent disclosures, and the reason the
  cheap half of the fix is not taken is the useful part.** With arbitrary nesting the rendered
  structure looks exactly like a tree, and APG's treeview would demand `aria-level` on every node,
  a roving tab stop and four-direction arrow navigation. None of it is designed, none of it is
  bound, and the refusal lives in `contracts/behaviour/disclosure.json`'s **own description**
  rather than only in the binding — so every future component binding this pattern inherits the
  refusal and a reader of any one binding meets it.

  The concrete cost is real and stands: in a deeply nested sidebar a screen-reader user is told a
  group is expanded and is told nothing about how deep it sits, how many siblings it has, or which
  of them they are on, and reaching an item four levels down means Tab through every trigger and
  every visible link above it.

  **The obvious partial fix does not work, and that is why this closes as a decision rather than
  as a half-measure.** Adding `aria-level`, `aria-setsize` and `aria-posinset` looks free — they
  are descriptive rather than interactive, so they would cost none of the treeview keyboard model.
  But `aria-setsize` and `aria-posinset` are meaningful only on an element with a role that is a
  member of a set (`treeitem`, `listitem`, `option`), and the trigger is a plain `<button>` inside
  a `nav` landmark. Adding them without the role produces attributes assistive technology has no
  reason to read: **the appearance of a fix, which is worse than the honest gap**, because the
  next reader would find the attributes and conclude the cost had been paid.

  So the trade stands: what shipped is what a nav landmark full of links actually is, and
  production sidebars ship it. It is fully compliant with the pattern it chose. **Choosing that
  pattern is the debt, and adopting `treeview` — the whole model, keyboard included — is the only
  thing that pays it.**
- **Nothing checks the NAMING rule inside `contracts/`, only its shape.** `check:contracts`
  encodes what `contracts/README.md` states about the SHAPE, clause by clause. It says nothing
  about what anything is called, and the
  capital-initial naming rule is declared for the framework layers and does not reach
  `contracts/`, so `button.json` and `palette.dark.json` keep lowercase stems. That is
  **correct**, for two different reasons and neither is "identifiers stay lowercase" in
  general: `button.json` is a pattern's own identifier, the literal value a binding writes
  into `"pattern"`, so renaming it breaks every binding citing `"button"`. `palette.dark.json`
  is a token source `build-tokens.mjs`'s hardcoded `FILES` table names literally
  (`source: 'palette.dark.json'`) — true of all eleven sources, so all eleven are identifiers
  in that sense, but **not** because the stem decides its own output CSS name: `icon.json`,
  `component.json` and `density.compact.json` all emit into `spacing.generated.css`, and `layering.json`,
  `chart.json` and `behaviour.json` all emit into `effects.generated.css`, so at most five of the eleven
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

- **Three ways a document goes quietly false, each learned the hard way.** A moved
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

- **A chip that carries a kebab can still wrap its time label, in a band about 32px
  wide, and the band is accepted.** `showsTime()` compares a chip's column share against one
  threshold and does not ask whether the chip has actions. A chip without them has a content box
  of its share less 18px; one with them has its share less 46px, because the kebab's 34px reserve
  comes out too. So the kebab-safe threshold is 124.02px where the plain one is 96.02px, and
  `calendar.time-min-w` is set at the plain one.

  Measured on `Calendar.card.html`, driving the viewport and reading the container beneath it —
  the container is the viewport less the card's 24px body padding a side, and `--bp-md` is
  compared against the **container**, so week view only begins at a 768px container. At a 782px
  container a day column is 120.16px, `Release window`'s chip is 116.2px, and its time label wraps
  onto **two lines**; at an 812px container the column is 125.16px, the chip 121.2px, and the
  label fits on one. The arithmetic boundary is a container of about 800px. So the band is roughly
  **a 768px to an 800px container**, in week view, on a chip that has actions.

  **The alternatives were weighed and both are worse.** Setting the threshold at the kebab-safe
  value suppresses the label on every ordinary chip through that band and well past it, which
  loses information in the common case to serve the rare one. Making the threshold kebab-aware
  puts `CalendarEvent`'s 34px reserve back inside `Calendar` — laundered through a second token,
  but still a number that silently goes wrong if the reserve ever changes. What survives in the
  band is the pre-existing behaviour rather than a new defect, and it survives on purpose.
- **A narrow chip under 56px tall has almost no title left, and that is accepted.** Reserving the kebab's 34px band is what stopped the title being drawn underneath it,
  and on a full-width chip it costs nothing. On a chip sharing its slot — `cols: 2`, about 78px
  outer — it leaves a **36.58px** content box, which renders `Client review — Northwind` as
  `Clien…`.

  **A tall one no longer has this problem**: at 56px or more the kebab moves to the chip's
  bottom-right, the reserve is dropped, and the title gets the whole **64.6px**. Measured, its
  truncation falls from **74% to 54%** — not to the 18% its kebab-less neighbours show, because
  that figure belongs to their shorter titles and this one is 140px of text in a 64.6px box
  however the kebab is placed. 56px is the sum that makes title and kebab fit without overlap, so
  the fix reaches events of roughly 75 minutes or more.

  What remains is a short, narrow chip with actions: a 30- or 60-minute event sharing its column.
  **Both remaining options cost more than the gap.** Showing the kebab only on hover or focus
  fails a touch reader, and the chip is a `grid` cell whose hover is not a given. Not rendering it
  below some width makes `actionsEnabled` a request rather than a guarantee and silently removes
  the only route to the consumer's actions — a member that sometimes does nothing is worse than a
  truncated title. Accepting it is the current position and it is defensible on its own terms: the
  chip is a hit target, and the detail lives behind the kebab.
- **`CLAUDE.md`'s ceiling is a standing constraint on every batch, and the way it is bought back
  is always the same.** Measure it the way the gate does —
  `node -e "console.log(require('fs').readFileSync('CLAUDE.md','utf8').length)"` — and never with
  `wc -m`, which this entry used to prescribe: the file was once 60,282 *bytes* against 59,946
  characters, so a byte count read as 282 over a limit the file was comfortably under. `check:docs`
  reads `.length`, which is UTF-16 code units, and it fails hard rather than warning, so an
  overrun surfaces as a red gate at the end of a batch rather than as a decision made calmly.
  **The file reached 59,993 — seven characters of room — and the debt-payment programme's batch 0
  bought about 5,300 back.** The method is the durable part and it is the only one that has ever
  worked: move a layer's own tour into that layer's README and leave the cross-layer rule with a
  pointer. Batch 0 moved the AOT test harness, the one-document/one-TestBed rule and the
  host-bound-root rule into `frameworks/angular/README.md`; the two-invocation mechanism and the
  `canUseDOM` reason the preload is mandatory into `frameworks/react/README.md` (which already
  carried most of both, so `CLAUDE.md` had been duplicating them outright); and compressed the
  four Tailwind gate descriptions to their claims plus a pointer.
  **What spends the budget is a new rule, not a new component.** A batch landing a primitive
  typically moves nothing here, because the file carries no literal count of components — it names
  the `find` that produces them — and describes the per-layer sets by method rather than by number,
  so they shrink and grow together. **What remains as a candidate** is the rest of the
  Angular-layer prose that `frameworks/angular/README.md` already states in more detail, on the
  standing principle that `CLAUDE.md`'s job is the cross-layer rule and not the layer's own tour.

- **`CHANGELOG.md` has the same 60,000-character ceiling and cannot be paid for the same way**,
  because a released entry is a frozen record of what shipped at a tag and is never back-edited.
  It hit the limit at 60,357 characters during the debt-payment programme's batch 0, and the two
  moves available were not equivalent: archiving the released history into a second file, which
  relocates the record without rewriting it, or **emptying `[Unreleased]`**, which is what was
  taken. That section held about 25,400 characters of notes for work already on `main` and not
  yet in any tag — the `.generated.` rename, the untracking of the dev-only build products, the
  `scripts/` reorganisation, the Angular Calendar family — and those notes are gone from this
  file. The record of that work survives in the commits and in this file; what does not survive
  is the release-note prose that would have been renamed to a version heading at the next cut, so
  **whoever cuts the release after 4.0.0 writes those notes from the log rather than finding them
  waiting.** `check-release.mjs` is unaffected: it reads the first *versioned* entry, so an empty
  `[Unreleased]` on top is expected and never a failure. The ceiling will return — `[Unreleased]`
  is the section that grows — and the archive split is the option left when it does.

- **What the Angular demo pages prove, and what a green `bun run check` still says nothing
  about.** `<Component>.card.html` beside each covered primitive runs the real component: `ngc`
  compiles the templates AOT and `Bun.build` bundles that output for a browser, one shared Angular
  chunk across every page, built by `bun run build:angular-demo` and chained ahead of
  `bun run demos`. It is what a suite cannot be: `arena-button`'s `full` variant did nothing —
  the carve-out host is bare, so as a flex item it blockified to shrink-to-fit and the inner
  button's `w-full` measured the shrunk host rather than the row — and no suite could see it,
  because happy-dom has no layout.
  **The pages carry no `@dsCard`**, because their script is git-ignored build output and a blank
  page passes a viewport-overflow check by having nothing to overflow — so Angular primitives get
  no *published* specimen card, and the Tailwind specimen stays the published visual for the
  recipe. `check:angular-demos` is structural only: it proves a page exists, loads its own bundle
  and mounts a zoneless app, never that what it renders is right.
  **A checklist line a real browser can decide belongs in a gate, not in a checklist.** That is
  what `check:cards` and `check:focus-trap` between them took over. What is left for a person is
  what needs their **judgement** rather than their browser: whether a name is a good name, whether
  motion reads as intended, whether a colour carries the meaning it should. Running those is a
  person's job, and a green `bun run check` still says nothing about whether anyone did.

- **A projection marker the consumer forgets to import drops the whole slot in silence, and the
  guard for it had to go OUTSIDE the component.** Every gated `<ng-content select="[x]">` in the
  Angular layer is paired with a `contentChild(ArenaX)` from `ProjectionMarkers.ts`, because that
  query is the only way an `ng-content` slot can report whether anything was projected. The query
  resolves the **directive**, so it finds nothing unless the consumer's own component lists
  `ArenaX` in its `imports` — and with the query null the `@if` never renders, the `<ng-content>`
  is never instantiated, and the projected content vanishes. No error, no warning, no failing
  gate: `ngc --strictTemplates` is happy, because a bare `footer` attribute on a `<div>` is valid
  HTML whether or not a directive matches it. It was found by opening a page, not by reading one:
  `Menu.card.entry.ts` put a whole dialog footer behind a `[footer]` marker without importing
  `ArenaFooter`, and rendered an empty dialog while every suite stayed green.

  **The component still cannot detect it** — it cannot distinguish "the marker was not imported"
  from "nothing was projected", which is the case the query exists for — and that has not
  changed. What has is that every consumer **inside this repository** is now checked:
  `frameworks/angular/test/ProjectionMarkers.test.ts` walks the layer, pairs each marker use with
  the **nearest enclosing** `arena-*` element, and fails when that host gates the slot by a
  `contentChild` query and the consumer does not import the directive. It reproduces the original
  defect when `ArenaFooter` is removed from `Menu.card.entry.ts`, naming the file, the marker, the
  host and the directive.

  **Two refinements were forced by real false positives, and both are the rule getting more
  honest rather than the gate getting quieter.** A first version matched the marker word inside
  an **attribute value** — `label="Every action for this build"` — so values are stripped before
  matching. And it flagged `<button actions>` inside `<arena-calendar-event>`, whose `actions`
  slot is gated by an **input** (`actionsEnabled`) rather than by a query: no directive is needed
  there, so no import is owed. That is the real rule — *"you projected into a slot whose host
  gates it on a query"*, not *"you used a marker attribute"* — and the nearest-enclosing-host walk
  is what expresses it, since `contentChild` reaches direct content only and cannot see a marker
  nested one component deeper.

  **What stays uncovered is every consumer outside this repository**, which is the population the
  original entry was about. A gate here cannot reach an adopter's app; it can only stop Arena's
  own pages from shipping the example. It affects `Dialog`, `UnauthCard`, `Card`, `PageHead`,
  `EmptyState` and `ErrorState` equally.

- **`.gitignore` stops future churn and does not shrink the repository, and `git filter-repo` is
  refused outright.** `.git` was 42 MB when the
  rename landed, and every blob the untracked files ever had is still in history — roughly 1.26 MB
  of current content, rewritten on every component edit and every React bump for as long as it was
  tracked. A rewrite would remove it and **must not happen**: it changes every commit hash, and
  **the plugin is served from tags** (`marketplace.json` → `source.ref`), so every published tag
  would stop resolving to the tree it resolved to when published. That is not a cost to weigh
  against the 1.26 MB; it is a promise already made to anyone who installed the plugin.
  The win claimed for the change is the **rate**, not the size. Anyone quoting a size reduction is
  quoting something that did not happen.
- **`intro/support.js` can never be ignored, whatever the rule says.** Its generator is
  `dc-runtime`, whose source is not in this repository, so a clone cannot rebuild it and the
  infix would promise a `bun run build` that cannot deliver. It is the one file whose header
  says `GENERATED from` rather than `GENERATED by`, and that wording is the only surviving
  signal of the difference.

- **`build-tailwind.mjs` writes one tracked output and one untracked one.** The manifest modules
  are tracked because an Angular `.variants.ts` imports them and `ngc` needs them before the
  test surface compiles; `Utilities.generated.css` is ignored because only specimen pages read
  it. The split is by **audience**, not by provenance, and it is the one place in the repository
  where a single script's outputs are tracked differently. Nothing derives the split — it is two
  entries in two hand-maintained places (`.gitignore` and `UNTRACKED`), tied together only by
  `check:generated` refusing a `.generated.` file that neither claims.


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
- **`scripts/check/arena/check-dimension-literals.mjs`** — `EXEMPT` (a literal that is the
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
- **`scripts/check/arena/check-manifest-states.mjs`** — `EXEMPT` (a state delegated to a
  composed child, or a deliberate Angular-only accessibility addition) and
  `SOURCE_OVERRIDES` (the manifest-to-component mapping is not one-to-one).
  `SOURCE_OVERRIDES`' values are file paths and carry exactly the same rekeying
  liability: `Tag` now resolves to
  `frameworks/angular/components/display/tag/Tag.ts`.
- **`scripts/check/tailwind/check-tailwind-coverage.mjs`** — `EXCLUDED`, every token that
  deliberately reaches no Tailwind utility, with the reason. The gate asserts the
  entry exists, never that the reason is true — so a reason can rot silently, and
  one did: `onboarding-width`'s was written anticipatorily and was false for two
  commits.
- **`scripts/check/arena/check-duplicate-constants.mjs`** — `EXEMPT`, empty today, plus a
  header stating plainly what the gate does not catch.
- **`scripts/check/arena/check-generated.mjs`** — `UNTRACKED`, the four `.gitignore` patterns
  that hide a generated file, with the reason each is dev-only; and `UNMARKED`, the two outputs
  that carry neither the `.generated.` infix nor a header. Both are stale-checked in **both**
  directions: an entry matching nothing fails, and a file matching no entry fails. `UNTRACKED`
  is the weaker half — it restates `.gitignore` rather than deriving from it, so the two can
  disagree about *which* pattern covers a file while agreeing that one does. What cannot drift
  silently is the thing that matters: a payload file falling under any ignore pattern fails,
  because no `UNTRACKED` entry claims it.
- **`scripts/generate/arena/generate-tokens.mjs`** — `load()` reads one source file per call, so a
  DTCG alias cannot resolve across files. Three chart tokens restate `--sp-2` and
  `--sp-4` because of it. The constraint is self-imposed and removable; the fix is
  written on `load()` itself.

## 3. Divergences between the framework layers

Arena's design language is one thing; its framework layers are several. **For component design,
`contracts/design/` and `contracts/design-generated/` are the only source of truth.** A layer that disagrees with the token
layer is wrong, and that is not negotiable.

**Behaviour has an authority, and it is not either layer.** `contracts/behaviour/*.json` settles
it: the pattern is the authority, a component's gap against it is a defect or a declared
exception, and `check:behaviour` names both layers and picks no winner when they disagree. This
section used to open by saying the opposite — *"no layer is the absolute authority for component
behaviour"* — which was true only while there was nothing above the layers to appeal to, and it
survived as a live sentence for several batches after the contract layer removed the condition it
rested on. It is retired here rather than deleted, because a reader meeting a divergence entry
that predates the bindings should know which policy it was written under.

**So what belongs in this section is narrower than it once was: a difference the binding layer
cannot express.** Every component is bound in both layers — count with
`find frameworks -name '*.behaviour.json' | wc -l` against `frameworks/Components.json` — so a
behavioural gap against a pattern is no longer recorded here at all; it is an exception on the
binding, where a render suite can expire it. What is left is the residue no pattern has an
opinion about: which element a layer renders, how a compound family coordinates, where a scrim
sits, what an idiom forces (`cloneElement` against content projection, an `output()` whose
subscribers cannot be queried), and a defect one layer has fixed and the other has not.

A divergence that is not written down is a bug; a divergence that is written down, with its
reason, is a decision. Each entry states: what differs, in which layers, why, and whether it is
expected to converge.

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

**FIXED, and the way the count moved is the lesson.** Every affected primitive clears the
attribute off its own host — `'[attr.title]': 'null'` or `'[attr.name]': 'null'` in the host
block — and `HostClassBinding.test.ts` holds it layer-wide and bidirectionally: a primitive
that takes a `title`/`name` input and does not clear it fails, and so does one that clears an
attribute it takes no input for.

**This entry's count was wrong three times running**, and each version was wrong for its own
reason. It claimed **five**, then **nine** (stale: four `name` inputs landed during Plan D's
own batches 2 and 3 while nobody re-read it), then **fourteen** — and fourteen was wrong the
moment it was measured, because the command used to measure it filtered on
`grep -q "'\[class\]':"`, i.e. on the primitive being **host-bound**. The defect has nothing
to do with host-binding: Angular writes the static attribute during the creation pass whatever
the host does with classes, so `button`, `icon-button` and `checkbox` — three carve-outs with
bare hosts — were affected all along and invisible to the filter.

**The real number is seventeen: eight `title` and nine `name`.** The guard found the last three
within a minute of being written, which is the argument for writing a guard instead of a
command: a command is only as good as the filter its author reached for, and this entry has now
produced a bad filter twice — once excluding host-bound (wrong axis) and once excluding
`*State.ts`, which silently eats `EmptyState.ts` and `ErrorState.ts`, two of the affected
components. **Do not re-derive the set by hand; read what the guard asserts.**

`confirm-dialog` was the worst of them by a distance, and it is why the count was worth getting
right: its host is the fixed full-viewport scrim, so `<arena-confirm-dialog title="Delete?">`
painted a browser tooltip over the **entire viewport** for as long as the dialog was open, not
over a header.

**Two things the fix does not do.** It does not stop a consumer from setting a genuine `title`
tooltip on a primitive that takes no `title` input — `<arena-skeleton title="Loading">` still
works, and the guard's stale direction is what keeps the clearing binding off components like
it. And it does not reach an attribute whose name matches no input at all; nothing does, and
nothing should — Angular composing a consumer's static attribute with the host bindings is the
behaviour that makes `style` and ARIA attributes work on a host-bound primitive in the first
place.

**One existing test asserted the defect as a property** and had to be inverted:
`arena-app-logo: a static "name" attribute satisfies the required input AND stays on the
element`. Both halves were true and only the first was wanted. It now asserts that the input
holds the value and the element does not.

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

#### Animation CSS is compiled once for Angular, injected per component in React

**React:** each animated component injects a `<style>` tag once, guarded by a module-level
`let injected = false`, via `useEffect` and `document.head.appendChild`.
**Angular:** animations live in `frameworks/tailwind/Animations.css` as `@utility` + `@keyframes`,
compiled into the committed `frameworks/tailwind/Utilities.generated.css`.

**Why:** the Angular layer already ships a compiled stylesheet, so a shared file is both cheaper
and statically checkable. `@utility` emits nothing when unused, so an animation costs nothing until
a component references it.

**Same in both:** the `prefers-reduced-motion` answer, which depends on what the motion means —
work-in-progress motion slows rather than stops, decorative motion stops outright, an entrance
keeps its fade and drops its travel, an opacity-only animation needs no clause.

**Converges:** no. Each layer uses its own idiom over the same token values.

#### ActivityFeed was the first Angular primitive not to host-bind its root, and the carve-out set has grown

**The default:** the recipe's `root` slot is bound onto the host —
`host: { '[class]': 'styles().root()' }` — and no wrapper element is rendered. **Count the two
sets rather than trusting a figure here**, because this entry has already gone stale once by
claiming `arena-activity-feed` was alone:

```bash
grep -Lr "'\[class\]':" --include='[A-Z]*.ts' frameworks/angular/components/*/*/ \
  | grep -vE '\.(test|variants|card\.entry)\.ts$|(State|Window)\.ts$'
```

The carve-outs fall into **four** groups and each has its own reason. **The three SVG charts**
(`bar-chart`, `line-chart`, `doughnut-chart`) have no manifest and no recipe at all, so there is
no `root` slot to bind. **The form controls** (`button`, `icon-button`, `checkbox`, `radio`) each
need their own `<button>`, `<input>` or `<label>`, or they forfeit the activation, labelling and
`:disabled` semantics the browser already supplies. **Some keep a specific semantic or
structural element**: `arena-activity-feed` a real `<ul>`, `arena-tabs` a `<div role="tablist">`
with the panels as siblings outside it, `arena-pagination` a real `<nav>`. Every one of them
declares `display: contents` on the bare host, and `HostClassBinding.test.ts` fails any that
does not.

**The fourth group has one member and a reason unlike the other three: `arena-table-row` needs
an inner element to STOP AN EVENT AT.** Its root is neither a required semantic element nor a
native control — a `display: table-row` box would sit on the host perfectly well. What forces
the wrapper is that its contract names the event `click`, and an Angular output named after a
native DOM event is delivered twice: once as the output, once as the bubbled DOM event Angular
also listens for on the host. Measured on this component rather than carried over from
`arena-button`: with the inner element's `stopPropagation()` removed, one pointer click reaches
the consumer **2** times **and a `disabled` row activates**, because the native path never
passes the guard. A host listener cannot fix it — `stopPropagation` does not reach a sibling
listener on the same element, and `stopImmediatePropagation` would depend on which of the two
was registered first. So the rule "host-bind unless the root must be a specific element" has a
second clause now: **or unless the component owns an output named after a DOM event it must be
able to refuse.** `Table.cases.test.ts` asserts the delivery count, so the wrapper cannot be
optimised away without a red run.

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

#### Both layers have a Button, and Angular's is the newer one

**React:** `Button.jsx` is a component, and `ConfirmDialog.jsx` renders `<Button>` for its footer.
**Angular:** `arena-button` is a primitive, in `components/forms/button/`. It renders a real
`<button>` inside a bare host — the carve-out above — and reads the same
`Button.manifest.json` React's Tailwind mirror does.

**Converges:** yes, and this entry stays because two things it recorded are still live.

**The first is that a component predating `arena-button` may still hand-roll its footer**, and a
hand-rolled button must carry the interaction affordances `Button.manifest.json` defines — the gap,
the transition, the hover shadow — or it ships a control with no feedback. That was missed once on
`ConfirmDialog` and corrected. Nothing makes those components adopt `arena-button` now, and no gate
would notice: `check:states` resolves a manifest to its *mirrored* source, never to every consumer.

**The second is a real divergence the port introduced, and Angular is the correct side.** The API
contract names the event `click`, and an Angular output named after a native DOM event gets **both**
an output subscription and a host DOM listener, so a consumer's `(click)` fires twice on every
press. `arena-button` calls `stopPropagation()` on the inner button to make it fire once — measured,
not assumed, in `Button.compliance.test.ts`. The cost is that a click never reaches an ancestor, so
click delegation past an `arena-button` does not work, where React's `onClick` leaves bubbling
intact. Recorded in `Button.prompt.md`. **Every future primitive whose contract names an event after
a native one inherits this** — `TableRow.click` is the next.

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

#### DataVisuals sits at both layer roots, and only one layer's consumers put it there

Moved out of `CLAUDE.md` on 2026-07-30 to make room under its 60,000-character limit. It is a
placement *decision* with no gate behind it, which is this file's material rather than the
cross-layer rule book's.

**React:** `Calendar` imports `catColor` from it, so a `display` component consumes it and the
narrowest-common-level rule puts the module at the layer root rather than in a category —
verify with `grep -rln DataVisuals frameworks/react/components`, which returns the three charts
**and** `display/calendar/`.

**Angular:** the consumers are the three charts **and** `display/calendar-event/`, which reads
`catColor` for a chip's identity colour exactly as React's does — so the same rule puts the copy
at the layer root here too. Until `arena-calendar-event` existed the consumers were the three
charts alone and the module sat at the root **by decision**, against a set narrowed only by
Angular having no schedule view.

**Converges: yes, and it has.** This is the entry that closed itself: the decision it recorded
was that the narrower consumer set was an artifact rather than a real difference, and building
the family proved that reading right. Kept rather than deleted because the *reason* the module
sat there before is what made the eventual convergence an import instead of a second migration.

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
the two square-dot slots stop minting one duplicate rule in `Utilities.generated.css` for the same
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

#### UnauthCard's `panel` hand-duplicates Card's surface classes, and that duplication is gated now

**Not a framework divergence** — both sides of this coupling live in the Tailwind layer — but it
is exactly the kind of thing that silently drifts if nothing records it.

`UnauthCard.manifest.json`'s `panel` slot types out by hand the background, border width, border
colour, radius and overflow that `Card.manifest.json`'s `root` draws (with `border-base-300`
supplied by its `accent: "false"` variant). `UnauthCard` predates `Card`; now that `Card` exists,
the two manifests describe the same surface twice.

**Sharing one recipe stays rejected, on its own terms:** `UnauthCard`'s padding split — `panel`
at `p-5` holding a separate `body` at `p-4` — was litigated separately and is not the same shape
as `Card`'s single `body: p-5`, so collapsing `panel` onto `root` is not a clean substitution.

**What was never rejected is checking that the surfaces agree, and that is what changed.**
`check:surface-parity` compares the two slots' background, border and radius classes — the
padding is deliberately outside the comparison, because that is the part that legitimately
differs — and fails when they drift. It was watched failing against a `Card` whose radius was
changed to `rounded-md`, which is the exact scenario this entry predicted: *"a future change to
Card's radius, border colour or border width updates `Card.manifest.json` alone."* It no longer
does.

**The gate is one named pair rather than a mechanism**, in the same spirit as `check:radius`
naming one class: nothing derives which manifests mirror which, and `PAIRS` fails if it is ever
empty. A second hand-duplicated surface is one entry away, and finding it is a reader's job.

**Converges:** not planned — the padding split is the reason a shared recipe was rejected, not an
oversight to fix later.
#### SideNav is described twice, and the manifest is the Angular half

**React:** `SideNav.jsx` renders a `<nav>` and nothing else. It is a **compound component**, and
the geometry lives in the children rather than in it: `SideNavItem.jsx` owns a row entirely —
`gap: calc(var(--sp-1) * 3)`, `paddingBlock: calc(var(--sp-1) * 2.5)`,
`paddingInlineEnd: calc(var(--sp-1) * 3)`, and the glyph Arena draws at `--icon-lg`;
`SideNavSection.jsx` owns the `role="group"` column and the mono uppercase heading that names it;
`SideNavCollapsible.jsx` owns the disclosure `<button>`, its caret at `--icon-md`, and the region
the button controls. A reader who opens `SideNav.jsx` looking for a padding or a gap will not find
one there — that is the file attribution this entry got wrong until now, and it was wrong for the
values as well as for the shape.

**Tailwind:** `SideNav.manifest.json` was added by plan 5b so a consumer on the raw-`className`
path had something to build against, and it mirrored `SideNav.jsx` property for property,
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
it reads: `SideNav` now has a `SOURCE_OVERRIDES` entry in `scripts/check/arena/check-manifest-states.mjs`
naming all four `.jsx` files, the same reason `Table`'s entry names `Table.jsx` and `TableRow.jsx`
— the naive same-name search resolves `SideNav.jsx`, which renders only the `root` slot, so a
future hover on `item` or `trigger` would have been scanned against a file that can never
implement one. The gate is silent today either way: no slot carries a state modifier, because none
of the four components implements a hover or a focus state.

**Angular:** the same four components — `arena-side-nav`, `arena-side-nav-item`,
`arena-side-nav-section` and `arena-side-nav-collapsible` — and they read the **same** manifest,
`sideNavStyles = tv(SideNav.manifest)`. So the manifest is not a third description of the
geometry — it **is** the Angular geometry, and the only copy that can drift from it is React's
inline one, which mirrors it by hand and which nothing checks.

**Where the two still differ is the mechanism, not the result.** React injects `depth`,
`activeId` and `indentStep` down one hop with `cloneElement`; Angular cannot, so
`SideNavState.ts` is an injectable each level re-provides and each child **pulls** — a section
providing its own `SideNavState` whose `depth` is `computed(() => parent.depth() + 1)`, with
`skipSelf` reaching the level above. Nothing is pushed at all, which is why React's fragment and
wrapper hazards have no Angular counterpart: a consumer's own wrapper component between two
levels breaks React's chain and leaves Angular's injector chain intact.

**The runtime indent is the one thing neither the manifest nor the gate can hold.**
`indentFor()` returns `calc(var(--sp-1) * 3 + var(--sp-1) * N)` per row, so Angular writes it as
`[style.paddingInlineStart]="indent()"` — the `[style.x]` binding form that is one of
`check:dimensions`' two known blind spots, named in section 2 above and in CLAUDE.md's
`check:dimensions` paragraph. The value it computes is token-derived, but the gate cannot see
it either way.

**Converges:** done. The colours, the geometry and the compound shape all agree, through the one
manifest both layers read. What remains is the injection mechanism, which does not converge and
should not — it is the difference between a framework that clones elements and one that has an
injector.

#### Angular's Tooltip is positioned by an overlay and React's is in flow

**React:** `Tooltip.jsx` renders the bubble as an absolutely-positioned child of the wrapper span,
so it is laid out against a `position: relative` ancestor.
**Angular:** `arena-tooltip` renders it through a `TemplatePortal` into a `@angular/cdk/overlay`
pane on `document.body`, positioned by `createFlexibleConnectedPositionStrategy` with a
`reposition()` scroll strategy.

**Why:** the CDK is the reason the Angular layer took a dependency at all — Arena should not
hand-roll trigger-anchored positioning, viewport flipping and reposition-on-scroll. Focus and roles
stay Arena's, which is why `FocusTrap.ts` is untouched.

**Converges: no, and Angular is the better side.** React's bubble is clipped by any
`overflow: hidden` ancestor and cannot leave a scroll container; Angular's escapes both. Fixing
React means either a portal or a popover, and neither is scoped here. Recorded so that a reader
comparing the two does not read the divergence as Angular drifting.

**Two consequences worth carrying.** The shared `Tooltip.manifest.json` grew an `anchored` variant
axis so one recipe serves both models: the wrapper-relative utilities live under
`anchored: false` — which `classesFor()` applies by default, so the Tailwind specimen and React's
mirror are untouched — and Angular asks for `anchored: true` and gets appearance only.
**`arena-menu` reused that axis rather than inventing a second convention**, on the same terms and
with the same divergence from React, which is what an axis rather than a one-off was for. It is
likely to be the last: `arena-select` anchors nothing, because it is the native element and the
browser draws its popup.
And the compliance suite is the first in the layer to pass `root: document.body`, because
`roles.describedby` resolves an IDREF and no element inside the fixture contains both the trigger
and the bubble.

### How to add an entry

When you find a behavioural difference between layers:

1. Decide which behaviour is correct on its merits — not by which layer is older. The token layer
   settles anything about values; nothing settles behaviour automatically.
2. If one layer is simply wrong, fix it and add no entry.
3. If both are defensible, or one leads and the other has debt, add an entry here with the reason
   and whether it is expected to converge.

#### Input — three differences, and the picker dressing moved into the shared layer

**The controlled value.** React re-renders the DOM value from the prop, so ignoring `onChange`
visibly reverts the box. Angular's `[value]` binding writes only when the *bound* value changes,
so ignoring `(change)` leaves what the user typed on screen while the signal says otherwise. That
is Angular's binding model rather than a defect, and no `ControlValueAccessor` is involved
(`arena-input` is not a forms control and does not claim to be). It is stated in
`Input.prompt.md` because it is the one way a consumer can hold this component wrong.

**The date picker indicator moved layers.** React injects a one-time
`<style data-arena-input>` from a module-level `injected` guard to dress
`::-webkit-calendar-picker-indicator`, because an inline style cannot reach a vendor
pseudo-element. Angular components carry no `styles`, so the rule went into the shared
manifest's `input` slot as arbitrary variants
(`[&::-webkit-calendar-picker-indicator]:[filter:invert(var(--picker-invert))]` and its
siblings), which `check:tailwind` proves emit and `check:arbitrary` passes. **That is strictly
better placed** — it serves the Tailwind specimen too, and it is measured by the same gates as
every other class. React's injection is now a duplicate of it and is left alone: removing it
would change a shipped component for no behavioural gain, since React reads no manifest.

#### Textarea — autoResize measures on more occasions in Angular, and the border term CONVERGED when the box model did

**React:** `Textarea.jsx` grows the box inside its own change handler and nowhere else, from
`e.target.scrollHeight`. So a value set programmatically — a draft loaded from a server, a
template inserted by a button — leaves the box at its old height until the user types into it.
**Angular:** `arena-textarea` runs the same measurement in an `afterRenderEffect` that reads
`value()`, so mount and every programmatic change size it too. **Converges: no, and Angular is
the better side.** That half is unchanged.

**The formula half is closed, and it closed by a change made two batches away that nothing
connected to it.** `scrollHeight` is content plus padding and **never the border**, so a
border-box element needs `offsetHeight - clientHeight` added or the box lands short and keeps a
permanent scrollbar. This entry recorded that as an Angular-only term, on the reasoning that
*"React's textarea is content-box, where `height` means content alone"* — true when written, and
**false the moment `contracts/design/reset.css` shipped**. Nothing failed: happy-dom has no
layout and reports `scrollHeight` as `0`, so no suite can see it, and `check:cards` measures a
page overflowing its viewport rather than an element scrolling inside itself.

**Measured in Chromium on the component's own card page at 720×340**, after the reset and before
the fix: `scrollHeight` 199, the height set to 199, `clientHeight` 197 — two pixels short, and
`scrollHeight > clientHeight` still true, which is a scrollbar on a box that had just been grown
past it. With `borderBoxSlack` added: height 201, `clientHeight` 199, no scroll. Both layers now
carry the same term for the same reason, which is what a shared box model buys.

**The lesson is about the reach of a systemic change.** A repo-wide reset is correct and is still
correct; what it also does is invalidate every argument that rested on the old default, and those
arguments are in prose that no gate reads. This one named its premise explicitly — *"React's
textarea is content-box"* — which is the only reason it was findable at all.
#### Table — React's wide shape is a `<table>`, Angular's is a role-based grid, and a compiler rule forced it

**React:** `Table.jsx` renders a real `<table role="grid">` with `<thead>`, `<tr>`, `<th>` and
`<td>`, wrapped in a bordered frame `<div>`, and switches to a stack of card `<div>`s below
`--bp-md`.
**Angular:** `arena-table` host-binds its root, renders one box whose `display` and `role` change
with the shape — `display: table` + `role="grid"` when wide, `display: contents` when narrow — and
rows and cells are `display: table-row` / `display: table-cell` hosts carrying `role="row"` and
`role="gridcell"`.

**Why, and it is a property of the framework rather than a preference.** Angular's
`ɵɵprojectionDef` indexes projection slots in template order and `matchingProjectionSlotIndex`
returns the **first** slot a node matches, so two `<ng-content>` with the same selector cannot both
receive content — the second gets nothing. A `wide` branch and a `card` branch each carrying their
own `<ng-content>` would therefore leave one shape permanently empty, and the same applies to the
`empty` slot. The rows must be projected exactly once, into a box that exists in both shapes, and a
`<table>` element cannot be that box.

**What actually differs is smaller than the markup suggests.** React already puts `role="grid"` on
its `<table>`, so the native table role was being overridden in **both** layers and no
accessibility semantics are lost — an AT reads a grid, rows and gridcells either way. Two real
costs remain: `colspan` has no CSS equivalent, so Angular's empty state is a block **beside** the
grid box rather than a cell spanning it, and the grid in that state holds only its header row; and
`display: table` on the host means the measured `contentRect` excludes the frame border, so the
narrow threshold trips a couple of pixels earlier than React's.

**Converges:** no, and neither side is wrong. React should not be rewritten to match, and Angular
cannot render the other shape without giving up the single `<ng-content>`.

#### A compound family coordinates in the opposite direction in each layer

**React:** the parent clones each child and pushes `name`, `checked` and a callback into it
(`RadioGroup` → `Radio`, `Table` → `TableRow` → `TableCell`, `SideNav` → its items). Injection is
direct children only, one hop, which is why a consumer's own wrapper component or a `<>…</>`
fragment between two levels silently breaks the chain.
**Angular:** there is no `cloneElement`. The parent provides a small state object and the **child
injects it and pulls** — `RadioGroupState` in `components/forms/radio-group/`. Nothing is pushed,
so a wrapper component, a `@for`, or any depth of projection between the two is harmless, and an
option outside a group is a DI error rather than a silently inert control.

**Why the state object exists at all, rather than the child injecting the parent component.**
`check:api` reads the Angular surface from the real `<Name>.ts` class and requires it to be exactly
the contract's members — a public `select()` or a public `selected` signal on `RadioGroup` fails the
gate, correctly, because a consumer could reach it. So the coordination cannot live on the
component. It lives on a class the component `provides`, which no gate reads as a surface and no
consumer can name. **That is the pattern for every compound family**: `Tabs`/`Tab`,
then `Table`/`TableRow`/`TableCell` (`TableState` and `TableRowState`, landed by batch 4 — the
first family to need TWO state objects, because a cell's column index is its row's to know and
its cursor position is the table's), and the `SideNav` family (`SideNavState`, landed by batch 6
— the first to need `skipSelf`, because it is the first family that NESTS: every container
re-provides the same class at `depth + 1`, so a child's nearest one is the level above it and a
container reaching its own parent has to step over the one it just provided).

**Converges: no, and neither side is wrong.** Each is its framework's idiom. What both keep is the
rule that the coordination is a member of no contract.

**One consequence for the contracts themselves.** Several `content` descriptions were written in
React's mechanism — "RadioGroup injects each one's selected state" — which is the same defect as
the word *prop* appearing in a contract. `RadioGroup` and `Tabs` were reworded first; `Table`,
`TableRow` and `TableCell` followed when batch 4 implemented them, on the principle that rewording
a contract for a layer that does not exist yet is a guess about what that layer will do.
**The `SideNav` family's four are the ones still saying "injects"** — `SideNav.json` in both its
description and its `content` slot, and `SideNavSection.json` and `SideNavCollapsible.json` in
theirs. The premise that held them is spent: batch 6 built the layer, so there is no longer a
guess to avoid, and what stands in the way is only that nobody has rewritten them. Angular's
mechanism is the opposite word — a child **pulls** its depth from the nearest provided state —
so the contracts describe one layer's verb and neither layer's contract.

**Two claims this entry made about that set were false, and the correction is the point.** It said
`TableRow`'s and `TableCell`'s prose "even names `cloneElement`". Neither did — **no contract has
ever contained the string**, verifiable in one command:
`grep -l cloneElement contracts/api/components/*.json` returns nothing. And `TableCell` was listed
as a third offender on the strength of a single "injected", where `TableRow` really did carry both
the verb and the word `props`. Written into an entry about prose rotting, in a file whose own rule
is that a claim about another file goes stale unread — which is why it is corrected here in full
rather than quietly dropped.

#### Two Angular components bind `navigation` and reach the landmark two different ways

`arena-pagination` renders a real `<nav>` and takes its host out of layout with
`display: contents`. `arena-breadcrumbs` renders no `<nav>` at all: it host-binds its root slot and
puts `role="navigation"` on the host. Both satisfy the pattern, because `navigation`'s
`roles.element` admits either — *"navigation (native nav, or role=navigation when nav cannot be
used)"* — and both suites pass the same `assertPattern` against the same requirement.

**The reason for the difference is which rule each followed, not a judgement about the pattern.**
`arena-breadcrumbs` followed the layer's default, which is that a primitive host-binds its root
rather than rendering a wrapper. `arena-pagination` followed React, whose `Pagination.jsx` renders
a `<nav>`, and took the carve-out the host rule already provides for an element that must be a
specific semantic one.

**Which is better is not settled, and the pattern's own wording leans the other way from
`Breadcrumbs`**: it offers `role=navigation` for when `<nav>` *cannot* be used, and nothing stopped
`arena-breadcrumbs` from using one. Converging means giving `arena-breadcrumbs` a real `<nav>`, a
bare host with `display: contents`, and a rewrite of its compliance suite — whose subject is
currently the fixture's own element and would become an element inside it. Nothing schedules that,
and no gate notices: `check:behaviour` compares bindings and both bind `navigation` cleanly, while
the evaluator asks whether there is a navigation landmark and never which element carries it.

#### `input.required` is not the runtime guard, and every component that needs one says so in code

Seven API contracts say a member is **"required, and guarded at runtime"** — count them with
`grep -rl "guarded at runtime" contracts/api/components/`. Angular's
`input.required` is not that guard: it throws when nothing was bound at all (NG0950) and says
nothing about what was bound. `[ariaLabel]="row.title"` with an empty title satisfies it, and
`[pageCount]="0"` satisfies it, and each leaves the component in exactly the state the member was
made required to prevent — the first an unnamed landmark, the second a window over nothing.

So the guard is a `computed` that validates and throws, placed where the template or the host
binding already reads it, which is what makes it run on the first change detection instead of
waiting for something to ask. `Pagination` (`ariaLabel`, `pageCount`), `Breadcrumbs`
(`ariaLabel`), `ActivityFeed` (`label`), `RadioGroup` (`ariaLabel`), `Table` (`label`), `SideNav`
(`ariaLabel`) and `SideNavSection` (`label`) carry it — every contract with the phrase.

`Table` is the one that shows what the guard buys, because its member is the hardest to derive:
a grid's name is editorial, `input.required` is satisfied by `[label]="row.title"` over an empty
title, and the result is a grid announced with no name at all. It guards `label` and **nothing
else** — `columns` is required too, and takes no guard, because the contract attaches the phrase
to `label` alone and inventing a second guard would diverge from React for no contracted reason.

**Two properties of this shape are worth knowing before extending it.** A signal caches a thrown
error and re-throws it until a dependency changes, so a guard that fires once keeps firing for the
right reason rather than resolving on the next tick. And under zoneless change detection the throw
propagates out of `detectChanges()` — which is what makes it assertable with `assert.throws`, and
also what makes an invalid configuration on a demo page render nothing at all rather than render
badly.

**One divergence from React, deliberate.** React tests falsiness (`if (!ariaLabel)`), this layer
tests `trim()`. A name of nothing but spaces is refused here and accepted there. React's is the
weaker of the two, and nothing schedules moving it.

**Nothing gates any of this.** No check reads a contract's `description` prose, so a seventh
contract could grow the phrase and no component would be obliged to notice.

#### Calendar — the chips are not inside their day columns, and `aria-owns` is what pays for it

**React:** `Calendar.jsx` distributes chips with `cloneElement`, so every `CalendarEvent`
renders as a DOM child of its day's `role="row"` and inherits that column as its containing
block. A chip's `left` and `width` are percentages **of its own column**.

**Angular:** `<ng-content/>` projects once, in one place, and two with the same selector is
rejected outright — so no arrangement of the template can put one chip in one column and the
next in another. `arena-calendar` places a single bare `<ng-content/>` inside the
`role="grid"` element; each chip's host declares `display: contents` and its absolutely
positioned root resolves against the grid's own padding box. A chip's `left` and `right` are
percentages **of the whole grid**, and each day column names its own chips through
`[attr.aria-owns]` so the accessibility tree matches React's: a chip is a child of a row
without being a cell, in both layers.

Two consequences, both real:

- **The day columns must be equal, and in React they are not.** React's columns are `flex: 1`
  with `border-left` on all but the first, so under `flex-basis: 0%` column 0 is narrower than
  the rest by one border width. React does not care, because its percentages are of whatever
  that column turned out to be. Whole-grid percentages do care, so the Angular grid is a real
  CSS grid with `repeat(N, minmax(0, 1fr))` tracks. **No gate can see this** — `check:dimensions`
  is blind to `[style.x]`, and the grid suite asserts the keyboard rather than the geometry —
  so it is measured in Chromium over CDP against the rendered track boundaries.
- **Anything projected that is not an `arena-calendar-event` becomes a grid item** and adds a
  column of its own, where React's `Children.toArray().filter(isValidElement)` plus its
  placement lookup silently skips it. Both prompts carry the Don't; only one of them has teeth.

**Converges:** no. The mechanism is `cloneElement` versus content projection, and neither layer
can adopt the other's.

#### CalendarEvent — the chip is always a button in Angular, and React has a third case

**React:** the chip renders an inert `<div>` with no role when no `onClick` was passed, and a
`<button>` when one was. Its binding declares three cases: `clickable`,
`clickable-with-actions` and `inert`.

**Angular:** there is no way to ask whether an `output()` has subscribers —
`OutputEmitterRef.listeners` is private, and an `interactive` input would be a member no
contract declares — so the interactive shape is unconditional and the binding declares two
cases with `divergesFrom: "none"`.

**This is the same wall `arena-table-row` hit, resolved the opposite way, and the asymmetry is
the point.** `TableRow` renders the non-interactive shape because always-a-button would put a
dead tab stop on every row of every table. A chip is `tabindex="-1"` and is never a page tab
stop, so always-a-button costs no dead stop here — where always-a-div would delete
Enter-into-the-chip, which is the whole keyboard story `arena-calendar`'s `grid` binding leans
on. The bounded consequence: a chip whose consumer bound no `(click)` is announced as a button
that does nothing, reachable only by Enter from the hour cell it overlaps.

**Converges:** only if the contract grows a member for it, which would change React too.

#### CalendarEvent's horizontal geometry is a manifest class in Angular and arithmetic in React

**React:** the chip's gutter to its neighbour is arithmetic in the injected value —
`left: calc(X% + calc(var(--sp-1) * 0.5))`, `width: calc(W% - var(--sp-1))`.
**Angular:** the chip sets `left` and `right` as **pure percentages** and no width, and the 2px
gutter each side is `mx-0.5` on the manifest's `chip` slot. The rendered geometry is identical.

**The reason is a test-environment constraint, and it is worth knowing before anyone "restores"
the calc form.** happy-dom's CSS value parser **rejects any `calc()` containing a `var()`** —
`d.style.setProperty('left', 'calc(33% + var(--sp-1))')` leaves `style.left` as the empty string.
Under the React shape no Angular suite could read a chip's placement at all, so the whole
horizontal axis would have been unverifiable.

**Converging React onto Angular's shape was weighed and refused.** It would buy one real thing —
the gutter would move from a `calc()` the dimension gate cannot fully judge into a manifest class
it can — and it would cost two. React's chip has no manifest, so the gutter would have to become
an inline `margin` and a second place the chip's geometry lives; and `left`/`right` percentages
without a width are a different layout contract from `left`/`width`, so the change is a rendering
change to a shipped component made for a testability benefit that React does not need, because
React's suites read the `calc()` fine. **A constraint of one layer's test environment is a reason
for that layer's shape and not for the other's.**
#### A chip outside a calendar throws in Angular and renders in React

**React:** `CalendarEvent` mounted alone renders an unplaced chip. `CalendarEvent.prompt.md` says
it "means nothing", and that is the whole enforcement.
**Angular:** `inject(CalendarState)` is not optional, so the same mistake throws `NG0201` before
anything renders. The injection is deliberately not made optional: a chip has no geometry of its
own, and a silent unplaced render is worse than the injector error.

**Angular is the better half and React stays as it is, which needs a reason rather than an
apology.** React has no injector to fail: the chip learns its placement from props `Calendar`
pushes in with `cloneElement`, so a chip rendered alone simply receives none — there is no lookup
to miss and nothing to throw from. Reproducing the guard would mean inventing a required context
and a runtime check for a mistake the prompt already names, in a layer where the compound family
deliberately uses **no context anywhere**. That is a structural rule this file records twice, and
breaking it to catch one authoring error is the wrong trade.

**Converges:** no. The two layers fail differently on the same consumer mistake because they
coordinate in opposite directions, and that coordination is itself recorded above.
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

Two further gaps were in the gate's own reach rather than in human judgement, and both are
closed: the gate now reads the `.jsx` beside the `.d.ts` as well, so `spec.default` is compared
against the implementation's own destructuring default and a restored `{...rest}` spread fails.
*Known debt* carries what that found and what the comparison deliberately refuses to claim.
R2 and R3 are unaffected — neither is a fact about source text.

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
  `check:states` (`scripts/check/arena/check-manifest-states.mjs`) now catches this shape; it says
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

### An arbitrary PROPERTY is the fourth bracket shape, and it is earned rather than general

A `transition-[...]`/`duration-[...]` pair sets one duration for every listed property, because
Tailwind's `duration-` utility writes a single `transition-duration` for the whole list and there
is no second one to layer on. `Button` needs `background` and `transform` fast and `box-shadow`
slower, so `Button.manifest.json` writes the whole declaration as one bracket:
`[transition:background_var(--dur-fast)_var(--ease-out),…]`, no `utility-` prefix.

Every operand is a `var()` into a token, so `check:arbitrary` holds over it exactly as over the
other three shapes — **the escape is the *property*, never the literal.** Reach for it only when
no utility can express the declaration at all, which here means a per-property duration.

**This section used to say the split was inexpressible**, having named this exact escape in its
own last sentence and declined it for being undocumented. A shape being undocumented is a reason
to document it, not evidence that a thing is impossible, and the gap between *"we have not written
this down"* and *"this cannot be done"* is where a false claim can live for a long time — a
paragraph reads as a limitation when it is really a deferral.

### An Angular input named after a native attribute leaves the native attribute behind

Angular writes a static attribute to the DOM during the creation pass whether or not it also
matches an input, so `<arena-page-head title="Projects">` would leave a real `title` on the host
and the browser would draw a tooltip over the whole header. `confirm-dialog` is the worst case by
a distance: its host is the fixed full-viewport scrim, so the tooltip would cover the **entire
viewport** while the dialog is open.

**Every primitive taking such an input clears it**, and `GLOBAL_ATTRIBUTE_INPUTS` in
`frameworks/angular/test/HostClassBinding.test.ts` asserts it **both ways** — a primitive that
takes the input and does not clear it fails, and so does one that clears an attribute it takes no
input for. `title`, `name` and `id` are on that list. Read the guard rather than a count; the
figure here was wrong three times.

**The list is the thing to extend, not the components.** Any global attribute that becomes an
input name joins the same trap, and adding it to `GLOBAL_ATTRIBUTE_INPUTS` is what makes the next
recurrence loud instead of silent.
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

### `scripts/lib/core/validate-palette.mjs` — vendored, and its thresholds are calibrated

Vendored from the `dataviz` Agent Skill (`scripts/validate_palette.js`) on 2026-07-16 and kept
verbatim except for the CLI filename guard and usage string. **Do not "improve" the thresholds
or the CVD matrices**: they are calibrated to the Machado-Oliveira-Fernandes (2009) severity-1.0
model, and changing one silently invalidates the measured numbers published in the design
specification. Upstream is the authority — **re-vendor rather than patch**.

### `scripts/check-material.mjs` — retired with the bridge it guarded, and the lesson it leaves

The gate and the Angular Material bridge it guarded are both gone: this layer implements every
control itself and imports no `@angular/material`. The entry stays because `check-cdk.mjs` was
designed against it — its two blind spots are why that gate checks selectors, and its incident is
why that gate carries zero-result guards. `referencedTokens` and `arenaTokenNames` outlived it, in
`scripts/lib/core/arena-tokens.mjs`.

`frameworks/angular/theme/arena-material.css` mapped Angular Material's custom properties onto
Arena's tokens, and **both halves of that mapping failed silently**: a property name Material did
not read applied nothing, and a `var()` naming no Arena token resolved to nothing. Neither threw,
neither logged, and `check:dimensions` does not scan `.css`. When Material renamed its tokens,
**24 of the bridge's 34 names went inert and nothing noticed for a whole major version.**

Two things that gate never did, recorded because a gate implying more coverage than it has is how
the bridge rotted in the first place:

- **It checked that a name EXISTED, not that it was the right name for the element being
  styled.** The bridge once set `--mat-list-list-item-container-{shape,color}` on the active nav
  item; both names existed, but `mat-nav-list` read `--mat-list-active-indicator-{shape,color}`
  and the `container-*` pair belonged to `mat-selection-list`. Catching that needs to know which
  selector reads which property.
- **It read property NAMES only and never the SELECTORS they sat in** —
  `.mat-mdc-unelevated-button`, `.mat-form-field-appearance-outline`, `.mdc-list-item--activated`
  and the other 12 of the bridge's 15. All 15 were hand-verified present in Material 22, so
  nothing was broken, but **a selector rename upstream would have killed the bridge by the
  identical silent mechanism, with the gate still green.**

Its existence oracle read **both** places a Material custom property could be named, because
measured against the pinned 22.0.5 neither alone was the whole set: 102 names appeared only in
`prebuilt-themes/*.css` (71 `--mat-sys-*`, 27 `--mat-app-*`, three component-level names, and
`--mdc-icon-button-state-layer-size`), while 17 appeared only in `fesm2022/*.mjs` (the
`--mat-focus-indicator-*` family, `--mat-dialog-transition-duration`, the animation multipliers).
Reading only `fesm2022` was never wrong in practice and its error direction was the safe one — it
could over-reject a live name, never silently pass a dead one — but it was widened anyway,
because the hazard was second-order: someone "fixing" a red gate by deleting a legitimate
property rather than doubting the oracle, which is how a silent hole reopens. **That last
sentence is the part that outlives the gate**, and any future bridge to a library this repository
does not own inherits it whole.

### `scripts/check/arena/check-duplicate-constants.mjs` — what it catches is three of five

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

### `scripts/build/react/build-vendor.mjs` — React 18.3.1 is CJS-only, and Bun's export detection is partial

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

### `scripts/check/tailwind/check-radius-tokens.mjs` — why `rounded-full` is the one class it names

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
`*.card.html` specimens, not the compiled `Utilities.generated.css` — so a specimen typing `rounded-full`
onto an element directly passes unseen. Nothing in the tree does that today, and a specimen is
supposed to take every class from `classesFor()` anyway, but neither of those is this gate
enforcing it.

### `scripts/lib/core/behaviour-compliance.mjs` — the tri-state, and the false-OVERCLAIM it corrected

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

### `scripts/lib/arena/api-surface.mjs` — three known blind spots in a regex `.d.ts` reader

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

### `scripts/check/arena/check-all.mjs` — why it is not an `&&` chain, and how it picks a test command

Every gate runs unconditionally: one failing does not stop the rest. Each step's output streams
live (child stdio is inherited, not buffered), and the summary prints once every step has
finished. Every gate is spawned as `process.execPath <script>.mjs`, so the runner behaves
identically under `bun` and under `node`.

**The test-suite step has no such uniform invocation**: `bun test` is a bun-specific subcommand
with no `node:test` equivalent, so the runner picks the command for the runtime it is itself
executing under — `bun test scripts/` when `process.versions.bun` is set, `node --test` over the
discovered `scripts/**/*.test.mjs` files otherwise.

**That discovery walks, and the walk is load-bearing.** `bun test scripts` recurses on its own,
so the bun path never noticed the shape of the tree; the node path read one directory. When the
phase directories landed, a flat read would have found **zero** suites and reported the step
green over a tree it never opened — a passing run is not evidence the suites ran.

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

### `frameworks/angular/test/NodeAssert.ts` — a failing node assertion is what ends the run

`node:assert` renders **both** operands into its diff when an equality assertion fails, and a
happy-dom node that is **connected** reaches the whole document from there. So the cost is set by
the tree the node hangs in, not by what it is compared against — and the Angular suites share one
document for the entire run (see `TestbedEnv.ts` above), which only ever grows, because a fixture
left undestroyed keeps its nodes in it.

Measured, with a `<body>` holding **three** elements, as the length of the `AssertionError` message:

| assertion | message length |
|---|---|
| two **detached** `<button>`s | 1,441 |
| two **connected** `<button>`s | 12,755 |
| a connected `<button>` against `null` | 285,795 |
| `document.body` against a connected `<button>` | 518,563 |

Comparing against `null` is therefore **not** the safe case, which is the counter-intuitive part:
`assert.equal(host.querySelector('button'), null)` costs 285k characters on a three-element body.
A real run's body is orders of magnitude larger, and building that string is what exhausts memory
and CPU — the failure never reaches a reader at all, so the suite looks like it hung rather than
like it found a defect. It was found the day `arena-tabs` landed: the first focus assertion to
fail took the whole process with it.

`assertSameNode`/`assertNotSameNode`/`assertNoNode` compare identity and render the operands
themselves, clipping text at 40 characters; `NodeAssert.test.ts` holds the failure messages under
400. `check:assertions` is what keeps the raw form from coming back — it judges the **tail** of
each operand expression, so `assert.equal(el.textContent, 'x')` stays allowed while
`assert.equal(el.closest('label'), other)` does not.

**Not covered, and deliberately:** the React layer. Its suites use `bun:test`'s `expect`, which did
not reproduce the blow-up, and they do not share one document across the whole run the way
Angular's do. If React ever moves to `node:assert`, `SUITE_ROOT` is the one line to widen.

### `frameworks/angular/components/navigation/tabs/Tabs.compliance.test.ts` — the CDK reads `keyCode`, which happy-dom leaves 0

`@angular/cdk/a11y`'s `ListKeyManager.onKeydown` switches on **`event.keyCode`**, the deprecated
property — not on `event.key`. A browser still fills `keyCode` in, so `arena-tabs` works in real
Chromium; happy-dom leaves it `0` when the event is built as
`new KeyboardEvent('keydown', { key: 'ArrowRight' })`, so the manager falls to its `default:` arm
and **ignores every key**. `press()` sets `keyCode` for that reason, and the map is beside it.

Two things this cost, both worth remembering. Nothing moved focus, so `document.activeElement`
stayed `<body>` and the focus assertion failed against the largest node in the document — which is
how the entry above was found. And the sibling test asserting that the **vertical** arrows do
nothing passed for the wrong reason: nothing was doing anything. A test that asserts an absence is
the one that cannot tell a working mechanism from an absent one.

Arena's own components read `event.key` and are unaffected — `activity-feed` and `bulk-action-bar`
both walk with arrows under happy-dom today. `Tabs` is the only component that delegates its
keyboard to the CDK, so it is the only one that needs this.

### `frameworks/angular/theme/arena-cdk.css` — one selector, and why the other four are left alone

`@angular/cdk/overlay-prebuilt.css` hardcodes `z-index: 1000` in five places:
`.cdk-overlay-container`, `.cdk-global-overlay-wrapper`, `.cdk-overlay-pane`,
`.cdk-overlay-backdrop`, and the global wrapper's pane. Only the **container** is overridden, to
`calc(var(--z-toast) - 10)`.

The container is the one that matters because it establishes the stacking context: a `z-*` utility
on a pane inside it can never lift that pane past Arena's in-flow overlays. The other four are
**equal to each other on purpose** — inside the container the CDK layers by DOM order, which is
what keeps a backdrop under its own pane. Lowering one relative to its siblings is how a backdrop
ends up over the panel it dims.

**The container's own value was wrong for every in-flow overlay, and it was measured rather than
reasoned.** The CDK's own 1000 **ties** with `--z-modal` and sits below `--z-modal-nested` (1050),
`--z-palette` (1100) and `--z-onboarding` (1200); `var(--z-dropdown)` (900) was below all four. So
a tooltip on a control inside an `arena-confirm-dialog` painted **behind the dialog**, and a menu
opened from inside one would have too — against a modal by accident of mount order, against the
three higher slots outright. That accident is precisely what the `z` family was built to remove,
and its own `$description` says so about the pre-token state.

The value it takes instead is `calc(var(--z-toast) - 10)`. A CDK overlay is always anchored to a
trigger that already sits inside whatever is on top, so there is no case where it should paint
below an in-flow overlay; and it must stay under `--z-toast`, which floats above everything. It is
derived at the point of use rather than given a slot of its own, the way `--z-onboarding`'s scrim
already is at `Onboarding.jsx:35` — one slot, two uses. A token would have bought nothing: the
CDK layer is not a design decision about what covers what, it is one third-party container that
must sit above the whole in-flow family.

Two consequences remain. Every CDK overlay shares one z slot, so a tooltip over a menu item wins by
being appended later rather than by `--z-tooltip` being 950 — the outcome that token exists for,
reached by a different mechanism, which means the token's own `$description` is now describing an
intent rather than a computation. And a toast outranks every CDK overlay, which is the order
`--z-toast` declares rather than a cost: `arena-toast` is an in-flow card the host places, so it
never enters this layer at all.

**One page inlines this override instead of importing the bridge** — `Tooltip.card.html`, and every
Angular card page for a CDK primitive after it — so the value lives in two kinds of place and a
change to one is a change to both. Nothing checks that they agree.

### `frameworks/angular/test/Overlays.ts` — the container must survive the teardown

The first version of `disposeOverlays()` removed `.cdk-overlay-container`, and it broke every
overlay test after the first two in a file — silently, with nothing to query. The CDK creates that
container once and **caches the reference**, so removing the element leaves every later overlay
attaching into a node that is no longer in the document. Measured, not reasoned.

So the helper removes the panes and leaves the container. An empty container is already invisible
(`overlay-prebuilt.css` carries `.cdk-overlay-container:empty { display: none }`), so leaving it
costs nothing. This matters here specifically because `TestbedEnv.ts` shares one document across
the whole `bun test build/angular-test/angular` run, so the hazard crosses files.

### `check-docs.mjs` — why `isGenerated`'s third marker is a comment and not a window

The third marker `isGenerated()` accepts is the text `GENERATED by` in the file's **first
comment**, found by lexing, and the comment must open the file. The obvious cheaper spelling —
that text anywhere in the first N characters — was the original, and it is wrong in a way that
takes a while to see: a **generator** holds the banner it emits as a string literal, so it
matches its own marker and exempts *itself* from the comment rule.

The margin was nothing. Subdividing `scripts/lib/` lengthened two import lines in
`generate-tokens.mjs` by sixteen characters, which moved its `HEADER` literal from character
382 to 398; `slice(0, 400)` then cut the marker to `GE` and the file went from exempt to
scanned. It passed in both states, but nobody had chosen either. **A file's exemption must not
depend on how long its import block is.**

Measured before the change, exactly three files were exempt by that marker —
`build-demos.mjs`, `build-tailwind.mjs` and `generate-api-types.mjs` — and all three are
generators, so every hit was a false positive. Nothing legitimately generated relied on it: the
`.generated.` infix, the `.manifest.ts` suffix and the `.js`-beside-a-`.jsx` test already cover
that, and `vendor/` was skipped as a directory. The stricter rule pulled those three into the
scan, where they pass, and exempted nothing new. Lexing every scanned file rather than slicing
400 characters costs nothing measurable: the gate still runs in under a fifth of a second.

The general shape is worth keeping: **a marker that a file can contain is not a marker a file
can be identified by.** The question is never whether the text is present but whether it is
present *as the file's own declaration about itself*.

**That reasoning is what the `.generated.` rename finished.** `isGenerated()` is now one test —
`/\.generated\./` on the path — because a file's name is the one thing about it that a reader
and a lexer agree on and no import block can shift. The three heuristics, the 400-character
window and the `vendor` directory skip are all gone. What replaced the content check is not
nothing: `check:generated` reads the header of every *hand-written* file and fails one whose
header claims a generator that its name does not. The claim moved from "recognise output" to
"an output must say so", which is checkable in a way the first was not.

### `scripts/build/` — a directory whose name two tools already reserved

The phase directory is named `build`, and two things in this repository skip a directory of that
name to avoid the emitted tree at the root. Both were silent, and neither was a failure:

`.gitignore` carried `build/` unanchored, which git matches at **any** depth. The scripts moved
in under `git mv`, which does not consult gitignore for already-tracked files, so nothing looked
wrong — but the new `.gitkeep` files were dropped, and so would be every script added under
`scripts/build/` afterwards. The three build-output rules are anchored to the root now (`/build/`).

`check-docs.mjs` skipped by directory **name**, which took `scripts/build/` out of the comment
rule's reach: those files would have been exempt from the one-header limit with the gate still
green. It skips the emitted tree by path now, and a test pins the distinction by asserting a
violation in `scripts/build/` while ignoring one in the root `build/`.

The lesson generalises past this instance: **a skip list keyed by bare name is a claim about the
whole tree**, and it silently widens the moment a directory of that name appears anywhere else.

### `scripts/check/angular/check-cdk.mjs` — why it checks selectors where a custom-property bridge cannot

A bridge that maps a library's custom properties onto Arena's tokens cannot examine the selectors
those properties sit in — one of the two disclosed blind spots of the retired `check-material.mjs`
recorded above. `check-cdk.mjs` does check them, and the difference is that it **has an oracle**:
the CDK bridge's whole job is overriding a class the prebuilt stylesheet defines, and that
stylesheet is installed and readable, so `.cdk-overlay-kontainer` is decidably wrong. A
custom-property bridge has no equivalent — a property name can be verified against the package,
but which selector *should* carry it is a judgement no file states.

What this gate still cannot check is whether the override's **value** is right for that class. It
also carries four zero-result guards, because a bridge that stops being a bridge — no rule, no
`cdk-*` class, no `var()`, no `@import` — would otherwise pass by having nothing left to check.
Its own suite exercises all four, and it caught a real defect while being written:
`cdkClasses()` did not strip comments, so a class named in prose would have been checked as
though it were an override.

### `scripts/check/arena/check-card-viewports.mjs` — why the content height takes a max of two metrics

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
regression here is the by-hand checklist in `CalendarEvent.prompt.md`, in a real browser —
not because a grid may have no render suite (that rule is retired and both layers have one)
but because the sum is a rendered relationship between two boxes, which happy-dom cannot
measure. Measured after the
change, the margin is 15px: the title's bottom sits that far above the kebab's top on a 66px
chip.
