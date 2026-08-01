import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { confirmDialogStyles } from './ConfirmDialog.variants';
import { type FocusTrapState, handleOpenTransition, trapTabKey } from '../../../FocusTrap';

let nextId = 0;

export function isConfirmLocked(required: string | undefined, typed: string): boolean {
  return required !== undefined && required !== '' && typed.trim() !== required;
}

@Component({
  selector: 'arena-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '(keydown)': 'onKeydown($event)',
    '[attr.title]': 'null',
  },
  template: `
    @if (open()) {
      <div #panel [class]="styles().panel()" role="alertdialog" aria-modal="true" tabindex="-1"
           [attr.aria-labelledby]="titleId" [attr.aria-describedby]="descId">
        <div [class]="styles().head()">
          <div [class]="styles().eyebrow()">{{ eyebrow() }}</div>
          <div [id]="titleId" [class]="styles().title()">{{ title() }}</div>
        </div>
        <div [id]="descId" [class]="styles().body()">
          <ng-content />
          @if (requireText(); as required) {
            <div [class]="styles().requireBlock()">
              <div [class]="styles().requireLabel()">Type "{{ required }}" to confirm</div>
              <input [class]="styles().input()" [value]="typed()" (input)="onType($event)" />
            </div>
          }
        </div>
        <div [class]="styles().foot()">
          <button type="button" [class]="styles().cancel()" (click)="cancel.emit()">{{ cancelLabel() }}</button>
          <button type="button" [class]="styles().confirm()" [disabled]="locked()" (click)="confirm.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  /** Whether the dialog is shown. The host owns it, as in the other three modals: defaulting it would let a ConfirmDialog whose open was never wired render nothing forever and look like a working closed dialog. */
  readonly open = input.required<boolean, unknown>({ transform: booleanAttribute });

  /** The dialog heading, and the name the panel's aria-labelledby points at. Required: nothing can derive a name for a confirmation, because its subject is editorial, and a modal announcing only its role is worse than none at all. */
  readonly title = input.required<string>();
  /** Small uppercase label above the title. */
  readonly eyebrow = input('Confirm');
  /** The confirm button's label. */
  readonly confirmLabel = input('Confirm');
  /** The cancel button's label. */
  readonly cancelLabel = input('Cancel');
  /** Gives the confirm button Arena's only filled danger surface. */
  readonly destructive = input(false, { transform: booleanAttribute });
  /** Locks the confirm button until this exact word is typed. */
  readonly requireText = input<string>();
  /** The dialog was dismissed -- by the Cancel action or by the Escape key, in both layers. A scrim click is deliberately NOT one of them: this component never closes on click-outside. No payload. */
  readonly cancel = output<void>();
  /** The action was confirmed. */
  readonly confirm = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  private readonly uid = `arena-confirm-dialog-${nextId++}`;
  protected readonly titleId = `${this.uid}-title`;
  protected readonly descId = `${this.uid}-body`;

  protected readonly typed = signal('');
  protected readonly locked = computed(() => isConfirmLocked(this.requireText(), this.typed()));
  protected readonly styles = computed(() => confirmDialogStyles({
    destructive: this.destructive(),
    invalid: this.locked() && this.typed().length > 0,
    open: this.open(),
  }));

  private readonly focusTrap: FocusTrapState = { wasOpen: false, restoreTo: null };

  constructor() {
    afterRenderEffect(() => {
      const isOpen = this.open();
      untracked(() => {
        handleOpenTransition(this.focusTrap, isOpen, this.panel()?.nativeElement ?? null, this.doc.activeElement);
      });
    });
  }

  protected onType(event: Event): void {
    this.typed.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.open()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel.emit();
      return;
    }
    if (event.key === 'Tab') {
      const panel = this.panel()?.nativeElement;
      if (panel) trapTabKey(panel, event, this.doc.activeElement);
    }
  }
}
