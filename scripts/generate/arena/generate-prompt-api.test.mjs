import test from 'node:test';
import assert from 'node:assert/strict';
import {
  typeCell, defaultCell, memberRow, renderRegion, applyRegion, fenceEnd, signature,
  promptPaths, writePromptApis, openLine, CLOSE_LINE, CONSUMER_DATA,
} from './generate-prompt-api.mjs';

test('an array names what it holds, and consumer data keeps its one spelling', () => {
  assert.equal(typeCell({ form: 'array', of: 'ArenaCrumb' }), '`readonly ArenaCrumb[]`');
  assert.equal(typeCell({ form: 'array', of: 'consumerData' }), `\`readonly ${CONSUMER_DATA}[]\``);
  assert.equal(typeCell({ form: 'consumerData' }), `\`${CONSUMER_DATA}\``);
});

test('an event with no payload has no type, because there is nothing to carry', () => {
  assert.equal(typeCell({ form: 'event' }), '');
  assert.equal(typeCell({ form: 'event', payload: 'boolean' }), '`boolean`');
});

test('a functionInput renders the signature the contract models', () => {
  assert.equal(
    typeCell({ form: 'functionInput', params: { value: 'string' }, returns: 'string' }),
    '`(value: string) => string`',
  );
  assert.equal(signature({ a: 'string', b: 'number' }), 'a: string, b: number');
});

test('a slot carries a type only when it is parameterised', () => {
  assert.equal(typeCell({ form: 'slot' }), '');
  assert.equal(typeCell({ form: 'slot', params: { row: 'ArenaTableColumn' } }), '`(row: ArenaTableColumn)`');
});

test('a default is written in its JSON form, so a string zero is not read as a number', () => {
  assert.equal(defaultCell({ default: 'md' }), '`"md"`');
  assert.equal(defaultCell({ default: 0 }), '`0`');
  assert.equal(defaultCell({ default: false }), '`false`');
  assert.equal(defaultCell({}), '');
});

test('a member row binds the name to the layer and stars a required one', () => {
  const spec = { form: 'slot', required: true, description: 'The label text.' };
  assert.equal(memberRow('content', spec, 'react'), '| `children*` | slot |  |  | The label text. |');
  assert.equal(memberRow('content', spec, 'angular'), '| `content*` | slot |  |  | The label text. |');
});

test('a description spanning lines becomes one cell, and a pipe cannot split the row', () => {
  const spec = { form: 'primitive', type: 'string', description: 'one\ntwo | three' };
  assert.match(memberRow('a', spec, 'react'), /\| one two \\\| three \|$/);
});

test('a component declaring no member says so rather than drawing an empty table', () => {
  const region = renderRegion({ component: 'X', api: {} }, 'react');
  assert.ok(region.includes('declares none'));
  assert.ok(!region.includes('| Member |'));
  assert.ok(region.startsWith(openLine('X')));
  assert.ok(region.endsWith(CLOSE_LINE));
});

test('the region lands after the first example when the markers are absent', () => {
  const source = 'What it is.\n\n```tsx\n<X />\n```\n\nDo not do that.\n';
  const out = applyRegion(source, 'REGION');
  assert.equal(out, 'What it is.\n\n```tsx\n<X />\n```\n\nREGION\n\nDo not do that.\n');
});

test('a second run replaces the region in place rather than adding another', () => {
  const first = applyRegion('What it is.\n\n```tsx\n<X />\n```\n', renderRegion({ component: 'X', api: {} }, 'react'));
  const second = applyRegion(first, renderRegion({ component: 'X', api: {} }, 'react'));
  assert.equal(first, second);
  assert.equal(second.split(CLOSE_LINE).length - 1, 1);
});

test('a fence closes only on a run at least as long as the one that opened it', () => {
  assert.equal(fenceEnd('````\n```\n````\n'), 2);
  assert.equal(fenceEnd('no fence here\n'), -1);
});

test('a prompt with no example to place the region after is an error, never a silent skip', () => {
  assert.throws(() => applyRegion('Just prose.\n', 'REGION'), /no fenced example/);
});

test('a region that opens and never closes is an error rather than a second region', () => {
  assert.throws(() => applyRegion(`${openLine('X')}\nrows\n`, 'REGION'), /never closes/);
});

test('every prompt in the tree is reached, in both layers', () => {
  const paths = promptPaths();
  assert.ok(paths.length > 100, `reached only ${paths.length} prompt(s)`);
  for (const layer of ['react', 'angular']) {
    assert.ok(paths.some((p) => p.layer === layer), `reached no ${layer} prompt`);
  }
});

test('a fresh run over the committed tree writes nothing, which is what the gate asserts', () => {
  const written = writePromptApis({ write: () => { throw new Error('wrote a file'); } });
  assert.deepEqual(written, []);
});
