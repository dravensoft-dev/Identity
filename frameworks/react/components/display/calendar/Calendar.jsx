import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../../UseContainerWidth.js';
import { catColor } from '../../../DataVisuals.js';
import { calendarHourH } from '../../../Tokens.generated.js';
import {
  addDays, defaultDayStart, formatHM, layoutDay, nowMinutes, parseHM,
  placeEvents, rangeTitle, startOfWeek, todayIso, weekdayOf, formatDate,
} from './CalendarInternals.js';

const GUTTER = 'calc(var(--sp-1) * 14)';

/** Week/day schedule on a time grid. The events are its CHILDREN — one
 * `<CalendarEvent id title start end colorId />` per event, with `start`/`end` as
 * ISO datetimes read in `timeZone`, an IANA name. A schedule rendered in the
 * reader's zone instead of the calendar's is not off by a style, it is off by
 * hours.
 *
 * Below --bp-md the week collapses to a single day. The threshold is measured on the
 * CONTAINER, not the viewport, for the reason Table gives: a calendar in a narrow
 * column should go day-mode on a wide monitor.
 *
 * Color is identity, never state: `colorId` picks the categorical ramp, in order.
 * Arena draws the whole chip, so there is no per-event channel a consumer can mark
 * "cancelled" or "tentative" on — carry that in the title, or keep such events out
 * of the schedule. Painting one event --danger while its neighbours carry identity
 * colors would make the palette mean two things at once, which is why the ramp is
 * the only colour a consumer chooses here. */
export function Calendar({
  children, timeZone, anchorDate, view,
  dayStart, dayEnd = '23:00', weekStartsOn = 1, hideEmptyWeekend = true,
  onDateClick, onRangeChange, actions,
}) {
  /* `timeZone` is NOT required, and the difference from the fallback this
     replaced is the whole argument. The old default was the literal 'UTC',
     which is arbitrary and wrong for almost every reader -- exactly the defect
     this member's description names. The reader's own resolved zone is not a
     guess: it is right whenever the schedule belongs to the person looking at
     it, which is the common case, and every consumer was writing this same line
     at the call site to get it. Pass the member when the calendar has a zone of
     its OWN that differs -- a Madrid timetable read from Tokyo -- which is a
     product decision whose owner knows they have it.

     SSR: this resolves to the SERVER's zone when rendered there and the
     client's on hydration, so a server-rendered calendar must pass `timeZone`
     explicitly. Same shape as useContainerWidth's null-on-server rule, and said
     again in the prompt. */
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [ref, width] = useContainerWidth();
  const [anchor, setAnchor] = useState(() => anchorDate || todayIso(zone));

  /* The anchor is internal so the toolbar works with no wiring at all, but the
     prop wins whenever it changes: a consumer that drives the date stays in charge. */
  useEffect(() => { if (anchorDate) setAnchor(anchorDate); }, [anchorDate]);

  /* A "now" line that never moves is a lie within the hour. */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // null width → the wide layout. First paint is never the narrow branch.
  const narrow = width !== null && width < readBreakpoint('md');
  const activeView = view || (narrow ? 'day' : 'week');

  /* THE EVENTS ARE THE CONTENT SLOT, one <CalendarEvent> per event, and this is
     a PROJECTION rather than a rewrite: the props come off the children and feed
     the same placeEvents/layoutDay pipeline the array member fed, and
     CalendarInternals.js did not change a line for it.

     `elementOf` is keyed BY PROPS IDENTITY and never by `id`. Keying by id would
     quietly assume ids are unique, and a duplicate would draw one consumer's
     element twice while the other never rendered; threading an index through the
     props object instead would leak into everything those props are handed to,
     starting with placeEvents. The props object is already the thing the
     pipeline carries around (`p.ev`), so it is the key that is free. */
  const kids = useMemo(
    () => React.Children.toArray(children).filter(React.isValidElement),
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
    // Sunday earns its column only by having something in it.
    return all.filter((d) => weekdayOf(d) !== 0 || placed.some((p) => p.dayIso === d));
  }, [activeView, anchor, weekStartsOn, hideEmptyWeekend, placed]);

  const visible = useMemo(() => placed.filter((p) => days.includes(p.dayIso)), [placed, days]);
  const byDay = useMemo(
    () => days.map((d) => layoutDay(visible.filter((p) => p.dayIso === d))),
    [days, visible],
  );

  const endMin = parseHM(dayEnd, 23 * 60);
  const rawStart = dayStart !== undefined ? parseHM(dayStart, 8 * 60) : defaultDayStart(visible);
  // An hour of grid minimum, so an inverted or absurd pair still renders something.
  const startMin = Math.max(0, Math.min(rawStart, endMin - 60));

  const y = (min) => ((min - startMin) / 60) * calendarHourH;
  const hours = [];
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) hours.push(m);

  /* One focusable cell per hour slot: from this hour line to the next, and from
     the last line to the day's close. A slot with no height is not a cell -- it
     would be a tab stop with no target. Derived from `hours` rather than
     re-counted, so the cells and the lines can never disagree. */
  const slots = hours
    .map((m, i) => ({ start: m, end: i + 1 < hours.length ? hours[i + 1] : endMin }))
    .filter((s) => s.end > s.start);

  const today = todayIso(zone);
  const nowMin = useMemo(() => nowMinutes(zone), [zone, tick]);
  const showNow = days.includes(today) && nowMin >= startMin && nowMin <= endMin;

  const step = activeView === 'day' ? 1 : 7;
  const goto = (iso) => { setAnchor(iso); onRangeChange && onRangeChange(iso); };

  /* ------------------------------------------------------------------ *
   * Keyboard navigation of the grid.
   *
   * THE GRID IS TRANSPOSED, and the next reader will assume otherwise: a
   * role="row" here is a DAY COLUMN, and the cells inside it are that day's
   * hour slots. The DOM is column-major because every event block is
   * absolutely positioned inside its own day, and re-laying it out row-major
   * would move the layout. grid.json prescribes no orientation, so the
   * mapping is chosen to keep the eye and the ARIA row agreeing where they
   * can: ArrowLeft/ArrowRight follow the VISUAL direction and therefore
   * cross rows (day -+1), while ArrowUp/ArrowDown and Home/End stay inside
   * the focused row (hour -+1, first hour, last hour). Every handled key
   * clamps at the edge, so focus never leaves the grid.
   * ------------------------------------------------------------------ */
  const gridRef = useRef(null);
  /** ev.id -> the rendered event block, so Enter can reach into a cell without
   *  a selector. A ref map rather than a querySelector: an id is consumer data
   *  and may hold anything a CSS selector would have to escape. */
  const eventRefs = useRef(new Map());
  const [gridFocused, setGridFocused] = useState(false);
  const [cursor, setCursor] = useState({ day: 0, hour: 0 });

  /* The week changes under the cursor -- the range moves, hideEmptyWeekend
     gains or drops Sunday, dayStart follows the earliest event -- so it is
     clamped at render rather than trusted. */
  const curDay = Math.min(Math.max(cursor.day, 0), Math.max(days.length - 1, 0));
  const curHour = Math.min(Math.max(cursor.hour, 0), Math.max(slots.length - 1, 0));

  /* Move DOM focus only when the grid ALREADY holds it. On mount
     document.activeElement is <body>, so a calendar on a page steals nothing;
     once a cell has been focused the roving stop follows the cursor. */
  useEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const active = g.ownerDocument.activeElement;
    if (!active || !g.contains(active)) return;
    const cell = g.querySelector('[role="gridcell"][tabindex="0"]');
    if (cell && cell !== active) cell.focus();
  }, [curDay, curHour]);

  const focusCursorCell = () => {
    const cell = gridRef.current && gridRef.current.querySelector('[role="gridcell"][tabindex="0"]');
    if (cell) cell.focus();
  };

  const isEventNode = (node) => {
    for (const n of eventRefs.current.values()) if (n === node) return true;
    return false;
  };

  const onGridKeyDown = (e) => {
    const t = e.target;
    if (!t || typeof t.getAttribute !== 'function') return;

    /* Cells and event blocks are siblings inside the day column, so a block's
       keydown never bubbles through a cell and the two guards cannot overlap. */
    if (t.getAttribute('role') === 'gridcell') {
      let day = curDay;
      let hour = curHour;
      if (e.key === 'ArrowLeft') day = Math.max(0, day - 1);
      else if (e.key === 'ArrowRight') day = Math.min(days.length - 1, day + 1);
      else if (e.key === 'ArrowUp') hour = Math.max(0, hour - 1);
      else if (e.key === 'ArrowDown') hour = Math.min(slots.length - 1, hour + 1);
      /* Home and End stay INSIDE the focused row, which here is one day: they are
         the first and last hour of that day, never the first day of the week.
         grid.json says "the current row" for both, and resetting the day as well
         would move focus -- convincingly, and to the wrong cell. */
      else if (e.key === 'Home') hour = 0;
      else if (e.key === 'End') hour = slots.length - 1;
      else if (e.key === 'Enter') {
        /* The event blocks left the page Tab sequence when the grid became one
           roving stop, and removing them outright would be a net loss for a
           keyboard user who could activate an event before. APG's answer is
           that they stay reachable from WITHIN the cell: Enter steps in to the
           first event whose time range intersects this slot, Escape steps back
           out. A slot with nothing in it keeps focus where it is. */
        e.preventDefault();
        const s = slots[curHour];
        const hit = s && (byDay[curDay] || []).find((p) => p.startMin < s.end && p.endMin > s.start);
        const node = hit && eventRefs.current.get(hit.ev.id);
        if (node) node.focus();
        return;
      } else return;
      /* preventDefault whether or not the cursor moves: the key was handled, and
         letting it through would scroll the box under a cursor that just refused
         to move. */
      e.preventDefault();
      /* Bail out when the clamp landed where the cursor already was. A fresh
         object always fails Object.is, so without this an arrow held down at an
         edge re-renders the whole grid once per repeat to move nothing -- and
         every one of those renders rebuilds a cell per hour per day. */
      if (day !== curDay || hour !== curHour) setCursor({ day, hour });
      return;
    }

    if (e.key === 'Escape' && isEventNode(t)) {
      e.preventDefault();
      focusCursorCell();
    }
  };

  const label = { fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-column-header)', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 'var(--fw-bold)' };
  const navBtn = (dir) => (
    <button type="button" aria-label={dir < 0 ? 'Previous' : 'Next'}
      onClick={() => goto(addDays(anchor, dir * step))}
      style={{ height: 'calc(var(--sp-1) * 8.5)', minWidth: 'calc(var(--sp-1) * 8.5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-sm)',
        color: 'var(--bone-dim)', cursor: 'pointer', fontSize: 'var(--icon-md)' }}>
      <i className={dir < 0 ? 'ph-bold ph-caret-left' : 'ph-bold ph-caret-right'} />
    </button>
  );

  return (
    <section ref={ref} aria-label={`Schedule, ${rangeTitle(days)}`}
      style={{ display: 'flex', flexDirection: 'column', width: '100%', fontFamily: 'var(--font-body)' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', marginBottom: 'calc(var(--sp-1) * 3)', flexWrap: 'wrap' }}>
        {navBtn(-1)}
        <button type="button" onClick={() => goto(today)}
          style={{ height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 3)', background: 'transparent', border: 'var(--bw) solid var(--color-base-300)',
            borderRadius: 'var(--r-sm)', color: 'var(--bone-dim)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', fontWeight: 'var(--fw-semibold)' }}>Today</button>
        {navBtn(1)}
        <h2 style={{ margin: '0 0 0 calc(var(--sp-1) * 1)', fontSize: 'var(--fs-md)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
          {rangeTitle(days)}
        </h2>
        {actions && <div style={{ marginLeft: 'auto', display: 'flex', gap: 'calc(var(--sp-1) * 2)', flexWrap: 'wrap' }}>{actions}</div>}
      </div>

      <div style={{ display: 'flex', paddingLeft: GUTTER, borderBottom: 'var(--bw) solid var(--color-base-300)' }}>
        {days.map((d) => {
          const isToday = d === today;
          return (
            <div key={d} onClick={onDateClick ? () => onDateClick(d) : undefined}
              style={{ flex: 1, minWidth: 0, padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2) calc(var(--sp-1) * 2)', textAlign: 'center',
                cursor: onDateClick ? 'pointer' : 'default' }}>
              <div style={label}>{formatDate(d, { weekday: 'short' })}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text)', fontWeight: 'var(--fw-bold)', marginTop: 'calc(var(--sp-1) * 0.5)',
                color: isToday ? 'var(--crimson)' : 'var(--bone-dim)' }}>
                {formatDate(d, { day: 'numeric' })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hour labels are centred on their line, so the first and last overhang
          the grid. Without the pads they are clipped — top by the header, bottom
          by the scroll box whenever the calendar is left to size itself. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 'calc(var(--sp-1) * 2)', paddingBottom: 'calc(var(--sp-1) * 2)' }}>
        <div style={{ display: 'flex', position: 'relative', height: y(endMin) }}>

          <div style={{ width: GUTTER, flexShrink: 0, position: 'relative' }}>
            {hours.map((m) => (
              <div key={m} style={{ ...label, position: 'absolute', top: `calc(${y(m)}px - var(--sp-1))`, right: 'calc(var(--sp-1) * 2)', letterSpacing: 'var(--ls-uppercase-status)' }}>
                {formatHM(m)}
              </div>
            ))}
          </div>

          {/* The grid is THIS element and not the scroll box or the <section>:
              its only children that are not aria-hidden are the day columns, so
              grid > row is direct and the hour-label gutter stays outside the
              grid entirely. The <section> keeps its own aria-label -- taking it
              away would demote a named region landmark to a generic element --
              and the grid carries a name of its own for roles.label to attach
              to. */}
          <div ref={gridRef} role="grid" aria-label={`Schedule grid, ${rangeTitle(days)}`}
            onKeyDown={onGridKeyDown}
            onFocus={() => setGridFocused(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setGridFocused(false); }}
            style={{ flex: 1, minWidth: 0, display: 'flex', position: 'relative' }}>
            {hours.map((m) => (
              <div key={m} aria-hidden="true" style={{ position: 'absolute', top: y(m), left: 0, right: 0,
                borderTop: 'var(--bw) solid var(--color-base-300)', pointerEvents: 'none' }} />
            ))}

            {days.map((d, di) => (
              <div key={d} role="row"
                aria-label={formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}
                onClick={onDateClick ? () => onDateClick(d) : undefined}
                style={{ flex: 1, minWidth: 0, position: 'relative',
                  borderLeft: di === 0 ? 'none' : 'var(--bw) solid var(--color-base-300)',
                  cursor: onDateClick ? 'pointer' : 'default' }}>

                {/* The hour cells come BEFORE the event blocks in DOM order, so
                    the blocks keep painting above them and keep receiving their
                    own clicks. The cells add no box: they are absolutely
                    positioned and transparent, and the focus ring is drawn
                    INSET -- an outward ring would be clipped by the scroll box
                    at the grid's edges and would overlap its neighbours. */}
                {slots.map((s, si) => {
                  const isCursor = di === curDay && si === curHour;
                  return (
                    <div key={s.start} role="gridcell" aria-label={formatHM(s.start)}
                      tabIndex={isCursor ? 0 : -1}
                      /* A cell reached by pointer or by the Escape route takes the
                         cursor with it; the same guard as the key handler, because
                         the effect below focuses the cursor cell and its focus event
                         would otherwise re-render the grid a second time per move. */
                      onFocus={() => { if (di !== curDay || si !== curHour) setCursor({ day: di, hour: si }); }}
                      style={{ position: 'absolute', top: y(s.start), left: 0, right: 0,
                        height: y(s.end) - y(s.start), outline: 'none',
                        boxShadow: isCursor && gridFocused
                          ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined }} />
                  );
                })}

                {/* The chip body is CalendarEvent's; what Calendar injects here
                    is only WHERE the chip goes and what the grid needs from it.
                    None of these is a member of CalendarEvent's contract, the
                    same way `name`/`checked`/`onSelect` are not members of
                    Radio's -- an injected prop is a private channel between a
                    compound parent and its own child. */}
                {byDay[di].map((p) => {
                  const color = catColor(p.ev.colorId ?? 1);
                  const top = y(p.startMin);
                  const rawH = y(p.endMin) - top;
                  // 18px floor (sp-1 * 4.5) so a 5-minute event still has to
                  // be clickable -- expressed as a CSS max() rather than a
                  // JS Math.max so the floor moves with the token. The
                  // label-fit check below reads rawH, not h: the floor only
                  // ever raises a height already under 32, so the two are
                  // equivalent for that comparison and rawH can stay a
                  // plain number.
                  const h = `max(calc(var(--sp-1) * 4.5), ${rawH}px)`;
                  return React.cloneElement(elementOf.get(p.ev), {
                    ref: (node) => {
                      if (node) eventRefs.current.set(p.ev.id, node);
                      else eventRefs.current.delete(p.ev.id);
                    },
                    /* Out of the page Tab sequence: the grid is ONE roving
                       stop. Enter from the cell that intersects this event
                       reaches it, Escape returns. */
                    tabIndex: -1,
                    box: { top, height: h,
                      left: `calc(${(p.col / p.cols) * 100}% + calc(var(--sp-1) * 0.5))`,
                      width: `calc(${(1 / p.cols) * 100}% - var(--sp-1))` },
                    color,
                    timeLabel: `${formatHM(p.startMin)} – ${formatHM(p.endMin)}`,
                    dateLabel: formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }),
                    showTime: rawH >= 32,
                  });
                })}
              </div>
            ))}

            {showNow && (
              <div aria-hidden="true" style={{ position: 'absolute', top: y(nowMin), left: 0, right: 0,
                borderTop: 'var(--bw-strong) solid var(--crimson)', pointerEvents: 'none', zIndex: 1 }}>
                <span style={{ position: 'absolute', top: 'calc(var(--sp-1) * -1)', left: 'calc(var(--sp-1) * -1)', width: 'calc(var(--sp-1) * 1.5)', height: 'calc(var(--sp-1) * 1.5)',
                  borderRadius: '50%', background: 'var(--crimson)' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
