import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, booleanAttribute, computed,
  input, signal, viewChild,
} from '@angular/core';
import { containerWidth } from '../../../ContainerSize';
import {
  CHART_HEIGHT, PAD, RAIL_STYLE, SR_ONLY, areaFill, niceMax, plotWidth, resolveColors, ticks,
  valueWriter,
} from '../../../DataVisuals';
import type { NumberFormat, SeriesTone } from '../../../Api.generated';
import { chartPointR, chartPointRHover, chartLabelGap } from '../../../Tokens.generated';

const ASSUMED_WIDTH = 600;

const POINT_R = chartPointR;
const POINT_R_HOVER = chartPointRHover;

const LINE_STYLE = { strokeWidth: 'var(--bw)' } as const satisfies Readonly<Record<string, string>>;

const SERIES_STROKE_STYLE = { strokeWidth: 'var(--bw-strong)' } as const satisfies Readonly<Record<string, string>>;

const TICK_LABEL_STYLE = { fontSize: 'var(--dz-text-2xs)' } as const satisfies Readonly<Record<string, string>>;

const POINT_LABEL_STYLE = { fontSize: 'var(--fs-xs)' } as const satisfies Readonly<Record<string, string>>;

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

export interface ArenaLinePoint {

  x: number;

  y: number;
}

export function lineX(index: number, count: number, innerWidth: number): number {
  return PAD.l + (count <= 1 ? innerWidth / 2 : (innerWidth / (count - 1)) * index);
}

export function lineValueY(value: number, max: number, innerHeight: number): number {
  return PAD.t + innerHeight - (Math.max(0, value) / max) * innerHeight;
}

export function nearestPointIndex(points: readonly ArenaLinePoint[], x: number): number {
  if (points.length === 0) return -1;
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i;
  }
  return best;
}

export function linePoints(points: readonly ArenaLinePoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export function lineAreaPath(points: readonly ArenaLinePoint[], baseline: number): string {
  if (points.length === 0) return '';
  const line = points.map((point) => `${point.x},${point.y}`).join(' L');
  return `M${points[0].x},${baseline} L${line} L${points[points.length - 1].x},${baseline} Z`;
}

@Component({
  selector: 'arena-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:block;position:relative',
    '[style.height.px]': 'height()',
  },
  template: `
    <div #rail [style]="railStyle" [attr.tabindex]="scrolls() ? 0 : null"
         [attr.role]="scrolls() ? 'group' : null" [attr.aria-label]="scrolls() ? name() : null">
    <svg [attr.width]="scrolls() ? width() : '100%'" [attr.height]="height()" role="img" [attr.aria-label]="name()"
         style="display:block;overflow:visible">
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

      @if (area() && points().length > 0) {
        <path [attr.d]="areaPath()" [attr.fill]="areaFill()" stroke="none" />
      }

      @if (active(); as point) {
        <line [attr.x1]="point.x" [attr.x2]="point.x" [attr.y1]="pad.t" [attr.y2]="baseline()"
              stroke="var(--border-strong)" stroke-dasharray="3 3" [style]="lineStyle" />
      }

      @if (points().length > 1) {
        <polyline [attr.points]="polyline()" fill="none" [attr.stroke]="color()"
                  stroke-linejoin="round" stroke-linecap="round" [style]="seriesStrokeStyle" />
      }

      @for (point of points(); track point.index) {
        <circle [attr.cx]="point.x" [attr.cy]="point.y"
                [attr.r]="hover() === point.index ? pointRHover : pointR"
                [attr.fill]="color()" stroke="var(--surface-card)" [style]="seriesStrokeStyle" />
      }

      @for (point of points(); track point.index) {
        <text [attr.x]="point.x" [attr.y]="pointLabelY()" text-anchor="middle"
              fill="var(--text-muted)" font-family="var(--font-body)"
              [style]="pointLabelStyle">{{ point.label }}</text>
      }

      <rect [attr.x]="pad.l" [attr.y]="pad.t" [attr.width]="innerWidth()" [attr.height]="innerHeight()"
            fill="transparent" (mousemove)="onMove($event)" (mouseleave)="hover.set(null)" />
    </svg>
    </div>

    @if (active(); as point) {
      <div [style]="tooltipStyle" [style.left.px]="point.x"
           [style.top]="'calc(' + point.y + 'px - calc(var(--sp-1) * 2.5))'">
        <div [style]="tooltipLabelStyle">{{ point.label }}</div>
        <div [style]="tooltipValueStyle">{{ point.formatted }}</div>
      </div>
    }

    <table [style]="srOnly">
      <caption>{{ name() }}</caption>
      <thead><tr><th>Point</th><th>{{ seriesLabel() }}</th></tr></thead>
      <tbody>
        @for (point of points(); track point.index) {
          <tr><th scope="row">{{ point.label }}</th><td>{{ point.formatted }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class LineChart {
  /** One label per point, in the same order as `values`. A label with no value at its index is dropped. */
  readonly labels = input.required<string[]>();
  /** The plotted data, in order. One point per entry; a negative value clamps to the baseline. */
  readonly values = input.required<number[]>();
  /** Names the series for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a series is about is editorial, the same reason Table.label is required. */
  readonly seriesLabel = input.required<string>();
  /** The identity colour from the categorical ramp. A line is one series, so there is no per-mark override. */
  readonly slot = input<number>();
  /** Semantic colour, for a series that IS a state. Mutually exclusive with slot — passing both warns in development and tone wins. */
  readonly tone = input<SeriesTone>();
  /** Fill under the line at 18% of the series colour — a tint, never a gradient. For a single series; two fills occlude each other. */
  readonly area = input(false, { transform: booleanAttribute });
  /** Appended verbatim to every number the chart draws — the axis ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted. */
  readonly valueSuffix = input<string>();
  /** Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. */
  readonly valuePrefix = input<string>();
  /** How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. */
  readonly valueFormat = input<NumberFormat>();
  /** The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark, and a caller-supplied "20rem" is neither a token nor a derivation of one. */
  readonly height = input<number>(CHART_HEIGHT);
  /** The narrowest gap, in px, the chart draws between two adjacent points. Below it the chart stops compressing and overflows its container horizontally instead, scrolled and anchored to the most recent point: marker spacing is a legibility constant, not something that yields to the viewport, and thirty days in 390px is unreadable at any font size. Absent, the chart fits whatever width it is given. The rail it scrolls in is a keyboard-reachable region, because an overflow box nothing can focus is a trap. */
  readonly minPointSpacing = input<number>();

  protected readonly pad = PAD;
  protected readonly srOnly = SR_ONLY;
  protected readonly railStyle = RAIL_STYLE;
  protected readonly lineStyle = LINE_STYLE;
  protected readonly seriesStrokeStyle = SERIES_STROKE_STYLE;
  protected readonly tickLabelStyle = TICK_LABEL_STYLE;
  protected readonly pointLabelStyle = POINT_LABEL_STYLE;
  protected readonly tooltipStyle = TOOLTIP_STYLE;
  protected readonly tooltipLabelStyle = TOOLTIP_LABEL_STYLE;
  protected readonly tooltipValueStyle = TOOLTIP_VALUE_STYLE;
  protected readonly pointR = POINT_R;
  protected readonly pointRHover = POINT_R_HOVER;
  protected readonly tickLabelX = PAD.l - chartLabelGap;
  protected readonly pointLabelY = computed(() => this.height() - chartLabelGap);
  protected readonly hover = signal<number | null>(null);

  private readonly write = computed(() => valueWriter({
    prefix: this.valuePrefix(), suffix: this.valueSuffix(), format: this.valueFormat(),
  }));

  private readonly measured = containerWidth();

  private readonly available = computed(() => this.measured() ?? ASSUMED_WIDTH);

  protected readonly width = computed(
    () => plotWidth(this.available(), this.values().length, this.minPointSpacing()),
  );

  protected readonly scrolls = computed(() => this.width() > this.available());

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');

  protected readonly color = computed(() => resolveColors({ slot: this.slot(), tone: this.tone(), count: 1 })[0]);

  protected readonly areaFill = computed(() => areaFill(this.color()));

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return `${series} — line chart`;
  });

  private readonly max = computed(() => niceMax(Math.max(0, ...this.values())));
  protected readonly innerWidth = computed(() => Math.max(1, this.width() - PAD.l - PAD.r));
  protected readonly innerHeight = computed(() => Math.max(1, this.height() - PAD.t - PAD.b));
  protected readonly baseline = computed(() => PAD.t + this.innerHeight());

  protected readonly gridLines = computed(() => {
    const max = this.max();
    const innerHeight = this.innerHeight();
    const write = this.write();
    return ticks(max).map((value) => ({ value, y: lineValueY(value, max, innerHeight), label: write(value) }));
  });

  protected readonly points = computed(() => {
    const values = this.values();
    const max = this.max();
    const innerWidth = this.innerWidth();
    const innerHeight = this.innerHeight();
    const write = this.write();
    return values.map((value, index) => ({
      index,
      x: lineX(index, values.length, innerWidth),
      y: lineValueY(value, max, innerHeight),
      label: this.labels()[index] ?? '',
      formatted: write(value),
    }));
  });

  protected readonly polyline = computed(() => linePoints(this.points()));
  protected readonly areaPath = computed(() => lineAreaPath(this.points(), this.baseline()));

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.points()[index] ?? null;
  });

  constructor() {

    afterRenderEffect(() => {
      const rail = this.rail()?.nativeElement;
      if (!rail || !this.scrolls()) return;
      rail.scrollLeft = rail.scrollWidth - rail.clientWidth;
    });
  }

  protected onMove(event: MouseEvent): void {

    const box = (event.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const index = nearestPointIndex(this.points(), event.clientX - box.left);
    if (index >= 0) this.hover.set(index);
  }
}
