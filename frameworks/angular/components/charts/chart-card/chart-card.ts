import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { ArenaActions } from '../projection-markers';
import { chartCardStyles } from './chart-card.variants';

/** The card a chart sits on. `title` is an uppercase muted microlabel,
 *  deliberately not a heading element: a dashboard is a grid of tiles, and
 *  one `h2` per tile would fabricate a document outline nobody asked for —
 *  the chart inside carries the accessible name through its own
 *  `role="img"`. The host is the recipe's `root`, the flex item a parent
 *  lays out. The head row — the title plus the projected `[actions]`
 *  — renders only when at least one of them is actually present, mirroring
 *  React's own `{(title || actions) && (...)}` gate: with neither, an empty
 *  flex row would still consume the root's `gap-3` between it and the
 *  chart. */
@Component({
  selector: 'arena-chart-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    @if (title() || actions()) {
      <div [class]="styles().head()">
        @if (title(); as label) {
          <span [class]="styles().title()">{{ label }}</span>
        }
        @if (actions()) {
          <div [class]="styles().actions()"><ng-content select="[actions]" /></div>
        }
      </div>
    }
    <ng-content />
  `,
})
export class ChartCard {
  readonly title = input<string>();

  protected readonly actions = contentChild(ArenaActions);

  protected readonly styles = computed(() => chartCardStyles());
}
