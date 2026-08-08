/* What a declared spec reaches. A spec naming a directory reaches everything under it, so a
 * declaration reads as prose rather than as a glob nobody checks; a trailing `**` becomes `**\/*`
 * because globToRegExp expands `**\/` and leaves a bare `**` unable to cross a separator, reaching
 * one level and no further. A spec opening with `!` excludes, which lets a node claim a directory
 * of hand-written sources without claiming the generated files beside it. Matching is against a
 * path list and never the filesystem, so one universe answers every node. A spec compiles to a
 * predicate once and is kept: normalising the same spec per candidate path was the whole of what
 * check:graph spent, and one without a glob becomes a startsWith rather than a pattern. resolveSpecs
 * takes paths already relative and posix, as universe() yields them; matchesSpec normalises one. */

import { globToRegExp } from '../utils/text.ts';
import { toPosix } from '../utils/posix-path.ts';

const GLOB = /[*?]/;

const matchers = new Map<string, (path: string) => boolean>();

export function normalizeSpec(spec: string) {
  const posix = toPosix(spec).replace(/^\.\//, '').replace(/\/+$/, '');
  return posix.endsWith('/**') ? `${posix}/*` : posix;
}

export function specMatcher(spec: string) {
  const found = matchers.get(spec);
  if (found) return found;

  const normal = normalizeSpec(spec);
  let test: (path: string) => boolean;
  if (GLOB.test(normal)) {
    const pattern = globToRegExp(normal);
    test = (path) => pattern.test(path);
  } else {
    const under = `${normal}/`;
    test = (path) => path === normal || path.startsWith(under);
  }

  matchers.set(spec, test);
  return test;
}

export const matchesSpec = (spec: string, path: string) =>
  specMatcher(spec)(toPosix(path).replace(/^\.\//, ''));

export const isExclusion = (spec: string) => spec.startsWith('!');

export function partition(specs: string[]) {
  return {
    included: specs.filter((spec) => !isExclusion(spec)),
    excluded: specs.filter(isExclusion).map((spec) => spec.slice(1)),
  };
}

export function resolveSpecs(specs: string[], universe: Iterable<string>) {
  const { included, excluded } = partition(specs);
  const reaches = included.map(specMatcher);
  const refuses = excluded.map(specMatcher);

  const found = [];
  for (const path of universe) {
    if (!reaches.some((test) => test(path))) continue;
    if (refuses.some((test) => test(path))) continue;
    found.push(path);
  }
  return found.sort();
}

export function unreachedSpecs(specs: string[], universe: Iterable<string>) {
  const paths = [...universe];
  return specs.filter((spec) => {
    const reaches = specMatcher(spec.replace(/^!/, ''));
    return !paths.some(reaches);
  });
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
