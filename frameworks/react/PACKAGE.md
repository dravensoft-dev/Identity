# @dravensoft/arena-react

Arena is Dravensoft's design system. This package is its React layer: 55 components whose every
value traces to a design token, with one stylesheet to import and no theme provider to wrap
your tree in.

**The package carries the language. It does not carry a skin.** Your palettes and your fonts
are yours, declared in one JSON file, and the `arena-theme` command that ships here turns
that file into the stylesheet Arena reads.

**No CSS toolchain, and Phosphor is required.** The compiled utility sheet ships inside
`arena.css`, so one import is the whole of it and you compile nothing. That sheet is what draws
the components: each one renders the class string of the shared recipe its surface is described
by, and the utilities those classes resolve to are in the file. It brings a browser base with
it too: a form control that inherits nothing falls back to the browser's own 13.33px Arial, and
a `<button>` styled that way is 20% off in every measurement that matters. Arena's other layer
reads the same file, so the two render one component one way.

Because the components render classes, a rule of yours can reach them by specificity. Nothing
stops you, and nothing supports you either: a class is not part of the API, no contract names
one, and a manifest may rename a slot in any release. Re-skin through `arena.config.json`,
which is what it is for. What is not optional is the icon font: every `icon` member is a
Phosphor class name a component renders, never an SVG it bundles, so `@phosphor-icons/web` is
a peer dependency.

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
bun add @dravensoft/arena-react
bun add react react-dom @phosphor-icons/web
```

`@phosphor-icons/web` is **required**, not optional. Arena's single-icon convention is a
Phosphor class name that a component renders, never an SVG it bundles, so without that
stylesheet every icon is an empty box. Import it once, wherever you import your styles:

```js
import '@phosphor-icons/web/bold';
import '@phosphor-icons/web/fill';
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
    "predev": "arena-theme arena.config.json -o src/arena.generated.css"
  }
}
```

| command | what it does |
| --- | --- |
| `arena-theme <config.json> -o <output.css>` | Reads the config, writes the stylesheet. Also accepts `--out` and `--out=`. |
| `arena-theme --help` | Prints the usage above. |
| `--strict` | Turns the contrast and ramp reports into a failure. Use it in CI if you want that discipline. |
| `--no-import` | Omits the `@import '@dravensoft/arena-react/arena.css';` line, for when you would rather import the package stylesheet yourself. |

The command **reports rather than refuses**. If a text colour lands under 4.5:1, or two ramp
slots are too close to tell apart with a common colour vision deficiency, it says so on stderr
and writes the file anyway. Your brand is yours; Arena's job is to tell you what it costs.

A malformed config is a different matter and always fails, naming the key.

Then import the generated file, and import it **last**:

```js
import './arena.generated.css';
```

That one file `@import`s the package's own stylesheet first and then your palette and fonts,
which is why your values win. If you pass `--no-import`, do it by hand and keep the order:

```js
import '@dravensoft/arena-react/arena.css';
import './arena.generated.css';
```

### If your project already ships a browser reset of its own

`arena.css` carries two halves of the compiled sheet, and they are separate files so you can
take one without the other. `css/base.css` is the stock browser reset and nothing of Arena's:
`box-sizing`, the margin and padding zeroing, `font: inherit` on form controls. `css/utilities.css`
is Arena's theme and the utilities every component's class string resolves against.

If your own build already emits that reset, importing `arena.css` gives you a second copy of
every rule in it, with the same selectors and possibly different values, and the cascade order
decides which wins. Import the halves instead and skip the one you already have:

```js
import '@dravensoft/arena-react/css/utilities.css';
import './arena.generated.css';
```

Two things become yours when you do that. **Order**, because nothing composes it for you: the
utilities have to come before your own rules if you want yours to win. And **the preflight
itself**, because Arena needs one. Without `button, input, select, textarea { font: inherit }`
a control falls back to the browser's 13.33px Arial and every control in the library is 20%
off, with nothing to tell you: keep yours, or keep Arena's, but keep one.

## Use it

```tsx
import { Button, Tag, StatCard, Table, TableRow, TableCell } from '@dravensoft/arena-react';

export function Fleet({ rotors }) {
  return (
    <section>
      <StatCard label="Rotors in service" value={rotors.length} tone="success" />

      <Table label="Rotors by depot">
        {rotors.map((rotor) => (
          <TableRow key={rotor.id}>
            <TableCell>{rotor.id}</TableCell>
            <TableCell><Tag tone={rotor.grounded ? 'danger' : 'success'}>{rotor.status}</Tag></TableCell>
          </TableRow>
        ))}
      </Table>

      <Button icon="ph-plus" onClick={() => {}}>Add a rotor</Button>
    </section>
  );
}
```

Every component is imported from the package root. Types ship with it, emitted from the
components' own source rather than written beside it, so an editor tells you what a component
takes and no declaration can disagree with the implementation it describes.

## Switch palettes

```tsx
import { initArenaTheme, useArenaTheme } from '@dravensoft/arena-react';

initArenaTheme({
  palettes: [
    { name: 'dark', polarity: 'dark' },
    { name: 'light', polarity: 'light' },
  ],
  default: 'dark',
});

function ThemeButton() {
  const [theme, setTheme] = useArenaTheme();
  return <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme}</Button>;
}
```

Pass the same palettes your config declares. `initArenaTheme` reads the stored choice, falls
back to `prefers-color-scheme` matched against each palette's polarity, and puts the right
class on `<html>`. Called with nothing, it answers `dark` and `light`.

To avoid a flash on first paint, apply the class before your stylesheet loads:

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

Four small surfaces reach the package root beside the components, each answering a question a
consumer cannot answer from outside. Everything here imports from `@dravensoft/arena-react`.

**The theme surface**, above: `initArenaTheme`, `useArenaTheme`, `getArenaTheme`,
`setArenaTheme`, `toggleArenaTheme`, `arenaPalettes` and the `ArenaPalette` /
`ArenaThemeConfig` types.

**Two measurements, and they answer different questions.**

| | returns | reach for it |
| --- | --- | --- |
| `useContainerWidth(ref?)` | `[ref, width]`: attach the ref to the box, read the width a `ResizeObserver` reports | a component or a panel that has to fit the room it was given |
| `useViewportBelow(name)` | a boolean over `not all and (min-width: N)` | a page's own layout |

**`width` is `null` until the first measurement**, so render the wide branch while it is, rather
than the narrow one: a panel that flashes into its phone shape on every mount is worse than one
that settles into it.

`name` is `'sm' \| 'md' \| 'lg'` and resolves the same `--bp-*` token Arena's own components
branch on, which is the point: a media query condition holds no `var()`, so a threshold cannot
be named from a stylesheet at all. `useViewportBelow` is the exact complement of "at least this
wide" rather than a `max-width` an epsilon short of it. **Never branch a component on
the viewport**: it is wrong the first time somebody puts it in a narrow column. If your app
swaps its stylesheet at runtime, call `forgetBreakpoints()` afterwards to drop the cached
thresholds.

**The chart ramp, for a legend or a chip you draw yourself.** `catColor(slot)` returns the
custom property for a slot, `catSurface(slot)` the fill and border pair for a chip carrying that
identity, `catSlotFor(key)` assigns a stable slot from a string, and `CAT_SLOTS` is how many
there are. The ramp's order is its identity, so a slot means the same thing in every chart on
the screen.

**`isPrimaryActivation(event)`**, the predicate behind the anchor rule: true for a primary
click with no modifier, false for every modified click, middle click and context menu. Use it if
you draw an anchor of your own beside Arena's and want the same split.

Every other symbol reaching the root is an internal of this layer, exported because the barrel
is generated wholesale rather than curated, and carries no compatibility promise. The set is
`ROOT_TS` in `scripts/build/react/build-react-package.mjs` in the repository.

## What is in the package

Every component, its types, the layer helpers above, the invariant stylesheets, and the
`arena-theme` command. No tests, no demo pages, no font binaries, and no icons.

## Why might this package's latest version not match Arena's latest version?

[Why are the published package versions not identical?](https://github.com/dravensoft-dev/Identity/blob/main/.github/workflows/README.md#why-are-the-published-package-versions-not-identical)

## License

MIT. See the repository.
