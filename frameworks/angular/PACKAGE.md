# @dravensoft/arena-angular

Arena is Dravensoft's design system. This package is its Angular layer: 50 standalone
`OnPush` components with signal inputs and outputs, styled by a shared Tailwind recipe per
component, and shipped in Angular Package Format.

**The package carries the language. It does not carry a skin.** Your palettes and your fonts
are yours, declared in one JSON file, and the `arena-theme` command that ships here turns
that file into the stylesheet Arena reads.

**You do not need Tailwind.** The compiled utility sheet ships with the package, so one
`@import` is enough. If your app already runs Tailwind v4, the `@theme` preset is here too.

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

If your app runs Tailwind v4 and you would rather compile the utilities yourself, import
`@dravensoft/arena-angular/css/theme-preset.css` instead of the bundled sheet, and point a
`@source` at the package.

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

## What is in the package

Every component in Angular Package Format, the shared Tailwind recipes they read, the
compiled utility sheet, the invariant stylesheets, and the `arena-theme` command. No tests,
no demo pages, no font binaries, and no icons.

## Why might this package's latest version not match Arena's latest version?

[Why are the published package versions not identical?](https://github.com/dravensoft-dev/Identity/blob/main/.github/workflows/README.md#why-are-the-published-package-versions-not-identical)

## License

MIT. See the repository.
