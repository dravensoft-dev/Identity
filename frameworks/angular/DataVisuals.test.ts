import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA_CAT_SLOTS, ARENA_CHART_HEIGHT, ARENA_PAD, ARENA_SR_ONLY,
  arenaCatColor, arenaCatSlotFor, arenaCatSurface, arenaAreaFill, arenaToneColor, arenaResolveColors, arenaNiceMax, arenaTicks,
  arenaBarPath, arenaArcPath,
} from './DataVisuals';
import type { ArenaSeriesTone, ArenaTone } from './Api.generated';
import { forgetArenaWarnings } from './WarnOnce';

test('arenaNiceMax returns 1 for every input that is not a positive number', () => {

  for (const bad of [0, -0, -1, -1000, Number.NaN, -Infinity])
    assert.equal(arenaNiceMax(bad), 1, `arenaNiceMax(${bad})`);
});

test('arenaNiceMax lands on each of the five steps at its own boundary', () => {
  assert.equal(arenaNiceMax(1), 1);
  assert.equal(arenaNiceMax(2), 2);
  assert.equal(arenaNiceMax(2.5), 2.5);
  assert.equal(arenaNiceMax(5), 5);
  assert.equal(arenaNiceMax(10), 10);
});

test('arenaNiceMax steps up the moment a boundary is crossed', () => {
  assert.equal(arenaNiceMax(1.01), 2);
  assert.equal(arenaNiceMax(2.01), 2.5);
  assert.equal(arenaNiceMax(2.51), 5);
  assert.equal(arenaNiceMax(5.01), 10);
});

test('arenaNiceMax scales the same five steps across powers of ten', () => {
  assert.equal(arenaNiceMax(0.4), 0.5);
  assert.equal(arenaNiceMax(23), 25);
  assert.equal(arenaNiceMax(230), 250);
  assert.equal(arenaNiceMax(2300), 2500);
  assert.equal(arenaNiceMax(7), 10);
  assert.equal(arenaNiceMax(70), 100);
  assert.equal(arenaNiceMax(7000), 10000);
});

test('arenaNiceMax never returns an axis top below the value it must hold', () => {

  for (let v = 0.01; v < 100000; v *= 1.37)
    assert.ok(arenaNiceMax(v) >= v, `arenaNiceMax(${v}) = ${arenaNiceMax(v)} is below ${v}`);
});

test('arenaTicks spans 0 to max inclusive and yields count + 1 values', () => {
  assert.deepEqual(arenaTicks(100), [0, 25, 50, 75, 100]);
  assert.deepEqual(arenaTicks(10, 2), [0, 5, 10]);
  assert.equal(arenaTicks(7, 7).length, 8);
});

test('arenaCatColor reads the ramp token for an in-range slot', () => {
  for (let n = 1; n <= ARENA_CAT_SLOTS; n++) assert.equal(arenaCatColor(n), `var(--color-cat-${n})`);
});

test('arenaCatColor NEVER cycles past the ramp -- a 9th series clamps, it does not wrap', () => {

  for (const over of [ARENA_CAT_SLOTS + 1, 9, 12, 100, 1e6])
    assert.equal(arenaCatColor(over), `var(--color-cat-${ARENA_CAT_SLOTS})`, `slot ${over}`);
  assert.notEqual(arenaCatColor(ARENA_CAT_SLOTS + 1), arenaCatColor(1));
});

test('arenaCatColor clamps at the low end, including the falsy slots', () => {

  for (const under of [1, 0, -3, Number.NaN]) assert.equal(arenaCatColor(under), 'var(--color-cat-1)');
});

test('arenaCatColor rounds a fractional slot rather than truncating it', () => {
  assert.equal(arenaCatColor(2.4), 'var(--color-cat-2)');
  assert.equal(arenaCatColor(2.5), 'var(--color-cat-3)');
  assert.equal(arenaCatColor(2.6), 'var(--color-cat-3)');
});

test('every tone in the union resolves to a token reference', () => {
  const tones: ArenaTone[] = ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'];
  for (const tone of tones) assert.match(arenaToneColor(tone), /^var\(--[a-z-]+\)$/);
  assert.equal(new Set(tones.map(arenaToneColor)).size, tones.length, 'tones must not share a colour');
});

test('every ArenaSeriesTone is an ArenaTone, so a chart keeps reaching the same colour it always did', () => {
  const series: ArenaSeriesTone[] = ['success', 'warning', 'danger', 'info'];
  for (const tone of series) assert.equal(arenaToneColor(tone), arenaToneColor(tone as ArenaTone));
});

test('arenaCatSlotFor lands inside the ramp for every key, including an empty one', () => {
  for (const key of ['', 'a', 'arena', 'SKU-1042', 'ñ', '日本', 'x'.repeat(500)]) {
    const slot = arenaCatSlotFor(key);
    assert.ok(Number.isInteger(slot) && slot >= 1 && slot <= ARENA_CAT_SLOTS, `arenaCatSlotFor(${key}) = ${slot}`);
  }
});

test('arenaCatSlotFor gives the same key the same slot every time', () => {
  assert.equal(arenaCatSlotFor('SKU-1042'), arenaCatSlotFor('SKU-1042'));
});

test('arenaCatSlotFor spreads over the ramp by these pinned vectors', () => {

  assert.deepEqual(
    ['a', 'arena', 'SKU-1042', 'SKU-1043', 'cliente-7'].map(arenaCatSlotFor),
    [2, 8, 6, 7, 5],
    'the numbers are pinned rather than derived because the point of the function is that one key '
    + 'always draws the same colour: a ninth slot in the --color-cat-* ramp moves every one of them, '
    + 'and re-deriving them here would assert nothing at all',
  );
});

test('arenaCatSurface tints from the slot colour, and the edge is the stronger of the two', () => {
  const surface = arenaCatSurface(3);
  assert.match(surface.fill, /^color-mix\(in oklab, var\(--color-cat-3\) 12%, var\(--color-base-100\)\)$/);
  assert.match(surface.border, /^color-mix\(in oklab, var\(--color-cat-3\) 26%, transparent\)$/);
});

test('arenaAreaFill is the tint ArenaLineChart draws under its series', () => {
  assert.equal(arenaAreaFill('var(--success)'), 'color-mix(in oklab, var(--success) 18%, transparent)');
});

function captureWarnings(body: () => void): string[] {
  const captured: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => { captured.push(args.map(String).join(' ')); };
  try { body(); } finally { console.warn = original; }
  return captured;
}

test('arenaResolveColors always returns exactly `count` colours', () => {
  for (const count of [0, 1, 3, 25]) {
    assert.equal(arenaResolveColors({ count }).length, count);
    assert.equal(arenaResolveColors({ count, slot: 3 }).length, count);
    assert.equal(arenaResolveColors({ count, slots: [1, 2] }).length, count);
    assert.equal(arenaResolveColors({ count, tone: 'danger' }).length, count);
  }
});

test('with nothing specified every series takes slot 1', () => {
  assert.deepEqual(arenaResolveColors({ count: 3 }), Array(3).fill('var(--color-cat-1)'));
});

test('`slot` paints every series the same identity colour', () => {
  assert.deepEqual(arenaResolveColors({ count: 2, slot: 4 }), ['var(--color-cat-4)', 'var(--color-cat-4)']);
});

test('`slots` maps per index, falling back to the index itself where it runs short', () => {

  assert.deepEqual(arenaResolveColors({ count: 4, slots: [5, 2] }), [
    'var(--color-cat-5)', 'var(--color-cat-2)', 'var(--color-cat-3)', 'var(--color-cat-4)',
  ]);
});

test('`slots` shorter than `count` still never cycles past the ramp', () => {
  const colours = arenaResolveColors({ count: 12, slots: [] });
  assert.equal(colours[11], `var(--color-cat-${ARENA_CAT_SLOTS})`);
  assert.equal(new Set(colours).size, ARENA_CAT_SLOTS, 'the ramp clamps rather than wrapping');
});

test('`tone` paints every series the semantic colour', () => {
  assert.deepEqual(arenaResolveColors({ count: 2, tone: 'warning' }), ['var(--warning)', 'var(--warning)']);
});

test('`tone` wins over `slot` and over `slots`, and passing both warns', () => {
  forgetArenaWarnings();
  const warnings = captureWarnings(() => {
    assert.deepEqual(arenaResolveColors({ count: 1, tone: 'danger', slot: 3 }), ['var(--danger)']);
    assert.deepEqual(arenaResolveColors({ count: 1, tone: 'danger', slots: [3] }), ['var(--danger)']);
  });
  assert.ok(warnings.length <= 1, 'arenaWarnOnce must not warn twice for one message');
});

test('the mutually-exclusive warning fires once, and only when both are passed', () => {
  forgetArenaWarnings();
  const clean = captureWarnings(() => {
    arenaResolveColors({ count: 1, tone: 'danger' });
    arenaResolveColors({ count: 1, slot: 2 });
    arenaResolveColors({ count: 1 });
  });
  assert.deepEqual(clean, [], 'identity alone and meaning alone are both legal, and silent');

  const warnings = captureWarnings(() => {
    arenaResolveColors({ count: 1, tone: 'danger', slot: 3 });
    arenaResolveColors({ count: 1, tone: 'info', slots: [2] });
  });
  assert.equal(warnings.length, 1, 'warned once for the two offending calls');
  assert.match(warnings[0], /^\[arena\] chart:/);
  assert.match(warnings[0], /mutually exclusive/);
  forgetArenaWarnings();
});

test('a tone outside the union falls back to slot 1 instead of yielding undefined', () => {

  const rogue = 'critical' as unknown as ArenaSeriesTone;
  assert.deepEqual(arenaResolveColors({ count: 2, tone: rogue }), ['var(--color-cat-1)', 'var(--color-cat-1)']);
});

test('`slot: 0` is still an identity, not an absent one', () => {

  assert.deepEqual(arenaResolveColors({ count: 1, slot: 0 }), ['var(--color-cat-1)']);
});

function controlPoints(d: string): [number, number][] {
  return [...d.matchAll(/Q(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

test('arenaBarPath is square at the baseline and rounded only at the data end', () => {
  const [x, y, w, h, r] = [10, 20, 30, 100, 6];
  const d = arenaBarPath(x, y, w, h, r);

  assert.ok(d.startsWith(`M${x},${y + h} `), `starts at the baseline: ${d}`);
  assert.ok(d.includes(`L${x + w},${y + h} Z`), `closes along the baseline: ${d}`);

  const points = controlPoints(d);
  assert.equal(points.length, 2, 'exactly two rounded corners');
  for (const [, py] of points) assert.equal(py, y, 'a curve control point is on the data end');
});

test('arenaBarPath never rounds wider than half the bar or taller than the bar', () => {

  assert.equal(arenaBarPath(0, 0, 10, 100, 999), arenaBarPath(0, 0, 10, 100, 5), 'clamped to w / 2');
  assert.equal(arenaBarPath(0, 0, 100, 3, 999), arenaBarPath(0, 0, 100, 3, 3), 'clamped to h');
});

test('arenaBarPath with no radius is a plain rectangle path', () => {
  const [x, y, w, h] = [0, 0, 10, 40];
  const d = arenaBarPath(x, y, w, h, -5);

  const points = controlPoints(d);
  assert.equal(points.length, 2, 'exactly two corners');
  const corners = [[x, y], [x + w, y]];
  points.forEach(([px, py], i) => {
    assert.deepEqual([px, py], corners[i], `control point sits on the corner: ${d}`);
    assert.ok(d.includes(`${px},${py} ${px},${py}`), `endpoint collapses onto the same corner: ${d}`);
  });
  assert.ok(d.startsWith(`M${x},${y + h} `));
});

function subpathCount(d: string): number {
  return (d.match(/M/g) ?? []).length;
}

test('arenaArcPath draws an ordinary segment as a single subpath', () => {
  const d = arenaArcPath(50, 50, 40, 20, 0, Math.PI / 2);
  assert.equal(subpathCount(d), 1);
});

test('arenaArcPath splits a full circle into two arcs rather than a degenerate one', () => {

  const full = arenaArcPath(50, 50, 40, 20, 0, Math.PI * 2);
  assert.equal(subpathCount(full), 2, 'two halves, not one degenerate arc');
  const [first, second] = full.split(' M').map((s, i) => (i === 0 ? s : `M${s}`));

  assert.equal(first.match(/^M(-?[\d.]+),(-?[\d.]+)/)?.[0], 'M90,50');
  assert.ok(second.startsWith('M10,50'), `the second half starts opposite: ${second}`);
});

test('arenaArcPath treats a sweep beyond a full turn as a full circle too', () => {
  assert.equal(subpathCount(arenaArcPath(50, 50, 40, 20, 0, Math.PI * 2 + 0.5)), 2);
});

test('arenaArcPath sets the large-arc flag only past a half turn', () => {
  const small = arenaArcPath(50, 50, 40, 20, 0, Math.PI / 2);
  const large = arenaArcPath(50, 50, 40, 20, 0, Math.PI * 1.5);
  assert.match(small, /A40,40 0 0 1 /);
  assert.match(large, /A40,40 0 1 1 /);
});

test('arenaArcPath sweeps the outer edge forward and the inner edge back', () => {

  const d = arenaArcPath(50, 50, 40, 20, 0, Math.PI / 2);
  assert.match(d, /A40,40 0 0 1 .* A20,20 0 0 0 .*Z$/);
});

test('arenaArcPath places its corners on the two radii at the two angles', () => {
  const d = arenaArcPath(0, 0, 10, 5, 0, Math.PI / 2);

  assert.ok(d.startsWith('M10,0 '), d);
  assert.ok(d.endsWith('5,0 Z'), d);
});

test('the layout constants carry the values the chart family shares', () => {
  assert.equal(ARENA_CAT_SLOTS, 8);
  assert.equal(ARENA_CHART_HEIGHT, 280);
  assert.deepEqual({ ...ARENA_PAD }, { t: 8, r: 8, b: 28, l: 44 });
});

test('ARENA_SR_ONLY hides the element without removing it from the accessibility tree', () => {

  assert.equal(ARENA_SR_ONLY.position, 'absolute');
  assert.equal(ARENA_SR_ONLY.clip, 'rect(0 0 0 0)');
  assert.equal(ARENA_SR_ONLY.overflow, 'hidden');
  assert.ok(!('display' in ARENA_SR_ONLY), 'display:none would drop it from the accessibility tree');
});

test('every ARENA_SR_ONLY value carries its unit, because Angular appends none', () => {

  for (const [key, value] of Object.entries(ARENA_SR_ONLY)) {
    assert.equal(typeof value, 'string', `${key} must be a string`);

    if (/^-?\d/.test(value)) assert.match(value, /^(0|-?\d+px)$/, `${key} must carry a unit or be 0`);
  }
});

test('ARENA_SR_ONLY cancels its own footprint so the hidden table shifts no sibling', () => {
  assert.equal(ARENA_SR_ONLY.margin, `-${ARENA_SR_ONLY.width}`);
  assert.equal(ARENA_SR_ONLY.width, ARENA_SR_ONLY.height);
});
