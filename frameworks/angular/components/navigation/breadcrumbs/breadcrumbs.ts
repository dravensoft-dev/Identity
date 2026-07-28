import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Crumb } from '../../api.generated';
import { breadcrumbsStyles } from './breadcrumbs.variants';

/** Explicit return path for hierarchies deeper than tabs. The last crumb is
 *  the current page -- not a link, and marked `aria-current="page"`. The
 *  host itself is the recipe's `root`, so it is both the flex item a parent
 *  row lays out and the trail's own `nav` landmark (`role="navigation"`,
 *  `aria-label="Breadcrumb"`), with no wrapper element rendered inside it.
 *  A crumb click reports the clicked `Crumb` alone through `navigate`,
 *  matching React's `onNavigate(crumb)`; the native `MouseEvent` is not
 *  forwarded, so a listener cannot call `preventDefault()` on the anchor's
 *  own navigation. The anchor still navigates natively -- ctrl-click,
 *  middle-click and open-in-new-tab keep working for a consumer who wires
 *  nothing -- but intercepting a plain click to substitute SPA routing now
 *  belongs at the router (`routerLink`), not here. */
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
