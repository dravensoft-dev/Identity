import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Tag.manifest';

/** Recipe for `arena-tag`. Both `Tag.manifest.ts` (the literal-typed build
 *  output) and `Tag.manifest.json` (its source) sit beside each other, and
 *  this extensionless import resolves to the `.ts` only because TS/bun probe
 *  `.ts` before `.json` — a bundler configured `.json`-first would silently
 *  widen every variant back to `string`. */
export const tagStyles = tv(manifest);
