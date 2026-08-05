import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../test/Harness.tsx';
import { assertPattern, assertPatternCases, REACT_COMPONENTS } from '../../test/AssertPattern.tsx';
import { ArenaAlert } from './arena-alert/ArenaAlert.tsx';
import { ArenaToast } from './arena-toast/ArenaToast.tsx';
import { ArenaErrorState } from './arena-error-state/ArenaErrorState.tsx';

afterEach(cleanup);

function TimerProbe() {
  React.useEffect(() => {
    const t = setTimeout(() => {}, 4200);
    return () => clearTimeout(t);
  }, []);
  return <span data-timer-probe="" />;
}

test('ArenaAlert survives every timer its own render schedules, fired early -- content.noAutoDismiss', () => {
  const globals = globalThis as unknown as Record<string, (...args: unknown[]) => unknown>;
  const names = ['setTimeout', 'setInterval', 'requestAnimationFrame'];
  const saved = new Map(names.map((n) => [n, globals[n]]));
  const captured: unknown[] = [];
  const probed: unknown[] = [];

  for (const name of names) {
    const original = saved.get(name);
    if (typeof original !== 'function') continue;
    globals[name] = (callback: unknown, ...rest: unknown[]) => {
      if (typeof callback === 'function') captured.push(() => callback(0));
      return original(callback, ...rest);
    };
  }

  let root;
  try {

    mount(<TimerProbe />);
    probed.push(...captured);
    captured.length = 0;
    root = mount(<ArenaAlert tone="danger" title="Failed" dismissible onClose={() => {}} />);
  } finally {
    for (const [name, original] of saved) if (original) globals[name] = original;
  }

  assert.ok(probed.length > 0,
    'sanity: the interception must be live -- a component that DOES schedule a timer was not captured');
  assert.ok(root.querySelector<HTMLElement>('button[aria-label="Dismiss"]')!, 'the dismissible branch should have rendered');

  act(() => { for (const fire of captured) (fire as () => void)(); });

  assert.equal(root.firstElementChild!.getAttribute('role'), 'alert',
    'the alert must still be a live region after every timer has fired');
  assert.ok(root.querySelector<HTMLElement>('button[aria-label="Dismiss"]')!,
    'the alert must still be rendered after every timer it scheduled has fired');
});

test('ArenaAlert meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'feedback/arena-alert/ArenaAlert.behaviour.json'),
    cases: {
      danger: () => ({
        root: mount(<ArenaAlert tone="danger" title="Failed" />),
        behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
      }),
      advisory: () => ({
        root: mount(<ArenaAlert tone="info" title="Heads up" />),
        behavioural: { 'focus.unaffected': true },
      }),
    },
  });
});

test('ArenaToast meets both of its declared cases, and a danger toast cannot be un-pinned', () => {
  const unpinned = mount(<ArenaToast tone="neutral" title="Saved" message="Draft stored" />);
  assert.equal(unpinned.firstElementChild!.hasAttribute('data-persist'), false,
    'an advisory toast is the host\'s to dismiss, and says so');
  cleanup();

  const asked = mount(<ArenaToast tone="danger" title="Failed" message="The cluster refused it" persist={false} />);
  assert.equal(asked.firstElementChild!.hasAttribute('data-persist'), true,
    'a danger toast must ignore persist={false} -- a critical message on a timer is one a user can miss');
  assert.match(asked.textContent, /Pinned/,
    'and it must say so on screen too, or the marker contradicts the behaviour');
  cleanup();

  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'feedback/arena-toast/ArenaToast.behaviour.json'),
    cases: {
      danger: () => ({
        root: mount(<ArenaToast tone="danger" message="Failed" />),
        behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
      }),
      advisory: () => ({
        root: mount(<ArenaToast tone="neutral" message="Saved" />),
        behavioural: { 'focus.unaffected': true },
      }),
    },
  });
});

test('ArenaErrorState meets the alert pattern -- the failure announces itself', () => {
  const globals = globalThis as unknown as Record<string, (...args: unknown[]) => unknown>;
  const names = ['setTimeout', 'setInterval', 'requestAnimationFrame'];
  const saved = new Map(names.map((n) => [n, globals[n]]));
  const scheduled: unknown[] = [];

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
      <ArenaErrorState title="Deploy failed" message="The cluster refused the image." code="E_IMAGE_PULL"
        retryLabel="Try again" onRetry={() => {}} />,
    );
  } finally {
    for (const [name, original] of saved) if (original) globals[name] = original;
  }

  assert.deepEqual(scheduled, [],
    'ArenaErrorState scheduled a timer -- an alert that can disappear on its own fails content.noAutoDismiss');
  assert.equal(document.activeElement, before,
    'rendering the error moved focus, which an alert must never do');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'feedback/arena-error-state/ArenaErrorState.behaviour.json'),
    behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
  });
});
