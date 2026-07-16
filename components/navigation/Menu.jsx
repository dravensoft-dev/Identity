import React, { useState, useRef, useEffect } from 'react';
/** Dropdown menu (actions / overflow). `trigger` is the element that opens it
 * (e.g. an IconButton with ph-dots-three). `items`: [{label, icon, onClick, shortcut,
 * destructive, disabled} | {divider:true} | {header:'Text'}]. Closes with Esc or an outside click. */
export function Menu({ trigger, items = [], align = 'start', style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const run = (it) => { if (it.disabled) return; setOpen(false); it.onClick && it.onClick(); };
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', ...style }}>
      <span onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>{trigger}</span>
      {open && (
        <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', [align === 'end' ? 'right' : 'left']: 0, zIndex: 900,
          minWidth: 200, padding: 6, background: 'var(--surface-card)', border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', animation: 'arena-menu var(--dur-fast) var(--ease-out)' }}>
          {items.map((it, i) => {
            if (it.divider) return <div key={i} style={{ height: 1, background: 'var(--line)', margin: '5px 0' }} />;
            if (it.header) return <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--mute)', padding: '8px 10px 4px' }}>{it.header}</div>;
            return (
              <MenuItem key={i} item={it} onRun={() => run(it)} />
            );
          })}
          <style>{'@keyframes arena-menu{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}'}</style>
        </div>
      )}
    </div>
  );
}
function MenuItem({ item, onRun }) {
  const [hover, setHover] = useState(false);
  const color = item.destructive ? 'var(--danger)' : 'var(--bone-dim)';
  const bg = hover && !item.disabled ? (item.destructive ? 'var(--danger-soft)' : 'var(--crimson-soft)') : 'transparent';
  return (
    <button role="menuitem" onClick={onRun} disabled={item.disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 10px',
        border: 'none', borderRadius: 'var(--r-sm)', cursor: item.disabled ? 'not-allowed' : 'pointer',
        background: bg, color: item.disabled ? 'var(--mute)' : (hover && !item.destructive ? 'var(--crimson)' : color),
        opacity: item.disabled ? 0.6 : 1, fontFamily: 'var(--font-body)', fontSize: 14 }}>
      {item.icon && <span style={{ fontSize: 17, display: 'inline-flex' }}>{item.icon}</span>}
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.shortcut && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute)' }}>{item.shortcut}</span>}
    </button>
  );
}
