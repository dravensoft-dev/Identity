import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, selectorKeys, symbolKeys, namedImports, AUTO } from './components.mjs';

const ANGULAR = {
  match: 'selector',
  draws: {
    'arena-button': 'button',
    'arena-table': 'table',
    'arena-table-row': 'table',
    'arena-pagination': 'pagination',
    'arena-select': 'select',
    'arena-bar-chart': null,
  },
  needs: { table: ['pagination', 'select'] },
};

const REACT = {
  match: 'symbol',
  draws: { Button: 'button', Table: 'table', TableRow: 'table', Pagination: 'pagination', Select: 'select', BarChart: null },
  needs: { table: ['pagination', 'select'] },
};

test('the key a consumer writes is not the sheet that dresses it', () => {
  const { components } = resolve(ANGULAR, ['<arena-table-row />'], '@dravensoft/arena-angular');
  assert.deepEqual(components, ['pagination', 'select', 'table'], 'a row wears the table, and the table brings two');
});

test('what Arena draws for you is added and named apart from what you drew', () => {
  const found = resolve(ANGULAR, ['<arena-table></arena-table>'], '@dravensoft/arena-angular');
  assert.deepEqual(found.drawn, ['table']);
  assert.deepEqual(found.pulled, ['pagination', 'select']);
});

test('a sheet you already draw is never counted as one Arena pulled in', () => {
  const found = resolve(ANGULAR, ['<arena-table /><arena-select />'], '@dravensoft/arena-angular');
  assert.deepEqual(found.pulled, ['pagination'], 'select is yours, so it is not also Arena\'s doing');
  assert.deepEqual(found.components, ['pagination', 'select', 'table']);
});

test('a component that draws no classes costs no sheet, and is not a miss either', () => {
  const found = resolve(ANGULAR, ['<arena-bar-chart /><arena-button />'], '@dravensoft/arena-angular');
  assert.deepEqual(found.components, ['button']);
  assert.deepEqual(found.unplaced, [], 'it is in the map, so nothing is reported about it');
});

test('an element wearing the prefix that Arena does not ship is reported and stops nothing', () => {
  const found = resolve(ANGULAR, ['<arena-widget /><arena-button />'], '@dravensoft/arena-angular');
  assert.deepEqual(found.unplaced, ['arena-widget']);
  assert.deepEqual(found.components, ['button'], 'the run still has a subset to write');
});

test('a selector is matched at its end, so one name is not read inside a longer one', () => {
  const { drawn } = selectorKeys(ANGULAR, ['<arena-table-row />']);
  assert.deepEqual(drawn, ['arena-table-row'], 'arena-table is a prefix of it and was not drawn');
});

test('React is read through the import that names the package', () => {
  const source = "import { Button, Table as Grid } from '@dravensoft/arena-react';";
  const { drawn } = symbolKeys(REACT, [source], '@dravensoft/arena-react');
  assert.deepEqual(drawn, ['Button', 'Table'], 'the alias is the consumer\'s; the name in the import is Arena\'s');
});

test('React is also read through the tag it opens, for a symbol reached another way', () => {
  const { drawn } = symbolKeys(REACT, ['<Pagination page={1} />'], '@dravensoft/arena-react');
  assert.deepEqual(drawn, ['Pagination']);
});

test('a bare word is not a component, because half this library is called Table in somebody else\'s code', () => {
  const { drawn } = symbolKeys(REACT, ['const Table = ourOwnThing; render(Table);'], '@dravensoft/arena-react');
  assert.deepEqual(drawn, [], 'no import from the package and no tag opened, so nothing of Arena\'s was written');
});

test('the import is matched against this package alone', () => {
  const shape = namedImports('@dravensoft/arena-react');
  assert.ok(shape.test("import { Button } from '@dravensoft/arena-react';"));
  assert.equal(namedImports('@dravensoft/arena-react').test("import { Button } from '@acme/arena-react';"), false);
});

test('a map keyed by something this command cannot scan for is an answer of none', () => {
  assert.equal(resolve({ match: 'behaviour', draws: {}, needs: {} }, ['x'], '@dravensoft/arena-react'), null);
});

test('the word the config takes is stated once', () => {
  assert.equal(AUTO, 'auto');
});
