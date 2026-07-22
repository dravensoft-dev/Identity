import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { bulkActionBarStyles } from './bulk-action-bar.variants';

/** One action a `BulkActionBar` offers for the current selection. A
 *  `destructive` action stays outline in `--error` -- transparent at rest,
 *  the soft `--danger-soft` tint only on hover -- never the filled danger
 *  surface, which is `ConfirmDialog`'s alone. */
export interface ArenaBulkAction {
  label: string;
  icon?: string;
  destructive?: boolean;
}

/** Appears when rows are selected, and operates on the selection as a set.
 *  The host itself is the recipe's `root` -- it is the flex item a parent row
 *  lays out, so root-level classes and the `region` landmark they imply must
 *  live on the host, not one element inside it. Because the bar's whole
 *  presence is driven by `count` alone (React's `BulkActionBar.jsx` returns
 *  `null` at zero), wrapping the host in an `@if` was not an option -- the
 *  resolution `ConfirmDialog` and `Onboarding` settled on applies here too:
 *  the host stays permanently in the DOM and an `open` variant toggles
 *  `hidden` (the same name, the same mechanism), while the
 *  interactive content is gated by its own `@if` so nothing focusable exists
 *  while the bar is hidden. Always offers Clear -- a selection the user
 *  cannot see the edges of is one they act on by accident -- so unlike
 *  React's optional `onClear`, the control is unconditional here; see
 *  `components-divergences.md` at the repo root. */
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
      <button type="button" [class]="styles().clear()" aria-label="Clear selection" (click)="cleared.emit()">Clear</button>
    }
  `,
})
export class BulkActionBar {
  readonly count = input(0);
  readonly noun = input('items');
  readonly actions = input<ArenaBulkAction[]>([]);
  readonly run = output<ArenaBulkAction>();
  readonly cleared = output<void>();

  protected readonly styles = computed(() => bulkActionBarStyles({ open: this.count() > 0 }));

  protected classesFor(action: ArenaBulkAction) {
    return bulkActionBarStyles({ destructive: !!action.destructive });
  }
}
