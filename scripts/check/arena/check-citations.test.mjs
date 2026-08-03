/* The gate reads the real tree, which is correct by construction once it passes, so these
 * drive its pure functions with the shapes the two defects it was written for actually had:
 * a spec deleted by charter, and a build step renamed. EXEMPT is asserted by name. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  EXEMPT, SKIPPED_ANYWHERE, SKIPPED_UNDER_FRAMEWORKS, skips, repoRoots, pathPattern,
  documents, namesAFile, citationProblems, zeroDocumentProblems, zeroRootProblems,
  BARE_DOCUMENT, basenames, bareDocumentProblems,
} from './check-citations.mjs';

function tree(files) {
  const base = mkdtempSync(join(tmpdir(), 'arena-citations-'));
  for (const [rel, text] of Object.entries(files)) {
    const path = join(base, rel);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, text);
  }
  return base;
}

const NONE = new Map();

test('EXEMPT names what is absent on purpose, and nothing else', () => {
  assert.deepEqual([...EXEMPT.keys()], ['frameworks/angular/BehaviourDelegated.json']);
  for (const reason of EXEMPT.values()) assert.ok(reason.length > 40, 'an entry states its reason');
});

test('a cited file that is not there is a problem, which is the spec a charter had already deleted', () => {
  const base = tree({
    'docs/note.md': 'x',
    'frameworks/angular/README.md': 'The argument is `docs/superpowers/specs/2026-07-23-8-api.md`.',
  });
  const problems = citationProblems(base, undefined, NONE);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /cites docs\/superpowers\/specs\/2026-07-23-8-api\.md, and nothing is there/);
});

test('scripts/build is scanned, and naming a build directory anywhere would have hidden it', () => {
  const base = tree({
    'scripts/build/README.md': 'Run `scripts/generate/arena/generate-catalog.mjs` for the index.',
  });
  assert.match(citationProblems(base, undefined, NONE)[0], /cites scripts\/generate\/arena\/generate-catalog\.mjs/);
  assert.equal(documents(base).length, 1);
});

test('a directory named build under frameworks is skipped, and one anywhere else is not', () => {
  assert.deepEqual([...SKIPPED_ANYWHERE], ['node_modules', '.git']);
  assert.deepEqual([...SKIPPED_UNDER_FRAMEWORKS], ['dist', 'build', 'vendor']);
  assert.equal(skips('build', 'frameworks/angular'), true);
  assert.equal(skips('build', 'scripts'), false);
  assert.equal(skips('node_modules', 'scripts'), true);
});

test('a path is judged only when it names a file, because prose shortens a path freely', () => {
  assert.equal(namesAFile('contracts/design/palette'), false);
  assert.equal(namesAFile('intro/Arena'), false);
  assert.equal(namesAFile('contracts/design/palette.dark.json'), true);
});

test('a leading slash is a URL from a site root and never a repo path', () => {
  const base = tree({ 'assets/real.svg': '<svg/>', 'a.md': '<img src="/assets/your-mark.svg" alt="" />' });
  assert.ok(repoRoots(base).includes('assets'), 'assets is a real root, so the path is recognisable');
  assert.deepEqual(citationProblems(base, undefined, NONE), []);
});

test('no roots matches nothing rather than everything, which is the failure the other way', () => {
  assert.equal('see /assets/a.svg'.match(pathPattern([])), null);
  assert.equal(zeroRootProblems([]).length, 1);
  assert.match(zeroRootProblems([])[0], /matches every absolute path/);
  assert.deepEqual(zeroRootProblems(['scripts']), []);
});

test('a .generated. name is skipped, because a fresh clone has none of them', () => {
  const base = tree({ 'a.md': 'It imports `frameworks/react/Api.generated.ts`.' });
  assert.deepEqual(citationProblems(base, undefined, NONE), []);
});

test('an EXEMPT entry no document cites any more fails as a stale allowance', () => {
  const base = tree({ 'a.md': 'nothing cited here' });
  const problems = citationProblems(base);
  assert.equal(problems.length, EXEMPT.size);
  assert.match(problems[0], /EXEMPT names frameworks\/angular\/BehaviourDelegated\.json, which no document cites/);
});

test('the roots come from the tree, so a new top-level directory is covered the day it lands', () => {
  const base = tree({ 'newthing/a.md': 'x', 'a.md': 'see `newthing/gone.md`' });
  assert.ok(repoRoots(base).includes('newthing'));
  assert.match(citationProblems(base, undefined, NONE).find((p) => p.includes('gone')), /cites newthing\/gone\.md/);
});

test('the pattern refuses a path glued to a longer word', () => {
  const pattern = pathPattern(['scripts']);
  assert.equal('myscripts/a.mjs'.match(pattern), null);
  assert.deepEqual('see scripts/a.mjs'.match(pattern), ['scripts/a.mjs']);
});

test('a walk that reaches no document is a failure, not a clean pass', () => {
  assert.equal(zeroDocumentProblems([]).length, 1);
  assert.match(zeroDocumentProblems([])[0], /empty result set is a failure/);
  assert.deepEqual(zeroDocumentProblems(['a.md']), []);
});

test('a bare document name no file in the tree carries is a problem', () => {
  const base = tree({ 'a.md': 'the failure `components-divergences.md` records', 'b.md': 'x' });
  const problems = bareDocumentProblems(base);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /names components-divergences\.md, and no document in the tree/);
});

test('a bare name that does exist passes, wherever in the tree it sits', () => {
  const base = tree({ 'a.md': 'see AGENTS.md', 'deep/nested/AGENTS.md': 'x' });
  assert.deepEqual(bareDocumentProblems(base), []);
});

test('a metavariable is written <Name>, which the pattern cannot match, so it needs no exception', () => {
  assert.equal('a fixture at <Name>.demo.json'.match(BARE_DOCUMENT), null);
  assert.deepEqual('see X.prompt.md'.match(BARE_DOCUMENT), ['X.prompt.md']);
});
