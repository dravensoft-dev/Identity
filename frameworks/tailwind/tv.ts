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
   `scrim`, `ctl`, `pill`, `dropdown`, `icon-sm`, `emphatic`, `page`,
   `ctl-h`...) is therefore invisible to the group unless we say so, and an
   invisible suffix does not conflict with its own siblings, so two of them
   can both survive one merged string when only the later one should (see
   failure 2 above). The names that *do* dedupe unregistered —
   `tracking-tight`, `leading-snug`, `blur-lg`, `font-semibold` — do so only
   because they happen to spell one of Tailwind's own stock scale names, not
   because their namespace is safe. Judging a namespace "safe" from one such
   pairing is exactly the mistake that let `--tracking-*`, `--leading-*`,
   `--blur-*`, `--size-icon-*`, `--ease-emphatic`, `--container-page`,
   `--font-weight-regular` and, worst, `--spacing-ctl-h`/`ctl-h-sm`/
   `ctl-h-lg`/`row-py`/`row-px`/`stack`/`gutter` ship under-registered.
   `--spacing-*` is the sharpest case of all: it is the one Arena namespace
   theme.css deliberately does NOT reset (`--spacing: var(--sp-1)` stays
   live so Tailwind's own numeric scale keeps working alongside Arena's
   named steps — see theme.css's own comment), which is exactly why a first
   pass at closing this class, keyed off `--<ns>-*: initial` markers, still
   missed it: `Button.manifest.json` used `h-ctl-h`/`h-ctl-h-sm`/
   `h-ctl-h-lg` across its three sizes with none of them deduping. Trust the
   rule, not a sample pairing, and not a marker that happens to hold for
   every namespace but one: every Arena-specific suffix gets an entry below,
   full stop — see the spacing section below for how "every entry" is kept
   honest for a namespace with dozens of consuming utilities instead of one.

   Every entry below extends an existing Tailwind class group ID (`font-size`,
   `shadow`, `rounded`, `z`, `tracking`, `leading`, `blur`, `size`, `ease`,
   `max-w`, `font-weight`, plus every group `spacingConsumingGroups()` finds
   below — each confirmed against tailwind-merge's own default-config
   source, not guessed: the obvious-looking `radius`/`z-index`/`container`
   are wrong, the real IDs are `rounded`/`z`/`max-w`) rather than inventing
   a new one, so each scale keeps that group's pre-existing, correct
   behaviour (font-size's conflict with `leading-*`'s postfix modifier;
   `z`'s existing numeric/auto/arbitrary matching, still intact — `z-10
   z-20` still dedupes to `z-20`) and only gains the Arena-specific names
   that group didn't already know. A stock name that already works
   (`tracking-tight`, `leading-snug`, `font-bold`) needs no entry — adding
   one would be redundant, not protective. `color` and `font` (family) are
   the two namespaces in `theme.css` with no entry here at all, and that is
   not an oversight: tailwind-merge's theme matchers for both (`isAny` for
   `color`, `isAnyNonArbitrary` for `font`) accept literally any bare
   identifier, so an unrecognised suffix — the precondition for the whole
   failure mode this file guards against — cannot occur for either one.

   --- Arena's spacing suffixes: generated, not hand-picked ------------------
   `--spacing-*` is open by design (no `initial` reset), so Arena's seven
   named steps (`ctl-h`, `ctl-h-sm`, `ctl-h-lg`, `row-py`, `row-px`, `stack`,
   `gutter`) sit alongside Tailwind's own numeric scale rather than
   replacing it. That scale is not consumed by one utility the way `pill`
   only ever means `rounded-pill` — Tailwind v4 reads it from `p*`, `m*`,
   `gap*`, `inset*`/`top`/`right`/`bottom`/`left`, `w`/`min-w`/`max-w`,
   `h`/`min-h`/`max-h`, `translate*`, `scroll-m*`, `scroll-p*`,
   `border-spacing*`, `basis`, even `leading` (a deprecated numeric
   fallback) — dozens of class groups, and the list is tailwind-merge's to
   grow, not ours to keep current by hand. Hand-picking "the ones Arena
   currently uses" is exactly the guess this whole file exists to stop
   making, so instead: `spacingConsumingGroups()` asks tailwind-merge's own
   `getDefaultConfig()` which class groups read the `spacing` theme (by
   probing each theme-getter validator with a tagged object — `fromTheme`
   marks every getter it returns with `.isThemeGetter`, so this needs no
   private API, only that public marker), and every group it finds gets all
   seven Arena suffixes. `size`, `max-w` and `leading` are also
   hand-registered above for other reasons (icon sizes, `page`,
   `body`) — `mergeClassGroup` below unions the two instead of one
   silently replacing the other.

   scripts/tv-merge.test.mjs derives its namespaces from theme.css's key
   names (not from `--<ns>-*: initial` markers alone — that was fix pass 1's
   claim, and `--spacing-*`, deliberately unreset, is exactly what it
   missed) and asserts each dedupes pairwise, so a new key in one of THOSE
   namespaces fails the day it is added.

   Fix pass 2 named the next gap honestly — a namespace both unreset and not
   one of tailwind-merge's native `@theme` namespaces would go undetected —
   but honest was not the same as caught: that shape (`--widget-shape-round`
   is the constructed example) never enters `namespaces` at all, so nothing
   was left to fail. A whole new Arena namespace like that could have
   shipped with zero protection and a fully green suite. Fix pass 3 closes
   it structurally instead of documenting it: a SEPARATE completeness check
   in scripts/tv-merge.test.mjs independently lists every property in
   theme.css that looks namespaced (`--<namespace>-<suffix>`) and asserts
   each one was either attributed by `deriveNamespaces` or is named in an
   `UNATTRIBUTED` map with a reason (the same shape as check-tailwind-
   coverage.mjs's own `EXCLUDED`, stale entries included) — so an
   unattributed key is a hard failure regardless of whether it was ever
   discoverable by namespace, closing this defect class for real rather
   than for the shapes found so far. */
import { createTV } from 'tailwind-variants';
import { getDefaultConfig } from 'tailwind-merge';

export const ARENA_SPACING_SUFFIXES = ['ctl-h', 'ctl-h-sm', 'ctl-h-lg', 'row-py', 'row-px', 'stack', 'gutter', 'sidebar'];

type ThemeGetterLike = ((theme: Record<string, unknown>) => unknown) & { isThemeGetter?: boolean };

/** True only for the `fromTheme('spacing')` getter. `fromTheme(key)` returns
 *  `(theme) => theme[key] || fallback` and tags it `.isThemeGetter` — so
 *  calling a theme getter with a probe object whose ONLY key is `spacing`
 *  returns the probe value back if and only if that getter reads `spacing`;
 *  any other getter (font, text, ease...) finds nothing at `theme[key]` and
 *  returns the fallback instead. This reads tailwind-merge's own public
 *  getter shape rather than a private list. */
function readsSpacingTheme(validator: unknown): boolean {
  if (typeof validator !== 'function' || !(validator as ThemeGetterLike).isThemeGetter) return false;
  const probe = Symbol('spacing-probe');
  return (validator as ThemeGetterLike)({ spacing: probe }) === probe;
}

/** Every class group in tailwind-merge's default config whose validators
 *  include the `spacing` theme getter, mapped to the classPart name(s)
 *  tailwind-merge parses the suffix under (normally the groupId itself,
 *  but `start`/`end` each register two spellings — `inset-s`/`start`,
 *  `inset-e`/`end` — for the same group, so both get covered). */
export function spacingConsumingGroups(): Record<string, Set<string>> {
  const found: Record<string, Set<string>> = {};
  const classGroups = getDefaultConfig().classGroups as Record<string, readonly unknown[]>;
  for (const [groupId, entries] of Object.entries(classGroups)) {
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      for (const [classPart, validators] of Object.entries(entry as Record<string, unknown>)) {
        if (Array.isArray(validators) && validators.some(readsSpacingTheme)) {
          (found[groupId] ??= new Set()).add(classPart);
        }
      }
    }
  }
  return found;
}

type ClassGroupEntries = Record<string, string[]>;

/** Unions a generated `{ classPart: suffixes }` registration into a
 *  possibly already hand-written entry for the same groupId, rather than
 *  letting a plain object-spread silently drop one side. */
function mergeClassGroup(existingEntries: ClassGroupEntries[] | undefined, generatedEntries: ClassGroupEntries[]): ClassGroupEntries[] {
  const merged: ClassGroupEntries = {};
  for (const entry of [...(existingEntries ?? []), ...generatedEntries]) {
    for (const [classPart, suffixes] of Object.entries(entry)) {
      merged[classPart] = [...new Set([...(merged[classPart] ?? []), ...suffixes])];
    }
  }
  return [merged];
}

const handWritten: Record<string, ClassGroupEntries[]> = {
  shadow: [{ shadow: ['1', '2', '3'] }],
  'font-size': [{ text: ['mega', 'hero', 'display', 'h1', 'h2', 'h3', 'h4', 'ctl-lg', 'ctl', 'ctl-md', 'ctl-sm', 'ctl-xs', 'ctl-2xs', 'logo-sm', 'logo-md', 'logo-lg', 'logo-xl'] }],
  rounded: [{ rounded: ['pill'] }],
  z: [{ z: ['dropdown', 'tooltip', 'modal', 'modal-nested', 'palette', 'onboarding', 'toast'] }],
  tracking: [{ tracking: ['label', 'field-label', 'column-header', 'badge', 'uppercase-status', 'mono-nav'] }],
  leading: [{ leading: ['body', 'ctl'] }],
  blur: [{ blur: ['scrim'] }],
  size: [{ size: ['icon-sm', 'icon-md', 'icon-lg', 'icon-xl', 'avatar-xs', 'avatar-sm', 'avatar-md', 'avatar-lg', 'logo-mark-sm', 'logo-mark-md', 'logo-mark-lg', 'logo-mark-xl'] }],
  ease: [{ ease: ['emphatic'] }],
  'max-w': [{ 'max-w': ['page'] }],
  'font-weight': [{ font: ['regular'] }],
};

const classGroups: Record<string, ClassGroupEntries[]> = { ...handWritten };
for (const [groupId, classParts] of Object.entries(spacingConsumingGroups())) {
  const generated = [Object.fromEntries([...classParts].map((part) => [part, ARENA_SPACING_SUFFIXES]))];
  classGroups[groupId] = mergeClassGroup(handWritten[groupId], generated);
}

export const tv = createTV({
  twMerge: true,
  twMergeConfig: { classGroups },
});
