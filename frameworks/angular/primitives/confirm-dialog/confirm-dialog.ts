import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { confirmDialogStyles } from './confirm-dialog.variants';

/** Confirmation of a high-consequence action. Never closes on click-outside —
 *  losing a half-finished decision to a stray click is the failure this
 *  component exists to prevent. The host itself is the recipe's `root`, the
 *  fixed full-viewport scrim; `open` drives it between the overlay and
 *  `hidden` rather than a wrapper element omitting itself, and the panel and
 *  its content are the template's top level, gated by the same `open` input
 *  so no interactive control sits in the DOM while closed. `destructive`
 *  gives the confirm button Arena's only filled danger surface
 *  (`bg-error-fill`) — every other danger affordance in the system stays
 *  outline. `requireText` locks the confirm button until the typed value
 *  matches it exactly. */
@Component({
  selector: 'arena-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    @if (open()) {
      <div [class]="styles().panel()" role="alertdialog" aria-modal="true">
        <div [class]="styles().head()">
          <div [class]="styles().eyebrow()">{{ eyebrow() }}</div>
          @if (title(); as heading) {
            <div [class]="styles().title()">{{ heading }}</div>
          }
        </div>
        <div [class]="styles().body()">
          <ng-content />
          @if (requireText(); as required) {
            <div [class]="styles().requireBlock()">
              <div [class]="styles().requireLabel()">Type "{{ required }}" to confirm</div>
              <input [class]="styles().input()" [value]="typed()" (input)="onType($event)" autofocus />
            </div>
          }
        </div>
        <div [class]="styles().foot()">
          <button type="button" [class]="styles().cancel()" (click)="cancelled.emit()">{{ cancelLabel() }}</button>
          <button type="button" [class]="styles().confirm()" [disabled]="locked()" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input<string>();
  readonly eyebrow = input('Confirm');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly destructive = input(false);
  readonly requireText = input<string>();
  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  protected readonly typed = signal('');
  protected readonly locked = computed(() => {
    const required = this.requireText();
    return required !== undefined && this.typed().trim() !== required;
  });
  protected readonly styles = computed(() => confirmDialogStyles({
    destructive: this.destructive(),
    invalid: this.locked() && this.typed().length > 0,
    open: this.open(),
  }));

  protected onType(event: Event): void {
    this.typed.set((event.target as HTMLInputElement).value);
  }
}
