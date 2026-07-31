/* Mirrors the React suite of the same name, for the same reason: `none` says "a component with
 * no interactive affordance: it renders, and a user cannot act on it", its `requires` is empty,
 * and binding it therefore verifies NOTHING -- which is why every component here sat outside
 * COVERED. Each renders with no projected content and is asserted INERT, the sentence the
 * pattern's own description makes and no requirement can. SideNavSection cannot stand alone: it
 * pulls SideNavState from the nearest arena-side-nav, and its items are its CONTENT, so its entry
 * excludes that subtree -- the claim is about the affordance the component introduces, never
 * about what a consumer puts inside it. */

import { useTestEnvironment } from './TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppLogo } from '../components/brand/app-logo/AppLogo';
import { Avatar } from '../components/display/avatar/Avatar';
import { StatCard } from '../components/display/stat-card/StatCard';
import { UnauthCard } from '../components/display/unauth-card/UnauthCard';
import { ChartCard } from '../components/charts/chart-card/ChartCard';
import { EmptyState } from '../components/feedback/empty-state/EmptyState';
import { PageHead } from '../components/navigation/page-head/PageHead';
import { SideNav } from '../components/navigation/side-nav/SideNav';
import { SideNavItem } from '../components/navigation/side-nav-item/SideNavItem';
import { SideNavSection } from '../components/navigation/side-nav-section/SideNavSection';
import { assertPattern, ANGULAR_COMPONENTS } from './Compliance';

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';
const INTERACTIVE_ROLE = [
  'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option',
  'textbox', 'combobox', 'slider', 'spinbutton', 'gridcell',
];

export function inertProblems(root: Element, exclude = ''): string[] {
  const problems: string[] = [];
  const own = (el: Element) => !exclude || !el.closest(exclude);
  for (const el of [...root.querySelectorAll(FOCUSABLE)].filter(own)) {
    problems.push(`renders a focusable <${el.tagName.toLowerCase()}> of its own`);
  }
  for (const el of [...root.querySelectorAll('[role]')].filter(own)) {
    const role = el.getAttribute('role') ?? '';
    if (INTERACTIVE_ROLE.includes(role)) problems.push(`renders role="${role}"`);
  }
  return problems;
}

@Component({
  standalone: true,
  imports: [AppLogo, Avatar, StatCard, UnauthCard, ChartCard, EmptyState, PageHead, SideNav, SideNavItem, SideNavSection],
  template: `
    <arena-app-logo name="Dravensoft" />
    <arena-avatar name="Ada Lovelace" />
    <arena-stat-card label="Uptime" value="99.98%" />
    <arena-unauth-card title="Sign in" />
    <arena-chart-card title="Latency" />
    <arena-empty-state title="Nothing here yet" />
    <arena-page-head title="Projects" />
    <arena-side-nav ariaLabel="Workspace navigation">
      <arena-side-nav-section label="Workspace">
        <arena-side-nav-item id="overview" label="Overview" href="/overview" />
      </arena-side-nav-section>
    </arena-side-nav>
  `,
})
class InertHost {}

const INERT: Array<[string, string, string?]> = [
  ['arena-app-logo', 'brand/app-logo/AppLogo.behaviour.json'],
  ['arena-avatar', 'display/avatar/Avatar.behaviour.json'],
  ['arena-stat-card', 'display/stat-card/StatCard.behaviour.json'],
  ['arena-unauth-card', 'display/unauth-card/UnauthCard.behaviour.json'],
  ['arena-chart-card', 'charts/chart-card/ChartCard.behaviour.json'],
  ['arena-empty-state', 'feedback/empty-state/EmptyState.behaviour.json'],
  ['arena-page-head', 'navigation/page-head/PageHead.behaviour.json'],
  ['arena-side-nav-section', 'navigation/side-nav-section/SideNavSection.behaviour.json', 'arena-side-nav-item'],
];

test('every component binding "none" in this layer is actually inert', () => {
  const fixture = TestBed.createComponent(InertHost);
  fixture.detectChanges();
  try {
    const host = fixture.nativeElement as Element;
    assert.ok(INERT.length >= 8, 'the inert set lost an entry -- a component leaving it should leave by changing its binding');

    for (const [selector, tail, exclude] of INERT) {
      const el = host.querySelector(selector) as Element;
      assert.ok(el, `${selector} did not render, so this entry proved nothing`);
      assert.deepEqual(
        inertProblems(el, exclude), [],
        `${selector} binds "none", whose description is "a component with no interactive affordance: it renders, `
        + 'and a user cannot act on it". That pattern requires nothing, so the binding alone asserts none of it. This does.',
      );
      assertPattern({ root: el, bindingPath: join(ANGULAR_COMPONENTS, tail), subjects: { default: el } });
    }
  } finally {
    fixture.destroy();
  }
});

test('a focusable element inside the render is what this suite exists to catch', () => {
  const doc = document.implementation.createHTMLDocument();
  const root = doc.createElement('div');
  root.innerHTML = '<button type="button">Retry</button>';
  assert.notDeepEqual(inertProblems(root), [],
    'the check must see a real button, or it sees nothing');
});
