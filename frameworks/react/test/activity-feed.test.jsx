import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ActivityFeed } from '../components/display/ActivityFeed.jsx';

const ITEMS = [
  { id: 1, actor: 'ana@', action: 'approved the release', target: 'build #4821', time: '2h ago' },
  { id: 2, actor: 'diego@', action: 'opened incident', target: 'checkout latency', time: '3h ago', tone: 'danger' },
];

test('the feed is a list, not a stack of divs', () => {
  const html = renderToStaticMarkup(<ActivityFeed items={ITEMS} />);
  assert.match(html, /^<ul/);
  assert.equal(html.match(/<li/g).length, 2);
});

test('each part of the grammar takes its own ink', () => {
  const html = renderToStaticMarkup(<ActivityFeed items={[ITEMS[0]]} />);
  assert.match(html, /ana@/);
  assert.match(html, /approved the release/);
  assert.match(html, /var\(--gold\)/);   // the target, in mono gold
  assert.match(html, /var\(--mute\)/);   // the time, pushed right
});

test('tone drives the dot and defaults to accent', () => {
  assert.match(renderToStaticMarkup(<ActivityFeed items={[ITEMS[0]]} />), /var\(--crimson\)/);
  assert.match(renderToStaticMarkup(<ActivityFeed items={[ITEMS[1]]} />), /var\(--danger\)/);
});

test('an unknown tone falls back to accent rather than rendering nothing', () => {
  const html = renderToStaticMarkup(<ActivityFeed items={[{ id: 3, actor: 'a', action: 'b', tone: 'chartreuse' }]} />);
  assert.match(html, /var\(--crimson\)/);
});

test('renderItem replaces the row entirely', () => {
  const html = renderToStaticMarkup(
    <ActivityFeed items={ITEMS} renderItem={(i) => <span>custom {i.id}</span>} />);
  assert.match(html, /custom 1/);
  assert.match(html, /custom 2/);
  assert.doesNotMatch(html, /approved the release/);
});

test('an item missing a target or a time still renders', () => {
  const html = renderToStaticMarkup(<ActivityFeed items={[{ id: 4, actor: 'CI', action: 'restarted' }]} />);
  assert.match(html, /CI/);
  assert.match(html, /restarted/);
});
