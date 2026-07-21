import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { ArenaAction } from '../projection-markers';
import { errorStateStyles } from './error-state.variants';

/** Section- or screen-level failure, with recovery and an optional support
 *  code. The host itself is the recipe's `root`, the flex item a parent
 *  lays out; the actions wrapper renders only when a retry (or other
 *  action) was actually projected, so a consumer who offers none ships no
 *  dead space — the same fix `EmptyState` shipped for its action slot. */
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
    @if (action()) {
      <div [class]="styles().actions()"><ng-content select="[arena-action]" /></div>
    }
  `,
})
export class ErrorState {
  readonly icon = input<string>();
  readonly title = input('Something went wrong');
  readonly message = input<string>();
  readonly code = input<string>();

  protected readonly action = contentChild(ArenaAction);

  protected readonly styles = computed(() => errorStateStyles());
}
