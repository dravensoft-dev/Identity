import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tagStyles } from './tag.variants';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/** Arena status/emphasis tag — pill, tone taxonomy per the Badge/Tag rule.
 *  The host itself is the recipe's `root` — it is the flex item a parent row lays
 *  out, so root-level classes must live on the host, not one element inside it. */
@Component({
  selector: 'arena-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `<span [class]="styles().dot()"></span><ng-content />`,
})
export class Tag {
  readonly tone = input<Tone>('neutral');
  protected readonly styles = computed(() => tagStyles({ tone: this.tone() }));
}
