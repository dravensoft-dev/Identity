import React from 'react';
import type { ActivityItem } from '../../../Api.generated';
export type { ActivityItem };
export interface ActivityFeedProps {
    label: string;
    items: ActivityItem[];
    busy?: boolean;
}
export declare function ActivityFeed({ items, label, busy }: ActivityFeedProps): React.JSX.Element;
