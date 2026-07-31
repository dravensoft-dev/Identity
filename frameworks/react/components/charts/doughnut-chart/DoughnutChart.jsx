import React, { useState } from 'react';
import { useContainerWidth } from '../../../UseContainerWidth.js';
import { resolveColors, arcPath, srOnly, CHART_HEIGHT } from '../../../DataVisuals.js';
import { chartLegendMin, chartLegendMax, chartLegendGap, chartRingInset } from '../../../Tokens.generated.js';

export function DoughnutChart({ labels, values, seriesLabel, slots, valueSuffix }) {
  if (!labels) throw new Error('DoughnutChart: `labels` is required');
  if (!values) throw new Error('DoughnutChart: `values` is required');
  const [ref, measured] = useContainerWidth();
  const [hover, setHover] = useState(null);

  const width = measured ?? 600;
  const height = CHART_HEIGHT;
  const n = values.length;
  const fmt = (v) => `${v}${valueSuffix ?? ''}`;
  const colors = resolveColors({ slots: slots ?? Array.from({ length: n }, (_, i) => i + 1), count: n });

  const total = values.reduce((a, b) => a + Math.max(0, b), 0);

  const legendW = Math.min(chartLegendMax, Math.max(chartLegendMin, width * 0.34));
  const plotW = Math.max(1, width - legendW - chartLegendGap);
  const cx = plotW / 2;
  const cy = height / 2;
  const rOuter = Math.max(1, Math.min(plotW, height) / 2 - chartRingInset);
  const rInner = rOuter * 0.62;

  const name = seriesLabel ? `${seriesLabel} — doughnut chart` : 'Doughnut chart';

  let angle = -Math.PI / 2;
  const segments = values.map((v, i) => {
    const share = total > 0 ? Math.max(0, v) / total : 0;
    const a0 = angle;
    const a1 = angle + share * Math.PI * 2;
    angle = a1;
    return { i, a0, a1, share };
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height, display: 'flex', gap: 'var(--chart-legend-gap)' }}>
      <svg width={plotW} height={height} role="img" aria-label={name}
        onMouseLeave={() => setHover(null)} style={{ display: 'block', flexShrink: 0 }}>
        {segments.map(({ i, a0, a1 }) => a1 > a0 && (
          <path key={i} d={arcPath(cx, cy, rOuter, rInner, a0, a1)} fill={colors[i]}

            stroke="var(--surface-card)"
            opacity={hover === null || hover === i ? 1 : 0.55}
            onMouseEnter={() => setHover(i)}
            style={{ transition: 'opacity var(--dur-fast) var(--ease-out)', strokeWidth: 'var(--bw-strong)' }} />
        ))}
        {hover !== null && segments[hover] && (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fill="var(--bone)" fontFamily="var(--font-mono)" style={{ fontSize: 'var(--dz-text-lg)' }}>
            {Math.round(segments[hover].share * 100)}%
          </text>
        )}
      </svg>

      {

}
      <div tabIndex={0} role="group" aria-label="Doughnut chart legend"
        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'calc(var(--sp-1) * 1.5)', overflow: 'auto' }}>
        {values.map((_, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', opacity: hover === null || hover === i ? 1 : 0.55 }}>
            <span aria-hidden="true" style={{ width: 'calc(var(--sp-1) * 2.5)', height: 'calc(var(--sp-1) * 2.5)', borderRadius: 'var(--r-xs)', background: colors[i], flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--text-body)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{labels[i] ?? ''}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{fmt(values[i])}</span>
          </div>
        ))}
      </div>

      <table style={srOnly}>
        <caption>{name}</caption>
        <thead><tr><th>Category</th><th>{seriesLabel || 'Value'}</th></tr></thead>
        <tbody>
          {values.map((v, i) => <tr key={i}><th scope="row">{labels[i]}</th><td>{fmt(v)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
