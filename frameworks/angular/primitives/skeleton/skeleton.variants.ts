import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Skeleton.manifest';

/** Recipe for `arena-skeleton`. See `tag.variants.ts` for why this
 *  extensionless import resolves to the generated `.ts`, not the `.json`.
 *  The manifest's `variant.text` entry is `{}`, not omitted: `skeleton.ts`'s
 *  `Variant` union includes `'text'` (it drives `stacked()`), so the key
 *  must exist for `skeletonStyles({ variant: this.variant() })` to
 *  typecheck, even though the host never reads `root()` for that variant. */
export const skeletonStyles = tv(manifest);
