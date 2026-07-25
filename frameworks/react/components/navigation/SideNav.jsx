import React from 'react';

/** Vertical navigation list. The product owns the frame; this owns the list —
 *  see the Non-goals in the source spec for why there is no AppShell.
 *  `items`: [{id, label, icon, href}]; an activated item is reported through
 *  `onNav`, which carries the whole item. */
export function SideNav({ items, active, ariaLabel, onNav }) {
  /* Both are required in api/components/SideNav.json, and api/README.md's
   * required-ness rule says the implementation fails hard rather than rendering
   * with a missing value. Absence only — `== null` rather than `!items`, on
   * Dialog.jsx's precedent for `open` and Pagination.jsx's for `page` — because
   * an empty array is a caller saying "no destinations right now" and not an
   * omission. `ariaLabel` is guarded rather than defaulted because the constant
   * default was itself the defect: the navigation pattern asks each landmark on
   * a page for a UNIQUE name, two sidebars sharing one are indistinguishable,
   * and nothing can derive what a nav is for. */
  if (items == null) throw new Error('SideNav: `items` is required');
  if (ariaLabel == null) throw new Error('SideNav: `ariaLabel` is required');
  return (
    <nav aria-label={ariaLabel}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      {items.map((item) => {
        const on = item.id === active;
        /* One style object for both elements: an anchor and a button must be
         * indistinguishable here, and two copies of this would drift. */
        const shared = {
          'aria-current': on ? 'page' : undefined,
          /* The item alone travels. A platform event is an R4 violation inside a
           * payload, so the click never reaches the listener and its
           * `preventDefault()` is not callable from here: the anchor's own
           * navigation always fires, and substituting SPA routing for a plain
           * click belongs at the router. */
          onClick: () => onNav && onNav(item),
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
        /* Arena draws the glyph and the consumer names it — the single-icon
         * convention, which now reaches every per-item icon in the library. */
        const glyph = item.icon
          ? <i className={item.icon} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }} />
          : null;
        return item.href
          ? <a key={item.id} href={item.href} {...shared}>{glyph}{item.label}</a>
          : <button key={item.id} type="button" {...shared}>{glyph}{item.label}</button>;
      })}
    </nav>
  );
}
