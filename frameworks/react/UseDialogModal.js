import { useEffect, useRef } from 'react';

const REACHABLE_BY_TAB = ':not([tabindex="-1"])';
const NOT_DISABLED = ':not([disabled])';

const FOCUSABLE_SELECTOR = [
  `a[href]${REACHABLE_BY_TAB}`,
  `button${NOT_DISABLED}${REACHABLE_BY_TAB}`,
  `input${NOT_DISABLED}${REACHABLE_BY_TAB}`,
  `select${NOT_DISABLED}${REACHABLE_BY_TAB}`,
  `textarea${NOT_DISABLED}${REACHABLE_BY_TAB}`,
  `[tabindex]${REACHABLE_BY_TAB}`,
].join(', ');

export function focusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
}

export function focusFirstFocusable(container) {
  const [first] = focusableElements(container);
  (first ?? container).focus();
}

export function trapTabKey(container, event, activeElement) {
  const focusables = focusableElements(container);
  if (focusables.length === 0) { event.preventDefault(); return; }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && activeElement === last) { event.preventDefault(); first.focus(); }
}

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
