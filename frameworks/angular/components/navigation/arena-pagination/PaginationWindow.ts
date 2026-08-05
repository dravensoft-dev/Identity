import { limitPaginationSiblings } from '../../../Tokens.generated';

export const ELLIPSIS = '…';

export type PageSlot = number | typeof ELLIPSIS;

const threshold = () => 2 * limitPaginationSiblings + 5;

export function arenaPageWindow(current: number, total: number): readonly PageSlot[] {
  if (total <= threshold()) return Array.from({ length: total }, (_, i) => i + 1);
  const out: PageSlot[] = [1];
  const from = Math.max(2, current - limitPaginationSiblings);
  const to = Math.min(total - 1, current + limitPaginationSiblings);
  if (from > 2) out.push(ELLIPSIS);
  for (let page = from; page <= to; page++) out.push(page);
  if (to < total - 1) out.push(ELLIPSIS);
  out.push(total);
  return out;
}
