# Resolving IDREFs, checking "each", and governing the logical sides

Three changes, one of them large in consequence and small in code. The compliance layer decides
every requirement by reading **one** element and asking whether an attribute is **present**. Both
halves of that are too weak, and the batch before this one proved it by shipping a defect straight
through them.

---

## What this measured before it was written

Read off the tree at `7ee8c27` on 2026-07-26. Do not re-derive; do verify anything you depend on.

| measure | value |
|---|---|
| requirements across every file in `behaviour/patterns/` | **103** |
| requirements carrying an IDREF | **5**, across 4 patterns |
| IDREF attributes rendered in the React layer | **22** |
| of those 22 resolved by any gate | **0** |
| covered bindings affected by this change | **3 of 10**, all React |
| logical `border`/`inset` sides in `check:dimensions`' `PROPS` | **0** |
| uses of a logical `border`/`inset` side under `frameworks/` | **0** |
| DOM members the shared evaluator touches | **4** — `tagName`, `getAttribute`, `hasAttribute`, `textContent` |

The five IDREF-carrying requirements, verbatim from the pattern files:

| pattern | requirement | prose |
|---|---|---|
| `combobox` | `roles.controls` | aria-controls on the combobox references the popup element |
| `combobox` | `roles.activedescendant` | aria-activedescendant tracks the active popup option… |
| `disclosure` | `roles.controls` | aria-controls on the button, naming the id of the region it shows and hides |
| `tabs` | `roles.controls` | each tab has aria-controls referencing its tabpanel |
| `tooltip` | `roles.describedby` | the triggering element references the tooltip with aria-describedby |

### The evidence, which is a defect this repo shipped

Batch 8C6 gave `Tabs` a clean `"exceptions": []` against the `tabs` pattern. Measured on its own
three-tab fixture: **two `aria-controls` values, one rendered panel** — so every unselected tab
referenced an id that existed nowhere. `roles.controls` passed anyway, twice over:

- the evaluator maps `roles.controls` to `el.getAttribute('aria-controls') !== null`, a **presence**
  check that cannot tell a resolving reference from a dangling one;
- the suite handed it `root.querySelector('[role="tab"]')` — the **first** tab, which that fixture
  made the selected one, and the selected tab is the only one whose reference resolved.

The pattern's own prose says *each*. The gate checked one. Nothing in the layer noticed, and the
final whole-branch review caught it by reading the markup by hand.

### A finding that decides part of the design

A scan for requirements whose prose contains the word *each* returns **four**:
`feed:states.posinset`, `listbox:states.selected`, `navigation:roles.label`, `tabs:roles.controls`.

Reading the prose instead of grepping it finds at least a fifth: `tabs:states.selected` says
*"aria-selected set to true on the active tab, **false on the rest**"* — the same quantification as
`listbox:states.selected`, written in different words.

So **the set of quantified requirements cannot be derived from the prose.** That is not a new rule;
it is the rule `behaviour-compliance.mjs`'s own header already states — requirement semantics key
off the requirement KEY and the PATTERN NAME, never off the human prose in the value — and it is
the correction that made an earlier implementation stop reporting false OVERCLAIMs against seven
correct components.

---

## Part 1 — Resolving an IDREF

### Where the resolution lives, and why it cannot live in the evaluator

`scripts/lib/behaviour-compliance.mjs` is DOM-generic **by charter**: it is consumed from three
runtimes — bun+happy-dom on the React side, bun+happy-dom under Angular's TestBed, and plain node in
its own suite, which has no DOM at all — and it therefore touches exactly four members. Its header
states the rule: anything richer (`querySelector`, `matches`, `closest`) belongs to the caller,
which knows its own tree.

Resolving an id needs the tree. So the caller **injects a resolver**:

```js
comparePattern({ pattern, binding, subjects, fallback, behavioural, resolveId })
```

`resolveId(id) => element | null`. The evaluator calls it and stays generic; its own suite passes a
stub, which is a function like any other and needs no DOM.

### Two decisions about the resolver itself

**It is scoped to the mounted container, never to `document`.** The claim a requirement makes is
that a reference resolves *within the rendered tree*. Resolving against the whole document would
also find a leftover node from an earlier test, and would pass in a page where the id belongs to
something else entirely.

**It resolves by walking `[id]` and comparing in JavaScript, never by building a CSS selector.**
An id is legal in HTML in shapes that are a `SyntaxError` inside a selector — which this repo has
already paid for once, in the colons `useId()` returns. `[...root.querySelectorAll('[id]')].find(
e => e.id === id)` has no escaping hazard at all, and a test tree is small enough that the cost is
not worth a bug.

### What happens when no resolver is supplied

**It throws.** Not "fall back to a presence check" — that would silently rebuild the hole this
batch exists to close, in the one layer where a false claim is worst. Throwing is also the policy
the file already has for its two other programming errors: an unknown requirement key, and a
`roles.element` requirement whose pattern has no `ELEMENT_ROLE` entry. Its header states the
reason: *"`null` is never a fallthrough"*, because the cheapest way to silence a false report is to
write a fabricated exception into a binding, which corrupts the debt record the layer exists to
keep honest.

The throw fires only when a pattern actually carries an IDREF requirement, so a suite for a pattern
that has none is unaffected and needs no change.

### What a resolved reference does and does not prove

It proves the id names an element in the rendered tree. It does **not** prove that element is the
right one — a tab whose `aria-controls` resolved to another tab rather than to its panel would pass.
Closing that needs the pattern to say what kind of element the reference must land on, which is a
larger change to the pattern schema and is **not** in this batch. The gap is recorded rather than
quietly left, because it is exactly the shape of gap this batch is closing one level down.

---

## Part 2 — Checking "each"

### The mechanism

`subjects[key]` may now be an **array**. When it is, every element in it is evaluated and the
requirement is met only if **all** of them meet it. A single element keeps working exactly as it
does today for every requirement that is not quantified.

### The curated map, and why it is curated

A `QUANTIFIED` set, keyed `pattern:requirement`, names the requirements a suite must satisfy with a
collection. Passing a single element for one of them **throws**, because checking one is precisely
the defect — a suite that hands over the one element it knows is correct proves nothing about the
others, which is what happened in 8C6.

It is hand-curated and not derived, for the reason measured above: the prose scan misses
`tabs:states.selected`. Deriving it would build the same class of false negative the layer already
rejected once.

Its opening contents, each verified against both the pattern file that declares it and the
evaluator's own `DECIDABLE` set:

- `listbox:states.selected` — true on each selected option, false on the rest
- `tabs:roles.controls` — each tab references its tabpanel
- `tabs:states.selected` — true on the active tab, false on the rest

**Two requirements whose prose quantifies are deliberately excluded, for two different reasons.**
Both are recorded beside the map, and both are covered by its staleness rule.

`feed:states.posinset` is excluded because it is **behavioural, not decidable**. It sits in the
evaluator's `BEHAVIOURAL` set — its prose carries a *when* (`aria-posinset`/`aria-setsize` on each
article, "or -1 for setsize when the total is not yet known"), and a snapshot of one element cannot
answer a conditional claim. `evaluate()` returns `null` for it and a suite records a single verdict
after acting on the tree. There is no per-element verdict to quantify over, so putting it in the
map would be asking for something the layer cannot produce. **This is the rule the map's second
staleness clause exists to enforce, and this entry is the case that proves the clause is not
theoretical**: the first draft of this spec listed it, and the same draft demanded two paragraphs
later that every key be decidable.

`navigation:roles.label` is excluded for a different reason: it quantifies over navigation
landmarks *on a page*, and only *when more than one exists*. A component-level suite renders one
component; requiring a collection there would force fixtures to render two navigation landmarks to
satisfy a rule that is not a claim about the component at all.

### Its staleness rule

The map carries the same bidirectional discipline `EXEMPT` and `COVERED` carry, and the gate's own
test asserts it:

- every key must name a pattern that exists and a requirement that pattern declares;
- every key must name a requirement the evaluator can decide per element (a `DECIDABLE` one), since
  an undecidable requirement has no per-element verdict to quantify;
- both exclusions — `feed:states.posinset` and `navigation:roles.label` — must also resolve to real
  pattern requirements, so neither can outlive the requirement it excuses.

What cannot be machine-checked is whether a requirement's prose *means* "each". That is human
judgement, it is stated here rather than implied, and it is why the map is a record with reasons
rather than a computation.

---

## Part 3 — The logical sides

`check:dimensions`' `PROPS` governs `padding` and `margin` in both physical and logical form, and
`border`/`inset` in physical form only. The logical sides — `borderInlineStart`, `borderBlockEnd`,
`insetInlineStart`, `insetBlock` and the rest of both families — are ungoverned.

There are **zero** uses today, so this is a hole rather than a live violation: the next component
reaching for a logical border width finds no gate there. This is the same shape as the
`padding-inline-start` hole that 8C5 found and walked straight through with its own split of a
shorthand.

Because there is nothing to fix, the only proof the change works is an **induced** violation:
write one, watch the gate fail, remove it, watch the gate pass. A ratchet that catches nothing on
the day it lands is invisible unless it is induced.

---

## Part 4 — The blast radius, measured

Three of the ten covered bindings carry an affected requirement, all React:

| covered binding | pattern | what changes for its suite |
|---|---|---|
| `SideNavCollapsible:react` | `disclosure` | `roles.controls` must now resolve |
| `Tabs:react` | `tabs` | `roles.controls` must resolve **and** be checked over every tab; `states.selected` over every tab |
| `Tooltip:react` | `tooltip` | `roles.describedby` must now resolve |

The other seven are untouched: their patterns carry neither an IDREF nor a quantified requirement,
and the throw fires only where one exists. Both Angular suites are in that group — but the Angular
wrapper still gets the resolver plumbed through, so the two layers stay the same shape and the next
Angular binding that needs one does not have to discover this.

**All three of those suites are expected to still pass**, because all three components are
correct: 8C6 fixed `Tabs`' dangling references, and `SideNavCollapsible` and `Tooltip` were built
with resolving ones. If any of them fails, the change has found a real defect and the defect is
what gets fixed — never the assertion.

---

## Part 5 — Verification

The shared evaluator's own suite is where most of this is proved, and it runs under plain node with
no DOM, which is the point: a stub element and a stub resolver exercise every branch.

- a reference that resolves → met; one that dangles → OVERCLAIM;
- a dangling reference with an exception declared → no problem reported;
- a resolving reference with an exception declared → STALE EXCEPTION;
- a pattern carrying an IDREF requirement with no resolver supplied → **throws**, with a message
  naming the requirement;
- an array subject where every element meets the requirement → met; where one does not → OVERCLAIM
  naming how many failed;
- a single element passed for a `QUANTIFIED` requirement → **throws**;
- every `QUANTIFIED` key and the one exclusion resolve to real pattern requirements.

Both wrappers' failure paths are already tested on the React side by four tests that write
deliberately false bindings to a temp file; the new throws join them.

**What a green run still does not say**, restated because this batch makes the gate stronger and a
stronger gate invites a stronger reading: it still says the declarations are honest, never that a
component is accessible. A resolving `aria-controls` pointing at the wrong element still passes.
Coverage is still 10 of 70 bindings, and the other 60 are exactly as unverified as before.

---

## Part 6 — Out of scope, and still open

- The 89 `default` declarations in `api/components/` that `check:api` reads with zero lines of code.
- That React's checked API surface is its `.d.ts` and never its `.jsx`.
- `check:material` never reading the bridge's 15 selectors, its 14 `dressedBy` claims never being
  verified against the host class they name, and no Material version being recorded or checked
  against `package.json`.
- Whether a resolved reference lands on the **right kind** of element (Part 1's last paragraph).
- Everything in `components-divergences.md`, which Plan 7 sequences last.

## Part 7 — Success criteria

1. A dangling IDREF fails the compliance layer, proven by inducing one against a component that is
   correct today and watching the suite go red.
2. A quantified requirement satisfied by one element and not the others fails, proven the same way.
3. A suite that supplies no resolver for a pattern that needs one throws rather than passing.
4. `check:dimensions` fails on a logical border or inset literal, proven by induction, and reports
   the tree clean once it is removed.
5. `ARENA_CHECK_STRICT=1 bun run check` ends `all 23 step(s) passed`, and `check:compliance` still
   reports 10 of 70 with every coverage claim current.
