import React from 'react';
/** Single selection. `RadioGroup` governs the value; each `Radio` is an option.
 * Use Radio when the options are mutually exclusive and it's good to see them
 * all; for many options, use Select. */
export function RadioGroup({ value, onChange, name, children }) {
  const gname = name || 'rg-' + Math.random().toString(36).slice(2, 7);
  const items = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { name: gname, checked: child.props.value === value, onSelect: onChange })
      : child);
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 3)' }}>
      {items}
    </div>
  );
}
