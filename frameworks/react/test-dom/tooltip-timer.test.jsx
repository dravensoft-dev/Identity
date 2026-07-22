/* The one genuinely new behaviour plan 7a shipped, and the one it left
 * untested. CLAUDE.md's Known debt names it exactly: plan 7a gave Pagination
 * five pinned tests for a pure relocation that changes no output and could not
 * break, and gave Tooltip's useRef, its cancel-on-transition rule and its
 * unmount cleanup none. This file is that debt paid.
 *
 * The rule under test is cancel-and-reschedule. Tooltip holds ONE timer in a
 * useRef and clears it on every transition. Two timers would race: crossing out
 * of a trigger before --delay-open elapses must CANCEL the pending reveal, not
 * queue a second one behind it, or the tooltip flashes onto a pointer that has
 * already left. Unmounting must clear the timer too, rather than leave it to
 * fire setShow into a component that no longer exists.
 *
 * ---------------------------------------------------------------------------
 * WHY REAL TIMERS, AND WHY THE EVENTS ARE NOT THE ONES YOU WOULD EXPECT.
 *
 * Real timers: this repo has no bun:test and therefore no fake-timer facility
 * -- all 60 suites are node:test plus node:assert/strict, and node:test has no
 * clock of its own. act() and fake timers also interact badly. --delay-open is
 * 400ms and --delay-close is 120ms, both imported from tokens.generated.js
 * rather than written here, so the whole suite costs about two seconds. If this
 * ever proves flaky, shorten the margins around the delays; do not add a
 * fake-timer dependency.
 *
 * The events: React 18 does not listen for `mouseenter`/`mouseleave` at all.
 * Its EnterLeaveEventPlugin synthesises onMouseEnter/onMouseLeave from
 * `mouseover`/`mouseout` delegated at the root container, so dispatching a
 * literal `mouseenter` is a silent no-op -- the handler never runs, the timer
 * is never scheduled, and a test written that way passes by asserting that
 * nothing happened after nothing happened. Verified against this harness before
 * these tests were written. Dispatch mouseover/mouseout. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from './harness.jsx';
import { Tooltip } from '../components/feedback/Tooltip.jsx';
import { delayOpen, delayClose } from '../tokens.generated.js';

afterEach(cleanup);

/** Margin either side of a delay boundary. Large enough that ordinary timer
 *  jitter under a loaded test process cannot cross it, small enough that the
 *  suite stays cheap. */
const MARGIN = 120;

/** Dispatch the raw DOM event React actually delegates on, and let React flush.
 *  `type` is 'mouseover' (-> onMouseEnter) or 'mouseout' (-> onMouseLeave). */
function hover(el, type) {
  act(() => { el.dispatchEvent(new window.MouseEvent(type, { bubbles: true })); });
}

/** Wait real wall-clock time inside act(), so any state update the timer
 *  produces is flushed before the assertion reads the DOM. */
async function wait(ms) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

/** Tooltip's pointer handlers sit on the wrapper span it renders, not on the
 *  child -- and mouseenter/mouseleave do not bubble in any case. */
function trigger(container) {
  return container.firstElementChild;
}

test('the tooltip does not reveal before --delay-open elapses', async () => {
  const container = mount(<Tooltip content="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(delayOpen - MARGIN);
  assert.ok(!container.textContent.includes('Details'), 'still hidden partway through the delay');
  assert.equal(container.querySelector('[role="tooltip"]'), null);
});

test('the tooltip reveals once --delay-open has elapsed', async () => {
  const container = mount(<Tooltip content="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(delayOpen + MARGIN);
  assert.ok(container.textContent.includes('Details'), 'revealed after the delay');
  assert.notEqual(container.querySelector('[role="tooltip"]'), null, 'and it is a real tooltip role, not stray text');
});

test('crossing out before the delay cancels the reveal rather than queueing it', async () => {
  const container = mount(<Tooltip content="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(Math.floor(delayOpen / 2));
  assert.ok(!container.textContent.includes('Details'), 'precondition: the reveal is still pending, not already done');

  hover(trigger(container), 'mouseout');
  /* Wait past every boundary that could still fire: the original open timer's
   * remaining time, a full second open delay if one had been queued, and the
   * close delay on top. Nothing may reveal in any of that window. This is the
   * exact flash-on-crossing defect plan 7a fixed -- without the single-timer
   * clear, the pending reveal fires after the pointer has already left. */
  await wait(delayOpen + delayClose + MARGIN);
  assert.ok(!container.textContent.includes('Details'), 'the pending reveal was cancelled, not queued');
  assert.equal(container.querySelector('[role="tooltip"]'), null);
});

test('re-entering during the close grace period keeps the tooltip up rather than letting the queued close win', async () => {
  /* The other half of the single-timer rule, and the half the source comment
   * calls out by name: "leaving and re-entering inside the close grace period
   * must cancel the pending close, not queue an open behind it." */
  const container = mount(<Tooltip content="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(delayOpen + MARGIN);
  assert.ok(container.textContent.includes('Details'), 'precondition: shown');

  hover(trigger(container), 'mouseout');
  await wait(Math.floor(delayClose / 2));
  hover(trigger(container), 'mouseover');
  /* The re-entry cleared the pending close and scheduled setShow(true), which
   * is a no-op on an already-true state. Wait past both boundaries: the close
   * must never land. */
  await wait(delayOpen + delayClose + MARGIN);
  assert.ok(container.textContent.includes('Details'), 'the pending close was cancelled by the re-entry');
});

test('unmounting while a reveal is pending clears the timer instead of firing into a dead component', async () => {
  /* "Does not throw" would be close to vacuous here: React 18 logs a warning
   * rather than throwing when a setState lands on an unmounted component, so a
   * Tooltip with no cleanup effect at all would pass that assertion. This
   * instruments the real timer instead -- it records the id Tooltip schedules
   * on mouseover and asserts that exact id is passed to clearTimeout during
   * unmount, which is the useEffect cleanup and nothing else. */
  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  const scheduled = [];
  const cleared = [];
  globalThis.setTimeout = (...args) => {
    const id = realSetTimeout(...args);
    scheduled.push(id);
    return id;
  };
  globalThis.clearTimeout = (id) => { cleared.push(id); return realClearTimeout(id); };

  try {
    const container = mount(<Tooltip content="Details"><button type="button">Hover</button></Tooltip>);
    scheduled.length = 0;              // ignore anything mounting itself scheduled
    hover(trigger(container), 'mouseover');
    assert.ok(scheduled.length > 0, 'precondition: the pointer scheduled a reveal timer');
    const pending = scheduled[scheduled.length - 1];

    cleanup();
    assert.ok(
      cleared.includes(pending),
      'the pending reveal timer was cleared on unmount, not left to fire',
    );
  } finally {
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
  }

  // And nothing fires afterwards either.
  await new Promise((r) => realSetTimeout(r, delayOpen + MARGIN));
});
