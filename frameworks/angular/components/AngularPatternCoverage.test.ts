/* Three primitives whose bindings claimed a pattern with nothing rendering them.
 * They share a file because none needs more than one fixture and none belongs to
 * the others -- so this sits at the components/ level, where a suite about no one
 * component goes. The modal's INTERIOR trap is not asserted here: that is native
 * sequential navigation, which happy-dom does not implement, and the FocusTrap
 * helpers have their own suites. */
import { useTestEnvironment } from '../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSameNode } from '../test/NodeAssert';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { Skeleton } from './display/skeleton/Skeleton';
import { ErrorState } from './feedback/error-state/ErrorState';
import { Onboarding } from './feedback/onboarding/Onboarding';
import { assertPattern, ANGULAR_COMPONENTS } from '../test/Compliance';

test('arena-skeleton is a polite status that never takes focus', () => {
  const fixture = TestBed.createComponent(Skeleton);
  fixture.detectChanges();
  try {
    const host = fixture.nativeElement as HTMLElement;
    assert.equal(host.getAttribute('role'), 'status',
      'a placeholder that announces nothing leaves a screen-reader user waiting in silence');
    assert.equal(host.querySelectorAll('[tabindex]').length, 0,
      'nothing inside a skeleton may be reachable -- there is no content to act on yet');

    assertPattern({
      root: host,
      bindingPath: join(ANGULAR_COMPONENTS, 'display/skeleton/Skeleton.behaviour.json'),
      subjects: { default: host },
      behavioural: { 'focus.unaffected': true },
    });
  } finally {
    fixture.destroy();
  }
});

test('arena-error-state announces itself and schedules nothing that could retract it', () => {
  const before = document.activeElement;
  const fixture = TestBed.createComponent(ErrorState);
  fixture.componentRef.setInput('title', 'Deploy failed');
  fixture.detectChanges();
  try {
    const host = fixture.nativeElement as HTMLElement;
    assert.equal(host.getAttribute('role'), 'alert');
    assertSameNode(document.activeElement, before, 'rendering the error moved focus, which an alert must never do');

    assertPattern({
      root: host,
      bindingPath: join(ANGULAR_COMPONENTS, 'feedback/error-state/ErrorState.behaviour.json'),
      subjects: { default: host },
      behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
    });
  } finally {
    fixture.destroy();
  }
});

test('arena-onboarding is a labelled modal that takes focus on open and gives it back', () => {
  const invoker = document.createElement('button');
  invoker.textContent = 'Show me around';
  document.body.appendChild(invoker);
  invoker.focus();

  const fixture = TestBed.createComponent(Onboarding);
  try {
    fixture.componentRef.setInput('steps', [{ title: 'Projects', body: 'Everything starts here.' }]);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const panel = host.querySelector('[role="dialog"]') as HTMLElement;
    assert.ok(panel, 'an open onboarding must render its panel');
    assert.equal(panel.getAttribute('aria-modal'), 'true');
    assert.ok(panel.contains(document.activeElement),
      'opening left focus outside the panel, so the first Tab goes back into the page behind it');

    assertPattern({
      root: host,
      bindingPath: join(ANGULAR_COMPONENTS, 'feedback/onboarding/Onboarding.behaviour.json'),
      subjects: { default: panel },
      behavioural: { 'focus.onOpen': true, 'focus.onClose': true, 'focus.trap': true, 'keyboard.Escape': true },
    });

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    assertSameNode(document.activeElement, invoker, 'closing did not restore focus to the invoker');
  } finally {
    fixture.destroy();
    invoker.remove();
  }
});
