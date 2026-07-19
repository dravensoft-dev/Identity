import React, { useEffect, useMemo, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../use-container-width.js';
import { catColor } from '../charts/chart-internals.js';
import {
  addDays, defaultDayStart, formatHM, layoutDay, nowMinutes, parseHM,
  placeEvents, rangeTitle, startOfWeek, todayIso, weekdayOf, formatDate,
} from './calendar-internals.js';

const HOUR_H = 44;
const GUTTER = 56;

/** Week/day schedule on a time grid. `events`: [{id, title, start, end, slot, meta}]
 * with `start`/`end` as ISO datetimes; `timeZone` is an IANA name and is required —
 * a schedule rendered in the reader's zone instead of the calendar's is not off by
 * a style, it is off by hours.
 *
 * Below --bp-md the week collapses to a single day. The threshold is measured on the
 * CONTAINER, not the viewport, for the reason Table gives: a calendar in a narrow
 * column should go day-mode on a wide monitor.
 *
 * Color is identity, never state: `slot` picks the categorical ramp, in order. To
 * mark an event cancelled or tentative, use `renderEvent` and a non-chromatic
 * channel — a strikethrough, a dashed border. Painting one event --danger while its
 * neighbours carry identity colors makes the palette mean two things at once. */
export function Calendar({
  events = [], timeZone, anchorDate, view,
  dayStart, dayEnd = '23:00', weekStartsOn = 1, hideEmptyWeekend = true,
  onEventClick, onDateClick, onRangeChange, renderEvent, actions, style,
}) {
  const zone = timeZone || 'UTC';
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

  const y = (min) => ((min - startMin) / 60) * HOUR_H;
  const hours = [];
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) hours.push(m);

  const today = todayIso(zone);
  const nowMin = useMemo(() => nowMinutes(zone), [zone, tick]);
  const showNow = days.includes(today) && nowMin >= startMin && nowMin <= endMin;

  const step = activeView === 'day' ? 1 : 7;
  const goto = (iso) => { setAnchor(iso); onRangeChange && onRangeChange(iso); };

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
      style={{ display: 'flex', flexDirection: 'column', width: '100%', fontFamily: 'var(--font-body)', ...style }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', marginBottom: 'calc(var(--sp-1) * 3)', flexWrap: 'wrap' }}>
        {navBtn(-1)}
        <button type="button" onClick={() => goto(today)}
          style={{ height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 3)', background: 'transparent', border: 'var(--bw) solid var(--color-base-300)',
            borderRadius: 'var(--r-sm)', color: 'var(--bone-dim)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', fontWeight: 'var(--fw-semibold)' }}>Today</button>
        {navBtn(1)}
        <h2 style={{ margin: '0 0 0 calc(var(--sp-1) * 1)', fontSize: 15, fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
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
              <div key={m} style={{ ...label, position: 'absolute', top: y(m) - 5, right: 'calc(var(--sp-1) * 2)', letterSpacing: 'var(--ls-uppercase-status)' }}>
                {formatHM(m)}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', position: 'relative' }}>
            {hours.map((m) => (
              <div key={m} aria-hidden="true" style={{ position: 'absolute', top: y(m), left: 0, right: 0,
                borderTop: 'var(--bw) solid var(--color-base-300)', pointerEvents: 'none' }} />
            ))}

            {days.map((d, di) => (
              <div key={d} onClick={onDateClick ? () => onDateClick(d) : undefined}
                style={{ flex: 1, minWidth: 0, position: 'relative',
                  borderLeft: di === 0 ? 'none' : '1px solid var(--color-base-300)',
                  cursor: onDateClick ? 'pointer' : 'default' }}>
                {byDay[di].map((p) => {
                  const color = catColor(p.ev.slot ?? 1);
                  const top = y(p.startMin);
                  // 18px floor: a 5-minute event still has to be clickable.
                  const h = Math.max(18, y(p.endMin) - top);
                  const time = `${formatHM(p.startMin)} – ${formatHM(p.endMin)}`;
                  const Tag = onEventClick ? 'button' : 'div';
                  return (
                    <Tag key={p.ev.id} type={onEventClick ? 'button' : undefined}
                      onClick={onEventClick ? (e) => { e.stopPropagation(); onEventClick(p.ev); } : undefined}
                      aria-label={onEventClick ? `${p.ev.title}, ${formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}, ${time}` : undefined}
                      style={{ position: 'absolute', top, height: h,
                        left: `calc(${(p.col / p.cols) * 100}% + calc(var(--sp-1) * 0.5))`,
                        width: `calc(${(1 / p.cols) * 100}% - var(--sp-1))`,
                        display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden',
                        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
                        background: `color-mix(in oklab, ${color} 16%, var(--surface-card))`,
                        borderLeft: `var(--bw-strong) solid ${color}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                        borderRadius: 'var(--r-sm)', cursor: onEventClick ? 'pointer' : 'default',
                        font: 'inherit' }}>
                      {renderEvent ? renderEvent(p.ev) : (
                        <>
                          <span style={{ fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ev.title}</span>
                          {h >= 32 && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', color: 'var(--mute)' }}>{time}</span>
                          )}
                        </>
                      )}
                    </Tag>
                  );
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
