import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { Tag } from './Tag';
import { assertPatternCases, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'display/tag/Tag.behaviour.json');

function assertKeysUnintercepted(el: Element): void {
  for (const key of ['Enter', ' ']) {
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, false,
      `a handler of ours cancelled ${key === ' ' ? 'Space' : key}, suppressing the button's own activation`);
  }
}

function renderTag(removable: boolean) {
  const fixture = TestBed.createComponent(Tag);
  fixture.componentRef.setInput('removable', removable);
  fixture.detectChanges();
  return fixture;
}

test('arena-tag meets both of its declared cases', () => {
  const fixtures: ReturnType<typeof renderTag>[] = [];
  try {
    assertPatternCases({
      bindingPath: BINDING,
      cases: {

        plain: () => {
          const fixture = renderTag(false);
          fixtures.push(fixture);
          return { root: fixture.nativeElement as Element };
        },
        removable: () => {
          const fixture = renderTag(true);
          fixtures.push(fixture);
          const host = fixture.nativeElement as Element;
          const button = host.querySelector('button') as HTMLElement;
          assertKeysUnintercepted(button);
          let removed = false;
          fixture.componentInstance.remove.subscribe(() => { removed = true; });
          button.click();
          fixture.detectChanges();
          assert.equal(removed, true, 'sanity: a real click must reach the remove output');
          return {
            root: host,
            subjects: { default: button },
            behavioural: { 'states.disabled': false, 'keyboard.Space': true, 'keyboard.Enter': true },
          };
        },
      },
    });
  } finally {
    for (const fixture of fixtures) fixture.destroy();
  }
});
