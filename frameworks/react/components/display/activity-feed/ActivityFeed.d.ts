import type { ActivityItem } from '../../../Api.generated';

export type { ActivityItem };

export interface ActivityFeedProps {

  label: string;

  items: ActivityItem[];

  busy?: boolean;
}
export function ActivityFeed(props: ActivityFeedProps): JSX.Element;
