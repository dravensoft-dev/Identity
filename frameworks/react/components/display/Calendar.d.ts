import * as React from 'react';
import type { CalendarEvent, CalendarView, CatSlot } from '../../api.generated';

/* Both were declared and exported locally by the pre-migration file, so both keep
 * a re-export: a consumer's existing `import type { CalendarEvent } from
 * '.../Calendar'` has to keep resolving. `CalendarView` gets none — the old file
 * spelled it as the inline union `'week' | 'day'`, which had no name to import. */
export type { CalendarEvent, CatSlot };

export interface CalendarProps {
  /** The events to place. */
  events: CalendarEvent[];
  /** IANA zone name, e.g. 'Europe/Madrid'. Defaults to the reader's own resolved
   *  zone. Pass it when the calendar has a zone of its own that differs — a
   *  Madrid timetable read from Tokyo — and when server-rendering, where the
   *  reader's zone is not knowable and the server's would be used instead. */
  timeZone?: string;
  /** ISO date the view opens on. Defaults to today in `timeZone`. The component
   *  keeps the anchor internally so the toolbar works unwired; pass this and
   *  change it to drive the date yourself. */
  anchorDate?: string;
  /** Omit to derive from the CONTAINER width: 'day' below --bp-md, else 'week'. */
  view?: CalendarView;
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
  /** An event chip was activated; carries the event. */
  onEventClick?: (event: CalendarEvent) => void;
  /** Fires for the day header and the day column background. */
  onDateClick?: (isoDate: string) => void;
  /** The new anchor date after prev/Today/next — refetch your events from it.
   *  Reports the date rather than a delta because "Today" is not a delta. */
  onRangeChange?: (isoDate: string) => void;
  /** Right-aligned slot in the toolbar, next to the range title. */
  actions?: React.ReactNode;
}

export function Calendar(props: CalendarProps): JSX.Element;
