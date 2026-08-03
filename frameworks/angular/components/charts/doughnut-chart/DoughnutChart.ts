import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { containerWidth } from '../../../ContainerSize';
import { CHART_HEIGHT, SR_ONLY, arcPath, resolveColors, valueWriter } from '../../../DataVisuals';
import type { ChartLegendLayout, NumberFormat } from '../../../Api.generated';
import { chartLegendMin, chartLegendMax, chartLegendGap, chartRingInset } from '../../../Tokens.generated';

const ASSUMED_WIDTH = 600;

const START_ANGLE = -Math.PI / 2;

const LEGEND_MIN = chartLegendMin;
const LEGEND_MAX = chartLegendMax;
const LEGEND_SHARE = 0.34;

const LEGEND_GAP = chartLegendGap;

const LEGEND_STACK_BELOW = chartLegendMax;


const INNER_RATIO = 0.62;

const DIM_OPACITY = 0.55;

const SVG_STYLE = { display: 'block', flexShrink: '0' } as const satisfies Readonly<Record<string, string>>;

const SEGMENT_STYLE = {
  transition: 'opacity var(--dur-fast) var(--ease-out)', strokeWidth: 'var(--bw-strong)',
} as const satisfies Readonly<Record<string, string>>;

const CENTRE_LABEL_STYLE = { fontSize: 'var(--dz-text-lg)' } as const satisfies Readonly<Record<string, string>>;

const LEGEND_STYLE = {
  flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column',
  justifyContent: 'center', gap: 'calc(var(--sp-1) * 1.5)', overflow: 'auto',
} as const satisfies Readonly<Record<string, string>>;

const LEGEND_ROW_STYLE = {
  display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', cursor: 'pointer',
} as const satisfies Readonly<Record<string, string>>;

const LEGEND_TEXT_INLINE_STYLE = {
  display: 'flex', flex: '1', minWidth: '0', alignItems: 'baseline',
  gap: 'calc(var(--sp-1) * 2)', justifyContent: 'space-between',
} as const satisfies Readonly<Record<string, string>>;

const LEGEND_TEXT_STACKED_STYLE = {
  display: 'flex', flex: '1', minWidth: '0', flexDirection: 'column', alignItems: 'stretch',
} as const satisfies Readonly<Record<string, string>>;

const SWATCH_STYLE = {
  width: 'calc(var(--sp-1) * 2.5)', height: 'calc(var(--sp-1) * 2.5)',
  borderRadius: 'var(--r-xs)', flexShrink: '0',
} as const satisfies Readonly<Record<string, string>>;

const LEGEND_LABEL_STYLE = {
  flex: '1', minWidth: '0', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)',
  color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
} as const satisfies Readonly<Record<string, string>>;

const LEGEND_VALUE_STYLE = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)',
} as const satisfies Readonly<Record<string, string>>;

export interface ArenaDoughnutSlice {

  index: number;

  from: number;

  to: number;

  share: number;

  percent: number;
}

export function doughnutSlices(values: readonly number[]): ArenaDoughnutSlice[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  let angle = START_ANGLE;
  return values.map((value, index) => {
    const share = total > 0 ? Math.max(0, value) / total : 0;
    const from = angle;
    const to = angle + share * Math.PI * 2;
    angle = to;
    return { index, from, to, share, percent: Math.round(share * 100) };
  });
}

export function doughnutLegendWidth(width: number): number {
  return Math.min(LEGEND_MAX, Math.max(LEGEND_MIN, width * LEGEND_SHARE));
}

export function doughnutPlotWidth(width: number): number {
  return Math.max(1, width - doughnutLegendWidth(width) - LEGEND_GAP);
}

export function doughnutRadii(plotWidth: number, height: number): { outer: number; inner: number } {
  const outer = Math.max(1, Math.min(plotWidth, height) / 2 - chartRingInset);
  return { outer, inner: outer * INNER_RATIO };
}

@Component({
  selector: 'arena-doughnut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:flex;position:relative;width:100%;gap:var(--chart-legend-gap)',
    '[style.height.px]': 'height',
  },
  template: `
    <svg [attr.width]="plotWidth()" [attr.height]="height" role="img" [attr.aria-label]="name()"
         [style]="svgStyle" (mouseleave)="hover.set(null)">
      @for (segment of segments(); track segment.index) {
        @if (segment.path) {
          <path [attr.d]="segment.path" [attr.fill]="segment.color" stroke="var(--surface-card)"
                [attr.opacity]="hover() === null || hover() === segment.index ? 1 : dimOpacity"
                (mouseenter)="hover.set(segment.index)" (click)="sliceActivate.emit(segment.index)"
                [style]="segmentStyle" />
        }
      }
      @if (active(); as segment) {
        <text [attr.x]="centreX()" [attr.y]="centreY()" text-anchor="middle" dominant-baseline="middle"
              fill="var(--bone)" font-family="var(--font-mono)"
              [style]="centreLabelStyle">{{ segment.percent }}%</text>
      }
    </svg>

    <div [style]="legendStyle" tabindex="0" role="group" aria-label="Doughnut chart legend">
      @for (segment of segments(); track segment.index) {
        <div [style]="legendRowStyle"
             [style.opacity]="hover() === null || hover() === segment.index ? 1 : dimOpacity"
             (mouseenter)="hover.set(segment.index)" (mouseleave)="hover.set(null)"
             (click)="sliceActivate.emit(segment.index)">
          <span aria-hidden="true" [style]="swatchStyle" [style.background]="segment.color"></span>
          <span [style]="legendTextStyle()">
            <span [style]="legendLabelStyle">{{ segment.label }}</span>
            <span [style]="legendValueStyle">{{ segment.formatted }}</span>
          </span>
        </div>
      }
    </div>

    <table [style]="srOnly">
      <caption>{{ name() }}</caption>
      <thead><tr><th>Category</th><th>{{ seriesLabel() }}</th></tr></thead>
      <tbody>
        @for (segment of segments(); track segment.index) {
          <tr><th scope="row">{{ segment.label }}</th><td>{{ segment.formatted }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class DoughnutChart {
  /** One label per slice, in the same order as `values`. A label with no value at its index is dropped. */
  readonly labels = input.required<string[]>();
  /** The parts, which are read as shares of their own total. A negative value floors at zero; a total of zero paints nothing. */
  readonly values = input.required<number[]>();
  /** Names the chart for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a chart is about is editorial, the same reason Table.label is required. */
  readonly seriesLabel = input.required<string>();
  /** Per-slice identity override, one ramp slot each. Absent assigns 1..N in order, which is the rule rather than a starting point. */
  readonly slots = input<number[]>();
  /** Appended verbatim to every number the chart draws: the legend value and the accessible table. Not the centre label, which is a percentage rather than a value. */
  readonly valueSuffix = input<string>();
  /** Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. */
  readonly valuePrefix = input<string>();
  /** How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. */
  readonly valueFormat = input<NumberFormat>();
  /** How each legend row arranges its label and its figure. 'inline' puts them on one line, which is what fits a wide tile; 'stacked' puts the label above the figure; 'auto' measures the legend column and stacks when the row does not give. It exists because the two do not degrade equally: on one line the figure does not yield, so the label is what gets truncated, and a legend of numbers with nothing saying what they count is the opposite of a legend. The threshold is already declared, as the chart-legend-min and chart-legend-max tokens the ring width is clamped between; what was missing was the behaviour. */
  readonly legendLayout = input<ChartLegendLayout>('auto');
  /** A slice was activated by pointer, carrying its index in `values`. **In `values`, never in the drawn paths**, and that is the whole member: a slice worth zero paints nothing, so the shapes on screen and the entries in the array are two different lists, and a consumer indexing the SVG has to reproduce that omission from outside to translate one into the other. It is reverse engineering of a component's own DOM, which the next release breaks in silence. */
  readonly sliceActivate = output<number>();

  protected readonly height = CHART_HEIGHT;
  protected readonly srOnly = SR_ONLY;
  protected readonly svgStyle = SVG_STYLE;
  protected readonly segmentStyle = SEGMENT_STYLE;
  protected readonly centreLabelStyle = CENTRE_LABEL_STYLE;
  protected readonly legendStyle = LEGEND_STYLE;
  protected readonly legendRowStyle = LEGEND_ROW_STYLE;
  protected readonly swatchStyle = SWATCH_STYLE;
  protected readonly legendLabelStyle = LEGEND_LABEL_STYLE;
  protected readonly legendValueStyle = LEGEND_VALUE_STYLE;
  protected readonly dimOpacity = DIM_OPACITY;
  protected readonly hover = signal<number | null>(null);

  private readonly write = computed(() => valueWriter({
    prefix: this.valuePrefix(), suffix: this.valueSuffix(), format: this.valueFormat(),
  }));

  private readonly measured = containerWidth();

  private readonly width = computed(() => this.measured() ?? ASSUMED_WIDTH);

  protected readonly stacked = computed(() => {
    const choice = this.legendLayout();
    if (choice !== 'auto') return choice === 'stacked';
    return doughnutLegendWidth(this.width()) < LEGEND_STACK_BELOW;
  });

  protected readonly legendTextStyle = computed(
    () => (this.stacked() ? LEGEND_TEXT_STACKED_STYLE : LEGEND_TEXT_INLINE_STYLE),
  );

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return `${series} — doughnut chart`;
  });

  protected readonly plotWidth = computed(() => doughnutPlotWidth(this.width()));
  protected readonly centreX = computed(() => this.plotWidth() / 2);
  protected readonly centreY = computed(() => this.height / 2);

  protected readonly segments = computed(() => {
    const values = this.values();

    const colors = resolveColors({
      slots: this.slots() ?? values.map((_, index) => index + 1),
      count: values.length,
    });
    const write = this.write();
    const centreX = this.centreX();
    const centreY = this.centreY();
    const { outer, inner } = doughnutRadii(this.plotWidth(), this.height);
    return doughnutSlices(values).map((slice) => ({
      ...slice,
      color: colors[slice.index],
      label: this.labels()[slice.index] ?? '',
      formatted: write(values[slice.index]),
      path: slice.to > slice.from ? arcPath(centreX, centreY, outer, inner, slice.from, slice.to) : '',
    }));
  });

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.segments()[index] ?? null;
  });
}
