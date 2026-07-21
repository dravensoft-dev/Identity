import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/EmptyState.manifest';

/** Recipe for `arena-empty-state`. Both `EmptyState.manifest.ts` (the
 *  literal-typed build output) and `EmptyState.manifest.json` (its source)
 *  sit beside each other, and this extensionless import resolves to the
 *  `.ts` only because TS/bun probe `.ts` before `.json` — a bundler
 *  configured `.json`-first would silently widen every variant back to
 *  `string`. */
export const emptyStateStyles = tv(manifest);
