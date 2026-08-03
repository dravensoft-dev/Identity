import type { CalendarEventProps, CalendarEventInjected } from '../calendar-event/CalendarEvent.tsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../../UseContainerWidth.ts';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Calendar.classes.generated.ts';
import { catColor } from '../../../DataVisuals.ts';
import { calendarGutterW, calendarHourH } from '../../../Tokens.generated.js';

import type { CalendarView, CatSlot } from '../../../Api.generated';

export type { CatSlot };

export interface CalendarProps {

  /** One CalendarEvent per event. Calendar reads each one's start, end and colorId and settles where the chip goes, what colour it takes and how the keyboard reaches it; the chip itself is CalendarEvent's. */
  children?: React.ReactNode;

  /** IANA zone name. Defaults to the reader's own resolved zone, which is right whenever the schedule belongs to the person looking at it. Pass it when the calendar has a zone of its own that differs (a Madrid timetable read from Tokyo), and when server-rendering, where the reader's zone is not knowable. */
  timeZone?: string;

  /** ISO date the view opens on. Defaults to today in `timeZone`; pass and change it to drive the date yourself. */
  anchorDate?: string;

  /** Omit to derive from the CONTAINER width: day below --bp-md, else week. */
  view?: CalendarView;

  /** HH:MM the grid starts at. Defaults to the earliest visible event's hour, floored. */
  dayStart?: string;

  /** HH:MM the grid ends at. */
  dayEnd?: string;

  /** 0 = Sunday … 6 = Saturday. */
  weekStartsOn?: number;

  /** Drop Sunday from the week unless an event falls on it. */
  hideEmptyWeekend?: boolean;

  /** Whether a day can be activated. A boolean rather than "is `dateClick` bound?", per R6, and the same member `TableRow.interactive` and `CalendarEvent.interactive` are for the same reason; here the derived render was the day's own cursor, and the layers diverged on screen because of it. With it on, the day header is a <button> (the keyboard's route to the date, and the one element that already names it), and the column background takes a pointer cursor; with it off both are inert and the cursor says so. The default is false because a schedule someone only reads is the ordinary calendar, and a pointer cursor over days that answer nothing is the defect this member exists to end. */
  dayInteractive?: boolean;

  /** A day header or column background was activated; carries the ISO date. Never emitted unless `dayInteractive`. */
  onDateClick?: (isoDate: string) => void;

  /** The anchor moved via prev/Today/next; carries the new ISO date. A date rather than a delta, because Today is not a delta. */
  onRangeChange?: (isoDate: string) => void;

  /** Right-aligned in the toolbar, beside the range title. */
  actions?: React.ReactNode;
}

import {
  addDays, defaultDayStart, formatHM, layoutDay, nowMinutes, parseHM,
  placeEvents, rangeTitle, showsTime, stacksActions, startOfWeek, todayIso, weekdayOf, formatDate,
} from './CalendarInternals.ts';

const TRACKS = (n: number) => `repeat(${n}, minmax(0, 1fr))`;

const calendarStyles = arenaStyles(manifest);

export function Calendar({
  children, timeZone, anchorDate, view,
  dayStart, dayEnd = '23:00', weekStartsOn = 1, hideEmptyWeekend = true,
  dayInteractive = false, onDateClick, onRangeChange, actions,
}: CalendarProps) {

  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [ref, width] = useContainerWidth<HTMLElement>();
  const [anchor, setAnchor] = useState(() => anchorDate || todayIso(zone));

  useEffect(() => { if (anchorDate) setAnchor(anchorDate); }, [anchorDate]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const narrow = width !== null && width < readBreakpoint('md');
  const activeView = view || (narrow ? 'day' : 'week');

  type EventElement = React.ReactElement<
  CalendarEventProps & Partial<CalendarEventInjected> & React.RefAttributes<HTMLElement>
  >;
  const kids = useMemo(
    () => React.Children.toArray(children)
      .filter((c): c is EventElement => React.isValidElement(c)),
    [children],
  );
  const events = useMemo(() => kids.map((k) => k.props), [kids]);
  const elementOf = useMemo(() => new Map(kids.map((k) => [k.props, k])), [kids]);

  const placed = useMemo(() => placeEvents(events, zone), [events, zone]);

  const days = useMemo(() => {
    if (activeView === 'day') return [anchor];
    const first = startOfWeek(anchor, weekStartsOn);
    const all = Array.from({ length: 7 }, (_, i) => addDays(first, i));
    if (!hideEmptyWeekend) return all;

    return all.filter((d) => weekdayOf(d) !== 0 || placed.some((p) => p.dayIso === d));
  }, [activeView, anchor, weekStartsOn, hideEmptyWeekend, placed]);

  const visible = useMemo(() => placed.filter((p) => days.includes(p.dayIso)), [placed, days]);
  const byDay = useMemo(
    () => days.map((d) => layoutDay(visible.filter((p) => p.dayIso === d))),
    [days, visible],
  );

  const endMin = parseHM(dayEnd, 23 * 60);
  const rawStart = dayStart !== undefined ? parseHM(dayStart, 8 * 60) : defaultDayStart(visible);

  const startMin = Math.max(0, Math.min(rawStart, endMin - 60));

  const y = (min: number) => ((min - startMin) / 60) * calendarHourH;
  const hours: number[] = [];
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) hours.push(m);

  const slots = hours
    .map((m, i) => ({ start: m, end: (i + 1 < hours.length ? hours[i + 1] : endMin) ?? endMin }))
    .filter((s) => s.end > s.start);

  const slotFor = (cols: number) =>
    (width === null ? null : (width - calendarGutterW) / days.length / cols);

  const today = todayIso(zone);
  const nowMin = useMemo(() => nowMinutes(zone), [zone, tick]);
  const showNow = days.includes(today) && nowMin >= startMin && nowMin <= endMin;

  const step = activeView === 'day' ? 1 : 7;
  const goto = (iso: string) => { setAnchor(iso); onRangeChange && onRangeChange(iso); };
  const activateDay = (iso: string) =>
    (dayInteractive ? () => { onDateClick && onDateClick(iso); } : undefined);

  const idBase = React.useId().replace(/:/g, '');
  const chips = useMemo(
    () => byDay.flatMap((day, di) => day.map((p, i) => ({ p, di, domId: `${idBase}-chip-${di}-${i}` }))),
    [byDay, idBase],
  );
  const ownedIds = (di: number) => chips.filter((c) => c.di === di).map((c) => c.domId).join(' ');

  const gridRef = useRef<HTMLDivElement | null>(null);

  const eventRefs = useRef(new Map<string, HTMLElement>());
  const [cursor, setCursor] = useState({ day: 0, hour: 0 });

  const curDay = Math.min(Math.max(cursor.day, 0), Math.max(days.length - 1, 0));
  const curHour = Math.min(Math.max(cursor.hour, 0), Math.max(slots.length - 1, 0));

  useEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const active = g.ownerDocument.activeElement;
    if (!active || !g.contains(active)) return;
    const cell = g.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');
    if (cell && cell !== active) cell.focus();
  }, [curDay, curHour]);

  const focusCursorCell = () => {
    const cell = gridRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');
    if (cell) cell.focus();
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    if (t.getAttribute('role') === 'gridcell') {
      let day = curDay;
      let hour = curHour;
      if (e.key === 'ArrowLeft') day = Math.max(0, day - 1);
      else if (e.key === 'ArrowRight') day = Math.min(days.length - 1, day + 1);
      else if (e.key === 'ArrowUp') hour = Math.max(0, hour - 1);
      else if (e.key === 'ArrowDown') hour = Math.min(slots.length - 1, hour + 1);

      else if (e.key === 'Home') hour = 0;
      else if (e.key === 'End') hour = slots.length - 1;
      else if (e.key === 'Enter') {

        e.preventDefault();
        const s = slots[curHour];
        const hit = s && (byDay[curDay] || []).find((p) => p.startMin < s.end && p.endMin > s.start);
        const node = hit?.ev.id === undefined ? null : eventRefs.current.get(hit.ev.id);
        if (node) node.focus();
        return;
      } else return;

      e.preventDefault();

      if (day !== curDay || hour !== curHour) setCursor({ day, hour });
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      focusCursorCell();
    }
  };

  const styles = calendarStyles({ dayInteractive });
  const navBtn = (dir: number) => (
    <button type="button" aria-label={dir < 0 ? 'Previous' : 'Next'}
      onClick={() => goto(addDays(anchor, dir * step))}
      className={styles.nav()}>
      <i className={dir < 0 ? 'ph-bold ph-caret-left' : 'ph-bold ph-caret-right'} aria-hidden="true" />
    </button>
  );

  return (
    <section ref={ref} aria-label={`Schedule, ${rangeTitle(days)}`}
      className={styles.root()}>

      <div className={styles.toolbar()}>
        {navBtn(-1)}
        <button type="button" onClick={() => goto(today)}
          className={styles.today()}>Today</button>
        {navBtn(1)}
        <h2 className={styles.heading()}>
          {rangeTitle(days)}
        </h2>
        {actions && <div className={styles.actions()}>{actions}</div>}
      </div>

      <div className={styles.headStrip()} style={{ gridTemplateColumns: TRACKS(days.length) }}>
        {days.map((d) => {
          const isToday = d === today;
          const DayHead = dayInteractive ? 'button' : 'div';
          return (
            <DayHead key={d} onClick={activateDay(d)}
              type={dayInteractive ? 'button' : undefined}
              aria-label={dayInteractive ? formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }) : undefined}
              className={styles.dayHead()}>
              <div className={styles.weekday()}>{formatDate(d, { weekday: 'short' })}</div>
              <div className={calendarStyles({ today: isToday }).dayNumber()}>
                {formatDate(d, { day: 'numeric' })}
              </div>
            </DayHead>
          );
        })}
      </div>

      {

}
      <div className={styles.scroll()}>
        <div className={styles.body()} style={{ height: y(endMin) }}>

          <div className={styles.gutter()}>
            {hours.map((m) => (
              <div key={m} className={styles.hourLabel()} style={{ top: y(m) }}>
                {formatHM(m)}
              </div>
            ))}
          </div>

          {

}
          <div ref={gridRef} role="grid" aria-label={`Schedule grid, ${rangeTitle(days)}`}
            onKeyDown={onGridKeyDown}
            className={styles.grid()} style={{ gridTemplateColumns: TRACKS(days.length) }}>
            {hours.map((m) => (
              <div key={m} aria-hidden="true" className={styles.rule()} style={{ top: y(m) }} />
            ))}

            {days.map((d, di) => (
              <div key={d} role="row"
                aria-label={formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}
                aria-owns={ownedIds(di) || undefined}
                onClick={activateDay(d)}
                className={calendarStyles({ firstColumn: di === 0, dayInteractive }).column()}>
                {slots.map((s, si) => {
                  const isCursor = di === curDay && si === curHour;
                  return (
                    <div key={s.start} role="gridcell" aria-label={formatHM(s.start)}
                      tabIndex={isCursor ? 0 : -1}

                      onFocus={() => { if (di !== curDay || si !== curHour) setCursor({ day: di, hour: si }); }}
                      className={styles.cell()}
                      style={{ top: y(s.start), height: y(s.end) - y(s.start) }} />
                  );
                })}
              </div>
            ))}

            {chips.map(({ p, di, domId }) => {
              const top = y(p.startMin);
              const rawH = y(p.endMin) - top;
              const element = elementOf.get(p.ev);
              if (!element) return null;
              const leftShare = ((di + p.col / p.cols) / days.length) * 100;
              const widthShare = (1 / (p.cols * days.length)) * 100;
              return React.cloneElement(element, {
                ref: (node: HTMLElement | null) => {
                  const id = p.ev.id;
                  if (id === undefined) return;
                  if (node) eventRefs.current.set(id, node);
                  else eventRefs.current.delete(id);
                },

                domId,
                tabIndex: -1,
                box: { top, height: `max(calc(var(--sp-1) * 6.5), ${rawH}px)`,
                  left: `${leftShare}%`,
                  right: `${100 - leftShare - widthShare}%` },
                color: catColor(p.ev.colorId ?? 1),
                timeLabel: `${formatHM(p.startMin)} – ${formatHM(p.endMin)}`,
                dateLabel: formatDate(days[di] ?? '', { weekday: 'long', day: 'numeric', month: 'long' }),
                showTime: showsTime(rawH, slotFor(p.cols)),
                actionsBelow: stacksActions(rawH, slotFor(p.cols)),
              });
            })}

            {showNow && (
              <div aria-hidden="true" className={styles.now()} style={{ top: y(nowMin) }}>
                <span className={styles.nowDot()} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
