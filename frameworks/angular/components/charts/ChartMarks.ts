import type { ArenaLinePoint } from './ChartScales';

export function arenaBarPath(x: number, w: number, yValue: number, yZero: number, r: number): string {
  const top = Math.min(yValue, yZero);
  const bottom = Math.max(yValue, yZero);
  const rr = Math.max(0, Math.min(r, w / 2, bottom - top));
  if (yValue > yZero) {
    return `M${x},${top} L${x},${bottom - rr} Q${x},${bottom} ${x + rr},${bottom}`
      + ` L${x + w - rr},${bottom} Q${x + w},${bottom} ${x + w},${bottom - rr} L${x + w},${top} Z`;
  }
  return `M${x},${bottom} L${x},${top + rr} Q${x},${top} ${x + rr},${top}`
    + ` L${x + w - rr},${top} Q${x + w},${top} ${x + w},${top + rr} L${x + w},${bottom} Z`;
}

export function arenaArcPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    return `${arenaArcPath(cx, cy, rOuter, rInner, a0, mid)} ${arenaArcPath(cx, cy, rOuter, rInner, mid, a1)}`;
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const pt = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = pt(rOuter, a0);
  const [x1, y1] = pt(rOuter, a1);
  const [x2, y2] = pt(rInner, a1);
  const [x3, y3] = pt(rInner, a0);
  return `M${x0},${y0} A${rOuter},${rOuter} 0 ${large} 1 ${x1},${y1}`
    + ` L${x2},${y2} A${rInner},${rInner} 0 ${large} 0 ${x3},${y3} Z`;
}

export function arenaLinePoints(points: readonly ArenaLinePoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export function arenaLineAreaPath(points: readonly ArenaLinePoint[], baseline: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const line = points.map((point) => `${point.x},${point.y}`).join(' L');
  return `M${first.x},${baseline} L${line} L${last.x},${baseline} Z`;
}
