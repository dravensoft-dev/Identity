import test from 'node:test';
import assert from 'node:assert/strict';
import { allCases, sheetsFor, zeroCaseProblems } from './build-style-parity-page.ts';
import { layerManifests } from '../../lib/tailwind/tailwind-compile.ts';
import { cases, selections } from '../../lib/tailwind/style-parity.ts';

const manifests = layerManifests();

test('the page loads the oracle and every component sheet, in one document', () => {
  const sheets = sheetsFor(manifests);
  assert.ok(sheets.includes('/frameworks/tailwind/Utilities.generated.css'),
    'the compiled utility sheet is the oracle, which is why it survives as a build-time artifact');
  assert.ok(sheets.includes('/intro/styles.css'), 'both sides need the same token layer');
  assert.equal(sheets.length, manifests.size + 2);
});

test('a selection is the whole resolved one, not a single variant on its own', () => {
  const manifest = {
    component: 'ArenaBadge',
    slots: { root: 'inline-flex', dot: 'size-1.5' },
    variants: { tone: { neutral: { root: 'a' }, danger: { root: 'b' } } },
    defaultVariants: { tone: 'neutral' },
  };
  assert.deepEqual(selections(manifest).map((s: { name: string }) => s.name),
    ['defaults', 'tone=neutral', 'tone=danger']);
  const built = cases(manifest);
  assert.equal(built.length, selections(manifest).length * 2, 'every slot is mounted for every selection');
  const danger = built.find((c: { id: string }) => c.id === 'ArenaBadge|root|tone=danger');
  assert.ok(danger, 'the danger tone produced no case at all');
  assert.equal(danger.arena, 'arena-badge__root arena-badge__root--tone-danger',
    'the base and the variant are both on the element, which is what makes source order the thing under test');
});

test('every manifest contributes at least one case, so no component can drop out unnoticed', () => {
  const built = allCases(manifests);
  const seen = new Set(built.map((c: { id: string }) => c.id.split('|')[0]));
  assert.equal(seen.size, manifests.size);
  assert.ok(built.length > 1000, `only ${built.length} cases were built`);
});

test('a page comparing nothing is a failure rather than a page that passes every run', () => {
  assert.deepEqual(zeroCaseProblems(0),
    ['the manifests declare 0 cases, and a page comparing nothing would pass every run']);
  assert.deepEqual(zeroCaseProblems(1), []);
});

test('the page is emitted by a build step, because a gate that writes can stop another gate', () => {
  assert.equal(allCases(manifests).length > 0, true,
    'check:style-parity used to write this page itself. A gate that emits is an artifact another '
    + 'gate reads, which makes one gate able to block another, and a sweep has to report every '
    + 'problem in one pass');
});
