import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { bulkActionBarStyles } from './BulkActionBar.variants';
import type { BulkAction } from '../../../Api.generated';

@Component({
  selector: 'arena-bulk-action-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.role]': "count() > 0 ? 'toolbar' : null",
    '[attr.aria-label]': "count() > 0 ? 'Actions on the selection' : null",
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    @if (count() > 0) {
      <span [class]="styles().count()">
        <b [class]="styles().number()">{{ count() }}</b> {{ noun() }} selected
      </span>
      <span [class]="styles().divider()" aria-hidden="true"></span>
      <div [class]="styles().actions()">
        @for (action of actions(); track action.label; let i = $index) {
          <button type="button" [class]="classesFor(action).action()" (click)="run.emit(action)"
                  [attr.tabindex]="i === at() ? 0 : -1" (focus)="cursor.set(i)">
            @if (action.icon; as glyph) {
              <span [class]="styles().actionIcon()"><i [class]="glyph" aria-hidden="true"></i></span>
            }
            {{ action.label }}
          </button>
        }
      </div>
      @if (clearable()) {
        <button type="button" [class]="styles().clear()" aria-label="Clear selection"
                [attr.tabindex]="actions().length === at() ? 0 : -1" (focus)="cursor.set(actions().length)"
                (click)="clear.emit()">Clear</button>
      }
    }
  `,
})
export class BulkActionBar {
  readonly count = input.required<number>();
  readonly noun = input('items');
  readonly actions = input.required<BulkAction[]>();
  readonly clearable = input(true);
  readonly run = output<BulkAction>();
  readonly clear = output<void>();

  protected readonly cursor = signal(0);
  protected readonly at = computed(() => {
    const stops = this.clearable() ? this.actions().length + 1 : this.actions().length;
    return Math.min(this.cursor(), Math.max(stops - 1, 0));
  });

  protected readonly styles = computed(() => bulkActionBarStyles({ open: this.count() > 0 }));

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const els = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button'));
    if (els.length === 0) return;
    const here = els.indexOf(document.activeElement as HTMLElement);
    const from = here === -1 ? this.at() : here;
    const there = event.key === 'ArrowRight'
      ? (from + 1) % els.length
      : (from - 1 + els.length) % els.length;
    event.preventDefault();
    this.cursor.set(there);
    els[there].focus();
  }

  protected classesFor(action: BulkAction) {
    return bulkActionBarStyles({ destructive: !!action.destructive });
  }
}
