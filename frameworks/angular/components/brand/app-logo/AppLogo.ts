import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { appLogoStyles } from './AppLogo.variants';
import type { LogoSize, Orientation } from '../../../Api.generated';

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
