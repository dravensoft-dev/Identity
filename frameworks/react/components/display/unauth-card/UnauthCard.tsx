import React from 'react';
import { Card } from '../card/Card.tsx';

export interface UnauthCardProps {

  brand?: React.ReactNode;

  eyebrow?: string;

  title?: string;

  footer?: React.ReactNode;

  children?: React.ReactNode;
}


export function UnauthCard({ brand, eyebrow, title, footer, children }: UnauthCardProps) {
  return (

    <div style={{ width: '100%', maxWidth: 'calc(var(--sp-1) * 95 + var(--sp-1) * 18 + var(--bw) * 2)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)' }}>
      <Card>
        <div style={{ padding: 'calc(var(--sp-1) * 4)' }}>
          {

}
          {brand && <div style={{ display: 'flex', marginBottom: 'calc(var(--sp-1) * 7)' }}>{brand}</div>}
          {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 1.5)' }}>{eyebrow}</div>}
          {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)', color: 'var(--bone)', marginBottom: 'calc(var(--sp-1) * 6)' }}>{title}</div>}
          {children}
          {footer && <div style={{ marginTop: 'calc(var(--sp-1) * 5)', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>{footer}</div>}
        </div>
      </Card>
    </div>
  );
}
