/* frameworks/tailwind/tv.ts
   Arena's configured `tailwind-variants` factory. Every recipe imports THIS `tv`
   (not the bare one from 'tailwind-variants') so twMerge dedupes utilities that
   resolve to Arena's semantic token scale. Consumers install `tailwind-variants`
   as a peer dependency; in a consuming app this file is reached through a path
   alias, so the recipe's relative import above it never leaks into product code.

   Most of Arena's custom names are safe with zero registration, because their
   utility prefix has only one meaning in Tailwind (`tracking-*`, `leading-*`,
   `rounded-*`, `blur-*`, `z-*`, `size-*` — probed directly against a color class
   and a same-prefix sibling; none collide, so none are registered here, per
   scripts/tv-merge.test.mjs). `--text-*` is the one namespace that is NOT safe
   by default: Tailwind overloads the bare `text-` prefix for both font-size
   (`text-lg`) AND text-color (`text-primary`), and tailwind-merge only
   recognises OUR custom suffixes (`display`, `h1`..`h4`, `ctl`, `ctl-md`,
   `ctl-sm`, `ctl-xs`, `ctl-2xs`) as font-size if we say so — otherwise it
   guesses color, and a color class declared later in the same merged string
   silently eats the size class outright (verified: `text-h1 text-primary` ->
   `text-primary`, not both). `text-sm`/`text-md`/`text-lg`/`text-xs` need no
   entry: they are Tailwind's own default font-size names and are already
   correctly grouped. The other custom group is the `shadow-1..3` elevation
   scale that tokens/effects.css exposes through frameworks/tailwind/theme.css
   — register it so `shadow-1` and `shadow-2` resolve as conflicting and
   dedupe. Both entries extend Tailwind's own `font-size` and `shadow` group
   IDs rather than inventing new ones, so the size scale keeps its existing,
   correct conflict behaviour against `leading-*` and nothing else. */
import { createTV } from 'tailwind-variants';

export const tv = createTV({
  twMerge: true,
  twMergeConfig: {
    classGroups: {
      shadow: [{ shadow: ['1', '2', '3'] }],
      'font-size': [{ text: ['display', 'h1', 'h2', 'h3', 'h4', 'ctl', 'ctl-md', 'ctl-sm', 'ctl-xs', 'ctl-2xs'] }],
    },
  },
});
