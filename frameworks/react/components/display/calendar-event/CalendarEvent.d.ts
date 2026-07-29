import * as React from 'react';
import type { CatSlot } from '../../../Api.generated';

export interface CalendarEventProps {

  id: string;

  title: string;

  start: string;

  end: string;

  colorId?: CatSlot;

  actionsEnabled?: boolean;

  actions?: React.ReactNode;

  onClick?: () => void;
}

export declare const CalendarEvent: React.ForwardRefExoticComponent<
  CalendarEventProps & React.RefAttributes<HTMLElement>
>;
