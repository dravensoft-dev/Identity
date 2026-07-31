import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../../UseContainerWidth.js';
import { catColor } from '../../../DataVisuals.js';
import { calendarGutterW, calendarHourH } from '../../../Tokens.generated.js';
import {
  addDays, defaultDayStart, formatHM, layoutDay, nowMinutes, parseHM,
  placeEvents, rangeTitle, showsTime, stacksActions, startOfWeek, todayIso, weekdayOf, formatDate,
} from './CalendarInternals.js';

const GUTTER = 'var(--calendar-gutter-w)';

export function Calendar({
  children, timeZone, anchorDate, view,
  dayStart, dayEnd = '23:00', weekStartsOn = 1, hideEmptyWeekend = true,
  dayInteractive = false, onDateClick, onRangeChange, actions,
}) {

  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [ref, width] = useContainerWidth();
  const [anchor, setAnchor] = useState(() => anchorDate || todayIso(zone));

  useEffect(() => { if (anchorDate) setAnchor(anchorDate); }, [anchorDate]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const narrow = width !== null && width < readBreakpoint('md');
  const activeView = view || (narrow ? 'day' : 'week');

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

  const y = (min) => ((min - startMin) / 60) * calendarHourH;
  const hours = [];
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) hours.push(m);

  const slots = hours
    .map((m, i) => ({ start: m, end: i + 1 < hours.length ? hours[i + 1] : endMin }))
    .filter((s) => s.end > s.start);

  const slotFor = (cols) =>
    (width === null ? null : (width - calendarGutterW) / days.length / cols);

  const today = todayIso(zone);
  const nowMin = useMemo(() => nowMinutes(zone), [zone, tick]);
  const showNow = days.includes(today) && nowMin >= startMin && nowMin <= endMin;

  const step = activeView === 'day' ? 1 : 7;
  const goto = (iso) => { setAnchor(iso); onRangeChange && onRangeChange(iso); };
  const activateDay = (iso) =>
    (dayInteractive ? () => { onDateClick && onDateClick(iso); } : undefined);

  const gridRef = useRef(null);

  const eventRefs = useRef(new Map());
  const [gridFocused, setGridFocused] = useState(false);
  const [cursor, setCursor] = useState({ day: 0, hour: 0 });

  const curDay = Math.min(Math.max(cursor.day, 0), Math.max(days.length - 1, 0));
  const curHour = Math.min(Math.max(cursor.hour, 0), Math.max(slots.length - 1, 0));

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

  const onGridKeyDown = (e) => {
    const t = e.target;
    if (!t || typeof t.getAttribute !== 'function') return;

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
        const node = hit && eventRefs.current.get(hit.ev.id);
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
          const DayHead = dayInteractive ? 'button' : 'div';
          return (
            <DayHead key={d} onClick={activateDay(d)}
              type={dayInteractive ? 'button' : undefined}
              aria-label={dayInteractive ? formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }) : undefined}
              style={{ flex: 1, minWidth: 0, padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2) 0', textAlign: 'center',
                background: 'transparent', border: 'none', font: 'inherit',
                cursor: dayInteractive ? 'pointer' : 'default' }}>
              <div style={label}>{formatDate(d, { weekday: 'short' })}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text)', fontWeight: 'var(--fw-bold)', marginTop: 'calc(var(--sp-1) * 0.5)',
                color: isToday ? 'var(--crimson)' : 'var(--bone-dim)' }}>
                {formatDate(d, { day: 'numeric' })}
              </div>
            </DayHead>
          );
        })}
      </div>

      {

}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 'calc(var(--sp-1) * 2)', paddingBottom: 'calc(var(--sp-1) * 2)' }}>
        <div style={{ display: 'flex', position: 'relative', height: y(endMin) }}>

          <div style={{ width: GUTTER, flexShrink: 0, position: 'relative' }}>
            {hours.map((m) => (
              <div key={m} style={{ ...label, position: 'absolute', top: `calc(${y(m)}px - var(--sp-1))`, right: 'calc(var(--sp-1) * 2)', letterSpacing: 'var(--ls-uppercase-status)' }}>
                {formatHM(m)}
              </div>
            ))}
          </div>

          {

}
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
                onClick={activateDay(d)}
                style={{ flex: 1, minWidth: 0, position: 'relative',
                  borderLeft: di === 0 ? 'none' : 'var(--bw) solid var(--color-base-300)',
                  cursor: dayInteractive ? 'pointer' : 'default' }}>

                {

}
                {slots.map((s, si) => {
                  const isCursor = di === curDay && si === curHour;
                  return (
                    <div key={s.start} role="gridcell" aria-label={formatHM(s.start)}
                      tabIndex={isCursor ? 0 : -1}

                      onFocus={() => { if (di !== curDay || si !== curHour) setCursor({ day: di, hour: si }); }}
                      style={{ position: 'absolute', top: y(s.start), left: 0, right: 0,
                        height: y(s.end) - y(s.start), outline: 'none',
                        boxShadow: isCursor && gridFocused
                          ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined }} />
                  );
                })}

                {

}
                {byDay[di].map((p) => {
                  const color = catColor(p.ev.colorId ?? 1);
                  const top = y(p.startMin);
                  const rawH = y(p.endMin) - top;

                  const h = `max(calc(var(--sp-1) * 6.5), ${rawH}px)`;
                  return React.cloneElement(elementOf.get(p.ev), {
                    ref: (node) => {
                      if (node) eventRefs.current.set(p.ev.id, node);
                      else eventRefs.current.delete(p.ev.id);
                    },

                    tabIndex: -1,
                    box: { top, height: h,
                      left: `calc(${(p.col / p.cols) * 100}% + calc(var(--sp-1) * 0.5))`,
                      width: `calc(${(1 / p.cols) * 100}% - var(--sp-1))` },
                    color,
                    timeLabel: `${formatHM(p.startMin)} – ${formatHM(p.endMin)}`,
                    dateLabel: formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }),
                    showTime: showsTime(rawH, slotFor(p.cols)),
                    actionsBelow: stacksActions(rawH, slotFor(p.cols)),
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
