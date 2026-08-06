/* How scripts/ names its own parts: the five domains it sorts by, which of them a test
 * file belongs to, and what counts as a script or a suite. It opens no file, so a caller
 * can classify a path absent from this machine: a junit report names files a runner wrote.
 * A report may name them absolutely, so the anchor is searched for and the LAST one wins,
 * or a checkout under a directory called scripts decides every path. The extensions live
 * here, not in each of the four scanners, because a suffix one stops recognising is a file
 * that quietly leaves its scope. A suite is TypeScript and can earn no exception, nothing
 * loading one. A script may be JavaScript only if STAYS_JAVASCRIPT names it, and it is
 * still scanned, since those two have specifiers that must resolve like any other's. */

export const DOMAINS = ['core', 'react', 'angular', 'tailwind', 'arena'];

const PHASES = ['build', 'generate', 'check', 'lib', 'ci'];

export const SUITE_EXTENSIONS = ['.ts'];

export const SCRIPT_EXTENSIONS = ['.ts', '.mjs'];

export const STAYS_JAVASCRIPT = new Map([
  ['scripts/lib/core/validate-palette.mjs',
   'vendored verbatim from the dataviz Agent Skill and re-vendored rather than patched, so it '
   + 'can carry no annotation: editing one threshold invalidates published measurements'],
  ['scripts/generate/core/arena-to-prod/validate-palette.mjs',
   'the copy that ships inside both npm packages, which palette-keys.test.ts holds byte-equal '
   + 'to the one above, so it is the same file and takes the same answer'],
]);

export const isSuite = (name) => SUITE_EXTENSIONS.some((ext) => name.endsWith(`.test${ext}`));

export const isScript = (name) =>
  SCRIPT_EXTENSIONS.some((ext) => name.endsWith(ext)) && !isSuite(name);

function classify(segments, i) {
  if (segments[i] === 'scripts' && PHASES.includes(segments[i + 1]) && DOMAINS.includes(segments[i + 2])) {
    return segments[i + 2];
  }
  if (segments[i] === 'frameworks' && DOMAINS.includes(segments[i + 1])) return segments[i + 1];
  return null;
}

export function domainOfTestPath(path) {
  const segments = String(path).split(/[\\/]+/).filter((s) => s !== '' && s !== '.');
  for (let i = segments.length - 1; i >= 0; i--) {
    const domain = classify(segments, i);
    if (domain) return domain;
  }
  return null;
}
