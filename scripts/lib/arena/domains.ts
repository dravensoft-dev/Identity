/* How scripts/ names its own parts: the five domains it sorts by, which of them a test
 * file belongs to, and what counts as a script or a suite in the first place. It is
 * arena because it speaks about every layer and the repository root, and it opens no
 * file, so a caller can classify a path that does not exist on this machine: a junit
 * report names files a runner wrote, read where they no longer are. A report may name
 * them absolutely, so the anchor is searched for rather than assumed at index 0 and the
 * LAST one wins, or a checkout under a directory called scripts decides every path.
 * SCRIPT_EXTENSIONS is here rather than in each of the three scanners because a suffix
 * one of them stops recognising is a file that quietly leaves its scope, which is the
 * one failure this migration can take in silence. */

export const DOMAINS = ['core', 'react', 'angular', 'tailwind', 'arena'];

const PHASES = ['build', 'generate', 'check', 'lib', 'ci'];

export const SCRIPT_EXTENSIONS = ['.mjs', '.ts'];

export const isSuite = (name) => SCRIPT_EXTENSIONS.some((ext) => name.endsWith(`.test${ext}`));

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
