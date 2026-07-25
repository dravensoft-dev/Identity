import React from 'react';

/** One event on a `Calendar`'s schedule. Write one per event as a child of
 * `Calendar`; it never stands alone, because everything about WHERE it goes is
 * the calendar's to decide.
 *
 * THE DIVISION OF LABOUR, because it is the whole reason this is a component and
 * not a field of a declared object: `Calendar` owns where an event goes — the
 * placement, the column it shares with its overlaps, the grid, the keyboard.
 * `CalendarEvent` owns what an event LOOKS like — the chip chrome, the title,
 * the time line. Neither reaches into the other.
 *
 * `box`, `color`, `timeLabel`, `dateLabel`, `showTime`, `tabIndex` and the
 * forwarded `ref` are INJECTED by `Calendar` through `cloneElement` and are not
 * part of this component's public API — the same shape, and for the same reason,
 * as `RadioGroup` injecting `name`/`checked`/`onSelect` into each `Radio`. A
 * consumer never writes one of them.
 *
 * The ref is forwarded because `Calendar` keeps a map of event id -> the
 * rendered chip, which is how Enter steps into an event from the hour cell that
 * intersects it and Escape steps back out. A chip that swallowed its ref would
 * take that route away silently. */
export const CalendarEvent = React.forwardRef(function CalendarEvent({
  id, title, start, end, colorId, onClick,
  box, color, timeLabel, dateLabel, showTime, tabIndex,
}, ref) {
  /* Required-ness governs runtime, not only the declaration (api/README.md).
     Inside a Calendar an event with an unreadable start/end is dropped with a
     console warning by placeEvents before it ever renders; these guards are what
     a chip written by hand, or built from a half-filled record, hits instead. */
  if (!id) throw new Error('CalendarEvent: `id` is required');
  if (!title) throw new Error('CalendarEvent: `title` is required');
  if (!start) throw new Error('CalendarEvent: `start` is required');
  if (!end) throw new Error('CalendarEvent: `end` is required');

  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined}
      /* Out of the page Tab sequence: the grid is ONE roving stop, and Calendar
         injects the -1 that keeps it that way. */
      tabIndex={tabIndex}
      /* The day column underneath carries its own click handler, so an
         activation that bubbled would report a date as well as an event. */
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      aria-label={onClick ? `${title}, ${dateLabel}, ${timeLabel}` : undefined}
      style={{ position: 'absolute', ...box,
        display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden',
        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
        background: `color-mix(in oklab, ${color} 16%, var(--surface-card))`,
        borderLeft: `var(--bw-strong) solid ${color}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: 'var(--r-sm)', cursor: onClick ? 'pointer' : 'default',
        font: 'inherit' }}>
      <span style={{ fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      {showTime && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', color: 'var(--mute)' }}>{timeLabel}</span>
      )}
    </Tag>
  );
});
