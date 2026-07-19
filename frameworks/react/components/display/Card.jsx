import React from 'react';
export function Card({ children, title, eyebrow, action, floating = false, accent = false, style, ...rest }) {
  return (
    <div style={{ background: 'var(--surface-card)',
      border: 'var(--bw) solid ' + (accent ? 'var(--crimson)' : 'var(--color-base-300)'),
      borderRadius: 'var(--r-lg)', boxShadow: floating ? 'var(--shadow-2)' : 'none',
      overflow: 'hidden', ...style }} {...rest}>
      {(title || eyebrow || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px 0' }}>
          <div>
            {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 6 }}>{eyebrow}</div>}
            {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 18, color: 'var(--bone)' }}>{title}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}
