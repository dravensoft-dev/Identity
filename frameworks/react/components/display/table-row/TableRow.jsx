import React from 'react';

/** One row of a `Table`. Write one per row, with one `TableCell` inside it per
 * cell. It never stands alone in any useful way, because everything about WHERE
 * it sits — its row index in the grid, the columns its cells are set against,
 * which of its cells holds the roving tab stop — is the table's to decide.
 *
 * THE DIVISION OF LABOUR, the same one `Calendar`/`CalendarEvent` draws:
 * `Table` owns the grid, the header, the cursor and the keyboard; `TableRow`
 * owns what a row IS — the `<tr>` or the card, its hairline, its hover, its
 * activation. Neither reaches into the other.
 *
 * `rowIndex`, `columns`, `layout`, `cursorCol`, `gridFocused` and `onCellFocus`
 * are INJECTED by `Table` through `cloneElement` and are not part of this
 * component's public API — the same shape, and for the same reason, as
 * `RadioGroup` injecting `name`/`checked`/`onSelect` into each `Radio`. A
 * consumer never writes one of them; they write `onClick`, their cells, and a
 * `key`.
 *
 * THE KEY IS REACT'S, NOT ARENA'S. `Table` used to carry a `getRowKey` member
 * whose only job was to compute React's reconciliation key. Under this shape the
 * consumer writes `<TableRow key={…}>` directly, which is React's own mechanism
 * and no member of any contract — exactly how `Calendar`'s events work. */
export function TableRow({
  children, onClick,
  rowIndex = 0, columns = [], layout = 'table', cursorCol = null, gridFocused = false, onCellFocus,
}) {
  /* `toArray` rather than `Children.map`, and `Table` counts the same way: it
     drops null/undefined/booleans and flattens arrays, so the index a cell is
     given here is the index `Table`'s row-length model counted. A conditional
     cell (`{cond && <TableCell/>}`) would otherwise be counted by one side and
     skipped by the other, and the cursor would clamp against a cell that is not
     drawn. */
  const cells = React.Children.toArray(children).map((child, ci) => (
    React.isValidElement(child)
      ? React.cloneElement(child, {
        column: columns[ci],
        layout,
        /* The wide layout's roving tab stop. In card mode there is none: a card
           is a list item, and the surviving `focus.roving` exception on
           Table.behaviour.json is exactly this. */
        tabIndex: layout === 'card' ? undefined : (ci === cursorCol ? 0 : -1),
        focused: layout !== 'card' && ci === cursorCol && gridFocused,
        onCellFocus: layout === 'card' || !onCellFocus ? undefined : () => onCellFocus(rowIndex, ci),
      })
      : child
  ));

  if (layout === 'card') {
    return (
      <div onClick={onClick}
        style={{ background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
          borderRadius: 'var(--r-lg)', padding: 'var(--dz-row-px)',
          display: 'flex', flexDirection: 'column', gap: 'var(--dz-stack)',
          cursor: onClick ? 'pointer' : 'default' }}>
        {cells}
      </div>
    );
  }

  return (
    <tr role="row" onClick={onClick}
      /* Row 1 is the first BODY row and takes no top hairline — the header row
         below it already drew one. */
      style={{ borderTop: rowIndex <= 1 ? 'none' : 'var(--bw) solid var(--color-base-300)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background var(--dur-fast) var(--ease-out)' }}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.background = 'var(--panel)') : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.background = 'transparent') : undefined}>
      {cells}
    </tr>
  );
}
