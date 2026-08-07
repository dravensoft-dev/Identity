/* The three answers, and the reason the middle one is not `?? ''`: a pattern that has lost a
 * capture hands back an empty string that reads as a real one, and the parser three functions
 * downstream is where it finally shows. The message names the group and what did match, so a
 * regex edit fails at the read. A match that never happened is its own message, because the
 * caller with nothing better to say is exactly who this is for. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { captured } from './captures.ts';

test('a group that captured comes back, and the first one is the default', () => {
  const m = /(\w+)=(\w+)/.exec('width=320');
  assert.equal(captured(m), 'width');
  assert.equal(captured(m, 2), '320');
});

test('a group the pattern lost throws, naming the group and what did match', () => {
  const m = /(a)|(b)/.exec('a');
  assert.throws(() => captured(m, 2), (err: Error) =>
    err.message.includes('group 2') && err.message.includes('"a"'),
    'the alternative at every one of these sites is ?? \'\', which is an empty string nobody sees');
});

test('a match that never happened is its own message rather than the same one', () => {
  assert.throws(() => captured(null), /never happened/);
});
