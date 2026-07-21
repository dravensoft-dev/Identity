import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveActivityFeedRows } from '../primitives/activity-feed/activity-feed';
import type { ActivityItem } from '../primitives/activity-feed/activity-feed';
import { activityFeedStyles } from '../primitives/activity-feed/activity-feed.variants';

test('the dot carries the tone as a colour, never as a fill', () => {
  for (const tone of ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'] as const) {
    const dot = activityFeedStyles({ tone }).dot();
    assert.match(dot, /bg-current/);
    assert.doesNotMatch(dot, /\bbg-(error|success|warning|info|primary|secondary)/);
  }
});

test('the seven tones resolve to seven distinct dot classes', () => {
  const tones = ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'] as const;
  const classes = tones.map((tone) => activityFeedStyles({ tone }).dot());
  assert.equal(new Set(classes).size, tones.length, `expected ${tones.length} distinct dot classes, got ${JSON.stringify(classes)}`);
});

test('divided="true" carries the top border, divided="false" carries none', () => {
  assert.match(activityFeedStyles({ divided: true }).item(), /border-t-\[length:var\(--bw\)\]/);
  assert.match(activityFeedStyles({ divided: false }).item(), /border-t-0/);
});

/* Resolution D of task 25's brief: the brief's own `row(item, first)` was a
 * method re-invoked from the template on every change-detection pass, which
 * re-resolves tailwind-variants for every row every time. `resolveActivityFeedRows`
 * is the pure function `arena-activity-feed`'s `rows` computed calls instead,
 * so it can be pinned directly against real item arrays with no DOM and no
 * Angular runtime involved -- this is the resolved, composed behaviour
 * (which row gets which class), not a restatement of the manifest string. */
test('the first row carries no divider and every later row does, resolved from a real items array', () => {
  const items: ActivityItem[] = [
    { actor: 'Marta', action: 'deployed', tone: 'success' },
    { actor: 'Ivan', action: 'opened an incident', tone: 'danger' },
    { actor: 'Rae', action: 'approved the rollback' },
  ];
  const rows = resolveActivityFeedRows(items);
  assert.equal(rows.length, 3);
  assert.match(rows[0].itemClass, /border-t-0/, 'the first row must not carry the divider');
  assert.doesNotMatch(rows[0].itemClass, /border-t-\[length:var\(--bw\)\]/);
  for (const row of rows.slice(1)) {
    assert.match(row.itemClass, /border-t-\[length:var\(--bw\)\]/, 'every row after the first must carry the divider');
    assert.doesNotMatch(row.itemClass, /border-t-0/);
  }
});

test('an item with no tone resolves to the accent dot, the same default the manifest declares', () => {
  const rows = resolveActivityFeedRows([{ actor: 'Rae', action: 'approved the rollback' }]);
  assert.equal(rows[0].dotClass, activityFeedStyles({ tone: 'accent' }).dot());
});

test('resolveActivityFeedRows carries each item through unchanged, for the template to read', () => {
  const items: ActivityItem[] = [{ id: 'evt-1', actor: 'Marta', action: 'deployed', target: 'billing@2.4.1', time: '2m', tone: 'success' }];
  const rows = resolveActivityFeedRows(items);
  assert.equal(rows[0].item, items[0]);
});
