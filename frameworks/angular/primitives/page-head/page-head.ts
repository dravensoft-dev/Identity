import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { containerWidth, readBreakpoint } from '../container-size';
import { ArenaActions } from '../projection-markers';
import { pageHeadStyles } from './page-head.variants';

/** Page header: the display-weight title, an optional subtitle, and the page's
 *  actions. It stacks below `--bp-sm`, measured on ITSELF rather than on the
 *  viewport, so a page head inside a narrow panel stacks there too on any screen.
 *  The width is `null` until the first measure and the wide layout is what `null`
 *  renders, so the narrow branch never flashes. The host is the recipe's `root` —
 *  it is the flex item a parent lays out, and it is also the element
 *  `containerWidth()` measures, so what is styled and what is measured are the
 *  same box. The actions wrapper renders only when a `[actions]` element was
 *  actually projected: it is a slot in a `gap`-bearing flex parent, so an
 *  unprojected one would ship dead space to every page with no actions. */
@Component({
  selector: 'arena-page-head',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    <div [class]="styles().titles()">
      <h1 [class]="styles().title()">{{ title() }}</h1>
      @if (subtitle(); as caption) {
        <p [class]="styles().subtitle()">{{ caption }}</p>
      }
    </div>
    @if (actions()) {
      <div [class]="styles().actions()"><ng-content select="[actions]" /></div>
    }
  `,
})
export class PageHead {
  readonly title = input('');
  readonly subtitle = input<string>();

  protected readonly actions = contentChild(ArenaActions);

  private readonly width = containerWidth();
  private readonly small = readBreakpoint('sm');

  protected readonly styles = computed(() => {
    const measured = this.width();
    return pageHeadStyles({ narrow: measured !== null && measured < this.small });
  });
}
