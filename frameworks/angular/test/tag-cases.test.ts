/* `arena-tag` renders a real <button> only when `removable()` is true; without
 * it -- the common case -- it is a plain tone dot and projected content, with
 * nothing to press. `tag.behaviour.json` now declares two cases that bind
 * DIFFERENT patterns, matching `Tag.behaviour.json`'s case names exactly (the
 * names must agree across layers -- `crossLayerAgrees`, Task 1): `plain` binds
 * `none`, `removable` binds `button`.
 *
 * The input is driven through `componentRef.setInput()` before the first
 * `detectChanges()`, so each case renders the configuration its name claims.
 *
 * `keyboard.Space` and `keyboard.Enter` are BEHAVIOURAL for the `button`
 * pattern, and this suite proves both by dispatching a real `keydown` of Enter
 * and of ' ' at the close button and asserting `event.defaultPrevented` stays
 * false -- ported from frameworks/react/test-dom/tag-and-chip-cases.test.jsx's
 * `assertKeysUnintercepted`, itself ported from
 * side-nav-disclosure.test.jsx's trigger test. That is the non-vacuous half:
 * an `(keydown)` of ours calling `preventDefault()` would suppress the
 * platform's own activation, and only dispatching and observing catches that
 * -- the element merely being a native <button> does not. A `keydown` does
 * NOT itself synthesise a `click` in happy-dom, so this can only prove
 * non-interception; a real click dispatched and observed to emit `remove`
 * (below) is what proves the platform's route actually does something. The
 * close button carries no `(keydown)` of its own, only `(click)`, so nothing
 * here is expected to intercept either key -- but that is exactly the claim
 * dispatching verifies rather than assumes. */
import { useTestEnvironment } from './testbed-env';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { Tag } from '../components/display/tag/Tag';
import { assertPatternCases, ANGULAR_PRIMITIVES } from './compliance';

const BINDING = join(ANGULAR_PRIMITIVES, 'display/tag/Tag.behaviour.json');

/** Dispatch a real `keydown` of Enter and of Space at `el` and assert neither
 *  was intercepted -- the non-vacuous half of a `keyboard.Space`/`keyboard.Enter`
 *  verdict. Ported from the React suite's `assertKeysUnintercepted`. */
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
        // `none` has no requirements, so there is nothing to point at.
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
