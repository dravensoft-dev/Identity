import type * as React from 'react';
export declare function focusableElements(container: Element): HTMLElement[];
export declare function focusFirstFocusable(container: HTMLElement): void;
export declare function trapTabKey(container: Element, event: Pick<KeyboardEvent, 'shiftKey'> & {
    key?: string;
    preventDefault(): void;
}, activeElement: Element | null): void;
export interface DialogModalOptions {
    open: boolean;
    panelRef: React.RefObject<HTMLElement | null>;
    onDismiss?: () => void;
}
export declare function useDialogModal({ open, panelRef, onDismiss }: DialogModalOptions): (event: React.KeyboardEvent) => void;
