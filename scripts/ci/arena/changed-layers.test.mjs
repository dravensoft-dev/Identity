import test from 'node:test';
import assert from 'node:assert/strict';
import { LAYER_INPUTS, SHARED, layersChanged, renderOutputs, unroutedLayers } from './changed-layers.mjs';
import { LAYERS } from '../../lib/arena/layers.mjs';

test('a change confined to one layer routes to that layer alone', () => {
  assert.deepEqual(
    layersChanged(['frameworks/react/components/forms/button/Button.tsx']),
    { react: true, angular: false, tailwind: false },
  );
});

test('a Tailwind change routes to Angular too, because ngc reads the generated manifests', () => {
  assert.deepEqual(
    layersChanged(['frameworks/tailwind/components/forms/button/Button.manifest.json']),
    { react: false, angular: true, tailwind: true },
  );
});

test('a change to anything shared routes to every layer', () => {
  for (const shared of ['contracts/api/components/Button.json', 'scripts/check/arena/check-api.mjs',
    'package.json', 'bun.lock', '.github/workflows/pr.yml']) {
    assert.deepEqual(
      layersChanged([shared]),
      { react: true, angular: true, tailwind: true },
      `${shared} did not route everywhere`,
    );
  }
});

test('a shared entry naming a file matches that file and not a directory it prefixes', () => {
  assert.deepEqual(
    layersChanged(['package.json.bak']),
    { react: false, angular: false, tailwind: false },
  );
});

test('a path outside every input routes nowhere', () => {
  assert.deepEqual(
    layersChanged(['README.md', 'CHANGELOG.md', 'intro/guidelines/type.html', 'docs/superpowers/specs/x.md']),
    { react: false, angular: false, tailwind: false },
  );
});

test('an empty diff routes nowhere, so a run with nothing to do says so', () => {
  assert.deepEqual(layersChanged([]), { react: false, angular: false, tailwind: false });
});

test('every layer is routed, so a new one cannot land with no entry', () => {
  assert.deepEqual(unroutedLayers(), []);
  assert.deepEqual(unroutedLayers({ react: {}, angular: {} }, LAYERS), ['tailwind']);
});

test('the output is the shape a workflow step appends to GITHUB_OUTPUT', () => {
  assert.equal(
    renderOutputs(layersChanged(['frameworks/react/a.tsx'])),
    'angular=false\nreact=true\ntailwind=false',
  );
});

test('every entry carries a reason, because a routing rule with none cannot be judged stale', () => {
  const entries = [...Object.entries(SHARED), ...Object.values(LAYER_INPUTS).flatMap((m) => Object.entries(m))];
  assert.ok(entries.length > 0);
  for (const [prefix, reason] of entries) {
    assert.equal(typeof reason, 'string', `${prefix} has no reason`);
    assert.ok(reason.length > 10, `${prefix}'s reason says nothing: "${reason}"`);
  }
});
