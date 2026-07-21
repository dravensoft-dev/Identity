import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { statCardStyles } from './stat-card.variants';

type DeltaTone = 'neutral' | 'positive' | 'negative';
type Direction = 'up' | 'down';

/** One metric on a dashboard: a micro-label, the number, and an optional delta pill.
 *  `deltaTone` says whether the change is good; `deltaDirection` says which way it
 *  points — separate inputs because they are separate facts, and both signs render
 *  as an outline pill, never filled. The host itself is the recipe's `root` — it is
 *  the flex item a parent row lays out, so root-level classes must live on the host,
 *  not one element inside it. */
@Component({
  selector: 'arena-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    <div [class]="styles().head()">
      <span [class]="styles().label()">{{ label() }}</span>
      @if (icon(); as glyph) {
        <span [class]="styles().icon()" aria-hidden="true"><i [class]="glyph"></i></span>
      }
    </div>
    <div [class]="styles().value()">{{ value() }}</div>
    @if (deltaValue(); as delta) {
      <span [class]="styles().delta()">
        <i [class]="deltaDirection() === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up'" aria-hidden="true"></i>
        {{ delta }}
      </span>
    }
    @if (sub(); as caption) {
      <span [class]="styles().sub()">{{ caption }}</span>
    }
  `,
})
export class StatCard {
  readonly label = input('');
  readonly value = input('');
  readonly sub = input<string>();
  readonly icon = input<string>();
  readonly deltaValue = input<string>();
  readonly deltaTone = input<DeltaTone>('neutral');
  readonly deltaDirection = input<Direction>('up');

  protected readonly styles = computed(() => statCardStyles({ deltaTone: this.deltaTone() }));
}
