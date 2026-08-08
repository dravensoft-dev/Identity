import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePercent, structureOf, REMOVED, PALETTE, COLORS } from './check-text-contrast.ts';

const structure = structureOf([
  ':root, .arena-light {',
  '  --text-strong: var(--color-base-content);',
  '  --text-body: color-mix(in oklab, var(--color-base-content) 82%, transparent);',
  '  --text-muted: var(--mute);',
  '  --mute: color-mix(in oklab, var(--color-base-content) 61%, transparent);',
  '  --loop-a: var(--loop-b);',
  '  --loop-b: var(--loop-a);',
  '  --painted: #ff0000;',
  '}',
].join('\n'));

test('a level that is base-content itself is the whole of it', () => {
  assert.equal(resolvePercent(structure, 'text-strong'), 100);
});

test('a level mixed with transparent resolves to the percentage it keeps', () => {
  assert.equal(resolvePercent(structure, 'text-body'), 82);
});

test('an alias resolves to what it points at, however many hops away that is', () => {
  assert.equal(resolvePercent(structure, 'text-muted'), 61,
    'colors.css names a level twice on purpose, so following one hop is not enough');
});

test('a level nothing declares is absent rather than zero', () => {
  assert.equal(resolvePercent(structure, 'text-nothing'), null,
    'zero would read as a fully transparent level and clear no gate by measuring nothing');
});

test('an alias cycle is named, never followed until the stack ends', () => {
  assert.throws(() => resolvePercent(structure, 'loop-a'), /--loop-a is a circular reference/);
});

test('a level that is a colour rather than a derivation of base-content is refused', () => {
  assert.throws(() => resolvePercent(structure, 'painted'),
    /--painted resolves to "#ff0000", which is neither base-content, a color-mix of it, nor a var\(\) alias/,
    'the gate measures levels derived from one content colour, so a pinned hex is outside what it '
    + 'can compose and is reported instead of silently skipped');
});

test('a retired token carries the token that replaces it, so the failure is actionable', () => {
  assert.ok(REMOVED.length > 0, 'an empty list holds nothing and would pass over any reappearance');
  for (const { token, use } of REMOVED) {
    assert.ok(token && use, `${token} is retired with no replacement named`);
    assert.equal(REMOVED.filter((r) => r.token === token).length, 1, `${token} is listed twice`);
  }
});

test('the two sheets are named once each, and they are not the same sheet', () => {
  assert.match(PALETTE, /^contracts\/design-generated\//);
  assert.match(COLORS, /^contracts\/design\//);
  assert.notEqual(PALETTE, COLORS,
    'the skin values are generated and the derivations are hand-written, and the gate needs both');
});
