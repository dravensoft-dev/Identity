import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTree } from './check-dtcg.mjs';

const ok = (tree) => assert.deepEqual(validateTree(tree, 'f.json'), []);
const fails = (tree, re) => {
  const errs = validateTree(tree, 'f.json');
  assert.ok(errs.length > 0, 'expected at least one violation');
  assert.match(errs.join('\n'), re);
};

test('accepts a conformant tree with group-level $type inheritance', () => {
  ok({ sp: { $type: 'dimension', 0: { $value: { value: 0, unit: 'px' } }, 1: { $value: { value: 4, unit: 'px' } } } });
});

test('rejects a token that resolves no $type', () => {
  fails({ mystery: { $value: 3 } }, /no \$type/);
});

test('rejects a bare hex string color', () => {
  fails({ c: { $type: 'color', p: { $value: '#b52a20' } } }, /color .* object/);
});

test('accepts a structured srgb color and rejects out-of-range components', () => {
  ok({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [0.1, 0.2, 0.3] } } } });
  fails({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [1.5, 0, 0] } } } }, /components/);
});

test('rejects a hex that does not round-trip its components', () => {
  ok({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [0.7098, 0.1647, 0.1255], hex: '#b52a20' } } } });
  fails({ c: { $type: 'color', p: { $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#b52a20' } } } }, /hex .* components/);
});

test('rejects a string dimension and a dimension missing its unit', () => {
  fails({ d: { $type: 'dimension', a: { $value: '64px' } } }, /dimension .* object/);
  fails({ d: { $type: 'dimension', a: { $value: { value: 0 } } } }, /unit/);
});

test('rejects a cubicBezier with the wrong arity or an out-of-range x', () => {
  ok({ e: { $type: 'cubicBezier', a: { $value: [0.2, 0.7, 0.3, 1] } } });
  fails({ e: { $type: 'cubicBezier', a: { $value: [0.2, 0.7, 0.3] } } }, /four numbers/);
  fails({ e: { $type: 'cubicBezier', a: { $value: [1.4, 0.7, 0.3, 1] } } }, /between 0 and 1/);
});

test('validates a shadow composite down to its parts', () => {
  const px = (value) => ({ value, unit: 'px' });
  ok({ s: { $type: 'shadow', a: { $value: {
    offsetX: px(0), offsetY: px(2), blur: px(6), spread: px(-2),
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 } } } } });
  fails({ s: { $type: 'shadow', a: { $value: { offsetX: px(0), offsetY: px(2), blur: px(6) } } } }, /spread/);
});

test('rejects a non reverse-DNS $extensions key', () => {
  fails({ n: { $type: 'number', a: { $value: 1, $extensions: { cssUnit: 'em' } } } }, /reverse-DNS/);
  ok({ n: { $type: 'number', a: { $value: 1, $extensions: { 'com.dravensoft.arena': { cssUnit: 'em' } } } } });
});

test('rejects a token name containing a dot', () => {
  fails({ 'a.b': { $type: 'number', $value: 1 } }, /name/);
});
