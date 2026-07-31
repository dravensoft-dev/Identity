import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ControlSize, SpinnerTone } from '../../../Api.generated';
import { spinnerStyles } from './Spinner.variants';

@Component({
  selector: 'arena-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    role: 'progressbar',
    'aria-live': 'polite',
    '[attr.aria-label]': 'label()',
  },
  template: `<span [class]="styles().circle()" aria-hidden="true"></span>`,
})
export class Spinner {
  readonly size = input<ControlSize>('md');
  readonly tone = input<SpinnerTone>('accent');
  readonly label = input('Loading');

  protected readonly styles = computed(() => spinnerStyles({ tone: this.tone(), size: this.size() }));
}
