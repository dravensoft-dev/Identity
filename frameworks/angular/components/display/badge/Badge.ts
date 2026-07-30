import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import type { Tone } from '../../../Api.generated';
import { badgeStyles } from './Badge.variants';

@Component({
  selector: 'arena-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    @if (dot()) {
      <span [class]="styles().dot()"></span>
    }
    <ng-content />
  `,
})
export class Badge {
  readonly tone = input<Tone>('neutral');
  readonly dot = input(false, { transform: booleanAttribute });

  protected readonly styles = computed(() => badgeStyles({ tone: this.tone() }));
}
