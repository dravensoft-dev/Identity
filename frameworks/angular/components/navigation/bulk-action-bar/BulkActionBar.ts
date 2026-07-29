import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { bulkActionBarStyles } from './BulkActionBar.variants';
import type { BulkAction } from '../../../Api.generated';

@Component({
  selector: 'arena-bulk-action-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    role: 'region',
    'aria-label': 'Actions on the selection',
  },
  template: `
    @if (count() > 0) {
      <span [class]="styles().count()">
        <b [class]="styles().number()">{{ count() }}</b> {{ noun() }} selected
      </span>
      <span [class]="styles().divider()"></span>
      <div [class]="styles().actions()">
        @for (action of actions(); track action.label) {
          <button type="button" [class]="classesFor(action).action()" (click)="run.emit(action)">
            @if (action.icon; as glyph) {
              <span [class]="styles().actionIcon()"><i [class]="glyph" aria-hidden="true"></i></span>
            }
            {{ action.label }}
          </button>
        }
      </div>
      @if (clearable()) {
        <button type="button" [class]="styles().clear()" aria-label="Clear selection" (click)="clear.emit()">Clear</button>
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

  protected readonly styles = computed(() => bulkActionBarStyles({ open: this.count() > 0 }));

  protected classesFor(action: BulkAction) {
    return bulkActionBarStyles({ destructive: !!action.destructive });
  }
}
