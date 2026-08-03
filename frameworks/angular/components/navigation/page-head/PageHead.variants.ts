import { arenaStyles } from '../../../ArenaStyles.generated';
import manifest from './PageHead.classes.generated';

export const pageHeadStyles = arenaStyles({ ...manifest, compoundVariants: [...manifest.compoundVariants] });
