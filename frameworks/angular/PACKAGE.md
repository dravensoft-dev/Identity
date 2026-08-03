# @dravensoft/arena-angular

Arena is Dravensoft's design system. This package is its Angular layer: 50 standalone
`OnPush` components with signal inputs and outputs, styled by a shared Tailwind recipe per
component, and shipped in Angular Package Format.

**The package carries the language. It does not carry a skin.** Your palettes and your fonts
are yours, declared in one JSON file, and the `arena-theme` command that ships here turns
that file into the stylesheet Arena reads.

**You do not need to RUN Tailwind, and the appearance is Tailwind either way.** The compiled
utility sheet ships with the package, so one `@import` is enough and you compile nothing; if
your app already runs Tailwind v4, the `@theme` preset is here too and you compile a smaller
sheet from it. What is fixed is that every component's appearance is a class string from a
shared recipe layer, resolved through `tailwind-variants` and `tailwind-merge`, which travel
as runtime dependencies of this package. **This is a coupling and not a detail**, the way
Phosphor is for iconography: a project that wants a different styling system underneath wants
a different design system.

## It works with the repository, and that is the point

Source, guidelines and full documentation: **https://github.com/dravensoft-dev/Identity**

That repository is not just where the code comes from. It ships as a **Claude Code plugin**
and as an **Agent Skill**, and installing either hands an agent the whole design language:
the normative colour, spacing and voice guidelines, the API contract of every component, the
accessibility pattern each one binds, and a usage document per component with its Do and its
Don't. An agent that has read those does not guess at Arena; it builds with it. So the fastest
way to adopt this package is to install the plugin, or point your agent at the repository's
`SKILL.md`, and then ask for the screen you want.

The package is the code. The repository is the criterion.

## Install

```bash
bun add @dravensoft/arena-angular
bun add @angular/core @angular/common @angular/platform-browser @angular/cdk @phosphor-icons/web
```

`@angular/cdk` is a peer because two components, `arena-tooltip` and `arena-menu`, use its
overlay to position themselves. Arena uses the CDK for **position only**: the roles, the keys
and the focus are Arena's own.

`@phosphor-icons/web` is **required**, not optional. Arena's single-icon convention is a
Phosphor class name that a component renders, never an SVG it bundles, so without that
stylesheet every icon is an empty box. Import it once from your global stylesheet:

```css
@import '@phosphor-icons/web/src/bold/style.css';
@import '@phosphor-icons/web/src/fill/style.css';
```

## Declare your skin

Write `arena.config.json` in your project root. This is the whole file, with one palette and
three fonts served by Google Fonts, and it is enough to start:

```json
{
  "palettes": [
    {
      "name": "dark",
      "default": true,
      "polarity": "dark",
      "colors": {
        "base-100": "#141010",
        "base-200": "#1d1715",
        "base-300": "#241c19",
        "base-content": "#f3ede5",
        "primary": "#b52a20",
        "primary-content": "#ffffff",
        "secondary": "#c5a059",
        "secondary-content": "#141010",
        "neutral": "#2c221e",
        "neutral-content": "#d8cfc4",
        "info": "#3182ce",
        "info-content": "#141010",
        "success": "#38a169",
        "success-content": "#141010",
        "warning": "#ecc94b",
        "warning-content": "#141010",
        "error": "#e85151",
        "error-content": "#ffffff",
        "cat-1": "#3c7b0a",
        "cat-2": "#3b63be",
        "cat-3": "#0a924b",
        "cat-4": "#6a59bc",
        "cat-5": "#00a3c0",
        "cat-6": "#884da9",
        "cat-7": "#00a99a",
        "cat-8": "#984697"
      }
    }
  ],
  "fonts": {
    "display": { "family": "Archivo", "src": "https://fonts.googleapis.com/css2?family=Archivo:wght@400..900&display=swap" },
    "body": { "family": "Familjen Grotesk", "src": "https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400..900&display=swap" },
    "mono": { "family": "Spline Sans Mono", "src": "https://fonts.googleapis.com/css2?family=Spline+Sans+Mono:wght@400..900&display=swap" }
  }
}
```

`arena.config.example.json` in this package is the same file with both Dravensoft palettes in
it, ready to copy and edit.

What each part means:

- **`palettes`** is an array, so declare as many as you want. Exactly one is the `default` and
  reaches `:root`; every other one becomes a class, `.arena-<name>`, that you put on
  `<html>` to switch skin.
- **`polarity`** is `dark` or `light`. It decides the native date picker's colour and it is
  what a first visit matches `prefers-color-scheme` against.
- **`colors`** takes all 27 keys above. `error-fill` is the only optional one: leave it out and
  Arena darkens `error` in oklab for the single filled danger surface it has.
- **`cat-1`** through **`cat-8`** are the chart ramp. Their order is their identity, so slot 3
  is always slot 3, and they are never used to mean anything, only to tell series apart.
- **`fonts`** fills the three families Arena reads. `src` takes either a stylesheet URL, as
  above, or a font binary you host yourself, which becomes an `@font-face`:
  `{ "family": "Archivo", "src": "/fonts/archivo.woff2", "weight": "400 900" }`.

## Generate the stylesheet

```bash
bunx arena-theme arena.config.json -o src/arena.generated.css
```

Wire it into your build so it can never go stale:

```json
{
  "scripts": {
    "prebuild": "arena-theme arena.config.json -o src/arena.generated.css",
    "prestart": "arena-theme arena.config.json -o src/arena.generated.css"
  }
}
```

| command | what it does |
| --- | --- |
| `arena-theme <config.json> -o <output.css>` | Reads the config, writes the stylesheet. Also accepts `--out` and `--out=`. |
| `arena-theme --help` | Prints the usage above. |
| `--strict` | Turns the contrast and ramp reports into a failure. Use it in CI if you want that discipline. |
| `--no-import` | Omits the `@import '@dravensoft/arena-angular/arena.css';` line, for when you would rather import the package stylesheet yourself. |

The command **reports rather than refuses**. If a text colour lands under 4.5:1, or two ramp
slots are too close to tell apart with a common colour vision deficiency, it says so on stderr
and writes the file anyway. Your brand is yours; Arena's job is to tell you what it costs.

A malformed config is a different matter and always fails, naming the key.

Then import it from `src/styles.css`, and import it **last**:

```css
@import './arena.generated.css';
@import '@dravensoft/arena-angular/css/arena-cdk.css';
```

`arena.generated.css` pulls in the package's own stylesheet first, which is why your values
win. Add `css/arena-cdk.css` when you first use `arena-tooltip` or `arena-menu`: it re-bases
the CDK overlay onto Arena's `--z-*` scale, without which a menu opened inside a dialog paints
behind it.

### If your app already runs Tailwind

There are two ways out of importing a second copy of what you already have, and they cost
different things.

The bundled sheet is two files, so you can take one without the other. `css/base.css` is
Tailwind's preflight and nothing of Arena's; `css/utilities.css` is Arena's theme and the
utilities every component's class string resolves against. Your project already ships a
preflight, so import the utilities alone:

```css
@import '@dravensoft/arena-angular/css/utilities.css';
@import './arena.generated.css';
@import '@dravensoft/arena-angular/css/arena-cdk.css';
```

Or compile the utilities yourself: import
`@dravensoft/arena-angular/css/theme-preset.css` instead of the bundled sheet, and point a
`@source` at the package.

Two things become yours either way. **Order**, because nothing composes it for you: the
utilities have to come before your own rules if you want yours to win. And **the preflight
itself**, because Arena needs one. Without `button, input, select, textarea { font: inherit }`
a control falls back to the browser's 13.33px Arial and every control in the library is 20%
off, with nothing to tell you: keep yours, or keep Arena's, but keep one.

## Use it

Every component is standalone, so import the ones a component template uses:

```ts
import { Component, signal } from '@angular/core';
import { Button, Tag, StatCard } from '@dravensoft/arena-angular';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [Button, Tag, StatCard],
  template: `
    <arena-stat-card label="Rotors in service" [value]="rotors().length" tone="success" />

    @for (rotor of rotors(); track rotor.id) {
      <arena-tag [tone]="rotor.grounded ? 'danger' : 'success'">{{ rotor.status }}</arena-tag>
    }

    <arena-button icon="ph-plus" (press)="add()">Add a rotor</arena-button>
  `,
})
export class Fleet {
  readonly rotors = signal<Rotor[]>([]);
  add(): void {}
}
```

## Switch palettes

```ts
import { provideArenaThemes, ThemeService } from '@dravensoft/arena-angular';

bootstrapApplication(App, {
  providers: [
    provideArenaThemes({
      palettes: [
        { name: 'dark', polarity: 'dark' },
        { name: 'light', polarity: 'light' },
      ],
      default: 'dark',
    }),
  ],
});
```

Pass the same palettes your config declares. Then inject `ThemeService` and call
`set('light')`, or `toggle()` to walk them in order. `theme` is a signal, so a template reads
it directly. With no providers the service answers `dark` and `light`.

To avoid a flash on first paint, apply the class in `index.html` before your stylesheet:

```html
<script>
  (function () {
    try {
      var name = localStorage.getItem('arena-theme');
      if (name && name !== 'dark' && /^[a-z][a-z0-9-]*$/.test(name)) {
        document.documentElement.classList.add('arena-' + name);
      }
    } catch (e) {}
  })();
</script>
```

## What the package exports besides components

Five small surfaces reach the package root beside the components, each answering a question a
consumer cannot answer from outside. Everything here imports from `@dravensoft/arena-angular`.

**The projection markers, and one of them is not optional.** `ArenaAction`, `ArenaActions`,
`ArenaBrand`, `ArenaFooter` and `ArenaSecondaryAction` are the directives behind the `[action]`,
`[actions]`, `[brand]`, `[footer]` and `[secondaryAction]` attributes. **Put the marker your
template writes in that component's own `imports`.** A component detects a projected slot with a
`contentChild` on the directive, so an un-imported marker leaves the query null and the slot
silently unrendered: no error and no template diagnostic, because a bare `footer` attribute on a
`<div>` is valid HTML whether or not a directive matches it. The component cannot tell an
un-imported marker from an unfilled slot, so nothing can warn you.

**The theme surface**, above: `provideArenaThemes`, `ThemeService`, `themeClass` and the
`ArenaPalette` / `ArenaThemeConfig` types.

**Two measurements, and they answer different questions.**

| | returns | reach for it |
| --- | --- | --- |
| `containerWidth(ref?)` | `Signal<number \| null>` over the host's own box, or the `ElementRef` you pass | a component or a panel that has to fit the room it was given |
| `viewportBelow(name)` | `Signal<boolean>` over `not all and (min-width: N)` | a page's own layout |

Call either from an injection context, a field initializer or the constructor: `DestroyRef`
disconnects the observer and `afterNextRender` decides when there is a box to measure at all.
**The width is `null` until the first measurement**, so render the wide branch while it is,
rather than the narrow one: a panel that flashes into its phone shape on every mount is worse
than one that settles into it.

`name` is `'sm' \| 'md' \| 'lg'` and resolves the same `--bp-*` token
Arena's own components branch on, which is the point: a media query condition holds no `var()`,
so a threshold cannot be named from a stylesheet at all, and an app writing CSS in a `styles:`
block has no other way to reach it. `viewportBelow` is the exact complement of the `md:` variant
rather than a `max-width` an epsilon short of it. **Never branch a component on the viewport**:
it is wrong the first time somebody puts it in a narrow column. If your app swaps its stylesheet
at runtime, call `forgetBreakpoints()` afterwards to drop the cached thresholds.

**The chart ramp, for a legend or a chip you draw yourself.** `catColor(slot)` returns the
custom property for a slot, `catSurface(slot)` the fill and border pair for a chip carrying that
identity, `catSlotFor(key)` assigns a stable slot from a string, and `CAT_SLOTS` is how many
there are. The ramp's order is its identity, so a slot means the same thing in every chart on
the screen.

**`isPrimaryActivation(event)`**, the predicate behind the anchor rule: true for a primary
click with no modifier, false for every modified click, middle click and context menu. Use it if
you draw an anchor of your own beside Arena's and want the same split.

`ARENA_ICONS` is the role-to-Phosphor map Arena's own components draw from, as
`{ role, phosphor, weight }`. Read it when you want your icon for a role to match Arena's.

Every other symbol reaching the root is an internal of this layer, exported because the barrel
is not curated, and carries no compatibility promise.

## One stylesheet gives you a treatment, not a component

`css/numerals.css` holds `.arena-num`: the mono face and `tabular-nums`, and no colour. Put it
on a figure you draw yourself, in a definition list, a KPI or a cart line, and a column of them
aligns by digit the way a table's does.

It is already inside the bundled utility sheet, so importing the file separately is only for an
app compiling its own utilities from the `@theme` preset.

It carries no ink on purpose. A table column's `mono` is this treatment **plus** the gold, and
the gold is what stops the treatment travelling: gold reads as an identifier, so a sale total in
gold inside a card says the wrong thing.

## What is in the package

Every component in Angular Package Format, the shared Tailwind recipes they read, the
compiled utility sheet, the invariant stylesheets, and the `arena-theme` command. No tests,
no demo pages, no font binaries, and no icons.

## Why might this package's latest version not match Arena's latest version?

[Why are the published package versions not identical?](https://github.com/dravensoft-dev/Identity/blob/main/.github/workflows/README.md#why-are-the-published-package-versions-not-identical)

## License

MIT. See the repository.
