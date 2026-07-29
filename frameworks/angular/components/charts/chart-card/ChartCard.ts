import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { ArenaActions } from '../../../ProjectionMarkers';
import { chartCardStyles } from './ChartCard.variants';

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
