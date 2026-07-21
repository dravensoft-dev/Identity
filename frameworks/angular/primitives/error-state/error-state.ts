import { ChangeDetectionStrategy, Component, Directive, computed, contentChild, input } from '@angular/core';
import { errorStateStyles } from './error-state.variants';

/** Marks the element a consumer projects into `arena-error-state`'s actions
 *  slot. Carries no behaviour of its own — same content-query anchor as
 *  `EmptyState`'s `ArenaAction`, under a distinct class name because both
 *  primitives project through the identical `[arena-action]` attribute and
 *  the aggregate `primitives/index.ts` barrel re-exports both with
 *  `export *`. A consumer wiring an action imports `ArenaErrorAction`
 *  alongside `ErrorState`. */
@Directive({ selector: '[arena-action]', standalone: true })
export class ArenaErrorAction {}

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

  protected readonly action = contentChild(ArenaErrorAction);

  protected readonly styles = computed(() => errorStateStyles());
}
