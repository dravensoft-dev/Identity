import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENT, ElementRef, Injector, runInInjectionContext } from '@angular/core';
import { containerWidth, forgetBreakpoints, readBreakpoint } from '../../../ContainerSize';
import { pageHeadStyles } from './PageHead.variants';

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

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(pageHeadStyles().root(), /(?:^|\s)flex(?=\s|$)/);
});

test('the default is the WIDE layout -- a page head renders as a row before anything has been measured', () => {
  const wide = pageHeadStyles();
  assert.match(wide.root(), /\bflex-row\b/);
  assert.match(wide.root(), /\bitems-start\b/);
  assert.match(wide.actions(), /\bw-auto\b/);
});

test('the actions row wraps at every width, because the slot projects one element per control', () => {

  for (const styles of [pageHeadStyles(), pageHeadStyles({ narrow: true })]) {
    assert.match(
      styles.actions(),
      /\bflex-wrap\b/,
      'three buttons at 390px overflow the page without it. The row wraps its own children, so '
      + 'the prompt asks for a sibling per control: a single wrapper is one flex item and never wraps',
    );
  }
});

test('below the breakpoint the row stacks and the actions go full width', () => {
  const narrow = pageHeadStyles({ narrow: true });
  assert.match(narrow.root(), /\bflex-col\b/);
  assert.match(narrow.root(), /\bitems-stretch\b/);
  assert.match(narrow.actions(), /\bw-full\b/);
});

test('the two branches are mutually exclusive -- neither leaks the other\'s direction, alignment or width', () => {
  const wide = pageHeadStyles({ narrow: false });
  const narrow = pageHeadStyles({ narrow: true });
  assert.doesNotMatch(wide.root(), /\bflex-col\b/);
  assert.doesNotMatch(wide.root(), /\bitems-stretch\b/);
  assert.doesNotMatch(wide.actions(), /\bw-full\b/);
  assert.doesNotMatch(narrow.root(), /\bflex-row\b/);
  assert.doesNotMatch(narrow.root(), /\bitems-start\b/);
  assert.doesNotMatch(narrow.actions(), /\bw-auto\b/);
});

test('align="center", wide layout, centers the actions block against the title', () => {
  const centered = pageHeadStyles({ narrow: false, align: 'center' });
  assert.match(centered.root(), /\bitems-center\b/);
  assert.doesNotMatch(centered.root(), /\bitems-start\b/);
});

test('align="start" (the default), wide layout, keeps the actions block top-aligned', () => {
  const started = pageHeadStyles({ narrow: false, align: 'start' });
  assert.match(started.root(), /\bitems-start\b/);
  assert.doesNotMatch(started.root(), /\bitems-center\b/);
});

test('narrow always stretches, regardless of align', () => {
  const narrowCenter = pageHeadStyles({ narrow: true, align: 'center' });
  assert.match(narrowCenter.root(), /\bitems-stretch\b/);
  assert.doesNotMatch(narrowCenter.root(), /\bitems-center\b/);
  const narrowStart = pageHeadStyles({ narrow: true, align: 'start' });
  assert.match(narrowStart.root(), /\bitems-stretch\b/);
  assert.doesNotMatch(narrowStart.root(), /\bitems-start\b/);
});

test('the title is a display-weight heading with its own margin reset', () => {
  const title = pageHeadStyles().title();
  assert.match(title, /\bfont-display\b/);
  assert.match(title, /\bfont-extrabold\b/);
  assert.match(title, /\btext-h1\b/);
  assert.match(title, /\bm-0\b/);
});

test('the subtitle carries only a top margin -- the paragraph\'s UA bottom margin is reset', () => {
  const subtitle = pageHeadStyles().subtitle();
  assert.match(subtitle, /\bmt-0\.5\b/);
  assert.match(subtitle, /\bmb-0\b/);
});

test('a page head is neutral chrome -- no slot carries a danger or accent surface', () => {
  const styles = pageHeadStyles();
  for (const slot of ['root', 'titles', 'title', 'subtitle', 'actions'] as const) {
    assert.doesNotMatch(styles[slot](), /error/, `${slot} paints a danger surface`);
  }
});

test('every slot resolves to a non-empty class string with no variant argument', () => {
  const styles = pageHeadStyles();
  for (const slot of ['root', 'titles', 'title', 'subtitle', 'actions'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});

test('readBreakpoint reads --bp-<name> off the document root and returns it as a number of px', () => {
  forgetBreakpoints();
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

test('containerWidth requires an injection context whether or not it is handed an element to measure', () => {

  assert.throws(() => containerWidth(), /NG0203|injection context/i);
  const elsewhere = new ElementRef(null as unknown as HTMLElement);
  assert.throws(
    () => containerWidth(elsewhere),
    /NG0203|injection context/i,
    'the element is optional and the context is not: DestroyRef disconnects the observer and '
    + 'afterNextRender decides when there is a box to measure, and neither is reachable outside one',
  );
});
