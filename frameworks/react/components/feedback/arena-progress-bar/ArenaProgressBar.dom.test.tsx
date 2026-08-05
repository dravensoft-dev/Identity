import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from '../../../test/Harness.tsx';
import { assertPatternCases, REACT_COMPONENTS } from '../../../test/AssertPattern.tsx';
import { ArenaProgressBar } from './ArenaProgressBar.tsx';

afterEach(cleanup);

const BINDING = join(REACT_COMPONENTS, 'feedback/arena-progress-bar/ArenaProgressBar.behaviour.json');

function bar(root: ParentNode) {
  const el = root.querySelector('[role="progressbar"]');
  assert.ok(el, 'sanity: nothing rendered the progressbar element');
  return el;
}

test('ArenaProgressBar meets the progressbar pattern in both of its declared cases', () => {
  assertPatternCases({
    bindingPath: BINDING,
    cases: {

      determinate: () => {
        const root = mount(<ArenaProgressBar label="Deploying build #4821" progressPercentage={64} />);
        const el = bar(root);
        assert.equal(el.getAttribute('aria-valuenow'), '64',
          'a determinate bar must report its rounded percentage');
        assert.equal(el.getAttribute('aria-valuemin'), '0');
        assert.equal(el.getAttribute('aria-valuemax'), '100');
        return {
          root,
          subjects: { default: el },
          behavioural: { 'states.valuenow': true, 'states.valuemin': true, 'states.valuemax': true },
        };
      },

      indeterminate: () => {
        const root = mount(<ArenaProgressBar indeterminate label="Connecting" />);
        const el = bar(root);
        assert.equal(el.hasAttribute('aria-valuenow'), false,
          'an indeterminate bar reports no value, and ARIA expresses that by omitting the attribute');
        assert.equal(el.getAttribute('aria-valuemin'), '0');
        assert.equal(el.getAttribute('aria-valuemax'), '100');
        return {
          root,
          subjects: { default: el },
          behavioural: { 'states.valuenow': true, 'states.valuemin': true, 'states.valuemax': true },
        };
      },
    },
  });
});

test('the value the live region announces is INSIDE the live region, not in a sibling outside it', () => {
  const root = mount(<ArenaProgressBar label="Deploying build #4821" progressPercentage={64} />);
  const el = bar(root);
  assert.equal(el.getAttribute('aria-live'), 'polite', 'precondition: the track is the live region');
  assert.match(el.textContent, /64%/,
    'the region announces changes to its CONTENT, and reporting progress by mutating aria-valuenow alone '
    + 'leaves a polite region whose content never changes');
});

test('an indeterminate bar announces no value, so the region carries no percentage text either', () => {
  const root = mount(<ArenaProgressBar indeterminate label="Connecting" />);
  assert.equal(bar(root).textContent.trim(), '', 'an indeterminate bar has no value to announce');
});
