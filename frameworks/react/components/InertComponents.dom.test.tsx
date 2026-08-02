/* `none` says "a component with no interactive affordance: it renders, and a user cannot act on
 * it" -- and its `requires` is empty, so binding it verifies NOTHING. Every component here was
 * outside COVERED for exactly that reason: a compliance suite over `none` would have been
 * ceremony. So each renders with no consumer content and is asserted INERT, which is the
 * sentence the pattern's own description makes and no requirement can. Content a consumer
 * projects is theirs and is deliberately not passed: PageHead has an action slot, and a Button
 * inside one leaves the binding correct. SideNavSection is the one that needs a child at
 * all -- its content slot is required -- and it gets an inert one that absorbs the props the
 * section injects into its direct children, because a bare <span> would receive them as unknown
 * DOM attributes. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from '../test/Harness.tsx';
import { assertPattern, REACT_COMPONENTS } from '../test/AssertPattern.tsx';
import { AppLogo } from './brand/app-logo/AppLogo.tsx';
import { Avatar } from './display/avatar/Avatar.tsx';
import { Badge } from './display/badge/Badge.tsx';
import { Card } from './display/card/Card.tsx';
import { StatCard } from './display/stat-card/StatCard.tsx';
import { UnauthCard } from './display/unauth-card/UnauthCard.tsx';
import { ChartCard } from './charts/chart-card/ChartCard.tsx';
import { EmptyState } from './feedback/empty-state/EmptyState.tsx';
import { ToastHost } from './feedback/toast-host/ToastHost.tsx';
import { PageHead } from './navigation/page-head/PageHead.tsx';
import { SideNavSection } from './navigation/side-nav-section/SideNavSection.tsx';

afterEach(cleanup);

function InertChild() {
  return <span>Overview</span>;
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';
const INTERACTIVE_ROLE = [
  'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option',
  'textbox', 'combobox', 'slider', 'spinbutton', 'gridcell',
];

const INERT: [string, string, React.ReactElement][] = [
  ['AppLogo', 'brand/app-logo/AppLogo.behaviour.json', <AppLogo mark={<svg />} name="Dravensoft" />],
  ['Avatar', 'display/avatar/Avatar.behaviour.json', <Avatar name="Ada Lovelace" />],
  ['Badge', 'display/badge/Badge.behaviour.json', <Badge>Healthy</Badge>],
  ['StatCard', 'display/stat-card/StatCard.behaviour.json', <StatCard label="Uptime" value="99.98%" />],
  ['UnauthCard', 'display/unauth-card/UnauthCard.behaviour.json', <UnauthCard title="Sign in" />],
  ['ChartCard', 'charts/chart-card/ChartCard.behaviour.json', <ChartCard title="Latency" />],
  ['EmptyState', 'feedback/empty-state/EmptyState.behaviour.json', <EmptyState title="Nothing here yet" />],
  ['ToastHost', 'feedback/toast-host/ToastHost.behaviour.json', <ToastHost />],
  ['PageHead', 'navigation/page-head/PageHead.behaviour.json', <PageHead title="Projects" />],
  ['SideNavSection', 'navigation/side-nav-section/SideNavSection.behaviour.json',
    <SideNavSection label="Workspace"><InertChild /></SideNavSection>],
];

export function inertProblems(root: ParentNode) {
  const problems = [];
  for (const el of root.querySelectorAll(FOCUSABLE)) {
    problems.push(`renders a focusable <${el.tagName.toLowerCase()}> of its own`);
  }
  for (const el of root.querySelectorAll('[role]')) {
    const role = el.getAttribute('role');
    if (INTERACTIVE_ROLE.includes(role!)) problems.push(`renders role="${role}"`);
  }
  return problems;
}

for (const [name, tail, element] of INERT) {
  test(`${name} binds "none" and is actually inert`, () => {
    const root = mount(element);

    assert.deepEqual(
      inertProblems(root), [],
      `${name} binds "none", whose description is "a component with no interactive affordance: it renders, and a `
      + 'user cannot act on it". That pattern requires nothing, so the binding alone asserts none of it. This does.',
    );

    assertPattern({ root, bindingPath: join(REACT_COMPONENTS, tail!), subjects: { default: root.firstElementChild } });
  });
}

test('the inert set is not empty and every entry names a real binding, so a shrinking list cannot pass by having nothing in it', () => {
  assert.ok(INERT.length >= 9, 'the inert set lost an entry -- a component leaving it should leave by changing its binding');
  for (const [name, tail] of INERT) {
    assert.match(tail, new RegExp(`/${name}\\.behaviour\\.json$`), `${name} names a binding tail that is not its own`);
  }
});

test('a focusable element inside the render is what this suite exists to catch', () => {
  const root = mount(<Card title="Deployments" action={<button type="button">Retry</button>} />);
  assert.notDeepEqual(inertProblems(root), [],
    'a Card given an action slot renders a real button -- the check must see it, or it sees nothing. '
    + 'The binding stays correct because that button is the CONSUMER\'s, which is why the cases above pass no slots.');
});
