import React, { useState } from 'react';
import { useContainerWidth } from '../../use-container-width.js';
import { resolveColors, niceMax, ticks, barPath, srOnly, PAD, CHART_HEIGHT } from './chart-internals.js';

export function BarChart({
  labels = [], values = [], seriesLabel, slot, slots, tone,
  valueFormatter, style, ...rest
}) {
  const [ref, measured] = useContainerWidth();
  const [hover, setHover] = useState(null);

  const width = measured ?? 600;              // wide first paint, then measured
  const height = CHART_HEIGHT;
  const n = values.length;
  const fmt = valueFormatter || ((v) => String(v));
  const colors = resolveColors({ slot, slots, tone, count: n });

  const max = niceMax(Math.max(0, ...values));
  const iw = Math.max(1, width - PAD.l - PAD.r);
  const ih = Math.max(1, height - PAD.t - PAD.b);
  const step = iw / Math.max(1, n);
  const bw = Math.max(1, step - 2);           // 2px of surface between bars
  const yOf = (v) => PAD.t + ih - (Math.max(0, v) / max) * ih;
  const baseline = PAD.t + ih;

  const name = seriesLabel ? `${seriesLabel} — bar chart` : 'Bar chart';

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height, ...style }} {...rest}>
      <svg width="100%" height={height} role="img" aria-label={name}
        onMouseLeave={() => setHover(null)} style={{ display: 'block', overflow: 'visible' }}>
        {/* grid + value axis */}
        {ticks(max).map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={width - PAD.r} y1={yOf(t)} y2={yOf(t)}
              stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 8} y={yOf(t)} textAnchor="end" dominantBaseline="middle"
              fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="10">{fmt(t)}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={width - PAD.r} y1={baseline} y2={baseline}
          stroke="var(--line-strong)" strokeWidth="1" />

        {values.map((v, i) => {
          const x = PAD.l + i * step + (step - bw) / 2;
          const y = yOf(v);
          return (
            <g key={i}>
              <path d={barPath(x, y, bw, baseline - y, 4)} fill={colors[i]}
                opacity={hover === null || hover === i ? 1 : 0.55}
                style={{ transition: 'opacity var(--dur-fast) var(--ease-out)' }} />
              {/* Hit target spans the whole column — larger than the mark, so a
                  1px-tall bar is still hoverable. */}
              <rect x={PAD.l + i * step} y={PAD.t} width={step} height={ih}
                fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}

        {/* category axis */}
        {labels.map((l, i) => (
          <text key={i} x={PAD.l + i * step + step / 2} y={height - 8} textAnchor="middle"
            fill="var(--text-muted)" fontFamily="var(--font-body)" fontSize="11">{l}</text>
        ))}
      </svg>

      {hover !== null && (
        <div style={{
          position: 'absolute', left: PAD.l + hover * step + step / 2, top: yOf(values[hover]) - 8,
          transform: 'translate(-50%,-100%)', pointerEvents: 'none', whiteSpace: 'nowrap',
          background: 'var(--bg-raised)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', padding: '6px 10px',
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mute)' }}>{labels[hover]}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--bone)' }}>{fmt(values[hover])}</div>
        </div>
      )}

      {/* The numbers, reachable. */}
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
