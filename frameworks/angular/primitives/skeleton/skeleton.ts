import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { skeletonStyles } from './skeleton.variants';

type Variant = 'text' | 'line' | 'block' | 'circle';

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
 *  and the text variant's lines are the template's top level, not a wrapper's. */
@Component({
  selector: 'arena-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
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
  readonly variant = input<Variant>('block');
  readonly lines = input(3);

  protected readonly styles = computed(() => skeletonStyles({ variant: this.variant() }));
  protected readonly stacked = computed(() => this.variant() === 'text');
  protected readonly rows = computed(() => Array.from({ length: this.lines() }, (_, i) => i + 1));
  protected readonly hostClass = computed(() => (this.stacked() ? this.styles().stack() : this.styles().root()));
  protected readonly rowSlot = skeletonRowSlot;
}
