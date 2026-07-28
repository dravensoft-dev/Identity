import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { containerWidth } from '../container-size';
import { CHART_HEIGHT, PAD, SR_ONLY, barPath, niceMax, resolveColors, ticks } from '../chart-internals';
import type { SeriesTone } from '../../api.generated';
import { chartBarGap, chartBarRadius } from '../../tokens.generated';

/** The gap between two adjacent bars, in px. It is the plot surface showing
 *  through rather than a stroke on the bar: a stroke would sit inside the
 *  bar's own colour and read as a border, where this reads as breathing room
 *  the card's background provides. From tokens/src/chart.json. */
const BAR_GAP = chartBarGap;

/** The corner radius at a bar's data end, in px. Passed to `barPath`, which
 *  rounds that end only and leaves the baseline end square. From
 *  tokens/src/chart.json. */
const BAR_RADIUS = chartBarRadius;

/** The plot width assumed for the first paint, before `containerWidth()` has
 *  measured anything. Wide on purpose — a chart that starts narrow and widens
 *  flashes, where one that starts wide and settles does not. */
const ASSUMED_WIDTH = 600;

/* Every static style below is a camelCase object bound with `[style]`, never a
 * `style="a-b:c"` string in the template, and the reason is mechanical rather
 * than stylistic: check-dimension-literals.mjs finds a governed property by an
 * unbroken run of letters before a colon, so a kebab-case CSS declaration in a
 * template string is either invisible to it (`font-size:` reads as a property
 * named `size`) or actively misread (`stroke-width:` reads as `width`, then
 * runs the value scan off into the rest of the template). An object gives the
 * gate the same view of this component that it has of React's `BarChart.jsx`,
 * where every one of these is an inline style object key. */

/** The grid lines and the baseline: a hairline at the token border width. */
const LINE_STYLE = { strokeWidth: 'var(--bw)' } as const satisfies Readonly<Record<string, string>>;

/** The value-axis tick labels, in mono at the micro size. */
const TICK_LABEL_STYLE = { fontSize: 'var(--dz-text-2xs)' } as const satisfies Readonly<Record<string, string>>;

/** The category-axis labels, in the body face one step up from the ticks. */
const CATEGORY_LABEL_STYLE = { fontSize: 'var(--fs-xs)' } as const satisfies Readonly<Record<string, string>>;

/** A bar's dimming transition. Opacity only, so there is no movement for
 *  `prefers-reduced-motion` to reduce. */
const BAR_STYLE = { transition: 'opacity var(--dur-fast) var(--ease-out)' } as const satisfies Readonly<Record<string, string>>;

/** The hover tooltip's surface. `left` and `top` are bound separately, because
 *  they are the only part of it computed from the data. */
const TOOLTIP_STYLE = {
  position: 'absolute', transform: 'translate(-50%,-100%)', pointerEvents: 'none',
  whiteSpace: 'nowrap', background: 'var(--bg-raised)',
  border: 'var(--bw) solid var(--border-strong)', borderRadius: 'var(--r-sm)',
  boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
} as const satisfies Readonly<Record<string, string>>;

/** The tooltip's category line — the quieter of its two rows. */
const TOOLTIP_LABEL_STYLE = {
  fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)',
} as const satisfies Readonly<Record<string, string>>;

/** The tooltip's value line, in mono so digits align between hovers. */
const TOOLTIP_VALUE_STYLE = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)',
} as const satisfies Readonly<Record<string, string>>;

/** Projects a value onto the plot's pixel height, top-down: `0` lands on the
 *  baseline and `max` lands on the plot's top edge. Negative values clamp to
 *  the baseline, because a one-axis bar chart has no room below it.
 *  @param value the datum @param max the axis top (always > 0, per `niceMax`)
 *  @param innerHeight the plot height in px, padding already removed
 *  @returns the y coordinate of the value's data end */
export function barValueY(value: number, max: number, innerHeight: number): number {
  return PAD.t + innerHeight - (Math.max(0, value) / max) * innerHeight;
}

/** One bar's horizontal geometry. `hitX` opens the whole column and `x` opens
 *  the mark drawn inside it; the two differ by half the inter-bar gap. */
export interface ArenaBarColumn {
  /** The column's left edge — where the hit target starts, not the mark. */
  hitX: number;
  /** The mark's left edge, inset from `hitX` by half the gap. */
  x: number;
  /** The column's centre, which the label and the tooltip align to. */
  midX: number;
}

/** The horizontal layout of `count` bars across a measured plot. The columns
 *  tile the plot edge to edge with no gap between them — the visible gap comes
 *  from the mark being narrower than its column, so the hit target stays a full
 *  column wide and a 1px-tall bar is still hoverable.
 *  @param count how many bars @param width the container's measured width
 *  @returns the column pitch, the mark width, and one entry per bar */
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

/** Categorical bars on one axis. Identity by `slot`/`slots`, or meaning by
 *  `tone` — never both. One of the three hand-written SVG charts, so unlike
 *  every other primitive in this layer it carries styling of its own: a
 *  chart's visual identity is path data and presentation attributes, which a
 *  class string cannot hold. Every value in it is still a token.
 *
 *  The host is both the box `containerWidth()` measures and the containing
 *  block the tooltip is positioned against, so it declares `display:block`
 *  explicitly: `<arena-bar-chart>` is an unknown element whose UA default is
 *  `display:inline`, and a non-replaced inline box has no content width for a
 *  `ResizeObserver` to report — every bar position would be laid out against
 *  the wrong number. This is the same hazard the manifest-driven display
 *  utility guards for every other primitive; a chart has no manifest, so it
 *  states the display itself. */
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
  protected readonly tickLabelX = PAD.l - 8;
  protected readonly categoryLabelY = CHART_HEIGHT - 8;
  protected readonly hover = signal<number | null>(null);

  /** The unit appended to every number this chart draws — the axis ticks, the
   *  tooltip and the accessible table alike. Appended verbatim: the caller owns
   *  the leading space. `private`, so the reader never sees it as a member. */
  private readonly suffix = computed(() => this.valueSuffix() ?? '');

  private readonly measured = containerWidth();
  /** Wide first paint, then measured — the narrow branch never flashes. */
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
