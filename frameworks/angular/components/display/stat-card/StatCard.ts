import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { statCardStyles } from './StatCard.variants';
import type { Tone, StatDelta } from '../../../Api.generated';

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
    @if (delta()?.value; as amount) {
      <span [class]="styles().delta()">
        <i [class]="delta()?.direction === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up'" aria-hidden="true"></i>
        {{ amount }}
      </span>
    }
    @if (sub(); as caption) {
      <span [class]="styles().sub()">{{ caption }}</span>
    }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly tone = input<Tone>('neutral');
  readonly delta = input<StatDelta>();
  readonly sub = input<string>();
  readonly icon = input<string>();

  protected readonly styles = computed(() => statCardStyles({ tone: this.tone(), deltaTone: this.delta()?.tone ?? 'neutral' }));
}
