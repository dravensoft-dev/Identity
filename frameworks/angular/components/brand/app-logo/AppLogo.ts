import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { appLogoStyles } from './AppLogo.variants';
import type { LogoSize, Orientation } from '../../../Api.generated';

@Component({
  selector: 'arena-app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.name]': 'null',
  },
  template: `
    <span [class]="styles().mark()"><ng-content select="[mark]" /></span>
    <span [class]="styles().name()">{{ name() }}@if (dim(); as tail) {<span [class]="styles().dim()">{{ tail }}</span>}</span>
  `,
})
export class AppLogo {
  /** The product name, or its first half when `dim` carries the second. */
  readonly name = input.required<string>();
  /** The wordmark's second half, drawn muted. Present for the manual's Primary variant, absent for Monochrome — which is why there is no `variant` member: the mark's ink and this are the same two decisions. */
  readonly dim = input<string>();
  /** Both halves at once — the mark's slot and the wordmark. */
  readonly size = input<LogoSize>('md');
  /** Mark beside the name, or above it. */
  readonly orientation = input<Orientation>('horizontal');

  protected readonly styles = computed(() =>
    appLogoStyles({ size: this.size(), orientation: this.orientation() }));
}
