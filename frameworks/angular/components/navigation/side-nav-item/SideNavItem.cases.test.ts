/* Mirrors the React suite of the same name. The item renders an <a href> or a <button>, so no
 * single interactive pattern always applies -- which is why it bound `none` with prose for as
 * long as the schema could not say "this pattern applies only when href is absent". It can, so it
 * does. The `link` case binds `none` on purpose: there is no link pattern, because a link's role,
 * keyboard and focusability all come from the platform.
 * `states.disabled` is declared FALSE on the button case and excepted on the binding: the
 * component has no disabled concept to reflect, and a BEHAVIOURAL requirement needs a verdict
 * either way -- the exception justifies the false rather than replacing it.
 * The item pulls SideNavState from the nearest arena-side-nav, so both cases mount one. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { SideNav } from '../side-nav/SideNav';
import { SideNavItem } from './SideNavItem';
import { assertPatternCases, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'navigation/side-nav-item/SideNavItem.behaviour.json');

@Component({
  standalone: true,
  imports: [SideNav, SideNavItem],
  template: `
    <arena-side-nav ariaLabel="Workspace navigation" [active]="activeId">
      <arena-side-nav-item id="overview" label="Overview" href="/overview" />
      <arena-side-nav-item id="settings" label="Settings" />
    </arena-side-nav>
  `,
})
class ItemHost {
  activeId = 'overview';
}

test('arena-side-nav-item meets both of the shapes href chooses between', () => {
  let fixture: ComponentFixture<ItemHost> | null = null;
  try {
    fixture = TestBed.createComponent(ItemHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as Element;

    assertPatternCases({
      bindingPath: BINDING,
      cases: {

        link: () => {
          const el = host.querySelector('a') as HTMLElement;
          assert.ok(el, 'with href the item must be a real anchor, or it navigates by script alone');
          assert.equal(el.getAttribute('href'), '/overview');
          assert.equal(el.hasAttribute('role'), false,
            'an <a href> is already a link -- a role attribute here would restate the platform or contradict it');
          assert.equal(el.hasAttribute('tabindex'), false,
            'and it is already focusable, so a tabindex would be a second opinion about the tab order');
          assert.equal(el.getAttribute('aria-current'), 'page',
            'the active destination is what this component adds on top of the anchor');
          return { root: el, subjects: { default: el } };
        },

        button: () => {
          const el = host.querySelector('button') as HTMLElement;
          assert.ok(el, 'with no href there is nowhere to navigate, so the item is a button');
          assert.equal(el.getAttribute('type'), 'button',
            'without type="button" it submits any form it happens to sit in');
          assert.match(el.textContent ?? '', /Settings/, 'the button pattern takes its name from its own text');
          assert.equal(el.hasAttribute('aria-current'), false,
            'only the active destination carries aria-current, and this is not it');

          return {
            root: el,
            subjects: { default: el },
            behavioural: {
              'keyboard.Enter': true,
              'keyboard.Space': true,
              'states.disabled': false,
            },
          };
        },
      },
    });
  } finally {
    fixture?.destroy();
  }
});
