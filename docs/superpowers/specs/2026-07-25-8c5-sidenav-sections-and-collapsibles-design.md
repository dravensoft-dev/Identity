# SideNav — sections, collapsible groups, and the compound migration

Design, 2026-07-25. **Scheduled as batch 8C5**, plan at
`docs/superpowers/plans/2026-07-25-8c5-sidenav-sections-and-collapsibles.md`. This file was written
one batch ahead of its plan and carried a `-pending-1` suffix while it had none, because this
repository deletes a spec once its plan has run (`24f250b`) and an unsuffixed spec sitting in this
directory reads as work in flight. It now is, so the suffix is gone and the name follows the batch
convention the other executed specs use.

Cut against the tree at `7640db2` — the commit that brought `SideNav` under contract and
completed Plan C. **This spec breaks that contract**, which is stated first rather than
discovered later.

## What this measured before proposing anything

Every figure below was read off the tree at `7640db2`, not recalled.

- **`SideNav` is contracted and single-layer.** `api/components/SideNav.json` declares four
  members — `items` (required array of `SideNavItem`), `active`, `ariaLabel` (required) and
  `nav` (event, payload `SideNavItem`) — and `api/types/side-nav-item.json` declares the item
  as an object with `id`, `label`, `icon` and `href`. `check:api` stands at **46 contracts
  across 66 layer implementations**.
- **The compound shape is precedent, not invention.** `api/components/Table.json` declares
  `"content": { "form": "slot" }` for its rows, with `TableRow` and `TableCell` contracted
  separately. `RadioGroup`/`Radio` is the same shape one size down. CLAUDE.md states the rule:
  *"When a consumer needs their own content inside ONE item of something Arena draws, make the
  item a component"*, and **none of the props the parent injects is a member of any contract** —
  `Radio.json` declares none of the `name`/`checked`/`onSelect` that `RadioGroup` injects.
- **There is no `disclosure` pattern.** `behaviour/patterns/` holds twenty files and none of
  them covers a show/hide button. A new one is owed.
- **The `navigation` pattern says nothing about items.** It requires exactly two things:
  `roles.element` (a native `nav`) and `roles.label` (a unique name per landmark). So
  restructuring what lives *inside* the landmark leaves `SideNav.behaviour.json` — which binds
  `navigation` with `"exceptions": []` — true and untouched.
- **Four React call sites**, all of which this breaks: `frameworks/react/ui_kits/console/Shell.jsx`,
  `frameworks/react/components/navigation/navigation.card.entry.jsx`, `SideNav.prompt.md`, and
  `frameworks/react/test/side-nav.test.jsx` (twelve tests).
- **`frameworks/angular/behaviour-delegated.json:106`** records that `mat-nav-list` provides
  `SideNav`'s anchor-or-button distinction, active state and keyboard behaviour.

## The design

### One component becomes four

`SideNav` becomes a compound component. Its children are the structure, and each kind of child
is its own contracted component.

| component | members |
|---|---|
| `SideNav` | `ariaLabel` (string, required, guarded), `active` (string), `indentStep` (number, default 3), `content` (slot), `nav` (event, payload `string`) |
| `SideNavItem` | `id` (string, required), `label` (string, required), `icon` (string), `href` (string) |
| `SideNavSection` | `label` (string, required), `content` (slot) |
| `SideNavCollapsible` | `id` (string, required), `label` (string, required), `icon` (string), `defaultExpanded` (boolean, default false), `content` (slot), `toggle` (event, payload `boolean`) |

`api/types/side-nav-item.json` is **deleted** and `SideNav.items` with it. The item stops being
data Arena reads and becomes an element the consumer writes.

```jsx
<SideNav ariaLabel="Primary" active={route} onNav={setRoute}>
  <SideNavItem id="home" label="Home" href="#home" />

  <SideNavSection label="Workspace">
    <SideNavItem id="projects" label="Projects" icon="ph-bold ph-squares-four" href="#projects" />
    <SideNavCollapsible id="deploys" label="Deployments" icon="ph-bold ph-rocket-launch">
      <SideNavItem id="prod" label="Production" href="#prod" />
      <SideNavItem id="staging" label="Staging" href="#staging" />
    </SideNavCollapsible>
  </SideNavSection>
</SideNav>
```

### What the parent injects, and why none of it is a member

`SideNav` walks its children and injects with `cloneElement`: the `aria-current="page"` on the
item whose `id` matches `active`, the nesting depth each child sits at, and the handler that
reports `nav`. A child declares none of these, exactly as `Radio` declares none of what
`RadioGroup` gives it. **The parent owns where an item goes; the item owns what it says.**

### `nav` carries an id, and that reverses an earlier decision on purpose

Plan 8C4 decided that `SideNav.nav` should carry the whole `SideNavItem`, on the `Breadcrumbs`
precedent — *"the platform event leaves the payload and the item alone travels."* **That
decision is reversed here, and not because the reasoning changed: the object it referred to
stops existing.** Under the compound shape there is no item datum to carry — the consumer wrote
the element and already holds everything on it. So `nav` carries the activated item's `id`, a
`string`, and the event stays on the parent because that is where `RadioGroup` keeps it.

The `href` branch is untouched: an item with `href` renders an `<a>`, one without renders a
`<button>`. `preventDefault()` remains unreachable from the handler, as `Breadcrumbs` and
8C4's `SideNav` both already record.

### Sections wrap, and using one is optional

`SideNavSection` receives children and wraps them in a group whose accessible name is its
`label`, so the grouping a sighted user sees is the grouping a screen reader announces. **A
section always has children** — a childless section is not a legal shape. What is optional is
having sections at all: loose `SideNavItem`s at the root are valid and may sit beside sections.

This is deliberate. Allowing a childless section would give the component two forms that a
single binding cannot describe — the fifth instance of the *"true in one variant, false in the
other"* limit the repository already carries for `Tag`, `Skeleton`, `Table` and `Pagination`,
and which has no fix. One component, one shape, one truth in the binding.

### Indentation is a multiplier, never a length

`indentStep` is a number that multiplies `--sp-1`, applied per nesting level:
`calc(var(--sp-1) * indentStep * depth)`.

**A CSS string was rejected.** CLAUDE.md's rule is that a dimension in a framework layer is a
token or a derivation of tokens, and a caller-supplied `"1.5rem"` is neither — it would stop
re-densifying inside `.arena-compact`, and **no gate would catch it**, because
`check:dimensions` scans source and not the values a caller passes in. A multiplier of a token
keeps the whole chain intact.

### Collapsibles nest arbitrarily, and own their own state

A `SideNavCollapsible` may contain items, sections and other collapsibles, to any depth. The
indent compounds with depth, which is why `indentStep` is a step rather than a total.

The expanded state lives in the component, seeded by `defaultExpanded` and reported through
`toggle`. **The parent additionally expands the collapsible whose subtree contains `active`** —
what every real sidebar does, and what stops a consumer from having to re-derive the open group
on every route change. That is implicit behaviour and `SideNav.prompt.md` must say so plainly.

## Behaviour, and one thing deliberately not claimed

`behaviour/patterns/disclosure.json` is new, citing APG's Disclosure (Show/Hide) pattern.
`SideNavCollapsible` binds it: a real `<button>` carrying `aria-expanded`, with `aria-controls`
naming the region it toggles.

**This is not a treeview, and the spec refuses to claim it is.** With arbitrary nesting the
structure resembles one, and APG's treeview pattern would demand `aria-level` on every node, a
roving tab stop and four-direction arrow navigation. None of that is designed here. Each
collapsible is an independent disclosure, which is what production sidebars ship and what a
`nav` landmark full of links actually is. **What that costs — no `aria-level`, no arrow keys —
belongs in the binding and in CLAUDE.md's Known debt**, stated rather than left for a reader to
discover.

`SideNavItem` binds `none`, and its reason must say why: it renders an `<a>` or a `<button>`
depending on `href`, so no single interactive pattern always applies. That is the `Tag` problem
— a pattern that holds only sometimes — and `Tag` handled it by binding `button` with an
exception, which leaves a reader of the binding alone believing the pattern always applies.
Binding `none` with an honest reason is the better of two imperfect options; the schema still
cannot express the real answer.

`SideNav` keeps `navigation` with no exceptions. `SideNavSection` binds `none`.

## Contracts

`check:api` **46/66 → 49/69**: three new contracts, one layer each. Every one is React-only,
because Angular delegates `SideNav` to `mat-nav-list` — which is the same reason all of Plan C's
subjects were single-layer.

**One consequence for Plan D, recorded now:** `behaviour-delegated.json`'s `SideNav` entry
claims Material provides this control. That claim is defensible for a flat list of links and
becomes questionable for named sections and nested disclosure groups. Nothing in this spec
resolves it; it is flagged so Plan D does not inherit it silently.

## Testing

- A DOM-free suite per component for shape and guards, in `frameworks/react/test/`.
- A DOM suite in `frameworks/react/test-dom/` for expand/collapse, the injected `aria-current`,
  the computed indent and focus behaviour. None of these components binds `grid`, so the
  standing hand-test rule does not apply and render suites are permitted.
- `SideNavCollapsible:react` joins `check:compliance`'s `COVERED` with its `disclosure` binding
  verified by that suite. Its `behavioural` map must have a real assertion behind every verdict
  it declares — a declared verdict with no assertion pins a claim the suite does not check.
- The R4 proofs follow the batch's established shape: induced asymmetrically, each failing
  alone, `sha256` byte-identical after restore.

## Costs accepted

1. **A contract that shipped is broken one batch later.** `SideNav.items` and `SideNavItem`
   arrive in `7640db2` and leave here, with no release between them, so `CHANGELOG.md`'s
   `[Unreleased]` will record both movements.
2. **Every call site breaks**, including the Delivery Console's `Shell.jsx`.
3. **The Tailwind manifest must grow slots** for the section, the collapsible trigger and the
   nested region — and nothing machine-compares a manifest against the component it mirrors,
   which CLAUDE.md already records as an open problem.
4. **Auto-expanding on `active` is implicit behaviour.** It is the right default and it is still
   magic; the only mitigation is documenting it.
5. **A fifth `none` binding with a prose reason**, because the binding schema still cannot say
   "this pattern applies only when `href` is absent."

## What this does not do

- It does not build an Angular implementation. These are React-only, like every Plan C subject.
- It does not make `SideNav` a treeview, and says so in the binding.
- It does not add keyboard navigation between items beyond what the browser gives a list of
  links and buttons.
- It does not touch `Menu`, `Pagination`, or anything else 8C4 contracted.
- It does not delete `frameworks/react/ui_kits/console/Icon.jsx`, which 8C4 left dead. That is
  a separate cleanup and is recorded in 8C4's own close-out.
