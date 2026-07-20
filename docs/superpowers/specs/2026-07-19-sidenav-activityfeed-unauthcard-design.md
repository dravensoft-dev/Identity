# SideNav, ActivityFeed and UnauthCard — Design

**Status:** approved in design
**Date:** 2026-07-19
**Execution order:** before 5a. The two parity plans consume the roster this changes.
**Depends on:** nothing unexecuted. Plan 4.5 is landed.
**Blocks:** `2026-07-18-5a-angular-primitive-parity.md` and
`2026-07-18-5b-tailwind-manifest-parity.md`, both of which are written against a fixed
component roster and gain entries here.

## Problem

An audit of `frameworks/react/ui_kits/console/` on 2026-07-19 asked a narrow question —
does the example app build anything by hand that the library already ships? — and found
two answers of two different kinds.

The first kind was duplication, and it is already fixed: the Deployments table was a
hand-rolled CSS grid where `Table` existed, and the dashboard's metric tiles were
hand-rolled where `StatCard` existed. Both now read the component.

The second kind is this spec. Three things in the console are built by hand **because
the library has nothing to build them from**:

| Site | What it is |
|---|---|
| `Shell.jsx:24` (`NAV.map`) | the sidebar's navigation list — icon, label, active state |
| `ProjectScreen.jsx:73` (`ACTIVITY.map`) | the Activity tab's event feed |
| `LoginScreen.jsx:11` (the panel `<div>`) | the centred panel every signed-out screen needs |

Line numbers are from `6f23011` and drift; match on the named landmark.

None is a console quirk. Every product with a session has a side navigation, every
product with history has an activity feed, and every product with an account has at
least one screen shown before the user has one. The console is only where the gap
became visible.

The cost of leaving them is not that the example is impure. It is that **the second
product to need a side nav will write a different one**, and the two will disagree about
the active state's colour, the icon's size, and whether an item is a link or a button.
That is the drift the whole system exists to prevent, and the reason `README.md` keeps
an *Intentional additions* section arguing every component the library holds.

## Design

### 1. The unit is small; the product composes

`Shell.jsx` today packages five things: the brand lock-up, the navigation list, the user
footer, the page header, and the scrolling content area. The temptation is to lift the
whole frame into an `AppShell` and delete `Shell.jsx`.

**Rejected, deliberately.** An `AppShell` is the largest component in the library by a
wide margin and its boundary is the blurriest — every product wants one more slot, and
the component accretes props until it is a configuration language. The three components
here are each small enough to describe in a sentence, test alone, and change without
consulting their consumers.

The same principle decided the third component's shape. An `UnauthScreen` that owned the
viewport would be **terminal**: adding "sign in with Google" means adding a prop, and so
does the "or" divider, the legal footnote, and the resend timer. A `Card` is composed
*into*: each of those is a component placed inside it, and `UnauthCard`'s signature never
moves. It also preserves a property the library has today and would otherwise have lost —
**everything Arena ships is a piece, not a page.**

### 2. `SideNav` — `frameworks/react/components/navigation/`

```jsx
<SideNav
  ariaLabel="Primary"
  active="dashboard"
  onNav={(id) => setRoute(id)}
  items={[
    { id: 'dashboard', icon: <Icon name="grid" />, label: 'Projects', href: '/projects' },
    { id: 'deploys',   icon: <Icon name="rocket" />, label: 'Deployments' },
  ]} />
```

Renders a `<nav aria-label>` wrapping a vertical list. Active item: `--crimson-soft`
background, `--crimson` text, `--fw-semibold`. Inactive: transparent, `--mute`,
`--fw-medium`. Both read `--dz-text`, so the nav re-densifies inside `.arena-compact`
like every other control.

Two departures from the console's current markup, both corrections rather than
translations:

**`icon` is a `ReactNode`, not a string.** The console passes `icon: 'grid'` and resolves
it through its own local `Icon.jsx`. A `SideNav` that accepted strings would couple the
library to a component the library does not ship (see *Open questions*).

**An item with `href` renders `<a>`; without one it renders `<button>`.** The console
uses a button for everything, which is an accessibility defect: a control that navigates
must be a link, so it can be opened in a new tab, have its address copied, and be
announced as a link. Items that only change local state stay buttons. Angular Material
draws the same distinction (`<a mat-list-item>` for navigation), which is corroboration
rather than coincidence.

`aria-current="page"` marks the active item.

### 3. `ActivityFeed` — `frameworks/react/components/display/`

```jsx
<ActivityFeed items={[
  { id: 1, actor: 'ana@',   action: 'approved the release', target: 'build #4821', time: '2h ago' },
  { id: 2, actor: 'diego@', action: 'opened incident',      target: 'checkout latency', time: '3h ago', tone: 'danger' },
]} />
```

The component knows the grammar — someone did something to something, then — and renders
it with the typography the console already established: `actor` in `--bone`, `action` in
`--bone-dim`, `target` in mono `--gold`, `time` in `--mute` pushed right. A tone dot
leads each row.

**`tone` uses Badge's vocabulary** (`neutral | accent | gold | success | warning | danger
| info`), defaulting to `accent`. This is the third component to adopt that list —
`Badge` defines it, `StatCard` took it for its value — and a fourth vocabulary that is
nearly the same as the first is how they drift apart.

**`renderItem(item)` is the escape hatch**, exactly the shape `Table` already establishes
with `columns[].render`. An event with no actor, two targets, or an avatar in place of the
dot renders its own line without abandoning the component. This is the reason a strict
four-part grammar was rejected: the first case that does not fit would send its author
back to hand-rolled markup, which is where this conversation started.

### 4. `UnauthCard` — `frameworks/react/components/display/`

```jsx
<UnauthCard
  brand={<Rotor size={40} />}
  eyebrow="Delivery console"
  title="Welcome back"
  footer={<a href="/reset">Forgot your password?</a>}>
  <Input label="Email" value={email} onChange={onEmail} />
  <Input label="Password" type="password" />
  <Button variant="primary" full>Sign in</Button>
</UnauthCard>
```

**It knows nothing about credentials** — no `email`, no `password`, no `onSubmit`, no
validation. The moment it knows about a password field it stops serving "Check your
inbox", "This link expired", and "Enter your two-factor code", which are the screens that
justify it. Fields are composed from `Input` and `Button`, which exist.

**It renders `Card` internally** for the panel surface. Adding a second definition of a
bordered, rounded, shadowed panel would be the duplication this spec exists to remove.
What `UnauthCard` adds over a bare `Card` is exactly four things, and if it were not
these four it would not deserve to exist: the brand slot above the panel, the constrained
width the figure wants, the more generous padding of a single-task panel, and the centred
muted footer below it.

**It does not centre itself.** The product owns the page. A card that assumed it was
alone in the viewport could not sit in a split layout beside an illustration, or inside a
modal. The `.prompt.md` documents the three-line centring wrapper; the component does not
impose it.

### 5. What the console becomes

- `Shell.jsx` keeps composing brand, nav and user — the nav list becomes `<SideNav>`.
- `ProjectScreen.jsx`'s Activity tab becomes `<ActivityFeed>`; the positional tuples in
  `ACTIVITY` become named objects, which is a readability gain on its own.
- `LoginScreen.jsx` keeps its centring wrapper and its fields, and the panel becomes
  `<UnauthCard>`.

Each of the three is example code demonstrating a component, which is what the console is
for.

### 6. Parity, and why one of the three is asymmetric

Verified against Angular Material's documentation rather than assumed: Material covers
side navigation with **two** APIs — `mat-sidenav`/`mat-drawer` is the collapsible
*container*, and `mat-nav-list` with `<a mat-list-item [activated]>` is the *item list*.
Arena's `SideNav` corresponds to the second.

Plan 5a's 18 primitives are, by its own statement, "the primitives Material does not
provide". `mat-nav-list` provides this one. So `SideNav`'s Angular story is not a new
primitive — it is a token bridge in `theme/arena-material.css`, which is the file that
exists for exactly this case.

| | 5a (Angular) | 5b (Tailwind) |
|---|---|---|
| `SideNav` | **no primitive** — `mat-nav-list` bridged in `arena-material.css` | manifest |
| `ActivityFeed` | `arena-activity-feed` | manifest |
| `UnauthCard` | `arena-unauth-card` | manifest |

5a goes from 18 primitives to **20**, plus one Material bridge entry. 5b gains **three**
manifests. Plan 6 inherits both counts.

## Non-goals

- **No `AppShell`.** Argued in §1. If a `layout/` group is ever justified it should be
  born with more than one member.
- **No auth logic anywhere.** `UnauthCard` is a frame. Sessions, tokens, providers and
  validation are the product's.
- **No companion components yet** — no `ProviderButtons`, no `OrDivider`, no resend
  timer. They have no consumers. `UnauthCard`'s shape admits them later without changing
  its signature, which is the whole point of it being a card.
- **No change to `Shell.jsx`'s frame.** The header, the content area and the sidebar
  chrome stay as they are; only the nav list is extracted.
- **No new tokens.** All three are built from what the token layer already holds. If one
  turns out to need a value with no token behind it, the token is what is missing — add
  it first, per `CLAUDE.md`.

## Open questions

1. **`console/Icon.jsx` is a component the library does not have.** React ships no `Icon`;
   the console wraps Phosphor's webfont locally, and the Angular layer has an icon
   manifest React has no counterpart to. `SideNav` taking a `ReactNode` sidesteps the
   coupling but does not close the gap. Worth its own decision, not this spec's.
2. **The wordmark is written twice and differently** — `Shell.jsx:22` renders
   "Dravensoft" in a single colour, `LoginScreen.jsx:14` splits "Draven" + "soft" across
   `--bone` and `--mute`. The approved brand manual (`Dravensoft Identity.dc.html`)
   renders the wordmark as `DRAVEN` + `SOFT` with the second half in the `.soft` class
   throughout, which makes `LoginScreen` the closer of the two and `Shell` the one to
   reconcile. Unresolved, and deliberately outside this spec: it is a brand decision,
   and the manual is the authority rather than either console screen.
3. **Does `ActivityFeed` need pagination or a "load more" affordance?** The console shows
   four rows and a real feed does not. Deferred until a consumer has the problem.

## Verification

- `bun run check` passes — the three new components are scanned by
  `check:dimensions` like every other file under `frameworks/`, so a bare literal in any
  of them fails the build.
- **Each component is a quartet**: `X.jsx`, `X.d.ts` with a `@startingPoint` comment,
  `X.prompt.md` with Do/Don't per README's H10 rule, and an entry in the group's
  `*.card.html`. `SideNav` joins `navigation.card.html`. `ActivityFeed` and `UnauthCard`
  get **their own card page** rather than joining `display.card.html`: that page is
  already declared `700x460` and carries Card, Badge, Tag and StatCard, and a signed-out
  panel shown at a third of its width would misrepresent it. One new page, both
  components, sized to fit them honestly.
- **`README.md` gains an entry per component under *Intentional additions***, stating what
  each is for. That section is the repo's record of why the roster is what it is, and an
  addition that skips it is an addition nobody argued.
- **By eye, against the console:** the sidebar's active and inactive items, the Activity
  tab, and the login panel must be unchanged except for the corrections this spec names
  (the nav's anchors, the avatar already landed). Any other visible difference is a
  defect.
- **Accessibility, checked by hand:** the nav is a `<nav>` with a label, the active item
  carries `aria-current="page"`, items with `href` are anchors, and the feed is a list
  rather than a stack of divs.

## Affected files

**New** — nine files, three quartets minus the demo entries:
`navigation/SideNav.{jsx,d.ts,prompt.md}`,
`display/ActivityFeed.{jsx,d.ts,prompt.md}`,
`display/UnauthCard.{jsx,d.ts,prompt.md}`.

**Modified:** `navigation/navigation.card.html`, `display/display.card.html`;
`ui_kits/console/{Shell,ProjectScreen,LoginScreen}.jsx`; `README.md`; `CHANGELOG.md`.

**Modified downstream:** `docs/superpowers/plans/2026-07-18-5a-angular-primitive-parity.md`
(two primitives, one Material bridge entry, count 18 → 20),
`docs/superpowers/plans/2026-07-18-5b-tailwind-manifest-parity.md` (three manifests).

**Unchanged, explicitly:** every file under `tokens/`, `styles.css`, and every gate in
`scripts/`. This spec adds no token and changes no rule.

## Sequencing

```
4.5 token debt + gate blind spots   <- executed
    THIS SPEC                       <- the roster changes here
5a  Angular primitive parity
5b  Tailwind manifest parity
5.5 chart geometry token target     <- draft, unapproved
6   four-package build + publish
```

It goes before 5a for one reason: both parity plans enumerate the components they cover,
and a roster that grows after they are written means editing them twice. Landing the
React side first lets 5a and 5b be edited once, with the final roster in hand.
