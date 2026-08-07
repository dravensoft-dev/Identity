import React, { useEffect, useRef, useState } from 'react';
import { useArenaContainerWidth } from '../../../UseArenaContainerWidth.ts';
import {
  arenaResolveColors, arenaCatColor, arenaNiceMax, arenaTicks, arenaSrOnly, arenaAreaFill, arenaPlotWidth, arenaRailStyle, arenaValueWriter,
  ARENA_CHART_HEIGHT,
} from '../../../DataVisuals.ts';
import {
  arenaLinearScale, arenaPointScale, arenaPointAt, arenaScaleZero, arenaValueY, arenaNearestPointIndex,
} from '../ChartScales.ts';
import { arenaLinePoints, arenaLineAreaPath } from '../ChartMarks.ts';
import { arenaPlotBox, arenaAxisTicks, arenaTickLabelX, arenaCategoryLabelY } from '../ChartAxis.ts';
import { chartPointR, chartPointRHover } from '../../../Tokens.generated.js';

import type { ArenaNumberFormat, ArenaSeriesTone } from '../../../Api.generated';

export type { ArenaSeriesTone };

export interface ArenaLineChartProps {

  /** One label per point, in the same order as `values`. A label with no value at its index is dropped. */
  labels: readonly string[];

  /** The plotted data, in order. One point per entry; a negative value clamps to the baseline. */
  values: readonly number[];

  /** Names the series for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a series is about is editorial, the same reason ArenaTable.label is required. */
  seriesLabel: string;

  /** The identity colour from the categorical ramp. A line is one series, so there is no per-mark override. */
  slot?: number;

  /** Semantic colour, for a series that IS a state. Mutually exclusive with slot; passing both warns in development and tone wins. */
  tone?: ArenaSeriesTone;

  /** Fill under the line at 18% of the series colour: a tint, never a gradient. For a single series; two fills occlude each other. */
  area?: boolean;

  /** Appended verbatim to every number the chart draws: the axis arenaTicks, the tooltip and the accessible table. Carries its own leading space if one is wanted. */
  valueSuffix?: string;

  /** Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. */
  valuePrefix?: string;

  /** How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. */
  valueFormat?: ArenaNumberFormat;

  /** The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark, and a caller-supplied "20rem" is neither a token nor a derivation of one. */
  height?: number;

  /** The narrowest gap, in px, the chart draws between two adjacent points. Below it the chart stops compressing and overflows its container horizontally instead, scrolled and anchored to the most recent point: marker spacing is a legibility constant, not something that yields to the viewport, and thirty days in 390px is unreadable at any font size. Absent, the chart fits whatever width it is given. The rail it scrolls in is a keyboard-reachable region, because an overflow box nothing can focus is a trap. */
  minPointSpacing?: number;
}


export function ArenaLineChart({
  labels, values, seriesLabel, slot, tone, area = false, valueSuffix, valuePrefix, valueFormat,
  height = ARENA_CHART_HEIGHT, minPointSpacing,
}: ArenaLineChartProps) {
  if (!seriesLabel) throw new Error('ArenaLineChart: `seriesLabel` is required (it names the series for the accessible name, and nothing can derive that)');
  if (!labels) throw new Error('ArenaLineChart: `labels` is required');
  if (!values) throw new Error('ArenaLineChart: `values` is required');
  const [ref, measured] = useArenaContainerWidth();
  const rail = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const available = measured ?? 600;
  const n = values.length;
  const width = arenaPlotWidth(available, n, minPointSpacing);
  const scrolls = width > available;
  const fmt = arenaValueWriter({ prefix: valuePrefix, suffix: valueSuffix, format: valueFormat });

  useEffect(() => {
    const box = rail.current;
    if (!box || !scrolls) return;
    box.scrollLeft = box.scrollWidth - box.clientWidth;
  }, [scrolls, width]);

  const [color = arenaCatColor(1)] = arenaResolveColors({ slot, tone, count: 1 });

  const max = arenaNiceMax(Math.max(0, ...values));
  const box = arenaPlotBox(width, height);
  const yScale = arenaLinearScale(0, max, box.y + box.h, box.y);
  const xScale = arenaPointScale(n, box.x, box.w);
  const baseline = arenaScaleZero(yScale);

  const plotted = values.map((v, i) => ({ x: arenaPointAt(xScale, i), y: arenaValueY(yScale, v) }));
  const points = arenaLinePoints(plotted);
  const areaPath = arenaLineAreaPath(plotted, baseline);

  const name = `${seriesLabel} — line chart`;

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (!n) return;
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const index = arenaNearestPointIndex(plotted, e.clientX - box.left);
    if (index >= 0) setHover(index);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height }}>
      <div ref={rail} style={arenaRailStyle} tabIndex={scrolls ? 0 : undefined}
        role={scrolls ? 'group' : undefined} aria-label={scrolls ? name : undefined}>
      <svg width={scrolls ? width : '100%'} height={height} role="img" aria-label={name} style={{ display: 'block', overflow: 'visible' }}>
        {arenaAxisTicks(yScale, arenaTicks(max), fmt).map((tick, i) => (
          <g key={i}>
            <line x1={box.x} x2={box.x + box.w} y1={tick.y} y2={tick.y} stroke="var(--border)" style={{ strokeWidth: 'var(--bw)' }} />
            <text x={arenaTickLabelX()} y={tick.y} textAnchor="end" dominantBaseline="middle"
              fill="var(--text-muted)" fontFamily="var(--font-mono)" style={{ fontSize: 'var(--dz-text-2xs)' }}>{tick.label}</text>
          </g>
        ))}
        <line x1={box.x} x2={box.x + box.w} y1={baseline} y2={baseline} stroke="var(--line-strong)" style={{ strokeWidth: 'var(--bw)' }} />

        {}
        {area && n > 0 && (
          <path d={areaPath} fill={arenaAreaFill(color)} stroke="none" />
        )}

        {hover !== null && (
          <line x1={arenaPointAt(xScale, hover)} x2={arenaPointAt(xScale, hover)} y1={box.y} y2={baseline}
            stroke="var(--border-strong)" style={{ strokeWidth: 'var(--bw)' }} strokeDasharray="3 3" />
        )}

        {n > 1 && <polyline points={points} fill="none" stroke={color} style={{ strokeWidth: 'var(--bw-strong)' }}
          strokeLinejoin="round" strokeLinecap="round" />}

        {plotted.map((point, i) => (
          <circle key={i} cx={point.x} cy={point.y} r={hover === i ? chartPointRHover : chartPointR}
            fill={color} stroke="var(--surface-card)" style={{ strokeWidth: 'var(--bw-strong)' }} />
        ))}

        {

}
        {plotted.map((point, i) => (
          <text key={i} x={point.x} y={arenaCategoryLabelY(height)} textAnchor="middle"
            fill="var(--text-muted)" fontFamily="var(--font-body)" style={{ fontSize: 'var(--fs-xs)' }}>{labels[i] ?? ''}</text>
        ))}

        {
}
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="transparent"
          onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      </div>

      {hover !== null && values[hover] !== undefined && (
        <div style={{
          position: 'absolute', left: arenaPointAt(xScale, hover), top: `calc(${arenaValueY(yScale, values[hover])}px - calc(var(--sp-1) * 2.5))`,
          transform: 'translate(-50%,-100%)', pointerEvents: 'none', whiteSpace: 'nowrap',
          background: 'var(--bg-raised)', border: 'var(--bw) solid var(--border-strong)',
          borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)' }}>{labels[hover]}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)' }}>{fmt(values[hover])}</div>
        </div>
      )}

      <table style={arenaSrOnly}>
        <caption>{name}</caption>
        <thead><tr><th>Point</th><th>{seriesLabel}</th></tr></thead>
        <tbody>
          {values.map((v, i) => <tr key={i}><th scope="row">{labels[i]}</th><td>{fmt(v)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
