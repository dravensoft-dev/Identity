import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { containerWidth } from '../../../ContainerSize';
import { CHART_HEIGHT, PAD, SR_ONLY, barPath, niceMax, resolveColors, ticks } from '../../../DataVisuals';
import type { SeriesTone } from '../../../Api.generated';
import { chartBarGap, chartBarRadius, chartLabelGap } from '../../../Tokens.generated';

const BAR_GAP = chartBarGap;

const BAR_RADIUS = chartBarRadius;

const ASSUMED_WIDTH = 600;

const LINE_STYLE = { strokeWidth: 'var(--bw)' } as const satisfies Readonly<Record<string, string>>;

const TICK_LABEL_STYLE = { fontSize: 'var(--dz-text-2xs)' } as const satisfies Readonly<Record<string, string>>;

const CATEGORY_LABEL_STYLE = { fontSize: 'var(--fs-xs)' } as const satisfies Readonly<Record<string, string>>;

const BAR_STYLE = { transition: 'opacity var(--dur-fast) var(--ease-out)' } as const satisfies Readonly<Record<string, string>>;

const TOOLTIP_STYLE = {
  position: 'absolute', transform: 'translate(-50%,-100%)', pointerEvents: 'none',
  whiteSpace: 'nowrap', background: 'var(--bg-raised)',
  border: 'var(--bw) solid var(--border-strong)', borderRadius: 'var(--r-sm)',
  boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
} as const satisfies Readonly<Record<string, string>>;

const TOOLTIP_LABEL_STYLE = {
  fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)',
} as const satisfies Readonly<Record<string, string>>;

const TOOLTIP_VALUE_STYLE = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)',
} as const satisfies Readonly<Record<string, string>>;

export function barValueY(value: number, max: number, innerHeight: number): number {
  return PAD.t + innerHeight - (Math.max(0, value) / max) * innerHeight;
}

export interface ArenaBarColumn {

  hitX: number;

  x: number;

  midX: number;
}

export function barColumns(count: number, width: number): {
  step: number;
  barWidth: number;
  columns: ArenaBarColumn[];
} {
  const innerWidth = Math.max(1, width - PAD.l - PAD.r);
  const step = innerWidth / Math.max(1, count);
  const barWidth = Math.max(1, step - BAR_GAP);
  const columns = Array.from({ length: count }, (_, index) => {
    const hitX = PAD.l + index * step;
    return { hitX, x: hitX + (step - barWidth) / 2, midX: hitX + step / 2 };
  });
  return { step, barWidth, columns };
}

@Component({
  selector: 'arena-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:block;position:relative',
    '[style.height.px]': 'height',
  },
  template: `
    <svg width="100%" [attr.height]="height" role="img" [attr.aria-label]="name()"
         style="display:block;overflow:visible" (mouseleave)="hover.set(null)">
      @for (tick of gridLines(); track tick.value) {
        <g>
          <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="tick.y" [attr.y2]="tick.y"
                stroke="var(--border)" [style]="lineStyle" />
          <text [attr.x]="tickLabelX" [attr.y]="tick.y" text-anchor="end" dominant-baseline="middle"
                fill="var(--text-muted)" font-family="var(--font-mono)"
                [style]="tickLabelStyle">{{ tick.label }}</text>
        </g>
      }
      <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="baseline()" [attr.y2]="baseline()"
            stroke="var(--line-strong)" [style]="lineStyle" />

      @for (bar of bars(); track bar.index) {
        <g>
          <path [attr.d]="bar.path" [attr.fill]="bar.color"
                [attr.opacity]="hover() === null || hover() === bar.index ? 1 : 0.55"
                [style]="barStyle" />
          <rect [attr.x]="bar.hitX" [attr.y]="pad.t" [attr.width]="step()" [attr.height]="innerHeight()"
                fill="transparent" (mouseenter)="hover.set(bar.index)" />
        </g>
      }

      @for (bar of bars(); track bar.index) {
        <text [attr.x]="bar.midX" [attr.y]="categoryLabelY" text-anchor="middle"
              fill="var(--text-muted)" font-family="var(--font-body)"
              [style]="categoryLabelStyle">{{ bar.label }}</text>
      }
    </svg>

    @if (active(); as point) {
      <div [style]="tooltipStyle" [style.left.px]="point.midX"
           [style.top]="'calc(' + point.y + 'px - var(--sp-2))'">
        <div [style]="tooltipLabelStyle">{{ point.label }}</div>
        <div [style]="tooltipValueStyle">{{ point.value }}</div>
      </div>
    }

    <table [style]="srOnly">
      <caption>{{ name() }}</caption>
      <thead><tr><th>Category</th><th>{{ seriesLabel() ?? 'Value' }}</th></tr></thead>
      <tbody>
        @for (bar of bars(); track bar.index) {
          <tr><th scope="row">{{ bar.label }}</th><td>{{ bar.value }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class BarChart {
  readonly labels = input.required<string[]>();
  readonly values = input.required<number[]>();
  readonly seriesLabel = input<string>();
  readonly slot = input<number>();
  readonly slots = input<number[]>();
  readonly tone = input<SeriesTone>();
  readonly valueSuffix = input<string>();

  protected readonly height = CHART_HEIGHT;
  protected readonly pad = PAD;
  protected readonly srOnly = SR_ONLY;
  protected readonly lineStyle = LINE_STYLE;
  protected readonly tickLabelStyle = TICK_LABEL_STYLE;
  protected readonly categoryLabelStyle = CATEGORY_LABEL_STYLE;
  protected readonly barStyle = BAR_STYLE;
  protected readonly tooltipStyle = TOOLTIP_STYLE;
  protected readonly tooltipLabelStyle = TOOLTIP_LABEL_STYLE;
  protected readonly tooltipValueStyle = TOOLTIP_VALUE_STYLE;
  protected readonly tickLabelX = PAD.l - chartLabelGap;
  protected readonly categoryLabelY = CHART_HEIGHT - chartLabelGap;
  protected readonly hover = signal<number | null>(null);

  private readonly suffix = computed(() => this.valueSuffix() ?? '');

  private readonly measured = containerWidth();

  protected readonly width = computed(() => this.measured() ?? ASSUMED_WIDTH);

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return series ? `${series} — bar chart` : 'Bar chart';
  });

  private readonly max = computed(() => niceMax(Math.max(0, ...this.values())));
  protected readonly innerHeight = computed(() => Math.max(1, this.height - PAD.t - PAD.b));
  private readonly layout = computed(() => barColumns(this.values().length, this.width()));
  protected readonly step = computed(() => this.layout().step);
  protected readonly baseline = computed(() => PAD.t + this.innerHeight());

  protected readonly gridLines = computed(() => {
    const max = this.max();
    const innerHeight = this.innerHeight();
    const suffix = this.suffix();
    return ticks(max).map((value) => ({ value, y: barValueY(value, max, innerHeight), label: `${value}${suffix}` }));
  });

  protected readonly bars = computed(() => {
    const values = this.values();
    const colors = resolveColors({ slot: this.slot(), slots: this.slots(), tone: this.tone(), count: values.length });
    const { barWidth, columns } = this.layout();
    const max = this.max();
    const innerHeight = this.innerHeight();
    const baseline = this.baseline();
    const suffix = this.suffix();
    return values.map((value, index) => {
      const y = barValueY(value, max, innerHeight);
      return {
        index,
        hitX: columns[index].hitX,
        midX: columns[index].midX,
        y,
        path: barPath(columns[index].x, y, barWidth, baseline - y, BAR_RADIUS),
        color: colors[index],
        label: this.labels()[index] ?? '',
        value: `${value}${suffix}`,
      };
    });
  });

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.bars()[index] ?? null;
  });
}
