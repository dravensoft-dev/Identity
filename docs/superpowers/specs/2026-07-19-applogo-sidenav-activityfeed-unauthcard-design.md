# AppLogo, SideNav, ActivityFeed and UnauthCard — Design

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

The second kind is this spec. Four things in the console are built by hand **because
the library has nothing to build them from**:

| Site | What it is |
|---|---|
| `Shell.jsx:20-23` / `LoginScreen.jsx:13-14` | the brand lock-up — mark beside the product's name |
| `Shell.jsx:24` (`NAV.map`) | the sidebar's navigation list — icon, label, active state |
| `ProjectScreen.jsx:73` (`ACTIVITY.map`) | the Activity tab's event feed |
| `LoginScreen.jsx:11` (the panel `<div>`) | the centred panel every signed-out screen needs |

Line numbers are from `6f23011` and drift; match on the named landmark.

The first row already caused a defect, which is the clearest evidence the rest are not
hypothetical. The approved brand manual (`Dravensoft Identity.dc.html`) defines three
lock-up variants: *Primary · horizontal* and *Vertical · stacked* pair a crimson mark
with `DRAVEN` + `SOFT`, the second half in `--mute`; *Monochrome · single ink* pairs a
`--bone` mark with an undivided `DRAVENSOFT`. `LoginScreen` renders Primary correctly.
`Shell` renders **half of each** — a crimson mark beside a single-ink wordmark, which is
no variant at all. Two screens assembled the same figure by hand and one of them got it
wrong, because nothing in the code holds the rule the manual states.

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
the component accretes props until it is a configuration language. The four components
here are each small enough to describe in a sentence, test alone, and change without
consulting their consumers.

The same principle decided `UnauthCard`'s shape. An `UnauthScreen` that owned the
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
  brand={<AppLogo size="md" mark={<img src=".../rotor-crimson.svg" alt="" />} name="Draven" dim="soft" />}
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

### 5. `AppLogo` — `frameworks/react/components/brand/`

```jsx
<AppLogo
  size="sm"
  mark={<img src="../../../assets/rotor-crimson.svg" alt="" />}
  name="Draven"
  dim="soft" />
```

**Nothing defaults.** `mark` and `name` are required, and that is a licensing decision
rather than a style one: Arena ships MIT, so a consumer copies this tree into their own
product. A component that renders Dravensoft's mark when you pass it nothing would ship
someone else's trademark by omission — the developer who never reads the props gets a
brand they have no right to. Requiring both means the first render is either their brand
or a type error, and never ours by accident.

For the same reason, the mark is passed as an asset rather than drawn: each call site
names `assets/rotor-*.svg` explicitly, so what brand is being rendered is visible at the
point of use instead of buried in the component's default.

**`variant` is not a prop.** The manual's Primary/Monochrome distinction is two
decisions, and both are already expressible without one: the mark's ink is whichever of
`rotor-crimson.svg` / `rotor-bone.svg` / `rotor-ink.svg` the consumer passes, and the
wordmark's is whether `dim` is present. A `variant` prop would be a third way to say the
same two things, and the three could then disagree.

**`size` picks both halves of the lock-up, not the mark alone.** The consumer's `mark`
node carries no dimensions; `AppLogo` sizes the slot it sits in and the mark fills it.
Otherwise a mark with its own `width` and a `size` prop would fight, and which one won
would decide how the mark sat against the wordmark — the one relationship a lock-up
exists to hold.

**The sizes are tokens, and a fixed repertoire rather than a ratio.** Both halves of that
sentence are decisions.

*Tokens*, because once `mark` and `name` are the consumer's, these numbers stop being
Dravensoft's identity and become the system's answer to "how big is a small logo". The
reasoning that exempts `Rotor`'s size — a brand asset is not themeable — does not reach
them: they are a scale, and Arena's scales are tokens. So `AppLogo` needs **no `EXEMPT`
entry at all**; it reads `var(--logo-*)` like any other component reads any other
dimension.

*A fixed repertoire*, because a single mark-to-wordmark ratio cannot be right at every
step. A small lock-up needs proportionally larger text to stay legible, and forcing one
constant across the scale would either shrink the small wordmark below reading size or
inflate the large one. The eight numbers are declared, and the proportions that fall out
(0.57, 0.60, 0.63, 0.63) are a consequence rather than a rule.

| `size` | `--logo-mark-*` | `--logo-text-*` | anchor |
|---|---|---|---|
| `sm` | 30 | 17 | exactly what `Shell` renders today |
| `md` | 40 | 24 | exactly what `LoginScreen` renders today |
| `lg` | 54 | 34 | the manual's Primary · horizontal |
| `xl` | 124 | 78 | the manual's large specimen — the hero case, where the lock-up is the only thing on the screen |

`sm` and `md` reproduce both console sites in both dimensions, so **nothing visible moves
when the two screens migrate**. `lg` and `xl` come from the approved manual, so no number
here was invented.

The family goes in `tokens/src/spacing.json` beside `dz`, which is the precedent: `dz`
holds control text sizes and lives there rather than in `typography.json`.

`orientation` is `'horizontal' | 'vertical'`, the manual's first two variants.

**Gate consequence, which fails the build if missed.** `EXEMPT` holds three brand entries
today: `Rotor.jsx:width:48` and the two call sites, `Shell.jsx:width:30` and
`LoginScreen.jsx:width:40`. The call-site entries exist because `<Rotor size={30} />`
passes a raw number through the `PASSTHROUGH` rule. `<AppLogo size="sm" />` passes a named
step, which carries no dimension and needs no forgiveness — so both entries match nothing
the moment the screens migrate, and a stale exemption fails `check:dimensions` by design.

Deleting them is not cleanup after the fact; it is the improvement itself, and it must
happen in the same commit as the migration. **Eight entries become six**, and `AppLogo`
adds none.

### 6. What the console becomes

- `Shell.jsx` keeps composing brand, nav and user — the lock-up becomes `<AppLogo size="sm">`
  (which also fixes its mixed variant), and the nav list becomes `<SideNav>`.
- `LoginScreen.jsx`'s lock-up becomes `<AppLogo size="md">`.
- `ProjectScreen.jsx`'s Activity tab becomes `<ActivityFeed>`; the positional tuples in
  `ACTIVITY` become named objects, which is a readability gain on its own.
- `LoginScreen.jsx` keeps its centring wrapper and its fields, and the panel becomes
  `<UnauthCard>`.

Each of the four is example code demonstrating a component, which is what the console is
for.

### 7. Parity, and why one of the four is asymmetric

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
| `AppLogo` | `arena-app-logo` | manifest |
| `SideNav` | **no primitive** — `mat-nav-list` bridged in `arena-material.css` | manifest |
| `ActivityFeed` | `arena-activity-feed` | manifest |
| `UnauthCard` | `arena-unauth-card` | manifest |

5a goes from 18 primitives to **21**, plus one Material bridge entry. 5b gains **four**
manifests. Plan 6 inherits both counts.

## Non-goals

- **No `AppShell`.** Argued in §1, and settled rather than deferred: the decision is that
  the frame stays the product's to compose, not that the library has not got to it yet.
  A future proposal should have to beat §1's argument, not merely find this line.
  The question of a `layout/` group went with it — `UnauthCard` is a card and lives in
  `display/`, so nothing here is a page and no group is needed for one.
- **No auth logic anywhere.** `UnauthCard` is a frame. Sessions, tokens, providers and
  validation are the product's.
- **No companion components yet** — no `ProviderButtons`, no `OrDivider`, no resend
  timer. They have no consumers. `UnauthCard`'s shape admits them later without changing
  its signature, which is the whole point of it being a card.
- **No change to `Shell.jsx`'s frame.** The header, the content area and the sidebar
  chrome stay as they are; only the nav list is extracted.
- **No new tokens except `logo`.** `SideNav`, `ActivityFeed` and `UnauthCard` are built
  entirely from what the token layer already holds, and if one turns out to need a value
  with no token behind it, the token is what is missing — add it first, per `CLAUDE.md`.
  The eight `--logo-*` steps in §5 are the single exception, and they exist because
  `AppLogo` renders a scale rather than a brand.
- **No change to `Rotor`.** It keeps its `size`, its `color` and its `EXEMPT` entry. The
  two components now justify their geometry differently — `Rotor` draws Dravensoft's mark
  and is not themeable, `AppLogo` sizes whatever mark it is given and is — and that
  asymmetry is real rather than an oversight. See *Open questions*.

## Open questions

1. **`console/Icon.jsx` is a component the library does not have.** React ships no `Icon`;
   the console wraps Phosphor's webfont locally, and the Angular layer has an icon
   manifest React has no counterpart to. `SideNav` taking a `ReactNode` sidesteps the
   coupling but does not close the gap. Worth its own decision, not this spec's.
2. **What happens to `Rotor` once `AppLogo` exists.** `Rotor` stays — it is the animated
   mark for splash and loading states, which `AppLogo` does not do. But the console's two
   lock-ups were its only static call sites, and after this they pass an SVG from
   `assets/` instead. Two loose ends follow, both deliberately left: whether `Rotor`
   should keep its `size`/`color` props once nothing composes it into a lock-up, and
   whether its `EXEMPT` entry still reads correctly now that a sibling brand component
   sizes itself from tokens on the opposite reasoning. The two arguments are each sound
   for their own component, but a reader meeting both at once deserves a better answer
   than this spec gives.
3. **Does `ActivityFeed` need pagination or a "load more" affordance?** The console shows
   four rows and a real feed does not. Deferred until a consumer has the problem.

## Verification

- `bun run check` passes — the four new components are scanned by
  `check:dimensions` like every other file under `frameworks/`, so a bare literal in any
  of them fails the build.
- **Each component is a quartet**: `X.jsx`, `X.d.ts` with a `@startingPoint` comment,
  `X.prompt.md` with Do/Don't per README's H10 rule, and an entry in the group's
  `*.card.html`. `SideNav` joins `navigation.card.html`. `AppLogo` joins
  `brand.card.html` beside `Rotor`, at every size — `xl` is the one that most needs
  seeing, since it is the case no existing specimen covers. `ActivityFeed` and
  `UnauthCard` get **one new card page each**. Neither joins `display.card.html`, which
  is declared `700x460` and already carries Card, Badge, Tag and StatCard; and they do
  not share a page with each other either, because they are opposite shapes — a wide
  centred panel and a dense narrow list. Any single `viewport` would suit one and
  misrepresent the other, and a specimen that misrepresents its component is worse than
  no specimen.
- **`EXEMPT` goes from eight entries to six**, and `bun run check:dimensions` must report
  "no stale exemptions". This is the one mechanical trap in the plan: deleting the two
  `Rotor` call-site entries is not optional cleanup, it is what keeps the build green, and
  it has to land in the same commit as the migration.
- **The `logo` family clears the full token chain**, in the task that adds it:
  `bun run build:tokens`, then `check-dtcg.mjs`, `check-tokens-generated.mjs` and
  `check-ramp.mjs` all exit 0. Never hand-edit `tokens/spacing.css`.
- **Every `--logo-*` step reaches the Tailwind layer**, in the same task — a utility in
  `frameworks/tailwind/theme.css` or an entry in `check-tailwind-coverage.mjs`'s
  `EXCLUDED` with a reason. `check:coverage` fails otherwise, and a stale exclusion fails
  too.
- **`sm` and `md` render identically to today.** Read the computed `width` of the mark and
  `font-size` of the wordmark in both `Shell` and `LoginScreen` before and after; they
  must be 30/17 and 40/24. The wordmark's *colour* changes in `Shell` — that is the mixed
  variant being fixed — but no dimension moves.
- **`AppLogo` renders nothing without `mark` and `name`.** A test asserts this rather than
  a comment claiming it — the MIT argument in §5 is only true if the absence of a default
  is enforced.
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

**New** — fourteen files: four quartets, two of whose demo entries are new pages.
`brand/AppLogo.{jsx,d.ts,prompt.md}`,
`navigation/SideNav.{jsx,d.ts,prompt.md}`,
`display/ActivityFeed.{jsx,d.ts,prompt.md}` + its own `*.card.html`,
`display/UnauthCard.{jsx,d.ts,prompt.md}` + its own `*.card.html`.

**Modified:** `tokens/src/spacing.json` (the `logo` family) and the generated
`tokens/spacing.css`; `tokens/src/TYPE-MAP.md`; `frameworks/tailwind/theme.css` and
`frameworks/tailwind/tv.ts`, or `scripts/check-tailwind-coverage.mjs`'s `EXCLUDED`;
`navigation/navigation.card.html`, `brand/brand.card.html`;
`ui_kits/console/{Shell,ProjectScreen,LoginScreen}.jsx`;
`scripts/check-dimension-literals.mjs` (`EXEMPT`, eight entries to six);
`README.md`; `CHANGELOG.md`.

**Modified downstream:** `docs/superpowers/plans/2026-07-18-5a-angular-primitive-parity.md`
(three primitives, one Material bridge entry, count 18 → 21),
`docs/superpowers/plans/2026-07-18-5b-tailwind-manifest-parity.md` (four manifests).

**Unchanged, explicitly:** every colour token, `tokens/colors.css`, `tokens/palette*.json`,
`styles.css`, and `assets/` — the three `rotor-*.svg` files are consumed as they are, not
edited. Every gate in `scripts/` keeps its rules; the only edits there are the two
`EXEMPT` deletions and whatever `EXCLUDED` entries the `logo` family needs. This spec
changes no existing token's value and no gate's logic.

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
