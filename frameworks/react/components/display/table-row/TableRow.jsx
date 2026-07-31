import React from 'react';

export function TableRow({
  children, onClick, interactive = false, disabled = false,
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

  const activate = interactive && onClick && !disabled ? onClick : undefined;
  const cursor = interactive ? (disabled ? 'not-allowed' : 'pointer') : 'default';

  if (layout === 'card') {
    return (
      <div onClick={activate}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={interactive && disabled ? 'true' : undefined}
        onKeyDown={activate ? (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          activate();
        } : undefined}
        style={{ background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
          borderRadius: 'var(--r-lg)', padding: 'var(--dz-row-px)',
          display: 'flex', flexDirection: 'column', gap: 'var(--dz-stack)',
          cursor }}>
        {cells}
      </div>
    );
  }

  return (
    <tr role="row" onClick={activate}
      aria-disabled={onClick && disabled ? 'true' : undefined}

      style={{ borderTop: rowIndex <= 1 ? 'none' : 'var(--bw) solid var(--color-base-300)',
        cursor,
        transition: 'background var(--dur-fast) var(--ease-out)' }}
      onMouseEnter={activate ? (e) => (e.currentTarget.style.background = 'var(--color-base-300)') : undefined}
      onMouseLeave={activate ? (e) => (e.currentTarget.style.background = 'transparent') : undefined}>
      {cells}
    </tr>
  );
}
