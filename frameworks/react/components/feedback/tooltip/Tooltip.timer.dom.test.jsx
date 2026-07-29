import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { Tooltip } from './Tooltip.jsx';
import { delayOpen, delayClose } from '../../../Tokens.generated.js';

afterEach(cleanup);

const MARGIN = 120;

function hover(el, type) {
  act(() => { el.dispatchEvent(new window.MouseEvent(type, { bubbles: true })); });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wait(ms) {
  await act(async () => { await sleep(ms); });
}

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

function trigger(container) {
  return container.firstElementChild;
}

test('the tooltip does not reveal before --delay-open elapses', async () => {
  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(delayOpen - MARGIN);
  assert.ok(!container.textContent.includes('Details'), 'still hidden partway through the delay');
  assert.equal(container.querySelector('[role="tooltip"]'), null);
});

test('the tooltip reveals once --delay-open has elapsed', async () => {
  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(delayOpen + MARGIN);
  assert.ok(container.textContent.includes('Details'), 'revealed after the delay');
  assert.notEqual(container.querySelector('[role="tooltip"]'), null, 'and it is a real tooltip role, not stray text');
});

test('crossing out before the delay cancels the reveal rather than queueing it', async () => {
  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  hover(trigger(container), 'mouseover');
  await wait(Math.floor(delayOpen / 2));
  assert.ok(!container.textContent.includes('Details'), 'precondition: the reveal is still pending, not already done');

  hover(trigger(container), 'mouseout');

  await wait(delayOpen + delayClose + MARGIN);
  assert.ok(!container.textContent.includes('Details'), 'the pending reveal was cancelled, not queued');
  assert.equal(container.querySelector('[role="tooltip"]'), null);
});

test('re-entering during the close grace period clears the pending close timer rather than queueing an open behind it', async () => {

  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
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

  await wait(delayOpen + delayClose + MARGIN);
  assert.ok(container.textContent.includes('Details'), 'and it is still up after every boundary has passed');
});

test('unmounting while a reveal is pending clears the timer instead of firing into a dead component', async () => {

  await recordingTimers(async ({ scheduled, cleared }) => {
    const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
    scheduled.length = 0;
    hover(trigger(container), 'mouseover');
    assert.ok(scheduled.length > 0, 'precondition: the pointer scheduled a reveal timer');
    const pending = scheduled[scheduled.length - 1];

    cleanup();
    assert.ok(
      cleared.includes(pending),
      'the pending reveal timer was cleared on unmount, not left to fire',
    );
  });

  await sleep(delayOpen + MARGIN);
});
