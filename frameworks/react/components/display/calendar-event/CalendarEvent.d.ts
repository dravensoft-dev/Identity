import * as React from 'react';
import type { CatSlot } from '../../../Api.generated';

/** One event on a `Calendar`'s schedule. Write one per event as a child of
 * `Calendar`.
 *
 * Everything about WHERE the chip goes — its position, its shared column, its
 * ramp colour, its place in the grid's keyboard order — is injected by
 * `Calendar` and is deliberately absent from this interface, exactly as
 * `RadioProps` omits the `name`/`checked`/`onSelect` `RadioGroup` injects. */
export interface CalendarEventProps {
  /** Stable identity, so a host can switch on it rather than on the title. */
  id: string;
  /** What the chip reads. */
  title: string;
  /** ISO datetime the event begins. */
  start: string;
  /** ISO datetime the event ends. */
  end: string;
  /** Identity colour. Give the same entity the same slot everywhere and it keeps
   *  its colour across views. */
  colorId?: CatSlot;
  /** Whether the chip shows its action button. A boolean rather than "is
   *  `actions` filled?", because Angular cannot detect a filled `<ng-content>`
   *  and gating the drawing on that is a divergence waiting to happen. */
  actionsEnabled?: boolean;
  /** The action panel's content, revealed by the chip's action button. Rendered
   *  only while the panel is open. */
  actions?: React.ReactNode;
  /** The chip was activated. No payload: you wrote this element, so you already
   *  hold the event this is about. */
  onClick?: () => void;
}

/** `forwardRef`, because `Calendar` keeps a map of event id -> rendered chip and
 *  that map is how Enter steps into an event from the hour cell intersecting it. */
export declare const CalendarEvent: React.ForwardRefExoticComponent<
  CalendarEventProps & React.RefAttributes<HTMLElement>
>;
