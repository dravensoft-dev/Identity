import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { alertStyles } from './alert.variants';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_ICONS: Record<Tone, string> = {
  info: 'ph-fill ph-info',
  success: 'ph-fill ph-check-circle',
  warning: 'ph-fill ph-warning',
  danger: 'ph-fill ph-warning-octagon',
  neutral: 'ph-fill ph-note',
};

/** Persistent in-page message; unlike a toast it stays until the condition it
 *  reports is resolved. The host itself is the recipe's `root` — it is the
 *  flex item a parent lays out, so root-level classes and the `role` they
 *  imply must live on the host, not one element inside it. `tone="danger"`
 *  renders `role="alert"`, which interrupts a screen reader; every other
 *  tone renders `role="status"`. */
@Component({
  selector: 'arena-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'",
  },
  template: `
    <i [class]="styles().icon() + ' ' + (icon() ?? toneIcon())" aria-hidden="true"></i>
    <div [class]="styles().body()">
      @if (title(); as heading) {
        <div [class]="styles().title()">{{ heading }}</div>
      }
      <div [class]="styles().message()"><ng-content /></div>
      @if (actionLabel(); as label) {
        <button type="button" [class]="styles().action()" (click)="action.emit()">{{ label }}</button>
      }
    </div>
    @if (dismissible()) {
      <button type="button" [class]="styles().close()" aria-label="Dismiss" (click)="closed.emit()">
        <i class="ph-bold ph-x" aria-hidden="true"></i>
      </button>
    }
  `,
})
export class Alert {
  readonly tone = input<Tone>('info');
  readonly title = input<string>();
  readonly icon = input<string>();
  readonly actionLabel = input<string>();
  readonly dismissible = input(false);
  readonly action = output<void>();
  readonly closed = output<void>();

  protected readonly styles = computed(() => alertStyles({ tone: this.tone(), titled: !!this.title() }));
  protected readonly toneIcon = computed(() => TONE_ICONS[this.tone()]);
}
