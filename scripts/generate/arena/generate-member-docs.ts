/* Writes each contracted member's `description` into both layers' own TypeScript, above the
 * member it describes, so tsc and ng-packagr carry it into what a consumer's editor reads.
 * Nothing here transforms an emitted declaration: the fix is source, and the compiler does the
 * rest. check-api.ts then holds every block equal to its contract, so the copy cannot rot. */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { docComment } from './generate-api-types.ts';
import { normaliseDoc } from '../../lib/arena/api-surface.ts';
import { memberEntries } from '../../lib/arena/contract-shapes.ts';
import type { ContractCandidate } from '../../lib/arena/contract-shapes.ts';

export const MEMBER_START = {
  react: /^(\s*)([A-Za-z_$][\w$]*)(\??\s*:)/,
  angular: /^(\s*)(?:readonly\s+)([A-Za-z_$][\w$]*)(\s*=)/,
};

export function stripDocAbove(lines: string[], at: number) {
  let start = at;
  while (start > 0 && lines[start - 1].trim().startsWith('*')) start -= 1;
  if (start > 0 && lines[start - 1].trim().startsWith('/**')) return start - 1;
  const single = lines[at - 1]?.trim();
  if (single && single.startsWith('/**') && single.endsWith('*/')) return at - 1;
  return at;
}

export const PACKED_MEMBERS = /^(\s*)((?:[A-Za-z_$][\w$]*\??\s*:\s*[^;{}]+;\s*){2,})$/;

export function unpackMembers(source: string) {
  return source.split('\n').flatMap((line) => {
    const packed = PACKED_MEMBERS.exec(line);
    if (!packed) return [line];
    return packed[2].trim().split(';').filter((d) => d.trim()).map((d) => `${packed[1]}${d.trim()};`);
  }).join('\n');
}

export const REACT_PROPS_OPEN = /^export interface \w+Props\b[^{]*\{/;

export function applyDocs(source: string, docs, layer: string) {
  const lines = (layer === 'react' ? unpackMembers(source) : source).split('\n');
  const out = [];
  let reachable = layer !== 'react';
  for (let i = 0; i < lines.length; i += 1) {
    if (layer === 'react') {
      if (REACT_PROPS_OPEN.test(lines[i])) reachable = true;
      else if (reachable && /^\}/.test(lines[i])) reachable = false;
    }
    const match = reachable ? MEMBER_START[layer].exec(lines[i]) : null;
    const wanted = match ? docs.get(match[2]) : undefined;
    if (!match || wanted === undefined) { out.push(lines[i]); continue; }

    const from = stripDocAbove(lines, i);
    out.length -= (i - from);
    out.push(docComment(wanted, match[1]));
    out.push(lines[i]);
  }
  return out.join('\n');
}

export function docsFor(contract: ContractCandidate, layer: string, bindingName) {
  const docs = new Map();
  for (const [name, spec] of memberEntries(contract.api)) {
    if (!spec.description) continue;
    docs.set(bindingName(name, spec.form, layer), normaliseDoc(spec.description));
  }
  return docs;
}

export function writeMemberDocs({
  contracts, sources, bindingName,
  read = readFileSync as (path: string, encoding: string) => string,
  write = writeFileSync as (path: string, text: string) => void,
}) {
  const written = [];
  for (const contract of contracts) {
    const perLayer = Object.entries(sources.get(contract.component) ?? {}) as [string, string][];
    for (const [layer, path] of perLayer) {
      if (!path) continue;
      const before = read(path, 'utf8');
      const after = applyDocs(before, docsFor(contract, layer, bindingName), layer);
      if (after !== before) { write(path, after); written.push(path); }
    }
  }
  return written;
}

export function componentSources(resolveReact, resolveAngular, readLayer, exists) {
  const react = resolveReact(readLayer('react'), exists).implementations;
  const angular = resolveAngular(readLayer('angular'), exists).implementations;
  const sources = new Map();
  for (const [name, path] of react) sources.set(name, { react: join(root, path) });
  for (const [name, path] of angular) {
    sources.set(name, { ...(sources.get(name) ?? {}), angular: join(root, path) });
  }
  return sources;
}

async function main() {
  const { existsSync, readdirSync } = await import('node:fs');
  const { bindingName, resolveReactImplementations, resolveAngularImplementations } =
    await import('../../check/arena/check-api.ts');
  const { readLayer } = await import('../../lib/arena/layers.ts');

  const dir = join(root, 'contracts/api/components');
  const contracts = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

  const sources = componentSources(
    resolveReactImplementations, resolveAngularImplementations, readLayer,
    (path: string) => existsSync(join(root, path)),
  );
  const written = writeMemberDocs({ contracts, sources, bindingName });
  for (const path of written) console.log(`generate-member-docs: wrote ${path.replace(`${root}/`, '')}`);
  console.log(`generate-member-docs: ${written.length} source(s) updated`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
