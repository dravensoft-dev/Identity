import React, { useState, useRef, useEffect } from 'react';

/* Keyframes cannot be expressed in an inline style object, so they ship as a
 * <style> injected once into the head — the pattern ProgressBar establishes.
 * Only the keyframes are injected; the `animation` shorthand stays inline,
 * because the reduced-motion variant redefines the keyframes rather than
 * needing a selector. Under reduce the menu still fades in, it just stops
 * dropping. */
let injected = false;
function useMenuKeyframes() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-menu', '');
    s.textContent =
      '@keyframes arena-menu{from{opacity:0;transform:translateY(calc(var(--sp-1) * -1))}to{opacity:1;transform:none}}' +
      '@media (prefers-reduced-motion:reduce){@keyframes arena-menu{from{opacity:0}to{opacity:1}}}';
    document.head.appendChild(s);
  }, []);
}

/** Dropdown menu (actions / overflow). `trigger` is the element that opens it
 * (e.g. an IconButton with ph-dots-three). `items`: [{label, icon, shortcut,
 * destructive, disabled} | {divider:true} | {header:'Text'}]; an activated entry
 * is reported through `onSelect`, which carries the whole item. Closes with Esc
 * or an outside click. */
export function Menu({ trigger, items, align = 'start', onSelect }) {
  /* `items` is required in contracts/api/components/Menu.json, and contracts/api/README.md's
   * required-ness rule says the implementation fails hard rather than rendering
   * with a missing value. Absence only — an empty array is a caller saying "no
   * entries right now", which every other required-array guard in this layer
   * accepts. */
  if (items == null) throw new Error('Menu: `items` is required');
  useMenuKeyframes();
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
  const run = (it) => { if (it.disabled) return; setOpen(false); onSelect && onSelect(it); };
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <span onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>{trigger}</span>
      {open && (
        <div role="menu" style={{ position: 'absolute', top: 'calc(100% + calc(var(--sp-1) * 1.5))', [align === 'end' ? 'right' : 'left']: 0, zIndex: 'var(--z-dropdown)',
          minWidth: 'calc(var(--sp-1) * 50)', padding: 'calc(var(--sp-1) * 1.5)', background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', animation: 'arena-menu var(--dur-fast) var(--ease-out)' }}>
          {items.map((it, i) => {
            if (it.divider) return <div key={i} style={{ height: 'var(--bw)', background: 'var(--color-base-300)', margin: 'calc(var(--sp-1) * 1) 0' }} />;
            if (it.header) return <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)', padding: 'calc(var(--sp-1) * 2) calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 1)' }}>{it.header}</div>;
            return (
              <MenuRow key={i} item={it} onRun={() => run(it)} />
            );
          })}
        </div>
      )}
    </div>
  );
}
/* The rendered row. Named MenuRow rather than MenuItem because MenuItem is the
 * contract's name for the DATUM — this is not a compound child a consumer
 * instantiates, the way TableRow and CalendarEvent are. */
function MenuRow({ item, onRun }) {
  const [hover, setHover] = useState(false);
  const color = item.destructive ? 'var(--danger)' : 'var(--bone-dim)';
  const bg = hover && !item.disabled ? (item.destructive ? 'var(--danger-soft)' : 'var(--crimson-soft)') : 'transparent';
  return (
    <button role="menuitem" onClick={onRun} disabled={item.disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2.5)', width: '100%', textAlign: 'left', padding: 'calc(var(--sp-1) * 2) calc(var(--sp-1) * 2.5)',
        border: 'none', borderRadius: 'var(--r-sm)', cursor: item.disabled ? 'not-allowed' : 'pointer',
        background: bg, color: item.disabled ? 'var(--mute)' : (hover && !item.destructive ? 'var(--crimson)' : color),
        opacity: item.disabled ? 0.6 : 1, fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)' }}>
      {item.icon && <i className={item.icon} aria-hidden="true" style={{ fontSize: 'var(--icon-md)', display: 'inline-flex' }} />}
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.shortcut && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)' }}>{item.shortcut}</span>}
    </button>
  );
}
