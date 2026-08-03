export type SlotClasses = Record<string, string>;
export type VariantGroups = Record<string, Record<string, Partial<SlotClasses>>>;
export type Choice = string | boolean | undefined;

export interface CompoundVariant {
  readonly class: Partial<SlotClasses>;
  readonly [condition: string]: Choice | Partial<SlotClasses>;
}

export interface ClassManifest {
  readonly component: string;
  readonly slots: SlotClasses;
  readonly variants?: VariantGroups;
  readonly defaultVariants?: Record<string, Choice>;
  readonly compoundVariants?: readonly CompoundVariant[];
}

export type Selection = Record<string, Choice>;
export type Slots<M extends ClassManifest> = { readonly [K in keyof M['slots']]: () => string };

export function arenaStyles<M extends ClassManifest>(manifest: M) {
  const slotNames = Object.keys(manifest.slots);

  return (chosen: Selection = {}): Slots<M> => {
    const applied = new Map<string, string[]>();
    for (const slot of slotNames) {
      const base = manifest.slots[slot];
      applied.set(slot, base ? [base] : []);
    }

    const append = (classes: Partial<SlotClasses> | undefined) => {
      for (const [slot, name] of Object.entries(classes ?? {})) {
        const into = applied.get(slot);
        if (name && into) into.push(name);
      }
    };

    const resolved = (group: string): Choice =>
      (chosen[group] ?? manifest.defaultVariants?.[group]);

    for (const [group, values] of Object.entries(manifest.variants ?? {})) {
      const value = resolved(group);
      if (value === undefined) continue;
      const branch = values[String(value)];
      if (!branch) {
        throw new Error(`${manifest.component}: ${group}="${String(value)}" is not in the manifest, `
          + `known values: ${Object.keys(values).join(', ')}`);
      }
      append(branch);
    }

    for (const compound of manifest.compoundVariants ?? []) {
      const { class: classes, ...conditions } = compound;
      const holds = Object.entries(conditions)
        .every(([group, value]) => resolved(group) === value);
      if (holds) append(classes);
    }

    const out: Record<string, () => string> = {};
    for (const slot of slotNames) {
      const names = applied.get(slot) ?? [];
      out[slot] = () => names.join(' ');
    }
    return out as Slots<M>;
  };
}
