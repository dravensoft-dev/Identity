/* The shape a `*.manifest.json` holds on disk, so the scripts that read one agree about it.
 * Every reader reaches a manifest's classes through `Object.entries()` over a `JSON.parse`
 * that hands back `unknown`, so one spelling `manifest.variants` was making a claim about the
 * file it never stated. `component` is the only key every manifest on disk carries; the rest
 * are optional because every reader already guards them with `?? {}`. A compound variant is
 * the open shape: its keys are whichever axes it selects on plus `class`, the slot map it
 * contributes. A variant value is a string in `variants`, whose keys are JSON keys, and a
 * boolean in `defaultVariants` and in a compound selector -- twelve manifests default an axis
 * to one and ArenaPageHead selects on `narrow: false`. `arenaTv()` reconciles the two at
 * runtime; `tailwind-variants` does not model it, and `style-parity.ts` says so at the cast. */

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

export type Manifests = Map<string, ComponentManifest>;
