import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import type { ActivityItem } from '../../../Api.generated';
import { focusableElements } from '../../../FocusTrap';
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
  host: { style: 'display: contents', '(keydown)': 'onKeydown($event)' },
  template: `
    <ul [class]="base().root()" role="feed" [attr.aria-label]="labelText()"
        [attr.aria-busy]="busy() ? 'true' : 'false'">
      @for (row of rows(); track row.item.id ?? $index; let i = $index) {
        <li [class]="row.itemClass" role="article" tabindex="0"
            [attr.aria-posinset]="i + 1" [attr.aria-setsize]="rows().length">
          <span [class]="row.dotClass" aria-hidden="true"></span>
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
  readonly label = input.required<string>();
  readonly items = input.required<readonly ActivityItem[]>();
  readonly busy = input(false, { transform: booleanAttribute });

  protected readonly labelText = computed(() => {
    const name = this.label();
    if (name.trim() === '') {
      throw new Error('ActivityFeed: `label` is required, and names what the events are about');
    }
    return name;
  });

  protected readonly base = computed(() => activityFeedStyles());
  protected readonly rows = computed(() => resolveActivityFeedRows(this.items()));

  protected onKeydown(event: KeyboardEvent): void {
    const feed = event.currentTarget as HTMLElement;
    if (event.ctrlKey && (event.key === 'End' || event.key === 'Home')) {
      const after = event.key === 'End';
      const outside = focusableElements(feed.ownerDocument.body).filter((el) => !feed.contains(el));
      const position = after ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING;
      const reachable = outside.filter((el) => feed.compareDocumentPosition(el) & position);
      const target = after ? reachable[0] : reachable[reachable.length - 1];
      if (!target) return;
      event.preventDefault();
      target.focus();
      return;
    }
    if (event.key !== 'PageDown' && event.key !== 'PageUp') return;
    const articles = Array.from(feed.querySelectorAll<HTMLElement>('[role="article"]'));
    if (articles.length === 0) return;
    const target = event.target as Element | null;
    const here = articles.indexOf(target?.closest('[role="article"]') as HTMLElement);
    const there = here === -1
      ? (event.key === 'PageDown' ? 0 : articles.length - 1)
      : here + (event.key === 'PageDown' ? 1 : -1);
    if (there < 0 || there >= articles.length) return;
    event.preventDefault();
    articles[there].focus();
  }
}
