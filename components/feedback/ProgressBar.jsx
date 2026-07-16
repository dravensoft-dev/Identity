import React, { useEffect } from 'react';

/** Progress bar (H1). Prefer *determinate* mode (`value` 0–100) for measurable
 * processes —deployments, uploads, migrations— and reserve `indeterminate` for waits with
 * no known percentage. `tone` aligns the color with the state (accent by default). */
let injected = false;
function useIndeterminate() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-progress', '');
    s.textContent =
      '@keyframes arena-prog{0%{left:-40%}100%{left:100%}}' +
      '.arena-prog-ind::after{content:"";position:absolute;top:0;bottom:0;width:40%;border-radius:inherit;background:currentColor;animation:arena-prog 1.15s var(--ease-in-out) infinite}' +
      '@media (prefers-reduced-motion:reduce){.arena-prog-ind::after{animation-duration:2.4s}}';
    document.head.appendChild(s);
  }, []);
}
const TONES = { accent: 'var(--crimson)', gold: 'var(--gold)', success: 'var(--success)', danger: 'var(--danger)', info: 'var(--info)' };

export function ProgressBar({ value = 0, indeterminate = false, tone = 'accent', label, showValue = true, size = 'md', style }) {
  useIndeterminate();
  const color = TONES[tone] || TONES.accent;
  const h = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div style={{ width: '100%', ...style }}>
      {(label || (showValue && !indeterminate)) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
          {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--bone-dim)' }}>{label}</span>}
          {showValue && !indeterminate && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mute)' }}>{pct}%</span>}
        </div>
      )}
      <div role="progressbar" aria-valuenow={indeterminate ? undefined : pct} aria-valuemin={0} aria-valuemax={100} aria-label={typeof label === 'string' ? label : 'Progress'}
        className={indeterminate ? 'arena-prog-ind' : undefined}
        style={{ position: 'relative', height: h, borderRadius: 'var(--r-pill)', background: 'var(--line)', overflow: 'hidden', color }}>
        {!indeterminate && (
          <span style={{ position: 'absolute', inset: 0, width: pct + '%', background: color, borderRadius: 'inherit', transition: 'width var(--dur-mid) var(--ease-out)' }} />
        )}
      </div>
    </div>
  );
}
