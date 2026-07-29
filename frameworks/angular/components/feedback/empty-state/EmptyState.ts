import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { ArenaAction } from '../../../ProjectionMarkers';
import { emptyStateStyles } from './EmptyState.variants';

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
      <div [class]="styles().action()"><ng-content select="[action]" /></div>
    }
  `,
})
export class EmptyState {
  readonly icon = input<string>();
  readonly title = input.required<string>();
  readonly message = input<string>();

  protected readonly action = contentChild(ArenaAction);

  protected readonly styles = computed(() => emptyStateStyles());
}
