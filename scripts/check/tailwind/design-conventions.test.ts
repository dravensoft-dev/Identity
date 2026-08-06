/* Danger is outline: the error token is ink, a border and a tint, never a full-strength
 * background. The one filled danger surface in the system is the final irreversible
 * confirmation inside ArenaConfirmDialog, and it says so by reaching for a token of its own,
 * --error-fill, rather than for --error at full strength. Both halves used to be asserted per
 * component against a resolved class string, which stopped being possible once a component
 * renders its own class names. Asserting them once over the authored manifests is what
 * survived, and the second half was never asserted anywhere at all. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { layerManifests } from '../../lib/tailwind/tailwind-compile.ts';

const manifests = layerManifests();

function everyClassString(manifest) {
  const out: { where: string; classes: string[] }[] = [];
  const eat = (value, where) => {
    if (typeof value === 'string') out.push({ where, classes: value.split(/\s+/).filter(Boolean) });
    else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) eat(child, `${where}.${key}`);
  };
  eat(manifest.slots, `${manifest.component}.slots`);
  eat(manifest.variants, `${manifest.component}.variants`);
  eat((manifest.compoundVariants ?? []).map((c) => c.class), `${manifest.component}.compoundVariants`);
  return out;
}

test('every manifest is read, or these conventions are asserted over nothing', () => {
  assert.ok(manifests.size > 0);
});

const STATUS_RAMP = new Map([
  ['ArenaAvatar', 'the busy presence dot, which is a status colour beside bg-success and bg-warning on the '
    + 'same four-value ramp rather than a danger affordance; the convention governs what a user can act on'],
]);

const fillsAtFullStrength = (manifest) => everyClassString(manifest)
  .flatMap(({ where, classes }) => classes.filter((cls: string) => /^bg-(error|danger)$/.test(cls)).map((cls: string) => `${where}: ${cls}`));

test('danger is outline: no manifest paints a full-strength error background', () => {
  const offenders = [...manifests.values()]
    .filter((manifest) => !STATUS_RAMP.has(manifest.component))
    .flatMap(fillsAtFullStrength);
  assert.deepEqual(offenders, [], offenders.join('\n'));
});

test('the one filled danger surface reaches for --error-fill, and it is the only one that does', () => {
  const filled = [...manifests.values()]
    .filter((manifest) => everyClassString(manifest).some(({ classes }) => classes.some((c) => /error-fill/.test(c))))
    .map((manifest) => manifest.component);
  assert.deepEqual(filled, ['ArenaConfirmDialog'],
    'the final irreversible confirmation is the one filled danger surface in the system');
});

test('every status-ramp exemption is still needed, so a stale one fails rather than lingering', () => {
  const byName = new Map([...manifests.values()].map((m) => [m.component, m]));
  for (const [component, reason] of STATUS_RAMP) {
    const manifest = byName.get(component);
    assert.ok(manifest, `STATUS_RAMP names ${component}, which is no manifest`);
    assert.ok(reason && reason.length > 10, `${component} has no usable reason`);
    assert.ok(fillsAtFullStrength(manifest).length > 0,
      `STATUS_RAMP excuses ${component}, which no longer paints one; drop the entry`);
  }
});

test('no manifest introduces a raw hex, because a colour is a token or it is not Arena', () => {
  const offenders = [];
  for (const manifest of manifests.values()) {
    for (const { where, classes } of everyClassString(manifest)) {
      for (const cls of classes) {
        if (/#[0-9a-fA-F]{3,8}\b/.test(cls)) offenders.push(`${where}: ${cls}`);
      }
    }
  }
  assert.deepEqual(offenders, [], offenders.join('\n'));
});

test('no manifest draws a gradient, the sole exception being ArenaSkeleton\'s neutral shimmer', () => {
  const offenders = [];
  for (const manifest of manifests.values()) {
    for (const { where, classes } of everyClassString(manifest)) {
      for (const cls of classes) {
        if (/gradient/.test(cls)) offenders.push(`${where}: ${cls}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `${offenders.join('\n')}\n(ArenaSkeleton's shimmer is an @utility in Animations.css, not a manifest class)`);
});
