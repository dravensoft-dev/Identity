import React, { useState } from 'react';
import { useContainerWidth } from '../../use-container-width.js';
import { resolveColors, arcPath, srOnly, CHART_HEIGHT } from './chart-internals.js';

export function DoughnutChart({ labels = [], values = [], slots, valueFormatter, style, ...rest }) {
  const [ref, measured] = useContainerWidth();
  const [hover, setHover] = useState(null);

  const width = measured ?? 600;
  const height = CHART_HEIGHT;
  const n = values.length;
  const fmt = valueFormatter || ((v) => String(v));
  const colors = resolveColors({ slots: slots ?? Array.from({ length: n }, (_, i) => i + 1), count: n });   // identity only — slices ARE categories

  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  const legendW = Math.min(180, Math.max(120, width * 0.34));
  const plotW = Math.max(1, width - legendW - 16);
  const cx = plotW / 2;
  const cy = height / 2;
  const rOuter = Math.max(1, Math.min(plotW, height) / 2 - 8);
  const rInner = rOuter * 0.62;

  let angle = -Math.PI / 2;                    // start at 12 o'clock
  const segments = values.map((v, i) => {
    const share = total > 0 ? Math.max(0, v) / total : 0;
    const a0 = angle;
    const a1 = angle + share * Math.PI * 2;
    angle = a1;
    return { i, a0, a1, share };
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height, display: 'flex', gap: 16, ...style }} {...rest}>
      <svg width={plotW} height={height} role="img" aria-label="Doughnut chart"
        onMouseLeave={() => setHover(null)} style={{ display: 'block', flexShrink: 0 }}>
        {segments.map(({ i, a0, a1 }) => a1 > a0 && (
          <path key={i} d={arcPath(cx, cy, rOuter, rInner, a0, a1)} fill={colors[i]}
            /* The 2px gap between slices is the card surface showing through. */
            stroke="var(--surface-card)" strokeWidth="2"
            opacity={hover === null || hover === i ? 1 : 0.55}
            onMouseEnter={() => setHover(i)}
            style={{ transition: 'opacity var(--dur-fast) var(--ease-out)' }} />
        ))}
        {hover !== null && segments[hover] && (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fill="var(--bone)" fontFamily="var(--font-mono)" fontSize="16">
            {Math.round(segments[hover].share * 100)}%
          </text>
        )}
      </svg>

      {/* A legend, always — the slices are the series, and identity is never
          color-alone. */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, overflow: 'auto' }}>
        {labels.map((l, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: hover === null || hover === i ? 1 : 0.55 }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--text-body)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{fmt(values[i])}</span>
          </div>
        ))}
      </div>

      <table style={srOnly}>
        <caption>Doughnut chart</caption>
        <thead><tr><th>Category</th><th>Value</th></tr></thead>
        <tbody>
          {values.map((v, i) => <tr key={i}><th scope="row">{labels[i]}</th><td>{fmt(v)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
