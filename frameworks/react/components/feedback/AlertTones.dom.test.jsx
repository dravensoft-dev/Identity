import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../test/Harness.jsx';
import { assertPattern, assertPatternCases, REACT_COMPONENTS } from '../../test/AssertPattern.jsx';
import { Alert } from './alert/Alert.jsx';
import { Toast } from './toast/Toast.jsx';
import { ErrorState } from './error-state/ErrorState.jsx';

afterEach(cleanup);

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

  assert.equal(root.firstElementChild.getAttribute('role'), 'alert',
    'the alert must still be a live region after every timer has fired');
  assert.ok(root.querySelector('button[aria-label="Dismiss"]'),
    'the alert must still be rendered after every timer it scheduled has fired');
});

test('Alert meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'feedback/alert/Alert.behaviour.json'),
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
    bindingPath: join(REACT_COMPONENTS, 'feedback/toast/Toast.behaviour.json'),
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

test('ErrorState meets the alert pattern -- the failure announces itself', () => {
  const globals = globalThis;
  const names = ['setTimeout', 'setInterval', 'requestAnimationFrame'];
  const saved = new Map(names.map((n) => [n, globals[n]]));
  const scheduled = [];

  for (const name of names) {
    const original = saved.get(name);
    if (typeof original !== 'function') continue;
    globals[name] = (callback, ...rest) => {
      scheduled.push(name);
      return original(callback, ...rest);
    };
  }

  const before = document.activeElement;
  let root;
  try {
    root = mount(
      <ErrorState title="Deploy failed" message="The cluster refused the image." code="E_IMAGE_PULL"
        retryLabel="Try again" onRetry={() => {}} />,
    );
  } finally {
    for (const [name, original] of saved) globals[name] = original;
  }

  assert.deepEqual(scheduled, [],
    'ErrorState scheduled a timer -- an alert that can disappear on its own fails content.noAutoDismiss');
  assert.equal(document.activeElement, before,
    'rendering the error moved focus, which an alert must never do');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'feedback/error-state/ErrorState.behaviour.json'),
    behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
  });
});
