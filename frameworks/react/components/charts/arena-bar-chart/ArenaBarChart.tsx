import React, { useEffect, useRef, useState } from 'react';
import { useArenaContainerWidth } from '../../../UseArenaContainerWidth.ts';
import { arenaSrOnly, arenaPlotWidth, arenaRailStyle, arenaValueWriter, ARENA_CHART_HEIGHT } from '../../../DataVisuals.ts';
import {
  arenaLinearScale, arenaBandScale, arenaBandStart, arenaBandCenter, arenaBandSubBand, arenaScaleValue,
} from '../ChartScales.ts';
import { arenaBarPath } from '../ChartMarks.ts';
import { arenaPlotBox, arenaAxisModel, arenaTickLabelX, arenaCategoryLabelY } from '../ChartAxis.ts';
import { arenaChartTable, arenaSeriesColors, arenaSeriesDomain, arenaSeriesPointCount } from '../ChartSeries.ts';
import { arenaTooltipAnchor } from '../ChartTooltip.ts';
import { chartBarGap, chartSeriesGap, chartBarRadius } from '../../../Tokens.generated.js';

import type { ArenaNumberFormat, ArenaSeries } from '../../../Api.generated';

export interface ArenaBarChartProps {

  /** One label per category, in the same order as every series' `values`. A category with no value in a series is drawn for the series that do have one. */
  labels: readonly string[];

  /** The plotted series, drawn as one group of bars per category. One series is the common case and draws exactly what it drew before; two or more share each category's band, so the bars of one category stand side by side and the reader compares within a category before comparing across. The ramp clamps at its last slot rather than cycling, so a ninth series folds into "Other" upstream, never into a colour already spent. */
  series: readonly ArenaSeries[];

  /** Names the chart for its accessible name and for the caption of its data table. This is the CHART's name, not a series': a series names itself. Required and guarded rather than defaulted, because a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. */
  label: string;

  /** Appended verbatim to every number the chart draws: the axis ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted. */
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


export function ArenaBarChart({
  labels, series, label, valueSuffix, valuePrefix, valueFormat,
  height = ARENA_CHART_HEIGHT, minPointSpacing,
}: ArenaBarChartProps) {
  if (!label) throw new Error('ArenaBarChart: `label` is required (it names the chart for the accessible name, and nothing can derive that)');
  if (!labels) throw new Error('ArenaBarChart: `labels` is required');
  if (!series) throw new Error('ArenaBarChart: `series` is required');
  const [ref, measured] = useArenaContainerWidth();
  const rail = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const available = measured ?? 600;
  const n = arenaSeriesPointCount(series);
  const width = arenaPlotWidth(available, n, minPointSpacing);
  const scrolls = width > available;
  const fmt = arenaValueWriter({ prefix: valuePrefix, suffix: valueSuffix, format: valueFormat });

  useEffect(() => {
    const box = rail.current;
    if (!box || !scrolls) return;
    box.scrollLeft = box.scrollWidth - box.clientWidth;
  }, [scrolls, width]);

  const domain = arenaSeriesDomain(series);
  const box = arenaPlotBox(width, height);
  const yScale = arenaLinearScale(domain.min, domain.max, box.y + box.h, box.y);
  const bands = arenaBandScale(n, box.x, box.w, chartBarGap);
  const axis = arenaAxisModel(yScale, domain, fmt);
  const colors = series.map((one, s) => arenaSeriesColors(one, n, s + 1));
  const table = arenaChartTable('Category', series, labels, fmt);

  const name = `${label} — bar chart`;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height }}>
      <div ref={rail} style={arenaRailStyle} tabIndex={scrolls ? 0 : undefined}
        role={scrolls ? 'group' : undefined} aria-label={scrolls ? name : undefined}>
      <svg width={scrolls ? width : '100%'} height={height} role="img" aria-label={name}
        onMouseLeave={() => setHover(null)} style={{ display: 'block', overflow: 'visible' }}>
        {}
        {axis.ticks.map((tick, i) => (
          <g key={i}>
            <line x1={box.x} x2={box.x + box.w} y1={tick.y} y2={tick.y}
              stroke="var(--border)" style={{ strokeWidth: 'var(--bw)' }} />
            <text x={arenaTickLabelX()} y={tick.y} textAnchor="end" dominantBaseline="middle"
              fill="var(--text-muted)" fontFamily="var(--font-mono)" style={{ fontSize: 'var(--dz-text-2xs)' }}>{tick.label}</text>
          </g>
        ))}
        <line x1={box.x} x2={box.x + box.w} y1={axis.zeroY} y2={axis.zeroY}
          stroke="var(--line-strong)" style={{ strokeWidth: 'var(--bw)' }} />

        {Array.from({ length: n }, (_, i) => (
          <g key={i}>
            {series.map((one, s) => {
              const value = one.values[i];
              if (value === undefined) return null;
              const y = arenaScaleValue(yScale, value);
              const sub = arenaBandSubBand(bands, i, series.length, s, chartSeriesGap);
              return (
                <path key={s} d={arenaBarPath(sub.x, sub.width, y, axis.zeroY, chartBarRadius)} fill={colors[s]?.[i]}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                  style={{ transition: 'opacity var(--dur-fast) var(--ease-out)' }} />
              );
            })}
            {
}
            <rect x={arenaBandStart(bands, i)} y={box.y} width={bands.step} height={box.h}
              fill="transparent" onMouseEnter={() => setHover(i)} />
          </g>
        ))}

        {

}
        {Array.from({ length: n }, (_, i) => (
          <text key={i} x={arenaBandCenter(bands, i)} y={arenaCategoryLabelY(height)} textAnchor="middle"
            fill="var(--text-muted)" fontFamily="var(--font-body)" style={{ fontSize: 'var(--fs-xs)' }}>{labels[i] ?? ''}</text>
        ))}
      </svg>
      </div>

      {hover !== null && hover < n && (
        <div style={{
          position: 'absolute', transform: 'translate(-50%,-100%)', pointerEvents: 'none', whiteSpace: 'nowrap',
          background: 'var(--bg-raised)', border: 'var(--bw) solid var(--border-strong)',
          borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
          ...arenaTooltipAnchor(arenaBandCenter(bands, hover),
            Math.min(...series.map((one) => arenaScaleValue(yScale, one.values[hover] ?? 0)))),
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)' }}>{labels[hover]}</div>
          {series.map((one, s) => one.values[hover] !== undefined && (
            <div key={s} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)' }}>
              {series.length > 1 ? `${one.label}: ` : ''}{fmt(one.values[hover] as number)}
            </div>
          ))}
        </div>
      )}

      {}
      <table style={arenaSrOnly}>
        <caption>{name}</caption>
        <thead><tr>{table.columns.map((column, i) => <th key={i}>{column}</th>)}</tr></thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}><th scope="row">{row.header}</th>{row.cells.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
