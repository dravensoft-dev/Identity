import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { activityFeedStyles } from './activity-feed.variants';

export type ActivityTone = 'neutral' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'info';

export interface ActivityItem {
  id?: string | number;
  actor: string;
  action: string;
  target?: string;
  time?: string;
  tone?: ActivityTone;
}

export interface ActivityFeedRow {
  item: ActivityItem;
  itemClass: string;
  dotClass: string;
}

/** Resolves every item's tone and divider position into its recipe classes
 *  once, independent of Angular so it is directly testable with no DOM: the
 *  first row never carries the divider and every tone resolves to its own
 *  dot colour. `arena-activity-feed`'s `rows` computed calls this rather
 *  than re-resolving `activityFeedStyles` per row on every change-detection
 *  pass, the way a plain arrow/method reached from the template would. */
export function resolveActivityFeedRows(items: readonly ActivityItem[]): ActivityFeedRow[] {
  return items.map((item, index) => {
    const resolved = activityFeedStyles({ tone: item.tone ?? 'accent', divided: index > 0 });
    return { item, itemClass: resolved.item(), dotClass: resolved.dot() };
  });
}

/** An event feed: someone did something to something, then. Its root is a
 *  real `<ul>` — an `<li>` must be a child of a list element, so unlike
 *  every other primitive in this layer it does not host-bind its root (see
 *  components-divergences.md). `renderItem` has no Angular analogue; a
 *  consumer composing a different row does it by hand from the exported
 *  `activityFeedStyles`. */
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
  readonly items = input<readonly ActivityItem[]>([]);

  protected readonly base = computed(() => activityFeedStyles());
  protected readonly rows = computed(() => resolveActivityFeedRows(this.items()));
}
