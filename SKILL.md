---
name: design
description: Use this skill to generate well-branded interfaces and assets for Dravensoft (design language "Arena"), for production or throwaway prototypes/mocks. Contains design guidelines, colors, type, fonts, assets, and UI kit components.
user-invocable: true
---

# Arena

Arena is Dravensoft's design language: a token layer, React and Angular component libraries
built on it, and a shared Tailwind layer. Its identity is dark-first, warm black under bone
text, crimson as the voice and gold as distinction, sharp geometry, no gradients.

**This file routes. Read only what your task needs.**

## Which job is this?

**Building something with Arena** (a screen, a prototype, a component, an integration): stay
here, and follow the table below.

**Changing Arena itself** (adding a component, moving a token, editing a contract or a gate):
read [`CLAUDE.md`](./CLAUDE.md) instead. It is the root of that branch and this file is not.

## Start here, in this order

1. **[`frameworks/Catalog.generated.md`](./frameworks/Catalog.generated.md)**: every component,
   what it is, what it takes, and a link to each layer's usage document. One read tells you
   what exists and what to reach for.
2. **The component's own `.prompt.md`**, linked from the catalog: examples and the Do/Don't.
   Read one per component you actually write, and no more.
3. **`contracts/api/components/<Name>.json`** when you need a member's exact type, default or
   reason. Read it only when the prompt leaves the question open.

## The rules, and they are not style preferences

Every one of these is enforced somewhere, so breaking one is a defect rather than a variation.

- **Tokens are the only styling layer.** A raw hex, or a bare `16px`, is a bug. Read a value
  through its custom property (`var(--crimson)`, `var(--sp-4)`) or derive it with
  `calc()`/`clamp()` over one.
- **Danger is outline, never filled**: transparent background, border and content in
  `--error`/`--danger`. The single filled danger surface in the whole system is the final
  irreversible confirmation inside `ConfirmDialog`.
- **One primary accent per view.** Crimson is the voice; at most one `variant="primary"`
  action on a screen. Gold is distinction and focus, not a second primary.
- **No gradients** on any surface. Depth comes from the `base-100` to `base-200` to `base-300`
  surface scale, the hairline border and the warm shadow. `Skeleton`'s neutral shimmer is the
  one exception.
- **No emoji**, in product or in copy.
- **Icons are Phosphor class-name strings, never elements and never SVG**:
  `icon="ph-bold ph-plus"`. Install `@phosphor-icons/web`; Arena never bundles it.
- **Two themes, dark first.** Dark is `:root`, light is the `.arena-light` class. Components
  are never rewritten per theme, because they read tokens. `.arena-compact` re-densifies.
- **A chart carries identity or meaning, never both.** The `--color-cat-*` ramp in fixed order
  is identity; the status colours are meaning. Status colours are never series colours.
- **Copy is English, formal and direct**, concrete action verbs, no boastful adjectives.
  Errors are blame-free and say what to do next.

## Where each question is answered

| Question | Read |
|---|---|
| Which component do I need? Does one exist? | [`frameworks/Catalog.generated.md`](./frameworks/Catalog.generated.md) |
| How do I use this component? | its `.prompt.md`, linked from the catalog |
| What exactly does this member take? | `contracts/api/components/<Name>.json` |
| What is the value of a token? | the DTCG JSON for its group in `contracts/design/` (`ls contracts/design/*.json`), which is the machine-readable form and is cheaper than the specification below |
| What does a value mean, and why is it that? | [`contracts/design/README.md`](./contracts/design/README.md), the normative design specification |
| What must this kind of component do to be accessible? | `contracts/behaviour/<pattern>.json`, and the component's own `<Name>.behaviour.json` |
| How do I install Arena in my app? | [`frameworks/react/PACKAGE.md`](./frameworks/react/PACKAGE.md) or [`frameworks/angular/PACKAGE.md`](./frameworks/angular/PACKAGE.md) |
| What does a finished Arena app look like? | `frameworks/react/ui-kits/console/`, the Delivery Console example |
| What does a token look like on screen? | `intro/guidelines/*.html`, the specimen cards |

**Do not read these to build something.** `contracts/api/README.md`,
`contracts/behaviour/README.md`, `frameworks/PACKAGING.md`, and each layer's own `README.md`
are about *changing* Arena, not about using it. They are large, and none of them answers a
question in the table above.

## Two ways to deliver

**A visual artifact** (a slide, a mock, a throwaway prototype): copy the assets you need out
of `assets/`, and write static HTML that links `intro/styles.css`. That one stylesheet pulls
in every token, so the page is on-brand with no build step. It must be served over HTTP rather
than opened from `file://`.

**Production code**: use the component library for the consumer's framework, import from
`@dravensoft/arena-react` or `@dravensoft/arena-angular`, and follow the prompts. Write no CSS
class of your own for an Arena component: they carry none, and they take their appearance from
the tokens.

## Invoked with no other guidance

Ask what the user wants to build, ask a few questions about audience and surface, then act as
an expert in the Arena language and produce either an HTML artifact or production code,
whichever the answer calls for.
