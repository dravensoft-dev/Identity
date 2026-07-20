import React from 'react';

/* The mark's slot and the wordmark's size are one decision, so one `size`
 * picks both -- see AppLogo.prompt.md. The consumer's mark node carries no
 * dimensions of its own; this component sizes the slot and stretches the node
 * to fill it, because a mark with its own width and a size prop would fight,
 * and which one won would decide how the mark sat against the wordmark -- the
 * one relationship a lock-up exists to hold. */
const MARK = { sm: 'var(--logo-mark-sm)', md: 'var(--logo-mark-md)', lg: 'var(--logo-mark-lg)', xl: 'var(--logo-mark-xl)' };
const TEXT = { sm: 'var(--logo-text-sm)', md: 'var(--logo-text-md)', lg: 'var(--logo-text-lg)', xl: 'var(--logo-text-xl)' };

/** Brand lock-up: a mark beside (horizontal) or above (vertical) a product
 *  name. `mark` and `name` are required and nothing stands in for them. */
export function AppLogo({ size = 'md', orientation = 'horizontal', mark, name, dim, style, ...rest }) {
  if (!mark || !name) return null;
  const vertical = orientation === 'vertical';
  const markSize = MARK[size] || MARK.md;
  const textSize = TEXT[size] || TEXT.md;
  const fill = React.isValidElement(mark)
    ? React.cloneElement(mark, { style: { display: 'block', width: '100%', height: '100%', ...mark.props.style } })
    : mark;
  return (
    <span style={{ display: 'inline-flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center',
      gap: vertical ? 'calc(var(--sp-1) * 3)' : 'calc(var(--sp-1) * 2.5)', ...style }} {...rest}>
      <span style={{ display: 'inline-flex', flex: 'none', width: markSize, height: markSize }}>{fill}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: textSize,
        letterSpacing: 'var(--ls-tight)', textTransform: 'uppercase', color: 'var(--bone)' }}>
        {name}{dim && <span style={{ color: 'var(--mute)' }}>{dim}</span>}
      </span>
    </span>
  );
}
