import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGE_INPUTS, SHARED_INPUTS, pathspecs, uncoveredChainEntries } from './package-inputs.mjs';
import { CSS_CHAIN } from '../../lib/arena/package-assembly.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

test('every file the CSS chain copies is covered, so a chain that grows fails here', () => {
  assert.ok(CSS_CHAIN.length > 0);
  assert.deepEqual(uncoveredChainEntries(), []);
  assert.deepEqual(
    uncoveredChainEntries({ 'contracts/design/': 'half of it' }, CSS_CHAIN),
    CSS_CHAIN.map((c) => c.from).filter((f) => !f.startsWith('contracts/design/')),
  );
});

test('the CLI each package ships as its bin is covered', () => {
  assert.ok('scripts/generate/core/arena-theme/' in SHARED_INPUTS);
  assert.ok(existsSync(join(repoRoot, 'scripts', 'generate', 'core', 'arena-theme')),
    'copyCli reads this directory, and the guard names it by that path');
});

test('each package names its own layer, and both name the Tailwind layer they draw from', () => {
  assert.ok(pathspecs('react').includes('frameworks/react/'));
  assert.ok(pathspecs('angular').includes('frameworks/angular/'));
  assert.ok(pathspecs('angular').includes('frameworks/tailwind/'));
  assert.ok(pathspecs('react').includes('frameworks/tailwind/'),
    'the modules React compiles are emitted there and are gitignored, so a manifest edit moves '
    + 'what the package ships while nothing tracked under frameworks/react/ moves');
  assert.ok(!pathspecs('react').includes('frameworks/angular/'), 'React carries nothing of the Angular layer');
});

test('the version file is no input, or the guard could never answer that nothing moved', () => {
  for (const layer of Object.keys(PACKAGE_INPUTS)) {
    assert.ok(!pathspecs(layer).includes('.claude-plugin/plugin.json'),
      `${layer}: the guard is reached only when the registry disagrees with that file, so naming `
      + 'it here puts a changed file in every diff and no release could ever leave a package alone');
  }
});

test('every path a guard would hand to git exists, so a rename fails here rather than narrowing it', () => {
  for (const layer of Object.keys(PACKAGE_INPUTS)) {
    for (const spec of pathspecs(layer)) {
      assert.ok(existsSync(join(repoRoot, spec)), `${layer}: ${spec} names nothing`);
    }
  }
});

test('every entry carries a reason', () => {
  for (const [layer, inputs] of Object.entries(PACKAGE_INPUTS)) {
    for (const [spec, reason] of Object.entries(inputs)) {
      assert.ok(reason && reason.length > 10, `${layer}: ${spec} has no usable reason`);
    }
  }
});

test('a layer no package is assembled from is refused rather than answered with nothing', () => {
  assert.throws(() => pathspecs('tailwind'), /no package is assembled/);
});
