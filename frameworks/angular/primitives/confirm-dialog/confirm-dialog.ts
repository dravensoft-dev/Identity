import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { confirmDialogStyles } from './confirm-dialog.variants';

let nextId = 0;

/** A modal is reachable by keyboard iff its interactive elements can be
 *  enumerated at the moment a key is pressed — computed fresh on every Tab,
 *  never cached, because `disabled` on the confirm button changes as the user
 *  types into the require-text field. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Every focusable descendant of `container`, in DOM order. Exported as a
 *  plain DOM function — not a class method — so it is testable against a
 *  real, hand-built element tree without going through Angular's component
 *  compiler at all. @param container @returns focusable elements, DOM order */
export function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Moves focus to `container`'s first focusable descendant, or to `container`
 *  itself (which must carry `tabindex="-1"`) when it has none.
 *  @param container the panel to focus into */
export function focusFirstFocusable(container: HTMLElement): void {
  const [first] = focusableElements(container);
  (first ?? container).focus();
}

/** Keeps Tab/Shift+Tab cycling within `container` instead of escaping to the
 *  page behind a modal — the standard boundary-wrap trap: Shift+Tab from the
 *  first focusable wraps to the last, Tab from the last wraps to the first.
 *  A container with no focusable descendant traps the key outright, since
 *  there is nowhere legal for focus to go. @param container the panel
 *  @param event the keydown event; consulted and, at a boundary, consumed
 *  @param activeElement the currently focused element (`document.activeElement`) */
export function trapTabKey(container: HTMLElement, event: KeyboardEvent, activeElement: Element | null): void {
  const focusables = focusableElements(container);
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Mutable bookkeeping `handleOpenTransition` carries across calls — plain
 *  fields, not signals, because a signal write inside the effect that reads
 *  `open()` would make the effect depend on itself. */
export interface FocusTrapState {
  wasOpen: boolean;
  restoreTo: HTMLElement | null;
}

/** The whole open/close focus contract, as one pure transition: on the
 *  false-to-true edge, remembers `activeElement` and moves focus into
 *  `panel`'s first focusable descendant; on the true-to-false edge, restores
 *  focus to what was remembered. Re-running with `isOpen` unchanged (a
 *  render caused by something other than `open` itself — typing into the
 *  require-text field, for instance) does nothing, so focus is never
 *  stolen back from a field the user is actively using. Exported as a pure
 *  function of its arguments (no `this`) so the whole open-then-close
 *  sequence is testable against a hand-built DOM, independent of whether
 *  Angular's own `open` input can be driven in the test harness in use.
 *  @param state mutated in place @param isOpen the dialog's current `open()`
 *  @param panel the rendered panel element, or `null` while closed
 *  @param activeElement `document.activeElement` at the moment of the call */
export function handleOpenTransition(
  state: FocusTrapState,
  isOpen: boolean,
  panel: HTMLElement | null,
  activeElement: Element | null,
): void {
  if (isOpen && !state.wasOpen) {
    state.restoreTo = activeElement as HTMLElement | null;
    if (panel) focusFirstFocusable(panel);
  } else if (!isOpen && state.wasOpen) {
    state.restoreTo?.focus();
    state.restoreTo = null;
  }
  state.wasOpen = isOpen;
}

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
      this.cancelled.emit();
      return;
    }
    if (event.key === 'Tab') {
      const panel = this.panel()?.nativeElement;
      if (panel) trapTabKey(panel, event, this.doc.activeElement);
    }
  }
}
