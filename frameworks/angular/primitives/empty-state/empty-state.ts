import { ChangeDetectionStrategy, Component, Directive, computed, contentChild, input } from '@angular/core';
import { emptyStateStyles } from './empty-state.variants';

/** Marks the element a consumer projects into `arena-empty-state`'s action
 *  slot. Carries no behaviour of its own — it exists purely as a
 *  content-query anchor, because Angular content queries do not accept a CSS
 *  selector as a locator (only a directive/component type, a template
 *  reference variable, or a DI token), so detecting whether an action was
 *  actually projected needs a real directive matching the same
 *  `[arena-action]` attribute `ng-content select` already uses for
 *  projection. A consumer wiring an action imports `ArenaAction` alongside
 *  `EmptyState`. */
@Directive({ selector: '[arena-action]', standalone: true })
export class ArenaAction {}

/** Section- or screen-level empty state, with one clear way forward. The
 *  action is projected rather than owned — a real `mat-button` wearing
 *  Arena, not a second button implementation — so the host renders the slot
 *  that wraps it only when an action was actually projected. The host
 *  itself is the recipe's `root`, the flex item a parent lays out. */
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
    @if (action()) {
      <div [class]="styles().action()"><ng-content select="[arena-action]" /></div>
    }
  `,
})
export class EmptyState {
  readonly icon = input<string>();
  readonly title = input<string>();
  readonly message = input<string>();

  protected readonly action = contentChild(ArenaAction);

  protected readonly styles = computed(() => emptyStateStyles());
}
