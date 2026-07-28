import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { skeletonStyles } from './skeleton.variants';
import type { SkeletonVariant } from '../../api.generated';

/** Which text-stack slot row `n` of `total` renders. Matches React's
 *  `Skeleton.jsx`: the last row of *more than one* line runs short like a
 *  paragraph's end (`lastLine`); a lone line — like every other row — runs
 *  full width (`line`), so `variant="text"` with `lines=1` never regresses
 *  to the narrow closing-line shape it would get if it were also "last". */
export function skeletonRowSlot(row: number, total: number): 'line' | 'lastLine' {
  return row === total && total > 1 ? 'lastLine' : 'line';
}

/** Loading placeholder that reserves the space the real content will take.
 *  The host itself is the recipe's visible slot — `root` for a single shape,
 *  `stack` when `variant="text"` — so it is the flex item a parent lays out,
 *  and the text variant's lines are the template's top level, not a wrapper's.
 *
 *  `width`/`height`/`radius` mirror React's `Skeleton.jsx` per-variant table
 *  exactly, bound onto the host as inline `[style.*]` so a set value overrides
 *  the recipe's default class and an unset one (`undefined`) leaves it:
 *
 *  | variant | width               | height              | radius              |
 *  |---------|---------------------|---------------------|----------------------|
 *  | text    | on the stack        | — (rows fixed)      | — (rows fixed)       |
 *  | line    | applies             | applies             | — (fixed --r-xs)    |
 *  | block   | applies             | applies             | applies              |
 *  | circle  | diameter (h\|\|w)   | same diameter        | — (always 50%)       |
 *
 *  `radius` therefore reaches the DOM only for `variant="block"` — `circle` is
 *  always a perfect circle and `text`/`line` keep a fixed small radius, both via
 *  the recipe class rather than an override. This binding form ([style.x]) is
 *  invisible to `check:dimensions`' scanners (see CLAUDE.md's Angular
 *  `[style.x]` blind spot), so `frameworks/angular/test/skeleton-dimensions.test.ts`
 *  proves it with a real render instead. */
@Component({
  selector: 'arena-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[style.width]': 'hostWidth()',
    '[style.height]': 'hostHeight()',
    '[style.borderRadius]': 'hostRadius()',
    role: 'status',
    'aria-label': 'Loading',
  },
  template: `
    @if (stacked()) {
      @for (row of rows(); track row) {
        <div [class]="rowSlot(row, rows().length) === 'lastLine' ? styles().lastLine() : styles().line()"></div>
      }
    }
  `,
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('block');
  readonly lines = input(3);
  readonly width = input<string>();
  readonly height = input<string>();
  readonly radius = input<string>();

  protected readonly styles = computed(() => skeletonStyles({ variant: this.variant() }));
  protected readonly stacked = computed(() => this.variant() === 'text');
  protected readonly rows = computed(() => Array.from({ length: this.lines() }, (_, i) => i + 1));
  protected readonly hostClass = computed(() => (this.stacked() ? this.styles().stack() : this.styles().root()));
  protected readonly rowSlot = skeletonRowSlot;

  /** `circle`'s single diameter — `height` wins over `width` when both are set,
   *  matching React's `const d = height || width || 'var(--sp-10)'`. */
  protected readonly diameter = computed<string | undefined>(() => this.height() || this.width());
  protected readonly hostWidth = computed<string | undefined>(() =>
    this.variant() === 'circle' ? this.diameter() : this.width());
  protected readonly hostHeight = computed<string | undefined>(() => {
    const v = this.variant();
    if (v === 'circle') return this.diameter();
    if (v === 'text') return undefined;
    return this.height();
  });
  protected readonly hostRadius = computed<string | undefined>(() =>
    this.variant() === 'block' ? this.radius() : undefined);
}
