import test from 'node:test';
import assert from 'node:assert/strict';
import { scanValue, scanText } from './check-dimension-literals.mjs';

test('a bare number is a violation for a dimension-valued property', () => {
  assert.ok(scanValue('fontSize', '13'));
  assert.ok(scanValue('zIndex', '1000'));
  assert.ok(scanValue('fontWeight', '700'));
  assert.ok(scanValue('lineHeight', '1.55'));
});

test('a raw px length is a violation wherever it appears in the value', () => {
  assert.ok(scanValue('padding', "'0 18px'"));
  assert.ok(scanValue('border', "'1px solid var(--color-base-300)'"));
  assert.ok(scanValue('width', "'14px'"));
});

test('a raw em is a violation for letterSpacing, because em is where tracking is expressed', () => {
  assert.ok(scanValue('letterSpacing', "'.1em'"));
  assert.ok(scanValue('letterSpacing', "'-.02em'"));
  assert.ok(scanValue('letterSpacing', "'0.22em'"));
});

test('a var() into a token is legal', () => {
  assert.equal(scanValue('letterSpacing', "'var(--ls-label)'"), null);
  assert.equal(scanValue('fontSize', 'var(--dz-text)'), null);
  assert.equal(scanValue('padding', "'var(--dz-row-py) var(--dz-row-px)'"), null);
});

test('a calc() over tokens is legal, and its multipliers are not literals', () => {
  assert.equal(scanValue('width', "'calc(var(--sp-1) * 3.5)'"), null);
  assert.equal(scanValue('gap', "'calc(var(--sp-1) * 2.5)'"), null);
});

test('zero is legal, with or without quotes', () => {
  assert.equal(scanValue('padding', '0'), null);
  assert.equal(scanValue('margin', "'0'"), null);
});

test('a non-dimension unit the layer legitimately uses is legal', () => {
  assert.equal(scanValue('borderRadius', "'50%'"), null);
  assert.equal(scanValue('width', "'100%'"), null);
  assert.equal(scanValue('minWidth', "'0ch'"), null);
});

test('lineHeight 1 is a violation, because it is a role and not a number', () => {
  assert.ok(scanValue('lineHeight', '1'));
});

test('scanText finds the property and the raw value together', () => {
  const found = scanText("const s = { fontSize: 13, padding: '0 18px', color: 'var(--mute)' };");
  assert.deepEqual(found.map((f) => f.prop), ['fontSize', 'padding']);
});

test('a property Arena does not govern is ignored', () => {
  assert.deepEqual(scanText("{ flexGrow: 1, opacity: 0.6, zoom: 2 }"), []);
});

test('a percent in unquoted CSS text is captured whole, not truncated to a bare number', () => {
  assert.deepEqual(scanText('left:-40%'), []);
  assert.deepEqual(scanText('width:40%'), []);
});

test('regression: ProgressBar.jsx keyframe text no longer reads as three violations', () => {
  // The exact shape of ProgressBar.jsx's injected <style> textContent: CSS
  // text inside a JS string, not an object literal. `left` and `width` are
  // governed properties, but -40%/100%/40% are legal free-unit percentages,
  // not bare numbers -- the DECL bareword class truncating `%` used to lose
  // the unit and misread each one as a violation.
  const keyframes =
    '@keyframes arena-prog{0%{left:-40%}100%{left:100%}}' +
    '.arena-prog-ind::after{content:"";position:absolute;top:0;bottom:0;width:40%;border-radius:inherit;background:currentColor;animation:arena-prog 1.15s var(--ease-in-out) infinite}' +
    '@media (prefers-reduced-motion:reduce){.arena-prog-ind::after{animation-duration:2.4s}}';
  assert.deepEqual(scanText(keyframes), []);
});
