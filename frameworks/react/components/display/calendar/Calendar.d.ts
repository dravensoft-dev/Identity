import * as React from 'react';
import type { CalendarView, CatSlot } from '../../../Api.generated';

export type { CatSlot };

export interface CalendarProps {

  children?: React.ReactNode;

  timeZone?: string;

  anchorDate?: string;

  view?: CalendarView;

  dayStart?: string;

  dayEnd?: string;

  weekStartsOn?: number;

  hideEmptyWeekend?: boolean;

  onDateClick?: (isoDate: string) => void;

  onRangeChange?: (isoDate: string) => void;

  actions?: React.ReactNode;
}

export function Calendar(props: CalendarProps): JSX.Element;
