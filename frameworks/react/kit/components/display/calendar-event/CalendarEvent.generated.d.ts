import React from 'react';
import type { CatSlot } from '../../../Api.generated';
export interface CalendarEventProps {
    id: string;
    title: string;
    start: string;
    end: string;
    colorId?: CatSlot;
    interactive?: boolean;
    disabled?: boolean;
    actionsEnabled?: boolean;
    actions?: React.ReactNode;
    onClick?: () => void;
}
export interface CalendarEventInjected {
    box: React.CSSProperties;
    color: string;
    timeLabel: string;
    dateLabel: string;
    showTime: boolean;
    actionsBelow: boolean;
    tabIndex: number;
    defaultPanelOpen: boolean;
}
export declare const CalendarEvent: React.ForwardRefExoticComponent<CalendarEventProps & Partial<CalendarEventInjected> & React.RefAttributes<HTMLElement>>;
