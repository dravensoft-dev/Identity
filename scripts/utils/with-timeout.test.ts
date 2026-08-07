/* The deadline fires with its own message, a promise that settles first wins, and the timer is
 * cleared either way. That last one is the claim the third copy failed: it left the timer
 * pending and reached for unref to stop the leak from holding the process open, which trades a
 * hang for a silent exit. Cleared and not unreffed is what these three assert together. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from './with-timeout.ts';

const after = <T>(ms: number, value: T) => new Promise<T>((r) => { setTimeout(() => r(value), ms); });

test('a promise that settles inside the deadline wins, and its value comes back', async () => {
  assert.equal(await withTimeout(after(5, 'measured'), 500, 'too slow'), 'measured');
});

test('a promise that does not settle in time rejects with the message the caller gave', async () => {
  await assert.rejects(() => withTimeout(after(500, 'never read'), 5, 'the page never answered'),
    /the page never answered/);
});

test('the timer is cleared when the race is won, so nothing is left holding the loop open', async () => {
  const pending = new Set<ReturnType<typeof setTimeout>>();
  const realSet = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  globalThis.setTimeout = ((fn: () => void, ms: number) => {
    const id = realSet(fn, ms);
    pending.add(id);
    return id;
  }) as typeof globalThis.setTimeout;
  globalThis.clearTimeout = ((id: ReturnType<typeof setTimeout>) => { pending.delete(id); realClear(id); }) as typeof globalThis.clearTimeout;
  try {
    await withTimeout(Promise.resolve('now'), 60_000, 'unused');
    assert.equal(pending.size, 0,
      'the copy that skipped clearTimeout left a sixty-second timer behind per call, and reached '
      + 'for unref rather than clearing it, which lets the process exit on a real hang instead');
  } finally {
    globalThis.setTimeout = realSet;
    globalThis.clearTimeout = realClear;
  }
});

test('a rejection from the raced promise is the one that surfaces, not the deadline', async () => {
  await assert.rejects(() => withTimeout(Promise.reject(new Error('the browser died')), 500, 'too slow'),
    /the browser died/);
});
