import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { ArenaActions } from '../../../ProjectionMarkers';
import { arenaChartCardStyles } from './ArenaChartCard.variants';

@Component({
  selector: 'arena-chart-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.title]': 'null',
  },
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
export class ArenaChartCard {
  /** The card heading. Absent renders no head unless `actions` is present. */
  readonly title = input<string>();

  protected readonly actions = contentChild(ArenaActions);

  protected readonly styles = computed(() => arenaChartCardStyles());
}
