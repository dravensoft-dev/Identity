import React from 'react';

import type { LogoSize, Orientation } from '../../../Api.generated';

export interface AppLogoProps {

  /** Both halves at once — the mark's slot and the wordmark. */
  size?: LogoSize;
  /** Mark beside the name, or above it. */
  orientation?: Orientation;

  /** The mark, as an asset the consumer supplies. Required: Arena ships MIT and a default would ship Dravensoft's trademark to whoever never read the API. The slot sizes the mark; a mark that brings its own dimensions fights the lock-up. */
  mark: React.ReactNode;

  /** The product name, or its first half when `dim` carries the second. */
  name: string;

  /** The wordmark's second half, drawn muted. Present for the manual's Primary variant, absent for Monochrome — which is why there is no `variant` member: the mark's ink and this are the same two decisions. */
  dim?: string;
}


const MARK = { sm: 'var(--logo-mark-sm)', md: 'var(--logo-mark-md)', lg: 'var(--logo-mark-lg)', xl: 'var(--logo-mark-xl)' };
const TEXT = { sm: 'var(--logo-text-sm)', md: 'var(--logo-text-md)', lg: 'var(--logo-text-lg)', xl: 'var(--logo-text-xl)' };

export function AppLogo({ size = 'md', orientation = 'horizontal', mark, name, dim }: AppLogoProps) {
  if (!mark || !name) throw new Error('AppLogo: `mark` and `name` are required');
  const vertical = orientation === 'vertical';
  const markSize = MARK[size] || MARK.md;
  const textSize = TEXT[size] || TEXT.md;
  const fill = React.isValidElement(mark)
    ? React.cloneElement(mark, { style: { display: 'block', width: '100%', height: '100%', ...mark.props.style } })
    : mark;
  return (
    <span style={{ display: 'inline-flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center',
      gap: vertical ? 'calc(var(--sp-1) * 3)' : 'calc(var(--sp-1) * 2.5)' }}>
      <span style={{ display: 'inline-flex', flex: 'none', width: markSize, height: markSize }}>{fill}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: textSize,
        letterSpacing: 'var(--ls-tight)', textTransform: 'uppercase', color: 'var(--bone)' }}>
        {name}{dim && <span style={{ color: 'var(--mute)' }}>{dim}</span>}
      </span>
    </span>
  );
}
