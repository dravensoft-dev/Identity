import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, shortFingerprint } from './plan.ts';
import type { Fingerprint } from './fingerprint.ts';
import type { NodeEntry } from './state.ts';

const node = { name: 'generate:tokens', reads: [], writes: [], feeds: [] };

const print = (over: Partial<Fingerprint> = {}): Fingerprint => ({
  fingerprint: 'aaaa',
  script: 'scripts/generate/arena/generate-tokens.ts',
  reads: { digest: 'rrrr', count: 6 },
  self: { 'scripts/generate/arena/generate-tokens.ts': 'ssss' },
  up: {},
  writes: ['contracts/design-generated/palette.generated.css'],
  ...over,
});

const recorded = (over: Partial<Fingerprint> = {}): NodeEntry =>
  ({ ...print(over), at: '2026-08-08T00:00:00.000Z' });

const there = () => true;

test('a node with nothing recorded runs, and says nothing is known', () => {
  const { run, reason } = decide(node, print(), undefined, there);
  assert.equal(run, true);
  assert.equal(reason, 'no fingerprint is recorded, so nothing is known about the last run');
});

test('a node whose fingerprint matches what the last green run recorded does not run', () => {
  assert.deepEqual(decide(node, print(), recorded(), there), {
    name: 'generate:tokens', run: false, reason: null, fingerprint: 'aaaa',
  });
});

test('an artifact that is gone runs the node, whatever the fingerprint says', () => {
  const { run, reason } = decide(node, print(), recorded(), () => false);
  assert.equal(run, true);
  assert.equal(reason, 'contracts/design-generated/palette.generated.css is gone since the last green run');
  assert.equal(decide(node, print(), recorded(), () => false).run, true,
    'a deleted artifact and a fresh clone are the same case, and neither is a fingerprint question');
});

test("a node whose own script moved says so, and one whose import moved says which", () => {
  const own = decide(node, print({ self: { 'scripts/generate/arena/generate-tokens.ts': 'zzzz' } }), recorded(), there);
  assert.equal(own.reason, 'scripts/generate/arena/generate-tokens.ts has moved since the last green run');

  const imported = decide(
    node,
    print({ self: { 'scripts/generate/arena/generate-tokens.ts': 'ssss', 'scripts/lib/arena/layers.ts': 'zzzz' } }),
    recorded({ self: { 'scripts/generate/arena/generate-tokens.ts': 'ssss', 'scripts/lib/arena/layers.ts': 'yyyy' } }),
    there,
  );
  assert.equal(imported.reason, 'scripts/lib/arena/layers.ts, which it imports, has moved since the last green run');
});

test('an upstream that ran is named, because that is what a reader has to look at next', () => {
  const { run, reason } = decide(
    node, print({ up: { 'generate:tokens': 'bbbb' } }), recorded({ up: { 'generate:tokens': 'aaaa' } }), there,
  );
  assert.equal(run, true);
  assert.equal(reason, 'generate:tokens ran, so what it reads was rewritten under it');
});

test('a file appearing is counted, and reported as a count rather than as a digest nobody can read', () => {
  const { reason } = decide(node, print({ reads: { digest: 'rrrr', count: 7 } }), recorded(), there);
  assert.equal(reason, 'it now reads 7 file(s) where the last green run read 6');
});

test('a changed byte moves the digest at the same count, and says the sources moved', () => {
  const { reason } = decide(node, print({ reads: { digest: 'qqqq', count: 6 } }), recorded(), there);
  assert.equal(reason, 'its sources have moved since the last green run');
});

test('a fingerprint that moved with every part matching is still a reason to run', () => {
  const { run, reason } = decide(node, print({ fingerprint: 'bbbb' }), recorded(), there);
  assert.equal(run, true);
  assert.equal(reason, 'its fingerprint has moved since the last green run',
    'the parts are what a reader is told; the whole is what decides, so the two cannot disagree '
    + 'silently in favour of skipping');
});

test('a fingerprint is shown short, because a reader compares it and never types it', () => {
  assert.equal(shortFingerprint('9f3a1c2b4d5e6f7a8b9c'), '9f3a1c2b4d5e');
});
