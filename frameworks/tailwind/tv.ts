/* frameworks/tailwind/tv.ts
   Arena's configured `tailwind-variants` factory. Every recipe imports THIS `tv`
   (not the bare one from 'tailwind-variants') so twMerge dedupes utilities that
   resolve to Arena's semantic token scale. Consumers install `tailwind-variants`
   as a peer dependency; in a consuming app this file is reached through a path
   alias, so the recipe's relative import above it never leaks into product code.

   A custom Arena suffix can fail two different ways once a manifest's slot
   strings are merged, and this file guards against both. Read this before
   assuming an unregistered namespace "needs nothing":

   1. CROSS-GROUP EATING — a custom suffix under a prefix Tailwind overloads
      for two unrelated purposes gets misclassified into the WRONG group,
      and whichever class lands later in the merged string silently deletes
      the other outright. `--text-*` is the one namespace this happens to:
      Tailwind overloads the bare `text-` prefix for both font-size
      (`text-lg`) AND text-color (`text-primary`), and tailwind-merge only
      recognises OUR custom suffixes (`display`, `h1`..`h4`, `ctl`, `ctl-md`,
      `ctl-sm`, `ctl-xs`, `ctl-2xs`) as font-size if we say so — otherwise it
      guesses color (verified: `text-h1 text-primary` -> `text-primary`, not
      both). `text-sm`/`text-md`/`text-lg`/`text-xs` need no entry: they are
      Tailwind's own default font-size names and are already correctly
      grouped.

   2. MISSING SELF-DEDUPE — a custom suffix that ISN'T recognised by any
      group doesn't collide with anything, but it also doesn't conflict with
      its OWN siblings, so two values from the same Arena scale can both
      survive in one merged string when only the later one should (a `tv()`
      compound variant — a base slot class overridden by a size/variant
      one — produces exactly this shape). `--radius-*`'s `pill` and every
      name in `--z-index-*` (`dropdown`, `tooltip`, `modal`, `modal-nested`,
      `palette`, `onboarding`, `toast`) are this failure, registered below
      (verified: pre-fix, `rounded-pill rounded-lg` -> both survive;
      `z-dropdown z-modal` -> both survive). `--radius-*`'s `xs`/`sm`/`md`/
      `lg`/`xl` need no entry: tailwind-merge's own bundled default radius
      theme matches any t-shirt-size-shaped suffix generically (`isTshirtSize`),
      not by looking up our CSS, so those already dedupe against each other
      and against `pill` once `pill` itself is registered.

   `--tracking-*`, `--leading-*`, `--blur-*` and `--size-icon-*` were probed
   the same two ways (a color class, and a same-family sibling) and hit
   NEITHER failure — none of their prefixes carry a second Tailwind meaning,
   and their siblings (`tracking-tight`/`tracking-wide`, `leading-tight`/
   `leading-snug`, `blur-md`/`blur-lg`) already dedupe correctly without
   registration. They stay unregistered on that evidence, not by omission;
   see scripts/tv-merge.test.mjs for the cases proving it.

   Every entry below extends an existing Tailwind class group ID (`font-size`,
   `shadow`, `rounded`, `z` — confirmed against tailwind-merge's own
   default-config source, not guessed) rather than inventing a new one, so
   each scale keeps that group's pre-existing, correct behaviour (font-size's
   conflict with `leading-*`'s postfix modifier; `z`'s existing numeric/auto/
   arbitrary matching, still intact — `z-10 z-20` still dedupes to `z-20`)
   and only gains the Arena-specific names that group didn't already know. */
import { createTV } from 'tailwind-variants';

export const tv = createTV({
  twMerge: true,
  twMergeConfig: {
    classGroups: {
      shadow: [{ shadow: ['1', '2', '3'] }],
      'font-size': [{ text: ['display', 'h1', 'h2', 'h3', 'h4', 'ctl', 'ctl-md', 'ctl-sm', 'ctl-xs', 'ctl-2xs'] }],
      rounded: [{ rounded: ['pill'] }],
      z: [{ z: ['dropdown', 'tooltip', 'modal', 'modal-nested', 'palette', 'onboarding', 'toast'] }],
    },
  },
});
