/* The gate drives a real browser; these drive its verdict with the measurements a real pair
 * produces. The stale-entry case is the one that matters: DIVERGENT records what the two layers
 * still disagree about, and an entry that has stopped being true has to fail rather than sit
 * there, which is the rule COVERED and EXEMPT carry everywhere else in this tree. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIVERGENT, TOLERANCE, describe, differs, diffScript, mapProblems, pairPages, parityProblems, summarize,
} from './check-parity.mjs';
import { pagePaths } from './check-playgrounds.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

const same = { total: 158208, diff: 0, worst: 0, bbox: null, w: 824, h: 192, layers: ['angular', 'react'] };
const ink = { total: 158208, diff: 6908, worst: 214, bbox: [21, 36, 802, 106], w: 824, h: 192, layers: ['angular', 'react'] };
const sized = { sizes: [824, 304, 824, 280], layers: ['angular', 'react'] };

test('a pair is the two pages that share a basename, one per layer', () => {
  const pairs = pairPages([
    'frameworks/angular/components/forms/button/Button.demo.generated.html',
    'frameworks/react/components/forms/button/Button.demo.generated.html',
  ]);
  assert.equal(pairs.length, 1);
  assert.deepEqual(pairs[0].layers, ['angular', 'react']);
  assert.equal(pairs[0].component, 'Button');
});

test('a page with no counterpart in the other layer is not a pair, because there is nothing to compare it with', () => {
  assert.deepEqual(pairPages(['frameworks/react/components/forms/button/Button.demo.generated.html']), []);
});

test('every emitted page in the real tree pairs up', () => {
  const pages = pagePaths(repoRoot);
  const pairs = pairPages(pages);
  assert.equal(pairs.length * 2, pages.length,
    'a page with no counterpart would leave this gate blind to that component');
});

test('a pair that paints differently and is not declared fails, naming the region', () => {
  const problems = parityProblems('Tabs', ink, new Map());
  assert.equal(problems.length, 1);
  assert.match(problems[0], /6908 of 158208 stage pixels differ/);
  assert.match(problems[0], /over x 21\.\.802, y 36\.\.106/);
});

test('a pair whose stages are different sizes fails, naming both layers', () => {
  const problems = parityProblems('SideNav', sized, new Map());
  assert.equal(problems.length, 1);
  assert.match(problems[0], /angular 824x304 and react 824x280/);
});

test('a declared pair that still differs is clean, which is what the map buys', () => {
  assert.deepEqual(parityProblems('Tabs', ink, new Map([['Tabs', 'a reason']])), []);
});

test('a declared pair that has stopped differing FAILS, so an exception cannot outlive its defect', () => {
  const problems = parityProblems('Tabs', same, new Map([['Tabs', 'a reason']]));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /now paint identically — delete the entry/);
});

test('an undeclared pair that paints identically is clean', () => {
  assert.deepEqual(parityProblems('Button', same, new Map()), []);
});

test('a pair that could not be measured counts as differing, because silence is not agreement', () => {
  assert.ok(differs({ error: 'no .pg-stage after 20000ms' }));
  const problems = parityProblems('Button', { error: 'no .pg-stage', layers: ['angular', 'react'] }, new Map());
  assert.match(problems[0], /could not be measured/);
});

test('DIVERGENT may not name a component that emits no pair, nor carry an empty reason', () => {
  const pairs = [{ component: 'Tabs', pages: {}, layers: ['angular', 'react'] }];
  assert.match(mapProblems(pairs, new Map([['Nope', 'x']]))[0], /no component emits a page pair called that/);
  assert.match(mapProblems(pairs, new Map([['Tabs', '   ']]))[0], /no reason, and a reason is the whole entry/);
  assert.deepEqual(mapProblems(pairs, new Map([['Tabs', 'a real reason']])), []);
});

test('finding no pair at all is a failure rather than a clean pass', () => {
  assert.match(mapProblems([], new Map())[0], /found 0 page pairs/);
});

test('every DIVERGENT entry in the real map carries a reason, and names a real pair', () => {
  assert.deepEqual(mapProblems(pairPages(pagePaths(repoRoot)), DIVERGENT), []);
});

test('the tolerance the diff applies is the one declared, so the two cannot drift apart', () => {
  assert.ok(diffScript('a', 'b').includes(`delta <= ${TOLERANCE}`));
});

test('a clean run says how many pairs agree and how many are declared', () => {
  const summary = summarize([], [{ component: 'Button' }, { component: 'Tabs' }]);
  assert.equal(summary.failed, false);
  assert.match(summary.text, /2 page pair\(s\) rendered in one browser/);
});

test('describe reports the worst channel, because a one-pixel antialiasing edge and a moved row read alike by count', () => {
  assert.match(describe('Tabs', ink), /worst channel 214/);
});
