import React, { useEffect } from 'react';

/** Loading placeholder for asynchronous data (H1). Reserves the space for the real
 * content —tables, dashboards, cards— with a warm sweep instead of a blank jump.
 * variant: 'text' | 'line' | 'block' | 'circle'. `lines` repeats a stack of text lines. */
let injected = false;
function useShimmer() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-skeleton', '');
    s.textContent =
      '@keyframes arena-shimmer{0%{background-position:-140% 0}100%{background-position:140% 0}}' +
      '.arena-skeleton{background-image:linear-gradient(100deg,var(--panel) 30%,var(--panel-2) 50%,var(--panel) 70%);' +
      'background-size:220% 100%;animation:arena-shimmer 1.4s var(--ease-in-out) infinite}' +
      '@media (prefers-reduced-motion:reduce){.arena-skeleton{animation:none;background:var(--panel)}}';
    document.head.appendChild(s);
  }, []);
}

export function Skeleton({ variant = 'block', width, height, lines = 3, radius, style }) {
  useShimmer();
  const base = { borderRadius: radius || 'var(--r-sm)' };
  if (variant === 'circle') {
    const d = height || width || 40;
    return <div className="arena-skeleton" aria-hidden="true" style={{ width: d, height: d, borderRadius: '50%', ...style }} />;
  }
  if (variant === 'text' || variant === 'line') {
    if (variant === 'text' && lines > 1) {
      return (
        <div role="status" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: 10, width: width || '100%', ...style }}>
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="arena-skeleton" style={{ height: 12, borderRadius: 'var(--r-xs)', width: i === lines - 1 ? '62%' : '100%' }} />
          ))}
        </div>
      );
    }
    return <div className="arena-skeleton" role="status" aria-label="Loading" style={{ height: height || 12, width: width || '100%', borderRadius: 'var(--r-xs)', ...style }} />;
  }
  return <div className="arena-skeleton" role="status" aria-label="Loading" style={{ width: width || '100%', height: height || 96, ...base, ...style }} />;
}
