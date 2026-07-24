import React, { useState } from 'react';
import { useContainerWidth } from '../../use-container-width.js';
import { resolveColors, arcPath, srOnly, CHART_HEIGHT } from './chart-internals.js';
import { chartLegendMin, chartLegendMax, chartLegendGap } from '../../tokens.generated.js';

export function DoughnutChart({ labels, values, seriesLabel, slots, valueSuffix }) {
  if (!labels) throw new Error('DoughnutChart: `labels` is required');
  if (!values) throw new Error('DoughnutChart: `values` is required');
  const [ref, measured] = useContainerWidth();
  const [hover, setHover] = useState(null);

  const width = measured ?? 600;
  const height = CHART_HEIGHT;
  const n = values.length;
  const fmt = (v) => `${v}${valueSuffix ?? ''}`;
  const colors = resolveColors({ slots: slots ?? Array.from({ length: n }, (_, i) => i + 1), count: n });   // identity only — slices ARE categories

  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  // 0.34 stays a plain number: the repo's position is that a multiplier which
  // derives one dimension from another is not itself a design value. Same for
  // rInner's 0.62 below, and for TYPE-MAP's note on Avatar's 0.4 and 0.28.
  const legendW = Math.min(chartLegendMax, Math.max(chartLegendMin, width * 0.34));
  const plotW = Math.max(1, width - legendW - chartLegendGap);
  const cx = plotW / 2;
  const cy = height / 2;
  const rOuter = Math.max(1, Math.min(plotW, height) / 2 - 8);
  const rInner = rOuter * 0.62;

  const name = seriesLabel ? `${seriesLabel} — doughnut chart` : 'Doughnut chart';

  let angle = -Math.PI / 2;                    // start at 12 o'clock
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
            /* The 2px gap between slices is the card surface showing through. */
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

      {/* A legend, always — the slices are the series, and identity is never
          color-alone. One row per slice, its label taken by index: a label with
          no value at its index is dropped rather than drawn beside a colourless
          swatch, and a slice with no label renders an empty string. */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'calc(var(--sp-1) * 1.5)', overflow: 'auto' }}>
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
