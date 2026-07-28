import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { bulkActionBarStyles } from './bulk-action-bar.variants';
import type { BulkAction } from '../../api.generated';

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
 *  while the bar is hidden. Whether Clear is drawn is governed by
 *  `clearable` (default `true`) -- both layers gate the button on it,
 *  because Angular cannot detect a `clear` listener the way React can detect
 *  a passed callback. That default preserves this component's own prior
 *  behaviour, where Clear was unconditional; `api/components/BulkActionBar.json`
 *  is the authority for the member, and it replaced the
 *  `components-divergences.md` entry that used to record the two layers
 *  disagreeing about whether Clear could be hidden at all. */
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
