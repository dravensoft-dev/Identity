/* Two components whose PATTERN changes with a prop, not only their exceptions.
 *
 * `Tag` renders a real <button> only when `removable` is true; without it -- the
 * common case -- it is a <span> with nothing to press, matching no interactive
 * pattern at all. The flat binding used to say `button` with a `roles.element`
 * exception, which told a reader the pattern always held. `Tag.behaviour.json`
 * now declares two cases that bind DIFFERENT patterns: `plain` is `none`, and
 * `removable` is `button`. `tag.behaviour.json` (Angular) carries the same two
 * case names, which `crossLayerAgrees` requires.
 *
 * `CalendarEvent` takes the same treatment across the three shapes its own
 * exception always described (see CalendarEvent.behaviour.json and
 * CalendarEvent.jsx:51-52,69,137-140,195-210): with `onClick` and no action
 * panel the chip ROOT is the <button> (`clickable`); with `onClick` AND
 * `actionsEnabled` the root becomes a <div> and the chip BODY -- a descendant
 * <button> -- carries the pattern (`clickable-with-actions`); with no `onClick`
 * there is no button anywhere and the pattern does not apply (`inert`).
 *
 * `keyboard.Space` and `keyboard.Enter` are BEHAVIOURAL for the `button` pattern
 * exactly as they are for SideNav's disclosure trigger (see
 * side-nav-disclosure.test.jsx's header) and for the same reason: a `keydown` of
 * Enter or Space on a native <button> does NOT synthesise a `click` in
 * happy-dom -- that is the browser's own activation behaviour. Both interactive
 * subjects below are a native <button type="button"> with no `onKeyDown` of its
 * own intercepting (Tag's remove button has none at all; CalendarEvent's
 * `onKeyDown` in the paneled case is on the chip ROOT, a different element from
 * the body button that carries the pattern in that case), so a real `click`
 * dispatched and observed to run the handler is what a native button's Enter and
 * Space route to through the platform, and the categorical `true` records that
 * rather than a key dispatch happy-dom cannot honour. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from './harness.jsx';
import { assertPatternCases, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Tag } from '../components/display/Tag.jsx';
import { CalendarEvent } from '../components/display/CalendarEvent.jsx';

afterEach(cleanup);

test('Tag meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'display/Tag.behaviour.json'),
    cases: {
      // `none` has no requirements, so there is nothing to point at -- the
      // container's own first child (the label <span>) is never inspected.
      plain: () => ({ root: mount(<Tag>Backend</Tag>) }),
      removable: () => {
        let removed = false;
        const root = mount(<Tag removable onRemove={() => { removed = true; }}>Backend</Tag>);
        // The <button> is a descendant of the label <span>, not the root's
        // first child, so the fallback (root.firstElementChild) would point
        // at the wrong element; name the real subject explicitly.
        const button = root.querySelector('button');
        act(() => { button.click(); });
        assert.equal(removed, true, 'sanity: a real click must reach onRemove');
        return {
          root,
          subjects: { default: button },
          behavioural: { 'states.disabled': false, 'keyboard.Space': true, 'keyboard.Enter': true },
        };
      },
    },
  });
});

const CHIP = {
  box: {}, color: 'var(--color-cat-1)', timeLabel: '09:00 - 09:30',
  dateLabel: 'Monday 20 July', tabIndex: 0,
};

test('CalendarEvent meets all three of its declared shapes', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'display/CalendarEvent.behaviour.json'),
    cases: {
      // onClick set, no action panel -- the chip root itself is the <button>,
      // so the default fallback (root.firstElementChild) already names it.
      clickable: () => {
        let clicked = false;
        const root = mount(<CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z"
          end="2026-07-20T09:30:00Z" onClick={() => { clicked = true; }} {...CHIP} />);
        act(() => { root.firstElementChild.click(); });
        assert.equal(clicked, true, 'sanity: a real click must reach onClick');
        return {
          root,
          behavioural: { 'states.disabled': false, 'keyboard.Space': true, 'keyboard.Enter': true },
        };
      },
      // onClick set AND actionsEnabled -- the root is a <div>, and the chip
      // BODY (a descendant <button> whose aria-label starts with the title) is
      // the element carrying the pattern.
      'clickable-with-actions': () => {
        let clicked = false;
        const root = mount(<CalendarEvent id="b" title="Standup" start="2026-07-20T09:00:00Z"
          end="2026-07-20T09:30:00Z" onClick={() => { clicked = true; }} actionsEnabled
          actions={<button type="button">Delete</button>} {...CHIP} />);
        const body = [...root.querySelectorAll('button')]
          .find((b) => /^Standup,/.test(b.getAttribute('aria-label') || ''));
        act(() => { body.click(); });
        assert.equal(clicked, true, 'sanity: a real click must reach onClick');
        return {
          root,
          subjects: { default: body },
          behavioural: { 'states.disabled': false, 'keyboard.Space': true, 'keyboard.Enter': true },
        };
      },
      // No onClick at all -- regardless of actionsEnabled -- there is no
      // button anywhere and `none` applies; nothing to point at.
      inert: () => ({
        root: mount(<CalendarEvent id="c" title="Standup" start="2026-07-20T09:00:00Z"
          end="2026-07-20T09:30:00Z" {...CHIP} />),
      }),
    },
  });
});
