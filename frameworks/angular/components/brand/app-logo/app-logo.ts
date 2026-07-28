import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { appLogoStyles } from './app-logo.variants';
import type { LogoSize, Orientation } from '../../api.generated';

/** Brand lock-up: a mark projected into the `mark` slot, beside (horizontal)
 *  or above (vertical) a product name. `name` is required and the `mark`
 *  slot is content the consumer must supply — nothing defaults, so an empty
 *  call site is a bug at the call site, not a variant this component renders
 *  around. The host itself is the recipe's `root` — it is the flex item a
 *  parent row lays out, so root-level classes must live on the host, not one
 *  element inside it. */
@Component({
  selector: 'arena-app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    <span [class]="styles().mark()"><ng-content select="[mark]" /></span>
    <span [class]="styles().name()">{{ name() }}@if (dim(); as tail) {<span [class]="styles().dim()">{{ tail }}</span>}</span>
  `,
})
export class AppLogo {
  readonly name = input.required<string>();
  readonly dim = input<string>();
  readonly size = input<LogoSize>('md');
  readonly orientation = input<Orientation>('horizontal');

  protected readonly styles = computed(() =>
    appLogoStyles({ size: this.size(), orientation: this.orientation() }));
}
