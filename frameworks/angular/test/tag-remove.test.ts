/* arena-tag gained a dismiss affordance in the reconciliation to a shared
 * Tag contract (api/components/Tag.json): `removable` gates an Arena-drawn
 * `×` button the same way React's does, and `remove` fires on click. Both are
 * asserted against a real render -- `removable` is a signal input, and this
 * harness is JIT-only (see alert-role-tones.test.ts's header, the shape this
 * copies): a signal input cannot be driven through a template binding, a
 * literal attribute, or `componentRef.setInput()`, so the instance field is
 * overwritten directly before the first `detectChanges()`. */
import { useTestEnvironment } from './testbed-env';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { TestBed } from '@angular/core/testing';
import { Tag } from '../primitives/tag/tag';

function renderTag(removable: boolean) {
  const fixture = TestBed.createComponent(Tag);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['removable'] = () => removable;
  fixture.detectChanges();
  return fixture;
}

test('removable renders a labelled dismiss button; the default renders none', () => {
  const withRemove = renderTag(true);
  try {
    const button = (withRemove.nativeElement as Element).querySelector('button[aria-label="Remove"]');
    assert.ok(button, 'removable=true must render a dismiss button');
  } finally {
    withRemove.destroy();
  }

  const without = renderTag(false);
  try {
    const button = (without.nativeElement as Element).querySelector('button[aria-label="Remove"]');
    assert.equal(button, null, 'removable=false (the default) must render no dismiss button');
  } finally {
    without.destroy();
  }
});

test('clicking the dismiss button emits remove', () => {
  const fixture = renderTag(true);
  try {
    const instance = fixture.componentInstance as unknown as { remove: { subscribe(cb: () => void): void } };
    let emitted = false;
    instance.remove.subscribe(() => {
      emitted = true;
    });

    const button = (fixture.nativeElement as Element).querySelector('button[aria-label="Remove"]') as HTMLElement;
    assert.ok(button, 'sanity: the dismiss button must be present to click it');
    button.dispatchEvent(new (globalThis as unknown as { MouseEvent: typeof MouseEvent }).MouseEvent('click', { bubbles: true }));

    assert.equal(emitted, true, 'clicking the dismiss button must emit remove');
  } finally {
    fixture.destroy();
  }
});
