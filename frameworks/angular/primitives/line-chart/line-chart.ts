import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { containerWidth } from '../container-size';
import { ArenaChartTone, CHART_HEIGHT, PAD, SR_ONLY, niceMax, resolveColors, ticks } from '../chart-internals';

/** The plot width assumed for the first paint, before `containerWidth()` has
 *  measured anything. Wide on purpose — a chart that starts narrow and widens
 *  flashes, where one that starts wide and settles does not. */
const ASSUMED_WIDTH = 600;

/** The point marker's radius in px: the larger one is the hovered point. Both are
 *  SVG user units on a mark, not a CSS length on Arena's dimension scale, and the
 *  token layer models neither — `LineChart.jsx` writes the same two numbers. */
const POINT_R = 4;
const POINT_R_HOVER = 5;

/* Every static style below is a camelCase object bound with `[style]`, never a
 * `style="a-b:c"` string in the template, for the reason bar-chart.ts records at
 * length: check-dimension-literals.mjs finds a governed property by an unbroken
 * run of letters before a colon, so a kebab-case declaration in a template string
 * is either invisible to it (`font-size:` reads as a property named `size`) or
 * actively misread (`stroke-width:` reads as `width`, then runs the value scan off
 * into the rest of the template). An object gives the gate the same view of this
 * component that it has of React's `LineChart.jsx`, where every one of these is an
 * inline style object key. */

/** The grid lines, the baseline and the hover crosshair: a hairline at the token
 *  border width. */
const LINE_STYLE = { strokeWidth: 'var(--bw)' } as const satisfies Readonly<Record<string, string>>;

/** The series' own stroke weight, shared by the polyline and by the halo that rings
 *  each point in the card surface. One weight, so the marks read as one series. */
const SERIES_STROKE_STYLE = { strokeWidth: 'var(--bw-strong)' } as const satisfies Readonly<Record<string, string>>;

/** The value-axis tick labels, in mono at the micro size. */
const TICK_LABEL_STYLE = { fontSize: 'var(--dz-text-2xs)' } as const satisfies Readonly<Record<string, string>>;

/** The point labels along the bottom, in the body face one step up from the ticks. */
const POINT_LABEL_STYLE = { fontSize: 'var(--fs-xs)' } as const satisfies Readonly<Record<string, string>>;

/** The hover tooltip's surface. `left` and `top` are bound separately, because they
 *  are the only part of it computed from the data. */
const TOOLTIP_STYLE = {
  position: 'absolute', transform: 'translate(-50%,-100%)', pointerEvents: 'none',
  whiteSpace: 'nowrap', background: 'var(--bg-raised)',
  border: 'var(--bw) solid var(--border-strong)', borderRadius: 'var(--r-sm)',
  boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
} as const satisfies Readonly<Record<string, string>>;

/** The tooltip's point line — the quieter of its two rows. */
const TOOLTIP_LABEL_STYLE = {
  fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)',
} as const satisfies Readonly<Record<string, string>>;

/** The tooltip's value line, in mono so digits align between hovers. */
const TOOLTIP_VALUE_STYLE = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)',
} as const satisfies Readonly<Record<string, string>>;

/** A plotted point's position in SVG coordinates. */
export interface ArenaLinePoint {
  /** Horizontal position, padding included — the same origin the SVG uses. */
  x: number;
  /** Vertical position, top-down. */
  y: number;
}

/** Where point `index` of `count` sits horizontally. A lone point centres in the
 *  plot rather than pinning to the left edge, which would read as a series that
 *  starts and stops immediately.
 *  @param index the 0-based point @param count how many points there are
 *  @param innerWidth the plot width in px, padding already removed
 *  @returns the x coordinate, measured from the SVG's own origin */
export function lineX(index: number, count: number, innerWidth: number): number {
  return PAD.l + (count <= 1 ? innerWidth / 2 : (innerWidth / (count - 1)) * index);
}

/** Projects a value onto the plot's pixel height, top-down: `0` lands on the
 *  baseline and `max` lands on the plot's top edge. Negative values clamp to the
 *  baseline, because a one-axis line chart has no room below it.
 *  @param value the datum @param max the axis top (always > 0, per `niceMax`)
 *  @param innerHeight the plot height in px, padding already removed
 *  @returns the y coordinate of the value */
export function lineValueY(value: number, max: number, innerHeight: number): number {
  return PAD.t + innerHeight - (Math.max(0, value) / max) * innerHeight;
}

/** The index of the point nearest a pointer position. One overlay owns the pointer,
 *  so the crosshair snaps to a real datum instead of drifting between two; per-point
 *  hit targets would leave dead gaps between them. Ties go to the earlier point.
 *  @param points the plotted points @param x the pointer's x, in SVG coordinates
 *  @returns the winning index, or -1 when there are no points */
export function nearestPointIndex(points: readonly ArenaLinePoint[], x: number): number {
  if (points.length === 0) return -1;
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i;
  }
  return best;
}

/** The series as an SVG `points` list for `<polyline>`.
 *  @param points the plotted points @returns the space-separated coordinate pairs */
export function linePoints(points: readonly ArenaLinePoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

/** The filled area under the series: the line itself, closed down to the baseline at
 *  each end. Empty for an empty series, so nothing is painted rather than a stray
 *  `M`-only path.
 *  @param points the plotted points @param baseline the baseline's y coordinate
 *  @returns an SVG path `d`, or `''` when there is nothing to fill */
export function lineAreaPath(points: readonly ArenaLinePoint[], baseline: number): string {
  if (points.length === 0) return '';
  const line = points.map((point) => `${point.x},${point.y}`).join(' L');
  return `M${points[0].x},${baseline} L${line} L${points[points.length - 1].x},${baseline} Z`;
}

/** One series over time, with an optional area tint under it. Identity by `slot`, or
 *  meaning by `tone` — never both. One of the three hand-written SVG charts, so unlike
 *  every other primitive in this layer it carries styling of its own: a chart's visual
 *  identity is path data and presentation attributes, which a class string cannot
 *  hold. Every value in it is still a token.
 *
 *  The host is both the box `containerWidth()` measures and the containing block the
 *  tooltip is positioned against, so it declares `display:block` explicitly:
 *  `<arena-line-chart>` is an unknown element whose UA default is `display:inline`,
 *  and a non-replaced inline box has no content width for a `ResizeObserver` to
 *  report — every point would be laid out against the wrong number. This is the same
 *  hazard the manifest-driven display utility guards for every other primitive; a
 *  chart has no manifest, so it states the display itself. */
@Component({
  selector: 'arena-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:block;position:relative',
    '[style.height.px]': 'height',
  },
  template: `
    <svg width="100%" [attr.height]="height" role="img" [attr.aria-label]="name()"
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
        <text [attr.x]="point.x" [attr.y]="pointLabelY" text-anchor="middle"
              fill="var(--text-muted)" font-family="var(--font-body)"
              [style]="pointLabelStyle">{{ point.label }}</text>
      }

      <rect [attr.x]="pad.l" [attr.y]="pad.t" [attr.width]="innerWidth()" [attr.height]="innerHeight()"
            fill="transparent" (mousemove)="onMove($event)" (mouseleave)="hover.set(null)" />
    </svg>

    @if (active(); as point) {
      <div [style]="tooltipStyle" [style.left.px]="point.x"
           [style.top]="'calc(' + point.y + 'px - calc(var(--sp-1) * 2.5))'">
        <div [style]="tooltipLabelStyle">{{ point.label }}</div>
        <div [style]="tooltipValueStyle">{{ point.formatted }}</div>
      </div>
    }

    <table [style]="srOnly">
      <caption>{{ name() }}</caption>
      <thead><tr><th>Point</th><th>{{ seriesLabel() ?? 'Value' }}</th></tr></thead>
      <tbody>
        @for (point of points(); track point.index) {
          <tr><th scope="row">{{ point.label }}</th><td>{{ point.formatted }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class LineChart {
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly seriesLabel = input<string>();
  readonly slot = input<number>();
  readonly tone = input<ArenaChartTone>();
  readonly area = input(false);
  readonly valueFormatter = input<(value: number) => string>((value) => String(value));

  protected readonly height = CHART_HEIGHT;
  protected readonly pad = PAD;
  protected readonly srOnly = SR_ONLY;
  protected readonly lineStyle = LINE_STYLE;
  protected readonly seriesStrokeStyle = SERIES_STROKE_STYLE;
  protected readonly tickLabelStyle = TICK_LABEL_STYLE;
  protected readonly pointLabelStyle = POINT_LABEL_STYLE;
  protected readonly tooltipStyle = TOOLTIP_STYLE;
  protected readonly tooltipLabelStyle = TOOLTIP_LABEL_STYLE;
  protected readonly tooltipValueStyle = TOOLTIP_VALUE_STYLE;
  protected readonly pointR = POINT_R;
  protected readonly pointRHover = POINT_R_HOVER;
  protected readonly tickLabelX = PAD.l - 8;
  protected readonly pointLabelY = CHART_HEIGHT - 8;
  protected readonly hover = signal<number | null>(null);

  private readonly measured = containerWidth();
  /** Wide first paint, then measured — the narrow branch never flashes. */
  protected readonly width = computed(() => this.measured() ?? ASSUMED_WIDTH);

  /** One series, one colour — `resolveColors` still owns the identity/meaning rule. */
  protected readonly color = computed(() => resolveColors({ slot: this.slot(), tone: this.tone(), count: 1 })[0]);
  /** The area is the series colour at 18% — a tint of the line, never a gradient. */
  protected readonly areaFill = computed(() => `color-mix(in oklab, ${this.color()} 18%, transparent)`);

  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return series ? `${series} — line chart` : 'Line chart';
  });

  private readonly max = computed(() => niceMax(Math.max(0, ...this.values())));
  protected readonly innerWidth = computed(() => Math.max(1, this.width() - PAD.l - PAD.r));
  protected readonly innerHeight = computed(() => Math.max(1, this.height - PAD.t - PAD.b));
  protected readonly baseline = computed(() => PAD.t + this.innerHeight());

  protected readonly gridLines = computed(() => {
    const max = this.max();
    const innerHeight = this.innerHeight();
    const format = this.valueFormatter();
    return ticks(max).map((value) => ({ value, y: lineValueY(value, max, innerHeight), label: format(value) }));
  });

  protected readonly points = computed(() => {
    const values = this.values();
    const max = this.max();
    const innerWidth = this.innerWidth();
    const innerHeight = this.innerHeight();
    const format = this.valueFormatter();
    return values.map((value, index) => ({
      index,
      x: lineX(index, values.length, innerWidth),
      y: lineValueY(value, max, innerHeight),
      label: this.labels()[index] ?? '',
      formatted: format(value),
    }));
  });

  protected readonly polyline = computed(() => linePoints(this.points()));
  protected readonly areaPath = computed(() => lineAreaPath(this.points(), this.baseline()));

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.points()[index] ?? null;
  });

  /** Snaps the crosshair to the point nearest the pointer.
   *  @param event the pointer move over the plot overlay */
  protected onMove(event: MouseEvent): void {
    // Measured against the SVG's box, not the overlay rect's: `point.x` already
    // carries PAD.l, so comparing it to a rect-relative x would snap a whole left
    // pad early. React measures against the rect and has exactly that bug.
    const box = (event.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const index = nearestPointIndex(this.points(), event.clientX - box.left);
    if (index >= 0) this.hover.set(index);
  }
}
