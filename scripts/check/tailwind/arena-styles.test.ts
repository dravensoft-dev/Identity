/* What composing a component's own class names guarantees, for every manifest at once. These
 * were forty-two per-component suites while a recipe resolved a Tailwind class string, because
 * each component's string was its own. A class name is derived, so the guarantees are now the
 * same for all of them and belong to the composer rather than to any one component. What is
 * NOT here is what each manifest MEANS: which tone paints which token, which size is which
 * height. That is a claim per component, it is in `manifest-claims.test.ts`, and it is
 * resolved through the recipe so it says the same thing it said before. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaStyles } from '../../../frameworks/tailwind/ArenaStyles.ts';
import { layerManifests } from '../../lib/tailwind/tailwind-compile.ts';
import { classesManifest, slotClass, variantClass } from '../../lib/tailwind/component-css.ts';

const manifests = [...layerManifests().values()];
const named = new Map(manifests.map((m) => [m.component, classesManifest(m)]));

test('every manifest is composed, or these guarantees are asserted over nothing', () => {
  assert.ok(manifests.length > 0);
  assert.equal(named.size, manifests.length);
});

test('every slot answers with its own base class, so no slot renders unstyled', () => {
  for (const manifest of manifests) {
    const styles = arenaStyles(named.get(manifest.component))();
    for (const slot of Object.keys(manifest.slots)) {
      assert.equal(typeof styles[slot](), 'string');
      assert.ok(styles[slot]().split(/\s+/).includes(slotClass(manifest.component, slot)),
        `${manifest.component}.${slot} resolved to "${styles[slot]()}" without its own base class`);
    }
  }
});

test('no argument resolves to exactly the declared defaults, so a default cannot drift from itself', () => {
  for (const manifest of manifests) {
    const styles = arenaStyles(named.get(manifest.component));
    const explicit = styles({ ...manifest.defaultVariants });
    const implicit = styles({});
    for (const slot of Object.keys(manifest.slots)) {
      assert.equal(implicit[slot](), explicit[slot](),
        `${manifest.component}.${slot}: the default selection and the explicit one disagree`);
    }
  }
});

test('a variant reaches exactly the slots its manifest gives it, and no others', () => {
  for (const manifest of manifests) {
    const styles = arenaStyles(named.get(manifest.component));
    for (const [group, values] of Object.entries(manifest.variants ?? {})) {
      for (const [value, slots] of Object.entries(values)) {
        const chosen = { ...manifest.defaultVariants, [group]: value };
        const resolved = styles(chosen);
        for (const slot of Object.keys(manifest.slots)) {
          const expected = variantClass(manifest.component, slot, group, value);
          const touched = resolved[slot]().split(/\s+/).includes(expected);
          const declared = Boolean(String(slots?.[slot] ?? '').trim());
          assert.equal(touched, declared,
            `${manifest.component}: ${group}=${value} ${touched ? 'reaches' : 'misses'} .${slot}, `
            + `and the manifest says it ${declared ? 'should' : 'should not'}`);
        }
      }
    }
  }
});

test('two variant values that declare different classes resolve differently, so neither collapses onto the other', () => {
  for (const manifest of manifests) {
    const styles = arenaStyles(named.get(manifest.component));
    for (const [group, values] of Object.entries(manifest.variants ?? {})) {
      const seen = new Map();
      for (const [value, slots] of Object.entries(values)) {
        if (!Object.values(slots ?? {}).some((c) => String(c).trim())) continue;
        const key = Object.keys(manifest.slots).map((slot) => styles({ [group]: value })[slot]()).join('|');
        assert.ok(!seen.has(key),
          `${manifest.component}: ${group}=${value} and ${group}=${seen.get(key)} resolve identically`);
        seen.set(key, value);
      }
    }
  }
});

test('a value no manifest declares is refused by name rather than drawing nothing', () => {
  for (const manifest of manifests) {
    const groups = Object.keys(manifest.variants ?? {});
    if (groups.length === 0) continue;
    const group = groups[0];
    assert.throws(
      () => arenaStyles(named.get(manifest.component))({ [group]: 'chartreuse' }),
      new RegExp(`${manifest.component}: ${group}="chartreuse" is not in the manifest`),
      `${manifest.component}: an unknown ${group} resolved to something instead of failing`,
    );
  }
});

test('a compound variant applies only when every condition it names holds', () => {
  const cased = manifests.filter((m) => (m.compoundVariants ?? []).length > 0);
  assert.ok(cased.length > 0, 'no manifest carries a compoundVariant, so this proves nothing');
  for (const manifest of cased) {
    const styles = arenaStyles(named.get(manifest.component));
    manifest.compoundVariants.forEach(({ class: applied, ...conditions }, index: number) => {
      const holding = styles({ ...manifest.defaultVariants, ...conditions });
      for (const slot of Object.keys(applied ?? {})) {
        assert.ok(holding[slot]().split(/\s+/).includes(`${slotClass(manifest.component, slot)}--cv${index + 1}`),
          `${manifest.component}: compound ${index + 1} did not apply to .${slot} with its own conditions met`);
      }
      const [firstCondition] = Object.keys(conditions);
      const otherValue = Object.keys(manifest.variants[firstCondition])
        .find((v) => v !== String(conditions[firstCondition]));
      if (otherValue === undefined) return;
      const broken = styles({ ...manifest.defaultVariants, ...conditions, [firstCondition]: otherValue });
      for (const slot of Object.keys(applied ?? {})) {
        assert.ok(!broken[slot]().split(/\s+/).includes(`${slotClass(manifest.component, slot)}--cv${index + 1}`),
          `${manifest.component}: compound ${index + 1} still applied with ${firstCondition}=${otherValue}`);
      }
    });
  }
});
