import React, { useState } from 'react';
export function Tabs({ tabs = [], value, defaultValue, onChange, style }) {
  const [internal, setInternal] = useState(defaultValue ?? (tabs[0] && (tabs[0].value ?? tabs[0])));
  const active = value ?? internal;
  const select = (v) => { setInternal(v); onChange && onChange(v); };
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-base-300)', ...style }}>
      {tabs.map((t) => {
        const v = t.value ?? t; const label = t.label ?? t; const on = v === active;
        return (
          <button key={v} onClick={() => select(v)}
            style={{ position: 'relative', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: on ? 600 : 500, fontSize: 'var(--dz-text)',
              color: on ? 'var(--bone)' : 'var(--mute)',
              boxShadow: on ? 'inset 0 -2px 0 var(--crimson)' : 'none',
              transition: 'color var(--dur-fast) var(--ease-out)' }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
