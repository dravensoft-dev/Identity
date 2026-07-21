import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/CommandPalette.manifest';

/** Recipe for `arena-command-palette`. See `tag.variants.ts` for why this
 *  extensionless import resolves to the generated `.ts`, not the `.json`. */
export const commandPaletteStyles = tv(manifest);
