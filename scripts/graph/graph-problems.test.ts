import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aliasProblems, emptySpecProblems, namingProblems, staleExceptions, unaccountedScripts,
  unreachedSpecNotes, vacuousProblems,
} from './graph-problems.ts';

const node = (name: string, over: Partial<{ reads: string[]; writes: string[]; feeds: string[] }> = {}) =>
  ({ name, reads: [], writes: [], feeds: [], ...over });

const PATHS = ['contracts/design/colors.css', 'frameworks/react/components/A.tsx'];

test('a script in neither list is a decision nobody made', () => {
  assert.deepEqual(unaccountedScripts(['scripts/build/react/new-step.ts'], new Map(), new Set(), () => null), [
    'scripts/build/react/new-step.ts declares no node and is in neither list; a script that opts '
    + 'out of the graph has to say why, and one that has not opted in yet has to be counted',
  ]);
});

test('a declared script is accounted for by its declaration and needs no list entry', () => {
  const declaredIn = new Map([['build:new', 'scripts/build/react/new-step.ts']]);
  assert.deepEqual(unaccountedScripts(['scripts/build/react/new-step.ts'], declaredIn, new Set(), () => null), []);
});

test('an exception that has since subscribed is stale, and so is one whose script has gone', () => {
  const notYet = new Set(['scripts/check/core/check-dtcg.ts']);
  const none = () => null;
  const declaredIn = new Map([['check:dtcg', 'scripts/check/core/check-dtcg.ts']]);

  assert.deepEqual(staleExceptions(['scripts/check/core/check-dtcg.ts'], declaredIn, notYet, none), [
    'NOT_YET_SUBSCRIBED names scripts/check/core/check-dtcg.ts, which now declares a node; drop it',
  ]);
  assert.deepEqual(staleExceptions([], new Map(), notYet, none), [
    'NOT_YET_SUBSCRIBED names scripts/check/core/check-dtcg.ts, which is not there',
  ]);
  assert.deepEqual(staleExceptions(['scripts/check/core/check-dtcg.ts'], new Map(), notYet, none), [],
    'a script that has not subscribed and is named as not having subscribed is the state this list '
    + 'exists to record, and it is silent');
});

test('a never-subscribes entry that has since declared is stale too', () => {
  const declaredIn = new Map([['check:docs', 'scripts/check/arena/check-docs.ts']]);
  assert.deepEqual(staleExceptions([], declaredIn, new Set(), () => 'a reason'), [
    'NEVER_SUBSCRIBES covers scripts/check/arena/check-docs.ts, and it declares check:docs; the '
    + 'exception outlived what it was written for',
  ]);
});

test('a node whose name is no npm script is a node nobody can invoke', () => {
  const declaredIn = new Map([['build:typo', 'scripts/build/react/build-vendor.ts']]);
  assert.deepEqual(namingProblems([node('build:typo')], declaredIn, new Set(['build:vendor'])), [
    'scripts/build/react/build-vendor.ts declares build:typo, and package.json has no script by that name',
  ]);
});

test('a name an alias stands for counts as invocable, because the alias is what package.json holds', () => {
  const declaredIn = new Map([['generate:api-types', 'scripts/generate/arena/generate-api-types.ts']]);
  assert.deepEqual(namingProblems([node('generate:api-types')], declaredIn, new Set(['generate:api'])), []);
});

test('an alias standing for a node that is not there is caught', () => {
  assert.deepEqual(aliasProblems([node('generate:api-types')]).length > 0, true);
});

test('a node reading nothing that is there would come from the cache for ever', () => {
  const resolve = () => [];
  assert.deepEqual(emptySpecProblems([node('check:x', { reads: ['contracts/design'] })], PATHS, resolve), [
    'check:x reads nothing that is there, so its fingerprint is over an empty list and it would '
    + 'come from the cache for ever',
  ]);
});

test('a spec whose directory holds no file fails, and one whose directory is there is a note', () => {
  const resolve = (specs: string[]) => (specs.includes('contracts/design/colors.css') ? PATHS : []);
  const typo = node('check:x', { reads: ['contracts/design/colors.css', 'contracts/typo/*.json'] });
  assert.deepEqual(emptySpecProblems([typo], PATHS, resolve), [
    'check:x names contracts/typo/*.json, and the directory it sits in holds no file at all -- a '
    + 'spec written for a tree that is not there reaches nothing however the tree grows',
  ]);

  const ahead = node('check:y', { reads: ['contracts/design/colors.css', 'frameworks/react/components/**/*.jsx'] });
  assert.deepEqual(emptySpecProblems([ahead], PATHS, resolve), []);
  assert.deepEqual(unreachedSpecNotes([ahead], PATHS), [
    'check:y names frameworks/react/components/**/*.jsx, which matches no file today; its directory '
    + 'is there, so this reads as an extension the node compiles and the tree does not hold yet',
  ]);
});

test('a spec a node writes names what that node creates, so a tree without it is not a defect', () => {
  const resolve = (specs: string[]) => (specs.includes('contracts/design/colors.css') ? PATHS : []);
  const emit = node('build:x', {
    reads: ['contracts/design/colors.css'],
    writes: ['frameworks/angular/build/test/**'],
  });

  assert.deepEqual(emptySpecProblems([emit], PATHS, resolve), [],
    'the step has not run, and a gate judging the shape cannot answer differently depending on '
    + 'which steps happen to have run before it');
  assert.deepEqual(unreachedSpecNotes([emit], PATHS), [
    'build:x writes frameworks/angular/build/test/**, and nothing here matches it; what a step '
    + 'emits is on disk once that step has run, so this is either the tree before the run or a '
    + 'typo, and only a full build tells them apart',
  ]);
});

test('a run that compared nothing says so rather than passing', () => {
  assert.deepEqual(vacuousProblems([], []), ['no script was collected, so this gate compared nothing']);
  assert.deepEqual(vacuousProblems([], ['scripts/build/a.ts']), ['no script declares a node, so this gate compared nothing']);
  assert.deepEqual(vacuousProblems([node('a')], ['scripts/build/a.ts']), []);
});
