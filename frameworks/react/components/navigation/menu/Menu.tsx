import React, { useState, useRef, useEffect } from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './Menu.manifest.generated.ts';

import type { MenuItem, MenuAlign } from '../../../Api.generated';

export type { MenuItem };

export interface MenuProps {

  /** The element that opens the menu. The consumer draws it -- an IconButton with ph-dots-three-vertical, a secondary Button -- so it is a slot, and it carries its own accessible name. */
  trigger: React.ReactNode;

  /** The entries, in order: activatable rows, dividers and group headers. */
  items: MenuItem[];

  /** Which edge of the trigger the panel lines up with. */
  align?: MenuAlign;

  /** An entry was activated; carries the whole item. A disabled entry reports nothing, and a divider or a header cannot be activated at all. */
  onSelect?: (item: MenuItem) => void;
}


const menuStyles = tv(manifest);

export function Menu({ trigger, items, align = 'start', onSelect }: MenuProps) {

  if (items == null) throw new Error('Menu: `items` is required');
  if (!React.isValidElement(trigger) || trigger.type === React.Fragment) {
    throw new Error(
      'Menu: `trigger` must be a single element that forwards props to its focusable control. '
      + 'A fragment or a bare string takes aria-haspopup and aria-expanded nowhere.',
    );
  }
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

  const styles = menuStyles();

  return (
    <div ref={ref} className={styles.root()}>
      {decoratedTrigger}
      {open && (
        <div role="menu" ref={panelRef}
          className={align === 'end' ? `${styles.panel()} ${styles.panelEnd()}` : styles.panel()}>
          {items.map((it, i) => {
            if (it.divider) return <div key={i} className={styles.divider()} />;
            if (it.header) return <div key={i} className={styles.header()}>{it.header}</div>;
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
  const styles = menuStyles();
  const state = item.disabled
    ? styles.itemDisabled()
    : item.destructive ? styles.itemDestructive() : styles.itemDefault();
  return (
    <button role="menuitem" onClick={onRun} disabled={item.disabled}
      className={`${styles.item()} ${state}`}>
      {item.icon && <i className={`${item.icon} ${styles.icon()}`} aria-hidden="true" />}
      <span className={styles.label()}>{item.label}</span>
      {item.shortcut && <span className={styles.shortcut()}>{item.shortcut}</span>}
    </button>
  );
}
