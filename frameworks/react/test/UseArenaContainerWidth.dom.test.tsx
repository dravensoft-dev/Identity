import test from 'node:test';
import assert from 'node:assert/strict';
import React, { useRef } from 'react';
import { mount, cleanup } from './Harness.tsx';
import { forgetArenaBreakpoints, arenaReadBreakpoint, useArenaContainerWidth } from '../UseArenaContainerWidth.ts';

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
  forgetArenaBreakpoints();
  root().removeProperty('--bp-lg');

  const first = captureWarn(() => arenaReadBreakpoint('lg'));
  assert.ok(Number.isNaN(first.result), `expected NaN for an absent token, got ${first.result}`);
  assert.equal(1 < first.result, false, 'a NaN breakpoint must never select the narrow branch');
  assert.equal(first.messages.length, 1, 'an unresolved breakpoint must say so: every comparison against NaN is false, so a component stays wide on a phone');
  assert.match(first.messages.join('\n'), /--bp-lg/);

  const again = captureWarn(() => arenaReadBreakpoint('lg'));
  assert.deepEqual(again.messages, [], 'the warning is once per name, not once per read');
});

test('a failed read is not cached -- a later call for the same name recovers the real value', () => {
  root().setProperty('--bp-lg', '1024px');
  assert.equal(arenaReadBreakpoint('lg'), 1024, 'a failed read was latched, so the token could never take effect');
});

test('a resolved breakpoint is read once per name -- a later document value does not change what was cached', () => {
  root().setProperty('--bp-lg', '1px');
  assert.equal(arenaReadBreakpoint('lg'), 1024, 'the cached value must win; breakpoints are constants for the life of the document');
});

test('useArenaContainerWidth measures the element it is handed, not one of its own', () => {
  let handed: React.RefObject<HTMLDivElement> | null = null;
  function Probe() {
    const outer = useRef<HTMLDivElement>(null);
    const [ref] = useArenaContainerWidth<HTMLDivElement>(outer);
    handed = ref;
    return <div ref={outer} data-role="outer"><div data-role="inner" /></div>;
  }
  const container = mount(<Probe />);
  assert.equal(
    handed!.current,
    container.querySelector('[data-role="outer"]'),
    'a caller who already holds the box to measure must not be forced to move its own ref',
  );
  cleanup();
});

test('useArenaContainerWidth still owns a ref when it is handed none', () => {
  let own: React.RefObject<HTMLDivElement> | null = null;
  function Probe() {
    const [ref] = useArenaContainerWidth<HTMLDivElement>();
    own = ref;
    return <div ref={ref} data-role="own" />;
  }
  const container = mount(<Probe />);
  assert.equal(own!.current, container.querySelector('[data-role="own"]'));
  cleanup();
});
