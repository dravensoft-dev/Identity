/* A gate, so it is in GATES and takes an npm script whose prefix names this phase. What it
 * asserts lives in scripts/graph/graph-problems.ts, with the rest of the graph. */

import { isMainModule } from '../../utils/main-module.ts';
import { graphProblems } from '../../graph/graph-problems.ts';
import { NOT_YET_SUBSCRIBED, NEVER_SUBSCRIBES, allNodes } from '../../graph/nodes.ts';
import { auditProblems } from '../../graph/audit.ts';

export async function auditReport() {
  const { nodes, declaredIn } = await allNodes();
  const problems = [];
  let clean = 0;
  let unaudited = 0;
  for (const node of nodes) {
    const result = auditProblems(node, declaredIn.get(node.name) ?? '');
    if (result.unaudited) { unaudited += 1; continue; }
    if (result.undeclared.length === 0) { clean += 1; continue; }
    problems.push(`${node.name} opened ${result.undeclared.length} file(s) it does not declare, `
      + `starting ${result.undeclared[0]} -- a read nobody claims is a file every declaration `
      + 'agrees is nobody\'s business, so its fingerprint is blind to it');
  }
  return { problems, clean, unaudited, total: nodes.length };
}

async function main() {
  if (process.argv.includes('--audit')) {
    const { problems, clean, unaudited, total } = await auditReport();
    for (const problem of problems) console.error(`  ${problem}`);
    console.log(`check-graph --audit: ${clean} of ${total} node(s) open nothing they do not declare, `
      + `and ${unaudited} spawn a process this cannot follow`);
    process.exit(problems.length > 0 ? 1 : 0);
  }

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
