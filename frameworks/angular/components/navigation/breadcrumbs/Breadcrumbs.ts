import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Crumb } from '../../../Api.generated';
import { breadcrumbsStyles } from './Breadcrumbs.variants';

@Component({
  selector: 'arena-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <nav [class]="styles().root()" [attr.aria-label]="label()">
      @for (crumb of items(); track crumb.label; let last = $last) {
        @if (last) {
          <span [class]="styles().current()" aria-current="page">{{ crumb.label }}</span>
        } @else {
          <a [class]="styles().crumb()" [attr.href]="crumb.href ?? '#'" (click)="onCrumbClick(crumb)">{{ crumb.label }}</a>
          <span [class]="styles().separator()" aria-hidden="true">{{ separator() }}</span>
        }
      }
    </nav>
  `,
})
export class Breadcrumbs {
  readonly ariaLabel = input.required<string>();
  readonly items = input.required<Crumb[]>();
  readonly separator = input('/');
  readonly navigate = output<Crumb>();

  protected readonly label = computed(() => {
    const name = this.ariaLabel();
    if (name.trim() === '') {
      throw new Error('Breadcrumbs: `ariaLabel` is required, and names which hierarchy this trail runs through');
    }
    return name;
  });

  protected readonly styles = computed(() => breadcrumbsStyles());

  protected onCrumbClick(crumb: Crumb): void {
    this.navigate.emit(crumb);
  }
}
