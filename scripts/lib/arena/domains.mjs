/* The five names scripts/ sorts itself by, and the one function that decides which
 * of them a test file belongs to. It is arena because it speaks about every layer
 * and about the repository root, and it opens no file, so a caller can classify a
 * path that does not exist on this machine: a junit report names files a runner
 * wrote, and the summary is read where they no longer are. A report may also name
 * them absolutely, so the anchor segment is searched for rather than assumed at
 * index 0, and the LAST anchor wins: a checkout under a directory called scripts
 * would otherwise decide every path in the run. */

export const DOMAINS = ['core', 'react', 'angular', 'tailwind', 'arena'];

const PHASES = ['build', 'generate', 'check', 'lib', 'ci'];

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
