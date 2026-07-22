import { limitPaginationSiblings } from '../../tokens.generated.js';

/* How many slots the elided form occupies: first + last + the current page and
 * its siblings on each side + two ellipses. Derived, never authored -- widen
 * --limit-pagination-siblings and the threshold must widen with it, or the
 * elided form is briefly WIDER than the full one it replaces. */
const threshold = () => 2 * limitPaginationSiblings + 5;

/** The page numbers to render, with '…' where the list elides.
 *  @param {number} current 1-based
 *  @param {number} total
 *  @returns {Array<number|'…'>} */
export function pageWindow(current, total) {
  if (total <= threshold()) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const from = Math.max(2, current - limitPaginationSiblings);
  const to = Math.min(total - 1, current + limitPaginationSiblings);
  if (from > 2) out.push('…');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
}
