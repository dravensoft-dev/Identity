/* This suite needs a real DOM but no TestBed: what it proves is that a FAILING node assertion
 * stays the size of a sentence. It deliberately does not compare that against node:assert's own
 * diff -- building the diff once per run is the cost this file exists to avoid. DOUBTS.md
 * carries the measurement instead. */

import { ensureDom } from './TestbedEnv';
ensureDom();

import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoNode, assertNotSameNode, assertSameNode, describeNode } from './NodeAssert';

const LONGEST_TOLERABLE_MESSAGE = 400;

function mount(): { first: HTMLElement; second: HTMLElement; wrapper: HTMLElement } {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = '<div role="tablist">'
    + '<button id="tab-overview" role="tab">Overview</button>'
    + '<button id="tab-deploy" role="tab">Deployments</button>'
    + '</div><section role="tabpanel">a panel holding a good deal of text</section>';
  document.body.append(wrapper);
  return {
    first: wrapper.querySelector('#tab-overview') as HTMLElement,
    second: wrapper.querySelector('#tab-deploy') as HTMLElement,
    wrapper,
  };
}

function failureOf(run: () => void): string {
  try {
    run();
  } catch (error) {
    return (error as Error).message;
  }
  return assert.fail('the assertion was expected to fail and did not');
}

test('a node that is the expected one passes, and nothing is rendered', () => {
  const { first, wrapper } = mount();
  try {
    assertSameNode(first, first, 'same node');
    assertNotSameNode(first, document.body, 'different nodes');
    assertNoNode(wrapper.querySelector('input'), 'no input was rendered');
  } finally {
    wrapper.remove();
  }
});

test('a failure over connected nodes names both and stays the size of a sentence', () => {
  const { first, second, wrapper } = mount();
  try {
    const message = failureOf(() => assertSameNode(first, second, 'ArrowRight did not move focus'));
    assert.ok(message.length < LONGEST_TOLERABLE_MESSAGE,
      `the failure message ran to ${message.length} characters, which is the hazard this helper exists to remove`);
    assert.match(message, /ArrowRight did not move focus/);
    assert.match(message, /expected: <button#tab-deploy role="tab">Deployments/);
    assert.match(message, /actual: {3}<button#tab-overview role="tab">Overview/);
  } finally {
    wrapper.remove();
  }
});

test('a failure against document.body stays bounded, which is the case that ran the suite out of memory', () => {
  const { first, wrapper } = mount();
  try {
    const message = failureOf(() => assertSameNode(document.body, first, 'focus never left the body'));
    assert.ok(message.length < LONGEST_TOLERABLE_MESSAGE,
      `the failure message ran to ${message.length} characters`);
    assert.match(message, /actual: {3}<body>/);
  } finally {
    wrapper.remove();
  }
});

test('assertNoNode reports what it found rather than diffing it against null', () => {
  const { wrapper } = mount();
  try {
    const message = failureOf(() => assertNoNode(wrapper.querySelector('button'), 'the panel drew a button'));
    assert.ok(message.length < LONGEST_TOLERABLE_MESSAGE);
    assert.match(message, /the panel drew a button/);
    assert.match(message, /found: <button#tab-overview role="tab">Overview/);
  } finally {
    wrapper.remove();
  }
});

test('assertNotSameNode fails when the two are one, and names it once', () => {
  const { first, wrapper } = mount();
  try {
    const message = failureOf(() => assertNotSameNode(first, first, 'focus must have moved'));
    assert.ok(message.length < LONGEST_TOLERABLE_MESSAGE);
    assert.match(message, /both are: <button#tab-overview/);
  } finally {
    wrapper.remove();
  }
});

test('each helper carries a default message, so a bare call still reports something', () => {
  const { first, second, wrapper } = mount();
  try {
    assert.match(failureOf(() => assertSameNode(first, second)), /the node is not the expected one/);
    assert.match(failureOf(() => assertNotSameNode(first, first)), /the two nodes are the same one/);
    assert.match(failureOf(() => assertNoNode(first)), /a node was rendered where none should be/);
  } finally {
    wrapper.remove();
  }
});

test('describeNode renders the absent, the non-element and the long-texted alike', () => {
  const { wrapper } = mount();
  try {
    assert.equal(describeNode(null), 'null');
    assert.equal(describeNode(undefined), 'undefined');
    assert.equal(describeNode('a string'), 'a string, not an element');
    assert.equal(describeNode(42), 'a number, not an element');

    const panel = wrapper.querySelector('[role="tabpanel"]') as HTMLElement;
    assert.equal(describeNode(panel), '<section role="tabpanel">a panel holding a good deal of text');

    const wordy = document.createElement('p');
    wordy.textContent = 'x'.repeat(200);
    assert.equal(describeNode(wordy), `<p>${'x'.repeat(40)}`, 'the text must be clipped, or the message grows with the tree again');
  } finally {
    wrapper.remove();
  }
});
