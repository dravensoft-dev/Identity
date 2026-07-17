/* frameworks/tailwind/tv.ts
   Arena's configured `tailwind-variants` factory. Every recipe imports THIS `tv`
   (not the bare one from 'tailwind-variants') so twMerge dedupes utilities that
   resolve to Arena's semantic token scale. Consumers install `tailwind-variants`
   as a peer dependency; in a consuming app this file is reached through a path
   alias, so the recipe's relative import above it never leaks into product code.

   Arena's colour, radius and spacing utilities use Tailwind's standard scale
   names, which tailwind-merge already groups. The one custom group is the
   `shadow-1..3` elevation scale that tokens/effects.css exposes through
   frameworks/tailwind/theme.css — register it so `shadow-1` and `shadow-2`
   resolve as conflicting and dedupe. */
import { createTV } from 'tailwind-variants';

export const tv = createTV({
  twMerge: true,
  twMergeConfig: {
    classGroups: {
      shadow: [{ shadow: ['1', '2', '3'] }],
    },
  },
});
