/* The React layer answers to a compiler. It is the only gate that can catch a component
 * disagreeing with the interface beside it, which is what 54 hand-written .d.ts could not.
 * tsc runs under plain node, so unlike check:demos and check:vendor this gate never skips. */

import { fileURLToPath } from 'node:url';
import { typecheck, zeroProjectProblems } from '../../lib/arena/typecheck.ts';

export const PROJECTS = [
  { project: 'frameworks/react/tsconfig.check.json', reaches: 'every component, helper and suite in the layer' },
];

function main() {
  const empty = zeroProjectProblems(PROJECTS.length);
  for (const problem of empty) console.error(`check-react-types: ${problem}`);
  if (empty.length) process.exit(1);

  for (const { project, reaches } of PROJECTS) {
    let result;
    try {
      result = typecheck({ project });
    } catch (err) {
      console.error(`check-react-types: ${err.message}`);
      process.exit(1);
    }
    const { status, output } = result;
    if (status !== 0) {
      console.error(`check-react-types: ${project} does not typecheck — it reaches ${reaches}\n`);
      console.error(output.trim());
      process.exit(1);
    }
  }
  console.log(`check-react-types: ${PROJECTS.length} project(s) typecheck under strict`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
