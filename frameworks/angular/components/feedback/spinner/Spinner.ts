import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ArenaControlSize, ArenaSpinnerTone } from '../../../Api.generated';
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
  /** Diameter. 'sm' is --icon-sm exactly, so a spinner at that size sits inline with control text. */
  readonly size = input<ArenaControlSize>('md');
  /** Colour of the ring. 'on-accent' inside a filled button; 'accent' on a page surface. */
  readonly tone = input<ArenaSpinnerTone>('accent');
  /** Accessible name, announced by the status role. Say what is loading when you can. */
  readonly label = input('Loading');

  protected readonly styles = computed(() => spinnerStyles({ tone: this.tone(), size: this.size() }));
}
