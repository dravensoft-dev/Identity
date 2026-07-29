import type { ActivityItem } from '../../../Api.generated';

export type { ActivityItem };

export interface ActivityFeedProps {

  items: ActivityItem[];
}
export function ActivityFeed(props: ActivityFeedProps): JSX.Element;
