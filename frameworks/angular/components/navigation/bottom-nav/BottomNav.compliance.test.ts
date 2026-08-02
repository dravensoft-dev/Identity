/* The bar's own binding is `navigation`, whose two clauses are the landmark element and its
 * unique name. What no requirement states, and what this bar exists to get right, is the
 * geometry: it reads --layout-bar, --z-nav and --pad-safe-bottom rather than a number, and
 * that is asserted from the recipe rather than from a computed style, because happy-dom
 * resolves no custom property. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { assertSameNode } from '../../../test/NodeAssert';
import { BottomNav } from './BottomNav';
import { BottomNavItem } from '../bottom-nav-item/BottomNavItem';
import { assertPattern, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'navigation/bottom-nav/BottomNav.behaviour.json');

@Component({
  standalone: true,
  imports: [BottomNav, BottomNavItem],
  template: `
    <arena-bottom-nav [ariaLabel]="label" [active]="activeId" (nav)="reported.push($event)">
      <arena-bottom-nav-item id="home" icon="ph-bold ph-house" label="Home" href="/home" />
      <arena-bottom-nav-item id="orders" icon="ph-bold ph-receipt" label="Orders" href="/orders" />
      <arena-bottom-nav-item id="more" icon="ph-bold ph-dots-three" label="More" />
    </arena-bottom-nav>
  `,
})
class BarHost {
  label = 'Primary';
  activeId = 'home';
  reported: string[] = [];
}

function render(patch: Partial<BarHost> = {}) {
  const fixture = TestBed.createComponent(BarHost);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture;
}

const barOf = (fixture: ReturnType<typeof render>) =>
  fixture.nativeElement.querySelector('arena-bottom-nav') as HTMLElement;

test('arena-bottom-nav is a named navigation landmark, which is the whole of what it binds', () => {
  const fixture = render();
  try {
    const bar = barOf(fixture);
    assert.equal(bar.getAttribute('role'), 'navigation',
      'a custom element is no landmark by itself, so the role is what makes this one');
    assert.equal(bar.getAttribute('aria-label'), 'Primary');

    assertPattern({ root: bar, bindingPath: BINDING, subjects: { default: bar } });
  } finally {
    fixture.destroy();
  }
});

test('a blank ariaLabel throws rather than rendering a landmark nothing can tell from the sidebar', () => {
  assert.throws(() => render({ label: '   ' }), /ariaLabel/);
});

test('the bar reports the destination that was activated, and only that one', () => {
  const fixture = render();
  try {
    const bar = barOf(fixture);
    (bar.querySelectorAll('a')[1] as HTMLElement).click();
    fixture.detectChanges();
    assert.deepEqual(fixture.componentInstance.reported, ['orders']);
  } finally {
    fixture.destroy();
  }
});

test('every destination takes an equal share, and nothing about that is a member of either contract', () => {
  const fixture = render();
  try {
    const bar = barOf(fixture);
    const columns = Array.from(bar.querySelectorAll('a, button'));
    assert.equal(columns.length, 3);
    for (const column of columns) {
      const cls = column.className.split(/\s+/);
      assert.ok(cls.includes('flex-1') && cls.includes('basis-0'),
        'a column that sizes to its own label makes the bar lurch as the labels change');
      assert.ok(cls.includes('min-w-0'), 'and without a zero floor a long label pushes its neighbours out of the bar');
    }
  } finally {
    fixture.destroy();
  }
});

test('the bar takes no focus of its own and steals none when it mounts', () => {
  const anchor = document.createElement('button');
  document.body.appendChild(anchor);
  try {
    anchor.focus();
    const fixture = render();
    try {
      assert.equal(barOf(fixture).getAttribute('tabindex'), null, 'the landmark must not be a tab stop');
      assertSameNode(document.activeElement, anchor, 'mounting a bar of links must not move focus');
    } finally {
      fixture.destroy();
    }
  } finally {
    anchor.remove();
  }
});
