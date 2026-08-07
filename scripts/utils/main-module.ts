/* Whether this module is the program, for the sixty-one scripts that ask. The comparison is
 * process.argv[1] against import.meta.url and never the module's own filename, because a gate
 * matching its own name stops running the day it is renamed, exits 0 having read nothing, and
 * check-all reports that as PASS. The copies had already drifted: sixty compared the two paths
 * raw and one resolved argv[1] through realpathSync first, which is what a symlinked entry
 * needs and what an npm bin/ link is. This takes the union, so neither copy loses anything:
 * the raw comparison answers first, and only a mismatch is retried through realpathSync on
 * both sides, where a symlink can turn a missed match into a found one and never the reverse.
 * An argv[1] that resolves to nothing is not this module, rather than a throw at import. */

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isMainModule(moduleUrl: string) {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  const self = fileURLToPath(moduleUrl);
  if (entry === self) return true;
  try {
    return realpathSync(entry) === realpathSync(self);
  } catch {
    return false;
  }
}
