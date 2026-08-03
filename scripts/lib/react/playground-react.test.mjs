import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  typeExpr, contractTypes, importPath, renderNode, renderSubject, renderTree, knobsInterface,
  validatorTable, reactEntry, reactPage,
} from './playground-react.mjs';

const places = new Map([
  ['Card', { name: 'Card', category: 'display', dir: 'card', self: true }],
  ['Badge', { name: 'Badge', category: 'display', dir: 'badge' }],
  ['Table', { name: 'Table', category: 'display', dir: 'table' }],
]);

const knob = (over) => ({
  member: 'x', form: 'primitive', type: 'string', bind: 'optional', bound: false,
  control: 'text', codec: 'raw', initial: '', nodes: null, doc: 'A member.', ...over,
});

const model = {
  component: 'Card',
  description: 'A surface.',
  note: 'A note.',
  affordances: [],
  knobs: [
    knob({ member: 'title', bind: 'pinned' }),
    knob({ member: 'tone', form: 'enum', type: 'Tone', bind: 'defaulted', control: 'select', options: ['neutral'] }),
    knob({ member: 'content', form: 'slot', type: null, control: 'slotText', initial: 'Body.', nodes: [{ text: 'Body.' }] }),
    knob({
      member: 'action', form: 'slot', type: null, control: 'slotPresence', codec: 'flag', initial: true,
      nodes: [{ component: 'Badge', members: { tone: 'success' }, slots: { content: [{ text: 'Live' }] } }],
    }),
  ],
  events: [
    { name: 'click', payload: null, bind: null, doc: 'Clicked.' },
    { name: 'sortChange', payload: 'TableSort', bind: 'sort', doc: 'Sorted.' },
  ],
  host: null,
  uses: ['Badge'],
};

test('a type expression follows the form, and a slot is what its control can hold', () => {
  assert.equal(typeExpr(knob({ type: 'string' })), 'string');
  assert.equal(typeExpr(knob({ form: 'array', type: 'TableColumn' })), 'TableColumn[]');
  assert.equal(typeExpr(knob({ form: 'slot', control: 'slotText' })), 'string');
  assert.equal(typeExpr(knob({ form: 'slot', control: 'slotPresence' })), 'boolean');
  assert.equal(typeExpr(knob({ form: 'functionInput' })), 'string');
});

test('only a declared type is imported, never a primitive', () => {
  assert.deepEqual(contractTypes(model), ['Tone']);
  assert.deepEqual(contractTypes({ knobs: [knob({ form: 'array', type: 'string' })] }), []);
});

test('a component is reached through its category, and itself through the directory it sits in', () => {
  assert.equal(importPath(places.get('Badge')), '../../display/badge/Badge.tsx');
  assert.match(reactEntry(model, places, ''), /import \{ Card \} from '\.\/Card\.tsx';/);
  assert.match(reactEntry(model, places, ''), /import \{ Badge \} from '\.\.\/\.\.\/display\/badge\/Badge\.tsx';/);
});

test('a literal reaches JSX through one escaping rule rather than one per type', () => {
  const node = { component: 'Badge', members: { tone: 'a"b', dot: true, n: 3, list: [1, 2] }, slots: {} };
  const out = renderNode(node, places, 0);
  assert.match(out, /tone=\{"a\\"b"\}/);
  assert.match(out, /dot=\{true\}/);
  assert.match(out, /n=\{3\}/);
  assert.match(out, /list=\{\[1,2\]\}/);
});

test('a text node becomes an expression container, so a brace in the copy is not markup', () => {
  assert.equal(renderNode({ text: 'a {b} c' }, places, 0).trim(), '{"a {b} c"}');
});

test('a required member is not optional in the interface, and an optional one is', () => {
  const out = knobsInterface(model);
  assert.match(out, /^ {2}title: string;$/m);
  assert.match(out, /^ {2}tone: Tone;$/m);
  assert.match(out, /^ {2}content\?: string;$/m);
});

test('every member is written out rather than spread, so the two layers read as translations', () => {
  const out = renderSubject(model, places, 0);
  assert.match(out, /title=\{k\.title\}/);
  assert.match(out, /tone=\{k\.tone\}/);
});

test('a void event takes no parameter and a payload event forwards one', () => {
  const out = renderSubject(model, places, 0);
  assert.match(out, /onClick=\{\(\) => play\.fire\("click"\)\}/);
  assert.match(out, /onSortChange=\{\(payload\) => play\.fire\("sortChange", payload\)\}/);
});

test('a text slot renders its knob and a presence slot renders its fixed tree behind a guard', () => {
  const out = renderSubject(model, places, 0);
  assert.match(out, /\{k\.content\}/);
  assert.match(out, /action=\{k\.action \? \(/);
  assert.match(out, /<Badge/);
  assert.match(out, /\) : undefined\}/);
});

test('an unfilled slot resolves to undefined rather than to empty content', () => {
  const textSlot = { ...model, knobs: [knob({ member: 'empty', form: 'slot', type: null, control: 'slotText', initial: '' })], events: [], uses: [] };
  assert.match(renderSubject(textSlot, places, 0), /empty=\{k\.empty === undefined \? undefined :/);
});

test('a host wraps the subject where the placeholder marks, and nowhere else', () => {
  const hosted = { ...model, host: { component: 'Table', members: { label: 'L' }, slots: { content: ['$subject'] } } };
  const out = renderTree(hosted, places, 0);
  assert.match(out, /^<Table/);
  assert.match(out, /label=\{"L"\}/);
  assert.match(out, /<Card/);
  assert.match(out, /<\/Table>$/);
});

test('the validator table appears only for a contract that declares a function input', () => {
  assert.equal(validatorTable(model), '');
  assert.match(validatorTable({ knobs: [knob({ form: 'functionInput' })] }), /nonEmpty/);
});

test('the entry mounts once and carries the model as a literal', () => {
  const out = reactEntry(model, places, '/* banner */\n');
  assert.ok(out.startsWith('/* banner */\n'));
  assert.match(out, /const MODEL: KnobModel = \{/);
  assert.equal(out.match(/createRoot\(/g).length, 1);
});

test('the page mounts into the root the entry looks for and declares no card', () => {
  const page = reactPage(model, '<!-- banner -->\n');
  assert.match(page, /<div id="root"><\/div>/);
  assert.match(page, /Card\.demo\.entry\.generated\.js/);
  assert.doesNotMatch(page, /@dsCard/);
  assert.match(page, /importmap/);
  assert.match(page, /frameworks\/tailwind\/consume\/Preflight\.generated\.css/);
  assert.match(page, /consume\/components\/display\/card\/Card\.styles\.generated\.css/,
    'a page links the compiled CSS from the one place it exists, and only for what it draws');
});

test('a slot with several nodes becomes a keyed array, never a fragment', () => {
  const many = {
    ...model,
    knobs: [{
      member: 'content', form: 'slot', type: null, bind: 'optional', bound: true,
      control: 'slotPresence', codec: 'flag', initial: true, doc: '',
      nodes: [{ component: 'Badge', slots: {} }, { component: 'Badge', slots: {} }],
    }],
    events: [],
  };
  const out = renderSubject(many, places, 0);
  assert.match(out, /\{k\.content \? \[/);
  assert.match(out, /key=\{0\}/);
  assert.match(out, /key=\{1\}/);
  assert.doesNotMatch(out, /React\.Fragment/,
    'Tabs, Table and RadioGroup read direct children through Children.toArray, which a fragment hides');
});

test('a host recurses only down the branch the subject sits in', () => {
  const hosted = {
    ...model,
    host: {
      component: 'Table',
      slots: { content: ['$subject', { component: 'Badge', slots: { content: [{ text: 'other' }] } }] },
    },
  };
  const out = renderTree(hosted, places, 0);
  assert.match(out, /<Card/);
  assert.match(out, /\{"other"\}/, 'a sibling that holds no subject is still rendered');
});

test('a component reached twice is imported once', () => {
  const twice = { ...model, uses: ['Badge', 'Card'] };
  const out = reactEntry(twice, places, '');
  assert.equal(out.match(/import \{ Card \}/g).length, 1);
});
