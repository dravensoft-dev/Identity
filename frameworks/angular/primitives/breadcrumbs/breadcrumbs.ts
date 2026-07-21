import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { breadcrumbsStyles } from './breadcrumbs.variants';

/** One entry in a breadcrumb trail. `href` is omitted for the current page,
 *  which is never rendered as a link -- React's `Breadcrumbs.jsx` follows
 *  the same rule from its own last-item check. */
export interface ArenaCrumb {
  label: string;
  href?: string;
}

/** Explicit return path for hierarchies deeper than tabs. The last crumb is
 *  the current page -- not a link, and marked `aria-current="page"`. The
 *  host itself is the recipe's `root`, so it is both the flex item a parent
 *  row lays out and the trail's own `nav` landmark (`role="navigation"`,
 *  `aria-label="Breadcrumb"`), with no wrapper element rendered inside it.
 *  A crumb click reports the whole `ArenaCrumb` through `navigate` rather
 *  than React's per-item `onClick` callback, so one output covers every
 *  item instead of a callback prop per crumb. */
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
        <a [class]="styles().crumb()" [attr.href]="crumb.href ?? '#'" (click)="navigate.emit(crumb)">{{ crumb.label }}</a>
        <span [class]="styles().separator()" aria-hidden="true">{{ separator() }}</span>
      }
    }
  `,
})
export class Breadcrumbs {
  readonly items = input<ArenaCrumb[]>([]);
  readonly separator = input('/');
  readonly navigate = output<ArenaCrumb>();

  protected readonly styles = computed(() => breadcrumbsStyles());
}
