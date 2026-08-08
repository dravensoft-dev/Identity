/* A gate, so it is in GATES and takes an npm script whose prefix names this phase. What it
 * asserts lives in scripts/graph/graph-problems.ts, with the rest of the graph. */

import { isMainModule } from '../../utils/main-module.ts';
import { graphProblems } from '../../graph/graph-problems.ts';
import { NOT_YET_SUBSCRIBED, NEVER_SUBSCRIBES } from '../../graph/nodes.ts';

async function main() {
  const { problems, notes, nodes, edges } = await graphProblems();

  for (const note of notes) console.log(`check-graph: ${note}`);

  if (problems.length > 0) {
    console.error(`check-graph: ${problems.length} problem(s) with the declared graph\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(
    `check-graph: ${nodes.length} node(s), ${edges} edge(s), every subscription carried by an `
    + `artifact; ${NEVER_SUBSCRIBES.size} script(s) never subscribe, with a reason each, and `
    + `${NOT_YET_SUBSCRIBED.size} have not yet`,
  );
}

if (isMainModule(import.meta.url)) await main();
