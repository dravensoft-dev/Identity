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
      style={{ height: 'calc(var(--sp-1) * 8.5)', minWidth: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-sm)',
        color: dis ? 'var(--mute-2-disabled)' : 'var(--bone-dim)', cursor: dis ? 'not-allowed' : 'pointer', fontSize: 'var(--icon-md)' }}>
      <i className={dir < 0 ? 'ph-bold ph-caret-left' : 'ph-bold ph-caret-right'} />
    </button>
  );
  return (
    <nav aria-label="Pagination" style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', ...style }}>
      {nav(-1, page <= 1)}
      {pages(page, pageCount).map((p, i) =>
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
