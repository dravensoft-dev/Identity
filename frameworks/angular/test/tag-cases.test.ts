/* `arena-tag` renders a real <button> only when `removable()` is true; without
 * it -- the common case -- it is a plain tone dot and projected content, with
 * nothing to press. `tag.behaviour.json` now declares two cases that bind
 * DIFFERENT patterns, matching `Tag.behaviour.json`'s case names exactly (the
 * names must agree across layers -- `crossLayerAgrees`, Task 1): `plain` binds
 * `none`, `removable` binds `button`.
 *
 * The input is driven by overwriting the instance field before the first
 * `detectChanges()`, not `componentRef.setInput()` -- this harness runs
 * `@angular/compiler`'s JIT and never `ngtsc`, so a signal input never reaches
 * `ɵcmp.inputs` and `setInput()` would silently no-op rather than throw. See
 * alert-role-tones.test.ts's header for the full reasoning; this file copies
 * the same shape.
 *
 * `keyboard.Space` and `keyboard.Enter` are BEHAVIOURAL for the `button`
 * pattern, and a `keydown` of Enter or Space on a native <button> does NOT
 * synthesise a `click` in happy-dom -- that is the browser's own activation
 * behaviour. The close button carries no `(keydown)` of its own, only
 * `(click)`, so a real click dispatched and observed to emit `remove` is what
 * a native button's Enter and Space route to through the platform, and the
 * categorical `true` records that rather than a key dispatch happy-dom cannot
 * honour -- the same reasoning frameworks/react/test-dom/tag-and-chip-cases.
 * test.jsx's header carries for the same button. */
import { useTestEnvironment } from './testbed-env';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { Tag } from '../primitives/tag/tag';
import { assertPatternCases, ANGULAR_PRIMITIVES } from './compliance';

const BINDING = join(ANGULAR_PRIMITIVES, 'tag/tag.behaviour.json');

function renderTag(removable: boolean) {
  const fixture = TestBed.createComponent(Tag);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['removable'] = () => removable;
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
