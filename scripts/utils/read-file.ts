/* Two reads, and nothing about Arena. `readJson` is the one-liner fifty-odd sites wrote, with
 * the name of the file added to the failure: JSON.parse reports "Unexpected token" and names
 * nothing, so a gate reading forty-three manifests in a loop dies naming none of them, while
 * readFileSync already names what it could not open. It hands back `any` and not a type
 * parameter defaulting to it, because a bare call in a contextual position infers `unknown`
 * rather than the default and every such site then needs a cast: `any` is what JSON.parse
 * itself returns, so a caller that states a shape gets it from its own annotation and one that
 * states none is exactly where it was. `readIfExists` keeps its existsSync rather than catching
 * ENOENT, so a document that is not there and one that cannot be read stay two answers. */

import { existsSync, readFileSync } from 'node:fs';

export function readJson(path: string): any {
  const source = readFileSync(path, 'utf8');
  try {
    return JSON.parse(source);
  } catch (err) {
    throw new Error(`${path}: ${(err as Error).message}`, { cause: err });
  }
}

export function readIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}
