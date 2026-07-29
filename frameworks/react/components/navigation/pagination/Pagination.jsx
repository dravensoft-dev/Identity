import React from 'react';
import { pageWindow } from './PaginationWindow.js';
/** Navigation between pages of a large set (tables, lists). Numbers in mono;
 * active page in crimson. `ariaLabel` names the landmark — two paginated tables
 * on one page need two names. For infinite scroll or "load more" don't use
 * Pagination. */
export function Pagination({ page, pageCount, ariaLabel = 'Pagination', onChange }) {
  /* `page` and `pageCount` are required in api/components/Pagination.json, and
   * api/README.md's required-ness rule says the implementation fails hard rather
   * than rendering with a missing value. Neither had a sensible default to keep:
   * the old `pageCount = 1` drew a one-page control over a set of unknown size,
   * and the old `page = 1` claimed the caller was on the first one. Absence only,
   * `== null` rather than `!page`, on Dialog.jsx's precedent for `open` — a
   * caller passing 0 is passing a value this component will reject on its own
   * terms, not omitting one, and required-ness is about omission. */
  if (page == null) throw new Error('Pagination: `page` is required');
  if (pageCount == null) throw new Error('Pagination: `pageCount` is required');
  const go = (p) => { if (p >= 1 && p <= pageCount && p !== page) onChange && onChange(p); };
  const nav = (dir, dis) => (
    <button onClick={() => go(page + dir)} disabled={dis} aria-label={dir < 0 ? 'Previous' : 'Next'}
      style={{ height: 'calc(var(--sp-1) * 8.5)', minWidth: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-sm)',
        color: dis ? 'var(--mute-2-disabled)' : 'var(--bone-dim)', cursor: dis ? 'not-allowed' : 'pointer', fontSize: 'var(--icon-md)' }}>
      <i className={dir < 0 ? 'ph-bold ph-caret-left' : 'ph-bold ph-caret-right'} />
    </button>
  );
  return (
    <nav aria-label={ariaLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)' }}>
      {nav(-1, page <= 1)}
      {pageWindow(page, pageCount).map((p, i) =>
        p === '…'
          ? <span key={'e' + i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)', padding: '0 calc(var(--sp-1) * 1)' }}>…</span>
          : (
            <button key={p} onClick={() => go(p)} aria-current={p === page ? 'page' : undefined}
              style={{ height: 'calc(var(--sp-1) * 8.5)', minWidth: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 2)', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', fontWeight: 'var(--fw-bold)',
                background: p === page ? 'var(--crimson)' : 'transparent',
                border: 'var(--bw) solid ' + (p === page ? 'var(--crimson)' : 'var(--color-base-300)'),
                color: p === page ? 'var(--on-accent)' : 'var(--bone-dim)' }}>{p}</button>
          ))}
      {nav(1, page >= pageCount)}
    </nav>
  );
}
