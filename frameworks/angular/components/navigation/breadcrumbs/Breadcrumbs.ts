import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Crumb } from '../../../Api.generated';
import { breadcrumbsStyles } from './Breadcrumbs.variants';

@Component({
  selector: 'arena-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    role: 'navigation',
    'aria-label': 'Breadcrumb',
  },
  template: `
    @for (crumb of items(); track crumb.label; let last = $last) {
      @if (last) {
        <span [class]="styles().current()" aria-current="page">{{ crumb.label }}</span>
      } @else {
        <a [class]="styles().crumb()" [attr.href]="crumb.href ?? '#'" (click)="onCrumbClick(crumb)">{{ crumb.label }}</a>
        <span [class]="styles().separator()" aria-hidden="true">{{ separator() }}</span>
      }
    }
  `,
})
export class Breadcrumbs {
  readonly items = input.required<Crumb[]>();
  readonly separator = input('/');
  readonly navigate = output<Crumb>();

  protected readonly styles = computed(() => breadcrumbsStyles());

  protected onCrumbClick(crumb: Crumb): void {
    this.navigate.emit(crumb);
  }
}
