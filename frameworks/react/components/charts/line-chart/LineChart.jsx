import React, { useState } from 'react';
import { useContainerWidth } from '../../../UseContainerWidth.js';
import { resolveColors, niceMax, ticks, srOnly, PAD, CHART_HEIGHT } from '../../../DataVisuals.js';
import { chartPointR, chartPointRHover, chartLabelGap } from '../../../Tokens.generated.js';

export function LineChart({
  labels, values, seriesLabel, slot, tone, area = false, valueSuffix,
}) {
  if (!seriesLabel) throw new Error('LineChart: `seriesLabel` is required (it names the series for the accessible name, and nothing can derive that)');
  if (!labels) throw new Error('LineChart: `labels` is required');
  if (!values) throw new Error('LineChart: `values` is required');
  const [ref, measured] = useContainerWidth();
  const [hover, setHover] = useState(null);

  const width = measured ?? 600;
  const height = CHART_HEIGHT;
  const n = values.length;
  const fmt = (v) => `${v}${valueSuffix ?? ''}`;

  const color = resolveColors({ slot, tone, count: 1 })[0];

  const max = niceMax(Math.max(0, ...values));
  const iw = Math.max(1, width - PAD.l - PAD.r);
  const ih = Math.max(1, height - PAD.t - PAD.b);
  const xOf = (i) => PAD.l + (n <= 1 ? iw / 2 : (iw / (n - 1)) * i);
  const yOf = (v) => PAD.t + ih - (Math.max(0, v) / max) * ih;
  const baseline = PAD.t + ih;

  const points = values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
  const areaPath = n
    ? `M${xOf(0)},${baseline} L${values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' L')} L${xOf(n - 1)},${baseline} Z`
    : '';

  const name = `${seriesLabel} — line chart`;

  const onMove = (e) => {
    if (!n) return;
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const x = e.clientX - box.left;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(xOf(i) - x) < Math.abs(xOf(best) - x)) best = i;
    setHover(best);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height }}>
      <svg width="100%" height={height} role="img" aria-label={name} style={{ display: 'block', overflow: 'visible' }}>
        {ticks(max).map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={width - PAD.r} y1={yOf(t)} y2={yOf(t)} stroke="var(--border)" style={{ strokeWidth: 'var(--bw)' }} />
            <text x={PAD.l - chartLabelGap} y={yOf(t)} textAnchor="end" dominantBaseline="middle"
              fill="var(--text-muted)" fontFamily="var(--font-mono)" style={{ fontSize: 'var(--dz-text-2xs)' }}>{fmt(t)}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={width - PAD.r} y1={baseline} y2={baseline} stroke="var(--line-strong)" style={{ strokeWidth: 'var(--bw)' }} />

        {}
        {area && n > 0 && (
          <path d={areaPath} fill={`color-mix(in oklab, ${color} 18%, transparent)`} stroke="none" />
        )}

        {hover !== null && (
          <line x1={xOf(hover)} x2={xOf(hover)} y1={PAD.t} y2={baseline}
            stroke="var(--border-strong)" style={{ strokeWidth: 'var(--bw)' }} strokeDasharray="3 3" />
        )}

        {n > 1 && <polyline points={points} fill="none" stroke={color} style={{ strokeWidth: 'var(--bw-strong)' }}
          strokeLinejoin="round" strokeLinecap="round" />}

        {values.map((v, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={hover === i ? chartPointRHover : chartPointR}
            fill={color} stroke="var(--surface-card)" style={{ strokeWidth: 'var(--bw-strong)' }} />
        ))}

        {

}
        {values.map((_, i) => (
          <text key={i} x={xOf(i)} y={height - chartLabelGap} textAnchor="middle"
            fill="var(--text-muted)" fontFamily="var(--font-body)" style={{ fontSize: 'var(--fs-xs)' }}>{labels[i] ?? ''}</text>
        ))}

        {
}
        <rect x={PAD.l} y={PAD.t} width={iw} height={ih} fill="transparent"
          onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>

      {hover !== null && values[hover] !== undefined && (
        <div style={{
          position: 'absolute', left: xOf(hover), top: `calc(${yOf(values[hover])}px - calc(var(--sp-1) * 2.5))`,
          transform: 'translate(-50%,-100%)', pointerEvents: 'none', whiteSpace: 'nowrap',
          background: 'var(--bg-raised)', border: 'var(--bw) solid var(--border-strong)',
          borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)' }}>{labels[hover]}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)' }}>{fmt(values[hover])}</div>
        </div>
      )}

      <table style={srOnly}>
        <caption>{name}</caption>
        <thead><tr><th>Point</th><th>{seriesLabel}</th></tr></thead>
        <tbody>
          {values.map((v, i) => <tr key={i}><th scope="row">{labels[i]}</th><td>{fmt(v)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
