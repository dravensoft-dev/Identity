import test from 'node:test';
import assert from 'node:assert/strict';
import { readBreakpoint } from '../UseContainerWidth.ts';

function captureWarn<T>(fn: () => T): { result: T; messages: string[] } {
  const messages: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => { messages.push(args.map(String).join(' ')); };
  try {
    return { result: fn(), messages };
  } finally {
    console.warn = original;
  }
}

const root = () => document.documentElement.style;

test('an unresolved breakpoint says so once, rather than returning a silent NaN', () => {
  root().removeProperty('--bp-lg');

  const first = captureWarn(() => readBreakpoint('lg'));
  assert.ok(Number.isNaN(first.result), `expected NaN for an absent token, got ${first.result}`);
  assert.equal(1 < first.result, false, 'a NaN breakpoint must never select the narrow branch');
  assert.equal(first.messages.length, 1, 'an unresolved breakpoint must say so: every comparison against NaN is false, so a component stays wide on a phone');
  assert.match(first.messages.join('\n'), /--bp-lg/);

  const again = captureWarn(() => readBreakpoint('lg'));
  assert.deepEqual(again.messages, [], 'the warning is once per name, not once per read');
});

test('a failed read is not cached -- a later call for the same name recovers the real value', () => {
  root().setProperty('--bp-lg', '1024px');
  assert.equal(readBreakpoint('lg'), 1024, 'a failed read was latched, so the token could never take effect');
});

test('a resolved breakpoint is read once per name -- a later document value does not change what was cached', () => {
  root().setProperty('--bp-lg', '1px');
  assert.equal(readBreakpoint('lg'), 1024, 'the cached value must win; breakpoints are constants for the life of the document');
});
