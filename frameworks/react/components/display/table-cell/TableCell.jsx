import React from 'react';

/* THE CELL OWNS CELL STYLING, and `Table` imports these three back for its own
 * <thead>. They live here rather than in Table.jsx because the leaf is what
 * draws a cell; the header row is the one place the table draws one itself. */

/** The mono/uppercase micro-label: a column header in the wide layout, and the
 *  same label beside the value in card mode. */
export const HEADER_LABEL = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-column-header)',
  textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 'var(--fw-bold)',
};

/** Padding and type size every cell shares, header included. */
export const CELL_BASE = {
  padding: 'var(--dz-row-py) var(--dz-row-px)', fontSize: 'var(--dz-text)',
  textAlign: 'left', verticalAlign: 'middle',
};

/** `mono` is the column's rule for identifiers and figures, and it carries the
 *  gold ink with it — the two are one decision, not two. */
export const valueStyle = (column) => ({
  fontFamily: column.mono ? 'var(--font-mono)' : 'var(--font-body)',
  color: column.mono ? 'var(--gold)' : 'var(--bone-dim)',
});

/** One cell of a `TableRow`. Write one per cell; what goes inside is yours — a
 * value, or one of Arena's own components, a `Badge` for a status or a `Button`
 * for an action.
 *
 * THAT IS THE WHOLE REASON THIS COMPONENT EXISTS. `TableColumn` used to carry a
 * `render` function and Arena called it once per cell, which is per-item
 * projection: the convention that removed `ActivityFeed.renderItem` and
 * `Calendar.renderEvent` removes it here too, because Angular has no answer for
 * it short of a structural directive. A cell the CONSUMER instantiates is not
 * per-item projection at all — it is one element they wrote, exactly as
 * `CalendarEvent` is.
 *
 * `column`, `layout`, `tabIndex`, `focused` and `onCellFocus` are INJECTED by
 * `TableRow` (which is itself fed by `Table`) and are not part of this
 * component's public API — the same shape, and for the same reason, as
 * `RadioGroup` injecting `name`/`checked`/`onSelect` into each `Radio`. A
 * consumer never writes one of them. */
export function TableCell({
  children, column, layout = 'table', tabIndex, focused = false, onCellFocus,
}) {
  /* Standing alone — outside a Table, or in a row carrying more cells than
     there are columns — a cell has no column to read. It still draws. */
  const c = column || {};

  if (layout === 'card') {
    if (c.mobileLayout === 'block') {
      /* Full width, no label — for the actions column, whose buttons name
         themselves and would look absurd beside an "ACTIONS" tag. */
      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end',
          gap: 'calc(var(--sp-1) * 2)', borderTop: 'var(--bw) solid var(--color-base-300)',
          paddingTop: 'calc(var(--sp-1) * 2)' }}>
          {children}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'calc(var(--sp-1) * 3)' }}>
        <span style={HEADER_LABEL}>{c.header}</span>
        <span style={{ ...valueStyle(c), minWidth: 0, textAlign: 'right', fontSize: 'var(--dz-text)' }}>
          {children}
        </span>
      </div>
    );
  }

  return (
    <td role="gridcell" tabIndex={tabIndex}
      /* THE CELL OWNS THE CURSOR; ITS CONTENTS DO NOT. React's onFocus is
         focusin, which BUBBLES, so a control the consumer drew inside this cell
         fires this handler too. Taking the cursor there moves the roving
         tabindex onto this cell, and Table's focus effect then pulls focus off
         the consumer's control and onto the cell. Measured in real Chromium
         before this guard existed: a Tab aimed at an actions-column <button>
         landed on the <td>, and only a SECOND Tab reached the button. The guard
         lives here, on the element whose `currentTarget` it tests -- Table
         hands down a plain zero-argument callback and never sees the event. */
      onFocus={onCellFocus ? (e) => { if (e.target === e.currentTarget) onCellFocus(); } : undefined}
      style={{ ...CELL_BASE, ...valueStyle(c), textAlign: c.align || 'left',
        /* The ring is an INSET box-shadow: a border would grow the content box,
           and an outward ring would be clipped by the wrapper's
           overflow:hidden. */
        outline: 'none',
        boxShadow: focused ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined }}>
      {children}
    </td>
  );
}
