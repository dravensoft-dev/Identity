import test from 'node:test';
import assert from 'node:assert/strict';
import { serialize } from './lib/serialize-token.mjs';

const px = (value) => ({ value, unit: 'px' });
const em = { $extensions: { 'com.dravensoft.arena': { cssUnit: 'em' } } };

test('dimension renders value+unit, and bare 0 at zero', () => {
  assert.equal(serialize({ $type: 'dimension', $value: px(64) }), '64px');
  assert.equal(serialize({ $type: 'dimension', $value: px(999) }), '999px');
  assert.equal(serialize({ $type: 'dimension', $value: px(0) }), '0');
});

test('duration keeps its unit even though it is a time', () => {
  assert.equal(serialize({ $type: 'duration', $value: { value: 120, unit: 'ms' } }), '120ms');
});

test('number renders bare, or with the cssUnit hint when present', () => {
  assert.equal(serialize({ $type: 'number', $value: 0.98 }), '0.98');
  assert.equal(serialize({ $type: 'number', $value: 1.6 }), '1.6');
  assert.equal(serialize({ $type: 'number', $value: -0.02, ...em }), '-0.02em');
  assert.equal(serialize({ $type: 'number', $value: 0.22, ...em }), '0.22em');
  assert.equal(serialize({ $type: 'number', $value: 0, ...em }), '0');
});

test('fontWeight renders the bare number', () => {
  assert.equal(serialize({ $type: 'fontWeight', $value: 400 }), '400');
  assert.equal(serialize({ $type: 'fontWeight', $value: 900 }), '900');
});

test('cubicBezier strips leading zeros, matching the shipped easings', () => {
  assert.equal(serialize({ $type: 'cubicBezier', $value: [0.2, 0.7, 0.3, 1] }), 'cubic-bezier(.2,.7,.3,1)');
  assert.equal(serialize({ $type: 'cubicBezier', $value: [0.4, 0, 0.2, 1] }), 'cubic-bezier(.4,0,.2,1)');
  assert.equal(serialize({ $type: 'cubicBezier', $value: [0.2, 0.9, 0.1, 1] }), 'cubic-bezier(.2,.9,.1,1)');
});

test('color with a hex field emits that hex verbatim', () => {
  const t = { $type: 'color', $value: { colorSpace: 'srgb', components: [0.7098, 0.1647, 0.1255], hex: '#b52a20' } };
  assert.equal(serialize(t), '#b52a20');
});

test('color without a hex field reconstructs rgba, stripping the alpha leading zero', () => {
  const scrim = { $type: 'color', $value: { colorSpace: 'srgb', components: [0.0784, 0.0627, 0.0627], alpha: 0.6 } };
  assert.equal(serialize(scrim), 'rgba(20,16,16,.6)');
  const black = { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 } };
  assert.equal(serialize(black), 'rgba(0,0,0,.5)');
});

test('fontFamily quotes real families and leaves generics bare', () => {
  assert.equal(serialize({ $type: 'fontFamily', $value: ['Archivo', 'system-ui', 'sans-serif'] }),
    "'Archivo',system-ui,sans-serif");
  assert.equal(serialize({ $type: 'fontFamily', $value: ['Familjen Grotesk', 'system-ui', 'sans-serif'] }),
    "'Familjen Grotesk',system-ui,sans-serif");
  assert.equal(serialize({ $type: 'fontFamily', $value: ['Spline Sans Mono', 'ui-monospace', 'monospace'] }),
    "'Spline Sans Mono',ui-monospace,monospace");
});

test('shadow renders the four dimensions then the color', () => {
  const t = { $type: 'shadow', $value: {
    offsetX: px(0), offsetY: px(12), blur: px(28), spread: px(-12),
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.6 },
  } };
  assert.equal(serialize(t), '0 12px 28px -12px rgba(0,0,0,.6)');
});

test('an unknown type is a hard error, never a silent passthrough', () => {
  assert.throws(() => serialize({ $type: 'gradient', $value: {} }), /unsupported \$type: gradient/);
  assert.throws(() => serialize({ $value: 1 }), /unsupported \$type: undefined/);
});
