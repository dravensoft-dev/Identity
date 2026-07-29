/* `states.busy` is why this binding has cases at all: aria-busy is true DURING an
 * update and false once it settles, so no single render decides it and both have
 * to be mounted. `roles.article` is QUANTIFIED -- its subject must be an array
 * and every element is checked, because a feed whose third row lost its role is
 * unmet however correct the first is. PageUp/PageDown are asserted by acting on
 * the tree; the verdicts below are what those assertions reached. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { assertPatternCases, REACT_COMPONENTS } from '../../../test/AssertPattern.jsx';
import { ActivityFeed } from './ActivityFeed.jsx';

afterEach(cleanup);

const BINDING = join(REACT_COMPONENTS, 'display/activity-feed/ActivityFeed.behaviour.json');

const LABEL = 'Deployment activity';
const ITEMS = [
  { id: '1', actor: 'Ada', action: 'deployed', target: 'checkout-api', time: '09:12', tone: 'success' },
  { id: '2', actor: 'Grace', action: 'rolled back', target: 'billing-worker', time: '09:40', tone: 'danger' },
  { id: '3', actor: 'Alan', action: 'approved', target: 'release-482', time: '10:03' },
];

function press(el, key) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { el.dispatchEvent(event); });
  return event;
}

function render(busy) {
  const root = mount(<ActivityFeed label={LABEL} items={ITEMS} busy={busy} />);
  const feed = root.querySelector('[role="feed"]');
  const articles = [...root.querySelectorAll('[role="article"]')];
  return { root, feed, articles };
}

test('ActivityFeed meets the feed pattern in both of its declared states', () => {
  assertPatternCases({
    bindingPath: BINDING,
    cases: {

      settled: () => {
        const { root, feed, articles } = render(false);
        assert.equal(articles.length, ITEMS.length, 'one article per event');
        assert.equal(feed.getAttribute('aria-busy'), 'false',
          'a settled feed must say so rather than omit the state, or a reader cannot tell it settled');

        articles.forEach((el, i) => {
          assert.equal(el.getAttribute('aria-posinset'), String(i + 1), `article ${i} is misnumbered`);
          assert.equal(el.getAttribute('aria-setsize'), String(ITEMS.length),
            'every article must report the same total');
          assert.equal(el.getAttribute('tabindex'), '0', 'an article a user cannot reach cannot be navigated to');
        });

        act(() => { articles[0].focus(); });
        const down = press(articles[0], 'PageDown');
        assert.equal(document.activeElement, articles[1], 'PageDown did not move to the next article');
        assert.equal(down.defaultPrevented, true, 'PageDown was not claimed, so the page scrolls as well');

        press(articles[1], 'PageDown');
        assert.equal(document.activeElement, articles[2], 'PageDown did not keep advancing');
        press(articles[2], 'PageDown');
        assert.equal(document.activeElement, articles[2],
          'PageDown past the last article moved focus somewhere -- it must stop rather than wrap');

        const up = press(articles[2], 'PageUp');
        assert.equal(document.activeElement, articles[1], 'PageUp did not move to the previous article');
        assert.equal(up.defaultPrevented, true, 'PageUp was not claimed');
        press(articles[1], 'PageUp');
        press(articles[0], 'PageUp');
        assert.equal(document.activeElement, articles[0],
          'PageUp past the first article moved focus somewhere -- it must stop rather than wrap');

        return {
          root,
          subjects: { default: feed, 'roles.article': articles },
          behavioural: { 'states.posinset': true, 'states.busy': true, 'keyboard.PageDown': true, 'keyboard.PageUp': true },
        };
      },

      busy: () => {
        const { root, feed, articles } = render(true);
        assert.equal(feed.getAttribute('aria-busy'), 'true',
          'a feed mid-update must announce it, or a reader hears every intermediate state');
        return {
          root,
          subjects: { default: feed, 'roles.article': articles },
          behavioural: { 'states.posinset': true, 'states.busy': true, 'keyboard.PageDown': true, 'keyboard.PageUp': true },
        };
      },
    },
  });
});
