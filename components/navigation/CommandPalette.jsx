import React, { useState, useEffect, useRef } from 'react';
/** Command palette (Cmd/Ctrl+K). Power-user accelerator: search and run actions without a mouse. */
export function CommandPalette({ open, onClose, commands = [], placeholder = 'Search for an action or project…' }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const inputRef = useRef(null);
  const filtered = commands.filter((c) => (c.label + ' ' + (c.hint || '')).toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); } }, [open]);
  useEffect(() => { setI(0); }, [q]);
  if (!open) return null;
  const run = (c) => { onClose && onClose(); c && c.onRun && c.onRun(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => Math.min(v + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => Math.max(v - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(filtered[i]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose && onClose(); }
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh', background: 'var(--scrim)', backdropFilter: 'blur(var(--scrim-blur))', WebkitBackdropFilter: 'blur(var(--scrim-blur))' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ width: 560, maxWidth: '92vw', background: 'var(--surface-card)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--color-base-300)' }}>
          <i className="ph-bold ph-magnifying-glass" style={{ color: 'var(--mute)', fontSize: 18 }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder={placeholder}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--bone)', fontFamily: 'var(--font-body)', fontSize: 15 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute)', border: '1px solid var(--color-base-300)', borderRadius: 'var(--r-xs)', padding: '2px 6px' }}>ESC</span>
        </div>
        <div style={{ maxHeight: 320, overflow: 'auto', padding: 6 }}>
          {filtered.length === 0 && <div style={{ padding: '18px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--mute)' }}>No results for "{q}".</div>}
          {filtered.map((c, idx) => (
            <button key={c.id || c.label} onMouseEnter={() => setI(idx)} onClick={() => run(c)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                background: idx === i ? 'var(--crimson-soft)' : 'transparent', color: idx === i ? 'var(--crimson)' : 'var(--bone-dim)' }}>
              {c.icon && <span style={{ fontSize: 18, display: 'inline-flex' }}>{c.icon}</span>}
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: idx === i ? 600 : 500 }}>{c.label}</span>
              {c.shortcut && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute)' }}>{c.shortcut}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
