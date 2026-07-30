import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSameNode } from '../../../test/NodeAssert';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { Alert } from './Alert';

import { assertPatternCases, ANGULAR_COMPONENTS, isFocusable } from '../../../test/Compliance';
const BINDING = join(ANGULAR_COMPONENTS, 'feedback/alert/Alert.behaviour.json');

const TONES = ['info', 'success', 'warning', 'danger', 'neutral'] as const;

function renderAlert(tone: (typeof TONES)[number]) {
  const fixture = TestBed.createComponent(Alert);
  fixture.componentRef.setInput('tone', tone);
  fixture.detectChanges();
  return fixture;
}

test('arena-alert exposes role=alert only for the danger tone -- every other tone is the politer role=status', () => {
  const seen: Record<string, string | null> = {};
  for (const tone of TONES) {
    const fixture = renderAlert(tone);
    try {
      seen[tone] = (fixture.nativeElement as Element).getAttribute('role');
    } finally {
      fixture.destroy();
    }
  }
  assert.deepEqual(seen, {
    info: 'status',
    success: 'status',
    warning: 'status',
    danger: 'alert',
    neutral: 'status',
  });
});

test('arena-alert neither takes focus nor moves it -- focus.unaffected, proved by acting on the tree', () => {
  const anchor = document.createElement('button');
  document.body.appendChild(anchor);
  try {
    anchor.focus();
    assertSameNode(document.activeElement, anchor, 'sanity: focus starts on the anchor button');

    const fixture = renderAlert('danger');
    try {
      const host = fixture.nativeElement as Element;

      assert.equal(host.getAttribute('tabindex'), null, 'an alert must not be placed in the tab order');
      assert.equal(isFocusable(host), false, 'an alert host must not be able to take focus');
      assertSameNode(
        document.activeElement,
        anchor,
        'rendering an alert must not steal focus from whatever the user was on',
      );
    } finally {
      fixture.destroy();
    }
  } finally {

    anchor.remove();
  }
});

test('arena-alert survives every timer its own render schedules, fired early -- content.noAutoDismiss', () => {
  const globals = globalThis as unknown as Record<string, unknown>;
  const names = ['setTimeout', 'setInterval', 'requestAnimationFrame'] as const;
  const saved = new Map<string, unknown>(names.map((n) => [n, globals[n]]));
  const captured: (() => void)[] = [];

  for (const name of names) {
    const original = saved.get(name);
    if (typeof original !== 'function') continue;
    globals[name] = (callback: unknown, ...rest: unknown[]) => {
      if (typeof callback === 'function') captured.push(() => (callback as (...a: unknown[]) => void)(0));
      return (original as (...a: unknown[]) => unknown)(callback, ...rest);
    };
  }

  let fixture;
  try {
    fixture = TestBed.createComponent(Alert);
    fixture.componentRef.setInput('tone', 'danger');
    fixture.componentRef.setInput('dismissible', true);
    fixture.detectChanges();
  } finally {
    for (const [name, original] of saved) globals[name] = original;
  }

  try {
    const host = fixture!.nativeElement as Element;
    assert.ok(host.querySelector('button[aria-label="Dismiss"]'), 'the dismissible branch should have rendered');
    assert.ok(captured.length > 0, 'sanity: a real render does schedule something -- Angular\'s own scheduler does');

    for (const fire of captured) fire();
    fixture!.detectChanges();

    assert.equal(host.getAttribute('role'), 'alert', 'the alert must still be a live region after every timer has fired');
    assert.ok(
      host.querySelector('button[aria-label="Dismiss"]'),
      'the alert must still be rendered after every timer it scheduled has fired',
    );
  } finally {
    fixture!.destroy();
  }
});

test('arena-alert meets both of its declared cases', () => {
  const fixtures: ReturnType<typeof renderAlert>[] = [];
  try {
    assertPatternCases({
      bindingPath: BINDING,
      cases: {
        danger: () => {
          const fixture = renderAlert('danger');
          fixtures.push(fixture);
          return {
            root: fixture.nativeElement as Element,
            behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
          };
        },
        advisory: () => {
          const fixture = renderAlert('info');
          fixtures.push(fixture);
          return {
            root: fixture.nativeElement as Element,
            behavioural: { 'focus.unaffected': true },
          };
        },
      },
    });
  } finally {
    for (const fixture of fixtures) fixture.destroy();
  }
});
