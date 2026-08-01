import React, { useEffect } from 'react';
import { srOnly } from '../../../DataVisuals.ts';

import type { ControlSize, ProgressTone } from '../../../Api.generated';

export interface ProgressBarProps {

  /** How far along, 0-100. Clamped and rounded. Ignored when `indeterminate`. */
  progressPercentage?: number;

  /** A wait with no percentage; the bar sweeps instead of filling. */
  indeterminate?: boolean;

  /** The bar's colour. */
  tone?: ProgressTone;

  /** Names what is progressing. Drawn above the bar, and it is the bar's accessible name. Required and guarded rather than defaulted: nothing can derive what is progressing, and a fallback of "Progress" satisfies roles.label mechanically while telling a screen-reader user only what the component is -- two of them on one page announce identically. */
  label: string;

  /** Shows the percentage beside the label. Determinate only. */
  showPercentage?: boolean;

  /** The bar's thickness. */
  size?: ControlSize;
}


let injected = false;
function useIndeterminate() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-progress', '');
    s.textContent =
      '@keyframes arena-prog{0%{left:-40%}100%{left:100%}}' +
      '.arena-prog-ind::after{content:"";position:absolute;top:0;bottom:0;width:40%;border-radius:inherit;background:currentColor;animation:arena-prog var(--loop-sweep) var(--ease-in-out) infinite}' +
      '@media (prefers-reduced-motion:reduce){.arena-prog-ind::after{animation-duration:var(--loop-reduced)}}';
    document.head.appendChild(s);
  }, []);
}
const TONES = { accent: 'var(--crimson)', gold: 'var(--gold)', success: 'var(--success)', danger: 'var(--danger)', info: 'var(--info)' };

export function ProgressBar({ progressPercentage = 0, indeterminate = false, tone = 'accent', label, showPercentage = true, size = 'md' }: ProgressBarProps) {
  if (!label) throw new Error('ProgressBar: `label` is required (it names what is progressing, and nothing can derive that)');
  useIndeterminate();
  const color = TONES[tone] || TONES.accent;
  const h = size === 'sm' ? 'var(--sp-1)' : size === 'lg' ? 'calc(var(--sp-1) * 2.5)' : 'calc(var(--sp-1) * 1.5)';
  const pct = Math.max(0, Math.min(100, Math.round(progressPercentage)));
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'calc(var(--sp-1) * 2)', gap: 'calc(var(--sp-1) * 3)' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', color: 'var(--bone-dim)' }}>{label}</span>
        {showPercentage && !indeterminate && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{pct}%</span>}
      </div>
      <div role="progressbar" aria-live="polite" aria-valuenow={indeterminate ? undefined : pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}
        className={indeterminate ? 'arena-prog-ind' : undefined}
        style={{ position: 'relative', height: h, borderRadius: 'var(--r-pill)', background: 'var(--color-base-300)', overflow: 'hidden', color }}>
        {!indeterminate && (
          <>
            <span style={srOnly}>{pct}%</span>
            <span style={{ position: 'absolute', inset: 0, width: pct + '%', background: color, borderRadius: 'inherit', transition: 'width var(--dur-mid) var(--ease-out)' }} />
          </>
        )}
      </div>
    </div>
  );
}
