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

export function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function namedManifest(manifest) {
  const base = `arena-${kebab(manifest.component)}`;
  const named = (map, name) => Object.fromEntries(
    Object.keys(map ?? {}).filter((slot) => String(map[slot] ?? '').trim()).map((slot) => [slot, name(slot)]),
  );
  const out = {
    component: manifest.component,
    slots: Object.fromEntries(Object.keys(manifest.slots ?? {}).map((slot) => [slot, `${base}__${kebab(slot)}`])),
  };
  if (manifest.variants) {
    out.variants = Object.fromEntries(Object.entries(manifest.variants).map(([group, values]) => [
      group,
      Object.fromEntries(Object.entries(values).map(([value, slots]) => [
        value, named(slots, (slot) => `${base}__${kebab(slot)}--${kebab(group)}-${kebab(String(value))}`),
      ])),
    ]));
  }
  if (manifest.defaultVariants) out.defaultVariants = manifest.defaultVariants;
  if (manifest.compoundVariants) {
    out.compoundVariants = manifest.compoundVariants.map(({ class: applied, ...conditions }, index) => ({
      ...conditions,
      class: named(applied, (slot) => `${base}__${kebab(slot)}--cv${index + 1}`),
    }));
  }
  return out;
}

export function arenaClassesFor(manifest, chosen = {}) {
  return classesFor(namedManifest(manifest), chosen);
}
