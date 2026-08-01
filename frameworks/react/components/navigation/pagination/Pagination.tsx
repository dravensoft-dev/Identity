import React from 'react';
import { pageWindow } from './PaginationWindow.ts';

export interface PaginationProps {

  /** The current page, 1-based. */
  page: number;

  /** How many pages there are. Required, and guarded at runtime: a Pagination with no page count renders a window over nothing. */
  pageCount: number;

  /** Names this navigation landmark. Required, and guarded at runtime: two paginated tables in one dashboard is a routine layout, and a shared constant name leaves them indistinguishable while satisfying the requirement mechanically. It was optional with a "Pagination" default for one batch, which narrowed the gap rather than closing it — a name the caller omits is still the constant. Say what is being paged — "Deployments", not "Pages". */
  ariaLabel: string;

  /** A page was chosen; carries the new 1-based page. Never fires for the current page, nor for a page outside 1..pageCount. */
  onChange?: (page: number) => void;
}


export function Pagination({ page, pageCount, ariaLabel, onChange }: PaginationProps) {

  if (!ariaLabel?.trim()) throw new Error('Pagination: `ariaLabel` is required');
  if (page == null) throw new Error('Pagination: `page` is required');
  if (pageCount == null) throw new Error('Pagination: `pageCount` is required');
  const go = (p: number) => { if (p >= 1 && p <= pageCount && p !== page) onChange && onChange(p); };
  const nav = (dir: number, dis: boolean) => (
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
            <button key={p} onClick={() => go(Number(p))} aria-current={p === page ? 'page' : undefined}
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
