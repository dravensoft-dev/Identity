import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesSpec, normalizeSpec, resolveSpecs, unreachedSpecs } from './pathspecs.ts';

const UNIVERSE = [
  'contracts/design/palette.dark.json',
  'contracts/design/colors.css',
  'contracts/design-generated/palette.generated.css',
  'frameworks/react/Index.generated.ts',
  'frameworks/react/components/forms/ArenaButton.tsx',
  'frameworks/tailwind/consume/ArenaButton.styles.generated.css',
  'package.json',
];

test('a spec naming a directory reaches everything under it', () => {
  assert.deepEqual(resolveSpecs(['contracts/design'], UNIVERSE),
    ['contracts/design/colors.css', 'contracts/design/palette.dark.json']);
});

test('a directory spec stops at the separator, so a sibling with a longer name is not under it', () => {
  assert.equal(matchesSpec('contracts/design', 'contracts/design-generated/palette.generated.css'), false,
    'a prefix match without the separator would hand contracts/design every file of its neighbour');
});

test('a star stops at a separator and a double star crosses them', () => {
  assert.deepEqual(resolveSpecs(['contracts/design/*.json'], UNIVERSE), ['contracts/design/palette.dark.json']);
  assert.deepEqual(resolveSpecs(['frameworks/**/*.generated.*'], UNIVERSE), [
    'frameworks/react/Index.generated.ts',
    'frameworks/tailwind/consume/ArenaButton.styles.generated.css',
  ]);
});

test('a spec ending in ** reaches all the way down, not one level', () => {
  assert.equal(normalizeSpec('frameworks/react/**'), 'frameworks/react/**/*');
  assert.deepEqual(resolveSpecs(['frameworks/react/**'], UNIVERSE), [
    'frameworks/react/Index.generated.ts',
    'frameworks/react/components/forms/ArenaButton.tsx',
  ], 'globToRegExp expands **/ and leaves a bare ** unable to cross a separator, so a declaration '
    + 'written the natural way would reach one level and fingerprint nothing below it');
});

test('an exact path is its own spec', () => {
  assert.deepEqual(resolveSpecs(['package.json'], UNIVERSE), ['package.json']);
});

test('the result is sorted and holds no duplicate, however the specs overlap', () => {
  assert.deepEqual(resolveSpecs(['contracts/design', 'contracts/design/*.json', 'contracts/design/colors.css'], UNIVERSE),
    ['contracts/design/colors.css', 'contracts/design/palette.dark.json'],
    'a digest is over the list, so the same file counted twice by two specs would be a different '
    + 'fingerprint for the same tree');
});

test('a spec that reaches nothing is reported, because it fingerprints nothing and caches everything', () => {
  assert.deepEqual(unreachedSpecs(['contracts/design', 'contracts/typo/*.json'], UNIVERSE),
    ['contracts/typo/*.json']);
});

test('a leading ./ and a trailing / are the same spec written two ways', () => {
  assert.equal(normalizeSpec('./contracts/design/'), 'contracts/design');
  assert.equal(matchesSpec('./contracts/design/', 'contracts/design/colors.css'), true);
});
