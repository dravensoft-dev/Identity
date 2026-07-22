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
 * A KNOWN, PRE-EXISTING WART, recorded so the next reader does not think they
 * caused it: on a loaded `bun test frameworks/react/test-dom/` run this suite
 * intermittently prints "An update to Tooltip inside a test was not wrapped in
 * act(...)". It is a warning, never a failure -- the run stays green. It is a
 * real-timer race between a pending Tooltip timer and an act() boundary, it
 * does not reproduce when the file is run on its own, and it was measured at
 * comparable rates before and after this file was last revised (5 of 15 runs
 * against the previous version of these tests, 3 of 15 against this one), so it
 * is a property of the real-timer design and not of any one test. Fixing it
 * properly means retiring real timers here, which the paragraph above refuses
 * for a reason. Do not chase it by widening MARGIN.
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

/** Raw wall-clock sleep, with no act() scope of its own. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait real wall-clock time inside act(), so any state update the timer
 *  produces is flushed before the assertion reads the DOM. */
async function wait(ms) {
  await act(async () => { await sleep(ms); });
}

/** Record every timer id scheduled and cleared while `body` runs, then restore
 *  the real functions. The unmount test below uses the same instrumentation;
 *  this hoists it so two tests share one idiom.
 *  @returns {Promise<{scheduled: number[], cleared: number[]}>} */
async function recordingTimers(body) {
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
    await body({ scheduled, cleared });
  } finally {
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
  }
  return { scheduled, cleared };
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

test('re-entering during the close grace period clears the pending close timer rather than queueing an open behind it', async () => {
  /* The other half of the single-timer rule, and the half the source comment
   * calls out by name: "leaving and re-entering inside the close grace period
   * must cancel the pending close, not queue an open behind it."
   *
   * WHY THIS TEST INSTRUMENTS THE TIMER INSTEAD OF WATCHING THE DOM. It used to
   * wait past every boundary and assert the tooltip was visible, and that was
   * blind to the one mutation it exists to catch. Drop the clearTimeout from
   * schedule() and BOTH timers survive: the orphaned close fires at
   * --delay-close, the re-entry's own open fires --delay-open after the
   * re-entry, and by the end of a long wait the tooltip is shown again either
   * way. That assertion proved "eventually re-shown", never "the pending close
   * was cancelled" -- the two differ only in the window between those
   * boundaries.
   *
   * Sampling the DOM mid-window is the obvious repair and it does work, but it
   * buys the proof with a timing margin: the assertion has to land between
   * --delay-close and (re-entry + --delay-open), about 170ms of slack either
   * side, on a suite whose waits already overrun under a loaded directory run.
   * Tightening that further was not worth it when an exact answer was available.
   *
   * ONE VARIANT IS A TRAP AND IS RECORDED SO IT IS NOT RE-ATTEMPTED: reading the
   * DOM from INSIDE a single act() scope, to avoid splitting the window across
   * two. That silently stops proving anything. React's async act() defers the
   * commit to the end of the scope, so the read returns the PRE-update DOM, and
   * the mutation below passes again -- verified, not assumed.
   *
   * So the cancellation is asserted where it actually happens: on the timer.
   * `mouseout` schedules exactly one close timer; the re-entry must pass THAT id
   * to clearTimeout. No timing margin, no deferred-commit hazard, and it is the
   * same instrumentation the unmount test below already relies on. */
  const container = mount(<Tooltip content="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(delayOpen + MARGIN);
  assert.ok(container.textContent.includes('Details'), 'precondition: shown');

  await recordingTimers(async ({ scheduled, cleared }) => {
    hover(trigger(container), 'mouseout');
    assert.ok(scheduled.length > 0, 'precondition: leaving scheduled a close timer');
    const closeTimer = scheduled[scheduled.length - 1];

    await wait(Math.floor(delayClose / 2));
    assert.ok(
      !cleared.includes(closeTimer),
      'precondition: the close is still pending -- the re-entry happens inside the grace period, not after it',
    );

    hover(trigger(container), 'mouseover');
    assert.ok(
      cleared.includes(closeTimer),
      'the re-entry cleared the pending close timer -- the close never fires, rather than firing and being undone by a queued open',
    );
  });

  /* And the observable consequence: drain past every boundary and the tooltip
   * is still up. This is the weaker claim the test used to make on its own --
   * it cannot tell a cancelled close from one that fired and was undone -- but
   * "briefly visible and then lost" would be its own defect, so it is kept. */
  await wait(delayOpen + delayClose + MARGIN);
  assert.ok(container.textContent.includes('Details'), 'and it is still up after every boundary has passed');
});

test('unmounting while a reveal is pending clears the timer instead of firing into a dead component', async () => {
  /* "Does not throw" would be close to vacuous here: React 18 logs a warning
   * rather than throwing when a setState lands on an unmounted component, so a
   * Tooltip with no cleanup effect at all would pass that assertion. This
   * instruments the real timer instead -- it records the id Tooltip schedules
   * on mouseover and asserts that exact id is passed to clearTimeout during
   * unmount, which is the useEffect cleanup and nothing else. */
  await recordingTimers(async ({ scheduled, cleared }) => {
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
  });

  // And nothing fires afterwards either. recordingTimers has already restored
  // the real setTimeout, so this is an uninstrumented wall-clock wait.
  await sleep(delayOpen + MARGIN);
});
