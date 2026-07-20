import React from 'react';
import { Card } from './Card.jsx';

/** The panel every signed-out screen needs — sign in, check your
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
    // The panel this replaced put its width, its padding and its border on one
    // content-box element, so reproducing its rendered width means adding the three
    // back together: 95 steps of content, 18 steps of padding (9 on each side) and
    // both 1px borders — 380px + 72px + 2px = 454px, the width this panel has
    // always rendered at. A single `* 95` here silently narrows the panel again.
    <div style={{ width: '100%', maxWidth: 'calc(var(--sp-1) * 95 + var(--sp-1) * 18 + var(--bw) * 2)', ...style }} {...rest}>
      <Card style={{ boxShadow: 'var(--shadow-3)' }}>
        <div style={{ padding: 'calc(var(--sp-1) * 4)' }}>
          {/* flex, not the default block: AppLogo's root is inline-flex, and a block
              wrapper around an inline-flex child opens a line box whose strut adds
              descender space below it — space that would vary with the inherited font
              rather than with anything the designer chose. (Second time this bug has
              shown up in this plan; this comment is what stops a third.) */}
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
