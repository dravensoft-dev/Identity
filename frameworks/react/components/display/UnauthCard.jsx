import React from 'react';
import { Card } from './Card.jsx';

/** The centred panel every signed-out screen needs — sign in, check your
 *  inbox, this link expired, enter your code. It knows nothing about
 *  credentials: fields are composed from Input and Button.
 *
 *  It does NOT centre itself. The product owns the page, so a split layout
 *  beside an illustration and a panel inside a modal both stay possible; the
 *  three-line centring wrapper is documented in UnauthCard.prompt.md.
 *
 *  Card supplies the panel surface rather than a second definition of one.
 *  Card pads its content at calc(var(--sp-1) * 5) and exposes no padding prop,
 *  so the extra generosity a single-task panel wants is one wrapper inside it:
 *  20px + 16px = the 36px this figure has always had. */
export function UnauthCard({ brand, eyebrow, title, footer, children, style, ...rest }) {
  return (
    <div style={{ width: '100%', maxWidth: 'calc(var(--sp-1) * 95)', ...style }} {...rest}>
      <Card style={{ boxShadow: 'var(--shadow-3)' }}>
        <div style={{ padding: 'calc(var(--sp-1) * 4)' }}>
          {brand && <div style={{ marginBottom: 'calc(var(--sp-1) * 7)' }}>{brand}</div>}
          {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 1.5)' }}>{eyebrow}</div>}
          {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)', color: 'var(--bone)', marginBottom: 'calc(var(--sp-1) * 6)' }}>{title}</div>}
          {children}
          {footer && <div style={{ marginTop: 'calc(var(--sp-1) * 5)', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>{footer}</div>}
        </div>
      </Card>
    </div>
  );
}
