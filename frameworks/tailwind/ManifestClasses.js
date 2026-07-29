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
