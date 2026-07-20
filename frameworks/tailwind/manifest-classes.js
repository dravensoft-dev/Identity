/* Resolves a component manifest to the class string per slot.
 *
 * This is the "raw className" consumption path frameworks/tailwind/README.md
 * documents, made concrete: read `slots`/`variants` and concatenate. It is what
 * the specimen pages use, and it is deliberately NOT tailwind-variants — a
 * specimen renders one variant combination at a time, so nothing collides and
 * there is nothing for twMerge to dedupe. Angular consumes the same manifests
 * through the shared `tv` instead, which does merge; the two agree on every
 * input a specimen can produce.
 *
 * Plain ES module with no dependencies, so a <script type="module"> in a static
 * page and `bun test` both import it unchanged.
 */

/** The class string for each slot, with `variants` applied over the manifest's
 *  own defaults.
 *  @param {object} manifest a parsed *.manifest.json
 *  @param {Record<string,string>} [chosen] variant name -> value
 *  @returns {Record<string,string>} slot name -> class string */
export function classesFor(manifest, chosen = {}) {
  if (manifest.compoundVariants) {
    throw new Error(`${manifest.component}: compoundVariants are not supported by manifest-classes.js — render it through tv() instead`);
  }
  const out = {};
  for (const [slot, base] of Object.entries(manifest.slots ?? {})) out[slot] = base;

  for (const [name, values] of Object.entries(manifest.variants ?? {})) {
    const value = chosen[name] ?? manifest.defaultVariants?.[name];
    if (value === undefined) continue;
    const applied = values[value];
    if (!applied) {
      throw new Error(`${manifest.component}: ${name}="${value}" is not in the manifest — known values: ${Object.keys(values).join(', ')}`);
    }
    for (const [slot, classes] of Object.entries(applied)) {
      out[slot] = out[slot] ? `${out[slot]} ${classes}` : classes;
    }
  }
  return out;
}
