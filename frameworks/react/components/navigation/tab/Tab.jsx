import React, { useState } from 'react';

export function Tab({
  value, label,
  selected = false, tabStop = false, tabId, panelId, onSelect,
}) {

  if (!value) throw new Error('Tab: `value` is required');
  if (!label) throw new Error('Tab: `label` is required');
  const [focus, setFocus] = useState(false);
  return (
    <button type="button" role="tab" id={tabId}
      aria-selected={selected} aria-controls={panelId}

      tabIndex={tabStop ? 0 : -1}
      onClick={() => onSelect && onSelect(value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        position: 'relative',
        padding: 'calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 4)',
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: selected ? 'var(--fw-semibold)' : 'var(--fw-medium)',
        fontSize: 'var(--dz-text)',
        color: selected ? 'var(--bone)' : 'var(--mute)',

        boxShadow: selected
          ? (focus
            ? '0 0 0 var(--focus-width) var(--gold-soft), inset 0 calc(var(--bw-strong) * -1) 0 var(--crimson)'
            : 'inset 0 calc(var(--bw-strong) * -1) 0 var(--crimson)')
          : (focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none'),
        transition: 'color var(--dur-fast) var(--ease-out)',
      }}>
      {label}
    </button>
  );
}
