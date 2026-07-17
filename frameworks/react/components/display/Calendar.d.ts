import * as React from 'react';

/** A slot in the categorical ramp. Fixed order, never cycled. Same eight slots
 *  the charts use — identity is one system across Arena, not one per component. */
export type CatSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO datetime. Read in the calendar's `timeZone`, not the reader's. */
  start: string;
  end: string;
  /**
   * @startingPoint Identity color, from the categorical ramp. Give the same
   * entity the same slot everywhere and it keeps its color across views.
   * Color here means "which thing", never "what state" — for cancelled or
   * tentative use `renderEvent` and a non-chromatic channel.
   */
  slot?: CatSlot;
  /** Ignored by the default body; yours to read from `renderEvent`. */
  meta?: Record<string, unknown>;
}

export interface CalendarProps {
  events: CalendarEvent[];
  /** IANA zone name, e.g. 'Europe/Madrid'. Required: a schedule rendered in the
   *  reader's zone rather than the calendar's is wrong by hours, not by style. */
  timeZone: string;
  /** ISO date the view opens on. Defaults to today in `timeZone`. The component
   *  keeps the anchor internally so the toolbar works unwired; pass this and
   *  change it to drive the date yourself. */
  anchorDate?: string;
  /** Omit to derive from the CONTAINER width: 'day' below --bp-md, else 'week'. */
  view?: 'week' | 'day';
  /** 'HH:MM' the grid starts at. Defaults to the earliest visible event's hour,
   *  floored, or '08:00' when there are no events — empty small hours make a
   *  schedule look broken. */
  dayStart?: string;
  /** 'HH:MM' the grid ends at. Default '23:00'. */
  dayEnd?: string;
  /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
  weekStartsOn?: number;
  /** Drop Sunday from the week unless an event falls on it. Default true. */
  hideEmptyWeekend?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  /** Fires for the day header and the day column background. */
  onDateClick?: (isoDate: string) => void;
  /** The new anchor date after prev/Today/next — refetch your events from it.
   *  Reports the date rather than a delta because "Today" is not a delta. */
  onRangeChange?: (isoDate: string) => void;
  /** Replaces the event body (title + time range). The chip, its position and
   *  its identity color stay Arena's. */
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
  /** Right-aligned slot in the toolbar, next to the range title. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Calendar(props: CalendarProps): JSX.Element;
