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

export function arenaFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function arenaFocusFirstFocusable(container: HTMLElement): void {
  const [first] = arenaFocusableElements(container);
  (first ?? container).focus();
}

export function arenaTrapTabKey(container: HTMLElement, event: KeyboardEvent, activeElement: Element | null): void {
  const focusables = arenaFocusableElements(container);
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

export interface FocusTrapState {
  wasOpen: boolean;
  restoreTo: HTMLElement | null;
}

export function arenaHandleOpenTransition(
  state: FocusTrapState,
  isOpen: boolean,
  panel: HTMLElement | null,
  activeElement: Element | null,
): void {
  if (isOpen && !state.wasOpen) {
    state.restoreTo = activeElement as HTMLElement | null;
    if (panel) arenaFocusFirstFocusable(panel);
  } else if (!isOpen && state.wasOpen) {
    state.restoreTo?.focus();
    state.restoreTo = null;
  }
  state.wasOpen = isOpen;
}
