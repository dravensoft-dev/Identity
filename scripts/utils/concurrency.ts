/* Running a bounded number of things at once, and choosing what goes first. Both were already
 * generic and both were exported from inside a gate, which is what makes this a move rather
 * than an extraction: a second gate wanting either had to import a gate, and `lib/` is the only
 * direction this tree allows. `mapWithConcurrency` indexes its results rather than pushing
 * them, so the answer is in input order however the calls settled, which is what lets a caller
 * compare its output against a sorted list. `interleaveForDispatch` reads a row-major list back
 * column-major, so items that were adjacent do not land in the same first wave: that is for a
 * queue whose neighbours cost the same, where the wave would otherwise be the slowest group. */

export async function mapWithConcurrency<T, R>(items: T[], limit: number,
  fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      const item = items[index];
      if (item !== undefined) results[index] = await fn(item);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

export function interleaveForDispatch<T>(items: T[], groups: number): T[] {
  const width = Math.max(1, Math.min(groups, items.length || 1));
  const rows: T[][] = Array.from({ length: width }, (): T[] => []);
  items.forEach((item, i) => rows[i % width]?.push(item));
  return rows.flat();
}
