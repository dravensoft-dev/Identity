import React, { useEffect, useRef, useState } from 'react';
import { useContainerWidth } from '../../../UseContainerWidth.ts';
import {
  resolveColors, niceMax, ticks, barPath, srOnly, plotWidth, railStyle, valueWriter,
  PAD, CHART_HEIGHT,
} from '../../../DataVisuals.ts';
import { chartBarGap, chartBarRadius, chartLabelGap } from '../../../Tokens.generated.js';

import type { NumberFormat, SeriesTone } from '../../../Api.generated';

export type { SeriesTone };

export interface BarChartProps {

  /** One label per bar, in the same order as `values`. A label with no value at its index is dropped. */
  labels: string[];

  /** The plotted data. One bar per entry; a negative value clamps to the baseline. */
  values: number[];

  /** Names the series for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a series is about is editorial, the same reason Table.label is required. */
  seriesLabel: string;

  /** One identity colour from the categorical ramp for the whole series. 1-based, clamped to the ramp, never cycled. */
  slot?: number;

  /** Per-bar identity override, one ramp slot each. Wins over `slot`. */
  slots?: number[];

  /** Semantic colour, for a series that IS a state. Mutually exclusive with slot/slots; passing both warns in development and tone wins. */
  tone?: SeriesTone;

  /** Appended verbatim to every number the chart draws: the axis ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted. */
  valueSuffix?: string;

  /** Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. */
  valuePrefix?: string;

  /** How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. */
  valueFormat?: NumberFormat;

  /** The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark, and a caller-supplied "20rem" is neither a token nor a derivation of one. */
  height?: number;

  /** The narrowest gap, in px, the chart draws between two adjacent points. Below it the chart stops compressing and overflows its container horizontally instead, scrolled and anchored to the most recent point: marker spacing is a legibility constant, not something that yields to the viewport, and thirty days in 390px is unreadable at any font size. Absent, the chart fits whatever width it is given. The rail it scrolls in is a keyboard-reachable region, because an overflow box nothing can focus is a trap. */
  minPointSpacing?: number;
}


export function BarChart({
  labels, values, seriesLabel, slot, slots, tone, valueSuffix, valuePrefix, valueFormat,
  height = CHART_HEIGHT, minPointSpacing,
}: BarChartProps) {
  if (!seriesLabel) throw new Error('BarChart: `seriesLabel` is required (it names the series for the accessible name, and nothing can derive that)');
  if (!labels) throw new Error('BarChart: `labels` is required');
  if (!values) throw new Error('BarChart: `values` is required');
  const [ref, measured] = useContainerWidth();
  const rail = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const available = measured ?? 600;
  const n = values.length;
  const width = plotWidth(available, n, minPointSpacing);
  const scrolls = width > available;
  const fmt = valueWriter({ prefix: valuePrefix, suffix: valueSuffix, format: valueFormat });

  useEffect(() => {
    const box = rail.current;
    if (!box || !scrolls) return;
    box.scrollLeft = box.scrollWidth - box.clientWidth;
  }, [scrolls, width]);
  const colors = resolveColors({ slot, slots, tone, count: n });

  const max = niceMax(Math.max(0, ...values));
  const iw = Math.max(1, width - PAD.l - PAD.r);
  const ih = Math.max(1, height - PAD.t - PAD.b);
  const step = iw / Math.max(1, n);
  const bw = Math.max(1, step - chartBarGap);
  const yOf = (v: number) => PAD.t + ih - (Math.max(0, v) / max) * ih;
  const baseline = PAD.t + ih;

  const name = `${seriesLabel} — bar chart`;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height }}>
      <div ref={rail} style={railStyle} tabIndex={scrolls ? 0 : undefined}
        role={scrolls ? 'group' : undefined} aria-label={scrolls ? name : undefined}>
      <svg width={scrolls ? width : '100%'} height={height} role="img" aria-label={name}
        onMouseLeave={() => setHover(null)} style={{ display: 'block', overflow: 'visible' }}>
        {}
        {ticks(max).map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={width - PAD.r} y1={yOf(t)} y2={yOf(t)}
              stroke="var(--border)" style={{ strokeWidth: 'var(--bw)' }} />
            <text x={PAD.l - chartLabelGap} y={yOf(t)} textAnchor="end" dominantBaseline="middle"
              fill="var(--text-muted)" fontFamily="var(--font-mono)" style={{ fontSize: 'var(--dz-text-2xs)' }}>{fmt(t)}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={width - PAD.r} y1={baseline} y2={baseline}
          stroke="var(--line-strong)" style={{ strokeWidth: 'var(--bw)' }} />

        {values.map((v, i) => {
          const x = PAD.l + i * step + (step - bw) / 2;
          const y = yOf(v);
          return (
            <g key={i}>
              <path d={barPath(x, y, bw, baseline - y, chartBarRadius)} fill={colors[i]}
                opacity={hover === null || hover === i ? 1 : 0.55}
                style={{ transition: 'opacity var(--dur-fast) var(--ease-out)' }} />
              {
}
              <rect x={PAD.l + i * step} y={PAD.t} width={step} height={ih}
                fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}

        {

}
        {values.map((_, i) => (
          <text key={i} x={PAD.l + i * step + step / 2} y={height - chartLabelGap} textAnchor="middle"
            fill="var(--text-muted)" fontFamily="var(--font-body)" style={{ fontSize: 'var(--fs-xs)' }}>{labels[i] ?? ''}</text>
        ))}
      </svg>
      </div>

      {hover !== null && values[hover] !== undefined && (
        <div style={{
          position: 'absolute', left: PAD.l + hover * step + step / 2, top: `calc(${yOf(values[hover])}px - var(--sp-2))`,
          transform: 'translate(-50%,-100%)', pointerEvents: 'none', whiteSpace: 'nowrap',
          background: 'var(--bg-raised)', border: 'var(--bw) solid var(--border-strong)',
          borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)' }}>{labels[hover]}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)' }}>{fmt(values[hover])}</div>
        </div>
      )}

      {}
      <table style={srOnly}>
        <caption>{name}</caption>
        <thead><tr><th>Category</th><th>{seriesLabel}</th></tr></thead>
        <tbody>
          {values.map((v, i) => <tr key={i}><th scope="row">{labels[i]}</th><td>{fmt(v)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
