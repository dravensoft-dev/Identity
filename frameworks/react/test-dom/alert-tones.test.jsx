/* Alert and Toast both render one of two DOM shapes off a single ternary --
 * `role={tone === 'danger' ? 'alert' : 'status'}` -- and a binding that stayed
 * flat could only ever be measured against one of them. `Alert.behaviour.json`
 * used to bind `alert` outright and except `roles.element` for every tone but
 * danger; that exception was never a defect, it was a description of the
 * SECOND render the flat shape had no room for. `bindingCases()` (Tasks 1-4)
 * gives the binding two cases -- danger against `alert`, everything else
 * against `status` -- and this suite is what makes each case an actual claim
 * about an actual render rather than an assertion nobody runs.
 *
 * Toast carries the same split with one asymmetry preserved on purpose:
 * `content.noAutoDismiss` is a real claim about the host owning the timer, and
 * it is true of the danger case only -- `status` does not require it, so
 * declaring it on `advisory` would name a requirement that pattern does not
 * have. See Toast.behaviour.json. */
import test, { afterEach } from 'node:test';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from './harness.jsx';
import { assertPatternCases, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Alert } from '../components/feedback/Alert.jsx';
import { Toast } from '../components/feedback/Toast.jsx';

afterEach(cleanup);

// `focus.unaffected` is BEHAVIOURAL for both `alert` and `status` -- neither
// pattern's requirement is decidable from a single snapshot -- and both
// Alert and Toast render a plain <div> with no tabindex, so mounting one
// neither takes focus nor moves it. True of every case in both suites below.
test('Alert meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'feedback/Alert.behaviour.json'),
    cases: {
      danger: () => ({
        root: mount(<Alert tone="danger" title="Failed" />),
        behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
      }),
      advisory: () => ({
        root: mount(<Alert tone="info" title="Heads up" />),
        behavioural: { 'focus.unaffected': true },
      }),
    },
  });
});

test('Toast meets both of its declared cases, and content.noAutoDismiss stays unmet on danger alone', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'feedback/Toast.behaviour.json'),
    cases: {
      danger: () => ({
        root: mount(<Toast tone="danger" message="Failed" />),
        behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': false },
      }),
      advisory: () => ({
        root: mount(<Toast tone="neutral" message="Saved" />),
        behavioural: { 'focus.unaffected': true },
      }),
    },
  });
});
