/* The shape a `*.manifest.json` holds on disk, so the scripts that read one agree about it.
 * Every reader reaches its classes through `Object.entries()` over a `JSON.parse` that hands
 * back `unknown`, so one spelling `manifest.variants` was claiming something about the file it
 * never stated. `component` is the only key every manifest carries; the rest are optional
 * because every reader guards them with `?? {}`. A compound variant is the open shape: its
 * keys are whichever axes it selects on plus `class`. A variant value is a string in
 * `variants`, whose keys are JSON keys, and a boolean in `defaultVariants` and in a compound
 * selector -- twelve default an axis to one, ArenaPageHead selects on `narrow: false`, and
 * `arenaTv()` reconciles that at runtime where `tailwind-variants` does not type it, which is
 * the cast in style-parity.ts. Readers wanting only classes take the partial. */

export type SlotClasses = Record<string, string>;

export type CompoundVariant = {
  class?: SlotClasses;
  [axis: string]: string | boolean | SlotClasses | undefined;
};

export type ComponentManifest = {
  component: string;
  slots?: SlotClasses;
  variants?: Record<string, Record<string, SlotClasses>>;
  defaultVariants?: Record<string, string | boolean>;
  compoundVariants?: CompoundVariant[];
};

export type ManifestClassSource = Partial<ComponentManifest>;

export type Manifests = Map<string, ComponentManifest>;
