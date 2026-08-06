import test from 'node:test';
import assert from 'node:assert/strict';
import { allCases, problemsFrom, sheetsFor } from './check-style-parity.ts';
import { layerManifests } from '../../lib/tailwind/tailwind-compile.mjs';
import { cases, selections } from '../../lib/tailwind/style-parity.mjs';

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
  assert.deepEqual(selections(manifest).map((s) => s.name), ['defaults', 'tone=neutral', 'tone=danger']);
  const built = cases(manifest);
  assert.equal(built.length, selections(manifest).length * 2, 'every slot is mounted for every selection');
  const danger = built.find((c) => c.id === 'ArenaBadge|root|tone=danger');
  assert.equal(danger.arena, 'arena-badge__root arena-badge__root--tone-danger',
    'the base and the variant are both on the element, which is what makes source order the thing under test');
});

test('every manifest contributes at least one case, so no component can drop out unnoticed', () => {
  const built = allCases(manifests);
  const seen = new Set(built.map((c) => c.id.split('|')[0]));
  assert.equal(seen.size, manifests.size);
  assert.ok(built.length > 1000, `only ${built.length} cases were built`);
});

test('a pass that mounted nothing is a failure rather than a silent pass', () => {
  assert.deepEqual(problemsFrom({ compared: 0, mismatches: [] }, 'at rest'),
    ['at rest: the page mounted no case at all, so this run proves nothing']);
  assert.deepEqual(problemsFrom({ compared: 4, mismatches: [] }, 'at rest'), []);
});

test('a mismatch names the case and the properties that differ', () => {
  const problems = problemsFrom(
    { compared: 4, mismatches: [{ id: 'ArenaSwitch|icon|size=md', differing: ['line-height: 16.5px vs 11px'] }] },
    'under reduced motion',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /ArenaSwitch\|icon\|size=md/);
  assert.match(problems[0], /line-height: 16\.5px vs 11px/);
});
