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
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from './harness.jsx';
import { assertPatternCases, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Alert } from '../components/feedback/Alert.jsx';
import { Toast } from '../components/feedback/Toast.jsx';

afterEach(cleanup);

/* `content.noAutoDismiss` -- "an alert must not disappear on a timer" -- is a
 * claim about the passage of time, which is why the evaluator returns null for it
 * and a suite has to act rather than read. This is the React port of
 * the Angular layer's components/feedback/alert/Alert.roleTones.test.ts's own
 * timer test, and it is
 * here because a bare `behavioural: { 'content.noAutoDismiss': true }` beside a
 * suite that acts on every other behavioural verdict is exactly the unbacked
 * assertion this layer exists to remove -- the verdict happens to be true
 * (Alert.jsx schedules nothing), and "happens to be true" is what a render suite
 * replaces with evidence.
 *
 * Waiting is not the way to act on it. The shortest value the system would use to
 * retire a transient notice is `--dismiss-default`, 4200ms (tokens/src/behaviour.
 * json), and a suite that sat out 4.2 real seconds would still only have proved
 * the alert outlived *that* timer. So this fires the clock forward instead: every
 * callback scheduled while the alert mounts is captured, then invoked
 * immediately, regardless of the delay it asked for. A 4.2s dismissal and a 0ms
 * one are treated the same, and it costs milliseconds.
 *
 * ONE THING DID NOT PORT, and it is worth stating rather than quietly dropping.
 * The Angular test's sanity anchor is `captured.length > 0` -- "a real render does
 * schedule something, Angular's own scheduler does". That is FALSE under React:
 * measured here, mounting this Alert captures ZERO callbacks across setTimeout,
 * setInterval, requestAnimationFrame, queueMicrotask and setImmediate, because
 * `act()` flushes React's work synchronously and React's own scheduler reaches for
 * MessageChannel rather than a timer. Asserting `> 0` therefore fails on a
 * perfectly correct Alert, and asserting `=== 0` would be exactly the count-based
 * check the Angular header rejects -- it would go red the day React schedules
 * anything at all, for a reason that has nothing to do with the component.
 *
 * So the anchor is a CONTROL instead: a probe component that schedules a real
 * 4.2s timer from an effect is mounted inside the same interception window, and
 * its callback must be captured. That proves the interception is live rather than
 * silently broken -- the thing the Angular assertion was really buying -- without
 * asserting anything false about what React schedules. Without it, a wrapper that
 * captured nothing would make this test pass vacuously.
 *
 * The `dismissible` branch is the one rendered, since a hypothetical auto-dismiss
 * would live beside the manual one. */
function TimerProbe() {
  React.useEffect(() => {
    const t = setTimeout(() => {}, 4200);
    return () => clearTimeout(t);
  }, []);
  return <span data-timer-probe="" />;
}

test('Alert survives every timer its own render schedules, fired early -- content.noAutoDismiss', () => {
  const globals = globalThis;
  const names = ['setTimeout', 'setInterval', 'requestAnimationFrame'];
  const saved = new Map(names.map((n) => [n, globals[n]]));
  const captured = [];
  const probed = [];

  for (const name of names) {
    const original = saved.get(name);
    if (typeof original !== 'function') continue;
    globals[name] = (callback, ...rest) => {
      if (typeof callback === 'function') captured.push(() => callback(0));
      return original(callback, ...rest);
    };
  }

  let root;
  try {
    // The control goes through the same wrappers, in the same window.
    mount(<TimerProbe />);
    probed.push(...captured);
    captured.length = 0;
    root = mount(<Alert tone="danger" title="Failed" dismissible onClose={() => {}} />);
  } finally {
    for (const [name, original] of saved) globals[name] = original;
  }

  assert.ok(probed.length > 0,
    'sanity: the interception must be live -- a component that DOES schedule a timer was not captured');
  assert.ok(root.querySelector('button[aria-label="Dismiss"]'), 'the dismissible branch should have rendered');

  act(() => { for (const fire of captured) fire(); });

  // Still here, role intact, dismiss control intact. An alert goes away when the
  // consumer acts on `onClose`, never on its own clock.
  assert.equal(root.firstElementChild.getAttribute('role'), 'alert',
    'the alert must still be a live region after every timer has fired');
  assert.ok(root.querySelector('button[aria-label="Dismiss"]'),
    'the alert must still be rendered after every timer it scheduled has fired');
});

// `focus.unaffected` is BEHAVIOURAL for both `alert` and `status` -- neither
// pattern's requirement is decidable from a single snapshot -- and both
// Alert and Toast render a plain <div> with no tabindex, so mounting one
// neither takes focus nor moves it. True of every case in both suites below.
// `content.noAutoDismiss: true` on Alert's `danger` case below is the verdict the
// timer test above proves; it is not a bare assertion.
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
