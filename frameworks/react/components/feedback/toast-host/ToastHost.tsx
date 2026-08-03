import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './ToastHost.manifest.generated.ts';

import type { ToastPlacement } from '../../../Api.generated';

export interface ToastHostProps {

  /** Which corner the stack is pinned to. A bottom placement clears the device's own bottom inset, so a stack on a phone never lands under the home indicator. */
  placement?: ToastPlacement;

  /** The notices, in the order they are read. The stack is a plain column and the visual order is the source order, whatever the corner: a reversed one would put the newest notice first on screen and last in the reading order, and the two must agree. Nothing here caps the count or times a dismissal, because the queue that produced these notices already holds their identity and their order, and a cap applied by the box that draws them would fight the queue that owns them. */
  children?: React.ReactNode;
}

const toastHostStyles = tv(manifest);
const PLACEMENTS = Object.keys(manifest.variants.placement);
const placementOf = (placement: string | undefined): ToastPlacement | undefined =>
  (placement && PLACEMENTS.includes(placement) ? placement as ToastPlacement : undefined);

export function ToastHost({ placement = 'bottom-end', children }: ToastHostProps) {
  return <div className={toastHostStyles({ placement: placementOf(placement) }).root()}>{children}</div>;
}
