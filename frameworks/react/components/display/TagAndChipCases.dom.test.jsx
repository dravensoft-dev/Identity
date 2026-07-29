/* Two components whose PATTERN changes with a prop, not only their exceptions.
 *
 * `Tag` renders a real <button> only when `removable` is true; without it -- the
 * common case -- it is a <span> with nothing to press, matching no interactive
 * pattern at all. The flat binding used to say `button` with a `roles.element`
 * exception, which told a reader the pattern always held.
 * `display/Tag.behaviour.json` now declares two cases that bind DIFFERENT
 * patterns: `plain` is `none`, and `removable` is `button`. Angular's own
 * binding, the `Tag` one under `frameworks/angular/components/display/tag/`,
 * carries the same two case names, which `crossLayerAgrees` requires. Both are
 * spelled `Tag` since the structure refactor's batch 2, so a bare stem no longer
 * says which layer is meant -- name the directory. (Deliberately NOT written as
 * that layer's full binding path: check:compliance discriminates layers by
 * searching a suite for its own layer's path tail, and spelling the sibling's
 * tail here would let this React suite satisfy an Angular coverage claim.)
 *
 * `CalendarEvent` takes the same treatment across the three shapes its own
 * exception always described (see CalendarEvent.behaviour.json and
 * CalendarEvent.jsx:51-52,69,137-140,195-210): with `onClick` and no action
 * panel the chip ROOT is the <button> (`clickable`); with `onClick` AND
 * `actionsEnabled` the root becomes a <div> and the chip BODY -- a descendant
 * <button> -- carries the pattern (`clickable-with-actions`); with no `onClick`
 * there is no button anywhere and the pattern does not apply (`inert`).
 *
 * `keyboard.Space` and `keyboard.Enter` are BEHAVIOURAL for the `button` pattern,
 * and this suite proves both the same way side-nav-disclosure.test.jsx's own
 * trigger test does -- ported rather than reinvented, because the precedent
 * does three separate things and all three are needed:
 *   (1) the interactive subject is a native <button>, which is what makes the
 *       PLATFORM route Enter and Space to a click -- nothing in Arena implements
 *       either key, and nothing needs to. Note what is NOT claimed here: the
 *       precedent this was ported from names a <button type="button">, and that
 *       is true of CalendarEvent's buttons and of Angular's Tag.ts, but React's
 *       Tag.jsx renders its remove button with NO `type` at all. It defaults to
 *       `submit`, which changes what the button does inside a <form> and changes
 *       nothing about Enter/Space activation -- so the mechanism below holds for
 *       it exactly as written, while the description had to stop claiming a
 *       `type` the element does not carry.
 *   (2) a real `keydown` of Enter and of ' ' is dispatched at that subject and
 *       `event.defaultPrevented` is asserted false. This is the non-vacuous
 *       half: an `onKeyDown` of ours calling `preventDefault()` on either key
 *       would suppress the platform's own activation, and only dispatching and
 *       observing catches that -- asserting from the element merely being a
 *       <button> would not.
 *   (3) a real `click` reaches the handler -- proved below and by `assert
 *       equal(clicked/removed, true)`. Without it, (2) would establish only
 *       that a key reaches a click, never that a click does anything.
 * A `keydown` does NOT itself synthesise a `click` in happy-dom -- that is the
 * browser's own activation behaviour -- so (2) can never be replaced by
 * dispatching the key and checking for a side effect; it can only prove
 * non-interception, which is exactly what it is used for here.
 *
 * `CalendarEvent`'s paneled body button needs (2) run at the BODY, not the
 * root: the root carries the chip's own `onKeyDown` (CalendarEvent.jsx:141-167),
 * and because keydown bubbles, a key pressed on the body DOES reach that
 * ancestor handler. It is still safe -- not because the handler is on a
 * "different element" out of the event's path, but because none of its
 * branches match `Enter` or `' '`: it acts on `Escape`, `ArrowRight` and
 * `ArrowLeft` only, so Enter/Space fall through unhandled and
 * `defaultPrevented` stays false. Dispatching at the body is what actually
 * exercises that bubble path rather than assuming it never reaches the
 * handler. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../test/Harness.jsx';
import { assertPatternCases, REACT_COMPONENTS } from '../../test/AssertPattern.jsx';
import { Tag } from './tag/Tag.jsx';
import { CalendarEvent } from './calendar-event/CalendarEvent.jsx';

afterEach(cleanup);

/** Dispatch a real `keydown` of Enter and of Space at `el` and assert neither
 *  was intercepted -- the non-vacuous half of a `keyboard.Space`/`keyboard.Enter`
 *  verdict. `bubbles: true` is what lets an ancestor's `onKeyDown` actually see
 *  it, which is the case worth exercising rather than assuming away. */
function assertKeysUnintercepted(el) {
  for (const key of ['Enter', ' ']) {
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    act(() => { el.dispatchEvent(ev); });
    assert.equal(ev.defaultPrevented, false,
      `a handler of ours cancelled ${key === ' ' ? 'Space' : key}, suppressing the button's own activation`);
  }
}

test('Tag meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'display/tag/Tag.behaviour.json'),
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
        assertKeysUnintercepted(button);
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

/* The props Calendar injects into every event chip -- see Calendar.jsx's own
 * cloneElement call. `tabIndex: -1` is the value that matters and is not a
 * detail: the grid is ONE roving tab stop, so every chip is OUT of the page Tab
 * sequence and is reached by Enter from the cell that intersects it. A fixture
 * passing 0 would render the `inert` case TABBABLE while its binding's reason
 * says it has no tabbable behaviour -- true only at -1. No verdict moves either
 * way; the fixture simply has to be the render Calendar actually produces. */
const CHIP = {
  box: {}, color: 'var(--color-cat-1)', timeLabel: '09:00 - 09:30',
  dateLabel: 'Monday 20 July', tabIndex: -1,
};

test('CalendarEvent meets all three of its declared shapes', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'display/calendar-event/CalendarEvent.behaviour.json'),
    cases: {
      // onClick set, no action panel -- the chip root itself is the <button>,
      // so the default fallback (root.firstElementChild) already names it.
      clickable: () => {
        let clicked = false;
        const root = mount(<CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z"
          end="2026-07-20T09:30:00Z" onClick={() => { clicked = true; }} {...CHIP} />);
        assertKeysUnintercepted(root.firstElementChild);
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
        // Dispatched at the BODY, bubbling up through the chip root's own
        // onKeyDown -- this exercises the real bubble path rather than
        // assuming the ancestor handler never sees the key.
        assertKeysUnintercepted(body);
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
