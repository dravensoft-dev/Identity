import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, booleanAttribute, computed,
  input, signal, viewChild,
} from '@angular/core';
import { arenaContainerWidth } from '../../../ContainerSize';
import {
  ARENA_CHART_HEIGHT, ARENA_RAIL_STYLE, ARENA_SR_ONLY, arenaAreaFill, arenaNiceMax, arenaPlotWidth, arenaResolveColors, arenaTicks,
  arenaValueWriter,
} from '../../../DataVisuals';
import {
  arenaLinearScale, arenaPointScale, arenaPointAt, arenaScaleZero, arenaValueY, arenaNearestPointIndex,
} from '../ChartScales';
import { arenaLinePoints, arenaLineAreaPath } from '../ChartMarks';
import { arenaPlotBox, arenaAxisTicks, arenaTickLabelX, arenaCategoryLabelY } from '../ChartAxis';
import { arenaChartTable } from '../ChartSeries';
import { arenaTooltipAnchor } from '../ChartTooltip';
import { ARENA_TOOLTIP_STYLE, ARENA_TOOLTIP_LABEL_STYLE, ARENA_TOOLTIP_VALUE_STYLE } from '../ChartTooltipStyles';
import type { ArenaNumberFormat, ArenaSeriesTone } from '../../../Api.generated';
import { chartPointR, chartPointRHover } from '../../../Tokens.generated';

const ASSUMED_WIDTH = 600;

const POINT_R = chartPointR;
const POINT_R_HOVER = chartPointRHover;

const LINE_STYLE = { strokeWidth: 'var(--bw)' } as const satisfies Readonly<Record<string, string>>;

const SERIES_STROKE_STYLE = { strokeWidth: 'var(--bw-strong)' } as const satisfies Readonly<Record<string, string>>;

const TICK_LABEL_STYLE = { fontSize: 'var(--dz-text-2xs)' } as const satisfies Readonly<Record<string, string>>;

const POINT_LABEL_STYLE = { fontSize: 'var(--fs-xs)' } as const satisfies Readonly<Record<string, string>>;




@Component({
  selector: 'arena-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:block;position:relative',
    '[style.height.px]': 'height()',
  },
  template: `
    <div #rail [style]="arenaRailStyle" [attr.tabindex]="scrolls() ? 0 : null"
         [attr.role]="scrolls() ? 'group' : null" [attr.aria-label]="scrolls() ? name() : null">
    <svg [attr.width]="scrolls() ? width() : '100%'" [attr.height]="height()" role="img" [attr.aria-label]="name()"
         style="display:block;overflow:visible">
      @for (tick of gridLines(); track tick.value) {
        <g>
          <line [attr.x1]="plotLeft()" [attr.x2]="plotRight()" [attr.y1]="tick.y" [attr.y2]="tick.y"
                stroke="var(--border)" [style]="lineStyle" />
          <text [attr.x]="tickLabelX" [attr.y]="tick.y" text-anchor="end" dominant-baseline="middle"
                fill="var(--text-muted)" font-family="var(--font-mono)"
                [style]="tickLabelStyle">{{ tick.label }}</text>
        </g>
      }
      <line [attr.x1]="plotLeft()" [attr.x2]="plotRight()" [attr.y1]="baseline()" [attr.y2]="baseline()"
            stroke="var(--line-strong)" [style]="lineStyle" />

      @if (area() && points().length > 0) {
        <path [attr.d]="areaPath()" [attr.fill]="arenaAreaFill()" stroke="none" />
      }

      @if (active(); as point) {
        <line [attr.x1]="point.x" [attr.x2]="point.x" [attr.y1]="plotTop()" [attr.y2]="baseline()"
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

      <rect [attr.x]="plotLeft()" [attr.y]="plotTop()" [attr.width]="innerWidth()" [attr.height]="innerHeight()"
            fill="transparent" (mousemove)="onMove($event)" (mouseleave)="hover.set(null)" />
    </svg>
    </div>

    @if (active(); as point) {
      <div [style]="tooltipStyle" [style.left.px]="point.anchor.left" [style.top]="point.anchor.top">
        <div [style]="tooltipLabelStyle">{{ point.label }}</div>
        <div [style]="tooltipValueStyle">{{ point.formatted }}</div>
      </div>
    }

    <table [style]="arenaSrOnly">
      <caption>{{ name() }}</caption>
      <thead><tr>@for (column of table().columns; track $index) { <th>{{ column }}</th> }</tr></thead>
      <tbody>
        @for (row of table().rows; track $index) {
          <tr><th scope="row">{{ row.header }}</th>@for (cell of row.cells; track $index) { <td>{{ cell }}</td> }</tr>
        }
      </tbody>
    </table>
  `,
})
export class ArenaLineChart {
  /** One label per point, in the same order as `values`. A label with no value at its index is dropped. */
  readonly labels = input.required<readonly string[]>();
  /** The plotted data, in order. One point per entry; a negative value clamps to the baseline. */
  readonly values = input.required<readonly number[]>();
  /** Names the series for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a series is about is editorial, the same reason ArenaTable.label is required. */
  readonly seriesLabel = input.required<string>();
  /** The identity colour from the categorical ramp. A line is one series, so there is no per-mark override. */
  readonly slot = input<number>();
  /** Semantic colour, for a series that IS a state. Mutually exclusive with slot; passing both warns in development and tone wins. */
  readonly tone = input<ArenaSeriesTone>();
  /** Fill under the line at 18% of the series colour: a tint, never a gradient. For a single series; two fills occlude each other. */
  readonly area = input(false, { transform: booleanAttribute });
  /** Appended verbatim to every number the chart draws: the axis arenaTicks, the tooltip and the accessible table. Carries its own leading space if one is wanted. */
  readonly valueSuffix = input<string>();
  /** Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. */
  readonly valuePrefix = input<string>();
  /** How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. */
  readonly valueFormat = input<ArenaNumberFormat>();
  /** The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark, and a caller-supplied "20rem" is neither a token nor a derivation of one. */
  readonly height = input<number>(ARENA_CHART_HEIGHT);
  /** The narrowest gap, in px, the chart draws between two adjacent points. Below it the chart stops compressing and overflows its container horizontally instead, scrolled and anchored to the most recent point: marker spacing is a legibility constant, not something that yields to the viewport, and thirty days in 390px is unreadable at any font size. Absent, the chart fits whatever width it is given. The rail it scrolls in is a keyboard-reachable region, because an overflow box nothing can focus is a trap. */
  readonly minPointSpacing = input<number>();

  protected readonly arenaSrOnly = ARENA_SR_ONLY;
  protected readonly arenaRailStyle = ARENA_RAIL_STYLE;
  protected readonly lineStyle = LINE_STYLE;
  protected readonly seriesStrokeStyle = SERIES_STROKE_STYLE;
  protected readonly tickLabelStyle = TICK_LABEL_STYLE;
  protected readonly pointLabelStyle = POINT_LABEL_STYLE;
  protected readonly tooltipStyle = ARENA_TOOLTIP_STYLE;
  protected readonly tooltipLabelStyle = ARENA_TOOLTIP_LABEL_STYLE;
  protected readonly tooltipValueStyle = ARENA_TOOLTIP_VALUE_STYLE;
  protected readonly pointR = POINT_R;
  protected readonly pointRHover = POINT_R_HOVER;
  protected readonly tickLabelX = arenaTickLabelX();
  protected readonly pointLabelY = computed(() => arenaCategoryLabelY(this.height()));
  protected readonly hover = signal<number | null>(null);

  private readonly write = computed(() => arenaValueWriter({
    prefix: this.valuePrefix(), suffix: this.valueSuffix(), format: this.valueFormat(),
  }));

  private readonly measured = arenaContainerWidth();

  private readonly available = computed(() => this.measured() ?? ASSUMED_WIDTH);

  protected readonly width = computed(
    () => arenaPlotWidth(this.available(), this.values().length, this.minPointSpacing()),
  );

  protected readonly scrolls = computed(() => this.width() > this.available());

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');

  protected readonly color = computed(() => arenaResolveColors({ slot: this.slot(), tone: this.tone(), count: 1 })[0]);

  protected readonly arenaAreaFill = computed(() => arenaAreaFill(this.color()));

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return `${series} — line chart`;
  });

  private readonly max = computed(() => arenaNiceMax(Math.max(0, ...this.values())));
  private readonly box = computed(() => arenaPlotBox(this.width(), this.height()));
  protected readonly plotLeft = computed(() => this.box().x);
  protected readonly plotRight = computed(() => this.box().x + this.box().w);
  protected readonly plotTop = computed(() => this.box().y);
  protected readonly innerWidth = computed(() => this.box().w);
  protected readonly innerHeight = computed(() => this.box().h);

  private readonly yScale = computed(() => {
    const box = this.box();
    return arenaLinearScale(0, this.max(), box.y + box.h, box.y);
  });

  private readonly xScale = computed(() => {
    const box = this.box();
    return arenaPointScale(this.values().length, box.x, box.w);
  });

  protected readonly baseline = computed(() => arenaScaleZero(this.yScale()));

  protected readonly gridLines = computed(
    () => arenaAxisTicks(this.yScale(), arenaTicks(this.max()), this.write()),
  );

  protected readonly points = computed(() => {
    const values = this.values();
    const yScale = this.yScale();
    const xScale = this.xScale();
    const write = this.write();
    return values.map((value, index) => {
      const x = arenaPointAt(xScale, index);
      const y = arenaValueY(yScale, value);
      return { index, x, y, anchor: arenaTooltipAnchor(x, y), label: this.labels()[index] ?? '', formatted: write(value) };
    });
  });

  protected readonly polyline = computed(() => arenaLinePoints(this.points()));
  protected readonly areaPath = computed(() => arenaLineAreaPath(this.points(), this.baseline()));

  protected readonly table = computed(() => arenaChartTable(
    'Point', this.seriesLabel(), this.labels(), this.values(), this.write(),
  ));

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
    const index = arenaNearestPointIndex(this.points(), event.clientX - box.left);
    if (index >= 0) this.hover.set(index);
  }
}
