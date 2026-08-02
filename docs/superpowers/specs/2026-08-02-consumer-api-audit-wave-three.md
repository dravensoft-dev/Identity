# Third wave of the consumer API audit

## What this is

The consumer that audited Arena at 5.0 audited it again at 5.1, and this time it **migrated
and ran**. Fourteen of the twenty-three tickets from the first round are closed. Twenty stay
open: nine inherited, eleven new, and **five of the eleven are visible only from inside a
consumer using the new API for real**. A contract read from the outside does not show them.

The five share one cause, and it is the finding worth keeping: **a contract describes a
member, never its fit**. `Card.href` promises a real anchor and delivers one. `Command.route`
promises a row that is a link and delivers one. `TableColumn.sortable` promises to cost no tab
stop and costs none. All three fail on **where they land**: in a single-page application with
a router, and on a 390px phone with no header row.

This wave closes sixteen of the twenty.

## What is verified, and how

Every claim below was read in the tree before it was accepted, because a grep answers where a
name appears and never what the file around it says.

| Claim | Where it is true |
|---|---|
| `Dialog`'s action row does not wrap while `PageHead`'s and `ChartCard`'s do | `Dialog.manifest.json` slot `foot` is `flex justify-end gap-2.5 px-6 pb-5.5`; the other two carry `flex-wrap` |
| Card mode draws no sort affordance | `frameworks/angular/components/display/table/Table.ts`, the header row sits under `@if (!narrow() && !empty())` |
| `Command.route` navigates twice with the mouse and once with the keyboard | The `route` branch renders `<a [href]>` with `(click)="onRun(command)"`, and `onRun` emits without touching the event |
| `arena-card` cannot be driven by `routerLink` | `RouterLink` decides by `tagName` and by `customElements`, and an Angular component is neither, so `isAnchorElement` is false: modifier keys are ignored and a second tab stop lands on the host |
| The doughnut skips zero-value slices | The template guards each path on `@if (segment.path)`, so a consumer indexing the drawn paths must reproduce the omission |
| `Input` exposes nothing to focus | `Input.ts` declares twenty-four members and no method |
| The Angular package needs no Tailwind | **False.** `tailwind-variants` and `tailwind-merge` are runtime dependencies of that package, and every component's appearance is a class string from the shared recipe layer |

## The decision this wave turns on

Arena states today that a component drawing its own anchor leaves navigation to the browser,
and that intercepting a plain click to substitute client-side routing **belongs at the
router**. That instruction is not executable in Angular for any component that draws the
anchor inside itself, which is every one of them, and the consumer proved it by trying.

So the doctrine is replaced rather than restated:

> **An anchor Arena draws cancels a primary click with no modifier and reports through its own
> navigation event.** A click carrying ctrl, meta, shift or alt, a middle click and a context
> menu stay the browser's, and nothing is emitted for them.

This is what `RouterLink` itself does, for the same reason. It keeps R4 intact, because no
platform event travels in a payload, and it adds no member anywhere. It reaches `Card`,
`CommandPalette`, `Breadcrumbs` and `SideNavItem`, in both layers.

It is a breaking change for a consumer relying on the anchor to navigate by itself, and the
moment to make it is now: adoption of the two members it corrects is **zero**.

## What each ticket asks for

**Corrections, where the consumer could not be correct with the API as given.**

- **GAP-24** Card mode has no sort affordance, so a `sortable` column is a desktop-only
  feature on thirteen tables and nothing says so.
- **GAP-27** `Command.route` double-navigates with the mouse and single-navigates with the
  keyboard. The same command does different things depending on how it is activated.
- **GAP-07** `BulkActionBar` has no narrow layout, so the consumer reordered its internal
  children by position, which puts focus order and visual order out of step.

**Drift, where the consumer retyped a value or a rule Arena owns.**

- **GAP-26** `Card.href` cannot be driven by a router, so the member is unusable in the kind
  of application it was asked for.
- **GAP-25** `Dialog`'s footer does not wrap while the system's other two action rows do.
- **GAP-18** No stacking slot for a sheet, and no declared height for a fixed bottom bar,
  retyped in five places across three files.
- **GAP-31** `env(safe-area-inset-bottom)` appears seven times in the consumer and zero times
  in Arena. It is not a value Arena has and the consumer copied; it is a system rule Arena has
  not declared and each consumer invents differently.
- **GAP-17** A consumer who writes CSS rather than Tailwind classes still cannot name a
  breakpoint. The `@theme` half of the second wave passes them by.

**Convenience, repetition with no defect and no drift.**

- **GAP-34** `TablePage.total` describes itself as the reset every consumer writes by hand.
  It is not: the reset fires only when the page has gone out of range, which is the correct
  rule and the wrong sentence.
- **GAP-33** A positional `TableSort.column` reorders rows silently when a column moves, and
  a `sort` aimed at a column that declares no `sortable` draws nothing and says nothing.
- **GAP-28** Chaining data entry needs focus, and `Input` offers no way to take it.
- **GAP-29** The doughnut legend truncates the concept and keeps the figure, so a phone reads
  a column of numbers with nothing saying what they count.
- **GAP-30** The doughnut has no slice output, so identifying a slice means indexing Arena's
  own SVG.
- **GAP-32** `TableColumn.mono` carries the mono face **and** the gold ink, and exists only
  inside a table. A figure outside one has nothing.
- **GAP-20** Nine contracts take an icon name and nothing checks that the name exists.
- **GAP-15** The palette has no result ceiling, and describes a shortcut it does not bind.

## What is out of scope, and why

**GAP-16, the toast host.** It is a new component: a contract, a behaviour binding, compliance
suites in both layers, a recipe, prompts and demos. This wave takes nothing that is a new
component.

**GAP-01, GAP-02 and GAP-03**, the mobile bar, the non-modal sheet and the layout primitives.
They stay open with no decision recorded.

## How this is known to have worked

Mechanically: every gate, and both test processes, at the end.

By hand, because the finding this wave answers is precisely that mechanism does not see fit:
every touched component at 390px, and every anchor in a real router, with a primary click, a
ctrl click, a middle click and Enter. The second wave hand-checked the charts in a 390px
container and produced no new chart ticket. Where it was hand-checked, there is no gap.

Finally, from the consumer: adopt the published version and re-derive the figures. The six
`::ng-deep` rules go to zero, the retyped bar height and safe-area inset go to zero, and
`Card.href` and `Command.route` go from zero uses to four files and the whole palette.
