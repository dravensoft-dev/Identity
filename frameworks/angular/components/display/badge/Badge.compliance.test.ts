/* `none` requires nothing, so assertPattern alone would pass over a badge that had
 * grown a role or a tab stop. The claim the binding actually makes is that a user
 * cannot act on this, and that is what the hand assertions below check. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { assertNoNode } from '../../../test/NodeAssert';
import type { ArenaTone } from '../../../Api.generated';
import { Badge } from './Badge';
import { assertPattern, isFocusable, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'display/badge/Badge.behaviour.json');

@Component({
  standalone: true,
  imports: [Badge],
  template: `<arena-badge [tone]="tone" [dot]="dot">Deployed</arena-badge>`,
})
class BadgeHost {
  tone: ArenaTone = 'success';
  dot = false;
}

function render(patch: Partial<BadgeHost> = {}) {
  const fixture = TestBed.createComponent(BadgeHost);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture;
}

test('arena-badge shows its label and nothing a user can act on', () => {
  const fixture = render();
  try {
    const badge = fixture.nativeElement.querySelector('arena-badge') as HTMLElement;
    assert.equal(badge.textContent?.trim(), 'Deployed', 'the projected label did not reach the chip');

    assert.equal(badge.getAttribute('role'), null, 'a badge that claims a role claims an affordance it does not have');
    for (const el of [badge, ...Array.from(badge.querySelectorAll('*'))]) {
      assert.equal(isFocusable(el as Element), false,
        `<${el.tagName.toLowerCase()}> inside a badge is reachable by keyboard, so a user tabs to something inert`);
    }

    assertPattern({
      root: badge,
      bindingPath: BINDING,
      subjects: { default: badge },
    });
  } finally {
    fixture.destroy();
  }
});

test('the tone dot renders only when `dot` is set, and takes the tone ink rather than a second colour', () => {
  const without = render();
  try {
    const badge = without.nativeElement.querySelector('arena-badge') as HTMLElement;
    assertNoNode(badge.querySelector('span'), 'a badge with no `dot` still drew one');
  } finally {
    without.destroy();
  }

  const withDot = render({ dot: true });
  try {
    const badge = withDot.nativeElement.querySelector('arena-badge') as HTMLElement;
    const dot = badge.querySelector('span');
    assert.ok(dot, '`dot` was set and no dot rendered');
    assert.equal(dot.getAttribute('class') ?? '', 'arena-badge__dot',
      'the dot took a class of its own instead of inheriting the tone ink around it');
  } finally {
    withDot.destroy();
  }
});

test('`dot` takes the booleanAttribute transform, so the bare attribute form means true', () => {
  @Component({ standalone: true, imports: [Badge], template: `<arena-badge dot>Live</arena-badge>` })
  class BareAttribute {}

  const fixture = TestBed.createComponent(BareAttribute);
  fixture.detectChanges();
  try {
    const badge = fixture.nativeElement.querySelector('arena-badge') as HTMLElement;
    assert.ok(badge.querySelector('span'), 'the bare `dot` attribute read as false, so the empty string was not transformed');
  } finally {
    fixture.destroy();
  }
});
