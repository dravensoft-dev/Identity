import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DOMAINS, domainOfTestPath } from './domains.mjs';
import { LAYERS } from './layers.mjs';
import { repoRoot } from './repo-root.mjs';

function suitesUnder(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...suitesUnder(full));
    else if (entry.name.endsWith('.test.mjs')) found.push(full);
  }
  return found;
}

test('the five domains are the grid the repository is sorted by, and every layer is one of them', () => {
  assert.deepEqual(DOMAINS, ['core', 'react', 'angular', 'tailwind', 'arena']);
  for (const layer of LAYERS) assert.ok(DOMAINS.includes(layer), `${layer} is not a domain`);
});

test('a script suite is classified by the domain directory it sits in, whatever its phase', () => {
  assert.equal(domainOfTestPath('scripts/lib/arena/domains.test.mjs'), 'arena');
  assert.equal(domainOfTestPath('scripts/check/tailwind/check-radius-tokens.test.mjs'), 'tailwind');
  assert.equal(domainOfTestPath('scripts/build/react/build-demos.test.mjs'), 'react');
  assert.equal(domainOfTestPath('scripts/generate/core/fetch-fonts.test.mjs'), 'core');
  assert.equal(domainOfTestPath('scripts/ci/arena/summarize-tests.test.mjs'), 'arena');
});

test('a framework suite is classified by its layer, DOM split and category depth included', () => {
  assert.equal(domainOfTestPath('frameworks/react/components/forms/arena-button/ArenaButton.test.tsx'), 'react');
  assert.equal(domainOfTestPath('frameworks/react/components/forms/arena-input/ArenaInput.dom.test.tsx'), 'react');
  assert.equal(domainOfTestPath('frameworks/react/test/UseDialogModal.dom.test.tsx'), 'react');
});

test("the Angular suites run from the emit, and the emit is still the Angular layer's", () => {
  assert.equal(domainOfTestPath('frameworks/angular/build/test/test/Harness.test.js'), 'angular');
  assert.equal(
    domainOfTestPath('frameworks/angular/build/test/components/forms/arena-button/ArenaButton.a11y.test.js'),
    'angular',
  );
});

test('an absolute path is classified, because a junit report names the files a runner wrote', () => {
  assert.equal(domainOfTestPath('/runner/work/Identity/Identity/frameworks/react/a.test.tsx'), 'react');
  assert.equal(domainOfTestPath('/runner/work/Identity/Identity/scripts/lib/core/serialize-token.test.mjs'), 'core');
});

test('a checkout under a directory of an anchor name does not decide every path in the run', () => {
  assert.equal(domainOfTestPath('/home/dev/scripts/checkouts/frameworks/tailwind/a.test.mjs'), 'tailwind');
});

test('a path belonging to no domain is null rather than guessed', () => {
  assert.equal(domainOfTestPath('README.md'), null);
  assert.equal(domainOfTestPath('contracts/api/components/ArenaButton.json'), null);
  assert.equal(domainOfTestPath('scripts/serve.mjs'), null);
  assert.equal(domainOfTestPath('frameworks/Components.json'), null);
});

test('every suite under scripts/ classifies, so the summary can never silently drop one', () => {
  const suites = suitesUnder(join(repoRoot, 'scripts'));
  assert.ok(suites.length > 0, 'a walk with nothing to walk proves nothing');
  const unclassified = suites
    .map((p) => relative(repoRoot, p))
    .filter((rel) => domainOfTestPath(rel) === null);
  assert.deepEqual(unclassified, []);
});
