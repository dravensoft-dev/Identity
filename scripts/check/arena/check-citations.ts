/* Holds every .md to the repository paths it names, and to the bare document names too, that
 * second shape being the one a rename rewrites in every import specifier and in no sentence.
 * A match is judged only when it names a FILE, carrying an extension, since prose shortens a
 * path freely (`intro/Arena`) and a shortened one is not a claim; a leading slash is a URL
 * from a site root rather than a repo path; and a `.generated.` name is skipped, because a
 * fresh clone has none. The roots come from the tree rather than a list, so a new top-level
 * directory is covered the day it lands, and finding none of them fails rather than reporting
 * every absolute path missing. EXEMPT carries what is absent on purpose, and a stale entry
 * fails. Use `<Name>` for a metavariable: an `X.prompt.md` reads as a claim. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';

export const SKIPPED_ANYWHERE = new Set(['node_modules', '.git']);

export const SKIPPED_UNDER_FRAMEWORKS = new Set(['dist', 'build', 'vendor']);

export function skips(name: string, relativeDirectory) {
  if (SKIPPED_ANYWHERE.has(name)) return true;
  return SKIPPED_UNDER_FRAMEWORKS.has(name) && relativeDirectory.startsWith('frameworks');
}

export const EXEMPT = new Map([
  ['frameworks/angular/BehaviourDelegated.json',
   'the file records a component one layer lacks, and every component exists in both layers, so '
   + 'it correctly does not exist. The prose that names it says so, and check:behaviour reads it '
   + 'only when present, which is what keeps the next absence loud.'],
]);

const EXTENSION = /\.[A-Za-z0-9]{1,6}$/;
const TRAILING_PUNCTUATION = /[.,;:)]+$/;

export function repoRoots(base = root) {
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !SKIPPED_ANYWHERE.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export function pathPattern(roots: string[]) {
  if (roots.length === 0) return /(?!)/g;
  const alternation = roots.map((name: string) => name.replace(/\./g, '\\.')).join('|');
  return new RegExp(
    `(?<![A-Za-z0-9._/-])(?:${alternation})\\/[A-Za-z0-9._-]+(?:\\/[A-Za-z0-9._-]+)*`,
    'g',
  );
}

export function documents(base = root) {
  const found: string[] = [];
  const walk = (dir: string, relative: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (skips(entry.name, relative)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path, relative ? `${relative}/${entry.name}` : entry.name);
      else if (entry.name.endsWith('.md')) found.push(path);
    }
  };
  walk(base, '');
  return found;
}

export function namesAFile(cited) {
  return EXTENSION.test(cited);
}

export const BARE_DOCUMENT = /(?<![A-Za-z0-9._/-])[A-Za-z][A-Za-z0-9-]*(?:\.[a-z0-9-]+)*\.md\b/g;

export function basenames(base = root) {
  const found = new Set();
  const walk = (dir: string, relative: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skips(entry.name, relative)) continue;
      if (entry.isDirectory()) walk(join(dir, entry.name), relative ? `${relative}/${entry.name}` : entry.name);
      else found.add(entry.name);
    }
  };
  walk(base, '');
  return found;
}

export function bareDocumentProblems(base = root, files = documents(base), names = basenames(base)) {
  const problems = [];
  for (const path of files) {
    const rel = path.slice(base.length + 1);
    for (const [line, text] of readFileSync(path, 'utf8').split('\n').entries()) {
      for (const cited of text.match(BARE_DOCUMENT) ?? []) {
        if (names.has(cited)) continue;
        problems.push(
          `${rel}:${line + 1}: names ${cited}, and no document in the tree is called that. `
          + 'A sibling cited by its bare filename is the one shape a rename rewrites in every '
          + 'import specifier and in no sentence.',
        );
      }
    }
  }
  return problems;
}

export function citationProblems(base = root, files = documents(base), exempt = EXEMPT) {
  const pattern = pathPattern(repoRoots(base));
  const problems = [];
  const met = new Set();
  for (const path of files) {
    const rel = path.slice(base.length + 1);
    for (const [line, text] of readFileSync(path, 'utf8').split('\n').entries()) {
      for (const raw of text.match(pattern) ?? []) {
        const cited = raw.replace(TRAILING_PUNCTUATION, '');
        if (!namesAFile(cited)) continue;
        if (exempt.has(cited)) { met.add(cited); continue; }
        if (cited.includes('.generated.')) continue;
        if (existsSync(join(base, cited))) continue;
        problems.push(`${rel}:${line + 1}: cites ${cited}, and nothing is there`);
      }
    }
  }
  for (const [cited, reason] of exempt) {
    if (met.has(cited)) continue;
    problems.push(
      `EXEMPT names ${cited}, which no document cites any more, so the allowance outlived the `
      + `case it was written for: ${reason}`,
    );
  }
  return problems;
}

export function zeroDocumentProblems(files) {
  return files.length === 0
    ? ['found 0 documents; an empty result set is a failure, not a clean pass, because a walk that '
       + 'reaches nothing reports every path in the tree as valid']
    : [];
}

export function zeroRootProblems(roots: string[]) {
  return roots.length === 0
    ? ['found 0 top-level directories, so nothing would be recognised as a repository path at all. '
       + 'An empty root list fails the other way from an empty document list: the pattern it builds '
       + 'matches every absolute path and reports each one missing']
    : [];
}

function main() {
  const files = documents();
  const problems = [
    ...zeroRootProblems(repoRoots()),
    ...zeroDocumentProblems(files),
    ...citationProblems(root, files),
    ...bareDocumentProblems(root, files),
  ];
  if (problems.length > 0) {
    console.error(`check-citations: ${problems.length} problem(s)\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `check-citations: ${files.length} document(s) cite only paths that exist, `
    + `across ${repoRoots().length} top-level directories, with ${EXEMPT.size} deliberate absence(s) on the record`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
