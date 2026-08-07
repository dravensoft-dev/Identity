import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, input, signal,
  viewChild,
} from '@angular/core';
import { arenaContainerWidth } from '../../../ContainerSize';
import {
  ARENA_CHART_HEIGHT, ARENA_RAIL_STYLE, ARENA_SR_ONLY, arenaNiceMax, arenaPlotWidth, arenaResolveColors, arenaTicks,
  arenaValueWriter,
} from '../../../DataVisuals';
import {
  arenaLinearScale, arenaBandScale, arenaBandStart, arenaBandMark, arenaBandCenter, arenaScaleZero, arenaValueY,
} from '../ChartScales';
import { arenaBarPath } from '../ChartMarks';
import { arenaPlotBox, arenaAxisTicks, arenaTickLabelX, arenaCategoryLabelY } from '../ChartAxis';
import type { ArenaNumberFormat, ArenaSeriesTone } from '../../../Api.generated';
import { chartBarGap, chartBarRadius } from '../../../Tokens.generated';

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

@Component({
  selector: 'arena-bar-chart',
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
         style="display:block;overflow:visible" (mouseleave)="hover.set(null)">
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

      @for (bar of bars(); track bar.index) {
        <g>
          <path [attr.d]="bar.path" [attr.fill]="bar.color"
                [attr.opacity]="hover() === null || hover() === bar.index ? 1 : 0.55"
                [style]="barStyle" />
          <rect [attr.x]="bar.hitX" [attr.y]="plotTop()" [attr.width]="step()" [attr.height]="innerHeight()"
                fill="transparent" (mouseenter)="hover.set(bar.index)" />
        </g>
      }

      @for (bar of bars(); track bar.index) {
        <text [attr.x]="bar.midX" [attr.y]="categoryLabelY()" text-anchor="middle"
              fill="var(--text-muted)" font-family="var(--font-body)"
              [style]="categoryLabelStyle">{{ bar.label }}</text>
      }
    </svg>
    </div>

    @if (active(); as point) {
      <div [style]="tooltipStyle" [style.left.px]="point.midX"
           [style.top]="'calc(' + point.y + 'px - var(--sp-2))'">
        <div [style]="tooltipLabelStyle">{{ point.label }}</div>
        <div [style]="tooltipValueStyle">{{ point.value }}</div>
      </div>
    }

    <table [style]="arenaSrOnly">
      <caption>{{ name() }}</caption>
      <thead><tr><th>Category</th><th>{{ seriesLabel() }}</th></tr></thead>
      <tbody>
        @for (bar of bars(); track bar.index) {
          <tr><th scope="row">{{ bar.label }}</th><td>{{ bar.value }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class ArenaBarChart {
  /** One label per bar, in the same order as `values`. A label with no value at its index is dropped. */
  readonly labels = input.required<readonly string[]>();
  /** The plotted data. One bar per entry; a negative value clamps to the baseline. */
  readonly values = input.required<readonly number[]>();
  /** Names the series for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a series is about is editorial, the same reason ArenaTable.label is required. */
  readonly seriesLabel = input.required<string>();
  /** One identity colour from the categorical ramp for the whole series. 1-based, clamped to the ramp, never cycled. */
  readonly slot = input<number>();
  /** Per-bar identity override, one ramp slot each. Wins over `slot`. */
  readonly slots = input<readonly number[]>();
  /** Semantic colour, for a series that IS a state. Mutually exclusive with slot/slots; passing both warns in development and tone wins. */
  readonly tone = input<ArenaSeriesTone>();
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
  protected readonly tickLabelStyle = TICK_LABEL_STYLE;
  protected readonly categoryLabelStyle = CATEGORY_LABEL_STYLE;
  protected readonly barStyle = BAR_STYLE;
  protected readonly tooltipStyle = TOOLTIP_STYLE;
  protected readonly tooltipLabelStyle = TOOLTIP_LABEL_STYLE;
  protected readonly tooltipValueStyle = TOOLTIP_VALUE_STYLE;
  protected readonly tickLabelX = arenaTickLabelX();
  protected readonly categoryLabelY = computed(() => arenaCategoryLabelY(this.height()));
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

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return `${series} — bar chart`;
  });

  private readonly max = computed(() => arenaNiceMax(Math.max(0, ...this.values())));
  private readonly box = computed(() => arenaPlotBox(this.width(), this.height()));
  protected readonly plotLeft = computed(() => this.box().x);
  protected readonly plotRight = computed(() => this.box().x + this.box().w);
  protected readonly plotTop = computed(() => this.box().y);
  protected readonly innerHeight = computed(() => this.box().h);

  private readonly yScale = computed(() => {
    const box = this.box();
    return arenaLinearScale(0, this.max(), box.y + box.h, box.y);
  });

  private readonly bands = computed(() => {
    const box = this.box();
    return arenaBandScale(this.values().length, box.x, box.w, chartBarGap);
  });

  protected readonly step = computed(() => this.bands().step);
  protected readonly baseline = computed(() => arenaScaleZero(this.yScale()));

  protected readonly gridLines = computed(
    () => arenaAxisTicks(this.yScale(), arenaTicks(this.max()), this.write()),
  );

  protected readonly bars = computed(() => {
    const values = this.values();
    const colors = arenaResolveColors({ slot: this.slot(), slots: this.slots(), tone: this.tone(), count: values.length });
    const bands = this.bands();
    const yScale = this.yScale();
    const baseline = this.baseline();
    const write = this.write();
    return values.map((value, index) => {
      const y = arenaValueY(yScale, value);
      return {
        index,
        hitX: arenaBandStart(bands, index),
        midX: arenaBandCenter(bands, index),
        y,
        path: arenaBarPath(arenaBandMark(bands, index), y, bands.band, baseline - y, BAR_RADIUS),
        color: colors[index],
        label: this.labels()[index] ?? '',
        value: write(value),
      };
    });
  });

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.bars()[index] ?? null;
  });

  constructor() {

    afterRenderEffect(() => {
      const rail = this.rail()?.nativeElement;
      if (!rail || !this.scrolls()) return;
      rail.scrollLeft = rail.scrollWidth - rail.clientWidth;
    });
  }
}
