/* Two reads, and nothing about Arena. `readJson` is the one-liner fifty-odd sites wrote, with
 * the name of the file added to the failure: JSON.parse reports "Unexpected token" and names
 * nothing, so a gate reading forty-three manifests in a loop dies naming none of them, while
 * readFileSync already names what it could not open. It hands back `any` because that is what
 * JSON.parse hands back and what every one of those callers consumes; the type parameter is
 * for the ones that state a shape, which then need no cast at all. `readIfExists` keeps its
 * existsSync rather than catching ENOENT, so a document that is not there and one that cannot
 * be read stay two different answers instead of one null. */

import { existsSync, readFileSync } from 'node:fs';

export function readJson<T = any>(path: string): T {
  const source = readFileSync(path, 'utf8');
  try {
    return JSON.parse(source) as T;
  } catch (err) {
    throw new Error(`${path}: ${(err as Error).message}`, { cause: err });
  }
}

export function readIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}
