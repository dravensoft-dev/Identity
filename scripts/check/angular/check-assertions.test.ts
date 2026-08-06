/* The gate is only worth having if it catches the shape that ran the suite out of memory, so
 * every case here is a real line from the migration or a near miss that must stay allowed. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { assertionProblems, isNodeExpression, splitArguments, suiteFiles, SUITE_ROOT } from './check-assertions.ts';

const scan = (source: string) => assertionProblems(['a.test.ts'], () => source);

test('an identity assertion over document.activeElement is caught', () => {
  const problems = scan(`assert.equal(document.activeElement, input, 'opening must move focus');`);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /a\.test\.ts:1: assert\.equal\(\) over a DOM node/);
});

test('every equality form of node:assert is caught, not just equal', () => {
  for (const form of ['equal', 'strictEqual', 'notEqual', 'notStrictEqual', 'deepEqual', 'deepStrictEqual']) {
    assert.equal(scan(`assert.${form}(document.activeElement, el);`).length, 1, `${form} slipped through`);
  }
});

test('a node compared against null is caught too, because the cost is the tree the node hangs in', () => {
  assert.equal(scan(`assert.equal(host.querySelector('button'), null, 'no action');`).length, 1);
});

test('the node may be the second operand as well as the first', () => {
  assert.equal(scan(`assert.equal(before, document.activeElement);`).length, 1);
});

test('an assertion spanning several lines is caught, and reported at the line it opens on', () => {
  const problems = scan(`const a = 1;\nassert.equal(\n  host.querySelector('path'),\n  null,\n  'an empty doughnut',\n);`);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /a\.test\.ts:2:/);
});

test('a scalar read off a node is not a node, however deep the expression', () => {
  const allowed = [
    `assert.equal(host.querySelector('label').getAttribute('for'), 'in-name');`,
    `assert.equal(host.querySelectorAll('[tabindex]').length, 0);`,
    `assert.equal((table.querySelector('caption')?.textContent ?? '').trim(), 'Revenue');`,
    `assert.equal(block.nativeElement.style.borderRadius, '4px');`,
    `assert.equal(list.contains(panel), false);`,
    `assert.equal(el.nativeElement.textContent, 'DRAVENSOFT');`,
  ];
  for (const source of allowed) assert.deepEqual(scan(source), [], `wrongly flagged: ${source}`);
});

test('the helpers themselves are not equality assertions, so a migrated file is clean', () => {
  assert.deepEqual(scan(`assertSameNode(document.activeElement, input, 'moved focus');`), []);
  assert.deepEqual(scan(`assertNoNode(host.querySelector('button'), 'no action');`), []);
});

test('assert.ok and assert.match carry no diff of their operands and stay untouched', () => {
  assert.deepEqual(scan(`assert.ok(host.querySelector('button'), 'a button must exist');`), []);
  assert.deepEqual(scan(`assert.match(panel.getAttribute('class') ?? '', /block/);`), []);
});

test('splitArguments balances nested calls, brackets and quoted commas', () => {
  const source = `assert.equal(read().tabs[1], f(a, b), 'one, two');`;
  const { args } = splitArguments(source, source.indexOf('('));
  assert.deepEqual(args.map((a) => a.trim()), ['read().tabs[1]', 'f(a, b)', `'one, two'`]);
});

test('isNodeExpression judges the tail of the expression, not merely that a node appears in it', () => {
  assert.equal(isNodeExpression(`document.activeElement`), true);
  assert.equal(isNodeExpression(`el.closest('label')`), true);
  assert.equal(isNodeExpression(`host.querySelector('svg')`), true);
  assert.equal(isNodeExpression(`host.querySelector('svg').textContent`), false);
  assert.equal(isNodeExpression(`'a plain string'`), false);
});

test('an empty file set fails rather than passing vacuously', () => {
  const problems = assertionProblems([], () => '');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /found 0 suites/);
});

test('suiteFiles collects only .test.ts, and walks the whole layer', () => {
  const tree = {
    '/root': [
      { name: 'A.test.ts', isDirectory: () => false },
      { name: 'NodeAssert.ts', isDirectory: () => false },
      { name: 'nested', isDirectory: () => true },
    ],
    '/root/nested': [{ name: 'B.test.ts', isDirectory: () => false }],
  };
  assert.deepEqual(suiteFiles('/root', (dir) => tree[dir]), ['/root/A.test.ts', '/root/nested/B.test.ts']);
});

test('the gate is pointed at the Angular layer, the one whose suites share a document', () => {
  assert.equal(SUITE_ROOT, 'frameworks/angular');
});
