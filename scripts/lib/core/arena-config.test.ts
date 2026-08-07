/* The example config a consumer copies has to be a config that builds. Angular inlines every
 * external stylesheet during a production build, so a font URL Google answers with 400 is not a
 * missing face: it is the consumer's build failing, with Arena named in the error. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arenaConfig, fontEntries, fontWeights, googleFontsUrl, GOOGLE_FONTS } from './arena-config.ts';
import { repoRoot } from '../arena/repo-root.ts';

test('a family is asked for the weights Arena declares, one by one', () => {
  assert.equal(
    googleFontsUrl('Familjen Grotesk', [400, 700]),
    `${GOOGLE_FONTS}?family=Familjen+Grotesk:wght@400;700&display=swap`,
  );
});

test('the weight query is a list and never a range, because a range outside a family\'s axis is a 400', () => {
  const weights = fontWeights(repoRoot);
  assert.ok(weights.length > 1, 'typography.json declares one weight or none, so the query proves nothing');

  for (const { src } of Object.values(fontEntries(repoRoot)) as { family: string; src: string }[]) {
    assert.doesNotMatch(src, /wght@\d+\.\.\d+/,
      `${src} spells the weights as a range. Google serves a range only when it lies inside the `
      + "family's own wght axis and answers 400 otherwise, while a list is clamped to the nearest "
      + 'weight the family has, so it holds for every family Arena declares.');
    assert.ok(src.includes(`wght@${weights.join(';')}`), `${src} does not carry the declared weights`);
  }
});

test('every font the example config names is asked for over the same Google endpoint', () => {
  const { fonts } = arenaConfig(repoRoot);
  const roles = Object.keys(fonts);
  assert.ok(roles.length > 0, 'the example config names no font at all');

  for (const role of roles) {
    assert.ok(fonts[role]?.family, `fonts.${role} has no family`);
    assert.ok(fonts[role]?.src.startsWith(`${GOOGLE_FONTS}?family=`), `fonts.${role}.src is not a Google Fonts URL`);
    assert.ok(fonts[role]?.src.includes(fonts[role]?.family.replace(/ /g, '+')),
      `fonts.${role}.src asks for a different family than fonts.${role}.family names`);
  }
});
