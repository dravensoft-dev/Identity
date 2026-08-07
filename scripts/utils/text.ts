/* Three readings of text a scanner has already matched: where a match sits, and how a pattern
 * that would find one is built. `lineOf` counts newlines before an offset, which is the number
 * a problem line has to carry, since a reader opens the file at a line and never at a byte.
 * `escapeRegExp` was written twice with a byte-identical character class, once beside a glob
 * expansion that knew `**` and once beside one that did not. `globToRegExp` keeps the wider
 * of the two, which is free: a pattern holding no `**` splits into one part and reduces to
 * exactly what the narrower one built. A `*` stops at a separator and `**\/` crosses them. */

export function lineOf(text: string, index: number) {
  return text.slice(0, index).split('\n').length;
}

export function escapeRegExp(text: string) {
  return text.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

export function globToRegExp(pattern: string) {
  const body = pattern
    .split('**/')
    .map((part) => escapeRegExp(part).replace(/\*/g, '[^/]*'))
    .join('(?:.*/)?');
  return new RegExp(`^${body}$`);
}
