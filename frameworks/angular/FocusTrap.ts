/** An overlay is reachable by keyboard iff its interactive elements can be
 *  enumerated at the moment a key is pressed -- computed fresh on every Tab,
 *  never cached, since what counts as focusable can change while the overlay
 *  is open (`arena-confirm-dialog`'s confirm button toggles `disabled` as the
 *  user types into its require-text field). Every natively-focusable clause
 *  also excludes `tabindex="-1"` explicitly -- a CSS selector list is OR'd,
 *  so `button:not([disabled])` alone would still match a real `<button
 *  tabindex="-1">` regardless of the separate `[tabindex]:not([tabindex="-1"])`
 *  clause, which only governs elements that are focusable *because* of a
 *  tabindex, not elements that are focusable by tag and merely carry one.
 *  `arena-command-palette`'s row buttons are exactly that shape: real
 *  `<button>` elements deliberately marked `tabindex="-1"` to keep them out
 *  of the tab order, which the unguarded clause silently pulled back in. */
const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Every focusable descendant of `container`, in DOM order. Exported as a
 *  plain DOM function -- not a class method -- so it is testable against a
 *  real, hand-built element tree without going through Angular's component
 *  compiler at all. @param container @returns focusable elements, DOM order */
export function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Moves focus to `container`'s first focusable descendant, or to `container`
 *  itself (which must carry `tabindex="-1"`) when it has none. A container
 *  with exactly one focusable descendant -- `arena-command-palette`'s panel,
 *  where every row is `tabindex="-1"` and the search input is the only real
 *  Tab stop -- simply focuses that one element.
 *  @param container the panel to focus into */
export function focusFirstFocusable(container: HTMLElement): void {
  const [first] = focusableElements(container);
  (first ?? container).focus();
}

/** Keeps Tab/Shift+Tab cycling within `container` instead of escaping to the
 *  page behind an overlay -- the standard boundary-wrap trap: Shift+Tab from
 *  the first focusable wraps to the last, Tab from the last wraps to the
 *  first. A container with no focusable descendant traps the key outright,
 *  since there is nowhere legal for focus to go. A container with exactly
 *  one focusable descendant traps in place instead -- first and last are the
 *  same element, so either direction re-focuses it and consumes the key,
 *  which is exactly what `arena-command-palette`'s single-input panel needs.
 *  @param container the panel @param event the keydown event; consulted and,
 *  at a boundary, consumed @param activeElement the currently focused
 *  element (`document.activeElement`) */
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

/** Mutable bookkeeping `handleOpenTransition` carries across calls -- plain
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
 *  render caused by something other than `open` itself -- typing into a field
 *  inside the panel, for instance) does nothing, so focus is never stolen
 *  back from a control the user is actively using. Exported as a pure
 *  function of its arguments (no `this`) so the whole open-then-close
 *  sequence is testable against a hand-built DOM, independent of whether a
 *  component's own `open` input can be driven in the test harness in use.
 *  Shared by `arena-confirm-dialog` and `arena-command-palette` -- both are
 *  fixed-scrim overlays whose `open` input the host owns, and both need the
 *  identical contract: focus in on open, focus back on close, never a bare
 *  `autofocus` attribute, which the HTML autofocus processing model skips
 *  once the document's autofocus-processed flag is set -- which opening an
 *  overlay from a user interaction always has by the time the element it
 *  targets is inserted.
 *  @param state mutated in place @param isOpen the component's current `open()`
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
