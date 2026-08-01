import React from 'react';
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
    dayInteractive?: boolean;
    onDateClick?: (isoDate: string) => void;
    onRangeChange?: (isoDate: string) => void;
    actions?: React.ReactNode;
}
export declare function Calendar({ children, timeZone, anchorDate, view, dayStart, dayEnd, weekStartsOn, hideEmptyWeekend, dayInteractive, onDateClick, onRangeChange, actions, }: CalendarProps): React.JSX.Element;
