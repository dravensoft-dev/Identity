import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/BulkActionBar.manifest';

/** Recipe for `arena-bulk-action-bar`. Both `BulkActionBar.manifest.ts` (the
 *  literal-typed build output) and `BulkActionBar.manifest.json` (its source)
 *  sit beside each other, and this extensionless import resolves to the
 *  `.ts` only because TS/bun probe `.ts` before `.json` -- a bundler
 *  configured `.json`-first would silently widen every variant back to
 *  `string`. */
export const bulkActionBarStyles = tv(manifest);
