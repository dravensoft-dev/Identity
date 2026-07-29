import React from 'react';

export function RadioGroup({ value, onChange, name, ariaLabel, children }) {
  if (!ariaLabel) throw new Error('RadioGroup: `ariaLabel` is required');
  const gname = name || 'rg-' + Math.random().toString(36).slice(2, 7);
  const items = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { name: gname, checked: child.props.value === value, onSelect: onChange })
      : child);
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 3)' }}>
      {items}
    </div>
  );
}
