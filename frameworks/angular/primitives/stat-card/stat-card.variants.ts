import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/StatCard.manifest';

/** Recipe for `arena-stat-card`. Both `StatCard.manifest.ts` (the
 *  literal-typed build output) and `StatCard.manifest.json` (its source) sit
 *  beside each other, and this extensionless import resolves to the `.ts`
 *  only because TS/bun probe `.ts` before `.json` — a bundler configured
 *  `.json`-first would silently widen every variant back to `string`. */
export const statCardStyles = tv(manifest);
