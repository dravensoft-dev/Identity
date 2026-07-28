/* Resolves a component manifest to the class string per slot.
 *
 * This is the "raw className" consumption path frameworks/tailwind/README.md
 * documents, made concrete: read `slots`/`variants`/`compoundVariants` and
 * concatenate. It is what the specimen pages use, and it is deliberately NOT
 * tailwind-variants — a specimen renders one variant combination at a time, so
 * nothing collides and there is nothing for twMerge to dedupe. Angular consumes
 * the same manifests through the shared `tv` instead, which does merge; the two
 * agree on every input a specimen can produce.
 *
 * `compoundVariants` are applied in source order AFTER the single-variant slots,
 * the same order tailwind-variants applies them, so a compound class wins on the
 * one-combination-at-a-time render a specimen produces. An entry applies when
 * every variant it names equals the RESOLVED value — the chosen one, or the
 * manifest default when nothing was chosen (PageHead's `align` defaults to
 * `start`, so its `{ narrow: false, align: 'start' }` compound applies on a bare
 * `classesFor(manifest, { narrow: false })`). Its `class` is a slot->classes map,
 * the same shape a variant value carries.
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
  const out = {};
  for (const [slot, base] of Object.entries(manifest.slots ?? {})) out[slot] = base;

  const append = (applied) => {
    for (const [slot, classes] of Object.entries(applied ?? {})) {
      out[slot] = out[slot] ? `${out[slot]} ${classes}` : classes;
    }
  };

  const resolved = (name) => chosen[name] ?? manifest.defaultVariants?.[name];

  for (const [name, values] of Object.entries(manifest.variants ?? {})) {
    const value = resolved(name);
    if (value === undefined) continue;
    const applied = values[value];
    if (!applied) {
      throw new Error(`${manifest.component}: ${name}="${value}" is not in the manifest — known values: ${Object.keys(values).join(', ')}`);
    }
    append(applied);
  }

  for (const compound of manifest.compoundVariants ?? []) {
    const { class: applied, ...conditions } = compound;
    if (Object.entries(conditions).every(([name, value]) => resolved(name) === value)) append(applied);
  }

  return out;
}
