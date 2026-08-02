import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ToastPlacement } from '../../../Api.generated';
import { toastHostStyles } from './ToastHost.variants';

@Component({
  selector: 'arena-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
  },
  template: `<ng-content />`,
})
export class ToastHost {
  /** Which corner the stack is pinned to. A bottom placement clears the device's own bottom inset, so a stack on a phone never lands under the home indicator. */
  readonly placement = input<ToastPlacement>('bottom-end');

  protected readonly styles = computed(() => toastHostStyles({ placement: this.placement() }));
}
