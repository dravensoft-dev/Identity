/* What a declared spec reaches. A spec naming a directory reaches everything under it, so a
 * declaration reads as prose rather than as a glob nobody checks; a trailing `**` is rewritten to
 * `**\/*` because globToRegExp expands `**\/` and leaves a bare `**` unable to cross a separator,
 * which would silently reach one level and no further. A spec opening with `!` excludes, which is
 * what lets a node claim a directory of hand-written sources without claiming the generated files
 * sitting beside them. Matching is against a path list and never the filesystem, so one universe
 * answers every node and a spec that reaches nothing is a fact the caller can report rather than
 * an empty walk nobody sees. */

import { globToRegExp } from '../utils/text.ts';
import { toPosix } from '../utils/posix-path.ts';

const GLOB = /[*?]/;

const compiled = new Map<string, RegExp>();

export function normalizeSpec(spec: string) {
  const posix = toPosix(spec).replace(/^\.\//, '').replace(/\/+$/, '');
  return posix.endsWith('/**') ? `${posix}/*` : posix;
}

function specRegExp(spec: string) {
  const found = compiled.get(spec);
  if (found) return found;
  const built = globToRegExp(spec);
  compiled.set(spec, built);
  return built;
}

export function matchesSpec(spec: string, path: string) {
  const normal = normalizeSpec(spec);
  const target = toPosix(path).replace(/^\.\//, '');
  if (!GLOB.test(normal)) return target === normal || target.startsWith(`${normal}/`);
  return specRegExp(normal).test(target);
}

export const isExclusion = (spec: string) => spec.startsWith('!');

export function partition(specs: string[]) {
  return {
    included: specs.filter((spec) => !isExclusion(spec)),
    excluded: specs.filter(isExclusion).map((spec) => spec.slice(1)),
  };
}

export function resolveSpecs(specs: string[], universe: Iterable<string>) {
  const { included, excluded } = partition(specs);
  const found = [];
  for (const path of universe) {
    if (!included.some((spec) => matchesSpec(spec, path))) continue;
    if (excluded.some((spec) => matchesSpec(spec, path))) continue;
    found.push(toPosix(path));
  }
  return found.sort();
}

export function unreachedSpecs(specs: string[], universe: Iterable<string>) {
  const paths = [...universe];
  return specs.filter((spec) => !paths.some((path) => matchesSpec(spec.replace(/^!/, ''), path)));
}

export function globFreePrefix(spec: string) {
  const parts = normalizeSpec(spec.replace(/^!/, '')).split('/');
  const at = parts.findIndex((part) => GLOB.test(part));
  return (at === -1 ? parts.slice(0, -1) : parts.slice(0, at)).join('/');
}

export function reachesNoDirectory(spec: string, universe: Iterable<string>) {
  const prefix = globFreePrefix(spec);
  if (prefix === '') return false;
  return ![...universe].some((path) => matchesSpec(prefix, path));
}
