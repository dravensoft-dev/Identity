import { tv } from '../../../../tailwind/Tv';
import manifest from '../../../../tailwind/components/display/unauth-card/UnauthCard.manifest';

/** Recipe for `arena-unauth-card`. Both `UnauthCard.manifest.ts` (the literal-typed
 *  build output) and `UnauthCard.manifest.json` (its source) sit beside each other,
 *  and this extensionless import resolves to the `.ts` only because TS/bun probe
 *  `.ts` before `.json` — a bundler configured `.json`-first would silently widen
 *  every variant back to `string`. */
export const unauthCardStyles = tv(manifest);
