import { ChangeDetectionStrategy, Component, computed, contentChild, input, output } from '@angular/core';
import { ArenaSecondaryAction } from '../projection-markers';
import { errorStateStyles } from './error-state.variants';

/** Section- or screen-level failure, with recovery and an optional support
 *  code. The host itself is the recipe's `root`, the flex item a parent
 *  lays out. Under the API contract (`api/components/ErrorState.json`) Arena
 *  draws the primary retry itself, from data (`retryLabel` gates the button;
 *  activating it emits `retry`) rather than leaving it to a consumer to
 *  project — the same `retryLabel`-gated shape `Alert`'s `actionLabel` uses.
 *  The `[secondaryAction]` slot stays a projection, for whatever a consumer
 *  wants beside the retry (a link to logs, say). The actions wrapper renders
 *  only when a retry or a secondary action actually exists, so a consumer
 *  who offers neither ships no dead space — the same fix `EmptyState`
 *  shipped for its action slot. */
@Component({
  selector: 'arena-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()', role: 'alert' },
  template: `
    @if (icon(); as glyph) {
      <div [class]="styles().icon()"><i [class]="glyph" aria-hidden="true"></i></div>
    }
    <div [class]="styles().title()">{{ title() }}</div>
    @if (message(); as body) {
      <div [class]="styles().message()">{{ body }}</div>
    }
    @if (code(); as support) {
      <code [class]="styles().code()">{{ support }}</code>
    }
    @if (retryLabel() || secondaryAction()) {
      <div [class]="styles().actions()">
        @if (retryLabel(); as label) {
          <button type="button" [class]="styles().retry()" (click)="retry.emit()">{{ label }}</button>
        }
        <ng-content select="[secondaryAction]" />
      </div>
    }
  `,
})
export class ErrorState {
  readonly icon = input<string>();
  readonly title = input('Something went wrong');
  readonly message = input<string>();
  readonly code = input<string>();
  readonly retryLabel = input<string>();
  readonly retry = output<void>();

  protected readonly secondaryAction = contentChild(ArenaSecondaryAction);

  protected readonly styles = computed(() => errorStateStyles());
}
