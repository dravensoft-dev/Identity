/* Every verdict in the behavioural map below is earned by a named assertion in this file.
 * keyboard.Space and keyboard.Enter are earned by the control being a real <button>: the UA
 * activates it on both keys, and no test here can prove that because happy-dom synthesizes
 * no click from a keydown. So the assertion is that the element is the one the browser
 * already knows how to activate -- which is the whole reason the host stays bare. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './Button';
import { assertPattern, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'forms/button/Button.behaviour.json');

@Component({
  standalone: true,
  imports: [Button],
  template: `<arena-button [disabled]="disabled" [loading]="loading" (click)="clicks = clicks + 1">Save changes</arena-button>`,
})
class ButtonHost {
  disabled = false;
  loading = false;
  clicks = 0;
}

function render(patch: Partial<ButtonHost> = {}) {
  const fixture = TestBed.createComponent(ButtonHost);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const control = host.querySelector('button') as HTMLButtonElement;
  return { fixture, host, control };
}

test('the recipe lands on a real <button>, which is what supplies Space and Enter activation', () => {
  const { fixture, control } = render();
  try {
    assert.ok(control, 'arena-button rendered no <button> -- nothing would be focusable or activatable');
    assert.equal(control.tagName, 'BUTTON');
    assert.equal(control.getAttribute('role'), null,
      'a role override on a native button would replace the activation semantics this pattern relies on');
    assert.equal(control.getAttribute('type'), 'button',
      'the default must be button, or a button inside a form submits it by accident');
  } finally {
    fixture.destroy();
  }
});

test('the host stays bare -- the recipe classes land on the <button> inside it, not on the host', () => {
  const { fixture, host, control } = render();
  try {
    assert.equal(host.getAttribute('class'), null);
    assert.match(control.getAttribute('class') ?? '', /inline-flex/);
  } finally {
    fixture.destroy();
  }
});

test('a click on the control emits click exactly once, and the projected label names it', () => {
  const { fixture, control } = render();
  try {
    assert.equal(control.textContent?.trim(), 'Save changes',
      'the label is projected content, and without it the button has no accessible name');

    control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    assert.equal(fixture.componentInstance.clicks, 1,
      'a consumer binding (click) must hear the output once -- twice would mean the native event reached them too');
  } finally {
    fixture.destroy();
  }
});

test('disabled reflects onto the native attribute and blocks the emission', () => {
  const { fixture, control } = render({ disabled: true });
  try {
    assert.equal(control.disabled, true);
    assert.ok(control.hasAttribute('disabled'),
      'the attribute is what the disabled: variants style and what removes the control from the Tab sequence');

    control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    assert.equal(fixture.componentInstance.clicks, 0, 'a disabled button emitted click');
  } finally {
    fixture.destroy();
  }
});

test('loading implies disabled and swaps the leading icon for the spinner', () => {
  const { fixture, control } = render({ loading: true });
  try {
    assert.equal(control.disabled, true, 'loading must block activation without the caller also setting disabled');
    const spinner = control.querySelector('span');
    assert.ok(spinner, 'loading rendered no spinner');
    assert.match(spinner.getAttribute('class') ?? '', /arena-btn-spin/);
    assert.equal(spinner.getAttribute('aria-hidden'), 'true',
      'the spinner is decoration; the label already says what is happening');
  } finally {
    fixture.destroy();
  }
});

test('arena-button meets the button pattern', () => {
  const { fixture, host, control } = render();
  try {
    assertPattern({
      root: host,
      bindingPath: BINDING,
      subjects: { default: control },
      behavioural: { 'states.disabled': true, 'keyboard.Space': true, 'keyboard.Enter': true },
    });
  } finally {
    fixture.destroy();
  }
});
