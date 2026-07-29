/* The DOM half of SideNav's proof, and it is here rather than in
 * frameworks/react/test/ because every assertion below needs a real click to have
 * happened and a real attribute to have changed as a result.
 *
 * What this suite may and may not claim, because happy-dom bounds it:
 *   - a dispatched `click` on a real element runs React's handler: PROVABLE, and
 *     everything below rests on it.
 *   - a `keydown` of Enter or Space on a native <button> does NOT synthesise a
 *     click in happy-dom -- that is the browser's own activation behaviour, which
 *     we neither implement nor can observe here. So `keyboard.Enter` and
 *     `keyboard.Space` are NOT asserted by dispatching keys. They are established
 *     the only honest way available: the trigger is a native <button type=button>
 *     with no onKeyDown of ours intercepting, and clicking it toggles the region.
 *     A native button's Enter and Space route to click through the platform; that
 *     is the same implicit-semantics principle ELEMENT_ROLE encodes for roles, and
 *     the reason the rejected text scan reported 60 of 118 true claims as unmet.
 *   - `document.activeElement` after a Tab keypress: NEVER asserted. happy-dom has
 *     no sequential focus navigation, so such a test passes identically against a
 *     correct implementation and none. Focus structure is asserted as `tagName`
 *     and `tabindex` instead.
 */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
// mount() RETURNS THE CONTAINER; cleanup() is a separate export that unmounts
// everything mount() created. Call it from an afterEach, never destructure it.
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.jsx';
import { SideNav } from './SideNav.jsx';
import { SideNavItem } from '../side-nav-item/SideNavItem.jsx';
import { SideNavSection } from '../side-nav-section/SideNavSection.jsx';
import { SideNavCollapsible } from '../side-nav-collapsible/SideNavCollapsible.jsx';

afterEach(cleanup);

/* Every query below goes through the derived ids rather than through
 * `querySelector('button')`. That is decision (c) exercised rather than merely
 * described: `${id}-trigger` and `${id}-region` are addressable from outside the
 * component, which is the whole reason `id` is a required member instead of a
 * useId() value nothing can name. It is also what keeps these queries correct in
 * the fixtures below that render a second button of their own. */
const trigger = (root, id) => root.querySelector(`#${id}-trigger`);
const region = (root, id) => root.querySelector(`#${id}-region`);
const press = (root, id) => act(() => { trigger(root, id).click(); });

const one = (props = {}, kids = <SideNavItem id="prod" label="Production" href="#prod" />) => (
  <SideNav ariaLabel="Primary" active={props.active}>
    <SideNavCollapsible id="deploys" label="Deployments" onToggle={props.onToggle}>
      {kids}
    </SideNavCollapsible>
  </SideNav>
);

test('clicking the trigger expands it: aria-expanded, hidden and display all move together', () => {
  const root = mount(one());
  const t = trigger(root, 'deploys');
  const r = region(root, 'deploys');
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  assert.equal(r.hasAttribute('hidden'), true);
  /* Decision (b): `hidden` alone would be beaten by an inline display:flex, so
     the display is driven by the same state and both are checked every time. */
  assert.equal(r.style.display, 'none');

  press(root, 'deploys');

  assert.equal(t.getAttribute('aria-expanded'), 'true');
  assert.equal(r.hasAttribute('hidden'), false);
  assert.equal(r.style.display, 'flex');
});

test('clicking again collapses it, and toggle reported one boolean per press', () => {
  const seen = [];
  const root = mount(one({ onToggle: (v) => seen.push(v) }));
  press(root, 'deploys');
  assert.deepEqual(seen, [true]);
  press(root, 'deploys');
  assert.deepEqual(seen, [true, false], 'toggle did not report exactly one boolean per press');
  assert.equal(trigger(root, 'deploys').getAttribute('aria-expanded'), 'false');
  assert.equal(region(root, 'deploys').hasAttribute('hidden'), true);
  assert.equal(region(root, 'deploys').style.display, 'none');
});

/* Decision (d): the auto-expand is Arena's decision, not the user's. Reporting it
   through `toggle` would be a lie a consumer persists to a preference store. */
test('the auto-expand around the active destination is not reported through toggle', () => {
  const seen = [];
  const root = mount(one({ active: 'prod', onToggle: (v) => seen.push(v) }));
  assert.equal(trigger(root, 'deploys').getAttribute('aria-expanded'), 'true',
    'a subtree holding the active id did not open itself');
  assert.equal(region(root, 'deploys').hasAttribute('hidden'), false);
  assert.deepEqual(seen, [], 'the automatic expansion was reported as a user press');
});

/* A route change is a rerender with a new `active`, so it needs a stateful host.
   The seeded half cannot cover this -- useState's initial value is read once. */
function RouteHost({ onToggle }) {
  const [active, setActive] = React.useState('home');
  return (
    <div>
      <button type="button" id="go" onClick={() => setActive('prod')}>go</button>
      <SideNav ariaLabel="Primary" active={active}>
        <SideNavItem id="home" label="Home" href="#home" />
        <SideNavCollapsible id="deploys" label="Deployments" onToggle={onToggle}>
          <SideNavItem id="prod" label="Production" href="#prod" />
        </SideNavCollapsible>
      </SideNav>
    </div>
  );
}

test('a route change into a collapsed subtree opens it, and still reports no toggle', () => {
  const seen = [];
  const root = mount(<RouteHost onToggle={(v) => seen.push(v)} />);
  assert.equal(trigger(root, 'deploys').getAttribute('aria-expanded'), 'false');

  act(() => { root.querySelector('#go').click(); });

  assert.equal(trigger(root, 'deploys').getAttribute('aria-expanded'), 'true',
    'the effect half of decision (d) never ran -- seeding alone cannot reopen a group');
  assert.equal(region(root, 'deploys').hasAttribute('hidden'), false);
  assert.deepEqual(seen, [], 'the automatic expansion was reported as a user press');
});

/* The property a derived `expanded || holdsActive` would silently lose: after the
   group opens itself, the user is still allowed to shut it. */
test('the user may collapse a group that holds the active destination', () => {
  const seen = [];
  const root = mount(one({ active: 'prod', onToggle: (v) => seen.push(v) }));
  assert.equal(trigger(root, 'deploys').getAttribute('aria-expanded'), 'true');

  press(root, 'deploys');

  assert.equal(trigger(root, 'deploys').getAttribute('aria-expanded'), 'false',
    'the group reopened itself against the user -- the expanded state is derived, not owned');
  assert.equal(region(root, 'deploys').hasAttribute('hidden'), true);
  assert.deepEqual(seen, [false], 'the press the user actually made went unreported');
});

test('a nested collapsible opens independently of its parent -- two disclosures, not a treeview', () => {
  const root = mount(
    <SideNav ariaLabel="Primary">
      <SideNavCollapsible id="outer" label="Outer">
        <SideNavCollapsible id="inner" label="Inner">
          <SideNavItem id="prod" label="Production" href="#prod" />
        </SideNavCollapsible>
      </SideNavCollapsible>
    </SideNav>,
  );
  press(root, 'outer');
  assert.equal(trigger(root, 'outer').getAttribute('aria-expanded'), 'true');
  assert.equal(trigger(root, 'inner').getAttribute('aria-expanded'), 'false',
    'opening the outer group opened the inner one too -- the state is shared');

  press(root, 'inner');
  assert.equal(trigger(root, 'outer').getAttribute('aria-expanded'), 'true',
    'opening the inner group closed the outer one');
  assert.equal(trigger(root, 'inner').getAttribute('aria-expanded'), 'true');
  assert.equal(region(root, 'inner').hasAttribute('hidden'), false);
});

test('aria-current lands on the one item at depth 2, indented by two compounded steps', () => {
  const root = mount(
    <SideNav ariaLabel="Primary" active="prod">
      <SideNavSection label="Workspace">
        <SideNavCollapsible id="deploys" label="Deployments">
          <SideNavItem id="prod" label="Production" href="#prod" />
        </SideNavCollapsible>
      </SideNavSection>
    </SideNav>,
  );
  const current = [...root.querySelectorAll('[aria-current]')];
  assert.equal(current.length, 1, 'aria-current is on more than one element, or on none');
  assert.equal(current[0].tagName, 'A');
  assert.match(current[0].getAttribute('style'),
    /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3 \+ var\(--sp-1\) \* 6\)/,
    'the depth did not compound through the section and the collapsible');
});

/* THE ONE R4 ASSERTION AN SSR-ONLY SUITE COULD NOT BE TRUSTED WITH.
 *
 * Today the region is rendered while collapsed, so renderToStaticMarkup does see
 * inside it -- but that is a property of decision (a), not of the component's
 * contract. The day someone conditionally mounts the region, the SSR suite goes
 * blind to a {...rest} spread on it without a single test failing. This one does
 * not: it expands first and looks at the revealed subtree. */
test('no consumer style and no consumer attribute survive into the revealed region', () => {
  const root = mount(
    <SideNavCollapsible id="d" label="D" data-stray="x" style={{ color: '#ff00ff' }}>
      <SideNavItem id="a" label="A" href="#a" />
    </SideNavCollapsible>,
  );
  const r = region(root, 'd');
  assert.equal(r.hasAttribute('hidden'), true, 'the fixture was not collapsed at mount');

  press(root, 'd');
  assert.equal(r.hasAttribute('hidden'), false, 'the region never opened, so nothing was inspected');

  assert.equal(root.querySelector('[data-stray]'), null,
    'a consumer attribute reached an element -- a {...rest} spread is back');
  assert.equal(r.querySelector('[data-stray]'), null,
    'a consumer attribute reached the revealed region');
  assert.doesNotMatch(root.innerHTML, /#ff00ff/,
    'a consumer style reached the rendered tree -- the R4 escape is back');
});

/* The focus half, asserted STRUCTURALLY. happy-dom has no sequential focus
   navigation, so a Tab keypress plus document.activeElement would pass identically
   against a correct implementation and none. That a browser really does skip a
   hidden region is on the by-hand checklist instead. */
test('a collapsed region holds its links inside [hidden]; an expanded one does not; neither adds a tabindex', () => {
  const root = mount(one());
  const r = region(root, 'deploys');
  const links = [...r.querySelectorAll('a')];
  assert.equal(links.length, 1, 'the fixture rendered no link to reason about');

  assert.equal(links[0].closest('[hidden]'), r,
    'the link is not inside the hidden region -- it stays in the tab order while collapsed');
  assert.equal(links[0].getAttribute('tabindex'), null,
    'the item carries a tabindex of its own, which would survive the region being hidden');

  press(root, 'deploys');

  assert.equal(links[0].closest('[hidden]'), null,
    'the region stayed hidden after expanding, so its links are still unreachable');
  assert.equal(links[0].getAttribute('tabindex'), null,
    'expanding added a tabindex the collapsed state did not have');
});

test('SideNavCollapsible meets the disclosure pattern it binds', () => {
  const root = mount(
    <SideNavCollapsible id="deploys" label="Deployments">
      <SideNavItem id="prod" label="Production" href="#prod" />
    </SideNavCollapsible>,
  );
  const t = trigger(root, 'deploys');

  /* THE ASSERTIONS BEHIND THE TWO BEHAVIOURAL VERDICTS BELOW, in this same body,
   * because a declared verdict with no assertion pins a claim the suite does not
   * check -- the exact failure this layer exists to remove.
   *
   *   (1) the trigger is a NATIVE button of type="button". That is what makes the
   *       platform route Enter and Space to a click; nothing in Arena implements
   *       either key, and nothing needs to.
   *   (2) neither key's default is prevented. This is the non-vacuous half: an
   *       onKeyDown of ours calling preventDefault() would suppress the platform's
   *       own activation behaviour, and this catches exactly that.
   *   (3) a real click toggles the region -- proved here and again in the first
   *       test of this file. Without it, (1) would establish only that a key
   *       reaches a click, not that a click does anything. */
  assert.equal(t.tagName, 'BUTTON');
  assert.equal(t.getAttribute('type'), 'button');
  for (const key of ['Enter', ' ']) {
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    act(() => { t.dispatchEvent(ev); });
    assert.equal(ev.defaultPrevented, false,
      `a handler of ours cancelled ${key === ' ' ? 'Space' : key}, suppressing the button's own activation`);
  }
  const r = region(root, 'deploys');
  assert.equal(r.hasAttribute('hidden'), true, 'a keydown alone toggled the region');
  press(root, 'deploys');
  assert.equal(r.hasAttribute('hidden'), false, 'a click did not toggle the region');
  press(root, 'deploys');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation', 'side-nav-collapsible', 'SideNavCollapsible.behaviour.json'),
    // Every requirement of this pattern is about the button: roles.element,
    // roles.label, roles.expanded and roles.controls all live on it, and the two
    // keyboard keys are declared behavioural below.
    subjects: { default: t },
    behavioural: { 'keyboard.Enter': true, 'keyboard.Space': true },
  });
});
