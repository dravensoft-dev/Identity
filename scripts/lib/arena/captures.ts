/* One read of a regex capture group, for the parsers under `scripts/` that match first and
 * read after. `noUncheckedIndexedAccess` types `m[1]` as possibly-undefined even where the
 * pattern guarantees the group, and the alternative at every one of those sites is `?? ''`,
 * which turns a regex that has lost a capture into an empty string nobody ever sees. This
 * throws instead, naming the group and what did match, so an edit that drops a capture fails
 * at the read rather than three functions downstream. `captured` also accepts the match
 * itself being null, for the callers with nothing more specific to say about a miss; a caller
 * whose failure deserves its own message should still test the match and throw its own. */

export function captured(match: RegExpMatchArray | RegExpExecArray | null, index = 1): string {
  const value = match?.[index];
  if (value === undefined) {
    throw new Error(match
      ? `captured: group ${index} of "${match[0]}" did not capture, so the pattern lost it`
      : `captured: group ${index} was read off a match that never happened`);
  }
  return value;
}
