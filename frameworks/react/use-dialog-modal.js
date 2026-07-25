/* The React half of Arena's modal focus contract, and a deliberate mirror of
 * frameworks/angular/primitives/focus-trap.ts -- same selector, same wrap rule,
 * same open/close transition. Two layers solving this differently is how
 * components-divergences.md fills up, and Angular's version is the one that
 * already ships with a suite behind it.
 *
 * Exported as pure functions of a container, not as hook internals, because a
 * hand-built tree is testable and a rendered overlay under happy-dom largely is
 * not: happy-dom implements no sequential focus navigation, so only the boundary
 * wrap -- which is OUR .focus() call -- can be asserted. The interior of the trap
 * is the browser's and is checked in Chromium by hand. */
import { useEffect, useRef } from 'react';

/* Every natively-focusable clause excludes tabindex="-1" explicitly: a selector
 * list is OR'd, so `button:not([disabled])` alone would match a real
 * <button tabindex="-1"> regardless of the separate [tabindex] clause. Arena has
 * exactly that shape -- CalendarEvent's kebab is a real button held out of the
 * Tab order on purpose. */
const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Every focusable descendant of `container`, in DOM order. Computed fresh on
 *  every call, never cached: what counts as focusable changes while an overlay is
 *  open -- ConfirmDialog's confirm button toggles `disabled` as the user types
 *  into its require-text field. */
export function focusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
}

/** Moves focus to the first focusable descendant, or to `container` itself when
 *  it has none -- which is why every panel using this carries tabIndex={-1}. */
export function focusFirstFocusable(container) {
  const [first] = focusableElements(container);
  (first ?? container).focus();
}

/** Boundary wrap: Shift+Tab from the first focusable goes to the last, Tab from
 *  the last goes to the first, and a panel with nothing focusable consumes the
 *  key outright. A middle element is left alone deliberately -- native sequential
 *  navigation handles the interior and we must not fight it. */
export function trapTabKey(container, event, activeElement) {
  const focusables = focusableElements(container);
  if (focusables.length === 0) { event.preventDefault(); return; }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && activeElement === last) { event.preventDefault(); first.focus(); }
}

/** The whole contract for one overlay. `onDismiss` is the component's OWN
 *  dismissal channel -- Dialog's onClose, ConfirmDialog's onCancel, Onboarding's
 *  onSkip -- never a new member: Escape reports a dismissal the component already
 *  knows how to report, which is what Angular's arena-onboarding does with `skip`.
 *
 *  Returns the keydown handler the panel must carry. Focus-in and focus-restore
 *  run from an effect on `open`, so a re-render caused by anything other than
 *  `open` -- typing into a field inside the panel -- never steals focus back. */
export function useDialogModal({ open, panelRef, onDismiss }) {
  const restoreTo = useRef(null);

  useEffect(() => {
    if (open) {
      restoreTo.current = typeof document === 'undefined' ? null : document.activeElement;
      const panel = panelRef.current;
      if (panel) focusFirstFocusable(panel);
      return undefined;
    }
    const target = restoreTo.current;
    restoreTo.current = null;
    if (target && typeof target.focus === 'function') target.focus();
    return undefined;
  }, [open]);

  return (event) => {
    if (event.key === 'Escape') { event.preventDefault(); if (onDismiss) onDismiss(); return; }
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (panel) trapTabKey(panel, event, panel.ownerDocument.activeElement);
  };
}
