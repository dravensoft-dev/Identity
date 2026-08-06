import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DOMAINS, SCRIPT_EXTENSIONS, domainOfTestPath, isScript, isSuite } from './domains.ts';
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
  assert.equal(domainOfTestPath('scripts/lib/arena/domains.test.ts'), 'arena');
  assert.equal(domainOfTestPath('scripts/check/tailwind/check-radius-tokens.test.ts'), 'tailwind');
  assert.equal(domainOfTestPath('scripts/build/react/build-demos.test.ts'), 'react');
  assert.equal(domainOfTestPath('scripts/generate/core/fetch-fonts.test.ts'), 'core');
  assert.equal(domainOfTestPath('scripts/ci/arena/summarize-tests.test.ts'), 'arena');
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
  assert.equal(domainOfTestPath('/runner/work/Identity/Identity/scripts/lib/core/serialize-token.test.ts'), 'core');
});

test('a checkout under a directory of an anchor name does not decide every path in the run', () => {
  assert.equal(domainOfTestPath('/home/dev/scripts/checkouts/frameworks/tailwind/a.test.mjs'), 'tailwind');
});

test('a path belonging to no domain is null rather than guessed', () => {
  assert.equal(domainOfTestPath('README.md'), null);
  assert.equal(domainOfTestPath('contracts/api/components/ArenaButton.json'), null);
  assert.equal(domainOfTestPath('scripts/serve.ts'), null);
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

test('a suite is one in either extension, and a script is what is left over', () => {
  for (const name of ['a.test.mjs', 'a.test.ts', 'check-docs.test.ts'])
    assert.equal(isSuite(name), true, `${name} is a suite`);
  for (const name of ['a.mjs', 'a.ts', 'serve.ts', 'ArenaButton.test.tsx', 'notes.md'])
    assert.equal(isSuite(name), false, `${name} is not a suite this tree runs`);

  for (const name of ['a.mjs', 'a.ts', 'serve.ts'])
    assert.equal(isScript(name), true, `${name} is a script`);
  for (const name of ['a.test.mjs', 'a.test.ts', 'notes.md', 'Components.json'])
    assert.equal(isScript(name), false, `${name} is not a script`);
});

test('the two predicates never both hold, or a file would be scanned as its own suite', () => {
  for (const name of ['a.mjs', 'a.ts', 'a.test.mjs', 'a.test.ts', 'x.md'])
    assert.equal(isScript(name) && isSuite(name), false, name);
});

test('both extensions are declared, since dropping either silently narrows all three scanners', () => {
  assert.deepEqual(SCRIPT_EXTENSIONS, ['.mjs', '.ts']);
});

test('a .ts path classifies by its directory, so the domain survives the rename', () => {
  assert.equal(domainOfTestPath('scripts/check/tailwind/check-radius-tokens.test.ts'), 'tailwind');
  assert.equal(domainOfTestPath('scripts/lib/arena/domains.test.ts'), 'arena');
});
