/* One spelling of a path a document, a stylesheet or a manifest has to hold. Nineteen sites
 * wrote it and three spelled it differently, two of them `split(sep).join('/')` and one
 * `replace(/\\/g, '/')`, which agree on every platform and still read as two decisions. The
 * conversion is for a path that LEAVES this process: an import specifier, a citation, a key
 * in a stamp file, a name in a problem line. A path handed back to node needs none of it,
 * since node takes a forward slash everywhere, so a call here is a statement that the result
 * is going somewhere a backslash would be wrong rather than merely different. */

import { sep } from 'node:path';

export function toPosix(path: string) {
  return path.split(sep).join('/');
}
