import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { emptyStateStyles } from './empty-state.variants';

/** Section- or screen-level empty state, with one clear way forward. The
 *  action is projected rather than owned — a real `mat-button` wearing
 *  Arena, not a second button implementation — so the host renders only the
 *  slot that wraps it. The host itself is the recipe's `root`, the flex
 *  item a parent lays out. */
@Component({
  selector: 'arena-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    @if (icon(); as glyph) {
      <div [class]="styles().icon()"><i [class]="glyph" aria-hidden="true"></i></div>
    }
    @if (title(); as heading) {
      <div [class]="styles().title()">{{ heading }}</div>
    }
    @if (message(); as body) {
      <div [class]="styles().message()">{{ body }}</div>
    }
    <div [class]="styles().action()"><ng-content select="[arena-action]" /></div>
  `,
})
export class EmptyState {
  readonly icon = input<string>();
  readonly title = input<string>();
  readonly message = input<string>();

  protected readonly styles = computed(() => emptyStateStyles());
}
