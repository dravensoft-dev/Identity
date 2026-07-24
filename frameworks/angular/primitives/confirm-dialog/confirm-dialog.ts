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
import { confirmDialogStyles } from './confirm-dialog.variants';
import {
  type FocusTrapState,
  focusFirstFocusable,
  focusableElements,
  handleOpenTransition,
  trapTabKey,
} from '../focus-trap';

let nextId = 0;

/** Re-exported for `confirm-dialog-focus-trap.test.ts` and any other consumer
 *  that reached these through `arena-confirm-dialog` before the fix wave
 *  (plan 5a, Task 14 review) that generalized them into
 *  `frameworks/angular/primitives/focus-trap.ts`, now shared with
 *  `arena-command-palette`. */
export type { FocusTrapState };
export { focusFirstFocusable, focusableElements, handleOpenTransition, trapTabKey };

/** Whether the confirm button should stay disabled: `requireText` locks it
 *  until the typed value matches exactly. An unset `requireText` never locks
 *  (there is nothing to type); critically, neither does an *empty string* —
 *  `requireText=""` is degenerate input, not a request to lock forever, and
 *  a bare-truthiness check (`required ? … : false`) gets this wrong. Exported
 *  so the boundary is asserted directly, with no DOM and no Angular involved.
 *  @param required the `requireText` input's current value
 *  @param typed what the user has typed so far @returns true when locked */
export function isConfirmLocked(required: string | undefined, typed: string): boolean {
  return required !== undefined && required !== '' && typed.trim() !== required;
}

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
 *  matches it exactly.
 *
 *  Accessible by construction, not by mirroring React: the panel carries a
 *  computed `aria-labelledby` (the title when set, the eyebrow otherwise, so
 *  the dialog always has a name) and an `aria-describedby` on the body. Focus
 *  moves into the panel's first focusable element on open and is restored to
 *  whatever held it beforehand on close; Tab/Shift+Tab cycle within the panel
 *  rather than escaping to the page behind it; Escape reports dismissal the
 *  same way the Cancel button does. See `components-divergences.md` at the
 *  repo root for why this diverges from `ConfirmDialog.jsx`. */
@Component({
  selector: 'arena-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    @if (open()) {
      <div #panel [class]="styles().panel()" role="alertdialog" aria-modal="true" tabindex="-1"
           [attr.aria-labelledby]="labelId()" [attr.aria-describedby]="descId">
        <div [class]="styles().head()">
          <div [id]="eyebrowId" [class]="styles().eyebrow()">{{ eyebrow() }}</div>
          @if (title(); as heading) {
            <div [id]="titleId" [class]="styles().title()">{{ heading }}</div>
          }
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
  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input<string>();
  readonly eyebrow = input('Confirm');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly destructive = input(false, { transform: booleanAttribute });
  readonly requireText = input<string>();
  readonly cancel = output<void>();
  readonly confirm = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  private readonly uid = `arena-confirm-dialog-${nextId++}`;
  protected readonly eyebrowId = `${this.uid}-eyebrow`;
  protected readonly titleId = `${this.uid}-title`;
  protected readonly descId = `${this.uid}-body`;
  protected readonly labelId = computed(() => (this.title() ? this.titleId : this.eyebrowId));

  protected readonly typed = signal('');
  protected readonly locked = computed(() => isConfirmLocked(this.requireText(), this.typed()));
  protected readonly styles = computed(() => confirmDialogStyles({
    destructive: this.destructive(),
    invalid: this.locked() && this.typed().length > 0,
    open: this.open(),
  }));

  /** Bookkeeping `handleOpenTransition` mutates across renders. A plain
   *  object rather than a signal: reading it inside the effect below must
   *  never register as a dependency, or writing it there would make the
   *  effect re-run itself. */
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
