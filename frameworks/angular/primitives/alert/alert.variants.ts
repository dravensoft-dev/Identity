import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/Alert.manifest';

/** Recipe for `arena-alert`. Both `Alert.manifest.ts` (the literal-typed
 *  build output) and `Alert.manifest.json` (its source) sit beside each
 *  other, and this extensionless import resolves to the `.ts` only because
 *  TS/bun probe `.ts` before `.json` — a bundler configured `.json`-first
 *  would silently widen every variant back to `string`. */
export const alertStyles = tv(manifest);
