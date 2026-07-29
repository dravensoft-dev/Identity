/* Both bindings name the `navigation` pattern and both requirements are decidable
 * from one element, so there is no behavioural map here at all. What the suite
 * adds beyond the wrapper is the half a single render cannot show: that two
 * instances carry DIFFERENT names, which is the whole point of the requirement
 * and the thing a hardcoded constant satisfied mechanically while failing. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from '../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../test/AssertPattern.jsx';
import { Breadcrumbs } from './breadcrumbs/Breadcrumbs.jsx';
import { Pagination } from './pagination/Pagination.jsx';
import { SideNav } from './side-nav/SideNav.jsx';
import { SideNavItem } from './side-nav-item/SideNavItem.jsx';

afterEach(cleanup);

const CRUMBS = [{ label: 'Clients', href: '/clients' }, { label: 'Overview' }];

test('Breadcrumbs is a named nav landmark, and two of them are told apart', () => {
  const root = mount(<Breadcrumbs ariaLabel="Project navigation" items={CRUMBS} />);
  const nav = root.querySelector('nav');
  assert.equal(nav.getAttribute('aria-label'), 'Project navigation',
    'the name must be the member, not a constant the component owns');

  const other = mount(<Breadcrumbs ariaLabel="Client navigation" items={CRUMBS} />);
  assert.notEqual(other.querySelector('nav').getAttribute('aria-label'), nav.getAttribute('aria-label'),
    'two trails on one page must be distinguishable, which a shared constant made impossible');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation/breadcrumbs/Breadcrumbs.behaviour.json'),
    subjects: { default: nav },
  });
});

test('Pagination is a named nav landmark, and two of them are told apart', () => {
  const root = mount(<Pagination page={3} pageCount={12} ariaLabel="Deployments" />);
  const nav = root.querySelector('nav');
  assert.equal(nav.getAttribute('aria-label'), 'Deployments',
    'the name must say what is being paged, and it must come from the member');

  const other = mount(<Pagination page={1} pageCount={4} ariaLabel="Environments" />);
  assert.notEqual(other.querySelector('nav').getAttribute('aria-label'), nav.getAttribute('aria-label'),
    'two paginated tables in one dashboard is a routine layout and they must not share a name');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation/pagination/Pagination.behaviour.json'),
    subjects: { default: nav },
  });
});

test('SideNav is a named nav landmark, and two of them are told apart', () => {
  const root = mount(
    <SideNav ariaLabel="Project sections" active="overview" onNav={() => {}}>
      <SideNavItem id="overview" label="Overview" />
      <SideNavItem id="deployments" label="Deployments" />
    </SideNav>,
  );
  const nav = root.querySelector('nav');
  assert.equal(nav.getAttribute('aria-label'), 'Project sections',
    'a sidebar and a breadcrumb trail on one page are two landmarks and must not share a name');

  const other = mount(
    <SideNav ariaLabel="Account sections" onNav={() => {}}><SideNavItem id="billing" label="Billing" /></SideNav>,
  );
  assert.notEqual(other.querySelector('nav').getAttribute('aria-label'), nav.getAttribute('aria-label'));

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation/side-nav/SideNav.behaviour.json'),
    subjects: { default: nav },
  });
});
