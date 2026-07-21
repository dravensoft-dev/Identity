import { tv } from '../../../tailwind/tv';
import manifest from '../../../tailwind/components/ActivityFeed.manifest';

/** Recipe for `arena-activity-feed`. See `tag.variants.ts` for why this
 *  extensionless import resolves to the generated `.ts`, not the `.json`. */
export const activityFeedStyles = tv(manifest);
