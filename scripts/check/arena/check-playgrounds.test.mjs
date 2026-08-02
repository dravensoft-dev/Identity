import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  coverageProblems, shapeProblems, seedProblems, slotProblems, bindProblems, hostProblems,
  valueProblems, objectProblems, nodeProblems, fixtureProblems, citationProblems,
  loadContracts, loadFixtures, loadTypes, citingFiles, basenameIndex,
} from './check-playgrounds.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

const types = new Map([
  ['Tone', { name: 'Tone', kind: 'enum', values: ['neutral', 'accent', 'danger'] }],
  ['SortDirection', { name: 'SortDirection', kind: 'enum', values: ['asc', 'desc'] }],
  ['TableSort', {
    name: 'TableSort',
    kind: 'object',
    fields: {
      column: { form: 'primitive', type: 'number', required: true, description: 'The column.' },
      direction: { form: 'enum', type: 'SortDirection', required: true, description: 'The direction.' },
    },
  }],
  ['TableColumn', {
    name: 'TableColumn',
    kind: 'object',
    fields: { header: { form: 'primitive', type: 'string', required: true, description: 'The header.' } },
  }],
]);

const widget = {
  component: 'Widget',
  description: 'A widget.',
  affordances: [],
  api: {
    label: { form: 'primitive', type: 'string', required: true, description: 'The name.' },
    tone: { form: 'enum', type: 'Tone', default: 'neutral', description: 'The tone.' },
    index: { form: 'primitive', type: 'number', description: 'A position.' },
    columns: { form: 'array', of: 'TableColumn', description: 'The columns.' },
    sort: { form: 'object', type: 'TableSort', description: 'The sort.' },
    content: { form: 'slot', description: 'The body.' },
    mark: { form: 'slot', required: true, description: 'The mark.' },
    sortChange: { form: 'event', payload: 'TableSort', description: 'Sorted.' },
    close: { form: 'event', description: 'Closed.' },
  },
};

const badge = {
  component: 'Badge',
  api: { content: { form: 'slot', description: 'The label.' }, tone: { form: 'enum', type: 'Tone', default: 'neutral', description: 'The tone.' } },
};

const contracts = new Map([['Widget', widget], ['Badge', badge]]);

const ok = {
  component: 'Widget',
  seed: { label: 'Client Portal' },
  slots: { mark: [{ text: 'W' }] },
};

test('a well-formed fixture has no problems', () => {
  assert.deepEqual(fixtureProblems('Widget', widget, ok, contracts, types), []);
});

test('an empty contract set and an empty fixture set are failures, not clean passes', () => {
  const problems = coverageProblems(new Map(), new Map());
  assert.equal(problems.length, 2);
  assert.match(problems[0], /an empty result set is a failure/);
});

test('coverage is bidirectional: a contract with no fixture and a fixture with no contract both fail', () => {
  const problems = coverageProblems(new Map([['A', {}]]), new Map([['B', {}]]));
  assert.match(problems[0], /A: contracted but frameworks\/demos\/A\.demo\.json does not exist/);
  assert.match(problems[1], /B\.demo\.json: no contract named B/);
});

test('a fixture whose component disagrees with its filename fails', () => {
  assert.match(shapeProblems('Widget', { component: 'Gadget' })[0], /declares component "Gadget"/);
});

test('a fixture carrying a key the schema does not know fails', () => {
  assert.match(shapeProblems('Widget', { component: 'Widget', extras: {} })[0], /carries extras/);
});

test('a seed naming a member the contract does not declare fails', () => {
  const problems = seedProblems('Widget', widget, { seed: { label: 'x', nope: 1 } }, types);
  assert.match(problems[0], /seed\.nope: the contract declares no such member/);
});

test('a required member with no default and no seed fails, naming the fixture', () => {
  assert.match(seedProblems('Widget', widget, { seed: {} }, types)[0], /label is required and carries no default/);
});

test('a seed of the wrong primitive type fails, and this is what stops a page that renders and lies', () => {
  assert.match(seedProblems('Widget', widget, { seed: { label: 42 } }, types)[0], /declares string and the fixture holds number/);
});

test('a seed outside an enum\'s declared values fails, naming the values', () => {
  assert.match(
    seedProblems('Widget', widget, { seed: { label: 'x', tone: 'gold' } }, types)[0],
    /"gold" is not one of Tone's \["neutral","accent","danger"\]/,
  );
});

test('an array seed is checked item by item', () => {
  assert.match(
    valueProblems('w.columns', widget.api.columns, [{ header: 'Service' }, { header: 7 }], types)[0],
    /columns\[1\]\.header: declares string and the fixture holds number/,
  );
});

test('an object seed is checked field by field, including a field the type does not declare', () => {
  assert.match(objectProblems('w.sort', 'TableSort', { column: 0, direction: 'asc', nope: 1 }, types)[0], /TableSort declares no such field/);
});

test('an object seed omitting a required field fails', () => {
  assert.match(objectProblems('w.sort', 'TableSort', { column: 0 }, types)[0], /TableSort.direction is required and the fixture omits it/);
});

test('a slot the contract does not declare fails', () => {
  assert.match(slotProblems('Widget', widget, { slots: { footer: [] } }, contracts, types)[0], /declares no such slot/);
});

test('a required slot the fixture leaves empty fails', () => {
  assert.match(slotProblems('Widget', widget, { slots: {} }, contracts, types)[0], /mark is a required slot/);
});

test('a slot node naming an uncontracted component fails', () => {
  const problems = slotProblems('Widget', widget, { slots: { mark: [{ component: 'Nope' }] } }, contracts, types);
  assert.match(problems[0], /no component named Nope is contracted/);
});

test('a slot node setting a member the named component does not declare fails', () => {
  const problems = slotProblems('Widget', widget, { slots: { mark: [{ component: 'Badge', members: { size: 'lg' } }] } }, contracts, types);
  assert.match(problems[0], /Badge declares no such member/);
});

test('the subject placeholder is refused outside a host, where it would mark nothing', () => {
  assert.match(
    nodeProblems('w.slots.mark[0]', '$subject', contracts, types, { allowSubject: false })[0],
    /belongs in a host, nowhere else/,
  );
});

test('a host holding no placeholder fails, and one holding two fails', () => {
  const none = fixtureProblems('Widget', widget, { ...ok, host: { component: 'Badge', slots: { content: [] } } }, contracts, types);
  assert.match(none[0], /holding 0 "\$subject" placeholders/);
  const two = fixtureProblems('Widget', widget, { ...ok, host: { component: 'Badge', slots: { content: ['$subject', '$subject'] } } }, contracts, types);
  assert.match(two[0], /holding 2 "\$subject" placeholders/);
});

test('a host node is checked like any other node', () => {
  assert.match(
    hostProblems('Widget', { host: { component: 'Badge', members: { tone: 'gold' }, slots: { content: ['$subject'] } } }, contracts, types)[0],
    /is not one of Tone's/,
  );
});

test('a bind naming something that is not an event fails', () => {
  assert.match(bindProblems('Widget', widget, { bind: { label: 'tone' } }, types)[0], /declares no event called label/);
});

test('a bind writing a payload into a member of another type fails', () => {
  assert.match(bindProblems('Widget', widget, { bind: { sortChange: 'index' } }, types)[0], /carries TableSort and index holds number/);
});

test('a bind writing into a field of an object member is resolved through the type', () => {
  assert.deepEqual(bindProblems('W', { api: { page: { form: 'object', type: 'TableSort' }, ev: { form: 'event', payload: 'number' } } }, { bind: { ev: 'page.column' } }, types), []);
});

test('a void event cannot write a payload anywhere, and says so', () => {
  assert.match(bindProblems('Widget', widget, { bind: { close: 'tone' } }, types)[0], /carries no payload/);
});

test('a patch is type-checked against the member it writes', () => {
  assert.match(bindProblems('Widget', widget, { bind: { close: { tone: 'gold' } } }, types)[0], /is not one of Tone's/);
});

test('$delta steps a number and is refused on anything else', () => {
  assert.deepEqual(bindProblems('Widget', widget, { bind: { close: { index: { $delta: 1 } } } }, types), []);
  assert.match(bindProblems('Widget', widget, { bind: { close: { tone: { $delta: 1 } } } }, types)[0], /\$delta steps a number/);
});

test('the citation check fires on a page name no file carries, which a bare filename is how prose rots', () => {
  const cited = [...citingFiles()];
  const blind = citationProblems(root, cited, new Set());
  assert.ok(
    blind.some((p) => /names \w+\.card\.html, and no file under frameworks\/ is called that/.test(p)),
    'with an empty name index every page a prompt names should be reported, and none was',
  );
});

test('the same citations pass against the real index, so the check is not merely noisy', () => {
  const cited = [...citingFiles()];
  assert.deepEqual(citationProblems(root, cited, basenameIndex(root)), []);
});

test('every real fixture in the tree holds against its real contract', () => {
  const real = loadContracts();
  const fixtures = loadFixtures();
  const realTypes = loadTypes();
  assert.deepEqual(coverageProblems(real, fixtures), []);
  const problems = [...real].flatMap(([name, contract]) =>
    fixtureProblems(name, contract, fixtures.get(name), real, realTypes));
  assert.deepEqual(problems, []);
});
