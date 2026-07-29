import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { skeletonStyles } from './Skeleton.variants';
import type { SkeletonVariant } from '../../../Api.generated';

export function skeletonRowSlot(row: number, total: number): 'line' | 'lastLine' {
  return row === total && total > 1 ? 'lastLine' : 'line';
}

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
