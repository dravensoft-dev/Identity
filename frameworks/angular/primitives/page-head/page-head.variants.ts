import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/PageHead.manifest';

/** Recipe for `arena-page-head`. Both `PageHead.manifest.ts` (the
 *  literal-typed build output) and `PageHead.manifest.json` (its source)
 *  sit beside each other, and this extensionless import resolves to the
 *  `.ts` only because TS/bun probe `.ts` before `.json` — a bundler
 *  configured `.json`-first would silently widen every variant back to
 *  `string`. `manifest` is `as const`, which freezes `compoundVariants`
 *  into a readonly tuple — exactly the literal typing every other field
 *  needs, but `tv()`'s own `TVCompoundVariants` type is a mutable `Array<…>`,
 *  so the tuple itself (not its element literals) has to be spread into a
 *  fresh mutable array before it typechecks; `[...x]` in this argument
 *  position is still contextually typed against `tv()`'s parameter, so the
 *  `"start"`/`"center"` literals inside each entry survive the copy. */
export const pageHeadStyles = tv({ ...manifest, compoundVariants: [...manifest.compoundVariants] });
