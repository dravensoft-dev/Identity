import React from 'react';
import { pageWindow } from './PaginationWindow.js';

export function Pagination({ page, pageCount, ariaLabel, onChange }) {

  if (!ariaLabel?.trim()) throw new Error('Pagination: `ariaLabel` is required');
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
