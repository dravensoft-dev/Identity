import React from 'react';
import { IconButton } from '../forms/IconButton.jsx';

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
  id, title, start, end, colorId, onClick, actionsEnabled = false, actions,
  box, color, timeLabel, dateLabel, showTime, tabIndex, defaultPanelOpen,
}, ref) {
  /* Required-ness governs runtime, not only the declaration (api/README.md).
     Inside a Calendar an event with an unreadable start/end is dropped with a
     console warning by placeEvents before it ever renders; these guards are what
     a chip written by hand, or built from a half-filled record, hits instead. */
  if (!id) throw new Error('CalendarEvent: `id` is required');
  if (!title) throw new Error('CalendarEvent: `title` is required');
  if (!start) throw new Error('CalendarEvent: `start` is required');
  if (!end) throw new Error('CalendarEvent: `end` is required');

  /* A kebab inside the chip means the chip itself cannot be the <button>:
     nesting one button in another is invalid HTML and the browser restructures
     it silently. With actions, the chip is a <div> and the BODY becomes the
     button; without them, nothing about the markup changes at all, so every
     chip in the tree today renders byte-identically. */
  const hasPanel = actionsEnabled && Boolean(actions);
  const Tag = onClick && !hasPanel ? 'button' : 'div';

  /* `defaultPanelOpen` is a TEST SEAM and deliberately not a contract member:
     renderToStaticMarkup cannot click, and the alternative was leaving the open
     branch unasserted entirely. It is not in CalendarEvent.d.ts and not in the
     contract, so check:api never sees it -- the same status as the props
     Calendar injects. */
  const [panelOpen, setPanelOpen] = React.useState(Boolean(defaultPanelOpen));

  /* The chip's own body, hoisted so the branch below can place it in two
     different parents without duplicating it. */
  const body = (
    <>
      <span style={{ fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      {showTime && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', color: 'var(--mute)' }}>{timeLabel}</span>
      )}
    </>
  );

  return (
    <Tag ref={ref}
      /* Without a kebab the chip IS the button and nothing about this element
         changes. With one, every interactive attribute moves down to the body
         and the chip becomes an inert positioned box. */
      type={onClick && !hasPanel ? 'button' : undefined}
      tabIndex={hasPanel ? undefined : tabIndex}
      onClick={onClick && !hasPanel ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      aria-label={onClick && !hasPanel ? `${title}, ${dateLabel}, ${timeLabel}` : undefined}
      onKeyDown={hasPanel ? (e) => {
        /* Closing takes priority over leaving. Without this, Escape inside an
           open panel would jump focus back to the hour cell AND leave the panel
           open behind it, which is the shape of bug that only ever shows up in
           a screen-reader session. stopPropagation is what keeps Calendar's own
           Escape handler from seeing it. */
        if (e.key === 'Escape' && panelOpen) { e.stopPropagation(); setPanelOpen(false); }
      } : undefined}
      style={{ position: 'absolute', ...box,
        display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden',
        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
        background: `color-mix(in oklab, ${color} 16%, var(--surface-card))`,
        borderLeft: `var(--bw-strong) solid ${color}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: 'var(--r-sm)', cursor: onClick ? 'pointer' : 'default',
        font: 'inherit' }}>
      {hasPanel ? (
        <>
          {onClick ? (
            <button type="button" tabIndex={tabIndex}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              aria-label={`${title}, ${dateLabel}, ${timeLabel}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0,
                background: 'none', border: 'none', padding: 0, margin: 0,
                font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
              {body}
            </button>
          ) : body}
          <span style={{ position: 'absolute', top: 0, right: 0 }}>
            <IconButton icon="ph-bold ph-dots-three-vertical" label="Actions" size="sm"
              tabStop={false}
              onClick={() => setPanelOpen((o) => !o)} />
            {panelOpen && (
              <span style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1,
                display: 'flex', gap: 'var(--sp-2)', padding: 'var(--sp-2)',
                background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
                borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)' }}>
                {actions}
              </span>
            )}
          </span>
        </>
      ) : body}
    </Tag>
  );
});
