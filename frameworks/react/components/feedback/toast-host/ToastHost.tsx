import React from 'react';

import type { ToastPlacement } from '../../../Api.generated';

export interface ToastHostProps {

  /** Which corner the stack is pinned to. A bottom placement clears the device's own bottom inset, so a stack on a phone never lands under the home indicator. */
  placement?: ToastPlacement;

  /** The notices, in the order they are read. The stack is a plain column and the visual order is the source order, whatever the corner: a reversed one would put the newest notice first on screen and last in the reading order, and the two must agree. Nothing here caps the count or times a dismissal, because the queue that produced these notices already holds their identity and their order, and a cap applied by the box that draws them would fight the queue that owns them. */
  children?: React.ReactNode;
}

export function ToastHost({ placement = 'bottom-end', children }: ToastHostProps) {
  const atTop = placement.startsWith('top');
  const atStart = placement.endsWith('start');
  const style: React.CSSProperties = {
    position: 'fixed', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', zIndex: 'var(--z-toast)',
    [atTop ? 'top' : 'bottom']: `max(var(--sp-6), var(${atTop ? '--pad-safe-top' : '--pad-safe-bottom'}))`,
    [atStart ? 'insetInlineStart' : 'insetInlineEnd']: 'var(--sp-6)',
  };
  return <div style={style}>{children}</div>;
}
