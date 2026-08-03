/* Turns a manifest into the CSS a component renders, so no Tailwind class name and no
 * Tailwind custom property leaves a package. The class prefix comes from the MANIFEST and
 * never from the component, because a manifest mirrors a surface: Table, TableRow and
 * TableCell share one. The strip is the load-bearing half. `@apply` emits Tailwind's own
 * namespace with the Arena token only as a fallback, `var(--spacing, var(--sp-1))`, and an
 * adopter who runs Tailwind declares `--spacing` on their unlayered `:root`, wins, and
 * rescales every component silently. Stripping to `var(--sp-1)` also repairs `.arena-compact`,
 * which is inert while the density tokens resolve once on `:root` and inherit already
 * resolved. An indirection whose pair `Theme.css` does not confirm is an error, never a
 * pass-through, because a silent skip is the failure this exists to prevent. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDecls } from '../arena/css-decls.mjs';
import { kebab } from '../arena/layers.mjs';

export const CLASS_PREFIX = 'arena';
export const INDIRECTION = /var\(\s*--([a-z0-9-]+)\s*,\s*var\(\s*--([a-z0-9-]+)\s*\)\s*\)/g;
export const isThemeKey = (name) => !name.startsWith('tw-');

export const slotClass = (manifest, slot) => `${CLASS_PREFIX}-${kebab(manifest)}__${kebab(slot)}`;
export const variantClass = (manifest, slot, group, value) =>
  `${slotClass(manifest, slot)}--${kebab(group)}-${kebab(String(value))}`;
export const compoundClass = (manifest, slot, index) => `${slotClass(manifest, slot)}--cv${index + 1}`;

export function applyRules(manifest) {
  const rules = [];
  const push = (selector, classes) => {
    const trimmed = String(classes ?? '').trim();
    if (trimmed) rules.push({ selector, classes: trimmed });
  };

  for (const [slot, classes] of Object.entries(manifest.slots ?? {}))
    push(slotClass(manifest.component, slot), classes);

  for (const [group, values] of Object.entries(manifest.variants ?? {}))
    for (const [value, slots] of Object.entries(values))
      for (const [slot, classes] of Object.entries(slots ?? {}))
        push(variantClass(manifest.component, slot, group, value), classes);

  (manifest.compoundVariants ?? []).forEach((compound, index) => {
    const { class: applied } = compound;
    for (const [slot, classes] of Object.entries(applied ?? {}))
      push(compoundClass(manifest.component, slot, index), classes);
  });

  return rules;
}

export function classNames(manifest) {
  return applyRules(manifest).map((rule) => rule.selector);
}

export function classesManifest(manifest) {
  const named = (map, name) => Object.fromEntries(
    Object.keys(map ?? {}).filter((slot) => String(map[slot] ?? '').trim()).map((slot) => [slot, name(slot)]),
  );
  const everySlot = Object.fromEntries(
    Object.keys(manifest.slots ?? {}).map((slot) => [slot, slotClass(manifest.component, slot)]),
  );

  const out = { component: manifest.component, slots: everySlot };

  if (manifest.variants) {
    out.variants = Object.fromEntries(Object.entries(manifest.variants).map(([group, values]) => [
      group,
      Object.fromEntries(Object.entries(values).map(([value, slots]) => [
        value,
        named(slots, (slot) => variantClass(manifest.component, slot, group, value)),
      ])),
    ]));
  }
  if (manifest.defaultVariants) out.defaultVariants = manifest.defaultVariants;
  if (manifest.compoundVariants) {
    out.compoundVariants = manifest.compoundVariants.map(({ class: applied, ...conditions }, index) => ({
      ...conditions,
      class: named(applied, (slot) => compoundClass(manifest.component, slot, index)),
    }));
  }
  return out;
}

export function entryStylesheet(presetPath, manifests) {
  const body = [...manifests.values()]
    .flatMap((manifest) => applyRules(manifest))
    .map(({ selector, classes }) => `  .${selector} { @apply ${classes}; }`)
    .join('\n');
  return `@reference '${presetPath}';\n\n@layer utilities {\n${body}\n}\n`;
}

export function themeKeyMap(themeCss) {
  const map = new Map();
  for (const decls of parseDecls(themeCss).values()) {
    for (const [name, value] of decls) {
      if (name.endsWith('-*')) continue;
      const single = /^\s*var\(\s*--([a-z0-9-]+)\s*\)\s*$/.exec(value);
      if (single) map.set(name, single[1]);
    }
  }
  return map;
}

export function stripProblems(css, themeMap) {
  const problems = [];
  for (const [, key, token] of css.matchAll(INDIRECTION)) {
    if (!isThemeKey(key)) continue;
    if (themeMap.get(key) !== token) {
      problems.push(`var(--${key}, var(--${token})) is not a pair Theme.css declares, so the strip `
        + `cannot know that --${token} is what --${key} means; add it to the preset or stop emitting it`);
    }
  }
  return [...new Set(problems)];
}

export function stripIndirection(css) {
  let out = css;
  for (let previous = null; previous !== out;) {
    previous = out;
    out = out.replace(INDIRECTION, (match, key, token) => (isThemeKey(key) ? `var(--${token})` : match));
  }
  return out;
}

export function themeMapFor(root) {
  return themeKeyMap(readFileSync(join(root, 'frameworks/tailwind/Theme.css'), 'utf8'));
}
