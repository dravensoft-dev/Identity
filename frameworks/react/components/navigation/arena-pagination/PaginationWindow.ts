import { limitPaginationSiblings } from '../../../Tokens.generated.js';

const threshold = () => 2 * limitPaginationSiblings + 5;

export function arenaPageWindow(current: number, total: number): (number | string)[] {
  if (total <= threshold()) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | string)[] = [1];
  const from = Math.max(2, current - limitPaginationSiblings);
  const to = Math.min(total - 1, current + limitPaginationSiblings);
  if (from > 2) out.push('…');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
}
