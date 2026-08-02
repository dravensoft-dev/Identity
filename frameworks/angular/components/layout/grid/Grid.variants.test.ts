import test from 'node:test';
import assert from 'node:assert/strict';
import { gridStyles } from './Grid.variants';

const GAPS = ['none', 'sm', 'md', 'lg'] as const;

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default gap is md, matching the component\'s own default input', () => {
  assert.equal(gridStyles().root(), gridStyles({ gap: 'md' }).root());
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  for (const gap of GAPS) {
    assert.ok(tokens(gridStyles({ gap }).root()).includes('grid'), `${gap} lost its display utility`);
  }
});

test('every step is a distinct gap utility, so four named steps are four visible ones', () => {
  const seen = GAPS.map((gap) => tokens(gridStyles({ gap }).root()).find((cls) => cls.startsWith('gap-')));
  assert.ok(seen.every(Boolean), `a step carries no gap utility: ${seen.join(', ')}`);
  assert.equal(new Set(seen).size, GAPS.length, `two steps resolve to the same gap: ${seen.join(', ')}`);
});

test('none really is none, and the steps grow in the order they are named', () => {
  const step = (gap: typeof GAPS[number]) => {
    const cls = tokens(gridStyles({ gap }).root()).find((c) => c.startsWith('gap-'))!;
    return Number(cls.slice('gap-'.length));
  };
  assert.equal(step('none'), 0, 'the none step must be the zero of the scale');
  assert.ok(step('sm') < step('md') && step('md') < step('lg'),
    'the named steps must grow: a set that reads small to large and does not is worse than no set');
});

test('the gap is the only thing the recipe decides -- the track list is the component\'s', () => {
  for (const gap of GAPS) {
    const root = tokens(gridStyles({ gap }).root());
    assert.ok(!root.some((cls) => cls.startsWith('grid-cols-')),
      `${gap}: a fixed column count is exactly the breakpoint this component exists to avoid`);
  }
});
