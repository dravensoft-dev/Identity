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

   THE RULE, stated once so this stops being rediscovered one namespace at a
   time: an Arena-specific suffix in ANY namespace fails self-dedupe unless
   it is registered. tailwind-merge only recognises a class group's *stock*
   Tailwind names (a fixed list, or a shape test like "t-shirt-sized") —
   never our CSS, which it does not read. A suffix we invented (`label`,
   `scrim`, `ctl`, `pill`, `dropdown`, `icon-sm`, `emphatic`, `page`...) is
   therefore invisible to the group unless we say so, and an invisible
   suffix does not conflict with its own siblings, so two of them can both
   survive one merged string when only the later one should (see failure 2
   above). The names that *do* dedupe unregistered — `tracking-tight`,
   `leading-snug`, `blur-lg`, `font-semibold` — do so only because they
   happen to spell one of Tailwind's own stock scale names, not because
   their namespace is safe. Judging a namespace "safe" from one such
   pairing is exactly the mistake that let `--tracking-*`, `--leading-*`,
   `--blur-*`, `--size-icon-*`, `--ease-emphatic`, `--container-page` and
   `--font-weight-regular` ship under-registered: none of these five were
   found by guessing where else to look — the enumerated test below turned
   up every Arena key in `theme.css` mechanically and tried each one, and
   `font-weight-regular` in particular is the sharpest case for why: Arena
   names its 400 weight `regular`, Tailwind's own stock scale calls the
   same weight `normal`, and `font-medium`/`font-semibold`/`font-bold`/
   `font-extrabold`/`font-black` all happen to already spell stock names,
   so nothing about probing the same namespace's OTHER keys would ever
   have surfaced it. Trust the rule, not a sample pairing: every
   Arena-specific suffix gets an entry below, full stop.

   Every entry below extends an existing Tailwind class group ID (`font-size`,
   `shadow`, `rounded`, `z`, `tracking`, `leading`, `blur`, `size`, `ease`,
   `max-w`, `font-weight` — each confirmed against tailwind-merge's own
   default-config source, not guessed: the obvious-looking `radius`/
   `z-index`/`container` are wrong, the real IDs are `rounded`/`z`/`max-w`)
   rather than inventing a new one, so each scale keeps that group's
   pre-existing, correct behaviour (font-size's conflict with `leading-*`'s
   postfix modifier; `z`'s existing numeric/auto/arbitrary matching, still
   intact — `z-10 z-20` still dedupes to `z-20`) and only gains the
   Arena-specific names that group didn't already know. A stock name that
   already works (`tracking-tight`, `leading-snug`, `font-bold`) needs no
   entry — adding one would be redundant, not protective. `color` and
   `font` (family) are the two namespaces in `theme.css` with no entry here
   at all, and that is not an oversight: tailwind-merge's theme matchers
   for both (`isAny` for `color`, `isAnyNonArbitrary` for `font`) accept
   literally any bare identifier, so an unrecognised suffix — the
   precondition for the whole failure mode this file guards against —
   cannot occur for either one.

   scripts/tv-merge.test.mjs enumerates every Arena-defined key straight out
   of frameworks/tailwind/theme.css (by finding each `--<ns>-*: initial`
   reset and collecting the `--<ns>-<key>` declarations under it) and
   asserts each namespace's keys dedupe pairwise, so a new key in an
   existing namespace fails the day it is added instead of surviving until
   some recipe composes two of them. */
import { createTV } from 'tailwind-variants';

export const tv = createTV({
  twMerge: true,
  twMergeConfig: {
    classGroups: {
      shadow: [{ shadow: ['1', '2', '3'] }],
      'font-size': [{ text: ['display', 'h1', 'h2', 'h3', 'h4', 'ctl', 'ctl-md', 'ctl-sm', 'ctl-xs', 'ctl-2xs'] }],
      rounded: [{ rounded: ['pill'] }],
      z: [{ z: ['dropdown', 'tooltip', 'modal', 'modal-nested', 'palette', 'onboarding', 'toast'] }],
      tracking: [{ tracking: ['label', 'field-label', 'column-header', 'badge', 'uppercase-status', 'mono-nav'] }],
      leading: [{ leading: ['body'] }],
      blur: [{ blur: ['scrim'] }],
      size: [{ size: ['icon-sm', 'icon-md', 'icon-lg', 'icon-xl'] }],
      ease: [{ ease: ['emphatic'] }],
      'max-w': [{ 'max-w': ['page'] }],
      'font-weight': [{ font: ['regular'] }],
    },
  },
});
