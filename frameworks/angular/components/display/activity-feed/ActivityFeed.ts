import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ActivityItem } from '../../../Api.generated';
import { activityFeedStyles } from './ActivityFeed.variants';

export interface ActivityFeedRow {
  item: ActivityItem;
  itemClass: string;
  dotClass: string;
}

export function resolveActivityFeedRows(items: readonly ActivityItem[]): ActivityFeedRow[] {
  return items.map((item, index) => {
    const resolved = activityFeedStyles({ tone: item.tone ?? 'accent', divided: index > 0 });
    return { item, itemClass: resolved.item(), dotClass: resolved.dot() };
  });
}

@Component({
  selector: 'arena-activity-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul [class]="base().root()">
      @for (row of rows(); track row.item.id ?? $index) {
        <li [class]="row.itemClass">
          <span [class]="row.dotClass"></span>
          <span [class]="base().text()">
            <b [class]="base().actor()">{{ row.item.actor }}</b> {{ row.item.action }}
            @if (row.item.target) {
              <span [class]="base().target()">{{ row.item.target }}</span>
            }
          </span>
          @if (row.item.time) {
            <span [class]="base().time()">{{ row.item.time }}</span>
          }
        </li>
      }
    </ul>
  `,
})
export class ActivityFeed {
  readonly items = input.required<readonly ActivityItem[]>();

  protected readonly base = computed(() => activityFeedStyles());
  protected readonly rows = computed(() => resolveActivityFeedRows(this.items()));
}
