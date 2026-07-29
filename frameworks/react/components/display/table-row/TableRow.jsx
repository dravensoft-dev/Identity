import React from 'react';

export function TableRow({
  children, onClick,
  rowIndex = 0, columns = [], layout = 'table', cursorCol = null, gridFocused = false, onCellFocus,
}) {

  const cells = React.Children.toArray(children).map((child, ci) => (
    React.isValidElement(child)
      ? React.cloneElement(child, {
        column: columns[ci],
        layout,

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

      style={{ borderTop: rowIndex <= 1 ? 'none' : 'var(--bw) solid var(--color-base-300)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background var(--dur-fast) var(--ease-out)' }}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.background = 'var(--panel)') : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.background = 'transparent') : undefined}>
      {cells}
    </tr>
  );
}
