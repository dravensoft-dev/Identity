/* chart-internals is the one file in this layer that is pure maths and a colour
 * contract -- no component, no recipe, no Angular runtime. Five chart slices consume
 * it unchanged, so its behaviour is asserted here rather than five times over. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAT_SLOTS, CHART_HEIGHT, PAD, SR_ONLY,
  catColor, toneColor, resolveColors, niceMax, ticks, barPath, arcPath,
  type ArenaChartTone,
} from '../primitives/chart-internals';

// --- niceMax --------------------------------------------------------------

test('niceMax returns 1 for every input that is not a positive number', () => {
  // The guard is `!(max > 0)`, which is what makes NaN fall through it: every
  // comparison against NaN is false, so `NaN > 0` is false and the guard fires.
  for (const bad of [0, -0, -1, -1000, Number.NaN, -Number.INFINITY])
    assert.equal(niceMax(bad), 1, `niceMax(${bad})`);
});

test('niceMax lands on each of the five steps at its own boundary', () => {
  assert.equal(niceMax(1), 1);
  assert.equal(niceMax(2), 2);
  assert.equal(niceMax(2.5), 2.5);
  assert.equal(niceMax(5), 5);
  assert.equal(niceMax(10), 10);
});

test('niceMax steps up the moment a boundary is crossed', () => {
  assert.equal(niceMax(1.01), 2);
  assert.equal(niceMax(2.01), 2.5);
  assert.equal(niceMax(2.51), 5);
  assert.equal(niceMax(5.01), 10);
});

test('niceMax scales the same five steps across powers of ten', () => {
  assert.equal(niceMax(0.4), 0.5);
  assert.equal(niceMax(23), 25);
  assert.equal(niceMax(230), 250);
  assert.equal(niceMax(2300), 2500);
  assert.equal(niceMax(7), 10);
  assert.equal(niceMax(70), 100);
  assert.equal(niceMax(7000), 10000);
});

test('niceMax never returns an axis top below the value it must hold', () => {
  // The property the five callers actually depend on: a bar drawn at `max`
  // must fit under the axis. Asserted across the scale rather than at points.
  for (let v = 0.01; v < 100000; v *= 1.37)
    assert.ok(niceMax(v) >= v, `niceMax(${v}) = ${niceMax(v)} is below ${v}`);
});

// --- ticks ----------------------------------------------------------------

test('ticks spans 0 to max inclusive and yields count + 1 values', () => {
  assert.deepEqual(ticks(100), [0, 25, 50, 75, 100]);
  assert.deepEqual(ticks(10, 2), [0, 5, 10]);
  assert.equal(ticks(7, 7).length, 8);
});

// --- catColor -------------------------------------------------------------

test('catColor reads the ramp token for an in-range slot', () => {
  for (let n = 1; n <= CAT_SLOTS; n++) assert.equal(catColor(n), `var(--color-cat-${n})`);
});

test('catColor NEVER cycles past the ramp -- a 9th series clamps, it does not wrap', () => {
  // "In order, never cycled" is a stated design law: wrapping slot 9 back to 1
  // would silently claim two different series are the same one. Clamping is
  // visibly wrong instead, which is the point.
  for (const over of [CAT_SLOTS + 1, 9, 12, 100, 1e6])
    assert.equal(catColor(over), `var(--color-cat-${CAT_SLOTS})`, `slot ${over}`);
  assert.notEqual(catColor(CAT_SLOTS + 1), catColor(1));
});

test('catColor clamps at the low end, including the falsy slots', () => {
  // `Math.round(slot) || 1` means 0 and NaN both become 1 before the clamp.
  for (const under of [1, 0, -3, Number.NaN]) assert.equal(catColor(under), 'var(--color-cat-1)');
});

test('catColor rounds a fractional slot rather than truncating it', () => {
  assert.equal(catColor(2.4), 'var(--color-cat-2)');
  assert.equal(catColor(2.5), 'var(--color-cat-3)');
  assert.equal(catColor(2.6), 'var(--color-cat-3)');
});

// --- toneColor ------------------------------------------------------------

test('every tone in the union resolves to a token reference', () => {
  const tones: ArenaChartTone[] = ['success', 'warning', 'danger', 'info'];
  for (const tone of tones) assert.match(toneColor(tone), /^var\(--[a-z]+\)$/);
  assert.equal(new Set(tones.map(toneColor)).size, tones.length, 'tones must not share a colour');
});

// --- resolveColors --------------------------------------------------------

/** Runs `body` with `console.warn` captured, restoring it however it exits. */
function captureWarnings(body: () => void): string[] {
  const captured: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => { captured.push(args.map(String).join(' ')); };
  try { body(); } finally { console.warn = original; }
  return captured;
}

test('resolveColors always returns exactly `count` colours', () => {
  for (const count of [0, 1, 3, 25]) {
    assert.equal(resolveColors({ count }).length, count);
    assert.equal(resolveColors({ count, slot: 3 }).length, count);
    assert.equal(resolveColors({ count, slots: [1, 2] }).length, count);
    assert.equal(resolveColors({ count, tone: 'danger' }).length, count);
  }
});

test('with nothing specified every series takes slot 1', () => {
  assert.deepEqual(resolveColors({ count: 3 }), Array(3).fill('var(--color-cat-1)'));
});

test('`slot` paints every series the same identity colour', () => {
  assert.deepEqual(resolveColors({ count: 2, slot: 4 }), ['var(--color-cat-4)', 'var(--color-cat-4)']);
});

test('`slots` maps per index, falling back to the index itself where it runs short', () => {
  // The documented fallback is `slots[i] ?? i + 1` -- a short array does not
  // repeat its last entry, it resumes the natural 1-based ramp order.
  assert.deepEqual(resolveColors({ count: 4, slots: [5, 2] }), [
    'var(--color-cat-5)', 'var(--color-cat-2)', 'var(--color-cat-3)', 'var(--color-cat-4)',
  ]);
});

test('`slots` shorter than `count` still never cycles past the ramp', () => {
  const colours = resolveColors({ count: 12, slots: [] });
  assert.equal(colours[11], `var(--color-cat-${CAT_SLOTS})`);
  assert.equal(new Set(colours).size, CAT_SLOTS, 'the ramp clamps rather than wrapping');
});

test('`tone` paints every series the semantic colour', () => {
  assert.deepEqual(resolveColors({ count: 2, tone: 'warning' }), ['var(--warning)', 'var(--warning)']);
});

test('`tone` wins over `slot` and over `slots`, and passing both warns', () => {
  // The dedupe set behind warnOnce is module-level and therefore shared with
  // every other test in this process, so a fresh module instance is imported
  // below for the warning itself. What is asserted here is the part that holds
  // on every call regardless of order: tone wins.
  const warnings = captureWarnings(() => {
    assert.deepEqual(resolveColors({ count: 1, tone: 'danger', slot: 3 }), ['var(--danger)']);
    assert.deepEqual(resolveColors({ count: 1, tone: 'danger', slots: [3] }), ['var(--danger)']);
  });
  assert.ok(warnings.length <= 1, 'warnOnce must not warn twice for one message');
});

test('the mutually-exclusive warning fires once, and only when both are passed', async () => {
  // A cache-busted import gives a module instance with its own `warned` set, so
  // this proves the warning deterministically instead of depending on being the
  // first test in the process to reach it.
  const fresh = await import('../primitives/chart-internals?warn-once-probe');
  const clean = captureWarnings(() => {
    fresh.resolveColors({ count: 1, tone: 'danger' });
    fresh.resolveColors({ count: 1, slot: 2 });
    fresh.resolveColors({ count: 1 });
  });
  assert.deepEqual(clean, [], 'identity alone and meaning alone are both legal, and silent');

  const warnings = captureWarnings(() => {
    fresh.resolveColors({ count: 1, tone: 'danger', slot: 3 });
    fresh.resolveColors({ count: 1, tone: 'info', slots: [2] });
  });
  assert.equal(warnings.length, 1, 'warned once for the two offending calls');
  assert.match(warnings[0], /^\[arena\] chart:/);
  assert.match(warnings[0], /mutually exclusive/);
});

test('a tone outside the union falls back to slot 1 instead of yielding undefined', () => {
  // React's `toneColor(tone) || catColor(1)` guard, kept. A tone reaches this from a
  // template binding or parsed JSON, so the type alone does not prevent a bad value --
  // and without the guard the array would be full of `undefined`, which paints nothing.
  const rogue = 'critical' as unknown as ArenaChartTone;
  assert.deepEqual(resolveColors({ count: 2, tone: rogue }), ['var(--color-cat-1)', 'var(--color-cat-1)']);
});

test('`slot: 0` is still an identity, not an absent one', () => {
  // `slot !== undefined` is the guard, so a falsy-but-present slot must both
  // trigger the warning path against a tone and clamp to slot 1 on its own.
  assert.deepEqual(resolveColors({ count: 1, slot: 0 }), ['var(--color-cat-1)']);
});

// --- barPath --------------------------------------------------------------

/** Every `Q` control point in a path `d`, as [x, y] pairs. */
function controlPoints(d: string): [number, number][] {
  return [...d.matchAll(/Q(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

test('barPath is square at the baseline and rounded only at the data end', () => {
  const [x, y, w, h, r] = [10, 20, 30, 100, 6];
  const d = barPath(x, y, w, h, r);
  // Both baseline corners are reached by straight commands and are exact.
  assert.ok(d.startsWith(`M${x},${y + h} `), `starts at the baseline: ${d}`);
  assert.ok(d.includes(`L${x + w},${y + h} Z`), `closes along the baseline: ${d}`);
  // Every curve control point sits on the data end, never on the baseline.
  const points = controlPoints(d);
  assert.equal(points.length, 2, 'exactly two rounded corners');
  for (const [, py] of points) assert.equal(py, y, 'a curve control point is on the data end');
});

test('barPath never rounds wider than half the bar or taller than the bar', () => {
  // rr = min(r, w/2, h): an over-large radius would otherwise cross the bar's
  // own midline and invert the top edge.
  assert.equal(barPath(0, 0, 10, 100, 999), barPath(0, 0, 10, 100, 5), 'clamped to w / 2');
  assert.equal(barPath(0, 0, 100, 3, 999), barPath(0, 0, 100, 3, 3), 'clamped to h');
});

test('barPath with no radius is a plain rectangle path', () => {
  const [x, y, w, h] = [0, 0, 10, 40];
  const d = barPath(x, y, w, h, -5);
  // A negative radius clamps to 0, so every curve's control point sits on
  // its corner (as always) AND its endpoint collapses onto that same
  // corner -- the "curve" is really a straight pass through it.
  const points = controlPoints(d);
  assert.equal(points.length, 2, 'exactly two corners');
  const corners = [[x, y], [x + w, y]];
  points.forEach(([px, py], i) => {
    assert.deepEqual([px, py], corners[i], `control point sits on the corner: ${d}`);
    assert.ok(d.includes(`${px},${py} ${px},${py}`), `endpoint collapses onto the same corner: ${d}`);
  });
  assert.ok(d.startsWith(`M${x},${y + h} `));
});

// --- arcPath --------------------------------------------------------------

/** How many subpaths (`M` commands) a path `d` is made of. */
function subpathCount(d: string): number {
  return (d.match(/M/g) ?? []).length;
}

test('arcPath draws an ordinary segment as a single subpath', () => {
  const d = arcPath(50, 50, 40, 20, 0, Math.PI / 2);
  assert.equal(subpathCount(d), 1);
});

test('arcPath splits a full circle into two arcs rather than a degenerate one', () => {
  // A single 360-degree arc starts and ends on the same point, which SVG
  // collapses to nothing -- a 100% doughnut would render empty.
  const full = arcPath(50, 50, 40, 20, 0, Math.PI * 2);
  assert.equal(subpathCount(full), 2, 'two halves, not one degenerate arc');
  const [first, second] = full.split(' M').map((s, i) => (i === 0 ? s : `M${s}`));
  // The halves meet: the first ends where the second begins (the 180-degree point).
  assert.equal(first.match(/^M(-?[\d.]+),(-?[\d.]+)/)?.[0], 'M90,50');
  assert.ok(second.startsWith('M10,50'), `the second half starts opposite: ${second}`);
});

test('arcPath treats a sweep beyond a full turn as a full circle too', () => {
  assert.equal(subpathCount(arcPath(50, 50, 40, 20, 0, Math.PI * 2 + 0.5)), 2);
});

test('arcPath sets the large-arc flag only past a half turn', () => {
  const small = arcPath(50, 50, 40, 20, 0, Math.PI / 2);
  const large = arcPath(50, 50, 40, 20, 0, Math.PI * 1.5);
  assert.match(small, /A40,40 0 0 1 /);
  assert.match(large, /A40,40 0 1 1 /);
});

test('arcPath sweeps the outer edge forward and the inner edge back', () => {
  // The two sweep flags differ (1 then 0) -- that is what closes the segment
  // into a ring rather than crossing it over itself.
  const d = arcPath(50, 50, 40, 20, 0, Math.PI / 2);
  assert.match(d, /A40,40 0 0 1 .* A20,20 0 0 0 .*Z$/);
});

test('arcPath places its corners on the two radii at the two angles', () => {
  const d = arcPath(0, 0, 10, 5, 0, Math.PI / 2);
  // 0 radians is 3 o'clock, so the outer start is (10, 0) and the inner end is (5, 0).
  assert.ok(d.startsWith('M10,0 '), d);
  assert.ok(d.endsWith('5,0 Z'), d);
});

// --- The shared constants -------------------------------------------------

test('the layout constants carry the values the chart family shares', () => {
  assert.equal(CAT_SLOTS, 8);
  assert.equal(CHART_HEIGHT, 280);
  assert.deepEqual({ ...PAD }, { t: 8, r: 8, b: 28, l: 44 });
});

test('SR_ONLY hides the element without removing it from the accessibility tree', () => {
  // The table it styles is the chart's text alternative, so it must stay
  // rendered and stay measurable -- clipped, not `display:none`.
  assert.equal(SR_ONLY.position, 'absolute');
  assert.equal(SR_ONLY.clip, 'rect(0 0 0 0)');
  assert.equal(SR_ONLY.overflow, 'hidden');
  assert.ok(!('display' in SR_ONLY), 'display:none would drop it from the accessibility tree');
});

test('every SR_ONLY value carries its unit, because Angular appends none', () => {
  // React's counterpart uses bare numbers (`width: 1`), which React's DOM layer
  // turns into `1px`. Angular's style binding does not: a unitless length is
  // invalid CSS and is dropped, so the port must spell the units out.
  for (const [key, value] of Object.entries(SR_ONLY)) {
    assert.equal(typeof value, 'string', `${key} must be a string`);
    // Zero is the one length CSS accepts without a unit, and the idiom uses it twice.
    if (/^-?\d/.test(value)) assert.match(value, /^(0|-?\d+px)$/, `${key} must carry a unit or be 0`);
  }
});

test('SR_ONLY cancels its own footprint so the hidden table shifts no sibling', () => {
  assert.equal(SR_ONLY.margin, `-${SR_ONLY.width}`);
  assert.equal(SR_ONLY.width, SR_ONLY.height);
});
