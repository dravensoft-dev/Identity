import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeScript, scriptName } from './lib/serialize-script.mjs';

test('a dimension yields its bare number, unit dropped', () => {
  assert.equal(serializeScript({ $type: 'dimension', $value: { value: 280, unit: 'px' } }), 280);
});

test('a zero dimension yields 0, not the empty string', () => {
  assert.equal(serializeScript({ $type: 'dimension', $value: { value: 0, unit: 'px' } }), 0);
});

test('a duration yields its bare number in ms', () => {
  assert.equal(serializeScript({ $type: 'duration', $value: { value: 4200, unit: 'ms' } }), 4200);
});

test('a number yields itself, and the cssUnit render hint is ignored', () => {
  const token = {
    $type: 'number',
    $value: 0.02,
    $extensions: { 'com.dravensoft.arena': { cssUnit: 'em' } },
  };
  assert.equal(serializeScript(token), 0.02);
});

test('a type whose value is not a number is refused', () => {
  assert.throws(
    () => serializeScript({ $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0] } }),
    /not script-readable/,
  );
});

test('scriptName camelCases a kebab token name', () => {
  assert.equal(scriptName('chart-pad-left'), 'chartPadLeft');
  assert.equal(scriptName('chart-height'), 'chartHeight');
  assert.equal(scriptName('sp-4'), 'sp4');
});
