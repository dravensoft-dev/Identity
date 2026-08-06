/* node:assert renders both operands into its diff when an equality assertion fails, and a
 * happy-dom node that is CONNECTED reaches the whole document from there — so the cost is set
 * by the tree the node hangs in, not by what it is compared against, and the Angular suites
 * share one document for the entire run. A failing identity assertion over a node is what
 * exhausts the run rather than what reports the defect, so it never reaches a reader at all.
 * frameworks/angular/test/NodeAssert.ts compares identity and renders the operands itself;
 * this gate is what keeps the raw form from coming back. NodeAssert.ts has the measurement. */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.ts';

export const SUITE_ROOT = 'frameworks/angular';

export const NODE_MARKERS = /document\.activeElement|\.querySelector\(|\.nativeElement|\.closest\(|\.parentElement|\.firstElementChild|\.lastElementChild/;

const SCALAR_PROPERTY = 'textContent|innerText|length|value|tagName|className|id|checked'
  + '|disabled|innerHTML|outerHTML|classList|scrollHeight|offsetHeight|clientHeight|size';

const SCALAR_CALL = 'getAttribute|hasAttribute|matches|contains|trim|toLowerCase|toUpperCase'
  + '|join|slice|replace|split|includes|startsWith|endsWith|indexOf|toString';

export const SCALAR_TAIL = new RegExp(
  `\\.(${SCALAR_PROPERTY}|style(\\.\\w+)?|(${SCALAR_CALL})\\([^)]*\\))\\s*$`,
);

const EQUALITY = /assert\.(equal|strictEqual|notEqual|notStrictEqual|deepEqual|deepStrictEqual)\(/g;

export function splitArguments(source: string, open) {
  const args = [];
  let depth = 0;
  let start = open + 1;
  let quote = null;
  for (let i = open + 1; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === quote && source[i - 1] !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth++;
    else if (char === ')' && depth === 0) return { args: [...args, source.slice(start, i)], end: i };
    else if (char === ')' || char === ']' || char === '}') depth--;
    else if (char === ',' && depth === 0) {
      args.push(source.slice(start, i));
      start = i + 1;
    }
  }
  return null;
}

export function isNodeExpression(argument) {
  return NODE_MARKERS.test(argument) && !SCALAR_TAIL.test(argument.trim());
}

export function suiteFiles(root, list = readdirSync) {
  const found = [];
  const walk = (dir: string) => {
    for (const entry of list(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.test.ts')) found.push(path);
    }
  };
  walk(root);
  return found.sort();
}

export function assertionProblems(files, read) {
  const problems = [];
  for (const file of files) {
    const source = read(file);
    EQUALITY.lastIndex = 0;
    let match;
    while ((match = EQUALITY.exec(source)) !== null) {
      const parsed = splitArguments(source, match.index + match[0].length - 1);
      if (!parsed || parsed.args.length < 2) continue;
      EQUALITY.lastIndex = parsed.end;
      const [actual, expected] = parsed.args;
      if (!isNodeExpression(actual) && !isNodeExpression(expected)) continue;
      const line = source.slice(0, match.index).split('\n').length;
      problems.push(
        `${file}:${line}: assert.${match[1]}() over a DOM node — use assertSameNode/`
        + `assertNotSameNode/assertNoNode from frameworks/angular/test/NodeAssert.ts, or the diff `
        + `this builds when it fails is the size of the shared document`,
      );
    }
  }

  if (files.length === 0) {
    problems.push(
      `found 0 suites under ${SUITE_ROOT}. An empty result set is a failure, not a clean pass: `
      + 'a gate iterating nothing reports nothing wrong with everything.',
    );
  }
  return problems;
}

function main() {
  const root = join(repoRoot, SUITE_ROOT);
  const files = suiteFiles(root).map((path) => relative(repoRoot, path));
  const problems = assertionProblems(files, (rel: string) => readFileSync(join(repoRoot, rel), 'utf8'));
  if (problems.length) {
    console.error(`check-assertions: ${problems.length} problem(s)\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-assertions: ${files.length} Angular suite(s) compare DOM nodes by identity, not by diff`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
