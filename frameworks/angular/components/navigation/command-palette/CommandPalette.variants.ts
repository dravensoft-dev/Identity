import { tv } from '../../../../tailwind/Tv';
import manifest from '../../../../tailwind/components/navigation/command-palette/CommandPalette.manifest';

/** Recipe for `arena-command-palette`. See `Tag.variants.ts` for why this
 *  extensionless import resolves to the generated `.ts`, not the `.json`. */
export const commandPaletteStyles = tv(manifest);
