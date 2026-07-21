import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { containerWidth } from '../container-size';
import { CHART_HEIGHT, SR_ONLY, arcPath, resolveColors } from '../chart-internals';

/** The plot width assumed for the first paint, before `containerWidth()` has
 *  measured anything. Wide on purpose — a chart that starts narrow and widens
 *  flashes, where one that starts wide and settles does not. */
const ASSUMED_WIDTH = 600;

/** The ring starts at 12 o'clock. SVG angles run from 3 o'clock, so a quarter turn
 *  back is where a reader expects a part-of-a-whole to begin. */
const START_ANGLE = -Math.PI / 2;

/** The legend column's width in px: 34% of the container, clamped. Below the floor
 *  the labels ellipsis away to nothing; above the ceiling the ring starves. These
 *  are SVG-adjacent layout arithmetic on a measured pixel width, not CSS lengths on
 *  Arena's dimension scale — `DoughnutChart.jsx` writes the same three numbers. */
const LEGEND_MIN = 120;
const LEGEND_MAX = 180;
const LEGEND_SHARE = 0.34;

/** The flex gap between the ring and the legend, in px. The SVG is sized in user
 *  units, so the gap has to be subtracted from the plot as a number — it is the
 *  pixel value of the host's own `calc(var(--sp-1) * 4)`, and the two move together. */
const LEGEND_GAP = 16;

/** How far the ring's outer edge sits inside the plot box, in px. Breathing room so a
 *  slice's stroke is not clipped by the SVG's own edge. */
const RING_INSET = 8;

/** The hole, as a fraction of the outer radius. A doughnut rather than a pie: the hole
 *  is what the centre percentage is read in, and it stops the smallest slices being
 *  compared by area alone. */
const INNER_RATIO = 0.62;

/** What an un-hovered slice fades to while a sibling is hovered. Opacity, not colour —
 *  the identity ramp must stay the identity ramp. */
const DIM_OPACITY = 0.55;

/* Every static style below is a camelCase object bound with `[style]`, never a
 * `style="a-b:c"` string in the template, for the reason bar-chart.ts and line-chart.ts
 * both record at length: check-dimension-literals.mjs finds a governed property by an
 * unbroken run of letters before a colon, so a kebab-case declaration in a template
 * string is either invisible to it (`font-size:` reads as a property named `size`) or
 * actively misread (`stroke-width:` reads as `width`, then runs the value scan off into
 * the rest of the template). An object gives the gate the same view of this component
 * that it has of React's `DoughnutChart.jsx`, where every one of these is an inline
 * style object key. This chart carries more of them than the other two, because its
 * legend is markup rather than SVG. */

/** The ring's own box. `flexShrink: 0` keeps the legend from squeezing the plot below
 *  the width its geometry was computed against. */
const SVG_STYLE = { display: 'block', flexShrink: '0' } as const satisfies Readonly<Record<string, string>>;

/** A slice. Opacity only, so there is no movement for `prefers-reduced-motion` to
 *  reduce. The stroke is the card surface showing through between slices rather than a
 *  border on them, which is why its colour is `--surface-card` and its weight is the
 *  strong border width. */
const SEGMENT_STYLE = {
  transition: 'opacity var(--dur-fast) var(--ease-out)', strokeWidth: 'var(--bw-strong)',
} as const satisfies Readonly<Record<string, string>>;

/** The hovered slice's percentage, read in the hole, in mono so it does not jitter
 *  between hovers. */
const CENTRE_LABEL_STYLE = { fontSize: 'var(--dz-text-lg)' } as const satisfies Readonly<Record<string, string>>;

/** The legend column. Not optional: slices are categories, and identity is never colour
 *  alone. `overflow: auto` so a long list scrolls rather than escaping the chart's height —
 *  which is why the element carries `tabindex="0"`/`role="group"`/`aria-label` in the
 *  template: a scrollable region nothing else can focus is unreachable by a keyboard user
 *  (WCAG 2.1.1), the same failure a `tabindex`-less `overflow: auto` box always is. */
const LEGEND_STYLE = {
  flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column',
  justifyContent: 'center', gap: 'calc(var(--sp-1) * 1.5)', overflow: 'auto',
} as const satisfies Readonly<Record<string, string>>;

/** One legend row: swatch, label, value. `opacity` is bound separately, because it is
 *  the only part of the row that depends on the hover. */
const LEGEND_ROW_STYLE = {
  display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)',
} as const satisfies Readonly<Record<string, string>>;

/** The colour chip. `background` is bound separately — it is the slice's own identity
 *  colour, and it is the whole point of the row. */
const SWATCH_STYLE = {
  width: 'calc(var(--sp-1) * 2.5)', height: 'calc(var(--sp-1) * 2.5)',
  borderRadius: 'var(--r-xs)', flexShrink: '0',
} as const satisfies Readonly<Record<string, string>>;

/** The category name, which takes the row's free space and ellipsises rather than
 *  wrapping — a wrapped legend row stops lining up with its swatch. */
const LEGEND_LABEL_STYLE = {
  flex: '1', minWidth: '0', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)',
  color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
} as const satisfies Readonly<Record<string, string>>;

/** The formatted value, in mono so digits align down the column. */
const LEGEND_VALUE_STYLE = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)',
} as const satisfies Readonly<Record<string, string>>;

/** One slice's share of the whole, as angles and as a percentage. */
export interface ArenaDoughnutSlice {
  /** The slice's 0-based position in `values`, which is also its ramp slot order. */
  index: number;
  /** Start angle in radians, 0 = 3 o'clock. */
  from: number;
  /** End angle in radians, always >= `from`. */
  to: number;
  /** The slice's fraction of the total, in `[0, 1]`. */
  share: number;
  /** `share` as whole percent, for the centre label. */
  percent: number;
}

/** Accumulates `values` into slices around the ring, clockwise from 12 o'clock.
 *  Negative values are floored at zero rather than sweeping backwards, and a total of
 *  zero yields zero-width slices rather than dividing by it — a chart of nothing paints
 *  nothing instead of throwing.
 *  @param values one number per category @returns one slice per value, in input order */
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

/** The legend column's width for a measured container width: a share of it, clamped
 *  between a floor that still fits a label and a ceiling that leaves the ring room.
 *  @param width the container's measured width in px @returns the legend width in px */
export function doughnutLegendWidth(width: number): number {
  return Math.min(LEGEND_MAX, Math.max(LEGEND_MIN, width * LEGEND_SHARE));
}

/** What is left for the ring once the legend and the gap between them are taken out.
 *  Never below 1px, so an SVG in a container narrower than its own legend still has a
 *  positive width rather than an invalid one.
 *  @param width the container's measured width in px @returns the plot width in px */
export function doughnutPlotWidth(width: number): number {
  return Math.max(1, width - doughnutLegendWidth(width) - LEGEND_GAP);
}

/** The ring's two radii. The outer fits the smaller of the plot's two axes, inset so the
 *  stroke is not clipped; the inner is a fixed fraction of it, so the hole scales with
 *  the ring instead of swallowing it at small sizes.
 *  @param plotWidth the plot width in px @param height the plot height in px
 *  @returns the outer and inner radii in px, both > 0 */
export function doughnutRadii(plotWidth: number, height: number): { outer: number; inner: number } {
  const outer = Math.max(1, Math.min(plotWidth, height) / 2 - RING_INSET);
  return { outer, inner: outer * INNER_RATIO };
}

/** Parts of one whole. Slices ARE categories, so this chart carries identity only —
 *  there is no `tone` input, because a slice cannot be a status. Colours come from the
 *  categorical ramp in order and are never cycled. One of the three hand-written SVG
 *  charts, so unlike every other primitive in this layer it carries styling of its own:
 *  a chart's visual identity is path data and presentation attributes, which a class
 *  string cannot hold. Every value in it is still a token.
 *
 *  The host is the box `containerWidth()` measures AND the row that lays the ring out
 *  beside its legend, so it declares `display:flex` explicitly rather than wrapping a
 *  flex `<div>` inside itself: `<arena-doughnut-chart>` is an unknown element whose UA
 *  default is `display:inline`, and a non-replaced inline box has no content width for a
 *  `ResizeObserver` to report — the ring would be laid out against the wrong number. A
 *  wrapper would have measured the host while laying out the wrapper, which is the same
 *  bug one element further away. `position:relative` is kept because the visually-hidden
 *  numbers table is absolutely positioned and must be contained here. This is the same
 *  hazard the manifest-driven display utility guards for every other primitive; a chart
 *  has no manifest, so it states the display itself. */
@Component({
  selector: 'arena-doughnut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:flex;position:relative;width:100%;gap:calc(var(--sp-1) * 4)',
    '[style.height.px]': 'height',
  },
  template: `
    <svg [attr.width]="plotWidth()" [attr.height]="height" role="img" aria-label="Doughnut chart"
         [style]="svgStyle" (mouseleave)="hover.set(null)">
      @for (segment of segments(); track segment.index) {
        @if (segment.path) {
          <path [attr.d]="segment.path" [attr.fill]="segment.color" stroke="var(--surface-card)"
                [attr.opacity]="hover() === null || hover() === segment.index ? 1 : dimOpacity"
                (mouseenter)="hover.set(segment.index)" [style]="segmentStyle" />
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
             (mouseenter)="hover.set(segment.index)" (mouseleave)="hover.set(null)">
          <span aria-hidden="true" [style]="swatchStyle" [style.background]="segment.color"></span>
          <span [style]="legendLabelStyle">{{ segment.label }}</span>
          <span [style]="legendValueStyle">{{ segment.formatted }}</span>
        </div>
      }
    </div>

    <table [style]="srOnly">
      <caption>Doughnut chart</caption>
      <thead><tr><th>Category</th><th>Value</th></tr></thead>
      <tbody>
        @for (segment of segments(); track segment.index) {
          <tr><th scope="row">{{ segment.label }}</th><td>{{ segment.formatted }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class DoughnutChart {
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly slots = input<number[]>();
  readonly valueFormatter = input<(value: number) => string>((value) => String(value));

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

  private readonly measured = containerWidth();
  /** Wide first paint, then measured — the narrow branch never flashes. */
  private readonly width = computed(() => this.measured() ?? ASSUMED_WIDTH);

  protected readonly plotWidth = computed(() => doughnutPlotWidth(this.width()));
  protected readonly centreX = computed(() => this.plotWidth() / 2);
  protected readonly centreY = computed(() => this.height / 2);

  protected readonly segments = computed(() => {
    const values = this.values();
    // Identity only — slices ARE categories. `resolveColors` assigns the ramp in order
    // and never cycles it; a ninth slice folds to "Other" rather than reusing slot 1.
    const colors = resolveColors({
      slots: this.slots() ?? values.map((_, index) => index + 1),
      count: values.length,
    });
    const format = this.valueFormatter();
    const centreX = this.centreX();
    const centreY = this.centreY();
    const { outer, inner } = doughnutRadii(this.plotWidth(), this.height);
    return doughnutSlices(values).map((slice) => ({
      ...slice,
      color: colors[slice.index],
      label: this.labels()[slice.index] ?? '',
      formatted: format(values[slice.index]),
      path: slice.to > slice.from ? arcPath(centreX, centreY, outer, inner, slice.from, slice.to) : '',
    }));
  });

  protected readonly active = computed(() => {
    const index = this.hover();
    return index === null ? null : this.segments()[index] ?? null;
  });
}
