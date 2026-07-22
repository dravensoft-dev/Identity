# Arena behaviour contracts

`tokens/` answers *what is this value*. This directory answers *what must this
component do* — which roles it carries, which keys it answers, where focus goes,
what dismisses it.

It is a sibling of `tokens/`, not a child, and deliberately so. A contract is not
a value: DTCG models colours, dimensions and durations, and does not model "Escape
closes this". Putting a pattern under `tokens/src/` would mean relaxing
`scripts/check-dtcg.mjs`, which is one of the cleanest gates in the repo.

## Patterns

One file per pattern in `patterns/`, each citing the source it was adopted from.
Fourteen cite an actual [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/)
page. Two cite the ARIA 1.2 role reference instead — `status` and `textbox` — because
APG has no pattern page for either role. The remaining two say why in their own
`source`: `figure-with-data-table`, which cites WCAG because APG has no chart pattern,
and `none`, which cites nothing at all because the absence of a pattern is not adopted
from anywhere.

`requires` is a flat map of dotted keys. That shape is load-bearing: an exception
in a binding names exactly one requirement, so one exception cannot quietly excuse
three.

## Bindings

Every component declares, in every layer, beside its own source:

- React: `frameworks/react/components/<group>/<Name>.behaviour.json`
- Angular: `frameworks/angular/primitives/<name>/<name>.behaviour.json`
- Angular, delegated: one entry in `frameworks/angular/behaviour-delegated.json`,
  because a component Material provides has no Arena directory to sit beside.

A binding names a pattern and lists the requirements the component does not yet
meet, each with a reason. `bun run check:behaviour` asserts that every component
declares, that every named pattern and requirement exists, and that the two layers
agree or the difference is written down.

**What it does not assert is whether the component actually behaves as it says.**
That is a later plan's work. A component can bind `dialog-modal` here and trap no
focus at all.
