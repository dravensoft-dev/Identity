import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import type { ToastTone } from '../../../Api.generated';
import { toastStyles } from './Toast.variants';

@Component({
  selector: 'arena-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'",
    '[attr.aria-live]': "tone() === 'danger' ? 'assertive' : 'polite'",
    '[attr.data-persist]': "pinned() ? '' : null",
    '[attr.title]': 'null',
  },
  template: `
    <div [class]="styles().body()">
      @if (title(); as heading) {
        <div [class]="styles().title()">{{ heading }}@if (pinned()) {
          <span [class]="styles().pinned()" title="Does not auto-dismiss">Pinned</span>
        }</div>
      }
      @if (message(); as text) {
        <div [class]="styles().message()">{{ text }}</div>
      }
      @if (actionLabel(); as label) {
        <button type="button" [class]="styles().action()" (click)="action.emit()">{{ label }}</button>
      }
    </div>
    @if (dismissible()) {
      <button type="button" [class]="styles().close()" aria-label="Close" (click)="close.emit()">
        <i class="ph-bold ph-x" aria-hidden="true"></i>
      </button>
    }
  `,
})
export class Toast {
  readonly title = input<string>();
  readonly message = input<string>();
  readonly tone = input<ToastTone>('neutral');
  readonly actionLabel = input<string>();
  readonly action = output<void>();
  readonly persist = input(false, { transform: booleanAttribute });
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly close = output<void>();

  protected readonly pinned = computed(() => this.persist() || this.tone() === 'danger');
  protected readonly styles = computed(() => toastStyles({ tone: this.tone() }));
}
