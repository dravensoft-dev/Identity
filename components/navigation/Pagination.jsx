import React from 'react';
function pages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const from = Math.max(2, current - 1), to = Math.min(total - 1, current + 1);
  if (from > 2) out.push('…');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
}
/** Navigation between pages of a large set (tables, lists). Numbers in mono;
 * active page in crimson. For infinite scroll or "load more" don't use Pagination. */
export function Pagination({ page = 1, pageCount = 1, onChange, style }) {
  const go = (p) => { if (p >= 1 && p <= pageCount && p !== page) onChange && onChange(p); };
  const nav = (dir, dis) => (
    <button onClick={() => go(page + dir)} disabled={dis} aria-label={dir < 0 ? 'Previous' : 'Next'}
      style={{ height: 34, minWidth: 34, padding: '0 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)',
        color: dis ? 'var(--mute-2-disabled)' : 'var(--bone-dim)', cursor: dis ? 'not-allowed' : 'pointer', fontSize: 16 }}>
      <i className={dir < 0 ? 'ph-bold ph-caret-left' : 'ph-bold ph-caret-right'} />
    </button>
  );
  return (
    <nav aria-label="Pagination" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      {nav(-1, page <= 1)}
      {pages(page, pageCount).map((p, i) =>
        p === '…'
          ? <span key={'e' + i} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--mute)', padding: '0 4px' }}>…</span>
          : (
            <button key={p} onClick={() => go(p)} aria-current={p === page ? 'page' : undefined}
              style={{ height: 34, minWidth: 34, padding: '0 8px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                background: p === page ? 'var(--crimson)' : 'transparent',
                border: '1px solid ' + (p === page ? 'var(--crimson)' : 'var(--line)'),
                color: p === page ? 'var(--on-accent)' : 'var(--bone-dim)' }}>{p}</button>
          ))}
      {nav(1, page >= pageCount)}
    </nav>
  );
}
