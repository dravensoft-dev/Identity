import test from 'node:test';
import assert from 'node:assert/strict';
import { promptProblems, regionOf, zeroScanProblems } from './check-prompts.mjs';
import { openLine, CLOSE_LINE } from '../../generate/arena/generate-prompt-api.mjs';

test('every committed prompt carries the region its contract emits', () => {
  const { problems } = promptProblems();
  assert.deepEqual(problems, []);
});

test('the gate read a real corpus rather than an empty one', () => {
  const { held, scanned } = promptProblems();
  assert.ok(scanned > 100, `reached only ${scanned} prompt(s)`);
  assert.equal(held, scanned, 'a prompt was skipped, so a clean pass says less than it looks');
});

test('a prompt with no region is a problem, because a contracted member would go unstated', () => {
  const { problems } = promptProblems(undefined, [
    { component: 'ArenaBadge', layer: 'react', path: 'frameworks/react/components/display/arena-badge/ArenaBadge.tsx' },
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /carries no @api region/);
});

test('regionOf reads the whole region, markers included', () => {
  const source = `x\n\n${openLine('ArenaBadge')}\nrows\n${CLOSE_LINE}\n\ny\n`;
  assert.equal(regionOf(source), `${openLine('ArenaBadge')}\nrows\n${CLOSE_LINE}`);
});

test('an unclosed region reads as no region, so the gate reports it rather than trusting it', () => {
  assert.equal(regionOf(`${openLine('ArenaBadge')}\nrows\n`), null);
  assert.equal(regionOf('no region here\n'), null);
});

test('an empty scan is a problem, never a clean run', () => {
  assert.equal(zeroScanProblems(0).length, 1);
  assert.deepEqual(zeroScanProblems(110), []);
});
