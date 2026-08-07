export interface ArenaLinePoint {
  x: number;
  y: number;
}

export interface ArenaDoughnutSlice {
  index: number;
  from: number;
  to: number;
  share: number;
  percent: number;
}

export interface ArenaLinearScale {
  min: number;
  max: number;
  from: number;
  to: number;
}

export interface ArenaDomain {
  min: number;
  max: number;
  step: number;
}

export interface ArenaBandScale {
  start: number;
  step: number;
  band: number;
  count: number;
}

export interface ArenaPointScale {
  start: number;
  span: number;
  step: number;
  count: number;
}

export function arenaLinearScale(min: number, max: number, from: number, to: number): ArenaLinearScale {
  return { min, max, from, to };
}

export function arenaScaleValue(scale: ArenaLinearScale, value: number): number {
  const span = scale.max - scale.min;
  if (span === 0) return scale.from;
  return scale.from + (scale.to - scale.from) * ((value - scale.min) / span);
}

export function arenaScaleInvert(scale: ArenaLinearScale, px: number): number {
  const span = scale.to - scale.from;
  if (span === 0) return scale.min;
  return scale.min + (scale.max - scale.min) * ((px - scale.from) / span);
}

export function arenaScaleZero(scale: ArenaLinearScale): number {
  return arenaScaleValue(scale, 0);
}

export function arenaNiceMax(max: number): number {
  if (!(max > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export function arenaNiceDomain(min: number, max: number, count = 4): ArenaDomain {
  if (min >= 0) {
    const nice = arenaNiceMax(max);
    return { min: 0, max: nice, step: nice / count };
  }
  const step = arenaNiceMax(Math.max(-min, max)) / count;
  return {
    min: -Math.ceil(-min / step) * step,
    max: Math.ceil(Math.max(0, max) / step) * step,
    step,
  };
}

export function arenaValuesDomain(values: readonly number[], count = 4): ArenaDomain {
  let min = 0;
  let max = 0;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return arenaNiceDomain(min, max, count);
}

export function arenaDomainTicks(domain: ArenaDomain): number[] {
  const steps = Math.round((domain.max - domain.min) / domain.step);
  return Array.from({ length: steps + 1 }, (_, index) => domain.min + domain.step * index);
}

export function arenaBandScale(count: number, start: number, span: number, gap: number): ArenaBandScale {
  const step = span / Math.max(1, count);
  return { start, step, band: Math.max(1, step - gap), count };
}

export function arenaBandStart(scale: ArenaBandScale, index: number): number {
  return scale.start + index * scale.step;
}

export function arenaBandMark(scale: ArenaBandScale, index: number): number {
  return arenaBandStart(scale, index) + (scale.step - scale.band) / 2;
}

export function arenaBandCenter(scale: ArenaBandScale, index: number): number {
  return arenaBandStart(scale, index) + scale.step / 2;
}

export function arenaPointScale(count: number, start: number, span: number): ArenaPointScale {
  return { start, span, step: count <= 1 ? 0 : span / (count - 1), count };
}

export function arenaPointAt(scale: ArenaPointScale, index: number): number {
  if (scale.count <= 1) return scale.start + scale.span / 2;
  return scale.start + scale.step * index;
}

export function arenaNearestPointIndex(points: readonly ArenaLinePoint[], x: number): number {
  let best = -1;
  let nearest = Infinity;
  points.forEach((point, index) => {
    const distance = Math.abs(point.x - x);
    if (distance < nearest) {
      best = index;
      nearest = distance;
    }
  });
  return best;
}

export function arenaDoughnutSlices(values: readonly number[]): ArenaDoughnutSlice[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  let angle = -Math.PI / 2;
  return values.map((value, index) => {
    const share = total > 0 ? Math.max(0, value) / total : 0;
    const from = angle;
    const to = angle + share * Math.PI * 2;
    angle = to;
    return { index, from, to, share, percent: Math.round(share * 100) };
  });
}
