import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENT, ElementRef, Injector, runInInjectionContext } from '@angular/core';
import { arenaContainerWidth, forgetArenaBreakpoints, readBreakpoint } from '../../../ContainerSize';
import { arenaPageHeadStyles } from './ArenaPageHead.variants';

function injectorWith(properties: Record<string, string>): Injector {
  const doc = {
    documentElement: {},
    defaultView: {
      getComputedStyle: () => ({ getPropertyValue: (name: string) => properties[name] ?? '' }),
    },
  } as unknown as Document;
  return Injector.create({ providers: [{ provide: DOCUMENT, useValue: doc }] });
}

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

test('readBreakpoint reads --bp-<name> off the document root and returns it as a number of px', () => {
  forgetArenaBreakpoints();
  const value = runInInjectionContext(injectorWith({ '--bp-md': ' 768px ' }), () => readBreakpoint('md'));
  assert.equal(value, 768);
});

test('an absent breakpoint token is NaN, and every comparison against NaN is false -- which lands on the wide layout', () => {
  const { result, messages } = captureWarn(() => runInInjectionContext(injectorWith({}), () => readBreakpoint('lg')));
  assert.ok(Number.isNaN(result), `expected NaN for an absent token, got ${result}`);
  assert.equal(1 < result, false, 'a NaN breakpoint must never select the narrow branch');
  assert.equal(9999 < result, false, 'a NaN breakpoint must never select the narrow branch');

  assert.equal(messages.length, 1, 'an unresolved breakpoint must say so: NaN is silent, and every comparison against it is false');
  assert.match(messages[0], /--bp-lg/);
  const again = captureWarn(() => runInInjectionContext(injectorWith({}), () => readBreakpoint('lg')));
  assert.deepEqual(again.messages, [], 'the warning is once per name, not once per read');
});

test('a failed read is not cached -- a later call for the same name that succeeds returns the real value, not a pinned NaN', () => {
  const first = runInInjectionContext(injectorWith({}), () => readBreakpoint('lg'));
  assert.ok(Number.isNaN(first), `expected NaN for the failed first read, got ${first}`);
  const second = runInInjectionContext(injectorWith({ '--bp-lg': '1024px' }), () => readBreakpoint('lg'));
  assert.equal(second, 1024, 'a failed read must not be cached -- the next call must re-read and recover the real value');
});

test('a breakpoint is read once per name -- a later document with a different value does not change what was cached', () => {
  const second = runInInjectionContext(injectorWith({ '--bp-md': '1px' }), () => readBreakpoint('md'));
  assert.equal(second, 768, 'the cached value must win; breakpoints are constants for the life of the document');
});

test('the injection-context contract holds on a cache hit too, not only on the first call for a name', () => {
  runInInjectionContext(injectorWith({ '--bp-md': '768px' }), () => readBreakpoint('md'));
  assert.throws(
    () => readBreakpoint('md'),
    /NG0203|injection context/i,
    'a cached breakpoint must still require an injection context -- otherwise the contract depends on call order',
  );
});

test('arenaContainerWidth requires an injection context whether or not it is handed an element to measure', () => {

  assert.throws(() => arenaContainerWidth(), /NG0203|injection context/i);
  const elsewhere = new ElementRef(null as unknown as HTMLElement);
  assert.throws(
    () => arenaContainerWidth(elsewhere),
    /NG0203|injection context/i,
    'the element is optional and the context is not: DestroyRef disconnects the observer and '
    + 'afterNextRender decides when there is a box to measure, and neither is reachable outside one',
  );
});
