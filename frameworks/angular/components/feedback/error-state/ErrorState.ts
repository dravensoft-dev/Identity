import { ChangeDetectionStrategy, Component, computed, contentChild, input, output } from '@angular/core';
import { ArenaSecondaryAction } from '../../../ProjectionMarkers';
import { errorStateStyles } from './ErrorState.variants';

@Component({
  selector: 'arena-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    role: 'alert',
    '[attr.title]': 'null',
  },
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
