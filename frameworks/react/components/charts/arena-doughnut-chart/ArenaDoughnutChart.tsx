import React, { useState } from 'react';
import { useArenaContainerWidth } from '../../../UseArenaContainerWidth.ts';
import { arenaResolveColors, arenaSrOnly, arenaValueWriter, ARENA_CHART_HEIGHT } from '../../../DataVisuals.ts';
import { arenaDoughnutSlices } from '../ChartScales.ts';
import { arenaArcPath } from '../ChartMarks.ts';
import { arenaDoughnutLegendWidth, arenaDoughnutPlotWidth, arenaDoughnutRadii } from '../ChartAxis.ts';
import { chartLegendMax } from '../../../Tokens.generated.js';

import type { ArenaChartLegendLayout, ArenaNumberFormat } from '../../../Api.generated';

export interface ArenaDoughnutChartProps {

  /** One label per slice, in the same order as `values`. A label with no value at its index is dropped. */
  labels: readonly string[];

  /** The parts, which are read as shares of their own total. A negative value floors at zero; a total of zero paints nothing. */
  values: readonly number[];

  /** Names the chart for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a chart is about is editorial, the same reason ArenaTable.label is required. */
  seriesLabel: string;

  /** Per-slice identity override, one ramp slot each. Absent assigns 1..N in order, which is the rule rather than a starting point. */
  slots?: readonly number[];

  /** How each legend row arranges its label and its figure. 'inline' puts them on one line, which is what fits a wide tile; 'stacked' puts the label above the figure; 'auto' measures the legend column and stacks when the row does not give. It exists because the two do not degrade equally: on one line the figure does not yield, so the label is what gets truncated, and a legend of numbers with nothing saying what they count is the opposite of a legend. The threshold is already declared, as the chart-legend-min and chart-legend-max tokens the ring width is clamped between; what was missing was the behaviour. */
  legendLayout?: ArenaChartLegendLayout;

  /** A slice was activated by pointer, carrying its index in `values`. **In `values`, never in the drawn paths**, and that is the whole member: a slice worth zero paints nothing, so the shapes on screen and the entries in the array are two different lists, and a consumer indexing the SVG has to reproduce that omission from outside to translate one into the other. It is reverse engineering of a component's own DOM, which the next release breaks in silence. */
  onSliceActivate?: (index: number) => void;

  /** Appended verbatim to every number the chart draws: the legend value and the accessible table. Not the centre label, which is a percentage rather than a value. */
  valueSuffix?: string;

  /** Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. */
  valuePrefix?: string;

  /** How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. */
  valueFormat?: ArenaNumberFormat;
}


export function ArenaDoughnutChart({
  labels, values, seriesLabel, slots, valueSuffix, valuePrefix, valueFormat,
  legendLayout = 'auto', onSliceActivate,
}: ArenaDoughnutChartProps) {
  if (!seriesLabel) throw new Error('ArenaDoughnutChart: `seriesLabel` is required (it names the series for the accessible name, and nothing can derive that)');
  if (!labels) throw new Error('ArenaDoughnutChart: `labels` is required');
  if (!values) throw new Error('ArenaDoughnutChart: `values` is required');
  const [ref, measured] = useArenaContainerWidth();
  const [hover, setHover] = useState<number | null>(null);

  const width = measured ?? 600;
  const height = ARENA_CHART_HEIGHT;
  const n = values.length;
  const fmt = arenaValueWriter({ prefix: valuePrefix, suffix: valueSuffix, format: valueFormat });
  const colors = arenaResolveColors({ slots: slots ?? Array.from({ length: n }, (_, i) => i + 1), count: n });

  const legendW = arenaDoughnutLegendWidth(width);
  const stacked = legendLayout === 'auto' ? legendW < chartLegendMax : legendLayout === 'stacked';
  const plotW = arenaDoughnutPlotWidth(width);
  const cx = plotW / 2;
  const cy = height / 2;
  const { outer: rOuter, inner: rInner } = arenaDoughnutRadii(plotW, height);

  const name = `${seriesLabel} — doughnut chart`;

  const segments = arenaDoughnutSlices(values);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height, display: 'flex', gap: 'var(--chart-legend-gap)' }}>
      <svg width={plotW} height={height} role="img" aria-label={name}
        onMouseLeave={() => setHover(null)} style={{ display: 'block', flexShrink: 0 }}>
        {segments.map(({ index, from, to }) => to > from && (
          <path key={index} d={arenaArcPath(cx, cy, rOuter, rInner, from, to)} fill={colors[index]}

            stroke="var(--surface-card)"
            opacity={hover === null || hover === index ? 1 : 0.55}
            onMouseEnter={() => setHover(index)} onClick={() => onSliceActivate?.(index)}
            style={{ transition: 'opacity var(--dur-fast) var(--ease-out)', strokeWidth: 'var(--bw-strong)' }} />
        ))}
        {hover !== null && segments[hover] && (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fill="var(--bone)" fontFamily="var(--font-mono)" style={{ fontSize: 'var(--dz-text-lg)' }}>
            {segments[hover].percent}%
          </text>
        )}
      </svg>

      {

}
      <div tabIndex={0} role="group" aria-label="Doughnut chart legend"
        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'calc(var(--sp-1) * 1.5)', overflow: 'auto' }}>
        {values.map((_, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            onClick={() => onSliceActivate?.(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', cursor: 'pointer', opacity: hover === null || hover === i ? 1 : 0.55 }}>
            <span aria-hidden="true" style={{ width: 'calc(var(--sp-1) * 2.5)', height: 'calc(var(--sp-1) * 2.5)', borderRadius: 'var(--r-xs)', background: colors[i], flexShrink: 0 }} />
            <span style={stacked
              ? { display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column', alignItems: 'stretch' }
              : { display: 'flex', flex: 1, minWidth: 0, alignItems: 'baseline', gap: 'calc(var(--sp-1) * 2)', justifyContent: 'space-between' }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--text-body)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{labels[i] ?? ''}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{fmt(values[i] ?? 0)}</span>
            </span>
          </div>
        ))}
      </div>

      <table style={arenaSrOnly}>
        <caption>{name}</caption>
        <thead><tr><th>Category</th><th>{seriesLabel}</th></tr></thead>
        <tbody>
          {values.map((v, i) => <tr key={i}><th scope="row">{labels[i]}</th><td>{fmt(v)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
