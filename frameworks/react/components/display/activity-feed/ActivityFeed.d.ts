import type { ActivityItem } from '../../api.generated';

export type { ActivityItem };

/** Event feed — someone did something to something, then.
 * @startingPoint section="Display" subtitle="Event feed" viewport="560x440" */
export interface ActivityFeedProps {
  /** The events, newest first by convention. Each row is drawn by Arena. */
  items: ActivityItem[];
}
export function ActivityFeed(props: ActivityFeedProps): JSX.Element;
