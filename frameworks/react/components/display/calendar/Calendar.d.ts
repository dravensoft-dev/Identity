import * as React from 'react';
import type { CalendarView, CatSlot } from '../../../Api.generated';

/* `CatSlot` was declared and exported locally by the pre-migration file, so it
 * keeps a re-export. `CalendarView` gets none — the old file spelled it as the
 * inline union `'week' | 'day'`, which had no name to import.
 *
 * `CalendarEvent` no longer has one either, and that is a REMOVAL rather than an
 * omission: it stopped being a type when it became a component, so
 * `import type { CalendarEvent } from '.../Calendar'` no longer resolves. There
 * is nothing to re-export — the name now belongs to a component, and its props
 * type is `CalendarEventProps` in `./CalendarEvent`. */
export type { CatSlot };

export interface CalendarProps {
  /** One `<CalendarEvent>` per event. Calendar reads each one's `start`, `end`
   *  and `colorId` and injects where the chip goes, what colour it takes and how
   *  the keyboard reaches it; the chip itself is `CalendarEvent`'s. */
  children?: React.ReactNode;
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
  /** Fires for the day header and the day column background. */
  onDateClick?: (isoDate: string) => void;
  /** The new anchor date after prev/Today/next — refetch your events from it.
   *  Reports the date rather than a delta because "Today" is not a delta. */
  onRangeChange?: (isoDate: string) => void;
  /** Right-aligned slot in the toolbar, next to the range title. */
  actions?: React.ReactNode;
}

export function Calendar(props: CalendarProps): JSX.Element;
