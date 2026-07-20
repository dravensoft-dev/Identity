import React from 'react';

/** Vertical navigation list. The product owns the frame; this owns the list —
 *  see the Non-goals in the source spec for why there is no AppShell. */
export function SideNav({ items = [], active, onNav, ariaLabel = 'Primary', style, ...rest }) {
  return (
    <nav aria-label={ariaLabel}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', ...style }} {...rest}>
      {items.map((item) => {
        const on = item.id === active;
        /* One style object for both elements: an anchor and a button must be
         * indistinguishable here, and two copies of this would drift. */
        const shared = {
          'aria-current': on ? 'page' : undefined,
          /* The event goes through: an anchor's default is a real navigation, and
           * only the consumer knows whether to suppress it and route in place. */
          onClick: (event) => onNav && onNav(item.id, event),
          style: {
            display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
            padding: 'calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 3)', borderRadius: 'var(--r-sm)',
            background: on ? 'var(--crimson-soft)' : 'transparent',
            color: on ? 'var(--crimson)' : 'var(--mute)',
            border: 'none', cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
            fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)',
            fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
          },
        };
        return item.href
          ? <a key={item.id} href={item.href} {...shared}>{item.icon}{item.label}</a>
          : <button key={item.id} type="button" {...shared}>{item.icon}{item.label}</button>;
      })}
    </nav>
  );
}
