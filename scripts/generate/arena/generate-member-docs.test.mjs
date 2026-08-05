/* The writer edits hand-authored sources, which nothing else here does, so these cases pin the
 * three ways that goes wrong: a doc inserted twice, a stale doc left beside the fresh one, and a
 * member the line reader never sees because a sibling shares its line. */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDocs, docsFor, unpackMembers, stripDocAbove, writeMemberDocs, PACKED_MEMBERS,
} from './generate-member-docs.mjs';

const bindingName = (name, form, layer) => {
  if (layer !== 'react') return name;
  if (form === 'slot') return name === 'content' ? 'children' : name;
  if (form === 'event') return `on${name[0].toUpperCase()}${name.slice(1)}`;
  return name;
};

test('a React member gets its contract description above it, indented as it is', () => {
  const source = 'export interface XProps {\n  floating?: boolean;\n}\n';
  const out = applyDocs(source, new Map([['floating', 'Adds the warm shadow.']]), 'react');
  assert.equal(out, 'export interface XProps {\n  /** Adds the warm shadow. */\n  floating?: boolean;\n}\n');
});

test('an Angular input gets one too, and readonly does not hide the name', () => {
  const source = 'export class X {\n  readonly floating = input(false);\n}\n';
  const out = applyDocs(source, new Map([['floating', 'Adds the warm shadow.']]), 'angular');
  assert.match(out, /\/\*\* Adds the warm shadow\. \*\/\n {2}readonly floating/);
});

test('running twice changes nothing, so the writer is not an append', () => {
  const source = 'export interface XProps {\n  floating?: boolean;\n}\n';
  const docs = new Map([['floating', 'Adds the warm shadow.']]);
  const once = applyDocs(source, docs, 'react');
  assert.equal(applyDocs(once, docs, 'react'), once);
});

test('a drifted doc is replaced rather than joined, single line or multi', () => {
  const single = 'export interface XProps {\n  /** Old wording. */\n  floating?: boolean;\n}\n';
  const out = applyDocs(single, new Map([['floating', 'New wording.']]), 'react');
  assert.doesNotMatch(out, /Old wording/, 'the stale doc survived beside the fresh one');
  assert.equal((out.match(/\/\*\*/g) ?? []).length, 1);

  const multi = 'export interface XProps {\n  /**\n   *  Old\n   *  wording.\n   */\n  floating?: boolean;\n}\n';
  const both = applyDocs(multi, new Map([['floating', 'New wording.']]), 'react');
  assert.doesNotMatch(both, /Old/, 'a multi-line stale doc survived');
  assert.equal((both.match(/\/\*\*/g) ?? []).length, 1);
});

test('a member sharing a line with a sibling is still reached, which is how ArenaAlert was written', () => {
  const packed = '  title?: string; children?: React.ReactNode; icon?: string;';
  assert.match(packed, PACKED_MEMBERS);
  assert.deepEqual(unpackMembers(packed).split('\n'), [
    '  title?: string;', '  children?: React.ReactNode;', '  icon?: string;',
  ]);

  const source = `export interface XProps {\n${packed}\n}\n`;
  const out = applyDocs(source, new Map([['icon', 'A glyph.']]), 'react');
  assert.match(out, /\/\*\* A glyph\. \*\/\n {2}icon\?: string;/);
});

test('a function-typed member packed beside another is split too, parentheses and all', () => {
  const packed = '  actionLabel?: string; onAction?: () => void;';
  assert.deepEqual(unpackMembers(packed).split('\n'), ['  actionLabel?: string;', '  onAction?: () => void;']);
});

test('a member name reused as an object key outside the props interface is left alone', () => {
  const source = 'export interface XProps {\n  gap?: string;\n}\n\n'
    + 'export function X({ gap }: XProps) {\n  const style = {\n'
    + '    gap: STEP[gap],\n  };\n  return style;\n}\n';
  const out = applyDocs(source, new Map([['gap', 'The air between cells.']]), 'react');
  assert.equal((out.match(/\/\*\*/g) ?? []).length, 1,
    'the description landed inside the render as well -- a style key is not a member, and '
    + 'check:api holds every doc under components/ equal to a contract it can find');
  assert.match(out, /\/\*\* The air between cells\. \*\/\n {2}gap\?: string;/);
});

test('a line that is one member is left exactly alone', () => {
  const line = '  floating?: boolean;';
  assert.doesNotMatch(line, PACKED_MEMBERS);
  assert.equal(unpackMembers(line), line);
});

test('stripDocAbove finds the start of a block and reports the member itself when there is none', () => {
  const lines = ['/**', ' *  a', ' */', 'x'];
  assert.equal(stripDocAbove(lines, 3), 0);
  assert.equal(stripDocAbove(['x'], 0), 0);
});

test('docsFor keys by the layer binding, so a React event is found under its on- name', () => {
  const contract = {
    api: {
      click: { form: 'event', description: 'It was activated.' },
      content: { form: 'slot', description: 'The body.' },
      floating: { form: 'primitive', type: 'boolean', description: 'The shadow.' },
      quiet: { form: 'primitive', type: 'boolean' },
    },
  };
  assert.deepEqual([...docsFor(contract, 'react', bindingName).keys()], ['onClick', 'children', 'floating']);
  assert.deepEqual([...docsFor(contract, 'angular', bindingName).keys()], ['click', 'content', 'floating']);
});

test('a member with no description in the contract is left undocumented rather than given an empty block', () => {
  const source = 'export interface XProps {\n  quiet?: boolean;\n}\n';
  const contract = { api: { quiet: { form: 'primitive', type: 'boolean' } } };
  assert.equal(applyDocs(source, docsFor(contract, 'react', bindingName), 'react'), source);
});

test('writeMemberDocs writes only what changed, so a clean tree is a no-op', () => {
  const files = new Map([
    ['/x/A.tsx', 'export interface AProps {\n  floating?: boolean;\n}\n'],
    ['/x/A.ts', 'export class A {\n  /** The shadow. */\n  readonly floating = input(false);\n}\n'],
  ]);
  const contracts = [{
    component: 'A',
    api: { floating: { form: 'primitive', type: 'boolean', description: 'The shadow.' } },
  }];
  const sources = new Map([['A', { react: '/x/A.tsx', angular: '/x/A.ts' }]]);

  const written = writeMemberDocs({
    contracts,
    sources,
    bindingName,
    read: (p) => files.get(p),
    write: (p, text) => files.set(p, text),
  });

  assert.deepEqual(written, ['/x/A.tsx'], 'the already-current Angular source was rewritten anyway');
  assert.match(files.get('/x/A.tsx'), /\/\*\* The shadow\. \*\//);
});
