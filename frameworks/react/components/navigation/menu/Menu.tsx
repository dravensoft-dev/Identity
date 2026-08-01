import React, { useState, useRef, useEffect } from 'react';

import type { MenuItem, MenuAlign } from '../../../Api.generated';

export type { MenuItem };

export interface MenuProps {

  trigger: React.ReactNode;

  items: MenuItem[];

  align?: MenuAlign;

  onSelect?: (item: MenuItem) => void;
}


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

export function Menu({ trigger, items, align = 'start', onSelect }: MenuProps) {

  if (items == null) throw new Error('Menu: `items` is required');
  if (!React.isValidElement(trigger) || trigger.type === React.Fragment) {
    throw new Error(
      'Menu: `trigger` must be a single element that forwards props to its focusable control. '
      + 'A fragment or a bare string takes aria-haspopup and aria-expanded nowhere.',
    );
  }
  useMenuKeyframes();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const triggerEl = (): HTMLElement | null =>
    (ref.current?.firstElementChild instanceof HTMLElement ? ref.current.firstElementChild : null);
  const close = (restoreFocus: boolean) => {
    setOpen(false);
    const el = triggerEl();
    if (restoreFocus && el) el.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
    if (first) first.focus();
  }, [open]);

  const run = (it: MenuItem) => { if (it.disabled) return; close(true); onSelect && onSelect(it); };

  useEffect(() => {
    const el = triggerEl();
    if (!el) return;
    el.setAttribute('aria-haspopup', 'menu');
    el.setAttribute('aria-expanded', String(open));
  }, [open]);

  const decoratedTrigger = React.cloneElement(trigger, {
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: (e: React.MouseEvent) => {
      const own = (trigger.props as { onClick?: (event: React.MouseEvent) => void }).onClick;
      if (own) own(e);
      setOpen((v) => !v);
    },
  });

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {decoratedTrigger}
      {open && (
        <div role="menu" ref={panelRef} style={{ position: 'absolute', top: 'calc(100% + calc(var(--sp-1) * 1.5))', [align === 'end' ? 'right' : 'left']: 0, zIndex: 'var(--z-dropdown)',
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

function MenuRow({ item, onRun }: { item: MenuItem; onRun: () => void }) {
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
