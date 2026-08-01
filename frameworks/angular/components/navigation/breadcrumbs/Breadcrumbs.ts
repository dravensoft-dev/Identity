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
  /** Names this navigation landmark. Required, and guarded at runtime: nothing can derive it, and the constant "Breadcrumb" it used to hardcode made two trails on one page indistinguishable as landmarks while satisfying the requirement mechanically. Say which hierarchy this is a trail through — "Project navigation", never "Breadcrumb". */
  readonly ariaLabel = input.required<string>();
  /** The trail, root first. The last entry is the current location and is never a link. */
  readonly items = input.required<Crumb[]>();
  /** Drawn between crumbs, never before the first. Arena draws it, in its own aria-hidden span. */
  readonly separator = input('/');
  /** A non-current crumb was activated, carrying that crumb alone. The native MouseEvent is not forwarded, so a listener cannot call preventDefault() on the anchor's own navigation -- ctrl-click, middle-click and open-in-new-tab still work for a consumer who wires nothing; intercepting a plain click to substitute SPA routing belongs at the router (routerLink, Link), not here. */
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
