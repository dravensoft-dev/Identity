/* Three of this pattern's requirements -- focus.roving, ArrowKeys and Space --
 * are the PLATFORM's, not Arena's: native radios sharing one `name` get a single
 * tab stop and arrow selection from the browser, and happy-dom implements none of
 * it. A test dispatching ArrowDown here would pass identically against a working
 * group and a broken one, so what is asserted is the structural precondition the
 * browser needs, and the behaviour itself is checked by hand on the card page.
 * RadioGroup and Radio bind the same pattern over the same DOM, so one render
 * answers both bindings. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from '../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../test/AssertPattern.jsx';
import { RadioGroup } from './radio-group/RadioGroup.jsx';
import { Radio } from './radio/Radio.jsx';

afterEach(cleanup);

const GROUP_BINDING = join(REACT_COMPONENTS, 'forms/radio-group/RadioGroup.behaviour.json');
const RADIO_BINDING = join(REACT_COMPONENTS, 'forms/radio/Radio.behaviour.json');

function renderGroup(ariaLabel = 'Deployment target') {
  return mount(
    <RadioGroup ariaLabel={ariaLabel} name="env" value="staging">
      <Radio value="production" label="Production" />
      <Radio value="staging" label="Staging" />
      <Radio value="qa" label="QA" />
    </RadioGroup>,
  );
}

test('the group carries the name, and the platform gets what it needs to rove', () => {
  const root = renderGroup();
  const group = root.querySelector('[role="radiogroup"]');
  const radios = [...root.querySelectorAll('input[type="radio"]')];
  assert.equal(radios.length, 3, 'sanity: the fixture must render three options');

  assert.equal(group.getAttribute('aria-label'), 'Deployment target',
    'the group names what is being chosen; each option names only itself');

  const names = new Set(radios.map((r) => r.getAttribute('name')));
  assert.equal(names.size, 1,
    'one shared name is what makes the browser treat these as ONE tab stop and one arrow cycle');
  assert.equal(names.has('env'), true, 'the shared name must be the one the caller supplied');

  assert.equal(radios.filter((r) => r.checked).length, 1,
    'exactly one option checked is what decides where focus lands on entry');
  assert.equal(radios[1].checked, true, 'the checked option must be the one matching `value`');

  assert.equal(root.querySelectorAll('[tabindex]').length, 0,
    'Arena must author no tabindex here -- doing so would fight the roving stop the browser already gives');
});

test('the group name is the member and not the form name', () => {
  const root = renderGroup('Rollout ring');
  const group = root.querySelector('[role="radiogroup"]');
  assert.equal(group.getAttribute('aria-label'), 'Rollout ring');
  assert.equal(group.hasAttribute('aria-labelledby'), false,
    'nothing in the tree is the label, so the name must be the literal one the caller gave');
});

for (const [subject, bindingPath] of [['RadioGroup', GROUP_BINDING], ['Radio', RADIO_BINDING]]) {
  test(`${subject} meets the radiogroup pattern it binds`, () => {
    const root = renderGroup();
    const group = root.querySelector('[role="radiogroup"]');
    const radios = [...root.querySelectorAll('input[type="radio"]')];

    assertPattern({
      root,
      bindingPath,
      subjects: { default: group, 'roles.item': radios[0], 'states.checked': radios },
      behavioural: { 'focus.roving': true, 'keyboard.ArrowKeys': true, 'keyboard.Space': true },
    });
  });
}
