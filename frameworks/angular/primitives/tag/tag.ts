import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tagStyles } from './tag.variants';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/** Arena status/emphasis tag — pill, tone taxonomy per the Badge/Tag rule. */
@Component({
  selector: 'arena-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="styles().root()"><span [class]="styles().dot()"></span><ng-content /></span>`,
})
export class Tag {
  readonly tone = input<Tone>('neutral');
  protected readonly styles = computed(() => tagStyles({ tone: this.tone() }));
}
